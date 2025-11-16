-- =====================================================
-- PRICE CHANGE NOTIFICATIONS SYSTEM
-- =====================================================
-- This system tracks price changes and sends notifications
-- to users watching horses when prices drop

-- =====================================================
-- 1. PRICE HISTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  old_price DECIMAL(10, 2) NOT NULL,
  new_price DECIMAL(10, 2) NOT NULL,
  price_change DECIMAL(10, 2) NOT NULL, -- Negative for price drop
  price_change_percent DECIMAL(5, 2) NOT NULL, -- Percentage change
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_price_history_horse_id ON price_history(horse_id);
CREATE INDEX IF NOT EXISTS idx_price_history_changed_at ON price_history(changed_at DESC);

-- =====================================================
-- 2. TRIGGER TO TRACK PRICE CHANGES
-- =====================================================
CREATE OR REPLACE FUNCTION track_price_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track if price actually changed
  IF OLD.price IS DISTINCT FROM NEW.price THEN
    INSERT INTO price_history (
      horse_id,
      old_price,
      new_price,
      price_change,
      price_change_percent
    ) VALUES (
      NEW.id,
      OLD.price,
      NEW.price,
      NEW.price - OLD.price,
      ROUND(((NEW.price - OLD.price) / OLD.price * 100)::NUMERIC, 2)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to horses table
DROP TRIGGER IF EXISTS track_horse_price_changes ON horses;
CREATE TRIGGER track_horse_price_changes
  AFTER UPDATE ON horses
  FOR EACH ROW
  EXECUTE FUNCTION track_price_change();

-- =====================================================
-- 3. NOTIFY WATCHERS ON PRICE DROP
-- =====================================================
CREATE OR REPLACE FUNCTION notify_watchers_on_price_drop()
RETURNS TRIGGER AS $$
DECLARE
  watcher RECORD;
  horse_record RECORD;
BEGIN
  -- Only notify on price drops (not increases)
  IF NEW.price_change < 0 THEN

    -- Get horse details
    SELECT * INTO horse_record
    FROM horses
    WHERE id = NEW.horse_id;

    -- Find all watchers who have price notifications enabled
    FOR watcher IN
      SELECT w.user_id
      FROM watchlist w
      WHERE w.horse_id = NEW.horse_id
        AND w.notify_price_change = true
    LOOP
      -- Create notification for each watcher
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        horse_id,
        action_url,
        metadata
      ) VALUES (
        watcher.user_id,
        'price_change',
        'Price Drop Alert!',
        horse_record.name || ' is now $' || NEW.new_price || ' (was $' || NEW.old_price || ') - Save $' || ABS(NEW.price_change) || '!',
        NEW.horse_id,
        '/horses/' || horse_record.slug,
        jsonb_build_object(
          'old_price', NEW.old_price,
          'new_price', NEW.new_price,
          'price_change', NEW.price_change,
          'price_change_percent', NEW.price_change_percent,
          'horse_name', horse_record.name,
          'horse_slug', horse_record.slug
        )
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to price_history table
DROP TRIGGER IF EXISTS notify_price_drop ON price_history;
CREATE TRIGGER notify_price_drop
  AFTER INSERT ON price_history
  FOR EACH ROW
  EXECUTE FUNCTION notify_watchers_on_price_drop();

-- =====================================================
-- 4. ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Anyone can view price history
CREATE POLICY "Price history is viewable by everyone"
  ON price_history FOR SELECT
  USING (true);

-- Only system can insert price history (via trigger)
CREATE POLICY "Price history is managed by system"
  ON price_history FOR INSERT
  WITH CHECK (false);

-- =====================================================
-- 5. HELPER FUNCTIONS
-- =====================================================

-- Get price history for a horse
CREATE OR REPLACE FUNCTION get_horse_price_history(
  p_horse_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  old_price DECIMAL,
  new_price DECIMAL,
  price_change DECIMAL,
  price_change_percent DECIMAL,
  changed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ph.id,
    ph.old_price,
    ph.new_price,
    ph.price_change,
    ph.price_change_percent,
    ph.changed_at
  FROM price_history ph
  WHERE ph.horse_id = p_horse_id
  ORDER BY ph.changed_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get lowest price for a horse
CREATE OR REPLACE FUNCTION get_horse_lowest_price(p_horse_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  lowest_price DECIMAL;
BEGIN
  SELECT MIN(new_price) INTO lowest_price
  FROM price_history
  WHERE horse_id = p_horse_id;

  -- If no history, get current price
  IF lowest_price IS NULL THEN
    SELECT price INTO lowest_price
    FROM horses
    WHERE id = p_horse_id;
  END IF;

  RETURN lowest_price;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get highest price for a horse
CREATE OR REPLACE FUNCTION get_horse_highest_price(p_horse_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  highest_price DECIMAL;
BEGIN
  SELECT MAX(new_price) INTO highest_price
  FROM price_history
  WHERE horse_id = p_horse_id;

  -- If no history, get current price
  IF highest_price IS NULL THEN
    SELECT price INTO highest_price
    FROM horses
    WHERE id = p_horse_id;
  END IF;

  RETURN highest_price;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if horse has had recent price drop
CREATE OR REPLACE FUNCTION has_recent_price_drop(
  p_horse_id UUID,
  p_days INT DEFAULT 7
)
RETURNS BOOLEAN AS $$
DECLARE
  has_drop BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM price_history
    WHERE horse_id = p_horse_id
      AND price_change < 0
      AND changed_at > NOW() - (p_days || ' days')::INTERVAL
  ) INTO has_drop;

  RETURN has_drop;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. COMMENTS
-- =====================================================
COMMENT ON TABLE price_history IS 'Tracks all price changes for horses';
COMMENT ON FUNCTION track_price_change() IS 'Automatically logs price changes when horses.price is updated';
COMMENT ON FUNCTION notify_watchers_on_price_drop() IS 'Sends notifications to watchers when price drops';
COMMENT ON FUNCTION get_horse_price_history(UUID, INT) IS 'Get price change history for a specific horse';
COMMENT ON FUNCTION get_horse_lowest_price(UUID) IS 'Get the lowest price a horse has ever been listed at';
COMMENT ON FUNCTION get_horse_highest_price(UUID) IS 'Get the highest price a horse has ever been listed at';
COMMENT ON FUNCTION has_recent_price_drop(UUID, INT) IS 'Check if horse has had a price drop in the last N days';

-- =====================================================
-- DONE!
-- =====================================================
-- After running this SQL:
-- 1. Price changes will be automatically tracked
-- 2. Watchers will receive notifications on price drops
-- 3. Price history can be displayed on horse detail pages
-- 4. Helper functions available for price analytics
