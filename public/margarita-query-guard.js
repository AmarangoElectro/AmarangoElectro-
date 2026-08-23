/* AmarangoElectro · guardia de intención para Margarita
   Evita arrastrar productos de una categoría anterior cuando el usuario cambia de rubro.
*/
(function(){
  'use strict';
  var VERSION='mg-query-guard-2026-08-23-1';
  if(window.__MG_QUERY_GUARD__===VERSION)return;
  window.__MG_QUERY_GUARD__=VERSION;

  function norm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();}

  var INTENTS=[
    {k:'audio',re:/\b(audio|parlantes?|bafles?|torres?|home ?theater|sound ?bars?|soundbars?|barras? de sonido|karaoke|jbl|woofers?|subwoofers?|equipos? de musica)\b/},
    {k:'calefaccion',re:/\b(estufas?|calefactores?|caloventores?|radiadores?|vitroconvectores?|paneles? calefactores?|calefaccion)\b/},
    {k:'celulares',re:/\b(celulares?|celus?|smartphones?|telefonos?|iphones?|samsung|motorola|moto g|moto e|redmi|xiaomi|infinix|tecno)\b/},
    {k:'tv',re:/\b(tv|televisores?|smart ?tv|google ?tv|android ?tv|qled|oled|monitores?|proyectores?)\b/},
    {k:'refrigeracion',re:/\b(heladeras?|freezers?|congeladores?|exhibidoras?|dispenser|refrigeracion)\b/},
    {k:'coccion',re:/\b(cocinas?|hornos?|microondas?|freidoras?|air ?fryer|anafes?|parrillas?|grills?|pancheras?|campanas?|hornallas?)\b/},
    {k:'lavado',re:/\b(lavarropas|lavadoras?|secarropas|secadoras?|centrifugadoras?|lavado)\b/},
    {k:'climatizacion',re:/\b(aires? acondicionados?|ventiladores?|climatizadores?|aires? portatiles?)\b/},
    {k:'herramientas',re:/\b(taladros?|atornilladores?|amoladoras?|sierras?|llaves? de impacto|herramientas?|soldadoras?|compresores?)\b/},
    {k:'colchones',re:/\b(colchones?|sommiers?|sommier|camas?|espuma|resortes?)\b/},
    {k:'muebles',re:/\b(muebles?|mesas?|sillas?|placares?|roperos?|escritorios?)\b/},
    {k:'cargadores',re:/\b(cargadores?|cabezales?|cables? usb|tipo c|usb c|power ?banks?|fundas?|vidrios? templados?|adaptadores?)\b/}
  ];

  function intentOf(text){var t=norm(text);for(var i=0;i<INTENTS.length;i++)if(INTENTS[i].re.test(t))return INTENTS[i].k;return '';}

  function productIntent(p){
    var bolsa=norm((p&&p.nombre||'')+' '+(p&&p.categoria||'')+' '+(p&&p.caracteristicas||''));
    if(/audio|parlante|bafle|home theater|soundbar|barra de sonido|karaoke|jbl|woofer/.test(bolsa))return 'audio';
    if(/estufa|calefactor|caloventor|radiador|vitroconvector|calefaccion/.test(bolsa))return 'calefaccion';
    if(/celular|smartphone|iphone|samsung|motorola|moto g|moto e|redmi|xiaomi|infinix|tecno/.test(bolsa))return 'celulares';
    if(/tv y video|televisor|smart tv|google tv|android tv|qled|oled|monitor|proyector/.test(bolsa))return 'tv';
    if(/refriger|heladera|freezer|congelador|exhibidora|dispenser/.test(bolsa))return 'refrigeracion';
    if(/coccion|cocina|horno|microonda|freidora|air fryer|anafe|parrilla|grill|panchera|campana|hornalla/.test(bolsa))return 'coccion';
    if(/lavado|lavarropas|lavadora|secarropas|secadora|centrifugadora/.test(bolsa))return 'lavado';
    if(/climat|aire acondicionado|ventilador/.test(bolsa))return 'climatizacion';
    if(/herramient|taladro|atornillador|amoladora|sierra|llave de impacto|soldadora|compresor/.test(bolsa))return 'herramientas';
    if(/colchon|sommier|somier|cama|resorte|espuma/.test(bolsa))return 'colchones';
    if(/mueble|mesa|silla|placard|ropero|escritorio/.test(bolsa))return 'muebles';
    if(/cargador|cabezal|cable usb|tipo c|usb c|power bank|powerbank|funda|vidrio templado|adaptador/.test(bolsa))return 'cargadores';
    return '';
  }

  function visible(p){
    if(!p)return false;
    try{if(typeof window.tiendaEstaVisibleYConStock==='function')return !!window.tiendaEstaVisibleYConStock(p);}catch(e){}
    return p.visible!==false&&p.sinStock!==true&&p.ocultoTienda!==true;
  }

  function universo(){
    var out=[],seen=new Set();
    function add(p){
      if(!p||p.id==null||seen.has(String(p.id)))return;
      var precio=Number(p.venta||p.precio||0);if(!precio||!visible(p))return;
      seen.add(String(p.id));out.push(p);
    }
    try{(window.tiendaProductos||[]).forEach(add);}catch(e){}
    try{
      if(typeof window.cargarListaCelus==='function'){
        (window.cargarListaCelus()||[]).forEach(function(c,i){
          if(!c||!Number(c.precio)||c.ocultoTienda||c.sinStock)return;
          add({id:'celu_'+i,nombre:c.nombre||'',venta:Number(c.precio),categoria:'📱 Celulares',caracteristicas:c.caracteristicas||'',visible:true,foto:c.foto||''});
        });
      }
    }catch(e){}
    return out;
  }

  var STOP=new Set(['algo','hay','tenes','tenes','tienen','quiero','quisiera','busco','buscar','pasame','dame','mostrame','ver','uno','una','unos','unas','por','para','con','del','de','la','el','los','las','que','me','xfa','porfa']);
  function tokens(text){return norm(text).split(' ').filter(function(w){return w.length>2&&!STOP.has(w);}).map(function(w){return w.length>4&&/s$/.test(w)?w.slice(0,-1):w;});}

  function score(p,text,intent){
    var nom=norm(p.nombre||''),bolsa=norm((p.nombre||'')+' '+(p.categoria||'')+' '+(p.caracteristicas||''));
    var s=productIntent(p)===intent?50:0;
    tokens(text).forEach(function(w){if(bolsa.indexOf(w)>=0)s+=w.length>=5?8:5;if(nom.indexOf(w)>=0)s+=4;});
    return s;
  }

  function toApi(p){
    var u=new URL(location.href);u.search='';u.hash='';u.searchParams.set('prod',String(p.id));
    return {id:String(p.id),nombre:String(p.nombre||''),categoria:String(p.categoria||''),precio:Number(p.venta||p.precio||0),caracteristicas:String(p.caracteristicas||'').slice(0,280),url:u.toString()};
  }

  function candidatos(intent,text){
    return universo().filter(function(p){return productIntent(p)===intent;}).map(function(p){return {p:p,s:score(p,text,intent)};}).sort(function(a,b){return b.s-a.s||Number(a.p.venta||a.p.precio)-Number(b.p.venta||b.p.precio);}).slice(0,42).map(function(x){return toApi(x.p);});
  }

  function ultimoUsuario(ms){
    if(!Array.isArray(ms))return null;
    for(var i=ms.length-1;i>=0;i--){var m=ms[i];if(m&&m.rol!=='margarita'&&String(m.texto||'').trim())return {i:i,m:m};}
    return null;
  }

  function intentAnterior(ms,ultimoIdx){
    if(!Array.isArray(ms))return '';
    for(var i=ultimoIdx-1;i>=0;i--){var m=ms[i];if(!m||m.rol==='margarita')continue;var it=intentOf(m.texto||'');if(it)return it;}
    return '';
  }

  if(window.fetch&&window.fetch.__mgQueryGuard!==VERSION){
    var orig=window.fetch.bind(window);
    var wrapped=async function(input,init){
      try{
        var url=typeof input==='string'?input:(input&&input.url)||'';
        var method=String(init&&init.method||(input&&input.method)||'GET').toUpperCase();
        if(method==='POST'&&/\/api\/margarita(?:\?|$)/.test(url)&&init&&typeof init.body==='string'){
          var body=JSON.parse(init.body);var u=ultimoUsuario(body.mensajes||[]);
          if(u){
            var intent=intentOf(u.m.texto||'');
            if(intent){
              var prev=intentAnterior(body.mensajes||[],u.i);
              body.productos=candidatos(intent,u.m.texto||'');
              body.intencionCategoria=intent;
              if(prev&&prev!==intent){
                body.mensajes=[u.m];
                body.contextoReiniciado=true;
              }
              init=Object.assign({},init,{body:JSON.stringify(body)});
            }
          }
        }
      }catch(e){}
      return orig(input,init);
    };
    wrapped.__mgQueryGuard=VERSION;wrapped.__original=orig;window.fetch=wrapped;
  }
})();
