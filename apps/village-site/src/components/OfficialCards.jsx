// apps/village-site/src/components/OfficialCards.jsx
// Shared official/officer card layouts used on PoliceDept and AboutUs pages.
import { useState, useEffect, useRef } from 'react'
import { Phone, Mail, ChevronLeft, ChevronRight } from 'lucide-react'

export const LAYOUT_MODES = [
  { id: 'grid',      label: 'Grid',       desc: '3 columns · round photo' },
  { id: 'wide',      label: '2-Column',   desc: '2 columns · photo on left' },
  { id: 'full',      label: 'Full Width', desc: '1 column · large photo' },
  { id: 'spotlight', label: 'Spotlight',  desc: 'One at a time · auto-cycles' },
]

function getInitials(name = '') {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

// ── Grid card: 3-col, circular photo ─────────────────────────────────────────
export function OfficialCardGrid({ official }) {
  const initials = getInitials(official.name)
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        {official.photoUrl ? (
          <img src={official.photoUrl} alt={official.name}
            className="w-16 h-16 rounded-full object-cover flex-shrink-0 border-2 border-gray-100" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-xl font-bold text-blue-800 flex-shrink-0">
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="font-bold text-gray-900 leading-tight">{official.name}</h3>
          <p className="text-sm font-medium text-blue-700">{official.title}</p>
          {(official.phoneWork || official.phone) && (
            <a href={`tel:${(official.phoneWork || official.phone).replace(/\D/g, '')}`}
              className="text-xs text-gray-400 hover:text-blue-600 transition-colors block">
              {official.phoneWork || official.phone}
            </a>
          )}
          {official.phoneCell && (
            <span className="block text-xs text-gray-400">Cell: {official.phoneCell}</span>
          )}
        </div>
      </div>
      {official.bio && (
        <p className="text-sm text-gray-600 leading-relaxed flex-grow">{official.bio}</p>
      )}
      {official.email && (
        <a href={`mailto:${official.email}`}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium mt-auto">
          <Mail size={15} />{official.email}
        </a>
      )}
    </div>
  )
}

// ── Wide card: 2-col, horizontal, square photo on left ───────────────────────
export function OfficialCardWide({ official }) {
  const initials = getInitials(official.name)
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex overflow-hidden hover:shadow-md transition-shadow">
      <div className="w-32 flex-shrink-0 bg-blue-50 relative min-h-[8rem]">
        {official.photoUrl ? (
          <img src={official.photoUrl} alt={official.name}
            className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-blue-300">
            {initials}
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-grow min-w-0">
        <h3 className="font-bold text-gray-900 leading-tight">{official.name}</h3>
        <p className="text-sm font-medium text-blue-700 mb-2">{official.title}</p>
        <div className="space-y-1">
          {(official.phoneWork || official.phone) && (
            <a href={`tel:${(official.phoneWork || official.phone).replace(/\D/g, '')}`}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 transition-colors">
              <Phone size={11} className="flex-shrink-0" />{official.phoneWork || official.phone}
            </a>
          )}
          {official.phoneCell && (
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <Phone size={11} className="flex-shrink-0" />Cell: {official.phoneCell}
            </span>
          )}
          {official.phoneHome && (
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <Phone size={11} className="flex-shrink-0" />Home: {official.phoneHome}
            </span>
          )}
        </div>
        {official.bio && (
          <p className="text-xs text-gray-500 leading-relaxed mt-2 flex-grow line-clamp-3">{official.bio}</p>
        )}
        {official.email && (
          <a href={`mailto:${official.email}`}
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium mt-2">
            <Mail size={11} />{official.email}
          </a>
        )}
      </div>
    </div>
  )
}

// ── Full-width card: 1-col, large photo on left ───────────────────────────────
export function OfficialCardFull({ official }) {
  const initials = getInitials(official.name)
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex overflow-hidden hover:shadow-md transition-shadow">
      <div className="w-44 sm:w-56 flex-shrink-0 bg-blue-50 relative min-h-[10rem]">
        {official.photoUrl ? (
          <img src={official.photoUrl} alt={official.name}
            className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-6xl font-bold text-blue-300">
            {initials}
          </div>
        )}
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-extrabold text-gray-900 text-xl leading-tight">{official.name}</h3>
            <p className="text-base font-semibold text-blue-700 mt-0.5">{official.title}</p>
          </div>
          {official.email && (
            <a href={`mailto:${official.email}`}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium">
              <Mail size={15} />{official.email}
            </a>
          )}
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 mb-3">
          {(official.phoneWork || official.phone) && (
            <a href={`tel:${(official.phoneWork || official.phone).replace(/\D/g, '')}`}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors">
              <Phone size={13} className="text-blue-500 flex-shrink-0" />
              Work: {official.phoneWork || official.phone}
            </a>
          )}
          {official.phoneCell && (
            <span className="flex items-center gap-1.5 text-sm text-gray-600">
              <Phone size={13} className="text-blue-500 flex-shrink-0" />Cell: {official.phoneCell}
            </span>
          )}
          {official.phoneHome && (
            <span className="flex items-center gap-1.5 text-sm text-gray-600">
              <Phone size={13} className="text-blue-500 flex-shrink-0" />Home: {official.phoneHome}
            </span>
          )}
        </div>
        {official.bio && (
          <p className="text-sm text-gray-600 leading-relaxed flex-grow">{official.bio}</p>
        )}
      </div>
    </div>
  )
}

// ── Spotlight: single official, full-width, auto-cycling ──────────────────────
export function OfficialSpotlight({ officials }) {
  const [idx, setIdx]       = useState(0)
  const [paused, setPaused] = useState(false)
  const intervalRef         = useRef(null)

  useEffect(() => {
    clearInterval(intervalRef.current)
    if (officials.length <= 1 || paused) return
    intervalRef.current = setInterval(() => {
      setIdx((i) => (i + 1) % officials.length)
    }, 5000)
    return () => clearInterval(intervalRef.current)
  }, [paused, officials.length])

  if (officials.length === 0) return null

  const goTo = (i) => { clearInterval(intervalRef.current); setIdx(i) }
  const prev = () => goTo((idx - 1 + officials.length) % officials.length)
  const next = () => goTo((idx + 1) % officials.length)

  const official  = officials[idx]
  const initials  = getInitials(official.name)

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="flex flex-col sm:flex-row min-h-[22rem]">
          {/* Photo */}
          <div className="sm:w-80 flex-shrink-0 bg-gradient-to-br from-blue-900 to-blue-700 relative overflow-hidden">
            {official.photoUrl ? (
              <img src={official.photoUrl} alt={official.name}
                className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-9xl font-bold text-blue-400/40">{initials}</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-grow p-8 flex flex-col justify-center">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">{official.title}</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-5 leading-tight">{official.name}</h2>

            <div className="space-y-2 mb-5">
              {(official.phoneWork || official.phone) && (
                <a href={`tel:${(official.phoneWork || official.phone).replace(/\D/g, '')}`}
                  className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-blue-600 transition-colors">
                  <span className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Phone size={14} className="text-blue-600" />
                  </span>
                  <span><span className="text-gray-400 mr-1">Work</span>{official.phoneWork || official.phone}</span>
                </a>
              )}
              {official.phoneCell && (
                <span className="flex items-center gap-2.5 text-sm text-gray-700">
                  <span className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Phone size={14} className="text-blue-600" />
                  </span>
                  <span><span className="text-gray-400 mr-1">Cell</span>{official.phoneCell}</span>
                </span>
              )}
              {official.phoneHome && (
                <span className="flex items-center gap-2.5 text-sm text-gray-700">
                  <span className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Phone size={14} className="text-blue-600" />
                  </span>
                  <span><span className="text-gray-400 mr-1">Home</span>{official.phoneHome}</span>
                </span>
              )}
              {official.email && (
                <a href={`mailto:${official.email}`}
                  className="flex items-center gap-2.5 text-sm text-blue-600 hover:text-blue-800 transition-colors">
                  <span className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Mail size={14} className="text-blue-600" />
                  </span>
                  {official.email}
                </a>
              )}
            </div>

            {official.bio && (
              <p className="text-gray-600 leading-relaxed text-sm">{official.bio}</p>
            )}

            {officials.length > 1 && (
              <p className="text-xs text-gray-400 mt-6">
                {idx + 1} of {officials.length}
                {!paused && <span className="ml-1 opacity-60">· auto-advancing</span>}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Arrows */}
      {officials.length > 1 && (
        <>
          <button onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full shadow-md flex items-center justify-center text-gray-600 hover:text-blue-700 transition-all"
            aria-label="Previous">
            <ChevronLeft size={20} />
          </button>
          <button onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full shadow-md flex items-center justify-center text-gray-600 hover:text-blue-700 transition-all"
            aria-label="Next">
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Dots */}
      {officials.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {officials.map((_, i) => (
            <button key={i} onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-300 ${
                i === idx ? 'w-6 h-2.5 bg-blue-700' : 'w-2.5 h-2.5 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── OfficialGrid: render the right layout ─────────────────────────────────────
export function OfficialGrid({ officials, layout = 'grid' }) {
  if (!officials || officials.length === 0) return null
  switch (layout) {
    case 'spotlight':
      return <OfficialSpotlight officials={officials} />
    case 'full':
      return (
        <div className="space-y-4">
          {officials.map((o) => <OfficialCardFull key={o.id} official={o} />)}
        </div>
      )
    case 'wide':
      return (
        <div className="grid sm:grid-cols-2 gap-4">
          {officials.map((o) => <OfficialCardWide key={o.id} official={o} />)}
        </div>
      )
    default:
      return (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {officials.map((o) => <OfficialCardGrid key={o.id} official={o} />)}
        </div>
      )
  }
}
