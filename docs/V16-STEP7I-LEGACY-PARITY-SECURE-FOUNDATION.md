# V16 Step 7I — Legacy Parity + Secure Internal Foundation

## Objetivo

Preparar el reemplazo funcional total de la tienda Legacy sin reintroducir sus problemas de seguridad. Este checkpoint no activa administración, no conecta Supabase real y no modifica producción.

## Implementado

1. Inventario funcional Legacy → V16 en `docs/LEGACY-FEATURE-INVENTORY.md`.
2. Modelo explícito de roles/capacidades en `lib/internal/auth/roles.ts`, corregido para impedir que Asesores accedan a costo, USD, calculadora, comisiones e inversión.
3. Requisitos de seguridad fail-closed: Auth, autorización, MFA para admin, enforcement server-side y audit log.
4. Motor interno de calculadora en `lib/internal/finance/calculator-engine.ts`, reservado por capacidad al rol Admin.
5. El motor no contiene una política comercial vigente hardcodeada: recibe tiers, planes, comisiones y reglas de redondeo como entrada validada.
6. No se importa ningún módulo `lib/internal/*` desde el storefront público.
7. Política pura de antigüedad de precio en `lib/internal/finance/price-age.ts`: reciente 0–19, advertencia 20–29, revisar 30+; respeta confirmación manual aun sin cambio de importe.
8. Matriz corregida documentada en `docs/ROLE-MATRIX-CORRECTED.md`, incluyendo los dos flujos Legacy distintos llamados “Pegar precio”.

## Lo que NO se hizo

- no se copió ningún PIN o contraseña Legacy;
- no se creó login falso;
- no se conectó Supabase Auth;
- no se modificó RLS;
- no se habilitaron escrituras;
- no se activaron precios/cuotas Legacy en público;
- no se migró Margarita / IA / WhatsApp;
- no se tocó producción;
- no se convirtió el admin en una simple ruta protegida solo por JavaScript.

## Próximo orden recomendado

1. Diseñar `Internal Sales App` limitado a contado, cuotas públicas, compartir y registrar venta; sin calculadora/costo/USD/comisiones/inversión.
2. Diseñar Auth/RLS y modelo de usuarios con ambiente aislado.
3. Construir `Admin Center` con MFA y audit log.
4. Migrar primero al Admin Center: carga masiva de productos/precios, costo, USD editable, mayorista/proveedor, fecha/semáforo de precio y fotos.
5. Migrar después stock, categorías, visibilidad, papelera, ventas/clientes/reportes/backups/usuarios.
6. Recién después conectar sincronización de proveedor y demás escrituras productivas.
