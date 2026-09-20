# V16 Step 7M — Category Architecture + Banner Sections

## Objetivo
Preparar la tienda para un catálogo de 1.200+ productos sin obligar a clientes ni administradores a recorrer listas planas gigantes.

## Decisiones
- Se conservan universos ya aprobados: Celulares, Smart TV, Audio, Electrodomésticos y Gaming.
- Se agregan Herramientas, Tecnología & Accesorios, Hogar, Descanso, Cuidado personal & Salud, Bebés & Juguetes, Auto/Motos/Energía, Camping/Aire libre/Mascotas y Explorar más.
- Electrodomésticos abre Refrigeración, Climatización, Cocción, Lavado, Pequeños electrodomésticos y Limpieza.
- Hogar abre Hogar y deco, Bazar y mesa y Blanquería.
- Gaming conserva PlayStation y suma accesos claros a Juegos, Joysticks y Accesorios gamer.
- “Otros” pasa a ser fallback. No debe absorber términos ya reconocibles ni transformarse en un catálogo de cientos de artículos sin clasificación.
- Cada categoría importante y cada subcategoría importante posee un slot de banner reemplazable.
- Mientras las imágenes definitivas se preparan, V16 usa arte abstracto liviano por CSS; no introduce descargas ni dependencias externas.

## Escala y administración
- Los filtros administrativos aceptan categoría + subcategoría.
- Sigue vigente la carga progresiva de tarjetas (36 + 36) y la regla de no renderizar todo el catálogo grande de una vez.
- Reclasificaciones masivas futuras requerirán preview y confirmación Admin; Step 7M no escribe en producción.

## Datos
No se activó ninguna migración/reclasificación de catálogo real. La taxonomía nueva es una capa de navegación y resolución preparada para futuros snapshots auditados.
