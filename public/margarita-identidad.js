/* AmarangoElectro · identidad de Margarita + usuarios asesores
   - corrige saludo según rol real
   - recuerda cliente en este dispositivo cuando completa sus datos
   - recuerda Maxi/Angie por dispositivo
   - asesores con código personal, activo/inactivo y gestión desde Admin
*/
(function(){
  'use strict';
  var VERSION='mg-identidad-2026-08-23-1';
  if(window.__MG_IDENTIDAD__===VERSION)return;
  window.__MG_IDENTIDAD__=VERSION;

  var K_CLIENTE='ae_cliente_identidad';
  var K_ADMIN='ae_admin_nombre';
  var K_ASESOR='ae_nombre_asesor';
  var K_ASESOR_ID='ae_asesor_id';
  var ROW_ASESORES='asesores_ventas';
  var cacheAsesores=null;
  var cacheAsesoresTs=0;

  function leerJson(k,def){try{var v=localStorage.getItem(k);return v?JSON.parse(v):def;}catch(e){return def;}}
  function guardarJson(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
  function ls(k){try{return localStorage.getItem(k)||'';}catch(e){return '';}}
  function setLs(k,v){try{if(v)localStorage.setItem(k,String(v));else localStorage.removeItem(k);}catch(e){}}
  function nombreCorto(n){n=String(n||'').trim();if(!n)return'';if(/^maxi(?:miliano)?\b/i.test(n))return'Maxi';if(/^(angie|angela|ángela)\b/i.test(n))return'Angie';return n.split(/\s+/)[0].slice(0,32);}

  function rolReal(){
    try{
      if(window.vistaPreviaCliente===true)return 'cliente';
      if(document.body&&document.body.classList.contains('rol-admin'))return 'admin';
      if(document.body&&document.body.classList.contains('rol-revendedor'))return 'asesor';
      if(window.tiendaEsAdmin===true)return 'admin';
      if(window.adminUnlocked===true&&window.vistaPreviaCliente!==true)return 'admin';
      if(window.revUnlocked===true&&window.adminUnlocked!==true&&window.vistaPreviaCliente!==true)return 'asesor';
      var r=String(ls('ae_rol')||'').toLowerCase();
      if(r==='admin')return 'admin';
      if(/asesor|revendedor|vendedor/.test(r))return 'asesor';
    }catch(e){}
    return 'cliente';
  }

  function identidadActual(){
    var rol=rolReal();
    if(rol==='admin')return {rol:rol,nombre:nombreCorto(ls(K_ADMIN)||ls('ae_nombre_admin'))};
    if(rol==='asesor')return {rol:rol,nombre:nombreCorto(ls(K_ASESOR)),id:ls(K_ASESOR_ID)};
    var c=leerJson(K_CLIENTE,{});return {rol:'cliente',nombre:nombreCorto(c&&c.nombre),telefono:String(c&&c.telefono||'')};
  }

  function saludoPara(id){
    var n=nombreCorto(id&&id.nombre);
    if(id.rol==='admin'){
      if(n==='Maxi')return '¡Maxi! ¿Todo bien? 🐝 ¿Qué necesitás que prepare?';
      if(n==='Angie')return '¡Hola Angie! ¿Cómo estás? 🐝 ¿En qué te ayudo hoy?';
      return '¡Hola! 🐝 ¿Quién está usando Administración?';
    }
    if(id.rol==='asesor')return n?'¡Hola, '+n+'! 🐝 ¿Qué necesitás para vender hoy?':'¡Hola equipo! 🐝 ¿Qué necesitás para vender hoy?';
    return n?'¡Hola, '+n+'! 🐝 ¿En qué te puedo servir hoy?':'¡Hola! 🐝 ¿En qué te puedo servir hoy?';
  }

  function pareceSaludoViejo(t){
    t=String(t||'').toLowerCase();
    return t.indexOf('quién está por ahí')>=0||t.indexOf('quien esta por ahi')>=0||t.indexOf('soy margarita')>=0||t.indexOf('en qué les doy una mano')>=0||t.indexOf('en que les doy una mano')>=0||t.indexOf('en qué te puedo servir')>=0||t.indexOf('en que te puedo servir')>=0||t.indexOf('hola equipo')>=0;
  }

  function corregirSaludo(){
    var cont=document.getElementById('margarita-msgs');if(!cont)return;
    var bots=cont.querySelectorAll('.margarita-bot');if(!bots.length)return;
    var primero=bots[0];
    var sinConversacion=!Array.isArray(window._margaritaHist)||window._margaritaHist.length===0;
    if(sinConversacion||pareceSaludoViejo(primero.textContent))primero.textContent=saludoPara(identidadActual());
  }

  function guardarClienteLocal(cli){
    if(rolReal()!=='cliente'||!cli)return;
    var nombre=String(cli.nombre||'').trim();if(!nombre)return;
    var tel=String(cli.tel||cli.telefono||'').replace(/\D+/g,'').slice(-15);
    guardarJson(K_CLIENTE,{nombre:nombre,telefono:tel,actualizado:Date.now()});
    setTimeout(corregirSaludo,0);
  }

  function envolverGuardadoCliente(){
    if(typeof window.guardarClienteAgenda==='function'&&!window.guardarClienteAgenda.__mgIdentidad){
      var ant=window.guardarClienteAgenda;
      var fn=function(cli){var r=ant.apply(this,arguments);try{guardarClienteLocal(cli);}catch(e){}return r;};
      fn.__mgIdentidad=VERSION;fn.__anterior=ant;window.guardarClienteAgenda=fn;
    }
  }

  function modalIdentidadAdmin(){
    if(rolReal()!=='admin'||nombreCorto(ls(K_ADMIN)))return;
    if(document.getElementById('mg-quien-admin'))return;
    var m=document.createElement('div');m.id='mg-quien-admin';
    m.style.cssText='position:fixed;inset:0;z-index:16050;background:rgba(2,12,35,.55);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px;';
    m.innerHTML='<div style="width:min(360px,94vw);background:#fff;border-radius:22px;padding:20px;box-shadow:0 22px 65px rgba(0,0,0,.3);text-align:center;font-family:inherit">'
      +'<div style="font-size:1.7rem">🐝</div><div style="font-size:1rem;font-weight:900;color:#0B2D6B;margin-top:4px">¿Quién está usando Administración?</div>'
      +'<div style="font-size:.7rem;color:#667085;margin:6px 0 15px">Lo pregunto una sola vez en este dispositivo para que Margarita te reconozca.</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:9px"><button data-n="Maxi" style="border:0;border-radius:13px;padding:13px;background:#0B2D6B;color:#fff;font-weight:900">Maxi</button><button data-n="Angie" style="border:0;border-radius:13px;padding:13px;background:#FF7A00;color:#fff;font-weight:900">Angie</button></div>'
      +'</div>';
    document.body.appendChild(m);
    m.querySelectorAll('[data-n]').forEach(function(b){b.addEventListener('click',function(){setLs(K_ADMIN,b.dataset.n);m.remove();corregirSaludo();});});
  }

  function envolverAbrir(){
    if(typeof window.margaritaAbrir!=='function'||window.margaritaAbrir.__mgIdentidad)return false;
    var ant=window.margaritaAbrir;
    var fn=function(){var r=ant.apply(this,arguments);setTimeout(function(){corregirSaludo();if(rolReal()==='admin')modalIdentidadAdmin();},35);setTimeout(corregirSaludo,220);return r;};
    fn.__mgIdentidad=VERSION;fn.__anterior=ant;window.margaritaAbrir=fn;return true;
  }

  function detectarNombreEscrito(texto){
    var t=String(texto||'').trim();var m=t.match(/(?:^|\b)(?:soy|me llamo)\s+([A-Za-zÁÉÍÓÚÑáéíóúñ]{2,32})\b/i);return m?nombreCorto(m[1]):'';
  }

  function instalarIntercepcionFetch(){
    if(window.fetch.__mgIdentidad)return;
    var orig=window.fetch.bind(window);
    var f=async function(input,init){
      try{
        var url=typeof input==='string'?input:(input&&input.url)||'';
        var metodo=String(init&&init.method||(input&&input.method)||'GET').toUpperCase();
        if(metodo==='POST'&&/\/api\/margarita(?:\?|$)/.test(url)&&init&&typeof init.body==='string'){
          var body=JSON.parse(init.body);var id=identidadActual();
          body.rol=id.rol;body.nombre=id.nombre||'';
          var ms=Array.isArray(body.mensajes)?body.mensajes:[];var ult=ms.length?String(ms[ms.length-1]&&ms[ms.length-1].texto||''):'';
          var dicho=detectarNombreEscrito(ult);
          if(dicho&&id.rol==='cliente'&&!id.nombre){guardarJson(K_CLIENTE,{nombre:dicho,telefono:'',actualizado:Date.now()});body.nombre=dicho;}
          if(dicho&&id.rol==='admin'&&(dicho==='Maxi'||dicho==='Angie')){setLs(K_ADMIN,dicho);body.nombre=dicho;}
          if(id.rol!=='admin')body.saludoEspecialPendiente=false;
          init=Object.assign({},init,{body:JSON.stringify(body)});
        }
      }catch(e){}
      return orig(input,init);
    };
    f.__mgIdentidad=VERSION;f.__original=orig;window.fetch=f;
  }

  function esperarSb(){return new Promise(function(resolve,reject){var n=0;(function tick(){if(window.sbCalc&&typeof window.sbCalc.from==='function')return resolve(window.sbCalc);if(n++>40)return reject(new Error('nube-no-lista'));setTimeout(tick,150);})();});}
  async function cargarAsesores(forzar){
    if(!forzar&&cacheAsesores&&Date.now()-cacheAsesoresTs<30000)return cacheAsesores;
    var sb=await esperarSb();var r=await sb.from('tienda_catalogo').select('datos').eq('id',ROW_ASESORES).maybeSingle();
    var d=r&&r.data&&r.data.datos&&typeof r.data.datos==='object'?r.data.datos:{};var a=Array.isArray(d.asesores)?d.asesores:[];
    cacheAsesores=a;cacheAsesoresTs=Date.now();return a;
  }
  async function guardarAsesores(a){
    var sb=await esperarSb();var datos={version:1,asesores:a,actualizado:new Date().toISOString()};var r=await sb.from('tienda_catalogo').upsert({id:ROW_ASESORES,datos:datos,actualizado:new Date().toISOString()});
    if(r&&r.error)throw r.error;cacheAsesores=a;cacheAsesoresTs=Date.now();return a;
  }

  async function hash(txt){
    var data=new TextEncoder().encode(String(txt||'').trim().toUpperCase());var d=await crypto.subtle.digest('SHA-256',data);return Array.from(new Uint8Array(d)).map(function(b){return b.toString(16).padStart(2,'0');}).join('');
  }
  function codigoNuevo(){var chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',out='';var rnd=new Uint32Array(8);crypto.getRandomValues(rnd);for(var i=0;i<8;i++)out+=chars[rnd[i]%chars.length];return out;}
  function esc(s){return String(s||'').replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]);});}

  function mostrarCodigo(nombre,codigo){
    var viejo=document.getElementById('ae-codigo-asesor');if(viejo)viejo.remove();
    var m=document.createElement('div');m.id='ae-codigo-asesor';m.style.cssText='position:fixed;inset:0;z-index:17050;background:rgba(2,12,35,.58);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px';
    m.innerHTML='<div style="width:min(390px,94vw);background:#fff;border-radius:22px;padding:20px;box-shadow:0 22px 65px rgba(0,0,0,.3);font-family:inherit;text-align:center"><div style="font-size:.68rem;font-weight:900;color:#FF7A00;text-transform:uppercase">Clave personal de asesor</div><div style="font-size:1rem;font-weight:900;color:#0B2D6B;margin-top:4px">'+esc(nombre)+'</div><div id="ae-cod-txt" style="font-size:1.55rem;letter-spacing:.18em;font-weight:900;color:#0B2D6B;background:#eef4ff;border:1px solid #d8e4f5;border-radius:13px;padding:14px;margin:14px 0">'+esc(codigo)+'</div><div style="font-size:.68rem;color:#667085;line-height:1.4;margin-bottom:12px">Mostrala o envíasela al asesor. La tienda guarda solamente su huella cifrada; después no puede mostrar esta misma clave.</div><button id="ae-cod-copy" style="width:100%;border:0;border-radius:12px;padding:12px;background:#0B2D6B;color:#fff;font-weight:900">📋 Copiar clave</button><button id="ae-cod-ok" style="width:100%;border:1px solid #dbe3ef;border-radius:12px;padding:11px;background:#fff;color:#334155;font-weight:900;margin-top:8px">Listo</button></div>';
    document.body.appendChild(m);m.querySelector('#ae-cod-ok').onclick=function(){m.remove();};m.querySelector('#ae-cod-copy').onclick=function(){navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(codigo).then(function(){m.querySelector('#ae-cod-copy').textContent='✅ Copiada';}):void 0;};
  }

  function estiloPanel(){
    if(document.getElementById('ae-asesores-style'))return;var s=document.createElement('style');s.id='ae-asesores-style';s.textContent='\
#ae-asesores-modal{position:fixed;inset:0;z-index:16500;background:rgba(2,12,35,.58);backdrop-filter:blur(6px);display:none;align-items:flex-end;justify-content:center;}#ae-asesores-modal.on{display:flex}.ae-as-panel{width:min(100%,480px);max-height:88dvh;background:#f7f9fc;border-radius:24px 24px 0 0;padding:16px 14px calc(18px + env(safe-area-inset-bottom));overflow:auto;box-shadow:0 -20px 55px rgba(0,0,0,.28)}.ae-as-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}.ae-as-title{font-size:1rem;font-weight:900;color:#0B2D6B}.ae-as-sub{font-size:.65rem;color:#667085;margin-top:2px}.ae-as-close{width:36px;height:36px;border-radius:10px;border:1px solid #dce3ed;background:#fff;color:#334155;font-size:1.1rem}.ae-as-new{display:flex;gap:7px;background:#fff;border:1px solid #e2e7ef;border-radius:15px;padding:9px;margin-bottom:12px}.ae-as-new input{flex:1;min-width:0;border:1.5px solid #d7dfeb;border-radius:10px;padding:10px;font-size:.78rem;outline:none}.ae-as-new button{border:0;border-radius:10px;background:#FF7A00;color:#fff;padding:0 12px;font-weight:900;font-size:.7rem}.ae-as-card{background:#fff;border:1px solid #e1e6ee;border-radius:15px;padding:11px;margin-bottom:8px;box-shadow:0 3px 12px rgba(11,45,107,.06)}.ae-as-top{display:flex;align-items:center;gap:9px}.ae-as-avatar{width:38px;height:38px;border-radius:50%;background:#eef4ff;color:#0B2D6B;display:flex;align-items:center;justify-content:center;font-weight:900}.ae-as-info{flex:1;min-width:0}.ae-as-name{font-size:.78rem;font-weight:900;color:#0B2D6B}.ae-as-state{font-size:.6rem;font-weight:800;margin-top:2px}.ae-as-state.on{color:#078447}.ae-as-state.off{color:#7b8492}.ae-as-switch{position:relative;width:46px;height:27px;border:0;border-radius:99px;background:#d6dbe3;padding:0}.ae-as-switch.on{background:#22c55e}.ae-as-switch:after{content:"";position:absolute;top:3px;left:3px;width:21px;height:21px;border-radius:50%;background:#fff;box-shadow:0 2px 5px rgba(0,0,0,.22);transition:transform .16s}.ae-as-switch.on:after{transform:translateX(19px)}.ae-as-actions{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:9px}.ae-as-actions button{border-radius:9px;padding:8px;border:1px solid #dce3ed;background:#fff;color:#0B2D6B;font-weight:900;font-size:.61rem}.ae-as-actions .danger{color:#c62828;background:#fff5f5;border-color:#ffd1d1}.ae-as-empty{text-align:center;padding:28px 12px;color:#7a8493;font-size:.75rem}\
';document.head.appendChild(s);
  }

  function iniciales(n){return String(n||'?').trim().split(/\s+/).slice(0,2).map(function(x){return x.charAt(0).toUpperCase();}).join('');}
  async function renderAsesores(){
    var lista=document.getElementById('ae-as-list');if(!lista)return;lista.innerHTML='<div class="ae-as-empty">Cargando asesores…</div>';
    try{var a=await cargarAsesores(true);if(!a.length){lista.innerHTML='<div class="ae-as-empty">Todavía no hay asesores personales. Creá el primero arriba.</div>';return;}lista.innerHTML='';a.forEach(function(x){var c=document.createElement('div');c.className='ae-as-card';c.innerHTML='<div class="ae-as-top"><div class="ae-as-avatar">'+esc(iniciales(x.nombre))+'</div><div class="ae-as-info"><div class="ae-as-name">'+esc(x.nombre)+'</div><div class="ae-as-state '+(x.activo?'on':'off')+'">'+(x.activo?'● Activo':'● Pausado')+'</div></div><button class="ae-as-switch '+(x.activo?'on':'')+'" aria-label="Cambiar estado"></button></div><div class="ae-as-actions"><button class="reset">🔑 Nueva clave</button><button class="danger">🗑️ Eliminar</button></div>';
          c.querySelector('.ae-as-switch').onclick=async function(){x.activo=!x.activo;await guardarAsesores(a);renderAsesores();};
          c.querySelector('.reset').onclick=async function(){var cod=codigoNuevo();x.codigoHash=await hash(cod);await guardarAsesores(a);mostrarCodigo(x.nombre,cod);};
          c.querySelector('.danger').onclick=async function(){var ok=true;try{if(typeof window.aeConfirmar==='function')ok=await window.aeConfirmar('¿Eliminar al asesor '+x.nombre+'?');else ok=confirm('¿Eliminar al asesor '+x.nombre+'?');}catch(e){}if(!ok)return;var nueva=a.filter(function(y){return y.id!==x.id;});await guardarAsesores(nueva);renderAsesores();};
          lista.appendChild(c);});}catch(e){lista.innerHTML='<div class="ae-as-empty">No pude cargar la lista. Probá de nuevo.</div>';}
  }

  function crearPanelAsesores(){
    estiloPanel();if(document.getElementById('ae-asesores-modal'))return;var m=document.createElement('div');m.id='ae-asesores-modal';m.innerHTML='<div class="ae-as-panel"><div class="ae-as-head"><div><div class="ae-as-title">👥 Asesores de ventas</div><div class="ae-as-sub">Creá usuarios, pausá accesos o generá una clave nueva.</div></div><button class="ae-as-close">×</button></div><div class="ae-as-new"><input id="ae-as-nombre" placeholder="Nombre y apellido del asesor"><button id="ae-as-crear">+ Crear</button></div><div id="ae-as-list"></div></div>';document.body.appendChild(m);m.querySelector('.ae-as-close').onclick=function(){m.classList.remove('on');};m.addEventListener('click',function(ev){if(ev.target===m)m.classList.remove('on');});m.querySelector('#ae-as-crear').onclick=async function(){var inp=m.querySelector('#ae-as-nombre'),nombre=String(inp.value||'').trim();if(nombre.length<2)return;var cod=codigoNuevo(),h=await hash(cod),a=await cargarAsesores(true);a.push({id:'as_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,6),nombre:nombre,activo:true,codigoHash:h,creado:new Date().toISOString()});await guardarAsesores(a);inp.value='';await renderAsesores();mostrarCodigo(nombre,cod);};
  }
  function abrirPanelAsesores(){if(rolReal()!=='admin')return;crearPanelAsesores();var m=document.getElementById('ae-asesores-modal');m.classList.add('on');renderAsesores();}

  function insertarBotonAdmin(){
    var sub=document.getElementById('admin-subtabs');if(!sub||document.getElementById('sub-asesores-identidad'))return false;var b=document.createElement('button');b.className='metodo-btn';b.id='sub-asesores-identidad';b.textContent='👥 Asesores';b.style.cssText='color:#0B2D6B;border-color:#dbe3ef;background:#eef4ff;font-weight:900';b.onclick=function(ev){ev.preventDefault();abrirPanelAsesores();};sub.appendChild(b);return true;
  }

  function cerrarRevNuevo(){var ov=document.getElementById('rev-overlay');if(ov)ov.style.display='none';}
  function instalarLoginAsesor(){
    if(typeof window.pedirClaveRevendedor!=='function'||window.pedirClaveRevendedor.__mgPersonal)return false;
    var pedirViejo=window.pedirClaveRevendedor;
    var validarViejo=window.validarRevendedor;
    window.pedirClaveRevendedor=async function(destino){
      window._revDestino=destino;
      var a=[];try{a=await cargarAsesores(false);}catch(e){}
      if(!a.length)return pedirViejo(destino);
      var ov=document.getElementById('rev-overlay');if(!ov){ov=document.createElement('div');ov.id='rev-overlay';document.body.appendChild(ov);}ov.style.cssText='position:fixed;inset:0;background:rgba(2,12,46,.92);z-index:2000;display:flex;align-items:center;justify-content:center;padding:24px;';ov.innerHTML='<div style="background:#fff;border-radius:18px;padding:24px;max-width:340px;width:100%;text-align:center"><div style="font-size:2rem">🐝</div><h3 style="color:#0B2D6B;font-weight:900;font-size:1.05rem;margin:6px 0">Acceso asesores de ventas</h3><p style="font-size:.75rem;color:#667085;margin-bottom:14px">Ingresá tu clave personal. Margarita va a reconocerte por tu nombre.</p><input type="password" id="rev-pass" placeholder="Clave personal" autocomplete="one-time-code" style="width:100%;text-align:center;font-size:1.05rem;letter-spacing:3px;padding:12px;border:2px solid #EBD9B4;border-radius:12px;box-sizing:border-box"><div id="rev-err" style="color:#EF4444;font-size:.75rem;font-weight:700;margin-top:8px;display:none">Clave inválida o asesor pausado</div><button id="ae-rev-entrar" style="width:100%;margin-top:14px;background:#0B2D6B;color:#fff;border:0;border-radius:12px;padding:12px;font-weight:900">Entrar →</button><button id="ae-rev-cancel" style="width:100%;margin-top:8px;background:#fff;color:#667085;border:1.5px solid #dce3ed;border-radius:12px;padding:11px;font-weight:900">Cancelar</button></div>';
      ov.querySelector('#ae-rev-cancel').onclick=cerrarRevNuevo;ov.querySelector('#ae-rev-entrar').onclick=window.validarRevendedor;ov.querySelector('#rev-pass').onkeydown=function(e){if(e.key==='Enter')window.validarRevendedor();};setTimeout(function(){ov.querySelector('#rev-pass')&&ov.querySelector('#rev-pass').focus();},80);
    };
    window.pedirClaveRevendedor.__mgPersonal=VERSION;
    window.validarRevendedor=async function(){
      var input=document.getElementById('rev-pass');if(!input)return validarViejo&&validarViejo();var a=[];try{a=await cargarAsesores(false);}catch(e){}if(!a.length)return validarViejo&&validarViejo();var h=await hash(input.value||'');var as=a.find(function(x){return x&&x.activo!==false&&x.codigoHash===h;});var err=document.getElementById('rev-err');if(!as){if(err)err.style.display='block';return;}window.revUnlocked=true;window.adminUnlocked=false;setLs('ae_sesion_rev','1');setLs('ae_sesion_admin','');setLs('ae_rol','asesor');setLs(K_ASESOR,as.nombre);setLs(K_ASESOR_ID,as.id);cerrarRevNuevo();try{if(typeof window.mostrarPestanasRev==='function')window.mostrarPestanasRev();if(typeof window.tiendaAplicarModo==='function')window.tiendaAplicarModo();if(typeof window.tiendaRender==='function')window.tiendaRender();var d=window._revDestino;if(d&&typeof window.showTab==='function')window.showTab(d);}catch(e){};
    };
    window.validarRevendedor.__mgPersonal=VERSION;return true;
  }

  function envolverCerrarSesion(){
    if(typeof window.cerrarSesion!=='function'||window.cerrarSesion.__mgIdentidad)return false;var ant=window.cerrarSesion;var fn=function(){var r=ant.apply(this,arguments);setTimeout(function(){if(ls('ae_sesion_rev')!=='1'){setLs(K_ASESOR,'');setLs(K_ASESOR_ID,'');setLs('ae_rol','');}},0);return r;};fn.__mgIdentidad=VERSION;window.cerrarSesion=fn;return true;
  }

  var intentos=0;
  function instalar(){
    instalarIntercepcionFetch();envolverGuardadoCliente();var a=envolverAbrir();var b=insertarBotonAdmin();var c=instalarLoginAsesor();envolverCerrarSesion();corregirSaludo();
    if((!a||!b||!c)&&intentos++<80)setTimeout(instalar,180);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',instalar,{once:true});else instalar();
  setTimeout(instalar,350);
})();
