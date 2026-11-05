/* AmarangoElectro — cotización privada con descuento 10%/15%, sólo Administración.
   No modifica catálogo, promociones, stock ni precios persistidos.
   El mensaje recuerda que el precio especial no aparece en el catálogo público. */
(function(){
'use strict';
if(window.__aeAdminShareDiscountV1)return;
window.__aeAdminShareDiscountV1=true;
var layer=null,chosen=10,currentId=null,scanScheduled=false;
function admin(){
 return window.tiendaEsAdmin===true&&window.adminUnlocked===true
   &&window.vistaPreviaCliente!==true&&window.vistaPreviaAsesor!==true;
}
function elem(tag,cls,txt){
 var e=document.createElement(tag);
 if(cls)e.className=cls;
 if(txt!==undefined)e.textContent=txt;
 return e;
}
function button(text,fn,cls){var b=elem('button',cls,text);b.type='button';b.addEventListener('click',fn);return b;}
function money(v){
 if(typeof window.fmt==='function')return window.fmt(v);
 return '$'+Math.round(v).toLocaleString('es-AR');
}
function product(id){
 return typeof window.buscarProd==='function'?window.buscarProd(id):null;
}
function quote(p,pct){
 var data=(typeof window.tiendaDatosPrecio==='function')?window.tiendaDatosPrecio(p):null;
 var base=Math.round(Number(data&&data.contado)||Number(p.venta)||0);
 if(!(base>0)||![10,15].includes(pct))return null;
 var special=Math.round(base*(100-pct)/100);
 var three=null;
 var promo=typeof window.promoMadreDatos==='function'?window.promoMadreDatos(p):null;
 if(promo&&Number(promo.cuota)>0){
  var listed3=Math.round(Number(promo.cuota));
  three={listed:listed3,special:Math.round(listed3*(100-pct)/100)};
 }else if(Number(p.sinInteres)===3){
  // Misma cuota de catálogo antes de aplicar el beneficio individual.
  var listed3B=Math.round(base/3/1000)*1000;
  if(listed3B>0)three={listed:listed3B,special:Math.round(listed3B*(100-pct)/100)};
 }
 var link=location.origin+location.pathname+'?prod='+encodeURIComponent(String(p.id));
 var name=String(p.nombre||'Producto').trim();
 var lines=[
  '🐝 *OFERTA ESPECIAL AMARANGOELECTRO*',
  '*'+name.toUpperCase()+'*','',
  '🏷️ *DESCUENTO EXCLUSIVO DEL '+pct+'%*',
  'Precio de lista: ~'+money(base)+'~',
  '✅ *Contado especial: '+money(special)+'*',
  '💰 Ahorrás '+money(base-special)
 ];
 if(three){
  lines.push('', '🎉 *3 CUOTAS SIN INTERÉS CON DESCUENTO*',
   '3 cuotas de *'+money(three.special)+'*',
   '(Precio promocional por cuota antes: '+money(three.listed)+')');
 }else{
  lines.push('', '💳 Consultanos por financiación para esta cotización especial.');
 }
 lines.push('', '📌 Precio especial ofrecido por Administración. En el catálogo puede figurar el precio regular.',
  '🛒 Mirá el producto: '+link,'','@AmarangoElectro 🐝');
 return {name:name,base:base,special:special,saved:base-special,three:three,percent:pct,
  text:lines.join('\n')};
}
function makeStyle(){
 if(document.getElementById('ae-admin-discount-style'))return;
 var css=elem('style');css.id='ae-admin-discount-style';
 css.textContent=[
 '#tienda-grid .prod-card .ae-admin-discount-entry{display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;min-height:38px!important;padding:8px 7px!important;margin:0 0 6px!important;box-sizing:border-box!important;border-radius:10px!important;border:1.5px solid #f6aa4c!important;background:#fff2df!important;color:#8b460c!important;font-family:inherit!important;font-size:.69rem!important;line-height:1.3!important;font-weight:850!important;cursor:pointer!important;gap:6px!important;flex-shrink:0!important}',
 'body.oscuro #tienda-grid .prod-card .ae-admin-discount-entry{background:#3d2a21!important;border-color:#e1914a!important;color:#ffe1bf!important}',
 '.ae-discount-layer[hidden]{display:none!important}.ae-discount-layer{position:fixed;inset:0;z-index:8100;display:flex;align-items:center;justify-content:center;padding:14px;background:rgba(4,9,22,.73);backdrop-filter:blur(4px)}',
 '.ae-discount-dialog{width:min(100%,440px);max-height:92dvh;overflow-y:auto;overscroll-behavior:contain;background:#fff;color:#152544;border:1px solid #f4c48b;border-radius:20px;padding:18px;box-sizing:border-box;font-family:Inter,system-ui,sans-serif;box-shadow:0 24px 65px #0006}',
 '.ae-discount-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.ae-discount-title{font-size:1.05rem;font-weight:900;color:#0b2d6b}',
 '.ae-discount-close{width:34px;height:34px;flex-shrink:0;border-radius:10px;border:1px solid #d6dce6;background:#f4f6fa;color:#152544;font-size:1.05rem;cursor:pointer}',
 '.ae-discount-intro{font-size:.76rem;color:#60708a;margin:8px 0 12px;line-height:1.45;overflow-wrap:anywhere}',
 '.ae-discount-picks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:10px 0}',
 '.ae-discount-pick{min-height:47px;border:1.5px solid #f0c8a1;border-radius:12px;background:#fff8f1;color:#915020;font-family:inherit;font-size:.9rem;font-weight:900;cursor:pointer}',
 '.ae-discount-pick[aria-pressed="true"]{background:#ff7a00;color:#fff;border-color:#e66d00}',
 '.ae-discount-preview{background:#f8f9fc;border:1px solid #e5e8ef;border-radius:12px;padding:14px;margin:12px 0;font-size:.8rem}',
 '.ae-discount-preview strong{font-size:1.15rem;color:#16643e}.ae-discount-price-old{color:#808998;text-decoration:line-through}',
 '.ae-discount-price-new{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:8px 0}',
 '.ae-discount-sub{font-size:.72rem;color:#58677f;line-height:1.4;margin-top:6px}',
 '.ae-discount-alert{font-size:.71rem;color:#a35204;font-weight:700;background:#fff4e7;border-radius:9px;padding:9px;margin-top:9px}',
 '.ae-discount-actions{display:grid;grid-template-columns:1fr 1.25fr;gap:8px;margin-top:12px}',
 '.ae-discount-actions button{min-height:43px;border-radius:10px;font-family:inherit;font-size:.76rem;font-weight:850;cursor:pointer}',
 '.ae-discount-copy{border:1px solid #d0d8e4;background:#fff;color:#152544}',
 '.ae-discount-send{border:1px solid #ff7a00;background:#ff7a00;color:#fff}',
 'body.oscuro .ae-discount-dialog{background:#241915;color:#ffefe1;border-color:#875331}',
 'body.oscuro .ae-discount-title{color:#ffcfab}body.oscuro .ae-discount-intro,body.oscuro .ae-discount-sub{color:#d4bbaa}',
 'body.oscuro .ae-discount-preview{background:#30241e;border-color:#6c4735}body.oscuro .ae-discount-price-old{color:#c2a89a}',
 'body.oscuro .ae-discount-pick{background:#32241d;border-color:#9e6536;color:#ffd5a6}body.oscuro .ae-discount-pick[aria-pressed="true"]{background:#ff7a00;color:#fff}',
 'body.oscuro .ae-discount-close,body.oscuro .ae-discount-copy{background:#3b2d26;border-color:#8b6c58;color:#fff3e9}',
 '@media(prefers-reduced-motion:reduce){.ae-discount-layer{backdrop-filter:none}}'
 ].join('\n');
 document.head.appendChild(css);
}
function close(){if(layer){layer.hidden=true;layer.replaceChildren();}currentId=null;}
function open(id){
 if(!admin())return;
 var p=product(id);if(!p)return;
 var check=quote(p,10);
 if(!check){if(typeof window.mostrarToast==='function')window.mostrarToast('No hay precio de contado válido para cotizar');return;}
 makeStyle();currentId=String(id);chosen=10;
 // Al invocar desde el menú existente de Compartir, cerrar la capa anterior.
 var original=document.getElementById('modal-cuotas');if(original)original.style.display='none';
 if(!layer){
  layer=elem('div','ae-discount-layer');layer.hidden=true;layer.addEventListener('click',function(e){if(e.target===layer)close();});
  document.body.appendChild(layer);
 }
 layer.replaceChildren();layer.hidden=false;
 var card=elem('div','ae-discount-dialog');card.setAttribute('role','dialog');
 card.setAttribute('aria-modal','true');card.setAttribute('aria-label','Compartir producto con descuento');
 var h=elem('div','ae-discount-head');
 h.appendChild(elem('div','ae-discount-title','🏷️ Compartir con descuento'));
 h.appendChild(button('✕',close,'ae-discount-close'));card.appendChild(h);
 card.appendChild(elem('div','ae-discount-intro','Descuento privado para '+check.name+'. No cambia el precio ni las cuotas publicadas en la tienda.'));
 var picks=elem('div','ae-discount-picks');card.appendChild(picks);
 var preview=elem('div','ae-discount-preview');card.appendChild(preview);
 var info=elem('p','ae-discount-sub','Podés revisar el precio y copiar el mensaje o compartirlo con tu cliente. El enlace abre la ficha con el precio regular.');
 card.appendChild(info);
 var actions=elem('div','ae-discount-actions');
 actions.appendChild(button('📋 Copiar texto',function(){copy()},'ae-discount-copy'));
 actions.appendChild(button('📤 Enviar / compartir',function(){send()},'ae-discount-send'));
 card.appendChild(actions);layer.appendChild(card);
 var control=[];
 [10,15].forEach(function(n){
  var choice=button('−'+n+'% de descuento',function(){chosen=n;paint()},'ae-discount-pick');
  choice.setAttribute('aria-pressed',String(n===10));picks.appendChild(choice);control.push(choice);
 });
 function paint(){
  var q=quote(p,chosen);if(!q)return;
  control.forEach(function(b,i){b.setAttribute('aria-pressed',String([10,15][i]===chosen));});
  preview.replaceChildren();
  preview.appendChild(elem('div','ae-discount-sub','Precio de contado publicado'));
  preview.appendChild(elem('div','ae-discount-price-old',money(q.base)));
  var line=elem('div','ae-discount-price-new');
  line.appendChild(elem('span','','Precio con '+chosen+'% OFF'));
  line.appendChild(elem('strong','',money(q.special)));preview.appendChild(line);
  preview.appendChild(elem('div','ae-discount-sub','Ahorro para el cliente: '+money(q.saved)));
  if(q.three)preview.appendChild(elem('div','ae-discount-alert','🎉 3 cuotas promocionales con descuento: '+money(q.three.special)+' cada una (antes '+money(q.three.listed)+').'));
  else preview.appendChild(elem('div','ae-discount-sub','Las cuotas se consultan por separado; no se inventan planes.'));
  var cost=Number(p.costo)||0;
  if(cost>0&&q.special<cost)preview.appendChild(elem('div','ae-discount-alert','⚠️ Atención: el precio especial queda por debajo del costo cargado.'));
 }
 async function copy(){
  if(!admin()||currentId!==String(id))return;
  var q=quote(p,chosen);if(!q)return;
  try{
   if(navigator.clipboard&&navigator.clipboard.writeText)await navigator.clipboard.writeText(q.text);
   else{
    var ta=elem('textarea');ta.value=q.text;ta.style.cssText='position:fixed;left:-9999px;top:-9999px';
    document.body.appendChild(ta);ta.focus();ta.select();
    var ok=document.execCommand('copy');ta.remove();if(!ok)throw Error('copy');
   }
   if(typeof window.mostrarToast==='function')window.mostrarToast('✅ Mensaje con descuento copiado');
  }catch(e){if(typeof window.mostrarToast==='function')window.mostrarToast('⚠️ No se pudo copiar. Probá compartir.');}
 }
 async function send(){
  if(!admin()||currentId!==String(id))return;
  var q=quote(p,chosen);if(!q)return;
  close();
  try{
   if(p.foto&&navigator.share&&typeof window.tiendaBlobParaCompartir==='function'){
    try{
     var blob=await window.tiendaBlobParaCompartir(p);
     if(typeof window.tiendaArchivoCompartible==='function'){
      var file=window.tiendaArchivoCompartible(blob,p);
      if(navigator.canShare&&navigator.canShare({files:[file]})){
       await navigator.share({title:q.name,text:q.text,files:[file]});
       return;
      }
     }
    }catch(e){if(e&&e.name==='AbortError')return;}
   }
   if(navigator.share){await navigator.share({title:q.name,text:q.text});return;}
   if(typeof window.compartirSoloTexto==='function'){window.compartirSoloTexto(q.text);return;}
   window.open('https://wa.me/?text='+encodeURIComponent(q.text),'_blank','noopener');
  }catch(e){
   if(e&&e.name==='AbortError')return;
   if(typeof window.compartirSoloTexto==='function')window.compartirSoloTexto(q.text);
  }
 }
 paint();
}
function inject(){
 if(!document.body)return;
 if(!admin()){
  document.querySelectorAll('.ae-admin-discount-entry').forEach(function(b){b.remove();});
  if(layer&&!layer.hidden)close();
  return;
 }
 makeStyle();
 var grid=document.getElementById('tienda-grid');if(!grid)return;
 grid.querySelectorAll('.prod-card[id^="card-"]').forEach(function(card){
  if(card.querySelector('.ae-admin-discount-entry'))return;
  var shareRow=card.querySelector('.ae-share-social-row');
  if(!shareRow)return;
  var id=card.id.slice(5);if(!id)return;
  var p=product(id);if(!p||!quote(p,10))return;
  var b=button('🏷️ Enviar con descuento (10% o 15%)',function(e){
   e.preventDefault();e.stopPropagation();open(id);
  },'ae-admin-discount-entry');
  b.title='Enviar esta ficha con descuento privado del 10% o 15%';
  b.setAttribute('aria-label','Compartir '+String(p.nombre||'producto')+' con 10 o 15 por ciento de descuento');
  // Última opción visible de la tarjeta; debajo de todas las herramientas de administración.
  card.appendChild(b);
 });
}
function schedule(){
 if(scanScheduled)return;scanScheduled=true;
 setTimeout(function(){scanScheduled=false;inject();},100);
}
function start(){
 makeStyle();inject();
 var grid=document.getElementById('tienda-grid');
 if(grid)new MutationObserver(schedule).observe(grid,{childList:true,subtree:true});
 new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['class']});
 window.addEventListener('focus',schedule);
 document.addEventListener('keydown',function(e){if(e.key==='Escape'&&layer&&!layer.hidden){e.preventDefault();close();}});
}
window.AEDescuentoAdmin={abrir:open};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();