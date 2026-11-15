import { lazy, Suspense, type ComponentType } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { LoginPage } from './pages/auth/LoginPage'
import { UnauthorizedPage } from './pages/error/UnauthorizedPage'
import { NotFoundPage } from './pages/error/NotFoundPage'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { RootRedirect } from './components/auth/RootRedirect'
import './App.css'

/** Tải trang theo nhu cầu (code-splitting): mỗi vai trò chỉ tải mã của trang mình dùng. */
function lazyNamed<M extends Record<string, unknown>>(loader: () => Promise<M>, name: keyof M & string) {
  return lazy(async () => ({ default: (await loader())[name] as ComponentType }))
}

const RegisterPage = lazyNamed(() => import('./pages/auth/RegisterPage'), 'RegisterPage')
const ForgotPasswordPage = lazyNamed(() => import('./pages/auth/ForgotPasswordPage'), 'ForgotPasswordPage')
const ResetPasswordPage = lazyNamed(() => import('./pages/auth/ResetPasswordPage'), 'ResetPasswordPage')
const StudentLayout = lazyNamed(() => import('./components/layout/StudentLayout'), 'StudentLayout')
const StudentDashboardPage = lazyNamed(() => import('./pages/student/StudentDashboardPage'), 'StudentDashboardPage')
const StudentCoursesPage = lazyNamed(() => import('./pages/student/StudentCoursesPage'), 'StudentCoursesPage')
const LearningPage = lazyNamed(() => import('./pages/student/LearningPage'), 'LearningPage')
const StudentQuizPage = lazyNamed(() => import('./pages/student/StudentQuizPage'), 'StudentQuizPage')
const StudentSchedulePage = lazyNamed(() => import('./pages/student/StudentSchedulePage'), 'StudentSchedulePage')
const StudentAchievementsPage = lazyNamed(() => import('./pages/student/StudentAchievementsPage'), 'StudentAchievementsPage')
const StudentProfilePage = lazyNamed(() => import('./pages/student/StudentProfilePage'), 'StudentProfilePage')
const StudentAiAssistantPage = lazyNamed(() => import('./pages/student/StudentAiAssistantPage'), 'StudentAiAssistantPage')
const StudentNotificationsPage = lazyNamed(() => import('./pages/student/StudentNotificationsPage'), 'StudentNotificationsPage')
const TeacherLayout = lazyNamed(() => import('./components/layout/TeacherLayout'), 'TeacherLayout')
const TeacherDashboardPage = lazyNamed(() => import('./pages/teacher/TeacherDashboardPage'), 'TeacherDashboardPage')
const TeacherCoursesPage = lazyNamed(() => import('./pages/teacher/TeacherCoursesPage'), 'TeacherCoursesPage')
const TeacherClassesPage = lazyNamed(() => import('./pages/teacher/TeacherClassesPage'), 'TeacherClassesPage')
const TeacherQuizzesPage = lazyNamed(() => import('./pages/teacher/TeacherQuizzesPage'), 'TeacherQuizzesPage')
const TeacherAiQuizPage = lazyNamed(() => import('./pages/teacher/TeacherAiQuizPage'), 'TeacherAiQuizPage')
const TeacherGradingPage = lazyNamed(() => import('./pages/teacher/TeacherGradingPage'), 'TeacherGradingPage')
const TeacherAiInsightsPage = lazyNamed(() => import('./pages/teacher/TeacherAiInsightsPage'), 'TeacherAiInsightsPage')
const TeacherAnalyticsPage = lazyNamed(() => import('./pages/teacher/TeacherAnalyticsPage'), 'TeacherAnalyticsPage')
const TeacherProfilePage = lazyNamed(() => import('./pages/teacher/TeacherProfilePage'), 'TeacherProfilePage')
const TeacherNotificationsPage = lazyNamed(() => import('./pages/teacher/TeacherNotificationsPage'), 'TeacherNotificationsPage')
const AdminLayout = lazyNamed(() => import('./components/layout/AdminLayout'), 'AdminLayout')
const AdminDashboardPage = lazyNamed(() => import('./pages/admin/AdminDashboardPage'), 'AdminDashboardPage')
const AdminUsersPage = lazyNamed(() => import('./pages/admin/AdminUsersPage'), 'AdminUsersPage')
const AdminCoursesPage = lazyNamed(() => import('./pages/admin/AdminCoursesPage'), 'AdminCoursesPage')
const AdminQuizzesPage = lazyNamed(() => import('./pages/admin/AdminQuizzesPage'), 'AdminQuizzesPage')
const AdminReportsPage = lazyNamed(() => import('./pages/admin/AdminReportsPage'), 'AdminReportsPage')
const AdminNotificationsPage = lazyNamed(() => import('./pages/admin/AdminNotificationsPage'), 'AdminNotificationsPage')
const AdminSettingsPage = lazyNamed(() => import('./pages/admin/AdminSettingsPage'), 'AdminSettingsPage')

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center" role="status" aria-live="polite">
      <div className="w-10 h-10 border-4 border-[#6857DF]/20 border-t-[#6857DF] rounded-full animate-spin" />
      <span className="sr-only">Đang tải trang…</span>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Cấu hình route mặc định dựa theo vai trò tài khoản */}
          <Route path="/" element={<RootRedirect />} />

          {/* Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Student Routes (Protected - Student & Admin) */}
          <Route path="/student" element={<ProtectedRoute allowedRoles={['student', 'admin']} />}>
            {/* Full-screen Learning Workspace (Không dùng Sidebar/Header chung) */}
            <Route path="learning/:courseId/:lessonId" element={<LearningPage />} />
            <Route path="learning/:courseId" element={<LearningPage />} />
            <Route path="learn/:courseId" element={<LearningPage />} />

            {/* Standard Student Pages (có Sidebar & Header) */}
            <Route element={<StudentLayout />}>
              <Route index element={<Navigate to="/student/dashboard" replace />} />
              <Route path="dashboard" element={<StudentDashboardPage />} />
              <Route path="courses" element={<StudentCoursesPage />} />
              <Route path="quiz/:quizId" element={<StudentQuizPage />} />
              <Route path="schedule" element={<StudentSchedulePage />} />
              <Route path="achievements" element={<StudentAchievementsPage />} />
              <Route path="profile" element={<StudentProfilePage />} />
              <Route path="ai-assistant" element={<StudentAiAssistantPage />} />
              <Route path="notifications" element={<StudentNotificationsPage />} />
            </Route>
          </Route>

          {/* Teacher Routes (Protected - Teacher & Admin) */}
          <Route path="/teacher" element={<ProtectedRoute allowedRoles={['teacher', 'admin']} />}>
            <Route element={<TeacherLayout />}>
              <Route index element={<Navigate to="/teacher/dashboard" replace />} />
              <Route path="dashboard" element={<TeacherDashboardPage />} />
              <Route path="courses" element={<TeacherCoursesPage />} />
              <Route path="classes" element={<TeacherClassesPage />} />
              <Route path="quizzes" element={<TeacherQuizzesPage />} />
              <Route path="ai-quiz" element={<TeacherAiQuizPage />} />
              <Route path="grading" element={<TeacherGradingPage />} />
              <Route path="ai-insights" element={<TeacherAiInsightsPage />} />
              <Route path="analytics" element={<TeacherAnalyticsPage />} />
              <Route path="notifications" element={<TeacherNotificationsPage />} />
              <Route path="profile" element={<TeacherProfilePage />} />
            </Route>
          </Route>

          {/* Admin Routes (Protected - Admin only) */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="courses" element={<AdminCoursesPage />} />
              <Route path="quizzes" element={<AdminQuizzesPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="notifications" element={<AdminNotificationsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
