/* AmarangoElectro · alta e identificación de clientes con Margarita
   Rama de prueba: onboarding corto, recuperación por teléfono y saludo personalizado.
   No pide DNI/domicilio para navegar: esos datos se completan recién cuando hacen falta.
*/
(function(){
  'use strict';
  var VERSION='margarita-client-onboarding-2026-08-23-1';
  if(window.__AE_MARGARITA_CLIENT_ONBOARDING__===VERSION)return;
  window.__AE_MARGARITA_CLIENT_ONBOARDING__=VERSION;

  var K_IDENTIDAD='ae_cliente_identidad';
  var K_CLIENTES='ae_clientes_tienda';
  var CLOUD_ROW='clientes_tienda';
  var GREETING_ID='ae-mg-client-greeting';
  var OVERLAY_ID='ae-mg-client-onboarding';
  var AVATAR='/margarita-avatar-oficial.jpeg?v=20260823-1';
  var intentos=0;

  function ls(k){try{return localStorage.getItem(k)||'';}catch(e){return '';}}
  function setJson(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
  function getJson(k,def){try{var v=localStorage.getItem(k);return v?JSON.parse(v):def;}catch(e){return def;}}
  function esc(s){return String(s||'').replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]);});}
  function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/\s+/g,' ');}
  function limpioNombre(s){return String(s||'').trim().replace(/\s+/g,' ').slice(0,90);}
  function nombreCorto(s){var n=limpioNombre(s);return n?n.split(/\s+/)[0].slice(0,32):'';}
  function telDigits(s){return String(s||'').replace(/\D+/g,'');}
  function telClave(s){var d=telDigits(s);if(d.indexOf('00')===0)d=d.slice(2);if(d.indexOf('54')===0)d=d.slice(2);if(d.length>10)d=d.slice(-10);return d;}
  function idCliente(phone){var k=telClave(phone);return k?'tel-'+k:'cli-'+Date.now().toString(36);}

  function rolCliente(){
    try{
      if(window.vistaPreviaCliente===true)return true;
      if(window.tiendaEsAdmin===true||window.adminUnlocked===true)return false;
      if(window.revUnlocked===true)return false;
      if(document.body&&document.body.classList.contains('rol-admin'))return false;
      if(document.body&&document.body.classList.contains('rol-revendedor'))return false;
      var r=String(ls('ae_rol')||'').toLowerCase();
      if(r==='admin'||/asesor|revendedor|vendedor/.test(r))return false;
    }catch(e){}
    return true;
  }

  function identidad(){
    var x=getJson(K_IDENTIDAD,{});if(!x||typeof x!=='object')x={};return x;
  }
  function identidadValida(x){return !!(x&&limpioNombre(x.nombre||x.apodo||x.nombreCompleto)&&telClave(x.telefono));}
  function saludoDia(){var h=new Date().getHours();return h<13?'Buen día':(h<20?'Buenas tardes':'Buenas noches');}
  function nombrePreferido(x){return limpioNombre(x&&x.apodo)||nombreCorto(x&&x.nombre)||nombreCorto(x&&x.nombreCompleto)||'';}

  function instalarEstilos(){
    if(document.getElementById('ae-mg-client-onboarding-style'))return;
    var s=document.createElement('style');s.id='ae-mg-client-onboarding-style';s.textContent=`
      #${OVERLAY_ID}{position:fixed;inset:0;z-index:22000;background:linear-gradient(160deg,rgba(2,12,46,.92),rgba(11,45,107,.86));backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:18px;overflow:auto}
      #${OVERLAY_ID}[hidden]{display:none!important}.ae-mg-on-card{width:min(420px,96vw);background:#fff;border-radius:25px;padding:18px;box-shadow:0 26px 80px rgba(0,0,0,.40);border:1px solid rgba(255,255,255,.7);font-family:inherit}.ae-mg-on-head{display:flex;gap:11px;align-items:center;margin-bottom:13px}.ae-mg-on-avatar{width:58px;height:58px;border-radius:50%;object-fit:cover;border:2px solid #0B2D6B;box-shadow:0 4px 13px rgba(11,45,107,.20);background:#fff}.ae-mg-on-title{font-size:1.02rem;font-weight:950;color:#0B2D6B;line-height:1.15}.ae-mg-on-sub{font-size:.68rem;color:#667085;line-height:1.4;margin-top:4px}.ae-mg-bubble{background:#f4f7fb;border:1px solid #e1e8f2;border-radius:16px 16px 16px 5px;padding:11px 12px;color:#263244;font-size:.77rem;font-weight:650;line-height:1.45;margin:7px 0 13px}.ae-mg-step{display:none}.ae-mg-step.on{display:block}.ae-mg-field{margin:9px 0}.ae-mg-field label{display:block;font-size:.63rem;font-weight:900;color:#475569;margin:0 0 5px 2px}.ae-mg-field input{width:100%;box-sizing:border-box;border:1.5px solid #d8e0eb;border-radius:12px;padding:12px 12px;font:750 .79rem inherit;color:#172033;outline:none;background:#fff}.ae-mg-field input:focus{border-color:#FF7A00;box-shadow:0 0 0 3px rgba(255,122,0,.09)}.ae-mg-actions{display:grid;gap:8px;margin-top:12px}.ae-mg-primary,.ae-mg-secondary{width:100%;border:0;border-radius:13px;padding:12px;font:900 .77rem inherit}.ae-mg-primary{background:#0B2D6B;color:#fff;box-shadow:0 7px 17px rgba(11,45,107,.18)}.ae-mg-secondary{background:#fff;color:#0B2D6B;border:1.5px solid #d9e2ef}.ae-mg-mini{font-size:.58rem;color:#7b8492;line-height:1.42;text-align:center;margin-top:9px}.ae-mg-error{display:none;background:#fff2f2;border:1px solid #ffd5d5;color:#9b1c1c;border-radius:10px;padding:8px 10px;font-size:.64rem;font-weight:800;margin-top:8px}.ae-mg-error.on{display:block}.ae-mg-found{background:#eef9f1;border:1px solid #ccebd4;color:#166534;border-radius:12px;padding:10px;font-size:.7rem;font-weight:800;line-height:1.4;margin-top:9px}
      #${GREETING_ID}{position:fixed;z-index:9998;max-width:225px;background:#fff;color:#0B2D6B;border:1px solid rgba(11,45,107,.16);border-radius:15px 15px 5px 15px;padding:9px 11px;box-shadow:0 9px 25px rgba(3,15,45,.23);font:800 .71rem/1.35 system-ui,-apple-system,Segoe UI,sans-serif;opacity:0;transform:translateY(8px) scale(.98);transition:.2s;pointer-events:none}.ae-mg-client-greet-on{opacity:1!important;transform:none!important;pointer-events:auto!important}#${GREETING_ID} b{color:#FF7A00}#${GREETING_ID}:after{content:"";position:absolute;right:-7px;bottom:9px;width:13px;height:13px;background:#fff;border-right:1px solid rgba(11,45,107,.12);border-bottom:1px solid rgba(11,45,107,.12);transform:rotate(-45deg)}
      @media(max-width:360px){.ae-mg-on-card{padding:15px}.ae-mg-on-avatar{width:52px;height:52px}#${GREETING_ID}{max-width:190px;font-size:.67rem}}
    `;document.head.appendChild(s);
  }

  function clientesLocal(){
    try{if(typeof window.cargarClientesTienda==='function')return window.cargarClientesTienda()||[];}catch(e){}
    return getJson(K_CLIENTES,[]);
  }
  function guardarClientes(lista){
    try{if(typeof window.guardarClientesTienda==='function'){window.guardarClientesTienda(lista);return;}}catch(e){}
    setJson(K_CLIENTES,lista);
    try{if(window.sbCalc&&typeof window.sbCalc.from==='function')window.sbCalc.from('tienda_catalogo').upsert({id:CLOUD_ROW,datos:lista,actualizado:new Date().toISOString()});}catch(e){}
  }
  async function clientesNube(){
    var local=clientesLocal();
    if(local&&local.length)return local;
    try{
      if(window.sbCalc&&typeof window.sbCalc.from==='function'){
        var r=await window.sbCalc.from('tienda_catalogo').select('datos').eq('id',CLOUD_ROW).maybeSingle();
        var a=r&&r.data&&Array.isArray(r.data.datos)?r.data.datos:[];
        if(a.length)setJson(K_CLIENTES,a);return a;
      }
    }catch(e){}
    return local||[];
  }
  function buscarEn(lista,telefono,nombre){
    var tk=telClave(telefono),nn=norm(nombre);
    if(tk){var p=lista.find(function(c){return telClave(c&& (c.telefono||c.tel))===tk;});if(p)return p;}
    if(nn){return lista.find(function(c){return norm(c&&c.nombre)===nn;})||null;}
    return null;
  }
  async function buscarCliente(telefono,nombre){var a=await clientesNube();return buscarEn(a,telefono,nombre);}

  async function upsertCliente(datos){
    var lista=await clientesNube();if(!Array.isArray(lista))lista=[];
    var tk=telClave(datos.telefono),nn=norm(datos.nombre);var i=lista.findIndex(function(c){return (tk&&telClave(c&&(c.telefono||c.tel))===tk)||(nn&&norm(c&&c.nombre)===nn);});
    var viejo=i>=0?lista[i]:{};
    var reg=Object.assign({},viejo,{
      id:viejo.id||idCliente(datos.telefono),
      nombre:limpioNombre(datos.nombre)||viejo.nombre||'',
      apodo:limpioNombre(datos.apodo)||viejo.apodo||nombreCorto(datos.nombre)||'',
      telefono:telDigits(datos.telefono)||viejo.telefono||'',
      dni:datos.dni||viejo.dni||'',mail:datos.mail||viejo.mail||'',domicilio:datos.domicilio||viejo.domicilio||'',localidad:datos.localidad||viejo.localidad||viejo.loc||'',
      aceptaPromos:viejo.aceptaPromos===true,
      origenAlta:viejo.origenAlta||'margarita_cliente',
      actualizado:new Date().toISOString(),
      creado:viejo.creado||new Date().toISOString()
    });
    if(i>=0)lista[i]=reg;else lista.push(reg);guardarClientes(lista);
    try{if(typeof window.registrarClienteTienda==='function')window.registrarClienteTienda(reg);}catch(e){}
    return reg;
  }

  function guardarIdentidad(reg){
    var ap=limpioNombre(reg.apodo)||nombreCorto(reg.nombre);
    setJson(K_IDENTIDAD,{id:reg.id||idCliente(reg.telefono),nombre:ap,nombreCompleto:limpioNombre(reg.nombre),apodo:ap,telefono:telDigits(reg.telefono),actualizado:Date.now()});
  }

  function error(msg){var e=document.getElementById('ae-mg-on-error');if(!e)return;e.textContent=msg;e.classList.toggle('on',!!msg);}
  function paso(n){document.querySelectorAll('#'+OVERLAY_ID+' .ae-mg-step').forEach(function(x){x.classList.remove('on');});var p=document.getElementById('ae-mg-step-'+n);if(p)p.classList.add('on');error('');}
  function cerrarOnboarding(){var o=document.getElementById(OVERLAY_ID);if(o)o.hidden=true;document.documentElement.style.overflow='';document.body.style.overflow='';}

  function crearOnboarding(){
    if(document.getElementById(OVERLAY_ID))return;
    instalarEstilos();var o=document.createElement('div');o.id=OVERLAY_ID;o.hidden=true;
    o.innerHTML='<div class="ae-mg-on-card" role="dialog" aria-modal="true" aria-labelledby="ae-mg-on-title">'
      +'<div class="ae-mg-on-head"><img class="ae-mg-on-avatar" src="'+AVATAR+'" alt="Margarita"><div><div id="ae-mg-on-title" class="ae-mg-on-title">Margarita 🐝</div><div class="ae-mg-on-sub">Te doy la bienvenida a AmarangoElectro.</div></div></div>'
      +'<div id="ae-mg-step-1" class="ae-mg-step on"><div class="ae-mg-bubble">Antes de entrar, te registro en menos de 30 segundos. Así la próxima vez te reconozco y puedo atenderte por tu nombre.</div>'
        +'<div class="ae-mg-field"><label>Nombre y apellido</label><input id="ae-mg-reg-nombre" autocomplete="name" placeholder="Ej: Maximiliano Ezequiel Cardozo"></div>'
        +'<div class="ae-mg-field"><label>Celular</label><input id="ae-mg-reg-tel" inputmode="tel" autocomplete="tel" placeholder="Ej: 11 5555-5555"></div>'
        +'<div id="ae-mg-on-error" class="ae-mg-error"></div><div class="ae-mg-actions"><button id="ae-mg-next" class="ae-mg-primary" type="button">Continuar</button><button id="ae-mg-existing" class="ae-mg-secondary" type="button">Ya soy cliente</button></div>'
        +'<div class="ae-mg-mini">Usamos estos datos para identificarte y atenderte. Las promociones se autorizan por separado.</div></div>'
      +'<div id="ae-mg-step-2" class="ae-mg-step"><div id="ae-mg-apodo-bubble" class="ae-mg-bubble"></div><div class="ae-mg-field"><label>¿Cómo querés que te llame Margarita?</label><input id="ae-mg-reg-apodo" autocomplete="nickname" placeholder="Ej: Maxi"></div><div id="ae-mg-on-error-2" class="ae-mg-error"></div><div class="ae-mg-actions"><button id="ae-mg-save" class="ae-mg-primary" type="button">✅ Listo, entrar a la tienda</button><button id="ae-mg-back" class="ae-mg-secondary" type="button">Atrás</button></div></div>'
      +'<div id="ae-mg-step-3" class="ae-mg-step"><div class="ae-mg-bubble">Si ya te registraste antes, decime el celular que usaste y recupero tu nombre.</div><div class="ae-mg-field"><label>Celular registrado</label><input id="ae-mg-find-tel" inputmode="tel" autocomplete="tel" placeholder="Ej: 11 5555-5555"></div><div id="ae-mg-find-result"></div><div id="ae-mg-on-error-3" class="ae-mg-error"></div><div class="ae-mg-actions"><button id="ae-mg-find" class="ae-mg-primary" type="button">Buscar mi registro</button><button id="ae-mg-find-back" class="ae-mg-secondary" type="button">Soy cliente nuevo</button></div></div>'
      +'</div>';
    document.body.appendChild(o);
    document.getElementById('ae-mg-next').onclick=continuarRegistro;document.getElementById('ae-mg-save').onclick=finalizarRegistro;document.getElementById('ae-mg-back').onclick=function(){paso(1);};document.getElementById('ae-mg-existing').onclick=function(){paso(3);setTimeout(function(){document.getElementById('ae-mg-find-tel').focus();},80);};document.getElementById('ae-mg-find-back').onclick=function(){paso(1);};document.getElementById('ae-mg-find').onclick=recuperarCliente;
    ['ae-mg-reg-nombre','ae-mg-reg-tel','ae-mg-reg-apodo','ae-mg-find-tel'].forEach(function(id){var el=document.getElementById(id);if(el)el.addEventListener('keydown',function(ev){if(ev.key==='Enter'){ev.preventDefault();if(id==='ae-mg-reg-nombre'||id==='ae-mg-reg-tel')continuarRegistro();else if(id==='ae-mg-reg-apodo')finalizarRegistro();else recuperarCliente();}});});
  }

  function abrirOnboarding(){
    if(!rolCliente())return;crearOnboarding();var o=document.getElementById(OVERLAY_ID);if(!o)return;o.hidden=false;document.documentElement.style.overflow='hidden';document.body.style.overflow='hidden';setTimeout(function(){var n=document.getElementById('ae-mg-reg-nombre');if(n)n.focus();},120);
  }

  async function continuarRegistro(){
    var nombre=limpioNombre(document.getElementById('ae-mg-reg-nombre').value),tel=document.getElementById('ae-mg-reg-tel').value;
    if(nombre.length<3){error('Escribí tu nombre y apellido para continuar.');return;}
    if(telClave(tel).length<8){error('Revisá el número de celular. Lo usamos para reconocerte la próxima vez.');return;}
    var existente=await buscarCliente(tel,nombre);
    if(existente&&telClave(existente.telefono||existente.tel)===telClave(tel)){
      guardarIdentidad(existente);cerrarOnboarding();mostrarSaludo(existente,true);return;
    }
    var sugerido=nombreCorto(nombre),ap=document.getElementById('ae-mg-reg-apodo');ap.value=sugerido;
    document.getElementById('ae-mg-apodo-bubble').innerHTML='Perfecto. Tengo <b>'+esc(nombre)+'</b>. Para hablarte más natural, ¿cómo querés que te llame? Podés dejar <b>'+esc(sugerido)+'</b> o escribir un apodo.';
    paso(2);setTimeout(function(){ap.focus();ap.select();},80);
  }

  async function finalizarRegistro(){
    var nombre=limpioNombre(document.getElementById('ae-mg-reg-nombre').value),tel=document.getElementById('ae-mg-reg-tel').value,apodo=limpioNombre(document.getElementById('ae-mg-reg-apodo').value)||nombreCorto(nombre);
    if(!apodo){var e=document.getElementById('ae-mg-on-error-2');e.textContent='Decime cómo querés que te llame.';e.classList.add('on');return;}
    var btn=document.getElementById('ae-mg-save');btn.disabled=true;btn.textContent='Guardando…';
    try{var reg=await upsertCliente({nombre:nombre,telefono:tel,apodo:apodo});guardarIdentidad(reg);cerrarOnboarding();mostrarSaludo(reg,false);}catch(e){var er=document.getElementById('ae-mg-on-error-2');er.textContent='No pude guardar tus datos ahora. Probá otra vez.';er.classList.add('on');}finally{btn.disabled=false;btn.textContent='✅ Listo, entrar a la tienda';}
  }

  async function recuperarCliente(){
    var t=document.getElementById('ae-mg-find-tel').value,er=document.getElementById('ae-mg-on-error-3'),res=document.getElementById('ae-mg-find-result');er.classList.remove('on');res.innerHTML='';
    if(telClave(t).length<8){er.textContent='Revisá el número de celular.';er.classList.add('on');return;}
    var b=document.getElementById('ae-mg-find');b.disabled=true;b.textContent='Buscando…';
    try{var c=await buscarCliente(t,'');if(!c){er.textContent='No encontré ese celular. Podés registrarte como cliente nuevo.';er.classList.add('on');return;}guardarIdentidad(c);res.innerHTML='<div class="ae-mg-found">✅ Te encontré, '+esc(nombrePreferido(c)||nombreCorto(c.nombre))+'. Ya podés entrar.</div>';setTimeout(function(){cerrarOnboarding();mostrarSaludo(c,true);},500);}finally{b.disabled=false;b.textContent='Buscar mi registro';}
  }

  function posicionarSaludo(){var g=document.getElementById(GREETING_ID),fab=document.getElementById('margarita-fab');if(!g||!fab)return;var r=fab.getBoundingClientRect(),w=g.offsetWidth||210,h=g.offsetHeight||50;g.style.left=Math.max(10,Math.min(window.innerWidth-w-10,r.left-w-10))+'px';g.style.top=Math.max(72,Math.min(window.innerHeight-h-14,r.top+(r.height-h)/2))+'px';}
  function ocultarSaludo(){var g=document.getElementById(GREETING_ID);if(!g)return;g.classList.remove('ae-mg-client-greet-on');setTimeout(function(){if(g&&!g.classList.contains('ae-mg-client-greet-on'))g.remove();},220);}
  function mostrarSaludo(reg,regresa){
    if(!rolCliente())return;instalarEstilos();var fab=document.getElementById('margarita-fab');if(!fab){if(intentos++<30)setTimeout(function(){mostrarSaludo(reg,regresa);},150);return;}
    var old=document.getElementById(GREETING_ID);if(old)old.remove();var n=nombrePreferido(reg)||'!';var g=document.createElement('button');g.id=GREETING_ID;g.type='button';g.innerHTML='<b>'+esc(saludoDia()+', '+n)+' 🐝</b><br>'+(regresa?'Qué bueno verte de nuevo. ':'¡Listo, ya sos parte de AmarangoElectro! ')+'Estoy acá por cualquier cosa.';g.onclick=function(){ocultarSaludo();fab.click();};document.body.appendChild(g);posicionarSaludo();requestAnimationFrame(function(){requestAnimationFrame(function(){g.classList.add('ae-mg-client-greet-on');posicionarSaludo();});});setTimeout(ocultarSaludo,6500);
  }

  function iniciar(){
    if(!rolCliente())return;crearOnboarding();var x=identidad();
    if(identidadValida(x)){setTimeout(function(){mostrarSaludo(x,true);},650);return;}
    setTimeout(abrirOnboarding,250);
  }

  window.margaritaClienteOnboarding={
    abrir:abrirOnboarding,
    identidad:identidad,
    resetear:function(){try{localStorage.removeItem(K_IDENTIDAD);}catch(e){}abrirOnboarding();},
    buscarPorTelefono:buscarCliente
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});else iniciar();
})();
