# Contrato Supabase de solo lectura

## Estado de V16 Step 6

Supabase real está desactivado. La aplicación usa `MockCatalogAdapter`. No existe ninguna escritura automática ni conexión a datos reales.

## Estructura esperada

Cada fila debe mapear al tipo `Product` definido en `lib/catalog/types.ts`:

- `id`, `slug`, `name`, `brand`, `category`, `visible`;
- `model`, `subcategory`, `image`, `price`, `warranty` como campos opcionales/nulos;
- `financing`, `features`, `specifications` como colecciones;
- `availability` y `stock` con estados explícitos;
- `source = supabase-readonly` al completar el mapeo.

## Requisitos antes de activar

1. Confirmar nombres y tipos reales del esquema.
2. Auditar RLS con una identidad pública/anónima.
3. Usar una vista o recurso dedicado que no exponga datos internos.
4. Probar que buscar, filtrar, visitar y autenticar no producen mutaciones.
5. Validar respuestas con el contrato Zod antes de entregarlas a la interfaz.
6. Configurar `url`, `anonKey` y `resource` solo en servidor.

## Límite técnico

`SupabaseReadOnlyCatalogAdapter` implementa únicamente `GET`, exige `visible=eq.true` y rechaza respuestas que no cumplen el contrato público. No ofrece métodos de alta, edición, ocultamiento, actualización de precio ni borrado. Cualquier administración futura debe vivir en otro adaptador y otra superficie, con autorización explícita y pruebas independientes.
