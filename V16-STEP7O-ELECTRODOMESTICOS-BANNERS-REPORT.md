# AmarangoElectro V16 — Step 7O · Electrodomésticos Internal Banners

## Objetivo
Cerrar visualmente el universo Electrodomésticos integrando los seis banners internos aprobados, sin tocar producción, Supabase real, RLS, SQL, Margarita/WhatsApp ni funciones administrativas.

## Integrado
- Refrigeración.
- Climatización.
- Cocción.
- Lavado.
- Pequeños electrodomésticos.
- Limpieza.

Cada sector queda conectado desde `/categoria/electrodomesticos` mediante navegación explícita por `?sector=<slug>#sector-activo`.

## Identidad visual
- Los banners mantienen el lenguaje premium limpio aprobado en Step 7N.
- El logo oficial no depende del logo reconstruido dentro de la imagen: el sitio superpone `/brand/amarango-logo-official.png`, que coincide byte a byte con el archivo original aportado por el usuario (SHA-256 verificado durante la integración).
- Se preservan abeja, colmena suave y marca de agua como lenguaje visual, sin introducir una nueva taxonomía.

## UX / responsive
- Desktop: 2 banners por fila para preservar tamaño, lectura y producto.
- Mobile/tablet: 1 banner por fila, sin miniaturizar la composición.
- El banner completo es clickeable y abre el sector seleccionado en una presentación grande.
- El usuario puede volver a Electrodomésticos sin perder el contexto de navegación.

## Performance
Los seis PNG de trabajo se optimizaron a WebP para el sitio, manteniendo resolución 1672×941. El peso servido queda aproximadamente entre 95 KB y 128 KB por banner, en lugar de ~1.6–1.8 MB por PNG.

## Continuidad / seguridad
- No se modificó la arquitectura 11 categorías + rutas V16 de compatibilidad.
- No se tocó Admin Center, Calculadora, Sistema Placas, parser Legacy ni catálogo real.
- No se agregaron escrituras, requests productivos ni cambios de Supabase.
- Diff contra Step 7N limitado a componentes/página/CSS de banners, definición de assets, tests y documentación de Step 7O.

## Validación
- Batería crítica Step 7L + 7M + 7N + 7O: 14/14 tests aprobados.
- El build completo no se ejecuta en este entorno sin `node_modules`; esto se mantiene separado de la validación source-level y no se presenta como un fallo del cambio.
