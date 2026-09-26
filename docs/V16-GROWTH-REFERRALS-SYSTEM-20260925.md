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

### Backend autoritativo aplicado en Supabase
Proyecto: `zctaukyrhsmpjkcddcqq`.

Se aplicaron migraciones aditivas V16 para:
- identidades de referido y códigos públicos únicos;
- atribución first-touch y propagación lead → cliente → venta → pago;
- lifecycle de referidos y antifraude por customerId/DNI/teléfono;
- RewardPolicy configurable y wallet de beneficios;
- automatización de reward contra el ledger real `v16_payment_events`, incluyendo re-evaluación por REVERSAL;
- integración con Entregas para condiciones delivery + valid payment;
- solicitudes cliente → asesor;
- reglas/niveles de asesor sin montos comerciales hardcodeados;
- snapshots idempotentes de riesgo por venta;
- exposición abierta por costo real + costos directos + comisiones comprometidas − cobro neto;
- acquisition events/costs y funnel segmentable;
- outbox `v16_growth_events` provider-neutral;
- bridge server-only `v16_chatgpt_growth_bridge`.

No se sembraron policies, niveles, costos, referidos ni beneficios de ejemplo. Las tablas Growth quedaron inicialmente en cero.

### Seguridad
- tablas Growth con RLS activado;
- acceso directo revocado a `anon` y `authenticated`;
- ningún RPC Growth quedó ejecutable por `anon`;
- RPCs de Admin validan rol/capability;
- escrituras sensibles mantienen AAL2;
- el bridge ChatGPT sólo puede ejecutarlo `service_role`;
- el bridge reconstituye la identidad V16 por email autenticado server-side y la degrada deliberadamente a `aal1`; nunca falsifica AAL2;
- una prueba real confirmó que lecturas owner funcionan a través del bridge y que `save_reward_policy` queda bloqueado con `step_up_required`;
- no se creó ninguna policy de QA durante esa prueba.

### Bridge del Site
V16 incluye `POST /api/v16/growth`.
Ese endpoint:
1. exige la identidad autenticada de Sign in with ChatGPT;
2. rechaza requests cross-site;
3. toma `SUPABASE_SECRET_KEY` únicamente de una variable server-side;
4. llama sólo a la acción permitida dentro de `v16_chatgpt_growth_bridge`;
5. nunca entrega la secret key ni un token Supabase al navegador.

Requisito de hosting pendiente: configurar `SUPABASE_SECRET_KEY` en ChatGPT Sites → Settings → Environment Variables. No copiar esa clave a código, GitHub, mensajes ni variables públicas. `SUPABASE_URL` puede configurarse opcionalmente; si falta se usa el Project URL público ya fijado por el backend.

### Identidades
Los dos owners existentes ya están vinculados a `auth.users` + `v16_user_access`.
Los clientes comunes NO se vincularán por coincidencia aproximada de nombre/teléfono/email. El enrolamiento cliente → identidad autenticada queda como gate separado y debe conservar el patrón de invitación/claim explícito ya usado por asesores.

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
- Backend Supabase autoritativo: IMPLEMENTADO.
- Reward/payment/reversal automation: IMPLEMENTADA.
- Source attribution + funnel + risk engine: IMPLEMENTADOS.
- UI Mi Amarango: IMPLEMENTADA; requiere identidad cliente enrolada.
- Producto/deep-links: IMPLEMENTADOS.
- Admin adquisición/configuración/aprobaciones: IMPLEMENTADO.
- Same-origin ChatGPT → Supabase bridge: IMPLEMENTADO EN CÓDIGO.
- Hosted secret `SUPABASE_SECRET_KEY`: PENDIENTE DE CONFIGURACIÓN EN SITES.
- AAL2 para escrituras administrativas: SE MANTIENE BLOQUEADO hasta step-up real.
- Enrolamiento de clientes comunes: PENDIENTE como gate separado.
- Automatizaciones externas Margarita/WhatsApp: transporte pendiente; V16 ya emite eventos.
- Supabase: MODIFICADO sólo mediante migraciones aditivas Growth autorizadas en este gate.
- Producción/Site publicado: NO MODIFICADO / NO PUBLICADO.
