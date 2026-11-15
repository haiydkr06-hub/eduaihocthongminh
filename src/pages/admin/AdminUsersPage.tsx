import { useEffect, useState } from 'react'
import {
  Search,
  Shield,
  GraduationCap,
  BookOpen,
  Check,
  UserCheck,
} from 'lucide-react'
import { getFriendlyErrorMessage } from '../../lib/errorMessage'
import { useAuth } from '../../hooks/useAuth'
import { adminService } from '../../services/adminService'
import type { AppRole, Profile } from '../../types/auth'

export function AdminUsersPage() {
  const { profile } = useAuth()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [updatingRole, setUpdatingRole] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    // Chờ người dùng gõ xong (debounce) để không gửi truy vấn ở mỗi phím
    const timer = setTimeout(() => {
      adminService
        .getUsers(roleFilter, searchQuery)
        .then((data) => {
          if (!active) return
          setUsers(data)
          setError(null)
        })
        .catch((err) => active && setError(getFriendlyErrorMessage(err, 'Không thể tải danh sách người dùng.')))
        .finally(() => active && setLoading(false))
    }, 250)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [roleFilter, searchQuery, reloadKey])

  const roleLabel: Record<AppRole, string> = { admin: 'Quản trị viên', teacher: 'Giảng viên', student: 'Học viên' }

  const handleRoleChange = async (newRole: AppRole) => {
    if (!selectedUser || updatingRole || !profile?.id) return
    if (!window.confirm(`Đổi vai trò của "${selectedUser.full_name}" sang "${roleLabel[newRole]}"?`)) return
    setUpdatingRole(true)
    setError(null)
    try {
      await adminService.updateUserRole(selectedUser.id, newRole, profile.id)
      setNotice(`Đã chuyển vai trò của "${selectedUser.full_name}" sang "${roleLabel[newRole]}" thành công!`)
      setSelectedUser(null)
      setReloadKey((k) => k + 1)
      setTimeout(() => setNotice(null), 3000)
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Không thể cập nhật vai trò.'))
    } finally {
      setUpdatingRole(false)
    }
  }

  const getRoleBadge = (role: AppRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-[#6857DF]">
            <Shield className="w-3 h-3" /> Quản trị viên
          </span>
        )
      case 'teacher':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
            <GraduationCap className="w-3 h-3" /> Giảng viên
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
            <BookOpen className="w-3 h-3" /> Học viên
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#252641]">Quản lý Người dùng & Phân quyền</h1>
          <p className="text-sm text-[#777a91]">
            Xem danh sách, kiểm soát quyền truy cập và phân vai trò học viên, giảng viên và quản trị viên
          </p>
        </div>
      </div>

      {error && (
        <div role="alert" className="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">{error}</div>
      )}
      {notice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
          <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-[#eceef4] p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Role Tabs */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'student', label: 'Học viên' },
            { id: 'teacher', label: 'Giảng viên' },
            { id: 'admin', label: 'Quản trị viên' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRoleFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                roleFilter === tab.id
                  ? 'bg-[#6857DF] text-white shadow-sm shadow-[#6857DF]/25'
                  : 'bg-[#f7f8fc] text-[#777a91] hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên hoặc email..."
            className="w-full pl-10 pr-4 py-2 bg-[#f7f8fc] border border-[#eceef4] rounded-xl text-xs focus:outline-none focus:border-[#6857DF] focus:bg-white transition"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-[#eceef4] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#eceef4] bg-[#f7f8fc]/60 text-[11px] font-bold text-[#777a91] uppercase tracking-wider">
                <th className="py-3.5 px-6">Người dùng</th>
                <th className="py-3.5 px-6">Email</th>
                <th className="py-3.5 px-6">Vai trò hiện tại</th>
                <th className="py-3.5 px-6">Ngày khởi tạo</th>
                <th className="py-3.5 px-6 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eceef4] text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#777a91]">
                    <div className="w-8 h-8 mx-auto border-2 border-[#6857DF]/20 border-t-[#6857DF] rounded-full animate-spin mb-2" />
                    Đang tải danh sách người dùng...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#777a91]">
                    Không tìm thấy người dùng nào phù hợp.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const initials = u.full_name
                    ? u.full_name
                        .split(' ')
                        .filter(Boolean)
                        .slice(-2)
                        .map((w) => w[0].toUpperCase())
                        .join('')
                    : 'U'

                  return (
                    <tr key={u.id} className="hover:bg-[#f7f8fc]/50 transition">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7966f2] to-[#5f4ce0] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {initials}
                          </div>
                          <div>
                            <p className="font-bold text-[#252641]">{u.full_name || 'Chưa đặt tên'}</p>
                            <p className="text-xs text-[#a1a3b5]">ID: {u.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-[#777a91] text-xs font-medium">{u.email}</td>
                      <td className="py-4 px-6">{getRoleBadge(u.role)}</td>
                      <td className="py-4 px-6 text-xs text-[#777a91]">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : '—'}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#eceef4] bg-white text-xs font-semibold text-[#6857DF] hover:bg-[#F0EDFF] transition"
                        >
                          <UserCheck className="w-3.5 h-3.5" /> Phân quyền
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Change Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#eceef4]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#6857DF] flex items-center justify-center font-bold">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#252641]">Phân quyền tài khoản</h3>
                <p className="text-xs text-[#777a91]">{selectedUser.full_name} ({selectedUser.email})</p>
              </div>
            </div>

            <p className="text-xs text-[#777a91] mb-4">
              Chọn vai trò hệ thống mới cho người dùng. Vai trò sẽ được cập nhật trực tiếp vào cơ sở dữ liệu Supabase và có hiệu lực ngay lập tức.
            </p>

            <div className="space-y-2.5 mb-6">
              {[
                {
                  role: 'student' as AppRole,
                  title: 'Học viên (Student)',
                  desc: 'Truy cập khóa học, xem bài giảng, làm bài kiểm tra và theo dõi tiến độ.',
                },
                {
                  role: 'teacher' as AppRole,
                  title: 'Giảng viên (Teacher)',
                  desc: 'Tạo và quản lý khóa học, bài học, bài kiểm tra và theo dõi học viên trong lớp.',
                },
                {
                  role: 'admin' as AppRole,
                  title: 'Quản trị viên (Admin)',
                  desc: 'Toàn quyền quản trị hệ thống, duyệt khóa học, phân quyền tài khoản.',
                },
              ].map((opt) => (
                <button
                  key={opt.role}
                  disabled={updatingRole}
                  onClick={() => handleRoleChange(opt.role)}
                  className={`w-full p-3.5 rounded-xl border text-left transition flex items-start justify-between ${
                    selectedUser.role === opt.role
                      ? 'border-[#6857DF] bg-[#F0EDFF]'
                      : 'border-[#eceef4] hover:bg-[#f7f8fc]'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold text-[#252641]">{opt.title}</p>
                    <p className="text-[11px] text-[#777a91] mt-0.5">{opt.desc}</p>
                  </div>
                  {selectedUser.role === opt.role && (
                    <span className="w-5 h-5 rounded-full bg-[#6857DF] text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <button
                disabled={updatingRole}
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
