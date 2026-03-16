-- FIX: Sync Mechanic Ratings and Repair Trigger
-- This script repairs the summary stats for mechanics and ensures the trigger is working

-- 1. Manually Sync existing data (In case trigger didn't run before)
UPDATE public.mechanics m
SET 
    review_count = sub.cnt,
    rating = sub.avg_rating
FROM (
    SELECT 
        mechanic_id, 
        COUNT(*) as cnt, 
        AVG(rating)::numeric(3,1) as avg_rating
    FROM public.reviews
    GROUP BY mechanic_id
) sub
WHERE m.id = sub.mechanic_id;

-- 2. Ensure all service_requests with reviews are marked as is_reviewed
UPDATE public.service_requests
SET is_reviewed = true
WHERE id IN (SELECT request_id FROM public.reviews);

-- 3. Re-install the trigger function with extra robustness
CREATE OR REPLACE FUNCTION update_mechanic_rating_summary()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the specific mechanic's summary stats
    UPDATE public.mechanics
    SET 
        rating = (SELECT COALESCE(AVG(rating), 5.0)::numeric(3,1) FROM public.reviews WHERE mechanic_id = NEW.mechanic_id),
        review_count = (SELECT COUNT(*) FROM public.reviews WHERE mechanic_id = NEW.mechanic_id)
    WHERE id = NEW.mechanic_id;
    
    -- Ensure the corresponding service request is marked as reviewed
    UPDATE public.service_requests 
    SET is_reviewed = true 
    WHERE id = NEW.request_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Re-bind the trigger
DROP TRIGGER IF EXISTS tr_update_mechanic_rating_on_review ON public.reviews;
CREATE TRIGGER tr_update_mechanic_rating_on_review
AFTER INSERT OR UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION update_mechanic_rating_summary();

NOTIFY pgrst, 'reload schema';
