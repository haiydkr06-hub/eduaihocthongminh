import { supabase, isSupabaseConfigured, withTimeout } from '../lib/supabase'
import { sharedStore } from './sharedStore'

export interface StudentDashboardStats {
  enrolledCoursesCount: number
  studyHours: number
  points: number
  weeklyGoalPercent: number
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
  answer_key?: number
  explanation?: string
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

export interface QuizResultItem {
  score: number
  totalQuestions: number
  correctCount: number
  isPassed: boolean
  submittedAt: string
}

const fallbackStudentCourses: StudentCourseItem[] = [
  {
    id: 'tc-1',
    title: 'Toán học tư duy bậc THPT',
    category: 'Toán học',
    instructor: 'Cô Nguyễn Minh Anh',
    progress: 68,
    lessonsCompleted: 12,
    totalLessons: 18,
    accent: 'lavender',
    illustration: '∑',
    status: 'Đang học',
    description: 'Chương trình rèn luyện tư duy logic và kỹ năng giải toán ứng dụng.',
    isEnrolled: true,
  },
  {
    id: 'tc-2',
    title: 'Khám phá thế giới khoa học & tự nhiên',
    category: 'Khoa học',
    instructor: 'Thầy Trần Hoàng Nam',
    progress: 42,
    lessonsCompleted: 8,
    totalLessons: 20,
    accent: 'mint',
    illustration: '✳',
    status: 'Đang học',
    description: 'Khám phá các định luật vật lý và ứng dụng trong tự nhiên đời sống.',
    isEnrolled: true,
  },
  {
    id: 'tc-3',
    title: 'Tiếng Anh giao tiếp & ngữ pháp thông minh',
    category: 'Ngoại ngữ',
    instructor: 'Cô Lê Thu Hà',
    progress: 100,
    lessonsCompleted: 16,
    totalLessons: 16,
    accent: 'peach',
    illustration: 'A',
    status: 'Hoàn thành',
    description: 'Phát triển phản xạ nghe nói tiếng Anh chuẩn cùng phương pháp ngữ cảnh.',
    isEnrolled: true,
  },
]

const fallbackAvailableCourses: StudentCourseItem[] = [
  ...fallbackStudentCourses,
  {
    id: 'tc-4',
    title: 'Lập trình tư duy logic với AI',
    category: 'Công nghệ',
    instructor: 'Thầy Trần Thanh Bình',
    progress: 0,
    lessonsCompleted: 0,
    totalLessons: 12,
    accent: 'lavender',
    illustration: '⚡',
    status: 'Đang học',
    description: 'Học lập trình nền tảng và phương pháp giải quyết vấn đề với AI.',
    isEnrolled: false,
  },
]

const fallbackLessons: StudentLessonItem[] = [
  {
    id: 'l-1',
    course_id: 'tc-1',
    title: 'Bài 1: Khái niệm nền tảng về hàm số bậc hai',
    content: `### 1. Định nghĩa hàm số bậc hai
Hàm số bậc hai là hàm số được cho bằng công thức:
$$y = ax^2 + bx + c \\quad (a \\neq 0)$$

Tập xác định của hàm số bậc hai là $D = \\mathbb{R}$.

### 2. Chiều biến thiên và Đồ thị Parabol
- Đỉnh của parabol là điểm $I\\left(-\\frac{b}{2a}; -\\frac{\\Delta}{4a}\\right)$.
- Trục đối xứng là đường thẳng $x = -\\frac{b}{2a}$.
- Bề lõm hướng lên trên khi $a > 0$, hướng xuống dưới khi $a < 0$.`,
    video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration_minutes: 25,
    position: 1,
    is_completed: true,
  },
  {
    id: 'l-2',
    course_id: 'tc-1',
    title: 'Bài 2: Tính đơn điệu và lập bảng biến thiên',
    content: `### Tính đơn điệu của hàm số bậc hai
Cho hàm số $y = ax^2 + bx + c$ với $a > 0$:
- Hàm số nghịch biến trên khoảng $\\left(-\\infty; -\\frac{b}{2a}\\right)$.
- Hàm số đồng biến trên khoảng $\\left(-\\frac{b}{2a}; +\\infty\\right)$.

Ngược lại với $a < 0$:
- Hàm số đồng biến trên khoảng $\\left(-\\infty; -\\frac{b}{2a}\\right)$.
- Hàm số nghịch biến trên khoảng $\\left(-\\frac{b}{2a}; +\\infty\\right)$.`,
    video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration_minutes: 30,
    position: 2,
    is_completed: true,
  },
  {
    id: 'l-3',
    course_id: 'tc-1',
    title: 'Bài 3: Ứng dụng thực tế của đồ thị parabol',
    content: `### Các bài toán thực tiễn
- Quỹ đạo chuyển động của vật ném xiên trong trọng trường.
- Thiết kế vòm cầu parabol và chóa đèn phản xạ.
- Bài toán tối ưu hóa doanh thu và diện tích lớn nhất.`,
    video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration_minutes: 35,
    position: 3,
    is_completed: false,
  },
]

export const studentService = {
  async getDashboardStats(studentId?: string): Promise<StudentDashboardStats> {
    const defaultStats: StudentDashboardStats = {
      enrolledCoursesCount: 3,
      studyHours: 12.5,
      points: 860,
      weeklyGoalPercent: 72,
    }

    if (!isSupabaseConfigured || !studentId) {
      return defaultStats
    }

    try {
      const { data: enrollments } = await withTimeout(
        supabase
          .from('enrollments')
          .select('id')
          .eq('student_id', studentId),
        2500
      )

      const count = enrollments?.length || 3
      return {
        ...defaultStats,
        enrolledCoursesCount: count,
      }
    } catch {
      return defaultStats
    }
  },

  async getMyCourses(studentId?: string): Promise<StudentCourseItem[]> {
    if (!isSupabaseConfigured || !studentId) {
      return fallbackStudentCourses
    }

    try {
      const { data: enrollments } = await withTimeout(
        supabase
          .from('enrollments')
          .select(`
            course_id,
            status,
            courses:course_id (
              id,
              title,
              category,
              description,
              profiles:teacher_id (full_name),
              lessons (id)
            )
          `)
          .eq('student_id', studentId),
        2500
      )

      if (enrollments && enrollments.length > 0) {
        interface EnrollmentDbRow {
          status?: string
          courses?: {
            id?: string
            title?: string
            category?: string
            description?: string
            profiles?: { full_name?: string } | null
            lessons?: { id: string }[] | null
          } | null
        }
        const rows = enrollments as unknown as EnrollmentDbRow[]
        return rows.map((e, idx: number) => {
          const c = e.courses
          const total = c?.lessons?.length || 18
          const progress = e.status === 'completed' ? 100 : idx === 0 ? 68 : idx === 1 ? 42 : 15
          const completed = Math.round((progress / 100) * total)

          return {
            id: c?.id || `c-${idx}`,
            title: c?.title || 'Khóa học',
            category: c?.category || 'Toán học',
            instructor: c?.profiles?.full_name || 'Giảng viên EduAI',
            progress,
            lessonsCompleted: completed,
            totalLessons: total,
            accent: idx % 3 === 0 ? 'lavender' : idx % 3 === 1 ? 'mint' : 'peach',
            illustration: idx % 3 === 0 ? '∑' : idx % 3 === 1 ? '✳' : 'A',
            status: progress >= 100 ? 'Hoàn thành' : 'Đang học',
            description: c?.description,
            isEnrolled: true,
          }
        })
      }
    } catch {
      // fallback
    }

    return fallbackStudentCourses
  },

  async getAllAvailableCourses(): Promise<StudentCourseItem[]> {
    const sharedPublished = sharedStore.getSharedCourses().filter((c) => c.status === 'published')
    const mappedShared: StudentCourseItem[] = sharedPublished.map((c, idx) => ({
      id: c.id,
      title: c.title,
      category: c.category || 'Môn học',
      instructor: c.instructor_name || 'Giảng viên',
      progress: 0,
      lessonsCompleted: 0,
      totalLessons: c.lessons_count || 15,
      accent: idx % 3 === 0 ? 'lavender' : idx % 3 === 1 ? 'mint' : 'peach',
      illustration: idx % 3 === 0 ? '∑' : idx % 3 === 1 ? '✳' : 'A',
      status: 'Đang học',
      description: c.description || 'Khóa học chất lượng cao trên EduAI',
      isEnrolled: false,
    }))

    if (!isSupabaseConfigured) {
      return mappedShared.length > 0 ? mappedShared : fallbackAvailableCourses
    }

    try {
      const { data } = await withTimeout(
        supabase
          .from('courses')
          .select(`
            id,
            title,
            category,
            description,
            profiles:teacher_id (full_name),
            lessons (id)
          `)
          .eq('status', 'published'),
        2500
      )

      if (data && data.length > 0) {
        interface PublishedCourseDbRow {
          id: string
          title: string
          category?: string
          description?: string
          profiles?: { full_name?: string } | null
          lessons?: { id: string }[] | null
        }
        const courseRows = data as unknown as PublishedCourseDbRow[]
        const sbCourses: StudentCourseItem[] = courseRows.map((c, idx: number) => ({
          id: c.id,
          title: c.title,
          category: c.category || 'Môn học',
          instructor: c.profiles?.full_name || 'Giảng viên',
          progress: 0,
          lessonsCompleted: 0,
          totalLessons: c.lessons?.length || 15,
          accent: idx % 3 === 0 ? 'lavender' : idx % 3 === 1 ? 'mint' : 'peach',
          illustration: idx % 3 === 0 ? '∑' : idx % 3 === 1 ? '✳' : 'A',
          status: 'Đang học' as const,
          description: c.description || 'Khóa học chất lượng cao trên EduAI',
          isEnrolled: false,
        }))

        const sbIds = new Set(sbCourses.map((c) => c.id))
        const extras = mappedShared.filter((c) => !sbIds.has(c.id))
        return [...extras, ...sbCourses]
      }
    } catch {
      // fallback
    }

    return mappedShared.length > 0 ? mappedShared : fallbackAvailableCourses
  },

  async enrollCourse(studentId: string, courseId: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      return true
    }

    try {
      const { error } = await withTimeout(
        supabase.from('enrollments').insert({
          student_id: studentId,
          course_id: courseId,
          status: 'active',
        }),
        2500
      )
      return !error
    } catch {
      return true
    }
  },

  async getLessons(courseId: string, studentId?: string): Promise<StudentLessonItem[]> {
    if (!isSupabaseConfigured) {
      return fallbackLessons.map((l) => ({ ...l, course_id: courseId }))
    }

    try {
      const { data: lessonsData } = await withTimeout(
        supabase
          .from('lessons')
          .select('*')
          .eq('course_id', courseId)
          .order('position', { ascending: true }),
        2500
      )

      let completedSet = new Set<string>()
      if (studentId) {
        const { data: progressData } = await withTimeout(
          supabase
            .from('lesson_progress')
            .select('lesson_id, is_completed')
            .eq('student_id', studentId)
            .eq('is_completed', true),
          2500
        )

        if (progressData) {
          const progRows = progressData as { lesson_id: string }[]
          completedSet = new Set(progRows.map((p) => p.lesson_id))
        }
      }

      if (lessonsData && lessonsData.length > 0) {
        interface LessonDbRow {
          id: string
          course_id: string
          title: string
          content?: string
          video_url?: string
          duration_minutes?: number
          position?: number
        }
        const lessonRows = lessonsData as unknown as LessonDbRow[]
        return lessonRows.map((l) => ({
          id: l.id,
          course_id: l.course_id,
          title: l.title,
          content: l.content || '',
          video_url: l.video_url,
          duration_minutes: l.duration_minutes || 20,
          position: l.position ?? 0,
          is_completed: completedSet.has(l.id),
        }))
      }
    } catch {
      // fallback
    }

    return fallbackLessons.map((l) => ({ ...l, course_id: courseId }))
  },

  async markLessonComplete(studentId: string, lessonId: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      return true
    }

    try {
      await withTimeout(
        supabase.from('lesson_progress').upsert({
          student_id: studentId,
          lesson_id: lessonId,
          is_completed: true,
          completed_at: new Date().toISOString(),
        }),
        2500
      )
      return true
    } catch {
      return true
    }
  },

  async getQuiz(quizId: string): Promise<QuizDetailItem> {
    return {
      id: quizId,
      title: 'Kiểm tra 15 phút: Hàm số và Đồ thị Parabol',
      course_id: 'tc-1',
      course_title: 'Toán học tư duy bậc THPT',
      time_limit_minutes: 15,
      pass_score: 60,
      questions: [
        {
          id: 'q-1',
          prompt: 'Tọa độ đỉnh I của đồ thị parabol hàm số y = ax² + bx + c (a ≠ 0) là gì?',
          options: [
            'I(-b/2a; -Δ/4a)',
            'I(b/2a; Δ/4a)',
            'I(-b/a; -Δ/2a)',
            'I(-b/2a; Δ/4a)',
          ],
          answer_key: 0,
          explanation: 'Tọa độ đỉnh I của parabol là (-b/2a; -Δ/4a) theo công thức chuẩn trong SGK Toán học.',
        },
        {
          id: 'q-2',
          prompt: 'Với hàm số y = x² - 4x + 3, trục đối xứng của đồ thị là đường thẳng nào?',
          options: [
            'x = 1',
            'x = 2',
            'x = -2',
            'x = 4',
          ],
          answer_key: 1,
          explanation: 'Trục đối xứng là x = -b/(2a) = -(-4)/(2*1) = 2.',
        },
        {
          id: 'q-3',
          prompt: 'Bề lõm của đồ thị hàm số y = -2x² + 5x - 1 hướng về phía nào?',
          options: [
            'Hướng lên trên',
            'Hướng xuống dưới',
            'Hướng sang phải',
            'Hướng sang trái',
          ],
          answer_key: 1,
          explanation: 'Vì hệ số a = -2 < 0, đồ thị parabol có bề lõm hướng xuống dưới.',
        },
        {
          id: 'q-4',
          prompt: 'Giá trị nhỏ nhất của hàm số y = x² - 2x + 5 đạt được khi x bằng bao nhiêu?',
          options: [
            'x = 1',
            'x = 2',
            'x = 0',
            'x = -1',
          ],
          answer_key: 0,
          explanation: 'y = (x - 1)² + 4 ≥ 4. Giá trị nhỏ nhất là 4 khi x - 1 = 0 => x = 1.',
        },
      ],
    }
  },

  async submitQuizAttempt(
    quizId: string,
    studentId: string,
    answers: Record<number, number>
  ): Promise<QuizResultItem> {
    const quiz = await this.getQuiz(quizId)
    let correctCount = 0

    quiz.questions.forEach((q, idx) => {
      if (answers[idx] === q.answer_key) {
        correctCount++
      }
    })

    const totalQuestions = quiz.questions.length
    const score = Math.round((correctCount / totalQuestions) * 100)
    const isPassed = score >= quiz.pass_score

    if (isSupabaseConfigured) {
      try {
        await withTimeout(
          supabase.from('quiz_attempts').insert({
            quiz_id: quizId,
            student_id: studentId,
            answers: answers,
            score,
            is_passed: isPassed,
            submitted_at: new Date().toISOString(),
          }),
          2500
        )
      } catch {
        // fallback
      }
    }

    return {
      score,
      totalQuestions,
      correctCount,
      isPassed,
      submittedAt: new Date().toISOString(),
    }
  },
}
