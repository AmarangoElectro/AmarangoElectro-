-- USD reference pricing; legacy configured ARS amounts keep their currency.
alter table public.v16_subscription_plans
 add column price_currency text not null default 'USD' check(price_currency in ('USD','ARS')),
 add column usd_to_ars numeric(18,4) check(usd_to_ars>0 and usd_to_ars<=10000000),
 add column fx_updated_at timestamptz;
update public.v16_subscription_plans set price_currency='ARS'
 where id<>'tienda' and (monthly_price is not null or setup_price is not null or previous_price is not null or promo_price is not null or tool_values<>'[]'::jsonb);
alter table public.v16_subscriber_stores add column commercial_request jsonb;
-- Snapshot is server-generated. Service-only access, never included in the public storefront.
create function public.v16_plan_request_snapshot(p_plan text,p_business text,p_contact text,p_message text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare offer public.v16_subscription_plans; monthly numeric; setup numeric; ars numeric; setup_ars numeric;
begin
 select * into offer from public.v16_subscription_plans where id=p_plan for share;
 if not found then raise check_violation;end if;
 if length(coalesce(p_contact,''))>30 or coalesce(p_contact,'')!~'^\+?[0-9 ()-]*$' or length(coalesce(p_message,''))>1000 then raise check_violation;end if;
 monthly:=case when offer.promo_price is not null and (offer.promo_expires_at is null or offer.promo_expires_at>now()) then offer.promo_price else offer.monthly_price end;
 setup:=offer.setup_price;
 ars:=case when offer.price_currency='ARS' then monthly else round(monthly*offer.usd_to_ars,2) end;
 setup_ars:=case when offer.price_currency='ARS' then setup else round(setup*offer.usd_to_ars,2) end;
 if p_plan='tienda' then monthly:=0;setup:=0;ars:=0;setup_ars:=0;end if;
 return jsonb_build_object('id',gen_random_uuid(),'plan',p_plan,'business',p_business,'offer',to_jsonb(offer),'monthly',monthly,'setup',setup,'monthly_ars',ars,'setup_ars',setup_ars,'created_at',now(),'contact_phone',coalesce(p_contact,''),'message',coalesce(p_message,''),'status','pending_private');
end $$;
revoke all on function public.v16_plan_request_snapshot(text,text,text,text) from public,anon,authenticated;
grant execute on function public.v16_plan_request_snapshot(text,text,text,text) to service_role;
create or replace function public.v16_store_action(p_user_id text,p_email text,p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare s public.v16_subscriber_stores; p public.v16_store_products; c public.v16_store_customers; owner_access boolean; lim integer; result jsonb; v_id uuid; offer public.v16_subscription_plans;
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
  elsif p_action='owner_fx' then
   update public.v16_subscription_plans set usd_to_ars=(p_payload->>'usd_to_ars')::numeric,fx_updated_at=now();
  elsif p_action='owner_price' then
   update public.v16_subscription_plans set price_currency=case when p_payload ? 'price_currency' then p_payload->>'price_currency' else price_currency end,monthly_price=(p_payload->>'monthly_price')::numeric,setup_price=(p_payload->>'setup_price')::numeric,
    tool_values=case when p_payload ? 'tool_values' then p_payload->'tool_values' else tool_values end,
    previous_price=case when p_payload ? 'previous_price' then (p_payload->>'previous_price')::numeric else previous_price end,
    promo_price=case when p_payload ? 'promo_price' then (p_payload->>'promo_price')::numeric else promo_price end,
    promo_text=case when p_payload ? 'promo_text' then p_payload->>'promo_text' else promo_text end,
    promo_expires_at=case when p_payload ? 'promo_expires_at' then (p_payload->>'promo_expires_at')::timestamptz else promo_expires_at end,
    updated_at=now() where id=p_payload->>'id' and id<>'tienda';
   if not found then return jsonb_build_object('error','invalid');end if;
  else return jsonb_build_object('error','invalid');end if;
  insert into public.v16_subscription_audit(actor_site_user_id,action,payload) values(p_user_id,p_action,p_payload);
  return jsonb_build_object('ok',true);
 end if;
 if p_action='create' then
  if exists(select 1 from public.v16_subscriber_stores where owner_site_user_id=p_user_id)then return jsonb_build_object('error','exists');end if;
  if p_payload->>'consent'<>'true' or length(p_payload->>'name') not between 2 and 80 then return jsonb_build_object('error','invalid');end if;
  insert into public.v16_subscriber_stores(owner_site_user_id,owner_email,slug,name,requested_plan,plan,status,diagnosis)
   values(p_user_id,p_email,p_payload->>'slug',p_payload->>'name',p_payload->>'requested_plan','tienda',case when owner_access then 'active' else 'pending' end,p_payload->'diagnosis') returning * into s;
  update public.v16_subscriber_stores set commercial_request=public.v16_plan_request_snapshot(s.requested_plan,s.name,p_payload->>'contact_phone',p_payload->>'message') where id=s.id returning * into s;
  insert into public.v16_subscription_audit(actor_site_user_id,action,payload)values(p_user_id,'create',jsonb_build_object('store_id',s.id,'requested_plan',s.requested_plan,'commercial_request',s.commercial_request));
  return jsonb_build_object('ok',true,'store',to_jsonb(s));
 end if;
 -- Lock the store to serialize plan changes, product limits and all mutations.
 select * into s from public.v16_subscriber_stores where owner_site_user_id=p_user_id for update;
 if p_action='identity' then return jsonb_build_object('store',case when s.id is null then null else jsonb_build_object('id',s.id,'plan',s.plan,'status',s.status)end);end if;
 if p_action='workspace' then
  return jsonb_build_object('store',case when s.id is null then null else to_jsonb(s) end,
   'products',coalesce((select jsonb_agg(to_jsonb(t) order by t.name) from public.v16_store_products t where t.store_id=s.id),'[]'::jsonb),
   'customers',case when s.plan in ('gestion','premium') and s.status='active' then coalesce((select jsonb_agg(to_jsonb(t) order by t.name)from public.v16_store_customers t where t.store_id=s.id),'[]'::jsonb)else '[]'::jsonb end,
   'sales',case when s.plan in ('gestion','premium') and s.status='active' then coalesce((select jsonb_agg(to_jsonb(t) order by t.created_at desc)from public.v16_store_sales t where t.store_id=s.id),'[]'::jsonb)else '[]'::jsonb end,
   'usage',jsonb_build_object('customers',(select count(*)from public.v16_store_customers where store_id=s.id),'monthly_sales',(select count(*)from public.v16_store_sales where store_id=s.id and created_at>=now()-interval '30 days')),
   'plans',(select jsonb_agg(to_jsonb(t))from public.v16_subscription_plans t));
 end if;
 if s.id is null then return jsonb_build_object('error','not_found');end if;
 if p_action='request_plan' then
  select * into offer from public.v16_subscription_plans where id=p_payload->>'requested_plan' for share;
  if not found then return jsonb_build_object('error','invalid');end if;
  if p_payload ? 'offer_updated_at' and ((p_payload->>'offer_updated_at')::timestamptz is distinct from offer.updated_at or (p_payload->>'fx_updated_at')::timestamptz is distinct from offer.fx_updated_at) then return jsonb_build_object('error','price_changed');end if;
  update public.v16_subscriber_stores set requested_plan=p_payload->>'requested_plan',commercial_request=public.v16_plan_request_snapshot(p_payload->>'requested_plan',s.name,p_payload->>'contact_phone',p_payload->>'message') where id=s.id returning * into s;
  insert into public.v16_subscription_audit(actor_site_user_id,action,payload)values(p_user_id,p_action,jsonb_build_object('store_id',s.id,'requested_plan',s.requested_plan,'commercial_request',s.commercial_request));
  return jsonb_build_object('ok',true);
 end if;
 -- Personal recommendations never grant tools, alter plan or touch another workspace.
 if p_action='diagnosis' then
  update public.v16_subscriber_stores set diagnosis=p_payload->'diagnosis' where id=s.id;
  return jsonb_build_object('ok',true);
 elsif p_action='growth_interest' then
  if p_payload->>'need' not in ('financing','management','support') then return jsonb_build_object('error','invalid');end if;
  update public.v16_subscriber_stores set growth_interests=array(select distinct x from unnest(growth_interests || array[p_payload->>'need']) x) where id=s.id;
  return jsonb_build_object('ok',true);
 elsif p_action='dismiss_suggestion' then
  if p_payload->>'key' not in ('financing','management','support','volume') then return jsonb_build_object('error','invalid');end if;
  update public.v16_subscriber_stores set growth_dismissed=array(select distinct x from unnest(growth_dismissed || array[p_payload->>'key']) x) where id=s.id;
  return jsonb_build_object('ok',true);
 end if;
 if s.status<>'active'then return jsonb_build_object('error','inactive');end if;
 if p_action in ('customer','sale')and s.plan not in ('gestion','premium')then return jsonb_build_object('error','locked');end if;
 if p_action='financing'and s.plan not in ('cuotas','gestion','premium')then return jsonb_build_object('error','locked');end if;
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
  on conflict(id)do update set name=excluded.name,cash_price=excluded.cash_price,visible=excluded.visible,features=excluded.features,specifications=excluded.specifications,updated_at=now() where public.v16_store_products.store_id=excluded.store_id;
  if not found then return jsonb_build_object('error','forbidden');end if;
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
  insert into public.v16_store_customers(id,store_id,name,phone,notes)values(v_id,s.id,p_payload->>'name',p_payload->>'phone',p_payload->>'notes')on conflict(id)do update set name=excluded.name,phone=excluded.phone,notes=excluded.notes where public.v16_store_customers.store_id=excluded.store_id;
  if not found then return jsonb_build_object('error','forbidden');end if;
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
