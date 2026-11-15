import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { StudentSidebar } from './components/StudentSidebar'
import { StudentHeader } from './components/StudentHeader'

export function StudentLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 flex font-sans">
      {/* Sidebar bên trái */}
      <StudentSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Khu vực nội dung chính */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Header phía trên cố định (Search Bar + Notification Bell + Profile) */}
        <StudentHeader
          isMobileMenuOpen={mobileMenuOpen}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        {/* Nội dung trang theo từng Route con */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default StudentLayout
