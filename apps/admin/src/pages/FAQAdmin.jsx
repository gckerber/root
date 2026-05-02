// apps/admin/src/pages/FAQAdmin.jsx
// Edit Mayor's Court FAQ items — stored in Cosmos, shown on pd-site /mayors-court
import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Save, X, HelpCircle, ArrowUp, ArrowDown } from 'lucide-react'
import { useAuth, useToast } from '../utils/context'

const PD_API = import.meta.env.VITE_PD_API_URL || 'https://func-village-prod.azurewebsites.net'

function FAQForm({ item, nextOrder, onSave, onCancel }) {
  const toast = useToast()
  const [form, setForm] = useState(item || { question: '', answer: '', order: nextOrder })
  const [saving, setSaving] = useState(false)
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  async function handleSave() {
    if (!form.question.trim() || !form.answer.trim()) {
      toast('Question and answer are required', 'error')
      return
    }
    setSaving(true)
    try { await onSave(form) } catch (err) { toast(err.message || 'Save failed', 'error') }
    setSaving(false)
  }

  return (
    <div className="card p-5 border-amber-600/20 bg-amber-600/5 space-y-3">
      <h3 className="text-white font-medium flex items-center gap-2">
        <HelpCircle size={16} className="text-amber-400" />
        {item ? 'Edit FAQ' : 'New FAQ'}
      </h3>
      <div>
        <label className="label">Question</label>
        <input className="input" value={form.question} onChange={f('question')} placeholder="e.g. Can I request a continuance?" />
      </div>
      <div>
        <label className="label">Answer</label>
        <textarea className="input resize-none" rows={3} value={form.answer} onChange={f('answer')}
          placeholder="Write the answer here…" />
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving
            ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
            : <><Save size={14} /> {item ? 'Update' : 'Add'} FAQ</>}
        </button>
        <button onClick={onCancel} className="btn-ghost"><X size={14} /> Cancel</button>
      </div>
    </div>
  )
}

export default function FAQAdmin() {
  const { auth } = useAuth()
  const toast = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    fetch(`${PD_API}/api/pd-faq`, { headers: { 'x-admin-key': auth.key } })
      .then(r => r.json())
      .then(d => setItems(d.items || []))
      .catch(() => toast('Could not load FAQs', 'error'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(form) {
    const isEdit = !!form.id
    const url = isEdit ? `${PD_API}/api/pd-faq?id=${form.id}` : `${PD_API}/api/pd-faq`
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
    toast(isEdit ? 'FAQ updated!' : 'FAQ added!', 'success')
  }

  async function handleMove(item, direction) {
    const sorted = [...items].sort((a, b) => a.order - b.order)
    const i = sorted.findIndex(x => x.id === item.id)
    const j = direction === 'up' ? i - 1 : i + 1
    if (j < 0 || j >= sorted.length) return
    const a = { ...sorted[i], order: j }
    const b = { ...sorted[j], order: i }
    await Promise.all([a, b].map(x =>
      fetch(`${PD_API}/api/pd-faq?id=${x.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': auth.key },
        body: JSON.stringify(x),
      })
    ))
    setItems(prev => prev.map(x => x.id === a.id ? a : x.id === b.id ? b : x))
  }

  async function handleDelete(item) {
    if (!confirm(`Delete FAQ: "${item.question.slice(0, 60)}…"?`)) return
    try {
      await fetch(`${PD_API}/api/pd-faq?id=${item.id}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': auth.key },
      })
      setItems(prev => prev.filter(i => i.id !== item.id))
      toast('FAQ deleted', 'success')
    } catch {
      toast('Delete failed', 'error')
    }
  }

  const sorted = [...items].sort((a, b) => a.order - b.order)

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <p className="text-slate-400 text-sm">FAQ items shown on the Mayor&rsquo;s Court page. Drag to reorder using the arrows.</p>
        <button onClick={() => setAdding(true)} disabled={adding} className="btn-primary">
          <Plus size={15} /> Add FAQ
        </button>
      </div>

      {adding && (
        <FAQForm nextOrder={items.length} onSave={handleSave} onCancel={() => setAdding(false)} />
      )}

      {loading ? (
        <div className="text-slate-500 text-sm">Loading FAQs…</div>
      ) : sorted.length === 0 && !adding ? (
        <div className="card p-10 text-center text-slate-600">No FAQ items yet. Add one to get started.</div>
      ) : (
        sorted.map((item, idx) =>
          editingId === item.id ? (
            <FAQForm key={item.id} item={item} nextOrder={item.order} onSave={handleSave} onCancel={() => setEditingId(null)} />
          ) : (
            <div key={item.id} className="card p-4 flex items-start gap-3">
              <div className="flex flex-col gap-1 flex-shrink-0 mt-0.5">
                <button onClick={() => handleMove(item, 'up')} disabled={idx === 0} className="btn-ghost py-0.5 px-1.5 disabled:opacity-30">
                  <ArrowUp size={12} />
                </button>
                <button onClick={() => handleMove(item, 'down')} disabled={idx === sorted.length - 1} className="btn-ghost py-0.5 px-1.5 disabled:opacity-30">
                  <ArrowDown size={12} />
                </button>
              </div>
              <div className="flex-grow min-w-0">
                <p className="text-white font-medium text-sm">{item.question}</p>
                <p className="text-slate-500 text-xs mt-1 line-clamp-2">{item.answer}</p>
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
