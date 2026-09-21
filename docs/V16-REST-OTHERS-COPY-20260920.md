# V16 · Descanso + Otros · snapshot sanitizado 2026-09-20

- Fuente leída: `public.tienda_productos_incremental`.
- Operación sobre Supabase: **solo lectura**.
- Filas públicas procesadas: **42**.
- Fotos HTTPS reutilizables: **42**.
- Se conservaron nombre, precio de venta, disponibilidad, características públicas y foto.
- Se excluyeron costo, mayorista/proveedor, stock interno del proveedor y campos de sincronización.
- No se inventan modelo, garantía, financiación ni especificaciones ausentes.
- Los productos de "Otros" solo se reclasifican cuando el nombre hace evidente el destino.
- Los ambiguos permanecen en `otros` para revisión posterior.
- Este gate no modifica cards, CSS ni taxonomía pública del storefront.

## Destino lógico

- hogar: 22
- otros: 13
- deportes-movilidad: 1
- electrodomesticos: 1
- auto-motos-energia: 1
- smart-tv: 1
- descanso: 3

## Subcategorías

- hogar-y-deco: 9
- (sin subcategoría): 15
- blanqueria: 1
- bazar-y-mesa: 12
- pequenos-electrodomesticos: 1
- energia: 1
- colchones-y-sommiers: 3

## Permanecen en Otros (13)

- BALANZA COMERCIAL CROMA
- Balanza comercial digital Systel Cuora Max ST 30kg 100V/240V blanco 365 mm x 240 mm
- BALANZA COMERCIAL SYSTEL CLIPSE
- BALANZA KRETZ NOVEL ECO 2 30KG MULTI RANGO PPI
- BALANZA KRETZ NOVEL ECO 2 30KG MULTI RANGO PPI
- Balanza Systel Cuora Max ST
- CONTADORA DE BILLETES ALIEN TECH PORTATIL
- Contadora De Billetes Global
- Contadora de billetes OSR
- CONTADORA DE BILLETES PORTATIL DAIHATSU
- PARAGUAS TRENDY 29000
- SOPLADOR X9
- VALIJA CARRY ON MTL 20” RUEDAS GIRATORIAS 360

## Rollback

Eliminar el fixture y el adaptador, retirar la fuente del composite en `lib/catalog/index.ts` y quitar `v16-rest-others-snapshot` de `CatalogSource`.
