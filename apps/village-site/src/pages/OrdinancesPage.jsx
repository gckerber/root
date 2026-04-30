// apps/village-site/src/pages/OrdinancesPage.jsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, Download, Search, ChevronRight, Clock } from 'lucide-react'
import axios from 'axios'
import { format, parseISO } from 'date-fns'

const API = 'https://func-village-prod.azurewebsites.net'

const CATEGORIES = [
  { id: 'all', label: 'All Ordinances' },
  { id: 'zoning', label: 'Zoning' },
  { id: 'general', label: 'General' },
  { id: 'traffic', label: 'Traffic & Roads' },
  { id: 'health', label: 'Health & Safety' },
  { id: 'utilities', label: 'Utilities' },
]

function useOrdinances(category, search) {
  return useQuery({
    queryKey: ['ordinances', category, search],
    queryFn: () =>
      axios
        .get(`${API}/api/ordinances`, { params: { category: category === 'all' ? undefined : category, search } })
        .then((r) => r.data),
    placeholderData: { items: sampleOrdinances },
  })
}

function OrdinanceRow({ ord }) {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors rounded-lg">
      <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
        <BookOpen size={18} className="text-purple-600" />
      </div>
      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs text-gray-400">{ord.number}</span>
          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">{ord.category}</span>
          {ord.year && <span className="text-xs text-gray-400">{ord.year}</span>}
          {ord.lastUpdated && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock size={10} /> Updated {format(parseISO(ord.lastUpdated), 'MMM d, yyyy')}
            </span>
          )}
        </div>
        <h3 className="font-semibold text-gray-800 mt-0.5 truncate">{ord.title}</h3>
        {ord.summary && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{ord.summary}</p>}
      </div>
      {ord.fileUrl ? (
        <a
          href={ord.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          download
          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-700 text-white rounded-lg text-xs font-medium hover:bg-purple-800 transition-colors flex-shrink-0"
        >
          <Download size={13} />
          PDF
        </a>
      ) : (
        <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
      )}
    </div>
  )
}

export default function OrdinancesPage() {
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const { data, isLoading } = useOrdinances(category, search)
  const ordinances = data?.items || sampleOrdinances

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Village Ordinances</h1>
        <p className="text-gray-500">
          The official code of ordinances for the Village of Saint Louisville, Ohio. Browse by category or search below.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          placeholder="Search by title, number, or keyword…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
        />
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setCategory(id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              category === id
                ? 'bg-purple-700 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-300 hover:text-purple-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="flex gap-3 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-lg flex-shrink-0" />
                <div className="flex-grow space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : ordinances.length === 0 ? (
          <div className="py-16 text-center text-gray-400">No ordinances match your search.</div>
        ) : (
          <div className="divide-y divide-gray-50 p-2">
            {ordinances.map((ord) => <OrdinanceRow key={ord.id} ord={ord} />)}
          </div>
        )}
      </div>

      <p className="mt-6 text-xs text-gray-400 text-center">
        For the most current ordinances, contact Village Hall. This repository is updated following each council approval.
      </p>
    </div>
  )
}

const sampleOrdinances = [
  { id: '1', number: 'ORD-2024-001', category: 'zoning', year: 2024, title: 'Residential Setback Requirements — R-1 District', summary: 'Establishes minimum front, rear, and side setback requirements for residential structures.', fileUrl: '#' },
  { id: '2', number: 'ORD-2024-002', category: 'general', year: 2024, title: 'Nuisance Vegetation and Grass Height', summary: 'Defines maximum allowable grass and vegetation height and procedures for abatement.', fileUrl: '#' },
  { id: '3', number: 'ORD-2023-012', category: 'utilities', year: 2023, title: 'Water Service Connection Fees', summary: 'Establishes connection fees and deposit requirements for new water service accounts.', fileUrl: '#' },
  { id: '4', number: 'ORD-2023-008', category: 'traffic', year: 2023, title: 'Speed Limits on Village Roads', summary: 'Establishes and updates speed limits on designated village streets and roads.', fileUrl: '#' },
  { id: '5', number: 'ORD-2022-005', category: 'health', year: 2022, title: 'Solid Waste and Recycling Collection', summary: 'Regulates solid waste disposal, recycling requirements, and collection schedules.', fileUrl: '#' },
  { id: '6', number: 'ORD-2021-003', category: 'zoning', year: 2021, title: 'Home Occupation Permits', summary: 'Defines allowable home-based businesses and permitting requirements within village limits.', fileUrl: '#' },
]
