-- Create user_profiles table for storing car owner and customer profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
  email text PRIMARY KEY,
  full_name text,
  phone text,
  vehicle_info text,
  city text,
  barangay text,
  latitude double precision,
  longitude double precision,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_profiles_select_all" ON public.user_profiles;
CREATE POLICY "user_profiles_select_all" ON public.user_profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "user_profiles_insert_all" ON public.user_profiles;
CREATE POLICY "user_profiles_insert_all" ON public.user_profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "user_profiles_update_all" ON public.user_profiles;
CREATE POLICY "user_profiles_update_all" ON public.user_profiles FOR UPDATE USING (true) WITH CHECK (true);
