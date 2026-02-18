create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  services text default '',
  address text,
  barangay text,
  city text not null,
  province text not null,
  latitude double precision,
  longitude double precision,
  phone text,
  opening_hours text,
  image_url text,
  rating numeric default 0,
  review_count integer default 0,
  created_at timestamptz default now()
);

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  customer_name text not null,
  customer_phone text not null,
  vehicle_info text,
  service_type text,
  message text,
  created_at timestamptz default now()
);

alter table public.shops enable row level security;
alter table public.service_requests enable row level security;

-- IDEMPOTENT POLICIES:
drop policy if exists "shops_select_all" on public.shops;
create policy "shops_select_all" on public.shops for select using (true);

drop policy if exists "service_requests_insert_all" on public.service_requests;
create policy "service_requests_insert_all" on public.service_requests for insert with check (true);

drop policy if exists "service_requests_select_all" on public.service_requests;
create policy "service_requests_select_all" on public.service_requests for select using (true);
