import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api'

const LABEL_STYLE = {
  fontSize: '10px',
  fontWeight: 700,
  letterSpacing: '.12em',
  textTransform: 'uppercase',
  color: '#94a3b8',
}

function useBulletins() {
  return useQuery({
    queryKey: ['bulletins'],
    queryFn: () => api.bulletin(),
  })
}

function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: () => api.events(),
  })
}

function formatDay(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return isNaN(d) ? '—' : d.getDate()
}

function formatMonthShort(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return isNaN(d)
    ? ''
    : d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
}

function formatDateMuted(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return isNaN(d)
    ? ''
    : d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

// ---------------------------------------------------------------------------
// Row renderers
// ---------------------------------------------------------------------------

function UrgentRow({ item }) {
  return (
    <div
      className="flex items-center gap-4"
      style={{
        background: '#7f1d1d',
        color: 'white',
        padding: '1.25rem 4.5rem',
      }}
    >
      <span
        style={{
          ...LABEL_STYLE,
          color: '#fca5a5',
          background: '#991b1b',
          padding: '2px 8px',
          borderRadius: 2,
          flexShrink: 0,
        }}
      >
        URGENT
      </span>
      <span style={{ fontWeight: 700, fontSize: '1rem', color: 'white', flexGrow: 1 }}>
        {item.title}
      </span>
      {item.body && (
        <span style={{ color: '#fecaca', fontSize: '0.875rem', maxWidth: '40%' }}>
          {item.body}
        </span>
      )}
    </div>
  )
}

function EventPhotoRow({ item, index }) {
  const photoUrl = item.photoUrl
  const day = formatDay(item.date)
  const month = formatMonthShort(item.date)
  const bg = index % 2 === 0 ? 'white' : '#f8fafc'

  return (
    <div
      className="flex items-stretch border-t"
      style={{ borderColor: '#f1f5f9', minHeight: 280, background: bg }}
    >
      {/* Photo */}
      <div style={{ width: '40%', flexShrink: 0, overflow: 'hidden' }}>
        <img
          src={photoUrl}
          alt={item.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>

      {/* Content */}
      <div style={{ padding: '2rem 3rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.5rem' }}>
        <span style={LABEL_STYLE}>EVENT</span>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
          <span style={{ fontSize: '3rem', fontWeight: 900, color: '#1e3a5f', lineHeight: 1 }}>
            {day}
          </span>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: '#64748b' }}>{month}</span>
        </div>

        <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
          {item.title}
        </h2>

        {(item.location || item.time) && (
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: '#64748b' }}>
            {item.location && <span>{item.location}</span>}
            {item.time && <span>{item.time}</span>}
          </div>
        )}

        {item.description && (
          <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0, lineHeight: 1.6, WebkitLineClamp: 3, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {item.description}
          </p>
        )}

        {item.link && (
          <a
            href={item.link}
            style={{ fontSize: '0.875rem', color: '#1e3a5f', fontWeight: 600, marginTop: '0.25rem', textDecoration: 'none' }}
          >
            Learn more →
          </a>
        )}
      </div>
    </div>
  )
}

function EventNoPhotoRow({ item, index }) {
  const day = formatDay(item.date)
  const month = formatMonthShort(item.date)
  const bg = index % 2 === 0 ? 'white' : '#f8fafc'

  return (
    <div
      className="flex items-center border-t"
      style={{ borderColor: '#f1f5f9', padding: '1.5rem 4.5rem', gap: '2rem', background: bg }}
    >
      {/* Big date */}
      <div style={{ textAlign: 'center', flexShrink: 0, width: 56 }}>
        <div style={{ fontSize: '3rem', fontWeight: 900, color: '#1e3a5f', lineHeight: 1 }}>
          {day}
        </div>
        <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#94a3b8' }}>
          {month}
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: 1, alignSelf: 'stretch', background: '#e2e8f0', flexShrink: 0 }} />

      {/* Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flexGrow: 1 }}>
        <span style={LABEL_STYLE}>EVENT</span>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
          {item.title}
        </h2>
        {(item.location || item.time) && (
          <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.875rem', color: '#64748b' }}>
            {item.location && <span>{item.location}</span>}
            {item.time && <span>{item.time}</span>}
          </div>
        )}
      </div>

      {item.link && (
        <a
          href={item.link}
          style={{ fontSize: '0.875rem', color: '#1e3a5f', fontWeight: 600, flexShrink: 0, textDecoration: 'none' }}
        >
          Details →
        </a>
      )}
    </div>
  )
}

function NoticeRow({ item }) {
  const catLabel = (item.category || 'general').toUpperCase()
  const catColor =
    item.category === 'notice'
      ? { bg: '#eff6ff', text: '#1d4ed8' }
      : item.category === 'urgent'
      ? { bg: '#fee2e2', text: '#991b1b' }
      : { bg: '#f1f5f9', text: '#475569' }

  return (
    <div
      className="flex items-start border-t"
      style={{ borderColor: '#f1f5f9', padding: '1.25rem 4.5rem', gap: '1.5rem' }}
    >
      {/* Category tag */}
      <span
        style={{
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '.1em',
          textTransform: 'uppercase',
          background: catColor.bg,
          color: catColor.text,
          padding: '3px 8px',
          borderRadius: 3,
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        {catLabel}
      </span>

      {/* Content */}
      <div style={{ flexGrow: 1 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
          {item.title}
        </h2>
        {item.body && (
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 0.5rem 0', lineHeight: 1.55 }}>
            {item.body}
          </p>
        )}
        {item.link && (
          <a
            href={item.link}
            style={{ fontSize: '0.8125rem', color: '#1e3a5f', fontWeight: 600, textDecoration: 'none' }}
          >
            Learn more →
          </a>
        )}
      </div>

      {/* Date */}
      <span style={{ ...LABEL_STYLE, flexShrink: 0, marginTop: 2 }}>
        {formatDateMuted(item.date)}
      </span>
    </div>
  )
}

function ItemRow({ item, index }) {
  if (item.category === 'urgent') {
    return <UrgentRow item={item} />
  }
  if (item._type === 'event' || item.category === 'event') {
    if (item.photoUrl) return <EventPhotoRow item={item} index={index} />
    return <EventNoPhotoRow item={item} index={index} />
  }
  return <NoticeRow item={item} />
}

function SkeletonRows() {
  return (
    <>
      {[1, 2, 3, 4, 5].map((n) => (
        <div
          key={n}
          className="flex items-center border-t animate-pulse"
          style={{ borderColor: '#f1f5f9', padding: '1.5rem 4.5rem', gap: '2rem' }}
        >
          <div style={{ width: 48, height: 56, background: '#e2e8f0', borderRadius: 4, flexShrink: 0 }} />
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ height: 10, background: '#e2e8f0', borderRadius: 3, width: '15%' }} />
            <div style={{ height: 18, background: '#e2e8f0', borderRadius: 3, width: '55%' }} />
            <div style={{ height: 13, background: '#f1f5f9', borderRadius: 3, width: '35%' }} />
          </div>
        </div>
      ))}
    </>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function CommunityBoard() {
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('newest')

  const { data: bulletins, isLoading: loadingBulletins } = useBulletins()
  const { data: events, isLoading: loadingEvents } = useEvents()

  const isLoading = loadingBulletins || loadingEvents

  const allItems = useMemo(() => {
    const bItems = (bulletins?.items || []).map((i) => ({ ...i, _type: i.category }))
    const eItems = (events?.items || []).map((i) => ({ ...i, _type: 'event' }))
    const merged = [...bItems, ...eItems]
    merged.sort((a, b) =>
      sort === 'newest'
        ? new Date(b.date) - new Date(a.date)
        : new Date(a.date) - new Date(b.date)
    )
    return merged
  }, [bulletins, events, sort])

  const visibleItems = useMemo(() => {
    if (filter === 'all') return allItems
    if (filter === 'events')
      return allItems.filter((i) => i._type === 'event' || i.category === 'event')
    if (filter === 'notices')
      return allItems.filter(
        (i) =>
          ['notice', 'urgent', 'general'].includes(i.category) ||
          (i._type !== 'event' && i.category !== 'event'),
      )
    return allItems
  }, [allItems, filter])

  const eventCount = useMemo(
    () => allItems.filter((i) => i._type === 'event' || i.category === 'event').length,
    [allItems],
  )
  const noticeCount = useMemo(
    () =>
      allItems.filter(
        (i) =>
          ['notice', 'urgent', 'general'].includes(i.category) ||
          (i._type !== 'event' && i.category !== 'event'),
      ).length,
    [allItems],
  )

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const btnActive = {
    background: '#1e3a5f',
    color: 'white',
    padding: '0.5rem 1.25rem',
    fontSize: '0.875rem',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    borderRadius: 4,
  }
  const btnInactive = {
    background: 'white',
    border: '1px solid #e2e8f0',
    color: '#475569',
    padding: '0.5rem 1.25rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
    borderRadius: 4,
  }

  return (
    <div>
      {/* Section heading */}
      <div style={{ padding: '2.5rem 4.5rem' }}>
        <p style={LABEL_STYLE}>COMMUNITY &middot; VILLAGE OF OHIO</p>
        <h1
          style={{
            fontSize: '3rem',
            fontWeight: 900,
            letterSpacing: '-0.02em',
            color: '#0f172a',
            margin: '0.5rem 0 0.25rem',
            lineHeight: 1.1,
          }}
        >
          Community Board
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9375rem', margin: 0 }}>{today}</p>
      </div>

      {/* Filter bar */}
      <div
        className="flex items-center gap-3 border-t border-b"
        style={{
          padding: '1rem 4.5rem',
          borderColor: '#f1f5f9',
          background: '#f8fafc',
        }}
      >
        <button
          style={filter === 'all' ? btnActive : btnInactive}
          onClick={() => setFilter('all')}
          onMouseEnter={(e) => {
            if (filter !== 'all') e.currentTarget.style.borderColor = '#1e3a5f'
          }}
          onMouseLeave={(e) => {
            if (filter !== 'all') e.currentTarget.style.borderColor = '#e2e8f0'
          }}
        >
          All ({allItems.length})
        </button>
        <button
          style={filter === 'events' ? btnActive : btnInactive}
          onClick={() => setFilter('events')}
          onMouseEnter={(e) => {
            if (filter !== 'events') e.currentTarget.style.borderColor = '#1e3a5f'
          }}
          onMouseLeave={(e) => {
            if (filter !== 'events') e.currentTarget.style.borderColor = '#e2e8f0'
          }}
        >
          Events ({eventCount})
        </button>
        <button
          style={filter === 'notices' ? btnActive : btnInactive}
          onClick={() => setFilter('notices')}
          onMouseEnter={(e) => {
            if (filter !== 'notices') e.currentTarget.style.borderColor = '#1e3a5f'
          }}
          onMouseLeave={(e) => {
            if (filter !== 'notices') e.currentTarget.style.borderColor = '#e2e8f0'
          }}
        >
          Notices ({noticeCount})
        </button>

        {/* Sort toggle — pushed to the right */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 0, border: '1px solid #e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
          <button
            onClick={() => setSort('newest')}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.8125rem',
              fontWeight: sort === 'newest' ? 700 : 500,
              color: sort === 'newest' ? '#fff' : '#475569',
              background: sort === 'newest' ? '#1e3a5f' : '#fff',
              border: 'none',
              cursor: 'pointer',
              borderRight: '1px solid #e2e8f0',
            }}
          >
            ↓ Newest
          </button>
          <button
            onClick={() => setSort('oldest')}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.8125rem',
              fontWeight: sort === 'oldest' ? 700 : 500,
              color: sort === 'oldest' ? '#fff' : '#475569',
              background: sort === 'oldest' ? '#1e3a5f' : '#fff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            ↑ Oldest
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <SkeletonRows />
      ) : visibleItems.length === 0 ? (
        <div
          style={{ textAlign: 'center', padding: '4rem 4.5rem', color: '#64748b', fontSize: '1rem' }}
        >
          No items to show.
        </div>
      ) : (
        <div>
          {visibleItems.map((item, index) => (
            <ItemRow key={`${item._type || item.category}-${item.id}`} item={item} index={index} />
          ))}
        </div>
      )}
    </div>
  )
}
