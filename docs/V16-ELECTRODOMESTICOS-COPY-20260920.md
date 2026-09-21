# V16 · Electrodomésticos · snapshot sanitizado 2026-09-20

- Fuente leída: `public.tienda_productos_incremental`.
- Operación sobre Supabase: **solo lectura**.
- Productos públicos incorporados: **224**.
- Se conservaron nombre, precio de venta, categoría/subcategoría, disponibilidad, características públicas y URL HTTPS de imagen.
- Se excluyeron costo, mayorista/proveedor, stock interno del proveedor, claves de sincronización y otros campos operativos.
- Las marcas se derivan únicamente cuando el nombre del producto contiene una marca reconocible; si no, se usa `Varios`.
- No se inventan modelo, garantía, financiación ni especificaciones ausentes.
- Una imagen no HTTPS queda como `null` en lugar de incrustar un data URI.
- Este gate no cambia estilos ni encuadre visual de las cards.

## Conteos por subcategoría

- pequenos-electrodomesticos: 67
- refrigeracion: 47
- climatizacion: 42
- coccion: 24
- limpieza: 11
- lavado: 33

## Fotos

- HTTPS reutilizables: 223
- Sin URL HTTPS reutilizable: 1

## Rollback

Eliminar el fixture y el adaptador, retirar la fuente del composite en `lib/catalog/index.ts` y quitar el valor `v16-electro-sanitized-snapshot` del tipo `CatalogSource`.
