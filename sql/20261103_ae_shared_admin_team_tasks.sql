-- AmarangoElectro TIENDA VIEJA — tablero único de tareas para los dos propietarios.
-- Respeta tareas anteriores y correos por cuenta. Sin cambios a catálogo/precios.
create table if not exists public.ae_admin_team_tasks (
  id text primary key check (length(id) between 8 and 90 and id ~ '^ae-[A-Za-z0-9-]+$'),
  user_id uuid not null references auth.users(id) on delete restrict,
  product_id text check (product_id is null or length(product_id)<=200),
  product_name text check (product_name is null or length(product_name)<=200),
  title text not null check(length(btrim(title)) between 1 and 180),
  note text not null default '' check (length(note)<=500),
  stage text not null check (stage in ('comprar','entregar','pendiente','completada')),
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists ae_admin_team_tasks_active_idx on public.ae_admin_team_tasks(stage,due_at)
where stage <> 'completada';
alter table public.ae_admin_team_tasks enable row level security;
revoke all on public.ae_admin_team_tasks from public,anon,authenticated;
grant select,insert,update,delete on public.ae_admin_team_tasks to authenticated;
-- Autorización por la tabla de propietarios y cuenta de Supabase Auth verificada.
-- Ambos administradores ven, cambian y completan las mismas tareas.
create policy "Amarango admins read shared tasks"
on public.ae_admin_team_tasks for select to authenticated
using ((select ae_private.is_legacy_admin()));
create policy "Amarango admins create shared tasks"
on public.ae_admin_team_tasks for insert to authenticated
with check (user_id=(select auth.uid()) and (select ae_private.is_legacy_admin()));
create policy "Amarango admins update shared tasks"
on public.ae_admin_team_tasks for update to authenticated
using ((select ae_private.is_legacy_admin()))
with check ((select ae_private.is_legacy_admin()));
create policy "Amarango admins delete shared tasks"
on public.ae_admin_team_tasks for delete to authenticated
using ((select ae_private.is_legacy_admin()));

create or replace function ae_private.ae_guard_team_tasks() returns trigger
language plpgsql set search_path='' as $$
begin
 if tg_op='UPDATE' then
  if new.id is distinct from old.id or new.user_id is distinct from old.user_id
    or new.created_at is distinct from old.created_at then
    raise exception 'team_tasks_immutable_identity';
  end if;
  new.updated_at=now();
 else
  new.created_at=now();
  new.updated_at=now();
 end if;
 if new.stage='completada' then
   if tg_op='INSERT' or old.stage is distinct from 'completada' then
      new.completed_at=now();
   end if;
 else
   new.completed_at=null;
 end if;
 return new;
end $$;
revoke all on function ae_private.ae_guard_team_tasks() from public,anon,authenticated;
create trigger ae_guard_team_tasks before insert or update
on public.ae_admin_team_tasks for each row
execute function ae_private.ae_guard_team_tasks();

-- Migrar sin cambiar ni eliminar los recordatorios individuales ya existentes.
insert into public.ae_admin_team_tasks
  (id,user_id,product_id,product_name,title,note,stage,due_at,created_at,updated_at)
select id,user_id,product_id,product_name,title,note,stage,due_at,created_at,updated_at
from public.ae_admin_task_email_reminders
where id ~ '^ae-[A-Za-z0-9-]+$'
on conflict(id) do nothing;
notify pgrst,'reload schema';
