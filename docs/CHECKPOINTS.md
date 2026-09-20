# Checkpoints

## V14 original

- Archivo: `public/reference/amarango-mega-home-v14-original.zip`
- SHA-256: `af9625aa43f2389866cd8ec3689539e0bb5ecbd5e6e84a9da6cc094e77212d3b`
- Estado: copia byte-idéntica al adjunto recibido.

## Fuente V14 extraída

- Archivo: `public/reference/index-v14-original.html`
- SHA-256: `20d598f409d74b14d4146f15fe75f4ae024030ccd8a0cf2fca9876fc7e36b477`

## V15

- Rama de trabajo: `feat/amarango-v15-integration-20260827`
- Proyecto separado de la tienda actual.
- Producción y repositorio original: no modificados.

## V16 Step 7 — Legacy Catalog Pilot

- Rama de trabajo: `feat/amarango-v16-step7-legacy-catalog-pilot-20260827`.
- Base Step 6: `4395c00`.
- ZIP legacy auditado: SHA-256 `49aeb962b14216c2d1e26820e1cf8771a2cf85bf487847b55456ebf47f9e4005`.
- Estado: adaptador, buscador, reglas read-only, compartir y documentación completos.
- Catálogo real: no activado por falta de snapshot sanitizado.
- Producción, `main` y Supabase real: no modificados.

## V16 Step 7A — Snapshot Gate

- Deriva únicamente del ZIP Step 7; producción permanece intacta.
- Agrega una frontera offline de sanitización por allowlist antes del normalizador.
- Amplía la detección de marcas de celulares según el legacy ya auditado.
- Mejora diagnósticos conservadores de duplicados sin ocultamiento automático.
- Catálogo real sigue sin activarse; Supabase no consultado.
- Margarita/IA/WhatsApp: PENDIENTE — NO MIGRAR TODAVÍA.


## V16 Step 7B — US Premium + Sonic UX

- Deriva de Step 7A; producción permanece intacta.
- Agrega microinteracciones premium y feedback sonoro local controlable.
- Sin autoplay, música, audio externo ni sonido por scroll/hover/timers.
- Catálogo real no activado; `MockCatalogAdapter` permanece activo.
- Margarita/IA/WhatsApp: PENDIENTE — NO MIGRAR TODAVÍA.

## V16 Step 7C — US Premium Discovery

- Deriva de Step 7B; producción permanece intacta.
- Agrega autocomplete local, submit explícito y recuperación de errores de escritura.
- Sugerencias derivadas del `Product[]` disponible, sin servicios externos ni telemetría.
- Modelos alfanuméricos/numerados mantienen coincidencia estricta; no hay autocorrección automática.
- Catálogo real no activado; `MockCatalogAdapter` permanece activo.
- Margarita/IA/WhatsApp: PENDIENTE — NO MIGRAR TODAVÍA.


## V16 Step 7D — US Premium PDP

- Step 7C se mantiene como checkpoint anterior.
- Tarjetas de producto enriquecidas para catálogo técnico.
- Quick View descartado deliberadamente para productos spec-driven.
- Ficha con ampliación de imagen, entrada refinada, CTA sticky móvil, bloques verticales de decisión y relacionados deterministas.
- View Transitions aplicada solo como mejora progresiva.
- `MockCatalogAdapter` continúa activo.
- Producción, Supabase real, administración Legacy, Margarita, IA y WhatsApp permanecen fuera de alcance.

## V16 Step 7E — US Premium Product Comparison

- Step 7D se mantiene como checkpoint anterior.
- Agrega comparación persistente de hasta 3 productos de una misma categoría.
- Bandeja de selección + panel lado a lado con “solo diferencias” por defecto.
- Usa únicamente campos existentes de `Product`; datos ausentes permanecen “A confirmar”.
- Selección guardada solo en `localStorage`; sin red ni telemetría.
- Nuevo feedback sonoro local para acción de comparar.
- `MockCatalogAdapter` continúa activo.
- Producción, Supabase real, administración Legacy, Margarita, IA y WhatsApp permanecen fuera de alcance.


## V16 Step 7F — US Premium Decision & Consultation Flow

- Step 7E se mantiene como checkpoint anterior.
- La acción principal de PDP pasa a `Quiero este`.
- Agrega un handoff local con cuatro intenciones: comprar, cuotas, disponibilidad y entrega.
- Revisión obligatoria antes del handoff y opción de copiar el resumen.
- No recopila datos personales ni persiste el borrador.
- El nuevo evento `amarango:purchase-intent` es independiente de Margarita.
- `margarita-button.tsx` permanece byte-idéntico respecto de Step 7E.
- `MockCatalogAdapter` continúa activo.
- Producción, Supabase real, administración Legacy, Margarita, IA y WhatsApp permanecen fuera de alcance.

- **Step 7J — Admin Center Foundation:** parser fail-closed de listas, preview obligatorio, USD/proveedor y nuevos productos ocultos; sin Auth/RLS/escrituras activas.

## V16 Step 7K.1 — Screenshot Parity Lock + Faster Admin UX
- Capturas reales del Admin convertidas en contrato explícito de paridad.
- Nuevas capacidades bloqueadas: insights de demanda/promoción, QR, compartir tienda/varios, apariencia/sonido/tema, copy/Instagram/descarga, conversiones Costo↔Venta, reemplazo total, sesión segura de fotos, Equipo de eventos y más.
- Editor individual de una sola superficie y centro de herramientas agrupado.
- 53/53 tests acumulados Step 7B→7K.1 aprobados en batería específica.
- Sin ruta Admin pública ni escrituras productivas.

## Step 7M — Category Architecture + Banner Sections
- Jerarquía de 14 universos con sub-banners por sector.
- Conserva Celulares/Smart TV/Audio/Gaming y suma los nuevos sectores aprobados.
- Preparado para 1.200+ productos; “Otros” es fallback, no categoría masiva.
- Sin escrituras productivas.

## V16 Step 7M.1 — Taxonomy Alignment + Compatibility Lock
- Alinea la navegación principal a las 11 categorías aprobadas.
- Celulares, Smart TV y Audio quedan preservados como rutas V16 de compatibilidad, fuera del conteo/navegación principal.
- Gaming: PlayStation activo; Xbox/Nintendo/Accesorios gamer preparados; Juegos/Joysticks preservados como compatibilidad.
- Los slots de banners corresponden solo a categorías/subcategorías activas.
- 8/8 tests críticos Step 7L + Step 7M.1 aprobados.
- Producción, Supabase real, RLS, SQL y Margarita/WhatsApp permanecen intactos.

## V16 Step 7Q — Category Completion

- Deriva exclusivamente del checkpoint oficial Step 7P.
- Conserva Electrodomésticos y Herramientas con sus banners editoriales aprobados.
- Completa el sistema visual premium de las 11 categorías principales con estados de imagen reemplazables.
- Tecnología & Accesorios, Hogar, Descanso, Cuidado personal & Salud, Bebés & Juguetes, Auto/Motos/Energía, Camping/Aire libre/Mascotas y Gaming ya tienen hero, navegación y sector activo coherentes.
- “Explorar más” incorpora búsqueda, filtros de navegación y revelado progresivo, sin listas interminables ni productos inventados.
- Celulares, Smart TV y Audio continúan como rutas de compatibilidad y no fueron rediseñados.
- Banner principal de Electrodomésticos optimizado a WebP; la fuente PNG queda preservada.
- Lint base corregido y regresiones Step 7M→7Q activas.
- Admin, Legacy, CRM real, Margarita/WhatsApp, producción, `main` y Supabase real permanecen fuera de cambios.

### V16 Step 7R — Approved Category Assets
Base: Step 7Q. Activa arte editorial real para Tecnología & Accesorios, Hogar y Descanso sin tocar contratos de navegación ni integraciones productivas. Mantener como checkpoint incremental separado.

### V16 Step 7R.1 — Banner Framing Fix

- Base exclusiva: checkpoint oficial Step 7R.
- Conserva completos los artes 1672×941 de Tecnología & Accesorios, Hogar y Descanso.
- Framing explícito por categoría: composición completa en desktop/tablet y foco independiente en mobile.
- Electrodomésticos y Herramientas conservan el framing focal previo.
- Overflow horizontal validado en 320, 360, 390, 412, tablet y desktop.
- Lint, build y 113/113 tests aprobados.
- Producción, `main`, Supabase real, CRM, Margarita y WhatsApp permanecen intactos.

### Amarango OS V3 — Product Bridge + Data Contract

- Base visual: V16 Step 7R.1; base funcional OS: CRM Lab V2.1 ARS.
- Nueva ruta de laboratorio `/amarango-os` con búsqueda de catálogo y selección para Nueva Venta.
- `ReadOnlyProductBridge` expone solamente `list`, `search` y `getById`.
- Costo y proveedor quedan protegidos por capacidades de rol.
- Snapshot histórico `amarango-sale-item/v1` preparado en memoria, sin persistencia.
- Data Contract documental para clientes, ventas, items, cuotas, pagos, comisiones, responsables, inversiones, caja, entregas, comprobantes y auditoría.
- Producción, `main`, Supabase real, SQL, RLS, clientes, ventas, cobranzas, Margarita y WhatsApp permanecen intactos.
# AmarangoElectro V16 V4.9 — Consolidación acelerada

- Rama segura: `feat/amarango-v16-consolidacion-acelerada-20260829`.
- Une Storefront V4.8, Admin Accelerator V4.4, Offers/Outlet V4.7 y Tour V4.6 sobre la base V16/Amarango OS V3.
- Cliente, Asesor y Administración quedan separados visualmente y consumen el contrato Product V16.
- Flyer y ofertas funcionan exclusivamente como laboratorios locales.
- 22 entradas comerciales visibles sin cambiar la taxonomía canónica de 11 universos.
- Hero y campañas full-composition protegidos contra recorte mobile.
- Build/lint/127 tests aprobados; no deploy ni producción.
