-- Tienda vieja: tareas compartidas de Administración, exclusivas para owner/admin.
-- La cuenta creadora no impide que el otro administrador las vea y avance.
create table if not exists public.ae_admin_shared_tasks (
 id text primary key check(id ~ '^ae-[A-Za-z0-9-]{5,87}$'),
 creator_user_id uuid not null references auth.users(id),
 title text not null check(length(btrim(title)) between 1 and 180),
 note text not null default '' check(length(note)<=500),
 product_id text check(product_id is null or length(product_id)<=200),
 product_name text check(product_name is null or length(product_name)<=200),
 stage text not null check(stage in ('comprar','entregar','pendiente','completada')),
 due_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 completed_at timestamptz
);
alter table public.ae_admin_shared_tasks enable row level security;
revoke all on public.ae_admin_shared_tasks from public,anon,authenticated;
grant select on public.ae_admin_shared_tasks to authenticated;
create policy "Shared tasks read by verified admins"
on public.ae_admin_shared_tasks for select to authenticated
using ((select ae_private.is_legacy_admin()));

-- Migrar recordatorios previos sin borrarlos ni alterarlos.
insert into public.ae_admin_shared_tasks(
 id,creator_user_id,title,note,product_id,product_name,stage,due_at,created_at,updated_at
)
select id,user_id,title,note,product_id,product_name,stage,due_at,created_at,updated_at
from public.ae_admin_task_email_reminders
on conflict(id) do nothing;

-- Mutaciones centralizadas, validadas en servidor. Sólo sesión Supabase Auth con rol activo.
create or replace function public.ae_admin_shared_task_action(
 p_action text,p_payload jsonb default '{}'::jsonb
) returns jsonb
language plpgsql security definer set search_path='' as $$
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
      or length(coalesce(p_payload->>'note',''))>500
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
   delete from public.ae_admin_shared_tasks
   where id=v_id and stage='completada' returning * into v_task;
   if v_task.id is null then raise exception 'shared_tasks_conflict';end if;
   return to_jsonb(v_task);
 end if;
 raise exception 'shared_tasks_invalid_action';
end $$;
revoke all on function public.ae_admin_shared_task_action(text,jsonb) from public,anon,authenticated;
grant execute on function public.ae_admin_shared_task_action(text,jsonb) to authenticated;
notify pgrst,'reload schema';