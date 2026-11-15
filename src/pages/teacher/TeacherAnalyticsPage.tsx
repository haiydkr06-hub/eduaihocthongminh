import { useEffect, useMemo, useState } from 'react'
import { BarChart3, AlertCircle, Award, Users, BookOpen, Check } from 'lucide-react'
import { teacherService, type StudentInClass, type TeacherCourse } from '../../services/teacherService'
import { notificationService } from '../../services/notificationService'
import { useTeacherScope } from '../../hooks/useTeacherScope'
import { rankAtRisk } from '../../services/teacherAiService'
import { getFriendlyErrorMessage } from '../../lib/errorMessage'


interface SupportItem {
  row: StudentInClass
  reasons: string[]
}

export function TeacherAnalyticsPage() {
  const scope = useTeacherScope()
  const [students, setStudents] = useState<StudentInClass[]>([])
  const [courses, setCourses] = useState<TeacherCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [now] = useState(() => Date.now())

  useEffect(() => {
    if (scope === undefined) return
    let active = true
    Promise.all([teacherService.getStudents(scope), teacherService.getCourses(scope)])
      .then(([s, c]) => {
        if (!active) return
        setStudents(s)
        setCourses(c)
      })
      .catch((err) => active && setError(getFriendlyErrorMessage(err, 'Không thể tải số liệu thống kê.')))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [scope])

  const coursePerformance = useMemo(
    () =>
      courses.map((c) => {
        const rows = students.filter((s) => s.courseId === c.id)
        const scored = rows.filter((r) => r.avgScore !== null).map((r) => r.avgScore as number)
        return {
          id: c.id,
          title: c.title,
          students: rows.length,
          completionRate: rows.length ? Math.round(rows.reduce((sum, r) => sum + r.progressPercent, 0) / rows.length) : 0,
          avgScore: scored.length ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : null,
        }
      }),
    [courses, students]
  )

  // Dùng chung bộ chấm điểm nguy cơ với trang "Trợ lý AI giảng dạy" để kết quả nhất quán
  const studentsNeedSupport = useMemo<SupportItem[]>(
    () =>
      rankAtRisk(students, now)
        .filter((r) => r.level !== 'Thấp')
        .map((r) => ({ row: r.row, reasons: [`nguy cơ ${r.level.toLowerCase()} (${r.score}/100)`, ...r.reasons] })),
    [students, now]
  )

  const allScores = students.filter((s) => s.avgScore !== null).map((s) => s.avgScore as number)
  const avgAll = allScores.length ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : null
  const avgProgress = students.length ? Math.round(students.reduce((s, r) => s + r.progressPercent, 0) / students.length) : 0
  const uniqueStudents = new Set(students.map((s) => s.studentId)).size

  const handleRemind = async (item: SupportItem) => {
    if (sendingId) return
    setSendingId(item.row.id)
    setError(null)
    try {
      await notificationService.send({
        userId: item.row.studentId,
        title: `Nhắc nhở học tập: ${item.row.courseName}`,
        message: `Giảng viên nhận thấy bạn cần chú ý (${item.reasons.join(', ')}). Hãy dành thời gian ôn lại bài và hoàn thành các bài kiểm tra nhé!`,
        type: 'warning',
      })
      setNotice(`Đã gửi thông báo nhắc nhở tới ${item.row.name}.`)
      setTimeout(() => setNotice(null), 3000)
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Không gửi được nhắc nhở.'))
    } finally {
      setSendingId(null)
    }
  }

  const show = (v: string | number | null) => (loading ? '…' : v === null ? '—' : v)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#252641]">Thống kê Kết quả Giảng dạy</h1>
        <p className="text-sm text-[#777a91]">
          Hiệu quả học tập theo khóa học và danh sách học viên cần hỗ trợ thêm — tính từ dữ liệu thật
        </p>
      </div>

      {error && (
        <div role="alert" className="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">{error}</div>
      )}
      {notice && (
        <div role="status" className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-sm border border-emerald-200 flex items-center gap-2">
          <Check className="w-4 h-4" /> {notice}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-[#eceef4] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#6857DF] flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#777a91]">Điểm trung bình các lớp</p>
              <h3 className="text-2xl font-black text-[#252641]">{show(avgAll)}{avgAll !== null && !loading ? ' / 100' : ''}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#eceef4] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#777a91]">Tiến độ trung bình</p>
              <h3 className="text-2xl font-black text-[#252641]">{show(`${avgProgress}%`)}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#eceef4] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#777a91]">Học viên / cần hỗ trợ</p>
              <h3 className="text-2xl font-black text-[#252641]">
                {show(uniqueStudents)} <span className="text-base text-amber-600">/ {loading ? '…' : studentsNeedSupport.length}</span>
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-[#eceef4] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-[#252641]">Tiến độ theo Khóa học</h2>
              <p className="text-xs text-[#777a91]">Tiến độ trung bình của học viên trong từng khóa</p>
            </div>
            <BarChart3 className="w-5 h-5 text-gray-400" aria-hidden="true" />
          </div>

          <div className="space-y-5">
            {coursePerformance.length === 0 ? (
              <p className="text-xs text-[#777a91]">{loading ? 'Đang tải…' : 'Bạn chưa có khóa học nào.'}</p>
            ) : (
              coursePerformance.map((c) => (
                <div key={c.id} className="space-y-1.5">
                  <div className="flex justify-between text-xs gap-2">
                    <span className="font-bold text-[#252641] truncate">{c.title}</span>
                    <span className="font-bold text-[#6857DF] whitespace-nowrap">{c.completionRate}% hoàn thành</span>
                  </div>
                  <div className="w-full h-2.5 bg-[#eceef4] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#7966f2] to-[#6857DF] rounded-full" style={{ width: `${c.completionRate}%` }} />
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-500">
                    <span>{c.students} học viên</span>
                    <span>Điểm TB: {c.avgScore === null ? '—' : `${c.avgScore}/100`}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#eceef4] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[#252641]">Học viên cần quan tâm & hỗ trợ</h2>
              <p className="text-xs text-[#777a91]">
                Xếp hạng theo điểm nguy cơ AI — xem chi tiết và soạn lời nhắn ở mục <a href="/teacher/ai-insights" className="text-[#6857DF] font-bold hover:underline">Trợ lý AI giảng dạy</a>
              </p>
            </div>
            <AlertCircle className="w-5 h-5 text-amber-500" aria-hidden="true" />
          </div>

          <div className="space-y-3">
            {studentsNeedSupport.length === 0 ? (
              <p className="text-xs text-[#777a91]">{loading ? 'Đang tải…' : 'Không có học viên nào cần hỗ trợ đặc biệt. 🎉'}</p>
            ) : (
              studentsNeedSupport.map((item) => (
                <div key={item.row.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex flex-col justify-between gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#252641]">{item.row.name}</span>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                      Tiến độ: {item.row.progressPercent}% • Điểm: {item.row.avgScore ?? '—'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#777a91]">{item.row.courseName}</p>
                  <div className="flex items-center justify-between gap-2 text-[11px] text-amber-900 pt-1 border-t border-amber-200/60 mt-1">
                    <span>⚠ {item.reasons.join(' • ')}</span>
                    <button
                      onClick={() => void handleRemind(item)}
                      disabled={sendingId !== null}
                      className="text-xs font-bold text-[#6857DF] hover:underline disabled:opacity-50 whitespace-nowrap"
                    >
                      {sendingId === item.row.id ? 'Đang gửi…' : 'Gửi nhắc nhở'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
