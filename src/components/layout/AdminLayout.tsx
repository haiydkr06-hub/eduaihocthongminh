import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardCheck,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Sparkles,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const adminNavItems = [
  { path: '/admin/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { path: '/admin/users', label: 'Quản lý Người dùng', icon: Users },
  { path: '/admin/courses', label: 'Quản lý Khóa học', icon: BookOpen },
  { path: '/admin/quizzes', label: 'Quản lý Bài kiểm tra', icon: ClipboardCheck },
  { path: '/admin/reports', label: 'Thống kê & Báo cáo', icon: BarChart3 },
  { path: '/admin/notifications', label: 'Quản lý Thông báo', icon: Bell },
  { path: '/admin/settings', label: 'Cài đặt hệ thống', icon: Settings },
]

export function AdminLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const currentItem = adminNavItems.find(
    (item) => location.pathname === item.path || (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path))
  )

  const adminName = profile?.full_name || 'Quản trị viên'
  const adminInitials = adminName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0].toUpperCase())
    .join('') || 'AD'

  return (
    <div className="min-h-screen bg-[#f7f8fc] flex flex-col md:flex-row">
      {/* Mobile Drawer Backdrop */}
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
                  QUẢN TRỊ VIÊN
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
            MENU ĐIỀU HÀNH
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {adminNavItems.map((item) => {
              const Icon = item.icon
              const isActive =
                location.pathname === item.path ||
                (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path))

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
                {adminInitials}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-[#252641] truncate">{adminName}</p>
                <p className="text-[10px] text-[#777a91] truncate">Quản trị viên</p>
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
        {/* Topbar */}
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
              <span className="text-[#777a91] hidden sm:inline">Quản trị EduAI</span>
              <span className="text-[#d4d5df] hidden sm:inline">/</span>
              <span className="font-bold text-[#252641]">{currentItem?.label || 'Bảng điều khiển'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-[#6857DF]">
              Root Admin
            </span>
            <div className="w-8 h-8 rounded-full bg-[#6857DF] text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {adminInitials}
            </div>
          </div>
        </header>

        {/* Dynamic page content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
