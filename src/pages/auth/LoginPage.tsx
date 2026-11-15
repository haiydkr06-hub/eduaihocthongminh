import { useState, useRef, useEffect, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Sparkles, Mail, Lock, LogIn, AlertCircle, Eye, EyeOff, GraduationCap, UserCheck, Shield } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectUrl = searchParams.get('redirect')

  const mountedRef = useRef(true)
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const performLogin = async (loginEmail: string, loginPass: string) => {
    if (!loginEmail.trim() || !loginPass) {
      setErrorMsg('Vui lòng nhập đầy đủ email và mật khẩu')
      return
    }

    setLoading(true)
    setErrorMsg(null)

    try {
      const { error } = await signIn(loginEmail.trim(), loginPass)
      if (error) {
        if (mountedRef.current) {
          setErrorMsg(error.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.')
        }
      } else {
        if (redirectUrl) {
          navigate(redirectUrl, { replace: true })
        } else {
          // Điều hướng dựa vào email hoặc để RootRedirect điều phối
          const lower = loginEmail.toLowerCase()
          if (lower.includes('giangvien') || lower.includes('teacher')) {
            navigate('/teacher/dashboard', { replace: true })
          } else if (lower.includes('admin')) {
            navigate('/admin/dashboard', { replace: true })
          } else {
            navigate('/student/dashboard', { replace: true })
          }
        }
      }
    } catch (err: unknown) {
      if (mountedRef.current) {
        const msg = err instanceof Error ? err.message : 'Đã có lỗi xảy ra'
        setErrorMsg(msg)
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await performLogin(email, password)
  }

  const handleDemoLogin = async (role: 'student' | 'teacher' | 'admin') => {
    const demoEmail =
      role === 'admin'
        ? 'admin@eduai.vn'
        : role === 'teacher'
        ? 'giangvien@eduai.vn'
        : 'hocsinh@eduai.vn'
    const demoPass = '123456'
    setEmail(demoEmail)
    setPassword(demoPass)
    await performLogin(demoEmail, demoPass)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8 sm:p-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary-600/30 mb-3">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Edu<span className="text-primary-600">AI</span>
          </h1>
          <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mt-0.5">
            HỌC THÔNG MINH
          </span>
          <p className="text-sm text-gray-500 mt-2 text-center">
            Đăng nhập vào không gian học tập số tích hợp AI
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email input */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Email đăng nhập
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Password input with show/hide toggle */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">
                Mật khẩu
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-primary-600 hover:text-primary-700 hover:underline font-medium"
              >
                Quên mật khẩu?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 focus:bg-white transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                tabIndex={-1}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition duration-200 shadow-md shadow-primary-600/30 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Đăng nhập
              </>
            )}
          </button>
        </form>

        {/* Nút Demo Học sinh / Giảng viên / Quản trị viên */}
        <div className="mt-6 pt-5 border-t border-gray-100">
          <p className="text-xs text-center text-gray-500 font-medium mb-3">
            Hoặc đăng nhập nhanh bằng tài khoản thử nghiệm:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('student')}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-200 rounded-xl text-xs font-semibold transition"
            >
              <GraduationCap className="w-3.5 h-3.5" /> Học sinh
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('teacher')}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold transition"
            >
              <UserCheck className="w-3.5 h-3.5" /> Giảng viên
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('admin')}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-xs font-semibold transition"
            >
              <Shield className="w-3.5 h-3.5" /> Quản trị
            </button>
          </div>
        </div>

        {/* Link to Register */}
        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-600">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-primary-600 font-semibold hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
