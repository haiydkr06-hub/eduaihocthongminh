import { useEffect, useState } from 'react'
import {
  ClipboardCheck,
  Search,
  Clock,
  Award,
  CheckCircle,
  XCircle,
  TrendingUp,
} from 'lucide-react'
import { adminService, type AdminQuizItem } from '../../services/adminService'

export function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState<AdminQuizItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    let active = true
    adminService.getQuizzes()
      .then((data) => {
        if (active) {
          setQuizzes(data)
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
  }, [])

  const filteredQuizzes = quizzes.filter((q) => {
    const matchFilter = filter === 'all' || q.status === filter
    const matchSearch =
      !search ||
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      q.course_title.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#252641]">Quản lý Bài kiểm tra & Bài tập</h1>
          <p className="text-sm text-[#777a91]">
            Theo dõi danh sách quiz, số lượng câu hỏi, thời gian làm bài và kết quả làm bài của học viên
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-2xl border border-[#eceef4] p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'published', label: 'Đang mở (Published)' },
            { id: 'draft', label: 'Bản nháp (Draft)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
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
            placeholder="Tìm bài kiểm tra, khóa học..."
            className="w-full pl-10 pr-4 py-2 bg-[#f7f8fc] border border-[#eceef4] rounded-xl text-xs focus:outline-none focus:border-[#6857DF] focus:bg-white transition"
          />
        </div>
      </div>

      {/* Quizzes Table */}
      <div className="bg-white rounded-2xl border border-[#eceef4] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#eceef4] bg-[#f7f8fc]/60 text-[11px] font-bold text-[#777a91] uppercase tracking-wider">
                <th className="py-3.5 px-6">Bài kiểm tra</th>
                <th className="py-3.5 px-6">Khóa học liên kết</th>
                <th className="py-3.5 px-6">Thời gian & Điểm chuẩn</th>
                <th className="py-3.5 px-6">Lượt thi & Điểm TB</th>
                <th className="py-3.5 px-6 text-right">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eceef4] text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#777a91]">
                    <div className="w-8 h-8 mx-auto border-2 border-[#6857DF]/20 border-t-[#6857DF] rounded-full animate-spin mb-2" />
                    Đang tải danh sách bài kiểm tra...
                  </td>
                </tr>
              ) : filteredQuizzes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#777a91]">
                    Không tìm thấy bài kiểm tra nào.
                  </td>
                </tr>
              ) : (
                filteredQuizzes.map((q) => (
                  <tr key={q.id} className="hover:bg-[#f7f8fc]/50 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center font-bold flex-shrink-0">
                          <ClipboardCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-[#252641]">{q.title}</p>
                          <span className="text-xs text-[#777a91]">{q.questions_count} câu hỏi trắc nghiệm</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-xs text-[#252641] font-medium">
                      {q.course_title}
                    </td>
                    <td className="py-4 px-6 text-xs text-[#777a91]">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>{q.time_limit_minutes} phút</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        <span>Đạt: {q.pass_score}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-xs">
                      <p className="font-bold text-[#252641]">{q.attempts_count} lượt làm</p>
                      {q.attempts_count > 0 ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                          <TrendingUp className="w-3 h-3" /> Điểm TB: {q.avg_score === null ? '—' : `${q.avg_score}/100`}
                        </span>
                      ) : (
                        <span className="text-gray-400">Chưa có bài nộp</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {q.status === 'published' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                          <CheckCircle className="w-3 h-3" /> Đang mở
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                          <XCircle className="w-3 h-3" /> Bản nháp
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
