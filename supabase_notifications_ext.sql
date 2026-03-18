-- 1. Extend profiles table with notification settings
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS email_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN DEFAULT FALSE;

-- 2. Ensure RLS allows users to update these new fields
-- (Previous policies already cover auth.uid() = id for UPDATE)
