/* AmarangoElectro · ajustes UX + voz SOLO en buscador
   - Protege mensajes del compositor de Margarita.
   - Quita por completo el micrófono dentro de Margarita.
   - Mantiene dictado simple únicamente en el buscador de la tienda.
*/
(function(){
  'use strict';
  const VERSION='mg-ux-voz-20260825-7';
  if(window.__MG_UX_VOZ__===VERSION)return;
  window.__MG_UX_VOZ__=VERSION;

  function estilos(){
    if(document.getElementById('mg-ux-voz-style'))return;
    const s=document.createElement('style');s.id='mg-ux-voz-style';s.textContent=`
      #margarita-panel .mg-mensajes{padding-bottom:18px!important;scroll-padding-bottom:24px!important}
      #margarita-panel .mg-mensajes>:last-child{margin-bottom:10px!important}
      #margarita-panel .mg-recepcion-quick{flex:0 0 auto!important;position:relative!important;z-index:5!important}
      #margarita-panel .mg-input{position:relative!important;z-index:6!important}
      .ae-voice-wrap{position:relative!important}
      .ae-voice-search{position:absolute!important;right:48px!important;top:50%!important;transform:translateY(-50%)!important;width:38px!important;height:38px!important;border:1px solid rgba(11,45,107,.12)!important;border-radius:50%!important;background:#fff!important;color:#0B2D6B!important;font-size:1.02rem!important;display:flex!important;align-items:center!important;justify-content:center!important;z-index:4!important;padding:0!important;box-shadow:0 2px 8px rgba(11,45,107,.10)!important;cursor:pointer!important}
      .ae-voice-search.on{background:#fff3e8!important;color:#b64d00!important;border-color:rgba(255,122,0,.48)!important;box-shadow:0 0 0 5px rgba(255,122,0,.15)!important}
      .ae-voice-wrap input{padding-right:94px!important}
      @media(max-width:390px){.ae-voice-search{right:44px!important}.ae-voice-wrap input{padding-right:88px!important}}
    `;document.head.appendChild(s);
  }

  function limpiarMicroMargarita(){
    document.querySelectorAll('.mg-voice-btn,.mg-voice-status').forEach(el=>el.remove());
    document.querySelectorAll('.mg-voice-mode').forEach(el=>el.classList.remove('mg-voice-mode'));
  }

  function msgs(){return document.getElementById('margarita-msgs');}
  function cercaDelFinal(){const m=msgs();if(!m)return false;return m.scrollHeight-m.scrollTop-m.clientHeight<120;}
  function bajar(force){const m=msgs();if(!m)return;if(force||cercaDelFinal())requestAnimationFrame(()=>{m.scrollTop=m.scrollHeight;});}
  function protegerMensajes(){const m=msgs();if(!m)return;new MutationObserver(()=>bajar(true)).observe(m,{childList:true,subtree:true});const vv=window.visualViewport;const onResize=()=>setTimeout(()=>bajar(true),80);if(vv){vv.addEventListener('resize',onResize,{passive:true});vv.addEventListener('scroll',onResize,{passive:true});}window.addEventListener('resize',onResize,{passive:true});}

  function speechCtor(){return window.SpeechRecognition||window.webkitSpeechRecognition||null;}
  function reconocerBusqueda(onTexto,btn){
    const SR=speechCtor();
    if(!SR){btn.title='Usá el micrófono del teclado';return;}
    const r=new SR();r.lang='es-AR';r.interimResults=false;r.continuous=false;r.maxAlternatives=1;
    btn.classList.add('on');
    r.onresult=e=>{const t=String(e.results?.[0]?.[0]?.transcript||'').trim();if(t)onTexto(t);};
    r.onend=()=>btn.classList.remove('on');
    r.onerror=()=>btn.classList.remove('on');
    try{r.start();}catch(e){btn.classList.remove('on');}
  }
  function dispararBusqueda(input,texto){input.value=texto;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));try{input.focus({preventScroll:true});}catch(e){input.focus();}}
  function microBuscador(){
    const candidatos=Array.from(document.querySelectorAll('#hdr-buscar-input,#tienda-buscar,input[placeholder*="Buscar"],input[placeholder*="buscar"]'));
    candidatos.forEach(input=>{
      if(!input||input.dataset.aeVoice==='1')return;
      const p=input.parentElement;if(!p)return;
      input.dataset.aeVoice='1';p.classList.add('ae-voice-wrap');
      const b=document.createElement('button');b.type='button';b.className='ae-voice-search';b.setAttribute('aria-label','Buscar por voz');b.title='Buscar por voz';b.textContent='🎙️';p.appendChild(b);
      b.onclick=ev=>{ev.preventDefault();ev.stopPropagation();reconocerBusqueda(t=>dispararBusqueda(input,t),b);};
    });
  }

  function instalar(){
    estilos();
    limpiarMicroMargarita();
    protegerMensajes();
    microBuscador();
    const obs=new MutationObserver(()=>{limpiarMicroMargarita();microBuscador();});
    obs.observe(document.body,{childList:true,subtree:true});
    const fab=document.getElementById('margarita-fab');fab?.addEventListener('click',()=>setTimeout(()=>{limpiarMicroMargarita();bajar(true);},260));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',instalar,{once:true});else instalar();
})();