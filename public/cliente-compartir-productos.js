/* AmarangoElectro · compartir productos para clientes
   - agrega un botón compacto en cada tarjeta pública
   - usa el compartir nativo ya existente de la tienda
   - conserva foto, texto comercial y URL del producto generados por compartirProducto
   - no agrega herramientas internas de Admin/Asesor
*/
(function(){
  'use strict';
  var VERSION='cliente-share-productos-2026-08-24-1';
  if(window.__AE_CLIENT_SHARE_PRODUCTS__===VERSION)return;
  window.__AE_CLIENT_SHARE_PRODUCTS__=VERSION;

  var ICON='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="2.5"></circle><circle cx="6" cy="12" r="2.5"></circle><circle cx="18" cy="19" r="2.5"></circle><path d="m8.3 10.7 7.3-4.2M8.3 13.3l7.3 4.2"></path></svg>';

  function ls(k){try{return localStorage.getItem(k)||'';}catch(e){return '';}}
  function esCliente(){
    try{
      if(window.vistaPreviaCliente===true)return true;
      if(window.tiendaEsAdmin===true||window.adminUnlocked===true||window.revUnlocked===true)return false;
      if(document.body&&document.body.classList.contains('rol-admin'))return false;
      if(document.body&&document.body.classList.contains('rol-revendedor'))return false;
      var r=String(ls('ae_rol')||'').toLowerCase();
      return !(/admin|asesor|revendedor|vendedor/.test(r));
    }catch(e){return true;}
  }

  function estilos(){
    if(document.getElementById('ae-client-share-product-style'))return;
    var s=document.createElement('style');s.id='ae-client-share-product-style';s.textContent=`
.ae-client-share-product{width:100%;margin-top:6px;padding:7px 8px;border:1.5px solid rgba(11,45,107,.18);border-radius:9px;background:rgba(255,255,255,.96);color:#0B2D6B;display:flex;align-items:center;justify-content:center;gap:6px;font:850 .67rem/1 system-ui,-apple-system,Segoe UI,sans-serif;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;box-shadow:0 1px 4px rgba(11,45,107,.05)}.ae-client-share-product svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex:0 0 auto}.ae-client-share-product:active{transform:scale(.985)}
`;
    document.head.appendChild(s);
  }

  function aviso(txt){
    try{if(typeof window.mostrarToast==='function'){window.mostrarToast(txt);return;}}catch(e){}
  }

  function compartir(id){
    try{
      if(typeof window.compartirProducto==='function'){
        window.compartirProducto(id,true);
        return;
      }
    }catch(e){}
    aviso('El botón para compartir se está preparando. Probá de nuevo en un segundo.');
  }

  function agregar(card){
    if(!card||card.querySelector('.ae-client-share-product'))return;
    var id=String(card.id||'').replace(/^card-/,'');if(!id)return;
    var btn=document.createElement('button');btn.type='button';btn.className='ae-client-share-product';
    btn.setAttribute('aria-label','Compartir producto');btn.innerHTML=ICON+'<span>Compartir</span>';
    btn.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();try{if(navigator.vibrate)navigator.vibrate(6);}catch(e){}compartir(id);});

    // Va debajo de “Ver producto”: visible, consistente y sin tapar foto/precio.
    var ver=Array.from(card.querySelectorAll('button')).find(function(b){return /ver producto/i.test(String(b.textContent||''));});
    if(ver&&ver.parentNode===card){
      if(ver.nextSibling)card.insertBefore(btn,ver.nextSibling);else card.appendChild(btn);
    }else card.appendChild(btn);
  }

  function limpiarFueraCliente(){document.querySelectorAll('.ae-client-share-product').forEach(function(b){b.remove();});}
  function sincronizar(){
    estilos();
    if(!esCliente()){limpiarFueraCliente();return;}
    document.querySelectorAll('#tienda-grid .prod-card[id^="card-"]').forEach(agregar);
  }

  var obs=null;
  function instalar(){
    sincronizar();
    if(!obs&&document.body){obs=new MutationObserver(function(){sincronizar();});obs.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});}
    setInterval(sincronizar,1400);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',instalar,{once:true});else instalar();
})();