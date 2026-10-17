// apps/village-site/src/theme/SeasonDecor.jsx
// Seasonal decoration: floating particles, a border strip, and hero scenery. All decorative (aria-hidden).
import { useMemo } from 'react'
import { useSeason } from './ThemeProvider'

// Deterministic pseudo-random so particles don't reshuffle on every render
const rnd = (i, k) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453
  return x - Math.floor(x)
}
const pick = (arr, i, k) => arr[Math.floor(rnd(i, k) * arr.length)]

// ── Particle glyphs ───────────────────────────────────────────────────────────
const BAT_PATH =
  'M30 8 L33 3 L35 9 Q44 4 58 8 Q52 11 53 18 Q47 14 43 19 Q40 14 35 20 L30 27 L25 20 Q20 14 17 19 Q13 14 7 18 Q8 11 2 8 Q16 4 25 9 L27 3 Z'
const STAR_POINTS = '12,2 14.9,8.6 22,9.3 16.6,14 18.2,21 12,17.3 5.8,21 7.4,14 2,9.3 9.1,8.6'

function Glyph({ kind, color }) {
  switch (kind) {
    case 'bat':
      return <svg viewBox="0 0 60 30" width="100%" height="100%"><path d={BAT_PATH} fill="#1a0b2e" /></svg>
    case 'leaf':
      return (
        <svg viewBox="0 0 24 24" width="100%" height="100%">
          <path d="M12 1 C21 6 23 15 12 23 C1 15 3 6 12 1 Z" fill={color} />
          <path d="M12 4 V22" stroke="rgba(0,0,0,.25)" strokeWidth="1" />
        </svg>
      )
    case 'snow':
      return (
        <svg viewBox="0 0 24 24" width="100%" height="100%">
          <g stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
            <path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7" />
          </g>
        </svg>
      )
    case 'petal':
      return (
        <svg viewBox="0 0 24 24" width="100%" height="100%">
          <path d="M12 1 C20 6 20 17 12 23 C4 17 4 6 12 1 Z" fill={color} />
        </svg>
      )
    case 'star':
      return (
        <svg viewBox="0 0 24 24" width="100%" height="100%">
          <polygon points={STAR_POINTS} fill={color} stroke="rgba(255,255,255,.9)" strokeWidth="1" />
        </svg>
      )
    case 'ember':
      return (
        <svg viewBox="0 0 10 10" width="100%" height="100%">
          <circle cx="5" cy="5" r="4" fill={color} />
        </svg>
      )
    default:
      return null
  }
}

const LEAF_COLORS = ['#c2410c', '#ea580c', '#d97706', '#b91c1c', '#ca8a04']
const PETAL_COLORS = ['#f9a8d4', '#fbcfe8', '#f472b6', '#ffffff']
const STAR_COLORS = ['#dc2626', '#1d4ed8', '#fbbf24', '#ffffff']
const EMBER_COLORS = ['#fb923c', '#f97316', '#fbbf24']

function buildParticles(kind) {
  const list = []
  const falling = (n, glyph, colors, minS, maxS, anim, extra = {}) => {
    for (let i = 0; i < n; i++) {
      const dur = 14 + rnd(i, 2) * 14
      const size = minS + rnd(i, 3) * (maxS - minS)
      list.push({
        key: `${glyph}-${i}`,
        glyph,
        color: pick(colors, i, 5),
        style: {
          left: `${rnd(i, 1) * 100}%`,
          top: 0,
          width: size,
          height: size,
          opacity: 0,
          '--sway': `${(rnd(i, 4) - 0.5) * 120}px`,
          animation: `${anim} ${dur}s linear ${-rnd(i, 6) * dur}s infinite`,
          ...extra,
        },
      })
    }
  }
  if (kind === 'leaf') falling(12, 'leaf', LEAF_COLORS, 16, 30, 'slv-fall')
  if (kind === 'snow') falling(28, 'snow', ['#fff'], 8, 18, 'slv-fall')
  if (kind === 'petal') falling(14, 'petal', PETAL_COLORS, 10, 20, 'slv-fall')
  if (kind === 'star') falling(14, 'star', STAR_COLORS, 12, 22, 'slv-rise')
  if (kind === 'bat') {
    falling(10, 'ember', EMBER_COLORS, 4, 8, 'slv-rise')
    for (let i = 0; i < 5; i++) {
      const dur = 16 + rnd(i, 8) * 14
      const w = 34 + rnd(i, 9) * 26
      list.push({
        key: `bat-${i}`,
        glyph: 'bat',
        flap: true,
        style: {
          left: 0,
          top: `${6 + rnd(i, 10) * 46}vh`,
          width: w,
          height: w / 2,
          '--dip': `${(rnd(i, 11) - 0.5) * 90}px`,
          animation: `slv-fly ${dur}s linear ${-rnd(i, 12) * dur}s infinite`,
        },
      })
    }
  }
  return list
}

export function Particles() {
  const season = useSeason()
  const items = useMemo(() => buildParticles(season.particles), [season.particles])
  return (
    <div className="slv-particles" aria-hidden="true">
      {items.map((p) => (
        <span key={p.key} style={p.style}>
          {p.flap ? (
            <span style={{ display: 'block', width: '100%', height: '100%', animation: 'slv-flap .38s ease-in-out infinite' }}>
              <Glyph kind={p.glyph} color={p.color} />
            </span>
          ) : (
            <Glyph kind={p.glyph} color={p.color} />
          )}
        </span>
      ))}
    </div>
  )
}

// ── Border strip (hangs under the nav, flips above the footer) ────────────────
const svgUrl = (w, h, body) =>
  `url("data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`
  )}")`

const leafAt = (x, c, rot = 0) =>
  `<g transform="translate(${x} 4) rotate(${rot})"><path d="M0 0 C7 4 8 12 0 18 C-8 12 -7 4 0 0Z" fill="${c}"/><path d="M0 2 V16" stroke="rgba(0,0,0,.25)" stroke-width="1"/></g>`

const STRIPS = {
  halloween: {
    w: 140, h: 30,
    body:
      `<path d="M0 2 Q35 7 70 2 T140 2" stroke="#6d28d9" stroke-width="1.4" fill="none"/>` +
      `<g transform="translate(24 5)"><rect x="-1.5" y="0" width="3" height="3" fill="#166534"/><ellipse cx="0" cy="11" rx="10" ry="9" fill="#f97316"/><path d="M-5 9 l2.5 -4 l2.5 4z M1 9 l2.5 -4 l2.5 4z M-6 14 Q0 20 6 14 L3.5 13 L1.5 15 L-1.5 13 L-3.5 15z" fill="#1f1235"/></g>` +
      `<g transform="translate(70 9) scale(.5)"><path d="${BAT_PATH}" fill="#1f1235"/></g>` +
      `<g transform="translate(114 5)"><path d="M-8 22 V10 a8 8 0 0 1 16 0 V22 l-4 -3 l-4 3 l-4 -3z" fill="#f5f3ff"/><circle cx="-3" cy="10" r="1.6" fill="#1f1235"/><circle cx="3" cy="10" r="1.6" fill="#1f1235"/></g>`,
  },
  thanksgiving: {
    w: 140, h: 28,
    body:
      `<path d="M0 3 Q35 8 70 3 T140 3" stroke="#92400e" stroke-width="1.6" fill="none"/>` +
      leafAt(14, '#c2410c', 10) + leafAt(42, '#d97706', -12) + leafAt(70, '#b91c1c', 8) + leafAt(98, '#ca8a04', -8) + leafAt(124, '#ea580c', 12),
  },
  christmas: {
    w: 120, h: 28,
    body:
      `<path d="M0 4 Q30 14 60 4 T120 4" stroke="#14532d" stroke-width="2" fill="none"/>` +
      [['#ef4444', 15, 11], ['#fbbf24', 45, 11], ['#22c55e', 75, 11], ['#60a5fa', 105, 11]]
        .map(([c, x, y]) => `<circle cx="${x}" cy="${y + 2}" r="7.5" fill="${c}" opacity=".28"/><rect x="${x - 2}" y="${y - 6}" width="4" height="5" fill="#14532d"/><ellipse cx="${x}" cy="${y + 2}" rx="3.8" ry="5" fill="${c}"/>`)
        .join(''),
  },
  winter: {
    w: 100, h: 30,
    body:
      `<rect x="0" y="0" width="100" height="4" fill="#e0f2fe"/>` +
      [[8, 14], [24, 24], [40, 12], [57, 28], [74, 16], [90, 22]]
        .map(([x, l]) => `<path d="M${x - 4} 3 L${x} ${3 + l} L${x + 4} 3Z" fill="#bae6fd" opacity=".95"/><path d="M${x - 1.5} 3 L${x} ${l - 2} L${x + 1} 3Z" fill="#fff" opacity=".8"/>`)
        .join(''),
  },
  spring: {
    w: 120, h: 28,
    body:
      `<path d="M0 3 Q30 9 60 3 T120 3" stroke="#4d7c0f" stroke-width="2" fill="none"/>` +
      [[18, '#f472b6'], [60, '#fbbf24'], [102, '#c084fc']]
        .map(([x, c]) =>
          `<path d="M${x} 5 V12" stroke="#4d7c0f" stroke-width="1.6"/><g transform="translate(${x} 17)">` +
          [0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-5" rx="3.4" ry="5" fill="${c}" transform="rotate(${a})"/>`).join('') +
          `<circle r="2.6" fill="#fef3c7"/></g>`)
        .join('') +
      `<path d="M38 5 q-5 4 -2 9 q6 -2 2 -9z M80 5 q5 4 2 9 q-6 -2 -2 -9z" fill="#65a30d"/>`,
  },
  summer: {
    w: 120, h: 30,
    body:
      `<path d="M0 3 Q30 11 60 3 T120 3" stroke="#475569" stroke-width="1.4" fill="none"/>` +
      [[4, '#dc2626'], [44, '#ffffff'], [84, '#1d4ed8']]
        .map(([x, c]) => `<path d="M${x} 5 L${x + 32} 5 L${x + 16} 27Z" fill="${c}" stroke="${c === '#ffffff' ? '#cbd5e1' : 'none'}"/>`)
        .join('') +
      `<polygon transform="translate(96 9) scale(.5)" points="${STAR_POINTS}" fill="#fff"/>`,
  },
}

export function SeasonStrip({ flip = false, height = 28 }) {
  const season = useSeason()
  const key = season.id === 'autumn' ? 'thanksgiving' : season.id
  const strip = STRIPS[key]
  return (
    <div
      aria-hidden="true"
      style={{
        height,
        backgroundImage: svgUrl(strip.w, strip.h, strip.body),
        backgroundRepeat: 'repeat-x',
        backgroundSize: `auto ${height}px`,
        transform: flip ? 'scaleY(-1)' : undefined,
        pointerEvents: 'none',
      }}
    />
  )
}

// ── Hero scenery ──────────────────────────────────────────────────────────────
function Cobweb({ mirror = false }) {
  return (
    <svg
      viewBox="0 0 200 200"
      aria-hidden="true"
      style={{ position: 'absolute', top: 0, [mirror ? 'right' : 'left']: 0, width: 'clamp(110px, 17vw, 220px)', transform: mirror ? 'scaleX(-1)' : undefined, opacity: 0.55 }}
    >
      <g stroke="#e9d5ff" strokeWidth="1.2" fill="none" strokeLinecap="round">
        <path d="M0 0 L200 0 M0 0 L0 200 M0 0 L170 110 M0 0 L110 170 M0 0 L195 40 M0 0 L40 195" />
        <path d="M50 0 Q48 40 0 50 M100 0 Q92 86 0 100 M150 0 Q136 130 0 150" />
        <path d="M46 20 Q60 55 20 46 M85 40 Q96 100 40 85" strokeWidth=".8" />
      </g>
      <ellipse cx="108" cy="124" rx="4" ry="5" fill="#1a0b2e" />
      <path d="M90 100 L108 120 M108 120 L124 104" stroke="#1a0b2e" strokeWidth="1.2" />
    </svg>
  )
}

function Moon() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute', top: '9%', right: 'clamp(4%, 9vw, 14%)', width: 'clamp(70px, 10vw, 130px)', aspectRatio: '1',
        borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 35%, #fffbe6 0%, #fde68a 55%, #f4c95d 100%)',
        boxShadow: '0 0 60px 18px rgba(253,230,138,.35)',
      }}
    >
      <span style={{ position: 'absolute', left: '22%', top: '28%', width: '16%', aspectRatio: '1', borderRadius: '50%', background: 'rgba(180,140,40,.25)' }} />
      <span style={{ position: 'absolute', left: '55%', top: '52%', width: '22%', aspectRatio: '1', borderRadius: '50%', background: 'rgba(180,140,40,.2)' }} />
    </div>
  )
}

function Fireworks() {
  const bursts = [
    { x: '72%', y: '16%', c: '#f87171', s: 1 },
    { x: '86%', y: '34%', c: '#bfdbfe', s: 0.75 },
    { x: '58%', y: '30%', c: '#ffffff', s: 0.6 },
  ]
  return (
    <>
      {bursts.map((b, i) => (
        <svg
          key={i}
          aria-hidden="true"
          className="slv-twinkle"
          viewBox="-50 -50 100 100"
          style={{ position: 'absolute', left: b.x, top: b.y, width: `${110 * b.s}px`, animationDelay: `${i * 0.9}s` }}
        >
          <g stroke={b.c} strokeWidth="3" strokeLinecap="round">
            {Array.from({ length: 14 }, (_, k) => (
              <path key={k} d="M0 -16 L0 -40" transform={`rotate(${k * (360 / 14)})`} />
            ))}
          </g>
          <g fill={b.c}>
            {Array.from({ length: 14 }, (_, k) => (
              <circle key={k} cx="0" cy="-47" r="2.4" transform={`rotate(${k * (360 / 14) + 12})`} />
            ))}
          </g>
        </svg>
      ))}
    </>
  )
}

const pine = (x, h, fill, snow) => {
  const w = h * 0.55
  return (
    <g key={`${x}-${h}`} transform={`translate(${x} 0)`}>
      <rect x={-3} y={-8} width={6} height={10} fill="#3b2314" />
      <polygon points={`${-w / 2},-8 0,${-h * 0.62} ${w / 2},-8`} fill={fill} />
      <polygon points={`${-w * 0.4},${-h * 0.4} 0,${-h * 0.85} ${w * 0.4},${-h * 0.4}`} fill={fill} />
      <polygon points={`${-w * 0.27},${-h * 0.7} 0,${-h} ${w * 0.27},${-h * 0.7}`} fill={fill} />
      {snow && <polygon points={`${-w * 0.27},${-h * 0.7} 0,${-h} ${w * 0.27},${-h * 0.7} 0,${-h * 0.78}`} fill="#f8fafc" opacity=".9" />}
    </g>
  )
}

function Ground({ id }) {
  switch (id) {
    case 'halloween':
      return (
        <>
          <g fill="#120720">
            <rect x="900" y="58" width="112" height="64" />
            <polygon points="888,62 956,22 1024,62" />
            <rect x="986" y="30" width="22" height="50" />
            <polygon points="980,34 997,8 1014,34" />
          </g>
          <g fill="#fb923c"><rect x="918" y="78" width="14" height="20" /><rect x="990" y="46" width="10" height="14" /></g>
          <rect x="958" y="78" width="14" height="20" fill="#fbbf24" />
          <g stroke="#120720" fill="none" strokeLinecap="round">
            <g strokeWidth="8"><path d="M190 122 C188 92 192 70 186 40" /></g>
            <g strokeWidth="5"><path d="M188 84 C170 74 160 62 148 42" /><path d="M190 66 C205 56 214 46 224 30" /><path d="M186 50 C178 42 176 34 166 24" /></g>
            <g strokeWidth="3"><path d="M160 60 C150 58 142 52 136 44" /><path d="M214 46 C226 46 234 40 240 32" /></g>
          </g>
          <g fill="#120720">
            <path d="M400 122 V94 a10 10 0 0 1 20 0 V122z" /><path d="M440 122 V100 a8 8 0 0 1 16 0 V122z" /><path d="M700 122 V92 a11 11 0 0 1 22 0 V122z" />
          </g>
          <path d="M0 140 V114 Q150 98 300 112 T600 108 T900 116 T1200 106 V140 Z" fill="#1a0b2e" />
          {[[540, 1], [585, 0.75], [770, 1.1]].map(([x, s]) => (
            <g key={x} transform={`translate(${x} 110) scale(${s})`}>
              <rect x="-2" y="-18" width="4" height="6" fill="#166534" />
              <ellipse cx="0" cy="-4" rx="16" ry="13" fill="#ea580c" />
              <path d="M-7 -8 l3 -5 l3 5z M2 -8 l3 -5 l3 5z M-9 -1 Q0 8 9 -1 L5 -3 L2 0 L-2 -3 L-5 0z" fill="#2a1245" />
            </g>
          ))}
        </>
      )
    case 'autumn':
    case 'thanksgiving':
      return (
        <>
          <path d="M0 140 V96 Q200 70 420 92 T820 88 T1200 82 V140 Z" fill="#9a3412" />
          <g transform="translate(900 78) scale(1.25)">
            {[-70, -46, -23, 0, 23, 46, 70].map((a, i) => (
              <ellipse key={a} cx="0" cy="-36" rx="9" ry="30" transform={`rotate(${a})`} fill={['#b91c1c', '#ea580c', '#f59e0b', '#ca8a04', '#f59e0b', '#ea580c', '#b91c1c'][i]} />
            ))}
            <ellipse cx="0" cy="6" rx="22" ry="20" fill="#78350f" />
            <path d="M-22 6 Q-6 -2 6 8" stroke="#92400e" strokeWidth="3" fill="none" />
            <circle cx="-18" cy="-12" r="8" fill="#92400e" />
            <polygon points="-25,-13 -33,-10 -25,-8" fill="#f59e0b" />
            <path d="M-22 -6 q-2 7 2 8" stroke="#dc2626" strokeWidth="3" fill="none" strokeLinecap="round" />
            <circle cx="-20" cy="-14" r="1.6" fill="#1c1917" />
            <path d="M-8 24 V40 M6 24 V40 M-12 40 h8 M2 40 h8" stroke="#f59e0b" strokeWidth="2.5" fill="none" />
          </g>
          <path d="M0 140 V112 Q250 96 520 110 T1000 106 T1200 100 V140 Z" fill="#7c2d12" />
          {[[260, 1], [310, 0.8], [640, 1.15]].map(([x, s]) => (
            <g key={x} transform={`translate(${x} 112) scale(${s})`}>
              <rect x="-2" y="-20" width="4" height="7" fill="#365314" />
              <ellipse cx="0" cy="-5" rx="17" ry="14" fill="#ea580c" />
              <path d="M-6 -17 Q-8 -5 -6 7 M6 -17 Q8 -5 6 7" stroke="#c2410c" strokeWidth="2" fill="none" />
            </g>
          ))}
          {[110, 150].map((x) => (
            <g key={x} transform={`translate(${x} 112)`}>
              <polygon points="-18,0 0,-46 18,0" fill="#ca8a04" />
              <path d="M-9 -22 H9 M-14 -10 H14" stroke="#92400e" strokeWidth="2" />
            </g>
          ))}
        </>
      )
    case 'christmas':
      return (
        <>
          {[[60, 90], [150, 70], [300, 100], [420, 60], [560, 86], [700, 64], [820, 98], [930, 60]].map(([x, h]) => (
            <g key={x} transform={`translate(${x} 122)`}>{pine(0, h * 1.2, '#14532d', true)}</g>
          ))}
          <g transform="translate(1000 122)">
            {pine(0, 120, '#166534', true)}
            <polygon points="0,-132 3.5,-122 14,-121 6,-114 8.5,-104 0,-110 -8.5,-104 -6,-114 -14,-121 -3.5,-122" fill="#fde047" />
            {[[-12, -34, '#ef4444'], [10, -52, '#fbbf24'], [-6, -72, '#60a5fa'], [8, -22, '#fbbf24'], [-3, -92, '#ef4444']].map(([x, y, c], i) => (
              <circle key={i} cx={x} cy={y} r="4" fill={c} />
            ))}
          </g>
          <g transform="translate(1068 124)">
            <rect x="-14" y="-22" width="28" height="22" fill="#b91c1c" /><rect x="-3" y="-22" width="6" height="22" fill="#fde68a" /><rect x="-14" y="-13" width="28" height="5" fill="#fde68a" />
          </g>
          <path d="M0 140 V120 Q150 108 300 118 T600 116 T900 120 T1200 114 V140 Z" fill="#f1f5f9" />
        </>
      )
    case 'winter':
      return (
        <>
          {[[70, 80], [190, 60], [330, 90], [470, 56], [640, 84], [790, 62]].map(([x, h]) => (
            <g key={x} transform={`translate(${x} 122)`}>{pine(0, h * 1.2, '#1e4d6b', true)}</g>
          ))}
          <path d="M0 140 V106 Q250 84 520 102 T1000 96 T1200 90 V140 Z" fill="#e0f2fe" />
          <g transform="translate(980 112)">
            <circle cx="0" cy="-8" r="24" fill="#f8fafc" /><circle cx="0" cy="-44" r="18" fill="#f8fafc" /><circle cx="0" cy="-70" r="13" fill="#f8fafc" />
            <rect x="-11" y="-92" width="22" height="12" fill="#1e293b" /><rect x="-16" y="-82" width="32" height="4" fill="#1e293b" />
            <polygon points="0,-72 14,-69 0,-66" fill="#f97316" />
            <circle cx="-4" cy="-74" r="1.6" fill="#1e293b" /><circle cx="4" cy="-74" r="1.6" fill="#1e293b" />
            <path d="M-12 -57 Q0 -50 12 -57" stroke="#dc2626" strokeWidth="5" fill="none" strokeLinecap="round" />
            <circle cx="0" cy="-40" r="2" fill="#1e293b" /><circle cx="0" cy="-30" r="2" fill="#1e293b" />
          </g>
          <path d="M0 140 V120 Q200 108 420 118 T860 116 T1200 112 V140 Z" fill="#f8fafc" />
        </>
      )
    case 'spring':
      return (
        <>
          <path d="M0 140 V90 Q220 66 460 88 T900 84 T1200 78 V140 Z" fill="#65a30d" />
          <path d="M0 140 V112 Q260 96 560 110 T1200 100 V140 Z" fill="#4d7c0f" />
          {Array.from({ length: 22 }, (_, i) => {
            const x = 30 + i * 54 + (i % 2) * 14
            const c = ['#f472b6', '#fbbf24', '#ef4444', '#c084fc', '#f9a8d4'][i % 5]
            const h = 28 + ((i * 7) % 5) * 7
            return (
              <g key={i} transform={`translate(${x} 122)`}>
                <path d={`M0 0 V${-h}`} stroke="#3f6212" strokeWidth="3" />
                <path d={`M0 ${-h * 0.4} q-10 -6 -12 -16`} stroke="#3f6212" strokeWidth="2.4" fill="none" />
                <path d={`M-9 ${-h} Q-10 ${-h - 16} 0 ${-h - 14} Q10 ${-h - 16} 9 ${-h} Q0 ${-h + 8} -9 ${-h}Z`} fill={c} />
              </g>
            )
          })}
        </>
      )
    case 'summer':
    default:
      return (
        <>
          <path d="M0 140 V70 Q150 50 300 70 T600 70 T900 70 T1200 70 V140 Z" fill="#b91c1c" />
          <path d="M0 140 V88 Q150 68 300 88 T600 88 T900 88 T1200 88 V140 Z" fill="#f8fafc" />
          <path d="M0 140 V106 Q150 86 300 106 T600 106 T900 106 T1200 106 V140 Z" fill="#b91c1c" />
          <path d="M0 140 V124 Q150 104 300 124 T600 124 T900 124 T1200 124 V140 Z" fill="#1e3a8a" />
          <g fill="#fff" opacity=".9">
            {[60, 130, 200].map((x) => (
              <polygon key={x} transform={`translate(${x} 108) scale(.8)`} points={STAR_POINTS} />
            ))}
          </g>
        </>
      )
  }
}

export function HeroScene() {
  const season = useSeason()
  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {season.id === 'halloween' && (<><Moon /><Cobweb /><Cobweb mirror /></>)}
      {season.id === 'summer' && <Fireworks />}
      <svg
        viewBox="0 0 1200 140"
        preserveAspectRatio="xMidYMax slice"
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: 'clamp(90px, 16vw, 170px)' }}
      >
        <Ground id={season.id} />
      </svg>
    </div>
  )
}