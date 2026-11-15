import { useEffect, useState } from 'react'
import {
  GraduationCap,
  Clock,
  Award,
  MessageSquare,
  Check,
  Search,
} from 'lucide-react'
import { teacherService, type StudentSubmission } from '../../services/teacherService'
import { suggestFeedback } from '../../services/teacherAiService'
import { ENGINE_LABEL, type AIResult } from '../../services/aiEngine'
import { useAuth } from '../../hooks/useAuth'
import { useTeacherScope } from '../../hooks/useTeacherScope'
import { getFriendlyErrorMessage } from '../../lib/errorMessage'

export function TeacherGradingPage() {
  const { profile } = useAuth()
  const scope = useTeacherScope()
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'graded'>('all')
  const [search, setSearch] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  // Grading modal
  const [gradingSub, setGradingSub] = useState<StudentSubmission | null>(null)
  const [scoreInput, setScoreInput] = useState<number>(0)
  const [feedbackInput, setFeedbackInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [aiBusy, setAiBusy] = useState(false)
  const [aiResult, setAiResult] = useState<AIResult | null>(null)

  useEffect(() => {
    if (scope === undefined) return
    let active = true
    teacherService
      .getSubmissions(scope)
      .then((data) => {
        if (active) setSubmissions(data)
      })
      .catch((err) => {
        if (active) setError(getFriendlyErrorMessage(err, 'Không thể tải danh sách bài nộp.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [scope, reloadKey])

  const handleOpenGradeModal = (sub: StudentSubmission) => {
    setGradingSub(sub)
    // Mặc định là điểm hệ thống đã chấm tự động (trước đây mặc định 80/85 dễ lưu nhầm)
    setScoreInput(Math.round(sub.score ?? 0))
    setFeedbackInput(sub.feedback || '')
    setAiResult(null)
  }

  // AI đọc từng câu đúng/sai của bài làm rồi soạn bản nháp nhận xét; giảng viên sửa trước khi lưu
  const handleSuggestFeedback = async () => {
    if (!gradingSub || aiBusy) return
    setAiBusy(true)
    setError(null)
    try {
      const detail = await teacherService.getSubmissionDetail(gradingSub.id)
      const result = await suggestFeedback({ ...detail, score: scoreInput })
      setFeedbackInput(result.text)
      setAiResult(result)
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'AI chưa gợi ý được nhận xét.'))
    } finally {
      setAiBusy(false)
    }
  }

  const handleSaveGrade = async () => {
    if (!gradingSub || saving || !profile?.id) return
    setSaving(true)
    setError(null)
    try {
      await teacherService.gradeSubmission(gradingSub.id, scoreInput, feedbackInput, profile.id)
      setNotice(`Đã lưu điểm và nhận xét cho bài làm của "${gradingSub.studentName}"!`)
      setGradingSub(null)
      setReloadKey((k) => k + 1)
      setTimeout(() => setNotice(null), 3000)
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Không lưu được điểm. Vui lòng thử lại.'))
    } finally {
      setSaving(false)
    }
  }

  const filtered = submissions.filter((s) => {
    const matchFilter = filter === 'all' || s.status === filter
    const matchSearch =
      !search ||
      s.studentName.toLowerCase().includes(search.toLowerCase()) ||
      s.quizTitle.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#252641]">Chấm điểm & Nhận xét bài làm</h1>
          <p className="text-sm text-[#777a91]">
            Đánh giá bài nộp, ghi nhận điểm số và gửi phản hồi chi tiết tới học viên
          </p>
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

      {/* Filter and Search */}
      <div className="bg-white rounded-2xl border border-[#eceef4] p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {[
            { id: 'all', label: 'Tất cả bài làm' },
            { id: 'pending', label: 'Chờ chấm điểm' },
            { id: 'graded', label: 'Đã hoàn thành chấm' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as 'all' | 'pending' | 'graded')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                filter === tab.id
                  ? 'bg-[#6857DF] text-white shadow-sm shadow-[#6857DF]/25'
                  : 'bg-[#f7f8fc] text-[#777a91] hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo học viên, bài kiểm tra..."
            className="w-full pl-10 pr-4 py-2 bg-[#f7f8fc] border border-[#eceef4] rounded-xl text-xs focus:outline-none focus:border-[#6857DF] focus:bg-white transition"
          />
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-2xl border border-[#eceef4] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#eceef4] bg-[#f7f8fc]/60 text-[11px] font-bold text-[#777a91] uppercase tracking-wider">
                <th className="py-3.5 px-6">Học viên nộp bài</th>
                <th className="py-3.5 px-6">Bài kiểm tra & Khóa học</th>
                <th className="py-3.5 px-6">Thời gian nộp</th>
                <th className="py-3.5 px-6">Điểm số & Nhận xét</th>
                <th className="py-3.5 px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eceef4] text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#777a91]">
                    <div className="w-8 h-8 mx-auto border-2 border-[#6857DF]/20 border-t-[#6857DF] rounded-full animate-spin mb-2" />
                    Đang tải danh sách bài nộp...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#777a91]">
                    Không có bài nộp nào trong mục này.
                  </td>
                </tr>
              ) : (
                filtered.map((sub) => (
                  <tr key={sub.id} className="hover:bg-[#f7f8fc]/50 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7966f2] to-[#5f4ce0] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {sub.studentName.split(' ').slice(-1)[0][0]}
                        </div>
                        <div>
                          <p className="font-bold text-[#252641]">{sub.studentName}</p>
                          <p className="text-xs text-[#777a91]">{sub.studentEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-[#252641] text-xs">{sub.quizTitle}</p>
                      <span className="text-[11px] text-[#6857DF] font-medium">{sub.courseTitle}</span>
                    </td>
                    <td className="py-4 px-6 text-xs text-[#777a91]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {new Date(sub.submittedAt).toLocaleString('vi-VN')}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {sub.status === 'graded' ? (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            <Award className="w-3.5 h-3.5 text-amber-500" /> {sub.score} / 100đ
                          </span>
                          {sub.feedback && (
                            <p className="text-[11px] text-gray-500 mt-1 italic line-clamp-1">
                              "{sub.feedback}"
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                          Chờ giảng viên chấm
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleOpenGradeModal(sub)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                          sub.status === 'pending'
                            ? 'bg-[#6857DF] hover:bg-[#5144BE] text-white shadow-sm'
                            : 'border border-[#eceef4] bg-white text-[#6857DF] hover:bg-[#F0EDFF]'
                        }`}
                      >
                        {sub.status === 'pending' ? 'Chấm điểm' : 'Sửa điểm'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grading Modal */}
      {gradingSub && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#eceef4] max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" aria-label="Chấm điểm bài nộp">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#6857DF] flex items-center justify-center font-bold">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#252641]">Chấm điểm bài nộp</h3>
                <p className="text-xs text-[#777a91]">Học viên: {gradingSub.studentName}</p>
              </div>
            </div>

            <div className="bg-[#f7f8fc] p-3 rounded-xl mb-4 text-xs text-[#777a91]">
              <p><strong>Bài thi:</strong> {gradingSub.quizTitle}</p>
              <p><strong>Khóa học:</strong> {gradingSub.courseTitle}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#777a91] uppercase tracking-wider mb-1.5">
                  Điểm số (thang điểm 100)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={scoreInput}
                  onChange={(e) => setScoreInput(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#eceef4] rounded-xl text-sm font-bold text-[#6857DF] focus:outline-none focus:border-[#6857DF]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label htmlFor="grading-feedback" className="text-xs font-bold text-[#777a91] uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#6857DF]" /> Nhận xét & Lời khuyên
                  </label>
                  <button
                    type="button"
                    onClick={() => void handleSuggestFeedback()}
                    disabled={aiBusy || saving}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F0EDFF] text-[#6857DF] hover:bg-[#e4dfff] text-xs font-bold disabled:opacity-50"
                  >
                    ✨ {aiBusy ? 'AI đang viết…' : feedbackInput ? 'AI viết lại' : 'AI gợi ý nhận xét'}
                  </button>
                </div>
                {aiResult && (
                  <p className="text-[11px] text-[#6857DF] mb-1.5">
                    Bản nháp do {ENGINE_LABEL[aiResult.engine]} soạn dựa trên các câu đúng/sai — hãy đọc và chỉnh sửa trước khi lưu.
                    {aiResult.note && <span className="text-amber-700"> {aiResult.note}</span>}
                  </p>
                )}
                <textarea
                  id="grading-feedback"
                  rows={aiResult ? 9 : 4}
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="Ghi nhận điểm tốt và hướng dẫn học viên ôn luyện các phần chưa vững..."
                  className="w-full px-3.5 py-2.5 bg-white border border-[#eceef4] rounded-xl text-xs focus:outline-none focus:border-[#6857DF]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-5 border-t border-[#eceef4] mt-6">
              <button
                type="button"
                onClick={() => setGradingSub(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveGrade}
                className="px-4 py-2 rounded-xl bg-[#6857DF] hover:bg-[#5144BE] text-white text-xs font-bold transition shadow-sm"
              >
                {saving ? 'Đang lưu...' : 'Lưu điểm & Gửi nhận xét'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
