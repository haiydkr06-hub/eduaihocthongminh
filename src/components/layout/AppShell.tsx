import { useEffect, useState, type ComponentType, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Menu, Sparkles, X } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export interface ShellNavItem {
  path: string
  label: string
  icon: ComponentType<{ className?: string }>
  badge?: string
  /** Khớp chính xác đường dẫn (dùng cho trang tổng quan) */
  exact?: boolean
}

export interface ShellNavSection {
  label: string
  items: ShellNavItem[]
}

interface AppShellProps {
  roleLabel: string
  sections: ShellNavSection[]
  /** Nhãn nhỏ phía trên tiêu đề trang ở header */
  kicker: string
  /** Nội dung chèn giữa header (vd: ô tìm kiếm) */
  headerCenter?: ReactNode
  /** Nút/biểu tượng bên phải header (trước avatar) */
  headerActions?: ReactNode
  /** Khối thêm ở cuối sidebar (vd: thẻ "Hỏi AI") */
  sidebarExtra?: (close: () => void) => ReactNode
  /** Nút chuyển cổng ở chân sidebar */
  switchPortal?: { label: string; to: string }
  profilePath?: string
}

function initialsOf(name: string, fallback: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(-2)
      .map((w) => w[0].toUpperCase())
      .join('') || fallback
  )
}

/** Nền cực quang chuyển động phía sau nội dung */
export function AuroraBackground({ contained = false }: { contained?: boolean }) {
  return (
    <div className={`aurora${contained ? ' !absolute' : ''}`} aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  )
}

/**
 * Khung giao diện dùng chung cho Học viên / Giảng viên / Admin:
 * sidebar tím đêm + header kính mờ + nền cực quang + hiệu ứng chuyển trang.
 */
export function AppShell({
  roleLabel,
  sections,
  kicker,
  headerCenter,
  headerActions,
  sidebarExtra,
  switchPortal,
  profilePath,
}: AppShellProps) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const close = () => setMenuOpen(false)

  // Đóng menu mobile bằng phím Escape
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  const isActive = (item: ShellNavItem) =>
    item.exact ? location.pathname === item.path : location.pathname === item.path || location.pathname.startsWith(item.path + '/')

  const allItems = sections.flatMap((s) => s.items)
  const current = allItems.find(isActive)
  const name = profile?.full_name || roleLabel
  const initials = initialsOf(name, roleLabel.slice(0, 2).toUpperCase())

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex text-[#1f1d3a]">
      <AuroraBackground />

      {/* Lớp phủ khi mở menu trên mobile */}
      {menuOpen && (
        <button
          className="fixed inset-0 z-40 bg-[#17133a]/50 backdrop-blur-sm lg:hidden"
          onClick={close}
          aria-label="Đóng menu"
        />
      )}

      {/* ============== SIDEBAR ============== */}
      <aside
        className={`shell-sidebar fixed inset-y-0 left-0 z-50 w-[270px] flex flex-col text-white transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Điều hướng chính"
      >
        <div className="relative flex items-center justify-between px-6 pt-6 pb-7">
          <NavLink to={allItems[0]?.path || '/'} onClick={close} className="flex items-center gap-3 group">
            <span className="brand-orb w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg shadow-[#8b7bff]/30 transition-transform duration-500 group-hover:rotate-[8deg] group-hover:scale-105">
              <Sparkles className="w-5 h-5 text-[#ffd6ec]" />
            </span>
            <span>
              <span className="block font-display text-[22px] font-extrabold tracking-tight leading-none">
                <span className="text-white">Edu</span>
                <span className="text-gradient">AI</span>
              </span>
              <span className="mt-1.5 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
                <span className="live-dot w-1.5 h-1.5 rounded-full bg-emerald-400 text-emerald-400" />
                {roleLabel}
              </span>
            </span>
          </NavLink>
          <button onClick={close} className="lg:hidden p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10" aria-label="Đóng menu">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="relative flex-1 overflow-y-auto px-4 pb-4 space-y-6">
          {sections.map((section) => (
            <div key={section.label}>
              <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">{section.label}</p>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const active = isActive(item)
                  const Icon = item.icon
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        onClick={close}
                        aria-current={active ? 'page' : undefined}
                        className={`shell-nav-item flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold ${
                          active ? 'is-active text-white' : 'text-white/65 hover:text-white hover:bg-white/[0.07]'
                        }`}
                      >
                        <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${active ? 'text-white' : 'text-white/45'}`} />
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge && (
                          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold tracking-wide bg-gradient-to-r from-[#ec6fb4] to-[#f5a524] text-white shadow">
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}

          {sidebarExtra?.(close)}
        </nav>

        {/* Chân sidebar: chuyển cổng + người dùng */}
        <div className="relative p-4 space-y-3 border-t border-white/10">
          {switchPortal && (
            <button
              onClick={() => {
                close()
                navigate(switchPortal.to)
              }}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-white/75 bg-white/[0.06] hover:bg-white/[0.12] hover:text-white transition"
            >
              <span>{switchPortal.label}</span>
              <span aria-hidden="true">→</span>
            </button>
          )}
          <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.07] border border-white/10">
            <button
              onClick={() => profilePath && navigate(profilePath)}
              className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#8b7bff] to-[#ec6fb4] flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-lg shadow-[#ec6fb4]/20"
              aria-label="Hồ sơ cá nhân"
            >
              {initials}
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-[#1f1850]" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold truncate">{name}</p>
              <p className="text-[10px] text-white/50 truncate">{profile?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Đăng xuất"
              aria-label="Đăng xuất"
              className="p-2 rounded-lg text-white/55 hover:text-[#ff9cc9] hover:bg-white/10 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ============== VÙNG NỘI DUNG ============== */}
      <div className="relative flex-1 flex flex-col min-w-0 lg:pl-[270px]">
        <header className="shell-header sticky top-0 z-30 h-[68px] px-4 lg:px-8 flex items-center gap-4">
          <button
            onClick={() => setMenuOpen(true)}
            className="lg:hidden p-2 rounded-xl text-[#6f7191] hover:bg-white/80"
            aria-label="Mở menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0 hidden sm:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8b7bff]">{kicker}</p>
            <p key={current?.path} className="font-display text-[17px] font-extrabold text-[#1f1d3a] truncate page-transition">
              {current?.label || 'Bảng điều khiển'}
            </p>
          </div>
          <div className="flex-1 flex justify-center min-w-0">{headerCenter}</div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {headerActions}
            <button
              onClick={() => profilePath && navigate(profilePath)}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8b7bff] to-[#6857df] text-white flex items-center justify-center font-bold text-xs shadow-md shadow-[#6857df]/30 ring-2 ring-white hover:scale-105 transition"
              aria-label={`Hồ sơ: ${name}`}
            >
              {initials}
            </button>
          </div>
        </header>

        <main className="eduai-main flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1400px] mx-auto">
          {/* key theo đường dẫn -> mỗi lần chuyển trang chạy lại hiệu ứng trượt vào */}
          <div key={location.pathname} className="page-transition">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
