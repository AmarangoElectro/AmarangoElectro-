# Seguridad del módulo Asesores

- `SUPABASE_SECRET_KEY` / `SUPABASE_SERVICE_ROLE_KEY` deben existir únicamente como secretos del Worker de Cloudflare.
- `ADMIN_PANEL_PASSWORD` debe existir únicamente como secreto del Worker de Cloudflare.
- No guardar claves privadas ni contraseñas de Admin en GitHub.
- Las claves personales de asesores se almacenan como SHA-256; la clave en claro sólo se muestra al generarse.
- Los tokens de sesión se almacenan en la base sólo como hash.
- Las tablas privadas de asesores, sesiones, actividad y métricas tienen RLS y no se exponen a anon/authenticated.
- El modo coach de Margarita se activa sólo con sesión de asesor validada por el Worker.
