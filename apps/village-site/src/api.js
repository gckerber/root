// apps/village-site/src/api.js
// In dev: Vite proxy forwards /api/* → Azure Functions (see vite.config.js)
// In prod: VITE_API_BASE_URL is set at build time to the full Functions host
const BASE = import.meta.env.VITE_API_BASE_URL || ''

async function get(path) {
  const r = await fetch(`${BASE}/api/${path}`)
  if (!r.ok) throw new Error(`API ${path} failed: ${r.status}`)
  return r.json()
}

export const api = {
  bulletin: (qs = '')        => get(`bulletin${qs}`),
  events:   (qs = '')        => get(`events${qs}`),
  minutes:  (qs = '')        => get(`minutes${qs}`),
  officials:()               => get('officials'),
  ordinances:(qs = '')       => get(`ordinances${qs}`),
  photos:   ()               => get('photos'),
  villageImages:()           => get('village-images'),
  history:  ()               => get('history'),
  pdCourtSchedule:(upcoming=true) => get(`pd-court-schedule${upcoming ? '?upcoming=true' : ''}`),
  pdContact:()               => get('pd-contact'),
  pdFaq:    ()               => get('pd-faq'),
  pdImages: ()               => get('pd-images'),
  pdLinks:  ()               => get('pd-links'),
}
