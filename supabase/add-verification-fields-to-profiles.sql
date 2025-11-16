-- Add verification fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_verified_seller BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS seller_verified_at TIMESTAMPTZ;

-- Create index for verified sellers
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified_seller ON profiles(is_verified_seller);

-- Update RLS policies if needed
-- The existing policies should already handle these new columns