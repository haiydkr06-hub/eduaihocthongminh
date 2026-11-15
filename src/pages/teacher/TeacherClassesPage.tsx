import { useEffect, useState } from 'react'
import {
  Search,
  BookOpen,
  Award,
  Mail,
} from 'lucide-react'
import { teacherService, type StudentInClass } from '../../services/teacherService'
import { useTeacherScope } from '../../hooks/useTeacherScope'
import { getFriendlyErrorMessage } from '../../lib/errorMessage'

export function TeacherClassesPage() {
  const scope = useTeacherScope()
  const [students, setStudents] = useState<StudentInClass[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('all')

  useEffect(() => {
    if (scope === undefined) return
    let active = true
    teacherService
      .getStudents(scope)
      .then((data) => {
        if (active) setStudents(data)
      })
      .catch((err) => {
        if (active) setError(getFriendlyErrorMessage(err, 'Không thể tải danh sách học viên.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [scope])

  const filteredStudents = students.filter((s) => {
    const matchCourse = selectedCourse === 'all' || s.courseName === selectedCourse
    const matchSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
    return matchCourse && matchSearch
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#252641]">Quản lý Lớp học & Danh sách Học viên</h1>
          <p className="text-sm text-[#777a91]">
            Theo dõi tiến độ học tập, bài học đã hoàn thành và kết quả kiểm tra của từng học viên
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      {error && (
        <div role="alert" className="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">{error}</div>
      )}
      <div className="bg-white rounded-2xl border border-[#eceef4] p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <label className="text-xs font-bold text-[#777a91] whitespace-nowrap">Khóa học:</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-3.5 py-2 bg-[#f7f8fc] border border-[#eceef4] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#6857DF]"
          >
            <option value="all">Tất cả khóa học</option>
            <option value="Toán học tư duy bậc THPT">Toán học tư duy bậc THPT</option>
            <option value="Hình học giải tích và ứng dụng">Hình học giải tích và ứng dụng</option>
            <option value="Đại số tổ hợp và Xác suất">Đại số tổ hợp và Xác suất</option>
          </select>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên học viên hoặc email..."
            className="w-full pl-10 pr-4 py-2 bg-[#f7f8fc] border border-[#eceef4] rounded-xl text-xs focus:outline-none focus:border-[#6857DF] focus:bg-white transition"
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-[#eceef4] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#eceef4] bg-[#f7f8fc]/60 text-[11px] font-bold text-[#777a91] uppercase tracking-wider">
                <th className="py-3.5 px-6">Học viên</th>
                <th className="py-3.5 px-6">Khóa học ghi danh</th>
                <th className="py-3.5 px-6">Ngày tham gia</th>
                <th className="py-3.5 px-6">Tiến độ bài học</th>
                <th className="py-3.5 px-6 text-right">Điểm trung bình</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eceef4] text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#777a91]">
                    <div className="w-8 h-8 mx-auto border-2 border-[#6857DF]/20 border-t-[#6857DF] rounded-full animate-spin mb-2" />
                    Đang tải danh sách học viên...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#777a91]">
                    Không tìm thấy học viên nào trong lớp này.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-[#f7f8fc]/50 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7966f2] to-[#5f4ce0] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {st.name.split(' ').slice(-1)[0][0]}
                        </div>
                        <div>
                          <p className="font-bold text-[#252641]">{st.name}</p>
                          <p className="text-xs text-[#777a91] flex items-center gap-1">
                            <Mail className="w-3 h-3 text-gray-400" /> {st.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-xs text-[#252641] font-semibold">
                      <span className="inline-flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-[#6857DF]" />
                        {st.courseName}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-[#777a91]">
                      {new Date(st.enrolledAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-4 px-6">
                      <div className="w-36">
                        <div className="flex justify-between text-xs font-bold text-[#252641] mb-1">
                          <span>{st.progressPercent}%</span>
                          <span className="text-[10px] text-gray-400 font-normal">hoàn tất</span>
                        </div>
                        <div className="w-full h-2 bg-[#eceef4] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#6857DF] rounded-full transition-all duration-300"
                            style={{ width: `${st.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-[#6857DF]">
                        <Award className="w-3.5 h-3.5 text-amber-500" /> {st.avgScore === null ? 'Chưa làm quiz' : `${st.avgScore} / 100`}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
