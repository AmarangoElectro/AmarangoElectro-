const ROW_CLIENTES = "clientes_tienda";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

function limpiarNombre(v, max = 90) {
  return String(v || "").trim().replace(/\s+/g, " ").slice(0, max);
}

function normalizarNombre(v) {
  return limpiarNombre(v).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function telefonoDigitos(v) {
  return String(v || "").replace(/\D+/g, "").slice(-15);
}

function telefonoClave(v) {
  let d = telefonoDigitos(v);
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("54")) d = d.slice(2);
  if (d.length > 10) d = d.slice(-10);
  return d;
}

function headersPrivados(env) {
  const url = String(env.SUPABASE_URL || "").replace(/\/$/, "");
  const key = String(env.SUPABASE_SECRET_KEY || "").trim();
  if (!url || !key) return null;
  return {
    url,
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
  };
}

async function leerClientes(env) {
  const cfg = headersPrivados(env);
  if (!cfg) throw new Error("cliente_identity_not_configured");
  const r = await fetch(`${cfg.url}/rest/v1/tienda_catalogo?id=eq.${ROW_CLIENTES}&select=datos`, { headers: cfg.headers });
  if (!r.ok) throw new Error(`supabase_read_${r.status}`);
  const filas = await r.json();
  const datos = Array.isArray(filas) && filas[0] && Array.isArray(filas[0].datos) ? filas[0].datos : [];
  return { cfg, lista: datos };
}

async function guardarClientes(cfg, lista) {
  const r = await fetch(`${cfg.url}/rest/v1/tienda_catalogo?on_conflict=id`, {
    method: "POST",
    headers: { ...cfg.headers, prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ id: ROW_CLIENTES, datos: lista, actualizado: new Date().toISOString() }),
  });
  if (!r.ok) throw new Error(`supabase_write_${r.status}`);
}

function publico(c) {
  if (!c) return null;
  return {
    id: String(c.id || "").slice(0, 80),
    nombre: limpiarNombre(c.nombre),
    apodo: limpiarNombre(c.apodo, 32),
    telefono: telefonoDigitos(c.telefono || c.tel),
    nombrePreferidoConfirmado: c.nombrePreferidoConfirmado === true,
    aceptaPromos: c.aceptaPromos === true,
    regaloPendiente: c.regaloPendiente === true,
    regaloDescripcion: limpiarNombre(c.regaloDescripcion, 120),
    clienteTibio: c.clienteTibio === true,
  };
}

function encontrar(lista, telefono, nombre = "") {
  const tk = telefonoClave(telefono);
  const nn = normalizarNombre(nombre);
  if (tk) {
    const porTel = lista.find((c) => telefonoClave(c && (c.telefono || c.tel)) === tk);
    if (porTel) return porTel;
  }
  if (nn) return lista.find((c) => normalizarNombre(c && c.nombre) === nn) || null;
  return null;
}

function nuevoId(telefono) {
  return `tel-${telefonoClave(telefono) || Date.now().toString(36)}`;
}

export async function servirIdentidadCliente(request, env) {
  if (request.method !== "POST") return json({ ok: false, error: "Método no permitido" }, 405);
  let body;
  try { body = await request.json(); }
  catch { return json({ ok: false, error: "Pedido inválido" }, 400); }

  const accion = String(body && body.accion || "").toLowerCase();
  const telefono = telefonoDigitos(body && (body.telefono || body.cliente?.telefono));
  if (telefonoClave(telefono).length < 8) return json({ ok: false, error: "Celular inválido" }, 400);

  try {
    const { cfg, lista } = await leerClientes(env);

    if (accion === "buscar") {
      const encontrado = encontrar(lista, telefono);
      return json({ ok: true, encontrado: !!encontrado, cliente: publico(encontrado) });
    }

    if (accion === "registrar" || accion === "actualizar") {
      const entrada = body && body.cliente && typeof body.cliente === "object" ? body.cliente : {};
      const nombre = limpiarNombre(entrada.nombre);
      const apodo = limpiarNombre(entrada.apodo, 32);
      if (accion === "registrar" && nombre.length < 3) return json({ ok: false, error: "Nombre inválido" }, 400);

      let i = lista.findIndex((c) => telefonoClave(c && (c.telefono || c.tel)) === telefonoClave(telefono));
      if (i < 0 && nombre) i = lista.findIndex((c) => normalizarNombre(c && c.nombre) === normalizarNombre(nombre));
      const previo = i >= 0 ? lista[i] : {};
      const esAltaNueva = i < 0 && accion === "registrar";
      const ahora = new Date().toISOString();

      // El regalo no depende del monto de compra: queda pendiente para el primer cierre.
      // El equipo define el obsequio concreto según el producto comprado.
      const regaloPendiente = esAltaNueva
        ? true
        : (typeof entrada.regaloPendiente === "boolean" ? entrada.regaloPendiente : previo.regaloPendiente === true);

      const reg = {
        ...previo,
        id: previo.id || nuevoId(telefono),
        nombre: nombre || previo.nombre || "",
        apodo: apodo || previo.apodo || "",
        telefono,
        nombrePreferidoConfirmado: entrada.nombrePreferidoConfirmado === true || previo.nombrePreferidoConfirmado === true,
        aceptaPromos: typeof entrada.aceptaPromos === "boolean" ? entrada.aceptaPromos : previo.aceptaPromos === true,
        consentimientoWhatsAppFecha: entrada.aceptaPromos === true
          ? (previo.consentimientoWhatsAppFecha || ahora)
          : (entrada.aceptaPromos === false ? "" : (previo.consentimientoWhatsAppFecha || "")),
        regaloPendiente,
        regaloDescripcion: previo.regaloDescripcion || "Obsequio acorde al producto de la primera compra",
        regaloCondicion: previo.regaloCondicion || "primera_compra_sin_minimo",
        clienteTibio: esAltaNueva ? true : (typeof entrada.clienteTibio === "boolean" ? entrada.clienteTibio : previo.clienteTibio === true),
        origenRegistro: previo.origenRegistro || String(entrada.origenRegistro || entrada.origenAlta || "registro_web").slice(0, 50),
        fechaRegistroWeb: previo.fechaRegistroWeb || (esAltaNueva ? ahora : ""),
        origenAlta: previo.origenAlta || String(entrada.origenAlta || "margarita_cliente").slice(0, 40),
        creado: previo.creado || ahora,
        actualizado: ahora,
      };

      if (i >= 0) lista[i] = reg; else lista.push(reg);
      await guardarClientes(cfg, lista.slice(-5000));
      return json({ ok: true, cliente: publico(reg) });
    }

    return json({ ok: false, error: "Acción inválida" }, 400);
  } catch (e) {
    const noConfig = String(e && e.message || "").includes("not_configured");
    return json({ ok: false, error: noConfig ? "Identificación de clientes no configurada" : "No se pudo consultar el registro" }, noConfig ? 503 : 502);
  }
}