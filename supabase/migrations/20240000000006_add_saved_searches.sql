-- Create saved_searches table
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}',
  notify_on_match BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- Users can read their own saved searches
CREATE POLICY "Users can view own saved searches"
  ON saved_searches
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own saved searches
CREATE POLICY "Users can create own saved searches"
  ON saved_searches
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own saved searches
CREATE POLICY "Users can update own saved searches"
  ON saved_searches
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own saved searches
CREATE POLICY "Users can delete own saved searches"
  ON saved_searches
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX idx_saved_searches_user_id ON saved_searches(user_id);
CREATE INDEX idx_saved_searches_created_at ON saved_searches(created_at DESC);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_saved_searches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER saved_searches_updated_at
  BEFORE UPDATE ON saved_searches
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_searches_updated_at();
