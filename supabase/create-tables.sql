-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Create horses table
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

-- Create horse_images table
CREATE TABLE IF NOT EXISTS horse_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  horse_id UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_horses_seller_id ON horses(seller_id);
CREATE INDEX IF NOT EXISTS idx_horses_status ON horses(status);
CREATE INDEX IF NOT EXISTS idx_horses_slug ON horses(slug);
CREATE INDEX IF NOT EXISTS idx_horse_images_horse_id ON horse_images(horse_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE horses ENABLE ROW LEVEL SECURITY;
ALTER TABLE horse_images ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create policies for horses
CREATE POLICY "Horses are viewable by everyone"
  ON horses FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create horses"
  ON horses FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can update own horses"
  ON horses FOR UPDATE
  USING (auth.uid() = seller_id);

CREATE POLICY "Users can delete own horses"
  ON horses FOR DELETE
  USING (auth.uid() = seller_id);

-- Create policies for horse_images
CREATE POLICY "Horse images are viewable by everyone"
  ON horse_images FOR SELECT
  USING (true);

CREATE POLICY "Horse owners can manage images"
  ON horse_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM horses
      WHERE horses.id = horse_images.horse_id
      AND horses.seller_id = auth.uid()
    )
  );

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();