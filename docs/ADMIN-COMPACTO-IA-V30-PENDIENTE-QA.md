# Tienda anterior AmarangoElectro — propuesta V30 (NO PUBLICADA)

Rama: `work/tienda-vieja-admin-compacto-ia-20261021`.
Base main inspeccionada: `33d2a025d858190671cbf3ddd55ee3eb8b675b59`.
Respaldo existente: `backup/antes-v30-20261020`.

## Lo que se reutiliza y conserva
- `public/index.html` se mantiene byte a byte igual: no se reemplaza una plantilla de ~800 KB.
- `tiendaEditarPrecio` y `tiendaGuardarPrecios` continúan siendo el flujo oficial de edición y guardado. El lápiz pequeño abre esa edición enfocada en costo. No recalcula venta automáticamente a menos que se pulse la acción existente.
- `compartirProducto`, `compartirInstagram`, `tiendaToggleVisibleProd`, `tiendaToggleDestacado`, `tiendaSetProductoDia`, `tiendaToggleSinStock`, etc. se conservan.
- Menú Opciones del producto: los mismos botones se desplazan dentro de un control plegable de tres puntos; no se borran.
- Imagen original de cada producto intacta; se muestra completa con `object-fit: contain`.
- Aplicación de tipografía del sistema actual únicamente en las tarjetas de administración; verificación visual con V16 aún pendiente.

## Archivos agregados
- `public/admin-compact-v30.css`: reglas limitadas a la grilla de Administración.
- `public/admin-compact-v30.js`: transforma sólo el DOM de tarjetas administrativas sin modificar los handlers de origen.
- `src/ai-product-image.mjs`: endpoint optativo `/api/crear-imagen-producto`, **desactivado por defecto**.
- `tests/admin-compact-v30.test.mjs`: tests de desactivación y preservación.

## Archivo modificado
- `src/worker.mjs`: agrega el recurso CSS y JS al HTML servido y despacha el endpoint IA.
- El entrypoint real `src/worker-professional.mjs` importa `./worker.mjs`, por lo que esta integración se alcanzará en un despliegue futuro aprobado.

## IA: prohibido activar antes de aprobación
El servicio queda apagado y no genera gastos. Habilitar más adelante requiere:
1. Aprobar el precio del proveedor y el modelo elegido.
2. Configurar secretos privados de Cloudflare: `OPENAI_API_KEY` y `AI_ADMIN_TOKEN` (mínimo 32 caracteres aleatorios). Nunca ponerlos en GitHub o en el cliente.
3. Configurar la variable `AI_IMAGES_ENABLED=true`.
4. Crear binding de rate limiting `AI_IMAGE_LIMITER` y verificar cuotas, facturación y alerta de gasto; si falta, el endpoint falla cerrado.
5. Probar una única generación con una fotografía autorizada. Descargar imagen solo después de revisar el resultado. El original no se sobrescribe automáticamente.
6. Revisar autorización backend con la identidad/roles reales (un token extra no sustituye la autenticación general de administración).
7. Si se habilita el envío a OpenAI, el usuario debe tener consentimiento para transmitir las fotografías al proveedor.

## Gates pendientes
- **NO PUBLICADO**: sólo cambios en rama de prueba y PR.
- Sintaxis JS inspeccionada. Los tests automatizados del repositorio todavía NO ejecutados en runtime/CI.
- Preview Android con fotos reales, verificación de costo/cálculo, menú, visibilidad, cuotas, pagos, CRM y regresión de roles pendiente.
- Publicar sólo después de aprobar Android y confirmar ausencia de regresiones.

## Restricción crítica
No fusionar sobre main sin revisar primero modificaciones posteriores en GitHub; no modificar datos productivos, Supabase, API keys, ni activar consumo de imágenes.
