-- Tienda vieja AmarangoElectro: avisos de ventas de asesores hacia tareas de administradores.
-- No incorpora ventas al CRM ni da a asesores acceso de lectura a datos privados.
create table if not exists public.ae_advisor_sale_submissions (
 id uuid primary key default gen_random_uuid(),
 advisor_name text not null check(length(btrim(advisor_name)) between 2 and 100),
 advisor_id text check(advisor_id is null or length(advisor_id)<=100),
 customer_name text not null check(length(btrim(customer_name)) between 2 and 120),
 product_id text check(product_id is null or length(product_id)<=180),
 product_name text not null check(length(btrim(product_name)) between 2 and 170),
 installments integer not null check(installments between 1 and 60),
 sale_price numeric check(sale_price is null or (sale_price>=0 and sale_price<=1000000000)),
 note text not null default '' check(length(note)<=140),
 source text not null default 'tienda_asesores' check(source='tienda_asesores'),
 created_at timestamptz not null default now()
);
create index if not exists ae_advisor_sale_submissions_created_idx on public.ae_advisor_sale_submissions(created_at desc);
alter table public.ae_advisor_sale_submissions enable row level security;

-- Permitimos exclusivamente ENTREGAR un aviso sin capacidad de ver/modificar/borrar.
-- La clave anónima no acredita la identidad: cada aviso requiere revisión humana en el CRM.
revoke all on public.ae_advisor_sale_submissions from public, anon, authenticated;
grant insert on public.ae_advisor_sale_submissions to anon;
grant select on public.ae_advisor_sale_submissions to authenticated;
drop policy if exists "Advisor submissions: insert only" on public.ae_advisor_sale_submissions;
create policy "Advisor submissions: insert only"
on public.ae_advisor_sale_submissions for insert to anon
with check (
 source='tienda_asesores'
 and length(btrim(customer_name)) between 2 and 120
 and length(btrim(advisor_name)) between 2 and 100
 and length(btrim(product_name)) between 2 and 170
 and installments between 1 and 60
);
drop policy if exists "Advisor submissions: verified admins read" on public.ae_advisor_sale_submissions;
create policy "Advisor submissions: verified admins read"
on public.ae_advisor_sale_submissions for select to authenticated
using ((select ae_private.is_legacy_admin()));

-- La conversión a tareas se hace sólo tras verificar Auth owner/admin en servidor.
-- ID determinístico: importar repetidamente o desde ambos celulares no duplica tareas.
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
   case when nullif(r.advisor_id,'') is not null then 'ID asesor: '||r.advisor_id else null end,
   'Producto: '||r.product_name,
   'Cuotas: '||r.installments,
   case when r.sale_price is not null then 'Precio de venta: $'||r.sale_price else null end,
   'Fecha aviso: '||to_char(r.created_at at time zone 'America/Argentina/Buenos_Aires','DD/MM/YYYY HH24:MI'),
   case when r.note<>'' then 'Observaciones: '||r.note else null end
  ),500),
  nullif(r.product_id,''), r.product_name,
  'pendiente',null,r.created_at,now()
 from recientes r
 on conflict(id) do nothing;

 get diagnostics v_count = row_count;
 return jsonb_build_object('imported',v_count);
end;
$$;
revoke all on function public.ae_admin_ingest_advisor_sales() from public, anon, authenticated;
grant execute on function public.ae_admin_ingest_advisor_sales() to authenticated;
notify pgrst,'reload schema';
