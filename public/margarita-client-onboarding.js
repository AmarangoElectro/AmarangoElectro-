/* AmarangoElectro · onboarding seguro de clientes con Margarita
   - primer ingreso: nombre + celular + nombre preferido
   - cliente existente: recuperación por celular sin descargar la base completa
   - siguientes ingresos: saludo breve personalizado
*/
(function(){
  'use strict';
  var VERSION='margarita-client-onboarding-2026-08-23-2';
  if(window.__AE_MARGARITA_CLIENT_ONBOARDING__===VERSION)return;
  window.__AE_MARGARITA_CLIENT_ONBOARDING__=VERSION;

  var K='ae_cliente_identidad',OVER='ae-mg-client-onboarding',GREET='ae-mg-client-greeting';
  var AVATAR='/margarita-avatar-oficial.jpeg?v=20260823-1';
  var estado={tipo:'nuevo',cliente:null,nombre:'',telefono:''};

  function get(){try{return JSON.parse(localStorage.getItem(K)||'{}')||{};}catch(e){return {};}}
  function set(v){try{localStorage.setItem(K,JSON.stringify(v));}catch(e){}}
  function esc(s){return String(s||'').replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]);});}
  function nombre(s){return String(s||'').trim().replace(/\s+/g,' ').slice(0,90);}
  function corto(s){var n=nombre(s);return n?n.split(/\s+/)[0].slice(0,32):'';}
  function tel(s){return String(s||'').replace(/\D+/g,'').slice(-15);}
  function telOk(s){return tel(s).length>=8;}
  function preferido(c){return nombre(c&&c.apodo)||corto(c&&c.nombre)||corto(c&&c.nombreCompleto)||'';}
  function saludoDia(){var h=new Date().getHours();return h<13?'Buen día':h<20?'Buenas tardes':'Buenas noches';}
  function esCliente(){try{if(window.vistaPreviaCliente===true)return true;if(window.tiendaEsAdmin===true||window.adminUnlocked===true||window.revUnlocked===true)return false;var r=String(localStorage.getItem('ae_rol')||'').toLowerCase();return !(/admin|asesor|revendedor|vendedor/.test(r));}catch(e){return true;}}
  function identidadValida(x){return !!(x&&telOk(x.telefono)&&preferido(x));}

  async function api(payload){
    var r=await fetch('/api/cliente-identidad',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
    var d={};try{d=await r.json();}catch(e){}
    if(!r.ok||!d.ok)throw new Error(d.error||'No se pudo consultar el registro');
    return d;
  }
  async function buscar(telefono){var d=await api({accion:'buscar',telefono:tel(telefono)});return d.encontrado?d.cliente:null;}
  async function guardarServidor(accion,data){var d=await api({accion:accion,telefono:tel(data.telefono),cliente:data});return d.cliente;}
  function guardarIdentidad(c){var ap=preferido(c);set({id:c.id||'',nombre:ap,nombreCompleto:nombre(c.nombre)||nombre(c.nombreCompleto),apodo:ap,telefono:tel(c.telefono),nombrePreferidoConfirmado:c.nombrePreferidoConfirmado===true,actualizado:Date.now()});}

  function css(){if(document.getElementById('ae-mg-client-onboarding-style'))return;var s=document.createElement('style');s.id='ae-mg-client-onboarding-style';s.textContent=`
#${OVER}{position:fixed;inset:0;z-index:22000;background:linear-gradient(160deg,rgba(2,12,46,.94),rgba(11,45,107,.88));backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:18px;overflow:auto}#${OVER}[hidden]{display:none!important}.mgoc{width:min(420px,96vw);background:#fff;border-radius:25px;padding:18px;box-shadow:0 26px 80px rgba(0,0,0,.4);font-family:inherit}.mgoh{display:flex;gap:11px;align-items:center;margin-bottom:12px}.mgoa{width:58px;height:58px;border-radius:50%;object-fit:cover;border:2px solid #0B2D6B;background:#fff}.mgot{font-size:1.02rem;font-weight:950;color:#0B2D6B}.mgos{font-size:.67rem;color:#667085;margin-top:3px}.mgob{background:#f4f7fb;border:1px solid #e2e8f1;border-radius:16px 16px 16px 5px;padding:11px 12px;color:#263244;font-size:.76rem;font-weight:650;line-height:1.45;margin:8px 0 12px}.mgostep{display:none}.mgostep.on{display:block}.mgof{margin:9px 0}.mgof label{display:block;font-size:.63rem;font-weight:900;color:#475569;margin:0 0 5px 2px}.mgof input{width:100%;box-sizing:border-box;border:1.5px solid #d8e0eb;border-radius:12px;padding:12px;font:750 .79rem inherit;color:#172033;outline:none}.mgof input:focus{border-color:#FF7A00;box-shadow:0 0 0 3px rgba(255,122,0,.09)}.mgoact{display:grid;gap:8px;margin-top:12px}.mgop,.mgosec{width:100%;border-radius:13px;padding:12px;font:900 .77rem inherit}.mgop{border:0;background:#0B2D6B;color:#fff}.mgosec{background:#fff;color:#0B2D6B;border:1.5px solid #d9e2ef}.mgonote{font-size:.58rem;color:#7b8492;line-height:1.4;text-align:center;margin-top:9px}.mgoerr{display:none;background:#fff2f2;border:1px solid #ffd5d5;color:#9b1c1c;border-radius:10px;padding:8px 10px;font-size:.64rem;font-weight:800;margin-top:8px}.mgoerr.on{display:block}
#${GREET}{position:fixed;z-index:9998;max-width:225px;background:#fff;color:#0B2D6B;border:1px solid rgba(11,45,107,.16);border-radius:15px 15px 5px 15px;padding:9px 11px;box-shadow:0 9px 25px rgba(3,15,45,.23);font:800 .71rem/1.35 system-ui;opacity:0;transform:translateY(8px) scale(.98);transition:.2s;pointer-events:none}#${GREET}.on{opacity:1;transform:none;pointer-events:auto}#${GREET} b{color:#FF7A00}#${GREET}:after{content:"";position:absolute;right:-7px;bottom:9px;width:13px;height:13px;background:#fff;border-right:1px solid rgba(11,45,107,.12);border-bottom:1px solid rgba(11,45,107,.12);transform:rotate(-45deg)}
`;document.head.appendChild(s);}
  function err(msg,id){var e=document.getElementById(id||'mgoerr');if(!e)return;e.textContent=msg||'';e.classList.toggle('on',!!msg);}
  function paso(n){document.querySelectorAll('#'+OVER+' .mgostep').forEach(function(x){x.classList.remove('on');});var p=document.getElementById('mgostep'+n);if(p)p.classList.add('on');err('');err('','mgoerr2');err('','mgoerr3');}
  function cerrar(){var o=document.getElementById(OVER);if(o)o.hidden=true;document.documentElement.style.overflow='';document.body.style.overflow='';}
  function quitarTeaser(){var t=document.getElementById('margarita-teaser');if(t)t.remove();}

  function crear(){
    if(document.getElementById(OVER))return;css();var o=document.createElement('div');o.id=OVER;o.hidden=true;o.innerHTML='<div class="mgoc" role="dialog" aria-modal="true"><div class="mgoh"><img class="mgoa" src="'+AVATAR+'" alt="Margarita"><div><div class="mgot">Margarita 🐝</div><div class="mgos">Bienvenido a AmarangoElectro.</div></div></div>'+
    '<div id="mgostep1" class="mgostep on"><div class="mgob">Antes de entrar te registro en menos de 30 segundos. Así la próxima vez te reconozco y puedo atenderte por tu nombre.</div><div class="mgof"><label>Nombre y apellido</label><input id="mgonombre" autocomplete="name" placeholder="Ej: Maximiliano Ezequiel Cardozo"></div><div class="mgof"><label>Celular</label><input id="mgotel" inputmode="tel" autocomplete="tel" placeholder="Ej: 11 5555-5555"></div><div id="mgoerr" class="mgoerr"></div><div class="mgoact"><button id="mgonext" class="mgop" type="button">Continuar</button><button id="mgoexisting" class="mgosec" type="button">Ya soy cliente</button></div><div class="mgonote">El celular se usa para reconocerte. Las promociones se autorizan por separado.</div></div>'+
    '<div id="mgostep2" class="mgostep"><div id="mgobubble2" class="mgob"></div><div class="mgof"><label>¿Cómo querés que te llame Margarita?</label><input id="mgoapodo" autocomplete="nickname" placeholder="Ej: Maxi"></div><div id="mgoerr2" class="mgoerr"></div><div class="mgoact"><button id="mgosave" class="mgop" type="button">✅ Listo, entrar a la tienda</button><button id="mgoback" class="mgosec" type="button">Atrás</button></div></div>'+
    '<div id="mgostep3" class="mgostep"><div class="mgob">Si ya te registraste antes, decime el celular que usaste y recupero tu nombre.</div><div class="mgof"><label>Celular registrado</label><input id="mgofindtel" inputmode="tel" autocomplete="tel" placeholder="Ej: 11 5555-5555"></div><div id="mgoerr3" class="mgoerr"></div><div class="mgoact"><button id="mgofind" class="mgop" type="button">Buscar mi registro</button><button id="mgofindback" class="mgosec" type="button">Soy cliente nuevo</button></div></div></div>';document.body.appendChild(o);
    document.getElementById('mgonext').onclick=continuar;document.getElementById('mgoexisting').onclick=function(){paso(3);document.getElementById('mgofindtel').focus();};document.getElementById('mgoback').onclick=function(){paso(1);};document.getElementById('mgofindback').onclick=function(){paso(1);};document.getElementById('mgosave').onclick=finalizar;document.getElementById('mgofind').onclick=recuperar;
  }
  function abrir(){if(!esCliente())return;crear();quitarTeaser();var o=document.getElementById(OVER);o.hidden=false;document.documentElement.style.overflow='hidden';document.body.style.overflow='hidden';setTimeout(function(){document.getElementById('mgonombre').focus();},100);}

  function pedirApodo(c,tipo){estado.tipo=tipo;estado.cliente=c||null;estado.nombre=nombre(c&&c.nombre)||estado.nombre;estado.telefono=tel(c&&c.telefono)||estado.telefono;var sug=preferido(c)||corto(estado.nombre);var a=document.getElementById('mgoapodo');a.value=sug;document.getElementById('mgobubble2').innerHTML='Te tengo como <b>'+esc(estado.nombre)+'</b>. Para hablarte más natural, ¿cómo querés que te llame? Podés dejar <b>'+esc(sug)+'</b> o escribir un apodo.';paso(2);setTimeout(function(){a.focus();a.select();},80);}

  async function continuar(){
    var n=nombre(document.getElementById('mgonombre').value),t=document.getElementById('mgotel').value;if(n.length<3)return err('Escribí tu nombre y apellido.');if(!telOk(t))return err('Revisá el número de celular.');
    estado.nombre=n;estado.telefono=tel(t);var b=document.getElementById('mgonext');b.disabled=true;b.textContent='Buscando…';
    try{var c=await buscar(t);if(c){if(c.nombrePreferidoConfirmado&&c.apodo){guardarIdentidad(c);cerrar();mostrarSaludo(c,true);}else pedirApodo(c,'existente');}else pedirApodo({nombre:n,telefono:t},'nuevo');}catch(e){err(e.message||'No pude consultar el registro.');}finally{b.disabled=false;b.textContent='Continuar';}
  }
  async function recuperar(){
    var t=document.getElementById('mgofindtel').value;if(!telOk(t))return err('Revisá el número de celular.','mgoerr3');var b=document.getElementById('mgofind');b.disabled=true;b.textContent='Buscando…';
    try{var c=await buscar(t);if(!c)return err('No encontré ese celular. Podés registrarte como cliente nuevo.','mgoerr3');estado.nombre=nombre(c.nombre);estado.telefono=tel(c.telefono);if(c.nombrePreferidoConfirmado&&c.apodo){guardarIdentidad(c);cerrar();mostrarSaludo(c,true);}else pedirApodo(c,'existente');}catch(e){err(e.message||'No pude consultar el registro.','mgoerr3');}finally{b.disabled=false;b.textContent='Buscar mi registro';}
  }
  async function finalizar(){
    var ap=nombre(document.getElementById('mgoapodo').value).slice(0,32);if(!ap)return err('Decime cómo querés que te llame.','mgoerr2');var b=document.getElementById('mgosave');b.disabled=true;b.textContent='Guardando…';
    try{var c=await guardarServidor(estado.tipo==='nuevo'?'registrar':'actualizar',{id:estado.cliente&&estado.cliente.id,nombre:estado.nombre,telefono:estado.telefono,apodo:ap,nombrePreferidoConfirmado:true,origenAlta:estado.tipo==='nuevo'?'margarita_cliente':'cliente_existente'});guardarIdentidad(c);cerrar();mostrarSaludo(c,estado.tipo!=='nuevo');}catch(e){err(e.message||'No pude guardar tus datos.','mgoerr2');}finally{b.disabled=false;b.textContent='✅ Listo, entrar a la tienda';}
  }

  function pos(){var g=document.getElementById(GREET),f=document.getElementById('margarita-fab');if(!g||!f)return;var r=f.getBoundingClientRect(),w=g.offsetWidth||210,h=g.offsetHeight||50;g.style.left=Math.max(10,Math.min(innerWidth-w-10,r.left-w-10))+'px';g.style.top=Math.max(72,Math.min(innerHeight-h-14,r.top+(r.height-h)/2))+'px';}
  function ocultar(){var g=document.getElementById(GREET);if(!g)return;g.classList.remove('on');setTimeout(function(){if(g)g.remove();},220);}
  function mostrarSaludo(c,vuelve){quitarTeaser();var f=document.getElementById('margarita-fab');if(!f){setTimeout(function(){mostrarSaludo(c,vuelve);},180);return;}var old=document.getElementById(GREET);if(old)old.remove();var n=preferido(c)||'cliente';var g=document.createElement('button');g.id=GREET;g.type='button';g.innerHTML='<b>'+esc(saludoDia()+', '+n)+' 🐝</b><br>'+(vuelve?'Qué bueno verte de nuevo. ':'¡Listo, ya sos parte de AmarangoElectro! ')+'Estoy acá por cualquier cosa.';g.onclick=function(){ocultar();f.click();};document.body.appendChild(g);pos();requestAnimationFrame(function(){g.classList.add('on');pos();});setTimeout(ocultar,6500);}

  function iniciar(){if(!esCliente())return;crear();var x=get();if(identidadValida(x)){setTimeout(function(){mostrarSaludo(x,true);},650);}else setTimeout(abrir,250);}
  window.margaritaClienteOnboarding={abrir:abrir,identidad:get,resetear:function(){try{localStorage.removeItem(K);}catch(e){}abrir();},buscarPorTelefono:buscar};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});else iniciar();
})();
