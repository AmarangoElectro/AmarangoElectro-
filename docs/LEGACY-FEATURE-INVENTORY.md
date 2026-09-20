# AmarangoElectro — Inventario funcional Legacy → V16

## Regla de migración

El ZIP Legacy se usa exclusivamente como evidencia estática. No se ejecuta para migrar datos, no se activa producción y no se copian mecanismos inseguros. La intención funcional se conserva; la implementación se reescribe cuando corresponde.

## Cliente / storefront

| Función Legacy | Estado V16 | Decisión |
|---|---|---|
| Home / vidriera | Superada en V16 | mantener V16 |
| Catálogo / categorías / marcas | En migración | normalizar y conectar read-only |
| Buscador | Reescrito | mantener motor puro V16 |
| Filtros / orden | Reescrito | ampliar al llegar datos reales |
| Ficha de producto | Reescrita premium | mantener V16 |
| Favoritos | Reescritos local-only | mantener V16 |
| Compartir producto | Reescrito | mantener V16 |
| Comparación | Nuevo V16 | mantener |
| Consulta / “Quiero este” | Nuevo V16 | conectar más adelante al canal comercial |
| Historial de vistos / retorno al catálogo | Nuevo V16 | mantener local-only |
| Instalación PWA | Nuevo V16 | preparar Android / stores |
| Carrito / pedido Legacy | Pendiente | redefinir según flujo comercial real |
| QR de tienda | Pendiente | reescribir |
| Ayuda / cómo comprar | Pendiente | reescribir |
| Cupones | Pendiente | requiere política autoritativa |
| Ruleta / gamificación | Evaluar | no migrar automáticamente |
| Suscriptores | Evaluar | requiere consentimiento y privacidad |
| Métricas de visitas simuladas | Descartar | dato no verificable |

## Asesores de ventas

| Función | Estado V16 | Decisión |
|---|---|---|
| Acceso asesor | Pendiente Auth real | reescribir |
| Ver precio contado | Permitido | dato comercial público |
| Ver opciones de cuotas desde contado | Permitido cuando exista política pública vigente | solo mostrar; no editar política |
| Compartir producto / tienda | Permitido | mantener experiencia comercial |
| Registrar venta | Pendiente | requiere Auth, esquema, RLS y auditoría |
| Calculadora contado/costo/USD Legacy | **No migrar a Asesores** | retirada por regla de negocio vigente |
| Costo interno | **Prohibido para Asesores** | solo Admin |
| Cotización USD | **Prohibida para Asesores** | solo Admin |
| Comisiones | **Prohibidas para Asesores** | solo Admin |
| Inversión / capital requerido | **Prohibido para Asesores** | solo Admin |
| “Pegar precio” Legacy para calcular cuotas | **Descartar para Asesores** | no necesitan calculadora |
| Placas / textos comerciales | Pendiente | reescribir desde política autorizada |
| Compartir por WhatsApp | Pendiente integración definitiva | no duplicar lógica |

## Administración

> **Contrato reforzado Step 7J.1:** la lista resumida de esta sección no es exhaustiva. La paridad administrativa obligatoria completa está en `docs/ADMIN-LEGACY-PARITY-CONTRACT.md` y `lib/internal/admin/legacy-admin-parity.ts`. Los formatos operativos Legacy se conservan salvo aprobación explícita de los dueños.


| Función Legacy | Estado V16 | Decisión |
|---|---|---|
| Login / sesión | No migrado | Auth real + MFA admin |
| Roles | Modelo de capacidades corregido Step 7I.1 | Asesor sin costo/USD/calculadora/comisiones/inversión |
| Calculadora interna | Motor puro iniciado | solo Admin; política autorizada pendiente |
| Costo interno | Pendiente UI segura | solo Admin |
| Cotización USD editable | Pendiente | solo Admin; versionar cambio y actor |
| Pegar/importar precios y productos | Pendiente | rescatar carga masiva Legacy con preview + validación + auditoría |
| Mayoristas/proveedores | Pendiente | visibles/filtrables/editables solo en Admin |
| Fecha y semáforo de precio | Fundación pura iniciada | unificar en 0–19 / 20–29 / 30+ días; confirmación manual reinicia reloj |
| Alta / edición de productos | Pendiente | comando explícito + validación + auditoría |
| Precio / oferta / financiación | Pendiente | política versionada y autorizada |
| Stock / disponibilidad | Pendiente | fuente autoritativa + historial |
| Visibilidad / publicación | Pendiente | nunca mutar durante render |
| Fotos | Pendiente | storage seguro + permisos |
| Categorías | Pendiente | catálogo normalizado |
| Papelera / restauración | Pendiente | soft delete + auditoría |
| Duplicados | Pendiente | diagnóstico; nunca ocultar automáticamente |
| Historial de ventas / pedidos | Pendiente | esquema y permisos nuevos |
| Clientes | Pendiente | privacidad / retención / permisos |
| Reportes / estadísticas | Pendiente | solo métricas reales |
| Backups | Pendiente | versionado backend, no snapshots automáticos del navegador |
| Sincronización de proveedores | Pendiente backend aislado | nunca desde storefront |
| Usuarios / asesores | Pendiente | alta/baja, roles y auditoría |

## Funciones que V16 agrega y Legacy no resolvía bien

- comparación de productos;
- continuidad exacta al volver al catálogo;
- recently viewed local-only;
- PWA instalable con offline conservador;
- performance adaptativa por dispositivo/conexión;
- buscador predictivo con protección de modelos;
- Sonic UX no invasivo;
- PDP premium y zoom;
- flujo de intención comercial revisable antes de enviar;
- diseño explícito para Web + PWA + futura Android/iOS.

## Seguridad objetivo

```text
Cliente público
  ↓ solo lectura comercial
Storefront V16

Asesor autenticado
  ↓ capacidades limitadas
Internal Sales App

Administrador autenticado + MFA
  ↓ comandos explícitos
Admin App / API segura
  ↓
validación server-side → RLS / autorización → escritura → audit log
```

Nunca se aceptan como seguridad: PIN hardcodeado, `localStorage` como sesión, ocultar botones, o confiar en el frontend para autorizar una escritura.
