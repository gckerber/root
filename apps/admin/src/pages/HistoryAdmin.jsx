// apps/admin/src/pages/HistoryAdmin.jsx
import { useState, useEffect, useRef } from 'react'
import { Save, Plus, Trash2, Upload, Image, ChevronDown, ChevronUp,
         Eye, EyeOff, ArrowUp, ArrowDown, BarChart2 } from 'lucide-react'
import { useAuth, useToast } from '../utils/context'

const API = 'https://func-village-prod.azurewebsites.net'

function newEraSection(order) {
  return {
    id: `s${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: 'era',
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

function newPollSection(order) {
  return {
    id: `p${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: 'poll',
    question: '',
    options: [''],
    photoUrl: '',
    allowCustom: false,
    adminNote: '',
    enabled: true,
    order,
  }
}

function parseData(raw) {
  try {
    const parsed = JSON.parse(raw || '{}')
    if (Array.isArray(parsed.sections)) return parsed
  } catch {}
  return {
    pageTitle: 'Fun Stuff',
    sections: [
      {
        id: 's-legacy', type: 'era',
        title: 'Founded on the frontier', subtitle: 'Early History · 1837–1880',
        body: typeof raw === 'string' && !raw.startsWith('{') ? raw : '',
        body2: '', mainPhotoUrl: '', galleryPhotos: [], enabled: true, order: 0, photoSide: 'left',
      },
    ],
  }
}

// ── Gallery thumbnail ─────────────────────────────────────────────────────────
function GalleryThumb({ photo, onRemove }) {
  return (
    <div className="relative group w-20 h-16 flex-shrink-0">
      <img src={photo.url} alt={photo.caption || ''} className="w-full h-full object-cover rounded-lg border border-slate-700" />
      <button type="button" onClick={onRemove}
        className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-600 rounded-full text-white text-xs hidden group-hover:flex items-center justify-center">
        ×
      </button>
    </div>
  )
}

// ── Era section editor ────────────────────────────────────────────────────────
function EraEditor({ section, onChange, onUploadMain, onUploadGallery, uploadingMain, uploadingGallery }) {
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
        <textarea className="input resize-y text-sm leading-relaxed" rows={4} value={section.body} onChange={f('body')} placeholder="Main text for this section..." />
      </div>
      <div>
        <label className="label">Body Text (second paragraph, optional)</label>
        <textarea className="input resize-y text-sm leading-relaxed" rows={3} value={section.body2} onChange={f('body2')} placeholder="Additional text..." />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Main Photo</label>
          <div className="flex items-center gap-3 mt-1">
            {section.mainPhotoUrl ? (
              <div className="relative group w-28 h-20 flex-shrink-0">
                <img src={section.mainPhotoUrl} alt="" className="w-full h-full object-cover rounded-lg border border-slate-700" />
                <button type="button" onClick={() => onChange({ ...section, mainPhotoUrl: '' })}
                  className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-600 rounded-full text-white text-xs hidden group-hover:flex items-center justify-center">
                  ×
                </button>
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
        <div>
          <label className="label">Photo Side</label>
          <div className="flex gap-2 mt-1">
            {['left', 'right'].map(side => (
              <button key={side} type="button" onClick={() => onChange({ ...section, photoSide: side })}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                  section.photoSide === side
                    ? 'bg-teal-600 border-teal-500 text-white'
                    : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                }`}>
                Photo {side.charAt(0).toUpperCase() + side.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div>
        <label className="label">Gallery Photos</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {section.galleryPhotos.map((photo, i) => (
            <GalleryThumb key={photo.url + i} photo={photo}
              onRemove={() => onChange({ ...section, galleryPhotos: section.galleryPhotos.filter((_, idx) => idx !== i) })} />
          ))}
          <button type="button" onClick={() => galleryRef.current?.click()} disabled={uploadingGallery}
            className="w-20 h-16 border-2 border-dashed border-slate-700 rounded-lg flex flex-col items-center justify-center gap-1 text-slate-500 hover:border-slate-500 hover:text-slate-400 transition-colors text-xs">
            {uploadingGallery ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Upload size={14} /><span>Add</span></>}
          </button>
        </div>
        <input ref={galleryRef} type="file" accept="image/*" multiple onChange={(e) => onUploadGallery(e, section.id)} className="hidden" />
      </div>
    </div>
  )
}

// ── Poll responses viewer (admin) ────────────────────────────────────────────
function PollResponses({ section, adminKey }) {
  const [responses, setResponses] = useState(null)
  const [loading, setLoading]     = useState(true)
  const [resetting, setResetting] = useState(false)
  const [deleting, setDeleting]   = useState(null)

  function load() {
    setLoading(true)
    fetch(`${API}/api/poll-responses?pollId=${section.id}`, {
      headers: { 'x-admin-key': adminKey },
    })
      .then(r => r.json())
      .then(d => setResponses(d))
      .catch(() => setResponses(null))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [section.id])

  async function handleReset() {
    if (!confirm(`Reset all votes for this poll? This cannot be undone.`)) return
    setResetting(true)
    try {
      const res = await fetch(`${API}/api/poll-responses?pollId=${section.id}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': adminKey },
      })
      if (!res.ok) throw new Error('Reset failed')
      load()
    } catch {}
    setResetting(false)
  }

  async function handleDeleteResponse(id) {
    if (!confirm('Delete this response?')) return
    setDeleting(id)
    try {
      await fetch(`${API}/api/poll-responses?id=${id}&pollId=${section.id}`, { method: 'DELETE' })
      load()
    } catch {}
    setDeleting(null)
  }

  const total  = responses?.total ?? 0
  const counts = responses?.voteCounts ?? []
  const custom = responses?.publicCustom ?? []

  return (
    <div className="mt-4 pt-4 border-t border-slate-700 space-y-4">
      <div className="flex items-center justify-between">
        <span className="label text-slate-400">Poll Responses · {loading ? '…' : total} total</span>
        <div className="flex gap-2">
          <button onClick={load} className="btn-ghost text-xs py-1 px-2">Refresh</button>
          <button onClick={handleReset} disabled={resetting || total === 0} className="btn-danger text-xs py-1 px-2 disabled:opacity-40">
            {resetting ? 'Resetting…' : 'Reset Poll'}
          </button>
        </div>
      </div>

      {/* Vote counts */}
      {!loading && (
        <div className="space-y-2">
          {(section.options || []).map((opt, i) => {
            const count = counts[i] ?? 0
            const pct   = total > 0 ? Math.round((count / total) * 100) : 0
            return (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">{opt}</span>
                  <span className="text-slate-500">{pct}% ({count})</span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
          {custom.length > 0 && (
            <div className="pt-2 space-y-2">
              <p className="label text-slate-500">Written answers ({custom.length})</p>
              {custom.map((r, i) => (
                <div key={r.id ?? i} className="bg-slate-800 rounded-lg p-3 border-l-2 border-yellow-500">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-slate-300 text-sm">"{r.text}"</p>
                    {r.id && (
                      <button
                        onClick={() => handleDeleteResponse(r.id)}
                        disabled={deleting === r.id}
                        className="btn-danger text-xs py-0.5 px-1.5 flex-shrink-0 disabled:opacity-40"
                        title="Delete this response"
                      >
                        {deleting === r.id ? '…' : '✕'}
                      </button>
                    )}
                  </div>
                  <p className="text-slate-600 text-xs mt-1">
                    — {r.name} · {r.isPublic ? 'public' : 'private'}
                    {r.createdAt && <span className="ml-2 text-slate-700">{new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                  </p>
                </div>
              ))}
            </div>
          )}
          {total === 0 && <p className="text-slate-600 text-xs">No votes yet.</p>}
        </div>
      )}
    </div>
  )
}

// ── Poll section editor ───────────────────────────────────────────────────────
function PollEditor({ section, onChange, onUploadPollPhoto, uploadingPollPhoto, adminKey }) {
  const photoRef = useRef()

  function setQuestion(e) { onChange({ ...section, question: e.target.value }) }
  function setOption(i, val) {
    const opts = [...section.options]
    opts[i] = val
    onChange({ ...section, options: opts })
  }
  function addOption() {
    if (section.options.length >= 8) return
    onChange({ ...section, options: [...section.options, ''] })
  }
  function removeOption(i) {
    if (section.options.length <= 1) return
    onChange({ ...section, options: section.options.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="border-t border-slate-700 pt-4 mt-2 space-y-4">
      <div>
        <label className="label">Poll Question</label>
        <input className="input" value={section.question} onChange={setQuestion} placeholder="e.g. What do you think of our new website?" />
      </div>

      <div>
        <label className="label">Answer Options (1–8, or 0 if written-only)</label>
        <div className="space-y-2 mt-1">
          {section.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-slate-600 text-xs w-5 text-right">{i + 1}.</span>
              <input className="input flex-grow" value={opt} onChange={e => setOption(i, e.target.value)} placeholder={`Option ${i + 1}`} />
              {section.options.length > 2 && (
                <button type="button" onClick={() => removeOption(i)} className="btn-danger py-1.5 px-2 text-xs">✕</button>
              )}
            </div>
          ))}
        </div>
        {section.options.length < 8 && (
          <button type="button" onClick={addOption} className="btn-ghost text-sm mt-2 flex items-center gap-1.5">
            <Plus size={13} /> Add Option
          </button>
        )}
      </div>

      <div>
        <label className="label">Optional Photo</label>
        <div className="flex items-center gap-3 mt-1">
          {section.photoUrl ? (
            <div className="relative group w-28 h-20 flex-shrink-0">
              <img src={section.photoUrl} alt="" className="w-full h-full object-cover rounded-lg border border-slate-700" />
              <button type="button" onClick={() => onChange({ ...section, photoUrl: '' })}
                className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-600 rounded-full text-white text-xs hidden group-hover:flex items-center justify-center">
                ×
              </button>
            </div>
          ) : (
            <div className="w-28 h-20 border-2 border-dashed border-slate-700 rounded-lg flex items-center justify-center">
              <Image size={20} className="text-slate-600" />
            </div>
          )}
          <button type="button" onClick={() => photoRef.current?.click()} disabled={uploadingPollPhoto} className="btn-ghost text-sm flex items-center gap-1.5">
            {uploadingPollPhoto
              ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading…</>
              : <><Upload size={13} /> {section.photoUrl ? 'Replace' : 'Upload'}</>}
          </button>
          <input ref={photoRef} type="file" accept="image/*" onChange={(e) => onUploadPollPhoto(e, section.id)} className="hidden" />
        </div>
      </div>

      <div>
        <label className="label">Admin Note <span className="text-slate-600 normal-case font-normal">(optional — shown publicly on the poll)</span></label>
        <textarea
          className="input mt-1 resize-none"
          rows={2}
          value={section.adminNote ?? ''}
          onChange={e => onChange({ ...section, adminNote: e.target.value })}
          placeholder="e.g. Thanks for the great feedback! We'll share results at the next council meeting."
        />
      </div>

      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={section.allowCustom}
          onChange={e => onChange({ ...section, allowCustom: e.target.checked })}
          className="w-4 h-4 accent-teal-500"
        />
        <span className="text-sm text-slate-300">Allow visitors to submit their own written answer</span>
      </label>
      {section.allowCustom && (
        <p className="text-xs text-slate-500 -mt-2 ml-7">
          Visitors can optionally include their name and choose to share their response publicly on the page.
        </p>
      )}

      <PollResponses section={section} adminKey={adminKey} />
    </div>
  )
}

// ── Add section modal ─────────────────────────────────────────────────────────
function AddSectionModal({ onAdd, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-80 space-y-4 shadow-2xl">
        <h3 className="text-white font-semibold text-lg">Add Section</h3>
        <p className="text-slate-400 text-sm">What type of section do you want to add?</p>
        <div className="space-y-3">
          <button onClick={() => onAdd('era')}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-700 hover:border-teal-600 hover:bg-teal-600/10 transition-all text-left">
            <div className="w-8 h-8 rounded-lg bg-teal-600/20 flex items-center justify-center flex-shrink-0">
              <Image size={16} className="text-teal-400" />
            </div>
            <div>
              <div className="text-white font-medium text-sm">History Section</div>
              <div className="text-slate-500 text-xs">Text, photo, and gallery for a historical era</div>
            </div>
          </button>
          <button onClick={() => onAdd('poll')}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-700 hover:border-yellow-500 hover:bg-yellow-500/10 transition-all text-left">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
              <BarChart2 size={16} className="text-yellow-400" />
            </div>
            <div>
              <div className="text-white font-medium text-sm">Community Poll</div>
              <div className="text-slate-500 text-xs">Question with multiple choice options for visitors</div>
            </div>
          </button>
        </div>
        <button onClick={onClose} className="btn-ghost w-full text-sm">Cancel</button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function HistoryAdmin() {
  const { auth } = useAuth()
  const toast = useToast()

  const [pageTitle, setPageTitle]         = useState('Fun Stuff')
  const [sections, setSections]           = useState([])
  const [loading, setLoading]             = useState(true)
  const [saving, setSaving]               = useState(false)
  const [expandedId, setExpandedId]       = useState(null)
  const [showAddModal, setShowAddModal]   = useState(false)
  const [uploadingMain, setUploadingMain] = useState(null)
  const [uploadingGallery, setUploadingGallery] = useState(null)
  const [uploadingPollPhoto, setUploadingPollPhoto] = useState(null)

  useEffect(() => {
    fetch(`${API}/api/history`)
      .then(r => r.json())
      .then(d => {
        const parsed = parseData(d.text)
        setPageTitle(parsed.pageTitle || 'Fun Stuff')
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
      toast('Saved!', 'success')
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
    } catch (err) { toast(err.message || 'Upload failed', 'error') }
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
        : s))
      toast(`${urls.length} photo${urls.length !== 1 ? 's' : ''} added!`, 'success')
    } catch (err) { toast(err.message || 'Upload failed', 'error') }
    setUploadingGallery(null)
  }

  async function handleUploadPollPhoto(e, sectionId) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPollPhoto(sectionId)
    e.target.value = ''
    try {
      const url = await uploadPhoto(file, 'photos')
      setSections(prev => prev.map(s => s.id === sectionId ? { ...s, photoUrl: url } : s))
      toast('Photo uploaded!', 'success')
    } catch (err) { toast(err.message || 'Upload failed', 'error') }
    setUploadingPollPhoto(null)
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

  function handleAddSection(type) {
    setShowAddModal(false)
    const s = type === 'poll' ? newPollSection(sections.length) : newEraSection(sections.length)
    setSections(prev => [...prev, s])
    setExpandedId(s.id)
  }

  if (loading) return <div className="text-slate-500 text-sm">Loading…</div>

  return (
    <div className="max-w-3xl space-y-4">
      {showAddModal && <AddSectionModal onAdd={handleAddSection} onClose={() => setShowAddModal(false)} />}

      {/* Page settings */}
      <div className="card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-grow">
            <label className="label">Page Title</label>
            <input className="input mt-1" value={pageTitle} onChange={e => setPageTitle(e.target.value)} placeholder="Fun Stuff" />
            <p className="text-slate-600 text-xs mt-1">Shown as the page heading (nav label is always "Fun Stuff")</p>
          </div>
          <button onClick={saveAll} disabled={saving} className="btn-primary self-end">
            {saving
              ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
              : <><Save size={14} /> Save All</>}
          </button>
        </div>
      </div>

      {/* Sections */}
      {sections.map((section, idx) => {
        const isPoll = section.type === 'poll'
        return (
          <div key={section.id} className="card overflow-hidden">
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

              {/* Icon / thumb */}
              {isPoll ? (
                <div className="w-12 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                  <BarChart2 size={16} className="text-yellow-400" />
                </div>
              ) : section.mainPhotoUrl ? (
                <img src={section.mainPhotoUrl} alt="" className="w-12 h-10 object-cover rounded-lg flex-shrink-0" />
              ) : (
                <div className="w-12 h-10 rounded-lg bg-teal-600/20 flex items-center justify-center flex-shrink-0">
                  <Image size={16} className="text-teal-400" />
                </div>
              )}

              {/* Info */}
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${isPoll ? 'bg-yellow-500/20 text-yellow-400' : 'bg-teal-600/20 text-teal-400'}`}>
                    {isPoll ? 'Poll' : 'History'}
                  </span>
                  <div className="text-white font-medium truncate">
                    {isPoll ? (section.question || <span className="text-slate-600 italic">No question yet</span>)
                             : (section.title    || <span className="text-slate-600 italic">Untitled section</span>)}
                  </div>
                </div>
                <div className="text-slate-500 text-xs mt-0.5">
                  {isPoll
                    ? `${section.options.length} options · ${section.allowCustom ? 'custom answers on' : 'no custom answers'}`
                    : `${section.galleryPhotos?.length || 0} gallery photo${(section.galleryPhotos?.length || 0) !== 1 ? 's' : ''} · photo ${section.photoSide}`}
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
                <button onClick={() => setExpandedId(expandedId === section.id ? null : section.id)} className="btn-ghost py-1.5 px-2">
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
                {isPoll ? (
                  <PollEditor
                    section={section}
                    onChange={updateSection}
                    onUploadPollPhoto={handleUploadPollPhoto}
                    uploadingPollPhoto={uploadingPollPhoto === section.id}
                    adminKey={auth.key}
                  />
                ) : (
                  <EraEditor
                    section={section}
                    onChange={updateSection}
                    onUploadMain={handleUploadMain}
                    onUploadGallery={handleUploadGallery}
                    uploadingMain={uploadingMain === section.id}
                    uploadingGallery={uploadingGallery === section.id}
                  />
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Add section */}
      <button
        onClick={() => setShowAddModal(true)}
        className="btn-ghost w-full py-3 flex items-center justify-center gap-2 border border-dashed border-slate-700 hover:border-teal-600 hover:text-teal-400 transition-colors"
      >
        <Plus size={16} /> Add Section
      </button>

      <p className="text-slate-600 text-xs text-center">Click "Save All" at the top to publish all changes.</p>
    </div>
  )
}
