-- Fixtures and changes are rolled back; staging only.
begin;
set local request.jwt.claims='{"role":"service_role"}';
set local role service_role;
do $$
declare s uuid; r jsonb; c uuid:=gen_random_uuid(); p uuid:=gen_random_uuid();
begin
 assert(select monthly_price=0 and setup_price=0 from public.v16_subscription_plans where id='tienda'),'base must be free';
 assert(select count(*)=3 from public.v16_subscription_plans where id in('cuotas','gestion','premium')and monthly_price is null and setup_price is null),'paid values must remain undefined';
 r:=public.v16_store_action('free-premium-test','customer@example.invalid','create','{"name":"Free Premium Test","slug":"free-premium-test","requested_plan":"premium","consent":true}');
 s:=(r->'store'->>'id')::uuid;assert s is not null,'Premium request not accepted';
 assert r->'store'->>'plan'='tienda'and r->'store'->>'status'='pending'and r->'store'->>'requested_plan'='premium','request unlocked Premium';
 assert public.v16_store_action('free-premium-test','customer@example.invalid','owner_store',jsonb_build_object('store_id',s,'plan','premium','status','active'))->>'error'='forbidden';
 assert public.v16_store_action('test-owner','Max.huracan73@gmail.com','owner_store',jsonb_build_object('store_id',s,'plan','tienda','status','active'))->>'ok'='true';
 assert public.v16_store_action('free-premium-test','customer@example.invalid','customer',jsonb_build_object('id',c,'name','Test Client','phone','','notes',''))->>'error'='locked','base unlocked CRM';
 assert public.v16_store_action('free-premium-test','customer@example.invalid','financing','{"financing":{"2":15,"4":55,"6":78}}')->>'error'='locked','base unlocked calculator';
 assert public.v16_store_action('test-owner','Max.huracan73@gmail.com','owner_price','{"id":"tienda","monthly_price":1000,"setup_price":0}')->>'error'='invalid','database allowed paid base';
 assert public.v16_store_action('test-owner','Max.huracan73@gmail.com','owner_store',jsonb_build_object('store_id',s,'plan','premium','status','active'))->>'ok'='true';
 assert public.v16_store_action('free-premium-test','customer@example.invalid','financing','{"financing":{"2":15,"4":55,"6":78}}')->>'ok'='true','Premium calculator was blocked';
 assert public.v16_store_action('free-premium-test','customer@example.invalid','customer',jsonb_build_object('id',c,'name','Test Client','phone','','notes',''))->>'ok'='true','Premium CRM was blocked';
 assert public.v16_store_action('free-premium-test','customer@example.invalid','product',jsonb_build_object('id',p,'name','Test Product','cash_price',1000,'visible',true,'features','[]'::jsonb,'specifications','{}'::jsonb))->>'ok'='true';
 assert public.v16_store_action('free-premium-test','customer@example.invalid','sale',jsonb_build_object('id',gen_random_uuid(),'customer_id',c,'product_id',p))->>'ok'='true';
 r:=public.v16_store_action('free-premium-test','customer@example.invalid','workspace');assert jsonb_array_length(r->'customers')=1 and jsonb_array_length(r->'sales')=1,'Premium workspace missing permitted data';
 assert public.v16_store_action('free-premium-test','customer@example.invalid','brand','{"name":"Free Premium Test","primary_color":"#123456","accent_color":"#ff7920","whatsapp":"","published":true}')->>'ok'='true';
 r:=public.v16_public_store('free-premium-test');assert r->'store'->'financing'->>'2'='15','Premium public calculation missing';assert not(r ? 'customers')and not(r ? 'sales'),'Premium public leak';
 assert public.v16_store_action('test-owner','Max.huracan73@gmail.com','owner_price','{"id":"premium","monthly_price":null,"setup_price":null}')->>'ok'='true','owner could not keep prices undefined';
 r:=public.v16_store_action('test-owner-signup','Max.huracan73@gmail.com','create','{"name":"Owner Test","slug":"owner-free-test","requested_plan":"premium","consent":true}');assert r->'store'->>'plan'='tienda','owner signup skipped free base';
end $$;
rollback;
select 'PASS: base free, paid values undefined, Premium approval and inherited tools, isolated public projection' as result;
