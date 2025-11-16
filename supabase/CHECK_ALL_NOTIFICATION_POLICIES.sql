-- Check all notification policies in detail
SELECT
  schemaname,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'notifications'
ORDER BY cmd, policyname;

-- Check if there's a restrictive INSERT policy
SELECT COUNT(*) as insert_policy_count
FROM pg_policies
WHERE tablename = 'notifications'
  AND cmd = 'INSERT';
