# AmarangoElectro V16 — Step 7D — US Premium PDP

## Objetivo

Elevar la exploración catálogo → ficha a un estándar de ecommerce premium orientado a productos técnicos, sin activar catálogo real ni modificar producción.

## Decisión UX clave

Se descartó deliberadamente implementar **Quick View**. AmarangoElectro comercializa principalmente productos técnicos (celulares, electrodomésticos, herramientas), y la investigación de ecommerce para productos *spec-driven* recomienda priorizar tarjetas con atributos suficientes y fichas completas de alta calidad en lugar de overlays intermedios.

Step 7D aplica ese criterio mediante:

- tarjetas con modelo y disponibilidad visibles, además de características ya existentes;
- entrada visual refinada a la ficha;
- transición de navegación progresiva mediante View Transitions cuando el navegador la soporta;
- ampliación de imagen oficial en `dialog` nativo;
- doble toque/doble clic para alternar ampliación y preservación de gesto de pinch del navegador;
- CTA comercial sticky en móvil dentro de la ficha;
- información de decisión en secciones verticales `<details>`, evitando pestañas horizontales;
- productos relacionados deterministas, sin aleatoriedad ni modificación de catálogo;
- fallback honesto cuando faltan imagen, precio, stock, garantía o especificaciones.

## Qué NO se hizo

- NO se conectó Supabase.
- NO se consultó producción.
- NO se cambió `main`.
- NO se ejecutó la aplicación Legacy.
- NO se migró administración Legacy.
- NO se modificó RLS, SQL, precios, stock ni visibilidad.
- NO se integró Margarita, IA, prompts, Workers, WhatsApp ni webhooks.
- NO se agregó telemetría.
- NO se agregó Quick View.
- NO se inventaron especificaciones ni información comercial.

`MockCatalogAdapter` continúa siendo la fuente activa.

## Archivos funcionales agregados

- `app/components/product-media-viewer.tsx`
- `app/components/product-decision-details.tsx`

## Archivos funcionales modificados

- `app/producto/[slug]/page.tsx`
- `app/components/product-card.tsx`
- `app/globals.css`

## Accesibilidad y degradación progresiva

- El lightbox utiliza `dialog` nativo y se cierra con Escape.
- Los controles de zoom tienen nombres accesibles.
- `prefers-reduced-motion` desactiva las nuevas animaciones.
- View Transitions es una mejora progresiva: si el navegador no la soporta, la navegación conserva el comportamiento normal.
- La navegación sigue usando enlaces HTML normales, preservando semántica, historial y restauración de contexto del navegador.

## Seguridad

La capa Step 7D no contiene rutas de red ni operaciones productivas. No agrega `fetch`, cliente Supabase, `insert`, `upsert`, `update`, `delete`, `rpc`, POST, PUT, PATCH o DELETE. La única lectura de productos relacionados reutiliza `CatalogAdapter.listProducts()` sobre la fuente ya activa.

## Validación específica

En este checkpoint se ejecutó directamente:

```bash
node --test tests/v16-step7d-premium-pdp.test.mjs
```

Resultado: **4/4 Step 7D aprobados**. Los 4 tests de Sonic UX de Step 7B también continúan aprobando. Las funciones puras de búsqueda de Step 7C fueron verificadas adicionalmente mediante transpilación temporal con TypeScript, porque Node sin el loader del proyecto no importa `.ts` de forma directa.

El suite completo heredado continúa sujeto a la limitación conocida del entorno cuando no puede reconstruirse el árbol de dependencias npm.
