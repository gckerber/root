// apps/village-site/src/pages/OrdinancesPage.jsx
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

const API = 'https://func-village-prod.azurewebsites.net'

const TABS = [
  { id: 'all',       label: 'All' },
  { id: 'general',   label: 'General' },
  { id: 'zoning',    label: 'Zoning' },
  { id: 'traffic',   label: 'Traffic' },
  { id: 'police',    label: 'Police' },
  { id: 'health',    label: 'Health' },
  { id: 'utilities', label: 'Utilities' },
]

const BADGE = {
  zoning:    'bg-[#eff6ff] text-[#1d4ed8]',
  police:    'bg-[#fef2f2] text-[#991b1b]',
  health:    'bg-[#f0fdf4] text-[#166534]',
  utilities: 'bg-[#fefce8] text-[#854d0e]',
  traffic:   'bg-[#fff7ed] text-[#9a3412]',
  general:   'bg-[#f1f5f9] text-[#475569]',
}

const LABEL_STYLE = {
  fontSize: '10px',
  fontWeight: 700,
  letterSpacing: '.12em',
  textTransform: 'uppercase',
  color: '#94a3b8',
}

function fmtAdopted(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function PdfIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-5 py-5 border-t border-[#f1f5f9] animate-pulse"
          style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc', paddingLeft: 'var(--px)', paddingRight: 'var(--px)' }}
        >
          <div className="w-10 h-10 bg-[#e2e8f0] flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-[#e2e8f0] rounded w-24" />
            <div className="h-4 bg-[#e2e8f0] rounded w-2/3" />
            <div className="h-3 bg-[#e2e8f0] rounded w-40" />
          </div>
        </div>
      ))}
    </>
  )
}

function DocumentRow({ item, index }) {
  const badgeClass = BADGE[item.category?.toLowerCase()] || BADGE.general
  const bg = index % 2 === 0 ? '#fff' : '#f8fafc'

  return (
    <div
      className="flex items-center gap-5 py-5 border-t border-[#f1f5f9]"
      style={{ background: bg, paddingLeft: 'var(--px)', paddingRight: 'var(--px)' }}
    >
      {/* PDF icon */}
      <div className="w-10 h-10 bg-[#f1f5f9] flex items-center justify-center flex-shrink-0 text-[#94a3b8]">
        <PdfIcon />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Row 1: number + category badge */}
        <div className="flex items-center gap-2 flex-wrap mb-1">
          {item.number && (
            <span style={LABEL_STYLE}>{item.number}</span>
          )}
          {item.category && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide ${badgeClass}`}
            >
              {item.category}
            </span>
          )}
        </div>

        {/* Row 2: title */}
        <div className="font-bold text-[0.9375rem] text-[#1e3a5f] leading-snug">
          {item.title}
        </div>

        {/* Row 2b: summary/description */}
        {item.summary && (
          <div className="mt-0.5 text-[0.8125rem] text-[#64748b] leading-snug">
            {item.summary}
          </div>
        )}

        {/* Row 3: date + file size */}
        <div className="mt-1 text-[0.8125rem] text-[#94a3b8]">
          {item.createdAt ? `Adopted ${fmtAdopted(item.createdAt)}` : item.year || ''}
          {item.fileSize ? ` · ${item.fileSize}` : ''}
        </div>
      </div>

      {/* Download link */}
      {item.fileUrl && (
        <a
          href={item.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          download
          className="text-[#1e3a5f] text-sm font-bold hover:underline flex-shrink-0"
        >
          Download
        </a>
      )}
    </div>
  )
}

export default function OrdinancesPage() {
  const [cat, setCat] = useState('all')
  const [year, setYear] = useState('all')
  const [search, setSearch] = useState('')

  const { data: ordinances, isLoading } = useQuery({
    queryKey: ['ordinances'],
    queryFn: () =>
      axios.get(`${API}/api/ordinances`).then((r) => r.data),
    staleTime: 3 * 60 * 1000,
  })

  const availableYears = useMemo(() => {
    const years = new Set((ordinances?.items || []).map(i => i.year || new Date(i.createdAt).getFullYear()))
    return [...years].sort((a, b) => b - a)
  }, [ordinances])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let items = ordinances?.items || []
    if (cat !== 'all') items = items.filter(i => i.category?.toLowerCase() === cat)
    if (year !== 'all') items = items.filter(i => (i.year || new Date(i.createdAt).getFullYear()) === year)
    if (q)
      items = items.filter(
        i =>
          i.title?.toLowerCase().includes(q) ||
          i.number?.toLowerCase().includes(q) ||
          i.summary?.toLowerCase().includes(q)
      )
    return items.sort(
      (a, b) =>
        b.year - a.year ||
        (b.createdAt?.localeCompare(a.createdAt) ?? 0)
    )
  }, [ordinances, cat, year, search])

  const byYear = useMemo(() => {
    const map = new Map()
    filtered.forEach(item => {
      const y = item.year || new Date(item.createdAt).getFullYear()
      if (!map.has(y)) map.set(y, [])
      map.get(y).push(item)
    })
    return [...map.entries()].sort((a, b) => b[0] - a[0])
  }, [filtered])

  // running row index for alternating stripes across year groups
  let rowIndex = 0

  return (
    <div className="min-h-screen bg-white">
      {/* Section heading */}
      <div className="py-[2.5rem] border-b border-[#f1f5f9]" style={{ paddingLeft: 'var(--px)', paddingRight: 'var(--px)' }}>
        <p style={LABEL_STYLE} className="mb-3">Official Records</p>
        <h1
          className="font-black tracking-tight text-[#1e3a5f] leading-none mb-3"
          style={{ fontSize: 'clamp(1.75rem, 5vw, 3rem)' }}
        >
          Ordinances &amp; Documents
        </h1>
        <p className="text-[#64748b] text-base max-w-2xl">
          Village ordinances, police postings, meeting decisions, zoning forms, and all official filings.
        </p>
      </div>

      {/* Category tabs + search */}
      <div className="flex items-center gap-0 border-b border-[#f1f5f9] flex-wrap" style={{ paddingLeft: 'var(--px)', paddingRight: 'var(--px)' }}>
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setCat(id)}
            className={
              cat === id
                ? 'border-b-2 border-[#1e3a5f] text-[#1e3a5f] font-bold px-5 py-4 text-sm'
                : 'text-slate-500 px-5 py-4 text-sm hover:text-[#1e3a5f]'
            }
          >
            {label}
          </button>
        ))}

        <input
          type="search"
          placeholder="Search title, number, or summary…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-[#e2e8f0] px-4 py-2 text-sm ml-auto outline-none"
        />
      </div>

      {/* Year filter tabs */}
      <div className="flex items-center gap-0 border-b border-[#f1f5f9] bg-[#f8fafc] mob-scroll" style={{ paddingLeft: 'var(--px)' }}>
        <button
          onClick={() => setYear('all')}
          className={year === 'all' ? 'border-b-2 border-[#1e3a5f] text-[#1e3a5f] font-bold px-5 py-3 text-sm' : 'text-slate-500 px-5 py-3 text-sm hover:text-[#1e3a5f]'}
        >
          All Years
        </button>
        {availableYears.map(y => (
          <button
            key={y}
            onClick={() => setYear(y)}
            className={year === y ? 'border-b-2 border-[#1e3a5f] text-[#1e3a5f] font-bold px-5 py-3 text-sm' : 'text-slate-500 px-5 py-3 text-sm hover:text-[#1e3a5f]'}
          >
            {y}
          </button>
        ))}
      </div>

      {/* Document list */}
      {isLoading ? (
        <SkeletonRows />
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-[#94a3b8] text-sm">
          No documents match your search.
        </div>
      ) : (
        byYear.map(([year, items]) => (
          <div key={year}>
            {/* Year header */}
            <div className="py-3 bg-[#f8fafc] border-t border-[#f1f5f9]" style={{ paddingLeft: 'var(--px)', paddingRight: 'var(--px)' }}>
              <span
                className="text-xs font-bold tracking-wider uppercase"
                style={{ color: '#1e3a5f' }}
              >
                {year}
              </span>
            </div>

            {/* Rows */}
            {items.map(item => {
              const idx = rowIndex++
              return <DocumentRow key={item.id} item={item} index={idx} />
            })}
          </div>
        ))
      )}
    </div>
  )
}
