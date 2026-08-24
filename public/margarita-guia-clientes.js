// Margarita Guia Clientes — V21. Solo afecta rol CLIENTE.
// Asesores y administradores conservan su flujo actual.
const MG_GUIA_KEY='ae_margarita_guia_cliente';
const MG_MAS_TARDE='ae_margarita_registro_mas_tarde';

function mgEsAdmin(){try{return (typeof window.esAdmin==='function'&&window.esAdmin())||window.tiendaEsAdmin===true||(window.adminUnlocked===true&&window.vistaPreviaCliente!==true)||localStorage.getItem('ae_rol')==='admin';}catch(e){return false;}}
function mgEsAsesor(){if(mgEsAdmin())return false;try{if(window.vistaPreviaCliente===true)return false;return window.revUnlocked===true||/asesor|revendedor|vendedor/i.test(String(localStorage.getItem('ae_rol')||''));}catch(e){return false;}}
function mgEsCliente(){return !mgEsAdmin()&&!mgEsAsesor();}
function mgNorm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();}
function mgPintar(t){window.margaritaPintar?.('margarita',t);}
function mgUsuario(t){window.margaritaPintar?.('cliente',t);}
function mgDatos(){try{return JSON.parse(localStorage.getItem(MG_GUIA_KEY)||'null');}catch(e){return null;}}
function mgGuardarLocal(d){try{localStorage.setItem(MG_GUIA_KEY,JSON.stringify(d));}catch(e){}}

const MG_CATS=[
 ['TV y video',/\b(tv|tele|televisor|smart tv|google tv|android tv|qled|oled|proyector)\b/],
 ['Celulares',/\b(celu|celular|telefono|smartphone|iphone|samsung|motorola|xiaomi|redmi|infinix|tecno)\b/],
 ['Audio',/\b(audio|parlante|bafle|torre|home theater|soundbar|barra de sonido|auricular|karaoke)\b/],
 ['Cargadores y accesorios',/\b(cargador|cable|tipo c|usb c|powerbank|funda|vidrio templado|adaptador)\b/],
 ['Refrigeración',/\b(heladera|freezer|congelador|exhibidora|dispenser)\b/],
 ['Climatización',/\b(aire acondicionado|split|estufa|calefactor|caloventor|ventilador|termotanque)\b/],
 ['Cocción',/\b(cocina|horno|microondas|anafe|freidora|air fryer|parrilla|grill)\b/],
 ['Lavado',/\b(lavarropas|lavarropa|secarropas|lavavajillas|centrifug)\b/],
 ['Herramientas',/\b(taladro|amoladora|atornillador|soldadora|motosierra|compresor|engrapadora|encoladora|llave de impacto)\b/],
 ['Informática',/\b(notebook|computadora|pc|impresora|teclado|mouse|router|webcam)\b/],
 ['Gaming',/\b(gaming|gamer|playstation|ps5|ps4|xbox|nintendo|consola|joystick)\b/],
 ['Juguetes',/\b(juguete|muneca|muñeca|robot|hidrogel|juego infantil)\b/],
 ['Deportes y movilidad',/\b(bicicleta|bici|monopatin|patin|patines|patineta|pesas|mancuerna)\b/],
 ['Muebles',/\b(mueble|ropero|placard|comoda|mesa|silla|sillon|escritorio|rack)\b/],
 ['Colchones y sommiers',/\b(colchon|sommier|somier)\b/],
 ['Hogar y deco',/\b(hogar|deco|decoracion|lampara|velador|alfombra|organizador)\b/]
];
function mgCategoria(q){const n=mgNorm(q);return MG_CATS.find(x=>x[1].test(n))?.[0]||'';}
function mgFiltrar(cat){if(!cat)return;try{window.dispatchEvent(new CustomEvent('margarita:buscar',{detail:{categoria:cat,texto:cat}}));}catch(e){}try{if(typeof window.tiendaFiltrarCat==='function')window.tiendaFiltrarCat(cat);}catch(e){}}
function mgBotonesContacto(){setTimeout(()=>{const msgs=document.getElementById('margarita-msgs');if(!msgs)return;const box=document.createElement('div');box.className='mg-guia-contactos';box.innerHTML='<button data-mg-contacto="maxi">Hablar con Maxi</button><button data-mg-contacto="angie">Hablar con Angie</button><small>Si ya tenés un asesor asignado, escribile a él y te va a guiar.</small>';msgs.appendChild(box);box.querySelectorAll('button').forEach(b=>b.onclick=()=>{window.dispatchEvent(new CustomEvent('margarita:contacto',{detail:{persona:b.dataset.mgContacto}}));mgPintar('Perfecto 😊 Te derivo con el equipo para que continúen con vos.');});msgs.scrollTop=msgs.scrollHeight;},30);}
function mgOfrecerRegistro(){if(!mgEsCliente()||mgDatos())return;try{if(sessionStorage.getItem(MG_MAS_TARDE)==='1')return;}catch(e){}setTimeout(()=>{mgPintar('¡Hola! 😊 Soy Margarita. ¿Querés que te registre ahora? Son 10 segundos y así te podemos atender mejor. Si preferís, lo hacemos más adelante y seguimos viendo la tienda tranquilo.');const msgs=document.getElementById('margarita-msgs');if(!msgs)return;const box=document.createElement('div');box.className='mg-guia-registro-opciones';box.innerHTML='<button data-r="si">Registrarme ahora</button><button data-r="no">Más tarde</button>';msgs.appendChild(box);box.querySelector('[data-r="si"]').onclick=()=>mgFormulario();box.querySelector('[data-r="no"]').onclick=()=>{try{sessionStorage.setItem(MG_MAS_TARDE,'1');}catch(e){}box.remove();mgPintar('Perfecto 😊 Seguimos tranquilo. ¿En qué te puedo ayudar con la tienda?');};msgs.scrollTop=msgs.scrollHeight;},450);}
function mgFormulario(){const msgs=document.getElementById('margarita-msgs');if(!msgs)return;msgs.querySelector('.mg-guia-registro-opciones')?.remove();const box=document.createElement('div');box.className='mg-guia-form';box.innerHTML='<strong>Registro rápido</strong><input name="nombre" placeholder="Nombre" maxlength="60"><input name="apellido" placeholder="Apellido" maxlength="60"><input name="telefono" placeholder="Teléfono" inputmode="tel" maxlength="24"><label><input type="checkbox" name="promos"> Quiero recibir novedades y ofertas</label><small>Usamos tus datos solo para contactarte desde AmarangoElectro. Podés pedir la baja cuando quieras.</small><button type="button">Guardar mis datos</button><div class="mg-guia-error"></div>';msgs.appendChild(box);box.querySelector('button').onclick=async()=>{const nombre=box.querySelector('[name=nombre]').value.trim(),apellido=box.querySelector('[name=apellido]').value.trim(),telefono=box.querySelector('[name=telefono]').value.trim(),promos=box.querySelector('[name=promos]').checked,err=box.querySelector('.mg-guia-error');if(nombre.length<2||apellido.length<2){err.textContent='Completá nombre y apellido.';return;}if(telefono.replace(/\D/g,'').length<8){err.textContent='Revisá el número de teléfono.';return;}err.textContent='Guardando…';try{if(!window.sbCalc)throw new Error('sin conexion');const r=await window.sbCalc.rpc('margarita_registrar_cliente_guia',{p_nombre:nombre,p_apellido:apellido,p_telefono:telefono,p_acepta_promos:promos});if(r.error)throw r.error;mgGuardarLocal({nombre,apellido,telefono});box.remove();mgPintar(`¡Listo, ${nombre}! 😊 Ya quedaste registrado. ¿En qué te puedo servir?`);}catch(e){err.textContent='No pude guardar tus datos ahora. Podés seguir usando la tienda y probar más tarde.';}};msgs.scrollTop=msgs.scrollHeight;}

function mgResponder(texto){const n=mgNorm(texto),cat=mgCategoria(texto);if(cat){mgFiltrar(cat);if(/\b(precio|sale|cuanto|cuanto sale|stock|modelo)\b/.test(n)){mgPintar(`Los precios y el stock final te los confirman Maxi o Angie 😊 Mientras tanto podés mirar la categoría ${cat}. ¿Querés que te pase el contacto?`);mgBotonesContacto();return;}mgPintar(`¡Sí! 😊 Fijate en la categoría ${cat}. Ahí podés ver lo que tenemos disponible en la tienda.`);return;}
 if(/\b(entrega|entregan|demora|cuando llega|cuanto tardan)\b/.test(n)){mgPintar('Entregamos dentro de las 48hs después del pago de la primera cuota 😊 Si elegís el plan de 2, 4 o 6 cuotas, con la primera ya coordinamos la entrega.');return;}
 if(/\b(cuotas|financ|tarjeta|banco|contado|forma de compra)\b/.test(n)){mgPintar('Podés comprar de contado o en 2, 4 o 6 cuotas fijas, sin banco ni tarjeta 😊 Los precios finales te los confirma el equipo.');return;}
 if(/\b(comprar|compro|quiero cerrar|reservar|pagar|link de pago|transferir)\b/.test(n)){mgPintar('Claro 😊 Para cerrar la compra, confirmar stock o coordinar el pago te paso con el equipo. Yo no cobro ni envío links de pago.');mgBotonesContacto();return;}
 if(/\b(registr|registro|mis datos)\b/.test(n)){mgFormulario();return;}
 if(/\b(hola|buenas|buen dia|buenas tardes|buenas noches|como estas)\b/.test(n)){const d=mgDatos();mgPintar(d?.nombre?`¡Hola ${d.nombre}! 😊 Todo bien por acá. ¿En qué te puedo servir hoy?`:'¡Hola! 😊 Todo bien por acá. ¿Qué estabas buscando en la tienda?');return;}
 if(/\b(gracias|genial|joya|jaja|jeje|como va|todo bien)\b/.test(n)){mgPintar('¡Jaja, gracias! 😄 Todo bien por acá. Contame, ¿estabas buscando algo para la casa o querés que te guíe por la tienda?');return;}
 mgPintar('Te doy una mano 😊 Decime qué tipo de producto estás buscando o qué parte de la tienda querés usar, y te indico dónde encontrarlo. Si necesitás precio, stock puntual o cerrar una compra, te paso con el equipo.');}

function instalar(){const style=document.createElement('style');style.textContent='.mg-guia-registro-opciones,.mg-guia-contactos{display:flex;gap:7px;flex-wrap:wrap;margin:6px 8px 10px 48px}.mg-guia-registro-opciones button,.mg-guia-contactos button,.mg-guia-form button{border:0;border-radius:999px;padding:9px 12px;background:#0B2D6B;color:#fff;font:700 12px inherit}.mg-guia-contactos small{width:100%;font-size:10px;color:#64748b}.mg-guia-form{margin:7px 8px 12px 48px;background:#fff;border-radius:14px;padding:10px;display:grid;gap:7px;box-shadow:0 2px 10px #0001}.mg-guia-form input[type=text],.mg-guia-form input[name=nombre],.mg-guia-form input[name=apellido],.mg-guia-form input[name=telefono]{border:1px solid #dbe4ef;border-radius:9px;padding:9px;min-width:0}.mg-guia-form label,.mg-guia-form small{font-size:10px;color:#475569}.mg-guia-error{font-size:10px;color:#b42318;min-height:12px}';document.head.appendChild(style);
 const input=document.getElementById('margarita-input');if(!input)return;const original=window.margaritaEnviar;window.margaritaEnviar=function(){if(!mgEsCliente())return original?.();const texto=String(input.value||'').trim();if(!texto)return;mgUsuario(texto);input.value='';mgResponder(texto);};input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&mgEsCliente()){e.preventDefault();e.stopImmediatePropagation();window.margaritaEnviar();}},true);
 const fab=document.getElementById('margarita-fab');fab?.addEventListener('click',()=>{if(mgEsCliente())setTimeout(mgOfrecerRegistro,120);});
 window.margaritaGuiaOfrecerRegistro=mgOfrecerRegistro;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(instalar,0),{once:true});else setTimeout(instalar,0);
