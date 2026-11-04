-- AmarangoElectro TIENDA VIEJA - ✅ ¡Vendido! por producto.
-- Registros privados para Administración; no afecta precios, stock, cuotas o CRM.
-- Usa solo sesión Supabase Auth verificada y roles owner/admin activos.
create table public.ae_sold_clients (
 id bigint generated always as identity primary key,
 name text not null check(length(btrim(name)) between 2 and 120),
 phone text not null default '' check(length(phone)<=40),
 dni text not null default '' check(length(dni)<=40),
 locality text not null default '' check(length(locality)<=100),
 created_by uuid references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index ae_sold_clients_name_idx on public.ae_sold_clients (lower(name));
alter table public.ae_sold_clients enable row level security;
revoke all on public.ae_sold_clients from public,anon,authenticated;
grant select on public.ae_sold_clients to authenticated;
create policy "Sold client list for verified administrators only"
on public.ae_sold_clients for select to authenticated
using ((select ae_private.is_legacy_admin()));

create table public.ae_sold_records(
 id uuid primary key,
 client_id bigint not null references public.ae_sold_clients(id),
 product_id text not null check(length(product_id) between 1 and 200),
 product_name text not null check(length(btrim(product_name)) between 1 and 200),
 reference_price numeric(16,2) check(reference_price is null or reference_price between 0 and 9999999999),
 sold_by uuid not null references auth.users(id),
 sold_at timestamptz not null default now()
);
create index ae_sold_records_client_idx on public.ae_sold_records(client_id,sold_at desc);
alter table public.ae_sold_records enable row level security;
revoke all on public.ae_sold_records from public,anon,authenticated;
grant select on public.ae_sold_records to authenticated;
create policy "Sold records for verified administrators only"
on public.ae_sold_records for select to authenticated
using ((select ae_private.is_legacy_admin()));

-- Reutilizar únicamente los clientes ya registrados en la tienda vieja,
-- sin extraer los 166 clientes de otro CRM ni copiar ventas previas.
insert into public.ae_sold_clients(name,phone,dni)
select distinct on (lower(btrim(elem->>'nombre')))
  left(btrim(elem->>'nombre'),120),
  left(coalesce(elem->>'telefono',''),40),
  left(coalesce(elem->>'dni',''),40)
from public.tienda_catalogo c cross join lateral jsonb_array_elements(c.datos) elem
where c.id='clientes_tienda'
  and jsonb_typeof(c.datos)='array'
  and length(btrim(coalesce(elem->>'nombre',''))) between 2 and 120
order by lower(btrim(elem->>'nombre')),elem->>'nombre';

create or replace function public.ae_sold_product_action(
 p_action text,p_payload jsonb default '{}'::jsonb
) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 v_uid uuid:=auth.uid();
 v_client_id bigint;
 v_new_name text;
 v_phone text;
 v_dni text;
 v_locality text;
 v_sale_id uuid;
 v_product_id text;
 v_product_name text;
 v_price numeric;
 v_sale public.ae_sold_records%rowtype;
 v_client public.ae_sold_clients%rowtype;
 v_clients jsonb;
 v_sales jsonb;
begin
 if v_uid is null or not exists(
   select 1 from public.v16_user_access a
   join auth.users u on u.id=a.user_id
   where a.user_id=v_uid and a.active and a.role in ('owner','admin')
      and u.email_confirmed_at is not null
 ) then raise exception 'ae_sale_forbidden';end if;

 if p_action='list' then
   select coalesce(jsonb_agg(
     jsonb_build_object('id',c.id,'name',c.name,'phone',c.phone,
       'dni',c.dni,'locality',c.locality)
     order by c.id desc
   ),'[]'::jsonb) into v_clients
   from (select * from public.ae_sold_clients order by id desc limit 1500) c;
   select coalesce(jsonb_agg(
     jsonb_build_object('id',v.id,'client_id',v.client_id,
       'client_name',c.name,'product_id',v.product_id,
       'product_name',v.product_name,'reference_price',v.reference_price,
       'sold_at',v.sold_at)
     order by v.sold_at desc
   ),'[]'::jsonb) into v_sales
   from (select * from public.ae_sold_records order by sold_at desc limit 70) v
   join public.ae_sold_clients c on c.id=v.client_id;
   return jsonb_build_object('clients',v_clients,'sales',v_sales);
 end if;

 if p_action<>'record' or jsonb_typeof(p_payload)<>'object' then
   raise exception 'ae_sale_invalid_action';
 end if;
 begin v_sale_id:=(p_payload->>'sale_id')::uuid;
 exception when others then raise exception 'ae_sale_invalid_id';end;
 if v_sale_id is null then raise exception 'ae_sale_missing_id';end if;
 select * into v_sale from public.ae_sold_records where id=v_sale_id;
 if v_sale.id is not null then
   return jsonb_build_object('ok',true,'id',v_sale.id,'client_id',v_sale.client_id,'already_recorded',true);
 end if;

 v_product_id:=btrim(coalesce(p_payload->>'product_id',''));
 v_product_name:=btrim(coalesce(p_payload->>'product_name',''));
 if length(v_product_id) not between 1 and 200
    or length(v_product_name) not between 1 and 200 then raise exception 'ae_sale_invalid_product';end if;
 if p_payload ? 'reference_price' and p_payload->>'reference_price' is not null then
   if p_payload->>'reference_price' !~ '^[0-9]{1,10}([.][0-9]{1,2})?$' then
      raise exception 'ae_sale_invalid_reference_price';end if;
   v_price:=(p_payload->>'reference_price')::numeric;
 end if;

 if p_payload ? 'client_id' and nullif(p_payload->>'client_id','') is not null then
   begin v_client_id:=(p_payload->>'client_id')::bigint;
   exception when others then raise exception 'ae_sale_invalid_client'; end;
   select * into v_client from public.ae_sold_clients where id=v_client_id;
   if v_client.id is null then raise exception 'ae_sale_client_missing';end if;
 else
   v_new_name:=btrim(coalesce(p_payload->>'new_name',''));
   v_phone:=btrim(coalesce(p_payload->>'new_phone',''));
   v_dni:=btrim(coalesce(p_payload->>'new_dni',''));
   v_locality:=btrim(coalesce(p_payload->>'new_locality',''));
   if length(v_new_name) not between 2 and 120 or length(v_phone)>40
      or length(v_dni)>40 or length(v_locality)>100 then
      raise exception 'ae_sale_invalid_customer';end if;
   -- Reducir duplicados por teléfono, DNI o coincidencia exacta de nombre.
   select * into v_client from public.ae_sold_clients
    where (length(v_dni)>=6 and regexp_replace(dni,'[^0-9]','','g')=regexp_replace(v_dni,'[^0-9]','','g'))
       or (length(regexp_replace(v_phone,'[^0-9]','','g'))>=8
           and regexp_replace(phone,'[^0-9]','','g')=regexp_replace(v_phone,'[^0-9]','','g'))
       or (lower(btrim(name))=lower(v_new_name) and (v_phone='' or phone='' or phone=v_phone))
    order by id asc limit 1;
   if v_client.id is null then
      insert into public.ae_sold_clients(name,phone,dni,locality,created_by)
      values(v_new_name,v_phone,v_dni,v_locality,v_uid)
      returning * into v_client;
   end if;
   v_client_id:=v_client.id;
 end if;
 insert into public.ae_sold_records(
   id,client_id,product_id,product_name,reference_price,sold_by
 ) values(v_sale_id,v_client_id,v_product_id,v_product_name,v_price,v_uid)
 on conflict(id) do nothing
 returning * into v_sale;
 if v_sale.id is null then
   select * into v_sale from public.ae_sold_records where id=v_sale_id;
 end if;
 return jsonb_build_object('ok',true,'id',v_sale.id,
   'client_id',v_sale.client_id,'client_name',v_client.name,
   'sold_at',v_sale.sold_at);
end $$;
revoke all on function public.ae_sold_product_action(text,jsonb) from public,anon,authenticated;
grant execute on function public.ae_sold_product_action(text,jsonb) to authenticated;
notify pgrst,'reload schema';