import { useNavigate } from 'react-router-dom'
import { FileQuestion, Home, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export function NotFoundPage() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  const getHomePath = () => {
    if (!user) return '/login'
    switch (profile?.role) {
      case 'admin':
        return '/admin/dashboard'
      case 'teacher':
        return '/teacher/dashboard'
      default:
        return '/student/dashboard'
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-[#eceef4] p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[#6857DF]/10 text-[#6857DF] flex items-center justify-center">
          <FileQuestion className="w-9 h-9" />
        </div>

        <span className="inline-block px-3 py-1 bg-[#F0EDFF] text-[#6857DF] text-xs font-bold rounded-full uppercase tracking-wider mb-3">
          Lỗi 404 — Không tìm thấy
        </span>

        <h1 className="text-2xl font-bold text-[#252641] mb-2">Trang không tồn tại</h1>
        <p className="text-sm text-[#777a91] mb-6">
          Đường dẫn bạn vừa truy cập không tồn tại hoặc đã được di chuyển sang địa chỉ khác trong hệ thống EduAI.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate(getHomePath())}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#6857DF] hover:bg-[#5144BE] text-white font-medium rounded-xl transition duration-200 shadow-md shadow-[#6857DF]/20"
          >
            <Home className="w-4 h-4" /> Quay về Trang chủ / Dashboard
          </button>

          <button
            onClick={() => navigate(-1)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-[#303147] font-medium rounded-xl transition duration-200"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại trang trước
          </button>
        </div>
      </div>
    </div>
  )
}
