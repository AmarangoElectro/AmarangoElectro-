-- Only the isolated V16 staging project receives this migration.
create or replace function public.v16_chatgpt_space_access(p_email text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare a public.v16_user_access%rowtype;
begin
  if coalesce(auth.jwt()->>'role','') <> 'service_role' then raise exception 'service_role_required'; end if;
  select x.* into a from public.v16_user_access x join auth.users u on u.id=x.user_id
  where x.active and lower(u.email)=lower(btrim(p_email));
  return jsonb_build_object('role',a.role,
    'owner',coalesce(a.role='owner',false),
    'admin',coalesce(a.role in ('owner','admin') and ('*'=any(a.capabilities) or 'admin.access'=any(a.capabilities)),false),
    'advisor',coalesce(a.role in ('owner','admin') or (a.role='asesor' and a.advisor_id is not null and ('*'=any(a.capabilities) or 'advisors.access'=any(a.capabilities))),false));
end; $$;
revoke all on function public.v16_chatgpt_space_access(text) from public,anon,authenticated;
grant execute on function public.v16_chatgpt_space_access(text) to service_role;

create table public.v16_newsletter_subscriptions (
  site_user_id text primary key, email text not null,
  active boolean not null default false, consented_at timestamptz,
  updated_at timestamptz not null default now(),
  check (not active or consented_at is not null)
);
alter table public.v16_newsletter_subscriptions enable row level security;
revoke all on public.v16_newsletter_subscriptions from public,anon,authenticated;
grant select,insert,update on public.v16_newsletter_subscriptions to service_role;

create table public.v16_product_media (
  product_id text primary key, asset_id uuid not null unique,
  features jsonb not null default '[]', specifications jsonb not null default '{}',
  source_text text not null default '', style text not null check(style in ('original','amarango')),
  reviewed_by text not null, updated_at timestamptz not null default now(),
  check(jsonb_typeof(features)='array' and jsonb_typeof(specifications)='object')
);
alter table public.v16_product_media enable row level security;
revoke all on public.v16_product_media from public,anon,authenticated;
grant select,insert,update on public.v16_product_media to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('v16-product-photos','v16-product-photos',false,2097152,array['image/jpeg'])
on conflict (id) do nothing;
