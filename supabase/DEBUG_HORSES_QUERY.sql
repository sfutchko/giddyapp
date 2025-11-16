-- Test 1: Check all horses exist
SELECT id, name, status, latitude, longitude FROM horses;

-- Test 2: Check what the RLS policy would return for an anonymous user
-- This simulates what the client-side query sees
SET ROLE anon;
SELECT id, name, status, latitude, longitude FROM horses;
RESET ROLE;

-- Test 3: Check the exact query the app is running
SET ROLE anon;
SELECT
  id,
  name,
  slug,
  price,
  location,
  latitude,
  longitude,
  breed,
  age,
  gender,
  status
FROM horses
WHERE status IN ('active', 'draft')
ORDER BY created_at DESC;
RESET ROLE;

-- Test 4: Check if there are any active/draft horses
SELECT status, COUNT(*) FROM horses GROUP BY status;
