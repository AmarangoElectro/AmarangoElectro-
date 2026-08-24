-- AmarangoElectro — corrección de raíz para timeout al guardar catálogo
-- Preparado para aplicar DESPUÉS de validar la rama.
-- No cambia tablas ni datos: reemplaza únicamente la implementación interna
-- de los dos triggers ya existentes sobre public.tienda_catalogo.

begin;

-- 1) Mantiene la protección histórica de fotos, pero de forma set-based.
-- La versión anterior concatenaba un array JSON dentro de un loop producto por
-- producto. Con catálogos grandes ese patrón crece muy mal y consume parte del
-- statement_timeout del rol anon.
create or replace function public.amarango_proteger_fotos_catalogo()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
begin
  if new.id <> 'catalogo' or jsonb_typeof(new.datos) <> 'array' then
    return new;
  end if;

  select coalesce(
    jsonb_agg(
      case
        -- Foto manual Amarango: prioridad absoluta.
        when coalesce(x.value->>'fotoManualProveedor', '') <> '' then
          jsonb_set(
            x.value,
            '{foto}',
            to_jsonb(x.value->>'fotoManualProveedor'),
            true
          )

        -- Compatibilidad histórica: si un automático ya apunta al bucket
        -- tienda-fotos, adoptar esa URL como foto manual protegida.
        when coalesce(x.value->'automaticoProveedor', 'false'::jsonb) = 'true'::jsonb
             and coalesce(x.value->>'foto', '') like '%/tienda-fotos/%' then
          jsonb_set(
            x.value,
            '{fotoManualProveedor}',
            to_jsonb(x.value->>'foto'),
            true
          )

        else x.value
      end
      order by x.ord
    ),
    '[]'::jsonb
  )
  into new.datos
  from jsonb_array_elements(new.datos) with ordinality as x(value, ord);

  return new;
end;
$$;

-- 2) Mantiene el espejo incremental, pero elimina el loop de 1.292 upserts
-- secuenciales. Se calculan los ids una sola vez y se insertan/actualizan sólo
-- los productos cuyo JSON realmente cambió.
create or replace function public.sincronizar_tienda_productos_incremental()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  ids_presentes text[] := array[]::text[];
begin
  if new.id <> 'catalogo' or jsonb_typeof(new.datos) <> 'array' then
    return new;
  end if;

  select coalesce(array_agg(x.value->>'id'), array[]::text[])
    into ids_presentes
  from jsonb_array_elements(new.datos) as x(value)
  where coalesce(x.value->>'id', '') <> '';

  with incoming as (
    select x.value->>'id' as producto_id,
           x.value as datos
    from jsonb_array_elements(new.datos) as x(value)
    where coalesce(x.value->>'id', '') <> ''
  ),
  changed as (
    select i.producto_id, i.datos
    from incoming i
    left join public.tienda_productos_incremental t
      on t.producto_id = i.producto_id
    where t.producto_id is null
       or t.eliminado = true
       or t.datos is distinct from i.datos
  )
  insert into public.tienda_productos_incremental
    (producto_id, datos, eliminado, version, actualizado)
  select c.producto_id,
         c.datos,
         false,
         nextval('public.tienda_productos_version_seq'),
         now()
  from changed c
  on conflict (producto_id) do update
    set datos = excluded.datos,
        eliminado = false,
        version = excluded.version,
        actualizado = excluded.actualizado;

  -- Marcar como eliminados sólo los ids que ya no existen en el catálogo.
  update public.tienda_productos_incremental
     set eliminado = true,
         version = nextval('public.tienda_productos_version_seq'),
         actualizado = now()
   where eliminado = false
     and not (producto_id = any(ids_presentes));

  return new;
end;
$$;

commit;
