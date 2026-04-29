// src/pages/Officials.jsx
import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Save, X, User, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth, useToast } from '../utils/context'

const API = 'https://func-village-prod.azurewebsites.net'

const DEFAULT_OFFICIALS = [
  { id: '1', name: 'Zack Allen', title: 'Mayor', bio: '', email: 'mayor@saintlouisvilleohio.gov', order: 0 },
  { id: '2', name: 'Council Member 1', title: 'Village Council', bio: '', email: 'council1@saintlouisvilleohio.gov', order: 1 },
  { id: '3', name: 'Council Member 2', title: 'Village Council', bio: '', email: 'council2@saintlouisvilleohio.gov', order: 2 },
  { id: '4', name: 'Council Member 3', title: 'Village Council', bio: '', email: 'council3@saintlouisvilleohio.gov', order: 3 },
  { id: '5', name: 'Council Member 4', title: 'Village Council', bio: '', email: 'council4@saintlouisvilleohio.gov', order: 4 },
  { id: '6', name: 'Council Member 5', title: 'Village Council', bio: '', email: 'council5@saintlouisvilleohio.gov', order: 5 },
  { id: '7', name: 'George Kerber', title: 'Tech Czar', bio: '', email: 'tech@saintlouisvilleohio.gov', order: 6 },
]

function OfficialForm({ official, onSave, onCancel }) {
  const [form, setForm] = useState(official || { name: '', title: 'Village Council', bio: '', email: '' })
  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  return (
    <div className="bg-slate-800/60 rounded-xl p-4 space-y-3 border border-slate-700">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Full Name</label>
          <input className="input" value={form.name} onChange={f('name')} placeholder="Jane Smith" />
        </div>
        <div>
          <label className="label">Title / Role</label>
          <select className="input" value={form.title} onChange={f('title')}>
            <option>Mayor</option>
            <option>Village Council</option>
            <option>Tech Czar</option>
            <option>Village Clerk</option>
            <option>Village Solicitor</option>
            <option>Other</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Email Address</label>
        <input className="input" type="email" value={form.email} onChange={f('email')} placeholder="name@saintlouisvilleohio.gov" />
      </div>
      <div>
        <label className="label">Bio (shown on the About Us page)</label>
        <textarea className="input resize-none" rows={3} value={form.bio} onChange={f('bio')} placeholder="A short description of this official's role and background..." />
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={() => onSave(form)} className="btn-primary"><Save size={14} /> Save</button>
        <button onClick={onCancel} className="btn-ghost"><X size={14} /> Cancel</button>
      </div>
    </div>
  )
}

export default function Officials() {
  const { auth } = useAuth()
  const toast = useToast()
  const [officials, setOfficials] = useState(DEFAULT_OFFICIALS)
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/officials`)
      .then((r) => r.json())
      .then((d) => { if (d.items?.length) setOfficials(d.items) })
      .catch(() => {/* use defaults */})
      .finally(() => setLoading(false))
  }, [])

  async function save(official) {
    setSaving(true)
    try {
      const isNew = !official.id
      const method = isNew ? 'POST' : 'PUT'
      const url = isNew ? `${API}/api/officials` : `${API}/api/officials?id=${official.id}`
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-admin-key': auth.key },
        body: JSON.stringify(official),
      })
      if (!res.ok) throw new Error('Save failed')
      const saved = await res.json()
      setOfficials((prev) =>
        isNew
          ? [...prev, saved]
          : prev.map((o) => (o.id === saved.id ? saved : o))
      )
      setEditingId(null)
      setAdding(false)
      toast(isNew ? 'Official added!' : 'Official updated!', 'success')
    } catch {
      toast('Save failed — please try again', 'error')
    }
    setSaving(false)
  }

  async function remove(id) {
    if (!confirm('Remove this official from the website?')) return
    try {
      await fetch(`${API}/api/officials?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': auth.key },
      })
      setOfficials((prev) => prev.filter((o) => o.id !== id))
      toast('Official removed', 'success')
    } catch {
      toast('Delete failed', 'error')
    }
  }

  if (loading) return <div className="text-slate-500 text-sm">Loading officials…</div>

  return (
    <div className="max-w-2xl space-y-3">
      <div className="flex items-center justify-between mb-6">
        <p className="text-slate-400 text-sm">These names and bios appear on the "Get to Know Us" page.</p>
        <button onClick={() => setAdding(true)} className="btn-primary" disabled={adding}>
          <Plus size={15} /> Add Official
        </button>
      </div>

      {adding && (
        <OfficialForm onSave={save} onCancel={() => setAdding(false)} />
      )}

      {officials.map((o) => (
        <div key={o.id} className="card">
          {editingId === o.id ? (
            <div className="p-4">
              <OfficialForm official={o} onSave={save} onCancel={() => setEditingId(null)} />
            </div>
          ) : (
            <div className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400 font-bold text-sm flex-shrink-0">
                {o.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-grow min-w-0">
                <div className="text-white font-medium leading-tight">{o.name}</div>
                <div className="text-slate-500 text-xs">{o.title} · {o.email}</div>
                {o.bio && <div className="text-slate-500 text-xs mt-0.5 truncate">{o.bio}</div>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => setEditingId(o.id)} className="btn-ghost py-1.5 px-3">
                  <Pencil size={13} /> Edit
                </button>
                <button onClick={() => remove(o.id)} className="btn-danger py-1.5 px-3">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
