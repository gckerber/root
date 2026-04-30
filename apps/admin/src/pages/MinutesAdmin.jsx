// apps/admin/src/pages/MinutesAdmin.jsx
import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, FileText, Upload, X, CheckCircle, Download, Paperclip, Pencil, Save } from 'lucide-react'
import { useAuth, useToast } from '../utils/context'
import { format, parseISO } from 'date-fns'

const API = 'https://func-village-prod.azurewebsites.net'

function MinuteForm({ meeting, onSave, onCancel, adminKey, isEdit }) {
  const toast = useToast()
  const fileRef = useRef()
  const [form, setForm] = useState(meeting || {
    meetingDate: '',
    title: '',
    type: 'Regular Session',
    approved: false,
    summary: '',
    fileUrl: meeting?.fileUrl || null,
    fileName: meeting?.fileName || null,
  })
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)

  async function handleSubmit() {
    if (!form.meetingDate) { toast('Please enter a meeting date', 'error'); return }
    setUploading(true)
    try {
      let fileUrl = form.fileUrl
      let fileName = form.fileName

      // Upload new files if any
      if (files.length > 0) {
        const file = files[0]
        const urlRes = await fetch(`${API}/api/upload-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
          body: JSON.stringify({ container: 'minutes', filename: file.name, contentType: file.type }),
        })
        if (!urlRes.ok) throw new Error('Could not get upload URL')
        const { uploadUrl, publicUrl } = await urlRes.json()
        await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'x-ms-blob-type': 'BlockBlob', 'Content-Type': file.type },
          body: file,
        })
        fileUrl = publicUrl
        fileName = file.name
      }

      // Generate title from date if not provided
      const date = new Date(form.meetingDate)
      const title = form.title?.trim() ||
        `${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} Council Meeting`

      await onSave({ ...form, fileUrl, fileName, title })
    } catch (err) {
      toast(err.message || 'Save failed', 'error')
    }
    setUploading(false)
  }

  return (
    <div className="card p-5 border-green-600/20 bg-green-600/5 space-y-4">
      <h3 className="text-white font-medium flex items-center gap-2">
        <FileText size={16} className="text-green-400" />
        {isEdit ? 'Edit Meeting Record' : 'New Meeting Record'}
      </h3>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Meeting Date</label>
          <input type="date" className="input"
            value={form.meetingDate?.slice(0, 10) || ''}
            onChange={(e) => setForm((p) => ({ ...p, meetingDate: e.target.value }))} />
        </div>
        <div>
          <label className="label">Session Type</label>
          <select className="input" value={form.type}
            onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
            <option>Regular Session</option>
            <option>Special Session</option>
            <option>Work Session</option>
            <option>Emergency Session</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">Title (optional — auto-generated from date if blank)</label>
        <input className="input" value={form.title || ''}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          placeholder="e.g. April 2025 Regular Council Meeting" />
      </div>

      <div>
        <label className="label">Summary (optional)</label>
        <textarea className="input resize-none" rows={3} value={form.summary || ''}
          onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))}
          placeholder="Brief summary of key decisions, motions passed, or topics discussed..." />
      </div>

      <div className="flex items-center gap-3">
        <input type="checkbox" id="approved" checked={form.approved}
          onChange={(e) => setForm((p) => ({ ...p, approved: e.target.checked }))}
          className="w-4 h-4 rounded" />
        <label htmlFor="approved" className="text-slate-300 text-sm cursor-pointer">
          Minutes have been approved by Council
        </label>
      </div>

      {/* File attachments */}
      <div>
        <label className="label">
          Attach Files (PDF, Audio, Video, Word)
          {form.fileName && <span className="text-slate-500 ml-2 normal-case">— current: {form.fileName}</span>}
        </label>
        <div
          className="border-2 border-dashed border-slate-700 rounded-xl p-4 cursor-pointer hover:border-slate-600 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          {files.length > 0 ? (
            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <Paperclip size={14} className="text-green-400" />
                  <span className="text-white font-medium">{f.name}</span>
                  <span className="text-slate-500">({(f.size / 1024 / 1024).toFixed(1)} MB)</span>
                  <button onClick={(e) => { e.stopPropagation(); setFiles(files.filter((_, j) => j !== i)) }}
                    className="text-slate-500 hover:text-red-400 ml-auto"><X size={14} /></button>
                </div>
              ))}
              <p className="text-slate-500 text-xs">Click to add more files</p>
            </div>
          ) : (
            <div className="text-center">
              <Upload size={20} className="text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">Click to attach PDF, audio, or document</p>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file"
          accept=".pdf,.doc,.docx,.mp3,.mp4,.m4a,.wav"
          multiple
          onChange={(e) => setFiles([...files, ...Array.from(e.target.files)])}
          className="hidden" />
      </div>

      <div className="flex gap-2">
        <button onClick={handleSubmit} disabled={uploading} className="btn-primary">
          {uploading
            ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
            : <><Save size={14} /> {isEdit ? 'Update Meeting' : 'Save Meeting'}</>}
        </button>
        <button onClick={onCancel} className="btn-ghost"><X size={14} /> Cancel</button>
      </div>
    </div>
  )
}

export default function MinutesAdmin() {
  const { auth } = useAuth()
  const toast = useToast()
  const [minutes, setMinutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [filterYear, setFilterYear] = useState('')

  const years = [...new Set(minutes.map((m) => new Date(m.meetingDate).getFullYear()))].sort((a, b) => b - a)

  useEffect(() => {
    fetch(`${API}/api/minutes`)
      .then((r) => r.json())
      .then((d) => setMinutes(d.items || []))
      .catch(() => toast('Could not load minutes', 'error'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(data) {
    try {
      const isEdit = !!data.id
      const url = isEdit ? `${API}/api/minutes?id=${data.id}&year=${new Date(data.meetingDate).getFullYear()}` : `${API}/api/minutes`
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': auth.key },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error(await res.text())
      const saved = await res.json()
      setMinutes((prev) => isEdit
        ? prev.map((m) => m.id === saved.id ? saved : m)
        : [saved, ...prev])
      setAdding(false)
      setEditingId(null)
      toast(isEdit ? 'Meeting updated!' : 'Meeting saved!', 'success')
    } catch (err) {
      toast('Save failed — ' + err.message, 'error')
    }
  }

  async function handleDelete(m) {
    if (!confirm(`Remove ${format(parseISO(m.meetingDate), 'MMMM d, yyyy')} minutes?`)) return
    try {
      await fetch(`${API}/api/minutes?id=${m.id}&year=${new Date(m.meetingDate).getFullYear()}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': auth.key },
      })
      setMinutes((prev) => prev.filter((x) => x.id !== m.id))
      toast('Minutes removed', 'success')
    } catch {
      toast('Delete failed', 'error')
    }
  }

  const filtered = filterYear
    ? minutes.filter((m) => new Date(m.meetingDate).getFullYear() === parseInt(filterYear))
    : minutes

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <p className="text-slate-400 text-sm">Upload meeting minutes and attach PDFs or audio recordings.</p>
        <div className="flex gap-2">
          {years.length > 0 && (
            <select className="input py-2 w-32" value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}>
              <option value="">All years</option>
              {years.map((y) => <option key={y}>{y}</option>)}
            </select>
          )}
          <button onClick={() => setAdding(true)} disabled={adding} className="btn-primary">
            <Plus size={15} /> Add Meeting
          </button>
        </div>
      </div>

      {adding && (
        <MinuteForm onSave={handleSave} onCancel={() => setAdding(false)} adminKey={auth.key} />
      )}

      {loading ? (
        <div className="text-slate-500 text-sm">Loading minutes…</div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center text-slate-600">No meetings found. Click "Add Meeting" to get started.</div>
      ) : (
        filtered.map((m) => (
          editingId === m.id ? (
            <MinuteForm
              key={m.id}
              meeting={m}
              isEdit={true}
              onSave={handleSave}
              onCancel={() => setEditingId(null)}
              adminKey={auth.key}
            />
          ) : (
            <div key={m.id} className="card p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-green-600/20 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-green-400 text-xs font-medium leading-none">
                  {format(parseISO(m.meetingDate), 'MMM')}
                </span>
                <span className="text-white font-bold text-lg leading-none">
                  {format(parseISO(m.meetingDate), 'd')}
                </span>
              </div>
              <div className="flex-grow min-w-0">
                <div className="text-white font-medium">
                  {m.title || format(parseISO(m.meetingDate), 'MMMM d, yyyy') + ' Council Meeting'}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-slate-500 text-xs">{m.type}</span>
                  {m.approved && <span className="badge bg-green-600/20 text-green-400">Approved</span>}
                  {m.fileName && (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Paperclip size={11} /> {m.fileName}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {m.fileUrl && (
                  <a href={m.fileUrl} target="_blank" rel="noreferrer" className="btn-ghost py-1.5 px-3">
                    <Download size={13} />
                  </a>
                )}
                <button onClick={() => setEditingId(m.id)} className="btn-ghost py-1.5 px-3">
                  <Pencil size={13} /> Edit
                </button>
                <button onClick={() => handleDelete(m)} className="btn-danger py-1.5 px-3">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          )
        ))
      )}
    </div>
  )
}
