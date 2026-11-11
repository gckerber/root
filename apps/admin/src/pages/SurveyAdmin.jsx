// apps/admin/src/pages/SurveyAdmin.jsx
// Community survey results: totals, per-question breakdowns, comments, CSV export, spam cleanup.
import { useEffect, useMemo, useState } from 'react'
import { ClipboardList, Download, RefreshCw, Trash2, Mail, MailX } from 'lucide-react'
import { useAuth, useToast } from '../utils/context'

const API = 'https://func-village-prod.azurewebsites.net'
const SURVEY_ID = 'community-2026'

// Preferred display order; any question not listed is appended in first-seen order.
const ORDER = ['focus', 'years', 'who', 'age', 'hear', 'infra', 'parks', 'growth', 'top3', 'spend25k', 'likeMost', 'change', 'satisfaction', 'volunteer', 'comments', 'contact']

const fmtDate = (iso) =>
  new Date(iso).toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })

const avg = (nums) => (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0)
const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0)

// ── Aggregation ──────────────────────────────────────────────────────────────
function aggregate(responses) {
  const byId = new Map()
  for (const r of responses) {
    for (const a of r.answers || []) {
      if (!byId.has(a.id)) byId.set(a.id, { id: a.id, q: a.q, type: a.type, entries: [] })
      byId.get(a.id).entries.push({ a, r })
    }
  }
  const rank = (id) => { const i = ORDER.indexOf(id); return i === -1 ? 999 : i }
  return [...byId.values()].sort((x, y) => rank(x.id) - rank(y.id))
}

function tally(entries) {
  const counts = new Map()
  const others = []
  for (const { a, r } of entries) {
    const picks = a.type === 'multi' ? a.choices || [] : [a.text]
    for (const p of picks) {
      if (p && p.startsWith('Other: ')) others.push({ text: p.slice(7), r })
      else if (p) counts.set(p, (counts.get(p) || 0) + 1)
    }
  }
  return { rows: [...counts.entries()].sort((x, y) => y[1] - x[1]), others }
}

function gridStats(entries) {
  const items = new Map()
  for (const { a } of entries) for (const g of a.ratings || []) {
    if (!items.has(g.item)) items.set(g.item, [])
    items.get(g.item).push(g.score)
  }
  return [...items.entries()]
    .map(([item, scores]) => ({ item, n: scores.length, mean: avg(scores), high: pct(scores.filter((s) => s >= 4).length, scores.length) }))
    .sort((x, y) => y.mean - x.mean)
}

// ── CSV export (opens cleanly in Excel) ──────────────────────────────────────
function toCsv(responses, questions) {
  const cols = [{ key: 'submitted', head: 'Submitted (ET)' }, { key: 'version', head: 'Survey' }]
  for (const q of questions) {
    if (q.type === 'grid') {
      const items = [...new Set(q.entries.flatMap(({ a }) => (a.ratings || []).map((g) => g.item)))]
      for (const it of items) cols.push({ key: `${q.id}||${it}`, head: `${q.q} [${it}]` })
    } else cols.push({ key: q.id, head: q.q })
  }
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = [cols.map((c) => esc(c.head)).join(',')]
  for (const r of [...responses].reverse()) {
    const row = { submitted: fmtDate(r.createdAt), version: r.version === 'quick' ? 'Quick' : 'Full' }
    for (const a of r.answers || []) {
      if (a.type === 'grid') for (const g of a.ratings || []) row[`${a.id}||${g.item}`] = g.score
      else if (a.type === 'multi') row[a.id] = (a.choices || []).join('; ')
      else if (a.type === 'scale') row[a.id] = a.rating
      else row[a.id] = a.text
    }
    lines.push(cols.map((c) => esc(row[c.key])).join(','))
  }
  return '\uFEFF' + lines.join('\r\n')
}

// ── Small display pieces ─────────────────────────────────────────────────────
function Bar({ value, max, label, right, tone = 'bg-blue-500' }) {
  return (
    <div className="py-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-slate-200">{label}</span>
        <span className="text-slate-400 tabular-nums whitespace-nowrap">{right}</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden mt-1">
        <div className={`h-full ${tone} rounded-full`} style={{ width: `${max ? (value / max) * 100 : 0}%` }} />
      </div>
    </div>
  )
}

function Stat({ label, value, sub }) {
  return (
    <div className="card p-4">
      <div className="text-slate-500 text-xs uppercase tracking-wider">{label}</div>
      <div className="text-white text-2xl font-bold mt-1">{value}</div>
      {sub && <div className="text-slate-500 text-xs mt-0.5">{sub}</div>}
    </div>
  )
}

function QuestionCard({ q }) {
  const [showAll, setShowAll] = useState(false)
  const n = q.entries.length
  let body
  if (q.type === 'single' || q.type === 'multi') {
    const { rows, others } = tally(q.entries)
    const max = rows[0]?.[1] || 0
    body = (
      <>
        {rows.map(([label, c]) => <Bar key={label} label={label} value={c} max={max} right={`${c} (${pct(c, n)}%)`} />)}
        {others.length > 0 && (
          <div className="mt-3">
            <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Other (write-ins): {others.length}</div>
            <ul className="text-slate-300 text-sm list-disc pl-5 space-y-0.5">
              {others.map((o, i) => <li key={i}>{o.text}</li>)}
            </ul>
          </div>
        )}
      </>
    )
  } else if (q.type === 'scale') {
    const scores = q.entries.map(({ a }) => a.rating)
    const dist = [1, 2, 3, 4, 5].map((s) => scores.filter((x) => x === s).length)
    body = (
      <>
        <div className="text-white text-3xl font-bold mb-2">{avg(scores).toFixed(2)} <span className="text-slate-500 text-base font-normal">average out of 5</span></div>
        {dist.map((c, i) => <Bar key={i} label={`${i + 1}`} value={c} max={Math.max(...dist)} right={`${c} (${pct(c, n)}%)`} tone="bg-emerald-500" />)}
      </>
    )
  } else if (q.type === 'grid') {
    const rows = gridStats(q.entries)
    body = (
      <>
        <p className="text-slate-500 text-xs mb-2">Average rating from 1 (not a priority) to 5 (top priority), highest first. "High" is the share who answered 4 or 5.</p>
        {rows.map((r) => (
          <Bar key={r.item} label={r.item} value={r.mean} max={5} tone="bg-amber-500"
            right={`${r.mean.toFixed(2)} avg · ${r.high}% high · n=${r.n}`} />
        ))}
      </>
    )
  } else {
    const items = [...q.entries].sort((x, y) => (y.r.createdAt > x.r.createdAt ? 1 : -1))
    const shown = showAll ? items : items.slice(0, 5)
    body = (
      <>
        <ul className="space-y-2">
          {shown.map(({ a, r }) => (
            <li key={r.id} className="bg-slate-800/60 rounded-lg p-3">
              <div className="text-slate-200 text-sm whitespace-pre-wrap">{a.text}</div>
              <div className="text-slate-500 text-xs mt-1">{fmtDate(r.createdAt)} · {r.version === 'quick' ? 'Quick' : 'Full'}</div>
            </li>
          ))}
        </ul>
        {items.length > 5 && (
          <button onClick={() => setShowAll((v) => !v)} className="btn-ghost mt-3 text-xs py-1.5 px-3">
            {showAll ? 'Show fewer' : `Show all ${items.length}`}
          </button>
        )}
      </>
    )
  }
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-white font-medium leading-snug">{q.q}</h3>
        <span className="badge bg-slate-600/20 text-slate-400 whitespace-nowrap">{n} answered</span>
      </div>
      {body}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function SurveyAdmin() {
  const { auth } = useAuth()
  const toast = useToast()
  const [all, setAll] = useState([])
  const [mailOn, setMailOn] = useState(null)
  const [loading, setLoading] = useState(true)
  const [version, setVersion] = useState('all')
  const [showList, setShowList] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/survey-responses?surveyId=${SURVEY_ID}`, { headers: { 'x-admin-key': auth.key } })
      if (!res.ok) throw new Error(res.status === 401 ? 'Not authorized' : `HTTP ${res.status}`)
      const d = await res.json()
      setAll(d.items || [])
      setMailOn(Boolean(d.mailConfigured))
    } catch (err) {
      toast('Could not load survey results: ' + err.message, 'error')
    }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const responses = useMemo(() => (version === 'all' ? all : all.filter((r) => r.version === version)), [all, version])
  const questions = useMemo(() => aggregate(responses), [responses])
  const counts = { quick: all.filter((r) => r.version === 'quick').length, full: all.filter((r) => r.version === 'full').length }
  const sat = questions.find((q) => q.id === 'satisfaction')
  const satAvg = sat ? avg(sat.entries.map(({ a }) => a.rating)) : null
  const volunteers = questions.find((q) => q.id === 'volunteer')?.entries.filter(({ a }) => a.text !== 'Not at this time').length ?? 0

  function download() {
    const blob = new Blob([toCsv(responses, questions)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `community-survey-${version}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function remove(r) {
    if (!confirm('Delete this response? This cannot be undone.')) return
    try {
      const res = await fetch(`${API}/api/survey-responses?id=${r.id}&surveyId=${SURVEY_ID}`, { method: 'DELETE', headers: { 'x-admin-key': auth.key } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setAll((prev) => prev.filter((x) => x.id !== r.id))
      toast('Response deleted', 'success')
    } catch (err) {
      toast('Delete failed: ' + err.message, 'error')
    }
  }

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-slate-400 text-sm">Results from the Community Survey on the village website.</p>
        <div className="flex gap-2 flex-wrap">
          <div className="flex bg-slate-800 rounded-xl p-1 gap-1">
            {[['all', `All (${all.length})`], ['quick', `Quick (${counts.quick})`], ['full', `Full (${counts.full})`]].map(([k, l]) => (
              <button key={k} onClick={() => setVersion(k)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${version === k ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                {l}
              </button>
            ))}
          </div>
          <button onClick={load} className="btn-ghost"><RefreshCw size={14} /> Refresh</button>
          <button onClick={download} disabled={!responses.length} className="btn-primary"><Download size={14} /> Download CSV</button>
        </div>
      </div>

      {mailOn === false && (
        <div className="card p-4 border-amber-600/30 bg-amber-600/5 text-amber-300 text-sm flex items-start gap-2">
          <MailX size={16} className="mt-0.5 flex-shrink-0" />
          Email notifications are not switched on yet. Responses are still being saved here; they just are not being emailed.
        </div>
      )}
      {mailOn && (
        <div className="text-slate-500 text-xs flex items-center gap-1.5"><Mail size={13} /> Each new response is also emailed to the survey recipients.</div>
      )}

      {loading ? (
        <div className="text-slate-500 text-sm">Loading results…</div>
      ) : all.length === 0 ? (
        <div className="card p-10 text-center text-slate-600">No responses yet.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Responses" value={responses.length} sub={`${counts.quick} quick · ${counts.full} full`} />
            <Stat label="Satisfaction" value={satAvg == null ? '-' : satAvg.toFixed(2)} sub="average out of 5" />
            <Stat label="Latest" value={fmtDate(all[0].createdAt).split(',').slice(0, 1).join('')} sub="most recent response" />
            <Stat label="Volunteers" value={volunteers} sub="yes or maybe" />
          </div>

          {questions.map((q) => <QuestionCard key={q.id} q={q} />)}

          <div className="card p-5">
            <button onClick={() => setShowList((v) => !v)} className="text-white font-medium flex items-center gap-2">
              <ClipboardList size={16} className="text-slate-400" /> All responses ({responses.length}) {showList ? '▾' : '▸'}
            </button>
            {showList && (
              <ul className="mt-3 divide-y divide-slate-800">
                {responses.map((r) => (
                  <li key={r.id} className="py-2.5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-slate-300 text-sm">{fmtDate(r.createdAt)} · {r.version === 'quick' ? 'Quick' : 'Full'} · {(r.answers || []).length} answers</div>
                      <div className="text-slate-500 text-xs truncate">
                        {(r.answers || []).find((a) => a.type === 'text')?.text || '(no written answers)'}
                      </div>
                    </div>
                    <button onClick={() => remove(r)} className="btn-danger py-1 px-2 text-xs" aria-label="Delete response"><Trash2 size={12} /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}