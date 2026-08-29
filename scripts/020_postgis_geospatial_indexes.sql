-- 020. PostGIS Geospatial Spatial Indexing for Sub-Millisecond Radius Searching
-- Enables PostGIS extension and creates Spatial GIST indexes on latitude/longitude points.

-- 1. Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Add spatial geography point column if not already present on 'mechanics'
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'mechanics' 
        AND column_name = 'geom'
    ) THEN
        ALTER TABLE public.mechanics ADD COLUMN geom GEOGRAPHY(Point, 4326);
    END IF;
END $$;

-- 3. Populate geom column from existing lat/lng coordinates
UPDATE public.mechanics 
SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND geom IS NULL;

-- 4. Create High-Speed GIST Spatial Index on mechanics geom
CREATE INDEX IF NOT EXISTS idx_mechanics_geom_gist ON public.mechanics USING GIST (geom);

-- 5. Automatically keep geom synchronized on INSERT/UPDATE via Trigger
CREATE OR REPLACE FUNCTION public.sync_mechanic_geom()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_mechanic_geom ON public.mechanics;
CREATE TRIGGER trg_sync_mechanic_geom
BEFORE INSERT OR UPDATE OF latitude, longitude ON public.mechanics
FOR EACH ROW EXECUTE FUNCTION public.sync_mechanic_geom();

-- 6. Spatial Stored Procedure for Sub-Millisecond Distance Radius Search
CREATE OR REPLACE FUNCTION public.find_nearby_mechanics(
    user_lat DOUBLE PRECISION,
    user_lng DOUBLE PRECISION,
    radius_km DOUBLE PRECISION DEFAULT 25.0
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    city TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    specializations TEXT[],
    rating NUMERIC,
    review_count INT,
    distance_meters DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.name,
        m.city,
        m.latitude,
        m.longitude,
        m.specializations,
        m.rating,
        m.review_count,
        ST_Distance(m.geom, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography) AS distance_meters
    FROM public.mechanics m
    WHERE m.geom IS NOT NULL 
      AND ST_DWithin(m.geom, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography, radius_km * 1000)
    ORDER BY distance_meters ASC;
END;
$$ LANGUAGE plpgsql;

NOTIFY pgrst, 'reload schema';
