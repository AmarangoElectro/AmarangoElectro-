/* AmarangoElectro · Margarita Clientes 24h + CTA de registro
   - Mantiene la guía/registro disponible todo el día para clientes.
   - Intercepta el botón enviar para evitar que el horario legado corte a clientes.
   - Unifica el tono: bienvenida profesional, ayudar/guiar y beneficio en primera compra.
*/
(function(){
  'use strict';
  var VERSION='mg-clientes-24h-cta-2026-08-24-2';
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

  var BIENVENIDA='¡Bienvenido a AmarangoElectro! 🐝 Soy Margarita. Estoy acá para ayudarte a recorrer la tienda y hacer tu experiencia más simple. ¿En qué te puedo ayudar?';
  var REGISTRO='Si querés, puedo adelantarte el registro en unos segundos. Así el equipo ya tiene tus datos cuando quieras avanzar con una compra. 🎁 Además, al registrarte y concretar tu primera compra, recibís un obsequio de AmarangoElectro. ¿Querés registrarte?';

  function reemplazarServir(t){
    return t
      .replace(/¿?en qué te puedo servir\??/gi,'¿En qué te puedo ayudar?')
      .replace(/¿?en que te puedo servir\??/gi,'¿En qué te puedo ayudar?')
      .replace(/te puedo servir/gi,'te puedo ayudar')
      .replace(/puedo servirte/gi,'puedo ayudarte')
      .replace(/servirte/gi,'ayudarte');
  }

  function ajustarMensaje(bot){
    if(!esBot(bot)||!esCliente())return;
    var t=texto(bot);

    if(/en que te puedo servir|en qué te puedo servir|soy margarita.*servir/i.test(t)||(/^¡Hola!\s*Soy Margarita/i.test(t)&&!/Bienvenido a AmarangoElectro/i.test(t))){
      bot.textContent=BIENVENIDA;
      return;
    }
    if(/tambien puedo registrarte en unos segundos|también puedo registrarte en unos segundos|puedo registrarte en unos segundos|adelantarte el registro/i.test(t)){
      bot.textContent=REGISTRO;
      return;
    }
    if(/ya te voy a recordar por tu nombre/i.test(t)){
      var limpio=t
        .replace(/\s*🎁\s*Y acordate:[\s\S]*$/i,'')
        .replace(/\s*Y acordate:[\s\S]*$/i,'');
      bot.textContent=limpio+' 🎁 Y acordate: al haberte registrado, si concretás tu primera compra recibís un obsequio de AmarangoElectro.';
      return;
    }
    if(/obsequio|regalo/i.test(t)&&/primera cuota/i.test(t)){
      bot.textContent=t.replace(/con tu primera cuota/gi,'en tu primera compra').replace(/con la primera cuota/gi,'en tu primera compra').replace(/con su primera cuota/gi,'en su primera compra');
      return;
    }
    if(/fuera de horario|horario de atencion|horario de atención/i.test(t)){
      bot.textContent='Estoy disponible para ayudarte con la tienda y con tu registro 😊 Decime qué necesitás y seguimos.';
      return;
    }
    if(/servir/i.test(t)){
      bot.textContent=reemplazarServir(t);
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
