import { useNavigate, useLocation } from 'react-router-dom'
import { ShieldAlert, ArrowLeft, LogOut, Home } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export function UnauthorizedPage() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const attemptedUrl = (location.state as { attemptedUrl?: string })?.attemptedUrl

  const getDashboardPath = () => {
    switch (profile?.role) {
      case 'admin':
        return '/admin/dashboard'
      case 'teacher':
        return '/teacher/dashboard'
      default:
        return '/student/dashboard'
    }
  }

  const roleLabel = {
    admin: 'Quản trị viên (Admin)',
    teacher: 'Giảng viên (Teacher)',
    student: 'Học viên (Student)',
  }[profile?.role || 'student']

  return (
    <div className="min-h-screen bg-[#f7f8fc] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-[#eceef4] p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
          <ShieldAlert className="w-9 h-9" />
        </div>

        <span className="inline-block px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full uppercase tracking-wider mb-3">
          Lỗi 403 — Không có quyền truy cập
        </span>

        <h1 className="text-2xl font-bold text-[#252641] mb-2">Truy cập bị từ chối</h1>
        <p className="text-sm text-[#777a91] mb-6">
          Tài khoản của bạn hiện có vai trò <strong>{roleLabel}</strong>, không được cấp quyền truy cập vào đường dẫn{' '}
          {attemptedUrl ? <code className="bg-gray-100 px-1 py-0.5 rounded text-red-600">{attemptedUrl}</code> : 'này'}.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate(getDashboardPath())}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#6857DF] hover:bg-[#5144BE] text-white font-medium rounded-xl transition duration-200 shadow-md shadow-[#6857DF]/20"
          >
            <Home className="w-4 h-4" /> Về trang Dashboard của bạn
          </button>

          <button
            onClick={() => navigate(-1)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-[#303147] font-medium rounded-xl transition duration-200"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại trang trước
          </button>

          <button
            onClick={async () => {
              await signOut()
              navigate('/login')
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 text-xs text-gray-500 hover:text-red-600 transition duration-150"
          >
            <LogOut className="w-3.5 h-3.5" /> Đăng xuất để đổi tài khoản khác
          </button>
        </div>
      </div>
    </div>
  )
}
