import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { sharedStore, type SharedNotification } from '../../services/sharedStore'
import type { NotificationItem } from '../../types/notification'

export function TeacherNotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [loading, setLoading] = useState(true)

  const userId = user?.id

  const fetchNotifications = useCallback(async () => {
    try {
      const shared = sharedStore.getSharedNotifications('teacher', userId)
      let combined: NotificationItem[] = shared.map((n) => ({
        id: n.id,
        user_id: n.user_id,
        title: n.title,
        message: n.message,
        type: n.type,
        is_read: n.is_read,
        created_at: n.created_at,
      }))

      if (isSupabaseConfigured && userId) {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (!error && data && data.length > 0) {
          const sbNotices = data as NotificationItem[]
          const existingIds = new Set(sbNotices.map((n) => n.id))
          const nonDupes = combined.filter((n) => !existingIds.has(n.id))
          combined = [...sbNotices, ...nonDupes]
        }
      }

      setNotifications(combined)
    } catch (err) {
      console.warn('Lỗi tải thông báo giảng viên:', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    let active = true
    const load = async () => {
      await Promise.resolve()
      if (!active) return
      await fetchNotifications()
    }
    void load()
    return () => {
      active = false
    }
  }, [fetchNotifications])

  useEffect(() => {
    const handleNew = (e: Event) => {
      const customEvent = e as CustomEvent<SharedNotification>
      const notice: SharedNotification = customEvent.detail
      if (!notice) return
      if (notice.target === 'all' || notice.target === 'teachers' || (userId && notice.user_id === userId)) {
        setNotifications((prev) => {
          if (prev.some((n) => n.id === notice.id)) return prev
          return [notice, ...prev]
        })
      }
    }

    window.addEventListener('eduai:new_notification', handleNew)
    return () => {
      window.removeEventListener('eduai:new_notification', handleNew)
    }
  }, [userId])

  const handleMarkAsRead = async (noticeId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === noticeId ? { ...n, is_read: true } : n))
    )

    sharedStore.markSharedNotificationRead(noticeId)

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', noticeId)
      } catch (err) {
        console.warn('Lỗi cập nhật đã đọc:', err)
      }
    }
  }

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    sharedStore.markAllSharedNotificationsRead('teacher')

    if (isSupabaseConfigured && user?.id) {
      try {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', user.id)
          .eq('is_read', false)
      } catch (err) {
        console.warn('Lỗi đánh dấu tất cả đã đọc:', err)
      }
    }
  }

  const filteredList =
    filter === 'unread' ? notifications.filter((n) => !n.is_read) : notifications

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#eceef4] shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#252641]">
            Thông báo Giảng viên
          </h1>
          <p className="text-xs sm:text-sm text-[#777a91] mt-1">
            Thông tin phê duyệt khóa học, kế hoạch giảng dạy và thông báo hệ thống từ Quản trị viên.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-[#F0EDFF] text-[#6857DF] hover:bg-[#e4dfff] font-semibold text-xs sm:text-sm transition duration-150"
          >
            Đánh dấu tất cả đã đọc ({unreadCount})
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
            filter === 'all'
              ? 'bg-[#6857DF] text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          Tất cả ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
            filter === 'unread'
              ? 'bg-[#6857DF] text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          Chưa đọc ({unreadCount})
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#eceef4] shadow-sm divide-y divide-gray-100 overflow-hidden">
        {loading && notifications.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">Đang tải danh sách thông báo...</div>
        ) : filteredList.length > 0 ? (
          filteredList.map((item) => (
            <div
              key={item.id}
              onClick={() => handleMarkAsRead(item.id)}
              className={`p-4 sm:p-5 flex items-start gap-4 transition cursor-pointer hover:bg-gray-50/80 ${
                !item.is_read ? 'bg-[#F0EDFF]/30' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">
                {item.type === 'warning' ? '⚠️' : item.type === 'success' ? '🎉' : '📢'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className={`text-sm sm:text-base font-bold ${!item.is_read ? 'text-[#252641]' : 'text-gray-700'}`}>
                    {item.title}
                  </h3>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(item.created_at).toLocaleDateString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  {item.message}
                </p>
              </div>
              {!item.is_read && (
                <span className="w-2.5 h-2.5 rounded-full bg-[#6857DF] flex-shrink-0 mt-2" title="Chưa đọc" />
              )}
            </div>
          ))
        ) : (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">🔔</div>
            <h3 className="text-sm font-bold text-gray-800">Không có thông báo nào</h3>
            <p className="text-xs text-gray-400 mt-1">
              {filter === 'unread' ? 'Thầy/Cô đã đọc hết thông báo.' : 'Hộp thư thông báo của Giảng viên đang trống.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default TeacherNotificationsPage
