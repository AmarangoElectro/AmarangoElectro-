// Margarita Guia V21 — misma guia conversacional para toda la tienda.
// No busca ni recomienda productos puntuales. Solo orienta, informa y deriva.
const MG_GUIA_KEY='ae_margarita_guia_cliente';
const MG_MAS_TARDE='ae_margarita_registro_mas_tarde';
const MG_MAXI='5491168610532';
const MG_ANGIE='5491168746034';

function mgNorm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();}
function mgDatos(){try{return JSON.parse(localStorage.getItem(MG_GUIA_KEY)||'null');}catch(e){return null;}}
function mgGuardarLocal(d){try{localStorage.setItem(MG_GUIA_KEY,JSON.stringify(d));}catch(e){}}
function mgUsuario(t){window.margaritaPintar?.('cliente',t);}
function mgPintarAhora(t){window.margaritaPintar?.('margarita',t);const m=document.getElementById('margarita-msgs');if(m)m.scrollTop=m.scrollHeight;}
function mgResponderConPausa(t,min=260,max=520){window.margaritaEscribiendo?.(true);const ms=Math.max(min,Math.min(max,220+String(t||'').length*2));setTimeout(()=>{window.margaritaEscribiendo?.(false);mgPintarAhora(t);},ms);}
function mgNombre(){return mgDatos()?.nombre||'';}
function mgConNombre(t){const n=mgNombre();return n?`${n}, ${t.charAt(0).toLowerCase()+t.slice(1)}`:t;}

const MG_CATS=[
 ['TV y video',/\b(tv|tele|televisor|televisores|smart tv|google tv|android tv|qled|oled|proyector)\b/],
 ['Celulares',/\b(celu|celular|celulares|telefono|smartphone|iphone|samsung|motorola|xiaomi|redmi|infinix|tecno)\b/],
 ['Audio',/\b(audio|parlante|parlantes|bafle|torre|home theater|soundbar|barra de sonido|auricular|karaoke)\b/],
 ['Cargadores y accesorios',/\b(cargador|cargadores|cable|tipo c|usb c|powerbank|funda|vidrio templado|adaptador)\b/],
 ['Refrigeración',/\b(heladera|heladeras|freezer|congelador|exhibidora|dispenser)\b/],
 ['Climatización',/\b(aire acondicionado|aires|split|estufa|calefactor|caloventor|ventilador|termotanque)\b/],
 ['Cocción',/\b(cocina|cocinas|horno|microondas|anafe|freidora|air fryer|parrilla|grill)\b/],
 ['Lavado',/\b(lavarropas|lavarropa|secarropas|lavavajillas|centrifug)\b/],
 ['Herramientas',/\b(herramienta|herramientas|taladro|amoladora|atornillador|soldadora|motosierra|compresor|engrapadora|encoladora|llave de impacto)\b/],
 ['Informática',/\b(notebook|computadora|pc|impresora|teclado|mouse|router|webcam)\b/],
 ['Gaming',/\b(gaming|gamer|playstation|ps5|ps4|xbox|nintendo|consola|joystick)\b/],
 ['Juguetes',/\b(juguete|juguetes|muneca|muñeca|robot|hidrogel|juego infantil)\b/],
 ['Deportes y movilidad',/\b(bicicleta|bici|monopatin|patin|patines|patineta|pesas|mancuerna)\b/],
 ['Muebles',/\b(mueble|muebles|ropero|placard|comoda|mesa|silla|sillon|escritorio|rack)\b/],
 ['Colchones y sommiers',/\b(colchon|colchones|sommier|somier)\b/],
 ['Hogar y deco',/\b(hogar|deco|decoracion|lampara|velador|alfombra|organizador)\b/]
];
function mgCategoria(q){const n=mgNorm(q);return MG_CATS.find(x=>x[1].test(n))?.[0]||'';}
function mgCatProducto(p){try{return String(typeof window.catProd==='function'?window.catProd(p)||p.categoria||'':p.categoria||'');}catch(e){return String(p?.categoria||'');}}
function mgCatTiene(cat){const n=mgNorm(cat);let total=0;try{(window.tiendaProductos||[]).forEach(p=>{let ok=true;try{if(typeof window.tiendaEstaVisibleYConStock==='function')ok=!!window.tiendaEstaVisibleYConStock(p);}catch(e){}if(ok&&mgNorm(mgCatProducto(p)).includes(n))total++;});}catch(e){}try{if(cat==='Celulares'&&typeof window.cargarListaCelus==='function')total+=(window.cargarListaCelus()||[]).filter(c=>c&&Number(c.precio)&&!c.ocultoTienda&&!c.sinStock).length;}catch(e){}return total>0;}
function mgFiltrar(cat){if(!cat)return;try{window.dispatchEvent(new CustomEvent('margarita:buscar',{detail:{categoria:cat,texto:cat}}));}catch(e){}try{if(typeof window.tiendaFiltrarCat==='function')window.tiendaFiltrarCat(cat);}catch(e){}}

function mgAbrirWhatsApp(numero){const texto='Hola, vengo desde la tienda de AmarangoElectro y necesito ayuda.';window.open(`https://wa.me/${numero}?text=${encodeURIComponent(texto)}`,'_blank','noopener');}
function mgBotonesContacto(){setTimeout(()=>{const msgs=document.getElementById('margarita-msgs');if(!msgs)return;msgs.querySelector('.mg-guia-contactos')?.remove();const box=document.createElement('div');box.className='mg-guia-contactos';box.innerHTML='<button data-mg-contacto="maxi">Hablar con Maxi</button><button data-mg-contacto="angie">Hablar con Angie</button><small>Si ya tenés un asesor asignado, comunicate directamente a su número y te va a ayudar.</small>';msgs.appendChild(box);box.querySelector('[data-mg-contacto="maxi"]').onclick=()=>mgAbrirWhatsApp(MG_MAXI);box.querySelector('[data-mg-contacto="angie"]').onclick=()=>mgAbrirWhatsApp(MG_ANGIE);msgs.scrollTop=msgs.scrollHeight;},40);}

function mgOfrecerRegistro(){if(mgDatos())return;try{if(sessionStorage.getItem(MG_MAS_TARDE)==='1')return;}catch(e){}setTimeout(()=>{const msgs=document.getElementById('margarita-msgs');if(!msgs||msgs.querySelector('.mg-guia-registro-opciones'))return;mgResponderConPausa('Bienvenido a AmarangoElectro 😊 Soy Margarita. Si querés, puedo registrarte en unos segundos para que la próxima vez te salude por tu nombre.');setTimeout(()=>{const box=document.createElement('div');box.className='mg-guia-registro-opciones';box.innerHTML='<button data-r="si">Registrarme ahora</button><button data-r="no">Más tarde</button>';msgs.appendChild(box);box.querySelector('[data-r="si"]').onclick=()=>mgFormulario();box.querySelector('[data-r="no"]').onclick=()=>{try{sessionStorage.setItem(MG_MAS_TARDE,'1');}catch(e){}box.remove();mgResponderConPausa('Perfecto 😊 Seguimos con la tienda. ¿En qué te puedo ayudar?');};msgs.scrollTop=msgs.scrollHeight;},560);},180);}
function mgFormulario(){const msgs=document.getElementById('margarita-msgs');if(!msgs)return;msgs.querySelector('.mg-guia-registro-opciones')?.remove();msgs.querySelector('.mg-guia-form')?.remove();const box=document.createElement('div');box.className='mg-guia-form';box.innerHTML='<strong>Registro rápido</strong><input name="nombre" placeholder="Nombre" maxlength="60"><input name="apellido" placeholder="Apellido" maxlength="60"><input name="telefono" placeholder="Teléfono" inputmode="tel" maxlength="24"><label><input type="checkbox" name="promos"> Quiero recibir novedades y ofertas</label><small>Usamos tus datos solo para contactarte desde AmarangoElectro. Podés pedir la baja cuando quieras.</small><button type="button">Guardar mis datos</button><div class="mg-guia-error"></div>';msgs.appendChild(box);box.querySelector('button').onclick=async()=>{const nombre=box.querySelector('[name=nombre]').value.trim(),apellido=box.querySelector('[name=apellido]').value.trim(),telefono=box.querySelector('[name=telefono]').value.trim(),promos=box.querySelector('[name=promos]').checked,err=box.querySelector('.mg-guia-error');if(nombre.length<2||apellido.length<2){err.textContent='Completá nombre y apellido.';return;}if(telefono.replace(/\D/g,'').length<8){err.textContent='Revisá el número de teléfono.';return;}err.textContent='Guardando…';try{if(!window.sbCalc)throw new Error('sin conexion');const r=await window.sbCalc.rpc('margarita_registrar_cliente_guia',{p_nombre:nombre,p_apellido:apellido,p_telefono:telefono,p_acepta_promos:promos});if(r.error)throw r.error;mgGuardarLocal({nombre,apellido,telefono});box.remove();mgResponderConPausa(`¡Listo, ${nombre}! 😊 Ya te voy a recordar por tu nombre. ¿En qué te puedo ayudar con la tienda?`);}catch(e){err.textContent='No pude guardar tus datos ahora. Podés seguir usando la tienda y probar más tarde.';}};msgs.scrollTop=msgs.scrollHeight;}

function mgAyudaTienda(){mgResponderConPausa(mgConNombre('podés usar el buscador de arriba o tocar una categoría. En cada tarjeta ves las cuotas; tocando el producto entrás al detalle y tocando la foto la podés ampliar para ver mejor las características. También podés compartir la tienda desde el botón de compartir 😊'));}
function mgCerrarConversacion(){mgResponderConPausa('Perfecto 😊 Te dejo seguir mirando la tienda. Cualquier cosita, estoy acá. ¡Y si te gustó, no te olvides de compartir AmarangoElectro para que nos conozcan!');setTimeout(()=>window.margaritaCerrar?.(),900);}
async function mgFallbackIA(texto){try{window.margaritaEscribiendo?.(true);const contexto='Actuá SOLO como guía de la tienda AmarangoElectro. No busques, no listes, no compares ni recomiendes productos puntuales. Respondé breve, natural y argentino. Podés orientar sobre buscador, categorías, tarjetas, fotos, cuotas, entrega y derivar al equipo. Si la charla se va de tema, respondé una línea con simpatía y volvé suavemente a la tienda. Mensaje del usuario: '+texto;const r=await fetch('/api/margarita',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mensajes:[{rol:'usuario',texto:contexto}],productos:[],rol:'cliente',nombre:mgNombre(),taxonomia:MG_CATS.map(x=>x[0])})});const d=await r.json();window.margaritaEscribiendo?.(false);let resp=String(d?.respuesta||'').trim();if(!resp||/no encuentro ese producto/i.test(resp))resp='Te doy una mano 😊 Decime qué parte de la tienda querés usar y te indico dónde encontrarla.';mgPintarAhora(resp);}catch(e){window.margaritaEscribiendo?.(false);mgResponderConPausa('Te doy una mano 😊 Decime qué parte de la tienda querés usar y te indico dónde encontrarla.');}}

function mgResponder(texto){const n=mgNorm(texto),cat=mgCategoria(texto);
 if(cat){const hay=mgCatTiene(cat);if(hay){mgFiltrar(cat);mgResponderConPausa(mgConNombre(`sí, tenemos opciones en ${cat} 😊 Te llevo a esa categoría para que las veas. Yo no te voy a elegir un producto por vos, pero sí te puedo ayudar a moverte por la tienda.`));}else{mgResponderConPausa(mgConNombre(`ahora mismo no veo productos disponibles en ${cat}. Si querés, te dejo los contactos de Maxi y Angie para que el equipo te lo busque.`));mgBotonesContacto();}return;}
 if(/\b(precio|sale|cuanto|cuanto sale|stock|modelo|hay stock)\b/.test(n)){mgResponderConPausa('Los precios y el stock puntual te los confirma directamente el equipo 😊');mgBotonesContacto();return;}
 if(/\b(entrega|entregan|demora|cuando llega|cuanto tardan)\b/.test(n)){mgResponderConPausa(mgConNombre('las entregas se coordinan dentro de las 48 horas posteriores al pago de la primera cuota, según el plan elegido 😊'));return;}
 if(/\b(cuotas|financ|tarjeta|banco|contado|forma de compra)\b/.test(n)){mgResponderConPausa(mgConNombre('podés comprar de contado o en 2, 4 o 6 cuotas fijas. Para confirmar el importe exacto, te ayuda el equipo.'));return;}
 if(/\b(comprar|compro|quiero cerrar|reservar|pagar|link de pago|transferir)\b/.test(n)){mgResponderConPausa('Para cerrar la compra, confirmar stock o coordinar el pago te paso directamente con Maxi o Angie. Yo no cobro ni envío links de pago 😊');mgBotonesContacto();return;}
 if(/\b(registr|registro|registrarme|mis datos|como me llamo)\b/.test(n)){mgFormulario();return;}
 if(/\b(buscar|buscador|categoria|categorias|foto|fotos|tarjeta|tarjetas|caracteristica|caracteristicas|como uso|como funciona|ayuda|compartir)\b/.test(n)){mgAyudaTienda();return;}
 if(/^(no|no gracias|listo|nada mas|nada más|ya esta|ya está|chau|gracias eso es todo)$/.test(n)){mgCerrarConversacion();return;}
 if(/\b(hola|buenas|buen dia|buenas tardes|buenas noches|como estas|como va)\b/.test(n)){const nombre=mgNombre();mgResponderConPausa(nombre?`¡Hola ${nombre}! 😊 Bienvenido de nuevo a AmarangoElectro. ¿En qué te puedo ayudar?`:'¡Bienvenido a AmarangoElectro! 😊 Soy Margarita. ¿En qué te puedo ayudar?');return;}
 if(/\b(gracias|genial|joya|jaja|jeje|todo bien)\b/.test(n)){mgResponderConPausa(mgConNombre('¡un gusto! 😊 Si querés, te sigo guiando por la tienda.'));return;}
 mgFallbackIA(texto);
}

function instalar(){const style=document.createElement('style');style.id='mg-guia-v21-css';style.textContent='.mg-guia-registro-opciones,.mg-guia-contactos{display:flex;gap:7px;flex-wrap:wrap;margin:6px 8px 10px 48px}.mg-guia-registro-opciones button,.mg-guia-contactos button,.mg-guia-form button{border:0;border-radius:999px;padding:9px 12px;background:#0B2D6B;color:#fff;font:700 12px inherit}.mg-guia-contactos small{width:100%;font-size:10px;color:#64748b}.mg-guia-form{margin:7px 8px 12px 48px;background:#fff;border-radius:14px;padding:10px;display:grid;gap:7px;box-shadow:0 2px 10px #0001}.mg-guia-form input{border:1px solid #dbe4ef;border-radius:9px;padding:9px;min-width:0}.mg-guia-form label,.mg-guia-form small{font-size:10px;color:#475569}.mg-guia-error{font-size:10px;color:#b42318;min-height:12px}';document.head.appendChild(style);
 const input=document.getElementById('margarita-input');if(!input)return;window.margaritaEnviar=function(){const texto=String(input.value||'').trim();if(!texto)return;mgUsuario(texto);input.value='';mgResponder(texto);};input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();e.stopImmediatePropagation();window.margaritaEnviar();}},true);
 const fab=document.getElementById('margarita-fab');fab?.addEventListener('click',()=>setTimeout(()=>{if(!mgDatos())mgOfrecerRegistro();else if(!document.getElementById('margarita-msgs')?.querySelector('.margarita-bot'))mgResponderConPausa(`¡Hola ${mgNombre()}! 😊 Bienvenido de nuevo a AmarangoElectro. ¿En qué te puedo ayudar?`);},120));
 window.margaritaGuiaOfrecerRegistro=mgOfrecerRegistro;window.margaritaGuiaAyuda=mgAyudaTienda;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(instalar,0),{once:true});else setTimeout(instalar,0);
