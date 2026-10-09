# V16 — comisiones visibles y activación pendiente

## Implementado

- Tarjetas privadas de Asesores, Administración y Propietarios: “Ganás…”, modalidad y detalle de comisión. La escala solicitada se muestra explícitamente como estimación pendiente de habilitación.
- Filtros por comisión estimada, ventas registradas del asesor, precio contado y menor importe de cuota disponible.
- Tu mes lee el ledger existente, la validación de entrega/cobranza y los cierres mensuales. Conserva comisiones y cronogramas históricos; no recalcula ventas antiguas con la escala nueva.
- Ventas equivalentes, premios 5/10/15/20 y adicionales post-20 conservan la política existente. Premio provisional hasta el cierre.
- Cobrado sólo suma pagos de comisión identificados mediante venta y advisor_id, sin reversa. No se reconstruye desde cuotas del cliente, nombres, ni movimientos ambiguos.
- Reporte administrativo con costo y margen, asesor, venta, comisión, estado y premio. El DTO del asesor omite costo y margen.
- Lectura cada 30 segundos en pantalla visible, al volver y con botón Actualizar. Sin persistencia local ni escrituras de pagos.

Migración de lectura aplicada exclusivamente en la rama de prueba **ugujgbamqmrvxbvzxxou**, vinculada al sitio privado. Función SECURITY DEFINER con search_path vacío; ejecución sólo service_role; ámbito de asesor determinado por identidad verificada del servidor. La tienda principal, catálogo, precios comerciales, financiación, roles y workspaces no se modificaron.

## Pendiente de aprobación

La revisión automática rechazó la propuesta de activación financiera por el alcance de sus cambios persistentes: configuración privilegiada, sustitución de una función de cotización y cambio de restricción/trigger del ledger. No se volvió a ejecutar esa propuesta.

El archivo `v16-commission-activation-NOT-APPLIED.sql` contiene el borrador rechazado, **fuera de migrations**, exclusivamente para revisión. No se debe ejecutar automáticamente ni tratarlo como migración validada.

Se solicita autorización para preparar y validar la activación **sólo en staging y sólo para ventas nuevas**:

1. Nueva comisión contado: menos de $200.000 → 10%; desde $200.000 → 7%.
2. Financiado: menos de $50.000 → $7.500; menos de $100.000 → $12.000; menos de $200.000 → $20.000; menos de $300.000 → $28.000; desde $300.000 → 10% con tope configurable por Propietarios.
3. Tres cuotas del cliente → dos pagos de comisión; seis cuotas → tres. Las otras modalidades existentes conservan su cronograma hasta que se defina una regla explícita.
4. Guardado compartido del tope, exclusivo de Propietarios, con revisión para evitar cambios concurrentes y snapshot de política en cada nueva cotización.
5. Conectar la nueva política a la emisión server-authoritative de nuevas cotizaciones y sus nuevos registros. No modificar el motor de precios ni financiación; no recalcular registros históricos.

Riesgo concreto: afecta el importe de comisión y su cronograma en futuras cotizaciones/ventas; las cotizaciones pendientes pueden necesitar reemisión al cambiar la revisión del tope. Antes de aplicar, revisar el borrador, estrechar la migración, verificar contratos actuales y probar cada umbral, concurrencia y registro nuevo aislado. La publicación actual no activa esos cambios.

## Validación y límites

- Pruebas nuevas de umbrales, tope, división exacta de pagos, premios y conservación del ledger histórico.
- Pruebas de API: identidad de sesión, aislamiento de asesor, redacción de costo/margen, rechazo de cliente/anónimo/origen externo y ausencia de escritura de tope.
- Consultas de reporte y permisos verificadas en staging. No hay filas en el ledger de comisiones de esa rama al validar; no se inventaron datos reales ni se fabricó una sesión de asesor.
- QA Android con sesiones reales de asesor y propietario pendiente. No se afirma PASS end-to-end.
- Typecheck global mantiene errores previos fuera de los archivos modificados.
- Cinco checks heredados no están actualizados para el sitio actual: uno espera la venta deshabilitada anterior, otro exige una lectura local de cuotas reemplazada por la cotización del servidor, dos buscan textos viejos de Asesores y uno espera HTTP 200 sin sesión en Administración, hoy protegida por redirect. No se debilitó la autorización para hacerlos pasar.

Resultado del gate específico: **42 pruebas aprobadas, 0 fallos**. Una ejecución más amplia dio 58 aprobadas y los 5 fallos heredados descritos arriba; no se modificaron ni debilitaron esos checks para ocultarlos. Compilación oficial aprobada. No hubo errores TypeScript en los archivos modificados.
