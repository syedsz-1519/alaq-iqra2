CREATE TABLE public.hadith_translations (
  collection text NOT NULL,
  hadith_number integer NOT NULL,
  lang text NOT NULL,
  text text NOT NULL,
  model text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (collection, hadith_number, lang)
);

GRANT SELECT ON public.hadith_translations TO anon, authenticated;
GRANT ALL ON public.hadith_translations TO service_role;

ALTER TABLE public.hadith_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hadith translations are public to read"
ON public.hadith_translations
FOR SELECT
TO anon, authenticated
USING (true);