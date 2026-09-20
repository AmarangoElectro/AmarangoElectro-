import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = process.argv[2] ?? path.join(projectRoot, "AmarangoElectro-V16-V4.11-Real-Catalog-QA-Preview.html");
const standaloneOutputPath = process.argv[3] ?? path.join(projectRoot, "AmarangoElectro-V16-V4.11-Standalone-Android.html");
const { default: worker } = await import(`${path.join(projectRoot, "dist/server/index.js")}?preview=${Date.now()}`);
const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
const context = { waitUntil() {}, passThroughOnException() {} };

const mimeByExtension = {
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

async function publicImages(directory = path.join(projectRoot, "public"), prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    const relative = path.posix.join(prefix, entry.name);
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      results.push(...await publicImages(absolute, relative));
    } else if (mimeByExtension[path.extname(entry.name).toLowerCase()]) {
      const buffer = await readFile(absolute);
      const mime = mimeByExtension[path.extname(entry.name).toLowerCase()];
      results.push([`/${relative}`, `data:${mime};base64,${buffer.toString("base64")}`]);
    }
  }
  return results;
}

const images = (await publicImages()).sort((a, b) => b[0].length - a[0].length);
const cssFile = (await readdir(path.join(projectRoot, "dist/client/assets"))).find((name) => /^index-.*\.css$/.test(name));
if (!cssFile) throw new Error("No se encontró el CSS construido.");
let css = await readFile(path.join(projectRoot, "dist/client/assets", cssFile), "utf8");
for (const [source, data] of images) css = css.split(source).join(data);

async function snapshot(route) {
  const response = await worker.fetch(new Request(`http://preview.local${route}`, { headers: { accept: "text/html" } }), env, context);
  if (!response.ok) throw new Error(`${route} devolvió ${response.status}`);
  let html = await response.text();
  html = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<link\b[^>]*rel="(?:modulepreload|preload)"[^>]*>/gi, "")
    .replace(/<link\b[^>]*rel="stylesheet"[^>]*>/gi, "");
  for (const [source, data] of images) html = html.split(source).join(data);
  return html.replace("</body>", `<script>
    document.addEventListener("click", (event) => {
      const link = event.target.closest("a[href]");
      if (!link) return;
      event.preventDefault();
      parent.postMessage({ type: "amarango-preview-route", href: link.getAttribute("href") }, "*");
    });
  </script></body>`);
}

async function standalonePrototype(relativePath) {
  let html = await readFile(path.join(projectRoot, relativePath), "utf8");
  for (const [source, data] of images) html = html.split(source).join(data);
  return html;
}

const views = {
  os: await standalonePrototype("prototypes/AmarangoOS-V3-Product-Bridge.html"),
  home: await snapshot("/"),
  advisor: await snapshot("/mi-amarango"),
  admin: await snapshot("/administracion"),
  platform: await snapshot("/plataforma"),
  celulares: await snapshot("/categoria/celulares"),
  electrodomesticos: await snapshot("/categoria/electrodomesticos"),
  herramientas: await snapshot("/categoria/herramientas"),
  tecnologia: await snapshot("/categoria/tecnologia-accesorios"),
  hogar: await snapshot("/categoria/hogar"),
  descanso: await snapshot("/categoria/descanso"),
  cuidado: await snapshot("/categoria/cuidado-personal-salud"),
  bebes: await snapshot("/categoria/bebes-juguetes"),
  auto: await snapshot("/categoria/auto-motos-energia"),
  camping: await snapshot("/categoria/camping-aire-libre-mascotas"),
  gaming: await snapshot("/categoria/gaming"),
  otros: await snapshot("/categoria/otros"),
  buscar: await snapshot("/buscar"),
  lavado: await snapshot("/categoria/electrodomesticos?sector=lavado"),
  productoA16: await snapshot("/producto/samsung-galaxy-a16-128-gb-a16-128"),
  productoG15: await snapshot("/producto/motorola-moto-g15-256-gb-g15-256"),
};
const encoded = Object.fromEntries(Object.entries(views).map(([key, value]) => [key, Buffer.from(value).toString("base64")]));
const encodedCss = Buffer.from(css).toString("base64");

const preview = `<!doctype html>
<html lang="es-AR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>AmarangoElectro V16 · V4.11 Catálogo Read Only</title>
  <style>
    *{box-sizing:border-box}html,body{height:100%;margin:0;background:#111;font:14px/1.3 Inter,system-ui,sans-serif}
    .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
    .preview-bar{min-height:58px;display:flex;align-items:center;gap:8px;padding:8px 14px;background:#17120f;color:#fff;border-bottom:1px solid #3a2d26;flex-wrap:wrap}
    .preview-bar strong{margin-right:auto;white-space:nowrap}.preview-group{display:flex;gap:6px}.preview-bar select,.preview-bar button{border:1px solid #6a5142;border-radius:999px;background:#241b17;color:#fff;padding:9px 14px;cursor:pointer}.preview-bar select{max-width:260px}.preview-bar button[aria-pressed="true"]{background:#ec641f;border-color:#ec641f}
    .preview-stage{height:calc(100% - 58px);overflow:auto;display:flex;justify-content:center;background:#d9d9d9}.preview-stage iframe{display:block;width:100%;height:100%;min-height:760px;border:0;background:#fff;box-shadow:0 0 40px #0002}
    @media(max-width:900px){.preview-bar strong{width:100%}.preview-stage{height:calc(100% - 104px)}}
    @media(max-width:620px){.preview-group{width:100%;overflow:auto}.preview-bar button{padding:8px 10px}.preview-stage{height:calc(100% - 148px)}}
  </style>
</head>
<body>
  <nav class="preview-bar" aria-label="Vistas del preview">
    <strong>AmarangoElectro V16 · V4.11 Catálogo Read Only</strong>
    <label class="preview-group"><span class="sr-only">Vista</span><select id="view-select" aria-label="Elegir vista"><option value="home">Tienda · Home</option><option value="buscar">Buscador maestro</option><option value="celulares">Celulares · piloto</option><option value="lavado">Lavado · piloto</option><option value="productoA16">Ficha · Samsung A16</option><option value="productoG15">Ficha · Motorola G15</option><option value="advisor">Mi Amarango · Asesores</option><option value="admin">Administración</option><option value="platform">Tour unificado</option><option value="os">Product Bridge V3</option><option value="electrodomesticos">Electrodomésticos</option><option value="herramientas">Herramientas</option><option value="tecnologia">Tecnología & Accesorios</option><option value="hogar">Hogar</option><option value="descanso">Descanso</option><option value="cuidado">Cuidado personal & Salud</option><option value="bebes">Bebés & Juguetes</option><option value="auto">Auto, Motos & Energía</option><option value="camping">Camping, Aire libre & Mascotas</option><option value="gaming">Gaming</option><option value="otros">Explorar más</option></select></label>
    <span class="preview-group" aria-label="Ancho de revisión"><button data-width="auto" aria-pressed="true">Auto</button><button data-width="320" aria-pressed="false">320</button><button data-width="360" aria-pressed="false">360</button><button data-width="390" aria-pressed="false">390</button><button data-width="412" aria-pressed="false">412</button><button data-width="768" aria-pressed="false">Tablet</button></span>
  </nav>
  <main class="preview-stage"><iframe title="AmarangoElectro V16 · V4.11 catálogo read only"></iframe></main>
  <script>
    const views=${JSON.stringify(encoded)};
    const routeMap={electrodomesticos:"electrodomesticos",herramientas:"herramientas","tecnologia-accesorios":"tecnologia",hogar:"hogar",descanso:"descanso","cuidado-personal-salud":"cuidado","bebes-juguetes":"bebes","auto-motos-energia":"auto","camping-aire-libre-mascotas":"camping",gaming:"gaming",otros:"otros",celulares:"celulares"};
    const frame=document.querySelector("iframe");
    const viewSelect=document.querySelector("#view-select");
    const widthButtons=[...document.querySelectorAll("button[data-width]")];
    const sharedCss=new TextDecoder().decode(Uint8Array.from(atob(${JSON.stringify(encodedCss)}),character=>character.charCodeAt(0)));
    function show(view){
      const binary=atob(views[view]);
      const bytes=Uint8Array.from(binary, character=>character.charCodeAt(0));
      const decoded=new TextDecoder().decode(bytes);
      frame.srcdoc=view==="os" ? decoded : decoded.replace("</head>","<style>"+sharedCss+"</style></head>");
      viewSelect.value=view;
    }
    viewSelect.addEventListener("change",()=>show(viewSelect.value));
    widthButtons.forEach(button=>button.addEventListener("click",()=>{
      frame.style.width=button.dataset.width==="auto"?"100%":button.dataset.width+"px";
      widthButtons.forEach(item=>item.setAttribute("aria-pressed",String(item===button)));
    }));
    addEventListener("message",({data})=>{
      if(data?.type!=="amarango-preview-route")return;
      if(String(data.href).includes("motorola-moto-g15"))show("productoG15");
      else if(String(data.href).startsWith("/producto/"))show("productoA16");
      else if(String(data.href).startsWith("/buscar"))show("buscar");
      else if(String(data.href).startsWith("/mi-amarango"))show("advisor");
      else if(String(data.href).startsWith("/administracion"))show("admin");
      else if(String(data.href).startsWith("/plataforma"))show("platform");
      else if(String(data.href).startsWith("/amarango-os"))show("os");
      else if(String(data.href).includes("sector=lavado"))show("lavado");
      else { const match=String(data.href).match(/^\\/categoria\\/([^?#]+)/); show(match ? routeMap[match[1]] ?? "home" : "home"); }
    });
    show("home");
  </script>
</body>
</html>`;

await writeFile(outputPath, preview);
const imageMap = new Map(images);
const imageData = (source) => imageMap.get(source) ?? "";
const money = (amount) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(amount);
const v411Evidence = JSON.parse(await readFile(path.join(projectRoot, "fixtures/v411-catalog-evidence-public.json"), "utf8"));

const previewCategories = [
  ["celulares", "Celulares", "TECNOLOGÍA PERSONAL", "/categoria/celulares", "official", "Modelos premium, innovación y potencia para cada estilo."],
  ["smart-tv", "Smart TV", "IMAGEN & ENTRETENIMIENTO", "/categoria/smart-tv", "official", "Cine, profundidad y conectividad en gran escala."],
  ["audio", "Audio", "SONIDO & ENTRETENIMIENTO", "/categoria/audio", "official", "Parlantes, barras y auriculares que se sienten."],
  ["refrigeracion", "Refrigeración", "ELECTRODOMÉSTICOS", "/categoria/electrodomesticos?sector=refrigeracion", "official", "Heladeras, freezers y frigobares."],
  ["coccion", "Cocción", "SABORES & CALIDEZ", "/categoria/electrodomesticos?sector=coccion", "generated", "Cocinas, hornos y soluciones para cocinar."],
  ["climatizacion", "Climatización", "CONFORT TODO EL AÑO", "/categoria/electrodomesticos?sector=climatizacion", "official", "Frío, calor y bienestar para cada ambiente."],
  ["lavado", "Lavado", "HOGAR PREMIUM", "/categoria/electrodomesticos?sector=lavado", "official", "Cuidado moderno para tu ropa y tu día a día."],
  ["pequenos-electrodomesticos", "Pequeños electrodomésticos", "SOLUCIONES PRÁCTICAS", "/categoria/electrodomesticos?sector=pequenos-electrodomesticos", "generated", "Equipos que simplifican cada momento."],
  ["limpieza", "Limpieza", "ESPACIOS IMPECABLES", "/categoria/electrodomesticos?sector=limpieza", "generated", "Aspirado, vapor y cuidado del hogar."],
  ["colchones-sommiers", "Colchones y sommiers", "DESCANSO PREMIUM", "/categoria/descanso?sector=colchones-y-sommiers", "generated", "Confort y soporte para descansar mejor."],
  ["blanqueria", "Blanquería", "SUAVIDAD & LUZ", "/categoria/hogar?sector=blanqueria", "generated", "Textiles para renovar cada espacio."],
  ["muebles", "Muebles", "CONFORT & DISEÑO", "/categoria/hogar?sector=hogar-y-deco", "generated", "Muebles y soluciones para ambientes cálidos."],
  ["hogar-decoracion", "Hogar y decoración", "CASA & ESTILO", "/categoria/hogar?sector=hogar-y-deco", "official", "Calidez, luz natural y detalles que acompañan."],
  ["deporte-movilidad", "Deporte y movilidad", "MOVIMIENTO", "/categoria/otros", "generated", "Un sector preparado para crecer con evidencia auditada."],
  ["informatica", "Informática", "TRABAJO & ESTUDIO", "/categoria/tecnologia-accesorios", "generated", "Equipos y periféricos en una experiencia clara."],
  ["cargadores-accesorios", "Cargadores y accesorios", "CONECTÁ TODO", "/categoria/tecnologia-accesorios?sector=cargadores-y-accesorios", "generated", "Cables, cargadores y complementos."],
  ["cuidado-personal-salud", "Cuidado personal y salud", "BIENESTAR", "/categoria/cuidado-personal-salud", "generated", "Cuidado diario en una experiencia simple."],
  ["bebes", "Bebés", "FAMILIA", "/categoria/bebes-juguetes?sector=bebes", "generated", "Soluciones para acompañar cada etapa."],
  ["auto-motos", "Accesorios para auto y motos", "MOVILIDAD", "/categoria/auto-motos-energia?sector=auto-y-motos", "generated", "Accesorios y soluciones para el camino."],
  ["mascotas", "Mascotas", "COMPAÑÍA", "/categoria/camping-aire-libre-mascotas?sector=mascotas", "generated", "Cuidado, comodidad y juego."],
  ["gaming", "Gaming", "PLAYSTATION & MÁS", "/categoria/gaming", "official", "Consolas, juegos y accesorios gamer."],
  ["otros", "Otros", "EXPLORÁ MÁS", "/categoria/otros", "generated", "Búsqueda progresiva sin listas interminables."],
];

const categoryById = new Map(previewCategories.map((category) => [category[0], category]));
const productRoute = (product) => product.id === "g15-256"
  ? "/producto/motorola-moto-g15-256-gb-g15-256"
  : product.id === "a16-256"
    ? "/producto/samsung-galaxy-a16-256-gb-a16-256"
    : product.id === "sec-65"
      ? "/producto/codini-secarropas-6-5-kg-sec-65"
      : "/producto/samsung-galaxy-a16-128-gb-a16-128";

function previewHeader() {
  return `<header class="v411-native-header"><a href="/" class="v411-native-logo"><img src="${imageData("/logo-320.webp")}" alt="AmarangoElectro"></a><form class="header-search" action="/buscar"><input name="q" aria-label="Buscar productos" placeholder="Buscar A16, Samsung, heladera..."><button>Buscar</button></form><nav><a href="/buscar">Buscar</a><a href="/mi-amarango">Mi Amarango</a><a href="/administracion">Admin</a></nav></header>`;
}

function previewFooter() {
  return `<footer class="v411-native-footer"><img src="${imageData("/logo-320.webp")}" alt=""><div><strong>Tecnología para tu vida.</strong><span>Personas para acompañarte.</span></div><small>V4.11 · Laboratorio de solo lectura · Sin conexión productiva</small></footer>`;
}

function categoryArtwork(category, eager = false) {
  const [id, title, eyebrow, href, mode, description] = category;
  const desktop = mode === "official" ? `/assets/category-art/v410/official/${id}.webp` : `/assets/category-art/v410/${id}.webp`;
  const mobile = mode === "official" ? `/assets/category-art/v410/official/mobile/${id}.webp` : `/assets/category-art/v410/mobile/${id}.webp`;
  return `<a href="${href}" class="v411-native-category" data-category-art="${id}"><picture><source media="(max-width:760px)" srcset="${imageData(mobile)}"><img src="${imageData(desktop)}" alt="${title}" loading="${eager ? "eager" : "lazy"}"></picture>${mode === "generated" ? `<span class="v411-native-shade"></span><span class="v411-native-copy"><small>${eyebrow}</small><strong>${title}</strong><em>${description}</em></span>` : ""}</a>`;
}

function previewProductCard(product) {
  const stableId = `v411-evidence:${product.id}`;
  const stock = product.availability === "available" ? "in_stock" : "unknown";
  return `<article class="catalog-card v411-native-product" data-product-id="${stableId}" data-product-brand="${product.brand}" data-product-category="${product.category}" data-product-price="${product.sale}" data-product-stock="${stock}"><div class="product-visual"><span class="v411-native-product-brand">${product.brand}</span><span class="v411-native-product-model">${product.model ?? "Producto"}</span><span class="image-status">FOTO OFICIAL PENDIENTE</span><div class="card-tools"><button type="button" aria-label="Guardar en favoritos">♡</button><button type="button" aria-label="Compartir producto">↗</button></div></div><div class="catalog-card-body"><p class="product-brand">${product.brand}</p><h3>${product.name}</h3><p class="product-description">${product.memory ? `Memoria ${product.memory}. ` : ""}Datos limitados a la evidencia auditada.</p><dl class="product-card-specs"><div><dt>Modelo</dt><dd>${product.model ?? "A confirmar"}</dd></div><div><dt>Disponibilidad</dt><dd>${product.stock_label}</dd></div></dl><div class="data-pending data-available"><strong>${money(product.sale)}</strong><span>Contado · cuotas no validadas</span></div><a class="catalog-card-link" href="${productRoute(product)}">Ver ficha completa <span>→</span></a></div></article>`;
}

function homeView() {
  const heroSlides = [
    ["electrodomesticos", "Electrodomésticos"], ["celulares", "Celulares"], ["smart-tv", "Smart TV"], ["audio", "Audio"]
  ].map(([slug, label], index) => `<article class="hero-slide image-slide ${index === 0 ? "active" : ""}" aria-hidden="${index !== 0}" data-slide-slug="${slug}"><picture><source media="(max-width:620px)" srcset="${imageData(`/assets/mobile/${slug}.webp`)}"><img src="${imageData(`/assets/banners/${slug}.webp`)}" alt="${label} AmarangoElectro"></picture></article>`).join("");
  return `${previewHeader()}<main><section class="hero-slider image-active v411-native-hero" aria-label="Campañas AmarangoElectro">${heroSlides}<button class="hero-arrow previous" aria-label="Banner anterior">‹</button><button class="hero-arrow next" aria-label="Banner siguiente">›</button><div class="hero-dots">${[0,1,2,3].map((index) => `<button class="${index === 0 ? "active" : ""}" aria-label="Banner ${index + 1}"></button>`).join("")}</div></section><section class="retail-categories" id="categorias"><div class="section-intro split"><div><p class="eyebrow orange">22 CATEGORÍAS</p><h2>Encontrá tu mundo Amarango.</h2></div><p>La home se mantiene editorial. Cada categoría abre su sector y recién allí muestra productos.</p></div><div class="retail-category-featured">${previewCategories.map((category, index) => categoryArtwork(category, index < 2)).join("")}</div><div class="retail-category-count"><strong>22</strong><span>categorías V4.10 preservadas</span></div></section><section class="v411-native-trust"><p class="eyebrow orange">EVIDENCIA V4.11</p><h2>Catálogo único. Roles separados.</h2><p>Cliente, Asesor y Administración consumen el mismo contrato Product V16. Este archivo no se conecta a producción y no puede escribir datos.</p></section></main>${previewFooter()}`;
}

function productsFor(view) {
  if (view === "lavado" || view === "electrodomesticos") return v411Evidence.products.filter((product) => product.subcategory === "lavado");
  if (view === "buscar") return v411Evidence.products;
  return v411Evidence.products.filter((product) => product.category === "celulares");
}

function catalogView(view, title, artId = "celulares") {
  const products = productsFor(view);
  const category = categoryById.get(artId) ?? categoryById.get("celulares");
  return `${previewHeader()}<main class="v411-native-catalog"><div class="v411-native-sector-art">${categoryArtwork(category, true)}</div><section class="v411-native-gate"><span>READ ONLY</span><div><strong>Evidencia de laboratorio V4.11</strong><p>No es un snapshot verificado de producción. Los faltantes se muestran como faltantes.</p></div></section><section class="catalog-shell"><div class="section-intro split"><div><p class="eyebrow orange">CATÁLOGO PRODUCT V16</p><h1>${title}</h1></div><p>${products.length} registros públicos sanitizados disponibles en esta vista.</p></div><form class="catalog-search"><input aria-label="Buscar en catálogo" placeholder="Buscar nombre, marca o modelo"><button>Buscar</button></form><div class="catalog-controls"><div class="brand-filters"><button type="button" class="v411-static-active">Todos</button>${[...new Set(products.map((product) => product.brand))].map((brand) => `<button type="button">${brand}</button>`).join("")}</div><label class="catalog-price-filter">Precio máximo <input type="number" min="0" inputmode="numeric" placeholder="Sin límite"></label><button class="catalog-availability-filter" type="button">Con disponibilidad confirmada</button><button class="catalog-favorites-filter" type="button">Solo favoritos</button></div><p class="catalog-count"><span>${products.length} opciones para explorar</span></p><div class="catalog-grid">${products.length ? products.map(previewProductCard).join("") : `<div class="v411-native-empty"><strong>Sin evidencia validada</strong><p>No inventamos productos para completar esta categoría.</p></div>`}</div></section></main>${previewFooter()}`;
}

function productView(product) {
  return `${previewHeader()}<main class="v411-native-detail"><a href="/categoria/${product.category}">← Volver a ${product.category}</a><section><div class="v411-native-detail-visual"><span>${product.brand}</span><strong>${product.model ?? "Producto"}</strong><small>FOTO OFICIAL PENDIENTE</small></div><div class="v411-native-detail-copy"><p class="eyebrow orange">${product.brand}</p><h1>${product.name}</h1><p>Información limitada a campos presentes en la evidencia sanitizada V4.11.</p><dl><div><dt>Modelo</dt><dd>${product.model ?? "No informado"}</dd></div><div><dt>Categoría</dt><dd>${product.category}</dd></div><div><dt>Disponibilidad</dt><dd>${product.stock_label}</dd></div><div><dt>Actualización de evidencia</dt><dd>${product.updated}</dd></div></dl><div class="v411-native-price"><strong>${money(product.sale)}</strong><span>Contado · financiación no validada</span></div><div class="v411-native-actions"><button aria-label="Guardar en favoritos" data-product-id="v411-evidence:${product.id}">♡ Favorito</button><button aria-label="Compartir producto">Compartir</button><button>Consultar</button></div></div></section></main>${previewFooter()}`;
}

function roleView(role) {
  const isAdmin = role === "Administración";
  return `${previewHeader()}<main class="v411-native-role"><section class="v411-native-role-head"><p class="eyebrow orange">AMARANGO OS · V4.11</p><h1>${role}</h1><p>${isAdmin ? "Vista administrativa preservada y bloqueada para escritura real." : "Espacio comercial con el mismo catálogo oficial, sin datos privados."}</p></section><div class="v411-native-role-grid"><article><small>CATÁLOGO MAESTRO</small><strong>4</strong><span>registros de evidencia</span></article><article><small>MODO</small><strong>READ</strong><span>sin operaciones remotas</span></article><article><small>ESTADO</small><strong>LAB</strong><span>producción no conectada</span></article></div><section class="catalog-grid">${productsFor("buscar").map(previewProductCard).join("")}</section>${isAdmin ? `<section class="v411-native-admin-tools"><h2>Herramientas preservadas</h2><p>Admin Accelerator · Calculadora AmarangoElectro · Sistema Placas · Ofertas & Outlet · carga masiva.</p><button disabled>Edición real bloqueada en V4.11</button></section>` : ""}</main>${previewFooter()}`;
}

const nativeViews = {
  home: homeView(),
  buscar: catalogView("buscar", "Buscar en todo el piloto", "celulares"),
  celulares: catalogView("celulares", "Celulares", "celulares"),
  lavado: catalogView("lavado", "Lavado", "lavado"),
  electrodomesticos: catalogView("electrodomesticos", "Electrodomésticos", "refrigeracion"),
  herramientas: catalogView("herramientas", "Herramientas", "otros"),
  tecnologia: catalogView("tecnologia", "Tecnología y accesorios", "informatica"),
  hogar: catalogView("hogar", "Hogar", "hogar-decoracion"),
  descanso: catalogView("descanso", "Descanso", "colchones-sommiers"),
  cuidado: catalogView("cuidado", "Cuidado personal y salud", "cuidado-personal-salud"),
  bebes: catalogView("bebes", "Bebés y juguetes", "bebes"),
  auto: catalogView("auto", "Auto, motos y energía", "auto-motos"),
  camping: catalogView("camping", "Camping, aire libre y mascotas", "mascotas"),
  gaming: catalogView("gaming", "Gaming", "gaming"),
  otros: catalogView("otros", "Explorar más", "otros"),
  productoA16: productView(v411Evidence.products.find((product) => product.id === "a16-128")),
  productoG15: productView(v411Evidence.products.find((product) => product.id === "g15-256")),
  advisor: roleView("Mi Amarango · Asesores"),
  admin: roleView("Administración"),
  platform: roleView("Tour unificado"),
};

const nativeCss = `
  .v411-native-header{position:sticky;top:42px;z-index:1000;min-height:82px;padding:12px clamp(14px,4vw,58px);display:grid;grid-template-columns:auto minmax(240px,680px) auto;align-items:center;gap:22px;background:#fff;color:#071a39;box-shadow:0 10px 34px #071a3912}.v411-native-logo img{display:block;width:62px;height:62px;object-fit:contain}.v411-native-header form{display:flex;padding:5px;border:1px solid #d9e0e8;border-radius:999px;background:#f5f7fa}.v411-native-header input{flex:1;min-width:0;border:0;outline:0;background:transparent;padding:0 14px}.v411-native-header button,.v411-native-header nav a{border:0;border-radius:999px;background:#071a39;color:#fff;padding:11px 18px;font-weight:800}.v411-native-header nav{display:flex;gap:7px}.v411-native-header nav a{background:#eef3f8;color:#071a39;font-size:11px}.v411-native-hero{position:relative!important;height:auto!important;min-height:0!important;aspect-ratio:1672/941;overflow:hidden;background:#071a39}.v411-native-hero .hero-slide{position:absolute;inset:0;opacity:0;transition:opacity .7s ease}.v411-native-hero .hero-slide.active{opacity:1}.v411-native-hero picture,.v411-native-hero img{display:block;width:100%;height:100%}.v411-native-hero img{object-fit:contain}.v411-native-hero .hero-arrow{position:absolute;z-index:4;top:50%;width:42px;height:42px;border:1px solid #ffffff55;border-radius:50%;background:#071a3975;color:#fff;font-size:28px}.v411-native-hero .previous{left:18px}.v411-native-hero .next{right:18px}.v411-native-hero .hero-dots{position:absolute;z-index:4;left:50%;bottom:18px;transform:translateX(-50%);display:flex;gap:7px}.v411-native-hero .hero-dots button{width:8px;height:8px;padding:0;border:0;border-radius:50%;background:#fff7}.v411-native-hero .hero-dots button.active{width:26px;border-radius:9px;background:#ff742b}.v411-native-category{position:relative;display:block;overflow:hidden;border-radius:26px;aspect-ratio:4/3;background:#071a39;box-shadow:0 18px 44px #071a3915}.v411-native-category picture,.v411-native-category img{position:absolute;inset:0;display:block;width:100%;height:100%}.v411-native-category img{object-fit:contain}.v411-native-category[data-category-art="coccion"] img,.v411-native-category[data-category-art="pequenos-electrodomesticos"] img,.v411-native-category[data-category-art="limpieza"] img,.v411-native-category[data-category-art="colchones-sommiers"] img,.v411-native-category[data-category-art="blanqueria"] img,.v411-native-category[data-category-art="muebles"] img,.v411-native-category[data-category-art="deporte-movilidad"] img,.v411-native-category[data-category-art="informatica"] img,.v411-native-category[data-category-art="cargadores-accesorios"] img,.v411-native-category[data-category-art="cuidado-personal-salud"] img,.v411-native-category[data-category-art="bebes"] img,.v411-native-category[data-category-art="auto-motos"] img,.v411-native-category[data-category-art="mascotas"] img,.v411-native-category[data-category-art="otros"] img{object-fit:cover}.v411-native-shade{position:absolute;inset:0;background:linear-gradient(0deg,#03132eea 0%,transparent 66%)}.v411-native-copy{position:absolute;z-index:2;left:6%;right:6%;bottom:7%;display:grid;color:#fff}.v411-native-copy small{color:#ff8b45;font-weight:900;letter-spacing:1px}.v411-native-copy strong{font-size:clamp(28px,3.4vw,52px);line-height:.95}.v411-native-copy em{margin-top:8px;font-style:normal;opacity:.82}.v411-native-trust,.v411-native-gate,.v411-native-role-head,.v411-native-admin-tools{margin:clamp(28px,6vw,80px) auto;max-width:1180px;padding:clamp(24px,5vw,60px);border-radius:30px;background:#071a39;color:#fff}.v411-native-footer{min-height:190px;padding:34px clamp(18px,5vw,70px);display:flex;align-items:center;gap:20px;flex-wrap:wrap;background:#06152e;color:#fff}.v411-native-footer img{width:72px;height:72px;object-fit:contain}.v411-native-footer div{display:grid;font-size:18px}.v411-native-footer small{margin-left:auto;opacity:.65}.v411-native-catalog{padding-bottom:50px}.v411-native-sector-art{max-width:1180px;margin:32px auto}.v411-native-sector-art .v411-native-category{aspect-ratio:16/7}.v411-native-gate{display:flex;gap:18px;align-items:center;padding:18px 24px;margin-block:20px}.v411-native-gate>span{border-radius:999px;padding:8px 12px;background:#ff742b;font-weight:900}.v411-native-gate p{margin:3px 0 0;opacity:.72}.v411-native-product .product-visual{display:grid;place-content:center;min-height:270px;background:radial-gradient(circle at 70% 20%,#ff864230,transparent 32%),linear-gradient(135deg,#eaf1f9,#fff);color:#071a39}.v411-native-product-brand{font-size:14px;font-weight:900;letter-spacing:2px;text-align:center}.v411-native-product-model{font-size:clamp(42px,6vw,76px);font-weight:950;letter-spacing:-4px}.v411-native-product .image-status{position:absolute;bottom:12px}.v411-native-detail{max-width:1180px;margin:34px auto;padding:0 20px}.v411-native-detail>section{display:grid;grid-template-columns:1.05fr .95fr;gap:44px;margin-top:24px}.v411-native-detail-visual{min-height:520px;border-radius:32px;display:grid;place-content:center;text-align:center;background:radial-gradient(circle at 70% 20%,#ff864235,transparent 30%),linear-gradient(135deg,#eaf1f9,#fff);color:#071a39}.v411-native-detail-visual span{font-weight:900;letter-spacing:2px}.v411-native-detail-visual strong{font-size:86px;line-height:1}.v411-native-detail-visual small{margin-top:30px;opacity:.5}.v411-native-detail-copy h1{font-size:clamp(38px,5vw,68px);line-height:.95}.v411-native-detail-copy dl{display:grid;grid-template-columns:1fr 1fr;gap:10px}.v411-native-detail-copy dl div{padding:14px;border-radius:16px;background:#f2f5f8}.v411-native-detail-copy dt{font-size:10px;font-weight:900;text-transform:uppercase}.v411-native-detail-copy dd{margin:4px 0 0}.v411-native-price{display:grid;margin:22px 0;padding:20px;border-radius:18px;background:#071a39;color:#fff}.v411-native-price strong{font-size:34px}.v411-native-actions{display:flex;gap:8px;flex-wrap:wrap}.v411-native-actions button,.v411-native-admin-tools button{padding:13px 18px;border:0;border-radius:999px;background:#ff742b;color:#fff;font-weight:850}.v411-native-role{max-width:1180px;margin:auto;padding:0 20px 60px}.v411-native-role-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:28px}.v411-native-role-grid article{padding:24px;border-radius:22px;background:#f2f5f8;display:grid}.v411-native-role-grid strong{font-size:34px;color:#071a39}.v411-native-empty{grid-column:1/-1;padding:50px;border:1px dashed #aab6c5;border-radius:24px;text-align:center}.v411-native-empty strong{font-size:25px}.catalog-shell{max-width:1180px;margin:auto;padding:0 20px}.catalog-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.catalog-controls{display:flex;flex-wrap:wrap;gap:8px;margin-block:14px}.catalog-controls button,.brand-filters button{padding:10px 13px;border:1px solid #d5dde7;border-radius:999px;background:#fff}.catalog-price-filter{display:flex;align-items:center;gap:8px;padding:7px 12px;border:1px solid #d5dde7;border-radius:999px}.catalog-price-filter input{width:110px;border:0}.catalog-search{display:flex;gap:8px;margin:18px 0}.catalog-search input{flex:1;min-width:0;padding:14px;border:1px solid #d5dde7;border-radius:14px}.catalog-search button{border:0;border-radius:14px;padding:0 22px;background:#071a39;color:#fff;font-weight:800}
  @media(max-width:820px){.v411-native-header{top:42px;grid-template-columns:auto 1fr}.v411-native-header nav{display:none}.catalog-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.v411-native-detail>section{grid-template-columns:1fr}.v411-native-detail-visual{min-height:390px}.v411-native-sector-art{margin:14px}.v411-native-sector-art .v411-native-category{aspect-ratio:4/3}.v411-native-role-grid{grid-template-columns:1fr}.v411-native-footer small{margin-left:0;width:100%}}
  @media(max-width:620px){.v411-native-hero{aspect-ratio:941/1672}}
  @media(max-width:520px){.v411-native-header{padding:8px;gap:8px}.v411-native-logo img{width:48px;height:48px}.v411-native-header form{padding:3px}.v411-native-header button{padding:9px 11px}.retail-categories{padding-inline:10px}.catalog-grid{grid-template-columns:1fr}.v411-native-detail{padding-inline:12px}.v411-native-detail-visual{min-height:320px}.v411-native-detail-visual strong{font-size:64px}.v411-native-detail-copy dl{grid-template-columns:1fr}.v411-native-copy em{display:none}.v411-native-gate{margin-inline:12px;align-items:flex-start}.v411-native-footer{padding:26px 18px}}
`;

const bodyViews = Object.fromEntries(Object.entries(nativeViews).map(([key, body]) => [key, Buffer.from(body).toString("base64")]));
const portableTechnicalViews = Object.fromEntries(Object.entries(nativeViews).map(([key, body]) => [key, Buffer.from(`<!doctype html><html lang="es-AR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}${nativeCss}</style></head><body>${body}<script>document.addEventListener("click",event=>{const link=event.target.closest("a[href]");if(!link)return;event.preventDefault();parent.postMessage({type:"amarango-preview-route",href:link.getAttribute("href")},"*")});<\/script></body></html>`).toString("base64")]));

const standalone = `<!doctype html>
<html lang="es-AR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#071a39">
  <title>AmarangoElectro V16 · V4.11 Standalone Android</title>
  <style>${css}${nativeCss}
    .v411-standalone-bar{position:sticky;z-index:9999;top:0;min-height:42px;padding:7px 12px;display:flex;align-items:center;justify-content:space-between;gap:10px;background:#071a39;color:#fff;font:700 11px/1.2 Inter,system-ui,sans-serif;box-shadow:0 8px 26px #03102333}
    .v411-standalone-bar span{opacity:.76;font-size:9px}.v411-standalone-bar button{min-height:30px;padding:0 11px;border:1px solid #ffffff30;border-radius:999px;background:#ffffff10;color:#fff;font:inherit}
    [hidden]{display:none!important}.v411-static-active{outline:2px solid #ff742b!important;outline-offset:1px}.v411-static-toast{position:fixed;z-index:10001;left:50%;bottom:18px;transform:translateX(-50%);max-width:calc(100% - 28px);padding:11px 14px;border-radius:999px;background:#071a39;color:#fff;font:750 11px/1.25 Inter,system-ui,sans-serif;box-shadow:0 16px 42px #0004}
    @media(max-width:420px){.v411-standalone-bar{padding-inline:8px}.v411-standalone-bar strong{font-size:10px}}
  </style>
</head>
<body>
  <nav class="v411-standalone-bar"><strong>V4.11 · Standalone Android</strong><span>Sin iframe · solo lectura</span><button type="button" data-v411-home>Inicio</button></nav>
  <div id="v411-app" aria-live="polite"></div>
  <script>
    const views=${JSON.stringify(bodyViews)};
    const routeMap={electrodomesticos:"electrodomesticos",herramientas:"herramientas","tecnologia-accesorios":"tecnologia",hogar:"hogar",descanso:"descanso","cuidado-personal-salud":"cuidado","bebes-juguetes":"bebes","auto-motos-energia":"auto","camping-aire-libre-mascotas":"camping",gaming:"gaming",otros:"otros",celulares:"celulares"};
    const app=document.querySelector("#v411-app");
    const decoder=new TextDecoder();
    const favoriteKey="amarango:v411:standalone:favorites";
    let current="home";
    let activeBrand="Todos";
    let heroIndex=0;
    let heroTimer=0;
    let heroTouchStart=null;
    const decode=(value)=>decoder.decode(Uint8Array.from(atob(value),character=>character.charCodeAt(0)));
    const favorites=()=>{try{return new Set(JSON.parse(localStorage.getItem(favoriteKey)||"[]"))}catch{return new Set()}};
    const toast=(message)=>{const item=document.createElement("div");item.className="v411-static-toast";item.textContent=message;document.body.append(item);setTimeout(()=>item.remove(),2200)};
    function resolve(href){
      const url=new URL(href,"https://preview.local");
      if(url.pathname==="/")return "home";
      if(url.pathname==="/buscar")return "buscar";
      if(url.pathname==="/mi-amarango")return "advisor";
      if(url.pathname==="/administracion")return "admin";
      if(url.pathname==="/plataforma")return "platform";
      if(url.pathname.includes("motorola-moto-g15"))return "productoG15";
      if(url.pathname.startsWith("/producto/"))return "productoA16";
      const match=url.pathname.match(/^\\/categoria\\/([^/]+)/);
      if(match&&match[1]==="electrodomesticos"&&url.searchParams.get("sector")==="lavado")return "lavado";
      return match ? routeMap[match[1]]||"home" : "home";
    }
    function syncFavorites(){
      const saved=favorites();
      app.querySelectorAll(".catalog-card[data-product-id]").forEach(card=>{
        const active=saved.has(card.dataset.productId);
        const button=card.querySelector('button[aria-label*="favoritos"]');
        if(button){button.classList.toggle("active",active);button.setAttribute("aria-label",active?"Quitar de favoritos":"Guardar en favoritos")}
      });
    }
    function applyFilters(){
      const query=(app.querySelector(".catalog-search input")?.value||app.querySelector(".header-search input")?.value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
      const max=Number(app.querySelector(".catalog-price-filter input")?.value||0);
      const stockOnly=app.querySelector(".catalog-availability-filter")?.classList.contains("active")||false;
      const onlyFavorites=app.querySelector(".catalog-favorites-filter")?.classList.contains("active")||false;
      const saved=favorites();
      let count=0;
      app.querySelectorAll(".catalog-card[data-product-id]").forEach(card=>{
        const haystack=card.textContent.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
        const matchesQuery=!query||query.split(/\\s+/).every(token=>haystack.includes(token));
        const matchesBrand=activeBrand==="Todos"||card.dataset.productBrand===activeBrand;
        const matchesPrice=!max||Number(card.dataset.productPrice)<=max;
        const matchesStock=!stockOnly||card.dataset.productStock==="in_stock";
        const matchesFavorite=!onlyFavorites||saved.has(card.dataset.productId);
        card.hidden=!(matchesQuery&&matchesBrand&&matchesPrice&&matchesStock&&matchesFavorite);
        if(!card.hidden)count++;
      });
      const countLabel=app.querySelector(".catalog-count span");
      if(countLabel)countLabel.textContent=count+" "+(count===1?"opción":"opciones")+" para explorar";
    }
    function showHero(index){
      const slides=[...app.querySelectorAll(".v411-native-hero .hero-slide")];
      if(!slides.length)return;
      heroIndex=(index+slides.length)%slides.length;
      slides.forEach((slide,item)=>{slide.classList.toggle("active",item===heroIndex);slide.setAttribute("aria-hidden",String(item!==heroIndex))});
      app.querySelectorAll(".v411-native-hero .hero-dots button").forEach((dot,item)=>dot.classList.toggle("active",item===heroIndex));
    }
    function render(view){
      clearInterval(heroTimer);
      current=views[view]?view:"home";activeBrand="Todos";app.innerHTML=decode(views[current]);
      window.scrollTo({top:0,behavior:"instant"});syncFavorites();
      heroIndex=0;showHero(0);
      if(current==="home")heroTimer=setInterval(()=>showHero(heroIndex+1),6500);
    }
    document.querySelector("[data-v411-home]").addEventListener("click",()=>render("home"));
    document.addEventListener("click",async(event)=>{
      const menu=event.target.closest(".store-menu-button");
      if(menu){const layer=app.querySelector(".store-drawer-layer");layer?.classList.toggle("open");return}
      const close=event.target.closest(".store-drawer-scrim,#store-drawer header button");
      if(close){app.querySelector(".store-drawer-layer")?.classList.remove("open");return}
      const heroPrevious=event.target.closest(".v411-native-hero .previous");if(heroPrevious){showHero(heroIndex-1);return}
      const heroNext=event.target.closest(".v411-native-hero .next");if(heroNext){showHero(heroIndex+1);return}
      const heroDot=event.target.closest(".v411-native-hero .hero-dots button");if(heroDot){showHero([...heroDot.parentElement.children].indexOf(heroDot));return}
      const favorite=event.target.closest('button[aria-label*="favoritos"]');
      if(favorite){const card=favorite.closest(".catalog-card[data-product-id]");const productId=card?.dataset.productId||favorite.dataset.productId;if(!productId)return;const saved=favorites();saved.has(productId)?saved.delete(productId):saved.add(productId);localStorage.setItem(favoriteKey,JSON.stringify([...saved]));syncFavorites();applyFilters();toast("Favoritos actualizados en este dispositivo");return}
      const share=event.target.closest('button[aria-label="Compartir producto"]');
      if(share){const card=share.closest(".catalog-card");const name=card?.querySelector("h3")?.textContent?.trim()||"Producto AmarangoElectro";const text=name+"\\nAmarangoElectro";try{if(navigator.share)await navigator.share({title:name,text});else await navigator.clipboard.writeText(text);toast("Producto listo para compartir")}catch{}return}
      const availability=event.target.closest(".catalog-availability-filter");
      if(availability){availability.classList.toggle("active");applyFilters();return}
      const favoriteFilter=event.target.closest(".catalog-favorites-filter");
      if(favoriteFilter){favoriteFilter.classList.toggle("active");applyFilters();return}
      const brandButton=event.target.closest(".brand-filters button");
      if(brandButton){activeBrand=brandButton.textContent.trim()==="Todos"?"Todos":brandButton.textContent.trim();app.querySelectorAll(".brand-filters button").forEach(item=>item.classList.toggle("v411-static-active",item===brandButton));applyFilters();return}
      const link=event.target.closest("a[href]");
      if(!link)return;
      const href=link.getAttribute("href");
      if(!href||href.startsWith("#")){return}
      event.preventDefault();render(resolve(href));
    });
    document.addEventListener("input",event=>{if(event.target.matches(".catalog-search input,.catalog-price-filter input"))applyFilters()});
    document.addEventListener("touchstart",event=>{if(event.target.closest(".v411-native-hero"))heroTouchStart=event.changedTouches[0]?.clientX??null},{passive:true});
    document.addEventListener("touchend",event=>{if(heroTouchStart===null||!event.target.closest(".v411-native-hero"))return;const delta=(event.changedTouches[0]?.clientX??heroTouchStart)-heroTouchStart;if(Math.abs(delta)>45)showHero(heroIndex+(delta<0?1:-1));heroTouchStart=null},{passive:true});
    document.addEventListener("submit",event=>{
      const form=event.target;if(!form.matches(".header-search,.catalog-search"))return;event.preventDefault();
      const value=form.querySelector("input")?.value||"";
      if(form.matches(".header-search")&&current!=="buscar"){render("buscar");const input=app.querySelector(".catalog-search input");if(input)input.value=value}
      applyFilters();
    });
    render("home");
  </script>
</body>
</html>`;

await writeFile(standaloneOutputPath, standalone);
const portablePreview = preview
  .replace(`const views=${JSON.stringify(encoded)};`, `const views=${JSON.stringify(portableTechnicalViews)};`)
  .replace('frame.srcdoc=view==="os" ? decoded : decoded.replace("</head>","<style>"+sharedCss+"</style></head>");', 'frame.srcdoc=decoded;');
await writeFile(outputPath, portablePreview);
console.log(outputPath);
console.log(standaloneOutputPath);
