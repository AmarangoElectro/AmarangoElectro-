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
