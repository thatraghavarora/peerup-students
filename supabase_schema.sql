-- 1. Create custom types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'teacher');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE doubt_status AS ENUM ('pending', 'connected', 'solved', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Profiles Table (References auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT UNIQUE,
  avatar_url TEXT,
  role user_role DEFAULT 'student',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  gender TEXT,
  course_name TEXT,
  semester TEXT,
  class_level TEXT
);

-- 3. Doubts Table
CREATE TABLE IF NOT EXISTS public.doubts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT,
  content TEXT,
  image_url TEXT,
  status doubt_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Connect Requests
CREATE TABLE IF NOT EXISTS public.connect_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doubt_id UUID REFERENCES public.doubts(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id),
  student_id UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'pending',
  room_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doubt_id UUID REFERENCES public.doubts(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id),
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Solved History
CREATE TABLE IF NOT EXISTS public.solved_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doubt_id UUID REFERENCES public.doubts(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id),
  student_id UUID REFERENCES public.profiles(id),
  resolution_type TEXT,
  duration_minutes INT,
  rating INT,
  solved_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doubts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all" ON public.profiles;
CREATE POLICY "Allow all" ON public.profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all" ON public.doubts;
CREATE POLICY "Allow all" ON public.doubts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all" ON public.connect_requests;
CREATE POLICY "Allow all" ON public.connect_requests FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all" ON public.messages;
CREATE POLICY "Allow all" ON public.messages FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 8. Enable Realtime for Doubts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'doubts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.doubts;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'connect_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.connect_requests;
  END IF;
END $$;

-- 9. Automated Profile Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.email
  );
  RETURN new;
EXCEPTION WHEN others THEN
  -- Fallback to bypass error so user can still sign up, profile can be updated later
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
