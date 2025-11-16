-- Add street address field to horses table location JSONB
-- The location field is already JSONB, so we just need to update it to include street

-- Add a comment to document the new structure
COMMENT ON COLUMN horses.location IS 'Location data in JSONB format: {"street": "123 Main St", "city": "City", "state": "State", "zipCode": "12345", "country": "USA"}';

-- No schema change needed since location is already JSONB
-- Just documenting the expected structure
