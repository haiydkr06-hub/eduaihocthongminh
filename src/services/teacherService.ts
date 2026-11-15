import { supabase, isSupabaseConfigured, withTimeout } from '../lib/supabase'
import { demoDb, type DbQuestion } from './demoDb'
import { notificationService } from './notificationService'
import { ServiceError } from './studentService'

/* ============================== KIỂU DỮ LIỆU ============================== */

export interface TeacherStats {
  totalCourses: number
  publishedCourses: number
  draftCourses: number
  totalStudents: number
  /** Bài nộp chưa được giảng viên xem/nhận xét */
  pendingGrading: number
  /** Điểm trung bình các bài quiz trong khóa của giảng viên (null nếu chưa có bài nộp) */
  avgQuizScore: number | null
  recentSubmissions: StudentSubmission[]
}

export interface TeacherCourse {
  id: string
  title: string
  category: string
  status: 'draft' | 'published' | 'archived'
  lessonsCount: number
  studentsCount: number
  createdAt: string
  description?: string
}

export interface TeacherLesson {
  id: string
  course_id: string
  title: string
  content: string
  video_url?: string
  duration_minutes: number
  position: number
}

export interface StudentInClass {
  id: string
  studentId: string
  name: string
  email: string
  courseId: string
  courseName: string
  enrolledAt: string
  progressPercent: number
  /** null nếu học viên chưa làm quiz nào trong khóa */
  avgScore: number | null
  lastActivityAt: string | null
  /** Điểm các lần làm quiz trong khóa, theo thứ tự thời gian */
  scores: number[]
  failedCount: number
  /** Điểm đạt trung bình của các quiz trong khóa (mặc định 50) */
  passScore: number
}

export interface QuestionInsight {
  quizId: string
  quizTitle: string
  courseTitle: string
  questionId: string
  position: number
  prompt: string
  options: string[]
  answerKey: number
  explanation: string
  attempts: number
  correctCount: number
  unanswered: number
  /** Tỷ lệ sai (kể cả bỏ trống), 0–100 */
  wrongRate: number
  /** Số lượt chọn từng phương án */
  optionCounts: number[]
}

export interface SubmissionItem {
  prompt: string
  options: string[]
  answerKey: number
  selected: number | null
  explanation: string
  correct: boolean
}

export interface SubmissionDetail {
  id: string
  studentName: string
  quizTitle: string
  courseTitle: string
  score: number
  passScore: number
  items: SubmissionItem[]
}

export interface TeacherQuizQuestion {
  prompt: string
  options: string[]
  answer_key: number
  explanation: string
}

export interface TeacherQuiz {
  id: string
  course_id: string
  courseTitle: string
  title: string
  timeLimit: number
  passScore: number
  questionsCount: number
  status: 'draft' | 'published' | 'archived'
  submissionsCount: number
  avgScore: number | null
}

export interface StudentSubmission {
  id: string
  quizId: string
  quizTitle: string
  courseTitle: string
  studentName: string
  studentEmail: string
  score: number | null
  isPassed: boolean
  submittedAt: string
  feedback?: string
  status: 'pending' | 'graded'
}

export interface CreateQuizInput {
  course_id: string
  title: string
  timeLimit: number
  passScore: number
  status: 'draft' | 'published'
  questions: TeacherQuizQuestion[]
}

/* ============================== DỮ LIỆU THÔ ============================== */

interface RawTeacherData {
  courses: { id: string; title: string; category: string; status: TeacherCourse['status']; created_at: string; description: string | null }[]
  lessons: { id: string; course_id: string }[]
  enrollments: { student_id: string; course_id: string; enrolled_at: string; status: string }[]
  progress: { student_id: string; lesson_id: string; completed_at: string | null }[]
  quizzes: { id: string; course_id: string; title: string; time_limit_minutes: number; pass_score: number; status: TeacherQuiz['status']; questions_count: number }[]
  attempts: { id: string; quiz_id: string; student_id: string; score: number; is_passed: boolean; submitted_at: string; feedback: string | null; graded_at: string | null }[]
  students: { id: string; full_name: string; email: string }[]
}

/** `teacherId` = null nghĩa là Admin xem toàn bộ. */
function demoTeacherRaw(teacherId: string | null): RawTeacherData {
  const t = demoDb.read()
  const courses = t.courses.filter((c) => !teacherId || c.teacher_id === teacherId)
  const ids = new Set(courses.map((c) => c.id))
  const quizzes = t.quizzes.filter((q) => ids.has(q.course_id))
  const quizIds = new Set(quizzes.map((q) => q.id))
  const lessons = t.lessons.filter((l) => ids.has(l.course_id))
  const lessonIds = new Set(lessons.map((l) => l.id))
  const enrollments = t.enrollments.filter((e) => ids.has(e.course_id))
  const studentIds = new Set([
    ...enrollments.map((e) => e.student_id),
    ...t.attempts.filter((a) => quizIds.has(a.quiz_id)).map((a) => a.student_id),
  ])
  return {
    courses: courses.map((c) => ({ ...c })),
    lessons,
    enrollments,
    progress: t.progress.filter((p) => lessonIds.has(p.lesson_id)),
    quizzes: quizzes.map((q) => ({ ...q, questions_count: q.questions.length })),
    attempts: t.attempts
      .filter((a) => quizIds.has(a.quiz_id))
      .map((a) => ({ ...a, feedback: a.feedback ?? null, graded_at: a.graded_at ?? null })),
    students: t.profiles.filter((p) => studentIds.has(p.id)),
  }
}

async function supabaseTeacherRaw(teacherId: string | null): Promise<RawTeacherData> {
  let courseQuery = supabase.from('courses').select('id, title, category, status, created_at, description').order('created_at', { ascending: false })
  if (teacherId) courseQuery = courseQuery.eq('teacher_id', teacherId)
  const { data: courseRows, error: courseErr } = await withTimeout(courseQuery)
  if (courseErr) throw courseErr
  const courses = (courseRows || []) as RawTeacherData['courses']
  const ids = courses.map((c) => c.id)
  if (ids.length === 0) return { courses, lessons: [], enrollments: [], progress: [], quizzes: [], attempts: [], students: [] }

  const [lessonsRes, enrollRes, quizRes] = await Promise.all([
    withTimeout(supabase.from('lessons').select('id, course_id').in('course_id', ids)),
    withTimeout(supabase.from('enrollments').select('student_id, course_id, enrolled_at, status, profiles:student_id (id, full_name, email)').in('course_id', ids)),
    withTimeout(supabase.from('quizzes').select('id, course_id, title, time_limit_minutes, pass_score, status, quiz_questions (count)').in('course_id', ids)),
  ])
  if (lessonsRes.error) throw lessonsRes.error
  if (enrollRes.error) throw enrollRes.error
  if (quizRes.error) throw quizRes.error

  const lessons = (lessonsRes.data || []) as RawTeacherData['lessons']
  interface EnrollRow { student_id: string; course_id: string; enrolled_at: string; status: string; profiles: { id: string; full_name: string; email: string } | null }
  const enrollRows = (enrollRes.data || []) as unknown as EnrollRow[]
  interface QuizRow { id: string; course_id: string; title: string; time_limit_minutes: number | null; pass_score: number | null; status: TeacherQuiz['status']; quiz_questions: { count: number }[] | null }
  const quizzes = ((quizRes.data || []) as unknown as QuizRow[]).map((q) => ({
    id: q.id,
    course_id: q.course_id,
    title: q.title,
    time_limit_minutes: q.time_limit_minutes ?? 15,
    pass_score: Number(q.pass_score ?? 50),
    status: q.status,
    questions_count: q.quiz_questions?.[0]?.count ?? 0,
  }))

  const lessonIds = lessons.map((l) => l.id)
  const quizIds = quizzes.map((q) => q.id)
  const [progressRes, attemptRes] = await Promise.all([
    lessonIds.length
      ? withTimeout(supabase.from('lesson_progress').select('student_id, lesson_id, completed_at').in('lesson_id', lessonIds).eq('is_completed', true))
      : Promise.resolve({ data: [], error: null }),
    quizIds.length
      ? withTimeout(supabase.from('quiz_attempts').select('id, quiz_id, student_id, score, is_passed, submitted_at, feedback, graded_at').in('quiz_id', quizIds).order('submitted_at', { ascending: false }))
      : Promise.resolve({ data: [], error: null }),
  ])
  if (progressRes.error) throw progressRes.error
  if (attemptRes.error) throw attemptRes.error

  const students = new Map<string, { id: string; full_name: string; email: string }>()
  enrollRows.forEach((e) => e.profiles && students.set(e.profiles.id, e.profiles))

  return {
    courses,
    lessons,
    enrollments: enrollRows.map(({ student_id, course_id, enrolled_at, status }) => ({ student_id, course_id, enrolled_at, status })),
    progress: (progressRes.data || []) as RawTeacherData['progress'],
    quizzes,
    attempts: ((attemptRes.data || []) as RawTeacherData['attempts']).map((a) => ({ ...a, score: Number(a.score) })),
    students: [...students.values()],
  }
}

const loadTeacherRaw = (teacherId: string | null) =>
  isSupabaseConfigured ? supabaseTeacherRaw(teacherId) : Promise.resolve(demoTeacherRaw(teacherId))

function toSubmissions(raw: RawTeacherData): StudentSubmission[] {
  return [...raw.attempts]
    .sort((a, b) => b.submitted_at.localeCompare(a.submitted_at))
    .map((a) => {
      const quiz = raw.quizzes.find((q) => q.id === a.quiz_id)
      const student = raw.students.find((s) => s.id === a.student_id)
      return {
        id: a.id,
        quizId: a.quiz_id,
        quizTitle: quiz?.title || 'Quiz',
        courseTitle: raw.courses.find((c) => c.id === quiz?.course_id)?.title || '',
        studentName: student?.full_name || 'Học viên',
        studentEmail: student?.email || '',
        score: a.score,
        isPassed: a.is_passed,
        submittedAt: a.submitted_at,
        feedback: a.feedback || undefined,
        status: a.graded_at ? 'graded' : 'pending',
      }
    })
}

/** Báo cho học viên khi giảng viên chấm/nhận xét (không làm hỏng thao tác chấm nếu gửi lỗi). */
async function notifyGraded(studentId: string, quizTitle: string, score: number, feedback: string) {
  try {
    await notificationService.send({
      userId: studentId,
      title: `Giảng viên đã nhận xét bài "${quizTitle}"`,
      message: `Điểm: ${Math.round(score)}/100.${feedback.trim() ? ` Nhận xét: ${feedback.trim()}` : ''}`,
      type: 'info',
    })
  } catch (err) {
    console.warn('Không gửi được thông báo chấm bài:', err)
  }
}

const avg = (values: number[]) => (values.length ? Math.round(values.reduce((s, v) => s + v, 0) / values.length) : null)

/* ============================== SERVICE ============================== */

export const teacherService = {
  /** `teacherId` null = Admin xem toàn hệ thống. */
  async getStats(teacherId: string | null): Promise<TeacherStats> {
    const raw = await loadTeacherRaw(teacherId)
    const submissions = toSubmissions(raw)
    return {
      totalCourses: raw.courses.length,
      publishedCourses: raw.courses.filter((c) => c.status === 'published').length,
      draftCourses: raw.courses.filter((c) => c.status === 'draft').length,
      totalStudents: new Set(raw.enrollments.filter((e) => e.status !== 'dropped').map((e) => e.student_id)).size,
      pendingGrading: submissions.filter((s) => s.status === 'pending').length,
      avgQuizScore: avg(raw.attempts.map((a) => a.score)),
      recentSubmissions: submissions.slice(0, 4),
    }
  },

  async getCourses(teacherId: string | null): Promise<TeacherCourse[]> {
    const raw = await loadTeacherRaw(teacherId)
    return raw.courses.map((c) => ({
      id: c.id,
      title: c.title,
      category: c.category || 'Tổng hợp',
      status: c.status,
      lessonsCount: raw.lessons.filter((l) => l.course_id === c.id).length,
      studentsCount: raw.enrollments.filter((e) => e.course_id === c.id && e.status !== 'dropped').length,
      createdAt: c.created_at,
      description: c.description || '',
    }))
  },

  /** Tạo khóa học ở trạng thái nháp và báo Admin duyệt. Ném lỗi nếu thất bại. */
  async createCourse(teacherId: string, course: { title: string; category: string; description: string }): Promise<TeacherCourse> {
    const title = course.title.trim()
    if (!title) throw new ServiceError('Vui lòng nhập tên khóa học.')

    let created: TeacherCourse
    if (!isSupabaseConfigured) {
      created = demoDb.write((t) => {
        const row = {
          id: demoDb.newId('course'),
          teacher_id: teacherId,
          title,
          category: course.category,
          description: course.description,
          status: 'draft' as const,
          created_at: new Date().toISOString(),
        }
        t.courses.unshift(row)
        return { id: row.id, title, category: row.category, status: row.status, lessonsCount: 0, studentsCount: 0, createdAt: row.created_at, description: row.description }
      }, 'eduai:courses_updated')
    } else {
      const { data, error } = await withTimeout(
        supabase
          .from('courses')
          .insert({ teacher_id: teacherId, title, category: course.category, description: course.description, status: 'draft' })
          .select()
          .single()
      )
      if (error) throw error
      created = { id: data.id, title: data.title, category: data.category, status: data.status, lessonsCount: 0, studentsCount: 0, createdAt: data.created_at, description: data.description || '' }
    }

    // Báo Admin (không làm hỏng thao tác tạo khóa nếu gửi thông báo lỗi)
    try {
      await notificationService.send({
        title: 'Khóa học mới chờ phê duyệt',
        message: `Giảng viên vừa tạo khóa học "${title}". Vui lòng kiểm tra và duyệt xuất bản.`,
        type: 'info',
        target: 'admins',
      })
    } catch (err) {
      console.warn('Không gửi được thông báo duyệt khóa học:', err)
    }
    return created
  },

  async getLessons(courseId: string): Promise<TeacherLesson[]> {
    if (!isSupabaseConfigured) {
      return demoDb
        .read()
        .lessons.filter((l) => l.course_id === courseId)
        .sort((a, b) => a.position - b.position)
    }
    const { data, error } = await withTimeout(
      supabase.from('lessons').select('*').eq('course_id', courseId).order('position', { ascending: true })
    )
    if (error) throw error
    return (data || []) as TeacherLesson[]
  },

  /** Thêm bài học. Vị trí tự động = cuối danh sách (tránh trùng position). Ném lỗi nếu thất bại. */
  async addLesson(lesson: Omit<TeacherLesson, 'id' | 'position'> & { position?: number }): Promise<TeacherLesson> {
    if (!lesson.title.trim()) throw new ServiceError('Vui lòng nhập tên bài học.')
    const { position: _ignored, ...fields } = lesson
    void _ignored
    if (!isSupabaseConfigured) {
      return demoDb.write((t) => {
        const maxPos = Math.max(0, ...t.lessons.filter((l) => l.course_id === lesson.course_id).map((l) => l.position))
        const row: TeacherLesson = { ...fields, id: demoDb.newId(`${lesson.course_id}-l`), position: maxPos + 1 }
        t.lessons.push(row)
        return row
      }, 'eduai:courses_updated')
    }
    const { data: last, error: posErr } = await withTimeout(
      supabase.from('lessons').select('position').eq('course_id', lesson.course_id).order('position', { ascending: false }).limit(1)
    )
    if (posErr) throw posErr
    const position = ((last?.[0] as { position?: number } | undefined)?.position ?? 0) + 1
    const { data, error } = await withTimeout(supabase.from('lessons').insert({ ...fields, position }).select().single())
    if (error) throw error
    return data as TeacherLesson
  },

  /** Học viên trong các khóa của giảng viên, tiến độ & điểm tính từ dữ liệu thật. */
  async getStudents(teacherId: string | null): Promise<StudentInClass[]> {
    const raw = await loadTeacherRaw(teacherId)
    return raw.enrollments
      .filter((e) => e.status !== 'dropped')
      .map((e) => {
        const student = raw.students.find((s) => s.id === e.student_id)
        const courseLessons = raw.lessons.filter((l) => l.course_id === e.course_id)
        const lessonIds = new Set(courseLessons.map((l) => l.id))
        const done = raw.progress.filter((p) => p.student_id === e.student_id && lessonIds.has(p.lesson_id))
        const courseQuizIds = new Set(raw.quizzes.filter((q) => q.course_id === e.course_id).map((q) => q.id))
        const myAttempts = raw.attempts.filter((a) => a.student_id === e.student_id && courseQuizIds.has(a.quiz_id))
        const ordered = [...myAttempts].sort((a, b) => a.submitted_at.localeCompare(b.submitted_at))
        // Điểm đạt: theo các quiz học viên đã làm; chưa làm thì theo quiz đã xuất bản của khóa
        const attemptedQuizIds = new Set(myAttempts.map((a) => a.quiz_id))
        const attemptedPass = raw.quizzes.filter((q) => attemptedQuizIds.has(q.id)).map((q) => q.pass_score)
        const coursePass = attemptedPass.length
          ? attemptedPass
          : raw.quizzes.filter((q) => q.course_id === e.course_id && q.status === 'published').map((q) => q.pass_score)
        const activity = [e.enrolled_at, ...done.map((p) => p.completed_at), ...myAttempts.map((a) => a.submitted_at)]
          .filter((d): d is string => !!d)
          .sort()
        return {
          id: `${e.student_id}:${e.course_id}`,
          studentId: e.student_id,
          name: student?.full_name || 'Học viên',
          email: student?.email || '',
          courseId: e.course_id,
          courseName: raw.courses.find((c) => c.id === e.course_id)?.title || '',
          enrolledAt: e.enrolled_at,
          progressPercent: courseLessons.length ? Math.round((done.length / courseLessons.length) * 100) : 0,
          avgScore: avg(myAttempts.map((a) => a.score)),
          lastActivityAt: activity.pop() || null,
          scores: ordered.map((a) => a.score),
          failedCount: ordered.filter((a) => !a.is_passed).length,
          passScore: avg(coursePass) ?? 50,
        }
      })
  },

  async getQuizzes(teacherId: string | null): Promise<TeacherQuiz[]> {
    const raw = await loadTeacherRaw(teacherId)
    return raw.quizzes.map((q) => {
      const attempts = raw.attempts.filter((a) => a.quiz_id === q.id)
      return {
        id: q.id,
        course_id: q.course_id,
        courseTitle: raw.courses.find((c) => c.id === q.course_id)?.title || '',
        title: q.title,
        timeLimit: q.time_limit_minutes,
        passScore: q.pass_score,
        questionsCount: q.questions_count,
        status: q.status,
        submissionsCount: attempts.length,
        avgScore: avg(attempts.map((a) => a.score)),
      }
    })
  },

  /** Lưu quiz (kèm câu hỏi) — được lưu thật, không mất khi tải lại trang. */
  async createQuiz(teacherId: string, input: CreateQuizInput): Promise<TeacherQuiz> {
    const title = input.title.trim()
    if (!title) throw new ServiceError('Vui lòng nhập tên quiz.')
    if (!input.course_id) throw new ServiceError('Vui lòng chọn khóa học.')
    if (input.status === 'published' && input.questions.length === 0) {
      throw new ServiceError('Quiz cần ít nhất 1 câu hỏi trước khi xuất bản.')
    }
    input.questions.forEach((q, i) => {
      if (!q.prompt.trim() || q.options.length < 2 || q.options.some((o) => !o.trim())) {
        throw new ServiceError(`Câu ${i + 1} chưa đầy đủ nội dung hoặc lựa chọn.`)
      }
      if (q.answer_key < 0 || q.answer_key >= q.options.length) throw new ServiceError(`Câu ${i + 1} chưa chọn đáp án đúng.`)
    })

    if (!isSupabaseConfigured) {
      return demoDb.write((t) => {
        const course = t.courses.find((c) => c.id === input.course_id)
        if (!course) throw new ServiceError('Không tìm thấy khóa học.')
        const id = demoDb.newId('quiz')
        const questions: DbQuestion[] = input.questions.map((q, i) => ({ ...q, id: `${id}-${i + 1}` }))
        t.quizzes.push({
          id,
          course_id: input.course_id,
          title,
          time_limit_minutes: input.timeLimit,
          pass_score: input.passScore,
          status: input.status,
          created_by: teacherId,
          created_at: new Date().toISOString(),
          questions,
        })
        return {
          id, course_id: input.course_id, courseTitle: course.title, title, timeLimit: input.timeLimit, passScore: input.passScore,
          questionsCount: questions.length, status: input.status, submissionsCount: 0, avgScore: null,
        }
      }, 'eduai:quizzes_updated')
    }

    const { data: quiz, error } = await withTimeout(
      supabase
        .from('quizzes')
        .insert({ course_id: input.course_id, title, time_limit_minutes: input.timeLimit, pass_score: input.passScore, status: 'draft', created_by: teacherId })
        .select('id, course_id, courses:course_id (title)')
        .single()
    )
    if (error) throw error
    if (input.questions.length) {
      const { error: qErr } = await withTimeout(
        supabase.from('quiz_questions').insert(
          input.questions.map((q, i) => ({ quiz_id: quiz.id, prompt: q.prompt, options: q.options, answer_key: q.answer_key, explanation: q.explanation, position: i }))
        )
      )
      if (qErr) {
        // Không để lại quiz rỗng nếu lưu câu hỏi thất bại
        await supabase.from('quizzes').delete().eq('id', quiz.id)
        throw qErr
      }
    }
    // Chỉ xuất bản sau khi câu hỏi đã lưu xong
    if (input.status === 'published') {
      const { error: pubErr } = await withTimeout(supabase.from('quizzes').update({ status: 'published' }).eq('id', quiz.id))
      if (pubErr) throw pubErr
    }
    const courseTitle = (quiz as unknown as { courses: { title: string } | null }).courses?.title || ''
    return {
      id: quiz.id, course_id: input.course_id, courseTitle, title, timeLimit: input.timeLimit, passScore: input.passScore,
      questionsCount: input.questions.length, status: input.status, submissionsCount: 0, avgScore: null,
    }
  },

  async setQuizStatus(quizId: string, status: 'draft' | 'published' | 'archived'): Promise<void> {
    if (!isSupabaseConfigured) {
      demoDb.write((t) => {
        const quiz = t.quizzes.find((q) => q.id === quizId)
        if (!quiz) throw new ServiceError('Không tìm thấy quiz.')
        if (status === 'published' && quiz.questions.length === 0) throw new ServiceError('Quiz chưa có câu hỏi, không thể xuất bản.')
        quiz.status = status
      }, 'eduai:quizzes_updated')
      return
    }
    const { error } = await withTimeout(supabase.from('quizzes').update({ status }).eq('id', quizId))
    if (error) throw error
  },

  async getSubmissions(teacherId: string | null): Promise<StudentSubmission[]> {
    return toSubmissions(await loadTeacherRaw(teacherId))
  },

  /** Lưu điểm + nhận xét của giảng viên. Ném lỗi nếu thất bại (không còn báo thành công giả). */
  async gradeSubmission(subId: string, score: number, feedback: string, graderId: string): Promise<void> {
    if (!Number.isFinite(score) || score < 0 || score > 100) throw new ServiceError('Điểm phải nằm trong khoảng 0–100.')
    const gradedAt = new Date().toISOString()
    let studentId: string
    let quizTitle: string

    if (!isSupabaseConfigured) {
      ;({ studentId, quizTitle } = demoDb.write((t) => {
        const attempt = t.attempts.find((a) => a.id === subId)
        if (!attempt) throw new ServiceError('Không tìm thấy bài nộp.')
        const quiz = t.quizzes.find((q) => q.id === attempt.quiz_id)
        attempt.score = score
        attempt.is_passed = score >= (quiz?.pass_score ?? 50)
        attempt.feedback = feedback.trim() || undefined
        attempt.graded_at = gradedAt
        return { studentId: attempt.student_id, quizTitle: quiz?.title || 'bài kiểm tra' }
      }, 'eduai:attempts_updated'))
      await notifyGraded(studentId, quizTitle, score, feedback)
      return
    }

    const { data: attempt, error: readErr } = await withTimeout(
      supabase.from('quiz_attempts').select('student_id, quizzes:quiz_id (title, pass_score)').eq('id', subId).single()
    )
    if (readErr) throw readErr
    const attemptRow = attempt as unknown as { student_id: string; quizzes: { title: string; pass_score: number } | null }
    const passScore = Number(attemptRow.quizzes?.pass_score ?? 50)
    studentId = attemptRow.student_id
    quizTitle = attemptRow.quizzes?.title || 'bài kiểm tra'
    const { error } = await withTimeout(
      supabase
        .from('quiz_attempts')
        .update({ score, is_passed: score >= passScore, feedback: feedback.trim() || null, graded_by: graderId, graded_at: gradedAt })
        .eq('id', subId)
    )
    if (error) throw error
    await notifyGraded(studentId, quizTitle, score, feedback)
  },

  /** Thống kê từng câu hỏi: tỷ lệ sai và phân bố lựa chọn (dùng cho phân tích AI). */
  async getQuestionInsights(teacherId: string | null): Promise<QuestionInsight[]> {
    interface Q { id: string; quiz_id: string; prompt: string; options: string[]; answer_key: number; explanation: string; position: number }
    interface A { quiz_id: string; answers: Record<string, number> }
    let quizzes: { id: string; title: string; course_id: string }[]
    let courses: { id: string; title: string }[]
    let questions: Q[]
    let attempts: A[]

    if (!isSupabaseConfigured) {
      const t = demoDb.read()
      courses = t.courses.filter((c) => !teacherId || c.teacher_id === teacherId)
      const ids = new Set(courses.map((c) => c.id))
      const qz = t.quizzes.filter((q) => ids.has(q.course_id))
      quizzes = qz
      questions = qz.flatMap((q) => q.questions.map((qq, i) => ({ ...qq, quiz_id: q.id, position: i })))
      const qids = new Set(qz.map((q) => q.id))
      attempts = t.attempts.filter((a) => qids.has(a.quiz_id))
    } else {
      let courseQuery = supabase.from('courses').select('id, title')
      if (teacherId) courseQuery = courseQuery.eq('teacher_id', teacherId)
      const { data: c, error: cErr } = await withTimeout(courseQuery)
      if (cErr) throw cErr
      courses = (c || []) as { id: string; title: string }[]
      if (courses.length === 0) return []
      const { data: q, error: qErr } = await withTimeout(
        supabase.from('quizzes').select('id, title, course_id').in('course_id', courses.map((x) => x.id))
      )
      if (qErr) throw qErr
      quizzes = (q || []) as { id: string; title: string; course_id: string }[]
      if (quizzes.length === 0) return []
      const quizIds = quizzes.map((x) => x.id)
      const [qqRes, aRes] = await Promise.all([
        withTimeout(supabase.from('quiz_questions').select('id, quiz_id, prompt, options, answer_key, explanation, position').in('quiz_id', quizIds)),
        withTimeout(supabase.from('quiz_attempts').select('quiz_id, answers').in('quiz_id', quizIds).limit(5000)),
      ])
      if (qqRes.error) throw qqRes.error
      if (aRes.error) throw aRes.error
      questions = (qqRes.data || []) as Q[]
      attempts = (aRes.data || []) as A[]
    }

    return questions
      .map((q) => {
        const quiz = quizzes.find((x) => x.id === q.quiz_id)
        const related = attempts.filter((a) => a.quiz_id === q.quiz_id)
        const optionCounts = q.options.map(() => 0)
        let unanswered = 0
        let correct = 0
        related.forEach((a) => {
          const sel = a.answers?.[q.id]
          if (typeof sel !== 'number' || sel < 0 || sel >= q.options.length) unanswered++
          else {
            optionCounts[sel]++
            if (sel === q.answer_key) correct++
          }
        })
        return {
          quizId: q.quiz_id,
          quizTitle: quiz?.title || 'Quiz',
          courseTitle: courses.find((c) => c.id === quiz?.course_id)?.title || '',
          questionId: q.id,
          position: q.position + 1,
          prompt: q.prompt,
          options: q.options,
          answerKey: q.answer_key,
          explanation: q.explanation || '',
          attempts: related.length,
          correctCount: correct,
          unanswered,
          wrongRate: related.length ? Math.round(((related.length - correct) / related.length) * 100) : 0,
          optionCounts,
        }
      })
      .filter((x) => x.attempts > 0)
      .sort((a, b) => b.wrongRate - a.wrongRate || b.attempts - a.attempts)
  },

  /** Chi tiết bài làm (đáp án từng câu) để AI gợi ý nhận xét. */
  async getSubmissionDetail(subId: string): Promise<SubmissionDetail> {
    if (!isSupabaseConfigured) {
      const t = demoDb.read()
      const a = t.attempts.find((x) => x.id === subId)
      if (!a) throw new ServiceError('Không tìm thấy bài nộp.')
      const quiz = t.quizzes.find((q) => q.id === a.quiz_id)
      if (!quiz) throw new ServiceError('Không tìm thấy quiz.')
      return {
        id: a.id,
        studentName: t.profiles.find((p) => p.id === a.student_id)?.full_name || 'Học viên',
        quizTitle: quiz.title,
        courseTitle: t.courses.find((c) => c.id === quiz.course_id)?.title || '',
        score: a.score,
        passScore: quiz.pass_score,
        items: quiz.questions.map((q) => {
          const selected = typeof a.answers[q.id] === 'number' ? a.answers[q.id] : null
          return { prompt: q.prompt, options: q.options, answerKey: q.answer_key, selected, explanation: q.explanation, correct: selected === q.answer_key }
        }),
      }
    }
    const { data, error } = await withTimeout(
      supabase
        .from('quiz_attempts')
        .select('id, score, answers, quiz_id, profiles:student_id (full_name), quizzes:quiz_id (title, pass_score, courses:course_id (title))')
        .eq('id', subId)
        .single()
    )
    if (error) throw error
    const row = data as unknown as {
      id: string
      score: number
      answers: Record<string, number>
      quiz_id: string
      profiles: { full_name: string } | null
      quizzes: { title: string; pass_score: number; courses: { title: string } | null } | null
    }
    const { data: qs, error: qErr } = await withTimeout(
      supabase.from('quiz_questions').select('id, prompt, options, answer_key, explanation, position').eq('quiz_id', row.quiz_id).order('position')
    )
    if (qErr) throw qErr
    return {
      id: row.id,
      studentName: row.profiles?.full_name || 'Học viên',
      quizTitle: row.quizzes?.title || 'Quiz',
      courseTitle: row.quizzes?.courses?.title || '',
      score: Number(row.score),
      passScore: Number(row.quizzes?.pass_score ?? 50),
      items: ((qs || []) as { id: string; prompt: string; options: string[]; answer_key: number; explanation: string }[]).map((q) => {
        const selected = typeof row.answers?.[q.id] === 'number' ? row.answers[q.id] : null
        return { prompt: q.prompt, options: q.options, answerKey: q.answer_key, selected, explanation: q.explanation || '', correct: selected === q.answer_key }
      }),
    }
  },
}
