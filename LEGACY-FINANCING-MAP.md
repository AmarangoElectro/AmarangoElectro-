# Mapa de financiación legacy

## Estado en Step 7

La financiación se auditó pero no se migró. `Product.financing` permanece vacío incluso si el registro legacy tiene `sinInteres`. V16 no muestra cuotas hasta validar la política comercial y su fuente autoritativa.

## Configuración encontrada

`public/index.html` define `planesDefault` para 2 a 12 cuotas. Los planes activos por defecto en el código recibido son 2, 4 y 6, con porcentajes directos 15 %, 55 % y 78 %. Los demás planes están inactivos por defecto y conservan porcentajes configurables.

La configuración se guarda en el navegador con:

- `amarango_planesConfig`;
- `amarango_planes_version = crm2`.

El usuario interno puede activar/desactivar planes y editar el porcentaje desde la UI. No se encontró validación server-side de esta política en el ZIP.

## Fórmulas comprobadas

### Plan común

```text
totalPlan = precioVenta × (1 + porcentajePlan / 100)
valorCuota = redondear(totalPlan / cantidadCuotas al múltiplo de 1.000)
```

`calcularTotalPlan(precioVenta, n)` usa porcentaje directo sobre el precio base; el propio código indica que reemplazó una fórmula histórica en cascada.

### Cuotas sin interés por producto

Si `producto.sinInteres` contiene un entero positivo:

```text
valorCuota = redondear(precioVenta / sinInteres al múltiplo de 1.000)
```

### Precio anterior/oferta

`precioAntes > venta` genera porcentaje visual de descuento. Esta regla no se migró porque requiere política de vigencia y fuente válida.

## Funciones y consumidores

| Función/área | Uso legacy | Decisión Step 7 |
|---|---|---|
| `cuotasActivasOrdenadas()` | lista de planes activos | documentar |
| `calcularTotalPlan()` | total directo por porcentaje | no migrar todavía |
| `mejorCuotaTexto()` | cuota destacada en tarjeta | no migrar |
| `mejorCuotaDatos()` | cuota recomendada o sin interés | no migrar |
| `armarCuotasLines()` | mensajes y compartir | no migrar |
| `planesConfig` UI | activar y editar porcentajes | reescribir en administración segura |
| Tarjeta/ficha | muestra cuota, contado y ofertas | V16 solo muestra datos validados |
| Compra/carrito | usa total y primera cuota | fuera de esta fase |
| PDF/placas/Instagram/WhatsApp | repite cálculos y mensajes | pendiente; no copiar duplicaciones |
| Calculadoras de comisión/inversión | reutiliza planes para lógica interna | fuera del storefront |

## Campos involucrados

| Campo | Significado | Clasificación |
|---|---|---|
| `venta` / `precio` | base pública de contado | público |
| `sinInteres` | cantidad especial por producto | comercial condicionado |
| `precioAntes` | precio de referencia anterior | comercial condicionado |
| `costo`, `mayorista` | base interna | privado |
| `planesConfig[n].activo` | habilitación de plan | administrativo |
| `planesConfig[n].pct` | recargo directo | privado/comercial |
| `amarango_planes_version` | migración local de fórmula | técnico |

## Riesgos

1. La política puede variar por dispositivo porque vive en `localStorage`.
2. Los porcentajes y planes se editan en el cliente.
3. El redondeo por cuota puede hacer que `valorCuota × n` difiera del total matemático.
4. La lógica está duplicada en ficha, mensajes, PDF, compra y calculadoras.
5. Textos de entrega/financiación están hardcodeados en algunos flujos.
6. `sinInteres` se interpreta como número sin contrato de vigencia, responsable o moneda.
7. No hay evidencia de que los valores del ZIP sean la política vigente de producción.

## Recomendación para la fase futura

Crear un servicio de política comercial versionado, con moneda, vigencia, redondeo, responsable y pruebas de casos. El storefront deberá recibir opciones ya validadas; nunca editar porcentajes ni calcular condiciones administrativas por su cuenta.
