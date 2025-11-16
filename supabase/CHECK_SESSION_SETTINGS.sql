-- =====================================================
-- CHECK SESSION AND TRIGGER SETTINGS
-- =====================================================

-- Check if triggers are disabled at session level
SHOW session_replication_role;

-- Check current user and roles
SELECT current_user, session_user;

-- Try to enable triggers if they're disabled
SET session_replication_role = 'origin';

-- Verify the setting changed
SHOW session_replication_role;

-- Now try the update again
UPDATE horses SET price = 139999.00 WHERE name = 'Bens Big Horse';

-- Check if it worked
SELECT * FROM price_history ORDER BY created_at DESC LIMIT 3;

-- Verify horse price updated
SELECT id, name, price FROM horses WHERE name = 'Bens Big Horse';
