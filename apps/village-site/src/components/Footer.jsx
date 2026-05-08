// apps/village-site/src/components/Footer.jsx
import { Link } from 'react-router-dom'

const pageLinks = [
  { to: '/',           label: 'Home' },
  { to: '/community',  label: 'Community Board' },
  { to: '/minutes',    label: 'Council Minutes' },
  { to: '/officials',  label: 'Officials' },
  { to: '/police',     label: 'Police Dept.' },
  { to: '/ordinances', label: 'Ordinances' },
  { to: '/history',    label: 'History' },
]

export default function Footer() {
  return (
    <footer className="bg-[#0f172a]">
      <div
        className="flex gap-16 py-16"
        style={{ paddingLeft: '4.5rem', paddingRight: '4.5rem' }}
      >
        {/* Column 1 — Brand + address */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-[#1e3a5f] flex items-center justify-center text-white text-sm font-black flex-shrink-0">
              SL
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-tight">Saint Louisville</div>
              <div className="text-[10px] font-semibold tracking-widest uppercase text-slate-400 leading-tight">
                Village of Ohio
              </div>
            </div>
          </div>
          <div className="text-sm leading-[1.85] text-slate-500">
            <p>Village Hall</p>
            <p>Saint Louisville, OH 43071</p>
            <p className="mt-2">
              <a href="tel:+17405687800" className="text-[#93c5fd] font-bold hover:text-blue-300 transition-colors">
                (740) 568-7800
              </a>
            </p>
          </div>
        </div>

        {/* Column 2 — Pages */}
        <div>
          <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-4">
            Pages
          </div>
          <ul className="space-y-2">
            {pageLinks.map(({ to, label }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="text-slate-500 text-sm hover:text-white transition-colors"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3 — Emergency */}
        <div>
          <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-4">
            Emergency
          </div>
          <div className="text-[2.25rem] font-black text-white tracking-tight leading-none">
            911
          </div>
          <div className="text-slate-500 text-[13px] mt-1">
            Non-emergency:{' '}
            <a href="tel:+17405687800" className="text-[#93c5fd] hover:text-blue-300 transition-colors">
              (740) 568-7800
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="border-t border-slate-800 mt-0 pt-6 pb-6 flex justify-between text-xs text-slate-600"
        style={{ paddingLeft: '4.5rem', paddingRight: '4.5rem' }}
      >
        <span>© 2026 Village of Saint Louisville, Ohio. All rights reserved.</span>
        <span>Built &amp; maintained by George Kerber, Tech Czar</span>
      </div>
    </footer>
  )
}
