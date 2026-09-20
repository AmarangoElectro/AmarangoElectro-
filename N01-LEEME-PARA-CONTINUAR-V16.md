# AmarangoElectro V16 — checkpoint editable N01

Este paquete contiene el código fuente editable de la V16 y puede entregarse a otro ChatGPT, Codex, Claude o desarrollador para continuar el trabajo.

## Enlace público

https://amarango-v16-modelo-correcto-20260918.amarango-electro.chatgpt.site

## Estado visual de este checkpoint

- Los 22 sectores usan un sistema visual único de banners compactos: azul noche, luz cobalto/ámbar, producto a la derecha y texto HTML editable a la izquierda.
- `Todos los sectores` funciona como acordeón: un toque abre, otro toque cierra y el botón interno entra al sector.
- El buscador/encabezado oscuro ya no cambia a blanco durante el scroll táctil.
- La navegación entre categorías no usa la transición de documento que producía un destello blanco.
- Los cajones de marcas de celulares, las campañas compactas, Administración y Gaming siguen integrados.

## Dónde están las imágenes nuevas

`public/assets/v16-generated/sectors-v2/`

Hay 22 archivos WebP de 1800 × 450 px. Los nombres coinciden con los IDs declarados en `lib/catalog/retail-categories.ts`.

## Sistema visual para generar reemplazos

Usar una imagen publicitaria panorámica 4:1, fotorealista y premium. Mantener el producto principal en la mitad derecha, reservar aproximadamente 42% de espacio oscuro y calmo a la izquierda para texto HTML, usar una ambientación azul noche con luz cobalto y ámbar moderada. No incluir personas, logos, marcas, palabras, letras, números, interfaces ni marcas de agua.

Temas actuales: celulares, Smart TV, audio, refrigeración, cocción, climatización, lavado, pequeños electrodomésticos, limpieza, colchones y sommiers, blanquería, muebles, hogar y decoración, deporte y movilidad, informática, cargadores y accesorios, cuidado personal y salud, bebés, auto y motos, mascotas, gaming y otros.

## Reglas importantes para continuar

1. No escribir, migrar, borrar ni modificar datos de producción o Supabase sin autorización explícita de Max.
2. No reemplazar la taxonomía canónica ni duplicar catálogos.
3. Mantener texto, precios, CTA y rótulos importantes como HTML editable; no hornearlos dentro de las imágenes.
4. Conservar la experiencia simple: acciones frecuentes visibles, acciones secundarias dentro de cajones.
5. Revisar siempre claro, oscuro y móvil.
6. Antes de publicar, ejecutar `npm run build`, `npm run lint` y las pruebas relacionadas.

## Puesta en marcha local

```bash
npm install
npm run dev
```

## Control específico de esta tanda

```bash
node --test tests/v16-sector-drawers-continuity.test.mjs tests/v16-step7i2-scroll-quality.test.mjs
```

## Próximo bloque recomendado

Continuar por Administración: tarjetas operativas, placas pegadas desde WhatsApp, carga/edición de producto, publicación con foto, precios/cuotas, stock visible por rol y reducción de acciones secundarias. Mantener las operaciones sensibles detrás de autorización y sin escrituras reales durante la etapa visual.
