-- =====================================================
-- DEBUG HORSES TABLE STRUCTURE
-- =====================================================

-- Check the exact structure of the horses table
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'horses'
ORDER BY ordinal_position;

-- Check what triggers are on the horses table
SELECT
  trigger_name,
  event_manipulation,
  action_timing,
  action_orientation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'horses';

-- Check if the trigger function exists and can be called
SELECT
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
WHERE p.proname = 'track_price_change';

-- Let's try to see if triggers are enabled on the table
SELECT
  tgname as trigger_name,
  tgenabled as enabled,
  tgtype as trigger_type
FROM pg_trigger
WHERE tgrelid = 'horses'::regclass
  AND tgname NOT LIKE 'RI_ConstraintTrigger%';
