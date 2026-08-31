-- Migration: Add last_active_at to mechanics and user_profiles for Facebook-style live presence
ALTER TABLE public.mechanics ADD COLUMN IF NOT EXISTS last_active_at timestamptz DEFAULT now();
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS last_active_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_mechanics_last_active ON public.mechanics (last_active_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_active ON public.user_profiles (last_active_at);

-- Helper RPC to update presence without needing client-side RLS overhead
CREATE OR REPLACE FUNCTION public.update_user_presence(p_email text)
RETURNS void AS $$
BEGIN
  IF p_email IS NOT NULL AND trim(p_email) <> '' THEN
    UPDATE public.user_profiles 
    SET last_active_at = now(), updated_at = now()
    WHERE email ILIKE trim(p_email);

    UPDATE public.mechanics
    SET last_active_at = now()
    WHERE email ILIKE trim(p_email);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
