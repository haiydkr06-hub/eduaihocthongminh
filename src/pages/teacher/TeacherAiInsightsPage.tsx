import { useEffect, useMemo, useState } from 'react'
import { BrainCircuit, AlertTriangle, Sparkles, Send, HelpCircle, Users, Check } from 'lucide-react'
import { teacherService, type QuestionInsight, type StudentInClass } from '../../services/teacherService'
import { notificationService } from '../../services/notificationService'
import {
  analyzeQuestion,
  difficultyOf,
  draftRiskMessage,
  rankAtRisk,
  topDistractor,
  type RiskAssessment,
} from '../../services/teacherAiService'
import { ENGINE_LABEL, currentEngine, type AIResult } from '../../services/aiEngine'
import { MarkdownContent } from '../../components/MarkdownContent'
import { useTeacherScope } from '../../hooks/useTeacherScope'
import { getFriendlyErrorMessage } from '../../lib/errorMessage'

type Tab = 'questions' | 'risk'

const LEVEL_STYLE: Record<RiskAssessment['level'], string> = {
  Cao: 'bg-red-100 text-red-700 border-red-200',
  'Trung bình': 'bg-amber-100 text-amber-800 border-amber-200',
  Thấp: 'bg-emerald-100 text-emerald-700 border-emerald-200',
}

function EngineBadge({ result }: { result: AIResult }) {
  return (
    <span className="text-[10px] font-semibold text-[#6857DF] bg-[#F0EDFF] px-2 py-0.5 rounded-full">
      ✨ {ENGINE_LABEL[result.engine]} · bản nháp
    </span>
  )
}

export function TeacherAiInsightsPage() {
  const scope = useTeacherScope()
  const [tab, setTab] = useState<Tab>('questions')
  const [questions, setQuestions] = useState<QuestionInsight[]>([])
  const [students, setStudents] = useState<StudentInClass[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [now] = useState(() => Date.now())

  // Kết quả AI theo id (câu hỏi / học viên)
  const [insights, setInsights] = useState<Record<string, AIResult>>({})
  const [drafts, setDrafts] = useState<Record<string, AIResult & { edited: string }>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [riskFilter, setRiskFilter] = useState<'all' | 'Cao' | 'Trung bình'>('all')

  useEffect(() => {
    if (scope === undefined) return
    let active = true
    Promise.all([teacherService.getQuestionInsights(scope), teacherService.getStudents(scope)])
      .then(([q, s]) => {
        if (!active) return
        setQuestions(q)
        setStudents(s)
      })
      .catch((err) => active && setError(getFriendlyErrorMessage(err, 'Không thể tải dữ liệu phân tích.')))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [scope])

  const hardQuestions = useMemo(() => questions.filter((q) => q.wrongRate >= 30), [questions])
  const risks = useMemo(() => rankAtRisk(students, now), [students, now])
  const visibleRisks = risks.filter((r) =>
    riskFilter === 'all' ? r.level !== 'Thấp' : r.level === riskFilter
  )
  const highCount = risks.filter((r) => r.level === 'Cao').length
  const midCount = risks.filter((r) => r.level === 'Trung bình').length

  const handleAnalyze = async (q: QuestionInsight) => {
    if (busy) return
    setBusy(q.questionId)
    setError(null)
    try {
      const result = await analyzeQuestion(q)
      setInsights((prev) => ({ ...prev, [q.questionId]: result }))
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'AI chưa phân tích được câu hỏi này.'))
    } finally {
      setBusy(null)
    }
  }

  const handleDraft = async (r: RiskAssessment) => {
    if (busy) return
    setBusy(r.row.id)
    setError(null)
    try {
      const result = await draftRiskMessage(r)
      setDrafts((prev) => ({ ...prev, [r.row.id]: { ...result, edited: result.text } }))
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'AI chưa soạn được tin nhắn.'))
    } finally {
      setBusy(null)
    }
  }

  const handleSend = async (r: RiskAssessment) => {
    const draft = drafts[r.row.id]
    if (!draft || busy || !draft.edited.trim()) return
    setBusy(r.row.id)
    setError(null)
    try {
      await notificationService.send({
        userId: r.row.studentId,
        title: `Lời nhắn từ giảng viên — ${r.row.courseName}`,
        message: draft.edited.trim(),
        type: 'warning',
      })
      setDrafts((prev) => {
        const next = { ...prev }
        delete next[r.row.id]
        return next
      })
      setNotice(`Đã gửi lời nhắn tới ${r.row.name}.`)
      setTimeout(() => setNotice(null), 3000)
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Không gửi được lời nhắn.'))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#6857DF] via-[#5f4ce0] to-[#5144BE] rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-[#6857DF]/20">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold mb-3">
          <BrainCircuit className="w-3.5 h-3.5" /> Bộ máy: {ENGINE_LABEL[currentEngine()]}
        </div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2">Trợ lý AI giảng dạy</h1>
        <p className="text-sm text-purple-100 max-w-2xl">
          AI phân tích kết quả bài làm để chỉ ra câu hỏi học viên hay sai, phát hiện học viên có nguy cơ tụt lại và soạn sẵn lời nhắn.
          Mọi nội dung AI tạo là <strong>bản nháp</strong> — thầy/cô xem và chỉnh sửa trước khi dùng.
        </p>
        <div className="grid grid-cols-3 gap-3 mt-5 max-w-xl">
          <div className="bg-white/15 rounded-2xl p-3">
            <p className="text-[11px] text-purple-100">Câu hỏi hay sai (≥30%)</p>
            <p className="text-2xl font-black">{loading ? '…' : hardQuestions.length}</p>
          </div>
          <div className="bg-white/15 rounded-2xl p-3">
            <p className="text-[11px] text-purple-100">Nguy cơ cao</p>
            <p className="text-2xl font-black">{loading ? '…' : highCount}</p>
          </div>
          <div className="bg-white/15 rounded-2xl p-3">
            <p className="text-[11px] text-purple-100">Nguy cơ trung bình</p>
            <p className="text-2xl font-black">{loading ? '…' : midCount}</p>
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">{error}</div>
      )}
      {notice && (
        <div role="status" className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-sm border border-emerald-200 flex items-center gap-2">
          <Check className="w-4 h-4" /> {notice}
        </div>
      )}

      <div className="flex gap-2" role="tablist" aria-label="Chức năng AI">
        {[
          { key: 'questions' as const, label: 'Câu hỏi hay bị sai', icon: HelpCircle },
          { key: 'risk' as const, label: 'Học viên có nguy cơ', icon: Users },
        ].map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              tab === t.key ? 'bg-[#6857DF] text-white shadow-md shadow-[#6857DF]/25' : 'bg-white border border-[#eceef4] text-[#252641] hover:bg-[#F0EDFF]'
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'questions' && (
        <div className="space-y-4">
          {loading ? (
            <p className="text-sm text-[#777a91]">Đang phân tích bài làm…</p>
          ) : questions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#eceef4] p-6 text-sm text-[#777a91]">
              Chưa có bài làm nào để phân tích. Khi học viên nộp quiz, thống kê từng câu hỏi sẽ xuất hiện ở đây.
            </div>
          ) : (
            questions.map((q) => {
              const distractor = topDistractor(q)
              const result = insights[q.questionId]
              const maxCount = Math.max(1, ...q.optionCounts)
              return (
                <article key={q.questionId} className="bg-white rounded-2xl border border-[#eceef4] p-5 shadow-sm space-y-4">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] text-[#777a91]">
                        {q.courseTitle} • {q.quizTitle} • Câu {q.position}
                      </p>
                      <h2 className="text-sm font-bold text-[#252641] mt-1">{q.prompt}</h2>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                          q.wrongRate >= 45 ? 'bg-red-50 text-red-700 border-red-200' : q.wrongRate >= 20 ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {difficultyOf(q)} · sai {q.wrongRate}%
                      </span>
                      <span className="text-[11px] text-[#777a91]">{q.attempts} lượt</span>
                    </div>
                  </div>

                  <div className="space-y-1.5" aria-label="Phân bố lựa chọn">
                    {q.options.map((opt, i) => {
                      const isCorrect = i === q.answerKey
                      const isTopWrong = distractor?.index === i
                      return (
                        <div key={i} className="flex items-center gap-3 text-xs">
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold flex-shrink-0 ${isCorrect ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="w-56 truncate text-[#252641]" title={opt}>
                            {opt}
                            {isCorrect && <span className="text-emerald-700 font-bold"> (đúng)</span>}
                            {isTopWrong && <span className="text-red-600 font-bold"> (hay nhầm)</span>}
                          </span>
                          <div className="flex-1 h-2.5 bg-[#f1f2f7] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${isCorrect ? 'bg-emerald-500' : isTopWrong ? 'bg-red-400' : 'bg-[#b8b0f2]'}`}
                              style={{ width: `${Math.round((q.optionCounts[i] / maxCount) * 100)}%` }}
                            />
                          </div>
                          <span className="w-16 text-right text-[#777a91]">{q.optionCounts[i]} lượt</span>
                        </div>
                      )
                    })}
                    {q.unanswered > 0 && <p className="text-[11px] text-[#777a91] pl-9">Bỏ trống: {q.unanswered} lượt</p>}
                  </div>

                  {result ? (
                    <div className="p-4 rounded-xl bg-[#F7F5FF] border border-[#e4dfff] text-xs text-[#303147] space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#6857DF] flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" /> Phân tích của AI
                        </span>
                        <EngineBadge result={result} />
                      </div>
                      {result.note && <p className="text-[11px] text-amber-700">{result.note}</p>}
                      <MarkdownContent text={result.text} />
                    </div>
                  ) : (
                    <button
                      onClick={() => void handleAnalyze(q)}
                      disabled={busy !== null}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6857DF] hover:bg-[#5144BE] text-white text-xs font-bold disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4" /> {busy === q.questionId ? 'AI đang phân tích…' : 'Phân tích bằng AI'}
                    </button>
                  )}
                </article>
              )
            })
          )}
        </div>
      )}

      {tab === 'risk' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#eceef4] p-4 text-xs text-[#62657a] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <p>
              <strong>Cách tính điểm nguy cơ (0–100):</strong> thời gian không hoạt động (35%), bài học chưa hoàn thành (25%),
              điểm dưới mức đạt hoặc đang giảm (30%), số lần trượt (10%).
            </p>
            <div className="flex gap-1 flex-shrink-0">
              {(['all', 'Cao', 'Trung bình'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setRiskFilter(f)}
                  aria-pressed={riskFilter === f}
                  className={`px-3 py-1.5 rounded-lg font-bold ${riskFilter === f ? 'bg-[#6857DF] text-white' : 'bg-[#f7f8fc] text-[#252641]'}`}
                >
                  {f === 'all' ? 'Cần chú ý' : `Nguy cơ ${f.toLowerCase()}`}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-[#777a91]">Đang đánh giá học viên…</p>
          ) : visibleRisks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#eceef4] p-6 text-sm text-[#777a91]">
              Không có học viên nào ở mức nguy cơ này. 🎉
            </div>
          ) : (
            visibleRisks.map((r) => {
              const draft = drafts[r.row.id]
              return (
                <article key={r.row.id} className="bg-white rounded-2xl border border-[#eceef4] p-5 shadow-sm space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-[#f7f8fc] border border-[#eceef4] flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-base font-black text-[#252641] leading-none">{r.score}</span>
                        <span className="text-[9px] text-[#777a91]">/100</span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-[#252641]">{r.row.name}</h3>
                        <p className="text-[11px] text-[#777a91] truncate">
                          {r.row.courseName} • Tiến độ {r.row.progressPercent}% • Điểm TB {r.row.avgScore ?? '—'}
                        </p>
                      </div>
                    </div>
                    <span className={`self-start md:self-auto text-[11px] font-bold px-2.5 py-1 rounded-full border ${LEVEL_STYLE[r.level]}`}>
                      <AlertTriangle className="w-3 h-3 inline -mt-0.5 mr-1" />
                      Nguy cơ {r.level.toLowerCase()}
                    </span>
                  </div>

                  {r.reasons.length > 0 && (
                    <ul className="flex flex-wrap gap-1.5" aria-label="Dấu hiệu">
                      {r.reasons.map((reason) => (
                        <li key={reason} className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                          {reason}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="text-xs text-[#62657a]"><strong>Đề xuất:</strong> {r.suggestion}</p>

                  {draft ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label htmlFor={`draft-${r.row.id}`} className="text-xs font-bold text-[#252641]">
                          Lời nhắn (có thể chỉnh sửa trước khi gửi)
                        </label>
                        <EngineBadge result={draft} />
                      </div>
                      {draft.note && <p className="text-[11px] text-amber-700">{draft.note}</p>}
                      <textarea
                        id={`draft-${r.row.id}`}
                        rows={4}
                        value={draft.edited}
                        onChange={(e) => {
                          const value = e.target.value
                          setDrafts((prev) => ({ ...prev, [r.row.id]: { ...prev[r.row.id], edited: value } }))
                        }}
                        className="w-full px-3 py-2 bg-[#f7f8fc] border border-[#eceef4] rounded-xl text-xs leading-relaxed focus:outline-none focus:border-[#6857DF]"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() =>
                            setDrafts((prev) => {
                              const next = { ...prev }
                              delete next[r.row.id]
                              return next
                            })
                          }
                          className="px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={() => void handleSend(r)}
                          disabled={busy !== null || !draft.edited.trim()}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6857DF] hover:bg-[#5144BE] text-white text-xs font-bold disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" /> {busy === r.row.id ? 'Đang gửi…' : 'Gửi cho học viên'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => void handleDraft(r)}
                      disabled={busy !== null}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#d9d3ff] bg-[#F0EDFF] text-[#6857DF] hover:bg-[#e4dfff] text-xs font-bold disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4" /> {busy === r.row.id ? 'AI đang soạn…' : 'AI soạn lời nhắn nhắc nhở'}
                    </button>
                  )}
                </article>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
