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
  client_id text not null references public.clientes(id),
  payload_fingerprint text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists v16_client_create_requests_client_idx
  on public.v16_client_create_requests (client_id, created_at desc);

create table if not exists public.v16_operational_idempotency_guard (
  idempotency_key text primary key,
  operation text not null,
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

alter table public.v16_client_operational_profiles enable row level security;
alter table public.v16_client_create_requests enable row level security;
alter table public.v16_operational_idempotency_guard enable row level security;
alter table public.v16_financing_mode_history enable row level security;
alter table public.v16_authorized_sale_quotes enable row level security;
alter table public.v16_sale_snapshots enable row level security;
alter table public.v16_advisor_commission_ledger enable row level security;
alter table public.v16_advisor_monthly_closes enable row level security;

revoke all on public.v16_client_operational_profiles, public.v16_client_create_requests,
  public.v16_operational_idempotency_guard,
  public.v16_financing_mode_history, public.v16_authorized_sale_quotes,
  public.v16_sale_snapshots, public.v16_advisor_commission_ledger,
  public.v16_advisor_monthly_closes from anon, authenticated;

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
drop trigger if exists v16_financing_mode_history_immutable on public.v16_financing_mode_history;
create trigger v16_financing_mode_history_immutable before update or delete on public.v16_financing_mode_history
for each row execute function public.v16_core_reject_mutation();

create or replace function public.v16_core_claim_idempotency(
  p_operation text, p_idempotency_key text, p_payload jsonb
) returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_claim public.v16_operational_idempotency_guard%rowtype;
  v_key text := btrim(coalesce(p_idempotency_key,''));
  v_operation text := btrim(coalesce(p_operation,''));
  v_fingerprint text := md5(coalesce(p_payload,'{}'::jsonb)::text);
begin
  if v_user is null then raise exception 'authentication_required'; end if;
  if v_key = '' or v_operation = '' then raise exception 'idempotency_key_required'; end if;

  insert into public.v16_operational_idempotency_guard
    (idempotency_key,operation,payload_fingerprint,created_by)
  values (v_key,v_operation,v_fingerprint,v_user)
  on conflict (idempotency_key) do nothing;

  select * into v_claim
  from public.v16_operational_idempotency_guard g
  where g.idempotency_key=v_key
  for update;

  if v_claim.operation<>v_operation or v_claim.payload_fingerprint<>v_fingerprint then
    raise exception 'idempotency_key_conflict';
  end if;
end $$;

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
  v_advisor uuid := public.v16_current_advisor_id();
  v_id text; v_existing text; v_fingerprint text; v_created_at timestamptz := clock_timestamp();
  v_request public.v16_client_create_requests%rowtype;
  v_phone text := regexp_replace(coalesce(p_telefono,''),'[^0-9]','','g');
  v_dni text := regexp_replace(coalesce(p_dni,''),'[^0-9]','','g');
begin
  if v_user is null then raise exception 'authentication_required'; end if;
  if not ((v_role in ('owner','admin') and public.v16_has_capability('admin.access'))
      or (v_role='advisor' and public.v16_has_capability('advisors.access'))) then
    raise exception 'client_create_not_authorized';
  end if;
  if nullif(btrim(p_nombre),'') is null or length(v_phone) < 8 then raise exception 'client_identity_invalid'; end if;
  if nullif(btrim(coalesce(p_source,'')),'') is null then raise exception 'client_source_required'; end if;
  if nullif(btrim(p_idempotency_key),'') is null then raise exception 'idempotency_key_required'; end if;

  v_fingerprint := md5(jsonb_build_object(
    'nombre',lower(btrim(p_nombre)), 'dni',v_dni, 'telefono',v_phone,
    'telefono2',regexp_replace(coalesce(p_telefono2,''),'[^0-9]','','g'),
    'direccion',lower(btrim(coalesce(p_direccion,''))),
    'localidad',lower(btrim(coalesce(p_localidad,''))),
    'ocupacionActividad',lower(btrim(coalesce(p_ocupacion_actividad,''))),
    'observaciones',btrim(coalesce(p_observaciones,'')),
    'source',btrim(p_source)
  )::text);

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('v16-client-request:'||btrim(p_idempotency_key),0)
  );
  select * into v_request
  from public.v16_client_create_requests r
  where r.idempotency_key=btrim(p_idempotency_key);
  if found then
    if v_request.payload_fingerprint<>v_fingerprint then raise exception 'idempotency_key_conflict'; end if;
    return query select v_request.client_id,false,null::text,v_request.created_at;
    return;
  end if;

  if v_dni<>'' then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('v16-client-dni:'||v_dni,0));
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('v16-client-phone:'||v_phone,0));

  if v_dni<>'' then select c.id into v_existing from public.clientes c where regexp_replace(coalesce(c.dni,''),'[^0-9]','','g')=v_dni limit 1; end if;
  if v_existing is null then
    select c.id into v_existing from public.clientes c where regexp_replace(coalesce(c.telefono,''),'[^0-9]','','g')=v_phone limit 1;
  end if;
  if v_existing is not null then
    if v_role='advisor' and not public.v16_advisor_can_access_client(v_existing) then
      raise exception 'client_duplicate_outside_advisor_scope';
    end if;
    insert into public.v16_client_create_requests
      (idempotency_key,client_id,payload_fingerprint,created_by,created_at)
    values (btrim(p_idempotency_key),v_existing,v_fingerprint,v_user,v_created_at);
    return query select v_existing,false,
      case when v_dni<>'' and exists(
        select 1 from public.clientes c where c.id=v_existing
          and regexp_replace(coalesce(c.dni,''),'[^0-9]','','g')=v_dni
      ) then 'dni'::text else 'phone'::text end,
      v_created_at;
    return;
  end if;

  v_id := 'v16c_' || replace(gen_random_uuid()::text,'-','');
  insert into public.clientes(id,nombre,telefono,localidad,direccion,observaciones,alta,dni,telefono2,responsable)
  values(v_id,btrim(p_nombre),btrim(p_telefono),nullif(btrim(p_localidad),''),nullif(btrim(p_direccion),''),
    nullif(btrim(p_observaciones),''),v_created_at::text,nullif(v_dni,''),nullif(btrim(p_telefono2),''),v_user::text);
  insert into public.v16_client_operational_profiles
    (client_id,occupation_activity,notes,source,created_by,created_at)
  values(v_id,nullif(btrim(p_ocupacion_actividad),''),nullif(btrim(p_observaciones),''),btrim(p_source),v_user,v_created_at);
  if v_role='advisor' then
    if v_advisor is null then raise exception 'advisor_identity_required'; end if;
    insert into public.v16_advisor_client_portfolio
      (advisor_id,client_id,active,assigned_at,assigned_by,metadata)
    values(v_advisor,v_id,true,v_created_at,v_user,jsonb_build_object('source','v16_create_client'));
  end if;
  insert into public.v16_client_create_requests
    (idempotency_key,client_id,payload_fingerprint,created_by,created_at)
  values(btrim(p_idempotency_key),v_id,v_fingerprint,v_user,v_created_at);
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

create or replace function public.v16_issue_authorized_sale_quote(
  p_canonical_product_id text,p_product_name text,p_product_model text,p_payment_mode text,p_financing_mode text,
  p_cash_price numeric,p_initial_payment numeric,p_installments integer,p_installment_amount numeric,p_financed_total numeric,
  p_commission_policy_version text,p_pricing_policy_version text,p_commercial_snapshot jsonb,p_issued_for uuid,p_expires_at timestamptz
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_quote uuid; v_commission numeric;
begin
  if auth.role()<>'service_role' then raise exception 'service_role_required'; end if;
  if p_issued_for is null or p_expires_at<=clock_timestamp() then raise exception 'quote_identity_or_expiry_invalid'; end if;
  if upper(p_payment_mode)='CASH' then v_commission:=round(p_cash_price*0.10,2); else v_commission:=public.v16_financed_commission_for_cash_price(p_cash_price); end if;
  insert into public.v16_authorized_sale_quotes(canonical_product_id,product_name,product_model,payment_mode,financing_mode,cash_price,initial_payment,installments,installment_amount,financed_total,commission,commission_policy_version,pricing_policy_version,commercial_snapshot,issued_by,expires_at)
  values(p_canonical_product_id,p_product_name,p_product_model,upper(p_payment_mode),upper(p_financing_mode),p_cash_price,p_initial_payment,p_installments,p_installment_amount,p_financed_total,v_commission,p_commission_policy_version,p_pricing_policy_version,p_commercial_snapshot,p_issued_for,p_expires_at)
  returning quote_id into v_quote; return v_quote;
end $$;

create or replace function public.v16_confirm_sale(p_client_id text,p_authorized_quote_id uuid,p_source text,p_idempotency_key text)
returns table(sale_id text,client_id text,canonical_product_id text,product_name text,product_model text,payment_mode text,financing_mode text,cash_price numeric,initial_payment numeric,installments integer,installment_amount numeric,financed_total numeric,commission numeric,commission_policy_version text,pricing_policy_version text,sold_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare v_user uuid:=auth.uid(); v_role text:=public.v16_current_role(); v_advisor uuid:=public.v16_current_advisor_id(); v_quote public.v16_authorized_sale_quotes%rowtype; v_existing public.v16_sale_snapshots%rowtype; v_mode text; v_sale text; v_sold timestamptz:=clock_timestamp();
begin
  if v_user is null then raise exception 'authentication_required'; end if;
  if not ((v_role in ('owner','admin') and public.v16_has_capability('admin.access')) or (v_role='advisor' and public.v16_has_capability('advisors.access'))) then raise exception 'sale_create_not_authorized'; end if;
  if v_role='advisor' and v_advisor is null then raise exception 'advisor_identity_required'; end if;
  if nullif(btrim(coalesce(p_client_id,'')),'') is null or p_authorized_quote_id is null then raise exception 'sale_identity_required'; end if;
  if nullif(btrim(coalesce(p_source,'')),'') is null then raise exception 'sale_source_required'; end if;
  if nullif(btrim(p_idempotency_key),'') is null then raise exception 'idempotency_key_required'; end if;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('v16-confirm-sale:'||btrim(p_idempotency_key),0)
  );
  select * into v_existing from public.v16_sale_snapshots s where s.idempotency_key=btrim(p_idempotency_key);
  if found then
    if v_existing.client_id<>btrim(p_client_id)
       or v_existing.authorized_quote_id<>p_authorized_quote_id
       or v_existing.source<>btrim(p_source) then
      raise exception 'idempotency_key_conflict';
    end if;
    return query select s.sale_id,s.client_id,s.canonical_product_id,s.product_name,s.product_model,s.payment_mode,s.financing_mode,s.cash_price,s.initial_payment,s.installments,s.installment_amount,s.financed_total,s.commission,s.commission_policy_version,s.pricing_policy_version,s.sold_at from public.v16_sale_snapshots s where s.sale_id=v_existing.sale_id;
    return;
  end if;
  if not exists(select 1 from public.clientes c where c.id=btrim(p_client_id)) then raise exception 'client_not_found'; end if;
  if v_role='advisor' and not public.v16_advisor_can_access_client(btrim(p_client_id)) then raise exception 'advisor_client_scope_denied'; end if;
  select * into v_quote from public.v16_authorized_sale_quotes q where q.quote_id=p_authorized_quote_id for update;
  if not found or v_quote.issued_by<>v_user or v_quote.used_at is not null or v_quote.expires_at<=v_sold then raise exception 'authorized_quote_invalid'; end if;
  select m.active_financing_mode into v_mode from public.v16_get_active_financing_mode() m;
  if v_mode<>v_quote.financing_mode then raise exception 'financing_mode_changed_requote_required'; end if;
  v_sale:='v16s_'||replace(gen_random_uuid()::text,'-','');
  insert into public.ventas(id,\"clienteId\",producto,\"precioVenta\",responsable,fecha,cuotas,pagadas,tipo,total,precio,archivada,\"montoCuota\")
  values(v_sale,btrim(p_client_id),v_quote.product_name,v_quote.cash_price,coalesce(v_advisor::text,v_user::text),v_sold::text,v_quote.installments,0,v_quote.payment_mode,v_quote.financed_total,v_quote.cash_price,false,v_quote.installment_amount);
  insert into public.v16_sale_snapshots values(v_sale,btrim(p_client_id),v_quote.canonical_product_id,v_quote.product_name,v_quote.product_model,v_advisor,v_quote.payment_mode,v_quote.financing_mode,v_quote.cash_price,v_quote.initial_payment,v_quote.installments,v_quote.installment_amount,v_quote.financed_total,v_quote.commission,v_quote.commission_policy_version,v_quote.pricing_policy_version,v_sold,v_user,btrim(p_source),btrim(p_idempotency_key),v_quote.quote_id,v_quote.commercial_snapshot,v_sold);
  if v_advisor is not null then
    insert into public.v16_advisor_commission_ledger(sale_id,advisor_id,cash_price,payment_mode,commission_total,payment_count,payment_schedule,policy_version,sale_equivalent,created_by)
    values(v_sale,v_advisor,v_quote.cash_price,v_quote.payment_mode,v_quote.commission,case when v_quote.payment_mode='CASH' then 1 else 2 end,
      jsonb_build_object('payments',case when v_quote.payment_mode='CASH' then jsonb_build_array(v_quote.commission) else jsonb_build_array(v_quote.commission/2,v_quote.commission/2) end),v_quote.commission_policy_version,case when v_quote.cash_price<50000 then 0.5 else 1 end,v_user);
  end if;
  update public.v16_authorized_sale_quotes set used_at=v_sold where quote_id=v_quote.quote_id;
  return query select s.sale_id,s.client_id,s.canonical_product_id,s.product_name,s.product_model,s.payment_mode,s.financing_mode,s.cash_price,s.initial_payment,s.installments,s.installment_amount,s.financed_total,s.commission,s.commission_policy_version,s.pricing_policy_version,s.sold_at from public.v16_sale_snapshots s where s.sale_id=v_sale;
end $$;

create or replace function public.v16_close_advisor_month(p_advisor_id uuid,p_period_month date,p_policy_version text)
returns table(close_id bigint,advisor_id uuid,period_month date,equivalent_sales numeric,base_bonus numeric,additional_bonus numeric,total_bonus numeric,policy_version text,closed_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare v_user uuid:=auth.uid(); v_role text:=public.v16_current_role(); v_existing public.v16_advisor_monthly_closes%rowtype; v_equiv numeric; v_base numeric; v_extra numeric; v_close public.v16_advisor_monthly_closes%rowtype;
begin
  if v_user is null then raise exception 'authentication_required'; end if;
  if v_role not in ('owner','admin') or not public.v16_has_capability('admin.access') then raise exception 'commission_close_not_authorized'; end if;
  if coalesce(auth.jwt()->>'aal','')<>'aal2' then raise exception 'step_up_required'; end if;
  if p_advisor_id is null or p_period_month<>date_trunc('month',p_period_month)::date or p_period_month>=date_trunc('month',current_date)::date then raise exception 'closed_month_required'; end if;
  select * into v_existing from public.v16_advisor_monthly_closes c where c.advisor_id=p_advisor_id and c.period_month=p_period_month;
  if found then return query select v_existing.close_id,v_existing.advisor_id,v_existing.period_month,v_existing.equivalent_sales,v_existing.base_bonus,v_existing.additional_bonus,v_existing.total_bonus,v_existing.policy_version,v_existing.closed_at; return; end if;
  select coalesce(sum(l.sale_equivalent),0) into v_equiv
  from public.v16_advisor_commission_ledger l
  join public.v16_sale_snapshots s on s.sale_id=l.sale_id
  join public.ventas v on v.id=s.sale_id
  where l.advisor_id=p_advisor_id and l.status='ACCRUED'
    and s.sold_at>=p_period_month and s.sold_at<(p_period_month+interval '1 month')
    and not coalesce(v.archivada,false)
    and upper(coalesce(v.estado,'CONFIRMADA')) not in ('CANCELADA','ANULADA','RECHAZADA');
  v_base:=case when v_equiv>=20 then 100000 when v_equiv>=15 then 65000 when v_equiv>=10 then 35000 when v_equiv>=5 then 10000 else 0 end;
  v_extra:=case when v_equiv>=21 then floor(v_equiv-20)*7500 else 0 end;
  insert into public.v16_advisor_monthly_closes(advisor_id,period_month,equivalent_sales,base_bonus,additional_bonus,total_bonus,policy_version,closed_by)
  values(p_advisor_id,p_period_month,v_equiv,v_base,v_extra,v_base+v_extra,p_policy_version,v_user) returning * into v_close;
  return query select v_close.close_id,v_close.advisor_id,v_close.period_month,v_close.equivalent_sales,v_close.base_bonus,v_close.additional_bonus,v_close.total_bonus,v_close.policy_version,v_close.closed_at;
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
  if p_rpc in ('v16_create_client','v16_set_active_financing_mode','v16_confirm_sale','v16_register_customer_payment','v16_reverse_customer_payment') then
    perform public.v16_core_claim_idempotency(p_rpc,p_args->>'p_idempotency_key',p_args);
  end if;
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
revoke execute on function public.v16_core_claim_idempotency(text,text,jsonb) from public,anon,authenticated;
revoke execute on function public.v16_financed_commission_for_cash_price(numeric) from public,anon,authenticated;
revoke execute on function public.v16_create_client(text,text,text,text,text,text,text,text,text,text) from public,anon,authenticated;
revoke execute on function public.v16_get_active_financing_mode() from public,anon,authenticated;
revoke execute on function public.v16_set_active_financing_mode(text,text,text,text) from public,anon,authenticated;
revoke execute on function public.v16_issue_authorized_sale_quote(text,text,text,text,text,numeric,numeric,integer,numeric,numeric,text,text,jsonb,uuid,timestamptz) from public,anon,authenticated;
revoke execute on function public.v16_confirm_sale(text,uuid,text,text) from public,anon,authenticated;
revoke execute on function public.v16_close_advisor_month(uuid,date,text) from public,anon,authenticated;
revoke execute on function public.v16_chatgpt_operational_bridge(text,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.v16_issue_authorized_sale_quote(text,text,text,text,text,numeric,numeric,integer,numeric,numeric,text,text,jsonb,uuid,timestamptz) to service_role;
grant execute on function public.v16_chatgpt_operational_bridge(text,text,jsonb,text) to service_role;

commit;
