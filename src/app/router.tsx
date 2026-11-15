import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LoginPage } from '../pages/auth/LoginPage'
import { RegisterPage } from '../pages/auth/RegisterPage'
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage'
import { UnauthorizedPage } from '../pages/error/UnauthorizedPage'
import { NotFoundPage } from '../pages/error/NotFoundPage'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import { RootRedirect } from '../components/auth/RootRedirect'
import { StudentLayout } from '../components/layout/StudentLayout'
import { StudentDashboardPage } from '../pages/student/StudentDashboardPage'
import { StudentCoursesPage } from '../pages/student/StudentCoursesPage'
import { StudentLearnPage } from '../pages/student/StudentLearnPage'
import { StudentQuizPage } from '../pages/student/StudentQuizPage'
import { StudentSchedulePage } from '../pages/student/StudentSchedulePage'
import { StudentAchievementsPage } from '../pages/student/StudentAchievementsPage'
import { StudentProfilePage } from '../pages/student/StudentProfilePage'
import { StudentAiAssistantPage } from '../pages/student/StudentAiAssistantPage'
import { TeacherLayout } from '../components/layout/TeacherLayout'
import { TeacherDashboardPage } from '../pages/teacher/TeacherDashboardPage'
import { TeacherCoursesPage } from '../pages/teacher/TeacherCoursesPage'
import { TeacherClassesPage } from '../pages/teacher/TeacherClassesPage'
import { TeacherQuizzesPage } from '../pages/teacher/TeacherQuizzesPage'
import { TeacherAiQuizPage } from '../pages/teacher/TeacherAiQuizPage'
import { TeacherGradingPage } from '../pages/teacher/TeacherGradingPage'
import { TeacherAnalyticsPage } from '../pages/teacher/TeacherAnalyticsPage'
import { TeacherProfilePage } from '../pages/teacher/TeacherProfilePage'
import { AdminLayout } from '../components/layout/AdminLayout'
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage'
import { AdminUsersPage } from '../pages/admin/AdminUsersPage'
import { AdminCoursesPage } from '../pages/admin/AdminCoursesPage'
import { AdminQuizzesPage } from '../pages/admin/AdminQuizzesPage'
import { AdminReportsPage } from '../pages/admin/AdminReportsPage'
import { AdminNotificationsPage } from '../pages/admin/AdminNotificationsPage'
import { AdminSettingsPage } from '../pages/admin/AdminSettingsPage'

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
        element: <StudentLayout />,
        children: [
          {
            path: '',
            element: <Navigate to="/student/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <StudentDashboardPage />,
          },
          {
            path: 'courses',
            element: <StudentCoursesPage />,
          },
          {
            path: 'learn/:courseId',
            element: <StudentLearnPage />,
          },
          {
            path: 'quiz/:quizId',
            element: <StudentQuizPage />,
          },
          {
            path: 'schedule',
            element: <StudentSchedulePage />,
          },
          {
            path: 'achievements',
            element: <StudentAchievementsPage />,
          },
          {
            path: 'profile',
            element: <StudentProfilePage />,
          },
          {
            path: 'ai-assistant',
            element: <StudentAiAssistantPage />,
          },
        ],
      },
    ],
  },

  // Teacher Routes (Protected - Teacher & Admin)
  {
    path: '/teacher',
    element: <ProtectedRoute allowedRoles={['teacher', 'admin']} />,
    children: [
      {
        element: <TeacherLayout />,
        children: [
          {
            path: '',
            element: <Navigate to="/teacher/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <TeacherDashboardPage />,
          },
          {
            path: 'courses',
            element: <TeacherCoursesPage />,
          },
          {
            path: 'classes',
            element: <TeacherClassesPage />,
          },
          {
            path: 'quizzes',
            element: <TeacherQuizzesPage />,
          },
          {
            path: 'ai-quiz',
            element: <TeacherAiQuizPage />,
          },
          {
            path: 'grading',
            element: <TeacherGradingPage />,
          },
          {
            path: 'analytics',
            element: <TeacherAnalyticsPage />,
          },
          {
            path: 'profile',
            element: <TeacherProfilePage />,
          },
        ],
      },
    ],
  },

  // Admin Routes (Protected - Admin Only)
  {
    path: '/admin',
    element: <ProtectedRoute allowedRoles={['admin']} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            path: '',
            element: <Navigate to="/admin/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <AdminDashboardPage />,
          },
          {
            path: 'users',
            element: <AdminUsersPage />,
          },
          {
            path: 'courses',
            element: <AdminCoursesPage />,
          },
          {
            path: 'quizzes',
            element: <AdminQuizzesPage />,
          },
          {
            path: 'reports',
            element: <AdminReportsPage />,
          },
          {
            path: 'notifications',
            element: <AdminNotificationsPage />,
          },
          {
            path: 'settings',
            element: <AdminSettingsPage />,
          },
        ],
      },
    ],
  },

  // 404 Catch All
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
