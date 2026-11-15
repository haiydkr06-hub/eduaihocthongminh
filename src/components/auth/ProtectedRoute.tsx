import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import type { AppRole } from '../../types/auth'

interface ProtectedRouteProps {
  allowedRoles?: AppRole[]
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f8fc] gap-4">
        <div className="w-12 h-12 border-4 border-[#7966f2]/20 border-t-[#6857DF] rounded-full animate-spin" />
        <p className="text-sm font-medium text-[#777a91]">Đang xác thực thông tin...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/unauthorized" state={{ attemptedUrl: location.pathname, userRole: profile.role }} replace />
  }

  return <Outlet />
}
