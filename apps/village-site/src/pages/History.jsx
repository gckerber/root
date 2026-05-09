// apps/village-site/src/pages/History.jsx
import { useQuery } from '@tanstack/react-query'
import { api } from '../api'

const LABEL = { fontSize: '10px', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#94a3b8' }

// Parse JSON stored in text field, fall back to static defaults
function parseHistoryData(raw) {
  try {
    const parsed = JSON.parse(raw || '{}')
    if (Array.isArray(parsed.sections)) return parsed
  } catch {}
  return {
    pageTitle: 'History',
    sections: [
      {
        id: 's-default-1',
        title: 'Founded on the frontier',
        subtitle: 'Early History · 1837–1880',
        body: raw || 'Saint Louisville was platted in 1837 along the eastern Ohio frontier, settled by families drawn by the promise of fertile farmland and strong community roots.',
        body2: 'By 1860 the village had its own constable, a small tavern, and regular mail service. Several Saint Louisville men served in the Union Army during the Civil War.',
        mainPhotoUrl: '',
        galleryPhotos: [],
        enabled: true,
        order: 0,
        photoSide: 'left',
      },
      {
        id: 's-default-2',
        title: 'Into the modern age',
        subtitle: 'Growth & Change · 1880–1950',
        body: 'The late 19th and early 20th centuries brought change to Saint Louisville. The arrival of improved roads and later the automobile transformed how residents connected to the wider world.',
        body2: 'The Great Depression tested the community, but neighbors supported one another through hard times. By the postwar era, the village was growing steadily.',
        mainPhotoUrl: '',
        galleryPhotos: [],
        enabled: true,
        order: 1,
        photoSide: 'right',
      },
      {
        id: 's-default-3',
        title: 'A community that endures',
        subtitle: 'Today · 1950–Present',
        body: 'Through the postwar boom, shifting agricultural trends, and the challenges of the modern economy, Saint Louisville has remained a place where neighbors know each other\'s names.',
        body2: 'The village today carries its history lightly — proud of the past, focused on the future. Community events, a dedicated police department, and an engaged village council keep the spirit alive.',
        mainPhotoUrl: '',
        galleryPhotos: [],
        enabled: true,
        order: 2,
        photoSide: 'left',
      },
    ],
  }
}

function PhotoMosaic({ photos = [] }) {
  if (!photos.length) return null
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 4, margin: '0 var(--px) 2rem' }}>
      {photos.map((p, i) => (
        <div key={p.url + i} style={{ aspectRatio: i === 0 && photos.length > 1 ? '16/7' : '4/3', overflow: 'hidden', gridColumn: i === 0 && photos.length > 1 ? 'span 2' : 'span 1' }}>
          <img src={p.url} alt={p.caption || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ))}
    </div>
  )
}

function EraSection({ section, index }) {
  const photoLeft = section.photoSide !== 'right'
  const bg = index % 2 === 1 ? '#f8fafc' : '#fff'

  const textBlock = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '3.5rem var(--px)' }}>
      {section.subtitle && <p style={{ ...LABEL, marginBottom: '.875rem' }}>{section.subtitle}</p>}
      <h2 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.25rem)', fontWeight: 900, letterSpacing: '-.03em', marginBottom: '1rem', color: '#0f172a' }}>{section.title}</h2>
      {section.body && <p style={{ color: '#374151', fontSize: '.9375rem', lineHeight: 1.9, maxWidth: 440, marginBottom: '1rem' }}>{section.body}</p>}
      {section.body2 && <p style={{ color: '#64748b', fontSize: '.9375rem', lineHeight: 1.9, maxWidth: 440 }}>{section.body2}</p>}
    </div>
  )

  const photoBlock = (
    <div style={{ width: 'min(46%, 100%)', overflow: 'hidden', flexShrink: 0 }}>
      {section.mainPhotoUrl ? (
        <img src={section.mainPhotoUrl} alt={section.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)', minHeight: 300 }} />
      )}
    </div>
  )

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'stretch', minHeight: 420, background: bg, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
        {photoLeft ? <>{photoBlock}{textBlock}</> : <>{textBlock}{photoBlock}</>}
      </div>
      {section.galleryPhotos?.length > 0 && (
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '2rem' }}>
          <PhotoMosaic photos={section.galleryPhotos} />
        </div>
      )}
    </>
  )
}

export default function History() {
  const { data: historyData } = useQuery({ queryKey: ['history'], queryFn: api.history, staleTime: 5 * 60 * 1000 })

  const { pageTitle, sections } = parseHistoryData(historyData?.text)
  const activeSections = sections.filter(s => s.enabled !== false).sort((a, b) => a.order - b.order)

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      {/* Heading */}
      <div style={{ position: 'relative', padding: '5rem var(--px) 4rem', overflow: 'hidden', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ position: 'absolute', right: '3rem', top: '50%', transform: 'translateY(-50%)', fontSize: '16rem', fontWeight: 900, color: '#f1f5f9', lineHeight: 1, pointerEvents: 'none', userSelect: 'none', letterSpacing: '-.06em' }}>
          1837
        </div>
        <p style={{ ...LABEL, marginBottom: '.875rem', position: 'relative' }}>Incorporated 1837 · Knox County, Ohio</p>
        <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 3.75rem)', fontWeight: 900, letterSpacing: '-.04em', lineHeight: 1.05, maxWidth: 560, position: 'relative', color: '#0f172a' }}>
          {pageTitle || 'History'}
        </h1>
        <p style={{ fontSize: '1rem', color: '#64748b', lineHeight: 1.875, maxWidth: 540, marginTop: '1.125rem', position: 'relative' }}>
          From its earliest days as a small farming settlement along the Ohio frontier to the tight-knit village it is today — this is the history of Saint Louisville.
        </p>
      </div>

      {/* Dynamic sections */}
      {activeSections.map((section, i) => (
        <EraSection key={section.id} section={section} index={i} />
      ))}
    </div>
  )
}
