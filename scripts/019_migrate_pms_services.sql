-- 019. Migrate and Replace Deprecated Services with Preventive Maintenance Services (PMS)
-- Replaces 'Oil Change', 'Tire Services', and 'Brake Services' with 'Preventive Maintenance Services (PMS)'

-- 1. Update 'mechanics' table: Replace deprecated services with PMS and remove duplicates
UPDATE public.mechanics
SET specializations = (
    SELECT array_agg(DISTINCT 
        CASE 
            WHEN item IN ('Oil Change', 'Tire Services', 'Brake Services') 
            THEN 'Preventive Maintenance Services (PMS)'
            ELSE item
        END
    )
    FROM unnest(specializations) AS item
)
WHERE 
    'Oil Change' = ANY(specializations)
    OR 'Tire Services' = ANY(specializations)
    OR 'Brake Services' = ANY(specializations);

-- 2. Update 'mechanic_requests' table
UPDATE public.mechanic_requests
SET specializations = (
    SELECT array_agg(DISTINCT 
        CASE 
            WHEN item IN ('Oil Change', 'Tire Services', 'Brake Services') 
            THEN 'Preventive Maintenance Services (PMS)'
            ELSE item
        END
    )
    FROM unnest(specializations) AS item
)
WHERE 
    'Oil Change' = ANY(specializations)
    OR 'Tire Services' = ANY(specializations)
    OR 'Brake Services' = ANY(specializations);

-- 3. Update 'service_requests' table service_type
UPDATE public.service_requests
SET service_type = 'Preventive Maintenance Services (PMS)'
WHERE service_type IN ('Oil Change', 'Tire Services', 'Brake Services');

-- 4. Update 'shops' table
UPDATE public.shops
SET services = REPLACE(REPLACE(REPLACE(services, 'Oil Change', 'Preventive Maintenance Services (PMS)'), 'Tire Services', 'Preventive Maintenance Services (PMS)'), 'Brake Services', 'Preventive Maintenance Services (PMS)')
WHERE services ILIKE '%Oil Change%' OR services ILIKE '%Tire Services%' OR services ILIKE '%Brake Services%';

NOTIFY pgrst, 'reload schema';
