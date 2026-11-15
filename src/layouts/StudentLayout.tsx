import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  Bell,
  Sparkles,
  Trophy,
  UserCog,
} from 'lucide-react'
import { AppShell, type ShellNavSection } from '../components/layout/AppShell'
import { CourseSearchBar } from './components/CourseSearchBar'
import { NotificationBell } from './components/NotificationBell'

const sections: ShellNavSection[] = [
  {
    label: 'Học tập',
    items: [
      { path: '/student/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
      { path: '/student/courses', label: 'Khóa học của tôi', icon: BookOpen },
      { path: '/student/schedule', label: 'Kế hoạch học tập', icon: CalendarDays },
      { path: '/student/notifications', label: 'Thông báo', icon: Bell },
    ],
  },
  {
    label: 'Công cụ',
    items: [
      { path: '/student/ai-assistant', label: 'Trợ lý AI học tập', icon: Sparkles, badge: 'AI' },
      { path: '/student/achievements', label: 'Thành tích', icon: Trophy },
      { path: '/student/profile', label: 'Hồ sơ & Cài đặt', icon: UserCog },
    ],
  },
]

export function StudentLayout() {
  const navigate = useNavigate()
  return (
    <AppShell
      roleLabel="Học viên"
      kicker="Không gian học tập"
      sections={sections}
      profilePath="/student/profile"
      headerCenter={
        <div className="w-full max-w-md">
          <CourseSearchBar />
        </div>
      }
      headerActions={
        <>
          <button
            type="button"
            onClick={() => navigate('/student/ai-assistant')}
            className="hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#8b7bff] via-[#6857df] to-[#ec6fb4] shadow-md shadow-[#6857df]/30 hover:-translate-y-0.5 transition"
          >
            <Sparkles className="w-3.5 h-3.5" /> Trợ lý AI
          </button>
          <NotificationBell />
        </>
      }
      sidebarExtra={(close) => (
        <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-white/[0.12] to-white/[0.03] border border-white/10">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-[#ec6fb4]/30 blur-2xl" aria-hidden="true" />
          <p className="relative text-sm font-bold">Gặp khó khăn bài vở? 🤖</p>
          <p className="relative mt-1 text-[11px] leading-relaxed text-white/60">
            Trợ lý AI giải đáp thắc mắc và tóm tắt bài học cho bạn 24/7.
          </p>
          <button
            type="button"
            onClick={() => {
              close()
              navigate('/student/ai-assistant')
            }}
            className="relative mt-3 w-full py-2 rounded-xl text-xs font-bold text-[#1f1850] bg-white hover:bg-[#f0edff] transition"
          >
            Hỏi AI ngay →
          </button>
        </div>
      )}
    />
  )
}

export default StudentLayout
