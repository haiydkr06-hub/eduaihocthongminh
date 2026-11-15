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

export function TeacherDashboardPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<TeacherStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    teacherService.getStats(profile?.id).then((data) => {
      if (active) {
        setStats(data)
        setLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [profile?.id])

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
            Hôm nay bạn có <strong>6 bài kiểm tra</strong> học viên vừa nộp cần chấm điểm và <strong>1 buổi học trực tuyến</strong> lúc 15:30.
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

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-[#eceef4] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-[#6857DF] flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Đang mở
            </span>
          </div>
          <p className="text-xs font-medium text-[#777a91]">Khóa học phụ trách</p>
          <h3 className="text-2xl font-black text-[#252641] mt-1">
            {loading ? '...' : stats?.totalCourses} <span className="text-xs font-normal text-gray-500">khóa học</span>
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
            {loading ? '...' : stats?.totalStudents} <span className="text-xs font-normal text-gray-500">học viên</span>
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
            {loading ? '...' : stats?.pendingGrading} <span className="text-xs font-normal text-gray-500">bài nộp</span>
          </h3>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#eceef4] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center font-bold">
              <Star className="w-5 h-5 fill-pink-600" />
            </div>
            <span className="text-xs font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full">
              Tích cực
            </span>
          </div>
          <p className="text-xs font-medium text-[#777a91]">Đánh giá từ người học</p>
          <h3 className="text-2xl font-black text-[#252641] mt-1">
            {loading ? '...' : stats?.avgRating} <span className="text-xs font-normal text-gray-500">/ 5.0 ⭐</span>
          </h3>
        </div>
      </div>

      {/* Two Columns: Next teaching session & Submissions queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Schedule & Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Next Teaching Session */}
          <div className="bg-white rounded-2xl border border-[#eceef4] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-[#6857DF] uppercase bg-purple-50 px-2.5 py-1 rounded-full">
                  Lớp học tiếp theo
                </span>
                <h2 className="text-lg font-bold text-[#252641] mt-2">Hàm số bậc hai và Ứng dụng Parabol</h2>
                <p className="text-xs text-[#777a91]">Lớp: Toán học tư duy bậc THPT (K10-A1)</p>
              </div>
              <button
                onClick={() => alert('Đã mở phòng học trực tuyến cho giảng viên!')}
                className="px-4 py-2 bg-[#6857DF] hover:bg-[#5144BE] text-white text-xs font-bold rounded-xl transition shadow-md shadow-[#6857DF]/20"
              >
                Vào lớp dạy ngay
              </button>
            </div>

            <div className="flex items-center gap-6 pt-3 border-t border-[#eceef4] text-xs text-[#777a91]">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-purple-600" /> 15:30 – 16:15 hôm nay
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-600" /> 38 học viên tham gia
              </span>
            </div>
          </div>

          {/* Quick Tasks */}
          <div className="bg-white rounded-2xl border border-[#eceef4] p-6 shadow-sm">
            <h2 className="text-base font-bold text-[#252641] mb-4">Công việc giảng dạy</h2>
            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-[#eceef4] bg-[#f7f8fc]/60 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#6857DF] flex items-center justify-center font-bold">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#252641]">Cập nhật bài tập chuyên đề 4</h3>
                    <p className="text-[11px] text-[#777a91]">Khóa: Hình học giải tích không gian Oxyz</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/teacher/quizzes')}
                  className="px-3 py-1.5 rounded-lg border border-[#eceef4] bg-white text-xs font-semibold text-[#6857DF] hover:bg-[#F0EDFF]"
                >
                  Tạo bài tập
                </button>
              </div>

              <div className="p-4 rounded-xl border border-[#eceef4] bg-[#f7f8fc]/60 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <ClipboardCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#252641]">6 bài làm cần nhận xét & chấm điểm</h3>
                    <p className="text-[11px] text-[#777a91]">Kiểm tra 15 phút: Hàm số và Đồ thị</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/teacher/grading')}
                  className="px-3 py-1.5 rounded-lg bg-[#6857DF] text-white text-xs font-semibold hover:bg-[#5144BE]"
                >
                  Chấm bài
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
              <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#252641]">Nguyễn Văn Minh Anh</span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Chờ chấm</span>
                </div>
                <p className="text-[11px] text-[#777a91]">Quiz: Hàm số và Đồ thị</p>
                <span className="text-[10px] text-gray-400 block mt-1">Hôm nay 08:30</span>
              </div>

              <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#252641]">Lê Hoàng Long</span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Chờ chấm</span>
                </div>
                <p className="text-[11px] text-[#777a91]">Bài tập tuần: Tính đơn điệu</p>
                <span className="text-[10px] text-gray-400 block mt-1">Hôm qua 15:20</span>
              </div>

              <div className="p-3 rounded-xl border border-[#eceef4] bg-gray-50/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#252641]">Trần Bảo Ngọc</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Đã chấm: 95đ</span>
                </div>
                <p className="text-[11px] text-[#777a91]">Quiz: Hàm số và Đồ thị</p>
                <span className="text-[10px] text-gray-400 block mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-600" /> Đã gửi nhận xét
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
