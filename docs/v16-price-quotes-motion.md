# V16 — Comparación de precios y cuotas + movimiento

La comparación muestra contado y cuotas con importes disponibles. No lee flyers,
fotos, características ni especificaciones al abrirla. Las fichas individuales
conservan sus datos técnicos. Los totales y el ajuste de la última cuota se
muestran sólo cuando existe el total de la cotización; no se inventan tasas.
La tienda del suscriptor conserva sus propios precios, tasas y permisos de plan.

Interacciones añadidas sin cambiar la estructura:

- Onda breve azul y naranja al tocar botones; también funciona con teclado.
- Apertura suave del cajón de marca y rotación de su indicador.
- El cajón recién abierto se acerca a la vista sólo si queda fuera de ella.
- Los filtros horizontales mantienen visible la opción elegida.
- Los resultados cambian con una transición de 180 ms al elegir un filtro rápido.
- Transición breve entre documentos en navegadores compatibles mediante
  `@view-transition { navigation: auto; }`; sin interceptar enlaces ni historial.
- Al cerrar la comparación se devuelve el foco al control que la abrió.

Las animaciones respetan movimiento reducido y el perfil de rendimiento.
La respuesta al toque usa eventos pasivos, ignora arrastres, enlaces externos y
OAuth. No modifica navegación, autenticación, sonido, catálogos ni workspaces.
No se regeneraron imágenes ni se alteraron los banners de inicio.

Validación: 40 pruebas dirigidas aprobadas y build oficial de Sites aprobado.
El chequeo TypeScript global sigue mostrando errores previos en módulos ajenos
a este cambio; no hay diagnósticos en los archivos modificados.
Las pruebas de eventos usan un adaptador DOM; no equivalen a QA de Android.

QA pendiente en el dispositivo: comparar 2/3 productos, alternar diferencias,
cerrar/reabrir; abrir marcas cerca del final de la pantalla; elegir una memoria
fuera del tramo visible del filtro; arrastrar la página; navegar atrás; probar
movimiento reducido y la tienda gratis/suscriptor con cuotas propias.

Referencia primaria de la transición nativa:
https://developer.chrome.com/docs/web-platform/view-transitions/cross-document
