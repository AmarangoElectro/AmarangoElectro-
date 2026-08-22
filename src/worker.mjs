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
Sos MARGARITA, la asistente de ventas de AmarangoElectro. Hablás en español argentino, con calidez, claridad y mensajes cortos.
Tu único tema es la tienda, sus productos, precios, cuotas, stock y entregas.

REGLAS OBLIGATORIAS:
- Nunca inventes productos, precios, características, stock ni enlaces. Sólo podés recomendar productos incluidos en PRODUCTOS DISPONIBLES.
- Si no hay una coincidencia real, respondé exactamente: "No encuentro ese producto en este momento." y ofrecé ayudar a buscar otra opción.
- Antes de recomendar, hacé como máximo dos preguntas útiles según la categoría. Ejemplos: celulares: presupuesto y marca; TV: pulgadas y presupuesto; refrigeración: tipo y tamaño; cocción: tipo de producto y presupuesto; climatización: tipo y ambiente.
- Si la persona dice solamente "pasame opciones", primero hacé las preguntas necesarias. No largues una lista sin asesorar.
- Cuando ya tengas la información, ofrecé hasta tres opciones y usá únicamente el enlace exacto recibido con cada producto.
- Los precios se actualizan seguido: indicá que conviene confirmar antes de cerrar. No prometas stock.
- 2 cuotas: precio contado +15%; 4 cuotas: +55%; 6 cuotas: +80%. Sólo calculá sobre el precio recibido.
- Para comprar, derivá al equipo por WhatsApp. No pidas DNI, tarjeta ni dirección.
- Entregas dentro de 48 horas corridas desde la primera cuota, sujeto a coordinación.
`;

function limpiarMensajes(valor) {
  if (!Array.isArray(valor)) return [];
  return valor.slice(-10).map((m)=>({
    role: m && m.rol === "margarita" ? "model" : "user",
    parts: [{text:String((m&&m.texto)||"").slice(0,1200)}],
  })).filter((m)=>m.parts[0].text);
}

function limpiarProductos(valor) {
  if (!Array.isArray(valor)) return [];
  return valor.slice(0,30).map((p)=>({
    nombre:String((p&&p.nombre)||"").slice(0,180),
    categoria:String((p&&p.categoria)||"").slice(0,80),
    precio:Number((p&&p.precio)||0),
    caracteristicas:String((p&&p.caracteristicas)||"").slice(0,240),
    url:String((p&&p.url)||"").slice(0,500),
  })).filter((p)=>p.nombre && p.precio>0 && /^https:\/\//.test(p.url));
}

async function servirMargarita(request, env) {
  if (request.method !== "POST") return json({error:"Método no permitido"},405);
  if (!env.GEMINI_API_KEY) return json({respuesta:"Margarita está descansando un momento 🐝 Probá nuevamente en unos minutos."},200);
  let body;
  try { body=await request.json(); } catch { return json({error:"Pedido inválido"},400); }
  const mensajes=limpiarMensajes(body.mensajes), productos=limpiarProductos(body.productos);
  const contexto="PRODUCTOS DISPONIBLES PARA ESTA CONSULTA (lista cerrada; no inventar):\n"+JSON.stringify(productos);
  const contents=mensajes.length?mensajes:[{role:"user",parts:[{text:"Hola"}]}];
  contents[contents.length-1].parts[0].text += "\n\n"+contexto;
  try {
    const respuesta=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",{
      method:"POST",headers:{"content-type":"application/json","x-goog-api-key":env.GEMINI_API_KEY},
      body:JSON.stringify({systemInstruction:{parts:[{text:CEREBRO_MARGARITA}]},contents,generationConfig:{temperature:0.35,maxOutputTokens:500}}),
    });
    const data=await respuesta.json();
    const texto=data&&data.candidates&&data.candidates[0]&&data.candidates[0].content&&data.candidates[0].content.parts&&data.candidates[0].content.parts[0]&&data.candidates[0].content.parts[0].text;
    if (!respuesta.ok || !texto) return json({respuesta:"No pude conectarme ahora 🐝 Probá de nuevo en un ratito."},200);
    return json({respuesta:texto},200);
  } catch { return json({respuesta:"No pude conectarme ahora 🐝 Probá de nuevo en un ratito."},200); }
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
