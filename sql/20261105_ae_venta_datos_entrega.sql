-- Tienda vieja: datos de entrega de los avisos de venta de asesores.
-- Se mantienen RLS y la exclusividad de lectura de Administración.
alter table public.ae_advisor_sale_submissions
  add column if not exists delivery_phone text,
  add column if not exists delivery_address text,
  add column if not exists delivery_cross_streets text,
  add column if not exists delivery_locality text,
  add column if not exists delivery_maps_url text,
  add column if not exists delivery_accuracy_m integer;
alter table public.ae_advisor_sale_submissions
  add constraint ae_advisor_sale_delivery_phone_len check (delivery_phone is null or length(delivery_phone)<=30),
  add constraint ae_advisor_sale_delivery_address_len check (delivery_address is null or length(delivery_address)<=180),
  add constraint ae_advisor_sale_delivery_cross_len check (delivery_cross_streets is null or length(delivery_cross_streets)<=160),
  add constraint ae_advisor_sale_delivery_locality_len check (delivery_locality is null or length(delivery_locality)<=100),
  add constraint ae_advisor_sale_delivery_maps_len check (delivery_maps_url is null or length(delivery_maps_url)<=500),
  add constraint ae_advisor_sale_delivery_accuracy_range check (delivery_accuracy_m is null or delivery_accuracy_m between 1 and 100000);
-- El detalle completo debe viajar intacto hasta Tareas y "Copiar para CRM".
alter table public.ae_admin_shared_tasks drop constraint ae_admin_shared_tasks_note_check;
alter table public.ae_admin_shared_tasks
  add constraint ae_admin_shared_tasks_note_check check(length(note)<=1600);
-- Conserva la lógica RLS, permisos y demás acciones del RPC existente;
-- sólo amplía el límite permitido para notas nuevas e importadas.
do $patch_shared_note$
declare v_fn text;
begin
  select pg_get_functiondef('public.ae_admin_shared_task_action(text,jsonb)'::regprocedure) into v_fn;
  if position('or length(coalesce(p_payload->>''note'',''''))>500' in v_fn)=0 then
    raise exception 'No se encontró el límite anterior del RPC de tareas';
  end if;
  execute replace(v_fn,
    'or length(coalesce(p_payload->>''note'',''''))>500',
    'or length(coalesce(p_payload->>''note'',''''))>1600');
end;
$patch_shared_note$;
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

 get diagnostics v_count = row_count;
 return jsonb_build_object('imported',v_count);
end;
$$;
revoke all on function public.ae_admin_ingest_advisor_sales() from public, anon, authenticated;
grant execute on function public.ae_admin_ingest_advisor_sales() to authenticated;
notify pgrst,'reload schema';
