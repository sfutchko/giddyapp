-- Add verification fields to profiles table if they don't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_verified_seller BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS seller_verified_at TIMESTAMPTZ;

-- Add ban fields to profiles table if they don't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS banned_reason TEXT;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified_seller ON profiles(is_verified_seller);
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON profiles(is_banned);