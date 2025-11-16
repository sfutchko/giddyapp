-- Check if horses have coordinates
SELECT
  id,
  name,
  location->>'city' as city,
  location->>'state' as state,
  location->>'zipCode' as zip,
  latitude,
  longitude,
  status
FROM horses
ORDER BY created_at DESC
LIMIT 20;

-- Count horses with and without coordinates
SELECT
  COUNT(*) FILTER (WHERE latitude IS NOT NULL AND longitude IS NOT NULL) as with_coordinates,
  COUNT(*) FILTER (WHERE latitude IS NULL OR longitude IS NULL) as without_coordinates,
  COUNT(*) as total
FROM horses
WHERE status = 'active';
