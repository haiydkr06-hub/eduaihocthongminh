import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { sharedStore, type SharedNotification } from '../../services/sharedStore'
import type { NotificationItem } from '../../types/notification'

export function NotificationBell() {
  const { user, profile, role } = useAuth()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const currentRole = (profile?.role || role || 'student') as 'student' | 'teacher' | 'admin'

  // Định dạng thời gian tương đối
  const formatTimeAgo = (dateStr: string) => {
    try {
      const past = new Date(dateStr).getTime()
      const now = Date.now()
      const diffSec = Math.floor((now - past) / 1000)

      if (diffSec < 60) return 'Vừa xong'
      const diffMin = Math.floor(diffSec / 60)
      if (diffMin < 60) return `${diffMin} phút trước`
      const diffHour = Math.floor(diffMin / 60)
      if (diffHour < 24) return `${diffHour} giờ trước`
      const diffDay = Math.floor(diffHour / 24)
      if (diffDay < 7) return `${diffDay} ngày trước`
      return new Date(dateStr).toLocaleDateString('vi-VN')
    } catch {
      return 'Gần đây'
    }
  }

  // Tải danh sách thông báo của user đang đăng nhập
  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Lấy thông báo từ sharedStore theo vai trò của người dùng
      const sharedList = sharedStore.getSharedNotifications(currentRole, user?.id)
      let combined: NotificationItem[] = sharedList.map((n) => ({
        id: n.id,
        user_id: n.user_id,
        title: n.title,
        message: n.message,
        type: n.type,
        is_read: n.is_read,
        created_at: n.created_at,
      }))

      // 2. Nếu có Supabase, truy vấn thêm từ bảng notifications
      if (isSupabaseConfigured && user?.id) {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20)

        if (!error && data && data.length > 0) {
          const sbNotices = data as NotificationItem[]
          const existingIds = new Set(sbNotices.map((n) => n.id))
          const nonDupes = combined.filter((n) => !existingIds.has(n.id))
          combined = [...sbNotices, ...nonDupes]
        }
      }

      setNotifications(combined)
      const unread = combined.filter((n) => !n.is_read).length
      setUnreadCount(unread)
    } catch (err) {
      console.warn('Lỗi khi fetch thông báo:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id, currentRole])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Lắng nghe sự kiện thông báo mới từ hệ thống (khi Admin gửi thông báo)
  useEffect(() => {
    const handleNewNotification = (e: any) => {
      const notice: SharedNotification = e.detail
      if (!notice) return

      // Kiểm tra đối tượng nhận thông báo (all, students, teachers hoặc đích danh user_id)
      const isTarget =
        notice.target === 'all' ||
        (currentRole === 'student' && notice.target === 'students') ||
        (currentRole === 'teacher' && notice.target === 'teachers') ||
        (user?.id && notice.user_id === user.id)

      if (isTarget) {
        setNotifications((prev) => {
          if (prev.some((n) => n.id === notice.id)) return prev
          return [notice, ...prev]
        })
        if (!notice.is_read) {
          setUnreadCount((prev) => prev + 1)
        }
      }
    }

    window.addEventListener('eduai:new_notification', handleNewNotification)
    return () => {
      window.removeEventListener('eduai:new_notification', handleNewNotification)
    }
  }, [currentRole, user?.id])

  // Lắng nghe Supabase Realtime qua kênh 'custom-all-channel'
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
            setNotifications((prev) => {
              if (prev.some((item) => item.id === newNotice.id)) return prev
              return [newNotice, ...prev]
            })
            if (!newNotice.is_read) {
              setUnreadCount((prev) => prev + 1)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Đánh dấu 1 thông báo đã đọc
  const handleMarkAsRead = async (notice: NotificationItem) => {
    if (notice.is_read) return

    setNotifications((prev) =>
      prev.map((n) => (n.id === notice.id ? { ...n, is_read: true } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))

    // Lưu vào sharedStore
    sharedStore.markSharedNotificationRead(notice.id)

    // Cập nhật lên Supabase nếu có
    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notice.id)
      } catch (err) {
        console.warn('Lỗi cập nhật đã đọc:', err)
      }
    }
  }

  // Đánh dấu tất cả thông báo đã đọc
  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)

    // Lưu vào sharedStore
    sharedStore.markAllSharedNotificationsRead(currentRole)

    // Cập nhật lên Supabase nếu có
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

  const getNoticeIcon = (type?: string) => {
    switch (type) {
      case 'warning':
        return <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">⚠️</span>
      case 'success':
        return <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">🎉</span>
      case 'error':
        return <span className="p-1.5 rounded-lg bg-red-50 text-red-600">🔔</span>
      default:
        return <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">📢</span>
    }
  }

  const handleNavigateAll = () => {
    setIsOpen(false)
    if (currentRole === 'teacher') {
      navigate('/teacher/notifications')
    } else {
      navigate('/student/notifications')
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Nút Chuông Thông Báo */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Thông báo"
        className={`relative p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition duration-150 ${
          isOpen ? 'bg-gray-100 text-gray-900' : ''
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {/* Chấm đỏ / Badge khi có thông báo chưa đọc */}
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Danh Sách Thông Báo */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-200/90 overflow-hidden z-50 animate-fade-in text-gray-900">
          {/* Header */}
          <div className="p-3.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-gray-900">Thông báo</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-semibold">
                  {unreadCount} mới
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline"
              >
                Đánh dấu đã đọc
              </button>
            )}
          </div>

          {/* List items */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">Đang tải thông báo...</div>
            ) : notifications.length > 0 ? (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleMarkAsRead(item)}
                  className={`p-3.5 flex items-start gap-3 transition cursor-pointer hover:bg-gray-50 ${
                    !item.is_read ? 'bg-primary-50/30' : ''
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">{getNoticeIcon(item.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className={`text-xs font-bold truncate ${!item.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                        {item.title}
                      </span>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">
                        {formatTimeAgo(item.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                      {item.message}
                    </p>
                  </div>
                  {!item.is_read && (
                    <span className="w-2 h-2 rounded-full bg-primary-600 flex-shrink-0 mt-1.5" title="Chưa đọc" />
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <div className="text-2xl mb-1">🔔</div>
                <p className="text-xs font-semibold text-gray-700">Chưa có thông báo nào</p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Các thông báo từ hệ thống và khóa học sẽ xuất hiện tại đây.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-gray-100 bg-gray-50 text-center">
            <button
              type="button"
              onClick={handleNavigateAll}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline"
            >
              Xem tất cả thông báo →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
