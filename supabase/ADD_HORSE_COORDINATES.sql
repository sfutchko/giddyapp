-- Add latitude and longitude columns to horses table
ALTER TABLE horses
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Create index for geographic queries
CREATE INDEX IF NOT EXISTS idx_horses_coordinates ON horses(latitude, longitude);

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'horses'
AND column_name IN ('latitude', 'longitude');
