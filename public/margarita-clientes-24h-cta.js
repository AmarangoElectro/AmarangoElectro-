/* AmarangoElectro · Margarita Clientes 24h + CTA de registro
   - Mantiene la guía/registro disponible todo el día para clientes.
   - Intercepta el botón enviar para evitar que el horario legado corte a clientes.
   - Mejora bienvenida y comunica el beneficio de registro sin alterar admin/asesores.
*/
(function(){
  'use strict';
  var VERSION='mg-clientes-24h-cta-2026-08-24-1';
  if(window.__MG_CLIENTES_24H_CTA__===VERSION)return;
  window.__MG_CLIENTES_24H_CTA__=VERSION;

  function esAdmin(){
    try{return (typeof window.esAdmin==='function'&&window.esAdmin())||window.tiendaEsAdmin===true||(window.adminUnlocked===true&&window.vistaPreviaCliente!==true)||localStorage.getItem('ae_rol')==='admin';}catch(e){return false;}
  }
  function esAsesor(){
    if(esAdmin())return false;
    try{if(window.vistaPreviaCliente===true)return false;return window.revUnlocked===true||/asesor|revendedor|vendedor/i.test(String(localStorage.getItem('ae_rol')||''));}catch(e){return false;}
  }
  function esCliente(){return !esAdmin()&&!esAsesor();}

  function texto(el){return String(el&&el.textContent||'').trim();}
  function esBot(el){return el&&el.nodeType===1&&el.classList&&el.classList.contains('margarita-bot');}

  function ajustarMensaje(bot){
    if(!esBot(bot)||!esCliente())return;
    var t=texto(bot);
    if(/en que te puedo servir/i.test(t)||/soy margarita.*servir/i.test(t)){
      bot.textContent='¡Bienvenido a AmarangoElectro! 🐝 Soy Margarita. Estoy para ayudarte a recorrer la tienda y orientarte en lo que necesites. ¿En qué te puedo ayudar?';
      return;
    }
    if(/^¡Hola!\s*Soy Margarita/i.test(t)&&!/Bienvenido a AmarangoElectro/i.test(t)){
      bot.textContent='¡Bienvenido a AmarangoElectro! 🐝 Soy Margarita. Estoy para ayudarte a recorrer la tienda y orientarte en lo que necesites. ¿En qué te puedo ayudar?';
      return;
    }
    if(/tambien puedo registrarte en unos segundos|puedo registrarte en unos segundos/i.test(t)){
      bot.textContent='Si querés, puedo adelantarte el registro en unos segundos para que el equipo ya tenga tus datos básicos. 🎁 Además, si te registrás y concretás tu primera compra, el equipo de AmarangoElectro te hace un obsequio con tu primera cuota. ¿Querés registrarte ahora?';
      return;
    }
    if(/ya te voy a recordar por tu nombre/i.test(t)&&!/obsequio/i.test(t)){
      bot.textContent=t+' 🎁 Y acordate: al haberte registrado, si concretás tu primera compra el equipo de AmarangoElectro te hace un obsequio con tu primera cuota.';
      return;
    }
    if(/fuera de horario|horario de atencion|horario de atención/i.test(t)){
      bot.textContent='Estoy disponible para ayudarte con la tienda y con tu registro 😊 Decime qué necesitás y seguimos.';
    }
  }

  function ajustarMensajes(){
    var msgs=document.getElementById('margarita-msgs');
    if(!msgs)return;
    msgs.querySelectorAll('.margarita-bot').forEach(ajustarMensaje);
  }

  function instalarEnvioCliente24h(){
    var input=document.getElementById('margarita-input');
    if(!input)return;
    var panel=document.getElementById('margarita-panel')||document.getElementById('margarita-overlay');
    if(!panel)return;
    panel.addEventListener('click',function(ev){
      if(!esCliente())return;
      var btn=ev.target&&ev.target.closest?ev.target.closest('button'):null;
      if(!btn)return;
      var inputBar=input.parentElement;
      if(!inputBar||!inputBar.contains(btn))return;
      var valor=String(input.value||'').trim();
      if(!valor)return;
      if(typeof window.margaritaEnviar!=='function')return;
      ev.preventDefault();
      ev.stopPropagation();
      ev.stopImmediatePropagation();
      window.margaritaEnviar();
    },true);
  }

  function instalarObserver(){
    var msgs=document.getElementById('margarita-msgs');
    if(!msgs)return;
    ajustarMensajes();
    new MutationObserver(function(cambios){
      cambios.forEach(function(c){
        c.addedNodes.forEach(function(n){
          if(esBot(n))ajustarMensaje(n);
          if(n&&n.querySelectorAll)n.querySelectorAll('.margarita-bot').forEach(ajustarMensaje);
        });
      });
    }).observe(msgs,{childList:true,subtree:true});
  }

  function instalar(){
    instalarEnvioCliente24h();
    instalarObserver();
    setTimeout(ajustarMensajes,120);
    setTimeout(ajustarMensajes,500);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',instalar,{once:true});else instalar();
})();
