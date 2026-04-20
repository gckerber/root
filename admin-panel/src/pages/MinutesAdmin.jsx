// src/pages/MinutesAdmin.jsx
import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, FileText, Upload, X, CheckCircle, Download, Paperclip } from 'lucide-react'
import { useAuth, useToast } from '../utils/context'
import { format, parseISO } from 'date-fns'

const API = import.meta.env.VITE_API_BASE_URL || ''

function AddMinutesForm({ onSave, onCancel, adminKey }) {
  const toast = useToast()
  const fileRef = useRef()
  const [form, setForm] = useState({ meetingDate: '', type: 'Regular Session', approved: false })
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  async function handleSubmit() {
    if (!form.meetingDate) { toast('Please enter a meeting date', 'error'); return }
    setUploading(true)
    try {
      let fileUrl = null
      let fileSize = null
      let fileName = null

      if (file) {
        // Get SAS upload URL
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
        fileSize = file.size
        fileName = file.name
      }

      await onSave({ ...form, fileUrl, fileSize, fileName })
    } catch (err) {
      toast(err.message || 'Upload failed', 'error')
    }
    setUploading(false)
  }

  return (
    <div className="card p-5 border-green-600/20 bg-green-600/5 space-y-4">
      <h3 className="text-white font-medium flex items-center gap-2"><FileText size={16} className="text-green-400" /> New Meeting Record</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Meeting Date</label>
          <input type="date" className="input" value={form.meetingDate} onChange={(e) => setForm((p) => ({ ...p, meetingDate: e.target.value }))} />
        </div>
        <div>
          <label className="label">Session Type</label>
          <select className="input" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
            <option>Regular Session</option>
            <option>Special Session</option>
            <option>Work Session</option>
            <option>Emergency Session</option>
          </select>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <input type="checkbox" id="approved" checked={form.approved} onChange={(e) => setForm((p) => ({ ...p, approved: e.target.checked }))} className="w-4 h-4 rounded" />
        <label htmlFor="approved" className="text-slate-300 text-sm cursor-pointer">Minutes have been approved by Council</label>
      </div>

      {/* File attachment */}
      <div>
        <label className="label">Attach File (PDF, MP3, MP4, Word doc…)</label>
        <div
          className="border-2 border-dashed border-slate-700 rounded-xl p-4 text-center cursor-pointer hover:border-slate-600 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          {file ? (
            <div className="flex items-center justify-center gap-3 text-sm">
              <Paperclip size={16} className="text-green-400" />
              <span className="text-white font-medium">{file.name}</span>
              <span className="text-slate-500">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
              <button onClick={(e) => { e.stopPropagation(); setFile(null) }} className="text-slate-500 hover:text-red-400 transition-colors"><X size={14} /></button>
            </div>
          ) : (
            <div>
              <Upload size={20} className="text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">Click to attach a PDF, audio, or document</p>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.mp3,.mp4,.m4a,.wav" onChange={(e) => setFile(e.target.files[0])} className="hidden" />
      </div>

      <div className="flex gap-2">
        <button onClick={handleSubmit} disabled={uploading} className="btn-primary">
          {uploading
            ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
            : <><CheckCircle size={14} /> Save Meeting</>}
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
      const res = await fetch(`${API}/api/minutes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': auth.key },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      const saved = await res.json()
      setMinutes((prev) => [saved, ...prev])
      setAdding(false)
      toast('Meeting minutes saved!', 'success')
    } catch {
      toast('Save failed — please try again', 'error')
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

  const filtered = filterYear ? minutes.filter((m) => new Date(m.meetingDate).getFullYear() === parseInt(filterYear)) : minutes

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <p className="text-slate-400 text-sm">Upload meeting minutes and attach PDFs or audio recordings.</p>
        <div className="flex gap-2">
          {years.length > 0 && (
            <select className="input py-2 w-32" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
              <option value="">All years</option>
              {years.map((y) => <option key={y}>{y}</option>)}
            </select>
          )}
          <button onClick={() => setAdding(true)} disabled={adding} className="btn-primary">
            <Plus size={15} /> Add Meeting
          </button>
        </div>
      </div>

      {adding && <AddMinutesForm onSave={handleSave} onCancel={() => setAdding(false)} adminKey={auth.key} />}

      {loading ? (
        <div className="text-slate-500 text-sm">Loading minutes…</div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center text-slate-600">No meetings found. Click "Add Meeting" to get started.</div>
      ) : (
        filtered.map((m) => (
          <div key={m.id} className="card p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-600/20 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
              <span className="text-green-400 text-xs font-medium leading-none">{format(parseISO(m.meetingDate), 'MMM')}</span>
              <span className="text-white font-bold text-lg leading-none">{format(parseISO(m.meetingDate), 'd')}</span>
            </div>
            <div className="flex-grow min-w-0">
              <div className="text-white font-medium">{format(parseISO(m.meetingDate), 'MMMM d, yyyy')}</div>
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
              <button onClick={() => handleDelete(m)} className="btn-danger py-1.5 px-3">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
