-- Add missing columns for mechanic preferences to both tables
-- Run this in your Supabase SQL Editor

-- 1. Update mechanic_requests table
ALTER TABLE public.mechanic_requests 
ADD COLUMN IF NOT EXISTS service_preference text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS available_days text[] DEFAULT '{}';

-- 2. Update mechanics table
ALTER TABLE public.mechanics 
ADD COLUMN IF NOT EXISTS service_preference text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS available_days text[] DEFAULT '{}';

-- 3. Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
