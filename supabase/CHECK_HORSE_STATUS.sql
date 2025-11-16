-- Check horse statuses
SELECT
  id,
  name,
  status,
  latitude,
  longitude,
  seller_id
FROM horses
ORDER BY created_at DESC;

-- Check RLS policies on horses table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'horses';

-- Check if RLS is enabled
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'horses';
