export interface NotificationItem {
  id: string
  user_id?: string
  title: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error' | string
  is_read: boolean
  created_at: string
}
