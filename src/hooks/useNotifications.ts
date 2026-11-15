import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { notificationService } from '../services/notificationService'
import { getFriendlyErrorMessage } from '../lib/errorMessage'
import type { NotificationItem } from '../types/notification'

/** Danh sách thông báo của người dùng hiện tại: tải, lắng nghe mới, đánh dấu đã đọc. */
export function useNotifications() {
  const { user, profile, role } = useAuth()
  const userId = user?.id
  const currentRole = profile?.role || role || 'student'

  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!userId) return
    setError(null)
    try {
      setNotifications(await notificationService.list(currentRole, userId))
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Không thể tải thông báo.'))
    } finally {
      setLoading(false)
    }
  }, [userId, currentRole])

  useEffect(() => {
    void Promise.resolve().then(reload)
  }, [reload])

  useEffect(() => {
    if (!userId) return
    return notificationService.subscribe(currentRole, userId, (item) => {
      setNotifications((prev) => (prev.some((n) => n.id === item.id) ? prev : [item, ...prev]))
    })
  }, [userId, currentRole])

  const markRead = useCallback(
    async (id: string) => {
      if (!userId) return
      const target = notifications.find((n) => n.id === id)
      if (!target || target.is_read) return
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
      try {
        await notificationService.markRead(id, userId)
      } catch (err) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: false } : n)))
        setError(getFriendlyErrorMessage(err, 'Không thể cập nhật trạng thái thông báo.'))
      }
    },
    [notifications, userId]
  )

  const markAllRead = useCallback(async () => {
    if (!userId) return
    const previous = notifications
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    try {
      await notificationService.markAllRead(currentRole, userId)
    } catch (err) {
      setNotifications(previous)
      setError(getFriendlyErrorMessage(err, 'Không thể đánh dấu tất cả đã đọc.'))
    }
  }, [notifications, currentRole, userId])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return { notifications, loading, error, unreadCount, markRead, markAllRead, reload }
}
