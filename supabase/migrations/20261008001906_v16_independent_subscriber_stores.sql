create table public.v16_subscription_plans (
 id text primary key check (id in ('tienda','cuotas','gestion')),
 monthly_price numeric(14,2) check (monthly_price>=0), setup_price numeric(14,2) check (setup_price>=0), updated_at timestamptz not null default now()
);
insert into public.v16_subscription_plans(id) values ('tienda'),('cuotas'),('gestion');
create table public.v16_subscriber_stores (
 id uuid primary key default gen_random_uuid(), owner_site_user_id text not null unique, owner_email text not null,
 slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{2,49}$'), name text not null,
 plan text not null default 'tienda' references public.v16_subscription_plans(id), requested_plan text not null references public.v16_subscription_plans(id),
 status text not null default 'pending' check (status in ('pending','active','paused')),
 primary_color text not null default '#123b6d' check (primary_color ~ '^#[0-9a-fA-F]{6}$'), accent_color text not null default '#ff7920' check (accent_color ~ '^#[0-9a-fA-F]{6}$'),
 logo_asset_id uuid, whatsapp text not null default '', published boolean not null default false,
 financing jsonb not null default '{}'::jsonb check (jsonb_typeof(financing)='object'), consented_at timestamptz not null default now(), created_at timestamptz not null default now()
);
create table public.v16_store_products (
 id uuid primary key, store_id uuid not null references public.v16_subscriber_stores(id), name text not null,
 cash_price numeric(14,2) not null check (cash_price>0 and cash_price<=100000000), visible boolean not null default true,
 asset_id uuid, source_asset_id uuid, features jsonb not null default '[]'::jsonb check (jsonb_typeof(features)='array'),
 specifications jsonb not null default '{}'::jsonb check (jsonb_typeof(specifications)='object'), updated_at timestamptz not null default now(), unique (store_id,id)
);
create table public.v16_store_customers (
 id uuid primary key, store_id uuid not null references public.v16_subscriber_stores(id), name text not null, phone text not null default '', notes text not null default '', created_at timestamptz not null default now(), unique(store_id,id)
);
create table public.v16_store_sales (
 id uuid primary key, store_id uuid not null references public.v16_subscriber_stores(id), customer_id uuid not null, product_id uuid not null,
 snapshot jsonb not null, total numeric(14,2) not null check (total>0), created_at timestamptz not null default now(),
 foreign key(store_id,customer_id) references public.v16_store_customers(store_id,id), foreign key(store_id,product_id) references public.v16_store_products(store_id,id)
);
create index on public.v16_store_sales(store_id,created_at desc);
create table public.v16_subscription_audit (
 id bigint generated always as identity primary key, actor_site_user_id text not null, action text not null, payload jsonb not null, created_at timestamptz not null default now()
);
alter table public.v16_subscription_plans enable row level security;
alter table public.v16_subscriber_stores enable row level security;
alter table public.v16_store_products enable row level security;
alter table public.v16_store_customers enable row level security;
alter table public.v16_store_sales enable row level security;
alter table public.v16_subscription_audit enable row level security;
revoke all on public.v16_subscription_plans,public.v16_subscriber_stores,public.v16_store_products,public.v16_store_customers,public.v16_store_sales,public.v16_subscription_audit from public,anon,authenticated;
grant select,insert,update on public.v16_subscription_plans,public.v16_subscriber_stores,public.v16_store_products,public.v16_store_customers to service_role;
grant select,insert on public.v16_store_sales,public.v16_subscription_audit to service_role;
grant usage,select on sequence public.v16_subscription_audit_id_seq to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('v16-store-assets','v16-store-assets',false,2097152,array['image/jpeg']) on conflict(id) do nothing;

-- Trusted Sites identity is passed exclusively by the server. Browser roles cannot execute this function or touch these tables.
create function public.v16_store_action(p_user_id text,p_email text,p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare s public.v16_subscriber_stores; p public.v16_store_products; c public.v16_store_customers; owner_access boolean; lim integer; result jsonb; v_id uuid;
begin
 if p_user_id is null or length(p_user_id)<1 or p_email is null then return jsonb_build_object('error','forbidden');end if;
 if p_action like 'owner_%' or p_action='create' then
   owner_access:=coalesce((public.v16_chatgpt_space_access(p_email)->>'owner')::boolean,false);
 end if;
 if p_action like 'owner_%' then
  if not owner_access then return jsonb_build_object('error','forbidden');end if;
  if p_action='owner_list' then return jsonb_build_object('stores',coalesce((select jsonb_agg(to_jsonb(t)) from (select * from public.v16_subscriber_stores order by created_at desc limit 500)t),'[]'::jsonb),'plans',(select jsonb_agg(to_jsonb(t)) from public.v16_subscription_plans t));end if;
  if p_action='owner_store' then
   update public.v16_subscriber_stores set plan=p_payload->>'plan',status=p_payload->>'status' where id=(p_payload->>'store_id')::uuid returning * into s;
   if not found then return jsonb_build_object('error','not_found');end if;
  elsif p_action='owner_price' then
   update public.v16_subscription_plans set monthly_price=(p_payload->>'monthly_price')::numeric,setup_price=(p_payload->>'setup_price')::numeric,updated_at=now() where id=p_payload->>'id';
  else return jsonb_build_object('error','invalid');end if;
  insert into public.v16_subscription_audit(actor_site_user_id,action,payload) values(p_user_id,p_action,p_payload);
  return jsonb_build_object('ok',true);
 end if;
 if p_action='create' then
  if exists(select 1 from public.v16_subscriber_stores where owner_site_user_id=p_user_id)then return jsonb_build_object('error','exists');end if;
  if p_payload->>'consent'<>'true' or length(p_payload->>'name') not between 2 and 80 then return jsonb_build_object('error','invalid');end if;
  insert into public.v16_subscriber_stores(owner_site_user_id,owner_email,slug,name,requested_plan,plan,status)
   values(p_user_id,p_email,p_payload->>'slug',p_payload->>'name',p_payload->>'requested_plan',case when owner_access then p_payload->>'requested_plan' else 'tienda' end,case when owner_access then 'active' else 'pending' end) returning * into s;
  insert into public.v16_subscription_audit(actor_site_user_id,action,payload)values(p_user_id,'create',jsonb_build_object('store_id',s.id,'requested_plan',s.requested_plan));
  return jsonb_build_object('ok',true,'store',to_jsonb(s));
 end if;
 -- Lock the store to serialize plan changes, product limits and all mutations.
 select * into s from public.v16_subscriber_stores where owner_site_user_id=p_user_id for update;
 if p_action='workspace' then
  return jsonb_build_object('store',case when s.id is null then null else to_jsonb(s) end,
   'products',coalesce((select jsonb_agg(to_jsonb(t) order by t.name) from public.v16_store_products t where t.store_id=s.id),'[]'::jsonb),
   'customers',case when s.plan='gestion' and s.status='active' then coalesce((select jsonb_agg(to_jsonb(t) order by t.name)from public.v16_store_customers t where t.store_id=s.id),'[]'::jsonb)else '[]'::jsonb end,
   'sales',case when s.plan='gestion' and s.status='active' then coalesce((select jsonb_agg(to_jsonb(t) order by t.created_at desc)from public.v16_store_sales t where t.store_id=s.id),'[]'::jsonb)else '[]'::jsonb end,
   'plans',(select jsonb_agg(to_jsonb(t))from public.v16_subscription_plans t));
 end if;
 if s.id is null then return jsonb_build_object('error','not_found');end if;
 if p_action='request_plan' then
  update public.v16_subscriber_stores set requested_plan=p_payload->>'requested_plan'where id=s.id;
  insert into public.v16_subscription_audit(actor_site_user_id,action,payload)values(p_user_id,p_action,jsonb_build_object('store_id',s.id,'requested_plan',p_payload->>'requested_plan'));
  return jsonb_build_object('ok',true);
 end if;
 if s.status<>'active'then return jsonb_build_object('error','inactive');end if;
 if p_action in ('customer','sale')and s.plan<>'gestion'then return jsonb_build_object('error','locked');end if;
 if p_action='financing'and s.plan not in ('cuotas','gestion')then return jsonb_build_object('error','locked');end if;
 if p_action='brand' then
  update public.v16_subscriber_stores set name=p_payload->>'name',primary_color=p_payload->>'primary_color',accent_color=p_payload->>'accent_color',whatsapp=p_payload->>'whatsapp',published=(p_payload->>'published')::boolean where id=s.id;
 elsif p_action='financing' then
  if jsonb_typeof(p_payload->'financing')<>'object'then return jsonb_build_object('error','invalid');end if;
  update public.v16_subscriber_stores set financing=p_payload->'financing'where id=s.id;
 elsif p_action='product' then
  v_id:=(p_payload->>'id')::uuid;
  if exists(select 1 from public.v16_store_products where id=v_id and store_id<>s.id)then return jsonb_build_object('error','forbidden');end if;
  lim:=case s.plan when 'tienda'then 50 when 'cuotas'then 250 else 1000 end;
  if not exists(select 1 from public.v16_store_products where id=v_id)and(select count(*)from public.v16_store_products where store_id=s.id)>=lim then return jsonb_build_object('error','limit');end if;
  insert into public.v16_store_products(id,store_id,name,cash_price,visible,features,specifications)values(v_id,s.id,p_payload->>'name',(p_payload->>'cash_price')::numeric,(p_payload->>'visible')::boolean,p_payload->'features',p_payload->'specifications')
  on conflict(id)do update set name=excluded.name,cash_price=excluded.cash_price,visible=excluded.visible,features=excluded.features,specifications=excluded.specifications,updated_at=now();
 elsif p_action='asset' then
  if p_payload->>'reviewed'<>'true'then return jsonb_build_object('error','invalid');end if;
  if p_payload->>'kind'='logo'then update public.v16_subscriber_stores set logo_asset_id=(p_payload->>'asset_id')::uuid where id=s.id;
  elsif p_payload->>'kind'='product'then
   update public.v16_store_products set asset_id=(p_payload->>'asset_id')::uuid,source_asset_id=(p_payload->>'source_asset_id')::uuid,
    features=coalesce(p_payload->'features',features),specifications=coalesce(p_payload->'specifications',specifications),updated_at=now() where store_id=s.id and id=(p_payload->>'product_id')::uuid;
   if not found then return jsonb_build_object('error','not_found');end if;
  else return jsonb_build_object('error','invalid');end if;
 elsif p_action='customer'then
  v_id:=(p_payload->>'id')::uuid;
  if exists(select 1 from public.v16_store_customers where id=v_id and store_id<>s.id)then return jsonb_build_object('error','forbidden');end if;
  insert into public.v16_store_customers(id,store_id,name,phone,notes)values(v_id,s.id,p_payload->>'name',p_payload->>'phone',p_payload->>'notes')on conflict(id)do update set name=excluded.name,phone=excluded.phone,notes=excluded.notes;
 elsif p_action='sale'then
  select * into p from public.v16_store_products where store_id=s.id and id=(p_payload->>'product_id')::uuid;
  select * into c from public.v16_store_customers where store_id=s.id and id=(p_payload->>'customer_id')::uuid;
  if p.id is null or c.id is null then return jsonb_build_object('error','not_found');end if;
  v_id:=(p_payload->>'id')::uuid;
  if exists(select 1 from public.v16_store_sales where id=v_id and(store_id<>s.id or customer_id<>c.id or product_id<>p.id))then return jsonb_build_object('error','forbidden');end if;
  insert into public.v16_store_sales(id,store_id,customer_id,product_id,snapshot,total)values(v_id,s.id,c.id,p.id,jsonb_build_object('customer',c.name,'product',p.name,'payment','contado'),p.cash_price)on conflict(id)do nothing;
 else return jsonb_build_object('error','invalid');end if;
 return jsonb_build_object('ok',true);
exception when unique_violation then return jsonb_build_object('error','slug_taken');
 when check_violation or foreign_key_violation or invalid_text_representation or not_null_violation then return jsonb_build_object('error','invalid');
end;
$$;
revoke all on function public.v16_store_action(text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.v16_store_action(text,text,text,jsonb) to service_role;
create function public.v16_public_store(p_slug text)returns jsonb language sql security invoker set search_path='' as $$
 select jsonb_build_object('store',jsonb_build_object('id',s.id,'name',s.name,'slug',s.slug,'primary_color',s.primary_color,'accent_color',s.accent_color,'logo_asset_id',s.logo_asset_id,'whatsapp',s.whatsapp,'plan',s.plan,'financing',case when s.plan in('cuotas','gestion')then s.financing else '{}'::jsonb end),
 'products',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'cash_price',p.cash_price,'asset_id',p.asset_id,'features',p.features,'specifications',p.specifications)order by p.name)from public.v16_store_products p where p.store_id=s.id and p.visible),'[]'::jsonb))
 from public.v16_subscriber_stores s where s.slug=p_slug and s.status='active'and s.published;
$$;
create function public.v16_public_store_asset(p_store_id uuid,p_asset_id uuid)returns boolean language sql security invoker set search_path='' as $$
 select exists(select 1 from public.v16_subscriber_stores s where s.id=p_store_id and s.status='active'and s.published and(s.logo_asset_id=p_asset_id or exists(select 1 from public.v16_store_products p where p.store_id=s.id and p.visible and p.asset_id=p_asset_id)));
$$;
revoke all on function public.v16_public_store(text),public.v16_public_store_asset(uuid,uuid)from public,anon,authenticated;
grant execute on function public.v16_public_store(text),public.v16_public_store_asset(uuid,uuid)to service_role;
