import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Clock,
  Award,
  CheckCircle,
  XCircle,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  BookOpen,
} from 'lucide-react'
import { studentService, type QuizDetailItem, type QuizResultItem } from '../../services/studentService'
import { useAuth } from '../../hooks/useAuth'

export function StudentQuizPage() {
  const { quizId } = useParams<{ quizId: string }>()
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [quiz, setQuiz] = useState<QuizDetailItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({})
  const [secondsRemaining, setSecondsRemaining] = useState(15 * 60)
  const [result, setResult] = useState<QuizResultItem | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    studentService.getQuiz(quizId || 'q-1').then((data) => {
      if (active) {
        setQuiz(data)
        setSecondsRemaining(data.time_limit_minutes * 60)
        setLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [quizId])

  const handleSubmit = useCallback(async () => {
    if (!quiz || !profile?.id) return
    setSubmitting(true)
    const res = await studentService.submitQuizAttempt(quiz.id, profile.id, selectedAnswers)
    setResult(res)
    setSubmitting(false)
  }, [quiz, profile, selectedAnswers])

  // Timer countdown
  useEffect(() => {
    if (result) return
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          void handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [result, handleSubmit])

  const handleSelectOption = (qIdx: number, optIdx: number) => {
    if (result) return
    setSelectedAnswers({
      ...selectedAnswers,
      [qIdx]: optIdx,
    })
  }

  const handleRetake = () => {
    setSelectedAnswers({})
    setCurrentIdx(0)
    setResult(null)
    setSecondsRemaining((quiz?.time_limit_minutes || 15) * 60)
  }

  const minutes = Math.floor(secondsRemaining / 60)
  const seconds = secondsRemaining % 60
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  if (loading || !quiz) {
    return (
      <div className="page-content flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-10 h-10 border-4 border-[#6857DF]/20 border-t-[#6857DF] rounded-full animate-spin" />
        <p className="text-sm text-[#777a91]">Đang tải đề thi bài kiểm tra...</p>
      </div>
    )
  }

  const currentQ = quiz.questions[currentIdx]

  return (
    <div className="page-content space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate('/student/courses')}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#777a91] hover:text-[#6857DF] transition"
        >
          <ArrowLeft className="w-4 h-4" /> Thoát bài kiểm tra
        </button>

        {!result && (
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-[#eceef4] shadow-sm text-xs font-bold text-[#6857DF]">
            <Clock className="w-4 h-4 text-purple-600 animate-pulse" />
            <span>Thời gian còn lại: <strong>{formattedTime}</strong></span>
          </div>
        )}
      </div>

      {/* Result view if submitted */}
      {result ? (
        <div className="bg-white rounded-3xl border border-[#eceef4] p-8 shadow-sm text-center space-y-6">
          <div
            className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center text-white font-black text-2xl shadow-xl ${
              result.isPassed
                ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/20'
                : 'bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-500/20'
            }`}
          >
            <Award className="w-10 h-10" />
          </div>

          <div>
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 ${
                result.isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {result.isPassed ? 'ĐẠT CHUẨN ĐẦU RA' : 'CHƯA ĐẠT MỨC CHUẨN'}
            </span>
            <h1 className="text-3xl font-black text-[#252641]">
              Kết quả: {result.score} / 100 điểm
            </h1>
            <p className="text-sm text-[#777a91] mt-1">
              Bạn trả lời đúng <strong>{result.correctCount}</strong> / {result.totalQuestions} câu hỏi.
            </p>
          </div>

          {/* Detailed Question Review */}
          <div className="text-left space-y-4 pt-6 border-t border-[#eceef4]">
            <h2 className="text-base font-bold text-[#252641]">Giải thích chi tiết bài làm:</h2>
            {quiz.questions.map((q, idx) => {
              const userChoice = selectedAnswers[idx]
              const isCorrect = userChoice === q.answer_key

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-2xl border ${
                    isCorrect ? 'border-emerald-200 bg-emerald-50/40' : 'border-red-200 bg-red-50/40'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h3 className="text-xs font-bold text-[#252641]">
                        Câu {idx + 1}: {q.prompt}
                      </h3>
                      <p className="text-xs text-[#777a91] mt-1">
                        Đáp án bạn chọn: <strong>{userChoice !== undefined ? q.options[userChoice] : 'Chưa trả lời'}</strong>
                      </p>
                      {!isCorrect && (
                        <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                          Đáp án đúng: <strong>{q.options[q.answer_key ?? 0]}</strong>
                        </p>
                      )}
                      {q.explanation && (
                        <p className="text-[11px] text-gray-500 mt-2 bg-white/70 p-2.5 rounded-xl border border-gray-200">
                          💡 <em>Giải thích:</em> {q.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex justify-center gap-4 pt-4">
            <button
              onClick={handleRetake}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-[#eceef4] hover:bg-gray-100 text-xs font-bold transition"
            >
              <RotateCcw className="w-4 h-4" /> Làm lại bài kiểm tra
            </button>
            <button
              onClick={() => navigate('/student/learn/tc-1')}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#6857DF] hover:bg-[#5144BE] text-white text-xs font-bold transition shadow-md shadow-[#6857DF]/25"
            >
              <BookOpen className="w-4 h-4" /> Trở về phòng học
            </button>
          </div>
        </div>
      ) : (
        /* Question Answering View */
        <div className="bg-white rounded-3xl border border-[#eceef4] p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#eceef4]">
            <div>
              <span className="text-[10px] font-bold text-[#6857DF] uppercase bg-purple-50 px-2.5 py-1 rounded-full">
                {quiz.course_title}
              </span>
              <h1 className="text-lg md:text-xl font-black text-[#252641] mt-1">{quiz.title}</h1>
            </div>
            <span className="text-xs font-bold text-[#777a91]">
              Câu {currentIdx + 1} / {quiz.questions.length}
            </span>
          </div>

          {/* Question Prompt */}
          <div className="py-2">
            <h2 className="text-base md:text-lg font-bold text-[#252641] leading-relaxed">
              {currentQ.prompt}
            </h2>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQ.options.map((opt, optIdx) => {
              const isSelected = selectedAnswers[currentIdx] === optIdx
              const optLabel = ['A', 'B', 'C', 'D'][optIdx]

              return (
                <button
                  key={optIdx}
                  onClick={() => handleSelectOption(currentIdx, optIdx)}
                  className={`w-full p-4 rounded-2xl border text-left transition flex items-center gap-4 ${
                    isSelected
                      ? 'border-[#6857DF] bg-[#F0EDFF] text-[#6857DF] shadow-sm'
                      : 'border-[#eceef4] hover:bg-[#f7f8fc] text-[#252641]'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                      isSelected
                        ? 'bg-[#6857DF] text-white'
                        : 'bg-[#f7f8fc] text-gray-500 border border-[#eceef4]'
                    }`}
                  >
                    {optLabel}
                  </div>
                  <span className="text-sm font-semibold">{opt}</span>
                </button>
              )
            })}
          </div>

          {/* Question Map Pills */}
          <div className="pt-4 border-t border-[#eceef4]">
            <span className="text-[11px] font-bold text-[#777a91] uppercase tracking-wider block mb-2">
              Bản đồ câu hỏi
            </span>
            <div className="flex flex-wrap gap-2">
              {quiz.questions.map((_, idx) => {
                const isAnswered = selectedAnswers[idx] !== undefined
                const isCurrent = idx === currentIdx

                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentIdx(idx)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition ${
                      isCurrent
                        ? 'ring-2 ring-[#6857DF] bg-[#6857DF] text-white'
                        : isAnswered
                        ? 'bg-purple-100 text-[#6857DF]'
                        : 'bg-[#f7f8fc] text-gray-500 border border-[#eceef4]'
                    }`}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-[#eceef4]">
            <button
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((i) => i - 1)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-[#eceef4] hover:bg-gray-100 disabled:opacity-40 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Câu trước
            </button>

            {currentIdx === quiz.questions.length - 1 ? (
              <button
                disabled={submitting}
                onClick={handleSubmit}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-xs font-bold transition shadow-md shadow-emerald-500/25"
              >
                <CheckCircle className="w-4 h-4" />
                {submitting ? 'Đang chấm điểm...' : 'Nộp bài thi'}
              </button>
            ) : (
              <button
                onClick={() => setCurrentIdx((i) => i + 1)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6857DF] hover:bg-[#5144BE] text-white text-xs font-bold transition shadow-md shadow-[#6857DF]/25"
              >
                Câu tiếp theo <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
