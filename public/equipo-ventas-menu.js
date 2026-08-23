/* AmarangoElectro · acceso robusto a Equipo de ventas en menú Admin
   Mantiene el panel existente de asesores y vuelve a exponerlo en el menú lateral.
*/
(function(){
  'use strict';
  var VERSION='equipo-ventas-menu-2026-08-23-1';
  if(window.__AE_EQUIPO_VENTAS_MENU__===VERSION)return;
  window.__AE_EQUIPO_VENTAS_MENU__=VERSION;

  function ls(k){try{return localStorage.getItem(k)||'';}catch(e){return '';}}
  function esAdmin(){
    try{
      if(window.vistaPreviaCliente===true)return false;
      if(document.body&&document.body.classList.contains('rol-admin'))return true;
      if(window.tiendaEsAdmin===true)return true;
      if(window.adminUnlocked===true)return true;
      if(String(ls('ae_rol')).toLowerCase()==='admin')return true;
    }catch(e){}
    return false;
  }

  function normalizar(t){
    return String(t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toLowerCase();
  }

  function asegurarHost(){
    var host=document.getElementById('admin-subtabs');
    if(host)return host;
    host=document.createElement('div');
    host.id='admin-subtabs';
    host.setAttribute('data-ae-fallback','1');
    host.style.cssText='display:none!important;position:absolute!important;width:0!important;height:0!important;overflow:hidden!important;pointer-events:none!important;';
    document.body.appendChild(host);
    return host;
  }

  function buscarFilaCerrarSesion(){
    var selectores='button,a,[role="button"],.mas-row,.menu-row,.menu-item,li,div';
    var nodos=document.querySelectorAll(selectores);
    var mejor=null;
    for(var i=0;i<nodos.length;i++){
      var el=nodos[i];
      if(!el||el.id==='ae-equipo-ventas-menu'||el.id==='admin-subtabs')continue;
      var txt=normalizar(el.textContent);
      if(txt==='cerrar sesion'||txt==='🔒 cerrar sesion'||txt==='🚪 cerrar sesion'){
        if(!mejor||el.children.length<mejor.children.length)mejor=el;
      }
    }
    if(!mejor)return null;
    var clic=mejor.closest&&mejor.closest('button,a,[role="button"],.mas-row,.menu-row,.menu-item,li,[onclick]');
    return clic||mejor;
  }

  function cambiarTextoFila(fila){
    var cambiado=false;
    var walker=document.createTreeWalker(fila,NodeFilter.SHOW_TEXT);
    var n;
    while((n=walker.nextNode())){
      var t=normalizar(n.nodeValue);
      if(t.indexOf('cerrar sesion')>=0){
        n.nodeValue='Equipo de ventas';
        cambiado=true;
      }
    }
    var iconos=fila.querySelectorAll('.ic,.icon,.ico,[data-icon]');
    if(iconos.length)iconos[0].textContent='👥';
    else {
      var hijos=fila.children;
      for(var i=0;i<hijos.length;i++){
        var tx=normalizar(hijos[i].textContent);
        if(tx==='🔒'||tx==='🚪'||tx.length<=2){hijos[i].textContent='👥';break;}
      }
    }
    if(!cambiado){
      fila.textContent='👥 Equipo de ventas';
    }
  }

  function abrirEquipoVentas(ev){
    if(ev){ev.preventDefault();ev.stopPropagation();}
    if(!esAdmin())return;
    var interno=document.getElementById('sub-asesores-identidad');
    if(interno&&typeof interno.click==='function'){
      interno.click();
      return;
    }
    setTimeout(function(){
      var b=document.getElementById('sub-asesores-identidad');
      if(b&&typeof b.click==='function')b.click();
    },180);
  }

  function insertarVisible(){
    var existente=document.getElementById('ae-equipo-ventas-menu');
    if(!esAdmin()){
      if(existente)existente.remove();
      return false;
    }
    if(existente)return true;
    var interno=document.getElementById('sub-asesores-identidad');
    if(!interno)return false;
    var cerrar=buscarFilaCerrarSesion();
    if(!cerrar||!cerrar.parentNode)return false;
    var fila=cerrar.cloneNode(true);
    fila.id='ae-equipo-ventas-menu';
    fila.removeAttribute('onclick');
    fila.removeAttribute('href');
    fila.setAttribute('role','button');
    fila.setAttribute('tabindex','0');
    fila.setAttribute('aria-label','Equipo de ventas');
    cambiarTextoFila(fila);
    fila.onclick=abrirEquipoVentas;
    fila.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();abrirEquipoVentas(e);}};
    cerrar.parentNode.insertBefore(fila,cerrar.nextSibling);
    return true;
  }

  var pendiente=0;
  function reconciliar(){
    asegurarHost();
    insertarVisible();
  }
  function programar(){
    if(pendiente)return;
    pendiente=setTimeout(function(){pendiente=0;reconciliar();},80);
  }

  function instalar(){
    asegurarHost();
    reconciliar();
    var obs=new MutationObserver(programar);
    obs.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
    document.addEventListener('click',function(){setTimeout(reconciliar,120);},true);
    setInterval(reconciliar,1200);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',instalar,{once:true});
  else instalar();
})();
