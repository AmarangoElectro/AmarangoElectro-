-- PREPARED ONLY. DO NOT APPLY WITHOUT OWNER AUTHORIZATION.
-- Additive V16 operational core: clients, future-only financing mode,
-- authorized quotes, immutable sale snapshots, commissions and ChatGPT bridge.

begin;

create table if not exists public.v16_client_operational_profiles (
  client_id text primary key references public.clientes(id),
  occupation_activity text,
  notes text,
  source text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.v16_client_create_requests (
  idempotency_key text primary key,
  client_id text not null unique references public.clientes(id),
  payload_fingerprint text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.v16_financing_mode_history (
  financing_mode_id bigint generated always as identity primary key,
  active_financing_mode text not null check (active_financing_mode in ('CLASSIC','PROTECTED')),
  policy_version text not null unique,
  effective_from timestamptz not null default now(),
  reason text not null,
  idempotency_key text not null unique,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

insert into public.v16_financing_mode_history
  (active_financing_mode, policy_version, reason, idempotency_key, created_by)
select 'CLASSIC', 'v16-financing-1', 'Initial additive operational policy',
       'v16-financing-bootstrap', u.user_id
from public.v16_user_access u
where u.active and u.role = 'owner'
order by u.created_at
limit 1
on conflict (idempotency_key) do nothing;

create table if not exists public.v16_authorized_sale_quotes (
  quote_id uuid primary key default gen_random_uuid(),
  canonical_product_id text not null,
  product_name text not null,
  product_model text,
  payment_mode text not null check (payment_mode in ('CASH','FINANCED')),
  financing_mode text not null check (financing_mode in ('CLASSIC','PROTECTED')),
  cash_price numeric not null check (cash_price > 0),
  initial_payment numeric not null check (initial_payment >= 0),
  installments integer not null check (installments > 0),
  installment_amount numeric not null check (installment_amount >= 0),
  financed_total numeric not null check (financed_total > 0),
  payment_amounts jsonb not null check (jsonb_typeof(payment_amounts) = 'array'),
  commission numeric not null check (commission >= 0),
  commission_policy_version text not null,
  pricing_policy_version text not null,
  commercial_snapshot jsonb not null,
  issued_by uuid not null references auth.users(id),
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  check (expires_at > issued_at),
  check (commercial_snapshot->>'financingMode' = financing_mode)
);

create table if not exists public.v16_sale_snapshots (
  sale_id text primary key references public.ventas(id),
  client_id text not null references public.clientes(id),
  canonical_product_id text not null,
  product_name text not null,
  product_model text,
  advisor_id uuid,
  payment_mode text not null check (payment_mode in ('CASH','FINANCED')),
  financing_mode text not null check (financing_mode in ('CLASSIC','PROTECTED')),
  cash_price numeric not null,
  initial_payment numeric not null,
  installments integer not null,
  installment_amount numeric not null,
  financed_total numeric not null,
  payment_schedule jsonb not null check (jsonb_typeof(payment_schedule) = 'array'),
  commission numeric not null,
  commission_policy_version text not null,
  pricing_policy_version text not null,
  sold_at timestamptz not null,
  actor_id uuid not null references auth.users(id),
  source text not null,
  idempotency_key text not null unique,
  authorized_quote_id uuid not null unique references public.v16_authorized_sale_quotes(quote_id),
  commercial_snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists v16_sale_snapshots_client_sold_idx on public.v16_sale_snapshots (client_id, sold_at desc);
create index if not exists v16_sale_snapshots_advisor_sold_idx on public.v16_sale_snapshots (advisor_id, sold_at desc) where advisor_id is not null;

create table if not exists public.v16_advisor_commission_ledger (
  commission_id bigint generated always as identity primary key,
  sale_id text not null unique references public.v16_sale_snapshots(sale_id),
  advisor_id uuid not null,
  cash_price numeric not null,
  payment_mode text not null check (payment_mode in ('CASH','FINANCED')),
  commission_total numeric not null check (commission_total >= 0),
  payment_count integer not null check (payment_count in (1,2)),
  payment_schedule jsonb not null,
  policy_version text not null,
  sale_equivalent numeric not null check (sale_equivalent in (0.5,1)),
  status text not null default 'ACCRUED' check (status in ('ACCRUED','VOID')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists v16_commission_advisor_month_idx on public.v16_advisor_commission_ledger (advisor_id, created_at);

create table if not exists public.v16_advisor_monthly_closes (
  close_id bigint generated always as identity primary key,
  advisor_id uuid not null,
  period_month date not null,
  equivalent_sales numeric not null,
  base_bonus numeric not null,
  additional_bonus numeric not null,
  total_bonus numeric not null,
  policy_version text not null,
  closed_by uuid not null references auth.users(id),
  closed_at timestamptz not null default now(),
  unique (advisor_id, period_month)
);

create table if not exists public.v16_advisor_monthly_close_operations (
  close_id bigint not null references public.v16_advisor_monthly_closes(close_id),
  sale_id text not null references public.v16_sale_snapshots(sale_id),
  advisor_id uuid not null,
  validation text not null check (validation in ('ACCEPTED','EXCLUDED')),
  validation_reason text not null,
  counts_for_bonus boolean not null,
  sale_equivalent numeric not null check (sale_equivalent in (0,0.5,1)),
  captured_at timestamptz not null,
  primary key (close_id,sale_id)
);

alter table public.v16_client_operational_profiles enable row level security;
alter table public.v16_client_create_requests enable row level security;
alter table public.v16_financing_mode_history enable row level security;
alter table public.v16_authorized_sale_quotes enable row level security;
alter table public.v16_sale_snapshots enable row level security;
alter table public.v16_advisor_commission_ledger enable row level security;
alter table public.v16_advisor_monthly_closes enable row level security;
alter table public.v16_advisor_monthly_close_operations enable row level security;

revoke all on public.v16_client_operational_profiles, public.v16_client_create_requests,
  public.v16_financing_mode_history, public.v16_authorized_sale_quotes,
  public.v16_sale_snapshots, public.v16_advisor_commission_ledger,
  public.v16_advisor_monthly_closes, public.v16_advisor_monthly_close_operations from anon, authenticated;

create or replace function public.v16_core_reject_mutation()
returns trigger language plpgsql set search_path = '' as $$
begin raise exception 'v16_immutable_record'; end; $$;

drop trigger if exists v16_sale_snapshots_immutable on public.v16_sale_snapshots;
create trigger v16_sale_snapshots_immutable before update or delete on public.v16_sale_snapshots
for each row execute function public.v16_core_reject_mutation();
drop trigger if exists v16_commission_ledger_immutable on public.v16_advisor_commission_ledger;
create trigger v16_commission_ledger_immutable before update or delete on public.v16_advisor_commission_ledger
for each row execute function public.v16_core_reject_mutation();
drop trigger if exists v16_monthly_closes_immutable on public.v16_advisor_monthly_closes;
create trigger v16_monthly_closes_immutable before update or delete on public.v16_advisor_monthly_closes
for each row execute function public.v16_core_reject_mutation();
drop trigger if exists v16_monthly_close_operations_immutable on public.v16_advisor_monthly_close_operations;
create trigger v16_monthly_close_operations_immutable before update or delete on public.v16_advisor_monthly_close_operations
for each row execute function public.v16_core_reject_mutation();

create or replace function public.v16_financed_commission_for_cash_price(p_cash_price numeric)
returns numeric language sql immutable set search_path = '' as $$
  select case
    when p_cash_price < 50000 then 7500 when p_cash_price < 100000 then 12000
    when p_cash_price < 150000 then 16000 when p_cash_price < 200000 then 20000
    when p_cash_price < 250000 then 24000 when p_cash_price < 300000 then 28000
    when p_cash_price < 400000 then 37500 when p_cash_price < 500000 then 45000
    when p_cash_price < 600000 then 52500 when p_cash_price < 700000 then 60000
    when p_cash_price < 800000 then 70000 when p_cash_price < 900000 then 80000
    when p_cash_price < 1000000 then 90000 else 100000 end
$$;

create or replace function public.v16_create_client(
  p_nombre text, p_dni text, p_telefono text, p_telefono2 text,
  p_direccion text, p_localidad text, p_ocupacion_actividad text,
  p_observaciones text, p_source text, p_idempotency_key text
) returns table(client_id text, created boolean, duplicate_reason text, created_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid(); v_role text := public.v16_current_role();
  v_id text; v_existing text; v_fingerprint text; v_created_at timestamptz := clock_timestamp();
  v_phone text := regexp_replace(coalesce(p_telefono,''),'[^0-9]','','g');
  v_dni text := regexp_replace(coalesce(p_dni,''),'[^0-9]','','g');
begin
  if v_user is null then raise exception 'authentication_required'; end if;
  if not ((v_role in ('owner','admin') and public.v16_has_capability('admin.access'))
      or (v_role='asesor' and public.v16_has_capability('advisors.access'))) then
    raise exception 'client_create_not_authorized';
  end if;
  if nullif(btrim(p_nombre),'') is null or length(v_phone) < 8 then raise exception 'client_identity_invalid'; end if;
  if nullif(btrim(p_idempotency_key),'') is null then raise exception 'idempotency_key_required'; end if;
  v_fingerprint := md5(lower(btrim(p_nombre)) || '|' || v_dni || '|' || v_phone);
  select r.client_id into v_existing from public.v16_client_create_requests r where r.idempotency_key=btrim(p_idempotency_key);
  if found then
    if (select r.payload_fingerprint from public.v16_client_create_requests r where r.idempotency_key=btrim(p_idempotency_key)) <> v_fingerprint then raise exception 'idempotency_key_conflict'; end if;
    return query select v_existing,false,null::text,(select r.created_at from public.v16_client_create_requests r where r.idempotency_key=btrim(p_idempotency_key)); return;
  end if;
  if v_dni<>'' then select c.id into v_existing from public.clientes c where regexp_replace(coalesce(c.dni,''),'[^0-9]','','g')=v_dni limit 1; end if;
  if v_existing is not null then return query select v_existing,false,'dni'::text,v_created_at; return; end if;
  select c.id into v_existing from public.clientes c where regexp_replace(coalesce(c.telefono,''),'[^0-9]','','g')=v_phone limit 1;
  if v_existing is not null then return query select v_existing,false,'phone'::text,v_created_at; return; end if;
  v_id := 'v16c_' || replace(gen_random_uuid()::text,'-','');
  insert into public.clientes(id,nombre,telefono,localidad,direccion,observaciones,alta,dni,telefono2,responsable)
  values(v_id,btrim(p_nombre),btrim(p_telefono),nullif(btrim(p_localidad),''),nullif(btrim(p_direccion),''),
    nullif(btrim(p_observaciones),''),v_created_at::text,nullif(v_dni,''),nullif(btrim(p_telefono2),''),v_user::text);
  insert into public.v16_client_operational_profiles values(v_id,nullif(btrim(p_ocupacion_actividad),''),nullif(btrim(p_observaciones),''),p_source,v_user,v_created_at);
  insert into public.v16_client_create_requests values(btrim(p_idempotency_key),v_id,v_fingerprint,v_user,v_created_at);
  return query select v_id,true,null::text,v_created_at;
end $$;

create or replace function public.v16_get_active_financing_mode()
returns table(active_financing_mode text, policy_version text, effective_from timestamptz, updated_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select h.active_financing_mode,h.policy_version,h.effective_from,h.created_at
  from public.v16_financing_mode_history h order by h.effective_from desc,h.financing_mode_id desc limit 1
$$;

create or replace function public.v16_set_active_financing_mode(p_mode text,p_expected_policy_version text,p_reason text,p_idempotency_key text)
returns table(active_financing_mode text, policy_version text, effective_from timestamptz, updated_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare v_user uuid:=auth.uid(); v_role text:=public.v16_current_role(); v_current public.v16_financing_mode_history%rowtype; v_new public.v16_financing_mode_history%rowtype;
begin
  if v_user is null then raise exception 'authentication_required'; end if;
  if v_role not in ('owner','admin') or not public.v16_has_capability('admin.access') then raise exception 'financing_mode_not_authorized'; end if;
  if coalesce(auth.jwt()->>'aal','')<>'aal2' then raise exception 'step_up_required'; end if;
  if upper(btrim(p_mode)) not in ('CLASSIC','PROTECTED') then raise exception 'invalid_financing_mode'; end if;
  if nullif(btrim(p_reason),'') is null or nullif(btrim(p_idempotency_key),'') is null then raise exception 'reason_and_idempotency_required'; end if;
  select * into v_new from public.v16_financing_mode_history h where h.idempotency_key=btrim(p_idempotency_key);
  if found then
    if v_new.active_financing_mode<>upper(btrim(p_mode)) or v_new.reason<>btrim(p_reason) then raise exception 'idempotency_key_conflict'; end if;
    return query select v_new.active_financing_mode,v_new.policy_version,v_new.effective_from,v_new.created_at; return;
  end if;
  select * into v_current from public.v16_financing_mode_history order by effective_from desc,financing_mode_id desc limit 1 for update;
  if v_current.policy_version<>p_expected_policy_version then raise exception 'financing_policy_concurrent_change'; end if;
  insert into public.v16_financing_mode_history(active_financing_mode,policy_version,effective_from,reason,idempotency_key,created_by)
  values(upper(btrim(p_mode)),'v16-financing-'||to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS'),clock_timestamp(),btrim(p_reason),btrim(p_idempotency_key),v_user)
  returning * into v_new;
  return query select v_new.active_financing_mode,v_new.policy_version,v_new.effective_from,v_new.created_at;
end $$;

create or replace function public.v16_build_sale_payment_schedule(p_payment_amounts jsonb,p_sold_at timestamptz)
returns jsonb language plpgsql immutable set search_path = '' as $
declare
  v_base_date date := (p_sold_at at time zone 'America/Argentina/Buenos_Aires')::date;
  v_base_month date := date_trunc('month',v_base_date)::date;
  v_day integer := extract(day from v_base_date)::integer;
  v_result jsonb := '[]'::jsonb;
  v_value jsonb;
  v_index integer := 0;
  v_month_start date;
  v_due date;
  v_amount numeric;
begin
  if p_sold_at is null or jsonb_typeof(p_payment_amounts)<>'array' or jsonb_array_length(p_payment_amounts)<1 then
    raise exception 'payment_schedule_invalid';
  end if;
  for v_value in select value from jsonb_array_elements(p_payment_amounts)
  loop
    if jsonb_typeof(v_value)<>'number' then raise exception 'payment_schedule_invalid'; end if;
    v_amount := (v_value #>> '{}')::numeric;
    if v_amount<=0 then raise exception 'payment_schedule_invalid'; end if;
    v_month_start := (v_base_month + make_interval(months=>v_index))::date;
    v_due := least(
      (v_month_start + (v_day - 1))::date,
      (v_month_start + interval '1 month - 1 day')::date
    );
    v_result := v_result || jsonb_build_array(jsonb_build_object(
      'sequence',v_index+1,
      'amount',v_amount,
      'dueDate',v_due::text,
      'graceThrough',(v_due+3)::text
    ));
    v_index := v_index+1;
  end loop;
  return v_result;
end $;

create or replace function public.v16_sync_sale_next_payment_amount()
returns trigger language plpgsql security definer set search_path = '' as $
declare
  v_schedule jsonb;
  v_amount numeric;
  v_target_sequence integer;
begin
  select s.payment_schedule into v_schedule
  from public.v16_sale_snapshots s
  where s.sale_id=new.sale_id;

  if not found then return new; end if;

  if new.payment_kind='PAYMENT' then
    v_target_sequence := new.installment_number+1;
  elsif new.payment_kind='REVERSAL' then
    v_target_sequence := new.installment_number;
  else
    return new;
  end if;

  if v_target_sequence>=1 and v_target_sequence<=jsonb_array_length(v_schedule) then
    v_amount := (v_schedule->(v_target_sequence-1)->>'amount')::numeric;
  else
    v_amount := null;
  end if;

  update public.ventas set "montoCuota"=v_amount where id=new.sale_id;
  return new;
end $;

drop trigger if exists v16_payment_event_sync_sale_next_amount on public.v16_payment_events;
create trigger v16_payment_event_sync_sale_next_amount
after insert on public.v16_payment_events
for each row execute function public.v16_sync_sale_next_payment_amount();

create or replace function public.v16_issue_authorized_sale_quote(
  p_canonical_product_id text,p_product_name text,p_product_model text,p_payment_mode text,p_financing_mode text,
  p_cash_price numeric,p_initial_payment numeric,p_installments integer,p_installment_amount numeric,p_financed_total numeric,
  p_payment_amounts jsonb,p_commission_policy_version text,p_pricing_policy_version text,p_commercial_snapshot jsonb,p_issued_for uuid,p_expires_at timestamptz
) returns uuid language plpgsql security definer set search_path = '' as $
declare v_quote uuid; v_commission numeric; v_payment_total numeric; v_first_payment numeric;
begin
  if auth.role()<>'service_role' then raise exception 'service_role_required'; end if;
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
  if upper(p_payment_mode)='CASH' then v_commission:=round(p_cash_price*0.10,2); else v_commission:=public.v16_financed_commission_for_cash_price(p_cash_price); end if;
  insert into public.v16_authorized_sale_quotes(canonical_product_id,product_name,product_model,payment_mode,financing_mode,cash_price,initial_payment,installments,installment_amount,financed_total,payment_amounts,commission,commission_policy_version,pricing_policy_version,commercial_snapshot,issued_by,expires_at)
  values(p_canonical_product_id,p_product_name,p_product_model,upper(p_payment_mode),upper(p_financing_mode),p_cash_price,p_initial_payment,p_installments,p_installment_amount,p_financed_total,p_payment_amounts,v_commission,p_commission_policy_version,p_pricing_policy_version,p_commercial_snapshot,p_issued_for,p_expires_at)
  returning quote_id into v_quote; return v_quote;
end $;

create or replace function public.v16_confirm_sale(p_client_id text,p_authorized_quote_id uuid,p_source text,p_idempotency_key text)
returns table(sale_id text,client_id text,canonical_product_id text,product_name text,product_model text,payment_mode text,financing_mode text,cash_price numeric,initial_payment numeric,installments integer,installment_amount numeric,financed_total numeric,payment_schedule jsonb,commission numeric,commission_policy_version text,pricing_policy_version text,sold_at timestamptz)
language plpgsql security definer set search_path = '' as $
declare v_user uuid:=auth.uid(); v_role text:=public.v16_current_role(); v_advisor uuid:=public.v16_current_advisor_id(); v_quote public.v16_authorized_sale_quotes%rowtype; v_mode text; v_sale text; v_sold timestamptz:=clock_timestamp(); v_payment_schedule jsonb;
begin
  if v_user is null then raise exception 'authentication_required'; end if;
  if not ((v_role in ('owner','admin') and public.v16_has_capability('admin.access')) or (v_role='asesor' and public.v16_has_capability('advisors.access'))) then raise exception 'sale_create_not_authorized'; end if;
  if v_role='asesor' and v_advisor is null then raise exception 'advisor_identity_required'; end if;
  if nullif(btrim(p_idempotency_key),'') is null then raise exception 'idempotency_key_required'; end if;
  select s.sale_id into v_sale from public.v16_sale_snapshots s where s.idempotency_key=btrim(p_idempotency_key);
  if found then
    if exists (
      select 1
      from public.v16_sale_snapshots s
      where s.sale_id=v_sale
        and (
          s.client_id is distinct from p_client_id
          or s.authorized_quote_id is distinct from p_authorized_quote_id
          or s.source is distinct from p_source
        )
    ) then
      raise exception 'idempotency_key_conflict';
    end if;
    return query select s.sale_id,s.client_id,s.canonical_product_id,s.product_name,s.product_model,s.payment_mode,s.financing_mode,s.cash_price,s.initial_payment,s.installments,s.installment_amount,s.financed_total,s.payment_schedule,s.commission,s.commission_policy_version,s.pricing_policy_version,s.sold_at from public.v16_sale_snapshots s where s.sale_id=v_sale;
    return;
  end if;
  if not exists(select 1 from public.clientes c where c.id=p_client_id) then raise exception 'client_not_found'; end if;
  select * into v_quote from public.v16_authorized_sale_quotes q where q.quote_id=p_authorized_quote_id for update;
  if not found or v_quote.issued_by<>v_user or v_quote.used_at is not null or v_quote.expires_at<=v_sold then raise exception 'authorized_quote_invalid'; end if;
  select m.active_financing_mode into v_mode from public.v16_get_active_financing_mode() m;
  if v_mode<>v_quote.financing_mode then raise exception 'financing_mode_changed_requote_required'; end if;
  v_sale:='v16s_'||replace(gen_random_uuid()::text,'-','');
  insert into public.ventas(id,\"clienteId\",producto,\"precioVenta\",responsable,fecha,cuotas,pagadas,tipo,total,precio,archivada,\"montoCuota\")
  values(v_sale,p_client_id,v_quote.product_name,v_quote.cash_price,coalesce(v_advisor::text,v_user::text),v_sold::text,v_quote.installments,0,v_quote.payment_mode,v_quote.financed_total,v_quote.cash_price,false,v_quote.installment_amount);
  insert into public.v16_sale_snapshots values(v_sale,p_client_id,v_quote.canonical_product_id,v_quote.product_name,v_quote.product_model,v_advisor,v_quote.payment_mode,v_quote.financing_mode,v_quote.cash_price,v_quote.initial_payment,v_quote.installments,v_quote.installment_amount,v_quote.financed_total,v_quote.commission,v_quote.commission_policy_version,v_quote.pricing_policy_version,v_sold,v_user,p_source,btrim(p_idempotency_key),v_quote.quote_id,v_quote.commercial_snapshot,v_sold);
  if v_advisor is not null then
    insert into public.v16_advisor_commission_ledger(sale_id,advisor_id,cash_price,payment_mode,commission_total,payment_count,payment_schedule,policy_version,sale_equivalent,created_by)
    values(v_sale,v_advisor,v_quote.cash_price,v_quote.payment_mode,v_quote.commission,case when v_quote.payment_mode='CASH' then 1 else 2 end,
      jsonb_build_object('payments',case when v_quote.payment_mode='CASH' then jsonb_build_array(v_quote.commission) else jsonb_build_array(v_quote.commission/2,v_quote.commission-v_quote.commission/2) end),v_quote.commission_policy_version,case when v_quote.cash_price<50000 then 0.5 else 1 end,v_user);
  end if;
  update public.v16_authorized_sale_quotes set used_at=v_sold where quote_id=v_quote.quote_id;
  return query select s.sale_id,s.client_id,s.canonical_product_id,s.product_name,s.product_model,s.payment_mode,s.financing_mode,s.cash_price,s.initial_payment,s.installments,s.installment_amount,s.financed_total,s.payment_schedule,s.commission,s.commission_policy_version,s.pricing_policy_version,s.sold_at from public.v16_sale_snapshots s where s.sale_id=v_sale;
end $$;

create or replace function public.v16_advisor_operation_close_fact(p_sale_id text,p_close_at timestamptz)
returns table(validation text,validation_reason text,counts_for_bonus boolean)
language plpgsql stable security definer set search_path = '' as $
declare
  v_snapshot public.v16_sale_snapshots%rowtype;
  v_sale public.ventas%rowtype;
  v_delivery public.v16_deliveries%rowtype;
  v_entry jsonb;
  v_sequence integer;
  v_due date;
  v_grace date;
  v_close_date date := (p_close_at at time zone 'America/Argentina/Buenos_Aires')::date;
  v_paid boolean;
  v_pending boolean := false;
  v_overdue boolean := false;
begin
  if p_close_at is null then
    return query select 'PENDING'::text,'Fecha de cierre no disponible'::text,false;
    return;
  end if;

  select * into v_snapshot from public.v16_sale_snapshots s where s.sale_id=p_sale_id;
  select * into v_sale from public.ventas v where v.id=p_sale_id;
  if not found or v_snapshot.sale_id is null then
    return query select 'PENDING'::text,'Snapshot de venta incompleto'::text,false;
    return;
  end if;

  if coalesce(v_sale.archivada,false) or upper(coalesce(v_sale.estado,'')) in ('CANCELADA','ANULADA','RECHAZADA') then
    return query select 'EXCLUDED'::text,'Operación cancelada'::text,false;
    return;
  end if;

  select * into v_delivery from public.v16_deliveries d where d.sale_id=p_sale_id limit 1;
  if not found then
    return query select 'PENDING'::text,'Entrega pendiente de validación'::text,false;
    return;
  end if;
  if v_delivery.status='CANCELADA' then
    return query select 'EXCLUDED'::text,'Entrega cancelada'::text,false;
    return;
  end if;
  if v_delivery.status<>'ENTREGADA' or v_delivery.delivered_at is null or v_delivery.delivered_at>p_close_at then
    return query select 'PENDING'::text,'Entrega pendiente'::text,false;
    return;
  end if;

  if jsonb_typeof(v_snapshot.payment_schedule)<>'array'
     or jsonb_array_length(v_snapshot.payment_schedule)<>v_snapshot.installments then
    return query select 'PENDING'::text,'Cronograma de pagos incompleto'::text,false;
    return;
  end if;

  for v_entry in select value from jsonb_array_elements(v_snapshot.payment_schedule)
  loop
    begin
      v_sequence := (v_entry->>'sequence')::integer;
      v_due := (v_entry->>'dueDate')::date;
      v_grace := (v_entry->>'graceThrough')::date;
    exception when others then
      return query select 'PENDING'::text,'Cronograma de pagos inválido'::text,false;
      return;
    end;

    if v_due<=v_close_date then
      select exists(
        select 1
        from public.v16_payment_events p
        where p.sale_id=p_sale_id
          and p.installment_number=v_sequence
          and p.payment_kind='PAYMENT'
          and p.paid_at<=p_close_at
          and not exists(
            select 1 from public.v16_payment_events r
            where r.reverses_payment_id=p.payment_id
              and r.paid_at<=p_close_at
          )
      ) into v_paid;

      if not v_paid then
        if v_snapshot.payment_mode='FINANCED' and v_grace<v_close_date then
          v_overdue:=true;
        else
          v_pending:=true;
        end if;
      end if;
    end if;
  end loop;

  if v_overdue then
    return query select 'EXCLUDED'::text,'Financiación en mora al cierre'::text,false;
    return;
  end if;
  if v_pending then
    return query select 'PENDING'::text,'Cobranza pendiente de validación'::text,false;
    return;
  end if;

  return query select 'ACCEPTED'::text,'Venta, entrega y cobranza validadas'::text,true;
end $;

create or replace function public.v16_close_advisor_month(p_advisor_id uuid,p_period_month date,p_policy_version text)
returns table(close_id bigint,advisor_id uuid,period_month date,equivalent_sales numeric,base_bonus numeric,additional_bonus numeric,total_bonus numeric,policy_version text,closed_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid:=auth.uid();
  v_role text:=public.v16_current_role();
  v_existing public.v16_advisor_monthly_closes%rowtype;
  v_equiv numeric;
  v_base numeric;
  v_extra numeric;
  v_close public.v16_advisor_monthly_closes%rowtype;
  v_close_at timestamptz:=clock_timestamp();
  v_pending_count bigint;
begin
  if v_user is null then raise exception 'authentication_required'; end if;
  if v_role not in ('owner','admin') or not public.v16_has_capability('admin.access') then raise exception 'commission_close_not_authorized'; end if;
  if coalesce(auth.jwt()->>'aal','')<>'aal2' then raise exception 'step_up_required'; end if;
  if p_advisor_id is null
     or p_period_month<>date_trunc('month',p_period_month)::date
     or p_period_month>=date_trunc('month',(now() at time zone 'America/Argentina/Buenos_Aires')::date)::date then
    raise exception 'closed_month_required';
  end if;

  select * into v_existing
  from public.v16_advisor_monthly_closes c
  where c.advisor_id=p_advisor_id and c.period_month=p_period_month;
  if found then
    return query select v_existing.close_id,v_existing.advisor_id,v_existing.period_month,v_existing.equivalent_sales,
      v_existing.base_bonus,v_existing.additional_bonus,v_existing.total_bonus,v_existing.policy_version,v_existing.closed_at;
    return;
  end if;

  select count(*) into v_pending_count
  from public.v16_advisor_commission_ledger l
  join public.v16_sale_snapshots s on s.sale_id=l.sale_id
  cross join lateral public.v16_advisor_operation_close_fact(s.sale_id,v_close_at) f
  where l.advisor_id=p_advisor_id
    and l.status='ACCRUED'
    and (s.sold_at at time zone 'America/Argentina/Buenos_Aires')::date>=p_period_month
    and (s.sold_at at time zone 'America/Argentina/Buenos_Aires')::date<(p_period_month+interval '1 month')::date
    and f.validation='PENDING';

  if v_pending_count>0 then raise exception 'advisor_month_has_pending_operations'; end if;

  select coalesce(sum(case when f.validation='ACCEPTED' and f.counts_for_bonus then l.sale_equivalent else 0 end),0)
  into v_equiv
  from public.v16_advisor_commission_ledger l
  join public.v16_sale_snapshots s on s.sale_id=l.sale_id
  cross join lateral public.v16_advisor_operation_close_fact(s.sale_id,v_close_at) f
  where l.advisor_id=p_advisor_id
    and l.status='ACCRUED'
    and (s.sold_at at time zone 'America/Argentina/Buenos_Aires')::date>=p_period_month
    and (s.sold_at at time zone 'America/Argentina/Buenos_Aires')::date<(p_period_month+interval '1 month')::date;

  v_base:=case when v_equiv>=20 then 100000 when v_equiv>=15 then 65000 when v_equiv>=10 then 35000 when v_equiv>=5 then 10000 else 0 end;
  v_extra:=case when v_equiv>=21 then floor(v_equiv-20)*7500 else 0 end;

  insert into public.v16_advisor_monthly_closes(advisor_id,period_month,equivalent_sales,base_bonus,additional_bonus,total_bonus,policy_version,closed_by,closed_at)
  values(p_advisor_id,p_period_month,v_equiv,v_base,v_extra,v_base+v_extra,p_policy_version,v_user,v_close_at)
  returning * into v_close;

  insert into public.v16_advisor_monthly_close_operations(
    close_id,sale_id,advisor_id,validation,validation_reason,counts_for_bonus,sale_equivalent,captured_at
  )
  select v_close.close_id,s.sale_id,l.advisor_id,f.validation,f.validation_reason,f.counts_for_bonus,
    case when f.counts_for_bonus then l.sale_equivalent else 0 end,v_close_at
  from public.v16_advisor_commission_ledger l
  join public.v16_sale_snapshots s on s.sale_id=l.sale_id
  cross join lateral public.v16_advisor_operation_close_fact(s.sale_id,v_close_at) f
  where l.advisor_id=p_advisor_id
    and l.status='ACCRUED'
    and f.validation in ('ACCEPTED','EXCLUDED')
    and (s.sold_at at time zone 'America/Argentina/Buenos_Aires')::date>=p_period_month
    and (s.sold_at at time zone 'America/Argentina/Buenos_Aires')::date<(p_period_month+interval '1 month')::date;

  return query select v_close.close_id,v_close.advisor_id,v_close.period_month,v_close.equivalent_sales,
    v_close.base_bonus,v_close.additional_bonus,v_close.total_bonus,v_close.policy_version,v_close.closed_at;
end $$;

create or replace function public.v16_chatgpt_operational_bridge(p_email text,p_rpc text,p_args jsonb default '{}'::jsonb,p_aal text default 'aal1')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_email text:=lower(btrim(coalesce(p_email,''))); v_user uuid; v_access public.v16_user_access%rowtype; v_claims jsonb; v_result jsonb;
begin
  if auth.role()<>'service_role' then raise exception 'service_role_required'; end if;
  select u.id into v_user from auth.users u where lower(u.email)=v_email order by u.created_at limit 1;
  if v_user is null then raise exception 'identity_not_mapped'; end if;
  select * into v_access from public.v16_user_access a where a.user_id=v_user and a.active;
  if not found then raise exception 'identity_not_mapped'; end if;
  v_claims:=jsonb_build_object('sub',v_user::text,'role','authenticated','aal',case when p_aal='aal2' then 'aal2' else 'aal1' end,'email',v_email);
  perform set_config('request.jwt.claims',v_claims::text,true); perform set_config('request.jwt.claim.sub',v_user::text,true); perform set_config('request.jwt.claim.role','authenticated',true);
  case p_rpc
    when 'v16_crm_list_clients' then select coalesce(jsonb_agg(to_jsonb(x)),'[]') into v_result from public.v16_crm_list_clients(p_args->>'search_text',coalesce((p_args->>'row_limit')::int,100),coalesce((p_args->>'row_offset')::int,0)) x;
    when 'v16_crm_client_360' then select coalesce(jsonb_agg(to_jsonb(x)),'[]') into v_result from public.v16_crm_client_360(p_args->>'p_client_id') x;
    when 'v16_crm_client_sales' then select coalesce(jsonb_agg(to_jsonb(x)),'[]') into v_result from public.v16_crm_client_sales(p_args->>'p_client_id') x;
    when 'v16_collections_list' then select coalesce(jsonb_agg(to_jsonb(x)),'[]') into v_result from public.v16_collections_list(p_args->>'search_text',p_args->>'status_filter',coalesce((p_args->>'include_complete')::boolean,false),coalesce((p_args->>'row_limit')::int,100),coalesce((p_args->>'row_offset')::int,0)) x;
    when 'v16_collections_summary' then select coalesce(jsonb_agg(to_jsonb(x)),'[]') into v_result from public.v16_collections_summary() x;
    when 'v16_payment_history_list' then select coalesce(jsonb_agg(to_jsonb(x)),'[]') into v_result from public.v16_payment_history_list(p_args->>'p_client_id',p_args->>'p_sale_id',p_args->>'p_payment_kind',(p_args->>'p_from')::timestamptz,(p_args->>'p_to')::timestamptz,p_args->>'p_search_text',coalesce((p_args->>'p_row_limit')::int,100),coalesce((p_args->>'p_row_offset')::int,0)) x;
    when 'v16_payment_history_summary' then select coalesce(jsonb_agg(to_jsonb(x)),'[]') into v_result from public.v16_payment_history_summary(p_args->>'p_client_id',p_args->>'p_sale_id',(p_args->>'p_from')::timestamptz,(p_args->>'p_to')::timestamptz) x;
    when 'v16_register_customer_payment' then select coalesce(jsonb_agg(to_jsonb(x)),'[]') into v_result from public.v16_register_customer_payment(p_args->>'p_sale_id',(p_args->>'p_amount_received')::numeric,(p_args->>'p_paid_at')::timestamptz,p_args->>'p_payment_method',p_args->>'p_payment_reference',p_args->>'p_idempotency_key',coalesce((p_args->>'p_adjustment_amount')::numeric,0),p_args->>'p_adjustment_reason',p_args->>'p_note') x;
    when 'v16_reverse_customer_payment' then select coalesce(jsonb_agg(to_jsonb(x)),'[]') into v_result from public.v16_reverse_customer_payment((p_args->>'p_payment_id')::bigint,p_args->>'p_reason',(p_args->>'p_reversed_at')::timestamptz,p_args->>'p_idempotency_key') x;
    when 'v16_deliveries_list' then select coalesce(jsonb_agg(to_jsonb(x)),'[]') into v_result from public.v16_deliveries_list(p_args->>'search_text',p_args->>'status_filter',coalesce((p_args->>'row_limit')::int,100),coalesce((p_args->>'row_offset')::int,0)) x;
    when 'v16_delivery_detail' then select coalesce(jsonb_agg(to_jsonb(x)),'[]') into v_result from public.v16_delivery_detail((p_args->>'p_delivery_id')::bigint) x;
    when 'v16_create_delivery' then select coalesce(jsonb_agg(to_jsonb(x)),'[]') into v_result from public.v16_create_delivery(p_args->>'p_sale_id',(p_args->>'p_scheduled_at')::timestamptz,p_args->>'p_address_snapshot',p_args->>'p_notes') x;
    when 'v16_transition_delivery' then select coalesce(jsonb_agg(to_jsonb(x)),'[]') into v_result from public.v16_transition_delivery((p_args->>'p_delivery_id')::bigint,p_args->>'p_target_status',(p_args->>'p_transitioned_at')::timestamptz,(p_args->>'p_scheduled_at')::timestamptz,p_args->>'p_address_snapshot',p_args->>'p_note',p_args->>'p_expected_current_status') x;
    when 'v16_create_client' then select coalesce(jsonb_agg(to_jsonb(x)),'[]') into v_result from public.v16_create_client(p_args->>'p_nombre',p_args->>'p_dni',p_args->>'p_telefono',p_args->>'p_telefono2',p_args->>'p_direccion',p_args->>'p_localidad',p_args->>'p_ocupacion_actividad',p_args->>'p_observaciones',p_args->>'p_source',p_args->>'p_idempotency_key') x;
    when 'v16_get_active_financing_mode' then select coalesce(jsonb_agg(to_jsonb(x)),'[]') into v_result from public.v16_get_active_financing_mode() x;
    when 'v16_set_active_financing_mode' then select coalesce(jsonb_agg(to_jsonb(x)),'[]') into v_result from public.v16_set_active_financing_mode(p_args->>'p_mode',p_args->>'p_expected_policy_version',p_args->>'p_reason',p_args->>'p_idempotency_key') x;
    when 'v16_confirm_sale' then select coalesce(jsonb_agg(to_jsonb(x)),'[]') into v_result from public.v16_confirm_sale(p_args->>'p_client_id',(p_args->>'p_authorized_quote_id')::uuid,p_args->>'p_source',p_args->>'p_idempotency_key') x;
    else raise exception 'operational_bridge_rpc_not_allowed';
  end case;
  return coalesce(v_result,'[]'::jsonb);
end $$;

revoke execute on function public.v16_core_reject_mutation() from public,anon,authenticated;
revoke execute on function public.v16_financed_commission_for_cash_price(numeric) from public,anon,authenticated;
revoke execute on function public.v16_create_client(text,text,text,text,text,text,text,text,text,text) from public,anon,authenticated;
revoke execute on function public.v16_get_active_financing_mode() from public,anon,authenticated;
revoke execute on function public.v16_set_active_financing_mode(text,text,text,text) from public,anon,authenticated;
revoke execute on function public.v16_build_sale_payment_schedule(jsonb,timestamptz) from public,anon,authenticated;
revoke execute on function public.v16_sync_sale_next_payment_amount() from public,anon,authenticated;
revoke execute on function public.v16_issue_authorized_sale_quote(text,text,text,text,text,numeric,numeric,integer,numeric,numeric,jsonb,text,text,jsonb,uuid,timestamptz) from public,anon,authenticated;
revoke execute on function public.v16_confirm_sale(text,uuid,text,text) from public,anon,authenticated;
revoke execute on function public.v16_advisor_operation_close_fact(text,timestamptz) from public,anon,authenticated;
revoke execute on function public.v16_close_advisor_month(uuid,date,text) from public,anon,authenticated;
revoke execute on function public.v16_chatgpt_operational_bridge(text,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.v16_issue_authorized_sale_quote(text,text,text,text,text,numeric,numeric,integer,numeric,numeric,jsonb,text,text,jsonb,uuid,timestamptz) to service_role;
grant execute on function public.v16_chatgpt_operational_bridge(text,text,jsonb,text) to service_role;

commit;
