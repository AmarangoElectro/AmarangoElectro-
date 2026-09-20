# AmarangoElectro V16 Step 7C — US Premium Discovery

## Objetivo

Continuar elevando V16 con patrones actuales de e-commerce estadounidense sin copiar una tienda concreta ni agregar complejidad ornamental. Step 7C se concentra en **product discovery**: ayudar a encontrar un producto con menos fricción, especialmente desde celular.

La capa se construye sobre Step 7B. La identidad visual, Sonic UX, arquitectura read-only y límites de migración permanecen intactos.

## Base de investigación aplicada

La decisión se apoya en investigación UX actualizada durante 2026:

- Baymard Institute, *Ecommerce Search UX 2026*: 56% de los sitios evaluados muestran desempeño de búsqueda “mediocre o peor”; el soporte de tipos de consulta y la calidad de búsqueda siguen siendo una oportunidad fuerte de diferenciación.
- Baymard Institute, *Mobile UX Trends 2026*: el autocomplete relevante, la recuperación ante errores de escritura y un mecanismo visible para ejecutar la búsqueda reducen fricción en móvil.
- Baymard Institute, benchmark de *Mobile Search Autocomplete*: el autocomplete debe evitar sugerencias duplicadas o irrelevantes y trabajar bien dentro del espacio reducido por el teclado móvil.

Referencias públicas:

- https://baymard.com/blog/ecommerce-search-query-types
- https://baymard.com/blog/mobile-ux-ecommerce
- https://baymard.com/mcommerce-usability/benchmark/mobile-page-types/search-autocomplete

## Qué se agregó

### 1. Autocomplete derivado del catálogo

Mientras el usuario escribe, V16 puede sugerir:

- marcas que coinciden con el término;
- productos realmente presentes en el `Product[]` recibido por la pantalla;
- una corrección conservadora cuando existe un error ortográfico pequeño.

No se inventan productos ni sugerencias desde una lista comercial externa.

### 2. Botón explícito “Buscar”

El campo mantiene resultados reactivos, pero ahora también ofrece un control visible para confirmar la búsqueda. Esto resulta especialmente importante en móvil, donde el usuario no siempre identifica la acción del teclado virtual como el mecanismo de envío.

### 3. Recuperación por errores de escritura

Se implementó una corrección local y acotada para palabras de al menos cuatro caracteres.

Ejemplos esperados:

- `samsng` → sugerir `Samsung`;
- `motrola` → sugerir `Motorola`.

La corrección **nunca se aplica automáticamente**. El usuario debe elegirla.

### 4. Protección especial de modelos numéricos

Los términos que contienen números quedan fuera de la corrección difusa. De esta forma:

- `A16` no puede transformarse en `A17`;
- `G16` no puede transformarse en `G15`;
- se conserva la regla Step 7 de coincidencia exacta para modelos con números.

### 5. Navegación por teclado

El autocomplete admite:

- `ArrowDown` / `ArrowUp` para recorrer sugerencias;
- `Enter` para seleccionar;
- `Escape` para cerrar;
- semántica `aria-autocomplete`, `aria-expanded`, `aria-activedescendant` y opciones seleccionables.

### 6. Estado “sin resultados” recuperable

Cuando no existe coincidencia:

- se mantiene un mensaje claro;
- se ofrece “¿Quisiste decir…?” cuando corresponde;
- se ofrece regresar al catálogo completo sin obligar a borrar manualmente cada filtro.

### 7. Continuidad Sonic UX

Los sonidos se mantienen únicamente en acciones explícitas del usuario. Escribir caracteres no produce sonido. Seleccionar una sugerencia o confirmar una búsqueda puede usar el cue de navegación/tap ya existente.

## Privacidad, seguridad y arquitectura

Step 7C NO:

- consulta Supabase;
- hace `fetch` ni requests de búsqueda;
- agrega motores externos, analytics o telemetría;
- envía lo escrito por el usuario a terceros;
- modifica catálogo, precios, stock o visibilidad;
- ejecuta `insert`, `upsert`, `update`, `rpc`, POST, PUT, PATCH o DELETE contra producción;
- cambia `main` ni producción;
- activa catálogo real;
- integra, modifica o reutiliza Margarita, IA, WhatsApp, Workers, prompts o webhooks.

La fuente activa sigue siendo `MockCatalogAdapter`.

## Archivos principales modificados

- `lib/catalog/search.ts`
- `app/components/catalog-client.tsx`
- `app/globals.css`
- `tests/v16-step7c-premium-discovery.test.mjs`

## Validación en este entorno

- Step 7B + Step 7C: **8/8 tests específicos aprobados**.
- Step 7C: **4/4 tests aprobados**.
- `lib/catalog/search.ts`: chequeo TypeScript aislado aprobado.
- `catalog-client.tsx`: parsing/transpilación TypeScript/JSX sin errores sintácticos.
- búsqueda predictiva probada con sugerencias deduplicadas y derivadas del catálogo.
- typo recovery probado con `samsng → Samsung` y `motrola → Motorola`.
- modelos numéricos probados en modo fail-safe: `A16` y `G16` no reciben autocorrección.
- escaneo Step 7C: sin `fetch`, credenciales Supabase ni primitivas de mutación productiva.
- catálogo activo confirmado: `MockCatalogAdapter`.

El suite heredado completo no se declara ejecutado: este entorno continúa sin el árbol `node_modules` y los tests del normalizador Legacy que requieren `zod` no pueden importar esa dependencia. Esa limitación no fue causada por Step 7C y ya estaba presente en el checkpoint anterior.

## Próximo paso recomendado

Conservar esta capa como UX final de búsqueda y continuar la migración real únicamente cuando exista un snapshot sanitizado read-only. Una vez disponibles productos reales, el mismo autocomplete funcionará sobre esos `Product[]` sin necesitar una reescritura del componente.
