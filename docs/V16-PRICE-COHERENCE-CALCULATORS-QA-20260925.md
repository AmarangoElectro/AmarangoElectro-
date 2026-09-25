# AmarangoElectro V16 — QA Precio Coherencia + Dos Calculadoras — 2026-09-25

## Estado implementado
Branch: `work/v16-modelo-correcto-live-20260919`

La Calculadora Clásica y Plan Protegido comparten un único motor:
`lib/internal/finance/coherent-pricing.ts`

Pipeline:
1. costo real;
2. tramo exacto;
3. markup;
4. piso de coherencia;
5. redondeo estratégico ascendente;
6. precio contado definitivo;
7. financiación/comisiones.

El motor no recibe categoría ni rubro, por lo que la regla no queda limitada a celulares.

## Markup exacto
- costo < $50.000: 80%
- $50.000 <= costo < $100.000: 60%
- $100.000 <= costo < $250.000: 50%
- $250.000 <= costo < $350.000: 40%
- costo >= $350.000: 30%

## Pisos exactos
- desde $50.000: $89.998,20
- desde $100.000: $159.998,40
- desde $250.000: $374.998,50
- desde $350.000: $489.998,60

## QA de límites

| Costo | Markup | Precio por markup | Piso activo | Precio coherente | Contado definitivo |
|---:|---:|---:|---:|---:|---:|
| $49.998 | 80% | $89.996,40 | No | $89.996,40 | $89.999 |
| $49.999 | 80% | $89.998,20 | No | $89.998,20 | $89.999 |
| $50.000 | 60% | $80.000,00 | Sí | $89.998,20 | $89.999 |
| $50.001 | 60% | $80.001,60 | Sí | $89.998,20 | $89.999 |
| $99.999 | 60% | $159.998,40 | No | $159.998,40 | $159.999 |
| $100.000 | 50% | $150.000,00 | Sí | $159.998,40 | $159.999 |
| $249.999 | 50% | $374.998,50 | No | $374.998,50 | $374.999 |
| $250.000 | 40% | $350.000,00 | Sí | $374.998,50 | $374.999 |
| $349.999 | 40% | $489.998,60 | No | $489.998,60 | $489.999 |
| $350.000 | 30% | $455.000,00 | Sí | $489.998,60 | $489.999 |
| $350.001 | 30% | $455.001,30 | Sí | $489.998,60 | $489.999 |

Resultado: ningún salto de tramo reduce el contado.

## Redondeo estratégico ascendente
Terminaciones centralizadas: 299 / 499 / 799 / 999.

Ejemplos:
- $100.000 -> $100.299
- $100.127 -> $100.299
- $100.300 -> $100.499
- $100.450 -> $100.499
- $100.500 -> $100.799
- $100.850 -> $100.999
- $100.999 -> $100.999
- $101.000 -> $101.299

Regla obligatoria verificada: el resultado comercial nunca queda por debajo del precio coherente.

## Propiedad de monotonía
La prueba automatizada recorre todos los costos enteros desde $1 hasta $600.000 y falla ante cualquier caso donde un costo mayor genere un contado menor.

## Calculadora Clásica
- fuente visible: costo real ARS o costo real USD convertido a ARS;
- se retiró el modo Venta ARS de la interfaz de la calculadora;
- conserva planes 2/4/6 y sus porcentajes vigentes;
- 6 cuotas conserva +78%;
- financiación se ejecuta después del contado definitivo.

El helper inverso de Venta se conserva únicamente por compatibilidad histórica con Sistema Placas; no es fuente autoritativa de las dos calculadoras.

## Plan Protegido
Inicial exacta:
`MIN(costo × 75%, contado definitivo × 55%)`

Plan 3:
`contado × 1,35`, redistribuido en inicial + 2 cuotas.

Plan 6:
reutiliza el total actual de 6 cuotas (+78%) y lo redistribuye en inicial + 5 cuotas.

Comisiones:
- contado: 10% del contado definitivo;
- Plan 3: 15% del contado, 2 pagos;
- Plan 6: 15% del contado, 3 pagos.

Las cuotas mostradas cierran exactamente al peso. Si la división genera diferencia, sólo la última cuota absorbe el ajuste.

## Nota comercial importante
La nueva fórmula definitiva de inicial reemplaza la regla anterior 90/80/75/70/65.

Con `MIN(75% costo, 55% contado)`, en algunos costos bajos la inicial puede ser menor que una cuota posterior de Plan 3. Ejemplo aproximado en el borde de $50.000:
- contado: $89.999;
- inicial: $37.500;
- cuotas posteriores Plan 3: alrededor de $41.999 / $42.000.

Esto es consecuencia directa de la fórmula definitiva recibida; no se agregó un ajuste oculto que la contradiga.

## Seguridad
- no main;
- no Supabase;
- no producción;
- no catálogo/Home/banners/imágenes;
- no publicación automática.

## Tests añadidos/actualizados
- límites y pisos;
- redondeo ascendente;
- propiedad de monotonía $1..$600.000;
- igualdad de contado Clásica vs Protegido;
- inicial 75%/55%;
- comisiones;
- ganancias;
- cierre exacto de cuotas;
- privacidad del mensaje comercial;
- interfaz con dos fórmulas alimentadas por costo.
