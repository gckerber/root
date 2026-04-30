// apps/village-site/src/pages/AboutUs.jsx
import { useState, useEffect } from 'react'
import { Mail, Phone, Award, Star } from 'lucide-react'
import ContactForm from '../components/ContactForm'

const API = 'https://func-village-prod.azurewebsites.net'

const DEFAULT_OFFICIALS = [
  { id: '1', name: 'Zack Allen', title: 'Mayor', bio: 'Mayor Zack Allen has served the Village of Saint Louisville with dedication, focusing on infrastructure improvements and community engagement.', email: 'mayor@saintlouisvilleohio.gov', order: 0 },
  { id: '2', name: 'Council Member', title: 'Village Council', bio: 'Dedicated to representing the interests of all Saint Louisville residents.', email: 'council1@saintlouisvilleohio.gov', order: 1 },
  { id: '3', name: 'Council Member', title: 'Village Council', bio: 'Committed to fiscal responsibility and transparent governance.', email: 'council2@saintlouisvilleohio.gov', order: 2 },
  { id: '4', name: 'Council Member', title: 'Village Council', bio: 'Focused on community growth and maintaining the small-town character.', email: 'council3@saintlouisvilleohio.gov', order: 3 },
  { id: '5', name: 'Council Member', title: 'Village Council', bio: 'Advocate for local businesses and economic development.', email: 'council4@saintlouisvilleohio.gov', order: 4 },
  { id: '6', name: 'Council Member', title: 'Village Council', bio: 'Long-time resident passionate about preserving village history.', email: 'council5@saintlouisvilleohio.gov', order: 5 },
  { id: '7', name: 'George Kerber', title: 'Other', bio: "George oversees the Village's technology initiatives and online services.", email: 'tech@saintlouisvilleohio.gov', order: 6 },
]

function OfficialCard({ official }) {
  const initials = official.name.split(' ').map((n) => n[0]).join('').slice(0, 2)
  const isMayor = official.title === 'Mayor'
  const isOther = official.title === 'Other'

  return (
    <div className={`bg-white rounded-xl shadow-sm border p-6 flex flex-col gap-4 hover:shadow-md transition-shadow ${
      isMayor ? 'border-yellow-300 ring-2 ring-yellow-200' : isOther ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-100'
    }`}>
      <div className="flex items-center gap-4">
        {official.photoUrl ? (
          <img src={official.photoUrl} alt={official.name}
            className="w-16 h-16 rounded-full object-cover flex-shrink-0 border-2 border-gray-100" />
        ) : (
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0 ${
            isMayor ? 'bg-yellow-100 text-yellow-800' : isOther ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
          }`}>
            {initials}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900">{official.name}</h3>
            {isMayor && <Award size={16} className="text-yellow-500" />}
          </div>
          <p className={`text-sm font-medium ${
            isMayor ? 'text-yellow-700' : isOther ? 'text-blue-600' : 'text-gray-500'
          }`}>
            {official.title}
          </p>
        </div>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed flex-grow">{official.bio}</p>
      <a href={`mailto:${official.email}`}
        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium mt-auto">
        <Mail size={15} />{official.email}
      </a>
    </div>
  )
}

export default function AboutUs() {
  const [officials, setOfficials] = useState(DEFAULT_OFFICIALS)

  useEffect(() => {
    fetch(`${API}/api/officials`)
      .then((r) => r.json())
      .then((d) => { if (d.items?.length) setOfficials(d.items) })
      .catch(() => {/* use defaults */})
  }, [])

  // Group by title — only three groups: Mayor, Village Council, Other
  const mayor = officials.filter((o) => o.title === 'Mayor')
  const council = officials.filter((o) => o.title === 'Village Council')
  const other = officials.filter((o) => o.title === 'Other')

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
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-400 rounded-full" />Village Mayor
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mayor.map((o) => <OfficialCard key={o.id} official={o} />)}
          </div>
        </div>
      )}

      {/* Village Council */}
      {council.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full" />Village Council
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {council.map((o) => <OfficialCard key={o.id} official={o} />)}
          </div>
        </div>
      )}

      {/* Other */}
      {other.length > 0 && (
        <div className="mb-12">
          <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-600 rounded-full" />Other
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {other.map((o) => <OfficialCard key={o.id} official={o} />)}
          </div>
        </div>
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
