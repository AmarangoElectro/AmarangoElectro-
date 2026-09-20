# AmarangoElectro V16 — Step 7A Snapshot Gate

## Propósito

Endurecer el ingreso de un futuro snapshot real antes de conectarlo al `LegacyCatalogAdapter`, sin ejecutar la tienda vieja, sin consultar Supabase y sin habilitar ninguna ruta de escritura.

## Qué cambia

1. Se incorpora `sanitizeLegacySnapshot()` como frontera offline de ingreso.
2. Solo sobreviven campos públicos o de estado estrictamente necesarios para decidir si un producto puede mostrarse.
3. Se descartan campos no permitidos (por ejemplo costo, mayorista, tokens, datos internos o cualquier clave desconocida).
4. El adaptador normaliza únicamente la copia sanitizada y congelada.
5. La detección de marcas de celulares queda alineada con las familias que ya reconoce el legacy auditado, sin cambiar manualmente la UI ni inventar productos.
6. Los diagnósticos de duplicados reconocen alias conservadores como `Moto`/`Motorola`, pero nunca ocultan ni eliminan registros.

## Lo que NO cambia

- `catalog` sigue usando `MockCatalogAdapter`.
- No se consulta Supabase.
- No se modifica RLS, Storage, SQL ni producción.
- No se ejecuta el legacy.
- No se activa administración.
- Margarita / IA / Workers / WhatsApp continúan **PENDIENTE — NO MIGRAR TODAVÍA**.
- No se cambian banners, Home, navegación ni diseño aprobado.

## Evidencia que sigue faltando

Para activar un piloto real todavía se requiere un snapshot sanitizado y explícitamente proporcionado de `tienda_catalogo` y/o `celulares_lista`. Hasta recibirlo, V16 no debe inventar productos ni consultar producción por su cuenta.
