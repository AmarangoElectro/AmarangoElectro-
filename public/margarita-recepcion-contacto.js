/* AmarangoElectro · Margarita recepción humana
   Mejora la experiencia cliente sin tocar V21 ni el catálogo.
   - Detecta pedidos de atención humana y muestra contactos reales.
   - Cambia el placeholder para reflejar el rol de guía/recepción.
   - Mantiene accesos rápidos discretos junto al compositor.
*/
(function(){
  'use strict';
  const VERSION='mg-recepcion-contacto-20260825-1';
  if(window.__MG_RECEPCION_CONTACTO__===VERSION)return;
  window.__MG_RECEPCION_CONTACTO__=VERSION;

  const MAXI='5491168610532';
  const ANGIE='5491168746034';
  const KEY='ae_margarita_guia_cliente';

  function esAdmin(){try{return (typeof window.esAdmin==='function'&&window.esAdmin())||window.tiendaEsAdmin===true||(window.adminUnlocked===true&&window.vistaPreviaCliente!==true)||localStorage.getItem('ae_rol')==='admin';}catch(e){return false;}}
  function esAsesor(){if(esAdmin())return false;try{if(window.vistaPreviaCliente===true)return false;return window.revUnlocked===true||/asesor|revendedor|vendedor/i.test(String(localStorage.getItem('ae_rol')||''));}catch(e){return false;}}
  function esCliente(){return !esAdmin()&&!esAsesor();}
  function datos(){try{return JSON.parse(localStorage.getItem(KEY)||'null');}catch(e){return null;}}
  function nombre(){return String(datos()?.nombre||'').trim().slice(0,40);}
  function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();}

  function quiereHumano(t){
    const n=norm(t);
    return /\b(hablar|atender|atiende|persona|humano|vendedor|asesor|equipo|maxi|angie|angela)\b/.test(n) &&
      (/\b(hablar|atender|atiende|persona|humano|equipo)\b/.test(n) || /\b(maxi|angie|angela|vendedor|asesor)\b/.test(n));
  }

  function abrirWA(numero,persona){
    const n=nombre();
    const texto=`Hola ${persona}, vengo desde la tienda de AmarangoElectro${n?` y soy ${n}`:''}. Quiero hacer una consulta.`;
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(texto)}`,'_blank','noopener');
  }

  function estilos(){
    if(document.getElementById('mg-recepcion-style'))return;
    const s=document.createElement('style');
    s.id='mg-recepcion-style';
    s.textContent=`
      .mg-humanos{margin:8px 10px 12px;display:grid;grid-template-columns:1fr 1fr;gap:8px}
      .mg-humanos button{border:0;border-radius:14px;padding:11px 10px;background:#0B2D6B;color:#fff;font:800 .76rem/1.15 system-ui,-apple-system,Segoe UI,sans-serif;box-shadow:0 4px 12px rgba(3,15,45,.14);cursor:pointer}
      .mg-humanos button:nth-child(2){background:#174FA8}
      .mg-humanos small{grid-column:1/-1;color:#718096;font:600 .66rem/1.35 system-ui,-apple-system,Segoe UI,sans-serif;text-align:center;padding:0 5px}
      .mg-recepcion-quick{display:flex;gap:6px;overflow-x:auto;padding:6px 12px 5px;scrollbar-width:none;background:rgba(255,255,255,.78);border-top:1px solid rgba(11,45,107,.06)}
      .mg-recepcion-quick::-webkit-scrollbar{display:none}
      .mg-recepcion-quick button{flex:0 0 auto;border:1px solid rgba(11,45,107,.12);background:#fff;color:#0B2D6B;border-radius:999px;padding:7px 10px;font:800 .66rem/1 system-ui,-apple-system,Segoe UI,sans-serif;cursor:pointer}
      body.oscuro .mg-recepcion-quick{background:rgba(10,24,48,.88)}
      body.oscuro .mg-recepcion-quick button{background:#122442;color:#e8eef7;border-color:#294566}
    `;
    document.head.appendChild(s);
  }

  function mostrarContactos(){
    const msgs=document.getElementById('margarita-msgs');
    if(!msgs)return;
    msgs.querySelectorAll('.mg-humanos').forEach(x=>x.remove());
    window.margaritaPintar?.('margarita','Claro 😊 Si querés atención personal, podés hablar directamente con Maxi o Angie. Si ya tenés un asesor asignado, escribile a su número y te va a ayudar.');
    const box=document.createElement('div');
    box.className='mg-humanos';
    box.innerHTML='<button type="button" data-h="maxi">💬 Hablar con Maxi</button><button type="button" data-h="angie">💬 Hablar con Angie</button><small>La compra, el pago y la confirmación final siempre continúan con una persona del equipo.</small>';
    box.querySelector('[data-h="maxi"]').onclick=()=>abrirWA(MAXI,'Maxi');
    box.querySelector('[data-h="angie"]').onclick=()=>abrirWA(ANGIE,'Angie');
    msgs.appendChild(box);
    msgs.scrollTop=msgs.scrollHeight;
  }

  function enviarFrase(frase){
    const input=document.getElementById('margarita-input');
    if(!input||typeof window.margaritaEnviar!=='function')return;
    input.value=frase;
    input.dispatchEvent(new Event('input',{bubbles:true}));
    window.margaritaEnviar();
  }

  function instalarQuick(){
    if(!esCliente())return;
    const input=document.getElementById('margarita-input');
    if(!input)return;
    input.placeholder='Escribime tu consulta…';
    const parent=input.parentElement;
    if(!parent||document.querySelector('.mg-recepcion-quick'))return;
    const bar=document.createElement('div');
    bar.className='mg-recepcion-quick';
    bar.innerHTML='<button type="button" data-q="ayuda">🧭 Cómo usar la tienda</button><button type="button" data-q="equipo">💬 Hablar con el equipo</button><button type="button" data-q="registro">✍️ Registrarme</button>';
    bar.querySelector('[data-q="ayuda"]').onclick=()=>enviarFrase('¿Cómo uso la tienda?');
    bar.querySelector('[data-q="equipo"]').onclick=()=>mostrarContactos();
    bar.querySelector('[data-q="registro"]').onclick=()=>{if(typeof window.margaritaGuiaOfrecerRegistro==='function')window.margaritaGuiaOfrecerRegistro();else enviarFrase('Quiero registrarme');};
    parent.parentElement?.insertBefore(bar,parent);
  }

  function interceptar(){
    const panel=document.getElementById('margarita-panel')||document.getElementById('margarita-overlay');
    const input=document.getElementById('margarita-input');
    if(!panel||!input)return;
    panel.addEventListener('click',function(ev){
      if(!esCliente())return;
      const btn=ev.target&&ev.target.closest?ev.target.closest('button'):null;
      if(!btn||!input.parentElement?.contains(btn))return;
      const t=String(input.value||'').trim();
      if(!t||!quiereHumano(t))return;
      ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
      window.margaritaPintar?.('cliente',t);
      input.value='';
      setTimeout(mostrarContactos,120);
    },true);
    input.addEventListener('keydown',function(ev){
      if(ev.key!=='Enter'||ev.shiftKey||!esCliente())return;
      const t=String(input.value||'').trim();
      if(!t||!quiereHumano(t))return;
      ev.preventDefault();ev.stopPropagation();
      window.margaritaPintar?.('cliente',t);
      input.value='';
      setTimeout(mostrarContactos,120);
    },true);
  }

  function instalar(){
    if(!esCliente())return;
    estilos();
    interceptar();
    instalarQuick();
    const fab=document.getElementById('margarita-fab');
    fab?.addEventListener('click',()=>setTimeout(()=>{instalarQuick();const i=document.getElementById('margarita-input');if(i)i.placeholder='Escribime tu consulta…';},220));
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',instalar,{once:true});else instalar();
})();
