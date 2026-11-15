import { useNavigate } from 'react-router-dom'
import {
  Calendar as CalendarIcon,
  Clock,
  Play,
  FileCheck,
} from 'lucide-react'

export function StudentSchedulePage() {
  const navigate = useNavigate()

  const liveClasses = [
    {
      id: 'sc-1',
      title: 'Hàm số bậc hai và Phương trình Parabol',
      course: 'Toán học tư duy bậc THPT',
      teacher: 'Cô Nguyễn Minh Anh',
      time: '15:30 – 16:15',
      date: 'Hôm nay (Thứ Bảy)',
      isLiveNow: true,
      courseId: 'tc-1',
    },
    {
      id: 'sc-2',
      title: 'Định luật vạn vật hấp dẫn và Trọng trường',
      course: 'Khám phá thế giới khoa học',
      teacher: 'Thầy Trần Hoàng Nam',
      time: '08:30 – 09:30',
      date: 'Thứ Hai tới',
      isLiveNow: false,
      courseId: 'tc-2',
    },
    {
      id: 'sc-3',
      title: 'Luyện phản xạ giao tiếp & Thảo luận chủ đề du lịch',
      course: 'Tiếng Anh giao tiếp thông minh',
      teacher: 'Cô Lê Thu Hà',
      time: '19:00 – 20:00',
      date: 'Thứ Tư tới',
      isLiveNow: false,
      courseId: 'tc-3',
    },
  ]

  const upcomingQuizzes = [
    {
      title: 'Kiểm tra 15 phút: Hàm số và Đồ thị',
      course: 'Toán học tư duy',
      deadline: '23:59 Chủ Nhật tuần này',
      duration: '15 phút',
      quizId: 'q-1',
    },
    {
      title: 'Bài tập tuần: Động lực học chất điểm',
      course: 'Khám phá thế giới khoa học',
      deadline: '23:59 Thứ Ba tới',
      duration: '20 phút',
      quizId: 'q-1',
    },
  ]

  return (
    <div className="page-content space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#252641]">Lịch học & Lịch kiểm tra</h1>
        <p className="text-sm text-[#777a91]">
          Theo dõi các buổi học trực tuyến và hạn chót nộp bài tập để không bỏ lỡ kiến thức
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Online Classes Schedule */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-bold text-[#252641] flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-[#6857DF]" /> Lớp học trực tuyến sắp diễn ra
          </h2>

          <div className="space-y-4">
            {liveClasses.map((item) => (
              <div
                key={item.id}
                className={`p-5 rounded-3xl border transition shadow-sm ${
                  item.isLiveNow
                    ? 'border-[#6857DF] bg-[#F0EDFF]/40'
                    : 'border-[#eceef4] bg-white'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold text-[#6857DF] bg-purple-100 px-2.5 py-0.5 rounded-full">
                        {item.course}
                      </span>
                      {item.isLiveNow && (
                        <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                          ● SẮP DIỄN RA
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-[#252641]">{item.title}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#777a91] mt-2">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-purple-600" /> {item.date} • {item.time}
                      </span>
                      <span>Giáo viên: <strong>{item.teacher}</strong></span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/student/learn/${item.courseId}`)}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#6857DF] hover:bg-[#5144BE] text-white text-xs font-bold transition shadow-md shadow-[#6857DF]/20 flex-shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" /> Vào phòng học
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Upcoming Quizzes */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-[#252641] flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-purple-600" /> Bài tập & Hạn nộp
          </h2>

          <div className="bg-white rounded-3xl border border-[#eceef4] p-5 shadow-sm space-y-4">
            {upcomingQuizzes.map((quiz, i) => (
              <div key={i} className="p-4 rounded-2xl border border-[#eceef4] bg-[#f7f8fc]/60 space-y-2">
                <h4 className="text-xs font-bold text-[#252641]">{quiz.title}</h4>
                <p className="text-[11px] text-[#6857DF]">{quiz.course}</p>
                <div className="flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-[#eceef4]">
                  <span>Hạn: {quiz.deadline}</span>
                  <button
                    onClick={() => navigate(`/student/quiz/${quiz.quizId}`)}
                    className="text-xs font-bold text-[#6857DF] hover:underline"
                  >
                    Làm bài →
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
