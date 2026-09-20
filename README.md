# AmarangoElectro V16 — Step 7R.1

**Banner Framing Fix**

Checkpoint incremental derivado exclusivamente de Step 7R. Corrige el encuadre de los artes aprobados de Tecnología & Accesorios, Hogar y Descanso: cada composición 1672×941 conserva su lienzo completo en desktop/tablet y usa un recorte móvil focalizado, separado del bloque de texto. Electrodomésticos y Herramientas mantienen su framing anterior sin cambios.

No conecta CRM real, Margarita, WhatsApp, producción ni Supabase. Ver `V16-STEP7R1-BANNER-FRAMING-FIX-REPORT.md`.

# AmarangoElectro V16 — Step 7Q

**Category Completion + Responsive Hardening**

Checkpoint incremental derivado de Step 7P. Completa el lenguaje visual de las 11 categorías principales con componentes reutilizables, imágenes editoriales existentes o estados premium reemplazables. “Explorar más” deja de ser una lista y pasa a búsqueda, filtros y revelado progresivo. Celulares, Smart TV y Audio conservan sus rutas y experiencia aprobadas.

No conecta CRM real, Margarita, WhatsApp, producción ni Supabase. Ver `V16-STEP7Q-CATEGORY-COMPLETION-REPORT.md`.

# AmarangoElectro V16 — Step 7N

**Premium Banner Integration Pilot**

Este checkpoint integra el primer banner real dentro del sitio usando Electrodomésticos como plantilla madre. El logo oficial enviado por el usuario se renderiza como asset exacto, separado del arte generativo. Abeja, colmena y marca de agua se usan como detalles de identidad sutiles. La arquitectura Step 7M.1, el Admin Step 7L y el bloqueo de escrituras permanecen intactos.

Ver `V16-STEP7N-BANNER-INTEGRATION-REPORT.md` y `AmarangoElectro-V16-Step7N-Banner-Integration-Preview.html`.

# AmarangoElectro V16 — Step 7M.1

**Taxonomy Alignment + Compatibility Lock**

Este checkpoint corrige Step 7M para exponer exactamente las 11 categorías principales aprobadas. Celulares, Smart TV y Audio siguen disponibles como rutas V16 de compatibilidad para no romper funcionalidad existente, pero ya no se cuentan ni se muestran como universos principales. Gaming deja PlayStation activo, prepara Xbox/Nintendo/Accesorios gamer y conserva Juegos/Joysticks como compatibilidad heredada. No activa escrituras productivas.

Ver `V16-STEP7M1-TAXONOMY-ALIGNMENT-REPORT.md`.

# AmarangoElectro V16 — Step 7M

**Category Architecture + Banner Sections**

Este checkpoint extiende Step 7L con navegación jerárquica preparada para 1.200+ productos, banners por categorías/subcategorías y gestión de imágenes reemplazables, sin activar escrituras productivas.

# AmarangoElectro V16 — Step 7I.1

Legacy Parity + Corrected Role Boundary.

Este checkpoint mantiene el storefront público de Step 7H y corrige la base interna: Asesores quedan explícitamente sin acceso a costo, USD, calculadora, comisiones e inversión; esas capacidades son exclusivas de Administración. Producción, Supabase real, RLS, Margarita, WhatsApp e IA continúan fuera de alcance.

Ver:
- `docs/V16-STEP7I-LEGACY-PARITY-SECURE-FOUNDATION.md`
- `docs/LEGACY-FEATURE-INVENTORY.md`
- `docs/ROLE-MATRIX-CORRECTED.md`

# AmarangoElectro V16 Step 7H – Storefront Continuity + PWA Foundation

Checkpoint independiente que conserva la migración segura del Legacy y suma una capa de experiencia premium + feedback sonoro sutil, sin ejecutar el legacy, conectar producción ni escribir en Supabase.

## Estado

- V14 preservada como referencia inmutable.
- Step 6 conservado como checkpoint anterior.
- Rama independiente Step 7; `main` y producción intactos.
- ZIP legacy auditado estáticamente; la aplicación vieja no fue ejecutada.
- Adaptador `LegacyCatalogAdapter` aislado, inyectable y exclusivamente de consulta.
- Reglas de visibilidad/stock puras y fail-closed.
- Buscador V16 con mayúsculas/minúsculas, acentos, ranking y modelos numéricos exactos.
- Filtros de marca, búsqueda, favoritos y orden activos.
- Precio/estado real preparado para tarjetas y ficha cuando llegue un snapshot validado.
- Compartir individual centralizado con Web Share y clipboard, usando `/producto/[slug]`.
- Favoritos continúan locales.
- Margarita, WhatsApp definitivo, IA, administración y Supabase real fuera de alcance.

## Refuerzo Step 7A

Antes de aceptar un futuro snapshot real, el adaptador ahora aplica una allowlist offline que descarta campos privados/desconocidos y congela la copia de entrada. También se amplió la detección de marcas ya reconocidas por el Legacy y se mejoró el diagnóstico de duplicados, sin activar catálogo real ni modificar la UI aprobada.

## Por qué aún se ven productos demostrativos

El ZIP contiene código, pero no las filas reales JSON de `tienda_catalogo` y `celulares_lista`. Consultar producción está prohibido y el archivo de muestra de proveedor no contiene celulares ni precios públicos. Por eso V16 mantiene sus cinco familias demostrativas honestas hasta recibir un snapshot sanitizado de 5–10 celulares.

## Validación

```bash
npm ci
npm run lint
npm test
```

## Cómo abrir la tienda

Preview visual sin instalar:

1. Abrir `AmarangoElectro-V16-Step7-Preview.html` en Chrome, Edge o Firefox.
2. Usar Home, Celulares y Ficha.
3. Probar Auto, 320, 360, 390, 412 y Tablet.

Ese HTML es un snapshot visual previo y no ejecuta el autocomplete interactivo agregado en Step 7C. Para validar la búsqueda predictiva, usar la versión completa desde el ZIP:

```bash
npm ci
npm run dev
```

Abrir la dirección local informada por la terminal. No requiere variables Supabase.

## Documentos principales

- `LEGACY-PRODUCT-SCHEMA.md`
- `LEGACY-CATALOG-AUDIT.md`
- `LEGACY-ADMIN-MAP.md`
- `LEGACY-FINANCING-MAP.md`
- `LEGACY-STORE-MIGRATION-PLAN.md`
- `docs/MIGRATION-MATRIX.md`
- `docs/V16-STEP7-REPORT.md`

## Próximo insumo controlado

Exportación sanitizada, sin credenciales ni datos personales, de 5–10 celulares presentes en `tienda_catalogo` y/o `celulares_lista`, incluyendo únicamente campos comerciales de lectura necesarios. La conexión real seguirá requiriendo auditoría RLS y un endpoint público GET-only.

## Step 7B — US Premium + Sonic UX

Se añadió un refinamiento independiente de experiencia: microinteracciones más precisas y feedback sonoro muy breve mediante Web Audio API. No hay música, autoplay, sonido al hacer scroll ni archivos de audio externos. El usuario dispone de un control de sonido en el header y la preferencia queda local en el dispositivo.

La capa no cambia el estado de migración del catálogo: `MockCatalogAdapter` sigue siendo la fuente activa y producción permanece desconectada.

Ver `docs/V16-STEP7B-US-PREMIUM-SONIC-REPORT.md`.


## Step 7C — US Premium Discovery

Se agregó una capa de descubrimiento de productos inspirada en investigación UX 2026: autocomplete derivado únicamente del catálogo disponible, botón explícito Buscar, navegación por teclado, recuperación conservadora de errores ortográficos y un estado “sin resultados” recuperable. Los modelos con números mantienen coincidencia estricta y nunca reciben autocorrección difusa.

La búsqueda sigue siendo completamente local: no hace requests, no agrega telemetría y no cambia el estado de migración. `MockCatalogAdapter` continúa activo.

Ver `docs/V16-STEP7C-US-PREMIUM-DISCOVERY-REPORT.md`.

## Step 7D — US Premium PDP

La experiencia catálogo → ficha fue refinada para productos técnicos. Se descartó Quick View por criterio UX y se priorizaron tarjetas más informativas, ficha completa cinematográfica, ampliación de imagen, acciones comerciales sticky en móvil, secciones verticales de decisión y productos relacionados deterministas.

No cambia el estado de migración: `MockCatalogAdapter` sigue activo; no se consulta Supabase, no se toca producción y Margarita/WhatsApp/IA permanecen fuera de alcance.

El HTML de preview incluido sigue siendo el snapshot visual base de Step 7 y no representa las interacciones dinámicas agregadas en Steps 7B–7E. Para validar Steps 7D–7E usar la aplicación completa en entorno local sin variables de producción.

Ver `docs/V16-STEP7D-US-PREMIUM-PDP-REPORT.md`.


## Step 7E — US Premium Product Comparison

Se agregó comparación persistente para productos técnicos: hasta 3 productos de la misma categoría, bandeja inferior de selección y panel lado a lado con “solo diferencias” activo por defecto. La vista combina campos comerciales públicos y `Product.specifications` existentes; cualquier dato ausente permanece como “A confirmar”.

La selección vive únicamente en `localStorage` del dispositivo. No hay requests, telemetría, mutaciones de catálogo ni conexión a producción. `MockCatalogAdapter` sigue activo y Margarita/WhatsApp/IA continúan explícitamente fuera de alcance.

También se corrigió el harness de pruebas de Step 7C para aprovechar el stripping de tipos de Node y poder validar sus funciones TypeScript sin reconstruir `node_modules`.

Ver `docs/V16-STEP7E-US-PREMIUM-COMPARISON-REPORT.md`.

## Amarango OS V3 — Product Bridge + Data Contract

V3 agrega una ruta de laboratorio en `/amarango-os` que consulta el contrato `Product V16` mediante un adaptador de lectura aislado. La búsqueda comprende nombre, modelo, memoria, categoría y marca; los campos administrativos se proyectan únicamente cuando el contexto de rol tiene capacidad explícita.

El preview usa cuatro productos de evidencia provenientes de CRM Lab V2.1. No consulta producción, no replica el catálogo dentro del CRM, no guarda ventas y mantiene bloqueada toda confirmación. El snapshot `amarango-sale-item/v1` queda preparado como valor histórico inmutable para una fase futura.

Documentación: `AMARANGO-OS-V3-PRODUCT-BRIDGE-REPORT.md`, `AMARANGO-OS-DATA-CONTRACT.md` y `AMARANGO-OS-V3-FIELD-INVENTORY.md`.

## Step 7F — US Premium Decision & Consultation Flow

Se cerró el tramo de decisión de la PDP con una acción principal `Quiero este` y un handoff local de intención. El cliente puede indicar si quiere avanzar con el producto, consultar cuotas, confirmar disponibilidad o consultar entrega; luego revisa un resumen exacto antes de cualquier continuidad futura.

No se recopilan datos personales, no se simula checkout y no se transmite ni persiste la consulta. El panel usa únicamente información pública ya presente en `Product`, representa ausencias como `A confirmar` y permite copiar el resumen al portapapeles del dispositivo.

El flujo es independiente de Margarita y usa el evento local `amarango:purchase-intent`. `margarita-button.tsx` permanece sin cambios. Tampoco se agrega WhatsApp, IA, Workers, Supabase real ni escrituras de producción. `MockCatalogAdapter` continúa activo.

Ver `docs/V16-STEP7F-US-PREMIUM-DECISION-FLOW-REPORT.md`.

## V16 Step 7G — Mobile Performance + Perceived Speed

Step 7G agrega una capa de performance percibida y resiliencia móvil sin cambiar la fuente de catálogo ni conectar producción: skeletons de ruta con geometría estable, hero dormido fuera de viewport/pestaña, adaptación local a Data Saver/2G y CPU Performance tier de Chrome 152 cuando esté disponible, filtros diferidos para reducir trabajo durante interacción, `content-visibility` para contenido fuera de pantalla y un perfil visual más liviano en dispositivos touch/red limitada.

Ver `V16-STEP7G-PERFORMANCE-REPORT.md` para alcance, decisiones y validación.


## V16 Step 7H — Storefront Continuity + PWA Foundation

Step 7H conserva el contexto catálogo→ficha→catálogo, agrega vistos recientemente exclusivamente locales, prefetch por intención respetando Data Saver/perfil lean y deja la misma V16 preparada como PWA instalable con manifest, iconos, modo standalone y fallback offline seguro.

El Service Worker no cachea páginas vivas de catálogo/producto para evitar datos comerciales obsoletos cuando llegue la conexión real. `MockCatalogAdapter` continúa activo; Supabase, producción, Margarita, WhatsApp e IA siguen fuera de alcance.

Ver `V16-STEP7H-CONTINUITY-PWA-REPORT.md`.

## V16 Step 7I.2 — Scroll Quality
Pass de fluidez táctil/high-refresh: scroll nativo, reducción dinámica de blur/sombras durante fling, pausa temporal de decoración costosa y comportamiento standalone más estable. Ver `V16-STEP7I2-SCROLL-QUALITY-REPORT.md`.

## Step 7J.1 — Admin Center Foundation

Se agregó una capa interna, sin ruta pública ni escrituras, para parser fail-closed de listas, preview de cambios, cotización USD, proveedor/mayorista y reglas de activación segura. Los productos nuevos quedan ocultos y cualquier moneda/duplicado ambiguo exige revisión humana.

Ver `docs/V16-STEP7J-ADMIN-CENTER-FOUNDATION.md`.


## Step 7J.1 — Legacy Admin Parity
Se congeló como contrato la paridad funcional del Admin Legacy y se añadió el parser/preview específico de celulares (PESOS/USD, actualización de dólar sin repaste, preservación de metadata y detección de faltantes), todavía sin escrituras reales.

## Step 7K — Admin Visual System + Speed Workspace
Administración conserva la identidad premium de AmarangoElectro pero adopta un workspace daily-first: acciones frecuentes a 1–2 toques, command palette, bandeja "Para resolver hoy", bulk actions y acciones destructivas fuera del flujo principal. Sigue completamente desconectado de producción y de cualquier write path.

## Step 7K.1 — Screenshot Parity Lock
Las capturas reales del Admin Legacy quedaron convertidas en contrato explícito. V16 conserva la operativa y mejora el acceso con herramientas agrupadas, búsqueda global, contexto de producto, editor de una sola superficie y preview obligatorio. El prototipo continúa offline y sin escrituras productivas.

## Step 7L — Admin Product Cards + Calculadora + Placas

- Tarjetas administrativas premium con paridad práctica Legacy.
- Arquitectura de catálogo preparada para 1.200+ productos, carga incremental y acciones masivas.
- Calculadora AmarangoElectro Admin-only con política versionada.
- Sistema Placas Costo/Venta/USD con 2/4/6 cuotas y OFF.
- Storefront público, Supabase, Margarita y producción continúan desconectados de esta capa.
- Ver `V16-STEP7L-ADMIN-CARDS-CALCULATOR-PLATES-REPORT.md`.

## Step 7O — Electrodomésticos Internal Banners

Se integraron los seis banners reales de Refrigeración, Climatización, Cocción, Lavado, Pequeños electrodomésticos y Limpieza dentro de `/categoria/electrodomesticos`.

Los assets se sirven optimizados en WebP, el logo oficial continúa superpuesto como archivo real del sitio y la navegación de cada sector abre una presentación editorial grande con regreso limpio a Electrodomésticos. Producción, Supabase, Admin, Margarita y WhatsApp permanecen sin cambios.

Ver `V16-STEP7O-ELECTRODOMESTICOS-BANNERS-REPORT.md`.

## Step 7P — Herramientas + Logo Fix
- Corrige la duplicación visual de logos en banners: una sola capa oficial de marca.
- Herramientas integrado con Taladros, Amoladoras y Sierras.
- Mantiene responsive premium y navegación por sector.
- CRM queda documentado como módulo futuro, sin conexión ni escrituras.

Ver `V16-STEP7P-HERRAMIENTAS-LOGO-FIX-REPORT.md` y `V16-FUTURE-CRM-INTEGRATION-NOTES.md`.

## Step 7R — Approved Category Assets

- Activados banners editoriales reales para Tecnología & Accesorios, Hogar y Descanso.
- Branding de los banners servido por el sitio con el logo oficial exacto; los nuevos fondos no incorporan logos generados.
- WebP 1672×941 optimizados y arquitectura Step 7Q preservada.
- CRM real, Margarita, WhatsApp, Supabase productivo y RLS continúan fuera de alcance.
