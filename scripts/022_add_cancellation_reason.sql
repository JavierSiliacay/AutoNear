-- Add cancellation_reason column to service_requests
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS cancellation_reason text;
