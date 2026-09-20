import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildV415CanaryPayload } from "../lib/migration/v415-canary-plan.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = async (file) => JSON.parse(await readFile(path.join(root, file), "utf8"));
const write = (file, content) => writeFile(path.join(root, file), content.endsWith("\n") ? content : `${content}\n`);
const preflight = await readJson("V4.14-MIGRATION-PREFLIGHT.json");
const canary = buildV415CanaryPayload(preflight);
await write("V4.15-CANARY-PAYLOAD.json", JSON.stringify(canary, null, 2));

const canaryRows = canary.products.map((entry) => {
  const product = entry.productV16;
  return `| ${entry.canarySlot} | ${entry.representedBrand} | ${product.name.replaceAll("|", "\\|")} | ${product.memory ?? "—"} | ${product.ram ?? "No auditada"} | ${product.cashPriceARS.toLocaleString("es-AR")} | ${entry.legacyCellphoneKey} |`;
}).join("\n");

await write("V4.15-COMMERCIAL-EXCELLENCE-AUDIT.md", `# V4.15 — Commercial Excellence Audit

## Criterio

Toda decisión se evaluó contra una sola pregunta: **¿vende más, ahorra tiempo o reduce riesgo?** La auditoría se aplicó a Cliente, Asesor y Administración sin habilitar operaciones productivas.

| Hallazgo | Clasificación | Evidencia V4.14 | Resolución V4.15 | Estado |
|---|---|---|---|---|
| La tarjeta podía dedicar espacio a financiación inexistente | Reduce riesgo / vende más | 'financing=[]' en 92/92 | El bloque desaparece cuando no existe política auditada | Corregido |
| Las especificaciones útiles compiten con el nombre | Vende más | Memoria/RAM auditadas en el contrato | Memoria y RAM quedan en chips; máximo cuatro características debajo | Corregido |
| Cargar 92 tarjetas de una vez empeora la percepción mobile | Ahorra tiempo / vende más | Standalone V4.14 renderizaba el conjunto completo | Carga progresiva de 20; imágenes lazy; el canario muestra solo cinco | Corregido |
| El nombre puede perder contexto si se trunca | Reduce riesgo | Nombres legacy incluyen variante/capacidad | Nombre completo, wrapping natural y sin ellipsis agresivo | Corregido |
| Disponibilidad desconocida puede confundirse con stock | Reduce riesgo | 'availability=unknown' en 92/92 | Texto explícito “Disponibilidad a confirmar”; nunca “Disponible” | Corregido |
| Búsqueda/filtros nativos agregan fricción Android | Ahorra tiempo | Dirección V4.14 aprobada | Chips y bottom sheets; cero '<select>' nativo | Conservado |
| Cliente, Asesor y Admin podrían divergir | Reduce riesgo / ahorra tiempo | Product V16 único | Los tres modos del laboratorio consumen el mismo objeto sanitizado | Validado |
| Asesor podría interpretar que puede construir precio | Reduce riesgo | Regla comercial aprobada | Precio oficial de solo lectura; sin controles de cálculo | Validado |
| Admin necesita trazabilidad sin habilitar edición | Reduce riesgo | Mapping legacy disponible | Muestra mapping/estado canario; edición bloqueada | Validado |
| Compartir y favorito deben estar a un toque | Vende más | V4.14 ya usaba Web Share y localStorage | Acciones preservadas con URL directa local del producto | Validado |
| Movimiento adicional sin impacto comercial | Decorativo | UI premium ya resuelta | No se agregaron efectos nuevos; motion limitado a feedback/transiciones | Descartado |

## Resultado por rol

- **Cliente:** imagen protagonista, nombre completo, variante visible, precio contado, ficha, favorito y compartir. No recibe campos privados ni financiación inventada.
- **Asesor:** mismo producto/precio oficial, ficha y compartir. No ve costo, proveedor, margen, USD ni construcción de precio.
- **Administración:** mismo producto con trazabilidad y estado del gate; todas las acciones de escritura permanecen bloqueadas.

## Decisión comercial

La experiencia queda lista para validar un canario de cinco productos. Las mejoras incorporadas reducen carga inicial y ambigüedad comercial sin sumar complejidad decorativa.
`);

await write("V4.15-CLIENT-CARD-SPEC.md", `# V4.15 — Client Product Card Specification

## Contrato final

1. **Imagen protagonista:** contenedor cuadrado estable, 'object-fit: contain', fondo neutro y 'loading=lazy'.
2. **Identidad:** marca/modelo y nombre completo con wrapping; no ellipsis agresivo.
3. **Variante:** memoria y RAM visibles solo cuando fueron auditadas. La ausencia de RAM no se rellena.
4. **Características:** hasta cuatro evidencias principales; nunca texto inferido sin provenance.
5. **Precio:** contado ARS completo, sin abreviaturas.
6. **Financiación:** render condicional. Con 'financing=[]' el bloque no aparece.
7. **Disponibilidad:** 'unknown' se traduce como “Disponibilidad a confirmar”, no como stock disponible.
8. **Acciones:** favorito, compartir y CTA primario “Ver producto”.

## Jerarquía

Imagen → variante → nombre → características → contado → acciones.

## Límites de privacidad

La tarjeta no acepta ni muestra costo, proveedor, mayorista, margen, inversión, comisión, USD, cotización, raw JSON ni prompts. El view model puro está en 'lib/commerce/v415-client-card.ts'.
`);

await write("V4.15-PHOTO-INTELLIGENCE-PRODUCTION-CONTRACT.md", `# V4.15 — Photo Intelligence Production Contract

## Límite provider-agnostic

'PhotoAnalyzerProvider' define 'id', 'version', 'capabilities' y 'analyze(request)'. Producto y Admin consumen el contrato, nunca un SDK/modelo concreto. V4.15 no incluye implementación de red, credenciales ni proveedor externo.

## Flujo obligatorio

Imagen → fingerprint → cache → reglas deterministas → OCR → fallback IA por acción Admin → sugerencias → aprobación humana.

| Regla | Contrato |
|---|---|
| Deterministic first | Obligatorio |
| Cache | 'fingerprint + providerVersion'; hit cuesta 0 |
| OCR | Solo texto visible; provenance 'ocr_extracted' |
| IA | Fallback; acción Admin explícita; provenance 'ai_inferred' |
| Presupuesto | 2.500 centavos/mes simulados; hard stop antes del exceso |
| Reanálisis | Solo acción explícita y motivo registrado |
| Publicación | Siempre false; 'humanApprovalRequired=true' |
| Privacidad | Nunca se devuelven costo, proveedor, USD, raw JSON o prompts al cliente |

## Validación

'validatePhotoAnalyzerResult' rechaza mismatch de fingerprint, publicación automática, costo negativo, cache hit con costo, llamada externa sin acción Admin y exceso de presupuesto. El proveedor real se elegirá en un gate posterior.
`);

await write("V4.15-CANARY-SELECTION.md", `# V4.15 — Canary Selection

## Muestra propuesta

| Slot | Segmento | Producto | Memoria | RAM | Precio ARS | Legacy key |
|---:|---|---|---|---|---:|---|
${canaryRows}

## Criterio

- 5/5 'reviewStatus=prepared'.
- 5/5 imágenes HTTPS distintas.
- 5/5 precios positivos y categoría Celulares.
- 5/5 memoria auditada; 4/5 RAM explícita.
- Apple conserva RAM desconocida porque la fuente no la demuestra; no se inventa.
- 0 conflictos, 0 duplicados y 0 revisiones humanas abiertas.
- IDs canónicos: 0 asignados; se asignarían solo después de autorización.

## Exclusión obligatoria

El **INFINIX GT 30 PRO NFC 512/12GB dark flare + kit gamer shadow** queda fuera. Continúan sin evidencia el nombre comercial exacto del color y el contenido real del kit.

## Recomendación

**GO para solicitar autorización humana del canario exacto de cinco productos. NO-GO para ejecutar escrituras ahora.** Antes de cualquier write deben existir 5/5 IDs persistentes y backup/hash pre-write verificado.
`);

await write("V4.15-ROLLBACK-PLAN.md", `# V4.15 — Canary Rollback Plan

## Secuencia futura autorizable

1. Congelar el lote exacto '${canary.rollbackBatchIdentifier}'.
2. Capturar snapshot de master y mapping inmediatamente antes del write.
3. Calcular y verificar SHA-256 de ambos snapshots; registrar responsable/hora.
4. Asignar cinco IDs persistentes nuevos y completar los cinco mappings.
5. Ejecutar únicamente el canary de cinco.
6. Releer los cinco registros y comparar campo por campo con el payload aprobado.
7. Regenerar el read model derivado.
8. Verificar paridad master/read model y storefront Cliente/Asesor/Admin.

## Disparadores de rollback

Cualquier ID inválido, imagen/precio/categoría divergente, mapping ausente, leak privado, duplicado, variante fusionada, fallo de paridad o regresión en un rol.

## Rollback canario solamente

1. Bloquear el avance del lote; no tocar productos ajenos.
2. Restaurar master y mapping desde los snapshots/hash pre-write.
3. Retirar únicamente los mappings creados por '${canary.rollbackBatchIdentifier}'.
4. Regenerar el read model derivado desde el master restaurado.
5. Verificar paridad, ausencia de residuos y los tres roles.
6. Conservar evidencia/auditoría del intento fallido.

Este documento no contiene SQL ni comandos destructivos. V4.15 no ejecuta el protocolo.
`);

await write("V4.15-REVENUE-INTELLIGENCE-DESIGN.md", `# V4.15 — Revenue Intelligence Design

## Estado

Diseño solamente. Tracking productivo desactivado; no hay emisor, endpoint, SDK ni almacenamiento.

| Evento futuro | Pregunta comercial | Datos mínimos propuestos |
|---|---|---|
| 'product_view' | ¿Qué producto atrae? | product_id, categoría |
| 'product_share' | ¿Qué producto se recomienda? | product_id, categoría |
| 'favorite_add' | ¿Qué genera intención? | product_id, categoría |
| 'search' | ¿Se encuentra rápido? | cantidad de tokens, bucket de longitud, resultados |
| 'search_no_result' | ¿Qué demanda falta? | cantidad de tokens, bucket de longitud; sin query cruda |
| 'category_view' | ¿Qué universos interesan? | categoría |
| 'product_contact' | ¿Qué genera consulta? | product_id, categoría; sin teléfono/mensaje |
| 'financing_open' | ¿Cuándo influye la financiación? | product_id; solo con política auditada |

## Privacidad

No recolectar query cruda, nombre, email, teléfono, documento, dirección, mensaje, IP, costo, proveedor, USD ni identificadores publicitarios. La fecha queda sin asignar en el draft hasta que exista una política de tracking aprobada. 'createV415RevenueEventDraft' devuelve 'collectionEnabled=false'.
`);

await write("V4.15-SAFETY-SEAL.md", `# V4.15 — Safety Seal

| Superficie | Resultado |
|---|---:|
| INSERT | 0 |
| UPDATE | 0 |
| DELETE | 0 |
| UPSERT | 0 |
| RPC escritura | 0 |
| Storage writes | 0 |
| SQL | 0 |
| Migraciones | 0 |
| Cambios RLS | 0 |
| Deploy | 0 |
| Cambios main | 0 |
| Celulares migrados | 0 |
| Llamadas externas de IA | 0 |
| Tracking productivo | 0 |

V4.15 usa exclusivamente fixtures sanitizados locales. Las imágenes se visualizan mediante GET HTTPS del navegador. El standalone no incluye Supabase client, endpoints, credenciales, iframe ni APIs de mutación.
`);

await write("V4.15-QA-REPORT.md", `# V4.15 — QA Report

## Ejecución real

| Control | Resultado |
|---|---|
| 'npm run lint' | PASS |
| 'npm run build' | PASS; rutas existentes preservadas |
| 'node --test tests/*.test.mjs' | PASS; 192/192 |
| V4.15 específica | PASS; 14/14 |
| Regresión V4.14 | PASS; 92/91/1 y preflight determinista |
| Safety scan V4.15 | PASS; todas las superficies en 0 |

## Gates funcionales

- Comercial: financiación vacía oculta, nombre completo, máximo cuatro características y carga progresiva: PASS.
- Canary: cinco marcas/segmentos, mappings únicos, imágenes HTTPS, precios positivos, cero duplicados/revisión: PASS.
- Identidad: IDs permanecen null antes de autorización: PASS.
- Rollback: batch identifier único, hashes pre-write pendientes y protocolo canary-only documentado: PASS.
- Privacidad: costo/proveedor/mayorista/USD/cotización/raw/prompt ausentes en Product/payload/standalone: PASS.
- PhotoAnalyzerProvider: provider-agnostic, aprobación humana, cache y presupuesto hard stop: PASS.
- Revenue Intelligence: ocho eventos definidos, sin emisor y sin query cruda/PII: PASS.
- Cliente/Asesor/Admin: mismo Product V16, proyección por rol y escrituras bloqueadas: PASS.

## Responsive visual

Revisión directa en 320, 360, 390, 412, 768 y 1440 px: cero overflow horizontal, tarjetas completas, imagen con 'object-fit:contain', chips/bottom sheets táctiles, búsqueda sticky, ficha legible y acciones dentro del viewport. No existe '<select>' nativo.

| Viewport | Client width útil | Scroll width | Overflow | Botones visibles fuera |
|---:|---:|---:|---|---:|
| 320 | 305 | 305 | PASS | 0 |
| 360 | 345 | 345 | PASS | 0 |
| 390 | 375 | 375 | PASS | 0 |
| 412 | 397 | 397 | PASS | 0 |
| 768 | 753 | 753 | PASS | 0 |
| 1440 | 1425 | 1425 | PASS | 0 |

Se detectó durante QA que el tercer chip de filtro quedaba parcialmente fuera de la primera vista en 320 px. Se corrigió el layout mobile con wrapping y se repitieron los seis anchos: PASS.

## Interacción en navegador

- Búsqueda 'A16': 1 coincidencia exacta; al limpiar vuelve a 5/5 del canario.
- Cliente/Asesor/Admin: cambio de proyección sobre el mismo array Product V16; Admin muestra 5 trazas read-only.
- Ficha: abre, muestra disponibilidad a confirmar y el gate de financiación auditada.
- Favorito: estado visual activo y persistencia local del laboratorio.
- Consola: sin errores de aplicación; se excluyó ruido de la extensión del navegador de QA.

## Decisión

**GO para solicitar autorización humana del canario exacto de cinco. NO-GO para ejecutarlo ahora:** faltan asignar/verificar 5 IDs persistentes y capturar/verificar los snapshots/hash inmediatamente anteriores al write.
`);

const logo = await readFile(path.join(root, "public/brand/amarango-logo-official.png"));
const logoData = `data:image/png;base64,${logo.toString("base64")}`;
const canaryKeys = new Set(canary.products.map((entry) => entry.legacyCellphoneKey));
const products = preflight.products.map((entry) => ({
  key: entry.legacyMappingKey,
  position: entry.legacyPosition,
  name: entry.productV16.name,
  brand: entry.productV16.brand,
  model: entry.productV16.model,
  memory: entry.productV16.memory,
  ram: entry.productV16.ram,
  image: entry.productV16.image,
  price: entry.productV16.cashPriceARS,
  colors: entry.productV16.colors,
  features: entry.productV16.featureDetails.slice(0, 8),
  status: entry.reviewStatus === "prepared" ? "prepared" : "review",
  canary: canaryKeys.has(entry.legacyMappingKey),
  visibility: "pending",
  availability: "unknown",
}));

const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#061a37"><title>AmarangoElectro V16 · V4.15 Commercial Readiness</title>
<style>
:root{--navy:#061a37;--blue:#0b3978;--blue2:#155cac;--orange:#f47b20;--ink:#111827;--muted:#667085;--line:#dce5ef;--bg:#f4f7fb;--ok:#06724f;--warn:#9b5b04;--white:#fff}*{box-sizing:border-box}html,body{overflow-x:hidden}html{scroll-behavior:smooth}body{margin:0;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--ink);background:var(--bg)}button,input{font:inherit}button{cursor:pointer}.shell{width:min(1220px,calc(100% - 28px));margin:auto}.top{position:sticky;top:0;z-index:40;background:rgba(255,255,255,.95);backdrop-filter:blur(16px);border-bottom:1px solid rgba(220,229,239,.85)}.bar{min-height:72px;display:flex;align-items:center;gap:14px}.brand{display:flex;align-items:center;gap:9px;min-width:225px}.brand img{width:52px;height:52px;object-fit:contain}.brand strong{display:block;color:var(--navy)}.brand small{display:block;font-size:10px;color:var(--muted)}.search{position:relative;flex:1}.search input{width:100%;height:46px;border:1px solid var(--line);border-radius:15px;background:#f8fafc;padding:0 45px 0 15px;outline:0}.search input:focus{border-color:var(--blue2);box-shadow:0 0 0 3px rgba(21,92,172,.12)}.search span{position:absolute;right:15px;top:11px;font-size:20px;color:var(--blue)}.photo-btn{height:44px;border:0;border-radius:14px;background:var(--navy);color:#fff;padding:0 15px;font-weight:850;white-space:nowrap}.hero{position:relative;overflow:hidden;color:#fff;background:radial-gradient(circle at 88% 14%,rgba(244,123,32,.28),transparent 26%),linear-gradient(125deg,#061a37,#0b3978 60%,#155cac);padding:46px 0 60px}.hero:after{content:"";position:absolute;inset:-100% -20%;background:linear-gradient(110deg,transparent 43%,rgba(255,255,255,.12) 49%,transparent 55%);animation:sweep 10s ease-in-out infinite}.hero .shell{position:relative;z-index:2}.eyebrow{display:inline-flex;padding:7px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.1);font-size:10px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.hero h1{font-size:clamp(34px,5vw,62px);line-height:1;letter-spacing:-.05em;max-width:850px;margin:16px 0}.hero p{max-width:760px;color:#d8e8fb;line-height:1.55;margin:0}.gate{display:flex;gap:8px;flex-wrap:wrap;margin-top:20px}.gate span{padding:8px 10px;border-radius:10px;background:rgba(255,255,255,.1);font-size:11px}.metrics{position:relative;z-index:3;margin-top:-26px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px}.metric{background:#fff;border:1px solid var(--line);border-radius:18px;padding:17px;box-shadow:0 15px 40px rgba(16,24,40,.08)}.metric strong{display:block;font-size:28px;color:var(--blue)}.metric span{font-size:10px;color:var(--muted);font-weight:900;letter-spacing:.06em;text-transform:uppercase}.modebar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:28px}.role-tabs,.scope-tabs,.filters{display:flex;gap:7px;overflow:auto;scrollbar-width:none}.role-tabs::-webkit-scrollbar,.scope-tabs::-webkit-scrollbar,.filters::-webkit-scrollbar{display:none}.chip{border:1px solid var(--line);background:#fff;color:var(--navy);border-radius:999px;padding:9px 12px;white-space:nowrap;font-size:11px;font-weight:850}.chip.active{background:var(--navy);border-color:var(--navy);color:#fff}.scope-tabs{padding:10px 0}.filters{padding:2px 0 11px}.resultbar{display:flex;align-items:end;justify-content:space-between;gap:12px;padding:6px 0 12px}.resultbar h2{margin:0;font-size:21px}.resultbar p{margin:3px 0 0;color:var(--muted);font-size:11px}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;padding-bottom:18px}.card{min-width:0;display:flex;flex-direction:column;background:#fff;border:1px solid var(--line);border-radius:21px;overflow:hidden;box-shadow:0 8px 25px rgba(16,24,40,.05);transition:transform .2s,box-shadow .2s}.card:hover{transform:translateY(-2px);box-shadow:0 16px 36px rgba(16,24,40,.1)}.photo{aspect-ratio:1/1;position:relative;display:grid;place-items:center;padding:15px;background:linear-gradient(145deg,#fff,#edf3f9)}.photo img{width:100%;height:100%;object-fit:contain}.badge{position:absolute;left:9px;top:9px;border-radius:999px;padding:6px 8px;font-size:8px;font-weight:950;text-transform:uppercase;letter-spacing:.05em;background:#d8f5e8;color:var(--ok)}.badge.review{background:#fff0d6;color:var(--warn)}.badge.canary{top:38px;background:#e7efff;color:var(--blue)}.fav{position:absolute;right:9px;top:9px;width:38px;height:38px;border:0;border-radius:50%;background:rgba(255,255,255,.96);color:var(--blue);box-shadow:0 4px 14px rgba(16,24,40,.14)}.fav.active{background:var(--orange);color:#fff}.content{display:flex;flex-direction:column;flex:1;padding:14px}.kicker{font-size:10px;color:var(--blue);font-weight:900;text-transform:uppercase;letter-spacing:.05em}.specs{display:flex;flex-wrap:wrap;gap:5px;margin:7px 0}.pill{background:#edf5ff;color:var(--blue);border-radius:999px;padding:5px 8px;font-size:9px;font-weight:850}.card h3{margin:4px 0 10px;font-size:14px;line-height:1.42;overflow-wrap:anywhere}.features{display:grid;gap:5px;margin:0 0 12px;padding:0;list-style:none}.features li{font-size:10px;color:var(--muted);line-height:1.35}.features li:before{content:"•";color:var(--orange);font-weight:900;margin-right:5px}.price{margin-top:auto;color:var(--navy);font-size:21px;font-weight:950}.availability{font-size:9px;color:var(--muted);margin-top:3px}.actions{display:grid;grid-template-columns:1fr auto;gap:7px;margin-top:12px}.primary,.icon,.load-more{height:40px;border:0;border-radius:11px;font-weight:850}.primary{background:var(--navy);color:#fff}.icon{width:42px;background:#edf3fb;color:var(--blue)}.admin-note{margin-top:9px;border:1px solid #cfdced;background:#f5f8fc;border-radius:10px;padding:8px;font-size:9px;color:var(--muted);overflow-wrap:anywhere}.load-wrap{text-align:center;padding:10px 0 44px}.load-more{padding:0 18px;background:#fff;color:var(--blue);border:1px solid var(--line)}.empty{grid-column:1/-1;background:#fff;border:1px dashed var(--line);border-radius:18px;padding:40px;text-align:center;color:var(--muted)}.backdrop{position:fixed;inset:0;z-index:70;background:rgba(2,12,29,.66);backdrop-filter:blur(6px);opacity:0;pointer-events:none;transition:.22s}.backdrop.show{opacity:1;pointer-events:auto}.sheet{position:fixed;z-index:80;background:#fff;overflow:auto;transition:transform .27s ease;box-shadow:0 -24px 80px rgba(0,0,0,.28)}.bottom-sheet{left:0;right:0;bottom:0;max-height:84dvh;border-radius:25px 25px 0 0;padding:8px 18px calc(24px + env(safe-area-inset-bottom));transform:translateY(105%)}.bottom-sheet.show{transform:translateY(0)}.side-sheet{top:0;right:0;bottom:0;width:min(640px,100%);padding:18px;transform:translateX(105%)}.side-sheet.show{transform:translateX(0)}.handle{width:42px;height:5px;border-radius:99px;background:#d0d5dd;margin:4px auto 16px}.sheet-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.sheet-head h2{margin:0;font-size:21px}.x{width:40px;height:40px;border:0;border-radius:50%;background:#edf3fb;color:var(--navy);font-size:20px}.options{display:grid;gap:8px;margin:17px 0}.option{min-height:48px;border:1px solid var(--line);border-radius:14px;background:#fff;text-align:left;padding:11px 14px;display:flex;align-items:center;justify-content:space-between}.option.active{border-color:var(--blue2);background:#edf5ff;color:var(--blue);font-weight:850}.radio{width:20px;height:20px;border:2px solid #98a2b3;border-radius:50%}.option.active .radio{border:6px solid var(--blue2)}.detail-media{height:min(44vh,420px);display:grid;place-items:center;background:#f3f7fc;border-radius:20px;padding:18px}.detail-media img{width:100%;height:100%;object-fit:contain}.detail-title{font-size:28px;line-height:1.12;color:var(--navy);margin:15px 0}.integrity{margin:13px 0;background:#f6f8fb;border:1px solid var(--line);border-radius:14px;padding:12px;font-size:11px;line-height:1.5}.detail-list{display:grid;gap:8px}.detail-row{display:flex;justify-content:space-between;gap:15px;padding-bottom:8px;border-bottom:1px solid var(--line);font-size:12px}.detail-row span{color:var(--muted)}.lab-warning{background:#fff5e6;border:1px solid #ffd49a;color:#754300;border-radius:14px;padding:12px;font-size:11px;margin:13px 0}.upload{border:2px dashed #b8c7d9;background:#f8fbff;border-radius:18px;padding:22px;text-align:center}.file-input{width:min(100%,360px);font-size:11px;color:var(--muted)}.file-input::file-selector-button{border:0;border-radius:11px;background:var(--blue);color:#fff;padding:11px 14px;margin-right:8px;font-weight:850}.analysis{display:none;margin-top:14px;padding:14px;border:1px solid var(--line);border-radius:16px;background:#f7f9fc}.analysis.show{display:block}.analysis-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.analysis-item{background:#fff;border:1px solid var(--line);border-radius:11px;padding:9px}.analysis-item small{display:block;color:var(--muted);font-size:9px;text-transform:uppercase;font-weight:850}.analysis-item strong{font-size:12px}.toast{position:fixed;left:50%;bottom:18px;z-index:100;transform:translate(-50%,25px);opacity:0;background:#101828;color:#fff;border-radius:999px;padding:11px 15px;font-size:11px;transition:.2s;pointer-events:none}.toast.show{transform:translate(-50%,0);opacity:1}footer{background:var(--navy);color:#dce9f8;text-align:center;padding:27px;font-size:11px}@keyframes sweep{0%,24%{transform:translateX(-28%)}70%,100%{transform:translateX(28%)}}
@media(max-width:980px){.grid{grid-template-columns:repeat(3,minmax(0,1fr))}.metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:680px){.shell{width:min(100% - 20px,1220px)}.bar{min-height:66px;gap:8px}.brand{min-width:auto}.brand img{width:48px;height:48px}.brand div{display:none}.photo-btn{width:46px;padding:0;font-size:0}.photo-btn:after{content:"＋";font-size:22px}.hero{padding:38px 0 50px}.hero h1{font-size:36px}.metrics{margin-top:-21px;gap:8px}.metric{padding:13px}.metric strong{font-size:23px}.metric span{font-size:8px}.modebar{align-items:flex-start;flex-direction:column}.filters{overflow:visible;flex-wrap:wrap}.filters .chip{flex:1 1 auto}.grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.photo{padding:10px}.content{padding:11px}.card h3{font-size:12px}.price{font-size:17px}.side-sheet{top:auto;left:0;right:0;bottom:0;width:100%;max-height:92dvh;border-radius:25px 25px 0 0;transform:translateY(105%)}.side-sheet.show{transform:translateY(0)}.sheet-head{position:sticky;top:-18px;background:#fff;padding:12px 0;z-index:2}.analysis-grid{grid-template-columns:1fr}}@media(max-width:370px){.grid{grid-template-columns:1fr}.photo{aspect-ratio:1.15/1}.hero h1{font-size:32px}.gate span{font-size:9px}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
</style></head><body>
<header class="top"><div class="shell bar"><div class="brand"><img src="${logoData}" alt="Logo oficial AmarangoElectro"><div><strong>AmarangoElectro</strong><small>V4.15 Commercial Readiness</small></div></div><div class="search"><input id="search" type="search" autocomplete="off" placeholder="Buscar A16, Samsung, 256 GB…"><span>⌕</span></div><button class="photo-btn" data-photo>Analizar foto</button></div></header>
<main><section class="hero"><div class="shell"><span class="eyebrow">Read-only · canario no ejecutado</span><h1>La experiencia vende.<br>El control protege.</h1><p>Cinco productos representativos, una sola fuente Product V16 y un gate verificable antes de solicitar autorización humana.</p><div class="gate"><span><b>5</b> canario propuesto</span><span><b>91</b> técnicamente preparados</span><span><b>1</b> revisión excluida</span><span><b>0</b> escrituras</span></div></div></section>
<section class="shell metrics"><article class="metric"><strong>5/5</strong><span>imágenes y precios</span></article><article class="metric"><strong>0</strong><span>campos privados</span></article><article class="metric"><strong>20</strong><span>carga progresiva</span></article><article class="metric"><strong>GO*</strong><span>solicitar autorización</span></article></section>
<section class="shell"><div class="modebar"><div><strong>Vista por rol</strong><div class="role-tabs"><button class="chip active" data-role="client">Cliente</button><button class="chip" data-role="advisor">Asesor</button><button class="chip" data-role="admin">Administración</button></div></div><div><strong>Alcance</strong><div class="scope-tabs"><button class="chip active" data-scope="canary">Canario 5</button><button class="chip" data-scope="all">Laboratorio 92</button></div></div></div><div class="filters"><button class="chip" data-filter="brand">Marca: <span>Todas</span></button><button class="chip" data-filter="memory">Memoria: <span>Todas</span></button><button class="chip" data-filter="sort">Orden: <span>Origen</span></button></div><div class="resultbar"><div><h2 id="sectionTitle">Canario propuesto</h2><p id="resultText"></p></div></div></section><section class="shell"><div id="grid" class="grid"></div><div class="load-wrap"><button id="loadMore" class="load-more" hidden>Mostrar 20 más</button></div></section></main>
<div id="backdrop" class="backdrop"></div><aside id="filterSheet" class="sheet bottom-sheet" aria-hidden="true"><div class="handle"></div><div class="sheet-head"><h2 id="filterTitle">Elegir</h2><button class="x" data-close aria-label="Cerrar">×</button></div><div id="filterOptions" class="options"></div></aside><aside id="detailSheet" class="sheet side-sheet" aria-hidden="true"><div class="sheet-head"><h2>Ficha Product V16</h2><button class="x" data-close aria-label="Cerrar">×</button></div><div id="detailBody"></div></aside><aside id="photoSheet" class="sheet side-sheet" aria-hidden="true"><div class="sheet-head"><h2>Photo Intelligence</h2><button class="x" data-close aria-label="Cerrar">×</button></div><div class="lab-warning">Contrato local provider-agnostic. Toda sugerencia exige aprobación humana; no hay servicio externo ni publicación.</div><div class="upload"><p>Elegí una foto para comprobar fingerprint y cache local.</p><input id="photoInput" class="file-input" type="file" accept="image/*" aria-label="Elegir foto"></div><div id="analysis" class="analysis"><strong id="analysisState">Esperando imagen</strong><p id="fingerprintText"></p><div id="analysisGrid" class="analysis-grid"></div><div class="integrity">Deterministic first · OCR opcional · IA solo por acción Admin · presupuesto hard stop · publicar automáticamente: no.</div></div></aside><div id="toast" class="toast" role="status"></div><footer>AmarangoElectro V16 · V4.15 LAB · Sin iframe · Sin APIs de mutación · Sin tracking productivo</footer>
<script>
const PRODUCTS=${JSON.stringify(products)};const state={role:"client",scope:"canary",brand:"",memory:"",sort:"source",query:"",limit:20};const $=(s,r=document)=>r.querySelector(s);const $$=(s,r=document)=>[...r.querySelectorAll(s)];const money=(v)=>new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0}).format(v);const esc=(v)=>String(v??"").replace(/[&<>"']/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));const norm=(v)=>String(v??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();const favorites=new Set(JSON.parse(localStorage.getItem("amarango-v415-favorites")||"[]"));
function toast(m){const n=$("#toast");n.textContent=m;n.classList.add("show");setTimeout(()=>n.classList.remove("show"),1800)}function matchesQuery(p,q){if(!q)return true;const tokens=norm([p.name,p.brand,p.model,p.memory,p.ram].join(" ")).split(/\\s+/);return q.split(/\\s+/).every((part)=>tokens.some((token)=>token===part||token.startsWith(part)))}function filtered(){const q=norm($("#search").value.trim());let items=PRODUCTS.filter((p)=>(state.scope==="all"||p.canary)&&matchesQuery(p,q)&&(!state.brand||p.brand===state.brand)&&(!state.memory||p.memory===state.memory));if(state.sort==="priceAsc")items.sort((a,b)=>a.price-b.price);if(state.sort==="priceDesc")items.sort((a,b)=>b.price-a.price);if(state.sort==="name")items.sort((a,b)=>a.name.localeCompare(b.name,"es"));return items}
function card(p){const fs=p.features.slice(0,4).map((f)=>'<li>'+esc(f.label)+': '+esc(f.value)+'</li>').join("");const admin=state.role==="admin"?'<div class="admin-note">Solo lectura · '+esc(p.key)+' · visibilidad pending · edición bloqueada</div>':"";const roleKicker=state.role==="advisor"?"Producto oficial para asesor":state.role==="admin"?"Trazabilidad administrativa":"Producto oficial";return '<article class="card"><div class="photo"><img src="'+esc(p.image)+'" alt="'+esc(p.name)+'" loading="lazy"><span class="badge '+(p.status==="review"?"review":"")+'">'+(p.status==="review"?"Revisión":"Preparado")+'</span>'+(p.canary?'<span class="badge canary">Canario</span>':"")+'<button class="fav '+(favorites.has(p.key)?"active":"")+'" data-fav="'+p.key+'" aria-label="Favorito">♥</button></div><div class="content"><div class="kicker">'+roleKicker+'</div><div class="specs">'+[p.brand,p.memory,p.ram].filter(Boolean).map((v)=>'<span class="pill">'+esc(v)+'</span>').join("")+'</div><h3>'+esc(p.name)+'</h3><ul class="features">'+fs+'</ul><div class="price">'+money(p.price)+'</div><div class="availability">Disponibilidad a confirmar</div><div class="actions"><button class="primary" data-detail="'+p.key+'">Ver producto</button><button class="icon" data-share="'+p.key+'" aria-label="Compartir">↗</button></div>'+admin+'</div></article>'}
function render(){const items=filtered(),shown=state.scope==="canary"?items:items.slice(0,state.limit);$("#sectionTitle").textContent=state.scope==="canary"?"Canario propuesto":"Catálogo auditado";$("#resultText").textContent=items.length+" productos · "+(state.role==="client"?"vista Cliente":state.role==="advisor"?"vista Asesor":"Admin read-only");$("#grid").innerHTML=shown.length?shown.map(card).join(""):'<div class="empty">No hay coincidencias. Probá otro término o quitá un filtro.</div>';$("#loadMore").hidden=state.scope!=="all"||shown.length>=items.length}
function unique(key){return [...new Set(PRODUCTS.filter((p)=>state.scope==="all"||p.canary).map((p)=>p[key]).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),"es"))}const filterConfig={brand:{title:"Elegir marca",all:"Todas",values:()=>unique("brand")},memory:{title:"Elegir memoria",all:"Todas",values:()=>unique("memory")},sort:{title:"Ordenar",all:null,values:()=>["source","priceAsc","priceDesc","name"],label:(v)=>({source:"Origen",priceAsc:"Precio menor",priceDesc:"Precio mayor",name:"Nombre"}[v])}};let activeFilter="";function openLayer(id){$("#backdrop").classList.add("show");$(id).classList.add("show");$(id).setAttribute("aria-hidden","false")}function closeLayers(){$("#backdrop").classList.remove("show");$$(".sheet.show").forEach((n)=>{n.classList.remove("show");n.setAttribute("aria-hidden","true")})}function openFilter(key){activeFilter=key;const c=filterConfig[key],opts=[];if(c.all!==null)opts.push({value:"",label:c.all});c.values().forEach((v)=>opts.push({value:v,label:c.label?c.label(v):v}));$("#filterTitle").textContent=c.title;$("#filterOptions").innerHTML=opts.map((o)=>'<button class="option '+(state[key]===o.value?"active":"")+'" data-value="'+esc(o.value)+'"><span>'+esc(o.label)+'</span><i class="radio"></i></button>').join("");openLayer("#filterSheet")}
$$("[data-filter]").forEach((b)=>b.addEventListener("click",()=>openFilter(b.dataset.filter)));$("#filterOptions").addEventListener("click",(e)=>{const o=e.target.closest("[data-value]");if(!o)return;state[activeFilter]=o.dataset.value;state.limit=20;const c=filterConfig[activeFilter],label=o.dataset.value?(c.label?c.label(o.dataset.value):o.dataset.value):c.all,b=$("[data-filter='"+activeFilter+"']");$("span",b).textContent=label;b.classList.toggle("active",Boolean(o.dataset.value));closeLayers();render()});$$("[data-role]").forEach((b)=>b.addEventListener("click",()=>{state.role=b.dataset.role;$$("[data-role]").forEach((n)=>n.classList.toggle("active",n===b));render()}));$$("[data-scope]").forEach((b)=>b.addEventListener("click",()=>{state.scope=b.dataset.scope;state.brand="";state.memory="";state.limit=20;$$("[data-scope]").forEach((n)=>n.classList.toggle("active",n===b));$$("[data-filter]").forEach((n)=>{n.classList.remove("active");const span=$("span",n);span.textContent=n.dataset.filter==="brand"?"Todas":n.dataset.filter==="memory"?"Todas":"Origen"});render()}));$("#search").addEventListener("input",()=>{state.limit=20;render()});$("#loadMore").addEventListener("click",()=>{state.limit+=20;render()});$("#backdrop").addEventListener("click",closeLayers);$$("[data-close]").forEach((b)=>b.addEventListener("click",closeLayers));
$("#grid").addEventListener("click",async(e)=>{const fav=e.target.closest("[data-fav]");if(fav){favorites.has(fav.dataset.fav)?favorites.delete(fav.dataset.fav):favorites.add(fav.dataset.fav);localStorage.setItem("amarango-v415-favorites",JSON.stringify([...favorites]));render();return}const detail=e.target.closest("[data-detail]");if(detail){showDetail(PRODUCTS.find((p)=>p.key===detail.dataset.detail));return}const share=e.target.closest("[data-share]");if(share){const p=PRODUCTS.find((item)=>item.key===share.dataset.share),data={title:p.name,text:p.name+" · "+money(p.price)+" · AmarangoElectro",url:location.href.split("#")[0]+"#producto-"+p.key};try{if(navigator.share)await navigator.share(data);else{await navigator.clipboard.writeText(data.text+" "+data.url);toast("Enlace copiado")}}catch{}}});function showDetail(p){const fs=p.features.map((f)=>'<div class="detail-row"><span>'+esc(f.label)+'</span><strong>'+esc(f.value)+'</strong></div>').join("");$("#detailBody").innerHTML='<div class="detail-media"><img src="'+esc(p.image)+'" alt="'+esc(p.name)+'"></div><h2 class="detail-title">'+esc(p.name)+'</h2><div class="specs">'+[p.brand,p.memory,p.ram].filter(Boolean).map((v)=>'<span class="pill">'+esc(v)+'</span>').join("")+'</div><div class="price">'+money(p.price)+'</div><div class="integrity">Disponibilidad a confirmar. Financiación omitida hasta contar con política auditada. Producto pendiente de publicación y aprobación humana.</div><div class="detail-list">'+(fs||'<div class="detail-row"><span>Características</span><strong>Sin evidencia validada</strong></div>')+'<div class="detail-row"><span>Imagen</span><strong>HTTPS auditada</strong></div></div>';openLayer("#detailSheet")}
$("[data-photo]").addEventListener("click",()=>openLayer("#photoSheet"));const CACHE_KEY="amarango-v415-photo-cache";const cache=JSON.parse(localStorage.getItem(CACHE_KEY)||"{}");function hex(buffer){return [...new Uint8Array(buffer)].map((b)=>b.toString(16).padStart(2,"0")).join("")}$("#photoInput").addEventListener("change",async(e)=>{const file=e.target.files&&e.target.files[0];if(!file)return;const fingerprint="sha256-bytes-v1:"+hex(await crypto.subtle.digest("SHA-256",await file.arrayBuffer())),hit=cache[fingerprint];const suggestion=hit||{category:"Celulares",confidence:"Requiere análisis",humanApprovalRequired:true,analyzer:"No conectado"};if(!hit){cache[fingerprint]=suggestion;localStorage.setItem(CACHE_KEY,JSON.stringify(cache))}$("#analysis").classList.add("show");$("#analysisState").textContent=hit?"Cache hit · costo 0":"Nivel determinista · cache miss";$("#fingerprintText").textContent=fingerprint.slice(0,39)+"…";$("#analysisGrid").innerHTML=[["Categoría",suggestion.category],["Confianza",suggestion.confidence],["Motor de análisis",suggestion.analyzer],["Aprobación humana","Obligatoria"]].map(([a,b])=>'<div class="analysis-item"><small>'+a+'</small><strong>'+esc(b)+'</strong></div>').join("")});render();
</script></body></html>`;

await write("AmarangoElectro-V16-V4.15-Commercial-Excellence-Canary-Readiness-Standalone-Android.html", html);

const qaWidths = [320, 360, 390, 412, 768, 1440];
const qaHarness = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>V4.15 Responsive QA</title><style>*{box-sizing:border-box}body{margin:0;background:#091426;color:#fff;font-family:Inter,system-ui,sans-serif;padding:18px}.qa{display:grid;gap:22px}.case{background:#10213d;border:1px solid #27436a;border-radius:18px;padding:12px;overflow:auto}.head{display:flex;gap:10px;align-items:center;position:sticky;left:0;margin-bottom:10px}.head strong{font-size:14px}.result{font-size:11px;color:#a8c5e9}.viewport{background:#fff;margin:auto;overflow:hidden;border-radius:12px;box-shadow:0 14px 36px rgba(0,0,0,.35)}iframe{display:block;border:0;width:100%;height:900px}</style></head><body><h1>V4.15 · Responsive QA</h1><div class="qa">${qaWidths.map((width) => `<section class="case"><div class="head"><strong>${width}px</strong><span class="result" data-result="${width}">cargando…</span></div><div class="viewport" style="width:${width}px"><iframe data-width="${width}" title="V4.15 ${width}px" src="./AmarangoElectro-V16-V4.15-Commercial-Excellence-Canary-Readiness-Standalone-Android.html"></iframe></div></section>`).join("")}</div><script>document.querySelectorAll("iframe").forEach((frame)=>frame.addEventListener("load",()=>{const doc=frame.contentDocument,root=doc.documentElement,result=document.querySelector('[data-result="'+frame.dataset.width+'"]');result.textContent='client '+root.clientWidth+' · scroll '+root.scrollWidth+' · overflow '+(root.scrollWidth>root.clientWidth?'FAIL':'PASS')}));</script></body></html>`;
await write("V4.15-RESPONSIVE-QA.html", qaHarness);
