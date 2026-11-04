/* AmarangoElectro: galería aditiva. No modifica foto principal, precios, cuotas ni sincronización. */
(function(){
  'use strict';
  var TABLA='tienda_media_producto', BUCKET='tienda-fotos';
  var cache=new Map(), modal=null, visor=null, seleccion=null, ocupado=false, trabajos=Promise.resolve();
  var estilos='.ae-gal-overlay{position:fixed;inset:0;z-index:6700;display:flex;align-items:center;justify-content:center;padding:14px;background:rgba(4,13,32,.8);backdrop-filter:blur(4px)}'
  +'.ae-gal-panel{width:100%;max-width:460px;max-height:90dvh;overflow-y:auto;background:var(--wh);color:var(--txt);border-radius:17px;padding:17px;box-shadow:0 12px 50px #0005}'
  +'.ae-gal-panel h3{font-size:1rem;color:var(--az);margin:0 0 8px;font-weight:900}'
  +'.ae-gal-panel p{font-size:.74rem;color:var(--sub);line-height:1.4;margin:6px 0 12px}'
  +'.ae-gal-row{display:flex;gap:8px;align-items:center;margin:10px 0;flex-wrap:wrap}'
  +'.ae-gal-thumb{width:72px;height:72px;object-fit:contain;border:1px solid var(--bor);background:#fff;border-radius:9px}'
  +'.ae-gal-btn{cursor:pointer;border:1px solid var(--bor);background:var(--bg);color:var(--az);padding:9px 10px;border-radius:9px;font-size:.72rem;font-weight:800;font-family:inherit}'
  +'.ae-gal-btn:disabled{opacity:.45;cursor:not-allowed}'
  +'.ae-gal-btn-primary{background:var(--az);color:#fff;border-color:var(--az)}'
  +'.ae-gal-btn-remove{background:#fff0f0;color:#ae1717;border-color:#ffcccc}'
  +'.ae-gal-preview{display:flex;gap:7px;overflow-x:auto;margin:8px 0 12px;scrollbar-width:thin;padding:3px 0 8px}'
  +'.ae-gal-preview .ae-gal-btn{width:74px;min-width:74px;padding:4px}'
  +'.ae-gal-preview img{width:64px;height:62px;display:block;object-fit:contain;border-radius:6px;background:#fff}'
  +'.ae-gal-visor{position:fixed;inset:0;z-index:6900;background:rgba(3,10,25,.97);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:18px;color:#fff}'
  +'.ae-gal-visor img,.ae-gal-visor video{display:block;max-width:100%;max-height:73dvh;width:auto;height:auto;object-fit:contain;background:#000;border-radius:10px}'
  +'.ae-gal-visor .ae-gal-btn{color:#fff;background:#142f5e;border-color:#6b82a4}'
  +'body.oscuro .ae-gal-panel{background:#122442;color:#e8eef7}'
  +'body.oscuro .ae-gal-btn{background:#1a3456;color:#e8eef7;border-color:#456081}'
  +'body.oscuro .ae-gal-btn-primary{background:#1d5cbb;color:#fff}'
  +'body.oscuro .ae-gal-btn-remove{background:#4a1c22;color:#ffb0b0}';
  estilos+=
   '.ae-gal-selected{display:flex;gap:7px;overflow:auto;padding:7px 0;scrollbar-width:thin}.ae-gal-select-item{position:relative;flex:0 0 86px;display:flex;flex-direction:column;gap:4px;align-items:center;padding:5px;background:var(--bg);border:1px solid var(--bor);border-radius:10px;font-size:.66rem;font-weight:800;min-width:0}.ae-gal-select-item img{width:76px;height:74px;object-fit:contain;background:#fff;border-radius:7px}.ae-gal-selected-confirm{width:100%;background:#ff7a00!important;color:#fff!important;border-color:#ff7a00!important;padding:12px;font-size:.83rem}.ae-gal-selected-hint{font-size:.72rem;font-weight:750;color:var(--sub)}' +
   '.ae-media-upload-state{position:fixed;bottom:calc(20px + env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);z-index:6998;width:min(92vw,440px);display:flex;align-items:center;gap:9px;padding:12px 14px;border:1px solid #ffb16f;border-radius:14px;background:#172b4b;color:#fff;box-shadow:0 9px 28px #0006;font-size:.73rem;font-weight:800;line-height:1.35}.ae-media-upload-state:before{content:"↻";color:#ffa450;font-size:1rem}.ae-media-upload-state.is-finished:before{content:"✅"}.ae-media-upload-state.is-error:before{content:"⚠️"}.ae-media-upload-state.is-error{border-color:#e85540}' +
   'body.oscuro .ae-gal-select-item{background:#192f50;border-color:#51708d;color:#eaf1ff}body.oscuro .ae-gal-selected-hint{color:#c3d3e9}';
  var css=document.createElement('style');css.id='ae-galeria-styles';css.textContent=estilos;document.head.appendChild(css);
  function nodo(tag,clase,texto){var n=document.createElement(tag);if(clase)n.className=clase;if(texto!==undefined)n.textContent=texto;return n;}
  function boton(texto,fn,clase){var n=nodo('button','ae-gal-btn '+(clase||''),texto);n.type='button';n.addEventListener('click',fn);return n;}
  function aviso(msg){if(typeof mostrarToast==='function')mostrarToast(msg);else alert(msg);}
  function producto(id){return typeof buscarProd==='function'?buscarProd(id):null;}
  function clave(p){
    if(p.esCelu||String(p.id).indexOf('celu_')===0)
      return 'celu:'+String(p.mayorista||'').trim().toLowerCase()+'|'+String(p.nombre||'').trim().toLowerCase();
    if(typeof tiendaEsAutomatico==='function' && tiendaEsAutomatico(p))
      return 'proveedor:'+String(p.proveedorClave||p.proveedor||'')+'|'+String(p.proveedorId||p.id);
    return 'manual:'+String(p.id);
  }
  function limpio(d){return {imagenes:Array.isArray(d&&d.imagenes)?d.imagenes.filter(function(v){return typeof v==='string'&&/^https:\/\//.test(v);}).slice(0,3):[],video:typeof(d&&d.video_url)==='string'&&/^https:\/\//.test(d.video_url)?d.video_url:''};}
  function esperarNube(){return new Promise(function(resolve,reject){var n=0;(function check(){if(typeof sbCalc!=='undefined'&&sbCalc&&typeof sbCalc.from==='function'){resolve(sbCalc);return;}if(++n>24){reject(new Error('No hay conexión a la nube'));return;}setTimeout(check,170);})();});}
  function leer(p,forzar){
    var k=clave(p);if(!forzar&&cache.has(k))return Promise.resolve(cache.get(k));
    return esperarNube().then(function(sb){return sb.from(TABLA).select('imagenes,video_url').eq('clave',k).maybeSingle();})
      .then(function(r){if(r.error)throw r.error;var data=limpio(r.data);cache.set(k,data);return data;});
  }
  function piezas(p,datos){
    var lista=[];if(p.foto)lista.push({tipo:'imagen',url:p.foto});
    // No mostrar más de 3 imágenes en total aun si cambió la portada después de cargarlas.
    datos.imagenes.slice(0,Math.max(0,3-(p.foto?1:0))).forEach(function(url){lista.push({tipo:'imagen',url:url});});
    if(datos.video)lista.push({tipo:'video',url:datos.video});
    return lista;
  }

  // Compartir el elemento elegido, sin modificar el botón comercial "Compartir producto".
  // Si el navegador no permite enviar el archivo, se ofrece su enlace público.
  function enlaceMedio(item){
    if(!item||!item.url)return '';
    try{
      var url=new URL(item.url,window.location.href);
      return (url.protocol==='https:'||url.protocol==='http:')?url.href:'';
    }catch(e){return '';}
  }
  function nombreMedio(p,item,mime){
    var base=String((p&&p.nombre)||'AmarangoElectro').trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,54)||'AmarangoElectro';
    var ext=item.tipo==='video'?(mime==='video/webm'?'webm':'mp4'):
      (mime==='image/png'?'png':mime==='image/webp'?'webp':'jpg');
    return base+'.'+ext;
  }
  function copiarMedio(url){
    if(navigator.clipboard&&navigator.clipboard.writeText){
      return navigator.clipboard.writeText(url).then(function(){
        aviso('🔗 Enlace del archivo copiado');
      }).catch(function(){
        window.prompt('Copiá el enlace de la foto o video:',url);
      });
    }
    window.prompt('Copiá el enlace de la foto o video:',url);
    return Promise.resolve();
  }
  function compartirMedio(p,item,btn){
    var url=enlaceMedio(item);
    if(!url){aviso('⚠️ Esta foto o video no tiene un enlace para compartir.');return;}
    var video=item.tipo==='video',nombre=String((p&&p.nombre)||'Producto AmarangoElectro');
    var original=btn?btn.textContent:'';
    if(btn){if(btn.disabled)return;btn.disabled=true;btn.textContent='Preparando…';}
    var restaurar=function(){if(btn&&btn.isConnected){btn.disabled=false;if(btn.textContent==='Preparando…')btn.textContent=original;}};
    var compartirEnlace=function(){
      if(navigator.share){
        return navigator.share({title:nombre,text:video?'🎥 Video del producto':'🖼️ Foto del producto',url:url})
          .catch(function(err){
            if(err&&err.name==='AbortError')return;
            return copiarMedio(url);
          });
      }
      return copiarMedio(url);
    };
    // Los archivos grandes no se descargan automáticamente al navegar la tienda.
    // Preparar medios únicamente al tocar Compartir mantiene rápida la apertura.
    var preparar=function(){
      if(!navigator.share||!navigator.canShare||typeof File!=='function')return Promise.resolve(null);
      var controlador=typeof AbortController==='function'?new AbortController():null;
      var espera=setTimeout(function(){if(controlador)controlador.abort();},6500);
      return fetch(url,{mode:'cors',signal:controlador?controlador.signal:undefined})
        .then(function(res){if(!res.ok)throw new Error('No se puede descargar el archivo');return res.blob();})
        .then(function(blob){
          if(!blob||!blob.size||blob.size>(video?21:12)*1024*1024)return null;
          var mime=blob.type||(video?'video/mp4':'image/jpeg');
          if(video?!/^video\/(mp4|webm)$/.test(mime):!/^image\/(jpeg|png|webp)$/.test(mime))return null;
          var file=new File([blob],nombreMedio(p,item,mime),{type:mime});
          return navigator.canShare({files:[file]})?file:null;
        }).catch(function(){return null;})
        .finally(function(){clearTimeout(espera);});
    };
    preparar().then(function(file){
      if(file){
        return navigator.share({files:[file],title:nombre}).catch(function(err){
          if(err&&err.name==='AbortError')return;
          return compartirEnlace();
        });
      }
      return compartirEnlace();
    }).catch(function(){return copiarMedio(url);})
      .finally(restaurar);
  }

  function cerrarVisor(){if(visor){visor.remove();visor=null;}}
  function abrirVisor(p,datos,indice){
    cerrarVisor();var lista=piezas(p,datos);if(!lista.length)return;
    indice=Math.max(0,Math.min(indice,lista.length-1));
    visor=nodo('div','ae-gal-visor');visor.setAttribute('role','dialog');visor.setAttribute('aria-modal','true');
    var cerrar=boton('✕ Cerrar',cerrarVisor);cerrar.style.cssText='position:absolute;right:15px;top:13px;';
    var nombre=nodo('div','',p.nombre||'Producto');nombre.style.cssText='font-size:.82rem;font-weight:800;text-align:center;padding:0 38px';
    var centro=nodo('div');centro.style.cssText='width:100%;display:flex;align-items:center;justify-content:center;min-height:170px;flex:1;overflow:hidden';
    var controles=nodo('div','ae-gal-row');controles.style.justifyContent='center';
    var previo=boton('‹ Anterior',function(){mostrar(indice-1);});
    var numero=nodo('span');numero.style.cssText='font-size:.75rem;padding:8px;font-weight:800';
    var siguiente=boton('Siguiente ›',function(){mostrar(indice+1);});
    var compartir=boton('📤 Compartir foto',function(){compartirMedio(p,lista[indice],compartir);},'ae-gal-share-visor');
    controles.append(previo,numero,siguiente,compartir);visor.append(cerrar,nombre,centro,controles);document.body.appendChild(visor);
    function mostrar(i){
      if(i<0||i>=lista.length)return;indice=i;centro.replaceChildren();
      var item=lista[i],obj;
      if(item.tipo==='video'){
        obj=nodo('video');obj.src=item.url;obj.controls=true;obj.playsInline=true;obj.preload='none';if(p.foto)obj.poster=p.foto;
      }else{
        obj=nodo('img');obj.src=item.url;obj.alt=p.nombre||'Foto del producto';
      }
      centro.appendChild(obj);numero.textContent=(i+1)+' / '+lista.length;
      previo.disabled=i===0;siguiente.disabled=i===lista.length-1;
      compartir.textContent=item.tipo==='video'?'📤 Compartir video':'📤 Compartir foto';
    }
    mostrar(indice);
  }
  function mostrarEnDetalle(p){
    if(!p)return;
    var id=String(p.id),raiz=document.getElementById('modal-cuotas-body');
    if(!raiz)return;
    // La foto principal también se puede compartir si es la única del producto.
    var fotoDetalle=raiz.querySelector('img[style*="max-height:340px"]');
    if(p.foto&&fotoDetalle&&!raiz.querySelector('.ae-gal-share-detalle')){
      var fotoBtn=boton('📤 Compartir esta foto',function(){compartirMedio(p,{tipo:'imagen',url:p.foto},fotoBtn);},'ae-gal-share-detalle');
      fotoBtn.style.cssText='display:block;width:max-content;max-width:100%;margin:-4px auto 12px;background:var(--az);color:#fff;border-color:var(--az);';
      fotoDetalle.parentElement.insertAdjacentElement('afterend',fotoBtn);
    }
    leer(p).then(function(datos){
      if(String(window._tiendaDetalleId)!==id||!raiz.isConnected)return;
      var viejo=raiz.querySelector('#ae-galeria-detalle');if(viejo)viejo.remove();
      var lista=piezas(p,datos);
      // Sin contenido adicional, el visor de la foto original sigue intacto.
      if(!datos.imagenes.length&&!datos.video)return;
      var caja=nodo('div');caja.id='ae-galeria-detalle';
      var titulo=nodo('div','',datos.video?'🎥 Video del producto':'🖼️ Fotos del producto');
      titulo.style.cssText='font-size:.72rem;color:var(--az);font-weight:900;margin:7px 0';
      var fila=nodo('div','ae-gal-preview');
      lista.forEach(function(item,i){
        var b=boton(item.tipo==='video'?'▶ Video':'Foto '+(i+1),function(){abrirVisor(p,datos,i);});
        if(item.tipo==='imagen'){b.textContent='';var img=nodo('img');img.src=item.url;img.loading='lazy';img.alt='Foto '+(i+1);b.append(img);}
        else b.style.cssText='font-size:.76rem;background:var(--az);color:#fff;';
        fila.appendChild(b);
      });
      caja.append(titulo,fila);
      var heading=raiz.querySelector('h3.ae-detail-title');
      if(heading)raiz.insertBefore(caja,heading);else raiz.prepend(caja);
    }).catch(function(){/* No bloquear productos si la galería no está disponible. */});
  }
  function limpiarSeleccion(){
    if(seleccion&&seleccion.urls)seleccion.urls.forEach(function(u){URL.revokeObjectURL(u);});
    seleccion=null;
  }
  function cerrarAdmin(){if(modal){modal.remove();modal=null;}limpiarSeleccion();}
  function parrafo(txt){return nodo('p','',txt);}
  function lineaItem(p,datos,url,idx,esVideo){
    var fila=nodo('div','ae-gal-row');
    if(esVideo){var play=boton('▶ Ver video',function(){abrirVisor(p,datos,piezas(p,datos).length-1);});fila.appendChild(play);}
    else{var img=nodo('img','ae-gal-thumb');img.src=url;img.loading='lazy';img.alt='Foto adicional';fila.appendChild(img);}
    var estado=nodo('span','',esVideo?'Video agregado':'Foto adicional '+(idx+1));
    estado.style.cssText='flex:1;font-size:.72rem;font-weight:800;min-width:110px';fila.appendChild(estado);
    var compartirFila=boton('📤 Compartir',function(){compartirMedio(p,{tipo:esVideo?'video':'imagen',url:url},compartirFila);});
    fila.appendChild(compartirFila);
    var borrar=boton('Quitar',function(){
      if(!confirm('¿Quitar este contenido adicional de la galería? La foto principal no se modifica.'))return;
      var nuevo={imagenes:datos.imagenes.slice(),video:datos.video};
      if(esVideo)nuevo.video='';else nuevo.imagenes.splice(idx,1);
      guardar(p,nuevo);
    },'ae-gal-btn-remove');fila.appendChild(borrar);
    return fila;
  }
  function renderAdmin(p,datos,sesion){
    if(!modal)return;
    var panel=modal.querySelector('.ae-gal-panel');panel.replaceChildren();
    var barra=nodo('div','ae-gal-row');barra.style.justifyContent='space-between';
    barra.append(nodo('h3','','📷 Fotos o video del producto'),boton('✕',cerrarAdmin));
    panel.append(barra,parrafo(p.nombre||'Producto'));
    var portada=nodo('div','ae-gal-row');portada.appendChild(nodo('strong','','Foto principal — se conserva'));
    if(p.foto){var imagen=nodo('img','ae-gal-thumb');imagen.src=p.foto;imagen.alt='Foto principal';portada.appendChild(imagen);
      var compartirPortada=boton('📤 Compartir',function(){compartirMedio(p,{tipo:'imagen',url:p.foto},compartirPortada);});portada.appendChild(compartirPortada);}
    else portada.appendChild(nodo('small','','Sin foto de portada'));
    panel.appendChild(portada);
    var maxExtra=Math.max(0,3-(p.foto?1:0));
    panel.appendChild(parrafo('Máximo 3 imágenes en total (incluida la principal) O un video adicional a la portada. Nada reemplaza tu foto principal.'));
    datos.imagenes.forEach(function(url,i){panel.appendChild(lineaItem(p,datos,url,i,false));});
    if(datos.video)panel.appendChild(lineaItem(p,datos,datos.video,0,true));
    if(!sesion){
      panel.append(parrafo('Para agregar contenido, conectá primero el administrador seguro de fotos.'));
      panel.appendChild(boton('🔐 Conectar administrador de fotos',function(){
        cerrarAdmin();if(typeof tiendaAuthFotosAbrir==='function')tiendaAuthFotosAbrir();
      },'ae-gal-btn-primary'));
      return;
    }
    var opciones=nodo('div','ae-gal-row');
    var fotos=boton('➕ Elegir 1, 2 o 3 fotos',function(){seleccionarArchivo(p,datos,'imagen',sesion);},'ae-gal-btn-primary');
    fotos.disabled=!!datos.video||datos.imagenes.length>=maxExtra;
    var video=boton('🎥 Elegir video',function(){seleccionarArchivo(p,datos,'video',sesion);});
    video.disabled=!!datos.video||datos.imagenes.length>0;
    opciones.append(fotos,video);panel.appendChild(opciones);
    if(seleccion && seleccion.files && seleccion.files.length){
      var count=seleccion.files.length;
      panel.appendChild(nodo('p','ae-gal-selected-hint',seleccion.tipo==='imagen'?
        count+' foto(s) seleccionada(s). Podés elegirlas juntas o agregar más hasta el límite.':
        'Video seleccionado: '+seleccion.files[0].name));
      var preview=nodo('div','ae-gal-selected');
      seleccion.files.forEach(function(file,i){
        var item=nodo('div','ae-gal-select-item');
        if(seleccion.tipo==='imagen'){
          var img=nodo('img');var url=URL.createObjectURL(file);seleccion.urls.push(url);img.src=url;img.alt='Imagen elegida '+(i+1);item.appendChild(img);
        }
        item.appendChild(nodo('span','',seleccion.tipo==='imagen'?'Foto '+(i+1):'🎥 Video'));
        var quitar=boton('Quitar',function(){seleccion.files.splice(i,1);limpiarURLsSeleccion();if(!seleccion.files.length)seleccion=null;renderAdmin(p,datos,sesion);});
        item.appendChild(quitar);preview.appendChild(item);
      });
      panel.appendChild(preview);
      panel.appendChild(boton('✅ Confirmar y subir · cerrar ventana',function(){
        var archivo=seleccion.files.slice(),tipo=seleccion.tipo;
        cerrarAdmin();
        subirLote(p,archivo,tipo).catch(function(e){aviso('⚠️ No se completó la carga: '+(e.message||e));});
      },'ae-gal-btn-primary ae-gal-selected-confirm'));
      panel.appendChild(nodo('p','ae-gal-selected-hint','La ventana se cierra al confirmar y la subida continúa mientras la tienda esté abierta.'));
    }
    if(datos.video)panel.append(parrafo('Para cargar fotos adicionales, primero quitá el video. La portada queda intacta.'));
    else if(datos.imagenes.length)panel.append(parrafo('Para cargar un video, primero quitá las fotos adicionales. La portada queda intacta.'));
    if(datos.imagenes.length>=maxExtra&&!datos.video)panel.append(parrafo('✅ Límite de 3 fotos alcanzado.'));
    panel.append(parrafo('Imágenes JPG, PNG o WebP. Video MP4 o WebM, hasta 20 MB. El video se reproduce solamente cuando alguien lo toca.'));
  }
  function abrir(id){
    if(typeof tiendaEsAdmin==='undefined'||!tiendaEsAdmin||typeof vistaPreviaCliente!=='undefined'&&vistaPreviaCliente){aviso('🔒 Solo administración puede cambiar la galería.');return;}
    var p=producto(id);if(!p){aviso('No encontré el producto');return;}
    if(modal)modal.remove();
    modal=nodo('div','ae-gal-overlay');modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');
    var panel=nodo('div','ae-gal-panel');panel.append(nodo('h3','','Cargando galería…'),parrafo('Buscando fotos y video del producto.'));
    modal.appendChild(panel);modal.addEventListener('click',function(e){if(e.target===modal)cerrarAdmin();});
    document.body.appendChild(modal);
    Promise.all([leer(p,true),typeof tiendaAuthFotosSesion==='function'?tiendaAuthFotosSesion():Promise.resolve(null)])
      .then(function(values){if(modal)renderAdmin(p,values[0],values[1]);})
      .catch(function(e){if(modal){panel.replaceChildren(nodo('h3','','⚠️ No se pudo abrir la galería'),parrafo(e.message||'Error de conexión'),boton('Cerrar',cerrarAdmin));}});
  }
  function limpiarURLsSeleccion(){
    if(seleccion&&seleccion.urls){
      seleccion.urls.forEach(function(url){URL.revokeObjectURL(url);});
      seleccion.urls=[];
    }
  }
  function seleccionarArchivo(p,datos,tipo,sesion){
    if(ocupado){aviso('⏳ Hay una carga multimedia en progreso.');return;}
    var input=nodo('input');input.type='file';input.accept=tipo==='imagen'?'image/jpeg,image/png,image/webp':'video/mp4,video/webm';
    input.multiple=tipo==='imagen';
    input.style.display='none';document.body.appendChild(input);
    input.addEventListener('change',function(){
      var files=Array.from(input.files||[]);input.remove();if(!files.length)return;
      var limit=Math.max(0,3-(p.foto?1:0)-datos.imagenes.length);
      if(tipo==='imagen' && (datos.video || files.some(function(f){return !validarArchivo(f,'imagen');}))){
        aviso('Elegí JPG, PNG o WebP, de hasta 18 MB por imagen. No mezcles con video.');return;
      }
      if(tipo==='video' && (datos.video||datos.imagenes.length||files.length!==1||!validarArchivo(files[0],'video'))){
        aviso('Elegí un video MP4 o WebM de hasta 20 MB, sin fotos adicionales.');return;
      }
      var prev=seleccion&&seleccion.tipo===tipo?seleccion.files:[];
      if(tipo==='imagen' && prev.length+files.length>limit){
        aviso('Quedan '+Math.max(0,limit-prev.length)+' fotos disponibles (máximo 3 en total).');return;
      }
      limpiarURLsSeleccion();
      seleccion={tipo:tipo,files:tipo==='imagen'?prev.concat(files):files.slice(0,1),urls:[]};
      renderAdmin(p,datos,sesion);
    },{once:true});
    input.click();
  }
  function validarArchivo(file,tipo){
    return !!(file&&file.size>0&&(
      tipo==='imagen' ? /^(image\/jpeg|image\/png|image\/webp)$/.test(file.type)&&file.size<=18*1024*1024 :
      /^(video\/mp4|video\/webm)$/.test(file.type)&&file.size<=20*1024*1024));
  }
  function comprimir(file){return new Promise(function(resolve,reject){
    var url=URL.createObjectURL(file),img=new Image();
    img.onload=function(){try{
      var factor=Math.min(1,1400/Math.max(img.width,img.height));
      var c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*factor));c.height=Math.max(1,Math.round(img.height*factor));
      var ctx=c.getContext('2d');ctx.drawImage(img,0,0,c.width,c.height);
      c.toBlob(function(blob){URL.revokeObjectURL(url);if(blob&&blob.size)resolve(blob);else reject(new Error('No se pudo convertir la imagen'));},'image/jpeg',.84);
    }catch(e){URL.revokeObjectURL(url);reject(e);}};
    img.onerror=function(){URL.revokeObjectURL(url);reject(new Error('Formato de imagen no compatible'));};
    img.src=url;
  });}
  // Cargas secuenciales: una sola escritura de la galería para cada lote.
  // La vista se puede cerrar y seguir usando la app; no es subida con app cerrada.
  function encolar(proceso){
    var ticket=trabajos.catch(function(){}).then(proceso);
    trabajos=ticket.catch(function(){});
    return ticket;
  }
  function estadoUpload(texto,estado){
    var box=document.getElementById('ae-media-upload-state');
    if(!box){box=nodo('div','ae-media-upload-state');box.id='ae-media-upload-state';box.setAttribute('role','status');box.setAttribute('aria-live','polite');document.body.appendChild(box);}
    box.className='ae-media-upload-state'+(estado==='ok'?' is-finished':estado==='error'?' is-error':'');
    box.textContent=texto;
    if(estado==='ok'||estado==='error'){
      var actual=box;setTimeout(function(){if(actual.isConnected&&actual.textContent===texto)actual.remove();},estado==='ok'?4000:9000);
    }
  }
  function subirObjeto(p,file,tipo){
    if(!validarArchivo(file,tipo))return Promise.reject(new Error('Archivo incompatible o demasiado grande'));
    return Promise.resolve(tipo==='imagen'?comprimir(file):file).then(function(blob){
      var ext=tipo==='imagen'?'jpg':file.type==='video/webm'?'webm':'mp4';
      var token=typeof tiendaTokenFoto==='function'?tiendaTokenFoto(clave(p)):String(p.id);
      var ruta='manual/galeria/'+token+'/'+Date.now()+'_'+Math.random().toString(36).slice(2,10)+'.'+ext;
      return sbFotos.storage.from(BUCKET).upload(ruta,blob,{contentType:tipo==='imagen'?'image/jpeg':file.type,upsert:false,cacheControl:'31536000'})
        .then(function(r){if(r.error)throw r.error;return sbFotos.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl;});
    });
  }
  async function loteInterno(p,files,tipo,session,offset){
    var datos=await leer(p,true);
    var maxExtra=Math.max(0,3-(p.foto?1:0));
    if(tipo==='imagen' && (datos.video || files.length+datos.imagenes.length>maxExtra))
      throw new Error('No hay espacio: máximo 3 imágenes incluyendo portada.');
    if(tipo==='video' && (datos.video||datos.imagenes.length||files.length!==1))
      throw new Error('El video no se puede mezclar con fotos adicionales.');
    var urls=[];
    for(var i=0;i<files.length;i++){
      estadoUpload('⏳ Subiendo '+(offset+i+1)+' de '+(offset+files.length)+' archivos…');
      urls.push(await subirObjeto(p,files[i],tipo));
    }
    // Una escritura para las fotos elegidas juntas, evitando reemplazar otra carga.
    var actual=await leer(p,true);
    if(tipo==='imagen' && (actual.video||actual.imagenes.length+urls.length>maxExtra))
      throw new Error('La galería cambió mientras subías los archivos. Volvé a abrirla.');
    if(tipo==='video'&&(actual.video||actual.imagenes.length))
      throw new Error('El producto ahora tiene otro contenido multimedia.');
    var nuevos={imagenes:tipo==='imagen'?actual.imagenes.concat(urls):actual.imagenes,
      video:tipo==='video'?urls[0]:actual.video};
    var res=await sbFotos.from(TABLA).upsert({
      clave:clave(p),imagenes:nuevos.imagenes,video_url:nuevos.video||null,
      editado_por:session.user.id,actualizado:new Date().toISOString()
    },{onConflict:'clave'}).select('imagenes,video_url').single();
    if(res.error)throw res.error;
    var confirmado=limpio(res.data);
    if(tipo==='imagen' && confirmado.imagenes.length<nuevos.imagenes.length)
      throw new Error('La nube no confirmó todas las imágenes');
    if(tipo==='video' && confirmado.video!==urls[0])
      throw new Error('La nube no confirmó el video');
    cache.set(clave(p),confirmado);
    refrescarTarjetas(p,confirmado);
    return confirmado;
  }
  function subirLote(p,files,tipo){
    return encolar(async function(){
      ocupado=true;
      try{
        var session=await tiendaAuthFotosSesion();
        if(!session||!session.user)throw new Error('Iniciá sesión segura de fotos en Administración.');
        if(!sbFotos)throw new Error('No hay conexión a fotos.');
        await loteInterno(p,files,tipo,session,0);
        estadoUpload('✅ '+(tipo==='video'?'Video agregado':'Fotos agregadas')+' y guardado en la nube','ok');
        aviso('✅ Galería actualizada: '+files.length+' archivo(s)');
        return true;
      }catch(e){
        estadoUpload('⚠️ No se pudo completar la carga de '+(p.nombre||'producto'),'error');
        throw e;
      }finally{ocupado=false;}
    });
  }
  // Al crear: primera foto = portada, restantes = galería. Si ya existe portada,
  // nunca se reemplaza: las seleccionadas se agregan sólo si queda espacio.
  function cargarCreacion(p,seleccionNueva){
    var fotos=Array.isArray(seleccionNueva&&seleccionNueva.fotos)?seleccionNueva.fotos.slice(0,3):[];
    var video=seleccionNueva&&seleccionNueva.video;
    if(!fotos.length&&!video)return Promise.resolve(false);
    return encolar(async function(){
      ocupado=true;
      try{
        var session=await tiendaAuthFotosSesion();
        if(!session||!session.user)throw new Error('Conectá la sesión segura de fotos.');
        if(!sbFotos)throw new Error('Sin conexión para cargar imágenes.');
        var extras=fotos.slice(),total=fotos.length+(video?1:0);
        if(extras.length&&!p.foto){
          estadoUpload('⏳ Subiendo portada · 1 de '+total+'…');
          var url=await subirObjeto(p,extras.shift(),'imagen');
          var fotoAnterior=p.foto||'',marcaAnterior=p.estadoManualActualizado,
              fotoFechaAnterior=p.fotoActualizadaManual;
          p.foto=url;p.fotoActualizadaManual=Date.now();p.estadoManualActualizado=p.fotoActualizadaManual;
          try{
            var guardado=await tiendaGuardarLocal();
            if(guardado&&guardado.error)throw guardado.error;
            await tiendaVerificarManualesNube([p.id],url);
          }catch(e){
            p.foto=fotoAnterior;p.estadoManualActualizado=marcaAnterior;p.fotoActualizadaManual=fotoFechaAnterior;
            // Si falló la confirmación de portada, no dejar una imagen fantasma
            // almacenada solamente en el navegador.
            try{localStorage.setItem('ae_tienda_catalogo',JSON.stringify(tiendaProductos));}catch(ignore){}
            throw e;
          }
        }
        if(extras.length){
          var actual=await leer(p,true),restante=Math.max(0,3-(p.foto?1:0)-actual.imagenes.length);
          if(extras.length>restante)throw new Error('El producto existente ya tiene fotos. Solo quedan '+restante+' espacios de galería.');
          await loteInterno(p,extras,'imagen',session,fotos.length-extras.length);
        }
        if(video)await loteInterno(p,[video],'video',session,0);
        estadoUpload('✅ Multimedia cargada para '+(p.nombre||'el producto'),'ok');
        aviso('✅ Fotos/video confirmados en la nube');
        if(typeof tiendaRender==='function')tiendaRender();
        return true;
      }catch(e){
        estadoUpload('⚠️ Carga multimedia incompleta: '+(p.nombre||'producto'),'error');
        aviso('⚠️ El producto quedó creado, pero alguna foto/video no se confirmó: '+(e.message||e));
        throw e;
      }finally{ocupado=false;}
    });
  }
  function guardar(p,datos){
    if(ocupado)return Promise.resolve();
    ocupado=true;
    return tiendaAuthFotosSesion().then(function(session){
      if(!session||!session.user)throw new Error('Conectá el administrador seguro de fotos.');
      if(!sbFotos||typeof sbFotos.from!=='function')throw new Error('Sin conexión segura.');
      return sbFotos.from(TABLA).upsert({
        clave:clave(p),imagenes:datos.imagenes,video_url:datos.video||null,
        editado_por:session.user.id,actualizado:new Date().toISOString()
      },{onConflict:'clave'}).select('imagenes,video_url').single();
    }).then(function(r){
      if(r.error)throw r.error;
      var confirmado=limpio(r.data);cache.set(clave(p),confirmado);refrescarTarjetas(p,confirmado);
      aviso('✅ Galería guardada para todos');
      return tiendaAuthFotosSesion().then(function(sesion){if(modal)renderAdmin(p,confirmado,sesion);});
    }).catch(function(e){alert('⚠️ No se pudo guardar la galería: '+(e.message||e));})
      .finally(function(){ocupado=false;});
  }
  function subir(p,datos,tipo,file){
    if(ocupado)return;
    var maxExtra=Math.max(0,3-(p.foto?1:0));
    if(tipo==='imagen'&&(datos.video||datos.imagenes.length>=maxExtra)){aviso('Máximo 3 fotos o un video.');return;}
    if(tipo==='video'&&(datos.video||datos.imagenes.length)){aviso('Quitá las fotos adicionales antes de elegir un video.');return;}
    if(tipo==='video'&&(!/^(video\/mp4|video\/webm)$/.test(file.type)||file.size>20*1024*1024)){alert('Elegí un MP4 o WebM de hasta 20 MB.');return;}
    if(tipo==='imagen'&&(!/^(image\/jpeg|image\/png|image\/webp)$/.test(file.type)||file.size>18*1024*1024)){alert('Elegí una foto JPG, PNG o WebP de hasta 18 MB.');return;}
    ocupado=true;
    var panel=modal&&modal.querySelector('.ae-gal-panel'),mensaje=nodo('p','','Subiendo archivo, sin modificar la foto principal…');if(panel)panel.appendChild(mensaje);
    tiendaAuthFotosSesion().then(function(session){
      if(!session||!session.user)throw new Error('Conectá el administrador seguro de fotos.');
      return tipo==='imagen'?comprimir(file):file;
    }).then(function(blob){
      var extension=tipo==='imagen'?'jpg':file.type==='video/webm'?'webm':'mp4';
      var token=typeof tiendaTokenFoto==='function'?tiendaTokenFoto(clave(p)):String(Date.now());
      var ruta='manual/galeria/'+token+'/'+Date.now()+'_'+Math.random().toString(36).slice(2,9)+'.'+extension;
      return sbFotos.storage.from(BUCKET).upload(ruta,blob,{contentType:tipo==='imagen'?'image/jpeg':file.type,upsert:false,cacheControl:'31536000'})
        .then(function(r){if(r.error)throw r.error;return sbFotos.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl;});
    }).then(function(url){
      var nuevo={imagenes:datos.imagenes.slice(),video:datos.video};
      if(tipo==='imagen')nuevo.imagenes.push(url);else nuevo.video=url;
      return sbFotos.from(TABLA).upsert({
        clave:clave(p),imagenes:nuevo.imagenes,video_url:nuevo.video||null,
        actualizado:new Date().toISOString()
      },{onConflict:'clave'}).select('imagenes,video_url').single();
    }).then(function(r){
      if(r.error)throw r.error;
      var confirmado=limpio(r.data);cache.set(clave(p),confirmado);refrescarTarjetas(p,confirmado);
      aviso('✅ '+(tipo==='imagen'?'Foto':'Video')+' agregado sin reemplazar la portada');
      return tiendaAuthFotosSesion().then(function(sesion){if(modal)renderAdmin(p,confirmado,sesion);});
    }).catch(function(e){alert('⚠️ No se completó la carga: '+(e.message||e));})
      .finally(function(){ocupado=false;if(mensaje&&mensaje.isConnected)mensaje.remove();});
  }

  // Carrusel liviano en la tarjeta: todos los roles lo ven; sólo el admin edita.
  // Lee los medios en lotes al entrar al área visible y nunca descarga videos en la grilla.
  var aeCardsVistas=new WeakSet(), aeCardsEstado=new WeakMap();
  var aeCardsCola=new Set(), aeCardsObservador=null, aeCardsRaiz=null;
  var aeCardsTimer=0, aeCardsRenderPendiente=false;
  var aeCardsCss=document.createElement('style');
  aeCardsCss.textContent=
    '.ae-gal-card-count{position:absolute;z-index:5;right:8px;top:8px;padding:5px 9px;border-radius:18px;background:rgba(8,22,48,.87);color:#fff;font-size:11px;font-weight:800;line-height:1.15;font-family:inherit;box-shadow:0 2px 9px #0005;pointer-events:none;white-space:nowrap}' +
    '.ae-gal-card-arrow{position:absolute;z-index:5;top:50%;transform:translateY(-50%);width:29px;height:34px;border:0;border-radius:12px;background:rgba(8,22,48,.72)!important;color:#fff!important;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;font-size:24px;line-height:1;touch-action:manipulation}' +
    '.ae-gal-card-prev{left:5px}.ae-gal-card-next{right:5px}' +
    '.ae-gal-card-arrow:disabled{opacity:.24;cursor:default}' +
    '.ae-gal-card-play{position:absolute;z-index:4;left:50%;top:50%;transform:translate(-50%,-50%);width:54px;height:54px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(8,22,48,.86);border:2px solid #fff;color:#fff;font-size:25px;box-shadow:0 2px 14px #0008;pointer-events:none}' +
    '.ae-gal-card-count[hidden],.ae-gal-card-arrow[hidden],.ae-gal-card-play[hidden]{display:none!important}' +
    '.ae-gal-card-share{position:absolute;z-index:7;right:8px;top:44px;padding:7px 9px;border-radius:10px;border:1px solid rgba(255,255,255,.65);background:rgba(8,22,48,.9)!important;color:#fff!important;font-size:11px;font-weight:800;font-family:inherit;white-space:nowrap;cursor:pointer;touch-action:manipulation;box-shadow:0 2px 8px #0004}' +
    '.ae-gal-card-share:disabled{opacity:.6;cursor:wait}';
  document.head.appendChild(aeCardsCss);

  function aeTarjetaMostrar(estado,i){
    if(!estado.activo||i<0||i>=estado.lista.length)return;
    estado.indice=i;
    var item=estado.lista[i],esVideo=item.tipo==='video';
    var nuevaUrl=esVideo?(estado.p.foto?estado.portadaUrl:(estado.lista.find(function(a){return a.tipo==='imagen';})||{}).url):
      (i===0&&estado.p.foto?estado.portadaUrl:item.url);
    if(nuevaUrl&&estado.img.getAttribute('src')!==nuevaUrl)estado.img.setAttribute('src',nuevaUrl);
    estado.img.style.objectFit=(i===0&&estado.p.foto)?estado.objectFit:'contain';
    estado.img.style.cursor='zoom-in';
    estado.numero.textContent=(i+1)+' de '+estado.lista.length+(esVideo?' · video':'');
    estado.anterior.disabled=i===0;
    estado.siguiente.disabled=i===estado.lista.length-1;
    estado.play.hidden=!esVideo;
    if(estado.compartir)estado.compartir.textContent=esVideo?'📤 Video':'📤 Foto';
  }

  // Disponible también con una sola foto; no exige que el carrusel esté activo.
  function aeTarjetaCompartir(card,p,lista){
    var img=card.querySelector('img.prod-foto'),envoltorio=img&&img.parentElement;
    if(!envoltorio){
      envoltorio=Array.prototype.slice.call(card.children).find(function(el){
        return el.style&&el.style.position==='relative'&&el.querySelector('[onclick^="tiendaVerDetalle"]');
      });
    }
    if(!envoltorio)return null;
    var compartir=envoltorio.querySelector('.ae-gal-card-share');
    if(!lista.length){if(compartir)compartir.remove();return null;}
    card._aeShareMedios={p:p,lista:lista};
    if(!compartir){
      compartir=boton('📤 Foto',function(e){
        e.preventDefault();e.stopPropagation();
        var data=card._aeShareMedios,estado=aeCardsEstado.get(card);
        if(!data||!data.lista.length)return;
        var indice=estado&&estado.activo?estado.indice:0;
        compartirMedio(data.p,data.lista[indice]||data.lista[0],compartir);
      },'ae-gal-card-share');
      compartir.setAttribute('aria-label','Compartir la foto o video seleccionado');
      envoltorio.appendChild(compartir);
    }
    compartir.textContent=lista[0].tipo==='video'?'📤 Video':'📤 Foto';
    return compartir;
  }

  function aeTarjetaPintar(card,p,datos){
    if(!card||!card.isConnected)return;
    var lista=piezas(p,datos),estado=aeCardsEstado.get(card);
    var compartir=aeTarjetaCompartir(card,p,lista);
    if(estado)estado.compartir=compartir;
    if(lista.length<2){
      if(estado){
        estado.activo=false;
        [estado.numero,estado.anterior,estado.siguiente,estado.play].forEach(function(el){el.hidden=true;});
        if(estado.portadaUrl)estado.img.setAttribute('src',estado.portadaUrl);
        estado.img.style.objectFit=estado.objectFit;
      }
      return;
    }
    if(estado){
      estado.p=p;estado.datos=datos;estado.lista=lista;estado.activo=true;
      [estado.numero,estado.anterior,estado.siguiente].forEach(function(el){el.hidden=false;});
      aeTarjetaMostrar(estado,0);
      return;
    }
    var img=card.querySelector('img.prod-foto');
    var envoltorio=img&&img.parentElement;
    if(!envoltorio){
      // Productos sin portada: conservar el placeholder original debajo de la galería.
      var hijos=Array.prototype.slice.call(card.children);
      envoltorio=hijos.find(function(el){return el.style&&el.style.position==='relative'&&el.querySelector('[onclick^="tiendaVerDetalle"]');});
      if(!envoltorio)return;
      img=nodo('img','prod-foto');
      img.loading='lazy';img.decoding='async';img.alt=p.nombre||'Producto';
      img.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#fff;border-radius:13px 13px 0 0;cursor:zoom-in';
      envoltorio.appendChild(img);
    }
    estado={p:p,datos:datos,lista:lista,img:img,indice:0,activo:true,compartir:compartir,
      portadaUrl:img.getAttribute('src')||'',objectFit:img.style.objectFit||'cover'};
    aeCardsEstado.set(card,estado);
    estado.numero=nodo('span','ae-gal-card-count');
    estado.numero.setAttribute('aria-live','polite');
    estado.anterior=boton('‹',function(e){e.stopPropagation();aeTarjetaMostrar(estado,estado.indice-1);},'ae-gal-card-arrow ae-gal-card-prev');
    estado.siguiente=boton('›',function(e){e.stopPropagation();aeTarjetaMostrar(estado,estado.indice+1);},'ae-gal-card-arrow ae-gal-card-next');
    estado.anterior.setAttribute('aria-label','Foto o video anterior');
    estado.siguiente.setAttribute('aria-label','Foto o video siguiente');
    estado.play=nodo('span','ae-gal-card-play','▶');
    estado.play.setAttribute('aria-hidden','true');
    envoltorio.append(estado.numero,estado.anterior,estado.siguiente,estado.play);
    img.style.touchAction='pan-y';
    // Interceptar sólo la imagen/zoom con galería: el resto de la tarjeta sigue igual.
    var x=0,y=0,suprimirHasta=0;
    img.addEventListener('touchstart',function(e){
      if(!estado.activo||!e.touches.length)return;
      x=e.touches[0].clientX;y=e.touches[0].clientY;
    },{passive:true});
    img.addEventListener('touchend',function(e){
      if(!estado.activo||!e.changedTouches.length)return;
      var dx=e.changedTouches[0].clientX-x,dy=e.changedTouches[0].clientY-y;
      if(Math.abs(dx)>35&&Math.abs(dx)>Math.abs(dy)*1.3){
        suprimirHasta=Date.now()+550;
        aeTarjetaMostrar(estado,estado.indice+(dx<0?1:-1));
      }
    },{passive:true});
    img.addEventListener('click',function(e){
      if(!estado.activo)return;
      e.preventDefault();e.stopImmediatePropagation();
      if(Date.now()<suprimirHasta)return;
      abrirVisor(estado.p,estado.datos,estado.indice);
    },true);
    // Los dos botones de ampliar preexistentes deben mostrar el elemento elegido.
    var zooms=Array.prototype.slice.call(envoltorio.querySelectorAll('button[onclick*="abrirFotoGrande"]'));
    zooms=zooms.concat(Array.prototype.slice.call(card.querySelectorAll('.prod-ampliar-btn')));
    zooms.forEach(function(z){
      if(z.dataset.aeGalZoom)return;
      z.dataset.aeGalZoom='1';
      z.addEventListener('click',function(e){
        if(!estado.activo)return;
        e.preventDefault();e.stopImmediatePropagation();
        abrirVisor(estado.p,estado.datos,estado.indice);
      },true);
    });
    aeTarjetaMostrar(estado,0);
  }

  function aeTarjetasCargarCola(){
    aeCardsTimer=0;
    var cards=Array.from(aeCardsCola).filter(function(c){return c.isConnected;});
    aeCardsCola.clear();
    if(!cards.length)return;
    var grupos=new Map();
    cards.forEach(function(card){
      var p=producto(card.id.slice(5));if(!p)return;
      var k=clave(p);
      if(cache.has(k)){aeTarjetaPintar(card,p,cache.get(k));return;}
      if(!grupos.has(k))grupos.set(k,[]);
      grupos.get(k).push({card:card,p:p});
    });
    if(!grupos.size)return;
    var llaves=Array.from(grupos.keys());
    // La tabla se consulta con una única petición por lote visible.
    esperarNube().then(function(sb){
      return sb.from(TABLA).select('clave,imagenes,video_url').in('clave',llaves);
    }).then(function(r){
      if(r.error)throw r.error;
      var filas=new Map();
      (r.data||[]).forEach(function(d){filas.set(d.clave,limpio(d));});
      grupos.forEach(function(entradas,k){
        var datos=filas.get(k)||limpio(null);
        cache.set(k,datos);
        entradas.forEach(function(x){aeTarjetaPintar(x.card,x.p,datos);});
      });
    }).catch(function(){/* Sin conexión: se conserva la portada original. */});
  }

  function aeTarjetasAlcance(card){
    if(aeCardsObservador)aeCardsObservador.unobserve(card);
    if(!card||!card.id||card.id.indexOf('card-')!==0)return;
    aeCardsCola.add(card);
    if(!aeCardsTimer)aeCardsTimer=setTimeout(aeTarjetasCargarCola,70);
  }
  function programarTarjetas(){
    if(aeCardsRenderPendiente)return;
    aeCardsRenderPendiente=true;
    requestAnimationFrame(function(){
      aeCardsRenderPendiente=false;
      if(!aeCardsRaiz)return;
      aeCardsRaiz.querySelectorAll('.prod-card[id^="card-"]').forEach(function(card){
        if(aeCardsVistas.has(card))return;
        aeCardsVistas.add(card);
        if(aeCardsObservador)aeCardsObservador.observe(card);
        else aeTarjetasAlcance(card);
      });
    });
  }
  function refrescarTarjetas(p,datos){
    if(!aeCardsRaiz)return;
    aeCardsRaiz.querySelectorAll('.prod-card[id^="card-"]').forEach(function(card){
      if(card.id==='card-'+String(p.id))aeTarjetaPintar(card,p,datos);
    });
  }
  function iniciarCarruselTarjetas(){
    aeCardsRaiz=document.getElementById('tienda-grid');
    if(!aeCardsRaiz)return;
    if(typeof IntersectionObserver==='function'){
      aeCardsObservador=new IntersectionObserver(function(entries){
        entries.forEach(function(e){if(e.isIntersecting)aeTarjetasAlcance(e.target);});
      },{rootMargin:'260px 0px',threshold:0});
    }
    if(typeof MutationObserver==='function'){
      new MutationObserver(function(){programarTarjetas();}).observe(aeCardsRaiz,{childList:true});
    }
    programarTarjetas();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciarCarruselTarjetas,{once:true});
  else iniciarCarruselTarjetas();

  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'){if(visor)cerrarVisor();else if(modal)cerrarAdmin();}
  });
  // Android puede interrumpir las subidas si se cierra por completo la página.
  // Este aviso solo se muestra si hay archivos realmente cargándose.
  window.addEventListener('beforeunload',function(e){
    if(ocupado){e.preventDefault();e.returnValue='';}
  });
  window.AEGaleria={abrir:abrir,mostrarEnDetalle:mostrarEnDetalle,cargarCreacion:cargarCreacion,estadoCarga:estadoUpload};
})();