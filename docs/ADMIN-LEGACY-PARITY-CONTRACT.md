# AmarangoElectro V16 — Contrato de paridad Administración Legacy

## Regla aprobada

Administración se migra por **paridad funcional antes que rediseño funcional**. V16 debe reconocer los formatos y preservar los flujos operativos que los dueños ya usan. Las mejoras admitidas sin cambiar el flujo son: seguridad real, preview antes de escribir, auditoría, reportes, diagnósticos, accesibilidad, performance y diseño.

Una función Legacy no desaparece por decisión técnica. Solo puede retirarse si los dueños la marcan explícitamente como innecesaria.

## Cargar / actualizar catálogo

Se preserva el formato Legacy y sus modos:

- una línea por producto;
- separadores históricos `|`, `¦`, `;`, tab o espacios amplios cuando sean inequívocos;
- `Nombre | Precio`;
- modo **Costo ARS**;
- modo **Venta ARS**;
- modo **USD** con cotización;
- categoría opcional para toda la carga;
- características opcionales;
- mayorista/proveedor opcional;
- foto opcional;
- actualizar existentes sin perder foto/características;
- detectar nuevos;
- detectar coincidencias dudosas.

Cambio V16 de seguridad: primero `Analizar → Preview → revisar dudas → Confirmar`; nunca guarda mientras interpreta el texto.

## Cargar celulares — paridad específica

No se reemplaza por el importador genérico. Es un flujo propio porque el Legacy contiene lógica útil específica de celulares:

1. **Precio en PESOS**: la cifra pegada es precio de venta.
2. **Precio en USD**: la cifra pegada es costo USD; se conserva el USD original y la cotización usada.
3. **Actualizar dólar sin pegar nada**: recalcula todos los celulares que conservan `originalUsd`.
4. Admite nombre y precio en una línea o precio/color como continuación de la línea anterior.
5. Ignora encabezados típicos de listas de proveedores.
6. Ignora precios viejos tachados con `~...~` de WhatsApp.
7. Detecta `$`, `USD`, `U$S`, `US$`, precio al final y, como fallback Legacy, el número mayor de la línea.
8. Extrae colores entre paréntesis.
9. Normaliza marcas/modelos/memoria para reconocer el mismo equipo aunque cambie levemente la escritura.
10. Los repetidos actualizan el precio.
11. Los nuevos se agregan.
12. Al actualizar conserva foto, visibilidad, características y categoría del anterior.
13. El banco de fotos por modelo permite recuperar imágenes aunque una lista se reemplace.
14. Si un celular anterior no viene en la lista nueva, Administración debe elegir: **dejar / marcar sin stock / enviar a papelera**.
15. Permite borrar toda la lista o borrar por marca; en V16 será soft-delete/papelera con auditoría.
16. Ordena por marca manteniendo el orden de aparición de las marcas de la lista.
17. Advierte inconsistencias donde una variante con más memoria queda al mismo precio o más barata.
18. La carga masiva de características sigue siendo un flujo separado y empareja specs por nombre/modelo.

Cambio V16 de seguridad: los nuevos quedan no publicados hasta confirmación administrativa server-side. La interacción y los formatos se conservan; se elimina la publicación implícita.

## Inventario de herramientas administrativas Legacy

El contrato de código `lib/internal/admin/legacy-admin-parity.ts` incluye como obligatorias, entre otras:

- catálogo masivo y edición individual;
- celulares masivos, USD, características y banco de fotos;
- precio confirmado y semáforo;
- cotización USD por producto;
- planes de cuotas;
- calculadora, comisiones, inversión/capital compartido y placas;
- fotos Amarango / foto proveedor;
- stock, sin stock y poco stock;
- visible/oculto, destacados y producto del día;
- ofertas y cuotas sin interés;
- categorías, restaurar categoría proveedor y reclasificación;
- operaciones masivas de visibilidad;
- diagnóstico de duplicados, ocultos y bandejas de revisión;
- papelera;
- backups: lista, exportación y restauración;
- diagnóstico operativo de nube;
- mayoristas/proveedores y futura sincronización backend;
- historial de pedidos/ventas;
- clientes;
- estadísticas/reportes;
- equipo de ventas/usuarios;
- banner;
- cupones;
- ruleta (se conserva en inventario hasta decisión explícita de los dueños);
- formato visual de cuotas;
- suscriptores;
- PDF de catálogo;
- vista previa como cliente.

## Fuera de la paridad literal

Se reemplazan mecanismos inseguros, no funciones:

- PINs hardcodeados → Auth + rol + MFA;
- `localStorage` como autorización → sesión real;
- guardado/publicación desde render → comando explícito;
- upserts directos desde storefront → API server-side autorizada;
- deduplicación destructiva heurística → diagnóstico + decisión humana;
- backup local como única recuperación → versionado server-side;
- métricas simuladas → solo métricas reales.

## Estado Step 7J.1

Este checkpoint crea el contrato y el parser/preview específico de celulares. Sigue sin ruta pública, sin Auth ficticia y sin escritura en Supabase/producción.
