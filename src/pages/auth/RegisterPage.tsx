import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import type { AppRole } from '../../types/auth';
import { getFriendlyErrorMessage } from '../../lib/errorMessage';

export default function RegisterPage() {
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { signUp, user, role: currentRole, loading: authLoading } = useAuth();

  // Đang tải phiên đăng nhập -> hiện spinner tránh nhấp nháy UI
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f8fa] gap-3">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <p className="text-sm font-medium text-gray-500">Đang kiểm tra phiên đăng nhập...</p>
      </div>
    );
  }

  // Nếu người dùng đã đăng nhập, tự động chuyển về Dashboard theo vai trò
  if (user) {
    const targetDashboard =
      currentRole === 'admin'
        ? '/admin/dashboard'
        : currentRole === 'teacher'
        ? '/teacher/dashboard'
        : '/student/dashboard';
    return <Navigate to={targetDashboard} replace />;
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    setSuccess('');

    const trimmedName = fullName.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedPhone || !trimmedEmail || !password || !confirmPassword) {
      setError('Vui lòng điền đầy đủ tất cả các thông tin bắt buộc.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu cần có tối thiểu 6 ký tự.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp với mật khẩu đã nhập.');
      setLoading(false);
      return;
    }

    if (!agreeTerms) {
      setError('Bạn cần đồng ý với Điều khoản sử dụng và Chính sách bảo mật để tiếp tục.');
      setLoading(false);
      return;
    }

    try {
      // 1. Thử đăng ký qua AuthContext (tương thích cả demo lẫn Supabase đã cấu hình)
      const res = await signUp(trimmedEmail, password, trimmedName, role as AppRole);
      
      if (res?.error) {
        // Fallback gọi trực tiếp Supabase Auth
        const { error: sbError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: password,
          options: {
            data: {
              full_name: trimmedName,
              phone: trimmedPhone,
              role: role,
            },
          },
        });

        if (sbError) {
          setError(getFriendlyErrorMessage(sbError, 'Đăng ký không thành công. Vui lòng thử lại.'));
          return;
        }
      }

      setSuccess(`Đăng ký tài khoản ${role === 'teacher' ? 'Giảng viên' : 'Học viên'} thành công! Đang tự động chuyển hướng...`);
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } catch (err: unknown) {
      setError(getFriendlyErrorMessage(err, 'Đã có lỗi phát sinh trong quá trình đăng ký. Vui lòng thử lại.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#f7f8fa] py-10 px-4 font-sans">
      <div className="max-w-[500px] w-full bg-white rounded-2xl shadow-sm border border-gray-200/90 p-8 relative">
        
        {/* Nút quay lại */}
        <a
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-primary-600 transition mb-6 group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại Đăng nhập
        </a>

        {/* Tiêu đề & Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-11 h-11 bg-primary-600 text-white rounded-xl shadow-md mb-2 text-xl font-black">
            E
          </div>
          <h2 className="text-2xl font-extrabold text-primary-900 tracking-tight">Tạo tài khoản EduAI</h2>
          <p className="text-gray-500 mt-1 text-xs">Tham gia không gian học tập và giảng dạy thông minh cùng AI</p>
        </div>

        {/* Thông báo lỗi */}
        {error && (
          <div className="mb-5 p-3.5 bg-red-50 text-red-600 rounded-xl text-xs sm:text-sm border border-red-100 flex items-start leading-relaxed">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0 text-red-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}
        
        {/* Thông báo thành công */}
        {success && (
          <div className="mb-5 p-3.5 bg-green-50 text-green-700 rounded-xl text-xs sm:text-sm border border-green-200 flex items-start leading-relaxed">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0 text-green-600 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          
          {/* CHỌN VAI TRÒ: HỌC VIÊN HOẶC GIẢNG VIÊN */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Bạn tham gia với vai trò:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => setRole('student')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between relative disabled:opacity-60 ${
                  role === 'student'
                    ? 'border-primary-600 bg-primary-50/70 shadow-sm ring-2 ring-primary-500/20'
                    : 'border-gray-200 bg-gray-50/60 hover:bg-gray-100 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xl">👩‍🎓</span>
                  {role === 'student' && (
                    <span className="w-2 h-2 rounded-full bg-primary-600"></span>
                  )}
                </div>
                <div>
                  <div className={`text-sm font-bold ${role === 'student' ? 'text-primary-900' : 'text-gray-800'}`}>
                    Học viên
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                    Luyện tập & hỏi đáp AI
                  </div>
                </div>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => setRole('teacher')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between relative disabled:opacity-60 ${
                  role === 'teacher'
                    ? 'border-primary-600 bg-primary-50/70 shadow-sm ring-2 ring-primary-500/20'
                    : 'border-gray-200 bg-gray-50/60 hover:bg-gray-100 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xl">👨‍🏫</span>
                  {role === 'teacher' && (
                    <span className="w-2 h-2 rounded-full bg-primary-600"></span>
                  )}
                </div>
                <div>
                  <div className={`text-sm font-bold ${role === 'teacher' ? 'text-primary-900' : 'text-gray-800'}`}>
                    Giảng viên
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                    Tạo đề & quản lý lớp
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* HỌ VÀ TÊN & SỐ ĐIỆN THOẠI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Họ và Tên</label>
              <input
                type="text"
                disabled={loading}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition text-sm text-gray-800 disabled:opacity-60"
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Số điện thoại</label>
              <input
                type="tel"
                disabled={loading}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition text-sm text-gray-800 disabled:opacity-60"
                placeholder="0912345678"
              />
            </div>
          </div>

          {/* EMAIL */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Email đăng ký</label>
            <input
              type="email"
              disabled={loading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition text-sm text-gray-800 disabled:opacity-60"
              placeholder="nhap@email.com"
            />
          </div>

          {/* MẬT KHẨU */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Mật khẩu</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition pr-10 text-sm text-gray-800 disabled:opacity-60"
                placeholder="Tối thiểu 6 ký tự"
              />
              <button
                type="button"
                tabIndex={-1}
                disabled={loading}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                title={showPassword ? 'Ẩn' : 'Hiện'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                )}
              </button>
            </div>
          </div>

          {/* XÁC NHẬN MẬT KHẨU */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Xác nhận mật khẩu</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                disabled={loading}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition pr-10 text-sm text-gray-800 disabled:opacity-60"
                placeholder="Nhập lại mật khẩu"
              />
              <button
                type="button"
                tabIndex={-1}
                disabled={loading}
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                title={showConfirm ? 'Ẩn' : 'Hiện'}
              >
                {showConfirm ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                )}
              </button>
            </div>
          </div>

          {/* CHECKBOX ĐIỀU KHOẢN */}
          <div className="flex items-start pt-1">
            <input
              id="terms"
              type="checkbox"
              disabled={loading}
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-0.5 cursor-pointer disabled:opacity-50"
            />
            <label htmlFor="terms" className="ml-2 block text-xs text-gray-600 leading-normal cursor-pointer select-none">
              Tôi đồng ý với{' '}
              <a href="#" className="text-primary-600 font-semibold hover:underline">
                Điều khoản sử dụng
              </a>{' '}
              và{' '}
              <a href="#" className="text-primary-600 font-semibold hover:underline">
                Chính sách bảo mật
              </a>{' '}
              của EduAI.
            </label>
          </div>

          {/* NÚT ĐĂNG KÝ */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white font-bold py-2.5 px-4 rounded-xl hover:bg-primary-700 transition duration-150 disabled:opacity-50 shadow-sm shadow-primary-600/30 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Đang xử lý tạo tài khoản...</span>
              </>
            ) : (
              'Hoàn tất Đăng ký'
            )}
          </button>
        </form>

        {/* LIÊN KẾT ĐĂNG NHẬP */}
        <p className="mt-6 text-center text-xs sm:text-sm text-gray-600">
          Đã có tài khoản?{' '}
          <a href="/login" className="text-primary-600 hover:underline font-bold">
            Đăng nhập ngay
          </a>
        </p>
      </div>
    </div>
  );
}

export { RegisterPage };
