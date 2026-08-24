/* AmarangoElectro · evita diálogos grises del navegador en acciones de la app
   Primer objetivo: cierre de sesión, que seguía usando confirm() nativo en algunos flujos.
*/
(function(){
  'use strict';
  var VERSION='app-dialog-guard-2026-08-24-2';
  if(window.__AE_APP_DIALOG_GUARD__===VERSION)return;
  window.__AE_APP_DIALOG_GUARD__=VERSION;
  var reejecutando=false;

  function modalFallback(mensaje){return new Promise(function(resolve){var old=document.getElementById('ae-app-confirm-fallback');if(old)old.remove();var o=document.createElement('div');o.id='ae-app-confirm-fallback';o.style.cssText='position:fixed;inset:0;z-index:30000;background:rgba(2,12,46,.76);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;font-family:inherit';o.innerHTML='<div style="width:min(390px,94vw);background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 24px 75px rgba(0,0,0,.38)"><div style="background:linear-gradient(135deg,#0B2D6B,#1e5bc8);padding:17px 18px;border-bottom:3px solid #FF7A00;color:#fff"><div style="font-size:.62rem;font-weight:900;opacity:.78;text-transform:uppercase;letter-spacing:.06em">AmarangoElectro</div><div style="font-size:1rem;font-weight:950;margin-top:3px">Confirmar acción</div></div><div style="padding:18px;color:#334155;font-size:.8rem;line-height:1.5;white-space:pre-line">'+String(mensaje||'').replace(/[&<>]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]);})+'</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:0 18px 18px"><button id="ae-app-no" type="button" style="border:1.5px solid #dbe3ef;border-radius:12px;padding:12px;background:#fff;color:#526174;font-weight:900">Cancelar</button><button id="ae-app-si" type="button" style="border:0;border-radius:12px;padding:12px;background:#0B2D6B;color:#fff;font-weight:900">Sí, continuar</button></div></div>';document.body.appendChild(o);function fin(v){o.remove();resolve(v);}o.querySelector('#ae-app-no').onclick=function(){fin(false);};o.querySelector('#ae-app-si').onclick=function(){fin(true);};o.onclick=function(e){if(e.target===o)fin(false);};});}
  function confirmar(msg){try{if(typeof window.aeConfirmar==='function')return window.aeConfirmar(msg);}catch(e){}return modalFallback(msg);}
  function texto(el){return String(el&&el.textContent||'').replace(/\s+/g,' ').trim();}
  function esCerrarSesion(el){return /cerrar sesi[oó]n/i.test(texto(el));}

  document.addEventListener('click',function(ev){
    if(reejecutando)return;var el=ev.target&&ev.target.closest?ev.target.closest('button,a,.mas-row,.cajon-item,[role="button"]'):null;if(!el||!esCerrarSesion(el))return;
    ev.preventDefault();ev.stopImmediatePropagation();
    confirmar('¿Cerrar sesión?\n\nLa próxima vez que entres te va a pedir la clave de nuevo.').then(function(ok){if(!ok)return;var realConfirm=window.confirm;reejecutando=true;try{window.confirm=function(){return true;};el.click();}finally{window.confirm=realConfirm;reejecutando=false;}});
  },true);
})();
