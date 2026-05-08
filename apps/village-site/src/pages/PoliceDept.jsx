// apps/village-site/src/pages/PoliceDept.jsx
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api'

const NAVY  = '#1e3a5f'
const GOLD  = '#fbbf24'
const LABEL = { fontSize: '10px', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#94a3b8' }

// ─── small helpers ────────────────────────────────────────────────────────────
function fmtCourtDate(iso) {
  try {
    const d = new Date(iso)
    return {
      full: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      weekday: d.toLocaleDateString('en-US', { weekday: 'long' }),
    }
  } catch { return { full: iso, weekday: '' } }
}

function fmtEventDay(iso) {
  try { return new Date(iso).getDate() } catch { return '—' }
}
function fmtEventMo(iso) {
  try { return new Date(iso).toLocaleString('en-US', { month: 'short' }).toUpperCase() } catch { return '' }
}

function initials(name = '') {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

// ─── Officer strip ────────────────────────────────────────────────────────────
function ChiefStrip({ officer }) {
  const phone = officer.phoneWork || officer.phone
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', minHeight: 280, background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
      <div style={{ width: '40%', overflow: 'hidden', flexShrink: 0 }}>
        {officer.photoUrl
          ? <img src={officer.photoUrl} alt={officer.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '3rem', fontWeight: 900 }}>{initials(officer.name)}</div>}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '2rem var(--px)' }}>
        <span style={{ ...LABEL, color: NAVY, marginBottom: '1.125rem', display: 'block' }}>{officer.title || 'Chief of Police'}</span>
        <h2 style={{ fontSize: 'clamp(1.25rem, 4vw, 2.5rem)', fontWeight: 900, letterSpacing: '-.03em', marginBottom: '.5rem', color: '#0f172a' }}>{officer.name}</h2>
        {officer.bio && <p style={{ color: '#64748b', fontSize: '.9375rem', lineHeight: 1.85, maxWidth: 460, marginBottom: '1.625rem' }}>{officer.bio}</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem', fontSize: '.875rem' }}>
          {phone && <div style={{ display: 'flex', gap: '1rem' }}><span style={LABEL}>Work</span><span style={{ fontWeight: 600 }}>{phone}</span></div>}
          {officer.email && <div style={{ display: 'flex', gap: '1rem' }}><span style={LABEL}>Email</span><a href={`mailto:${officer.email}`} style={{ color: '#2563eb' }}>{officer.email}</a></div>}
        </div>
      </div>
    </div>
  )
}

function OfficerStrip({ officer, index }) {
  const photoLeft = index % 2 !== 0
  const phone = officer.phoneWork || officer.phone
  const content = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '2rem var(--px)' }}>
      <span style={{ ...LABEL, color: '#64748b', marginBottom: '.875rem', display: 'block' }}>{officer.title || 'Officer'}</span>
      <h2 style={{ fontSize: 'clamp(1.125rem, 3.5vw, 2rem)', fontWeight: 900, letterSpacing: '-.03em', marginBottom: '.5rem', color: '#0f172a' }}>{officer.name}</h2>
      {officer.bio && <p style={{ color: '#64748b', fontSize: '.9375rem', lineHeight: 1.85, maxWidth: 400, marginBottom: '1.25rem' }}>{officer.bio}</p>}
      {phone && <div style={{ fontSize: '.875rem', display: 'flex', gap: '1rem' }}><span style={LABEL}>Work</span><span style={{ fontWeight: 600 }}>{phone}</span></div>}
    </div>
  )
  const photo = (
    <div style={{ width: '35%', overflow: 'hidden', flexShrink: 0 }}>
      {officer.photoUrl
        ? <img src={officer.photoUrl} alt={officer.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ width: '100%', height: '100%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '2rem', fontWeight: 900 }}>{initials(officer.name)}</div>}
    </div>
  )
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', minHeight: 220, background: index % 2 === 0 ? '#fff' : '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
      {photoLeft ? <>{photo}{content}</> : <>{content}{photo}</>}
    </div>
  )
}

// ─── Section nav ──────────────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'officers', label: 'Officers' },
  { id: 'court',    label: "Mayor's Court" },
  { id: 'events',   label: 'PD Events' },
  { id: 'faq',      label: 'FAQ' },
  { id: 'links',    label: 'Links & Resources' },
]

const FALLBACK_LINKS = [
  { id: '1', label: 'Ohio BMV',    title: 'License & Registration', description: 'Ohio Bureau of Motor Vehicles',  url: 'https://www.bmv.ohio.gov' },
  { id: '2', label: 'Knox County', title: "Sheriff's Office",       description: 'County law enforcement',          url: '#' },
  { id: '3', label: 'Ohio State',  title: 'Sex Offender Registry',  description: 'OHLEG public database',           url: 'https://www.icrimewatch.net/ohio.php' },
  { id: '4', label: 'Report',      title: 'Anonymous Tip',          description: '(740) 867-5399 · Confidential',   url: '#' },
]

const FALLBACK_FAQ = [
  { id: 'f1', question: 'How do I pay a traffic citation?', answer: 'Citations can be paid online through the "Pay Now" link below, by mail, or in person at Village Hall during business hours. To contest a citation, request a Mayor\'s Court hearing by calling (740) 867-5309 before the due date on your ticket.' },
  { id: 'f2', question: "What is Mayor's Court?", answer: "Mayor's Court is held at Village Hall on the last Wednesday of each month at 6:00 PM. It handles minor misdemeanors and traffic violations within the village. Sessions are open to the public." },
]

export default function PoliceDept() {
  const [openFaq, setOpenFaq] = useState(null)

  const { data: contactData  } = useQuery({ queryKey: ['pd-contact'],  queryFn: api.pdContact })
  const { data: officialsData} = useQuery({ queryKey: ['officials'],   queryFn: api.officials })
  const { data: courtData    } = useQuery({ queryKey: ['pd-court'],    queryFn: () => api.pdCourtSchedule(true) })
  const { data: eventsData   } = useQuery({ queryKey: ['events'],      queryFn: () => api.events() })
  const { data: faqData      } = useQuery({ queryKey: ['pd-faq'],      queryFn: api.pdFaq })
  const { data: linksData    } = useQuery({ queryKey: ['pd-links'],    queryFn: api.pdLinks })
  const { data: imagesData   } = useQuery({ queryKey: ['pd-images'],   queryFn: api.pdImages })

  const contact  = contactData || {}
  const officers = useMemo(() => (officialsData?.items || []).filter(o => o.department === 'police').sort((a, b) => a.order - b.order), [officialsData])
  const chief    = officers[0]
  const rest     = officers.slice(1)
  const courtDates = (courtData?.items || []).slice(0, 3)
  const pdEvents   = useMemo(() => (eventsData?.items || []).filter(e => e.department === 'police').slice(0, 3), [eventsData])
  const faqs       = faqData?.items?.length ? faqData.items : FALLBACK_FAQ
  const links      = linksData?.items?.length ? linksData.items : FALLBACK_LINKS
  const heroBg     = imagesData?.items?.[0]?.url || 'https://picsum.photos/seed/pd-hero2/1600/700'

  const phone    = contact.phone    || '(740) 867-5309'
  const tipLine  = '(740) 867-5399'

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>

      {/* Hero */}
      <div style={{ position: 'relative', minHeight: 420, display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <img src={heroBg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,.82)' }} />
        </div>
        <div style={{ position: 'relative', zIndex: 1, padding: '3.5rem var(--px) 3rem', width: '100%' }}>
          <p style={{ ...LABEL, color: GOLD, marginBottom: '1rem' }}>Saint Louisville · Ohio</p>
          <h1 style={{ fontSize: '3.25rem', fontWeight: 900, color: '#fff', lineHeight: 1.05, letterSpacing: '-.04em', marginBottom: '1.25rem' }}>Police Department</h1>
          <p style={{ color: '#cbd5e1', fontSize: '.9375rem', lineHeight: 1.8, maxWidth: 380, marginBottom: '2rem' }}>Serving and protecting Saint Louisville with integrity and community partnership.</p>
          <div style={{ display: 'flex', gap: '3rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <p style={{ ...LABEL, color: GOLD, marginBottom: '.25rem' }}>Emergency</p>
              <p style={{ fontSize: '2.25rem', fontWeight: 900, color: '#fff', letterSpacing: '-.02em' }}>911</p>
            </div>
            <div style={{ width: 1, height: '2.5rem', background: 'rgba(255,255,255,.2)' }} />
            <div>
              <p style={{ ...LABEL, color: GOLD, marginBottom: '.25rem' }}>Non-Emergency</p>
              <p style={{ fontSize: '2.25rem', fontWeight: 900, color: '#fff', letterSpacing: '-.02em' }}>{phone}</p>
            </div>
            <div style={{ width: 1, height: '2.5rem', background: 'rgba(255,255,255,.2)' }} />
            <div>
              <p style={{ ...LABEL, color: GOLD, marginBottom: '.25rem' }}>Anonymous Tip</p>
              <p style={{ fontSize: '2.25rem', fontWeight: 900, color: '#fff', letterSpacing: '-.02em' }}>{tipLine}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky sub-nav */}
      <div style={{ position: 'sticky', top: 60, zIndex: 10, display: 'flex', borderBottom: '1px solid #f1f5f9', paddingLeft: 'var(--px)', background: '#fff', overflowX: 'auto' }}>
        {SECTIONS.map(s => (
          <a
            key={s.id}
            href={`#${s.id}`}
            onClick={e => {
              e.preventDefault()
              document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
            style={{
              display: 'block',
              padding: '1rem 1.25rem',
              fontSize: '.875rem',
              fontWeight: 500,
              color: '#64748b',
              borderBottom: '2px solid transparent',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = NAVY }}
            onMouseLeave={e => { e.currentTarget.style.color = '#64748b' }}
          >
            {s.label}
          </a>
        ))}
      </div>

      {/* Officers */}
      <div id="officers" style={{ scrollMarginTop: 110, background: '#fff' }}>
        <div style={{ padding: '2rem var(--px) 1.5rem', borderTop: `4px solid ${NAVY}` }}>
          <p style={LABEL}>Meet the team</p>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-.03em', color: '#0f172a', marginTop: '.5rem' }}>Our Officers</h2>
        </div>
        {chief && <ChiefStrip officer={chief} />}
        {rest.map((o, i) => <OfficerStrip key={o.id} officer={o} index={i} />)}
        {officers.length === 0 && (
          <p style={{ padding: '3rem var(--px)', color: '#94a3b8', fontSize: '.9rem' }}>Officer information coming soon.</p>
        )}
      </div>

      {/* Mayor's Court */}
      <div id="court" style={{ scrollMarginTop: 110, borderTop: `4px solid ${GOLD}` }}>
        {/* Upcoming dates — dark navy band */}
        <div style={{ background: NAVY, padding: '3rem var(--px)' }}>
          <p style={{ ...LABEL, color: GOLD, marginBottom: '.375rem' }}>Scheduled Dates</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', letterSpacing: '-.02em' }}>Mayor's Court</p>
          <p style={{ fontSize: '.875rem', color: '#94a3b8', marginTop: '.375rem', marginBottom: '1.5rem', maxWidth: 540 }}>
            Held at Village Hall. Sessions are open to the public unless otherwise noted. Questions? Call {phone}.
          </p>
          <div style={{ display: 'flex', gap: 0, borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: '1.5rem', flexWrap: 'wrap' }}>
            {(courtDates.length ? courtDates : ['TBD', 'TBD', 'TBD']).map((d, i) => {
              const { full, weekday } = typeof d === 'string' ? { full: 'To Be Scheduled', weekday: '' } : fmtCourtDate(d.date)
              return (
                <div key={i} style={{ flex: 1, minWidth: '200px', borderRight: i < 2 ? '1px solid rgba(255,255,255,.1)' : 'none', paddingRight: i < 2 ? '3rem' : 0, paddingLeft: i > 0 ? '3rem' : 0 }}>
                  <p style={{ fontSize: '1.875rem', fontWeight: 900, color: '#fff', letterSpacing: '-.03em', lineHeight: 1.1, marginBottom: '.375rem' }}>{full}</p>
                  <p style={{ fontSize: '.875rem', color: '#94a3b8' }}>{weekday ? `${weekday} · 6:00 PM · Village Hall` : 'Date TBD'}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* How to Pay */}
        <div style={{ display: 'flex', alignItems: 'stretch', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
          {/* Left — warning + methods */}
          <div style={{ flex: 1, minWidth: '280px', padding: '2rem var(--px)', borderRight: '1px solid #f1f5f9' }}>
            <div style={{ display: 'inline-block', background: '#fef2f2', border: '1px solid #fecaca', padding: '.5rem 1.25rem', marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '.8125rem', fontWeight: 800, color: '#991b1b', letterSpacing: '.04em', textTransform: 'uppercase' }}>
                Payment is due by the court date
              </p>
            </div>
            <p style={{ ...LABEL, marginBottom: '.75rem' }}>Accepted Methods of Payment</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.625rem', marginBottom: '1.75rem' }}>
              {[
                { icon: '💵', label: 'Cash' },
                { icon: '🖊️', label: 'Check — payable to Violations Bureau' },
                { icon: '📮', label: 'Money order — payable to Violations Bureau' },
                { icon: '💳', label: 'Credit card — addl. 3.5% processing fee' },
              ].map(m => (
                <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', fontSize: '.9rem', color: '#374151' }}>
                  <span style={{ fontSize: '1rem' }}>{m.icon}</span>
                  <span>{m.label}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '.8125rem', color: '#94a3b8', fontWeight: 600 }}>
              Office Hours: <span style={{ color: '#374151' }}>Monday 9 AM – 12 PM</span>
            </p>
          </div>

          {/* Right — where to pay */}
          <div style={{ flex: 1, minWidth: '280px', padding: '2rem var(--px)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Mail */}
            <div>
              <p style={{ ...LABEL, marginBottom: '.5rem' }}>Mail payment (check or money order)</p>
              <p style={{ fontSize: '.9375rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.5 }}>
                Violations Bureau<br />P.O. Box 149<br />St. Louisville, OH 43071
              </p>
            </div>
            {/* Drop box */}
            <div>
              <p style={{ ...LABEL, marginBottom: '.5rem' }}>Drop box — no cash</p>
              <p style={{ fontSize: '.9375rem', color: '#374151', lineHeight: 1.6 }}>
                Located next to the main door at<br />
                <span style={{ fontWeight: 700 }}>1 School Street, St. Louisville OH 43071</span>
              </p>
            </div>
            {/* Online */}
            <div>
              <p style={{ ...LABEL, marginBottom: '.5rem' }}>Pay by credit card online</p>
              <a
                href="https://www.ohioticketpayments.com/SaintLouisville/DocketSearch.php"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '.875rem', color: '#2563eb', fontWeight: 600, wordBreak: 'break-all' }}
              >
                ohioticketpayments.com/SaintLouisville/DocketSearch.php
              </a>
              <p style={{ fontSize: '.8125rem', color: '#94a3b8', marginTop: '.25rem' }}>Additional 3.5% processing fee applies</p>
            </div>
          </div>
        </div>
      </div>

      {/* PD Events */}
      <div id="events" style={{ scrollMarginTop: 110, background: '#f1f5f9', borderTop: `4px solid ${NAVY}` }}>
        <div style={{ padding: '2rem var(--px) 1.5rem' }}>
          <p style={LABEL}>Police events</p>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-.03em', color: '#0f172a', marginTop: '.5rem' }}>PD Events &amp; Programs</h2>
        </div>
        {pdEvents.length > 0 ? (
          <div>
            {pdEvents.map((e, i) => {
              const bg = i % 2 === 0 ? '#fff' : '#f8fafc'
              if (e.photoUrl) {
                return (
                  <div key={e.id} className="flex items-stretch border-t" style={{ borderColor: '#f1f5f9', minHeight: 280, background: bg }}>
                    <div style={{ width: '40%', flexShrink: 0, overflow: 'hidden' }}>
                      <img src={e.photoUrl} alt={e.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </div>
                    <div style={{ padding: '2rem 3rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.5rem' }}>
                      <span style={LABEL}>Police Event</span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                        <span style={{ fontSize: '3rem', fontWeight: 900, color: NAVY, lineHeight: 1 }}>{fmtEventDay(e.date)}</span>
                        <span style={{ fontSize: '1rem', fontWeight: 700, color: '#64748b' }}>{fmtEventMo(e.date)}</span>
                      </div>
                      <h3 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>{e.title}</h3>
                      {(e.location || e.time) && (
                        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: '#64748b' }}>
                          {e.location && <span>{e.location}</span>}
                          {e.time && <span>{e.time}</span>}
                        </div>
                      )}
                      {e.description && (
                        <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0, lineHeight: 1.6, WebkitLineClamp: 3, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {e.description}
                        </p>
                      )}
                    </div>
                  </div>
                )
              }
              return (
                <div key={e.id} className="flex items-center border-t" style={{ borderColor: '#f1f5f9', padding: '1.5rem var(--px)', gap: '2rem', background: bg }}>
                  <div style={{ textAlign: 'center', flexShrink: 0, width: 56 }}>
                    <div style={{ fontSize: '3rem', fontWeight: 900, color: NAVY, lineHeight: 1 }}>{fmtEventDay(e.date)}</div>
                    <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#94a3b8' }}>{fmtEventMo(e.date)}</div>
                  </div>
                  <div style={{ width: 1, alignSelf: 'stretch', background: '#e2e8f0', flexShrink: 0 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flexGrow: 1 }}>
                    <span style={LABEL}>Police Event</span>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>{e.title}</h3>
                    {(e.location || e.time) && (
                      <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.875rem', color: '#64748b' }}>
                        {e.location && <span>{e.location}</span>}
                        {e.time && <span>{e.time}</span>}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p style={{ padding: '3rem var(--px)', color: '#94a3b8', fontSize: '.9rem' }}>No upcoming police events.</p>
        )}
      </div>

      {/* FAQ */}
      <div id="faq" style={{ scrollMarginTop: 110, background: '#fff', borderTop: `4px solid ${GOLD}` }}>
        <div style={{ padding: '2rem var(--px) 1.5rem' }}>
          <p style={LABEL}>Common questions</p>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-.03em', color: '#0f172a', marginTop: '.5rem' }}>Frequently Asked Questions</h2>
        </div>
        <div style={{ paddingBottom: '3.5rem' }}>
          {faqs.map(faq => (
            <div key={faq.id} style={{ borderTop: '1px solid #f1f5f9' }}>
              <button
                onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem var(--px)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                <span style={{ fontSize: '.9375rem', fontWeight: 700, color: '#0f172a' }}>{faq.question}</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 300, color: '#94a3b8', flexShrink: 0, marginLeft: '1rem' }}>
                  {openFaq === faq.id ? '−' : '+'}
                </span>
              </button>
              {openFaq === faq.id && (
                <p style={{ padding: '0 var(--px) 1.25rem', fontSize: '.9rem', color: '#64748b', lineHeight: 1.85, maxWidth: 700 }}>
                  {faq.answer}
                </p>
              )}
            </div>
          ))}
          <div style={{ borderTop: '1px solid #f1f5f9' }} />
        </div>
      </div>

      {/* Links & Resources */}
      <div id="links" style={{ scrollMarginTop: 110, background: '#f1f5f9', borderTop: `4px solid ${NAVY}` }}>
        <div style={{ padding: '2rem var(--px) 1.5rem' }}>
          <p style={LABEL}>External</p>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-.03em', color: '#0f172a', marginTop: '.5rem' }}>Links &amp; Resources</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1px', background: '#e2e8f0', margin: '0 var(--px) 2.5rem' }}>
          {links.map((lnk, i) => (
            <a
              key={lnk.id || i}
              href={lnk.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              style={{ padding: '2rem', textDecoration: 'none', display: 'block', background: '#fff' }}
            >
              <p style={{ ...LABEL, color: '#2563eb', marginBottom: '.375rem' }}>{lnk.label}</p>
              <p style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '-.01em', color: '#0f172a' }}>{lnk.title}</p>
              {lnk.description && <p style={{ fontSize: '.8125rem', color: '#94a3b8', marginTop: '.25rem' }}>{lnk.description}</p>}
              <span style={{ display: 'inline-block', marginTop: '.5rem', color: NAVY, fontSize: '.875rem', fontWeight: 700 }}>Visit →</span>
            </a>
          ))}
        </div>
      </div>

    </div>
  )
}
