// apps/admin/src/pages/PDOfficialsAdmin.jsx
// Manage Police Department officers. Shows only officials with department === 'police'.
import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, Save, X, User } from 'lucide-react'
import { useAuth, useToast } from '../utils/context'

const API = 'https://func-village-prod.azurewebsites.net'

// Suggested titles (used as a datalist — user can also type freely)
const TITLE_SUGGESTIONS = ['Chief of Police', 'Officer', 'Detective', 'Sergeant', 'Lieutenant', 'Captain', 'Deputy Chief']

function OfficerForm({ official, onSave, onCancel, adminKey }) {
  const toast = useToast()
  const fileRef = useRef()
  const [form, setForm] = useState(official ? {
    ...official,
    // Migrate old single phone to phoneWork for convenience
    phoneWork: official.phoneWork || official.phone || '',
    phoneCell: official.phoneCell || '',
    phoneHome: official.phoneHome || '',
  } : {
    name: '', title: 'Officer', bio: '', email: '',
    phoneWork: '', phoneCell: '', phoneHome: '',
    photoUrl: '', order: 99, department: 'police',
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
      await onSave({ ...form, photoUrl, department: 'police' })
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
              <label className="label">Title / Rank</label>
              <input
                className="input"
                value={form.title}
                onChange={f('title')}
                placeholder="Chief, Officer, Detective…"
                list="pd-title-suggestions"
              />
              <datalist id="pd-title-suggestions">
                {TITLE_SUGGESTIONS.map((t) => <option key={t} value={t} />)}
              </datalist>
            </div>
          </div>
          <div>
            <label className="label">Email Address</label>
            <input className="input" type="email" value={form.email || ''} onChange={f('email')}
              placeholder="name@saintlouisvilleohio.gov" />
          </div>
        </div>
      </div>

      <div>
        <label className="label">Bio</label>
        <textarea className="input resize-none" rows={2} value={form.bio || ''} onChange={f('bio')}
          placeholder="Brief description of this officer's role and background…" />
      </div>

      {/* Three phone fields */}
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="label">Work Phone</label>
          <input className="input" type="tel" value={form.phoneWork || ''} onChange={f('phoneWork')}
            placeholder="(740) 000-0000" />
        </div>
        <div>
          <label className="label">Cell Phone</label>
          <input className="input" type="tel" value={form.phoneCell || ''} onChange={f('phoneCell')}
            placeholder="(740) 000-0000" />
        </div>
        <div>
          <label className="label">Home Phone</label>
          <input className="input" type="tel" value={form.phoneHome || ''} onChange={f('phoneHome')}
            placeholder="(740) 000-0000" />
        </div>
      </div>

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

export default function PDOfficialsAdmin() {
  const { auth } = useAuth()
  const toast = useToast()
  const [officials, setOfficials] = useState([])
  const [loading, setLoading]   = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [adding, setAdding]     = useState(false)

  useEffect(() => {
    fetch(`${API}/api/officials`)
      .then((r) => r.json())
      .then((d) => {
        const pd = (d.items || [])
          .filter((o) => o.department === 'police')
          .sort((a, b) => a.order - b.order)
        setOfficials(pd)
      })
      .catch(() => toast('Could not load officers', 'error'))
      .finally(() => setLoading(false))
  }, [])

  async function save(official) {
    const isNew = !official.id
    try {
      const url = isNew ? `${API}/api/officials` : `${API}/api/officials?id=${official.id}`
      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': auth.key },
        body: JSON.stringify({ ...official, department: 'police' }),
      })
      if (!res.ok) throw new Error(await res.text())
      const saved = await res.json()
      setOfficials((prev) =>
        isNew ? [...prev, saved] : prev.map((o) => (o.id === saved.id ? saved : o))
      )
      setEditingId(null)
      setAdding(false)
      toast(isNew ? 'Officer added!' : 'Officer updated!', 'success')
    } catch (err) {
      toast('Save failed: ' + err.message, 'error')
    }
  }

  async function remove(id) {
    if (!confirm('Remove this officer from the website?')) return
    try {
      await fetch(`${API}/api/officials?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': auth.key },
      })
      setOfficials((prev) => prev.filter((o) => o.id !== id))
      toast('Officer removed', 'success')
    } catch {
      toast('Delete failed', 'error')
    }
  }

  if (loading) return <div className="text-slate-500 text-sm">Loading officers…</div>

  return (
    <div className="max-w-2xl space-y-3">
      <div className="flex items-center justify-between mb-6">
        <p className="text-slate-400 text-sm">
          Officers appear on the "Officers" tab of the Police Department page.
        </p>
        <button onClick={() => setAdding(true)} className="btn-primary" disabled={adding}>
          <Plus size={15} /> Add Officer
        </button>
      </div>

      {adding && (
        <OfficerForm onSave={save} onCancel={() => setAdding(false)} adminKey={auth.key} />
      )}

      {officials.map((o) => (
        <div key={o.id} className="card">
          {editingId === o.id ? (
            <div className="p-4">
              <OfficerForm official={o} onSave={save} onCancel={() => setEditingId(null)} adminKey={auth.key} />
            </div>
          ) : (
            <div className="p-4 flex items-start gap-4">
              {o.photoUrl ? (
                <img src={o.photoUrl} alt={o.name}
                  className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                  onError={(e) => { e.target.style.display = 'none' }} />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-amber-600/20 flex items-center justify-center text-amber-400 font-bold text-sm flex-shrink-0">
                  {o.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
              )}
              <div className="flex-grow min-w-0">
                <div className="text-white font-medium leading-tight">{o.name}</div>
                <div className="text-amber-400 text-xs font-medium">{o.title}</div>
                {o.email && <div className="text-slate-600 text-xs mt-0.5">{o.email}</div>}
                <div className="flex flex-wrap gap-x-3 text-slate-600 text-xs mt-0.5">
                  {(o.phoneWork || o.phone) && <span>Work: {o.phoneWork || o.phone}</span>}
                  {o.phoneCell && <span>Cell: {o.phoneCell}</span>}
                  {o.phoneHome && <span>Home: {o.phoneHome}</span>}
                </div>
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

      {officials.length === 0 && !adding && (
        <div className="card p-10 text-center text-slate-600">
          No officers yet. Click "Add Officer" to get started.
        </div>
      )}
    </div>
  )
}
