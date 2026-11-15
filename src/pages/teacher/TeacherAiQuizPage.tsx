import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  CheckCircle,
  Trash2,
  Check,
  FileText,
} from 'lucide-react'
import { aiService, type AIQuizQuestion } from '../../services/aiService'
import { teacherService } from '../../services/teacherService'

export function TeacherAiQuizPage() {
  const navigate = useNavigate()

  // Form states
  const [courseTitle, setCourseTitle] = useState('Toán học tư duy bậc THPT')
  const [quizTitle, setQuizTitle] = useState('Kiểm tra AI: Hàm số bậc hai & Parabol')
  const [lessonContent, setLessonContent] = useState(`Nội dung bài học: Hàm số bậc hai y = ax² + bx + c (a ≠ 0).
Tập xác định D = R.
Đỉnh I(-b/2a; -Δ/4a). Trục đối xứng x = -b/2a.
Bề lõm quay lên khi a > 0, bề lõm quay xuống khi a < 0.
Hàm số nghịch biến trên (-∞; -b/2a) và đồng biến trên (-b/2a; +∞) khi a > 0.
Ứng dụng trong vật lý để tính quỹ đạo chuyển động ném xiên và bài toán cực trị diện tích parabol.`)
  const [questionsCount, setQuestionsCount] = useState(3)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')

  const [generating, setGenerating] = useState(false)
  const [generatedQuestions, setGeneratedQuestions] = useState<AIQuizQuestion[]>([])
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault()
    if (!lessonContent.trim()) {
      alert('Vui lòng dán nội dung tài liệu bài giảng')
      return
    }

    setGenerating(true)
    const questions = await aiService.generateQuiz({
      content: lessonContent,
      courseTitle,
      questionsCount,
      difficulty,
    })
    setGeneratedQuestions(questions)
    setGenerating(false)
    setNotice(`AI đã sinh thành công ${questions.length} câu hỏi bản nháp! Hãy kiểm duyệt và chỉnh sửa trước khi xuất bản.`)
    setTimeout(() => setNotice(null), 4000)
  }

  const handleUpdateQuestion = <K extends keyof AIQuizQuestion>(
    idx: number,
    field: K,
    value: AIQuizQuestion[K]
  ) => {
    const updated = [...generatedQuestions]
    updated[idx] = { ...updated[idx], [field]: value }
    setGeneratedQuestions(updated)
  }

  const handleUpdateOption = (qIdx: number, optIdx: number, val: string) => {
    const updated = [...generatedQuestions]
    const opts = [...updated[qIdx].options] as [string, string, string, string]
    opts[optIdx] = val
    updated[qIdx].options = opts
    setGeneratedQuestions(updated)
  }

  const handleDeleteQuestion = (idx: number) => {
    setGeneratedQuestions(generatedQuestions.filter((_, i) => i !== idx))
  }

  const handlePublish = async (status: 'draft' | 'published') => {
    if (generatedQuestions.length === 0) return

    setSaving(true)
    try {
      await teacherService.createQuiz({
        course_id: 'tc-1',
        courseTitle,
        title: quizTitle,
        timeLimit: 15,
        passScore: 60,
        questionsCount: generatedQuestions.length,
      })

      setNotice(
        status === 'published'
          ? `Đã xuất bản bài kiểm tra "${quizTitle}" thành công!`
          : `Đã lưu bản nháp bài kiểm tra "${quizTitle}" thành công!`
      )
      setTimeout(() => {
        navigate('/teacher/quizzes')
      }, 1500)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-pink-100 text-pink-700 mb-1">
            <Sparkles className="w-3.5 h-3.5" /> AI Quiz Generator 2.0
          </div>
          <h1 className="text-2xl font-bold text-[#252641]">Sinh bản nháp Quiz bằng AI</h1>
          <p className="text-sm text-[#777a91]">
            Chuyển đổi tài liệu bài giảng thành bộ câu hỏi trắc nghiệm tự động kèm đáp án và giải thích
          </p>
        </div>
      </div>

      {notice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
          <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Input Configuration Box */}
      <form onSubmit={handleGenerate} className="bg-white rounded-3xl border border-[#eceef4] p-6 md:p-8 shadow-sm space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-[#eceef4]">
          <FileText className="w-5 h-5 text-[#6857DF]" />
          <h2 className="text-base font-bold text-[#252641]">1. Cấu hình & Dữ liệu nguồn bài giảng</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#777a91] uppercase tracking-wider mb-1.5">
              Khóa học áp dụng
            </label>
            <select
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#f7f8fc] border border-[#eceef4] rounded-xl text-xs focus:outline-none focus:border-[#6857DF]"
            >
              <option value="Toán học tư duy bậc THPT">Toán học tư duy bậc THPT</option>
              <option value="Khám phá thế giới khoa học & tự nhiên">Khám phá thế giới khoa học & tự nhiên</option>
              <option value="Tiếng Anh giao tiếp & ngữ pháp">Tiếng Anh giao tiếp & ngữ pháp</option>
              <option value="Lập trình tư duy logic với AI">Lập trình tư duy logic với AI</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#777a91] uppercase tracking-wider mb-1.5">
              Tiêu đề bài kiểm tra
            </label>
            <input
              type="text"
              required
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#f7f8fc] border border-[#eceef4] rounded-xl text-xs focus:outline-none focus:border-[#6857DF]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#777a91] uppercase tracking-wider mb-1.5">
                Số câu hỏi cần sinh
              </label>
              <select
                value={questionsCount}
                onChange={(e) => setQuestionsCount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#f7f8fc] border border-[#eceef4] rounded-xl text-xs focus:outline-none focus:border-[#6857DF]"
              >
                <option value={3}>03 câu (Nhanh)</option>
                <option value={5}>05 câu (Chuẩn)</option>
                <option value={10}>10 câu (Đầy đủ)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#777a91] uppercase tracking-wider mb-1.5">
                Mức độ tư duy
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                className="w-full px-3 py-2 bg-[#f7f8fc] border border-[#eceef4] rounded-xl text-xs focus:outline-none focus:border-[#6857DF]"
              >
                <option value="easy">Dễ (Nhận biết)</option>
                <option value="medium">Trung bình (Thông hiểu)</option>
                <option value="hard">Nâng cao (Vận dụng)</option>
              </select>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-[#777a91] uppercase tracking-wider mb-1.5">
              Nội dung tài liệu / Giáo án văn bản (Prompt nguồn để AI phân tích)
            </label>
            <textarea
              rows={5}
              required
              value={lessonContent}
              onChange={(e) => setLessonContent(e.target.value)}
              placeholder="Dán nội dung bài học, định nghĩa, định lý hoặc bài tập vào đây..."
              className="w-full px-3.5 py-2.5 bg-[#f7f8fc] border border-[#eceef4] rounded-xl text-xs leading-relaxed focus:outline-none focus:border-[#6857DF]"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={generating}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#6857DF] via-[#7966f2] to-[#5144BE] hover:from-[#5144BE] hover:to-[#413694] text-white text-xs font-bold transition shadow-md shadow-[#6857DF]/30 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {generating ? 'AI đang phân tích & sinh câu hỏi...' : 'Sinh bản nháp bằng AI ngay'}
          </button>
        </div>
      </form>

      {/* Review & Edit generated questions (Human-in-the-loop) */}
      {generatedQuestions.length > 0 && (
        <div className="bg-white rounded-3xl border border-[#eceef4] p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#eceef4]">
            <div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full uppercase">
                Bản nháp AI đã sinh ({generatedQuestions.length} câu)
              </span>
              <h2 className="text-lg font-bold text-[#252641] mt-1">2. Kiểm duyệt & Chỉnh sửa câu hỏi</h2>
              <p className="text-xs text-[#777a91]">
                Bạn có thể sửa trực tiếp nội dung câu hỏi, đổi đáp án đúng và điều chỉnh lời giải thích trước khi xuất bản
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => handlePublish('draft')}
                className="px-4 py-2 border border-[#eceef4] hover:bg-gray-100 rounded-xl text-xs font-semibold text-[#252641] transition"
              >
                Lưu bản nháp
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => handlePublish('published')}
                className="flex items-center gap-2 px-5 py-2 bg-[#6857DF] hover:bg-[#5144BE] text-white rounded-xl text-xs font-bold transition shadow-md shadow-[#6857DF]/25"
              >
                <CheckCircle className="w-4 h-4" /> Xuất bản bài kiểm tra
              </button>
            </div>
          </div>

          {/* List Questions Cards */}
          <div className="space-y-6">
            {generatedQuestions.map((q, idx) => (
              <div
                key={q.id}
                className="p-5 rounded-2xl border border-[#eceef4] bg-[#f7f8fc]/40 hover:bg-white transition space-y-4 shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-purple-100 text-[#6857DF]">
                    Câu hỏi {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(idx)}
                    className="p-1 text-gray-400 hover:text-red-600 transition"
                    title="Xóa câu hỏi này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#777a91] mb-1">
                    Nội dung câu hỏi:
                  </label>
                  <textarea
                    rows={2}
                    value={q.prompt}
                    onChange={(e) => handleUpdateQuestion(idx, 'prompt', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#eceef4] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#6857DF]"
                  />
                </div>

                {/* 4 Options Grid */}
                <div>
                  <label className="block text-[11px] font-bold text-[#777a91] mb-1.5">
                    Các phương án trả lời (Tick vào nút tròn để chọn đáp án đúng):
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {q.options.map((opt, optIdx) => {
                      const isCorrect = q.answer_key === optIdx
                      const label = ['A', 'B', 'C', 'D'][optIdx]

                      return (
                        <div
                          key={optIdx}
                          className={`flex items-center gap-2 p-2 rounded-xl border bg-white ${
                            isCorrect ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-[#eceef4]'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleUpdateQuestion(idx, 'answer_key', optIdx)}
                            className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center flex-shrink-0 ${
                              isCorrect ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-purple-100'
                            }`}
                            title="Chọn làm đáp án đúng"
                          >
                            {label}
                          </button>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleUpdateOption(idx, optIdx, e.target.value)}
                            className="flex-1 text-xs bg-transparent focus:outline-none"
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Explanation */}
                <div>
                  <label className="block text-[11px] font-bold text-[#777a91] mb-1">
                    Giải thích đáp án:
                  </label>
                  <input
                    type="text"
                    value={q.explanation}
                    onChange={(e) => handleUpdateQuestion(idx, 'explanation', e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#eceef4] rounded-xl text-xs text-gray-600 focus:outline-none focus:border-[#6857DF]"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-[#eceef4]">
            <span className="text-xs text-[#777a91] flex items-center gap-1">
              <Check className="w-4 h-4 text-emerald-600" /> Tất cả {generatedQuestions.length} câu hỏi đã được kiểm duyệt
            </span>
            <button
              type="button"
              disabled={saving}
              onClick={() => handlePublish('published')}
              className="px-6 py-2.5 bg-[#6857DF] hover:bg-[#5144BE] text-white rounded-xl text-xs font-bold transition shadow-md shadow-[#6857DF]/25"
            >
              Xuất bản bài kiểm tra
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
