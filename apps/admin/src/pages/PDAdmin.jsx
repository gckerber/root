// apps/admin/src/pages/PDAdmin.jsx
// Manage police citations — calls the pd-site's SWA managed API
import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Save, X, Search, Shield } from 'lucide-react'
import { useAuth, useToast } from '../utils/context'
import { format, parseISO } from 'date-fns'

const PD_API = import.meta.env.VITE_PD_API_URL || 'https://func-village-prod.azurewebsites.net'

const STATUSES = ['unpaid', 'paid', 'court', 'dismissed']
const VIOLATION_TYPES = ['Speeding', 'Stop Sign Violation', 'Red Light Violation', 'No Seat Belt', 'Failure to Yield', 'Improper Turn', 'No Valid License', 'No Insurance', 'Vehicle Equipment Violation', 'Noise Violation', 'Parking Violation', 'Other']

const STATUS_COLORS = {
  unpaid: 'bg-red-600/20 text-red-400',
  paid: 'bg-green-600/20 text-green-400',
  court: 'bg-blue-600/20 text-blue-400',
  dismissed: 'bg-slate-600/20 text-slate-400',
}

function CitationForm({ item, onSave, onCancel, adminKey }) {
  const toast = useToast()
  const [form, setForm] = useState(item || {
    citationNumber: '', firstName: '', lastName: '', dob: '', address: '',
    vehicleInfo: '', violationDate: '', violationType: 'Speeding',
    violationDescription: '', fineAmount: '', officer: '', courtDate: '', notes: '',
  })
  const [saving, setSaving] = useState(false)
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  async function handleSave() {
    if (!form.citationNumber?.trim() || !form.lastName?.trim() || !form.violationDate || !form.fineAmount) {
      toast('Citation #, last name, violation date, and fine amount are required', 'error')
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
        <Shield size={16} className="text-amber-400" />
        {item ? 'Edit Citation' : 'New Citation'}
      </h3>

      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="label">Citation Number</label>
          <input className="input font-mono" value={form.citationNumber} onChange={f('citationNumber')}
            placeholder="SLP-2025-0001" />
        </div>
        <div>
          <label className="label">Fine Amount ($)</label>
          <input className="input" type="number" min="0" step="0.01" value={form.fineAmount} onChange={f('fineAmount')} placeholder="150.00" />
        </div>
        <div>
          <label className="label">Violation Date</label>
          <input className="input" type="date" value={form.violationDate?.slice(0, 10) || ''} onChange={f('violationDate')} />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="label">First Name</label>
          <input className="input" value={form.firstName} onChange={f('firstName')} placeholder="John" />
        </div>
        <div>
          <label className="label">Last Name</label>
          <input className="input" value={form.lastName} onChange={f('lastName')} placeholder="Doe" />
        </div>
        <div>
          <label className="label">Date of Birth</label>
          <input className="input" type="date" value={form.dob?.slice(0, 10) || ''} onChange={f('dob')} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Address</label>
          <input className="input" value={form.address} onChange={f('address')} placeholder="123 Main St, Saint Louisville, OH" />
        </div>
        <div>
          <label className="label">Vehicle Info</label>
          <input className="input" value={form.vehicleInfo} onChange={f('vehicleInfo')} placeholder="2020 Red Honda Civic" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Violation Type</label>
          <select className="input" value={form.violationType} onChange={f('violationType')}>
            {VIOLATION_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Officer</label>
          <input className="input" value={form.officer} onChange={f('officer')} placeholder="Officer Name" />
        </div>
      </div>

      <div>
        <label className="label">Violation Description (optional)</label>
        <textarea className="input resize-none" rows={2} value={form.violationDescription || ''} onChange={f('violationDescription')}
          placeholder="e.g. Observed traveling 42 mph in a 25 mph zone on Main Street" />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Court Date (optional)</label>
          <input className="input" type="datetime-local" value={form.courtDate?.slice(0, 16) || ''} onChange={f('courtDate')} />
        </div>
        <div>
          <label className="label">Internal Notes (admin only)</label>
          <input className="input" value={form.notes || ''} onChange={f('notes')} placeholder="Not shown to defendant" />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving
            ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
            : <><Save size={14} /> {item ? 'Update' : 'Create'} Citation</>}
        </button>
        <button onClick={onCancel} className="btn-ghost"><X size={14} /> Cancel</button>
      </div>
    </div>
  )
}

export default function PDAdmin() {
  const { auth } = useAuth()
  const toast = useToast()
  const [citations, setCitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch(`${PD_API}/api/pd-citations`, { headers: { 'x-admin-key': auth.key } })
      .then(r => r.json())
      .then(d => setCitations(d.items || []))
      .catch(() => toast('Could not load citations', 'error'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(form) {
    const isEdit = !!form.id
    const url = isEdit ? `${PD_API}/api/pd-citations?id=${form.id}` : `${PD_API}/api/pd-citations`
    const res = await fetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': auth.key },
      body: JSON.stringify({
        ...form,
        fineAmount: parseFloat(form.fineAmount),
        balance: isEdit ? form.balance : parseFloat(form.fineAmount),
        status: isEdit ? form.status : 'unpaid',
      }),
    })
    if (!res.ok) throw new Error(await res.text())
    const saved = await res.json()
    setCitations(prev =>
      isEdit ? prev.map(c => c.id === saved.id ? saved : c) : [saved, ...prev]
    )
    setAdding(false)
    setEditingId(null)
    toast(isEdit ? 'Citation updated!' : 'Citation created!', 'success')
  }

  async function handleStatusChange(citation, newStatus) {
    try {
      const res = await fetch(`${PD_API}/api/pd-citations?id=${citation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': auth.key },
        body: JSON.stringify({ ...citation, status: newStatus }),
      })
      if (!res.ok) throw new Error(await res.text())
      const updated = await res.json()
      setCitations(prev => prev.map(c => c.id === updated.id ? updated : c))
      toast('Status updated!', 'success')
    } catch (err) {
      toast('Update failed: ' + err.message, 'error')
    }
  }

  async function handleDelete(citation) {
    if (!confirm(`Delete citation ${citation.citationNumber}?`)) return
    try {
      await fetch(`${PD_API}/api/pd-citations?id=${citation.id}&status=${citation.status}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': auth.key },
      })
      setCitations(prev => prev.filter(c => c.id !== citation.id))
      toast('Citation deleted', 'success')
    } catch {
      toast('Delete failed', 'error')
    }
  }

  const filtered = citations.filter(c => {
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus
    const matchesSearch = !search || c.citationNumber?.toLowerCase().includes(search.toLowerCase()) ||
      c.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      c.firstName?.toLowerCase().includes(search.toLowerCase())
    return matchesStatus && matchesSearch
  })

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <p className="text-slate-400 text-sm">Manage citations issued within village limits.</p>
        <button onClick={() => setAdding(true)} disabled={adding} className="btn-primary">
          <Plus size={15} /> New Citation
        </button>
      </div>

      {adding && (
        <CitationForm onSave={handleSave} onCancel={() => setAdding(false)} adminKey={auth.key} />
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-grow max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input pl-8 py-2"
            placeholder="Search citation # or name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input py-2 w-36" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-slate-500 text-sm">Loading citations…</div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center text-slate-600">No citations found.</div>
      ) : (
        filtered.map(citation =>
          editingId === citation.id ? (
            <CitationForm
              key={citation.id}
              item={citation}
              onSave={handleSave}
              onCancel={() => setEditingId(null)}
              adminKey={auth.key}
            />
          ) : (
            <div key={citation.id} className="card p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-600/20 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-amber-400 text-xs font-bold leading-none">
                  {citation.violationDate ? format(parseISO(citation.violationDate), 'MMM') : '---'}
                </span>
                <span className="text-white font-bold text-lg leading-none">
                  {citation.violationDate ? format(parseISO(citation.violationDate), 'd') : '--'}
                </span>
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs text-slate-400">{citation.citationNumber}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[citation.status] || STATUS_COLORS.unpaid}`}>
                    {citation.status}
                  </span>
                </div>
                <div className="text-white font-medium truncate">
                  {citation.firstName} {citation.lastName} — {citation.violationType}
                </div>
                <div className="text-slate-500 text-xs mt-0.5 flex items-center gap-3 flex-wrap">
                  <span>Balance: <span className="font-semibold text-slate-300">${(citation.balance ?? citation.fineAmount)?.toFixed(2)}</span></span>
                  {citation.officer && <span>Officer: {citation.officer}</span>}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0 items-center">
                <select
                  value={citation.status}
                  onChange={e => handleStatusChange(citation, e.target.value)}
                  className="input py-1 px-2 text-xs w-28"
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={() => setEditingId(citation.id)} className="btn-ghost py-1.5 px-3 text-xs">
                  <Pencil size={13} />
                </button>
                <button onClick={() => handleDelete(citation)} className="btn-danger py-1.5 px-3">
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
