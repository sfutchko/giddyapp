-- Enhanced Messaging System
-- Adds file sharing and automated responses to existing messaging

-- ============================================
-- MESSAGE ATTACHMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,

  -- File Info
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'image', 'pdf', 'document', 'video'
  file_size INTEGER NOT NULL, -- bytes
  mime_type TEXT NOT NULL,

  -- Storage
  storage_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,

  -- Preview/Thumbnail
  thumbnail_url TEXT,

  -- Metadata
  uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUTOMATED RESPONSES (for sellers)
-- ============================================
CREATE TABLE IF NOT EXISTS automated_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Trigger Conditions
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('keyword', 'new_message', 'after_hours', 'quick_reply')),
  keywords TEXT[], -- For keyword-based triggers
  is_active BOOLEAN DEFAULT true,

  -- Response
  response_title TEXT,
  response_message TEXT NOT NULL,

  -- Timing
  delay_minutes INTEGER DEFAULT 0, -- Delay before sending (0 = immediate)
  active_hours_only BOOLEAN DEFAULT false, -- Only send during business hours

  -- Business Hours (if active_hours_only = true)
  business_hours_start TIME,
  business_hours_end TIME,
  business_days INTEGER[], -- 0=Sunday, 1=Monday, etc.

  -- Stats
  times_triggered INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUTO RESPONSE LOG (tracks when auto-responses were sent)
-- ============================================
CREATE TABLE IF NOT EXISTS auto_response_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automated_response_id UUID REFERENCES automated_responses(id) ON DELETE CASCADE NOT NULL,
  original_message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  sent_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,

  sent_to UUID REFERENCES auth.users(id) NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MESSAGE READ RECEIPTS (enhanced)
-- ============================================
-- Note: messages table already has is_read field
-- This extends it with detailed read tracking

CREATE TABLE IF NOT EXISTS message_read_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  read_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  read_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(message_id, read_by)
);

-- ============================================
-- VIDEO CALL SESSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS video_call_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Participants
  initiated_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  participant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Associated with
  horse_id UUID REFERENCES horses(id) ON DELETE SET NULL,
  conversation_id UUID, -- Can link to message thread

  -- Call Details
  room_id TEXT NOT NULL UNIQUE, -- From video provider (Agora/Daily.co)
  room_token TEXT, -- Access token for the room

  -- Status
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'ended', 'cancelled', 'missed')),

  -- Timing
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  -- Recording (if enabled)
  recording_url TEXT,
  recording_enabled BOOLEAN DEFAULT false,

  -- Metadata
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_message_attachments_message ON message_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_message_attachments_uploaded_by ON message_attachments(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_automated_responses_user ON automated_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_automated_responses_active ON automated_responses(is_active);

CREATE INDEX IF NOT EXISTS idx_auto_response_log_response ON auto_response_log(automated_response_id);
CREATE INDEX IF NOT EXISTS idx_auto_response_log_original_message ON auto_response_log(original_message_id);

CREATE INDEX IF NOT EXISTS idx_read_receipts_message ON message_read_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_read_receipts_user ON message_read_receipts(read_by);

CREATE INDEX IF NOT EXISTS idx_video_calls_initiated_by ON video_call_sessions(initiated_by);
CREATE INDEX IF NOT EXISTS idx_video_calls_participant ON video_call_sessions(participant_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_status ON video_call_sessions(status);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Message Attachments
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attachments in their messages" ON message_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages
      WHERE messages.id = message_id
      AND (messages.sender_id = auth.uid() OR messages.recipient_id = auth.uid())
    )
  );

CREATE POLICY "Users can upload attachments to their messages" ON message_attachments
  FOR INSERT WITH CHECK (
    auth.uid() = uploaded_by AND
    EXISTS (
      SELECT 1 FROM messages
      WHERE messages.id = message_id
      AND messages.sender_id = auth.uid()
    )
  );

-- Automated Responses
ALTER TABLE automated_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own auto-responses" ON automated_responses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create auto-responses" ON automated_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own auto-responses" ON automated_responses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own auto-responses" ON automated_responses
  FOR DELETE USING (auth.uid() = user_id);

-- Auto Response Log
ALTER TABLE auto_response_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view auto-response logs for their responses" ON auto_response_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM automated_responses
      WHERE automated_responses.id = automated_response_id
      AND automated_responses.user_id = auth.uid()
    )
  );

-- Read Receipts
ALTER TABLE message_read_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view read receipts for their messages" ON message_read_receipts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages
      WHERE messages.id = message_id
      AND (messages.sender_id = auth.uid() OR messages.recipient_id = auth.uid())
    )
  );

CREATE POLICY "Users can mark messages as read" ON message_read_receipts
  FOR INSERT WITH CHECK (auth.uid() = read_by);

-- Video Call Sessions
ALTER TABLE video_call_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view their video call sessions" ON video_call_sessions
  FOR SELECT USING (
    auth.uid() = initiated_by OR auth.uid() = participant_id
  );

CREATE POLICY "Users can create video call sessions" ON video_call_sessions
  FOR INSERT WITH CHECK (auth.uid() = initiated_by);

CREATE POLICY "Participants can update call sessions" ON video_call_sessions
  FOR UPDATE USING (
    auth.uid() = initiated_by OR auth.uid() = participant_id
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to check if auto-response should be sent
CREATE OR REPLACE FUNCTION should_send_auto_response(
  p_user_id UUID,
  p_message_text TEXT,
  p_sender_id UUID
)
RETURNS TABLE (
  response_id UUID,
  response_message TEXT,
  delay_minutes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ar.id,
    ar.response_message,
    ar.delay_minutes
  FROM automated_responses ar
  WHERE ar.user_id = p_user_id
    AND ar.is_active = true
    AND (
      -- Keyword trigger
      (ar.trigger_type = 'keyword' AND ar.keywords && string_to_array(lower(p_message_text), ' '))
      OR
      -- New message trigger (from first-time senders)
      (ar.trigger_type = 'new_message' AND NOT EXISTS (
        SELECT 1 FROM messages m
        WHERE m.sender_id = p_sender_id
        AND m.recipient_id = p_user_id
        AND m.created_at < NOW() - INTERVAL '30 days'
      ))
      OR
      -- After hours trigger
      (ar.trigger_type = 'after_hours'
       AND ar.active_hours_only = true
       AND (
         EXTRACT(HOUR FROM NOW()) < EXTRACT(HOUR FROM ar.business_hours_start)
         OR EXTRACT(HOUR FROM NOW()) >= EXTRACT(HOUR FROM ar.business_hours_end)
       ))
    )
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Update automated response stats when triggered
CREATE OR REPLACE FUNCTION update_auto_response_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE automated_responses
  SET
    times_triggered = times_triggered + 1,
    last_triggered_at = NOW(),
    updated_at = NOW()
  WHERE id = NEW.automated_response_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_auto_response_stats
AFTER INSERT ON auto_response_log
FOR EACH ROW
EXECUTE FUNCTION update_auto_response_stats();

-- Create read receipt when message is marked as read
CREATE OR REPLACE FUNCTION auto_create_read_receipt()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_read = true AND (OLD.is_read IS NULL OR OLD.is_read = false) THEN
    INSERT INTO message_read_receipts (message_id, read_by)
    VALUES (NEW.id, NEW.recipient_id)
    ON CONFLICT (message_id, read_by) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_create_read_receipt
AFTER UPDATE ON messages
FOR EACH ROW
WHEN (NEW.is_read IS DISTINCT FROM OLD.is_read)
EXECUTE FUNCTION auto_create_read_receipt();
