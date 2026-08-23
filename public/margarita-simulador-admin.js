/* AmarangoElectro · Simulador administrativo de Margarita
   Permite a Admin probar Cliente / Asesor / Admin sin contaminar sesiones ni métricas reales.
*/
(function(){
  'use strict';
  var V='mg-simulador-admin-2026-08-23-1';
  if(window.__AE_MG_SIMULADOR__===V)return;
  window.__AE_MG_SIMULADOR__=V;

  var sim={activo:false,rol:'cliente',nombre:'Cliente de prueba',histPrev:null,htmlPrev:null};
  var nativeFetch=window.fetch.bind(window);

  function ss(k){try{return sessionStorage.getItem(k)||'';}catch(e){return'';}}
  function esAdmin(){try{return window.vistaPreviaCliente!==true&&(window.tiendaEsAdmin===true||window.adminUnlocked===true||localStorage.getItem('ae_sesion_admin')==='1'||localStorage.getItem('ae_rol')==='admin');}catch(e){return false;}}
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]);});}
  function toast(t){try{if(typeof window.mostrarToast==='function'){window.mostrarToast(t);return;}}catch(e){}var x=document.createElement('div');x.textContent=t;x.style.cssText='position:fixed;left:50%;bottom:92px;transform:translateX(-50%);z-index:20550;background:#071c46;color:#fff;border-left:4px solid #FF7A00;border-radius:12px;padding:10px 14px;font:800 .75rem system-ui;box-shadow:0 10px 28px rgba(0,0,0,.28)';document.body.appendChild(x);setTimeout(function(){x.remove();},1800);}

  function estilos(){
    if(document.getElementById('ae-mg-sim-style'))return;
    var s=document.createElement('style');s.id='ae-mg-sim-style';s.textContent='\
#ae-mg-sim-modal{position:fixed;inset:0;z-index:19920;background:rgba(2,12,35,.64);backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);display:flex;align-items:flex-end;justify-content:center}.ae-mg-sim-sheet{width:min(100%,470px);background:#f7f9fc;border-radius:24px 24px 0 0;padding:16px 14px calc(18px + env(safe-area-inset-bottom));box-shadow:0 -22px 65px rgba(0,0,0,.34);font-family:inherit}.ae-mg-sim-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:12px}.ae-mg-sim-title{font-size:1.04rem;font-weight:950;color:#0B2D6B}.ae-mg-sim-sub{font-size:.68rem;color:#64748b;line-height:1.45;margin-top:3px}.ae-mg-sim-x{width:36px;height:36px;border:1px solid #dbe3ed;background:#fff;border-radius:11px;font-size:1.1rem;color:#334155}.ae-mg-sim-card{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:12px}.ae-mg-sim-label{font-size:.65rem;font-weight:950;color:#475569;text-transform:uppercase;letter-spacing:.04em;margin-bottom:7px}.ae-mg-sim-roles{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.ae-mg-sim-role{border:1.5px solid #dbe4ef;background:#fff;border-radius:13px;padding:11px 6px;font:900 .7rem system-ui;color:#475569}.ae-mg-sim-role.on{border-color:#0B2D6B;background:#eef5ff;color:#0B2D6B;box-shadow:inset 0 0 0 1px #0B2D6B}.ae-mg-sim-input{width:100%;box-sizing:border-box;margin-top:10px;border:1.5px solid #d8e0ec;border-radius:12px;padding:11px 12px;font:800 .8rem system-ui;color:#0B2D6B;outline:none}.ae-mg-sim-input:focus{border-color:#0B2D6B;box-shadow:0 0 0 3px rgba(11,45,107,.09)}.ae-mg-sim-start{width:100%;margin-top:10px;border:0;border-radius:13px;padding:12px;background:linear-gradient(135deg,#0B2D6B,#1e5bc8);color:#fff;font:950 .78rem system-ui}.ae-mg-sim-note{font-size:.61rem;line-height:1.4;color:#64748b;margin-top:10px}.ae-mg-sim-banner{margin:6px 8px 0;padding:7px 9px;border-radius:11px;background:#fff4e6;border:1px solid #ffbd7d;color:#8a4300;font:850 .61rem/1.25 system-ui;display:flex;align-items:center;gap:6px;flex-wrap:wrap}.ae-mg-sim-banner b{color:#0B2D6B}.ae-mg-sim-banner button{margin-left:auto;border:0;border-radius:999px;padding:5px 8px;font:900 .58rem system-ui;cursor:pointer}.ae-mg-sim-new{background:#0B2D6B;color:#fff}.ae-mg-sim-exit{background:#fff;color:#b42318;border:1px solid #fecaca!important}\
';document.head.appendChild(s);
  }

  function defaultNombre(rol){return rol==='asesor'?'Asesor de prueba':rol==='admin'?'Maxi':'Cliente de prueba';}
  function saludoSim(){
    if(sim.rol==='asesor')return '¡Hola, '+sim.nombre+'! 🤝 Soy Margarita. Contame qué necesita tu cliente y te ayudo a venderlo.';
    if(sim.rol==='admin')return '¡Hola, '+sim.nombre+'! 🐝 Estás en simulación de Administración. ¿Qué querés probar?';
    return '¡Hola, '+sim.nombre+'! 🐝 ¿En qué te puedo servir hoy?';
  }
  function pintarInicial(){var msgs=document.getElementById('margarita-msgs');if(!msgs)return;msgs.innerHTML='';window._margaritaHist=[];if(typeof window.margaritaPintar==='function')window.margaritaPintar('margarita',saludoSim());}

  function banner(){
    var panel=document.getElementById('margarita-panel');if(!panel)return;
    var old=document.getElementById('ae-mg-sim-banner');if(old)old.remove();
    if(!sim.activo)return;
    var b=document.createElement('div');b.id='ae-mg-sim-banner';b.className='ae-mg-sim-banner';b.innerHTML='<span>🧪 <b>SIMULACIÓN</b> · '+esc(sim.rol.toUpperCase())+' · '+esc(sim.nombre)+'</span><button class="ae-mg-sim-new">Nuevo caso</button><button class="ae-mg-sim-exit">Salir</button>';
    var head=panel.querySelector('.mg-header')||panel.firstElementChild;if(head&&head.nextSibling)panel.insertBefore(b,head.nextSibling);else panel.prepend(b);
    b.querySelector('.ae-mg-sim-new').onclick=function(){pintarInicial();toast('🧪 Caso nuevo');};
    b.querySelector('.ae-mg-sim-exit').onclick=salir;
  }

  function empezar(rol,nombre){
    if(!esAdmin())return;
    var key=ss('ae_admin_api_key');if(!key){toast('Ingresá primero la clave privada de Administración');return;}
    var msgs=document.getElementById('margarita-msgs');
    if(!sim.activo){sim.histPrev=Array.isArray(window._margaritaHist)?window._margaritaHist.slice():[];sim.htmlPrev=msgs?msgs.innerHTML:null;}
    sim.activo=true;sim.rol=/^(cliente|asesor|admin)$/.test(rol)?rol:'cliente';sim.nombre=String(nombre||defaultNombre(sim.rol)).trim().slice(0,80)||defaultNombre(sim.rol);
    pintarInicial();banner();
    try{if(typeof window.cerrarCajon==='function')window.cerrarCajon();}catch(e){}
    try{if(typeof window.margaritaAbrir==='function')window.margaritaAbrir();}catch(e){}
    setTimeout(banner,80);
  }

  function salir(){
    if(!sim.activo)return;
    sim.activo=false;
    var msgs=document.getElementById('margarita-msgs');
    window._margaritaHist=Array.isArray(sim.histPrev)?sim.histPrev.slice():[];
    if(msgs&&sim.htmlPrev!=null)msgs.innerHTML=sim.htmlPrev;
    var b=document.getElementById('ae-mg-sim-banner');if(b)b.remove();
    sim.histPrev=null;sim.htmlPrev=null;
    toast('✓ Volviste a tu sesión real');
  }
  window.aeMargaritaSalirSimulacion=salir;

  function modal(){
    if(!esAdmin())return;estilos();var old=document.getElementById('ae-mg-sim-modal');if(old)old.remove();
    var m=document.createElement('div');m.id='ae-mg-sim-modal';m.innerHTML='<div class="ae-mg-sim-sheet"><div class="ae-mg-sim-head"><div><div class="ae-mg-sim-title">🧪 Simulador de Margarita</div><div class="ae-mg-sim-sub">Probá exactamente cómo responde según el tipo de usuario, sin registrar actividad real.</div></div><button class="ae-mg-sim-x">×</button></div><div class="ae-mg-sim-card"><div class="ae-mg-sim-label">Entrar como</div><div class="ae-mg-sim-roles"><button class="ae-mg-sim-role on" data-role="cliente">👤 Cliente</button><button class="ae-mg-sim-role" data-role="asesor">🤝 Asesor</button><button class="ae-mg-sim-role" data-role="admin">🔐 Admin</button></div><input id="ae-mg-sim-name" class="ae-mg-sim-input" value="Cliente de prueba" placeholder="Nombre para la simulación"><button id="ae-mg-sim-start" class="ae-mg-sim-start">Abrir prueba de Margarita →</button><div class="ae-mg-sim-note">La conversación de prueba queda aislada. No suma entradas, minutos, consultas ni productos vistos/compartidos a ningún asesor real. Al salir se restaura tu conversación anterior.</div></div></div>';
    document.body.appendChild(m);var rol='cliente',inp=m.querySelector('#ae-mg-sim-name');
    m.querySelector('.ae-mg-sim-x').onclick=function(){m.remove();};m.addEventListener('click',function(e){if(e.target===m)m.remove();});
    m.querySelectorAll('[data-role]').forEach(function(b){b.onclick=function(){rol=b.dataset.role;m.querySelectorAll('[data-role]').forEach(function(x){x.classList.toggle('on',x===b);});inp.value=defaultNombre(rol);};});
    m.querySelector('#ae-mg-sim-start').onclick=function(){var k=ss('ae_admin_api_key');if(!k){toast('Ingresá la clave de Administración para usar el simulador');return;}m.remove();empezar(rol,inp.value);};
  }
  window.aeAbrirSimuladorMargarita=modal;

  function instalarMenu(){
    if(!esAdmin())return false;var caj=document.getElementById('cajon-lateral');if(!caj)return false;if(document.getElementById('ae-admin-simulador-btn'))return true;
    var b=document.createElement('button');b.id='ae-admin-simulador-btn';b.className='cajon-item admin';b.innerHTML='<span class="ci-ic">🧪</span><span>Simulador Margarita</span>';
    b.onclick=function(){modal();};caj.appendChild(b);return true;
  }

  window.fetch=async function(input,init){
    try{
      var url=typeof input==='string'?input:(input&&input.url)||'';
      var method=String(init&&init.method||(input&&input.method)||'GET').toUpperCase();
      if(sim.activo&&method==='POST'&&/\/api\/margarita(?:\?|$)/.test(url)){
        var body=init&&typeof init.body==='string'?JSON.parse(init.body):{};
        body.rol=sim.rol;body.nombre=sim.nombre;body.modoSimulador=true;body.modoPrueba=true;body.saludoEspecialPendiente=false;
        var h=new Headers(init&&init.headers||(input&&input.headers)||{});h.set('content-type','application/json');h.set('x-admin-key',ss('ae_admin_api_key'));
        return nativeFetch('/api/margarita/simulador',{method:'POST',headers:h,body:JSON.stringify(body)});
      }
    }catch(e){}
    return nativeFetch(input,init);
  };
  window.fetch.__aeMgSimulador=V;window.fetch.__anterior=nativeFetch;

  estilos();var tries=0;(function tick(){instalarMenu();if(tries++<80)setTimeout(tick,250);})();
})();
