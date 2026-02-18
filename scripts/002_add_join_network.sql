-- Create shop extensions for join network
do $$
begin
  if not exists (select 1 from pg_type where typname = 'shop_request_status') then
    create type public.shop_request_status as enum ('pending', 'approved', 'rejected');
  end if;
end $$;

create table if not exists public.shop_requests (
  id uuid primary key default gen_random_uuid(),
  shop_name text not null,
  owner_name text not null,
  contact_details text not null,
  address text not null,
  google_maps_link text not null,
  status public.shop_request_status default 'pending',
  rejection_reason text,
  created_at timestamptz default now()
);

-- Add verified column to shops if it doesn't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name='shops' and column_name='is_verified') then
    alter table public.shops add column is_verified boolean default false;
  end if;
end $$;

-- Policies for shop_requests
alter table public.shop_requests enable row level security;

drop policy if exists "shop_requests_insert_all" on public.shop_requests;
create policy "shop_requests_insert_all" on public.shop_requests for insert with check (true);

drop policy if exists "shop_requests_select_all" on public.shop_requests;
create policy "shop_requests_select_all" on public.shop_requests for select using (true);

-- Allow updates to shop_requests (for admin approval/rejection)
drop policy if exists "shop_requests_update_all" on public.shop_requests;
create policy "shop_requests_update_all" on public.shop_requests for update using (true);

-- Allow inserting into shops table (for admin approval to create the shop)
drop policy if exists "shops_insert_all" on public.shops;
create policy "shops_insert_all" on public.shops for insert with check (true);
