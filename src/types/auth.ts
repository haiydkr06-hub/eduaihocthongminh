import type { User, Session } from '@supabase/supabase-js'

export type AppRole = 'admin' | 'teacher' | 'student'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: AppRole
  avatar_url?: string | null
  phone?: string | null
  created_at?: string
  updated_at?: string
}

export interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  role: AppRole | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, fullName: string, role?: AppRole, phone?: string) => Promise<{ error: Error | null; user: User | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>
  refreshProfile: () => Promise<void>
  updateProfile: (fields: { full_name?: string; phone?: string | null }) => Promise<{ error: Error | null }>
}
