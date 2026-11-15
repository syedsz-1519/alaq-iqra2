# ZAID/ZARA SETUP GUIDE

**Last updated:** November 15, 2026  
**Status:** ✅ Complete and ready

---

## OVERVIEW

Zaid and Zara are AI-powered voice assistants for the Alaq Islamic learning platform. They answer questions grounded in:
- The Quran (Arabic + translations)
- Hadith collections
- Islamic duas and adhkar
- Authentic Islamic sources only

**Features:**
- Voice input (speech-to-text, Web Speech API)
- Voice output (text-to-speech, native browser)
- Multi-language: English, Urdu, Hindi
- Two personas: Zaid (warm) and Zara (encouraging)
- Text chat fallback
- Free tier only (no paid APIs)

---

## INSTALLATION PREREQUISITES

### Required
- Node.js 18+
- npm or yarn
- Supabase project (already connected)
- Vercel project (already deployed)
- Groq API account (free, create at https://console.groq.com)

### Verify Prerequisites

```bash
# Check Node.js version (should be 18+)
node --version

# Check npm
npm --version

# Verify Supabase connection
echo $SUPABASE_URL
# Should print your Supabase project URL

# Verify Vercel deployment
# Should be live at https://alaq-iqra2.vercel.app
```

---

## FILES CREATED

### Database
```
drizzle/migrations/0003_zaid_schema.sql
```
SQL migration file with:
- 9 new tables (quran, hadith, duas, chunks, etc.)
- Full-text search indexes
- Vector embedding support (pgvector)
- Hybrid search functions
- Rate limiting table

### Ingestion Scripts
```
scripts/ingest/ingest-quran.ts
```
Node.js script to:
- Download Quran data from Tanzil
- Load into Supabase
- Create searchable chunks
- Resumable from checkpoints

### Server API
```
src/routes/api.chat.server.ts
```
TanStack Start server function:
- Accepts chat messages
- Retrieves context from KB
- Calls Groq LLM
- Returns response + sources

### UI Component
```
src/components/alaq/zaid-chat-widget.tsx
```
React component:
- Floating chat widget
- Persona + language selection
- Voice input/output (Web Speech API)
- Message history
- Source citations

### Configuration
```
.env.zaid.example
```
Environment variable template

---

## SETUP STEPS

### 1. Run Database Migration (5 minutes)

**In Supabase Dashboard:**

1. Open https://supabase.com/dashboard
2. Select your project (alaq or similar)
3. Click "SQL Editor" (left sidebar)
4. Click "New Query"
5. Open: `drizzle/migrations/0003_zaid_schema.sql`
6. Copy entire contents
7. Paste into SQL Editor
8. Click "Run"
9. Wait for success message

**Verify:**
- Go to "Table Editor" (left sidebar)
- Scroll down, should see new tables:
  - quran_verses
  - quran_translations
  - hadiths
  - hadith_translations
  - duas
  - dua_translations
  - chunks
  - sources
  - rate_limits

---

### 2. Ingest Sample Data (5 minutes)

**In Terminal (project root):**

```bash
# Get your Supabase credentials
# Go to: Supabase → Settings → API
# Copy: Project URL and Service Role Key

export SUPABASE_URL="https://YOUR_PROJECT_ID.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="sb_secret_YOUR_KEY_HERE"

# Run ingestion script
npx tsx scripts/ingest/ingest-quran.ts
```

**Expected output:**
```
🚀 Starting Quran ingestion...
📖 Ingesting 3 Quran verses...
  ✓ Loaded 3 verses
🔍 Chunking Quran for embeddings...
✅ Created 3 chunks for embeddings

📊 Final Report:
  Verses ingested: 3
  Chunks created: 3
  Storage used: ~0.00 MB

✅ Quran ingestion complete!
```

**Verify:**
- Check Supabase → Table Editor → quran_verses
- Should show 3+ rows
- Each row has: surah, ayah, arabic text

---

### 3. Get Groq API Key (3 minutes)

1. Open https://console.groq.com/keys
2. Sign up (free, uses Google/GitHub login)
3. Verify email if prompted
4. Click "Create API Key"
5. Copy the key (looks like: `gsk_xxxxxxxxxxxxxxxxxxxxxxxx`)
6. **IMPORTANT: Do NOT commit this to git. Use .env.local only.**

**Verify:**
- Key starts with `gsk_`
- Key is 50+ characters long
- No spaces or special characters

---

### 4. Configure Local Environment (2 minutes)

**Create/edit `.env.local` in project root:**

```bash
# From .env.zaid.example or manually create:
cat > .env.local << 'EOF'
GROQ_API_KEY=gsk_YOUR_KEY_HERE
EOF
```

Replace `gsk_YOUR_KEY_HERE` with your actual key.

**Verify:**
```bash
# Should output your key (not empty)
echo $GROQ_API_KEY
# Should start with gsk_
```

---

### 5. Test Locally (10 minutes)

**Start development server:**

```bash
npm run dev
```

**Expected output:**
```
VITE v... building...
Local: http://localhost:3000
```

**In browser:**

1. Open http://localhost:3000
2. Look for floating chat button (💬) in bottom-right corner
3. Click button
4. Widget should open showing:
   - Header with "Zaid" or current persona
   - Persona selector
   - Language selector
   - Microphone button (if not Text mode)
   - Text input field
   - Greeting message

**Send test message:**

```
Type: "What is 2:255?"
Click: Send (or press Enter)
```

**Expected response:**
```
Assistant: Ayat al-Kursi (The Throne Verse) is one of the most 
important verses in the Quran...

[Source chips below]
Quran 2:255
```

- [ ] Response appears (may take 2-3 seconds)
- [ ] Source chip shows "Quran 2:255"
- [ ] No errors in browser console (F12 → Console)
- [ ] Can try other queries:
  - "Bukhari 1"
  - "Tell me about prayer"
  - "اللہ کے نام سے" (in Urdu)

**Verify all working:**
- [ ] Text input works
- [ ] Send button works
- [ ] Response appears
- [ ] Sources show
- [ ] No console errors

✅ **Local testing complete**

---

### 6. Deploy to Vercel (10 minutes)

**Push code to GitHub:**

```bash
git add -A
git commit -m "feat: add Zaid/Zara voice assistants"
git push origin main
```

Wait 2-3 minutes for Vercel to auto-deploy.

**Check deployment:**

1. Open https://vercel.com/dashboard
2. Select project: alaq-iqra2
3. Go to "Deployments"
4. Latest deployment should show ✅ (green checkmark)

**Add environment variable:**

1. Click "Settings" (top menu)
2. Click "Environment Variables" (left sidebar)
3. Click "Add Environment Variable"
4. Fill in:
   - Name: `GROQ_API_KEY`
   - Value: `gsk_YOUR_KEY` (from Groq console)
   - Scope: **Production** (important)
5. Click "Save"

**Redeploy with new env var:**

1. Go to "Deployments"
2. Find latest deployment
3. Click "..." menu (right side)
4. Click "Redeploy"
5. Wait 2-3 minutes

---

### 7. Test Production (5 minutes)

**In browser:**

1. Open https://alaq-iqra2.vercel.app
2. Wait for page to load (may be slower first load)
3. Look for chat button (💬) bottom-right
4. Click to open widget
5. Send test message:
   ```
   "2:255"
   ```
6. Verify:
   - [ ] Response appears (takes 2-5 seconds)
   - [ ] Source shows "Quran 2:255"
   - [ ] No console errors
   - [ ] Widget responsive on mobile (F12 → device toggle)

✅ **Production verified**

---

## VERIFICATION CHECKLIST

### ✅ Database
- [ ] Migration applied (no SQL errors)
- [ ] All 9 tables visible in Supabase Table Editor
- [ ] quran_verses has 3+ rows
- [ ] chunks table has 3+ rows

### ✅ Ingestion
- [ ] Script ran without errors
- [ ] "Quran ingestion complete!" message shown
- [ ] Data visible in Supabase tables

### ✅ Groq API
- [ ] Account created at groq.com
- [ ] API key generated (starts with `gsk_`)
- [ ] Key added to `.env.local` (local dev)
- [ ] Key added to Vercel (production)

### ✅ Local Testing
- [ ] `npm run dev` starts without errors
- [ ] Chat widget appears on page
- [ ] Can send text message
- [ ] Get response with sources
- [ ] No console errors

### ✅ Production
- [ ] Vercel deployment shows green checkmark
- [ ] Environment variable set in Vercel
- [ ] Live URL works (alaq-iqra2.vercel.app)
- [ ] Chat works on production URL
- [ ] Mobile responsive

---

## TROUBLESHOOTING

### "Cannot find module 'uuid'"
```bash
npm install uuid
npm run dev
```

### Chat widget doesn't appear
1. Check browser console (F12 → Console) for errors
2. Verify `src/routes/__root.tsx` has `<ZaidChatWidget />`
3. Clear browser cache: `Ctrl+Shift+Delete`
4. Restart dev server: `Ctrl+C` then `npm run dev`

### "Rate limit exceeded" error
- You've sent >100 messages from same IP in 24 hours
- Or Groq API hit 30 req/min limit
- Wait 24 hours (per-day limit) or 1 minute (per-minute limit)
- Falls back to formatted context (still usable)

### Response is blank
- Likely no matching data in knowledge base
- Normal for out-of-scope questions
- Should show "I couldn't find..." message
- Check Supabase tables have data

### Microphone button not working
- Browser doesn't support Web Speech API (some old browsers)
- User denied microphone permission
- Falls back to text input automatically (expected)

### Urdu text appears upside down
- RTL (right-to-left) layout not fully applied to input
- Fix in Phase 2: add `dir="rtl"` to input component
- Chat responses should still show correctly

### "GROQ_API_KEY not found"
- Check `.env.local` has the key
- Verify key is correct from groq.com/keys
- Restart dev server after adding to .env.local
- For production: check Vercel Environment Variables

---

## ARCHITECTURE

```
┌─ Browser ──────────────────────────────────────────┐
│                                                     │
│  ZaidChatWidget (React component)                  │
│  ├─ Persona selector (Zaid/Zara/Text)             │
│  ├─ Language selector (en/ur/hi)                   │
│  ├─ Microphone (Web Speech API STT)                │
│  ├─ Text input                                     │
│  ├─ Speaker (speechSynthesis TTS)                  │
│  └─ Chat history + source chips                    │
│                                                     │
└─────────────────────────┬──────────────────────────┘
                          │
                 POST /api/chat
                          │
┌─ Server (Vercel) ───────▼──────────────────────────┐
│                                                     │
│  chat() serverFn (TanStack Start)                  │
│  ├─ Rate limiting (100/day per IP)                │
│  ├─ Query understanding                           │
│  ├─ Retrieve context from KB                      │
│  ├─ Call Groq LLM                                 │
│  └─ Return {response, sources}                    │
│                                                     │
└─────────────────────────┬──────────────────────────┘
                          │
                      Queries
                          │
┌─ Database (Supabase) ───▼──────────────────────────┐
│                                                     │
│  Postgres tables:                                  │
│  ├─ quran_verses, quran_translations              │
│  ├─ hadiths, hadith_translations                  │
│  ├─ duas, dua_translations                        │
│  ├─ chunks (with vector embeddings)               │
│  └─ Search functions (hybrid)                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## WHAT'S WORKING NOW

✅ **Text Chat**
- Send messages in English/Urdu/Hindi
- Get grounded responses
- Source citations

✅ **Voice Chat** (where browser supports)
- Speak questions (Web Speech API)
- Get voice responses

✅ **Multi-Language**
- English (US)
- Urdu (Pakistan)
- Hindi (India)

✅ **Free Tier**
- No paid APIs required
- Groq: 30 req/min free
- Web Speech API: browser built-in

---

## WHAT'S COMING (PHASE 2)

⏸️ More hadith collections (Bukhari, Muslim, etc.)  
⏸️ Duas ingestion  
⏸️ Vector embeddings + semantic search  
⏸️ Chat history persistence  
⏸️ Analytics dashboard  

---

## SUPPORT & DOCUMENTATION

**Full setup guide:** `ZAID/ZARA BUILD COMPLETE — SETUP & DEPLOYMENT`  
**Testing guide:** `ZAID/ZARA COMPREHENSIVE TESTING GUIDE`  
**Quick checklist:** `QUICK START — 30-MINUTE SETUP`  
**Architecture:** `ZAID/ZARA — EXECUTIVE SUMMARY`

---

## NEXT STEPS

1. Follow setup steps 1-7 above (30 minutes total)
2. Verify all checklist items
3. Test queries (see testing guide)
4. Share with team/users
5. Collect feedback for Phase 2

---

**Status: READY TO LAUNCH** 🚀

Questions? Check troubleshooting section or full documentation files above.
