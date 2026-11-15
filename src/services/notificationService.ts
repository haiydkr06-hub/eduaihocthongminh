import { supabase, isSupabaseConfigured, withTimeout } from '../lib/supabase'
import type { AppRole } from '../types/auth'
import type { NotificationItem } from '../types/notification'
import { demoDb, type DbNotification } from './demoDb'

export type NotificationTarget = 'all' | 'students' | 'teachers' | 'admins'

export interface SendNotificationInput {
  title: string
  message: string
  type?: string
  /** Gửi đích danh một người; nếu bỏ trống thì gửi theo nhóm `target`. */
  userId?: string
  target?: NotificationTarget
}

const NEW_EVENT = 'eduai:new_notification'

function isForUser(n: DbNotification, role: AppRole, userId: string): boolean {
  if (n.user_id) return n.user_id === userId
  if (n.target === 'all') return true
  if (n.target === 'students') return role === 'student'
  if (n.target === 'teachers') return role === 'teacher'
  if (n.target === 'admins') return role === 'admin'
  return false
}

function toItem(n: DbNotification, userId: string): NotificationItem {
  return {
    id: n.id,
    user_id: n.user_id,
    title: n.title,
    message: n.message,
    type: n.type,
    is_read: n.read_by.includes(userId),
    created_at: n.created_at,
  }
}

const roleByTarget: Record<Exclude<NotificationTarget, 'all'>, AppRole> = {
  students: 'student',
  teachers: 'teacher',
  admins: 'admin',
}

export const notificationService = {
  async list(role: AppRole, userId: string): Promise<NotificationItem[]> {
    if (!isSupabaseConfigured) {
      return demoDb
        .read()
        .notifications.filter((n) => isForUser(n, role, userId))
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((n) => toItem(n, userId))
    }
    const { data, error } = await withTimeout(
      supabase
        .from('notifications')
        .select('id, user_id, title, message, type, is_read, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)
    )
    if (error) throw error
    return (data || []) as NotificationItem[]
  },

  async markRead(id: string, userId: string): Promise<void> {
    if (!isSupabaseConfigured) {
      demoDb.write((t) => {
        const n = t.notifications.find((x) => x.id === id)
        if (n && !n.read_by.includes(userId)) n.read_by.push(userId)
      })
      return
    }
    const { error } = await withTimeout(
      supabase.from('notifications').update({ is_read: true }).eq('id', id).eq('user_id', userId)
    )
    if (error) throw error
  },

  async markAllRead(role: AppRole, userId: string): Promise<void> {
    if (!isSupabaseConfigured) {
      demoDb.write((t) => {
        t.notifications.forEach((n) => {
          // Chỉ đánh dấu những thông báo thuộc về người này (trước đây đánh dấu chung cho mọi người)
          if (isForUser(n, role, userId) && !n.read_by.includes(userId)) n.read_by.push(userId)
        })
      })
      return
    }
    const { error } = await withTimeout(
      supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false)
    )
    if (error) throw error
  },

  /** Gửi thông báo. Ném lỗi nếu thất bại (không báo thành công giả). Trả về số người nhận. */
  async send(input: SendNotificationInput): Promise<number> {
    const type = input.type || 'info'
    const target = input.target || 'all'

    if (!isSupabaseConfigured) {
      const notice: DbNotification = {
        id: demoDb.newId('notif'),
        title: input.title,
        message: input.message,
        type,
        user_id: input.userId,
        target,
        created_at: new Date().toISOString(),
        read_by: [],
      }
      demoDb.write((t) => t.notifications.unshift(notice), NEW_EVENT, notice)
      return 1
    }

    let recipientIds: string[]
    if (input.userId) {
      recipientIds = [input.userId]
    } else {
      let query = supabase.from('profiles').select('id')
      if (target !== 'all') query = query.eq('role', roleByTarget[target])
      const { data, error } = await withTimeout(query)
      if (error) throw error
      recipientIds = ((data || []) as { id: string }[]).map((p) => p.id)
    }
    if (recipientIds.length === 0) return 0

    // Không dùng .select() sau insert: người gửi không có quyền đọc thông báo của người khác.
    const { error } = await withTimeout(
      supabase.from('notifications').insert(
        recipientIds.map((id) => ({ user_id: id, title: input.title, message: input.message, type }))
      )
    )
    if (error) throw error
    return recipientIds.length
  },

  /** Lắng nghe thông báo mới cho đúng người dùng. Trả về hàm hủy đăng ký. */
  subscribe(role: AppRole, userId: string, onNew: (item: NotificationItem) => void): () => void {
    if (!isSupabaseConfigured) {
      const handler = (e: Event) => {
        const n = (e as CustomEvent<DbNotification>).detail
        if (n && isForUser(n, role, userId)) onNew(toItem(n, userId))
      }
      window.addEventListener(NEW_EVENT, handler)
      return () => window.removeEventListener(NEW_EVENT, handler)
    }
    // Tên kênh riêng cho mỗi lần đăng ký (trước đây nhiều component dùng chung 1 tên kênh gây xung đột)
    const channel = supabase
      .channel(`notifications:${userId}:${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => onNew(payload.new as NotificationItem)
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  },
}
