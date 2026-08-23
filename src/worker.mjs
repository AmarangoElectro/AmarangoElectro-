import core from "./worker-core.mjs";

const IMG_BUCKET_PATH = "/storage/v1/object/public/tienda-fotos/";
const IMG_RENDER_PATH = "/storage/v1/render/image/public/tienda-fotos/";
const CACHE_CATALOGO_SEG = 30;
const CACHE_IMAGEN_BROWSER_SEG = 30 * 24 * 60 * 60;
const CACHE_IMAGEN_EDGE_SEG = 365 * 24 * 60 * 60;

function respuestaJson(datos, status = 200, headersExtra = {}) {
  return new Response(JSON.stringify(datos), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "x-content-type-options": "nosniff",
      ...headersExtra,
    },
  });
}

function hostSupabasePermitido(env) {
  try { return new URL(String(env.SUPABASE_URL || "")).hostname; }
  catch { return ""; }
}

async function cachePutSeguro(cache, key, response, ctx) {
  const trabajo = cache.put(key, response.clone()).catch(() => {});
  if (ctx && typeof ctx.waitUntil === "function") ctx.waitUntil(trabajo);
  else await trabajo;
}

async function servirCatalogoCache(request, env, ctx) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return respuestaJson({ ok:false, error:"Método no permitido" }, 405, { allow:"GET, HEAD" });
  }
  const base = String(env.SUPABASE_URL || "").replace(/\/$/, "");
  const key = String(env.SUPABASE_ANON_KEY || "");
  if (!base || !key) return respuestaJson({ ok:false, error:"Supabase no configurado" }, 503);

  const urlPedido = new URL(request.url);
  const cacheKey = new Request(`${urlPedido.origin}/api/catalogo-cache`, { method:"GET" });
  const cache = caches.default;
  const hit = await cache.match(cacheKey);
  if (hit) {
    const h = new Headers(hit.headers);
    h.set("x-amarango-cache", "HIT");
    if (request.method === "HEAD") return new Response(null,{status:hit.status,headers:h});
    return new Response(hit.body,{status:hit.status,headers:h});
  }

  const origen = `${base}/rest/v1/tienda_catalogo?id=eq.catalogo&select=datos,actualizado&limit=1`;
  let r;
  try {
    r = await fetch(origen, {
      headers: { apikey:key, authorization:`Bearer ${key}`, accept:"application/json" },
    });
  } catch {
    return respuestaJson({ ok:false, error:"No se pudo leer el catálogo" }, 502);
  }
  if (!r.ok) return respuestaJson({ ok:false, error:`Catálogo HTTP ${r.status}` }, 502);

  let filas;
  try { filas = await r.json(); }
  catch { return respuestaJson({ ok:false, error:"Catálogo inválido" }, 502); }
  const fila = Array.isArray(filas) ? filas[0] : null;
  if (!fila || !Array.isArray(fila.datos)) return respuestaJson({ ok:false, error:"Catálogo vacío" }, 502);

  const headers = {
    "cache-control": `public, max-age=8, s-maxage=${CACHE_CATALOGO_SEG}, stale-while-revalidate=60`,
    "x-amarango-cache": "MISS",
  };
  const respuesta = respuestaJson({ datos:fila.datos, actualizado:fila.actualizado || null }, 200, headers);
  await cachePutSeguro(cache, cacheKey, respuesta, ctx);
  if (request.method === "HEAD") return new Response(null,{status:200,headers:respuesta.headers});
  return respuesta;
}

function construirOrigenImagen(src, ancho) {
  const u = new URL(src);
  const transformada = new URL(u.toString());
  if (ancho > 0 && transformada.pathname.startsWith(IMG_BUCKET_PATH)) {
    transformada.pathname = transformada.pathname.replace(
      "/storage/v1/object/public/",
      "/storage/v1/render/image/public/",
    );
    transformada.searchParams.set("width", String(ancho));
    transformada.searchParams.set("quality", "72");
    transformada.searchParams.set("resize", "contain");
  }
  return transformada;
}

async function fetchImagenValida(url) {
  try {
    const r = await fetch(url.toString(), {
      headers:{ accept:"image/avif,image/webp,image/jpeg,image/png,image/*" },
      redirect:"follow",
    });
    const tipo = String(r.headers.get("content-type") || "").toLowerCase();
    if (!r.ok || !tipo.startsWith("image/")) return null;
    return r;
  } catch { return null; }
}

async function servirImagenTienda(request, env, ctx) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return respuestaJson({ ok:false, error:"Método no permitido" }, 405, { allow:"GET, HEAD" });
  }
  const pedido = new URL(request.url);
  const src = pedido.searchParams.get("src") || "";
  let origen;
  try { origen = new URL(src); }
  catch { return respuestaJson({ ok:false, error:"Imagen inválida" }, 400); }

  const hostPermitido = hostSupabasePermitido(env);
  const rutaPermitida = origen.pathname.startsWith(IMG_BUCKET_PATH) || origen.pathname.startsWith(IMG_RENDER_PATH);
  if (origen.protocol !== "https:" || !hostPermitido || origen.hostname !== hostPermitido || !rutaPermitida) {
    return respuestaJson({ ok:false, error:"Origen de imagen no permitido" }, 403);
  }

  let ancho = Number(pedido.searchParams.get("w") || 0);
  if (!Number.isFinite(ancho)) ancho = 0;
  ancho = Math.max(0, Math.min(1400, Math.round(ancho)));

  const cacheUrl = new URL(`${pedido.origin}/api/imagen-tienda`);
  cacheUrl.searchParams.set("src", origen.toString());
  if (ancho) cacheUrl.searchParams.set("w", String(ancho));
  const cacheKey = new Request(cacheUrl.toString(), { method:"GET" });
  const cache = caches.default;
  const hit = await cache.match(cacheKey);
  if (hit) {
    const h = new Headers(hit.headers);
    h.set("x-amarango-image-cache", "HIT");
    if (request.method === "HEAD") return new Response(null,{status:hit.status,headers:h});
    return new Response(hit.body,{status:hit.status,headers:h});
  }

  const transformada = construirOrigenImagen(origen.toString(), ancho);
  let r = await fetchImagenValida(transformada);
  // Image Transformations puede no estar disponible según el plan de Supabase.
  // En ese caso usamos el original, pero igualmente queda cacheado en Cloudflare.
  if (!r && transformada.toString() !== origen.toString()) r = await fetchImagenValida(origen);
  if (!r) return respuestaJson({ ok:false, error:"No se pudo cargar la imagen" }, 502);

  const h = new Headers(r.headers);
  h.set("cache-control", `public, max-age=${CACHE_IMAGEN_BROWSER_SEG}, immutable`);
  h.set("cdn-cache-control", `public, max-age=${CACHE_IMAGEN_EDGE_SEG}`);
  h.set("x-amarango-image-cache", "MISS");
  h.set("x-content-type-options", "nosniff");
  h.delete("set-cookie");
  h.delete("content-length");
  const respuesta = new Response(r.body,{status:200,headers:h});
  await cachePutSeguro(cache, cacheKey, respuesta, ctx);
  if (request.method === "HEAD") return new Response(null,{status:200,headers:h});
  return respuesta;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/api/catalogo-cache") return servirCatalogoCache(request, env, ctx);
    if (url.pathname === "/api/imagen-tienda") return servirImagenTienda(request, env, ctx);
    return core.fetch(request, env, ctx);
  },
  async scheduled(controller, env, ctx) {
    return core.scheduled(controller, env, ctx);
  },
};
