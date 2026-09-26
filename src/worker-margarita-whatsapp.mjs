/*
 * Margarita WhatsApp Bridge V1 — AmarangoElectro
 *
 * Adaptador aislado para WhatsApp Cloud API.
 * No contiene secretos y no modifica el núcleo de Margarita.
 *
 * Flujo:
 * Meta WhatsApp -> este Worker -> Margarita Core -> WhatsApp.
 */

const VERSION = "Margarita WhatsApp Bridge V1";
const DEFAULT_CORE_URL = "https://amara.max-huracan73.workers.dev";
const DEFAULT_GRAPH_VERSION = "v23.0";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const IDEMPOTENCY_TTL_SECONDS = 60 * 60 * 24;
const HISTORY_MAX = 8;
const MAX_WHATSAPP_TEXT = 3500;

const memoriaSesiones = new Map();
const memoriaProcesados = new Map();

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function normalizar(valor) {
  return String(valor || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function limpiarNumero(valor) {
  return String(valor || "").replace(/\D+/g, "");
}

function envPrimero(env, ...nombres) {
  for (const nombre of nombres) {
    const valor = env?.[nombre];
    if (valor !== undefined && valor !== null && String(valor).trim() !== "") return String(valor).trim();
  }
  return "";
}

function numerosAdmin(env) {
  return new Set(
    envPrimero(env, "WHATSAPP_ADMIN_NUMBERS", "WHATSAPP_ALLOWED_NUMBERS", "WHATSAPP_ALLOWED_NUMBER")
      .split(",")
      .map(limpiarNumero)
      .filter(Boolean),
  );
}

function rolExplicito(texto, interactiveId = "") {
  const id = String(interactiveId || "").toLowerCase();
  if (id === "role_cliente") return "cliente";
  if (id === "role_asesor") return "asesor";

  const q = normalizar(texto);
  if (/^(1 |1$|cliente|soy cliente|comprador|soy comprador)$/.test(q)) return "cliente";
  if (/^(2 |2$|asesor|soy asesor|revendedor|soy revendedor|vendedor|soy vendedor)$/.test(q)) return "asesor";
  return "";
}

function referralCodeDesdeTexto(texto) {
  const match = String(texto || "").match(/\b(?:ref|referido|codigo)\s*[:#-]?\s*([A-Z0-9_-]{4,40})\b/i);
  return match ? match[1].toUpperCase() : "";
}

export function extraerEventosWhatsApp(payload) {
  const eventos = [];
  for (const entry of Array.isArray(payload?.entry) ? payload.entry : []) {
    for (const change of Array.isArray(entry?.changes) ? entry.changes : []) {
      const value = change?.value || {};
      for (const message of Array.isArray(value.messages) ? value.messages : []) {
        const interactive = message?.interactive || {};
        const buttonReply = interactive?.button_reply || {};
        const listReply = interactive?.list_reply || {};
        const texto =
          message?.text?.body ||
          buttonReply?.title ||
          listReply?.title ||
          message?.button?.text ||
          "";
        const interactiveId = buttonReply?.id || listReply?.id || message?.button?.payload || "";
        eventos.push({
          id: String(message?.id || ""),
          from: limpiarNumero(message?.from || ""),
          timestamp: String(message?.timestamp || ""),
          type: String(message?.type || ""),
          text: String(texto || "").trim(),
          interactiveId: String(interactiveId || ""),
          referral: message?.referral && typeof message.referral === "object" ? message.referral : null,
          phoneNumberId: String(value?.metadata?.phone_number_id || ""),
        });
      }
    }
  }
  return eventos.filter((e) => e.id && e.from);
}

function atribucionDesdeEvento(evento) {
  const ref = evento.referral || {};
  const codigo = referralCodeDesdeTexto(evento.text);
  return {
    source: ref.source_type ? "WHATSAPP_AD" : "WHATSAPP",
    sourceType: String(ref.source_type || "").slice(0, 80),
    sourceId: String(ref.source_id || "").slice(0, 120),
    sourceUrl: String(ref.source_url || "").slice(0, 500),
    headline: String(ref.headline || "").slice(0, 180),
    referralCode: codigo,
    firstSeenAt: new Date().toISOString(),
  };
}

async function sha256Hex(valor) {
  const bytes = new TextEncoder().encode(String(valor || ""));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sesionAnonimaId(waId) {
  const hash = await sha256Hex(waId);
  return `wa_${hash.slice(0, 24)}`;
}

function sesionVacia() {
  return {
    role: "",
    memoria: {},
    historial: [],
    pendingMessage: "",
    attribution: null,
    updatedAt: Date.now(),
  };
}

function limpiarFallbacks() {
  const ahora = Date.now();
  for (const [key, row] of memoriaSesiones) {
    if (!row || ahora - Number(row.updatedAt || 0) > SESSION_TTL_SECONDS * 1000) memoriaSesiones.delete(key);
  }
  for (const [key, ts] of memoriaProcesados) {
    if (ahora - Number(ts || 0) > IDEMPOTENCY_TTL_SECONDS * 1000) memoriaProcesados.delete(key);
  }
}

async function cargarSesion(env, waId) {
  if (env.MARGARITA_SESSIONS?.get) {
    try {
      const row = await env.MARGARITA_SESSIONS.get(`session:${waId}`, { type: "json" });
      return row && typeof row === "object" ? { ...sesionVacia(), ...row } : sesionVacia();
    } catch (error) {
      console.error("whatsapp_session_read", String(error));
    }
  }
  limpiarFallbacks();
  return { ...sesionVacia(), ...(memoriaSesiones.get(waId) || {}) };
}

async function guardarSesion(env, waId, sesion) {
  const row = { ...sesion, updatedAt: Date.now() };
  if (env.MARGARITA_SESSIONS?.put) {
    try {
      await env.MARGARITA_SESSIONS.put(`session:${waId}`, JSON.stringify(row), {
        expirationTtl: SESSION_TTL_SECONDS,
      });
      return;
    } catch (error) {
      console.error("whatsapp_session_write", String(error));
    }
  }
  memoriaSesiones.set(waId, row);
}

async function yaProcesado(env, messageId) {
  if (env.MARGARITA_SESSIONS?.get) {
    try {
      return Boolean(await env.MARGARITA_SESSIONS.get(`msg:${messageId}`));
    } catch (error) {
      console.error("whatsapp_idempotency_read", String(error));
    }
  }
  limpiarFallbacks();
  return memoriaProcesados.has(messageId);
}

async function marcarProcesando(env, messageId) {
  if (env.MARGARITA_SESSIONS?.put) {
    try {
      await env.MARGARITA_SESSIONS.put(`msg:${messageId}`, "1", {
        expirationTtl: IDEMPOTENCY_TTL_SECONDS,
      });
      return;
    } catch (error) {
      console.error("whatsapp_idempotency_write", String(error));
    }
  }
  memoriaProcesados.set(messageId, Date.now());
}

async function desmarcarProcesando(env, messageId) {
  if (env.MARGARITA_SESSIONS?.delete) {
    try {
      await env.MARGARITA_SESSIONS.delete(`msg:${messageId}`);
      return;
    } catch (error) {
      console.error("whatsapp_idempotency_delete", String(error));
    }
  }
  memoriaProcesados.delete(messageId);
}

function hexBytes(hex) {
  if (!/^[a-f0-9]{64}$/i.test(String(hex || ""))) return null;
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i += 1) bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

export async function verificarFirmaMeta(request, appSecret) {
  const header = String(request.headers.get("x-hub-signature-256") || "");
  if (!appSecret || !header.startsWith("sha256=")) return false;
  const firma = hexBytes(header.slice(7));
  if (!firma) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(String(appSecret)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  return crypto.subtle.verify("HMAC", key, firma, await request.clone().arrayBuffer());
}

function graphEndpoint(env) {
  const version = envPrimero(env, "META_GRAPH_API_VERSION", "WHATSAPP_GRAPH_VERSION") || DEFAULT_GRAPH_VERSION;
  const phoneId = envPrimero(env, "META_WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_PHONE_NUMBER_ID");
  return `https://graph.facebook.com/${String(version).replace(/^\/?/, "")}/${phoneId}/messages`;
}

async function enviarPayloadWhatsApp(env, payload) {
  const token = envPrimero(env, "META_WHATSAPP_ACCESS_TOKEN", "WHATSAPP_ACCESS_TOKEN");
  const phoneId = envPrimero(env, "META_WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_PHONE_NUMBER_ID");
  if (!token || !phoneId) throw new Error("Faltan credenciales de WhatsApp Cloud API");

  const response = await fetch(graphEndpoint(env), {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 800);
    throw new Error(`Meta WhatsApp ${response.status}: ${detail}`);
  }
  return response;
}

async function enviarTexto(env, to, texto) {
  const limpio = String(texto || "").trim();
  if (!limpio) return;
  for (let i = 0; i < limpio.length; i += MAX_WHATSAPP_TEXT) {
    const parte = limpio.slice(i, i + MAX_WHATSAPP_TEXT);
    await enviarPayloadWhatsApp(env, {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { preview_url: false, body: parte },
    });
  }
}

async function enviarSelectorRol(env, to) {
  await enviarPayloadWhatsApp(env, {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: "¡Hola! Soy Margarita de AmarangoElectro 🐝 Antes de seguir, ¿sos cliente o asesor?" },
      action: {
        buttons: [
          { type: "reply", reply: { id: "role_cliente", title: "Soy cliente" } },
          { type: "reply", reply: { id: "role_asesor", title: "Soy asesor" } },
        ],
      },
    },
  });
}

function respuestaWhatsApp(data, role) {
  let texto = String(data?.respuesta || "").trim();
  if (role === "asesor" && String(data?.mensaje_copiable || "").trim()) {
    texto += `\n\n📋 Mensaje listo para copiar:\n${String(data.mensaje_copiable).trim()}`;
  }
  return texto || "Estoy acá 😊 ¿En qué te ayudo?";
}

async function llamarMargarita(env, evento, sesion, mensaje) {
  const rol = sesion.role === "asesor" ? "asesor" : sesion.role === "admin" ? "admin" : "cliente";
  const sessionId = await sesionAnonimaId(evento.from);
  const core = envPrimero(env, "MARGARITA_CORE_URL") || DEFAULT_CORE_URL;
  const response = await fetch(`${String(core).replace(/\/$/, "")}/`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      mensaje,
      historial: Array.isArray(sesion.historial) ? sesion.historial.slice(-HISTORY_MAX) : [],
      memoria: sesion.memoria && typeof sesion.memoria === "object" ? sesion.memoria : {},
      contexto: {
        integrado: true,
        rol,
        sesion_id: sessionId,
        canal: "whatsapp",
        source: sesion.attribution?.source || "WHATSAPP",
        referralCode: sesion.attribution?.referralCode || "",
      },
    }),
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Margarita Core devolvió una respuesta inválida (${response.status})`);
  }
  if (!response.ok) throw new Error(data?.error || `Margarita Core ${response.status}`);
  return data;
}

async function procesarEvento(env, evento) {
  if (await yaProcesado(env, evento.id)) return;
  await marcarProcesando(env, evento.id);

  try {
    const sesion = await cargarSesion(env, evento.from);
    if (!sesion.attribution) sesion.attribution = atribucionDesdeEvento(evento);
    if (!sesion.attribution?.referralCode) {
      const codigo = referralCodeDesdeTexto(evento.text);
      if (codigo) sesion.attribution = { ...(sesion.attribution || {}), referralCode: codigo };
    }

    if (numerosAdmin(env).has(evento.from)) sesion.role = "admin";

    const rolElegido = rolExplicito(evento.text, evento.interactiveId);
    if (!sesion.role && !rolElegido) {
      if (evento.text) sesion.pendingMessage = evento.text;
      await guardarSesion(env, evento.from, sesion);
      await enviarSelectorRol(env, evento.from);
      return;
    }

    if (!sesion.role && rolElegido) sesion.role = rolElegido;

    let mensaje = evento.text;
    if (rolElegido && sesion.pendingMessage) {
      mensaje = sesion.pendingMessage;
      sesion.pendingMessage = "";
    } else if (rolElegido && !sesion.pendingMessage && normalizar(evento.text).length <= 20) {
      await guardarSesion(env, evento.from, sesion);
      await enviarTexto(
        env,
        evento.from,
        sesion.role === "asesor"
          ? "Perfecto 🤝 Soy Margarita. Decime tu nombre y después contame qué te pidió tu cliente."
          : "Perfecto 😊 Soy Margarita. Contame qué estás buscando y te ayudo.",
      );
      return;
    }

    if (!mensaje) {
      await guardarSesion(env, evento.from, sesion);
      await enviarTexto(env, evento.from, "Por ahora necesito que me escribas el mensaje en texto 😊 Así puedo ayudarte sin perder información.");
      return;
    }

    const data = await llamarMargarita(env, evento, sesion, mensaje);
    const respuesta = respuestaWhatsApp(data, sesion.role);

    sesion.memoria = data?.memoria && typeof data.memoria === "object" ? data.memoria : sesion.memoria || {};
    sesion.historial = [
      ...(Array.isArray(sesion.historial) ? sesion.historial : []),
      { rol: "cliente", texto: String(mensaje).slice(0, 1800) },
      { rol: "amara", texto: respuesta.slice(0, 1800) },
    ].slice(-HISTORY_MAX);

    await guardarSesion(env, evento.from, sesion);
    await enviarTexto(env, evento.from, respuesta);
  } catch (error) {
    await desmarcarProcesando(env, evento.id);
    console.error("whatsapp_process", evento.id, String(error));
    try {
      await enviarTexto(env, evento.from, "Tuve un inconveniente técnico. Probá de nuevo en unos minutos 🙏");
    } catch (sendError) {
      console.error("whatsapp_fallback_send", String(sendError));
    }
  }
}

async function procesarWebhook(env, payload) {
  const eventos = extraerEventosWhatsApp(payload);
  for (const evento of eventos) await procesarEvento(env, evento);
}

function health(env) {
  const estado = {
    version: VERSION,
    worker: "conectado",
    verify_token: Boolean(envPrimero(env, "META_VERIFY_TOKEN", "WHATSAPP_VERIFY_TOKEN")),
    app_secret: Boolean(envPrimero(env, "META_APP_SECRET", "WHATSAPP_APP_SECRET")),
    access_token: Boolean(envPrimero(env, "META_WHATSAPP_ACCESS_TOKEN", "WHATSAPP_ACCESS_TOKEN")),
    phone_number_id: Boolean(envPrimero(env, "META_WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_PHONE_NUMBER_ID")),
    margarita_core: envPrimero(env, "MARGARITA_CORE_URL") || DEFAULT_CORE_URL,
    sesiones: env.MARGARITA_SESSIONS ? "kv" : "memoria_temporal",
  };
  estado.listo = estado.verify_token && estado.app_secret && estado.access_token && estado.phone_number_id;
  return estado;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      const estado = health(env);
      return json(estado, estado.listo ? 200 : 503);
    }

    const webhookPath = url.pathname === "/webhooks/whatsapp" || url.pathname === "/";

    if (request.method === "GET" && webhookPath) {
      const mode = url.searchParams.get("hub.mode") || "";
      const token = url.searchParams.get("hub.verify_token") || "";
      const challenge = url.searchParams.get("hub.challenge") || "";
      if (mode === "subscribe" && token && token === envPrimero(env, "META_VERIFY_TOKEN", "WHATSAPP_VERIFY_TOKEN")) {
        return new Response(challenge, { status: 200, headers: { "content-type": "text/plain; charset=utf-8" } });
      }
      if (mode || token || challenge) return new Response("Forbidden", { status: 403 });
      return json({ version: VERSION, webhook: "/webhooks/whatsapp", health: "/health" });
    }

    if (request.method === "POST" && webhookPath) {
      const appSecret = envPrimero(env, "META_APP_SECRET", "WHATSAPP_APP_SECRET");
      if (!appSecret) return json({ error: "META_APP_SECRET no configurado" }, 503);
      if (!(await verificarFirmaMeta(request, appSecret))) return json({ error: "firma inválida" }, 401);

      let payload;
      try {
        payload = await request.json();
      } catch {
        return json({ error: "json inválido" }, 400);
      }

      const trabajo = procesarWebhook(env, payload);
      if (ctx?.waitUntil) ctx.waitUntil(trabajo);
      else await trabajo;
      return json({ received: true });
    }

    return new Response("Not found", { status: 404 });
  },
};
