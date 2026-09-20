# AmarangoElectro V16 — Step 7E — US Premium Product Comparison

## Objetivo

Agregar una comparación de productos técnica, rápida y mobile-first sin activar catálogo real ni introducir rutas de escritura. La función está pensada para categorías *spec-driven* como celulares, televisores, electrodomésticos y herramientas.

## Fundamento UX

La decisión toma como referencia investigación de Baymard sobre comparación en productos con muchas especificaciones: la selección debe ser fácil, persistente y permitir ver productos lado a lado. La comparación no reemplaza la ficha individual; reduce el esfuerzo de alternar entre varias fichas durante la decisión.

Referencias consultadas durante Step 7E:

- Baymard Institute, “Product Comparison UX: Always Provide Comparison Features for Spec-Driven Industries”.
- Baymard Institute, colección “Comparison Tool” y ejemplos de “Spec Sheet”.
- Baymard Institute, “Product Page UX 2026”.

## Implementación

- Hasta **3 productos** por comparación.
- Selección persistida únicamente en `localStorage` del dispositivo.
- Comparación limitada a productos de la **misma categoría**.
- Bandeja inferior persistente que recuerda qué productos están seleccionados.
- La comparación completa se habilita al seleccionar al menos 2 productos.
- Vista lado a lado, con scroll horizontal en pantallas pequeñas.
- Modo **“Mostrar solo diferencias”** activo por defecto.
- Filas base: marca, modelo, precio, disponibilidad, garantía y características clave.
- Se incorporan dinámicamente las claves existentes en `Product.specifications`.
- Valores ausentes permanecen como **“A confirmar”**; no se infieren ni completan.
- Las características se ordenan antes de compararlas para evitar falsas diferencias por orden textual.
- Cada producto conserva acceso directo a su ficha completa.
- El panel cierra con Escape, devuelve foco a un control visible y respeta `prefers-reduced-motion`.
- Nuevo cue sonoro `compare`, breve y generado localmente con Web Audio API, únicamente tras una acción del usuario.

## Archivos nuevos

- `app/components/product-comparison.tsx`
- `lib/catalog/comparison.ts`
- `lib/commerce/compare-store.ts`
- `tests/v16-step7e-premium-comparison.test.mjs`
- `docs/V16-STEP7E-US-PREMIUM-COMPARISON-REPORT.md`

## Archivos modificados

- `app/components/catalog-client.tsx`
- `app/components/product-card.tsx`
- `app/globals.css`
- `lib/ux/sonic-feedback.ts`
- `tests/v16-step7c-premium-discovery.test.mjs` (solo mejora del harness de prueba para ejecutar TypeScript con el stripping nativo de Node; no cambia lógica de producto)
- `README.md`
- `docs/CHECKPOINTS.md`
- `package.json`

## Seguridad y límites

Step 7E:

- NO consulta Supabase.
- NO modifica producción ni `main`.
- NO ejecuta la aplicación Legacy.
- NO agrega `fetch`, XHR ni cliente de base de datos.
- NO agrega `insert`, `upsert`, `update` ni `rpc`.
- NO cambia precio, stock, visibilidad o catálogo.
- NO agrega telemetría.
- NO integra Margarita, IA, prompts, Workers, WhatsApp o webhooks.
- `MockCatalogAdapter` continúa siendo la fuente activa.

La única persistencia nueva es una lista de IDs de producto en `localStorage`, utilizada exclusivamente para recordar la selección comparativa del dispositivo.

## Validación específica

Ejecutado en este checkpoint:

```bash
node --test tests/v16-step7b-premium-sonic.test.mjs \
  tests/v16-step7c-premium-discovery.test.mjs \
  tests/v16-step7d-premium-pdp.test.mjs \
  tests/v16-step7e-premium-comparison.test.mjs
```

Resultado de la batería focal: **16/16 tests aprobados** (Steps 7B, 7C, 7D y 7E).

Además, los archivos TS/TSX modificados fueron sometidos a transpilación sintáctica aislada con TypeScript, sin requerir `node_modules` del proyecto.

El build/suite heredado completo continúa dependiendo de reconstruir el árbol npm del proyecto; Step 7E no afirma que ese build se haya ejecutado cuando las dependencias no están instaladas en el entorno.
