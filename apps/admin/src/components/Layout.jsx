// src/components/Layout.jsx
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../utils/context'
import {
  LayoutDashboard, Image, Users, FileText, Megaphone,
  BookOpen, Calendar, Camera, LogOut, Menu, X, ChevronRight,
  Shield, Gavel, HelpCircle, Phone
} from 'lucide-react'
import { useState } from 'react'

const NAV = [
  { to: '/',            icon: LayoutDashboard, label: 'Dashboard',       color: 'text-slate-400' },
  { to: '/hero',        icon: Image,           label: 'Hero Image',      color: 'text-purple-400',  desc: 'Single fallback photo' },
  { to: '/hero-images', icon: Image,           label: 'Hero Carousel',   color: 'text-purple-300',  desc: 'Homepage slideshow' },
  { to: '/officials',   icon: Users,           label: 'Officials',       color: 'text-blue-400',    desc: 'Mayor & Council' },
  { to: '/minutes',     icon: FileText,        label: 'Council Minutes', color: 'text-green-400',   desc: 'Meetings & files' },
  { to: '/bulletin',    icon: Megaphone,       label: 'Bulletin Board',  color: 'text-yellow-400',  desc: 'Announcements' },
  { to: '/ordinances',  icon: BookOpen,        label: 'Ordinances',      color: 'text-orange-400',  desc: 'Village laws & PDFs' },
  { to: '/calendar',    icon: Calendar,        label: 'Calendar',        color: 'text-pink-400',    desc: 'Events & meetings' },
  { to: '/history',     icon: Camera,          label: 'History & Photos',color: 'text-teal-400',    desc: 'Gallery & text' },
]

const PD_NAV = [
  { to: '/pd',         icon: Shield,      label: 'Citations',      color: 'text-amber-400', desc: 'Police citations' },
  { to: '/court',      icon: Gavel,       label: 'Court Schedule', color: 'text-amber-300', desc: "Mayor's Court dates" },
  { to: '/pd-hero',    icon: Image,       label: 'Hero Images',    color: 'text-amber-200', desc: 'Carousel photos' },
  { to: '/pd-faq',     icon: HelpCircle,  label: 'FAQ',            color: 'text-amber-200', desc: "Mayor's Court FAQ" },
  { to: '/pd-contact', icon: Phone,       label: 'Contact Info',   color: 'text-amber-200', desc: 'Address & hours' },
]

export default function Layout() {
  const { logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const currentPage = [...NAV, ...PD_NAV].find((n) => n.to === location.pathname)

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
            SL
          </div>
          <div>
            <div className="text-white font-semibold text-sm leading-tight">Saint Louisville</div>
            <div className="text-slate-500 text-xs leading-tight">Admin Panel</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-grow px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label, color, desc }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group ${
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={17} className={isActive ? color : 'text-slate-500 group-hover:text-slate-400'} />
                <div className="flex-grow min-w-0">
                  <div className="font-medium leading-tight truncate">{label}</div>
                  {desc && <div className="text-xs text-slate-600 leading-tight truncate">{desc}</div>}
                </div>
                {isActive && <ChevronRight size={14} className={color} />}
              </>
            )}
          </NavLink>
        ))}

        {/* Police Department section */}
        <div className="pt-3 pb-1 px-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 uppercase tracking-widest">
            <Shield size={11} /> Police Dept
          </div>
        </div>
        {PD_NAV.map(({ to, icon: Icon, label, color, desc }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group ${
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={17} className={isActive ? color : 'text-slate-500 group-hover:text-slate-400'} />
                <div className="flex-grow min-w-0">
                  <div className="font-medium leading-tight truncate">{label}</div>
                  {desc && <div className="text-xs text-slate-600 leading-tight truncate">{desc}</div>}
                </div>
                {isActive && <ChevronRight size={14} className={color} />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-slate-800">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all text-sm"
        >
          <LogOut size={17} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 fixed left-0 top-0 bottom-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-grow lg:ml-64 min-h-screen flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden text-slate-400 hover:text-white transition-colors"
          >
            <Menu size={22} />
          </button>
          <div>
            <h1 className="text-white font-semibold text-lg leading-tight">
              {currentPage?.label || 'Admin Panel'}
            </h1>
            {currentPage?.desc && (
              <p className="text-slate-500 text-xs leading-tight">{currentPage.desc}</p>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <a
              href={import.meta.env.VITE_VILLAGE_URL || 'https://saintlouisvilleohio.gov'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-500 hover:text-blue-400 transition-colors"
            >
              View live site ↗
            </a>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-grow p-6 fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
