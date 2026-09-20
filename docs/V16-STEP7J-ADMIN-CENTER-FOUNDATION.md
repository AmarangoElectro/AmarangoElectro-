# AmarangoElectro V16 — Step 7J — Admin Center Foundation

## Objetivo

Construir la primera capa operativa del futuro Admin Center sin activar ningún acceso administrativo ni ninguna escritura productiva.

Este checkpoint rescata la intención útil del Legacy para:

- cotización USD editable por Administradores;
- costo ARS / costo USD;
- mayorista/proveedor;
- pegado masivo de listas;
- preview de altas/cambios antes de guardar;
- fecha de actualización/confirmación de precio;
- semáforo de antigüedad;
- conservación defensiva de foto existente;
- nuevos productos inicialmente ocultos.

## Regla de seguridad

`Admin Center` NO tiene ruta pública activa en Step 7J. No existe login falso ni contraseña en HTML.

Antes de activar operaciones reales se exige:

1. Supabase Auth o equivalente real.
2. rol Admin verificado server-side.
3. MFA para Administración.
4. RLS/permisos server-side auditados.
5. log de auditoría antes/después/actor.
6. comandos explícitos de escritura; nunca mutación durante render.

## Pegar lista — cambio respecto del Legacy

El Legacy contenía heurísticas útiles pero peligrosas, por ejemplo inferir que un `$` pequeño probablemente representaba USD. Step 7J no copia esa conducta.

El administrador selecciona uno de cuatro modos:

- `sale_ars`: el importe es precio de venta ARS;
- `cost_ars`: el importe es costo ARS;
- `cost_usd`: el importe es costo USD y necesita cotización;
- `mixed`: cada moneda debe venir explícita. Un `$` sin ARS/USD queda en revisión.

Formato principal compatible conceptualmente con Legacy:

```text
Nombre del producto | Precio
```

También se reconoce un USD explícito como `185usd`, pero nunca se publica desde el parser.

## Preview obligatorio

`parseBulkPriceText()` solo interpreta líneas.

`buildAdminImportPreview()`:

- busca coincidencia exacta normalizada de nombre;
- no hace fuzzy-match automático;
- si encuentra más de un candidato existente, exige revisión;
- conserva foto HTTPS existente si no se proporciona otra válida;
- ignora imagen no HTTPS;
- prepara diferencia `before/after`;
- marca `create`, `update`, `no_change`, `review_required` o `rejected`;
- devuelve siempre `writeAllowed: false`.

Un alta nueva se prepara con `visible=false`.

## USD

`fx-rate.ts` valida la cotización y permite calcular un costo ARS desde un costo USD solamente dentro de la capa interna. Cambiar USD real seguirá requiriendo Admin autenticado, MFA, autorización server-side y auditoría.

Step 7J no contiene una cotización comercial real ni consulta una fuente externa.

## Semáforo

Se mantiene la regla V16 definida en Step 7I.1:

- verde: 0–19 días;
- amarillo: 20–29 días;
- rojo: 30+ días;
- sin fecha: desconocido.

`priceConfirmedAt` puede renovar el reloj sin obligar a modificar el importe.

## Fuera de alcance

- escrituras Supabase;
- Auth/RLS reales;
- upload real de fotos;
- publicación/despublicación;
- sincronización de proveedores;
- importación real;
- backups productivos;
- Margarita / IA / WhatsApp;
- Administración conectada al storefront público.

## Preview visual

`prototypes/Admin-Center-Preview.html` es una maqueta offline y usa datos ilustrativos. No consulta ni modifica producción.

## Validación final

- 4/4 pruebas específicas Step 7J aprobadas.
- 41/41 pruebas acumuladas Step 7B → Step 7J aprobadas.
- Parser: ARS, USD, mixto, moneda ambigua, marcador incompatible y líneas vacías.
- Preview: altas ocultas, updates, foto HTTPS heredada, imagen insegura ignorada, proveedor y USD.
- Duplicados existentes: revisión humana obligatoria.
- `writeAllowed` permanece `false`.
- Sin `fetch`, XHR, cliente Supabase ni primitivas de escritura en `lib/internal/admin`.
- `app/` no importa `lib/internal/admin`.
- Archivos protegidos comparados contra Step 7I.2 permanecen byte-idénticos: Margarita, Purchase Intent, ProductActions, catálogo público, Supabase read-only y normalizadores Legacy.

No se declara build productivo completo en este checkpoint. La capa nueva está deliberadamente desconectada y se valida como lógica interna aislada hasta disponer de Auth/RLS reales.
