/* AmarangoElectro · fichas compactas de producto dentro de Margarita */
(function(){
  'use strict';
  var VERSION='mg-cards-2026-08-23-1';
  var INTENTOS=0;

  function agregarEstilos(){
    if(document.getElementById('mg-product-cards-style'))return;
    var s=document.createElement('style');
    s.id='mg-product-cards-style';
    s.textContent='\
.mg-product-stack{display:flex;flex-direction:column;gap:8px;margin-top:10px;width:100%;}\
.mg-product-card{background:#fff;border:1px solid #dfe6f0;border-radius:14px;padding:9px;box-shadow:0 4px 14px rgba(11,45,107,.09);overflow:hidden;}\
.mg-product-main{display:flex;gap:9px;align-items:flex-start;}\
.mg-product-img{width:54px;height:54px;flex:0 0 54px;border-radius:10px;object-fit:contain;background:#f7f9fc;border:1px solid #edf0f5;}\
.mg-product-img-placeholder{width:54px;height:54px;flex:0 0 54px;border-radius:10px;background:#eef4ff;color:#0B2D6B;display:flex;align-items:center;justify-content:center;font-size:1.25rem;border:1px solid #dce6f5;}\
.mg-product-info{min-width:0;flex:1;}\
.mg-product-name{font-size:.72rem;font-weight:900;color:#0B2D6B;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}\
.mg-product-cuota{font-size:.73rem;font-weight:900;color:#0a8a3f;margin-top:4px;line-height:1.2;}\
.mg-product-contado{font-size:.61rem;font-weight:700;color:#667085;margin-top:2px;}\
.mg-product-actions{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px;}\
.mg-product-btn{min-height:34px;border-radius:9px;border:0;font:900 .63rem/1 system-ui,-apple-system,Segoe UI,sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;padding:7px 6px;-webkit-tap-highlight-color:transparent;touch-action:manipulation;}\
.mg-product-btn:active{transform:scale(.97);}\
.mg-product-btn.ver{background:linear-gradient(135deg,#0B2D6B,#1e5bc8);color:#fff;}\
.mg-product-btn.share{background:#fff7ed;color:#c65300;border:1px solid #ffd0ad;}\
.mg-product-cat{width:100%;margin-top:6px;border:0;background:transparent;color:#45658e;font:800 .58rem/1.2 system-ui,-apple-system,Segoe UI,sans-serif;text-align:center;padding:4px;cursor:pointer;}\
@media(max-width:360px){.mg-product-img,.mg-product-img-placeholder{width:48px;height:48px;flex-basis:48px}.mg-product-name{font-size:.68rem}.mg-product-btn{font-size:.59rem}}\
';
    document.head.appendChild(s);
  }

  function fmt(n){
    try{return new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(Number(n)||0);}catch(e){return '$'+Math.round(Number(n)||0);}
  }

  function idDeUrl(raw){
    try{
      var limpio=String(raw||'').replace(/[),.;!?]+$/,'');
      var u=new URL(limpio,location.href);
      return u.searchParams.get('prod')||'';
    }catch(e){return '';}
  }

  function buscarProducto(id){
    if(id==null||id==='')return null;
    try{if(typeof window.buscarProd==='function'){var p=window.buscarProd(id);if(p)return p;}}catch(e){}
    var listas=[window.tiendaProductos,window.celus,window.productos];
    for(var l=0;l<listas.length;l++){
      var arr=listas[l];if(!Array.isArray(arr))continue;
      for(var i=0;i<arr.length;i++)if(String(arr[i]&&arr[i].id)===String(id))return arr[i];
    }
    return null;
  }

  function cuotaProducto(p){
    try{
      if(typeof window.armarCuotasLines==='function'){
        var ls=window.armarCuotasLines(Number(p.venta)||0,p);
        if(Array.isArray(ls)&&ls.length){
          var t=String(ls[ls.length-1]||'').replace(/^[^0-9]*?/,'').trim();
          if(t)return t;
        }
      }
    }catch(e){}
    try{if(typeof window.mejorCuotaTexto==='function')return String(window.mejorCuotaTexto(Number(p.venta)||0)||'');}catch(e){}
    return '';
  }

  function fotoProducto(p){return String((p&&(p.foto||p.imagen||p.image||p.fotoUrl||p.foto_url))||'');}
  function categoriaProducto(p){return String((p&&(p.categoria||p.cat||p.rubro))||'');}

  function cerrarY(fn){
    try{if(typeof window.margaritaCerrar==='function')window.margaritaCerrar();}catch(e){}
    setTimeout(function(){try{fn();}catch(e){}},240);
  }

  function verProducto(id){
    cerrarY(function(){
      if(typeof window.tiendaVerDetalle==='function'){window.tiendaVerDetalle(id);return;}
      var u=new URL(location.href);u.searchParams.set('prod',id);location.href=u.toString();
    });
  }

  function compartirProductoSeguro(id,p){
    try{if(typeof window.compartirProducto==='function'){window.compartirProducto(id);return;}}catch(e){}
    var u=new URL(location.href);u.searchParams.set('prod',id);
    var datos={title:(p&&p.nombre)||'AmarangoElectro',text:(p&&p.nombre)||'Mirá este producto en AmarangoElectro',url:u.toString()};
    try{if(navigator.share){navigator.share(datos);return;}}catch(e){}
    try{if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(u.toString());}catch(e){}
  }

  function irCategoria(cat){
    if(!cat)return;
    cerrarY(function(){
      if(typeof window.tiendaFiltrarCat==='function'){
        window.tiendaFiltrarCat(cat);
        setTimeout(function(){try{window.scrollTo({top:0,behavior:'smooth'});}catch(e){window.scrollTo(0,0);}},100);
      }
    });
  }

  function crearTarjeta(id,p){
    var card=document.createElement('div');card.className='mg-product-card';card.dataset.productId=String(id);
    var main=document.createElement('div');main.className='mg-product-main';
    var foto=fotoProducto(p);
    if(foto){var img=document.createElement('img');img.className='mg-product-img';img.src=foto;img.alt='';img.loading='lazy';main.appendChild(img);}else{var ph=document.createElement('div');ph.className='mg-product-img-placeholder';ph.textContent='📦';main.appendChild(ph);}
    var info=document.createElement('div');info.className='mg-product-info';
    var nom=document.createElement('div');nom.className='mg-product-name';nom.textContent=String(p.nombre||'Producto');info.appendChild(nom);
    var cuota=cuotaProducto(p);if(cuota){var q=document.createElement('div');q.className='mg-product-cuota';q.textContent=cuota;info.appendChild(q);}
    if(Number(p.venta)>0){var contado=document.createElement('div');contado.className='mg-product-contado';contado.textContent='Contado: '+fmt(p.venta);info.appendChild(contado);}
    main.appendChild(info);card.appendChild(main);

    var acts=document.createElement('div');acts.className='mg-product-actions';
    var ver=document.createElement('button');ver.type='button';ver.className='mg-product-btn ver';ver.textContent='Ver cuotas';ver.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();verProducto(id);});
    var sh=document.createElement('button');sh.type='button';sh.className='mg-product-btn share';sh.textContent='↗ Compartir';sh.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();compartirProductoSeguro(id,p);});
    acts.appendChild(ver);acts.appendChild(sh);card.appendChild(acts);

    var cat=categoriaProducto(p);
    if(cat){var bc=document.createElement('button');bc.type='button';bc.className='mg-product-cat';bc.textContent='Ver categoría · '+cat;bc.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();irCategoria(cat);});card.appendChild(bc);}
    return card;
  }

  function urlsProducto(texto){
    var urls=String(texto||'').match(/https?:\/\/[^\s]+/g)||[];
    var vistos=new Set(),items=[];
    urls.forEach(function(u){var id=idDeUrl(u);if(!id||vistos.has(String(id)))return;var p=buscarProducto(id);if(!p)return;vistos.add(String(id));items.push({id:id,p:p,url:u});});
    return items.slice(0,3);
  }

  function limpiarTexto(texto,items){
    var t=String(texto||'');
    items.forEach(function(x){t=t.split(x.url).join('');});
    return t.replace(/\s+([,.;:!?])/g,'$1').replace(/\n[ \t]+/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
  }

  function instalar(){
    agregarEstilos();
    if(typeof window.margaritaPintar!=='function'){
      if(INTENTOS++<80)setTimeout(instalar,120);
      return;
    }
    if(window.margaritaPintar.__mgProductCards===VERSION)return;
    var original=window.margaritaPintar;
    function pintarConCards(quien,texto){
      if(quien!=='margarita')return original.apply(this,arguments);
      var items=urlsProducto(texto);
      if(!items.length)return original.apply(this,arguments);
      var limpio=limpiarTexto(texto,items);
      var antes=document.querySelectorAll('#margarita-msgs .margarita-bot').length;
      var r=original.call(this,quien,limpio);
      setTimeout(function(){
        var bots=document.querySelectorAll('#margarita-msgs .margarita-bot');
        var b=bots.length?bots[bots.length-1]:null;
        if(!b||b.querySelector('.mg-product-stack'))return;
        var stack=document.createElement('div');stack.className='mg-product-stack';
        items.forEach(function(x){stack.appendChild(crearTarjeta(x.id,x.p));});
        b.appendChild(stack);
        var cont=document.getElementById('margarita-msgs');if(cont)cont.scrollTop=cont.scrollHeight;
      },antes===0?20:0);
      return r;
    }
    pintarConCards.__mgProductCards=VERSION;
    pintarConCards.__original=original;
    window.margaritaPintar=pintarConCards;
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',instalar,{once:true});else instalar();
  setTimeout(instalar,250);
})();
