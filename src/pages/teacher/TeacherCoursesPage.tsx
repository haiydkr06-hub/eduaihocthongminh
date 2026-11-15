import { useEffect, useState, type FormEvent } from 'react'
import {
  BookOpen,
  Plus,
  Play,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  PlusCircle,
  Video,
  Check,
} from 'lucide-react'
import { teacherService, type TeacherCourse, type TeacherLesson } from '../../services/teacherService'
import { useAuth } from '../../hooks/useAuth'

export function TeacherCoursesPage() {
  const { profile } = useAuth()
  const [courses, setCourses] = useState<TeacherCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<string | null>(null)

  // Create course modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState('Toán học')
  const [newDescription, setNewDescription] = useState('')
  const [creating, setCreating] = useState(false)

  // Lesson management
  const [selectedCourse, setSelectedCourse] = useState<TeacherCourse | null>(null)
  const [lessons, setLessons] = useState<TeacherLesson[]>([])
  const [loadingLessons, setLoadingLessons] = useState(false)
  const [showAddLesson, setShowAddLesson] = useState(false)
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonContent, setLessonContent] = useState('')
  const [lessonVideo, setLessonVideo] = useState('')
  const [lessonDuration, setLessonDuration] = useState(20)

  const loadCourses = async () => {
    const data = await teacherService.getCourses(profile?.id)
    setCourses(data)
    setLoading(false)
  }

  useEffect(() => {
    let active = true
    teacherService.getCourses(profile?.id)
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
      loadCourses()
    }
    window.addEventListener('eduai:courses_updated', handleUpdate)

    return () => {
      active = false
      window.removeEventListener('eduai:courses_updated', handleUpdate)
    }
  }, [profile?.id])

  const handleCreateCourse = async (e: FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    setCreating(true)
    const created = await teacherService.createCourse(profile?.id || 'temp', {
      title: newTitle.trim(),
      category: newCategory,
      description: newDescription.trim(),
    })
    setCreating(false)

    if (created) {
      setNotice(`Đã tạo khóa học "${newTitle}" thành công! Khóa học đã được gửi tới Quản trị viên để duyệt xuất bản.`)
      setShowCreateModal(false)
      setNewTitle('')
      setNewDescription('')
      loadCourses()
      setTimeout(() => setNotice(null), 3000)
    }
  }

  const openLessonsModal = async (course: TeacherCourse) => {
    setSelectedCourse(course)
    setLoadingLessons(true)
    setShowAddLesson(false)
    const data = await teacherService.getLessons(course.id)
    setLessons(data)
    setLoadingLessons(false)
  }

  const handleAddLesson = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedCourse || !lessonTitle.trim()) return

    const newLesson = await teacherService.addLesson({
      course_id: selectedCourse.id,
      title: lessonTitle.trim(),
      content: lessonContent.trim(),
      video_url: lessonVideo.trim() || undefined,
      duration_minutes: lessonDuration,
      position: lessons.length + 1,
    })

    setLessons([...lessons, newLesson])
    setShowAddLesson(false)
    setLessonTitle('')
    setLessonContent('')
    setLessonVideo('')
    setNotice(`Đã thêm bài giảng "${newLesson.title}" vào khóa học!`)
    setTimeout(() => setNotice(null), 3000)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#252641]">Khóa học của tôi</h1>
          <p className="text-sm text-[#777a91]">
            Quản lý nội dung chương trình học, thêm bài giảng video và tài liệu giảng dạy
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#6857DF] hover:bg-[#5144BE] text-white text-xs font-bold transition shadow-md shadow-[#6857DF]/25"
        >
          <Plus className="w-4 h-4" /> Tạo khóa học mới
        </button>
      </div>

      {notice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
          <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Courses List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-16 text-center text-[#777a91]">
            <div className="w-8 h-8 mx-auto border-2 border-[#6857DF]/20 border-t-[#6857DF] rounded-full animate-spin mb-2" />
            Đang tải khóa học của bạn...
          </div>
        ) : (
          courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-2xl border border-[#eceef4] p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#F0EDFF] text-[#6857DF]">
                    {course.category}
                  </span>
                  {course.status === 'published' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3" /> Đã xuất bản
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                      <XCircle className="w-3 h-3 text-amber-600" /> Chờ duyệt / Bản nháp
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-[#252641] text-base mb-2 line-clamp-2">
                  {course.title}
                </h3>
                <p className="text-xs text-[#777a91] line-clamp-2 mb-4">
                  {course.description || 'Chưa có mô tả cho khóa học này.'}
                </p>
              </div>

              <div className="pt-4 border-t border-[#eceef4] space-y-3">
                <div className="flex items-center justify-between text-xs text-[#777a91]">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-purple-600" />
                    <strong>{course.lessonsCount}</strong> bài giảng
                  </span>
                  <span>
                    <strong>{course.studentsCount}</strong> học viên
                  </span>
                </div>

                <button
                  onClick={() => openLessonsModal(course)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#f7f8fc] hover:bg-[#F0EDFF] hover:text-[#6857DF] text-xs font-bold text-[#252641] transition border border-[#eceef4]"
                >
                  <BookOpen className="w-4 h-4" /> Quản lý bài giảng & tài liệu
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Create Course */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#eceef4]">
            <h3 className="text-lg font-bold text-[#252641] mb-1">Tạo khóa học mới</h3>
            <p className="text-xs text-[#777a91] mb-4">Khóa học mới tạo sẽ ở trạng thái Nháp (Draft)</p>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#777a91] uppercase tracking-wider mb-1.5">
                  Tên khóa học
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ví dụ: Hình học không gian lớp 11..."
                  className="w-full px-3.5 py-2.5 bg-[#f7f8fc] border border-[#eceef4] rounded-xl text-xs focus:outline-none focus:border-[#6857DF]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#777a91] uppercase tracking-wider mb-1.5">
                  Chủ đề / Môn học
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#f7f8fc] border border-[#eceef4] rounded-xl text-xs focus:outline-none focus:border-[#6857DF]"
                >
                  <option value="Toán học">Toán học</option>
                  <option value="Khoa học">Khoa học tự nhiên</option>
                  <option value="Ngoại ngữ">Ngoại ngữ</option>
                  <option value="Công nghệ">Công nghệ & Lập trình</option>
                  <option value="Kỹ năng">Kỹ năng mềm</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#777a91] uppercase tracking-wider mb-1.5">
                  Mô tả khóa học
                </label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Mục tiêu và kiến thức cốt lõi học viên sẽ đạt được..."
                  className="w-full px-3.5 py-2.5 bg-[#f7f8fc] border border-[#eceef4] rounded-xl text-xs focus:outline-none focus:border-[#6857DF]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-xl bg-[#6857DF] hover:bg-[#5144BE] text-white text-xs font-bold transition shadow-sm"
                >
                  {creating ? 'Đang tạo...' : 'Tạo khóa học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Lessons Manager */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-[#eceef4] max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-[#eceef4]">
              <div>
                <span className="text-[10px] font-bold text-[#6857DF] uppercase bg-purple-50 px-2 py-0.5 rounded">
                  {selectedCourse.category}
                </span>
                <h3 className="text-lg font-bold text-[#252641] mt-1">{selectedCourse.title}</h3>
                <p className="text-xs text-[#777a91]">Danh sách bài giảng & bài tập trong khóa</p>
              </div>
              <button
                onClick={() => setSelectedCourse(null)}
                className="text-gray-400 hover:text-gray-700 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {loadingLessons ? (
                <div className="py-8 text-center text-sm text-[#777a91]">Đang tải bài giảng...</div>
              ) : lessons.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">Khóa học này chưa có bài giảng nào.</div>
              ) : (
                lessons.map((lesson, idx) => (
                  <div
                    key={lesson.id}
                    className="p-3.5 rounded-xl border border-[#eceef4] bg-[#f7f8fc]/60 hover:bg-white transition flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 text-[#6857DF] flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#252641]">{lesson.title}</h4>
                        <div className="flex items-center gap-3 text-[11px] text-[#777a91] mt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {lesson.duration_minutes} phút
                          </span>
                          {lesson.video_url && (
                            <span className="flex items-center gap-1 text-blue-600">
                              <Video className="w-3 h-3" /> Video bài giảng
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => alert(`Xem nội dung bài giảng: ${lesson.title}\n\n${lesson.content}`)}
                      className="p-1.5 rounded-lg border border-[#eceef4] hover:bg-gray-100 text-[#777a91]"
                      title="Xem nội dung"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}

              {/* Form Add Lesson */}
              {showAddLesson ? (
                <form onSubmit={handleAddLesson} className="p-4 rounded-xl border border-[#6857DF]/30 bg-[#F0EDFF]/30 space-y-3 mt-4">
                  <h4 className="text-xs font-bold text-[#6857DF] uppercase">Thêm bài giảng mới</h4>
                  <input
                    type="text"
                    required
                    placeholder="Tiêu đề bài học (VD: Bài 4: Khảo sát sự biến thiên)..."
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#eceef4] rounded-xl text-xs focus:outline-none focus:border-[#6857DF]"
                  />
                  <textarea
                    rows={3}
                    placeholder="Tóm tắt nội dung chính hoặc tài liệu học tập..."
                    value={lessonContent}
                    onChange={(e) => setLessonContent(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#eceef4] rounded-xl text-xs focus:outline-none focus:border-[#6857DF]"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="URL Video (YouTube / MP4)..."
                      value={lessonVideo}
                      onChange={(e) => setLessonVideo(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#eceef4] rounded-xl text-xs focus:outline-none focus:border-[#6857DF]"
                    />
                    <input
                      type="number"
                      placeholder="Thời lượng (phút)..."
                      value={lessonDuration}
                      onChange={(e) => setLessonDuration(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-[#eceef4] rounded-xl text-xs focus:outline-none focus:border-[#6857DF]"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddLesson(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-[#6857DF] text-white text-xs font-bold hover:bg-[#5144BE]"
                    >
                      Lưu bài giảng
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowAddLesson(true)}
                  className="w-full py-2.5 rounded-xl border-2 border-dashed border-[#6857DF]/40 text-[#6857DF] hover:bg-[#F0EDFF] text-xs font-bold transition flex items-center justify-center gap-2 mt-2"
                >
                  <PlusCircle className="w-4 h-4" /> Thêm bài giảng vào khóa học này
                </button>
              )}
            </div>

            <div className="pt-3 border-t border-[#eceef4] flex justify-end">
              <button
                onClick={() => setSelectedCourse(null)}
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
