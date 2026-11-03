-- AmarangoElectro tienda vieja: cotización por producto verificable y duradera.
-- El cambio se autoriza con Supabase Auth owner/admin, no con el PIN del frontend.
-- Se actualiza solamente el producto elegido. No se altera el dólar general.
create table if not exists public.ae_tienda_usd_manual_rates (
 proveedor_clave text not null check(length(proveedor_clave) between 1 and 70),
 proveedor_id text not null check(length(proveedor_id) between 1 and 200),
 tasa numeric(12,2) not null check(tasa between 100 and 10000),
 actualizado timestamptz not null default now(),
 usuario uuid references auth.users(id),
 primary key(proveedor_clave,proveedor_id)
);
alter table public.ae_tienda_usd_manual_rates enable row level security;
revoke all on public.ae_tienda_usd_manual_rates from public,anon,authenticated;

create schema if not exists ae_private;

create or replace function ae_private.ae_tienda_markup_usd(p_costo numeric)
returns numeric language sql immutable set search_path='' as $$
 select round( p_costo * (case when p_costo<=50000 then 1.8
  when p_costo<=100000 then 1.6
  when p_costo<=250000 then 1.5
  when p_costo<=350000 then 1.4
  else 1.3 end) / 500 ) * 500;
$$;
revoke all on function ae_private.ae_tienda_markup_usd(numeric) from public,anon,authenticated;

-- Mantener antiguas tasas manuales que SÍ fueron guardadas en la nube.
-- Sólo sembrar las que existen, sin aplicar nuevas tasas a ningún producto.
insert into public.ae_tienda_usd_manual_rates(proveedor_clave,proveedor_id,tasa)
select distinct on (elem->>'proveedorClave',elem->>'proveedorId')
       elem->>'proveedorClave',elem->>'proveedorId',
       (elem->>'cotizacionDolarManual')::numeric
from public.tienda_catalogo c cross join lateral jsonb_array_elements(c.datos) elem
where c.id='catalogo'
 and elem->>'monedaProveedor'='USD'
 and length(coalesce(elem->>'proveedorClave','')) between 1 and 70
 and length(coalesce(elem->>'proveedorId','')) between 1 and 200
 and (elem->>'cotizacionDolarManual') ~ '^[0-9]{3,5}([.][0-9]{1,2})?$'
 and (elem->>'cotizacionDolarManual')::numeric between 100 and 10000
on conflict(proveedor_clave,proveedor_id) do nothing;

-- Antes que el registro de bajas (BAJAMOS), para comparar precios correctos.
create or replace function ae_private.ae_tienda_preservar_usd_manual()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.id<>'catalogo' or jsonb_typeof(new.datos)<>'array' then return new; end if;
 if not exists(select 1 from public.ae_tienda_usd_manual_rates limit 1) then return new; end if;

 select coalesce(jsonb_agg(
   case
   when r.tasa is not null
     and e.elem->>'monedaProveedor'='USD'
     and coalesce(e.elem->>'precioProveedorOriginal','') ~ '^[0-9]{1,8}([.][0-9]{1,2})?$'
     and (e.elem->>'precioProveedorOriginal')::numeric>0
   then e.elem || jsonb_build_object(
     'costo',round((e.elem->>'precioProveedorOriginal')::numeric * r.tasa),
     'venta',ae_private.ae_tienda_markup_usd(round((e.elem->>'precioProveedorOriginal')::numeric * r.tasa)),
     'cotizacionDolar',r.tasa,
     'cotizacionDolarManual',r.tasa,
     'usdConvertido',true
   )
   else e.elem
   end order by e.ord
 ),'[]'::jsonb) into new.datos
 from jsonb_array_elements(new.datos) with ordinality e(elem,ord)
 left join public.ae_tienda_usd_manual_rates r
   on r.proveedor_clave=e.elem->>'proveedorClave'
  and r.proveedor_id=e.elem->>'proveedorId';
 return new;
end $$;
revoke all on function ae_private.ae_tienda_preservar_usd_manual() from public,anon,authenticated;
create trigger ae_keep_catalog_usd_manual
before update of datos on public.tienda_catalogo
for each row when (new.id='catalogo' and new.datos is distinct from old.datos)
execute function ae_private.ae_tienda_preservar_usd_manual();

-- Única vía autorizada de escritura: sesión Auth de owner/admin confirmada.
create or replace function public.ae_tienda_cotizacion_manual_guardar(
 p_proveedor_clave text,p_proveedor_id text,p_tasa numeric
) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 v_uid uuid;
 v_catalogo jsonb;
 v_nuevo jsonb;
 v_producto jsonb;
 v_producto_confirmado jsonb;
 v_usd numeric;
 v_costo numeric;
 v_venta numeric;
 v_rate numeric;
begin
 v_uid:=auth.uid();
 if v_uid is null
   or not exists(
     select 1 from public.v16_user_access a
     join auth.users u on u.id=a.user_id
     where a.user_id=v_uid and a.active
       and a.role in ('owner','admin') and u.email_confirmed_at is not null
   ) then
   raise exception 'Se requiere una sesión administradora verificada';
 end if;
 if p_proveedor_clave is null or length(p_proveedor_clave) not between 1 and 70
   or p_proveedor_id is null or length(p_proveedor_id) not between 1 and 200
   or p_tasa is null or p_tasa<100 or p_tasa>10000 then
   raise exception 'Datos de cotización inválidos';
 end if;
 v_rate:=round(p_tasa,2);
 select datos into v_catalogo from public.tienda_catalogo
 where id='catalogo' for update;
 if jsonb_typeof(v_catalogo)<>'array' then
   raise exception 'El catálogo no está disponible';
 end if;
 select e.value into v_producto
 from jsonb_array_elements(v_catalogo) e(value)
 where e.value->>'proveedorClave'=p_proveedor_clave
   and e.value->>'proveedorId'=p_proveedor_id
   and e.value->>'automaticoProveedor'='true'
 limit 1;
 if v_producto is null or v_producto->>'monedaProveedor'<>'USD'
   or coalesce(v_producto->>'precioProveedorOriginal','') !~ '^[0-9]{1,8}([.][0-9]{1,2})?$'
 then
   raise exception 'Producto USD del proveedor no encontrado';
 end if;
 v_usd:=(v_producto->>'precioProveedorOriginal')::numeric;
 if v_usd<=0 then raise exception 'Precio USD inválido'; end if;
 v_costo:=round(v_usd*v_rate);
 v_venta:=ae_private.ae_tienda_markup_usd(v_costo);
 if v_costo<=0 or v_venta<=0 then raise exception 'Conversión inválida'; end if;
 insert into public.ae_tienda_usd_manual_rates
   (proveedor_clave,proveedor_id,tasa,actualizado,usuario)
 values(p_proveedor_clave,p_proveedor_id,v_rate,now(),v_uid)
 on conflict(proveedor_clave,proveedor_id)
 do update set tasa=excluded.tasa,actualizado=now(),usuario=excluded.usuario;

 select jsonb_agg(
   case when e.value->>'proveedorClave'=p_proveedor_clave
          and e.value->>'proveedorId'=p_proveedor_id
   then e.value || jsonb_build_object(
     'costo',v_costo,'venta',v_venta,'cotizacionDolar',v_rate,
     'cotizacionDolarManual',v_rate,'usdConvertido',true,
     'precioActualizado',floor(extract(epoch from now())*1000)
   )
   else e.value end order by e.ord
 ) into v_nuevo
 from jsonb_array_elements(v_catalogo) with ordinality e(value,ord);

 update public.tienda_catalogo set datos=v_nuevo,actualizado=now()
 where id='catalogo';
 select e.value into v_producto_confirmado
 from public.tienda_catalogo c cross join lateral jsonb_array_elements(c.datos) e(value)
 where c.id='catalogo'
   and e.value->>'proveedorClave'=p_proveedor_clave
   and e.value->>'proveedorId'=p_proveedor_id
 limit 1;
 if v_producto_confirmado is null
   or (v_producto_confirmado->>'cotizacionDolarManual')::numeric<>v_rate
   or (v_producto_confirmado->>'costo')::numeric<>v_costo
   or (v_producto_confirmado->>'venta')::numeric<>v_venta then
   raise exception 'La nube no confirmó la cotización';
 end if;
 return jsonb_build_object('ok',true,'producto',v_producto_confirmado);
end $$;
revoke all on function public.ae_tienda_cotizacion_manual_guardar(text,text,numeric) from public,anon,authenticated;
grant execute on function public.ae_tienda_cotizacion_manual_guardar(text,text,numeric) to authenticated;
notify pgrst,'reload schema';