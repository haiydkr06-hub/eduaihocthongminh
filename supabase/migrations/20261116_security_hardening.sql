-- ==============================================================================
-- EDUAI — SECURITY HARDENING (chạy SAU 20261115_init_schema.sql, chạy lại nhiều lần được)
-- Mục tiêu:
--   * Không ai tự nâng quyền Admin (trigger + policy profiles)
--   * Không lộ email/SĐT của mọi người
--   * Chỉ Admin xuất bản khóa học; giảng viên chỉ quản lý khóa của mình
--   * Học viên KHÔNG đọc được đáp án; điểm được chấm ở server (RPC)
--   * Thông báo gửi đúng người nhận có quyền
--   * updated_at tự cập nhật
-- ==============================================================================

-- 0. CỘT BỔ SUNG -----------------------------------------------------------------
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS feedback TEXT;
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS graded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS graded_at TIMESTAMPTZ;
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS client_attempt_id UUID;
CREATE UNIQUE INDEX IF NOT EXISTS quiz_attempts_client_attempt_uidx
  ON public.quiz_attempts (student_id, client_attempt_id) WHERE client_attempt_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS courses_teacher_status_idx ON public.courses (teacher_id, status);
CREATE INDEX IF NOT EXISTS enrollments_course_idx ON public.enrollments (course_id);
CREATE INDEX IF NOT EXISTS quiz_attempts_student_submitted_idx ON public.quiz_attempts (student_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON public.notifications (user_id, created_at DESC);

-- 1. HÀM HỖ TRỢ (SECURITY DEFINER để tránh vòng lặp RLS) --------------------------
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.app_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.profile_role(p_user UUID)
RETURNS public.app_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.profiles WHERE id = p_user;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid()), false);
$$;

CREATE OR REPLACE FUNCTION public.is_course_teacher(p_course UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.courses WHERE id = p_course AND teacher_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_enrolled(p_course UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE course_id = p_course AND student_id = auth.uid() AND status <> 'dropped'
  );
$$;

CREATE OR REPLACE FUNCTION public.lesson_course(p_lesson UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT course_id FROM public.lessons WHERE id = p_lesson;
$$;

CREATE OR REPLACE FUNCTION public.quiz_course(p_quiz UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT course_id FROM public.quizzes WHERE id = p_quiz;
$$;

-- Giảng viên được xem hồ sơ học viên đã ghi danh vào khóa của mình
CREATE OR REPLACE FUNCTION public.teacher_has_student(p_student UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.enrollments e JOIN public.courses c ON c.id = e.course_id
    WHERE e.student_id = p_student AND c.teacher_id = auth.uid()
  );
$$;

-- Học viên được xem hồ sơ giảng viên của khóa mình đã ghi danh
CREATE OR REPLACE FUNCTION public.student_has_teacher(p_teacher UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.enrollments e JOIN public.courses c ON c.id = e.course_id
    WHERE e.student_id = auth.uid() AND c.teacher_id = p_teacher
  );
$$;

-- 2. TRIGGER ĐĂNG KÝ: không bao giờ nhận role admin từ metadata ------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), split_part(NEW.email, '@', 1)),
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    CASE WHEN NEW.raw_user_meta_data->>'role' = 'teacher' THEN 'teacher'::public.app_role
         ELSE 'student'::public.app_role END
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = CASE WHEN profiles.full_name = '' THEN EXCLUDED.full_name ELSE profiles.full_name END;
  RETURN NEW;
END;
$$;

-- 3. updated_at TỰ ĐỘNG ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS courses_set_updated_at ON public.courses;
CREATE TRIGGER courses_set_updated_at BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS lesson_progress_set_updated_at ON public.lesson_progress;
CREATE TRIGGER lesson_progress_set_updated_at BEFORE UPDATE ON public.lesson_progress
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. CHỈ ADMIN ĐƯỢC XUẤT BẢN KHÓA HỌC / ĐỔI CHỦ KHÓA ------------------------------
CREATE OR REPLACE FUNCTION public.guard_course_changes()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- auth.uid() NULL = chạy từ SQL editor / service role -> cho phép
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;
  IF NEW.status = 'published' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'published') THEN
    RAISE EXCEPTION 'Chỉ Quản trị viên được xuất bản khóa học' USING ERRCODE = '42501';
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.teacher_id IS DISTINCT FROM OLD.teacher_id THEN
    RAISE EXCEPTION 'Không được chuyển khóa học sang giảng viên khác' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS courses_guard_changes ON public.courses;
CREATE TRIGGER courses_guard_changes BEFORE INSERT OR UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.guard_course_changes();

-- 5. XÓA TOÀN BỘ POLICY CŨ ----------------------------------------------------------
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('profiles','courses','lessons','enrollments','lesson_progress',
                        'quizzes','quiz_questions','quiz_attempts','notifications')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- 6. POLICY MỚI ----------------------------------------------------------------------
-- PROFILES: chỉ xem hồ sơ của mình / người liên quan; không tự đổi role
CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin() OR public.teacher_has_student(id) OR public.student_has_teacher(id));
CREATE POLICY profiles_update_self ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = public.current_user_role());
CREATE POLICY profiles_admin_all ON public.profiles FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- COURSES
CREATE POLICY courses_select ON public.courses FOR SELECT
  USING (status = 'published' OR teacher_id = auth.uid() OR public.is_admin());
CREATE POLICY courses_insert ON public.courses FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR (teacher_id = auth.uid() AND public.current_user_role() = 'teacher'));
CREATE POLICY courses_update ON public.courses FOR UPDATE TO authenticated
  USING (teacher_id = auth.uid() OR public.is_admin())
  WITH CHECK (teacher_id = auth.uid() OR public.is_admin());
CREATE POLICY courses_delete ON public.courses FOR DELETE TO authenticated
  USING (public.is_admin() OR (teacher_id = auth.uid() AND status <> 'published'));

-- LESSONS: nội dung chỉ dành cho học viên đã ghi danh, giảng viên phụ trách, admin
CREATE POLICY lessons_select ON public.lessons FOR SELECT TO authenticated
  USING (
    public.is_course_teacher(course_id) OR public.is_admin()
    OR (public.is_enrolled(course_id)
        AND EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.status = 'published'))
  );
CREATE POLICY lessons_write ON public.lessons FOR ALL TO authenticated
  USING (public.is_course_teacher(course_id) OR public.is_admin())
  WITH CHECK (public.is_course_teacher(course_id) OR public.is_admin());

-- ENROLLMENTS
CREATE POLICY enrollments_select ON public.enrollments FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.is_course_teacher(course_id) OR public.is_admin());
CREATE POLICY enrollments_insert_self ON public.enrollments FOR INSERT TO authenticated
  WITH CHECK (
    student_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.status = 'published')
  );
CREATE POLICY enrollments_update ON public.enrollments FOR UPDATE TO authenticated
  USING (student_id = auth.uid() OR public.is_admin())
  WITH CHECK (student_id = auth.uid() OR public.is_admin());
CREATE POLICY enrollments_delete_admin ON public.enrollments FOR DELETE TO authenticated
  USING (public.is_admin());

-- LESSON PROGRESS
CREATE POLICY progress_select ON public.lesson_progress FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.is_course_teacher(public.lesson_course(lesson_id)) OR public.is_admin());
CREATE POLICY progress_insert_self ON public.lesson_progress FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid() AND public.is_enrolled(public.lesson_course(lesson_id)));
CREATE POLICY progress_update_self ON public.lesson_progress FOR UPDATE TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid() AND public.is_enrolled(public.lesson_course(lesson_id)));
CREATE POLICY progress_delete_self ON public.lesson_progress FOR DELETE TO authenticated
  USING (student_id = auth.uid());

-- QUIZZES
CREATE POLICY quizzes_select ON public.quizzes FOR SELECT TO authenticated
  USING (
    public.is_course_teacher(course_id) OR public.is_admin()
    OR (status = 'published' AND public.is_enrolled(course_id))
  );
CREATE POLICY quizzes_insert ON public.quizzes FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND (public.is_course_teacher(course_id) OR public.is_admin()));
CREATE POLICY quizzes_update ON public.quizzes FOR UPDATE TO authenticated
  USING (public.is_course_teacher(course_id) OR public.is_admin())
  WITH CHECK (public.is_course_teacher(course_id) OR public.is_admin());
CREATE POLICY quizzes_delete ON public.quizzes FOR DELETE TO authenticated
  USING (public.is_course_teacher(course_id) OR public.is_admin());

-- QUIZ QUESTIONS: chỉ giảng viên phụ trách & admin đọc trực tiếp (có answer_key).
-- Học viên lấy đề qua RPC get_quiz_for_attempt (không kèm đáp án).
CREATE POLICY questions_owner_all ON public.quiz_questions FOR ALL TO authenticated
  USING (public.is_course_teacher(public.quiz_course(quiz_id)) OR public.is_admin())
  WITH CHECK (public.is_course_teacher(public.quiz_course(quiz_id)) OR public.is_admin());

-- QUIZ ATTEMPTS: học viên chỉ đọc bài của mình; tạo bài làm qua RPC submit_quiz_attempt.
CREATE POLICY attempts_select ON public.quiz_attempts FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.is_course_teacher(public.quiz_course(quiz_id)) OR public.is_admin());
CREATE POLICY attempts_grade ON public.quiz_attempts FOR UPDATE TO authenticated
  USING (public.is_course_teacher(public.quiz_course(quiz_id)) OR public.is_admin())
  WITH CHECK (public.is_course_teacher(public.quiz_course(quiz_id)) OR public.is_admin());
REVOKE INSERT, UPDATE, DELETE ON public.quiz_attempts FROM anon, authenticated;
GRANT UPDATE (score, is_passed, feedback, graded_by, graded_at) ON public.quiz_attempts TO authenticated;

-- NOTIFICATIONS
CREATE POLICY notifications_select_own ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin()); -- Admin xem lịch sử thông báo đã gửi
CREATE POLICY notifications_update_own ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY notifications_delete_own ON public.notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY notifications_insert ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR public.is_admin()
    OR (public.current_user_role() = 'teacher'
        AND (public.teacher_has_student(user_id) OR public.profile_role(user_id) = 'admin'))
  );

-- 7. RPC ------------------------------------------------------------------------------
-- Danh mục khóa học công khai (tên giảng viên + số bài) mà không mở bảng profiles/lessons
CREATE OR REPLACE FUNCTION public.get_course_catalog()
RETURNS TABLE (
  id UUID, title TEXT, category TEXT, description TEXT, thumbnail_url TEXT,
  teacher_name TEXT, lessons_count BIGINT, students_count BIGINT, created_at TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.title, c.category, c.description, c.thumbnail_url,
         p.full_name,
         (SELECT count(*) FROM public.lessons l WHERE l.course_id = c.id),
         (SELECT count(*) FROM public.enrollments e WHERE e.course_id = c.id AND e.status <> 'dropped'),
         c.created_at
  FROM public.courses c
  LEFT JOIN public.profiles p ON p.id = c.teacher_id
  WHERE c.status = 'published'
  ORDER BY c.created_at DESC;
$$;

-- Lấy đề để làm bài: KHÔNG trả answer_key / explanation
CREATE OR REPLACE FUNCTION public.get_quiz_for_attempt(p_quiz_id UUID)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  q public.quizzes%ROWTYPE;
BEGIN
  SELECT * INTO q FROM public.quizzes WHERE id = p_quiz_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quiz không tồn tại' USING ERRCODE = 'P0002';
  END IF;
  IF NOT (public.is_course_teacher(q.course_id) OR public.is_admin()
          OR (q.status = 'published' AND public.is_enrolled(q.course_id))) THEN
    RAISE EXCEPTION 'Quiz hiện không khả dụng với tài khoản của bạn' USING ERRCODE = '42501';
  END IF;

  RETURN jsonb_build_object(
    'id', q.id,
    'title', q.title,
    'course_id', q.course_id,
    'course_title', (SELECT title FROM public.courses WHERE id = q.course_id),
    'time_limit_minutes', COALESCE(q.time_limit_minutes, 15),
    'pass_score', COALESCE(q.pass_score, 50),
    'questions', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', qq.id, 'prompt', qq.prompt, 'options', qq.options) ORDER BY qq.position)
      FROM public.quiz_questions qq WHERE qq.quiz_id = q.id
    ), '[]'::jsonb)
  );
END;
$$;

-- Nộp bài: chấm điểm ở server, chống nộp trùng bằng client_attempt_id
-- p_answers: { "<question_id>": <chỉ số lựa chọn>, ... }
CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(
  p_quiz_id UUID,
  p_answers JSONB,
  p_client_attempt_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  q public.quizzes%ROWTYPE;
  v_total INTEGER;
  v_correct INTEGER;
  v_score NUMERIC(5,2);
  v_passed BOOLEAN;
  v_attempt public.quiz_attempts%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Bạn cần đăng nhập để nộp bài' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO q FROM public.quizzes WHERE id = p_quiz_id;
  IF NOT FOUND OR q.status <> 'published' OR NOT public.is_enrolled(q.course_id) THEN
    RAISE EXCEPTION 'Quiz hiện không khả dụng với tài khoản của bạn' USING ERRCODE = '42501';
  END IF;

  -- Nộp lại cùng một lần làm (mất mạng / bấm 2 lần) -> trả kết quả cũ, không tạo bản ghi trùng
  IF p_client_attempt_id IS NOT NULL THEN
    SELECT * INTO v_attempt FROM public.quiz_attempts
    WHERE student_id = auth.uid() AND client_attempt_id = p_client_attempt_id;
  END IF;

  IF v_attempt.id IS NULL THEN
    SELECT count(*),
           count(*) FILTER (WHERE (p_answers ->> qq.id::text) ~ '^\d+$'
                              AND (p_answers ->> qq.id::text)::INTEGER = qq.answer_key)
      INTO v_total, v_correct
    FROM public.quiz_questions qq WHERE qq.quiz_id = q.id;

    IF v_total = 0 THEN
      RAISE EXCEPTION 'Quiz chưa có câu hỏi' USING ERRCODE = 'P0002';
    END IF;

    v_score := round(v_correct * 100.0 / v_total, 2);
    v_passed := v_score >= COALESCE(q.pass_score, 50);

    INSERT INTO public.quiz_attempts (quiz_id, student_id, answers, score, is_passed, submitted_at, client_attempt_id)
    VALUES (q.id, auth.uid(), COALESCE(p_answers, '{}'::jsonb), v_score, v_passed, now(), p_client_attempt_id)
    RETURNING * INTO v_attempt;
  END IF;

  SELECT count(*),
         count(*) FILTER (WHERE (v_attempt.answers ->> qq.id::text) ~ '^\d+$'
                            AND (v_attempt.answers ->> qq.id::text)::INTEGER = qq.answer_key)
    INTO v_total, v_correct
  FROM public.quiz_questions qq WHERE qq.quiz_id = q.id;

  RETURN jsonb_build_object(
    'attempt_id', v_attempt.id,
    'score', v_attempt.score,
    'is_passed', v_attempt.is_passed,
    'submitted_at', v_attempt.submitted_at,
    'total_questions', v_total,
    'correct_count', v_correct,
    -- Đáp án + giải thích chỉ trả về SAU khi đã nộp
    'review', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', qq.id, 'answer_key', qq.answer_key, 'explanation', qq.explanation,
        'selected', v_attempt.answers -> qq.id::text
      ) ORDER BY qq.position)
      FROM public.quiz_questions qq WHERE qq.quiz_id = q.id
    ), '[]'::jsonb)
  );
END;
$$;

-- 8. QUYỀN THỰC THI HÀM ------------------------------------------------------------
REVOKE ALL ON FUNCTION public.get_quiz_for_attempt(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_quiz_attempt(UUID, JSONB, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_quiz_for_attempt(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_quiz_attempt(UUID, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_course_catalog() TO anon, authenticated;
