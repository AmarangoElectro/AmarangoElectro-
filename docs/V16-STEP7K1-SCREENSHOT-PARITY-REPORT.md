# V16 Step 7K.1 — Screenshot Parity Lock + Faster Admin UX

## Objetivo
Convertir las capturas reales de Administración aportadas por los dueños en un contrato explícito de paridad. La V16 conserva las funciones y mejora su acceso; no reduce la herramienta por razones estéticas.

## Capacidades explicitadas por las capturas
Además del contrato previo, se fijaron como capacidades obligatorias: Qué busca tu gente, Qué promocionar, limpiar productos raros, Programa Colaborador, Compartir varios, QR, compartir tienda, color/sonido/tema, cierre de sesión real, Equipo de eventos, favoritos de Admin, copiar Nombre/Todo, Instagram, descargar imagen, Costo→Venta, Venta→Costo, Reemplazar todo el catálogo y sesión segura de fotos.

## Mejora UX aplicada
- Centro de herramientas agrupado, sin perder búsqueda global.
- Acciones del producto cerca del producto.
- Editor individual en una sola superficie, costo y venta visibles juntos.
- Costo→Venta y Venta→Costo a un toque.
- Importador catálogo mantiene Costo/Venta/USD, foto, categoría, características, mayorista y reemplazo total.
- Importador celulares sigue separado y conserva faltantes/metadata.
- Acciones de alto riesgo no son primarias y exigen preview.
- Mobile mantiene acceso inferior rápido y hojas de trabajo tipo app.

## Seguridad
Sigue sin ruta Admin pública, sin Auth ficticia, sin Supabase write, sin publicación real, sin mutación de producción y sin Margarita/Workers en la capa administrativa.

## Validación
- Batería acumulada Step 7B→7K.1: 53/53 aprobada.
- Contrato de screenshots: etiquetas y targets validados.
- Búsqueda global alcanza nuevas herramientas.
- Capa Admin interna sin `fetch`, cliente Supabase ni primitivas de escritura.
- Archivos protegidos del storefront, Margarita, Worker y Service Worker no fueron modificados.
