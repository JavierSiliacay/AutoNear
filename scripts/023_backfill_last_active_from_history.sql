-- Migration: Backfill last_active_at based on real historical user activity
-- This checks:
-- 1. auth.users.last_sign_in_at (When the user last logged into TaraFix)
-- 2. service_request_messages.created_at (When the user last sent a chat message)
-- 3. service_requests (When the mechanic/customer last participated in a booking)
-- 4. mechanics.created_at / user_profiles.created_at

-- 1. Backfill public.mechanics.last_active_at from real historical touchpoints
UPDATE public.mechanics m
SET last_active_at = COALESCE(
  (
    SELECT GREATEST(
      u.last_sign_in_at,
      u.created_at,
      (SELECT MAX(created_at) FROM public.service_request_messages WHERE LOWER(TRIM(sender_email)) = LOWER(TRIM(m.email))),
      (SELECT MAX(created_at) FROM public.service_requests WHERE mechanic_id = m.id),
      m.created_at
    )
    FROM auth.users u
    WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(m.email))
    LIMIT 1
  ),
  (SELECT MAX(created_at) FROM public.service_request_messages WHERE LOWER(TRIM(sender_email)) = LOWER(TRIM(m.email))),
  (SELECT MAX(created_at) FROM public.service_requests WHERE mechanic_id = m.id),
  m.created_at,
  now() - INTERVAL '3 days'
);

-- 2. Backfill public.user_profiles.last_active_at from real historical touchpoints
UPDATE public.user_profiles p
SET last_active_at = COALESCE(
  (
    SELECT GREATEST(
      u.last_sign_in_at,
      u.created_at,
      (SELECT MAX(created_at) FROM public.service_request_messages WHERE LOWER(TRIM(sender_email)) = LOWER(TRIM(p.email))),
      (SELECT MAX(created_at) FROM public.service_requests WHERE LOWER(TRIM(customer_email)) = LOWER(TRIM(p.email))),
      p.created_at
    )
    FROM auth.users u
    WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(p.email))
    LIMIT 1
  ),
  (SELECT MAX(created_at) FROM public.service_request_messages WHERE LOWER(TRIM(sender_email)) = LOWER(TRIM(p.email))),
  (SELECT MAX(created_at) FROM public.service_requests WHERE LOWER(TRIM(customer_email)) = LOWER(TRIM(p.email))),
  p.created_at,
  now() - INTERVAL '3 days'
);
