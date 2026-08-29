-- 018. TaraFix Platform Reports, Bans & Moderation System
-- Supports bi-directional reporting and account bans for both Mechanics AND Car Owners.

CREATE TABLE IF NOT EXISTS public.customer_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.service_requests(id) ON DELETE SET NULL,
    customer_email TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    mechanic_id UUID REFERENCES public.mechanics(id) ON DELETE SET NULL,
    mechanic_email TEXT,
    mechanic_name TEXT,
    reporter_role TEXT NOT NULL DEFAULT 'customer', -- 'customer' | 'mechanic'
    reason_category TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'warned', 'revoked', 'dismissed'
    admin_notes TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Banned Users (Revoked Access for Car Owners & Phone/Emails)
CREATE TABLE IF NOT EXISTS public.banned_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    reason TEXT NOT NULL,
    banned_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure column exists if table was already created
ALTER TABLE public.customer_reports ADD COLUMN IF NOT EXISTS reporter_role TEXT NOT NULL DEFAULT 'customer';

-- Indexes for efficient admin retrieval and complaint filtering
CREATE INDEX IF NOT EXISTS idx_customer_reports_status_created ON public.customer_reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_reports_mechanic ON public.customer_reports (mechanic_id);
CREATE INDEX IF NOT EXISTS idx_customer_reports_customer_email ON public.customer_reports (LOWER(customer_email));
CREATE INDEX IF NOT EXISTS idx_customer_reports_reporter_role ON public.customer_reports (reporter_role);
CREATE INDEX IF NOT EXISTS idx_banned_users_email ON public.banned_users (LOWER(email));

-- Enable RLS
ALTER TABLE public.customer_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;

-- Allow public access (enforced via server actions)
DROP POLICY IF EXISTS "Allow public all on customer_reports" ON public.customer_reports;
CREATE POLICY "Allow public all on customer_reports" 
    ON public.customer_reports FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all on banned_users" ON public.banned_users;
CREATE POLICY "Allow public all on banned_users" 
    ON public.banned_users FOR ALL USING (true) WITH CHECK (true);
