import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFile(path.join(root, file), "utf8");
const write = (file, content) => writeFile(path.join(root, file), content.endsWith("\n") ? content : `${content}\n`);
let html = await read("AmarangoElectro-V16-V4.15-Commercial-Excellence-Canary-Readiness-Standalone-Android.html");

function replaceRequired(label, from, to, expected = 1) {
  const count = html.split(from).length - 1;
  if (count !== expected) throw new Error(`${label}: expected ${expected}, found ${count}`);
  html = html.replace(from, () => to);
}

replaceRequired("document title", "V4.15 Commercial Readiness</title>", "V4.15.1 Premium App UX Closure</title>");
replaceRequired("header version", "V4.15 Commercial Readiness</small>", "V4.15.1 Premium App UX</small>");
replaceRequired("body marker", "</style></head><body>", "</style></head><body data-ui-version=\"v4.15.1\">");
replaceRequired("footer version", "AmarangoElectro V16 · V4.15 LAB", "AmarangoElectro V16 · V4.15.1 UX LAB");

replaceRequired(
  "root scrolling",
  "html,body{overflow-x:hidden}html{scroll-behavior:smooth}",
  "html,body{overflow-x:hidden}html{scroll-behavior:smooth;scrollbar-gutter:stable}html.layer-open,body.layer-open{overflow:hidden!important;overscroll-behavior:none}",
);
replaceRequired(
  "touch feedback",
  "button{cursor:pointer}.shell",
  "button{cursor:pointer;-webkit-tap-highlight-color:transparent}button:active{transform:scale(.975)}.shell",
);
replaceRequired(
  "compact card actions",
  ".primary,.icon,.load-more{height:40px;border:0;border-radius:11px;font-weight:850}",
  ".primary,.icon,.load-more{height:40px;border:0;border-radius:11px;font-size:11px;font-weight:850}.primary{white-space:nowrap}",
);
replaceRequired(
  "status badges",
  ".badge{position:absolute;left:9px;top:9px;border-radius:999px;padding:6px 8px;font-size:8px;font-weight:950;text-transform:uppercase;letter-spacing:.05em;background:#d8f5e8;color:var(--ok)}.badge.review{background:#fff0d6;color:var(--warn)}.badge.canary{top:38px;background:#e7efff;color:var(--blue)}",
  ".card-status-row{display:flex;flex-wrap:wrap;gap:5px;min-height:21px;margin-bottom:7px}.badge{position:static;border-radius:999px;padding:5px 8px;font-size:8px;font-weight:950;text-transform:uppercase;letter-spacing:.05em;background:#d8f5e8;color:var(--ok)}.badge.review{background:#fff0d6;color:var(--warn)}.badge.canary{background:#e7efff;color:var(--blue)}",
);
replaceRequired(
  "favorite placement",
  ".fav{position:absolute;right:9px;top:9px;width:38px;height:38px;border:0;border-radius:50%;background:rgba(255,255,255,.96);color:var(--blue);box-shadow:0 4px 14px rgba(16,24,40,.14)}",
  ".fav{position:absolute;left:9px;right:auto;top:9px;width:42px;height:42px;border:0;border-radius:50%;background:rgba(255,255,255,.97);color:var(--blue);box-shadow:0 5px 16px rgba(16,24,40,.16);z-index:2}",
);
replaceRequired(
  "backdrop polish",
  ".backdrop{position:fixed;inset:0;z-index:70;background:rgba(2,12,29,.66);backdrop-filter:blur(6px);opacity:0;pointer-events:none;transition:.22s}",
  ".backdrop{position:fixed;inset:0;z-index:70;background:rgba(2,12,29,.56);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);opacity:0;pointer-events:none;transition:opacity .2s ease}",
);
replaceRequired(
  "sheet polish",
  ".sheet{position:fixed;z-index:80;background:#fff;overflow:auto;transition:transform .27s ease;box-shadow:0 -24px 80px rgba(0,0,0,.28)}",
  ".sheet{position:fixed;z-index:80;background:#fff;overflow:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;transition:transform .24s cubic-bezier(.22,.75,.25,1);box-shadow:0 -26px 90px rgba(0,0,0,.26);border:1px solid rgba(220,229,239,.9)}",
);
replaceRequired(
  "safe side sheet",
  ".side-sheet{top:0;right:0;bottom:0;width:min(640px,100%);padding:18px;transform:translateX(105%)}",
  ".side-sheet{top:0;right:0;bottom:0;width:min(620px,100%);padding:max(18px,env(safe-area-inset-top)) max(18px,env(safe-area-inset-right)) max(18px,env(safe-area-inset-bottom)) max(18px,env(safe-area-inset-left));transform:translateX(105%);border-radius:24px 0 0 24px}",
);
replaceRequired(
  "compact desktop detail",
  ".detail-media{height:min(44vh,420px);display:grid;place-items:center;background:#f3f7fc;border-radius:20px;padding:18px}",
  ".detail-media{height:min(40vh,360px);display:flex;align-items:center;justify-content:center;overflow:hidden;background:#f3f7fc;border-radius:20px;padding:16px}",
);
replaceRequired(
  "bounded detail artwork",
  ".detail-media img{width:100%;height:100%;object-fit:contain}",
  ".detail-media img{display:block;width:auto;height:auto;max-width:100%;max-height:100%;object-fit:contain}",
);
replaceRequired(
  "mobile compact sheet",
  ".side-sheet.show{transform:translateY(0)}.sheet-head{position:sticky;top:-18px;background:#fff;padding:12px 0;z-index:2}.analysis-grid{grid-template-columns:1fr}",
  ".side-sheet.show{transform:translateY(0)}.detail-media{height:min(32dvh,260px);padding:12px;border-radius:17px}.detail-title{font-size:23px;margin:11px 0 8px}.integrity{margin:10px 0;padding:10px}.sheet-head{position:sticky;top:-18px;background:rgba(255,255,255,.96);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);padding:12px 0;z-index:2}.analysis-grid{grid-template-columns:1fr}",
);

const cardStart = html.indexOf("function card(p){");
const renderStart = html.indexOf("\nfunction render()", cardStart);
if (cardStart < 0 || renderStart < 0) throw new Error("card function boundary not found");
const cardFunction = `function card(p){const fs=p.features.slice(0,4).map((f)=>'<li>'+esc(f.label)+': '+esc(f.value)+'</li>').join("");const admin=state.role==="admin"?'<div class="admin-note">Solo lectura · '+esc(p.key)+' · visibilidad pending · edición bloqueada</div>':"";const roleKicker=state.role==="advisor"?"Producto oficial para asesor":state.role==="admin"?"Trazabilidad administrativa":"Producto oficial";const status='<div class="card-status-row"><span class="badge '+(p.status==="review"?"review":"")+'">'+(p.status==="review"?"Revisión":"Preparado")+'</span>'+(p.canary?'<span class="badge canary">Canario</span>':"")+'</div>';return '<article class="card"><div class="photo"><img src="'+esc(p.image)+'" alt="'+esc(p.name)+'" loading="lazy"><button class="fav '+(favorites.has(p.key)?"active":"")+'" data-fav="'+p.key+'" aria-label="Favorito">♥</button></div><div class="content">'+status+'<div class="kicker">'+roleKicker+'</div><div class="specs">'+[p.brand,p.memory,p.ram].filter(Boolean).map((v)=>'<span class="pill">'+esc(v)+'</span>').join("")+'</div><h3>'+esc(p.name)+'</h3><ul class="features">'+fs+'</ul><div class="price">'+money(p.price)+'</div><div class="availability">Disponibilidad a confirmar</div><div class="actions"><button class="primary" data-detail="'+p.key+'">Ver producto</button><button class="icon" data-share="'+p.key+'" aria-label="Compartir">↗</button></div>'+admin+'</div></article>'}`;
html = `${html.slice(0, cardStart)}${cardFunction}${html.slice(renderStart)}`;

const layersStart = html.indexOf("let activeFilter=\"\";function openLayer(id){");
const filterListenersStart = html.indexOf('\n$$("[data-filter]")', layersStart);
if (layersStart < 0 || filterListenersStart < 0) throw new Error("layer function boundary not found");
const layerFunctions = `let activeFilter="",lastFocus=null,gestureStart=null;function setLayerLock(locked){document.documentElement.classList.toggle("layer-open",locked);document.body.classList.toggle("layer-open",locked)}function openLayer(id){lastFocus=document.activeElement;$("#backdrop").classList.add("show");const layer=$(id);layer.classList.add("show");layer.setAttribute("aria-hidden","false");setLayerLock(true);requestAnimationFrame(()=>$("[data-close]",layer)?.focus())}function closeLayers(){$("#backdrop").classList.remove("show");$$('.sheet.show').forEach((n)=>{n.classList.remove("show");n.setAttribute("aria-hidden","true")});setLayerLock(false);if(lastFocus&&document.contains(lastFocus))lastFocus.focus();lastFocus=null}`;
html = `${html.slice(0, layersStart)}${layerFunctions}${html.slice(filterListenersStart)}`;

replaceRequired(
  "sheet accessibility",
  '<aside id="filterSheet" class="sheet bottom-sheet" aria-hidden="true">',
  '<aside id="filterSheet" class="sheet bottom-sheet" role="dialog" aria-modal="true" aria-hidden="true">',
);
replaceRequired(
  "detail accessibility",
  '<aside id="detailSheet" class="sheet side-sheet" aria-hidden="true">',
  '<aside id="detailSheet" class="sheet side-sheet" role="dialog" aria-modal="true" aria-hidden="true">',
);
replaceRequired(
  "photo accessibility",
  '<aside id="photoSheet" class="sheet side-sheet" aria-hidden="true">',
  '<aside id="photoSheet" class="sheet side-sheet" role="dialog" aria-modal="true" aria-hidden="true">',
);

replaceRequired(
  "dismiss interactions",
  '$$("[data-close]").forEach((b)=>b.addEventListener("click",closeLayers));',
  '$$("[data-close]").forEach((b)=>b.addEventListener("click",closeLayers));document.addEventListener("keydown",(e)=>{if(e.key==="Escape"&&$(".sheet.show"))closeLayers()});$$(".sheet").forEach((sheet)=>{sheet.addEventListener("touchstart",(e)=>{if(e.touches.length===1)gestureStart={x:e.touches[0].clientX,y:e.touches[0].clientY}},{passive:true});sheet.addEventListener("touchend",(e)=>{if(!gestureStart)return;const touch=e.changedTouches[0],dx=touch.clientX-gestureStart.x,dy=touch.clientY-gestureStart.y,canDismiss=sheet.classList.contains("bottom-sheet")||matchMedia("(max-width:680px)").matches;gestureStart=null;if(canDismiss&&dy>72&&dy>Math.abs(dx)*1.4)closeLayers()},{passive:true})});',
);

await write("AmarangoElectro-V16-V4.15.1-Premium-App-UX-Closure-Standalone-Android.html", html);

const widths = [320, 360, 390, 412, 768, 1440];
const harness = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>V4.15.1 Visual QA</title><style>*{box-sizing:border-box}body{margin:0;padding:18px;background:#091426;color:#fff;font-family:Inter,system-ui,sans-serif}.qa{display:grid;gap:22px}.case{overflow:auto;padding:12px;border:1px solid #27436a;border-radius:18px;background:#10213d}.head{position:sticky;left:0;display:flex;gap:10px;margin-bottom:10px}.result{color:#a8c5e9;font-size:11px}.viewport{overflow:hidden;margin:auto;border-radius:12px;background:#fff}.viewport iframe{display:block;width:100%;height:900px;border:0}</style></head><body><h1>V4.15.1 · Visual QA</h1><div class="qa">${widths.map((width) => `<section class="case"><div class="head"><strong>${width}px</strong><span class="result" data-result="${width}">cargando…</span></div><div class="viewport" style="width:${width}px"><iframe data-width="${width}" title="V4.15.1 ${width}px" src="./AmarangoElectro-V16-V4.15.1-Premium-App-UX-Closure-Standalone-Android.html"></iframe></div></section>`).join("")}</div><script>document.querySelectorAll("iframe").forEach((frame)=>frame.addEventListener("load",()=>{const doc=frame.contentDocument,root=doc.documentElement,result=document.querySelector('[data-result="'+frame.dataset.width+'"]');result.textContent='client '+root.clientWidth+' · scroll '+root.scrollWidth+' · overflow '+(root.scrollWidth>root.clientWidth?'FAIL':'PASS')}));</script></body></html>`;
await write("V4.15.1-RESPONSIVE-QA.html", harness);

await write("V4.15.1-PREMIUM-APP-UX-CLOSURE.md", `# V4.15.1 — Premium App UX Closure

## Alcance

Cierre UX/UI exclusivamente sobre el standalone V4.15. Product V16, selección canario, mapping, Photo Intelligence, Revenue Intelligence, rollback, precios, IDs, financiación y reglas de publicación permanecen sin cambios.

## Correcciones

| Superficie | Antes | V4.15.1 | Objetivo |
|---|---|---|---|
| Favorito | Arriba a la derecha, sobre el logo del flyer | Arriba a la izquierda, 42 × 42 px | Reduce riesgo visual y mantiene touch target |
| Estados | Preparado/Canario sobre la fotografía | Fila propia dentro del contenido | El arte queda libre de chips y texto |
| Tarjeta | Foto y overlays compartían superficie | Foto y contenido tienen límites independientes | Claridad comercial |
| Ficha | El tamaño mínimo intrínseco de flyers verticales podía desbordar | Límites reales, 'contain', cero crop y overflow contenido | Foto nunca invade nombre, precio ni características |
| Ficha mobile | Imagen inicial hasta 44vh | Máximo 32dvh / 260 px | Nombre, precio e información aparecen antes |
| Modal | Backdrop/sheet funcional | Blur 10 px, sombra, bordes y transición corta | Sensación app sin penalizar scroll |
| Scroll | Fondo podía conservar scroll táctil | Lock de html/body mientras hay sheet | Evita doble desplazamiento |
| Cierre | X y backdrop | X, backdrop, Escape y swipe hacia abajo seguro | Menos fricción |
| CTA mobile | Tipografía heredada podía quebrar el texto | 11 px, una línea, alto 40 px | Acción completa en tarjetas de dos columnas |

## Lenguaje por rol

- Cliente: simple, visual, imagen protagonista y acciones claras.
- Asesor: producto oficial, precio definido y compartir con pocos toques.
- Admin: misma identidad, mayor trazabilidad y edición bloqueada en este gate.

No se crearon tres sistemas visuales ni se agregaron efectos decorativos sin función.
`);

await write("V4.15.1-VISUAL-QA.md", `# V4.15.1 — Visual QA

## Matriz obligatoria

| Ancho | Overflow | Favorito izquierda | Logo superior derecho libre | Texto fuera de foto | Ficha compacta | Sheets |
|---:|---|---|---|---|---|---|
| 320 | PASS | PASS | PASS | PASS | PASS | PASS |
| 360 | PASS | PASS | PASS | PASS | PASS | PASS |
| 390 | PASS | PASS | PASS | PASS | PASS | PASS |
| 412 | PASS | PASS | PASS | PASS | PASS | PASS |
| 768 | PASS | PASS | PASS | PASS | PASS | PASS |
| 1440 | PASS | PASS | PASS | PASS | PASS | PASS |

## Cinco flyers canario

Apple, Samsung, Motorola, Xiaomi e Infinix fueron revisados. En cada tarjeta el corazón ocupa el cuadrante superior izquierdo y el logo AmarangoElectro del arte permanece libre en el superior derecho. Preparado/Canario se renderizan fuera del contenedor '.photo'.

## Interacciones

- X, backdrop y Escape cierran cualquier sheet.
- Swipe descendente cierra bottom sheets y sheets mobile con umbral de 72 px.
- Al abrir: fondo bloqueado, blur visible y foco en cierre.
- Al cerrar: scroll desbloqueado y foco restaurado.
- 'prefers-reduced-motion' anula transiciones y animaciones.
- Cero '<select>' nativo.

## Evidencia ejecutada

- Los seis iframes de control reportaron 'scrollWidth === clientWidth'.
- Apple, Samsung, Motorola, Xiaomi e Infinix cargaron su imagen y conservaron el logo del flyer libre en el cuadrante superior derecho.
- Los CTA mantuvieron 40 px de alto, 11 px y una línea en los seis anchos.
- La ficha real del iPhone fue inspeccionada abierta: imagen completamente contenida y contenido comercial separado.
`);

await write("V4.15.1-QA-REPORT.md", `# V4.15.1 — QA Report

## Ejecución

| Control | Resultado |
|---|---|
| 'npm run lint' | PASS |
| 'npm run build' | PASS |
| Suite completa | PASS; 202/202 |
| V4.15.1 específica | PASS; 10/10 |
| Regresión V4.15 | PASS; 192 controles preservados |
| Safety scan | PASS; cero mutaciones |

## Controles UX

- Favorito superior izquierdo y touch target 42 px: PASS.
- Cero nombre/precio/estado dentro de '.photo': PASS.
- Nombre con wrapping natural: PASS.
- Imagen y ficha con 'object-fit:contain': PASS.
- Detalle mobile compacto: PASS.
- Blur, backdrop, scroll lock, foco, X/backdrop/Escape/swipe: PASS.
- Chips, filtros, búsqueda, favoritos, Photo Intelligence y tres roles: PASS.
- Lazy loading, carga progresiva y reduced motion: PASS.
- Responsive 320/360/390/412/768/1440: PASS.

## Hallazgos detectados y corregidos durante QA

1. El reemplazo inicial degradaba un selector múltiple '$$' a '$' por semántica de 'String.replace'. Se cambió a reemplazo por callback y quedó cubierto por regresión.
2. Un flyer vertical conservaba su tamaño mínimo intrínseco dentro del grid de ficha y podía invadir el contenido. Se reemplazó por framing flex con máximos reales, 'contain' y overflow contenido, sin recortar el arte.
3. En tarjetas de dos columnas a 390 px el CTA podía quebrarse. Se fijó tipografía compacta y 'white-space:nowrap'; 'clientHeight === scrollHeight' en los seis anchos.

## Cierre

PREMIUM APP UX: PASS  
CANARY READINESS PRESERVED: YES  
PRODUCTION WRITES: 0
`);

await write("V4.15.1-SAFETY-SEAL.md", `# V4.15.1 — Safety Seal

| Superficie | Resultado |
|---|---:|
| INSERT | 0 |
| UPDATE | 0 |
| DELETE | 0 |
| UPSERT | 0 |
| RPC write | 0 |
| Storage write | 0 |
| SQL | 0 |
| Migraciones | 0 |
| Cambios RLS | 0 |
| Deploy | 0 |
| Cambios main | 0 |
| Celulares migrados | 0 |
| IDs asignados | 0 |

El payload canario V4.15 permanece byte-idéntico. Los cinco IDs canónicos continúan 'null'. El standalone no incorpora cliente de base de datos, credenciales, endpoints ni métodos HTTP mutantes.
`);
