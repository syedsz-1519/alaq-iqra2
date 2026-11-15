-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable full-text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Sources table (tracks all data sources for attribution)
CREATE TABLE IF NOT EXISTS sources (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  license TEXT NOT NULL,
  attribution TEXT NOT NULL,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quran verses (Arabic, Uthmani)
CREATE TABLE IF NOT EXISTS quran_verses (
  id SERIAL PRIMARY KEY,
  surah INTEGER NOT NULL,
  ayah INTEGER NOT NULL,
  arabic TEXT NOT NULL,
  juz INTEGER,
  page INTEGER,
  source_id INTEGER REFERENCES sources(id),
  UNIQUE(surah, ayah),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_quran_verses_surah_ayah ON quran_verses(surah, ayah);

-- Quran translations
CREATE TABLE IF NOT EXISTS quran_translations (
  id SERIAL PRIMARY KEY,
  surah INTEGER NOT NULL,
  ayah INTEGER NOT NULL,
  lang VARCHAR(5) NOT NULL,
  translator TEXT NOT NULL,
  text TEXT NOT NULL,
  source_id INTEGER REFERENCES sources(id),
  UNIQUE(surah, ayah, lang, translator),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_quran_translations_surah_ayah_lang ON quran_translations(surah, ayah, lang);

-- Hadith metadata
CREATE TABLE IF NOT EXISTS hadiths (
  id SERIAL PRIMARY KEY,
  collection VARCHAR(50) NOT NULL,
  book VARCHAR(100),
  number INTEGER NOT NULL,
  arabic TEXT NOT NULL,
  narrator TEXT,
  grading VARCHAR(50),
  source_id INTEGER REFERENCES sources(id),
  UNIQUE(collection, book, number),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_hadiths_collection_number ON hadiths(collection, number);

-- Hadith translations
CREATE TABLE IF NOT EXISTS hadith_translations (
  id SERIAL PRIMARY KEY,
  hadith_id INTEGER NOT NULL REFERENCES hadiths(id) ON DELETE CASCADE,
  lang VARCHAR(5) NOT NULL,
  translator TEXT NOT NULL,
  text TEXT NOT NULL,
  UNIQUE(hadith_id, lang, translator),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_hadith_translations_hadith_lang ON hadith_translations(hadith_id, lang);

-- Duas and adhkar
CREATE TABLE IF NOT EXISTS duas (
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

-- Dua translations
CREATE TABLE IF NOT EXISTS dua_translations (
  id SERIAL PRIMARY KEY,
  dua_id INTEGER NOT NULL REFERENCES duas(id) ON DELETE CASCADE,
  lang VARCHAR(5) NOT NULL,
  text TEXT NOT NULL,
  UNIQUE(dua_id, lang),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_dua_translations_dua_lang ON dua_translations(dua_id, lang);

-- Searchable chunks with embeddings (hybrid search)
CREATE TABLE IF NOT EXISTS chunks (
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

-- Trigger to auto-update tsvector
CREATE OR REPLACE FUNCTION chunks_update_tsv()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tsv := to_tsvector('english', NEW.content);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS chunks_tsv_trigger ON chunks;
CREATE TRIGGER chunks_tsv_trigger BEFORE INSERT OR UPDATE ON chunks
FOR EACH ROW EXECUTE FUNCTION chunks_update_tsv();

-- Chat history (optional, for context in multi-turn)
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  persona VARCHAR(10) NOT NULL,
  lang VARCHAR(5) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role VARCHAR(10) NOT NULL,
  content TEXT NOT NULL,
  sources JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_session ON chat_messages(session_id, created_at DESC);

-- Rate limiting (per IP, daily)
CREATE TABLE IF NOT EXISTS rate_limits (
  id SERIAL PRIMARY KEY,
  ip_address INET NOT NULL,
  endpoint VARCHAR(100) NOT NULL,
  count INTEGER DEFAULT 1,
  reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '1 day',
  UNIQUE(ip_address, endpoint, reset_at),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE quran_verses DISABLE ROW LEVEL SECURITY;
ALTER TABLE quran_translations DISABLE ROW LEVEL SECURITY;
ALTER TABLE hadiths DISABLE ROW LEVEL SECURITY;
ALTER TABLE hadith_translations DISABLE ROW LEVEL SECURITY;
ALTER TABLE duas DISABLE ROW LEVEL SECURITY;
ALTER TABLE dua_translations DISABLE ROW LEVEL SECURITY;
ALTER TABLE chunks DISABLE ROW LEVEL SECURITY;
ALTER TABLE sources DISABLE ROW LEVEL SECURITY;

-- Public read-only access to content tables (for chat service)
CREATE POLICY "Public read access" ON quran_verses FOR SELECT USING (true);
CREATE POLICY "Public read access" ON quran_translations FOR SELECT USING (true);
CREATE POLICY "Public read access" ON hadiths FOR SELECT USING (true);
CREATE POLICY "Public read access" ON hadith_translations FOR SELECT USING (true);
CREATE POLICY "Public read access" ON duas FOR SELECT USING (true);
CREATE POLICY "Public read access" ON dua_translations FOR SELECT USING (true);
CREATE POLICY "Public read access" ON chunks FOR SELECT USING (true);
CREATE POLICY "Public read access" ON sources FOR SELECT USING (true);

-- Stored procedures for search
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

-- Exact verse/hadith lookup
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
