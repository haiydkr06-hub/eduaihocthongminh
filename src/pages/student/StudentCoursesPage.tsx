import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Play,
  CheckCircle,
  PlusCircle,
  Sparkles,
  Check,
} from 'lucide-react'
import { studentService, type StudentCourseItem } from '../../services/studentService'
import { useAuth } from '../../hooks/useAuth'

export function StudentCoursesPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<'my' | 'explore'>('my')
  const [myCourses, setMyCourses] = useState<StudentCourseItem[]>([])
  const [allCourses, setAllCourses] = useState<StudentCourseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [notice, setNotice] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    const [mine, available] = await Promise.all([
      studentService.getMyCourses(profile?.id),
      studentService.getAllAvailableCourses(),
    ])
    setMyCourses(mine)
    setAllCourses(available)
    setLoading(false)
  }

  useEffect(() => {
    let active = true
    Promise.all([
      studentService.getMyCourses(profile?.id),
      studentService.getAllAvailableCourses(),
    ])
      .then(([mine, available]) => {
        if (active) {
          setMyCourses(mine)
          setAllCourses(available)
          setLoading(false)
        }
      })
      .catch(() => {
        if (active) {
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [profile?.id])

  const handleEnroll = async (courseId: string, courseTitle: string) => {
    if (!profile?.id) return
    const success = await studentService.enrollCourse(profile.id, courseId)
    if (success) {
      setNotice(`Chúc mừng bạn đã đăng ký thành công khóa học: "${courseTitle}"!`)
      loadData()
      setTimeout(() => setNotice(null), 3000)
    }
  }

  const currentList = activeTab === 'my' ? myCourses : allCourses

  const filteredCourses = currentList.filter((c) => {
    const matchCategory = categoryFilter === 'all' || c.category === categoryFilter
    const matchSearch =
      !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.instructor.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase())
    return matchCategory && matchSearch
  })

  return (
    <div className="page-content space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#252641]">Khóa học & Chương trình Đào tạo</h1>
          <p className="text-sm text-[#777a91]">
            Xem các khóa học đã ghi danh hoặc khám phá các môn học mới hấp dẫn trên EduAI
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-white border border-[#eceef4] rounded-2xl p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('my')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'my'
                ? 'bg-[#6857DF] text-white shadow-sm shadow-[#6857DF]/25'
                : 'text-[#777a91] hover:text-[#252641]'
            }`}
          >
            Khóa học của tôi ({myCourses.length})
          </button>
          <button
            onClick={() => setActiveTab('explore')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'explore'
                ? 'bg-[#6857DF] text-white shadow-sm shadow-[#6857DF]/25'
                : 'text-[#777a91] hover:text-[#252641]'
            }`}
          >
            Khám phá môn học mới
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
          <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-[#eceef4] p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {['all', 'Toán học', 'Khoa học', 'Ngoại ngữ', 'Công nghệ'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                categoryFilter === cat
                  ? 'bg-[#6857DF] text-white shadow-sm'
                  : 'bg-[#f7f8fc] text-[#777a91] hover:bg-gray-100'
              }`}
            >
              {cat === 'all' ? 'Tất cả môn học' : cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên khóa học hoặc giáo viên..."
            className="w-full pl-10 pr-4 py-2 bg-[#f7f8fc] border border-[#eceef4] rounded-xl text-xs focus:outline-none focus:border-[#6857DF] focus:bg-white transition"
          />
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-16 text-center text-[#777a91]">
            <div className="w-8 h-8 mx-auto border-2 border-[#6857DF]/20 border-t-[#6857DF] rounded-full animate-spin mb-2" />
            Đang tải dữ liệu khóa học...
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="col-span-full py-16 text-center text-[#777a91]">
            Không tìm thấy khóa học nào phù hợp với điều kiện tìm kiếm.
          </div>
        ) : (
          filteredCourses.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-[#eceef4] p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#F0EDFF] text-[#6857DF]">
                    {c.category}
                  </span>
                  {c.isEnrolled ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Đã đăng ký
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Có thể đăng ký
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-[#252641] text-base mb-2 line-clamp-2">{c.title}</h3>
                <p className="text-xs text-[#777a91] line-clamp-2 mb-4">
                  {c.description || 'Chương trình giảng dạy thông minh kết hợp trợ lý AI giúp người học tiến bộ vượt bậc.'}
                </p>

                <div className="text-xs text-[#777a91] mb-2 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-purple-100 text-[#6857DF] flex items-center justify-center font-bold text-[10px]">
                    {c.instructor.charAt(0)}
                  </div>
                  <span>{c.instructor}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#eceef4] space-y-3">
                {c.isEnrolled ? (
                  <div>
                    <div className="flex justify-between text-xs font-bold text-[#252641] mb-1">
                      <span>{c.lessonsCompleted} / {c.totalLessons} bài học</span>
                      <span className="text-[#6857DF]">{c.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#eceef4] rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full bg-[#6857DF] rounded-full transition-all duration-300"
                        style={{ width: `${c.progress}%` }}
                      />
                    </div>
                    <button
                      onClick={() => navigate(`/student/learn/${c.id}`)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#6857DF] hover:bg-[#5144BE] text-white text-xs font-bold transition shadow-sm"
                    >
                      <Play className="w-4 h-4 fill-white" /> Vào phòng học
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="text-xs text-[#777a91] mb-3 flex items-center justify-between">
                      <span>Số bài giảng: <strong>{c.totalLessons} bài</strong></span>
                      <span className="text-emerald-600 font-bold">Miễn phí</span>
                    </div>
                    <button
                      onClick={() => handleEnroll(c.id, c.title)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#6857DF] to-[#5144BE] hover:from-[#5144BE] hover:to-[#413694] text-white text-xs font-bold transition shadow-md shadow-[#6857DF]/20"
                    >
                      <PlusCircle className="w-4 h-4" /> Đăng ký học ngay
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
