// apps/village-site/src/api.js
const BASE = ''  // Vite proxy handles /api/* → Azure Functions

async function get(path) {
  const r = await fetch(`/api/${path}`)
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
