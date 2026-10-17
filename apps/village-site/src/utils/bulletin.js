// apps/village-site/src/utils/bulletin.js
// Which bulletin notices the home page shows: unexpired only, urgent then pinned then newest, max 3.
export const MAX_NOTICES = 3

export const localISO = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// A notice with no expiry stays up until it is removed; otherwise it shows through the end of its expiry day.
export const isActive = (item, today = localISO()) =>
  !item.expiresAt || String(item.expiresAt).slice(0, 10) >= today

const rank = (i) => (i.category === 'urgent' ? 2 : i.pinned ? 1 : 0)

export function activeNotices(items, today = localISO()) {
  return (items || [])
    .filter((i) => isActive(i, today))
    .sort((a, b) => rank(b) - rank(a) || String(b.date).localeCompare(String(a.date)))
    .slice(0, MAX_NOTICES)
}