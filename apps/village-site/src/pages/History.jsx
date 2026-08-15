// apps/village-site/src/pages/History.jsx  (Fun Stuff page)
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api'

const BASE = import.meta.env.VITE_API_BASE_URL || 'https://func-village-prod.azurewebsites.net'

const LABEL = { fontSize: '10px', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#94a3b8' }
const BLUE  = '#1e3a5f'
const GOLD  = '#f59e0b'

// ── Data helpers ──────────────────────────────────────────────────────────────

function parseHistoryData(raw) {
  try {
    const parsed = JSON.parse(raw || '{}')
    if (Array.isArray(parsed.sections)) return parsed
  } catch {}
  return {
    pageTitle: 'Fun Stuff',
    sections: [
      {
        id: 's-default-1', type: 'era',
        title: 'Founded on the frontier', subtitle: 'Early History · 1837–1880',
        body: raw || 'Saint Louisville was platted in 1837 along the eastern Ohio frontier.',
        body2: 'By 1860 the village had its own constable, a small tavern, and regular mail service.',
        mainPhotoUrl: '', galleryPhotos: [], enabled: true, order: 0, photoSide: 'left',
      },
    ],
  }
}

// ── Era section ───────────────────────────────────────────────────────────────

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
      <h2 style={{ fontSize: 'clamp(1.75rem,5vw,2.25rem)', fontWeight: 900, letterSpacing: '-.03em', marginBottom: '1rem', color: '#0f172a' }}>{section.title}</h2>
      {section.body  && <p style={{ color: '#374151', fontSize: '.9375rem', lineHeight: 1.9, maxWidth: 440, marginBottom: '1rem' }}>{section.body}</p>}
      {section.body2 && <p style={{ color: '#64748b', fontSize: '.9375rem', lineHeight: 1.9, maxWidth: 440 }}>{section.body2}</p>}
    </div>
  )
  const photoBlock = (
    <div style={{ width: 'min(46%,100%)', overflow: 'hidden', flexShrink: 0 }}>
      {section.mainPhotoUrl
        ? <img src={section.mainPhotoUrl} alt={section.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#1e3a5f 0%,#0f172a 100%)', minHeight: 300 }} />}
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

// ── Poll section ──────────────────────────────────────────────────────────────

function readVoteState(pollId) {
  try {
    const raw = localStorage.getItem(`poll-vote-${pollId}`) || localStorage.getItem(`poll-voted-${pollId}`)
    if (!raw) return { voted: null, voteId: null }
    try {
      const p = JSON.parse(raw)
      if (p && typeof p === 'object') return { voted: p.opted ?? null, voteId: p.voteId ?? null }
    } catch {}
    return { voted: raw, voteId: null }  // legacy plain-string format
  } catch { return { voted: null, voteId: null } }
}

function PollSection({ section }) {
  const storageKey = `poll-vote-${section.id}`
  const init = readVoteState(section.id)
  const [voted, setVoted]             = useState(init.voted)
  const [voteId, setVoteId]           = useState(init.voteId)
  const [results, setResults]         = useState(null)
  const [loadingResults, setLoadingResults] = useState(true)
  const [submitting, setSubmitting]   = useState(false)
  const [undoing, setUndoing]         = useState(false)
  const [customText, setCustomText]   = useState('')
  const [name, setName]               = useState('')
  const [isPublic, setIsPublic]       = useState(true)

  const options = section.options || []
  const total   = results ? results.total : 0

  function fetchResults() {
    return fetch(`${BASE}/api/poll-responses?pollId=${section.id}`)
      .then(r => r.json())
      .then(d => setResults(d))
      .catch(() => setResults(null))
  }

  useEffect(() => {
    setLoadingResults(true)
    fetchResults().finally(() => setLoadingResults(false))
  }, [section.id])

  async function handleOptionVote(idx) {
    if (voted || submitting) return
    setSubmitting(true)
    try {
      const res = await api.submitPollVote({ pollId: section.id, optionIndex: idx, isPublic: false })
      const data = await res.json()
      const newVoteId = data.id ?? null
      localStorage.setItem(storageKey, JSON.stringify({ opted: String(idx), voteId: newVoteId }))
      setVoted(String(idx))
      setVoteId(newVoteId)
      await fetchResults()
    } catch {}
    setSubmitting(false)
  }

  async function handleCustomSubmit(e) {
    e.preventDefault()
    if (!customText.trim() || voted || submitting) return
    setSubmitting(true)
    try {
      const res = await api.submitPollVote({
        pollId: section.id, optionIndex: -1,
        customAnswer: customText.trim(), name: name.trim() || null, isPublic,
      })
      const data = await res.json()
      const newVoteId = data.id ?? null
      localStorage.setItem(storageKey, JSON.stringify({ opted: 'custom', voteId: newVoteId }))
      setVoted('custom')
      setVoteId(newVoteId)
      await fetchResults()
    } catch {}
    setSubmitting(false)
  }

  async function handleChangeVote() {
    if (undoing) return
    setUndoing(true)
    try {
      if (voteId) {
        await fetch(`${BASE}/api/poll-responses?id=${voteId}&pollId=${section.id}`, { method: 'DELETE' })
      }
      localStorage.removeItem(storageKey)
      localStorage.removeItem(`poll-voted-${section.id}`)  // clear legacy key too
      setVoted(null)
      setVoteId(null)
      setCustomText('')
      await fetchResults()
    } catch {}
    setUndoing(false)
  }

  const votedIdx = voted !== null && voted !== 'custom' ? parseInt(voted) : null

  const optionVoteTotal = options.reduce((sum, _, i) => sum + (results?.voteCounts?.[i] ?? 0), 0)
  const customCount = Math.max(0, total - optionVoteTotal)

  return (
    <div style={{ borderTop: '1px solid #f1f5f9', background: '#fff', padding: '3.5rem var(--px)' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        {/* Optional banner photo — full-width above question */}
        {section.photoUrl && (
          <div style={{ marginBottom: '2rem', borderRadius: 12, overflow: 'hidden', maxHeight: 320 }}>
            <img src={section.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        )}

        {/* Label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' }}>
          <div style={{ ...LABEL, color: GOLD }}>Community Poll</div>
          {total > 0 && !loadingResults && (
            <span style={{ ...LABEL, color: '#94a3b8' }}>· {total} {total === 1 ? 'response' : 'responses'}</span>
          )}
        </div>

        {/* Question */}
        <h2 style={{ fontSize: 'clamp(1.25rem,3vw,1.75rem)', fontWeight: 900, letterSpacing: '-.03em', color: '#0f172a', marginBottom: '1.5rem', lineHeight: 1.2 }}>
          {section.question || 'What do you think?'}
        </h2>

        {/* Options */}
        {!voted ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleOptionVote(i)}
                disabled={submitting}
                style={{
                  textAlign: 'left', padding: '0.75rem 1.125rem',
                  border: `2px solid #e2e8f0`, borderRadius: 8, background: '#fff',
                  fontSize: '0.9375rem', fontWeight: 600, color: '#1e293b',
                  cursor: submitting ? 'wait' : 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = BLUE; e.currentTarget.style.background = '#f0f4ff' }}
                onMouseOut={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#fff' }}
              >
                {opt}
              </button>
            ))}
          </div>
        ) : (
          /* Results */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {options.map((opt, i) => {
              const count    = results?.voteCounts?.[i] ?? 0
              const pct      = total > 0 ? Math.round((count / total) * 100) : 0
              const isMyVote = votedIdx === i
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: isMyVote ? 700 : 500, color: isMyVote ? BLUE : '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {isMyVote && <span style={{ color: GOLD }}>✓</span>}
                      {opt}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>{pct}% ({count})</span>
                  </div>
                  <div style={{ height: 8, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: isMyVote ? BLUE : '#94a3b8', borderRadius: 99, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              )
            })}

            {/* Custom / written answer count row */}
            {section.allowCustom && customCount > 0 && (
              <div style={{ marginTop: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: voted === 'custom' ? 700 : 500, color: voted === 'custom' ? BLUE : '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {voted === 'custom' && <span style={{ color: GOLD }}>✓</span>}
                    Written responses
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                    {total > 0 ? Math.round((customCount / total) * 100) : 0}% ({customCount})
                  </span>
                </div>
                <div style={{ height: 8, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${total > 0 ? Math.round((customCount / total) * 100) : 0}%`, background: voted === 'custom' ? BLUE : '#94a3b8', borderRadius: 99, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            )}

            {voted === 'custom' && (
              <p style={{ fontSize: '0.875rem', color: '#64748b', fontStyle: 'italic', marginTop: 4 }}>
                Thanks for sharing your thoughts!
              </p>
            )}

            {/* Undo vote */}
            <button
              onClick={handleChangeVote}
              disabled={undoing}
              style={{ marginTop: 14, background: 'none', border: 'none', padding: 0, fontSize: '0.8rem', color: '#94a3b8', cursor: undoing ? 'wait' : 'pointer', textDecoration: 'underline' }}
            >
              {undoing ? 'Removing…' : '← Change my answer'}
            </button>
          </div>
        )}

            {/* Custom answer section */}
            {section.allowCustom && !voted && (
              <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px dashed #e2e8f0' }}>
                <p style={{ ...LABEL, color: '#64748b', marginBottom: '0.75rem' }}>Or, share your own thoughts</p>
                <form onSubmit={handleCustomSubmit}>
                  <textarea
                    value={customText}
                    onChange={e => setCustomText(e.target.value)}
                    placeholder="Type your response here…"
                    maxLength={500}
                    rows={3}
                    style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', lineHeight: 1.6, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = BLUE}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                  <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Your name (optional)"
                      maxLength={100}
                      style={{ flex: 1, minWidth: 140, padding: '0.5rem 0.75rem', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '0.875rem', outline: 'none' }}
                      onFocus={e => e.target.style.borderColor = BLUE}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: '#475569', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} style={{ accentColor: BLUE }} />
                      Share publicly on site
                    </label>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 8, lineHeight: 1.5 }}>
                    Please keep responses kind and considerate — this is a community space for all ages. 💛
                  </p>
                  <button
                    type="submit"
                    disabled={!customText.trim() || submitting}
                    style={{
                      marginTop: 10, padding: '0.625rem 1.25rem', background: BLUE, color: '#fff',
                      border: 'none', borderRadius: 8, fontSize: '0.875rem', fontWeight: 700,
                      cursor: !customText.trim() || submitting ? 'not-allowed' : 'pointer',
                      opacity: !customText.trim() || submitting ? 0.5 : 1,
                    }}
                  >
                    {submitting ? 'Submitting…' : 'Submit my answer'}
                  </button>
                </form>
              </div>
            )}

            {/* Public custom responses */}
            {results?.publicCustom?.length > 0 && (
              <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
                <p style={{ ...LABEL, color: '#64748b', marginBottom: '0.875rem' }}>Community responses</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {results.publicCustom.map((r, i) => (
                    <div key={i} style={{ padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: 8, borderLeft: `3px solid ${GOLD}` }}>
                      <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.6, margin: 0 }}>"{r.text}"</p>
                      <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '4px 0 0', fontWeight: 600 }}>— {r.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
      </div>
    </div>
  )
}

// ── Site Counter ──────────────────────────────────────────────────────────────

function SiteCounter() {
  const [count, setCount] = useState(null)

  useEffect(() => {
    fetch(`${BASE}/api/visit-counter?page=fun-stuff`, { method: 'POST' })
      .then(r => r.json())
      .then(d => setCount(d.count))
      .catch(() => setCount(null))
  }, [])

  const digits = count !== null ? String(count).padStart(7, '0') : '0000000'

  return (
    <div style={{ padding: '3rem var(--px) 4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, borderTop: '1px solid #f1f5f9' }}>
      {/* Win95-style raised widget */}
      <div style={{
        display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        padding: '14px 22px 12px',
        background: '#c0c0c0',
        border: '2px solid',
        borderColor: '#ffffff #808080 #808080 #ffffff',
        boxShadow: '2px 2px 0 #000',
        userSelect: 'none',
      }}>
        {/* Title bar */}
        <div style={{
          width: '100%', background: '#000080', color: '#fff',
          fontFamily: '"Arial", sans-serif', fontSize: '11px', fontWeight: 700,
          padding: '2px 6px', letterSpacing: '0.02em',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span>🏰</span>
          <span>Ye Olde Site Counter v1.0</span>
        </div>

        {/* LED digit display */}
        <div style={{
          background: '#000', border: '2px solid', borderColor: '#808080 #ffffff #ffffff #808080',
          padding: '6px 10px', display: 'flex', gap: 3, alignItems: 'center',
        }}>
          {digits.split('').map((d, i) => (
            <span key={i} style={{
              display: 'inline-block', width: 20, textAlign: 'center',
              fontFamily: '"Courier New", Courier, monospace',
              fontSize: '28px', fontWeight: 'bold', lineHeight: 1.15,
              color: count !== null ? '#00ff41' : '#004400',
              textShadow: count !== null ? '0 0 10px #00ff41, 0 0 20px #00aa22' : 'none',
              transition: 'color 0.5s, text-shadow 0.5s',
            }}>{d}</span>
          ))}
        </div>

        {/* Footer label */}
        <div style={{
          fontFamily: '"Arial", sans-serif', fontSize: '10px', color: '#444',
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          visitors since MMXXVI
        </div>
      </div>
      <p style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>
        Best viewed in Internet Explorer 6 at 800×600
      </p>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function History() {
  const { data: historyData } = useQuery({ queryKey: ['history'], queryFn: api.history, staleTime: 3 * 60 * 1000 })
  const { pageTitle, sections } = parseHistoryData(historyData?.text)
  const activeSections = sections.filter(s => s.enabled !== false).sort((a, b) => a.order - b.order)

  // Separate era sections from poll sections for the "between" layout
  // Era sections render first, then polls, preserving order within each type
  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      {/* Heading */}
      <div style={{ position: 'relative', padding: '5rem var(--px) 4rem', overflow: 'hidden', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ position: 'absolute', right: '3rem', top: '50%', transform: 'translateY(-50%)', fontSize: '16rem', fontWeight: 900, color: '#f1f5f9', lineHeight: 1, pointerEvents: 'none', userSelect: 'none', letterSpacing: '-.06em' }}>
          SL
        </div>
        <p style={{ ...LABEL, marginBottom: '.875rem', position: 'relative' }}>Saint Louisville, Ohio · Village of Licking County</p>
        <h1 style={{ fontSize: 'clamp(1.75rem,5vw,3.75rem)', fontWeight: 900, letterSpacing: '-.04em', lineHeight: 1.05, maxWidth: 560, position: 'relative', color: '#0f172a' }}>
          {pageTitle || 'Fun Stuff'}
        </h1>
        <p style={{ fontSize: '1rem', color: '#64748b', lineHeight: 1.875, maxWidth: 540, marginTop: '1.125rem', position: 'relative' }}>
          History, community polls, and local photos from Saint Louisville.
        </p>
      </div>

      {/* Sections — rendered in order */}
      {activeSections.map((section, i) => {
        const type = section.type || 'era'
        if (type === 'poll') return <PollSection key={section.id} section={section} />
        return <EraSection key={section.id} section={section} index={i} />
      })}

      <SiteCounter />
    </div>
  )
}
