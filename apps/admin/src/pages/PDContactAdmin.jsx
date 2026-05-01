// apps/admin/src/pages/PDContactAdmin.jsx
// Edit PD site contact info and department details shown on the Home page
import { useState, useEffect } from 'react'
import { Save, Phone, MapPin, Clock, Mail, Shield } from 'lucide-react'
import { useAuth, useToast } from '../utils/context'

const PD_API = import.meta.env.VITE_PD_API_URL || 'https://pd.saintlouisvilleohio.gov'

const DEFAULTS = {
  address: '100 N. High Street',
  address2: 'Saint Louisville, OH 43071',
  phone: '(740) 568-7800',
  email: 'pd@saintlouisvilleohio.gov',
  hours: 'Monday – Friday: 8:00 AM – 4:30 PM\nAfter hours: call non-emergency line',
  chief: 'Contact Village Hall',
  courtPresidedBy: 'Mayor Zack Allen',
}

export default function PDContactAdmin() {
  const { auth } = useAuth()
  const toast = useToast()
  const [form, setForm] = useState(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  useEffect(() => {
    fetch(`${PD_API}/api/pd-contact`, { headers: { 'x-admin-key': auth.key } })
      .then(r => r.json())
      .then(d => setForm({ ...DEFAULTS, ...d }))
      .catch(() => toast('Could not load contact info', 'error'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    if (!form.phone?.trim() || !form.email?.trim()) {
      toast('Phone and email are required', 'error')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`${PD_API}/api/pd-contact`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': auth.key },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error(await res.text())
      toast('Contact info saved!', 'success')
    } catch (err) {
      toast(err.message || 'Save failed', 'error')
    }
    setSaving(false)
  }

  if (loading) return <div className="text-slate-500 text-sm">Loading…</div>

  return (
    <div className="max-w-2xl space-y-6">
      <p className="text-slate-400 text-sm">This information appears on the PD site home page in the contact section and emergency banner.</p>

      {/* Location */}
      <div className="card p-5 space-y-4">
        <h3 className="text-white font-medium flex items-center gap-2">
          <MapPin size={15} className="text-amber-400" /> Location
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Street Address</label>
            <input className="input" value={form.address} onChange={f('address')} placeholder="100 N. High Street" />
          </div>
          <div>
            <label className="label">City, State, ZIP</label>
            <input className="input" value={form.address2} onChange={f('address2')} placeholder="Saint Louisville, OH 43071" />
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="card p-5 space-y-4">
        <h3 className="text-white font-medium flex items-center gap-2">
          <Phone size={15} className="text-amber-400" /> Contact
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Non-Emergency Phone</label>
            <input className="input" value={form.phone} onChange={f('phone')} placeholder="(740) 568-7800" />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={f('email')} placeholder="pd@saintlouisvilleohio.gov" />
          </div>
        </div>
      </div>

      {/* Hours */}
      <div className="card p-5 space-y-4">
        <h3 className="text-white font-medium flex items-center gap-2">
          <Clock size={15} className="text-amber-400" /> Office Hours
        </h3>
        <div>
          <label className="label">Office Hours</label>
          <textarea
            className="input resize-none"
            rows={3}
            value={form.hours}
            onChange={f('hours')}
            placeholder={'Monday – Friday: 8:00 AM – 4:30 PM\nAfter hours: call non-emergency line'}
          />
          <p className="text-slate-600 text-xs mt-1">Each line shown separately on the site.</p>
        </div>
      </div>

      {/* Department Details */}
      <div className="card p-5 space-y-4">
        <h3 className="text-white font-medium flex items-center gap-2">
          <Shield size={15} className="text-amber-400" /> Department Details
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Chief of Police</label>
            <input className="input" value={form.chief} onChange={f('chief')} placeholder="Contact Village Hall" />
          </div>
          <div>
            <label className="label">Court Presided By</label>
            <input className="input" value={form.courtPresidedBy} onChange={f('courtPresidedBy')} placeholder="Mayor Zack Allen" />
          </div>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary">
        {saving
          ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
          : <><Save size={14} /> Save Contact Info</>}
      </button>
    </div>
  )
}
