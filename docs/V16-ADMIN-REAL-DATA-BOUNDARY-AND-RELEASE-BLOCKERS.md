# V16 — Admin Real Data Boundary + Release Blocker Matrix

Estado físico del source recuperado y reconciliado. Este documento no declara producción lista: separa qué está certificado localmente, qué es revisión/mock y qué necesita backend/live QA.

| Área | Estado | Frontera real de datos | Bloqueo | Acción de salida |
|---|---|---|---|---|
| Home / Storefront visual | `PASS_LOCAL` | Home protegida; navegación/visuales reconciliados. | Ninguno visual. Catálogo que alimenta productos sigue sin certificación productiva. | Mantener Home congelada; no tocar. |
| Catálogo público / ProductCard / PDP | `BLOCKED_REAL_DATA` | El catálogo activo compone V411AuditedPilotCatalogAdapter + Cohort0FrozenCatalogAdapter. | Ambas fuentes declaran production_catalog_verified=false; no son catálogo productivo certificado. | Conectar snapshot/catálogo real certificado antes de preview final con productos reales. |
| 90 Celulares | `REVIEW_ONLY` | 90 identidades canónicas materializadas; adapter aislado, visible=false, sin precio/imagen/cuotas/stock comercial certificado. | No puede activarse como catálogo público sin completar y validar datos comerciales. | Mantener oculto/revisión hasta materialización comercial aprobada. |
| Admin · Catálogo | `REVIEW_ONLY` | Usa v411PilotAdminProducts + fixture Electra + localStorage. | No representa el catálogo administrativo real. | Sustituir fuente de revisión por Product/Core real autorizado. |
| Admin · CRM | `CONTRACT_READY_CONNECTION_BLOCKED` | RPC contract + adapter real presentes. | getCrmAccessConfig() retorna null; fail-closed not_connected. | Integrar sesión/token server-safe con RPC autorizadas. |
| Admin · Cobranzas | `CONTRACT_READY_CONNECTION_BLOCKED` | RPC v16_collections_* y scope real recuperados. | Misma conexión segura ausente. | Conectar sesión real y repetir live-auth QA. |
| Admin · Payment History | `CONTRACT_READY_LIVE_QA_PENDING` | Scope sale_id + client_id y clientId recuperados; zero-state exacto preservado. | Conexión real ausente + Browser Live Auth QA pendiente. | Conectar sesión y ejecutar QA owner real. |
| Admin · Reportes | `CONTRACT_READY_CONNECTION_BLOCKED` | RPC v16_reports_* recuperadas. | getCrmAccessConfig() null. | Conectar sesión/capability reports.read. |
| Admin · Proveedores / Provider Inbox | `CONTRACT_READY_CONNECTION_BLOCKED` | Lecturas/escrituras RPC recuperadas; no se finge éxito local. | Conexión real ausente; acciones terminales sensibles requieren seguridad/AAL2 según contrato. | Conectar sesión y validar acciones autorizadas. |
| Admin · Caja | `CONTRACT_READY_CONNECTION_BLOCKED` | RPC list/summary/post/reversal recuperadas. | Conexión real ausente; mutaciones sensibles requieren autorización/step-up. | Conectar sesión y validar AAL2/reversal. |
| Admin · Entregas | `CONTRACT_READY_CONNECTION_BLOCKED` | RPC list/detail/create/transition recuperadas. | Conexión real ausente. | Conectar sesión y validar transiciones reales. |
| Admin · Asesores | `CONTRACT_READY_CONNECTION_BLOCKED` | Portfolio/RPCs recuperadas; no deriva cartera por responsable. | Conexión real ausente; identity read path / RBAC de ruta aún no implementado. | Conectar sesión + v16_user_access + validar AAL2. |
| Admin · Calculadora | `LOCAL_FUNCTIONAL_RBAC_BLOCKED` | Cálculo local determinista; no requiere datos remotos. | Debe quedar sólo para Admin/Owner; RBAC productivo de ruta aún no está conectado. | Habilitar después de guard real de rol. |
| Admin · Placas | `LOCAL_FUNCTIONAL_RBAC_BLOCKED` | Generación/copia local; muestra datos privados Admin. | Requiere guard real Owner/Admin. | Habilitar después de RBAC real. |
| Admin · Ofertas | `DRAFT_ONLY` | Persistencia localStorage, no backend productivo. | No es fuente comercial compartida ni auditable. | Mantener como borrador hasta persistencia real. |
| Mi Amarango · Asesor | `AUTH_ONLY_ROLE_BLOCKED` | Ruta exige autenticación y no expone costos; consume catálogo activo. | Falta guard server-side de advisor + advisorId/capability; catálogo aún no productivo; Nueva Venta no conectada. | Conectar v16_user_access y fuente real de catálogo/ventas. |
| Amarango OS / Integración interna | `MOCK_ISOLATED` | Product Bridge basado en fixture/mock, autenticado y aislado. | No usar como Nueva Venta productiva. | Mantener aislado o reemplazar con flujo real posterior. |
| Auth / RBAC | `BLOCKED_BACKEND_READ_PATH` | Auth server-side existe; contrato fail-closed owner/admin/advisor/customer definido. | Falta provider real current identity → v16_user_access → role/capabilities. | Implementar read path server-side con autorización explícita antes de tocar Supabase. |
| Build completo | `BLOCKED_ENVIRONMENT` | Tests source-level/targeted PASS; no build completo certificado. | Dependencias no disponibles en entorno recuperado; faltó paquete offline anteriormente. | Ejecutar install/build/lint en entorno con dependencias disponibles antes del preview final. |
| Browser live QA | `PENDING` | Contratos/tests locales preservados. | Falta validar sesión real, navegación, roles y network en navegador cloud. | Ejecutar en Work cuando exista nuevo preview paralelo. |

## Gate de salida mínimo antes de un preview final serio

1. Catálogo real certificado conectado o snapshot real explícitamente aprobado.
2. `v16_user_access` read path server-side para RBAC real.
3. Conexión segura de los adapters RPC actualmente fail-closed (`getCrmAccessConfig()`).
4. Build/lint completos en entorno con dependencias disponibles.
5. Nuevo preview paralelo, sin tocar el preview roto ni producción.
6. Browser Live Auth QA: Owner/Admin/Asesor/Cliente + Payment History + network/console.

Home aprobada continúa congelada y no forma parte de los bloqueos.