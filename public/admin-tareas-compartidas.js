/* AmarangoElectro · Lista compartida de tareas de administradores.
 * Requiere Supabase Auth owner/admin y RPC ae_admin_shared_task_action.
 * No modifica tareas de clientes ni revela secretos.
 */
(function(){
'use strict';
var KEY='ae_admin_shared_known_v1',known={},hooks=null,loading=false,mutating=false;
var lastSync=0,active=false,auth=false,queue=Promise.resolve(),userId='';
try{known=JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch(e){known={};}
function saveKnown(){try{localStorage.setItem(KEY,JSON.stringify(known));}catch(e){}}
function client(){return window.sbFotos&&window.sbFotos.auth?window.sbFotos:null}
function init(callbacks){hooks=callbacks;}
function ready(){return active;}
function state(){return active?'ready':auth?'offline':'auth';}
function toRow(t){
 var due=t.dueAt?new Date(t.dueAt):null,created=new Date(t.createdAt||Date.now());
 return {id:t.id,title:String(t.title||'').slice(0,180),note:String(t.note||'').slice(0,500),
  product_id:t.productId||null,product_name:t.productName||null,stage:t.stage,
  due_at:due&&!Number.isNaN(due.getTime())?due.toISOString():null,
  created_at:created.toISOString()};
}
function fromRow(t){
 return {id:t.id,title:t.title,note:t.note||'',productId:t.product_id||null,
  productName:t.product_name||null,stage:t.stage,dueAt:t.due_at||null,
  createdAt:Date.parse(t.created_at)||Date.now(),
  updatedAt:Date.parse(t.updated_at)||Date.now(),
  completedAt:t.completed_at?Date.parse(t.completed_at):null,
  creatorUserId:t.creator_user_id||null};
}
async function call(action,payload){
 var sb=client();if(!sb)throw Error('Sesión segura no disponible');
 var r=await sb.auth.getSession(),session=r&&r.data&&r.data.session;
 if(!session||!session.user||!session.user.id)throw Error('Iniciá sesión de Administración');
 userId=session.user.id;
 var result=await sb.rpc('ae_admin_shared_task_action',{p_action:action,p_payload:payload||{}});
 if(result.error)throw result.error;
 return result.data;
}
function report(text){if(typeof window.mostrarToast==='function')window.mostrarToast(text);}
async function sync(force){
 if(!hooks||!hooks.canAccess()||loading||mutating)return;
 if(!force&&Date.now()-lastSync<25000)return;
 loading=true;lastSync=Date.now();
 try{
  var remote=await call('list',{});
  if(!Array.isArray(remote))throw Error('Lista compartida no disponible');
  // Traer avisos de venta de asesores como tareas privadas. El RPC en servidor
  // verifica rol de Administración y usa IDs estables para evitar duplicados.
  try{
   var incomingClient=client();
   if(incomingClient){
    var importResult=await incomingClient.rpc('ae_admin_ingest_advisor_sales');
    if(importResult.error)throw importResult.error;
    if(importResult.data&&Number(importResult.data.imported)>0){
     remote=await call('list',{});
     if(!Array.isArray(remote))throw Error('No se pudo actualizar la lista de ventas');
     report('🧾 '+Number(importResult.data.imported)+' venta(s) de asesores pendiente(s) para revisar');
    }
   }
  }catch(ingestError){
   console.warn('Avisos de venta de asesores todavía no importados:',String(ingestError.message||ingestError).slice(0,140));
  }
  var remoteIds=new Set(remote.map(function(t){return t.id;}));
  var local=hooks.get(),toImport=local.filter(function(t){
    return t&&typeof t.id==='string'&&!remoteIds.has(t.id)&&!known[t.id];
  }).slice(0,300);
  for(var i=0;i<toImport.length;i++){
    try{
      await call('import',toRow(toImport[i]));
      known[toImport[i].id]=true;
    }catch(err){console.warn('No se importó una tarea antigua',String(err.message||err).slice(0,100));}
  }
  if(toImport.length)remote=await call('list',{});
  if(!Array.isArray(remote))throw Error('Lista compartida no disponible');
  var converted=remote.map(fromRow).filter(function(t){return t.id&&t.title;});
  converted.forEach(function(t){known[t.id]=true;});
  saveKnown();
  var importedIds=new Set(converted.map(function(t){return t.id;}));
  // Preservar en el dispositivo lo que no se pudo subir; nunca revivir
  // tareas ya borradas por Angie o Maxi.
  var unsent=hooks.get().filter(function(t){return !known[t.id]&&!importedIds.has(t.id);});
  hooks.set(converted.concat(unsent).slice(-500));
  active=true;auth=true;
  hooks.refresh();
 }catch(err){
  active=false;
  auth=String(err.message||err).indexOf('sesión')<0;
  console.warn('Tareas compartidas no sincronizadas',String(err.message||err).slice(0,100));
  if(hooks&&hooks.refresh)hooks.refresh();
 }finally{loading=false;}
}
function change(action,payload){
 if(!hooks)return Promise.resolve(false);
 mutating=true;
 queue=queue.catch(function(){}).then(async function(){
   if(action==='create'&&!active){mutating=false;await sync(true);return false;}
   if(!active)throw Error('Sin sincronización de tareas');
   await call(action,payload);
   if(payload&&payload.id)known[payload.id]=true;
   saveKnown();return true;
 }).then(function(ok){
   mutating=false;lastSync=0;return sync(true).then(function(){return ok;});
 }).catch(function(err){
   mutating=false;active=false;
   console.warn('Cambio de tarea compartida sin confirmar',String(err.message||err).slice(0,100));
   report('⚠️ Cambio pendiente de sincronización entre Maxi y Angie');
   lastSync=0;return sync(true).then(function(){return false;});
 });
 return queue;
}
function info(){
 return active?'🐝 Tareas en común: Maxi y Angie ven la misma lista y el mismo contador.':
 auth?'📱 Estás viendo las tareas de este dispositivo. No se pudo sincronizar la lista común.':
 '🔒 Para ver la lista de Maxi y Angie, iniciá sesión con tu cuenta segura de Administración.';
}
window.AEAdminSharedTasks={init:init,sync:sync,change:change,ready:ready,state:state,info:info};
})();