# V16 — FULL CATALOG AUDIT — 2026-09-20

Branch auditada: `agent/chatgpt-v16`

Fuente viva revisada en modo read-only:
`public.tienda_productos_incremental`

## 1. Cobertura del catálogo público

- Filas LIVE visibles + con precio: **553**
- Filas incluidas en los 8 snapshots sanitizados V16: **553**
- IDs únicos en snapshots: **553**
- LIVE faltantes en snapshots: **0**
- Snapshots que ya no existen en LIVE visible + precio: **0**
- Diferencias de contenido contra LIVE: **1 técnica**, no comercial:
  - `DELHI ESTUFA CUARZO DL-1200w` tiene una imagen `data:image...` en origen; el snapshot la deja en `null` de forma intencional por no ser URL HTTPS reutilizable.

Conclusión: la cobertura de las filas públicas visibles y con precio es **100% (553/553)** en el corte auditado.

## 2. Distribución lógica V16 de las 553 filas

- Electrodomésticos: **229**
- Herramientas: **63**
- Hogar: **63**
- Audio: **49**
- Cuidado personal & Salud: **38**
- Smart TV: **30**
- Deportes y movilidad: **21**
- Camping / Aire libre / Mascotas: **12**
- Bebés & Juguetes: **12**
- Gaming: **10**
- Tecnología & Accesorios: **9**
- Otros: **13**
- Descanso: **3**
- Auto / Motos / Energía: **1**

## 3. Imágenes

- Productos con URL HTTPS reutilizable: **551/553**
- Sin imagen web reutilizable: **2**
  - ID `3` — DELHI ESTUFA CUARZO DL-1200w (origen usa data URI)
  - ID `687` — Desmalezadora shimura (sin foto)
- URLs alojadas fuera del Storage principal: **30** apuntan a `cdn.catalog-store.link`.

Observación: `ProductCard` usa `next/image`. El `next.config.ts` actual declara solamente el host de Supabase. Las 30 imágenes de `cdn.catalog-store.link` requieren QA de build/runtime antes de integrar; no se debe asumir que funcionarán sin validar la configuración del host.

## 4. Disponibilidad

Solo **2** filas del snapshot están marcadas como no disponibles:

- ID `124` — LAVARROPA DINAX*
- ID `19` — Tender Plegable con Alas — 8 varillas

## 5. Duplicados dentro de las 553 filas LIVE

### Duplicado público exacto

Hay 1 grupo con mismo nombre, mismo precio, misma categoría/subcategoría y misma marca:

- ID `-1060` — SET DE ACCESORIOS PARA BAÑO 6 PIEZAS — $46.500
- ID `-929` — SET DE ACCESORIOS PARA BAÑO 6 PIEZAS — $46.500

Ambos vienen de Mega Electro, con mismo costo/precio pero códigos de proveedor distintos. El composite actual los colapsa a una sola tarjeta por su clave pública.

### Mismo nombre con precios distintos

- ID `-1001` — BALANZA KRETZ NOVEL ECO 2 30KG MULTI RANGO PPI — $513.500
- ID `-1002` — BALANZA KRETZ NOVEL ECO 2 30KG MULTI RANGO PPI — $362.500

No deben fusionarse automáticamente: tienen códigos de proveedor y costos distintos. Requieren aclarar variante/modelo real o renombrar para que el cliente no vea dos productos con el mismo título.

## 6. Problema crítico: fuentes legacy todavía mezcladas

El composite de `lib/catalog/index.ts` no contiene solo los 553 snapshots nuevos.

Entradas totales al composite actual:

- V4.11 laboratory fixture: **4**
- Cohort 0 frozen: **9**
- Snapshots sanitizados actuales: **553**
- Entradas brutas: **566**
- Resultado efectivo de la deduplicación actual: **562**

### Cohort 0 contra catálogo actual

Cohort 0 se superpone por ID con **7** productos actuales.

En 3 casos, por el orden actual del composite, la versión vieja de Cohort 0 gana la deduplicación y desplaza la versión nueva con foto:

- ID `-53` — Hidrolavadora inalámbrica Xiaomi
- ID `-104` — SMART TV SAMSUNG 85” NEO QLED
- ID `-306` — CARGADOR DE VEHÍCULO PARA CELULAR XIAOMI 20w

Las versiones Cohort 0 tienen `image: null`.

En otros 4 casos, la clave de dedupe cambia por marca/subcategoría y por eso quedan dos tarjetas del mismo producto:

- ID `-78` — Torre Sony ULT POWER SOUND
- ID `-23` — JOYSTICK PLAYSTATION 5 DUAL SENSE BLACK
- ID `-190` — LIJADORA ORBITAL KANJI TOOLS Kjt-lo2302gb
- ID `-671` — Set de Ollas Kanjihome Gourmet Beige

Cohort 0 además conserva **2 productos que ya no están en LIVE visible + precio**:

- ID `-29` — BALANZA DIGITAL XIAOMI SCALE 2 150kg — actualmente visible=false / sinStock=true
- ID `-833` — Cortadora De Fiambre Pro Slice Telefunken — actualmente visible=false / sinStock=true

### V4.11 laboratory fixture

Siguen entrando al composite **4 productos de laboratorio** cuya propia evidencia indica `production_catalog_verified: false`:

- Samsung Galaxy A16 128 GB
- Samsung Galaxy A16 256 GB
- Motorola Moto G15 256 GB
- Codini Secarropas 6.5 KG

No deben confundirse con el catálogo real materializado.

## 7. Gap de taxonomía pública

La categoría lógica `deportes-movilidad` tiene **21 productos**, pero no existe como slug público en `lib/catalog/categories.ts`.

Resultado: los datos están preparados y buscables en el adapter, pero no existe todavía una página pública dedicada que permita entrar a ese sector por navegación normal.

No se modificó la taxonomía pública durante esta auditoría.

## 8. Datos estructurados pendientes

Sobre los 553 productos actuales:

- Marca `Varios`: **90**
- `model` estructurado: **0/553**
- `features` no vacío: **18/553**

Esto no impide mostrar la tarjeta básica, pero limita:

- filtros por marca;
- showrooms/locales de marca;
- ficha técnica;
- búsqueda precisa por modelo;
- comparación de productos.

Los nombres de origen también conservan emojis, asteriscos, mayúsculas inconsistentes y algunos errores ortográficos. Conviene normalizar la presentación sin destruir el nombre original.

## 9. Financiación

Los adapters de snapshots creados en este gate cargan:

`financing: []`

Por lo tanto, si se integran tal como están, las tarjetas no obtienen automáticamente importes estructurados de 2/4/6 cuotas desde estos adapters.

Antes de producción debe definirse una única capa V16 de pricing/financiación que use la regla comercial vigente sin duplicar lógica ni inventar valores.

## 10. Estado de seguridad

Durante esta auditoría:

- Supabase: **solo lectura**
- Producción: **sin cambios**
- Main: **sin cambios**
- Integration: **sin cambios**
- Storefront visual: **sin cambios**
- Administración visual: **sin cambios**
- `categories.ts`: **sin cambios**

## 11. Orden de corrección recomendado antes de integrar

1. Retirar Cohort 0 del runtime real o convertirlo únicamente en evidencia/fallback que nunca gane contra snapshot actual.
2. Retirar el fixture V4.11 de laboratorio del catálogo real cuando esté conectada la fuente canónica de celulares.
3. Deduplicar por identidad de origen/canonical ID, no solo por nombre+marca+subcategoría+precio.
4. Resolver el sector público `deportes-movilidad`.
5. Conectar la capa de financiación 2/4/6.
6. Validar las 30 imágenes de `cdn.catalog-store.link` y resolver las 2 imágenes faltantes.
7. Normalizar marca/modelo/nombre sin perder el valor original.
8. Recién después hacer integración + preview + QA visual.

## Resultado

**PASS_CATALOG_SOURCE_COVERAGE_553_OF_553**

pero

**BLOCKED_FOR_DIRECT_PRODUCTION_INTEGRATION**

Motivos principales: mezcla de fuentes legacy, duplicados legacy, dos registros Cohort 0 obsoletos, pérdida potencial de fotos por precedencia, taxonomía pública faltante para Deportes y ausencia de financiación estructurada.
