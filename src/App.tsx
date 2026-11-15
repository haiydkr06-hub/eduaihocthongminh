import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage'
import { UnauthorizedPage } from './pages/error/UnauthorizedPage'
import { NotFoundPage } from './pages/error/NotFoundPage'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { RootRedirect } from './components/auth/RootRedirect'
import { StudentLayout } from './components/layout/StudentLayout'
import { StudentDashboardPage } from './pages/student/StudentDashboardPage'
import { StudentCoursesPage } from './pages/student/StudentCoursesPage'
import { LearningPage } from './pages/student/LearningPage'
import { StudentQuizPage } from './pages/student/StudentQuizPage'
import { StudentSchedulePage } from './pages/student/StudentSchedulePage'
import { StudentAchievementsPage } from './pages/student/StudentAchievementsPage'
import { StudentProfilePage } from './pages/student/StudentProfilePage'
import { StudentAiAssistantPage } from './pages/student/StudentAiAssistantPage'
import { StudentNotificationsPage } from './pages/student/StudentNotificationsPage'
import { TeacherLayout } from './components/layout/TeacherLayout'
import { TeacherDashboardPage } from './pages/teacher/TeacherDashboardPage'
import { TeacherCoursesPage } from './pages/teacher/TeacherCoursesPage'
import { TeacherClassesPage } from './pages/teacher/TeacherClassesPage'
import { TeacherQuizzesPage } from './pages/teacher/TeacherQuizzesPage'
import { TeacherAiQuizPage } from './pages/teacher/TeacherAiQuizPage'
import { TeacherGradingPage } from './pages/teacher/TeacherGradingPage'
import { TeacherAnalyticsPage } from './pages/teacher/TeacherAnalyticsPage'
import { TeacherProfilePage } from './pages/teacher/TeacherProfilePage'
import { AdminLayout } from './components/layout/AdminLayout'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminUsersPage } from './pages/admin/AdminUsersPage'
import { AdminCoursesPage } from './pages/admin/AdminCoursesPage'
import { AdminQuizzesPage } from './pages/admin/AdminQuizzesPage'
import { AdminReportsPage } from './pages/admin/AdminReportsPage'
import { AdminNotificationsPage } from './pages/admin/AdminNotificationsPage'
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
              <Route path="analytics" element={<TeacherAnalyticsPage />} />
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
      </AuthProvider>
    </BrowserRouter>
  )
}
