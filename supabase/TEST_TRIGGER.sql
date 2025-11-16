-- =====================================================
-- TEST TRIGGER SETUP
-- =====================================================

-- First, let's see what's actually happening
SELECT
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'horses'
  AND trigger_name = 'track_horse_price_changes';

-- Check if the function exists and what it does
SELECT
  proname as function_name,
  prosecdef as is_security_definer,
  provolatile as volatility
FROM pg_proc
WHERE proname = 'track_price_change';

-- Try to manually call the function to see if there are any errors
-- We can't directly call a trigger function, but we can test the logic

-- Let's verify price_history table permissions
SELECT
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'price_history';

-- Check if there are any policies blocking inserts
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'price_history';

-- Let's try inserting directly into price_history to rule out permission issues
INSERT INTO price_history (
  horse_id,
  old_price,
  new_price,
  price_change,
  price_change_percent
) VALUES (
  '3b642e79-259e-4be1-85ab-2645e07b8331',
  234000.00,
  199999.00,
  -34001.00,
  -14.53
);

-- If that works, check the result
SELECT * FROM price_history ORDER BY created_at DESC LIMIT 1;
