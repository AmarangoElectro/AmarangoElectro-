// V21: al abrir la tienda, mostrar productos reales y asegurar que "Ver todos" funcione.
(function(){
  'use strict';
  const VERSION='ae-inicio-productos-v21-20260824-1';
  if(window.__AE_INICIO_PRODUCTOS__===VERSION)return;
  window.__AE_INICIO_PRODUCTOS__=VERSION;

  function hayBusqueda(){
    const a=(document.getElementById('tienda-buscar')?.value||'').trim();
    const b=(document.getElementById('hdr-buscar-input')?.value||'').trim();
    return !!(a||b);
  }
  function hayFiltroEspecial(){
    return !!(window.tiendaCategoriaActiva||window.tiendaMarcaActiva||window.tiendaSubfiltroActivo||window.tiendaBandejaAdmin||window.verSoloFavoritos||window.verSoloOfertas||window.verSoloPreciosViejos);
  }
  function mostrarTodos(){
    try{window.tiendaCategoriaActiva='';window.tiendaMarcaActiva='';window.tiendaSubfiltroActivo='';window.tiendaBandejaAdmin='';}catch(e){}
    try{window.verSoloFavoritos=false;window.verSoloOfertas=false;window.verSoloPreciosViejos=false;}catch(e){}
    try{window.tiendaModoPortada=false;window.tiendaMostrarTodos=true;}catch(e){}
    const a=document.getElementById('tienda-buscar');if(a)a.value='';
    const b=document.getElementById('hdr-buscar-input');if(b)b.value='';
    try{if(typeof window.tiendaRender==='function')window.tiendaRender();}catch(e){}
    setTimeout(()=>{const g=document.getElementById('tienda-grid');if(g&&g.scrollIntoView)g.scrollIntoView({behavior:'smooth',block:'start'});},40);
  }
  function repararBoton(){
    const botones=[...document.querySelectorAll('button,a')].filter(el=>/ver todos los productos/i.test(String(el.textContent||'').trim()));
    botones.forEach(btn=>{
      if(btn.dataset.aeVerTodos==='1')return;
      btn.dataset.aeVerTodos='1';
      btn.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();mostrarTodos();},true);
    });
  }
  function inicio(attempt=0){
    repararBoton();
    const lista=Array.isArray(window.tiendaProductos)?window.tiendaProductos:[];
    if(!lista.length && attempt<30){setTimeout(()=>inicio(attempt+1),250);return;}
    if(!hayBusqueda()&&!hayFiltroEspecial()){
      try{window.tiendaModoPortada=false;window.tiendaMostrarTodos=true;}catch(e){}
      try{if(typeof window.tiendaRender==='function')window.tiendaRender();}catch(e){}
    }
    repararBoton();
  }
  window.aeTiendaMostrarTodos=mostrarTodos;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>inicio(),{once:true});else inicio();
  new MutationObserver(repararBoton).observe(document.documentElement,{childList:true,subtree:true});
})();
