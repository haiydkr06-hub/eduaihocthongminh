import { useEffect, useState, useMemo, useCallback, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured, withTimeout } from '../lib/supabase'
import type { AppRole, Profile, AuthContextType } from '../types/auth'
import { AuthContext } from './auth-context-base'

const DEMO_STORAGE_KEY = 'eduai_demo_auth'

function createDemoUser(email: string, role: AppRole): { user: User; profile: Profile } {
  const idMap: Record<AppRole, string> = {
    admin: '00000000-0000-0000-0000-000000000001',
    teacher: '11111111-1111-1111-1111-111111111111',
    student: '22222222-2222-2222-2222-222222222222',
  }
  const nameMap: Record<AppRole, string> = {
    admin: 'Quản trị viên Hệ thống',
    teacher: 'Thầy Nguyễn Văn An',
    student: 'Học sinh Nguyễn Văn Minh',
  }

  const user: User = {
    id: idMap[role],
    app_metadata: {},
    user_metadata: {
      full_name: nameMap[role],
      role,
    },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    email: email.trim(),
  }

  const profile: Profile = {
    id: user.id,
    email: user.email || email.trim(),
    full_name: user.user_metadata.full_name,
    role,
  }

  return { user, profile }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async (currentUser: User): Promise<Profile | null> => {
    const metaRole = (currentUser.user_metadata?.role as AppRole) || 'student'
    const metaName = currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Người dùng'

    const fallbackProfile: Profile = {
      id: currentUser.id,
      email: currentUser.email || '',
      full_name: metaName,
      role: metaRole,
      avatar_url: currentUser.user_metadata?.avatar_url || null,
    }

    if (!isSupabaseConfigured) {
      return fallbackProfile
    }

    try {
      const { data, error: profileErr } = await withTimeout(
        supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .maybeSingle(),
        2500
      )

      if (profileErr) {
        console.warn('Lỗi khi tải profile từ Supabase:', profileErr.message)
      }

      if (data) {
        return data as Profile
      }

      // Khởi tạo profile vào DB nếu có thể
      try {
        await withTimeout(supabase.from('profiles').upsert([fallbackProfile]), 2000)
      } catch {
        // bỏ qua lỗi nếu DB chưa sẵn sàng
      }

      return fallbackProfile
    } catch (err) {
      console.error('Lỗi ngoại lệ khi lấy profile:', err)
      return fallbackProfile
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      return
    }
    const p = await fetchProfile(user)
    setProfile(p)
  }, [user, fetchProfile])

  useEffect(() => {
    let mounted = true

    async function initAuth() {
      try {
        // 1. Kiểm tra session demo đã lưu trong localStorage
        const storedDemo = localStorage.getItem(DEMO_STORAGE_KEY)
        if (storedDemo) {
          try {
            const parsed = JSON.parse(storedDemo)
            if (parsed?.user && parsed?.profile) {
              if (mounted) {
                setUser(parsed.user)
                setProfile(parsed.profile)
                setLoading(false)
                return
              }
            }
          } catch {
            localStorage.removeItem(DEMO_STORAGE_KEY)
          }
        }

        // 2. Nếu Supabase chưa được cấu hình, kết thúc loading ngay lập tức
        if (!isSupabaseConfigured) {
          if (mounted) {
            setUser(null)
            setSession(null)
            setProfile(null)
            setLoading(false)
          }
          return
        }

        // 3. Nếu có cấu hình Supabase, truy vấn session với cơ chế timeout bảo vệ
        const { data, error: sessionErr } = await withTimeout(
          supabase.auth.getSession(),
          2500
        )
        if (sessionErr) throw sessionErr

        const currentSession = data?.session ?? null
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

    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        if (!mounted) return
        try {
          setSession(newSession)
          const newUser = newSession?.user ?? null
          setUser(newUser)

          if (newUser) {
            const p = await fetchProfile(newUser)
            if (mounted) setProfile(p)
          } else {
            setProfile(null)
          }
        } catch (err) {
          console.warn('onAuthStateChange error:', err)
        } finally {
          if (mounted) {
            setLoading(false)
          }
        }
      })

      return () => {
        mounted = false
        subscription.unsubscribe()
      }
    }

    return () => {
      mounted = false
    }
  }, [fetchProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null)
    const lower = email.trim().toLowerCase()
    const isDemo =
      lower.includes('hocsinh') ||
      lower.includes('student') ||
      lower.includes('giangvien') ||
      lower.includes('teacher') ||
      lower.includes('admin')

    // Tự động kích hoạt tài khoản demo nhanh chóng, không bị chậm hay lag
    if (isDemo || !isSupabaseConfigured) {
      const role: AppRole = lower.includes('admin')
        ? 'admin'
        : lower.includes('giangvien') || lower.includes('teacher')
        ? 'teacher'
        : 'student'

      const { user: demoUser, profile: demoProfile } = createDemoUser(email, role)
      setUser(demoUser)
      setProfile(demoProfile)
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify({ user: demoUser, profile: demoProfile }))
      return { error: null }
    }

    try {
      const { data, error: signInErr } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        3000
      )
      if (signInErr) {
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
      const errorObj = err instanceof Error ? err : new Error('Không thể đăng nhập')
      setError(errorObj.message)
      return { error: errorObj }
    }
  }, [fetchProfile])

  const signUp = useCallback(async (email: string, password: string, fullName: string, role: AppRole = 'student') => {
    setError(null)

    // Nếu chưa cấu hình Supabase, kích hoạt tài khoản demo trực tiếp
    if (!isSupabaseConfigured) {
      const { user: demoUser, profile: demoProfile } = createDemoUser(email, role)
      demoProfile.full_name = fullName.trim()
      demoUser.user_metadata.full_name = fullName.trim()
      setUser(demoUser)
      setProfile(demoProfile)
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify({ user: demoUser, profile: demoProfile }))
      return { error: null, user: demoUser }
    }

    try {
      const { data, error: signUpErr } = await withTimeout(
        supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role,
            },
          },
        }),
        3000
      )
      if (signUpErr) {
        setError(signUpErr.message)
        return { error: signUpErr, user: null }
      }

      if (data.user) {
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
  }, [fetchProfile])

  const signOut = useCallback(async () => {
    localStorage.removeItem(DEMO_STORAGE_KEY)
    try {
      if (isSupabaseConfigured) {
        await withTimeout(supabase.auth.signOut(), 2000)
      }
    } catch (err) {
      console.warn('Lỗi khi đăng xuất:', err)
    } finally {
      setUser(null)
      setSession(null)
      setProfile(null)
      setError(null)
    }
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    setError(null)
    if (!isSupabaseConfigured) {
      // Mock thành công cho môi trường demo
      return { error: null }
    }
    try {
      const { error: resetErr } = await withTimeout(
        supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        }),
        3000
      )
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
  }, [])

  const updatePassword = useCallback(async (newPassword: string) => {
    setError(null)
    if (!isSupabaseConfigured) {
      // Mock thành công cho môi trường demo
      return { error: null }
    }
    try {
      const { error: updateErr } = await withTimeout(
        supabase.auth.updateUser({ password: newPassword }),
        3000
      )
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
  }, [])

  const role = useMemo(() => profile?.role ?? null, [profile])

  const value = useMemo<AuthContextType>(
    () => ({
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
    }),
    [
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
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
