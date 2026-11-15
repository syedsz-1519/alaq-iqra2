ALTER TABLE public.profiles
  ADD COLUMN teacher text NOT NULL DEFAULT 'zaid'
  CONSTRAINT profiles_teacher_check CHECK (teacher IN ('zaid', 'zara'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, teacher)
  VALUES (
    NEW.id,
    left(coalesce(
      nullif(trim(NEW.raw_user_meta_data->>'display_name'), ''),
      nullif(trim(NEW.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(NEW.raw_user_meta_data->>'name'), ''),
      split_part(coalesce(NEW.email, ''), '@', 1)
    ), 60),
    CASE WHEN NEW.raw_user_meta_data->>'teacher' = 'zara' THEN 'zara' ELSE 'zaid' END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;