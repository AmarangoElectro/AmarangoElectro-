-- AmarangoElectro TIENDA VIEJA: tareas sincronizadas para correo.
-- Aditivo. No altera catálogo, ventas, precios ni V16. Sólo cuentas Supabase Auth
-- con vínculo owner/admin activo pueden almacenar recordatorios de su propio correo.
create schema if not exists ae_private;
revoke all on schema ae_private from public;
grant usage on schema ae_private to authenticated;

create function ae_private.is_legacy_admin() returns boolean
language sql stable security definer set search_path='' as $$
  select exists(
    select 1 from public.v16_user_access a
    join auth.users u on u.id=a.user_id
    where a.user_id=(select auth.uid()) and a.active
      and a.role in ('owner','admin') and u.email_confirmed_at is not null
  );
$$;
revoke all on function ae_private.is_legacy_admin() from public,anon,authenticated;
grant execute on function ae_private.is_legacy_admin() to authenticated;

create table public.ae_admin_task_email_reminders(
  id text primary key check(length(id) between 8 and 90 and id ~ '^ae-[a-zA-Z0-9-]+$'),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text check(product_id is null or length(product_id)<=200),
  product_name text check(product_name is null or length(product_name)<=200),
  title text not null check(length(btrim(title)) between 1 and 180),
  note text not null default '' check(length(note)<=500),
  stage text not null check(stage in ('comprar','entregar','pendiente','completada')),
  due_at timestamptz,
  mail_enabled boolean not null default false,
  sent_for_due_at timestamptz,
  claim_token uuid,
  claimed_until timestamptz,
  attempts integer not null default 0 check(attempts between 0 and 8),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index ae_admin_task_email_due_idx on public.ae_admin_task_email_reminders(due_at)
where mail_enabled and stage<>'completada';
alter table public.ae_admin_task_email_reminders enable row level security;
revoke all on public.ae_admin_task_email_reminders from public,anon,authenticated;
grant select,insert,update,delete on public.ae_admin_task_email_reminders to authenticated;

create policy "Admin read own mail tasks"
on public.ae_admin_task_email_reminders for select to authenticated
using (user_id=(select auth.uid()) and (select ae_private.is_legacy_admin()));

create policy "Admin insert own mail tasks"
on public.ae_admin_task_email_reminders for insert to authenticated
with check (user_id=(select auth.uid()) and (select ae_private.is_legacy_admin()));

create policy "Admin update own mail tasks"
on public.ae_admin_task_email_reminders for update to authenticated
using (user_id=(select auth.uid()) and (select ae_private.is_legacy_admin()))
with check (user_id=(select auth.uid()) and (select ae_private.is_legacy_admin()));

create policy "Admin delete own mail tasks"
on public.ae_admin_task_email_reminders for delete to authenticated
using (user_id=(select auth.uid()) and (select ae_private.is_legacy_admin()));

-- No dejar que un cliente autenticado cambie el dueño o finja un envío.
create function ae_private.guard_legacy_mail_task()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if (select auth.uid()) is not null then
   if tg_op='UPDATE' then
     if new.user_id is distinct from old.user_id or new.id is distinct from old.id then
       raise exception 'mail_task_owner_locked';
     end if;
     new.created_at:=old.created_at;
     new.sent_for_due_at:=case when new.due_at is distinct from old.due_at then null else old.sent_for_due_at end;
     new.attempts:=case when new.due_at is distinct from old.due_at then 0 else old.attempts end;
     new.claim_token:=case when new.due_at is distinct from old.due_at then null else old.claim_token end;
     new.claimed_until:=case when new.due_at is distinct from old.due_at then null else old.claimed_until end;
   else
     new.created_at:=now();
     new.sent_for_due_at:=null;
     new.attempts:=0;
     new.claim_token:=null;
     new.claimed_until:=null;
   end if;
 end if;
 new.updated_at:=now();
 return new;
end $$;
revoke all on function ae_private.guard_legacy_mail_task() from public,anon,authenticated;
create trigger ae_guard_legacy_mail_task before insert or update on public.ae_admin_task_email_reminders
for each row execute function ae_private.guard_legacy_mail_task();

-- Entregar trabajos vencidos de forma atómica al Worker, sin filtrar la lista de correos.
create function public.ae_admin_task_mail_claim(p_limit integer default 20) returns jsonb
language plpgsql security definer set search_path='' as $$
declare out_data jsonb;
begin
 if coalesce(auth.jwt()->>'role','')<>'service_role' then raise exception 'mail_tasks_forbidden'; end if;
 with candidates as (
   select t.id
   from public.ae_admin_task_email_reminders t
   join public.v16_user_access a on a.user_id=t.user_id
   join auth.users u on u.id=t.user_id
   where t.mail_enabled and t.stage<>'completada'
     and t.due_at is not null and t.due_at<=now()
     and t.sent_for_due_at is distinct from t.due_at
     and (t.claimed_until is null or t.claimed_until<now())
     and t.attempts<8
     and a.active and a.role in ('owner','admin')
     and u.email_confirmed_at is not null and length(coalesce(u.email,'')) between 5 and 254
   order by t.due_at,t.id
   limit greatest(1,least(coalesce(p_limit,20),40))
   for update of t skip locked
 ), claimed as (
   update public.ae_admin_task_email_reminders t
   set claim_token=gen_random_uuid(),claimed_until=now()+interval '4 minutes',attempts=t.attempts+1
   from candidates c where t.id=c.id
   returning t.id,t.user_id,t.product_name,t.title,t.note,t.stage,t.due_at,t.claim_token
 )
 select coalesce(jsonb_agg(jsonb_build_object(
  'id',t.id,'email',u.email,'product_name',t.product_name,'title',t.title,
  'note',t.note,'stage',t.stage,'due_at',t.due_at,'claim_token',t.claim_token
 )),'[]'::jsonb) into out_data
 from claimed t join auth.users u on u.id=t.user_id;
 return out_data;
end $$;
revoke all on function public.ae_admin_task_mail_claim(integer) from public,anon,authenticated;
grant execute on function public.ae_admin_task_mail_claim(integer) to service_role;

create function public.ae_admin_task_mail_finish(p_id text,p_claim_token uuid,p_sent boolean) returns boolean
language plpgsql security definer set search_path='' as $$
declare changed integer;
begin
 if coalesce(auth.jwt()->>'role','')<>'service_role' then raise exception 'mail_tasks_forbidden'; end if;
 update public.ae_admin_task_email_reminders
 set sent_for_due_at=case when p_sent then due_at else sent_for_due_at end,
     claimed_until=null,claim_token=null,updated_at=now()
 where id=p_id and claim_token=p_claim_token and claimed_until>=now()
 returning 1 into changed;
 return coalesce(changed,0)=1;
end $$;
revoke all on function public.ae_admin_task_mail_finish(text,uuid,boolean) from public,anon,authenticated;
grant execute on function public.ae_admin_task_mail_finish(text,uuid,boolean) to service_role;
notify pgrst,'reload schema';
