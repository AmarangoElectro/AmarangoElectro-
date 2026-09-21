# V16 · Herramientas + Cuidado personal & Salud · snapshot sanitizado 2026-09-20

- Fuente leída: `public.tienda_productos_incremental`.
- Operación sobre Supabase: **solo lectura**.
- Productos públicos incorporados: **101**.
- Herramientas: **63**.
- Cuidado personal & Salud: **38**.
- Se conservaron nombre, precio de venta, disponibilidad, características públicas y URL HTTPS de imagen.
- Se excluyeron costo, mayorista/proveedor, stock interno del proveedor y campos de sincronización.
- Las marcas se derivan únicamente cuando el nombre contiene una marca reconocible; si no, se usa `Varios`.
- No se inventan modelo, garantía, financiación ni especificaciones ausentes.
- Herramientas solo se enruta a subcategoría cuando el nombre lo evidencia claramente: taladros/atornilladores/rotomartillos → `taladros`; amoladoras → `amoladoras`; sierras/motosierras/caladoras → `sierras`. El resto permanece visible en la categoría principal.
- Este gate no modifica cards, CSS ni encuadre visual.

## Herramientas por subcategoría

- taladros: 19
- amoladoras: 2
- sin-subcategoria: 34
- sierras: 8

## Fotos

- HTTPS reutilizables: 100
- Sin URL HTTPS reutilizable: 1

## Rollback

Eliminar el fixture y el adaptador, retirar la fuente del composite en `lib/catalog/index.ts` y quitar `v16-tools-care-sanitized-snapshot` de `CatalogSource`.
