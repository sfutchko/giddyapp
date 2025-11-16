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
