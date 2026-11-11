import base from "./worker-asesores.mjs";

const SCRIPT = `<script src="/asesores-registro.js?v=20260823-1" defer></script>`;
const enc=new TextEncoder();
function json(d,s=200){return new Response(JSON.stringify(d),{status:s,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"}});}
function key(env){return String(env.SUPABASE_SECRET_KEY||env.SUPABASE_SERVICE_ROLE_KEY||"").trim();}
function url(env){return String(env.SUPABASE_URL||"").replace(/\/$/,"");}
async function hash(v){const d=await crypto.subtle.digest("SHA-256",enc.encode(String(v||"")));return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,"0")).join("");}
function code(){const c="ABCDEFGHJKLMNPQRSTUVWXYZ23456789",a=new Uint32Array(8);crypto.getRandomValues(a);return [...a].map(n=>c[n%c.length]).join("");}
function token(){const a=new Uint8Array(32);crypto.getRandomValues(a);let s="";for(const b of a)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");}
function phone(v){return String(v||"").replace(/\D+/g,"").slice(-15);}
function clean(v,n=120){return String(v||"").trim().slice(0,n);}
async function sb(env,path,opt={}){const k=key(env);if(!k||!url(env))throw new Error("privado_no_configurado");const r=await fetch(`${url(env)}/rest/v1/${path}`,{method:opt.method||"GET",headers:{apikey:k,authorization:`Bearer ${k}`,"content-type":"application/json",prefer:opt.prefer||"return=representation"},body:opt.body===undefined?undefined:JSON.stringify(opt.body)});let d=null;try{d=await r.json();}catch{}if(!r.ok){const e=new Error(`sb_${r.status}`);e.status=r.status;e.data=d;throw e;}return d;}
async function rpc(env,name,body){return sb(env,`rpc/${name}`,{method:"POST",body});}
function adminOk(req,env){const x=String(env.ADMIN_PANEL_PASSWORD||"").trim();return !!x&&req.headers.get("x-admin-key")===x;}

async function adminInvitacion(request,env){
  if(!String(env.ADMIN_PANEL_PASSWORD||"").trim())return json({ok:false,error:"Falta configurar ADMIN_PANEL_PASSWORD en Cloudflare"},503);
  if(!adminOk(request,env))return json({ok:false,error:"Clave de administración incorrecta"},401);
  const invitacion=code(),codigo_hash=await hash(invitacion);
  const expira=new Date(Date.now()+7*24*60*60*1000).toISOString();
  await sb(env,"asesor_invitaciones",{method:"POST",body:{codigo_hash,activo:true,expira_at:expira}});
  return json({ok:true,invitacion,expira_at:expira});
}

async function registro(request,env){
  let b={};try{b=await request.json();}catch{return json({ok:false,error:"Datos inválidos"},400);}
  const nombre=clean(b.nombre,80),telefono=phone(b.telefono),email=clean(b.email,120),localidad=clean(b.localidad,120),inv=clean(b.invitacion,40).toUpperCase();
  if(nombre.length<2||telefono.length<7||inv.length<4)return json({ok:false,error:"Completá nombre, teléfono e invitación"},400);
  const personal=code(),invHash=await hash(inv),personalHash=await hash(personal);
  let advisorId;
  try{advisorId=await rpc(env,"ae_autoregistrar_asesor",{p_invitacion_hash:invHash,p_codigo_hash:personalHash,p_nombre:nombre,p_telefono:telefono,p_email:email||null,p_localidad:localidad||null});}
  catch(e){return json({ok:false,error:"La invitación no es válida, ya fue usada o el teléfono ya está registrado"},409);}
  if(Array.isArray(advisorId))advisorId=advisorId[0];
  if(advisorId&&typeof advisorId==="object")advisorId=advisorId.ae_autoregistrar_asesor||advisorId.id;
  advisorId=String(advisorId||"").replace(/^"|"$/g,"");
  const rows=await sb(env,`asesores_ventas?id=eq.${encodeURIComponent(advisorId)}&select=id,nombre,telefono,email,localidad,activo&limit=1`);
  const a=Array.isArray(rows)?rows[0]:null;if(!a)return json({ok:false,error:"No se pudo completar el registro"},500);
  const sessionToken=token(),token_hash=await hash(sessionToken);
  const ss=await sb(env,"asesor_sesiones",{method:"POST",body:{asesor_id:a.id,token_hash}});const s=Array.isArray(ss)?ss[0]:null;
  await rpc(env,"ae_registrar_asesor_evento",{p_asesor_id:a.id,p_sesion_id:s&&s.id||null,p_evento:"entrada",p_tema:null,p_producto_id:null,p_meta:{origen:"autoregistro"}});
  return json({ok:true,token:sessionToken,codigo_personal:personal,asesor:a});
}

async function route(request,env){const p=new URL(request.url).pathname;if(p==="/api/asesores/registro"&&request.method==="POST")return registro(request,env);if(p==="/api/asesores/admin/invitacion"&&request.method==="POST")return adminInvitacion(request,env);return null;}
function inject(r){const t=String(r.headers.get("content-type")||"").toLowerCase();if(!t.includes("text/html"))return r;return new HTMLRewriter().on("body",{element(el){el.append(SCRIPT,{html:true});}}).transform(r);}
export default{async fetch(request,env,ctx){try{const x=await route(request,env);if(x)return x;const r=await base.fetch(request,env,ctx);return request.method==="GET"?inject(r):r;}catch(e){console.error("asesor-registro",e);return json({ok:false,error:"No se pudo completar la operación"},500);}},async scheduled(c,env,ctx){if(base&&typeof base.scheduled==="function")return base.scheduled(c,env,ctx);}};
