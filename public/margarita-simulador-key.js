/* AmarangoElectro · clave Admin para simulador sin prompt nativo */
(function(){
  'use strict';
  var V='mg-sim-key-2026-08-23-1';if(window.__AE_MG_SIM_KEY__===V)return;window.__AE_MG_SIM_KEY__=V;
  var reentry=false;
  function ss(k){try{return sessionStorage.getItem(k)||'';}catch(e){return'';}}
  function setSs(k,v){try{v?sessionStorage.setItem(k,String(v)):sessionStorage.removeItem(k);}catch(e){}}
  function modal(){return new Promise(function(resolve){
    var old=document.getElementById('ae-mg-sim-key');if(old)old.remove();
    var bg=document.createElement('div');bg.id='ae-mg-sim-key';bg.className='ae-as-dialog-bg';
    bg.innerHTML='<div class="ae-as-dialog" role="dialog" aria-modal="true"><div class="ae-as-dialog-head"><div class="ae-as-dialog-kicker">AmarangoElectro · Administración</div><div class="ae-as-dialog-title">Abrir simulador de Margarita</div></div><div class="ae-as-dialog-body"><div class="ae-as-dialog-msg">Ingresá la clave privada de Administración. La usamos sólo para confirmar que quien está probando roles es un administrador.</div><input class="ae-as-dialog-input" type="password" autocomplete="current-password" placeholder="Clave de Administración"><div class="ae-as-dialog-error"></div><div class="ae-as-dialog-actions"><button type="button" class="ae-as-dialog-btn cancel">Cancelar</button><button type="button" class="ae-as-dialog-btn ok">Continuar</button></div></div></div>';
    document.body.appendChild(bg);var input=bg.querySelector('input');
    function done(v){bg.remove();resolve(v||'');}
    bg.querySelector('.cancel').onclick=function(){done('');};
    bg.querySelector('.ok').onclick=function(){var v=String(input.value||'').trim();if(!v){bg.querySelector('.ae-as-dialog-error').textContent='Ingresá la clave para continuar.';input.focus();return;}done(v);};
    input.onkeydown=function(e){if(e.key==='Enter')bg.querySelector('.ok').click();};
    bg.addEventListener('click',function(e){if(e.target===bg)done('');});setTimeout(function(){input.focus();},60);
  });}
  document.addEventListener('click',function(ev){
    if(reentry||ss('ae_admin_api_key'))return;
    var b=ev.target&&ev.target.closest?ev.target.closest('#ae-mg-sim-start'):null;if(!b)return;
    ev.preventDefault();ev.stopImmediatePropagation();
    modal().then(function(k){if(!k)return;setSs('ae_admin_api_key',k);reentry=true;try{b.click();}finally{setTimeout(function(){reentry=false;},0);}});
  },true);
})();
