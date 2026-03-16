-- Phase 1 & 2 Support: Real-Time Status & Availability
-- Run this in your Supabase SQL Editor

-- 1. Ensure service_requests have the correct status constraint
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE table_name = 'service_requests' AND constraint_name = 'service_requests_status_check'
    ) THEN
        ALTER TABLE public.service_requests DROP CONSTRAINT service_requests_status_check;
    END IF;
END $$;

ALTER TABLE public.service_requests 
ADD CONSTRAINT service_requests_status_check 
CHECK (status IN ('pending', 'accepted', 'on_my_way', 'arrived', 'in_progress', 'completed', 'cancelled'));

-- 2. Add technical columns
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS status_updated_at timestamptz DEFAULT now();

-- 3. CRITICAL: Configure Realtime Performance & Behavior
-- REPLICA IDENTITY FULL ensures ALL table columns are sent in the real-time event.
-- Without this, the frontend won't know WHICH mechanic was updated if only status changed.
ALTER TABLE public.mechanics REPLICA IDENTITY FULL;
ALTER TABLE public.service_requests REPLICA IDENTITY FULL;

-- 4. Enable Realtime Publications
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'mechanics'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.mechanics;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'service_requests'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests;
    END IF;
END $$;

-- 5. RLS Policies: Allow Mechanics to update their OWN records

-- Allow update on mechanics table (for availability, phone, etc.)
DROP POLICY IF EXISTS "mechanics_update_own_profile" ON public.mechanics;
CREATE POLICY "mechanics_update_own_profile" ON public.mechanics
FOR UPDATE USING (
    LOWER(email) = LOWER(auth.jwt()->>'email')
);

-- Allow update on service_requests (for status tracking)
DROP POLICY IF EXISTS "mechanics_update_status" ON public.service_requests;
CREATE POLICY "mechanics_update_status" ON public.service_requests
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.mechanics m
        WHERE m.id = public.service_requests.mechanic_id
        AND LOWER(m.email) = LOWER(auth.jwt()->>'email')
    )
);

-- 6. Extra Index for lookup performance
CREATE INDEX IF NOT EXISTS idx_mechanics_email ON public.mechanics(email);

NOTIFY pgrst, 'reload schema';
