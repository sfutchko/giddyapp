-- =====================================================
-- FORCE SECURE NOTIFICATIONS WITH PROPER RLS POLICIES
-- =====================================================

-- First, get list of all existing notification policies
SELECT policyname FROM pg_policies WHERE tablename = 'notifications';

-- Drop them one by one (all known variations)
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'notifications'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON notifications', policy_record.policyname);
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE CLEAN POLICIES
-- =====================================================

-- SELECT: Users can only see their own notifications
CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Any authenticated user can create notifications
CREATE POLICY "notifications_insert_authenticated"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: Users can only update their own notifications
CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete their own notifications
CREATE POLICY "notifications_delete_own"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- VERIFY
-- =====================================================
SELECT
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'notifications'
ORDER BY cmd, policyname;

SELECT 'RLS enabled:', rowsecurity FROM pg_tables WHERE tablename = 'notifications';
