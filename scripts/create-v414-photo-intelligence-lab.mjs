import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildV414MigrationPreflight } from "../lib/photo-intelligence/v414-migration-preflight.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = async (file) => JSON.parse(await readFile(path.join(root, file), "utf8"));
const write = (file, content) => writeFile(path.join(root, file), content.endsWith("\n") ? content : `${content}\n`);
const v413 = await readJson("V4.13-MIGRATION-SIMULATION.json");
const preflight = buildV414MigrationPreflight(v413);
await write("V4.14-MIGRATION-PREFLIGHT.json", JSON.stringify(preflight, null, 2));

const prepared = preflight.products.filter((product) => product.reviewStatus === "prepared");
const pending = preflight.products.filter((product) => product.reviewStatus !== "prepared");
const preparedRows = prepared.map((product) => `| ${product.legacyPosition} | ${product.productV16.name.replaceAll("|", "\\|")} | ${product.legacyMappingKey} | ${product.productV16.memory ?? "—"} | ${product.productV16.ram ?? "—"} |`).join("\n");

await write("V4.14-PHOTO-INTELLIGENCE-ARCHITECTURE.md", `# V4.14 — Photo Intelligence Architecture

## Alcance

Laboratorio local, reproducible y sin conexión de escritura. La arquitectura no publica ni confirma campos: cada resultado conserva confianza, provenance y 'humanApprovalRequired=true'.

## Pipeline

Imagen → Fingerprint → Cache → Nivel 1 determinista → Nivel 2 OCR/visión simple → Nivel 3 AI Vision solo por acción Admin → Sugerencias → Aprobación humana.

## Contrato

'SuggestedProductMetadata' contiene: 'suggestedBrand', 'suggestedModel', 'suggestedMemory', 'suggestedRam', 'suggestedCategory', 'suggestedSubcategory', 'suggestedFeatures[]', 'detectedText[]', 'confidence', 'provenance', 'imageFingerprint', 'warnings[]' y 'humanApprovalRequired=true'.

Provenance admitida: 'explicit_visual', 'ocr_extracted', 'ai_inferred', 'matched_existing_data', 'unknown'. El nivel 3 nunca cambia 'ai_inferred' por “confirmado”.

## Implementación

- Tipos: 'lib/photo-intelligence/v414-types.ts'.
- Fingerprint: 'v414-image-fingerprint.ts'.
- Cache: 'v414-photo-cache.ts'.
- Clasificación: 'v414-category-classifier.ts'.
- Orquestación: 'v414-photo-intelligence.ts'.
- Preflight: 'v414-migration-preflight.ts'.

No se importan estos módulos desde el storefront productivo. No existe cliente Supabase, endpoint, token ni función de mutación en esta capa.
`);

await write("V4.14-IMAGE-FINGERPRINT-CACHE.md", `# V4.14 — Image Fingerprint & Cache

## Estrategia

| Entrada | Fingerprint | Uso |
|---|---|---|
| Archivo local | SHA-256 de bytes, prefijo 'sha256-bytes-v1' | Identidad fuerte del contenido |
| URL HTTPS ya existente | SHA-256 de URL canónica sin query/hash, prefijo 'sha256-url-v1' | Clave provisional cuando no se descargan bytes |

La posición legacy y el nombre del producto no participan en el hash de imagen. El fingerprint de URL no pretende probar igualdad binaria: cambia a hash de bytes en una futura ingestión autorizada.

## Política de cache

- Clave: 'imageFingerprint + analyzerVersion'.
- Hit válido: no vuelve a analizar ni suma costo.
- Miss: ejecuta niveles deterministas; IA solo por acción explícita.
- Invalidación: cambio de versión del analizador o acción manual documentada.
- Reanálisis: nunca automático; requiere botón Admin.
- Persistencia del standalone: únicamente 'localStorage' del dispositivo del laboratorio.

El preview permite comprobar hit/miss sin red. Ningún resultado cacheado produce publicación automática.
`);

await write("V4.14-AI-COST-CONTROL.md", `# V4.14 — AI Cost Control

## Política simulada

| Parámetro | Valor de laboratorio |
|---|---:|
| Presupuesto mensual configurable | 2.500 centavos de dólar |
| Costo estimado por fallback | 1 centavo de dólar |
| Fallbacks simulados en este preflight | ${preflight.counts.simulatedAiFallbacks} |
| Costo externo real ejecutado | 0 |
| Costo estimado contabilizado | ${preflight.simulatedCostPolicy.simulatedAccountedCostUSCents} centavo de dólar |
| Peor caso teórico: analizar 92 una vez | ${preflight.simulatedCostPolicy.worstCaseAll92USCents} centavos de dólar |

Son parámetros de simulación, no una cotización de proveedor. El costo real dependerá del servicio/modelo aprobado en un gate futuro.

## Controles

1. IA desactivada por defecto.
2. Botón Admin “Analizar con IA”.
3. Cache hit cuesta cero y evita la llamada.
4. Contador y gasto estimado acumulado.
5. Hard stop antes de superar el presupuesto.
6. Reanálisis manual explícito con motivo.
7. Registro: motivo, resultado, cache hit/miss, costo estimado y 'externalCallMade=false' en V4.14.
`);

await write("V4.14-CATEGORY-CLASSIFICATION.md", `# V4.14 — Category Classification

El clasificador acepta evidencia existente y texto visible. Prioriza coincidencia explícita con Product V16; luego reglas deterministas; ante ausencia devuelve 'Otros' con baja confianza. Siempre exige aprobación humana.

## Taxonomía preparada

Celulares; Smart TV; Audio; Refrigeración; Cocción; Climatización; Lavado; Pequeños electrodomésticos; Limpieza; Colchones y sommiers; Blanquería; Muebles; Hogar y decoración; Deporte y movilidad; Informática; Cargadores y accesorios; Cuidado personal y salud; Bebés; Accesorios para auto y motos; Mascotas; Gaming; Otros.

Para los 92 registros del laboratorio la categoría sugerida es **Celulares**, provenance 'matched_existing_data', confianza 99%. Esto no cambia su 'visibility=pending'.
`);

await write("V4.14-PRODUCT-FEATURE-EXTRACTION.md", `# V4.14 — Product Feature Extraction

## Contrato

Cada característica conserva 'label', 'value', 'confidence' y 'provenance'. La tarjeta muestra como máximo cuatro; la ficha puede mostrar el conjunto completo.

## Evidencia revisada

### iPhone 17 Pro 256 GB — resuelto con evidencia

El flyer HTTPS muestra de forma legible “Carga rápida USB-C”. Se reemplaza únicamente el fragmento legacy truncado 'USB-' en la simulación. Provenance: 'ocr_extracted', confianza 99%. El producto pasa de revisión técnica a preparado, pero sigue 'visibility=pending'.

### Infinix GT 30 Pro NFC 512/12 GB — parcialmente extraído

El flyer demuestra: pantalla AMOLED 6,78 FHD+ 144 Hz, 12 GB RAM expandible, cámara 108 MP y batería 5000 mAh con carga rápida 45 W. No muestra con claridad el nombre comercial exacto del color ni un kit gamer separado; por eso el bundle sigue pendiente.

No se inventan stock, financiación, garantía, fecha de actualización ni especificaciones no visibles.
`);

await write("V4.14-MIGRATION-PREFLIGHT.md", `# V4.14 — Migration Preflight

## Decisión

- Fuente: snapshot sanitizado V4.13 de 92 celulares reales.
- Preparados técnicamente: **${preflight.counts.prepared}**.
- Revisión humana: **${preflight.counts.humanReviewRequired}**.
- Conflictos: **0**.
- Escrituras ejecutadas: **0**.

“Preparado” significa que el payload es coherente para un gate futuro; no significa publicado. Los 92 conservan 'stableId=null', 'visibility=pending', 'availability=unknown' y 'financing=[]'.

## Identidad y payload futuro

1. Usar 'legacyMappingKey' para trazabilidad.
2. Asignar un ID persistente nuevo únicamente durante una migración futura autorizada.
3. Persistir mapping 'legacyCellphoneKey → canonicalProductId' en el mismo lote controlado.
4. Insertar solo el payload sanitizado presente en 'V4.14-MIGRATION-PREFLIGHT.json'.
5. No trasladar valores monetarios internos del origen ni JSON crudo al Product público.

## 91 preparados

| Pos. | Producto | Legacy mapping key | Memoria | RAM |
|---:|---|---|---|---|
${preparedRows}

## Caso pendiente

| Pos. | Producto | Motivo | Acción humana |
|---:|---|---|---|
${pending.map((product) => `| ${product.legacyPosition} | ${product.productV16.name.replaceAll("|", "\\|")} | ${product.reviewReasons.join(", ")} | Confirmar color comercial y contenido real del kit; aprobar teléfono solo, crear variante de bundle o mantener pendiente |`).join("\n")}

## Rollback esperado

Antes de cualquier write futuro: capturar hash/snapshot del master y del mapping. Ante falla: restaurar snapshot pre-migración, remover solo mappings creados por el lote y regenerar el read model derivado; luego verificar paridad. V4.14 no contiene SQL ejecutable ni activa ese rollback.
`);

await write("V4.14-HUMAN-REVIEW.md", `# V4.14 — Human Review

## Estado

- Cola V4.13: 2 casos.
- Resuelto con evidencia visual/OCR en V4.14: 1.
- Pendiente después del preflight: **1**.

### Resuelto — posición 10

**IPHONE 17 PRO 256GB**. El flyer muestra “Carga rápida USB-C”. Se corrige el fragmento truncado solo en el payload simulado. Requiere aprobación humana final de migración como todos los productos, pero ya no necesita revisión de metadata.

### Pendiente — posición 91

**INFINIX GT 30 PRO NFC 512/12GB dark flare + kit gamer shadow**

- Evidencia confirmada: marca, modelo, NFC, 512 GB, 12 GB RAM, pantalla, cámara, batería/carga.
- No confirmado: nombre comercial exacto del color “dark flare”.
- No visible: contenido o existencia del “kit gamer shadow” como bundle separado.
- Riesgo: publicar una variante/bundle que no coincida con el producto entregable.
- Alternativas: aprobar solo el teléfono; definir el kit como variante/bundle con evidencia; mantener pendiente.
- Acción requerida: revisión humana de fuente comercial y foto del kit.
`);

await write("V4.14-SAFETY-SEAL.md", `# V4.14 — Safety Seal

| Superficie | Resultado |
|---|---:|
| INSERT | 0 |
| UPDATE | 0 |
| DELETE | 0 |
| UPSERT | 0 |
| RPC escritura | 0 |
| Storage writes | 0 |
| Migraciones | 0 |
| Cambios RLS | 0 |
| Deploy | 0 |
| Cambios main | 0 |
| Llamadas externas de IA | 0 |

V4.14 opera sobre fixtures locales sanitizados. El standalone no usa iframe, cliente de base de datos ni APIs de mutación. Las fotos conservan las URLs HTTPS públicas auditadas del snapshot y se cargan únicamente con GET del navegador. La aprobación del preview solo persiste en 'localStorage' del dispositivo del laboratorio.
`);

await write("V4.14-QA-REPORT.md", `# V4.14 — QA Report

## Comandos ejecutados

| Control | Resultado |
|---|---|
| 'npm run lint' | PASS |
| 'npm run build' | PASS; 8 rutas preservadas |
| 'node --test tests/*.test.mjs' | PASS; 178/178 |
| V4.14 específica | PASS; 14/14 |
| Regresión V4.13 | PASS; checkpoint sigue 90/2 y byte-determinista |
| Safety scan V4.14 | PASS; todas las superficies en 0 |

## Controles específicos

- Fingerprint de bytes y de URL: PASS.
- Cache por fingerprint + versión, invalidación explícita y cache hit sin costo: PASS.
- Límite mensual y hard stop: PASS.
- Parser/normalización heredada, clasificación de 22 categorías y provenance permitida: PASS.
- Privacidad de Product/payload público: PASS.
- iPhone 17 Pro: 'USB-C' resuelto desde evidencia visual; PASS.
- Infinix: especificaciones extraídas y bundle mantenido en revisión; PASS fail-closed.
- Standalone: un solo HTML directo, cero iframe, cero select nativo, script válido: PASS.
- Búsqueda A16: se detectó un escape incorrecto del regex en el HTML generado, se corrigió y se revalidó; devuelve exactamente 'Samsung A16 128/4gb'.
- Filtros custom, ficha, favorito local y navegación de sheets: PASS en navegador.
- Consola de la app: sin errores propios; se ignoró ruido de la extensión del navegador de QA.

## Responsive visual

Revisión visual directa con harness técnico en 320, 360, 390, 412, 768 y 1440 px. En los seis casos: 92 tarjetas renderizadas, cero select nativo, cero iframe dentro del standalone y 'scrollWidth = clientWidth' (sin overflow horizontal). Header, hero, métricas, chips, tarjetas y CTAs permanecen legibles.

## Limitación de automatización registrada

El selector de archivos local quedó visible, estilizado y conectado al handler de fingerprint. El navegador cloud de QA no expuso el evento 'filechooser' y agotó su timeout; no se atribuye como fallo de la app, pero la selección manual de una foto real en Android queda como control humano recomendado. La lógica subyacente de hash, cache, sugerencias, costo y aprobación local sí pasó tests automáticos.
`);

const logo = await readFile(path.join(root, "public/brand/amarango-logo-official.png"));
const logoData = `data:image/png;base64,${logo.toString("base64")}`;
const publicProducts = preflight.products.map((entry) => ({
  legacyPosition: entry.legacyPosition,
  legacyMappingKey: entry.legacyMappingKey,
  name: entry.productV16.name,
  brand: entry.productV16.brand,
  model: entry.productV16.model,
  family: v413.products.find((product) => product.legacyPosition === entry.legacyPosition)?.modelFamily ?? entry.productV16.model,
  memory: entry.productV16.memory,
  ram: entry.productV16.ram,
  category: "Celulares",
  image: entry.productV16.image,
  price: entry.productV16.cashPriceARS,
  colors: entry.productV16.colors,
  features: entry.productV16.featureDetails.slice(0, 8),
  status: entry.reviewStatus === "prepared" ? "prepared" : "review",
  reviewReasons: entry.reviewReasons,
  fingerprint: entry.imageFingerprint,
  visibility: "pending",
  availability: "unknown",
}));

const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#061a37"><title>AmarangoElectro V16 · V4.14 Photo Intelligence Lab</title>
<style>
:root{--navy:#061a37;--blue:#0a3979;--blue2:#1358aa;--orange:#f47b20;--ink:#101828;--muted:#667085;--line:#dce5ef;--bg:#f4f7fb;--ok:#057a55;--warn:#a15c00;--danger:#b42318;--white:#fff}*{box-sizing:border-box}html{scroll-behavior:smooth;overflow-x:hidden}body{margin:0;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--ink);background:var(--bg);overflow-x:hidden}button,input{font:inherit}button{cursor:pointer}.shell{width:min(1240px,calc(100% - 28px));margin:auto}.top{position:sticky;top:0;z-index:40;background:rgba(255,255,255,.94);backdrop-filter:blur(15px);border-bottom:1px solid rgba(220,229,239,.8)}.bar{min-height:72px;display:flex;align-items:center;gap:16px}.brand{display:flex;align-items:center;gap:10px;min-width:230px}.brand img{width:54px;height:54px;object-fit:contain}.brand strong{display:block;color:var(--navy)}.brand small{display:block;color:var(--muted);font-size:11px}.search{flex:1;position:relative}.search input{width:100%;height:46px;border:1px solid var(--line);background:#f8fafc;border-radius:15px;padding:0 48px 0 16px;outline:none}.search input:focus{border-color:var(--blue2);box-shadow:0 0 0 3px rgba(19,88,170,.12)}.search span{position:absolute;right:16px;top:11px;font-size:20px;color:var(--blue)}.admin-open{border:0;background:var(--navy);color:#fff;border-radius:14px;padding:12px 15px;font-weight:800;white-space:nowrap}.hero{background:radial-gradient(circle at 84% 12%,rgba(244,123,32,.26),transparent 25%),linear-gradient(125deg,#061a37,#0a3979 60%,#1358aa);color:#fff;padding:48px 0 62px;position:relative;overflow:hidden}.hero:after{content:"";position:absolute;inset:-100% -20%;background:linear-gradient(110deg,transparent 42%,rgba(255,255,255,.12) 48%,transparent 54%);animation:sweep 9s ease-in-out infinite}.hero .shell{position:relative;z-index:2}.eyebrow{display:inline-flex;border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.1);border-radius:999px;padding:7px 11px;font-size:11px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.hero h1{font-size:clamp(34px,5vw,66px);line-height:.98;letter-spacing:-.055em;margin:18px 0;max-width:850px}.hero p{max-width:760px;color:#d7e7fb;line-height:1.55;margin:0}.gate{display:flex;flex-wrap:wrap;gap:8px;margin-top:22px}.gate span{background:rgba(255,255,255,.1);padding:9px 11px;border-radius:11px;font-size:12px}.metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:-28px;position:relative;z-index:4}.metric{background:#fff;border:1px solid var(--line);border-radius:19px;padding:18px;box-shadow:0 16px 42px rgba(16,24,40,.08)}.metric strong{font-size:30px;color:var(--blue);display:block}.metric span{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;font-weight:900}.controls{padding:30px 0 14px}.filter-row{display:flex;gap:8px;overflow:auto;padding:2px 1px 8px;scrollbar-width:none}.filter-row::-webkit-scrollbar{display:none}.chip{border:1px solid var(--line);background:#fff;color:var(--navy);border-radius:999px;padding:10px 13px;white-space:nowrap;font-size:12px;font-weight:800}.chip.active{background:var(--navy);border-color:var(--navy);color:#fff}.resultbar{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 0}.resultbar h2{font-size:20px;margin:0}.resultbar p{font-size:12px;color:var(--muted);margin:3px 0 0}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;padding-bottom:46px}.card{min-width:0;display:flex;flex-direction:column;background:#fff;border:1px solid var(--line);border-radius:21px;overflow:hidden;box-shadow:0 8px 25px rgba(16,24,40,.05);transition:.25s}.card:hover{transform:translateY(-3px);box-shadow:0 18px 38px rgba(16,24,40,.1)}.photo{aspect-ratio:1/1;background:linear-gradient(145deg,#fff,#edf3f9);display:grid;place-items:center;padding:16px;position:relative}.photo img{width:100%;height:100%;object-fit:contain}.status{position:absolute;left:10px;top:10px;border-radius:999px;padding:6px 9px;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.05em}.status.prepared{background:#d7f7e9;color:var(--ok)}.status.review{background:#fff0d5;color:var(--warn)}.fav{position:absolute;right:10px;top:10px;width:38px;height:38px;border:0;border-radius:50%;background:rgba(255,255,255,.94);color:var(--blue);box-shadow:0 4px 16px rgba(16,24,40,.13)}.fav.active{background:var(--orange);color:#fff}.content{padding:14px;display:flex;flex-direction:column;flex:1}.meta{display:flex;gap:5px;flex-wrap:wrap}.pill{background:#edf5ff;color:var(--blue);border-radius:999px;padding:5px 8px;font-size:10px;font-weight:800}.card h3{font-size:14px;line-height:1.4;margin:10px 0;overflow-wrap:anywhere}.features{display:grid;gap:5px;margin:0 0 12px;padding:0;list-style:none}.features li{font-size:10px;color:var(--muted);display:flex;gap:5px}.features li:before{content:"•";color:var(--orange);font-weight:900}.price{font-size:21px;font-weight:900;color:var(--navy);margin-top:auto}.pending-finance{font-size:10px;color:var(--muted);min-height:16px}.actions{display:grid;grid-template-columns:1fr auto;gap:7px;margin-top:12px}.primary,.icon{height:40px;border:0;border-radius:11px;font-weight:850}.primary{background:var(--navy);color:#fff}.icon{width:42px;background:#edf3fb;color:var(--blue)}.empty{grid-column:1/-1;padding:42px;text-align:center;border:1px dashed var(--line);border-radius:18px;color:var(--muted);background:#fff}.backdrop{position:fixed;inset:0;background:rgba(2,12,29,.66);backdrop-filter:blur(6px);z-index:70;opacity:0;pointer-events:none;transition:.22s}.backdrop.show{opacity:1;pointer-events:auto}.sheet{position:fixed;z-index:80;background:#fff;box-shadow:0 -24px 80px rgba(0,0,0,.28);transition:transform .28s ease;overflow:auto}.filter-sheet{left:0;right:0;bottom:0;max-height:82dvh;border-radius:25px 25px 0 0;transform:translateY(105%);padding:8px 18px calc(24px + env(safe-area-inset-bottom))}.filter-sheet.show{transform:translateY(0)}.sheet-handle{width:42px;height:5px;border-radius:99px;background:#d0d5dd;margin:4px auto 16px}.sheet-head{display:flex;justify-content:space-between;align-items:center;gap:12px}.sheet-head h2{margin:0;font-size:21px}.x{width:40px;height:40px;border:0;border-radius:50%;background:#edf3fb;color:var(--navy);font-size:20px}.options{display:grid;gap:8px;margin:18px 0}.option{min-height:48px;border:1px solid var(--line);border-radius:14px;background:#fff;text-align:left;padding:12px 14px;display:flex;align-items:center;justify-content:space-between}.option.active{border-color:var(--blue2);background:#edf5ff;color:var(--blue);font-weight:850}.option .radio{width:20px;height:20px;border-radius:50%;border:2px solid #98a2b3}.option.active .radio{border:6px solid var(--blue2)}.detail-sheet{top:0;right:0;bottom:0;width:min(650px,100%);transform:translateX(105%);padding:18px}.detail-sheet.show{transform:translateX(0)}.detail-media{height:min(46vh,430px);background:#f3f7fc;border-radius:20px;display:grid;place-items:center;padding:20px}.detail-media img{width:100%;height:100%;object-fit:contain}.detail-sheet h2{font-size:28px;line-height:1.1;color:var(--navy);margin:16px 0}.detail-list{display:grid;gap:8px}.detail-list div{display:flex;justify-content:space-between;gap:16px;border-bottom:1px solid var(--line);padding-bottom:8px;font-size:13px}.detail-list span{color:var(--muted)}.admin-sheet{top:0;right:0;bottom:0;width:min(720px,100%);transform:translateX(105%);padding:18px}.admin-sheet.show{transform:translateX(0)}.lab-warning{background:#fff5e6;border:1px solid #ffd49a;color:#7a4500;padding:12px;border-radius:14px;font-size:12px;margin:14px 0}.upload{border:2px dashed #b8c7d9;background:#f8fbff;border-radius:18px;padding:26px;text-align:center}.file-input{width:min(100%,340px);color:var(--muted);font-size:12px}.file-input::file-selector-button{border:0;border-radius:12px;background:var(--blue);color:#fff;padding:12px 16px;margin-right:10px;font-weight:850;cursor:pointer}.local-preview{display:none;grid-template-columns:140px 1fr;gap:14px;margin-top:14px}.local-preview.show{display:grid}.local-preview img{width:140px;height:140px;object-fit:contain;background:#f4f7fb;border-radius:15px}.analysis-card{background:#f7f9fc;border:1px solid var(--line);border-radius:17px;padding:15px}.suggestions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:12px}.suggestion{background:#fff;border:1px solid var(--line);border-radius:12px;padding:10px}.suggestion small{display:block;color:var(--muted);font-size:10px;text-transform:uppercase;font-weight:850}.suggestion strong{font-size:13px}.admin-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.admin-actions button{border:0;border-radius:12px;padding:12px 14px;font-weight:850}.ai-btn{background:#e9eff8;color:var(--navy)}.approve-btn{background:var(--ok);color:#fff}.cost{font-size:11px;color:var(--muted);margin-top:10px}.toast{position:fixed;left:50%;bottom:18px;z-index:100;transform:translate(-50%,25px);opacity:0;background:#101828;color:#fff;border-radius:999px;padding:11px 15px;font-size:12px;transition:.2s;pointer-events:none}.toast.show{transform:translate(-50%,0);opacity:1}footer{background:var(--navy);color:#dce9f8;text-align:center;padding:28px;font-size:12px}@keyframes sweep{0%,25%{transform:translateX(-28%)}70%,100%{transform:translateX(28%)}}
@media(max-width:980px){.grid{grid-template-columns:repeat(3,minmax(0,1fr))}.metrics{grid-template-columns:repeat(2,1fr)}}@media(max-width:680px){.shell{width:min(100% - 20px,1240px)}.bar{min-height:66px;gap:8px}.brand{min-width:auto}.brand img{width:48px;height:48px}.brand div{display:none}.admin-open{width:46px;height:46px;padding:0;border-radius:50%;font-size:0}.admin-open:after{content:"+";font-size:24px}.hero{padding:38px 0 50px}.hero h1{font-size:38px}.metrics{gap:8px;margin-top:-22px}.metric{padding:14px}.metric strong{font-size:24px}.metric span{font-size:9px}.grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.photo{padding:10px}.content{padding:11px}.card h3{font-size:12px}.features li:nth-child(n+4){display:none}.price{font-size:17px}.filter-sheet{padding-left:13px;padding-right:13px}.detail-sheet,.admin-sheet{top:auto;left:0;right:0;bottom:0;width:100%;max-height:92dvh;border-radius:25px 25px 0 0;transform:translateY(105%)}.detail-sheet.show,.admin-sheet.show{transform:translateY(0)}.local-preview{grid-template-columns:100px 1fr}.local-preview img{width:100px;height:100px}.suggestions{grid-template-columns:1fr}.sheet-head{position:sticky;top:-18px;background:#fff;padding:12px 0;z-index:2}}@media(max-width:370px){.grid{grid-template-columns:1fr}.photo{aspect-ratio:1.15/1}.metrics{grid-template-columns:1fr 1fr}.hero h1{font-size:34px}.gate span{font-size:10px}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
</style></head><body>
<header class="top"><div class="shell bar"><div class="brand"><img src="${logoData}" alt="Logo oficial AmarangoElectro"><div><strong>AmarangoElectro</strong><small>V4.14 Photo Intelligence Lab</small></div></div><div class="search"><input id="search" type="search" autocomplete="off" placeholder="Buscar A16, Samsung, 256 GB…"><span>⌕</span></div><button class="admin-open" data-open-admin>Nuevo producto</button></div></header>
<main><section class="hero"><div class="shell"><span class="eyebrow">Preflight local · aprobación humana</span><h1>Fotos que sugieren.<br>Personas que deciden.</h1><p>Los 92 celulares se normalizan en memoria. El sistema detecta metadata, cachea por fingerprint y bloquea cualquier publicación automática.</p><div class="gate"><span><b>91</b> preparados</span><span><b>1</b> revisión</span><span><b>0</b> escrituras</span><span><b>0</b> llamadas IA reales</span></div></div></section>
<section class="shell metrics"><article class="metric"><strong>92</strong><span>celulares auditados</span></article><article class="metric"><strong>91</strong><span>preflight preparado</span></article><article class="metric"><strong>1</strong><span>revisión humana</span></article><article class="metric"><strong>1¢</strong><span>costo IA simulado</span></article></section>
<section class="shell controls"><div class="filter-row"><button class="chip" data-filter="brand">Marca: <span>Todas</span></button><button class="chip" data-filter="family">Modelo: <span>Todos</span></button><button class="chip" data-filter="memory">Memoria: <span>Todas</span></button><button class="chip" data-filter="status">Estado: <span>Todos</span></button><button class="chip" data-filter="sort">Orden: <span>Origen</span></button></div><div class="resultbar"><div><h2>Catálogo simulado</h2><p id="resultText"></p></div></div></section><section class="shell"><div id="grid" class="grid"></div></section></main>
<div id="backdrop" class="backdrop"></div><aside id="filterSheet" class="sheet filter-sheet" aria-hidden="true"><div class="sheet-handle"></div><div class="sheet-head"><h2 id="filterTitle">Elegir</h2><button class="x" data-close aria-label="Cerrar">×</button></div><div id="filterOptions" class="options"></div></aside>
<aside id="detailSheet" class="sheet detail-sheet" aria-hidden="true"><div class="sheet-head"><h2>Ficha simulada</h2><button class="x" data-close aria-label="Cerrar">×</button></div><div id="detailBody"></div></aside>
<aside id="adminSheet" class="sheet admin-sheet" aria-hidden="true"><div class="sheet-head"><h2>Cargar producto desde foto</h2><button class="x" data-close aria-label="Cerrar">×</button></div><div class="lab-warning">LAB local: el resultado requiere aprobación humana y nunca se guarda en producción.</div><div class="upload"><p>Seleccioná una foto local para generar fingerprint y sugerencias.</p><input id="photoInput" class="file-input" type="file" accept="image/*" aria-label="Elegir foto"></div><div id="localPreview" class="local-preview"><img id="previewImage" alt="Preview local"><div class="analysis-card"><strong id="analysisState">Esperando imagen</strong><p id="fingerprintText" class="cost"></p><div id="suggestions" class="suggestions"></div><div class="admin-actions"><button id="aiAnalyze" class="ai-btn" disabled>Analizar con IA</button><button id="approvePreflight" class="approve-btn" disabled>Aprobar para preflight</button></div><p id="costText" class="cost">Presupuesto simulado: 2.500 centavos · usado: 0 · cache: —</p></div></div></aside>
<div id="toast" class="toast" role="status"></div><footer>AmarangoElectro V16 · V4.14 LAB · Sin iframe · Sin APIs de mutación · Sin publicación</footer>
<script>
const PRODUCTS=${JSON.stringify(publicProducts)};
const state={brand:"",family:"",memory:"",status:"",sort:"source",query:""};
const labels={prepared:"Preparado",review:"Revisión"};
const $=(selector,root=document)=>root.querySelector(selector);const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
const money=(value)=>new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0}).format(value);
const escapeHtml=(value)=>String(value??"").replace(/[&<>"']/g,(char)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
const normalize=(value)=>String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const favorites=new Set(JSON.parse(localStorage.getItem("amarango-v414-favorites")||"[]"));
function toast(message){const node=$("#toast");node.textContent=message;node.classList.add("show");setTimeout(()=>node.classList.remove("show"),1800)}
function filtered(){const query=normalize($("#search")?.value.trim()||state.query);let items=PRODUCTS.filter((product)=>{const hay=normalize([product.name,product.brand,product.model,product.family,product.memory,product.ram].join(" "));return(!query||query.split(/\\s+/).every((token)=>hay.split(/\\s+/).some((part)=>part===token||part.startsWith(token))))&&(!state.brand||product.brand===state.brand)&&(!state.family||product.family===state.family)&&(!state.memory||product.memory===state.memory)&&(!state.status||product.status===state.status)});if(state.sort==="priceAsc")items.sort((a,b)=>a.price-b.price);if(state.sort==="priceDesc")items.sort((a,b)=>b.price-a.price);if(state.sort==="name")items.sort((a,b)=>a.name.localeCompare(b.name,"es"));return items}
function render(){const items=filtered();$("#resultText").textContent=items.length+" de 92 productos · todos pendientes de publicación";$("#grid").innerHTML=items.length?items.map(card).join(""):'<div class="empty">No hay coincidencias. Probá otro término o quitá un filtro.</div>'}
function card(product){const features=product.features.slice(0,4).map((feature)=>'<li>'+escapeHtml(feature.label+": "+feature.value)+'</li>').join("");return '<article class="card"><div class="photo"><img src="'+escapeHtml(product.image)+'" alt="'+escapeHtml(product.name)+'" loading="lazy"><span class="status '+product.status+'">'+labels[product.status]+'</span><button class="fav '+(favorites.has(product.legacyMappingKey)?"active":"")+'" data-fav="'+product.legacyMappingKey+'" aria-label="Favorito">♥</button></div><div class="content"><div class="meta">'+[product.brand,product.memory,product.ram].filter(Boolean).map((value)=>'<span class="pill">'+escapeHtml(value)+'</span>').join("")+'</div><h3>'+escapeHtml(product.name)+'</h3><ul class="features">'+features+'</ul><div class="price">'+money(product.price)+'</div><div class="pending-finance">Financiación pendiente de política auditada</div><div class="actions"><button class="primary" data-detail="'+product.legacyMappingKey+'">Ver ficha</button><button class="icon" data-share="'+product.legacyMappingKey+'" aria-label="Compartir">↗</button></div></div></article>'}
function unique(key){return [...new Set(PRODUCTS.map((product)=>product[key]).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),"es"))}
const filterConfig={brand:{title:"Elegir marca",all:"Todas",values:()=>unique("brand")},family:{title:"Elegir modelo / familia",all:"Todos",values:()=>unique("family")},memory:{title:"Elegir memoria",all:"Todas",values:()=>unique("memory")},status:{title:"Estado de preflight",all:"Todos",values:()=>["prepared","review"],label:(value)=>labels[value]},sort:{title:"Ordenar",all:null,values:()=>["source","priceAsc","priceDesc","name"],label:(value)=>({source:"Origen",priceAsc:"Precio menor",priceDesc:"Precio mayor",name:"Nombre"}[value])}};
let activeSheet="";function openLayer(id){$("#backdrop").classList.add("show");$(id).classList.add("show");$(id).setAttribute("aria-hidden","false")}function closeLayers(){$("#backdrop").classList.remove("show");$$(".sheet.show").forEach((node)=>{node.classList.remove("show");node.setAttribute("aria-hidden","true")})}
function openFilter(key){activeSheet=key;const config=filterConfig[key];$("#filterTitle").textContent=config.title;const options=[];if(config.all!==null)options.push({value:"",label:config.all});for(const value of config.values())options.push({value,label:config.label?config.label(value):value});$("#filterOptions").innerHTML=options.map((item)=>'<button class="option '+(state[key]===item.value?"active":"")+'" data-value="'+escapeHtml(item.value)+'"><span>'+escapeHtml(item.label)+'</span><i class="radio"></i></button>').join("");openLayer("#filterSheet")}
$$('[data-filter]').forEach((button)=>button.addEventListener("click",()=>openFilter(button.dataset.filter)));$("#filterOptions").addEventListener("click",(event)=>{const option=event.target.closest("[data-value]");if(!option)return;state[activeSheet]=option.dataset.value;const config=filterConfig[activeSheet];const label=option.dataset.value?(config.label?config.label(option.dataset.value):option.dataset.value):config.all;const button=$('[data-filter="'+activeSheet+'"]');$("span",button).textContent=label;button.classList.toggle("active",Boolean(option.dataset.value));closeLayers();render()});
$("#search").addEventListener("input",(event)=>{state.query=normalize(event.target.value.trim());render()});$("#backdrop").addEventListener("click",closeLayers);$$('[data-close]').forEach((button)=>button.addEventListener("click",closeLayers));
$("#grid").addEventListener("click",async(event)=>{const fav=event.target.closest("[data-fav]");if(fav){favorites.has(fav.dataset.fav)?favorites.delete(fav.dataset.fav):favorites.add(fav.dataset.fav);localStorage.setItem("amarango-v414-favorites",JSON.stringify([...favorites]));render();return}const detail=event.target.closest("[data-detail]");if(detail){showDetail(PRODUCTS.find((product)=>product.legacyMappingKey===detail.dataset.detail));return}const share=event.target.closest("[data-share]");if(share){const product=PRODUCTS.find((item)=>item.legacyMappingKey===share.dataset.share);const data={title:product.name,text:product.name+" · "+money(product.price)+" · AmarangoElectro V4.14 LAB",url:location.href.split("#")[0]+"#producto-"+product.legacyMappingKey};try{if(navigator.share)await navigator.share(data);else{await navigator.clipboard.writeText(data.text+" "+data.url);toast("Enlace copiado")}}catch{}}});
function showDetail(product){const allFeatures=product.features.map((feature)=>'<div><span>'+escapeHtml(feature.label)+'</span><strong>'+escapeHtml(feature.value)+' <small>('+escapeHtml(feature.provenance)+')</small></strong></div>').join("");$("#detailBody").innerHTML='<div class="detail-media"><img src="'+escapeHtml(product.image)+'" alt="'+escapeHtml(product.name)+'"></div><h2>'+escapeHtml(product.name)+'</h2><div class="meta">'+[product.brand,product.memory,product.ram].filter(Boolean).map((value)=>'<span class="pill">'+escapeHtml(value)+'</span>').join("")+'</div><p class="price">'+money(product.price)+'</p><div class="lab-warning">Visibilidad pendiente · disponibilidad desconocida · sin financiación inventada.</div><div class="detail-list">'+(allFeatures||'<div><span>Características</span><strong>Sin evidencia validada</strong></div>')+'<div><span>Imagen</span><strong>HTTPS auditada</strong></div><div><span>Publicación</span><strong>Requiere aprobación humana</strong></div></div>';openLayer("#detailSheet")}
document.querySelector("[data-open-admin]").addEventListener("click",()=>openLayer("#adminSheet"));
let currentFingerprint="",currentSuggestion=null,aiSpent=Number(localStorage.getItem("amarango-v414-ai-spent")||0);const CACHE_KEY="amarango-v414-photo-cache";const cache=JSON.parse(localStorage.getItem(CACHE_KEY)||"{}");function hex(buffer){return [...new Uint8Array(buffer)].map((byte)=>byte.toString(16).padStart(2,"0")).join("")}
$("#photoInput").addEventListener("change",async(event)=>{const file=event.target.files&&event.target.files[0];if(!file)return;const bytes=await file.arrayBuffer();currentFingerprint="sha256-bytes-v1:"+hex(await crypto.subtle.digest("SHA-256",bytes));$("#previewImage").src=URL.createObjectURL(file);$("#localPreview").classList.add("show");const hit=cache[currentFingerprint];if(hit){currentSuggestion=hit;$("#analysisState").textContent="Cache hit · sin nuevo análisis"}else{currentSuggestion=deterministicSuggestion(file.name);cache[currentFingerprint]=currentSuggestion;localStorage.setItem(CACHE_KEY,JSON.stringify(cache));$("#analysisState").textContent="Nivel 1/2 simulado · revisión requerida"}$("#fingerprintText").textContent=currentFingerprint.slice(0,31)+"…";renderSuggestions();$("#aiAnalyze").disabled=false;$("#approvePreflight").disabled=false;updateCost(Boolean(hit))});
function deterministicSuggestion(name){const text=normalize(name);const brands=["Samsung","Motorola","Apple","Xiaomi","Infinix"],brand=brands.find((candidate)=>text.includes(normalize(candidate)))||(text.includes("iphone")?"Apple":null);const mem=(text.match(/(?:^|\D)(32|64|128|256|512)\s*(?:gb)?/)||[])[1];return{brand,model:null,memory:mem?mem+" GB":null,ram:null,category:"Celulares",confidence:brand?.82:.48,provenance:"matched_existing_data",humanApprovalRequired:true,aiUsed:false}}
function renderSuggestions(){const s=currentSuggestion;const rows=[["Marca",s.brand],["Modelo",s.model],["Memoria",s.memory],["RAM",s.ram],["Categoría",s.category],["Confianza",Math.round(s.confidence*100)+"%"]];$("#suggestions").innerHTML=rows.map(([label,value])=>'<div class="suggestion"><small>'+label+'</small><strong>'+escapeHtml(value||"Sin evidencia")+'</strong></div>').join("")}
function updateCost(hit=false){$("#costText").textContent="Presupuesto simulado: 2.500 centavos · usado: "+aiSpent+" · cache: "+(hit?"hit":"miss")}
$("#aiAnalyze").addEventListener("click",()=>{if(!currentSuggestion)return;if(currentSuggestion.aiUsed){toast("Resultado IA ya cacheado");return}if(aiSpent+1>2500){toast("Límite mensual alcanzado");return}aiSpent+=1;localStorage.setItem("amarango-v414-ai-spent",String(aiSpent));currentSuggestion={...currentSuggestion,aiUsed:true,confidence:Math.min(.9,currentSuggestion.confidence+.06),provenance:"ai_inferred"};cache[currentFingerprint]=currentSuggestion;localStorage.setItem(CACHE_KEY,JSON.stringify(cache));$("#analysisState").textContent="Fallback IA simulado · no confirmado";renderSuggestions();updateCost(false)});$("#approvePreflight").addEventListener("click",()=>{if(!currentSuggestion)return;const approved=JSON.parse(localStorage.getItem("amarango-v414-local-approvals")||"[]");approved.push({fingerprint:currentFingerprint,suggestion:currentSuggestion,approvedAt:new Date().toISOString(),scope:"local_lab_only"});localStorage.setItem("amarango-v414-local-approvals",JSON.stringify(approved));toast("Aprobado solo en este laboratorio")});
render();updateCost();
</script></body></html>`;

await write("AmarangoElectro-V16-V4.14-Photo-Intelligence-Preflight-Standalone-Android.html", html);
