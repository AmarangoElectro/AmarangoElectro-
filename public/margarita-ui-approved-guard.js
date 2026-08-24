/* AmarangoElectro · guardia de UI aprobada de Margarita
   Referencia: commit bc6358d9284ef3d306e418ed7ef462d7ec7a52f0
   Conserva únicamente los formatos aprobados: Panel Mitad y Globo Premium.
   También fija el avatar oficial y elimina bienvenidas iniciales duplicadas.
*/
(function(){
  'use strict';
  var VERSION='margarita-ui-approved-2026-08-24-1';
  var AVATAR='/margarita-avatar-oficial.jpeg?v=20260824-1';
  var UI_KEY='ae_margarita_ui_formato';
  if(window.__AE_MARGARITA_UI_APPROVED__===VERSION)return;
  window.__AE_MARGARITA_UI_APPROVED__=VERSION;

  function formatoGuardado(){
    try{var f=localStorage.getItem(UI_KEY);if(f==='globo'||f==='mitad')return f;}catch(e){}
    return 'mitad';
  }

  function asegurarFormato(){
    var html=document.documentElement;if(!html)return;
    var actual=html.dataset.margaritaFormato;
    if(actual!=='mitad'&&actual!=='globo')html.dataset.margaritaFormato=formatoGuardado();
  }

  function instalarEstilos(){
    var viejo=document.getElementById('ae-margarita-ui-approved-style');if(viejo)viejo.remove();
    var s=document.createElement('style');s.id='ae-margarita-ui-approved-style';s.textContent=`
      #margarita-overlay{position:fixed!important;inset:0!important;z-index:9998!important;background:rgba(2,8,20,.42)!important;backdrop-filter:blur(7px)!important;-webkit-backdrop-filter:blur(7px)!important;opacity:0!important;pointer-events:none!important;align-items:initial!important;justify-content:initial!important;transition:opacity .22s ease!important}
      #margarita-overlay.abierto{opacity:1!important;pointer-events:auto!important}
      #margarita-panel{position:fixed!important;right:0!important;left:auto!important;min-height:0!important;background:#ECE5DD!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;border:1px solid rgba(255,255,255,.34)!important;box-shadow:-18px 0 46px rgba(0,0,0,.28)!important;transition:transform .28s cubic-bezier(.4,0,.2,1),width .18s ease!important;will-change:transform,width!important}
      html[data-margarita-formato="mitad"] #margarita-panel{top:0!important;bottom:auto!important;width:clamp(210px,58vw,300px)!important;height:100dvh!important;border-radius:26px 0 0 26px!important;transform:translateX(100%)!important}
      html[data-margarita-formato="mitad"] #margarita-overlay.abierto #margarita-panel{transform:translateX(0)!important}
      html[data-margarita-formato="globo"] #margarita-overlay{background:rgba(2,8,20,.24)!important;backdrop-filter:blur(4px)!important;-webkit-backdrop-filter:blur(4px)!important}
      html[data-margarita-formato="globo"] #margarita-panel{top:auto!important;right:12px!important;bottom:18px!important;width:min(340px,88vw)!important;height:min(66dvh,560px)!important;border-radius:26px!important;box-shadow:0 22px 55px rgba(0,0,0,.34)!important;transform:translateY(20px) scale(.985)!important}
      html[data-margarita-formato="globo"] #margarita-overlay.abierto #margarita-panel{transform:translateY(0) scale(1)!important}
      #margarita-panel .mg-header{flex:0 0 auto!important;box-shadow:0 1px 0 rgba(255,255,255,.16)!important}
      #margarita-panel .mg-header img{width:48px!important;height:48px!important;object-fit:cover!important;border-radius:50%!important}
      #margarita-panel .mg-mensajes{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important;padding-left:10px!important;padding-right:10px!important}
      #margarita-panel .mg-input{flex:0 0 auto!important;position:relative!important;display:flex!important;align-items:center!important;gap:8px!important;padding:9px 9px calc(9px + env(safe-area-inset-bottom))!important;box-shadow:0 -8px 24px rgba(38,50,56,.05)!important}
      #margarita-panel .mg-input input,#margarita-panel .mg-input textarea{flex:1 1 auto!important;min-width:0!important;height:56px!important;min-height:56px!important;border-radius:28px!important}
      #margarita-panel .mg-input button{flex:0 0 58px!important;width:58px!important;min-width:58px!important;max-width:58px!important;height:58px!important;min-height:58px!important;padding:0!important;margin:0!important;border-radius:50%!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:1.55rem!important;line-height:1!important}
      .mg-formato-switch{display:none!important}
      @media(max-width:360px){html[data-margarita-formato="mitad"] #margarita-panel{width:62vw!important}html[data-margarita-formato="globo"] #margarita-panel{width:90vw!important;right:8px!important}#margarita-panel .mg-input button{flex-basis:54px!important;width:54px!important;min-width:54px!important;max-width:54px!important;height:54px!important;min-height:54px!important}}
      @media(min-width:700px){html[data-margarita-formato="mitad"] #margarita-panel{width:360px!important}}
    `;document.head.appendChild(s);
  }

  function fijarAvatar(){
    document.querySelectorAll('#margarita-fab img,#margarita-panel .mg-header img,#margarita-panel .mg-bot-avatar,#margarita-fab-img,#margarita-cab-img').forEach(function(img){
      if(!img||img.tagName!=='IMG')return;
      if(img.getAttribute('src')!==AVATAR)img.setAttribute('src',AVATAR);
      img.setAttribute('alt','Margarita');
    });
  }

  function esSaludoInicial(txt){
    var t=String(txt||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    return /hola/.test(t)&&(/soy margarita|que estas buscando|en que te puedo servir|que necesitas para vender|todo bien|como estas/.test(t));
  }

  function deduplicarBienvenida(){
    var cont=document.getElementById('margarita-msgs');if(!cont)return;
    var burbujas=Array.from(cont.querySelectorAll('.margarita-bot,.margarita-cli'));
    var vioCliente=false,conservo=false;
    burbujas.forEach(function(b){
      if(b.classList.contains('margarita-cli')){vioCliente=true;return;}
      if(vioCliente||!esSaludoInicial(b.textContent))return;
      if(!conservo){conservo=true;return;}
      var row=b.closest('.mg-bot-row');if(row)row.remove();else b.remove();
    });
  }

  function sincronizar(){asegurarFormato();fijarAvatar();deduplicarBienvenida();}

  function instalar(){
    asegurarFormato();instalarEstilos();sincronizar();
    var root=document.body||document.documentElement;
    if(root&&!root.__aeMargaritaApprovedObserver){
      var obs=new MutationObserver(function(){requestAnimationFrame(sincronizar);});
      obs.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['src','class','data-margarita-formato']});
      root.__aeMargaritaApprovedObserver=obs;
    }
    document.addEventListener('click',function(){setTimeout(sincronizar,0);setTimeout(sincronizar,180);},true);
    setTimeout(sincronizar,350);setTimeout(sincronizar,1100);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',instalar,{once:true});else instalar();
})();
