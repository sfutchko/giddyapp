-- Drop the problematic INSERT policy
DROP POLICY IF EXISTS "notifications_insert_authenticated" ON notifications;

-- Create a new INSERT policy with a simpler check
-- This checks if the user is authenticated (not anonymous)
CREATE POLICY "notifications_insert_any_auth"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Verify
SELECT
  policyname,
  cmd,
  with_check
FROM pg_policies
WHERE tablename = 'notifications'
  AND cmd = 'INSERT';
