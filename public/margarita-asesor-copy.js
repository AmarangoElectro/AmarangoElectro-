/* AmarangoElectro · tarjeta copiable para mensajes preparados por Margarita V18 */
(function(){
  'use strict';
  var VERSION='mg-copy-ready-20260824-1';
  if(window.__MG_ASESOR_COPY__===VERSION)return;
  window.__MG_ASESOR_COPY__=VERSION;

  function estilos(){
    if(document.getElementById('mg-asesor-copy-style'))return;
    var s=document.createElement('style');s.id='mg-asesor-copy-style';
    s.textContent='\
.mg-copy-ready{margin-top:9px;border:1px solid #d8e4f5;border-radius:14px;background:#f8fbff;padding:10px;box-shadow:0 4px 14px rgba(11,45,107,.07);}\
.mg-copy-ready-label{font:900 .58rem/1.2 system-ui,-apple-system,Segoe UI,sans-serif;color:#0B2D6B;text-transform:uppercase;letter-spacing:.03em;margin-bottom:6px;}\
.mg-copy-ready-text{font:700 .67rem/1.38 system-ui,-apple-system,Segoe UI,sans-serif;color:#334155;white-space:pre-wrap;overflow-wrap:anywhere;}\
.mg-copy-ready-btn{width:100%;margin-top:8px;border:0;border-radius:10px;background:linear-gradient(135deg,#0B2D6B,#1e5bc8);color:#fff;padding:9px;font:900 .65rem/1 system-ui,-apple-system,Segoe UI,sans-serif;cursor:pointer;touch-action:manipulation;}\
.mg-copy-ready-btn:active{transform:scale(.98)}\
.mg-copy-toast{position:fixed;left:50%;bottom:90px;transform:translateX(-50%);z-index:12050;background:#0B2D6B;color:#fff;border-radius:12px;padding:9px 12px;font:800 .68rem/1.25 system-ui;box-shadow:0 8px 25px rgba(0,0,0,.22);}\
';document.head.appendChild(s);
  }
  function toast(t){
    try{if(typeof window.tiendaToast==='function'){window.tiendaToast(t);return;}}catch(e){}
    var x=document.createElement('div');x.className='mg-copy-toast';x.textContent=t;document.body.appendChild(x);setTimeout(function(){x.remove();},1800);
  }
  async function copiar(texto){
    try{if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(texto);toast('✅ Mensaje copiado');return;}}catch(e){}
    try{var ta=document.createElement('textarea');ta.value=texto;ta.setAttribute('readonly','');ta.style.cssText='position:fixed;opacity:0;pointer-events:none';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();toast('✅ Mensaje copiado');}catch(e){toast('No pude copiar automáticamente');}
  }
  function esAsesor(){
    try{if(window.vistaPreviaCliente===true)return false;if(window.revUnlocked===true&&window.adminUnlocked!==true)return true;var r=String(localStorage.getItem('ae_rol')||'').toLowerCase();return /asesor|revendedor|vendedor/.test(r);}catch(e){return false;}
  }
  function decorar(bot){
    if(!bot||bot.__mgCopyReady||!esAsesor())return;
    var texto=String(window.__mgV18PendingCopy||'').trim();if(!texto)return;
    bot.__mgCopyReady=true;window.__mgV18PendingCopy='';
    var card=document.createElement('div');card.className='mg-copy-ready';
    var lab=document.createElement('div');lab.className='mg-copy-ready-label';lab.textContent='📋 Mensaje listo para tu cliente';
    var cuerpo=document.createElement('div');cuerpo.className='mg-copy-ready-text';cuerpo.textContent=texto;
    var btn=document.createElement('button');btn.type='button';btn.className='mg-copy-ready-btn';btn.textContent='📋 Copiar mensaje';btn.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();copiar(texto);});
    card.appendChild(lab);card.appendChild(cuerpo);card.appendChild(btn);bot.appendChild(card);
  }
  function revisarNodo(n){
    if(!n||n.nodeType!==1)return;
    if(n.classList&&n.classList.contains('margarita-bot'))decorar(n);
    var bots=n.querySelectorAll?n.querySelectorAll('.margarita-bot'):[];for(var i=0;i<bots.length;i++)decorar(bots[i]);
  }
  function instalar(intento){
    estilos();var cont=document.getElementById('margarita-msgs');
    if(!cont){if((intento||0)<50)setTimeout(function(){instalar((intento||0)+1);},150);return;}
    if(cont.__mgCopyObserver)return;cont.__mgCopyObserver=true;
    new MutationObserver(function(cs){cs.forEach(function(c){c.addedNodes.forEach(revisarNodo);});}).observe(cont,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){instalar(0);},{once:true});else instalar(0);
})();
