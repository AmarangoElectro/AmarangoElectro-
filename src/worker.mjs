import core from "./worker-core.mjs";

const IMG_BUCKET_PATH = "/storage/v1/object/public/tienda-fotos/";
const IMG_RENDER_PATH = "/storage/v1/render/image/public/tienda-fotos/";
const CACHE_CATALOGO_SEG = 30;
const CACHE_IMAGEN_BROWSER_SEG = 30 * 24 * 60 * 60;
const CACHE_IMAGEN_EDGE_SEG = 365 * 24 * 60 * 60;

const ADMIN_UI_STYLE = `<style id="ae-admin-ui-prof-style">
.ae-visibilidad-prof{display:flex!important;align-items:center!important;gap:8px!important;margin-top:7px!important;color:var(--sub)!important;font-size:.62rem!important;font-weight:900!important;line-height:1!important;min-height:30px!important}
.ae-vis-switch{position:relative!important;width:48px!important;height:28px!important;min-width:48px!important;border:0!important;border-radius:999px!important;padding:0!important;background:#d7dce5!important;box-shadow:inset 0 0 0 1px rgba(15,23,42,.08)!important;cursor:pointer!important;transition:background .18s ease,box-shadow .18s ease,transform .12s ease!important;-webkit-tap-highlight-color:transparent!important}
.ae-vis-switch:active{transform:scale(.96)!important}
.ae-vis-switch.is-on{background:#22c55e!important;box-shadow:inset 0 0 0 1px rgba(5,150,105,.16),0 0 0 3px rgba(34,197,94,.09)!important}
.ae-vis-knob{position:absolute!important;top:3px!important;left:3px!important;width:22px!important;height:22px!important;border-radius:50%!important;background:#fff!important;box-shadow:0 2px 5px rgba(0,0,0,.24)!important;transition:transform .18s cubic-bezier(.4,0,.2,1)!important;pointer-events:none!important}
.ae-vis-switch.is-on .ae-vis-knob{transform:translateX(20px)!important}
.ae-vis-label{font-size:.64rem!important;font-weight:900!important;letter-spacing:.01em!important;white-space:nowrap!important}
.ae-vis-label.is-on{color:#159447!important}
.ae-vis-label.is-off{color:#6b7280!important}
details[id^="opts-"]>summary.ae-opciones-prof{cursor:pointer!important;list-style:none!important;padding:10px 12px!important;background:linear-gradient(135deg,#0B2D6B 0%,#174f9c 100%)!important;border:1px solid rgba(255,255,255,.16)!important;border-bottom:3px solid var(--nar)!important;border-radius:10px!important;font-size:.72rem!important;font-weight:900!important;color:#fff!important;text-align:center!important;box-shadow:0 5px 13px rgba(11,45,107,.20)!important;letter-spacing:.01em!important;transition:transform .14s ease,box-shadow .14s ease!important;-webkit-tap-highlight-color:transparent!important}
details[id^="opts-"]>summary.ae-opciones-prof::-webkit-details-marker{display:none!important}
details[id^="opts-"]>summary.ae-opciones-prof:active{transform:scale(.985)!important;box-shadow:0 2px 7px rgba(11,45,107,.18)!important}
details[id^="opts-"][open]>summary.ae-opciones-prof{background:linear-gradient(135deg,#123e8f 0%,#1e5bc8 100%)!important}
</style>`;

const ADMIN_UI_SCRIPT = `<script id="ae-admin-ui-prof-script">
(function(){
  if(window.__aeAdminUiProfesional)return;
  window.__aeAdminUiProfesional=true;
  var raf=0,observador=null,gridObservado=null;
  function idDesdeMarcador(input){
    var codigo=input.getAttribute('onchange')||'';
    var m=codigo.match(/tiendaToggleMarcado\\(([^)]+)\\)/);
    if(!m)return null;
    var raw=(m[1]||'').trim();
    if((raw.charAt(0)==='\\''&&raw.charAt(raw.length-1)==='\\'')||(raw.charAt(0)==='"'&&raw.charAt(raw.length-1)==='"'))raw=raw.slice(1,-1);
    if(/^-?\\d+$/.test(raw))return Number(raw);
    return raw;
  }
  function transformarVisibilidad(){
    var grid=document.getElementById('tienda-grid');
    if(!grid)return;
    var labels=grid.querySelectorAll('label');
    for(var i=0;i<labels.length;i++){
      var label=labels[i];
      if(label.classList.contains('ae-visibilidad-prof'))continue;
      var input=label.querySelector('input[type="checkbox"][onchange*="tiendaToggleMarcado"]');
      if(!input)continue;
      var texto=(label.textContent||'').trim();
      if(texto.indexOf('Visible')<0&&texto.indexOf('Oculto')<0)continue;
      var pid=idDesdeMarcador(input);
      if(pid===null||pid==='')continue;
      var visible=texto.indexOf('Visible')>=0&&texto.indexOf('Oculto')<0;
      label.removeAttribute('style');
      label.className='ae-visibilidad-prof';
      while(label.firstChild)label.removeChild(label.firstChild);
      var sw=document.createElement('button');
      sw.type='button';
      sw.className='ae-vis-switch'+(visible?' is-on':'');
      sw.setAttribute('role','switch');
      sw.setAttribute('aria-checked',visible?'true':'false');
      sw.setAttribute('aria-label',visible?'Ocultar producto':'Mostrar producto');
      var knob=document.createElement('span');
      knob.className='ae-vis-knob';
      sw.appendChild(knob);
      sw.addEventListener('click',(function(id){return function(ev){
        ev.preventDefault();ev.stopPropagation();
        if(typeof window.tiendaToggleVisibleProd==='function')window.tiendaToggleVisibleProd(id);
      };})(pid));
      var estado=document.createElement('span');
      estado.className='ae-vis-label '+(visible?'is-on':'is-off');
      estado.textContent=visible?'Visible':'Oculto';
      label.appendChild(sw);label.appendChild(estado);
    }
  }
  function transformarOpciones(){
    var sums=document.querySelectorAll('details[id^="opts-"] > summary');
    for(var i=0;i<sums.length;i++){
      var s=sums[i];
      if(s.classList.contains('ae-opciones-prof'))continue;
      if((s.textContent||'').indexOf('Opciones del producto')<0)continue;
      s.removeAttribute('style');
      s.classList.add('ae-opciones-prof');
      s.textContent='⚙️ Opciones del producto ▾';
    }
  }
  function aplicar(){transformarVisibilidad();transformarOpciones();vigilarGrid();}
  function programar(){if(raf)return;raf=requestAnimationFrame(function(){raf=0;aplicar();});}
  function vigilarGrid(){
    var grid=document.getElementById('tienda-grid');
    if(!grid||grid===gridObservado)return;
    if(observador)observador.disconnect();
    gridObservado=grid;
    observador=new MutationObserver(programar);
    observador.observe(grid,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',programar,{once:true});
  else programar();
  setTimeout(programar,250);setTimeout(programar,900);
})();
</script>`;

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

function aplicarUiAdminProfesional(response) {
  const tipo = String(response.headers.get("content-type") || "").toLowerCase();
  if (!tipo.includes("text/html")) return response;
  return new HTMLRewriter()
    .on("head", { element(el){ el.append(ADMIN_UI_STYLE,{html:true}); } })
    .on("body", { element(el){ el.append(ADMIN_UI_SCRIPT,{html:true}); } })
    .transform(response);
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
    const respuesta = await core.fetch(request, env, ctx);
    if (request.method === "GET") {
      const conUi = aplicarUiAdminProfesional(respuesta);
      // El documento principal (/ e /index.html, que redirige a /) es el que
      // cambia con cada deploy. Si el borde de Cloudflare o el navegador lo
      // guardan en caché, un cambio subido a GitHub puede tardar en verse o
      // directamente no verse hasta purgar el caché a mano. Forzamos que
      // SIEMPRE se pida una copia fresca del HTML; los assets con hash
      // (imágenes, JS, CSS con ?v=) siguen cacheados normalmente aparte.
      if (url.pathname === "/" || url.pathname === "/index.html") {
        const tipo = String(conUi.headers.get("content-type") || "").toLowerCase();
        if (tipo.includes("text/html")) {
          const h = new Headers(conUi.headers);
          h.set("cache-control", "no-store, must-revalidate");
          h.set("cdn-cache-control", "no-store");
          return new Response(conUi.body, { status: conUi.status, headers: h });
        }
      }
      return conUi;
    }
    return respuesta;
  },
  async scheduled(controller, env, ctx) {
    return core.scheduled(controller, env, ctx);
  },
};
