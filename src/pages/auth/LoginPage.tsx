import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, GraduationCap, Lock, Mail, School, ShieldCheck, ArrowRight } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';
import { dashboardForRole, getSafeRedirect } from '../../lib/demoAccounts';
import { useAuth } from '../../hooks/useAuth';
import { getFriendlyErrorMessage } from '../../lib/errorMessage';
import { AuthShowcase } from '../../components/auth/AuthShowcase';
import { AuroraBackground } from '../../components/layout/AppShell';

const DEMO_ACCOUNTS = [
  { email: 'student@demo.com', label: 'Học viên', icon: GraduationCap, tone: 'from-[#8b7bff] to-[#6857df]' },
  { email: 'teacher@demo.com', label: 'Giảng viên', icon: School, tone: 'from-[#2ec4b6] to-[#3b82f6]' },
  { email: 'admin@demo.com', label: 'Quản trị', icon: ShieldCheck, tone: 'from-[#ec6fb4] to-[#f5a524]' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, user, role, loading: authLoading } = useAuth();
  const location = useLocation();

  // Đang kiểm tra session -> hiển thị spinner để tránh nhấp nháy UI
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <AuroraBackground />
        <div className="relative w-10 h-10 border-4 border-[#6857df]/20 border-t-[#6857df] rounded-full animate-spin" />
        <p className="relative text-sm font-medium text-[#6f7191]">Đang kiểm tra phiên đăng nhập...</p>
      </div>
    );
  }

  // Đã đăng nhập -> chuyển hướng ngay tới Dashboard theo Role hoặc link redirect
  if (user) {
    // Chỉ chuyển hướng tới đường dẫn nội bộ (chặn open redirect kiểu ?redirect=//trang-la.com)
    const redirect = getSafeRedirect(location.search);
    return <Navigate to={redirect || dashboardForRole(role)} replace />;
  }

  const handleLogin = async (e?: React.FormEvent, demoEmail?: string, demoPass?: string) => {
    if (e) e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');

    const loginEmail = (demoEmail || email).trim();
    const loginPass = demoPass || password;

    if (!loginEmail || !loginPass) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      setLoading(false);
      return;
    }

    try {
      // Thành công -> AuthContext cập nhật user, nhánh `if (user)` ở trên tự điều hướng theo vai trò thật.
      const res = await signIn(loginEmail, loginPass);
      if (res?.error) {
        setError(getFriendlyErrorMessage(res.error, 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.'));
      }
    } catch (err: unknown) {
      setError(getFriendlyErrorMessage(err, 'Không thể kết nối đến máy chủ. Vui lòng thử lại.'));
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full pl-11 pr-4 py-3 bg-white/80 border border-[#e6e3f5] rounded-2xl text-sm text-[#1f1d3a] placeholder:text-[#a3a4bd] outline-none transition focus:bg-white focus:border-[#8b7bff] focus:ring-4 focus:ring-[#8b7bff]/15 disabled:opacity-60';

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr]">
      <AuthShowcase />

      <section className="relative isolate overflow-hidden flex items-center justify-center p-5 sm:p-10">
        <AuroraBackground contained />

        <div className="auth-card relative w-full max-w-[440px]">
          {/* Logo cho màn hình nhỏ */}
          <div className="lg:hidden text-center mb-6">
            <span className="font-display text-3xl font-extrabold text-[#1f1d3a]">
              Edu<span className="text-gradient-dark">AI</span>
            </span>
            <p className="text-sm text-[#6f7191] mt-1">Học tập thông minh cùng Trí tuệ nhân tạo</p>
          </div>

          <div className="rounded-[28px] bg-white/75 backdrop-blur-xl border border-white shadow-[0_30px_70px_-30px_rgba(76,61,190,0.45)] p-7 sm:p-9">
            <h2 className="font-display text-[28px] font-extrabold text-[#1f1d3a]">Chào mừng trở lại 👋</h2>
            <p className="text-sm text-[#6f7191] mt-1.5">Đăng nhập để tiếp tục hành trình học tập của bạn.</p>

            {error && (
              <div role="alert" className="mt-5 p-3.5 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="mt-6 space-y-4" noValidate>
              <div>
                <label htmlFor="login-email" className="block text-xs font-bold text-[#4a4c68] mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a3a4bd]" aria-hidden="true" />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    disabled={loading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    placeholder="nhap@email.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="login-password" className="text-xs font-bold text-[#4a4c68]">
                    Mật khẩu
                  </label>
                  <Link to="/forgot-password" className="text-xs font-semibold text-[#6857df] hover:underline">
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a3a4bd]" aria-hidden="true" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    disabled={loading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputClass} pr-11`}
                    placeholder="Nhập mật khẩu của bạn"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#a3a4bd] hover:text-[#6857df]"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-glow w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white text-sm font-bold disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Đang đăng nhập...
                  </>
                ) : (
                  <>
                    Đăng nhập <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {!isSupabaseConfigured && (
              <div className="mt-7">
                <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#a3a4bd]">
                  <span className="h-px flex-1 bg-[#e6e3f5]" /> Trải nghiệm nhanh <span className="h-px flex-1 bg-[#e6e3f5]" />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2.5">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      disabled={loading}
                      onClick={() => handleLogin(undefined, acc.email, '123456')}
                      className="group flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/70 border border-[#ece9fb] hover:border-[#c9c1ff] hover:-translate-y-1 hover:shadow-lg hover:shadow-[#6857df]/15 transition disabled:opacity-50"
                      title={acc.email}
                    >
                      <span className={`w-10 h-10 rounded-xl bg-gradient-to-br ${acc.tone} text-white flex items-center justify-center shadow-md transition-transform group-hover:scale-110 group-hover:rotate-[-6deg]`}>
                        <acc.icon className="w-5 h-5" />
                      </span>
                      <span className="text-xs font-bold text-[#1f1d3a]">{acc.label}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-center text-[11px] text-[#8a8ca6]">
                  Tài khoản demo · mật khẩu <strong className="text-[#4a4c68]">123456</strong>
                </p>
              </div>
            )}

            <p className="mt-7 text-center text-sm text-[#6f7191]">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="font-bold text-[#6857df] hover:underline">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export { LoginPage };
