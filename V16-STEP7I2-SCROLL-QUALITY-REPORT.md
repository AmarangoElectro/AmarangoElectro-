# AmarangoElectro V16 — Step 7I.2 Scroll Quality

## Objetivo
Mejorar la nitidez y estabilidad percibida durante desplazamientos rápidos, especialmente en Android táctil, sin reemplazar la física de scroll del navegador ni limitar artificialmente la velocidad del usuario.

## Diagnóstico
La base ya contenía optimizaciones Step 7G, pero mantenía `backdrop-filter` sobre varias superficies `sticky`/`fixed` (header, toolbar de catálogo, navegación de celulares y acciones móviles). El blur de fondo puede aumentar composición/rasterización mientras el contenido detrás se desplaza.

## Cambios
- `ScrollQualityManager`: escucha únicamente `scroll` con listener pasivo. No lee geometría, no usa `preventDefault`, no intercepta wheel/touchmove y no modifica la posición del scroll.
- Durante scroll activo agrega `data-scroll-activity="active"` y lo retira ~150 ms después de estabilizarse.
- En touch/coarse pointer reduce blur persistente del header/toolbars de 10–16 px a 6 px.
- Durante movimiento elimina temporalmente backdrop blur en superficies costosas y reduce sombras.
- Pausa adornos infinitos no esenciales mientras la página se mueve.
- Desactiva transiciones decorativas de cards durante el fling.
- En PWA standalone desactiva overscroll vertical para una sensación más cercana a app, sin alterar el scroll normal del documento.
- En touch se usa `scroll-behavior:auto`; no se instala ningún smooth-scroll JavaScript.

## Refresh rate
La web no fuerza 90/120 Hz. Chrome/Android renderizan a la frecuencia que el hardware, SO y navegador permitan. La optimización busca reducir trabajo por frame para sostener mejor 60/90/120 Hz cuando estén disponibles.

## Seguridad / alcance
No cambia Supabase, catálogo Legacy, precios, stock, roles, Margarita, WhatsApp, Workers ni producción.
