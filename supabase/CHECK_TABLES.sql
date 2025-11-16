-- Check if both tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('favorites', 'watchlist')
ORDER BY table_name;

-- Check favorites table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'favorites'
ORDER BY ordinal_position;

-- Check watchlist table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'watchlist'
ORDER BY ordinal_position;

-- Check which table has data
SELECT 'favorites' as table_name, COUNT(*) as row_count FROM favorites
UNION ALL
SELECT 'watchlist' as table_name, COUNT(*) as row_count FROM watchlist;
