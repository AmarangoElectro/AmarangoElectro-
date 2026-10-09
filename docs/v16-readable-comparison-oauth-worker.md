# V16 — Características legibles y navegación OAuth

Corrección basada en capturas Android de iPhone 16 Pro 512 GB frente a iPhone 16 E 128 GB.

- Los fragmentos del catálogo y del OCR se convierten en valores técnicos reconocibles. Se rechazan encabezados incompletos, texto comercial, números dañados y párrafos como «16e 128GB y CÁMARA 48 MP». No se completan especificaciones por conocimiento del modelo.
- Ficha y comparación usan el mismo formato: una característica por elemento, sin duplicar cámara ni los campos ya comparados. Se conserva la memoria explícita en el nombre del catálogo y se descarta la memoria incompatible de un flyer compartido.
- La tabla compara hasta cinco campos técnicos comunes. Los datos propios adicionales se presentan en listas separadas. Si no hay características legibles no aparece un bloque técnico vacío; los precios y demás valores documentados siguen disponibles.
- Las filas de cuotas sólo aparecen cuando al menos un producto tiene un importe real disponible. Disponibilidad, garantía y colores se omiten cuando no hay valores conocidos. No se modifican precios, política financiera ni permisos de nivel.
- El service worker deja pasar directamente `/callback`, `/signin-with-chatgpt` y `/signout-with-chatgpt`. El runtime de Sites sigue siendo el único dueño del callback. La nueva revisión del caché conserva la instalación y la página offline. Un registro de Android mostró `/callback` con petición de subrecurso y respuesta 404; este cambio elimina la interferencia del worker, pero el resultado final necesita repetirse en el teléfono de Ángela. No se modifican cookies, cuentas, roles ni invitaciones.
- Se permite el host de fotos ya existente `cdn.catalog-store.link` en la configuración de imágenes: los registros publicados mostraban rechazos de ese host. No se modifica ninguna foto ni el catálogo maestro.

## Verificación

34 pruebas dirigidas pasaron, incluyendo fragmentos exactos de las capturas, datos incompletos, separación de Apple chip/cámara, memoria, comparación, foto/cuotas/link compartidos, permisos de suscriptores y exclusión de OAuth del service worker mediante ejecución real de sus eventos.

La suite histórica de continuidad también se revisó y conserva dos fallos ajenos a estos cambios: importación sin extensión en recientemente vistos y una expectativa antigua del texto de acceso interno. No se cambiaron esas áreas.

No hay acceso a Android real desde este entorno. Después de publicar, cerrar y volver a abrir la tienda permite recibir la actualización del service worker. Validar de nuevo la comparación y el gesto de volver de Ángela antes de declarar PASS Android.
