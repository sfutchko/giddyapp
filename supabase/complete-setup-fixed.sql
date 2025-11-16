-- IMPORTANT: This script assumes you already have a profiles table from Supabase Auth setup
-- We'll just add any missing columns to the existing profiles table

-- STEP 1: Add any missing columns to existing profiles table (if they don't exist)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- STEP 2: Create horses table (main table for horse listings)
CREATE TABLE IF NOT EXISTS horses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  breed TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('MARE', 'GELDING', 'STALLION')),
  height DECIMAL NOT NULL,
  weight DECIMAL,
  color TEXT NOT NULL,
  price DECIMAL NOT NULL,
  description TEXT NOT NULL,
  location JSONB NOT NULL,
  seller_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL CHECK (status IN ('DRAFT', 'ACTIVE', 'SOLD', 'INACTIVE')),
  metadata JSONB,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- STEP 3: Create horse_images table
CREATE TABLE IF NOT EXISTS horse_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  horse_id UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- STEP 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_horses_seller_id ON horses(seller_id);
CREATE INDEX IF NOT EXISTS idx_horses_status ON horses(status);
CREATE INDEX IF NOT EXISTS idx_horses_slug ON horses(slug);
CREATE INDEX IF NOT EXISTS idx_horse_images_horse_id ON horse_images(horse_id);

-- STEP 5: Enable Row Level Security (if not already enabled)
ALTER TABLE horses ENABLE ROW LEVEL SECURITY;
ALTER TABLE horse_images ENABLE ROW LEVEL SECURITY;

-- STEP 6: Create policies for horses table
DROP POLICY IF EXISTS "Horses are viewable by everyone" ON horses;
CREATE POLICY "Horses are viewable by everyone"
  ON horses FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create horses" ON horses;
CREATE POLICY "Authenticated users can create horses"
  ON horses FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Users can update own horses" ON horses;
CREATE POLICY "Users can update own horses"
  ON horses FOR UPDATE
  USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Users can delete own horses" ON horses;
CREATE POLICY "Users can delete own horses"
  ON horses FOR DELETE
  USING (auth.uid() = seller_id);

-- STEP 7: Create policies for horse_images table
DROP POLICY IF EXISTS "Horse images are viewable by everyone" ON horse_images;
CREATE POLICY "Horse images are viewable by everyone"
  ON horse_images FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Horse owners can manage images" ON horse_images;
CREATE POLICY "Horse owners can manage images"
  ON horse_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM horses
      WHERE horses.id = horse_images.horse_id
      AND horses.seller_id = auth.uid()
    )
  );

-- STEP 8: Create storage bucket for horse media (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  104857600, -- 100MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- STEP 9: Storage policies
DROP POLICY IF EXISTS "Anyone can view media" ON storage.objects;
CREATE POLICY "Anyone can view media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;
CREATE POLICY "Authenticated users can upload media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update own media" ON storage.objects;
CREATE POLICY "Users can update own media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "Users can delete own media" ON storage.objects;
CREATE POLICY "Users can delete own media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Done! The horses and horse_images tables are now created.
-- The existing profiles table is used for user/seller information.