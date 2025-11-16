-- =====================================================
-- FIX TRIGGER NOT FIRING
-- =====================================================

-- Drop the existing trigger
DROP TRIGGER IF EXISTS track_horse_price_changes ON horses;

-- Recreate it without the "OF price" specification
-- This will fire on ANY column update, but our function checks if price changed
CREATE TRIGGER track_horse_price_changes
  AFTER UPDATE ON horses
  FOR EACH ROW
  EXECUTE FUNCTION track_price_change();

-- Test it immediately
UPDATE horses SET price = 189999.00 WHERE name = 'Bens Big Horse';

-- Check if it worked
SELECT * FROM price_history ORDER BY created_at DESC LIMIT 3;
