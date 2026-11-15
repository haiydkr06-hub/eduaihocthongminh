export interface SharedCourse {
  id: string
  title: string
  category: string
  description?: string
  instructor_name?: string
  teacher_id?: string
  status: 'draft' | 'published' | 'archived'
  lessons_count?: number
  students_count?: number
  created_at: string
}

export interface SharedNotification {
  id: string
  user_id?: string
  title: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error' | string
  target?: 'all' | 'students' | 'teachers'
  is_read: boolean
  created_at: string
}

const COURSES_STORAGE_KEY = 'eduai_shared_courses'
const NOTIFICATIONS_STORAGE_KEY = 'eduai_shared_notifications'

// Dữ liệu mẫu ban đầu cho Khóa học
const initialCourses: SharedCourse[] = [
  {
    id: 'tc-1',
    title: 'Toán học tư duy bậc THPT',
    category: 'Toán học',
    description: 'Chương trình rèn luyện tư duy logic và kỹ năng giải toán ứng dụng.',
    instructor_name: 'Thầy Nguyễn Văn An',
    teacher_id: '11111111-1111-1111-1111-111111111111',
    status: 'published',
    lessons_count: 18,
    students_count: 85,
    created_at: '2026-11-10T08:00:00Z',
  },
  {
    id: 'tc-2',
    title: 'Khám phá thế giới khoa học & tự nhiên',
    category: 'Khoa học',
    description: 'Khám phá các định luật vật lý và ứng dụng trong tự nhiên đời sống.',
    instructor_name: 'Thầy Trần Hoàng Nam',
    teacher_id: '11111111-1111-1111-1111-111111111111',
    status: 'published',
    lessons_count: 20,
    students_count: 64,
    created_at: '2026-11-11T09:30:00Z',
  },
  {
    id: 'tc-3',
    title: 'Tiếng Anh giao tiếp & ngữ pháp thông minh',
    category: 'Ngoại ngữ',
    description: 'Nâng cao phản xạ giao tiếp tự tin và vốn từ vựng chuẩn quốc tế.',
    instructor_name: 'Cô Lê Thu Hà',
    teacher_id: '11111111-1111-1111-1111-111111111111',
    status: 'published',
    lessons_count: 16,
    students_count: 102,
    created_at: '2026-11-12T14:15:00Z',
  },
  {
    id: 'tc-4',
    title: 'Nhập môn Lập trình Python cùng Trí tuệ nhân tạo',
    category: 'Công nghệ',
    description: 'Học cú pháp Python hiện đại và cách ứng dụng AI trong lập trình.',
    instructor_name: 'Thầy Nguyễn Văn An',
    teacher_id: '11111111-1111-1111-1111-111111111111',
    status: 'draft',
    lessons_count: 8,
    students_count: 0,
    created_at: '2026-11-14T16:00:00Z',
  },
]

// Dữ liệu mẫu ban đầu cho Thông báo
const initialNotifications: SharedNotification[] = [
  {
    id: 'notif-1',
    title: 'Chào mừng bạn đến với EduAI',
    message: 'Khám phá không gian học tập và giảng dạy thông minh ứng dụng công nghệ Trí tuệ nhân tạo.',
    type: 'info',
    target: 'all',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'notif-2',
    title: 'Nâng cấp máy chủ định kỳ',
    message: 'Hệ thống EduAI sẽ tiến hành tối ưu hóa hiệu năng máy chủ vào 00:00 Chủ nhật tuần này.',
    type: 'warning',
    target: 'all',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
  {
    id: 'notif-3',
    title: 'Khóa học mới sẵn sàng',
    message: 'Giảng viên đã cập nhật thêm tài liệu và đề thi trắc nghiệm mới trong tuần này.',
    type: 'success',
    target: 'students',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
]

export const sharedStore = {
  // ===================== KHÓA HỌC (COURSES) =====================
  getSharedCourses(): SharedCourse[] {
    try {
      const raw = localStorage.getItem(COURSES_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch {
      // fallback
    }
    // Khởi tạo lần đầu
    localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(initialCourses))
    return initialCourses
  },

  addSharedCourse(data: {
    title: string
    category: string
    description?: string
    instructor_name?: string
    teacher_id?: string
  }): SharedCourse {
    const courses = this.getSharedCourses()
    const newCourse: SharedCourse = {
      id: `course-${Date.now()}`,
      title: data.title,
      category: data.category,
      description: data.description || '',
      instructor_name: data.instructor_name || 'Thầy Nguyễn Văn An',
      teacher_id: data.teacher_id || '11111111-1111-1111-1111-111111111111',
      status: 'draft', // Mặc định là Chờ duyệt (draft)
      lessons_count: 0,
      students_count: 0,
      created_at: new Date().toISOString(),
    }

    const updated = [newCourse, ...courses]
    localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(updated))
    window.dispatchEvent(new CustomEvent('eduai:courses_updated', { detail: newCourse }))
    return newCourse
  },

  updateSharedCourseStatus(courseId: string, status: 'draft' | 'published' | 'archived'): boolean {
    const courses = this.getSharedCourses()
    let found = false
    const updated = courses.map((c) => {
      if (c.id === courseId) {
        found = true
        return { ...c, status }
      }
      return c
    })

    if (found) {
      localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(updated))
      window.dispatchEvent(new CustomEvent('eduai:courses_updated', { detail: { courseId, status } }))
    }
    return found
  },

  // ===================== THÔNG BÁO (NOTIFICATIONS) =====================
  getSharedNotifications(role?: 'student' | 'teacher' | 'admin', userId?: string): SharedNotification[] {
    let list: SharedNotification[] = []
    try {
      const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          list = parsed
        }
      }
    } catch {
      list = []
    }

    if (list.length === 0) {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(initialNotifications))
      list = initialNotifications
    }

    // Lọc theo vai trò người dùng
    if (!role || role === 'admin') {
      return list
    }

    return list.filter((n) => {
      if (n.target === 'all') return true
      if (role === 'student' && (n.target === 'students' || (userId && n.user_id === userId))) return true
      if (role === 'teacher' && (n.target === 'teachers' || (userId && n.user_id === userId))) return true
      return false
    })
  },

  addSharedNotification(data: {
    title: string
    message: string
    type?: string
    target?: 'all' | 'students' | 'teachers'
    user_id?: string
  }): SharedNotification {
    const list = this.getSharedNotifications()
    const newNotice: SharedNotification = {
      id: `notif-${Date.now()}`,
      title: data.title,
      message: data.message,
      type: data.type || 'info',
      target: data.target || 'all',
      user_id: data.user_id,
      is_read: false,
      created_at: new Date().toISOString(),
    }

    const updated = [newNotice, ...list]
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated))
    window.dispatchEvent(new CustomEvent('eduai:new_notification', { detail: newNotice }))
    return newNotice
  },

  markSharedNotificationRead(id: string): void {
    const list = this.getSharedNotifications()
    const updated = list.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated))
  },

  markAllSharedNotificationsRead(role?: 'student' | 'teacher' | 'admin'): void {
    const list = this.getSharedNotifications()
    const updated = list.map((n) => {
      if (!role || n.target === 'all' || (role === 'student' && n.target === 'students') || (role === 'teacher' && n.target === 'teachers')) {
        return { ...n, is_read: true }
      }
      return n
    })
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated))
  },
}
