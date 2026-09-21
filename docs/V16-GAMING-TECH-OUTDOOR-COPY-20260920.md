# V16 · Gaming + Tecnología & Accesorios + Camping · snapshot sanitizado 2026-09-20

- Fuente leída: `public.tienda_productos_incremental`.
- Operación sobre Supabase: **solo lectura**.
- Filas públicas procesadas: **27**.
- Se conservaron nombre, precio de venta, disponibilidad, características públicas y URL HTTPS de imagen.
- Se excluyeron costo, mayorista/proveedor, stock interno del proveedor y campos de sincronización.
- Las marcas se derivan únicamente cuando aparecen literalmente en el nombre; si no, se usa `Varios`.
- No se inventan modelo, garantía, financiación ni especificaciones ausentes.
- Las 27 filas tienen URL HTTPS reutilizable.
- Este gate no modifica cards, CSS ni encuadre visual.

## Destino final

- camping-aire-libre-mascotas: 11
- gaming: 8
- audio: 5
- tecnologia-accesorios: 3

## Reclasificaciones evidentes desde "Cargadores y accesorios"

- *AURICULARES NETMAK VOLT BLUETOOTH 5.3 SONIDO HI-FI DURACION DE 🔋10hs → audio / auriculares
- Auricular JBL TUNE T125BT → audio / auriculares
- AURICULAR X-TECH ORIGINAL PRINCESAS DISNEY XTHD274PS → audio / auriculares
- Auriculares Red Dragon H848 → audio / auriculares
- PARLANTE LAMPARA ARO LUZ LED → audio / parlantes-portatiles

## Rollback

Eliminar el fixture y el adaptador, retirar la fuente del composite en `lib/catalog/index.ts` y quitar `v16-gaming-tech-outdoor-snapshot` de `CatalogSource`.
