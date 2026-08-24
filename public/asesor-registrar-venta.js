/* AmarangoElectro · registro de ventas para asesores
   - visible solo en sesión asesor/revendedor
   - registra la venta en el historial compartido que ve Administración
   - identifica automáticamente al asesor por su sesión personal
   - forma de pago: contado o crédito personal, sin inventar planes de cuotas
   - no expone costos, márgenes ni datos internos
*/
(function(){
  'use strict';
  var VERSION='asesor-venta-2026-08-24-2';
  if(window.__AE_ASESOR_VENTA__===VERSION)return;
  window.__AE_ASESOR_VENTA__=VERSION;

  function ls(k){try{return localStorage.getItem(k)||'';}catch(e){return '';}}
  function rolAsesor(){
    try{
      if(window.vistaPreviaCliente===true)return false;
      if(window.tiendaEsAdmin===true||window.adminUnlocked===true)return false;
      if(document.body&&document.body.classList.contains('rol-admin'))return false;
      if(window.revUnlocked===true)return true;
      if(document.body&&document.body.classList.contains('rol-revendedor'))return true;
      return /^(asesor|revendedor|vendedor)$/i.test(String(ls('ae_rol')||''));
    }catch(e){return false;}
  }
  function asesorActual(){
    return {
      id:String(ls('ae_asesor_id')||''),
      nombre:String(ls('ae_nombre_asesor')||'Vendedor').trim()||'Vendedor'
    };
  }
  function esc(s){return String(s||'').replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]);});}
  function dinero(n){try{return new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(Number(n)||0);}catch(e){return '$'+Math.round(Number(n)||0);}}
  function num(id){var el=document.getElementById(id);return Number(String(el&&el.value||'').replace(/[^0-9.,-]/g,'').replace(/\./g,'').replace(',','.'))||0;}
  function val(id){var el=document.getElementById(id);return String(el&&el.value||'').trim();}

  function estilos(){
    if(document.getElementById('ae-asesor-venta-style'))return;
    var s=document.createElement('style');s.id='ae-asesor-venta-style';s.textContent=`
      #ae-asesor-venta-fab{position:fixed;left:14px;bottom:88px;z-index:336;border:0;border-radius:999px;background:linear-gradient(135deg,#FF7A00,#ff9738);color:#fff;padding:11px 15px;font:900 .72rem/1 inherit;box-shadow:0 8px 24px rgba(255,122,0,.28);display:none;align-items:center;gap:7px;-webkit-tap-highlight-color:transparent}
      body.ae-rol-asesor #ae-asesor-venta-fab{display:flex}
      #ae-asesor-venta-overlay{position:fixed;inset:0;z-index:17500;background:rgba(2,12,35,.60);backdrop-filter:blur(7px);display:none;align-items:flex-end;justify-content:center}
      #ae-asesor-venta-overlay.on{display:flex}
      .ae-av-sheet{width:min(100%,500px);max-height:92dvh;overflow:auto;background:#f7f9fc;border-radius:24px 24px 0 0;box-shadow:0 -22px 70px rgba(0,0,0,.32);padding:15px 15px calc(18px + env(safe-area-inset-bottom))}
      .ae-av-head{display:flex;align-items:center;gap:10px;margin-bottom:12px}.ae-av-headtxt{flex:1;min-width:0}.ae-av-title{font-size:1rem;font-weight:950;color:#0B2D6B}.ae-av-sub{font-size:.66rem;color:#667085;margin-top:2px}.ae-av-x{width:38px;height:38px;border-radius:11px;border:1px solid #dce3ed;background:#fff;color:#334155;font-size:1.15rem}
      .ae-av-card{background:#fff;border:1px solid #e1e6ee;border-radius:16px;padding:12px;margin-bottom:10px;box-shadow:0 3px 12px rgba(11,45,107,.05)}
      .ae-av-sec{font-size:.66rem;font-weight:950;color:#0B2D6B;text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px}
      .ae-av-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ae-av-field{min-width:0}.ae-av-field.full{grid-column:1/-1}.ae-av-field label{display:block;font-size:.62rem;font-weight:850;color:#475569;margin:0 0 4px 2px}.ae-av-field input,.ae-av-field select{width:100%;box-sizing:border-box;border:1.5px solid #d9dfe9;border-radius:11px;background:#fff;padding:10px 11px;font:700 .76rem inherit;color:#182235;outline:none}.ae-av-field input:focus,.ae-av-field select:focus{border-color:#FF7A00;box-shadow:0 0 0 3px rgba(255,122,0,.08)}
      .ae-av-paynote{grid-column:1/-1;font-size:.57rem;color:#7b8492;line-height:1.4;background:#f7f9fc;border-radius:9px;padding:7px 8px}
      .ae-av-seller{display:flex;align-items:center;gap:8px;background:#eef4ff;border:1px solid #d7e5fb;border-radius:12px;padding:9px 10px;margin-bottom:10px}.ae-av-seller b{color:#0B2D6B;font-size:.73rem}.ae-av-seller span{font-size:.62rem;color:#667085}
      .ae-av-total{display:flex;justify-content:space-between;align-items:center;background:#0B2D6B;color:#fff;border-radius:13px;padding:11px 12px;margin-top:9px}.ae-av-total span{font-size:.68rem;font-weight:800}.ae-av-total b{font-size:1rem;color:#ffb15e}
      #ae-av-save{width:100%;border:0;border-radius:13px;padding:13px;background:#16a34a;color:#fff;font:950 .82rem inherit;box-shadow:0 7px 18px rgba(22,163,74,.20)}#ae-av-save[disabled]{opacity:.55}
      .ae-av-note{text-align:center;font-size:.59rem;color:#7b8492;line-height:1.35;margin-top:8px}
      #ae-av-toast{position:fixed;left:50%;bottom:96px;transform:translate(-50%,18px);z-index:18000;max-width:88vw;background:#0B2D6B;color:#fff;border-bottom:3px solid #FF7A00;border-radius:13px;padding:10px 14px;font:850 .7rem inherit;box-shadow:0 10px 30px rgba(0,0,0,.27);opacity:0;pointer-events:none;transition:.18s}#ae-av-toast.on{opacity:1;transform:translate(-50%,0)}
      .ae-av-menurow{display:flex!important;align-items:center!important;gap:12px!important;padding:14px 4px!important;border-bottom:1px solid rgba(255,255,255,.08)!important;cursor:pointer!important;color:inherit!important}
      @media(max-width:360px){#ae-asesor-venta-fab{left:10px;bottom:84px;padding:10px 12px}.ae-av-sheet{padding-left:11px;padding-right:11px}.ae-av-grid{gap:7px}}
    `;document.head.appendChild(s);
  }

  function opcionesFormaPago(){
    return '<option value="contado">Contado</option><option value="credito_personal">Crédito personal / financiado</option>';
  }

  function crearUI(){
    estilos();
    if(!document.getElementById('ae-asesor-venta-fab')){
      var fab=document.createElement('button');fab.id='ae-asesor-venta-fab';fab.type='button';fab.innerHTML='<span style="font-size:1rem">🧾</span><span>Registrar venta</span>';fab.onclick=abrir;document.body.appendChild(fab);
    }
    if(document.getElementById('ae-asesor-venta-overlay'))return;
    var ov=document.createElement('div');ov.id='ae-asesor-venta-overlay';
    ov.innerHTML='<div class="ae-av-sheet">'
      +'<div class="ae-av-head"><div class="ae-av-headtxt"><div class="ae-av-title">🧾 Registrar venta</div><div class="ae-av-sub">Queda guardada para Administración.</div></div><button class="ae-av-x" type="button">×</button></div>'
      +'<div id="ae-av-seller" class="ae-av-seller"></div>'
      +'<div class="ae-av-card"><div class="ae-av-sec">👤 Cliente</div><div class="ae-av-grid">'
        +'<div class="ae-av-field full"><label>Nombre y apellido *</label><input id="ae-av-cliente" autocomplete="name" placeholder="Ej: Juan Pérez"></div>'
        +'<div class="ae-av-field"><label>Teléfono</label><input id="ae-av-tel" inputmode="tel" autocomplete="tel" placeholder="11 5555-5555"></div>'
        +'<div class="ae-av-field"><label>DNI</label><input id="ae-av-dni" inputmode="numeric" placeholder="Opcional"></div>'
        +'<div class="ae-av-field full"><label>Dirección</label><input id="ae-av-dir" autocomplete="street-address" placeholder="Calle y número (opcional)"></div>'
        +'<div class="ae-av-field"><label>Localidad</label><input id="ae-av-loc" placeholder="Opcional"></div>'
        +'<div class="ae-av-field"><label>Email</label><input id="ae-av-email" inputmode="email" autocomplete="email" placeholder="Opcional"></div>'
      +'</div></div>'
      +'<div class="ae-av-card"><div class="ae-av-sec">📦 Venta</div><div class="ae-av-grid">'
        +'<div class="ae-av-field full"><label>Producto *</label><input id="ae-av-prod" placeholder="Ej: Samsung A15 128GB"></div>'
        +'<div class="ae-av-field"><label>Precio de venta *</label><input id="ae-av-precio" inputmode="numeric" placeholder="$"></div>'
        +'<div class="ae-av-field"><label>Forma de pago</label><select id="ae-av-forma-pago">'+opcionesFormaPago()+'</select></div>'
        +'<div class="ae-av-paynote">Si es financiado, registramos “Crédito personal”. Los planes, condiciones y cuotas se manejan con la política vigente de la tienda, no desde este formulario.</div>'
        +'<div class="ae-av-field full"><label>Seña o entrega</label><input id="ae-av-senia" inputmode="numeric" placeholder="$ que dejó (opcional)"></div>'
      +'</div><div class="ae-av-total"><span>Total de venta</span><b id="ae-av-total">$ 0</b></div></div>'
      +'<button id="ae-av-save" type="button">✅ Registrar venta</button>'
      +'<div class="ae-av-note">La venta se guarda con tu nombre de asesor y queda disponible en el historial de Administración.</div>'
      +'</div>';
    document.body.appendChild(ov);
    ov.querySelector('.ae-av-x').onclick=cerrar;
    ov.addEventListener('click',function(e){if(e.target===ov)cerrar();});
    ov.querySelector('#ae-av-save').onclick=guardarVenta;
    ov.querySelector('#ae-av-precio').addEventListener('input',actualizarTotal);
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&ov.classList.contains('on'))cerrar();});
    var t=document.createElement('div');t.id='ae-av-toast';document.body.appendChild(t);
  }

  function actualizarTotal(){var b=document.getElementById('ae-av-total');if(b)b.textContent=dinero(num('ae-av-precio'));}
  function abrir(){
    if(!rolAsesor())return;
    crearUI();var a=asesorActual();var seller=document.getElementById('ae-av-seller');
    if(seller)seller.innerHTML='<div style="font-size:1.2rem">👤</div><div><b>'+esc(a.nombre)+'</b><br><span>La venta va a quedar registrada a tu nombre.</span></div>';
    var ov=document.getElementById('ae-asesor-venta-overlay');if(ov)ov.classList.add('on');
    setTimeout(function(){var x=document.getElementById('ae-av-cliente');if(x)x.focus();},120);
  }
  function cerrar(){var ov=document.getElementById('ae-asesor-venta-overlay');if(ov)ov.classList.remove('on');}
  function toast(msg){var t=document.getElementById('ae-av-toast');if(!t)return;t.textContent=msg;t.classList.add('on');clearTimeout(t.__tm);t.__tm=setTimeout(function(){t.classList.remove('on');},2800);}
  function limpiar(){
    ['ae-av-cliente','ae-av-tel','ae-av-dni','ae-av-dir','ae-av-loc','ae-av-email','ae-av-prod','ae-av-precio','ae-av-senia'].forEach(function(id){var e=document.getElementById(id);if(e)e.value='';});
    var f=document.getElementById('ae-av-forma-pago');if(f)f.value='contado';actualizarTotal();
  }

  function clienteActual(){return {nombre:val('ae-av-cliente'),tel:val('ae-av-tel'),telefono:val('ae-av-tel'),dni:val('ae-av-dni'),direccion:val('ae-av-dir'),domicilio:val('ae-av-dir'),localidad:val('ae-av-loc'),email:val('ae-av-email'),mail:val('ae-av-email')};}
  async function esperarSb(){return new Promise(function(resolve,reject){var n=0;(function tick(){if(window.sbCalc&&typeof window.sbCalc.from==='function')return resolve(window.sbCalc);if(n++>50)return reject(new Error('nube-no-lista'));setTimeout(tick,120);})();});}

  async function guardarEnHistorial(reg){
    if(typeof window.guardarPedidoHistorial==='function'){
      window.guardarPedidoHistorial(reg._cliente,reg.items,reg.total,'Vendedor','venta',reg._meta);
      return true;
    }
    var sb=await esperarSb();var hist=[];
    try{var r=await sb.from('tienda_catalogo').select('datos').eq('id','historial').maybeSingle();if(r&&r.data&&Array.isArray(r.data.datos))hist=r.data.datos;}catch(e){}
    hist=hist.filter(function(x){return x&&x.id!==reg.id;});hist.unshift(reg);hist=hist.slice(0,200);
    var up=await sb.from('tienda_catalogo').upsert({id:'historial',datos:hist,actualizado:new Date().toISOString()});
    if(up&&up.error)throw up.error;
    try{localStorage.setItem('ae_historial',JSON.stringify(hist));}catch(e){}
    window.tiendaHistorial=hist;return true;
  }

  async function guardarClienteSiExiste(cli){
    try{
      if(typeof window.guardarClienteAgenda==='function'){
        var r=window.guardarClienteAgenda(cli);if(r&&typeof r.then==='function')await r;
      }
    }catch(e){}
    try{
      if(typeof window.registrarClienteTienda==='function'){
        var central={nombre:cli.nombre,dni:cli.dni||'',telefono:cli.telefono||cli.tel||'',domicilio:cli.domicilio||cli.direccion||'',mail:cli.mail||cli.email||'',localidad:cli.localidad||'',origenAlta:'asesor_venta'};
        var c=window.registrarClienteTienda(central);if(c&&typeof c.then==='function')await c;
      }
    }catch(e){}
  }

  async function guardarVenta(){
    if(!rolAsesor())return;
    var cli=clienteActual(),prod=val('ae-av-prod'),precio=num('ae-av-precio'),formaPago=val('ae-av-forma-pago')||'contado',senia=num('ae-av-senia');
    if(!cli.nombre){toast('Falta el nombre del cliente.');var nc=document.getElementById('ae-av-cliente');if(nc)nc.focus();return;}
    if(!prod){toast('Falta indicar el producto.');var pp=document.getElementById('ae-av-prod');if(pp)pp.focus();return;}
    if(!(precio>0)){toast('Ingresá el precio de venta.');var pr=document.getElementById('ae-av-precio');if(pr)pr.focus();return;}
    var a=asesorActual();
    var financiado=formaPago==='credito_personal';
    var medioPago=financiado?'Crédito personal':'Contado';
    var meta={origen:'vendedor',vendedor:a.nombre,vendedorId:a.id,precioVenta:precio,formaPago:formaPago,medioPago:medioPago,financiado:financiado,senia:senia,saldo:Math.max(0,precio-senia)};
    var reg={id:'V'+Date.now()+'_'+Math.random().toString(36).slice(2,6),fecha:new Date().toISOString(),tipo:'venta',cliente:cli.nombre,tel:cli.tel||'',localidad:cli.localidad||'',direccion:cli.direccion||'',dni:cli.dni||'',email:cli.email||'',envio:'',medioPago:medioPago,total:precio,items:[{nombre:prod,precio:precio,qty:1}],origen:'vendedor',vendedor:a.nombre,vendedorId:a.id,precioVenta:precio,formaPago:formaPago,financiado:financiado,senia:senia,saldo:Math.max(0,precio-senia),_cliente:cli,_meta:meta};
    var btn=document.getElementById('ae-av-save');if(btn){btn.disabled=true;btn.textContent='Guardando…';}
    try{
      await guardarEnHistorial(reg);await guardarClienteSiExiste(cli);
      limpiar();cerrar();toast('✅ Venta registrada. Administración ya puede verla.');
    }catch(e){toast('No pude guardar la venta. Probá de nuevo.');}
    finally{if(btn){btn.disabled=false;btn.textContent='✅ Registrar venta';}}
  }

  function insertarEnMenu(){
    if(!rolAsesor()||document.getElementById('ae-av-menu-item'))return;
    var candidatos=Array.from(document.querySelectorAll('.mas-row,button,a,div')).filter(function(el){return /cerrar sesi[oó]n/i.test(String(el.textContent||'').trim())&&el.offsetParent!==null;});
    var cierre=candidatos[0];if(!cierre||!cierre.parentElement)return;
    var item=document.createElement('div');item.id='ae-av-menu-item';item.className=(cierre.classList&&cierre.classList.contains('mas-row'))?'mas-row ae-av-menurow':'ae-av-menurow';
    item.innerHTML='<span style="font-size:1.25rem;width:28px;text-align:center">🧾</span><span style="font-weight:900">Registrar venta</span>';
    item.onclick=function(e){e.preventDefault();e.stopPropagation();abrir();};cierre.parentElement.insertBefore(item,cierre);
  }

  function sincronizarRol(){
    crearUI();var es=rolAsesor();if(document.body)document.body.classList.toggle('ae-rol-asesor',es);
    if(es)insertarEnMenu();else{var x=document.getElementById('ae-av-menu-item');if(x)x.remove();cerrar();}
  }
  var obs=null;
  function instalar(){
    crearUI();sincronizarRol();
    if(!obs&&document.body){obs=new MutationObserver(function(){sincronizarRol();});obs.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});}
    setInterval(sincronizarRol,1200);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',instalar,{once:true});else instalar();
})();