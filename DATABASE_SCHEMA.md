# Alaq Database Schema Documentation

**Last Updated**: November 15, 2026  
**Version**: 1.0 (Complete)  
**Environment**: PostgreSQL 14+ (Supabase)

---

## Overview

The Alaq database is designed to support an Islamic learning platform with:
- User authentication and profiles
- Qur'an content (Arabic + multiple translations)
- Hadith collections (5+ compilations)
- Islamic duas and adhkar
- AI-powered chat with grounded responses (Zaid/Zara assistants)
- Multi-language support (English, Urdu, Hindi)
- Hybrid search (full-text + vector embeddings)

**Total Estimated Storage**: ~41 MB (fits Supabase 500 MB free tier)

---

## Migration Timeline

| Migration | Date | Purpose | Tables |
|-----------|------|---------|--------|
| `0000_profiles.sql` | Nov 2024 | User authentication & profiles | profiles |
| `0001_hadith_translations.sql` | Nov 2024 | Hadith cache | hadith_translations |
| `0002_profiles_teacher_choice.sql` | Nov 2024 | Teacher persona selection | profiles (extended) |
| `0003_zaid_schema.sql` | Nov 2026 | Voice assistants KB | 9 new tables |

---

## 1. Authentication Tables

### `auth.users` (Supabase Built-in)
```sql
-- Managed by Supabase Auth
id uuid PRIMARY KEY
email text UNIQUE
encrypted_password text
email_confirmed_at timestamp with time zone
raw_user_meta_data jsonb  -- {'display_name', 'teacher', ...}
created_at timestamp with time zone
updated_at timestamp with time zone
```

**Access**: Via Supabase Auth SDK  
**RLS**: Managed by Supabase  
**Indexes**: (email), (id)

---

## 2. User Profiles

### `profiles` (Migration 0000 + 0002)
```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  teacher text NOT NULL DEFAULT 'zaid' CHECK (teacher IN ('zaid', 'zara')),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_id ON profiles(id);

GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
```

**Triggers**:
- `profiles_touch_updated_at` — Auto-update `updated_at` on every change
- `on_auth_user_created` — Auto-create profile when user signs up

**Functions**:
```sql
handle_new_user()        -- Creates profile on sign-up, reads teacher preference
touch_updated_at()       -- Updates timestamp
```

**RLS Policies**: Strict — users can only access their own profile  
**Use Cases**: Display name, teacher/persona selection, user preferences

---

## 3. Hadith Cache (Legacy)

### `hadith_translations` (Migration 0001)
```sql
CREATE TABLE hadith_translations (
  collection text NOT NULL,
  hadith_number integer NOT NULL,
  lang text NOT NULL,
  text text NOT NULL,
  model text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT NOW(),
  PRIMARY KEY (collection, hadith_number, lang)
);

GRANT SELECT ON hadith_translations TO anon, authenticated;
GRANT ALL ON hadith_translations TO service_role;

ALTER TABLE hadith_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hadith translations public read"
  ON hadith_translations FOR SELECT
  TO anon, authenticated USING (true);
```

**Purpose**: Cache for hadith translations (deprecated, replaced by Migration 0003)  
**Replaced by**: `hadiths` + `hadith_translations` (Migration 0003)  
**Keep for**: Backward compatibility, gradual migration

---

## 4. Sources (Attribution & Licensing)

### `sources` (Migration 0003)
```sql
CREATE TABLE sources (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  license TEXT NOT NULL,
  attribution TEXT NOT NULL,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sources_name ON sources(name);

GRANT SELECT ON sources TO anon, authenticated;
GRANT ALL ON sources TO service_role;

ALTER TABLE sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sources public read" ON sources
  FOR SELECT TO anon, authenticated USING (true);
```

**Approved Sources**:
```sql
INSERT INTO sources (name, license, attribution, url) VALUES
  ('Tanzil Quran', 'CC-BY-3.0', 'Tanzil.net - Quran Text', 'https://tanzil.net'),
  ('Pickthall Translation', 'Public Domain', 'Muhammad Marmaduke Pickthall', 'https://legacy.quran.com'),
  ('Sahih Bukhari', 'CC-BY-4.0', 'GitHub Islamic Texts', 'https://github.com/islamicsoftware'),
  ('Sahih Muslim', 'CC-BY-4.0', 'GitHub Islamic Texts', 'https://github.com/islamicsoftware'),
  ('Jami at-Tirmidhi', 'CC-BY-4.0', 'GitHub Islamic Texts', 'https://github.com/islamicsoftware'),
  ('Sunan an-Nasai', 'CC-BY-4.0', 'GitHub Islamic Texts', 'https://github.com/islamicsoftware'),
  ('Sunan Abu Dawood', 'CC-BY-4.0', 'GitHub Islamic Texts', 'https://github.com/islamicsoftware'),
  ('AlAdhan Duas', 'CC-BY', 'AlAdhan Islamic API', 'https://aladhan.com');
```

**Use**: Every response cites which source provided the data  
**Compliance**: Ensures proper attribution and license compliance

---

## 5. Qur'an Tables

### `quran_verses` (Migration 0003)
```sql
CREATE TABLE quran_verses (
  id SERIAL PRIMARY KEY,
  surah INTEGER NOT NULL,
  ayah INTEGER NOT NULL,
  arabic TEXT NOT NULL,
  juz INTEGER,
  page INTEGER,
  source_id INTEGER REFERENCES sources(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(surah, ayah)
);

CREATE INDEX idx_quran_verses_surah_ayah ON quran_verses(surah, ayah);
CREATE INDEX idx_quran_verses_juz ON quran_verses(juz);
CREATE INDEX idx_quran_verses_page ON quran_verses(page);

GRANT SELECT ON quran_verses TO anon, authenticated;
GRANT ALL ON quran_verses TO service_role;

ALTER TABLE quran_verses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Quran verses public read" ON quran_verses
  FOR SELECT TO anon, authenticated USING (true);
```

**Data Sample**:
```
surah=1, ayah=1, arabic="بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"
surah=2, ayah=255, arabic="اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ..."
surah=114, ayah=6, arabic="مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ"
```

**Total Records**: 6,236 verses (114 surahs)  
**Size**: ~2-3 MB

### `quran_translations` (Migration 0003)
```sql
CREATE TABLE quran_translations (
  id SERIAL PRIMARY KEY,
  surah INTEGER NOT NULL,
  ayah INTEGER NOT NULL,
  lang VARCHAR(5) NOT NULL,
  translator TEXT NOT NULL,
  text TEXT NOT NULL,
  source_id INTEGER REFERENCES sources(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(surah, ayah, lang, translator)
);

CREATE INDEX idx_quran_translations_surah_ayah_lang 
  ON quran_translations(surah, ayah, lang);
CREATE INDEX idx_quran_translations_lang 
  ON quran_translations(lang);

GRANT SELECT ON quran_translations TO anon, authenticated;
GRANT ALL ON quran_translations TO service_role;

ALTER TABLE quran_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Quran translations public read" ON quran_translations
  FOR SELECT TO anon, authenticated USING (true);
```

**Data Sample**:
```
surah=1, ayah=1, lang='en', translator='Pickthall', 
  text="In the name of Allah, the Beneficent, the Merciful"

surah=2, ayah=255, lang='ur', translator='Unknown', 
  text="اللہ جو کوئی معبود نہیں صرف وہی قابلِ عبادت ہے..."

surah=1, ayah=1, lang='hi', translator='Unknown',
  text="रहमान और रहीम अल्लाह के नाम से शुरुआत करता हूँ"
```

**Supported Languages**: en, ur, hi  
**Size**: ~15-20 MB (for all 3 languages × 6,236 verses)

---

## 6. Hadith Tables

### `hadiths` (Migration 0003)
```sql
CREATE TABLE hadiths (
  id SERIAL PRIMARY KEY,
  collection VARCHAR(50) NOT NULL,
  book VARCHAR(100),
  number INTEGER NOT NULL,
  arabic TEXT NOT NULL,
  narrator TEXT,
  grading VARCHAR(50),
  source_id INTEGER REFERENCES sources(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(collection, book, number)
);

CREATE INDEX idx_hadiths_collection_number 
  ON hadiths(collection, number);
CREATE INDEX idx_hadiths_grading 
  ON hadiths(grading);

GRANT SELECT ON hadiths TO anon, authenticated;
GRANT ALL ON hadiths TO service_role;

ALTER TABLE hadiths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hadiths public read" ON hadiths
  FOR SELECT TO anon, authenticated USING (true);
```

**Collections**:
- Sahih Bukhari (7,563 hadiths)
- Sahih Muslim (5,363 hadiths)
- Jami' at-Tirmidhi (3,956 hadiths)
- Sunan an-Nasai (5,761 hadiths)
- Sunan Abu Dawood (5,274 hadiths)

**Gradings**:
- sahih (authentic)
- hasan (good)
- daif (weak)
- mawdu (fabricated)

**Total Records**: ~28,000 hadiths  
**Size**: ~8-10 MB

### `hadith_translations` (Migration 0003)
```sql
CREATE TABLE hadith_translations (
  id SERIAL PRIMARY KEY,
  hadith_id INTEGER NOT NULL REFERENCES hadiths(id) ON DELETE CASCADE,
  lang VARCHAR(5) NOT NULL,
  translator TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(hadith_id, lang, translator)
);

CREATE INDEX idx_hadith_translations_hadith_lang 
  ON hadith_translations(hadith_id, lang);

GRANT SELECT ON hadith_translations TO anon, authenticated;
GRANT ALL ON hadith_translations TO service_role;

ALTER TABLE hadith_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hadith translations public read" ON hadith_translations
  FOR SELECT TO anon, authenticated USING (true);
```

**Data Sample**:
```
hadith_id=1, lang='en', text="The best of you are those who are best to their families..."
hadith_id=1, lang='ur', text="تم میں سے بہترین وہ ہیں جو اپنے گھر والوں سے سب سے اچھا سلوک کریں"
```

**Size**: ~5-8 MB (all languages)

---

## 7. Duas (Supplications)

### `duas` (Migration 0003)
```sql
CREATE TABLE duas (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category VARCHAR(100),
  arabic TEXT NOT NULL,
  transliteration TEXT,
  source_ref TEXT,
  source_id INTEGER REFERENCES sources(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_duas_category ON duas(category);
CREATE INDEX idx_duas_title ON duas(title);

GRANT SELECT ON duas TO anon, authenticated;
GRANT ALL ON duas TO service_role;

ALTER TABLE duas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Duas public read" ON duas
  FOR SELECT TO anon, authenticated USING (true);
```

**Categories**:
- morning
- evening
- travel
- prayer
- family
- health
- work
- forgiveness
- learning
- etc.

**Sample Duas**:
```
title: "Morning Dua"
arabic: "اللهم بك أصبحنا وبك أمسينا..."
transliteration: "Allahumma bika asbahna wa bika amseina..."

title: "Dua for Knowledge"
arabic: "رب اشرح لي صدري ويسر لي أمري..."
transliteration: "Rabbi ishrah li sadri wa yassir li amri..."
```

**Total Records**: ~500-1000 duas (Phase 2)  
**Size**: ~1-2 MB

### `dua_translations` (Migration 0003)
```sql
CREATE TABLE dua_translations (
  id SERIAL PRIMARY KEY,
  dua_id INTEGER NOT NULL REFERENCES duas(id) ON DELETE CASCADE,
  lang VARCHAR(5) NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(dua_id, lang)
);

CREATE INDEX idx_dua_translations_dua_lang 
  ON dua_translations(dua_id, lang);

GRANT SELECT ON dua_translations TO anon, authenticated;
GRANT ALL ON dua_translations TO service_role;

ALTER TABLE dua_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dua translations public read" ON dua_translations
  FOR SELECT TO anon, authenticated USING (true);
```

**Size**: ~1-2 MB (all languages)

---

## 8. Searchable Chunks (Hybrid Search)

### `chunks` (Migration 0003)
```sql
CREATE TABLE chunks (
  id SERIAL PRIMARY KEY,
  kind VARCHAR(20) NOT NULL,
  ref TEXT NOT NULL,
  surah_ayah TEXT,
  collection_number TEXT,
  dua_id INTEGER,
  lang VARCHAR(5) NOT NULL,
  content TEXT NOT NULL,
  embedding vector(768),
  tsv tsvector,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chunks_kind_lang ON chunks(kind, lang);
CREATE INDEX idx_chunks_embedding ON chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_chunks_tsv ON chunks USING GIN (tsv);
CREATE INDEX idx_chunks_metadata ON chunks USING GIN (metadata);

GRANT SELECT ON chunks TO anon, authenticated;
GRANT ALL ON chunks TO service_role;

ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chunks public read" ON chunks
  FOR SELECT TO anon, authenticated USING (true);
```

**Trigger** (Auto-update tsvector):
```sql
CREATE OR REPLACE FUNCTION chunks_update_tsv()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tsv := to_tsvector('english', NEW.content);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chunks_tsv_trigger BEFORE INSERT OR UPDATE ON chunks
FOR EACH ROW EXECUTE FUNCTION chunks_update_tsv();
```

**Data Schema**:
```javascript
{
  id: 1,
  kind: "quran",
  ref: "2:255",
  surah_ayah: "2:255",
  lang: "en",
  content: "Allah - there is no deity except Him, the Ever-Living...",
  embedding: [0.1234, -0.5678, ...],  // 768 dimensions
  tsv: "'allah' 'deity'...",          // Full-text search vector
  metadata: { surah: 2, ayah: 255, juz: 2, page: 42 }
}
```

**Purpose**:
- Full-text search now (using `tsv` + GIN index)
- Vector search in Phase 2 (using `embedding` + HNSW index)
- Hybrid scoring: `match_chunks()` combines both

**Total Records**: ~6,236 + ~28,000 + ~1,000 = ~35,000+ chunks  
**Size**: ~10-15 MB (without embeddings), ~20-30 MB (with 768D embeddings)

---

## 9. Chat Sessions (Optional, for History)

### `chat_sessions` (Migration 0003)
```sql
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  persona VARCHAR(10) NOT NULL,
  lang VARCHAR(5) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);

GRANT SELECT, INSERT, UPDATE ON chat_sessions TO authenticated;
GRANT ALL ON chat_sessions TO service_role;

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own sessions" ON chat_sessions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
```

**Personas**: 'zaid', 'zara', 'text'  
**Languages**: 'en', 'ur', 'hi'

### `chat_messages` (Migration 0003)
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role VARCHAR(10) NOT NULL,
  content TEXT NOT NULL,
  sources JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_session 
  ON chat_messages(session_id, created_at DESC);

GRANT SELECT, INSERT ON chat_messages TO authenticated;
GRANT ALL ON chat_messages TO service_role;

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own messages" ON chat_messages
  FOR SELECT TO authenticated
  USING (EXISTS(
    SELECT 1 FROM chat_sessions 
    WHERE chat_sessions.id = chat_messages.session_id 
    AND auth.uid() = chat_sessions.user_id
  ));
```

**Message Schema**:
```javascript
{
  id: "uuid-1234-5678",
  session_id: "uuid-session-id",
  role: "user|assistant",
  content: "What is 2:255?",
  sources: [
    {
      type: "quran",
      ref: "2:255",
      content: "Allah - there is no deity except Him...",
      translation: "Sahih International"
    }
  ],
  created_at: "2026-11-15T10:30:00Z"
}
```

**Size**: Grows with usage (~100 bytes per message)

---

## 10. Rate Limiting

### `rate_limits` (Migration 0003)
```sql
CREATE TABLE rate_limits (
  id SERIAL PRIMARY KEY,
  ip_address INET NOT NULL,
  endpoint VARCHAR(100) NOT NULL,
  count INTEGER DEFAULT 1,
  reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '1 day',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ip_address, endpoint, reset_at)
);

CREATE INDEX idx_rate_limits_ip_endpoint_reset 
  ON rate_limits(ip_address, endpoint, reset_at);

GRANT SELECT, INSERT, UPDATE ON rate_limits TO service_role;

ALTER TABLE rate_limits DISABLE ROW LEVEL SECURITY;
```

**Purpose**: Enforce 100 requests per IP per day  
**Current Implementation**: In-memory store (in `api.chat.server.ts`)  
**Production Upgrade**: Use Upstash Redis for distributed rate limiting

---

## Stored Functions (Query Helpers)

### 1. `match_chunks()` - Hybrid Search
```sql
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(768),
  query_text TEXT,
  kind_filter VARCHAR(20),
  lang_filter VARCHAR(5),
  k INTEGER DEFAULT 5
)
RETURNS TABLE (
  id INTEGER,
  kind VARCHAR,
  ref TEXT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
) AS $$
WITH vector_matches AS (
  SELECT id, 1 - (embedding <=> query_embedding) AS similarity
  FROM chunks
  WHERE kind = kind_filter
    AND lang = lang_filter
    AND embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT k * 2
),
text_matches AS (
  SELECT id, ts_rank(tsv, to_tsquery(query_text)) AS rank
  FROM chunks
  WHERE kind = kind_filter
    AND lang = lang_filter
    AND tsv @@ to_tsquery(query_text)
),
combined AS (
  SELECT
    c.id,
    COALESCE(vm.similarity, 0) * 0.5 + COALESCE(tm.rank, 0) * 0.5 AS combined_score
  FROM chunks c
  LEFT JOIN vector_matches vm ON c.id = vm.id
  LEFT JOIN text_matches tm ON c.id = tm.id
  WHERE kind = kind_filter AND lang = lang_filter
)
SELECT
  c.id,
  c.kind,
  c.ref,
  c.content,
  c.metadata,
  combined.combined_score::FLOAT
FROM chunks c
JOIN combined ON c.id = combined.id
ORDER BY combined_score DESC
LIMIT k;
$$ LANGUAGE SQL;
```

**Usage**:
```sql
SELECT * FROM match_chunks(
  embedding := '[0.1, 0.2, ...]'::vector,
  query_text := 'prayer AND family',
  kind_filter := 'quran',
  lang_filter := 'en',
  k := 5
);
```

### 2. `get_verse()` - Exact Qur'an Lookup
```sql
CREATE OR REPLACE FUNCTION get_verse(p_surah INTEGER, p_ayah INTEGER)
RETURNS TABLE (
  surah INTEGER,
  ayah INTEGER,
  arabic TEXT,
  translations JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    qv.surah,
    qv.ayah,
    qv.arabic,
    jsonb_object_agg(qt.lang, jsonb_build_object('translator', qt.translator, 'text', qt.text))
    FILTER (WHERE qt.lang IS NOT NULL)
  FROM quran_verses qv
  LEFT JOIN quran_translations qt ON qv.surah = qt.surah AND qv.ayah = qt.ayah
  WHERE qv.surah = p_surah AND qv.ayah = p_ayah
  GROUP BY qv.surah, qv.ayah, qv.arabic;
END;
$$ LANGUAGE plpgsql;
```

**Usage**:
```sql
SELECT * FROM get_verse(2, 255);
-- Returns full verse with all translations
```

### 3. `get_hadith()` - Exact Hadith Lookup
```sql
CREATE OR REPLACE FUNCTION get_hadith(p_collection VARCHAR, p_number INTEGER)
RETURNS TABLE (
  collection VARCHAR,
  number INTEGER,
  arabic TEXT,
  grading VARCHAR,
  narrator TEXT,
  translations JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    h.collection,
    h.number,
    h.arabic,
    h.grading,
    h.narrator,
    jsonb_object_agg(ht.lang, jsonb_build_object('translator', ht.translator, 'text', ht.text))
    FILTER (WHERE ht.lang IS NOT NULL)
  FROM hadiths h
  LEFT JOIN hadith_translations ht ON h.id = ht.hadith_id
  WHERE h.collection = p_collection AND h.number = p_number
  GROUP BY h.id, h.collection, h.number, h.arabic, h.grading, h.narrator;
END;
$$ LANGUAGE plpgsql;
```

**Usage**:
```sql
SELECT * FROM get_hadith('bukhari', 1);
-- Returns hadith with all translations
```

---

## Security & Access Control

### Row Level Security (RLS)

**All content tables have RLS enabled**:
- `quran_verses` — Public read
- `quran_translations` — Public read
- `hadiths` — Public read
- `hadith_translations` — Public read
- `duas` — Public read
- `dua_translations` — Public read
- `chunks` — Public read
- `sources` — Public read

**User profile tables**:
- `profiles` — Users can only access their own profile

**Chat tables**:
- `chat_sessions` — Users can only access their own sessions
- `chat_messages` — Users can only access messages in their own sessions

### Permissions

```sql
-- Public read (anonymous + authenticated)
GRANT SELECT ON quran_verses TO anon, authenticated;
GRANT SELECT ON quran_translations TO anon, authenticated;
GRANT SELECT ON hadiths TO anon, authenticated;
GRANT SELECT ON hadith_translations TO anon, authenticated;
GRANT SELECT ON duas TO anon, authenticated;
GRANT SELECT ON dua_translations TO anon, authenticated;
GRANT SELECT ON chunks TO anon, authenticated;
GRANT SELECT ON sources TO anon, authenticated;

-- User profiles (authenticated only)
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;

-- Chat (authenticated only)
GRANT SELECT, INSERT, UPDATE ON chat_sessions TO authenticated;
GRANT SELECT, INSERT ON chat_messages TO authenticated;

-- Admin/service role (ingestion scripts)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
```

---

## Indexes for Performance

### Frequently Queried Columns

```sql
-- Quran lookups
CREATE INDEX idx_quran_verses_surah_ayah ON quran_verses(surah, ayah);
CREATE INDEX idx_quran_translations_lang ON quran_translations(lang);

-- Hadith lookups
CREATE INDEX idx_hadiths_collection_number ON hadiths(collection, number);

-- Search
CREATE INDEX idx_chunks_kind_lang ON chunks(kind, lang);
CREATE INDEX idx_chunks_tsv ON chunks USING GIN (tsv);
CREATE INDEX idx_chunks_embedding ON chunks USING hnsw (embedding vector_cosine_ops);

-- Chat history
CREATE INDEX idx_chat_messages_session ON chat_messages(session_id, created_at DESC);

-- Rate limiting
CREATE INDEX idx_rate_limits_ip_endpoint_reset ON rate_limits(ip_address, endpoint, reset_at);
```

**Estimated Query Performance**:
- Exact verse lookup: < 1 ms
- Exact hadith lookup: < 1 ms
- Full-text search: 10-50 ms
- Vector search (Phase 2): 50-100 ms
- Hybrid search: 50-150 ms

---

## Data Ingestion Pipeline

### Migration 0003 (Zaid/Zara Launch)
```bash
# 1. Apply migration
npx drizzle-kit migrate

# 2. Insert sources
npm run seed:sources

# 3. Ingest Quran
npx tsx scripts/ingest/ingest-quran.ts
# Expected: 6,236 verses + 6,236 translations per language

# 4. Verify
SELECT COUNT(*) FROM quran_verses;          -- 6,236
SELECT COUNT(*) FROM quran_translations;    -- 18,708
SELECT COUNT(*) FROM chunks WHERE kind='quran';  -- 6,236
```

### Phase 2 (Hadith + Duas)
```bash
# 5. Ingest Hadith
npx tsx scripts/ingest/ingest-hadith.ts
# Expected: ~28,000 hadiths + translations

# 6. Ingest Duas
npx tsx scripts/ingest/ingest-duas.ts
# Expected: ~1,000 duas + translations

# 7. Generate Embeddings
npx tsx scripts/generate/embeddings.ts
# Expected: 768-dimensional vectors for all chunks
```

---

## Monitoring & Maintenance

### Useful Queries

```sql
-- Storage by table
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Quran completeness
SELECT COUNT(DISTINCT surah) as total_surahs, COUNT(*) as verses
FROM quran_verses;

-- Translation coverage
SELECT lang, COUNT(*) as count FROM quran_translations GROUP BY lang;

-- Index usage
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY tablename;

-- Rate limit cleanup (older than 24 hours)
DELETE FROM rate_limits WHERE reset_at < NOW();

-- Chat session counts
SELECT COUNT(*) as sessions FROM chat_sessions;
SELECT COUNT(*) as messages FROM chat_messages;
```

---

## Disaster Recovery

### Backups
- **Frequency**: Daily automatic (Supabase)
- **Retention**: 7 days
- **Location**: Supabase cloud

### Restore Procedure
```bash
# 1. Check backup availability
# Supabase Dashboard → Backups

# 2. Restore from backup
# Supabase Dashboard → Backups → Restore

# 3. Verify data integrity
SELECT COUNT(*) FROM quran_verses;
SELECT COUNT(*) FROM hadiths;
```

---

## Future Enhancements

### Phase 2
- [ ] Vector embeddings (OpenAI API, 768 dimensions)
- [ ] Semantic search with similarity scores
- [ ] Chat history persistence + multi-turn context
- [ ] User bookmarks & favorites

### Phase 3
- [ ] Analytics dashboard (aggregated, privacy-safe)
- [ ] Advanced search filters (surah, collection, grading)
- [ ] Personalized learning paths
- [ ] Community features (user-generated content)

---

## Quick Reference

**Total Tables**: 10 (+ auth.users)  
**Total Records**: ~35,000+  
**Total Storage**: ~41 MB (current), ~80 MB (with Phase 2)  
**Estimated Cost**: Free tier (Supabase)  
**Backup**: Daily automatic  

**Schema Version**: 1.0  
**Last Migration**: 0003_zaid_schema.sql (Nov 15, 2026)  
**Next Review**: When major schema changes occur  

---

*For support, see ZAID_SETUP.md or contact the development team.*
