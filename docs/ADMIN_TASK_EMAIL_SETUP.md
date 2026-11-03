# AmarangoElectro · Avisos por mail de tareas (tienda vieja)

## Alcance

Sólo la tienda vieja (`AmarangoElectro/AmarangoElectro-`, rama `main`). No cambia el catálogo ni V16. El panel Tareas sigue funcionando localmente sin mail. La sincronización en nube es optativa para usuarios registrados como `owner` / `admin` activos, con sesión Supabase Auth confirmada; el PIN existente **no** autoriza envíos por sí solo.

## Implementado

- Migración ejecutada y verificada en Supabase **zctaukyrhsmpjkcddcqq**, archivo `sql/20261103_admin_task_email_reminders.sql`. Tabla nueva: `public.ae_admin_task_email_reminders`, RLS activado, cuatro políticas. Cada fila pertenece a su `auth.uid()`; dos RPC de servicio realizan reservas y recibos atómicos. No se copia ninguna dirección arbitraria del navegador: el cron toma `auth.users.email` de la cuenta verificada.
- Formulario Admin: «📧 Activar correos» solicita la sesión segura existente (Fotos) cuando hace falta; sincroniza las tareas locales con la nube de esa cuenta. Se puede desactivar desde el mismo panel. Sin conexión, la campanita funciona localmente.
- Cloudflare Worker cron dedicado cada cinco minutos; conserva los cron de sincronización de proveedores. Mensaje HTML blanco/naranja y texto alternativo. Envío único por ID y vencimiento; cron utiliza confirmación de Resend y recibo de base.

## Pendiente **antes de prometer correos reales**

1. Configurar el proveedor **Resend**, dominio remitente verificado y permisos de envío. Guardar mediante **Cloudflare Worker Secrets** `RESEND_API_KEY` y el remitente `ADMIN_TASK_MAIL_FROM` (dirección de remitente validada, ejemplo genérico `AmarangoElectro <avisos@dominio-verificado>`). No publicar secretos en Git ni en la interfaz.
2. Confirmar que el Worker tenga **SUPABASE_SECRET_KEY** configurada como secreto del mismo proyecto **zctaukyrhsmpjkcddcqq**. Nunca usar la anon key para estas RPC ni copiar clave al cliente.
3. Desplegar exclusivamente el Worker del dominio existente (no cambiar Site V16) y comprobar cron de cinco minutos, RPC, correo entregado, en el correo del administrador asociado, correo único ante reejecución y desactivación. Publicación real **no verificada** desde este chat.
4. Hacer QA: admin con sesión Supabase Auth, activar correos, crear tarea con recordatorio 5 minutos posterior; comprobar fila, enviar y marcar correo. Confirmar que cliente, asesor y PIN sin sesión Auth no tengan acceso. No enviar emails de prueba reales sin autorización.

## Precauciones

- La tienda vieja tiene una interfaz de administración basada en PIN y no es una autorización servidor por sí sola: esta función nueva exige además Supabase Auth + rol confirmado mediante RLS.
- Las tareas locales preexistentes se sincronizan solamente después de activar el envío con la cuenta apropiada; no se leen mensajes o clientes. **Nunca afirmar que las notificaciones por mail están activas antes de configurar secretos, desplegar y validar envío**.
- El cambio de cuenta de correo requiere entrar con la cuenta administradora correspondiente. Una misma cuenta no debería usar varios navegadores creando tareas de ID coincidente.
- Resend puede exigir validación de dominio y puede facturar uso según plan. No se pide contraseña de Gmail ni se agrega un buzón de la tienda como administrador.
