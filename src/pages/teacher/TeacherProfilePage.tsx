import { useState, type FormEvent } from 'react'
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  Save,
  Check,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export function TeacherProfilePage() {
  const { profile } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name || 'Cô Nguyễn Minh Anh')
  const [phone, setPhone] = useState(profile?.phone || '0912 345 678')
  const [specialty, setSpecialty] = useState('Toán học tư duy & Hình học không gian')
  const [bio, setBio] = useState(
    'Hơn 8 năm kinh nghiệm giảng dạy môn Toán tại các trường chuyên. Yêu thích áp dụng công nghệ và phương pháp tư duy trực quan vào bài giảng.'
  )
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const handleSave = (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setNotice('Đã cập nhật hồ sơ giảng viên thành công!')
      setTimeout(() => setNotice(null), 3000)
    }, 500)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-[#252641]">Hồ sơ Giảng viên</h1>
        <p className="text-sm text-[#777a91]">
          Thông tin giới thiệu hiển thị với học viên và quản trị viên trên hệ thống
        </p>
      </div>

      {notice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
          <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-[#eceef4] p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-4 pb-4 border-b border-[#eceef4]">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7966f2] to-[#5f4ce0] text-white flex items-center justify-center font-bold text-xl shadow-md shadow-[#6857DF]/20">
            {fullName.split(' ').slice(-1)[0][0]}
          </div>
          <div>
            <h2 className="text-base font-bold text-[#252641]">{fullName}</h2>
            <p className="text-xs text-[#777a91]">{profile?.email || 'teacher@eduai.vn'}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
              Giảng viên chính thức
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#777a91] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-gray-400" /> Họ và tên giảng viên
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
              <Mail className="w-3.5 h-3.5 text-gray-400" /> Địa chỉ Email
            </label>
            <input
              type="email"
              disabled
              value={profile?.email || 'teacher@eduai.vn'}
              className="w-full px-3.5 py-2.5 bg-gray-100 border border-[#eceef4] rounded-xl text-xs text-gray-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#777a91] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-gray-400" /> Số điện thoại liên hệ
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
              <GraduationCap className="w-3.5 h-3.5 text-gray-400" /> Chuyên môn phụ trách
            </label>
            <input
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#f7f8fc] border border-[#eceef4] rounded-xl text-xs focus:outline-none focus:border-[#6857DF] focus:bg-white transition"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-[#777a91] uppercase tracking-wider mb-1.5">
              Tiểu sử / Giới thiệu bản thân
            </label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
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
            {saving ? 'Đang lưu...' : 'Lưu thông tin hồ sơ'}
          </button>
        </div>
      </form>
    </div>
  )
}
