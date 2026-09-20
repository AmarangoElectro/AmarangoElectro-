# AmarangoElectro V16 — Consolidación acelerada V4.9

Fecha del checkpoint: 29 de agosto de 2026  
Rama de trabajo: `feat/amarango-v16-consolidacion-acelerada-20260829`  
Estado: checkpoint local; no desplegado; producción y `main` intactos.

## Resumen ejecutivo

| Antes | Qué cambió | Por qué | Comprobación |
|---|---|---|---|
| Storefront, Admin Accelerator, Ofertas y Tour existían como checkpoints/prototipos separados. | Se consolidaron en una sola base V16 con rutas separadas para Cliente, Asesor, Administración, Product Bridge y Tour. | Evitar tres catálogos y permitir una evolución incremental por permisos. | Build completo y 127 tests automáticos aprobados. |
| El header público exponía navegación técnica o no priorizaba la búsqueda. | Header retail con logo, búsqueda sticky, ayuda, favoritos y menú; accesos internos dentro de “Acceso autorizado”. | El cliente no debe ver un selector Tienda/Asesor/Admin. | Test de contrato V4.9 y revisión del HTML construido. |
| Las campañas completas podían heredar `cover` en mobile. | Hero en grid, insets seguros por campaña y regla final `contain` para full-composition artwork. | Proteger títulos, personas, productos y composición original. | Tests Step 7R.1 + V4.9; preview con selectores 320/360/390/412/tablet. |
| El logo JPEG histórico mostraba un rectángulo blanco. | Todas las capas visibles usan `/logo-320.webp`, 320×320, canal alfa y una sola capa visible. | Integrar el logo sin “sticker” blanco ni redibujarlo. | Inspección del asset (`srgba`, no opaco) y búsqueda de referencias visibles al JPEG: 0. |
| La Home mezclaba entradas arquitectónicas y categorías comerciales. | Se añadieron exactamente 22 entradas comerciales, mapeadas sobre la taxonomía canónica V16 de 11 universos. | Dar claridad al cliente sin romper rutas ni clasificaciones ya aprobadas. | Test exacto de títulos y total 22. |
| Ofertas y Flyer económico vivían solo en prototipos aislados. | Se incorporaron laboratorios interactivos persistentes en `localStorage`, sin red. | Validar UX y contrato antes de diseñar escrituras reales. | Tests de seguridad sin `fetch`, cliente Supabase ni primitivas de escritura. |

## Fuentes consolidadas

- V4.8 Storefront Polish: lenguaje visual y cabecera Cliente.
- V4.4 Admin Accelerator: tarjetas, flyer económico y flujo operativo.
- V4.7 Offers & Outlet: activación, tipos y precios promocionales independientes.
- V4.6 Unified App Tour: conexión conceptual Cliente → Asesor → Administración.
- V16 Step 7R.1 / Amarango OS V3: base técnica completa, catálogo V16, categorías, Product Bridge, PWA y seguridad.
- Handoff V4.9: assets visuales y criterios de consolidación.

## Cambios realizados

### Storefront

- Header retail sticky con búsqueda, ayuda, favoritos y menú.
- Hero rotativo conservado con autoplay, pausa, swipe, dots y movimiento decorativo.
- Framing independiente desktop/mobile; las piezas con texto integrado nunca usan `cover` como regla final.
- Franja animada de marcas con identidad tipográfica individual.
- Home editorial con 22 categorías visibles y sin pared de productos.
- Ofertas & Outlet como bloque pequeño, desactivable desde el laboratorio Admin.
- Compartir producto con una sola aparición del nombre; agrega contado y cuotas 2/4/6 solo si esos datos existen.
- Margarita se conserva como interfaz preparada, sin conexión productiva, y se compacta en mobile para no cubrir CTAs.

### Mi Amarango — Asesores

- Buscador de producto por nombre, modelo, marca y categoría.
- Productos oficiales derivados del mismo catálogo V16.
- Ficha, compartir y oferta activa.
- Accesos preparados para clientes, cuotas, seguimiento y Nueva Venta/Product Bridge.
- No expone costos, markup, caja, proveedor interno ni información financiera privada.

### Administración

- Entrada separada del storefront público.
- Admin Accelerator consolidado con catálogo en tarjetas, búsqueda, selección y bandeja masiva.
- Calculadora AmarangoElectro existente y versionada; no se inventaron fórmulas nuevas.
- Sistema Placas existente.
- Flujo Foto proveedor → Adaptar → Preview → Aprobar para flyer económico.
- Persistencia del flyer aprobado únicamente en este navegador.
- Oferta/Outlet local con encendido general, tipo, precio anterior, promocional y stock de preview.
- Matriz visible de funciones legacy preservadas; ningún botón publica en producción.

### Plataforma y PWA

- Tour unificado Cliente → Asesor → Administración.
- Contrato explícito: Product V16 es la fuente común.
- Zona del header/perfil reservada para login, Maxi/Angie, recordar dispositivo, sesión y cierre de sesión.
- Manifest, service worker y base instalable existentes preservados.

## Bugs encontrados y corregidos

1. **Regresión mobile en full-composition artwork:** una regla histórica volvía a aplicar `object-fit: cover !important`. Se reemplazó por `contain`, altura proporcional y `object-position` estable.
2. **Logo con caja blanca:** componentes de categorías y Product Bridge aún apuntaban al JPEG histórico. Las referencias visibles se migraron al WebP oficial transparente.
3. **Enlace incorrecto de oferta demo:** “PlayStation 5 Slim” dirigía a la ficha de iPhone. Ahora dirige a Gaming hasta existir un producto real validado.
4. **Accesos internos visibles como navegación principal:** se trasladaron al menú de acceso autorizado.
5. **Handoff fragmentado:** Store, Advisor, Admin y Tour no tenían rutas consolidadas. Se crearon `/`, `/mi-amarango`, `/administracion`, `/plataforma` y se preservó `/amarango-os`.
6. **Preview centrado en el CRM lab:** ahora comienza en la Home Cliente y conserva Product Bridge como vista seleccionable.
7. **Tests históricos acoplados al logo JPEG:** se actualizaron al asset transparente correcto sin reducir la cobertura.

## Seguridad confirmada

- No se modificó `main`.
- No hubo deploy ni publicación.
- No se accedió ni escribió Supabase real.
- No se ejecutaron SQL, RLS, migraciones o RPC.
- No se incorporaron credenciales ni `service_role`.
- Los laboratorios V4.9 solo escriben en `localStorage` del navegador.
- El storefront público sigue consumiendo el adaptador mock/solo lectura.
- No se conectó Margarita, WhatsApp productivo ni CRM real.

## Archivos principales incorporados o modificados en V4.9

- `app/page.tsx`
- `app/globals.css`
- `app/components/site-header.tsx`
- `app/components/hero-slider.tsx`
- `app/components/retail-category-showcase.tsx`
- `app/components/brand-logo-rail.tsx`
- `app/components/offers-showcase.tsx`
- `app/components/advisor-workspace.tsx`
- `app/components/admin-consolidated-workspace.tsx`
- `app/components/internal-space-header.tsx`
- `app/mi-amarango/page.tsx`
- `app/administracion/page.tsx`
- `app/plataforma/page.tsx`
- `lib/catalog/retail-categories.ts`
- `lib/os-lab/offers-store.ts`
- `lib/commerce/share-product.ts`
- `scripts/create-static-preview.mjs`
- `tests/v16-v49-consolidation.test.mjs`
- `public/assets/v49/*`
- `public/assets/admin-lab/*`

La entrega ZIP contiene además la historia técnica V16 heredada del checkpoint base, no solo estos archivos.

## Qué no se implementó deliberadamente

- Autenticación real, identidad Maxi/Angie y RBAC aplicado por servidor.
- Escrituras administrativas, publicación, carga de imágenes o persistencia de Ofertas/Flyers en backend.
- Catálogo productivo completo de 1.200+ productos.
- WhatsApp, Margarita, CRM, clientes, ventas, cobranzas, caja o inversiones reales.
- Deploy de staging o producción.

