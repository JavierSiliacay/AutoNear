-- Fix for mechanic reply failure due to check constraint
-- 1. Identify and drop the existing constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.constraint_column_usage 
        WHERE table_name = 'service_request_messages' 
        AND constraint_name = 'service_request_messages_sender_role_check'
    ) THEN
        ALTER TABLE public.service_request_messages DROP CONSTRAINT service_request_messages_sender_role_check;
    END IF;
END $$;

-- 2. Add the corrected constraint that includes 'mechanic'
ALTER TABLE public.service_request_messages 
ADD CONSTRAINT service_request_messages_sender_role_check 
CHECK (sender_role IN ('admin', 'customer', 'mechanic'));

-- 3. Also ensure RLS is using LOWER() as discussed before to avoid any email case issues
DROP POLICY IF EXISTS "messages_insert_privacy" ON public.service_request_messages;
CREATE POLICY "messages_insert_privacy" ON public.service_request_messages FOR INSERT WITH CHECK (
  LOWER(sender_email) = LOWER(auth.jwt()->>'email') AND
  EXISTS (
    SELECT 1 FROM public.service_requests sr
    WHERE sr.id = public.service_request_messages.request_id AND (
      LOWER(sr.customer_email) = LOWER(auth.jwt()->>'email') OR 
      EXISTS (
        SELECT 1 FROM public.mechanics m 
        WHERE m.id = sr.mechanic_id 
        AND LOWER(m.email) = LOWER(auth.jwt()->>'email')
      )
    )
  )
);

DROP POLICY IF EXISTS "messages_select_privacy" ON public.service_request_messages;
CREATE POLICY "messages_select_privacy" ON public.service_request_messages FOR SELECT USING (
  LOWER(sender_email) = LOWER(auth.jwt()->>'email') OR 
  EXISTS (
    SELECT 1 FROM public.service_requests sr
    WHERE sr.id = public.service_request_messages.request_id AND (
      LOWER(sr.customer_email) = LOWER(auth.jwt()->>'email') OR 
      EXISTS (
        SELECT 1 FROM public.mechanics m 
        WHERE m.id = sr.mechanic_id 
        AND LOWER(m.email) = LOWER(auth.jwt()->>'email')
      )
    )
  )
);

NOTIFY pgrst, 'reload schema';
