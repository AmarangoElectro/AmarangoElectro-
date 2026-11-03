/* Anotación informativa del porcentaje de compra por transferencia, por mayorista.
 * Inicia en 5%, sólo Administración y este dispositivo. NO afecta cálculos comerciales. */
(function(root){
'use strict';
var KEY='amarango_mayoristas_porcentajes_v1', cache=null, returnFocus=null;
function key(name){
  var identity=typeof root.aeMayoristaLogoIdentity==='function'?root.aeMayoristaLogoIdentity(name):null;
  if(identity)return identity.key;
  return String(name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').replace(/\s+/g,' ').trim();
}
function getMap(){
  if(cache)return cache;
  var result=Object.create(null);
  try{
    var stored=JSON.parse(root.localStorage.getItem(KEY)||'{}');
    if(stored&&typeof stored==='object'&&!Array.isArray(stored)){
      Object.keys(stored).forEach(function(k){
        var n=Number(stored[k]);
        if(stored[k]!==null&&stored[k]!==''&&Number.isFinite(n)&&n>=0&&n<=100)result[k]=n;
      });
    }
  }catch(e){}
  cache=result;
  return result;
}
function value(name){
  var data=getMap(),k=key(name);
  return Object.prototype.hasOwnProperty.call(data,k)?data[k]:5;
}
function label(name){
  return value(name).toLocaleString('es-AR',{maximumFractionDigits:2})+'%';
}
root.aeMayoristaPctTexto=label;
function update(name){
  var wanted=key(name);
  document.querySelectorAll('#tienda-grid .ae-supplier-percent').forEach(function(button){
    if(key(button.dataset.supplierName)===wanted)button.textContent=label(name)+' ✎';
  });
}
function edit(name,trigger){
  if(root.tiendaEsAdmin!==true||root.vistaPreviaCliente===true||!name)return;
  var d=document.getElementById('ae-supplier-pct-dialog');
  if(!d){
    d=document.createElement('dialog');
    d.id='ae-supplier-pct-dialog';
    d.setAttribute('aria-labelledby','ae-pct-title');
    d.innerHTML='<form novalidate>'
      +'<h3 id="ae-pct-title">✎ Recargo por transferencia</h3>'
      +'<p id="ae-pct-name"></p>'
      +'<label for="ae-pct-input">Porcentaje que cobra el mayorista (%)<input id="ae-pct-input" type="number" inputmode="decimal" min="0" max="100" step="0.01" required></label>'
      +'<p>Solo anotación para Administración sobre el costo de pagar al mayorista por transferencia. No se aplica a costos, precios, cuotas ni comisiones. Guardado en este dispositivo.</p>'
      +'<p id="ae-pct-message" role="status" aria-live="polite"></p>'
      +'<div class="ae-pct-actions"><button type="button" id="ae-pct-cancel">Cancelar</button><button type="submit">Guardar</button></div></form>';
    document.body.appendChild(d);
    d.querySelector('#ae-pct-cancel').addEventListener('click',function(){d.close();});
    d.addEventListener('click',function(e){if(e.target===d)d.close();});
    d.addEventListener('close',function(){
      if(returnFocus&&returnFocus.isConnected)returnFocus.focus({preventScroll:true});
      returnFocus=null;
    });
    d.querySelector('form').addEventListener('submit',function(e){
      e.preventDefault();
      if(root.tiendaEsAdmin!==true||root.vistaPreviaCliente===true){d.close();return;}
      var input=d.querySelector('#ae-pct-input');
      var raw=String(input.value||'').trim().replace(',','.'),number=Number(raw);
      if(!/^\d{1,3}(?:\.\d{1,2})?$/.test(raw)||!Number.isFinite(number)||number>100){
        d.querySelector('#ae-pct-message').textContent='Ingresá un valor de 0 a 100, con hasta dos decimales.';
        input.focus();return;
      }
      var next=Object.assign(Object.create(null),getMap());
      next[key(d.dataset.supplierName)]=number;
      try{root.localStorage.setItem(KEY,JSON.stringify(next));}
      catch(error){d.querySelector('#ae-pct-message').textContent='No se pudo guardar en este dispositivo.';return;}
      cache=next;
      update(d.dataset.supplierName);
      if(typeof root.mostrarToast==='function')root.mostrarToast('✅ '+d.dataset.supplierName+': '+label(d.dataset.supplierName));
      d.close();
    });
  }
  returnFocus=trigger||null;
  d.dataset.supplierName=name;
  d.querySelector('#ae-pct-name').textContent=name;
  d.querySelector('#ae-pct-message').textContent='';
  d.querySelector('#ae-pct-input').value=String(value(name));
  if(!d.open)d.showModal();
  d.querySelector('#ae-pct-input').focus({preventScroll:true});
}
root.aeEditarPorcentajeMayorista=edit;
document.addEventListener('click',function(e){
  var button=e.target.closest&&e.target.closest('#tienda-grid .ae-supplier-percent');
  if(!button)return;
  e.preventDefault();e.stopPropagation();
  edit(button.dataset.supplierName,button);
});
document.addEventListener('dblclick',function(e){
  if(e.target.closest&&e.target.closest('#tienda-grid .ae-supplier-percent')){
    e.preventDefault();e.stopPropagation();
  }
},true);
})(window);
