import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { studentService, type StudentCourseItem, type StudentDashboardStats } from '../../services/studentService'
import { getFriendlyErrorMessage } from '../../lib/errorMessage'
import { CountUp } from '../../components/CountUp'
import { useAuth } from '../../hooks/useAuth'

type IconName =
  | 'book'
  | 'calendar'
  | 'trophy'
  | 'clock'
  | 'play'
  | 'sparkles'
  | 'arrow'
  | 'check'
  | 'target'

const iconContent: Record<IconName, ReactNode> = {
  book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" /><path d="M4 5.5v16M8 7h8M8 11h7" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" /></>,
  trophy: <><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 7H4v2a4 4 0 0 0 4 4M17 7h3v2a4 4 0 0 1-4 4" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  play: <><path d="m9 6 10 6-10 6z" fill="currentColor" stroke="none" /></>,
  sparkles: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9zM5 3l.7 1.3L7 5l-1.3.7L5 7l-.7-1.3L3 5l1.3-.7z" /></>,
  arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
}

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconContent[name]}
    </svg>
  )
}

const todayLabel = new Intl.DateTimeFormat('vi-VN', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(new Date()).toLocaleUpperCase('vi')

export function StudentDashboardPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [courses, setCourses] = useState<StudentCourseItem[]>([])
  const [stats, setStats] = useState<StudentDashboardStats | null>(null)
  const [filter, setFilter] = useState('Tất cả')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hour] = useState(() => new Date().getHours())

  useEffect(() => {
    if (!profile?.id) return
    let active = true
    Promise.all([studentService.getMyCourses(profile.id), studentService.getDashboardStats(profile.id)])
      .then(([coursesData, statsData]) => {
        if (!active) return
        setCourses(coursesData)
        setStats(statsData)
        setError(null)
      })
      .catch((err) => {
        if (active) setError(getFriendlyErrorMessage(err, 'Không thể tải dữ liệu học tập.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [profile?.id])

  const studentName = profile?.full_name || 'Học viên'
  const greeting = hour < 11 ? 'Chào buổi sáng' : hour < 14 ? 'Chào buổi trưa' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'
  const next = stats?.nextLesson ?? null
  const continueUrl = next ? `/student/learning/${next.courseId}/${next.lessonId}` : '/student/courses'
  const maxDayMinutes = Math.max(1, ...(stats?.weekly ?? []).map((d) => d.minutes))

  const visibleCourses = useMemo(() => {
    return courses.filter((course) => {
      if (filter === 'Đang học') return course.status === 'Đang học'
      if (filter === 'Hoàn thành') return course.status === 'Hoàn thành'
      return true
    })
  }, [courses, filter])

  return (
    <div className="page-content">
      {/* Welcome Row */}
      <section className="welcome-row hero-aurora">
        <div>
          <div className="date-label"><span className="date-dot" /> {todayLabel}</div>
          <h1>{greeting}, {studentName} <span className="wave">✦</span></h1>
          <p className="welcome-subtitle">Mỗi ngày một chút, bạn đang tiến gần hơn tới mục tiêu của mình.</p>
        </div>
        <button className="primary-button" onClick={() => navigate(continueUrl)}>
          <Icon name="play" size={16} /> {next ? 'Tiếp tục học' : 'Khám phá khóa học'} <Icon name="arrow" size={16} />
        </button>
      </section>

      {error && (
        <div role="alert" className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">{error}</div>
      )}

      {/* Stats Grid */}
      <section className="stats-grid" aria-label="Tổng quan tiến độ">
        <article className="stat-card">
          <div className="stat-top">
            <span className="stat-icon icon-violet"><Icon name="book" size={18} /></span>
            <span className="stat-trend">{stats ? `${stats.completedCoursesCount} đã hoàn thành` : ''}</span>
          </div>
          <div className="stat-value">
            <CountUp value={stats?.enrolledCoursesCount} /> <span>khóa học</span>
          </div>
          <div className="stat-caption">Khóa học đang tham gia</div>
          <div className="mini-bars"><i /><i /><i /><i /><i /><i /><i /></div>
        </article>

        <article className="stat-card">
          <div className="stat-top">
            <span className="stat-icon icon-green"><Icon name="clock" size={18} /></span>
            <span className="stat-trend">{stats ? `${stats.weekHours} giờ tuần này` : ''}</span>
          </div>
          <div className="stat-value">
            <CountUp value={stats?.studyHours} decimals={1} /> <span>giờ</span>
          </div>
          <div className="stat-caption">Thời gian học tập</div>
          <div className="mini-bars bars-green"><i /><i /><i /><i /><i /><i /><i /></div>
        </article>

        <article className="stat-card">
          <div className="stat-top">
            <span className="stat-icon icon-orange"><Icon name="trophy" size={18} /></span>
            <span className="stat-trend">
              {stats?.averageQuizScore != null ? `TB quiz ${stats.averageQuizScore}/100` : 'Chưa làm quiz'}
            </span>
          </div>
          <div className="stat-value">
            <CountUp value={stats?.points} /> <span>điểm</span>
          </div>
          <div className="stat-caption">Điểm tích lũy của bạn</div>
          <div className="mini-bars bars-orange"><i /><i /><i /><i /><i /><i /><i /></div>
        </article>

        <article className="stat-card">
          <div className="stat-top">
            <span className="stat-icon icon-pink"><Icon name="target" size={18} /></span>
            <span className="stat-trend">
              {stats ? `${stats.lessonsThisWeek}/${stats.weeklyGoalLessons} bài` : ''}
            </span>
          </div>
          <div className="stat-value">
            <CountUp value={stats?.weeklyGoalPercent} /><span className="percent">%</span>
          </div>
          <div className="stat-caption">Tiến độ mục tiêu tuần</div>
          <div className="stat-progress"><span style={{ width: `${stats?.weeklyGoalPercent ?? 0}%` }} /></div>
        </article>
      </section>

      {/* Main Dashboard Grid */}
      <div className="dashboard-grid">
        <section className="courses-section">
          <div className="section-heading">
            <div>
              <h2>Tiếp tục hành trình</h2>
              <p>Các khóa học của bạn đang học dở</p>
            </div>
            <button className="text-link" onClick={() => navigate('/student/courses')}>
              Tất cả khóa học <Icon name="arrow" size={16} />
            </button>
          </div>

          <div className="filter-tabs" role="tablist" aria-label="Lọc khóa học">
            {['Tất cả', 'Đang học', 'Hoàn thành'].map((tab) => (
              <button
                className={filter === tab ? 'selected' : ''}
                key={tab}
                onClick={() => setFilter(tab)}
                role="tab"
                aria-selected={filter === tab}
              >
                {tab}{tab === 'Tất cả' && <span className="tab-count">{courses.length}</span>}
              </button>
            ))}
          </div>

          <div className="course-list">
            {visibleCourses.length ? visibleCourses.map((course) => (
              <article className="course-card" key={course.id}>
                <div className={`course-art ${course.accent}`}>
                  <span>{course.illustration}</span>
                  <i /><b />
                </div>
                <div className="course-details">
                  <div className="course-meta">
                    <span>{course.category}</span>
                    {course.status === 'Hoàn thành' && (
                      <span className="completed-label"><Icon name="check" size={12} /> Hoàn thành</span>
                    )}
                  </div>
                  <h3>{course.title}</h3>
                  <div className="instructor">
                    <span className="instructor-avatar">{course.instructor.charAt(0)}</span>
                    {course.instructor}
                  </div>
                  <div className="course-progress-row">
                    <span>{course.lessonsCompleted} / {course.totalLessons} bài học</span>
                    <strong>{course.progress}%</strong>
                  </div>
                  <div className="progress-track">
                    <span
                      style={{ width: `${course.progress}%` }}
                      className={course.status === 'Hoàn thành' ? 'progress-complete' : ''}
                    />
                  </div>
                </div>
                <button
                  className="course-action"
                  aria-label={`Mở khóa học ${course.title}`}
                  onClick={() => navigate(`/student/learning/${course.id}`)}
                >
                  {course.status === 'Hoàn thành' ? <Icon name="check" size={18} /> : <Icon name="play" size={16} />}
                </button>
              </article>
            )) : (
              <div className="empty-state">
                {loading
                  ? 'Đang tải khóa học…'
                  : courses.length === 0
                  ? 'Bạn chưa đăng ký khóa học nào — hãy vào mục Khóa học để khám phá.'
                  : 'Không tìm thấy khóa học phù hợp.'}
              </div>
            )}
          </div>
        </section>

        {/* Right Column */}
        <aside className="right-column">
          <section className="weekly-card">
            <div className="section-heading compact">
              <div>
                <h2>Tiến độ tuần này</h2>
                <p>{stats && stats.lessonsThisWeek >= stats.weeklyGoalLessons ? 'Bạn đã đạt mục tiêu tuần!' : 'Thời gian học 7 ngày gần nhất'}</p>
              </div>
              <button className="more-button" aria-label="Xem thêm tiến độ" onClick={() => navigate('/student/achievements')}>
                ···
              </button>
            </div>
            <div className="weekly-total">
              <strong><CountUp value={stats?.weekHours} decimals={1} /></strong><span>giờ học</span>
            </div>
            <div className="chart" aria-label="Biểu đồ số phút học trong 7 ngày gần nhất">
              {(stats?.weekly ?? []).map((day, index) => (
                <div className="chart-column" key={`${day.label}-${index}`} title={`${day.label}: ${day.minutes} phút`}>
                  <div className="chart-bar-bg">
                    <span
                      style={{ height: `${Math.round((day.minutes / maxDayMinutes) * 100)}%` }}
                      className={day.isToday ? 'today-bar' : ''}
                    />
                  </div>
                  <small>{day.label}</small>
                </div>
              ))}
            </div>
            <div className="weekly-foot">
              <span><i /> Mục tiêu tuần</span>
              <strong>{stats ? `${stats.lessonsThisWeek} / ${stats.weeklyGoalLessons} bài học` : '…'}</strong>
            </div>
          </section>

          <section className="next-lesson">
            <div className="lesson-topline">
              <span className="lesson-tag">BÀI HỌC TIẾP THEO</span>
              {next && <span className="lesson-live"><i /> SẴN SÀNG</span>}
            </div>
            {next ? (
              <>
                <h3>{next.lessonTitle}</h3>
                <p>{next.courseTitle} <span>·</span> Bài {next.position}</p>
                <div className="lesson-info">
                  <span className="lesson-teacher">
                    <span className="teacher-avatar">{next.instructor.charAt(0)}</span> {next.instructor}
                  </span>
                </div>
                <button onClick={() => navigate(continueUrl)}>
                  Vào học <Icon name="arrow" size={15} />
                </button>
              </>
            ) : (
              <>
                <h3>{loading ? 'Đang tải…' : 'Bạn đã học hết các bài hiện có'}</h3>
                <p>Đăng ký thêm khóa học mới để tiếp tục hành trình.</p>
                <button onClick={() => navigate('/student/courses')}>
                  Khám phá khóa học <Icon name="arrow" size={15} />
                </button>
              </>
            )}
            <span className="lesson-decoration">f(x)</span>
          </section>

          <section className="ai-card">
            <div className="ai-icon"><Icon name="sparkles" size={20} /></div>
            <div>
              <strong>Trợ lý học tập AI</strong>
              <p>Sẵn sàng giải đáp mọi thắc mắc của bạn.</p>
            </div>
            <button aria-label="Mở trợ lý AI" onClick={() => navigate('/student/ai-assistant')}>
              <Icon name="arrow" size={17} />
            </button>
          </section>
        </aside>
      </div>

      <footer className="page-footer">
        © 2026 EduAI <span>•</span> Học thông minh, tiến bộ mỗi ngày
      </footer>
    </div>
  )
}
