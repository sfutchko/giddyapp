-- Add ban fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS banned_reason TEXT;

-- Create index for banned users
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON profiles(is_banned);

-- Update RLS policies to prevent banned users from accessing data
-- This would be added to existing policies as needed