// apps/village-site/src/pages/Survey.jsx
// Community survey: pick a version, answer, submit. Responses are saved and emailed by the API.
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Clock, ListChecks, ShieldCheck, ArrowLeft, Check } from 'lucide-react'
import { api } from '../api'
import {
  SURVEYS, SURVEY_ID, SURVEY_MODE, CONFIRMATION, RATING_LEGEND,
  questionCount, isSurveyOpen, deadlineText,
} from '../survey/surveyData'

// ─── Browser storage (can be blocked in private mode, so never assume it works) ──
const store = {
  get: (k) => { try { return localStorage.getItem(k) } catch { return null } },
  set: (k, v) => { try { localStorage.setItem(k, v) } catch { /* ignore */ } },
  del: (k) => { try { localStorage.removeItem(k) } catch { /* ignore */ } },
}
export const DONE_KEY = `slv-survey-done-${SURVEY_ID}`
const draftKey = (v) => `slv-survey-draft-${SURVEY_ID}-${v}`

const allQuestions = (survey) => survey.sections.flatMap((s) => s.questions)
const OTHER = '__other'

function isAnswered(q, a) {
  const v = a[q.id]
  switch (q.type) {
    case 'single':
    case 'scale': return Boolean(v)
    case 'multi': return (v || []).some((x) => x !== OTHER || (a[`${q.id}:other`] || '').trim())
    case 'grid': return Object.keys(v || {}).length > 0
    default: return Boolean((v || '').trim())
  }
}

function buildAnswers(survey, a) {
  const out = []
  for (const q of allQuestions(survey)) {
    if (!isAnswered(q, a)) continue
    const base = { id: q.id, q: q.q, type: q.type }
    if (q.type === 'single') out.push({ ...base, text: a[q.id] })
    else if (q.type === 'scale') out.push({ ...base, rating: a[q.id] })
    else if (q.type === 'text') out.push({ ...base, text: a[q.id].trim() })
    else if (q.type === 'grid') {
      out.push({ ...base, ratings: q.items.filter((it) => a[q.id][it]).map((it) => ({ item: it, score: a[q.id][it] })) })
    } else if (q.type === 'multi') {
      const choices = a[q.id].filter((x) => x !== OTHER)
      const other = (a[`${q.id}:other`] || '').trim()
      if (a[q.id].includes(OTHER) && other) choices.push(`Other: ${other}`)
      out.push({ ...base, choices })
    }
  }
  return out
}

// ─── Small UI pieces ─────────────────────────────────────────────────────────
function Card({ children, style }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 'clamp(1.1rem, 3vw, 1.6rem)', ...style }}>
      {children}
    </div>
  )
}

function Pill({ icon: Icon, children }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '.8125rem', fontWeight: 600, color: 'var(--c-primary)', background: 'var(--c-surface)', border: '1px solid #e2e8f0', borderRadius: 999, padding: '4px 12px' }}>
      <Icon size={14} /> {children}
    </span>
  )
}

function Shell({ title, subtitle, children }) {
  return (
    <div>
      <div style={{ background: 'linear-gradient(120deg, var(--c-primary) 0%, var(--c-brand) 160%)', padding: 'clamp(2rem, 5vw, 3.5rem) var(--px)' }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--c-accent)', marginBottom: '.6rem' }}>
          Village of Saint Louisville
        </p>
        <h1 style={{ fontSize: 'clamp(1.9rem, 5vw, 3rem)', fontWeight: 900, color: '#fff', lineHeight: 1.1, letterSpacing: '-.02em', margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ color: 'rgba(255,255,255,.85)', fontSize: '1.05rem', margin: '.75rem 0 0', maxWidth: 640, lineHeight: 1.55 }}>{subtitle}</p>}
      </div>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: 'clamp(1.25rem, 3vw, 2.25rem) var(--px-sm, 1.25rem) 3rem' }}>{children}</div>
    </div>
  )
}

// ─── Question inputs ─────────────────────────────────────────────────────────
function Choice({ type, name, checked, disabled, onChange, children }) {
  return (
    <label className="slv-opt" data-on={checked} style={disabled ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}>
      <input type={type} name={name} checked={checked} disabled={disabled} onChange={onChange} />
      <span style={{ lineHeight: 1.45 }}>{children}</span>
    </label>
  )
}

function SingleChoice({ q, value, onChange }) {
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {q.options.map((opt) => (
        <Choice key={opt} type="radio" name={q.id} checked={value === opt} onChange={() => onChange(opt)}>{opt}</Choice>
      ))}
      {value && (
        <button type="button" onClick={() => onChange('')} style={{ justifySelf: 'start', background: 'none', border: 'none', color: '#64748b', fontSize: '.8125rem', textDecoration: 'underline', cursor: 'pointer' }}>
          Clear my answer
        </button>
      )}
    </div>
  )
}

function MultiChoice({ q, value = [], other, onChange, onOther }) {
  const count = value.length
  const atMax = q.max && count >= q.max
  const toggle = (opt) => onChange(value.includes(opt) ? value.filter((x) => x !== opt) : [...value, opt])
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {q.max && (
        <p style={{ margin: 0, fontSize: '.8125rem', color: count >= q.max ? 'var(--c-brand)' : '#64748b', fontWeight: 600 }}>
          {count} of {q.max} selected
        </p>
      )}
      {q.options.map((opt) => (
        <Choice key={opt} type="checkbox" name={q.id} checked={value.includes(opt)} disabled={!value.includes(opt) && atMax} onChange={() => toggle(opt)}>{opt}</Choice>
      ))}
      {q.other && (
        <div className="slv-opt" data-on={value.includes(OTHER)} style={!value.includes(OTHER) && atMax ? { opacity: 0.5 } : undefined}>
          <input
            type="checkbox"
            aria-label="Other"
            checked={value.includes(OTHER)}
            disabled={!value.includes(OTHER) && atMax}
            onChange={() => toggle(OTHER)}
          />
          <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            Other:
            <input
              type="text"
              value={other || ''}
              maxLength={150}
              placeholder="Write your own"
              disabled={!value.includes(OTHER) && atMax}
              onFocus={() => { if (!value.includes(OTHER) && !atMax) onChange([...value, OTHER]) }}
              onChange={(e) => {
                onOther(e.target.value)
                if (e.target.value.trim() && !value.includes(OTHER) && !atMax) onChange([...value, OTHER])
              }}
              style={{ flex: '1 1 180px', minWidth: 0, border: '1px solid #cbd5e1', borderRadius: 8, padding: '6px 10px', fontSize: '.9rem' }}
            />
          </span>
        </div>
      )}
    </div>
  )
}

function RatingButtons({ name, label, value, onChange }) {
  return (
    <div role="radiogroup" aria-label={label} style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <label key={n} className="slv-rate" title={`${n} of 5${RATING_LEGEND[n - 1] ? `: ${RATING_LEGEND[n - 1]}` : ''}`}>
          <input type="radio" name={name} value={n} checked={value === n} onChange={() => onChange(n)} aria-label={`${n} of 5`} />
          <span>{n}</span>
        </label>
      ))}
    </div>
  )
}

function Grid({ q, value = {}, onChange }) {
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', marginBottom: 10, fontSize: '.75rem', color: '#64748b' }}>
        {RATING_LEGEND.map((l, i) => (
          <span key={l}><strong style={{ color: 'var(--c-primary)' }}>{i + 1}</strong> {l}</span>
        ))}
      </div>
      <div>
        {q.items.map((item) => (
          <div key={item} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px 16px', padding: '10px 0', borderTop: '1px solid #f1f5f9' }}>
            <span style={{ flex: '1 1 240px', fontSize: '.95rem', lineHeight: 1.4 }}>{item}</span>
            <RatingButtons name={`${q.id}-${item}`} label={item} value={value[item]} onChange={(n) => onChange({ ...value, [item]: n })} />
          </div>
        ))}
      </div>
    </div>
  )
}

function Scale({ q, value, onChange }) {
  return (
    <div>
      <RatingButtons name={q.id} label={q.q} value={value} onChange={onChange} />
      <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 290, marginTop: 6, fontSize: '.75rem', color: '#64748b' }}>
        <span>1 = {q.low}</span>
        <span>5 = {q.high}</span>
      </div>
    </div>
  )
}

function TextAnswer({ q, value = '', onChange }) {
  const shared = { value, onChange: (e) => onChange(e.target.value), style: { width: '100%', border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px', fontSize: '1rem', fontFamily: 'inherit', lineHeight: 1.5 } }
  return q.short
    ? <input type="text" maxLength={200} placeholder="Name and phone or email" aria-label={q.q} {...shared} />
    : <textarea rows={4} maxLength={2000} aria-label={q.q} placeholder="Type your answer here" {...shared} />
}

function Question({ q, number, answers, set }) {
  return (
    <Card>
      <fieldset style={{ border: 'none', padding: 0, margin: 0, minWidth: 0 }}>
        <legend style={{ padding: 0, marginBottom: 12, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}>
          <span style={{ color: 'var(--c-brand)', marginRight: 6 }}>{number}.</span>{q.q}
        </legend>
        {q.type === 'single' && <SingleChoice q={q} value={answers[q.id]} onChange={(v) => set(q.id, v)} />}
        {q.type === 'multi' && <MultiChoice q={q} value={answers[q.id]} other={answers[`${q.id}:other`]} onChange={(v) => set(q.id, v)} onOther={(v) => set(`${q.id}:other`, v)} />}
        {q.type === 'grid' && <Grid q={q} value={answers[q.id]} onChange={(v) => set(q.id, v)} />}
        {q.type === 'scale' && <Scale q={q} value={answers[q.id]} onChange={(v) => set(q.id, v)} />}
        {q.type === 'text' && <TextAnswer q={q} value={answers[q.id]} onChange={(v) => set(q.id, v)} />}
      </fieldset>
    </Card>
  )
}

// ─── Screens ─────────────────────────────────────────────────────────────────
function Chooser({ onPick }) {
  const deadline = deadlineText()
  return (
    <Shell title="Community Survey" subtitle="The Village Council wants to hear from you. Tell us what matters most so we can decide where to focus the village's time and money.">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
        <Pill icon={ShieldCheck}>Anonymous</Pill>
        <Pill icon={ListChecks}>Every question is optional</Pill>
        {deadline && <Pill icon={Clock}>Please respond by {deadline}</Pill>}
      </div>
      <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '0 0 14px' }}>Choose your survey</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        {[
          { v: 'quick', blurb: 'A quick read on what matters most. Perfect if you only have a few minutes.' },
          { v: 'full', blurb: 'Rate every priority in detail. Best if you want to weigh in on everything.' },
        ].map(({ v, blurb }) => (
          <Card key={v} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--c-primary)', fontFamily: 'var(--font-display)' }}>{SURVEYS[v].label}</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <Pill icon={Clock}>{SURVEYS[v].time}</Pill>
              <Pill icon={ListChecks}>{questionCount(SURVEYS[v])} questions</Pill>
            </div>
            <p style={{ margin: 0, color: '#64748b', lineHeight: 1.55, flex: 1 }}>{blurb}</p>
            <button
              type="button"
              onClick={() => onPick(v)}
              style={{ background: 'var(--c-brand)', color: '#fff', fontWeight: 800, border: 'none', borderRadius: 10, padding: '.8rem 1.2rem', fontSize: '.9rem', cursor: 'pointer', letterSpacing: '.03em' }}
            >
              Start the {v} survey
            </button>
          </Card>
        ))}
      </div>
    </Shell>
  )
}

function Message({ title, children }) {
  return (
    <Shell title={title}>
      <Card><div style={{ fontSize: '1.05rem', lineHeight: 1.65, color: '#334155' }}>{children}</div></Card>
    </Shell>
  )
}

const linkBtn = { display: 'inline-block', background: 'var(--c-brand)', color: '#fff', fontWeight: 800, padding: '.75rem 1.4rem', borderRadius: 10, fontSize: '.9rem' }

function ThankYou() {
  return (
    <Shell title="Thank you!">
      <Card style={{ textAlign: 'center', padding: 'clamp(1.75rem, 5vw, 3rem)' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--c-brand)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
          <Check size={34} strokeWidth={3} />
        </div>
        <p style={{ fontSize: '1.15rem', lineHeight: 1.6, color: '#0f172a', margin: '0 0 1.5rem' }}>{CONFIRMATION}</p>
        <Link to="/" style={linkBtn}>Back to the village site</Link>
      </Card>
    </Shell>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function Survey() {
  const [params] = useSearchParams()
  const fromLink = params.get('v')
  const startVersion = SURVEY_MODE !== 'choice' ? SURVEY_MODE : (SURVEYS[fromLink] ? fromLink : null)

  const [version, setVersion] = useState(startVersion)
  const [answers, setAnswers] = useState({})
  const [loadedVersion, setLoadedVersion] = useState(null)
  const [restored, setRestored] = useState(false)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [website, setWebsite] = useState('')
  const [alreadyDone, setAlreadyDone] = useState(() => store.get(DONE_KEY) === '1')

  const survey = version ? SURVEYS[version] : null
  const questions = useMemo(() => (survey ? allQuestions(survey) : []), [survey])
  const answered = questions.filter((q) => isAnswered(q, answers)).length

  // Load any saved draft when a version is opened
  useEffect(() => {
    if (!version) return
    let draft = null
    try { draft = JSON.parse(store.get(draftKey(version)) || 'null') } catch { draft = null }
    setAnswers(draft && typeof draft === 'object' ? draft : {})
    setRestored(Boolean(draft && Object.keys(draft).length))
    setLoadedVersion(version)
    window.scrollTo({ top: 0 })
  }, [version])

  // Save the draft as people go, so a closed tab doesn't lose their work
  useEffect(() => {
    if (!version || loadedVersion !== version || status === 'done') return
    if (Object.keys(answers).length) store.set(draftKey(version), JSON.stringify(answers))
    else store.del(draftKey(version))
  }, [answers, version, loadedVersion, status])

  const set = (id, value) => setAnswers((prev) => ({ ...prev, [id]: value }))

  async function submit(e) {
    e.preventDefault()
    const payload = buildAnswers(survey, answers)
    if (!payload.length) {
      setError('Please answer at least one question before submitting.')
      return
    }
    setStatus('sending')
    setError('')
    try {
      const res = await api.submitSurvey({ surveyId: SURVEY_ID, version, answers: payload, website })
      if (!res.ok) {
        let msg = 'We could not send your answers. Please try again in a moment.'
        try { const j = await res.json(); if (j?.message) msg = j.message } catch { /* keep default */ }
        throw new Error(msg)
      }
      store.set(DONE_KEY, '1')
      store.del(draftKey('full'))
      store.del(draftKey('quick'))
      setStatus('done')
      window.scrollTo({ top: 0 })
    } catch (err) {
      setStatus('idle')
      setError(err instanceof TypeError
        ? 'We could not reach the server. Your answers are saved on this device. Please check your connection and try again.'
        : err.message)
    }
  }

  if (!isSurveyOpen()) {
    return <Message title="This survey has closed">Thank you to everyone who shared their thoughts. Results will be shared at an upcoming council meeting.</Message>
  }
  if (status === 'done') return <ThankYou />

  if (alreadyDone && !version) {
    return (
      <Shell title="Thanks for taking the survey!">
        <Card>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.65, color: '#334155', marginTop: 0 }}>
            It looks like someone has already completed the survey on this device. Thank you!
          </p>
          <p style={{ color: '#64748b', lineHeight: 1.6 }}>
            If someone else in your household would like to share their own answers, they are welcome to.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 18 }}>
            <button type="button" onClick={() => setAlreadyDone(false)} style={{ ...linkBtn, border: 'none', cursor: 'pointer' }}>
              Someone else is taking it
            </button>
            <Link to="/" style={{ ...linkBtn, background: '#fff', color: 'var(--c-primary)', border: '2px solid #e2e8f0' }}>Back to the site</Link>
          </div>
        </Card>
      </Shell>
    )
  }

  if (!survey) return <Chooser onPick={setVersion} />

  const deadline = deadlineText()
  let n = 0
  return (
    <Shell title={survey.title}>
      {SURVEY_MODE === 'choice' && (
        <button type="button" onClick={() => { setVersion(null); setLoadedVersion(null) }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--c-primary)', fontWeight: 700, cursor: 'pointer', padding: 0, marginBottom: 14 }}>
          <ArrowLeft size={16} /> Choose a different survey
        </button>
      )}
      <p style={{ fontSize: '1.05rem', lineHeight: 1.65, color: '#334155', margin: '0 0 14px' }}>
        {survey.description} Your answers are anonymous, and every question is optional.{deadline ? ` Please respond by ${deadline}.` : ''}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        <Pill icon={Clock}>{survey.time}</Pill>
        <Pill icon={ListChecks}>{questions.length} questions</Pill>
        <Pill icon={ShieldCheck}>Anonymous</Pill>
      </div>
      {restored && (
        <div role="status" style={{ background: 'var(--c-surface)', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', marginBottom: 18, fontSize: '.9rem', color: '#334155', display: 'flex', flexWrap: 'wrap', gap: '6px 14px', alignItems: 'center' }}>
          We restored the answers you started earlier on this device.
          <button type="button" onClick={() => { setAnswers({}); setRestored(false) }} style={{ background: 'none', border: 'none', color: 'var(--c-brand)', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', padding: 0 }}>
            Start over
          </button>
        </div>
      )}

      <form onSubmit={submit} noValidate>
        {/* Honeypot: hidden from people, tempting to bots */}
        <input
          type="text" name="slv-ref-code" tabIndex={-1} autoComplete="off" aria-hidden="true"
          value={website} onChange={(e) => setWebsite(e.target.value)}
          style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
        />

        {survey.sections.map((section, si) => (
          <section key={si} style={{ marginBottom: 26 }}>
            {section.title && (
              <div style={{ margin: '8px 0 14px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--c-primary)', margin: 0 }}>{section.title}</h2>
                {section.note && <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '.9rem' }}>{section.note}</p>}
              </div>
            )}
            <div style={{ display: 'grid', gap: 14 }}>
              {section.questions.map((q) => { n += 1; return <Question key={q.id} q={q} number={n} answers={answers} set={set} /> })}
            </div>
          </section>
        ))}

        <p style={{ fontSize: '.85rem', color: '#64748b', lineHeight: 1.55, margin: '0 0 14px' }}>
          Your answers are anonymous. If you choose to leave your name or contact details, only village council members will see them.
        </p>

        {error && (
          <div role="alert" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: '.95rem' }}>
            {error}
          </div>
        )}

        <div style={{ position: 'sticky', bottom: 0, background: 'rgba(255,255,255,.96)', backdropFilter: 'blur(6px)', borderTop: '1px solid #e2e8f0', margin: '0 calc(var(--px-sm, 1.25rem) * -1)', padding: '10px var(--px-sm, 1.25rem)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'nowrap', zIndex: 5 }}>
          <div style={{ flex: '1 1 100px', minWidth: 96 }}>
            <div style={{ fontSize: '.8125rem', color: '#475569', fontWeight: 600, marginBottom: 4 }}>{answered} of {questions.length} answered</div>
            <div style={{ height: 6, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(answered / questions.length) * 100}%`, background: 'var(--c-brand)', transition: 'width .2s' }} />
            </div>
          </div>
          <button
            type="submit"
            disabled={status === 'sending'}
            style={{ background: 'var(--c-brand)', color: '#fff', fontWeight: 800, border: 'none', borderRadius: 10, padding: '.8rem 1.2rem', fontSize: '.95rem', whiteSpace: 'nowrap', cursor: status === 'sending' ? 'wait' : 'pointer', opacity: status === 'sending' ? 0.7 : 1 }}
          >
            {status === 'sending' ? 'Sending...' : 'Submit my answers'}
          </button>
        </div>
      </form>
    </Shell>
  )
}