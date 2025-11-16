# Debugging Status - Competition History & Seller Profile

## What I Just Did

I've added enhanced debug logging to help us understand where the competition history data is actually stored in the database.

### Changes Made:

1. **Enhanced Debug Logging in Map Search** (`map-search-content.tsx:156-160`)
   - Now logs the `metadata` object structure from the first horse
   - Shows `seller_id` to verify it's populated
   - This will help us see where competition history is stored

2. **Enhanced Debug Logging in Horse Detail Panel** (`horse-detail-panel.tsx:309-313`)
   - Now logs the full `metadata` object when you click a horse
   - This will show us the actual structure of the metadata JSON

3. **Added Profile Error Logging** (`map-search-content.tsx:189-191`)
   - Now logs the exact error when profile fetches fail
   - Will help diagnose RLS policy issues

## What to Do Now

1. **Hard refresh your browser**: `Cmd+Shift+R` (Mac)
2. **Go to**: http://localhost:3000/horses/map
3. **Open browser console** (Cmd+Option+J)
4. **Look for these new debug logs**:

### When Page Loads:
```
📋 First horse metadata: {...}
📋 First horse seller_id: [uuid]
```

### When You Click on "big Ben":
```
🐴 Horse data for: big Ben
  - seller_id: [uuid]
  - metadata: {...}  <-- THIS IS THE KEY!
  - view_count: [number]
  - profiles: [object or null]
```

### If Profile Fetch Fails:
```
❌ Profile fetch error for seller_id: [uuid] {...error details...}
```

## What We're Looking For

The key question is: **Where is the competition history data stored?**

Looking at the database fields list from your earlier console log, we know:
- `competition_experience` is NOT a top-level field
- The horses table HAS a `metadata` field

So the competition data MUST be inside the `metadata` JSON object.

**Please paste the output of the `metadata` object** from the console when you click on "big Ben". It should look something like:

```javascript
metadata: {
  competitionHistory: "Won Reserve Champion at...",
  // OR maybe
  competition_experience: "Won Reserve Champion at...",
  // OR something else entirely
}
```

## Known Issues We're Investigating

1. **Competition History Not Showing**
   - Need to see metadata structure to fix this

2. **Seller Profile/Bio Not Showing**
   - Getting 400 errors on profiles fetch
   - Likely RLS policy blocking the query
   - Will see exact error with new logging

## Next Steps

Once you paste the console output showing what's in the `metadata` object, I'll:
1. Update the competition history section to read from the correct location
2. Fix the profiles RLS policy issue
3. Get both features working properly!
