# V16 · Banners de sectores y movimiento Audio

Implementación de presentación sobre la tienda privada existente. Celulares conserva sus dos imágenes aprobadas. No cambia catálogo, productos, precios, niveles, workspaces, acceso ni cobros.

## Dirección visual y archivos

Se usó la herramienta integrada `image_gen.imagegen`, sin CLI alternativo. Cada imagen se generó con la referencia visual `public/assets/v16-generated/sectors-v2/celulares.webp`, `transparent_background: false`, sin textos ni logos incrustados. Se inspeccionaron los resultados de generación. Se conservan los originales y sólo se convierten a WebP (quality=88, method=6), sin modificar dimensiones.

Los archivos definitivos se guardan en `public/assets/v16-generated/sectors-unified-v3/` dentro del proyecto.

## Prompts finales

Cada prompt final es el texto común siguiente más `\nScene/backdrop and subjects: ` y el texto de la escena correspondiente, sin cambios adicionales.

```text
Use case: ads-marketing. Asset type: wide category photography banner for AmarangoElectro mobile storefront, no typography. Primary request: a photorealistic premium retail environmental photograph from a coordinated banner series. Color palette: deep navy blue, graphite, soft gray, natural walnut and cream, subtle warm amber-orange practical illumination, consistent blue reflections. Lighting: luminous believable photography, detail visible in shadows; gently moody but never black or murky. No neon neon rings, no gradients replacing the real room, no 3D-render or cartoon look. Composition: extremely wide landscape about 3:1, eye-level natural perspective; keep LEFT 40% calm and sparse for app text, focal products and room environment on RIGHT 60%, strongest focus in middle vertical band. Maintain believable sizes, complete product silhouettes with generous margins and no objects cut off at the edges. Crisp materials, expensive camera editorial photography, softly defocused realistic background. No text, no letters, no prices, no logos, no brand marks, no people, no collage, no frames. The uploaded phone banner is only a style and lighting reference, do not reproduce any phones.
```

### herramientas

Archivo: `public/assets/v16-generated/sectors-unified-v3/herramientas.webp`

```text
Scene/backdrop and subjects: A real organized professional workshop with a dark blue cordless drill standing on a timber workbench, an angle grinder lying beside it and a circular saw farther back. Authentic steel, rubber grips, real saw blade, wood grain, a few neat workshop shelves in background. No sparks, no person, no dramatic hazards.
```

### smart-tv

Archivo: `public/assets/v16-generated/sectors-unified-v3/smart-tv.webp`

```text
Scene/backdrop and subjects: An elegant realistic living room, large thin black television on a low walnut cabinet, realistic television screen displaying a peaceful blue ocean and warm sunset with no words; a discreet soundbar and corner of a gray fabric sofa. Architectural depth, practical room not a studio display.
```

### electrodomesticos

Archivo: `public/assets/v16-generated/sectors-unified-v3/electrodomesticos.webp`

```text
Scene/backdrop and subjects: A modern realistic integrated kitchen and adjacent laundry nook: brushed stainless refrigerator, built-in oven, washing machine in the adjacent nook, subtle coffee machine on stone countertop. Furnishings with believable scale and clean calm arrangement. Clearly a home appliance environment, not devices on floating pedestals.
```

### audio

Archivo: `public/assets/v16-generated/sectors-unified-v3/audio.webp`

```text
Scene/backdrop and subjects: A realistic comfortable music listening corner of a living room, black floorstanding speaker with visible round drivers, compact soundbar on walnut console and over-ear headphones on a proper stand nearby. A warm table lamp, navy acoustic wall details and subtle blue ambient light. Photographic room, no illustrated sound waves.
```

### hogar

Archivo: `public/assets/v16-generated/sectors-unified-v3/hogar.webp`

```text
Scene/backdrop and subjects: A realistic contemporary cozy living room featuring a gray-blue fabric sofa, walnut coffee table, warm lamp, tasteful potted plant and soft woven rug. Clear fabric and wood textures, elegant accessible home styling. No excessive objects.
```

### gaming

Archivo: `public/assets/v16-generated/sectors-unified-v3/gaming.webp`

```text
Scene/backdrop and subjects: A realistic premium gaming desk setup with a generic white-and-black vertical modern game console, a white game controller laid naturally on a matte navy desk and gaming headset on a stand, with a monitor in the background showing abstract blue landscape and no text. Accurate controller geometry and no trademarks. Room environment not floating product pedestal.
```

### descanso

Archivo: `public/assets/v16-generated/sectors-unified-v3/descanso.webp`

```text
Scene/backdrop and subjects: A realistic serene modern bedroom with a well-made upholstered bed and thick quality mattress, cream linen bedding folded to reveal mattress side, navy padded headboard, small walnut nightstand and warm bedside lamp. Natural tactile linen, soft fabric, restful environment.
```

### otros

Archivo: `public/assets/v16-generated/sectors-unified-v3/otros.webp`

```text
Scene/backdrop and subjects: A realistic curated home shelf and entryway corner with an attractive small indoor plant, a simple backpack, a cordless handheld vacuum and compact small home accessories neatly arranged. Walnut shelf, muted navy details, brushed metal, clear restrained composition suggesting other useful home categories.
```

### climatizacion

Archivo: `public/assets/v16-generated/sectors-unified-v3/climatizacion.webp`

```text
Scene/backdrop and subjects: A realistic contemporary living room with a wall-mounted white split air conditioner clearly visible on the upper right, tasteful navy sofa underneath, a compact freestanding fan near a walnut side table, and a soft warm lamp. Real residential environment with natural depth, believable scale and a comfortable airy atmosphere. No invented controls or labels.
```

### tecnologia-accesorios

Archivo: `public/assets/v16-generated/sectors-unified-v3/tecnologia-accesorios.webp`

```text
Scene/backdrop and subjects: A realistic neat home office, modern laptop opened on a walnut desk with a blue landscape on its screen, wireless keyboard and mouse, compact USB hub and tablet on a stand. Navy wall, warm desk lamp and understated blue reflections, true everyday technology environment.
```

### cuidado-personal-salud

Archivo: `public/assets/v16-generated/sectors-unified-v3/cuidado-personal-salud.webp`

```text
Scene/backdrop and subjects: A realistic bright and elegant bathroom vanity corner with a hair dryer, electric shaver and simple bathroom scale, soft folded cream towels and a mirror. Navy lower cabinets, light stone countertop, warm wall light. Clean accessible personal care environment.
```

### bebes-juguetes

Archivo: `public/assets/v16-generated/sectors-unified-v3/bebes-juguetes.webp`

```text
Scene/backdrop and subjects: A realistic calm nursery and family playroom with a small wooden toy train, tasteful building blocks, soft teddy bear and neatly folded baby blanket on a low walnut storage shelf. Muted navy storage details, cream textiles and warm lamp. No people, no excessive toys.
```

### auto-motos-energia

Archivo: `public/assets/v16-generated/sectors-unified-v3/auto-motos-energia.webp`

```text
Scene/backdrop and subjects: A realistic tidy garage workbench area with a compact automotive battery charger, a jump starter and car care accessories, with a softly blurred partial car body far in the background. Navy walls, natural walnut and steel workbench, warm practical lights. No visible registration or labels.
```

### camping-aire-libre-mascotas

Archivo: `public/assets/v16-generated/sectors-unified-v3/camping-aire-libre-mascotas.webp`

```text
Scene/backdrop and subjects: A realistic dusk outdoor campsite, navy dome camping tent, a folding chair and a warm glowing camping lantern beside a neatly rolled sleeping bag. Forest and a calm lake in background, soft blue twilight and amber illumination, natural outdoor environment, no people or animals.
```

## Integración y validación

- Carrusel principal: restaurado exactamente al modelo publicado anterior (Sites source c73add05cb0f8392a6343de4c47fd786696ba5e5), con las seis imágenes de campaña originales. Los banners grandes de inicio quedan preservados; la actualización visual se limita a los ovalados y sectores.
- Nueve entradas ovaladas de inicio: misma estructura. Celulares intacto.
- Encabezados de categorías: escena apropiada por categoría. Climatización usa su propia escena; Refrigeración usa la escena de electrodomésticos. No cambia el catálogo mostrado.
- Audio: onda decorativa animada únicamente en la entrada ovalada de inicio y el encabezado del sector. No reproduce audio; pausa fuera de pantalla o con pestaña oculta y respeta reducción de movimiento.
- Regresión existente: 14 de 17 comprobaciones pasan. Las otras 3 fallan de igual forma en el HEAD limpio previo: destino antiguo de favoritos, enlace fijo del pie reemplazado por navegación por rol y búsqueda antigua de `filtered.map` en Todos los sectores. No son fallas introducidas por estos banners.
- Revisión visual en Android pendiente: no hubo dispositivo ni navegador de QA habilitado en esta sesión. No se declara PASS de Android.
