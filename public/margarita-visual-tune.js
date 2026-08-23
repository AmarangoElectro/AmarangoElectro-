/* AmarangoElectro · ajuste visual fino de Margarita
   - launcher más visible cuando el chat está cerrado
   - launcher oculto mientras el chat está abierto
   - cabecera azul más compacta para ganar área útil
   - avatar oficial opción 4 en launcher, cabecera y mensajes
*/
(function(){
  'use strict';
  const VERSION='margarita-visual-tune-2026-08-23-5';
  const AVATAR='/margarita-avatar-v4.webp?v=20260823-2';
  if(window.__AE_MARGARITA_VISUAL_TUNE__===VERSION)return;
  window.__AE_MARGARITA_VISUAL_TUNE__=VERSION;

  function instalarEstilos(){
    if(document.getElementById('ae-margarita-visual-tune-style'))return;
    const s=document.createElement('style');s.id='ae-margarita-visual-tune-style';s.textContent=`
      #margarita-fab{
        width:64px!important;height:64px!important;min-width:64px!important;min-height:64px!important;
        border-radius:50%!important;box-shadow:0 10px 28px rgba(11,45,107,.34)!important;
        transition:opacity .16s ease,transform .16s ease,visibility .16s ease!important;
      }
      #margarita-fab img{width:100%!important;height:100%!important;object-fit:cover!important;border-radius:50%!important;}
      body.ae-margarita-abierta #margarita-fab{
        opacity:0!important;visibility:hidden!important;pointer-events:none!important;transform:scale(.82)!important;
      }
      body.ae-margarita-abierta #margarita-teaser{
        opacity:0!important;visibility:hidden!important;pointer-events:none!important;
      }
      #margarita-panel .mg-header{
        min-height:0!important;padding:11px 13px!important;gap:10px!important;border-bottom-width:3px!important;
      }
      #margarita-panel .mg-header img{
        width:52px!important;height:52px!important;min-width:52px!important;min-height:52px!important;
        object-fit:cover!important;border-radius:50%!important;
      }
      #margarita-panel .mg-header h1,
      #margarita-panel .mg-header h2,
      #margarita-panel .mg-header strong{line-height:1.08!important;}
      #margarita-panel .mg-header p,
      #margarita-panel .mg-header small{line-height:1.15!important;margin-top:2px!important;}
      #margarita-panel .mg-header .mg-admin-config-btn{
        width:38px!important;height:38px!important;flex-basis:38px!important;
      }
      #margarita-panel .mg-mensajes{padding-top:12px!important;}
      #margarita-panel .mg-bot-avatar{
        object-fit:cover!important;border-radius:50%!important;
      }
      @media(max-width:360px){
        #margarita-fab{width:61px!important;height:61px!important;min-width:61px!important;min-height:61px!important;}
        #margarita-panel .mg-header{padding:9px 10px!important;gap:8px!important;}
        #margarita-panel .mg-header img{width:49px!important;height:49px!important;min-width:49px!important;min-height:49px!important;}
      }
    `;document.head.appendChild(s);
  }

  function aplicarAvatar(){
    const selectores=[
      '#margarita-fab img',
      '#margarita-panel .mg-header img',
      '#margarita-panel .mg-bot-avatar'
    ];
    document.querySelectorAll(selectores.join(',')).forEach(img=>{
      if(img && img.tagName==='IMG' && img.getAttribute('src')!==AVATAR){
        img.setAttribute('src',AVATAR);
        img.setAttribute('alt','Margarita');
      }
    });
  }

  function sincronizar(){
    const overlay=document.getElementById('margarita-overlay');
    const abierto=!!(overlay&&overlay.classList.contains('abierto'));
    document.body&&document.body.classList.toggle('ae-margarita-abierta',abierto);
    aplicarAvatar();
  }

  function instalar(){
    instalarEstilos();
    aplicarAvatar();
    const overlay=document.getElementById('margarita-overlay');
    if(!overlay){setTimeout(instalar,180);return;}
    sincronizar();
    if(!overlay.__aeVisualObserver){
      const obs=new MutationObserver(()=>{sincronizar();aplicarAvatar();});
      obs.observe(overlay,{attributes:true,attributeFilter:['class','style'],childList:true,subtree:true});
      overlay.__aeVisualObserver=obs;
    }
    document.addEventListener('click',function(){setTimeout(sincronizar,0);setTimeout(sincronizar,220);},true);
    setTimeout(aplicarAvatar,350);
    setTimeout(aplicarAvatar,900);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',instalar,{once:true});
  else instalar();
})();
