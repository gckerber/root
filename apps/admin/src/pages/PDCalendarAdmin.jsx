// apps/admin/src/pages/PDCalendarAdmin.jsx
// Manage Police Department events. Fetches/creates events with department === 'police'.
// Supports multiple photos per event.
import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Save, X, Calendar, Clock, MapPin, Upload } from 'lucide-react'
import { useAuth, useToast } from '../utils/context'
import { format, parseISO } from 'date-fns'

const API = 'https://func-village-prod.azurewebsites.net'

// ── Photo grid (supports multiple saved URLs + pending File objects) ──────────
function PhotoGrid({ savedUrls, pendingFiles, onRemoveSaved, onRemovePending, onAddClick }) {
  return (
    <div>
      <label className="label">Event Photos</label>
      <div className="flex flex-wrap gap-2 mt-1">
        {savedUrls.map((url) => (
          <div key={url} className="relative w-24 h-20 group">
            <img src={url} alt="" className="w-full h-full object-cover rounded-lg border border-slate-700" />
            <button
              type="button"
              onClick={() => onRemoveSaved(url)}
              className="absolute top-1 right-1 w-5 h-5 bg-red-600 rounded-full text-white text-xs hidden group-hover:flex items-center justify-center leading-none"
            >×</button>
          </div>
        ))}
        {pendingFiles.map((file, i) => (
          <div key={i} className="relative w-24 h-20 group">
            <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover rounded-lg border border-blue-500/50" />
            <div className="absolute inset-0 bg-blue-600/10 rounded-lg pointer-events-none" />
            <button
              type="button"
              onClick={() => onRemovePending(i)}
              className="absolute top-1 right-1 w-5 h-5 bg-red-600 rounded-full text-white text-xs hidden group-hover:flex items-center justify-center leading-none"
            >×</button>
          </div>
        ))}
        <button
          type="button"
          onClick={onAddClick}
          className="w-24 h-20 border-2 border-dashed border-slate-700 rounded-lg flex flex-col items-center justify-center gap-1 text-slate-500 hover:border-slate-500 hover:text-slate-400 transition-colors"
        >
          <Upload size={16} />
          <span className="text-xs">Add</span>
        </button>
      </div>
      {(savedUrls.length + pendingFiles.length) > 0 && (
        <p className="text-slate-600 text-xs mt-1.5">
          {savedUrls.length + pendingFiles.length} photo{savedUrls.length + pendingFiles.length !== 1 ? 's' : ''} · first photo used as card thumbnail
        </p>
      )}
    </div>
  )
}

// ── Event form ────────────────────────────────────────────────────────────────
function EventForm({ item, onSave, onCancel, adminKey }) {
  const toast = useToast()
  const fileRef = useRef()
  const [form, setForm] = useState(item || {
    title: '', date: '', time: '', location: 'Village Hall', description: '', month: '',
  })
  const [savedUrls, setSavedUrls] = useState(
    item?.photoUrls?.length ? item.photoUrls : (item?.photoUrl ? [item.photoUrl] : [])
  )
  const [pendingFiles, setPendingFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  function handlePhotoSelect(e) {
    const files = Array.from(e.target.files || [])
    if (files.length) setPendingFiles((prev) => [...prev, ...files])
    e.target.value = '' // allow re-selecting same file
  }

  async function uploadFile(file) {
    const urlRes = await fetch(`${API}/api/upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
      body: JSON.stringify({ container: 'events', filename: file.name, contentType: file.type }),
    })
    if (!urlRes.ok) throw new Error('Could not get upload URL')
    const { uploadUrl, publicUrl } = await urlRes.json()
    await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'x-ms-blob-type': 'BlockBlob', 'Content-Type': file.type },
      body: file,
    })
    return publicUrl
  }

  async function handleSave() {
    if (!form.title?.trim() || !form.date) {
      toast('Title and date are required', 'error')
      return
    }
    setUploading(true)
    try {
      const newUrls = await Promise.all(pendingFiles.map(uploadFile))
      const allUrls = [...savedUrls, ...newUrls]

      const dateObj = new Date(form.date)
      const month = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`

      await onSave({
        ...form,
        month,
        date: dateObj.toISOString(),
        photoUrls: allUrls,
        photoUrl: allUrls[0] || '',
        department: 'police',
      })
    } catch (err) {
      toast(err.message || 'Save failed', 'error')
    }
    setUploading(false)
  }

  return (
    <div className="card p-5 border-amber-600/20 bg-amber-600/5 space-y-3">
      <h3 className="text-white font-medium flex items-center gap-2">
        <Calendar size={16} className="text-amber-400" />
        {item ? 'Edit PD Event' : 'New PD Event'}
      </h3>

      <div>
        <label className="label">Event Title</label>
        <input className="input" value={form.title} onChange={f('title')}
          placeholder="e.g. Community Safety Night" />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Date</label>
          <input className="input" type="date" value={form.date?.slice(0, 10) || ''} onChange={f('date')} />
        </div>
        <div>
          <label className="label">Time</label>
          <input className="input" type="time" value={form.time || ''} onChange={f('time')} />
        </div>
      </div>

      <div>
        <label className="label">Location</label>
        <input className="input" value={form.location} onChange={f('location')} placeholder="Village Hall" />
      </div>

      <div>
        <label className="label">Description</label>
        <textarea className="input resize-none" rows={3} value={form.description || ''} onChange={f('description')}
          placeholder="Event details residents should know…" />
      </div>

      <PhotoGrid
        savedUrls={savedUrls}
        pendingFiles={pendingFiles}
        onRemoveSaved={(url) => setSavedUrls((prev) => prev.filter((u) => u !== url))}
        onRemovePending={(i) => setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))}
        onAddClick={() => fileRef.current?.click()}
      />
      <input ref={fileRef} type="file" accept="image/*" multiple onChange={handlePhotoSelect} className="hidden" />

      <div className="flex gap-2">
        <button onClick={handleSave} disabled={uploading} className="btn-primary">
          {uploading
            ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
            : <><Save size={14} /> {item ? 'Update' : 'Add'} Event</>}
        </button>
        <button onClick={onCancel} className="btn-ghost"><X size={14} /> Cancel</button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PDCalendarAdmin() {
  const { auth }  = useAuth()
  const toast     = useToast()
  const [events, setEvents]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [adding, setAdding]     = useState(false)
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    fetch(`${API}/api/events?department=police`)
      .then((r) => r.json())
      .then((d) => setEvents(d.items || []))
      .catch(() => toast('Could not load events', 'error'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(form) {
    const isEdit = !!form.id
    try {
      const url = isEdit
        ? `${API}/api/events?id=${form.id}&month=${form.month}`
        : `${API}/api/events`
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': auth.key },
        body: JSON.stringify({ ...form, department: 'police' }),
      })
      if (!res.ok) throw new Error(await res.text())
      const saved = await res.json()
      setEvents((prev) =>
        isEdit
          ? prev.map((x) => x.id === saved.id ? saved : x).sort((a, b) => new Date(a.date) - new Date(b.date))
          : [...prev, saved].sort((a, b) => new Date(a.date) - new Date(b.date))
      )
      setAdding(false)
      setEditingId(null)
      toast(isEdit ? 'Event updated!' : 'Event added!', 'success')
    } catch (err) {
      toast('Save failed: ' + err.message, 'error')
    }
  }

  async function handleDelete(event) {
    if (!confirm(`Remove "${event.title}"?`)) return
    try {
      await fetch(`${API}/api/events?id=${event.id}&month=${event.month}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': auth.key },
      })
      setEvents((prev) => prev.filter((x) => x.id !== event.id))
      toast('Event removed', 'success')
    } catch {
      toast('Delete failed', 'error')
    }
  }

  const upcoming = events.filter((e) => new Date(e.date) >= new Date())
  const past     = events.filter((e) => new Date(e.date) < new Date())

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between mb-6">
        <p className="text-slate-400 text-sm">
          Events appear on the Police Department page. Supports multiple photos.
        </p>
        <button onClick={() => setAdding(true)} disabled={adding} className="btn-primary">
          <Plus size={15} /> Add Event
        </button>
      </div>

      {adding && <EventForm onSave={handleSave} onCancel={() => setAdding(false)} adminKey={auth.key} />}

      {loading ? (
        <div className="text-slate-500 text-sm">Loading events…</div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <h3 className="text-slate-400 text-xs font-medium uppercase tracking-wider">Upcoming</h3>
          )}

          {upcoming.map((event) =>
            editingId === event.id ? (
              <EventForm
                key={event.id}
                item={{ ...event, date: event.date?.slice(0, 10) }}
                onSave={handleSave}
                onCancel={() => setEditingId(null)}
                adminKey={auth.key}
              />
            ) : (
              <div key={event.id} className="card overflow-hidden">
                {(event.photoUrls?.[0] || event.photoUrl) && (
                  <div className="relative h-28 overflow-hidden">
                    <img
                      src={event.photoUrls?.[0] || event.photoUrl}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
                    {(event.photoUrls?.length || 0) > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                        +{event.photoUrls.length - 1} more
                      </div>
                    )}
                  </div>
                )}
                <div className="p-4 flex gap-4">
                  <div className="w-12 h-12 bg-amber-600/20 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-amber-400 text-xs font-medium leading-none">
                      {format(parseISO(event.date), 'MMM')}
                    </span>
                    <span className="text-white font-bold text-lg leading-none">
                      {format(parseISO(event.date), 'd')}
                    </span>
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="text-white font-medium">{event.title}</div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                      {event.time && (
                        <span className="text-slate-500 text-xs flex items-center gap-1">
                          <Clock size={11} />{event.time}
                        </span>
                      )}
                      {event.location && (
                        <span className="text-slate-500 text-xs flex items-center gap-1">
                          <MapPin size={11} />{event.location}
                        </span>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-slate-500 text-xs mt-1 truncate">{event.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => setEditingId(event.id)} className="btn-ghost py-1.5 px-3 text-xs">Edit</button>
                    <button onClick={() => handleDelete(event)} className="btn-danger py-1.5 px-3">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            )
          )}

          {past.length > 0 && (
            <details className="mt-4">
              <summary className="text-slate-600 text-xs cursor-pointer hover:text-slate-400 transition-colors">
                Show {past.length} past event{past.length !== 1 ? 's' : ''}
              </summary>
              <div className="mt-3 space-y-2 opacity-60">
                {past.map((event) => (
                  <div key={event.id} className="card p-3 flex gap-3 items-center">
                    <div className="text-slate-500 text-xs w-20 flex-shrink-0">
                      {format(parseISO(event.date), 'MMM d, yyyy')}
                    </div>
                    <div className="text-slate-400 text-sm flex-grow truncate">{event.title}</div>
                    <button onClick={() => handleDelete(event)} className="btn-danger py-1 px-2 text-xs">
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </details>
          )}

          {upcoming.length === 0 && past.length === 0 && (
            <div className="card p-10 text-center text-slate-600">
              No events yet. Click "Add Event" to get started.
            </div>
          )}
        </>
      )}
    </div>
  )
}
