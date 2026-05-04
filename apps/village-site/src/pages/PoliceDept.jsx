// apps/village-site/src/pages/PoliceDept.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Shield, Phone, MapPin, Clock, Gavel, CreditCard,
  ChevronDown, ChevronUp, AlertTriangle, Mail,
} from 'lucide-react'
import axios from 'axios'

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

export default function PoliceDept() {
  const [contact, setContact] = useState(DEFAULTS)
  const [images, setImages] = useState([])
  const [faqs, setFaqs] = useState([])
  const [openFaq, setOpenFaq] = useState(null)
  const [imgIdx, setImgIdx] = useState(0)

  useEffect(() => {
    axios.get(`${API}/api/pd-contact`).then(r => setContact({ ...DEFAULTS, ...r.data })).catch(() => {})
    axios.get(`${API}/api/pd-images`).then(r => setImages(r.data.items || [])).catch(() => {})
    axios.get(`${API}/api/pd-faq`).then(r => setFaqs(r.data.items || [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (images.length <= 1) return
    const t = setInterval(() => setImgIdx(i => (i + 1) % images.length), 5000)
    return () => clearInterval(t)
  }, [images.length])

  return (
    <div>
      {/* Page header */}
      <div className="bg-blue-900 text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-700 rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield size={28} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-blue-300 text-sm font-medium uppercase tracking-widest">Village of Saint Louisville</p>
              <h1 className="text-3xl font-bold">Police Department</h1>
            </div>
          </div>
          <p className="mt-4 text-blue-200 max-w-2xl text-sm leading-relaxed">
            The Saint Louisville Police Department is committed to protecting and serving our community
            with professionalism, integrity, and respect for every resident we serve.
          </p>
        </div>
      </div>

      {/* Emergency banner */}
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Quick action cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          <Link
            to="/police/mayors-court"
            className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md p-5 flex items-center gap-4 transition-all group"
          >
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors flex-shrink-0">
              <Gavel size={22} className="text-blue-700" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">Mayor's Court</p>
              <p className="text-sm text-gray-500">Upcoming court dates</p>
            </div>
          </Link>

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

        {/* Contact + Carousel */}
        <div className="grid lg:grid-cols-2 gap-8 mb-10">
          <div className="space-y-4">
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

          {/* Image carousel */}
          {images.length > 0 ? (
            <div className="relative bg-gray-900 rounded-xl overflow-hidden" style={{ minHeight: '280px' }}>
              {images.map((img, i) => (
                <img
                  key={img.id}
                  src={img.url}
                  alt={img.caption || 'Police Department'}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i === imgIdx ? 'opacity-100' : 'opacity-0'}`}
                />
              ))}
              {images.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIdx(i)}
                      className={`h-1.5 rounded-full transition-all ${i === imgIdx ? 'bg-yellow-400 w-5' : 'bg-white/50 w-1.5'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-blue-50 rounded-xl border border-blue-100 p-8 flex flex-col items-center justify-center text-center">
              <Shield size={48} className="text-blue-200 mb-4" />
              <p className="text-blue-900 font-semibold">Saint Louisville Police Department</p>
              <p className="text-blue-400 text-sm mt-1">Protecting &amp; Serving Our Community</p>
            </div>
          )}
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
                      ? <ChevronUp size={18} className="text-gray-400 flex-shrink-0" />
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
      </div>
    </div>
  )
}
