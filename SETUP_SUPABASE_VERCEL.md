# Supabase + Vercel Integration Setup Guide

This guide walks you through connecting your Alaq application to Supabase and deploying to Vercel.

---

## Part 1: Supabase Setup

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Enter project name: `alaq` (or your preferred name)
5. Set password (save it securely)
6. Select region closest to your users
7. Click "Create new project"

### Step 2: Get API Keys

Once your project is created:

1. Go to **Settings** → **API** (in sidebar)
2. Copy these values:
   - **Project URL**: `https://[project-ref].supabase.co`
   - **Anon Public Key**: `eyJ...` (starts with `sb_anon_`)
   - **Service Role Secret**: (for server-side operations)

### Step 3: Configure Authentication

1. Go to **Authentication** → **Providers**
2. Find **Google** and click to enable
3. You'll need to set up a Google OAuth app:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create new project or select existing
   - Enable OAuth 2.0
   - Create OAuth consent screen
   - Create OAuth 2.0 Credentials (Web application)
   - Add authorized redirect URI: `https://[project-ref].supabase.co/auth/v1/callback`
4. Copy Google Client ID and Client Secret
5. Paste into Supabase Google provider settings
6. Click Save

### Step 4: Create Database Tables

1. Go to **SQL Editor** in Supabase
2. Run these migrations:

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(255),
  teacher VARCHAR(50) DEFAULT 'zaid',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create hadith_translations table
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

-- Create indices for better query performance
CREATE INDEX idx_hadith_collection ON hadith_translations(collection);
CREATE INDEX idx_hadith_lang ON hadith_translations(lang);
CREATE INDEX idx_hadith_number ON hadith_translations(hadith_number);
CREATE INDEX idx_hadith_text ON hadith_translations USING GIN(to_tsvector('english', text));

-- Enable Row Level Security (optional but recommended)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hadith_translations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Hadith is readable by all"
  ON hadith_translations FOR SELECT
  USING (true);

-- Create profiles automatically on signup
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

-- Trigger function on user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### Step 5: Test Database Connection

In your local environment:

```bash
# Export environment variables (or add to .env)
export SUPABASE_URL="https://[project-ref].supabase.co"
export SUPABASE_PUBLISHABLE_KEY="sb_anon_..."
export SUPABASE_SERVICE_ROLE_KEY="sb_secret_..."

# Test connection
npm run dev
# Visit http://localhost:5173/auth and try signing up
```

---

## Part 2: Vercel Deployment

### Step 1: Update Environment File

Create `.env.local` in project root (never commit this):

```env
# Supabase
SUPABASE_URL="https://[project-ref].supabase.co"
SUPABASE_PUBLISHABLE_KEY="sb_anon_..."
VITE_SUPABASE_URL="https://[project-ref].supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_anon_..."

# Server-side only (keep secret)
SUPABASE_SERVICE_ROLE_KEY="sb_secret_..."

# Google OAuth (if needed)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

### Step 2: Push to GitHub

```bash
# Make sure .env.local is in .gitignore (it should be)
cat .gitignore | grep ".env"

# Commit your changes
git add .
git commit -m "Connect Supabase authentication and database"
git push origin main
```

### Step 3: Deploy to Vercel

**Option A: Using Vercel CLI**

```bash
npm install -g vercel

vercel
# Follow prompts:
# - Link to GitHub project
# - Set environment variables (same as .env.local)
# - Deploy!
```

**Option B: Using Vercel Dashboard**

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Set environment variables:
   - Add each variable from `.env.local`
   - Click "Deploy"

### Step 4: Configure Supabase OAuth Redirect

After deploying to Vercel:

1. Copy your Vercel deployment URL (e.g., `https://alaq.vercel.app`)
2. Go to Supabase → **Authentication** → **URL Configuration**
3. Add to "Redirect URLs":
   ```
   https://alaq.vercel.app/auth/callback
   http://localhost:3000/auth/callback
   ```
4. Save

---

## Part 3: Test Authentication Flow

### Test Email/Password Auth

1. Go to `https://your-deployment.vercel.app/auth`
2. Click "Create an account"
3. Enter email, password, and name
4. Check email for confirmation link
5. Verify and sign in

### Test Google OAuth

1. Go to `https://your-deployment.vercel.app/auth`
2. Click "Continue with Google"
3. Authorize with your Google account
4. Should redirect to home page and show profile

### Test Hadith Search

Create a server function route to test hadith database:

```typescript
// src/routes/api.hadith.ts
import { createAPIFileRoute } from '@tanstack/react-start/server'
import { getAvailableCollections } from '@/lib/database.functions'

export const Route = createAPIFileRoute('/api/hadith/collections')({
  GET: async () => {
    const collections = await getAvailableCollections()
    return { collections }
  }
})
```

---

## Part 4: Monitoring & Debugging

### Check Supabase Logs

In Supabase dashboard:
- **Auth** → **Users** - see all registered users
- **Database** → **Query Performance** - check slow queries
- **Logs** - view errors and events

### Check Vercel Logs

```bash
# View deployment logs
vercel logs

# View real-time logs
vercel logs --follow
```

### Common Issues & Solutions

#### OAuth Redirect Not Working
- ✅ Check redirect URLs in Supabase Settings
- ✅ Verify Google OAuth credentials are correct
- ✅ Ensure callback route exists: `/auth/callback.tsx`

#### "Missing Environment Variable"
- ✅ Check all vars are set in Vercel dashboard
- ✅ Redeploy after adding vars: `vercel --prod`
- ✅ Check variable names exactly match

#### Email Not Received
- ✅ Check spam folder
- ✅ In Supabase: **Auth** → **Providers** → **Email** (configure SMTP)
- ✅ For testing, use test email in development

#### Database Connection Error
- ✅ Verify SUPABASE_URL is correct
- ✅ Check SUPABASE_PUBLISHABLE_KEY starts with `sb_anon_`
- ✅ Ensure database is running (check Supabase dashboard)

---

## Part 5: Data Loading & Seeding

### Load Hadith Data

Use the admin client to bulk load hadith:

```typescript
// src/routes/api.admin.seed.ts
import { createAPIFileRoute } from '@tanstack/react-start/server'
import { bulkInsertHadith } from '@/lib/database.functions'

const SAMPLE_HADITH = [
  {
    collection: 'bukhari',
    hadith_number: 1,
    lang: 'en',
    text: 'The first hadith ever recorded',
  },
  // ... more hadith
]

export const Route = createAPIFileRoute('/api/admin/seed')({
  POST: async () => {
    const result = await bulkInsertHadith(SAMPLE_HADITH)
    return { success: true, count: result.count }
  }
})
```

Then call from client:

```bash
curl -X POST https://your-deployment.vercel.app/api/admin/seed
```

---

## Part 6: Security Checklist

Before going to production:

- [ ] Remove Lovable integration files
- [ ] Enable HTTPS everywhere
- [ ] Configure CORS properly
- [ ] Set up Row-Level Security (RLS) policies
- [ ] Enable request signing on sensitive endpoints
- [ ] Add rate limiting to auth endpoints
- [ ] Review Supabase RLS policies
- [ ] Set up monitoring (Sentry)
- [ ] Enable audit logging
- [ ] Test password reset flow
- [ ] Test OAuth disconnect/reconnect
- [ ] Verify bookmarks sync to database
- [ ] Test offline→online sync

---

## Next Steps

1. ✅ **Immediate**: Deploy to Vercel
2. ✅ **This week**: Load hadith data
3. ✅ **This sprint**: Implement bookmarks sync
4. ✅ **Before launch**: Complete security checklist

---

## Useful Commands

```bash
# Check env variables
echo $SUPABASE_URL

# Test Supabase connection
curl -X GET "https://[project].supabase.co/rest/v1/profiles" \
  -H "Authorization: Bearer $SUPABASE_PUBLISHABLE_KEY" \
  -H "apikey: $SUPABASE_PUBLISHABLE_KEY"

# View Vercel deployments
vercel list

# Rollback to previous deployment
vercel rollback

# Stream logs
vercel logs --tail
```

---

## Resources

- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [TanStack Start Docs](https://tanstack.com/start/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)

---

**Need help?** Check the project's SECURITY.md and TRD.md for more technical details.

