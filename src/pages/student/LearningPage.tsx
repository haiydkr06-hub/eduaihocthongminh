import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { studentService, type StudentLessonItem, type StudentQuizItem } from '../../services/studentService'
import { useAuth } from '../../hooks/useAuth'
import { AITutorChat } from '../../components/AITutorChat'
import { MarkdownContent } from '../../components/MarkdownContent'
import { getFriendlyErrorMessage } from '../../lib/errorMessage'

const NOTES_KEY = 'eduai_lesson_notes'

function readNote(userId: string | undefined, lessonId: string | undefined): string {
  if (!userId || !lessonId) return ''
  try {
    const all = JSON.parse(localStorage.getItem(NOTES_KEY) || '{}') as Record<string, string>
    return all[`${userId}:${lessonId}`] || ''
  } catch {
    return ''
  }
}

function writeNote(userId: string, lessonId: string, text: string) {
  let all: Record<string, string> = {}
  try {
    all = JSON.parse(localStorage.getItem(NOTES_KEY) || '{}') as Record<string, string>
  } catch {
    all = {}
  }
  all[`${userId}:${lessonId}`] = text
  localStorage.setItem(NOTES_KEY, JSON.stringify(all))
}

/** Chuyển link YouTube dạng watch/youtu.be sang dạng embed để nhúng được. */
function toEmbedUrl(url?: string): string | null {
  if (!url) return null
  const m = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/.exec(url)
  return m ? `https://www.youtube.com/embed/${m[1]}` : null
}

export function LearningPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId?: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [lessons, setLessons] = useState<StudentLessonItem[]>([])
  const [currentIdx, setCurrentIdx] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'resources'>('overview')
  const [savingProgress, setSavingProgress] = useState(false)
  const [completedNotice, setCompletedNotice] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [quizzes, setQuizzes] = useState<StudentQuizItem[]>([])
  const [noteDraft, setNoteDraft] = useState<{ lessonId: string; text: string } | null>(null)
  const [noteSaved, setNoteSaved] = useState(false)

  // Tải danh sách bài học của khóa học
  useEffect(() => {
    if (!courseId || !user?.id) return
    let active = true

    studentService
      .getLessons(courseId, user.id)
      .then((data) => {
        if (!active) return
        setLessons(data)
        setLoadError(null)
        if (lessonId) {
          const foundIdx = data.findIndex((l) => l.id === lessonId)
          setCurrentIdx(foundIdx !== -1 ? foundIdx : 0)
        } else {
          // Mặc định chọn bài học chưa hoàn thành đầu tiên, hoặc bài 0
          const firstUncompleted = data.findIndex((l) => !l.is_completed)
          setCurrentIdx(firstUncompleted !== -1 ? firstUncompleted : 0)
        }
      })
      .catch((err) => {
        if (active) setLoadError(getFriendlyErrorMessage(err, 'Không thể tải bài học của khóa này.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    // Bài kiểm tra của khóa (không chặn việc học nếu lỗi)
    studentService
      .getMyQuizzes(user.id, courseId)
      .then((q) => active && setQuizzes(q))
      .catch(() => active && setQuizzes([]))

    return () => {
      active = false
    }
  }, [courseId, lessonId, user?.id])

  const currentLesson = lessons[currentIdx]

  // Chuyển bài học
  const handleSelectLesson = (idx: number) => {
    if (idx < 0 || idx >= lessons.length) return
    setCurrentIdx(idx)
    const targetLesson = lessons[idx]
    if (targetLesson) {
      navigate(`/student/learning/${courseId}/${targetLesson.id}`, { replace: true })
    }
  }

  // Đánh dấu hoàn thành bài học và chuyển tiếp sang bài sau
  const handleCompleteAndNext = async () => {
    if (!currentLesson || savingProgress || !user?.id) return
    setSavingProgress(true)
    setActionError(null)

    try {
      // 1. Lưu tiến độ — chỉ hiện dấu tích khi lưu thành công thật
      await studentService.markLessonComplete(user.id, currentLesson.id)
      setLessons((prev) => prev.map((l, idx) => (idx === currentIdx ? { ...l, is_completed: true } : l)))

      // 2. Tự động chuyển sang bài tiếp theo
      if (currentIdx < lessons.length - 1) {
        const nextIdx = currentIdx + 1
        setCurrentIdx(nextIdx)
        navigate(`/student/learning/${courseId}/${lessons[nextIdx].id}`, { replace: true })
      } else {
        setCompletedNotice(true)
      }
    } catch (err) {
      setActionError(getFriendlyErrorMessage(err, 'Không lưu được tiến độ. Vui lòng thử lại.'))
    } finally {
      setSavingProgress(false)
    }
  }

  const noteText = noteDraft && noteDraft.lessonId === currentLesson?.id ? noteDraft.text : readNote(user?.id, currentLesson?.id)
  const handleSaveNote = () => {
    if (!user?.id || !currentLesson) return
    writeNote(user.id, currentLesson.id, noteText)
    setNoteSaved(true)
    setTimeout(() => setNoteSaved(false), 2000)
  }
  const embedUrl = toEmbedUrl(currentLesson?.video_url)

  const completedCount = lessons.filter((l) => l.is_completed).length
  const progressPercent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0b0f19] text-gray-100 overflow-hidden font-sans">
      
      {/* 1. TOP NAVIGATION BAR (CỐ ĐỊNH Ở ĐẦU TRANG) */}
      <header className="h-14 bg-[#111827] border-b border-gray-800 px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-30">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/student/courses')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-semibold transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Quay lại khóa học</span>
          </button>

          <div className="h-4 w-px bg-gray-700 hidden sm:block" />

          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-bold text-white truncate flex items-center gap-2">
              <span>{currentLesson ? currentLesson.title : loading ? 'Đang tải bài giảng...' : 'Không có bài học để hiển thị'}</span>
            </div>
            <div className="text-[11px] text-gray-400 hidden md:block">
              {lessons.length > 0 ? `Bài ${currentIdx + 1} / ${lessons.length} • ` : ''}Khóa học trực tuyến EduAI
            </div>
          </div>
        </div>

        {/* Thanh tiến độ & Nút đóng/mở Sidebar */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-3">
            <div className="w-32 bg-gray-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs text-gray-300 font-semibold">{progressPercent}%</span>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              sidebarOpen
                ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
            title="Đóng / Mở danh sách bài học"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            <span className="hidden sm:inline">{sidebarOpen ? 'Ẩn giáo trình' : 'Hiện giáo trình'}</span>
          </button>
        </div>
      </header>

      {/* 2. BODY KHU VỰC HỌC TẬP (VIDEO 75% VÀ SIDEBAR 25%) */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* KHU VỰC TRÌNH CHIẾU VIDEO & TÀI LIỆU (75% CHIỀU RỘNG) */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-[#0f172a]">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-3 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
                <span className="text-xs text-gray-400">Đang chuẩn bị phòng học...</span>
              </div>
            </div>
          ) : currentLesson ? (
            <div className="max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
              
              {/* TRÌNH PHÁT VIDEO PLAYER CHUYÊN NGHIỆP */}
              <div className="relative aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-800 flex items-center justify-center group">
                {embedUrl ? (
                  <iframe
                    src={embedUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={currentLesson.title}
                  />
                ) : (
                  <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-black">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px]" />
                    <div className="text-center z-10 px-4">
                      <div className="text-4xl mb-3" aria-hidden="true">📖</div>
                      <h3 className="text-base sm:text-xl font-bold text-white mb-2">{currentLesson.title}</h3>
                      <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto">
                        Bài học dạng đọc • Thời lượng ước tính {currentLesson.duration_minutes || 0} phút. Nội dung chi tiết ở bên dưới.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* TABS NỘI DUNG & TÀI LIỆU BÀI HỌC */}
              <div className="bg-[#1e293b]/70 border border-gray-800 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('overview')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition ${
                        activeTab === 'overview'
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      Mô tả & Bài học
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('notes')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition ${
                        activeTab === 'notes'
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      Ghi chú cá nhân
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('resources')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition ${
                        activeTab === 'resources'
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      Bài kiểm tra ({quizzes.length})
                    </button>
                  </div>

                  <span className="text-xs text-gray-400">
                    Mã bài giảng: <code className="text-primary-400 font-mono">{currentLesson.id}</code>
                  </span>
                </div>

                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    <h2 className="text-lg sm:text-xl font-extrabold text-white">
                      {currentLesson.title}
                    </h2>
                    <div className="max-w-none text-xs sm:text-sm text-gray-300 leading-relaxed space-y-3">
                      {currentLesson.content ? (
                        <MarkdownContent text={currentLesson.content} />
                      ) : (
                        <p>Nội dung bài giảng đang được cập nhật.</p>
                      )}
                      
                      <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800">
                        <h4 className="text-sm font-bold text-primary-400 mb-2 flex items-center gap-2">
                          <span>💡</span> Mục tiêu trọng tâm bài học:
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-gray-400 text-xs">
                          <li>Hiểu rõ các khái niệm và định nghĩa then chốt của bài học.</li>
                          <li>Nắm vững phương pháp giải bài tập thông qua các ví dụ minh họa.</li>
                          <li>Tự tin thực hiện các bài thi kiểm tra trắc nghiệm cuối chương.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'notes' && (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-400">
                      Ghi lại các công thức và thắc mắc của bạn trong quá trình học tập.
                    </p>
                    <label htmlFor="lesson-note" className="sr-only">Ghi chú bài học</label>
                    <textarea
                      id="lesson-note"
                      rows={4}
                      value={noteText}
                      onChange={(e) => currentLesson && setNoteDraft({ lessonId: currentLesson.id, text: e.target.value })}
                      placeholder="Ghi chú bài học của bạn tại đây..."
                      className="w-full p-3 rounded-xl bg-gray-900/90 border border-gray-700 text-xs sm:text-sm text-white focus:outline-none focus:border-primary-500"
                    />
                    <div className="flex items-center justify-end gap-3">
                      {noteSaved && <span className="text-xs text-emerald-400" role="status">✓ Đã lưu ghi chú</span>}
                      <button type="button" onClick={handleSaveNote} className="px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-semibold hover:bg-primary-500 transition">
                        Lưu ghi chú
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'resources' && (
                  <div className="space-y-2">
                    {quizzes.length === 0 ? (
                      <p className="text-xs text-gray-400">Khóa học này chưa có bài kiểm tra nào được xuất bản.</p>
                    ) : (
                      quizzes.map((q) => (
                        <div key={q.id} className="p-3 rounded-xl bg-gray-900/70 border border-gray-800 flex items-center justify-between gap-3 text-xs">
                          <div className="min-w-0">
                            <div className="font-semibold text-white truncate">📝 {q.title}</div>
                            <div className="text-[11px] text-gray-400">
                              {q.questions_count} câu • {q.time_limit_minutes} phút • Đạt từ {q.pass_score} điểm
                              {q.bestScore !== null && ` • Điểm cao nhất của bạn: ${Math.round(q.bestScore)}`}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => navigate(`/student/quiz/${q.id}`)}
                            className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-500"
                          >
                            {q.attempts > 0 ? 'Làm lại' : 'Làm bài'}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-sm text-gray-300 p-6 text-center" role={loadError ? 'alert' : undefined}>
              <p>{loadError || 'Khóa học này chưa có bài học nào.'}</p>
              <button
                type="button"
                onClick={() => navigate('/student/courses')}
                className="px-4 py-2 rounded-xl bg-primary-600 text-white text-xs font-bold hover:bg-primary-500"
              >
                Về danh sách khóa học
              </button>
            </div>
          )}
        </div>

        {/* DANH SÁCH BÀI HỌC VÀ CHƯƠNG (SIDEBAR 25% CHIỀU RỘNG) */}
        {sidebarOpen && (
          <aside className="w-80 sm:w-96 border-l border-gray-800 bg-[#111827] flex flex-col flex-shrink-0 z-20">
            {/* Header Sidebar */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
              <div>
                <h3 className="font-extrabold text-sm text-white">Nội dung khóa học</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {completedCount}/{lessons.length} bài đã hoàn thành ({progressPercent}%)
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-bold text-xs border border-emerald-500/20">
                {progressPercent}%
              </span>
            </div>

            {/* Danh sách bài học dạng List / Accordion */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-800/60 p-2 space-y-1">
              {lessons.map((lesson, idx) => {
                const isCurrent = idx === currentIdx
                const isCompleted = lesson.is_completed

                return (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => handleSelectLesson(idx)}
                    className={`w-full p-3 rounded-xl flex items-start gap-3 transition text-left group ${
                      isCurrent
                        ? 'bg-primary-600/20 border border-primary-500/40 text-white'
                        : 'hover:bg-gray-800/60 text-gray-300'
                    }`}
                  >
                    {/* Icon thể hiện trạng thái (Đã hoàn thành / Đang học / Khóa) */}
                    <div className="flex-shrink-0 mt-0.5">
                      {isCompleted ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-xs font-bold">
                          ✓
                        </div>
                      ) : isCurrent ? (
                        <div className="w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold animate-pulse">
                          ▶
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-800 text-gray-500 border border-gray-700 flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold leading-snug line-clamp-2">
                        {idx + 1}. {lesson.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                        <span>⏱ {lesson.duration_minutes || 20} phút</span>
                        {isCompleted && (
                          <span className="text-emerald-400 text-[10px] font-medium">• Đã xong</span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </aside>
        )}
      </div>

      {/* 3. BOTTOM ACTION BAR (DƯỚI CÙNG VỚI NÚT HOÀN THÀNH VÀ TIẾP TỤC) */}
      <footer className="h-16 bg-[#111827] border-t border-gray-800 px-4 sm:px-8 flex items-center justify-between flex-shrink-0 z-30">
        <button
          type="button"
          onClick={() => handleSelectLesson(currentIdx - 1)}
          disabled={currentIdx === 0}
          className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:hover:bg-gray-800 text-gray-300 text-xs font-bold transition flex items-center gap-1.5"
        >
          ← Bài trước
        </button>

        {actionError ? (
          <div className="text-xs text-red-400 px-2" role="alert">{actionError}</div>
        ) : (
          <div className="text-xs text-gray-400 hidden sm:block">
            {currentLesson && (
              <>
                Bài {currentIdx + 1} / {lessons.length}: <strong className="text-gray-200">{currentLesson.title}</strong>
              </>
            )}
          </div>
        )}

        {/* Nút Hoàn thành và Tiếp tục */}
        <button
          type="button"
          onClick={handleCompleteAndNext}
          disabled={savingProgress || !currentLesson}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/25 transition active:scale-95 disabled:opacity-50 flex items-center gap-2"
        >
          {savingProgress ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Đang lưu...</span>
            </>
          ) : (
            <>
              <span>✓ Hoàn thành và Tiếp tục</span>
              <span>→</span>
            </>
          )}
        </button>
      </footer>

      {/* TÍCH HỢP GIA SƯ AI (AI TUTOR CHAT) NỔI BẬT GÓC DƯỚI BÊN PHẢI */}
      <AITutorChat lessonTitle={currentLesson?.title} />

      {/* MODAL CHÚC MỪNG KHI HOÀN THÀNH KHÓA HỌC */}
      {completedNotice && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-gray-700 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl animate-fade-in">
            <div className="text-5xl mb-3">🎓</div>
            <h3 className="text-xl font-black text-white mb-2">Chúc mừng bạn đã hoàn thành!</h3>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed mb-6">
              Bạn đã hoàn tất toàn bộ các bài học trong khóa học này. Hãy thử sức ngay với bài kiểm tra trắc nghiệm AI để nhận chứng chỉ nhé!
            </p>
            <div className="flex items-center gap-3 justify-center">
              <button
                type="button"
                onClick={() => setCompletedNotice(false)}
                className="px-4 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-semibold transition"
              >
                Xem lại bài học
              </button>
              <button
                type="button"
                onClick={() => {
                  setCompletedNotice(false)
                  setActiveTab('resources')
                }}
                className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold shadow-md transition"
              >
                Làm bài kiểm tra
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LearningPage
