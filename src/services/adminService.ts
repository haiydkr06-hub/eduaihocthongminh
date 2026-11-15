import { supabase, isSupabaseConfigured, withTimeout } from '../lib/supabase'
import type { AppRole, Profile } from '../types/auth'
import { listDemoAccounts } from '../lib/demoAccounts'
import { demoDb } from './demoDb'
import { notificationService, type NotificationTarget } from './notificationService'
import { ServiceError } from './studentService'

/* ============================== KIỂU DỮ LIỆU ============================== */

export interface PendingCourseItem {
  id: string
  title: string
  category: string
  instructor_name: string
  lessons_count: number
  created_at: string
}

export interface ActivityItem {
  id: string
  kind: 'attempt' | 'enrollment' | 'course'
  text: string
  at: string
}

export interface AdminStats {
  totalStudents: number
  totalTeachers: number
  totalCourses: number
  publishedCourses: number
  totalQuizzes: number
  totalAttempts: number
  /** % lượt làm quiz đạt yêu cầu (null nếu chưa có lượt nào) */
  passRate: number | null
  /** Số học viên đăng ký mới trong 30 ngày gần đây */
  newStudents30d: number
  pendingCourses: PendingCourseItem[]
  recentActivity: ActivityItem[]
}

export interface AdminCourseItem {
  id: string
  title: string
  category: string
  instructor_name: string
  lessons_count: number
  students_count: number
  status: 'draft' | 'published' | 'archived'
  created_at: string
}

export interface AdminQuizItem {
  id: string
  title: string
  course_title: string
  questions_count: number
  time_limit_minutes: number
  pass_score: number
  status: 'draft' | 'published' | 'archived'
  attempts_count: number
  avg_score: number | null
}

export interface SystemNotificationItem {
  id: string
  title: string
  message: string
  type: string
  created_at: string
  target: NotificationTarget | 'user'
}

export interface SubjectReportRow {
  category: string
  courses: number
  students: number
  attempts: number
  avgScore: number | null
  passRate: number | null
}

export interface AdminReport {
  subjects: SubjectReportRow[]
  /** Phân bố điểm: [0-49], [50-69], [70-84], [85-100] */
  gradeDistribution: { label: string; count: number; percent: number }[]
  totalAttempts: number
  overallAvgScore: number | null
  overallPassRate: number | null
  /** % lượt ghi danh đã hoàn thành toàn bộ bài học */
  courseCompletionRate: number | null
}

/* ============================== DỮ LIỆU THÔ ============================== */

interface RawAdminData {
  profiles: { id: string; full_name: string; email: string; role: AppRole; created_at: string }[]
  courses: { id: string; teacher_id: string; title: string; category: string; status: AdminCourseItem['status']; created_at: string }[]
  lessons: { id: string; course_id: string }[]
  enrollments: { student_id: string; course_id: string; enrolled_at: string; status: string }[]
  quizzes: { id: string; course_id: string; title: string; time_limit_minutes: number; pass_score: number; status: AdminQuizItem['status']; questions_count: number }[]
  attempts: { id: string; quiz_id: string; student_id: string; score: number; is_passed: boolean; submitted_at: string }[]
}

function demoAdminRaw(): RawAdminData {
  const t = demoDb.read()
  // Gộp tài khoản đăng ký ở chế độ demo vào danh sách người dùng
  const extra = listDemoAccounts().filter((a) => !t.profiles.some((p) => p.id === a.id))
  return {
    profiles: [
      ...t.profiles,
      ...extra.map((a) => ({ id: a.id, full_name: a.full_name, email: a.email, role: a.role, created_at: new Date().toISOString() })),
    ],
    courses: t.courses,
    lessons: t.lessons,
    enrollments: t.enrollments,
    quizzes: t.quizzes.map((q) => ({ ...q, questions_count: q.questions.length })),
    attempts: t.attempts,
  }
}

async function supabaseAdminRaw(): Promise<RawAdminData> {
  const [p, c, l, e, q, a] = await Promise.all([
    withTimeout(supabase.from('profiles').select('id, full_name, email, role, created_at')),
    withTimeout(supabase.from('courses').select('id, teacher_id, title, category, status, created_at').order('created_at', { ascending: false })),
    withTimeout(supabase.from('lessons').select('id, course_id')),
    withTimeout(supabase.from('enrollments').select('student_id, course_id, enrolled_at, status')),
    withTimeout(supabase.from('quizzes').select('id, course_id, title, time_limit_minutes, pass_score, status, quiz_questions (count)')),
    withTimeout(supabase.from('quiz_attempts').select('id, quiz_id, student_id, score, is_passed, submitted_at').order('submitted_at', { ascending: false }).limit(2000)),
  ])
  for (const res of [p, c, l, e, q, a]) if (res.error) throw res.error
  interface QuizRow { id: string; course_id: string; title: string; time_limit_minutes: number | null; pass_score: number | null; status: AdminQuizItem['status']; quiz_questions: { count: number }[] | null }
  return {
    profiles: (p.data || []) as RawAdminData['profiles'],
    courses: (c.data || []) as RawAdminData['courses'],
    lessons: (l.data || []) as RawAdminData['lessons'],
    enrollments: (e.data || []) as RawAdminData['enrollments'],
    quizzes: ((q.data || []) as unknown as QuizRow[]).map((x) => ({
      id: x.id,
      course_id: x.course_id,
      title: x.title,
      time_limit_minutes: x.time_limit_minutes ?? 15,
      pass_score: Number(x.pass_score ?? 50),
      status: x.status,
      questions_count: x.quiz_questions?.[0]?.count ?? 0,
    })),
    attempts: ((a.data || []) as RawAdminData['attempts']).map((x) => ({ ...x, score: Number(x.score) })),
  }
}

const loadAdminRaw = () => (isSupabaseConfigured ? supabaseAdminRaw() : Promise.resolve(demoAdminRaw()))

const avg = (values: number[]) => (values.length ? Math.round(values.reduce((s, v) => s + v, 0) / values.length) : null)
const pct = (part: number, total: number) => (total ? Math.round((part / total) * 100) : null)

/* ============================== SERVICE ============================== */

export const adminService = {
  async getStats(): Promise<AdminStats> {
    const raw = await loadAdminRaw()
    const name = (id: string) => raw.profiles.find((p) => p.id === id)?.full_name || 'Người dùng'
    const courseTitle = (id: string) => raw.courses.find((c) => c.id === id)?.title || 'khóa học'
    const since30 = new Date(Date.now() - 30 * 24 * 3600_000).toISOString()

    const activity: ActivityItem[] = [
      ...raw.attempts.map((a) => {
        const quiz = raw.quizzes.find((q) => q.id === a.quiz_id)
        return {
          id: `a-${a.id}`,
          kind: 'attempt' as const,
          text: `${name(a.student_id)} nộp bài "${quiz?.title || 'quiz'}" đạt ${Math.round(a.score)}/100 điểm${a.is_passed ? '' : ' (chưa đạt)'}.`,
          at: a.submitted_at,
        }
      }),
      ...raw.enrollments.map((e) => ({
        id: `e-${e.student_id}-${e.course_id}`,
        kind: 'enrollment' as const,
        text: `${name(e.student_id)} đăng ký khóa "${courseTitle(e.course_id)}".`,
        at: e.enrolled_at,
      })),
      ...raw.courses.map((c) => ({
        id: `c-${c.id}`,
        kind: 'course' as const,
        text: `${name(c.teacher_id)} tạo khóa học "${c.title}".`,
        at: c.created_at,
      })),
    ]
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 6)

    return {
      totalStudents: raw.profiles.filter((p) => p.role === 'student').length,
      totalTeachers: raw.profiles.filter((p) => p.role === 'teacher').length,
      totalCourses: raw.courses.length,
      publishedCourses: raw.courses.filter((c) => c.status === 'published').length,
      totalQuizzes: raw.quizzes.length,
      totalAttempts: raw.attempts.length,
      passRate: pct(raw.attempts.filter((a) => a.is_passed).length, raw.attempts.length),
      newStudents30d: raw.profiles.filter((p) => p.role === 'student' && p.created_at >= since30).length,
      pendingCourses: raw.courses
        .filter((c) => c.status === 'draft')
        .map((c) => ({
          id: c.id,
          title: c.title,
          category: c.category,
          instructor_name: name(c.teacher_id),
          lessons_count: raw.lessons.filter((l) => l.course_id === c.id).length,
          created_at: c.created_at,
        })),
      recentActivity: activity,
    }
  },

  async getUsers(roleFilter?: string, searchQuery?: string): Promise<Profile[]> {
    const q = (searchQuery || '').trim().toLowerCase()
    const matches = (u: { role: string; full_name: string; email: string }) =>
      (!roleFilter || roleFilter === 'all' || u.role === roleFilter) &&
      (!q || u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))

    if (!isSupabaseConfigured) {
      return demoAdminRaw()
        .profiles.filter(matches)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
    }

    let query = supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(200)
    if (roleFilter && roleFilter !== 'all') query = query.eq('role', roleFilter)
    if (q) {
      // Tìm theo cả tên và email (trước đây chỉ tìm theo tên). Loại ký tự đặc biệt của cú pháp filter.
      const safe = q.replace(/[%,()]/g, ' ')
      query = query.or(`full_name.ilike.%${safe}%,email.ilike.%${safe}%`)
    }
    const { data, error } = await withTimeout(query)
    if (error) throw error
    return (data || []) as Profile[]
  },

  async updateUserRole(userId: string, newRole: AppRole, actingAdminId: string): Promise<void> {
    if (userId === actingAdminId && newRole !== 'admin') {
      throw new ServiceError('Bạn không thể tự hạ quyền tài khoản Admin đang đăng nhập.')
    }
    if (!isSupabaseConfigured) {
      demoDb.write((t) => {
        const p = t.profiles.find((x) => x.id === userId)
        if (!p) throw new ServiceError('Tài khoản demo tự đăng ký chỉ được đổi vai trò khi dùng Supabase.')
        p.role = newRole
      })
      return
    }
    const { error } = await withTimeout(supabase.from('profiles').update({ role: newRole }).eq('id', userId))
    if (error) throw error
  },

  async getCourses(): Promise<AdminCourseItem[]> {
    const raw = await loadAdminRaw()
    return raw.courses.map((c) => ({
      id: c.id,
      title: c.title,
      category: c.category || 'Tổng hợp',
      instructor_name: raw.profiles.find((p) => p.id === c.teacher_id)?.full_name || 'Giảng viên',
      lessons_count: raw.lessons.filter((l) => l.course_id === c.id).length,
      students_count: raw.enrollments.filter((e) => e.course_id === c.id && e.status !== 'dropped').length,
      status: c.status,
      created_at: c.created_at,
    }))
  },

  /** Duyệt / thu hồi khóa học và báo cho giảng viên. Ném lỗi nếu thất bại. */
  async updateCourseStatus(courseId: string, status: 'draft' | 'published' | 'archived'): Promise<void> {
    let course: { title: string; teacher_id: string } | undefined
    if (!isSupabaseConfigured) {
      course = demoDb.write((t) => {
        const c = t.courses.find((x) => x.id === courseId)
        if (!c) throw new ServiceError('Không tìm thấy khóa học.')
        c.status = status
        return { title: c.title, teacher_id: c.teacher_id }
      }, 'eduai:courses_updated', { courseId, status })
    } else {
      const { data, error } = await withTimeout(
        supabase.from('courses').update({ status }).eq('id', courseId).select('title, teacher_id').single()
      )
      if (error) throw error
      course = data as { title: string; teacher_id: string }
    }

    try {
      await notificationService.send({
        title: status === 'published' ? 'Khóa học đã được phê duyệt!' : 'Khóa học chuyển về bản nháp',
        message: `Khóa học "${course.title}" đã được Quản trị viên ${
          status === 'published' ? 'phê duyệt và chính thức xuất bản trên hệ thống.' : 'thu hồi về trạng thái bản nháp.'
        }`,
        type: status === 'published' ? 'success' : 'warning',
        userId: course.teacher_id,
      })
    } catch (err) {
      console.warn('Không gửi được thông báo cho giảng viên:', err)
    }
  },

  async getQuizzes(): Promise<AdminQuizItem[]> {
    const raw = await loadAdminRaw()
    return raw.quizzes.map((q) => {
      const attempts = raw.attempts.filter((a) => a.quiz_id === q.id)
      return {
        id: q.id,
        title: q.title,
        course_title: raw.courses.find((c) => c.id === q.course_id)?.title || 'Khóa học',
        questions_count: q.questions_count,
        time_limit_minutes: q.time_limit_minutes,
        pass_score: q.pass_score,
        status: q.status,
        attempts_count: attempts.length,
        avg_score: avg(attempts.map((a) => a.score)),
      }
    })
  },

  async getReport(): Promise<AdminReport> {
    const raw = await loadAdminRaw()
    const categories = [...new Set(raw.courses.map((c) => c.category || 'Tổng hợp'))]
    const subjects: SubjectReportRow[] = categories.map((cat) => {
      const courseIds = new Set(raw.courses.filter((c) => (c.category || 'Tổng hợp') === cat).map((c) => c.id))
      const quizIds = new Set(raw.quizzes.filter((q) => courseIds.has(q.course_id)).map((q) => q.id))
      const attempts = raw.attempts.filter((a) => quizIds.has(a.quiz_id))
      return {
        category: cat,
        courses: courseIds.size,
        students: new Set(raw.enrollments.filter((e) => courseIds.has(e.course_id)).map((e) => e.student_id)).size,
        attempts: attempts.length,
        avgScore: avg(attempts.map((a) => a.score)),
        passRate: pct(attempts.filter((a) => a.is_passed).length, attempts.length),
      }
    })
    const buckets = [
      { label: 'Giỏi (85–100)', min: 85, max: 100 },
      { label: 'Khá (70–84)', min: 70, max: 84.99 },
      { label: 'Trung bình (50–69)', min: 50, max: 69.99 },
      { label: 'Yếu (< 50)', min: 0, max: 49.99 },
    ]
    const total = raw.attempts.length
    return {
      subjects,
      gradeDistribution: buckets.map((b) => {
        const count = raw.attempts.filter((a) => a.score >= b.min && a.score <= b.max).length
        return { label: b.label, count, percent: pct(count, total) ?? 0 }
      }),
      totalAttempts: total,
      overallAvgScore: avg(raw.attempts.map((a) => a.score)),
      overallPassRate: pct(raw.attempts.filter((a) => a.is_passed).length, total),
      courseCompletionRate: pct(
        raw.enrollments.filter((e) => e.status === 'completed').length,
        raw.enrollments.filter((e) => e.status !== 'dropped').length
      ),
    }
  },

  /** Lịch sử thông báo hệ thống. */
  async getNotifications(): Promise<SystemNotificationItem[]> {
    if (!isSupabaseConfigured) {
      return demoDb
        .read()
        .notifications.sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((n) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          created_at: n.created_at,
          target: n.user_id ? 'user' : n.target,
        }))
    }
    // Mỗi người nhận có 1 dòng -> gộp các dòng cùng nội dung gửi cùng lúc thành 1 mục lịch sử
    const { data, error } = await withTimeout(
      supabase.from('notifications').select('id, title, message, type, created_at').order('created_at', { ascending: false }).limit(500)
    )
    if (error) throw error
    const seen = new Map<string, SystemNotificationItem>()
    ;((data || []) as { id: string; title: string; message: string; type: string | null; created_at: string }[]).forEach((n) => {
      const key = `${n.title}|${n.message}|${n.created_at.slice(0, 16)}`
      if (!seen.has(key)) {
        seen.set(key, { id: n.id, title: n.title, message: n.message, type: n.type || 'info', created_at: n.created_at, target: 'all' })
      }
    })
    return [...seen.values()]
  },

  /** Gửi thông báo hệ thống. Ném lỗi nếu thất bại; trả về số người nhận. */
  async createNotification(title: string, message: string, type = 'info', target: NotificationTarget = 'all'): Promise<number> {
    if (!title.trim() || !message.trim()) throw new ServiceError('Vui lòng nhập tiêu đề và nội dung thông báo.')
    return notificationService.send({ title: title.trim(), message: message.trim(), type, target })
  },
}
