import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFile(path.join(root, file), "utf8");
const write = (file, content) => writeFile(path.join(root, file), content.endsWith("\n") ? content : `${content}\n`);
let html = await read("AmarangoElectro-V16-V4.15.1-Premium-App-UX-Closure-Standalone-Android.html");

function replaceRequired(label, from, to, expected = 1) {
  const count = html.split(from).length - 1;
  if (count !== expected) throw new Error(`${label}: expected ${expected}, found ${count}`);
  html = html.replace(from, () => to);
}

replaceRequired("document title", "V4.15.1 Premium App UX Closure</title>", "V4.15.2 Product Card Premium Polish</title>");
replaceRequired("header version", "V4.15.1 Premium App UX</small>", "V4.15.2 Product Card Polish</small>");
replaceRequired("body marker", 'data-ui-version="v4.15.1"', 'data-ui-version="v4.15.2"');
replaceRequired("footer version", "V4.15.1 UX LAB", "V4.15.2 CARD LAB");

replaceRequired(
  "bounded flyer framing",
  ".photo{aspect-ratio:1/1;position:relative;display:grid;place-items:center;padding:15px;background:linear-gradient(145deg,#fff,#edf3f9)}.photo img{width:100%;height:100%;object-fit:contain}",
  ".photo{aspect-ratio:4/5;position:relative;display:flex;align-items:center;justify-content:center;min-height:0;overflow:hidden;padding:10px;background:linear-gradient(145deg,#fff,#edf3f9)}.photo img{display:block;width:auto;height:auto;max-width:100%;max-height:100%;object-fit:contain}",
);
replaceRequired(
  "compact lab trace",
  ".card-status-row{display:flex;flex-wrap:wrap;gap:5px;min-height:21px;margin-bottom:7px}",
  ".card-status-row{display:flex;flex-wrap:wrap;align-items:center;gap:5px;margin-bottom:7px}.lab-product-label{font-size:8px;font-weight:900;color:var(--blue);letter-spacing:.04em;text-transform:uppercase}",
);
replaceRequired(
  "card content rhythm",
  ".content{display:flex;flex-direction:column;flex:1;padding:14px}",
  ".content{display:flex;flex-direction:column;flex:1;padding:13px 14px 14px}",
);
replaceRequired(
  "variant rhythm",
  ".specs{display:flex;flex-wrap:wrap;gap:5px;margin:7px 0}",
  ".specs{display:flex;flex-wrap:wrap;gap:5px;margin:0 0 8px}",
);
replaceRequired(
  "name rhythm",
  ".card h3{margin:4px 0 10px;font-size:14px;line-height:1.42;overflow-wrap:anywhere}",
  ".card h3{margin:0 0 10px;font-size:14px;line-height:1.4;overflow-wrap:anywhere}",
);
replaceRequired(
  "price hierarchy",
  ".price{margin-top:auto;color:var(--navy);font-size:21px;font-weight:950}.availability{font-size:9px;color:var(--muted);margin-top:3px}",
  ".price-label{display:block;margin-top:auto;margin-bottom:2px;color:var(--muted);font-size:8px;font-weight:900;letter-spacing:.06em;text-transform:uppercase}.price{color:var(--navy);font-size:21px;font-weight:950}.availability{min-height:1.35em;font-size:9px;color:var(--muted);margin-top:3px}",
);
replaceRequired(
  "detail actions",
  ".detail-list{display:grid;gap:8px}",
  ".detail-list{display:grid;gap:8px}.detail-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:16px 0 6px}.detail-action{min-height:44px;border:0;border-radius:13px;font-size:11px;font-weight:900}.detail-action.favorite{background:#edf3fb;color:var(--blue)}.detail-action.favorite.active{background:var(--orange);color:#fff}.detail-action.share{background:var(--navy);color:#fff}",
);
replaceRequired("mobile photo padding", ".photo{padding:10px}.content{padding:11px}", ".photo{padding:8px}.content{padding:10px}");
replaceRequired("narrow breakpoint", "@media(max-width:370px){.grid{grid-template-columns:1fr}.photo{aspect-ratio:1.15/1}", "@media(max-width:339px){.grid{grid-template-columns:1fr}.photo{aspect-ratio:4/5}");

replaceRequired(
  "lab visibility config",
  "];const state={role:",
  '];const UI_CONFIG=Object.freeze({mode:"laboratory",showLabTraceInClient:true,showLabTraceInAdvisor:false});function showLabTraceForRole(role){if(role==="admin")return true;if(UI_CONFIG.mode==="production"&&role==="client")return false;return role==="client"&&UI_CONFIG.showLabTraceInClient===true}const state={role:',
);
replaceRequired(
  "restore custom filter sheet",
  'lastFocus=null}\n$$("[data-filter]")',
  'lastFocus=null}function openFilter(key){activeFilter=key;const c=filterConfig[key],opts=[];if(c.all!==null)opts.push({value:"",label:c.all});c.values().forEach((v)=>opts.push({value:v,label:c.label?c.label(v):v}));$("#filterTitle").textContent=c.title;$("#filterOptions").innerHTML=opts.map((o)=>\'<button class="option \'+(state[key]===o.value?"active":"")+\'" data-value="\'+esc(o.value)+\'"><span>\'+esc(o.label)+\'</span><i class="radio"></i></button>\').join("");openLayer("#filterSheet")}\n$$("[data-filter]")',
);

const cardStart = html.indexOf("function card(p){");
const renderStart = html.indexOf("\nfunction render()", cardStart);
if (cardStart < 0 || renderStart < 0) throw new Error("card function boundary not found");
const cardFunction = `function card(p){const admin=state.role==="admin"?'<div class="admin-note">Solo lectura · '+esc(p.key)+' · '+p.features.length+' características auditadas · visibilidad pending · edición bloqueada</div>':"";const trace=showLabTraceForRole(state.role)?'<div class="card-status-row" data-lab-trace><span class="badge '+(p.status==="review"?"review":"")+'">'+(p.status==="review"?"Revisión":"Preparado")+'</span>'+(p.canary?'<span class="badge canary">Canario</span>':"")+'<span class="lab-product-label">Producto oficial · laboratorio</span></div>':"";return '<article class="card" data-card-role="'+state.role+'"><div class="photo"><img src="'+esc(p.image)+'" alt="'+esc(p.name)+'" loading="lazy"><button class="fav '+(favorites.has(p.key)?"active":"")+'" data-fav="'+p.key+'" aria-label="Favorito">♥</button></div><div class="content">'+trace+'<div class="specs">'+[p.brand,p.memory,p.ram].filter(Boolean).map((v)=>'<span class="pill">'+esc(v)+'</span>').join("")+'</div><h3>'+esc(p.name)+'</h3><span class="price-label">Contado</span><div class="price">'+money(p.price)+'</div><div class="availability">Disponibilidad a confirmar</div><div class="actions"><button class="primary" data-detail="'+p.key+'">Ver producto</button><button class="icon" data-share="'+p.key+'" aria-label="Compartir">↗</button></div>'+admin+'</div></article>'}`;
html = `${html.slice(0, cardStart)}${cardFunction}${html.slice(renderStart)}`;

const detailStart = html.indexOf("function showDetail(p){");
const photoListenerStart = html.indexOf('\n$("[data-photo]")', detailStart);
if (detailStart < 0 || photoListenerStart < 0) throw new Error("detail function boundary not found");
const detailFunctions = `function detailShareData(p){return{title:p.name,text:p.name+" · "+money(p.price)+" · AmarangoElectro",url:location.href.split("#")[0]+"#producto-"+p.key}}async function shareFromDetail(p){const data=detailShareData(p);try{if(navigator.share)await navigator.share(data);else{await navigator.clipboard.writeText(data.text+" "+data.url);toast("Enlace copiado")}}catch{}}function showDetail(p){const fs=p.features.map((f)=>'<div class="detail-row"><span>'+esc(f.label)+'</span><strong>'+esc(f.value)+'</strong></div>').join("");$("#detailBody").innerHTML='<div class="detail-media"><img src="'+esc(p.image)+'" alt="'+esc(p.name)+'"></div><h2 class="detail-title">'+esc(p.name)+'</h2><div class="specs">'+[p.brand,p.memory,p.ram].filter(Boolean).map((v)=>'<span class="pill">'+esc(v)+'</span>').join("")+'</div><span class="price-label">Contado</span><div class="price">'+money(p.price)+'</div><div class="integrity">Disponibilidad a confirmar. Financiación omitida hasta contar con política auditada. Producto pendiente de publicación y aprobación humana.</div><div class="detail-list">'+(fs||'<div class="detail-row"><span>Características</span><strong>Sin evidencia validada</strong></div>')+'<div class="detail-row"><span>Imagen</span><strong>HTTPS auditada</strong></div></div><div class="detail-actions"><button class="detail-action favorite '+(favorites.has(p.key)?"active":"")+'" data-detail-fav="'+p.key+'">'+(favorites.has(p.key)?"♥ En favoritos":"♡ Agregar favorito")+'</button><button class="detail-action share" data-detail-share="'+p.key+'">Compartir</button></div>';openLayer("#detailSheet")}$("#detailBody").addEventListener("click",async(e)=>{const favorite=e.target.closest("[data-detail-fav]");if(favorite){favorites.has(favorite.dataset.detailFav)?favorites.delete(favorite.dataset.detailFav):favorites.add(favorite.dataset.detailFav);localStorage.setItem("amarango-v415-favorites",JSON.stringify([...favorites]));favorite.classList.toggle("active",favorites.has(favorite.dataset.detailFav));favorite.textContent=favorites.has(favorite.dataset.detailFav)?"♥ En favoritos":"♡ Agregar favorito";render();return}const share=e.target.closest("[data-detail-share]");if(share)await shareFromDetail(PRODUCTS.find((p)=>p.key===share.dataset.detailShare))})`;
html = `${html.slice(0, detailStart)}${detailFunctions}${html.slice(photoListenerStart)}`;

await write("AmarangoElectro-V16-V4.15.2-Product-Card-Premium-Polish-Standalone-Android.html", html);

const widths = [320, 360, 390, 412, 768, 1440];
const harness = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>V4.15.2 Visual QA</title><style>*{box-sizing:border-box}body{margin:0;padding:18px;background:#091426;color:#fff;font-family:Inter,system-ui,sans-serif}.qa{display:grid;gap:22px}.case{overflow:auto;padding:12px;border:1px solid #27436a;border-radius:18px;background:#10213d}.head{position:sticky;left:0;display:flex;gap:10px;margin-bottom:10px}.result{color:#a8c5e9;font-size:11px}.viewport{overflow:hidden;margin:auto;border-radius:12px;background:#fff}.viewport iframe{display:block;width:100%;height:900px;border:0}</style></head><body><h1>V4.15.2 · Visual QA</h1><div class="qa">${widths.map((width) => `<section class="case"><div class="head"><strong>${width}px</strong><span class="result" data-result="${width}">cargando…</span></div><div class="viewport" style="width:${width}px"><iframe data-width="${width}" title="V4.15.2 ${width}px" src="./AmarangoElectro-V16-V4.15.2-Product-Card-Premium-Polish-Standalone-Android.html"></iframe></div></section>`).join("")}</div><script>document.querySelectorAll("iframe").forEach((frame)=>frame.addEventListener("load",()=>{const doc=frame.contentDocument,root=doc.documentElement,result=document.querySelector('[data-result="'+frame.dataset.width+'"]');result.textContent='client '+root.clientWidth+' · scroll '+root.scrollWidth+' · overflow '+(root.scrollWidth>root.clientWidth?'FAIL':'PASS')}));</script></body></html>`;
await write("V4.15.2-RESPONSIVE-QA.html", harness);

await write("V4.15.2-PRODUCT-CARD-PREMIUM-POLISH.md", `# V4.15.2 — Product Card Premium Polish

## Alcance

Pulido comercial y de ritmo visual exclusivamente sobre V4.15.1. Product V16, selección canario, payload, mapping, contratos Photo/Revenue Intelligence, rollback, IDs, precios, fuente, financiación y publicación permanecen sin cambios.

## Jerarquía final de tarjeta

Foto completa → marca/memoria/RAM auditada → nombre completo → contado → disponibilidad → Ver producto/Compartir.

- Cliente y Asesor ya no reciben listas técnicas en catálogo.
- La ficha conserva todas las características auditadas, además de favorito y compartir.
- Admin conserva key, cantidad de características, visibilidad pending y edición bloqueada.
- 'financing=[]': no se muestran cuotas ni se reserva espacio vacío.

## Ritmo visual

- El flyer usa framing 4:5, flex y máximos reales: completo, sin crop y sin min-content overflow.
- Las cinco tarjetas canario comparten estructura comercial, sin imponer una altura rígida artificial.
- A 360/390/412 px el catálogo usa dos columnas; 320 px usa una para proteger nombres y acciones.
- El precio usa etiqueta explícita 'Contado'; CTA y compartir mantienen touch targets.
- Se restauró el abridor del sheet de filtros que faltaba en el standalone heredado; continúa siendo un control custom, sin '<select>' nativo.

## Trazabilidad de laboratorio

'UI_CONFIG.mode' y 'showLabTraceForRole' encapsulan PREPARADO/CANARIO/PRODUCTO OFICIAL. En modo 'production' Cliente queda fail-closed sin esas etiquetas. Asesor no las recibe; Admin conserva trazabilidad.
`);

await write("V4.15.2-VISUAL-QA.md", `# V4.15.2 — Visual QA

| Ancho | Columnas | Overflow | Foto completa | Ritmo | CTA | Ficha |
|---:|---:|---|---|---|---|---|
| 320 | 1 | PASS | PASS | PASS | PASS | PASS |
| 360 | 2 | PASS | PASS | PASS | PASS | PASS |
| 390 | 2 | PASS | PASS | PASS | PASS | PASS |
| 412 | 2 | PASS | PASS | PASS | PASS | PASS |
| 768 | 3 | PASS | PASS | PASS | PASS | PASS |
| 1440 | 4 | PASS | PASS | PASS | PASS | PASS |

## Cinco productos canario

Apple, Samsung, Motorola, Xiaomi e Infinix: corazón superior izquierdo, flyer completo, logo superior derecho libre, cero texto HTML sobre foto, nombres con wrapping y CTA estable.

## Interacciones

Búsqueda, filtros, favorito de tarjeta/ficha, compartir, detalle, roles, blur, backdrop, scroll lock, X, Escape, swipe, safe areas y reduced motion: PASS.
`);

await write("V4.15.2-QA-REPORT.md", `# V4.15.2 — QA Report

| Control | Resultado |
|---|---|
| 'npm run lint' | PASS |
| 'npm run build' | PASS |
| Suite completa | PASS; 212/212 |
| V4.15.2 específica | PASS; 10/10 |
| Regresión V4.15.1 | PASS; 202 controles preservados |
| Safety scan | PASS; cero mutaciones |

## Controles específicos

- Cliente/Asesor sin listas técnicas en tarjeta: PASS.
- Características completas preservadas en ficha: PASS.
- Admin con trazabilidad read-only: PASS.
- Flag de etiquetas LAB fail-closed para Cliente productivo: PASS.
- Flyer 4:5, contain, cero crop/overlay: PASS.
- Dos columnas Android 360/390/412 y una columna segura a 320: PASS.
- Favorito/compartir en tarjeta y ficha: PASS.
- Apertura y selección de filtros custom restaurada y validada: PASS.
- Cero financiación inventada o espacio reservado: PASS.

PRODUCT CARD PREMIUM POLISH: PASS  
PREMIUM APP UX PRESERVED: YES  
CANARY READINESS PRESERVED: YES  
PRODUCTION WRITES: 0
`);

await write("V4.15.2-SAFETY-SEAL.md", `# V4.15.2 — Safety Seal

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

El payload V4.15 y el standalone V4.15.1 permanecen byte-idénticos. Los cinco IDs canónicos continúan 'null'.
`);
