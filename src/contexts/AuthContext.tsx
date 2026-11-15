import { useEffect, useState, useMemo, useCallback, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured, withTimeout } from '../lib/supabase'
import type { AppRole, Profile, AuthContextType } from '../types/auth'
import { AuthContext } from './auth-context-base'
import { demoSignIn, demoSignUp, demoUpdateAccount, demoChangePassword } from '../lib/demoAccounts'
import { demoDb } from '../services/demoDb'

const DEMO_STORAGE_KEY = 'eduai_demo_auth'

/** Vai trò lấy từ metadata do người dùng tự gửi lên: chỉ tin student/teacher, KHÔNG BAO GIỜ tin admin. */
function safeMetadataRole(value: unknown): AppRole {
  return value === 'teacher' ? 'teacher' : 'student'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async (currentUser: User): Promise<Profile | null> => {
    const metaRole = safeMetadataRole(currentUser.user_metadata?.role)
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
        10000
      )

      if (profileErr) {
        console.warn('Lỗi khi tải profile từ Supabase:', profileErr.message)
      }

      if (data) {
        return data as Profile
      }

      // Profile được trigger `handle_new_user` tạo ở server; client không tự ghi profile/role.
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
        // 1. Session demo chỉ có hiệu lực khi CHƯA cấu hình Supabase
        const storedDemo = localStorage.getItem(DEMO_STORAGE_KEY)
        if (storedDemo && isSupabaseConfigured) {
          localStorage.removeItem(DEMO_STORAGE_KEY)
        } else if (storedDemo) {
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
          10000
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

    // Chế độ demo (chưa cấu hình Supabase): chỉ chấp nhận tài khoản demo + đúng mật khẩu
    if (!isSupabaseConfigured) {
      const demo = await demoSignIn(email, password)
      if (!demo) {
        const err = new Error('Invalid login credentials')
        setError(err.message)
        return { error: err }
      }
      setUser(demo.user)
      setProfile(demo.profile)
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demo))
      demoDb.ensureProfile(demo.profile)
      return { error: null }
    }

    try {
      const { data, error: signInErr } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        15000
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

  const signUp = useCallback(async (email: string, password: string, fullName: string, role: AppRole = 'student', phone?: string) => {
    setError(null)
    // Không ai được tự đăng ký làm Admin
    const safeRole: AppRole = role === 'teacher' ? 'teacher' : 'student'

    // Chế độ demo: lưu tài khoản cục bộ (mật khẩu được băm), không cho trùng email
    if (!isSupabaseConfigured) {
      try {
        const demo = await demoSignUp(email, password, fullName, safeRole, phone)
        setUser(demo.user)
        setProfile(demo.profile)
        localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demo))
      demoDb.ensureProfile(demo.profile)
        return { error: null, user: demo.user }
      } catch (err: unknown) {
        const errorObj = err instanceof Error ? err : new Error('Không thể đăng ký')
        setError(errorObj.message)
        return { error: errorObj, user: null }
      }
    }

    try {
      const { data, error: signUpErr } = await withTimeout(
        supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phone?.trim() || null,
              role: safeRole,
            },
          },
        }),
        15000
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
        await withTimeout(supabase.auth.signOut(), 5000)
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
      // Chế độ demo không có máy chủ gửi email -> báo rõ thay vì báo "đã gửi" giả
      const demoErr = new Error(
        'Chế độ demo chưa kết nối máy chủ email nên không gửi được thư khôi phục. Tài khoản demo dùng mật khẩu 123456; tài khoản bạn tự đăng ký có thể đổi mật khẩu trong mục Hồ sơ sau khi đăng nhập.'
      )
      setError(demoErr.message)
      return { error: demoErr }
    }
    try {
      const { error: resetErr } = await withTimeout(
        supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        }),
        15000
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
      // Chế độ demo: đổi mật khẩu thật cho tài khoản tự đăng ký (trước đây báo thành công giả)
      try {
        await demoChangePassword(user?.email || '', newPassword)
        return { error: null }
      } catch (err: unknown) {
        const errorObj = err instanceof Error ? err : new Error('Không thể đổi mật khẩu')
        setError(errorObj.message)
        return { error: errorObj }
      }
    }
    try {
      const { error: updateErr } = await withTimeout(
        supabase.auth.updateUser({ password: newPassword }),
        15000
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
  }, [user])

  /** Cập nhật họ tên / SĐT. Không cho phép đổi role hay email ở đây. */
  const updateProfile = useCallback(
    async (fields: { full_name?: string; phone?: string | null }) => {
      if (!profile) return { error: new Error('Bạn chưa đăng nhập') }
      const fullName = fields.full_name?.trim()
      if (fields.full_name !== undefined && !fullName) return { error: new Error('Họ tên không được để trống.') }
      const patch = {
        ...(fullName !== undefined ? { full_name: fullName } : {}),
        ...(fields.phone !== undefined ? { phone: fields.phone?.trim() || null } : {}),
      }

      if (!isSupabaseConfigured) {
        const nextProfile: Profile = { ...profile, ...patch }
        setProfile(nextProfile)
        const stored = localStorage.getItem(DEMO_STORAGE_KEY)
        if (stored) {
          try {
            const parsed = JSON.parse(stored)
            localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify({ ...parsed, profile: nextProfile }))
          } catch {
            // bỏ qua
          }
        }
        demoUpdateAccount(profile.email, { fullName: patch.full_name, phone: patch.phone ?? undefined })
        demoDb.write((t) => {
          const row = t.profiles.find((p) => p.id === profile.id)
          if (row && patch.full_name) row.full_name = patch.full_name
        })
        return { error: null }
      }

      try {
        const { data, error: updErr } = await withTimeout(
          supabase.from('profiles').update(patch).eq('id', profile.id).select().single()
        )
        if (updErr) return { error: new Error(updErr.message) }
        setProfile(data as Profile)
        return { error: null }
      } catch (err: unknown) {
        return { error: err instanceof Error ? err : new Error('Không thể cập nhật hồ sơ') }
      }
    },
    [profile]
  )

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
      updateProfile,
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
      updateProfile,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
