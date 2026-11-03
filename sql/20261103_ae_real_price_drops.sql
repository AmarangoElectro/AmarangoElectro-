-- AmarangoElectro tienda vieja - registro veraz de bajas de PRECIO DE VENTA.
-- Aditivo: no cambia el costo, el precio vigente, las cuotas ni ofertas manuales.
-- Se conserva el precio realmente anterior durante 14 dias desde la baja.
create schema if not exists ae_private;
create or replace function ae_private.ae_merge_price_drop(
  p_old jsonb,p_next jsonb,p_kind text
) returns jsonb language plpgsql set search_path='' as $$
declare
  v_map jsonb:='{}'::jsonb;
  v_counts jsonb:='{}'::jsonb;
  v_items jsonb[]:=array[]::jsonb[];
  v_old jsonb;
  v_item jsonb;
  v_clean jsonb;
  v_key text;
  v_price_field text;
  v_was_txt text;
  v_now_txt text;
  v_was numeric;
  v_now numeric;
  v_date timestamp with time zone;
  v_keys text[];
  v_expiration interval:=interval '14 days';
begin
  if jsonb_typeof(p_old)<>'array' or jsonb_typeof(p_next)<>'array'
    or p_kind not in ('catalog','cellphones') then
    return p_next;
  end if;
  if jsonb_array_length(p_next)>20000 then return p_next; end if;
  v_price_field:=case when p_kind='cellphones' then 'precio' else 'venta' end;

  -- Keys son ids invariables para catálogo y nombre+mayorista para celulares
  -- sin id estable. Si hay colisiones, la baja no se anuncia.
  select coalesce(jsonb_object_agg(k, first_value),'{}'::jsonb),
         coalesce(jsonb_object_agg(k, cnt),'{}'::jsonb)
  into v_map,v_counts
  from (
    select k,(array_agg(elem))[1] as first_value,count(*)::int as cnt
    from (
      select elem,
        case when p_kind='cellphones'
          then lower(btrim(coalesce(elem->>'nombre','')))||'|'||
               lower(btrim(coalesce(elem->>'mayorista','')))
          else coalesce(elem->>'id','') end as k
      from jsonb_array_elements(p_old) elem
    ) x
    where k<>'' and k<>'|'
    group by k
  ) q;

  for v_item in select value from jsonb_array_elements(p_next)
  loop
    v_clean:=v_item - 'aeBajaAnterior' - 'aeBajaActual' - 'aeBajaFecha';
    v_key:=case when p_kind='cellphones'
      then lower(btrim(coalesce(v_item->>'nombre','')))||'|'||
           lower(btrim(coalesce(v_item->>'mayorista','')))
      else coalesce(v_item->>'id','') end;
    if v_key<>'' and v_key<>'|' and coalesce((v_counts->>v_key)::int,0)=1 then
      v_old:=v_map->v_key;
      if v_old is not null and
         lower(btrim(coalesce(v_old->>'nombre','')))=
         lower(btrim(coalesce(v_item->>'nombre',''))) then
        v_was_txt:=v_old->>v_price_field;
        v_now_txt:=v_item->>v_price_field;
        if coalesce(v_was_txt,'')~'^[0-9]+([.][0-9]+)?$'
           and coalesce(v_now_txt,'')~'^[0-9]+([.][0-9]+)?$'
           and length(v_was_txt)<15 and length(v_now_txt)<15 then
          v_was:=v_was_txt::numeric;
          v_now:=v_now_txt::numeric;
          if v_now>0 and v_was>0 then
            if v_now<v_was then
              v_clean:=v_clean||jsonb_build_object(
                'aeBajaAnterior',v_was,'aeBajaActual',v_now,
                'aeBajaFecha',to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"')
              );
            elsif v_now=v_was and
              coalesce(v_old->>'aeBajaActual','')=v_now_txt and
              coalesce(v_old->>'aeBajaAnterior','')~'^[0-9]+([.][0-9]+)?$' and
              (v_old->>'aeBajaAnterior')::numeric>v_now and
              coalesce(v_old->>'aeBajaFecha','')~'^[0-9]{4}-[0-9]{2}-[0-9]{2}T' then
              begin
                v_date:=(v_old->>'aeBajaFecha')::timestamptz;
                if v_date<=now() and v_date>now()-v_expiration then
                  v_clean:=v_clean||jsonb_build_object(
                    'aeBajaAnterior',v_old->'aeBajaAnterior',
                    'aeBajaActual',v_old->'aeBajaActual',
                    'aeBajaFecha',v_old->'aeBajaFecha'
                  );
                end if;
              exception when others then
                null;
              end;
            end if;
          end if;
        end if;
      end if;
    end if;
    v_items:=array_append(v_items,v_clean);
  end loop;
  return to_jsonb(v_items);
end $$;
revoke all on function ae_private.ae_merge_price_drop(jsonb,jsonb,text) from public,anon,authenticated;

create or replace function ae_private.ae_price_drop_catalog_trigger()
returns trigger language plpgsql set search_path='' as $$
begin
  if new.id in ('catalogo','catalogo_manuales')
     and jsonb_typeof(old.datos)='array'
     and jsonb_typeof(new.datos)='array' then
    new.datos:=ae_private.ae_merge_price_drop(old.datos,new.datos,'catalog');
  end if;
  return new;
end $$;
revoke all on function ae_private.ae_price_drop_catalog_trigger() from public,anon,authenticated;
create trigger ae_track_catalog_price_drops
before update of datos on public.tienda_catalogo
for each row when (new.id in ('catalogo','catalogo_manuales') and new.datos is distinct from old.datos)
execute function ae_private.ae_price_drop_catalog_trigger();

create or replace function ae_private.ae_price_drop_cellphone_trigger()
returns trigger language plpgsql set search_path='' as $$
begin
  if new.id='lista' and jsonb_typeof(old.datos)='array' and jsonb_typeof(new.datos)='array' then
    new.datos:=ae_private.ae_merge_price_drop(old.datos,new.datos,'cellphones');
  end if;
  return new;
end $$;
revoke all on function ae_private.ae_price_drop_cellphone_trigger() from public,anon,authenticated;
create trigger ae_track_cellphone_price_drops
before update of datos on public.celulares_lista
for each row when (new.id='lista' and new.datos is distinct from old.datos)
execute function ae_private.ae_price_drop_cellphone_trigger();
