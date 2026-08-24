/* AmarangoElectro · ajustes comerciales públicos
   - quita contacto Selene del modal de producto
   - usa “Consultá con tu asesor”
   - asegura un acceso compacto y universal para compartir la tienda
*/
(function(){
  'use strict';
  var VERSION='cliente-ui-comercial-2026-08-24-1';
  if(window.__AE_CLIENTE_UI_COMERCIAL__===VERSION)return;
  window.__AE_CLIENTE_UI_COMERCIAL__=VERSION;
  var ICON='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="2.5"></circle><circle cx="6" cy="12" r="2.5"></circle><circle cx="18" cy="19" r="2.5"></circle><path d="m8.3 10.7 7.3-4.2M8.3 13.3l7.3 4.2"></path></svg>';

  function ls(k){try{return localStorage.getItem(k)||'';}catch(e){return '';}}
  function esCliente(){
    try{
      if(window.vistaPreviaCliente===true)return true;
      if(window.tiendaEsAdmin===true||window.adminUnlocked===true||window.revUnlocked===true)return false;
      if(document.body&&document.body.classList.contains('rol-admin'))return false;
      if(document.body&&document.body.classList.contains('rol-revendedor'))return false;
      return !(/admin|asesor|revendedor|vendedor/i.test(String(ls('ae_rol')||'')));
    }catch(e){return true;}
  }

  function toast(txt){
    try{if(typeof window.mostrarToast==='function'){window.mostrarToast(txt);return;}}catch(e){}
    var t=document.getElementById('ae-public-share-toast');
    if(!t){t=document.createElement('div');t.id='ae-public-share-toast';t.style.cssText='position:fixed;left:50%;bottom:92px;transform:translate(-50%,10px);z-index:19000;background:#0B2D6B;color:#fff;border-bottom:3px solid #FF7A00;border-radius:12px;padding:10px 13px;font:850 .68rem/1.2 system-ui;box-shadow:0 9px 28px rgba(0,0,0,.25);opacity:0;transition:.18s;pointer-events:none;max-width:86vw;text-align:center';document.body.appendChild(t);}
    t.textContent=txt;t.style.opacity='1';t.style.transform='translate(-50%,0)';clearTimeout(t.__tm);t.__tm=setTimeout(function(){t.style.opacity='0';t.style.transform='translate(-50%,10px)';},2000);
  }
  function copiar(txt){
    if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(txt);
    return new Promise(function(resolve,reject){try{var ta=document.createElement('textarea');ta.value=txt;ta.style.cssText='position:fixed;opacity:0;left:-9999px';document.body.appendChild(ta);ta.select();var ok=document.execCommand('copy');ta.remove();ok?resolve():reject();}catch(e){reject(e);}});
  }
  async function compartirTienda(){
    var url=new URL('/',window.location.origin).toString();
    var texto='🐝 *AmarangoElectro* — Todo para tu hogar, más fácil\n📱 Electrodomésticos, tecnología y mucho más.\n💳 Contado y financiación disponible.\n🛒 Entrá acá: '+url;
    if(navigator.share){
      try{await navigator.share({title:'AmarangoElectro',text:texto});return;}catch(e){if(e&&e.name==='AbortError')return;}
    }
    try{await copiar(texto);toast('✅ Enlace de la tienda copiado');}catch(e){toast('No pude abrir el menú para compartir.');}
  }

  function instalarShare(){
    var propio=document.getElementById('ae-share-store-public-btn');
    if(!esCliente()){if(propio)propio.remove();return;}
    var existente=document.getElementById('ae-share-store-btn');
    if(existente&&existente.offsetParent!==null){if(propio)propio.remove();return;}
    if(propio)return;
    var menu=document.querySelector('.hdr-menu-btn');
    var parent=menu&&menu.parentElement?menu.parentElement:document.querySelector('.header');
    if(!parent)return;
    var b=document.createElement('button');b.id='ae-share-store-public-btn';b.type='button';b.setAttribute('aria-label','Compartir tienda AmarangoElectro');b.setAttribute('title','Compartir tienda');b.innerHTML=ICON;
    b.style.cssText='position:absolute;top:11px;right:58px;z-index:7;width:38px;height:38px;border-radius:11px;background:rgba(255,255,255,.14);border:1.5px solid rgba(255,255,255,.28);color:#fff;display:flex;align-items:center;justify-content:center;padding:0;box-shadow:0 3px 10px rgba(0,0,0,.12);backdrop-filter:blur(4px);-webkit-tap-highlight-color:transparent;touch-action:manipulation';
    var svg=b.querySelector('svg');if(svg)svg.style.cssText='width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round';
    b.onclick=function(ev){ev.preventDefault();ev.stopPropagation();try{if(navigator.vibrate)navigator.vibrate(6);}catch(e){}compartirTienda();};
    parent.appendChild(b);
  }

  function ajustarContacto(){
    var modal=document.getElementById('modal-cuotas');if(!modal||getComputedStyle(modal).display==='none')return;
    var titulos=Array.from(modal.querySelectorAll('h1,h2,h3,.modal-title')).map(function(x){return String(x.textContent||'');}).join(' ');
    var txt=String(modal.textContent||'');
    if(!/consult[aá].*producto/i.test(titulos+' '+txt))return;
    Array.from(modal.querySelectorAll('button,a')).forEach(function(el){
      var t=String(el.textContent||'').trim();
      if(/^.*selene.*$/i.test(t)){el.remove();return;}
      if(/consult[aá] con tu vendedor/i.test(t)){
        el.textContent='🤝 Consultá con tu asesor';
        el.setAttribute('aria-label','Consultá con tu asesor');
      }
    });
  }

  function sync(){instalarShare();ajustarContacto();}
  var obs=null;
  function instalar(){sync();if(!obs&&document.body){obs=new MutationObserver(sync);obs.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});}setInterval(sync,1400);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',instalar,{once:true});else instalar();
})();