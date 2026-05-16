// apps/admin/src/pages/HistoryAdmin.jsx
// Manage history page sections — each section has title, subtitle, body text,
// main photo, gallery photos, enable/disable toggle, and left/right photo side.
// Data is stored as JSON in the history API's "text" field (no backend changes needed).
import { useState, useEffect, useRef } from 'react'
import { Save, Plus, Trash2, Upload, Image, ChevronDown, ChevronUp, Eye, EyeOff, X, ArrowUp, ArrowDown } from 'lucide-react'
import { useAuth, useToast } from '../utils/context'

const API = 'https://func-village-prod.azurewebsites.net'

function newSection(order) {
  return {
    id: `s${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: '',
    subtitle: '',
    body: '',
    body2: '',
    mainPhotoUrl: '',
    galleryPhotos: [],
    enabled: true,
    order,
    photoSide: 'left',
  }
}

function parseData(raw) {
  try {
    const parsed = JSON.parse(raw || '{}')
    if (Array.isArray(parsed.sections)) return parsed
  } catch {}
  // Legacy: plain text in body field of first section
  return {
    pageTitle: 'History',
    sections: [
      {
        id: 's-legacy',
        title: 'Founded on the frontier',
        subtitle: 'Early History · 1837–1880',
        body: typeof raw === 'string' && !raw.startsWith('{') ? raw : '',
        body2: '',
        mainPhotoUrl: '',
        galleryPhotos: [],
        enabled: true,
        order: 0,
        photoSide: 'left',
      },
    ],
  }
}

// ── Single gallery photo thumbnail ───────────────────────────────────────────
function GalleryThumb({ photo, onRemove }) {
  return (
    <div className="relative group w-20 h-16 flex-shrink-0">
      <img src={photo.url} alt={photo.caption || ''} className="w-full h-full object-cover rounded-lg border border-slate-700" />
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-600 rounded-full text-white text-xs hidden group-hover:flex items-center justify-center"
      >×</button>
    </div>
  )
}

// ── Section editor (expanded) ────────────────────────────────────────────────
function SectionEditor({ section, onChange, onUploadMain, onUploadGallery, uploadingMain, uploadingGallery }) {
  const mainRef = useRef()
  const galleryRef = useRef()
  const f = (k) => (e) => onChange({ ...section, [k]: e.target.value })

  return (
    <div className="border-t border-slate-700 pt-4 mt-2 space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Section Title</label>
          <input className="input" value={section.title} onChange={f('title')} placeholder="e.g. Founded on the frontier" />
        </div>
        <div>
          <label className="label">Subtitle / Era Label</label>
          <input className="input" value={section.subtitle} onChange={f('subtitle')} placeholder="e.g. Early History · 1837–1880" />
        </div>
      </div>

      <div>
        <label className="label">Body Text (first paragraph)</label>
        <textarea className="input resize-y text-sm leading-relaxed" rows={4} value={section.body} onChange={f('body')}
          placeholder="Main text for this section..." />
      </div>

      <div>
        <label className="label">Body Text (second paragraph, optional)</label>
        <textarea className="input resize-y text-sm leading-relaxed" rows={3} value={section.body2} onChange={f('body2')}
          placeholder="Additional text..." />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {/* Main photo */}
        <div>
          <label className="label">Main Photo</label>
          <div className="flex items-center gap-3 mt-1">
            {section.mainPhotoUrl ? (
              <div className="relative group w-28 h-20 flex-shrink-0">
                <img src={section.mainPhotoUrl} alt="" className="w-full h-full object-cover rounded-lg border border-slate-700" />
                <button
                  type="button"
                  onClick={() => onChange({ ...section, mainPhotoUrl: '' })}
                  className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-600 rounded-full text-white text-xs hidden group-hover:flex items-center justify-center"
                >×</button>
              </div>
            ) : (
              <div className="w-28 h-20 border-2 border-dashed border-slate-700 rounded-lg flex items-center justify-center">
                <Image size={20} className="text-slate-600" />
              </div>
            )}
            <button type="button" onClick={() => mainRef.current?.click()} disabled={uploadingMain} className="btn-ghost text-sm flex items-center gap-1.5">
              {uploadingMain
                ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading…</>
                : <><Upload size={13} /> {section.mainPhotoUrl ? 'Replace' : 'Upload'}</>}
            </button>
            <input ref={mainRef} type="file" accept="image/*" onChange={(e) => onUploadMain(e, section.id)} className="hidden" />
          </div>
        </div>

        {/* Photo side */}
        <div>
          <label className="label">Photo Side</label>
          <div className="flex gap-2 mt-1">
            {['left', 'right'].map(side => (
              <button
                key={side}
                type="button"
                onClick={() => onChange({ ...section, photoSide: side })}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                  section.photoSide === side
                    ? 'bg-teal-600 border-teal-500 text-white'
                    : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Photo {side.charAt(0).toUpperCase() + side.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Gallery photos */}
      <div>
        <label className="label">Gallery Photos</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {section.galleryPhotos.map((photo, i) => (
            <GalleryThumb
              key={photo.url + i}
              photo={photo}
              onRemove={() => onChange({
                ...section,
                galleryPhotos: section.galleryPhotos.filter((_, idx) => idx !== i),
              })}
            />
          ))}
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            disabled={uploadingGallery}
            className="w-20 h-16 border-2 border-dashed border-slate-700 rounded-lg flex flex-col items-center justify-center gap-1 text-slate-500 hover:border-slate-500 hover:text-slate-400 transition-colors text-xs"
          >
            {uploadingGallery ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Upload size={14} /><span>Add</span></>}
          </button>
        </div>
        <input ref={galleryRef} type="file" accept="image/*" multiple onChange={(e) => onUploadGallery(e, section.id)} className="hidden" />
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function HistoryAdmin() {
  const { auth } = useAuth()
  const toast = useToast()

  const [pageTitle, setPageTitle] = useState('History')
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [uploadingMain, setUploadingMain] = useState(null)   // section id
  const [uploadingGallery, setUploadingGallery] = useState(null) // section id

  // Load existing data
  useEffect(() => {
    fetch(`${API}/api/history`)
      .then(r => r.json())
      .then(d => {
        const parsed = parseData(d.text)
        setPageTitle(parsed.pageTitle || 'History')
        setSections([...parsed.sections].sort((a, b) => a.order - b.order))
      })
      .catch(() => toast('Could not load history data', 'error'))
      .finally(() => setLoading(false))
  }, [])

  async function saveAll() {
    setSaving(true)
    try {
      const payload = { pageTitle, sections: sections.map((s, i) => ({ ...s, order: i })) }
      const res = await fetch(`${API}/api/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': auth.key },
        body: JSON.stringify({ text: JSON.stringify(payload) }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast('History saved!', 'success')
    } catch (err) {
      toast(err.message || 'Save failed', 'error')
    }
    setSaving(false)
  }

  async function uploadPhoto(file, container) {
    const urlRes = await fetch(`${API}/api/upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': auth.key },
      body: JSON.stringify({ container, filename: file.name, contentType: file.type }),
    })
    if (!urlRes.ok) throw new Error('Could not get upload URL')
    const { uploadUrl, publicUrl } = await urlRes.json()
    const up = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'x-ms-blob-type': 'BlockBlob', 'Content-Type': file.type },
      body: file,
    })
    if (!up.ok) throw new Error('Upload failed')
    return publicUrl
  }

  async function handleUploadMain(e, sectionId) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingMain(sectionId)
    e.target.value = ''
    try {
      const url = await uploadPhoto(file, 'photos')
      setSections(prev => prev.map(s => s.id === sectionId ? { ...s, mainPhotoUrl: url } : s))
      toast('Photo uploaded!', 'success')
    } catch (err) {
      toast(err.message || 'Upload failed', 'error')
    }
    setUploadingMain(null)
  }

  async function handleUploadGallery(e, sectionId) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploadingGallery(sectionId)
    e.target.value = ''
    try {
      const urls = await Promise.all(files.map(f => uploadPhoto(f, 'photos')))
      setSections(prev => prev.map(s => s.id === sectionId
        ? { ...s, galleryPhotos: [...s.galleryPhotos, ...urls.map(u => ({ url: u, caption: '' }))] }
        : s
      ))
      toast(`${urls.length} photo${urls.length !== 1 ? 's' : ''} added!`, 'success')
    } catch (err) {
      toast(err.message || 'Upload failed', 'error')
    }
    setUploadingGallery(null)
  }

  function updateSection(updated) {
    setSections(prev => prev.map(s => s.id === updated.id ? updated : s))
  }

  function moveSection(id, dir) {
    setSections(prev => {
      const arr = [...prev]
      const i = arr.findIndex(s => s.id === id)
      const j = i + dir
      if (j < 0 || j >= arr.length) return arr
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
      return arr
    })
  }

  function deleteSection(id) {
    if (!confirm('Remove this section?')) return
    setSections(prev => prev.filter(s => s.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  function addSection() {
    const s = newSection(sections.length)
    setSections(prev => [...prev, s])
    setExpandedId(s.id)
  }

  if (loading) return <div className="text-slate-500 text-sm">Loading history…</div>

  return (
    <div className="max-w-3xl space-y-4">
      {/* Page settings */}
      <div className="card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-grow">
            <label className="label">Page Title</label>
            <input
              className="input mt-1"
              value={pageTitle}
              onChange={e => setPageTitle(e.target.value)}
              placeholder="History"
            />
            <p className="text-slate-600 text-xs mt-1">Shown as the nav link and page heading (e.g. "History", "Photos", "Our Story")</p>
          </div>
          <button onClick={saveAll} disabled={saving} className="btn-primary self-end">
            {saving
              ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
              : <><Save size={14} /> Save All</>}
          </button>
        </div>
      </div>

      {/* Sections */}
      {sections.map((section, idx) => (
        <div key={section.id} className="card overflow-hidden">
          {/* Section header row */}
          <div className="p-4 flex items-center gap-3">
            {/* Reorder */}
            <div className="flex flex-col gap-0.5 flex-shrink-0">
              <button onClick={() => moveSection(section.id, -1)} disabled={idx === 0} className="btn-ghost py-0.5 px-1 disabled:opacity-30">
                <ArrowUp size={12} />
              </button>
              <button onClick={() => moveSection(section.id, 1)} disabled={idx === sections.length - 1} className="btn-ghost py-0.5 px-1 disabled:opacity-30">
                <ArrowDown size={12} />
              </button>
            </div>

            {/* Preview thumb */}
            {section.mainPhotoUrl ? (
              <img src={section.mainPhotoUrl} alt="" className="w-12 h-10 object-cover rounded-lg flex-shrink-0" />
            ) : (
              <div className="w-12 h-10 rounded-lg bg-teal-600/20 flex items-center justify-center flex-shrink-0">
                <Image size={16} className="text-teal-400" />
              </div>
            )}

            {/* Title + subtitle */}
            <div className="flex-grow min-w-0">
              <div className="text-white font-medium truncate">{section.title || <span className="text-slate-600 italic">Untitled section</span>}</div>
              {section.subtitle && <div className="text-slate-500 text-xs truncate">{section.subtitle}</div>}
              <div className="text-slate-600 text-xs">
                {section.galleryPhotos.length} gallery photo{section.galleryPhotos.length !== 1 ? 's' : ''} · photo {section.photoSide}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => updateSection({ ...section, enabled: !section.enabled })}
                className={`btn-ghost py-1.5 px-2 text-xs ${section.enabled ? 'text-teal-400' : 'text-slate-600'}`}
                title={section.enabled ? 'Visible — click to hide' : 'Hidden — click to show'}
              >
                {section.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
              <button
                onClick={() => setExpandedId(expandedId === section.id ? null : section.id)}
                className="btn-ghost py-1.5 px-2"
              >
                {expandedId === section.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                <span className="text-xs ml-1">Edit</span>
              </button>
              <button onClick={() => deleteSection(section.id)} className="btn-danger py-1.5 px-2">
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {/* Expanded editor */}
          {expandedId === section.id && (
            <div className="px-4 pb-4">
              <SectionEditor
                section={section}
                onChange={updateSection}
                onUploadMain={handleUploadMain}
                onUploadGallery={handleUploadGallery}
                uploadingMain={uploadingMain === section.id}
                uploadingGallery={uploadingGallery === section.id}
              />
            </div>
          )}
        </div>
      ))}

      {/* Add section */}
      <button onClick={addSection} className="btn-ghost w-full py-3 flex items-center justify-center gap-2 border border-dashed border-slate-700 hover:border-teal-600 hover:text-teal-400 transition-colors">
        <Plus size={16} /> Add Section
      </button>

      {/* Save reminder */}
      <p className="text-slate-600 text-xs text-center">Click "Save All" at the top to publish all changes.</p>
    </div>
  )
}
