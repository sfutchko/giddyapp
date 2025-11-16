-- =====================================================
-- SIMPLE TRIGGER TEST WITH EXPLICIT LOGGING
-- =====================================================

-- First, let's make sure we have the right horse ID and current price
SELECT id, name, price FROM horses WHERE name = 'Bens Big Horse';

-- Now update with a DIFFERENT value than before
UPDATE horses
SET price = 179999.00, updated_at = NOW()
WHERE name = 'Bens Big Horse';

-- Immediately check price_history
SELECT
  ph.*,
  h.name as horse_name
FROM price_history ph
JOIN horses h ON h.id = ph.horse_id
ORDER BY ph.created_at DESC
LIMIT 5;

-- Also check what the current price is now
SELECT id, name, price FROM horses WHERE name = 'Bens Big Horse';
