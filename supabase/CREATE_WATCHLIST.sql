-- =====================================================
-- WATCHLIST TABLE
-- =====================================================
-- This table allows users to save/favorite horses they're interested in
-- and optionally get notified when prices change

CREATE TABLE IF NOT EXISTS watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  horse_id UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  notify_price_change BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure user can only watch a horse once
  UNIQUE(user_id, horse_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_horse_id ON watchlist(horse_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_created_at ON watchlist(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- Users can view their own watchlist
CREATE POLICY "Users can view their own watchlist"
  ON watchlist FOR SELECT
  USING (auth.uid() = user_id);

-- Users can add horses to their watchlist
CREATE POLICY "Users can add to their watchlist"
  ON watchlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their watchlist items
CREATE POLICY "Users can update their watchlist"
  ON watchlist FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can remove from their watchlist
CREATE POLICY "Users can delete from their watchlist"
  ON watchlist FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get count of users watching a horse
CREATE OR REPLACE FUNCTION get_watch_count(p_horse_id UUID)
RETURNS INTEGER AS $$
DECLARE
  watch_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO watch_count
  FROM watchlist
  WHERE horse_id = p_horse_id;

  RETURN watch_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is watching a horse
CREATE OR REPLACE FUNCTION is_watching(p_user_id UUID, p_horse_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_watched BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM watchlist
    WHERE user_id = p_user_id
      AND horse_id = p_horse_id
  ) INTO is_watched;

  RETURN is_watched;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE watchlist IS 'Users can watch/favorite horses to track them';
COMMENT ON COLUMN watchlist.notify_price_change IS 'Whether to notify user when horse price changes';
COMMENT ON FUNCTION get_watch_count(UUID) IS 'Get number of users watching a specific horse';
COMMENT ON FUNCTION is_watching(UUID, UUID) IS 'Check if a user is watching a specific horse';
