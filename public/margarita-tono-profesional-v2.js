/* AmarangoElectro · Margarita tono profesional v2
   Capa final de presentación para clientes: bienvenida, ayudar/guiar y primera compra.
   No altera lógica de admin/asesores ni catálogo.
*/
(function(){
  'use strict';
  const VERSION='2026-08-24-1';
  if(window.__MG_TONO_PRO_V2__===VERSION)return;
  window.__MG_TONO_PRO_V2__=VERSION;

  function esAdmin(){try{return (typeof window.esAdmin==='function'&&window.esAdmin())||window.tiendaEsAdmin===true||(window.adminUnlocked===true&&window.vistaPreviaCliente!==true)||localStorage.getItem('ae_rol')==='admin';}catch(e){return false;}}
  function esAsesor(){if(esAdmin())return false;try{if(window.vistaPreviaCliente===true)return false;return window.revUnlocked===true||/asesor|revendedor|vendedor/i.test(String(localStorage.getItem('ae_rol')||''));}catch(e){return false;}}
  function esCliente(){return !esAdmin()&&!esAsesor();}

  const BIENVENIDA='¡Bienvenido a AmarangoElectro! 🐝 Soy Margarita. Estoy acá para ayudarte a recorrer la tienda y hacer tu experiencia más simple. ¿En qué te puedo ayudar?';

  function limpiarTexto(t){
    let s=String(t||'');
    if(!esCliente())return s;
    if(/^(¡?hola!?\s*)?soy margarita.*servir/i.test(s)||/¿?en qué te puedo servir/i.test(s)||/¿?en que te puedo servir/i.test(s))return BIENVENIDA;
    s=s.replace(/¿?en qué te puedo servir\??/gi,'¿En qué te puedo ayudar?')
       .replace(/¿?en que te puedo servir\??/gi,'¿En qué te puedo ayudar?')
       .replace(/te puedo servir/gi,'te puedo ayudar')
       .replace(/puedo servirte/gi,'puedo ayudarte')
       .replace(/servirte/gi,'ayudarte')
       .replace(/\bservir\b/gi,'ayudar');
    if(/obsequio|regalo/i.test(s)){
      s=s.replace(/con tu primera cuota/gi,'en tu primera compra')
         .replace(/con la primera cuota/gi,'en tu primera compra')
         .replace(/con su primera cuota/gi,'en su primera compra');
    }
    return s;
  }

  function envolverPintar(){
    const original=window.margaritaPintar;
    if(typeof original!=='function'||original.__tonoProV2)return false;
    function pintar(tipo,texto){
      const esMargarita=tipo==='margarita'||tipo==='bot'||tipo==='assistant';
      return original.call(this,tipo,esMargarita?limpiarTexto(texto):texto);
    }
    pintar.__tonoProV2=true;
    pintar.__original=original;
    window.margaritaPintar=pintar;
    return true;
  }

  function corregirExistentes(){
    if(!esCliente())return;
    const msgs=document.getElementById('margarita-msgs');
    if(!msgs)return;
    msgs.querySelectorAll('.margarita-bot').forEach(el=>{
      const antes=String(el.textContent||'');
      const despues=limpiarTexto(antes);
      if(despues!==antes)el.textContent=despues;
    });
  }

  function instalar(){
    envolverPintar();
    corregirExistentes();
    const msgs=document.getElementById('margarita-msgs');
    if(msgs)new MutationObserver(()=>{envolverPintar();corregirExistentes();}).observe(msgs,{childList:true,subtree:true,characterData:true});
    let intentos=0;const t=setInterval(()=>{envolverPintar();corregirExistentes();if(++intentos>20)clearInterval(t);},250);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',instalar,{once:true});else instalar();
})();