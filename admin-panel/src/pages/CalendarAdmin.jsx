// src/pages/CalendarAdmin.jsx
import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, X, Calendar, Clock, MapPin } from 'lucide-react'
import { useAuth, useToast } from '../utils/context'
import { format, parseISO } from 'date-fns'

const API = import.meta.env.VITE_API_BASE_URL || ''

function EventForm({ item, onSave, onCancel }) {
  const [form, setForm] = useState(item || { title: '', date: '', time: '', location: 'Village Hall', description: '' })
  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))
  return (
    <div className="card p-5 border-pink-600/20 bg-pink-600/5 space-y-3">
      <h3 className="text-white font-medium flex items-center gap-2"><Calendar size={16} className="text-pink-400" />{item ? 'Edit Event' : 'New Event'}</h3>
      <div>
        <label className="label">Event Title</label>
        <input className="input" value={form.title} onChange={f('title')} placeholder="e.g. Regular Council Meeting" />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Date</label>
          <input className="input" type="date" value={form.date} onChange={f('date')} />
        </div>
        <div>
          <label className="label">Time</label>
          <input className="input" type="time" value={form.time} onChange={f('time')} />
        </div>
      </div>
      <div>
        <label className="label">Location</label>
        <input className="input" value={form.location} onChange={f('location')} placeholder="Village Hall" />
      </div>
      <div>
        <label className="label">Description (optional)</label>
        <textarea className="input resize-none" rows={2} value={form.description} onChange={f('description')} placeholder="Additional details residents should know..." />
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSave(form)} className="btn-primary"><Save size={14} /> {item ? 'Update' : 'Add'} Event</button>
        <button onClick={onCancel} className="btn-ghost"><X size={14} /> Cancel</button>
      </div>
    </div>
  )
}

export default function CalendarAdmin() {
  const { auth } = useAuth()
  const toast = useToast()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    fetch(`${API}/api/events`)
      .then((r) => r.json()).then((d) => setEvents(d.items || []))
      .catch(() => toast('Could not load events', 'error'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(form) {
    const isEdit = !!form.id
    try {
      const dateObj = new Date(form.date)
      const month = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`
      const payload = { ...form, date: dateObj.toISOString(), month }
      const res = await fetch(
        isEdit ? `${API}/api/events?id=${form.id}&month=${form.month}` : `${API}/api/events`,
        { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': auth.key }, body: JSON.stringify(payload) }
      )
      if (!res.ok) throw new Error()
      const saved = await res.json()
      setEvents((prev) => isEdit ? prev.map((x) => x.id === saved.id ? saved : x) : [...prev, saved].sort((a, b) => new Date(a.date) - new Date(b.date)))
      setAdding(false); setEditingId(null)
      toast(isEdit ? 'Event updated!' : 'Event added to calendar!', 'success')
    } catch { toast('Save failed', 'error') }
  }

  async function handleDelete(event) {
    if (!confirm(`Remove "${event.title}"?`)) return
    try {
      await fetch(`${API}/api/events?id=${event.id}&month=${event.month}`, { method: 'DELETE', headers: { 'x-admin-key': auth.key } })
      setEvents((prev) => prev.filter((x) => x.id !== event.id))
      toast('Event removed', 'success')
    } catch { toast('Delete failed', 'error') }
  }

  const upcoming = events.filter((e) => new Date(e.date) >= new Date())
  const past = events.filter((e) => new Date(e.date) < new Date())

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between mb-6">
        <p className="text-slate-400 text-sm">Schedule council meetings, community events, and activities.</p>
        <button onClick={() => setAdding(true)} disabled={adding} className="btn-primary"><Plus size={15} /> Add Event</button>
      </div>
      {adding && <EventForm onSave={handleSave} onCancel={() => setAdding(false)} />}
      {loading ? <div className="text-slate-500 text-sm">Loading events…</div> : (
        <>
          {upcoming.length > 0 && <h3 className="text-slate-400 text-xs font-medium uppercase tracking-wider">Upcoming</h3>}
          {upcoming.map((event) => editingId === event.id
            ? <EventForm key={event.id} item={{ ...event, date: event.date.slice(0, 10) }} onSave={handleSave} onCancel={() => setEditingId(null)} />
            : (
              <div key={event.id} className="card p-4 flex gap-4">
                <div className="w-12 h-12 bg-pink-600/20 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-pink-400 text-xs font-medium leading-none">{format(parseISO(event.date), 'MMM')}</span>
                  <span className="text-white font-bold text-lg leading-none">{format(parseISO(event.date), 'd')}</span>
                </div>
                <div className="flex-grow min-w-0">
                  <div className="text-white font-medium">{event.title}</div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                    {event.time && <span className="text-slate-500 text-xs flex items-center gap-1"><Clock size={11} />{event.time}</span>}
                    {event.location && <span className="text-slate-500 text-xs flex items-center gap-1"><MapPin size={11} />{event.location}</span>}
                  </div>
                  {event.description && <p className="text-slate-500 text-xs mt-1 truncate">{event.description}</p>}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => setEditingId(event.id)} className="btn-ghost py-1.5 px-3 text-xs">Edit</button>
                  <button onClick={() => handleDelete(event)} className="btn-danger py-1.5 px-3"><Trash2 size={13} /></button>
                </div>
              </div>
            )
          )}
          {past.length > 0 && (
            <details className="mt-4">
              <summary className="text-slate-600 text-xs cursor-pointer hover:text-slate-400 transition-colors">Show {past.length} past event{past.length !== 1 ? 's' : ''}</summary>
              <div className="mt-3 space-y-2 opacity-60">
                {past.map((event) => (
                  <div key={event.id} className="card p-3 flex gap-3 items-center">
                    <div className="text-slate-500 text-xs w-20 flex-shrink-0">{format(parseISO(event.date), 'MMM d, yyyy')}</div>
                    <div className="text-slate-400 text-sm flex-grow truncate">{event.title}</div>
                    <button onClick={() => handleDelete(event)} className="btn-danger py-1 px-2 text-xs"><Trash2 size={11} /></button>
                  </div>
                ))}
              </div>
            </details>
          )}
          {upcoming.length === 0 && past.length === 0 && (
            <div className="card p-10 text-center text-slate-600">No events yet. Click "Add Event" to get started.</div>
          )}
        </>
      )}
    </div>
  )
}
