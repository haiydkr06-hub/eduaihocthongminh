import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { dashboardForRole } from '../../lib/demoAccounts'

export function RootRedirect() {
  const { user, profile, role, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f8fc] gap-4">
        <div className="w-12 h-12 border-4 border-[#7966f2]/20 border-t-[#6857DF] rounded-full animate-spin" />
        <p className="text-sm font-medium text-[#777a91]">Đang chuyển hướng...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={dashboardForRole(profile?.role || role)} replace />
}
