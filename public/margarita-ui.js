export const MARGARITA_AVATAR = "/margarita-avatar.webp";

const MARGARITA_SIDEBAR_VERSION = "sidebar-2026-08-23-7";
const MARGARITA_UI_DEFAULT = { formato: "mitad" };
const MARGARITA_UI_KEY = "ae_margarita_ui_formato";
const MARGARITA_UI_CLOUD_ID = "margarita_ui";

function instalarMargaritaSidebar() {
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

  let formatoGlobal = MARGARITA_UI_DEFAULT.formato;
  try {
    const local = localStorage.getItem(MARGARITA_UI_KEY);
    if (local === "mitad" || local === "globo") formatoGlobal = local;
  } catch (e) {}

  let nombreSesion = "";
  let saludoEspecialHecho = false;

  if (!document.getElementById("margarita-sidebar-estilos")) {
    const style = document.createElement("style");
    style.id = "margarita-sidebar-estilos";
    style.textContent = `
      #margarita-overlay{
        position:fixed!important;inset:0!important;z-index:9998!important;
        background:rgba(2,8,20,.42)!important;
        backdrop-filter:blur(7px)!important;-webkit-backdrop-filter:blur(7px)!important;
        opacity:0!important;pointer-events:none!important;align-items:initial!important;justify-content:initial!important;
        transition:opacity .22s ease!important;
      }
      #margarita-overlay.abierto{opacity:1!important;pointer-events:auto!important}
      #margarita-panel{
        position:fixed!important;top:0!important;right:0!important;left:auto!important;bottom:auto!important;
        min-height:0!important;background:#ECE5DD!important;display:flex!important;flex-direction:column!important;
        overflow:hidden!important;border:1px solid rgba(255,255,255,.34)!important;
        box-shadow:-18px 0 46px rgba(0,0,0,.28)!important;
        transition:transform .28s cubic-bezier(.4,0,.2,1),width .18s ease!important;
        will-change:transform,width!important;
      }
      html[data-margarita-formato="mitad"] #margarita-panel{
        width:clamp(210px,58vw,300px)!important;height:100dvh!important;
        border-radius:26px 0 0 26px!important;transform:translateX(100%)!important;
      }
      html[data-margarita-formato="mitad"] #margarita-overlay.abierto #margarita-panel{transform:translateX(0)!important}
      html[data-margarita-formato="globo"] #margarita-overlay{
        background:rgba(2,8,20,.24)!important;backdrop-filter:blur(4px)!important;-webkit-backdrop-filter:blur(4px)!important;
      }
      html[data-margarita-formato="globo"] #margarita-panel{
        width:min(340px,88vw)!important;height:min(66dvh,560px)!important;
        top:auto!important;right:12px!important;bottom:18px!important;
        border-radius:26px!important;box-shadow:0 22px 55px rgba(0,0,0,.34)!important;
        transform:translateY(20px) scale(.985)!important;
      }
      html[data-margarita-formato="globo"] #margarita-overlay.abierto #margarita-panel{transform:translateY(0) scale(1)!important}
      #margarita-panel .mg-header{flex:0 0 auto!important;box-shadow:0 1px 0 rgba(255,255,255,.16)!important}
      #margarita-panel .mg-header img{width:48px!important;height:48px!important;object-fit:cover!important;border-radius:50%!important}
      .mg-formato-switch{
        display:none;flex:0 0 auto;grid-template-columns:1fr 1fr;gap:7px;padding:8px 9px;
        background:linear-gradient(180deg,#f8fbff,#eef4fb);border-bottom:1px solid rgba(11,45,107,.10);
      }
      .mg-formato-switch.on{display:grid}
      .mg-formato-switch button{
        border:1px solid #d7e0ec;border-radius:11px;background:#fff;color:#475569;
        padding:9px 6px;font-size:.7rem;line-height:1;font-weight:900;font-family:inherit;cursor:pointer;
      }
      .mg-formato-switch button.on{
        color:#0B2D6B;border-color:#0B2D6B;background:#eef5ff;box-shadow:inset 0 0 0 1px #0B2D6B;
      }
      #margarita-panel .mg-mensajes{
        flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overscroll-behavior:contain!important;
        -webkit-overflow-scrolling:touch!important;padding-left:10px!important;padding-right:10px!important;
      }
      #margarita-panel .mg-input{
        flex:0 0 auto!important;position:relative!important;display:flex!important;align-items:center!important;gap:8px!important;
        padding:9px 9px calc(9px + env(safe-area-inset-bottom))!important;box-shadow:0 -8px 24px rgba(38,50,56,.05)!important;
      }
      #margarita-panel .mg-input input,#margarita-panel .mg-input textarea{
        flex:1 1 auto!important;min-width:0!important;height:56px!important;min-height:56px!important;border-radius:28px!important;
      }
      #margarita-panel .mg-input button{
        flex:0 0 58px!important;width:58px!important;min-width:58px!important;max-width:58px!important;
        height:58px!important;min-height:58px!important;padding:0!important;margin:0!important;border-radius:50%!important;
        display:flex!important;align-items:center!important;justify-content:center!important;font-size:1.55rem!important;line-height:1!important;
      }
      #margarita-fab{
        z-index:10000!important;width:54px!important;height:54px!important;overflow:hidden!important;border-radius:50%!important;
        box-shadow:0 8px 24px rgba(11,45,107,.26)!important;
      }
      #margarita-fab img{width:100%!important;height:100%!important;object-fit:cover!important;border-radius:50%!important}
      .mg-bot-row{align-self:flex-start!important;display:flex!important;align-items:flex-end!important;gap:8px!important;max-width:97%!important;width:auto!important}
      .mg-bot-avatar{
        width:38px!important;height:38px!important;flex:0 0 38px!important;border-radius:50%!important;object-fit:cover!important;
        border:2px solid #fff!important;box-shadow:0 3px 10px rgba(11,45,107,.22)!important;background:#fff!important;
      }
      .mg-bot-row .margarita-bot{align-self:auto!important;max-width:100%!important;border-radius:16px 16px 16px 5px!important;box-shadow:0 3px 12px rgba(0,0,0,.08)!important}
      .mg-admin-config-btn{
        width:36px;height:36px;border-radius:10px;border:1px solid rgba(255,255,255,.34);background:rgba(255,255,255,.14);
        color:#fff;display:none;align-items:center;justify-content:center;font-size:1rem;cursor:pointer;margin-left:4px;flex:0 0 auto;
      }
      #mg-admin-modal{
        position:fixed;inset:0;z-index:10020;background:rgba(2,8,20,.58);
        backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);display:none;align-items:center;justify-content:center;padding:18px;
      }
      #mg-admin-modal.on{display:flex}
      .mg-admin-card{
        width:min(390px,94vw);background:linear-gradient(180deg,#fff 0%,#f8fbff 100%);
        border:1px solid rgba(11,45,107,.10);border-radius:24px;padding:20px;box-shadow:0 24px 70px rgba(0,0,0,.34);font-family:inherit;
      }
      .mg-admin-title{font-size:1.08rem;font-weight:900;color:#0B2D6B;margin-bottom:5px}
      .mg-admin-sub{font-size:.73rem;color:#64748b;margin-bottom:17px;line-height:1.45}
      .mg-admin-label{font-size:.74rem;font-weight:900;color:#1f2937;margin:12px 0 8px}
      .mg-admin-opciones{display:grid;grid-template-columns:1fr 1fr;gap:9px}
      .mg-admin-opcion{
        border:1.5px solid #dbe4ef;background:#fff;border-radius:14px;padding:13px 9px;font-weight:900;color:#334155;
        cursor:pointer;font-family:inherit;box-shadow:0 3px 12px rgba(15,23,42,.04);
      }
      .mg-admin-opcion.on{
        border-color:#0B2D6B;background:linear-gradient(180deg,#eef5ff,#fff);color:#0B2D6B;
        box-shadow:inset 0 0 0 1px #0B2D6B,0 5px 16px rgba(11,45,107,.10);
      }
      .mg-admin-cerrar{
        margin-top:17px;width:100%;border:0;border-radius:13px;background:linear-gradient(135deg,#0B2D6B,#1e5bc8);
        color:#fff;padding:12px;font-weight:900;cursor:pointer;font-family:inherit;
      }
      .mg-admin-ok{font-size:.67rem;color:#059669;font-weight:800;margin-top:10px;min-height:16px;text-align:center}
      .portada-cat-grid.vista-lista{grid-template-columns:1fr!important}
      .portada-cat-grid.vista-chica{grid-template-columns:1fr 1fr 1fr!important;gap:7px!important}
      .portada-cat-grid.vista-chica .prod-card{padding:7px!important}
      .portada-cat-grid.vista-chica .prod-foto{height:105px!important}
      @media(max-width:360px){
        html[data-margarita-formato="mitad"] #margarita-panel{width:62vw!important}
        html[data-margarita-formato="globo"] #margarita-panel{width:90vw!important;right:8px!important}
        #margarita-panel .mg-input button{flex-basis:54px!important;width:54px!important;min-width:54px!important;max-width:54px!important;height:54px!important;min-height:54px!important}
        .mg-bot-avatar{width:36px!important;height:36px!important;flex-basis:36px!important}
      }
      @media(min-width:700px){html[data-margarita-formato="mitad"] #margarita-panel{width:360px!important}}
    `;
    document.head.appendChild(style);
  }

  function esAdminActual() {
    try {
      if (typeof window.esAdmin === "function" && window.esAdmin()) return true;
      if (window.tiendaEsAdmin === true) return true;
      if (window.adminUnlocked === true && window.vistaPreviaCliente !== true) return true;
    } catch (e) {}
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = String(localStorage.key(i) || "");
        const v = String(localStorage.getItem(k) || "").toLowerCase();
        if (/ae_sesion_admin/i.test(k) && (v === "1" || v === "true" || v === "admin")) return true;
        if (/ae_rol/i.test(k) && v === "admin") return true;
      }
    } catch (e) {}
    return false;
  }

  function esAsesorActual() {
    if (esAdminActual()) return false;
    try {
      if (window.vistaPreviaCliente === true) return false;
      if (window.revUnlocked === true) return true;
    } catch (e) {}
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = String(localStorage.key(i) || "");
        const v = String(localStorage.getItem(k) || "").toLowerCase();
        if (/ae_sesion_rev/i.test(k) && (v === "1" || v === "true")) return true;
        if (/ae_rol/i.test(k) && /asesor|revendedor|vendedor/.test(v)) return true;
      }
    } catch (e) {}
    return false;
  }

  function rolActual() {
    if (esAdminActual()) return "admin";
    if (esAsesorActual()) return "asesor";
    return "cliente";
  }

  function preferenciasActuales() {
    return { formato: formatoGlobal === "globo" ? "globo" : "mitad" };
  }

  let preferenciasAplicadas = "";

  function refrescarBotonesFormato(formato) {
    document.querySelectorAll("[data-mg-formato]").forEach((b) => b.classList.toggle("on", b.dataset.mgFormato === formato));
  }

  function aplicarPreferencias() {
    const pref = preferenciasActuales();
    if (pref.formato !== preferenciasAplicadas) {
      preferenciasAplicadas = pref.formato;
      document.documentElement.dataset.margaritaFormato = pref.formato;
    }
    refrescarBotonesFormato(pref.formato);
  }

  function guardarFormatoLocal(valor) {
    formatoGlobal = valor === "globo" ? "globo" : "mitad";
    try { localStorage.setItem(MARGARITA_UI_KEY, formatoGlobal); } catch (e) {}
    preferenciasAplicadas = "";
    aplicarPreferencias();
  }

  function guardarFormatoNube(valor, intento = 0) {
    try {
      if (window.NUBE_OK && window.sbCalc) {
        window.sbCalc.from("tienda_catalogo").upsert({
          id: MARGARITA_UI_CLOUD_ID,
          datos: { formato: valor },
          actualizado: new Date().toISOString()
        }).then(() => {}).catch(() => {});
        return;
      }
    } catch (e) {}
    if (intento < 16) setTimeout(() => guardarFormatoNube(valor, intento + 1), 500);
  }

  function cargarFormatoNube(intento = 0) {
    try {
      if (window.NUBE_OK && window.sbCalc) {
        window.sbCalc.from("tienda_catalogo").select("datos").eq("id", MARGARITA_UI_CLOUD_ID).maybeSingle()
          .then((r) => {
            const d = r && r.data ? r.data.datos : null;
            const valor = d && typeof d === "object" ? d.formato : d;
            if (valor === "mitad" || valor === "globo") guardarFormatoLocal(valor);
          }).catch(() => {});
        return;
      }
    } catch (e) {}
    if (intento < 20) setTimeout(() => cargarFormatoNube(intento + 1), 500);
  }

  function guardarFormato(valor) {
    if (!esAdminActual()) return;
    guardarFormatoLocal(valor);
    guardarFormatoNube(formatoGlobal);
    const ok = document.querySelector("#mg-admin-modal .mg-admin-ok");
    if (ok) {
      ok.textContent = "✓ Guardado para toda la tienda";
      setTimeout(() => { if (ok) ok.textContent = ""; }, 1700);
    }
    requestAnimationFrame(ajustarViewport);
  }

  function crearModalAdmin() {
    if (document.getElementById("mg-admin-modal")) return;
    const modal = document.createElement("div");
    modal.id = "mg-admin-modal";
    modal.innerHTML = `
      <div class="mg-admin-card" role="dialog" aria-modal="true" aria-label="Configurar Margarita">
        <div class="mg-admin-title">⚙️ Apariencia de Margarita</div>
        <div class="mg-admin-sub">Elegí entre los dos formatos premium. El que selecciones queda aplicado para toda la tienda.</div>
        <div class="mg-admin-label">Formato</div>
        <div class="mg-admin-opciones">
          <button class="mg-admin-opcion" data-mg-formato="mitad">◧ Panel Mitad</button>
          <button class="mg-admin-opcion" data-mg-formato="globo">💬 Globo Premium</button>
        </div>
        <div class="mg-admin-ok"></div>
        <button class="mg-admin-cerrar" type="button">Listo</button>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener("click", (ev) => { if (ev.target === modal) modal.classList.remove("on"); });
    modal.querySelector(".mg-admin-cerrar").addEventListener("click", () => modal.classList.remove("on"));
    modal.querySelectorAll("[data-mg-formato]").forEach((b) => b.addEventListener("click", () => guardarFormato(b.dataset.mgFormato)));
  }

  function abrirConfigAdmin() {
    if (!esAdminActual()) return;
    crearModalAdmin();
    aplicarPreferencias();
    document.getElementById("mg-admin-modal").classList.add("on");
  }

  function crearSelectorRapido() {
    let switcher = panel.querySelector(".mg-formato-switch");
    if (switcher) return switcher;
    switcher = document.createElement("div");
    switcher.className = "mg-formato-switch";
    switcher.innerHTML = `
      <button type="button" data-mg-formato="mitad">◧ Panel</button>
      <button type="button" data-mg-formato="globo">💬 Globo</button>`;
    if (header) header.insertAdjacentElement("afterend", switcher);
    else panel.insertBefore(switcher, mensajes);
    switcher.querySelectorAll("[data-mg-formato]").forEach((b) => {
      b.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        guardarFormato(b.dataset.mgFormato);
      });
    });
    return switcher;
  }

  function asegurarControlesAdmin() {
    if (!header) return;
    const admin = esAdminActual();
    let btn = header.querySelector(".mg-admin-config-btn");
    if (admin && !btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mg-admin-config-btn";
      btn.title = "Configurar Margarita";
      btn.setAttribute("aria-label", "Configurar Margarita");
      btn.textContent = "⚙️";
      const cerrar = Array.from(header.querySelectorAll("button")).find((b) =>
        /cerrar/i.test(b.getAttribute("aria-label") || "") || String(b.textContent || "").trim() === "×"
      );
      if (cerrar) header.insertBefore(btn, cerrar);
      else header.appendChild(btn);
      btn.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        abrirConfigAdmin();
      });
    }
    if (btn) btn.style.display = admin ? "flex" : "none";
    const switcher = crearSelectorRapido();
    switcher.classList.toggle("on", admin);
    aplicarPreferencias();
  }

  function decorarBurbujaBot(burbuja) {
    if (!burbuja || !burbuja.classList || !burbuja.classList.contains("margarita-bot")) return;
    if (burbuja.parentElement && burbuja.parentElement.classList.contains("mg-bot-row")) return;
    const fila = document.createElement("div");
    fila.className = "mg-bot-row";
    const avatar = document.createElement("img");
    avatar.className = "mg-bot-avatar";
    avatar.src = MARGARITA_AVATAR;
    avatar.alt = "Margarita";
    burbuja.parentNode.insertBefore(fila, burbuja);
    fila.appendChild(avatar);
    fila.appendChild(burbuja);
  }

  function decorarMensajes() {
    mensajes.querySelectorAll(".margarita-bot").forEach(decorarBurbujaBot);
  }

  const observadorMensajes = new MutationObserver((cambios) => {
    cambios.forEach((cambio) => cambio.addedNodes.forEach((nodo) => {
      if (nodo.nodeType !== 1) return;
      if (nodo.classList && nodo.classList.contains("margarita-bot")) decorarBurbujaBot(nodo);
      if (nodo.querySelectorAll) nodo.querySelectorAll(".margarita-bot").forEach(decorarBurbujaBot);
    }));
  });
  observadorMensajes.observe(mensajes, { childList: true, subtree: false });

  function norm(txt) {
    return String(txt || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      .replace(/[^a-z0-9ñáéíóúü"']/g, " ").replace(/\s+/g, " ").trim();
  }

  const STOP = new Set([
    "quiero","busco","buscar","tenes","tienen","tenemos","necesito","necesitaria","mostrame","mostrar","pasame","dame",
    "algo","alguno","alguna","algun","para","con","que","una","uno","unos","unas","por","favor","favor","me","mi","el","la",
    "los","las","del","de","en","un","y","o","hay","tengo","tendra","tendras","quiero","opciones","opcion","modelo","modelos"
  ]);

  const REGLAS_CATEGORIA = [
    {cat:"📱 Celulares", rx:/\b(celular|celu|smartphone|telefono|iphone|samsung galaxy|motorola|moto g|redmi|xiaomi|infinix|tecno)\b/},
    {cat:"📺 TV y video", rx:/\b(tv|televisor|television|smart tv|google tv|android tv|qled|oled|monitor|proyector)\b/},
    {cat:"🔊 Audio", rx:/\b(audio|parlante|bafle|torre|home theater|home theatre|soundbar|sound bar|barra de sonido|auricular|auriculares|karaoke|equipo de musica|jbl)\b/},
    {cat:"🔌 Cargadores y accesorios", rx:/\b(cargador|cargadores|cabezal|cable usb|cable tipo c|usb c|power bank|powerbank|funda|vidrio templado|soporte celular|adaptador)\b/},
    {cat:"❄️ Refrigeración", rx:/\b(heladera|freezer|frezzer|congelador|exhibidora|dispenser|conservadora electrica)\b/},
    {cat:"🌡️ Climatización", rx:/\b(aire acondicionado|split|estufa|calefactor|caloventor|calefaccion|ventilador|turbo|termotanque|panel calefactor)\b/},
    {cat:"🍳 Cocción", rx:/\b(cocina|horno|microondas|microonda|anafe|freidora|air fryer|parrilla|grill|panchera|campana)\b/},
    {cat:"⚡ Pequeños electro", rx:/\b(pava|cafetera|licuadora|batidora|mixer|tostadora|sandwichera|exprimidor|waflera|plancha|procesadora|yogurtera|hervidor)\b/},
    {cat:"🧺 Lavado", rx:/\b(lavarropas|lavarropa|secarropas|secarropa|lavavajillas|centrifugo|centrifuga|tender)\b/},
    {cat:"🧹 Limpieza", rx:/\b(aspiradora|aspirador|robot aspirador|mopa|escoba electrica|limpiavidrios|lavatapizados|hidrolavadora)\b/},
    {cat:"🛏️ Colchones y sommiers", rx:/\b(colchon|colchones|sommier|somier|sommiers)\b/},
    {cat:"🧵 Blanquería", rx:/\b(sabana|sabanas|acolchado|frazada|manta|cubrecama|almohada|toalla|toallon|cortina blackout)\b/},
    {cat:"💄 Cuidado personal y salud", rx:/\b(planchita|secador de pelo|afeitadora|depiladora|cortapelo|cortabarba|alisador|masajeador|tensiometro|oximetro|nebulizador|balanza personal|cepillo dental)\b/},
    {cat:"🔧 Herramientas", rx:/\b(taladro|amoladora|atornillador|soldadora|soldador|motosierra|compresor|herramienta|engrapadora|encoladora|llave de impacto|bordeadora)\b/},
    {cat:"💻 Informática", rx:/\b(notebook|computadora|pc|impresora|teclado|mouse|pendrive|disco|router|webcam)\b/},
    {cat:"🎮 Gaming", rx:/\b(gaming|gamer|playstation|ps5|ps4|xbox|nintendo|consola|joystick|game stick)\b/},
    {cat:"🧸 Juguetes", rx:/\b(juguete|muñeca|muneca|robot|pistola juguete|hidrogel|avion juguete|juego infantil)\b/},
    {cat:"🚲 Deportes y movilidad", rx:/\b(bicicleta|bici|monopatin|patin|patines|patineta|cinta de correr|mancuerna|pesas|eliptica)\b/},
    {cat:"⛺ Camping y aire libre", rx:/\b(camping|carpa|gazebo|reposera|bolsa de dormir|conservadora|sombrilla|pileta|fogonero)\b/},
    {cat:"🪑 Muebles", rx:/\b(mueble|ropero|placard|comoda|mesa|silla|sillon|escritorio|rack|estanteria|biblioteca)\b/},
    {cat:"🍺 Bazar y mesa", rx:/\b(bazar|olla|sarten|cacerola|cubiertos|vajilla|vaso|copa|botella|bacha|utensilios|especiero|bowl)\b/},
    {cat:"🏠 Hogar y deco", rx:/\b(hogar|deco|decoracion|humidificador|organizador|lampara|velador|griferia|alfombra)\b/},
    {cat:"🚗 Autos y motos", rx:/\b(autoestereo|estereo|autoradio|auto|moto|casco|cubierta|neumatico|arrancador de auto)\b/}
  ];

  function nombreDetectado(texto) {
    const t = norm(texto);
    if (/\b(?:soy|me llamo|habla)\s+(?:maxi|maximiliano)\b/.test(t) || t === "maxi" || t === "maximiliano") return "Maxi";
    if (/\b(?:soy|me llamo|habla)\s+(?:angie|angela)\b/.test(t) || t === "angie" || t === "angela") return "Angie";
    return "";
  }

  function universoTienda() {
    const salida = [];
    const vistos = new Set();

    const agregar = (p) => {
      if (!p || p.id === undefined || p.id === null) return;
      const id = String(p.id);
      if (vistos.has(id)) return;
      let visible = true;
      try {
        visible = typeof window.tiendaEstaVisibleYConStock === "function"
          ? !!window.tiendaEstaVisibleYConStock(p)
          : p.visible !== false && p.sinStock !== true;
      } catch (e) {
        visible = p.visible !== false && p.sinStock !== true;
      }
      if (!visible) return;
      vistos.add(id);
      salida.push(p);
    };

    try { (window.tiendaProductos || []).forEach(agregar); } catch (e) {}

    try {
      if (typeof window.cargarListaCelus === "function") {
        const celus = window.cargarListaCelus() || [];
        celus.forEach((c, i) => {
          if (!c || !Number(c.precio) || c.ocultoTienda || c.sinStock) return;
          agregar({
            id: "celu_" + i,
            esCelu: true,
            nombre: c.nombre || "",
            venta: Number(c.precio) || 0,
            categoria: "📱 Celulares",
            caracteristicas: c.caracteristicas || "",
            visible: true,
            sinStock: false,
            foto: c.foto || ""
          });
        });
      }
    } catch (e) {}

    return salida;
  }

  function categoriaProducto(p) {
    try {
      if (typeof window.catProd === "function") return String(window.catProd(p) || p.categoria || "📦 Otros");
    } catch (e) {}
    return String((p && p.categoria) || "📦 Otros");
  }

  function categoriasIntencion(texto) {
    const q = norm(texto);
    return REGLAS_CATEGORIA.filter((r) => r.rx.test(q)).map((r) => r.cat);
  }

  function tokensConsulta(texto) {
    return norm(texto).split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w));
  }

  function historialUsuarios() {
    try {
      return (window._margaritaHist || []).filter((m) => m && m.rol !== "margarita").map((m) => String(m.texto || ""));
    } catch (e) { return []; }
  }

  function consultaConContexto(texto) {
    const actual = String(texto || "");
    const t = norm(actual);
    const esContinuacion = !categoriasIntencion(actual).length &&
      (/^(pasame|dame|mostrame|otro|otra|otros|otras|algo|uno|una|si|no|dale|bueno|mas|más)\b/.test(t) ||
       /\b(mas barato|más barato|mas economico|más economico|otro modelo|otra opcion|3 modelos|tres modelos)\b/.test(t));
    if (!esContinuacion) return actual;
    const prev = historialUsuarios().slice(-4).reverse().find((x) => categoriasIntencion(x).length || tokensConsulta(x).length >= 2);
    return prev ? prev + " " + actual : actual;
  }

  function productosParaConsulta(texto) {
    const consulta = consultaConContexto(texto);
    const q = norm(consulta);
    const tokens = tokensConsulta(consulta);
    const cats = categoriasIntencion(consulta);
    const buscaBarato = /\b(barato|economico|económico|menor precio|mas barato|más barato)\b/.test(q);
    const buscaPremium = /\b(premium|mejor|tope|alta gama|mas potente|más potente)\b/.test(q);
    const esCargador = cats.includes("🔌 Cargadores y accesorios") && /\bcargador/.test(q);
    const universo = universoTienda();

    const puntuados = universo.map((p) => {
      const nombre = String(p.nombre || "");
      const cat = categoriaProducto(p);
      const car = String(p.caracteristicas || "");
      const bolsa = norm(nombre + " " + cat + " " + car);
      let score = p.destacado ? 1 : 0;

      tokens.forEach((w) => {
        if (bolsa.includes(w)) score += w.length >= 4 ? 5 : 3;
        if (norm(nombre).includes(w)) score += 2;
      });

      cats.forEach((c) => {
        if (cat === c) score += 16;
        else if (c === "📺 TV y video" && (cat === "📺 TV" || cat === "📺 TV y video")) score += 16;
        else if (c === "❄️ Refrigeración" && (cat === "❄️ Heladeras" || cat === "❄️ Refrigeración")) score += 16;
        else if (c === "🍳 Cocción" && (cat === "🍳 Cocina" || cat === "🍳 Cocción")) score += 16;
      });

      if (esCargador) {
        if (/\b(cargador|cabezal|power bank|powerbank|cable)\b/.test(norm(nombre))) score += 20;
        if (/\b(llave|taladro|amoladora|atornillador|herramienta|bateria de herramienta)\b/.test(norm(nombre))) score -= 30;
      }

      if (q && bolsa.includes(q)) score += 25;
      return { p, score, precio:Number(p.venta) || 0 };
    }).filter((x) => x.precio > 0 && (x.score > 0 || (!tokens.length && !cats.length)));

    puntuados.sort((a,b) => {
      if (buscaBarato && a.score >= b.score - 3 && b.score >= a.score - 3) return a.precio - b.precio;
      if (buscaPremium && a.score >= b.score - 3 && b.score >= a.score - 3) return b.precio - a.precio;
      return b.score - a.score || a.precio - b.precio;
    });

    const base = location.origin + location.pathname.replace(/\/[^/]*$/, "/");
    return puntuados.slice(0,42).map(({p}) => ({
      id:String(p.id),
      nombre:String(p.nombre || ""),
      categoria:categoriaProducto(p),
      precio:Number(p.venta) || 0,
      caracteristicas:String(p.caracteristicas || "").slice(0,280),
      url:base + "?prod=" + encodeURIComponent(p.id)
    }));
  }

  function resumenTienda() {
    const todos = [];
    try { (window.tiendaProductos || []).forEach((p) => todos.push(p)); } catch (e) {}
    try {
      if (typeof window.cargarListaCelus === "function") {
        (window.cargarListaCelus() || []).forEach((c, i) => todos.push({
          id:"celu_"+i, esCelu:true, nombre:c.nombre||"", venta:Number(c.precio)||0,
          categoria:"📱 Celulares", visible:!c.ocultoTienda, sinStock:!!c.sinStock,
          pendienteImagenAdmin:!c.foto, precioActualizado:c.precioActualizado||""
        }));
      }
    } catch (e) {}

    const porCat = new Map();
    let disponibles = 0, ocultos = 0, sinStock = 0, pendientesImagen = 0, preciosDesactualizados = 0, duplicados = 0;
    const ahora = Date.now();

    todos.forEach((p) => {
      const cat = categoriaProducto(p);
      porCat.set(cat, (porCat.get(cat) || 0) + 1);
      const oculto = p.visible === false || p.ocultoManualProveedor === true || p.ocultoPorDuplicado === true || p.ocultoTienda === true;
      const sin = p.sinStock === true;
      if (oculto) ocultos++;
      if (sin) sinStock++;
      if (!oculto && !sin && Number(p.venta) > 0) disponibles++;
      if (p.pendienteImagenAdmin === true || !String(p.foto || "").trim()) pendientesImagen++;
      if (p.ocultoPorDuplicado === true) duplicados++;
      const f = Date.parse(p.precioActualizado || "");
      if (f && ahora - f > 30 * 86400000) preciosDesactualizados++;
    });

    return {
      total:todos.length,
      disponibles,
      ocultos,
      sinStock,
      pendientesImagen,
      preciosDesactualizados,
      duplicados,
      categorias:Array.from(porCat.entries()).sort((a,b)=>a[0].localeCompare(b[0])).map(([nombre,cantidad])=>({nombre,cantidad}))
    };
  }

  function taxonomiaReal() {
    return resumenTienda().categorias.map((x) => x.nombre);
  }

  function saludoInicialSegunRol() {
    const rol = rolActual();
    if (rol === "admin") return "¡Hola! 🐝 ¿Quién está por ahí, Maxi o Angie? ¿En qué les doy una mano?";
    if (rol === "asesor") return "¡Hola equipo! 🐝 ¿En qué les doy una mano hoy? Vamos, hagamos que las cosas pasen chicos 😉";
    return "¡Hola! Soy Margarita 🐝 ¿En qué te puedo SERVIR hoy?";
  }

  function asegurarSaludoInicial() {
    const existentes = Array.from(mensajes.querySelectorAll(".margarita-bot"));
    const saludos = existentes.filter((b) => {
      const t = String(b.textContent || "").trim();
      return t.startsWith("¡Hola! Soy Margarita") || t.startsWith("¡Hola equipo!") || t.startsWith("¡Hola! 🐝");
    });
    saludos.slice(1).forEach((b) => b.remove());
    if (!saludos.length && typeof window.margaritaPintar === "function") {
      window.margaritaPintar("margarita", saludoInicialSegunRol());
    }
  }

  function enviarMargaritaMejorado() {
    if (window._margaritaCargando) return;
    const texto = String(input.value || "").trim();
    if (!texto) return;

    const detectado = nombreDetectado(texto);
    if (detectado) {
      if (nombreSesion !== detectado) saludoEspecialHecho = false;
      nombreSesion = detectado;
    }

    if (typeof window.margaritaPintar === "function") window.margaritaPintar("cliente", texto);
    if (!Array.isArray(window._margaritaHist)) window._margaritaHist = [];
    window._margaritaHist.push({rol:"usuario",texto});
    input.value = "";
    window._margaritaCargando = true;
    if (typeof window.margaritaEscribiendo === "function") window.margaritaEscribiendo(true);

    const payload = {
      mensajes:window._margaritaHist.slice(-14),
      productos:productosParaConsulta(texto),
      rol:rolActual(),
      nombre:nombreSesion,
      saludoEspecialPendiente:rolActual()==="admin" && !!nombreSesion && !saludoEspecialHecho,
      resumen:resumenTienda(),
      taxonomia:taxonomiaReal()
    };

    fetch("/api/margarita", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(payload)
    }).then((r)=>r.json()).then((data)=>{
      if (typeof window.margaritaEscribiendo === "function") window.margaritaEscribiendo(false);
      const resp = data && data.respuesta ? data.respuesta : "No pude responderte ahora 🐝 Probá nuevamente en un ratito.";
      if (typeof window.margaritaPintar === "function") window.margaritaPintar("margarita", resp);
      window._margaritaHist.push({rol:"margarita",texto:resp});
      if (payload.saludoEspecialPendiente) saludoEspecialHecho = true;
      window._margaritaCargando = false;
      decorarMensajes();
      mensajes.scrollTop = mensajes.scrollHeight;
    }).catch(()=>{
      if (typeof window.margaritaEscribiendo === "function") window.margaritaEscribiendo(false);
      if (typeof window.margaritaPintar === "function") window.margaritaPintar("margarita","No pude conectarme ahora 🐝 Probá de nuevo en un ratito.");
      window._margaritaCargando = false;
    });
  }

  window.margaritaEnviar = enviarMargaritaMejorado;

  let cierreTimer = null;
  let scrollBase = window.scrollY || 0;
  const vv = window.visualViewport || null;

  function abierto() {
    return overlay.classList.contains("abierto");
  }

  function ajustarViewport() {
    if (!abierto()) return;
    const top = vv ? vv.offsetTop : 0;
    const alto = vv ? vv.height : window.innerHeight;
    const pref = preferenciasActuales();

    if (pref.formato === "globo") {
      const margen = 8;
      const teclado = Math.max(0, window.innerHeight - (top + alto));
      panel.style.setProperty("top", "auto", "important");
      panel.style.setProperty("bottom", (teclado + margen) + "px", "important");
      panel.style.setProperty("height", Math.max(280, Math.min(520, Math.round(alto - 14))) + "px", "important");
    } else {
      panel.style.setProperty("top", Math.max(0, Math.round(top)) + "px", "important");
      panel.style.setProperty("bottom", "auto", "important");
      panel.style.setProperty("height", Math.max(220, Math.round(alto)) + "px", "important");
    }

    if (document.activeElement === input && Math.abs((window.scrollY || 0) - scrollBase) > 1) {
      try { window.scrollTo(0, scrollBase); } catch (e) {}
    }
  }

  function ajustarViewportRapido() {
    ajustarViewport();
    requestAnimationFrame(ajustarViewport);
    setTimeout(ajustarViewport, 18);
  }

  window.margaritaAbrir = function () {
    clearTimeout(cierreTimer);
    overlay.style.display = "block";
    scrollBase = window.scrollY || 0;
    asegurarSaludoInicial();
    requestAnimationFrame(() => {
      overlay.classList.add("abierto");
      decorarMensajes();
      asegurarControlesAdmin();
      ajustarViewportRapido();
      mensajes.scrollTop = mensajes.scrollHeight;
    });
  };

  window.margaritaCerrar = function () {
    overlay.classList.remove("abierto");
    clearTimeout(cierreTimer);
    cierreTimer = setTimeout(() => {
      if (!abierto()) {
        overlay.style.display = "none";
        panel.style.removeProperty("top");
        panel.style.removeProperty("bottom");
        panel.style.removeProperty("height");
      }
    }, 300);
  };

  fab.onclick = function (ev) {
    if (ev) {
      ev.preventDefault();
      ev.stopPropagation();
    }
    if (abierto()) window.margaritaCerrar();
    else window.margaritaAbrir();
    return false;
  };

  overlay.addEventListener("click", (ev) => { if (ev.target === overlay) window.margaritaCerrar(); });
  input.addEventListener("focus", () => {
    scrollBase = window.scrollY || 0;
    ajustarViewportRapido();
    mensajes.scrollTop = mensajes.scrollHeight;
  });
  input.addEventListener("blur", () => requestAnimationFrame(ajustarViewport));

  if (vv) {
    vv.addEventListener("resize", ajustarViewportRapido);
    vv.addEventListener("scroll", ajustarViewportRapido);
  }
  window.addEventListener("resize", ajustarViewportRapido);
  window.addEventListener("orientationchange", () => setTimeout(ajustarViewportRapido, 120));

  function sincronizarVistaTarjetas() {
    let vista = 0;
    try { vista = Number(window.tiendaVista || localStorage.getItem("ae_vista") || 0); } catch (e) {}
    document.querySelectorAll(".portada-cat-grid").forEach((g) => {
      g.classList.remove("vista-lista", "vista-chica");
      if (vista === 1) g.classList.add("vista-lista");
      else if (vista === 2) g.classList.add("vista-chica");
    });
    const btnVista = document.getElementById("btn-vista");
    if (btnVista) btnVista.style.removeProperty("display");
  }

  const gridTienda = document.getElementById("tienda-grid");
  if (gridTienda) {
    new MutationObserver(() => requestAnimationFrame(sincronizarVistaTarjetas)).observe(gridTienda, { childList: true, subtree: true });
  }

  document.documentElement.dataset.margaritaFormato = formatoGlobal;
  aplicarPreferencias();
  asegurarControlesAdmin();
  sincronizarVistaTarjetas();
  cargarFormatoNube();
  decorarMensajes();

  setInterval(() => {
    aplicarPreferencias();
    asegurarControlesAdmin();
    sincronizarVistaTarjetas();
  }, 900);

  document.documentElement.dataset.margaritaSidebar = MARGARITA_SIDEBAR_VERSION;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", instalarMargaritaSidebar, { once: true });
} else {
  instalarMargaritaSidebar();
}
