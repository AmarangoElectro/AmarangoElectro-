# AmarangoElectro en Cloudflare

Esta carpeta reemplaza el alojamiento de Netlify sin modificar el catálogo
guardado en Supabase.

## Qué conserva

- La tienda principal en `public/index.html`.
- El dominio `amarangoelectro.com.ar`.
- Las herramientas de administrador y vendedores.
- El catálogo de Supabase.
- La sincronización horaria de Mega Electro y Electro Impacto.
- El puente de imágenes utilizado al compartir productos.
- Las redirecciones antiguas de `/calculadora.html` y `/index.html`.

## Configuración en Cloudflare

1. En **Workers & Pages**, elegir **Create application**.
2. Elegir **Import a repository** y conectar GitHub.
3. Seleccionar el repositorio de AmarangoElectro.
4. Usar la rama de producción `main`.
5. Cloudflare detectará `wrangler.jsonc`.
6. Guardar y desplegar.
7. En el Worker, abrir **Settings > Variables and Secrets**.
8. Agregar `SUPABASE_SECRET_KEY` como secreto si se dispone de la clave de
   servicio de Supabase. No copiar esa clave en GitHub.
9. Probar primero el dominio temporal `workers.dev`.
10. Recién después agregar `amarangoelectro.com.ar` como dominio personalizado.

## Seguridad

No eliminar Netlify ni cambiar los DNS hasta comprobar la dirección temporal de
Cloudflare. Las claves privadas deben guardarse como secretos de Cloudflare,
nunca dentro de archivos públicos de GitHub.
