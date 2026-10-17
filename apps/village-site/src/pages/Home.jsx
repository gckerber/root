// apps/village-site/src/pages/Home.jsx
// Home + Community Board in one page: hero, urgent notices, seasonal events, notice board, contact.
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Phone, Mail, ArrowRight, Clock, ChevronDown, ChevronUp, Pin } from 'lucide-react'
import { api } from '../api'
import HeroCarousel from '../components/HeroCarousel'
import { useSeason } from '../theme/ThemeProvider'
import { HeroScene } from '../theme/SeasonDecor'
import { seasonEndDate } from '../theme/seasons'

// ─── Design tokens (all driven by the active season, see src/theme/seasons.js) ──
const PRIMARY = 'var(--c-primary)'
const ACCENT  = 'var(--c-accent)'
const SURFACE = 'var(--c-surface)'
const SLATE   = '#64748b'
const MUTED   = '#94a3b8'
const DIV     = '#f1f5f9'

const LABEL_STYLE = {
  fontSize: '10px',
  fontWeight: 700,
  letterSpacing: '.12em',
  textTransform: 'uppercase',
  color: MUTED,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
// Event dates are stored as UTC timestamps for a calendar day, so always read them in UTC.
const dateOnly = (iso) => (iso ? String(iso).slice(0, 10) : '')

const localISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function fmt(iso, opts) {
  if (!iso) return ''
  const d = new Date(iso)
  return isNaN(d) ? '' : d.toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' })
}
const formatDay = (iso) => fmt(iso, { day: 'numeric' }) || '—'
const formatMonthShort = (iso) => fmt(iso, { month: 'short' }).toUpperCase()
const formatMonthYear = (iso) => fmt(iso, { month: 'long', year: 'numeric' })
const formatLong = (iso) => fmt(iso, { month: 'long', day: 'numeric', year: 'numeric' })
const formatWeekday = (iso) => fmt(iso, { weekday: 'long' })

function formatTime(t) {
  if (!t) return ''
  const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim())
  if (!m) return t
  const h = Number(m[1])
  return `${h % 12 || 12}:${m[2]} ${h >= 12 ? 'PM' : 'AM'}`
}

// ─── Small pieces ────────────────────────────────────────────────────────────
function Pulse({ style = {} }) {
  return <div className="animate-pulse bg-gray-200 rounded" style={style} />
}

function SectionHeader({ id, eyebrow, title, right }) {
  return (
    <div
      id={id}
      style={{
        padding: '2.75rem var(--px) 1.5rem',
        borderTop: `1px solid ${DIV}`,
        scrollMarginTop: 96,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap',
      }}
    >
      <div>
        <p style={{ ...LABEL_STYLE, color: 'var(--c-brand)' }}>{eyebrow}</p>
        <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.25rem)', fontWeight: 900, letterSpacing: '-.02em', color: '#0f172a', marginTop: '.375rem' }}>
          {title}
        </h2>
      </div>
      {right}
    </div>
  )
}

function UrgentBand({ items }) {
  if (!items.length) return null
  return (
    <div style={{ background: '#7f1d1d' }}>
      {items.map((item, i) => (
        <div
          key={item.id}
          className="flex flex-wrap items-center gap-x-4 gap-y-1"
          style={{ padding: '0.875rem var(--px)', borderTop: i ? '1px solid rgba(255,255,255,.12)' : 'none' }}
        >
          <span style={{ ...LABEL_STYLE, color: '#fca5a5', background: '#991b1b', padding: '2px 8px', borderRadius: 2, flexShrink: 0 }}>
            Urgent
          </span>
          <span style={{ fontWeight: 700, color: '#fff', fontSize: '.95rem' }}>{item.title}</span>
          {item.body && <span style={{ color: '#fecaca', fontSize: '.85rem' }}>{item.body}</span>}
          {item.link && (
            <a href={item.link} style={{ color: '#fff', fontWeight: 700, fontSize: '.8125rem', textDecoration: 'underline' }}>
              Details
            </a>
          )}
        </div>
      ))}
    </div>
  )
}

function EventMeta({ event }) {
  const time = formatTime(event.time)
  return (
    <>
      {event.location && (
        <div className="flex items-center gap-2 mb-1" style={{ color: SLATE }}>
          <MapPin size={14} />
          <span className="text-sm">{event.location}</span>
        </div>
      )}
      {time && (
        <div className="flex items-center gap-2 mb-1" style={{ color: SLATE }}>
          <Clock size={14} />
          <span className="text-sm">{time}</span>
        </div>
      )}
    </>
  )
}

/** Big featured event (photo on one side, details on the other) */
function EventStrip({ event, reversed = false, bgColor = '#fff', seasonName }) {
  const photo = event.photoUrl || event.photoUrls?.[0]

  const textBlock = (
    <div
      className="flex flex-col justify-center mob-full"
      style={{ padding: 'clamp(1.5rem, 4vw, 3rem) var(--px)', flex: '1 1 54%' }}
    >
      <span
        style={{
          ...LABEL_STYLE,
          alignSelf: 'flex-start',
          color: '#fff',
          background: 'var(--c-brand)',
          padding: '3px 10px',
          borderRadius: 999,
          marginBottom: '1rem',
        }}
      >
        {seasonName}
      </span>
      <div className="flex items-baseline gap-3 mb-3">
        <span className="font-black leading-none" style={{ fontSize: '4rem', color: PRIMARY, lineHeight: 1 }}>
          {formatDay(event.date)}
        </span>
        <span>
          <span className="block text-sm font-semibold" style={{ color: SLATE }}>{formatMonthYear(event.date)}</span>
          <span style={LABEL_STYLE}>{formatWeekday(event.date)}</span>
        </span>
      </div>
      <h3 className="font-black mb-3 leading-tight" style={{ fontSize: '1.75rem', color: '#0f172a', fontFamily: 'var(--font-display)' }}>
        {event.title}
      </h3>
      <EventMeta event={event} />
      {event.description && (
        <p style={{ color: SLATE, fontSize: '.95rem', lineHeight: 1.65, margin: '.75rem 0 0', whiteSpace: 'pre-line', maxWidth: 520 }}>
          {event.description}
        </p>
      )}
      {event.link && (
        <a href={event.link} className="inline-flex items-center gap-1.5 text-sm font-bold mt-4" style={{ color: PRIMARY }}>
          Learn more <ArrowRight size={14} />
        </a>
      )}
    </div>
  )

  const photoBlock = (
    <div className="relative overflow-hidden flex-shrink-0 mob-photo" style={{ flex: '1 1 46%', minHeight: '380px' }}>
      {photo ? (
        <img src={photo} alt={event.title} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, var(--c-primary) 0%, var(--c-brand) 140%)' }}>
          <HeroScene />
        </div>
      )}
    </div>
  )

  return (
    <div className="flex mob-stack" style={{ background: bgColor, minHeight: '380px' }}>
      {reversed ? (<>{textBlock}{photoBlock}</>) : (<>{photoBlock}{textBlock}</>)}
    </div>
  )
}

/** Compact one-line event row (later events and past events) */
function EventRow({ event, muted = false }) {
  const time = formatTime(event.time)
  return (
    <div
      className="flex items-center"
      style={{ gap: '1.5rem', padding: '1.1rem var(--px)', borderTop: `1px solid ${DIV}`, opacity: muted ? 0.65 : 1 }}
    >
      <div style={{ textAlign: 'center', flexShrink: 0, width: 56 }}>
        <div style={{ fontSize: '2.25rem', fontWeight: 900, color: muted ? MUTED : PRIMARY, lineHeight: 1 }}>{formatDay(event.date)}</div>
        <div style={{ ...LABEL_STYLE, letterSpacing: '.1em' }}>{formatMonthShort(event.date)}</div>
      </div>
      <div style={{ width: 1, alignSelf: 'stretch', background: '#e2e8f0', flexShrink: 0 }} />
      <div style={{ flexGrow: 1, minWidth: 0 }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>{event.title}</h3>
        {(event.location || time) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0 1.25rem', fontSize: '.85rem', color: SLATE, marginTop: 2 }}>
            {event.location && <span>{event.location}</span>}
            {time && <span>{time}</span>}
          </div>
        )}
      </div>
      {event.link && (
        <a href={event.link} style={{ fontSize: '.85rem', color: PRIMARY, fontWeight: 700, flexShrink: 0 }}>Details</a>
      )}
    </div>
  )
}

function NoticeRow({ item }) {
  const cat = (item.category || 'general').toLowerCase()
  const tag = cat === 'notice' ? { bg: '#eff6ff', text: '#1d4ed8' } : { bg: '#f1f5f9', text: '#475569' }
  return (
    <div className="flex flex-wrap items-start" style={{ borderTop: `1px solid ${DIV}`, padding: '1.25rem var(--px)', gap: '.75rem 1.5rem' }}>
      <span
        style={{
          fontSize: '10px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase',
          background: tag.bg, color: tag.text, padding: '3px 8px', borderRadius: 3, flexShrink: 0, marginTop: 3,
        }}
      >
        {cat}
      </span>
      <div style={{ flex: '1 1 320px', minWidth: 0 }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: '0 0 .25rem' }}>
          {item.pinned && <Pin size={13} style={{ display: 'inline', marginRight: 6, color: 'var(--c-brand)', verticalAlign: '-1px' }} />}
          {item.title}
        </h3>
        {item.body && <p style={{ fontSize: '.9rem', color: SLATE, margin: '0 0 .5rem', lineHeight: 1.6 }}>{item.body}</p>}
        {item.link && (
          <a href={item.link} style={{ fontSize: '.8125rem', color: PRIMARY, fontWeight: 700 }}>
            {item.link.startsWith('mailto:') ? 'Send an email' : 'Learn more'} →
          </a>
        )}
      </div>
      <span style={{ ...LABEL_STYLE, flexShrink: 0, marginTop: 4 }}>{formatLong(item.date)}</span>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function Home() {
  const season = useSeason()
  const { hash } = useLocation()
  const [showPast, setShowPast] = useState(false)

  const { data: imagesData } = useQuery({ queryKey: ['village-images'], queryFn: () => api.villageImages(), staleTime: 3 * 60 * 1000 })
  const { data: bulletinData, isLoading: bulletinLoading, isError: bulletinError } = useQuery({
    queryKey: ['bulletin', 'all'],
    queryFn: () => api.bulletin(),
    staleTime: 60 * 1000,
  })
  const { data: eventsData, isLoading: eventsLoading, isError: eventsError } = useQuery({
    queryKey: ['events', 'all'],
    queryFn: () => api.events(),
    staleTime: 3 * 60 * 1000,
  })

  const heroImages = useMemo(
    () => [...(imagesData?.items || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [imagesData]
  )

  const { urgent, notices } = useMemo(() => {
    const all = bulletinData?.items || []
    return {
      urgent: all.filter((i) => i.category === 'urgent'),
      notices: all.filter((i) => i.category !== 'urgent'),
    }
  }, [bulletinData])

  const { seasonEvents, laterEvents, pastEvents } = useMemo(() => {
    const today = localISO(new Date())
    const seasonEnd = localISO(seasonEndDate(season.id))
    const all = (eventsData?.items || []).filter((e) => e.date)
    const byDate = (a, b) => dateOnly(a.date).localeCompare(dateOnly(b.date))
    const upcoming = all.filter((e) => dateOnly(e.date) >= today).sort(byDate)
    return {
      seasonEvents: upcoming.filter((e) => dateOnly(e.date) <= seasonEnd),
      laterEvents: upcoming.filter((e) => dateOnly(e.date) > seasonEnd),
      pastEvents: all.filter((e) => dateOnly(e.date) < today).sort((a, b) => byDate(b, a)),
    }
  }, [eventsData, season.id])

  // Scroll to #happening / #notices when arriving via nav links
  useEffect(() => {
    if (!hash) return
    const el = document.getElementById(hash.slice(1))
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
  }, [hash, eventsLoading, bulletinLoading])

  const nothingUpcoming = !eventsLoading && !eventsError && seasonEvents.length === 0 && laterEvents.length === 0

  return (
    <div>
      {/* ── Hero ── */}
      <HeroCarousel
        images={heroImages}
        gradientStyle={season.hero}
        heightClass="min-h-[460px] h-[66vh] max-h-[720px]"
      >
        <HeroScene />
        <div
          className="flex items-center h-full"
          style={{ position: 'relative', zIndex: 1, padding: 'clamp(2rem, 5vw, 4rem) var(--px) clamp(4rem, 12vw, 9rem)', maxWidth: '700px' }}
        >
          <div>
            <p style={{ ...LABEL_STYLE, color: 'rgba(255,255,255,.7)', marginBottom: '1rem', letterSpacing: '.14em' }}>
              Village of Ohio · Licking County
            </p>
            <p
              style={{
                display: 'inline-block', fontSize: '.8125rem', fontWeight: 700, color: ACCENT,
                border: `1px solid ${ACCENT}`, borderRadius: 999, padding: '4px 14px', marginBottom: '1rem',
                background: 'rgba(0,0,0,.18)',
              }}
            >
              {season.greeting}
            </p>
            <h1 style={{ fontSize: 'clamp(2.25rem, 6.5vw, 4rem)', fontWeight: 900, color: '#fff', lineHeight: 1.05, letterSpacing: '-.025em', marginBottom: '.75rem' }}>
              Saint Louisville
            </h1>
            <p style={{ color: 'rgba(255,255,255,.85)', fontSize: '1.125rem', marginBottom: '1.75rem', fontStyle: 'italic' }}>
              {season.tagline}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.75rem' }}>
              <Link
                to="/#happening"
                style={{ background: 'var(--c-brand)', color: '#fff', fontWeight: 800, padding: '.8rem 1.875rem', fontSize: '.8125rem', letterSpacing: '.08em', textTransform: 'uppercase' }}
              >
                What's Happening
              </Link>
              <Link
                to="/officials"
                style={{ border: '2px solid rgba(255,255,255,.6)', color: '#fff', fontWeight: 700, padding: '.8rem 1.875rem', fontSize: '.8125rem', letterSpacing: '.08em', textTransform: 'uppercase' }}
              >
                Meet the Council
              </Link>
            </div>
          </div>
        </div>
      </HeroCarousel>

      <UrgentBand items={urgent} />

      {/* ── Events ── */}
      <SectionHeader
        id="happening"
        eyebrow={season.eventsEyebrow}
        title={season.eventsTitle}
        right={<span style={{ ...LABEL_STYLE }}>{seasonEvents.length + laterEvents.length} upcoming</span>}
      />

      {eventsLoading && (
        <div className="flex" style={{ minHeight: '380px' }}>
          <Pulse style={{ flex: '0 0 46%', borderRadius: 0 }} />
          <div style={{ flex: '0 0 54%', padding: 'clamp(1.5rem, 4vw, 3rem) var(--px)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Pulse style={{ height: 12, width: 80 }} /><Pulse style={{ height: 64, width: 60 }} />
            <Pulse style={{ height: 28, width: '70%' }} /><Pulse style={{ height: 16, width: '50%' }} />
          </div>
        </div>
      )}

      {eventsError && (
        <p style={{ padding: '1rem var(--px) 2.5rem', color: SLATE }}>
          Events are temporarily unavailable. Please check back soon.
        </p>
      )}

      {nothingUpcoming && (
        <p style={{ padding: '1rem var(--px) 2.5rem', color: SLATE }}>
          No upcoming events are scheduled right now. Check back soon!
        </p>
      )}

      {!eventsLoading && seasonEvents.map((event, i) => (
        <EventStrip
          key={event.id}
          event={event}
          reversed={i % 2 === 1}
          bgColor={i % 2 === 1 ? SURFACE : '#fff'}
          seasonName={season.name}
        />
      ))}

      {!eventsLoading && seasonEvents.length === 0 && laterEvents.length > 0 && (
        <p style={{ padding: '0 var(--px) 1.25rem', color: SLATE }}>
          Nothing on the calendar for {season.name} yet. Here is what is coming up next.
        </p>
      )}

      {laterEvents.length > 0 && (
        <div style={{ background: SURFACE }}>
          <p style={{ ...LABEL_STYLE, padding: '1.5rem var(--px) .75rem' }}>Later this year</p>
          {laterEvents.map((e) => <EventRow key={e.id} event={e} />)}
        </div>
      )}

      {pastEvents.length > 0 && (
        <div style={{ borderTop: `1px solid ${DIV}` }}>
          <button
            onClick={() => setShowPast((v) => !v)}
            className="flex items-center gap-2"
            style={{ ...LABEL_STYLE, padding: '1.1rem var(--px)', cursor: 'pointer', background: 'none', border: 'none', width: '100%' }}
          >
            {showPast ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {pastEvents.length} past event{pastEvents.length !== 1 ? 's' : ''}
          </button>
          {showPast && pastEvents.map((e) => <EventRow key={e.id} event={e} muted />)}
        </div>
      )}

      {/* ── Notices ── */}
      <SectionHeader id="notices" eyebrow="From the Village" title="Notice Board" />

      {bulletinLoading && (
        <div style={{ padding: '0 var(--px) 2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Pulse style={{ height: 18, width: '55%' }} /><Pulse style={{ height: 13, width: '80%' }} /><Pulse style={{ height: 18, width: '45%' }} />
        </div>
      )}
      {bulletinError && (
        <p style={{ padding: '0 var(--px) 2.5rem', color: SLATE }}>Notices are temporarily unavailable. Please check back soon.</p>
      )}
      {!bulletinLoading && !bulletinError && notices.length === 0 && (
        <p style={{ padding: '0 var(--px) 2.5rem', color: SLATE }}>No notices right now.</p>
      )}
      {notices.map((item) => <NoticeRow key={item.id} item={item} />)}

      {/* ── Quick links row ── */}
      <div className="flex flex-wrap" style={{ borderTop: `1px solid ${DIV}`, borderBottom: `1px solid ${DIV}`, marginTop: '2.5rem' }}>
        {[
          { to: '/minutes',    label: 'Records',       title: 'Council Minutes' },
          { to: '/police',     label: 'Public Safety', title: 'Police Dept' },
          { to: '/ordinances', label: 'Legal',         title: 'Ordinances' },
          { to: '/officials',  label: 'Government',    title: 'Village Officials' },
          { to: '/fun-stuff',  label: 'About',         title: 'Fun Stuff & History' },
        ].map((item, i, arr) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex-1 group"
            style={{
              padding: '1.25rem', minWidth: 160, borderRight: i < arr.length - 1 ? `1px solid ${DIV}` : 'none',
              display: 'flex', flexDirection: 'column', gap: '.375rem',
            }}
          >
            <span style={LABEL_STYLE}>{item.label}</span>
            <span className="font-bold group-hover:underline" style={{ color: PRIMARY, fontSize: '1rem' }}>{item.title}</span>
            <span style={{ color: 'var(--c-brand)', fontSize: '1.125rem', lineHeight: 1 }}>→</span>
          </Link>
        ))}
      </div>

      {/* ── Contact ── */}
      <section id="contact" style={{ background: PRIMARY, padding: 'clamp(3rem, 6vw, 5rem) var(--px)' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ ...LABEL_STYLE, color: ACCENT, marginBottom: '1rem' }}>Get In Touch</p>
          <h2 className="font-black mb-4" style={{ fontSize: '2rem', color: '#fff' }}>Village of Saint Louisville</h2>
          <p style={{ color: 'rgba(255,255,255,.7)', lineHeight: 1.7, marginBottom: '2.5rem', fontSize: '.975rem' }}>
            The Village of Saint Louisville is committed to serving our residents. Whether you have questions about
            local ordinances, council meetings, or village services, our team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-8">
            {[
              { Icon: MapPin, label: 'Address', node: <span style={{ color: '#fff', fontSize: '.9rem', fontWeight: 600, textAlign: 'center' }}>1 School St., P.O. Box 149<br />Saint Louisville, OH 43071</span> },
              { Icon: Phone, label: 'Phone', node: <a href="tel:+17407453401" style={{ color: '#fff', fontWeight: 600, fontSize: '.9rem' }}>(740) 745-3401</a> },
              { Icon: Mail, label: 'Email', node: <a href="mailto:info@saintlouisvilleohio.gov" style={{ color: '#fff', fontWeight: 600, fontSize: '.9rem' }}>info@saintlouisvilleohio.gov</a> },
            ].map(({ Icon, label, node }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div className="flex items-center justify-center rounded-full" style={{ width: 44, height: 44, background: 'rgba(255,255,255,.12)' }}>
                  <Icon size={18} color="#fff" />
                </div>
                <span style={{ ...LABEL_STYLE, color: 'rgba(255,255,255,.6)' }}>{label}</span>
                {node}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}