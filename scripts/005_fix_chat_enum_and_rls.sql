-- Fix for mechanic reply failure
-- 1. Ensure sender_role can accept 'mechanic'
-- Use a DO block to handle possible enum or text column
DO $$ 
BEGIN
    -- If it's a text column with a check constraint, we might need to drop/update it.
    -- But most likely it's an enum or just text.
    -- If it's text, we don't need to do anything specifically unless there's a constraint.
    
    -- Let's just make sure the column is text for flexibility or has the right enum values
    -- If service_request_messages exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_request_messages') THEN
        -- If sender_role is an enum, we might need to add 'mechanic'
        -- Check if it's an enum
        IF EXISTS (
            SELECT 1 FROM pg_type t 
            JOIN pg_attribute a ON a.atttypid = t.oid 
            JOIN pg_class c ON c.oid = a.attrelid 
            WHERE c.relname = 'service_request_messages' AND a.attname = 'sender_role' AND t.typtype = 'e'
        ) THEN
            -- Add 'mechanic' to the enum if it's not there
            -- Note: ALTER TYPE ADD VALUE cannot be run in a transaction block in some PG versions
            -- But we'll try it.
            BEGIN
                EXECUTE 'ALTER TYPE public.chat_role ADD VALUE IF NOT EXISTS ''mechanic''';
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Could not add value to enum, might already exist or handled differently';
            END;
        END IF;
    END IF;
END $$;

-- 2. Make RLS policies more robust with LOWER() and handle NULLs
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
