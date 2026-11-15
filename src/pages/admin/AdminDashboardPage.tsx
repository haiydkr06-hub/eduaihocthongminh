import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  PlusCircle,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react'
import { adminService, type AdminStats } from '../../services/adminService'
import { useAuth } from '../../hooks/useAuth'

export function AdminDashboardPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminService.getStats().then((data) => {
      setStats(data)
      setLoading(false)
    })
  }, [])

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#6857DF] via-[#5f4ce0] to-[#5144BE] rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-[#6857DF]/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-sm mb-3">
            <ShieldCheck className="w-3.5 h-3.5" /> Hệ thống bảo mật RBAC hoạt động bình thường
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2">
            Bảng điều khiển Quản trị viên
          </h1>
          <p className="text-sm text-purple-100 max-w-xl">
            Xin chào <strong>{profile?.full_name || 'Admin'}</strong>! Bạn có toàn quyền theo dõi số liệu, quản lý người dùng, duyệt khóa học và phân quyền hệ thống.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/admin/users')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#6857DF] text-xs font-bold hover:bg-purple-50 transition shadow-sm"
          >
            <Users className="w-4 h-4" /> Phân quyền người dùng
          </button>
          <button
            onClick={() => navigate('/admin/notifications')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition backdrop-blur-sm"
          >
            <PlusCircle className="w-4 h-4" /> Gửi thông báo chung
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-[#eceef4] shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-[#6857DF] flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +12%
            </span>
          </div>
          <p className="text-xs font-medium text-[#777a91]">Tổng học viên đăng ký</p>
          <h3 className="text-2xl font-black text-[#252641] mt-1">
            {loading ? '...' : stats?.totalStudents} <span className="text-xs font-normal text-gray-500">học viên</span>
          </h3>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#eceef4] shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              Chính thức
            </span>
          </div>
          <p className="text-xs font-medium text-[#777a91]">Giảng viên phụ trách</p>
          <h3 className="text-2xl font-black text-[#252641] mt-1">
            {loading ? '...' : stats?.totalTeachers} <span className="text-xs font-normal text-gray-500">giảng viên</span>
          </h3>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#eceef4] shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Hoạt động
            </span>
          </div>
          <p className="text-xs font-medium text-[#777a91]">Khóa học trên hệ thống</p>
          <h3 className="text-2xl font-black text-[#252641] mt-1">
            {loading ? '...' : stats?.totalCourses} <span className="text-xs font-normal text-gray-500">khóa</span>
          </h3>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#eceef4] shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center font-bold">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
              {stats?.averageCompletionRate}% Đạt
            </span>
          </div>
          <p className="text-xs font-medium text-[#777a91]">Lượt nộp bài kiểm tra</p>
          <h3 className="text-2xl font-black text-[#252641] mt-1">
            {loading ? '...' : stats?.totalAttempts} <span className="text-xs font-normal text-gray-500">lượt</span>
          </h3>
        </div>
      </div>

      {/* Two Column Layout: Moderation Queue & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Content Moderation & Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Shortcuts */}
          <div className="bg-white rounded-2xl border border-[#eceef4] p-6 shadow-sm">
            <h2 className="text-base font-bold text-[#252641] mb-4">Lối tắt quản trị hệ thống</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <button
                onClick={() => navigate('/admin/users')}
                className="p-4 rounded-xl border border-[#eceef4] bg-[#f7f8fc] hover:bg-[#F0EDFF] hover:border-[#6857DF]/40 text-left transition group"
              >
                <Users className="w-5 h-5 text-[#6857DF] mb-2" />
                <p className="text-xs font-bold text-[#252641] group-hover:text-[#6857DF]">Quản lý User</p>
                <p className="text-[11px] text-[#777a91]">Phân quyền vai trò</p>
              </button>

              <button
                onClick={() => navigate('/admin/courses')}
                className="p-4 rounded-xl border border-[#eceef4] bg-[#f7f8fc] hover:bg-[#F0EDFF] hover:border-[#6857DF]/40 text-left transition group"
              >
                <BookOpen className="w-5 h-5 text-blue-600 mb-2" />
                <p className="text-xs font-bold text-[#252641] group-hover:text-[#6857DF]">Khóa học</p>
                <p className="text-[11px] text-[#777a91]">Duyệt & kiểm duyệt</p>
              </button>

              <button
                onClick={() => navigate('/admin/reports')}
                className="p-4 rounded-xl border border-[#eceef4] bg-[#f7f8fc] hover:bg-[#F0EDFF] hover:border-[#6857DF]/40 text-left transition group"
              >
                <FileSpreadsheet className="w-5 h-5 text-emerald-600 mb-2" />
                <p className="text-xs font-bold text-[#252641] group-hover:text-[#6857DF]">Báo cáo</p>
                <p className="text-[11px] text-[#777a91]">Thống kê tiến độ</p>
              </button>

              <button
                onClick={() => navigate('/admin/settings')}
                className="p-4 rounded-xl border border-[#eceef4] bg-[#f7f8fc] hover:bg-[#F0EDFF] hover:border-[#6857DF]/40 text-left transition group"
              >
                <ShieldCheck className="w-5 h-5 text-amber-600 mb-2" />
                <p className="text-xs font-bold text-[#252641] group-hover:text-[#6857DF]">Cài đặt</p>
                <p className="text-[11px] text-[#777a91]">Cấu hình hệ thống</p>
              </button>
            </div>
          </div>

          {/* Pending Course Moderation */}
          <div className="bg-white rounded-2xl border border-[#eceef4] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-[#252641]">Khóa học cần xét duyệt xuất bản</h2>
                <p className="text-xs text-[#777a91]">Các khóa học do giảng viên soạn thảo đang ở trạng thái Nháp (Draft)</p>
              </div>
              <button
                onClick={() => navigate('/admin/courses')}
                className="text-xs font-bold text-[#6857DF] hover:underline flex items-center gap-1"
              >
                Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#252641]">Lập trình tư duy logic với AI</h3>
                    <p className="text-xs text-[#777a91]">Giảng viên: Thầy Trần Thanh Bình • 12 bài giảng • Môn: Công nghệ</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate('/admin/courses')}
                    className="px-3 py-1.5 bg-[#6857DF] hover:bg-[#5144BE] text-white text-xs font-semibold rounded-lg transition"
                  >
                    Kiểm duyệt
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: System Event Log */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#eceef4] p-6 shadow-sm">
            <h2 className="text-base font-bold text-[#252641] mb-4">Nhật ký hoạt động hệ thống</h2>
            <div className="space-y-4">
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-[#252641]">
                    <strong>Trần Bảo Ngọc</strong> vừa hoàn thành bài kiểm tra <em>Toán học tư duy</em> đạt 90/100 điểm.
                  </p>
                  <span className="text-[10px] text-gray-400">10 phút trước</span>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-[#252641]">
                    Học viên mới <strong>Lê Hoàng Long</strong> vừa đăng ký tài khoản thành công qua cổng học viên.
                  </p>
                  <span className="text-[10px] text-gray-400">45 phút trước</span>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-purple-50 text-[#6857DF] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-[#252641]">
                    <strong>Cô Nguyễn Minh Anh</strong> vừa cập nhật nội dung bài 13: <em>Hàm số bậc hai</em>.
                  </p>
                  <span className="text-[10px] text-gray-400">2 giờ trước</span>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-[#252641]">
                    Cập nhật phân quyền tài khoản cho giảng viên <strong>Thầy Trần Hoàng Nam</strong>.
                  </p>
                  <span className="text-[10px] text-gray-400">Hôm qua</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
