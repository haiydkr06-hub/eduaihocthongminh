import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Users,
  GraduationCap,
  Clock,
  PlusCircle,
  ClipboardCheck,
  Star,
  CheckCircle,
} from 'lucide-react'
import { teacherService, type TeacherStats } from '../../services/teacherService'
import { useAuth } from '../../hooks/useAuth'
import { CountUp } from '../../components/CountUp'
import { useTeacherScope } from '../../hooks/useTeacherScope'
import { getFriendlyErrorMessage } from '../../lib/errorMessage'

export function TeacherDashboardPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const scope = useTeacherScope()
  const [stats, setStats] = useState<TeacherStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (scope === undefined) return
    let active = true
    teacherService
      .getStats(scope)
      .then((data) => {
        if (active) setStats(data)
      })
      .catch((err) => {
        if (active) setError(getFriendlyErrorMessage(err, 'Không thể tải số liệu giảng dạy.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [scope])

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })

  const teacherName = profile?.full_name || 'Thầy/Cô Giảng viên'

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#6857DF] via-[#5f4ce0] to-[#5144BE] rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-[#6857DF]/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-sm mb-3">
            <GraduationCap className="w-3.5 h-3.5" /> Không gian Giảng dạy và Đào tạo
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2">
            Chào mừng trở lại, {teacherName}!
          </h1>
          <p className="text-sm text-purple-100 max-w-xl">
            {loading
              ? 'Đang tải số liệu giảng dạy…'
              : stats && stats.pendingGrading > 0
              ? <>Bạn có <strong>{stats.pendingGrading} bài làm</strong> của học viên chưa được xem và nhận xét.</>
              : 'Tất cả bài làm của học viên đã được xem và nhận xét.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/teacher/courses')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#6857DF] text-xs font-bold hover:bg-purple-50 transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" /> Tạo khóa học mới
          </button>
          <button
            onClick={() => navigate('/teacher/grading')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition backdrop-blur-sm"
          >
            <ClipboardCheck className="w-4 h-4" /> Chấm điểm ngay
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">{error}</div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-[#eceef4] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-[#6857DF] flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {stats ? `${stats.publishedCourses} đã xuất bản` : '…'}
            </span>
          </div>
          <p className="text-xs font-medium text-[#777a91]">Khóa học phụ trách</p>
          <h3 className="text-2xl font-black text-[#252641] mt-1">
            <CountUp value={loading ? null : stats?.totalCourses} /> <span className="text-xs font-normal text-gray-500">khóa học</span>
          </h3>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#eceef4] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              Ghi danh
            </span>
          </div>
          <p className="text-xs font-medium text-[#777a91]">Học viên đang học</p>
          <h3 className="text-2xl font-black text-[#252641] mt-1">
            <CountUp value={loading ? null : stats?.totalStudents} /> <span className="text-xs font-normal text-gray-500">học viên</span>
          </h3>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#eceef4] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              Cần xử lý
            </span>
          </div>
          <p className="text-xs font-medium text-[#777a91]">Bài tập cần chấm điểm</p>
          <h3 className="text-2xl font-black text-[#252641] mt-1">
            <CountUp value={loading ? null : stats?.pendingGrading} /> <span className="text-xs font-normal text-gray-500">bài nộp</span>
          </h3>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#eceef4] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center font-bold">
              <Star className="w-5 h-5 fill-pink-600" />
            </div>
            <span className="text-xs font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full">
              Quiz
            </span>
          </div>
          <p className="text-xs font-medium text-[#777a91]">Điểm trung bình học viên</p>
          <h3 className="text-2xl font-black text-[#252641] mt-1">
            {loading ? '...' : stats?.avgQuizScore == null ? '—' : <CountUp value={stats.avgQuizScore} />} <span className="text-xs font-normal text-gray-500">/ 100</span>
          </h3>
        </div>
      </div>

      {/* Two Columns: Next teaching session & Submissions queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Schedule & Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Việc cần làm — tính từ dữ liệu thật */}
          <div className="bg-white rounded-2xl border border-[#eceef4] p-6 shadow-sm">
            <h2 className="text-base font-bold text-[#252641] mb-4">Công việc giảng dạy</h2>
            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-[#eceef4] bg-[#f7f8fc]/60 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <ClipboardCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#252641]">
                      {stats?.pendingGrading ? `${stats.pendingGrading} bài làm cần nhận xét` : 'Không có bài làm chờ nhận xét'}
                    </h3>
                    <p className="text-[11px] text-[#777a91]">Bài quiz được chấm tự động; bạn có thể điều chỉnh điểm và gửi nhận xét.</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/teacher/grading')}
                  className="px-3 py-1.5 rounded-lg bg-[#6857DF] text-white text-xs font-semibold hover:bg-[#5144BE]"
                >
                  Chấm bài
                </button>
              </div>

              <div className="p-4 rounded-xl border border-[#eceef4] bg-[#f7f8fc]/60 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#6857DF] flex items-center justify-center font-bold">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#252641]">
                      {stats?.draftCourses ? `${stats.draftCourses} khóa học đang chờ Admin duyệt` : 'Không có khóa học chờ duyệt'}
                    </h3>
                    <p className="text-[11px] text-[#777a91]">Bổ sung bài học và quiz trước khi khóa học được xuất bản.</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/teacher/courses')}
                  className="px-3 py-1.5 rounded-lg border border-[#eceef4] bg-white text-xs font-semibold text-[#6857DF] hover:bg-[#F0EDFF]"
                >
                  Quản lý khóa học
                </button>
              </div>

              <div className="p-4 rounded-xl border border-[#eceef4] bg-[#f7f8fc]/60 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#252641]">Tạo bài kiểm tra mới bằng AI</h3>
                    <p className="text-[11px] text-[#777a91]">Dán nội dung bài giảng để AI đề xuất bản nháp câu hỏi, bạn duyệt trước khi xuất bản.</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/teacher/ai-quiz')}
                  className="px-3 py-1.5 rounded-lg border border-[#eceef4] bg-white text-xs font-semibold text-[#6857DF] hover:bg-[#F0EDFF]"
                >
                  Tạo quiz AI
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Recent Submissions */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#eceef4] p-6 shadow-sm">
            <h2 className="text-base font-bold text-[#252641] mb-4">Học viên vừa nộp bài</h2>
            <div className="space-y-4">
              {loading ? (
                <p className="text-xs text-[#777a91]">Đang tải…</p>
              ) : !stats || stats.recentSubmissions.length === 0 ? (
                <p className="text-xs text-[#777a91]">Chưa có bài nộp nào.</p>
              ) : (
                stats.recentSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className={`p-3 rounded-xl border ${sub.status === 'pending' ? 'border-amber-200 bg-amber-50/50' : 'border-[#eceef4] bg-gray-50/50'}`}
                  >
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <span className="text-xs font-bold text-[#252641] truncate">{sub.studentName}</span>
                      {sub.status === 'pending' ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                          Chờ nhận xét · {Math.round(sub.score ?? 0)}đ
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                          Đã chấm: {Math.round(sub.score ?? 0)}đ
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#777a91] truncate">Quiz: {sub.quizTitle}</p>
                    <span className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                      {sub.status === 'graded' && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                      {formatTime(sub.submittedAt)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
