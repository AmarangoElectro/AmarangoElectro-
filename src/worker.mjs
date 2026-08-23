import { ejecutarSincronizacionProgramadaSegura } from "./proveedores-sync.mjs";

const HOSTS_IMAGEN_PERMITIDOS = new Set(["cdn.catalog-store.link"]);
const TIPOS_IMAGEN_PERMITIDOS = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_IMAGEN_BYTES = 5 * 1024 * 1024;

function json(datos, estado = 200) {
  return new Response(JSON.stringify(datos), {
    status: estado,
    headers: {"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"},
  });
}

async function servirImagenProveedor(request) {
  const pedido = new URL(request.url);
  let origenUrl;
  try { origenUrl = new URL(pedido.searchParams.get("url") || ""); }
  catch { return json({ok:false,error:"URL de imagen inválida"},400); }
  if (origenUrl.protocol !== "https:" || !HOSTS_IMAGEN_PERMITIDOS.has(origenUrl.hostname))
    return json({ok:false,error:"Origen de imagen no permitido"},403);
  try {
    const origen = await fetch(origenUrl.toString(), {headers:{accept:"image/avif,image/webp,image/png,image/jpeg,image/*"}});
    if (!origen.ok) return json({ok:false,error:"No se pudo descargar la imagen"},502);
    const tipo = String(origen.headers.get("content-type")||"").split(";")[0].trim().toLowerCase();
    if (!TIPOS_IMAGEN_PERMITIDOS.has(tipo)) return json({ok:false,error:"El archivo recibido no es una imagen válida"},415);
    const largo = Number(origen.headers.get("content-length")||0);
    if (largo > MAX_IMAGEN_BYTES) return json({ok:false,error:"La imagen supera el tamaño permitido"},413);
    const bytes = await origen.arrayBuffer();
    if (!bytes.byteLength || bytes.byteLength > MAX_IMAGEN_BYTES) return json({ok:false,error:"La imagen supera el tamaño permitido"},413);
    return new Response(bytes,{status:200,headers:{"content-type":tipo,"cache-control":"public, max-age=3600, s-maxage=86400","x-content-type-options":"nosniff"}});
  } catch { return json({ok:false,error:"No se pudo preparar la imagen"},502); }
}

const CEREBRO_MARGARITA = `
Sos MARGARITA 🐝, la asistente inteligente de AmarangoElectro.
Hablás en español argentino, natural, cálido, breve y resolutivo. Tu objetivo es SERVIR, orientar y ayudar a vender sin presionar.

IDENTIDAD Y TONO
- Tu nombre visible es Margarita.
- Usá "servir" con naturalidad, especialmente con clientes: "¿En qué te puedo servir?".
- No seas agresiva ni robótica. Hacé preguntas cortas y útiles, una o dos por vez.
- Entendé abreviaturas, errores de escritura, mensajes incompletos y continuaciones como "pasame 3", "algo más barato", "tenés otro", "uno de 50".
- No repitas saludos ni el nombre en cada mensaje.

ROLES
Vas a recibir un CONTEXTO DE ROL confiable desde la tienda:
1) CLIENTE:
   - Ayudalo a descubrir qué necesita, compará y recomendá hasta 3 opciones reales.
   - Vendé por beneficios y uso, no sólo por especificaciones.
   - Si recién empieza la charla, preguntá: "¿En qué te puedo servir hoy? 🐝"
   - Si pide algo ambiguo, preguntá lo mínimo necesario antes de recomendar.
2) ASESOR:
   - Tratálo como parte del equipo, con energía de jefa buena onda.
   - Ayudalo a encontrar productos, comparar, responder objeciones y elegir qué ofrecer.
   - Motivá de vez en cuando, sin repetir siempre frases: "Vamos, hagamos que las cosas pasen chicos 😉".
   - Nunca inventes un argumento técnico que no esté respaldado por el producto.
3) ADMIN:
   - Ayudá con productos, categorías, faltantes y el RESUMEN OPERATIVO recibido.
   - Si el admin se identifica como Maxi y SALUDO_ESPECIAL_PENDIENTE=true: saludá una sola vez con algo como "¡Maxi! ¿Todo bien? 🐝".
   - Si se identifica como Angie y SALUDO_ESPECIAL_PENDIENTE=true: saludá una sola vez con algo como "¡Hola Angie! ¿Cómo estás? 🐝".
   - Después seguí normal, sin volver a repetir ese saludo especial.
   - Podés dar informes basados exclusivamente en RESUMEN OPERATIVO y PRODUCTOS DISPONIBLES.

CATÁLOGO Y CATEGORÍAS
- La búsqueda se hace contra TODA la tienda y te llega una selección de candidatos reales para la consulta.
- CELULARES también forman parte de la tienda aunque se administren en una lista separada.
- Usá la TAXONOMÍA REAL recibida. Categorías equivalentes pueden aparecer con nombres históricos, por ejemplo TV/TV y video, Heladeras/Refrigeración, Cocina/Cocción.
- Si alguien pide "parlante", "torre", "home theater", "soundbar", "barra de sonido" o similar, entendé intención AUDIO.
- Si pide "cargador", mantené el foco en cargadores/accesorios de celular. Preguntá marca/modelo del teléfono si hace falta; NO le ofrezcas un celular sólo por haber preguntado qué modelo tiene.
- Si pide una medida/modelo exacto y no aparece, podés mostrar alternativas cercanas SOLO si están en PRODUCTOS DISPONIBLES, diciendo claramente que son alternativas.
- En una continuación ("pasame 3", "más barato", "otro") conservá el tema anterior.

REGLAS DE DATOS — OBLIGATORIAS
- NUNCA inventes producto, modelo, precio, color, capacidad, potencia, stock, característica, cuota ni enlace.
- Sólo podés nombrar productos incluidos en PRODUCTOS DISPONIBLES.
- Si no hay candidatos reales suficientes, decí: "No encuentro ese producto en este momento." y ofrecé buscar una alternativa.
- No expongas costo, mayorista, proveedor interno ni datos administrativos a clientes o asesores.
- No prometas stock. Los candidatos ya vienen filtrados por disponibilidad visible, pero igual hablá como "figura disponible" o "conviene confirmar".
- Los precios se actualizan seguido: sugerí confirmar antes de cerrar.

VENTA Y CUOTAS
- Cuando ya entendiste la necesidad, ofrecé hasta 3 opciones.
- Mostrá primero la opción más adecuada; después una alternativa más económica o superior si sirve.
- Si recibís precio contado, podés calcular:
  2 cuotas = contado +15%
  4 cuotas = contado +55%
  6 cuotas = contado +80%
  Total financiado dividido por cantidad de cuotas.
- Nunca inventes cuotas si no recibiste un precio válido.
- Margarita NO cobra, NO envía links de pago y NO recibe pagos.
- El cierre final, pagos y confirmaciones se derivan al equipo. Los pagos válidos se coordinan únicamente con Maxi o Angie.

RESPUESTAS
- Cliente: idealmente 2 a 5 líneas, salvo que pida comparación detallada.
- Asesor/admin: podés ser más operativo, con bullets cortos si ayuda.
- Si hay enlaces de producto, usá únicamente los recibidos.
- Mantené el foco de la conversación y no mezcles categorías sin motivo.
`;

function limpiarMensajes(valor) {
  if (!Array.isArray(valor)) return [];
  return valor.slice(-14).map((m)=>({
    role: m && m.rol === "margarita" ? "model" : "user",
    parts: [{text:String((m&&m.texto)||"").slice(0,1600)}],
  })).filter((m)=>m.parts[0].text);
}

function limpiarProductos(valor) {
  if (!Array.isArray(valor)) return [];
  return valor.slice(0,42).map((p)=>({
    id:String((p&&p.id)||"").slice(0,90),
    nombre:String((p&&p.nombre)||"").slice(0,180),
    categoria:String((p&&p.categoria)||"").slice(0,90),
    precio:Number((p&&p.precio)||0),
    caracteristicas:String((p&&p.caracteristicas)||"").slice(0,280),
    url:String((p&&p.url)||"").slice(0,500),
  })).filter((p)=>p.nombre && p.precio>0 && /^https:\/\//.test(p.url));
}

function limpiarRol(valor) {
  const r=String(valor||"cliente").toLowerCase();
  return r==="admin"||r==="asesor" ? r : "cliente";
}

function limpiarNombre(valor) {
  const n=String(valor||"").trim().slice(0,40);
  if (/^maxi(?:miliano)?$/i.test(n)) return "Maxi";
  if (/^(?:angie|angela|ángela)$/i.test(n)) return "Angie";
  return n.replace(/[<>]/g,"");
}

function limpiarResumen(valor) {
  if (!valor || typeof valor !== "object") return {};
  const categorias=Array.isArray(valor.categorias)
    ? valor.categorias.slice(0,40).map((c)=>({nombre:String(c&&c.nombre||"").slice(0,90),cantidad:Number(c&&c.cantidad||0)}))
    : [];
  return {
    total:Number(valor.total||0),
    disponibles:Number(valor.disponibles||0),
    ocultos:Number(valor.ocultos||0),
    sinStock:Number(valor.sinStock||0),
    pendientesImagen:Number(valor.pendientesImagen||0),
    preciosDesactualizados:Number(valor.preciosDesactualizados||0),
    duplicados:Number(valor.duplicados||0),
    categorias,
  };
}

async function servirMargarita(request, env) {
  if (request.method !== "POST") return json({error:"Método no permitido"},405);
  if (!env.GEMINI_API_KEY) return json({respuesta:"Margarita está descansando un momento 🐝 Probá nuevamente en unos minutos."},200);

  let body;
  try { body=await request.json(); } catch { return json({error:"Pedido inválido"},400); }

  const mensajes=limpiarMensajes(body.mensajes);
  const productos=limpiarProductos(body.productos);
  const rol=limpiarRol(body.rol);
  const nombre=limpiarNombre(body.nombre);
  const resumen=limpiarResumen(body.resumen);
  const taxonomia=Array.isArray(body.taxonomia)
    ? body.taxonomia.slice(0,40).map((x)=>String(x||"").slice(0,90)).filter(Boolean)
    : [];
  const saludoPendiente=body.saludoEspecialPendiente===true;

  const contexto = [
    `CONTEXTO DE ROL: ${rol}`,
    `NOMBRE DE SESIÓN: ${nombre || "no informado"}`,
    `SALUDO_ESPECIAL_PENDIENTE: ${saludoPendiente ? "true" : "false"}`,
    `TAXONOMÍA REAL DE LA TIENDA: ${JSON.stringify(taxonomia)}`,
    `RESUMEN OPERATIVO: ${JSON.stringify(resumen)}`,
    `PRODUCTOS DISPONIBLES PARA ESTA CONSULTA (lista cerrada; no inventar): ${JSON.stringify(productos)}`
  ].join("\n");

  const contents=mensajes.length?mensajes:[{role:"user",parts:[{text:"Hola"}]}];
  contents[contents.length-1].parts[0].text += "\n\n"+contexto;

  try {
    const respuesta=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",{
      method:"POST",
      headers:{"content-type":"application/json","x-goog-api-key":env.GEMINI_API_KEY},
      body:JSON.stringify({
        systemInstruction:{parts:[{text:CEREBRO_MARGARITA}]},
        contents,
        generationConfig:{temperature:0.28,maxOutputTokens:700}
      }),
    });
    const data=await respuesta.json();
    const texto=data&&data.candidates&&data.candidates[0]&&data.candidates[0].content&&data.candidates[0].content.parts&&data.candidates[0].content.parts[0]&&data.candidates[0].content.parts[0].text;
    if (!respuesta.ok || !texto) return json({respuesta:"No pude conectarme ahora 🐝 Probá de nuevo en un ratito."},200);
    return json({respuesta:texto},200);
  } catch {
    return json({respuesta:"No pude conectarme ahora 🐝 Probá de nuevo en un ratito."},200);
  }
}

function redireccionarInicio(request) { return Response.redirect(new URL("/",request.url).toString(),301); }

export default {
  async fetch(request, env) {
    const url=new URL(request.url);
    if (url.pathname==="/.netlify/functions/imagen-proveedor" || url.pathname==="/api/imagen-proveedor") return servirImagenProveedor(request);
    if (url.pathname==="/api/margarita" || url.pathname==="/.netlify/functions/amara") return servirMargarita(request,env);
    if (["/calculadora","/calculadora.html","/index.html","/tienda"].includes(url.pathname)) return redireccionarInicio(request);
    if (url.pathname==="/api/estado") return json({ok:true,servicio:"AmarangoElectro Cloudflare",margarita:true});
    return env.ASSETS.fetch(request);
  },
  async scheduled(controller, env, ctx) {
    const tipo=controller&&controller.cron==="0 12-21 * * 1-6"?"incremental":"completa";
    ctx.waitUntil(ejecutarSincronizacionProgramadaSegura(env,tipo));
  },
};