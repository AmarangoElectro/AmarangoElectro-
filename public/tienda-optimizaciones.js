const VERSION = "egress-2026-08-23-2";
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

let intentos = 0;
function instalar() {
  const a = instalarFotoProxy();
  const b = instalarZoomProxy();
  const c = instalarCatalogoCache();
  const d = instalarCacheUploads();
  const e = instalarVisibilidadAdminPersistente();
  if (!(a && b && c && d && e) && intentos++ < 60) setTimeout(instalar, 250);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", instalar, { once: true });
} else {
  instalar();
}
setTimeout(instalar, 0);

window.__AMARANGO_EGRESS_VERSION__ = VERSION;
