/* AmarangoElectro · UX profesional
   - reemplaza alertas genéricas por diálogos de marca
   - reemplaza long-press/context menu de imágenes por action sheet propio
   - agrega Copiar nombre / Copiar todo en detalle
   - unifica feedback táctil sin alterar la lógica de negocio */
(function(){
  'use strict';
  var VERSION='ae-pro-ux-2026-08-23-1';
  if(window.__AE_PRO_UX__===VERSION)return;
  window.__AE_PRO_UX__=VERSION;

  var ICON={
    copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',
    text:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h16M4 18h10"></path></svg>',
    download:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"></path><path d="m7 10 5 5 5-5"></path><path d="M5 21h14"></path></svg>',
    share:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"></path></svg>',
    external:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3h7v7"></path><path d="M10 14 21 3"></path><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"></path></svg>',
    info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"></circle><path d="M12 10v6M12 7h.01"></path></svg>'
  };

  function esMovil(){
    try{return window.matchMedia&&window.matchMedia('(pointer:coarse)').matches;}catch(e){return false;}
  }
  function vibrar(ms){
    if(!esMovil())return;
    try{if(navigator.vibrate)navigator.vibrate(ms||6);}catch(e){}
  }
  function toast(txt){
    try{if(typeof window.mostrarToast==='function'){window.mostrarToast(txt);return;}}catch(e){}
    var t=document.getElementById('ae-pro-mini-toast');
    if(!t){
      t=document.createElement('div');t.id='ae-pro-mini-toast';
      t.style.cssText='position:fixed;left:50%;bottom:92px;transform:translate(-50%,12px);z-index:13000;background:#071c46;color:#fff;border-left:4px solid #FF7A00;border-radius:13px;padding:10px 14px;font:800 .78rem/1.25 system-ui;box-shadow:0 10px 28px rgba(0,0,0,.25);opacity:0;transition:.18s;pointer-events:none;max-width:86vw;';
      document.body.appendChild(t);
    }
    t.textContent=txt;t.style.opacity='1';t.style.transform='translate(-50%,0)';
    clearTimeout(t._aeTimer);t._aeTimer=setTimeout(function(){t.style.opacity='0';t.style.transform='translate(-50%,12px)';},1800);
  }

  function copiarTexto(texto){
    texto=String(texto==null?'':texto);
    if(navigator.clipboard&&navigator.clipboard.writeText){
      return navigator.clipboard.writeText(texto).catch(function(){return copiarTextoFallback(texto);});
    }
    return copiarTextoFallback(texto);
  }
  function copiarTextoFallback(texto){
    return new Promise(function(resolve,reject){
      try{
        var ta=document.createElement('textarea');
        ta.value=texto;ta.setAttribute('readonly','');ta.style.cssText='position:fixed;opacity:0;pointer-events:none;left:-9999px;top:0;';
        document.body.appendChild(ta);ta.select();ta.setSelectionRange(0,ta.value.length);
        var ok=document.execCommand('copy');ta.remove();
        if(ok)resolve();else reject(new Error('No se pudo copiar'));
      }catch(e){reject(e);}
    });
  }

  /* ---------------- Diálogo de marca para alertas ---------------- */
  var colaAlertas=[],alertaAbierta=false;
  var alertaOverlay=null,alertaMsg=null,alertaAcciones=null;
  var alertOriginal=window.alert;
  window.__aeAlertOriginal=alertOriginal;

  function crearAlerta(){
    if(alertaOverlay||!document.body)return;
    alertaOverlay=document.createElement('div');
    alertaOverlay.id='ae-pro-alert';
    alertaOverlay.className='ae-pro-overlay';
    alertaOverlay.setAttribute('role','presentation');
    alertaOverlay.innerHTML=''
      +'<div class="ae-pro-dialog" role="alertdialog" aria-modal="true" aria-labelledby="ae-pro-alert-title">'
      +'<div class="ae-pro-dialog-head">'
      +'<div class="ae-pro-brand-badge"><img src="/icon.png" alt=""></div>'
      +'<div id="ae-pro-alert-title" class="ae-pro-dialog-title">AmarangoElectro</div>'
      +'<div class="ae-pro-dialog-accent"></div></div>'
      +'<div class="ae-pro-dialog-body"><div class="ae-pro-dialog-message"></div></div>'
      +'<div class="ae-pro-dialog-actions"></div>'
      +'</div>';
    document.body.appendChild(alertaOverlay);
    alertaMsg=alertaOverlay.querySelector('.ae-pro-dialog-message');
    alertaAcciones=alertaOverlay.querySelector('.ae-pro-dialog-actions');
  }

  function cerrarAlerta(){
    if(!alertaOverlay)return;
    alertaOverlay.classList.remove('is-open');
    alertaAbierta=false;
    setTimeout(mostrarSiguienteAlerta,120);
  }

  function opcionesAlerta(mensaje){
    var s=String(mensaje||'').toLowerCase();
    var pid=window.__aeUltimoProductoAccion||window._tiendaDetalleId||null;
    if(s.indexOf('pendiente de revisión')>=0||s.indexOf('pendiente de revision')>=0){
      return {
        primary:'Entendido',
        secondary:'Editar precio',
        secondaryAction:function(){
          cerrarAlerta();
          if(pid!=null&&typeof window.tiendaEditarPrecio==='function')setTimeout(function(){window.tiendaEditarPrecio(pid);},80);
        }
      };
    }
    return {primary:'Entendido'};
  }

  function mostrarSiguienteAlerta(){
    if(alertaAbierta||!colaAlertas.length)return;
    crearAlerta();
    if(!alertaOverlay)return;
    alertaAbierta=true;
    var item=colaAlertas.shift();
    var cfg=opcionesAlerta(item.mensaje);
    alertaMsg.textContent=item.mensaje;
    alertaAcciones.innerHTML='';
    alertaAcciones.className='ae-pro-dialog-actions'+(cfg.secondary?' two':'');
    if(cfg.secondary){
      var sec=document.createElement('button');sec.type='button';sec.className='ae-pro-btn secondary';sec.textContent=cfg.secondary;
      sec.addEventListener('click',function(){vibrar(7);if(cfg.secondaryAction)cfg.secondaryAction();else cerrarAlerta();});
      alertaAcciones.appendChild(sec);
    }
    var pri=document.createElement('button');pri.type='button';pri.className='ae-pro-btn primary';pri.textContent=cfg.primary||'Entendido';
    pri.addEventListener('click',function(){vibrar(7);cerrarAlerta();});
    alertaAcciones.appendChild(pri);
    requestAnimationFrame(function(){alertaOverlay.classList.add('is-open');setTimeout(function(){try{pri.focus({preventScroll:true});}catch(e){}},120);});
  }

  function mostrarAlerta(mensaje){
    colaAlertas.push({mensaje:String(mensaje==null?'':mensaje)});
    mostrarSiguienteAlerta();
  }
  window.aeMostrarAlerta=mostrarAlerta;
  window.alert=function(mensaje){mostrarAlerta(mensaje);};

  /* ---------------- Action sheet propio para imágenes ---------------- */
  var sheetOverlay=null,sheetThumb=null,sheetName=null,sheetCtx=null;
  function crearSheet(){
    if(sheetOverlay||!document.body)return;
    sheetOverlay=document.createElement('div');
    sheetOverlay.id='ae-image-sheet';
    sheetOverlay.className='ae-pro-overlay ae-sheet-overlay';
    sheetOverlay.innerHTML=''
      +'<div class="ae-sheet" role="dialog" aria-modal="true" aria-label="Acciones de imagen">'
      +'<div class="ae-sheet-handle"></div>'
      +'<div class="ae-sheet-product"><img class="ae-sheet-thumb" alt=""><div class="ae-sheet-product-copy"><div class="ae-sheet-brand">AmarangoElectro</div><div class="ae-sheet-name"></div></div></div>'
      +'<div class="ae-sheet-menu">'
      +filaSheet('copy','Copiar imagen','Copia la imagen al portapapeles','copy')
      +filaSheet('download','Descargar imagen','Guarda la imagen en tu dispositivo','download')
      +filaSheet('share','Compartir imagen','Compartila por WhatsApp, Instagram y más','share')
      +filaSheet('external','Abrir imagen','Abrila en una pestaña aparte','open')
      +'</div>'
      +'<button class="ae-sheet-close" type="button">Cerrar</button>'
      +'</div>';
    document.body.appendChild(sheetOverlay);
    sheetThumb=sheetOverlay.querySelector('.ae-sheet-thumb');sheetName=sheetOverlay.querySelector('.ae-sheet-name');
    sheetOverlay.querySelector('.ae-sheet-close').addEventListener('click',cerrarSheet);
    sheetOverlay.addEventListener('click',function(ev){if(ev.target===sheetOverlay)cerrarSheet();});
    sheetOverlay.querySelector('[data-ae-sheet="copy"]').addEventListener('click',copiarImagenSheet);
    sheetOverlay.querySelector('[data-ae-sheet="download"]').addEventListener('click',descargarImagenSheet);
    sheetOverlay.querySelector('[data-ae-sheet="share"]').addEventListener('click',compartirImagenSheet);
    sheetOverlay.querySelector('[data-ae-sheet="open"]').addEventListener('click',abrirImagenSheet);
  }
  function filaSheet(icono,titulo,sub,accion){
    return '<button type="button" class="ae-sheet-row" data-ae-sheet="'+accion+'"><span class="ae-sheet-icon">'+ICON[icono]+'</span><span class="ae-sheet-row-main"><span class="ae-sheet-row-title">'+titulo+'</span><span class="ae-sheet-row-sub">'+sub+'</span></span><span class="ae-sheet-chevron">›</span></button>';
  }
  function productoPorId(id){
    try{if(id!=null&&typeof window.buscarProd==='function')return window.buscarProd(id);}catch(e){}
    return null;
  }
  function idDesdeImagen(img){
    var card=img&&img.closest?img.closest('[id^="card-"]'):null;
    if(card)return card.id.slice(5);
    if(img&&img.closest&&img.closest('#modal-cuotas-body')&&window._tiendaDetalleId!=null)return String(window._tiendaDetalleId);
    return '';
  }
  function abrirSheetImagen(img){
    crearSheet();if(!sheetOverlay||!img)return;
    var id=idDesdeImagen(img);var p=productoPorId(id);
    var src=img.currentSrc||img.src||'';
    sheetCtx={id:id,producto:p,src:src,nombre:(p&&p.nombre)||img.alt||'Imagen del producto'};
    sheetThumb.src=src;sheetName.textContent=sheetCtx.nombre;
    requestAnimationFrame(function(){sheetOverlay.classList.add('is-open');});
    vibrar(12);
  }
  function cerrarSheet(){if(sheetOverlay)sheetOverlay.classList.remove('is-open');}

  function obtenerBlobImagen(ctx){
    if(ctx&&ctx.producto&&typeof window.tiendaBlobParaCompartir==='function'){
      try{return Promise.resolve(window.tiendaBlobParaCompartir(ctx.producto));}catch(e){}
    }
    return fetch(ctx.src).then(function(r){if(!r.ok)throw new Error('No se pudo leer la imagen');return r.blob();});
  }
  function copiarImagenSheet(){
    var ctx=sheetCtx;if(!ctx)return;
    vibrar(8);
    obtenerBlobImagen(ctx).then(function(blob){
      if(!navigator.clipboard||!navigator.clipboard.write||!window.ClipboardItem)throw new Error('clipboard-no-image');
      var tipo=blob.type||'image/png';var item={};item[tipo]=blob;
      return navigator.clipboard.write([new ClipboardItem(item)]);
    }).then(function(){cerrarSheet();toast('✅ Imagen copiada');})
      .catch(function(){cerrarSheet();mostrarAlerta('En este navegador no se puede copiar una imagen directamente. Usá “Descargar imagen” o “Compartir imagen”.');});
  }
  function descargarImagenSheet(){
    var ctx=sheetCtx;if(!ctx)return;vibrar(8);cerrarSheet();
    if(ctx.id!==''&&typeof window.tiendaDescargarImagenProducto==='function'){
      window.tiendaDescargarImagenProducto(ctx.id);return;
    }
    var a=document.createElement('a');a.href=ctx.src;a.download='amarango-producto.jpg';document.body.appendChild(a);a.click();a.remove();
  }
  function compartirImagenSheet(){
    var ctx=sheetCtx;if(!ctx)return;vibrar(8);
    obtenerBlobImagen(ctx).then(function(blob){
      if(navigator.share&&window.File){
        var ext=(blob.type||'').indexOf('png')>=0?'.png':'.jpg';
        var f=new File([blob],'amarango-producto'+ext,{type:blob.type||'image/jpeg'});
        if(!navigator.canShare||navigator.canShare({files:[f]}))return navigator.share({files:[f],title:ctx.nombre});
      }
      if(ctx.id!==''&&typeof window.compartirProducto==='function'){window.compartirProducto(ctx.id);return;}
      throw new Error('share-no');
    }).then(function(){cerrarSheet();}).catch(function(e){
      if(e&&e.name==='AbortError')return;
      cerrarSheet();
      if(ctx.id!==''&&typeof window.compartirProducto==='function')window.compartirProducto(ctx.id);
      else mostrarAlerta('No pude abrir el menú para compartir esta imagen.');
    });
  }
  function abrirImagenSheet(){
    var ctx=sheetCtx;if(!ctx)return;vibrar(8);cerrarSheet();
    try{window.open(ctx.src,'_blank','noopener,noreferrer');}catch(e){location.href=ctx.src;}
  }

  document.addEventListener('contextmenu',function(ev){
    var img=ev.target&&ev.target.closest?ev.target.closest('#tienda-grid img, #modal-cuotas-body img'):null;
    if(!img)return;
    ev.preventDefault();ev.stopPropagation();abrirSheetImagen(img);
  },true);

  /* ---------------- Copiar nombre / copiar todo ---------------- */
  function mensajeCompletoProducto(p){
    if(!p)return '';
    try{
      if(typeof window.armarCuotasLines==='function'&&typeof window.armarMensajeAmarango==='function'){
        return window.armarMensajeAmarango(p.nombre,p.venta,window.armarCuotasLines(p.venta,p),null);
      }
    }catch(e){}
    var out='📦 '+(p.nombre||'Producto');
    try{if(typeof window.fmt==='function')out+='\n💵 Contado: '+window.fmt(p.venta);}catch(e){out+='\n💵 Contado: $'+p.venta;}
    return out;
  }
  function marcarCopiado(btn){
    btn.classList.add('copied');
    setTimeout(function(){btn.classList.remove('copied');},900);
  }
  function inyectarCopiasDetalle(id){
    var body=document.getElementById('modal-cuotas-body');if(!body)return;
    if(body.querySelector('.ae-detail-title-row'))return;
    var p=productoPorId(id);if(!p)return;
    var hs=body.querySelectorAll('h3');var titulo=null;
    for(var i=0;i<hs.length;i++){
      if((hs[i].textContent||'').trim()===(p.nombre||'').trim()){titulo=hs[i];break;}
    }
    if(!titulo)return;
    var row=document.createElement('div');row.className='ae-detail-title-row';
    titulo.parentNode.insertBefore(row,titulo);row.appendChild(titulo);
    var acts=document.createElement('div');acts.className='ae-copy-actions';
    var bNombre=document.createElement('button');bNombre.type='button';bNombre.className='ae-copy-square';bNombre.setAttribute('aria-label','Copiar nombre del producto');bNombre.innerHTML=ICON.copy+'<span>Nombre</span>';
    var bTodo=document.createElement('button');bTodo.type='button';bTodo.className='ae-copy-square';bTodo.setAttribute('aria-label','Copiar texto completo del producto');bTodo.innerHTML=ICON.text+'<span>Todo</span>';
    bNombre.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();vibrar(7);copiarTexto(p.nombre||'').then(function(){marcarCopiado(bNombre);toast('📋 Nombre copiado');}).catch(function(){mostrarAlerta('No pude copiar el nombre.');});});
    bTodo.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();vibrar(7);copiarTexto(mensajeCompletoProducto(p)).then(function(){marcarCopiado(bTodo);toast('📋 Texto completo copiado');}).catch(function(){mostrarAlerta('No pude copiar el texto del producto.');});});
    acts.appendChild(bNombre);acts.appendChild(bTodo);row.appendChild(acts);
  }

  function envolverDetalle(){
    if(typeof window.tiendaVerDetalle!=='function')return false;
    if(window.tiendaVerDetalle.__aeProUx)return true;
    var anterior=window.tiendaVerDetalle;
    function tiendaVerDetallePro(id){
      var r=anterior.apply(this,arguments);
      setTimeout(function(){inyectarCopiasDetalle(id);},0);
      setTimeout(function(){inyectarCopiasDetalle(id);},80);
      return r;
    }
    tiendaVerDetallePro.__aeProUx=VERSION;tiendaVerDetallePro.__anterior=anterior;
    window.tiendaVerDetalle=tiendaVerDetallePro;
    return true;
  }

  /* Guarda el producto de la última acción para dar contexto a los diálogos. */
  document.addEventListener('pointerdown',function(ev){
    var card=ev.target&&ev.target.closest?ev.target.closest('[id^="card-"]'):null;
    if(card)window.__aeUltimoProductoAccion=card.id.slice(5);
  },true);

  /* Sensación táctil breve en controles de app. */
  document.addEventListener('click',function(ev){
    var el=ev.target&&ev.target.closest?ev.target.closest('.calc-btn,.ae-vis-switch,.nav-item,.cat-tile,summary,.ae-copy-square,.ae-sheet-row,.ae-pro-btn'):null;
    if(el)vibrar(5);
  },true);

  /* Reaplica copia si otro render reconstruyó el detalle. */
  function observarDetalle(){
    var body=document.getElementById('modal-cuotas-body');if(!body||body.__aeProObs)return;
    body.__aeProObs=true;
    new MutationObserver(function(){
      var modal=document.getElementById('modal-cuotas');
      if(modal&&modal.style.display!=='none'&&window._tiendaDetalleId!=null)setTimeout(function(){inyectarCopiasDetalle(window._tiendaDetalleId);},0);
    }).observe(body,{childList:true,subtree:false});
  }

  var intentos=0;
  function instalar(){
    crearAlerta();crearSheet();
    var a=envolverDetalle();observarDetalle();
    if(!a&&intentos++<80)setTimeout(instalar,150);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',instalar,{once:true});
  else instalar();
  setTimeout(instalar,250);
})();
