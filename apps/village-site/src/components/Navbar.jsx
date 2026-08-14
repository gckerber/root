// apps/village-site/src/components/Navbar.jsx
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

const links = [
  { to: '/',           label: 'Home',       end: true },
  { to: '/community',  label: 'Community' },
  { to: '/minutes',    label: 'Minutes' },
  { to: '/officials',  label: 'Officials' },
  { to: '/police',     label: 'Police' },
  { to: '/ordinances', label: 'Ordinances' },
  { to: '/fun-stuff',  label: 'Fun Stuff' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
      <div
        className="flex items-center justify-between h-[60px]"
        style={{ paddingLeft: 'var(--px)', paddingRight: 'var(--px)' }}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 bg-[#1e3a5f] flex items-center justify-center text-white text-sm font-black">
            SL
          </div>
          <div>
            <div className="text-sm font-bold text-[#0f172a] leading-tight">Saint Louisville</div>
            <div className="text-[10px] font-semibold tracking-widest uppercase text-slate-400 leading-tight">
              Village of Ohio
            </div>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center">
          {links.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `text-[13px] font-medium px-3 py-2 transition-colors ${
                  isActive
                    ? 'text-[#1e3a5f] font-bold border-b-2 border-[#1e3a5f]'
                    : 'text-slate-600 hover:text-[#1e3a5f]'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
          <a
            href="https://pay.bridgepayment.com/82ee67f6-5a8f-4f89-810d-8fd686a7c235/Independent.aspx"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-4 px-4 py-2 bg-blue-600 text-white text-[13px] font-bold hover:bg-blue-700 transition-colors"
          >
            Pay Water Bill
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden p-2 text-slate-600 hover:text-[#1e3a5f] transition-colors"
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="lg:hidden bg-white border-t border-slate-100 px-6 py-3 space-y-1">
          {links.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 text-[13px] font-medium transition-colors ${
                  isActive
                    ? 'text-[#1e3a5f] font-bold'
                    : 'text-slate-600 hover:text-[#1e3a5f]'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
          <a
            href="https://pay.bridgepayment.com/82ee67f6-5a8f-4f89-810d-8fd686a7c235/Independent.aspx"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 mt-2 bg-blue-600 text-white text-[13px] font-bold text-center hover:bg-blue-700 transition-colors"
          >
            Pay Water Bill
          </a>
        </div>
      )}
    </nav>
  )
}
