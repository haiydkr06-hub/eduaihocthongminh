import {
  LayoutDashboard,
  BookOpen,
  Users,
  ClipboardCheck,
  GraduationCap,
  BarChart3,
  User,
  Sparkles,
  Bell,
  BrainCircuit,
} from 'lucide-react'
import { NotificationBell } from '../../layouts/components/NotificationBell'
import { AppShell, type ShellNavSection } from './AppShell'

const sections: ShellNavSection[] = [
  {
    label: 'Giảng dạy',
    items: [
      { path: '/teacher/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
      { path: '/teacher/courses', label: 'Khóa học của tôi', icon: BookOpen },
      { path: '/teacher/classes', label: 'Lớp học & Học viên', icon: Users },
      { path: '/teacher/quizzes', label: 'Bài tập & Kiểm tra', icon: ClipboardCheck },
      { path: '/teacher/grading', label: 'Chấm điểm & Nhận xét', icon: GraduationCap },
    ],
  },
  {
    label: 'Trợ lý thông minh',
    items: [
      { path: '/teacher/ai-insights', label: 'Trợ lý AI giảng dạy', icon: BrainCircuit, badge: 'AI' },
      { path: '/teacher/ai-quiz', label: 'Soạn Quiz bằng AI', icon: Sparkles },
      { path: '/teacher/analytics', label: 'Thống kê giảng dạy', icon: BarChart3 },
    ],
  },
  {
    label: 'Tài khoản',
    items: [
      { path: '/teacher/notifications', label: 'Thông báo', icon: Bell },
      { path: '/teacher/profile', label: 'Hồ sơ cá nhân', icon: User },
    ],
  },
]

export function TeacherLayout() {
  return (
    <AppShell
      roleLabel="Giảng viên"
      kicker="Không gian giảng dạy"
      sections={sections}
      profilePath="/teacher/profile"
      headerActions={
        <>
          <span className="hidden md:inline-flex px-3 py-1 rounded-full text-[11px] font-bold text-[#4b3cc4] bg-[#efecff] border border-[#e0dbff]">
            Instructor Hub
          </span>
          <NotificationBell />
        </>
      }
    />
  )
}
