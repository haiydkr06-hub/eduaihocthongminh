import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LoginPage } from '../pages/auth/LoginPage'
import { RegisterPage } from '../pages/auth/RegisterPage'
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage'
import { UnauthorizedPage } from '../pages/error/UnauthorizedPage'
import { NotFoundPage } from '../pages/error/NotFoundPage'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import { RootRedirect } from '../components/auth/RootRedirect'
import { StudentDashboardPage } from '../pages/student/StudentDashboardPage'
import { TeacherDashboardPage } from '../pages/teacher/TeacherDashboardPage'
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRedirect />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
  },

  // Student Routes (Protected - Student & Admin)
  {
    path: '/student',
    element: <ProtectedRoute allowedRoles={['student', 'admin']} />,
    children: [
      {
        path: '',
        element: <Navigate to="/student/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <StudentDashboardPage />,
      },
    ],
  },

  // Teacher Routes (Protected - Teacher & Admin)
  {
    path: '/teacher',
    element: <ProtectedRoute allowedRoles={['teacher', 'admin']} />,
    children: [
      {
        path: '',
        element: <Navigate to="/teacher/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <TeacherDashboardPage />,
      },
    ],
  },

  // Admin Routes (Protected - Admin Only)
  {
    path: '/admin',
    element: <ProtectedRoute allowedRoles={['admin']} />,
    children: [
      {
        path: '',
        element: <Navigate to="/admin/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <AdminDashboardPage />,
      },
    ],
  },

  // 404 Catch All
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
