# AmarangoElectro V16 Step 7R.1 — Banner Framing Fix

## Resumen ejecutivo

Step 7R.1 toma como base exclusiva `AmarangoElectro-V16-Step7R-Approved-Category-Assets.zip` y corrige el encuadre de los banners principales de **Tecnología & Accesorios**, **Hogar** y **Descanso**. No rediseña la tienda ni altera navegación, catálogo, Admin o integraciones.

Antes, cada arte completo de 1672×941 se insertaba dentro de una caja que ocupaba solo el 57% del hero y la imagen recibía `cover`. En desktop 1363 px, por ejemplo, el lienzo de Tecnología se mostraba dentro de 690 px de los 1213 px disponibles. Eso ampliaba el arte y eliminaba parte de su composición lateral.

Ahora los tres banners declaran explícitamente `full-composition`: usan el ancho completo del hero, conservan el lienzo en desktop/tablet y pasan a un recorte focalizado independiente en mobile. Los banners focales anteriores de Electrodomésticos y Herramientas no fueron modificados.

## Causa raíz

1. Los nuevos assets fueron diseñados como composiciones completas: mitad izquierda limpia para texto y productos sobre la derecha.
2. `PremiumCategoryHero` heredaba el framing de los banners focales anteriores: área de arte al 57%.
3. `next/image` agrega `object-fit: cover` inline en imágenes `fill`; por eso una regla común sin prioridad no podía recuperar el lienzo completo.
4. En mobile se necesitaba una estrategia distinta: texto arriba, arte abajo y foco por categoría.

## Cambios realizados

- Se agregó el contrato `CategoryBannerFraming` con `focused-art` y `full-composition`.
- Tecnología & Accesorios, Hogar y Descanso usan `full-composition`.
- `PremiumCategoryHero` publica `data-banner-framing` y `data-banner-slug` para desacoplar contenido de presentación.
- Desktop: arte al 100%, `contain`, anclaje derecho y máscara suave sobre el área textual.
- Tablet: `contain`, anclaje inferior derecho y transición más protectora para el texto.
- Mobile: bloque de arte de 350 px anclado al fondo, `cover` y foco independiente por categoría.
- Se mantuvo un espacio real entre beneficios y arte; ninguna imagen se monta sobre el texto.

## Bugs encontrados y corregidos

| Bug | Estado | Corrección |
| --- | --- | --- |
| Composición completa dentro de un área de solo 57% | Corregido | Framing `full-composition` al 100% |
| `object-fit: cover` inline anulaba el primer intento de `contain` | Corregido | Override acotado únicamente al nuevo framing |
| El primer ajuste heredaba `top: 0` en mobile | Corregido durante QA | `inset: auto 0 0` para anclar el arte abajo |
| Test renderizado seguía exigiendo metadata Step 7Q | Corregido | Expectativa actualizada a Step 7R.1 |

## Validación responsive

| Vista | Resultado |
| --- | --- |
| 320 px | Título completo, arte separado, overflow 0 |
| 360 px | Título completo, arte separado, overflow 0 |
| 390 px | Título completo, beneficios legibles, overflow 0 |
| 412 px | Composición equilibrada, overflow 0 |
| Tablet 768 px | Arte completo con `contain`, overflow 0 |
| Tablet amplia 980 px | Los tres banners completos, overflow 0 |
| Desktop 1363 px | Arte al 100% del hero, overflow 0 |

En el harness móvil la barra de scroll interna redujo el ancho efectivo en 17 px; también se validaron anchos más exigentes de 303, 343, 373 y 395 px. La distancia mínima medida entre la fila de beneficios y el inicio del arte fue de 64 px.

## Regresión de banners no afectados

- Herramientas: `focused-art`, relación arte/hero 0,569, overflow 0.
- Electrodomésticos: `focused-art`, relación arte/hero 0,569, overflow 0.
- Consola del navegador: 0 errores o warnings de la aplicación durante la revisión.

## Pruebas

- `npm run lint`: **PASS**.
- `npm run build`: **PASS**.
- `node --test tests/*.test.mjs`: **113/113 PASS**.
- Test específico Step 7R.1: framing limitado a tres categorías, breakpoints desktop/tablet/mobile y contrato read-only.
- Revisión visual: Tecnología & Accesorios, Hogar y Descanso en mobile, tablet y desktop.

La primera ejecución completa mostró 112/113 tests porque una prueba histórica todavía esperaba el título Step 7Q. Se corrigió esa expectativa. Durante la reconstrucción del paquete final se intentó ejecutar build y tests en paralelo: 3 pruebas que dependen de `dist` comenzaron antes de que el build lo generara y el resultado transitorio fue 110/113. Se repitió la secuencia correcta —build primero, tests después— y la batería final quedó **113/113**. Ninguno de esos fallos correspondió a la lógica visual o funcional del sitio. La advertencia de proxy del build pertenece al entorno de ejecución y no al sitio.

## Performance

- No se agregaron imágenes, scripts, listeners ni requests.
- Se reutilizan los WebP Step 7R de 62–109 KB.
- La geometría del hero continúa reservada; el cambio no introduce saltos de layout.
- El framing es CSS y no modifica lazy loading, animaciones ni scroll.

## Seguridad y alcance

- Sin cambios en `main` ni producción.
- Sin conexión ni escritura en Supabase real.
- Sin SQL, RLS, Storage writes o sincronizaciones.
- Sin cambios en CRM, Margarita, WhatsApp o IA.
- Sin categorías o productos inventados.
- Logo oficial conservado como asset real y sin recreación.
- Admin, Legacy y navegación preservados.

## Archivos modificados

- `app/components/premium-category-hero.tsx`
- `app/globals.css`
- `app/layout.tsx`
- `lib/catalog/categories.ts`
- `tests/rendered-html.test.mjs`
- `tests/v16-step7r1-banner-framing.test.mjs`
- `scripts/create-static-preview.mjs`
- `package.json`
- `README.md`
- `docs/CHECKPOINTS.md`
- `V16-STEP7R1-BANNER-FRAMING-FIX-REPORT.md`

## Riesgos restantes

- La validación visual fue realizada en navegador desktop con marcos responsive exactos; sigue siendo recomendable una mirada final en uno o dos Android físicos.
- Los artes internos de las subcategorías pendientes siguen fuera de este ajuste.

## Próximo paso recomendado

Conservar Step 7R.1 como checkpoint visual estable. Continuar luego con los banners internos aprobados de Tecnología & Accesorios, Hogar y Descanso, aplicando el mismo contrato de framing por asset sin alterar la taxonomía.
