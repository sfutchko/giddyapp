-- =====================================================
-- FIX NOTIFICATIONS RLS POLICIES
-- =====================================================

-- Check existing policies
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'notifications'
ORDER BY policyname;

-- Add policy to allow authenticated users to create notifications for any user
-- This is needed for: price drops, new messages, offers, viewing requests, etc.
CREATE POLICY "Authenticated users can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Verify the policy was created
SELECT
  policyname,
  cmd,
  with_check
FROM pg_policies
WHERE tablename = 'notifications'
  AND policyname = 'Authenticated users can create notifications';
