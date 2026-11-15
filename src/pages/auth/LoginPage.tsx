import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Sparkles, Mail, Lock, LogIn, AlertCircle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectUrl = searchParams.get('redirect')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ email và mật khẩu')
      return
    }

    setLoading(true)
    setErrorMsg(null)

    try {
      const { error } = await signIn(email.trim(), password)
      if (error) {
        setErrorMsg(error.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.')
      } else {
        if (redirectUrl) {
          navigate(redirectUrl, { replace: true })
        } else {
          // Điều hướng mặc định, ProtectedRoute sẽ kiểm tra role cụ thể
          navigate('/student/dashboard', { replace: true })
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đã có lỗi xảy ra'
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-[#eceef4] p-8 md:p-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7966f2] to-[#5f4ce0] text-white flex items-center justify-center shadow-lg shadow-[#6653df]/30 mb-4">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-[#252641] tracking-tight">
            Edu<span className="text-[#7060e8]">AI</span>
          </h1>
          <span className="text-[10px] font-bold text-[#a1a3b5] tracking-widest uppercase mt-0.5">
            HỌC THÔNG MINH
          </span>
          <p className="text-sm text-[#777a91] mt-3">Đăng nhập vào không gian học tập số</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-[#777a91] uppercase tracking-wider mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-11 pr-4 py-3 bg-[#f7f8fc] border border-[#eceef4] rounded-xl text-sm focus:outline-none focus:border-[#6857DF] focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-[#777a91] uppercase tracking-wider">
                Mật khẩu
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-[#6857DF] hover:underline font-medium"
              >
                Quên mật khẩu?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-[#f7f8fc] border border-[#eceef4] rounded-xl text-sm focus:outline-none focus:border-[#6857DF] focus:bg-white transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-[#6857DF] hover:bg-[#5144BE] text-white font-semibold rounded-xl transition duration-200 shadow-md shadow-[#6857DF]/25 disabled:opacity-50 mt-2"
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

        <div className="mt-8 pt-6 border-t border-[#eceef4] text-center">
          <p className="text-sm text-[#777a91]">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-[#6857DF] font-semibold hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
