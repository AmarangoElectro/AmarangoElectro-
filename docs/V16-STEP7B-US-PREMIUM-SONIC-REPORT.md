# AmarangoElectro V16 Step 7B — US Premium + Sonic UX

## Objetivo

Elevar la sensación de calidad del storefront sin rediseñar la identidad aprobada, sin tocar producción y sin interferir con la migración Legacy. Este checkpoint incorpora microinteracciones de alta precisión y una capa sónica mínima inspirada en aplicaciones premium contemporáneas.

## Principios aplicados

- La performance y la integración impecable de microinteracciones se tratan como señal de calidad, no como decoración.
- El sonido nunca se reproduce por scroll, hover, timers ni al cargar la página.
- No existe música de fondo ni autoplay.
- El AudioContext se crea de forma perezosa exclusivamente durante acciones iniciadas por el usuario.
- El usuario puede silenciar o reactivar los sonidos desde el header; la preferencia se conserva en `localStorage`.
- Los sonidos son sintetizados localmente con Web Audio API: no cargan MP3/WAV, no agregan peticiones de red y no dependen de terceros.
- Las animaciones respetan `prefers-reduced-motion`.

## Sonidos incluidos

| Acción | Cue | Intención |
|---|---|---|
| botones utilitarios | `tap` | confirmación mínima |
| navegación relevante | `navigate` | transición corta |
| filtros/marca/favoritos | `filter` | feedback táctil |
| favorito | `favorite` | doble tono suave |
| compartir | `share` | brillo corto |
| consulta preparada / activar sonido | `success` | confirmación positiva |
| swipe/flechas/dots manuales del hero | `slide` | movimiento editorial |

Los cambios automáticos del hero permanecen en silencio.

## Refinamiento visual

- easing unificado de interacción `cubic-bezier(.2,.8,.2,1)`;
- press feedback breve en controles táctiles;
- elevación mínima en hover solo para dispositivos con hover real;
- zoom óptico muy leve en imagen de producto;
- foco visible más claro para teclado;
- acabado del header con sombra óptica casi imperceptible;
- se preserva el comportamiento de `prefers-reduced-motion`.

## Límites de seguridad

Este checkpoint NO:

- consulta Supabase;
- activa el catálogo real;
- modifica precios, stock o visibilidad;
- contiene escrituras administrativas;
- toca `main` ni producción;
- migra o modifica Margarita;
- conecta WhatsApp, Workers, webhooks, prompts o IA.

## Archivos principales

- `lib/ux/sonic-feedback.ts`
- `app/components/sound-toggle.tsx`
- `app/components/site-header.tsx`
- `app/components/product-card.tsx`
- `app/components/product-actions.tsx`
- `app/components/hero-slider.tsx`
- `app/components/catalog-client.tsx`
- `app/globals.css`

## Próximo paso recomendado

Mantener este acabado como capa de experiencia y volver al eje de migración: obtener un snapshot sanitizado read-only del catálogo real para validar 5–10 celulares antes de conectar cualquier fuente productiva.

## Validación de este entorno

- 4/4 tests específicos de Step 7B aprobados.
- `sonic-feedback.ts` aprobado por TypeScript en chequeo aislado.
- escaneo de la nueva capa sónica: sin `fetch`, XHR, escrituras Supabase ni métodos HTTP mutantes.
- escaneo de la nueva capa sónica: sin referencias a Margarita, WhatsApp, webhooks o Supabase.
- catálogo activo confirmado: `MockCatalogAdapter`.
- el suite completo heredado no se volvió a ejecutar aquí porque este entorno no dispone del árbol `node_modules` requerido; Step 7A ya documentaba esa limitación de reinstalación. No se declara un full build nuevo como aprobado.
