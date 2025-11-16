-- Drop the old trigger and function
DROP TRIGGER IF EXISTS horse_price_change_trigger ON horses;
DROP FUNCTION IF EXISTS track_horse_price_change();

-- Confirm what's left
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'horses'
ORDER BY trigger_name;
