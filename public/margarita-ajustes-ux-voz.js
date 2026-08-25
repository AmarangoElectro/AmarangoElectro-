/* AmarangoElectro · ajustes UX Margarita + voz
   - Protege mensajes del compositor.
   - Dictado estilo WhatsApp dentro de Margarita: contador + envío con flecha.
   - Dictado simple en el buscador de la tienda.
*/
(function(){
  'use strict';
  const VERSION='mg-ux-voz-20260825-4';
  if(window.__MG_UX_VOZ__===VERSION)return;
  window.__MG_UX_VOZ__=VERSION;

  let recActivo=null, recBtn=null, recTimer=null, recInicio=0, recTexto='', recEnviarAlFinal=false;

  function estilos(){
    if(document.getElementById('mg-ux-voz-style'))return;
    const s=document.createElement('style');s.id='mg-ux-voz-style';s.textContent=`
      @keyframes aeVoicePulse{0%,100%{opacity:.75;transform:scale(.9)}50%{opacity:1;transform:scale(1.18)}}
      #margarita-panel .mg-mensajes{padding-bottom:18px!important;scroll-padding-bottom:24px!important}
      #margarita-panel .mg-mensajes>:last-child{margin-bottom:10px!important}
      #margarita-panel .mg-recepcion-quick{flex:0 0 auto!important;position:relative!important;z-index:5!important}
      #margarita-panel .mg-input{position:relative!important;z-index:6!important}
      .mg-voice-btn{border:1px solid rgba(11,45,107,.12)!important;background:#fff!important;color:#0B2D6B!important;width:38px!important;height:38px!important;min-width:38px!important;min-height:38px!important;border-radius:50%!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:1.02rem!important;box-shadow:0 2px 8px rgba(11,45,107,.08)!important;padding:0!important;cursor:pointer!important;flex:0 0 38px!important}
      .mg-voice-btn.on{background:#fff3e8!important;color:#b64d00!important;border-color:rgba(255,122,0,.5)!important}
      .mg-voice-mode #margarita-input{color:transparent!important;caret-color:transparent!important;pointer-events:none!important;padding-left:94px!important;background:#fff!important}
      .mg-voice-status{display:none;position:absolute;left:22px;top:50%;transform:translateY(-50%);z-index:8;align-items:center;gap:8px;color:#334155;font:800 .82rem/1 system-ui,-apple-system,Segoe UI,sans-serif;pointer-events:none}
      .mg-voice-mode .mg-voice-status{display:flex}
      .mg-voice-dot{width:9px;height:9px;border-radius:50%;background:#ef4444;animation:aeVoicePulse 1s ease-in-out infinite}
      .mg-voice-time{min-width:38px;font-variant-numeric:tabular-nums;color:#0B2D6B}
      .mg-voice-hint{font-size:.68rem;font-weight:700;color:#64748b}
      .ae-voice-wrap{position:relative!important}
      .ae-voice-search{position:absolute!important;right:48px!important;top:50%!important;transform:translateY(-50%)!important;width:38px!important;height:38px!important;border:1px solid rgba(11,45,107,.12)!important;border-radius:50%!important;background:#fff!important;color:#0B2D6B!important;font-size:1.02rem!important;display:flex!important;align-items:center!important;justify-content:center!important;z-index:4!important;padding:0!important;box-shadow:0 2px 8px rgba(11,45,107,.10)!important}
      .ae-voice-search.on{background:#fff3e8!important;color:#b64d00!important;border-color:rgba(255,122,0,.48)!important;box-shadow:0 0 0 5px rgba(255,122,0,.15)!important}
      .ae-voice-wrap input{padding-right:94px!important}
      @media(max-width:380px){.ae-voice-search{right:44px!important}.ae-voice-wrap input{padding-right:88px!important}.mg-voice-hint{display:none}}
    `;document.head.appendChild(s);
  }

  function msgs(){return document.getElementById('margarita-msgs');}
  function cercaDelFinal(){const m=msgs();if(!m)return false;return m.scrollHeight-m.scrollTop-m.clientHeight<120;}
  function bajar(force){const m=msgs();if(!m)return;if(force||cercaDelFinal())requestAnimationFrame(()=>{m.scrollTop=m.scrollHeight;});}
  function protegerMensajes(){const m=msgs();if(!m)return;new MutationObserver(()=>bajar(true)).observe(m,{childList:true,subtree:true});const vv=window.visualViewport;const onResize=()=>setTimeout(()=>bajar(true),80);if(vv){vv.addEventListener('resize',onResize,{passive:true});vv.addEventListener('scroll',onResize,{passive:true});}window.addEventListener('resize',onResize,{passive:true});}

  function speechCtor(){return window.SpeechRecognition||window.webkitSpeechRecognition||null;}
  function formatoTiempo(ms){const s=Math.max(0,Math.floor(ms/1000));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
  function statusVoz(bar,on){
    let st=bar&&bar.querySelector('.mg-voice-status');
    if(on){
      if(!st){st=document.createElement('div');st.className='mg-voice-status';st.innerHTML='<span class="mg-voice-dot"></span><span class="mg-voice-time">0:00</span><span class="mg-voice-hint">Escuchando… tocá enviar</span>';bar.appendChild(st);}
      bar.classList.add('mg-voice-mode');
      recInicio=Date.now();clearInterval(recTimer);recTimer=setInterval(()=>{const t=bar.querySelector('.mg-voice-time');if(t)t.textContent=formatoTiempo(Date.now()-recInicio);},250);
    }else{
      clearInterval(recTimer);recTimer=null;if(bar)bar.classList.remove('mg-voice-mode');if(st)st.remove();
    }
  }
  function terminarVozMargarita(enviar){
    recEnviarAlFinal=!!enviar;
    try{recActivo&&recActivo.stop();}catch(e){}
  }
  function iniciarVozMargarita(btn,input,bar){
    const SR=speechCtor();
    if(!SR){window.margaritaPintar?.('margarita','Tu navegador no tiene disponible el dictado por voz. Podés usar el micrófono del teclado del teléfono 😊');return;}
    if(recActivo){terminarVozMargarita(false);return;}
    recTexto='';recEnviarAlFinal=false;const r=new SR();recActivo=r;recBtn=btn;r.lang='es-AR';r.interimResults=true;r.continuous=true;r.maxAlternatives=1;btn.classList.add('on');statusVoz(bar,true);
    r.onresult=e=>{let total='';for(let i=0;i<e.results.length;i++)total+=String(e.results[i][0]?.transcript||'')+' ';recTexto=total.trim();input.value=recTexto;input.dispatchEvent(new Event('input',{bubbles:true}));};
    r.onerror=e=>{if(e.error!=='aborted'&&e.error!=='no-speech')window.margaritaPintar?.('margarita','No pude escuchar bien. Probá de nuevo o escribime la consulta 😊');};
    r.onend=()=>{
      btn.classList.remove('on');statusVoz(bar,false);recActivo=null;recBtn=null;
      const txt=String(recTexto||input.value||'').trim();
      if(recEnviarAlFinal&&txt&&typeof window.margaritaEnviar==='function')setTimeout(()=>window.margaritaEnviar(),60);
      recEnviarAlFinal=false;
    };
    try{r.start();}catch(e){btn.classList.remove('on');statusVoz(bar,false);recActivo=null;}
  }

  function microMargarita(){
    const input=document.getElementById('margarita-input');if(!input)return;
    const bar=input.parentElement;if(!bar||bar.querySelector('.mg-voice-btn'))return;
    const enviar=bar.querySelector('button');
    const b=document.createElement('button');b.type='button';b.className='mg-voice-btn';b.setAttribute('aria-label','Hablar por voz');b.title='Hablar por voz';b.textContent='🎙️';
    if(enviar)bar.insertBefore(b,enviar);else bar.appendChild(b);
    b.onclick=ev=>{ev.preventDefault();ev.stopPropagation();iniciarVozMargarita(b,input,bar);};
    if(enviar){
      enviar.addEventListener('click',function(ev){if(!recActivo)return;ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();terminarVozMargarita(true);},true);
    }
  }

  function reconocerBusqueda(onTexto,btn){
    const SR=speechCtor();if(!SR)return;const r=new SR();r.lang='es-AR';r.interimResults=false;r.maxAlternatives=1;btn.classList.add('on');r.onresult=e=>{const t=String(e.results?.[0]?.[0]?.transcript||'').trim();if(t)onTexto(t);};r.onend=()=>btn.classList.remove('on');r.onerror=()=>btn.classList.remove('on');try{r.start();}catch(e){btn.classList.remove('on');}
  }
  function dispararBusqueda(input,texto){input.value=texto;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));try{input.focus({preventScroll:true});}catch(e){input.focus();}}
  function microBuscador(){const candidatos=Array.from(document.querySelectorAll('#hdr-buscar-input,#tienda-buscar,input[placeholder*="Buscar"],input[placeholder*="buscar"]'));candidatos.forEach(input=>{if(!input||input.dataset.aeVoice==='1')return;const p=input.parentElement;if(!p)return;input.dataset.aeVoice='1';p.classList.add('ae-voice-wrap');const b=document.createElement('button');b.type='button';b.className='ae-voice-search';b.setAttribute('aria-label','Buscar por voz');b.title='Buscar por voz';b.textContent='🎙️';p.appendChild(b);b.onclick=ev=>{ev.preventDefault();ev.stopPropagation();reconocerBusqueda(t=>dispararBusqueda(input,t),b);};});}
  function instalar(){estilos();protegerMensajes();microMargarita();microBuscador();const obs=new MutationObserver(()=>{microMargarita();microBuscador();});obs.observe(document.body,{childList:true,subtree:true});const fab=document.getElementById('margarita-fab');fab?.addEventListener('click',()=>setTimeout(()=>{microMargarita();bajar(true);},260));}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',instalar,{once:true});else instalar();
})();