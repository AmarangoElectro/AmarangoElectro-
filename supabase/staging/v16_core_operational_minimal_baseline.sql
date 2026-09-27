-- STAGING HARNESS ONLY.
-- Reproduces the minimum structural dependencies required to compile/test
-- 20260927_v16_core_operational_prepared.sql without copying production data.
--
-- IMPORTANT:
-- - Not a production migration.
-- - Does not contain customer/sale/auth data.
-- - Intended for Supabase development branches only.

begin;

create extension if not exists pgcrypto;

create table if not exists public.clientes (
  id text primary key,
  nombre text,
  telefono text,
  localidad text,
  direccion text,
  observaciones text,
  alta text,
  dni text,
  telefono2 text,
  revendedor text,
  inversionista text,
  num integer,
  responsable text,
  comprobantes jsonb,
  "pagoAuto" text
);

create table if not exists public.ventas (
  id text primary key,
  "clienteId" text,
  producto text,
  "precioCosto" numeric,
  "precioVenta" numeric,
  envio numeric,
  responsable text,
  fecha text,
  cuotas integer,
  pagadas integer,
  inversionista text,
  revendedor text,
  porcentaje numeric,
  tipo text,
  items jsonb,
  monto_invertido numeric,
  plan text,
  total numeric,
  precio numeric,
  ganancia numeric,
  descuento boolean,
  cliente_id text,
  estado text,
  "montoInvertido" numeric,
  archivada boolean default false,
  inversionista2 text,
  pct1 numeric,
  pct2 numeric,
  mayorista text,
  "montoCuota" numeric,
  inversores jsonb,
  quincenal boolean default false,
  "venceManual" text,
  "pagoInv" jsonb,
  "pagoRev" numeric,
  abonos jsonb
);

create table if not exists public.auditoria (
  aid text primary key,
  quien text,
  accion text,
  tipo text,
  detalle text,
  ts bigint
);

create table if not exists public.asesores_ventas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(nombre) between 2 and 80),
  telefono text not null unique check (telefono ~ '^[0-9]{7,15}$'),
  email text,
  localidad text,
  codigo_hash text not null,
  activo boolean not null default true,
  creado_at timestamptz not null default now(),
  actualizado_at timestamptz not null default now(),
  ultimo_ingreso_at timestamptz,
  ultima_actividad_at timestamptz,
  total_ingresos bigint not null default 0,
  total_consultas bigint not null default 0,
  total_productos_vistos bigint not null default 0,
  total_compartidos bigint not null default 0
);

create sequence if not exists public.tienda_productos_version_seq;

create table if not exists public.tienda_productos_incremental (
  producto_id text primary key,
  datos jsonb not null default '{}'::jsonb,
  eliminado boolean not null default false,
  version bigint not null default nextval('public.tienda_productos_version_seq'::regclass),
  actualizado timestamptz not null default now()
);

create table if not exists public.v16_canonical_product_identity (
  canonical_product_id bigint generated always as identity primary key,
  canonical_product_key text generated always as ('v16-cell:'::text || canonical_product_id::text) stored unique,
  legacy_key text not null unique,
  entity_type text not null,
  cohort text not null,
  status text not null default 'reserved' check (status in ('reserved','materialized','retired')),
  source text not null,
  created_at timestamptz not null default now(),
  created_by text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.v16_user_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('cliente','asesor','admin','owner')),
  active boolean not null default true,
  client_id text references public.clientes(id) on update cascade on delete set null,
  advisor_id uuid references public.asesores_ventas(id) on update cascade on delete set null,
  capabilities text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  constraint v16_user_access_role_binding_check
    check ((role <> 'cliente' or client_id is not null) and (role <> 'asesor' or advisor_id is not null))
);

create table if not exists public.v16_advisor_client_portfolio (
  assignment_id bigint generated always as identity primary key,
  advisor_id uuid not null references public.asesores_ventas(id) on delete restrict,
  client_id text not null references public.clientes(id) on delete restrict,
  active boolean not null default true,
  assigned_at timestamptz not null default now(),
  ended_at timestamptz,
  assigned_by uuid not null references auth.users(id),
  ended_by uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb,
  check ((active and ended_at is null and ended_by is null) or ((not active) and ended_at is not null))
);

create table if not exists public.v16_cash_movements (
  movement_id bigint generated always as identity primary key,
  occurred_at timestamptz not null,
  movement_type text not null,
  direction text not null check (direction in ('IN','OUT')),
  amount numeric not null check (amount>0),
  sale_id text,
  client_id text,
  source_reference text,
  reverses_movement_id bigint references public.v16_cash_movements(movement_id),
  note text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  idempotency_key text
);

create table if not exists public.v16_payment_events (
  payment_id bigint generated always as identity primary key,
  sale_id text not null,
  client_id text,
  installment_number integer not null check (installment_number>0),
  payment_kind text not null default 'PAYMENT' check (payment_kind in ('PAYMENT','REVERSAL')),
  contractual_amount numeric,
  adjustment_amount numeric not null default 0,
  adjustment_reason text,
  amount_received numeric not null check (amount_received>0),
  amount_source text not null check (amount_source in ('SOURCE_CERTIFIED','MANUAL_CONFIRMED')),
  paid_at timestamptz not null,
  payment_method text,
  payment_reference text,
  idempotency_key text,
  reverses_payment_id bigint references public.v16_payment_events(payment_id),
  cash_movement_id bigint references public.v16_cash_movements(movement_id),
  note text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.v16_deliveries (
  delivery_id bigint generated always as identity primary key,
  sale_id text not null,
  client_id text,
  status text not null default 'PENDIENTE' check (status in ('PENDIENTE','COORDINADA','EN_CAMINO','ENTREGADA','CANCELADA')),
  scheduled_at timestamptz,
  delivered_at timestamptz,
  address_snapshot text,
  notes text,
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

alter table public.clientes enable row level security;
alter table public.ventas enable row level security;
alter table public.auditoria enable row level security;
alter table public.asesores_ventas enable row level security;
alter table public.tienda_productos_incremental enable row level security;
alter table public.v16_canonical_product_identity enable row level security;
alter table public.v16_user_access enable row level security;
alter table public.v16_advisor_client_portfolio enable row level security;
alter table public.v16_cash_movements enable row level security;
alter table public.v16_payment_events enable row level security;
alter table public.v16_deliveries enable row level security;

revoke all on public.clientes,public.ventas,public.auditoria,public.asesores_ventas,
  public.v16_canonical_product_identity,public.v16_advisor_client_portfolio,
  public.v16_cash_movements,public.v16_payment_events,public.v16_deliveries
from anon,authenticated;

grant select on public.tienda_productos_incremental to anon,authenticated;

create or replace function public.v16_current_role()
returns text language sql stable security definer set search_path='public','pg_temp' as $$
  select a.role from public.v16_user_access a where a.user_id=auth.uid() and a.active=true limit 1
$$;

create or replace function public.v16_current_client_id()
returns text language sql stable security definer set search_path='public','pg_temp' as $$
  select a.client_id from public.v16_user_access a where a.user_id=auth.uid() and a.active=true limit 1
$$;

create or replace function public.v16_current_advisor_id()
returns uuid language sql stable security definer set search_path='public','pg_temp' as $$
  select a.advisor_id from public.v16_user_access a where a.user_id=auth.uid() and a.active=true limit 1
$$;

create or replace function public.v16_has_capability(required_capability text)
returns boolean language sql stable security definer set search_path='public','pg_temp' as $$
  select coalesce(exists(
    select 1 from public.v16_user_access a
    where a.user_id=auth.uid() and a.active=true
      and (required_capability=any(a.capabilities) or '*'=any(a.capabilities))
  ),false)
$$;

create or replace function public.v16_advisor_can_access_client(p_client_id text)
returns boolean language sql stable security definer set search_path='public','pg_temp' as $$
  select exists(
    select 1
    from public.v16_user_access ua
    join public.asesores_ventas a on a.id=ua.advisor_id and a.activo=true
    join public.v16_advisor_client_portfolio p on p.advisor_id=ua.advisor_id and p.client_id=p_client_id and p.active=true
    where ua.user_id=auth.uid() and ua.active=true and ua.role='asesor'
  )
$$;

revoke execute on function public.v16_current_role() from public,anon,authenticated;
revoke execute on function public.v16_current_client_id() from public,anon,authenticated;
revoke execute on function public.v16_current_advisor_id() from public,anon,authenticated;
revoke execute on function public.v16_has_capability(text) from public,anon,authenticated;
revoke execute on function public.v16_advisor_can_access_client(text) from public,anon,authenticated;

commit;


-- Canonical payment register RPC required by the V16 staging E2E.
-- Matches the production signature expected by Work.
create or replace function public.v16_register_customer_payment(
  p_sale_id text,
  p_amount_received numeric,
  p_paid_at timestamptz default now(),
  p_payment_method text default null,
  p_payment_reference text default null,
  p_idempotency_key text default null,
  p_adjustment_amount numeric default 0,
  p_adjustment_reason text default null,
  p_note text default null
)
returns table(
  payment_id bigint,
  cash_movement_id bigint,
  sale_id text,
  client_id text,
  installment_number integer,
  installments_paid integer,
  installments_total integer,
  amount_received numeric,
  amount_source text,
  paid_at timestamptz
)
language plpgsql
security definer
set search_path='public','pg_temp'
as $$
declare
  v_role text;
  v_user_id uuid;
  v_sale public.ventas%rowtype;
  v_contractual_amount numeric;
  v_amount_source text;
  v_installment_number integer;
  v_cash_id bigint;
  v_payment_id bigint;
  v_existing public.v16_payment_events%rowtype;
  v_adjustment numeric := coalesce(p_adjustment_amount,0);
begin
  v_user_id := auth.uid();
  v_role := public.v16_current_role();

  if v_user_id is null then raise exception 'authentication_required'; end if;
  if v_role not in ('owner','admin')
     or not public.v16_has_capability('collections.write')
     or not public.v16_has_capability('cash.manage')
  then raise exception 'payment_register_not_authorized'; end if;

  if nullif(btrim(coalesce(p_sale_id,'')),'') is null then raise exception 'sale_id_required'; end if;
  if p_amount_received is null or p_amount_received <= 0 then raise exception 'amount_received_must_be_positive'; end if;
  if p_paid_at is null then raise exception 'paid_at_required'; end if;
  if v_adjustment <> 0 and nullif(btrim(coalesce(p_adjustment_reason,'')),'') is null then
    raise exception 'adjustment_reason_required';
  end if;

  if nullif(btrim(coalesce(p_idempotency_key,'')),'') is not null then
    select * into v_existing
    from public.v16_payment_events pe
    where pe.idempotency_key=btrim(p_idempotency_key)
    limit 1;

    if found then
      if v_existing.payment_kind<>'PAYMENT'
         or v_existing.sale_id<>p_sale_id
         or v_existing.amount_received<>p_amount_received
      then raise exception 'idempotency_key_conflict'; end if;

      select v_existing.payment_id,
             v_existing.cash_movement_id,
             v_existing.sale_id,
             v_existing.client_id,
             v_existing.installment_number,
             s.pagadas,
             s.cuotas,
             v_existing.amount_received,
             v_existing.amount_source,
             v_existing.paid_at
      into payment_id,cash_movement_id,sale_id,client_id,installment_number,
           installments_paid,installments_total,amount_received,amount_source,paid_at
      from public.ventas s
      where s.id=v_existing.sale_id;

      return next;
      return;
    end if;
  end if;

  if nullif(btrim(coalesce(p_payment_reference,'')),'') is not null
     and exists(
       select 1 from public.v16_payment_events pe
       where pe.payment_reference=btrim(p_payment_reference)
     )
  then raise exception 'payment_reference_already_registered'; end if;

  select * into v_sale
  from public.ventas v
  where v.id=p_sale_id
  for update;

  if not found then raise exception 'sale_not_found'; end if;
  if coalesce(v_sale.archivada,false) then raise exception 'sale_archived'; end if;

  if v_sale.cuotas is null or v_sale.cuotas<=0
     or v_sale.pagadas is null or v_sale.pagadas<0
     or v_sale.pagadas>v_sale.cuotas
  then raise exception 'sale_installment_state_invalid'; end if;

  if v_sale.pagadas>=v_sale.cuotas then raise exception 'sale_already_complete'; end if;

  v_installment_number:=v_sale.pagadas+1;

  if v_sale."montoCuota" is not null and v_sale."montoCuota">0 then
    v_contractual_amount:=v_sale."montoCuota";
    v_amount_source:='SOURCE_CERTIFIED';
    if p_amount_received<>v_contractual_amount+v_adjustment then
      raise exception 'amount_does_not_match_contractual_plus_adjustment';
    end if;
  else
    v_contractual_amount:=null;
    v_amount_source:='MANUAL_CONFIRMED';
    if v_adjustment<>0 then raise exception 'adjustment_requires_contractual_amount'; end if;
  end if;

  insert into public.v16_cash_movements(
    occurred_at,movement_type,direction,amount,sale_id,client_id,source_reference,note,created_by,metadata
  ) values(
    p_paid_at,'CUSTOMER_PAYMENT','IN',p_amount_received,v_sale.id,v_sale."clienteId",
    coalesce(
      nullif(btrim(coalesce(p_payment_reference,'')),''),
      nullif(btrim(coalesce(p_idempotency_key,'')),''),
      'sale:'||v_sale.id||':installment:'||v_installment_number::text
    ),
    p_note,v_user_id,
    jsonb_build_object('source','v16_register_customer_payment','installment_number',v_installment_number)
  )
  returning movement_id into v_cash_id;

  insert into public.v16_payment_events(
    sale_id,client_id,installment_number,payment_kind,contractual_amount,adjustment_amount,
    adjustment_reason,amount_received,amount_source,paid_at,payment_method,payment_reference,
    idempotency_key,cash_movement_id,note,created_by,metadata
  ) values(
    v_sale.id,v_sale."clienteId",v_installment_number,'PAYMENT',
    v_contractual_amount,v_adjustment,
    nullif(btrim(coalesce(p_adjustment_reason,'')),''),
    p_amount_received,v_amount_source,p_paid_at,
    nullif(btrim(coalesce(p_payment_method,'')),''),
    nullif(btrim(coalesce(p_payment_reference,'')),''),
    nullif(btrim(coalesce(p_idempotency_key,'')),''),
    v_cash_id,p_note,v_user_id,
    jsonb_build_object('source','v16_register_customer_payment')
  )
  returning public.v16_payment_events.payment_id into v_payment_id;

  update public.ventas
  set pagadas=pagadas+1
  where id=v_sale.id and pagadas=v_sale.pagadas;

  if not found then raise exception 'sale_payment_counter_concurrent_change'; end if;

  insert into public.auditoria(aid,quien,accion,tipo,detalle,ts)
  values(
    'v16-payment:'||v_payment_id::text,
    v_user_id::text,
    'registró',
    'pago_v16',
    jsonb_build_object(
      'payment_id',v_payment_id,
      'cash_movement_id',v_cash_id,
      'sale_id',v_sale.id,
      'installment_number',v_installment_number,
      'amount_received',p_amount_received,
      'amount_source',v_amount_source
    )::text,
    floor(extract(epoch from clock_timestamp())*1000)::bigint
  );

  payment_id:=v_payment_id;
  cash_movement_id:=v_cash_id;
  sale_id:=v_sale.id;
  client_id:=v_sale."clienteId";
  installment_number:=v_installment_number;
  installments_paid:=v_sale.pagadas+1;
  installments_total:=v_sale.cuotas;
  amount_received:=p_amount_received;
  amount_source:=v_amount_source;
  paid_at:=p_paid_at;
  return next;
end;
$$;

revoke execute on function public.v16_register_customer_payment(
  text,numeric,timestamptz,text,text,text,numeric,text,text
) from public,anon;

grant execute on function public.v16_register_customer_payment(
  text,numeric,timestamptz,text,text,text,numeric,text,text
) to authenticated,service_role;
