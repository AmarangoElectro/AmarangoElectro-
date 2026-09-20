# V16 — Matriz de permisos corregida

Esta matriz reemplaza cualquier lectura provisional previa de los permisos Legacy. La fuente de verdad funcional es la regla de negocio confirmada por AmarangoElectro; el código Legacy se usa solo para rescatar funciones, no para decidir quién debe acceder a ellas.

| Capacidad | Cliente | Asesor | Administrador |
|---|:---:|:---:|:---:|
| Ver catálogo público | Sí | Sí | Sí |
| Ver precio contado público | Sí | Sí | Sí |
| Abrir opciones de cuotas públicas desde el precio contado | Sí | Sí | Sí |
| Compartir producto | Sí | Sí | Sí |
| Registrar venta | — | Sí | Sí |
| Ver costo interno | — | — | Sí |
| Editar costo | — | — | Sí |
| Ver/editar cotización USD | — | — | Sí |
| Usar calculadora interna de márgenes | — | — | Sí |
| Ver/gestionar comisiones | — | — | Sí |
| Ver inversión/capital requerido | — | — | Sí |
| Ver/gestionar mayorista/proveedor | — | — | Sí |
| Pegar/importar lista de productos y precios | — | — | Sí |
| Editar financiación/política de cuotas | — | — | Sí |
| Editar stock/fotos/categorías/visibilidad | — | — | Sí |
| Papelera/restauración | — | — | Sí |
| Ventas/clientes/reportes/backups/usuarios | — | — | Sí |

## Dos flujos Legacy llamados “Pegar precio”

1. **Herramienta vieja de asesor**: pegaba un precio de venta y generaba cuotas/texto de respuesta. **DESCARTAR para Asesores** en V16; ya no necesitan calculadora.
2. **Carga administrativa**: importa/actualiza productos y precios en lote. El Legacy acepta líneas del estilo `Nombre del producto | 310000`, y contempla modos de precio de venta, costo y USD, además de mayorista, categoría, características y foto. **REESCRIBIR para Admin Center** con validación, preview de cambios, autorización server-side y audit log antes de guardar.

## Precio en USD y proveedor

- La cotización USD será editable únicamente por Administradores.
- El costo/precio original del proveedor y su moneda son datos internos.
- El mayorista/proveedor debe quedar visible y filtrable en Admin para saber dónde realizar la compra.

## Antigüedad del precio

El Legacy contiene dos umbrales visuales diferentes. V16 normaliza una sola regla administrativa:

- **verde / reciente:** 0–19 días;
- **amarillo / advertencia:** 20–29 días;
- **rojo / revisar:** 30 días o más;
- **sin fecha:** estado desconocido.

El reloj usa el evento más reciente entre **precio actualizado**, **precio confirmado manualmente** y, como fallback, **fecha de creación**. Confirmar que el precio sigue vigente reinicia correctamente el contador aun si el importe no cambió.

Esta regla es solo de apoyo administrativo: nunca oculta, publica ni modifica un producto durante render.
