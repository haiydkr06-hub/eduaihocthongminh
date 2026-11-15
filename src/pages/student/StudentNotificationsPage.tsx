import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { sharedStore, type SharedNotification } from '../../services/sharedStore'
import type { NotificationItem } from '../../types/notification'

export function StudentNotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [loading, setLoading] = useState(false)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const shared = sharedStore.getSharedNotifications('student', user?.id)
      let combined: NotificationItem[] = shared.map((n) => ({
        id: n.id,
        user_id: n.user_id,
        title: n.title,
        message: n.message,
        type: n.type,
        is_read: n.is_read,
        created_at: n.created_at,
      }))

      if (isSupabaseConfigured && user?.id) {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
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
      console.warn('Lỗi fetch notifications:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Lắng nghe sự kiện thông báo mới từ hệ thống (CustomEvent)
  useEffect(() => {
    const handleNew = (e: any) => {
      const notice: SharedNotification = e.detail
      if (!notice) return
      if (notice.target === 'all' || notice.target === 'students' || (user?.id && notice.user_id === user.id)) {
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
  }, [user?.id])

  // Lắng nghe Realtime qua kênh 'custom-all-channel'
  useEffect(() => {
    if (!isSupabaseConfigured) return

    const channel = supabase
      .channel('custom-all-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const newNotice = payload.new as NotificationItem
          if (!newNotice.user_id || newNotice.user_id === user?.id) {
            setNotifications((prev) => [newNotice, ...prev])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

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

    sharedStore.markAllSharedNotificationsRead('student')

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            Thông báo của bạn
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Cập nhật tin tức khóa học, thông báo từ Quản trị viên và hệ thống EduAI.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-primary-50 text-primary-700 hover:bg-primary-100 font-semibold text-xs sm:text-sm transition duration-150 border border-primary-200"
          >
            Đánh dấu tất cả đã đọc ({unreadCount})
          </button>
        )}
      </div>

      {/* Bộ lọc tab */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
            filter === 'all'
              ? 'bg-primary-600 text-white shadow-xs'
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
              ? 'bg-primary-600 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          Chưa đọc ({unreadCount})
        </button>
      </div>

      {/* Danh sách thông báo */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs divide-y divide-gray-100 overflow-hidden">
        {loading && notifications.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">Đang tải danh sách thông báo...</div>
        ) : filteredList.length > 0 ? (
          filteredList.map((item) => (
            <div
              key={item.id}
              onClick={() => handleMarkAsRead(item.id)}
              className={`p-4 sm:p-5 flex items-start gap-4 transition cursor-pointer hover:bg-gray-50/80 ${
                !item.is_read ? 'bg-primary-50/20' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">
                {item.type === 'warning' ? '⚠️' : item.type === 'success' ? '🎉' : '📢'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className={`text-sm sm:text-base font-bold ${!item.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
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
                <span className="w-2.5 h-2.5 rounded-full bg-primary-600 flex-shrink-0 mt-2" title="Chưa đọc" />
              )}
            </div>
          ))
        ) : (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">🔔</div>
            <h3 className="text-sm font-bold text-gray-800">Không có thông báo nào</h3>
            <p className="text-xs text-gray-400 mt-1">
              {filter === 'unread' ? 'Bạn đã đọc hết tất cả thông báo.' : 'Hộp thư thông báo của bạn đang trống.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default StudentNotificationsPage
