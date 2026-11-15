import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { CourseSearchBar } from './CourseSearchBar'
import { NotificationBell } from './NotificationBell'

interface StudentHeaderProps {
  onToggleMobileMenu: () => void
  isMobileMenuOpen: boolean
}

export function StudentHeader({ onToggleMobileMenu, isMobileMenuOpen }: StudentHeaderProps) {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const studentName = profile?.full_name || 'Học viên'
  const studentInitials =
    studentName
      .split(' ')
      .filter(Boolean)
      .slice(-2)
      .map((w) => w[0].toUpperCase())
      .join('') || 'HV'

  const getPageTitle = () => {
    const path = location.pathname
    if (path.includes('/student/courses')) return 'Khóa học của tôi'
    if (path.includes('/student/schedule')) return 'Lịch học tập'
    if (path.includes('/student/notifications')) return 'Hộp thư thông báo'
    if (path.includes('/student/achievements')) return 'Thành tích học tập'
    if (path.includes('/student/ai-assistant')) return 'Trợ lý AI học tập'
    if (path.includes('/student/profile')) return 'Hồ sơ cá nhân'
    if (path.includes('/student/learn')) return 'Phòng học trực tuyến'
    if (path.includes('/student/quiz')) return 'Bài kiểm tra trắc nghiệm'
    return 'Tổng quan học tập'
  }

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-200/80 px-4 lg:px-8 py-3 flex items-center justify-between gap-4">
      {/* Bên trái: Nút Menu Mobile & Tiêu đề Trang */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          aria-label={isMobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
          className="lg:hidden p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition"
        >
          {isMobileMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        <div className="hidden sm:block">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Không gian học tập
          </div>
          <div className="text-base font-bold text-gray-900 truncate">
            {getPageTitle()}
          </div>
        </div>
      </div>

      {/* Ở giữa: Thanh tìm kiếm khóa học (Course Search Bar) */}
      <div className="flex-1 max-w-md mx-2">
        <CourseSearchBar />
      </div>

      {/* Bên phải: Trợ lý AI, Chuông thông báo & Hồ sơ Học viên */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Nút tắt Trợ lý AI */}
        <button
          type="button"
          onClick={() => navigate('/student/ai-assistant')}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-50 text-primary-700 hover:bg-primary-100 font-semibold text-xs transition duration-150 border border-primary-100"
        >
          <span className="text-sm">✨</span>
          <span>Trợ lý AI</span>
        </button>

        {/* Biểu tượng Chuông Thông Báo (Real-time Notification Bell) */}
        <NotificationBell />

        {/* Ảnh đại diện & Hồ sơ học viên */}
        <button
          type="button"
          onClick={() => navigate('/student/profile')}
          className="flex items-center gap-2 p-1 sm:px-2 sm:py-1.5 rounded-xl hover:bg-gray-100 transition group"
          title={`Hồ sơ: ${studentName}`}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-white">
            {studentInitials}
          </div>
          <span className="hidden xl:block text-xs font-semibold text-gray-700 group-hover:text-gray-900 truncate max-w-[120px]">
            {studentName}
          </span>
        </button>
      </div>
    </header>
  )
}
