-- NOT APPLIED. Rejected activation draft for review only. Not a validated migration.
-- See V16-COMMISSION-ACTIVATION.md before preparing a narrower staging-only activation.
create schema if not exists v16_private;
revoke all on schema v16_private from public,anon,authenticated;
create table if not exists v16_private.commission_policy (
 singleton boolean primary key default true check(singleton),
 financed_cap numeric check(financed_cap is null or (financed_cap>=0 and financed_cap<=100000000)),
 revision integer not null default 1, updated_at timestamptz not null default now(), updated_by uuid references auth.users(id)
);
alter table v16_private.commission_policy enable row level security;
revoke all on v16_private.commission_policy from public,anon,authenticated,service_role;
insert into v16_private.commission_policy(singleton,financed_cap) values(true,null) on conflict do nothing;

create or replace function v16_private.commission_amount(p_cash numeric,p_mode text,p_cap numeric)
returns numeric language sql immutable set search_path='' as $$
 select case when p_cash is null or p_cash<0 then null when p_mode='CASH' then round(p_cash*case when p_cash<200000 then .10 else .07 end,2)
 when p_mode='FINANCED' then case when p_cash<50000 then 7500 when p_cash<100000 then 12000 when p_cash<200000 then 20000 when p_cash<300000 then 28000 else least(round(p_cash*.10,2),coalesce(p_cap,round(p_cash*.10,2))) end else null end
$$;
revoke all on function v16_private.commission_amount(numeric,text,numeric) from public,anon,authenticated,service_role;

create or replace function v16_private.commission_workspace(p_email text,p_action text default 'read',p_cap numeric default null,p_revision integer default null,p_period text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.v16_user_access%rowtype; cfg v16_private.commission_policy%rowtype; internal boolean; start_date date; rows jsonb; best jsonb;
begin
 if coalesce(auth.jwt()->>'role','')<>'service_role' then raise exception 'service_role_required'; end if;
 select x.* into a from public.v16_user_access x join auth.users u on u.id=x.user_id where x.active and lower(u.email)=lower(btrim(p_email));
 internal:=coalesce(a.role in ('owner','admin') and ('*'=any(a.capabilities) or 'admin.access'=any(a.capabilities)),false);
 if not internal and not coalesce(a.role='asesor' and a.advisor_id is not null and ('*'=any(a.capabilities) or 'advisors.access'=any(a.capabilities)),false) then raise exception 'commission_not_authorized'; end if;
 if p_action not in ('read','policy','set_cap') then raise exception 'invalid_action'; end if;
 if p_action='set_cap' then
  if a.role<>'owner' then raise exception 'commission_policy_not_authorized'; end if;
  if p_revision is null or p_cap<0 or p_cap>100000000 then raise exception 'invalid_cap'; end if;
  update v16_private.commission_policy set financed_cap=p_cap,revision=revision+1,updated_at=now(),updated_by=a.user_id where singleton and revision=p_revision returning * into cfg;
  if not found then raise exception 'commission_policy_conflict'; end if;
 else select * into cfg from v16_private.commission_policy where singleton; end if;
 if p_period is not null and p_period !~ '^20[0-9]{2}-(0[1-9]|1[0-2])$' then raise exception 'invalid_period'; end if;
 start_date:=case when p_period is null then date_trunc('month',now() at time zone 'America/Argentina/Buenos_Aires')::date else (p_period||'-01')::date end;
 if p_action='policy' then return jsonb_build_object('role',a.role,'cap',cfg.financed_cap,'revision',cfg.revision,'version','2026-10-09|'||cfg.revision); end if;
 select coalesce(jsonb_agg(jsonb_build_object(
  'saleId',s.sale_id,'advisorId',l.advisor_id,'advisorName',coalesce(av.nombre,'Asesor'), 'productId',s.canonical_product_id,'productLabel',s.product_name,
  'finalCashPriceArs',s.cash_price,'modality',case when s.payment_mode='CASH' then 'cash' else 'financed' end,
  'commissionTotalArs',l.commission_total,'paymentCount',l.payment_count,'paymentAmounts',l.payment_schedule->'payments',
  'commissionCollectedArs',least(l.commission_total,coalesce(paid.amount,0)),
  'validation',case when l.status='VOID' then 'EXCLUDED' else coalesce(cl.validation,f.validation) end,
  'validationReason',case when l.status='VOID' then 'Comisión anulada' else coalesce(cl.validation_reason,f.validation_reason) end,
  'saleEquivalent',l.sale_equivalent,'policyVersion',l.policy_version,'soldAt',s.sold_at,
  'closedAt',mc.closed_at
 ) || case when internal then jsonb_build_object('costArs',v."precioCosto",'marginArs',case when v."precioCosto">0 then s.cash_price-v."precioCosto"-l.commission_total else null end) else '{}'::jsonb end order by s.sold_at desc),'[]'::jsonb) into rows
 from public.v16_advisor_commission_ledger l join public.v16_sale_snapshots s on s.sale_id=l.sale_id
 join public.ventas v on v.id=s.sale_id left join public.asesores_ventas av on av.id=l.advisor_id
 left join public.v16_advisor_monthly_closes mc on mc.advisor_id=l.advisor_id and mc.period_month=start_date
 left join public.v16_advisor_monthly_close_operations cl on cl.close_id=mc.close_id and cl.sale_id=s.sale_id
 cross join lateral public.v16_advisor_operation_close_fact(s.sale_id,now()) f
 left join lateral (select sum(c.amount) amount from public.v16_cash_movements c where c.sale_id=s.sale_id and c.movement_type='RESELLER_PAYOUT' and c.direction='OUT' and c.metadata->>'advisor_id'=l.advisor_id::text and not exists(select 1 from public.v16_cash_movements r where r.reverses_movement_id=c.movement_id)) paid on true
 where (internal or l.advisor_id=a.advisor_id) and s.sold_at >= (start_date::timestamp at time zone 'America/Argentina/Buenos_Aires') and s.sold_at<((start_date+interval '1 month')::timestamp at time zone 'America/Argentina/Buenos_Aires');
 select coalesce(jsonb_object_agg(product_id,n),'{}'::jsonb) into best from (
 select s.canonical_product_id product_id,count(*) n from public.v16_sale_snapshots s join public.ventas v on v.id=s.sale_id
 where (internal or s.advisor_id=a.advisor_id) and not coalesce(v.archivada,false) and upper(coalesce(v.estado,'')) not in ('CANCELADA','ANULADA','RECHAZADA') group by s.canonical_product_id) q;
 return jsonb_build_object('role',a.role,'advisorId',a.advisor_id,'advisorName',coalesce((select nombre from public.asesores_ventas where id=a.advisor_id),'Tu mes'),'period',to_char(start_date,'YYYY-MM'),'cap',cfg.financed_cap,'revision',cfg.revision,'version','2026-10-09|'||cfg.revision,'operations',rows,'salesCounts',best,'updatedAt',now());
end $$;
revoke all on function v16_private.commission_workspace(text,text,numeric,integer,text) from public,anon,authenticated;
grant usage on schema v16_private to service_role;
grant execute on function v16_private.commission_workspace(text,text,numeric,integer,text) to service_role;
create or replace function public.v16_commission_workspace(p_email text,p_action text default 'read',p_cap numeric default null,p_revision integer default null,p_period text default null)
returns jsonb language sql security invoker set search_path='' as $$ select v16_private.commission_workspace(p_email,p_action,p_cap,p_revision,p_period) $$;
revoke all on function public.v16_commission_workspace(text,text,numeric,integer,text) from public,anon,authenticated;
grant execute on function public.v16_commission_workspace(text,text,numeric,integer,text) to service_role;

-- Only new-policy quotes change commission. Existing prices, financing schedules and historical records are retained.
do $migration$
declare def text; old text:='if upper(p_payment_mode)=''CASH'' then v_commission:=round(p_cash_price*0.10,2); else v_commission:=public.v16_financed_commission_for_cash_price(p_cash_price); end if;';
 replacement text := 'if p_commission_policy_version like ''2026-10-09|%'' then
  if p_commission_policy_version <> (select ''2026-10-09|''||revision from v16_private.commission_policy where singleton) then raise exception ''commission_policy_conflict''; end if;
  v_commission:=v16_private.commission_amount(p_cash_price,upper(p_payment_mode),(select financed_cap from v16_private.commission_policy where singleton));
 else if upper(p_payment_mode)=''CASH'' then v_commission:=round(p_cash_price*0.10,2); else v_commission:=public.v16_financed_commission_for_cash_price(p_cash_price); end if; end if;';
begin
 select pg_get_functiondef(p.oid) into def from pg_proc p where p.pronamespace='public'::regnamespace and p.proname='v16_issue_authorized_sale_quote';
 if def is null or strpos(def,old)=0 then raise exception 'quote_definition_unexpected'; end if;
 def:=replace(def,old,replacement);
 def:=replace(def,'p_commercial_snapshot,p_issued_for,p_expires_at)','p_commercial_snapshot || jsonb_build_object(''commission'',v_commission,''commissionPolicyVersion'',p_commission_policy_version),p_issued_for,p_expires_at)');
 execute def;
end $migration$;
-- A BEFORE INSERT trigger affects new-policy rows only; the immutable historical ledger remains intact.
alter table public.v16_advisor_commission_ledger drop constraint v16_advisor_commission_ledger_payment_count_check;
alter table public.v16_advisor_commission_ledger add constraint v16_advisor_commission_ledger_payment_count_check check(payment_count in(1,2,3));
create or replace function v16_private.commission_new_payment_schedule() returns trigger language plpgsql security definer set search_path='' as $$
declare n int; installments int; base numeric;
begin
 if new.policy_version like '2026-10-09|%' then
  select s.installments into installments from public.v16_sale_snapshots s where s.sale_id=new.sale_id;
  n:=case when new.payment_mode='CASH' then 1 when installments=6 then 3 else 2 end;
  base:=floor(new.commission_total*100/n)/100;
  new.payment_count:=n;
  new.payment_schedule:=jsonb_build_object('payments',(select jsonb_agg(case when i=n then new.commission_total-base*(n-1) else base end order by i) from generate_series(1,n) i));
 end if;
 return new;
end $$;
revoke all on function v16_private.commission_new_payment_schedule() from public,anon,authenticated,service_role;
create trigger v16_new_commission_payment_schedule before insert on public.v16_advisor_commission_ledger for each row execute function v16_private.commission_new_payment_schedule();
