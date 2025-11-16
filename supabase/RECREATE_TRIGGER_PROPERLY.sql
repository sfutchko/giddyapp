-- =====================================================
-- RECREATE TRIGGER WITH PROPER SETTINGS
-- =====================================================

-- Drop existing trigger
DROP TRIGGER IF EXISTS track_horse_price_changes ON horses;

-- Check the trigger configuration that might prevent it from firing
SELECT
  tgname,
  tgenabled,
  tgisinternal,
  tgtype,
  tgrelid::regclass as table_name
FROM pg_trigger
WHERE tgrelid = 'horses'::regclass;

-- Recreate with explicit ENABLE setting
CREATE TRIGGER track_horse_price_changes
  AFTER UPDATE ON horses
  FOR EACH ROW
  EXECUTE FUNCTION track_price_change();

-- Explicitly enable it
ALTER TABLE horses ENABLE TRIGGER track_horse_price_changes;

-- Verify it's enabled
SELECT
  tgname,
  tgenabled,
  tgtype
FROM pg_trigger
WHERE tgrelid = 'horses'::regclass
  AND tgname = 'track_horse_price_changes';

-- Now test with a real update
UPDATE horses SET price = 159999.00 WHERE name = 'Bens Big Horse';

-- Check result
SELECT * FROM price_history ORDER BY created_at DESC LIMIT 3;
