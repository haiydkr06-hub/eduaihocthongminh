import { useState, useRef, useEffect, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Mail, Send, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const { resetPassword } = useAuth()

  const mountedRef = useRef(true)
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setErrorMsg('Vui lòng nhập địa chỉ email của bạn.')
      return
    }

    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const { error } = await resetPassword(email.trim())
      if (error) {
        if (mountedRef.current) {
          setErrorMsg(error.message || 'Không thể gửi email đặt lại mật khẩu.')
        }
      } else {
        if (mountedRef.current) {
          setSuccessMsg(
            'Email hướng dẫn khôi phục mật khẩu đã được gửi! Vui lòng kiểm tra hộp thư đến của bạn.'
          )
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

  return (
    <div className="min-h-screen bg-[#f7f8fc] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-[#eceef4] p-8 md:p-10">
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
          <p className="text-sm text-[#777a91] mt-2">Khôi phục mật khẩu tài khoản</p>
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
            <label className="block text-xs font-bold text-[#777a91] uppercase tracking-wider mb-2">
              Email đăng ký của bạn
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

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-[#6857DF] hover:bg-[#5144BE] text-white font-semibold rounded-xl transition duration-200 shadow-md shadow-[#6857DF]/25 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" /> Gửi liên kết khôi phục
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#eceef4] text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-[#777a91] hover:text-[#6857DF] font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại trang Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  )
}
