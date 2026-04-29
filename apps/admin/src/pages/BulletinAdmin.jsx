// src/pages/BulletinAdmin.jsx
import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Save, X, Pin, Megaphone } from 'lucide-react'
import { useAuth, useToast } from '../utils/context'
import { formatDistanceToNow, parseISO } from 'date-fns'

const API = 'https://func-village-prod.azurewebsites.net'

const CATEGORIES = ['notice', 'event', 'urgent', 'general']
const CAT_COLORS = {
  notice: 'bg-blue-600/20 text-blue-400',
  event: 'bg-green-600/20 text-green-400',
  urgent: 'bg-red-600/20 text-red-400',
  general: 'bg-slate-600/20 text-slate-400',
}

function BulletinForm({ item, onSave, onCancel }) {
  const [form, setForm] = useState(item || { title: '', body: '', category: 'notice', pinned: false, link: '' })
  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  return (
    <div className="card p-5 border-yellow-600/20 bg-yellow-600/5 space-y-3">
      <h3 className="text-white font-medium flex items-center gap-2">
        <Megaphone size={16} className="text-yellow-400" />
        {item ? 'Edit Announcement' : 'New Announcement'}
      </h3>
      <div>
        <label className="label">Title</label>
        <input className="input" value={form.title} onChange={f('title')} placeholder="e.g. Road Closure — Elm Street" />
      </div>
      <div>
        <label className="label">Message</label>
        <textarea className="input resize-none" rows={4} value={form.body} onChange={f('body')} placeholder="Write the full announcement here..." />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Category</label>
          <select className="input" value={form.category} onChange={f('category')}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Link (optional)</label>
          <input className="input" type="url" value={form.link} onChange={f('link')} placeholder="https://..." />
        </div>
      </div>
      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" checked={form.pinned} onChange={(e) => setForm((p) => ({ ...p, pinned: e.target.checked }))} className="w-4 h-4 rounded" />
        <span className="text-slate-300 text-sm flex items-center gap-1.5"><Pin size={13} className="text-yellow-400" /> Pin to top of bulletin board</span>
      </label>
      <div className="flex gap-2 pt-1">
        <button onClick={() => onSave(form)} className="btn-primary"><Save size={14} /> {item ? 'Update' : 'Post'} Announcement</button>
        <button onClick={onCancel} className="btn-ghost"><X size={14} /> Cancel</button>
      </div>
    </div>
  )
}

export default function BulletinAdmin() {
  const { auth } = useAuth()
  const toast = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [filterCat, setFilterCat] = useState('all')

  useEffect(() => {
    fetch(`${API}/api/bulletin?limit=50`)
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => toast('Could not load bulletins', 'error'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(form) {
    const isEdit = !!form.id
    try {
      const res = await fetch(
        isEdit ? `${API}/api/bulletin?id=${form.id}&category=${form.category}` : `${API}/api/bulletin`,
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-key': auth.key },
          body: JSON.stringify(form),
        }
      )
      if (!res.ok) throw new Error()
      const saved = await res.json()
      setItems((prev) => isEdit ? prev.map((x) => x.id === saved.id ? saved : x) : [saved, ...prev])
      setAdding(false)
      setEditingId(null)
      toast(isEdit ? 'Announcement updated!' : 'Announcement posted!', 'success')
    } catch {
      toast('Save failed — please try again', 'error')
    }
  }

  async function handleDelete(item) {
    if (!confirm(`Remove "${item.title}"?`)) return
    try {
      await fetch(`${API}/api/bulletin?id=${item.id}&category=${item.category}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': auth.key },
      })
      setItems((prev) => prev.filter((x) => x.id !== item.id))
      toast('Announcement removed', 'success')
    } catch {
      toast('Delete failed', 'error')
    }
  }

  const filtered = filterCat === 'all' ? items : items.filter((x) => x.category === filterCat)

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <p className="text-slate-400 text-sm">Post announcements and notices for village residents.</p>
        <div className="flex gap-2 flex-wrap">
          <div className="flex bg-slate-800 rounded-xl p-1 gap-1">
            {['all', ...CATEGORIES].map((c) => (
              <button key={c} onClick={() => setFilterCat(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${filterCat === c ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                {c}
              </button>
            ))}
          </div>
          <button onClick={() => setAdding(true)} disabled={adding} className="btn-primary"><Plus size={15} /> Post Announcement</button>
        </div>
      </div>

      {adding && <BulletinForm onSave={handleSave} onCancel={() => setAdding(false)} />}

      {loading ? (
        <div className="text-slate-500 text-sm">Loading bulletins…</div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center text-slate-600">No announcements yet. Click "Post Announcement" to add one.</div>
      ) : (
        filtered.map((item) => (
          editingId === item.id ? (
            <BulletinForm key={item.id} item={item} onSave={handleSave} onCancel={() => setEditingId(null)} />
          ) : (
            <div key={item.id} className={`card p-4 ${item.pinned ? 'border-yellow-600/30' : ''}`}>
              <div className="flex items-start gap-3">
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {item.pinned && <Pin size={13} className="text-yellow-400" />}
                    <span className={`badge ${CAT_COLORS[item.category] || 'bg-slate-600/20 text-slate-400'}`}>{item.category}</span>
                    <span className="text-slate-600 text-xs">{formatDistanceToNow(parseISO(item.date), { addSuffix: true })}</span>
                  </div>
                  <div className="text-white font-medium">{item.title}</div>
                  <div className="text-slate-400 text-sm mt-0.5 line-clamp-2">{item.body}</div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => setEditingId(item.id)} className="btn-ghost py-1.5 px-3"><Pencil size={13} /> Edit</button>
                  <button onClick={() => handleDelete(item)} className="btn-danger py-1.5 px-3"><Trash2 size={13} /></button>
                </div>
              </div>
            </div>
          )
        ))
      )}
    </div>
  )
}
