// apps/village-site/src/pages/Minutes.jsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api'

// ── helpers ──────────────────────────────────────────────────────────────────

function fmtSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function fmtDate(iso) {
  const d = new Date(iso)
  const tz = { timeZone: 'UTC' }
  return {
    day: d.toLocaleDateString('en-US', { day: 'numeric', ...tz }),
    month: d.toLocaleString('en-US', { month: 'short', ...tz }).toUpperCase(),
    year: d.toLocaleDateString('en-US', { year: 'numeric', ...tz }),
    weekday: d.toLocaleString('en-US', { weekday: 'long', ...tz }),
    full: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', ...tz }),
  }
}

const LABEL_STYLE = {
  fontSize: '10px',
  fontWeight: 700,
  letterSpacing: '.12em',
  textTransform: 'uppercase',
  color: '#94a3b8',
}

const currentYear = new Date().getFullYear()

// ── sub-components ────────────────────────────────────────────────────────────

function PdfIcon() {
  return (
    <svg
      width="32"
      height="40"
      viewBox="0 0 32 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      <rect width="32" height="40" rx="4" fill="#f1f5f9" />
      <path
        d="M8 10h11l5 5v15a2 2 0 01-2 2H8a2 2 0 01-2-2V12a2 2 0 012-2z"
        fill="#cbd5e1"
      />
      <path d="M19 10l5 5h-5V10z" fill="#94a3b8" />
      <rect x="6" y="22" width="20" height="10" rx="2" fill="#94a3b8" />
      <text x="16" y="30" textAnchor="middle" fill="white" fontSize="6" fontWeight="700">
        PDF
      </text>
    </svg>
  )
}

function MinuteRow({ doc, altBg }) {
  const d = fmtDate(doc.meetingDate)
  const size = fmtSize(doc.fileSize)

  return (
    <div
      className="flex items-start gap-4 border-t border-[#f1f5f9] flex-wrap"
      style={{
        padding: '1.5rem var(--px)',
        backgroundColor: altBg ? '#f8fafc' : '#ffffff',
      }}
    >
      {/* Date column */}
      <div className="flex-shrink-0 w-16 text-center">
        <div
          className="leading-none"
          style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e3a5f' }}
        >
          {d.day}
        </div>
        <div style={LABEL_STYLE}>
          {d.month} {d.year}
        </div>
      </div>

      {/* PDF icon */}
      <div className="flex-shrink-0 mt-1">
        <PdfIcon />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Row 1: title + badge */}
        <div className="flex items-center gap-3 flex-wrap">
          <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{doc.title}</span>
          {doc.approved ? (
            <span
              className="bg-[#f0fdf4] text-[#166534] px-2 py-0.5 uppercase tracking-wide"
              style={{ fontSize: '10px', fontWeight: 700 }}
            >
              Approved
            </span>
          ) : (
            <span
              className="bg-[#fef3c7] text-[#92400e] px-2 py-0.5 uppercase tracking-wide"
              style={{ fontSize: '10px', fontWeight: 700 }}
            >
              Pending Approval
            </span>
          )}
        </div>

        {/* Row 2: description */}
        {doc.description && (
          <p
            className="text-slate-500 leading-relaxed mt-1 max-w-xl"
            style={{ fontSize: '0.875rem' }}
          >
            {doc.description}
          </p>
        )}

        {/* Row 3: meta */}
        <div className="text-slate-400 mt-1" style={{ fontSize: '0.8125rem' }}>
          {doc.fileUrl ? (
            <>
              {doc.type || 'Regular Session'}
              {size ? ` · ${size}` : ''}
            </>
          ) : (
            'Draft · No file yet'
          )}
        </div>
      </div>

      {/* Download */}
      <div className="flex-shrink-0 self-center">
        {doc.fileUrl && (
          <a
            href={doc.fileUrl}
            download={doc.fileName || true}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-bold hover:underline"
            style={{ color: '#1e3a5f' }}
          >
            Download
          </a>
        )}
      </div>
    </div>
  )
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function Minutes() {
  const [year, setYear] = useState(currentYear)
  const [search, setSearch] = useState('')
  const [hideDraftPast, setHideDraftPast] = useState(true)

  const { data, isLoading } = useQuery({
    queryKey: ['minutes', year, search],
    queryFn: () => api.minutes(year !== 'all' ? `?year=${year}` : ''),
    placeholderData: { items: [] },
    staleTime: 3 * 60 * 1000,
  })

  const allItems = data?.items || []
  const now = new Date()

  // Upcoming: future meetings sorted ascending
  const upcoming = allItems
    .filter((m) => new Date(m.meetingDate) > now)
    .sort((a, b) => new Date(a.meetingDate) - new Date(b.meetingDate))
    .slice(0, 3)

  // Pad to 3 slots
  const upcomingSlots = [
    ...upcoming,
    ...Array(Math.max(0, 3 - upcoming.length)).fill(null),
  ]

  // All records filtered + sorted ascending (Jan → Dec)
  const filtered = allItems
    .filter((m) => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        (m.title || '').toLowerCase().includes(q) ||
        (m.description || '').toLowerCase().includes(q)
      )
    })
    .sort((a, b) => new Date(a.meetingDate) - new Date(b.meetingDate))

  const pastDocs   = filtered
    .filter((m) => new Date(m.meetingDate) <= now)
    .filter((m) => !hideDraftPast || m.approved)
  const futureDocs = filtered.filter((m) => new Date(m.meetingDate) > now)

  const yearTabs = [currentYear, currentYear - 1, currentYear - 2, 'all']

  return (
    <div className="min-h-screen bg-white">
      {/* 1. Section heading */}
      <div
        className="border-b border-[#f1f5f9]"
        style={{ padding: '2.5rem var(--px)' }}
      >
        <div style={LABEL_STYLE} className="mb-3">
          Village Government
        </div>
        <h1
          className="tracking-tight"
          style={{ fontSize: '3rem', fontWeight: 900, color: '#1e3a5f', lineHeight: 1.05 }}
        >
          Council Minutes &amp; Records
        </h1>
        <p className="text-slate-500 mt-3 max-w-2xl text-base leading-relaxed">
          Upcoming meetings you can attend, approved minutes, and all official documents from
          council sessions.
        </p>
      </div>

      {/* 2. Upcoming meetings band */}
      <div style={{ backgroundColor: '#1e3a5f', padding: '2rem var(--px)' }}>
        <div
          style={{
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '.12em',
            textTransform: 'uppercase',
            color: '#f59e0b',
          }}
          className="mb-1"
        >
          Scheduled &amp; Open to the Public
        </div>
        <h2 className="text-white" style={{ fontSize: '1.5rem', fontWeight: 900 }}>
          Upcoming Meetings
        </h2>

        <div
          className="flex gap-0 border-t border-white/10 mt-4 pt-6 mob-scroll"
          style={{ borderTopColor: 'rgba(255,255,255,0.1)' }}
        >
          {upcomingSlots.map((m, i) => {
            const isLast = i === upcomingSlots.length - 1
            return (
              <div
                key={i}
                className={[
                  'flex-1',
                  'border-r border-white/10',
                  isLast ? 'border-r-0' : '',
                  'px-8',
                  i === 0 ? 'pl-0' : '',
                ].join(' ')}
                style={{ borderRightColor: 'rgba(255,255,255,0.1)' }}
              >
                {m ? (
                  <>
                    {m.type && (
                      <div
                        className="inline-block mb-2 px-2 py-0.5 uppercase tracking-wide"
                        style={{ fontSize: '9px', fontWeight: 700, background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}
                      >
                        {m.type} Meeting
                      </div>
                    )}
                    <div
                      className="text-white font-black"
                      style={{ fontSize: '1.875rem', lineHeight: 1.1 }}
                    >
                      {fmtDate(m.meetingDate).full}
                    </div>
                    <div className="text-slate-400 text-sm mt-1">
                      {fmtDate(m.meetingDate).weekday} · 7:00 PM · Village Hall
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      className="text-white/40 font-black"
                      style={{ fontSize: '1.875rem', lineHeight: 1.1 }}
                    >
                      TBD
                    </div>
                    <div className="text-slate-500 text-sm mt-1">To be scheduled</div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 3. Filter bar */}
      <div
        className="flex items-center gap-0 border-b border-[#f1f5f9] mob-scroll"
        style={{ padding: '0 0', minWidth: 0 }}
      >
        {yearTabs.map((y) => {
          const active = year === y
          return (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={
                active
                  ? 'border-b-2 border-[#1e3a5f] text-[#1e3a5f] font-bold px-6 py-4 text-sm'
                  : 'text-slate-500 px-6 py-4 text-sm hover:text-[#1e3a5f]'
              }
              style={{ paddingLeft: y === yearTabs[0] ? 'var(--px)' : undefined }}
            >
              {y === 'all' ? 'All' : y}
            </button>
          )
        })}

        <label
          className="flex items-center gap-2 ml-auto cursor-pointer select-none text-sm text-slate-500 hover:text-slate-700"
          style={{ marginRight: '1rem' }}
        >
          <input
            type="checkbox"
            checked={hideDraftPast}
            onChange={(e) => setHideDraftPast(e.target.checked)}
            className="accent-[#1e3a5f]"
          />
          Hide unapproved past
        </label>

        <input
          type="search"
          placeholder="Search minutes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-[#e2e8f0] px-4 py-2 text-sm outline-none"
          style={{ marginRight: 'var(--px)' }}
        />
      </div>

      {/* 4. Document rows */}
      {isLoading ? (
        <div style={{ padding: '3rem var(--px)' }}>
          {[0, 1, 2].map((n) => (
            <div
              key={n}
              className="flex items-center gap-6 border-t border-[#f1f5f9] py-6 animate-pulse"
            >
              <div className="w-16 h-12 bg-slate-100 rounded" />
              <div className="w-8 h-10 bg-slate-100 rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-100 rounded w-1/3" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="text-center text-slate-400 py-20"
          style={{ fontSize: '0.9375rem' }}
        >
          No minutes found for this period.
        </div>
      ) : (
        <>
          {pastDocs.map((doc, i) => (
            <MinuteRow key={doc.id} doc={doc} altBg={i % 2 === 1} />
          ))}

          {futureDocs.length > 0 && (
            <>
              {/* Divider between past and upcoming */}
              <div
                className="flex items-center gap-4 border-t border-[#f1f5f9]"
                style={{ padding: '1rem var(--px)', backgroundColor: '#f8fafc' }}
              >
                <div className="flex-1 h-px bg-[#e2e8f0]" />
                <span style={{ ...LABEL_STYLE, color: '#f59e0b', fontSize: '10px' }}>
                  Upcoming — Not Yet Approved
                </span>
                <div className="flex-1 h-px bg-[#e2e8f0]" />
              </div>

              {futureDocs.map((doc, i) => (
                <MinuteRow key={doc.id} doc={doc} altBg={i % 2 === 1} />
              ))}
            </>
          )}
        </>
      )}
    </div>
  )
}
