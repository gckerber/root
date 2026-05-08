// apps/village-site/src/pages/History.jsx
import { useQuery } from '@tanstack/react-query'
import { api } from '../api'

const LABEL = { fontSize: '10px', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#94a3b8' }

const PLACEHOLDER_PHOTOS = [
  { url: 'https://picsum.photos/seed/hist-wide/1200/500', wide: true },
  { url: 'https://picsum.photos/seed/hist-a/600/450' },
  { url: 'https://picsum.photos/seed/hist-b/600/450' },
  { url: 'https://picsum.photos/seed/hist-c/600/450' },
  { url: 'https://picsum.photos/seed/hist-d/600/450' },
  { url: 'https://picsum.photos/seed/hist-e/600/450' },
  { url: 'https://picsum.photos/seed/hist-f/600/450' },
  { url: 'https://picsum.photos/seed/hist-g/600/450' },
]

function PhotoMosaic({ photos = [], startIndex = 0, count = 5, sepia = 0 }) {
  const tiles = photos.length
    ? photos.slice(startIndex, startIndex + count)
    : PLACEHOLDER_PHOTOS.slice(startIndex, startIndex + count)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, margin: '0 4.5rem 3rem' }}>
      {tiles.map((p, i) => {
        const isWide = i === 0 && p.wide !== false
        return (
          <div
            key={p.url || p.id || i}
            style={{
              gridColumn: isWide ? 'span 2' : 'span 1',
              aspectRatio: isWide ? '16/7' : '4/3',
              overflow: 'hidden',
            }}
          >
            <img
              src={p.url}
              alt={p.caption || ''}
              style={{ width: '100%', height: '100%', objectFit: 'cover', filter: sepia > 0 ? `sepia(${sepia}) contrast(1.05)` : undefined }}
            />
          </div>
        )
      })}
    </div>
  )
}

export default function History() {
  const { data: historyData } = useQuery({ queryKey: ['history'], queryFn: api.history })
  const { data: photosData }  = useQuery({ queryKey: ['photos'],  queryFn: api.photos })

  const photos = photosData?.items || []

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>

      {/* Heading with 1837 watermark */}
      <div style={{ position: 'relative', padding: '5rem 4.5rem 4rem', overflow: 'hidden', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ position: 'absolute', right: '3rem', top: '50%', transform: 'translateY(-50%)', fontSize: '16rem', fontWeight: 900, color: '#f1f5f9', lineHeight: 1, pointerEvents: 'none', userSelect: 'none', letterSpacing: '-.06em' }}>
          1837
        </div>
        <p style={{ ...LABEL, marginBottom: '.875rem', position: 'relative' }}>Incorporated 1837 · Knox County, Ohio</p>
        <h1 style={{ fontSize: '3.75rem', fontWeight: 900, letterSpacing: '-.04em', lineHeight: 1.05, maxWidth: 560, position: 'relative', color: '#0f172a' }}>
          The Story of<br />Saint Louisville
        </h1>
        <p style={{ fontSize: '1rem', color: '#64748b', lineHeight: 1.875, maxWidth: 540, marginTop: '1.125rem', position: 'relative' }}>
          From its earliest days as a small farming settlement along the Ohio frontier to the tight-knit village it is today — this is the history of Saint Louisville.
        </p>
      </div>

      {/* Era 1 — photo left */}
      <div style={{ display: 'flex', alignItems: 'stretch', minHeight: 480, borderTop: '1px solid #f1f5f9' }}>
        <div style={{ width: '46%', overflow: 'hidden', flexShrink: 0 }}>
          <img
            src={photos[0]?.url || 'https://picsum.photos/seed/history1/900/700'}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(.45) contrast(1.05)' }}
          />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '3.5rem 4.5rem' }}>
          <p style={{ ...LABEL, marginBottom: '.875rem' }}>Early History · 1837–1880</p>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-.03em', marginBottom: '1rem', color: '#0f172a' }}>Founded on the frontier</h2>
          <p style={{ color: '#374151', fontSize: '.9375rem', lineHeight: 1.9, maxWidth: 440, marginBottom: '1rem' }}>
            {historyData?.text
              ? historyData.text.slice(0, 400)
              : 'Saint Louisville was platted in 1837 along the eastern Ohio frontier, settled by families drawn by the promise of fertile farmland and strong community roots. The village grew quickly to include a general store, a schoolhouse, a post office, and a church — the hallmarks of a thriving Ohio settlement.'}
          </p>
          <p style={{ color: '#64748b', fontSize: '.9375rem', lineHeight: 1.9, maxWidth: 440 }}>
            By 1860 the village had its own constable, a small tavern, and regular mail service. Residents participated in the great political debates of the era, and several Saint Louisville men served in the Union Army during the Civil War.
          </p>
        </div>
      </div>

      {/* Photo mosaic 1 */}
      <div style={{ padding: '2.5rem 4.5rem 1.5rem', borderTop: '1px solid #f1f5f9' }}>
        <p style={LABEL}>Photo archive — historical &amp; community photos</p>
      </div>
      <PhotoMosaic photos={photos} startIndex={0} count={5} sepia={0.35} />

      {/* Era 2 — photo right */}
      <div style={{ display: 'flex', alignItems: 'stretch', minHeight: 460, background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '3.5rem 4.5rem' }}>
          <p style={{ ...LABEL, marginBottom: '.875rem' }}>Growth &amp; Change · 1880–1950</p>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-.03em', marginBottom: '1rem', color: '#0f172a' }}>Into the modern age</h2>
          <p style={{ color: '#374151', fontSize: '.9375rem', lineHeight: 1.9, maxWidth: 440, marginBottom: '1rem' }}>
            The late 19th and early 20th centuries brought change to Saint Louisville. The arrival of improved roads and later the automobile transformed how residents connected to the wider world. A formal village government was organized, and the first dedicated Village Hall was built in 1921.
          </p>
          <p style={{ color: '#64748b', fontSize: '.9375rem', lineHeight: 1.9, maxWidth: 440 }}>
            The Great Depression tested the community, but neighbors supported one another through hard times. By the postwar era, the village was growing steadily, with new families and returning veterans putting down roots.
          </p>
        </div>
        <div style={{ width: '46%', overflow: 'hidden', flexShrink: 0 }}>
          <img
            src={photos[1]?.url || 'https://picsum.photos/seed/history2/900/700'}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(.25) contrast(1.05)' }}
          />
        </div>
      </div>

      {/* Photo mosaic 2 */}
      <PhotoMosaic photos={photos} startIndex={5} count={3} sepia={0.15} />

      {/* Era 3 — photo left */}
      <div style={{ display: 'flex', alignItems: 'stretch', minHeight: 420, borderTop: '1px solid #f1f5f9' }}>
        <div style={{ width: '46%', overflow: 'hidden', flexShrink: 0 }}>
          <img
            src={photos[2]?.url || 'https://picsum.photos/seed/history3/900/700'}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '3.5rem 4.5rem' }}>
          <p style={{ ...LABEL, marginBottom: '.875rem' }}>Today · 1950–Present</p>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-.03em', marginBottom: '1rem', color: '#0f172a' }}>A community that endures</h2>
          <p style={{ color: '#374151', fontSize: '.9375rem', lineHeight: 1.9, maxWidth: 440, marginBottom: '1rem' }}>
            Through the postwar boom, shifting agricultural trends, and the challenges of the modern economy, Saint Louisville has remained a place where neighbors know each other's names.
          </p>
          <p style={{ color: '#64748b', fontSize: '.9375rem', lineHeight: 1.9, maxWidth: 440 }}>
            The village today carries its history lightly — proud of the past, focused on the future. Community events, a dedicated police department, and an engaged village council keep the spirit of Saint Louisville alive and well into the 21st century.
          </p>
        </div>
      </div>
    </div>
  )
}
