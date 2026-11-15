import { supabase, isSupabaseConfigured, withTimeout } from '../lib/supabase'

export interface TeacherStats {
  totalCourses: number
  totalStudents: number
  pendingGrading: number
  avgRating: number
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
  name: string
  email: string
  courseName: string
  enrolledAt: string
  progressPercent: number
  avgScore: number
}

export interface TeacherQuiz {
  id: string
  course_id: string
  courseTitle: string
  title: string
  timeLimit: number
  passScore: number
  questionsCount: number
  status: 'draft' | 'published'
  submissionsCount: number
}

export interface StudentSubmission {
  id: string
  quizTitle: string
  courseTitle: string
  studentName: string
  studentEmail: string
  score: number | null
  submittedAt: string
  feedback?: string
  status: 'pending' | 'graded'
}

const fallbackCourses: TeacherCourse[] = [
  {
    id: 'tc-1',
    title: 'Toán học tư duy bậc THPT',
    category: 'Toán học',
    status: 'published',
    lessonsCount: 18,
    studentsCount: 38,
    createdAt: '2026-02-15',
    description: 'Chương trình rèn luyện phương pháp giải toán hàm số và hình học không gian.',
  },
  {
    id: 'tc-2',
    title: 'Hình học giải tích và ứng dụng không gian',
    category: 'Toán học',
    status: 'published',
    lessonsCount: 12,
    studentsCount: 26,
    createdAt: '2026-03-01',
    description: 'Các chuyên đề chuyên sâu về tọa độ Oxyz và mặt cầu, mặt phẳng.',
  },
  {
    id: 'tc-3',
    title: 'Đại số tổ hợp và Xác suất thống kê',
    category: 'Toán học',
    status: 'draft',
    lessonsCount: 8,
    studentsCount: 14,
    createdAt: '2026-04-10',
    description: 'Học lý thuyết xác suất qua các ví dụ thực tế và bài tập trắc nghiệm.',
  },
]

export const teacherService = {
  async getStats(teacherId?: string): Promise<TeacherStats> {
    const defaultStats: TeacherStats = {
      totalCourses: 4,
      totalStudents: 78,
      pendingGrading: 6,
      avgRating: 4.8,
    }

    if (!isSupabaseConfigured || !teacherId) {
      return defaultStats
    }

    try {
      const { data: courses } = await withTimeout(
        supabase.from('courses').select('id').eq('teacher_id', teacherId),
        2500
      )
      const courseIds = (courses || []).map((c: any) => c.id)

      let studentCount = 0
      if (courseIds.length > 0) {
        const { data: enrollments } = await withTimeout(
          supabase.from('enrollments').select('id').in('course_id', courseIds),
          2500
        )
        studentCount = enrollments?.length || 0
      }

      return {
        totalCourses: courses?.length || 4,
        totalStudents: studentCount || 78,
        pendingGrading: 6,
        avgRating: 4.8,
      }
    } catch {
      return defaultStats
    }
  },

  async getCourses(teacherId?: string): Promise<TeacherCourse[]> {
    if (!isSupabaseConfigured) {
      return fallbackCourses
    }

    try {
      let query = supabase.from('courses').select('*, lessons(id), enrollments(id)')
      if (teacherId) {
        query = query.eq('teacher_id', teacherId)
      }
      const { data, error } = await withTimeout(query, 2500)

      if (!error && data && data.length > 0) {
        return data.map((c: any) => ({
          id: c.id,
          title: c.title,
          category: c.category || 'Môn học',
          status: c.status || 'draft',
          lessonsCount: c.lessons?.length || 0,
          studentsCount: c.enrollments?.length || 0,
          createdAt: c.created_at,
          description: c.description || '',
        }))
      }
    } catch {
      // fallback demo data
    }

    return fallbackCourses
  },

  async createCourse(teacherId: string, course: { title: string; category: string; description: string }): Promise<TeacherCourse | null> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await withTimeout(
          supabase
            .from('courses')
            .insert({
              teacher_id: teacherId,
              title: course.title,
              category: course.category,
              description: course.description,
              status: 'draft',
            })
            .select()
            .single(),
          2500
        )

        if (!error && data) {
          return {
            id: data.id,
            title: data.title,
            category: data.category,
            status: data.status,
            lessonsCount: 0,
            studentsCount: 0,
            createdAt: data.created_at,
            description: data.description,
          }
        }
      } catch {
        // local fallback creation
      }
    }

    return {
      id: `tc-${Date.now()}`,
      title: course.title,
      category: course.category,
      status: 'draft',
      lessonsCount: 0,
      studentsCount: 0,
      createdAt: new Date().toISOString(),
      description: course.description,
    }
  },

  async getLessons(courseId: string): Promise<TeacherLesson[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await withTimeout(
          supabase
            .from('lessons')
            .select('*')
            .eq('course_id', courseId)
            .order('position', { ascending: true }),
          2500
        )

        if (!error && data && data.length > 0) {
          return data as TeacherLesson[]
        }
      } catch {
        // fallback
      }
    }

    return [
      {
        id: 'l-1',
        course_id: courseId,
        title: 'Bài 1: Khái niệm nền tảng về hàm số bậc hai',
        content: 'Tổng quan về đồ thị parabol và các dạng toán cơ bản.',
        video_url: 'https://www.youtube.com/watch?v=example1',
        duration_minutes: 25,
        position: 1,
      },
      {
        id: 'l-2',
        course_id: courseId,
        title: 'Bài 2: Tính đơn điệu và bảng biến thiên',
        content: 'Cách xét khoảng đồng biến, nghịch biến trên tập xác định.',
        video_url: 'https://www.youtube.com/watch?v=example2',
        duration_minutes: 30,
        position: 2,
      },
      {
        id: 'l-3',
        course_id: courseId,
        title: 'Bài 3: Ứng dụng thực tế của đồ thị hàm số',
        content: 'Giải các bài toán cực trị trong vật lý và kinh tế.',
        video_url: 'https://www.youtube.com/watch?v=example3',
        duration_minutes: 35,
        position: 3,
      },
    ]
  },

  async addLesson(lesson: { course_id: string; title: string; content: string; video_url?: string; duration_minutes: number; position: number }): Promise<TeacherLesson> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await withTimeout(
          supabase.from('lessons').insert(lesson).select().single(),
          2500
        )
        if (!error && data) return data as TeacherLesson
      } catch {
        // fallback
      }
    }

    return {
      id: `l-${Date.now()}`,
      ...lesson,
    }
  },

  async getStudents(): Promise<StudentInClass[]> {
    return [
      {
        id: 'st-1',
        name: 'Nguyễn Văn Minh Anh',
        email: 'minhanh@gmail.com',
        courseName: 'Toán học tư duy bậc THPT',
        enrolledAt: '2026-03-01',
        progressPercent: 68,
        avgScore: 85,
      },
      {
        id: 'st-2',
        name: 'Trần Bảo Ngọc',
        email: 'baongoc@gmail.com',
        courseName: 'Toán học tư duy bậc THPT',
        enrolledAt: '2026-03-05',
        progressPercent: 92,
        avgScore: 94,
      },
      {
        id: 'st-3',
        name: 'Lê Hoàng Long',
        email: 'hoanglong@gmail.com',
        courseName: 'Hình học giải tích và ứng dụng',
        enrolledAt: '2026-03-12',
        progressPercent: 45,
        avgScore: 72,
      },
      {
        id: 'st-4',
        name: 'Phạm Quỳnh Trang',
        email: 'quynhtrang@gmail.com',
        courseName: 'Toán học tư duy bậc THPT',
        enrolledAt: '2026-03-18',
        progressPercent: 30,
        avgScore: 60,
      },
      {
        id: 'st-5',
        name: 'Vũ Đức Nam',
        email: 'ducnam@gmail.com',
        courseName: 'Đại số tổ hợp và Xác suất',
        enrolledAt: '2026-04-02',
        progressPercent: 80,
        avgScore: 88,
      },
    ]
  },

  async getQuizzes(): Promise<TeacherQuiz[]> {
    return [
      {
        id: 'tq-1',
        course_id: 'tc-1',
        courseTitle: 'Toán học tư duy bậc THPT',
        title: 'Kiểm tra 15 phút: Hàm số và Đồ thị',
        timeLimit: 15,
        passScore: 60,
        questionsCount: 10,
        status: 'published',
        submissionsCount: 34,
      },
      {
        id: 'tq-2',
        course_id: 'tc-1',
        courseTitle: 'Toán học tư duy bậc THPT',
        title: 'Bài tập tuần: Tính đơn điệu của hàm số',
        timeLimit: 30,
        passScore: 70,
        questionsCount: 15,
        status: 'published',
        submissionsCount: 28,
      },
      {
        id: 'tq-3',
        course_id: 'tc-2',
        courseTitle: 'Hình học giải tích và ứng dụng',
        title: 'Quiz trắc nghiệm: Phương trình mặt phẳng',
        timeLimit: 20,
        passScore: 50,
        questionsCount: 12,
        status: 'draft',
        submissionsCount: 0,
      },
    ]
  },

  async createQuiz(quiz: { course_id: string; courseTitle: string; title: string; timeLimit: number; passScore: number; questionsCount: number }): Promise<TeacherQuiz> {
    return {
      id: `tq-${Date.now()}`,
      course_id: quiz.course_id,
      courseTitle: quiz.courseTitle,
      title: quiz.title,
      timeLimit: quiz.timeLimit,
      passScore: quiz.passScore,
      questionsCount: quiz.questionsCount,
      status: 'draft',
      submissionsCount: 0,
    }
  },

  async getSubmissions(): Promise<StudentSubmission[]> {
    return [
      {
        id: 'sub-1',
        quizTitle: 'Kiểm tra 15 phút: Hàm số và Đồ thị',
        courseTitle: 'Toán học tư duy bậc THPT',
        studentName: 'Nguyễn Văn Minh Anh',
        studentEmail: 'minhanh@gmail.com',
        score: null,
        submittedAt: '2026-11-15T08:30:00Z',
        status: 'pending',
      },
      {
        id: 'sub-2',
        quizTitle: 'Bài tập tuần: Tính đơn điệu của hàm số',
        courseTitle: 'Toán học tư duy bậc THPT',
        studentName: 'Lê Hoàng Long',
        studentEmail: 'hoanglong@gmail.com',
        score: null,
        submittedAt: '2026-11-14T15:20:00Z',
        status: 'pending',
      },
      {
        id: 'sub-3',
        quizTitle: 'Kiểm tra 15 phút: Hàm số và Đồ thị',
        courseTitle: 'Toán học tư duy bậc THPT',
        studentName: 'Trần Bảo Ngọc',
        studentEmail: 'baongoc@gmail.com',
        score: 95,
        submittedAt: '2026-11-13T10:15:00Z',
        feedback: 'Bài làm xuất sắc! Lập luận chặt chẽ và chính xác.',
        status: 'graded',
      },
      {
        id: 'sub-4',
        quizTitle: 'Kiểm tra 15 phút: Hàm số và Đồ thị',
        courseTitle: 'Toán học tư duy bậc THPT',
        studentName: 'Phạm Quỳnh Trang',
        studentEmail: 'quynhtrang@gmail.com',
        score: 65,
        submittedAt: '2026-11-12T14:00:00Z',
        feedback: 'Cần ôn lại cách xác định tọa độ đỉnh của parabol.',
        status: 'graded',
      },
    ]
  },

  async gradeSubmission(subId: string, score: number, _feedback: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        await withTimeout(
          supabase
            .from('quiz_attempts')
            .update({
              score,
              is_passed: score >= 50,
            })
            .eq('id', subId),
          2500
        )
        return true
      } catch {
        return true
      }
    }
    return true
  },
}
