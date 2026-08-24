/* AmarangoElectro · fidelidad y seguimiento de clientes (solo Admin)
   Semáforo operativo para seguimiento comercial, NO para decidir crédito.
*/
(function(){
  'use strict';
  var VERSION='admin-clientes-fidelidad-2026-08-24-1',intentos=0;
  if(window.__AE_ADMIN_CLIENTES_FIDELIDAD__===VERSION)return;
  window.__AE_ADMIN_CLIENTES_FIDELIDAD__=VERSION;

  function admin(){try{return window.adminUnlocked===true||window.tiendaEsAdmin===true||(document.body&&document.body.classList.contains('rol-admin'));}catch(e){return false;}}
  function clientes(){try{return typeof window.cargarClientesTienda==='function'?(window.cargarClientesTienda()||[]):[];}catch(e){return [];}}
  function historial(){try{if(typeof window.cargarHistorial==='function')return window.cargarHistorial()||[];var x=localStorage.getItem('ae_historial');return x?JSON.parse(x):[];}catch(e){return [];}}
  function tel(v){var d=String(v||'').replace(/\D+/g,'');if(d.indexOf('54')===0)d=d.slice(2);return d.slice(-10);}
  function norm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();}
  function esc(s){return String(s||'').replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]);});}
  function fecha(v){var d=new Date(v||0);return Number.isFinite(d.getTime())?d:null;}
  function diasDesde(d){if(!d)return 99999;return Math.max(0,Math.floor((Date.now()-d.getTime())/86400000));}

  function compraCliente(c){
    if(c&&c.ultimaCompraFecha)return fecha(c.ultimaCompraFecha);
    var tc=tel(c&&(c.telefono||c.tel)),nc=norm(c&&c.nombre),mejor=null;
    historial().forEach(function(h){
      if(!h)return;var ht=tel(h.tel||h.telefono),hn=norm(h.cliente||h.nombreCliente||'');
      if((tc&&ht&&tc===ht)||(nc&&hn&&nc===hn)){var d=fecha(h.fecha||h.creado);if(d&&(!mejor||d>mejor))mejor=d;}
    });
    return mejor;
  }
  function semaforo(c){
    var u=compraCliente(c),du=diasDesde(u),alta=fecha(c&&c.creado||c&&c.fechaRegistroWeb||c&&c.actualizado),da=diasDesde(alta);
    if(u&&du<=90)return {nivel:0,color:'#16A34A',bg:'#ECFDF5',borde:'#A7F3D0',texto:'Activo',detalle:'Compra reciente'};
    if((u&&du<=180)||(!u&&da<=30))return {nivel:1,color:'#B7791F',bg:'#FFFBEB',borde:'#FDE68A',texto:'Seguimiento',detalle:u?'Hace un tiempo que no compra':'Registrado sin compra todavía'};
    return {nivel:2,color:'#C2410C',bg:'#FFF1ED',borde:'#FED7AA',texto:'Reactivar',detalle:u?'Hace más de 6 meses que no compra':'Registrado sin compra'};
  }

  function estilos(){
    if(document.getElementById('ae-fid-admin-style'))return;var s=document.createElement('style');s.id='ae-fid-admin-style';s.textContent=`
#ae-fid-admin{position:fixed;inset:0;z-index:26000;background:rgba(2,12,46,.70);backdrop-filter:blur(8px);display:none;align-items:flex-end;justify-content:center;font-family:inherit}#ae-fid-admin.on{display:flex}.ae-fid-sheet{width:min(100%,520px);max-height:91dvh;overflow:auto;background:#f7f9fc;border-radius:25px 25px 0 0;padding:15px 14px calc(18px + env(safe-area-inset-bottom));box-shadow:0 -24px 70px rgba(0,0,0,.34)}.ae-fid-head{display:flex;align-items:center;gap:9px;margin-bottom:11px}.ae-fid-title{flex:1}.ae-fid-title b{display:block;color:#0B2D6B;font-size:1rem}.ae-fid-title span{display:block;color:#738095;font-size:.61rem;margin-top:2px}.ae-fid-x{width:38px;height:38px;border-radius:11px;border:1px solid #dce3ed;background:#fff;color:#334155;font-size:1.1rem}.ae-fid-legend{display:flex;gap:5px;flex-wrap:wrap;background:#fff;border:1px solid #e2e7ef;border-radius:13px;padding:9px;margin-bottom:10px}.ae-fid-legend span{font-size:.56rem;font-weight:850;color:#586477}.ae-fid-card{background:#fff;border:1px solid #e1e6ee;border-radius:15px;padding:11px;margin-bottom:8px;box-shadow:0 3px 12px rgba(11,45,107,.05)}.ae-fid-top{display:flex;align-items:center;gap:7px}.ae-fid-name{flex:1;min-width:0;color:#0B2D6B;font-size:.76rem;font-weight:950}.ae-fid-light{border-radius:999px;padding:5px 8px;font-size:.57rem;font-weight:950;white-space:nowrap}.ae-fid-meta{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px}.ae-fid-badge{border-radius:999px;padding:5px 7px;font-size:.55rem;font-weight:850;background:#f5f7fa;color:#586477;border:1px solid #e3e8ef}.ae-fid-gift{background:#FFF4E6;color:#B45309;border-color:#FFD09B}.ae-fid-gold{background:#FFF9D9;color:#8A5A00;border-color:#F6D86B}.ae-fid-wa{background:#ECFDF5;color:#047857;border-color:#A7F3D0}.ae-fid-empty{text-align:center;padding:28px 10px;color:#7a8493;font-size:.72rem}#ae-fid-open{width:100%;border:0;border-radius:11px;padding:10px;background:linear-gradient(135deg,#0B2D6B,#1e5bc8);color:#fff;font:900 .67rem inherit;margin:7px 0 10px}
`;
    document.head.appendChild(s);
  }
  function crear(){
    estilos();if(document.getElementById('ae-fid-admin'))return;var o=document.createElement('div');o.id='ae-fid-admin';o.innerHTML='<div class="ae-fid-sheet"><div class="ae-fid-head"><div style="font-size:1.35rem">🏅</div><div class="ae-fid-title"><b>Clientes · semáforo y regalos</b><span>Seguimiento comercial. No modifica ni decide condiciones de crédito.</span></div><button class="ae-fid-x" type="button">×</button></div><div class="ae-fid-legend"><span>🟢 Activo</span><span>🟡 Seguimiento</span><span>🔴 Reactivar</span><span>· basado en actividad/recencia</span></div><div id="ae-fid-list"></div></div>';document.body.appendChild(o);o.querySelector('.ae-fid-x').onclick=function(){o.classList.remove('on');};o.onclick=function(e){if(e.target===o)o.classList.remove('on');};
  }
  function render(){
    var box=document.getElementById('ae-fid-list');if(!box)return;var arr=clientes().slice();
    if(!arr.length){box.innerHTML='<div class="ae-fid-empty">Todavía no hay clientes para mostrar.</div>';return;}
    arr.sort(function(a,b){var ag=(a.regaloReferidosPendiente?2:0)+(a.regaloPendiente?1:0),bg=(b.regaloReferidosPendiente?2:0)+(b.regaloPendiente?1:0);if(bg!==ag)return bg-ag;return semaforo(a).nivel-semaforo(b).nivel;});
    box.innerHTML=arr.map(function(c){
      var s=semaforo(c),refs=Number(c.referidosCantidad||0),compraron=Number(c.referidosConCompra||0),meta=Number(c.metaReferidosObjetivo||10);var badges=[];
      if(c.regaloPendiente===true)badges.push('<span class="ae-fid-badge ae-fid-gift">🎁 Regalo 1ª compra pendiente</span>');
      badges.push('<span class="ae-fid-badge">🤝 '+refs+'/'+meta+' recomendados</span>');
      if(refs>=meta&&compraron===0)badges.push('<span class="ae-fid-badge ae-fid-gold">🏅 Meta lograda · espera 1ª compra de un referido</span>');
      if(c.regaloReferidosPendiente===true)badges.push('<span class="ae-fid-badge ae-fid-gold">🏅🎁 Regalo por recomendados pendiente</span>');
      if(c.aceptaPromos===true)badges.push('<span class="ae-fid-badge ae-fid-wa">📲 WhatsApp autorizado</span>');
      return '<div class="ae-fid-card"><div class="ae-fid-top"><div class="ae-fid-name">'+esc(c.nombre||'Cliente')+'</div><span class="ae-fid-light" style="color:'+s.color+';background:'+s.bg+';border:1px solid '+s.borde+'">'+(s.nivel===0?'🟢':s.nivel===1?'🟡':'🔴')+' '+s.texto+'</span></div><div style="font-size:.55rem;color:#8a94a3;margin-top:3px">'+esc(s.detalle)+'</div><div class="ae-fid-meta">'+badges.join('')+'</div></div>';
    }).join('');
  }
  function abrir(){if(!admin())return;crear();var o=document.getElementById('ae-fid-admin');o.classList.add('on');render();try{if(typeof window.bajarClientesNube==='function'){window.bajarClientesNube();setTimeout(render,700);}}catch(e){}}
  function ponerBoton(){
    if(!admin())return;var modal=document.getElementById('modal-cuotas');if(!modal||getComputedStyle(modal).display==='none'||modal.querySelector('#ae-fid-open'))return;var h=Array.from(modal.querySelectorAll('h1,h2,h3')).find(function(x){return /clientes registrados/i.test(x.textContent||'');});if(!h)return;var b=document.createElement('button');b.id='ae-fid-open';b.type='button';b.textContent='🏅 Ver semáforo, regalos y recomendados';b.onclick=abrir;h.insertAdjacentElement('afterend',b);
  }
  function envolver(){var f=window.tiendaClientesRender;if(typeof f!=='function'){if(intentos++<100)setTimeout(envolver,150);return;}if(f.__aeFidelidad)return;var w=function(){var r=f.apply(this,arguments);setTimeout(ponerBoton,0);return r;};w.__aeFidelidad=VERSION;w.__anterior=f;window.tiendaClientesRender=w;setTimeout(ponerBoton,350);}
  window.AmarangoFidelidadAdmin={abrir:abrir,render:render};crear();envolver();
})();
