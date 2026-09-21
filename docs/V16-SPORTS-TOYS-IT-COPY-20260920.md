# V16 · Deportes + Juguetes + Informática · snapshot sanitizado 2026-09-20

- Fuente leída: `public.tienda_productos_incremental`.
- Operación sobre Supabase: **solo lectura**.
- Filas públicas procesadas: **37**.
- Se conservaron nombre, precio de venta, disponibilidad, características públicas y URL HTTPS de imagen.
- Se excluyeron costo, mayorista/proveedor, stock interno del proveedor y campos de sincronización.
- Las marcas se derivan únicamente cuando aparecen literalmente en el nombre; si no, se usa `Varios`.
- No se inventan modelo, garantía, financiación ni especificaciones ausentes.
- Las 37 filas tienen URL HTTPS reutilizable.
- Este gate no modifica cards, CSS ni taxonomía pública del storefront.

## Destino lógico

- tecnologia-accesorios: 5
- bebes-juguetes: 12
- deportes-movilidad: 20

## Nota de taxonomía

- Informática se integra al sector existente `tecnologia-accesorios`.
- Juguetes se integra a `bebes-juguetes / juguetes`.
- Deportes y movilidad se conserva como categoría lógica `deportes-movilidad` porque la V16 actual no expone todavía una página pública dedicada y el storefront está congelado. No se fuerza a Camping ni Auto/Motos para evitar una clasificación incorrecta.

## Rollback

Eliminar el fixture y el adaptador, retirar la fuente del composite en `lib/catalog/index.ts` y quitar `v16-sports-toys-it-snapshot` de `CatalogSource`.
