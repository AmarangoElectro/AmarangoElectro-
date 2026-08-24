const VERSION = "marketing-scroll-2026-08-24-1";
const STORAGE_MARK = "/storage/v1/object/public/tienda-fotos/";
const STORAGE_RENDER_MARK = "/storage/v1/render/image/public/tienda-fotos/";

function esFotoTienda(url) {
  const s = String(url || "");
  return s.includes(STORAGE_MARK) || s.includes(STORAGE_RENDER_MARK);
}

function urlImagenTienda(url, ancho) {
  const w = Math.max(80, Math.min(1400, Math.round(Number(ancho) || 400)));
  return `/api/imagen-tienda?src=${encodeURIComponent(String(url || ""))}&w=${w}`;
}

function instalarFotoProxy() {
  if (typeof window.fotoOpt !== "function") return false;
  if (window.fotoOpt.__aeEgress) return true;
  const anterior = window.fotoOpt;
  function fotoOptEgress(url, ancho) {
    if (esFotoTienda(url)) return urlImagenTienda(url, ancho);
    return anterior(url, ancho);
  }
  fotoOptEgress.__aeEgress = VERSION;
  fotoOptEgress.__anterior = anterior;
  window.fotoOpt = fotoOptEgress;
  return true;
}

function instalarZoomProxy() {
  if (typeof window.abrirFotoGrande !== "function") return false;
  if (window.abrirFotoGrande.__aeEgress) return true;
  const anterior = window.abrirFotoGrande;
  function abrirFotoGrandeEgress(url, nombre) {
    const u = esFotoTienda(url) ? urlImagenTienda(url, 1200) : url;
    return anterior(u, nombre);
  }
  abrirFotoGrandeEgress.__aeEgress = VERSION;
  abrirFotoGrandeEgress.__anterior = anterior;
  window.abrirFotoGrande = abrirFotoGrandeEgress;
  return true;
}

function instalarCatalogoCache() {
  if (typeof window.tiendaBajarNube !== "function") return false;
  if (window.tiendaBajarNube.__aeEgress) return true;
  const anterior = window.tiendaBajarNube;
  let enCurso = null;
  let ultimaSolicitud = 0;

  function tiendaBajarNubeEgress(intentos) {
    const ahora = Date.now();
    if (enCurso) return enCurso;
    if (ahora - ultimaSolicitud < 1200) return Promise.resolve();
    ultimaSolicitud = ahora;

    enCurso = fetch("/api/catalogo-cache", {
      method: "GET",
      headers: { accept:"application/json" },
      cache: "default",
    })
      .then((r) => {
        if (!r.ok) throw new Error(`Catálogo cache HTTP ${r.status}`);
        return r.json();
      })
      .then((fila) => {
        if (!fila || !Array.isArray(fila.datos)) throw new Error("Catálogo cache inválido");
        window.tiendaProductos = fila.datos;
        window.tiendaProductos.forEach((p) => {
          if (p && typeof p.visible === "undefined") p.visible = true;
        });
        try {
          localStorage.setItem("ae_tienda_catalogo", JSON.stringify(window.tiendaProductos));
        } catch (e) {}
        try {
          if (typeof window.tiendaCacheGrandeGuardar === "function") {
            const version = typeof window.tiendaVersionIncrementalLocal === "function"
              ? window.tiendaVersionIncrementalLocal()
              : 0;
            const guardado = window.tiendaCacheGrandeGuardar(window.tiendaProductos, version);
            if (guardado && typeof guardado.catch === "function") guardado.catch(() => {});
          }
        } catch (e) {}
        if (typeof window.tiendaRender === "function") window.tiendaRender();
      })
      .catch(() => anterior(intentos))
      .finally(() => { enCurso = null; });

    return enCurso;
  }

  tiendaBajarNubeEgress.__aeEgress = VERSION;
  tiendaBajarNubeEgress.__anterior = anterior;
  window.tiendaBajarNube = tiendaBajarNubeEgress;
  return true;
}

function instalarCacheUploads() {
  const sb = window.sbFotos;
  if (!sb || !sb.storage || typeof sb.storage.from !== "function") return false;
  if (sb.storage.__aeCacheFotos) return true;

  const originalFrom = sb.storage.from.bind(sb.storage);
  sb.storage.from = function fromCacheado(bucket) {
    const cliente = originalFrom(bucket);
    if (bucket === "tienda-fotos" && cliente && typeof cliente.upload === "function" && !cliente.__aeCacheFotos) {
      const originalUpload = cliente.upload.bind(cliente);
      cliente.upload = function uploadCacheado(path, body, options) {
        const opts = Object.assign({}, options || {}, { cacheControl: "31536000" });
        return originalUpload(path, body, opts);
      };
      cliente.__aeCacheFotos = VERSION;
    }
    return cliente;
  };
  sb.storage.__aeCacheFotos = VERSION;
  return true;
}

// En Administradores, ocultar un producto significa sacarlo SOLO de la tienda
// de clientes. La tarjeta sigue en la misma grilla y en la misma posición.
function instalarVisibilidadAdminPersistente() {
  if (window.__aeVisibilidadAdminPersistente === VERSION) return true;
  if (typeof window.tiendaEstaVisibleYConStock !== "function" ||
      typeof window.tiendaProductoAptoPortada !== "function" ||
      typeof window.tiendaRender !== "function" ||
      typeof window.tiendaToggleVisibleProd !== "function") return false;

  const visibleStockOriginal = window.tiendaEstaVisibleYConStock;
  const aptoPortadaOriginal = window.tiendaProductoAptoPortada;

  window.tiendaEstaVisibleYConStock = function tiendaEstaVisibleYConStockAdmin(p) {
    if (!window.tiendaEsAdmin || !p || p.visible !== false) return visibleStockOriginal(p);

    const visibleAnterior = p.visible;
    const ocultoManualAnterior = p.ocultoManualProveedor;
    const ocultoDuplicadoAnterior = p.ocultoPorDuplicado;
    try {
      p.visible = true;
      p.ocultoManualProveedor = false;
      p.ocultoPorDuplicado = false;
      return visibleStockOriginal(p);
    } finally {
      p.visible = visibleAnterior;
      p.ocultoManualProveedor = ocultoManualAnterior;
      p.ocultoPorDuplicado = ocultoDuplicadoAnterior;
    }
  };
  window.tiendaEstaVisibleYConStock.__aeAdminPersistente = VERSION;

  window.tiendaProductoAptoPortada = function tiendaProductoAptoPortadaAdmin(p) {
    if (!window.tiendaEsAdmin || !p || p.visible !== false) return aptoPortadaOriginal(p);

    const visibleAnterior = p.visible;
    try {
      p.visible = true;
      return aptoPortadaOriginal(p);
    } finally {
      p.visible = visibleAnterior;
    }
  };
  window.tiendaProductoAptoPortada.__aeAdminPersistente = VERSION;

  // Captura el switch profesional antes de su handler anterior para que el
  // movimiento ON/OFF sea visible. Después de la animación se guarda el estado.
  document.addEventListener("click", function animarSwitchVisibilidad(ev) {
    const objetivo = ev.target && ev.target.closest ? ev.target.closest(".ae-vis-switch") : null;
    if (!objetivo || !window.tiendaEsAdmin) return;

    ev.preventDefault();
    ev.stopImmediatePropagation();
    if (objetivo.dataset.aeBusy === "1") return;
    objetivo.dataset.aeBusy = "1";

    const pasaAVisible = !objetivo.classList.contains("is-on");
    objetivo.classList.toggle("is-on", pasaAVisible);
    objetivo.setAttribute("aria-checked", pasaAVisible ? "true" : "false");
    objetivo.setAttribute("aria-label", pasaAVisible ? "Ocultar producto" : "Mostrar producto");

    const fila = objetivo.closest(".ae-visibilidad-prof");
    const etiqueta = fila ? fila.querySelector(".ae-vis-label") : null;
    if (etiqueta) {
      etiqueta.textContent = pasaAVisible ? "Visible" : "Oculto";
      etiqueta.classList.toggle("is-on", pasaAVisible);
      etiqueta.classList.toggle("is-off", !pasaAVisible);
    }

    const tarjeta = objetivo.closest('[id^="card-"]');
    const id = tarjeta ? tarjeta.id.slice(5) : "";

    window.setTimeout(function() {
      try {
        if (id !== "") window.tiendaToggleVisibleProd(id);
      } finally {
        objetivo.dataset.aeBusy = "0";
      }
    }, 220);
  }, true);

  window.__aeVisibilidadAdminPersistente = VERSION;

  // Refresca una sola vez para reincorporar en la grilla principal del admin
  // los productos que ya estaban ocultos, sin publicarlos para clientes.
  window.setTimeout(function() {
    if (window.tiendaEsAdmin && typeof window.tiendaRender === "function") window.tiendaRender();
  }, 0);

  return true;
}

function esAdminActual() {
  if (window.tiendaEsAdmin === true) return true;
  try { return localStorage.getItem("ae_sesion_admin") === "1"; }
  catch (e) { return false; }
}

function mostrarAvisoBreve(texto) {
  try {
    if (typeof window.mostrarToast === "function") {
      window.mostrarToast(texto);
      return;
    }
  } catch (e) {}
  const n = document.createElement("div");
  n.textContent = texto;
  n.style.cssText = "position:fixed;left:50%;bottom:88px;transform:translateX(-50%);z-index:15000;background:#071c46;color:#fff;border-left:4px solid #FF7A00;border-radius:13px;padding:10px 14px;font:800 .78rem/1.25 system-ui;box-shadow:0 10px 28px rgba(0,0,0,.25);max-width:86vw;text-align:center;";
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 1800);
}

function urlPublicaTienda() {
  return `${window.location.origin}/`;
}

async function compartirTiendaPublica() {
  const url = urlPublicaTienda();
  const datos = {
    title: "AmarangoElectro",
    text: "Mirá la tienda de AmarangoElectro 🐝",
    url,
  };
  try {
    if (navigator.share) {
      await navigator.share(datos);
      return;
    }
  } catch (e) {
    if (e && e.name === "AbortError") return;
  }
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(url);
      mostrarAvisoBreve("🔗 Enlace de la tienda copiado");
      return;
    }
  } catch (e) {}
  window.prompt("Compartí este enlace de AmarangoElectro:", url);
}

function instalarBotonCompartirTienda() {
  const header = document.querySelector(".header");
  if (!header) return false;

  let boton = document.getElementById("ae-share-store-btn");
  const marca = header.querySelector(".hdr-marca");

  if (!boton) {
    boton = document.createElement("button");
    boton.id = "ae-share-store-btn";
    boton.type = "button";
    boton.className = "ae-share-store-btn";
    boton.setAttribute("aria-label", "Compartir tienda AmarangoElectro");
    boton.setAttribute("title", "Compartir tienda");
    boton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="2.5"></circle><circle cx="6" cy="12" r="2.5"></circle><circle cx="18" cy="19" r="2.5"></circle><path d="m8.3 10.7 7.3-4.2M8.3 13.3l7.3 4.2"></path></svg>';
    boton.style.cssText = "position:absolute;top:11px;right:58px;z-index:6;width:38px;height:38px;border-radius:11px;background:rgba(255,255,255,.14);border:1.5px solid rgba(255,255,255,.28);color:#fff;display:flex;align-items:center;justify-content:center;padding:0;box-shadow:0 3px 10px rgba(0,0,0,.10);-webkit-tap-highlight-color:transparent;touch-action:manipulation;";
    const svg = boton.querySelector("svg");
    if (svg) svg.style.cssText = "width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;";
    boton.addEventListener("click", function(ev) {
      ev.preventDefault();
      ev.stopPropagation();
      try { if (navigator.vibrate) navigator.vibrate(6); } catch (e) {}
      compartirTiendaPublica();
    });
    header.appendChild(boton);
  }

  if (marca) {
    marca.style.setProperty("padding-right", "96px", "important");
    marca.dataset.aeSharePadding = "1";
  }
  return true;
}

function protegerControlesInternosFueraDeAdmin() {
  const admin = esAdminActual();
  const selectores = [
    ".ae-visibilidad-prof",
    'details[id^="opts-"]',
    ".ae-copy-actions"
  ];

  document.querySelectorAll(selectores.join(",")).forEach((el) => {
    if (admin) {
      if (el.dataset.aeClienteOculto === "1") {
        el.style.removeProperty("display");
        delete el.dataset.aeClienteOculto;
      }
      return;
    }
    el.style.setProperty("display", "none", "important");
    el.dataset.aeClienteOculto = "1";
  });

  // Si el modal de marca llegara a reconstruir una acción de edición, un
  // usuario no admin nunca debe verla ni poder tocarla.
  document.querySelectorAll(".ae-pro-dialog-actions .secondary").forEach((el) => {
    if (!admin && /editar|borrar|eliminar|precio/i.test(el.textContent || "")) {
      el.style.setProperty("display", "none", "important");
      el.dataset.aeClienteOculto = "1";
    } else if (admin && el.dataset.aeClienteOculto === "1") {
      el.style.removeProperty("display");
      delete el.dataset.aeClienteOculto;
    }
  });
}

function instalarProteccionClienteYCompartir() {
  if (window.__aeProteccionClienteCompartir !== VERSION) {
    // En vista no administrativa, mantener apretada una imagen no abre ni el
    // menú gris del navegador ni las herramientas internas de imagen.
    window.addEventListener("contextmenu", function bloquearMenuImagenCliente(ev) {
      if (esAdminActual()) return;
      const img = ev.target && ev.target.closest ? ev.target.closest("#tienda-grid img, #modal-cuotas-body img") : null;
      if (!img) return;
      ev.preventDefault();
      ev.stopImmediatePropagation();
    }, true);

    let uiRaf = 0;
    const obs = new MutationObserver(function() {
      if (uiRaf) return;
      uiRaf = window.requestAnimationFrame(function() {
        uiRaf = 0;
        protegerControlesInternosFueraDeAdmin();
        instalarBotonCompartirTienda();
      });
    });
    obs.observe(document.documentElement, { childList:true, subtree:true });
    window.__aeProteccionClienteCompartir = VERSION;
  }

  protegerControlesInternosFueraDeAdmin();
  return instalarBotonCompartirTienda();
}

let intentos = 0;
function instalar() {
  const a = instalarFotoProxy();
  const b = instalarZoomProxy();
  const c = instalarCatalogoCache();
  const d = instalarCacheUploads();
  const e = instalarVisibilidadAdminPersistente();
  const f = instalarProteccionClienteYCompartir();
  if (!(a && b && c && d && e && f) && intentos++ < 60) setTimeout(instalar, 250);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", instalar, { once: true });
} else {
  instalar();
}
setTimeout(instalar, 0);

window.__AMARANGO_EGRESS_VERSION__ = VERSION;