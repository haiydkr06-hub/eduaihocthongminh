import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ClipboardCheck,
  Plus,
  Clock,
  Award,
  CheckCircle,
  XCircle,
  Check,
  Sparkles,
} from 'lucide-react'
import { teacherService, type TeacherQuiz, type TeacherCourse } from '../../services/teacherService'
import { useAuth } from '../../hooks/useAuth'
import { useTeacherScope } from '../../hooks/useTeacherScope'
import { getFriendlyErrorMessage } from '../../lib/errorMessage'

export function TeacherQuizzesPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const scope = useTeacherScope()
  const [quizzes, setQuizzes] = useState<TeacherQuiz[]>([])
  const [courses, setCourses] = useState<TeacherCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [busyQuizId, setBusyQuizId] = useState<string | null>(null)

  // Form states
  const [title, setTitle] = useState('')
  const [courseId, setCourseId] = useState('')
  const [timeLimit, setTimeLimit] = useState(15)
  const [passScore, setPassScore] = useState(60)
  const [questionPrompt, setQuestionPrompt] = useState('')
  const [optA, setOptA] = useState('')
  const [optB, setOptB] = useState('')
  const [optC, setOptC] = useState('')
  const [optD, setOptD] = useState('')
  const [correctIdx, setCorrectIdx] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (scope === undefined) return
    let active = true
    Promise.all([teacherService.getQuizzes(scope), teacherService.getCourses(scope)])
      .then(([quizData, courseData]) => {
        if (!active) return
        setQuizzes(quizData)
        setCourses(courseData)
        setCourseId((prev) => prev || courseData[0]?.id || '')
      })
      .catch((err) => {
        if (active) setError(getFriendlyErrorMessage(err, 'Không thể tải danh sách bài kiểm tra.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [scope, reloadKey])

  const handleCreateQuiz = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !profile?.id || submitting) return

    const hasQuestion = questionPrompt.trim().length > 0
    setSubmitting(true)
    setError(null)
    try {
      // Câu hỏi giảng viên nhập được lưu thật (trước đây bị bỏ qua và quiz luôn gắn vào khóa "tc-1")
      const newQuiz = await teacherService.createQuiz(profile.id, {
        course_id: courseId,
        title: title.trim(),
        timeLimit,
        passScore,
        status: 'draft',
        questions: hasQuestion
          ? [{ prompt: questionPrompt.trim(), options: [optA, optB, optC, optD].map((o) => o.trim()), answer_key: correctIdx, explanation: '' }]
          : [],
      })
      setQuizzes((prev) => [newQuiz, ...prev])
      setShowCreateModal(false)
      setTitle('')
      setQuestionPrompt('')
      setOptA('')
      setOptB('')
      setOptC('')
      setOptD('')
      setNotice(`Đã lưu bản nháp "${newQuiz.title}". Bấm "Xuất bản" khi đã sẵn sàng cho học viên làm bài.`)
      setTimeout(() => setNotice(null), 4000)
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Không lưu được bài kiểm tra.'))
    } finally {
      setSubmitting(false)
    }
  }

  const toggleStatus = async (quiz: TeacherQuiz) => {
    if (busyQuizId) return
    setBusyQuizId(quiz.id)
    setError(null)
    try {
      const next = quiz.status === 'published' ? 'draft' : 'published'
      await teacherService.setQuizStatus(quiz.id, next)
      setNotice(next === 'published' ? `Đã xuất bản "${quiz.title}" cho học viên.` : `Đã thu hồi "${quiz.title}" về bản nháp.`)
      setReloadKey((k) => k + 1)
      setTimeout(() => setNotice(null), 3000)
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Không cập nhật được trạng thái quiz.'))
    } finally {
      setBusyQuizId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#252641]">Bài tập & Bài kiểm tra</h1>
          <p className="text-sm text-[#777a91]">
            Soạn câu hỏi trắc nghiệm, cấu hình thời gian thi và xuất bản quiz cho học viên
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/teacher/ai-quiz')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-[#6857DF] hover:from-pink-600 hover:to-[#5144BE] text-white text-xs font-bold transition shadow-md shadow-pink-500/20"
          >
            <Sparkles className="w-4 h-4" /> Soạn Quiz bằng AI
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#6857DF] hover:bg-[#5144BE] text-white text-xs font-bold transition shadow-md shadow-[#6857DF]/25"
          >
            <Plus className="w-4 h-4" /> Tạo bài kiểm tra mới
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">{error}</div>
      )}
      {notice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
          <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Quizzes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-16 text-center text-[#777a91]">
            <div className="w-8 h-8 mx-auto border-2 border-[#6857DF]/20 border-t-[#6857DF] rounded-full animate-spin mb-2" />
            Đang tải danh sách bài kiểm tra...
          </div>
        ) : (
          quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white rounded-2xl border border-[#eceef4] p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold text-[#6857DF] bg-[#F0EDFF] px-2 py-0.5 rounded">
                    {quiz.courseTitle}
                  </span>
                  {quiz.status === 'published' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3" /> Đang mở
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                      <XCircle className="w-3 h-3" /> Bản nháp
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-[#252641] text-base mb-3 line-clamp-2">{quiz.title}</h3>

                <div className="space-y-1.5 text-xs text-[#777a91]">
                  <p className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-purple-600" /> Thời gian làm bài: <strong>{quiz.timeLimit} phút</strong>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-500" /> Điểm đạt chuẩn: <strong>{quiz.passScore}%</strong>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <ClipboardCheck className="w-3.5 h-3.5 text-blue-600" /> Số lượng câu hỏi: <strong>{quiz.questionsCount} câu</strong>
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#eceef4] mt-4 flex items-center justify-between text-xs">
                <span className="text-[#777a91]">
                  Đã có <strong>{quiz.submissionsCount}</strong> lượt thi
                </span>
                <button
                  onClick={() => void toggleStatus(quiz)}
                  disabled={busyQuizId !== null}
                  className="px-3 py-1.5 rounded-lg border border-[#eceef4] hover:bg-[#F0EDFF] hover:text-[#6857DF] font-semibold text-[#252641] transition disabled:opacity-50"
                >
                  {quiz.status === 'published' ? 'Thu hồi' : 'Xuất bản'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Create Quiz */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-[#eceef4] max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-[#252641] mb-1">Tạo bài kiểm tra mới</h3>
            <p className="text-xs text-[#777a91] mb-4">Soạn tiêu đề, thiết lập thời gian và thêm câu hỏi trắc nghiệm</p>

            <form onSubmit={handleCreateQuiz} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#777a91] uppercase tracking-wider mb-1.5">
                  Tên bài kiểm tra
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Kiểm tra 15 phút - Hàm số và Đồ thị..."
                  className="w-full px-3.5 py-2.5 bg-[#f7f8fc] border border-[#eceef4] rounded-xl text-xs focus:outline-none focus:border-[#6857DF]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#777a91] uppercase tracking-wider mb-1.5">
                  Khóa học áp dụng
                </label>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-[#f7f8fc] border border-[#eceef4] rounded-xl text-xs focus:outline-none focus:border-[#6857DF]"
                >
                  {courses.length === 0 && <option value="">— Bạn chưa có khóa học nào —</option>}
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#777a91] uppercase tracking-wider mb-1.5">
                    Thời gian (phút)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-[#f7f8fc] border border-[#eceef4] rounded-xl text-xs focus:outline-none focus:border-[#6857DF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#777a91] uppercase tracking-wider mb-1.5">
                    Điểm đạt chuẩn (%)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={passScore}
                    onChange={(e) => setPassScore(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-[#f7f8fc] border border-[#eceef4] rounded-xl text-xs focus:outline-none focus:border-[#6857DF]"
                  />
                </div>
              </div>

              {/* Sample Question Box */}
              <div className="p-4 rounded-xl border border-purple-200 bg-[#F0EDFF]/30 space-y-3">
                <h4 className="text-xs font-bold text-[#6857DF] uppercase">Câu hỏi trắc nghiệm mẫu (Câu 1)</h4>
                <input
                  type="text"
                  placeholder="Nội dung câu hỏi..."
                  value={questionPrompt}
                  onChange={(e) => setQuestionPrompt(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#eceef4] rounded-xl text-xs focus:outline-none focus:border-[#6857DF]"
                />
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <input
                    type="text"
                    placeholder="Đáp án A"
                    value={optA}
                    onChange={(e) => setOptA(e.target.value)}
                    className="px-3 py-2 bg-white border border-[#eceef4] rounded-xl focus:outline-none focus:border-[#6857DF]"
                  />
                  <input
                    type="text"
                    placeholder="Đáp án B"
                    value={optB}
                    onChange={(e) => setOptB(e.target.value)}
                    className="px-3 py-2 bg-white border border-[#eceef4] rounded-xl focus:outline-none focus:border-[#6857DF]"
                  />
                  <input
                    type="text"
                    placeholder="Đáp án C"
                    value={optC}
                    onChange={(e) => setOptC(e.target.value)}
                    className="px-3 py-2 bg-white border border-[#eceef4] rounded-xl focus:outline-none focus:border-[#6857DF]"
                  />
                  <input
                    type="text"
                    placeholder="Đáp án D"
                    value={optD}
                    onChange={(e) => setOptD(e.target.value)}
                    className="px-3 py-2 bg-white border border-[#eceef4] rounded-xl focus:outline-none focus:border-[#6857DF]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#777a91] mb-1">Đáp án đúng:</label>
                  <select
                    value={correctIdx}
                    onChange={(e) => setCorrectIdx(Number(e.target.value))}
                    className="px-3 py-1.5 bg-white border border-[#eceef4] rounded-lg text-xs"
                  >
                    <option value={0}>Đáp án A</option>
                    <option value={1}>Đáp án B</option>
                    <option value={2}>Đáp án C</option>
                    <option value={3}>Đáp án D</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-[#6857DF] hover:bg-[#5144BE] text-white text-xs font-bold transition shadow-sm"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu bản nháp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
