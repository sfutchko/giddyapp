-- Add farm name and logo to horses table
ALTER TABLE horses
ADD COLUMN farm_name TEXT,
ADD COLUMN farm_logo_url TEXT;

-- Add comment to explain the fields
COMMENT ON COLUMN horses.farm_name IS 'Optional farm/stable name associated with the horse';
COMMENT ON COLUMN horses.farm_logo_url IS 'Optional URL to the farm logo image stored in Supabase Storage';
