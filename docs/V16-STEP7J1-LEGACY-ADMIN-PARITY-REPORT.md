# AmarangoElectro V16 — Step 7J.1 Legacy Admin Parity

## Objetivo
Congelar como contrato que V16 debe conservar la operativa administrativa de la tienda Legacy antes de mejorarla. El rediseño visual no autoriza a eliminar formatos o herramientas que los dueños ya usan.

## Auditoría Legacy ampliada
Se revisó estáticamente `public/index.html`, `calculadora.html`, `public/admin-stable-actions.js`, `public/equipo-ventas-menu.js` y `public/asesor-registrar-venta.js` del ZIP de producción. No se ejecutó la app Legacy ni se consultó Supabase.

Se registraron **54 capacidades administrativas obligatorias/inventariadas** en `lib/internal/admin/legacy-admin-parity.ts`.

## Cargar celulares
Se creó `phone-bulk-import.ts` como módulo específico, separado del importador genérico. Conserva la lógica operativa de: PESOS/USD, listas partidas, tachados de WhatsApp, colores, normalización marca/modelo/memoria, actualización de existentes, conservación de foto/visibilidad/características/categoría, detección de faltantes y actualización de dólar sin volver a pegar.

La escritura sigue bloqueada: los resultados son preview, `writeAllowed=false`, y productos nuevos quedan no publicados hasta futura confirmación autorizada.

## Paridad de Administración
El contrato cubre catálogo, celulares, fotos, stock, visibilidad, merchandising, categorías, semáforo, USD, financiación, calculadora, comisiones, inversión, placas, papelera, backups, diagnósticos, proveedores, ventas/pedidos, clientes, reportes, equipo de ventas, banner, cupones, ruleta, suscriptores, PDF y vista como cliente.

## Seguridad
No se copiaron PINs, sesiones `localStorage`, upserts directos, mutación durante render ni borrado heurístico destructivo. Se conserva la función; se reemplaza el mecanismo inseguro.

## Validación
- Step 7J.1: 4/4 tests nuevos aprobados.
- Acumulado Step 7B → Step 7J.1: **45/45** tests aprobados.
- Margarita, Purchase Intent, ProductActions, catálogo público, Supabase read-only, adaptadores Legacy y Service Worker permanecen byte-idénticos al Step 7J.
- La capa Admin nueva no contiene `fetch`, cliente Supabase ni primitivas de escritura.

## Regla de futuro
Una función Legacy marcada `requiredInV16` no se elimina ni simplifica sin decisión explícita de los dueños. Primero paridad; después mejoras.
