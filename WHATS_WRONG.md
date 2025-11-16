# What's Wrong & How to Fix

## 1. View Counter Shows 0

**Why**: The `view_count` column doesn't exist in your database yet.

**Fix**: Run this SQL in Supabase:

```sql
-- Add view_count column
ALTER TABLE horses ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Create increment function
CREATE OR REPLACE FUNCTION increment_horse_views(horse_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE horses
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = horse_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION increment_horse_views(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_horse_views(UUID) TO anon;
```

**How to run**:
1. Go to https://supabase.com/dashboard/project/tibxubhjuuqldwvfelbn/sql/new
2. Paste the SQL above
3. Click "Run"

## 2. Don't See Similar Horses

**This is NORMAL if**:
- You clicked on a horse that's the only one of its breed
- Example: If you have only 1 Quarter Horse, it won't show similar horses

**To test**:
- Click on a horse that shares a breed with other horses
- The section will only appear if there are 2+ horses of the same breed

## 3. Don't See Ratings

**This is EXPECTED**. The rating system is ready but the database tables don't exist yet:
- `user_reputation` table
- `reviews` table

This is NOT a bug - the section is intentionally hidden when there's no data.

## 4. What SHOULD Be Visible Always

### Safety Tips Section
- **Should ALWAYS show** on every horse
- Yellow/amber colored box
- Has a shield icon
- 3 bullet points about safety
- **Location**: Near the bottom, just above "Listing Stats"

### If you DON'T see Safety Tips:
1. Hard refresh browser (Cmd+Shift+R)
2. Clear browser cache completely
3. Check console for errors
4. The section starts at line 823 in horse-detail-panel.tsx

## Console Debug Output

When you click a horse, you should see in console:

```
🐴 Horse data for: [Horse Name]
  - view_count: undefined (will be 0 after migration)
  - created_at: 2025-01-15T... (should have a date)
  - daysOnMarket: [number] (should be > 0)
  - has documents: [number]
  - seller_id: [uuid]
```

## Quick Test Steps

1. **Hard refresh**: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. **Go to**: http://localhost:3000/horses/map
3. **Click any horse**
4. **Scroll to bottom** - you MUST see amber Safety Tips box
5. **Check console** - look for 🐴 emoji logs
6. **Report back**: What values do you see?

## Expected Behavior

| Feature | Should Show? | Why? |
|---------|-------------|------|
| Safety Tips | ✅ YES ALWAYS | Not conditional |
| Documents | ⚠️ ONLY IF horse has docs | Conditional |
| Similar Horses | ⚠️ ONLY IF same breed exists | Conditional |
| Seller Reviews | ❌ NO (tables don't exist) | Expected |
| View Counter | ❌ SHOWS 0 (no column) | Needs migration |
| Days on Market | ✅ SHOULD WORK | Uses created_at |
