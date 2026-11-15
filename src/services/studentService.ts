import { supabase, isSupabaseConfigured, withTimeout } from '../lib/supabase'
import { demoDb, type DbAttempt } from './demoDb'

/* ============================== KIỂU DỮ LIỆU ============================== */

export interface WeeklyBucket {
  label: string
  minutes: number
  isToday: boolean
}

export interface NextLessonInfo {
  courseId: string
  courseTitle: string
  lessonId: string
  lessonTitle: string
  position: number
  instructor: string
}

export interface StudentDashboardStats {
  enrolledCoursesCount: number
  completedCoursesCount: number
  /** Tổng giờ học = tổng thời lượng các bài đã hoàn thành */
  studyHours: number
  /** Điểm tích lũy = 10 điểm / bài hoàn thành + điểm cao nhất của mỗi quiz */
  points: number
  /** % mục tiêu tuần (mục tiêu: WEEKLY_LESSON_GOAL bài / 7 ngày) */
  weeklyGoalPercent: number
  weeklyGoalLessons: number
  lessonsThisWeek: number
  weekHours: number
  weekly: WeeklyBucket[]
  quizzesTaken: number
  averageQuizScore: number | null
  nextLesson: NextLessonInfo | null
}

export interface StudentCourseItem {
  id: string
  title: string
  category: string
  instructor: string
  progress: number
  lessonsCompleted: number
  totalLessons: number
  accent: string
  illustration: string
  status: 'Đang học' | 'Hoàn thành'
  description?: string
  isEnrolled?: boolean
  lastActivityAt?: string | null
}

export interface StudentLessonItem {
  id: string
  course_id: string
  title: string
  content: string
  video_url?: string
  duration_minutes: number
  position: number
  is_completed?: boolean
}

export interface QuizQuestionItem {
  id: string
  prompt: string
  options: string[]
}

export interface QuizDetailItem {
  id: string
  title: string
  course_id: string
  course_title: string
  time_limit_minutes: number
  pass_score: number
  questions: QuizQuestionItem[]
}

export interface QuizReviewItem {
  id: string
  answer_key: number
  explanation: string
  selected: number | null
}

export interface QuizResultItem {
  attemptId: string
  score: number
  totalQuestions: number
  correctCount: number
  isPassed: boolean
  submittedAt: string
  /** Đáp án + giải thích chỉ có SAU khi nộp bài */
  review: QuizReviewItem[]
}

export interface StudentQuizItem {
  id: string
  title: string
  course_id: string
  course_title: string
  questions_count: number
  time_limit_minutes: number
  pass_score: number
  bestScore: number | null
  attempts: number
  lastSubmittedAt: string | null
}

export interface StudentAttemptItem {
  id: string
  quiz_id: string
  quiz_title: string
  course_title: string
  score: number
  is_passed: boolean
  submitted_at: string
  feedback?: string
}

export type EnrollResult = 'enrolled' | 'already_enrolled'

export interface AchievementBadge {
  key: 'first_step' | 'streak' | 'quiz_master' | 'course_done' | 'explorer'
  title: string
  description: string
  unlocked: boolean
  /** Tiến độ hướng tới huy hiệu, 0–100 */
  progress: number
}

export interface StudentAchievements {
  streakDays: number
  lessonsCompleted: number
  bestQuizScore: number | null
  badges: AchievementBadge[]
  certificates: { courseId: string; courseTitle: string; instructor: string; completedAt: string | null }[]
}

/* ============================== HẰNG SỐ & TIỆN ÍCH ============================== */

export const WEEKLY_LESSON_GOAL = 5
const POINTS_PER_LESSON = 10
const ACCENTS = ['lavender', 'mint', 'peach'] as const
const CATEGORY_ICON: Record<string, string> = {
  'Toán học': '∑',
  'Khoa học': '✳',
  'Ngoại ngữ': 'A',
  'Công nghệ': '⚡',
}

function decorate(idx: number, category: string) {
  return { accent: ACCENTS[idx % ACCENTS.length], illustration: CATEGORY_ICON[category] || '✦' }
}

export class ServiceError extends Error {}

interface RawCourse {
  id: string
  title: string
  category: string
  description?: string | null
  instructor: string
  enrollmentStatus?: string
}
interface RawLesson {
  id: string
  course_id: string
  title: string
  duration_minutes: number
  position: number
}
interface RawData {
  courses: RawCourse[]
  lessons: RawLesson[]
  completed: { lesson_id: string; completed_at: string | null }[]
  attempts: { quiz_id: string; score: number; submitted_at: string | null }[]
}

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

/** Tính tiến độ từng khóa từ dữ liệu thật (không còn gán cứng 68% / 42%...). */
function buildCourseItems(raw: RawData): StudentCourseItem[] {
  const completedAt = new Map(raw.completed.map((c) => [c.lesson_id, c.completed_at]))
  return raw.courses.map((c, idx) => {
    const lessons = raw.lessons.filter((l) => l.course_id === c.id)
    const done = lessons.filter((l) => completedAt.has(l.id))
    const progress = lessons.length ? Math.round((done.length / lessons.length) * 100) : 0
    const last = done
      .map((l) => completedAt.get(l.id))
      .filter((d): d is string => !!d)
      .sort()
      .pop()
    return {
      id: c.id,
      title: c.title,
      category: c.category || 'Tổng hợp',
      instructor: c.instructor || 'Giảng viên EduAI',
      progress,
      lessonsCompleted: done.length,
      totalLessons: lessons.length,
      ...decorate(idx, c.category),
      status: lessons.length > 0 && progress >= 100 ? 'Hoàn thành' : 'Đang học',
      description: c.description || undefined,
      isEnrolled: true,
      lastActivityAt: last ?? null,
    }
  })
}

function buildStats(raw: RawData): StudentDashboardStats {
  const courses = buildCourseItems(raw)
  const lessonById = new Map(raw.lessons.map((l) => [l.id, l]))
  const doneSet = new Set(raw.completed.map((c) => c.lesson_id))

  const totalMinutes = raw.completed.reduce((sum, c) => sum + (lessonById.get(c.lesson_id)?.duration_minutes || 0), 0)

  // 7 ngày gần nhất (kết thúc hôm nay)
  const today = new Date()
  const labels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
  const weekly: WeeklyBucket[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (6 - i))
    return { label: labels[d.getDay()], minutes: 0, isToday: i === 6, key: dayKey(d) } as WeeklyBucket & { key: string }
  })
  let lessonsThisWeek = 0
  raw.completed.forEach((c) => {
    if (!c.completed_at) return
    const bucket = (weekly as (WeeklyBucket & { key: string })[]).find((b) => b.key === dayKey(new Date(c.completed_at!)))
    if (bucket) {
      bucket.minutes += lessonById.get(c.lesson_id)?.duration_minutes || 0
      lessonsThisWeek++
    }
  })
  const weekMinutes = weekly.reduce((s, b) => s + b.minutes, 0)

  // Điểm cao nhất mỗi quiz
  const best = new Map<string, number>()
  raw.attempts.forEach((a) => best.set(a.quiz_id, Math.max(best.get(a.quiz_id) ?? 0, Number(a.score) || 0)))
  const bestScores = [...best.values()]

  // Bài học tiếp theo: bài chưa học đầu tiên của khóa đang học có hoạt động gần nhất
  const inProgress = courses
    .filter((c) => c.status === 'Đang học' && c.totalLessons > 0)
    .sort((a, b) => (b.lastActivityAt || '').localeCompare(a.lastActivityAt || ''))
  let nextLesson: NextLessonInfo | null = null
  for (const course of inProgress) {
    const next = raw.lessons
      .filter((l) => l.course_id === course.id)
      .sort((a, b) => a.position - b.position)
      .find((l) => !doneSet.has(l.id))
    if (next) {
      nextLesson = {
        courseId: course.id,
        courseTitle: course.title,
        lessonId: next.id,
        lessonTitle: next.title,
        position: next.position,
        instructor: course.instructor,
      }
      break
    }
  }

  return {
    enrolledCoursesCount: courses.length,
    completedCoursesCount: courses.filter((c) => c.status === 'Hoàn thành').length,
    studyHours: Math.round((totalMinutes / 60) * 10) / 10,
    points: raw.completed.length * POINTS_PER_LESSON + Math.round(bestScores.reduce((s, v) => s + v, 0)),
    weeklyGoalPercent: Math.min(100, Math.round((lessonsThisWeek / WEEKLY_LESSON_GOAL) * 100)),
    weeklyGoalLessons: WEEKLY_LESSON_GOAL,
    lessonsThisWeek,
    weekHours: Math.round((weekMinutes / 60) * 10) / 10,
    weekly: weekly.map(({ label, minutes, isToday }) => ({ label, minutes, isToday })),
    quizzesTaken: raw.attempts.length,
    averageQuizScore: raw.attempts.length
      ? Math.round(raw.attempts.reduce((s, a) => s + (Number(a.score) || 0), 0) / raw.attempts.length)
      : null,
    nextLesson,
  }
}

/* ============================== NGUỒN DỮ LIỆU ============================== */

function demoRaw(studentId: string): RawData {
  const t = demoDb.read()
  const teacherName = (id: string) => t.profiles.find((p) => p.id === id)?.full_name || 'Giảng viên EduAI'
  const enrolls = t.enrollments.filter((e) => e.student_id === studentId && e.status !== 'dropped')
  const courses: RawCourse[] = enrolls
    .map((e): RawCourse | null => {
      const c = t.courses.find((x) => x.id === e.course_id)
      return c
        ? { id: c.id, title: c.title, category: c.category, description: c.description, instructor: teacherName(c.teacher_id), enrollmentStatus: e.status }
        : null
    })
    .filter((c): c is RawCourse => c !== null)
  const ids = new Set(courses.map((c) => c.id))
  return {
    courses,
    lessons: t.lessons.filter((l) => ids.has(l.course_id)),
    completed: t.progress.filter((p) => p.student_id === studentId),
    attempts: t.attempts.filter((a) => a.student_id === studentId),
  }
}

async function supabaseRaw(studentId: string): Promise<RawData> {
  const { data: enrollRows, error: enrollErr } = await withTimeout(
    supabase
      .from('enrollments')
      .select('status, courses:course_id (id, title, category, description, profiles:teacher_id (full_name))')
      .eq('student_id', studentId)
      .neq('status', 'dropped')
  )
  if (enrollErr) throw enrollErr

  interface Row {
    status: string
    courses: { id: string; title: string; category: string; description: string | null; profiles: { full_name: string } | null } | null
  }
  const courses: RawCourse[] = ((enrollRows || []) as unknown as Row[])
    .filter((r) => r.courses)
    .map((r) => ({
      id: r.courses!.id,
      title: r.courses!.title,
      category: r.courses!.category,
      description: r.courses!.description,
      instructor: r.courses!.profiles?.full_name || 'Giảng viên EduAI',
      enrollmentStatus: r.status,
    }))
  const courseIds = courses.map((c) => c.id)
  if (courseIds.length === 0) return { courses, lessons: [], completed: [], attempts: [] }

  const [lessonsRes, progressRes, attemptsRes] = await Promise.all([
    withTimeout(supabase.from('lessons').select('id, course_id, title, duration_minutes, position').in('course_id', courseIds)),
    withTimeout(supabase.from('lesson_progress').select('lesson_id, completed_at').eq('student_id', studentId).eq('is_completed', true)),
    withTimeout(supabase.from('quiz_attempts').select('quiz_id, score, submitted_at').eq('student_id', studentId)),
  ])
  if (lessonsRes.error) throw lessonsRes.error
  if (progressRes.error) throw progressRes.error
  if (attemptsRes.error) throw attemptsRes.error

  return {
    courses,
    lessons: (lessonsRes.data || []) as RawLesson[],
    completed: (progressRes.data || []) as RawData['completed'],
    attempts: (attemptsRes.data || []) as RawData['attempts'],
  }
}

const loadRaw = (studentId: string) => (isSupabaseConfigured ? supabaseRaw(studentId) : Promise.resolve(demoRaw(studentId)))

/** Chấm điểm (dùng cho chế độ demo, mô phỏng đúng RPC submit_quiz_attempt ở server). */
function gradeDemo(quizId: string, studentId: string, answers: Record<string, number>, clientAttemptId?: string): QuizResultItem {
  return demoDb.write((t) => {
    const quiz = t.quizzes.find((q) => q.id === quizId)
    if (!quiz || quiz.status !== 'published') throw new ServiceError('Quiz hiện không khả dụng.')
    if (!t.enrollments.some((e) => e.student_id === studentId && e.course_id === quiz.course_id && e.status !== 'dropped')) {
      throw new ServiceError('Bạn cần đăng ký khóa học trước khi làm quiz này.')
    }
    if (quiz.questions.length === 0) throw new ServiceError('Quiz chưa có câu hỏi.')

    // Nộp lại cùng một lần làm (bấm 2 lần / hết giờ cùng lúc) -> trả kết quả cũ
    let attempt: DbAttempt | undefined = clientAttemptId
      ? t.attempts.find((a) => a.student_id === studentId && a.client_attempt_id === clientAttemptId)
      : undefined

    if (!attempt) {
      const correct = quiz.questions.filter((q) => answers[q.id] === q.answer_key).length
      const score = Math.round((correct * 100) / quiz.questions.length * 100) / 100
      attempt = {
        id: demoDb.newId('att'),
        quiz_id: quiz.id,
        student_id: studentId,
        answers,
        score,
        is_passed: score >= quiz.pass_score,
        submitted_at: new Date().toISOString(),
        client_attempt_id: clientAttemptId,
      }
      t.attempts.push(attempt)
    }
    const saved = attempt
    const correctCount = quiz.questions.filter((q) => saved.answers[q.id] === q.answer_key).length
    return {
      attemptId: saved.id,
      score: saved.score,
      totalQuestions: quiz.questions.length,
      correctCount,
      isPassed: saved.is_passed,
      submittedAt: saved.submitted_at,
      review: quiz.questions.map((q) => ({
        id: q.id,
        answer_key: q.answer_key,
        explanation: q.explanation,
        selected: saved.answers[q.id] ?? null,
      })),
    }
  }, 'eduai:attempts_updated')
}

/** Chuỗi ngày học liên tiếp (tính đến hôm nay, hoặc hôm qua nếu hôm nay chưa học). */
function computeStreak(dates: string[]): number {
  const days = new Set(dates.map((d) => dayKey(new Date(d))))
  const cursor = new Date()
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  let streak = 0
  while (days.has(dayKey(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

function buildAchievements(raw: RawData): StudentAchievements {
  const courses = buildCourseItems(raw)
  const streakDays = computeStreak(raw.completed.map((c) => c.completed_at).filter((d): d is string => !!d))
  const bestQuizScore = raw.attempts.length ? Math.max(...raw.attempts.map((a) => Number(a.score) || 0)) : null
  const done = courses.filter((c) => c.status === 'Hoàn thành')
  const pct = (v: number, goal: number) => Math.min(100, Math.round((v / goal) * 100))
  return {
    streakDays,
    lessonsCompleted: raw.completed.length,
    bestQuizScore,
    badges: [
      { key: 'first_step', title: 'Bước chân đầu tiên', description: 'Hoàn thành bài học đầu tiên.', unlocked: raw.completed.length >= 1, progress: pct(raw.completed.length, 1) },
      { key: 'streak', title: 'Chiến binh Kiên trì', description: 'Học liên tục 3 ngày trở lên.', unlocked: streakDays >= 3, progress: pct(streakDays, 3) },
      { key: 'quiz_master', title: 'Bậc thầy Trắc nghiệm', description: 'Đạt từ 90 điểm trở lên trong một bài kiểm tra.', unlocked: (bestQuizScore ?? 0) >= 90, progress: pct(bestQuizScore ?? 0, 90) },
      { key: 'course_done', title: 'Về đích', description: 'Hoàn thành trọn vẹn một khóa học.', unlocked: done.length >= 1, progress: done.length ? 100 : Math.max(0, ...courses.map((c) => c.progress)) },
      { key: 'explorer', title: 'Nhà thám hiểm tri thức', description: 'Tham gia từ 3 khóa học trở lên.', unlocked: courses.length >= 3, progress: pct(courses.length, 3) },
    ],
    certificates: done.map((c) => ({ courseId: c.id, courseTitle: c.title, instructor: c.instructor, completedAt: c.lastActivityAt ?? null })),
  }
}

/* ============================== SERVICE ============================== */

export const studentService = {
  async getDashboardStats(studentId: string): Promise<StudentDashboardStats> {
    return buildStats(await loadRaw(studentId))
  },

  async getMyCourses(studentId: string): Promise<StudentCourseItem[]> {
    return buildCourseItems(await loadRaw(studentId))
  },

  async getAchievements(studentId: string): Promise<StudentAchievements> {
    return buildAchievements(await loadRaw(studentId))
  },

  /** Danh mục khóa đã xuất bản; đánh dấu khóa học viên đã đăng ký. */
  async getAllAvailableCourses(studentId?: string): Promise<StudentCourseItem[]> {
    if (!isSupabaseConfigured) {
      const t = demoDb.read()
      const enrolled = new Set(
        t.enrollments.filter((e) => e.student_id === studentId && e.status !== 'dropped').map((e) => e.course_id)
      )
      return t.courses
        .filter((c) => c.status === 'published')
        .map((c, idx) => ({
          id: c.id,
          title: c.title,
          category: c.category,
          instructor: t.profiles.find((p) => p.id === c.teacher_id)?.full_name || 'Giảng viên EduAI',
          progress: 0,
          lessonsCompleted: 0,
          totalLessons: t.lessons.filter((l) => l.course_id === c.id).length,
          ...decorate(idx, c.category),
          status: 'Đang học' as const,
          description: c.description,
          isEnrolled: enrolled.has(c.id),
        }))
    }

    const [catalogRes, enrolledRes] = await Promise.all([
      withTimeout(supabase.rpc('get_course_catalog')),
      studentId
        ? withTimeout(supabase.from('enrollments').select('course_id').eq('student_id', studentId).neq('status', 'dropped'))
        : Promise.resolve({ data: [], error: null }),
    ])
    if (catalogRes.error) throw catalogRes.error
    if (enrolledRes.error) throw enrolledRes.error
    const enrolled = new Set(((enrolledRes.data || []) as { course_id: string }[]).map((e) => e.course_id))

    interface CatalogRow {
      id: string
      title: string
      category: string
      description: string | null
      teacher_name: string | null
      lessons_count: number
    }
    return ((catalogRes.data || []) as CatalogRow[]).map((c, idx) => ({
      id: c.id,
      title: c.title,
      category: c.category,
      instructor: c.teacher_name || 'Giảng viên EduAI',
      progress: 0,
      lessonsCompleted: 0,
      totalLessons: Number(c.lessons_count) || 0,
      ...decorate(idx, c.category),
      status: 'Đang học' as const,
      description: c.description || undefined,
      isEnrolled: enrolled.has(c.id),
    }))
  },

  /** Ghi danh. Ném lỗi khi thất bại (không còn báo thành công giả). */
  async enrollCourse(studentId: string, courseId: string): Promise<EnrollResult> {
    if (!isSupabaseConfigured) {
      return demoDb.write((t) => {
        const course = t.courses.find((c) => c.id === courseId)
        if (!course || course.status !== 'published') throw new ServiceError('Khóa học hiện chưa mở đăng ký.')
        const existing = t.enrollments.find((e) => e.student_id === studentId && e.course_id === courseId)
        if (existing && existing.status !== 'dropped') return 'already_enrolled' as const
        if (existing) existing.status = 'active'
        else t.enrollments.push({ student_id: studentId, course_id: courseId, status: 'active', enrolled_at: new Date().toISOString() })
        return 'enrolled' as const
      }, 'eduai:enrollments_updated')
    }

    const { error } = await withTimeout(
      supabase.from('enrollments').insert({ student_id: studentId, course_id: courseId, status: 'active' })
    )
    if (error) {
      // 23505 = unique_violation -> đã đăng ký trước đó
      if (error.code === '23505') return 'already_enrolled'
      throw error
    }
    return 'enrolled'
  },

  async getLessons(courseId: string, studentId: string): Promise<StudentLessonItem[]> {
    if (!isSupabaseConfigured) {
      const t = demoDb.read()
      const course = t.courses.find((c) => c.id === courseId)
      if (!course) throw new ServiceError('Không tìm thấy khóa học.')
      const viewer = t.profiles.find((p) => p.id === studentId)
      const canView =
        viewer?.role === 'admin' ||
        course.teacher_id === studentId ||
        (course.status === 'published' &&
          t.enrollments.some((e) => e.student_id === studentId && e.course_id === courseId && e.status !== 'dropped'))
      if (!canView) throw new ServiceError('Bạn cần đăng ký khóa học này để xem nội dung bài học.')
      const done = new Set(t.progress.filter((p) => p.student_id === studentId).map((p) => p.lesson_id))
      return t.lessons
        .filter((l) => l.course_id === courseId)
        .sort((a, b) => a.position - b.position)
        .map((l) => ({ ...l, is_completed: done.has(l.id) }))
    }

    const [lessonsRes, progressRes] = await Promise.all([
      withTimeout(supabase.from('lessons').select('*').eq('course_id', courseId).order('position', { ascending: true })),
      withTimeout(supabase.from('lesson_progress').select('lesson_id').eq('student_id', studentId).eq('is_completed', true)),
    ])
    if (lessonsRes.error) throw lessonsRes.error
    if (progressRes.error) throw progressRes.error
    const done = new Set(((progressRes.data || []) as { lesson_id: string }[]).map((p) => p.lesson_id))
    return ((lessonsRes.data || []) as StudentLessonItem[]).map((l) => ({
      ...l,
      duration_minutes: l.duration_minutes || 0,
      is_completed: done.has(l.id),
    }))
  },

  /** Đánh dấu hoàn thành bài học (idempotent). Ném lỗi khi thất bại. */
  async markLessonComplete(studentId: string, lessonId: string): Promise<void> {
    if (!isSupabaseConfigured) {
      demoDb.write((t) => {
        const lesson = t.lessons.find((l) => l.id === lessonId)
        if (!lesson) throw new ServiceError('Không tìm thấy bài học.')
        if (!t.progress.some((p) => p.student_id === studentId && p.lesson_id === lessonId)) {
          t.progress.push({ student_id: studentId, lesson_id: lessonId, completed_at: new Date().toISOString() })
        }
        const courseLessons = t.lessons.filter((l) => l.course_id === lesson.course_id)
        const allDone = courseLessons.every((l) => t.progress.some((p) => p.student_id === studentId && p.lesson_id === l.id))
        const enrollment = t.enrollments.find((e) => e.student_id === studentId && e.course_id === lesson.course_id)
        if (enrollment && allDone) enrollment.status = 'completed'
      }, 'eduai:progress_updated')
      return
    }

    // onConflict theo cặp (student_id, lesson_id) — trước đây thiếu nên lần 2 bị lỗi trùng khóa
    const { error } = await withTimeout(
      supabase.from('lesson_progress').upsert(
        { student_id: studentId, lesson_id: lessonId, is_completed: true, completed_at: new Date().toISOString() },
        { onConflict: 'student_id,lesson_id' }
      )
    )
    if (error) throw error
  },

  /** Quiz đã xuất bản thuộc các khóa học viên đã đăng ký, kèm điểm cao nhất của học viên. */
  async getMyQuizzes(studentId: string, courseId?: string): Promise<StudentQuizItem[]> {
    if (!isSupabaseConfigured) {
      const t = demoDb.read()
      const enrolled = new Set(
        t.enrollments.filter((e) => e.student_id === studentId && e.status !== 'dropped').map((e) => e.course_id)
      )
      return t.quizzes
        .filter((q) => q.status === 'published' && enrolled.has(q.course_id) && (!courseId || q.course_id === courseId))
        .map((q) => {
          const mine = t.attempts.filter((a) => a.quiz_id === q.id && a.student_id === studentId)
          return {
            id: q.id,
            title: q.title,
            course_id: q.course_id,
            course_title: t.courses.find((c) => c.id === q.course_id)?.title || '',
            questions_count: q.questions.length,
            time_limit_minutes: q.time_limit_minutes,
            pass_score: q.pass_score,
            bestScore: mine.length ? Math.max(...mine.map((a) => a.score)) : null,
            attempts: mine.length,
            lastSubmittedAt: mine.map((a) => a.submitted_at).sort().pop() || null,
          }
        })
    }

    let query = supabase
      .from('quizzes')
      .select('id, title, course_id, time_limit_minutes, pass_score, courses:course_id (title), quiz_questions (count)')
      .eq('status', 'published')
    if (courseId) query = query.eq('course_id', courseId)
    const [quizRes, attemptRes] = await Promise.all([
      withTimeout(query),
      withTimeout(supabase.from('quiz_attempts').select('quiz_id, score, submitted_at').eq('student_id', studentId)),
    ])
    if (quizRes.error) throw quizRes.error
    if (attemptRes.error) throw attemptRes.error
    const attempts = (attemptRes.data || []) as { quiz_id: string; score: number; submitted_at: string }[]
    interface Row {
      id: string
      title: string
      course_id: string
      time_limit_minutes: number | null
      pass_score: number | null
      courses: { title: string } | null
      quiz_questions: { count: number }[] | null
    }
    return ((quizRes.data || []) as unknown as Row[]).map((q) => {
      const mine = attempts.filter((a) => a.quiz_id === q.id)
      return {
        id: q.id,
        title: q.title,
        course_id: q.course_id,
        course_title: q.courses?.title || '',
        questions_count: q.quiz_questions?.[0]?.count ?? 0,
        time_limit_minutes: q.time_limit_minutes ?? 15,
        pass_score: Number(q.pass_score ?? 50),
        bestScore: mine.length ? Math.max(...mine.map((a) => Number(a.score))) : null,
        attempts: mine.length,
        lastSubmittedAt: mine.map((a) => a.submitted_at).sort().pop() || null,
      }
    })
  },

  /** Lịch sử bài làm của chính học viên. */
  async getMyAttempts(studentId: string): Promise<StudentAttemptItem[]> {
    if (!isSupabaseConfigured) {
      const t = demoDb.read()
      return t.attempts
        .filter((a) => a.student_id === studentId)
        .sort((a, b) => b.submitted_at.localeCompare(a.submitted_at))
        .map((a) => {
          const quiz = t.quizzes.find((q) => q.id === a.quiz_id)
          return {
            id: a.id,
            quiz_id: a.quiz_id,
            quiz_title: quiz?.title || 'Quiz',
            course_title: t.courses.find((c) => c.id === quiz?.course_id)?.title || '',
            score: a.score,
            is_passed: a.is_passed,
            submitted_at: a.submitted_at,
            feedback: a.feedback,
          }
        })
    }
    const { data, error } = await withTimeout(
      supabase
        .from('quiz_attempts')
        .select('id, quiz_id, score, is_passed, submitted_at, feedback, quizzes:quiz_id (title, courses:course_id (title))')
        .eq('student_id', studentId)
        .order('submitted_at', { ascending: false })
    )
    if (error) throw error
    interface Row {
      id: string
      quiz_id: string
      score: number
      is_passed: boolean
      submitted_at: string
      feedback: string | null
      quizzes: { title: string; courses: { title: string } | null } | null
    }
    return ((data || []) as unknown as Row[]).map((a) => ({
      id: a.id,
      quiz_id: a.quiz_id,
      quiz_title: a.quizzes?.title || 'Quiz',
      course_title: a.quizzes?.courses?.title || '',
      score: Number(a.score),
      is_passed: a.is_passed,
      submitted_at: a.submitted_at,
      feedback: a.feedback || undefined,
    }))
  },

  /** Lấy đề để làm bài — KHÔNG kèm đáp án (đáp án chỉ trả về sau khi nộp). */
  async getQuiz(quizId: string, studentId: string): Promise<QuizDetailItem> {
    if (!isSupabaseConfigured) {
      const t = demoDb.read()
      const quiz = t.quizzes.find((q) => q.id === quizId)
      if (!quiz) throw new ServiceError('Quiz không tồn tại.')
      const viewer = t.profiles.find((p) => p.id === studentId)
      const course = t.courses.find((c) => c.id === quiz.course_id)
      const canView =
        viewer?.role === 'admin' ||
        course?.teacher_id === studentId ||
        (quiz.status === 'published' &&
          t.enrollments.some((e) => e.student_id === studentId && e.course_id === quiz.course_id && e.status !== 'dropped'))
      if (!canView) throw new ServiceError('Quiz hiện không khả dụng với tài khoản của bạn (chưa đăng ký khóa học hoặc quiz chưa xuất bản).')
      return {
        id: quiz.id,
        title: quiz.title,
        course_id: quiz.course_id,
        course_title: course?.title || '',
        time_limit_minutes: quiz.time_limit_minutes,
        pass_score: quiz.pass_score,
        questions: quiz.questions.map(({ id, prompt, options }) => ({ id, prompt, options })),
      }
    }

    const { data, error } = await withTimeout(supabase.rpc('get_quiz_for_attempt', { p_quiz_id: quizId }))
    if (error) throw error
    const q = data as QuizDetailItem
    return { ...q, pass_score: Number(q.pass_score), questions: q.questions || [] }
  },

  /**
   * Nộp bài. Điểm được chấm ở server (RPC) — client không tự chấm.
   * `answers`: { [questionId]: chỉ số lựa chọn }. `clientAttemptId` chống nộp trùng.
   */
  async submitQuizAttempt(
    quizId: string,
    studentId: string,
    answers: Record<string, number>,
    clientAttemptId: string
  ): Promise<QuizResultItem> {
    if (!isSupabaseConfigured) {
      return gradeDemo(quizId, studentId, answers, clientAttemptId)
    }

    const { data, error } = await withTimeout(
      supabase.rpc('submit_quiz_attempt', {
        p_quiz_id: quizId,
        p_answers: answers,
        p_client_attempt_id: clientAttemptId,
      })
    )
    if (error) throw error
    const r = data as {
      attempt_id: string
      score: number
      is_passed: boolean
      submitted_at: string
      total_questions: number
      correct_count: number
      review: QuizReviewItem[]
    }
    return {
      attemptId: r.attempt_id,
      score: Number(r.score),
      totalQuestions: r.total_questions,
      correctCount: r.correct_count,
      isPassed: r.is_passed,
      submittedAt: r.submitted_at,
      review: r.review || [],
    }
  },
}
