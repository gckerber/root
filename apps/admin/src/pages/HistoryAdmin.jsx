// src/pages/HistoryAdmin.jsx
import { useState, useEffect, useRef } from 'react'
import { Save, Plus, Trash2, Upload, Image, Camera, X } from 'lucide-react'
import { useAuth, useToast } from '../utils/context'

const API = 'https://func-village-prod.azurewebsites.net'

export default function HistoryAdmin() {
  const { auth } = useAuth()
  const toast = useToast()
  const fileRef = useRef()

  const [historyText, setHistoryText] = useState('')
  const [savingText, setSavingText] = useState(false)
  const [photos, setPhotos] = useState([])
  const [loadingPhotos, setLoadingPhotos] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [newPhoto, setNewPhoto] = useState({ file: null, preview: null, caption: '', year: '' })

  // Load history text
  useEffect(() => {
    fetch(`${API}/api/history`)
      .then((r) => r.json())
      .then((d) => setHistoryText(d.text || ''))
      .catch(() => {})
  }, [])

  // Load photos
  useEffect(() => {
    fetch(`${API}/api/photos`)
      .then((r) => r.json())
      .then((d) => setPhotos(d.items || []))
      .catch(() => toast('Could not load photos', 'error'))
      .finally(() => setLoadingPhotos(false))
  }, [])

  async function saveHistoryText() {
    setSavingText(true)
    try {
      const res = await fetch(`${API}/api/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': auth.key },
        body: JSON.stringify({ text: historyText }),
      })
      if (!res.ok) throw new Error()
      toast('History text saved!', 'success')
    } catch { toast('Save failed', 'error') }
    setSavingText(false)
  }

  function handleFileSelect(e) {
    const file = e.target.files[0]
    if (!file) return
    setNewPhoto((p) => ({ ...p, file, preview: URL.createObjectURL(file) }))
  }

  async function handlePhotoUpload() {
    if (!newPhoto.file || !newPhoto.caption.trim()) {
      toast('Please select a photo and add a caption', 'error')
      return
    }
    setUploading(true)
    try {
      const urlRes = await fetch(`${API}/api/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': auth.key },
        body: JSON.stringify({ container: 'photos', filename: newPhoto.file.name, contentType: newPhoto.file.type }),
      })
      if (!urlRes.ok) throw new Error('Could not get upload URL')
      const { uploadUrl, publicUrl } = await urlRes.json()

      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'x-ms-blob-type': 'BlockBlob', 'Content-Type': newPhoto.file.type },
        body: newPhoto.file,
      })

      const res = await fetch(`${API}/api/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': auth.key },
        body: JSON.stringify({ caption: newPhoto.caption, year: newPhoto.year ? parseInt(newPhoto.year) : null, url: publicUrl }),
      })
      const saved = await res.json()
      setPhotos((prev) => [...prev, saved])
      setNewPhoto({ file: null, preview: null, caption: '', year: '' })
      toast('Photo added to gallery!', 'success')
    } catch (err) { toast(err.message || 'Upload failed', 'error') }
    setUploading(false)
  }

  async function handleDeletePhoto(photo) {
    if (!confirm(`Remove "${photo.caption}" from the gallery?`)) return
    try {
      await fetch(`${API}/api/photos?id=${photo.id}`, { method: 'DELETE', headers: { 'x-admin-key': auth.key } })
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
      toast('Photo removed', 'success')
    } catch { toast('Delete failed', 'error') }
  }

  return (
    <div className="max-w-3xl space-y-8">
      {/* ── History paragraph ── */}
      <div className="card p-6">
        <h2 className="text-white font-semibold mb-1 flex items-center gap-2">
          <Camera size={18} className="text-teal-400" /> Village History Paragraph
        </h2>
        <p className="text-slate-500 text-sm mb-4">
          This text appears at the top of the History page. Tell the story of Saint Louisville here.
        </p>
        <textarea
          className="input resize-y text-sm leading-relaxed"
          rows={6}
          value={historyText}
          onChange={(e) => setHistoryText(e.target.value)}
          placeholder="Saint Louisville was established in 1833 in Licking County, Ohio..."
        />
        <div className="mt-3">
          <button onClick={saveHistoryText} disabled={savingText} className="btn-primary">
            {savingText
              ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
              : <><Save size={14} /> Save History Text</>}
          </button>
        </div>
      </div>

      {/* ── Add new photo ── */}
      <div className="card p-6">
        <h2 className="text-white font-semibold mb-1 flex items-center gap-2">
          <Plus size={18} className="text-teal-400" /> Add Photo to Gallery
        </h2>
        <p className="text-slate-500 text-sm mb-4">Upload a historical or community photo. Add a caption so residents know what they're looking at.</p>

        <div
          className="border-2 border-dashed border-slate-700 rounded-xl aspect-video mb-4 flex items-center justify-center cursor-pointer hover:border-slate-600 transition-colors overflow-hidden relative group"
          onClick={() => fileRef.current?.click()}
        >
          {newPhoto.preview ? (
            <>
              <img src={newPhoto.preview} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="bg-white/20 backdrop-blur rounded-xl px-4 py-2 text-white text-sm">Click to change photo</span>
              </div>
            </>
          ) : (
            <div className="text-center p-8">
              <Image size={36} className="text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm font-medium">Click to select a photo</p>
              <p className="text-slate-600 text-xs mt-1">JPG, PNG or WebP</p>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

        <div className="grid sm:grid-cols-3 gap-3 mb-3">
          <div className="sm:col-span-2">
            <label className="label">Caption <span className="text-red-400">*</span></label>
            <input className="input" value={newPhoto.caption} onChange={(e) => setNewPhoto((p) => ({ ...p, caption: e.target.value }))} placeholder="e.g. Main Street looking north, circa 1920" />
          </div>
          <div>
            <label className="label">Year (optional)</label>
            <input className="input" type="number" value={newPhoto.year} onChange={(e) => setNewPhoto((p) => ({ ...p, year: e.target.value }))} placeholder="1955" min="1800" max={new Date().getFullYear()} />
          </div>
        </div>

        <button onClick={handlePhotoUpload} disabled={uploading || !newPhoto.file} className="btn-primary">
          {uploading
            ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading…</>
            : <><Upload size={14} /> Add to Gallery</>}
        </button>
      </div>

      {/* ── Photo gallery management ── */}
      <div>
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Image size={18} className="text-teal-400" /> Gallery Photos ({photos.length})
        </h2>
        {loadingPhotos ? (
          <div className="text-slate-500 text-sm">Loading photos…</div>
        ) : photos.length === 0 ? (
          <div className="card p-10 text-center text-slate-600">No photos yet. Upload one above to get started.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group rounded-xl overflow-hidden bg-slate-800 aspect-square">
                <img
                  src={photo.url}
                  alt={photo.caption}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = 'https://placehold.co/400x400/1e293b/475569?text=Photo' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                  <p className="text-white text-xs font-medium line-clamp-2 mb-2">{photo.caption}</p>
                  {photo.year && <p className="text-white/60 text-xs mb-2">~{photo.year}</p>}
                  <button
                    onClick={() => handleDeletePhoto(photo)}
                    className="self-start flex items-center gap-1.5 px-2 py-1 bg-red-600/80 hover:bg-red-600 rounded-lg text-white text-xs transition-colors"
                  >
                    <Trash2 size={11} /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
