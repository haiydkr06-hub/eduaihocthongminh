import { useState, type FormEvent } from 'react'
import {
  Save,
  Globe,
  Shield,
  Sparkles,
  Check,
} from 'lucide-react'

export function AdminSettingsPage() {
  const [platformName, setPlatformName] = useState('EduAI')
  const [slogan, setSlogan] = useState('HỌC THÔNG MINH, TIẾN BỘ MỖI NGÀY')
  const [contactEmail, setContactEmail] = useState('support@eduai.vn')
  const [allowPublicRegister, setAllowPublicRegister] = useState(true)
  const [requireEmailVerify, setRequireEmailVerify] = useState(false)
  const [aiModel, setAiModel] = useState('gemini-1.5-flash')
  const [quizMaxQuestions, setQuizMaxQuestions] = useState(20)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const handleSave = (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setNotice('Đã lưu cấu hình hệ thống thành công!')
      setTimeout(() => setNotice(null), 3000)
    }, 500)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#252641]">Cài đặt Hệ thống EduAI</h1>
          <p className="text-sm text-[#777a91]">
            Cấu hình thông tin nền tảng, chính sách đăng ký và tham số tích hợp Trí tuệ nhân tạo (AI)
          </p>
        </div>
      </div>

      {notice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
          <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Settings */}
        <div className="bg-white rounded-2xl border border-[#eceef4] p-6 shadow-sm">
          <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-[#eceef4]">
            <Globe className="w-5 h-5 text-[#6857DF]" />
            <h2 className="text-base font-bold text-[#252641]">Cấu hình Nền tảng</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#777a91] uppercase tracking-wider mb-1.5">
                Tên nền tảng
              </label>
              <input
                type="text"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#f7f8fc] border border-[#eceef4] rounded-xl text-xs focus:outline-none focus:border-[#6857DF]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#777a91] uppercase tracking-wider mb-1.5">
                Email hỗ trợ quản trị
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#f7f8fc] border border-[#eceef4] rounded-xl text-xs focus:outline-none focus:border-[#6857DF]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#777a91] uppercase tracking-wider mb-1.5">
                Khẩu hiệu / Slogan
              </label>
              <input
                type="text"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#f7f8fc] border border-[#eceef4] rounded-xl text-xs focus:outline-none focus:border-[#6857DF]"
              />
            </div>
          </div>
        </div>

        {/* Security & Access Policies */}
        <div className="bg-white rounded-2xl border border-[#eceef4] p-6 shadow-sm">
          <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-[#eceef4]">
            <Shield className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-[#252641]">Chính sách Đăng ký & Bảo mật (RBAC)</h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={allowPublicRegister}
                onChange={(e) => setAllowPublicRegister(e.target.checked)}
                className="w-4 h-4 text-[#6857DF] rounded mt-0.5"
              />
              <div>
                <p className="text-xs font-bold text-[#252641]">Cho phép đăng ký tài khoản tự do</p>
                <p className="text-[11px] text-[#777a91]">
                  Người dùng mới có thể tự do mở tài khoản Học viên hoặc Giảng viên qua trang Đăng ký.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={requireEmailVerify}
                onChange={(e) => setRequireEmailVerify(e.target.checked)}
                className="w-4 h-4 text-[#6857DF] rounded mt-0.5"
              />
              <div>
                <p className="text-xs font-bold text-[#252641]">Yêu cầu xác minh Email khi đăng ký</p>
                <p className="text-[11px] text-[#777a91]">
                  Gửi mã xác nhận qua email trước khi kích hoạt quyền đăng nhập.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* AI Integration Settings */}
        <div className="bg-white rounded-2xl border border-[#eceef4] p-6 shadow-sm">
          <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-[#eceef4]">
            <Sparkles className="w-5 h-5 text-pink-600" />
            <h2 className="text-base font-bold text-[#252641]">Tham số Tích hợp Trí tuệ Nhân tạo (AI)</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#777a91] uppercase tracking-wider mb-1.5">
                Mô hình AI mặc định (Sinh Quiz & Trợ lý)
              </label>
              <select
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#f7f8fc] border border-[#eceef4] rounded-xl text-xs focus:outline-none focus:border-[#6857DF]"
              >
                <option value="gemini-1.5-flash">Google Gemini 1.5 Flash (Nhanh & Tối ưu)</option>
                <option value="gemini-1.5-pro">Google Gemini 1.5 Pro (Chuyên sâu)</option>
                <option value="gpt-4o-mini">OpenAI GPT-4o Mini</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#777a91] uppercase tracking-wider mb-1.5">
                Số câu hỏi trắc nghiệm tối đa / lần sinh AI
              </label>
              <input
                type="number"
                min={5}
                max={50}
                value={quizMaxQuestions}
                onChange={(e) => setQuizMaxQuestions(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-[#f7f8fc] border border-[#eceef4] rounded-xl text-xs focus:outline-none focus:border-[#6857DF]"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-[#6857DF] hover:bg-[#5144BE] text-white font-bold rounded-xl text-xs transition duration-200 shadow-md shadow-[#6857DF]/25 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Đang lưu...' : 'Lưu tất cả thay đổi'}
          </button>
        </div>
      </form>
    </div>
  )
}
