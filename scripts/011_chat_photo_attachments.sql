-- Phase 4: Chat Photo Attachments & Auto-Cleanup
-- This script adds supports for image messages and automated lifecycle management

-- 1. Add image_url to messages
ALTER TABLE public.service_request_messages 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Create Storage Bucket for Chat Attachments
-- This requires the storage extension to be active (default in Supabase)
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat_attachments', 'chat_attachments', false)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Security Policies
-- Allow users to see images if they are part of the service request
-- Fix: Using case-insensitive email checks and EXISTS for robustness
DROP POLICY IF EXISTS "chat_images_select_policy" ON storage.objects;
CREATE POLICY "chat_images_select_policy" ON storage.objects FOR SELECT USING (
    bucket_id = 'chat_attachments' AND (
        EXISTS (
            SELECT 1 FROM public.service_requests sr
            WHERE sr.id::text = (storage.foldername(name))[1]
            AND (
                LOWER(sr.customer_email) = LOWER(auth.jwt()->>'email')
                OR 
                EXISTS (
                    SELECT 1 FROM public.mechanics m
                    WHERE m.id = sr.mechanic_id
                    AND LOWER(m.email) = LOWER(auth.jwt()->>'email')
                )
            )
        )
    )
);

-- Allow users to upload images to their specific booking folder
DROP POLICY IF EXISTS "chat_images_upload_policy" ON storage.objects;
CREATE POLICY "chat_images_upload_policy" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'chat_attachments' AND (
        EXISTS (
            SELECT 1 FROM public.service_requests sr
            WHERE sr.id::text = (storage.foldername(name))[1]
            AND (
                LOWER(sr.customer_email) = LOWER(auth.jwt()->>'email')
                OR 
                EXISTS (
                    SELECT 1 FROM public.mechanics m
                    WHERE m.id = sr.mechanic_id
                    AND LOWER(m.email) = LOWER(auth.jwt()->>'email')
                )
            )
        )
    )
);

-- 4. Cleanup Logic
-- We use a trigger to mark messages as "purged" or just handle file deletion via Edge Functions/Actions.
-- For absolute safety and simplicity in this environment, we'll add a column to track storage status.
ALTER TABLE public.service_request_messages 
ADD COLUMN IF NOT EXISTS storage_purged BOOLEAN DEFAULT false;

-- Add a comment for the cleanup strategy:
-- "Cleanup will be triggered by the server-side updateServiceRequestStatus action 
-- when status is set to 'completed', calling a storage cleanup routine."

NOTIFY pgrst, 'reload schema';
