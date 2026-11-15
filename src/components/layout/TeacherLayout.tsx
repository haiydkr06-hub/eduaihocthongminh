import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ClipboardCheck,
  GraduationCap,
  BarChart3,
  User,
  LogOut,
  Sparkles,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const teacherNavItems = [
  { path: '/teacher/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { path: '/teacher/courses', label: 'Khóa học của tôi', icon: BookOpen },
  { path: '/teacher/classes', label: 'Lớp học & Học viên', icon: Users },
  { path: '/teacher/quizzes', label: 'Bài tập & Kiểm tra', icon: ClipboardCheck },
  { path: '/teacher/grading', label: 'Chấm điểm & Nhận xét', icon: GraduationCap },
  { path: '/teacher/analytics', label: 'Thống kê giảng dạy', icon: BarChart3 },
  { path: '/teacher/profile', label: 'Hồ sơ cá nhân', icon: User },
]

export function TeacherLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const currentItem = teacherNavItems.find(
    (item) =>
      location.pathname === item.path ||
      (item.path !== '/teacher/dashboard' && location.pathname.startsWith(item.path))
  )

  const teacherName = profile?.full_name || 'Thầy/Cô Giảng viên'
  const teacherInitials = teacherName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0].toUpperCase())
    .join('') || 'GV'

  return (
    <div className="min-h-screen bg-[#f7f8fc] flex flex-col md:flex-row">
      {/* Mobile Backdrop */}
      {menuOpen && (
        <button
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
          aria-label="Đóng menu"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 bottom-0 z-50 w-64 bg-white border-r border-[#eceef4] p-5 flex flex-col justify-between transition-transform duration-300 md:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        } h-screen overflow-y-auto`}
      >
        <div>
          {/* Brand header */}
          <div className="flex items-center justify-between mb-8 px-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7966f2] to-[#5f4ce0] text-white flex items-center justify-center shadow-md shadow-[#6857DF]/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-xl text-[#252641] tracking-tight">
                  Edu<span className="text-[#7060e8]">AI</span>
                </span>
                <span className="block text-[9px] font-bold text-[#a1a3b5] tracking-widest uppercase">
                  GIẢNG VIÊN
                </span>
              </div>
            </div>
            <button
              onClick={() => setMenuOpen(false)}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-700 md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="text-[11px] font-bold text-[#a9abba] tracking-wider uppercase px-3 mb-2">
            KHÔNG GIAN GIẢNG DẠY
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {teacherNavItems.map((item) => {
              const Icon = item.icon
              const isActive =
                location.pathname === item.path ||
                (item.path !== '/teacher/dashboard' && location.pathname.startsWith(item.path))

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition duration-150 ${
                    isActive
                      ? 'bg-[#F0EDFF] text-[#6857DF] shadow-sm'
                      : 'text-[#777a91] hover:bg-[#f7f8fc] hover:text-[#252641]'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-[#6857DF]' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-[#eceef4] space-y-3">
          <button
            onClick={() => navigate('/student/dashboard')}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#6857DF] bg-[#F0EDFF] hover:bg-[#e4dfff] transition"
          >
            <span>Vào cổng Học viên</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center justify-between p-2 rounded-xl bg-[#f7f8fc] border border-[#eceef4]">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-[#6857DF] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                {teacherInitials}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-[#252641] truncate">{teacherName}</p>
                <p className="text-[10px] text-[#777a91] truncate">Giảng viên EduAI</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Đăng xuất"
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-white transition flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-[#eceef4] px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              className="p-2 rounded-xl text-[#777a91] hover:bg-[#f7f8fc] md:hidden"
              aria-label="Mở menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[#777a91] hidden sm:inline">Giảng dạy</span>
              <span className="text-[#d4d5df] hidden sm:inline">/</span>
              <span className="font-bold text-[#252641]">{currentItem?.label || 'Bảng điều khiển'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
              Instructor Hub
            </span>
            <div className="w-8 h-8 rounded-full bg-[#6857DF] text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {teacherInitials}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
