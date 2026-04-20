// src/pages/HeroEditor.jsx
import { useState, useRef } from 'react'
import { Upload, Image, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth, useToast } from '../utils/context'

const API = import.meta.env.VITE_API_BASE_URL || ''

export default function HeroEditor() {
  const { auth } = useAuth()
  const toast = useToast()
  const fileRef = useRef()
  const [preview, setPreview] = useState(null)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)

  function handleFilePick(e) {
    const f = e.target.files[0]
    if (!f) return
    if (!f.type.startsWith('image/')) {
      toast('Please select an image file (JPG, PNG, WebP)', 'error')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      toast('Image must be under 10MB. Try compressing at squoosh.app first.', 'error')
      return
    }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setDone(false)
  }

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    try {
      // Get a SAS upload URL from the API
      const res = await fetch(`${API}/api/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': auth.key },
        body: JSON.stringify({ container: 'hero', filename: 'hero.jpg', contentType: file.type }),
      })
      if (!res.ok) throw new Error('Could not get upload URL')
      const { uploadUrl } = await res.json()

      // Upload directly to Azure Blob Storage
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'x-ms-blob-type': 'BlockBlob', 'Content-Type': file.type },
        body: file,
      })
      if (!uploadRes.ok) throw new Error('Upload failed')

      setDone(true)
      toast('Hero image updated! It will appear on the site within a minute.', 'success')
    } catch (err) {
      toast(err.message || 'Upload failed — please try again', 'error')
    }
    setUploading(false)
  }

  return (
    <div className="max-w-2xl">
      <div className="card p-6 mb-4">
        <h2 className="text-white font-semibold mb-1">Current Hero Image</h2>
        <p className="text-slate-500 text-sm mb-5">
          This is the large photo residents see at the top of the homepage. Use a wide landscape shot of the village — aerial views, Main Street, or a landmark work best.
        </p>

        {/* Current image preview */}
        <div
          className="relative w-full aspect-video bg-slate-800 rounded-xl overflow-hidden border-2 border-dashed border-slate-700 mb-5 flex items-center justify-center cursor-pointer group"
          onClick={() => fileRef.current?.click()}
        >
          {preview ? (
            <>
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-2 text-white text-sm font-medium flex items-center gap-2">
                  <Upload size={15} /> Click to change photo
                </div>
              </div>
            </>
          ) : (
            <div className="text-center p-8">
              <Image size={40} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium mb-1">Click to select a photo</p>
              <p className="text-slate-600 text-sm">JPG, PNG or WebP · Max 10MB</p>
              <p className="text-slate-600 text-xs mt-2">Recommended: 1920×1080px or larger</p>
            </div>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFilePick}
          className="hidden"
        />

        {/* File info */}
        {file && (
          <div className="bg-slate-800 rounded-xl px-4 py-3 mb-4 flex items-center gap-3 text-sm">
            <Image size={16} className="text-purple-400 flex-shrink-0" />
            <div className="flex-grow min-w-0">
              <div className="text-white font-medium truncate">{file.name}</div>
              <div className="text-slate-500">{(file.size / 1024 / 1024).toFixed(1)} MB</div>
            </div>
            {done && <CheckCircle size={18} className="text-green-400 flex-shrink-0" />}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => fileRef.current?.click()} className="btn-ghost">
            <Upload size={15} /> Choose Photo
          </button>
          {file && !done && (
            <button onClick={handleUpload} disabled={uploading} className="btn-primary">
              {uploading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading…</>
              ) : (
                <><Upload size={15} /> Save as Hero Image</>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="bg-blue-600/10 border border-blue-600/20 rounded-xl p-4 text-sm text-blue-300">
        <div className="font-medium mb-1 flex items-center gap-2"><AlertCircle size={14} /> Tips for a great hero photo</div>
        <ul className="text-blue-400 space-y-1 text-xs list-disc list-inside">
          <li>Wide landscape photos (horizontal) look best</li>
          <li>Avoid photos with text overlaid — it will be covered by the village name</li>
          <li>Bright, well-lit photos show up better on all screens</li>
          <li>Compress large files at <a href="https://squoosh.app" target="_blank" rel="noreferrer" className="underline">squoosh.app</a> before uploading</li>
          <li>Ohio aerial imagery is free at <a href="https://geodata.ohio.gov" target="_blank" rel="noreferrer" className="underline">geodata.ohio.gov</a></li>
        </ul>
      </div>
    </div>
  )
}
