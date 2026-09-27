# V16 — Comisiones de asesores y premio mensual

## Alcance implementado

- Comisión financiada fija por precio contado definitivo, con 14 rangos centralizados.
- Dos pagos exactos para toda comisión financiada.
- Comisión de contado sin cambios: 10%.
- Premio mensual no acumulativo a 5/10/15/20 ventas equivalentes.
- Adicional de $7.500 por cada venta equivalente posterior a 20, sin meta ficticia 25.
- Productos debajo de $50.000 computan 0,5; desde $50.000 computan 1.
- Estados aceptada, pendiente y excluida con motivo auditable.
- Cancelación y mora al cierre excluyen; entrega/cobranza/estado de cuotas desconocidos permanecen pendientes.
- Cierre mensual inmutable con política, período, fecha y operaciones congeladas.
- Tablero `🏆 TU MES` en Mi Amarango y resumen por asesor en Administración.
- Detalle por operación sin costo real: producto, contado, modalidad, comisión, partes, cobrado, pendiente, cómputo y validación.

## Fuente de verdad y límite seguro

La UI acepta únicamente un read model construido desde un cierre mensual server-authoritative. No usa `localStorage`, datos demo ni una suma hecha desde cards del navegador.

El repositorio todavía no contiene un contrato RPC congelado que lea/escriba el ledger de comisiones y el cierre mensual. Los contratos existentes sí aportan ventas, entregas, cobranzas, pagos y cartera, pero no poseen campos suficientes para persistir y congelar una liquidación. Como este gate prohíbe nuevas migraciones Supabase, las superficies quedan deliberadamente `not_connected` hasta un gate backend autorizado. No se inventó un nombre RPC ni un bypass.

## QA

`tests/v16-advisor-commissions-monthly-bonus.test.mjs` cubre:

- todos los límites monetarios, incluidos $49.999/$50.000 y $999.999/$1.000.000;
- división exacta en dos pagos;
- 4,5/5, 9,5/10, 14,5/15, 19,5/20, 21 y 25 equivalentes;
- dos productos menores a $50.000;
- cancelación, entrega pendiente, cobranza pendiente, mora y cuotas sin validar;
- cierre mensual inmutable;
- separación comisión/premio;
- UI fail-closed sin autoridad local.

`tests/v16-plan-protegido-calculator.test.mjs` conserva el QA de precio coherente, tope 55%, objetivo 75%, total exacto e inicial estrictamente mayor que cada cuota posterior.

