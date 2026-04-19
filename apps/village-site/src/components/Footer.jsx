// apps/village-site/src/components/Footer.jsx
import { Link } from 'react-router-dom'
import { Phone, Mail, ExternalLink } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-blue-950 text-blue-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center font-bold text-blue-900 text-sm">SL</div>
              <div>
                <div className="font-extrabold text-white leading-tight">Village of</div>
                <div className="font-extrabold text-yellow-300 leading-tight">Saint Louisville</div>
              </div>
            </div>
            <p className="text-sm text-blue-300 leading-relaxed">
              Serving our community with transparency, integrity, and care since 1833.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-bold text-white mb-3 text-sm uppercase tracking-wide">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              {[
                { to: '/about', label: 'Meet Our Officials' },
                { to: '/minutes', label: 'Council Minutes' },
                { to: '/bulletin', label: 'Bulletin Board' },
                { to: '/ordinances', label: 'Ordinances' },
                { to: '/calendar', label: 'Events Calendar' },
                { to: '/history', label: 'Village History' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-white mb-3 text-sm uppercase tracking-wide">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Phone size={14} className="mt-0.5 flex-shrink-0 text-blue-400" />
                <a href="tel:+17405687800" className="hover:text-white">(740) 568-7800</a>
              </li>
              <li className="flex items-start gap-2">
                <Mail size={14} className="mt-0.5 flex-shrink-0 text-blue-400" />
                <a href="mailto:info@saintlouisvilleohio.gov" className="hover:text-white break-all">
                  info@saintlouisvilleohio.gov
                </a>
              </li>
            </ul>
          </div>

          {/* Water portal CTA */}
          <div>
            <h3 className="font-bold text-white mb-3 text-sm uppercase tracking-wide">Water Service</h3>
            <a
              href="https://water.saintlouisvilleohio.gov"
              className="flex items-center gap-2 px-4 py-3 bg-yellow-400 text-blue-900 rounded-lg font-bold text-sm hover:bg-yellow-300 transition-colors w-fit"
            >
              Pay Water Bill
              <ExternalLink size={14} />
            </a>
            <p className="text-xs text-blue-400 mt-2">Available 24/7 — secure online payment</p>
          </div>
        </div>

        <div className="border-t border-blue-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-blue-500">
          <p>© {new Date().getFullYear()} Village of Saint Louisville, Ohio. All rights reserved.</p>
          <p>Built &amp; maintained by George Kerber, Tech Czar</p>
        </div>
      </div>
    </footer>
  )
}
