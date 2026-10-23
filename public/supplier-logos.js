/* Original supplier logos supplied by Max, 23/10/2026. Presentation only. */
(function(root){
  'use strict';
  var identities=[["electro-impacto", "#15803d", "#4ade80", 481, ["Electro Impacto", "ElectroImpacto", "ElectroImpacto.Flor"]], ["women", "#a21caf", "#e879f9", 481, ["Women", "Women Buenos Aires", "Women Bs As"]], ["stagliano", "#0369a1", "#38bdf8", 481, ["Stagliano", "Elektro Stagliano", "Electro Stagliano"]], ["one-si", "#7c3aed", "#a78bfa", 481, ["One SI", "One SI Mayorista"]], ["mega-electro", "#1d4ed8", "#60a5fa", 481, ["Mega", "Mega Electro", "Megaelectro"]], ["new-red", "#be123c", "#fb7185", 481, ["New Red", "Newred", "New Red San Justo"]], ["bruni", "#dc2626", "#f87171", 481, ["Distribuidora Bruni", "Bruni"]], ["red-lenic", "#1d4ed8", "#60a5fa", 481, ["Red Lenic", "Red Lenic (zona sur)", "Lenic", "Lenica"]], ["electrosmart", "#a16207", "#facc15", 481, ["Electrosmart", "Electrosmart Virrey", "Electrosmart Mayorista"]], ["sof-j", "#be185d", "#f472b6", 553, ["SofJDistribuidora", "SofJ", "Sof J", "Sof J Distribuidora"]], ["attain", "#0f766e", "#2dd4bf", 481, ["ATTAIN", "Attain (Importadora Mayorista)"]]];
  function key(name){return String(name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
  function escape(value){return String(value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  root.aeMayoristaLogoIdentity=function(name){
    var normalized=key(name);
    for(var i=0;i<identities.length;i++){
      var item=identities[i];
      if(item[4].some(function(alias){return key(alias)===normalized;}))return {key:item[0],light:item[1],dark:item[2],top:item[3],image:'/assets/suppliers/'+item[0]+'.png'};
    }
    return null;
  };
  root.aeMayoristaEtiquetaHtml=function(name){
    var identity=root.aeMayoristaLogoIdentity(name),label=escape(name);
    if(!identity)return '<span aria-hidden="true">🏪</span><span class="ae-supplier-name">'+label+'</span>';
    return '<span class="ae-supplier-logo" aria-hidden="true" style="--ae-logo-light:'+identity.light+';--ae-logo-dark:'+identity.dark+'"><img src="'+identity.image+'" alt="" loading="lazy" decoding="async" draggable="false" style="top:-'+(identity.top/691*100)+'%"></span><span class="ae-supplier-name" style="--ae-logo-light:'+identity.light+';--ae-logo-dark:'+identity.dark+'">'+label+'</span>';
  };
})(globalThis);
