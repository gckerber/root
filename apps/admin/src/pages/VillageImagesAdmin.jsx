// apps/admin/src/pages/VillageImagesAdmin.jsx
// Manage the village homepage hero carousel images.
import { useState, useEffect, useRef } from 'react'
import { Trash2, ArrowUp, ArrowDown, Upload } from 'lucide-react'
import { useAuth, useToast } from '../utils/context'

const API = 'https://func-village-prod.azurewebsites.net'

export default function VillageImagesAdmin() {
  const { auth } = useAuth()
  const toast = useToast()
  const [images,   setImages]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    fetch(`${API}/api/village-images`, { headers: { 'x-admin-key': auth.key } })
      .then(r => r.json())
      .then(d => setImages(d.items || []))
      .catch(() => toast('Could not load images', 'error'))
      .finally(() => setLoading(false))
  }, [])

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast('Please select an image file', 'error'); return }
    setUploading(true)
    try {
      // 1. Get SAS upload URL using the generic upload-url endpoint
      const sasRes = await fetch(`${API}/api/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': auth.key },
        body: JSON.stringify({ container: 'village-images', filename: file.name, contentType: file.type }),
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
      const saveRes = await fetch(`${API}/api/village-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': auth.key },
        body: JSON.stringify({ url: publicUrl, caption: '', order: images.length }),
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
      const res = await fetch(`${API}/api/village-images?id=${img.id}`, {
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
    await Promise.all([a, b].map(item =>
      fetch(`${API}/api/village-images?id=${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': auth.key },
        body: JSON.stringify(item),
      })
    ))
    setImages(prev => prev.map(x => x.id === a.id ? a : x.id === b.id ? b : x))
  }

  async function handleDelete(img) {
    if (!confirm('Remove this image from the carousel?')) return
    try {
      await fetch(`${API}/api/village-images?id=${img.id}`, {
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
        <p className="text-slate-400 text-sm">
          Images rotate automatically in the homepage hero carousel. Use wide landscape shots for best results.
          {images.length === 0 && ' The single hero.jpg will be used as a fallback until images are added here.'}
        </p>
        <button onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-primary">
          {uploading
            ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading…</>
            : <><Upload size={15} /> Upload Image</>}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </div>

      {loading ? (
        <div className="text-slate-500 text-sm">Loading images…</div>
      ) : sorted.length === 0 ? (
        <div className="card p-10 text-center text-slate-600">
          No images yet. Upload your first photo to start the carousel.
        </div>
      ) : (
        sorted.map((img, idx) => (
          <div key={img.id} className="card p-3 flex items-center gap-3">
            <img src={img.url} alt="" className="w-24 h-16 object-cover rounded-lg flex-shrink-0 bg-slate-800" />
            <input
              className="input flex-grow text-sm py-1.5"
              placeholder="Caption (optional — shown on hover)"
              defaultValue={img.caption || ''}
              onBlur={e => { if (e.target.value !== img.caption) handleCaptionChange(img, e.target.value) }}
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
