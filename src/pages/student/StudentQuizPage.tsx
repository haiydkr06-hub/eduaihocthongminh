import { useEffect, useState, useCallback, useRef } from 'react'
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
import { getFriendlyErrorMessage } from '../../lib/errorMessage'

/** Phiên làm bài được giữ trong sessionStorage: tải lại trang không mất bài và không reset đồng hồ. */
interface AttemptSession {
  attemptId: string
  deadline: number
  answers: Record<string, number>
}

const sessionKey = (quizId: string, userId: string) => `eduai_quiz_session:${userId}:${quizId}`

function loadSession(quizId: string, userId: string): AttemptSession | null {
  try {
    const raw = sessionStorage.getItem(sessionKey(quizId, userId))
    return raw ? (JSON.parse(raw) as AttemptSession) : null
  } catch {
    return null
  }
}

function newSession(quiz: QuizDetailItem): AttemptSession {
  return { attemptId: crypto.randomUUID(), deadline: Date.now() + quiz.time_limit_minutes * 60_000, answers: {} }
}

export function StudentQuizPage() {
  const { quizId } = useParams<{ quizId: string }>()
  const { profile } = useAuth()
  const profileId = profile?.id
  const navigate = useNavigate()

  const [quiz, setQuiz] = useState<QuizDetailItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [session, setSession] = useState<AttemptSession | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [result, setResult] = useState<QuizResultItem | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  // Khóa chống nộp trùng (bấm "Nộp" đúng lúc hết giờ, bấm 2 lần...)
  const submittingRef = useRef(false)
  const sessionRef = useRef<AttemptSession | null>(null)
  useEffect(() => {
    sessionRef.current = session
    if (session && quiz && profile?.id) {
      sessionStorage.setItem(sessionKey(quiz.id, profile.id), JSON.stringify(session))
    }
  }, [session, quiz, profile?.id])

  useEffect(() => {
    if (!quizId || !profile?.id) return
    let active = true
    studentService
      .getQuiz(quizId, profile.id)
      .then((data) => {
        if (!active) return
        setQuiz(data)
        const saved = loadSession(data.id, profile.id)
        setSession(saved ?? newSession(data))
      })
      .catch((err) => {
        if (active) setLoadError(getFriendlyErrorMessage(err, 'Không thể tải bài kiểm tra.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [quizId, profile?.id])

  const handleSubmit = useCallback(async () => {
    const current = sessionRef.current
    if (!quiz || !profileId || !current || submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    setSubmitError(null)
    setConfirmOpen(false)
    try {
      // Cùng attemptId -> nếu gửi lại do lỗi mạng, server trả kết quả cũ chứ không tạo bản ghi trùng
      const res = await studentService.submitQuizAttempt(quiz.id, profileId, current.answers, current.attemptId)
      setResult(res)
      sessionStorage.removeItem(sessionKey(quiz.id, profileId))
    } catch (err) {
      setSubmitError(getFriendlyErrorMessage(err, 'Nộp bài không thành công. Bài làm vẫn được giữ — hãy thử lại.'))
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }, [quiz, profileId])

  // Đồng hồ: tính từ mốc hết giờ tuyệt đối (không bị trôi khi tab chạy nền)
  const secondsRemaining = session ? Math.max(0, Math.ceil((session.deadline - now) / 1000)) : 0
  const timeUp = !!session && secondsRemaining === 0

  useEffect(() => {
    if (result || !session) return
    const timer = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(timer)
  }, [result, session])

  // Hết giờ -> tự nộp đúng một lần (side effect nằm trong effect, không nằm trong setState)
  useEffect(() => {
    if (timeUp && !result && !submitError) void handleSubmit()
  }, [timeUp, result, submitError, handleSubmit])

  const handleSelectOption = (questionId: string, optIdx: number) => {
    if (result || timeUp) return
    setSession((prev) => (prev ? { ...prev, answers: { ...prev.answers, [questionId]: optIdx } } : prev))
  }

  const handleRetake = () => {
    if (!quiz) return
    setCurrentIdx(0)
    setResult(null)
    setSubmitError(null)
    setNow(Date.now())
    setSession(newSession(quiz))
  }

  const requestSubmit = () => {
    if (!quiz || !session) return
    const answered = Object.keys(session.answers).length
    if (answered < quiz.questions.length) setConfirmOpen(true)
    else void handleSubmit()
  }

  const minutes = Math.floor(secondsRemaining / 60)
  const seconds = secondsRemaining % 60
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  const backToCourse = () => navigate(quiz ? `/student/learning/${quiz.course_id}` : '/student/courses')

  if (loading) {
    return (
      <div className="page-content flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-10 h-10 border-4 border-[#6857DF]/20 border-t-[#6857DF] rounded-full animate-spin" />
        <p className="text-sm text-[#777a91]">Đang tải đề thi bài kiểm tra...</p>
      </div>
    )
  }

  if (loadError || !quiz || !session || quiz.questions.length === 0) {
    return (
      <div className="page-content max-w-xl mx-auto py-16 text-center space-y-4" role="alert">
        <div className="text-4xl" aria-hidden="true">📝</div>
        <p className="text-sm text-[#252641] font-semibold">{loadError || 'Bài kiểm tra này chưa có câu hỏi.'}</p>
        <button
          onClick={() => navigate('/student/courses')}
          className="px-5 py-2.5 rounded-xl bg-[#6857DF] text-white text-xs font-bold hover:bg-[#5144BE]"
        >
          Về danh sách khóa học
        </button>
      </div>
    )
  }

  const currentQ = quiz.questions[currentIdx]
  const answeredCount = Object.keys(session.answers).length
  const reviewById = new Map((result?.review ?? []).map((r) => [r.id, r]))

  return (
    <div className="page-content space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={backToCourse}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#777a91] hover:text-[#6857DF] transition"
        >
          <ArrowLeft className="w-4 h-4" /> Thoát bài kiểm tra
        </button>

        {!result && (
          <div
            className={`flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border shadow-sm text-xs font-bold ${
              secondsRemaining <= 60 ? 'border-red-200 text-red-600' : 'border-[#eceef4] text-[#6857DF]'
            }`}
            role="timer"
            aria-live={secondsRemaining <= 60 ? 'assertive' : 'off'}
          >
            <Clock className="w-4 h-4" />
            <span>Thời gian còn lại: <strong>{formattedTime}</strong></span>
          </div>
        )}
      </div>

      {submitError && (
        <div role="alert" className="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100 flex items-center justify-between gap-3">
          <span>{submitError}</span>
          <button onClick={() => void handleSubmit()} className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold">
            Thử nộp lại
          </button>
        </div>
      )}

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
              Kết quả: {Math.round(result.score * 10) / 10} / 100 điểm
            </h1>
            <p className="text-sm text-[#777a91] mt-1">
              Bạn trả lời đúng <strong>{result.correctCount}</strong> / {result.totalQuestions} câu hỏi (cần {quiz.pass_score} điểm để đạt).
            </p>
          </div>

          {/* Detailed Question Review — dùng đáp án do server trả về sau khi nộp */}
          <div className="text-left space-y-4 pt-6 border-t border-[#eceef4]">
            <h2 className="text-base font-bold text-[#252641]">Giải thích chi tiết bài làm:</h2>
            {quiz.questions.map((q, idx) => {
              const review = reviewById.get(q.id)
              const userChoice = review?.selected ?? session.answers[q.id]
              const isCorrect = review !== undefined && userChoice === review.answer_key

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-2xl border ${
                    isCorrect ? 'border-emerald-200 bg-emerald-50/40' : 'border-red-200 bg-red-50/40'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" aria-label="Đúng" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" aria-label="Sai" />
                    )}
                    <div>
                      <h3 className="text-xs font-bold text-[#252641]">
                        Câu {idx + 1}: {q.prompt}
                      </h3>
                      <p className="text-xs text-[#777a91] mt-1">
                        Đáp án bạn chọn: <strong>{userChoice !== undefined && userChoice !== null ? q.options[userChoice] : 'Chưa trả lời'}</strong>
                        {' — '}
                        <strong className={isCorrect ? 'text-emerald-700' : 'text-red-600'}>{isCorrect ? 'Đúng' : 'Sai'}</strong>
                      </p>
                      {!isCorrect && review && (
                        <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                          Đáp án đúng: <strong>{q.options[review.answer_key]}</strong>
                        </p>
                      )}
                      {review?.explanation && (
                        <p className="text-[11px] text-gray-500 mt-2 bg-white/70 p-2.5 rounded-xl border border-gray-200">
                          💡 <em>Giải thích:</em> {review.explanation}
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
              onClick={backToCourse}
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
            <h2 className="text-base md:text-lg font-bold text-[#252641] leading-relaxed" id={`q-${currentQ.id}`}>
              {currentQ.prompt}
            </h2>
          </div>

          {/* Options */}
          <div className="space-y-3" role="radiogroup" aria-labelledby={`q-${currentQ.id}`}>
            {currentQ.options.map((opt, optIdx) => {
              const isSelected = session.answers[currentQ.id] === optIdx
              const optLabel = String.fromCharCode(65 + optIdx)

              return (
                <button
                  key={optIdx}
                  role="radio"
                  aria-checked={isSelected}
                  disabled={timeUp || submitting}
                  onClick={() => handleSelectOption(currentQ.id, optIdx)}
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
                    {isSelected ? '✓' : optLabel}
                  </div>
                  <span className="text-sm font-semibold">{opt}</span>
                </button>
              )
            })}
          </div>

          {/* Question Map Pills */}
          <div className="pt-4 border-t border-[#eceef4]">
            <span className="text-[11px] font-bold text-[#777a91] uppercase tracking-wider block mb-2">
              Bản đồ câu hỏi — đã trả lời {answeredCount}/{quiz.questions.length}
            </span>
            <div className="flex flex-wrap gap-2">
              {quiz.questions.map((q, idx) => {
                const isAnswered = session.answers[q.id] !== undefined
                const isCurrent = idx === currentIdx

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    aria-label={`Câu ${idx + 1}${isAnswered ? ' (đã trả lời)' : ''}`}
                    aria-current={isCurrent ? 'step' : undefined}
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

          {confirmOpen && (
            <div role="alertdialog" aria-label="Xác nhận nộp bài" className="p-4 rounded-2xl border border-amber-200 bg-amber-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-sm text-amber-900">
                Bạn mới trả lời <strong>{answeredCount}/{quiz.questions.length}</strong> câu. Các câu bỏ trống sẽ bị tính sai. Vẫn nộp bài?
              </p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmOpen(false)} className="px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold text-amber-900">
                  Quay lại làm tiếp
                </button>
                <button onClick={() => void handleSubmit()} className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold">
                  Nộp bài
                </button>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-[#eceef4]">
            <button
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((i) => i - 1)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-[#eceef4] hover:bg-gray-100 disabled:opacity-40 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Câu trước
            </button>

            <div className="flex items-center gap-2">
              {currentIdx < quiz.questions.length - 1 && (
                <button
                  onClick={() => setCurrentIdx((i) => i + 1)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6857DF] hover:bg-[#5144BE] text-white text-xs font-bold transition shadow-md shadow-[#6857DF]/25"
                >
                  Câu tiếp theo <ArrowRight className="w-4 h-4" />
                </button>
              )}
              <button
                disabled={submitting}
                onClick={requestSubmit}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-xs font-bold transition shadow-md shadow-emerald-500/25 disabled:opacity-60"
              >
                <CheckCircle className="w-4 h-4" />
                {submitting ? 'Đang chấm điểm...' : 'Nộp bài thi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
