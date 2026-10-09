-- Applied to staging 2026-10-09 after explicit authorization; prospective commissions only.
-- No production, historical sales, recorded payments or prior commissions are authorized.
-- No catalog, sales, historical quotes, price engine, financing or ledger UPDATE.
create schema if not exists v16_private;
revoke all on schema v16_private from public,anon,authenticated;
create table v16_private.commission_policy (
 singleton boolean primary key default true check(singleton),
 financed_cap numeric check(financed_cap is null or (financed_cap>=0 and financed_cap<=100000000)),
 revision integer not null default 1, updated_at timestamptz not null default now(),
 updated_by uuid references auth.users(id)
);
alter table v16_private.commission_policy enable row level security;
revoke all on v16_private.commission_policy from public,anon,authenticated,service_role;
insert into v16_private.commission_policy(singleton,financed_cap) values(true,null);

create function v16_private.commission_amount(p_cash numeric,p_mode text,p_cap numeric)
returns numeric language sql immutable set search_path='' as $$
 select case when p_cash is null or p_cash<0 then null when p_mode='CASH' then round(p_cash*case when p_cash<200000 then .10 else .07 end,2)
 when p_mode='FINANCED' then case when p_cash<50000 then 7500 when p_cash<100000 then 12000 when p_cash<200000 then 20000 when p_cash<300000 then 28000 else round(least(p_cash*.10,coalesce(p_cap,p_cash*.10)),2) end else null end
$$;
revoke all on function v16_private.commission_amount(numeric,text,numeric) from public,anon,authenticated,service_role;

create function v16_private.commission_schedule(p_total numeric,p_mode text,p_installments integer)
returns jsonb language sql immutable set search_path='' as $$
 select jsonb_build_object('paymentCount',n,'payments',(select jsonb_agg(case when i=n then p_total-base*(n-1) else base end order by i) from generate_series(1,n) i))
 from (select n,floor(p_total*100/n)/100 base from (select case when p_mode='CASH' then 1 when p_installments=6 then 3 else 2 end n) counts) splits
$$;
revoke all on function v16_private.commission_schedule(numeric,text,integer) from public,anon,authenticated,service_role;

create function public.v16_commission_workspace_v2(p_email text,p_action text default 'read',p_cap numeric default null,p_revision integer default null,p_period text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.v16_user_access%rowtype; cfg v16_private.commission_policy%rowtype; payload jsonb; internal boolean;
begin
 if coalesce(auth.jwt()->>'role','')<>'service_role' then raise exception 'service_role_required'; end if;
 select x.* into a from public.v16_user_access x join auth.users u on u.id=x.user_id where x.active and lower(u.email)=lower(btrim(p_email));
 internal:=coalesce(a.role in ('owner','admin') and ('*'=any(a.capabilities) or 'admin.access'=any(a.capabilities)),false);
 if not internal and not coalesce(a.role='asesor' and a.advisor_id is not null and ('*'=any(a.capabilities) or 'advisors.access'=any(a.capabilities)),false) then raise exception 'commission_not_authorized'; end if;
 if p_action not in ('read','policy','set_cap') or p_action is null then raise exception 'invalid_action'; end if;
 if p_action='set_cap' then
  if a.role<>'owner' then raise exception 'commission_policy_not_authorized'; end if;
  if p_revision is null or p_revision<1 or p_cap<0 or p_cap>100000000 then raise exception 'invalid_cap'; end if;
  update v16_private.commission_policy set financed_cap=p_cap,revision=revision+1,updated_at=now(),updated_by=a.user_id where singleton and revision=p_revision returning * into cfg;
  if not found then raise exception 'commission_policy_conflict'; end if;
 else select * into cfg from v16_private.commission_policy where singleton; end if;
 payload:=case when p_action='read' then public.v16_commission_visibility_read(p_email,p_period) else jsonb_build_object('role',a.role) end;
 return payload || jsonb_build_object('cap',cfg.financed_cap,'revision',cfg.revision,'version','2026-10-09|'||cfg.revision,'policyActive',true);
end $$;
revoke all on function public.v16_commission_workspace_v2(text,text,numeric,integer,text) from public,anon,authenticated;
grant execute on function public.v16_commission_workspace_v2(text,text,numeric,integer,text) to service_role;

-- Abort if the existing quote issuer differs from the definition reviewed.
do $guard$
begin
 if (select count(*) from pg_proc where pronamespace='public'::regnamespace and proname='v16_issue_authorized_sale_quote')<>1 or
 (select md5(pg_get_functiondef(oid)) from pg_proc where pronamespace='public'::regnamespace and proname='v16_issue_authorized_sale_quote')<>'ae1142498b0afbf81858ea4dc01723df' then raise exception 'quote_definition_unexpected'; end if;
end $guard$;
CREATE OR REPLACE FUNCTION public.v16_issue_authorized_sale_quote(p_canonical_product_id text, p_product_name text, p_product_model text, p_payment_mode text, p_financing_mode text, p_cash_price numeric, p_initial_payment numeric, p_installments integer, p_installment_amount numeric, p_financed_total numeric, p_payment_amounts jsonb, p_commission_policy_version text, p_pricing_policy_version text, p_commercial_snapshot jsonb, p_issued_for uuid, p_expires_at timestamp with time zone)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_quote uuid; v_commission numeric; v_payment_total numeric; v_first_payment numeric; v_cfg v16_private.commission_policy%rowtype; v_snapshot jsonb;
begin
  if coalesce(auth.jwt()->>'role','')<>'service_role' then raise exception 'service_role_required'; end if;
  if p_issued_for is null or p_expires_at<=clock_timestamp() then raise exception 'quote_identity_or_expiry_invalid'; end if;
  if p_installments<1 or jsonb_typeof(p_payment_amounts)<>'array' or jsonb_array_length(p_payment_amounts)<>p_installments then
    raise exception 'payment_schedule_invalid';
  end if;
  if exists(select 1 from jsonb_array_elements(p_payment_amounts) x where jsonb_typeof(x)<>'number' or (x#>>'{}')::numeric<=0) then
    raise exception 'payment_schedule_invalid';
  end if;
  select coalesce(sum((x#>>'{}')::numeric),0) into v_payment_total from jsonb_array_elements(p_payment_amounts) x;
  v_first_payment := (p_payment_amounts->>0)::numeric;
  if abs(v_payment_total-p_financed_total)>0.01 or abs(v_first_payment-p_initial_payment)>0.01 then
    raise exception 'payment_schedule_total_mismatch';
  end if;
  if upper(p_payment_mode)='CASH' and (p_installments<>1 or abs(p_financed_total-p_cash_price)>0.01) then
    raise exception 'cash_quote_schedule_invalid';
  end if;
  if p_commission_policy_version like '2026-10-09|%' then
    select * into v_cfg from v16_private.commission_policy where singleton for share;
    if p_commission_policy_version<>('2026-10-09|'||v_cfg.revision) then raise exception 'commission_policy_conflict'; end if;
    v_commission:=v16_private.commission_amount(p_cash_price,upper(p_payment_mode),v_cfg.financed_cap);
    if v_commission is null then raise exception 'invalid_commission_input'; end if;
    v_snapshot:=p_commercial_snapshot || jsonb_build_object('commission',v_commission,'commissionPolicyVersion',p_commission_policy_version,'commissionCap',v_cfg.financed_cap);
  else
    if upper(p_payment_mode)='CASH' then v_commission:=round(p_cash_price*0.10,2); else v_commission:=public.v16_financed_commission_for_cash_price(p_cash_price); end if;
    v_snapshot:=p_commercial_snapshot;
  end if;
  insert into public.v16_authorized_sale_quotes(canonical_product_id,product_name,product_model,payment_mode,financing_mode,cash_price,initial_payment,installments,installment_amount,financed_total,payment_amounts,commission,commission_policy_version,pricing_policy_version,commercial_snapshot,issued_by,expires_at)
  values(p_canonical_product_id,p_product_name,p_product_model,upper(p_payment_mode),upper(p_financing_mode),p_cash_price,p_initial_payment,p_installments,p_installment_amount,p_financed_total,p_payment_amounts,v_commission,p_commission_policy_version,p_pricing_policy_version,v_snapshot,p_issued_for,p_expires_at)
  returning quote_id into v_quote; return v_quote;
end $function$
;

-- Existing 1/2-part rows remain valid and immutable. Only new-policy inserts receive the new split.
alter table public.v16_advisor_commission_ledger drop constraint v16_advisor_commission_ledger_payment_count_check;
alter table public.v16_advisor_commission_ledger add constraint v16_advisor_commission_ledger_payment_count_check check(payment_count in(1,2,3));
create function v16_private.commission_new_payment_schedule() returns trigger language plpgsql security definer set search_path='' as $$
declare snapshot public.v16_sale_snapshots%rowtype; plan jsonb;
begin
 if new.policy_version like '2026-10-09|%' then
  select * into snapshot from public.v16_sale_snapshots where sale_id=new.sale_id;
  if not found or snapshot.commission_policy_version<>new.policy_version or snapshot.commission<>new.commission_total or snapshot.payment_mode<>new.payment_mode then raise exception 'commission_snapshot_mismatch'; end if;
  plan:=v16_private.commission_schedule(new.commission_total,new.payment_mode,snapshot.installments);
  new.payment_count:=(plan->>'paymentCount')::integer;
  new.payment_schedule:=jsonb_build_object('payments',plan->'payments');
 end if;
 return new;
end $$;
revoke all on function v16_private.commission_new_payment_schedule() from public,anon,authenticated,service_role;
create trigger v16_new_commission_payment_schedule before insert on public.v16_advisor_commission_ledger for each row execute function v16_private.commission_new_payment_schedule();
