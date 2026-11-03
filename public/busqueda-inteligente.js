/* AmarangoElectro - búsqueda relacionada no destructiva. Solo lectura y orden visual. */
(function(root){
'use strict';
var grupos=[
  ['licuadora','licuadoras','licuado','mixer','mixers','minipimer','batidora','batidoras','procesadora','procesador'],
  ['heladera','heladeras','refrigerador','refrigeradora','nevera','frigorifico'],
  ['lavarropas','lavarropa','lavadora','lavadoras','lavasecarropas'],
  ['colchon','colchones','sommier','somier','sommiers'],
  ['notebook','notebooks','laptop','laptops','netbook','computadora','computadoras'],
  ['celular','celulares','telefono','telefonos','smartphone','smartphones','movil'],
  ['televisor','televisores','television','tv','smarttv','smart tv','tele'],
  ['ventilador','ventiladores','turbo','circulador'],
  ['calefactor','estufa','estufas','caloventor','caloventores','calefaccion'],
  ['microondas','microonda','micro'],
  ['pava','pavas','hervidor','hervidora','pava electrica'],
  ['cafetera','cafeteras','cafe espresso'],
  ['placard','ropero','roperos','guardarropa'],
  ['parlante','parlantes','bafle','bafles','altavoz','altavoces'],
  ['auriculares','auricular','audifonos','headset','earbuds'],
  ['bicicleta','bicicletas','bici','bicis'],
  ['aspiradora','aspiradoras','aspirador'],
  ['freezer','congelador','congeladora'],
  ['sabanas','sabana','ropa de cama'],
  ['celular iphone','iphone'],
  ['impresora','impresoras'],
  ['tostadora','tostadoras','sandwichera','sandwicheras']
];
function norm(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();}
function tokens(s){return norm(s).split(' ').filter(Boolean);}
function distancia(a,b){
  if(a===b)return 0;
  if(Math.abs(a.length-b.length)>3)return 4;
  var prev=[],act=[],i,j;
  for(j=0;j<=b.length;j++)prev[j]=j;
  for(i=1;i<=a.length;i++){
    act[0]=i;
    for(j=1;j<=b.length;j++){
      act[j]=Math.min(prev[j]+1,act[j-1]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
    }
    var old=prev;prev=act;act=old;
  }
  return prev[b.length];
}
function parecido(a,b){
  if(a.length<4||b.length<4||/[0-9]/.test(a+b))return false;
  var tol=a.length>=8?2:1;
  if(Math.abs(a.length-b.length)>tol)return false;
  if(a[0]!==b[0])return false;
  if(distancia(a,b)<=tol)return true;
  // Corrección natural de dos letras vecinas invertidas (ej. samsnug).
  if(a.length===b.length)for(var i=0;i<a.length-1;i++){
    if(a[i]!==b[i]&&a[i]===b[i+1]&&a[i+1]===b[i]&&a.slice(0,i)===b.slice(0,i)&&a.slice(i+2)===b.slice(i+2))return true;
  }
  return false;
}
var gruposNorm=grupos.map(function(g){return g.map(norm);});
function grupoDe(w){
  var i,j,g;
  if(/[0-9]/.test(w))return null;
  for(i=0;i<gruposNorm.length;i++){
    g=gruposNorm[i];
    if(g.indexOf(w)>=0)return {items:g,corregir:null};
  }
  if(w.length<4)return null;
  for(i=0;i<gruposNorm.length;i++){
    g=gruposNorm[i];
    for(j=0;j<g.length;j++){
      if(g[j].length>=4 && (g[j].indexOf(w)===0&&w.length>=4)){
        return {items:g,corregir:null};
      }
    }
  }
  var best=null,bestDist=10;
  for(i=0;i<gruposNorm.length;i++){
    g=gruposNorm[i];
    for(j=0;j<g.length;j++){
      var alias=g[j];
      if(alias.indexOf(' ')>=0||!parecido(w,alias))continue;
      var d=distancia(w,alias);
      if(d<bestDist){bestDist=d;best={items:g,corregir:g[0]};}
    }
  }
  return best;
}
function preparar(texto){
  var q=norm(texto).slice(0,100),palabras=tokens(q).slice(0,9);
  return {q:q,palabras:palabras,partes:palabras.map(function(w){
    var grupo=grupoDe(w);
    return {w:w,grupo:grupo?grupo.items:[],corregir:grupo?grupo.corregir:null,numero:/[0-9]/.test(w)};
  })};
}
function singularSimilar(a,b){
  if(!a||!b||/[0-9]/.test(a+b))return false;
  return a.length>=4&&(a+'s'===b||b+'s'===a||a+'es'===b||b+'es'===a);
}
function enNombre(nombre,ts,w){
  if(ts.indexOf(w)>=0)return 3;
  if(w.length>=3 && ts.some(function(t){return t.indexOf(w)===0;}))return 2;
  if(w.length>=4 && ts.some(function(t){return t.indexOf(w)>0;}))return 1;
  if(w.length>=4 && ts.some(function(t){return singularSimilar(w,t);}))return 2;
  return 0;
}
function puntuacion(p,plan){
  if(!plan||!plan.palabras.length)return {valor:1,tipo:'directo'};
  if(!p||!p.nombre)return {valor:0,tipo:'ninguno'};
  var nombre=norm(p.nombre),nts=tokens(nombre),extras=[];
  if(p.marca)extras=extras.concat(tokens(p.marca));
  if(p.esCelu&&typeof root.marcaCelu==='function')extras=extras.concat(tokens(root.marcaCelu(p.nombre||'')));
  var ts=nts.concat(extras);
  if(nombre===plan.q)return {valor:200000,tipo:'directo'};
  var directo=true,puntos=0;
  for(var i=0;i<plan.partes.length;i++){
    var part=plan.partes[i],w=part.w,pts=0,modo='';
    if(part.numero){
      // Los modelos alfanuméricos jamás se corrigen por aproximación.
      if(ts.indexOf(w)>=0){pts=3200;modo='directo';}
      else if(w.length>=3&&ts.some(function(t){return t.indexOf(w)>=0&&/[0-9]/.test(t);})){pts=1800;modo='directo';}
      else return {valor:0,tipo:'ninguno'};
    }else{
      var match=enNombre(nombre,ts,w);
      if(match){pts=match===3?3000:match===2?1800:1250;modo='directo';}
      if(!pts&&w.length>=4){
        // Un error de escritura no cambia los números ni obliga a empezar por el nombre.
        for(var j=0;j<ts.length;j++){
          if(parecido(w,ts[j])){pts=850;modo='similar';break;}
        }
      }
      if(!pts&&part.grupo.length){
        for(var k=0;k<part.grupo.length;k++){
          var alias=part.grupo[k];
          if(alias===w)continue;
          var encontrado=alias.indexOf(' ')>=0
            ?(' '+nombre+' ').indexOf(' '+alias+' ')>=0
            :enNombre(nombre,ts,alias)>0;
          if(encontrado){pts=650;modo='similar';break;}
        }
      }
      if(!pts&&w.length>=4){
        var categoria=tokens(p.categoria||'');
        if(categoria.indexOf(w)>=0){pts=180;modo='similar';}
      }
      if(!pts&&part.grupo.length){
        var ct=tokens(p.categoria||'');
        if(part.grupo.some(function(alias){return alias.length>=5&&ct.indexOf(alias)>=0;})){pts=140;modo='similar';}
      }
      if(!pts)return {valor:0,tipo:'ninguno'};
    }
    if(modo!=='directo')directo=false;
    puntos+=pts;
  }
  if(nombre.indexOf(plan.q)>=0)puntos+=1000;
  if(nts.indexOf(plan.palabras[0])===0)puntos+=200;
  // Todo lo directo primero; los sinónimos, erratas y relacionados detrás.
  return {valor:(directo?100000:1000)+puntos,tipo:directo?'directo':'similar'};
}
function sugerir(plan,resultados){
  if(!plan||!plan.palabras.length)return '';
  var terms=plan.palabras.slice(),cambio=false;
  plan.partes.forEach(function(parte,i){
    if(parte.numero)return;
    if(parte.corregir && parte.corregir!==parte.w){
      terms[i]=parte.corregir;cambio=true;return;
    }
    var candidates=[];
    (resultados||[]).slice(0,12).forEach(function(p){
      var n=tokens(p.nombre||'');
      if(p.marca)n=n.concat(tokens(p.marca));
      candidates=candidates.concat(n);
    });
    if(candidates.indexOf(parte.w)>=0)return;
    var mejor='',mejorDist=8;
    candidates.forEach(function(t){
      if(!parecido(parte.w,t))return;
      var d=distancia(parte.w,t);
      if(d<mejorDist){mejor=t;mejorDist=d;}
    });
    if(mejor&&mejor!==parte.w){terms[i]=mejor;cambio=true;}
  });
  return cambio?terms.join(' '):'';
}
root.AEBusqueda={preparar:preparar,puntuar:puntuacion,sugerir:sugerir};
})(window);
