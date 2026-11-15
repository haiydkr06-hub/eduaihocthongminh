/**
 * "Cơ sở dữ liệu" cục bộ cho CHẾ ĐỘ DEMO (khi chưa cấu hình Supabase).
 * Mô phỏng đúng các bảng trong supabase/migrations để dữ liệu nhất quán giữa
 * Học viên – Giảng viên – Admin và được giữ lại sau khi tải lại trang.
 */
import type { AppRole } from '../types/auth'
import { DEMO_IDS } from '../lib/demoAccounts'

export type ContentStatus = 'draft' | 'published' | 'archived'

export interface DbProfile {
  id: string
  email: string
  full_name: string
  role: AppRole
  created_at: string
}

export interface DbCourse {
  id: string
  teacher_id: string
  title: string
  category: string
  description: string
  status: ContentStatus
  created_at: string
}

export interface DbLesson {
  id: string
  course_id: string
  title: string
  content: string
  video_url?: string
  duration_minutes: number
  position: number
}

export interface DbEnrollment {
  student_id: string
  course_id: string
  status: 'active' | 'completed' | 'dropped'
  enrolled_at: string
}

export interface DbProgress {
  student_id: string
  lesson_id: string
  completed_at: string
}

export interface DbQuestion {
  id: string
  prompt: string
  options: string[]
  answer_key: number
  explanation: string
}

export interface DbQuiz {
  id: string
  course_id: string
  title: string
  time_limit_minutes: number
  pass_score: number
  status: ContentStatus
  created_by: string
  created_at: string
  questions: DbQuestion[]
}

export interface DbAttempt {
  id: string
  quiz_id: string
  student_id: string
  answers: Record<string, number>
  score: number
  is_passed: boolean
  submitted_at: string
  feedback?: string
  graded_at?: string
  client_attempt_id?: string
}

export interface DbNotification {
  id: string
  title: string
  message: string
  type: string
  /** Gửi cho một người cụ thể; nếu không có thì gửi theo nhóm `target`. */
  user_id?: string
  target: 'all' | 'students' | 'teachers' | 'admins'
  created_at: string
  /** Danh sách user đã đọc (mỗi người có trạng thái đọc riêng). */
  read_by: string[]
}

export interface DemoTables {
  profiles: DbProfile[]
  courses: DbCourse[]
  lessons: DbLesson[]
  enrollments: DbEnrollment[]
  progress: DbProgress[]
  quizzes: DbQuiz[]
  attempts: DbAttempt[]
  notifications: DbNotification[]
}

const DB_KEY = 'eduai_demo_db_v2'
const LEGACY_KEYS = ['eduai_shared_courses', 'eduai_shared_notifications']

const day = 24 * 60 * 60 * 1000
const ago = (days: number, hours = 0) => new Date(Date.now() - days * day - hours * 3600_000).toISOString()

const T_AN = DEMO_IDS.teacher
const T_NAM = '11111111-1111-1111-1111-111111111112'
const T_HA = '11111111-1111-1111-1111-111111111113'
const S_MINH = DEMO_IDS.student
const S_ANH = '22222222-2222-2222-2222-222222222223'
const S_NGOC = '22222222-2222-2222-2222-222222222224'
const S_LONG = '22222222-2222-2222-2222-222222222225'
const S_TRANG = '22222222-2222-2222-2222-222222222226'
const S_DNAM = '22222222-2222-2222-2222-222222222227'

function seed(): DemoTables {
  const profiles: DbProfile[] = [
    { id: DEMO_IDS.admin, email: 'admin@demo.com', full_name: 'Quản trị viên Hệ thống', role: 'admin', created_at: ago(300) },
    { id: T_AN, email: 'teacher@demo.com', full_name: 'Thầy Nguyễn Văn An', role: 'teacher', created_at: ago(280) },
    { id: T_NAM, email: 'nam.tran@eduai.vn', full_name: 'Thầy Trần Hoàng Nam', role: 'teacher', created_at: ago(270) },
    { id: T_HA, email: 'ha.le@eduai.vn', full_name: 'Cô Lê Thu Hà', role: 'teacher', created_at: ago(260) },
    { id: S_MINH, email: 'student@demo.com', full_name: 'Học sinh Nguyễn Văn Minh', role: 'student', created_at: ago(120) },
    { id: S_ANH, email: 'minhanh@gmail.com', full_name: 'Nguyễn Minh Anh', role: 'student', created_at: ago(110) },
    { id: S_NGOC, email: 'baongoc@gmail.com', full_name: 'Trần Bảo Ngọc', role: 'student', created_at: ago(100) },
    { id: S_LONG, email: 'hoanglong@gmail.com', full_name: 'Lê Hoàng Long', role: 'student', created_at: ago(95) },
    { id: S_TRANG, email: 'quynhtrang@gmail.com', full_name: 'Phạm Quỳnh Trang', role: 'student', created_at: ago(90) },
    { id: S_DNAM, email: 'ducnam@gmail.com', full_name: 'Vũ Đức Nam', role: 'student', created_at: ago(60) },
  ]

  const courses: DbCourse[] = [
    { id: 'tc-1', teacher_id: T_AN, title: 'Toán học tư duy bậc THPT', category: 'Toán học', description: 'Chương trình rèn luyện tư duy logic và kỹ năng giải toán ứng dụng.', status: 'published', created_at: ago(200) },
    { id: 'tc-2', teacher_id: T_NAM, title: 'Khám phá thế giới khoa học & tự nhiên', category: 'Khoa học', description: 'Khám phá các định luật vật lý và ứng dụng trong tự nhiên đời sống.', status: 'published', created_at: ago(190) },
    { id: 'tc-3', teacher_id: T_HA, title: 'Tiếng Anh giao tiếp & ngữ pháp thông minh', category: 'Ngoại ngữ', description: 'Nâng cao phản xạ giao tiếp tự tin và vốn từ vựng chuẩn quốc tế.', status: 'published', created_at: ago(180) },
    { id: 'tc-4', teacher_id: T_AN, title: 'Nhập môn Lập trình Python cùng Trí tuệ nhân tạo', category: 'Công nghệ', description: 'Học cú pháp Python hiện đại và cách ứng dụng AI trong lập trình.', status: 'draft', created_at: ago(2) },
  ]

  const lessons: DbLesson[] = [
    { id: 'tc-1-l1', course_id: 'tc-1', position: 1, duration_minutes: 25, title: 'Bài 1: Khái niệm nền tảng về hàm số bậc hai', content: `### 1. Định nghĩa hàm số bậc hai
Hàm số bậc hai là hàm số được cho bằng công thức:
$$y = ax^2 + bx + c \\quad (a \\neq 0)$$

Tập xác định của hàm số bậc hai là $D = \\mathbb{R}$.

### 2. Đồ thị Parabol
- Đỉnh của parabol là điểm $I\\left(-\\frac{b}{2a}; -\\frac{\\Delta}{4a}\\right)$.
- Trục đối xứng là đường thẳng $x = -\\frac{b}{2a}$.
- Bề lõm hướng lên trên khi $a > 0$, hướng xuống dưới khi $a < 0$.` },
    { id: 'tc-1-l2', course_id: 'tc-1', position: 2, duration_minutes: 30, title: 'Bài 2: Tính đơn điệu và lập bảng biến thiên', content: `### Tính đơn điệu của hàm số bậc hai
Cho hàm số $y = ax^2 + bx + c$ với $a > 0$:
- Hàm số **nghịch biến** trên khoảng $\\left(-\\infty; -\\frac{b}{2a}\\right)$.
- Hàm số **đồng biến** trên khoảng $\\left(-\\frac{b}{2a}; +\\infty\\right)$.

Ngược lại với $a < 0$ thì chiều biến thiên đảo ngược.` },
    { id: 'tc-1-l3', course_id: 'tc-1', position: 3, duration_minutes: 35, title: 'Bài 3: Ứng dụng thực tế của đồ thị parabol', content: `### Các bài toán thực tiễn
- Quỹ đạo chuyển động của vật ném xiên trong trọng trường.
- Thiết kế vòm cầu parabol và chóa đèn phản xạ.
- Bài toán tối ưu hóa doanh thu và diện tích lớn nhất.` },
    { id: 'tc-2-l1', course_id: 'tc-2', position: 1, duration_minutes: 20, title: 'Bài 1: Định luật vạn vật hấp dẫn', content: `### Định luật vạn vật hấp dẫn
Hai chất điểm bất kỳ hút nhau với một lực:
$$F_{hd} = G \\cdot \\frac{m_1 m_2}{r^2}$$
- $G \\approx 6{,}67 \\times 10^{-11}\\ \\text{N·m}^2/\\text{kg}^2$ là hằng số hấp dẫn.
- Lực hấp dẫn **tỉ lệ nghịch với bình phương khoảng cách**.` },
    { id: 'tc-2-l2', course_id: 'tc-2', position: 2, duration_minutes: 25, title: 'Bài 2: Gia tốc trọng trường', content: `### Gia tốc rơi tự do
Gần mặt đất, mọi vật rơi tự do với gia tốc $g \\approx 9{,}8\\ \\text{m/s}^2$.
- Đơn vị của gia tốc trong hệ SI là **m/s²**.
- Quãng đường rơi: $s = \\frac{1}{2} g t^2$.` },
    { id: 'tc-2-l3', course_id: 'tc-2', position: 3, duration_minutes: 30, title: 'Bài 3: Chuyển động ném ngang', content: `### Chuyển động ném ngang
Quỹ đạo của vật ném ngang là **một nhánh parabol**:
$$y = \\frac{g}{2v_0^2} x^2$$
Thời gian rơi chỉ phụ thuộc độ cao: $t = \\sqrt{\\frac{2h}{g}}$.` },
    { id: 'tc-3-l1', course_id: 'tc-3', position: 1, duration_minutes: 20, title: 'Lesson 1: Present Perfect tense', content: `### Present Perfect
Cấu trúc: **S + have/has + V3/ed**
- Hành động bắt đầu trong quá khứ, còn tiếp diễn: *I have lived here for 5 years.*
- Trải nghiệm: *She has never been to Japan.*
- Dùng **for** + khoảng thời gian, **since** + mốc thời gian.` },
    { id: 'tc-3-l2', course_id: 'tc-3', position: 2, duration_minutes: 20, title: 'Lesson 2: Synonyms & Vocabulary', content: `### Từ đồng nghĩa thường gặp
- *intentional* = **deliberate** (cố ý)
- *rapid* = **fast** (nhanh)
- *assist* = **help** (giúp đỡ)` },
    { id: 'tc-3-l3', course_id: 'tc-3', position: 3, duration_minutes: 25, title: 'Lesson 3: Giao tiếp hằng ngày', content: `### Mẫu câu giao tiếp
- *How have you been?* — Dạo này bạn thế nào?
- *Could you help me with...?* — Bạn có thể giúp tôi...?
- *I'm looking forward to...* — Tôi rất mong chờ...` },
    { id: 'tc-4-l1', course_id: 'tc-4', position: 1, duration_minutes: 30, title: 'Bài 1: Làm quen với Python', content: `### Biến và kiểu dữ liệu
- Python dùng **thụt lề** để xác định khối lệnh.
- Các kiểu cơ bản: \`int\`, \`float\`, \`str\`, \`bool\`, \`list\`, \`dict\`.` },
    { id: 'tc-4-l2', course_id: 'tc-4', position: 2, duration_minutes: 30, title: 'Bài 2: Hàm và vòng lặp', content: `### Hàm trong Python
Khai báo bằng từ khóa \`def\`; vòng lặp \`for\` duyệt qua mọi phần tử của một dãy.` },
  ]

  const enrollments: DbEnrollment[] = [
    { student_id: S_MINH, course_id: 'tc-1', status: 'active', enrolled_at: ago(40) },
    { student_id: S_MINH, course_id: 'tc-2', status: 'active', enrolled_at: ago(35) },
    { student_id: S_MINH, course_id: 'tc-3', status: 'completed', enrolled_at: ago(60) },
    { student_id: S_ANH, course_id: 'tc-1', status: 'active', enrolled_at: ago(50) },
    { student_id: S_ANH, course_id: 'tc-2', status: 'active', enrolled_at: ago(45) },
    { student_id: S_NGOC, course_id: 'tc-1', status: 'active', enrolled_at: ago(48) },
    { student_id: S_LONG, course_id: 'tc-2', status: 'active', enrolled_at: ago(30) },
    { student_id: S_TRANG, course_id: 'tc-1', status: 'active', enrolled_at: ago(28) },
    { student_id: S_TRANG, course_id: 'tc-3', status: 'active', enrolled_at: ago(28) },
    { student_id: S_DNAM, course_id: 'tc-3', status: 'active', enrolled_at: ago(20) },
  ]

  const progress: DbProgress[] = [
    { student_id: S_MINH, lesson_id: 'tc-1-l1', completed_at: ago(3) },
    { student_id: S_MINH, lesson_id: 'tc-1-l2', completed_at: ago(1) },
    { student_id: S_MINH, lesson_id: 'tc-2-l1', completed_at: ago(2) },
    { student_id: S_MINH, lesson_id: 'tc-3-l1', completed_at: ago(20) },
    { student_id: S_MINH, lesson_id: 'tc-3-l2', completed_at: ago(18) },
    { student_id: S_MINH, lesson_id: 'tc-3-l3', completed_at: ago(15) },
    { student_id: S_ANH, lesson_id: 'tc-1-l1', completed_at: ago(6) },
    { student_id: S_ANH, lesson_id: 'tc-1-l2', completed_at: ago(4) },
    { student_id: S_ANH, lesson_id: 'tc-2-l1', completed_at: ago(5) },
    { student_id: S_NGOC, lesson_id: 'tc-1-l1', completed_at: ago(9) },
    { student_id: S_NGOC, lesson_id: 'tc-1-l2', completed_at: ago(7) },
    { student_id: S_NGOC, lesson_id: 'tc-1-l3', completed_at: ago(2) },
    { student_id: S_LONG, lesson_id: 'tc-2-l1', completed_at: ago(14) },
    { student_id: S_TRANG, lesson_id: 'tc-1-l1', completed_at: ago(16) },
    { student_id: S_DNAM, lesson_id: 'tc-3-l1', completed_at: ago(3) },
    { student_id: S_DNAM, lesson_id: 'tc-3-l2', completed_at: ago(1) },
  ]

  const quizzes: DbQuiz[] = [
    {
      id: 'q-1', course_id: 'tc-1', title: 'Kiểm tra 15 phút: Hàm số và Đồ thị Parabol', time_limit_minutes: 15, pass_score: 60,
      status: 'published', created_by: T_AN, created_at: ago(30),
      questions: [
        { id: 'q-1-1', prompt: 'Tọa độ đỉnh I của đồ thị parabol hàm số y = ax² + bx + c (a ≠ 0) là gì?', options: ['I(-b/2a; -Δ/4a)', 'I(b/2a; Δ/4a)', 'I(-b/a; -Δ/2a)', 'I(-b/2a; Δ/4a)'], answer_key: 0, explanation: 'Tọa độ đỉnh I của parabol là (-b/2a; -Δ/4a).' },
        { id: 'q-1-2', prompt: 'Với hàm số y = x² - 4x + 3, trục đối xứng của đồ thị là đường thẳng nào?', options: ['x = 1', 'x = 2', 'x = -2', 'x = 4'], answer_key: 1, explanation: 'Trục đối xứng là x = -b/(2a) = -(-4)/(2·1) = 2.' },
        { id: 'q-1-3', prompt: 'Bề lõm của đồ thị hàm số y = -2x² + 5x - 1 hướng về phía nào?', options: ['Hướng lên trên', 'Hướng xuống dưới', 'Hướng sang phải', 'Hướng sang trái'], answer_key: 1, explanation: 'Vì a = -2 < 0 nên parabol có bề lõm hướng xuống dưới.' },
        { id: 'q-1-4', prompt: 'Giá trị nhỏ nhất của hàm số y = x² - 2x + 5 đạt được khi x bằng bao nhiêu?', options: ['x = 1', 'x = 2', 'x = 0', 'x = -1'], answer_key: 0, explanation: 'y = (x - 1)² + 4 ≥ 4, đạt nhỏ nhất khi x = 1.' },
      ],
    },
    {
      id: 'q-2', course_id: 'tc-2', title: 'Quiz: Lực hấp dẫn và chuyển động', time_limit_minutes: 10, pass_score: 50,
      status: 'published', created_by: T_NAM, created_at: ago(25),
      questions: [
        { id: 'q-2-1', prompt: 'Lực hấp dẫn giữa hai vật tỉ lệ nghịch với:', options: ['Khoảng cách giữa hai vật', 'Bình phương khoảng cách giữa hai vật', 'Tích khối lượng hai vật', 'Tổng khối lượng hai vật'], answer_key: 1, explanation: 'F = G·m₁m₂/r², tỉ lệ nghịch với r².' },
        { id: 'q-2-2', prompt: 'Đơn vị của gia tốc trọng trường trong hệ SI là:', options: ['m/s', 'N/kg²', 'm/s²', 'kg·m/s'], answer_key: 2, explanation: 'Gia tốc có đơn vị mét trên giây bình phương (m/s²).' },
        { id: 'q-2-3', prompt: 'Quỹ đạo của vật ném ngang (bỏ qua sức cản) có dạng:', options: ['Đường thẳng đứng', 'Đường tròn', 'Đường hypebol', 'Một nhánh parabol'], answer_key: 3, explanation: 'Phương trình quỹ đạo y = g·x²/(2v₀²) là một nhánh parabol.' },
      ],
    },
    {
      id: 'q-3', course_id: 'tc-3', title: 'Mini test: Present Perfect & Vocabulary', time_limit_minutes: 10, pass_score: 50,
      status: 'published', created_by: T_HA, created_at: ago(22),
      questions: [
        { id: 'q-3-1', prompt: 'Choose the correct sentence in Present Perfect tense:', options: ['She is living here since five years.', 'She has lived here for five years.', 'She lived here for five years ago.', 'She has live here since five years.'], answer_key: 1, explanation: 'Present perfect: has/have + V3; "for" + khoảng thời gian.' },
        { id: 'q-3-2', prompt: 'Which word is closest in meaning to "INTENTIONAL"?', options: ['Accidental', 'Casual', 'Deliberate', 'Spontaneous'], answer_key: 2, explanation: '"Intentional" và "deliberate" đều nghĩa là cố ý.' },
      ],
    },
    {
      id: 'q-4', course_id: 'tc-1', title: 'Bài tập tuần: Tính đơn điệu của hàm số', time_limit_minutes: 20, pass_score: 70,
      status: 'draft', created_by: T_AN, created_at: ago(1),
      questions: [
        { id: 'q-4-1', prompt: 'Hàm số y = x² - 4x + 3 đồng biến trên khoảng nào?', options: ['(-∞; 2)', '(2; +∞)', '(1; 3)', '(-∞; 4)'], answer_key: 1, explanation: 'a = 1 > 0 nên hàm số đồng biến trên (2; +∞).' },
      ],
    },
  ]

  const attempts: DbAttempt[] = [
    { id: 'att-1', quiz_id: 'q-1', student_id: S_ANH, answers: { 'q-1-1': 0, 'q-1-2': 1, 'q-1-3': 1, 'q-1-4': 2 }, score: 75, is_passed: true, submitted_at: ago(4, 3) },
    { id: 'att-2', quiz_id: 'q-1', student_id: S_NGOC, answers: { 'q-1-1': 0, 'q-1-2': 1, 'q-1-3': 1, 'q-1-4': 0 }, score: 100, is_passed: true, submitted_at: ago(2, 5), feedback: 'Bài làm xuất sắc! Lập luận chặt chẽ và chính xác.', graded_at: ago(1) },
    { id: 'att-3', quiz_id: 'q-1', student_id: S_TRANG, answers: { 'q-1-1': 2, 'q-1-2': 1, 'q-1-3': 0, 'q-1-4': 0 }, score: 50, is_passed: false, submitted_at: ago(15) },
    { id: 'att-4', quiz_id: 'q-2', student_id: S_LONG, answers: { 'q-2-1': 1, 'q-2-2': 0, 'q-2-3': 3 }, score: 67, is_passed: true, submitted_at: ago(13) },
    { id: 'att-5', quiz_id: 'q-2', student_id: S_ANH, answers: { 'q-2-1': 0, 'q-2-2': 2, 'q-2-3': 0 }, score: 33, is_passed: false, submitted_at: ago(5) },
    { id: 'att-6', quiz_id: 'q-3', student_id: S_MINH, answers: { 'q-3-1': 1, 'q-3-2': 2 }, score: 100, is_passed: true, submitted_at: ago(14) },
    { id: 'att-7', quiz_id: 'q-3', student_id: S_DNAM, answers: { 'q-3-1': 1, 'q-3-2': 0 }, score: 50, is_passed: true, submitted_at: ago(1) },
  ]

  const notifications: DbNotification[] = [
    { id: 'notif-1', title: 'Chào mừng bạn đến với EduAI', message: 'Khám phá không gian học tập và giảng dạy thông minh ứng dụng công nghệ Trí tuệ nhân tạo.', type: 'info', target: 'all', created_at: ago(0, 1), read_by: [] },
    { id: 'notif-2', title: 'Nâng cấp máy chủ định kỳ', message: 'Hệ thống EduAI sẽ tiến hành tối ưu hóa hiệu năng máy chủ vào 00:00 Chủ nhật tuần này.', type: 'warning', target: 'all', created_at: ago(0, 4), read_by: [] },
    { id: 'notif-3', title: 'Khóa học mới sẵn sàng', message: 'Giảng viên đã cập nhật thêm tài liệu và đề thi trắc nghiệm mới trong tuần này.', type: 'success', target: 'students', created_at: ago(0, 12), read_by: [] },
    { id: 'notif-4', title: 'Khóa học mới chờ phê duyệt', message: 'Giảng viên vừa tạo khóa học "Nhập môn Lập trình Python cùng Trí tuệ nhân tạo". Vui lòng kiểm tra và duyệt xuất bản.', type: 'info', target: 'admins', created_at: ago(2), read_by: [] },
  ]

  return { profiles, courses, lessons, enrollments, progress, quizzes, attempts, notifications }
}

function load(): DemoTables {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as DemoTables
      if (parsed && Array.isArray(parsed.courses) && Array.isArray(parsed.quizzes)) return parsed
    }
  } catch {
    // dữ liệu hỏng -> tạo lại
  }
  const fresh = seed()
  LEGACY_KEYS.forEach((k) => localStorage.removeItem(k))
  localStorage.setItem(DB_KEY, JSON.stringify(fresh))
  return fresh
}

export const demoDb = {
  read(): DemoTables {
    return load()
  },

  /** Ghi thay đổi (giao dịch đơn giản) rồi phát sự kiện để các màn hình khác cập nhật. */
  write<T>(mutate: (tables: DemoTables) => T, event?: string, detail?: unknown): T {
    const tables = load()
    const result = mutate(tables)
    localStorage.setItem(DB_KEY, JSON.stringify(tables))
    if (event) window.dispatchEvent(new CustomEvent(event, { detail }))
    return result
  },

  /** Đảm bảo tài khoản demo tự đăng ký cũng có hồ sơ trong bảng profiles. */
  ensureProfile(profile: { id: string; email: string; full_name: string; role: AppRole }) {
    const tables = load()
    if (tables.profiles.some((p) => p.id === profile.id)) return
    demoDb.write((t) => {
      t.profiles.push({ ...profile, created_at: new Date().toISOString() })
    })
  },

  newId(prefix: string): string {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
  },
}
