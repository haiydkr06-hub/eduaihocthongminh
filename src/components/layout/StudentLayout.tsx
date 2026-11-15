import { useState, type ReactNode } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

type IconName =
  | 'grid'
  | 'book'
  | 'calendar'
  | 'trophy'
  | 'settings'
  | 'search'
  | 'bell'
  | 'chevron'
  | 'sparkles'
  | 'arrow'
  | 'check'
  | 'menu'
  | 'close'
  | 'logout'

const iconContent: Record<IconName, ReactNode> = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" /><path d="M4 5.5v16M8 7h8M8 11h7" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" /></>,
  trophy: <><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 7H4v2a4 4 0 0 0 4 4M17 7h3v2a4 4 0 0 1-4 4" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.6-1.4-2.4L7.3 15a8 8 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.7-1L11 7.3h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.6 1.4 2.4-1.4 1.1a8 8 0 0 1-.1 2z" transform="translate(-1 -1)" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
  chevron: <path d="m9 18 6-6-6-6" />,
  sparkles: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9zM5 3l.7 1.3L7 5l-1.3.7L5 7l-.7-1.3L3 5l1.3-.7z" /></>,
  arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
  close: <><path d="m18 6-12 12M6 6l12 12" /></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>,
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

const studentNavLinks: { path: string; label: string; icon: IconName }[] = [
  { path: '/student/dashboard', label: 'Tổng quan', icon: 'grid' },
  { path: '/student/courses', label: 'Khóa học của tôi', icon: 'book' },
  { path: '/student/schedule', label: 'Lịch học', icon: 'calendar' },
  { path: '/student/achievements', label: 'Thành tích', icon: 'trophy' },
  { path: '/student/ai-assistant', label: 'Trợ lý AI học tập', icon: 'sparkles' },
]

export function StudentLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [search, setSearch] = useState('')

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const studentName = profile?.full_name || 'Học viên'
  const studentInitials = studentName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0].toUpperCase())
    .join('') || 'HV'

  const currentNav = studentNavLinks.find(
    (item) => location.pathname === item.path || (item.path !== '/student/dashboard' && location.pathname.startsWith(item.path))
  )

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <NavLink to="/student/dashboard" className="brand">
          <span className="brand-mark"><Icon name="sparkles" size={22} /></span>
          <span>Edu<span className="brand-ai">AI</span><small>HỌC THÔNG MINH</small></span>
        </NavLink>

        <div className="sidebar-label">MENU CHÍNH</div>
        <nav className="main-nav" aria-label="Điều hướng chính">
          {studentNavLinks.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/student/dashboard' && location.pathname.startsWith(item.path))

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon name={item.icon} size={19} />
                <span>{item.label}</span>
                {item.label === 'Lịch học' && <span className="nav-dot" />}
              </NavLink>
            )
          })}
        </nav>

        <div className="sidebar-label sidebar-label-bottom">CÁ NHÂN</div>
        <NavLink
          to="/student/profile"
          onClick={() => setMenuOpen(false)}
          className={`nav-item ${location.pathname === '/student/profile' ? 'active' : ''}`}
        >
          <Icon name="settings" size={19} />
          <span>Cài đặt & Hồ sơ</span>
        </NavLink>

        <button className="nav-item" onClick={handleLogout} style={{ color: '#d94f63' }}>
          <Icon name="logout" size={19} />
          <span>Đăng xuất</span>
        </button>

        <div className="sidebar-spacer" />
        <div className="sidebar-help">
          <div className="help-spark"><Icon name="sparkles" size={19} /></div>
          <strong>Học cùng AI</strong>
          <p>Khám phá cách học phù hợp nhất với bạn.</p>
          <button onClick={() => navigate('/student/ai-assistant')}>
            Khám phá ngay <Icon name="arrow" size={15} />
          </button>
          <span className="help-orbit orbit-one" />
          <span className="help-orbit orbit-two" />
        </div>

        <button className="profile-card" onClick={() => navigate('/student/profile')}>
          <span className="avatar">{studentInitials}</span>
          <span className="profile-copy">
            <strong>{studentName}</strong>
            <small>Học viên EduAI</small>
          </span>
          <Icon name="chevron" size={17} />
        </button>
      </aside>

      {/* Main Area */}
      <main className="main-area">
        <header className="topbar">
          <button
            className="mobile-menu icon-button"
            aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} />
          </button>
          <div className="breadcrumb">
            <span>Không gian học tập</span>
            <Icon name="chevron" size={15} />
            <strong>{currentNav?.label || 'EduAI'}</strong>
          </div>
          <div className="topbar-actions">
            <label className="search-box">
              <Icon name="search" size={18} />
              <input
                aria-label="Tìm kiếm khóa học"
                placeholder="Tìm khóa học..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <kbd>⌘ K</kbd>
            </label>
            <div className="notification-wrap">
              <button
                className={`icon-button notification-button ${notificationsOpen ? 'is-open' : ''}`}
                aria-label="Thông báo"
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <Icon name="bell" size={19} /><span className="notification-dot" />
              </button>
              {notificationsOpen && (
                <div className="notification-popover">
                  <strong>Thông báo mới</strong>
                  <p><span className="notice-icon"><Icon name="calendar" size={15} /></span> Bạn có lịch học Toán lúc 15:30 hôm nay.</p>
                  <p><span className="notice-icon notice-green"><Icon name="trophy" size={15} /></span> Bạn sắp đạt mốc 7 ngày học liên tục!</p>
                </div>
              )}
            </div>
            <button
              className="top-avatar"
              aria-label={`Hồ sơ ${studentName}`}
              onClick={() => navigate('/student/profile')}
            >
              {studentInitials}
            </button>
          </div>
        </header>

        {/* Dynamic Nested Content */}
        <Outlet />
      </main>

      {menuOpen && <button className="sidebar-backdrop" aria-label="Đóng menu" onClick={() => setMenuOpen(false)} />}
    </div>
  )
}
