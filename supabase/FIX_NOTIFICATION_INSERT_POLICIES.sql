-- Show the conflicting INSERT policies
SELECT
  policyname,
  permissive,
  with_check
FROM pg_policies
WHERE tablename = 'notifications'
  AND cmd = 'INSERT';

-- Drop all INSERT policies on notifications
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert notifications for themselves" ON notifications;
DROP POLICY IF EXISTS "Users can create notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;

-- Create one simple policy that allows any authenticated user to create notifications
CREATE POLICY "Allow authenticated users to create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Verify
SELECT
  policyname,
  permissive,
  roles,
  with_check
FROM pg_policies
WHERE tablename = 'notifications'
  AND cmd = 'INSERT';
