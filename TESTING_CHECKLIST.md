# Testing Checklist for Horse Detail Panel Updates

## What Should Be Visible Now

### ✅ Safety Tips Section (ALWAYS VISIBLE)
- **Location**: At the bottom of the detail panel, above "Listing Stats"
- **Look for**: Amber-colored box with shield icon
- **Contains**: 3 safety tips with warning icons
- **Test**: Open any horse detail - this should ALWAYS show

### 📄 Documents Section (CONDITIONAL)
- **Visible when**: Horse has uploaded documents
- **Look for**: "Documents & Records" heading
- **Test**:
  1. Click on any horse that has documents
  2. Click a document card
  3. Should open modal overlay (NOT new window)
  4. Modal should show PDF preview or image
  5. Has download button

### ⭐ Seller Reviews (CONDITIONAL - Won't show yet)
- **Visible when**: Seller has reviews (tables don't exist yet)
- **Look for**: "Seller Reviews" heading with star ratings
- **Currently**: Hidden because database tables don't exist
- **Will show**: After you create `user_reputation` and `reviews` tables

### 🐴 Similar Horses (CONDITIONAL)
- **Visible when**: There are horses with same breed
- **Look for**: "Similar Horses" heading with 2x2 grid
- **Test**:
  1. Click on a horse
  2. Look for similar horses section
  3. Click on a similar horse
  4. Should switch to that horse (stay in popup)

### 👁️ View Counter (Needs Migration)
- **Location**: Bottom of panel in "Listing Stats"
- **Currently shows**: "0 views" (column doesn't exist)
- **Will work after**: Running the SQL migration
- **Look for**: Eye icon with view count

### 📅 Days on Market (Should work)
- **Location**: Bottom of panel in "Listing Stats"
- **Currently shows**: Number of days since created_at
- **Look for**: Calendar icon with "X days on market"

## How to Test

### 1. Hard Refresh Browser
```
Mac: Cmd + Shift + R
Windows: Ctrl + Shift + R
```

### 2. Open Browser Console
```
Mac: Cmd + Option + J
Windows: Ctrl + Shift + J
```

### 3. Click on a Horse
- Go to /horses/map
- Click any horse marker on the map

### 4. Look for Debug Logs
In console, you should see:
```
🐴 Horse data for: [Horse Name]
  - view_count: undefined (or a number)
  - created_at: [timestamp]
  - daysOnMarket: [number]
  - has documents: [number]
  - seller_id: [uuid]
```

### 5. Scroll Down in Detail Panel
- Safety Tips should be visible (amber box)
- Check for Documents, Similar Horses sections
- View counter and days on market at very bottom

## Known Issues

### ❌ View Counter Shows 0
**Why**: `view_count` column doesn't exist in database
**Fix**: Run the migration in `/supabase/migrations/20250116000001_add_view_tracking.sql`
**How**: Copy SQL file contents → Supabase Dashboard → SQL Editor → Run

### ❌ RPC Function Error (400)
**Why**: `increment_horse_views()` function doesn't exist
**Fix**: Same migration as above creates the function
**Error in console**: `Failed to load resource: the server responded with a status of 400`

### ⚠️ No Reviews Showing
**Why**: Database tables don't exist yet (`user_reputation`, `reviews`)
**Expected**: Section is hidden (not an error)
**Future**: Will show when tables are created

## What Changed from Before

### Before
- Documents opened in new tab/window
- No safety tips
- No similar horses
- No seller reviews section
- View counter and days on market not implemented

### After
- Documents open in beautiful modal overlay
- Safety tips always visible at bottom
- Similar horses clickable grid (if available)
- Seller reviews with star ratings (when data exists)
- View counter tracking (after migration)
- Days on market calculation
- Better debug logging

## If You Still Don't See Changes

1. **Check you're on the right page**: `/horses/map`
2. **Clear browser cache completely**
3. **Check console for errors**
4. **Verify dev server restarted**: Look for "✓ Compiled" messages
5. **Check the debug logs**: Should see 🐴 emoji in console
6. **Try different horse**: Some horses may not have documents/similar horses
