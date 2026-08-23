const VERSION = "egress-2026-08-23-1";
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
      headers: { accept: "application/json" },
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

let intentos = 0;
function instalar() {
  const a = instalarFotoProxy();
  const b = instalarZoomProxy();
  const c = instalarCatalogoCache();
  const d = instalarCacheUploads();
  if (!(a && b && c && d) && intentos++ < 60) setTimeout(instalar, 250);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", instalar, { once: true });
} else {
  instalar();
}
setTimeout(instalar, 0);

window.__AMARANGO_EGRESS_VERSION__ = VERSION;
