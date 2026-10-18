// apps/village-site/src/theme/seasons.js
// Seasonal themes. The active season is picked from today's date (or a ?season= override).

export const SEASONS = {
  halloween: {
    id: 'halloween',
    name: 'Halloween',
    greeting: 'Happy Halloween from Saint Louisville',
    tagline: 'Porch lights on, candy bowls full. Beware the bats.',
    eventsTitle: 'Halloween Happenings',
    eventsEyebrow: 'Spooky Season',
    colors: { primary: '#2a1245', brand: '#c2410c', accent: '#fb923c', surface: '#faf5ff', ink: '#120a1f' },
    hero: 'linear-gradient(105deg, rgba(26,8,48,.88) 0%, rgba(58,18,84,.62) 45%, rgba(194,65,12,.22) 100%)',
    font: '"Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif',
    particles: 'ember',
  },
  autumn: {
    id: 'autumn',
    name: 'Autumn',
    greeting: 'Happy Fall from Saint Louisville',
    tagline: 'Crisp air, golden leaves, and good neighbors.',
    eventsTitle: 'Fall Festivities',
    eventsEyebrow: 'Autumn in the Village',
    colors: { primary: '#5b2a0e', brand: '#b45309', accent: '#fbbf24', surface: '#fff8ee', ink: '#2b1608' },
    hero: 'linear-gradient(105deg, rgba(60,26,6,.85) 0%, rgba(120,53,15,.55) 50%, rgba(217,119,6,.2) 100%)',
    font: 'Georgia, "Times New Roman", serif',
    particles: 'leaf',
  },
  thanksgiving: {
    id: 'thanksgiving',
    name: 'Thanksgiving',
    greeting: 'Happy Thanksgiving from Saint Louisville',
    tagline: 'Grateful for every neighbor in our village.',
    eventsTitle: 'Thanksgiving Season Events',
    eventsEyebrow: 'Giving Thanks',
    colors: { primary: '#5b2a0e', brand: '#b45309', accent: '#fbbf24', surface: '#fff8ee', ink: '#2b1608' },
    hero: 'linear-gradient(105deg, rgba(60,26,6,.85) 0%, rgba(120,53,15,.55) 50%, rgba(217,119,6,.2) 100%)',
    font: 'Georgia, "Times New Roman", serif',
    particles: 'leaf',
  },
  christmas: {
    id: 'christmas',
    name: 'Christmas',
    greeting: 'Merry Christmas from Saint Louisville',
    tagline: 'Wishing every household peace, warmth, and good cheer.',
    eventsTitle: 'Holiday Happenings',
    eventsEyebrow: 'Happy Holidays',
    colors: { primary: '#14532d', brand: '#b91c1c', accent: '#fde68a', surface: '#f5faf6', ink: '#0b2415' },
    hero: 'linear-gradient(105deg, rgba(8,45,24,.88) 0%, rgba(20,83,45,.55) 50%, rgba(185,28,28,.22) 100%)',
    font: 'Georgia, "Times New Roman", serif',
    particles: 'snow',
  },
  winter: {
    id: 'winter',
    name: 'Winter',
    greeting: 'Winter Greetings from Saint Louisville',
    tagline: 'Bundle up, check on a neighbor, and stay warm.',
    eventsTitle: 'Winter Events',
    eventsEyebrow: 'Cold Season',
    colors: { primary: '#1e3a5f', brand: '#0369a1', accent: '#7dd3fc', surface: '#f0f9ff', ink: '#0c1a2b' },
    hero: 'linear-gradient(105deg, rgba(12,26,43,.86) 0%, rgba(30,58,95,.55) 50%, rgba(125,211,252,.18) 100%)',
    font: 'inherit',
    particles: 'snow',
  },
  spring: {
    id: 'spring',
    name: 'Spring',
    greeting: 'Happy Spring from Saint Louisville',
    tagline: 'New growth, longer days, and gardens waking up.',
    eventsTitle: 'Spring Events',
    eventsEyebrow: 'Spring Has Sprung',
    colors: { primary: '#3f6212', brand: '#be185d', accent: '#fbcfe8', surface: '#fdf7fb', ink: '#1a2e05' },
    hero: 'linear-gradient(105deg, rgba(26,46,5,.82) 0%, rgba(63,98,18,.5) 50%, rgba(244,114,182,.2) 100%)',
    font: 'inherit',
    particles: 'petal',
  },
  summer: {
    id: 'summer',
    name: 'Summer',
    greeting: 'Happy Summer from Saint Louisville',
    tagline: 'Red, white, and blue. Proudly serving since 1837.',
    eventsTitle: 'Summer Fun',
    eventsEyebrow: 'Stars and Stripes',
    colors: { primary: '#1e3a8a', brand: '#b91c1c', accent: '#f87171', surface: '#f8fafc', ink: '#0b1437' },
    hero: 'linear-gradient(105deg, rgba(11,20,55,.86) 0%, rgba(30,58,138,.55) 50%, rgba(185,28,28,.25) 100%)',
    font: 'inherit',
    particles: 'star',
  },
}

const mmdd = (d) => (d.getMonth() + 1) * 100 + d.getDate()

export function seasonForDate(date = new Date()) {
  const n = mmdd(date)
  if (n >= 1001 && n <= 1101) return 'halloween'
  if (n >= 1102 && n <= 1130) return 'thanksgiving'
  if (n >= 1201 && n <= 1226) return 'christmas'
  if (n >= 1227 || n <= 229) return 'winter'
  if (n >= 301 && n <= 524) return 'spring'
  if (n >= 525 && n <= 921) return 'summer'
  return 'autumn'
}

// Last calendar day (inclusive) on which the given season is still active, counting from `from`.
export function seasonEndDate(seasonId, from = new Date()) {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  for (let i = 0; i < 400; i++) {
    const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
    if (seasonForDate(next) !== seasonId) return d
    d.setDate(d.getDate() + 1)
  }
  return d
}

// Build a Tailwind-style 50-950 scale around a base ("600") color.
function hexToHsl(hex) {
  const n = parseInt(hex.slice(1), 16)
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0, s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
  }
  return [h, s * 100, l * 100]
}

function hslToRgb(h, s, l) {
  s /= 100; l /= 100
  const k = (n) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)]
}

const STEP_LIGHTNESS = { 50: 97, 100: 94, 200: 87, 300: 77, 400: 65, 500: 54 }
const STEP_DARKEN = { 700: 8, 800: 16, 900: 24, 950: 32 }

export function buildScale(baseHex) {
  const [h, s, l] = hexToHsl(baseHex)
  const out = {}
  for (const [step, light] of Object.entries(STEP_LIGHTNESS)) out[step] = hslToRgb(h, s, Math.max(light, l + 6))
  out[600] = hslToRgb(h, s, l)
  for (const [step, d] of Object.entries(STEP_DARKEN)) out[step] = hslToRgb(h, s, Math.max(l - d, 6))
  return out
}

export function applyTheme(seasonId) {
  const season = SEASONS[seasonId] || SEASONS.winter
  const root = document.documentElement
  const { colors } = season
  root.style.setProperty('--c-primary', colors.primary)
  root.style.setProperty('--c-brand', colors.brand)
  root.style.setProperty('--c-accent', colors.accent)
  root.style.setProperty('--c-surface', colors.surface)
  root.style.setProperty('--c-ink', colors.ink)
  root.style.setProperty('--font-display', season.font)
  const scale = buildScale(colors.brand)
  for (const [step, rgb] of Object.entries(scale)) root.style.setProperty(`--blue-${step}`, rgb.join(' '))
  root.dataset.season = season.id
}

// ?season=halloween previews a theme for the browser session; ?season=auto clears it.
export function resolveSeasonId() {
  try {
    const q = new URLSearchParams(window.location.search).get('season')
    if (q === 'auto') sessionStorage.removeItem('slv-season')
    else if (q && SEASONS[q]) sessionStorage.setItem('slv-season', q)
    const saved = sessionStorage.getItem('slv-season')
    if (saved && SEASONS[saved]) return saved
  } catch {
    /* storage unavailable */
  }
  return seasonForDate(new Date())
}