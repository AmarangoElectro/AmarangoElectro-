# AmarangoElectro V16 — Sistema de Referidos, Beneficios y Escalamiento — 2026-09-25

## Estado
Branch: `work/v16-modelo-correcto-live-20260919`

Se incorporó una capacidad nativa de crecimiento V16, separada de proveedores externos de IA/mensajería.

### Implementado en código V16
- contrato de referidos y estados CLICK → LEAD → EVALUATION → APPROVED/REJECTED → SALE_CREATED → PAYMENT_CONFIRMED → REWARD_AVAILABLE → REWARD_USED/CANCELLED;
- políticas de beneficios configurables por tipo, valor/porcentaje, tope, mínimo, vencimiento, alcance y condición de liberación;
- prohibición estructural de recompensa por mero registro o SALE_CREATED;
- atribución universal DIRECT / WHATSAPP / INSTAGRAM / FACEBOOK / META_ADS / CLIENT_REFERRAL / ADVISOR / ORGANIC / CAMPAIGN / OTHER;
- ruta pública `/r/[code]`;
- deep-link de producto con `ref`, `source=CLIENT_REFERRAL` y `product`;
- captura first-touch temporal de atribución en sessionStorage, explícitamente no autoritativa;
- atribución aditiva en PurchaseIntent y SaleItemSnapshot;
- wallet/“Recomendá y ganá” en Mi Amarango;
- solicitud de cliente → asesor preparada y nunca automática;
- niveles de asesores configurables sin montos hardcodeados;
- exposición por costo + costos directos + comisiones comprometidas − cobrado;
- progresión por ventas cobradas, completadas, calidad, mora, recurrencia, antigüedad, documentación y aprobación;
- panel Admin “Adquisición / Referidos”;
- embudo y métrica principal margen cobrado / capital expuesto;
- antifraude: mismo cliente/DNI/teléfono bloqueables; IP/dispositivo sólo revisión;
- eventos provider-neutral para entrega, pago, crédito completo, nivel, beneficio y cambios de referido;
- compartir producto adjunta código sólo si V16 ya entregó un código autorizado.

## No-multinivel
No existe pago por reclutamiento, recompensa por registro ni desbloqueo por una sola venta grande. El sistema modela recompensa exclusivamente por operación válida y condición de cobro.

## Persistencia real / backend
No se tocó Supabase ni producción.

El repositorio actual no expone todavía un contrato backend congelado/autenticado para:
- crear/persistir referrals;
- resolver código público → customerId;
- persistir source attribution en lead/cliente/venta/cobranza;
- liberar/usar rewards;
- administrar políticas de beneficios;
- persistir solicitudes/niveles de asesor;
- servir el funnel real.

Por seguridad, `GrowthGateway` queda explícitamente `not_connected` y las superficies muestran “Conexión segura pendiente” en vez de inventar datos o éxitos.

Esto mantiene el mismo patrón de seguridad ya usado por CRM/Reportes/Asesores: UI y dominio preparados, pero ninguna mutación se finge localmente.

## Privacidad y antifraude
El navegador sólo conserva temporalmente código público y metadatos de atribución. No usa DNI/teléfono/customerId como autoridad local.
Mismo dispositivo/IP nunca bloquea por sí solo.

## Arquitectura de eventos
`amarango:growth-domain-event` es provider-neutral.
Margarita, WhatsApp u otros servicios pueden consumir eventos posteriormente; no forman parte del núcleo de verdad.

## QA cubierto por tests
`tests/v16-growth-referrals-system.test.mjs`
- transiciones;
- reward sólo tras condición válida de pago;
- antifraude;
- capital expuesto;
- calidad de cartera para niveles;
- deep-links;
- KPI principal;
- fuente universal;
- eventos;
- ausencia de write-path falso;
- integración Mi Amarango / Admin / compartir / snapshot.


## Segunda pasada — superficies completas de operación
Se completó además:
- filtros de Admin realmente conectados al contrato por fuente, campaña, asesor, referidor, producto, categoría y período;
- lista trazable de referidos con copy seguro "Vino recomendado por [nombre]" cuando el backend autorice un display name;
- editor Admin de política de beneficio: activo/pausado, tipo, valor fijo, porcentaje, tope, compra mínima, vencimiento, condición de liberación, mínimo cobrado, productos y categorías habilitados;
- editor Admin de nivel de asesor: exposición por venta, exposición abierta, ventas cobradas, operaciones completas, calidad, mora, recurrentes, antigüedad, documentación, aprobación administrativa y beneficios;
- bandeja de solicitudes cliente → asesor con acciones Aprobar / Rechazar por Gateway seguro;
- Mi Amarango muestra recomendados, compras generadas, beneficios pendientes/disponibles/usados, wallet e historial de recomendaciones;
- vista del asesor con nivel actual, progreso, capacidad disponible, próximo nivel, beneficios y bloqueos;
- source attribution opcional preservada en PurchaseIntent y SaleItemSnapshot;
- estilos responsive separados en `app/growth.css`.

## Contrato backend requerido para activación real
La UI no debe pasar a "operativa" hasta que exista un contrato autenticado y congelado que resuelva, como mínimo:
1. identidad cliente → referralCode único e inmutable;
2. referralCode público → customerId interno únicamente en backend;
3. first-touch/source attribution persistida al crear lead y propagada por lead → cliente → venta → cobranza;
4. transición de estados de referido con auditoría;
5. validación antifraude de customerId/DNI/teléfono en backend;
6. señal device/IP como revisión, nunca rechazo automático aislado;
7. creación de reward únicamente después del evento de cobro configurado;
8. consumo de reward idempotente y auditable;
9. CRUD AAL2/admin para RewardPolicy y AdvisorGrowthLevelRule;
10. solicitud y aprobación explícita de customer → advisor;
11. cálculo servidor de open exposure y límites de asesor;
12. funnel segmentable y KPI collected margin / exposed capital;
13. outbox/event stream provider-neutral para PRODUCT_DELIVERED, VALID_PAYMENT_CONFIRMED, CREDIT_COMPLETED, CUSTOMER_LEVEL_CHANGED, BENEFIT_AVAILABLE, REFERRAL_STATUS_CHANGED y ADVISOR_LEVEL_CHANGED.

No se debe usar localStorage/sessionStorage como autoridad para ninguno de esos puntos. La única persistencia temporal cliente implementada es la atribución de navegación/código público en `sessionStorage`.

## Estado de activación
- Dominio V16: IMPLEMENTADO.
- UI Mi Amarango: IMPLEMENTADA con fail-closed cuando no hay backend.
- Producto/deep-links: IMPLEMENTADOS.
- Admin adquisición/configuración/aprobaciones: IMPLEMENTADO con fail-closed.
- Escalamiento/riesgo: motor y UI IMPLEMENTADOS; datos reales pendientes de backend.
- Automatizaciones: eventos provider-neutral IMPLEMENTADOS; transporte externo pendiente.
- Persistencia autoritativa: PENDIENTE DE CONTRATO BACKEND SEGURO.
- Supabase: NO MODIFICADO.
- Producción: NO MODIFICADA / NO PUBLICADA.
