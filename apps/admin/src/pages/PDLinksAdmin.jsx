// apps/admin/src/pages/PDLinksAdmin.jsx
// Manage Links & Resources shown on the Police Dept page
import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Save, X, Link2, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react'
import { useAuth, useToast } from '../utils/context'

const PD_API = import.meta.env.VITE_PD_API_URL || 'https://func-village-prod.azurewebsites.net'

function LinkForm({ item, nextOrder, onSave, onCancel }) {
  const toast = useToast()
  const [form, setForm] = useState(
    item || { label: '', title: '', description: '', url: '', order: nextOrder }
  )
  const [saving, setSaving] = useState(false)
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  async function handleSave() {
    if (!form.title.trim() || !form.url.trim()) {
      toast('Title and URL are required', 'error')
      return
    }
    setSaving(true)
    try { await onSave(form) } catch (err) { toast(err.message || 'Save failed', 'error') }
    setSaving(false)
  }

  return (
    <div className="card p-5 border-amber-600/20 bg-amber-600/5 space-y-3">
      <h3 className="text-white font-medium flex items-center gap-2">
        <Link2 size={16} className="text-amber-400" />
        {item ? 'Edit Link' : 'New Link'}
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Label <span className="text-slate-600 font-normal">(small tag)</span></label>
          <input className="input" value={form.label} onChange={f('label')} placeholder="e.g. Ohio BMV" />
        </div>
        <div>
          <label className="label">Title <span className="text-red-400">*</span></label>
          <input className="input" value={form.title} onChange={f('title')} placeholder="e.g. License & Registration" />
        </div>
      </div>

      <div>
        <label className="label">Description</label>
        <input className="input" value={form.description} onChange={f('description')} placeholder="Short description shown below the title" />
      </div>

      <div>
        <label className="label">URL <span className="text-red-400">*</span></label>
        <input className="input" value={form.url} onChange={f('url')} placeholder="https://..." type="url" />
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving
            ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
            : <><Save size={14} /> {item ? 'Update' : 'Add'} Link</>}
        </button>
        <button onClick={onCancel} className="btn-ghost"><X size={14} /> Cancel</button>
      </div>
    </div>
  )
}

export default function PDLinksAdmin() {
  const { auth } = useAuth()
  const toast = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    fetch(`${PD_API}/api/pd-links`, { headers: { 'x-admin-key': auth.key } })
      .then(r => r.json())
      .then(d => setItems(d.items || []))
      .catch(() => toast('Could not load links', 'error'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(form) {
    const isEdit = !!form.id
    const url = isEdit ? `${PD_API}/api/pd-links?id=${form.id}` : `${PD_API}/api/pd-links`
    const res = await fetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': auth.key },
      body: JSON.stringify({ ...form, order: Number(form.order) }),
    })
    if (!res.ok) throw new Error(await res.text())
    const saved = await res.json()
    setItems(prev =>
      isEdit
        ? prev.map(i => i.id === saved.id ? saved : i)
        : [...prev, saved].sort((a, b) => a.order - b.order)
    )
    setAdding(false)
    setEditingId(null)
    toast(isEdit ? 'Link updated!' : 'Link added!', 'success')
  }

  async function handleMove(item, direction) {
    const sorted = [...items].sort((a, b) => a.order - b.order)
    const i = sorted.findIndex(x => x.id === item.id)
    const j = direction === 'up' ? i - 1 : i + 1
    if (j < 0 || j >= sorted.length) return
    const a = { ...sorted[i], order: j }
    const b = { ...sorted[j], order: i }
    await Promise.all([a, b].map(x =>
      fetch(`${PD_API}/api/pd-links?id=${x.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': auth.key },
        body: JSON.stringify(x),
      })
    ))
    setItems(prev => prev.map(x => x.id === a.id ? a : x.id === b.id ? b : x))
  }

  async function handleDelete(item) {
    if (!confirm(`Delete link: "${item.title}"?`)) return
    try {
      await fetch(`${PD_API}/api/pd-links?id=${item.id}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': auth.key },
      })
      setItems(prev => prev.filter(i => i.id !== item.id))
      toast('Link deleted', 'success')
    } catch {
      toast('Delete failed', 'error')
    }
  }

  const sorted = [...items].sort((a, b) => a.order - b.order)

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <p className="text-slate-400 text-sm">
          Links shown in the "Links &amp; Resources" section of the Police Dept page. Displayed as a 4-column grid.
        </p>
        <button onClick={() => setAdding(true)} disabled={adding} className="btn-primary">
          <Plus size={15} /> Add Link
        </button>
      </div>

      {adding && (
        <LinkForm nextOrder={items.length} onSave={handleSave} onCancel={() => setAdding(false)} />
      )}

      {loading ? (
        <div className="text-slate-500 text-sm">Loading links…</div>
      ) : sorted.length === 0 && !adding ? (
        <div className="card p-10 text-center text-slate-600">
          No links yet. Add one to get started.
        </div>
      ) : (
        sorted.map((item, idx) =>
          editingId === item.id ? (
            <LinkForm key={item.id} item={item} nextOrder={item.order} onSave={handleSave} onCancel={() => setEditingId(null)} />
          ) : (
            <div key={item.id} className="card p-4 flex items-center gap-3">
              {/* Reorder arrows */}
              <div className="flex flex-col gap-1 flex-shrink-0">
                <button onClick={() => handleMove(item, 'up')} disabled={idx === 0} className="btn-ghost py-0.5 px-1.5 disabled:opacity-30">
                  <ArrowUp size={12} />
                </button>
                <button onClick={() => handleMove(item, 'down')} disabled={idx === sorted.length - 1} className="btn-ghost py-0.5 px-1.5 disabled:opacity-30">
                  <ArrowDown size={12} />
                </button>
              </div>

              {/* Icon */}
              <div className="w-9 h-9 rounded-lg bg-amber-400/10 flex items-center justify-center flex-shrink-0">
                <Link2 size={16} className="text-amber-400" />
              </div>

              {/* Content */}
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {item.label && (
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">{item.label}</span>
                  )}
                  <span className="text-white font-medium text-sm">{item.title}</span>
                </div>
                {item.description && (
                  <p className="text-slate-500 text-xs mt-0.5">{item.description}</p>
                )}
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 text-xs hover:underline flex items-center gap-1 mt-0.5 w-fit"
                >
                  {item.url.replace(/^https?:\/\//, '').slice(0, 60)}
                  <ExternalLink size={10} />
                </a>
              </div>

              {/* Actions */}
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
