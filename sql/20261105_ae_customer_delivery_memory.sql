-- Memoria privada de domicilios por nombre y celular.
-- No concede lectura a asesores anónimos. Evita que un aviso de venta
-- sobrescriba direcciones revisadas y confirmadas por Administración.
alter table public.ae_advisor_sale_submissions
 add column if not exists customer_phone text;
alter table public.ae_advisor_sale_submissions
 add constraint ae_advisor_sale_customer_phone_len
 check(customer_phone is null or length(customer_phone)<=30);

create table if not exists public.ae_customer_delivery_profiles(
 client_key text primary key,
 customer_name text not null check(length(customer_name) between 2 and 120),
 customer_phone text not null check(length(customer_phone)<=30),
 alternate_phone text check(alternate_phone is null or length(alternate_phone)<=30),
 maps_url text check(maps_url is null or length(maps_url)<=500),
 street_address text check(street_address is null or length(street_address)<=180),
 cross_streets text check(cross_streets is null or length(cross_streets)<=160),
 locality text check(locality is null or length(locality)<=100),
 source_submission_id uuid,
 verified_at timestamptz,
 updated_at timestamptz not null default now()
);
alter table public.ae_customer_delivery_profiles enable row level security;
revoke all on public.ae_customer_delivery_profiles from public, anon, authenticated;
grant select,insert,update on public.ae_customer_delivery_profiles to authenticated;
drop policy if exists "Delivery profiles admin select" on public.ae_customer_delivery_profiles;
create policy "Delivery profiles admin select"
on public.ae_customer_delivery_profiles for select to authenticated
using ((select ae_private.is_legacy_admin()));
drop policy if exists "Delivery profiles admin insert" on public.ae_customer_delivery_profiles;
create policy "Delivery profiles admin insert"
on public.ae_customer_delivery_profiles for insert to authenticated
with check ((select ae_private.is_legacy_admin()));
drop policy if exists "Delivery profiles admin update" on public.ae_customer_delivery_profiles;
create policy "Delivery profiles admin update"
on public.ae_customer_delivery_profiles for update to authenticated
using ((select ae_private.is_legacy_admin()))
with check ((select ae_private.is_legacy_admin()));

create or replace function public.ae_admin_ingest_advisor_sales()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
 v_uid uuid := auth.uid();
 v_count integer := 0;
begin
 if v_uid is null or not ae_private.is_legacy_admin() then
   raise exception 'advisor_sales_ingest_forbidden';
 end if;

 with recientes as (
  select s.* from public.ae_advisor_sale_submissions s
  order by s.created_at desc
  limit 500
 )
 insert into public.ae_admin_shared_tasks(
  id,creator_user_id,title,note,product_id,product_name,
  stage,due_at,created_at,updated_at
 )
 select
  'ae-'||replace(r.id::text,'-',''),
  v_uid,
  left('🧾 Venta CRM · '||r.customer_name,180),
  left(concat_ws(E'\n',
   '🧾 VENTA PENDIENTE DE CARGAR EN CRM',
   'Cliente: '||r.customer_name,
   'Asesor: '||r.advisor_name,
   case when nullif(r.customer_phone,'') is not null then 'Celular del cliente: '||r.customer_phone else null end,
   case when nullif(r.advisor_id,'') is not null then 'ID asesor: '||r.advisor_id else null end,
   'Producto: '||r.product_name,
   'Cuotas: '||r.installments,
   case when r.sale_price is not null then 'Precio de venta: $'||r.sale_price else null end,
   'Fecha aviso: '||to_char(r.created_at at time zone 'America/Argentina/Buenos_Aires','DD/MM/YYYY HH24:MI'),
   case when nullif(r.delivery_phone,'') is not null then 'Teléfono alternativo para entrega: '||r.delivery_phone else null end,
   case when nullif(r.delivery_address,'') is not null then 'Domicilio de entrega: '||r.delivery_address else null end,
   case when nullif(r.delivery_cross_streets,'') is not null then 'Entre calles: '||r.delivery_cross_streets else null end,
   case when nullif(r.delivery_locality,'') is not null then 'Localidad: '||r.delivery_locality else null end,
   case when nullif(r.delivery_maps_url,'') is not null then 'Ubicación Google Maps: '||r.delivery_maps_url else null end,
   case when r.delivery_accuracy_m is not null then 'Precisión GPS estimada: '||r.delivery_accuracy_m||' m' else null end,
   case when r.note<>'' then 'Observaciones: '||r.note else null end
  ),1600),
  nullif(r.product_id,''), r.product_name,
  'pendiente',null,r.created_at,now()
 from recientes r
 on conflict(id) do nothing;

 -- El registro compartido se consulta exclusivamente con permisos de Administración.
 -- Las ventas de asesores no pueden reemplazar domicilios confirmados por admin.
 insert into public.ae_customer_delivery_profiles(
  client_key,customer_name,customer_phone,alternate_phone,
  maps_url,street_address,cross_streets,locality,source_submission_id,verified_at,updated_at
 )
 select
  lower(regexp_replace(btrim(s.customer_name),'[[:space:]]+',' ','g'))||'|'||
   regexp_replace(s.customer_phone,'[^0-9]','','g'),
  btrim(s.customer_name),s.customer_phone,nullif(s.delivery_phone,''),
  nullif(s.delivery_maps_url,''),nullif(s.delivery_address,''),
  nullif(s.delivery_cross_streets,''),nullif(s.delivery_locality,''),
  s.id,null,now()
 from public.ae_advisor_sale_submissions s
 where s.customer_phone is not null
   and length(regexp_replace(s.customer_phone,'[^0-9]','','g')) between 8 and 15
   and (nullif(s.delivery_maps_url,'') is not null or nullif(s.delivery_address,'') is not null)
 order by s.created_at asc
 limit 500
 on conflict (client_key) do update set
  customer_name=excluded.customer_name,
  customer_phone=excluded.customer_phone,
  alternate_phone=excluded.alternate_phone,
  maps_url=excluded.maps_url,
  street_address=excluded.street_address,
  cross_streets=excluded.cross_streets,
  locality=excluded.locality,
  source_submission_id=excluded.source_submission_id,
  updated_at=excluded.updated_at
 where public.ae_customer_delivery_profiles.verified_at is null;

 get diagnostics v_count = row_count;
 return jsonb_build_object('imported',v_count);
end;
$$;
revoke all on function public.ae_admin_ingest_advisor_sales() from public, anon, authenticated;
grant execute on function public.ae_admin_ingest_advisor_sales() to authenticated;

notify pgrst,'reload schema';
