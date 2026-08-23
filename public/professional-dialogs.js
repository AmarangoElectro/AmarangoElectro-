/* AmarangoElectro · diálogos profesionales para confirm/prompt
   Envuelve acciones conocidas y conserva su lógica original mediante replay. */
(function(){
  'use strict';
  var VERSION='ae-pro-dialogs-2026-08-23-1';
  if(window.__AE_PRO_DIALOGS__===VERSION)return;
  window.__AE_PRO_DIALOGS__=VERSION;

  var overlay=null,msgEl=null,inputWrap=null,inputEl=null,actions=null,titleEl=null,kicker=null;
  var resolverActual=null;

  function vibrar(ms){
    try{if(navigator.vibrate&&window.matchMedia&&window.matchMedia('(pointer:coarse)').matches)navigator.vibrate(ms||6);}catch(e){}
  }

  function crear(){
    if(overlay||!document.body)return;
    overlay=document.createElement('div');
    overlay.id='ae-pro-question';
    overlay.className='ae-pro-overlay';
    overlay.innerHTML=''
      +'<div class="ae-pro-dialog" role="dialog" aria-modal="true" aria-labelledby="ae-pro-question-title">'
      +'<div class="ae-pro-dialog-head">'
      +'<div class="ae-pro-brand-badge"><img src="/icon.png" alt=""></div>'
      +'<div class="ae-pro-dialog-kicker">Acción de AmarangoElectro</div>'
      +'<div id="ae-pro-question-title" class="ae-pro-dialog-title">Confirmar acción</div>'
      +'<div class="ae-pro-dialog-accent"></div></div>'
      +'<div class="ae-pro-dialog-body">'
      +'<div class="ae-pro-question-message"></div>'
      +'<div class="ae-pro-input-wrap" style="display:none"><input class="ae-pro-input ae-allow-select" autocomplete="off"></div>'
      +'</div>'
      +'<div class="ae-pro-dialog-actions two"></div>'
      +'</div>';
    document.body.appendChild(overlay);
    msgEl=overlay.querySelector('.ae-pro-question-message');
    inputWrap=overlay.querySelector('.ae-pro-input-wrap');
    inputEl=overlay.querySelector('.ae-pro-input');
    actions=overlay.querySelector('.ae-pro-dialog-actions');
    titleEl=overlay.querySelector('.ae-pro-dialog-title');
    kicker=overlay.querySelector('.ae-pro-dialog-kicker');
  }

  function esPeligroso(texto){
    var s=String(texto||'').toLowerCase();
    return /borrar|eliminar|vaciar|definitiv|no se puede deshacer|datos delicados|papelera|reemplaza el catálogo|restaurar/.test(s);
  }

  function cerrar(valor){
    if(!overlay)return;
    overlay.classList.remove('is-open');
    var r=resolverActual;resolverActual=null;
    setTimeout(function(){if(r)r(valor);},110);
  }

  function mostrar(config){
    crear();
    return new Promise(function(resolve){
      resolverActual=resolve;
      var tipo=config.tipo||'confirm';
      var peligro=esPeligroso(config.mensaje);
      kicker.className='ae-pro-dialog-kicker'+(peligro?' danger':'');
      kicker.textContent=peligro?'Acción sensible':'Acción de AmarangoElectro';
      titleEl.textContent=tipo==='prompt'?'Completá este dato':(peligro?'Confirmación necesaria':'Confirmar acción');
      msgEl.textContent=String(config.mensaje||'');
      inputWrap.style.display=tipo==='prompt'?'block':'none';
      if(tipo==='prompt')inputEl.value=config.valor==null?'':String(config.valor);
      actions.innerHTML='';

      var cancelar=document.createElement('button');
      cancelar.type='button';cancelar.className='ae-pro-btn secondary';
      cancelar.textContent=tipo==='prompt'?'Cancelar':'No, cancelar';
      cancelar.addEventListener('click',function(){vibrar(7);cerrar(tipo==='prompt'?null:false);});

      var aceptar=document.createElement('button');
      aceptar.type='button';aceptar.className='ae-pro-btn '+(peligro?'danger':'primary');
      aceptar.textContent=tipo==='prompt'?'Aceptar':'Sí, continuar';
      aceptar.addEventListener('click',function(){
        vibrar(8);
        cerrar(tipo==='prompt'?inputEl.value:true);
      });

      actions.appendChild(cancelar);actions.appendChild(aceptar);
      requestAnimationFrame(function(){
        overlay.classList.add('is-open');
        setTimeout(function(){
          try{
            if(tipo==='prompt'){inputEl.focus({preventScroll:true});inputEl.select();}
            else aceptar.focus({preventScroll:true});
          }catch(e){}
        },130);
      });
    });
  }

  window.aeConfirmar=function(mensaje){return mostrar({tipo:'confirm',mensaje:mensaje});};
  window.aePreguntar=function(mensaje,valor){return mostrar({tipo:'prompt',mensaje:mensaje,valor:valor});};

  inputElKeyInit();
  function inputElKeyInit(){
    document.addEventListener('keydown',function(ev){
      if(!overlay||!overlay.classList.contains('is-open'))return;
      if(ev.key==='Escape'){ev.preventDefault();cerrar(inputWrap.style.display==='none'?false:null);}
      if(ev.key==='Enter'&&inputWrap.style.display!=='none'&&document.activeElement===inputEl){
        ev.preventDefault();cerrar(inputEl.value);
      }
    });
  }

  function prefijoPermitido(nombre){
    return /^(tienda|borrar|cerrar|quitar|vaciar|limpiar|ruleta|guardar|finalizar|procesar|cambiar|restaurar|agregar|marcar|elegir)/i.test(nombre||'');
  }

  function envolver(nombre,fn){
    if(!fn||fn.__aeDialogWrapped)return;
    var src='';
    try{src=Function.prototype.toString.call(fn);}catch(e){return;}
    if(!/\b(confirm|prompt)\s*\(/.test(src))return;
    if(!prefijoPermitido(nombre))return;

    function envuelta(){
      var self=this,args=arguments,respuestas=[];
      function ejecutar(){
        var pos=0;
        var confirmReal=window.confirm,promptReal=window.prompt;
        window.confirm=function(mensaje){
          if(pos<respuestas.length){
            var ya=respuestas[pos++];
            if(ya.tipo!=='confirm')throw new Error('Secuencia de diálogo inválida');
            return ya.valor;
          }
          var req=new Error('AE_DIALOG_REQUEST');
          req.__aeDialogRequest=true;req.tipo='confirm';req.mensaje=String(mensaje||'');
          throw req;
        };
        window.prompt=function(mensaje,valor){
          if(pos<respuestas.length){
            var ya=respuestas[pos++];
            if(ya.tipo!=='prompt')throw new Error('Secuencia de diálogo inválida');
            return ya.valor;
          }
          var req=new Error('AE_DIALOG_REQUEST');
          req.__aeDialogRequest=true;req.tipo='prompt';req.mensaje=String(mensaje||'');req.valor=valor;
          throw req;
        };

        try{
          return fn.apply(self,args);
        }catch(err){
          if(err&&err.__aeDialogRequest){
            window.confirm=confirmReal;window.prompt=promptReal;
            var p=err.tipo==='confirm'?window.aeConfirmar(err.mensaje):window.aePreguntar(err.mensaje,err.valor);
            p.then(function(valor){respuestas.push({tipo:err.tipo,valor:valor});ejecutar();});
            return;
          }
          throw err;
        }finally{
          window.confirm=confirmReal;window.prompt=promptReal;
        }
      }
      return ejecutar();
    }
    envuelta.__aeDialogWrapped=VERSION;
    envuelta.__aeOriginal=fn;
    try{window[nombre]=envuelta;}catch(e){}
  }

  function explorar(){
    var nombres=[];
    try{nombres=Object.getOwnPropertyNames(window);}catch(e){return;}
    for(var i=0;i<nombres.length;i++){
      var n=nombres[i],v;
      if(!prefijoPermitido(n))continue;
      try{v=window[n];}catch(e){continue;}
      if(typeof v!=='function')continue;
      envolver(n,v);
    }
  }

  function instalar(){crear();explorar();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',instalar,{once:true});
  else instalar();
  setTimeout(explorar,350);
  setTimeout(explorar,1200);
})();
