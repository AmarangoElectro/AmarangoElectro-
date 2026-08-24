/* AmarangoElectro · compartir comercial + deep link de producto
   - amplía compartirProducto() solo para clientes, sin tocar Admin/Asesor
   - reutiliza tiendaBlobParaCompartir/tiendaArchivoCompartible: sin loops extra de imágenes
   - comparte foto cuando existe, texto comercial y URL exacta del producto
   - fallback: share sin archivo o portapapeles
   - ?producto=ID abre el detalle exacto si está publicado
*/
(function(){
  'use strict';
  var VERSION='cliente-share-deeplink-2026-08-24-2';
  if(window.__AE_CLIENT_SHARE_DEEPLINK__===VERSION)return;
  window.__AE_CLIENT_SHARE_DEEPLINK__=VERSION;

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

  function dinero(n){
    try{return new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(Number(n)||0);}
    catch(e){return '$'+Math.round(Number(n)||0);}
  }

  function aviso(txt){
    try{if(typeof window.mostrarToast==='function'){window.mostrarToast(txt);return;}}catch(e){}
    var t=document.getElementById('ae-share-fallback-toast');
    if(!t){
      t=document.createElement('div');t.id='ae-share-fallback-toast';
      t.style.cssText='position:fixed;left:50%;bottom:92px;transform:translate(-50%,10px);z-index:19000;background:#0B2D6B;color:#fff;border-bottom:3px solid #FF7A00;border-radius:12px;padding:10px 13px;font:850 .68rem/1.25 system-ui;box-shadow:0 9px 28px rgba(0,0,0,.25);opacity:0;transition:.18s;pointer-events:none;max-width:86vw;text-align:center;';
      document.body.appendChild(t);
    }
    t.textContent=txt;t.style.opacity='1';t.style.transform='translate(-50%,0)';
    clearTimeout(t.__tm);t.__tm=setTimeout(function(){t.style.opacity='0';t.style.transform='translate(-50%,10px)';},1900);
  }

  function copiar(texto){
    if(navigator.clipboard&&navigator.clipboard.writeText){
      return navigator.clipboard.writeText(texto).catch(function(){return copiarFallback(texto);});
    }
    return copiarFallback(texto);
  }
  function copiarFallback(texto){
    return new Promise(function(resolve,reject){
      try{
        var ta=document.createElement('textarea');ta.value=texto;ta.setAttribute('readonly','');
        ta.style.cssText='position:fixed;opacity:0;pointer-events:none;left:-9999px;top:0;';
        document.body.appendChild(ta);ta.select();ta.setSelectionRange(0,ta.value.length);
        var ok=document.execCommand('copy');ta.remove();
        if(ok)resolve();else reject(new Error('copy-failed'));
      }catch(e){reject(e);}
    });
  }

  function linkProducto(id){
    var u=new URL('/',window.location.origin);
    u.searchParams.set('producto',String(id));
    return u.toString();
  }

  function financiacion(p,precio){
    try{
      if(typeof window.mejorCuotaDatos==='function'){
        var d=window.mejorCuotaDatos(precio,p);
        if(d&&Number(d.n)>0&&Number(d.valor)>0){
          return Number(d.n)+' cuotas fijas de '+dinero(d.valor)+(d.sinInteres?' sin interés':'');
        }
      }
    }catch(e){}
    return 'Consultá financiación disponible';
  }

  function mensajeProducto(p,id){
    var precio=Number(p&&p.venta||p&&p.precioVenta||p&&p.precio||0);
    var nombre=String(p&&p.nombre||'Producto AmarangoElectro').trim();
    var link=linkProducto(id);
    return '🐝 *'+nombre+'*\n'
      +'💵 '+dinero(precio)+'\n'
      +'💳 '+financiacion(p,precio)+'\n'
      +'🛒 Compralo o consultá acá: '+link+'\n'
      +'_AmarangoElectro · Todo para tu hogar, más fácil_';
  }

  function archivoDesdeBlob(blob,p){
    try{
      if(typeof window.tiendaArchivoCompartible==='function')return window.tiendaArchivoCompartible(blob,p);
    }catch(e){}
    if(typeof window.File==='function'){
      var tipo=blob&&blob.type||'image/jpeg';
      var ext=tipo.indexOf('png')>=0?'.png':tipo.indexOf('webp')>=0?'.webp':'.jpg';
      return new File([blob],'amarango-producto'+ext,{type:tipo});
    }
    return null;
  }

  async function compartirCliente(id){
    var p=null;
    try{if(typeof window.buscarProd==='function')p=window.buscarProd(id);}catch(e){}
    if(!p){aviso('No encontré ese producto para compartir.');return;}

    var texto=mensajeProducto(p,id);
    if(p.foto&&navigator.share&&typeof window.tiendaBlobParaCompartir==='function'){
      try{
        var blob=await window.tiendaBlobParaCompartir(p);
        var file=archivoDesdeBlob(blob,p);
        if(file&&(!navigator.canShare||navigator.canShare({files:[file]}))){
          await navigator.share({files:[file],title:String(p.nombre||'AmarangoElectro'),text:texto});
          return;
        }
      }catch(e){
        if(e&&e.name==='AbortError')return;
        // Si la foto falla, seguimos con texto+link; nunca hacemos un segundo loop de descarga.
      }
    }

    if(navigator.share){
      try{
        await navigator.share({title:String(p.nombre||'AmarangoElectro'),text:texto});
        return;
      }catch(e){if(e&&e.name==='AbortError')return;}
    }

    try{await copiar(texto);aviso('✅ ¡Copiado! Pegalo donde quieras.');}
    catch(e){aviso('No pude abrir el menú para compartir.');}
  }

  function instalarWrapper(){
    var original=window.compartirProducto;
    if(typeof original!=='function')return false;
    if(original.__aeClienteDeepLink===VERSION)return true;
    function compartirProductoAE(id,soloCliente){
      if(soloCliente===true||esCliente())return compartirCliente(id);
      return original.apply(this,arguments);
    }
    compartirProductoAE.__aeClienteDeepLink=VERSION;
    compartirProductoAE.__original=original;
    window.compartirProducto=compartirProductoAE;
    return true;
  }

  function mensajeTienda(){
    var link=new URL('/',window.location.origin).toString();
    return '🐝 *AmarangoElectro* — Todo para tu hogar, más fácil\n'
      +'📱 Electrodomésticos, tecnología y mucho más.\n'
      +'💳 Contado y financiación disponible.\n'
      +'🛒 Entrá acá: '+link;
  }

  async function compartirTiendaCliente(){
    var texto=mensajeTienda();
    if(navigator.share){
      try{await navigator.share({title:'AmarangoElectro',text:texto});return;}
      catch(e){if(e&&e.name==='AbortError')return;}
    }
    try{await copiar(texto);aviso('✅ Enlace de la tienda copiado.');}
    catch(e){aviso('No pude abrir el menú para compartir.');}
  }

  document.addEventListener('click',function(ev){
    var btn=ev.target&&ev.target.closest?ev.target.closest('#ae-share-store-btn'):null;
    if(!btn||!esCliente())return;
    ev.preventDefault();ev.stopImmediatePropagation();
    try{if(navigator.vibrate)navigator.vibrate(6);}catch(e){}
    compartirTiendaCliente();
  },true);

  function productoApto(p){
    if(!p||p.visible===false||p.sinStock===true)return false;
    try{if(typeof window.tiendaEstaVisibleYConStock==='function')return !!window.tiendaEstaVisibleYConStock(p);}catch(e){}
    return true;
  }

  function procesarDeepLink(intentos){
    if(!esCliente())return;
    var id='';
    try{id=new URL(window.location.href).searchParams.get('producto')||'';}catch(e){}
    if(!id||window.__AE_PRODUCTO_DEEPLINK_ABIERTO__===id)return;

    var listoBuscar=typeof window.buscarProd==='function';
    var listoDetalle=typeof window.tiendaVerDetalle==='function';
    var syncConocida=typeof window._tiendaSincronizacionInicialLista!=='undefined';
    var syncLista=!syncConocida||window._tiendaSincronizacionInicialLista===true;
    if((!listoBuscar||!listoDetalle||!syncLista)&&intentos<90){
      setTimeout(function(){procesarDeepLink(intentos+1);},180);return;
    }

    var p=null;
    try{if(listoBuscar)p=window.buscarProd(id);}catch(e){}
    // Si buscarProd ya existe pero el catálogo todavía no terminó de hidratar,
    // no declaramos el link inválido: esperamos hasta ~16 s antes de abandonar.
    if(!p&&intentos<90){
      setTimeout(function(){procesarDeepLink(intentos+1);},180);return;
    }
    window.__AE_PRODUCTO_DEEPLINK_ABIERTO__=id;
    if(!p){aviso('Ese producto ya no está disponible. Te mostramos la tienda.');return;}
    if(!productoApto(p)){aviso('Ese producto no está disponible ahora. Te mostramos alternativas.');return;}
    try{window.tiendaVerDetalle(id);}catch(e){aviso('Abrimos la tienda, pero no pude mostrar ese producto automáticamente.');}
  }

  function instalar(){
    var n=0;(function esperarWrapper(){if(instalarWrapper())return;if(n++<80)setTimeout(esperarWrapper,150);})();
    setTimeout(function(){procesarDeepLink(0);},350);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',instalar,{once:true});else instalar();
})();
