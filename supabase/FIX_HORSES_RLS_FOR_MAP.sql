-- Check current RLS policies on horses table
SELECT
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'horses';

-- Drop the policy if it exists, then create it
DROP POLICY IF EXISTS "Anyone can view horses" ON horses;

-- Add policy to allow anyone (including anonymous users) to view horses
CREATE POLICY "Anyone can view horses"
  ON horses FOR SELECT
  USING (true);

-- Verify the policy was created
SELECT
  policyname,
  cmd,
  roles,
  permissive
FROM pg_policies
WHERE tablename = 'horses'
ORDER BY cmd, policyname;
