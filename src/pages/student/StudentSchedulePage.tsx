import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar as CalendarIcon, Clock, Play, FileCheck } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { getFriendlyErrorMessage } from '../../lib/errorMessage'
import {
  studentService,
  type StudentCourseItem,
  type StudentQuizItem,
} from '../../services/studentService'

/** Lịch học = kế hoạch học tập thực tế: khóa đang học dở + bài kiểm tra chưa đạt (không còn lịch giả). */
export function StudentSchedulePage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [courses, setCourses] = useState<StudentCourseItem[]>([])
  const [quizzes, setQuizzes] = useState<StudentQuizItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!profile?.id) return
    let active = true
    Promise.all([studentService.getMyCourses(profile.id), studentService.getMyQuizzes(profile.id)])
      .then(([c, q]) => {
        if (!active) return
        setCourses(c.filter((x) => x.status === 'Đang học'))
        setQuizzes(q.filter((x) => x.bestScore === null || x.bestScore < x.pass_score))
      })
      .catch((err) => active && setError(getFriendlyErrorMessage(err, 'Không thể tải kế hoạch học tập.')))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [profile?.id])

  return (
    <div className="page-content space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#252641]">Kế hoạch học tập & Bài kiểm tra</h1>
        <p className="text-sm text-[#777a91]">
          Các khóa học bạn đang học dở và những bài kiểm tra chưa hoàn thành hoặc chưa đạt
        </p>
      </div>

      {error && (
        <div role="alert" className="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-bold text-[#252641] flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-[#6857DF]" /> Khóa học đang học dở
          </h2>

          <div className="space-y-4">
            {loading ? (
              <p className="text-sm text-[#777a91]">Đang tải…</p>
            ) : courses.length === 0 ? (
              <div className="p-5 rounded-3xl border border-[#eceef4] bg-white text-sm text-[#777a91]">
                Bạn không có khóa học nào đang học dở.{' '}
                <button onClick={() => navigate('/student/courses')} className="text-[#6857DF] font-bold hover:underline">
                  Khám phá khóa học →
                </button>
              </div>
            ) : (
              courses.map((item) => (
                <div key={item.id} className="p-5 rounded-3xl border border-[#eceef4] bg-white transition shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-[#6857DF] bg-purple-100 px-2.5 py-0.5 rounded-full">
                        {item.category}
                      </span>
                      <h3 className="text-base font-bold text-[#252641] mt-2">{item.title}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-[#777a91] mt-2">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-purple-600" />
                          {item.lessonsCompleted}/{item.totalLessons} bài • {item.progress}%
                        </span>
                        <span>Giảng viên: <strong>{item.instructor}</strong></span>
                        {item.lastActivityAt && (
                          <span>Học gần nhất: {new Date(item.lastActivityAt).toLocaleDateString('vi-VN')}</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/student/learning/${item.id}`)}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#6857DF] hover:bg-[#5144BE] text-white text-xs font-bold transition shadow-md shadow-[#6857DF]/20 flex-shrink-0"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" /> Học tiếp
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-base font-bold text-[#252641] flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-purple-600" /> Bài kiểm tra cần làm
          </h2>

          <div className="bg-white rounded-3xl border border-[#eceef4] p-5 shadow-sm space-y-4">
            {loading ? (
              <p className="text-xs text-[#777a91]">Đang tải…</p>
            ) : quizzes.length === 0 ? (
              <p className="text-xs text-[#777a91]">Bạn đã hoàn thành và đạt tất cả bài kiểm tra hiện có. 🎉</p>
            ) : (
              quizzes.map((quiz) => (
                <div key={quiz.id} className="p-4 rounded-2xl border border-[#eceef4] bg-[#f7f8fc]/60 space-y-2">
                  <h4 className="text-xs font-bold text-[#252641]">{quiz.title}</h4>
                  <p className="text-[11px] text-[#6857DF]">{quiz.course_title}</p>
                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-[#eceef4]">
                    <span>
                      {quiz.time_limit_minutes} phút •{' '}
                      {quiz.bestScore === null ? 'Chưa làm' : `Cao nhất ${Math.round(quiz.bestScore)} — cần ${quiz.pass_score}`}
                    </span>
                    <button
                      onClick={() => navigate(`/student/quiz/${quiz.id}`)}
                      className="text-xs font-bold text-[#6857DF] hover:underline"
                    >
                      Làm bài →
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
