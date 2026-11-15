import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  Lock,
  Save,
  Check,
  LogOut,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { readPrefs, writePrefs } from '../../lib/localPrefs'
import { getFriendlyErrorMessage } from '../../lib/errorMessage'

export function StudentProfilePage() {
  const { profile, signOut, updatePassword, updateProfile } = useAuth()
  const navigate = useNavigate()

  const prefsKey = `eduai_profile_extra:${profile?.id}`
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [schoolClass, setSchoolClass] = useState(() => readPrefs(prefsKey, { schoolClass: '' }).schoolClass)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Password update
  const [newPassword, setNewPassword] = useState('')
  const [updatingPass, setUpdatingPass] = useState(false)
  const [passNotice, setPassNotice] = useState<string | null>(null)
  const [passError, setPassError] = useState<string | null>(null)

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    setError(null)
    const { error: updErr } = await updateProfile({ full_name: fullName, phone })
    setSaving(false)
    if (updErr) {
      setError(getFriendlyErrorMessage(updErr, 'Không lưu được hồ sơ.'))
      return
    }
    writePrefs(prefsKey, { schoolClass: schoolClass.trim() })
    setNotice('Đã cập nhật thông tin hồ sơ học viên thành công!')
    setTimeout(() => setNotice(null), 3000)
  }

  const handleUpdatePassword = async (e: FormEvent) => {
    e.preventDefault()
    if (!newPassword || newPassword.length < 6) {
      setPassError('Mật khẩu mới phải có tối thiểu 6 ký tự.')
      return
    }

    setUpdatingPass(true)
    setPassError(null)
    const { error } = await updatePassword(newPassword)
    setUpdatingPass(false)

    if (error) {
      setPassError(error.message)
    } else {
      setPassNotice('Đã đổi mật khẩu thành công!')
      setNewPassword('')
      setTimeout(() => setPassNotice(null), 3000)
    }
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="page-content space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-[#252641]">Hồ sơ cá nhân & Cài đặt</h1>
        <p className="text-sm text-[#777a91]">
          Quản lý thông tin tài khoản học viên, lớp học và thiết lập bảo mật
        </p>
      </div>

      {error && (
        <div role="alert" className="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">{error}</div>
      )}
      {notice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
          <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Profile Info Form */}
      <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl border border-[#eceef4] p-6 md:p-8 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-5 border-b border-[#eceef4]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7966f2] to-[#5f4ce0] text-white flex items-center justify-center font-bold text-xl shadow-md shadow-[#6857DF]/20">
              {fullName.split(' ').slice(-1)[0][0]}
            </div>
            <div>
              <h2 className="text-base font-bold text-[#252641]">{fullName}</h2>
              <p className="text-xs text-[#777a91]">{profile?.email || 'student@eduai.vn'}</p>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-[#6857DF]">
                Học viên EduAI
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition"
          >
            <LogOut className="w-4 h-4" /> Đăng xuất
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#777a91] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-gray-400" /> Họ và tên học sinh
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#f7f8fc] border border-[#eceef4] rounded-xl text-xs focus:outline-none focus:border-[#6857DF] focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#777a91] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-gray-400" /> Email
            </label>
            <input
              type="email"
              disabled
              value={profile?.email || 'student@eduai.vn'}
              className="w-full px-3.5 py-2.5 bg-gray-100 border border-[#eceef4] rounded-xl text-xs text-gray-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#777a91] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-gray-400" /> Số điện thoại
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#f7f8fc] border border-[#eceef4] rounded-xl text-xs focus:outline-none focus:border-[#6857DF] focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#777a91] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-gray-400" /> Lớp / Trường học
            </label>
            <input
              type="text"
              value={schoolClass}
              onChange={(e) => setSchoolClass(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#f7f8fc] border border-[#eceef4] rounded-xl text-xs focus:outline-none focus:border-[#6857DF] focus:bg-white transition"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-[#eceef4]">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#6857DF] hover:bg-[#5144BE] text-white text-xs font-bold transition shadow-md shadow-[#6857DF]/25 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Đang lưu...' : 'Lưu thông tin'}
          </button>
        </div>
      </form>

      {/* Password Change Box */}
      <form onSubmit={handleUpdatePassword} className="bg-white rounded-3xl border border-[#eceef4] p-6 md:p-8 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-[#252641] flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#6857DF]" /> Đổi mật khẩu tài khoản
        </h2>

        {passNotice && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{passNotice}</span>
          </div>
        )}

        {passError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span>{passError}</span>
          </div>
        )}

        <div className="max-w-md">
          <label className="block text-xs font-bold text-[#777a91] uppercase tracking-wider mb-1.5">
            Mật khẩu mới (tối thiểu 6 ký tự)
          </label>
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3.5 py-2.5 bg-[#f7f8fc] border border-[#eceef4] rounded-xl text-xs focus:outline-none focus:border-[#6857DF] focus:bg-white transition"
          />
        </div>

        <div className="flex justify-start pt-2">
          <button
            type="submit"
            disabled={updatingPass}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#252641] hover:bg-black text-white text-xs font-bold transition disabled:opacity-50"
          >
            <Lock className="w-3.5 h-3.5" />
            {updatingPass ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
          </button>
        </div>
      </form>
    </div>
  )
}
