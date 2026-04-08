-- Migration 014: Backfill mechanic preferences for existing records
-- Current mechanics were not aware of the new service preference options, 
-- so we default them to both Home Service and On Shop.

-- 1. Update existing mechanics
UPDATE public.mechanics 
SET service_preference = ARRAY['Home Service', 'On Shop']
WHERE service_preference IS NULL OR array_length(service_preference, 1) IS NULL;

-- 2. Update pending registration requests
UPDATE public.mechanic_requests 
SET service_preference = ARRAY['Home Service', 'On Shop']
WHERE service_preference IS NULL OR array_length(service_preference, 1) IS NULL;

-- 3. Also provide a default schedule (Mon-Fri) if none exists
UPDATE public.mechanics 
SET available_days = ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
WHERE available_days IS NULL OR array_length(available_days, 1) IS NULL;

UPDATE public.mechanic_requests 
SET available_days = ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
WHERE available_days IS NULL OR array_length(available_days, 1) IS NULL;

-- Notify PostgREST to refresh schema (optional but good practice)
NOTIFY pgrst, 'reload schema';
