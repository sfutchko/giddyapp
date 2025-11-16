-- Check if view tracking function exists
SELECT
  proname as function_name,
  prokind as function_type
FROM pg_proc
WHERE proname = 'increment_horse_views';

-- Check horses table has view_count column
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'horses'
AND column_name IN ('view_count', 'created_at');

-- Check current view counts
SELECT id, name, view_count, created_at
FROM horses
ORDER BY created_at DESC
LIMIT 5;
