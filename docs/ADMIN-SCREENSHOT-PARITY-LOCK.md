# Step 7K.1 — Screenshot Parity Lock

## Decisión de los dueños
Las capturas del Admin Legacy aportadas el 28/08/2026 se consideran evidencia operativa oficial. V16 no puede eliminar una función visible en esas capturas por razones de rediseño. La paridad se preserva y las mejoras se aplican por encima: menos pasos, mejor agrupación, preview, auditoría, seguridad, accesibilidad y performance.

## Regla de diseño
**No simplificar quitando funciones. Simplificar el acceso a las funciones.**

- Acciones de contexto del producto permanecen cerca del producto.
- Editor de producto permanece en una sola vista densa y legible.
- `Costo → Venta` y `Venta → Costo` siguen a un toque.
- Pegar catálogo mantiene Costo / Venta / USD, foto, categoría, características, mayorista y opción de reemplazo total.
- Cargar celulares mantiene su flujo propio y no se fusiona con catálogo genérico.
- Herramientas largas pasan a grupos + búsqueda global, pero ninguna desaparece.
- Acciones peligrosas siguen disponibles, pero se separan visualmente y requieren preview/confirmación.
- Funciones de informes (`Qué busca tu gente`, `Qué promocionar`) solo usarán datos reales.
- Preferencias de apariencia/sonido se conservan, pero no comprometen rendimiento ni seguridad.

## Mejoras de practicidad V16
1. **Barra contextual del producto**: Editar, compartir, Instagram, descargar imagen, copiar nombre/todo, visibilidad, stock y merchandising sin navegar a otra sección.
2. **Editor de una sola pantalla**: nombre, costo, venta, conversiones, categoría, mayorista, características, foto/stock y guardado seguro.
3. **Centro de herramientas agrupado**: Catálogo, Ventas/CRM, Informes, Marketing, Finanzas, Recuperación, Apariencia y Seguridad.
4. **Buscador global**: cualquier herramienta Legacy localizable por nombre o palabra clave.
5. **Favoritos de Admin**: los dueños podrán fijar sus herramientas más usadas arriba.
6. **Contexto persistente**: volver de editar/importar no pierde filtros, mayorista ni posición.
7. **Preview obligatorio**: cargas masivas, reemplazo total, ocultar varios, restaurar backup y publicación muestran el diff antes de mutar.

## Seguridad
Step 7K.1 sigue siendo contrato + prototipo. No habilita rutas Admin, Auth ficticia, Supabase write, publicación real ni automatismos administrativos.
