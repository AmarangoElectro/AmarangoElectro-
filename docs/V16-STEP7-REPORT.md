# AmarangoElectro V16 Step 7 – Informe de entrega

## Resumen ejecutivo

**Antes:** Step 6 tenía una V16 visualmente aprobada, catálogo demostrativo, contrato Supabase GET-only y un método preparado para recibir la tienda actual.

**Ahora:** el ZIP legacy fue auditado sin ejecutarlo; se extrajeron contratos reales, se creó un adaptador aislado Legacy → Product, se reimplementaron visibilidad, búsqueda y compartir individual como lógica limpia y se completaron los mapas de catálogo, producto, administración y financiación.

**Por qué:** el legacy mezcla lectura, render, administración y escrituras. Copiar sus funciones habría trasladado el riesgo confirmado de cambiar visibilidad o publicar catálogo durante una vista administrativa.

**Cómo se comprobó:** lint limpio, build completo y 25/25 tests. Las pruebas congelan el input legacy para detectar mutaciones, rechazan ocultos/sin stock/imágenes inseguras, verifican que no exista API de escritura y cubren búsqueda y compartir.

## Base y límites

- Rama: `feat/amarango-v16-step7-legacy-catalog-pilot-20260827`.
- Base Step 6: commit `4395c00`.
- `main` y `origin/main`: no modificados.
- Producción: no publicada ni modificada.
- Supabase: no consultado ni modificado.
- Legacy: análisis estático; no se ejecutó la app.
- Margarita/IA/WhatsApp definitivo: fuera de alcance y sin modificaciones de integración.

## Auditoría legacy realizada

- fuentes `tienda_catalogo`, `celulares_lista`, `tienda_productos_incremental` y `tienda-fotos`;
- campos y estados de producto;
- buscador, filtros, ficha, relacionados y compartir;
- financiación, redondeos y configuración local;
- roles, acceso, asesores, administradores y operaciones internas;
- escrituras de catálogo, Storage, historial, clientes y proveedor;
- migración SQL recibida, solo leída.

## Hallazgos principales

1. `tienda_catalogo` y `celulares_lista` siguen siendo fuentes separadas.
2. El espejo incremental solo representa `tienda_catalogo`, no celulares.
3. El ZIP no incluye un snapshot real de ninguna de las dos filas.
4. `celulares_lista` carece de ID persistido comprobado; el legacy usa el índice.
5. La marca de celulares se deriva del nombre; no hay campo canónico de modelo comprobado.
6. La lectura legacy convierte `visible` ausente en `true` dentro de la copia local.
7. El render administrativo puede mutar y publicar IDs, visibilidad, duplicados y revisión de precios.
8. La sincronización de proveedor cambia precio, stock, categoría, imagen y visibilidad.
9. El buscador mezcla ranking con mutación temporal (`_pj`) y telemetría desde render.
10. Relacionados usa aleatoriedad y un filtro público incompleto.
11. Las visitas de producto son simuladas.
12. Roles/sesiones dependen de flags y credenciales en el cliente.
13. Financiación vive en `localStorage` y se repite en muchas funciones.

## Cambios implementados

- `LegacyCatalogAdapter` inyectable; no conoce red, Supabase o credenciales.
- normalizador con Zod para las dos fuentes legacy.
- IDs/slugs técnicos deterministas y aislados por fuente.
- regla pura de visibilidad/stock, sin mutar registros.
- exclusión fail-closed de registros sin identidad, categoría, marca o precio público verificable.
- imágenes limitadas a HTTPS.
- costo, proveedor y cantidad de stock no se exponen.
- financiación legacy deliberadamente vacía en V16.
- diagnósticos de rechazados y posibles duplicados, sin ocultamiento automático.
- buscador puro con acentos/case, ranking y modelos numéricos exactos.
- contrato preparado para subcategoría, disponibilidad y precio máximo.
- tarjetas preparadas para mostrar precio/estado cuando la fuente sea real.
- compartir individual centralizado con Web Share y clipboard.
- título/footer/preview identificados como Step 7.

## Qué no se activó

El storefront sigue usando `MockCatalogAdapter`. No se conectaron 5–10 celulares reales porque hacerlo requeriría consultar producción o inventar datos. El archivo de muestra del proveedor no contiene celulares ni precio público validado.

Esto es un bloqueo de evidencia, no un bloqueo técnico: el adaptador ya puede recibir el snapshot sanitizado.

## Bugs/riesgos encontrados y tratamiento

| Hallazgo | Severidad | Tratamiento Step 7 |
|---|---|---|
| mutación/publicación durante render admin | crítica | no migrado; documentado para reescritura |
| `visible=true` por defecto al leer | alta | V16 exige `visible === true`; no completa ausentes |
| fuentes de celulares separadas/duplicables | alta | diagnósticos; sin decisión automática |
| sync de proveedor con escrituras comerciales | crítica | excluido del storefront |
| IDs de celular por índice | alta | ID técnico determinista para piloto; canon pendiente |
| búsqueda acoplada a DOM/telemetría | media | reescrita como función pura |
| relacionados aleatorios/incompletos | media | no migrado; reescritura futura |
| visitas simuladas | alta comercial | descartado |
| auth/roles locales | crítica | no migrado; app admin separada |
| financiación editable en navegador | alta | solo documentada; V16 no inventa cuotas |
| sharing legacy con MutationObserver/listeners globales | media | reimplementado sin decoración DOM global |

## Pruebas

Resultado final:

- `npm run lint`: aprobado, 0 errores, 0 warnings.
- `npm test`: aprobado, build + 25/25 tests, 0 fallidas, 0 omitidas.
- build final: cinco fases completadas en aproximadamente 3,76 s acumulados (`988 ms + 267 ms + 922 ms + 1,16 s + 425 ms`).
- rutas verificadas por tests: Home, Celulares, filtro/búsqueda, ficha, producto inexistente.
- seguridad Step 7: ausencia de `insert`, `upsert`, `update`, `delete`, `rpc`, POST, PUT, PATCH y DELETE en la capa legacy pública.
- pureza: input legacy congelado antes de normalizar; no hubo mutación.
- visibilidad: ocultos y sin stock rechazados.
- datos: financiación no inventada, cantidad de proveedor no expuesta e imagen no HTTPS rechazada.
- duplicados: reportados y preservados para auditoría.
- búsqueda: mayúsculas/minúsculas, acentos, marca y modelo exacto.
- compartir: fallback probado y URL nueva `/producto/[slug]`.

Transparencia de pruebas: la primera corrida completa terminó 24/25 porque el test heredado de Step 6 exigía literalmente el encabezado “PENDIENTE DE AUDITORÍA” y la matriz nueva lo había acortado a “PENDIENTE”. Se restauró el encabezado contractual y la segunda corrida terminó 25/25. No hubo una falla funcional de la tienda.

## Performance

- código nuevo de catálogo/búsqueda/compartir: 19.291 bytes de fuente sin comprimir;
- chunk de catálogo construido: 40.943 bytes sin comprimir;
- helper de compartir construido: 1.642 bytes sin comprimir;
- CSS construido: 180.792 bytes sin comprimir;
- framework: 189.805 bytes, sin cambios de arquitectura visual;
- no se añadieron listeners globales, MutationObservers, SDK de Supabase ni dependencias nuevas;
- búsqueda continúa usando `useDeferredValue` y ranking sobre la lista ya filtrada;
- no se renderiza ni descarga catálogo real todavía.

No se inventan LCP/CLS/INP: requieren staging HTTPS y un Android real. No se publicó staging porque la regla del trabajo prohíbe tocar producción.

## Archivos agregados

- `LEGACY-PRODUCT-SCHEMA.md`
- `LEGACY-CATALOG-AUDIT.md`
- `LEGACY-ADMIN-MAP.md`
- `LEGACY-FINANCING-MAP.md`
- `docs/V16-STEP7-REPORT.md`
- `lib/catalog/legacy/legacy-normalizer.ts`
- `lib/catalog/legacy/legacy-catalog-adapter.ts`
- `lib/catalog/search.ts`
- `lib/commerce/share-product.ts`
- `tests/v16-step7-legacy.test.mjs`

## Archivos modificados

- `LEGACY-STORE-MIGRATION-PLAN.md`
- `README.md`
- `app/components/catalog-client.tsx`
- `app/components/product-actions.tsx`
- `app/components/product-card.tsx`
- `app/components/site-footer.tsx`
- `app/globals.css`
- `app/layout.tsx`
- `docs/MIGRATION-MATRIX.md`
- `lib/catalog/index.ts`
- `lib/catalog/mock-adapter.ts`
- `lib/catalog/types.ts`
- `package.json`
- `scripts/create-static-preview.mjs`
- `tests/rendered-html.test.mjs`

## Riesgos restantes y próximo paso

1. recibir snapshot sanitizado de 5–10 celulares de ambas fuentes;
2. producir reporte exacto de cobertura/duplicados y elegir fuente canónica;
3. recibir esquema/RLS/políticas de Storage sin secretos;
4. conectar un endpoint GET-only desde servidor/staging aislado;
5. medir Core Web Vitals en Android;
6. mantener Margarita, WhatsApp y administración fuera hasta sus fases específicas.
