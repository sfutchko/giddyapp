-- ============================================================================
-- Add missing tables: blocked_users and viewing_requests
-- ============================================================================

-- ============================================================================
-- 1. BLOCKED USERS TABLE
-- ============================================================================

-- Create blocked_users table
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- Enable RLS
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blocked_users
DROP POLICY IF EXISTS "Users can view their own blocks" ON blocked_users;
CREATE POLICY "Users can view their own blocks"
  ON blocked_users FOR SELECT
  USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can create blocks" ON blocked_users;
CREATE POLICY "Users can create blocks"
  ON blocked_users FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can delete their own blocks" ON blocked_users;
CREATE POLICY "Users can delete their own blocks"
  ON blocked_users FOR DELETE
  USING (auth.uid() = blocker_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker_id ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked_id ON blocked_users(blocked_id);

-- Prevent self-blocking
CREATE OR REPLACE FUNCTION prevent_self_block()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.blocker_id = NEW.blocked_id THEN
    RAISE EXCEPTION 'Cannot block yourself';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_self_block ON blocked_users;
CREATE TRIGGER check_self_block
  BEFORE INSERT ON blocked_users
  FOR EACH ROW
  EXECUTE FUNCTION prevent_self_block();

-- ============================================================================
-- 2. VIEWING REQUESTS TABLE
-- ============================================================================

-- Create viewing_requests table
CREATE TABLE IF NOT EXISTS viewing_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_date DATE NOT NULL,
  requested_time TIME NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'cancelled', 'completed')),
  message TEXT,
  seller_notes TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE viewing_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own requests (as requester)" ON viewing_requests;
CREATE POLICY "Users can view their own requests (as requester)"
  ON viewing_requests FOR SELECT
  USING (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Users can view requests for their horses (as seller)" ON viewing_requests;
CREATE POLICY "Users can view requests for their horses (as seller)"
  ON viewing_requests FOR SELECT
  USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Users can create viewing requests" ON viewing_requests;
CREATE POLICY "Users can create viewing requests"
  ON viewing_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Requesters can update their own pending requests" ON viewing_requests;
CREATE POLICY "Requesters can update their own pending requests"
  ON viewing_requests FOR UPDATE
  USING (auth.uid() = requester_id AND status = 'pending')
  WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Sellers can update requests for their horses" ON viewing_requests;
CREATE POLICY "Sellers can update requests for their horses"
  ON viewing_requests FOR UPDATE
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Requesters can delete their own pending requests" ON viewing_requests;
CREATE POLICY "Requesters can delete their own pending requests"
  ON viewing_requests FOR DELETE
  USING (auth.uid() = requester_id AND status = 'pending');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_viewing_requests_horse_id ON viewing_requests(horse_id);
CREATE INDEX IF NOT EXISTS idx_viewing_requests_requester_id ON viewing_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_viewing_requests_seller_id ON viewing_requests(seller_id);
CREATE INDEX IF NOT EXISTS idx_viewing_requests_status ON viewing_requests(status);
CREATE INDEX IF NOT EXISTS idx_viewing_requests_requested_date ON viewing_requests(requested_date);
CREATE INDEX IF NOT EXISTS idx_viewing_requests_created_at ON viewing_requests(created_at DESC);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_viewing_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS viewing_requests_updated_at ON viewing_requests;
CREATE TRIGGER viewing_requests_updated_at
  BEFORE UPDATE ON viewing_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_viewing_requests_updated_at();

-- Trigger to set timestamp when status changes
CREATE OR REPLACE FUNCTION set_viewing_request_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    NEW.approved_at = NOW();
  ELSIF NEW.status = 'declined' AND OLD.status != 'declined' THEN
    NEW.declined_at = NOW();
  ELSIF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    NEW.cancelled_at = NOW();
  ELSIF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS viewing_request_status_timestamp ON viewing_requests;
CREATE TRIGGER viewing_request_status_timestamp
  BEFORE UPDATE ON viewing_requests
  FOR EACH ROW
  EXECUTE FUNCTION set_viewing_request_status_timestamp();

-- Prevent self-requests (can't request to view your own horse)
CREATE OR REPLACE FUNCTION prevent_self_viewing_request()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.requester_id = NEW.seller_id THEN
    RAISE EXCEPTION 'Cannot request to view your own horse';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_self_viewing_request ON viewing_requests;
CREATE TRIGGER check_self_viewing_request
  BEFORE INSERT ON viewing_requests
  FOR EACH ROW
  EXECUTE FUNCTION prevent_self_viewing_request();

-- ============================================================================
-- Reload schema cache
-- ============================================================================
NOTIFY pgrst, 'reload schema';
