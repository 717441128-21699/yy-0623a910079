import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, BarChart3, ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '@/store/useStore'

const navItems = [
  { path: '/overview', label: '门店备包总览', icon: LayoutDashboard },
  { path: '/analysis', label: '包型利用率分析', icon: BarChart3 },
  { path: '/review', label: '复盘记录与周报', icon: ClipboardList },
]

export default function Sidebar() {
  const collapsed = useStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useStore((s) => s.toggleSidebar)
  const location = useLocation()

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-navy-900 border-r border-navy-700/50 flex flex-col transition-all duration-300 z-50 ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      <div className="flex items-center gap-3 px-4 h-16 border-b border-navy-700/50 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-mint-500 flex items-center justify-center shrink-0">
          <span className="text-navy-950 font-bold text-sm">D</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-semibold text-white whitespace-nowrap">备包管理看板</h1>
            <p className="text-[10px] text-navy-600 whitespace-nowrap">Dental Pack Dashboard</p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group ${
                isActive
                  ? 'bg-mint-500/15 text-mint-500'
                  : 'text-slate-400 hover:bg-navy-800 hover:text-slate-200'
              }`}
            >
              <item.icon size={18} className={`shrink-0 ${isActive ? 'text-mint-500' : 'text-slate-500 group-hover:text-slate-300'}`} />
              {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>

      <div className="px-2 pb-4">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center py-2 rounded-lg text-slate-500 hover:bg-navy-800 hover:text-slate-300 transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  )
}
