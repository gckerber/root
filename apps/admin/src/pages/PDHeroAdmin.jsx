// apps/admin/src/pages/PDHeroAdmin.jsx
// Manage PD site hero carousel images — upload to blob storage, save URL to Cosmos
import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Image, ArrowUp, ArrowDown, Upload } from 'lucide-react'
import { useAuth, useToast } from '../utils/context'

const PD_API = import.meta.env.VITE_PD_API_URL || 'https://func-village-prod.azurewebsites.net'

const DEMO_IMAGES = [
  { id: 'demo-1', url: 'https://picsum.photos/seed/slpd1/1400/700', caption: 'Placeholder 1 — upload your own photos to replace' },
  { id: 'demo-2', url: 'https://picsum.photos/seed/slpd2/1400/700', caption: 'Placeholder 2' },
  { id: 'demo-3', url: 'https://picsum.photos/seed/slpd3/1400/700', caption: 'Placeholder 3' },
]

export default function PDHeroAdmin() {
  const { auth } = useAuth()
  const toast = useToast()
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    fetch(`${PD_API}/api/pd-images`, { headers: { 'x-admin-key': auth.key } })
      .then(r => r.json())
      .then(d => setImages(d.items || []))
      .catch(() => toast('Could not load images', 'error'))
      .finally(() => setLoading(false))
  }, [])

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast('Please select an image file', 'error')
      return
    }
    setUploading(true)
    try {
      // 1. Get SAS upload URL
      const sasRes = await fetch(`${PD_API}/api/pd-upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': auth.key },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      })
      if (!sasRes.ok) throw new Error('Could not get upload URL')
      const { uploadUrl, publicUrl } = await sasRes.json()

      // 2. Upload directly to blob storage
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'x-ms-blob-type': 'BlockBlob', 'Content-Type': file.type },
        body: file,
      })
      if (!uploadRes.ok) throw new Error('Upload to storage failed')

      // 3. Save record to Cosmos
      const order = images.length
      const saveRes = await fetch(`${PD_API}/api/pd-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': auth.key },
        body: JSON.stringify({ url: publicUrl, caption: '', order }),
      })
      if (!saveRes.ok) throw new Error(await saveRes.text())
      const saved = await saveRes.json()
      setImages(prev => [...prev, saved])
      toast('Image uploaded!', 'success')
    } catch (err) {
      toast(err.message || 'Upload failed', 'error')
    }
    setUploading(false)
    e.target.value = ''
  }

  async function handleCaptionChange(img, caption) {
    try {
      const res = await fetch(`${PD_API}/api/pd-images?id=${img.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': auth.key },
        body: JSON.stringify({ ...img, caption }),
      })
      if (!res.ok) throw new Error(await res.text())
      const updated = await res.json()
      setImages(prev => prev.map(i => i.id === updated.id ? updated : i))
    } catch (err) {
      toast('Could not update caption: ' + err.message, 'error')
    }
  }

  async function handleMove(img, direction) {
    const sorted = [...images].sort((a, b) => a.order - b.order)
    const i = sorted.findIndex(x => x.id === img.id)
    const j = direction === 'up' ? i - 1 : i + 1
    if (j < 0 || j >= sorted.length) return
    const a = { ...sorted[i], order: j }
    const b = { ...sorted[j], order: i }
    const updates = [a, b].map(item =>
      fetch(`${PD_API}/api/pd-images?id=${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': auth.key },
        body: JSON.stringify(item),
      })
    )
    await Promise.all(updates)
    setImages(prev => prev.map(x => x.id === a.id ? a : x.id === b.id ? b : x))
  }

  async function handleDelete(img) {
    if (!confirm('Remove this image from the carousel?')) return
    try {
      await fetch(`${PD_API}/api/pd-images?id=${img.id}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': auth.key },
      })
      setImages(prev => prev.filter(i => i.id !== img.id))
      toast('Image removed', 'success')
    } catch {
      toast('Delete failed', 'error')
    }
  }

  const sorted = [...images].sort((a, b) => a.order - b.order)

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <p className="text-slate-400 text-sm">Images rotate automatically in the PD site hero section. Add up to 8–10 for best effect.</p>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="btn-primary"
        >
          {uploading
            ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading…</>
            : <><Upload size={15} /> Upload Image</>}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </div>

      {loading ? (
        <div className="text-slate-500 text-sm">Loading images…</div>
      ) : sorted.length === 0 ? (
        <div className="space-y-3">
          <div className="card p-3 border-amber-600/20 bg-amber-600/5">
            <p className="text-amber-400 text-xs font-semibold">Showing placeholder images — upload your own photos to replace these</p>
          </div>
          {DEMO_IMAGES.map(img => (
            <div key={img.id} className="card p-3 flex items-center gap-3 opacity-60">
              <img src={img.url} alt="" className="w-20 h-14 object-cover rounded-lg flex-shrink-0 bg-slate-800" />
              <span className="text-slate-500 text-sm flex-grow">{img.caption}</span>
            </div>
          ))}
        </div>
      ) : (
        sorted.map((img, idx) => (
          <div key={img.id} className="card p-3 flex items-center gap-3">
            <img src={img.url} alt="" className="w-20 h-14 object-cover rounded-lg flex-shrink-0 bg-slate-800" />
            <input
              className="input flex-grow text-sm py-1.5"
              placeholder="Caption (optional)"
              defaultValue={img.caption || ''}
              onBlur={e => {
                if (e.target.value !== img.caption) handleCaptionChange(img, e.target.value)
              }}
            />
            <div className="flex flex-col gap-1 flex-shrink-0">
              <button onClick={() => handleMove(img, 'up')} disabled={idx === 0} className="btn-ghost py-1 px-1.5 disabled:opacity-30">
                <ArrowUp size={13} />
              </button>
              <button onClick={() => handleMove(img, 'down')} disabled={idx === sorted.length - 1} className="btn-ghost py-1 px-1.5 disabled:opacity-30">
                <ArrowDown size={13} />
              </button>
            </div>
            <button onClick={() => handleDelete(img)} className="btn-danger py-1.5 px-3 flex-shrink-0">
              <Trash2 size={13} />
            </button>
          </div>
        ))
      )}
    </div>
  )
}
