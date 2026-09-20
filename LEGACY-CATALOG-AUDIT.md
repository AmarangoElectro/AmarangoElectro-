# Auditoría del catálogo legacy

## Resultado ejecutivo

La lógica útil se puede aislar, pero el ZIP no contiene datos reales suficientes para activar el piloto de 5–10 celulares. Se implementó el adaptador y las reglas puras; el catálogo demostrativo de V16 permanece activo para no consultar producción ni inventar registros.

## Inventario auditado

- `public/index.html`: aplicación monolítica de aproximadamente 724 KB con UI pública, búsqueda, catálogo, administración y escrituras.
- `src/worker.mjs`: endpoint público de caché de catálogo e imágenes, con métodos GET/HEAD.
- `src/proveedores-sync.mjs`: sincronización administrativa con cambios de precio, stock, categoría, imagen y visibilidad. No migrada.
- `supabase/migrations/20260824_fix_catalogo_timeout.sql`: triggers de protección de fotos y espejo incremental. No ejecutada.
- `public/tienda-compartir-producto.js`: Web Share + clipboard con listeners y decoración DOM.
- `public/admin-stable-actions.js`, `public/asesor-registrar-venta.js`: acciones internas y escrituras.
- archivos `margarita-*`, `margarita-ui*`, `amara.js`, Workers/IA: **PENDIENTE — NO MIGRAR TODAVÍA**.

## Mapa de lectura

| Fuente | Lectura comprobada | Observación |
|---|---|---|
| `tienda_catalogo` / `catalogo` | primero `actualizado`, luego `datos`; fallback `datos,actualizado` | al leer, legacy convierte `visible` ausente en `true` dentro de la copia local |
| `celulares_lista` / `lista` | `datos` y copia a almacenamiento local | se mezcla con el catálogo recién durante el render |
| `tienda_productos_incremental` | páginas por `version`, columnas `producto_id,datos,eliminado,version` | espejo del catálogo principal, no de celulares |
| `tienda-fotos` | URLs públicas y endpoint de imagen con allowlist de host/ruta | requiere revisar políticas de Storage antes de conectar |

## Mapa de escritura detectado

El legacy contiene `upsert`, `delete`, `PATCH`, upload con `upsert:true`, sincronización de proveedores, publicaciones administrativas y escrituras de historial/clientes. No se reutilizó ninguna de estas rutas.

El hallazgo de mayor severidad está en `tiendaPrepararBandejasAdmin()`:

1. se invoca desde el flujo de render administrativo;
2. repara IDs, grupos de duplicados, visibilidad y revisión de precios mutando `tiendaProductos`;
3. puede marcar productos con 30+ días como pendientes y `visible=false`;
4. si detecta cambios, guarda localmente y llama a publicación administrativa.

En consecuencia, **la aplicación legacy no debe ejecutarse como mecanismo de migración**. V16 no importa ese flujo.

## Regla pública comprobada

El catálogo principal usa conceptualmente:

```text
visible === true
AND eliminado !== true
AND sinStock !== true
AND estadoProveedor !== "sin_stock"
AND ocultoManualProveedor !== true
AND ocultoPorDuplicado !== true
AND stock informado > 0
```

Step 7 la reimplementa como `isLegacyCatalogProductPublic(product)`, añade el bloqueo defensivo `ocultoManualAdmin === true` y no modifica el objeto. `celulares_lista` usa `ocultoTienda !== true`, `sinStock !== true` y precio positivo.

## Fuentes canónicas y duplicados

| Pregunta | Resultado |
|---|---|
| ¿Qué productos siguen dependiendo de `celulares_lista`? | no determinable sin snapshot real; el código sigue cargando toda la fila `lista` |
| ¿Qué celulares ya están en `tienda_catalogo`? | no determinable sin datos |
| ¿Hay duplicados entre ambas fuentes? | no determinable; el adaptador reporta candidatos por marca + nombre y no oculta ninguno automáticamente |
| ¿Fuente canónica futura? | pendiente: `tienda_productos_incremental` solo espeja `tienda_catalogo`, mientras celulares continúa separado |

No se elige una fuente canónica por intuición. Para decidir se necesita un snapshot sanitizado de ambas filas con IDs, nombre, precio, visibilidad, stock e imagen.

## `tienda_productos_incremental`

La migración SQL confirma que un trigger `SECURITY DEFINER` descompone `tienda_catalogo.id = catalogo` en filas incrementales, actualiza solo JSON cambiados y crea tombstones para IDs ausentes. Es una buena candidata de lectura eficiente para el catálogo principal, pero:

- no cubre `celulares_lista`;
- depende de trigger, secuencia y permisos no auditados en vivo;
- no se conoce su RLS pública;
- no debe activarse ni modificarse en esta etapa.

Decisión: **REQUIERE AUDITORÍA** antes de usarla como fuente pública.

## Imágenes y Storage

- Bucket detectado: `tienda-fotos`.
- La migración protege `fotoManualProveedor` y adopta URLs históricas del bucket.
- El Worker existente acepta GET/HEAD, restringe host Supabase + ruta del bucket y aplica resize `contain`.
- La carga administrativa usa upload con `upsert:true`; queda excluida.
- El adaptador Step 7 solo acepta URLs `https:` y nunca descarga, sube o reemplaza imágenes.

## Buscador y filtros

Lógica útil rescatada conceptualmente:

- normalización Unicode, minúsculas y eliminación de acentos;
- todos los términos deben justificarse;
- los modelos numéricos deben coincidir exactamente (`A17` no trae `A16`);
- ranking por nombre, modelo, marca y términos relevantes;
- respuesta diferida en la UI.

No se copiaron sinónimos gigantes, mutaciones como `p._pj`, telemetría desde el render ni reconstrucción completa del HTML. La implementación V16 vive en `lib/catalog/search.ts` y es pura.

Filtros activos en Celulares: marca, búsqueda, favoritos locales y orden. El contrato prepara `subcategory`, `inStockOnly` y `maxPrice`, pero disponibilidad/precio máximo no se muestran hasta tener datos fiables.

## Ficha, relacionados y compartir

- La ficha legacy mezcla detalle, compra, cuotas, WhatsApp, edición, métricas simuladas y relacionados.
- `visitasProducto()` inventa visitas: **DESCARTAR**.
- relacionados elige al azar hasta cuatro productos de la misma categoría y no aplica toda la regla pública: **REESCRIBIR** más adelante de forma determinista.
- compartir individual aporta Web Share + fallback. Se reimplementó en `lib/commerce/share-product.ts` con URL `/producto/[slug]`.
- compartir imagen, Instagram, tienda completa y múltiples productos quedan pendientes.

## Datos reales del piloto

No se conectaron productos reales porque el ZIP no incluye las filas JSON y consultar producción está prohibido. El archivo de muestra de proveedor no contiene celulares y representa costos, no catálogo público; usarlo habría inventado precio/visibilidad.

Para habilitar el piloto se requiere una exportación sanitizada y de solo lectura con 5–10 celulares de ambas fuentes. El adaptador ya admite la forma `{ tiendaCatalogo, celularesLista }`, valida, normaliza, reporta rechazados/duplicados y produce `Product[]` sin escrituras.

## Riesgos abiertos

1. RLS/permisos de lectura reales no auditados.
2. Fuente canónica de celulares sin decidir.
3. IDs de `celulares_lista` no persistidos; el legacy usaba índices inestables.
4. Marca/modelo no son campos canónicos comprobados.
5. Datos comerciales de financiación sin responsable/fuente validada.
6. Políticas de `tienda-fotos` no recibidas.
7. La aplicación legacy mezcla render y publicación administrativa.
