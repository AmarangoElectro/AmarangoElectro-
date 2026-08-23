/* AmarangoElectro · ajuste visual fino de Margarita + splash de apertura
   - launcher más visible cuando el chat está cerrado
   - launcher oculto mientras el chat está abierto
   - cabecera azul más compacta para ganar área útil
   - splash inicial estilo app con logo circular sin cuadrado blanco
*/
(function(){
  'use strict';
  const VERSION='margarita-visual-tune-20260823-2';
  if(window.__AE_MARGARITA_VISUAL_TUNE__===VERSION)return;
  window.__AE_MARGARITA_VISUAL_TUNE__=VERSION;

  function instalarSplash(){
    if(document.getElementById('ae-start-splash'))return;
    const viejo=document.getElementById('splash-screen');
    if(viejo)viejo.style.setProperty('display','none','important');

    const splash=document.createElement('div');
    splash.id='ae-start-splash';
    splash.innerHTML=`
      <div class="ae-start-brand">
        <div class="ae-start-name"><span>Amarango</span><span class="electro">Electro</span><span class="bee">🐝</span></div>
        <div class="ae-start-logo-wrap"><img src="/icon.png" alt="AmarangoElectro"></div>
      </div>`;
    document.body.appendChild(splash);

    requestAnimationFrame(()=>splash.classList.add('on'));
    const salir=()=>{
      if(!splash.isConnected)return;
      splash.classList.add('out');
      setTimeout(()=>splash.remove(),420);
    };
    const minimo=Date.now()+1350;
    const cerrarCuandoListo=()=>setTimeout(salir,Math.max(0,minimo-Date.now()));
    if(document.readyState==='complete')cerrarCuandoListo();
    else window.addEventListener('load',cerrarCuandoListo,{once:true});
    setTimeout(salir,2600);
  }

  function instalarEstilos(){
    if(document.getElementById('ae-margarita-visual-tune-style'))return;
    const s=document.createElement('style');
    s.id='ae-margarita-visual-tune-style';
    s.textContent=`
      /* Oculta la pantalla antigua para que no aparezca el cuadrado blanco */
      #splash-screen{display:none!important;}

      /* Splash premium de apertura */
      #ae-start-splash{
        position:fixed!important;inset:0!important;z-index:50000!important;
        background:radial-gradient(circle at 50% 43%,#123f8b 0%,#0B2D6B 38%,#061d49 72%,#041535 100%)!important;
        display:flex!important;align-items:center!important;justify-content:center!important;
        padding:env(safe-area-inset-top) 18px env(safe-area-inset-bottom)!important;
        opacity:0!important;transition:opacity .28s ease!important;overflow:hidden!important;
      }
      #ae-start-splash.on{opacity:1!important;}
      #ae-start-splash.out{opacity:0!important;pointer-events:none!important;}
      .ae-start-brand{width:min(86vw,390px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;transform:translateY(-1.5vh);}
      .ae-start-name{display:flex;align-items:center;justify-content:center;gap:0;font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:clamp(1.55rem,7.2vw,2.15rem);font-weight:500;letter-spacing:-.045em;white-space:nowrap;text-shadow:0 5px 18px rgba(0,0,0,.22);}
      .ae-start-name>span:first-child{color:#fff;}
      .ae-start-name .electro{background:linear-gradient(90deg,#29a8ff 0%,#2774df 45%,#ff7a00 100%);-webkit-background-clip:text;background-clip:text;color:transparent;font-weight:600;}
      .ae-start-name .bee{font-size:.8em;margin-left:8px;transform:translateY(-2px);filter:drop-shadow(0 3px 5px rgba(0,0,0,.25));}
      .ae-start-logo-wrap{width:min(68vw,310px);aspect-ratio:1/1;border-radius:50%;overflow:hidden;box-shadow:0 18px 45px rgba(0,0,0,.28),0 0 35px rgba(34,116,255,.18);background:#fff;animation:aeSplashIn .52s cubic-bezier(.2,.8,.2,1) both;}
      .ae-start-logo-wrap img{width:100%!important;height:100%!important;display:block!important;object-fit:cover!important;border-radius:50%!important;}
      @keyframes aeSplashIn{from{opacity:0;transform:scale(.93) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}

      /* Más presencia cuando está cerrada */
      #margarita-fab{
        width:64px!important;
        height:64px!important;
        min-width:64px!important;
        min-height:64px!important;
        border-radius:50%!important;
        box-shadow:0 10px 28px rgba(11,45,107,.34)!important;
        transition:opacity .16s ease,transform .16s ease,visibility .16s ease!important;
      }
      #margarita-fab img{width:100%!important;height:100%!important;object-fit:cover!important;border-radius:50%!important;}

      /* Si el chat ya está abierto, no repetimos la carita abajo */
      body.ae-margarita-abierta #margarita-fab{
        opacity:0!important;
        visibility:hidden!important;
        pointer-events:none!important;
        transform:scale(.82)!important;
      }
      body.ae-margarita-abierta #margarita-teaser{
        opacity:0!important;
        visibility:hidden!important;
        pointer-events:none!important;
      }

      /* Cabecera azul más fina, pero Margarita sigue teniendo presencia */
      #margarita-panel .mg-header{
        min-height:0!important;
        padding:11px 13px!important;
        gap:10px!important;
        border-bottom-width:3px!important;
      }
      #margarita-panel .mg-header img{
        width:52px!important;
        height:52px!important;
        min-width:52px!important;
        min-height:52px!important;
      }
      #margarita-panel .mg-header h1,
      #margarita-panel .mg-header h2,
      #margarita-panel .mg-header strong{
        line-height:1.08!important;
      }
      #margarita-panel .mg-header p,
      #margarita-panel .mg-header small{
        line-height:1.15!important;
        margin-top:2px!important;
      }
      #margarita-panel .mg-header .mg-admin-config-btn{
        width:38px!important;
        height:38px!important;
        flex-basis:38px!important;
      }

      /* Un poco más de espacio útil real para la conversación */
      #margarita-panel .mg-mensajes{
        padding-top:12px!important;
      }

      @media(max-width:360px){
        .ae-start-brand{gap:20px;}
        .ae-start-logo-wrap{width:min(72vw,280px);}
        #margarita-fab{width:61px!important;height:61px!important;min-width:61px!important;min-height:61px!important;}
        #margarita-panel .mg-header{padding:9px 10px!important;gap:8px!important;}
        #margarita-panel .mg-header img{width:49px!important;height:49px!important;min-width:49px!important;min-height:49px!important;}
      }
    `;
    document.head.appendChild(s);
  }

  function sincronizar(){
    const overlay=document.getElementById('margarita-overlay');
    const abierto=!!(overlay&&overlay.classList.contains('abierto'));
    document.body&&document.body.classList.toggle('ae-margarita-abierta',abierto);
  }

  function instalar(){
    instalarEstilos();
    instalarSplash();
    const overlay=document.getElementById('margarita-overlay');
    if(!overlay){setTimeout(instalar,180);return;}
    sincronizar();
    if(!overlay.__aeVisualObserver){
      const obs=new MutationObserver(sincronizar);
      obs.observe(overlay,{attributes:true,attributeFilter:['class','style']});
      overlay.__aeVisualObserver=obs;
    }
    document.addEventListener('click',function(){setTimeout(sincronizar,0);setTimeout(sincronizar,220);},true);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',instalar,{once:true});
  else instalar();
})();
