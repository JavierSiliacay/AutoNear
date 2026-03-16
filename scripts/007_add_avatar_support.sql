-- Add avatar support for Google profile pictures
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS customer_avatar_url text;

-- Ensure mechanics table has image_url (it should, but let's be sure)
-- (Already exists based on previous view_file of 003_tarafix_migration.sql)

-- Update existing requests with basic info if needed? Probably not.
