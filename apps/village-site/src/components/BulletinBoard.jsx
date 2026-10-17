// apps/village-site/src/components/BulletinBoard.jsx
// Old-timey cork bulletin board: paper notices pinned to cork inside a wooden frame.
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'
const INK = '#3a2a18'

const TILT = [-1.8, 1.3, -0.9]
const DROP = [0, 14, 5]

const STAMP = {
  notice: '#1e3a8a',
  event: '#166534',
  urgent: '#9b1c1c',
  general: '#6b4a2b',
}

function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(String(iso).slice(0, 10) + 'T12:00:00Z')
  return isNaN(d) ? '' : d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

function PushPin({ color }) {
  return (
    <svg width="30" height="36" viewBox="0 0 30 36" aria-hidden="true" style={{ position: 'absolute', top: -14, left: '50%', marginLeft: -15, zIndex: 3 }}>
      <ellipse cx="17" cy="30" rx="8" ry="3" fill="rgba(0,0,0,.28)" />
      <path d="M15 17 L15 31" stroke="#8b8b8b" strokeWidth="2" strokeLinecap="round" />
      <circle cx="15" cy="12" r="10" fill={color} />
      <circle cx="15" cy="12" r="10" fill="none" stroke="rgba(0,0,0,.35)" strokeWidth="1" />
      <ellipse cx="11.5" cy="8.5" rx="3.6" ry="2.6" fill="rgba(255,255,255,.55)" transform="rotate(-30 11.5 8.5)" />
    </svg>
  )
}

// Paper sheet with a folded bottom-right corner. The drop shadow sits on the wrapper so the clip does not cut it.
function Paper({ tilt = 0, drop = 0, pin = 'var(--c-brand)', children }) {
  return (
    <div style={{ position: 'relative', transform: `rotate(${tilt}deg)`, marginTop: drop, filter: 'drop-shadow(0 7px 6px rgba(40,20,0,.42))' }}>
      <PushPin color={pin} />
      <div
        style={{
          position: 'relative',
          padding: '2.1rem 1.4rem 1.6rem',
          color: INK,
          background: 'radial-gradient(ellipse at 50% 35%, #fcf6e0 0%, #f4e8c2 70%, #ead9a8 100%)',
          clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 28px), calc(100% - 28px) 100%, 0 100%)',
          minHeight: 170,
        }}
      >
        {children}
        <div
          aria-hidden="true"
          style={{ position: 'absolute', right: 0, bottom: 0, width: 28, height: 28, background: 'linear-gradient(135deg, #f7edcb 0%, #cdb67a 100%)', clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
        />
      </div>
    </div>
  )
}

function Note({ item, index }) {
  const cat = (item.category || 'notice').toLowerCase()
  const stamp = STAMP[cat] || STAMP.general
  const isUrgent = cat === 'urgent'
  const expires = fmtDate(item.expiresAt)
  return (
    <Paper tilt={TILT[index % 3]} drop={DROP[index % 3]} pin={isUrgent ? '#b91c1c' : 'var(--c-brand)'}>
      <div style={{ textAlign: 'center' }}>
        <span
          style={{
            display: 'inline-block', fontFamily: MONO, fontWeight: 700, fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase',
            color: stamp, border: `2px solid ${stamp}`, padding: '2px 8px', transform: 'rotate(-3deg)', opacity: 0.85, marginBottom: '.75rem',
          }}
        >
          {isUrgent ? 'Urgent' : cat}
        </span>
        <h3
          style={{
            fontFamily: SERIF, fontWeight: 800, fontSize: '1.05rem', lineHeight: 1.3, letterSpacing: '.05em', textTransform: 'uppercase',
            margin: 0, paddingBottom: '.6rem', borderBottom: '4px double #6b4a2b', color: INK,
          }}
        >
          {item.title}
        </h3>
      </div>
      {item.body && (
        <p style={{ fontFamily: SERIF, fontSize: '.95rem', lineHeight: 1.6, margin: '.8rem 0 0', color: '#4a3622', whiteSpace: 'pre-line' }}>
          {item.body}
        </p>
      )}
      {item.link && (
        <a href={item.link} style={{ display: 'inline-block', marginTop: '.75rem', fontFamily: SERIF, fontWeight: 700, fontSize: '.85rem', color: stamp, textDecoration: 'underline' }}>
          {item.link.startsWith('mailto:') ? 'Send an email' : 'Read more'} &rarr;
        </a>
      )}
      <div style={{ marginTop: '.9rem', fontFamily: SERIF, fontStyle: 'italic', fontSize: '.75rem', color: '#7a6240' }}>
        Posted {fmtDate(item.date)}
        {expires && <> &middot; Good through {expires}</>}
      </div>
    </Paper>
  )
}

export default function BulletinBoard({ items, loading, error }) {
  let content
  if (loading) {
    content = [0, 1].map((n) => (
      <Paper key={n} tilt={TILT[n]} drop={DROP[n]}>
        <div className="animate-pulse" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ height: 16, background: '#e4d5a8', borderRadius: 3, width: '70%' }} />
          <div style={{ height: 11, background: '#ead9a8', borderRadius: 3 }} />
          <div style={{ height: 11, background: '#ead9a8', borderRadius: 3, width: '85%' }} />
        </div>
      </Paper>
    ))
  } else if (error || items.length === 0) {
    content = (
      <Paper tilt={-1}>
        <p style={{ fontFamily: SERIF, fontStyle: 'italic', textAlign: 'center', margin: 0, color: '#6b5230' }}>
          {error ? 'The board is being repaired. Please check back soon.' : 'Nothing is posted just now. Check back soon!'}
        </p>
      </Paper>
    )
  } else {
    content = items.map((item, i) => <Note key={item.id} item={item} index={i} />)
  }

  return (
    <section id="notices" style={{ padding: '2.75rem var(--px) 3rem', scrollMarginTop: 96, background: 'var(--c-surface)' }}>
      {/* Hanging wooden sign */}
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 4, marginBottom: -24 }}>
        <div
          style={{
            display: 'inline-block', padding: '.65rem 2.25rem .75rem', color: '#f6e7c1', border: '2px solid #2f1b0a', borderRadius: 4,
            background: 'linear-gradient(#6f4726 0%, #4a2d14 100%)', boxShadow: '0 5px 9px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.22)',
          }}
        >
          <div style={{ fontFamily: SERIF, fontSize: 10, letterSpacing: '.32em', textTransform: 'uppercase', color: 'var(--c-accent)' }}>
            Hear ye, hear ye
          </div>
          <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(1.35rem, 3.5vw, 2rem)', fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', margin: 0, color: '#f6e7c1' }}>
            The Village Bulletin
          </h2>
        </div>
      </div>

      {/* Wooden frame around the cork */}
      <div
        style={{
          padding: 14, borderRadius: 8,
          background: 'linear-gradient(135deg, #7d5230 0%, #4e3019 55%, #6a4424 100%)',
          boxShadow: '0 10px 24px rgba(40,20,0,.35), inset 0 1px 0 rgba(255,255,255,.18)',
        }}
      >
        <div
          style={{
            borderRadius: 4, padding: '3.25rem clamp(1rem, 3vw, 2rem) 2.25rem',
            backgroundColor: '#c39a68',
            backgroundImage:
              'radial-gradient(rgba(96,58,22,.38) 1px, transparent 1.6px), radial-gradient(rgba(255,238,205,.28) 1px, transparent 1.6px), radial-gradient(rgba(120,75,35,.25) 2px, transparent 2.6px)',
            backgroundSize: '7px 7px, 11px 11px, 17px 17px',
            backgroundPosition: '0 0, 3px 4px, 6px 2px',
            boxShadow: 'inset 0 0 28px rgba(60,30,5,.55)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 320px))',
            justifyContent: 'center',
            gap: '1.9rem 1.6rem',
            alignItems: 'start',
          }}
        >
          {content}
        </div>
      </div>
    </section>
  )
}