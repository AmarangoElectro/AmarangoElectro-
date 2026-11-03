/* AmarangoElectro tienda vieja - despacho de correo de tareas.
 * Corre sólo en Cloudflare Worker (cron). Nunca importa en el navegador.
 * Enviar está DESHABILITADO si faltan RESEND_API_KEY, ADMIN_TASK_MAIL_FROM
 * o SUPABASE_SECRET_KEY. No usa el PIN público como autenticación. */
const BASE="https://zctaukyrhsmpjkcddcqq.supabase.co";
const ESCAPE={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};
function safe(value,max=500){return String(value??"").slice(0,max)}
function htmlEscape(value){return safe(value).replace(/[&<>"']/g,c=>ESCAPE[c])}
function short(value,max){return String(value??"").trim().slice(0,max)}
function dateLabel(value){
 const date=new Date(value);
 if(Number.isNaN(date.getTime()))return "Fecha por confirmar";
 return new Intl.DateTimeFormat("es-AR",{timeZone:"America/Argentina/Buenos_Aires",weekday:"long",day:"2-digit",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit",hour12:false}).format(date);
}
function stageLabel(value){return value==="comprar"?"Pendiente de compra":value==="entregar"?"Pendiente de entrega":"Tarea pendiente";}
function emailMarkup(task){
 const name=htmlEscape(task.product_name||"Tarea de Administración");
 const title=htmlEscape(task.title);
 const note=htmlEscape(task.note);
 const status=htmlEscape(stageLabel(task.stage));
 const due=htmlEscape(dateLabel(task.due_at));
 const noteBlock=note?'<tr><td style="padding:15px 20px 4px;color:#5c6574;font-size:12px;font-weight:750">INDICACIONES</td></tr><tr><td style="padding:0 20px 16px;color:#202b3c;font-size:14px;white-space:pre-wrap;overflow-wrap:anywhere">'+note+'</td></tr>':"";
 const body='<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head>'+
 '<body style="margin:0;padding:24px 10px;background:#f5f6f8;font-family:Arial,Helvetica,sans-serif;color:#15233d;">'+
 '<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;width:100%;margin:0 auto;background:#ffffff;border:1px solid #f0e2d2;border-radius:16px;overflow:hidden;">'+
 '<tr><td style="background:#ffffff;padding:25px 22px 18px;border-bottom:4px solid #ff7a00;">'+
 '<div style="font-size:12px;font-weight:800;color:#ff7a00;letter-spacing:1.3px;">AMARANGOELECTRO 🐝</div>'+
 '<h1 style="margin:8px 0 2px;font-size:23px;line-height:1.2;color:#15233d;">🔔 Tenés una tarea pendiente</h1>'+
 '<p style="margin:8px 0 0;font-size:13px;color:#6b7280;">Recordatorio exclusivo de Administración</p></td></tr>'+
 '<tr><td style="padding:20px 20px 6px;"><div style="font-size:12px;color:#667085;font-weight:700;">TAREA</div>'+
 '<div style="margin-top:5px;font-size:19px;line-height:1.35;font-weight:800;color:#17233b;overflow-wrap:anywhere;">'+title+'</div></td></tr>'+
 '<tr><td style="padding:6px 20px 16px;"><table role="presentation" style="width:100%;background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;"><tr><td style="padding:14px 16px;">'+
 '<div style="font-size:13px;color:#87500f;"><strong>📦 Producto:</strong> '+name+'</div>'+
 '<div style="font-size:13px;color:#87500f;padding-top:9px;"><strong>🛒 Estado:</strong> '+status+'</div>'+
 '<div style="font-size:13px;color:#87500f;padding-top:9px;"><strong>📅 Fecha y hora:</strong> '+due+' (Argentina)</div>'+
 '</td></tr></table></td></tr>'+noteBlock+
 '<tr><td style="padding:10px 20px 24px;text-align:center;"><a href="https://amarangoelectro.com.ar/" style="display:inline-block;padding:13px 20px;background:#ff7a00;color:#fff;text-decoration:none;border-radius:11px;font-size:14px;font-weight:800;">Abrir tareas en AmarangoElectro</a></td></tr>'+
 '<tr><td style="padding:16px 20px;border-top:1px solid #f1e6da;color:#667085;font-size:11px;line-height:1.5;text-align:center;">Correo automático de tus tareas de Administración. El mail de destino es el de tu cuenta de administrador verificada.</td></tr>'+
 '</table></body></html>';
 return body;
}
function textMarkup(task){
 return "AMARANGOELECTRO · Recordatorio de Administración\n\n"+short(task.title,180)+"\nProducto: "+short(task.product_name||"Tarea de Administración",200)+"\nEstado: "+stageLabel(task.stage)+"\nFecha y hora: "+dateLabel(task.due_at)+" (Argentina)"+(task.note?"\nNotas: "+short(task.note,500):"")+"\n\nAbrir: https://amarangoelectro.com.ar/";
}
async function rpc(env,name,payload){
 const key=String(env.SUPABASE_SECRET_KEY||"");
 const r=await fetch(BASE+"/rest/v1/rpc/"+name,{
  method:"POST",headers:{apikey:key,authorization:"Bearer "+key,"Content-Type":"application/json",accept:"application/json"},
  body:JSON.stringify(payload),signal:AbortSignal.timeout(13000),
 });
 if(!r.ok)throw Error("supabase_rpc_"+name+"_"+r.status);
 return r.json();
}
async function sendOne(task,env){
 const id=short(task.id,90),token=short(task.claim_token,60);
 let sent=false;
 try{
  const email=short(task.email,254),due=Date.parse(task.due_at);
  if(!id||!token||!Number.isFinite(due)||!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
   throw Error("invalid_claim");
  const idempotency="ae-task-"+id+"-"+due;
  const result=await fetch("https://api.resend.com/emails",{
   method:"POST",
   headers:{
    authorization:"Bearer "+env.RESEND_API_KEY,
    "content-type":"application/json",
    "user-agent":"AmarangoElectro-tasks/1.0",
    "idempotency-key":idempotency.slice(0,240),
   },
   body:JSON.stringify({
    from:env.ADMIN_TASK_MAIL_FROM,to:[email],
    subject:"🔔 AmarangoElectro · "+short(task.title,110),
    html:emailMarkup(task),text:textMarkup(task)
   }),
   signal:AbortSignal.timeout(16000),
  });
  const response=await result.json().catch(()=>({}));
  sent=result.ok&&typeof response.id==="string";
  if(!sent)throw Error("resend_status_"+result.status);
 }catch(error){
  console.warn("Admin task mail not delivered",id,String(error?.message||error).slice(0,80));
 }
 try{
  await rpc(env,"ae_admin_task_mail_finish",{p_id:id,p_claim_token:token,p_sent:sent});
 }catch(error){
  console.warn("Admin task mail receipt unavailable",id,String(error?.message||error).slice(0,80));
 }
 return sent;
}
export async function dispatchAdminTaskMail(env){
 if(env.SUPABASE_URL&&env.SUPABASE_URL!==BASE)return {configured:false,reason:"wrong_supabase"};
 if(!env.RESEND_API_KEY||!env.ADMIN_TASK_MAIL_FROM||!env.SUPABASE_SECRET_KEY)
  return {configured:false,reason:"missing_mail_secrets"};
 const from=String(env.ADMIN_TASK_MAIL_FROM);
 if(!/^[^<]*<?[^@\s<>]+@[^@\s<>]+\.[^@\s<>]+>?$/.test(from))
  return {configured:false,reason:"invalid_sender"};
 const claims=await rpc(env,"ae_admin_task_mail_claim",{p_limit:20});
 if(!Array.isArray(claims))throw Error("invalid_mail_claims");
 let sent=0;
 for(let i=0;i<claims.length;i+=4){
  const outcomes=await Promise.all(claims.slice(i,i+4).map(task=>sendOne(task,env)));
  sent+=outcomes.filter(Boolean).length;
 }
 return {configured:true,claimed:claims.length,sent};
}
