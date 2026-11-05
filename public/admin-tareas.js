/* AmarangoElectro - tareas de Administracion.
 * Solo interfaz privada del modo Admin existente; almacenamiento LOCAL a este navegador.
 * No altera precios, catalogo, stock ni datos Supabase. No ofrece push con la app cerrada. */
(function(){
'use strict';
var KEY='ae_admin_tasks_v1',NOTIFIED='ae_admin_task_notified_v1',MAX=300;
var MAIL_ENABLED_KEY='ae_admin_task_mail_enabled_v1',MAIL_OWNER_KEY='ae_admin_task_mail_owner_v1';
var mailEnabled=false,mailOwner='',mailStatus='not_connected',mailEmail='',mailLastSync=0,mailSyncTimer=null,mailBusy=false,mailResync=false,mailForceOff=false;
var tasks=[],panel=null,form=null,confirmBox=null,confirmFocus=null,observed=null,timer=null,scanQueued=false;
try{mailEnabled=localStorage.getItem(MAIL_ENABLED_KEY)==='yes';mailOwner=localStorage.getItem(MAIL_OWNER_KEY)||'';}catch(e){}

function admin(){return typeof window.tiendaEsAdmin!=='undefined'&&window.tiendaEsAdmin===true&&window.vistaPreviaCliente!==true&&window.vistaPreviaAsesor!==true;}
function read(){try{var x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x.filter(function(t){return t&&typeof t.id==='string'&&typeof t.title==='string'&&['comprar','entregar','pendiente','completada'].indexOf(t.stage)>=0;}).slice(-MAX):[]}catch(e){return []}}
function write(){try{localStorage.setItem(KEY,JSON.stringify(tasks));if(mailEnabled)queueMailSync();return true;}catch(e){alert('No se pudo guardar la tarea en este dispositivo. Revisá el espacio del navegador.');return false}}
function el(tag,cls,txt){var n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n}
function btn(label,fn,cls){var b=el('button',cls,label);b.type='button';b.addEventListener('click',fn);return b}
function due(t){return t.stage!=='completada'&&!!t.dueAt&&new Date(t.dueAt).getTime()<=Date.now()}
function order(a,b){if(a.stage==='completada'&&b.stage!=='completada')return 1;if(b.stage==='completada'&&a.stage!=='completada')return -1;return (a.dueAt?new Date(a.dueAt).getTime():Infinity)-(b.dueAt?new Date(b.dueAt).getTime():Infinity)||(b.createdAt||0)-(a.createdAt||0)}
function isCrmDraft(t){return !!t&&typeof t.title==='string'&&t.title.indexOf('🧾 Venta CRM · ')===0}
function status(t){if(isCrmDraft(t))return t.stage==='completada'?'✅ Cargada en CRM':'🧾 Venta pendiente de cargar en CRM';return t.stage==='comprar'?'🛒 Falta comprar':t.stage==='entregar'?'🚚 Falta entregar':t.stage==='completada'?'✅ Finalizada':'📋 Pendiente'}
function fmtDate(v){if(!v)return 'Sin fecha';var d=new Date(v);return Number.isNaN(d.getTime())?'Sin fecha':d.toLocaleString('es-AR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}
function visibleModal(){return panel&&!panel.hidden||form&&!form.hidden||confirmBox&&!confirmBox.hidden}
function dismissConfirm(){
 if(!confirmBox||confirmBox.hidden)return;
 confirmBox.hidden=true;confirmBox.replaceChildren();
 var focus=confirmFocus;confirmFocus=null;
 if(focus&&focus.isConnected)focus.focus();
}
function close(){dismissConfirm();if(panel)panel.hidden=true;if(form)form.hidden=true;}
function taskConfirm(opts){
 if(!admin())return;ensure();dismissConfirm();
 confirmFocus=document.activeElement;
 confirmBox.replaceChildren();
 var card=el('div','ae-task-confirm-card');card.setAttribute('role','alertdialog');card.setAttribute('aria-modal','true');
 var heading=el('h2','ae-task-confirm-heading',opts.title||'Confirmar acción');heading.id='ae-task-confirm-title';
 card.setAttribute('aria-labelledby',heading.id);
 card.appendChild(el('div','ae-task-confirm-symbol',opts.symbol||'📋'));
 card.appendChild(heading);
 var msg=el('p','ae-task-confirm-message',opts.message||'');msg.id='ae-task-confirm-description';
 card.setAttribute('aria-describedby',msg.id);card.appendChild(msg);
 var actions=el('div','ae-task-confirm-actions');
 var cancel=btn('Cancelar',dismissConfirm,'ae-task-confirm-cancel');
 var accept=btn(opts.actionLabel||'Confirmar',function(){
  dismissConfirm();
  if(admin()&&typeof opts.onAccept==='function')opts.onAccept();
 },'ae-task-confirm-accept');
 actions.append(cancel,accept);card.appendChild(actions);
 confirmBox.appendChild(card);confirmBox.hidden=false;accept.focus();
}
function ensure(){
 if(!document.body)return;
 if(!document.getElementById('ae-admin-tasks-css')){
  var style=el('style');style.id='ae-admin-tasks-css';
  style.textContent=[
   '#ae-task-bell{padding:6px 11px;border-radius:11px;background:var(--wh);color:var(--az);border:1px solid var(--bor);font-weight:800;font-size:.72rem;cursor:pointer;white-space:nowrap}',
   '#ae-task-bell.ae-task-due{border-color:#ff7a00;color:#ae4d00}',
   '#ae-task-bell{display:inline-flex;align-items:center;gap:7px;justify-content:center;position:relative}',
   '.ae-task-count{display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:22px;padding:0 6px;border-radius:999px;background:#ff7a00;color:#fff;font-size:.71rem;font-weight:950;box-shadow:0 2px 8px rgba(255,122,0,.38);border:1px solid rgba(255,255,255,.52);font-variant-numeric:tabular-nums}',
   '.ae-task-count.ae-has-due{background:#e64525;box-shadow:0 2px 9px rgba(230,69,37,.46)}',
   'body.oscuro .ae-task-count{background:#ff8a1f;color:#221409;border-color:#ffb366;box-shadow:0 2px 10px rgba(255,122,0,.48)}',
   'body.oscuro .ae-task-count.ae-has-due{background:#ff6142;color:#260c08;border-color:#ffad9c}',
   '.ae-task-pin{width:100%;padding:6px 8px;margin:5px 0 3px;background:var(--wh);color:var(--az);border:1px dashed var(--bor);border-radius:9px;cursor:pointer;font-size:.66rem;font-weight:750;text-align:center}',
   '.ae-task-pin.ae-task-active{border-color:#ff7a00;color:#ae4d00;background:#fff7eb}',
   '.ae-task-layer[hidden]{display:none!important}.ae-task-layer{position:fixed;inset:0;z-index:7000;display:flex;align-items:flex-end;justify-content:center;background:rgba(2,10,34,.64);padding:12px}',
   '.ae-task-dialog{width:100%;max-width:540px;max-height:89dvh;overflow:auto;background:var(--wh);color:var(--txt);border:1px solid var(--bor);border-radius:18px;padding:16px;box-shadow:0 12px 45px rgba(0,0,0,.35);overscroll-behavior:contain}',
   '.ae-task-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:10px}.ae-task-head h2{font-size:1.03rem;color:var(--az)}',
   '.ae-task-mini{color:var(--sub);font-size:.69rem;line-height:1.45;margin:6px 0}.ae-task-label{display:block;font-weight:750;font-size:.75rem;margin-top:10px}',
   '.ae-task-input{display:block;width:100%;background:var(--bg);color:var(--txt);border:1px solid var(--bor);border-radius:10px;padding:11px;margin-top:4px;font:inherit;font-size:.85rem}',
   '.ae-task-actions{display:flex;gap:6px;margin-top:10px;flex-wrap:wrap}.ae-task-action{padding:8px 11px;border:1px solid var(--bor);border-radius:9px;background:var(--bg);color:var(--az);font-weight:800;font-size:.74rem;cursor:pointer}',
   '.ae-task-action.ae-task-primary{background:#ff7a00;border-color:#ff7a00;color:#fff}.ae-task-item{border:1px solid var(--bor);border-radius:12px;padding:11px;margin:8px 0;background:var(--bg)}',
   '.ae-task-item strong{display:block;overflow-wrap:anywhere}.ae-task-item.due{border-color:#ff7a00}.ae-task-note{white-space:pre-wrap;overflow-wrap:anywhere;font-size:.77rem;margin-top:5px}',
   '.ae-task-step-done{display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:8px 11px;border:1px solid #8acc96;border-radius:9px;background:#eaf8ee;color:#17602c;font-size:.74rem;font-weight:850;white-space:nowrap}',
   '.ae-task-step-row{width:100%;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.ae-task-step-row .ae-task-action,.ae-task-step-row .ae-task-step-done{min-width:0;width:100%;box-sizing:border-box;text-align:center}',
   '.ae-task-action:disabled{opacity:.52;cursor:not-allowed;box-shadow:none}.ae-task-action.ae-task-deliver{background:#0a4fbf;color:#fff;border-color:#0a4fbf}',
   'body.oscuro .ae-task-step-done{background:#163a2a;border-color:#367651;color:#a9eab8}body.oscuro .ae-task-action.ae-task-deliver{background:#2563c9;border-color:#4c80dc;color:#fff}',
   '.ae-task-confirm-layer[hidden]{display:none!important}.ae-task-confirm-layer{position:fixed;inset:0;z-index:7600;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(2,10,34,.70);backdrop-filter:blur(3px)}',
   '.ae-task-confirm-card{box-sizing:border-box;width:100%;max-width:395px;padding:22px 18px 18px;background:var(--wh);color:var(--txt);border:1px solid var(--bor);border-radius:19px;box-shadow:0 18px 50px rgba(0,0,0,.35);font-family:inherit;text-align:center}',
   '.ae-task-confirm-symbol{display:flex;align-items:center;justify-content:center;width:50px;height:50px;margin:0 auto 11px;border-radius:14px;background:#fff0db;font-size:26px}',
   '.ae-task-confirm-heading{margin:0;font-size:1.06rem;line-height:1.3;font-weight:900;color:var(--az)}',
   '.ae-task-confirm-message{font-size:.85rem;line-height:1.55;color:var(--txt);overflow-wrap:anywhere;margin:11px 0 21px}',
   '.ae-task-confirm-actions{display:grid;grid-template-columns:1fr 1.2fr;gap:9px}',
   '.ae-task-confirm-actions button{min-height:44px;padding:11px 8px;border-radius:11px;border:1px solid var(--bor);font:inherit;font-size:.81rem;font-weight:850;cursor:pointer}',
   '.ae-task-confirm-cancel{background:var(--bg);color:var(--txt)}.ae-task-confirm-accept{background:#ff7a00!important;color:#fff!important;border-color:#ff7a00!important}',
   '.ae-task-confirm-actions button:focus-visible{outline:2px solid #ff7a00;outline-offset:3px}',
   'body.oscuro .ae-task-confirm-card{background:#122442;color:#edf4ff;border-color:#365575}body.oscuro .ae-task-confirm-heading{color:#fff}',
   'body.oscuro .ae-task-confirm-message{color:#dbe7fb}body.oscuro .ae-task-confirm-symbol{background:#3b2b22}',
   'body.oscuro .ae-task-confirm-cancel{background:#1f3554;color:#edf4ff;border-color:#365575}',
   'body.oscuro .ae-task-pin.ae-task-active{background:#4f321c;color:#ffd0a5}body.oscuro #ae-task-bell.ae-task-due{color:#ffba76}',
   ".ae-task-date-trigger{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;text-align:left;font:inherit;font-size:.8rem;font-weight:800;border:1.5px solid var(--bor);border-radius:12px;background:var(--wh);color:var(--txt);padding:11px 12px;cursor:pointer;margin-top:6px}",
   ".ae-task-date-trigger span{color:var(--nar);font-size:.95rem}.ae-task-date-trigger:focus-visible,.ae-task-calendar button:focus-visible,.ae-task-calendar select:focus-visible{outline:2px solid var(--nar);outline-offset:2px}",
   ".ae-task-calendar[hidden]{display:none!important}.ae-task-calendar{--ae-date-bg:var(--wh);--ae-date-text:var(--txt);--ae-date-muted:var(--sub);--ae-date-line:var(--bor);margin-top:8px;padding:12px;border:1.5px solid var(--bor);border-radius:16px;background:var(--ae-date-bg);color:var(--ae-date-text);box-shadow:0 6px 24px rgba(5,22,55,.10)}",
   ".ae-task-calendar-head{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:10px}.ae-task-calendar-head strong{font-size:.83rem;text-transform:capitalize;color:var(--ae-date-text)}",
   ".ae-task-calendar button{font-family:inherit;cursor:pointer}.ae-task-calendar .ae-task-nav{width:34px;height:34px;flex-shrink:0;border:1px solid var(--ae-date-line);border-radius:10px;background:var(--bg);color:var(--ae-date-text);font-size:1rem}",
   ".ae-task-calendar-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px}.ae-task-calendar-weekday{padding:5px 0;text-align:center;font-size:.66rem;font-weight:850;color:var(--ae-date-muted)}",
   ".ae-task-calendar-day{width:100%;min-height:38px;padding:3px;border:1px solid transparent;border-radius:9px;background:transparent;color:var(--ae-date-text);font-size:.75rem;font-weight:750}",
   ".ae-task-calendar-day.ae-outside{opacity:.32}.ae-task-calendar-day.ae-today:not(.ae-selected){border-color:var(--nar)}.ae-task-calendar-day.ae-selected{background:var(--nar);border-color:var(--nar);color:#fff;box-shadow:0 3px 10px rgba(255,122,0,.27)}",
   ".ae-task-time-row{display:flex;align-items:flex-end;gap:9px;margin-top:13px;padding-top:10px;border-top:1px solid var(--ae-date-line)}.ae-task-time-row label{flex:1;min-width:0;font-size:.72rem;font-weight:800}",
   ".ae-task-time-row select{display:block;width:100%;min-width:0;margin-top:5px;border:1px solid var(--ae-date-line);border-radius:10px;background:var(--bg);color:var(--ae-date-text);padding:9px;font-size:.85rem;font-weight:800;color-scheme:light}",
   ".ae-task-date-bottom{display:flex;align-items:center;justify-content:space-between;gap:7px;margin-top:12px}.ae-task-date-bottom button{border:1px solid var(--ae-date-line);border-radius:9px;background:var(--bg);color:var(--ae-date-text);font-size:.74rem;font-weight:800;padding:8px 10px}.ae-task-date-bottom .ae-task-date-done{background:var(--nar);border-color:var(--nar);color:#fff}",
   "body.oscuro .ae-task-calendar{--ae-date-bg:#122442;--ae-date-text:#edf4ff;--ae-date-muted:#b1c5e6;--ae-date-line:#365575;box-shadow:0 8px 24px rgba(0,0,0,.24)}",
   "body.oscuro .ae-task-date-trigger{background:#122442;color:#edf4ff;border-color:#365575}",
   "body.oscuro .ae-task-time-row select{color-scheme:dark}",
   '@media(min-width:650px){.ae-task-layer{align-items:center}}'
  ].join('\n');
  document.head.appendChild(style);
 }
 if(!panel){panel=el('div','ae-task-layer');panel.hidden=true;panel.setAttribute('role','presentation');panel.addEventListener('click',function(e){if(e.target===panel)close()});document.body.appendChild(panel);}
 if(!form){form=el('div','ae-task-layer');form.hidden=true;form.setAttribute('role','presentation');form.addEventListener('click',function(e){if(e.target===form)close()});document.body.appendChild(form);}
 if(!confirmBox){confirmBox=el('div','ae-task-confirm-layer');confirmBox.hidden=true;confirmBox.addEventListener('click',function(e){if(e.target===confirmBox)dismissConfirm();});document.body.appendChild(confirmBox);}
}

/* Mail: opt-in por cuenta autenticada, no por PIN.
 * Supabase RLS valida rol owner/admin y entrega el correo de auth.users al Worker.
 * Nunca se envían contraseñas, API keys ni direcciones elegidas por el navegador.
 */
function mailClient(){var s=window.sbFotos;return s&&s.auth&&typeof s.auth.getSession==='function'?s:null}
function mailWriteState(){
 try{localStorage.setItem(MAIL_ENABLED_KEY,mailEnabled?'yes':'no');if(mailOwner)localStorage.setItem(MAIL_OWNER_KEY,mailOwner);}catch(e){}
}
function queueMailSync(turnOff){
 if(!mailEnabled&&!turnOff)return;
 if(turnOff)mailForceOff=true;
 mailResync=true;
 if(mailSyncTimer)clearTimeout(mailSyncTimer);
 mailSyncTimer=setTimeout(runMailSync,650);
}
function mailRows(userId,enabled){
 return tasks.filter(function(t){return !t.creatorUserId||t.creatorUserId===userId;}).map(function(t){
  var date=t.dueAt?new Date(t.dueAt):null;
  var dueAt=date&&!Number.isNaN(date.getTime())?date.toISOString():null;
  return {id:t.id,user_id:userId,product_id:t.productId||null,product_name:t.productName||null,
   title:String(t.title||'').slice(0,180),note:String(t.note||'').slice(0,500),
   stage:t.stage,due_at:dueAt,mail_enabled:enabled};
 }).filter(function(r){return /^ae-[A-Za-z0-9-]{5,87}$/.test(r.id) && r.title && ['comprar','entregar','pendiente','completada'].indexOf(r.stage)>=0});
}
async function runMailSync(){
 if(mailBusy||(!mailEnabled&&!mailForceOff)||!admin()||!mailResync)return;
 var client=mailClient();
 if(!client){mailStatus='not_connected';renderPanel();return;}
 mailBusy=true;mailResync=false;
 var isStopping=mailForceOff;
 mailForceOff=false;
 try{
  var result=await client.auth.getSession();
  var session=result&&result.data&&result.data.session;
  if(!session||!session.user||!session.user.id){mailStatus='not_connected';renderPanel();return;}
  if(session.user.id!==mailOwner){mailStatus='wrong_account';renderPanel();return;}
  mailEmail=String(session.user.email||'');
  var rows=mailRows(mailOwner,mailEnabled&&!isStopping),chunk=40;
  mailStatus='syncing';renderPanel();
  for(var i=0;i<rows.length;i+=chunk){
   var response=await client.from('ae_admin_task_email_reminders').upsert(rows.slice(i,i+chunk),{onConflict:'id'});
   if(response.error)throw response.error;
  }
  mailLastSync=Date.now();mailStatus=mailEnabled&&!isStopping?'ready':'disabled';
  if(typeof window.mostrarToast==='function'&&mailEnabled&&!isStopping)window.mostrarToast('📧 Recordatorios por mail sincronizados');
 }catch(error){
  mailStatus='error';
  console.warn('No se pudieron guardar avisos por mail de tareas',String(error&&error.message||error).slice(0,120));
 }finally{
  mailBusy=false;renderPanel();
  if(mailResync||mailForceOff)queueMailSync(mailForceOff);
 }
}
async function toggleTaskMail(){
 if(!admin())return;
 var client=mailClient();
 if(!client){alert('Para enviar recordatorios por mail necesitás conectar la cuenta segura de Administracion.');return;}
 var result;
 try{result=await client.auth.getSession();}catch(e){result=null;}
 var session=result&&result.data&&result.data.session;
 if(!session||!session.user||!session.user.id){
  close();
  if(typeof window.tiendaAuthFotosAbrir==='function')window.tiendaAuthFotosAbrir();
  else alert('Ingresá primero con tu cuenta administradora segura de Supabase.');
  return;
 }
 if(mailEnabled&&mailOwner===session.user.id){
  mailEnabled=false;mailWriteState();mailStatus='syncing';
  queueMailSync(true);renderPanel();return;
 }
 mailEnabled=true;mailOwner=session.user.id;mailEmail=String(session.user.email||'');
 mailWriteState();mailStatus='syncing';queueMailSync(false);renderPanel();
}
function mailInfo(){
 if(mailStatus==='error')return '⚠ No se pudieron sincronizar las tareas. Los correos no están confirmados; revisá la conexión y volvé a intentar.';
 if(mailStatus==='wrong_account')return '⚠ La cuenta conectada no coincide con la que activó los correos. Conectá la cuenta anterior o activá con la nueva.';
 if(mailStatus==='syncing')return '📧 Guardando tareas en la nube para enviar los correos...';
 if(mailEnabled&&mailStatus==='ready')return '✅ Correo activo para '+(mailEmail||'tu cuenta administradora')+'. Avisos al vencer, incluso con la tienda cerrada, cuando el servicio de envío esté configurado.';
 if(mailEnabled)return '📧 Correo solicitado. Para sincronizarlo, conectá tu cuenta administradora segura. No alcanza con el PIN.';
 if(mailStatus==='disabled')return 'Los avisos por correo están desactivados en esta cuenta. La campanita sigue funcionando.';
 return 'Podés recibir las tareas en el email de la cuenta administradora verificada. Para activarlo conectá primero tu sesión segura (la misma de Fotos).';
}

function shared(){return window.AEAdminSharedTasks||null}
function sharedSync(force){var s=shared();if(s)s.sync(!!force);}
function sharedChange(action,payload){var s=shared();if(s)s.change(action,payload);}
function summary(){return {pending:tasks.filter(function(t){return t.stage!=='completada'}).length,late:tasks.filter(due).length}}
function addBell(){
 var bar=document.getElementById('ae-admin-atajos');if(!bar)return;
 var bell=document.getElementById('ae-task-bell');
 if(!bell){bell=btn('🔔 Tareas',openPanel);bell.id='ae-task-bell';bar.appendChild(bell);}
 var s=summary();bell.replaceChildren();
 bell.appendChild(el('span','','🔔 Tareas'));
 if(s.pending){var count=el('span','ae-task-count'+(s.late?' ae-has-due':''),String(s.pending));count.setAttribute('aria-label',s.pending+' pendientes');bell.appendChild(count);}
 if(s.late)bell.appendChild(el('span','','⚠'));
 bell.setAttribute('aria-label','Tareas de Maxi y Angie: '+s.pending+' pendientes'+(s.late?', '+s.late+' vencidas':''));
 bell.classList.toggle('ae-task-due',s.late>0);
 bell.hidden=!admin();
}
function idFromCard(card){return card.id&&card.id.indexOf('card-')===0?card.id.slice(5):''}
function nameFor(id,card){var p=typeof window.buscarProd==='function'?window.buscarProd(id):null;var title=p&&p.nombre;if(!title){var n=card&&card.querySelector('.prod-nombre');title=n&&n.textContent}return String(title||'Producto').trim().slice(0,200)}
function addPins(){
 var grid=document.getElementById('tienda-grid');if(!grid||!admin())return;
 var cards=grid.querySelectorAll('.prod-card[id^="card-"]');
 for(var i=0;i<cards.length;i++){
  var card=cards[i],id=idFromCard(card),target=card.querySelector('.ae-admin-cost-inline')||card.querySelector('.ae-admin-quickbar');
  if(!id||!target||card.querySelector('.ae-task-pin'))continue;
  var pbtn=btn('📌 Fijar tarea',function(){openForm(this.getAttribute('data-product-id'),this.closest('.prod-card'));},'ae-task-pin');
  pbtn.setAttribute('data-product-id',id);pbtn.title='Fijar producto para comprar y entregar';
  target.insertAdjacentElement('afterend',pbtn);
 }
 updatePins();
}
function updatePins(){
 var grid=document.getElementById('tienda-grid');if(!grid)return;
 grid.querySelectorAll('.ae-task-pin').forEach(function(b){var id=b.getAttribute('data-product-id');var open=tasks.some(function(t){return t.productId===id&&!isCrmDraft(t)&&t.stage!=='completada'});b.classList.toggle('ae-task-active',open);var label=open?'📌 Tarea fijada · agregar otra':'📌 Fijar tarea';if(b.textContent!==label)b.textContent=label;});
}
function stageAdvance(t){
 if(!admin()||!t||t.stage==='completada')return;
 var expected=t.stage,product=t.productName||t.title;
 var options=expected==='comprar'?
  {symbol:'🛒',title:'Confirmar compra',message:'¿Ya compraron "'+product+'"? Quedará marcada como comprada, pero pendiente de entrega.',actionLabel:'✅ Sí, comprado'}:
  expected==='entregar'?
  {symbol:'🚚',title:'Confirmar entrega',message:'¿Ya entregaron "'+product+'"? Al confirmar, esta tarea quedará finalizada.',actionLabel:'✅ Entregado y finalizar'}:
  isCrmDraft(t)?
  {symbol:'🧾',title:'Confirmar registro en CRM',message:'¿Ya cargaste esta venta en el CRM? Sólo confirmá después de verificar que quedó registrada. La tarea pasará al historial.',actionLabel:'✅ Ya está cargada en CRM'}:
  {symbol:'✅',title:'Finalizar tarea',message:'¿Marcar esta tarea como realizada?',actionLabel:'✅ Finalizar'};
 options.onAccept=function(){
  var current=tasks.find(function(item){return item.id===t.id;});
  if(!current||current.stage!==expected){
   refresh();if(typeof window.mostrarToast==='function')window.mostrarToast('La tarea cambió. Revisá su estado actual.');return;
  }
  var previous={stage:current.stage,updatedAt:current.updatedAt,completedAt:current.completedAt};
  var next=expected==='comprar'?'entregar':'completada';
  current.stage=next;current.updatedAt=Date.now();
  current.completedAt=next==='completada'?current.updatedAt:null;
  if(!write()){current.stage=previous.stage;current.updatedAt=previous.updatedAt;current.completedAt=previous.completedAt;return;}
  sharedChange('advance',{id:current.id,expected_stage:expected});
  refresh();openPanel();
  if(typeof window.mostrarToast==='function')window.mostrarToast(expected==='comprar'?'✅ Comprado. Falta entregar.':expected==='entregar'?'✅ Entregado. Tarea finalizada.':isCrmDraft(t)?'✅ Venta marcada como cargada en CRM.':'✅ Tarea finalizada.');
 };
 taskConfirm(options);
}
function crmDraftText(t){
 return String(t.note||'')+'\n\nReferencia: '+String(t.id||'');
}
function copyCrmDraft(t){
 if(!admin()||!isCrmDraft(t))return;
 var value=crmDraftText(t);
 function ok(){if(typeof window.mostrarToast==='function')window.mostrarToast('📋 Venta copiada para cargar en CRM');}
 function fallback(){
  var input=el('textarea');input.value=value;input.style.cssText='position:fixed;top:-1000px;opacity:0';
  document.body.appendChild(input);input.select();
  try{if(document.execCommand('copy'))ok();else alert('No se pudo copiar. Seleccioná el texto de la tarea.');}
  catch(e){alert('No se pudo copiar. Seleccioná el texto de la tarea.');}
  input.remove();
 }
 if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(value).then(ok,fallback);}
 else fallback();
}
function createCrmDraft(data){
 if(!admin())return {ok:false,error:'Acceso exclusivo de Administración'};
 var nombre=String(data&&data.cliente||'').trim().slice(0,120);
 var producto=String(data&&data.producto||'').trim().slice(0,170);
 var n=Number(data&&data.cuotas);
 if(!nombre||!producto||!Number.isInteger(n)||n<1||n>60)return {ok:false,error:'Completá el cliente, producto y cuotas'};
 if(tasks.length>=MAX)return {ok:false,error:'Llegaste al límite de tareas'};
 var nro=data.numeroCrm!=null&&String(data.numeroCrm).trim()?' · #'+String(data.numeroCrm).trim().slice(0,12):'';
 var cid=String(data.clienteId||'').trim().slice(0,100);
 var nombreCliente=nombre+nro;
 var fecha=new Date().toLocaleDateString('es-AR');
 var nota=String(data.nota||'').trim().slice(0,140);
 var confirmado=data.clienteRegistrado===true;
 var lines=['🧾 VENTA PENDIENTE DE CARGAR EN CRM','Cliente: '+nombreCliente,
  'Cliente CRM: '+(confirmado?'registrado':'alta pendiente de verificar'),
  cid?'ID cliente CRM: '+cid:null,
  'Producto: '+producto,'Cuotas: '+n,'Fecha: '+fecha,
  nota?'Observaciones: '+nota:null].filter(Boolean);
 var stamp=Date.now();
 var task={id:'ae-'+stamp+'-'+Math.random().toString(36).slice(2,9),
  title:('🧾 Venta CRM · '+nombre).slice(0,180),
  note:lines.join('\n').slice(0,500),
  productId:String(data.productoId||'').slice(0,180)||null,
  productName:producto,
  stage:'pendiente',dueAt:null,createdAt:stamp,updatedAt:stamp};
 tasks.push(task);
 if(!write()){tasks.pop();return {ok:false,error:'No se pudo guardar la tarea en el dispositivo'};}
 sharedChange('create',{id:task.id,title:task.title,note:task.note,product_id:task.productId,product_name:task.productName,stage:task.stage,due_at:null,created_at:new Date(stamp).toISOString()});
 refresh();openPanel();
 return {ok:true,id:task.id};
}
function deleteFinishedTask(t){
 taskConfirm({symbol:'🗑️',title:'Eliminar del historial',message:'¿Eliminar definitivamente la tarea finalizada "'+t.title+'"?',actionLabel:'Eliminar',onAccept:function(){
  var existing=tasks.some(function(item){return item.id===t.id&&item.stage==='completada';});if(!existing)return;
  var old=tasks;tasks=tasks.filter(function(item){return item.id!==t.id;});
  if(!write()){tasks=old;return;}sharedChange('delete',{id:t.id});refresh();openPanel();
 }});
}
function renderPanel(){
 if(!panel||panel.hidden)return;
 panel.replaceChildren();var box=el('div','ae-task-dialog');box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','Tareas de Administración');
 var head=el('div','ae-task-head');head.appendChild(el('h2','','🔔 Tareas y recordatorios'));head.appendChild(btn('✕',close,'ae-task-action'));box.appendChild(head);
 var s=summary();box.appendChild(el('p','ae-task-mini',s.pending+' pendientes · '+s.late+' vencidas. '+(shared()?shared().info():'Lista local.')));
 var actions=el('div','ae-task-actions');actions.appendChild(btn('+ Anotar tarea',function(){openForm(null,null)},'ae-task-action ae-task-primary'));
 if('Notification'in window&&Notification.permission!=='granted')actions.appendChild(btn('🔔 Activar avisos',askNotifications,'ae-task-action'));
 actions.appendChild(btn('↻ Actualizar tareas',function(){sharedSync(true);},'ae-task-action'));
 actions.appendChild(btn(mailEnabled?'📧 Desactivar correos':'📧 Activar correos',toggleTaskMail,'ae-task-action'));
 if(mailStatus==='error'||mailStatus==='not_connected')actions.appendChild(btn('↻ Revisar correo',function(){queueMailSync();},'ae-task-action'));
 box.appendChild(actions);
 box.appendChild(el('p','ae-task-mini',mailInfo()));
 var list=tasks.slice().sort(order),active=list.filter(function(t){return t.stage!=='completada'}),done=list.filter(function(t){return t.stage==='completada'}).slice(0,25);
 if(!active.length)box.appendChild(el('p','ae-task-mini','No tenés tareas pendientes.'));
 [active,done].forEach(function(group,groupIndex){
  if(!group.length)return;
  box.appendChild(el('h3','ae-task-label',groupIndex===0?'Pendientes':'Historial reciente'));
  group.forEach(function(t){
   var item=el('article','ae-task-item'+(due(t)?' due':''));item.appendChild(el('strong','',t.title));
   item.appendChild(el('p','ae-task-mini',status(t)+' · '+(t.dueAt?fmtDate(t.dueAt):'Sin fecha de aviso')+(due(t)?' · ⚠ Vencida':'')));
   if(t.note)item.appendChild(el('p','ae-task-note',t.note));
   var line=el('div','ae-task-actions');
   if(t.productId)line.appendChild(btn('Ver producto',function(){jumpToProduct(t)},'ae-task-action'));
   if(isCrmDraft(t))line.appendChild(btn('📋 Copiar para CRM',function(){copyCrmDraft(t)},'ae-task-action'));
   if(t.productId&&!isCrmDraft(t)&&['comprar','entregar','completada'].indexOf(t.stage)>=0){
    var stepRow=el('div','ae-task-step-row');
    if(t.stage==='comprar'){
     stepRow.appendChild(btn('✅ Comprado',function(){stageAdvance(t)},'ae-task-action ae-task-primary'));
     var deliverPending=btn('🚚 Entregar',function(){},'ae-task-action ae-task-deliver');
     deliverPending.disabled=true;deliverPending.title='Primero marcá el producto como comprado';stepRow.appendChild(deliverPending);
    }else{
     stepRow.appendChild(el('span','ae-task-step-done','✓ Comprado'));
     if(t.stage==='entregar')stepRow.appendChild(btn('🚚 Entregar',function(){stageAdvance(t)},'ae-task-action ae-task-deliver'));
     else stepRow.appendChild(el('span','ae-task-step-done','✓ Entregado'));
    }
    line.appendChild(stepRow);
   }else if(t.stage!=='completada'){
    line.appendChild(btn(isCrmDraft(t)?'✅ Cargada en CRM':'✅ Hecha',function(){stageAdvance(t)},'ae-task-action ae-task-primary'));
   }
   if(t.stage==='completada')line.appendChild(btn('Borrar historial',function(){deleteFinishedTask(t)},'ae-task-action'));
   item.appendChild(line);box.appendChild(item);
  });
 });
 box.appendChild(el('p','ae-task-mini','Los avisos del navegador funcionan solamente mientras la tienda está abierta. Para recordatorios con la app cerrada hace falta un servicio de notificaciones.'));
 panel.appendChild(box);
}
function openPanel(){if(!admin())return;ensure();if(form)form.hidden=true;panel.hidden=false;renderPanel();sharedSync(true);}

/* Calendario Amarango propio: evita el selector nativo del sistema, que no respeta claro/oscuro. */
function taskDatePicker(){
 var wrap=el('div','ae-task-date-picker'),caption=el('span','ae-task-label','Recordarme el día y hora (opcional)');
 var trigger=btn('📅 Elegir fecha y hora',function(){calendar.hidden=!calendar.hidden;trigger.setAttribute('aria-expanded',String(!calendar.hidden));if(!calendar.hidden)render();},'ae-task-date-trigger');
 trigger.setAttribute('aria-expanded','false');
 var calendar=el('div','ae-task-calendar');calendar.hidden=true;
 var month=new Date(),selected='',hour='09',minute='00';
 month=new Date(month.getFullYear(),month.getMonth(),1);
 function pad(n){return String(n).padStart(2,'0');}
 function iso(y,m,d){return y+'-'+pad(m+1)+'-'+pad(d);}
 function updateLabel(){trigger.textContent=selected?'📅 '+fmtDate(selected+'T'+hour+':'+minute)+' · Editar':'📅 Elegir fecha y hora';trigger.appendChild(el('span','','▾'));}
 function dateGrid(){
  var grid=el('div','ae-task-calendar-grid');
  ['Lu','Ma','Mi','Ju','Vi','Sa','Do'].forEach(function(day){grid.appendChild(el('span','ae-task-calendar-weekday',day));});
  var y=month.getFullYear(),m=month.getMonth(),offset=(new Date(y,m,1).getDay()+6)%7;
  for(var i=0;i<42;i++){
   var d=new Date(y,m,1-offset+i),stamp=iso(d.getFullYear(),d.getMonth(),d.getDate());
   var day=btn(String(d.getDate()),function(){selected=this.getAttribute('data-date');updateLabel();render();},'ae-task-calendar-day');
   day.setAttribute('data-date',stamp);day.setAttribute('aria-label',d.toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}));
   day.setAttribute('aria-pressed',String(stamp===selected));
   if(d.getMonth()!==m)day.classList.add('ae-outside');
   if(stamp===selected)day.classList.add('ae-selected');
   var now=new Date();if(stamp===iso(now.getFullYear(),now.getMonth(),now.getDate()))day.classList.add('ae-today');
   grid.appendChild(day);
  }
  return grid;
 }
 function timeSelect(label,max,value,changed){
  var holder=el('label','',label),select=el('select');
  select.setAttribute('aria-label',label);
  for(var i=0;i<=max;i++){var option=el('option','',pad(i));option.value=pad(i);select.appendChild(option);}
  select.value=value;
  select.addEventListener('change',function(){changed(select.value);if(!selected){var d=new Date();selected=iso(d.getFullYear(),d.getMonth(),d.getDate());month=new Date(d.getFullYear(),d.getMonth(),1);render();}updateLabel();});
  holder.appendChild(select);return holder;
 }
 function render(){
  calendar.replaceChildren();
  var head=el('div','ae-task-calendar-head');
  head.appendChild(btn('‹',function(){month=new Date(month.getFullYear(),month.getMonth()-1,1);render();},'ae-task-nav'));
  head.appendChild(el('strong','',month.toLocaleDateString('es-AR',{month:'long',year:'numeric'})));
  head.appendChild(btn('›',function(){month=new Date(month.getFullYear(),month.getMonth()+1,1);render();},'ae-task-nav'));
  calendar.appendChild(head);calendar.appendChild(dateGrid());
  var time=el('div','ae-task-time-row');
  time.appendChild(timeSelect('Hora',23,hour,function(v){hour=v}));
  time.appendChild(timeSelect('Minutos',59,minute,function(v){minute=v}));
  calendar.appendChild(time);
  var actions=el('div','ae-task-date-bottom');
  actions.appendChild(btn('Hoy',function(){var n=new Date();selected=iso(n.getFullYear(),n.getMonth(),n.getDate());month=new Date(n.getFullYear(),n.getMonth(),1);updateLabel();render();}));
  actions.appendChild(btn('Sin aviso',function(){selected='';updateLabel();calendar.hidden=true;trigger.setAttribute('aria-expanded','false');trigger.focus();}));
  actions.appendChild(btn('Listo',function(){calendar.hidden=true;trigger.setAttribute('aria-expanded','false');trigger.focus();},'ae-task-date-done'));
  calendar.appendChild(actions);
 }
 wrap.appendChild(caption);wrap.appendChild(trigger);wrap.appendChild(calendar);
 updateLabel();
 return {element:wrap,getValue:function(){return selected?selected+'T'+hour+':'+minute:''}};
}

function openForm(productId,card){
 if(!admin())return;ensure();panel.hidden=true;form.hidden=false;form.replaceChildren();
 var product=productId?nameFor(productId,card):'',box=el('div','ae-task-dialog');box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','Anotar tarea');
 var head=el('div','ae-task-head');head.appendChild(el('h2','',productId?'📌 Fijar producto':'📋 Nueva tarea'));head.appendChild(btn('✕',close,'ae-task-action'));box.appendChild(head);
 if(productId)box.appendChild(el('p','ae-task-mini','Producto: '+product));
 function field(label,type,value,max){var wrap=el('label','ae-task-label',label),input=el(type==='textarea'?'textarea':'input','ae-task-input');if(type!=='textarea')input.type=type;input.value=value||'';if(max)input.maxLength=max;wrap.appendChild(input);box.appendChild(wrap);return input}
 var title=field('Tarea','text',productId?'Comprar y entregar: '+product:'',180);
 var note=field('Nota (opcional)','textarea','',500);note.rows=3;note.placeholder='Cliente o indicaciones para la entrega';
 var when=taskDatePicker();box.appendChild(when.element);
 box.appendChild(el('p','ae-task-mini','Se comparte con Maxi y Angie cuando la cuenta administradora está conectada. Evitá incluir datos sensibles.'));
 var actions=el('div','ae-task-actions');
 actions.appendChild(btn('Guardar tarea',function(){
  if(!admin())return;var t=title.value.trim(),n=note.value.trim(),d=when.getValue();
  if(!t){title.focus();return;}
  if(tasks.length>=MAX){alert('Llegaste al máximo de tareas guardadas. Archivá o eliminá tareas antiguas antes de crear otras.');return;}
  var stamp=Date.now(),item={id:'ae-'+stamp+'-'+Math.random().toString(36).slice(2,9),title:t.slice(0,180),note:n.slice(0,500),productId:productId||null,productName:product||null,stage:productId?'comprar':'pendiente',dueAt:d||null,createdAt:stamp,updatedAt:stamp};
  tasks.push(item);if(!write()){tasks.pop();return;}sharedChange('create',{id:item.id,title:item.title,note:item.note,product_id:item.productId,product_name:item.productName,stage:item.stage,due_at:item.dueAt?new Date(item.dueAt).toISOString():null,created_at:new Date(item.createdAt).toISOString()});form.hidden=true;refresh();if(typeof window.mostrarToast==='function')window.mostrarToast('📌 Tarea registrada');else openPanel();
 },'ae-task-action ae-task-primary'));
 actions.appendChild(btn('Cancelar',close,'ae-task-action'));box.appendChild(actions);form.appendChild(box);title.focus();
}
function askNotifications(){if(!admin()||!('Notification'in window))return;Notification.requestPermission().then(function(state){if(state!=='granted')alert('Los avisos del navegador no fueron habilitados. Las tareas siguen visibles en la campanita.');renderPanel();}).catch(function(){alert('El navegador no permite activar avisos en este momento.');});}
function jumpToProduct(t){if(!admin()||!t.productId)return;close();var card=document.getElementById('card-'+t.productId);
 if(card&&nameFor(t.productId,card).toLowerCase()===(t.productName||'').toLowerCase()){card.scrollIntoView({behavior:'smooth',block:'center'});return;}
 var input=document.getElementById('tienda-buscar');if(input&&typeof window.tiendaRender==='function'){input.value=t.productName||t.title;window.tiendaRender();setTimeout(function(){var c=document.getElementById('card-'+t.productId);if(c)c.scrollIntoView({behavior:'smooth',block:'center'});},150);}
}
function remind(){if(!admin()||document.hidden)return;var eligible=tasks.filter(due);if(!eligible.length)return;
 var seen=[];try{seen=JSON.parse(sessionStorage.getItem(NOTIFIED)||'[]');if(!Array.isArray(seen))seen=[];}catch(e){}
 var fresh=eligible.filter(function(t){return seen.indexOf(t.id)===-1;});if(!fresh.length)return;
 var ids=fresh.map(function(t){return t.id});try{sessionStorage.setItem(NOTIFIED,JSON.stringify(seen.concat(ids).slice(-MAX)));}catch(e){}
 if('Notification'in window&&Notification.permission==='granted'){try{new Notification('🐝 AmarangoElectro · '+fresh.length+' tarea(s)',{body:fresh.slice(0,2).map(function(t){return t.title}).join(' · '),tag:'amarango-admin-tasks'});}catch(e){}}
 if(typeof window.mostrarToast==='function')window.mostrarToast('🔔 Tenés '+eligible.length+' tarea(s) para revisar. Abrí Tareas.');
}
function refresh(){addBell();updatePins();if(panel&&!panel.hidden)renderPanel();remind();window.dispatchEvent(new Event('ae-admin-tasks-changed'));}
function scan(){scanQueued=false;ensure();if(!admin()){close();var grid=document.getElementById('tienda-grid');if(grid)grid.querySelectorAll('.ae-task-pin').forEach(function(b){b.remove()});}addBell();addPins();}
function scheduleScan(){if(scanQueued)return;scanQueued=true;setTimeout(scan,90);}
function start(){
 tasks=read();ensure();scan();
 var link=shared();if(link){link.init({canAccess:admin,get:function(){return tasks.slice()},set:function(next){tasks=next;try{localStorage.setItem(KEY,JSON.stringify(tasks));}catch(e){}},refresh:refresh});setTimeout(sharedSync,1200);}
 observed=document.getElementById('tienda-grid');
 if(observed)new MutationObserver(function(){scheduleScan()}).observe(observed,{childList:true,subtree:true});
 var bar=document.getElementById('ae-admin-atajos');if(bar)new MutationObserver(function(){scheduleScan()}).observe(bar,{attributes:true,attributeFilter:['style','class']});
 document.addEventListener('keydown',function(e){if(e.key==='Escape'&&confirmBox&&!confirmBox.hidden){e.preventDefault();dismissConfirm();return;}if(e.key==='Escape'&&visibleModal())close()});
 window.addEventListener('storage',function(e){if(e.key===KEY){tasks=read();refresh();if(mailEnabled)queueMailSync();}});
 window.addEventListener('focus',function(){scheduleScan();remind();if(mailEnabled)queueMailSync();sharedSync(true)});
 document.addEventListener('visibilitychange',function(){if(!document.hidden){scheduleScan();remind();if(mailEnabled)queueMailSync();sharedSync()}});
 setTimeout(function(){if(mailEnabled)queueMailSync();},1800);
 timer=setInterval(function(){scheduleScan();remind();sharedSync();if(mailEnabled&&Date.now()-mailLastSync>120000)queueMailSync()},30000);
}
function crmDraftCount(productId){
 return tasks.filter(function(t){return isCrmDraft(t)&&t.stage!=='completada'&&String(t.productId||'')===String(productId||'')}).length;
}
window.AEAdminTasks={createCrmDraft:createCrmDraft,openPanel:openPanel,refresh:refresh,crmDraftCount:crmDraftCount};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();