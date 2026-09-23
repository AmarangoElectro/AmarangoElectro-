/* AmarangoElectro · identidad confiable del asesor para Margarita */
(function(){
  'use strict';
  var V='asesor-coach-auth-2026-08-23-1';if(window.__AE_COACH_AUTH__===V)return;window.__AE_COACH_AUTH__=V;
  var prev=window.fetch.bind(window);
  window.fetch=async function(input,init){
    try{
      var url=typeof input==='string'?input:(input&&input.url)||'';
      var method=String(init&&init.method||(input&&input.method)||'GET').toUpperCase();
      if(method==='POST'&&/\/api\/margarita(?:\?|$)/.test(url)){
        var tok='';try{tok=localStorage.getItem('ae_asesor_token_v2')||'';}catch(e){}
        if(tok){
          var headers=new Headers(init&&init.headers||(input&&input.headers)||{});headers.set('authorization','Bearer '+tok);
          var body=init&&typeof init.body==='string'?JSON.parse(init.body):null;
          if(body){
            body.rol='asesor';
            try{body.nombre=localStorage.getItem('ae_nombre_asesor')||body.nombre||'';}catch(e){}
            init=Object.assign({},init||{},{headers:headers,body:JSON.stringify(body)});
          }else init=Object.assign({},init||{},{headers:headers});
        }
      }
    }catch(e){}
    return prev(input,init);
  };
  window.fetch.__aeCoachAuth=V;window.fetch.__anterior=prev;
})();
