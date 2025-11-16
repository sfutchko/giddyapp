-- ============================================================================
-- Fix RLS policies for viewing_requests to allow marking as completed
-- ============================================================================

-- Drop the restrictive requester policy
DROP POLICY IF EXISTS "Requesters can update their own pending requests" ON viewing_requests;

-- Add new policies for specific use cases
-- 1. Requesters can cancel their own pending requests
DROP POLICY IF EXISTS "Requesters can cancel pending requests" ON viewing_requests;
CREATE POLICY "Requesters can cancel pending requests"
  ON viewing_requests FOR UPDATE
  USING (auth.uid() = requester_id AND status = 'pending')
  WITH CHECK (auth.uid() = requester_id AND status = 'cancelled');

-- 2. Both requester and seller can mark approved requests as completed
DROP POLICY IF EXISTS "Users can mark approved requests as completed" ON viewing_requests;
CREATE POLICY "Users can mark approved requests as completed"
  ON viewing_requests FOR UPDATE
  USING (
    (auth.uid() = requester_id OR auth.uid() = seller_id)
    AND status = 'approved'
  )
  WITH CHECK (
    (auth.uid() = requester_id OR auth.uid() = seller_id)
    AND status = 'completed'
  );

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
