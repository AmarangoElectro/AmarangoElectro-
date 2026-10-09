create or replace function public.v16_commission_visibility_read(p_email text,p_period text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.v16_user_access%rowtype; internal boolean; start_date date; rows jsonb; best jsonb;
begin
 if coalesce(auth.jwt()->>'role','')<>'service_role' then raise exception 'service_role_required'; end if;
 select x.* into a from public.v16_user_access x join auth.users u on u.id=x.user_id where x.active and lower(u.email)=lower(btrim(p_email));
 internal:=coalesce(a.role in ('owner','admin') and ('*'=any(a.capabilities) or 'admin.access'=any(a.capabilities)),false);
 if not internal and not coalesce(a.role='asesor' and a.advisor_id is not null and ('*'=any(a.capabilities) or 'advisors.access'=any(a.capabilities)),false) then raise exception 'commission_not_authorized'; end if;
 if p_period is not null and p_period !~ '^20[0-9]{2}-(0[1-9]|1[0-2])$' then raise exception 'invalid_period'; end if;
 start_date:=case when p_period is null then date_trunc('month',now() at time zone 'America/Argentina/Buenos_Aires')::date else (p_period||'-01')::date end;
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
 return jsonb_build_object('role',a.role,'advisorId',a.advisor_id,'advisorName',coalesce((select nombre from public.asesores_ventas where id=a.advisor_id),'Tu mes'),'period',to_char(start_date,'YYYY-MM'),'cap',null,'revision',0,'version','2026-10-09-preview','policyActive',false,'operations',rows,'salesCounts',best,'updatedAt',now());
end $$;

revoke all on function public.v16_commission_visibility_read(text,text) from public,anon,authenticated;
grant execute on function public.v16_commission_visibility_read(text,text) to service_role;
