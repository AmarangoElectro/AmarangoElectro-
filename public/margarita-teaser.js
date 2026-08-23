/* AmarangoElectro · mini saludo visible de Margarita para clientes */
(function(){
  'use strict';
  var ID='margarita-teaser';
  var TIMER=null;
  var INTENTOS=0;

  function esAdmin(){
    try{
      if(typeof window.esAdmin==='function'&&window.esAdmin())return true;
      if(window.tiendaEsAdmin===true)return true;
      if(window.adminUnlocked===true&&window.vistaPreviaCliente!==true)return true;
      if(localStorage.getItem('ae_rol')==='admin')return true;
    }catch(e){}
    return false;
  }

  function esAsesor(){
    if(esAdmin())return false;
    try{
      if(window.vistaPreviaCliente===true)return false;
      if(window.revUnlocked===true)return true;
      var r=String(localStorage.getItem('ae_rol')||'');
      if(/asesor|revendedor|vendedor/i.test(r))return true;
    }catch(e){}
    return false;
  }

  function esCliente(){return !esAdmin()&&!esAsesor();}

  function agregarEstilos(){
    if(document.getElementById('margarita-teaser-style'))return;
    var s=document.createElement('style');
    s.id='margarita-teaser-style';
    s.textContent='\
#margarita-teaser{position:fixed;z-index:9997;max-width:190px;min-height:42px;padding:9px 12px;border:1px solid rgba(11,45,107,.14);border-radius:15px 15px 5px 15px;background:#fff;color:#0B2D6B;box-shadow:0 8px 24px rgba(3,15,45,.20);font:800 .74rem/1.3 system-ui,-apple-system,Segoe UI,sans-serif;text-align:left;cursor:pointer;opacity:0;transform:translateY(8px) scale(.98);transition:opacity .20s ease,transform .20s ease;pointer-events:none;-webkit-tap-highlight-color:transparent;}\
#margarita-teaser.on{opacity:1;transform:translateY(0) scale(1);pointer-events:auto;}\
#margarita-teaser b{color:#FF7A00;font-weight:900;}\
#margarita-teaser:after{content:"";position:absolute;right:-7px;bottom:8px;width:13px;height:13px;background:#fff;border-right:1px solid rgba(11,45,107,.12);border-bottom:1px solid rgba(11,45,107,.12);transform:rotate(-45deg);}\
@media(max-width:360px){#margarita-teaser{max-width:166px;font-size:.69rem;padding:8px 10px;}}\
';
    document.head.appendChild(s);
  }

  function ubicar(){
    var b=document.getElementById(ID),fab=document.getElementById('margarita-fab');
    if(!b||!fab)return;
    var r=fab.getBoundingClientRect();
    var ancho=b.offsetWidth||180;
    var alto=b.offsetHeight||46;
    var left=Math.max(10,Math.min(window.innerWidth-ancho-10,r.left-ancho-10));
    var top=Math.max(72,Math.min(window.innerHeight-alto-14,r.top+(r.height-alto)/2));
    b.style.left=left+'px';
    b.style.top=top+'px';
  }

  function ocultar(){
    var b=document.getElementById(ID);
    if(!b)return;
    b.classList.remove('on');
    clearTimeout(TIMER);
    setTimeout(function(){if(b&&!b.classList.contains('on'))b.remove();},240);
  }

  function abrirMargarita(){
    var fab=document.getElementById('margarita-fab');
    ocultar();
    if(fab)fab.click();
  }

  function crear(){
    if(!esCliente())return true;
    var fab=document.getElementById('margarita-fab');
    if(!fab)return false;
    agregarEstilos();
    var viejo=document.getElementById(ID);if(viejo)viejo.remove();
    var b=document.createElement('button');
    b.id=ID;b.type='button';
    b.setAttribute('aria-label','Abrir Margarita, asistente de AmarangoElectro');
    b.innerHTML='<b>¡Hola! 🐝</b> ¿En qué te puedo servir?';
    b.addEventListener('click',abrirMargarita);
    document.body.appendChild(b);
    ubicar();
    requestAnimationFrame(function(){requestAnimationFrame(function(){b.classList.add('on');ubicar();});});
    window.addEventListener('resize',ubicar,{passive:true});
    if(window.visualViewport)window.visualViewport.addEventListener('resize',ubicar,{passive:true});
    TIMER=setTimeout(ocultar,12000);
    return true;
  }

  function instalar(){
    if(crear())return;
    if(INTENTOS++<60)setTimeout(instalar,150);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(instalar,450);},{once:true});
  else setTimeout(instalar,450);
})();
