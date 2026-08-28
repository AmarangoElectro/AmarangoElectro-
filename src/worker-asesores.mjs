import base from "./worker-professional.mjs";

const SCRIPT_ASESORES = `<script src="/asesores-centro.js?v=20260823-1" defer></script>`;
const encoder = new TextEncoder();

function json(data,status=200){
  return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"}});
}

function serviceKey(env){
  return String(env.SUPABASE_SECRET_KEY||env.SUPABASE_SERVICE_ROLE_KEY||"").trim();
}
function supabaseBase(env){return String(env.SUPABASE_URL||"").replace(/\/$/,"");}
function sbHeaders(env,prefer="return=representation"){
  const key=serviceKey(env); if(!key||!supabaseBase(env)) return null;
  return {apikey:key,authorization:`Bearer ${key}`,"content-type":"application/json",prefer};
}
async function sb(env,path,opts={}){
  const h=sbHeaders(env,opts.prefer||"return=representation");
  if(!h) throw new Error("supabase_privado_no_configurado");
  const r=await fetch(`${supabaseBase(env)}/rest/v1/${path}`,{method:opts.method||"GET",headers:{...h,...(opts.headers||{})},body:opts.body===undefined?undefined:JSON.stringify(opts.body)});
  let data=null; try{data=await r.json();}catch{}
  if(!r.ok){const e=new Error(`supabase_${r.status}`);e.status=r.status;e.data=data;throw e;}
  return data;
}
async function rpc(env,name,body){return sb(env,`rpc/${name}`,{method:"POST",body});}

async function sha256(text){
  const d=await crypto.subtle.digest("SHA-256",encoder.encode(String(text||"")));
  return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,"0")).join("");
}
function randomCode(){
  const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789", a=new Uint32Array(8);crypto.getRandomValues(a);
  return [...a].map(n=>chars[n%chars.length]).join("");
}
function randomToken(){
  const a=new Uint8Array(32);crypto.getRandomValues(a);
  let s="";for(const b of a)s+=String.fromCharCode(b);
  return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
}
function phone(v){return String(v||"").replace(/\D+/g,"").slice(-15);}
function clean(v,max=120){return String(v||"").trim().slice(0,max);}
function adminConfigured(env){return !!String(env.ADMIN_PANEL_PASSWORD||"").trim();}
function adminOk(request,env){
  const esperado=String(env.ADMIN_PANEL_PASSWORD||"").trim();
  if(!esperado)return false;
  return request.headers.get("x-admin-key")===esperado;
}
function bearer(request){
  const h=String(request.headers.get("authorization")||"");
  return /^Bearer\s+/i.test(h)?h.replace(/^Bearer\s+/i,"").trim():"";
}

async function advisorByToken(env,token){
  if(!token)return null;
  const hash=await sha256(token);
  const rows=await sb(env,`asesor_sesiones?token_hash=eq.${encodeURIComponent(hash)}&cerrada_at=is.null&expira_at=gt.${encodeURIComponent(new Date().toISOString())}&select=id,asesor_id,ultimo_latido_at,expira_at,asesores_ventas!inner(id,nombre,telefono,email,localidad,activo)&limit=1`);
  const row=Array.isArray(rows)?rows[0]:null;
  if(!row||!row.asesores_ventas||row.asesores_ventas.activo!==true)return null;
  return {sesionId:row.id,asesor:row.asesores_ventas};
}

async function login(request,env){
  let body={};try{body=await request.json();}catch{return json({ok:false,error:"Datos inválidos"},400);}
  const tel=phone(body.telefono), code=clean(body.codigo,40).toUpperCase();
  if(tel.length<7||code.length<4)return json({ok:false,error:"Ingresá teléfono y clave personal"},400);
  const rows=await sb(env,`asesores_ventas?telefono=eq.${encodeURIComponent(tel)}&select=id,nombre,telefono,email,localidad,codigo_hash,activo&limit=1`);
  const a=Array.isArray(rows)?rows[0]:null;
  if(!a||a.activo!==true)return json({ok:false,error:"Asesor no habilitado"},403);
  const hash=await sha256(code);
  if(hash!==String(a.codigo_hash||""))return json({ok:false,error:"Teléfono o clave incorrectos"},401);
  const token=randomToken(), tokenHash=await sha256(token);
  const ses=await sb(env,"asesor_sesiones",{method:"POST",body:{asesor_id:a.id,token_hash:tokenHash}});
  const s=Array.isArray(ses)?ses[0]:null;
  if(!s)return json({ok:false,error:"No se pudo iniciar sesión"},500);
  await rpc(env,"ae_registrar_asesor_evento",{p_asesor_id:a.id,p_sesion_id:s.id,p_evento:"entrada",p_tema:null,p_producto_id:null,p_meta:{origen:"tienda"}});
  return json({ok:true,token,asesor:{id:a.id,nombre:a.nombre,telefono:a.telefono,email:a.email,localidad:a.localidad}});
}

async function me(request,env){
  const auth=await advisorByToken(env,bearer(request));
  if(!auth)return json({ok:false,error:"Sesión vencida"},401);
  return json({ok:true,asesor:auth.asesor});
}
async function heartbeat(request,env){
  const auth=await advisorByToken(env,bearer(request));
  if(!auth)return json({ok:false,error:"Sesión vencida"},401);
  await rpc(env,"ae_registrar_asesor_heartbeat",{p_asesor_id:auth.asesor.id,p_sesion_id:auth.sesionId});
  return json({ok:true,asesor:{id:auth.asesor.id,nombre:auth.asesor.nombre}});
}
async function evento(request,env){
  const auth=await advisorByToken(env,bearer(request));
  if(!auth)return json({ok:false,error:"Sesión vencida"},401);
  let body={};try{body=await request.json();}catch{return json({ok:false,error:"Datos inválidos"},400);}
  const permitidos=new Set(["consulta_margarita","producto_visto","producto_compartido","busqueda","salida"]);
  const ev=clean(body.evento,40);if(!permitidos.has(ev))return json({ok:false,error:"Evento inválido"},400);
  await rpc(env,"ae_registrar_asesor_evento",{p_asesor_id:auth.asesor.id,p_sesion_id:auth.sesionId,p_evento:ev,p_tema:clean(body.tema,120)||null,p_producto_id:clean(body.producto_id,120)||null,p_meta:body.meta&&typeof body.meta==="object"?body.meta:{}});
  if(ev==="salida") await sb(env,`asesor_sesiones?id=eq.${auth.sesionId}`,{method:"PATCH",body:{cerrada_at:new Date().toISOString()}});
  return json({ok:true});
}

function requireAdmin(request,env){
  if(!adminConfigured(env))return json({ok:false,error:"Falta configurar ADMIN_PANEL_PASSWORD en Cloudflare"},503);
  if(!adminOk(request,env))return json({ok:false,error:"Clave de administración incorrecta"},401);
  return null;
}
async function adminResumen(request,env){
  const bad=requireAdmin(request,env);if(bad)return bad;
  const rows=await rpc(env,"ae_asesores_resumen_admin",{});
  const lista=Array.isArray(rows)?rows:[];
  return json({ok:true,en_linea:lista.filter(x=>x.en_linea),asesores:lista});
}
async function adminCrear(request,env){
  const bad=requireAdmin(request,env);if(bad)return bad;
  let body={};try{body=await request.json();}catch{return json({ok:false,error:"Datos inválidos"},400);}
  const nombre=clean(body.nombre,80), telefono=phone(body.telefono), email=clean(body.email,120)||null, localidad=clean(body.localidad,120)||null;
  if(nombre.length<2||telefono.length<7)return json({ok:false,error:"Nombre y teléfono son obligatorios"},400);
  const codigo=randomCode(), codigo_hash=await sha256(codigo);
  try{
    const rows=await sb(env,"asesores_ventas",{method:"POST",body:{nombre,telefono,email,localidad,codigo_hash,activo:true}});
    const a=Array.isArray(rows)?rows[0]:null;
    return json({ok:true,asesor:a,codigo});
  }catch(e){
    if(e.status===409)return json({ok:false,error:"Ese teléfono ya está registrado"},409);
    throw e;
  }
}
async function adminPatch(request,env,id){
  const bad=requireAdmin(request,env);if(bad)return bad;
  let body={};try{body=await request.json();}catch{return json({ok:false,error:"Datos inválidos"},400);}
  const patch={actualizado_at:new Date().toISOString()};
  if(typeof body.activo==="boolean")patch.activo=body.activo;
  if(body.nombre!==undefined)patch.nombre=clean(body.nombre,80);
  if(body.telefono!==undefined)patch.telefono=phone(body.telefono);
  if(body.email!==undefined)patch.email=clean(body.email,120)||null;
  if(body.localidad!==undefined)patch.localidad=clean(body.localidad,120)||null;
  const rows=await sb(env,`asesores_ventas?id=eq.${encodeURIComponent(id)}`,{method:"PATCH",body:patch});
  if(typeof body.activo==="boolean"&&!body.activo){
    await sb(env,`asesor_sesiones?asesor_id=eq.${encodeURIComponent(id)}&cerrada_at=is.null`,{method:"PATCH",body:{cerrada_at:new Date().toISOString()}});
  }
  return json({ok:true,asesor:Array.isArray(rows)?rows[0]:null});
}
async function adminNuevaClave(request,env,id){
  const bad=requireAdmin(request,env);if(bad)return bad;
  const codigo=randomCode(), codigo_hash=await sha256(codigo);
  await sb(env,`asesores_ventas?id=eq.${encodeURIComponent(id)}`,{method:"PATCH",body:{codigo_hash,actualizado_at:new Date().toISOString()}});
  await sb(env,`asesor_sesiones?asesor_id=eq.${encodeURIComponent(id)}&cerrada_at=is.null`,{method:"PATCH",body:{cerrada_at:new Date().toISOString()}});
  return json({ok:true,codigo});
}
async function adminBorrar(request,env,id){
  const bad=requireAdmin(request,env);if(bad)return bad;
  await sb(env,`asesores_ventas?id=eq.${encodeURIComponent(id)}`,{method:"DELETE",prefer:"return=minimal"});
  return json({ok:true});
}

async function routeApi(request,env){
  const u=new URL(request.url), p=u.pathname;
  if(!p.startsWith("/api/asesores/"))return null;
  if(!serviceKey(env))return json({ok:false,error:"Falta SUPABASE_SECRET_KEY en Cloudflare"},503);
  if(p==="/api/asesores/login"&&request.method==="POST")return login(request,env);
  if(p==="/api/asesores/me"&&request.method==="GET")return me(request,env);
  if(p==="/api/asesores/heartbeat"&&request.method==="POST")return heartbeat(request,env);
  if(p==="/api/asesores/evento"&&request.method==="POST")return evento(request,env);
  if(p==="/api/asesores/admin/resumen"&&request.method==="GET")return adminResumen(request,env);
  if(p==="/api/asesores/admin/crear"&&request.method==="POST")return adminCrear(request,env);
  let m=p.match(/^\/api\/asesores\/admin\/([^/]+)\/(estado|clave)$/);
  if(m&&request.method==="POST")return m[2]==="estado"?adminPatch(request,env,m[1]):adminNuevaClave(request,env,m[1]);
  m=p.match(/^\/api\/asesores\/admin\/([^/]+)$/);
  if(m&&request.method==="DELETE")return adminBorrar(request,env,m[1]);
  return json({ok:false,error:"Ruta no encontrada"},404);
}

function inject(response){
  const t=String(response.headers.get("content-type")||"").toLowerCase();
  if(!t.includes("text/html"))return response;
  return new HTMLRewriter().on("body",{element(el){el.append(SCRIPT_ASESORES,{html:true});}}).transform(response);
}

export default {
  async fetch(request,env,ctx){
    try{
      const api=await routeApi(request,env);if(api)return api;
      const r=await base.fetch(request,env,ctx);
      return request.method==="GET"?inject(r):r;
    }catch(e){
      console.error("asesores-api",e);
      return json({ok:false,error:"No se pudo completar la operación"},500);
    }
  },
  async scheduled(controller,env,ctx){if(base&&typeof base.scheduled==="function")return base.scheduled(controller,env,ctx);}
};
