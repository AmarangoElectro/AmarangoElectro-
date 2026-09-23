/* AmarangoElectro · diálogos propios para el centro de Asesores
   Evita prompt/confirm grises del navegador en el flujo administrativo.
*/
(function(){
  'use strict';
  var V='asesores-app-dialogs-2026-08-23-1';
  if(window.__AE_ASESORES_DIALOGS__===V)return;
  window.__AE_ASESORES_DIALOGS__=V;
  var reintentando=false;

  function ss(k){try{return sessionStorage.getItem(k)||'';}catch(e){return'';}}
  function setSs(k,v){try{v?sessionStorage.setItem(k,String(v)):sessionStorage.removeItem(k);}catch(e){}}
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]);});}

  function estilos(){
    if(document.getElementById('ae-as-dialog-style'))return;
    var s=document.createElement('style');s.id='ae-as-dialog-style';s.textContent='\
.ae-as-dialog-bg{position:fixed;inset:0;z-index:19950;background:rgba(2,12,35,.64);backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);display:flex;align-items:center;justify-content:center;padding:18px}.ae-as-dialog{width:min(100%,390px);background:#fff;border:1px solid rgba(255,255,255,.86);border-radius:22px;box-shadow:0 24px 70px rgba(0,0,0,.34);overflow:hidden;font-family:inherit}.ae-as-dialog-head{padding:19px 19px 14px;background:linear-gradient(145deg,#071c46,#0B2D6B 65%,#174f9c);color:#fff;border-bottom:3px solid #FF7A00}.ae-as-dialog-kicker{font-size:.61rem;font-weight:900;color:#ffb36f;text-transform:uppercase;letter-spacing:.08em}.ae-as-dialog-title{font-size:1rem;font-weight:950;margin-top:3px}.ae-as-dialog-body{padding:17px 18px 18px}.ae-as-dialog-msg{font-size:.76rem;line-height:1.45;color:#475569}.ae-as-dialog-input{width:100%;margin-top:12px;border:1.5px solid #d8e0ec;border-radius:12px;padding:12px 13px;font:800 .84rem system-ui;color:#0B2D6B;background:#fff;outline:none}.ae-as-dialog-input:focus{border-color:#0B2D6B;box-shadow:0 0 0 3px rgba(11,45,107,.10)}.ae-as-dialog-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}.ae-as-dialog-btn{min-height:44px;border-radius:12px;font:900 .76rem system-ui;cursor:pointer}.ae-as-dialog-btn.cancel{background:#f8fafc;color:#475569;border:1.5px solid #dbe3ed}.ae-as-dialog-btn.ok{background:#0B2D6B;color:#fff;border:0}.ae-as-dialog-btn.danger{background:#c62828;color:#fff;border:0}.ae-as-dialog-error{min-height:16px;margin-top:7px;color:#dc2626;font-size:.64rem;font-weight:800}\
';document.head.appendChild(s);
  }

  function modalBase(titulo,mensaje,conInput,peligro){
    estilos();
    var bg=document.createElement('div');bg.className='ae-as-dialog-bg';
    bg.innerHTML='<div class="ae-as-dialog" role="dialog" aria-modal="true">'
      +'<div class="ae-as-dialog-head"><div class="ae-as-dialog-kicker">AmarangoElectro · Administración</div><div class="ae-as-dialog-title">'+esc(titulo)+'</div></div>'
      +'<div class="ae-as-dialog-body"><div class="ae-as-dialog-msg">'+esc(mensaje)+'</div>'
      +(conInput?'<input class="ae-as-dialog-input" type="password" autocomplete="current-password" placeholder="Clave de Administración"><div class="ae-as-dialog-error"></div>':'')
      +'<div class="ae-as-dialog-actions"><button type="button" class="ae-as-dialog-btn cancel">Cancelar</button><button type="button" class="ae-as-dialog-btn '+(peligro?'danger':'ok')+'">'+(peligro?'Eliminar':'Continuar')+'</button></div></div></div>';
    document.body.appendChild(bg);return bg;
  }

  function pedirClave(){
    return new Promise(function(resolve){
      var bg=modalBase('Acceso al equipo de ventas','Ingresá la clave privada de Administración. Esta clave es sólo para Maxi y Angie y no se comparte con los asesores.',true,false);
      var input=bg.querySelector('.ae-as-dialog-input'),ok=bg.querySelector('.ok'),cancel=bg.querySelector('.cancel');
      function cerrar(v){bg.remove();resolve(v||'');}
      cancel.onclick=function(){cerrar('');};
      ok.onclick=function(){var v=String(input.value||'').trim();if(!v){bg.querySelector('.ae-as-dialog-error').textContent='Ingresá la clave para continuar.';input.focus();return;}cerrar(v);};
      input.onkeydown=function(e){if(e.key==='Enter')ok.click();};
      bg.addEventListener('click',function(e){if(e.target===bg)cerrar('');});
      setTimeout(function(){input.focus();},60);
    });
  }

  function confirmarEliminar(nombre){
    return new Promise(function(resolve){
      var bg=modalBase('Eliminar asesor','Vas a eliminar a '+nombre+' del equipo de ventas. Esta acción borra su acceso y su ficha activa.',false,true);
      bg.querySelector('.cancel').onclick=function(){bg.remove();resolve(false);};
      bg.querySelector('.danger').onclick=function(){bg.remove();resolve(true);};
      bg.addEventListener('click',function(e){if(e.target===bg){bg.remove();resolve(false);}});
    });
  }

  async function continuarConClave(el){
    var clave=await pedirClave();if(!clave)return;
    setSs('ae_admin_api_key',clave);
    reintentando=true;
    try{el.click();}finally{setTimeout(function(){reintentando=false;},0);}
  }

  document.addEventListener('click',function(ev){
    if(reintentando)return;
    var el=ev.target&&ev.target.closest?ev.target.closest('#ae-admin-equipo-btn,#ae-as-retry,#ae-as-admin #as-new-btn,#ae-as-admin #ae-as-invite-btn,#ae-as-admin [data-act]'):null;
    if(!el)return;

    if(el.matches('[data-act="delete"]')){
      ev.preventDefault();ev.stopImmediatePropagation();
      var card=el.closest('[data-as-id]');
      var nom=card&&card.querySelector('.ae-as-name')?card.querySelector('.ae-as-name').textContent.trim():'este asesor';
      confirmarEliminar(nom).then(function(ok){
        if(!ok)return;
        if(!ss('ae_admin_api_key')){continuarConClave(el);return;}
        var original=window.confirm;window.confirm=function(){return true;};reintentando=true;
        try{el.click();}finally{window.confirm=original;setTimeout(function(){reintentando=false;},0);}
      });
      return;
    }

    if(!ss('ae_admin_api_key')){
      ev.preventDefault();ev.stopImmediatePropagation();
      continuarConClave(el);
    }
  },true);
})();
