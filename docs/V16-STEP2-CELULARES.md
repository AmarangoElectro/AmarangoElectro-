# AmarangoElectro V16 — Step 2 (Celulares)

## Objetivo
Desarrollar el universo Celulares dentro de la nueva tienda, sin tocar el contrato read-only del catálogo ni mezclar lógica comercial con diseño.

## Cambios incluidos
- Nuevo bloque visual `CelularesBrandUniverse` en `/categoria/celulares`.
- Presentación diferenciada para 4 experiencias principales:
  - Apple / iPhone
  - Samsung
  - Motorola
  - Infinix
- Banda secundaria preparada para Xiaomi y futuras líneas.
- Cada bloque conecta al filtro real del catálogo mediante `?marca=<marca>#catalogo`.
- Responsive en desktop y mobile.

## No se modificó
- Supabase read-only contract.
- Catálogo, datos, stock o precios.
- Home principal, excepto continuidad visual heredada.
- Funciones de compartir / favoritos / consulta.
