# Mapa de administración legacy

## Decisión arquitectónica

La administración no se integra en el storefront público. El ZIP combina cliente, asesor/revendedor y administrador en `public/index.html`, usando flags de sesión del navegador y funciones compartidas. Step 7 solo documenta.

No se reproducen claves encontradas en el código. La presencia de credenciales/PIN hardcodeados y sesión basada en `localStorage` es un riesgo crítico; no constituye autenticación ni autorización robusta.

## Roles detectados

| Rol legacy | Mecanismo observado | Capacidades | Decisión |
|---|---|---|---|
| Cliente | vista pública / vista previa cliente | catálogo, búsqueda, carrito, consulta, compartir | reutilizar solo contratos públicos; UI legacy se descarta |
| Asesor / revendedor | flag local de sesión y PIN en cliente | calculadoras, compartir, registrar ventas, herramientas comerciales | reescribir con Auth/roles reales en una app separada |
| Administrador | flag local y PIN hardcodeado | catálogo, visibilidad, fotos, precios, stock, categorías, borrado, publicación, reportes | reescribir por completo fuera del storefront |

No se encontró un modelo de autorización verificable basado en claims/RLS dentro del ZIP. Tener un botón oculto o un flag local no protege operaciones de backend.

## REUTILIZAR CON ADAPTACIÓN

| Función | Qué se rescata | Condición |
|---|---|---|
| Lectura de estado público | significado de visible/stock/eliminado | como funciones puras, sin guardado |
| Verificación posterior a guardado | intención de confirmar el estado autoritativo | solo en futura app admin, con API segura y auditoría |
| Tombstones incrementales | concepto de borrado lógico/versionado | después de revisar esquema, RLS y concurrencia |
| Bandejas de trabajo | conceptos “imágenes”, “revisión”, “ocultos”, “sin stock” | UI y consultas nuevas, sin mutación durante render |
| Backup | necesidad operativa de recuperación | backend/versionado real; no snapshots automáticos desde el navegador |

## REESCRIBIR

| Función | Motivo |
|---|---|
| Login y sesiones | PINs/flags locales no autentican ni autorizan |
| Roles cliente/asesor/admin | interfaz y permisos están mezclados |
| Alta/edición de producto | muta objetos globales y encadena guardados |
| Precio, oferta y cuotas sin interés | política comercial editable desde frontend |
| Stock y visibilidad | efectos secundarios distribuidos y estados superpuestos |
| Categorías | detección heurística y edición comparten el mismo objeto |
| Fotos | upload `upsert:true`, caché y estado de catálogo acoplados |
| Papelera/restauración | requiere transacciones, auditoría y autorización server-side |
| Duplicados | render administrativo puede liberar/ocultar/publicar automáticamente |
| Ventas/pedidos/clientes | se guardan como JSON agregado o filas con contratos heterogéneos |
| Sincronización de proveedor | actualiza catálogo/stock/precio/visibilidad; debe vivir en backend aislado |

## DESCARTAR

| Función | Motivo |
|---|---|
| Contraseñas hardcodeadas en HTML | exposición total y sin rotación |
| Autorización basada en ocultar controles | no es una barrera de seguridad |
| Mutación durante render | navegación puede cambiar datos comerciales |
| `visible=true` por defecto al leer | transforma información ausente en una decisión de publicación |
| Métricas de visitas simuladas | dato inventado presentado como actividad real |
| Administración y storefront en el mismo bundle | eleva superficie de ataque y acoplamiento |

## REQUIERE AUDITORÍA

| Área | Evidencia faltante |
|---|---|
| Supabase Auth | configuración, proveedores, usuarios y sesiones reales |
| RLS/roles | políticas completas, claims y permisos por tabla/bucket |
| Asesores | fuente canónica, alta/baja, alcance y auditoría |
| Administradores | responsables, MFA, recuperación y separación de funciones |
| Ventas/clientes | esquema, privacidad, retención y acceso |
| Logs | historial de cambios, actor, antes/después y reversión |
| Jobs/sync | disparadores, secretos, idempotencia, alertas y rollback |

## Riesgo crítico confirmado: render administrativo

`tiendaPrepararBandejasAdmin()` puede reparar IDs, cambiar grupos de duplicados, reactivar/ocultar productos, marcar revisiones por antigüedad y luego ejecutar guardado/publicación. Aunque contiene guardas de sincronización, sigue mezclando render, decisión comercial y escritura.

Regla para la futura administración:

```text
render/read model → sin efectos secundarios
comando explícito → autorización server-side → validación → escritura → auditoría
```

## Fuera de alcance

Todos los archivos y flujos de Margarita/IA permanecen **PENDIENTE — NO MIGRAR TODAVÍA**. No se eliminaron del ZIP legacy ni se incorporaron al mapa de ejecución V16.
