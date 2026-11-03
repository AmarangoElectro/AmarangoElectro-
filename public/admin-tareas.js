/* AmarangoElectro - tareas de Administracion.
 * Solo interfaz privada del modo Admin existente; almacenamiento LOCAL a este navegador.
 * No altera precios, catalogo, stock ni datos Supabase. No ofrece push con la app cerrada. */
(function(){
'use strict';
var KEY='ae_admin_tasks_v1',NOTIFIED='ae_admin_task_notified_v1',MAX=300;
var tasks=[],panel=null,form=null,observed=null,timer=null,scanQueued=false;
function admin(){return typeof window.tiendaEsAdmin!=='undefined'&&window.tiendaEsAdmin===true&&window.vistaPreviaCliente!==true&&window.vistaPreviaAsesor!==true;}
function read(){try{var x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x.filter(function(t){return t&&typeof t.id==='string'&&typeof t.title==='string'&&['comprar','entregar','pendiente','completada'].indexOf(t.stage)>=0;}).slice(-MAX):[]}catch(e){return []}}
function write(){try{localStorage.setItem(KEY,JSON.stringify(tasks));return true;}catch(e){alert('No se pudo guardar la tarea en este dispositivo. Revisá el espacio del navegador.');return false}}
function el(tag,cls,txt){var n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n}
function btn(label,fn,cls){var b=el('button',cls,label);b.type='button';b.addEventListener('click',fn);return b}
function due(t){return t.stage!=='completada'&&!!t.dueAt&&new Date(t.dueAt).getTime()<=Date.now()}
function order(a,b){if(a.stage==='completada'&&b.stage!=='completada')return 1;if(b.stage==='completada'&&a.stage!=='completada')return -1;return (a.dueAt?new Date(a.dueAt).getTime():Infinity)-(b.dueAt?new Date(b.dueAt).getTime():Infinity)||(b.createdAt||0)-(a.createdAt||0)}
function status(t){return t.stage==='comprar'?'🛒 Falta comprar':t.stage==='entregar'?'🚚 Falta entregar':t.stage==='completada'?'✅ Finalizada':'📋 Pendiente'}
function fmtDate(v){if(!v)return 'Sin fecha';var d=new Date(v);return Number.isNaN(d.getTime())?'Sin fecha':d.toLocaleString('es-AR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}
function visibleModal(){return panel&&!panel.hidden||form&&!form.hidden}
function close(){if(panel)panel.hidden=true;if(form)form.hidden=true;}
function ensure(){
 if(!document.body)return;
 if(!document.getElementById('ae-admin-tasks-css')){
  var style=el('style');style.id='ae-admin-tasks-css';
  style.textContent=[
   '#ae-task-bell{padding:6px 11px;border-radius:11px;background:var(--wh);color:var(--az);border:1px solid var(--bor);font-weight:800;font-size:.72rem;cursor:pointer;white-space:nowrap}',
   '#ae-task-bell.ae-task-due{border-color:#ff7a00;color:#ae4d00}',
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
   'body.oscuro .ae-task-pin.ae-task-active{background:#4f321c;color:#ffd0a5}body.oscuro #ae-task-bell.ae-task-due{color:#ffba76}',
   '@media(min-width:650px){.ae-task-layer{align-items:center}}'
  ].join('\n');
  document.head.appendChild(style);
 }
 if(!panel){panel=el('div','ae-task-layer');panel.hidden=true;panel.setAttribute('role','presentation');panel.addEventListener('click',function(e){if(e.target===panel)close()});document.body.appendChild(panel);}
 if(!form){form=el('div','ae-task-layer');form.hidden=true;form.setAttribute('role','presentation');form.addEventListener('click',function(e){if(e.target===form)close()});document.body.appendChild(form);}
}
function summary(){return {pending:tasks.filter(function(t){return t.stage!=='completada'}).length,late:tasks.filter(due).length}}
function addBell(){
 var bar=document.getElementById('ae-admin-atajos');if(!bar)return;
 var bell=document.getElementById('ae-task-bell');
 if(!bell){bell=btn('🔔 Tareas',openPanel);bell.id='ae-task-bell';bar.appendChild(bell);}
 var s=summary();bell.textContent='🔔 Tareas'+(s.pending?' ('+s.pending+')':'')+(s.late?' · '+s.late+' ⚠':'');bell.classList.toggle('ae-task-due',s.late>0);
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
 grid.querySelectorAll('.ae-task-pin').forEach(function(b){var id=b.getAttribute('data-product-id');var open=tasks.some(function(t){return t.productId===id&&t.stage!=='completada'});b.classList.toggle('ae-task-active',open);var label=open?'📌 Tarea fijada · agregar otra':'📌 Fijar tarea';if(b.textContent!==label)b.textContent=label;});
}
function stageAdvance(t){var expected=t.stage,next=expected==='comprar'?'entregar':'completada';if(!confirm(expected==='comprar'?'¿Ya compraron este producto? Quedará pendiente de entrega.':'¿Marcar esta tarea como finalizada?'))return; t.stage=next;t.updatedAt=Date.now();if(next==='completada')t.completedAt=Date.now();if(!write()){t.stage=expected;return;}refresh();openPanel();}
function renderPanel(){
 if(!panel||panel.hidden)return;
 panel.replaceChildren();var box=el('div','ae-task-dialog');box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','Tareas de Administración');
 var head=el('div','ae-task-head');head.appendChild(el('h2','','🔔 Tareas y recordatorios'));head.appendChild(btn('✕',close,'ae-task-action'));box.appendChild(head);
 var s=summary();box.appendChild(el('p','ae-task-mini',s.pending+' pendientes · '+s.late+' vencidas. Guardadas únicamente en este navegador.'));
 var actions=el('div','ae-task-actions');actions.appendChild(btn('+ Anotar tarea',function(){openForm(null,null)},'ae-task-action ae-task-primary'));
 if('Notification'in window&&Notification.permission!=='granted')actions.appendChild(btn('🔔 Activar avisos',askNotifications,'ae-task-action'));
 box.appendChild(actions);
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
   if(t.stage!=='completada')line.appendChild(btn(t.stage==='comprar'?'✅ Comprado':t.stage==='entregar'?'✅ Entregado':'✅ Hecha',function(){stageAdvance(t)},'ae-task-action ae-task-primary'));
   if(t.stage==='completada')line.appendChild(btn('Borrar historial',function(){if(!confirm('¿Eliminar definitivamente esta tarea finalizada?'))return;var old=tasks;tasks=tasks.filter(function(x){return x.id!==t.id});if(!write()){tasks=old;return;}refresh();},'ae-task-action'));
   item.appendChild(line);box.appendChild(item);
  });
 });
 box.appendChild(el('p','ae-task-mini','Los avisos del navegador funcionan solamente mientras la tienda está abierta. Para recordatorios con la app cerrada hace falta un servicio de notificaciones.'));
 panel.appendChild(box);
}
function openPanel(){if(!admin())return;ensure();if(form)form.hidden=true;panel.hidden=false;renderPanel();}
function openForm(productId,card){
 if(!admin())return;ensure();panel.hidden=true;form.hidden=false;form.replaceChildren();
 var product=productId?nameFor(productId,card):'',box=el('div','ae-task-dialog');box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','Anotar tarea');
 var head=el('div','ae-task-head');head.appendChild(el('h2','',productId?'📌 Fijar producto':'📋 Nueva tarea'));head.appendChild(btn('✕',close,'ae-task-action'));box.appendChild(head);
 if(productId)box.appendChild(el('p','ae-task-mini','Producto: '+product));
 function field(label,type,value,max){var wrap=el('label','ae-task-label',label),input=el(type==='textarea'?'textarea':'input','ae-task-input');if(type!=='textarea')input.type=type;input.value=value||'';if(max)input.maxLength=max;wrap.appendChild(input);box.appendChild(wrap);return input}
 var title=field('Tarea','text',productId?'Comprar y entregar: '+product:'',180);
 var note=field('Nota (opcional)','textarea','',500);note.rows=3;note.placeholder='Mayorista, cliente o detalles de la entrega';
 var when=field('Avisarme el día y hora (opcional)','datetime-local','');
 box.appendChild(el('p','ae-task-mini','Las anotaciones se guardan sólo en este dispositivo. Evitá incluir información sensible.'));
 var actions=el('div','ae-task-actions');
 actions.appendChild(btn('Guardar tarea',function(){
  if(!admin())return;var t=title.value.trim(),n=note.value.trim(),d=when.value;
  if(!t){title.focus();return;}
  if(tasks.length>=MAX){alert('Llegaste al máximo de tareas guardadas. Archivá o eliminá tareas antiguas antes de crear otras.');return;}
  var stamp=Date.now(),item={id:'ae-'+stamp+'-'+Math.random().toString(36).slice(2,9),title:t.slice(0,180),note:n.slice(0,500),productId:productId||null,productName:product||null,stage:productId?'comprar':'pendiente',dueAt:d||null,createdAt:stamp,updatedAt:stamp};
  tasks.push(item);if(!write()){tasks.pop();return;}form.hidden=true;refresh();if(typeof window.mostrarToast==='function')window.mostrarToast('📌 Tarea guardada');else openPanel();
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
function refresh(){addBell();updatePins();if(panel&&!panel.hidden)renderPanel();remind();}
function scan(){scanQueued=false;ensure();if(!admin()){close();var grid=document.getElementById('tienda-grid');if(grid)grid.querySelectorAll('.ae-task-pin').forEach(function(b){b.remove()});}addBell();addPins();}
function scheduleScan(){if(scanQueued)return;scanQueued=true;setTimeout(scan,90);}
function start(){
 tasks=read();ensure();scan();
 observed=document.getElementById('tienda-grid');
 if(observed)new MutationObserver(function(){scheduleScan()}).observe(observed,{childList:true,subtree:true});
 var bar=document.getElementById('ae-admin-atajos');if(bar)new MutationObserver(function(){scheduleScan()}).observe(bar,{attributes:true,attributeFilter:['style','class']});
 document.addEventListener('keydown',function(e){if(e.key==='Escape'&&visibleModal())close()});
 window.addEventListener('storage',function(e){if(e.key===KEY){tasks=read();refresh();}});
 window.addEventListener('focus',function(){scheduleScan();remind()});
 document.addEventListener('visibilitychange',function(){if(!document.hidden){scheduleScan();remind()}});
 timer=setInterval(function(){scheduleScan();remind()},30000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();