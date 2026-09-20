# AmarangoElectro V16 V4.9 — Pendientes para reemplazar producción

## Bloqueantes

| Área | Pendiente | Criterio para cerrar |
|---|---|---|
| Catálogo | Conectar el catálogo real completo mediante el adaptador READ aprobado. | Muestreo, comparación legacy, IDs estables, imágenes HTTPS, visibilidad fail-closed y prueba de 1.200+ productos. |
| Identidad | Integrar login, perfiles Maxi/Angie, recordar dispositivo, sesión persistente y cierre de sesión. | RBAC comprobado en servidor; Cliente/Asesor/Admin separados por permiso real. |
| Administración | Diseñar y aprobar la capa WRITE separada. | Operaciones explícitas, auditoría, confirmaciones, RLS, backups, rollback y staging. |
| Ofertas/Flyers | Reemplazar `localStorage` por persistencia administrativa segura. | Solo Admin; preview/aprobación; historial; foto principal persistente; sector apagable. |
| Imágenes | Validar Storage, permisos, variantes y pipeline de optimización. | Sin `service_role` en frontend; URLs públicas seguras; fallback; WebP/AVIF; rollback. |
| Comercial | Confirmar política de cuotas, costos, markup, ofertas y vigencia de precios. | Aprobación escrita del negocio y fixtures de regresión. |
| Integraciones | WhatsApp/Margarita continúan fuera de alcance. | Contrato y endpoint/número reales, privacidad, consentimiento y auditoría aprobados. |
| QA | Staging autorizado y pruebas físicas. | Android 320/360/390/412, tablet, notebook y desktop; Web Vitals medidos; cero errores de consola. |

## Importantes, no bloqueantes de arquitectura

- Reemplazar placeholders premium por fotografías reales auditadas.
- Completar Xbox, Nintendo, informática, deporte/movilidad y demás sectores preparados cuando el catálogo lo justifique.
- Añadir analytics/monitoring con consentimiento y sin escrituras comerciales implícitas.
- Revisar metadatos SEO, sitemap, robots, URLs canónicas y datos estructurados.
- Completar textos legales, condiciones comerciales, privacidad y accesibilidad WCAG.
- Probar restauración offline/PWA y estrategia de actualización del service worker.
- Definir política de imagen al compartir; actualmente no se descarga ni adjunta automáticamente.

## Orden recomendado para el siguiente Step

1. Auditoría del catálogo productivo en lectura y staging.
2. Integración del bloque Identidad + RBAC.
3. Implementación de escritura Admin aislada con auditoría y rollback.
4. Persistencia de Flyer/Ofertas.
5. Staging completo, carga de contenido real y QA físico.
6. Recién entonces, plan de reemplazo productivo con ventana y rollback.

## Riesgo residual

El checkpoint es navegable y técnicamente consistente, pero sigue siendo una consolidación segura de interfaz y contratos. No debe considerarse listo para reemplazar producción mientras Catálogo, Identidad, Admin WRITE, datos comerciales y QA físico permanezcan pendientes.

