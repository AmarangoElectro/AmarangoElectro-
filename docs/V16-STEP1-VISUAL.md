# AmarangoElectro V16 — Paso 1: integridad visual global

Este checkpoint parte de V15 y modifica únicamente presentación visual.

- Se conserva V15 original intacta.
- El logo oficial conserva su diseño interno; solo se elimina el cuadrado blanco exterior mediante transparencia circular. El original queda en `public/logo-original.png`.
- Header, escenario institucional, sección de marca y footer usan proporción cuadrada para evitar deformación del círculo.
- Desktop conserva el encuadre V15 y el movimiento cinematográfico.
- En móvil, los banners de imagen usan el asset vertical completo (`object-fit: contain`) dentro de un artboard 941:1672.
- Un fondo derivado del mismo banner rellena diferencias de relación de aspecto sin barras duras.
- El movimiento móvil parte de 0.988 y termina en 1.0 para no cortar letras en los bordes.
- `prefers-reduced-motion` sigue respetado.

No se modificaron catálogo, rutas, Supabase, favoritos, compartir, consulta, roles ni lógica comercial.
