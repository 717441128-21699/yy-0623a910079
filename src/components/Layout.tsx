import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useStore } from '@/store/useStore'

export default function Layout() {
  const sidebarCollapsed = useStore((s) => s.sidebarCollapsed)

  return (
    <div className="min-h-screen bg-navy-950">
      <Sidebar />
      <main
        className={`p-6 min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-56'
        }`}
      >
        <Outlet />
      </main>
    </div>
  )
}
