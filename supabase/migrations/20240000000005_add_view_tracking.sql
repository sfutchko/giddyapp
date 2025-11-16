-- Add view tracking function
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_horse_views(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_horse_views(UUID) TO anon;
