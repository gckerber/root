// apps/village-site/src/pages/AboutUs.jsx
import { useState, useEffect, useMemo } from 'react'
import { Mail, Phone, Award, Users } from 'lucide-react'
import ContactForm from '../components/ContactForm'

const API = 'https://func-village-prod.azurewebsites.net'

// Soft colour palette — cycles by committee index
const COMMITTEE_COLOURS = [
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-green-100 text-green-700 border-green-200',
  'bg-purple-100 text-purple-700 border-purple-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-rose-100 text-rose-700 border-rose-200',
  'bg-teal-100 text-teal-700 border-teal-200',
  'bg-orange-100 text-orange-700 border-orange-200',
  'bg-indigo-100 text-indigo-700 border-indigo-200',
  'bg-cyan-100 text-cyan-700 border-cyan-200',
]

// Build a stable committee→colour map so the same colour always means the same committee
function buildColourMap(allCommittees) {
  const map = new Map()
  ;[...new Set(allCommittees)].forEach((c, i) => {
    map.set(c, COMMITTEE_COLOURS[i % COMMITTEE_COLOURS.length])
  })
  return map
}

// ── Full official card (Mayor / Council) ─────────────────────────────────────
function OfficialCard({ official, colourMap }) {
  const initials = official.name.split(' ').map((n) => n[0]).join('').slice(0, 2)
  const isMayor = official.title === 'Mayor'

  return (
    <div className={`bg-white rounded-xl shadow-sm border p-6 flex flex-col gap-4 hover:shadow-md transition-shadow ${
      isMayor ? 'border-yellow-300 ring-2 ring-yellow-200' : 'border-gray-100'
    }`}>
      <div className="flex items-center gap-4">
        {official.photoUrl ? (
          <img src={official.photoUrl} alt={official.name}
            className="w-16 h-16 rounded-full object-cover flex-shrink-0 border-2 border-gray-100" />
        ) : (
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0 ${
            isMayor ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-gray-900 leading-tight">{official.name}</h3>
            {isMayor && <Award size={16} className="text-yellow-500 flex-shrink-0" />}
          </div>
          <p className={`text-sm font-medium ${isMayor ? 'text-yellow-700' : 'text-gray-500'}`}>
            {official.title}
          </p>
          {/* Show work phone (or legacy phone), cell, home */}
          {(official.phoneWork || official.phone) && (
            <a href={`tel:${(official.phoneWork || official.phone).replace(/\D/g, '')}`}
              className="text-xs text-gray-400 hover:text-blue-600 transition-colors">
              {official.phoneWork || official.phone}
            </a>
          )}
          {official.phoneCell && (
            <span className="text-xs text-gray-400">Cell: {official.phoneCell}</span>
          )}
          {official.phoneHome && (
            <span className="text-xs text-gray-400">Home: {official.phoneHome}</span>
          )}
        </div>
      </div>

      {official.bio && (
        <p className="text-sm text-gray-600 leading-relaxed flex-grow">{official.bio}</p>
      )}

      {/* Committee tags */}
      {official.committees?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {official.committees.map((c) => {
            const baseCommittee = c.replace(/\s*\(Chair\)/i, '').trim()
            const isChair = /\(Chair\)/i.test(c)
            const colour = colourMap?.get(baseCommittee) || colourMap?.get(c) || COMMITTEE_COLOURS[0]
            return (
              <span
                key={c}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${colour}`}
              >
                {isChair && <span className="font-bold">★</span>}
                {baseCommittee}
                {isChair && <span className="opacity-60 text-xs">(Chair)</span>}
              </span>
            )
          })}
        </div>
      )}

      {official.email && (
        <a href={`mailto:${official.email}`}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium mt-auto">
          <Mail size={15} />{official.email}
        </a>
      )}
    </div>
  )
}

// ── Compact committee card ────────────────────────────────────────────────────
function CommitteeCard({ name, members, colour }) {
  const chair = members.find((m) => m.isChair)
  const others = members.filter((m) => !m.isChair)

  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border mb-3 ${colour}`}>
        {name}
      </div>
      <div className="space-y-1">
        {chair && (
          <div className="flex items-center gap-2">
            <span className="text-yellow-500 text-xs">★</span>
            <span className="text-sm font-semibold text-gray-800">{chair.name}</span>
            <span className="text-xs text-gray-400">Chair</span>
          </div>
        )}
        {others.map((m) => (
          <div key={m.name} className="flex items-center gap-2">
            <span className="w-3 h-3 flex-shrink-0" />
            <span className="text-sm text-gray-600">{m.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AboutUs() {
  const [officials, setOfficials] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/officials`)
      .then((r) => r.json())
      .then((d) => { if (d.items?.length) setOfficials(d.items) })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  // Police Department officers are shown on the PD page, not here
  const mayor   = officials.filter((o) => o.department !== 'police' && o.title === 'Mayor')
  const council = officials.filter((o) => o.department !== 'police' && o.title === 'Village Council').sort((a, b) => a.order - b.order)
  const other   = officials.filter((o) => o.department !== 'police' && o.title !== 'Mayor' && o.title !== 'Village Council').sort((a, b) => a.order - b.order)

  // Build a stable list of all unique base-committee names and a colour map
  const { committeeList, colourMap } = useMemo(() => {
    const allTags = council.flatMap((o) => o.committees || [])
    const baseNames = [...new Set(allTags.map((t) => t.replace(/\s*\(Chair\)/i, '').trim()))]
    const map = buildColourMap(baseNames)
    return { committeeList: baseNames, colourMap: map }
  }, [council])

  // Build committee→members map for the committees section
  const committeeGroups = useMemo(() => {
    const groups = new Map()
    council.forEach((official) => {
      ;(official.committees || []).forEach((tag) => {
        const isChair = /\(Chair\)/i.test(tag)
        const baseName = tag.replace(/\s*\(Chair\)/i, '').trim()
        if (!groups.has(baseName)) groups.set(baseName, [])
        groups.get(baseName).push({ name: official.name, isChair })
      })
    })
    // Sort each group: chair first
    groups.forEach((members, key) => {
      groups.set(key, members.sort((a, b) => (b.isChair ? 1 : 0) - (a.isChair ? 1 : 0)))
    })
    return groups
  }, [council])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Get to Know Us</h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          Meet the dedicated officials who serve the Village of Saint Louisville, Ohio
        </p>
      </div>

      {/* Mayor */}
      {mayor.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-400 rounded-full" />Village Mayor
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mayor.map((o) => <OfficialCard key={o.id} official={o} colourMap={colourMap} />)}
          </div>
        </section>
      )}

      {/* Village Council */}
      {council.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full" />Village Council
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {council.map((o) => <OfficialCard key={o.id} official={o} colourMap={colourMap} />)}
          </div>
        </section>
      )}

      {/* Committees */}
      {committeeGroups.size > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-700 mb-1 flex items-center gap-2">
            <span className="w-2 h-2 bg-teal-500 rounded-full" />Committees
          </h2>
          <p className="text-sm text-gray-400 mb-4">★ denotes committee chairperson</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[...committeeGroups.entries()].map(([name, members]) => (
              <CommitteeCard
                key={name}
                name={name}
                members={members}
                colour={colourMap.get(name) || COMMITTEE_COLOURS[0]}
              />
            ))}
          </div>
        </section>
      )}

      {/* Other officials */}
      {other.length > 0 && (
        <section className="mb-12">
          <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-gray-400 rounded-full" />Other Officials &amp; Staff
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {other.map((o) => <OfficialCard key={o.id} official={o} colourMap={colourMap} />)}
          </div>
        </section>
      )}

      {/* Contact */}
      <div className="border-t border-gray-200 pt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Contact Us</h2>
        <p className="text-gray-500 text-center mb-8">
          Have a question or concern? Send us a message and we'll get back to you.
        </p>
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-6">
            <div className="bg-blue-50 rounded-xl p-6 space-y-4">
              <h3 className="font-bold text-gray-800">Village Hall</h3>
              <div className="flex items-start gap-3 text-sm text-gray-600">
                <Phone size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">Phone</div>
                  <a href="tel:+17405687800" className="hover:text-blue-600">(740) 568-7800</a>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm text-gray-600">
                <Mail size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">Email</div>
                  <a href="mailto:info@saintlouisvilleohio.gov" className="hover:text-blue-600">
                    info@saintlouisvilleohio.gov
                  </a>
                </div>
              </div>
            </div>
          </div>
          <ContactForm />
        </div>
      </div>
    </div>
  )
}
