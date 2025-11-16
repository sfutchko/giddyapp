-- =====================================================
-- DROP ALL PRICE NOTIFICATION OBJECTS
-- =====================================================
-- Run this FIRST to clean up everything

-- Drop all triggers
DROP TRIGGER IF EXISTS notify_price_drop ON price_history CASCADE;
DROP TRIGGER IF EXISTS track_horse_price_changes ON horses CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS notify_watchers_on_price_drop() CASCADE;
DROP FUNCTION IF EXISTS track_price_change() CASCADE;
DROP FUNCTION IF EXISTS get_horse_price_history(UUID, INT) CASCADE;
DROP FUNCTION IF EXISTS get_horse_lowest_price(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_horse_highest_price(UUID) CASCADE;
DROP FUNCTION IF EXISTS has_recent_price_drop(UUID, INT) CASCADE;

-- Drop the table
DROP TABLE IF EXISTS price_history CASCADE;

-- Confirmation
SELECT 'All price notification objects dropped successfully!' AS status;
