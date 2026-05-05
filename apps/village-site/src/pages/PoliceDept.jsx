// apps/village-site/src/pages/PoliceDept.jsx
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Shield, Phone, MapPin, Clock, Gavel, CreditCard,
  ChevronDown, ChevronUp, AlertTriangle, Mail,
  Calendar, Users, Home, ChevronLeft, ChevronRight,
} from 'lucide-react'
import axios from 'axios'
import HeroCarousel from '../components/HeroCarousel'

const API = 'https://func-village-prod.azurewebsites.net'

const DEFAULTS = {
  address: '100 N. High Street',
  address2: 'Saint Louisville, OH 43071',
  phone: '(740) 568-7800',
  email: 'pd@saintlouisvilleohio.gov',
  hours: 'Monday – Friday: 8:00 AM – 4:30 PM\nAfter hours: call non-emergency line',
  chief: 'Contact Village Hall',
  courtPresidedBy: 'Mayor Zack Allen',
}

const TABS = [
  { id: 'home',     label: 'Home',           icon: Home },
  { id: 'officers', label: 'Officers',        icon: Users },
  { id: 'court',    label: "Mayor's Court",   icon: Gavel },
  { id: 'events',   label: 'Events',          icon: Calendar },
]

const LAYOUT_MODES = [
  { id: 'grid',      label: 'Grid' },
  { id: 'wide',      label: '2-Column' },
  { id: 'full',      label: 'Full Width' },
  { id: 'spotlight', label: 'Spotlight' },
]

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })
  } catch { return dateStr }
}

function formatTime(timeStr) {
  if (!timeStr) return null
  try {
    const [h, m] = timeStr.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
  } catch { return timeStr }
}

function getInitials(name) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

// ── Officer card: Grid (3-col, circular photo) ────────────────────────────────
function OfficerCardGrid({ officer }) {
  const initials = getInitials(officer.name)
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        {officer.photoUrl ? (
          <img src={officer.photoUrl} alt={officer.name}
            className="w-16 h-16 rounded-full object-cover flex-shrink-0 border-2 border-gray-100" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-xl font-bold text-blue-800 flex-shrink-0">
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="font-bold text-gray-900 leading-tight">{officer.name}</h3>
          <p className="text-sm font-medium text-blue-700">{officer.title || 'Police Department'}</p>
          {(officer.phoneWork || officer.phone) && (
            <a href={`tel:${(officer.phoneWork || officer.phone).replace(/\D/g, '')}`}
              className="text-xs text-gray-400 hover:text-blue-600 transition-colors block">
              {officer.phoneWork || officer.phone}
            </a>
          )}
          {officer.phoneCell && (
            <span className="block text-xs text-gray-400">Cell: {officer.phoneCell}</span>
          )}
        </div>
      </div>
      {officer.bio && (
        <p className="text-sm text-gray-600 leading-relaxed flex-grow">{officer.bio}</p>
      )}
      {officer.email && (
        <a href={`mailto:${officer.email}`}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium mt-auto">
          <Mail size={15} />{officer.email}
        </a>
      )}
    </div>
  )
}

// ── Officer card: Wide (2-col, horizontal, square photo on left) ──────────────
function OfficerCardWide({ officer }) {
  const initials = getInitials(officer.name)
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex overflow-hidden hover:shadow-md transition-shadow">
      <div className="w-32 flex-shrink-0 bg-blue-50 relative">
        {officer.photoUrl ? (
          <img src={officer.photoUrl} alt={officer.name}
            className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-blue-300">
            {initials}
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-grow min-w-0 min-h-[8rem]">
        <h3 className="font-bold text-gray-900 leading-tight">{officer.name}</h3>
        <p className="text-sm font-medium text-blue-700 mb-2">{officer.title || 'Police Department'}</p>
        <div className="space-y-1">
          {(officer.phoneWork || officer.phone) && (
            <a href={`tel:${(officer.phoneWork || officer.phone).replace(/\D/g, '')}`}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 transition-colors">
              <Phone size={11} className="flex-shrink-0" />{officer.phoneWork || officer.phone}
            </a>
          )}
          {officer.phoneCell && (
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <Phone size={11} className="flex-shrink-0" />Cell: {officer.phoneCell}
            </span>
          )}
        </div>
        {officer.bio && (
          <p className="text-xs text-gray-500 leading-relaxed mt-2 flex-grow line-clamp-3">{officer.bio}</p>
        )}
        {officer.email && (
          <a href={`mailto:${officer.email}`}
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium mt-2">
            <Mail size={11} />{officer.email}
          </a>
        )}
      </div>
    </div>
  )
}

// ── Officer card: Full Width (1-col, large photo on left) ─────────────────────
function OfficerCardFull({ officer }) {
  const initials = getInitials(officer.name)
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex overflow-hidden hover:shadow-md transition-shadow">
      <div className="w-44 sm:w-56 flex-shrink-0 bg-blue-50 relative min-h-[10rem]">
        {officer.photoUrl ? (
          <img src={officer.photoUrl} alt={officer.name}
            className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-6xl font-bold text-blue-300">
            {initials}
          </div>
        )}
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-extrabold text-gray-900 text-xl leading-tight">{officer.name}</h3>
            <p className="text-base font-semibold text-blue-700 mt-0.5">{officer.title || 'Police Department'}</p>
          </div>
          {officer.email && (
            <a href={`mailto:${officer.email}`}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium">
              <Mail size={15} />{officer.email}
            </a>
          )}
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 mb-3">
          {(officer.phoneWork || officer.phone) && (
            <a href={`tel:${(officer.phoneWork || officer.phone).replace(/\D/g, '')}`}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors">
              <Phone size={13} className="text-blue-500 flex-shrink-0" />
              Work: {officer.phoneWork || officer.phone}
            </a>
          )}
          {officer.phoneCell && (
            <span className="flex items-center gap-1.5 text-sm text-gray-600">
              <Phone size={13} className="text-blue-500 flex-shrink-0" />Cell: {officer.phoneCell}
            </span>
          )}
          {officer.phoneHome && (
            <span className="flex items-center gap-1.5 text-sm text-gray-600">
              <Phone size={13} className="text-blue-500 flex-shrink-0" />Home: {officer.phoneHome}
            </span>
          )}
        </div>
        {officer.bio && (
          <p className="text-sm text-gray-600 leading-relaxed flex-grow">{officer.bio}</p>
        )}
      </div>
    </div>
  )
}

// ── Spotlight: single officer, full-width, auto-cycling ───────────────────────
function OfficerSpotlight({ officers }) {
  const [idx, setIdx]       = useState(0)
  const [paused, setPaused] = useState(false)
  const intervalRef         = useRef(null)

  useEffect(() => {
    clearInterval(intervalRef.current)
    if (officers.length <= 1 || paused) return
    intervalRef.current = setInterval(() => {
      setIdx((i) => (i + 1) % officers.length)
    }, 5000)
    return () => clearInterval(intervalRef.current)
  }, [paused, officers.length])

  if (officers.length === 0) return null

  const goTo = (i) => { clearInterval(intervalRef.current); setIdx(i) }
  const prev = () => goTo((idx - 1 + officers.length) % officers.length)
  const next = () => goTo((idx + 1) % officers.length)

  const officer  = officers[idx]
  const initials = getInitials(officer.name)

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Main card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="flex flex-col sm:flex-row min-h-[22rem]">
          {/* Photo */}
          <div className="sm:w-80 flex-shrink-0 bg-gradient-to-br from-blue-900 to-blue-700 relative overflow-hidden">
            {officer.photoUrl ? (
              <img src={officer.photoUrl} alt={officer.name}
                className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-9xl font-bold text-blue-400/40">{initials}</span>
              </div>
            )}
            {/* Gradient overlay at bottom */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-blue-950/60 to-transparent sm:hidden" />
          </div>

          {/* Info */}
          <div className="flex-grow p-8 flex flex-col justify-center">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">
              {officer.title || 'Police Department'}
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-5 leading-tight">
              {officer.name}
            </h2>

            <div className="space-y-2 mb-5">
              {(officer.phoneWork || officer.phone) && (
                <a href={`tel:${(officer.phoneWork || officer.phone).replace(/\D/g, '')}`}
                  className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-blue-600 transition-colors">
                  <span className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Phone size={14} className="text-blue-600" />
                  </span>
                  <span><span className="text-gray-400 mr-1">Work</span>{officer.phoneWork || officer.phone}</span>
                </a>
              )}
              {officer.phoneCell && (
                <span className="flex items-center gap-2.5 text-sm text-gray-700">
                  <span className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Phone size={14} className="text-blue-600" />
                  </span>
                  <span><span className="text-gray-400 mr-1">Cell</span>{officer.phoneCell}</span>
                </span>
              )}
              {officer.phoneHome && (
                <span className="flex items-center gap-2.5 text-sm text-gray-700">
                  <span className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Phone size={14} className="text-blue-600" />
                  </span>
                  <span><span className="text-gray-400 mr-1">Home</span>{officer.phoneHome}</span>
                </span>
              )}
              {officer.email && (
                <a href={`mailto:${officer.email}`}
                  className="flex items-center gap-2.5 text-sm text-blue-600 hover:text-blue-800 transition-colors">
                  <span className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Mail size={14} className="text-blue-600" />
                  </span>
                  {officer.email}
                </a>
              )}
            </div>

            {officer.bio && (
              <p className="text-gray-600 leading-relaxed text-sm">{officer.bio}</p>
            )}

            {/* Counter */}
            {officers.length > 1 && (
              <p className="text-xs text-gray-400 mt-6">
                {idx + 1} of {officers.length}
                {!paused && <span className="ml-1 opacity-60">· auto-advancing</span>}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Prev / Next arrows */}
      {officers.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full shadow-md flex items-center justify-center text-gray-600 hover:text-blue-700 transition-all"
            aria-label="Previous officer"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full shadow-md flex items-center justify-center text-gray-600 hover:text-blue-700 transition-all"
            aria-label="Next officer"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {officers.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {officers.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to officer ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === idx
                  ? 'w-6 h-2.5 bg-blue-700'
                  : 'w-2.5 h-2.5 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Layout toolbar ─────────────────────────────────────────────────────────────
function LayoutPicker({ layout, onChange }) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
      {LAYOUT_MODES.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
            layout === id
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PoliceDept() {
  const [tab,        setTab]        = useState('home')
  const [contact,    setContact]    = useState(DEFAULTS)
  const [images,     setImages]     = useState([])
  const [faqs,       setFaqs]       = useState([])
  const [openFaq,    setOpenFaq]    = useState(null)
  const [officers,   setOfficers]   = useState([])
  const [courtDates, setCourtDates] = useState([])
  const [events,     setEvents]     = useState([])
  const [tabLoading, setTabLoading] = useState({ officers: false, court: false, events: false })
  const [layout,     setLayout]     = useState(
    () => localStorage.getItem('pd-officer-layout') || 'grid'
  )

  // Track which tabs have already been fetched (so we don't re-fetch on tab re-click)
  const loadedTabs = useRef(new Set())

  const handleLayoutChange = (newLayout) => {
    setLayout(newLayout)
    localStorage.setItem('pd-officer-layout', newLayout)
  }

  // Core data — loaded on mount
  useEffect(() => {
    axios.get(`${API}/api/pd-contact`).then((r) => setContact({ ...DEFAULTS, ...r.data })).catch(() => {})
    axios.get(`${API}/api/pd-images`).then((r) => setImages(r.data.items || [])).catch(() => {})
    axios.get(`${API}/api/pd-faq`).then((r) => setFaqs(r.data.items || [])).catch(() => {})
  }, [])

  // Lazy-load tab-specific data on first visit to each tab
  useEffect(() => {
    if (tab === 'officers' && !loadedTabs.current.has('officers')) {
      loadedTabs.current.add('officers')
      setTabLoading((l) => ({ ...l, officers: true }))
      axios.get(`${API}/api/officials`)
        .then((r) => {
          const pd = (r.data.items || [])
            .filter((o) => o.department === 'police')
            .sort((a, b) => a.order - b.order)
          setOfficers(pd)
        })
        .catch(() => {})
        .finally(() => setTabLoading((l) => ({ ...l, officers: false })))
    }

    if (tab === 'court' && !loadedTabs.current.has('court')) {
      loadedTabs.current.add('court')
      setTabLoading((l) => ({ ...l, court: true }))
      axios.get(`${API}/api/pd-court-schedule?upcoming=true`)
        .then((r) => setCourtDates(r.data.items || []))
        .catch(() => {})
        .finally(() => setTabLoading((l) => ({ ...l, court: false })))
    }

    if (tab === 'events' && !loadedTabs.current.has('events')) {
      loadedTabs.current.add('events')
      setTabLoading((l) => ({ ...l, events: true }))
      axios.get(`${API}/api/events?department=police`)
        .then((r) => {
          const sorted = (r.data.items || []).sort((a, b) => new Date(a.date) - new Date(b.date))
          setEvents(sorted)
        })
        .catch(() => {})
        .finally(() => setTabLoading((l) => ({ ...l, events: false })))
    }
  }, [tab])

  const upcomingEvents = events.filter((e) => new Date(e.date) >= new Date())
  const pastEvents     = events.filter((e) => new Date(e.date) < new Date())

  return (
    <div>
      {/* ── Emergency banner — pinned at very top ────────────────── */}
      <div className="bg-red-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap gap-6 items-center">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-200 flex-shrink-0" />
            <span className="font-extrabold">Emergency: 911</span>
            <span className="text-red-300 text-sm hidden sm:inline">— For all life-threatening emergencies</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={15} className="text-red-200 flex-shrink-0" />
            <span className="font-semibold">Non-Emergency: {contact.phone}</span>
          </div>
        </div>
      </div>

      {/* ── Full-width hero carousel ─────────────────────────────── */}
      <HeroCarousel
        images={images}
        heightClass="h-[55vh] min-h-[380px] max-h-[680px]"
        gradient="bg-gradient-to-t from-blue-950/85 via-blue-900/40 to-transparent"
      >
        <div className="h-full flex flex-col justify-end pb-10 px-6 sm:px-12 lg:px-20 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-700/80 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 border border-blue-500/30">
              <Shield size={28} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-blue-300 text-sm font-medium uppercase tracking-widest drop-shadow">
                Village of Saint Louisville
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg">
                Police Department
              </h1>
            </div>
          </div>
          <p className="mt-3 text-blue-200 max-w-xl text-sm leading-relaxed drop-shadow">
            Committed to protecting and serving our community with professionalism,
            integrity, and respect for every resident.
          </p>
        </div>
      </HeroCarousel>

      {/* ── Tab bar ──────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-0 overflow-x-auto">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  tab === id
                    ? 'border-blue-700 text-blue-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ── Tab content ──────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ════ HOME TAB ════ */}
        {tab === 'home' && (
          <>
            {/* Quick action cards */}
            <div className="grid sm:grid-cols-3 gap-4 mb-10">
              <button
                onClick={() => setTab('court')}
                className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md p-5 flex items-center gap-4 transition-all group text-left w-full"
              >
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors flex-shrink-0">
                  <Gavel size={22} className="text-blue-700" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Mayor's Court</p>
                  <p className="text-sm text-gray-500">Upcoming court dates</p>
                </div>
              </button>

              <Link
                to="/police/fines"
                className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md p-5 flex items-center gap-4 transition-all group"
              >
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-green-100 transition-colors flex-shrink-0">
                  <CreditCard size={22} className="text-green-700" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Pay a Fine</p>
                  <p className="text-sm text-gray-500">Payment options &amp; info</p>
                </div>
              </Link>

              <a
                href={`mailto:${contact.email}`}
                className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md p-5 flex items-center gap-4 transition-all group"
              >
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center group-hover:bg-amber-100 transition-colors flex-shrink-0">
                  <Mail size={22} className="text-amber-700" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Email the Department</p>
                  <p className="text-sm text-gray-500">{contact.email}</p>
                </div>
              </a>
            </div>

            {/* Contact + Department Details */}
            <div className="grid sm:grid-cols-2 gap-6 mb-10">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-bold text-gray-800 text-lg mb-4">Contact &amp; Location</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="text-blue-700 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-700">{contact.address}</p>
                      <p className="text-sm text-gray-500">{contact.address2}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone size={18} className="text-blue-700 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-700">{contact.phone}</p>
                      <p className="text-xs text-gray-400">Non-emergency line</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock size={18} className="text-blue-700 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-600 whitespace-pre-line">{contact.hours}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-bold text-gray-800 text-lg mb-4">Department Details</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Chief of Police</p>
                    <p className="font-medium text-gray-800 text-sm">{contact.chief}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Court Presided By</p>
                    <p className="font-medium text-gray-800 text-sm">{contact.courtPresidedBy}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Jurisdiction</p>
                    <p className="font-medium text-gray-800 text-sm">Village of Saint Louisville, OH</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ */}
            {faqs.length > 0 && (
              <div>
                <h2 className="font-bold text-gray-800 text-xl mb-4">Frequently Asked Questions</h2>
                <div className="space-y-2">
                  {faqs.map((faq, i) => (
                    <div key={faq.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                      <button
                        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      >
                        <span className="font-medium text-gray-800 pr-4">{faq.question}</span>
                        {openFaq === i
                          ? <ChevronUp   size={18} className="text-gray-400 flex-shrink-0" />
                          : <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />}
                      </button>
                      {openFaq === i && (
                        <div className="px-6 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-3">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ════ OFFICERS TAB ════ */}
        {tab === 'officers' && (
          <div>
            {/* Header row with layout picker */}
            <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Meet Our Officers</h2>
                <p className="text-gray-500">The dedicated men and women serving the Village of Saint Louisville.</p>
              </div>
              {!tabLoading.officers && officers.length > 0 && (
                <LayoutPicker layout={layout} onChange={handleLayoutChange} />
              )}
            </div>

            {tabLoading.officers ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 animate-pulse">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex-shrink-0" />
                      <div className="space-y-2 flex-grow">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                    <div className="h-12 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            ) : officers.length === 0 ? (
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-12 text-center">
                <Shield size={40} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-700 font-semibold text-lg">Officer profiles coming soon</p>
                <p className="text-gray-400 text-sm mt-2">
                  Contact the department to learn more about our team.
                </p>
              </div>
            ) : layout === 'spotlight' ? (
              <OfficerSpotlight officers={officers} />
            ) : layout === 'full' ? (
              <div className="space-y-4">
                {officers.map((o) => <OfficerCardFull key={o.id} officer={o} />)}
              </div>
            ) : layout === 'wide' ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {officers.map((o) => <OfficerCardWide key={o.id} officer={o} />)}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {officers.map((o) => <OfficerCardGrid key={o.id} officer={o} />)}
              </div>
            )}
          </div>
        )}

        {/* ════ MAYOR'S COURT TAB ════ */}
        {tab === 'court' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Mayor's Court</h2>
              <p className="text-gray-500">
                Upcoming court sessions presided over by {contact.courtPresidedBy}.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8 flex gap-3">
              <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 leading-relaxed">
                <p className="font-semibold mb-1">Important Notice</p>
                <p>
                  If you have received a citation and have questions about your court date,
                  contact the Saint Louisville Police Department at <strong>{contact.phone}</strong>.
                  For fine payment options, visit the{' '}
                  <Link to="/police/fines" className="underline font-semibold hover:text-amber-900">
                    Pay a Fine
                  </Link>{' '}
                  page.
                </p>
              </div>
            </div>

            {tabLoading.court ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                  </div>
                ))}
              </div>
            ) : courtDates.length === 0 ? (
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-12 text-center">
                <Gavel size={40} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-700 font-semibold text-lg">No Upcoming Court Dates</p>
                <p className="text-gray-400 text-sm mt-2">
                  There are no Mayor's Court sessions currently scheduled.
                  Check back later or call <strong>{contact.phone}</strong>.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {courtDates.map((d) => (
                  <div
                    key={d.id}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Calendar size={22} className="text-blue-700" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-lg">{formatDate(d.date)}</p>
                          <div className="flex flex-wrap gap-4 mt-1.5">
                            {d.time && (
                              <span className="flex items-center gap-1.5 text-sm text-gray-500">
                                <Clock size={14} className="text-gray-400" />
                                {formatTime(d.time)}
                              </span>
                            )}
                            {d.location && (
                              <span className="flex items-center gap-1.5 text-sm text-gray-500">
                                <MapPin size={14} className="text-gray-400" />
                                {d.location}
                              </span>
                            )}
                          </div>
                          {d.notes && (
                            <p className="text-sm text-gray-400 mt-2 italic">{d.notes}</p>
                          )}
                        </div>
                      </div>
                      {d.judge && (
                        <div className="sm:text-right flex-shrink-0">
                          <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Presiding</p>
                          <p className="text-sm font-medium text-gray-700 mt-0.5">{d.judge}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-400">
                Court dates are subject to change. Always confirm with the police department before appearing.
              </p>
            </div>
          </div>
        )}

        {/* ════ EVENTS TAB ════ */}
        {tab === 'events' && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Police Department Events</h2>
              <p className="text-gray-500">
                Community events and programs hosted by the Saint Louisville Police Department.
              </p>
            </div>

            {tabLoading.events ? (
              <div className="space-y-4">
                {[1, 2].map((n) => (
                  <div key={n} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 animate-pulse">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-200 flex-shrink-0" />
                      <div className="flex-grow space-y-2">
                        <div className="h-5 bg-gray-200 rounded w-1/2" />
                        <div className="h-4 bg-gray-200 rounded w-1/3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : upcomingEvents.length === 0 && pastEvents.length === 0 ? (
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-12 text-center">
                <Calendar size={40} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-700 font-semibold text-lg">No upcoming events</p>
                <p className="text-gray-400 text-sm mt-2">
                  Check back soon for community events from the Police Department.
                </p>
              </div>
            ) : (
              <>
                {upcomingEvents.length > 0 && (
                  <div className="space-y-4">
                    {upcomingEvents.map((event) => (
                      <div
                        key={event.id}
                        className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                      >
                        {/* Show all photos in a horizontal row, or single photo as full banner */}
                        {(() => {
                          const photos = event.photoUrls?.length ? event.photoUrls : (event.photoUrl ? [event.photoUrl] : [])
                          if (photos.length === 0) return null
                          if (photos.length === 1) return (
                            <img src={photos[0]} alt={event.title} className="w-full h-40 object-cover" />
                          )
                          return (
                            <div className="flex gap-0.5 h-36 overflow-hidden">
                              {photos.slice(0, 3).map((url, i) => (
                                <div key={i} className="flex-1 relative overflow-hidden">
                                  <img src={url} alt="" className="w-full h-full object-cover" />
                                  {i === 2 && photos.length > 3 && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                      <span className="text-white font-bold text-lg">+{photos.length - 3}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )
                        })()}
                        <div className="p-6 flex gap-4">
                          <div className="w-12 h-14 bg-blue-50 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                            <span className="text-blue-700 text-xs font-medium leading-none">
                              {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                            </span>
                            <span className="text-blue-900 font-bold text-lg leading-none">
                              {new Date(event.date).getDate()}
                            </span>
                          </div>
                          <div className="flex-grow">
                            <h3 className="font-bold text-gray-800 text-lg">{event.title}</h3>
                            <div className="flex flex-wrap gap-4 mt-1">
                              {event.time && (
                                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                                  <Clock size={14} />{formatTime(event.time)}
                                </span>
                              )}
                              {event.location && (
                                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                                  <MapPin size={14} />{event.location}
                                </span>
                              )}
                            </div>
                            {event.description && (
                              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{event.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {pastEvents.length > 0 && (
                  <details className="mt-6">
                    <summary className="text-gray-400 text-sm cursor-pointer hover:text-gray-600 transition-colors pt-4 border-t border-gray-100">
                      Show {pastEvents.length} past event{pastEvents.length !== 1 ? 's' : ''}
                    </summary>
                    <div className="mt-3 space-y-3 opacity-60">
                      {pastEvents.map((event) => (
                        <div
                          key={event.id}
                          className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex gap-4 items-start"
                        >
                          <div className="text-gray-500 text-sm w-28 flex-shrink-0 pt-0.5">
                            {new Date(event.date).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric',
                            })}
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">{event.title}</p>
                            {event.location && (
                              <p className="text-xs text-gray-400 mt-0.5">{event.location}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
