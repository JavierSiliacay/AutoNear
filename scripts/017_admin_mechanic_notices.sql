-- 017. Admin-to-User Warning & Notice System (Universal: Mechanics + Car Owners)
-- Allows administrators to dispatch official warnings, reminders, and alerts to any registered email (Mechanic or Customer).

CREATE TABLE IF NOT EXISTS public.admin_mechanic_notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mechanic_id UUID REFERENCES public.mechanics(id) ON DELETE SET NULL,
    mechanic_email TEXT NOT NULL, -- Serves as the recipient email (mechanic or car owner)
    admin_email TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT 'Admin Notice',
    message TEXT NOT NULL,
    notice_type TEXT NOT NULL DEFAULT 'reminder', -- reminder, warning, inactivity, urgent
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for lightning-fast lookup by recipient email and read status
CREATE INDEX IF NOT EXISTS idx_admin_notices_email_read ON public.admin_mechanic_notices (LOWER(mechanic_email), is_read);
CREATE INDEX IF NOT EXISTS idx_admin_notices_created_at ON public.admin_mechanic_notices (created_at DESC);

-- Enable RLS
ALTER TABLE public.admin_mechanic_notices ENABLE ROW LEVEL SECURITY;

-- Allow public reads and inserts (handled securely by server actions)
DROP POLICY IF EXISTS "Allow public all on admin_mechanic_notices" ON public.admin_mechanic_notices;
CREATE POLICY "Allow public all on admin_mechanic_notices" 
    ON public.admin_mechanic_notices FOR ALL USING (true) WITH CHECK (true);
