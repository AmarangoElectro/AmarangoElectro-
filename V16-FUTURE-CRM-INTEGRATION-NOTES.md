# AmarangoElectro V16 — CRM futuro (pendiente, no implementado)

## Recomendación
Integrar el CRM dentro de la misma plataforma V16, pero como módulo independiente del Storefront y del Admin de catálogo. Una sola plataforma no significa una sola pantalla: debe haber módulos, permisos y trazabilidad separados.

## Arquitectura objetivo
Storefront → pedido/consulta → Cliente → Venta → Cuotas/Pagos → Entrega/Postventa.

Admin Center debe poder abrir, según rol:
- Catálogo y productos.
- Clientes / CRM.
- Ventas y operaciones.
- Caja y movimientos.
- Inversiones.
- Reportes.

## Datos que conviene traer del CRM actual cuando llegue el momento
### Clientes
- identificador actual;
- nombre y apellido;
- DNI/documentación si el sistema actual lo registra;
- teléfono/WhatsApp;
- dirección/localidad;
- ocupación;
- referencias;
- fecha de alta;
- notas e historial comercial.

### Ventas
- cliente;
- producto(s);
- fecha;
- vendedor/asesor;
- precio de contado o plan utilizado;
- cantidad de cuotas;
- valor de cuota;
- estado de la operación;
- entrega/retiro;
- garantía/postventa.

### Cobranza
- vencimientos;
- cuotas pagadas/pendientes;
- fecha y medio de cada pago;
- saldo;
- mora/seguimiento;
- comprobantes si existen.

### Caja única
- ingresos;
- egresos;
- compras a mayoristas;
- gastos;
- retiros/aportes;
- saldo y conciliación;
- responsable que registró cada movimiento.

### Inversiones
Traer el modelo del CRM de inversiones actual antes de diseñar tablas nuevas. No asumir estructura ni porcentajes. Necesitamos ver: inversores, aportes, movimientos, retiros, utilidades/rendimientos, asignación de capital y trazabilidad histórica.

## Regla de migración
No borrar ni reemplazar los CRM actuales de golpe. Primero: auditoría → mapa de campos → importación de prueba → comparación → solo lectura → validación → recién después escritura y retiro de sistemas anteriores.

## Seguridad
Clientes, costos, caja, inversiones y reportes financieros son información privada de Administración. Storefront y Asesores no deben poder acceder a esos datos salvo campos explícitamente autorizados por rol.
