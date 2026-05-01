// apps/pd-site/src/pages/Home.jsx
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Shield, CreditCard, Gavel, Phone, MapPin, Clock, ChevronRight, AlertTriangle } from 'lucide-react'
import axios from 'axios'

const CONTACT_DEFAULTS = {
  address: '100 N. High Street',
  address2: 'Saint Louisville, OH 43071',
  phone: '(740) 568-7800',
  email: 'pd@saintlouisvilleohio.gov',
  hours: 'Monday – Friday: 8:00 AM – 4:30 PM',
  hoursNote: 'After hours: call non-emergency line',
  chief: 'Contact Village Hall',
  courtPresidedBy: 'Mayor Zack Allen',
}

function useHeroImages() {
  const [images, setImages] = useState([])
  useEffect(() => {
    axios.get('/api/pd-images').then(r => setImages(r.data.items || [])).catch(() => {})
  }, [])
  return images
}

function useContact() {
  const [contact, setContact] = useState(CONTACT_DEFAULTS)
  useEffect(() => {
    axios.get('/api/pd-contact').then(r => setContact(r.data)).catch(() => {})
  }, [])
  return contact
}

function HeroCarousel({ images }) {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (images.length <= 1) return
    const t = setInterval(() => setIdx(i => (i + 1) % images.length), 5000)
    return () => clearInterval(t)
  }, [images.length])

  if (images.length === 0) {
    return (
      <div
        className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'repeating-linear-gradient(45deg, #d97706 0, #d97706 1px, transparent 0, transparent 50%)', backgroundSize: '20px 20px' }}
      />
    )
  }

  return (
    <>
      {images.map((img, i) => (
        <img
          key={img.id}
          src={img.url}
          alt={img.caption || ''}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i === idx ? 'opacity-40' : 'opacity-0'}`}
        />
      ))}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? 'bg-amber-400 w-4' : 'bg-white/40'}`}
            />
          ))}
        </div>
      )}
    </>
  )
}

function QuickCard({ icon: Icon, title, desc, to, accent, scrollTo }) {
  const content = (
    <>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${accent}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <h3 className="font-bold text-slate-900 text-lg group-hover:text-amber-700 transition-colors">{title}</h3>
        <p className="text-slate-500 text-sm mt-1 leading-relaxed">{desc}</p>
      </div>
      <div className="flex items-center gap-1 text-amber-600 text-sm font-semibold mt-auto">
        Learn more <ChevronRight size={15} />
      </div>
    </>
  )

  const cls = 'bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group p-6 flex flex-col gap-3'

  if (scrollTo) {
    return (
      <button
        onClick={() => document.getElementById(scrollTo)?.scrollIntoView({ behavior: 'smooth' })}
        className={`${cls} text-left w-full cursor-pointer`}
      >
        {content}
      </button>
    )
  }

  return <Link to={to} className={cls}>{content}</Link>
}

export default function Home() {
  const images = useHeroImages()
  const contact = useContact()

  const phoneRaw = contact.phone?.replace(/\D/g, '') || '7405687800'

  return (
    <div>
      {/* Hero */}
      <section className="bg-slate-900 text-white relative overflow-hidden">
        <HeroCarousel images={images} />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col md:flex-row items-center gap-10 z-10">
          <div className="flex-grow">
            <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 tracking-widest uppercase">
              <Shield size={12} /> Official Village Police Department
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-4">
              Protecting &amp; Serving<br />
              <span className="text-amber-400">Saint Louisville</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-xl leading-relaxed mb-8">
              The Saint Louisville Police Department is committed to maintaining public safety, upholding the law, and building trust with every resident we serve.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/pay-fine" className="px-6 py-3 bg-amber-500 text-slate-900 font-bold rounded-xl hover:bg-amber-400 transition-colors">
                Pay a Fine Online
              </Link>
              <Link to="/mayors-court" className="px-6 py-3 border border-slate-600 text-slate-300 font-semibold rounded-xl hover:bg-slate-800 transition-colors">
                Mayor's Court Info
              </Link>
            </div>
          </div>
          {/* Badge graphic */}
          <div className="flex-shrink-0 hidden md:flex items-center justify-center">
            <div className="w-48 h-48 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center">
              <div className="w-36 h-36 rounded-full bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center">
                <Shield size={64} className="text-amber-400" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency banner */}
      <div className="bg-red-700 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-red-200 flex-shrink-0" />
            <div>
              <p className="font-extrabold text-lg leading-none">Emergency: 911</p>
              <p className="text-red-200 text-xs mt-0.5">For all life-threatening emergencies</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone size={18} className="text-red-200 flex-shrink-0" />
            <div>
              <p className="font-bold leading-none">Non-Emergency: {contact.phone}</p>
              <p className="text-red-200 text-xs mt-0.5">For non-urgent police matters</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Online Services</h2>
        <p className="text-slate-500 mb-8">Handle common tasks quickly and securely from home.</p>
        <div className="grid sm:grid-cols-3 gap-5">
          <QuickCard
            icon={CreditCard}
            title="Pay a Fine"
            desc="Look up your citation by number and last name, then pay your outstanding fine securely online."
            to="/pay-fine"
            accent="bg-amber-500"
          />
          <QuickCard
            icon={Gavel}
            title="Mayor's Court"
            desc="View upcoming court dates, understand your options, and learn how to respond to a citation."
            to="/mayors-court"
            accent="bg-slate-700"
          />
          <QuickCard
            icon={Phone}
            title="Contact the Department"
            desc="Reach our non-emergency line, submit a tip, or find the physical address for in-person visits."
            scrollTo="contact"
            accent="bg-blue-700"
          />
        </div>
      </section>

      {/* Department Info */}
      <section className="bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-amber-600 text-xs font-bold uppercase tracking-widest mb-4">
              <Shield size={12} /> About the Department
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Committed to Our Community</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              The Saint Louisville Police Department serves the residents of the Village of Saint Louisville with professionalism, integrity, and respect. Our officers are dedicated to maintaining a safe and welcoming community for all.
            </p>
            <p className="text-slate-600 leading-relaxed mb-6">
              We work closely with the Mayor, Village Council, and community members to address public safety concerns and uphold the village ordinances that make Saint Louisville a great place to live.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Chief of Police', value: contact.chief },
                { label: 'Jurisdiction', value: 'Village of Saint Louisville, OH' },
                { label: 'Court', value: "Mayor's Court" },
                { label: 'Court Presided By', value: contact.courtPresidedBy },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
                  <p className="font-semibold text-slate-800 text-sm">{value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4" id="contact">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Contact &amp; Location</h3>
            <div className="bg-slate-50 rounded-2xl p-6 space-y-4">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-800">Village Hall</p>
                  <p className="text-slate-500 text-sm">{contact.address}<br />{contact.address2}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-800">Non-Emergency Line</p>
                  <p className="text-slate-500 text-sm">{contact.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-800">Office Hours</p>
                  <p className="text-slate-500 text-sm">{contact.hours}<br />{contact.hoursNote}</p>
                </div>
              </div>
            </div>
            <a
              href={`mailto:${contact.email}`}
              className="flex items-center justify-center gap-2 w-full py-3 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:border-amber-400 hover:text-amber-700 transition-colors"
            >
              Email the Department
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
