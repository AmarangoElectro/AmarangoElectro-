/* AmarangoElectro — venta rápida en tarjeta, pendiente de cargar al CRM.
 * Sólo Administración. Lee clientes del CRM con sesión segura verificada.
 * No registra ventas en CRM ni cambia stock, visibilidad, costo o precio.
 */
(function(){
'use strict';
var clients=[],listReady=false,clientApi=null,overlay=null,scanTimer=0,rootObserver=null;
var STYLE_ID='ae-crm-sale-style-20261104';
function isAdmin(){return window.tiendaEsAdmin===true&&window.vistaPreviaCliente!==true&&window.vistaPreviaAsesor!==true;}
function node(tag,cls,content){var x=document.createElement(tag);if(cls)x.className=cls;if(content!==undefined)x.textContent=content;return x;}
function button(text,fn,cls){var x=node('button',cls,text);x.type='button';x.addEventListener('click',fn);return x;}
function notify(message){if(typeof window.mostrarToast==='function')window.mostrarToast(message);}
function norm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toLowerCase();}
function clientName(c){return String(c&&c.nombre||'').trim();}
function close(){if(overlay){overlay.hidden=true;overlay.replaceChildren();}}
function initStyle(){
 if(document.getElementById(STYLE_ID))return;
 var css=node('style');css.id=STYLE_ID;
 css.textContent=[
 '.ae-crm-sale-trigger{display:flex;align-items:center;justify-content:center;gap:5px;width:100%;min-height:33px;padding:6px 8px;margin:3px 0 5px;border-radius:9px;border:1px solid #8dc9a0;background:#eef9f2;color:#176333;font-family:inherit;font-size:.69rem;font-weight:850;cursor:pointer}',
 '.ae-crm-sale-trigger:focus-visible{outline:2px solid #ff7a00;outline-offset:2px}',
 'body.oscuro .ae-crm-sale-trigger{background:#19382d;border-color:#367353;color:#bbf3cc}',
 '.ae-crm-sale-trigger.ae-crm-sale-pending{border-color:#f4b45e;background:#fff1d9;color:#815017}',
 'body.oscuro .ae-crm-sale-trigger.ae-crm-sale-pending{background:#413024;border-color:#c48c51;color:#ffd39d}',
 '.ae-crm-sale-layer[hidden]{display:none!important}.ae-crm-sale-layer{position:fixed;inset:0;z-index:7550;display:flex;align-items:center;justify-content:center;background:rgba(3,11,31,.72);padding:12px;backdrop-filter:blur(3px)}',
 '.ae-crm-sale-dialog{box-sizing:border-box;width:100%;max-width:440px;max-height:90dvh;overflow-y:auto;border:1px solid var(--bor);border-radius:18px;background:var(--wh);color:var(--txt);padding:18px;box-shadow:0 18px 50px #0006;font-family:inherit;overscroll-behavior:contain}',
 '.ae-crm-sale-head{display:flex;justify-content:space-between;gap:9px;align-items:start}.ae-crm-sale-head strong{font-size:1.05rem;color:var(--az);font-weight:900}',
 '.ae-crm-sale-text{margin:9px 0;color:var(--sub);font-size:.75rem;line-height:1.45;overflow-wrap:anywhere}',
 '.ae-crm-sale-label{display:block;margin:12px 0 4px;font-size:.74rem;font-weight:800;color:var(--txt)}',
 '.ae-crm-sale-input{box-sizing:border-box;width:100%;min-height:43px;border:1.5px solid var(--bor);border-radius:10px;background:var(--bg);color:var(--txt);padding:10px;font-size:.87rem;font-family:inherit}',
 '.ae-crm-sale-input:focus-visible{outline:2px solid #ff7a00;outline-offset:1px}',
 '.ae-crm-sale-suggestions[hidden]{display:none!important}.ae-crm-sale-suggestions{max-height:174px;overflow-y:auto;border:1px solid var(--bor);border-radius:10px;margin-top:3px;background:var(--wh)}',
 '.ae-crm-sale-option{display:block;box-sizing:border-box;width:100%;text-align:left;padding:10px;border:0;border-bottom:1px solid var(--bor);background:transparent;color:var(--txt);font-family:inherit;font-size:.78rem;cursor:pointer}',
 '.ae-crm-sale-option:last-child{border-bottom:0}.ae-crm-sale-option:active{background:var(--bg)}',
 '.ae-crm-sale-actions{display:grid;grid-template-columns:1fr 1.4fr;gap:8px;margin-top:16px}',
 '.ae-crm-sale-actions button{min-height:43px;border-radius:11px;border:1px solid var(--bor);font:inherit;font-weight:850;font-size:.8rem;cursor:pointer}',
 '.ae-crm-sale-save{background:#ff7a00;color:#fff;border-color:#ff7a00!important}.ae-crm-sale-cancel{background:var(--bg);color:var(--txt)}',
 '.ae-crm-sale-save:disabled{opacity:.56;cursor:wait}',
 '.ae-crm-sale-info{margin-top:8px;color:var(--sub);font-size:.69rem;line-height:1.45}',
 'body.oscuro .ae-crm-sale-dialog{background:#241915;border-color:#5f4537;color:#fff3ea}body.oscuro .ae-crm-sale-suggestions{background:#241915;border-color:#5f4537}',
 '@media(prefers-reduced-motion:reduce){.ae-crm-sale-layer{backdrop-filter:none}}'
 ].join('\n');
 document.head.appendChild(css);
}
function ensure(){initStyle();if(!overlay){overlay=node('div','ae-crm-sale-layer');overlay.hidden=true;overlay.addEventListener('click',function(e){if(e.target===overlay)close();});document.body.appendChild(overlay);}}
async function getSecureCrm(){
 var sb=window.sbFotos;
 if(!sb||!sb.auth||typeof sb.auth.getSession!=='function')throw Error('Conectá la sesión segura de Administración (la misma que usa Fotos y Tareas).');
 var x=await sb.auth.getSession();
 if(x.error||!x.data||!x.data.session||!x.data.session.user)throw Error('Ingresá con la cuenta segura de Administración para consultar el CRM.');
 // El RPC existente verifica en el servidor que el usuario sea owner/admin.
 var access=await sb.rpc('ae_admin_shared_task_action',{p_action:'list',p_payload:{}});
 if(access.error)throw Error('La cuenta conectada no tiene acceso verificado a las tareas de Administración.');
 return sb;
}
async function loadClients(){
 var sb=await getSecureCrm();
 var res=await sb.from('clientes').select('id,nombre,num,telefono,eliminado_en').is('eliminado_en',null).order('nombre',{ascending:true}).limit(2000);
 if(res.error)throw Error('No se pudo consultar clientes del CRM: '+res.error.message);
 clients=(res.data||[]).filter(function(c){return c&&c.id&&clientName(c);});
 clientApi=sb;listReady=true;
 return clients;
}
function clientLabel(c){
 var num=c.num!=null?'#'+c.num+' · ':'';
 var tel=String(c.telefono||'').replace(/\D/g,'');
 return num+clientName(c)+(tel?' · tel. •••'+tel.slice(-4):'');
}
async function addClient(name){
 if(!listReady||!clientApi)throw Error('Sin conexión verificada al CRM; el cliente quedará pendiente de alta.');
 // Vuelve a consultar por nombre antes del alta para no crear repetidos.
 var check=await clientApi.from('clientes').select('id,nombre,num').ilike('nombre',name).is('eliminado_en',null).limit(15);
 if(check.error)throw Error('No se pudo verificar si el cliente ya existe.');
 var existing=(check.data||[]).filter(function(c){return norm(clientName(c))===norm(name);});
 if(existing.length)return {duplicate:true,found:existing};
 var highest=clients.reduce(function(n,c){return Math.max(n,Number(c.num)||0)},0);
 var id='c'+Date.now()+'-'+Math.random().toString(36).slice(2,8);
 var date=new Date(),alta=date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
 // Coincide con el formato de cliente que utiliza el CRM actual.
 var insert=await clientApi.from('clientes').insert({id:id,nombre:name,num:highest+1,alta:alta}).select('id,nombre,num').single();
 if(insert.error||!insert.data)throw Error('El CRM no confirmó el alta del nuevo cliente.');
 clients.push(insert.data);
 return {client:insert.data};
}
function cardProduct(id,card){
 var p=typeof window.buscarProd==='function'?window.buscarProd(id):null;
 var text=p&&p.nombre;
 if(!text){var el=card&&card.querySelector('.prod-nombre');text=el&&el.textContent;}
 return String(text||'Producto').trim().slice(0,170);
}
function open(id,card){
 if(!isAdmin())return;
 var tasks=window.AEAdminTasks;
 if(!tasks||typeof tasks.createCrmDraft!=='function'){notify('⚠️ Tareas todavía no terminó de cargar.');return;}
 ensure();overlay.replaceChildren();overlay.hidden=false;
 var focus=document.activeElement;
 var box=node('div','ae-crm-sale-dialog');box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','Registrar venta pendiente de CRM');
 var head=node('div','ae-crm-sale-head');
 head.appendChild(node('strong','','✅ Registrar venta'));
 head.appendChild(button('✕',close,'ae-crm-sale-cancel'));
 box.appendChild(head);
 var product=cardProduct(id,card);
 box.appendChild(node('p','ae-crm-sale-text','Producto: '+product));
 box.appendChild(node('p','ae-crm-sale-text','Se guarda como tarea pendiente para copiar y cargar en CRM. La venta no se registra automáticamente.'));
 var nameLabel=node('label','ae-crm-sale-label','Cliente (buscá uno existente o escribí uno nuevo)');
 var input=node('input','ae-crm-sale-input');input.type='text';input.maxLength=120;input.autocomplete='off';input.placeholder='Nombre y apellido';
 nameLabel.appendChild(input);box.appendChild(nameLabel);
 var suggestions=node('div','ae-crm-sale-suggestions');suggestions.hidden=true;box.appendChild(suggestions);
 var clientMessage=node('p','ae-crm-sale-info','Consultando clientes del CRM...');box.appendChild(clientMessage);
 var installmentLabel=node('label','ae-crm-sale-label','¿En cuántas cuotas se vendió?');
 var select=node('select','ae-crm-sale-input');
 [['','Elegí las cuotas'],['1','Contado (1 pago)'],['3','3 cuotas'],['6','6 cuotas'],['12','12 cuotas'],['other','Otro número']].forEach(function(a){var opt=node('option','',a[1]);opt.value=a[0];select.appendChild(opt)});
 installmentLabel.appendChild(select);box.appendChild(installmentLabel);
 var other=node('input','ae-crm-sale-input');other.type='number';other.min='1';other.max='60';other.step='1';other.placeholder='Cantidad de cuotas (1 a 60)';other.hidden=true;other.style.marginTop='7px';box.appendChild(other);
 select.addEventListener('change',function(){other.hidden=select.value!=='other';if(!other.hidden)other.focus();});
 var notesLabel=node('label','ae-crm-sale-label','Observaciones (opcional)');
 var notes=node('textarea','ae-crm-sale-input');notes.rows=2;notes.maxLength=140;notes.placeholder='Ej.: entrega a coordinar';notesLabel.appendChild(notes);box.appendChild(notesLabel);
 var issue=node('p','ae-crm-sale-info','');issue.setAttribute('aria-live','polite');box.appendChild(issue);
 var actions=node('div','ae-crm-sale-actions');
 actions.appendChild(button('Cancelar',close,'ae-crm-sale-cancel'));
 var save=button('✅ Guardar pendiente',function(){saveDraft();},'ae-crm-sale-save');actions.appendChild(save);box.appendChild(actions);
 overlay.appendChild(box);
 var selected=null,activeList=[],loaded=false,disposed=false;
 function filter(){
  if(overlay.hidden||!box.isConnected)return;
  suggestions.replaceChildren();
  var q=norm(input.value),hits=q?clients.filter(function(c){return norm(clientName(c)).includes(q)||String(c.num||'').includes(q)}).slice(0,9):clients.slice(0,5);
  activeList=hits;
  if(!loaded||!hits.length){suggestions.hidden=true;return;}
  hits.forEach(function(c){
   var option=button(clientLabel(c),function(){
    selected=c;input.value=clientName(c);suggestions.hidden=true;
    clientMessage.textContent='✅ Cliente del CRM seleccionado: '+clientLabel(c);
   },'ae-crm-sale-option');
   suggestions.appendChild(option);
  });
  suggestions.hidden=false;
 }
 input.addEventListener('input',function(){selected=null;clientMessage.textContent=loaded?'Seleccioná un cliente sugerido o ingresá un nombre nuevo.':'Clientes del CRM no disponibles; se guardará el nombre en la tarea.';filter();});
 input.addEventListener('focus',filter);
 (async function(){
  try{await loadClients();loaded=true;clientMessage.textContent='✅ CRM conectado: '+clients.length+' clientes disponibles para buscar.';filter();}
  catch(err){loaded=false;listReady=false;clientApi=null;clientMessage.textContent='⚠️ '+String(err.message||err)+' Podés guardar la tarea, pero no se dará de alta el cliente en CRM.';}
 })();
 async function saveDraft(){
  if(!isAdmin())return;
  var name=input.value.trim().replace(/\s+/g,' ');
  var count=Number(select.value==='other'?other.value:select.value);
  if(name.length<2){issue.textContent='Ingresá el nombre del cliente.';input.focus();return;}
  if(!Number.isInteger(count)||count<1||count>60){issue.textContent='Elegí una cantidad válida de cuotas.';select.focus();return;}
  issue.textContent='';save.disabled=true;
  var crmClient=selected,createError='';
  if(loaded){
   var exact=clients.filter(function(c){return norm(clientName(c))===norm(name);});
   if(!crmClient&&exact.length){
    // Sin selección explícita puede haber homónimos: no suponer cuál.
    issue.textContent='Ese cliente ya existe. Seleccionalo de las sugerencias antes de guardar.';
    save.disabled=false;input.focus();filter();return;
   }
   if(!crmClient){
    try{
     var result=await addClient(name);
     if(result.duplicate){
      issue.textContent='El cliente ya está registrado en CRM. Volvé a buscarlo y seleccionalo.';
      clients=clients.concat(result.found);save.disabled=false;filter();return;
     }
     crmClient=result.client;
    }catch(err){createError=String(err.message||err);}
   }
  }
  var res=tasks.createCrmDraft({cliente:crmClient?clientName(crmClient):name,
   numeroCrm:crmClient&&crmClient.num,clienteId:crmClient&&crmClient.id,
   clienteRegistrado:!!crmClient,producto:product,productoId:id,cuotas:count,nota:notes.value});
  if(!res||!res.ok){issue.textContent='⚠️ '+(res&&res.error||'No se pudo guardar la tarea');save.disabled=false;return;}
  close();queueScan();notify(createError?'🧾 Venta pendiente guardada. Cliente aún pendiente de alta en CRM.':'🧾 Venta pendiente guardada en Tareas.');
  if(focus&&focus.isConnected)focus.focus();
 }
 setTimeout(function(){if(!overlay.hidden)input.focus();},0);
}
function inject(){
 if(!document.body)return;
 if(!isAdmin()){
  document.querySelectorAll('.ae-crm-sale-trigger').forEach(function(b){b.remove();});
  close();return;
 }
 var grid=document.getElementById('tienda-grid');if(!grid)return;
 var cards=grid.querySelectorAll('.prod-card[id^="card-"]');
 cards.forEach(function(card){
  var previous=card.querySelector('.ae-crm-sale-trigger');
  if(previous){
   var amount=window.AEAdminTasks&&typeof window.AEAdminTasks.crmDraftCount==='function'?window.AEAdminTasks.crmDraftCount(card.id.slice(5)):0;
   var label=amount?'🧾 Vendido · CRM ('+amount+')':'✅ Venta';
   if(previous.textContent!==label)previous.textContent=label;
   previous.classList.toggle('ae-crm-sale-pending',amount>0);
   previous.title=amount?'Venta anotada, pendiente de cargar en CRM. Tocá para registrar otra.':'Registrar venta pendiente de cargar al CRM';
   return;
  }
  var id=card.id.slice(5);
  var target=card.querySelector('.ae-task-pin')||card.querySelector('.ae-admin-cost-inline')||card.querySelector('.ae-admin-quickbar');
  if(!target||!id)return;
  var b=button('✅ Venta',function(e){e.preventDefault();e.stopPropagation();open(id,card);},'ae-crm-sale-trigger');
  b.title='Registrar venta pendiente de cargar al CRM';
  b.setAttribute('aria-label','Registrar venta del producto '+cardProduct(id,card));
  target.insertAdjacentElement('afterend',b);
  var amount=window.AEAdminTasks&&typeof window.AEAdminTasks.crmDraftCount==='function'?window.AEAdminTasks.crmDraftCount(id):0;
  if(amount){b.textContent='🧾 Vendido · CRM ('+amount+')';b.classList.add('ae-crm-sale-pending');b.title='Venta anotada, pendiente de cargar en CRM. Tocá para registrar otra.';}
 });
}
function queueScan(){if(scanTimer)return;scanTimer=setTimeout(function(){scanTimer=0;inject();},120);}
function start(){
 ensure();inject();
 var grid=document.getElementById('tienda-grid');
 if(grid){rootObserver=new MutationObserver(queueScan);rootObserver.observe(grid,{childList:true,subtree:true});}
 new MutationObserver(queueScan).observe(document.body,{attributes:true,attributeFilter:['class']});
 window.addEventListener('focus',queueScan);
 window.addEventListener('ae-admin-tasks-changed',queueScan);
 document.addEventListener('keydown',function(e){if(e.key==='Escape'&&overlay&&!overlay.hidden){e.preventDefault();close();}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();