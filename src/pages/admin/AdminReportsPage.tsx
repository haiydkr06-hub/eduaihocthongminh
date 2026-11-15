import { useEffect, useState } from 'react'
import { BarChart3, Download, Calendar, CheckCircle2, Clock, Award } from 'lucide-react'
import { adminService, type AdminReport } from '../../services/adminService'
import { getFriendlyErrorMessage } from '../../lib/errorMessage'

const SUBJECT_COLORS = ['#6857DF', '#43A783', '#E8A142', '#3178c6', '#D94F63']
const GRADE_COLORS = ['bg-purple-600', 'bg-emerald-500', 'bg-blue-500', 'bg-amber-500']

export function AdminReportsPage() {
  const [report, setReport] = useState<AdminReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    adminService
      .getReport()
      .then((data) => active && setReport(data))
      .catch((err) => active && setError(getFriendlyErrorMessage(err, 'Không thể tải báo cáo.')))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  /** Xuất CSV UTF-8 có BOM để Excel hiển thị đúng tiếng Việt (trước đây bỏ dấu và dùng số liệu giả). */
  const handleExportCSV = () => {
    if (!report) return
    const escape = (v: string | number | null) => {
      const text = v === null ? '' : String(v)
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
    }
    const rows = [
      ['Bộ môn', 'Số khóa học', 'Số học viên', 'Lượt làm quiz', 'Điểm trung bình', 'Tỷ lệ đạt (%)'],
      ...report.subjects.map((s) => [s.category, s.courses, s.students, s.attempts, s.avgScore, s.passRate]),
    ]
    const csv = '﻿' + rows.map((r) => r.map(escape).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `EduAI_BaoCao_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const show = (v: number | null | undefined, suffix = '') => (loading ? '…' : v === null || v === undefined ? '—' : `${v}${suffix}`)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#252641]">Thống kê & Báo cáo Hệ thống</h1>
          <p className="text-sm text-[#777a91]">
            Số liệu tổng hợp từ dữ liệu thật: tỷ lệ hoàn thành, kết quả kiểm tra theo bộ môn và phổ điểm
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={!report}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#6857DF] hover:bg-[#5144BE] text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
        >
          <Download className="w-4 h-4" /> Xuất file CSV
        </button>
      </div>

      {error && (
        <div role="alert" className="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">{error}</div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-[#eceef4] shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#6857DF] flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#777a91]">Tổng lượt làm bài kiểm tra</p>
              <h3 className="text-2xl font-black text-[#252641]">{show(report?.totalAttempts, ' lượt')}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#eceef4] shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#777a91]">Tỷ lệ hoàn tất khóa học</p>
              <h3 className="text-2xl font-black text-[#252641]">{show(report?.courseCompletionRate, '%')}</h3>
            </div>
          </div>
          <p className="text-[11px] text-[#777a91] mt-2">Lượt ghi danh đã học hết toàn bộ bài học</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#eceef4] shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#777a91]">Điểm trung bình toàn hệ thống</p>
              <h3 className="text-2xl font-black text-[#252641]">{show(report?.overallAvgScore, ' / 100')}</h3>
            </div>
          </div>
          <p className="text-[11px] text-emerald-600 font-bold mt-2">Tỷ lệ đạt: {show(report?.overallPassRate, '%')}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-[#eceef4] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-[#252641]">Tỷ lệ đạt theo Bộ môn</h2>
              <p className="text-xs text-[#777a91]">% lượt làm quiz đạt điểm chuẩn của từng bộ môn</p>
            </div>
            <BarChart3 className="w-5 h-5 text-gray-400" aria-hidden="true" />
          </div>

          <div className="space-y-5">
            {!report || report.subjects.length === 0 ? (
              <p className="text-xs text-[#777a91]">{loading ? 'Đang tải…' : 'Chưa có dữ liệu.'}</p>
            ) : (
              report.subjects.map((item, idx) => (
                <div key={item.category}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-[#252641]">{item.category}</span>
                    <span className="font-bold text-[#6857DF]">
                      {item.passRate === null ? 'Chưa có lượt làm' : `${item.passRate}% đạt`}
                    </span>
                  </div>
                  <div
                    className="w-full h-3 bg-[#f7f8fc] rounded-full overflow-hidden border border-[#eceef4]"
                    role="img"
                    aria-label={`${item.category}: ${item.passRate ?? 0}% đạt`}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.passRate ?? 0}%`, backgroundColor: SUBJECT_COLORS[idx % SUBJECT_COLORS.length] }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-500 mt-1">
                    <span>{item.courses} khóa • {item.students} học viên • {item.attempts} lượt làm</span>
                    <span>Điểm TB: {item.avgScore ?? '—'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#eceef4] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-[#252641]">Phổ điểm & Xếp loại kết quả</h2>
              <p className="text-xs text-[#777a91]">Phân bố điểm của toàn bộ lượt làm bài kiểm tra</p>
            </div>
            <Calendar className="w-5 h-5 text-gray-400" aria-hidden="true" />
          </div>

          <div className="space-y-4">
            {(report?.gradeDistribution ?? []).map((item, idx) => (
              <div key={item.label} className="p-3.5 rounded-xl border border-[#eceef4] bg-[#f7f8fc]/50">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-[#252641]">{item.label}</span>
                  <span className="font-black text-[#252641]">{item.count} lượt ({item.percent}%)</span>
                </div>
                <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${GRADE_COLORS[idx]} rounded-full transition-all duration-500`}
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
