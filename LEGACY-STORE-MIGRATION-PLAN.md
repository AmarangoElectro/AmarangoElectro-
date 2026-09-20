# LEGACY STORE MIGRATION PLAN

## Objetivo

Recibir la tienda actual, entenderla sin ejecutarla contra producción y decidir función por función qué conviene reutilizar, reescribir, descartar o dejar pendiente.

## Estado Step 7

Se recibió y auditó estáticamente `AmarangoElectro--main.zip`. El código permitió completar decisiones provisionales en `docs/MIGRATION-MATRIX.md`, `LEGACY-PRODUCT-SCHEMA.md`, `LEGACY-CATALOG-AUDIT.md`, `LEGACY-ADMIN-MAP.md` y `LEGACY-FINANCING-MAP.md`.

El paquete no contiene un snapshot real de `tienda_catalogo`/`celulares_lista`, políticas RLS completas ni contratos sanitizados. Esas áreas siguen pendientes y no se conectó producción.

## Regla de seguridad para la recepción

1. Trabajar con una copia o exportación; nunca sobre `main` ni producción.
2. No incluir claves `service_role`, contraseñas, tokens activos ni archivos `.env` con secretos. Entregar únicamente una plantilla `.env.example` con nombres de variables.
3. No ejecutar migraciones, seeds, Edge Functions, webhooks, sincronizaciones o scripts de administración durante la auditoría.
4. Bloquear o sustituir toda escritura antes de levantar el proyecto localmente.
5. Usar datos sanitizados o un snapshot sin información personal.
6. Registrar hashes y fecha de cada paquete recibido para poder repetir el análisis.

## Archivos y datos necesarios

### 1. Código y mapa general

- ZIP o repositorio de la versión actualmente productiva, incluyendo historial o etiqueta del commit desplegado.
- `package.json`, lockfile, configuración de build y versión de Node.
- Árbol de rutas/páginas/componentes.
- Servicios, utilidades, hooks, stores y módulos de estado.
- Workers, funciones serverless, Edge Functions y tareas programadas.
- `.env.example` sin valores y lista del entorno donde vive cada variable.
- Configuración de despliegue sin credenciales.

### 2. Supabase

- URL o referencia de proyecto solo para identificar el entorno, sin claves secretas.
- Esquema exportado: tablas, vistas, columnas, tipos, enums, índices y relaciones.
- Migraciones SQL versionadas.
- Políticas RLS y permisos por rol.
- Funciones, triggers, RPC, cron, Realtime y colas.
- Buckets de Storage, políticas y convención de rutas de imágenes.
- Edge Functions y sus contratos HTTP.
- Configuración de Auth, proveedores y plantillas, sin secretos.
- Ejemplos sanitizados de respuestas reales del catálogo.
- Confirmación de qué vista o tabla es la fuente oficial de lectura pública.

### 3. Catálogo y productos

- Modelo real de producto y ejemplos sanitizados.
- Identificador interno, slug, nombre, marca, modelo, categoría y subcategoría.
- Precio, moneda y fuente de actualización.
- Financiación: cuotas, importes, vigencia y reglas comerciales.
- Disponibilidad, stock, depósitos y definición de “sin stock”.
- Visibilidad, destacado, producto del día y reglas de vencimiento.
- Características, especificaciones, descripción y garantía.
- Imágenes: principal, galería, orden, alt text, fallbacks y URLs de Storage.
- Campos obligatorios, opcionales, nulos y valores históricos.
- Proceso actual de alta, edición, ocultamiento, importación y sincronización.

### 4. Categorías, búsqueda y filtros

- Fuente de categorías y subcategorías.
- Alias, sinónimos y reglas de normalización.
- Orden manual o automático.
- Buscador: campos indexados, coincidencia, tolerancia y ranking.
- Filtros disponibles y comportamiento combinado.
- Reglas para productos ocultos, sin stock o sin precio.
- Categorías adicionales detectadas en el catálogo real.

### 5. Favoritos y compartir

- Clave y formato de almacenamiento de favoritos.
- Sincronización entre dispositivos o usuarios, si existe.
- Eventos internos y listeners.
- Web Share API, clipboard y fallbacks.
- Construcción de URLs canónicas y metadata de producto.

### 6. WhatsApp y Margarita

- Punto exacto donde se construye la consulta.
- Payload real: producto, modelo, categoría, URL e ID.
- Número oficial y reglas de derivación, documentados pero no activados en la copia.
- Worker/servicio de Margarita, prompts, herramientas y límites.
- Mensajes, tarjetas de producto, “Ver en tienda” y “Compartir”.
- Manejo de sesión, contexto, errores, horarios y costo.
- Eventos que conectan la tienda con Margarita.

### 7. Login, asesores, administradores y roles

- Flujo de autenticación y recuperación de sesión.
- Definición real de roles y fuente de autorización.
- Políticas de acceso para clientes, asesores, administradores y dueños.
- Pantallas y funciones internas por rol.
- Operaciones administrativas que escriben en catálogo.
- Auditoría, logs, confirmaciones y reversión.
- Acciones que hoy se disparan al renderizar, navegar, buscar o filtrar.

### 8. Operación y errores

- Registro de errores de frontend y backend.
- Estados de carga, vacío, offline y reintento.
- Monitoreo, analítica y alertas.
- Problemas conocidos y pasos para reproducirlos.
- Pruebas existentes y resultados del último despliegue.

## Paquete de evidencia recomendado

```text
legacy-store-audit/
├── source/                     # código, sin secretos
├── schema/                     # esquema, RLS, funciones y Storage
├── contracts/                  # JSON sanitizado y contratos HTTP/eventos
├── screenshots/                # flujos cliente/asesor/admin
├── tests/                      # pruebas y resultados conocidos
├── inventory.md                # versiones, despliegues y responsables
└── known-issues.md             # bugs y riesgos actuales
```

## Método de evaluación aplicado

Para cada función se exige:

1. Ubicar archivo, ruta, evento y dependencia.
2. Describir entradas, salidas y efectos secundarios.
3. Confirmar si lee o escribe datos.
4. Reproducirla con datos sanitizados y red bloqueada para escrituras.
5. Revisar errores, seguridad, performance y cobertura.
6. Comparar su contrato con la arquitectura V16.
7. Asignar una decisión provisional con evidencia.
8. Implementar primero un adaptador o prueba aislada.
9. Integrar una función por checkpoint, empezando por Celulares.

## Criterios de decisión

- **Reutilizar:** lógica correcta, acotada, probada, sin dependencia visual vieja y compatible con solo lectura.
- **Reescribir:** la intención sirve, pero mezcla UI/datos, tiene efectos secundarios, carece de validación o no encaja en V16.
- **Descartar:** duplicada, insegura, obsoleta o contraria a la experiencia aprobada.
- **Pendiente de auditoría:** no hay código, contrato o evidencia suficiente. Es el estado obligatorio inicial.

## Orden de migración actualizado

1. Contrato de catálogo y vista pública read-only. **Completado en código, sin activar fuente real.**
2. Celulares con productos reales sanitizados de prueba. **Bloqueado hasta recibir snapshot.**
3. Búsqueda, filtros, visibilidad, stock e imágenes.
4. Ficha, favoritos y compartir.
5. Consulta estructurada, WhatsApp y Margarita.
6. Auth y roles.
7. Administración en aplicación/capa separada del storefront.

La matriz operativa completa está en `docs/MIGRATION-MATRIX.md`.
