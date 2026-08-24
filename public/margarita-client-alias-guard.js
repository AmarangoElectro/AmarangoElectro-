/* Mantiene el nombre preferido/apodo de cada cliente aunque luego complete compra o ficha. */
(function(){
  'use strict';
  var VERSION='margarita-client-alias-guard-2026-08-23-1';
  if(window.__AE_MARGARITA_ALIAS_GUARD__===VERSION)return;
  window.__AE_MARGARITA_ALIAS_GUARD__=VERSION;
  var K='ae_cliente_identidad',intentos=0;
  function leer(){try{return JSON.parse(localStorage.getItem(K)||'{}')||{};}catch(e){return {};}}
  function guardar(x){try{localStorage.setItem(K,JSON.stringify(x));}catch(e){}}
  function nombreCorto(s){s=String(s||'').trim().replace(/\s+/g,' ');return s?s.split(' ')[0].slice(0,32):'';}
  function instalar(){
    var actual=window.guardarClienteAgenda;
    if(typeof actual!=='function'){if(intentos++<80)setTimeout(instalar,150);return;}
    if(actual.__aeAliasGuard)return;
    var fn=function(cli){
      var antes=leer();var preferido=String(antes.apodo||antes.nombre||'').trim();
      var r=actual.apply(this,arguments);
      try{
        var despues=leer();
        var completo=String((cli&&cli.nombre)||despues.nombreCompleto||'').trim();
        if(preferido){despues.apodo=preferido;despues.nombre=preferido;}
        else if(completo){despues.apodo=nombreCorto(completo);despues.nombre=despues.apodo;}
        if(completo)despues.nombreCompleto=completo;
        despues.actualizado=Date.now();guardar(despues);
      }catch(e){}
      return r;
    };
    fn.__aeAliasGuard=VERSION;fn.__anterior=actual;window.guardarClienteAgenda=fn;
  }
  instalar();
})();
