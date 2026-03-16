-- Phase 2: Digital Quote & Agreement
-- This script adds fields for price estimates and customer approval

-- 1. Add quote fields to service_requests
ALTER TABLE public.service_requests 
ADD COLUMN IF NOT EXISTS quote_amount NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS quote_description TEXT,
ADD COLUMN IF NOT EXISTS quote_status TEXT CHECK (quote_status IN ('pending', 'accepted', 'rejected')),
ADD COLUMN IF NOT EXISTS quote_updated_at TIMESTAMPTZ;

-- 2. Ensure Realtime is enabled for these new fields
-- (Already enabled in previous phase, but REPLICA IDENTITY FULL is critical here)
ALTER TABLE public.service_requests REPLICA IDENTITY FULL;

-- 3. Log Quote Events in status logs
-- We can reuse the service_request_status_logs or create a specific one.
-- For simplicity and a unified timeline, we'll use the existing one but maybe add a 'metadata' column if needed later.
-- For now, the existing structure is enough to log 'quote_sent', 'quote_accepted', etc.

NOTIFY pgrst, 'reload schema';
