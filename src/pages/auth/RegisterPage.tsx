import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function RegisterPage() {
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');

    if (!email || !password || !confirmPassword || !fullName || !phone) {
      setError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      setLoading(false); return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      setLoading(false); return;
    }

    if (!agreeTerms) {
      setError('Bạn cần đồng ý với Điều khoản sử dụng để tiếp tục.');
      setLoading(false); return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
          role: 'student', 
        },
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Đăng ký thành công! Đang tự động chuyển hướng...');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#f7f8fa] p-4 font-sans">
      <div className="max-w-[480px] w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 relative">
        
        <a href="/login" className="absolute top-6 left-6 text-gray-400 hover:text-gray-700 flex items-center text-sm font-medium transition">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại
        </a>

        <div className="text-center mb-8 mt-4">
          <h2 className="text-2xl font-extrabold text-primary-900 tracking-tight">Tạo tài khoản mới</h2>
          <p className="text-gray-500 mt-2 text-sm">Tham gia không gian học tập EduAI</p>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 flex items-start">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-5 p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200">
            {success}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Họ và Tên</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Số điện thoại</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                placeholder="0912345678"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
              placeholder="nhap@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Mật khẩu</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition pr-10"
                placeholder="Ít nhất 6 ký tự"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? "Ẩn" : "Hiện"}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Xác nhận mật khẩu</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition pr-10"
                placeholder="Nhập lại mật khẩu"
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showConfirm ? "Ẩn" : "Hiện"}
              </button>
            </div>
          </div>

          <div className="flex items-start mt-2">
            <input
              id="terms"
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-0.5"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-600">
              Tôi đồng ý với <a href="#" className="text-primary-600 hover:underline">Điều khoản sử dụng</a> và <a href="#" className="text-primary-600 hover:underline">Chính sách bảo mật</a>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white font-bold py-3 rounded-lg hover:bg-primary-700 transition disabled:opacity-50 mt-4"
          >
            {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
          </button>
        </form>
      </div>
    </div>
  );
}
export { RegisterPage };
