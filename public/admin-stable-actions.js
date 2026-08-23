/* AmarangoElectro · acciones admin sin saltos de pantalla
   Mantiene la tarjeta tocada en la misma posición visual durante rerenders.
*/
(function(){
  'use strict';
  var VERSION='admin-stable-2026-08-23-1';
  if(window.__AE_ADMIN_STABLE__===VERSION)return;
  window.__AE_ADMIN_STABLE__=VERSION;

  function esAdmin(){
    try{
      if(window.vistaPreviaCliente===true)return false;
      if(window.tiendaEsAdmin===true||window.adminUnlocked===true)return true;
      if(document.body&&document.body.classList.contains('rol-admin'))return true;
      return localStorage.getItem('ae_sesion_admin')==='1';
    }catch(e){return false;}
  }

  function instalarEstilo(){
    if(document.getElementById('ae-admin-stable-style'))return;
    var s=document.createElement('style');
    s.id='ae-admin-stable-style';
    s.textContent='\
body.rol-admin button:active,\
body.rol-admin .calc-btn:active,\
body.rol-admin summary:active,\
body.rol-admin .ae-vis-switch:active{transform:none!important;opacity:1!important;}\
body.rol-admin .prod-card{overflow-anchor:none!important;}\
body.rol-admin #tienda-grid{overflow-anchor:none!important;}\
';
    document.head.appendChild(s);
  }

  var ancla=null,obs=null,timers=[];
  function limpiar(){
    timers.forEach(function(t){clearTimeout(t);});timers=[];
    if(obs){try{obs.disconnect();}catch(e){}obs=null;}
    ancla=null;
  }

  function tarjetaDe(el){
    if(!el||!el.closest)return null;
    return el.closest('[id^="card-"],.prod-card,.tarjeta');
  }

  function idTarjeta(card){
    if(!card)return'';
    if(card.id)return card.id;
    return String(card.dataset&&((card.dataset.productId)||(card.dataset.id))||'');
  }

  function fijarAhora(){
    if(!ancla||!esAdmin())return;
    var card=null;
    if(ancla.id){
      try{card=document.getElementById(ancla.id);}catch(e){}
    }
    if(card&&card.getBoundingClientRect){
      var top=card.getBoundingClientRect().top;
      var delta=top-ancla.top;
      if(Math.abs(delta)>.5){
        try{window.scrollBy(0,delta);}catch(e){window.scrollTo(0,ancla.scrollY+delta);}
      }
    }else{
      var actual=window.scrollY||window.pageYOffset||0;
      if(Math.abs(actual-ancla.scrollY)>.5){
        try{window.scrollTo(0,ancla.scrollY);}catch(e){}
      }
    }
  }

  function activarAncla(el){
    if(!esAdmin())return;
    var card=tarjetaDe(el);
    var rect=card&&card.getBoundingClientRect?card.getBoundingClientRect():null;
    ancla={
      id:idTarjeta(card),
      top:rect?rect.top:0,
      scrollY:window.scrollY||window.pageYOffset||0,
      hasta:Date.now()+1800
    };

    if(obs){try{obs.disconnect();}catch(e){}}
    var grid=document.getElementById('tienda-grid')||document.body;
    obs=new MutationObserver(function(){
      if(!ancla||Date.now()>ancla.hasta){limpiar();return;}
      requestAnimationFrame(function(){requestAnimationFrame(fijarAhora);});
    });
    try{obs.observe(grid,{childList:true,subtree:true,attributes:false});}catch(e){}

    [0,30,80,150,240,340,500,750,1100,1600].forEach(function(ms){
      timers.push(setTimeout(function(){if(ancla&&Date.now()<=ancla.hasta)fijarAhora();},ms));
    });
    timers.push(setTimeout(limpiar,1850));
  }

  function esAccionEstable(el){
    if(!el||!el.closest)return false;
    if(el.closest('.ae-vis-switch'))return true;
    var b=el.closest('button,.calc-btn,[role="button"],summary');
    if(!b)return false;
    var card=tarjetaDe(b);
    if(!card)return false;
    var txt=String(b.textContent||b.getAttribute('aria-label')||'').toLowerCase();
    return /confirm|precio|visible|oculto|guardar|actualizar|revisado|revisi[oó]n/.test(txt);
  }

  document.addEventListener('pointerdown',function(ev){
    if(!esAdmin()||!esAccionEstable(ev.target))return;
    activarAncla(ev.target);
  },true);

  document.addEventListener('click',function(ev){
    if(!esAdmin()||!esAccionEstable(ev.target))return;
    if(!ancla)activarAncla(ev.target);
  },true);

  instalarEstilo();
})();
