# V16 · Productos sin categoría de origen · snapshot sanitizado 2026-09-20

- Fuente leída: `public.tienda_productos_incremental`.
- Operación sobre Supabase: **solo lectura**.
- Filas públicas procesadas: **7**.
- Fotos HTTPS reutilizables: **7**.
- Se conservaron nombre, precio de venta, disponibilidad, características públicas y foto.
- Se excluyeron costo, mayorista/proveedor, stock interno del proveedor y campos de sincronización.
- Se clasificó únicamente por evidencia clara del nombre.
- Este gate no modifica cards, CSS ni taxonomía pública del storefront.

## Destino lógico

- hogar: 4
- electrodomesticos: 3

## Detalle

- 💜 Tender giratorio calesita → hogar / hogar-y-deco
- CAFETERA DELHI DL-809 EXPRESO MULTICAPSULA 3 EN 1 → electrodomesticos / pequenos-electrodomesticos
- Parrilla BARBACOA DELHI → electrodomesticos / coccion
- PAVA ELÉCTRICA DELHI → electrodomesticos / pequenos-electrodomesticos
- Tender Plegable con Alas — 8 varillas → hogar / hogar-y-deco · SIN STOCK
- Tender Plegable sin Alas → hogar / hogar-y-deco
- Vaso quencher 2.0 stanley CREAM pink,antique pink Capacidad: 887ml → hogar / bazar-y-mesa

## Rollback

Eliminar el fixture y el adaptador, retirar la fuente del composite en `lib/catalog/index.ts` y quitar `v16-uncategorized-snapshot` de `CatalogSource`.
