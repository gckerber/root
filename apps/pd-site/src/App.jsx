// apps/pd-site/src/App.jsx
import { BrowserRouter, Routes, Route, NavLink, Link } from 'react-router-dom'
import { useState } from 'react'
import { Menu, X, Shield } from 'lucide-react'
import Home from './pages/Home'
import MayorsCourt from './pages/MayorsCourt'
import PayFine from './pages/PayFine'

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/mayors-court', label: "Mayor's Court" },
  { to: '/pay-fine', label: 'Pay a Fine' },
]

function Navbar() {
  const [open, setOpen] = useState(false)
  return (
    <nav className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Shield size={20} className="text-slate-900" />
            </div>
            <div className="hidden sm:block">
              <div className="text-xs text-slate-400 leading-none tracking-widest uppercase">Saint Louisville</div>
              <div className="text-sm font-bold leading-tight tracking-wide">Police Department</div>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {NAV.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive ? 'bg-slate-700 text-amber-400' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
            <Link
              to="/pay-fine"
              className="ml-3 px-4 py-2 bg-amber-500 text-slate-900 rounded-md text-sm font-bold hover:bg-amber-400 transition-colors"
            >
              Pay Fine Online
            </Link>
          </div>

          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-md text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-slate-900 border-t border-slate-800 px-4 py-3 space-y-1">
          {NAV.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-sm font-medium ${
                  isActive ? 'bg-slate-700 text-amber-400' : 'text-slate-300 hover:bg-slate-800'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
          <Link
            to="/pay-fine"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 bg-amber-500 text-slate-900 rounded-md text-sm font-bold text-center mt-2"
          >
            Pay Fine Online
          </Link>
        </div>
      )}
    </nav>
  )
}

function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid sm:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield size={16} className="text-amber-500" />
              <span className="text-white font-semibold text-sm">Saint Louisville PD</span>
            </div>
            <p className="text-xs leading-relaxed">
              Protecting and serving the Village of Saint Louisville, Ohio with integrity and dedication.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Emergency</h4>
            <p className="text-2xl font-extrabold text-red-400">911</p>
            <p className="text-xs mt-1">For all emergencies — police, fire, medical</p>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Contact</h4>
            <div className="space-y-1 text-xs">
              <p>Non-Emergency: (740) 568-7800</p>
              <p>Village Hall: 100 N. High St.</p>
              <p>Saint Louisville, OH 43071</p>
              <p className="mt-2">
                <a href="mailto:pd@saintlouisvilleohio.gov" className="text-amber-400 hover:text-amber-300">
                  pd@saintlouisvilleohio.gov
                </a>
              </p>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-6 flex flex-wrap items-center justify-between gap-3 text-xs">
          <p>© {new Date().getFullYear()} Village of Saint Louisville, Ohio — Police Department</p>
          <a href="https://saintlouisvilleohio.gov" className="text-slate-500 hover:text-white transition-colors">
            ← Village Website
          </a>
        </div>
      </div>
    </footer>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="bg-red-700 text-white text-xs text-center py-1.5 font-medium tracking-wide">
          EMERGENCY — Call 911 &nbsp;|&nbsp; Non-Emergency: (740) 568-7800
        </div>
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/mayors-court" element={<MayorsCourt />} />
            <Route path="/pay-fine" element={<PayFine />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
