/* AmarangoElectro · aislamiento de rol para Margarita
   Evita que una identidad de asesor/admin se filtre al modo cliente.
   En cliente real o "Ver como cliente", Margarita usa SOLO identidad de cliente.
*/
(function(){
  'use strict';
  var VERSION='margarita-client-role-guard-2026-08-24-1';
  if(window.__AE_MARGARITA_CLIENT_ROLE_GUARD__===VERSION)return;
  window.__AE_MARGARITA_CLIENT_ROLE_GUARD__=VERSION;

  var K_CLIENTE='ae_cliente_identidad';

  function leerCliente(){
    try{return JSON.parse(localStorage.getItem(K_CLIENTE)||'{}')||{};}catch(e){return {};}
  }
  function nombrePreferido(){
    var c=leerCliente();
    var n=String(c.apodo||c.nombre||'').trim();
    if(!n)n=String(c.nombreCompleto||'').trim().split(/\s+/)[0]||'';
    return n.slice(0,32);
  }
  function esCliente(){
    try{
      if(window.vistaPreviaCliente===true)return true;
      if(document.body&&document.body.classList.contains('rol-admin'))return false;
      if(document.body&&document.body.classList.contains('rol-revendedor'))return false;
      if(window.tiendaEsAdmin===true)return false;
      if(window.adminUnlocked===true)return false;
      if(window.revUnlocked===true)return false;
      return true;
    }catch(e){return true;}
  }
  function saludoCliente(){
    var n=nombrePreferido();
    return n?'¡Hola, '+n+'! 🐝 ¿En qué te puedo servir hoy?':'¡Hola! 🐝 ¿En qué te puedo servir hoy?';
  }
  function pareceSaludoEquipo(txt){
    var t=String(txt||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    return /que necesitas para vender|que necesit[aá]s para vender|hola equipo|quien esta usando administracion|quien esta por ahi/.test(t);
  }
  function corregirSaludo(){
    if(!esCliente())return;
    var cont=document.getElementById('margarita-msgs');if(!cont)return;
    var bots=cont.querySelectorAll('.margarita-bot');if(!bots.length)return;
    var primero=bots[0];
    if(pareceSaludoEquipo(primero.textContent))primero.textContent=saludoCliente();
  }

  function instalarFetch(){
    if(!window.fetch||window.fetch.__aeClientRoleGuard)return;
    var original=window.fetch.bind(window);
    var fn=async function(input,init){
      try{
        var url=typeof input==='string'?input:(input&&input.url)||'';
        var metodo=String((init&&init.method)||(input&&input.method)||'GET').toUpperCase();
        if(esCliente()&&metodo==='POST'&&/\/api\/margarita(?:\?|$)/.test(url)&&init&&typeof init.body==='string'){
          var body=JSON.parse(init.body);
          body.rol='cliente';
          body.nombre=nombrePreferido();
          body.saludoEspecialPendiente=false;
          init=Object.assign({},init,{body:JSON.stringify(body)});
        }
      }catch(e){}
      return original(input,init);
    };
    fn.__aeClientRoleGuard=VERSION;
    fn.__original=original;
    window.fetch=fn;
  }

  function envolverAbrir(){
    var actual=window.margaritaAbrir;
    if(typeof actual!=='function'||actual.__aeClientRoleGuard)return false;
    var fn=function(){
      var r=actual.apply(this,arguments);
      setTimeout(corregirSaludo,0);
      setTimeout(corregirSaludo,80);
      setTimeout(corregirSaludo,260);
      return r;
    };
    fn.__aeClientRoleGuard=VERSION;
    fn.__anterior=actual;
    window.margaritaAbrir=fn;
    return true;
  }

  function envolverVistaCliente(){
    var actual=window.toggleVistaCliente;
    if(typeof actual!=='function'||actual.__aeClientRoleGuard)return false;
    var fn=function(){
      var r=actual.apply(this,arguments);
      setTimeout(corregirSaludo,0);
      setTimeout(corregirSaludo,120);
      return r;
    };
    fn.__aeClientRoleGuard=VERSION;
    fn.__anterior=actual;
    window.toggleVistaCliente=fn;
    return true;
  }

  function instalar(){
    instalarFetch();
    envolverAbrir();
    envolverVistaCliente();
    corregirSaludo();
    var cont=document.getElementById('margarita-msgs');
    if(cont&&!cont.__aeClientRoleGuardObs){
      var obs=new MutationObserver(function(){requestAnimationFrame(corregirSaludo);});
      obs.observe(cont,{childList:true,subtree:true});
      cont.__aeClientRoleGuardObs=obs;
    }
    setTimeout(instalar,500);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',instalar,{once:true});
  else instalar();
})();
