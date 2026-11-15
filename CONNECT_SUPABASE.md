# 🚀 Connect Supabase to Alaq - Step by Step

## Step 1: Create Supabase Project

1. Go to **[supabase.com](https://supabase.com)**
2. Click **"New Project"**
3. Fill in:
   - **Organization**: Choose your org or create new
   - **Name**: `alaq`
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose one closest to you (India: Singapore/GCC)
4. Click **Create new project**
5. **Wait 2-3 minutes** for setup to complete

---

## Step 2: Get Your API Keys

Once project is ready:

1. Click **Settings** (⚙️ icon) in left sidebar
2. Click **API** 
3. Copy these values:

```
📌 Project URL (copy this):
https://[YOUR_PROJECT_REF].supabase.co

📌 Anon public key (copy this):  
sb_anon_your-key-here...
```

---

## Step 3: Set Up Google OAuth (Optional but Recommended)

1. In Supabase sidebar: **Authentication** → **Providers**
2. Click **Google**
3. Toggle to **Enable**
4. You'll need to set up Google OAuth in Google Cloud Console:

   a. Go to **[Google Cloud Console](https://console.cloud.google.com)**
   
   b. Create new project or select existing
   
   c. Go to **APIs & Services** → **OAuth consent screen**
   
   d. Fill in:
      - App name: Alaq
      - User support email: your email
      - Developer email: your email
   
   e. Click **Save and continue**
   
   f. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
   
   g. Choose **Web application**
   
   h. Add authorized redirect URI:
      ```
      https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback
      ```
   
   i. Copy **Client ID** and **Client Secret**
   
   j. Go back to Supabase Google provider settings
   
   k. Paste Client ID and Client Secret
   
   l. Click **Save**

---

## Step 4: Set Up Database Tables

1. In Supabase sidebar: **SQL Editor**
2. Click **New query**
3. Copy and paste this SQL:

```sql
-- ============================================
-- ALAQ DATABASE SETUP
-- ============================================

-- 1. Create profiles table (stores user data)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(255),
  teacher VARCHAR(50) DEFAULT 'zaid',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create hadith translations table
CREATE TABLE IF NOT EXISTS hadith_translations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection VARCHAR(100) NOT NULL,
  hadith_number INTEGER NOT NULL,
  lang VARCHAR(20) NOT NULL,
  text TEXT NOT NULL,
  model VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(collection, hadith_number, lang)
);

-- 3. Create indexes for fast search
CREATE INDEX IF NOT EXISTS idx_hadith_collection ON hadith_translations(collection);
CREATE INDEX IF NOT EXISTS idx_hadith_lang ON hadith_translations(lang);
CREATE INDEX IF NOT EXISTS idx_hadith_number ON hadith_translations(hadith_number);

-- 4. Enable Row Level Security (optional but recommended)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hadith_translations ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies
-- Anyone can read hadith
CREATE POLICY "Hadith is readable by all" ON hadith_translations 
  FOR SELECT USING (true);

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON profiles 
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE USING (auth.uid() = id);

-- 6. Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, teacher)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'display_name',
    COALESCE(NEW.raw_user_meta_data->>'teacher', 'zaid')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. Insert some sample hadith data
INSERT INTO hadith_translations (collection, hadith_number, lang, text, model) VALUES
('bukhari', 1, 'en', 'The first hadith: Actions are judged by intentions.", NULL),
('bukhari', 1, 'ur', 'پہلی حدیث: نیت کے مطابق عمل کا حکم دیا جاتا ہے۔', NULL),
('bukhari', 2, 'en', 'Whoever introduces a good practice will have its reward and that of its followers.', NULL),
('muslim', 1, 'en', 'In the name of Allah, the Most Gracious, the Most Merciful.', NULL);

-- Enable auth for your site
UPDATE auth.config SET site_url = 'https://your-site.vercel.app', extra_autoescape = false;
```

4. Click **Run** (or press Ctrl+Enter)

---

## Step 5: Update Your Local Environment

Now update `.env.local` with your actual Supabase values:

```bash
# Edit .env.local and replace with your actual values:
SUPABASE_URL="https://xyzabc-defg.supabase.co"
SUPABASE_PUBLISHABLE_KEY="sb_anon_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
VITE_SUPABASE_URL="https://xyzabc-defg.supabase.co"  
VITE_SUPABASE_PUBLISHABLE_KEY="sb_anon_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
SUPABASE_SERVICE_ROLE_KEY="sb_secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

---

## Step 6: Test Locally

```bash
# Install fresh dependencies
npm install

# Start dev server
npm run dev
```

Then open **http://localhost:5173/auth** and:
- ✅ Try creating an account
- ✅ Try signing in
- ✅ Try Google OAuth (if configured)

---

## Step 7: Deploy to Vercel

```bash
# Commit your code
git add .
git commit -m "Connect Supabase auth and database"

# Deploy
vercel --prod

# During deployment, add these environment variables in Vercel dashboard:
# - SUPABASE_URL
# - SUPABASE_PUBLISHABLE_KEY
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_PUBLISHABLE_KEY
# - SUPABASE_SERVICE_ROLE_KEY
```

---

## 🎉 You're Done!

Your Alaq app now has:
- ✅ User authentication (email/password)
- ✅ Google OAuth
- ✅ User profiles with teacher preference
- ✅ Hadith database ready for content
- ✅ Deployed on Vercel with Supabase!

---

## ❓ Need Help?

**Common Issues:**

1. **"Missing Supabase environment variables"**
   - Check .env.local file exists and has correct values

2. **Google OAuth not working**
   - Make sure redirect URL in Google Cloud Console matches Supabase settings

3. **Database errors**
   - Check SQL ran successfully in Supabase SQL Editor

4. **Email not sending**
   - In Supabase: Authentication → Providers → Email → Enable confirm email

---

**Questions?** Check SETUP_SUPABASE_VERCEL.md or ask in the chat!