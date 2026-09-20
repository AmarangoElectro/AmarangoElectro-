# AmarangoElectro V16 V4.9 — QA detallado

## Resultado

- Lint: **APROBADO**.
- Build Vinext: **APROBADO**.
- Tests: **127 aprobados, 0 fallidos**.
- Rutas construidas: `/`, `/categoria/[slug]`, `/producto/[slug]`, `/mi-amarango`, `/administracion`, `/plataforma`, `/amarango-os`.
- Producción/main/Supabase: **sin cambios**.

## Responsive y framing

La hoja de estilos y el preview incluyen controles explícitos para 320, 360, 390, 412 y 768 px, además de ancho automático/desktop.

| Control | Resultado técnico |
|---|---|
| Overflow horizontal | `overflow-x: clip/hidden`, grillas con `minmax(0,1fr)` y reglas específicas 320/390/760/980. Sin anchos fijos superiores al viewport en las superficies V4.9. |
| Hero mobile | Aspect ratio propio, insets por campaña, `object-fit: contain` final para piezas completas y scroll interno reiniciado al cambiar slide. |
| Categorías editoriales | Arte 4:3 contenido dentro de tarjetas 3:2 con fondo propio; ninguna parte del bitmap se recorta. |
| Logo | WebP 320×320 con transparencia; las capas visibles no usan el JPEG rectangular. |
| Header | En 320 px se ocultan acciones secundarias antes de reducir la búsqueda; no se corta el menú. |
| Margarita | 52×52 en mobile y sin texto lateral, para reducir interferencia con CTAs. |
| Admin | Tabs desplazables/compactas, flyer y formularios pasan a una columna. |
| Asesor | Accesos rápidos y catálogo pasan a una columna. |

## Assets y performance observada

| Métrica | Resultado |
|---|---:|
| Build total `dist` | 26 MB |
| Assets V4.9 | 1,1 MB |
| Assets Admin Lab | 208 KB |
| CSS construido | 301.911 bytes |
| Framework JS | 189.805 bytes |
| JS principal | 86.967 bytes |
| Chunk Admin V4.9 | 47.511 bytes |
| Chunk catálogo | 47.499 bytes |
| Chunk Advisor | 4.180 bytes |
| Hero | 6.275 bytes |

Rango de campañas V4.9 optimizadas: **56.490–238.340 bytes**. Las piezas editoriales integradas usan WebP. Las imágenes fuera del primer viewport mantienen carga diferida y el hero limita el preload al slide actual/siguiente. El autoplay duerme fuera del viewport, con pestaña oculta, ahorro de datos, red 2G o movimiento reducido.

No se publican cifras LCP/CLS/INP de laboratorio porque este checkpoint no fue desplegado ni medido en un navegador Android físico. Inventar esos valores sería engañoso. El preview permite completar esa validación antes del reemplazo productivo.

## Pruebas funcionales cubiertas

- Buscador y filtros de catálogo.
- Coincidencias con acentos/mayúsculas y modelos numéricos exactos.
- Favoritos locales.
- Compartir producto y fallback a portapapeles.
- Ficha individual y rutas de retorno.
- Estados vacíos, datos desconocidos e imágenes faltantes.
- Product Bridge y Sale Snapshot inmutables.
- Visibilidad fail-closed y normalización legacy pura.
- Admin 1.200+ productos por ventanas de 36 tarjetas.
- Calculadora y Sistema Placas internos.
- PWA, recent viewed y restauración de scroll.
- Contratos de no escritura en storefront/adaptadores/laboratorios.
- 22 entradas comerciales exactas y arquitectura canónica V16 preservada.

## Incidencias de QA

La primera corrida tuvo 6 fallos de regresión:

- 4 tests exigían el logo JPEG histórico con fondo blanco.
- 1 test asumía que ninguna ruta interna Admin podía existir bajo `app/`.
- 1 test esperaba el antiguo bloque Home de 11 categorías en lugar de la capa comercial de 22 entradas.

Se actualizaron las expectativas al contrato V4.9 sin silenciar pruebas. La segunda corrida terminó 127/127.

## QA visual pendiente antes de producción

- Recorrido en Android físico de gama media y baja.
- Medición Lighthouse/Web Vitals sobre un staging autorizado.
- Verificación manual de swipe/autoplay/pausa en Chrome Android y Safari iOS.
- Contraste y lectura final con contenido comercial real.
- Validación del logo sobre todos los artes definitivos sustituidos por Marketing.

