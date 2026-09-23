/* AmarangoElectro · Centro profesional de Asesores + Margarita */
(function(){
  'use strict';
  var VERSION='asesores-centro-2026-08-23-1';
  if(window.__AE_ASESORES_CENTRO__===VERSION)return;
  window.__AE_ASESORES_CENTRO__=VERSION;

  var K_TOKEN='ae_asesor_token_v2',K_ID='ae_asesor_id',K_NOMBRE='ae_nombre_asesor',K_TEL='ae_asesor_tel';
  var nativeFetch=window.fetch.bind(window),heartbeatTimer=null,asesorActual=null,adminCache=null,adminCacheTs=0;
  var vistos=new Map();

  function ls(k){try{return localStorage.getItem(k)||'';}catch(e){return'';}}
  function setLs(k,v){try{v?localStorage.setItem(k,String(v)):localStorage.removeItem(k);}catch(e){}}
  function ss(k){try{return sessionStorage.getItem(k)||'';}catch(e){return'';}}
  function setSs(k,v){try{v?sessionStorage.setItem(k,String(v)):sessionStorage.removeItem(k);}catch(e){}}
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]);});}
  function fmtFecha(v){if(!v)return'—';try{return new Date(v).toLocaleString('es-AR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});}catch(e){return'—';}}
  function esAdmin(){
    try{
      if(window.vistaPreviaCliente===true)return false;
      if(window.tiendaEsAdmin===true||window.adminUnlocked===true)return true;
      if(document.body&&document.body.classList.contains('rol-admin'))return true;
      return localStorage.getItem('ae_sesion_admin')==='1';
    }catch(e){return false;}
  }
  function token(){return ls(K_TOKEN);}
  function esAsesorIdentificado(){return !!(token()&&ls(K_ID)&&ls(K_NOMBRE));}

  function toast(txt){
    try{if(typeof window.mostrarToast==='function'){window.mostrarToast(txt);return;}}catch(e){}
    var t=document.createElement('div');t.textContent=txt;t.style.cssText='position:fixed;left:50%;bottom:90px;transform:translateX(-50%);z-index:19000;background:#071c46;color:#fff;border-left:4px solid #FF7A00;border-radius:12px;padding:10px 14px;font:800 .76rem/1.3 system-ui;box-shadow:0 10px 28px rgba(0,0,0,.28);max-width:88vw';document.body.appendChild(t);setTimeout(function(){t.remove();},1800);
  }

  async function req(path,opt){
    opt=opt||{};var headers=Object.assign({'content-type':'application/json'},opt.headers||{});
    if(opt.asesor!==false&&token())headers.authorization='Bearer '+token();
    if(opt.admin){var ak=ss('ae_admin_api_key');if(ak)headers['x-admin-key']=ak;}
    var r=await nativeFetch(path,{method:opt.method||'GET',headers:headers,body:opt.body===undefined?undefined:JSON.stringify(opt.body)});
    var d={};try{d=await r.json();}catch(e){}
    if(!r.ok){var er=new Error(d.error||('HTTP '+r.status));er.status=r.status;er.data=d;throw er;}
    return d;
  }

  function limpiarSesionAsesor(){
    setLs(K_TOKEN,'');setLs(K_ID,'');setLs(K_NOMBRE,'');setLs(K_TEL,'');
    try{localStorage.removeItem('ae_sesion_rev');localStorage.removeItem('ae_rol');}catch(e){}
    asesorActual=null;window.revUnlocked=false;
  }
  function aplicarSesion(a,tok){
    if(tok)setLs(K_TOKEN,tok);
    asesorActual=a||{};setLs(K_ID,a.id||'');setLs(K_NOMBRE,a.nombre||'');setLs(K_TEL,a.telefono||'');
    try{localStorage.setItem('ae_sesion_rev','1');localStorage.setItem('ae_rol','asesor');}catch(e){}
    window.revUnlocked=true;
    try{if(typeof window.mostrarPestanasRev==='function')window.mostrarPestanasRev();}catch(e){}
    document.body&&document.body.classList.add('rol-revendedor');
    iniciarHeartbeat();decorarMargarita();
  }

  async function restaurarSesion(){
    if(!token())return false;
    try{var d=await req('/api/asesores/me');if(d&&d.asesor){aplicarSesion(d.asesor);return true;}}catch(e){}
    limpiarSesionAsesor();return false;
  }

  function estilos(){
    if(document.getElementById('ae-centro-as-style'))return;
    var s=document.createElement('style');s.id='ae-centro-as-style';s.textContent='\
#ae-as-login,#ae-as-admin,#ae-as-code{position:fixed;inset:0;z-index:18100;background:rgba(2,12,35,.62);backdrop-filter:blur(7px);display:flex;align-items:flex-end;justify-content:center;padding:0}.ae-as-sheet{width:min(100%,480px);max-height:92dvh;overflow:auto;background:#f6f8fc;border-radius:24px 24px 0 0;padding:16px 14px calc(18px + env(safe-area-inset-bottom));box-shadow:0 -20px 60px rgba(0,0,0,.3)}.ae-as-card{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:12px;margin-bottom:10px}.ae-as-title{font-size:1.05rem;font-weight:950;color:#0B2D6B}.ae-as-sub{font-size:.68rem;color:#64748b;line-height:1.4;margin-top:3px}.ae-as-x{width:36px;height:36px;border:1px solid #d9e0ea;background:#fff;border-radius:10px;color:#334155;font-size:1.1rem}.ae-as-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:12px}.ae-as-input{width:100%;border:1.5px solid #d8e0ec;border-radius:12px;padding:11px 12px;background:#fff;color:#15213b;font:700 .78rem system-ui;outline:none;margin-top:8px}.ae-as-input:focus{border-color:#0B2D6B;box-shadow:0 0 0 3px rgba(11,45,107,.09)}.ae-as-btn{border:0;border-radius:12px;padding:11px 13px;font:900 .75rem system-ui;cursor:pointer}.ae-as-btn.az{background:#0B2D6B;color:#fff}.ae-as-btn.na{background:#FF7A00;color:#fff}.ae-as-btn.ghost{background:#eef2f7;color:#334155}.ae-as-btn.danger{background:#fff1f2;color:#be123c;border:1px solid #fecdd3}.ae-as-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}.ae-as-online{background:linear-gradient(135deg,#08275e,#174f9c);border:1px solid rgba(255,255,255,.14);border-radius:17px;padding:12px;margin-bottom:12px;color:#fff}.ae-as-online-title{font-size:.7rem;font-weight:950;color:#b9d4ff;text-transform:uppercase;letter-spacing:.04em}.ae-as-chips{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}.ae-as-chip{display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.16);border-radius:999px;padding:6px 9px;font-size:.7rem;font-weight:900}.ae-as-dot{width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 3px rgba(34,197,94,.18)}.ae-as-row{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.ae-as-name{font-size:.83rem;font-weight:950;color:#0B2D6B}.ae-as-meta{font-size:.64rem;color:#64748b;margin-top:3px;line-height:1.45}.ae-as-badge{font-size:.61rem;font-weight:950;border-radius:999px;padding:5px 8px;white-space:nowrap}.ae-as-badge.on{background:#dcfce7;color:#15803d}.ae-as-badge.off{background:#f1f5f9;color:#64748b}.ae-as-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:9px}.ae-as-stat{background:#f8fafc;border:1px solid #edf1f5;border-radius:10px;padding:8px;text-align:center}.ae-as-stat b{display:block;color:#0B2D6B;font-size:.82rem}.ae-as-stat span{font-size:.55rem;color:#64748b}.ae-as-mg-actions{display:flex;gap:5px;margin:4px 0 8px 46px}.ae-as-mg-actions button{border:1px solid #d5deea;background:#fff;color:#0B2D6B;border-radius:999px;padding:5px 8px;font-size:.6rem;font-weight:900}.ae-as-online-mini{display:inline-flex;align-items:center;gap:5px;margin-left:auto;font-size:.62rem;font-weight:900;color:#86efac}.ae-as-login-note{font-size:.63rem;color:#64748b;line-height:1.45;margin-top:10px}.ae-as-code{font-size:1.55rem;letter-spacing:.16em;font-weight:950;color:#0B2D6B;text-align:center;background:#eef4ff;border-radius:13px;padding:14px;margin:14px 0}';document.head.appendChild(s);
  }

  function cerrar(id){var e=document.getElementById(id);if(e)e.remove();}
  function modalLogin(){
    estilos();cerrar('ae-as-login');var m=document.createElement('div');m.id='ae-as-login';
    m.innerHTML='<div class="ae-as-sheet" style="max-width:440px"><div class="ae-as-head"><div><div class="ae-as-title">🤝 Acceso Asesores de ventas</div><div class="ae-as-sub">Entrá con tu teléfono y tu clave personal. Margarita te va a reconocer por tu nombre.</div></div><button class="ae-as-x">×</button></div><div class="ae-as-card"><input id="ae-as-tel" class="ae-as-input" inputmode="tel" autocomplete="tel" placeholder="Número de teléfono"><input id="ae-as-code-in" class="ae-as-input" autocomplete="one-time-code" placeholder="Clave personal"><button id="ae-as-enter" class="ae-as-btn az" style="width:100%;margin-top:10px">Entrar →</button><div id="ae-as-error" class="ae-as-sub" style="color:#dc2626;text-align:center;margin-top:8px"></div></div><div class="ae-as-login-note">Tu acceso es individual. Si el administrador pausa tu usuario, la sesión se cierra automáticamente. AmarangoElectro registra únicamente actividad dentro de la tienda para organizar el trabajo del equipo.</div></div>';
    document.body.appendChild(m);m.querySelector('.ae-as-x').onclick=function(){m.remove();};
    m.querySelector('#ae-as-enter').onclick=async function(){
      var b=this,err=m.querySelector('#ae-as-error');err.textContent='';b.disabled=true;b.textContent='Ingresando…';
      try{var d=await req('/api/asesores/login',{method:'POST',asesor:false,body:{telefono:m.querySelector('#ae-as-tel').value,codigo:m.querySelector('#ae-as-code-in').value}});aplicarSesion(d.asesor,d.token);m.remove();toast('✅ Hola, '+d.asesor.nombre);try{if(typeof window.showTab==='function')window.showTab('tienda');}catch(e){}}
      catch(e){err.textContent=e.message||'No se pudo ingresar';}
      finally{b.disabled=false;b.textContent='Entrar →';}
    };
  }

  function instalarAccesoAsesor(){
    window.accesoRevendedores=function(){if(esAsesorIdentificado()){try{if(typeof window.mostrarPestanasRev==='function')window.mostrarPestanasRev();if(typeof window.showTab==='function')window.showTab('tienda');}catch(e){}return;}modalLogin();};
  }

  async function enviarEvento(evento,extra){
    if(!esAsesorIdentificado())return;
    try{await req('/api/asesores/evento',{method:'POST',body:Object.assign({evento:evento},extra||{})});}catch(e){if(e.status===401)limpiarSesionAsesor();}
  }
  async function heartbeat(){
    if(!esAsesorIdentificado()||document.visibilityState==='hidden')return;
    try{var d=await req('/api/asesores/heartbeat',{method:'POST',body:{}});if(d&&d.asesor)asesorActual=Object.assign({},asesorActual||{},d.asesor);}catch(e){if(e.status===401||e.status===403){limpiarSesionAsesor();toast('Tu sesión de asesor terminó');}}
  }
  function iniciarHeartbeat(){clearInterval(heartbeatTimer);heartbeat();heartbeatTimer=setInterval(heartbeat,60000);}
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')heartbeat();});

  function idProductoDesde(el){var c=el&&el.closest?el.closest('[id^="card-"]'):null;return c?c.id.slice(5):'';}
  document.addEventListener('click',function(ev){
    if(!esAsesorIdentificado())return;
    var share=ev.target&&ev.target.closest?ev.target.closest('[onclick*="compartir"],button[aria-label*="Compart" i],.btn-compartir,.share-btn'):null;
    if(share){var sid=idProductoDesde(share)||String(window._tiendaDetalleId||'');enviarEvento('producto_compartido',{producto_id:sid});return;}
    var card=ev.target&&ev.target.closest?ev.target.closest('.prod-card,[id^="card-"]'):null;
    if(card){var id=idProductoDesde(card)||card.dataset&&card.dataset.id||'';var now=Date.now();if(id&&(!vistos.has(id)||now-vistos.get(id)>20000)){vistos.set(id,now);enviarEvento('producto_visto',{producto_id:id});}}
  },true);

  function interceptarMargarita(){
    if(window.fetch.__aeAsesorCentro)return;
    var prev=window.fetch.bind(window);
    var f=async function(input,init){
      var url=typeof input==='string'?input:(input&&input.url)||'';var esMg=/\/api\/margarita(?:\?|$)/.test(url)&&String(init&&init.method||'GET').toUpperCase()==='POST';
      var r=await prev(input,init);
      if(esMg&&esAsesorIdentificado())enviarEvento('consulta_margarita',{tema:'consulta'});
      return r;
    };f.__aeAsesorCentro=VERSION;f.__anterior=prev;window.fetch=f;
  }

  function copiar(txt){if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(txt);var ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();return Promise.resolve();}
  function decorarBot(bot){
    if(!esAsesorIdentificado()||!bot||bot.dataset.aeAsesorAcciones==='1')return;bot.dataset.aeAsesorAcciones='1';
    var row=bot.closest('.mg-bot-row')||bot.parentElement;if(!row)return;
    var a=document.createElement('div');a.className='ae-as-mg-actions';a.innerHTML='<button type="button">📋 Copiar</button><button type="button">📤 Compartir</button>';
    var txt=function(){return String(bot.innerText||bot.textContent||'').trim();};
    a.children[0].onclick=function(){copiar(txt()).then(function(){toast('📋 Respuesta copiada');});};
    a.children[1].onclick=async function(){var t=txt();try{if(navigator.share){await navigator.share({text:t,title:'Respuesta de Margarita'});return;}}catch(e){if(e&&e.name==='AbortError')return;}await copiar(t);toast('📋 Copiada para enviar al cliente');};
    row.parentNode.insertBefore(a,row.nextSibling);
  }
  function decorarMargarita(){var c=document.getElementById('margarita-msgs');if(!c)return;c.querySelectorAll('.margarita-bot').forEach(decorarBot);}
  new MutationObserver(function(ms){if(!esAsesorIdentificado())return;ms.forEach(function(m){m.addedNodes.forEach(function(n){if(n.nodeType!==1)return;if(n.matches&&n.matches('.margarita-bot'))decorarBot(n);if(n.querySelectorAll)n.querySelectorAll('.margarita-bot').forEach(decorarBot);});});}).observe(document.documentElement,{childList:true,subtree:true});

  async function adminKey(){
    var k=ss('ae_admin_api_key');if(k)return k;
    k=window.prompt('Clave segura de Administración para gestionar asesores:')||'';if(k)setSs('ae_admin_api_key',k);return k;
  }
  async function adminReq(path,opt){
    if(!await adminKey())throw new Error('Falta la clave de administración');
    try{return await req(path,Object.assign({},opt||{},{admin:true,asesor:false}));}
    catch(e){if(e.status===401){setSs('ae_admin_api_key','');throw new Error('Clave de administración incorrecta');}throw e;}
  }

  function mostrarCodigo(nombre,codigo){
    estilos();cerrar('ae-as-code');var m=document.createElement('div');m.id='ae-as-code';m.innerHTML='<div class="ae-as-sheet" style="max-width:410px;text-align:center"><div class="ae-as-title">Clave personal de '+esc(nombre)+'</div><div class="ae-as-sub">Mostrala o envíasela ahora. Después sólo se guarda cifrada.</div><div class="ae-as-code">'+esc(codigo)+'</div><button class="ae-as-btn az" id="ae-code-copy" style="width:100%">📋 Copiar clave</button><button class="ae-as-btn ghost" id="ae-code-ok" style="width:100%;margin-top:7px">Listo</button></div>';document.body.appendChild(m);m.querySelector('#ae-code-copy').onclick=function(){copiar(codigo).then(function(){toast('✅ Clave copiada');});};m.querySelector('#ae-code-ok').onclick=function(){m.remove();};
  }

  function cardAsesor(a){
    var estado=a.activo?(a.en_linea?'🟢 En línea':'Activo'):'Pausado';
    return '<div class="ae-as-card" data-as-id="'+esc(a.id)+'"><div class="ae-as-row"><div><div class="ae-as-name">'+esc(a.nombre)+'</div><div class="ae-as-meta">📱 '+esc(a.telefono)+(a.localidad?' · '+esc(a.localidad):'')+'<br>Última actividad: '+esc(fmtFecha(a.ultima_actividad_at))+'</div></div><span class="ae-as-badge '+(a.activo?'on':'off')+'">'+estado+'</span></div><div class="ae-as-grid"><div class="ae-as-stat"><b>'+Number(a.entradas_hoy||0)+'</b><span>Entradas hoy</span></div><div class="ae-as-stat"><b>'+Number(a.consultas_hoy||0)+'</b><span>Margarita</span></div><div class="ae-as-stat"><b>'+Number(a.minutos_activos_hoy||0)+'m</b><span>Activo hoy</span></div><div class="ae-as-stat"><b>'+Number(a.productos_vistos_hoy||0)+'</b><span>Vistos</span></div><div class="ae-as-stat"><b>'+Number(a.compartidos_hoy||0)+'</b><span>Compartidos</span></div><div class="ae-as-stat"><b>'+Number(a.busquedas_hoy||0)+'</b><span>Búsquedas</span></div></div><div class="ae-as-actions"><button class="ae-as-btn '+(a.activo?'ghost':'az')+'" data-act="toggle">'+(a.activo?'⏸ Pausar':'▶ Activar')+'</button><button class="ae-as-btn ghost" data-act="key">🔑 Nueva clave</button><button class="ae-as-btn danger" data-act="delete">Eliminar</button></div></div>';
  }

  async function cargarAdmin(forzar){
    if(!forzar&&adminCache&&Date.now()-adminCacheTs<15000)return adminCache;
    var d=await adminReq('/api/asesores/admin/resumen');adminCache=d;adminCacheTs=Date.now();return d;
  }
  function onlineHtml(d){var a=d.en_linea||[];return '<div class="ae-as-online"><div class="ae-as-row"><div><div class="ae-as-online-title">En línea ahora</div><div style="font-size:1.25rem;font-weight:950;margin-top:2px">'+a.length+' asesor'+(a.length===1?'':'es')+'</div></div><div style="font-size:1.6rem">🐝</div></div><div class="ae-as-chips">'+(a.length?a.map(function(x){return '<span class="ae-as-chip"><span class="ae-as-dot"></span>'+esc(x.nombre)+'</span>';}).join(''):'<span style="font-size:.68rem;color:#bfdbfe">No hay asesores conectados en este momento.</span>')+'</div></div>';}

  async function abrirAdmin(){
    if(!esAdmin())return;estilos();cerrar('ae-as-admin');var m=document.createElement('div');m.id='ae-as-admin';m.innerHTML='<div class="ae-as-sheet"><div class="ae-as-head"><div><div class="ae-as-title">👥 Equipo de ventas</div><div class="ae-as-sub">Presencia, actividad y accesos individuales de los asesores.</div></div><button class="ae-as-x">×</button></div><div id="ae-as-admin-body"><div class="ae-as-card">Cargando…</div></div></div>';document.body.appendChild(m);m.querySelector('.ae-as-x').onclick=function(){m.remove();};
    try{
      var d=await cargarAdmin(true),body=m.querySelector('#ae-as-admin-body');
      body.innerHTML=onlineHtml(d)+'<div class="ae-as-card"><div class="ae-as-name">➕ Crear asesor</div><div class="ae-as-sub">Pedimos sólo datos útiles para la operación.</div><input class="ae-as-input" id="as-new-name" placeholder="Nombre y apellido"><input class="ae-as-input" id="as-new-tel" inputmode="tel" placeholder="Teléfono"><input class="ae-as-input" id="as-new-email" inputmode="email" placeholder="Email (opcional)"><input class="ae-as-input" id="as-new-loc" placeholder="Localidad (opcional)"><button class="ae-as-btn na" id="as-new-btn" style="width:100%;margin-top:10px">Crear usuario y generar clave</button></div><div class="ae-as-sub" style="font-weight:900;margin:12px 2px 8px">TODOS LOS ASESORES</div>'+(d.asesores||[]).map(cardAsesor).join('');
      body.querySelector('#as-new-btn').onclick=async function(){var b=this;b.disabled=true;try{var x=await adminReq('/api/asesores/admin/crear',{method:'POST',body:{nombre:body.querySelector('#as-new-name').value,telefono:body.querySelector('#as-new-tel').value,email:body.querySelector('#as-new-email').value,localidad:body.querySelector('#as-new-loc').value}});adminCache=null;mostrarCodigo(x.asesor.nombre,x.codigo);m.remove();setTimeout(abrirAdmin,120);}catch(e){toast(e.message);}finally{b.disabled=false;}};
      body.querySelectorAll('[data-as-id]').forEach(function(card){
        var id=card.dataset.asId,a=(d.asesores||[]).find(function(x){return String(x.id)===id;});if(!a)return;
        card.querySelector('[data-act="toggle"]').onclick=async function(){try{await adminReq('/api/asesores/admin/'+encodeURIComponent(id)+'/estado',{method:'POST',body:{activo:!a.activo}});adminCache=null;m.remove();setTimeout(abrirAdmin,80);}catch(e){toast(e.message);}};
        card.querySelector('[data-act="key"]').onclick=async function(){try{var x=await adminReq('/api/asesores/admin/'+encodeURIComponent(id)+'/clave',{method:'POST',body:{}});mostrarCodigo(a.nombre,x.codigo);}catch(e){toast(e.message);}};
        card.querySelector('[data-act="delete"]').onclick=async function(){if(!window.confirm('¿Eliminar a '+a.nombre+' del equipo de ventas?'))return;try{await adminReq('/api/asesores/admin/'+encodeURIComponent(id),{method:'DELETE'});adminCache=null;m.remove();setTimeout(abrirAdmin,80);}catch(e){toast(e.message);}};
      });
    }catch(e){var b=m.querySelector('#ae-as-admin-body');if(b)b.innerHTML='<div class="ae-as-card"><div class="ae-as-name">No pude abrir el panel</div><div class="ae-as-sub" style="color:#dc2626">'+esc(e.message)+'</div><button class="ae-as-btn az" id="ae-as-retry" style="width:100%;margin-top:10px">Reintentar</button></div>';var r=m.querySelector('#ae-as-retry');if(r)r.onclick=function(){setSs('ae_admin_api_key','');m.remove();abrirAdmin();};}
  }

  function instalarMenuAdmin(){
    if(!esAdmin())return false;var caj=document.getElementById('cajon-lateral');if(!caj)return false;if(document.getElementById('ae-admin-equipo-btn'))return true;
    var b=document.createElement('button');b.id='ae-admin-equipo-btn';b.className='cajon-item admin';b.innerHTML='<span class="ci-ic">👥</span><span>Equipo de ventas</span><span id="ae-online-mini" class="ae-as-online-mini"></span>';b.onclick=function(){try{if(typeof window.cerrarCajon==='function')window.cerrarCajon();}catch(e){}abrirAdmin();};caj.appendChild(b);refrescarMini();return true;
  }
  async function refrescarMini(){if(!esAdmin()||!ss('ae_admin_api_key'))return;try{var d=await cargarAdmin(true),e=document.getElementById('ae-online-mini');if(e)e.textContent=(d.en_linea||[]).length?'● '+d.en_linea.length+' online':'';}catch(e){}}

  function instalar(){
    estilos();instalarAccesoAsesor();interceptarMargarita();restaurarSesion();
    var tries=0;(function tick(){instalarMenuAdmin();if(tries++<50)setTimeout(tick,300);})();
    setInterval(refrescarMini,60000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',instalar,{once:true});else instalar();
})();
