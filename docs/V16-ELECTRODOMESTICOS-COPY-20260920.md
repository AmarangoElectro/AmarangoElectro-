# V16 — Electrodomésticos copy checkpoint — 2026-09-20

## Resultado

PASS_V16_ELECTRODOMESTICOS_SANITIZED_COPY

Se copió a V16 una instantánea pública y sanitizada del catálogo real de electrodomésticos, leyendo la tienda legacy en modo **read-only**.

- Productos integrados: **224**
- Con imagen HTTPS pública: **223**
- Sin imagen HTTPS reutilizable: **1** — `DELHI ESTUFA CUARZO DL-1200w`
- Productos disponibles según `sinStock`: **223**
- Productos visibles sin stock: **1**

## Distribución V16

- Pequeños electrodomésticos: 67
- Refrigeración: 47
- Climatización: 42
- Lavado: 33
- Cocción: 24
- Limpieza: 11

## Seguridad / aislamiento

NO se escribió en Supabase.

NO se modificó la tienda legacy.

NO se modificaron precios, visibilidad, fotos ni stock de la tienda original.

NO se copiaron al catálogo público V16:

- costo
- mayorista / proveedor
- stock de proveedor
- códigos o claves operativas
- campos internos de sincronización

La copia vive únicamente en la rama:

`work/v16-modelo-correcto-live-20260919`

## Archivos

- `fixtures/v16-electrodomesticos-sanitized-20260920.json`
- `lib/catalog/v16-electro-snapshot-adapter.ts`
- `lib/catalog/index.ts`
- `lib/catalog/types.ts`
- `next.config.ts`

## Nota de despliegue

Los cambios están en GitHub. Para verlos en una URL navegable, desplegar una preview no productiva del HEAD actual de la rama. No es necesario tocar `main`, producción ni Supabase.
