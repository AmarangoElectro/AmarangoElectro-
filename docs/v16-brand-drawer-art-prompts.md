# Fondos de los cajones de marcas — AmarangoElectro V16

Creación: herramienta integrada de generación de imágenes (sin CLI/API externa).

Uso: fondos fotográficos nuevos para marcas sin campaña propia. Los nombres, descripciones y accesos son texto real de la app, para mantener legibilidad y evitar errores de texto en las imágenes. Las campañas aprobadas y el carrusel grande de Inicio se conservan.

Modo claro: fotografía luminosa, nombre azul oscuro y detalles azules/naranjas. Modo oscuro: misma fotografía con capa navy y texto claro; no se duplican descargas. Las imágenes ambientales no agregan modelos, precios ni especificaciones al catálogo.

## Archivos finales

- [audio.webp](sandbox:/workspace/scratch/c45519de2f7b/v16-source-readonly/public/assets/v16-generated/brand-drawers-v1/audio.webp)
- [smart-tv.webp](sandbox:/workspace/scratch/c45519de2f7b/v16-source-readonly/public/assets/v16-generated/brand-drawers-v1/smart-tv.webp)
- [crown-audio.webp](sandbox:/workspace/scratch/c45519de2f7b/v16-source-readonly/public/assets/v16-generated/brand-drawers-v1/crown-audio.webp)
- [xiaomi-audio.webp](sandbox:/workspace/scratch/c45519de2f7b/v16-source-readonly/public/assets/v16-generated/brand-drawers-v1/xiaomi-audio.webp)
- [novik-audio.webp](sandbox:/workspace/scratch/c45519de2f7b/v16-source-readonly/public/assets/v16-generated/brand-drawers-v1/novik-audio.webp)
- [telefunken-audio.webp](sandbox:/workspace/scratch/c45519de2f7b/v16-source-readonly/public/assets/v16-generated/brand-drawers-v1/telefunken-audio.webp)
- [lavado.webp](sandbox:/workspace/scratch/c45519de2f7b/v16-source-readonly/public/assets/v16-generated/brand-drawers-v1/lavado.webp)
- [refrigeracion.webp](sandbox:/workspace/scratch/c45519de2f7b/v16-source-readonly/public/assets/v16-generated/brand-drawers-v1/refrigeracion.webp)
- [coccion.webp](sandbox:/workspace/scratch/c45519de2f7b/v16-source-readonly/public/assets/v16-generated/brand-drawers-v1/coccion.webp)
- [pequenos-electrodomesticos.webp](sandbox:/workspace/scratch/c45519de2f7b/v16-source-readonly/public/assets/v16-generated/brand-drawers-v1/pequenos-electrodomesticos.webp)
- [limpieza.webp](sandbox:/workspace/scratch/c45519de2f7b/v16-source-readonly/public/assets/v16-generated/brand-drawers-v1/limpieza.webp)
- [herramientas.webp](sandbox:/workspace/scratch/c45519de2f7b/v16-source-readonly/public/assets/v16-generated/brand-drawers-v1/herramientas.webp)
- [descanso.webp](sandbox:/workspace/scratch/c45519de2f7b/v16-source-readonly/public/assets/v16-generated/brand-drawers-v1/descanso.webp)

## Prompt base exacto

```text
Use case: ads-marketing. Asset: photorealistic ultra-wide 3:1 website accordion brand banner background for AmarangoElectro. Premium consumer-electronics lifestyle campaign, coherent with existing iPhone and AIWA banners: realistic contemporary architecture, a large soft arch/open window overlooking distant mountains and water, polished pale travertine, subtle warm wood, cream/pearl/silver with tiny muted-blue details. Editorial high-end product photography, realistic materials, no cartoon, no neon sci-fi. Compose main relevant unbranded products on the RIGHT HALF, keep left 42% beautiful clean quiet negative space for brand typography which the website adds. Camera straight at low product height, very wide panorama, generous right edge margin. NO TEXT, NO LETTERS, NO LOGOS, NO WATERMARK, NO BUTTONS, NO FRAME. Do not add people, prices or claims. Full bleed background.
```

## Escenas y prompts

Cada prompt final concatena el prompt base con `Scene: `, la escena siguiente, y ` Lighting: bright natural daylight, subtle golden afternoon light, legible light-mode campaign.`

### audio

```text
A black powerful floor-standing party speaker with two circular woofers and a compact silver portable speaker, in an elegant listening room with acoustic wood wall and water-view arch. The floor speaker is fully visible, occupies right 50% of image.
```

### smart-tv

```text
An ultra-thin large television on a travertine media console in a quiet contemporary living room. Television screen shows a realistic distant mountain landscape. Only screen and living-room relevant objects, NO phones or washing machines.
```

### crown-audio

```text
Sound equipment: two powerful black floor-standing party speakers with large round woofers, a small wireless microphone placed nearby on a travertine shelf, elegant modern listening lounge overlooking water through a large arch. No television, no headphones. Products clustered right.
```

### xiaomi-audio

```text
A compact refined graphite portable Bluetooth speaker with woven mesh and a simple cylindrical travel speaker on a travertine side table in a serene contemporary listening lounge, quiet mountain lake seen through an arch. No phones or televisions. Products right, clean wall left.
```

### novik-audio

```text
A rugged black professional amplified PA loudspeaker with a single large woofer and horn above it on a low display pedestal, small microphone beside it, tasteful home music studio with acoustic timber slats and a large arched window. No DJ branding, no crowds, no concert lights. Right half equipment.
```

### telefunken-audio

```text
A long premium graphite soundbar and compact black powered portable speaker on a warm wood media cabinet in a refined living-room listening corner beside a large light stone arch, water and distant mountains outside. No television. Equipment on right.
```

### lavado

```text
A contemporary laundry room with one silver front-loading washer and a white top-loading washing machine on the right, woven laundry basket and carefully folded white towels on counter, cream stone and pale oak cabinets, arched window garden sunlight. No television, refrigerator or speakers.
```

### refrigeracion

```text
A refined contemporary kitchen with one silver refrigerator and a compact white chest freezer on the right, stone countertop, warm pale oak cabinetry and distant greenery through arched opening. No ovens or washers. Products not exaggerated, ordinary realistic functional appliances.
```

### coccion

```text
A beautifully arranged contemporary kitchen with one freestanding stainless steel cooker with oven and four burners, a countertop electric oven and a compact microwave on the right, warm pale oak, travertine counters, arched garden window. No refrigerators or laundry equipment.
```

### pequenos-electrodomesticos

```text
A refined pale oak and travertine kitchen counter with a glass pitcher blender, cream electric kettle, black air fryer and a compact coffee machine grouped on the right. No large kitchen appliances. Soft water-view arch in background.
```

### limpieza

```text
Bright organized utility corner adjoining a contemporary garden-facing home, a cordless stick vacuum upright next to a compact pressure washer and round robot vacuum on right, pale wood cabinet, stone floor, soft arch and greenery. No other appliances.
```

### herramientas

```text
A clean premium practical workshop with cordless drill, angle grinder and circular saw arranged right on a pale wood workbench. Steel tool drawers, orderly workshop wall, large arched industrial window with a calm garden outside. Muted blue and orange minor product accents, realistic tools, no logos.
```

### descanso

```text
A luxurious peaceful but believable bedroom with a king-size bed and full upholstered mattress, cream linen bedding, blue-grey throw, warm oak nightstand with a soft lamp on right, large arched window toward mountain lake. Keep left 42% quiet wall and unobstructed space. No electronics.
```

