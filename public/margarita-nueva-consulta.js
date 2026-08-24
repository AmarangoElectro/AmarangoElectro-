/* AmarangoElectro · Nueva consulta en Margarita premium */
(function(){
  'use strict';
  var VERSION='mg-new-chat-20260824-1';
  if(window.__MG_NEW_CHAT__===VERSION)return;
  window.__MG_NEW_CHAT__=VERSION;

  function ls(k){try{return localStorage.getItem(k)||'';}catch(e){return'';}}
  function asesor(){
    try{if(window.vistaPreviaCliente===true)return false;if(window.revUnlocked===true&&window.adminUnlocked!==true)return true;return /asesor|revendedor|vendedor/i.test(ls('ae_rol'));}catch(e){return false;}
  }
  function nombre(){var n=String(ls('ae_nombre_asesor')||'').trim();return n?n.split(/\s+/)[0].slice(0,40):'';}
  function estilos(){
    if(document.getElementById('mg-new-chat-style'))return;
    var s=document.createElement('style');s.id='mg-new-chat-style';s.textContent='\
.mg-new-chat-btn{width:42px;height:42px;flex:0 0 42px;border-radius:12px;border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.14);color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.15rem;cursor:pointer;touch-action:manipulation;}\
.mg-new-chat-btn:active{transform:scale(.96);background:rgba(255,255,255,.22)}\
';document.head.appendChild(s);
  }
  function reiniciar(){
    if(!asesor())return;
    try{window.margaritaV18NuevaConsulta&&window.margaritaV18NuevaConsulta();}catch(e){}
    window.__mgV18PendingCopy='';
    window.__mgV18LastData=null;
    window._margaritaHist=[];
    window._margaritaCargando=false;
    try{window.margaritaEscribiendo&&window.margaritaEscribiendo(false);}catch(e){}
    var cont=document.getElementById('margarita-msgs');if(cont)cont.innerHTML='';
    var n=nombre();var saludo=n?'Listo, '+n+' 🤝 Nueva consulta. ¿Qué necesitás vender ahora?':'Listo 🤝 Nueva consulta. ¿Qué necesitás vender ahora?';
    try{if(typeof window.margaritaPintar==='function')window.margaritaPintar('margarita',saludo);}catch(e){}
    var input=document.getElementById('margarita-input');if(input){input.value='';setTimeout(function(){input.focus();},30);}
  }
  function instalar(intento){
    estilos();
    var panel=document.getElementById('margarita-panel');var header=panel&&panel.querySelector('.mg-header');
    if(!header){if((intento||0)<60)setTimeout(function(){instalar((intento||0)+1);},150);return;}
    var existente=header.querySelector('.mg-new-chat-btn');
    if(!asesor()){if(existente)existente.remove();return;}
    if(existente)return;
    var b=document.createElement('button');b.type='button';b.className='mg-new-chat-btn';b.textContent='↻';b.title='Nueva consulta';b.setAttribute('aria-label','Nueva consulta');b.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();reiniciar();});
    var cerrar=Array.from(header.querySelectorAll('button')).find(function(x){return /cerrar/i.test(x.getAttribute('aria-label')||'')||String(x.textContent||'').trim()==='×';});
    if(cerrar)header.insertBefore(b,cerrar);else header.appendChild(b);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){instalar(0);},{once:true});else instalar(0);
})();
