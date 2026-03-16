-- Phase 3: Reviews and Job Completion
-- This script creates the infrastructure for ratings and feedback

-- 1. Create Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
    mechanic_id UUID NOT NULL REFERENCES public.mechanics(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_avatar_url TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Ensure one review per request
    UNIQUE(request_id)
);

-- 2. Add Review Status to service_requests
ALTER TABLE public.service_requests 
ADD COLUMN IF NOT EXISTS is_reviewed BOOLEAN DEFAULT false;

-- 3. Enable RLS on Reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_select_all" ON public.reviews;
CREATE POLICY "reviews_select_all" ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "customers_insert_reviews" ON public.reviews;
CREATE POLICY "customers_insert_reviews" ON public.reviews 
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.service_requests sr
        WHERE sr.id = request_id
        AND LOWER(sr.customer_email) = LOWER(auth.jwt()->>'email')
        AND sr.status = 'completed'
    )
);

-- 4. Trigger to update mechanic ratings automatically
CREATE OR REPLACE FUNCTION update_mechanic_rating_summary()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.mechanics
    SET 
        rating = (SELECT AVG(rating) FROM public.reviews WHERE mechanic_id = NEW.mechanic_id),
        review_count = (SELECT COUNT(*) FROM public.reviews WHERE mechanic_id = NEW.mechanic_id)
    WHERE id = NEW.mechanic_id;
    
    -- Mark request as reviewed
    UPDATE public.service_requests SET is_reviewed = true WHERE id = NEW.request_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_mechanic_rating_on_review ON public.reviews;
CREATE TRIGGER tr_update_mechanic_rating_on_review
AFTER INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION update_mechanic_rating_summary();

NOTIFY pgrst, 'reload schema';
