# V16 · Smart TV + Audio · snapshot sanitizado 2026-09-20

- Fuente leída: `public.tienda_productos_incremental`.
- Operación sobre Supabase: **solo lectura**.
- Productos públicos incorporados: **74**.
- Se conservaron nombre, precio de venta, categoría/subcategoría, disponibilidad, características públicas y URL HTTPS de imagen.
- Se excluyeron costo, mayorista/proveedor, stock interno del proveedor, claves de sincronización y otros campos operativos.
- Las marcas se derivan solo cuando el nombre contiene una marca reconocible; si no, se usa `Varios`.
- No se inventan modelo, garantía, financiación ni especificaciones ausentes.
- Las 74 filas tienen URL HTTPS reutilizable.
- Un producto evidentemente mal clasificado en la fuente (`TORRE DE LAVADO CODINI 10/9 KG 1400 RPM INVERTER`) se enruta a `electrodomesticos/lavado` y no a Audio.
- Este gate no modifica estilos ni encuadre visual de imágenes.

## Conteos

- smart-tv: 29
- audio: 44
- electrodomesticos: 1

### Audio por subcategoría

- torres: 9
- auriculares: 1
- parlantes-portatiles: 32
- barras-de-sonido: 1
- home-audio: 1

## Rollback

Eliminar el fixture y el adaptador, retirar la fuente del composite en `lib/catalog/index.ts` y quitar `v16-media-sanitized-snapshot` de `CatalogSource`.
