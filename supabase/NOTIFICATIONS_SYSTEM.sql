-- ============================================================================
-- COMPREHENSIVE NOTIFICATION SYSTEM
-- ============================================================================
-- This creates a production-ready notification system with:
-- - In-app notifications
-- - Email notifications
-- - Push notifications (future)
-- - User preferences
-- - Price change tracking
-- - Notification templates
-- ============================================================================

-- ============================================================================
-- 1. NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Notification content
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'message', 'offer', 'offer_accepted', 'offer_rejected', 'offer_countered',
    'price_change', 'listing_sold', 'listing_expired', 'viewing_request',
    'viewing_approved', 'viewing_declined', 'review', 'system', 'favorite_listing_update'
  )),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,

  -- Related entities (nullable for flexibility)
  horse_id UUID REFERENCES horses(id) ON DELETE CASCADE,
  offer_id UUID REFERENCES offers(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  viewing_request_id UUID REFERENCES viewing_requests(id) ON DELETE CASCADE,

  -- Metadata for rendering
  metadata JSONB DEFAULT '{}', -- Store additional data like image URLs, links, etc.
  action_url TEXT, -- Where to navigate when clicked

  -- Status tracking
  is_read BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  -- Delivery tracking
  sent_via_email BOOLEAN DEFAULT FALSE,
  sent_via_push BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,
  push_sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true); -- Allow system to create notifications for any user

-- ============================================================================
-- 2. NOTIFICATION PREFERENCES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- In-app notification preferences
  in_app_messages BOOLEAN DEFAULT TRUE,
  in_app_offers BOOLEAN DEFAULT TRUE,
  in_app_viewing_requests BOOLEAN DEFAULT TRUE,
  in_app_price_changes BOOLEAN DEFAULT TRUE,
  in_app_reviews BOOLEAN DEFAULT TRUE,
  in_app_system BOOLEAN DEFAULT TRUE,

  -- Email notification preferences
  email_messages BOOLEAN DEFAULT TRUE,
  email_offers BOOLEAN DEFAULT TRUE,
  email_viewing_requests BOOLEAN DEFAULT TRUE,
  email_price_changes BOOLEAN DEFAULT TRUE,
  email_reviews BOOLEAN DEFAULT TRUE,
  email_system BOOLEAN DEFAULT TRUE,
  email_marketing BOOLEAN DEFAULT FALSE,

  -- Push notification preferences (for future mobile app)
  push_messages BOOLEAN DEFAULT TRUE,
  push_offers BOOLEAN DEFAULT TRUE,
  push_viewing_requests BOOLEAN DEFAULT TRUE,
  push_price_changes BOOLEAN DEFAULT FALSE,
  push_reviews BOOLEAN DEFAULT TRUE,

  -- Digest settings
  email_digest_frequency VARCHAR(20) DEFAULT 'daily' CHECK (email_digest_frequency IN ('instant', 'daily', 'weekly', 'never')),

  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_timezone VARCHAR(50) DEFAULT 'America/New_York',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own preferences" ON notification_preferences;
CREATE POLICY "Users can view their own preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own preferences" ON notification_preferences;
CREATE POLICY "Users can update their own preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own preferences" ON notification_preferences;
CREATE POLICY "Users can insert their own preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_updated_at();

-- ============================================================================
-- 3. PRICE HISTORY TABLE (for price change tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  old_price DECIMAL(10, 2) NOT NULL,
  new_price DECIMAL(10, 2) NOT NULL,
  price_change DECIMAL(10, 2) GENERATED ALWAYS AS (new_price - old_price) STORED,
  price_change_percent DECIMAL(5, 2) GENERATED ALWAYS AS (
    CASE
      WHEN old_price > 0 THEN ((new_price - old_price) / old_price * 100)
      ELSE 0
    END
  ) STORED,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for price history
CREATE INDEX IF NOT EXISTS idx_price_history_horse_id ON price_history(horse_id);
CREATE INDEX IF NOT EXISTS idx_price_history_changed_at ON price_history(changed_at DESC);

-- Enable RLS
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy - anyone can view price history
DROP POLICY IF EXISTS "Anyone can view price history" ON price_history;
CREATE POLICY "Anyone can view price history"
  ON price_history FOR SELECT
  USING (true);

-- System can insert price changes
DROP POLICY IF EXISTS "System can insert price changes" ON price_history;
CREATE POLICY "System can insert price changes"
  ON price_history FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 4. TRIGGER: Track price changes on horses table
-- ============================================================================

CREATE OR REPLACE FUNCTION track_horse_price_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track if price actually changed
  IF NEW.price IS DISTINCT FROM OLD.price THEN
    INSERT INTO price_history (horse_id, old_price, new_price)
    VALUES (NEW.id, OLD.price, NEW.price);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS horse_price_change_trigger ON horses;
CREATE TRIGGER horse_price_change_trigger
  AFTER UPDATE ON horses
  FOR EACH ROW
  WHEN (OLD.price IS DISTINCT FROM NEW.price)
  EXECUTE FUNCTION track_horse_price_change();

-- ============================================================================
-- 5. FUNCTION: Create notification helper
-- ============================================================================

CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type VARCHAR,
  p_title VARCHAR,
  p_message TEXT,
  p_horse_id UUID DEFAULT NULL,
  p_offer_id UUID DEFAULT NULL,
  p_message_id UUID DEFAULT NULL,
  p_viewing_request_id UUID DEFAULT NULL,
  p_action_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id, type, title, message,
    horse_id, offer_id, message_id, viewing_request_id,
    action_url, metadata
  ) VALUES (
    p_user_id, p_type, p_title, p_message,
    p_horse_id, p_offer_id, p_message_id, p_viewing_request_id,
    p_action_url, p_metadata
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. FUNCTION: Notify watchers of price change
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_price_change()
RETURNS TRIGGER AS $$
DECLARE
  v_horse_name VARCHAR;
  v_watcher RECORD;
BEGIN
  -- Get horse name
  SELECT name INTO v_horse_name FROM horses WHERE id = NEW.horse_id;

  -- Notify all watchers who have price change notifications enabled
  FOR v_watcher IN
    SELECT DISTINCT f.user_id
    FROM favorites f
    WHERE f.horse_id = NEW.horse_id
      AND f.notify_price_change = TRUE
  LOOP
    -- Create notification
    PERFORM create_notification(
      p_user_id := v_watcher.user_id,
      p_type := 'price_change',
      p_title := 'Price Change Alert',
      p_message := format('%s price changed from $%s to $%s (%s%%)',
        v_horse_name,
        TO_CHAR(NEW.old_price, 'FM999,999.00'),
        TO_CHAR(NEW.new_price, 'FM999,999.00'),
        TO_CHAR(NEW.price_change_percent, 'FM990.0')
      ),
      p_horse_id := NEW.horse_id,
      p_action_url := '/horses/' || (SELECT slug FROM horses WHERE id = NEW.horse_id),
      p_metadata := jsonb_build_object(
        'old_price', NEW.old_price,
        'new_price', NEW.new_price,
        'price_change', NEW.price_change,
        'price_change_percent', NEW.price_change_percent
      )
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS price_change_notification_trigger ON price_history;
CREATE TRIGGER price_change_notification_trigger
  AFTER INSERT ON price_history
  FOR EACH ROW
  EXECUTE FUNCTION notify_price_change();

-- ============================================================================
-- 7. FUNCTION: Mark all notifications as read
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notifications
  SET is_read = TRUE, read_at = NOW()
  WHERE user_id = p_user_id AND is_read = FALSE;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. FUNCTION: Get unread notification count
-- ============================================================================

CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM notifications
    WHERE user_id = p_user_id AND is_read = FALSE AND is_archived = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. Add notify_price_change column to favorites if not exists
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'favorites' AND column_name = 'notify_price_change'
  ) THEN
    ALTER TABLE favorites ADD COLUMN notify_price_change BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

-- ============================================================================
-- Reload schema cache
-- ============================================================================
NOTIFY pgrst, 'reload schema';
