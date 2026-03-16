-- Update service_requests to link mechanics instead of shops
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_requests' AND column_name = 'shop_id') THEN
    ALTER TABLE public.service_requests RENAME COLUMN shop_id TO mechanic_id;
  END IF;
END $$;

ALTER TABLE public.service_requests DROP CONSTRAINT IF EXISTS service_requests_shop_id_fkey;
ALTER TABLE public.service_requests DROP CONSTRAINT IF EXISTS service_requests_mechanic_id_fkey;

-- Clean up orphaned records holding old shop IDs before applying the mechanic foreign key
DELETE FROM public.service_requests 
WHERE mechanic_id NOT IN (SELECT id FROM public.mechanics);

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'service_requests' AND constraint_name = 'service_requests_mechanic_id_fkey'
  ) THEN 
    ALTER TABLE public.service_requests 
      ADD CONSTRAINT service_requests_mechanic_id_fkey 
      FOREIGN KEY (mechanic_id) REFERENCES public.mechanics(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Secure Chat Channel (service_request_messages)
ALTER TABLE public.service_request_messages ENABLE ROW LEVEL SECURITY;

-- Drop generic policies
DROP POLICY IF EXISTS "service_request_messages_select_all" ON public.service_request_messages;
DROP POLICY IF EXISTS "service_request_messages_insert_all" ON public.service_request_messages;
DROP POLICY IF EXISTS "messages_select_privacy" ON public.service_request_messages;
DROP POLICY IF EXISTS "messages_insert_privacy" ON public.service_request_messages;

-- Create strict privacy policy for SELECT (Only customer and assigned mechanic)
CREATE POLICY "messages_select_privacy" ON public.service_request_messages FOR SELECT USING (
  -- Either the sender themselves or...
  sender_email = auth.jwt()->>'email' OR 
  -- They participate in the request
  EXISTS (
    SELECT 1 FROM public.service_requests sr
    WHERE sr.id = service_request_messages.request_id AND (
      sr.customer_email = auth.jwt()->>'email' OR 
      EXISTS (SELECT 1 FROM public.mechanics m WHERE m.id = sr.mechanic_id AND m.email = auth.jwt()->>'email')
    )
  )
);

-- Create strict privacy policy for INSERT
CREATE POLICY "messages_insert_privacy" ON public.service_request_messages FOR INSERT WITH CHECK (
  sender_email = auth.jwt()->>'email' AND
  EXISTS (
    SELECT 1 FROM public.service_requests sr
    WHERE sr.id = service_request_messages.request_id AND (
      sr.customer_email = auth.jwt()->>'email' OR 
      EXISTS (SELECT 1 FROM public.mechanics m WHERE m.id = sr.mechanic_id AND m.email = auth.jwt()->>'email')
    )
  )
);

NOTIFY pgrst, 'reload schema';
