/* AmarangoElectro · ajustes UX Margarita + voz
   - Evita que accesos/compositor tapen mensajes.
   - Corrige guia visual para "como uso la tienda".
   - Agrega dictado por voz a Margarita y al buscador visible de tienda.
*/
(function(){
  'use strict';
  const VERSION='mg-ux-voz-20260825-1';
  if(window.__MG_UX_VOZ__===VERSION)return;
  window.__MG_UX_VOZ__=VERSION;

  function estilos(){
    if(document.getElementById('mg-ux-voz-style'))return;
    const s=document.createElement('style');s.id='mg-ux-voz-style';s.textContent=`
      #margarita-panel .mg-mensajes{padding-bottom:18px!important;scroll-padding-bottom:24px!important}
      #margarita-panel .mg-mensajes>:last-child{margin-bottom:10px!important}
      #margarita-panel .mg-recepcion-quick{flex:0 0 auto!important;position:relative!important;z-index:5!important}
      #margarita-panel .mg-input{position:relative!important;z-index:6!important}
      .mg-voice-btn{border:0!important;background:transparent!important;color:#0B2D6B!important;width:38px!important;height:38px!important;min-width:38px!important;min-height:38px!important;border-radius:50%!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:1.1rem!important;box-shadow:none!important;padding:0!important;cursor:pointer!important;flex:0 0 38px!important}
      .mg-voice-btn.on{background:#fff1e6!important;color:#d85e00!important;box-shadow:0 0 0 3px rgba(255,122,0,.16)!important}
      .ae-voice-wrap{position:relative!important}
      .ae-voice-search{position:absolute!important;right:10px!important;top:50%!important;transform:translateY(-50%)!important;width:38px!important;height:38px!important;border:0!important;border-radius:50%!important;background:rgba(11,45,107,.08)!important;color:#0B2D6B!important;font-size:1.05rem!important;display:flex!important;align-items:center!important;justify-content:center!important;z-index:4!important;padding:0!important;box-shadow:none!important}
      .ae-voice-search.on{background:rgba(255,122,0,.16)!important;color:#c45500!important;box-shadow:0 0 0 3px rgba(255,122,0,.12)!important}
      .ae-voice-wrap input{padding-right:54px!important}
    `;document.head.appendChild(s);
  }

  function msgs(){return document.getElementById('margarita-msgs');}
  function cercaDelFinal(){const m=msgs();if(!m)return false;return m.scrollHeight-m.scrollTop-m.clientHeight<120;}
  function bajar(force){const m=msgs();if(!m)return;if(force||cercaDelFinal())requestAnimationFrame(()=>{m.scrollTop=m.scrollHeight;});}

  function protegerMensajes(){
    const m=msgs();if(!m)return;
    new MutationObserver(()=>bajar(true)).observe(m,{childList:true,subtree:true});
    const vv=window.visualViewport;
    const onResize=()=>setTimeout(()=>bajar(true),80);
    if(vv){vv.addEventListener('resize',onResize,{passive:true});vv.addEventListener('scroll',onResize,{passive:true});}
    window.addEventListener('resize',onResize,{passive:true});
    const q=document.querySelector('.mg-recepcion-quick');if(q)bajar(true);
  }

  function speechCtor(){return window.SpeechRecognition||window.webkitSpeechRecognition||null;}
  function reconocer(onTexto,btn){
    const SR=speechCtor();
    if(!SR){window.margaritaPintar?.('margarita','Tu navegador no tiene disponible el dictado por voz. Podés usar el micrófono del teclado del teléfono 😊');return;}
    const r=new SR();r.lang='es-AR';r.interimResults=false;r.maxAlternatives=1;
    if(btn)btn.classList.add('on');
    r.onresult=e=>{const t=String(e.results?.[0]?.[0]?.transcript||'').trim();if(t)onTexto(t);};
    r.onerror=e=>{if(e.error!=='aborted'&&e.error!=='no-speech')window.margaritaPintar?.('margarita','No pude escuchar bien. Probá de nuevo o escribime la consulta 😊');};
    r.onend=()=>btn&&btn.classList.remove('on');
    try{r.start();}catch(e){btn&&btn.classList.remove('on');}
  }

  function microMargarita(){
    const input=document.getElementById('margarita-input');if(!input)return;
    const bar=input.parentElement;if(!bar||bar.querySelector('.mg-voice-btn'))return;
    const b=document.createElement('button');b.type='button';b.className='mg-voice-btn';b.setAttribute('aria-label','Hablar por voz');b.title='Hablar por voz';b.textContent='🎙️';
    const enviar=bar.querySelector('button');if(enviar)bar.insertBefore(b,enviar);else bar.appendChild(b);
    b.onclick=()=>reconocer(t=>{input.value=t;input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();},b);
  }

  function dispararBusqueda(input,texto){
    input.value=texto;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));
    try{input.focus({preventScroll:true});}catch(e){input.focus();}
  }
  function microBuscador(){
    const candidatos=Array.from(document.querySelectorAll('#hdr-buscar-input,#tienda-buscar,input[placeholder*="Buscar"],input[placeholder*="buscar"]'));
    candidatos.forEach(input=>{
      if(!input||input.dataset.aeVoice==='1')return;
      const p=input.parentElement;if(!p)return;input.dataset.aeVoice='1';p.classList.add('ae-voice-wrap');
      const b=document.createElement('button');b.type='button';b.className='ae-voice-search';b.setAttribute('aria-label','Buscar por voz');b.title='Buscar por voz';b.textContent='🎙️';p.appendChild(b);
      b.onclick=ev=>{ev.preventDefault();ev.stopPropagation();reconocer(t=>dispararBusqueda(input,t),b);};
    });
  }

  function instalar(){
    estilos();protegerMensajes();microMargarita();microBuscador();
    const obs=new MutationObserver(()=>{microMargarita();microBuscador();});obs.observe(document.body,{childList:true,subtree:true});
    const fab=document.getElementById('margarita-fab');fab?.addEventListener('click',()=>setTimeout(()=>{microMargarita();bajar(true);},260));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',instalar,{once:true});else instalar();
})();