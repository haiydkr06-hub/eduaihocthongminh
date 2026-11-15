import { useEffect, useState } from 'react'
import { Trophy, Award, Sparkles, Flame, CheckCircle, Download, BookOpen, Compass } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { getFriendlyErrorMessage } from '../../lib/errorMessage'
import { studentService, type AchievementBadge, type StudentAchievements } from '../../services/studentService'

const BADGE_STYLE: Record<AchievementBadge['key'], { icon: typeof Trophy; color: string }> = {
  first_step: { icon: BookOpen, color: 'bg-emerald-100 text-emerald-600' },
  streak: { icon: Flame, color: 'bg-amber-100 text-amber-600' },
  quiz_master: { icon: Sparkles, color: 'bg-blue-100 text-blue-600' },
  course_done: { icon: Award, color: 'bg-purple-100 text-[#6857DF]' },
  explorer: { icon: Compass, color: 'bg-pink-100 text-pink-600' },
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)

/** Mở chứng chỉ dạng trang in (trình duyệt cho phép "Lưu thành PDF") — trước đây chỉ là alert giả. */
function printCertificate(studentName: string, courseTitle: string, instructor: string, completedAt: string | null) {
  const win = window.open('', '_blank', 'width=900,height=650')
  if (!win) return false
  const date = completedAt ? new Date(completedAt).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN')
  win.document.write(`<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><title>Chứng chỉ - ${escapeHtml(courseTitle)}</title>
<style>body{font-family:'Segoe UI',Arial,sans-serif;margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f7f8fc}
.c{width:820px;padding:56px;border:10px solid #6857DF;border-radius:24px;background:#fff;text-align:center;color:#303147}
h1{color:#6857DF;font-size:40px;margin:0 0 8px}h2{font-size:30px;margin:24px 0 8px}p{color:#62657a;font-size:16px;margin:6px 0}
.s{margin-top:40px;display:flex;justify-content:space-between;font-size:14px;color:#62657a}@media print{body{background:#fff}}</style></head>
<body><div class="c"><p>NỀN TẢNG HỌC TẬP EDUAI</p><h1>CHỨNG NHẬN HOÀN THÀNH</h1><p>Chứng nhận học viên</p>
<h2>${escapeHtml(studentName)}</h2><p>đã hoàn thành toàn bộ bài học của khóa</p><h2>${escapeHtml(courseTitle)}</h2>
<div class="s"><span>Giảng viên: ${escapeHtml(instructor)}</span><span>Ngày cấp: ${date}</span></div></div>
<script>window.onload=function(){window.print()}</script></body></html>`)
  win.document.close()
  return true
}

export function StudentAchievementsPage() {
  const { profile } = useAuth()
  const [data, setData] = useState<StudentAchievements | null>(null)
  const [points, setPoints] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!profile?.id) return
    let active = true
    Promise.all([studentService.getAchievements(profile.id), studentService.getDashboardStats(profile.id)])
      .then(([a, stats]) => {
        if (!active) return
        setData(a)
        setPoints(stats.points)
      })
      .catch((err) => active && setError(getFriendlyErrorMessage(err, 'Không thể tải thành tích.')))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [profile?.id])

  const handleDownload = (cert: StudentAchievements['certificates'][number]) => {
    const ok = printCertificate(profile?.full_name || 'Học viên', cert.courseTitle, cert.instructor, cert.completedAt)
    if (!ok) setError('Trình duyệt đã chặn cửa sổ chứng chỉ. Hãy cho phép pop-up rồi thử lại.')
  }

  const unlockedCount = data?.badges.filter((b) => b.unlocked).length ?? 0

  return (
    <div className="page-content space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#252641]">Thành tích & Chứng chỉ</h1>
        <p className="text-sm text-[#777a91]">
          Ghi nhận nỗ lực rèn luyện, các huy hiệu và chứng chỉ hoàn tất chương trình học
        </p>
      </div>

      {error && (
        <div role="alert" className="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-3xl border border-[#eceef4] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-[#777a91]">Chuỗi học tập (Streak)</p>
            <h3 className="text-2xl font-black text-[#252641]">{loading ? '…' : `${data?.streakDays ?? 0} ngày`}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#eceef4] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#6857DF] flex items-center justify-center font-bold">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-[#777a91]">Tổng điểm tích lũy</p>
            <h3 className="text-2xl font-black text-[#252641]">{loading ? '…' : `${points ?? 0} điểm`}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#eceef4] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-[#777a91]">Huy hiệu đã mở khóa</p>
            <h3 className="text-2xl font-black text-[#252641]">
              {loading ? '…' : `${unlockedCount} / ${data?.badges.length ?? 0}`}
            </h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[#eceef4] p-6 shadow-sm">
        <h2 className="text-base font-bold text-[#252641] mb-4">Huy hiệu thành tích</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {(data?.badges ?? []).map((b) => {
            const { icon: Icon, color } = BADGE_STYLE[b.key]
            return (
              <div
                key={b.key}
                className={`p-4 rounded-2xl border border-[#eceef4] flex flex-col justify-between transition ${
                  b.unlocked ? 'bg-[#f7f8fc]/50' : 'bg-white opacity-70'
                }`}
              >
                <div>
                  <div className={`w-10 h-10 rounded-xl ${b.unlocked ? color : 'bg-gray-100 text-gray-400'} flex items-center justify-center mb-3`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-xs font-bold text-[#252641] mb-1">{b.title}</h3>
                  <p className="text-[11px] text-[#777a91]">{b.description}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-[#eceef4]">
                  {b.unlocked ? (
                    <span className="text-[10px] font-bold text-emerald-700">✓ Đã mở khóa</span>
                  ) : (
                    <>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden" aria-hidden="true">
                        <div className="h-full bg-[#6857DF] rounded-full" style={{ width: `${b.progress}%` }} />
                      </div>
                      <span className="text-[10px] text-gray-500">Chưa mở khóa • {b.progress}%</span>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[#eceef4] p-6 shadow-sm">
        <h2 className="text-base font-bold text-[#252641] mb-4">Chứng chỉ hoàn thành khóa học</h2>
        <div className="space-y-3">
          {!data || data.certificates.length === 0 ? (
            <p className="text-xs text-[#777a91]">
              {loading ? 'Đang tải…' : 'Bạn chưa hoàn thành khóa học nào. Học hết các bài của một khóa để nhận chứng chỉ.'}
            </p>
          ) : (
            data.certificates.map((cert) => (
              <div
                key={cert.courseId}
                className="p-5 rounded-2xl border border-purple-200 bg-[#F0EDFF]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#6857DF] text-white flex items-center justify-center font-bold">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#252641]">{cert.courseTitle}</h3>
                    <p className="text-xs text-[#777a91]">
                      Giảng viên: {cert.instructor}
                      {cert.completedAt && ` • Hoàn thành: ${new Date(cert.completedAt).toLocaleDateString('vi-VN')}`}
                    </p>
                    <span className="inline-block text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full mt-1">
                      100% bài học hoàn thành
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleDownload(cert)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-[#eceef4] text-[#6857DF] text-xs font-bold rounded-xl transition shadow-sm"
                >
                  <Download className="w-4 h-4" /> In / Lưu PDF
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
