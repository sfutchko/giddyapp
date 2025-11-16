-- ============================================================================
-- GIDDYAPP PHASE 4 MIGRATIONS
-- Run this file in your Supabase SQL Editor to apply all Phase 4 features
-- ============================================================================

-- ============================================================================
-- MIGRATION 1: Block and Report Users
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

-- Create user_reports table
CREATE TABLE IF NOT EXISTS user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL CHECK (category IN (
    'spam',
    'harassment',
    'inappropriate_content',
    'scam',
    'fake_listing',
    'impersonation',
    'other'
  )),
  description TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blocked_users
CREATE POLICY "Users can view their own blocks"
  ON blocked_users FOR SELECT
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users can create blocks"
  ON blocked_users FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete their own blocks"
  ON blocked_users FOR DELETE
  USING (auth.uid() = blocker_id);

-- RLS Policies for user_reports
CREATE POLICY "Users can view their own reports"
  ON user_reports FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports"
  ON user_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Admins can view all reports (assuming admin role exists in profiles)
CREATE POLICY "Admins can view all reports"
  ON user_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update reports"
  ON user_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Indexes for performance
CREATE INDEX idx_blocked_users_blocker_id ON blocked_users(blocker_id);
CREATE INDEX idx_blocked_users_blocked_id ON blocked_users(blocked_id);
CREATE INDEX idx_user_reports_reporter_id ON user_reports(reporter_id);
CREATE INDEX idx_user_reports_reported_id ON user_reports(reported_id);
CREATE INDEX idx_user_reports_status ON user_reports(status);
CREATE INDEX idx_user_reports_created_at ON user_reports(created_at DESC);

-- Trigger for updated_at on user_reports
CREATE OR REPLACE FUNCTION update_user_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_reports_updated_at
  BEFORE UPDATE ON user_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_user_reports_updated_at();

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

CREATE TRIGGER check_self_block
  BEFORE INSERT ON blocked_users
  FOR EACH ROW
  EXECUTE FUNCTION prevent_self_block();

-- Prevent self-reporting
CREATE OR REPLACE FUNCTION prevent_self_report()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reporter_id = NEW.reported_id THEN
    RAISE EXCEPTION 'Cannot report yourself';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_self_report
  BEFORE INSERT ON user_reports
  FOR EACH ROW
  EXECUTE FUNCTION prevent_self_report();

-- ============================================================================
-- MIGRATION 2: Message Templates
-- ============================================================================

-- Create message_templates table
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) CHECK (category IN (
    'greeting',
    'availability',
    'scheduling',
    'pricing',
    'details',
    'closing',
    'other'
  )),
  is_default BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own templates"
  ON message_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own templates"
  ON message_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
  ON message_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
  ON message_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_message_templates_user_id ON message_templates(user_id);
CREATE INDEX idx_message_templates_category ON message_templates(category);
CREATE INDEX idx_message_templates_usage_count ON message_templates(usage_count DESC);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_message_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER message_templates_updated_at
  BEFORE UPDATE ON message_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_message_templates_updated_at();

-- Insert some default templates for new users (optional)
-- These will be created when a user first accesses templates
CREATE OR REPLACE FUNCTION create_default_templates_for_user(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO message_templates (user_id, title, content, category, is_default) VALUES
    (p_user_id, 'Greeting - First Contact', 'Hi! Thanks for your interest in [horse name]. I''d be happy to answer any questions you have. When would be a good time for you to visit?', 'greeting', true),
    (p_user_id, 'Availability Confirmation', 'Yes, [horse name] is still available! Would you like to schedule a viewing?', 'availability', true),
    (p_user_id, 'Schedule Viewing', 'Great! I have availability on [day] at [time]. Does that work for you? The address is [location].', 'scheduling', true),
    (p_user_id, 'Price Discussion', 'The asking price is $[price]. I''m open to discussing the details once you''ve had a chance to meet [horse name] in person.', 'pricing', true),
    (p_user_id, 'Send Details', 'I can send you more information including veterinary records, training history, and additional photos. What would be most helpful?', 'details', true),
    (p_user_id, 'Thank You', 'Thank you for visiting! Please let me know if you have any other questions. I look forward to hearing from you.', 'closing', true)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION 3: Viewing Requests
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
CREATE POLICY "Users can view their own requests (as requester)"
  ON viewing_requests FOR SELECT
  USING (auth.uid() = requester_id);

CREATE POLICY "Users can view requests for their horses (as seller)"
  ON viewing_requests FOR SELECT
  USING (auth.uid() = seller_id);

CREATE POLICY "Users can create viewing requests"
  ON viewing_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Requesters can update their own pending requests"
  ON viewing_requests FOR UPDATE
  USING (auth.uid() = requester_id AND status = 'pending')
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Sellers can update requests for their horses"
  ON viewing_requests FOR UPDATE
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Requesters can delete their own pending requests"
  ON viewing_requests FOR DELETE
  USING (auth.uid() = requester_id AND status = 'pending');

-- Indexes
CREATE INDEX idx_viewing_requests_horse_id ON viewing_requests(horse_id);
CREATE INDEX idx_viewing_requests_requester_id ON viewing_requests(requester_id);
CREATE INDEX idx_viewing_requests_seller_id ON viewing_requests(seller_id);
CREATE INDEX idx_viewing_requests_status ON viewing_requests(status);
CREATE INDEX idx_viewing_requests_requested_date ON viewing_requests(requested_date);
CREATE INDEX idx_viewing_requests_created_at ON viewing_requests(created_at DESC);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_viewing_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

CREATE TRIGGER check_self_viewing_request
  BEFORE INSERT ON viewing_requests
  FOR EACH ROW
  EXECUTE FUNCTION prevent_self_viewing_request();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- All Phase 4 tables have been created:
-- 1. blocked_users & user_reports (Block/Report feature)
-- 2. message_templates (Message Templates feature)
-- 3. viewing_requests (Viewing Requests feature)
-- ============================================================================
