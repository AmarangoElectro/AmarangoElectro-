-- Mantener coherentes los correos del creador cuando otro administrador
-- marca Comprado / Entregado en la lista común.
create or replace function ae_private.ae_shared_task_sync_mail()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.stage is distinct from old.stage then
    update public.ae_admin_task_email_reminders
       set stage=new.stage, updated_at=now()
     where id=new.id;
  end if;
  return new;
end $$;
revoke all on function ae_private.ae_shared_task_sync_mail() from public,anon,authenticated;
create trigger ae_shared_task_stage_mail_sync
after update of stage on public.ae_admin_shared_tasks
for each row when (new.stage is distinct from old.stage)
execute function ae_private.ae_shared_task_sync_mail();