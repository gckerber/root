// src/pages/OrdinancesAdmin.jsx
import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, Save, X, Upload, Download, BookOpen, Paperclip } from 'lucide-react'
import { useAuth, useToast } from '../utils/context'

const API = 'https://func-village-prod.azurewebsites.net'
const CATEGORIES = ['zoning', 'general', 'traffic', 'health', 'utilities']

function OrdForm({ item, onSave, onCancel, adminKey }) {
  const toast = useToast()
  const fileRef = useRef()
  const [form, setForm] = useState(item || { number: '', title: '', category: 'general', summary: '', year: new Date().getFullYear(), fileUrl: '' })
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  async function handleSave() {
    if (!form.number?.trim() || !form.title?.trim()) { toast('Number and title are required', 'error'); return }
    setUploading(true)
    try {
      let fileUrl = form.fileUrl
      if (file) {
        const urlRes = await fetch(`${API}/api/upload-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
          body: JSON.stringify({ container: 'ordinances', filename: file.name, contentType: file.type }),
        })
        const { uploadUrl, publicUrl } = await urlRes.json()
        await fetch(uploadUrl, { method: 'PUT', headers: { 'x-ms-blob-type': 'BlockBlob', 'Content-Type': file.type }, body: file })
        fileUrl = publicUrl
      }
      await onSave({ ...form, fileUrl, year: parseInt(form.year) })
    } catch (err) { toast('Save failed', 'error') }
    setUploading(false)
  }

  return (
    <div className="card p-5 border-orange-600/20 bg-orange-600/5 space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Ordinance Number</label>
          <input className="input font-mono" value={form.number} onChange={f('number')} placeholder="ORD-2024-001" />
        </div>
        <div>
          <label className="label">Year</label>
          <input className="input" type="number" value={form.year} onChange={f('year')} />
        </div>
      </div>
      <div>
        <label className="label">Title</label>
        <input className="input" value={form.title} onChange={f('title')} placeholder="Short descriptive title" />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Category</label>
          <select className="input" value={form.category} onChange={f('category')}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Summary (optional)</label>
        <textarea className="input resize-none" rows={2} value={form.summary} onChange={f('summary')} placeholder="One or two sentences describing what this ordinance covers..." />
      </div>
      <div>
        <label className="label">PDF File {item?.fileUrl && '(re-upload to replace)'}</label>
        <div className="flex gap-2 items-center">
          <div
            className="flex-grow border border-dashed border-slate-700 rounded-xl px-4 py-2.5 text-sm cursor-pointer hover:border-slate-600 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            {file ? (
              <span className="text-white flex items-center gap-2"><Paperclip size={14} className="text-orange-400" />{file.name}</span>
            ) : (
              <span className="text-slate-500 flex items-center gap-2"><Upload size={14} /> Click to attach PDF</span>
            )}
          </div>
          {item?.fileUrl && !file && (
            <a href={item.fileUrl} target="_blank" rel="noreferrer" className="btn-ghost py-2 px-3"><Download size={13} /></a>
          )}
        </div>
        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" onChange={(e) => setFile(e.target.files[0])} className="hidden" />
      </div>
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={uploading} className="btn-primary">
          {uploading ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</> : <><Save size={14} /> Save Ordinance</>}
        </button>
        <button onClick={onCancel} className="btn-ghost"><X size={14} /> Cancel</button>
      </div>
    </div>
  )
}

export default function OrdinancesAdmin() {
  const { auth } = useAuth()
  const toast = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [filterCat, setFilterCat] = useState('all')

  useEffect(() => {
    fetch(`${API}/api/ordinances`)
      .then((r) => r.json()).then((d) => setItems(d.items || []))
      .catch(() => toast('Could not load ordinances', 'error'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(form) {
    const isEdit = !!form.id
    try {
      const res = await fetch(
        isEdit ? `${API}/api/ordinances?id=${form.id}` : `${API}/api/ordinances`,
        { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': auth.key }, body: JSON.stringify(form) }
      )
      if (!res.ok) throw new Error()
      const saved = await res.json()
      setItems((prev) => isEdit ? prev.map((x) => x.id === saved.id ? saved : x) : [saved, ...prev])
      setAdding(false); setEditingId(null)
      toast(isEdit ? 'Ordinance updated!' : 'Ordinance added!', 'success')
    } catch { toast('Save failed', 'error') }
  }

  async function handleDelete(item) {
    if (!confirm(`Remove ${item.number}?`)) return
    try {
      await fetch(`${API}/api/ordinances?id=${item.id}&category=${item.category}`, { method: 'DELETE', headers: { 'x-admin-key': auth.key } })
      setItems((prev) => prev.filter((x) => x.id !== item.id))
      toast('Ordinance removed', 'success')
    } catch { toast('Delete failed', 'error') }
  }

  const filtered = filterCat === 'all' ? items : items.filter((x) => x.category === filterCat)

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <p className="text-slate-400 text-sm">Manage village ordinances and attach PDF documents.</p>
        <div className="flex gap-2 flex-wrap">
          <select className="input py-2 w-36" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
          <button onClick={() => setAdding(true)} disabled={adding} className="btn-primary"><Plus size={15} /> Add Ordinance</button>
        </div>
      </div>
      {adding && <OrdForm onSave={handleSave} onCancel={() => setAdding(false)} adminKey={auth.key} />}
      {loading ? <div className="text-slate-500 text-sm">Loading…</div>
        : filtered.length === 0 ? <div className="card p-10 text-center text-slate-600">No ordinances found.</div>
        : filtered.map((item) => editingId === item.id
          ? <OrdForm key={item.id} item={item} onSave={handleSave} onCancel={() => setEditingId(null)} adminKey={auth.key} />
          : (
            <div key={item.id} className="card p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-orange-600/20 rounded-xl flex items-center justify-center flex-shrink-0"><BookOpen size={18} className="text-orange-400" /></div>
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2"><span className="font-mono text-xs text-slate-500">{item.number}</span><span className="badge bg-orange-600/20 text-orange-400">{item.category}</span><span className="text-slate-600 text-xs">{item.year}</span></div>
                <div className="text-white font-medium truncate">{item.title}</div>
                {item.summary && <div className="text-slate-500 text-xs truncate">{item.summary}</div>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {item.fileUrl && <a href={item.fileUrl} target="_blank" rel="noreferrer" className="btn-ghost py-1.5 px-3"><Download size={13} /></a>}
                <button onClick={() => setEditingId(item.id)} className="btn-ghost py-1.5 px-3"><Pencil size={13} /></button>
                <button onClick={() => handleDelete(item)} className="btn-danger py-1.5 px-3"><Trash2 size={13} /></button>
              </div>
            </div>
          )
        )
      }
    </div>
  )
}
