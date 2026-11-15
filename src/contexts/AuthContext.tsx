import { useEffect, useState, useMemo, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { AppRole, Profile, AuthContextType } from '../types/auth'
import { AuthContext } from './auth-context-base'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = async (currentUser: User): Promise<Profile | null> => {
    try {
      const { data, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle()

      if (profileErr) {
        console.warn('Lỗi khi tải profile từ Supabase:', profileErr.message)
      }

      if (data) {
        return data as Profile
      }

      // Nếu chưa có profile trong bảng (hoặc trigger chưa chạy), lấy từ user_metadata
      const metaRole = (currentUser.user_metadata?.role as AppRole) || 'student'
      const metaName = currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Người dùng'

      const fallbackProfile: Profile = {
        id: currentUser.id,
        email: currentUser.email || '',
        full_name: metaName,
        role: metaRole,
        avatar_url: currentUser.user_metadata?.avatar_url || null,
      }

      // Thử khởi tạo profile vào DB nếu có thể
      try {
        await supabase.from('profiles').upsert([fallbackProfile])
      } catch {
        // bỏ qua lỗi nếu bảng chưa tồn tại
      }

      return fallbackProfile
    } catch (err) {
      console.error('Lỗi ngoại lệ khi lấy profile:', err)
      const metaRole = (currentUser.user_metadata?.role as AppRole) || 'student'
      return {
        id: currentUser.id,
        email: currentUser.email || '',
        full_name: currentUser.email?.split('@')[0] || 'Người dùng',
        role: metaRole,
      }
    }
  }

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null)
      return
    }
    const p = await fetchProfile(user)
    setProfile(p)
  }

  useEffect(() => {
    let mounted = true

    async function initAuth() {
      try {
        const { data: { session: currentSession }, error: sessionErr } = await supabase.auth.getSession()
        if (sessionErr) throw sessionErr

        if (mounted) {
          setSession(currentSession)
          setUser(currentSession?.user ?? null)
          if (currentSession?.user) {
            const p = await fetchProfile(currentSession.user)
            if (mounted) setProfile(p)
          }
        }
      } catch (err: unknown) {
        if (mounted) {
          const msg = err instanceof Error ? err.message : 'Lỗi khởi tạo phiên đăng nhập'
          console.warn(msg)
          setError(msg)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return
      setSession(newSession)
      const newUser = newSession?.user ?? null
      setUser(newUser)

      if (newUser) {
        const p = await fetchProfile(newUser)
        if (mounted) setProfile(p)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    setError(null)
    try {
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
      if (signInErr) {
        // Hỗ trợ chế độ demo trải nghiệm hoặc khi chưa cấu hình Supabase
        const lower = email.toLowerCase()
        if (lower.includes('hocsinh') || lower.includes('student') || lower.includes('giangvien') || lower.includes('teacher') || lower.includes('admin')) {
          const role: AppRole = lower.includes('admin') ? 'admin' : (lower.includes('giangvien') || lower.includes('teacher') ? 'teacher' : 'student')
          const demoUser: User = {
            id: role === 'admin' ? '00000000-0000-0000-0000-000000000001' : (role === 'teacher' ? '11111111-1111-1111-1111-111111111111' : '22222222-2222-2222-2222-222222222222'),
            app_metadata: {},
            user_metadata: {
              full_name: role === 'admin' ? 'Quản trị viên Hệ thống' : (role === 'teacher' ? 'Thầy Nguyễn Văn An' : 'Học sinh Nguyễn Văn Minh'),
              role,
            },
            aud: 'authenticated',
            created_at: new Date().toISOString(),
            email,
          }
          const demoProfile: Profile = {
            id: demoUser.id,
            email,
            full_name: demoUser.user_metadata.full_name,
            role,
          }
          setUser(demoUser)
          setProfile(demoProfile)
          return { error: null }
        }

        setError(signInErr.message)
        return { error: signInErr }
      }
      if (data.user) {
        setUser(data.user)
        setSession(data.session)
        const p = await fetchProfile(data.user)
        setProfile(p)
      }
      return { error: null }
    } catch (err: unknown) {
      const lower = email.toLowerCase()
      if (lower.includes('hocsinh') || lower.includes('student') || lower.includes('giangvien') || lower.includes('teacher') || lower.includes('admin')) {
        const role: AppRole = lower.includes('admin') ? 'admin' : (lower.includes('giangvien') || lower.includes('teacher') ? 'teacher' : 'student')
        const demoUser: User = {
          id: role === 'admin' ? '00000000-0000-0000-0000-000000000001' : (role === 'teacher' ? '11111111-1111-1111-1111-111111111111' : '22222222-2222-2222-2222-222222222222'),
          app_metadata: {},
          user_metadata: {
            full_name: role === 'admin' ? 'Quản trị viên Hệ thống' : (role === 'teacher' ? 'Thầy Nguyễn Văn An' : 'Học sinh Nguyễn Văn Minh'),
            role,
          },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          email,
        }
        const demoProfile: Profile = {
          id: demoUser.id,
          email,
          full_name: demoUser.user_metadata.full_name,
          role,
        }
        setUser(demoUser)
        setProfile(demoProfile)
        return { error: null }
      }

      const errorObj = err instanceof Error ? err : new Error('Không thể đăng nhập')
      setError(errorObj.message)
      return { error: errorObj }
    }
  }

  const signUp = async (email: string, password: string, fullName: string, role: AppRole = 'student') => {
    setError(null)
    try {
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
          },
        },
      })
      if (signUpErr) {
        setError(signUpErr.message)
        return { error: signUpErr, user: null }
      }

      if (data.user) {
        // Nếu user tự động đăng nhập (confirm email tắt)
        if (data.session) {
          setUser(data.user)
          setSession(data.session)
          const p = await fetchProfile(data.user)
          setProfile(p)
        }
      }

      return { error: null, user: data.user }
    } catch (err: unknown) {
      const errorObj = err instanceof Error ? err : new Error('Không thể đăng ký')
      setError(errorObj.message)
      return { error: errorObj, user: null }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.warn('Lỗi khi đăng xuất:', err)
    } finally {
      setUser(null)
      setSession(null)
      setProfile(null)
      setError(null)
    }
  }

  const resetPassword = async (email: string) => {
    setError(null)
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (resetErr) {
        setError(resetErr.message)
        return { error: resetErr }
      }
      return { error: null }
    } catch (err: unknown) {
      const errorObj = err instanceof Error ? err : new Error('Lỗi gửi email đặt lại mật khẩu')
      setError(errorObj.message)
      return { error: errorObj }
    }
  }

  const updatePassword = async (newPassword: string) => {
    setError(null)
    try {
      const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword })
      if (updateErr) {
        setError(updateErr.message)
        return { error: updateErr }
      }
      return { error: null }
    } catch (err: unknown) {
      const errorObj = err instanceof Error ? err : new Error('Lỗi cập nhật mật khẩu')
      setError(errorObj.message)
      return { error: errorObj }
    }
  }

  const role = useMemo(() => profile?.role ?? null, [profile])

  const value: AuthContextType = {
    user,
    profile,
    session,
    role,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
