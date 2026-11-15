import {
  Trophy,
  Award,
  Sparkles,
  Flame,
  CheckCircle,
  Download,
} from 'lucide-react'

export function StudentAchievementsPage() {
  const badges = [
    {
      title: 'Chiến binh Kiên trì',
      description: 'Duy trì chuỗi học tập 7 ngày liên tục không gián đoạn.',
      icon: Flame,
      color: 'bg-amber-100 text-amber-600',
      unlockedAt: '12/11/2026',
    },
    {
      title: 'Bậc thầy Toán học',
      description: 'Đạt điểm từ 90 trở lên trong chuyên đề Hàm số bậc hai.',
      icon: Award,
      color: 'bg-purple-100 text-[#6857DF]',
      unlockedAt: '05/11/2026',
    },
    {
      title: 'Bứt phá Tốc độ',
      description: 'Hoàn thành bài kiểm tra 15 phút chỉ trong 8 phút.',
      icon: Sparkles,
      color: 'bg-blue-100 text-blue-600',
      unlockedAt: '28/10/2026',
    },
    {
      title: 'Người học Tiên phong',
      description: 'Gia nhập nền tảng học thông minh EduAI.',
      icon: Trophy,
      color: 'bg-emerald-100 text-emerald-600',
      unlockedAt: '15/10/2026',
    },
  ]

  const certificates = [
    {
      courseTitle: 'Tiếng Anh giao tiếp & Ngữ pháp thông minh',
      instructor: 'Cô Lê Thu Hà',
      issueDate: '01/11/2026',
      grade: 'Xuất sắc (100% hoàn thành)',
    },
  ]

  return (
    <div className="page-content space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#252641]">Thành tích & Chứng chỉ</h1>
        <p className="text-sm text-[#777a91]">
          Ghi nhận nỗ lực rèn luyện, các huy hiệu danh giá và chứng chỉ hoàn tất chương trình học
        </p>
      </div>

      {/* Progress Streak Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-3xl border border-[#eceef4] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-[#777a91]">Chuỗi học tập (Streak)</p>
            <h3 className="text-2xl font-black text-[#252641]">07 ngày</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#eceef4] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#6857DF] flex items-center justify-center font-bold">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-[#777a91]">Tổng điểm tích lũy</p>
            <h3 className="text-2xl font-black text-[#252641]">860 điểm</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#eceef4] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-[#777a91]">Xếp hạng học tập</p>
            <h3 className="text-2xl font-black text-[#252641]">Top 15%</h3>
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="bg-white rounded-3xl border border-[#eceef4] p-6 shadow-sm">
        <h2 className="text-base font-bold text-[#252641] mb-4">Huy hiệu thành tích đã mở khóa</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {badges.map((b, i) => {
            const Icon = b.icon
            return (
              <div
                key={i}
                className="p-4 rounded-2xl border border-[#eceef4] bg-[#f7f8fc]/50 hover:bg-[#F0EDFF]/30 transition flex flex-col justify-between"
              >
                <div>
                  <div className={`w-10 h-10 rounded-xl ${b.color} flex items-center justify-center mb-3`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-xs font-bold text-[#252641] mb-1">{b.title}</h3>
                  <p className="text-[11px] text-[#777a91]">{b.description}</p>
                </div>
                <span className="text-[10px] text-gray-400 mt-3 pt-2 border-t border-[#eceef4]">
                  Đạt ngày {b.unlockedAt}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Certificates */}
      <div className="bg-white rounded-3xl border border-[#eceef4] p-6 shadow-sm">
        <h2 className="text-base font-bold text-[#252641] mb-4">Chứng chỉ hoàn thành khóa học</h2>
        <div className="space-y-3">
          {certificates.map((cert, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl border border-purple-200 bg-[#F0EDFF]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#6857DF] text-white flex items-center justify-center font-bold">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#252641]">{cert.courseTitle}</h3>
                  <p className="text-xs text-[#777a91]">
                    Giảng viên: {cert.instructor} • Ngày cấp: {cert.issueDate}
                  </p>
                  <span className="inline-block text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full mt-1">
                    {cert.grade}
                  </span>
                </div>
              </div>

              <button
                onClick={() => alert(`Đang tải chứng chỉ hoàn tất môn học "${cert.courseTitle}"...`)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-[#eceef4] text-[#6857DF] text-xs font-bold rounded-xl transition shadow-sm"
              >
                <Download className="w-4 h-4" /> Tải chứng chỉ (PDF)
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
