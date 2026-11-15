import { useEffect, useState, type FormEvent } from 'react'
import {
  Bell,
  Send,
  AlertTriangle,
  Info,
  CheckCircle,
  Check,
} from 'lucide-react'
import { adminService, type SystemNotificationItem } from '../../services/adminService'

export function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<SystemNotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState('info')
  const [target, setTarget] = useState<'all' | 'students' | 'teachers'>('all')
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const refreshNotifications = async () => {
    const data = await adminService.getNotifications()
    setNotifications(data)
  }

  useEffect(() => {
    let active = true
    adminService.getNotifications()
      .then((data) => {
        if (active) {
          setNotifications(data)
          setLoading(false)
        }
      })
      .catch(() => {
        if (active) {
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [])

  const handleSend = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) {
      alert('Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo')
      return
    }

    setSubmitting(true)
    const success = await adminService.createNotification(title, message, type, target)
    setSubmitting(false)

    if (success) {
      setNotice('Đã gửi thông báo hệ thống tới các người dùng thành công!')
      setTitle('')
      setMessage('')
      refreshNotifications()
      setTimeout(() => setNotice(null), 3000)
    } else {
      alert('Không thể gửi thông báo')
    }
  }

  const getTypeIcon = (nType: string) => {
    switch (nType) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />
      default:
        return <Info className="w-5 h-5 text-[#6857DF]" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#252641]">Quản lý Thông báo Hệ thống</h1>
          <p className="text-sm text-[#777a91]">
            Soạn thảo và phát thông báo rộng rãi đến toàn thể học viên và giảng viên
          </p>
        </div>
      </div>

      {notice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
          <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form create notification */}
        <div className="bg-white rounded-2xl border border-[#eceef4] p-6 shadow-sm">
          <h2 className="text-base font-bold text-[#252641] mb-4 flex items-center gap-2">
            <Send className="w-4 h-4 text-[#6857DF]" /> Soạn thông báo mới
          </h2>

          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#777a91] uppercase tracking-wider mb-1.5">
                Tiêu đề thông báo
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Lịch bảo trì ngày 20/11..."
                className="w-full px-3.5 py-2.5 bg-[#f7f8fc] border border-[#eceef4] rounded-xl text-xs focus:outline-none focus:border-[#6857DF] focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#777a91] uppercase tracking-wider mb-1.5">
                Nội dung chi tiết
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Nhập nội dung cần gửi đến học viên / giảng viên..."
                className="w-full px-3.5 py-2.5 bg-[#f7f8fc] border border-[#eceef4] rounded-xl text-xs focus:outline-none focus:border-[#6857DF] focus:bg-white transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#777a91] uppercase tracking-wider mb-1.5">
                  Mức độ
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f7f8fc] border border-[#eceef4] rounded-xl text-xs focus:outline-none focus:border-[#6857DF]"
                >
                  <option value="info">Thông tin (Info)</option>
                  <option value="warning">Cảnh báo (Warning)</option>
                  <option value="success">Thành công (Success)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#777a91] uppercase tracking-wider mb-1.5">
                  Đối tượng nhận
                </label>
                <select
                  value={target}
                  onChange={(e) => setTarget(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#f7f8fc] border border-[#eceef4] rounded-xl text-xs focus:outline-none focus:border-[#6857DF]"
                >
                  <option value="all">Tất cả mọi người</option>
                  <option value="students">Chỉ Học viên</option>
                  <option value="teachers">Chỉ Giảng viên</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#6857DF] hover:bg-[#5144BE] text-white font-semibold rounded-xl text-xs transition duration-200 shadow-md shadow-[#6857DF]/25 disabled:opacity-50 mt-2"
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? 'Đang gửi...' : 'Phát thông báo ngay'}
            </button>
          </form>
        </div>

        {/* History Notifications List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#eceef4] p-6 shadow-sm">
          <h2 className="text-base font-bold text-[#252641] mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#6857DF]" /> Danh sách thông báo đã gửi
          </h2>

          <div className="space-y-3">
            {loading ? (
              <div className="py-12 text-center text-[#777a91]">
                <div className="w-8 h-8 mx-auto border-2 border-[#6857DF]/20 border-t-[#6857DF] rounded-full animate-spin mb-2" />
                Đang tải thông báo...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs">
                Chưa có thông báo nào được gửi.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="p-4 rounded-xl border border-[#eceef4] hover:bg-[#f7f8fc]/60 transition flex items-start gap-4"
                >
                  <div className="p-2 rounded-xl bg-gray-50 flex-shrink-0 mt-0.5">
                    {getTypeIcon(n.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-sm font-bold text-[#252641]">{n.title}</h3>
                      <span className="text-[11px] text-gray-400">
                        {new Date(n.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <p className="text-xs text-[#777a91]">{n.message}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-[#6857DF]">
                        {n.target === 'all'
                          ? 'Gửi toàn bộ'
                          : n.target === 'students'
                          ? 'Chỉ Học viên'
                          : 'Chỉ Giảng viên'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
