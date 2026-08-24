/* AmarangoElectro · puente seguro al cerebro V18 de Margarita
   Fase 1: SOLO asesores. Clientes y Admin siguen usando el backend estable actual.
   Si V18 falla, cae automáticamente al /api/margarita local.
*/
(function(){
  'use strict';
  var VERSION='mg-v18-bridge-20260824-1';
  if(window.__MG_V18_BRIDGE__===VERSION)return;
  window.__MG_V18_BRIDGE__=VERSION;

  var CEREBRO='https://amara.max-huracan73.workers.dev/chat';
  var originalFetch=window.fetch.bind(window);
  var K_SES='ae_mg_v18_sesion';

  function ls(k){try{return localStorage.getItem(k)||'';}catch(e){return'';}}
  function ss(k){try{return sessionStorage.getItem(k)||'';}catch(e){return'';}}
  function setSs(k,v){try{sessionStorage.setItem(k,v);}catch(e){}}
  function delSs(k){try{sessionStorage.removeItem(k);}catch(e){}}
  function nombreCorto(n){n=String(n||'').trim();return n?n.split(/\s+/)[0].slice(0,40):'';}

  function asesorActual(){
    var nombre=nombreCorto(ls('ae_nombre_asesor'));
    var id=String(ls('ae_asesor_id')||nombre||'asesor').replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,50);
    return {nombre:nombre,id:id||'asesor'};
  }

  function memoryKey(){return 'ae_mg_v18_mem_'+asesorActual().id;}
  function leerMemoria(){
    try{var v=ss(memoryKey());return v?JSON.parse(v):{};}catch(e){return{};}
  }
  function guardarMemoria(m){try{setSs(memoryKey(),JSON.stringify(m&&typeof m==='object'?m:{}));}catch(e){}}

  function sesion(){
    var s=ss(K_SES);
    if(/^[a-zA-Z0-9_-]{8,80}$/.test(s))return s;
    try{s='asesor_'+(crypto.randomUUID?crypto.randomUUID():Date.now()+'_'+Math.random().toString(36).slice(2));}catch(e){s='asesor_'+Date.now()+'_'+Math.random().toString(36).slice(2);}
    s=String(s).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,80);
    setSs(K_SES,s);return s;
  }

  function ultimoMensajeUsuario(ms){
    for(var i=ms.length-1;i>=0;i--){
      var r=String(ms[i]&&ms[i].rol||'').toLowerCase();
      if(r!=='margarita'&&r!=='amara')return {indice:i,texto:String(ms[i]&&ms[i].texto||'')};
    }
    return {indice:-1,texto:''};
  }

  function historialV18(ms,indiceActual){
    return ms.filter(function(_,i){return i!==indiceActual;}).slice(-8).map(function(t){
      var r=String(t&&t.rol||'').toLowerCase();
      return {rol:(r==='margarita'||r==='amara')?'amara':'cliente',texto:String(t&&t.texto||'')};
    }).filter(function(t){return t.texto.trim();});
  }

  function semillaMemoria(){
    var m=leerMemoria();
    var a=asesorActual();
    m.sectorRol='asesor';m.rol='equipo';m.sesionId=sesion();
    if(a.nombre)m.nombre=a.nombre;
    return m;
  }

  function urlProducto(id){
    try{var u=new URL(location.href);u.hash='';u.search='';u.searchParams.set('prod',String(id));return u.toString();}catch(e){return location.origin+'/?prod='+encodeURIComponent(String(id));}
  }

  function textoConLinks(data){
    var texto=String(data&&data.respuesta||'').trim()||'No pude responderte ahora 🐝 Probá de nuevo en un ratito.';
    var productos=Array.isArray(data&&data.productos)?data.productos:[];
    var ids=[];
    productos.slice(0,3).forEach(function(p){var id=p&&p.id;if(id!==undefined&&id!==null&&String(id)!=='')ids.push(urlProducto(id));});
    return ids.length?texto+'\n\n'+ids.join('\n'):texto;
  }

  function esApiMargarita(url,metodo){return metodo==='POST'&&/\/api\/margarita(?:\?|$)/.test(String(url||''));}

  async function pedirV18(body){
    var ms=Array.isArray(body.mensajes)?body.mensajes:[];
    var actual=ultimoMensajeUsuario(ms);
    if(!actual.texto.trim())throw new Error('mensaje-vacio');
    var payload={
      mensaje:actual.texto,
      historial:historialV18(ms,actual.indice),
      memoria:semillaMemoria(),
      imagen:'',
      contexto:{integrado:true,rol:'asesor',sesion_id:sesion()}
    };
    var r=await originalFetch(CEREBRO,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),cache:'no-store'});
    if(!r.ok)throw new Error('v18-http-'+r.status);
    var data=await r.json();
    if(!data||typeof data!=='object')throw new Error('v18-json');
    if(data.memoria)guardarMemoria(data.memoria);
    window.__mgV18PendingCopy=String(data.mensaje_copiable||'');
    window.__mgV18LastData=data;
    return new Response(JSON.stringify({respuesta:textoConLinks(data),v18:true}),{status:200,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
  }

  var puente=async function(input,init){
    var url=typeof input==='string'?input:(input&&input.url)||'';
    var metodo=String(init&&init.method||(input&&input.method)||'GET').toUpperCase();
    if(!esApiMargarita(url,metodo)||!init||typeof init.body!=='string')return originalFetch(input,init);
    try{
      var body=JSON.parse(init.body);
      // El cerebro V18 se habilita únicamente si el sector real ya es asesor.
      // Un nombre escrito en el chat nunca alcanza para entrar acá.
      if(String(body&&body.rol||'')!=='asesor')return originalFetch(input,init);
      return await pedirV18(body);
    }catch(e){
      console.warn('Margarita V18 fallback',String(e&&e.message||e));
      window.__mgV18PendingCopy='';
      return originalFetch(input,init);
    }
  };

  puente.__mgV18Bridge=VERSION;
  puente.__original=originalFetch;
  window.fetch=puente;

  window.margaritaV18NuevaConsulta=function(){
    delSs(memoryKey());
    window.__mgV18PendingCopy='';
    window.__mgV18LastData=null;
    return true;
  };
})();
