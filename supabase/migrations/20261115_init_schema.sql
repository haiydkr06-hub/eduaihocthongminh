-- ==============================================================================
-- EDUAI SYSTEM SCHEMA & ROW LEVEL SECURITY (RLS) MIGRATION
-- ==============================================================================

-- 1. ENUMS
CREATE TYPE public.app_role AS ENUM ('student', 'teacher', 'admin');
CREATE TYPE public.content_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE public.enrollment_status AS ENUM ('active', 'completed', 'dropped');

-- 2. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  role public.app_role NOT NULL DEFAULT 'student',
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger auto insert profile when new user registers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'student'::public.app_role)
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = CASE WHEN profiles.full_name = '' THEN EXCLUDED.full_name ELSE profiles.full_name END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. COURSES
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  title TEXT NOT NULL CHECK (length(trim(title)) > 0),
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Tổng hợp',
  thumbnail_url TEXT,
  status public.content_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. LESSONS
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(trim(title)) > 0),
  content TEXT NOT NULL DEFAULT '',
  video_url TEXT,
  duration_minutes INTEGER DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (course_id, position)
);

-- 5. ENROLLMENTS
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  status public.enrollment_status NOT NULL DEFAULT 'active',
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE (student_id, course_id)
);

-- 6. LESSON PROGRESS
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, lesson_id)
);

-- 7. QUIZZES
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  title TEXT NOT NULL CHECK (length(trim(title)) > 0),
  description TEXT,
  time_limit_minutes INTEGER DEFAULT 15,
  pass_score NUMERIC(5,2) DEFAULT 50.0,
  status public.content_status NOT NULL DEFAULT 'draft',
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. QUIZ QUESTIONS
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  options JSONB NOT NULL,
  answer_key INTEGER NOT NULL,
  explanation TEXT DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0,
  UNIQUE (quiz_id, position)
);

-- 9. QUIZ ATTEMPTS
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE RESTRICT,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  score NUMERIC(5,2),
  is_passed BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ
);

-- 10. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.app_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Profiles: Anyone can view profiles, users can update own profile (cannot alter role)
CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Admin full profile management" ON public.profiles FOR ALL USING (public.current_user_role() = 'admin');

-- Courses:
CREATE POLICY "View published courses" ON public.courses FOR SELECT USING (status = 'published' OR teacher_id = auth.uid() OR public.current_user_role() = 'admin');
CREATE POLICY "Teacher manage own courses" ON public.courses FOR ALL USING (teacher_id = auth.uid() OR public.current_user_role() = 'admin');

-- Lessons:
CREATE POLICY "View lessons of published courses" ON public.lessons FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND (c.status = 'published' OR c.teacher_id = auth.uid() OR public.current_user_role() = 'admin'))
);
CREATE POLICY "Teacher manage lessons" ON public.lessons FOR ALL USING (
  EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND (c.teacher_id = auth.uid() OR public.current_user_role() = 'admin'))
);

-- Enrollments:
CREATE POLICY "Student view own enrollments" ON public.enrollments FOR SELECT USING (student_id = auth.uid() OR public.current_user_role() IN ('teacher', 'admin'));
CREATE POLICY "Student self enroll" ON public.enrollments FOR INSERT WITH CHECK (student_id = auth.uid());

-- Lesson Progress:
CREATE POLICY "Student view & update own progress" ON public.lesson_progress FOR ALL USING (student_id = auth.uid());

-- Quizzes:
CREATE POLICY "View published quizzes" ON public.quizzes FOR SELECT USING (status = 'published' OR created_by = auth.uid() OR public.current_user_role() = 'admin');
CREATE POLICY "Teacher manage quizzes" ON public.quizzes FOR ALL USING (created_by = auth.uid() OR public.current_user_role() = 'admin');

-- Quiz Questions:
CREATE POLICY "View quiz questions" ON public.quiz_questions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_id AND (q.status = 'published' OR q.created_by = auth.uid() OR public.current_user_role() = 'admin'))
);
CREATE POLICY "Teacher manage questions" ON public.quiz_questions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_id AND (q.created_by = auth.uid() OR public.current_user_role() = 'admin'))
);

-- Quiz Attempts:
CREATE POLICY "Student view own attempts" ON public.quiz_attempts FOR SELECT USING (student_id = auth.uid() OR public.current_user_role() IN ('teacher', 'admin'));
CREATE POLICY "Student create own attempts" ON public.quiz_attempts FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "Student update own attempts" ON public.quiz_attempts FOR UPDATE USING (student_id = auth.uid());

-- Notifications:
CREATE POLICY "User manage own notifications" ON public.notifications FOR ALL USING (user_id = auth.uid());
