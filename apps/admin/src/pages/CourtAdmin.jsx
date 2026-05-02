// apps/admin/src/pages/CourtAdmin.jsx
// Manage Mayor's Court schedule — calls the pd-site's SWA managed API
import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Save, X, Gavel, Calendar } from 'lucide-react'
import { useAuth, useToast } from '../utils/context'
import { format, parseISO } from 'date-fns'

const PD_API = import.meta.env.VITE_PD_API_URL || 'https://func-village-prod.azurewebsites.net'

function CourtForm({ item, onSave, onCancel }) {
  const toast = useToast()
  const [form, setForm] = useState(item || {
    date: '', location: 'Village Hall — Council Chambers', judge: 'Mayor Zack Allen', notes: '',
  })
  const [saving, setSaving] = useState(false)
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  async function handleSave() {
    if (!form.date) {
      toast('Date is required', 'error')
      return
    }
    setSaving(true)
    try {
      await onSave(form)
    } catch (err) {
      toast(err.message || 'Save failed', 'error')
    }
    setSaving(false)
  }

  return (
    <div className="card p-5 border-amber-600/20 bg-amber-600/5 space-y-4">
      <h3 className="text-white font-medium flex items-center gap-2">
        <Gavel size={16} className="text-amber-400" />
        {item ? 'Edit Court Date' : 'New Court Date'}
      </h3>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Date &amp; Time</label>
          <input className="input" type="datetime-local" value={form.date?.slice(0, 16) || ''} onChange={f('date')} />
        </div>
        <div>
          <label className="label">Location</label>
          <input className="input" value={form.location} onChange={f('location')} placeholder="Village Hall — Council Chambers" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Presiding Judge / Mayor</label>
          <input className="input" value={form.judge} onChange={f('judge')} placeholder="Mayor Zack Allen" />
        </div>
        <div>
          <label className="label">Internal Notes (optional)</label>
          <input className="input" value={form.notes || ''} onChange={f('notes')} placeholder="e.g. Special session" />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving
            ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
            : <><Save size={14} /> {item ? 'Update' : 'Add'} Date</>}
        </button>
        <button onClick={onCancel} className="btn-ghost"><X size={14} /> Cancel</button>
      </div>
    </div>
  )
}

export default function CourtAdmin() {
  const { auth } = useAuth()
  const toast = useToast()
  const [dates, setDates] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    fetch(`${PD_API}/api/pd-court-schedule`, { headers: { 'x-admin-key': auth.key } })
      .then(r => r.json())
      .then(d => setDates(d.items || []))
      .catch(() => toast('Could not load court dates', 'error'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(form) {
    const isEdit = !!form.id
    const url = isEdit ? `${PD_API}/api/pd-court-schedule?id=${form.id}` : `${PD_API}/api/pd-court-schedule`
    const payload = {
      ...form,
      year: new Date(form.date).getFullYear(),
    }
    const res = await fetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': auth.key },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(await res.text())
    const saved = await res.json()
    setDates(prev =>
      isEdit ? prev.map(d => d.id === saved.id ? saved : d) : [...prev, saved]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
    )
    setAdding(false)
    setEditingId(null)
    toast(isEdit ? 'Court date updated!' : 'Court date added!', 'success')
  }

  async function handleDelete(item) {
    if (!confirm(`Delete court date on ${format(parseISO(item.date), 'MMM d, yyyy')}?`)) return
    try {
      await fetch(`${PD_API}/api/pd-court-schedule?id=${item.id}&year=${item.year}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': auth.key },
      })
      setDates(prev => prev.filter(d => d.id !== item.id))
      toast('Court date deleted', 'success')
    } catch {
      toast('Delete failed', 'error')
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <p className="text-slate-400 text-sm">Schedule Mayor&rsquo;s Court sessions. Dates shown on the public PD site.</p>
        <button onClick={() => setAdding(true)} disabled={adding} className="btn-primary">
          <Plus size={15} /> Add Court Date
        </button>
      </div>

      {adding && (
        <CourtForm onSave={handleSave} onCancel={() => setAdding(false)} />
      )}

      {loading ? (
        <div className="text-slate-500 text-sm">Loading court dates…</div>
      ) : dates.length === 0 ? (
        <div className="card p-10 text-center text-slate-600">No court dates scheduled.</div>
      ) : (
        dates.map(item =>
          editingId === item.id ? (
            <CourtForm
              key={item.id}
              item={item}
              onSave={handleSave}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div key={item.id} className="card p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-600/20 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-amber-400 text-xs font-bold leading-none">
                  {format(parseISO(item.date), 'MMM')}
                </span>
                <span className="text-white font-bold text-lg leading-none">
                  {format(parseISO(item.date), 'd')}
                </span>
              </div>
              <div className="flex-grow min-w-0">
                <div className="text-white font-medium">
                  {format(parseISO(item.date), 'EEEE, MMMM d, yyyy')}
                </div>
                <div className="text-slate-500 text-xs mt-0.5 flex items-center gap-3 flex-wrap">
                  <span>{format(parseISO(item.date), 'h:mm a')}</span>
                  <span>{item.location}</span>
                  {item.judge && <span>· {item.judge}</span>}
                </div>
                {item.notes && (
                  <div className="text-slate-600 text-xs mt-0.5 italic">{item.notes}</div>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => setEditingId(item.id)} className="btn-ghost py-1.5 px-3 text-xs">
                  <Pencil size={13} />
                </button>
                <button onClick={() => handleDelete(item)} className="btn-danger py-1.5 px-3">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          )
        )
      )}
    </div>
  )
}
