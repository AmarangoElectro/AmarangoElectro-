# V16 — activación de comisiones preparada, no ejecutada

## Estado publicado

La vista privada mantiene “Ganás…” como estimación de la nueva escala y Tu mes como lectura de las comisiones registradas. No se activó la liquidación nueva ni el guardado del tope.

El cambio de activación está implementado detrás de una bandera **exclusivamente del servidor**, `V16_COMMISSION_ACTIVATED`, actualmente **sin configurar**. Así, la aplicación sigue usando la emisión de cotizaciones anterior y la RPC de lectura existente. Los intentos de guardar el tope devuelven `activation_required` sin escribir en la base.

## Cambio concreto listo para revisar

El borrador revisado es `v16-commission-activation-REVIEWED-PENDING.sql`, fuera de migrations. Reemplaza para revisión el borrador anterior `v16-commission-activation-NOT-APPLIED.sql`. Ninguno se ejecutó.

Sólo se propone aplicarlo en **ugujgbamqmrvxbvzxxou**, la rama de prueba vinculada al sitio privado. No en la base principal.

La propuesta contiene:

1. Tabla privada de configuración del tope, con revisión para evitar sobrescribir otra edición. RLS y ningún acceso directo de clientes ni asesores.
2. RPC sólo para el servidor. Identidad comprobada en `v16_user_access`; sólo Propietarios puede guardar el tope. Administración y Asesores sólo leen; cada asesor conserva su ámbito.
3. Cálculo independiente de la comisión. Contado: 10% por debajo de $200.000, 7% desde ese importe. Financiado: $7.500 / $12.000 / $20.000 / $28.000 en los rangos pedidos; desde $300.000, 10% con tope opcional de Propietarios. Sin tope inicial fijado.
4. Emisión de nuevas cotizaciones: se modifica únicamente la rama de comisión, después de ejecutar el motor de precios y financiación vigente. Se conserva íntegramente la validación y el cronograma del cliente. Un guard comprueba que la función original coincide con la definición revisada; no se usa reemplazo dinámico de código SQL.
5. Registro de comisiones: se permite un cronograma de tres pagos. Un trigger sólo actúa en INSERT de la política nueva y valida contra el snapshot de venta. Tres cuotas del cliente → dos pagos de comisión; seis → tres. Contado conserva un pago. Los planes de dos/cuatro cuotas existentes conservan dos pagos.

El registro histórico no se recalcula ni se actualiza. Las cotizaciones ya emitidas, incluso antes de cambiar un tope, mantienen su importe hasta su vencimiento. La revisión del tope queda fijada en cada nueva cotización. Si cambia durante la emisión, se devuelve conflicto y se requiere preparar una cotización nueva.

## Riesgo y autorización pendiente

La revisión automática rechazó la migración el 9 de octubre: consideró que “Sigamos” no era una autorización explícita para modificar la emisión de cotizaciones y el registro financiero. No se reintentó ni se ejecutó por otra vía.

Riesgo concreto: modifica el importe y el cronograma de comisión de futuras cotizaciones y ventas, y agrega una configuración compartida del tope. Un error en esa integración podría impedir emitir o registrar una venta. No propone cambios en precios comerciales, cuotas del cliente, catálogo, roles ni registros históricos.

Se necesita autorización explícita para **aplicar esta migración en la base de prueba**, validar sus funciones/cronogramas y después habilitar la bandera del servidor. La publicación de preparación no habilita esos pasos.

## Verificación completada

- **49 pruebas aprobadas, cero fallos** en el gate específico.
- Pruebas de preservación exacta de precio contado, anticipo, cuotas, totales y cronogramas de todos los planes actuales Classic/Protected al cambiar sólo metadatos de comisión.
- Pruebas de política/revisión/tope: rechazo de datos inválidos, precios/costos/políticas enviados por el navegador ignorados, conflicto durante emisión, fallo sin política vigente.
- Pruebas de límites de comisión, tope, distribución exacta de pagos, premios y conservación de las comisiones históricas.
- Pruebas de aislamiento de asesor, redacción de costo/margen, propietario único autorizado a guardar, revisión/origen y ausencia de escrituras cuando la activación está deshabilitada.
- Compilación oficial aprobada. Typecheck global conserva errores previos fuera de los archivos modificados.
- Verificación nativa posterior al rechazo: tabla de configuración inexistente; función emisora original conserva hash `ae1142498b0afbf81858ea4dc01723df`; las dos cotizaciones conservan checksum `e8d75c049e43e38f63a8eff04e66c7f4`; catálogo conserva checksum `fb99c10141308757bb7b4dfb76698938`; ledger sigue vacío. No hubo cambios persistentes.
- Configuración publicada verificada: bandera de activación sin configurar; backend sigue siendo staging; audiencia privada conservada.

Las pruebas de la integración preparada usan transporte simulado sin credenciales ni red real. No equivalen a haber ejecutado la migración. La validación SQL de los nuevos cálculos y el recorrido Android con sesiones reales quedan pendientes de autorización/activación.
