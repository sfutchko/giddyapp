-- GiddyApp Database Setup
-- Run this in Supabase SQL Editor

-- Create profiles table that extends auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar TEXT,
  role TEXT DEFAULT 'BUYER' CHECK (role IN ('BUYER', 'SELLER', 'BOTH', 'ADMIN')),
  verified BOOLEAN DEFAULT false,
  phone TEXT,
  bio TEXT,
  location JSONB,
  stripe_customer_id TEXT,
  stripe_seller_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    COALESCE(new.raw_user_meta_data->>'role', 'BUYER')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create horses table
CREATE TABLE IF NOT EXISTS horses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  breed TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 0),
  gender TEXT NOT NULL CHECK (gender IN ('MARE', 'GELDING', 'STALLION')),
  color TEXT NOT NULL,
  height DECIMAL(4,2) NOT NULL CHECK (height > 0),
  weight INTEGER CHECK (weight > 0),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  description TEXT NOT NULL,
  location JSONB NOT NULL,
  seller_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'PENDING', 'SOLD', 'REMOVED')),
  featured BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on horses
ALTER TABLE horses ENABLE ROW LEVEL SECURITY;

-- Policies for horses
CREATE POLICY "Anyone can view active horses"
  ON horses FOR SELECT
  USING (status = 'ACTIVE');

CREATE POLICY "Sellers can view own horses"
  ON horses FOR SELECT
  USING (seller_id = auth.uid());

CREATE POLICY "Sellers can create horses"
  ON horses FOR INSERT
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Sellers can update own horses"
  ON horses FOR UPDATE
  USING (seller_id = auth.uid());

CREATE POLICY "Sellers can delete own horses"
  ON horses FOR DELETE
  USING (seller_id = auth.uid());

-- Create horse_images table
CREATE TABLE IF NOT EXISTS horse_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  horse_id UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on horse_images
ALTER TABLE horse_images ENABLE ROW LEVEL SECURITY;

-- Policies for horse_images
CREATE POLICY "Anyone can view horse images"
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

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
  horse_id UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, horse_id)
);

-- Enable RLS on favorites
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Policies for favorites
CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own favorites"
  ON favorites FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own favorites"
  ON favorites FOR DELETE
  USING (user_id = auth.uid());

-- Create messages table for buyer-seller communication
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  recipient_id UUID NOT NULL REFERENCES profiles(id),
  horse_id UUID REFERENCES horses(id),
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies for messages
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Recipients can mark messages as read"
  ON messages FOR UPDATE
  USING (recipient_id = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_horses_updated_at BEFORE UPDATE ON horses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_horses_seller_id ON horses(seller_id);
CREATE INDEX idx_horses_status ON horses(status);
CREATE INDEX idx_horses_breed ON horses(breed);
CREATE INDEX idx_horses_price ON horses(price);
CREATE INDEX idx_horse_images_horse_id ON horse_images(horse_id);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_horse_id ON favorites(horse_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);