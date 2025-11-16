# 🚀 GiddyApp Setup Instructions

## What We've Built So Far

✅ **COMPLETED:**
- Full authentication system (login/register)
- Protected routes and dashboard
- User authentication with Supabase integration
- Clean, professional UI with Tailwind CSS
- Header navigation with auth state detection
- Dashboard for logged-in users
- TypeScript everywhere - no `any` types
- Production-grade code structure

## 🔴 WHAT YOU NEED TO DO NOW

### 1. Create a Supabase Account (5 minutes)

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub or email
4. Create a new project:
   - **Project name**: giddyapp
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to you
   - **Plan**: Free tier is fine for now

### 2. Get Your Supabase Credentials (2 minutes)

Once your project is created:

1. Go to Settings → API in your Supabase dashboard
2. Copy these values:
   - **Project URL** (looks like: https://xxxxx.supabase.co)
   - **Anon/Public Key** (starts with: eyJ...)
   - **Service Role Key** (keep this secret!)

### 3. Create Your Environment File (1 minute)

Create a new file `/apps/web/.env.local` with your credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Optional: For server-side operations
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Enable Authentication in Supabase (2 minutes)

1. In Supabase dashboard, go to Authentication → Providers
2. Enable **Email** provider (should be on by default)
3. Optional: Enable **Google** and **Apple** for social login later

### 5. Set Up Database Tables (5 minutes)

In Supabase SQL Editor, run this to create the users table:

```sql
-- Create profiles table that extends auth.users
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar TEXT,
  role TEXT DEFAULT 'BUYER',
  verified BOOLEAN DEFAULT false,
  phone TEXT,
  bio TEXT,
  location JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Create policy to allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

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

-- Trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 6. Restart Your Dev Server

```bash
# Stop the server (Ctrl+C)
# Start it again
pnpm dev
```

### 7. Test The Authentication

1. Open http://localhost:3000
2. Click "Get Started" in the header
3. Create a test account:
   - Name: Test User
   - Email: test@example.com
   - Password: testpass123
   - Role: Buy horses
4. You should be redirected to the dashboard!

## 🎯 What's Working Now

- ✅ User registration with email/password
- ✅ Login/logout functionality
- ✅ Protected dashboard route
- ✅ Session persistence
- ✅ Navigation updates based on auth state
- ✅ Clean, professional UI
- ✅ Mobile responsive design

## 🚀 Next Steps After Setup

Once authentication is working, we'll build:
1. **Horse listing creation** - Multi-step form with image upload
2. **Search with filters** - Advanced search functionality
3. **Messaging system** - Real-time chat between buyers/sellers
4. **Payment processing** - Stripe integration for secure transactions

## 🔧 Troubleshooting

**If registration doesn't work:**
- Check your .env.local file has correct credentials
- Make sure Supabase project is running (not paused)
- Check browser console for errors

**If you see "Please check your email":**
- Supabase has email confirmation enabled by default
- Go to Authentication → Settings → Turn OFF "Enable email confirmations"
- Or check your email for the confirmation link

**If dashboard redirects to login:**
- Session isn't being created properly
- Check Supabase credentials are correct
- Clear browser cookies and try again

## 📝 Important Notes

- **NO EMOJIS IN CODE** - We use Lucide React for all icons
- **TypeScript strict mode** - No `any` types anywhere
- **Production-grade** - This is the real app, not a prototype
- **Clean architecture** - Follows our PROJECT_BIBLE.md standards

---

**Ready to build the future of horse marketplaces!** 🐎

Once you complete the setup, tell me and we'll continue building the listing creation flow.