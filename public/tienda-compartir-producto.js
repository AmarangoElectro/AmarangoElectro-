/* AmarangoElectro · compartir producto
   Agrega un botón de compartir junto a la lupa de cada tarjeta.
   Usa Web Share cuando está disponible y copia el enlace como fallback.
*/
(function(){
  'use strict';
  var VERSION='ae-share-product-2026-08-24-2';
  if(window.__AE_SHARE_PRODUCT__===VERSION)return;
  window.__AE_SHARE_PRODUCT__=VERSION;

  var ICON='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"></path></svg>';

  function productoPorCard(card){
    if(!card)return null;
    var id=String(card.id||'').replace(/^card-/,'');
    try{if(typeof window.buscarProd==='function'){var p=window.buscarProd(id);if(p)return p;}}catch(e){}
    var lista=Array.isArray(window.tiendaProductos)?window.tiendaProductos:[];
    for(var i=0;i<lista.length;i++)if(String(lista[i]&&lista[i].id)===id)return lista[i];
    return null;
  }
  function enlaceProducto(p,card){
    var id=p&&p.id!=null?p.id:String(card&&card.id||'').replace(/^card-/,'');
    var u=new URL(location.href);
    u.search='';u.hash='';
    if(id!=='')u.searchParams.set('prod',id);
    return u.toString();
  }
  function mensajeProducto(p,url){
    var nombre=String(p&&p.nombre||'este producto').trim();
    return '🐝 Mirá '+nombre+' en AmarangoElectro.\nHasta 6 cuotas fijas.\nConocé el producto y más opciones acá:\n'+url;
  }
  function copiar(texto){
    if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(texto);
    return new Promise(function(resolve,reject){try{var ta=document.createElement('textarea');ta.value=texto;ta.style.cssText='position:fixed;opacity:0;left:-9999px';document.body.appendChild(ta);ta.select();var ok=document.execCommand('copy');ta.remove();ok?resolve():reject(new Error('copy'));}catch(e){reject(e);}});
  }
  function toast(t){try{if(typeof window.mostrarToast==='function'){window.mostrarToast(t);return;}}catch(e){}var x=document.getElementById('ae-share-toast');if(!x){x=document.createElement('div');x.id='ae-share-toast';x.style.cssText='position:fixed;left:50%;bottom:92px;transform:translateX(-50%);z-index:16000;background:#071c46;color:#fff;border-left:4px solid #FF7A00;border-radius:12px;padding:10px 14px;font:800 .75rem/1.2 system-ui;box-shadow:0 8px 24px #0003;';document.body.appendChild(x);}x.textContent=t;clearTimeout(x._t);x._t=setTimeout(function(){x.remove();},1700);}
  function compartir(card){
    var p=productoPorCard(card),url=enlaceProducto(p,card),texto=mensajeProducto(p,url),nombre=String(p&&p.nombre||'Producto AmarangoElectro');
    if(navigator.share){navigator.share({title:nombre,text:texto,url:url}).catch(function(e){if(e&&e.name==='AbortError')return;copiar(texto).then(function(){toast('🔗 Enlace copiado');});});return;}
    copiar(texto).then(function(){toast('🔗 Enlace copiado para compartir');}).catch(function(){toast('No se pudo compartir');});
  }
  function posicionar(card,zoom,b){
    if(!card||!zoom||!b)return false;
    var cr=card.getBoundingClientRect(),zr=zoom.getBoundingClientRect();
    if(!cr.width||!zr.width||!zr.height)return false;
    if(getComputedStyle(card).position==='static')card.style.position='relative';
    var size=Math.max(34,Math.min(44,Math.round(Math.min(zr.width,zr.height))));
    b.style.left=Math.round(zr.left-cr.left+zr.width+7)+'px';
    b.style.top=Math.round(zr.top-cr.top+(zr.height-size)/2)+'px';
    b.style.width=size+'px';
    b.style.height=size+'px';
    b.style.opacity='1';
    return true;
  }
  function buscarZoom(card){
    return card&&card.querySelector('button[onclick*="abrirFotoGrande"],button[aria-label*="ampli" i],button[title*="ampli" i]');
  }
  function ajustarCard(card){
    if(!card)return;
    var zoom=buscarZoom(card);if(!zoom)return;
    var b=card.querySelector('.ae-share-product');
    if(!b){
      b=document.createElement('button');b.type='button';b.className='ae-share-product';b.setAttribute('aria-label','Compartir producto');b.setAttribute('title','Compartir producto');b.innerHTML=ICON;
      b.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();compartir(card);});
      card.appendChild(b);
    }
    posicionar(card,zoom,b);
  }
  function decorar(){document.querySelectorAll('#tienda-grid .prod-card,[id^="card-"]').forEach(ajustarCard);}
  function reacomodar(){
    decorar();
    requestAnimationFrame(function(){decorar();requestAnimationFrame(decorar);});
    setTimeout(decorar,120);
    setTimeout(decorar,350);
  }
  function estilos(){if(document.getElementById('ae-share-product-css'))return;var s=document.createElement('style');s.id='ae-share-product-css';s.textContent='.ae-share-product{position:absolute;z-index:7;width:40px;height:40px;max-width:44px;max-height:44px;min-width:34px;min-height:34px;opacity:0;border:0;border-radius:999px;background:rgba(11,45,107,.82);color:#fff;display:flex;align-items:center;justify-content:center;padding:0;box-shadow:0 3px 12px rgba(0,0,0,.18);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);cursor:pointer;-webkit-tap-highlight-color:transparent;transition:opacity .12s ease,transform .08s ease}.ae-share-product svg{display:block;width:54%;height:54%;max-width:24px;max-height:24px;pointer-events:none}.ae-share-product:active{transform:scale(.94)}';document.head.appendChild(s);}
  function instalar(){
    estilos();reacomodar();
    var g=document.getElementById('tienda-grid');
    if(g)new MutationObserver(function(){reacomodar();}).observe(g,{childList:true,subtree:true});
    window.addEventListener('resize',reacomodar,{passive:true});
    window.addEventListener('load',reacomodar,{once:true});
    document.addEventListener('load',function(ev){if(ev.target&&ev.target.tagName==='IMG')setTimeout(reacomodar,0);},true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',instalar,{once:true});else instalar();
})();
