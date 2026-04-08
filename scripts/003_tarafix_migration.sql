-- TARAFIX DATABASE MIGRATION
-- Transitioning from shop-based (AutoNear) to mechanic-based (TaraFix)

-- 1. Create or Rename Mechanic Requests table
do $$
begin
  if exists (select from information_schema.tables where table_name = 'fixer_requests' and table_schema = 'public') then
    alter table public.fixer_requests rename to mechanic_requests;
  else
    create table if not exists public.mechanic_requests (
      id uuid primary key default gen_random_uuid(),
      full_name text not null,
      contact_number text not null,
      email text not null,
      specializations text[] default '{}',
      experience_years integer,
      valid_id_url text,
      google_maps_pin_lat double precision,
      google_maps_pin_lng double precision,
      service_preference text[] default '{}',
      available_days text[] default '{}',
      status text default 'pending',
      rejection_reason text,
      created_at timestamptz default now()
    );
  end if;
end $$;

-- 2. Ensure Mechanics table exists or is updated
create table if not exists public.mechanics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique,
  bio text,
  specializations text[] default '{}',
  barangay text,
  city text not null,
  province text not null,
  latitude double precision,
  longitude double precision,
  phone text,
  image_url text,
  service_preference text[] default '{}',
  available_days text[] default '{}',
  rating numeric default 5.0,
  review_count integer default 0,
  is_verified boolean default false,
  is_available boolean default true,
  created_at timestamptz default now()
);

-- Force add email column to mechanics in case the table already existed before this update
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='mechanics' and column_name='email') then
    alter table public.mechanics add column email text unique;
  end if;
end $$;

-- 3. Enable RLS
alter table public.mechanic_requests enable row level security;
alter table public.mechanics enable row level security;

-- 4. Unified Policies
drop policy if exists "mechanic_requests_insert_all" on public.mechanic_requests;
create policy "mechanic_requests_insert_all" on public.mechanic_requests for insert with check (true);

drop policy if exists "mechanic_requests_select_all" on public.mechanic_requests;
create policy "mechanic_requests_select_all" on public.mechanic_requests for select using (true);

drop policy if exists "mechanic_requests_update_all" on public.mechanic_requests;
create policy "mechanic_requests_update_all" on public.mechanic_requests for update using (true);

drop policy if exists "mechanics_select_all" on public.mechanics;
create policy "mechanics_select_all" on public.mechanics for select using (true);

drop policy if exists "mechanics_insert_all" on public.mechanics;
create policy "mechanics_insert_all" on public.mechanics for insert with check (true);

-- 5. Optional: Keep legacy tables but note they are deprecated
comment on table public.shops is 'Legacy table for AutoNear. Deprecated for TaraFix.';
comment on table public.shop_requests is 'Legacy table for AutoNear. Deprecated for TaraFix.';

-- 6. Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

