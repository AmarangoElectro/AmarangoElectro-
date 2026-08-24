/* AmarangoElectro · productividad de tienda
   - suaviza listeners de scroll que escribían en DOM en cada frame
   - agrega copiar nombre en tarjetas admin
   - agrega filtro dinámico por mayorista para administradores
   - agrega navegación rápida por categorías en el lateral
   - fuerza el action sheet de marca en imágenes admin (sin menú gris nativo)
*/
(function(){
  'use strict';

  var VERSION='ae-tienda-productividad-2026-08-24-1';
  if(window.__AE_TIENDA_PRODUCTIVIDAD__===VERSION)return;
  window.__AE_TIENDA_PRODUCTIVIDAD__=VERSION;

  var mayoristaActivo='';
  var mayoristaEstadoPrevio=null;
  var renderOriginal=null;
  var abrirCajonOriginal=null;
  var rafUi=0;
  var fastNav=null;
  var fastBubble=null;
  var fastCats=[];
  var fastPendiente='';
  var fastDragging=false;
  var fastPointerId=null;

  var ICON_COPY='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';

  function esAdmin(){
    try{
      if(window.tiendaEsAdmin===true)return true;
      if(window.adminUnlocked===true && window.vistaPreviaCliente!==true)return true;
      return localStorage.getItem('ae_sesion_admin')==='1' || localStorage.getItem('ae_rol')==='admin';
    }catch(e){return false;}
  }

  function norm(v){
    return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
  }

  function proveedorDe(p){
    return String(p&&(p.proveedor||p.mayorista)||'').trim();
  }

  function coincideMayorista(p,nombre){
    return !!nombre && norm(proveedorDe(p))===norm(nombre);
  }

  function escaparHtml(v){
    return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});
  }

  function toast(txt){
    try{if(typeof window.mostrarToast==='function'){window.mostrarToast(txt);return;}}catch(e){}
    var t=document.getElementById('ae-prod-toast');
    if(!t){
      t=document.createElement('div');
      t.id='ae-prod-toast';
      t.style.cssText='position:fixed;left:50%;bottom:92px;transform:translateX(-50%);z-index:15050;background:#071c46;color:#fff;border-left:4px solid #FF7A00;border-radius:13px;padding:10px 14px;font:800 .78rem/1.25 system-ui;box-shadow:0 10px 28px rgba(0,0,0,.25);max-width:86vw;text-align:center;';
      document.body.appendChild(t);
    }
    t.textContent=txt;
    clearTimeout(t._aeTimer);
    t._aeTimer=setTimeout(function(){if(t&&t.parentNode)t.remove();},1700);
  }

  function copiarTexto(texto){
    texto=String(texto==null?'':texto);
    if(navigator.clipboard&&navigator.clipboard.writeText){
      return navigator.clipboard.writeText(texto).catch(function(){return copiarFallback(texto);});
    }
    return copiarFallback(texto);
  }

  function copiarFallback(texto){
    return new Promise(function(resolve,reject){
      try{
        var ta=document.createElement('textarea');
        ta.value=texto;ta.setAttribute('readonly','');
        ta.style.cssText='position:fixed;opacity:0;left:-9999px;top:0;pointer-events:none;';
        document.body.appendChild(ta);ta.select();ta.setSelectionRange(0,ta.value.length);
        var ok=document.execCommand('copy');ta.remove();
        if(ok)resolve();else reject(new Error('copy-failed'));
      }catch(e){reject(e);}
    });
  }

  function productoPorCard(card){
    if(!card)return null;
    var id=String(card.id||'').replace(/^card-/,'');
    try{if(typeof window.buscarProd==='function'){var p=window.buscarProd(id);if(p)return p;}}catch(e){}
    var lista=Array.isArray(window.tiendaProductos)?window.tiendaProductos:[];
    for(var i=0;i<lista.length;i++)if(String(lista[i]&&lista[i].id)===id)return lista[i];
    return null;
  }

  function inyectarEstilos(){
    if(document.getElementById('ae-tienda-productividad-css'))return;
    var s=document.createElement('style');
    s.id='ae-tienda-productividad-css';
    s.textContent='\n'
      +'.ae-card-copy-name{flex:0 0 auto;width:28px;height:28px;border-radius:8px;border:1.5px solid #cbdaf0;background:#fff;color:#0B2D6B;display:flex;align-items:center;justify-content:center;padding:0;box-shadow:0 2px 7px rgba(11,45,107,.08);cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}\n'
      +'.ae-card-copy-name svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}\n'
      +'.ae-card-copy-name.copied{background:#eaf8ef;border-color:#78d6a1;color:#08783e}\n'
      +'.ae-mayorista-click{cursor:pointer!important;outline:0;position:relative}\n'
      +'.ae-mayorista-click:active{transform:scale(.985)}\n'
      +'#ae-mayorista-box{display:flex;flex-direction:column;gap:6px;margin-bottom:2px}\n'
      +'#ae-mayorista-box label{color:rgba(255,255,255,.72);font-size:.62rem;font-weight:900;letter-spacing:.04em;text-transform:uppercase}\n'
      +'#ae-mayorista-select{width:100%;padding:10px 11px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:#fff;color:#0B2D6B;font-family:inherit;font-size:.78rem;font-weight:800}\n'
      +'#ae-mayorista-banner{grid-column:1/-1;display:flex;align-items:center;gap:8px;background:linear-gradient(135deg,#0B2D6B,#174f9c);color:#fff;border-left:4px solid #FF7A00;border-radius:12px;padding:9px 10px;margin:0 0 8px;box-shadow:0 4px 13px rgba(11,45,107,.16)}\n'
      +'#ae-mayorista-banner .ae-mb-copy{flex:1;min-width:0;font-size:.69rem;font-weight:800;line-height:1.25}\n'
      +'#ae-mayorista-banner .ae-mb-copy b{display:block;font-size:.78rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n'
      +'#ae-mayorista-banner button{flex:0 0 auto;border:1px solid rgba(255,255,255,.32);background:rgba(255,255,255,.13);color:#fff;border-radius:9px;padding:6px 8px;font:900 .64rem/1 system-ui;cursor:pointer}\n'
      +'#ae-fast-nav{position:fixed;z-index:840;display:none;flex-direction:column;align-items:center;gap:2px;width:27px;padding:5px 3px;border:1px solid rgba(11,45,107,.14);border-radius:14px;background:rgba(255,255,255,.96);box-shadow:0 4px 14px rgba(3,15,45,.14);touch-action:none;user-select:none;-webkit-user-select:none;contain:layout paint}\n'
      +'#ae-fast-nav.on{display:flex}\n'
      +'#ae-fast-nav button{width:20px;height:20px;min-height:20px;border:0;background:transparent;border-radius:7px;padding:0;display:flex;align-items:center;justify-content:center;font-size:.72rem;line-height:1;cursor:pointer;color:#0B2D6B;touch-action:none}\n'
      +'#ae-fast-nav button.active{background:#0B2D6B;color:#fff;transform:scale(1.08)}\n'
      +'#ae-fast-bubble{position:fixed;z-index:845;display:none;pointer-events:none;min-width:122px;max-width:210px;background:#071c46;color:#fff;border-left:4px solid #FF7A00;border-radius:12px;padding:9px 11px;font:900 .74rem/1.2 system-ui;box-shadow:0 8px 24px rgba(3,15,45,.22);text-align:left}\n'
      +'#ae-fast-bubble.on{display:block}\n'
      +'@media (pointer:coarse){#tienda-grid .prod-card{touch-action:pan-y pinch-zoom!important}#tienda-grid .prod-card:active{transform:none!important;box-shadow:0 1px 3px rgba(0,0,0,.05)!important}#tienda-grid .prod-card button[onclick*="abrirFotoGrande"]{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;background:rgba(11,45,107,.94)!important}}\n';
    document.head.appendChild(s);
  }

  /* Corrige dos listeners de scroll caros que reaparecieron en el index actual. */
  function optimizarScroll(){
    try{
      var viejo=window.hdrCerrarSugerencias;
      if(typeof viejo==='function' && !viejo.__aeSuave){
        window.removeEventListener('scroll',viejo,false);
        var suave=function(){
          var box=document.getElementById('hdr-sugerencias');
          if(!box)return;
          if(box.style.display!=='none')box.style.display='none';
          if(box.childNodes&&box.childNodes.length)box.innerHTML='';
        };
        suave.__aeSuave=VERSION;
        window.hdrCerrarSugerencias=suave;
        window.addEventListener('scroll',suave,{passive:true});
      }
    }catch(e){}

    var btn=document.getElementById('btn-arriba');
    if(btn && btn.id==='btn-arriba'){
      // El listener inline anterior busca #btn-arriba en cada scroll y escribe
      // display de forma síncrona. Renombrarlo lo vuelve inerte sin tocar su onclick.
      btn.id='btn-arriba-ae';
      var visible=null,raf=0;
      var pintar=function(){
        raf=0;
        var tab=document.getElementById('tab-tienda');
        var sc=(tab&&tab.scrollTop)||window.scrollY||document.documentElement.scrollTop||0;
        var mostrar=!!(sc>300 && tab && tab.classList.contains('on'));
        if(mostrar!==visible){btn.style.display=mostrar?'block':'none';visible=mostrar;}
      };
      var pedir=function(){if(raf)return;raf=requestAnimationFrame(pintar);};
      window.addEventListener('scroll',pedir,{passive:true});
      var tab=document.getElementById('tab-tienda');
      if(tab)tab.addEventListener('scroll',pedir,{passive:true});
      pintar();
    }
  }

  function decorarCopiarNombre(){
    var cards=document.querySelectorAll('#tienda-grid .prod-card');
    for(var i=0;i<cards.length;i++){
      var card=cards[i];
      var existente=card.querySelector('.ae-card-copy-name');
      if(!esAdmin()){
        if(existente)existente.remove();
        continue;
      }
      if(existente)continue;
      var titulo=card.querySelector('.prod-nombre');
      if(!titulo||!titulo.parentElement)continue;
      var p=productoPorCard(card);
      if(!p||!p.nombre)continue;
      var b=document.createElement('button');
      b.type='button';b.className='ae-card-copy-name';
      b.setAttribute('aria-label','Copiar nombre del producto');b.setAttribute('title','Copiar nombre');
      b.innerHTML=ICON_COPY;
      b.addEventListener('click',(function(btn,nombre){return function(ev){
        ev.preventDefault();ev.stopPropagation();
        copiarTexto(nombre).then(function(){
          btn.classList.add('copied');toast('📋 Nombre copiado');
          setTimeout(function(){btn.classList.remove('copied');},900);
        }).catch(function(){toast('No se pudo copiar el nombre');});
      };})(b,String(p.nombre)));
      var fav=titulo.parentElement.querySelector('button[id^="fav-"]');
      if(fav)titulo.parentElement.insertBefore(b,fav);else titulo.parentElement.appendChild(b);
    }
  }

  function listaMayoristas(){
    var mapa={};
    var lista=Array.isArray(window.tiendaProductos)?window.tiendaProductos:[];
    lista.forEach(function(p){
      var n=proveedorDe(p);if(!n)return;
      var k=norm(n);if(!k)return;
      if(!mapa[k])mapa[k]={nombre:n,cantidad:0};
      mapa[k].cantidad++;
    });
    return Object.keys(mapa).map(function(k){return mapa[k];}).sort(function(a,b){return a.nombre.localeCompare(b.nombre,'es',{sensitivity:'base'});});
  }

  function poblarMayoristas(){
    var caja=document.getElementById('cajon-filtros');
    if(!caja)return;
    var box=document.getElementById('ae-mayorista-box');
    if(!box){
      box=document.createElement('div');box.id='ae-mayorista-box';
      box.innerHTML='<label for="ae-mayorista-select">Mayorista</label><select id="ae-mayorista-select"><option value="">🏪 Todos los mayoristas</option></select>';
      caja.insertBefore(box,caja.firstChild);
      box.querySelector('select').addEventListener('change',function(){aplicarMayorista(this.value,false);});
    }
    var sel=document.getElementById('ae-mayorista-select');if(!sel)return;
    var items=listaMayoristas();
    var html='<option value="">🏪 Todos los mayoristas</option>';
    items.forEach(function(it){html+='<option value="'+escaparHtml(it.nombre)+'">'+escaparHtml(it.nombre)+' ('+it.cantidad+')</option>';});
    var firma=items.map(function(it){return norm(it.nombre)+':'+it.cantidad;}).join('|');
    if(sel.dataset.firma!==firma){sel.innerHTML=html;sel.dataset.firma=firma;}
    var existe=!mayoristaActivo || items.some(function(it){return norm(it.nombre)===norm(mayoristaActivo);});
    if(!existe)mayoristaActivo='';
    if(sel.value!==mayoristaActivo)sel.value=mayoristaActivo;
  }

  function capturarEstadoAntesMayorista(){
    return {
      bandeja:window.tiendaBandejaAdmin||'',
      categoria:window.tiendaCategoriaActiva||'',
      marca:window.tiendaMarcaActiva||'',
      sub:window.tiendaSubfiltroActivo||'',
      favoritos:!!window.verSoloFavoritos,
      ofertas:!!window.verSoloOfertas,
      viejos:!!window.verSoloPreciosViejos,
      portada:!!window.tiendaModoPortada,
      todos:!!window.tiendaMostrarTodos,
      buscar:(document.getElementById('tienda-buscar')||{}).value||'',
      hdrBuscar:(document.getElementById('hdr-buscar-input')||{}).value||'',
      orden:(document.getElementById('tienda-orden')||{}).value||'',
      max:(document.getElementById('tienda-maxprecio')||{}).value||''
    };
  }

  function restaurarEstadoAntesMayorista(){
    var e=mayoristaEstadoPrevio;mayoristaEstadoPrevio=null;
    if(!e){try{window.tiendaModoPortada=true;window.tiendaMostrarTodos=false;}catch(x){}return;}
    try{window.tiendaBandejaAdmin=e.bandeja;}catch(x){}
    try{window.tiendaCategoriaActiva=e.categoria;}catch(x){}
    try{window.tiendaMarcaActiva=e.marca;}catch(x){}
    try{window.tiendaSubfiltroActivo=e.sub;}catch(x){}
    try{window.verSoloFavoritos=e.favoritos;}catch(x){}
    try{window.verSoloOfertas=e.ofertas;}catch(x){}
    try{window.verSoloPreciosViejos=e.viejos;}catch(x){}
    try{window.tiendaModoPortada=e.portada;window.tiendaMostrarTodos=e.todos;}catch(x){}
    var b=document.getElementById('tienda-buscar');if(b)b.value=e.buscar;
    var h=document.getElementById('hdr-buscar-input');if(h)h.value=e.hdrBuscar;
    var o=document.getElementById('tienda-orden');if(o)o.value=e.orden;
    var m=document.getElementById('tienda-maxprecio');if(m)m.value=e.max;
  }

  function limpiarFiltrosParaMayorista(){
    try{window.tiendaBandejaAdmin='';}catch(e){}
    try{window.tiendaCategoriaActiva='';}catch(e){}
    try{window.tiendaMarcaActiva='';}catch(e){}
    try{window.tiendaSubfiltroActivo='';}catch(e){}
    try{window.verSoloFavoritos=false;}catch(e){}
    try{window.verSoloOfertas=false;}catch(e){}
    try{window.verSoloPreciosViejos=false;}catch(e){}
    try{window.tiendaModoPortada=false;}catch(e){}
    try{window.tiendaMostrarTodos=true;}catch(e){}
    var b=document.getElementById('tienda-buscar');if(b)b.value='';
    var h=document.getElementById('hdr-buscar-input');if(h)h.value='';
  }

  function aplicarMayorista(nombre,desdeTarjeta){
    if(!esAdmin())return;
    nombre=String(nombre||'').trim();
    var anterior=mayoristaActivo;
    if(nombre && !anterior)mayoristaEstadoPrevio=capturarEstadoAntesMayorista();
    mayoristaActivo=nombre;
    if(nombre)limpiarFiltrosParaMayorista();
    else if(anterior)restaurarEstadoAntesMayorista();
    poblarMayoristas();
    if(typeof window.cerrarCajon==='function' && !desdeTarjeta){try{window.cerrarCajon();}catch(e){}}
    if(typeof window.tiendaRender==='function')window.tiendaRender();
    if(nombre)toast('🏪 Viendo '+nombre);else toast('🏪 Mostrando todos los mayoristas');
    setTimeout(function(){
      var destino=document.getElementById('tienda-grid');
      if(destino&&destino.scrollIntoView)destino.scrollIntoView({behavior:'auto',block:'start'});
    },20);
  }
  window.aeFiltrarMayorista=aplicarMayorista;

  function decorarMayoristasTarjeta(){
    if(!esAdmin())return;
    var cards=document.querySelectorAll('#tienda-grid .prod-card');
    cards.forEach(function(card){
      var p=productoPorCard(card);var n=proveedorDe(p);if(!n)return;
      if(card.dataset.aeMayoristaDecorado===n)return;
      card.dataset.aeMayoristaDecorado=n;
      var nodos=card.querySelectorAll('span,div');
      for(var i=0;i<nodos.length;i++){
        var el=nodos[i];
        if(el.childElementCount)continue;
        var txt=String(el.textContent||'').trim();
        if(txt==='🔄 '+n || txt==='🏪 '+n){
          el.classList.add('ae-mayorista-click');
          el.dataset.aeMayorista=n;
          el.setAttribute('role','button');
          el.setAttribute('tabindex','0');
          el.setAttribute('title','Ver todos los productos de '+n);
        }
      }
    });
  }

  document.addEventListener('click',function(ev){
    var el=ev.target&&ev.target.closest?ev.target.closest('[data-ae-mayorista]'):null;
    if(!el||!esAdmin())return;
    ev.preventDefault();ev.stopPropagation();
    aplicarMayorista(el.dataset.aeMayorista||'',true);
  },true);
  document.addEventListener('keydown',function(ev){
    if(ev.key!=='Enter'&&ev.key!==' ')return;
    var el=ev.target&&ev.target.closest?ev.target.closest('[data-ae-mayorista]'):null;
    if(!el||!esAdmin())return;
    ev.preventDefault();aplicarMayorista(el.dataset.aeMayorista||'',true);
  });

  function instalarRenderMayorista(){
    if(typeof window.tiendaRender!=='function'||window.tiendaRender.__aeMayorista)return false;
    renderOriginal=window.tiendaRender;
    var envuelto=function(){
      var activo=esAdmin()&&!!mayoristaActivo;
      var visibleOriginal=window.tiendaEstaVisibleYConStock;
      var celusOriginal=window.cargarListaCelus;
      if(activo){
        try{window.tiendaBandejaAdmin='';window.tiendaModoPortada=false;}catch(e){}
        if(typeof visibleOriginal==='function'){
          window.tiendaEstaVisibleYConStock=function(p){return coincideMayorista(p,mayoristaActivo);};
        }
        if(typeof celusOriginal==='function')window.cargarListaCelus=function(){return [];};
      }
      var salida;
      try{salida=renderOriginal.apply(this,arguments);}
      finally{
        if(activo){
          if(typeof visibleOriginal==='function')window.tiendaEstaVisibleYConStock=visibleOriginal;
          if(typeof celusOriginal==='function')window.cargarListaCelus=celusOriginal;
        }
      }
      programarUi();
      return salida;
    };
    envuelto.__aeMayorista=VERSION;envuelto.__original=renderOriginal;
    window.tiendaRender=envuelto;
    return true;
  }

  function pintarBannerMayorista(){
    var viejo=document.getElementById('ae-mayorista-banner');
    if(!esAdmin()||!mayoristaActivo){if(viejo)viejo.remove();return;}
    var grid=document.getElementById('tienda-grid');if(!grid||!grid.parentNode)return;
    var total=(Array.isArray(window.tiendaProductos)?window.tiendaProductos:[]).filter(function(p){return coincideMayorista(p,mayoristaActivo);}).length;
    var b=viejo||document.createElement('div');b.id='ae-mayorista-banner';
    var firma=norm(mayoristaActivo)+'|'+total;
    if(b.dataset.firma!==firma){
      b.innerHTML='<div class="ae-mb-copy">Filtrando mayorista<b>'+escaparHtml(mayoristaActivo)+'</b>'+total+' producto'+(total===1?'':'s')+'</div><button type="button" data-ae-clear-mayorista>Quitar filtro</button>';
      b.dataset.firma=firma;
      var q=b.querySelector('[data-ae-clear-mayorista]');if(q)q.onclick=function(ev){ev.preventDefault();ev.stopPropagation();aplicarMayorista('',true);};
    }
    if(!viejo)grid.parentNode.insertBefore(b,grid);
  }

  function categoriasDisponibles(){
    var desdeChips=[];
    try{
      document.querySelectorAll('#tienda-chips .cat-tile[data-categoria]').forEach(function(el){
        var c=String(el.getAttribute('data-categoria')||'').trim();
        if(c&&desdeChips.indexOf(c)===-1)desdeChips.push(c);
      });
    }catch(e){}
    if(desdeChips.length>=4)return desdeChips;

    var set={};
    var lista=Array.isArray(window.tiendaProductos)?window.tiendaProductos:[];
    lista.forEach(function(p){
      if(mayoristaActivo&&esAdmin()&&!coincideMayorista(p,mayoristaActivo))return;
      try{
        if(!esAdmin() && typeof window.tiendaEstaVisibleYConStock==='function' && !window.tiendaEstaVisibleYConStock(p))return;
      }catch(e){}
      var c='';try{c=typeof window.catProd==='function'?window.catProd(p):String(p.categoria||'');}catch(e){c=String(p&&p.categoria||'');}
      if(c)set[c]=1;
    });
    try{
      var celus=typeof window.cargarListaCelus==='function'?window.cargarListaCelus():[];
      if(!mayoristaActivo && Array.isArray(celus) && celus.some(function(c){return c&&c.precio&&!c.ocultoTienda&&!c.sinStock;}))set['📱 Celulares']=1;
    }catch(e){}
    var base=Array.isArray(window.TIENDA_CATEGORIAS)?window.TIENDA_CATEGORIAS.slice():[];
    var out=base.filter(function(c){return set[c];});
    Object.keys(set).forEach(function(c){if(out.indexOf(c)===-1)out.push(c);});
    return out;
  }

  function iconoCategoria(cat){
    var s=String(cat||'').trim();
    var m=s.match(/^([^\w\s]{1,4})\s*/u);
    if(m&&m[1])return m[1];
    var txt=s.replace(/^\S+\s+/,'').trim();
    return (txt.charAt(0)||'•').toUpperCase();
  }

  function asegurarFastNav(){
    if(!fastNav){
      fastNav=document.createElement('div');fastNav.id='ae-fast-nav';fastNav.setAttribute('aria-label','Navegación rápida por categorías');
      document.body.appendChild(fastNav);
      fastBubble=document.createElement('div');fastBubble.id='ae-fast-bubble';document.body.appendChild(fastBubble);
      fastNav.addEventListener('pointerdown',fastPointerDown);
      fastNav.addEventListener('pointermove',fastPointerMove);
      fastNav.addEventListener('pointerup',fastPointerUp);
      fastNav.addEventListener('pointercancel',fastPointerCancel);
    }
    var cats=categoriasDisponibles();
    var firma=cats.join('|');
    if(fastNav.dataset.firma!==firma){
      fastCats=cats;fastNav.dataset.firma=firma;
      fastNav.innerHTML='';
      cats.forEach(function(c){
        var b=document.createElement('button');b.type='button';b.dataset.cat=c;b.setAttribute('aria-label',c);b.setAttribute('title',c);b.textContent=iconoCategoria(c);fastNav.appendChild(b);
      });
    }
    posicionarFastNav();
    actualizarFastNavVisible();
  }

  function posicionarFastNav(){
    if(!fastNav)return;
    var cuerpo=document.body.getBoundingClientRect();
    var right=Math.max(3,Math.round(window.innerWidth-cuerpo.right+3));
    fastNav.style.right=right+'px';
    fastNav.style.top='50%';fastNav.style.transform='translateY(-50%)';
  }

  function actualizarFastNavVisible(){
    if(!fastNav)return;
    var tab=document.getElementById('tab-tienda');
    var visible=!!(tab&&tab.classList.contains('on')&&fastCats.length>=4);
    fastNav.classList.toggle('on',visible);
    if(!visible&&fastBubble)fastBubble.classList.remove('on');
  }

  function indiceDesdeY(y){
    var r=fastNav.getBoundingClientRect();
    if(!r.height||!fastCats.length)return -1;
    var pos=Math.max(0,Math.min(r.height-1,y-r.top));
    return Math.max(0,Math.min(fastCats.length-1,Math.floor(pos/r.height*fastCats.length)));
  }

  function marcarFast(indice,y){
    if(indice<0||!fastCats[indice])return;
    fastPendiente=fastCats[indice];
    var botones=fastNav.querySelectorAll('button');
    for(var i=0;i<botones.length;i++)botones[i].classList.toggle('active',i===indice);
    if(fastBubble){
      fastBubble.textContent=fastPendiente;
      var rr=fastNav.getBoundingClientRect();
      var br=fastBubble.getBoundingClientRect();
      fastBubble.style.right=(Math.max(36,window.innerWidth-rr.left+8))+'px';
      fastBubble.style.top=Math.max(78,Math.min(window.innerHeight-br.height-88,y-(br.height/2)))+'px';
      fastBubble.classList.add('on');
    }
  }

  function fastPointerDown(ev){
    if(!fastCats.length)return;
    fastDragging=true;fastPointerId=ev.pointerId;
    try{fastNav.setPointerCapture(ev.pointerId);}catch(e){}
    marcarFast(indiceDesdeY(ev.clientY),ev.clientY);
    try{if(navigator.vibrate)navigator.vibrate(5);}catch(e){}
    ev.preventDefault();
  }
  function fastPointerMove(ev){
    if(!fastDragging||ev.pointerId!==fastPointerId)return;
    marcarFast(indiceDesdeY(ev.clientY),ev.clientY);ev.preventDefault();
  }
  function aplicarCategoriaRapida(cat){
    if(!cat)return;
    try{
      if(typeof window.tiendaFiltrarCat==='function')window.tiendaFiltrarCat(cat);
      else if(typeof window.tiendaVerCategoriaPortada==='function')window.tiendaVerCategoriaPortada(cat);
    }catch(e){}
    setTimeout(function(){
      var d=document.getElementById('tienda-grid');if(d&&d.scrollIntoView)d.scrollIntoView({behavior:'auto',block:'start'});
    },20);
  }
  function fastPointerUp(ev){
    if(!fastDragging||ev.pointerId!==fastPointerId)return;
    fastDragging=false;fastPointerId=null;
    try{fastNav.releasePointerCapture(ev.pointerId);}catch(e){}
    if(fastBubble)fastBubble.classList.remove('on');
    var botones=fastNav.querySelectorAll('button');for(var i=0;i<botones.length;i++)botones[i].classList.remove('active');
    var cat=fastPendiente;fastPendiente='';aplicarCategoriaRapida(cat);ev.preventDefault();
  }
  function fastPointerCancel(){
    fastDragging=false;fastPointerId=null;fastPendiente='';if(fastBubble)fastBubble.classList.remove('on');
  }

  /* El action sheet profesional ya existe en professional-ux.js. Esta captura
     sólo bloquea el menú gris nativo antes de que Android lo dibuje; no corta
     la propagación, así el sheet de Amarango recibe el mismo contextmenu. */
  document.addEventListener('contextmenu',function(ev){
    if(!esAdmin())return;
    var img=ev.target&&ev.target.closest?ev.target.closest('#tienda-grid img,#modal-cuotas-body img'):null;
    if(!img)return;
    ev.preventDefault();
  },true);

  function programarUi(){
    if(rafUi)return;
    rafUi=requestAnimationFrame(function(){
      rafUi=0;
      decorarCopiarNombre();
      decorarMayoristasTarjeta();
      poblarMayoristas();
      pintarBannerMayorista();
      asegurarFastNav();
    });
  }

  function instalar(){
    inyectarEstilos();
    optimizarScroll();
    instalarRenderMayorista();
    if(typeof window.abrirCajon==='function'&&!window.abrirCajon.__aeMayorista){
      abrirCajonOriginal=window.abrirCajon;
      var abrir=function(){var r=abrirCajonOriginal.apply(this,arguments);setTimeout(programarUi,0);return r;};
      abrir.__aeMayorista=VERSION;abrir.__original=abrirCajonOriginal;window.abrirCajon=abrir;
    }
    programarUi();

    var grid=document.getElementById('tienda-grid');
    if(grid){
      var obs=new MutationObserver(programarUi);
      obs.observe(grid,{childList:true,subtree:true});
    }
    window.addEventListener('resize',function(){if(!rafUi)rafUi=requestAnimationFrame(function(){rafUi=0;posicionarFastNav();actualizarFastNavVisible();});},{passive:true});
    window.addEventListener('scroll',actualizarFastNavVisible,{passive:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',instalar,{once:true});
  else instalar();
})();
