-- =====================================================
-- DIAGNOSE SCHEMA AND TRIGGER ISSUES
-- =====================================================

-- Check what schema the horses table is in
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_name = 'horses';

-- Check what schema the function is in
SELECT n.nspname as schema_name, p.proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'track_price_change';

-- Check the exact trigger definition
SELECT
  n.nspname as schema_name,
  c.relname as table_name,
  t.tgname as trigger_name,
  pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'horses'
  AND t.tgname = 'track_horse_price_changes';

-- Check if there are any other triggers on horses that might be interfering
SELECT
  tgname,
  tgenabled,
  pg_get_triggerdef(oid) as definition
FROM pg_trigger
WHERE tgrelid = 'horses'::regclass
  AND tgname NOT LIKE 'RI_ConstraintTrigger%'
ORDER BY tgname;
