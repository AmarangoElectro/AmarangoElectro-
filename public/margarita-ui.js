export const MARGARITA_AVATAR = "/margarita-avatar.webp";

const MARGARITA_SIDEBAR_VERSION = "sidebar-2026-08-23-5";
const MARGARITA_UI_DEFAULT = { formato: "mitad" };

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

  if (!document.getElementById("margarita-sidebar-estilos")) {
    const style = document.createElement("style");
    style.id = "margarita-sidebar-estilos";
    style.textContent = `
      #margarita-overlay{
        position:fixed!important;
        inset:0!important;
        z-index:9998!important;
        background:rgba(2,8,20,.42)!important;
        backdrop-filter:blur(7px)!important;
        -webkit-backdrop-filter:blur(7px)!important;
        opacity:0!important;
        pointer-events:none!important;
        align-items:initial!important;
        justify-content:initial!important;
        transition:opacity .22s ease!important;
      }
      #margarita-overlay.abierto{
        opacity:1!important;
        pointer-events:auto!important;
      }

      #margarita-panel{
        position:fixed!important;
        top:0!important;
        right:0!important;
        left:auto!important;
        bottom:auto!important;
        min-height:0!important;
        background:#ECE5DD!important;
        display:flex!important;
        flex-direction:column!important;
        overflow:hidden!important;
        border:1px solid rgba(255,255,255,.34)!important;
        box-shadow:-18px 0 46px rgba(0,0,0,.28)!important;
        transition:transform .28s cubic-bezier(.4,0,.2,1),width .18s ease!important;
        will-change:transform,width!important;
      }

      html[data-margarita-formato="mitad"] #margarita-panel{
        width:clamp(210px,58vw,300px)!important;
        height:100dvh!important;
        border-radius:26px 0 0 26px!important;
        transform:translateX(100%)!important;
      }
      html[data-margarita-formato="mitad"] #margarita-overlay.abierto #margarita-panel{
        transform:translateX(0)!important;
      }

      html[data-margarita-formato="globo"] #margarita-overlay{
        background:rgba(2,8,20,.24)!important;
        backdrop-filter:blur(4px)!important;
        -webkit-backdrop-filter:blur(4px)!important;
      }
      html[data-margarita-formato="globo"] #margarita-panel{
        width:min(340px,88vw)!important;
        height:min(66dvh,560px)!important;
        top:auto!important;
        right:12px!important;
        bottom:18px!important;
        border-radius:26px!important;
        box-shadow:0 22px 55px rgba(0,0,0,.34)!important;
        transform:translateY(20px) scale(.985)!important;
      }
      html[data-margarita-formato="globo"] #margarita-overlay.abierto #margarita-panel{
        transform:translateY(0) scale(1)!important;
      }

      #margarita-panel .mg-header{
        flex:0 0 auto!important;
        box-shadow:0 1px 0 rgba(255,255,255,.16)!important;
      }
      #margarita-panel .mg-header img{
        width:48px!important;
        height:48px!important;
        object-fit:cover!important;
        border-radius:50%!important;
      }

      .mg-formato-switch{
        display:none;
        flex:0 0 auto;
        grid-template-columns:1fr 1fr;
        gap:7px;
        padding:8px 9px;
        background:linear-gradient(180deg,#f8fbff,#eef4fb);
        border-bottom:1px solid rgba(11,45,107,.10);
      }
      .mg-formato-switch.on{display:grid}
      .mg-formato-switch button{
        border:1px solid #d7e0ec;
        border-radius:11px;
        background:#fff;
        color:#475569;
        padding:8px 6px;
        font-size:.68rem;
        line-height:1;
        font-weight:900;
        font-family:inherit;
        cursor:pointer;
      }
      .mg-formato-switch button.on{
        color:#0B2D6B;
        border-color:#0B2D6B;
        background:#eef5ff;
        box-shadow:inset 0 0 0 1px #0B2D6B;
      }

      #margarita-panel .mg-mensajes{
        flex:1 1 auto!important;
        min-height:0!important;
        overflow-y:auto!important;
        overscroll-behavior:contain!important;
        -webkit-overflow-scrolling:touch!important;
        padding-left:10px!important;
        padding-right:10px!important;
      }

      #margarita-panel .mg-input{
        flex:0 0 auto!important;
        position:relative!important;
        display:flex!important;
        align-items:center!important;
        gap:8px!important;
        padding:9px 9px calc(9px + env(safe-area-inset-bottom))!important;
        box-shadow:0 -8px 24px rgba(38,50,56,.05)!important;
      }
      #margarita-panel .mg-input input,
      #margarita-panel .mg-input textarea{
        flex:1 1 auto!important;
        min-width:0!important;
        height:56px!important;
        min-height:56px!important;
        border-radius:28px!important;
      }
      #margarita-panel .mg-input button{
        flex:0 0 58px!important;
        width:58px!important;
        min-width:58px!important;
        max-width:58px!important;
        height:58px!important;
        min-height:58px!important;
        padding:0!important;
        margin:0!important;
        border-radius:50%!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        font-size:1.55rem!important;
        line-height:1!important;
      }

      #margarita-fab{
        z-index:10000!important;
        width:54px!important;
        height:54px!important;
        overflow:hidden!important;
        border-radius:50%!important;
        box-shadow:0 8px 24px rgba(11,45,107,.26)!important;
      }
      #margarita-fab img{
        width:100%!important;
        height:100%!important;
        object-fit:cover!important;
        border-radius:50%!important;
      }

      .mg-bot-row{
        align-self:flex-start!important;
        display:flex!important;
        align-items:flex-end!important;
        gap:8px!important;
        max-width:97%!important;
        width:auto!important;
      }
      .mg-bot-avatar{
        width:36px!important;
        height:36px!important;
        flex:0 0 36px!important;
        border-radius:50%!important;
        object-fit:cover!important;
        border:2px solid #fff!important;
        box-shadow:0 3px 10px rgba(11,45,107,.22)!important;
        background:#fff!important;
      }
      .mg-bot-row .margarita-bot{
        align-self:auto!important;
        max-width:100%!important;
        border-radius:16px 16px 16px 5px!important;
        box-shadow:0 3px 12px rgba(0,0,0,.08)!important;
      }

      .mg-admin-config-btn{
        width:36px;height:36px;border-radius:10px;
        border:1px solid rgba(255,255,255,.34);
        background:rgba(255,255,255,.14);color:#fff;
        display:none;align-items:center;justify-content:center;
        font-size:1rem;cursor:pointer;margin-left:4px;flex:0 0 auto;
      }
      .mg-admin-config-btn:active{transform:scale(.94)}

      #mg-admin-modal{
        position:fixed;inset:0;z-index:10020;
        background:rgba(2,8,20,.58);
        backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);
        display:none;align-items:center;justify-content:center;padding:18px;
      }
      #mg-admin-modal.on{display:flex}
      .mg-admin-card{
        width:min(390px,94vw);
        background:linear-gradient(180deg,#fff 0%,#f8fbff 100%);
        border:1px solid rgba(11,45,107,.10);
        border-radius:24px;padding:20px;
        box-shadow:0 24px 70px rgba(0,0,0,.34);
        font-family:inherit;
      }
      .mg-admin-title{font-size:1.08rem;font-weight:900;color:#0B2D6B;margin-bottom:5px}
      .mg-admin-sub{font-size:.73rem;color:#64748b;margin-bottom:17px;line-height:1.45}
      .mg-admin-label{font-size:.74rem;font-weight:900;color:#1f2937;margin:12px 0 8px}
      .mg-admin-opciones{display:grid;grid-template-columns:1fr 1fr;gap:9px}
      .mg-admin-opcion{
        border:1.5px solid #dbe4ef;background:#fff;border-radius:14px;
        padding:13px 9px;font-weight:900;color:#334155;cursor:pointer;font-family:inherit;
        box-shadow:0 3px 12px rgba(15,23,42,.04);
      }
      .mg-admin-opcion.on{
        border-color:#0B2D6B;background:linear-gradient(180deg,#eef5ff,#fff);
        color:#0B2D6B;box-shadow:inset 0 0 0 1px #0B2D6B,0 5px 16px rgba(11,45,107,.10);
      }
      .mg-admin-cerrar{
        margin-top:17px;width:100%;border:0;border-radius:13px;
        background:linear-gradient(135deg,#0B2D6B,#1e5bc8);
        color:#fff;padding:12px;font-weight:900;cursor:pointer;font-family:inherit;
      }
      .mg-admin-ok{font-size:.67rem;color:#059669;font-weight:800;margin-top:10px;min-height:16px;text-align:center}

      @media(max-width:360px){
        html[data-margarita-formato="mitad"] #margarita-panel{width:62vw!important}
        html[data-margarita-formato="globo"] #margarita-panel{width:90vw!important;right:8px!important}
        #margarita-panel .mg-input button{
          flex-basis:54px!important;width:54px!important;min-width:54px!important;max-width:54px!important;height:54px!important;min-height:54px!important;
        }
        .mg-bot-avatar{width:34px!important;height:34px!important;flex-basis:34px!important}
      }
      @media(min-width:700px){
        html[data-margarita-formato="mitad"] #margarita-panel{width:360px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function esAdminActual() {
    try {
      if (typeof window.esAdmin === "function") return !!window.esAdmin();
    } catch (e) {}
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = String(localStorage.key(i) || "");
        if (!/ae_rol/i.test(k)) continue;
        if (String(localStorage.getItem(k) || "").toLowerCase() === "admin") return true;
      }
    } catch (e) {}
    return false;
  }

  function preferenciasActuales() {
    const cfg = window.CONFIG && window.CONFIG.margaritaUI ? window.CONFIG.margaritaUI : null;
    return { formato: cfg && cfg.formato === "globo" ? "globo" : "mitad" };
  }

  let preferenciasAplicadas = "";

  function refrescarBotonesFormato(formato) {
    document.querySelectorAll("[data-mg-formato]").forEach((b) => {
      b.classList.toggle("on", b.dataset.mgFormato === formato);
    });
  }

  function aplicarPreferencias() {
    const pref = preferenciasActuales();
    if (pref.formato !== preferenciasAplicadas) {
      preferenciasAplicadas = pref.formato;
      document.documentElement.dataset.margaritaFormato = pref.formato;
    }
    refrescarBotonesFormato(pref.formato);
  }

  function guardarFormato(valor) {
    if (!esAdminActual() || !window.CONFIG) return;
    if (!window.CONFIG.margaritaUI || typeof window.CONFIG.margaritaUI !== "object") {
      window.CONFIG.margaritaUI = { ...MARGARITA_UI_DEFAULT };
    }
    window.CONFIG.margaritaUI.formato = valor;
    preferenciasAplicadas = "";
    aplicarPreferencias();

    try {
      if (typeof window.guardarConfig === "function") window.guardarConfig();
    } catch (e) {}

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
    modal.addEventListener("click", (ev) => {
      if (ev.target === modal) modal.classList.remove("on");
    });
    modal.querySelector(".mg-admin-cerrar").addEventListener("click", () => modal.classList.remove("on"));
    modal.querySelectorAll("[data-mg-formato]").forEach((b) => {
      b.addEventListener("click", () => guardarFormato(b.dataset.mgFormato));
    });
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
        /cerrar/i.test(b.getAttribute("aria-label") || "") ||
        String(b.textContent || "").trim() === "×"
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
    cambios.forEach((cambio) => {
      cambio.addedNodes.forEach((nodo) => {
        if (nodo.nodeType !== 1) return;
        if (nodo.classList && nodo.classList.contains("margarita-bot")) decorarBurbujaBot(nodo);
        if (nodo.querySelectorAll) nodo.querySelectorAll(".margarita-bot").forEach(decorarBurbujaBot);
      });
    });
  });
  observadorMensajes.observe(mensajes, { childList: true, subtree: false });

  let saludoVisto = false;
  Array.from(mensajes.querySelectorAll(".margarita-bot")).forEach((burbuja) => {
    const txt = String(burbuja.textContent || "").trim();
    if (!txt.startsWith("¡Hola! Soy Margarita")) return;
    if (saludoVisto) burbuja.remove();
    else saludoVisto = true;
  });
  decorarMensajes();

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

    const yaHaySaludo = Array.from(mensajes.querySelectorAll(".margarita-bot")).some((b) =>
      String(b.textContent || "").trim().startsWith("¡Hola! Soy Margarita")
    );

    if (!yaHaySaludo && typeof window.margaritaPintar === "function") {
      window.margaritaPintar(
        "margarita",
        "¡Hola! Soy Margarita 🐝 ¿Qué estás buscando? Te hago unas preguntas cortitas y te ayudo a elegir la mejor opción."
      );
    }

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

  overlay.addEventListener("click", (ev) => {
    if (ev.target === overlay) window.margaritaCerrar();
  });

  input.addEventListener("focus", () => {
    scrollBase = window.scrollY || 0;
    ajustarViewportRapido();
    mensajes.scrollTop = mensajes.scrollHeight;
  });

  input.addEventListener("blur", () => {
    requestAnimationFrame(ajustarViewport);
  });

  if (vv) {
    vv.addEventListener("resize", ajustarViewportRapido);
    vv.addEventListener("scroll", ajustarViewportRapido);
  }

  window.addEventListener("resize", ajustarViewportRapido);
  window.addEventListener("orientationchange", () => setTimeout(ajustarViewportRapido, 120));

  document.documentElement.dataset.margaritaFormato = MARGARITA_UI_DEFAULT.formato;
  aplicarPreferencias();
  asegurarControlesAdmin();

  setInterval(() => {
    aplicarPreferencias();
    asegurarControlesAdmin();
  }, 1200);

  document.documentElement.dataset.margaritaSidebar = MARGARITA_SIDEBAR_VERSION;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", instalarMargaritaSidebar, { once: true });
} else {
  instalarMargaritaSidebar();
}
