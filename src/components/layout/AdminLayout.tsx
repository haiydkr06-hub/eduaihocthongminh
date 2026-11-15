import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardCheck,
  BarChart3,
  Bell,
  Settings,
} from 'lucide-react'
import { NotificationBell } from '../../layouts/components/NotificationBell'
import { AppShell, type ShellNavSection } from './AppShell'

const sections: ShellNavSection[] = [
  {
    label: 'Điều hành',
    items: [
      { path: '/admin/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
      { path: '/admin/users', label: 'Người dùng', icon: Users },
      { path: '/admin/courses', label: 'Khóa học', icon: BookOpen },
      { path: '/admin/quizzes', label: 'Bài kiểm tra', icon: ClipboardCheck },
    ],
  },
  {
    label: 'Hệ thống',
    items: [
      { path: '/admin/reports', label: 'Thống kê & Báo cáo', icon: BarChart3 },
      { path: '/admin/notifications', label: 'Thông báo', icon: Bell },
      { path: '/admin/settings', label: 'Cài đặt hệ thống', icon: Settings },
    ],
  },
]

export function AdminLayout() {
  return (
    <AppShell
      roleLabel="Quản trị viên"
      kicker="Quản trị EduAI"
      sections={sections}
      profilePath="/admin/settings"
      switchPortal={{ label: 'Xem cổng Giảng viên', to: '/teacher/dashboard' }}
      headerActions={
        <>
          <span className="hidden md:inline-flex px-3 py-1 rounded-full text-[11px] font-bold text-white bg-gradient-to-r from-[#6857df] to-[#ec6fb4] shadow-sm">
            Root Admin
          </span>
          <NotificationBell />
        </>
      }
    />
  )
}
