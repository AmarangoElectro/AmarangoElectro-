/* AmarangoElectro · Margarita detalles premium
   Pequeñas mejoras de experiencia, sin tocar V21 ni la lógica central.
   - Accesos rápidos al abrir Margarita.
   - Compartir tienda desde el chat.
   - Bienvenida personalizada en el teaser para clientes registrados.
*/
(function(){
  'use strict';
  const VERSION='mg-premium-20260824-1';
  if(window.__MG_PREMIUM__===VERSION)return;
  window.__MG_PREMIUM__=VERSION;

  const KEY='ae_margarita_guia_cliente';
  const LATER='ae_margarita_registro_mas_tarde';

  function esAdmin(){
    try{return (typeof window.esAdmin==='function'&&window.esAdmin())||window.tiendaEsAdmin===true||(window.adminUnlocked===true&&window.vistaPreviaCliente!==true)||localStorage.getItem('ae_rol')==='admin';}catch(e){return false;}
  }
  function esAsesor(){
    if(esAdmin())return false;
    try{if(window.vistaPreviaCliente===true)return false;return window.revUnlocked===true||/asesor|revendedor|vendedor/i.test(String(localStorage.getItem('ae_rol')||''));}catch(e){return false;}
  }
  function esCliente(){return !esAdmin()&&!esAsesor();}
  function datos(){try{return JSON.parse(localStorage.getItem(KEY)||'null');}catch(e){return null;}}
  function nombre(){return String(datos()?.nombre||'').trim().slice(0,40);}

  function estilos(){
    if(document.getElementById('mg-premium-style'))return;
    const s=document.createElement('style');
    s.id='mg-premium-style';
    s.textContent=`
      .mg-premium-actions{display:flex;flex-wrap:wrap;gap:7px;margin:9px 10px 4px 10px;align-items:center}
      .mg-premium-actions button{border:1px solid rgba(11,45,107,.14);background:rgba(255,255,255,.96);color:#0B2D6B;border-radius:999px;padding:8px 11px;font:800 .69rem/1 system-ui,-apple-system,Segoe UI,sans-serif;box-shadow:0 3px 10px rgba(3,15,45,.08);cursor:pointer;white-space:nowrap;-webkit-tap-highlight-color:transparent}
      .mg-premium-actions button:active{transform:scale(.97)}
      .mg-premium-actions .mg-share{border-color:rgba(255,122,0,.28);color:#B95500}
      .mg-premium-note{width:100%;font:600 .61rem/1.35 system-ui,-apple-system,Segoe UI,sans-serif;color:#758198;padding:0 2px 2px}
      body.oscuro .mg-premium-actions button{background:#122442;color:#e8eef7;border-color:#294566}
      body.oscuro .mg-premium-actions .mg-share{color:#FFB06B;border-color:#75471e}
      body.oscuro .mg-premium-note{color:#9bb3d4}
    `;
    document.head.appendChild(s);
  }

  function enviarFrase(frase){
    const input=document.getElementById('margarita-input');
    if(!input||typeof window.margaritaEnviar!=='function')return;
    input.value=frase;
    input.dispatchEvent(new Event('input',{bubbles:true}));
    window.margaritaEnviar();
  }

  async function compartirTienda(){
    const texto='🐝 Te comparto la tienda de AmarangoElectro. Mirá nuestros productos y opciones en cuotas.';
    const url='https://amarangoelectro.com.ar/';
    try{
      if(navigator.share){await navigator.share({title:'AmarangoElectro',text:texto,url});return;}
      await navigator.clipboard.writeText(texto+' '+url);
      window.margaritaPintar?.('margarita','¡Listo! 😊 Copié el enlace de la tienda para que lo puedas compartir.');
    }catch(e){
      if(e&&e.name==='AbortError')return;
      window.open('https://wa.me/?text='+encodeURIComponent(texto+' '+url),'_blank','noopener');
    }
  }

  function mostrarAcciones(){
    if(!esCliente())return;
    const msgs=document.getElementById('margarita-msgs');
    if(!msgs||msgs.querySelector('.mg-premium-actions'))return;
    estilos();
    const box=document.createElement('div');
    box.className='mg-premium-actions';
    const registrado=!!datos();
    box.innerHTML=`
      <button type="button" data-mg="como">🛍️ Cómo comprar</button>
      ${registrado?'':'<button type="button" data-mg="registro">✍️ Registrarme</button>'}
      <button type="button" data-mg="equipo">💬 Hablar con el equipo</button>
      <button type="button" data-mg="share" class="mg-share">↗ Compartir tienda</button>
      <div class="mg-premium-note">Podés tocar una opción o escribirme con tus palabras.</div>
    `;
    box.querySelector('[data-mg="como"]').onclick=()=>{box.remove();enviarFrase('¿Cómo puedo comprar desde la tienda?');};
    const reg=box.querySelector('[data-mg="registro"]');
    if(reg)reg.onclick=()=>{box.remove();try{sessionStorage.removeItem(LATER);}catch(e){}if(typeof window.margaritaGuiaOfrecerRegistro==='function')window.margaritaGuiaOfrecerRegistro();else enviarFrase('Quiero registrarme');};
    box.querySelector('[data-mg="equipo"]').onclick=()=>{box.remove();enviarFrase('Quiero hablar con el equipo de AmarangoElectro');};
    box.querySelector('[data-mg="share"]').onclick=()=>compartirTienda();
    msgs.appendChild(box);
    msgs.scrollTop=msgs.scrollHeight;
  }

  function personalizarTeaser(){
    if(!esCliente())return;
    const n=nombre();
    if(!n)return;
    const t=document.getElementById('margarita-teaser');
    if(!t||t.dataset.mgPersonalizado==='1')return;
    t.dataset.mgPersonalizado='1';
    t.textContent='';
    const b=document.createElement('b');
    b.textContent=`¡Qué bueno verte de nuevo, ${n}! 🐝`;
    const br=document.createElement('br');
    const span=document.createElement('span');
    span.textContent='Estoy acá si necesitás ayuda.';
    t.append(b,br,span);
  }

  function instalar(){
    if(!esCliente())return;
    estilos();
    const fab=document.getElementById('margarita-fab');
    if(fab)fab.addEventListener('click',()=>setTimeout(mostrarAcciones,520));
    const obs=new MutationObserver(()=>personalizarTeaser());
    obs.observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(personalizarTeaser,500);
    setTimeout(personalizarTeaser,1200);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',instalar,{once:true});else instalar();
})();
