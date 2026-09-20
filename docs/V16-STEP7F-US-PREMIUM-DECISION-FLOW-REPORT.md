# AmarangoElectro V16 — Step 7F
## US Premium Decision & Consultation Flow

### Objetivo

Cerrar el tramo `descubrimiento → comparación → ficha → intención` sin simular un checkout que AmarangoElectro todavía no tiene conectado y sin derivar la acción comercial a Margarita, WhatsApp o producción.

La capa nueva hace visible el siguiente paso con una acción principal `Quiero este`, abre un panel local de intención y permite revisar un resumen antes de cualquier handoff futuro.

### Criterio UX 2026

La implementación toma como referencia investigación reciente de Baymard sobre Product Page y Mobile Ecommerce UX: la ficha es el centro de la decisión y, en pantallas pequeñas, la siguiente acción comercial debe poder identificarse rápidamente y operar con poco esfuerzo. También se evita introducir pasos y formularios prematuros.

Este checkpoint no implementa checkout, pagos ni mensajería. Construye la transición comercial previa.

### Flujo implementado

1. En la PDP, la acción primaria pasa a `Quiero este`.
2. Se abre un sheet lateral en desktop y bottom sheet en mobile.
3. El producto queda fijado visualmente en el panel.
4. El cliente elige una intención:
   - Quiero este.
   - Ver cuotas.
   - Confirmar disponibilidad.
   - Consultar entrega.
5. Puede agregar una nota opcional de hasta 240 caracteres.
6. Antes de cualquier continuidad, V16 muestra un resumen exacto.
7. El usuario puede copiar ese resumen localmente.

### Honestidad de datos

El resumen usa únicamente campos públicos ya existentes en `Product`:

- nombre;
- marca;
- modelo;
- precio publicado;
- disponibilidad;
- primera financiación publicada, solo si existe;
- URL del producto.

Cualquier campo ausente se representa como `A confirmar`. No se estima precio, financiación, stock ni entrega.

### Privacidad y alcance

El flujo no solicita:

- nombre y apellido;
- DNI;
- teléfono;
- correo;
- dirección;
- referencias;
- datos de pago.

La nota vive solo en memoria del componente mientras el panel está abierto. No hay persistencia del borrador.

### Accesibilidad y mobile

- `role="dialog"` + `aria-modal`.
- Escape cierra.
- foco inicial en el botón cerrar.
- ciclo de Tab contenido dentro del sheet.
- restauración del foco al elemento que abrió el flujo.
- bloqueo temporal de scroll del body.
- bottom sheet mobile con altura limitada por `dvh`.
- `prefers-reduced-motion` desactiva transiciones.

### Sonic UX

Se añade el cue `intent`, generado localmente mediante Web Audio API. Solo suena después de la acción directa `Quiero este`. No hay autoplay ni archivos externos.

### Seguridad

Step 7F no agrega:

- `fetch`;
- XHR;
- cliente Supabase;
- INSERT/UPSERT/UPDATE/RPC;
- POST/PUT/PATCH/DELETE de red;
- Workers;
- webhooks;
- prompts;
- IA;
- integración con Margarita;
- integración con WhatsApp.

`MockCatalogAdapter` continúa siendo la fuente activa.

### Margarita

`margarita-button.tsx` no se modifica en este checkpoint. La nueva acción `Quiero este` usa un evento independiente (`amarango:purchase-intent`) y no dispara `amarango:consult-product`.

Margarita continúa en estado previo de UI pendiente y queda fuera del alcance de Step 7F.

### Próximo paso recomendado

Con el recorrido visual ya cerrado, el siguiente checkpoint debería concentrarse en resiliencia/performance mobile y en preparar un contrato de handoff auditable para el canal definitivo, manteniéndolo desconectado hasta disponer de los datos y la arquitectura aprobados.

### Validación ejecutada en este checkpoint

Batería específica acumulada:

```text
Step 7B Sonic UX          4/4
Step 7C Discovery         4/4
Step 7D Premium PDP       4/4
Step 7E Comparison        4/4
Step 7F Decision Flow     4/4
TOTAL                    20/20
```

También se ejecutó transpilación sintáctica independiente de los 5 archivos TS/TSX modificados/nuevos mediante TypeScript `transpileModule`: 0 diagnósticos sintácticos.

La comparación contra el ZIP Step 7E confirmó hash idéntico para:

- `app/components/margarita-button.tsx`;
- `lib/catalog/index.ts`;
- `lib/catalog/supabase-readonly.ts`;
- `lib/catalog/legacy/legacy-catalog-adapter.ts`;
- `lib/catalog/legacy/legacy-normalizer.ts`;
- `lib/catalog/legacy/legacy-snapshot-sanitizer.ts`.

El escaneo de la capa Step 7F no detectó rutas de red ni primitivas de escritura productiva.

#### Limitación del entorno

No se afirma `npm run build` ni el suite heredado completo: el ZIP no incluye `node_modules` y este entorno no reconstruyó el árbol npm. Las pruebas heredadas que requieren `dist/server/index.js` o importación directa del normalizador con `zod` quedan bloqueadas por esa infraestructura, no se contabilizan como aprobadas.
