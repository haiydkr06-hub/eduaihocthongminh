import { useState, useRef, useEffect, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, Mail, Lock, User as UserIcon, UserPlus, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import type { AppRole } from '../../types/auth'

export function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<AppRole>('student')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const { signUp } = useAuth()
  const navigate = useNavigate()

  const mountedRef = useRef(true)
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !email.trim() || !password) {
      setErrorMsg('Vui lòng điền đầy đủ các trường thông tin bắt buộc.')
      return
    }

    if (password.length < 6) {
      setErrorMsg('Mật khẩu phải có tối thiểu 6 ký tự.')
      return
    }

    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const { error, user } = await signUp(email.trim(), password, fullName.trim(), role)
      if (error) {
        if (mountedRef.current) {
          setErrorMsg(error.message || 'Đăng ký tài khoản không thành công.')
        }
      } else if (user) {
        if (mountedRef.current) {
          setSuccessMsg('Đăng ký tài khoản thành công! Đang chuyển hướng...')
        }
        setTimeout(() => {
          if (role === 'teacher') {
            navigate('/teacher/dashboard', { replace: true })
          } else {
            navigate('/student/dashboard', { replace: true })
          }
        }, 1500)
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

  return (
    <div className="min-h-screen bg-[#f7f8fc] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-[#eceef4] p-8 md:p-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7966f2] to-[#5f4ce0] text-white flex items-center justify-center shadow-lg shadow-[#6653df]/30 mb-4">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-[#252641] tracking-tight">
            Edu<span className="text-[#7060e8]">AI</span>
          </h1>
          <span className="text-[10px] font-bold text-[#a1a3b5] tracking-widest uppercase mt-0.5">
            HỌC THÔNG MINH
          </span>
          <p className="text-sm text-[#777a91] mt-2">Tạo tài khoản học tập và giảng dạy mới</p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-start gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#777a91] uppercase tracking-wider mb-1.5">
              Họ và tên
            </label>
            <div className="relative">
              <UserIcon className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full pl-11 pr-4 py-2.5 bg-[#f7f8fc] border border-[#eceef4] rounded-xl text-sm focus:outline-none focus:border-[#6857DF] focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#777a91] uppercase tracking-wider mb-1.5">
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
                className="w-full pl-11 pr-4 py-2.5 bg-[#f7f8fc] border border-[#eceef4] rounded-xl text-sm focus:outline-none focus:border-[#6857DF] focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#777a91] uppercase tracking-wider mb-1.5">
              Mật khẩu (tối thiểu 6 ký tự)
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-2.5 bg-[#f7f8fc] border border-[#eceef4] rounded-xl text-sm focus:outline-none focus:border-[#6857DF] focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#777a91] uppercase tracking-wider mb-2">
              Vai trò tài khoản
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`py-2.5 px-3 rounded-xl border text-sm font-semibold transition ${
                  role === 'student'
                    ? 'border-[#6857DF] bg-[#F0EDFF] text-[#6857DF]'
                    : 'border-[#eceef4] bg-[#f7f8fc] text-[#777a91] hover:bg-gray-100'
                }`}
              >
                Học viên (Student)
              </button>
              <button
                type="button"
                onClick={() => setRole('teacher')}
                className={`py-2.5 px-3 rounded-xl border text-sm font-semibold transition ${
                  role === 'teacher'
                    ? 'border-[#6857DF] bg-[#F0EDFF] text-[#6857DF]'
                    : 'border-[#eceef4] bg-[#f7f8fc] text-[#777a91] hover:bg-gray-100'
                }`}
              >
                Giảng viên (Teacher)
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#6857DF] hover:bg-[#5144BE] text-white font-semibold rounded-xl transition duration-200 shadow-md shadow-[#6857DF]/25 disabled:opacity-50 mt-4"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4" /> Hoàn tất đăng ký
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#eceef4] text-center">
          <p className="text-sm text-[#777a91]">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-[#6857DF] font-semibold hover:underline">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
