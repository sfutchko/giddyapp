# View Counter Migration - MUST RUN

## Problem
- View counter shows 0
- Days on market shows 0

## Solution
The `view_count` column needs to be added to the horses table in Supabase.

## Steps to Fix

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/tibxubhjuuqldwvfelbn
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the contents of `/supabase/migrations/20250116000001_add_view_tracking.sql`
5. Click "Run" to execute the migration

## What this does:
- Adds `view_count` column to horses table (defaults to 0)
- Creates `increment_horse_views()` RPC function to safely increment views
- Grants permissions to authenticated and anonymous users

## After running:
- View counter will work
- Days on market will work (it uses created_at which should already exist)
- Similar horses will be clickable
- Documents will open in a nice modal instead of new tab
