import type { User } from '@supabase/supabase-js'
import type { AppRole, Profile } from '../types/auth'

/**
 * Tài khoản demo chỉ dùng khi CHƯA cấu hình Supabase (chế độ trình diễn cục bộ).
 * Khi đã có Supabase, mọi đăng nhập đều đi qua Supabase Auth — không có lối tắt demo.
 */
export const DEMO_PASSWORD = '123456'

export const DEMO_IDS: Record<AppRole, string> = {
  admin: '00000000-0000-0000-0000-000000000001',
  teacher: '11111111-1111-1111-1111-111111111111',
  student: '22222222-2222-2222-2222-222222222222',
}

interface StoredDemoAccount {
  id: string
  email: string
  passwordHash: string
  fullName: string
  phone?: string
  role: AppRole
}

const ACCOUNTS_KEY = 'eduai_demo_accounts'

const builtInAccounts: Omit<StoredDemoAccount, 'passwordHash'>[] = [
  { id: DEMO_IDS.student, email: 'student@demo.com', fullName: 'Học sinh Nguyễn Văn Minh', role: 'student' },
  { id: DEMO_IDS.teacher, email: 'teacher@demo.com', fullName: 'Thầy Nguyễn Văn An', role: 'teacher' },
  { id: DEMO_IDS.admin, email: 'admin@demo.com', fullName: 'Quản trị viên Hệ thống', role: 'admin' },
]

async function hashPassword(email: string, password: string): Promise<string> {
  const bytes = new TextEncoder().encode(`eduai-demo:${email}:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

function readRegistered(): StoredDemoAccount[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]')
    return Array.isArray(parsed) ? (parsed as StoredDemoAccount[]) : []
  } catch {
    return []
  }
}

function toSession(account: Omit<StoredDemoAccount, 'passwordHash'>): { user: User; profile: Profile } {
  const user: User = {
    id: account.id,
    app_metadata: {},
    user_metadata: { full_name: account.fullName },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    email: account.email,
  }
  const profile: Profile = {
    id: account.id,
    email: account.email,
    full_name: account.fullName,
    role: account.role,
    phone: account.phone ?? null,
  }
  return { user, profile }
}

export async function demoSignIn(email: string, password: string) {
  const normalized = email.trim().toLowerCase()
  const builtIn = builtInAccounts.find((a) => a.email === normalized)
  if (builtIn) {
    return password === DEMO_PASSWORD ? toSession(builtIn) : null
  }
  const registered = readRegistered().find((a) => a.email === normalized)
  if (!registered) return null
  const hash = await hashPassword(normalized, password)
  return hash === registered.passwordHash ? toSession(registered) : null
}

export async function demoSignUp(
  email: string,
  password: string,
  fullName: string,
  role: AppRole,
  phone?: string
) {
  const normalized = email.trim().toLowerCase()
  const registered = readRegistered()
  if (builtInAccounts.some((a) => a.email === normalized) || registered.some((a) => a.email === normalized)) {
    throw new Error('User already registered')
  }
  // Không ai được tự đăng ký làm Admin, kể cả ở chế độ demo.
  const safeRole: AppRole = role === 'teacher' ? 'teacher' : 'student'
  const account: StoredDemoAccount = {
    id: crypto.randomUUID(),
    email: normalized,
    passwordHash: await hashPassword(normalized, password),
    fullName: fullName.trim(),
    phone: phone?.trim() || undefined,
    role: safeRole,
  }
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...registered, account]))
  return toSession(account)
}

/** Cập nhật họ tên / SĐT của tài khoản demo tự đăng ký (tài khoản dựng sẵn chỉ đổi trong phiên). */
export function demoUpdateAccount(email: string, fields: { fullName?: string; phone?: string }) {
  const normalized = email.trim().toLowerCase()
  const registered = readRegistered()
  const idx = registered.findIndex((a) => a.email === normalized)
  if (idx === -1) return
  registered[idx] = {
    ...registered[idx],
    fullName: fields.fullName ?? registered[idx].fullName,
    phone: fields.phone ?? registered[idx].phone,
  }
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(registered))
}

/** Đổi mật khẩu tài khoản demo tự đăng ký. Tài khoản dựng sẵn dùng mật khẩu cố định. */
export async function demoChangePassword(email: string, newPassword: string) {
  const normalized = email.trim().toLowerCase()
  if (builtInAccounts.some((a) => a.email === normalized)) {
    throw new Error('Tài khoản demo dựng sẵn dùng mật khẩu cố định 123456, không thể đổi.')
  }
  const registered = readRegistered()
  const idx = registered.findIndex((a) => a.email === normalized)
  if (idx === -1) throw new Error('Không tìm thấy tài khoản.')
  registered[idx] = { ...registered[idx], passwordHash: await hashPassword(normalized, newPassword) }
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(registered))
}

/** Danh sách tài khoản đã đăng ký ở chế độ demo (dùng cho trang Admin). */
export function listDemoAccounts(): Profile[] {
  return [...builtInAccounts, ...readRegistered()].map((a) => toSession(a).profile)
}

/** Lấy đường dẫn chuyển hướng nội bộ an toàn từ query `redirect` (chặn open redirect). */
export function getSafeRedirect(search: string): string | null {
  const value = new URLSearchParams(search).get('redirect')
  if (!value) return null
  // Chỉ chấp nhận đường dẫn tương đối nội bộ: bắt đầu bằng "/" nhưng không phải "//" hay "/\".
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return null
  return value
}

export function dashboardForRole(role: AppRole | null | undefined): string {
  if (role === 'admin') return '/admin/dashboard'
  if (role === 'teacher') return '/teacher/dashboard'
  return '/student/dashboard'
}
