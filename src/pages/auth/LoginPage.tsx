import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { getFriendlyErrorMessage } from '../../lib/errorMessage';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, user, role, loading: authLoading } = useAuth();

  // Đang kiểm tra session của Supabase -> hiển thị spinner để tránh nhấp nháy UI
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f8fa] gap-3">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <p className="text-sm font-medium text-gray-500">Đang kiểm tra phiên đăng nhập...</p>
      </div>
    );
  }

  // Đã đăng nhập -> chuyển hướng ngay tới Dashboard theo Role hoặc link redirect
  if (user) {
    const params = new URLSearchParams(window.location.search);
    const redirectParam = params.get('redirect');
    if (redirectParam && redirectParam.startsWith('/')) {
      return <Navigate to={redirectParam} replace />;
    }
    const userRole = (role || 'student') as string;
    const targetDashboard =
      userRole === 'admin'
        ? '/admin/dashboard'
        : userRole === 'teacher'
        ? '/teacher/dashboard'
        : '/student/dashboard';
    return <Navigate to={targetDashboard} replace />;
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
      // Đăng nhập qua auth context (tự động xử lý cả tài khoản Demo và Supabase)
      const res = await signIn(loginEmail, loginPass);
      if (res?.error) {
        setError(getFriendlyErrorMessage(res.error, 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.'));
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const redirectParam = params.get('redirect');
      if (redirectParam && redirectParam.startsWith('/')) {
        window.location.href = redirectParam;
        return;
      }

      // Điều hướng trực tiếp theo vai trò
      const lower = loginEmail.toLowerCase();
      if (lower.includes('admin')) {
        window.location.href = '/admin/dashboard';
      } else if (lower.includes('teacher') || lower.includes('giangvien')) {
        window.location.href = '/teacher/dashboard';
      } else {
        window.location.href = '/student/dashboard';
      }
    } catch {
      // Fallback gọi trực tiếp Supabase
      try {
        const { error: directErr } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: loginPass,
        });

        if (directErr) {
          setError(getFriendlyErrorMessage(directErr, 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.'));
        } else {
          window.location.href = '/';
        }
      } catch (fallbackErr: unknown) {
        setError(getFriendlyErrorMessage(fallbackErr, 'Không thể kết nối đến máy chủ. Vui lòng thử lại.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#f7f8fa] p-4 font-sans">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 text-white rounded-2xl shadow-md mb-3 text-2xl font-black">
          E
        </div>
        <h1 className="text-3xl font-extrabold text-primary-900 tracking-tight">EduAI</h1>
        <p className="text-gray-600 mt-1.5 text-sm">Học tập thông minh cùng Trí tuệ nhân tạo</p>
      </div>

      <div className="max-w-[420px] w-full bg-white rounded-2xl shadow-sm border border-gray-200/90 p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Đăng nhập tài khoản</h2>
          <p className="text-xs text-gray-500 mt-1">Vui lòng nhập email và mật khẩu của bạn để tiếp tục</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-start leading-relaxed">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0 text-red-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* 1. ĐĂNG NHẬP BẰNG TÀI KHOẢN EMAIL (Ở PHÍA TRÊN) */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
            <input
              type="email"
              disabled={loading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition text-sm text-gray-800 disabled:opacity-60"
              placeholder="nhap@email.com"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-bold text-gray-700">Mật khẩu</label>
              <a href="/forgot-password" className="text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline">
                Quên mật khẩu?
              </a>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition pr-10 text-sm text-gray-800 disabled:opacity-60"
                placeholder="Nhập mật khẩu của bạn"
              />
              <button
                type="button"
                tabIndex={-1}
                disabled={loading}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white font-bold py-2.5 px-4 rounded-xl hover:bg-primary-700 transition duration-150 disabled:opacity-50 shadow-sm shadow-primary-600/30 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Đang đăng nhập...</span>
              </>
            ) : (
              'Đăng nhập'
            )}
          </button>
        </form>

        {/* 2. DÒNG PHÂN CÁCH */}
        <div className="relative flex items-center justify-center my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative px-3 bg-white text-xs font-semibold text-gray-500 uppercase tracking-wider">
            HOẶC TRẢI NGHIỆM NHANH (DEMO)
          </div>
        </div>

        {/* 3. TÀI KHOẢN DEMO ĐẶT PHÍA DƯỚI GỒM HỌC SINH, GIẢNG VIÊN VÀ QUẢN TRỊ VIÊN */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => handleLogin(undefined, 'student@demo.com', '123456')}
            disabled={loading}
            className="w-full flex items-center justify-between px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 bg-gray-50/70 hover:bg-primary-50/60 hover:border-primary-300 font-medium transition group disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">👩‍🎓</span>
              <div className="text-left">
                <div className="text-sm font-semibold text-gray-800 group-hover:text-primary-800">Tài khoản Học sinh</div>
                <div className="text-[11px] text-gray-500">student@demo.com</div>
              </div>
            </div>
            <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md group-hover:bg-primary-100">
              Vào ngay →
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleLogin(undefined, 'teacher@demo.com', '123456')}
            disabled={loading}
            className="w-full flex items-center justify-between px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 bg-gray-50/70 hover:bg-primary-50/60 hover:border-primary-300 font-medium transition group disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">👨‍🏫</span>
              <div className="text-left">
                <div className="text-sm font-semibold text-gray-800 group-hover:text-primary-800">Tài khoản Giảng viên</div>
                <div className="text-[11px] text-gray-500">teacher@demo.com</div>
              </div>
            </div>
            <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md group-hover:bg-primary-100">
              Vào ngay →
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleLogin(undefined, 'admin@demo.com', '123456')}
            disabled={loading}
            className="w-full flex items-center justify-between px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 bg-gray-50/70 hover:bg-purple-50 hover:border-purple-300 font-medium transition group disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🛡️</span>
              <div className="text-left">
                <div className="text-sm font-semibold text-gray-800 group-hover:text-purple-800">Tài khoản Quản trị viên</div>
                <div className="text-[11px] text-gray-500">admin@demo.com</div>
              </div>
            </div>
            <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md group-hover:bg-purple-100">
              Vào ngay →
            </span>
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          Chưa có tài khoản?{' '}
          <a href="/register" className="text-primary-600 hover:underline font-bold">
            Đăng ký ngay
          </a>
        </p>
      </div>
    </div>
  );
}

export { LoginPage };
