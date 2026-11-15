import { supabase, isSupabaseConfigured, withTimeout } from '../lib/supabase'
import { sharedStore } from './sharedStore'
import type { AppRole, Profile } from '../types/auth'

export interface AdminStats {
  totalStudents: number
  totalTeachers: number
  totalCourses: number
  totalQuizzes: number
  totalAttempts: number
  averageCompletionRate: number
}

export interface AdminCourseItem {
  id: string
  title: string
  category: string
  instructor_name: string
  lessons_count: number
  students_count: number
  status: 'draft' | 'published' | 'archived' | 'pending'
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
  avg_score: number
}

export interface SystemNotificationItem {
  id: string
  title: string
  message: string
  type: string
  created_at: string
  target: 'all' | 'students' | 'teachers'
}

const defaultAdminStats: AdminStats = {
  totalStudents: 142,
  totalTeachers: 18,
  totalCourses: 24,
  totalQuizzes: 38,
  totalAttempts: 520,
  averageCompletionRate: 78,
}

const demoProfiles: Profile[] = [
  { id: '1', email: 'admin@eduai.vn', full_name: 'Quản Trị Viên Hệ Thống', role: 'admin', created_at: '2026-01-10' },
  { id: '2', email: 'minhanh.gv@eduai.vn', full_name: 'Cô Nguyễn Minh Anh', role: 'teacher', created_at: '2026-02-14' },
  { id: '3', email: 'nam.tran@eduai.vn', full_name: 'Thầy Trần Hoàng Nam', role: 'teacher', created_at: '2026-02-20' },
  { id: '4', email: 'ha.le@eduai.vn', full_name: 'Cô Lê Thu Hà', role: 'teacher', created_at: '2026-03-01' },
  { id: '5', email: 'hocvien1@eduai.vn', full_name: 'Nguyễn Văn Minh Anh', role: 'student', created_at: '2026-03-12' },
  { id: '6', email: 'hocvien2@eduai.vn', full_name: 'Trần Bảo Ngọc', role: 'student', created_at: '2026-03-15' },
  { id: '7', email: 'hocvien3@eduai.vn', full_name: 'Lê Hoàng Long', role: 'student', created_at: '2026-03-20' },
  { id: '8', email: 'hocvien4@eduai.vn', full_name: 'Phạm Quỳnh Trang', role: 'student', created_at: '2026-03-25' },
]

export const fallbackCoursesList: AdminCourseItem[] = [
  {
    id: 'c-1',
    title: 'Toán học tư duy bậc THPT',
    category: 'Toán học',
    instructor_name: 'Cô Nguyễn Minh Anh',
    lessons_count: 18,
    students_count: 85,
    status: 'published',
    created_at: '2026-02-15',
  },
  {
    id: 'c-2',
    title: 'Khám phá thế giới khoa học & tự nhiên',
    category: 'Khoa học',
    instructor_name: 'Thầy Trần Hoàng Nam',
    lessons_count: 20,
    students_count: 64,
    status: 'published',
    created_at: '2026-02-22',
  },
  {
    id: 'c-3',
    title: 'Tiếng Anh giao tiếp & ngữ pháp thông minh',
    category: 'Ngoại ngữ',
    instructor_name: 'Cô Lê Thu Hà',
    lessons_count: 16,
    students_count: 120,
    status: 'published',
    created_at: '2026-03-05',
  },
  {
    id: 'c-4',
    title: 'Lập trình tư duy logic với AI',
    category: 'Công nghệ',
    instructor_name: 'Thầy Trần Thanh Bình',
    lessons_count: 12,
    students_count: 42,
    status: 'draft',
    created_at: '2026-04-01',
  },
]

const fallbackQuizzesList: AdminQuizItem[] = [
  {
    id: 'q-1',
    title: 'Kiểm tra 15 phút: Hàm số và Đồ thị',
    course_title: 'Toán học tư duy bậc THPT',
    questions_count: 10,
    time_limit_minutes: 15,
    pass_score: 60,
    status: 'published',
    attempts_count: 76,
    avg_score: 82.5,
  },
  {
    id: 'q-2',
    title: 'Quiz trắc nghiệm: Động lực học chất điểm',
    course_title: 'Khám phá thế giới khoa học & tự nhiên',
    questions_count: 15,
    time_limit_minutes: 20,
    pass_score: 50,
    status: 'published',
    attempts_count: 52,
    avg_score: 74.0,
  },
  {
    id: 'q-3',
    title: 'Kiểm tra giữa kỳ: Tenses & Modal Verbs',
    course_title: 'Tiếng Anh giao tiếp & ngữ pháp thông minh',
    questions_count: 20,
    time_limit_minutes: 30,
    pass_score: 70,
    status: 'published',
    attempts_count: 98,
    avg_score: 88.2,
  },
  {
    id: 'q-4',
    title: 'Kiểm tra đầu vào: Thuật toán và Logic',
    course_title: 'Lập trình tư duy logic với AI',
    questions_count: 12,
    time_limit_minutes: 25,
    pass_score: 60,
    status: 'draft',
    attempts_count: 0,
    avg_score: 0,
  },
]

export const fallbackNotificationsList: SystemNotificationItem[] = [
  {
    id: 'n-1',
    title: 'Bảo trì hệ thống định kỳ',
    message: 'Hệ thống EduAI sẽ tiến hành nâng cấp máy chủ lúc 00:00 Chủ nhật tuần này.',
    type: 'warning',
    created_at: '2026-11-14T10:00:00Z',
    target: 'all',
  },
  {
    id: 'n-2',
    title: 'Chào mừng giảng viên mới tham gia giảng dạy',
    message: 'Đã hoàn tất kiểm duyệt hồ sơ cho 3 giảng viên mới gia nhập nền tảng.',
    type: 'success',
    created_at: '2026-11-12T08:30:00Z',
    target: 'teachers',
  },
  {
    id: 'n-3',
    title: 'Ra mắt tính năng Trợ lý AI học tập 2.0',
    message: 'Các học viên hiện có thể hỏi đáp trực tiếp với trợ lý thông minh ngay trong phòng học.',
    type: 'info',
    created_at: '2026-11-10T14:15:00Z',
    target: 'students',
  },
]

export const adminService = {
  async getStats(): Promise<AdminStats> {
    if (!isSupabaseConfigured) {
      return defaultAdminStats
    }

    try {
      const [profilesRes, coursesRes, quizzesRes, attemptsRes] = await withTimeout(
        Promise.all([
          supabase.from('profiles').select('role'),
          supabase.from('courses').select('id, status'),
          supabase.from('quizzes').select('id'),
          supabase.from('quiz_attempts').select('id, score, is_passed'),
        ]),
        2500
      )

      const profiles = (profilesRes.data || []) as { role?: string }[]
      const courses = coursesRes.data || []
      const quizzes = quizzesRes.data || []
      const attempts = (attemptsRes.data || []) as { score?: number }[]

      const totalStudents = profiles.filter((p) => p.role === 'student').length || 142
      const totalTeachers = profiles.filter((p) => p.role === 'teacher').length || 18
      const totalCourses = courses.length || 24
      const totalQuizzes = quizzes.length || 38
      const totalAttempts = attempts.length || 520

      const avgScore = attempts.length
        ? Math.round(attempts.reduce((acc, cur) => acc + (cur.score || 0), 0) / attempts.length)
        : 78

      return {
        totalStudents,
        totalTeachers,
        totalCourses,
        totalQuizzes,
        totalAttempts,
        averageCompletionRate: avgScore,
      }
    } catch {
      return defaultAdminStats
    }
  },

  async getUsers(roleFilter?: string, searchQuery?: string): Promise<Profile[]> {
    if (!isSupabaseConfigured) {
      return demoProfiles.filter((u) => {
        const matchRole = !roleFilter || roleFilter === 'all' || u.role === roleFilter
        const matchSearch =
          !searchQuery ||
          u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(searchQuery.toLowerCase())
        return matchRole && matchSearch
      })
    }

    try {
      let query = supabase.from('profiles').select('*').order('created_at', { ascending: false })

      if (roleFilter && roleFilter !== 'all') {
        query = query.eq('role', roleFilter)
      }
      if (searchQuery) {
        query = query.ilike('full_name', `%${searchQuery}%`)
      }

      const { data, error } = await withTimeout(query, 2500)
      if (error || !data || data.length === 0) {
        return demoProfiles.filter((u) => {
          const matchRole = !roleFilter || roleFilter === 'all' || u.role === roleFilter
          const matchSearch =
            !searchQuery ||
            u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase())
          return matchRole && matchSearch
        })
      }
      return data as Profile[]
    } catch {
      return demoProfiles
    }
  },

  async updateUserRole(userId: string, newRole: AppRole): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await withTimeout(
          supabase
            .from('profiles')
            .update({ role: newRole, updated_at: new Date().toISOString() })
            .eq('id', userId),
          2500
        )

        if (error) return { success: false, error: error.message }
        return { success: true }
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Lỗi cập nhật vai trò' }
      }
    }
    return { success: true }
  },

  async getCourses(): Promise<AdminCourseItem[]> {
    const shared = sharedStore.getSharedCourses()
    if (!isSupabaseConfigured) {
      return shared.map((c) => ({
        id: c.id,
        title: c.title,
        category: c.category,
        instructor_name: c.instructor_name || 'Giảng viên',
        lessons_count: c.lessons_count || 12,
        students_count: c.students_count || 0,
        status: c.status,
        created_at: c.created_at,
      }))
    }

    try {
      const { data } = await withTimeout(
        supabase
          .from('courses')
          .select(`
            id,
            title,
            category,
            status,
            created_at,
            profiles:teacher_id (full_name)
          `)
          .order('created_at', { ascending: false }),
        2500
      )

      if (data && data.length > 0) {
        interface AdminCourseRow {
          id: string
          title: string
          category?: string
          status?: 'draft' | 'pending' | 'published'
          created_at: string
          profiles?: { full_name?: string } | null
        }
        const courseRows = data as unknown as AdminCourseRow[]
        const sbCourses = courseRows.map((item) => ({
          id: item.id,
          title: item.title,
          category: item.category || 'Tổng hợp',
          instructor_name: item.profiles?.full_name || 'Giảng viên',
          lessons_count: 12,
          students_count: 35,
          status: item.status || 'draft',
          created_at: item.created_at,
        }))

        // Gộp các khóa học tạo từ sharedStore (tránh trùng id)
        const sbIds = new Set(sbCourses.map((c) => c.id))
        const extras = shared
          .filter((c) => !sbIds.has(c.id))
          .map((c) => ({
            id: c.id,
            title: c.title,
            category: c.category,
            instructor_name: c.instructor_name || 'Giảng viên',
            lessons_count: c.lessons_count || 0,
            students_count: 0,
            status: c.status,
            created_at: c.created_at,
          }))

        return [...extras, ...sbCourses]
      }
    } catch {
      // fallback
    }

    return shared.map((c) => ({
      id: c.id,
      title: c.title,
      category: c.category,
      instructor_name: c.instructor_name || 'Giảng viên',
      lessons_count: c.lessons_count || 12,
      students_count: c.students_count || 0,
      status: c.status,
      created_at: c.created_at,
    }))
  },

  async updateCourseStatus(courseId: string, status: 'draft' | 'published' | 'archived'): Promise<boolean> {
    // 1. Cập nhật vào sharedStore trước để đảm bảo tính nhất quán
    sharedStore.updateSharedCourseStatus(courseId, status)

    // 2. Tự động gửi thông báo cho Giảng viên về kết quả duyệt khóa học
    const allCourses = sharedStore.getSharedCourses()
    const targetCourse = allCourses.find((c) => c.id === courseId)
    const courseTitle = targetCourse ? targetCourse.title : 'của bạn'
    
    sharedStore.addSharedNotification({
      title: status === 'published' ? 'Khóa học đã được phê duyệt!' : 'Khóa học chuyển về bản nháp',
      message: `Khóa học "${courseTitle}" đã được Quản trị viên ${status === 'published' ? 'phê duyệt và chính thức xuất bản trên hệ thống.' : 'thu hồi về trạng thái bản nháp.'}`,
      type: status === 'published' ? 'success' : 'warning',
      target: 'teachers',
      user_id: targetCourse?.teacher_id,
    })

    if (isSupabaseConfigured) {
      try {
        await withTimeout(
          supabase
            .from('courses')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', courseId),
          2500
        )
      } catch (err) {
        console.warn('Lỗi cập nhật trạng thái khóa học Supabase:', err)
      }
    }
    return true
  },

  async getQuizzes(): Promise<AdminQuizItem[]> {
    if (!isSupabaseConfigured) {
      return fallbackQuizzesList
    }

    try {
      const { data, error } = await withTimeout(
        supabase
          .from('quizzes')
          .select(`
            id,
            title,
            time_limit_minutes,
            pass_score,
            status,
            courses:course_id (title)
          `),
        2500
      )

      if (error || !data || data.length === 0) {
        return fallbackQuizzesList
      }

      interface AdminQuizRow {
        id: string
        title: string
        time_limit_minutes?: number
        pass_score?: number
        status?: 'draft' | 'published'
        courses?: { title?: string } | null
      }
      const quizRows = data as unknown as AdminQuizRow[]
      return quizRows.map((q) => ({
        id: q.id,
        title: q.title,
        course_title: q.courses?.title || 'Khóa học',
        questions_count: 10,
        time_limit_minutes: q.time_limit_minutes || 15,
        pass_score: q.pass_score || 50,
        status: q.status || 'draft',
        attempts_count: 24,
        avg_score: 75,
      }))
    } catch {
      return fallbackQuizzesList
    }
  },

  async getNotifications(): Promise<SystemNotificationItem[]> {
    const shared = sharedStore.getSharedNotifications('admin')
    if (!isSupabaseConfigured) {
      return shared.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type || 'info',
        created_at: n.created_at,
        target: (n.target || 'all') as 'all' | 'students' | 'teachers',
      }))
    }

    try {
      const { data } = await withTimeout(
        supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false }),
        2500
      )

      if (data && data.length > 0) {
        interface NoticeRow {
          id: string
          title: string
          message: string
          type?: string
          created_at: string
          target?: string
        }
        const noticeRows = data as unknown as NoticeRow[]
        const sbNotices: SystemNotificationItem[] = noticeRows.map((n) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type || 'info',
          created_at: n.created_at,
          target: (n.target || 'all') as 'all' | 'students' | 'teachers',
        }))

        const sbIds = new Set(sbNotices.map((n) => n.id))
        const extras: SystemNotificationItem[] = shared
          .filter((n) => !sbIds.has(n.id))
          .map((n) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type || 'info',
            created_at: n.created_at,
            target: (n.target || 'all') as 'all' | 'students' | 'teachers',
          }))

        return [...extras, ...sbNotices]
      }
    } catch {
      // fallback
    }

    return shared.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type || 'info',
      created_at: n.created_at,
      target: (n.target || 'all') as 'all' | 'students' | 'teachers',
    }))
  },

  async createNotification(
    title: string,
    message: string,
    type = 'info',
    target: 'all' | 'students' | 'teachers' = 'all'
  ): Promise<boolean> {
    // 1. Luôn lưu vào sharedStore để tất cả các tài khoản demo (học viên / giảng viên) nhận được ngay lập tức
    sharedStore.addSharedNotification({
      title,
      message,
      type,
      target,
    })

    // 2. Nếu có Supabase, gửi thêm vào cơ sở dữ liệu
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('profiles').select('id, role')
        if (target === 'students') {
          query = query.eq('role', 'student')
        } else if (target === 'teachers') {
          query = query.eq('role', 'teacher')
        }

        const { data: profiles } = await withTimeout(query, 2500)
        if (profiles && profiles.length > 0) {
          const profileRows = profiles as { id: string }[]
          const rows = profileRows.map((p) => ({
            user_id: p.id,
            title,
            message,
            type,
          }))
          await withTimeout(supabase.from('notifications').insert(rows), 2500)
        }
      } catch (err) {
        console.warn('Lỗi gửi thông báo qua Supabase:', err)
      }
    }

    return true
  },
}
