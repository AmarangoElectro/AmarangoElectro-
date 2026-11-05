/* AmarangoElectro — venta rápida en tarjeta, pendiente de cargar al CRM.
 * Sólo Administración. Lee clientes del CRM con sesión segura verificada.
 * No registra ventas en CRM ni cambia stock, visibilidad, costo o precio.
 */
(function(){
'use strict';
var clients=[],listReady=false,clientApi=null,overlay=null,scanTimer=0,rootObserver=null;
var STYLE_ID='ae-crm-sale-style-20261104';
function isAdmin(){return window.tiendaEsAdmin===true&&window.vistaPreviaCliente!==true&&window.vistaPreviaAsesor!==true;}
function isAdvisor(){
 // "Ver como asesor" funciona desde una sesión admin. Debe mostrar las
 // herramientas del asesor, SIN permitir acceder al CRM ni a las tareas admin.
 if(window.vistaPreviaCliente===true)return false;
 if(window.vistaPreviaAsesor===true)return true;
 return window.tiendaEsAdmin!==true&&window.adminUnlocked!==true&&window.revUnlocked===true;
}
function hasSaleAccess(){return isAdmin()||isAdvisor();}
function advisorIdentity(){
 var name='';
 try{name=String(localStorage.getItem('ae_nombre_asesor')||localStorage.getItem('ae_nombre_vendedor')||'').trim();}catch(e){}
 return name;
}
function node(tag,cls,content){var x=document.createElement(tag);if(cls)x.className=cls;if(content!==undefined)x.textContent=content;return x;}
function button(text,fn,cls){var x=node('button',cls,text);x.type='button';x.addEventListener('click',fn);return x;}
function notify(message){if(typeof window.mostrarToast==='function')window.mostrarToast(message);}
function norm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toLowerCase();}
function clientName(c){return String(c&&c.nombre||'').trim();}
// Registro local del asesor: reutilización exacta por nombre completo + celular.
// Los asesores no reciben permisos de lectura sobre perfiles privados de otros usuarios.
var DELIVERY_KEY='ae_delivery_client_history_v1';
function phoneDigits(v){return String(v||'').replace(/\D/g,'');}
function customerDeliveryKey(n,p){return String(n||'').trim().toLowerCase().replace(/\s+/g,' ')+'|'+phoneDigits(p);}
function mapsLink(v){
 try{
  var u=new URL(String(v||'').trim()),host=u.hostname.toLowerCase();
  return u.protocol==='https:'&&['google.com','www.google.com','maps.google.com','maps.app.goo.gl','goo.gl'].includes(host);
 }catch(e){return false;}
}
function readDeliveryHistory(){
 try{
  var data=JSON.parse(localStorage.getItem(DELIVERY_KEY)||'{}');
  if(!data||typeof data!=='object'||Array.isArray(data))return {};
  var fresh={};Object.keys(data).slice(-60).forEach(function(k){
   var d=data[k];
   if(d&&Number(d.savedAt)>Date.now()-90*86400000)fresh[k]=d;
  });return fresh;
 }catch(e){return {};}
}
function rememberDelivery(n,phone,record){
 var k=customerDeliveryKey(n,phone);if(k.length<12)return;
 try{
  var data=readDeliveryHistory();
  data[k]={phone:phone,alternative:record.alternative||'',map:record.map||'',
   address:record.address||'',cross:record.cross||'',locality:record.locality||'',
   mode:record.mode,savedAt:Date.now()};
  var keys=Object.keys(data).sort(function(a,b){return data[b].savedAt-data[a].savedAt;}).slice(0,40);
  var limited={};keys.forEach(function(x){limited[x]=data[x];});
  localStorage.setItem(DELIVERY_KEY,JSON.stringify(limited));
 }catch(e){}
}

function close(){if(overlay){overlay.hidden=true;overlay.replaceChildren();}}
function initStyle(){
 if(document.getElementById(STYLE_ID))return;
 var css=node('style');css.id=STYLE_ID;
 css.textContent=[
 '.ae-crm-sale-trigger{display:flex;align-items:center;justify-content:center;gap:5px;width:100%;min-height:33px;padding:6px 8px;margin:3px 0 5px;border-radius:9px;border:1px solid #8dc9a0;background:#eef9f2;color:#176333;font-family:inherit;font-size:.69rem;font-weight:850;cursor:pointer}',
 '.ae-crm-sale-trigger:focus-visible{outline:2px solid #ff7a00;outline-offset:2px}',
 '#tienda-grid .prod-card > .ae-crm-sale-trigger{flex-shrink:0;align-self:stretch;box-sizing:border-box;margin-top:8px;margin-bottom:6px;order:0}',
 '/* Asesores: botón arriba del par Ver producto / Publicar, alineados al pie de tarjeta. */',
 '#tienda-grid .prod-card > .ae-crm-sale-trigger.ae-crm-sale-advisor{margin-top:auto!important;margin-bottom:4px!important}',
 '#tienda-grid .prod-card > .ae-crm-sale-trigger.ae-crm-sale-advisor + .ae-card-actions{margin-top:0!important;padding-top:2px}',
 'body.oscuro #tienda-grid .prod-card > .ae-crm-sale-trigger{box-shadow:0 1px 8px rgba(0,0,0,.18)}',
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
 '.ae-crm-sale-suggestions[hidden]{display:none!important}.ae-crm-sale-suggestions{max-height:min(38dvh,340px);overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;touch-action:pan-y;border:1px solid var(--bor);border-radius:10px;margin-top:3px;background:var(--wh);scrollbar-width:thin}',
 '.ae-crm-sale-option{display:block;box-sizing:border-box;width:100%;text-align:left;padding:10px;border:0;border-bottom:1px solid var(--bor);background:transparent;color:var(--txt);font-family:inherit;font-size:.78rem;cursor:pointer}',
 '.ae-crm-sale-option:last-child{border-bottom:0}.ae-crm-sale-option:active{background:var(--bg)}',
 '.ae-crm-sale-install-heading{font-size:.88rem;font-weight:900;letter-spacing:-.025em;margin-top:16px;margin-bottom:4px;color:var(--az)}',
 '.ae-crm-sale-install-help{font-size:.69rem;color:var(--sub);line-height:1.45;margin:0 0 10px}',
 '.ae-crm-sale-install-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:0 0 9px}',
 '.ae-crm-sale-install-option{box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:0;min-height:77px;padding:10px 4px;gap:2px;border:1.5px solid #d7e0ec;border-radius:13px;background:#f8fafc;color:#183b68;font-family:Inter,system-ui,sans-serif;cursor:pointer;transition:border-color .12s,background .12s,box-shadow .12s}',
 '.ae-crm-sale-install-number{font-size:1.45rem;font-weight:900;letter-spacing:-.055em;line-height:1.1;font-variant-numeric:tabular-nums}',
 '.ae-crm-sale-install-name{font-size:.64rem;font-weight:800;letter-spacing:-.01em;line-height:1.2}',
 '.ae-crm-sale-install-option[aria-pressed="true"]{background:#fff0dd;border:2px solid #ff7a00;color:#903d02;box-shadow:0 0 0 2px rgba(255,122,0,.11)}',
 '.ae-crm-sale-install-option:focus-visible{outline:3px solid #0a4fbf;outline-offset:2px}',
 '.ae-crm-sale-install-selection{min-height:20px;margin:2px 0 4px;color:var(--sub);font-size:.69rem;font-weight:750}',
 '.ae-crm-sale-install-custom{margin:3px 0 9px;font-size:16px!important}',
 '.ae-crm-sale-install-custom[hidden]{display:none!important}',
 'body.oscuro .ae-crm-sale-install-option{background:#2d2521;border-color:#6a5145;color:#f6e9df}',
 'body.oscuro .ae-crm-sale-install-option[aria-pressed="true"]{background:#56321d;border-color:#ff932c;color:#ffdbb4}',
 'body.oscuro .ae-crm-sale-install-selection{color:#d4baac}',
 '@media(max-width:340px){.ae-crm-sale-install-options{grid-template-columns:repeat(2,minmax(0,1fr))}}',
 '@media(prefers-reduced-motion:reduce){.ae-crm-sale-install-option{transition:none}}',
 '.ae-crm-sale-actions{display:grid;grid-template-columns:1fr 1.4fr;gap:8px;margin-top:16px}',
 '.ae-crm-sale-actions button{min-height:43px;border-radius:11px;border:1px solid var(--bor);font:inherit;font-weight:850;font-size:.8rem;cursor:pointer}',
 '.ae-crm-sale-save{background:#ff7a00;color:#fff;border-color:#ff7a00!important}.ae-crm-sale-cancel{background:var(--bg);color:var(--txt)}',
 '.ae-crm-sale-save:disabled{opacity:.56;cursor:wait}',
 '.ae-crm-sale-info{margin-top:8px;color:var(--sub);font-size:.69rem;line-height:1.45}',
 '.ae-crm-sale-delivery-title{font-size:.88rem;font-weight:900;color:var(--az);margin:15px 0 4px;border-top:1px solid var(--bor);padding-top:12px}',
 '.ae-crm-sale-map-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:7px}',
 '.ae-crm-sale-map-actions button{flex:1 1 140px;min-height:40px;padding:7px;border-radius:10px;border:1px solid var(--bor);background:var(--bg);color:var(--az);font-weight:800;font-family:inherit;font-size:.73rem}',
 '.ae-crm-delivery-tip{font-size:.76rem;line-height:1.5;color:var(--txt);background:#f2f7ff;border:1px solid #d4e3fa;border-radius:12px;padding:11px;margin:8px 0}',
 '.ae-crm-delivery-card{background:var(--bg);border:1px solid var(--bor);border-radius:13px;padding:10px;margin-top:9px}',
 '.ae-crm-delivery-card .ae-crm-sale-label{margin-top:6px}',
 '.ae-crm-delivery-heading{font-size:.8rem;font-weight:850;color:var(--az);margin-bottom:5px}',
 '.ae-crm-delivery-paste{font-family:inherit;font-size:.76rem;font-weight:850;color:#fff;background:#0a4fbf;border:1px solid #0a4fbf;border-radius:10px;min-height:40px;padding:8px 12px;cursor:pointer}',
 '.ae-crm-delivery-manual{width:100%;text-align:left;font-family:inherit;font-weight:800;color:var(--az);background:var(--bg);border:1px solid var(--bor);border-radius:10px;padding:12px;margin-top:9px;cursor:pointer}',
 '.ae-crm-delivery-manual[aria-expanded="true"]{border-color:#ff7a00}',
 '.ae-crm-delivery-manual-panel[hidden],.ae-crm-delivery-map-panel[hidden],.ae-crm-delivery-reuse[hidden]{display:none!important}',
 '.ae-crm-delivery-reuse{margin-top:9px;border:1px solid #a4dab5;border-radius:11px;padding:10px;background:#f0fbf3;color:#17633d;font-size:.73rem}',
 '.ae-crm-delivery-reuse button{font:800 .74rem Inter,system-ui;min-height:36px;padding:6px 10px;margin-top:8px;border-radius:9px;border:1px solid #16824a;background:#e7f8ed;color:#14633b;cursor:pointer}',
 '.ae-crm-delivery-status{font-size:.73rem;min-height:20px;margin:8px 0 0;font-weight:750;overflow-wrap:anywhere}',
 'body.oscuro .ae-crm-delivery-tip{background:#30251f;border-color:#684a39;color:#f6e7dd}',
 'body.oscuro .ae-crm-delivery-reuse{background:#19382d;border-color:#367353;color:#bbf3cc}',
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
 if(!hasSaleAccess())return;
 var advisor=isAdvisor();
 var tasks=window.AEAdminTasks;
 if(!advisor&&(!tasks||typeof tasks.createCrmDraft!=='function')){notify('⚠️ Tareas todavía no terminó de cargar.');return;}
 ensure();overlay.replaceChildren();overlay.hidden=false;
 var focus=document.activeElement;
 var box=node('div','ae-crm-sale-dialog');box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','Registrar venta pendiente de CRM');
 var head=node('div','ae-crm-sale-head');
 head.appendChild(node('strong','','✅ Registrar venta'));
 head.appendChild(button('✕',close,'ae-crm-sale-cancel'));
 box.appendChild(head);
 var product=cardProduct(id,card);
 box.appendChild(node('p','ae-crm-sale-text','Producto: '+product));
 box.appendChild(node('p','ae-crm-sale-text',advisor?
 'La venta se envía a las tareas de Administración. Maxi o Angie la revisan y la cargan en CRM.':
 'Se guarda como tarea pendiente para copiar y cargar en CRM. La venta no se registra automáticamente.'));
 var advisorInput=null;
 if(advisor){
  var al=node('label','ae-crm-sale-label','Nombre del asesor *');
  advisorInput=node('input','ae-crm-sale-input');
  advisorInput.type='text';advisorInput.maxLength=100;advisorInput.required=true;advisorInput.autocomplete='name';advisorInput.value=advisorIdentity();
  advisorInput.placeholder='Tu nombre de asesor';al.appendChild(advisorInput);box.appendChild(al);
 }

 var nameLabel=node('label','ae-crm-sale-label',advisor?'Nombre y apellido del cliente':'Cliente (buscá uno existente o escribí uno nuevo)');
 var input=node('input','ae-crm-sale-input');input.type='text';input.maxLength=120;input.autocomplete='off';input.placeholder='Nombre y apellido';
 nameLabel.appendChild(input);box.appendChild(nameLabel);
 var suggestions=node('div','ae-crm-sale-suggestions');suggestions.hidden=true;box.appendChild(suggestions);
 var clientMessage=node('p','ae-crm-sale-info',advisor?
  'Administración confirmará o dará de alta al cliente en CRM. Los datos del CRM no se muestran a asesores.':
  'Consultando clientes del CRM...');
 box.appendChild(clientMessage);
 var installmentLabel=node('div','ae-crm-sale-label ae-crm-sale-install-heading','¿Cómo se pagó esta venta?');
 installmentLabel.id='ae-crm-sale-install-label';box.appendChild(installmentLabel);
 box.appendChild(node('p','ae-crm-sale-install-help','Elegí la cantidad de cuotas. Tocá una opción para seleccionarla.'));
 // Opciones visibles: accesibles con un toque, sin abrir otro menú.
 // Se conserva la equivalencia Contado=1 y Más cuotas=1..60 para el CRM.
 var selectedInstallments='';
 var installOptions=node('div','ae-crm-sale-install-options');
 installOptions.setAttribute('role','group');
 installOptions.setAttribute('aria-labelledby',installmentLabel.id);
 var selectionSummary=node('p','ae-crm-sale-install-selection','Seleccioná una opción para continuar.');
 selectionSummary.setAttribute('aria-live','polite');
 var other=node('input','ae-crm-sale-input ae-crm-sale-install-custom');
 other.type='number';other.min='1';other.max='60';other.step='1';
 other.inputMode='numeric';other.placeholder='Escribí la cantidad de cuotas (1 a 60)';
 other.setAttribute('aria-label','Cantidad personalizada de cuotas');
 other.hidden=true;
 var buttons=[];
 [['1','1','Contado'],['2','2','cuotas'],['3','3','cuotas'],['4','4','cuotas'],['6','6','cuotas'],['other','+','Más cuotas']].forEach(function(opt){
  var choose=button('',function(){
   selectedInstallments=opt[0];
   buttons.forEach(function(b){b.setAttribute('aria-pressed',String(b===choose));});
   other.hidden=opt[0]!=='other';
   selectionSummary.textContent=opt[0]==='other'?'Elegí cuántas cuotas querés registrar.':
    opt[0]==='1'?'✓ Seleccionaste: Contado (un pago)':'✓ Seleccionaste: '+opt[0]+' cuotas';
   if(!other.hidden)other.focus();
  },'ae-crm-sale-install-option');
  choose.type='button';
  choose.setAttribute('aria-pressed','false');
  choose.setAttribute('aria-label',opt[0]==='1'?'Contado, un pago':opt[0]==='other'?'Más cuotas':opt[0]+' cuotas');
  choose.appendChild(node('span','ae-crm-sale-install-number',opt[1]));
  choose.appendChild(node('span','ae-crm-sale-install-name',opt[2]));
  buttons.push(choose);installOptions.appendChild(choose);
 });
 other.addEventListener('input',function(){
  var v=Number(other.value);
  selectionSummary.textContent=Number.isInteger(v)&&v>=1&&v<=60?
   '✓ Seleccionaste: '+v+' cuotas':'Ingresá una cantidad entre 1 y 60 cuotas.';
 });
 box.appendChild(installOptions);box.appendChild(other);box.appendChild(selectionSummary);
 // Entrega: pedir la ubicación al cliente antes que una dirección extensa.
 box.appendChild(node('div','ae-crm-sale-delivery-title','🚚 ¿Dónde se entrega?'));
 function deliveryField(container,label,placeholder,max,type){
  var wrap=node('label','ae-crm-sale-label',label);
  var field=node('input','ae-crm-sale-input');field.type=type||'text';
  field.maxLength=max;field.placeholder=placeholder;field.autocomplete='off';
  wrap.appendChild(field);container.appendChild(wrap);return field;
 }
 var customerPhone=deliveryField(box,'📱 Celular del cliente *','Ej.: 11 5555-1234',30,'tel');
 customerPhone.inputMode='tel';
 var deliveryPhone=deliveryField(box,'Otro teléfono para recibir la entrega (opcional)','Si alguien más la recibe',30,'tel');
 deliveryPhone.inputMode='tel';
 box.appendChild(node('p','ae-crm-delivery-tip',
  '📍 Pedile al cliente que te mande por WhatsApp su ubicación de Google Maps. Copiá el enlace y pegalo acá. ¡No hace falta escribir calle ni entrecalles!'));
 var mapPanel=node('div','ae-crm-delivery-card ae-crm-delivery-map-panel');
 mapPanel.appendChild(node('div','ae-crm-delivery-heading','Opción recomendada · Ubicación del cliente'));
 var deliveryMap=deliveryField(mapPanel,'Enlace de Google Maps *','Mantené presionado y pegá el vínculo del cliente',500,'url');
 deliveryMap.inputMode='url';
 var mapActions=node('div','ae-crm-sale-map-actions');
 var pasteMap=button('📋 Pegar ubicación',async function(){
  try{
   if(!navigator.clipboard||!navigator.clipboard.readText)throw Error('clipboard');
   var clip=(await navigator.clipboard.readText()).trim();
   if(!mapsLink(clip))throw Error('invalid');
   deliveryMap.value=clip;deliveryMap.dispatchEvent(new Event('input',{bubbles:true}));
  }catch(e){
   deliveryMap.focus();mapStatus.textContent='Mantené presionado el campo y elegí Pegar (en Android).';
  }
 },'ae-crm-delivery-paste');
 mapActions.appendChild(pasteMap);
 var copyRequest=button('💬 Copiar pedido al cliente',async function(){
  var msg='Hola 👋 Para coordinar la entrega de AmarangoElectro 🐝, ¿podés enviarme tu ubicación desde Google Maps? Abrí Maps, marcá el domicilio de entrega, tocá Compartir y mandame el enlace por WhatsApp. ¡Gracias!';
  try{await navigator.clipboard.writeText(msg);mapStatus.textContent='✅ Mensaje copiado. Pegalo en el WhatsApp del cliente.';}
  catch(e){mapStatus.textContent='Pedile que abra Google Maps, marque el domicilio y toque Compartir → WhatsApp.';}
 },'ae-crm-sale-map-button');
 mapActions.appendChild(copyRequest);mapPanel.appendChild(mapActions);
 var mapStatus=node('p','ae-crm-delivery-status','');
 mapStatus.setAttribute('aria-live','polite');mapPanel.appendChild(mapStatus);
 box.appendChild(mapPanel);
 var manualToggle=button('▸ No me enviaron ubicación · Cargar dirección manualmente',function(){
  setDeliveryMode(deliveryMode==='manual'?'map':'manual');
 },'ae-crm-delivery-manual');
 manualToggle.setAttribute('aria-expanded','false');box.appendChild(manualToggle);
 var manualPanel=node('div','ae-crm-delivery-card ae-crm-delivery-manual-panel');
 manualPanel.hidden=true;
 var deliveryAddress=deliveryField(manualPanel,'Calle y altura *','Ej.: Av. Luro 3250, piso o departamento',180);
 var deliveryCross=deliveryField(manualPanel,'Entre calles *','Ej.: entre Rivadavia y Perú',160);
 var deliveryLocality=deliveryField(manualPanel,'Localidad *','Ej.: San Justo, Buenos Aires',100);
 box.appendChild(manualPanel);
 var reuse=node('div','ae-crm-delivery-reuse');reuse.hidden=true;box.appendChild(reuse);
 var deliveryMode='map',deliveryAccuracy=null,rememberedKey='',savedProfile=null;
 function setDeliveryMode(m){
  deliveryMode=m==='manual'?'manual':'map';
  manualPanel.hidden=deliveryMode!=='manual';
  mapPanel.hidden=deliveryMode!=='map';
  manualToggle.setAttribute('aria-expanded',String(deliveryMode==='manual'));
  manualToggle.textContent=deliveryMode==='manual'?'▾ Dirección manual · Volver a pedir ubicación':'▸ No me enviaron ubicación · Cargar dirección manualmente';
 }
 deliveryMap.addEventListener('input',function(){
  mapStatus.textContent=deliveryMap.value.trim()?(mapsLink(deliveryMap.value)?'✅ Ubicación lista para enviar a Administración.':'Revisá que sea un enlace de Google Maps.'):'';
 });
 async function checkSavedDelivery(){
  var key=customerDeliveryKey(input.value,customerPhone.value);
  if(!input.value.trim()||phoneDigits(customerPhone.value).length<8||key===rememberedKey)return;
  rememberedKey=key;savedProfile=null;reuse.hidden=true;reuse.replaceChildren();
  var local=readDeliveryHistory()[key];
  if(local)savedProfile=local;
  if(!advisor&&!savedProfile){
   try{
    var secure=window.sbFotos;
    if(secure&&secure.auth){
     var session=await secure.auth.getSession();
     if(session&&session.data&&session.data.session){
      var result=await secure.from('ae_customer_delivery_profiles')
       .select('alternate_phone,maps_url,street_address,cross_streets,locality')
       .eq('client_key',key).maybeSingle();
      if(!result.error&&result.data)savedProfile={alternative:result.data.alternate_phone||'',map:result.data.maps_url||'',address:result.data.street_address||'',cross:result.data.cross_streets||'',locality:result.data.locality||'',mode:result.data.maps_url?'map':'manual'};
     }
    }
   }catch(e){}
  }
  if(key!==customerDeliveryKey(input.value,customerPhone.value)||!savedProfile)return;
  reuse.hidden=false;
  reuse.appendChild(node('div','','✅ Encontré un domicilio anterior para este nombre y celular.'));
  reuse.appendChild(node('div','','Confirmá con el cliente que sigue siendo su dirección de entrega.'));
  reuse.appendChild(button('Usar ubicación guardada',function(){
   if(!savedProfile)return;
   deliveryPhone.value=savedProfile.alternative||'';
   deliveryMap.value=savedProfile.map||'';
   deliveryAddress.value=savedProfile.address||'';
   deliveryCross.value=savedProfile.cross||'';
   deliveryLocality.value=savedProfile.locality||'';
   setDeliveryMode(savedProfile.mode);
   mapStatus.textContent=deliveryMap.value?'✅ Se cargó el enlace guardado. Confirmá que siga siendo el correcto.':'';
   reuse.hidden=true;
  },'ae-crm-delivery-reuse-button'));
 }
 customerPhone.addEventListener('blur',checkSavedDelivery);
 input.addEventListener('blur',checkSavedDelivery);
 customerPhone.addEventListener('change',checkSavedDelivery);
 var notesLabel=node('label','ae-crm-sale-label','Observaciones (opcional)');
 var notes=node('textarea','ae-crm-sale-input');notes.rows=2;notes.maxLength=140;notes.placeholder='Ej.: entrega a coordinar';notesLabel.appendChild(notes);box.appendChild(notesLabel);
 var issue=node('p','ae-crm-sale-info','');issue.setAttribute('aria-live','polite');box.appendChild(issue);
 var actions=node('div','ae-crm-sale-actions');
 actions.appendChild(button('Cancelar',close,'ae-crm-sale-cancel'));
 var save=button('✅ Guardar pendiente',function(){saveDraft();},'ae-crm-sale-save');actions.appendChild(save);box.appendChild(actions);
 overlay.appendChild(box);
 var selected=null,loaded=false;
 function filter(){
  if(overlay.hidden||!box.isConnected)return;
  suggestions.replaceChildren();
  // Mostrar la lista completa ordenada, sin recortar resultados; se desliza dentro del panel.
  var q=norm(input.value),hits=q?clients.filter(function(c){return norm(clientName(c)).includes(q)||String(c.num||'').includes(q)||String(c.telefono||'').includes(q)}):clients.slice();
  if(!loaded||!hits.length){suggestions.hidden=true;return;}
  suggestions.scrollTop=0;
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
  try{if(advisor)return;await loadClients();loaded=true;clientMessage.textContent='✅ CRM conectado: '+clients.length+' clientes disponibles para buscar.';filter();}
  catch(err){loaded=false;listReady=false;clientApi=null;clientMessage.textContent='⚠️ '+String(err.message||err)+' Podés guardar la tarea, pero no se dará de alta el cliente en CRM.';}
 })();
 async function saveDraft(){
  if(!hasSaleAccess()||advisor!==isAdvisor())return;
  var name=input.value.trim().replace(/\s+/g,' ');
  var count=Number(selectedInstallments==='other'?other.value:selectedInstallments);
  if(name.length<2){issue.textContent='Ingresá el nombre del cliente.';input.focus();return;}
  if(!Number.isInteger(count)||count<1||count>60){issue.textContent='Elegí una cantidad válida de cuotas.';(selectedInstallments==='other'?other:buttons[0]).focus();return;}
  var customerMobile=customerPhone.value.trim(),phone=deliveryPhone.value.trim();
  var address=deliveryMode==='manual'?deliveryAddress.value.trim():'';
  var cross=deliveryMode==='manual'?deliveryCross.value.trim():'';
  var locality=deliveryMode==='manual'?deliveryLocality.value.trim():'';
  var mapUrl=deliveryMode==='map'?deliveryMap.value.trim():'';
  var digits=phoneDigits(customerMobile);
  if(digits.length<8||digits.length>15){issue.textContent='Ingresá el celular del cliente para identificar y recordar su domicilio.';customerPhone.focus();return;}
  if(phone&&[phoneDigits(phone).length<8,phoneDigits(phone).length>15].some(Boolean)){issue.textContent='Revisá el teléfono alternativo.';deliveryPhone.focus();return;}
  if(deliveryMode==='map'){
   if(!mapsLink(mapUrl)){issue.textContent='Pedile al cliente la ubicación y pegá un enlace válido de Google Maps, o abrí Dirección manual.';deliveryMap.focus();return;}
  }else{
   if(address.length<5){issue.textContent='Indicá calle y altura.';deliveryAddress.focus();return;}
   if(cross.length<4){issue.textContent='Indicá las entrecalles.';deliveryCross.focus();return;}
   if(locality.length<3){issue.textContent='Indicá la localidad.';deliveryLocality.focus();return;}
  }
  issue.textContent='';save.disabled=true;
  if(advisor){
   var who=advisorInput&&advisorInput.value.trim().replace(/\s+/g,' ');
   if(!who||who.length<2){issue.textContent='Identificate con tu nombre de asesor.';save.disabled=false;advisorInput.focus();return;}
   var api=window.sbCalc;
   if(!api||typeof api.from!=='function'){
    issue.textContent='No hay conexión con la tienda. No se envió la venta.';
    save.disabled=false;return;
   }
   var payload={advisor_name:who.slice(0,100),
    advisor_id:(function(){try{return String(localStorage.getItem('ae_asesor_id')||'').slice(0,100)||null;}catch(e){return null;}})(),
    customer_name:name.slice(0,120),product_id:id.slice(0,180),product_name:product,
    installments:count,note:notes.value.trim().slice(0,140),source:'tienda_asesores',
    customer_phone:customerMobile,
    delivery_phone:phone||null,delivery_address:address||null,delivery_cross_streets:cross||null,
    delivery_locality:locality||null,delivery_maps_url:mapUrl||null,
    delivery_accuracy_m:mapUrl&&deliveryAccuracy?deliveryAccuracy:null};
   try{
    var response=await api.from('ae_advisor_sale_submissions').insert(payload);
    if(response.error)throw response.error;
    try{localStorage.setItem('ae_nombre_asesor',who.slice(0,100));}catch(e){}
    rememberDelivery(name,customerMobile,{alternative:phone,map:mapUrl,address:address,cross:cross,locality:locality,mode:deliveryMode});
    close();
    notify('✅ Venta informada. Quedó pendiente para Administración.');
   }catch(err){
    issue.textContent='No se confirmó el envío de la venta. Revisá la conexión y probá otra vez.';
    save.disabled=false;
   }
   return;
  }
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
   clienteRegistrado:!!crmClient,producto:product,productoId:id,cuotas:count,nota:notes.value,
   celularCliente:customerMobile,telefonoEntrega:phone,direccionEntrega:address,entreCalles:cross,
   localidadEntrega:locality,ubicacionMaps:mapUrl,precisionGps:deliveryAccuracy});
  if(!res||!res.ok){issue.textContent='⚠️ '+(res&&res.error||'No se pudo guardar la tarea');save.disabled=false;return;}
  rememberDelivery(name,customerMobile,{alternative:phone,map:mapUrl,address:address,cross:cross,locality:locality,mode:deliveryMode});
  close();queueScan();notify(createError?'🧾 Venta pendiente guardada. Cliente aún pendiente de alta en CRM.':'🧾 Venta pendiente guardada en Tareas.');
  if(focus&&focus.isConnected)focus.focus();
 }
 setTimeout(function(){if(!overlay.hidden)input.focus();},0);
}
function inject(){
 if(!document.body)return;
 if(!hasSaleAccess()){
  document.querySelectorAll('.ae-crm-sale-trigger').forEach(function(b){b.remove();});
  close();return;
 }
 var grid=document.getElementById('tienda-grid');if(!grid)return;
 var cards=grid.querySelectorAll('.prod-card[id^="card-"]');
 cards.forEach(function(card){
  var previous=card.querySelector('.ae-crm-sale-trigger');
  if(previous){
   if(isAdvisor()){
    // También reubicar botones ya montados sin duplicarlos ni mover el título.
    var actions=card.querySelector('.ae-card-actions');
    if(actions && (previous.nextElementSibling!==actions || previous.parentElement!==actions.parentElement))actions.insertAdjacentElement('beforebegin',previous);
    previous.classList.add('ae-crm-sale-advisor');
   }else previous.classList.remove('ae-crm-sale-advisor');
   var amount=isAdmin()&&window.AEAdminTasks&&typeof window.AEAdminTasks.crmDraftCount==='function'?window.AEAdminTasks.crmDraftCount(card.id.slice(5)):0;
   var label=isAdvisor()?'✅ Informar venta':amount?'🧾 Vendido · CRM ('+amount+')':'✅ Venta';
   if(previous.textContent!==label)previous.textContent=label;
   previous.classList.toggle('ae-crm-sale-pending',amount>0);
   previous.title=isAdvisor()?'Informar venta a Administración':amount?'Venta anotada, pendiente de cargar en CRM. Tocá para registrar otra.':'Registrar venta pendiente de cargar al CRM';
   return;
  }
  var id=card.id.slice(5);
  var advisor=isAdvisor();
  var target=advisor
    ? card.querySelector('.ae-card-actions') // delante de «Ver producto» y «Publicar»
    : (card.querySelector('.ae-task-pin')||card.querySelector('.ae-admin-cost-inline')||card.querySelector('.ae-admin-quickbar'));
  if(!target||!id)return;
  var b=button(isAdvisor()?'✅ Informar venta':'✅ Venta',function(e){e.preventDefault();e.stopPropagation();open(id,card);},'ae-crm-sale-trigger');
  b.title='Registrar venta pendiente de cargar al CRM';
  b.setAttribute('aria-label','Registrar venta del producto '+cardProduct(id,card));
  if(advisor){
   b.classList.add('ae-crm-sale-advisor');
   target.insertAdjacentElement('beforebegin',b);
  }else target.insertAdjacentElement('afterend',b);
  var amount=isAdmin()&&window.AEAdminTasks&&typeof window.AEAdminTasks.crmDraftCount==='function'?window.AEAdminTasks.crmDraftCount(id):0;
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
 window.addEventListener('storage',queueScan);
 document.addEventListener('keydown',function(e){if(e.key==='Escape'&&overlay&&!overlay.hidden){e.preventDefault();close();}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();