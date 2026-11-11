// apps/village-site/src/survey/SurveyBanner.jsx
// Site-wide survey banner (top of every page) and the larger promo card for the home page.
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { X, ArrowRight } from 'lucide-react'
import { SURVEY_ID, SURVEY_MODE, isSurveyOpen, deadlineText } from './surveyData'

const DISMISS_KEY = `slv-survey-banner-${SURVEY_ID}`
const DONE_KEY = `slv-survey-done-${SURVEY_ID}`
const DISMISS_DAYS = 3

const read = (k) => { try { return localStorage.getItem(k) } catch { return null } }
const write = (k, v) => { try { localStorage.setItem(k, v) } catch { /* ignore */ } }

function shouldHide() {
  if (!isSurveyOpen()) return true
  if (read(DONE_KEY) === '1') return true
  const t = Number(read(DISMISS_KEY))
  return Boolean(t) && Date.now() - t < DISMISS_DAYS * 86400000
}

export function SurveyBanner() {
  const { pathname } = useLocation()
  const [hidden, setHidden] = useState(shouldHide)
  if (hidden || pathname === '/survey') return null
  const deadline = deadlineText()

  return (
    <div
      role="region"
      aria-label="Community survey"
      style={{ background: 'var(--c-brand)', color: '#fff', padding: '.6rem var(--px)', display: 'flex', alignItems: 'center', gap: '.5rem 1rem', flexWrap: 'wrap', justifyContent: 'center', position: 'relative' }}
    >
      <span aria-hidden="true" style={{ width: 9, height: 9, borderRadius: '50%', background: '#fff', animation: 'slv-pulse 1.8s ease-in-out infinite', flexShrink: 0 }} />
      <span style={{ fontSize: '.9rem', lineHeight: 1.4, textAlign: 'center' }}>
        <strong style={{ fontWeight: 800 }}>Help shape our village.</strong>{' '}
        Take the Community Survey. The quick version takes just 5 minutes{deadline ? `, open through ${deadline}` : ''}.
      </span>
      <Link
        to="/survey"
        style={{ background: '#fff', color: 'var(--c-primary)', fontWeight: 800, fontSize: '.8125rem', letterSpacing: '.04em', padding: '.4rem 1rem', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
      >
        Take the survey <ArrowRight size={14} />
      </Link>
      <button
        type="button"
        aria-label="Hide this banner for a few days"
        onClick={() => { write(DISMISS_KEY, String(Date.now())); setHidden(true) }}
        style={{ position: 'absolute', right: 'max(.5rem, calc(var(--px) / 2 - 12px))', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#fff', opacity: 0.8, cursor: 'pointer', padding: 6, lineHeight: 0 }}
      >
        <X size={18} />
      </button>
    </div>
  )
}

export function SurveyPromo() {
  if (!isSurveyOpen()) return null
  const deadline = deadlineText()
  const options = SURVEY_MODE === 'choice'
    ? [{ v: 'quick', label: 'Quick survey', sub: '5 minutes' }, { v: 'full', label: 'Full survey', sub: '10-15 minutes' }]
    : [{ v: SURVEY_MODE, label: 'Take the survey', sub: SURVEY_MODE === 'quick' ? '5 minutes' : '10-15 minutes' }]

  return (
    <section id="survey" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem) var(--px)', background: 'var(--c-surface)', scrollMarginTop: 96 }}>
      <div
        style={{
          borderRadius: 18, padding: 'clamp(1.5rem, 4vw, 2.5rem)', color: '#fff',
          background: 'linear-gradient(120deg, var(--c-primary) 0%, var(--c-brand) 170%)',
          boxShadow: '0 10px 28px rgba(15,23,42,.18)',
          display: 'flex', flexWrap: 'wrap', gap: '1.5rem 2.5rem', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <div style={{ flex: '1 1 340px', minWidth: 0 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--c-accent)', margin: '0 0 .5rem' }}>
            Your voice matters
          </p>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.1rem)', fontWeight: 900, letterSpacing: '-.02em', lineHeight: 1.15, margin: 0, color: '#fff' }}>
            Help the council decide what comes next
          </h2>
          <p style={{ margin: '.75rem 0 0', color: 'rgba(255,255,255,.88)', lineHeight: 1.6, maxWidth: 560 }}>
            Tell us what matters most to you: streets, parks, budget, and more. It is anonymous, every question is optional,
            and the quick version takes about 5 minutes.{deadline ? ` Please respond by ${deadline}.` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.75rem' }}>
          {options.map((o, i) => (
            <Link
              key={o.v}
              to={`/survey?v=${o.v}`}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '.85rem 1.6rem', borderRadius: 12, minWidth: 150, textAlign: 'center',
                background: i === 0 ? '#fff' : 'transparent', color: i === 0 ? 'var(--c-primary)' : '#fff',
                border: i === 0 ? '2px solid #fff' : '2px solid rgba(255,255,255,.7)',
              }}
            >
              <span style={{ fontWeight: 800, fontSize: '1rem' }}>{o.label}</span>
              <span style={{ fontSize: '.8125rem', opacity: 0.85 }}>{o.sub}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}