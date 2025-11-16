-- =====================================================
-- RECREATE FUNCTION WITHOUT SECURITY DEFINER
-- =====================================================

-- Drop and recreate the function without SECURITY DEFINER
DROP FUNCTION IF EXISTS track_price_change() CASCADE;

CREATE OR REPLACE FUNCTION track_price_change()
RETURNS TRIGGER AS $$
BEGIN
  RAISE NOTICE 'TRIGGER FIRED! Horse ID: %, OLD.price: %, NEW.price: %', NEW.id, OLD.price, NEW.price;

  -- Only track if price actually changed
  IF OLD IS NOT NULL
     AND OLD.price IS NOT NULL
     AND NEW.price IS NOT NULL
     AND OLD.price IS DISTINCT FROM NEW.price THEN

    RAISE NOTICE 'Price changed, inserting into price_history';

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

    RAISE NOTICE 'Insert successful!';
  ELSE
    RAISE NOTICE 'Price did not change, skipping';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS track_horse_price_changes ON horses;

CREATE TRIGGER track_horse_price_changes
  AFTER UPDATE ON horses
  FOR EACH ROW
  EXECUTE FUNCTION track_price_change();

-- Test immediately
UPDATE horses SET price = 149999.00 WHERE name = 'Bens Big Horse';

-- Check the result
SELECT * FROM price_history ORDER BY created_at DESC LIMIT 3;

-- Also show current horse price to confirm UPDATE worked
SELECT id, name, price FROM horses WHERE name = 'Bens Big Horse';
