// apps/village-site/src/pages/Minutes.jsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, Download, Search, Filter, ChevronDown } from 'lucide-react'
import axios from 'axios'
import { format, parseISO } from 'date-fns'

const API = import.meta.env.VITE_API_BASE_URL || ''

function useMinutes(year, search) {
  return useQuery({
    queryKey: ['minutes', year, search],
    queryFn: () =>
      axios
        .get(`${API}/api/minutes`, { params: { year, search } })
        .then((r) => r.data),
    placeholderData: { items: [] },
  })
}

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 10 }, (_, i) => currentYear - i)

function MinuteCard({ doc }) {
  const date = parseISO(doc.meetingDate)

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
          <FileText size={22} className="text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">
            {format(date, 'MMMM d, yyyy')} — Council Meeting
          </h3>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-gray-500">
              {doc.type || 'Regular Session'}
            </span>
            {doc.fileSize && (
              <span className="text-xs text-gray-400">
                {(doc.fileSize / 1024).toFixed(0)} KB
              </span>
            )}
            {doc.approved && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                Approved
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {doc.fileUrl && (
          <a
            href={doc.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
          >
            <Download size={15} />
            <span className="hidden sm:inline">Download</span>
          </a>
        )}
      </div>
    </div>
  )
}

export default function Minutes() {
  const [year, setYear] = useState(String(currentYear))
  const [search, setSearch] = useState('')

  const { data, isLoading, isError } = useMinutes(year, search)
  const minutes = data?.items || sampleMinutes

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Council Meeting Minutes</h1>
        <p className="text-gray-500">
          Official minutes from Village Council meetings. Browse, filter, and download below.
        </p>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6 flex flex-wrap gap-3">
        <div className="relative flex-grow max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Search minutes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="relative">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="pl-9 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="">All Years</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                <div className="space-y-2 flex-grow">
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-16 text-red-500">
          Unable to load minutes. Please try again or contact Village Hall.
        </div>
      ) : minutes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          No minutes found for the selected filters.
        </div>
      ) : (
        <div className="space-y-3">
          {minutes.map((doc) => (
            <MinuteCard key={doc.id} doc={doc} />
          ))}
        </div>
      )}

      {/* Admin upload note */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-5 text-sm text-gray-500">
        <strong className="text-gray-700">Admins:</strong> To add new meeting minutes, see the{' '}
        <a href="/docs/ADMIN_GUIDE.md" className="text-blue-600 hover:underline">
          Admin Upload Guide
        </a>{' '}
        or upload directly through the GitHub repository.
      </div>
    </div>
  )
}

const sampleMinutes = [
  {
    id: '1',
    meetingDate: new Date().toISOString(),
    type: 'Regular Session',
    approved: true,
    fileSize: 245000,
    fileUrl: '#',
  },
  {
    id: '2',
    meetingDate: new Date(Date.now() - 30 * 86400000).toISOString(),
    type: 'Regular Session',
    approved: true,
    fileSize: 198000,
    fileUrl: '#',
  },
  {
    id: '3',
    meetingDate: new Date(Date.now() - 60 * 86400000).toISOString(),
    type: 'Special Session',
    approved: false,
    fileSize: 134000,
    fileUrl: '#',
  },
]
