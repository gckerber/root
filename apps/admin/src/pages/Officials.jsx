// apps/admin/src/pages/Officials.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, Pencil, Trash2, Save, X, User, Tag } from 'lucide-react'
import { useAuth, useToast } from '../utils/context'

const API = 'https://func-village-prod.azurewebsites.net'
const TITLE_OPTIONS = ['Mayor', 'Village Council', 'Police Department', 'Other']

// ── Committee tag input ──────────────────────────────────────────────────────
const CHAIR_SUFFIX = ' (Chair)'
const isChair  = (tag) => tag.endsWith(CHAIR_SUFFIX)
const baseName = (tag) => isChair(tag) ? tag.slice(0, -CHAIR_SUFFIX.length) : tag

function CommitteeTagInput({ value = [], onChange }) {
  const [inputVal, setInputVal] = useState('')

  function addTag(raw) {
    // Strip any manually typed "(Chair)" — user should use the ★ button
    const tag = raw.trim().replace(/,+$/, '').replace(/\s*\(chair\)\s*$/i, '').trim()
    if (!tag) return
    const alreadyExists = value.some((t) => baseName(t).toLowerCase() === tag.toLowerCase())
    if (!alreadyExists) onChange([...value, tag])
    setInputVal('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(inputVal)
    } else if (e.key === 'Backspace' && inputVal === '' && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  function removeTag(tag) {
    onChange(value.filter((t) => t !== tag))
  }

  function toggleChair(tag) {
    onChange(value.map((t) =>
      t === tag
        ? isChair(t) ? baseName(t) : t + CHAIR_SUFFIX
        : t
    ))
  }

  return (
    <div>
      <label className="label flex items-center gap-1">
        <Tag size={12} /> Committees
        <span className="text-slate-600 font-normal normal-case text-xs ml-1">
          — type &amp; press Enter to add · click ★ to toggle chairperson
        </span>
      </label>
      <div className="min-h-[42px] rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 flex flex-wrap gap-1.5 items-center focus-within:border-blue-500 transition-colors">
        {value.map((tag) => {
          const chair = isChair(tag)
          return (
            <span
              key={tag}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                chair
                  ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                  : 'bg-blue-600/30 text-blue-300 border-blue-600/40'
              }`}
            >
              {/* Chair toggle star */}
              <button
                type="button"
                onClick={() => toggleChair(tag)}
                title={chair ? 'Remove chairperson' : 'Set as chairperson'}
                className={`transition-colors ${chair ? 'text-yellow-400 hover:text-yellow-200' : 'text-slate-600 hover:text-yellow-400'}`}
              >
                ★
              </button>
              {baseName(tag)}
              {chair && <span className="opacity-60 text-xs">(Chair)</span>}
              {/* Remove tag */}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-slate-500 hover:text-red-400 transition-colors ml-0.5"
              >
                <X size={10} />
              </button>
            </span>
          )
        })}
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => inputVal.trim() && addTag(inputVal)}
          placeholder={value.length === 0 ? 'Finance and Safety (Chair), Streets and Sidewalks…' : ''}
          className="flex-grow bg-transparent outline-none text-sm text-slate-200 placeholder-slate-600 min-w-[160px]"
        />
      </div>
    </div>
  )
}

// ── Official form ────────────────────────────────────────────────────────────
function OfficialForm({ official, onSave, onCancel, adminKey }) {
  const toast = useToast()
  const fileRef = useRef()
  const [form, setForm] = useState(official || {
    name: '', title: 'Village Council', bio: '', email: '',
    phone: '', photoUrl: '', order: 99, committees: [],
  })
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(official?.photoUrl || null)
  const [uploading, setUploading] = useState(false)

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  function handlePhotoSelect(e) {
    const file = e.target.files[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    if (!form.name?.trim() || !form.title?.trim()) {
      toast('Name and title are required', 'error')
      return
    }
    setUploading(true)
    try {
      let photoUrl = form.photoUrl

      if (photoFile) {
        const urlRes = await fetch(`${API}/api/upload-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
          body: JSON.stringify({ container: 'officials', filename: photoFile.name, contentType: photoFile.type }),
        })
        if (!urlRes.ok) throw new Error('Could not get upload URL')
        const { uploadUrl, publicUrl } = await urlRes.json()
        await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'x-ms-blob-type': 'BlockBlob', 'Content-Type': photoFile.type },
          body: photoFile,
        })
        photoUrl = publicUrl
      }

      await onSave({ ...form, photoUrl })
    } catch (err) {
      toast(err.message || 'Save failed', 'error')
    }
    setUploading(false)
  }

  return (
    <div className="bg-slate-800/60 rounded-xl p-4 space-y-3 border border-slate-700">
      {/* Photo + name/title row */}
      <div className="flex items-start gap-4">
        <div
          className="w-20 h-20 rounded-xl bg-slate-700 flex items-center justify-center cursor-pointer overflow-hidden flex-shrink-0 hover:bg-slate-600 transition-colors border-2 border-dashed border-slate-600"
          onClick={() => fileRef.current?.click()}
          title="Click to upload photo"
        >
          {photoPreview ? (
            <img src={photoPreview} alt="Photo" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center">
              <User size={20} className="text-slate-500 mx-auto" />
              <span className="text-slate-600 text-xs">Photo</span>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />

        <div className="flex-grow space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={form.name} onChange={f('name')} placeholder="Jane Smith" />
            </div>
            <div>
              <label className="label">Title / Role</label>
              <select className="input" value={form.title} onChange={f('title')}>
                {TITLE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Email Address</label>
              <input className="input" type="email" value={form.email} onChange={f('email')}
                placeholder="name@saintlouisvilleohio.gov" />
            </div>
            <div>
              <label className="label">Phone Number</label>
              <input className="input" type="tel" value={form.phone || ''} onChange={f('phone')}
                placeholder="(740) 000-0000" />
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="label">Bio</label>
        <textarea className="input resize-none" rows={2} value={form.bio} onChange={f('bio')}
          placeholder="A short description of this official's role and background…" />
      </div>

      {/* Committees — only show for council members */}
      {form.title === 'Village Council' && (
        <CommitteeTagInput
          value={form.committees || []}
          onChange={(committees) => setForm((p) => ({ ...p, committees }))}
        />
      )}

      <div className="flex gap-2 pt-1">
        <button onClick={handleSave} disabled={uploading} className="btn-primary">
          {uploading
            ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
            : <><Save size={14} /> Save</>}
        </button>
        <button onClick={onCancel} className="btn-ghost"><X size={14} /> Cancel</button>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function Officials() {
  const { auth } = useAuth()
  const toast = useToast()
  const [officials, setOfficials] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/officials`)
      .then((r) => r.json())
      .then((d) => { if (d.items?.length) setOfficials(d.items) })
      .catch(() => toast('Could not load officials', 'error'))
      .finally(() => setLoading(false))
  }, [])

  async function save(official) {
    const isNew = !official.id
    try {
      const url = isNew ? `${API}/api/officials` : `${API}/api/officials?id=${official.id}`
      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': auth.key },
        body: JSON.stringify(official),
      })
      if (!res.ok) throw new Error(await res.text())
      const saved = await res.json()
      setOfficials((prev) =>
        isNew ? [...prev, saved] : prev.map((o) => (o.id === saved.id ? saved : o))
      )
      setEditingId(null)
      setAdding(false)
      toast(isNew ? 'Official added!' : 'Official updated!', 'success')
    } catch (err) {
      toast('Save failed: ' + err.message, 'error')
    }
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
        <OfficialForm onSave={save} onCancel={() => setAdding(false)} adminKey={auth.key} />
      )}

      {officials.map((o) => (
        <div key={o.id} className="card">
          {editingId === o.id ? (
            <div className="p-4">
              <OfficialForm official={o} onSave={save} onCancel={() => setEditingId(null)} adminKey={auth.key} />
            </div>
          ) : (
            <div className="p-4 flex items-start gap-4">
              {o.photoUrl ? (
                <img src={o.photoUrl} alt={o.name}
                  className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                  onError={(e) => { e.target.style.display = 'none' }} />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400 font-bold text-sm flex-shrink-0">
                  {o.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
              )}
              <div className="flex-grow min-w-0">
                <div className="text-white font-medium leading-tight">{o.name}</div>
                <div className="text-slate-500 text-xs">{o.title}{o.email ? ` · ${o.email}` : ''}{o.phone ? ` · ${o.phone}` : ''}</div>
                {o.bio && <div className="text-slate-500 text-xs mt-0.5 truncate">{o.bio}</div>}
                {o.committees?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {o.committees.map((c) => (
                      <span key={c} className="bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-full px-2 py-0.5 text-xs">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
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
