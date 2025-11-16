-- Add view_count column to horses table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'horses' AND column_name = 'view_count'
  ) THEN
    ALTER TABLE horses ADD COLUMN view_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create or replace the increment_horse_views function
CREATE OR REPLACE FUNCTION increment_horse_views(horse_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE horses
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = horse_id;
END;
$$;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION increment_horse_views(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_horse_views(UUID) TO anon;
