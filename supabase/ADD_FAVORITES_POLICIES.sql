-- =====================================================
-- ADD RLS POLICIES FOR FAVORITES TABLE
-- =====================================================

-- Allow users to see their own favorites
CREATE POLICY "Users can view their own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to manage their own favorites
CREATE POLICY "Users can insert their own favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);

-- IMPORTANT: Allow horse owners to see who's watching their horses
-- This is needed for price drop notifications
CREATE POLICY "Horse owners can see who favorited their horses"
  ON favorites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM horses
      WHERE horses.id = favorites.horse_id
        AND horses.seller_id = auth.uid()
    )
  );

-- Verify policies were created
SELECT
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'favorites'
ORDER BY policyname;
