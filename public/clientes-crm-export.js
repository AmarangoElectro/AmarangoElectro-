/* AmarangoElectro · exportación rápida de clientes para CRM (solo Admin) */
(function(){
  'use strict';
  var VERSION='clientes-crm-export-2026-08-24-2';
  if(window.__AE_CLIENTES_CRM_EXPORT__===VERSION)return;
  window.__AE_CLIENTES_CRM_EXPORT__=VERSION;
  var intentos=0;
  function admin(){try{return window.adminUnlocked===true||window.tiendaEsAdmin===true||(document.body&&document.body.classList.contains('rol-admin'));}catch(e){return false;}}
  function clientes(){try{return typeof window.cargarClientesTienda==='function'?(window.cargarClientesTienda()||[]):[];}catch(e){return [];}}
  function s(v){return String(v==null?'':v).trim();}
  function q(v){v=s(v).replace(/"/g,'""');return '"'+v+'"';}
  function lineaCRM(c){
    var out=[];
    out.push('Nombre: '+s(c.nombre));
    if(c.apodo)out.push('Nombre preferido: '+s(c.apodo));
    if(c.telefono||c.tel)out.push('Teléfono: '+s(c.telefono||c.tel));
    if(c.dni)out.push('DNI: '+s(c.dni));
    if(c.mail||c.email)out.push('Email: '+s(c.mail||c.email));
    if(c.domicilio||c.dir)out.push('Dirección: '+s(c.domicilio||c.dir));
    if(c.localidad||c.loc)out.push('Localidad: '+s(c.localidad||c.loc));
    if(c.redTipo||c.redUser)out.push('Red: '+[s(c.redTipo),s(c.redUser)].filter(Boolean).join(' '));
    if(c.ingresos)out.push('Relación/ingresos: '+s(c.ingresos));
    out.push('Promociones por WhatsApp: '+(c.aceptaPromos===true?'Sí':'No'));
    out.push('Regalo primera compra: '+(c.regaloPendiente===true?'PENDIENTE':'No pendiente'));
    if(c.regaloDescripcion)out.push('Regalo: '+s(c.regaloDescripcion));
    out.push('Cliente tibio: '+(c.clienteTibio===true?'Sí':'No'));
    if(c.origenRegistro||c.origenAlta)out.push('Origen: '+s(c.origenRegistro||c.origenAlta));
    return out.join('\n');
  }
  function copiar(){
    var a=clientes();if(!a.length)return toast('No hay clientes para copiar.');
    var txt=a.map(function(c,i){return 'CLIENTE '+(i+1)+'\n'+lineaCRM(c);}).join('\n\n--------------------\n\n');
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(function(){toast('✅ Clientes copiados para CRM');}).catch(function(){fallback(txt);});else fallback(txt);
  }
  function copiarWhatsApp(){
    var a=clientes().filter(function(c){return c&&c.aceptaPromos===true&&(c.telefono||c.tel);});
    if(!a.length)return toast('No hay contactos con consentimiento de WhatsApp.');
    var txt=a.map(function(c){return s(c.nombre)+' — '+s(c.telefono||c.tel);}).join('\n');
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(function(){toast('📲 Lista WhatsApp copiada');}).catch(function(){fallback(txt);});else fallback(txt);
  }
  function fallback(txt){var t=document.createElement('textarea');t.value=txt;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();try{document.execCommand('copy');toast('✅ Copiado');}catch(e){toast('No se pudo copiar.');}t.remove();}
  function descargar(){
    var a=clientes();if(!a.length)return toast('No hay clientes para descargar.');
    var cols=['Nombre','Nombre preferido','Telefono','DNI','Email','Direccion','Localidad','Red','Usuario red','Relacion/Ingresos','Acepta promociones','Regalo pendiente','Regalo descripcion','Cliente tibio','Origen','Creado','Actualizado'];
    var rows=[cols.map(q).join(',')];
    a.forEach(function(c){rows.push([c.nombre,c.apodo,c.telefono||c.tel,c.dni,c.mail||c.email,c.domicilio||c.dir,c.localidad||c.loc,c.redTipo,c.redUser,c.ingresos,c.aceptaPromos===true?'Si':'No',c.regaloPendiente===true?'Si':'No',c.regaloDescripcion,c.clienteTibio===true?'Si':'No',c.origenRegistro||c.origenAlta,c.creado,c.actualizado].map(q).join(','));});
    var blob=new Blob(['\ufeff'+rows.join('\r\n')],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),ael=document.createElement('a');ael.href=url;ael.download='clientes-amarangoelectro-'+new Date().toISOString().slice(0,10)+'.csv';document.body.appendChild(ael);ael.click();ael.remove();setTimeout(function(){URL.revokeObjectURL(url);},1200);toast('⬇️ Archivo para CRM preparado');
  }
  function toast(msg){var id='ae-crm-toast',t=document.getElementById(id);if(!t){t=document.createElement('div');t.id=id;t.style.cssText='position:fixed;left:50%;bottom:92px;transform:translate(-50%,12px);z-index:19000;background:#0B2D6B;color:#fff;border-bottom:3px solid #FF7A00;border-radius:12px;padding:10px 13px;font:850 .68rem system-ui;box-shadow:0 10px 28px rgba(0,0,0,.25);opacity:0;transition:.18s;max-width:88vw;text-align:center';document.body.appendChild(t);}t.textContent=msg;t.style.opacity='1';t.style.transform='translate(-50%,0)';clearTimeout(t.__x);t.__x=setTimeout(function(){t.style.opacity='0';t.style.transform='translate(-50%,12px)';},2400);}
  function ponerBarra(){
    if(!admin())return;var modal=document.getElementById('modal-cuotas');if(!modal||getComputedStyle(modal).display==='none')return;
    if(modal.querySelector('#ae-crm-export-bar'))return;
    var titulo=[].slice.call(modal.querySelectorAll('h1,h2,h3')).find(function(x){return /clientes registrados/i.test(x.textContent||'');});if(!titulo)return;
    var todos=clientes();var regalos=todos.filter(function(c){return c&&c.regaloPendiente===true;}).length;var promos=todos.filter(function(c){return c&&c.aceptaPromos===true;}).length;
    var resumen=document.createElement('div');resumen.id='ae-crm-resumen';resumen.style.cssText='display:flex;gap:7px;flex-wrap:wrap;margin:8px 0 10px';resumen.innerHTML='<span style="background:#FFF4E6;border:1px solid #FFD09B;color:#B45309;border-radius:999px;padding:6px 9px;font:900 .6rem inherit">🎁 '+regalos+' regalos pendientes</span><span style="background:#ECFDF5;border:1px solid #A7F3D0;color:#047857;border-radius:999px;padding:6px 9px;font:900 .6rem inherit">📲 '+promos+' WhatsApp autorizados</span>';titulo.insertAdjacentElement('afterend',resumen);
    var b=document.createElement('div');b.id='ae-crm-export-bar';b.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:9px 0 12px';b.innerHTML='<button id="ae-crm-copy" type="button" style="border:0;border-radius:11px;padding:10px;background:#0B2D6B;color:#fff;font:900 .68rem inherit">📋 Copiar para CRM</button><button id="ae-crm-csv" type="button" style="border:0;border-radius:11px;padding:10px;background:#16a34a;color:#fff;font:900 .68rem inherit">⬇️ Descargar CSV</button><button id="ae-crm-wa" type="button" style="grid-column:1/-1;border:0;border-radius:11px;padding:10px;background:#25D366;color:#fff;font:900 .68rem inherit">📲 Copiar lista WhatsApp autorizada</button>';resumen.insertAdjacentElement('afterend',b);b.querySelector('#ae-crm-copy').onclick=copiar;b.querySelector('#ae-crm-csv').onclick=descargar;b.querySelector('#ae-crm-wa').onclick=copiarWhatsApp;
  }
  function envolver(){
    var f=window.tiendaClientesRender;if(typeof f!=='function'){if(intentos++<80)setTimeout(envolver,150);return;}if(f.__aeCrm)return;
    var w=function(){var r=f.apply(this,arguments);setTimeout(ponerBarra,0);return r;};w.__aeCrm=VERSION;w.__anterior=f;window.tiendaClientesRender=w;setTimeout(ponerBarra,300);
  }
  window.AmarangoCRMExport={copiar:copiar,descargarCSV:descargar,copiarWhatsApp:copiarWhatsApp};
  envolver();
})();