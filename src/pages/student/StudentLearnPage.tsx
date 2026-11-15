import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  CheckCircle,
  Clock,
  Play,
  ArrowLeft,
  ArrowRight,
  ClipboardCheck,
  Check,
  Sparkles,
  Send,
} from 'lucide-react'
import { studentService, type StudentLessonItem } from '../../services/studentService'
import { useAuth } from '../../hooks/useAuth'

export function StudentLearnPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [lessons, setLessons] = useState<StudentLessonItem[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<string | null>(null)

  // AI Chat Assistant inside room
  const [aiQuestion, setAiQuestion] = useState('')
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: 'Chào bạn! Mình là Trợ lý AI EduAI. Nếu bạn có bất kỳ thắc mắc nào về bài giảng này, hãy gõ câu hỏi cho mình nhé!',
    },
  ])
  const [aiTyping, setAiTyping] = useState(false)

  useEffect(() => {
    let active = true
    studentService.getLessons(courseId || 'tc-1', profile?.id)
      .then((data) => {
        if (active) {
          setLessons(data)
          setLoading(false)
        }
      })
      .catch(() => {
        if (active) {
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [courseId, profile?.id])

  const currentLesson = lessons[currentIdx]

  const handleMarkComplete = async () => {
    if (!currentLesson || !profile?.id) return
    await studentService.markLessonComplete(profile.id, currentLesson.id)

    const updated = [...lessons]
    updated[currentIdx].is_completed = true
    setLessons(updated)

    setNotice(`Đã hoàn thành bài học: "${currentLesson.title}"!`)
    setTimeout(() => setNotice(null), 3000)
  }

  const handleAskAI = (e: React.FormEvent) => {
    e.preventDefault()
    if (!aiQuestion.trim()) return

    const question = aiQuestion.trim()
    setChatMessages((prev) => [...prev, { sender: 'user', text: question }])
    setAiQuestion('')
    setAiTyping(true)

    setTimeout(() => {
      setAiTyping(false)
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: `Giải đáp cho câu hỏi "${question}":\nĐối với nội dung "${currentLesson?.title || 'bài học'}", bạn cần nhớ công thức đỉnh của Parabol là I(-b/2a; -Δ/4a). Chiều biến thiên phụ thuộc vào dấu của hệ số a (a > 0 bề lõm quay lên, a < 0 bề lõm quay xuống). Hãy thử áp dụng làm bài kiểm tra để củng cố nhé!`,
        },
      ])
    }, 1000)
  }

  if (loading) {
    return (
      <div className="page-content flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-10 h-10 border-4 border-[#6857DF]/20 border-t-[#6857DF] rounded-full animate-spin" />
        <p className="text-sm text-[#777a91]">Đang mở phòng học bài giảng...</p>
      </div>
    )
  }

  return (
    <div className="page-content space-y-6">
      {/* Top back navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate('/student/courses')}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#777a91] hover:text-[#6857DF] transition"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách khóa học
        </button>

        <button
          onClick={() => navigate('/student/quiz/q-1')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-[#6857DF] text-white text-xs font-bold rounded-xl shadow-md transition"
        >
          <ClipboardCheck className="w-4 h-4" /> Làm bài kiểm tra của khóa học
        </button>
      </div>

      {notice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
          <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Main Room Layout: Player + Lessons List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Video Player & Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Player Box */}
          <div className="bg-black rounded-3xl overflow-hidden aspect-video relative flex items-center justify-center shadow-lg">
            {currentLesson?.video_url ? (
              <iframe
                title={currentLesson.title}
                src={currentLesson.video_url}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="text-center text-white p-6">
                <Play className="w-16 h-16 mx-auto mb-3 text-purple-400 opacity-80" />
                <p className="text-sm font-semibold">Video bài giảng đang được tải lên</p>
              </div>
            )}
          </div>

          {/* Lesson Details Card */}
          <div className="bg-white rounded-3xl border border-[#eceef4] p-6 md:p-8 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#eceef4]">
              <div>
                <span className="text-[11px] font-bold text-[#6857DF] bg-[#F0EDFF] px-2.5 py-0.5 rounded-full">
                  Bài {currentIdx + 1} / {lessons.length}
                </span>
                <h1 className="text-xl md:text-2xl font-black text-[#252641] mt-2">
                  {currentLesson?.title}
                </h1>
                <div className="flex items-center gap-3 text-xs text-[#777a91] mt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-purple-600" /> {currentLesson?.duration_minutes} phút
                  </span>
                  <span>• Giảng viên: Cô Nguyễn Minh Anh</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleMarkComplete}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm ${
                    currentLesson?.is_completed
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-[#6857DF] hover:bg-[#5144BE] text-white shadow-[#6857DF]/25'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  {currentLesson?.is_completed ? 'Đã hoàn thành' : 'Đánh dấu đã học xong'}
                </button>
              </div>
            </div>

            {/* Lesson Body Content */}
            <div className="prose prose-purple max-w-none text-sm text-[#303147] leading-relaxed whitespace-pre-line">
              {currentLesson?.content}
            </div>

            {/* Prev / Next navigation */}
            <div className="flex items-center justify-between pt-6 border-t border-[#eceef4]">
              <button
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((i) => i - 1)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border border-[#eceef4] hover:bg-gray-100 disabled:opacity-40 transition"
              >
                <ArrowLeft className="w-4 h-4" /> Bài trước
              </button>

              <button
                disabled={currentIdx === lessons.length - 1}
                onClick={() => setCurrentIdx((i) => i + 1)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#6857DF] text-white hover:bg-[#5144BE] disabled:opacity-40 transition shadow-sm"
              >
                Bài tiếp theo <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Lessons playlist & AI Chat */}
        <div className="space-y-6">
          {/* Playlist */}
          <div className="bg-white rounded-3xl border border-[#eceef4] p-5 shadow-sm">
            <h2 className="text-base font-bold text-[#252641] mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#6857DF]" /> Danh sách bài học
            </h2>

            <div className="space-y-2">
              {lessons.map((lesson, idx) => {
                const isSelected = idx === currentIdx

                return (
                  <button
                    key={lesson.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`w-full p-3 rounded-2xl border text-left transition flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-[#6857DF] bg-[#F0EDFF] text-[#6857DF]'
                        : 'border-[#eceef4] hover:bg-[#f7f8fc] text-[#252641]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div
                        className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center flex-shrink-0 ${
                          lesson.is_completed
                            ? 'bg-emerald-100 text-emerald-700'
                            : isSelected
                            ? 'bg-[#6857DF] text-white'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {lesson.is_completed ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                      </div>
                      <span className="text-xs font-bold truncate">{lesson.title}</span>
                    </div>

                    <span className="text-[10px] text-gray-400 whitespace-nowrap">
                      {lesson.duration_minutes}p
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* AI Tutor Chat Widget */}
          <div className="bg-white rounded-3xl border border-[#eceef4] p-5 shadow-sm flex flex-col h-[400px]">
            <div className="flex items-center gap-2 pb-3 border-b border-[#eceef4]">
              <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#252641]">Trợ lý AI phòng học</h3>
                <p className="text-[10px] text-gray-400">Giải đáp bài giảng thời gian thực</p>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3 text-xs">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-2xl ${
                    msg.sender === 'user'
                      ? 'bg-[#6857DF] text-white ml-6 rounded-br-none'
                      : 'bg-[#f7f8fc] text-[#252641] mr-6 rounded-bl-none border border-[#eceef4]'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-line">{msg.text}</p>
                </div>
              ))}
              {aiTyping && (
                <div className="p-2 text-xs text-gray-400 italic flex items-center gap-1.5">
                  <div className="w-3 h-3 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
                  Trợ lý EduAI đang suy nghĩ...
                </div>
              )}
            </div>

            {/* Input Chat */}
            <form onSubmit={handleAskAI} className="pt-2 border-t border-[#eceef4] flex gap-2">
              <input
                type="text"
                placeholder="Hỏi về bài học này..."
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                className="flex-1 px-3 py-2 bg-[#f7f8fc] border border-[#eceef4] rounded-xl text-xs focus:outline-none focus:border-[#6857DF]"
              />
              <button
                type="submit"
                className="p-2 bg-[#6857DF] hover:bg-[#5144BE] text-white rounded-xl transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
