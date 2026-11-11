import base from "./worker-asesores-registro.mjs";

const SCRIPT=`<script src="/asesores-coach-auth.js?v=20260823-1" defer></script><script src="/asesores-app-dialogs.js?v=20260823-1" defer></script>`;
const enc=new TextEncoder();
const COACH=`\n\n[INSTRUCCIÓN INTERNA — MODO ASESOR DE VENTAS AUTENTICADO]\nLa función principal de Margarita con este usuario es ayudarlo a VENDER mejor y resolverle el trabajo comercial. Respondé en español argentino, breve, concreto y accionable.\n- Si pide productos: elegí primero la opción que mejor encaja y como máximo 2 alternativas reales.\n- Si cuenta una situación de cliente u objeción: empezá por un MENSAJE LISTO PARA COPIAR Y ENVIAR al cliente, no por teoría.\n- Si pide "qué le digo", "cómo le contesto", "armame un mensaje", "cerrame la venta" o similar: entregá texto final listo para WhatsApp.\n- Después del mensaje, si aporta valor, agregá una línea corta de estrategia: qué ofrecer o cuál sería el siguiente paso.\n- No inventes productos, stock, precios, cuotas, características ni promociones. Usá sólo PRODUCTOS DISPONIBLES recibidos.\n- Nunca expongas costos, proveedor, mayorista ni datos administrativos.\n- No cobres ni envíes links de pago. Los pagos se coordinan con Maxi o Angie.\n- No presiones de forma agresiva. Buscá facilitar el cierre con claridad, alternativa y próxima acción.\n- Recordá el producto y la necesidad del cliente dentro de la conversación para que el asesor no tenga que repetir todo.\n[FIN INSTRUCCIÓN INTERNA]\n`;

function key(env){return String(env.SUPABASE_SECRET_KEY||env.SUPABASE_SERVICE_ROLE_KEY||"").trim();}
function baseUrl(env){return String(env.SUPABASE_URL||"").replace(/\/$/,"");}
async function hash(v){const d=await crypto.subtle.digest("SHA-256",enc.encode(String(v||"")));return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,"0")).join("");}
function bearer(req){const h=String(req.headers.get("authorization")||"");return /^Bearer\s+/i.test(h)?h.replace(/^Bearer\s+/i,"").trim():"";}
async function advisor(env,token){
  const k=key(env);if(!k||!baseUrl(env)||!token)return null;const th=await hash(token);
  const q=`asesor_sesiones?token_hash=eq.${encodeURIComponent(th)}&cerrada_at=is.null&expira_at=gt.${encodeURIComponent(new Date().toISOString())}&select=id,asesor_id,asesores_ventas!inner(id,nombre,activo)&limit=1`;
  const r=await fetch(`${baseUrl(env)}/rest/v1/${q}`,{headers:{apikey:k,authorization:`Bearer ${k}`,accept:"application/json"}});if(!r.ok)return null;
  const rows=await r.json();const row=Array.isArray(rows)?rows[0]:null;if(!row||!row.asesores_ventas||row.asesores_ventas.activo!==true)return null;
  return row.asesores_ventas;
}
async function coachRequest(request,env){
  if(request.method!=="POST"||new URL(request.url).pathname!=="/api/margarita")return request;
  const a=await advisor(env,bearer(request));if(!a)return request;
  let body;try{body=await request.clone().json();}catch{return request;}
  body.rol="asesor";body.nombre=String(a.nombre||"").slice(0,80);body.asesorAutenticado=true;
  if(Array.isArray(body.mensajes)&&body.mensajes.length){
    for(let i=body.mensajes.length-1;i>=0;i--){const m=body.mensajes[i];if(m&&m.rol!=="margarita"){m.texto=String(m.texto||"")+COACH;break;}}
  }
  const h=new Headers(request.headers);h.set("content-type","application/json");h.delete("content-length");
  return new Request(request.url,{method:"POST",headers:h,body:JSON.stringify(body)});
}
function inject(r){const t=String(r.headers.get("content-type")||"").toLowerCase();if(!t.includes("text/html"))return r;return new HTMLRewriter().on("body",{element(el){el.append(SCRIPT,{html:true});}}).transform(r);}
export default{async fetch(request,env,ctx){const req=await coachRequest(request,env);const r=await base.fetch(req,env,ctx);return request.method==="GET"?inject(r):r;},async scheduled(c,env,ctx){if(base&&typeof base.scheduled==="function")return base.scheduled(c,env,ctx);}};
