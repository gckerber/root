// apps/village-site/src/pages/AboutUs.jsx
import { useState } from 'react'
import { Mail, Phone, Award } from 'lucide-react'
import ContactForm from '../components/ContactForm'

const officials = [
  {
    name: 'Zack Allen',
    title: 'Mayor',
    bio: 'Mayor Zack Allen has served the Village of Saint Louisville with dedication, focusing on infrastructure improvements and community engagement.',
    email: 'mayor@saintlouisvilleohio.gov',
    highlight: true,
  },
  {
    name: 'Council Member 1',
    title: 'Village Council',
    bio: 'Dedicated to representing the interests of all Saint Louisville residents on matters of zoning, public safety, and community development.',
    email: 'council1@saintlouisvilleohio.gov',
  },
  {
    name: 'Council Member 2',
    title: 'Village Council',
    bio: 'Committed to fiscal responsibility and transparent governance for the Village and its residents.',
    email: 'council2@saintlouisvilleohio.gov',
  },
  {
    name: 'Council Member 3',
    title: 'Village Council',
    bio: 'Focused on community growth, parks, and maintaining the small-town character that makes Saint Louisville special.',
    email: 'council3@saintlouisvilleohio.gov',
  },
  {
    name: 'Council Member 4',
    title: 'Village Council',
    bio: 'Advocate for local businesses and economic development within the Village and surrounding region.',
    email: 'council4@saintlouisvilleohio.gov',
  },
  {
    name: 'Council Member 5',
    title: 'Village Council',
    bio: 'Long-time resident passionate about preserving the history and heritage of Saint Louisville for future generations.',
    email: 'council5@saintlouisvilleohio.gov',
  },
  {
    name: 'George Kerber',
    title: 'Tech Czar',
    bio: 'George oversees the Village\'s technology initiatives, digital infrastructure, and online services — including this very website.',
    email: 'tech@saintlouisvilleohio.gov',
    special: true,
  },
]

function OfficialCard({ official }) {
  const initials = official.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border p-6 flex flex-col gap-4 hover:shadow-md transition-shadow ${
        official.highlight
          ? 'border-yellow-300 ring-2 ring-yellow-200'
          : official.special
          ? 'border-blue-200 ring-2 ring-blue-100'
          : 'border-gray-100'
      }`}
    >
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0 ${
            official.highlight
              ? 'bg-yellow-100 text-yellow-800'
              : official.special
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {initials}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900">{official.name}</h3>
            {official.highlight && (
              <Award size={16} className="text-yellow-500" />
            )}
          </div>
          <p className={`text-sm font-medium ${
            official.highlight ? 'text-yellow-700' : official.special ? 'text-blue-600' : 'text-gray-500'
          }`}>
            {official.title}
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-600 leading-relaxed flex-grow">{official.bio}</p>

      <a
        href={`mailto:${official.email}`}
        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium mt-auto"
      >
        <Mail size={15} />
        {official.email}
      </a>
    </div>
  )
}

export default function AboutUs() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Get to Know Us</h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          Meet the dedicated officials who serve the Village of Saint Louisville, Ohio
        </p>
      </div>

      {/* Mayor featured first */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-yellow-400 rounded-full" />
          Village Mayor
        </h2>
        <div className="max-w-md">
          <OfficialCard official={officials[0]} />
        </div>
      </div>

      {/* Council Members */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full" />
          Village Council
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {officials.slice(1, 6).map((o) => (
            <OfficialCard key={o.name} official={o} />
          ))}
        </div>
      </div>

      {/* Tech Czar */}
      <div className="mb-12">
        <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-600 rounded-full" />
          Technology
        </h2>
        <div className="max-w-md">
          <OfficialCard official={officials[6]} />
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 pt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Contact Us</h2>
        <p className="text-gray-500 text-center mb-8">
          Have a question or concern? Send us a message and we'll get back to you.
        </p>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Contact info */}
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

            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-bold text-gray-800 mb-3">Council Meeting Schedule</h3>
              <p className="text-sm text-gray-600">
                The Village Council meets on a regular schedule at Village Hall.
                Check the <a href="/calendar" className="text-blue-600 hover:underline">Events Calendar</a> for
                upcoming meeting dates. All meetings are open to the public.
              </p>
            </div>
          </div>

          {/* Contact form */}
          <ContactForm />
        </div>
      </div>
    </div>
  )
}
