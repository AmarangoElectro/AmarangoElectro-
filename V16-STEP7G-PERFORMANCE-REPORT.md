# AmarangoElectro V16 — Step 7G
## Mobile Performance + Perceived Speed

## Objetivo

Subir la sensación de fluidez de V16 sin falsear “Hz”, sin agregar librerías pesadas y sin conectar producción. El criterio es reducir trabajo de render/pintura, preservar geometría durante carga y degradar de forma elegante en condiciones móviles desfavorables.

## Referencias de diseño/performance consideradas

- Core Web Vitals como presupuesto operativo: LCP <= 2,5 s, INP <= 200 ms y CLS <= 0,1 en el percentil 75.
- Mobile-first: priorizar experiencia real en smartphone y conexiones variables.
- Chrome 152 estable (25/08/2026): CPU Performance API como mejora progresiva para adaptar fidelidad visual según tier de CPU.
- Perceived performance: skeletons con la misma geometría del contenido final y lazy/progressive rendering para trabajo fuera de viewport.
- Reducir JavaScript y efectos visuales no esenciales antes que intentar “forzar” frecuencia de refresco.

## Cambios Step 7G

### 1. Skeletons de ruta con geometría estable

Se agregaron `loading.tsx` para Home, categoría y ficha de producto. Los placeholders reservan alturas, columnas y bloques equivalentes a la pantalla final para evitar saltos visuales durante streaming/carga.

No hay spinner central ni pantalla en blanco. El shimmer usa una capa transformada y se desactiva con `prefers-reduced-motion`.

### 2. Hero consciente de visibilidad y red

El carrusel:

- pausa autoplay cuando sale del viewport;
- pausa si la pestaña queda oculta;
- pausa con `prefers-reduced-motion`;
- pausa en Data Saver / 2G;
- en red limitada no precarga el siguiente banner;
- monta la imagen solicitada cuando el usuario navega manualmente.

Esto reduce CPU, batería y tráfico cuando el hero ya no aporta valor.

### 3. Catálogo concurrente / diferido

Búsqueda, marca, orden y favoritos mantienen controles inmediatos pero el trabajo de resultados usa valores diferidos de React. La sincronización de URL usa esos valores diferidos, por lo que ya no ejecuta `history.replaceState` por cada tecla a máxima velocidad.

Mientras React está conciliando el resultado, el catálogo expone `aria-busy` y una señal discreta `Actualizando…`.

### 4. Render/pintura fuera de viewport

Cards y bloques largos usan `content-visibility: auto` y `contain-intrinsic-size` cuando el navegador lo soporta. El objetivo es no dedicar layout/paint completo a contenido lejano durante el scroll inicial.

### 5. Perfil local `lean`

`PerformanceBudget` consulta exclusivamente señales locales del navegador. Si detecta Data Saver, 2G o un CPU Performance tier 1–2 en navegadores compatibles, aplica `data-performance-profile="lean"` y CSS reduce:

- animaciones infinitas;
- blur/backdrop-filter no esencial;
- sombras pesadas;
- precarga visual del hero.

No se recopila telemetría, no se transmite la conexión ni el tier de CPU y no existe llamada de red asociada. La CPU Performance API se usa solo si el navegador la expone; en otros navegadores la experiencia mantiene el fallback normal.

### 6. Android / touch

En dispositivos `pointer: coarse` / sin hover:

- se eliminan elevaciones hover que no aportan al tacto;
- se reducen sombras;
- se acortan transiciones decorativas;
- se conserva `touch-action: manipulation` para controles normales.

## Seguridad y alcance

Step 7G no conecta Supabase real, no cambia el adapter activo y no agrega escrituras. `MockCatalogAdapter` continúa activo.

Fuera de alcance y sin integración nueva:

- Margarita;
- WhatsApp;
- Workers;
- IA/prompts;
- webhooks;
- SQL/RLS;
- precio, stock, visibilidad o publicación productiva.

## Validación

La batería específica Step 7B–7G se ejecuta con `node --test`. También se compara el perímetro de cambios contra Step 7F y se verifican hashes de archivos protegidos antes del empaquetado final.

El build npm completo solo debe declararse aprobado si el entorno tiene el árbol de dependencias instalado; este checkpoint no convierte ausencia de dependencias en un falso positivo.

## Resultado de QA en este entorno

- Step 7B–7G: 24/24 tests específicos aprobados.
- 8 archivos TS/TSX nuevos o modificados: transpilación sintáctica aprobada con TypeScript 5.x disponible en el entorno.
- Archivos protegidos de Margarita, Supabase read-only, adapter Legacy, normalizador, snapshot gate, PDP y flujo de intención: hashes idénticos a Step 7F.
- El test histórico de Step 6 para preload del hero se actualizó para comprobar la nueva regla progresiva: preload del siguiente banner solo fuera de modo restringido.
- Se intentó instalar dependencias bloqueadas para ejecutar Vinext completo. `npm run install:ci` no pudo resolver `registry.npmjs.org` (`curl: Could not resolve host`). Por lo tanto no se declara `npm run build` como aprobado ni fallido por código: no llegó a iniciar.
