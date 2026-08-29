-- 016. High-Performance Database Indexes for TaraFix
-- Run this in your Supabase SQL Editor to maximize query throughput and minimize latency.

-- 1. Mechanics Table Indexes
-- Accelerates location filtering, city lookup, and sort-by-rating queries
CREATE INDEX IF NOT EXISTS idx_mechanics_city ON public.mechanics (city);
CREATE INDEX IF NOT EXISTS idx_mechanics_rating_desc ON public.mechanics (rating DESC);
CREATE INDEX IF NOT EXISTS idx_mechanics_city_rating ON public.mechanics (city, rating DESC);
CREATE INDEX IF NOT EXISTS idx_mechanics_available_rating ON public.mechanics (is_available, rating DESC);
CREATE INDEX IF NOT EXISTS idx_mechanics_geo ON public.mechanics (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mechanics_email_lower ON public.mechanics (LOWER(email));

-- 2. Service Requests Table Indexes
-- Accelerates user dashboard, mechanic queue, and status tracking lookups
CREATE INDEX IF NOT EXISTS idx_service_requests_customer_email ON public.service_requests (LOWER(customer_email), created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_requests_mechanic_id ON public.service_requests (mechanic_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON public.service_requests (status);
CREATE INDEX IF NOT EXISTS idx_service_requests_active_queue ON public.service_requests (mechanic_id, status) 
    WHERE status IN ('pending', 'accepted', 'on_my_way', 'arrived', 'in_progress');

-- 3. Chat Messages Table Indexes
-- Accelerates instant conversation load and message history ordering
CREATE INDEX IF NOT EXISTS idx_chat_messages_request_id_created ON public.service_request_messages (request_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_email ON public.service_request_messages (LOWER(sender_email));

-- 4. Reviews Table Indexes
-- Accelerates mechanic public profile review listings
CREATE INDEX IF NOT EXISTS idx_reviews_mechanic_id ON public.reviews (mechanic_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_request_id ON public.reviews (request_id);

-- 5. Mechanic Requests (Applications) Indexes
-- Accelerates admin queue filtering & deduplication checks
CREATE INDEX IF NOT EXISTS idx_mechanic_requests_status_created ON public.mechanic_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mechanic_requests_email_status ON public.mechanic_requests (LOWER(email), status);

-- 6. Push Subscriptions Indexes
-- Accelerates instant push notification dispatch by recipient email
CREATE INDEX IF NOT EXISTS idx_push_subs_user_email ON public.push_subscriptions (user_email);

-- 7. Refresh PostgREST schema cache and update query planner statistics
ANALYZE public.mechanics;
ANALYZE public.service_requests;
ANALYZE public.service_request_messages;
ANALYZE public.reviews;
ANALYZE public.mechanic_requests;
ANALYZE public.push_subscriptions;

NOTIFY pgrst, 'reload schema';
