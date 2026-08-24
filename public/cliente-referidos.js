/* AmarangoElectro · referidos de clientes
   - guarda el código de quien recomendó la tienda
   - cada cliente registrado recibe su propio código
   - compartir tienda/productos puede conservar ese código sin exponer datos personales
*/
(function(){
  'use strict';
  var VERSION='cliente-referidos-2026-08-24-1';
  if(window.__AE_CLIENTE_REFERIDOS__===VERSION)return;
  window.__AE_CLIENTE_REFERIDOS__=VERSION;

  var K_IDENTIDAD='ae_cliente_identidad';
  var K_REF='ae_referido_por';
  var K_REF_HASTA='ae_referido_por_hasta';
  var HIDRATANDO=null;

  function ls(k){try{return localStorage.getItem(k)||'';}catch(e){return '';}}
  function setLs(k,v){try{if(v)localStorage.setItem(k,String(v));else localStorage.removeItem(k);}catch(e){}}
  function json(k){try{return JSON.parse(ls(k)||'{}')||{};}catch(e){return {};}}
  function setJson(k,v){try{localStorage.setItem(k,JSON.stringify(v||{}));}catch(e){}}
  function codigo(v){return String(v||'').toUpperCase().replace(/[^A-Z0-9-]/g,'').slice(0,28);}
  function tel(v){return String(v||'').replace(/\D+/g,'').slice(-15);}

  function capturarReferido(){
    var ref='';
    try{ref=codigo(new URL(window.location.href).searchParams.get('ref')||'');}catch(e){}
    if(!ref)return;
    setLs(K_REF,ref);setLs(K_REF_HASTA,Date.now()+30*86400000);
  }
  function referidoEntrante(){
    if(Number(ls(K_REF_HASTA)||0)<Date.now()){setLs(K_REF,'');setLs(K_REF_HASTA,'');return '';}
    return codigo(ls(K_REF));
  }
  function identidad(){return json(K_IDENTIDAD);}
  function codigoActual(){return codigo(identidad().codigoReferido);}

  async function hidratar(){
    var id=identidad();
    if(codigo(id.codigoReferido))return id;
    if(!tel(id.telefono))return id;
    if(HIDRATANDO)return HIDRATANDO;
    HIDRATANDO=(async function(){
      try{
        var r=await fetch('/api/cliente-identidad',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({accion:'buscar',telefono:tel(id.telefono)})});
        var d={};try{d=await r.json();}catch(e){}
        if(r.ok&&d&&d.ok&&d.cliente){
          id=Object.assign({},id,d.cliente,{actualizado:Date.now()});
          setJson(K_IDENTIDAD,id);
        }
      }catch(e){}
      HIDRATANDO=null;return id;
    })();
    return HIDRATANDO;
  }

  function decorarUrlSync(url){
    var c=codigoActual();if(!c)return String(url||'');
    try{var u=new URL(String(url||''),window.location.origin);u.searchParams.set('ref',c);return u.toString();}catch(e){return String(url||'');}
  }
  async function obtenerUrl(url){
    await hidratar();return decorarUrlSync(url);
  }

  capturarReferido();
  setTimeout(hidratar,900);
  window.AmarangoReferidos={
    referidoEntrante:referidoEntrante,
    codigoActual:codigoActual,
    hidratar:hidratar,
    decorarUrl:decorarUrlSync,
    obtenerUrl:obtenerUrl
  };
})();
