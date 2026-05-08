// apps/village-site/src/pages/AboutUs.jsx  (route: /officials)
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api'

const NAVY = '#1e3a5f'
const LABEL = { fontSize: '10px', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#94a3b8' }

function initials(name) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function Avatar({ official, size = 'full' }) {
  const s = size === 'full' ? { width: '100%', height: '100%' } : { width: size, height: size, flexShrink: 0 }
  if (official.photoUrl) {
    return <img src={official.photoUrl} alt={official.name} style={{ ...s, objectFit: 'cover' }} />
  }
  return (
    <div style={{ ...s, background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: size === 'full' ? '2rem' : '0.75rem' }}>
      {initials(official.name)}
    </div>
  )
}

function CommTag({ label }) {
  return (
    <span style={{ background: '#f1f5f9', color: NAVY, fontSize: '11px', fontWeight: 700, padding: '3px 10px', marginRight: 4, marginBottom: 4, display: 'inline-block' }}>
      {label}
    </span>
  )
}

function OfficialContact({ official }) {
  const phone = official.phoneWork || official.phone
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem', fontSize: '.875rem' }}>
      {phone && <div style={{ display: 'flex', gap: '1rem' }}><span style={LABEL}>Phone</span><span style={{ fontWeight: 600 }}>{phone}</span></div>}
      {official.email && <div style={{ display: 'flex', gap: '1rem' }}><span style={LABEL}>Email</span><a href={`mailto:${official.email}`} style={{ color: '#2563eb' }}>{official.email}</a></div>}
    </div>
  )
}

function MayorStrip({ official }) {
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', minHeight: 420, background: '#f8fafc', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
      <div style={{ width: 'min(40%, 100%)', overflow: 'hidden', flexShrink: 0 }}>
        <Avatar official={official} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '3.5rem var(--px)' }}>
        <span style={{ ...LABEL, color: NAVY, marginBottom: '1.125rem', display: 'block' }}>Mayor</span>
        <h2 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.75rem)', fontWeight: 900, letterSpacing: '-.03em', marginBottom: '.5rem', color: '#0f172a' }}>{official.name}</h2>
        {official.bio && <p style={{ color: '#64748b', fontSize: '.9375rem', lineHeight: 1.85, maxWidth: 450, marginBottom: '1.5rem' }}>{official.bio}</p>}
        {official.committees?.length > 0 && (
          <div style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap' }}>
            {official.committees.map(c => <CommTag key={c} label={c} />)}
          </div>
        )}
        <OfficialContact official={official} />
      </div>
    </div>
  )
}

function CouncilStrip({ official, index }) {
  const photoLeft = index % 2 === 0
  const bg = index % 2 === 1 ? '#f8fafc' : '#fff'
  const content = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '3rem var(--px)' }}>
      <span style={{ ...LABEL, marginBottom: '1rem', display: 'block' }}>Council Member</span>
      <h2 style={{ fontSize: 'clamp(1.75rem, 5vw, 2rem)', fontWeight: 900, letterSpacing: '-.03em', marginBottom: '.5rem', color: '#0f172a' }}>{official.name}</h2>
      {official.bio && <p style={{ color: '#64748b', fontSize: '.9375rem', lineHeight: 1.85, maxWidth: 400, marginBottom: '1.125rem' }}>{official.bio}</p>}
      {official.committees?.length > 0 && (
        <div style={{ marginBottom: '1.25rem', display: 'flex', flexWrap: 'wrap' }}>
          {official.committees.map(c => <CommTag key={c} label={c} />)}
        </div>
      )}
      <OfficialContact official={official} />
    </div>
  )
  const photo = (
    <div style={{ width: 'min(36%, 100%)', overflow: 'hidden', flexShrink: 0 }}>
      <Avatar official={official} />
    </div>
  )
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', minHeight: 320, background: bg, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
      {photoLeft ? <>{photo}{content}</> : <>{content}{photo}</>}
    </div>
  )
}

function StaffRow({ official, index }) {
  const phone = official.phoneWork || official.phone
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: index % 2 === 0 ? '#fff' : '#f8fafc', padding: '1.25rem 1.75rem', borderTop: '1px solid #f1f5f9' }}>
      <div style={{ width: 72, height: 72, overflow: 'hidden', flexShrink: 0 }}>
        <Avatar official={official} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '.875rem', fontWeight: 700, color: NAVY, marginBottom: '.125rem' }}>{official.name}</p>
        <p style={LABEL}>{official.title}</p>
        {official.bio && <p style={{ fontSize: '.8125rem', color: '#64748b', lineHeight: 1.6, marginTop: '.25rem' }}>{official.bio}</p>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.25rem', textAlign: 'right', fontSize: '.8125rem', flexShrink: 0 }}>
        {phone && <span style={{ fontWeight: 600, color: '#0f172a' }}>{phone}</span>}
        {official.email && <a href={`mailto:${official.email}`} style={{ color: '#2563eb' }}>{official.email}</a>}
      </div>
    </div>
  )
}

function CommitteePanel({ name, members, index }) {
  return (
    <div style={{ background: index % 2 === 0 ? '#fff' : '#f8fafc', padding: '1.75rem 2rem' }}>
      <p style={{ ...LABEL, color: NAVY, marginBottom: '.875rem' }}>{name}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
        {members.map(m => (
          <div key={m.name + m.officeTitle} style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
            <div style={{ width: 38, height: 38, overflow: 'hidden', flexShrink: 0, background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: 900 }}>
              {m.photoUrl
                ? <img src={m.photoUrl} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initials(m.name)}
            </div>
            <div>
              <p style={{ fontSize: '.8125rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>{m.name}</p>
              <p style={{ fontSize: '.6875rem', color: '#94a3b8' }}>{m.officeTitle}{m.isChair ? ' · Chair' : ''}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Officials() {
  const { data, isLoading } = useQuery({ queryKey: ['officials'], queryFn: api.officials })

  const officials = useMemo(
    () => (data?.items || []).filter(o => o.department !== 'police').sort((a, b) => a.order - b.order),
    [data]
  )

  const mayor   = useMemo(() => officials.filter(o => o.title === 'Mayor'), [officials])
  const council = useMemo(() => officials.filter(o => /council/i.test(o.title)), [officials])
  const other   = useMemo(() => officials.filter(o => o.title !== 'Mayor' && !/council/i.test(o.title)), [officials])

  const committeeGroups = useMemo(() => {
    const groups = new Map()
    ;[...mayor, ...council, ...other].forEach(official => {
      ;(official.committees || []).forEach(tag => {
        const isChair = /—\s*chair|\(chair\)/i.test(tag)
        const baseName = tag.replace(/\s*—\s*chair|\s*\(chair\)/i, '').trim()
        if (!groups.has(baseName)) groups.set(baseName, [])
        groups.get(baseName).push({ name: official.name, officeTitle: official.title, photoUrl: official.photoUrl, isChair })
      })
    })
    groups.forEach((members, key) =>
      groups.set(key, members.sort((a, b) => (b.isChair ? 1 : 0) - (a.isChair ? 1 : 0)))
    )
    return groups
  }, [mayor, council, other])

  if (isLoading) {
    return (
      <div style={{ padding: '4.5rem var(--px)' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ height: 200, background: '#f1f5f9', marginBottom: 8 }} className="animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>

      {/* Hero */}
      <div style={{ position: 'relative', minHeight: 300, display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)' }} />
        <img src="https://picsum.photos/seed/officials-hero/1600/700" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: .2 }} />
        <div style={{ position: 'relative', padding: '3.5rem var(--px)', zIndex: 1 }}>
          <p style={{ ...LABEL, color: '#93c5fd', marginBottom: '1rem' }}>Your elected leaders</p>
          <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 3.25rem)', fontWeight: 900, color: '#fff', lineHeight: 1.05, letterSpacing: '-.04em', marginBottom: '.875rem' }}>Village Officials</h1>
          <p style={{ color: '#cbd5e1', fontSize: '.9375rem', lineHeight: 1.8, maxWidth: 400 }}>
            Meet your mayor, council members, and staff — and see who serves on which committee.
          </p>
        </div>
      </div>

      {/* Mayor */}
      {mayor.map(o => <MayorStrip key={o.id} official={o} />)}

      {/* Council */}
      {council.length > 0 && (
        <>
          <div style={{ padding: '2rem var(--px) 1.5rem', borderTop: '1px solid #f1f5f9' }}>
            <p style={LABEL}>Village Council</p>
            <h2 style={{ fontSize: 'clamp(1.75rem, 5vw, 2rem)', fontWeight: 900, letterSpacing: '-.03em', color: '#0f172a', marginTop: '.5rem' }}>Council Members</h2>
          </div>
          {council.map((o, i) => <CouncilStrip key={o.id} official={o} index={i} />)}
        </>
      )}

      {/* Staff */}
      {other.length > 0 && (
        <>
          <div style={{ padding: '1.5rem var(--px) 1rem', borderTop: '1px solid #f1f5f9' }}>
            <p style={LABEL}>Village Staff</p>
            <h2 style={{ fontSize: '1.625rem', fontWeight: 900, letterSpacing: '-.03em', color: '#0f172a', marginTop: '.5rem' }}>Other Officials &amp; Staff</h2>
          </div>
          <div style={{ padding: '0 var(--px) 2.5rem' }}>
            {other.map((o, i) => <StaffRow key={o.id} official={o} index={i} />)}
          </div>
        </>
      )}

      {/* Committees */}
      {committeeGroups.size > 0 && (
        <>
          <div style={{ padding: '2rem var(--px) 1.5rem', borderTop: '1px solid #f1f5f9' }}>
            <p style={LABEL}>Village Government</p>
            <h2 style={{ fontSize: 'clamp(1.75rem, 5vw, 2rem)', fontWeight: 900, letterSpacing: '-.03em', color: '#0f172a', marginTop: '.5rem' }}>Committees</h2>
            <p style={{ fontSize: '.9rem', color: '#64748b', marginTop: '.375rem', maxWidth: 520 }}>
              Standing committees advise the council on specific areas of village business.
            </p>
          </div>
          <div style={{ margin: '0 var(--px) 3.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1px', background: '#f1f5f9' }}>
            {[...committeeGroups.entries()].map(([name, members], i) => (
              <CommitteePanel key={name} name={name} members={members} index={i} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
