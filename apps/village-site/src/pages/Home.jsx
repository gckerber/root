// apps/village-site/src/pages/Home.jsx
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Phone, Mail, ArrowRight } from 'lucide-react'
import { api } from '../api'

// ─── Design tokens ───────────────────────────────────────────────────────────
const NAVY  = '#1e3a5f'
const SLATE = '#64748b'
const MUTED = '#94a3b8'
const DIV   = '#f1f5f9'
const BGALT = '#f8fafc'
const GOLD  = '#fbbf24'

const LABEL_STYLE = {
  fontSize: '10px',
  fontWeight: 700,
  letterSpacing: '.12em',
  textTransform: 'uppercase',
  color: MUTED,
}

// ─── Placeholder event data shown when API returns nothing ────────────────────
const PLACEHOLDER_EVENTS = [
  {
    id: 'ph-1',
    title: 'Village Council Meeting',
    date: new Date(Date.now() + 7 * 86400000).toISOString(),
    location: 'Village Hall, 2 E. Main St.',
    time: '7:00 PM',
    imageUrl: null,
  },
  {
    id: 'ph-2',
    title: 'Community Clean-Up Day',
    date: new Date(Date.now() + 14 * 86400000).toISOString(),
    location: 'Central Park',
    time: '9:00 AM',
    imageUrl: null,
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDay(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric' })
}

function formatMonthYear(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Skeleton pulse block */
function Pulse({ className = '', style = {} }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      style={style}
    />
  )
}

/** Pinned notices band */
function PinnedBand({ items }) {
  if (!items || items.length === 0) return null
  return (
    <div style={{ background: NAVY }}>
      <div style={{ display: 'flex', alignItems: 'stretch', padding: '0 4.5rem' }}>
        {/* Left label */}
        <div style={{ flexShrink: 0, paddingRight: '2.5rem', paddingTop: '1.5rem', paddingBottom: '1.5rem', borderRight: '1px solid rgba(255,255,255,.15)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ ...LABEL_STYLE, color: GOLD, marginBottom: '.3rem' }}>Pinned</p>
          <p style={{ fontSize: '1.0625rem', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-.01em' }}>Notices</p>
        </div>

        {/* Items — each stacked, separated by vertical dividers */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'stretch', overflowX: 'auto' }}>
          {items.map((item, i) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '1.5rem 2.5rem',
                borderRight: '1px solid rgba(255,255,255,.1)',
                flexShrink: 0,
                gap: '.3rem',
              }}
            >
              <p style={{ ...LABEL_STYLE, color: GOLD, marginBottom: '.1rem' }}>
                {(item.category || 'notice').toUpperCase()}
              </p>
              <p style={{ color: '#fff', fontSize: '.9rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                {item.title}
              </p>
            </div>
          ))}
        </div>

        {/* All Notices link */}
        <Link
          to="/community"
          style={{
            flexShrink: 0,
            paddingLeft: '2.5rem',
            paddingRight: 0,
            display: 'flex',
            alignItems: 'center',
            borderLeft: '1px solid rgba(255,255,255,.15)',
            color: GOLD,
            fontSize: '.875rem',
            fontWeight: 700,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          All Notices →
        </Link>
      </div>
    </div>
  )
}

/** Event strip (photo left or right) */
function EventStrip({ event, reversed = false, bgColor = '#fff' }) {
  const hasPhoto = Boolean(event?.imageUrl)

  const dateBlock = (
    <div className="flex flex-col gap-1 mb-4">
      <span style={LABEL_STYLE}>Upcoming</span>
      <span
        className="font-black leading-none"
        style={{ fontSize: '4rem', color: NAVY, lineHeight: 1 }}
      >
        {formatDay(event?.date)}
      </span>
      <span className="text-sm font-semibold" style={{ color: SLATE }}>
        {formatMonthYear(event?.date)}
      </span>
    </div>
  )

  const textBlock = (
    <div
      className="flex flex-col justify-center h-full"
      style={{ padding: '3rem 4.5rem', flex: '0 0 54%' }}
    >
      {dateBlock}
      <h2
        className="font-black mb-3 leading-tight"
        style={{ fontSize: '1.75rem', color: NAVY }}
      >
        {event?.title || 'Village Event'}
      </h2>
      {event?.location && (
        <div className="flex items-center gap-2 mb-1" style={{ color: SLATE }}>
          <MapPin size={14} />
          <span className="text-sm">{event.location}</span>
        </div>
      )}
      {event?.time && (
        <div className="flex items-center gap-2 mb-4" style={{ color: SLATE }}>
          <span className="text-sm">{event.time}</span>
        </div>
      )}
      <Link
        to="/community"
        className="inline-flex items-center gap-1.5 text-sm font-bold"
        style={{ color: NAVY }}
      >
        See all events <ArrowRight size={14} />
      </Link>
    </div>
  )

  const photoBlock = (
    <div
      className="relative overflow-hidden flex-shrink-0"
      style={{ flex: '0 0 46%', minHeight: '380px' }}
    >
      {hasPhoto ? (
        <img
          src={event.imageUrl}
          alt={event.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${NAVY} 0%, #2d5a8e 100%)`,
          }}
        />
      )}
    </div>
  )

  return (
    <div
      className="flex"
      style={{ background: bgColor, minHeight: '380px' }}
    >
      {reversed ? (
        <>
          {textBlock}
          {photoBlock}
        </>
      ) : (
        <>
          {photoBlock}
          {textBlock}
        </>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Home() {
  // Data queries
  const { data: imagesData, isLoading: imagesLoading } = useQuery({
    queryKey: ['village-images'],
    queryFn: () => api.villageImages(),
    staleTime: 5 * 60 * 1000,
  })

  const { data: bulletinData, isLoading: bulletinLoading } = useQuery({
    queryKey: ['bulletin', 'pinned'],
    queryFn: () => api.bulletin('?pinned=true'),
    staleTime: 60 * 1000,
  })

  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => api.events(),
    staleTime: 5 * 60 * 1000,
  })

  // Resolve data
  const heroImage = imagesData?.items?.find((i) => i.type === 'image') || imagesData?.find?.((i) => i.type === 'image')
  const pinnedItems = bulletinData?.items || bulletinData || []
  const eventsRaw = eventsData?.items || eventsData || []
  const now = new Date()
  const upcomingEvents = eventsRaw.filter((e) => e.date && new Date(e.date) >= now)
  const events = upcomingEvents.length > 0 ? upcomingEvents : PLACEHOLDER_EVENTS
  const event1 = events[0] || null
  const event2 = events[1] || null

  return (
    <div>
      {/* ── Hero ── */}
      <section style={{ position: 'relative', minHeight: '540px', display: 'flex', alignItems: 'center', overflow: 'hidden', background: '#0f172a' }}>
        {/* Background image — full opacity, let the gradient do the darkening */}
        {!imagesLoading && heroImage?.url && (
          <img
            src={heroImage.url}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
          />
        )}
        {/* Light overlay — transparent enough to see the photo */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,.55) 0%, rgba(0,0,0,.35) 60%, rgba(0,0,0,.15) 100%)' }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, padding: '4rem 4.5rem', maxWidth: '640px' }}>
          <p style={{ ...LABEL_STYLE, color: 'rgba(255,255,255,.7)', marginBottom: '1rem', letterSpacing: '.14em' }}>
            Village of Ohio · Licking County
          </p>
          <h1
            style={{
              fontSize: '3.5rem',
              fontWeight: 900,
              color: '#fff',
              lineHeight: 1.05,
              letterSpacing: '-.025em',
              marginBottom: '0.75rem',
            }}
          >
            Saint Louisville
          </h1>
          <p style={{ color: 'rgba(255,255,255,.75)', fontSize: '1.125rem', marginBottom: '2rem', fontStyle: 'italic' }}>
            Serving our community since 1837
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            <Link
              to="/community"
              style={{
                background: '#1d4ed8',
                color: '#fff',
                fontWeight: 800,
                padding: '0.8rem 1.875rem',
                textDecoration: 'none',
                fontSize: '0.8125rem',
                letterSpacing: '.08em',
                textTransform: 'uppercase',
              }}
            >
              What's Happening
            </Link>
            <Link
              to="/officials"
              style={{
                border: '2px solid rgba(255,255,255,.6)',
                color: '#fff',
                fontWeight: 700,
                padding: '0.8rem 1.875rem',
                textDecoration: 'none',
                fontSize: '0.8125rem',
                letterSpacing: '.08em',
                textTransform: 'uppercase',
                background: 'transparent',
              }}
            >
              Meet the Council
            </Link>
          </div>
        </div>
      </section>

      {/* ── Pinned notices band ── */}
      {bulletinLoading ? (
        <div style={{ background: NAVY, padding: '1.25rem 4.5rem' }}>
          <div className="flex gap-8">
            <Pulse style={{ height: '20px', width: '180px' }} />
            <Pulse style={{ height: '20px', width: '240px' }} />
            <Pulse style={{ height: '20px', width: '200px' }} />
          </div>
        </div>
      ) : (
        <PinnedBand items={pinnedItems} />
      )}

      {/* ── Calendar heading ── */}
      <div style={{ padding: '2.5rem 4.5rem 1.5rem', borderTop: `1px solid ${DIV}` }}>
        <p style={LABEL_STYLE}>On the Calendar</p>
        <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-.03em', color: '#0f172a', marginTop: '.375rem' }}>Upcoming Events</h2>
      </div>

      {/* ── Event strip 1 (photo left) ── */}
      {eventsLoading ? (
        <div className="flex" style={{ minHeight: '380px' }}>
          <Pulse style={{ flex: '0 0 46%', borderRadius: 0 }} />
          <div style={{ flex: '0 0 54%', padding: '3rem 4.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Pulse style={{ height: '12px', width: '80px' }} />
            <Pulse style={{ height: '64px', width: '60px' }} />
            <Pulse style={{ height: '28px', width: '70%' }} />
            <Pulse style={{ height: '16px', width: '50%' }} />
            <Pulse style={{ height: '16px', width: '40%' }} />
          </div>
        </div>
      ) : (
        <EventStrip event={event1} reversed={false} bgColor="#fff" />
      )}

      {/* ── Event strip 2 (photo right, reversed) ── */}
      {eventsLoading ? (
        <div className="flex" style={{ minHeight: '380px', background: BGALT }}>
          <div style={{ flex: '0 0 54%', padding: '3rem 4.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Pulse style={{ height: '12px', width: '80px' }} />
            <Pulse style={{ height: '64px', width: '60px' }} />
            <Pulse style={{ height: '28px', width: '70%' }} />
            <Pulse style={{ height: '16px', width: '50%' }} />
          </div>
          <Pulse style={{ flex: '0 0 46%', borderRadius: 0 }} />
        </div>
      ) : event2 ? (
        <EventStrip event={event2} reversed={true} bgColor={BGALT} />
      ) : null}

      {/* ── Quick links row ── */}
      <div
        className="flex"
        style={{ borderTop: `1px solid ${DIV}`, borderBottom: `1px solid ${DIV}` }}
      >
        {[
          { to: '/community',  label: 'Community',     title: 'Community Board' },
          { to: '/minutes',    label: 'Records',       title: 'Council Minutes' },
          { to: '/police',     label: 'Public Safety', title: 'Police Dept' },
          { to: '/ordinances', label: 'Legal',         title: 'Ordinances' },
          { to: '/officials',  label: 'Government',    title: 'Village Officials' },
          { to: '/history',    label: 'About',         title: 'History' },
        ].map((item, i, arr) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex-1 group"
            style={{
              padding: '1.75rem 2rem',
              borderRight: i < arr.length - 1 ? `1px solid ${DIV}` : 'none',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.375rem',
            }}
          >
            <span style={LABEL_STYLE}>{item.label}</span>
            <span
              className="font-bold group-hover:underline"
              style={{ color: NAVY, fontSize: '1rem' }}
            >
              {item.title}
            </span>
            <span style={{ color: GOLD, fontSize: '1.125rem', lineHeight: 1 }}>→</span>
          </Link>
        ))}
      </div>

      {/* ── Contact section ── */}
      <section
        id="contact"
        style={{ background: NAVY, padding: '5rem 4.5rem' }}
      >
        <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ ...LABEL_STYLE, color: GOLD, marginBottom: '1rem' }}>Get In Touch</p>
          <h2
            className="font-black mb-4"
            style={{ fontSize: '2rem', color: '#fff' }}
          >
            Village of Saint Louisville
          </h2>
          <p style={{ color: 'rgba(255,255,255,.65)', lineHeight: 1.7, marginBottom: '2.5rem', fontSize: '0.975rem' }}>
            The Village of Saint Louisville is committed to serving our residents.
            Whether you have questions about local ordinances, council meetings,
            or village services, our team is here to help.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-8">
            <div className="flex flex-col items-center gap-2">
              <div
                className="flex items-center justify-center rounded-full"
                style={{ width: '44px', height: '44px', background: 'rgba(255,255,255,.1)' }}
              >
                <MapPin size={18} color={GOLD} />
              </div>
              <span style={{ color: 'rgba(255,255,255,.6)', fontSize: '0.8rem', ...LABEL_STYLE }}>Address</span>
              <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600, textAlign: 'center' }}>
                2 E. Main Street<br />Saint Louisville, OH 43071
              </span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div
                className="flex items-center justify-center rounded-full"
                style={{ width: '44px', height: '44px', background: 'rgba(255,255,255,.1)' }}
              >
                <Phone size={18} color={GOLD} />
              </div>
              <span style={{ ...LABEL_STYLE, color: 'rgba(255,255,255,.6)' }}>Phone</span>
              <a
                href="tel:7408675000"
                style={{ color: '#fff', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem' }}
              >
                (740) 867-5000
              </a>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div
                className="flex items-center justify-center rounded-full"
                style={{ width: '44px', height: '44px', background: 'rgba(255,255,255,.1)' }}
              >
                <Mail size={18} color={GOLD} />
              </div>
              <span style={{ ...LABEL_STYLE, color: 'rgba(255,255,255,.6)' }}>Email</span>
              <a
                href="mailto:info@saintlouisvilleohio.gov"
                style={{ color: '#fff', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem' }}
              >
                info@saintlouisvilleohio.gov
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
