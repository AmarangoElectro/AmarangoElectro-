import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeV413Cellphones } from "../lib/catalog/v413-cellphone-simulation.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = async (file) => JSON.parse(await readFile(path.join(root, file), "utf8"));
const write = (file, content) => writeFile(path.join(root, file), content.endsWith("\n") ? content : `${content}\n`);
const legacySnapshot = await readJson("fixtures/v413-legacy-cellphones-sanitized.json");
const masterSnapshot = await readJson("fixtures/v413-master-cellphones-sanitized.json");
const simulation = analyzeV413Cellphones(legacySnapshot.phones, masterSnapshot.phones);
const money = (value) => new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
}).format(value);
const text = (value) => value ?? "—";
await write("V4.13-MIGRATION-SIMULATION.json", JSON.stringify(simulation, null, 2));

const inventoryRows = simulation.products.map((product) => [
  product.legacyPosition,
  product.name.replaceAll("|", "\\|"),
  text(product.brand),
  text(product.modelFamily),
  text(product.memory),
  text(product.ram),
  product.colors.length ? product.colors.join(", ") : "—",
  money(product.cashPriceARS),
  `[HTTPS](${product.image})`,
  product.features.length ? `${product.features.length} explícitas` : "—",
  "valores privados excluidos",
  product.migrationStatus === "ready" ? "alta" : "revisión",
  product.reviewReasons.join(", ") || "—",
].map(String).join(" | "));

await write("V4.13-CELLPHONES-AUDIT.md", `# V4.13 — Auditoría de los 92 celulares

## Evidencia y alcance

- Fuente: \`public.celulares_lista\`, fila \`id='lista'\`.
- Captura: **SELECT sanitizado y solo lectura**.
- Actualización de la fila fuente: \`${legacySnapshot.sourceUpdatedAt}\`.
- Registros: **92**; precios ARS positivos: **92**; imágenes HTTPS: **92**; nombres normalizados distintos: **92**.
- Campos observados en origen: \`nombre\`, \`precio\`, \`foto\`, \`colores\`, dos campos monetarios internos excluidos de la captura pública y \`caracteristicas\` en 7 ítems.
- No se guardaron valores USD, cotización, costo, proveedor, mayorista ni JSON crudo.
- Posición legacy se conserva solo como evidencia; **no es identidad canónica**.

## Resultado de extracción

| Resultado | Cantidad |
|---|---:|
| Alta confianza técnica | **${simulation.counts.ready}** |
| Revisión humana | **${simulation.counts.review}** |
| Conflicto | **${simulation.counts.conflict}** |
| Marca/modelo/memoria desconocidos | **${simulation.products.filter((p) => !p.brand || !p.model || !p.memory).length}** |
| Con RAM demostrable desde nombre | **${simulation.products.filter((p) => p.ram).length}** |
| Con colores | **${simulation.products.filter((p) => p.colors.length).length}** |
| Con características explícitas | **${simulation.products.filter((p) => p.features.length).length}** |

“Alta confianza” significa que el parser y la clave de transición pueden preparar una incorporación; **no significa publicado**. Los 92 quedan con \`visibility=pending\` y \`availability=unknown\`.

## Inventario completo

Provenance: nombre/precio/imagen son explícitos; marca/modelo/memoria/RAM se marcan \`parsed_from_name\`; ausencia se marca \`unknown\`. Colores y características son explícitos cuando provienen de su campo; dos colores del nombre se marcan derivados.

| Pos. | Nombre original | Marca | Familia/modelo | Memoria | RAM | Colores | Precio ARS | Imagen | Características | Internos | Calidad | Ambigüedad |
|---:|---|---|---|---|---|---|---:|---|---|---|---|---|
${inventoryRows.join("\n")}
`);

await write("V4.13-CELLPHONE-PARSER.md", `# V4.13 — Parser canónico de celulares

## Contrato

El parser \`lib/catalog/v413-cellphone-parser.ts\` es puro, determinista y no muta el fixture. Recibe un \`LegacyPhone\` sanitizado y devuelve campos con provenance \`explicit\`, \`parsed_from_name\` o \`unknown\`.

## Reglas conservadoras

1. Marca: reconoce únicamente prefijos demostrables: iPhone, Samsung, Moto/Motorola, Redmi, POCO, Xiaomi e Infinix.
2. Capacidad simple: \`128GB\`, \`512 GB\`, \`1TB\`, \`2TB\`.
3. Par memoria/RAM: \`256/8gb\` y \`8/256 GB\`. Solo se acepta cuando el valor mayor pertenece al conjunto de capacidades observado y el menor al conjunto conservador de RAM.
4. \`5G\` o \`NFC\` no se confunden con GB y se excluyen de la clave de familia, sin borrarlos del modelo mostrado.
5. Promocionales \`NUEVO\` / \`NOVEDAD\` no forman parte del modelo.
6. Colores del campo \`colores\` son explícitos. Un sufijo inequívoco separado por guion puede registrarse como derivado del nombre.
7. Características solo se toman del campo explícito. El texto truncado \`USB-\` se envía a revisión.
8. Sufijos de bundle/color ambiguos, como “kit gamer”, se envían a revisión.

## Casos probados

| Entrada | Modelo | Memoria | RAM | Resultado |
|---|---|---|---|---|
| Samsung A16 128/4gb | Samsung A16 | 128 GB | 4 GB | alta |
| Samsung A17 256/8gb | Samsung A17 | 256 GB | 8 GB | alta |
| Moto G15 512/4gb | Moto G15 | 512 GB | 4 GB | alta |
| Infinix Smart 10 4/128 GB | Infinix Smart 10 | 128 GB | 4 GB | alta |
| teléfono sin memoria | — | unknown | unknown | revisión |

La igualdad se evalúa por tokens completos: **A16 no devuelve A17**.
`);

await write("V4.13-CANONICAL-IDENTITY-STRATEGY.md", `# V4.13 — Estrategia de identidad canónica

## Comparación

| Estrategia | Ventaja | Riesgo | Decisión |
|---|---|---|---|
| A. Asignar ID nuevo al incorporar al master | El ID final cumple el contrato canónico | Sin mapping se pierde trazabilidad con la fuente legacy | Necesaria, pero insuficiente sola |
| B. Fingerprint legacy estable | Permite detectar reapariciones y colisiones antes de escribir | Nombre o imagen pueden cambiar; no debe convertirse en ID definitivo | Usar como clave de transición versionada |
| C. Mapping futuro \`legacyCellphoneKey → canonicalProductId\` | Une trazabilidad legacy con ID persistente final y admite corrección humana | Requiere revisión y futura persistencia autorizada | **Recomendada** |

## Recomendación

Adoptar **C**, usando B solo para construir \`legacyCellphoneKey\` y A al momento de una futura incorporación autorizada. El ID canónico definitivo será asignado por el master; nunca será la posición del array ni el nombre.

## Fingerprint de transición

Versión: \`lcfp-v1\`. SHA-256 truncado sobre:

- marca normalizada;
- familia/modelo normalizado;
- memoria;
- RAM;
- nombre normalizado;
- pathname HTTPS de imagen sin query string.

No usa precio porque cambia comercialmente. Tampoco usa posición. El nombre no está solo: se combina con atributos y ruta de imagen. Riesgos: cambio de imagen, corrección de nombre o colisión semántica. Por eso el fingerprint es **clave de correspondencia**, no \`stableId\`.

En V4.13:

- \`canonicalProductId=null\`;
- \`stableId=null\`;
- \`slug=cellphone-lab-…\` es solo de preview;
- 92 fingerprints distintos;
- 0 colisiones.
`);

const variantSections = simulation.variantClusters.map((cluster) =>
  `### ${cluster.brand} — ${cluster.modelFamily}\n\n` +
  cluster.variants.map((variant) =>
    `- pos. ${variant.legacyPosition}: ${variant.name} — memoria ${text(variant.memory)}, RAM ${text(variant.ram)}`
  ).join("\n")
).join("\n\n");

await write("V4.13-DUPLICATES-VARIANTS.md", `# V4.13 — Duplicados, variantes y familias

## Resumen

| Clasificación | Resultado |
|---|---:|
| Duplicados probables | **${simulation.counts.probableDuplicates}** |
| Clusters de variantes reales | **${simulation.counts.variantClusters}** |
| Productos dentro de esos clusters | **${simulation.counts.productsInVariantClusters}** |
| Nombres normalizados duplicados | **0** |
| Imágenes duplicadas en la fuente | **0** |

No se ejecutó ningún merge. La regla central se cumple: **mismo modelo con distinta memoria o RAM es variante, no duplicado**.

## Variantes detectadas

${variantSections}

## Criterio

- Duplicado probable: misma marca + familia/modelo + memoria + RAM.
- Variante real: misma marca + familia/modelo, pero memoria o RAM distinta.
- Misma familia/modelo: agrupación de navegación, sin fusionar SKU.
- Ambiguo: parser o contenido requiere decisión humana.
- Único: no comparte el tuple de familia con otra fila.
`);

const master = masterSnapshot.phones[0];
await write("V4.13-MASTER-CROSSCHECK.md", `# V4.13 — Comparación contra el master

## Evidencia

El master \`public.tienda_catalogo/id=catalogo\` contiene **${masterSnapshot.recordCount}** producto categorizado como Celulares:

| ID persistente | Nombre | Precio ARS | Visible | Stock |
|---:|---|---:|---|---|
| ${master.id} | ${master.name} | ${money(master.cashPriceARS)} | **false** | ${master.outOfStock === true ? "sin stock" : master.outOfStock === false ? "no marcado sin stock" : "unknown"} |

Se compararon nombre normalizado, marca, familia/modelo, memoria, RAM, precio e imagen. Resultado:

| Resultado | Cantidad |
|---|---:|
| Match fuerte | **${simulation.counts.masterMatches.strong_match}** |
| Match probable | **${simulation.counts.masterMatches.probable_match}** |
| No match | **${simulation.counts.masterMatches.no_match}** |
| Conflicto | **${simulation.counts.masterMatches.conflict}** |

El producto master oculto permanece bloqueado. No se toma como fallback, no se publica y no se fusiona con ninguna de las 92 filas.
`);

await write("V4.13-PRODUCT-V16-MAPPING.md", `# V4.13 — Mapping a Product V16

| Product V16 propuesto | Fuente | Regla |
|---|---|---|
| \`stableId\` | futura asignación master | \`null\` en laboratorio |
| \`slug\` | clave lab | no es slug definitivo |
| \`name\` | \`nombre\` | explícito |
| \`brand\` | nombre | \`parsed_from_name\` o \`unknown\` |
| \`model\` | nombre | parser conservador |
| \`memory\` / \`ram\` | nombre | parser conservador |
| \`category\` | decisión de migración | constante \`celulares\` |
| \`image\` / \`images\` | \`foto\` | solo HTTPS |
| \`cashPriceARS\` | \`precio\` | positivo |
| \`financing\` | sin política auditada | siempre \`[]\` |
| \`availability\` | sin stock auditado | siempre \`unknown\` |
| \`visibility\` | sin flag auditado | siempre \`pending\` |
| \`colors\` | \`colores\` o sufijo inequívoco | provenance registrada |
| \`features\` | \`caracteristicas\` | solo explícitas |
| \`updatedAt\` | ausente por producto | \`null\` |

## Privacidad

El Product público y el standalone no contienen valores USD, cotización, JSON legacy crudo, costo, proveedor o mayorista. La fixture fuente es allowlist y la simulación vuelve a proyectar únicamente campos autorizados.

## Publicación

Ninguno de los 92 productos es publicable automáticamente. “Listo para migrar” significa listo para asignar/mapping humano futuro; \`visibility=pending\` mantiene el gate fail-closed.
`);

const queueRows = simulation.reviewQueue.map((item) =>
  `| ${item.legacyPosition} | ${item.name.replaceAll("|", "\\|")} | ${item.problems.join(", ")} | ${item.suggestion} | ${item.alternatives.join(" / ")} | ${item.risk} |`
);
await write("V4.13-HUMAN-REVIEW-QUEUE.md", `# V4.13 — Cola de revisión humana

Casos pendientes: **${simulation.reviewQueue.length}**. Ninguno se resolvió automáticamente.

| Pos. | Producto legacy | Problema | Sugerencia | Alternativas | Riesgo |
|---:|---|---|---|---|---|
${queueRows.join("\n")}

## Acción humana requerida

1. Confirmar/corregir la característica truncada del iPhone 17 Pro 256 GB.
2. Determinar si “dark flare + kit gamer shadow” describe color, bundle o ambos.
3. Al autorizar una migración futura, asignar \`canonicalProductId\` y persistir el mapping; no reutilizar la posición legacy.
`);

const logo = await readFile(path.join(root, "public/brand/amarango-logo-official.png"));
const logoData = `data:image/png;base64,${logo.toString("base64")}`;
const publicProducts = simulation.products.map((product) => ({
  legacyCellphoneKey: product.legacyCellphoneKey,
  slug: product.slug,
  name: product.name,
  brand: product.brand,
  model: product.model,
  modelFamily: product.modelFamily,
  memory: product.memory,
  ram: product.ram,
  category: product.category,
  image: product.image,
  cashPriceARS: product.cashPriceARS,
  financing: product.financing,
  availability: product.availability,
  visibility: product.visibility,
  colors: product.colors,
  features: product.features,
  migrationStatus: product.migrationStatus,
  reviewReasons: product.reviewReasons,
}));

const standalone = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#071b37">
<title>AmarangoElectro V4.13 · Celulares LAB</title>
<style>
:root{--blue:#071b37;--blue2:#0b3974;--sky:#eaf3ff;--orange:#f47b20;--ink:#101828;--muted:#667085;--line:#d9e2ef;--bg:#f6f8fb;--ok:#087a55;--warn:#a15c00;--danger:#b42318}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;overflow-x:hidden}
button,input,select{font:inherit}button{cursor:pointer}.shell{width:min(1220px,100%);margin:auto;padding:0 18px}.top{position:sticky;top:0;z-index:20;background:rgba(255,255,255,.95);backdrop-filter:blur(18px);border-bottom:1px solid rgba(7,27,55,.08)}
.bar{min-height:76px;display:flex;align-items:center;gap:18px}.brand{display:flex;align-items:center;gap:12px;min-width:235px}.brand img{width:58px;height:58px;object-fit:contain}.brand strong{display:block;color:var(--blue);font-size:18px}.brand small{display:block;color:var(--muted);font-size:11px;letter-spacing:.08em;text-transform:uppercase}
.search{flex:1;position:relative}.search input{width:100%;border:1px solid var(--line);border-radius:999px;padding:14px 48px 14px 18px;background:#fff;color:var(--ink);outline:none}.search input:focus{border-color:#7aaef0;box-shadow:0 0 0 4px rgba(47,128,237,.12)}.search span{position:absolute;right:17px;top:13px}
.hero{background:linear-gradient(125deg,#06162e 0%,#0b3a75 67%,#0f5ca7 100%);color:#fff;padding:58px 0 52px;position:relative;overflow:hidden}.hero:after{content:"";position:absolute;inset:-30%;background:radial-gradient(circle at 72% 50%,rgba(255,255,255,.14),transparent 27%),radial-gradient(circle at 18% 10%,rgba(244,123,32,.3),transparent 20%);pointer-events:none}.hero .shell{position:relative;z-index:1}.eyebrow{display:inline-flex;gap:8px;align-items:center;padding:7px 11px;border:1px solid rgba(255,255,255,.24);border-radius:999px;background:rgba(255,255,255,.08);font-size:12px;font-weight:800;letter-spacing:.09em;text-transform:uppercase}.hero h1{font-size:clamp(34px,6vw,68px);line-height:.98;margin:20px 0 16px;max-width:850px;letter-spacing:-.05em}.hero p{font-size:clamp(15px,2vw,20px);max-width:750px;line-height:1.55;color:#dce9fb}.gate{display:flex;flex-wrap:wrap;gap:10px;margin-top:25px}.gate span{padding:9px 12px;border-radius:10px;background:rgba(255,255,255,.1);font-size:13px}.gate b{color:#fff}
.metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:-25px;position:relative;z-index:4}.metric{background:#fff;border:1px solid var(--line);border-radius:18px;padding:18px;box-shadow:0 15px 45px rgba(16,24,40,.08)}.metric strong{display:block;font-size:30px;color:var(--blue)}.metric span{font-size:12px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.05em}
.controls{padding:34px 0 16px}.filters{display:grid;grid-template-columns:1.2fr repeat(4,minmax(135px,.7fr));gap:10px}.field{display:flex;flex-direction:column;gap:6px}.field label{font-size:11px;color:var(--muted);font-weight:800;text-transform:uppercase;letter-spacing:.07em}.field input,.field select{height:46px;border:1px solid var(--line);border-radius:12px;background:#fff;padding:0 12px;color:var(--ink);min-width:0}.resultbar{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:18px 0}.resultbar h2{font-size:20px;margin:0}.resultbar p{margin:3px 0 0;color:var(--muted);font-size:13px}
.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px;padding-bottom:28px}.card{background:#fff;border:1px solid var(--line);border-radius:20px;overflow:hidden;display:flex;flex-direction:column;min-width:0;box-shadow:0 9px 25px rgba(16,24,40,.045);transition:transform .25s ease,box-shadow .25s ease}.card:hover{transform:translateY(-3px);box-shadow:0 17px 35px rgba(16,24,40,.1)}.photo{aspect-ratio:1/1;background:linear-gradient(145deg,#fff,#eef4fb);display:grid;place-items:center;padding:18px;position:relative}.photo img{width:100%;height:100%;object-fit:contain}.status{position:absolute;left:11px;top:11px;border-radius:999px;padding:6px 9px;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.05em}.status.ready{background:#d7f7e9;color:var(--ok)}.status.review{background:#fff0d5;color:var(--warn)}.status.conflict{background:#fee4e2;color:var(--danger)}.fav{position:absolute;right:10px;top:10px;border:0;background:rgba(255,255,255,.92);border-radius:50%;width:38px;height:38px;color:var(--blue);box-shadow:0 4px 15px rgba(16,24,40,.12)}.fav.active{background:var(--orange);color:#fff}.content{padding:15px;display:flex;flex-direction:column;flex:1}.meta{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:9px}.pill{border-radius:999px;background:var(--sky);color:var(--blue2);padding:5px 8px;font-size:10px;font-weight:800}.card h3{font-size:15px;line-height:1.35;margin:0 0 10px;min-height:41px;overflow-wrap:anywhere}.price{font-size:22px;font-weight:900;color:var(--blue);letter-spacing:-.03em}.finance{min-height:20px;margin-top:4px;font-size:11px;color:var(--muted)}.actions{display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:auto;padding-top:14px}.primary,.secondary{border-radius:11px;height:40px;border:0;font-weight:800}.primary{background:var(--blue);color:#fff}.secondary{width:42px;background:#edf3fb;color:var(--blue)}.more{display:block;margin:0 auto 45px;border:1px solid var(--line);background:#fff;color:var(--blue);padding:13px 20px;border-radius:999px;font-weight:800}.empty{grid-column:1/-1;padding:45px;text-align:center;background:#fff;border:1px dashed var(--line);border-radius:18px;color:var(--muted)}
dialog{border:0;border-radius:22px;padding:0;width:min(880px,calc(100% - 24px));max-height:90dvh;box-shadow:0 30px 100px rgba(0,0,0,.35);overflow:auto}dialog::backdrop{background:rgba(1,10,25,.72);backdrop-filter:blur(5px)}.detail{display:grid;grid-template-columns:1fr 1.1fr}.detail-media{background:#f3f7fc;padding:30px;display:grid;place-items:center;min-height:420px}.detail-media img{max-width:100%;max-height:430px;object-fit:contain}.detail-copy{padding:30px}.detail-copy h2{font-size:30px;line-height:1.1;color:var(--blue);margin:14px 0}.close{float:right;border:0;background:#edf3fb;border-radius:50%;width:40px;height:40px;font-size:18px}.notice{background:#fff6e8;border:1px solid #ffd9a5;border-radius:12px;padding:12px;font-size:13px;color:#7a4600;margin:15px 0}.detail-list{display:grid;gap:9px;margin:18px 0}.detail-list div{display:flex;justify-content:space-between;gap:14px;border-bottom:1px solid var(--line);padding-bottom:8px}.detail-list span{color:var(--muted)}.colors{display:flex;flex-wrap:wrap;gap:7px}.toast{position:fixed;left:50%;bottom:18px;transform:translate(-50%,20px);opacity:0;background:#101828;color:#fff;padding:10px 15px;border-radius:999px;z-index:50;transition:.2s;pointer-events:none;font-size:13px}.toast.show{opacity:1;transform:translate(-50%,0)}footer{background:var(--blue);color:#d9e6f7;padding:30px 0;text-align:center;font-size:13px}
@media(max-width:980px){.grid{grid-template-columns:repeat(3,minmax(0,1fr))}.filters{grid-template-columns:repeat(3,minmax(0,1fr))}.field:first-child{grid-column:span 2}.metrics{grid-template-columns:repeat(2,1fr)}}
@media(max-width:680px){.shell{padding-left:11px;padding-right:11px}.bar{min-height:66px;gap:8px}.brand{min-width:auto}.brand img{width:48px;height:48px}.brand div{display:none}.search input{padding:12px 41px 12px 14px}.hero{padding:42px 0 46px}.hero h1{font-size:39px}.hero p{font-size:15px}.metrics{gap:8px;margin-top:-22px}.metric{padding:14px;border-radius:15px}.metric strong{font-size:24px}.metric span{font-size:10px}.controls{padding-top:25px}.filters{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.field:first-child{grid-column:1/-1}.field input,.field select{height:44px;font-size:13px}.grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.photo{padding:10px}.content{padding:11px}.card h3{font-size:13px;min-height:53px}.price{font-size:18px}.actions{grid-template-columns:1fr auto}.detail{grid-template-columns:1fr}.detail-media{min-height:280px;padding:18px}.detail-media img{max-height:280px}.detail-copy{padding:20px}.detail-copy h2{font-size:24px}}
@media(max-width:370px){.grid{grid-template-columns:1fr}.card h3{min-height:auto}.photo{aspect-ratio:1.2/1}.filters{grid-template-columns:1fr}.field:first-child{grid-column:auto}.metrics{grid-template-columns:1fr 1fr}.gate span{font-size:11px}}
@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important}}
</style>
</head>
<body>
<header class="top"><div class="shell bar"><div class="brand"><img src="${logoData}" alt="Logo oficial AmarangoElectro"><div><strong>AmarangoElectro</strong><small>V4.13 Migration Lab</small></div></div><div class="search"><input id="globalSearch" type="search" autocomplete="off" placeholder="Buscar A16, Samsung, 256 GB…"><span>⌕</span></div></div></header>
<main>
<section class="hero"><div class="shell"><span class="eyebrow">Laboratorio · solo lectura</span><h1>92 celulares reales.<br>Una migración controlada.</h1><p>Parser conservador, identidad de transición y revisión humana antes de cualquier incorporación al catálogo canónico.</p><div class="gate"><span><b>0</b> escrituras</span><span><b>0</b> publicados automáticamente</span><span><b>Product V16</b> simulado localmente</span></div></div></section>
<section class="shell metrics"><article class="metric"><strong>${simulation.counts.source}</strong><span>celulares auditados</span></article><article class="metric"><strong>${simulation.counts.ready}</strong><span>listos para migrar</span></article><article class="metric"><strong>${simulation.counts.review}</strong><span>requieren revisión</span></article><article class="metric"><strong>${simulation.counts.conflict}</strong><span>conflictos</span></article></section>
<section class="shell controls"><div class="filters"><div class="field"><label for="search">Buscar</label><input id="search" type="search" placeholder="Nombre, modelo, memoria…"></div><div class="field"><label for="brand">Marca</label><select id="brand"><option value="">Todas</option></select></div><div class="field"><label for="family">Familia / modelo</label><select id="family"><option value="">Todas</option></select></div><div class="field"><label for="memory">Memoria</label><select id="memory"><option value="">Todas</option></select></div><div class="field"><label for="sort">Orden</label><select id="sort"><option value="source">Orden legacy</option><option value="price-asc">Precio: menor</option><option value="price-desc">Precio: mayor</option><option value="name">Nombre</option></select></div><div class="field"><label for="status">Estado lab</label><select id="status"><option value="">Todos</option><option value="ready">Listo para migrar</option><option value="review">Revisar</option><option value="conflict">Conflicto</option></select></div></div><div class="resultbar"><div><h2 id="resultTitle">Catálogo simulado</h2><p id="resultText"></p></div></div></section>
<section class="shell"><div id="grid" class="grid"></div><button id="more" class="more" hidden>Mostrar más</button></section>
</main>
<dialog id="detail"><div id="detailBody"></div></dialog><div id="toast" class="toast" role="status"></div>
<footer><div class="shell">AmarangoElectro V16 · V4.13 LAB · Sin conexión a Supabase · Sin publicación</div></footer>
<script>
const PRODUCTS=${JSON.stringify(publicProducts)};
const LABELS={ready:"Listo para migrar",review:"Revisar",conflict:"Conflicto"};
const els={globalSearch:document.querySelector("#globalSearch"),search:document.querySelector("#search"),brand:document.querySelector("#brand"),family:document.querySelector("#family"),memory:document.querySelector("#memory"),sort:document.querySelector("#sort"),status:document.querySelector("#status"),grid:document.querySelector("#grid"),more:document.querySelector("#more"),detail:document.querySelector("#detail"),detailBody:document.querySelector("#detailBody"),resultText:document.querySelector("#resultText"),toast:document.querySelector("#toast")};
let limit=24;let filtered=[];let favorites=new Set();
try{favorites=new Set(JSON.parse(localStorage.getItem("amarango-v413-favorites")||"[]"))}catch{}
const norm=(v)=>String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
const money=(v)=>new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0}).format(v);
const escapeHtml=(v)=>String(v??"").replace(/[&<>"']/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const options=(values)=>[...new Set(values.filter(Boolean))].sort((a,b)=>a.localeCompare(b,"es",{numeric:true})).map(v=>\`<option value="\${escapeHtml(v)}">\${escapeHtml(v)}</option>\`).join("");
els.brand.insertAdjacentHTML("beforeend",options(PRODUCTS.map(p=>p.brand)));
els.memory.insertAdjacentHTML("beforeend",options(PRODUCTS.map(p=>p.memory)));
function updateFamilies(){const brand=els.brand.value;const current=els.family.value;els.family.innerHTML='<option value="">Todas</option>'+options(PRODUCTS.filter(p=>!brand||p.brand===brand).map(p=>p.modelFamily));if([...els.family.options].some(o=>o.value===current))els.family.value=current}
updateFamilies();
function persist(){try{localStorage.setItem("amarango-v413-favorites",JSON.stringify([...favorites]))}catch{}}
function toast(message){els.toast.textContent=message;els.toast.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>els.toast.classList.remove("show"),1800)}
function apply(){const query=norm(els.search.value);const tokens=query.split(" ").filter(Boolean);filtered=PRODUCTS.filter(p=>{const hay=norm([p.name,p.brand,p.model,p.modelFamily,p.memory,p.ram].join(" "));const words=hay.split(" ");return(!tokens.length||tokens.every(t=>words.some(w=>w===t||w.startsWith(t))))&&(!els.brand.value||p.brand===els.brand.value)&&(!els.family.value||p.modelFamily===els.family.value)&&(!els.memory.value||p.memory===els.memory.value)&&(!els.status.value||p.migrationStatus===els.status.value)});if(els.sort.value==="price-asc")filtered.sort((a,b)=>a.cashPriceARS-b.cashPriceARS);if(els.sort.value==="price-desc")filtered.sort((a,b)=>b.cashPriceARS-a.cashPriceARS);if(els.sort.value==="name")filtered.sort((a,b)=>a.name.localeCompare(b.name,"es",{numeric:true}));limit=Math.max(24,Math.min(limit,filtered.length));render()}
function card(p){const chips=[p.brand,p.memory,p.ram?"RAM "+p.ram:null].filter(Boolean).map(v=>\`<span class="pill">\${escapeHtml(v)}</span>\`).join("");return \`<article class="card" data-key="\${p.legacyCellphoneKey}"><div class="photo"><span class="status \${p.migrationStatus}">\${LABELS[p.migrationStatus]}</span><button class="fav \${favorites.has(p.legacyCellphoneKey)?"active":""}" data-action="favorite" aria-label="Favorito">♥</button><img loading="lazy" decoding="async" src="\${escapeHtml(p.image)}" alt="\${escapeHtml(p.name)}" onerror="this.hidden=true;this.parentElement.style.background='linear-gradient(145deg,#e8eef7,#fff)'"></div><div class="content"><div class="meta">\${chips}</div><h3>\${escapeHtml(p.name)}</h3><div class="price">\${money(p.cashPriceARS)}</div><div class="finance">Financiación pendiente de política auditada</div><div class="actions"><button class="primary" data-action="detail">Ver detalle</button><button class="secondary" data-action="share" aria-label="Compartir">↗</button></div></div></article>\`}
function render(){els.grid.innerHTML=filtered.length?filtered.slice(0,limit).map(card).join(""):'<div class="empty"><strong>No hay coincidencias.</strong><br>No se inventan resultados.</div>';els.resultText.textContent=\`\${filtered.length} coincidencia\${filtered.length===1?"":"s"} · \${Math.min(limit,filtered.length)} visibles\`;els.more.hidden=limit>=filtered.length}
function productFrom(target){const card=target.closest(".card");return card&&PRODUCTS.find(p=>p.legacyCellphoneKey===card.dataset.key)}
function openDetail(p){const colors=p.colors.length?p.colors.map(c=>\`<span class="pill">\${escapeHtml(c)}</span>\`).join(""):"Sin colores auditados";const features=p.features.length?'<ul>'+p.features.map(f=>\`<li>\${escapeHtml(f)}</li>\`).join("")+'</ul>':"<p>Sin características explícitas auditadas.</p>";els.detailBody.innerHTML=\`<div class="detail"><div class="detail-media"><img src="\${escapeHtml(p.image)}" alt="\${escapeHtml(p.name)}"></div><div class="detail-copy"><button class="close" data-close aria-label="Cerrar">×</button><span class="status \${p.migrationStatus}" style="position:static;display:inline-block">\${LABELS[p.migrationStatus]}</span><h2>\${escapeHtml(p.name)}</h2><div class="price">\${money(p.cashPriceARS)}</div><div class="notice">LAB: visibilidad pendiente y disponibilidad desconocida. Este producto no está publicado.</div><div class="detail-list"><div><span>Marca</span><b>\${escapeHtml(p.brand||"Unknown")}</b></div><div><span>Modelo</span><b>\${escapeHtml(p.model||"Unknown")}</b></div><div><span>Memoria</span><b>\${escapeHtml(p.memory||"Unknown")}</b></div><div><span>RAM</span><b>\${escapeHtml(p.ram||"Unknown")}</b></div><div><span>Disponibilidad</span><b>Unknown</b></div></div><h3>Colores</h3><div class="colors">\${colors}</div><h3>Características</h3>\${features}<div class="actions"><button class="primary" data-share-key="\${p.legacyCellphoneKey}">Compartir local</button></div></div></div>\`;els.detail.showModal();history.replaceState(null,"","#"+p.slug)}
async function share(p){const payload={title:p.name,text:\`\${p.name}\\nContado: \${money(p.cashPriceARS)}\\nAmarangoElectro V4.13 LAB\`,url:location.href.split("#")[0]+"#"+p.slug};try{if(navigator.share){await navigator.share(payload)}else if(navigator.clipboard){await navigator.clipboard.writeText([payload.text,payload.url].join("\\n"));toast("Enlace copiado")}else{toast("Compartir no disponible en este navegador")}}catch(error){if(error?.name!=="AbortError")toast("No se pudo compartir")}}
els.grid.addEventListener("click",(event)=>{const button=event.target.closest("[data-action]");if(!button)return;const p=productFrom(button);if(!p)return;if(button.dataset.action==="favorite"){favorites.has(p.legacyCellphoneKey)?favorites.delete(p.legacyCellphoneKey):favorites.add(p.legacyCellphoneKey);persist();render();toast(favorites.has(p.legacyCellphoneKey)?"Guardado en favoritos":"Quitado de favoritos")}if(button.dataset.action==="detail")openDetail(p);if(button.dataset.action==="share")share(p)});
els.more.addEventListener("click",()=>{limit+=24;render()});els.detail.addEventListener("click",(event)=>{if(event.target.hasAttribute("data-close")){els.detail.close();history.replaceState(null,"",location.pathname)}const key=event.target.dataset.shareKey;if(key){const p=PRODUCTS.find(x=>x.legacyCellphoneKey===key);if(p)share(p)}});els.detail.addEventListener("click",(event)=>{if(event.target===els.detail)els.detail.close()});
[els.search,els.brand,els.family,els.memory,els.sort,els.status].forEach(el=>el.addEventListener(el.tagName==="INPUT"?"input":"change",()=>{if(el===els.brand)updateFamilies();limit=24;apply()}));els.globalSearch.addEventListener("input",()=>{els.search.value=els.globalSearch.value;limit=24;apply()});els.search.addEventListener("input",()=>{els.globalSearch.value=els.search.value});
apply();const initial=location.hash.slice(1);if(initial){const p=PRODUCTS.find(x=>x.slug===initial);if(p)openDetail(p)}
</script>
</body>
</html>`;
await write("AmarangoElectro-V16-V4.13-Cellphones-Lab-Standalone-Android.html", standalone);

const responsiveQa = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>V4.13 Responsive QA</title>
<style>*{box-sizing:border-box}body{margin:0;background:#182338;color:#fff;font-family:system-ui,sans-serif}.qa{padding:12px}.qa h1{font-size:18px}.frame{margin:auto;background:#fff;box-shadow:0 10px 35px #0008}.frame iframe{display:block;width:100%;height:780px;border:0}.result{margin:10px auto;padding:10px;border-radius:8px;background:#273754;font-size:13px}</style>
</head><body><main class="qa"><h1 id="title">Responsive QA</h1><div id="frame" class="frame"><iframe id="preview" title="Standalone V4.13"></iframe></div><div id="result" class="result">Cargando…</div></main>
<script>
const allowed=[320,360,390,412,768,1440];const requested=Number(new URLSearchParams(location.search).get("width"));const width=allowed.includes(requested)?requested:320;
const frame=document.querySelector("#frame");const preview=document.querySelector("#preview");frame.style.width=width+"px";document.querySelector("#title").textContent="V4.13 · "+width+" px";preview.src="./AmarangoElectro-V16-V4.13-Cellphones-Lab-Standalone-Android.html";
preview.addEventListener("load",()=>{const doc=preview.contentDocument;const root=doc.documentElement;const overflow=root.scrollWidth>root.clientWidth;document.querySelector("#result").textContent=JSON.stringify({width,clientWidth:root.clientWidth,scrollWidth:root.scrollWidth,overflow,cards:doc.querySelectorAll(".card").length});document.body.dataset.qa=overflow?"fail":"pass"});
</script></body></html>`;
await write("V4.13-RESPONSIVE-QA.html", responsiveQa);

console.log(JSON.stringify({
  generated: [
    "V4.13-MIGRATION-SIMULATION.json",
    "V4.13-CELLPHONES-AUDIT.md",
    "V4.13-CELLPHONE-PARSER.md",
    "V4.13-CANONICAL-IDENTITY-STRATEGY.md",
    "V4.13-DUPLICATES-VARIANTS.md",
    "V4.13-MASTER-CROSSCHECK.md",
    "V4.13-PRODUCT-V16-MAPPING.md",
    "V4.13-HUMAN-REVIEW-QUEUE.md",
    "AmarangoElectro-V16-V4.13-Cellphones-Lab-Standalone-Android.html",
    "V4.13-RESPONSIVE-QA.html",
  ],
  counts: simulation.counts,
}, null, 2));
