// apps/village-site/src/components/Navbar.jsx
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

const links = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'Get to Know Us' },
  { to: '/minutes', label: 'Council Minutes' },
  { to: '/bulletin', label: 'Bulletin Board' },
  { to: '/ordinances', label: 'Ordinances' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/history', label: 'History' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="bg-blue-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Village name */}
          <Link to="/" className="flex items-center gap-3 flex-shrink-0">
            <span
              style={{ fontFamily: "'Great Vibes', cursive" }}
              className="text-5xl text-yellow-400 leading-none select-none"
            >
              SL
            </span>
            <div className="hidden sm:block border-l border-blue-700 pl-3">
              <div className="text-xs font-medium text-blue-300 tracking-widest uppercase leading-tight">Village of</div>
              <div className="text-base font-bold leading-tight tracking-wide">
                Saint Louisville
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            {links.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? 'bg-blue-700 text-yellow-300'
                      : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
            <a
              href="https://water.saintlouisvilleohio.gov"
              className="ml-3 px-4 py-2 bg-yellow-400 text-blue-900 rounded-md text-sm font-bold hover:bg-yellow-300 transition-colors"
            >
              Pay Water Bill
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden p-2 rounded-md text-blue-200 hover:bg-blue-800 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="lg:hidden bg-blue-900 border-t border-blue-800 px-4 py-3 space-y-1">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-sm font-medium ${
                  isActive
                    ? 'bg-blue-700 text-yellow-300'
                    : 'text-blue-100 hover:bg-blue-800'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
          <a
            href="https://water.saintlouisvilleohio.gov"
            className="block px-3 py-2 bg-yellow-400 text-blue-900 rounded-md text-sm font-bold text-center mt-2"
          >
            Pay Water Bill
          </a>
        </div>
      )}
    </nav>
  )
}
