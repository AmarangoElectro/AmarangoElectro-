/* AmarangoElectro · puente de compras a fidelidad
   Marca la primera compra y saca al cliente de tibios sin cambiar el flujo de venta.
*/
(function(){
  'use strict';
  var VERSION='fidelidad-compra-hook-2026-08-24-2',intentos=0;
  if(window.__AE_FIDELIDAD_COMPRA__===VERSION)return;
  window.__AE_FIDELIDAD_COMPRA__=VERSION;
  function ls(k){try{return localStorage.getItem(k)||'';}catch(e){return '';}}
  function tel(v){return String(v||'').replace(/\D+/g,'').slice(-15);}
  function esAsesor(){try{return window.revUnlocked===true||document.body&&document.body.classList.contains('rol-revendedor')||/asesor|revendedor|vendedor/i.test(ls('ae_rol'));}catch(e){return false;}}
  function avisar(cli){
    if(esAsesor())return;
    var t=tel(cli&&(cli.telefono||cli.tel));if(t.length<8)return;
    fetch('/api/cliente-identidad',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({accion:'registrar_compra',telefono:t,nombre:String(cli&&cli.nombre||'')})}).catch(function(){});
  }
  function envolver(){
    var f=window.guardarPedidoHistorial;
    if(typeof f!=='function'){if(intentos++<100)setTimeout(envolver,150);return;}
    if(f.__aeFidelidadCompra)return;
    var w=function(){var cli=arguments[0],r=f.apply(this,arguments);try{avisar(cli);}catch(e){}return r;};
    w.__aeFidelidadCompra=VERSION;w.__anterior=f;window.guardarPedidoHistorial=w;
  }
  envolver();
})();
