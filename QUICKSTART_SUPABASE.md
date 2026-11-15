# Supabase + Vercel Integration - Quick Start

## ✅ What's Been Created

### 1. **Server Functions for Authentication** (`src/lib/auth.functions.ts`)
```typescript
// Auth operations (use from client via TanStack server functions)
- getCurrentSession()          // Get current user
- signInWithEmail()            // Email/password login
- signUpWithEmail()            // Email/password registration
- signOut()                    // Logout
- sendPasswordResetEmail()     // Password recovery
- updatePassword()             // Change password
- verifyOtp()                  // Email verification
- getUserProfile()             // Get user profile (requires auth)
- updateUserProfile()          // Update profile (requires auth)
```

### 2. **Server Functions for Database** (`src/lib/database.functions.ts`)
```typescript
// Hadith & Content operations
- getHadith()                  // Get specific hadith
- searchHadith()               // Full-text search
- getHadithByCollection()      // Browse collection
- getAvailableCollections()    // List all collections
- getAvailableLanguages()      // Languages per collection
- getHadithStats()             // Statistics
- upsertHadith()               // Add/update (admin)
- bulkInsertHadith()           // Bulk import (admin)
```

### 3. **Updated Authentication UI** (`src/routes/auth.tsx`)
- ✅ Removed Lovable auth imports
- ✅ Added native Supabase email/password auth
- ✅ Google OAuth integration
- ✅ OTP verification flow
- ✅ Password reset
- ✅ Teacher preference selection

### 4. **OAuth Callback Route** (`src/routes/auth.callback.tsx`)
- Handles Google OAuth redirect
- Auto-redirects to intended page

### 5. **Complete Setup Guide** (`SETUP_SUPABASE_VERCEL.md`)
- Step-by-step Supabase project creation
- Google OAuth configuration
- Database schema & migrations
- Vercel deployment instructions
- Troubleshooting guide

---

## 🚀 Quick Setup (5 minutes)

### For Local Development

```bash
# 1. Create .env.local with your Supabase credentials
cat > .env.local << 'EOF'
SUPABASE_URL="https://[your-project].supabase.co"
SUPABASE_PUBLISHABLE_KEY="sb_anon_..."
VITE_SUPABASE_URL="https://[your-project].supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_anon_..."
SUPABASE_SERVICE_ROLE_KEY="sb_secret_..."
EOF

# 2. Install fresh dependencies (without Lovable packages)
rm -rf node_modules package-lock.json
npm install

# 3. Start dev server
npm run dev

# 4. Go to http://localhost:5173/auth and test signup
```

### For Vercel Deployment

```bash
# 1. Push code to GitHub
git add -A
git commit -m "Add Supabase auth and database integration"
git push origin main

# 2. Connect to Vercel (one-time)
vercel link

# 3. Add environment variables to Vercel
vercel env add SUPABASE_URL
vercel env add SUPABASE_PUBLISHABLE_KEY
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_PUBLISHABLE_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY

# 4. Deploy
vercel --prod
```

---

## 📝 Key Environment Variables

**You need these in your Supabase project:**

| Variable | Where to Get | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Supabase → Settings → API | ✅ Yes |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase → Settings → API (starts with `sb_anon_`) | ✅ Yes |
| `VITE_SUPABASE_URL` | Same as SUPABASE_URL | ✅ Yes |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Same as SUPABASE_PUBLISHABLE_KEY | ✅ Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (starts with `sb_secret_`) | ⚠️ Server-side only |

**Never commit these to git!** Add to `.env.local` and `.gitignore`.

---

## 🔑 Database Schema

### Profiles Table
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,              -- User ID from auth
  display_name VARCHAR(255),        -- User's name
  teacher VARCHAR(50) DEFAULT 'zaid', -- Zaid or Zara
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Hadith Translations Table
```sql
CREATE TABLE hadith_translations (
  id UUID PRIMARY KEY,
  collection VARCHAR(100),         -- 'bukhari', 'muslim', etc.
  hadith_number INTEGER,           -- 1, 2, 3...
  lang VARCHAR(20),                -- 'en', 'ar', 'ur', etc.
  text TEXT,                       -- The actual hadith text
  model VARCHAR(50),               -- AI model (if AI-generated)
  created_at TIMESTAMP
);
```

---

## 🧪 Testing Flows

### Test 1: Email Signup
1. Go to `/auth`
2. Click "Create an account"
3. Enter: email, password (6+ chars), name
4. Choose Zaid or Zara
5. Click "Create account"
6. Check email for confirmation
7. Should auto-signin

### Test 2: Google OAuth
1. Go to `/auth`
2. Choose teacher (Zaid/Zara)
3. Click "Continue with Google"
4. Authorize with Google account
5. Should auto-signin and redirect

### Test 3: Signin
1. Go to `/auth`
2. Enter email and password
3. Click "Sign in"
4. Should redirect to home page

### Test 4: Hadith Search (after signin)
```bash
# Use browser console to test
const result = await getAvailableCollections()
console.log(result) // ['bukhari', 'muslim', ...]
```

---

## 📊 Database Operations

### Load Sample Hadith Data

```typescript
// Import test data
import { bulkInsertHadith } from '@/lib/database.functions'

const hadith = [
  {
    collection: 'bukhari',
    hadith_number: 1,
    lang: 'en',
    text: 'Actions are judged by intentions...'
  }
]

await bulkInsertHadith(hadith)
```

### Search Hadith

```typescript
import { searchHadith } from '@/lib/database.functions'

const results = await searchHadith({
  query: 'intention',
  collection: 'bukhari',
  language: 'en',
  limit: 20
})
```

### Get User Profile

```typescript
import { getUserProfile } from '@/lib/auth.functions'

const profile = await getUserProfile()
// { id: '...', display_name: 'Ahmed', teacher: 'zaid', ... }
```

---

## 🔐 Security Best Practices

✅ **Implemented:**
- Bearer token auth middleware (`attachSupabaseAuth`)
- Parameterized database queries (Drizzle ORM)
- Input validation with Zod
- CSRF protection
- Environment variables for secrets

⚠️ **Still TODO:**
- Security headers (CSP, X-Frame-Options, etc.)
- Rate limiting on auth endpoints
- Row-Level Security (RLS) policies
- Monitoring & error tracking (Sentry)

See `SECURITY.md` for full audit.

---

## 🎯 Next Steps

### Immediate (Today)
- [ ] Add Supabase credentials to `.env.local`
- [ ] Run `npm install` to remove Lovable packages
- [ ] Test auth flow locally
- [ ] Deploy to Vercel

### This Week
- [ ] Load real hadith data
- [ ] Test Google OAuth with real credentials
- [ ] Implement bookmarks sync
- [ ] Add security headers

### Before Launch
- [ ] Enable database RLS policies
- [ ] Set up monitoring (Sentry)
- [ ] Security penetration testing
- [ ] Load testing (1M users)

---

## 🐛 Common Issues & Fixes

### "Missing Supabase environment variables"
```bash
# Make sure .env.local exists
ls -la .env.local

# Check variables are set
echo $SUPABASE_URL
echo $SUPABASE_PUBLISHABLE_KEY
```

### "Invalid login credentials"
- ✅ Check email is lowercase: `email.toLowerCase()`
- ✅ Check password is at least 6 characters
- ✅ Verify email is confirmed (check inbox)

### "Redirect URI mismatch" (OAuth)
- Add callback URL to Supabase:
  - `https://[your-app].vercel.app/auth/callback`
  - `http://localhost:5173/auth/callback` (dev)

### "RLS policy violation"
- Check user_id matches in database query
- Verify RLS policies allow the operation

---

## 📚 Useful Files

```
src/
├── lib/
│   ├── auth.functions.ts      ← All auth server functions
│   └── database.functions.ts  ← All hadith/content server functions
├── routes/
│   ├── auth.tsx               ← Auth UI (signin/signup)
│   └── auth.callback.tsx      ← OAuth callback handler
├── integrations/supabase/
│   ├── client.ts              ← Client-side Supabase instance
│   ├── client.server.ts       ← Admin Supabase instance
│   ├── auth-middleware.ts     ← Bearer token validation
│   ├── auth-attacher.ts       ← Attach auth to requests
│   └── types.ts               ← Database type definitions
└── ...

Docs/
├── SETUP_SUPABASE_VERCEL.md  ← Complete setup guide
├── SECURITY.md                ← Security audit
├── ARCHITECTURE.md            ← System design
├── TRD.md                     ← Technical specs
└── ...
```

---

## 💬 Support

- Supabase docs: https://supabase.com/docs
- Vercel docs: https://vercel.com/docs
- TanStack Start: https://tanstack.com/start/docs
- This project: See SETUP_SUPABASE_VERCEL.md for troubleshooting

---

**Status**: 🟢 Ready to Deploy
- Auth system: ✅ Complete
- Database functions: ✅ Complete
- UI integration: ✅ Complete
- Deployment guide: ✅ Complete

Next: Add your Supabase credentials and deploy!
