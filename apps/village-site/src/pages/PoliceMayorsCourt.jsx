// apps/village-site/src/pages/PoliceMayorsCourt.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Gavel, Calendar, Clock, MapPin, ChevronLeft, AlertCircle } from 'lucide-react'
import axios from 'axios'

const API = 'https://func-village-prod.azurewebsites.net'

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function formatTime(timeStr) {
  if (!timeStr) return null
  try {
    const [h, m] = timeStr.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
  } catch {
    return timeStr
  }
}

export default function PoliceMayorsCourt() {
  const [dates, setDates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    axios
      .get(`${API}/api/pd-court-schedule?upcoming=true`)
      .then(r => { setDates(r.data.items || []); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  return (
    <div>
      {/* Page header */}
      <div className="bg-blue-900 text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/police"
            className="inline-flex items-center gap-1 text-blue-300 hover:text-white text-sm mb-4 transition-colors"
          >
            <ChevronLeft size={16} />
            Back to Police Department
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-700 rounded-xl flex items-center justify-center flex-shrink-0">
              <Gavel size={28} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-blue-300 text-sm font-medium uppercase tracking-widest">Saint Louisville Police Department</p>
              <h1 className="text-3xl font-bold">Mayor's Court</h1>
            </div>
          </div>
          <p className="mt-4 text-blue-200 max-w-2xl text-sm leading-relaxed">
            Upcoming Mayor's Court sessions for the Village of Saint Louisville.
            Court is presided over by Mayor Zack Allen.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Info banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8 flex gap-3">
          <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 leading-relaxed">
            <p className="font-semibold mb-1">Important Notice</p>
            <p>
              If you have received a citation and have questions about your court date,
              contact the Saint Louisville Police Department at <strong>(740) 568-7800</strong>.
              For fine payment options, visit the{' '}
              <Link to="/police/fines" className="underline font-semibold hover:text-amber-900">
                Pay a Fine
              </Link>{' '}
              page.
            </p>
          </div>
        </div>

        {/* Court dates */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(n => (
              <div key={n} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-xl p-8 text-center">
            <p className="text-red-700 font-semibold">Unable to load court schedule</p>
            <p className="text-red-500 text-sm mt-1">
              Please call <strong>(740) 568-7800</strong> for upcoming court dates.
            </p>
          </div>
        ) : dates.length === 0 ? (
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-12 text-center">
            <Gavel size={40} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-700 font-semibold text-lg">No Upcoming Court Dates</p>
            <p className="text-gray-400 text-sm mt-2">
              There are no Mayor's Court sessions currently scheduled.
              Check back later or call <strong>(740) 568-7800</strong>.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {dates.map(d => (
              <div
                key={d.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Calendar size={22} className="text-blue-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-lg">{formatDate(d.date)}</p>
                      <div className="flex flex-wrap gap-4 mt-1.5">
                        {d.time && (
                          <span className="flex items-center gap-1.5 text-sm text-gray-500">
                            <Clock size={14} className="text-gray-400" />
                            {formatTime(d.time)}
                          </span>
                        )}
                        {d.location && (
                          <span className="flex items-center gap-1.5 text-sm text-gray-500">
                            <MapPin size={14} className="text-gray-400" />
                            {d.location}
                          </span>
                        )}
                      </div>
                      {d.notes && (
                        <p className="text-sm text-gray-400 mt-2 italic">{d.notes}</p>
                      )}
                    </div>
                  </div>
                  {d.judge && (
                    <div className="sm:text-right flex-shrink-0">
                      <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Presiding</p>
                      <p className="text-sm font-medium text-gray-700 mt-0.5">{d.judge}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer note */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-400">
            Court dates are subject to change. Always confirm with the police department before appearing.
          </p>
        </div>
      </div>
    </div>
  )
}
