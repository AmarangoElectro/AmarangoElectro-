# AmarangoElectro V16 — Current Master Handoff

Fecha de corte: 2026-09-26
Estado: continuidad frontend/local preparada; reproducibilidad total del backend bloqueada por migraciones SQL no versionadas.

Este documento es el punto de entrada maestro para continuar V16 desde un entorno nuevo sin depender de un filesystem temporal de Work.

## Fuente de verdad

- Repositorio: `AmarangoElectro/AmarangoElectro-`
- Rama: `work/v16-modelo-correcto-live-20260919`
- Base certificada de reconstrucción: `65eb51691c86226a25b59850f0015666bcd8291b`
- TREE de base: `e6ec172ade11e23a003bd185c343f041a1f9150e`
- Tag del checkpoint: `v16-work-independence-20260926-r2`
- Sites project ID: `appgprj_6aac91ff2e7c819180c8981c34a310b0`
- Preview vigente: `https://amarango-v16-preview-rama-20260919.amarango-electro.chatgpt.site/`

El HEAD/TREE finales deben obtenerse desde el tag y registrarse en el cierre:

```bash
git rev-parse 'v16-work-independence-20260926-r2^{commit}'
git rev-parse 'v16-work-independence-20260926-r2^{tree}'
```

## Arquitectura

- Next.js 16 sobre Vinext/Vite, empaquetado como Cloudflare Worker ESM.
- Entrada Worker: `worker/index.ts`; assets estáticos por `ASSETS`; imágenes por binding `IMAGES`.
- App Router con Home, búsqueda, sectores, producto, Mi Amarango, Administración, propietarios y Growth.
- Catálogo público compuesto y read-only en `lib/catalog/index.ts`.
- Identidad interna mediante headers de Sign in with ChatGPT en `app/chatgpt-auth.ts`.
- Autorización definitiva esperada desde `v16_user_access`, siempre fail-closed.
- Growth usa `POST /api/v16/growth`, same-origin y server-side.
- CRM conserva contratos/RPC reales, pero permanece `not_connected` hasta existir un bridge seguro de sesión.
- PWA versionada en `public/` con manifest, iconos, service worker y fallback offline.

## Catálogo

El preflight verifica:

- 569 productos visibles únicos.
- 569 IDs, slugs y claves comerciales únicas.
- 90 celulares canónicos activos, todos con imagen.
- 285 productos activos en Electrodomésticos.
- 14 categorías navegables.
- Duplicados activos: 0.

Las fuentes activas son fixtures sanitizados versionados. No consultan ni escriben Supabase.

## Home y navegación

- Home V16 aprobada y preservada.
- Banners, accesos por sector, ofertas y productos siguen conectados a rutas reales.
- Cards conservan dos columnas en móvil entre 320 y 412 px.
- Claro/Oscuro, banners, locales de marca y fotos existentes quedan fuera de este checkpoint.
- Flujo esperado: Home → sector → categoría → producto → resultados.

## Mi Amarango

- Ruta: `/mi-amarango`.
- Requiere identidad ChatGPT server-side.
- Contiene Growth/beneficios y workspace del asesor.
- No expone costo ni herramientas privadas de Administración.
- Falta cerrar el guard productivo de rol/capabilities desde `v16_user_access`.

## Administración y propietario

- Ruta: `/administracion`, protegida por identidad server-side.
- Incluye Catálogo, calculadoras, placas, CRM, Cobranzas, Reportes, Proveedores, Caja, Entregas, Asesores, Growth y Ofertas.
- Módulos sin puente real permanecen fail-closed y nunca inventan datos.
- Cliente, Asesor, Administrador y Propietario están modelados; la autoridad productiva sigue pendiente.
- Suscriptores, familia, logo, color y white-label quedan encaminados, no productivamente cerrados.

## CRM

- Contratos: `lib/crm/client-crm-contract.ts`.
- Adapter read-only: `lib/crm/client-crm-adapter.ts`.
- RPCs congeladas: `v16_crm_list_clients`, `v16_crm_client_360`, `v16_crm_client_sales`.
- Estado: `CONTRACT_READY_CONNECTION_BLOCKED`.
- `getCrmAccessConfig()` retorna `null` hasta existir bridge seguro ChatGPT → `v16_user_access`/Supabase.
- Prohibido exponer `service_role`, hardcodear usuarios o consultar tablas directas desde el navegador.

## Calculadoras y Plan Protegido

- Clásica y Plan Protegido comparten `lib/internal/finance/coherent-pricing.ts`.
- Markups vigentes: 80% / 60% / 50% / 40% / 30% según costo.
- Clásica: planes 2, 4 y 6 con recargos 15%, 55% y 78%.
- Plan Protegido: Plan 3 (+35%) y Plan 6 (+78%).
- Inicial objetivo 75% del costo, con techo 55% del contado y pisos matemáticos.
- La inicial debe ser estrictamente mayor que cada cuota posterior.
- El total exacto se conserva; la última cuota absorbe diferencias de redondeo.

## Comisiones y premio mensual

- El gate separado `V16_ADVISOR_COMMISSIONS_AND_MONTHLY_BONUS` reemplazó el 15% financiado por rangos fijos según el precio contado definitivo.
- Los rangos viven una sola vez en `lib/internal/finance/advisor-compensation-policy.ts`.
- Toda comisión financiada se divide en 2 pagos; Contado conserva el 10% vigente.
- El premio mensual no acumula escalones: $10.000 a 5 equivalentes, $35.000 a 10, $65.000 a 15, $100.000 a 20 y $7.500 por cada equivalente posterior.
- Un producto de contado menor a $50.000 vale 0,5 venta equivalente; desde $50.000 vale 1.
- El motor puro y el cierre inmutable/auditable viven en `lib/internal/finance/advisor-compensation-engine.ts`.
- Mi Amarango y Administración tienen superficies de lectura fail-closed: sin cierre real autorizado no muestran cifras simuladas.
- Bloqueo backend conocido: no existe en este repo un contrato RPC congelado para el ledger de comisión/premio ni para persistir el cierre mensual. Este gate no agrega migraciones Supabase; la conexión productiva queda para un gate backend expresamente autorizado.

## Growth / Referidos

- Dominio, contratos, UI Cliente/Asesor/Admin, referidos, beneficios y funnel están versionados.
- Ruta pública: `/r/[code]`.
- Bridge: `POST /api/v16/growth`, same-origin, autenticado y allowlisted.
- `SUPABASE_SECRET_KEY` es exclusivamente server-side.
- AAL2 para escrituras sensibles permanece bloqueado hasta existir step-up real.

## Supabase

- Project ref documentado: `zctaukyrhsmpjkcddcqq`.
- No hay SDK Supabase en el frontend público.
- Este checkpoint no consulta ni modifica Supabase.
- Bloqueo conocido: faltan migraciones SQL exactas de Growth y de los RPC CRM/Admin aplicados.
- No reconstruir SQL desde documentación narrativa.

## Variables de entorno

`.env.example` contiene exclusivamente nombres vacíos:

- `SUPABASE_URL`: override server-side opcional.
- `SUPABASE_SECRET_KEY`: secret server-side para Growth conectado.

Los headers `oai-authenticated-user-*` y bindings `ASSETS`/`IMAGES` los provee Sites; no son variables de usuario.

Nunca commitear secretos, JWTs, cookies, contraseñas, sesiones, service-role keys ni variables `NEXT_PUBLIC_*` con autoridad privada.

## Build y QA

Requisitos: Node.js `>=22.13.0`, npm y Linux para helpers completos de Sites.

```bash
npm ci
npm run build
npm run v16:preflight
npm run v16:qa
```

`npm run v16:preflight` es read-only y verifica rama, árbol limpio, dependencias, variables por presencia sin imprimir valores, catálogo, duplicados, celulares, imports, PWA, Sites y secretos accidentales.

`npm run v16:qa` agrupa preflight, build y contratos actuales de catálogo, 90 celulares, deduplicación, calculadoras, Plan Protegido, CRM, Growth, navegación, seguridad, roles, Administración y banners.

La suite histórica completa permanece visible:

```bash
npm run v16:qa:all
```

En la base certificada produjo 579 tests: 510 PASS y 69 FAIL por locks históricos superados. No se eliminan ni ocultan.

## Preview reproducible

### PREVIEW local — nunca producción

```bash
npm ci
npm run v16:preflight
npm run v16:qa
npm run preview:v16
```

Para probar el bundle:

```bash
npm run build
npm start
```

### PREVIEW alojada

Un entorno Sites autorizado debe abrir el project ID versionado, usar esta rama, verificar HEAD/TREE/tag, ejecutar preflight/QA, configurar secretos sólo en Site Settings y guardar una versión no productiva preservando audiencia y dominio.

### PRODUCCIÓN

Fuera de alcance. No usar `main`, no cambiar audiencia y no desplegar el dominio productivo.

## Continuar desde cero

```bash
git clone https://github.com/AmarangoElectro/AmarangoElectro-.git
cd AmarangoElectro-
git fetch origin --tags
git checkout work/v16-modelo-correcto-live-20260919
git pull --ff-only origin work/v16-modelo-correcto-live-20260919
git rev-parse HEAD
git rev-parse 'HEAD^{tree}'
npm ci
npm run v16:preflight
npm run v16:qa
npm run preview:v16
```

## Archivos fuera de GitHub

Para frontend/build/preview local: ninguno detectado.

Ignorados reproducibles: `node_modules/`, `dist/`, `.wrangler/`, `.sites-runtime/` y secretos administrados externamente.

Pendientes para reproducir el backend completo: migraciones SQL exactas de Growth, CRM/Admin y su historial aplicado.

## Bloqueos conocidos

1. Backend Supabase incompleto en Git por falta de migraciones exactas.
2. CRM/Cliente 360 fail-closed por falta de bridge seguro.
3. Growth conectado requiere secret server-side.
4. AAL2 real no está disponible mediante el bridge ChatGPT actual.
5. La suite histórica conserva aserciones de checkpoints superados.
6. Un preview alojado requiere autorización Sites; no depende del filesystem de este Work.

## Próximo gate autorizado

Después de publicar este checkpoint, abrir únicamente el gate solicitado por el propietario. En este corte, el siguiente pedido explícito es `V16_ADVISOR_COMMISSIONS_AND_MONTHLY_BONUS`, sin migraciones Supabase y sin publicación automática.

## Prohibiciones permanentes

No agregar bypass de login, usuario oculto, contraseña fija, token en el repo, endpoint anónimo, service-role en frontend, acceso secreto por URL, desactivación de RLS ni desactivación de AAL2.
