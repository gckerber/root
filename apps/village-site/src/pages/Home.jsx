// apps/village-site/src/pages/Home.jsx
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FileText, Megaphone, BookOpen, Calendar, Camera, Droplets, Shield } from 'lucide-react'
import HeroSection from '../components/HeroSection'
import axios from 'axios'

const API = 'https://func-village-prod.azurewebsites.net'

const quickLinks = [
  { to: '/about', icon: FileText, label: 'Meet Our Officials', color: 'bg-blue-100 text-blue-700' },
  { to: '/bulletin', icon: Megaphone, label: 'Bulletin Board', color: 'bg-yellow-100 text-yellow-700' },
  { to: '/minutes', icon: FileText, label: 'Council Minutes', color: 'bg-green-100 text-green-700' },
  { to: '/ordinances', icon: BookOpen, label: 'Ordinances', color: 'bg-purple-100 text-purple-700' },
  { to: '/calendar', icon: Calendar, label: 'Events Calendar', color: 'bg-orange-100 text-orange-700' },
  { to: '/history', icon: Camera, label: 'Village History', color: 'bg-rose-100 text-rose-700' },
]

function useBulletins() {
  return useQuery({
    queryKey: ['bulletins', 'recent'],
    queryFn: () =>
      axios.get(`${API}/api/bulletin?limit=3`).then((r) => r.data),
  })
}

export default function Home() {
  const { data: bulletins, isLoading } = useBulletins()

  return (
    <div>
      <HeroSection />

      {/* Quick links grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Village Services
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickLinks.map(({ to, icon: Icon, label, color }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-3 p-5 bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 transition-all hover:-translate-y-0.5 text-center group"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
                <Icon size={22} />
              </div>
              <span className="text-sm font-medium text-gray-700 leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest bulletins preview */}
      <section className="bg-blue-50 border-y border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Latest Announcements</h2>
            <Link to="/bulletin" className="text-blue-700 font-semibold hover:underline text-sm">
              View all →
            </Link>
          </div>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              {(bulletins?.items || sampleBulletins).map((b) => (
                <div key={b.id} className="bg-white rounded-xl p-6 shadow-sm border border-blue-50 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      b.category === 'urgent'
                        ? 'bg-red-100 text-red-700'
                        : b.category === 'event'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {b.category}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(b.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">{b.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{b.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Online portals CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="bg-blue-900 rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-700 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Droplets size={28} className="text-blue-200" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Pay Your Water Bill</h3>
                <p className="text-blue-200 text-sm mt-0.5">Look up your balance and pay securely — available 24/7</p>
              </div>
            </div>
            <a
              href="https://water.saintlouisvilleohio.gov"
              className="flex-shrink-0 px-6 py-2.5 bg-yellow-400 text-blue-900 font-bold rounded-xl hover:bg-yellow-300 transition-colors shadow-lg text-sm whitespace-nowrap"
            >
              Water Portal
            </a>
          </div>
          <div className="bg-slate-800 rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-slate-700 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Shield size={28} className="text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Police Department</h3>
                <p className="text-slate-400 text-sm mt-0.5">Pay fines, view court dates, and contact the department</p>
              </div>
            </div>
            <Link
              to="/police"
              className="flex-shrink-0 px-6 py-2.5 bg-amber-500 text-slate-900 font-bold rounded-xl hover:bg-amber-400 transition-colors shadow-lg text-sm whitespace-nowrap"
            >
              Police Dept
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

// Placeholder data shown when API is loading or unavailable
const sampleBulletins = [
  {
    id: '1',
    category: 'notice',
    date: new Date().toISOString(),
    title: 'Welcome to the new Village website!',
    body: 'We have launched our new online portal. Find council minutes, ordinances, and more.',
  },
  {
    id: '2',
    category: 'event',
    date: new Date().toISOString(),
    title: 'Next Council Meeting',
    body: 'The next regular council meeting will be held at Village Hall. All residents are welcome.',
  },
  {
    id: '3',
    category: 'notice',
    date: new Date().toISOString(),
    title: 'Water System Maintenance',
    body: 'Routine maintenance on the water system is scheduled. Residents may experience brief interruptions.',
  },
]
