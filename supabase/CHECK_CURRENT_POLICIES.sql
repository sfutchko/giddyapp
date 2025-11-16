-- Check current notification policies
SELECT
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'notifications'
ORDER BY cmd, policyname;

-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'notifications';

-- Test if we can manually insert a notification
-- (This will test the INSERT policy)
SELECT auth.uid() as current_user;
