import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

interface StudentSidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface NavItem {
  path: string
  label: string
  icon: string
  badge?: string
}

const mainNavItems: NavItem[] = [
  { path: '/student/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/student/courses', label: 'Khóa học của tôi', icon: '📚' },
  { path: '/student/schedule', label: 'Lịch học', icon: '📅' },
  { path: '/student/notifications', label: 'Thông báo', icon: '🔔' },
]

const toolNavItems: NavItem[] = [
  { path: '/student/ai-assistant', label: 'Trợ lý AI học tập', icon: '✨', badge: 'AI' },
  { path: '/student/achievements', label: 'Thành tích', icon: '🏆' },
]

export function StudentSidebar({ isOpen, onClose }: StudentSidebarProps) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const studentName = profile?.full_name || 'Học viên'
  const studentInitials =
    studentName
      .split(' ')
      .filter(Boolean)
      .slice(-2)
      .map((w) => w[0].toUpperCase())
      .join('') || 'HV'

  return (
    <>
      {/* Backdrop overlay on mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-xs lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200/90 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo */}
        <div className="p-5 flex items-center justify-between border-b border-gray-100">
          <NavLink
            to="/student/dashboard"
            onClick={onClose}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-500 text-white flex items-center justify-center font-black text-lg shadow-md shadow-primary-500/20 group-hover:scale-105 transition transform">
              E
            </div>
            <div>
              <div className="text-xl font-extrabold text-primary-900 tracking-tight leading-none">
                Edu<span className="text-primary-600">AI</span>
              </div>
              <div className="text-[9px] font-bold tracking-widest text-gray-400 mt-1 uppercase">
                Học thông minh
              </div>
            </div>
          </NavLink>

          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            aria-label="Đóng sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
          {/* 1. MENU CHÍNH (Dashboard, Khóa học của tôi, Lịch học, Thông báo) */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Menu chính
            </div>
            <nav className="space-y-1">
              {mainNavItems.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== '/student/dashboard' && location.pathname.startsWith(item.path))

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 shadow-xs ring-1 ring-primary-500/20'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    {item.path === '/student/schedule' && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" title="Có lịch hôm nay" />
                    )}
                  </NavLink>
                )
              })}
            </nav>
          </div>

          {/* 2. CÔNG CỤ HỌC TẬP (Trợ lý AI & Thành tích) */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Công cụ học tập
            </div>
            <nav className="space-y-1">
              {toolNavItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path)
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 shadow-xs ring-1 ring-primary-500/20'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 rounded-md bg-gradient-to-r from-primary-600 to-indigo-600 text-[10px] font-bold text-white shadow-2xs">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                )
              })}
            </nav>
          </div>

          {/* Banner Trợ lý AI */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-primary-500/5 to-purple-500/10 border border-primary-100">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-lg">🤖</span>
              <span className="text-xs font-bold text-primary-900">Gặp khó khăn bài vở?</span>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed mb-2.5">
              Trợ lý AI sẵn sàng giải đáp thắc mắc và tóm tắt bài học 24/7.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose()
                navigate('/student/ai-assistant')
              }}
              className="w-full py-1.5 px-3 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs transition duration-150 shadow-2xs"
            >
              Hỏi AI ngay →
            </button>
          </div>
        </div>

        {/* Footer cá nhân & Đăng xuất */}
        <div className="p-3.5 border-t border-gray-100 space-y-1">
          <NavLink
            to="/student/profile"
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition ${
              location.pathname === '/student/profile'
                ? 'bg-primary-50 text-primary-700 font-semibold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <span className="text-base">⚙️</span>
            <span>Hồ sơ & Cài đặt</span>
          </NavLink>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-red-600 hover:bg-red-50 transition text-left"
          >
            <span className="text-base">🚪</span>
            <span>Đăng xuất</span>
          </button>

          {/* User badge */}
          <div className="pt-2 flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-2xs">
              {studentInitials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-gray-900 truncate">{studentName}</div>
              <div className="text-[10px] text-gray-400">Học viên EduAI</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
