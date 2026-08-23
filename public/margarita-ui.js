export const MARGARITA_AVATAR = "/margarita-avatar.webp";

const VERSION = "sidebar-2026-08-23-9";
const UI_KEY = "ae_margarita_ui_formato";
const PRUEBA_KEY = "ae_margarita_prueba_hasta";
const UI_CLOUD_ID = "margarita_ui";

function instalarMargarita() {
  const overlay = document.getElementById("margarita-overlay");
  const fab = document.getElementById("margarita-fab");
  const mensajes = document.getElementById("margarita-msgs");
  const input = document.getElementById("margarita-input");
  if (!overlay || !fab || !mensajes || !input) return;

  const panel = overlay.firstElementChild;
  if (!panel) return;
  panel.id = "margarita-panel";
  const header = panel.children[0] || null;
  const inputBar = panel.children[2] || null;
  if (header) header.classList.add("mg-header");
  mensajes.classList.add("mg-mensajes");
  if (inputBar) inputBar.classList.add("mg-input");

  let formato = "mitad";
  try {
    const f = localStorage.getItem(UI_KEY);
    if (f === "mitad" || f === "globo") formato = f;
  } catch (e) {}

  let nombreSesion = "";
  let saludoEspecialHecho = false;

  const style = document.createElement("style");
  style.id = "margarita-sidebar-estilos";
  style.textContent = `
    #margarita-overlay{position:fixed!important;inset:0!important;z-index:9998!important;background:rgba(2,8,20,.42)!important;backdrop-filter:blur(7px)!important;-webkit-backdrop-filter:blur(7px)!important;opacity:0!important;pointer-events:none!important;transition:opacity .2s ease!important}
    #margarita-overlay.abierto{opacity:1!important;pointer-events:auto!important}
    #margarita-panel{position:fixed!important;right:0!important;left:auto!important;min-height:0!important;background:#ECE5DD!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;border:1px solid rgba(255,255,255,.32)!important;box-shadow:-18px 0 46px rgba(0,0,0,.28)!important;transition:transform .25s cubic-bezier(.4,0,.2,1),width .18s ease!important}
    html[data-margarita-formato="mitad"] #margarita-panel{top:0!important;bottom:auto!important;width:clamp(210px,58vw,300px)!important;height:100dvh!important;border-radius:26px 0 0 26px!important;transform:translateX(100%)!important}
    html[data-margarita-formato="mitad"] #margarita-overlay.abierto #margarita-panel{transform:translateX(0)!important}
    html[data-margarita-formato="globo"] #margarita-overlay{background:rgba(2,8,20,.24)!important;backdrop-filter:blur(4px)!important;-webkit-backdrop-filter:blur(4px)!important}
    html[data-margarita-formato="globo"] #margarita-panel{top:auto!important;right:12px!important;bottom:18px!important;width:min(340px,88vw)!important;height:min(66dvh,560px)!important;border-radius:26px!important;box-shadow:0 22px 55px rgba(0,0,0,.34)!important;transform:translateY(18px) scale(.985)!important}
    html[data-margarita-formato="globo"] #margarita-overlay.abierto #margarita-panel{transform:translateY(0) scale(1)!important}
    #margarita-panel .mg-header{flex:0 0 auto!important;box-shadow:0 1px 0 rgba(255,255,255,.16)!important}
    #margarita-panel .mg-header img{width:48px!important;height:48px!important;object-fit:cover!important;border-radius:50%!important}
    .mg-formato-switch{display:none!important}
    #margarita-panel .mg-mensajes{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important;padding-left:10px!important;padding-right:10px!important}
    #margarita-panel .mg-input{flex:0 0 auto!important;display:flex!important;align-items:center!important;gap:8px!important;padding:9px 9px calc(9px + env(safe-area-inset-bottom))!important;box-shadow:0 -8px 24px rgba(38,50,56,.05)!important}
    #margarita-panel .mg-input input{flex:1 1 auto!important;min-width:0!important;height:56px!important;min-height:56px!important;border-radius:28px!important}
    #margarita-panel .mg-input button{flex:0 0 58px!important;width:58px!important;min-width:58px!important;height:58px!important;min-height:58px!important;padding:0!important;margin:0!important;border-radius:50%!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:1.55rem!important}
    #margarita-fab{z-index:10000!important;width:54px!important;height:54px!important;overflow:hidden!important;border-radius:50%!important;box-shadow:0 8px 24px rgba(11,45,107,.26)!important}
    #margarita-fab img{width:100%!important;height:100%!important;object-fit:cover!important;border-radius:50%!important}
    .mg-bot-row{align-self:flex-start!important;display:flex!important;align-items:flex-end!important;gap:8px!important;max-width:97%!important;width:auto!important}
    .mg-bot-avatar{width:38px!important;height:38px!important;flex:0 0 38px!important;border-radius:50%!important;object-fit:cover!important;border:2px solid #fff!important;box-shadow:0 3px 10px rgba(11,45,107,.22)!important;background:#fff!important}
    .mg-bot-row .margarita-bot{align-self:auto!important;max-width:100%!important;border-radius:16px 16px 16px 5px!important;box-shadow:0 3px 12px rgba(0,0,0,.08)!important}
    .mg-admin-config-btn{width:42px;height:42px;border-radius:12px;border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.14);color:#fff;display:none;align-items:center;justify-content:center;font-size:1.05rem;cursor:pointer;flex:0 0 auto}
    #mg-admin-modal{position:fixed;inset:0;z-index:10020;background:rgba(2,8,20,.58);backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);display:none;align-items:center;justify-content:center;padding:18px}
    #mg-admin-modal.on{display:flex}
    .mg-admin-card{width:min(390px,94vw);background:linear-gradient(180deg,#fff,#f8fbff);border-radius:24px;padding:20px;box-shadow:0 24px 70px rgba(0,0,0,.34);font-family:inherit}
    .mg-admin-title{font-size:1.08rem;font-weight:900;color:#0B2D6B;margin-bottom:5px}.mg-admin-sub{font-size:.73rem;color:#64748b;margin-bottom:16px;line-height:1.45}.mg-admin-label{font-size:.74rem;font-weight:900;color:#1f2937;margin:12px 0 8px}.mg-admin-opciones{display:grid;grid-template-columns:1fr 1fr;gap:9px}
    .mg-admin-opcion{border:1.5px solid #dbe4ef;background:#fff;border-radius:14px;padding:12px 8px;font-weight:900;color:#334155;cursor:pointer;font-family:inherit}.mg-admin-opcion.on{border-color:#0B2D6B;color:#0B2D6B;background:#eef5ff;box-shadow:inset 0 0 0 1px #0B2D6B}
    .mg-admin-accion{width:100%;border:1.5px solid #dbe4ef;background:#fff;border-radius:13px;padding:12px;margin-top:8px;font-weight:900;color:#0B2D6B;cursor:pointer;font-family:inherit}.mg-admin-accion.prim{background:linear-gradient(135deg,#0B2D6B,#1e5bc8);color:#fff;border:0}.mg-admin-estado{margin-top:10px;font-size:.7rem;font-weight:800;text-align:center;color:#059669;min-height:18px}
    .mg-admin-cerrar{margin-top:12px;width:100%;border:0;border-radius:13px;background:#eef2f7;color:#334155;padding:11px;font-weight:900;cursor:pointer;font-family:inherit}
    .portada-cat-grid.vista-lista{grid-template-columns:1fr!important}.portada-cat-grid.vista-chica{grid-template-columns:1fr 1fr 1fr!important;gap:7px!important}.portada-cat-grid.vista-chica .prod-card{padding:7px!important}.portada-cat-grid.vista-chica .prod-foto{height:105px!important}
    @media(max-width:360px){html[data-margarita-formato="mitad"] #margarita-panel{width:62vw!important}html[data-margarita-formato="globo"] #margarita-panel{width:90vw!important;right:8px!important}.mg-bot-avatar{width:36px!important;height:36px!important;flex-basis:36px!important}}
    @media(min-width:700px){html[data-margarita-formato="mitad"] #margarita-panel{width:360px!important}}
  `;
  document.getElementById(style.id)?.remove();
  document.head.appendChild(style);

  function esAdmin() {
    try {
      if (typeof window.esAdmin === "function" && window.esAdmin()) return true;
      if (window.tiendaEsAdmin === true) return true;
      if (window.adminUnlocked === true && window.vistaPreviaCliente !== true) return true;
      const r = localStorage.getItem("ae_rol");
      if (r === "admin") return true;
    } catch (e) {}
    return false;
  }

  function esAsesor() {
    if (esAdmin()) return false;
    try {
      if (window.vistaPreviaCliente === true) return false;
      if (window.revUnlocked === true) return true;
      const r = localStorage.getItem("ae_rol");
      if (/asesor|revendedor|vendedor/i.test(String(r || ""))) return true;
    } catch (e) {}
    return false;
  }

  function rolActual() { return esAdmin() ? "admin" : esAsesor() ? "asesor" : "cliente"; }
  function norm(t) { return String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim(); }

  function aplicarFormato(f) {
    formato = f === "globo" ? "globo" : "mitad";
    document.documentElement.dataset.margaritaFormato = formato;
    try { localStorage.setItem(UI_KEY, formato); } catch (e) {}
    document.querySelectorAll("[data-mg-formato]").forEach(b => b.classList.toggle("on", b.dataset.mgFormato === formato));
    requestAnimationFrame(ajustarViewport);
  }

  function guardarConfigNube(parcial, intento = 0) {
    try {
      if (window.NUBE_OK && window.sbCalc) {
        window.sbCalc.from("tienda_catalogo").select("datos").eq("id", UI_CLOUD_ID).maybeSingle().then(r => {
          const actual = r && r.data && r.data.datos && typeof r.data.datos === "object" ? r.data.datos : {};
          const datos = Object.assign({}, actual, parcial);
          return window.sbCalc.from("tienda_catalogo").upsert({id:UI_CLOUD_ID, datos, actualizado:new Date().toISOString()});
        }).catch(() => {});
        return;
      }
    } catch (e) {}
    if (intento < 16) setTimeout(() => guardarConfigNube(parcial, intento + 1), 500);
  }

  function cargarConfigNube(intento = 0) {
    try {
      if (window.NUBE_OK && window.sbCalc) {
        window.sbCalc.from("tienda_catalogo").select("datos").eq("id", UI_CLOUD_ID).maybeSingle().then(r => {
          const d = r && r.data ? r.data.datos : null;
          if (d && (d.formato === "mitad" || d.formato === "globo")) aplicarFormato(d.formato);
        }).catch(() => {});
        return;
      }
    } catch (e) {}
    if (intento < 20) setTimeout(() => cargarConfigNube(intento + 1), 500);
  }

  function pruebaHasta() {
    try { return Number(localStorage.getItem(PRUEBA_KEY) || 0); } catch (e) { return 0; }
  }
  function pruebaActiva() { return esAdmin() && pruebaHasta() > Date.now(); }
  function activarPrueba(horas) {
    if (!esAdmin()) return false;
    const hasta = Date.now() + horas * 60 * 60 * 1000;
    try { localStorage.setItem(PRUEBA_KEY, String(hasta)); } catch (e) {}
    actualizarEstadoModal(`✓ Prueba admin activada por ${horas} h`);
    return true;
  }
  function desactivarPrueba() {
    try { localStorage.removeItem(PRUEBA_KEY); } catch (e) {}
    actualizarEstadoModal("✓ Prueba admin desactivada. Vuelve al horario normal.");
  }
  function textoEstadoPrueba() {
    const h = pruebaHasta();
    if (!esAdmin() || h <= Date.now()) return "Horario automático";
    const min = Math.max(1, Math.ceil((h - Date.now()) / 60000));
    const hh = Math.floor(min / 60), mm = min % 60;
    return `Prueba activa · ${hh ? hh + " h " : ""}${mm} min restantes`;
  }
  function actualizarEstadoModal(txt) {
    const e = document.querySelector("#mg-admin-modal .mg-admin-estado");
    if (e) e.textContent = txt || textoEstadoPrueba();
  }

  function crearModal() {
    if (document.getElementById("mg-admin-modal")) return;
    const m = document.createElement("div");
    m.id = "mg-admin-modal";
    m.innerHTML = `<div class="mg-admin-card">
      <div class="mg-admin-title">⚙️ Ajustes de Margarita</div>
      <div class="mg-admin-sub">Acá elegís el formato y activás el modo de prueba. No hace falta mostrar controles dentro del chat.</div>
      <div class="mg-admin-label">Formato</div>
      <div class="mg-admin-opciones"><button class="mg-admin-opcion" data-mg-formato="mitad">◧ Panel Mitad</button><button class="mg-admin-opcion" data-mg-formato="globo">💬 Globo Premium</button></div>
      <div class="mg-admin-label">Prueba de administradores</div>
      <button class="mg-admin-accion prim" data-mg-prueba="4">▶ Activar prueba 4 horas</button>
      <button class="mg-admin-accion" data-mg-prueba="24">🕐 Activar admin 24 horas</button>
      <button class="mg-admin-accion" data-mg-prueba="off">⏱ Volver al horario automático</button>
      <div class="mg-admin-estado"></div>
      <button class="mg-admin-cerrar">Listo</button>
    </div>`;
    document.body.appendChild(m);
    m.addEventListener("click", ev => { if (ev.target === m) m.classList.remove("on"); });
    m.querySelector(".mg-admin-cerrar").onclick = () => m.classList.remove("on");
    m.querySelectorAll("[data-mg-formato]").forEach(b => b.onclick = () => { aplicarFormato(b.dataset.mgFormato); guardarConfigNube({formato}); });
    m.querySelectorAll("[data-mg-prueba]").forEach(b => b.onclick = () => {
      if (b.dataset.mgPrueba === "off") desactivarPrueba(); else activarPrueba(Number(b.dataset.mgPrueba));
    });
  }

  function asegurarAjustes() {
    panel.querySelectorAll(".mg-formato-switch").forEach(x => x.remove());
    if (!header) return;
    let btn = header.querySelector(".mg-admin-config-btn");
    if (esAdmin() && !btn) {
      btn = document.createElement("button");
      btn.type = "button"; btn.className = "mg-admin-config-btn"; btn.textContent = "⚙️"; btn.title = "Ajustes de Margarita";
      const cerrar = Array.from(header.querySelectorAll("button")).find(b => /cerrar/i.test(b.getAttribute("aria-label") || "") || String(b.textContent || "").trim() === "×");
      if (cerrar) header.insertBefore(btn, cerrar); else header.appendChild(btn);
      btn.onclick = ev => { ev.preventDefault(); ev.stopPropagation(); crearModal(); aplicarFormato(formato); actualizarEstadoModal(); document.getElementById("mg-admin-modal").classList.add("on"); };
    }
    if (btn) btn.style.display = esAdmin() ? "flex" : "none";
  }

  function decorarBot(b) {
    if (!b || !b.classList?.contains("margarita-bot") || b.parentElement?.classList.contains("mg-bot-row")) return;
    const row = document.createElement("div"); row.className = "mg-bot-row";
    const img = document.createElement("img"); img.className = "mg-bot-avatar"; img.src = MARGARITA_AVATAR; img.alt = "Margarita";
    b.parentNode.insertBefore(row, b); row.appendChild(img); row.appendChild(b);
  }
  function decorarMensajes() { mensajes.querySelectorAll(".margarita-bot").forEach(decorarBot); }
  new MutationObserver(c => c.forEach(x => x.addedNodes.forEach(n => { if (n.nodeType === 1) { if (n.classList?.contains("margarita-bot")) decorarBot(n); n.querySelectorAll?.(".margarita-bot").forEach(decorarBot); } }))).observe(mensajes,{childList:true});

  const REGLAS = [
    ["📱 Celulares",/\b(celular|celu|smartphone|telefono|iphone|samsung|motorola|moto g|redmi|xiaomi|infinix|tecno)\b/],
    ["📺 TV y video",/\b(tv|televisor|smart tv|google tv|android tv|qled|oled|monitor|proyector)\b/],
    ["🔊 Audio",/\b(audio|parlante|bafle|torre|home theater|soundbar|barra de sonido|auricular|karaoke|jbl)\b/],
    ["🔌 Cargadores y accesorios",/\b(cargador|cabezal|cable usb|tipo c|usb c|powerbank|power bank|funda|vidrio templado|adaptador)\b/],
    ["❄️ Refrigeración",/\b(heladera|freezer|congelador|exhibidora|dispenser)\b/],
    ["🌡️ Climatización",/\b(aire acondicionado|split|estufa|calefactor|caloventor|ventilador|termotanque)\b/],
    ["🍳 Cocción",/\b(cocina|horno|microondas|anafe|freidora|air fryer|parrilla|grill)\b/],
    ["🧺 Lavado",/\b(lavarropas|lavarropa|secarropas|lavavajillas|centrifug)\b/],
    ["🔧 Herramientas",/\b(taladro|amoladora|atornillador|soldadora|motosierra|compresor|engrapadora|encoladora|llave de impacto)\b/],
    ["💻 Informática",/\b(notebook|computadora|pc|impresora|teclado|mouse|router|webcam)\b/],
    ["🎮 Gaming",/\b(gaming|gamer|playstation|ps5|ps4|xbox|nintendo|consola|joystick)\b/],
    ["🧸 Juguetes",/\b(juguete|muneca|muñeca|robot|hidrogel|juego infantil)\b/],
    ["🚲 Deportes y movilidad",/\b(bicicleta|bici|monopatin|patin|patines|patineta|pesas|mancuerna)\b/],
    ["🪑 Muebles",/\b(mueble|ropero|placard|comoda|mesa|silla|sillon|escritorio|rack)\b/],
    ["🛏️ Colchones y sommiers",/\b(colchon|sommier|somier)\b/],
    ["🏠 Hogar y deco",/\b(hogar|deco|decoracion|lampara|velador|alfombra|organizador)\b/]
  ];
  const STOP = new Set("quiero busco buscar tenes tienen necesito mostrame pasame dame algo alguno alguna para con que una uno unos unas por favor me mi el la los las del de en un y o hay opciones opcion modelo modelos".split(" "));
  function cats(texto) { const q = norm(texto); return REGLAS.filter(r => r[1].test(q)).map(r => r[0]); }
  function tokens(texto) { return norm(texto).split(/\s+/).filter(w => w.length > 1 && !STOP.has(w)); }
  function categoria(p) { try { return String(typeof window.catProd === "function" ? window.catProd(p) || p.categoria || "📦 Otros" : p.categoria || "📦 Otros"); } catch(e){ return String(p.categoria || "📦 Otros"); } }
  function universo() {
    const out = [], ids = new Set();
    const add = p => { if (!p || p.id == null || ids.has(String(p.id))) return; let ok=true; try{ok=typeof window.tiendaEstaVisibleYConStock==="function"?!!window.tiendaEstaVisibleYConStock(p):p.visible!==false&&p.sinStock!==true;}catch(e){} if(!ok||!Number(p.venta))return; ids.add(String(p.id)); out.push(p); };
    try { (window.tiendaProductos || []).forEach(add); } catch(e){}
    try { if (typeof window.cargarListaCelus === "function") (window.cargarListaCelus() || []).forEach((c,i)=>{ if(!c||!Number(c.precio)||c.ocultoTienda||c.sinStock)return; add({id:"celu_"+i,esCelu:true,nombre:c.nombre||"",venta:Number(c.precio),categoria:"📱 Celulares",caracteristicas:c.caracteristicas||"",visible:true,foto:c.foto||""}); }); } catch(e){}
    return out;
  }
  function consultaContexto(texto){ const t=norm(texto); if(cats(texto).length || !/^(pasame|dame|mostrame|otro|otra|otros|otras|algo|uno|una|si|no|dale|bueno|mas)\b/.test(t)) return texto; const h=(window._margaritaHist||[]).filter(m=>m.rol!=="margarita").map(m=>m.texto).slice(0,-1).reverse().find(x=>cats(x).length||tokens(x).length>=2); return h?h+" "+texto:texto; }
  function productosPara(texto){ const q=consultaContexto(texto), tq=norm(q), tk=tokens(q), cs=cats(q), lista=universo(); const cargador=cs.includes("🔌 Cargadores y accesorios")&&/\bcargador\b/.test(tq); const arr=lista.map(p=>{ const nom=norm(p.nombre), cat=categoria(p), bolsa=norm((p.nombre||"")+" "+cat+" "+(p.caracteristicas||"")); let score=p.destacado?1:0; tk.forEach(w=>{if(bolsa.includes(w))score+=w.length>=4?5:3;if(nom.includes(w))score+=2;}); cs.forEach(c=>{if(cat===c)score+=16; if(c==="📺 TV y video"&&/TV/.test(cat))score+=14; if(c==="❄️ Refrigeración"&&/Heladera|Refriger/.test(cat))score+=14;}); if(cargador){if(/cargador|cabezal|powerbank|power bank|cable/.test(nom))score+=20;if(/taladro|amoladora|llave de impacto|herramienta/.test(nom))score-=30;} return{p,score}; }).filter(x=>x.score>0||(!tk.length&&!cs.length)).sort((a,b)=>b.score-a.score||Number(a.p.venta)-Number(b.p.venta)); const base=location.origin+location.pathname.replace(/\/[^/]*$/, "/"); return arr.slice(0,42).map(x=>({id:String(x.p.id),nombre:String(x.p.nombre||""),categoria:categoria(x.p),precio:Number(x.p.venta)||0,caracteristicas:String(x.p.caracteristicas||"").slice(0,280),url:base+"?prod="+encodeURIComponent(x.p.id)})); }
  function resumen(){ const u=universo(), m=new Map(); u.forEach(p=>m.set(categoria(p),(m.get(categoria(p))||0)+1)); return{total:u.length,disponibles:u.length,categorias:Array.from(m,([nombre,cantidad])=>({nombre,cantidad}))}; }

  function nombreDetectado(t){const n=norm(t);if(/\b(soy|me llamo|habla) (maxi|maximiliano)\b/.test(n)||n==="maxi")return"Maxi";if(/\b(soy|me llamo|habla) (angie|angela)\b/.test(n)||n==="angie"||n==="angela")return"Angie";return"";}
  function saludo(){return rolActual()==="admin"?"¡Hola! 🐝 ¿Quién está por ahí, Maxi o Angie? ¿En qué les doy una mano?":rolActual()==="asesor"?"¡Hola equipo! 🐝 ¿En qué les doy una mano hoy? Vamos, hagamos que las cosas pasen chicos 😉":"¡Hola! Soy Margarita 🐝 ¿En qué te puedo SERVIR hoy?";}
  function asegurarSaludo(){if(!mensajes.querySelector(".margarita-bot")&&typeof window.margaritaPintar==="function")window.margaritaPintar("margarita",saludo());}

  function comandoPrueba(texto){
    if(!esAdmin())return false;
    const t=norm(texto);
    if(/^activar prueba maxi\b/.test(t)||t==="margarita activar prueba 4 horas"||t==="activar prueba 4 horas"){
      activarPrueba(4);
      if(typeof window.margaritaPintar==="function")window.margaritaPintar("cliente",texto),window.margaritaPintar("margarita","✅ Prueba de administrador activada por 4 horas. Podés probarme sin límite de horario 🐝");
      input.value=""; return true;
    }
    if(t==="margarita activar 24 horas"||t==="activar 24 horas"){
      activarPrueba(24);
      if(typeof window.margaritaPintar==="function")window.margaritaPintar("cliente",texto),window.margaritaPintar("margarita","✅ Modo administrador activado por 24 horas 🐝");
      input.value=""; return true;
    }
    if(t==="margarita volver a horario automatico"||t==="volver a horario automatico"){
      desactivarPrueba();
      if(typeof window.margaritaPintar==="function")window.margaritaPintar("cliente",texto),window.margaritaPintar("margarita","✅ Volví al horario automático 🐝");
      input.value=""; return true;
    }
    return false;
  }

  function horarioHabilitado(){
    if(esAdmin()&&pruebaActiva())return true;
    if(esAdmin())return true;
    const ahora=new Date();
    const partes=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Argentina/Buenos_Aires",weekday:"short",hour:"2-digit",minute:"2-digit",hour12:false}).formatToParts(ahora).reduce((a,p)=>(a[p.type]=p.value,a),{});
    const min=Number(partes.hour)*60+Number(partes.minute), dia=partes.weekday;
    if(dia==="Sun")return false;
    if(dia==="Sat")return min>=9*60&&min<13*60;
    return min>=10*60&&min<16*60;
  }

  function enviar(){
    if(window._margaritaCargando)return;
    const texto=String(input.value||"").trim(); if(!texto)return;
    if(comandoPrueba(texto))return;
    if(!horarioHabilitado()){
      if(typeof window.margaritaPintar==="function")window.margaritaPintar("cliente",texto),window.margaritaPintar("margarita","Ahora estoy fuera de horario 🐝 Volvé a escribirme en el horario de atención."); input.value=""; return;
    }
    const nd=nombreDetectado(texto); if(nd){if(nombreSesion!==nd)saludoEspecialHecho=false;nombreSesion=nd;}
    if(typeof window.margaritaPintar==="function")window.margaritaPintar("cliente",texto);
    if(!Array.isArray(window._margaritaHist))window._margaritaHist=[];
    window._margaritaHist.push({rol:"usuario",texto}); input.value=""; window._margaritaCargando=true; window.margaritaEscribiendo?.(true);
    const rol=rolActual();
    fetch("/api/margarita",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mensajes:window._margaritaHist.slice(-14),productos:productosPara(texto),rol,nombre:nombreSesion,saludoEspecialPendiente:rol==="admin"&&!!nombreSesion&&!saludoEspecialHecho,resumen:resumen(),taxonomia:resumen().categorias.map(x=>x.nombre),modoPrueba:pruebaActiva()})})
      .then(r=>r.json()).then(data=>{window.margaritaEscribiendo?.(false);const resp=data&&data.respuesta?data.respuesta:"No pude responderte ahora 🐝 Probá nuevamente en un ratito.";window.margaritaPintar?.("margarita",resp);window._margaritaHist.push({rol:"margarita",texto:resp});saludoEspecialHecho=saludoEspecialHecho||!!nombreSesion;window._margaritaCargando=false;decorarMensajes();mensajes.scrollTop=mensajes.scrollHeight;})
      .catch(()=>{window.margaritaEscribiendo?.(false);window.margaritaPintar?.("margarita","No pude conectarme ahora 🐝 Probá de nuevo en un ratito.");window._margaritaCargando=false;});
  }
  window.margaritaEnviar=enviar;

  let cierreTimer=null,scrollBase=window.scrollY||0;const vv=window.visualViewport||null;
  function abierto(){return overlay.classList.contains("abierto");}
  function ajustarViewport(){if(!abierto())return;const top=vv?vv.offsetTop:0,alto=vv?vv.height:window.innerHeight;if(formato==="globo"){const teclado=Math.max(0,window.innerHeight-(top+alto));panel.style.setProperty("top","auto","important");panel.style.setProperty("bottom",(teclado+8)+"px","important");panel.style.setProperty("height",Math.max(280,Math.min(520,Math.round(alto-14)))+"px","important");}else{panel.style.setProperty("top",Math.max(0,Math.round(top))+"px","important");panel.style.setProperty("bottom","auto","important");panel.style.setProperty("height",Math.max(220,Math.round(alto))+"px","important");}if(document.activeElement===input&&Math.abs((window.scrollY||0)-scrollBase)>1)try{window.scrollTo(0,scrollBase);}catch(e){}}
  function ajustarRapido(){ajustarViewport();requestAnimationFrame(ajustarViewport);setTimeout(ajustarViewport,18);}
  window.margaritaAbrir=function(){clearTimeout(cierreTimer);overlay.style.display="block";scrollBase=window.scrollY||0;asegurarSaludo();requestAnimationFrame(()=>{overlay.classList.add("abierto");decorarMensajes();asegurarAjustes();ajustarRapido();mensajes.scrollTop=mensajes.scrollHeight;});};
  window.margaritaCerrar=function(){overlay.classList.remove("abierto");clearTimeout(cierreTimer);cierreTimer=setTimeout(()=>{if(!abierto()){overlay.style.display="none";panel.style.removeProperty("top");panel.style.removeProperty("bottom");panel.style.removeProperty("height");}},280);};
  fab.onclick=ev=>{ev?.preventDefault();ev?.stopPropagation();abierto()?window.margaritaCerrar():window.margaritaAbrir();return false;};
  overlay.addEventListener("click",ev=>{if(ev.target===overlay)window.margaritaCerrar();}); input.addEventListener("focus",()=>{scrollBase=window.scrollY||0;ajustarRapido();mensajes.scrollTop=mensajes.scrollHeight;}); if(vv){vv.addEventListener("resize",ajustarRapido);vv.addEventListener("scroll",ajustarRapido);} window.addEventListener("resize",ajustarRapido);

  function sincronizarVista(){let v=0;try{v=Number(window.tiendaVista||localStorage.getItem("ae_vista")||0);}catch(e){}document.querySelectorAll(".portada-cat-grid").forEach(g=>{g.classList.remove("vista-lista","vista-chica");if(v===1)g.classList.add("vista-lista");else if(v===2)g.classList.add("vista-chica");});const b=document.getElementById("btn-vista");if(b)b.style.removeProperty("display");}

  aplicarFormato(formato); asegurarAjustes(); decorarMensajes(); sincronizarVista(); cargarConfigNube(); setInterval(()=>{asegurarAjustes();sincronizarVista();},1000); document.documentElement.dataset.margaritaSidebar=VERSION;
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",instalarMargarita,{once:true});else instalarMargarita();
