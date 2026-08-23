import base from "./worker.mjs";

const PRO_UX_HEAD = `
<link rel="stylesheet" href="/professional-ux.css?v=20260823-2">
<link rel="stylesheet" href="/professional-dialogs.css?v=20260823-1">
<link rel="stylesheet" href="/professional-touch.css?v=20260823-2">
`;

const PRO_UX_BODY = `
<script src="/professional-ux.js?v=20260823-1" defer></script>
<script src="/professional-dialogs.js?v=20260823-1" defer></script>
<script src="/margarita-teaser.js?v=20260823-1" defer></script>
<script src="/margarita-product-cards.js?v=20260823-1" defer></script>
<script src="/margarita-visual-tune.js?v=20260823-3" defer></script>
`;

const MARGARITA_RESCUE_PROMPT = `
Sos Margarita 🐝, asistente de AmarangoElectro.
Hablás en español argentino, natural, cálido, breve y resolutivo.
Nunca inventes productos, precios, características, stock ni enlaces.
Usá únicamente PRODUCTOS REALES recibidos en el pedido.
Si el usuario pide productos, ofrecé hasta 3 opciones relevantes y concretas.
Cuando ofrezcas un producto, incluí también SU URL EXACTA recibida en PRODUCTOS REALES; la interfaz la usa para armar la ficha visual.
Si no hay un producto real que coincida claramente con lo pedido, no muestres productos de otro rubro. Decí que no figura disponible en la tienda y ofrecé consultar al equipo de AmarangoElectro porque quizá puedan conseguirlo por pedido, sin prometerlo.
No expongas costos, mayoristas ni información interna a clientes o asesores.
Margarita no cobra ni envía links de pago; los pagos se coordinan con Maxi o Angie.
Para admin podés responder de forma más operativa. Para clientes, mantené la respuesta simple y comercial.
No repitas saludos si la conversación ya empezó.
`;

const TEMAS_MARGARITA = {
  audio: { con: "los parlantes", pregunta: "¿Las estufas o lo anterior lo dejamos para después?" },
  calefaccion: { con: "las estufas", pregunta: "¿Lo anterior lo dejamos para después?" },
  celulares: { con: "los celulares", pregunta: "¿Lo anterior lo dejamos para después?" },
  tv: { con: "los televisores", pregunta: "¿Lo anterior lo dejamos para después?" },
  refrigeracion: { con: "las heladeras", pregunta: "¿Lo anterior lo dejamos para después?" },
  coccion: { con: "cocina", pregunta: "¿Lo anterior lo dejamos para después?" },
  lavado: { con: "lavado", pregunta: "¿Lo anterior lo dejamos para después?" },
  climatizacion: { con: "climatización", pregunta: "¿Lo anterior lo dejamos para después?" },
  herramientas: { con: "herramientas", pregunta: "¿Lo anterior lo dejamos para después?" },
  colchones: { con: "colchones", pregunta: "¿Lo anterior lo dejamos para después?" },
  muebles: { con: "muebles", pregunta: "¿Lo anterior lo dejamos para después?" },
  cargadores: { con: "cargadores y accesorios", pregunta: "¿Lo anterior lo dejamos para después?" },
};

const PREGUNTA_ANTERIOR = {
  audio: "¿Lo de los parlantes lo dejamos para después?",
  calefaccion: "¿Lo de las estufas lo dejamos para después?",
  celulares: "¿Lo de los celulares lo dejamos para después?",
  tv: "¿Lo de los televisores lo dejamos para después?",
  refrigeracion: "¿Lo de las heladeras lo dejamos para después?",
  coccion: "¿Lo de cocina lo dejamos para después?",
  lavado: "¿Lo de lavado lo dejamos para después?",
  climatizacion: "¿Lo de climatización lo dejamos para después?",
  herramientas: "¿Lo de las herramientas lo dejamos para después?",
  colchones: "¿Lo de los colchones lo dejamos para después?",
  muebles: "¿Lo de los muebles lo dejamos para después?",
  cargadores: "¿Lo de los cargadores lo dejamos para después?",
};

function aplicarUxProfesional(response) {
  const tipo = String(response.headers.get("content-type") || "").toLowerCase();
  if (!tipo.includes("text/html")) return response;
  return new HTMLRewriter()
    .on("head", {
      element(el) {
        el.append(PRO_UX_HEAD, { html: true });
      },
    })
    .on("body", {
      element(el) {
        el.append(PRO_UX_BODY, { html: true });
      },
    })
    .transform(response);
}

function json(datos, status = 200) {
  return new Response(JSON.stringify(datos), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

function textoRespuesta(data) {
  return String(data && data.respuesta || "").trim();
}

function esFallaConexionMargarita(data) {
  const t = textoRespuesta(data).toLowerCase();
  return !t ||
    t.includes("no pude conectarme ahora") ||
    t.includes("no pude responderte ahora") ||
    t.includes("descansando un momento");
}

function esBloqueoServicio(data) {
  const t = textoRespuesta(data).toLowerCase();
  return t.includes("fuera de horario") || t.includes("margarita está desactivada") || t.includes("margarita esta desactivada");
}

function limpiarProductos(valor) {
  if (!Array.isArray(valor)) return [];
  return valor.slice(0, 12).map((p) => ({
    nombre: String(p && p.nombre || "").slice(0, 180),
    categoria: String(p && p.categoria || "").slice(0, 90),
    precio: Number(p && p.precio || 0),
    caracteristicas: String(p && p.caracteristicas || "").slice(0, 260),
    url: String(p && p.url || "").slice(0, 500),
  })).filter((p) => p.nombre && p.precio > 0);
}

function charlaPlana(mensajes) {
  if (!Array.isArray(mensajes)) return "";
  return mensajes.slice(-8).map((m) => {
    const quien = m && m.rol === "margarita" ? "Margarita" : "Usuario";
    return `${quien}: ${String(m && m.texto || "").slice(0, 900)}`;
  }).filter(Boolean).join("\n");
}

function promptRescate(body, productos) {
  const rol = String(body && body.rol || "cliente").slice(0, 20);
  const nombre = String(body && body.nombre || "").slice(0, 40);
  const conversacion = charlaPlana(body && body.mensajes);
  const cambio = body && body.cambioTema && typeof body.cambioTema === "object"
    ? `Cambio de rubro: ${String(body.cambioTema.anterior || "")} -> ${String(body.cambioTema.nuevo || "")}`
    : "Sin cambio de rubro marcado.";
  const listado = productos.length
    ? productos.map((p, i) => `${i + 1}. ${p.nombre} | ${p.categoria} | $${Math.round(p.precio)} | ${p.caracteristicas || "sin detalle"} | ${p.url || "sin enlace"}`).join("\n")
    : "Sin candidatos reales.";
  return `ROL: ${rol}\nNOMBRE: ${nombre || "sin identificar"}\n${cambio}\n\nCONVERSACIÓN:\n${conversacion || "sin historial"}\n\nPRODUCTOS REALES:\n${listado}\n\nRespondé al último mensaje del usuario.`;
}

async function rescatarConGemini(body, env) {
  const key = String(env.GEMINI_API_KEY || "").trim();
  if (!key) return null;
  const productos = limpiarProductos(body && body.productos);
  try {
    const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": key,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: MARGARITA_RESCUE_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: promptRescate(body, productos) }] }],
        generationConfig: {
          maxOutputTokens: 700,
          thinkingConfig: { thinkingLevel: "low" },
        },
      }),
    });
    const data = await r.json();
    const texto = data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;
    if (!r.ok || !texto) return null;
    return String(texto).trim();
  } catch {
    return null;
  }
}

function dinero(n) {
  try {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(Number(n) || 0);
  } catch {
    return `$${Math.round(Number(n) || 0)}`;
  }
}

function mensajeNoDisponible() {
  return "Ese producto no me figura disponible en la tienda ahora 🐝 Si querés, consultalo con el equipo de AmarangoElectro porque quizá lo puedan conseguir por pedido. No te lo puedo asegurar hasta que el equipo lo confirme.";
}

function fallbackCatalogo(body) {
  const productos = limpiarProductos(body && body.productos).slice(0, 3);
  if (!productos.length) return mensajeNoDisponible();
  const lineas = productos.map((p) => `• ${p.nombre} — ${dinero(p.precio)}${p.url ? `\n${p.url}` : ""}`);
  return `Sí 🐝 Encontré estas opciones en la tienda:\n${lineas.join("\n")}\n¿Querés que te compare las 3 o te pase la más conveniente?`;
}

function fraseTransicion(body) {
  const cambio = body && body.cambioTema;
  if (!cambio || typeof cambio !== "object") return "";
  const anterior = String(cambio.anterior || "");
  const nuevo = String(cambio.nuevo || "");
  if (!anterior || !nuevo || anterior === nuevo) return "";
  const temaNuevo = TEMAS_MARGARITA[nuevo];
  const con = temaNuevo && temaNuevo.con ? temaNuevo.con : "eso nuevo";
  const pregunta = PREGUNTA_ANTERIOR[anterior] || "¿Lo anterior lo dejamos para después?";
  return `Dale 👍, vamos con ${con}. ${pregunta}`;
}

function agregarTransicion(texto, body) {
  const transicion = fraseTransicion(body);
  const limpio = String(texto || "").trim();
  if (!transicion || !limpio) return limpio;
  if (limpio.startsWith(transicion)) return limpio;
  return `${transicion}\n\n${limpio}`;
}

async function aplicarRescateMargarita(request, response, env) {
  const url = new URL(request.url);
  if (request.method !== "POST" || url.pathname !== "/api/margarita") return response;

  let body;
  try { body = await request.clone().json(); }
  catch { body = {}; }

  let data;
  try { data = await response.clone().json(); }
  catch { return response; }

  if (esBloqueoServicio(data)) return response;

  const sinCoincidencias = body && body.sinCoincidencias === true;
  if (sinCoincidencias) {
    return json({ ...data, respuesta: agregarTransicion(mensajeNoDisponible(), body), sin_coincidencias: true }, 200);
  }

  if (esFallaConexionMargarita(data)) {
    const texto = await rescatarConGemini(body, env);
    if (texto) {
      return json({ ...data, respuesta: agregarTransicion(texto, body), recuperada: true, modelo: "gemini-3.7-flash" }, 200);
    }
    return json({ ...data, respuesta: agregarTransicion(fallbackCatalogo(body), body), recuperada: true, fallback_catalogo: true }, 200);
  }

  const original = textoRespuesta(data);
  const final = agregarTransicion(original, body);
  if (final === original) return response;
  return json({ ...data, respuesta: final, cambio_tema: true }, 200);
}

export default {
  async fetch(request, env, ctx) {
    const requestBackup = request.clone();
    const response = await base.fetch(request, env, ctx);
    const rescatada = await aplicarRescateMargarita(requestBackup, response, env);
    if (request.method === "GET") return aplicarUxProfesional(rescatada);
    return rescatada;
  },
  async scheduled(controller, env, ctx) {
    if (base && typeof base.scheduled === "function") {
      return base.scheduled(controller, env, ctx);
    }
  },
};
