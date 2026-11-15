import { useAuth } from './useAuth'

/**
 * Phạm vi dữ liệu cho các trang Giảng viên:
 * - Giảng viên: chỉ khóa học của chính mình (trả về id)
 * - Admin xem trang giảng viên: toàn bộ hệ thống (trả về null)
 * - Chưa tải xong hồ sơ: undefined
 */
export function useTeacherScope(): string | null | undefined {
  const { profile, role } = useAuth()
  if (!profile) return undefined
  return (profile.role || role) === 'admin' ? null : profile.id
}
