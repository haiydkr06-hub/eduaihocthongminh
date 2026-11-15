import { useEffect, useState } from 'react'
import {
  BookOpen,
  Search,
  CheckCircle,
  Archive,
  Eye,
  XCircle,
  Check,
} from 'lucide-react'
import { adminService, type AdminCourseItem } from '../../services/adminService'

export function AdminCoursesPage() {
  const [courses, setCourses] = useState<AdminCourseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [inspectCourse, setInspectCourse] = useState<AdminCourseItem | null>(null)

  const refreshCourses = async () => {
    const data = await adminService.getCourses()
    setCourses(data)
  }

  useEffect(() => {
    let active = true
    adminService.getCourses()
      .then((data) => {
        if (active) {
          setCourses(data)
          setLoading(false)
        }
      })
      .catch(() => {
        if (active) {
          setLoading(false)
        }
      })

    const handleUpdate = () => {
      refreshCourses()
    }
    window.addEventListener('eduai:courses_updated', handleUpdate)

    return () => {
      active = false
      window.removeEventListener('eduai:courses_updated', handleUpdate)
    }
  }, [])

  const handleStatusChange = async (courseId: string, newStatus: 'draft' | 'published' | 'archived') => {
    const success = await adminService.updateCourseStatus(courseId, newStatus)
    if (success) {
      setNotice(`Đã cập nhật trạng thái khóa học sang "${newStatus}" thành công!`)
      refreshCourses()
      setTimeout(() => setNotice(null), 3000)
    } else {
      alert('Không thể cập nhật trạng thái khóa học')
    }
  }

  const filteredCourses = courses.filter((c) => {
    const matchStatus = statusFilter === 'all' || c.status === statusFilter
    const matchSearch =
      !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.instructor_name.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const getStatusBadge = (status: 'draft' | 'published' | 'archived') => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
            <CheckCircle className="w-3 h-3" /> Đã xuất bản
          </span>
        )
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
            <XCircle className="w-3 h-3" /> Chờ duyệt / Nháp
          </span>
        )
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
            <Archive className="w-3 h-3" /> Đã lưu trữ
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#252641]">Quản lý Khóa học & Bài giảng</h1>
          <p className="text-sm text-[#777a91]">
            Kiểm duyệt nội dung, quản lý trạng thái xuất bản các khóa học của giảng viên
          </p>
        </div>
      </div>

      {notice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
          <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Filter and Search */}
      <div className="bg-white rounded-2xl border border-[#eceef4] p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'published', label: 'Đã xuất bản' },
            { id: 'draft', label: 'Bản nháp' },
            { id: 'archived', label: 'Đã lưu trữ' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                statusFilter === tab.id
                  ? 'bg-[#6857DF] text-white shadow-sm shadow-[#6857DF]/25'
                  : 'bg-[#f7f8fc] text-[#777a91] hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm khóa học, giảng viên..."
            className="w-full pl-10 pr-4 py-2 bg-[#f7f8fc] border border-[#eceef4] rounded-xl text-xs focus:outline-none focus:border-[#6857DF] focus:bg-white transition"
          />
        </div>
      </div>

      {/* Courses Table */}
      <div className="bg-white rounded-2xl border border-[#eceef4] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#eceef4] bg-[#f7f8fc]/60 text-[11px] font-bold text-[#777a91] uppercase tracking-wider">
                <th className="py-3.5 px-6">Khóa học & Môn học</th>
                <th className="py-3.5 px-6">Giảng viên phụ trách</th>
                <th className="py-3.5 px-6">Quy mô</th>
                <th className="py-3.5 px-6">Trạng thái</th>
                <th className="py-3.5 px-6 text-right">Kiểm duyệt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eceef4] text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#777a91]">
                    <div className="w-8 h-8 mx-auto border-2 border-[#6857DF]/20 border-t-[#6857DF] rounded-full animate-spin mb-2" />
                    Đang tải danh sách khóa học...
                  </td>
                </tr>
              ) : filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#777a91]">
                    Không tìm thấy khóa học nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredCourses.map((c) => (
                  <tr key={c.id} className="hover:bg-[#f7f8fc]/50 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#6857DF] flex items-center justify-center font-bold flex-shrink-0">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-[#252641]">{c.title}</p>
                          <span className="inline-block text-[11px] font-semibold text-[#6857DF] bg-[#F0EDFF] px-2 py-0.5 rounded mt-0.5">
                            {c.category}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-xs text-[#252641] font-semibold">
                      {c.instructor_name}
                    </td>
                    <td className="py-4 px-6 text-xs text-[#777a91]">
                      <p><strong>{c.lessons_count}</strong> bài giảng</p>
                      <p><strong>{c.students_count}</strong> học viên tham gia</p>
                    </td>
                    <td className="py-4 px-6">{getStatusBadge(c.status)}</td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => setInspectCourse(c)}
                        title="Xem chi tiết"
                        className="p-1.5 rounded-lg border border-[#eceef4] hover:bg-gray-100 text-[#777a91]"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {c.status !== 'published' && (
                        <button
                          onClick={() => handleStatusChange(c.id, 'published')}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                        >
                          Duyệt
                        </button>
                      )}

                      {c.status === 'published' && (
                        <button
                          onClick={() => handleStatusChange(c.id, 'draft')}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold"
                        >
                          Thu hồi
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Course Modal */}
      {inspectCourse && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#eceef4]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#252641]">Thông tin chi tiết khóa học</h3>
              <button
                onClick={() => setInspectCourse(null)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <span className="text-xs font-bold text-[#777a91] uppercase">Tên khóa học:</span>
                <p className="font-bold text-[#252641] text-base">{inspectCourse.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-bold text-[#777a91] uppercase">Chủ đề / Môn học:</span>
                  <p className="font-semibold text-[#6857DF]">{inspectCourse.category}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-[#777a91] uppercase">Giảng viên phụ trách:</span>
                  <p className="font-semibold text-[#252641]">{inspectCourse.instructor_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-bold text-[#777a91] uppercase">Số bài giảng:</span>
                  <p className="font-medium text-[#252641]">{inspectCourse.lessons_count} bài</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-[#777a91] uppercase">Số học viên ghi danh:</span>
                  <p className="font-medium text-[#252641]">{inspectCourse.students_count} học viên</p>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-[#777a91] uppercase">Trạng thái hiện tại:</span>
                <div className="mt-1">{getStatusBadge(inspectCourse.status)}</div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#eceef4] flex justify-end gap-2">
              <button
                onClick={() => setInspectCourse(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
