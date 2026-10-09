# V16 — comisiones: migración aplicada en staging

## Autorización y límite

El 9 de octubre de 2026, el usuario autorizó explícitamente activar la escala, los 2/3 pagos de comisión y el tope de Propietarios, sólo en la base de prueba y para ventas nuevas. Agregó: “No autoriza cambios en producción, ventas históricas, pagos ya registrados ni comisiones anteriores”.

Se aplicó exclusivamente en **ugujgbamqmrvxbvzxxou**, rama `v16-core-operational-staging-20260927`. No se ejecutó DDL ni DML en la base principal `zctaukyrhsmpjkcddcqq`. No se modificó la configuración del sitio publicado ni se desplegó una nueva versión a producción.

La migración registrada es `20261009061334_v16_prospective_commission_activation.sql`. Los archivos `v16-commission-activation-REVIEWED-PENDING.sql` y `v16-commission-activation-NOT-APPLIED.sql` quedan como borradores históricos, no como migraciones por ejecutar.

## Aplicado en la base de prueba

- Nueva escala contado: debajo de $200.000 → 10%; desde $200.000 → 7%.
- Financiado: debajo de $50.000 → $7.500; debajo de $100.000 → $12.000; debajo de $200.000 → $20.000; debajo de $300.000 → $28.000; desde $300.000 → 10% con tope opcional.
- Tope compartido, editable sólo por Propietarios a través del servidor; revisión para impedir sobrescribir una edición concurrente. Valor inicial **sin tope**, revisión 1: no se inventó un valor comercial.
- Nuevas comisiones financiadas: 3 cuotas del cliente → 2 pagos de comisión; 6 → 3. Contado conserva 1 pago. Los planes existentes de 2/4 cuotas conservan 2 pagos de comisión.
- La nueva rama de comisión actúa sólo cuando se emite una cotización con la nueva versión de política. Las cotizaciones ya emitidas conservan su importe, al igual que las ventas y comisiones anteriores.
- El trigger actúa exclusivamente en INSERT con la política nueva y comprueba el snapshot de venta. No actualiza filas históricas ni pagos registrados.
- Precios comerciales, financiación y cronogramas del cliente conservados.

## Verificaciones realizadas

- **50 pruebas de aplicación aprobadas**, sin fallos en el gate específico. Incluyen aislamiento, redacción de costo/margen, cálculo por rango, premios, guardado exclusivo de Propietarios, revisión concurrente, y preservación exacta de precios y cronogramas Classic/Protected.
- **14/14 casos SQL** aprobados para rangos, porcentajes y tope.
- **5/5 casos SQL** aprobados para cantidad de pagos y conservación exacta del total de comisión, con redondeo al centavo.
- RPC nueva: ejecución denegada a anon/authenticated y permitida sólo al servidor. Tabla privada con RLS, sin acceso directo de anon/authenticated/service_role. El propietario de la función comprueba identidad y permisos antes de guardar.
- Supabase Advisor sólo informó “RLS enabled no policy” para la tabla privada: es el cierre por defecto intencional, con acceso directo revocado. No se abrieron políticas para usuarios.
- Comparación anterior/posterior: **sin cambios** en cotizaciones, snapshots, ledger de comisiones, pagos, caja, ventas y catálogo.

Checksums conservados:

| Registro | Antes y después |
|---|---|
| Cotizaciones | e8d75c049e43e38f63a8eff04e66c7f4 |
| Snapshots | 0ab7febc6808902f23f239aeca01062a |
| Comisiones | d41d8cd98f00b204e9800998ecf8427e |
| Pagos | 02a864974684c33f9aaf5370cd291bf5 |
| Caja | 864f400aa72e97ece2f783f9ac061eba |
| Ventas | 5c967762c05807275468e65e667a75a6 |
| Catálogo | fb99c10141308757bb7b4dfb76698938 |

## Estado de la aplicación y límite de QA

La integración local está lista para staging y ahora exige dos condiciones: bandera del servidor `V16_COMMISSION_ACTIVATED=true` **y** backend exacto `https://ugujgbamqmrvxbvzxxou.supabase.co`. La bandera no puede activar esta política sobre producción u otro backend.

En el sitio publicado la bandera sigue sin configurar. Por eso conserva el funcionamiento anterior, la comisión nueva en vista previa y el guardado del tope deshabilitado. No se habilitó su configuración porque el usuario excluyó cambios en producción. Se guarda el código/migración como versión sin desplegar.

La validación SQL comprobó las funciones reales de cálculo y reparto. Las pruebas de autorización y emisión de cotizaciones usan transporte simulado; no se fabricaron identidades ni sesiones. El ledger de staging no tiene comisiones históricas registradas. No se afirma haber completado un recorrido Android ni una venta real con comisión nueva. El QA de la interfaz requiere un entorno de aplicación de prueba habilitado con sesiones reales.

Referencia del aviso informativo de RLS: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
