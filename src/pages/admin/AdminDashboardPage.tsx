import { useNavigate } from 'react-router-dom'
import { ShieldCheck, LogOut, Users, BookOpen, BarChart3, Settings } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export function AdminDashboardPage() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc]">
      {/* Top Header */}
      <header className="bg-white border-b border-[#eceef4] px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7966f2] to-[#5f4ce0] text-white flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-lg text-[#252641]">EduAI — Quản trị viên</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-[#6857DF] uppercase">
                Admin Panel
              </span>
            </div>
            <p className="text-xs text-[#777a91]">Trung tâm điều hành và phân quyền hệ thống</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-bold text-[#252641]">{profile?.full_name || 'Admin User'}</p>
            <p className="text-xs text-[#777a91]">{profile?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition"
          >
            <LogOut className="w-4 h-4" /> Đăng xuất
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 md:p-8">
        <div className="bg-gradient-to-r from-[#6857DF] to-[#5144BE] rounded-3xl p-6 md:p-8 text-white mb-8 shadow-xl shadow-[#6857DF]/20">
          <span className="text-xs font-bold uppercase tracking-widest text-purple-200">Giai đoạn 2: Sẵn sàng</span>
          <h2 className="text-2xl md:text-3xl font-black mt-1 mb-2">Xin chào Quản trị viên, {profile?.full_name}!</h2>
          <p className="text-sm text-purple-100 max-w-xl">
            Hệ thống phân quyền Role-Based Access Control (RBAC) đã kích hoạt thành công.
            Phân hệ Quản trị viên đầy đủ sẽ được xây dựng chi tiết ở <strong>Giai đoạn 3</strong>.
          </p>
        </div>

        {/* Quick status cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-[#eceef4] shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-[#6857DF] flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#777a91]">Quản lý người dùng</p>
              <h3 className="text-xl font-bold text-[#252641]">Học viên & Giảng viên</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#eceef4] shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#777a91]">Kiểm duyệt nội dung</p>
              <h3 className="text-xl font-bold text-[#252641]">Khóa học & Bài giảng</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#eceef4] shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#777a91]">Thống kê hệ thống</p>
              <h3 className="text-xl font-bold text-[#252641]">KPIs & Báo cáo</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#eceef4] shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#777a91]">Cài đặt hệ thống</p>
              <h3 className="text-xl font-bold text-[#252641]">Cấu hình & Phân quyền</h3>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
