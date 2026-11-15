import {
  BarChart3,
  TrendingUp,
  AlertCircle,
  Award,
  Clock,
  BookOpen,
} from 'lucide-react'

export function TeacherAnalyticsPage() {
  const coursePerformance = [
    { title: 'Toán học tư duy bậc THPT', students: 38, completionRate: 78, avgScore: 84.5 },
    { title: 'Hình học giải tích không gian', students: 26, completionRate: 64, avgScore: 75.0 },
    { title: 'Đại số tổ hợp và Xác suất', students: 14, completionRate: 82, avgScore: 88.0 },
  ]

  const studentsNeedSupport = [
    {
      name: 'Phạm Quỳnh Trang',
      course: 'Toán học tư duy bậc THPT',
      progress: 30,
      avgScore: 60,
      issue: 'Chưa hoàn thành bài tập tuần 3 & 4',
    },
    {
      name: 'Lê Hoàng Long',
      course: 'Hình học giải tích không gian',
      progress: 45,
      avgScore: 58,
      issue: 'Điểm quiz mặt phẳng chưa đạt chuẩn',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#252641]">Thống kê Kết quả Giảng dạy</h1>
        <p className="text-sm text-[#777a91]">
          Đánh giá hiệu quả truyền đạt kiến thức, độ tương tác và xác định học viên cần hỗ trợ thêm
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-[#eceef4] shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#6857DF] flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#777a91]">Điểm trung bình các lớp</p>
              <h3 className="text-2xl font-black text-[#252641]">82.5 / 100</h3>
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3" /> +4.2% so với tháng trước
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#eceef4] shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#777a91]">Thời lượng học tích lũy</p>
              <h3 className="text-2xl font-black text-[#252641]">420 giờ</h3>
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3" /> Độ chăm chỉ học viên cao
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#eceef4] shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#777a91]">Tỷ lệ bài nộp đúng hạn</p>
              <h3 className="text-2xl font-black text-[#252641]">91.4%</h3>
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3" /> Học viên tuân thủ lịch học
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Progress Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-[#eceef4] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-[#252641]">Tiến độ theo Khóa học</h2>
              <p className="text-xs text-[#777a91]">Tỷ lệ hoàn thành các bài học và bài kiểm tra</p>
            </div>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-5">
            {coursePerformance.map((c) => (
              <div key={c.title} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-[#252641]">{c.title}</span>
                  <span className="font-bold text-[#6857DF]">{c.completionRate}% hoàn thành</span>
                </div>
                <div className="w-full h-2.5 bg-[#eceef4] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#7966f2] to-[#6857DF] rounded-full"
                    style={{ width: `${c.completionRate}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-gray-400">
                  <span>{c.students} học viên</span>
                  <span>Điểm TB: {c.avgScore}/100</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Students needing support */}
        <div className="bg-white p-6 rounded-2xl border border-[#eceef4] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[#252641]">Học viên cần quan tâm & hỗ trợ</h2>
              <p className="text-xs text-[#777a91]">Học viên có tiến độ hoặc điểm kiểm tra dưới mức chuẩn</p>
            </div>
            <AlertCircle className="w-5 h-5 text-amber-500" />
          </div>

          <div className="space-y-3">
            {studentsNeedSupport.map((st) => (
              <div
                key={st.name}
                className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex flex-col justify-between gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#252641]">{st.name}</span>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    Tiến độ: {st.progress}% • Điểm: {st.avgScore}đ
                  </span>
                </div>
                <p className="text-[11px] text-[#777a91]">{st.course}</p>
                <div className="flex items-center justify-between text-[11px] text-amber-900 pt-1 border-t border-amber-200/60 mt-1">
                  <span>⚠ {st.issue}</span>
                  <button
                    onClick={() => alert(`Gửi tin nhắn hướng dẫn cho học viên ${st.name}`)}
                    className="text-xs font-bold text-[#6857DF] hover:underline"
                  >
                    Nhắn tin nhắc nhở
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
