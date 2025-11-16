-- =====================================================
-- SECURE NOTIFICATIONS WITH PROPER RLS POLICIES
-- =====================================================

-- Re-enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Allow authenticated users to create notifications" ON notifications;
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

-- =====================================================
-- SELECT: Users can only see their own notifications
-- =====================================================
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- =====================================================
-- INSERT: Any authenticated user can create notifications
-- This is needed for:
-- - Price drop notifications (seller → buyer)
-- - Message notifications (user → user)
-- - Offer notifications (buyer → seller)
-- - Viewing request notifications (buyer → seller)
-- =====================================================
CREATE POLICY "Authenticated users can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =====================================================
-- UPDATE: Users can only update their own notifications
-- (to mark as read, etc.)
-- =====================================================
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- DELETE: Users can delete their own notifications
-- =====================================================
CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- VERIFY POLICIES
-- =====================================================
SELECT
  policyname,
  cmd,
  roles,
  permissive
FROM pg_policies
WHERE tablename = 'notifications'
ORDER BY cmd, policyname;

-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'notifications';
