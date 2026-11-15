import { useState } from 'react'
import {
  BarChart3,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  Award,
} from 'lucide-react'

export function AdminReportsPage() {
  const [timeRange, setTimeRange] = useState('month')
  const [downloading, setDownloading] = useState(false)

  const subjectStats = [
    { subject: 'Toán học tư duy', students: 85, completionRate: 72, avgScore: 82.5, color: '#7966f2' },
    { subject: 'Khám phá khoa học', students: 64, completionRate: 65, avgScore: 74.0, color: '#43A783' },
    { subject: 'Tiếng Anh giao tiếp', students: 120, completionRate: 88, avgScore: 88.2, color: '#E8A142' },
    { subject: 'Công nghệ & Lập trình AI', students: 42, completionRate: 58, avgScore: 79.5, color: '#3178c6' },
  ]

  const gradeDistribution = [
    { grade: 'Xuất sắc (90 - 100đ)', percent: 28, count: 145, color: 'bg-purple-600' },
    { grade: 'Giỏi (80 - 89đ)', percent: 42, count: 218, color: 'bg-emerald-500' },
    { grade: 'Khá (65 - 79đ)', percent: 22, count: 115, color: 'bg-blue-500' },
    { grade: 'Trung bình (< 65đ)', percent: 8, count: 42, color: 'bg-amber-500' },
  ]

  const handleExportCSV = () => {
    setDownloading(true)
    setTimeout(() => {
      const csvContent =
        'data:text/csv;charset=utf-8,' +
        'Mon hoc,So hoc vien,Ty le hoan thanh,Diem trung binh\n' +
        subjectStats.map((s) => `${s.subject},${s.students},${s.completionRate}%,${s.avgScore}`).join('\n')
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement('a')
      link.setAttribute('href', encodedUri)
      link.setAttribute('download', `EduAI_Report_${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setDownloading(false)
    }, 600)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#252641]">Thống kê & Báo cáo Hệ thống</h1>
          <p className="text-sm text-[#777a91]">
            Số liệu tổng hợp về tỷ lệ hoàn thành, thời gian học tập và kết quả đánh giá chất lượng đào tạo
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-[#eceef4] rounded-xl p-1 text-xs">
            <button
              onClick={() => setTimeRange('week')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                timeRange === 'week' ? 'bg-[#6857DF] text-white' : 'text-[#777a91] hover:text-[#252641]'
              }`}
            >
              Tuần này
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                timeRange === 'month' ? 'bg-[#6857DF] text-white' : 'text-[#777a91] hover:text-[#252641]'
              }`}
            >
              Tháng này
            </button>
            <button
              onClick={() => setTimeRange('year')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                timeRange === 'year' ? 'bg-[#6857DF] text-white' : 'text-[#777a91] hover:text-[#252641]'
              }`}
            >
              Cả năm
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#6857DF] hover:bg-[#5144BE] text-white text-xs font-bold transition shadow-sm"
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Đang tạo...' : 'Xuất file CSV'}
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-[#eceef4] shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#6857DF] flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#777a91]">Tổng giờ học tích lũy</p>
              <h3 className="text-2xl font-black text-[#252641]">1,840 giờ</h3>
            </div>
          </div>
          <p className="text-[11px] text-emerald-600 font-bold mt-2">↑ Tăng 24% so với kỳ trước</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#eceef4] shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#777a91]">Tỷ lệ hoàn tất khóa học</p>
              <h3 className="text-2xl font-black text-[#252641]">74.5%</h3>
            </div>
          </div>
          <p className="text-[11px] text-emerald-600 font-bold mt-2">↑ Mức độ hoàn thành cao</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#eceef4] shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#777a91]">Điểm trung bình toàn khóa</p>
              <h3 className="text-2xl font-black text-[#252641]">81.0 / 100</h3>
            </div>
          </div>
          <p className="text-[11px] text-emerald-600 font-bold mt-2">↑ Tỷ lệ đạt chuẩn 92%</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Completion Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-[#eceef4] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-[#252641]">Tỷ lệ hoàn thành theo Bộ môn</h2>
              <p className="text-xs text-[#777a91]">Thống kê tiến độ học viên theo từng chuyên ngành</p>
            </div>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-5">
            {subjectStats.map((item) => (
              <div key={item.subject}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-[#252641]">{item.subject}</span>
                  <span className="font-bold text-[#6857DF]">{item.completionRate}% hoàn thành</span>
                </div>
                <div className="w-full h-3 bg-[#f7f8fc] rounded-full overflow-hidden border border-[#eceef4]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.completionRate}%`, backgroundColor: item.color }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                  <span>{item.students} học viên</span>
                  <span>Điểm TB: {item.avgScore}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Grade Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-[#eceef4] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-[#252641]">Phổ điểm & Xếp loại kết quả</h2>
              <p className="text-xs text-[#777a91]">Tỷ lệ phân bố thành tích trong các đợt kiểm tra</p>
            </div>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {gradeDistribution.map((item) => (
              <div key={item.grade} className="p-3.5 rounded-xl border border-[#eceef4] bg-[#f7f8fc]/50">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-[#252641]">{item.grade}</span>
                  <span className="font-black text-[#252641]">{item.count} lượt ({item.percent}%)</span>
                </div>
                <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-500`}
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
