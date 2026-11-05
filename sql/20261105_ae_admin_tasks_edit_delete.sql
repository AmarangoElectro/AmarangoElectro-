-- Administración: edición de tareas y eliminación de pendientes con confirmación en cliente.
-- ID borrado retenido para impedir que una venta importada lo recree.
create table if not exists ae_private.ae_admin_task_tombstones(
 task_id text primary key check(task_id ~ '^ae-[A-Za-z0-9-]{5,87}$'),
 deleted_at timestamptz not null default now(),
 deleted_by uuid not null
);
alter table ae_private.ae_admin_task_tombstones enable row level security;
revoke all on ae_private.ae_admin_task_tombstones from public,anon,authenticated;

CREATE OR REPLACE FUNCTION public.ae_admin_shared_task_action(p_action text, p_payload jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 v_uid uuid:=auth.uid();
 v_id text;
 v_stage text;
 v_task public.ae_admin_shared_tasks%rowtype;
 v_due timestamptz;
 v_created timestamptz;
 v_updated timestamptz;
 v_records jsonb;
begin
 if v_uid is null or not ae_private.is_legacy_admin() then
   raise exception 'shared_tasks_forbidden';
 end if;
 if p_action='list' then
   select coalesce(jsonb_agg(to_jsonb(t) order by
     (t.stage='completada'), t.due_at nulls last,t.created_at desc),'[]'::jsonb)
   into v_records from (
     select * from public.ae_admin_shared_tasks order by updated_at desc limit 500
   ) t;
   return v_records;
 elsif p_action='create' or p_action='import' then
   v_id:=p_payload->>'id';
   if v_id is null or v_id !~ '^ae-[A-Za-z0-9-]{5,87}$'
      or length(btrim(coalesce(p_payload->>'title',''))) not between 1 and 180
      or coalesce(p_payload->>'stage','') not in ('comprar','entregar','pendiente','completada')
      or length(coalesce(p_payload->>'note',''))>1600
      or length(coalesce(p_payload->>'product_id',''))>200
      or length(coalesce(p_payload->>'product_name',''))>200 then
      raise exception 'shared_tasks_invalid';
   end if;
   if coalesce(p_payload->>'due_at','')<>'' then
      begin v_due:=(p_payload->>'due_at')::timestamptz;
      exception when others then raise exception 'shared_tasks_invalid_date'; end;
   end if;
   if p_action='import' then
     -- Fecha original aproximada, pero no permitir fechas arbitrarias futuras.
     begin v_created:=least(coalesce((p_payload->>'created_at')::timestamptz,now()),now());
     exception when others then v_created:=now(); end;
   else v_created:=now(); end if;
   if exists(select 1 from ae_private.ae_admin_task_tombstones where task_id=v_id) then
      raise exception 'shared_tasks_deleted';
   end if;
   insert into public.ae_admin_shared_tasks(
     id,creator_user_id,title,note,product_id,product_name,stage,due_at,created_at,updated_at
   ) values(v_id,v_uid,btrim(p_payload->>'title'),coalesce(p_payload->>'note',''),
     nullif(p_payload->>'product_id',''),nullif(p_payload->>'product_name',''),
     p_payload->>'stage',v_due,v_created,now())
   on conflict(id) do nothing returning * into v_task;
   if v_task.id is null then
     select * into v_task from public.ae_admin_shared_tasks where id=v_id;
   end if;
   return to_jsonb(v_task);
 elsif p_action='edit' then
   v_id:=p_payload->>'id';
   v_stage:=p_payload->>'expected_stage';
   if v_id is null or v_id !~ '^ae-[A-Za-z0-9-]{5,87}$'
      or length(btrim(coalesce(p_payload->>'title',''))) not between 1 and 180
      or length(coalesce(p_payload->>'note',''))>1600
      or v_stage not in ('comprar','entregar','pendiente','completada')
      or nullif(p_payload->>'expected_updated_at','') is null then
     raise exception 'shared_tasks_invalid_edit';
   end if;
   begin
      v_updated:=(p_payload->>'expected_updated_at')::timestamptz;
      v_due:=nullif(p_payload->>'due_at','')::timestamptz;
   exception when others then
      raise exception 'shared_tasks_invalid_date';
   end;
   update public.ae_admin_shared_tasks
   set title=btrim(p_payload->>'title'),
       note=coalesce(p_payload->>'note',''),
       due_at=v_due,updated_at=now()
   where id=v_id and stage=v_stage and updated_at=v_updated
     and (title not like '🧾 Venta CRM · %' or btrim(p_payload->>'title') like '🧾 Venta CRM · %')
   returning * into v_task;
   if v_task.id is null then raise exception 'shared_tasks_conflict';end if;
   return to_jsonb(v_task);
 elsif p_action='advance' then
   v_id:=p_payload->>'id';v_stage:=p_payload->>'expected_stage';
   if v_id is null or v_stage not in ('comprar','entregar','pendiente') then raise exception 'shared_tasks_invalid';end if;
   update public.ae_admin_shared_tasks
   set stage=case when stage='comprar' then 'entregar' else 'completada' end,
       completed_at=case when stage='comprar' then null else now() end,
       updated_at=now()
   where id=v_id and stage=v_stage returning * into v_task;
   if v_task.id is null then raise exception 'shared_tasks_conflict';end if;
   return to_jsonb(v_task);
 elsif p_action='delete' then
   v_id:=p_payload->>'id';
   if v_id is null or v_id !~ '^ae-[A-Za-z0-9-]{5,87}$' then
      raise exception 'shared_tasks_invalid_delete';
   end if;
   begin
     v_updated:=nullif(p_payload->>'expected_updated_at','')::timestamptz;
   exception when others then
     raise exception 'shared_tasks_invalid_date';
   end;
   delete from public.ae_admin_shared_tasks
   where id=v_id and (v_updated is null or updated_at=v_updated)
   returning * into v_task;
   if v_task.id is null then raise exception 'shared_tasks_conflict';end if;
   insert into ae_private.ae_admin_task_tombstones(task_id,deleted_by)
      values(v_id,v_uid)
      on conflict(task_id) do nothing;
   return to_jsonb(v_task);
 end if;
 raise exception 'shared_tasks_invalid_action';
end $function$;
revoke all on function public.ae_admin_shared_task_action(text,jsonb) from public,anon;
grant execute on function public.ae_admin_shared_task_action(text,jsonb) to authenticated;
CREATE OR REPLACE FUNCTION public.ae_admin_ingest_advisor_sales()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
 where not exists (
   select 1 from ae_private.ae_admin_task_tombstones d
   where d.task_id='ae-'||replace(r.id::text,'-','')
 )
 on conflict(id) do nothing;

 -- El registro compartido se consulta exclusivamente con permisos de Administración.
 -- Las ventas de asesores no pueden reemplazar domicilios confirmados por admin.
 insert into public.ae_customer_delivery_profiles(
  client_key,customer_name,customer_phone,alternate_phone,
  maps_url,street_address,cross_streets,locality,source_submission_id,submission_created_at,verified_at,updated_at
 )
 select
  lower(regexp_replace(btrim(s.customer_name),'[[:space:]]+',' ','g'))||'|'||
   regexp_replace(s.customer_phone,'[^0-9]','','g'),
  btrim(s.customer_name),s.customer_phone,nullif(s.delivery_phone,''),
  nullif(s.delivery_maps_url,''),nullif(s.delivery_address,''),
  nullif(s.delivery_cross_streets,''),nullif(s.delivery_locality,''),
  s.id,s.created_at,null,now()
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
  submission_created_at=excluded.submission_created_at,
  updated_at=excluded.updated_at
 where public.ae_customer_delivery_profiles.verified_at is null
   and (public.ae_customer_delivery_profiles.submission_created_at is null
     or excluded.submission_created_at > public.ae_customer_delivery_profiles.submission_created_at);

 get diagnostics v_count = row_count;
 return jsonb_build_object('imported',v_count);
end;
$function$;
revoke all on function public.ae_admin_ingest_advisor_sales() from public,anon;
grant execute on function public.ae_admin_ingest_advisor_sales() to authenticated;
notify pgrst,'reload schema';
