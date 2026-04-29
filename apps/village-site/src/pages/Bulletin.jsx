// apps/village-site/src/pages/Bulletin.jsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Megaphone, Calendar, AlertTriangle, Info, Search } from 'lucide-react'
import axios from 'axios'
import { formatDistanceToNow, parseISO } from 'date-fns'

const API = 'https://func-village-prod.azurewebsites.net'

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Megaphone },
  { id: 'notice', label: 'Notices', icon: Info },
  { id: 'event', label: 'Events', icon: Calendar },
  { id: 'urgent', label: 'Urgent', icon: AlertTriangle },
]

const CATEGORY_STYLES = {
  notice: 'bg-blue-100 text-blue-700 border-blue-200',
  event: 'bg-green-100 text-green-700 border-green-200',
  urgent: 'bg-red-100 text-red-700 border-red-200',
}

function useBulletins(category, search) {
  return useQuery({
    queryKey: ['bulletins', category, search],
    queryFn: () =>
      axios
        .get(`${API}/api/bulletin`, { params: { category: category === 'all' ? undefined : category, search } })
        .then((r) => r.data),
    placeholderData: { items: sampleBulletins },
  })
}

function BulletinCard({ item }) {
  return (
    <article className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-6">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${CATEGORY_STYLES[item.category] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
            {item.category}
          </span>
          {item.pinned && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200">
              📌 Pinned
            </span>
          )}
        </div>
        <time className="text-xs text-gray-400 flex-shrink-0 mt-1">
          {formatDistanceToNow(parseISO(item.date), { addSuffix: true })}
        </time>
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-2 leading-snug">{item.title}</h2>
      <p className="text-sm text-gray-600 leading-relaxed">{item.body}</p>
      {item.link && (
        <a
          href={item.link}
          className="inline-flex items-center gap-1 mt-4 text-sm text-blue-600 font-medium hover:underline"
          target="_blank" rel="noopener noreferrer"
        >
          Learn more →
        </a>
      )}
    </article>
  )
}

export default function Bulletin() {
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const { data, isLoading } = useBulletins(category, search)
  const items = data?.items || sampleBulletins

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Bulletin Board</h1>
        <p className="text-gray-500">Announcements, notices, and events from the Village of Saint Louisville</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
          {CATEGORIES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setCategory(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                category === id
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
        <div className="relative flex-grow max-w-xs ml-auto">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Search bulletins…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-full" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No bulletins match your search.</div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => <BulletinCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  )
}

const sampleBulletins = [
  { id: '1', category: 'urgent', pinned: true, date: new Date().toISOString(), title: 'Boil Water Advisory — South Main St', body: 'Due to a water main repair, residents on South Main Street between Oak Ave and Elm St should boil water before drinking or cooking until further notice. We expect to lift this advisory within 48 hours.' },
  { id: '2', category: 'event', pinned: false, date: new Date(Date.now() - 86400000).toISOString(), title: 'Community Clean-Up Day — Saturday, June 15', body: 'Join your neighbors for our annual village clean-up! Meet at Village Hall at 9 AM. Gloves and bags provided. Light refreshments served. All ages welcome.', link: '/calendar' },
  { id: '3', category: 'notice', pinned: false, date: new Date(Date.now() - 2 * 86400000).toISOString(), title: 'Zoning Variance Hearing — 122 Church St', body: 'A public hearing has been scheduled for a zoning variance request at 122 Church Street. The hearing will be held at the next council meeting. All affected residents are encouraged to attend.' },
  { id: '4', category: 'notice', pinned: false, date: new Date(Date.now() - 5 * 86400000).toISOString(), title: 'Village Office Holiday Hours', body: 'Village Hall will be closed on the upcoming holiday. Emergency services remain available. Non-emergency matters will be addressed the following business day.' },
]
