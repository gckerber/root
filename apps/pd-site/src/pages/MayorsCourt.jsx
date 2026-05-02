// apps/pd-site/src/pages/MayorsCourt.jsx
import { useState, useEffect } from 'react'
import { Gavel, Calendar, Clock, MapPin, ChevronDown, ChevronUp, CheckCircle, AlertCircle, FileText, Phone } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import axios from 'axios'

const API = import.meta.env.VITE_API_BASE_URL || 'https://func-village-prod.azurewebsites.net'

const DEFAULT_FAQS = [
  { id: 'd1', question: 'Can I request a continuance (postponement)?', answer: 'Yes. Contact Village Hall at (740) 568-7800 before your court date to request a continuance. Continuances are granted at the court\'s discretion and are not guaranteed.' },
  { id: 'd2', question: 'What happens if I miss my court date?', answer: 'Failure to appear may result in additional fines, suspension of your driver\'s license, or an arrest warrant. Contact Village Hall immediately if you cannot make your court date.' },
  { id: 'd3', question: 'Can I have an attorney represent me?', answer: 'Yes, you have the right to be represented by an attorney at your own expense. If you cannot afford an attorney, you may request a transfer to Licking County Municipal Court where a public defender may be available.' },
  { id: 'd4', question: 'What if I want to transfer my case to Municipal Court?', answer: 'You may request a transfer to Licking County Municipal Court at any time before the Mayor\'s Court renders a decision. Contact Village Hall to initiate the transfer.' },
  { id: 'd5', question: "Are Mayor's Court records public?", answer: "Mayor's Court is not a court of record. However, convictions are reported to the Ohio BMV and will appear on your driving record for traffic violations." },
  { id: 'd6', question: 'Can I pay my fine in installments?', answer: 'Contact Village Hall at (740) 568-7800 to discuss payment arrangements. Installment plans are considered on a case-by-case basis at the Mayor\'s discretion.' },
]

function useCourtSchedule() {
  const [dates, setDates] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    axios.get(`${API}/api/pd-court-schedule`, { params: { upcoming: 'true' } })
      .then(r => setDates(r.data.items || []))
      .catch(() => setDates([]))
      .finally(() => setLoading(false))
  }, [])
  return { dates, loading }
}

function useFaq() {
  const [faqs, setFaqs] = useState([])
  useEffect(() => {
    axios.get(`${API}/api/pd-faq`).then(r => setFaqs(r.data.items || [])).catch(() => {})
  }, [])
  return faqs.length > 0 ? faqs : DEFAULT_FAQS
}

function Accordion({ question, children }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-slate-50 transition-colors"
      >
        <span className="font-semibold text-slate-800">{question}</span>
        {open ? <ChevronUp size={18} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={18} className="text-slate-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-5 bg-white text-slate-600 text-sm leading-relaxed border-t border-slate-100">
          <div className="pt-4">{children}</div>
        </div>
      )}
    </div>
  )
}

export default function MayorsCourt() {
  const { dates, loading } = useCourtSchedule()
  const faqs = useFaq()
  const nextThree = dates.slice(0, 3)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
            <Gavel size={20} className="text-amber-400" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900">Mayor's Court</h1>
        </div>
        <p className="text-slate-500 text-lg">
          Information about Mayor's Court proceedings, upcoming dates, and how to respond to a citation.
        </p>
      </div>

      {/* Upcoming court dates */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-amber-600" /> Upcoming Court Dates
        </h2>
        {loading ? (
          <div className="grid sm:grid-cols-3 gap-4">
            {[1,2,3].map(n => <div key={n} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : nextThree.length === 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center text-amber-800">
            <Calendar size={28} className="mx-auto mb-2 text-amber-500" />
            <p className="font-semibold">No upcoming court dates scheduled.</p>
            <p className="text-sm mt-1">Please call (740) 568-7800 for the next available date.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-3 gap-4">
            {nextThree.map((d) => {
              const date = parseISO(d.date)
              return (
                <div key={d.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">
                    {format(date, 'EEEE')}
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900 leading-none">
                    {format(date, 'd')}
                  </div>
                  <div className="text-slate-500 text-sm font-medium">{format(date, 'MMMM yyyy')}</div>
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock size={12} /> {format(date, 'h:mm a')}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin size={12} /> {d.location}
                    </div>
                    {d.judge && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Gavel size={12} /> {d.judge}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* What is Mayor's Court */}
      <section className="mb-12 bg-slate-800 text-white rounded-2xl p-8">
        <h2 className="text-xl font-bold mb-3">What is Mayor's Court?</h2>
        <p className="text-slate-300 leading-relaxed mb-4">
          Mayor's Court is a limited jurisdiction court presided over by the Mayor of Saint Louisville. It handles minor misdemeanor traffic violations, minor misdemeanor criminal matters, and civil traffic violations that occur within the village limits.
        </p>
        <p className="text-slate-300 leading-relaxed">
          Mayor's Court is <strong className="text-white">not a court of record</strong> — you have the right to transfer your case to the Licking County Municipal Court at any time before the case is decided.
        </p>
      </section>

      {/* How to respond */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-slate-900 mb-6">How to Respond to a Citation</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            {
              icon: CheckCircle,
              color: 'bg-green-100 text-green-700',
              plea: 'Guilty',
              desc: 'You admit to the violation. You may pay your fine online, by mail, or in person. No court appearance required unless a court date was set.',
              action: 'Pay online, by mail, or in person before your court date.',
            },
            {
              icon: AlertCircle,
              color: 'bg-blue-100 text-blue-700',
              plea: 'No Contest',
              desc: 'You do not admit guilt but do not contest the charge. The fine is assessed the same as a guilty plea. Cannot be used as evidence against you in civil proceedings.',
              action: 'Appear in court on your scheduled date or contact Village Hall.',
            },
            {
              icon: Gavel,
              color: 'bg-amber-100 text-amber-700',
              plea: 'Not Guilty',
              desc: 'You dispute the violation. You must appear in Mayor\'s Court on your scheduled date. You may also transfer your case to Licking County Municipal Court.',
              action: 'Appear in court on your scheduled date. You may request a continuance.',
            },
          ].map(({ icon: Icon, color, plea, desc, action }) => (
            <div key={plea} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-4 ${color}`}>
                <Icon size={13} /> Plea: {plea}
              </div>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">{desc}</p>
              <p className="text-xs font-semibold text-slate-500 border-t border-slate-100 pt-3">→ {action}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Court Procedures */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Court Procedures</h2>
        <div className="space-y-3">
          {[
            { step: '1', title: 'Receive Your Citation', desc: 'Your citation will list the violation, fine amount, and a court date if applicable.' },
            { step: '2', title: 'Choose Your Response', desc: 'Decide whether to pay the fine (guilty/no contest) or contest the violation (not guilty).' },
            { step: '3', title: 'Pay Online or Appear in Court', desc: 'Fines can be paid online at pd.saintlouisvilleohio.gov or in person at Village Hall. If pleading not guilty, appear on your court date.' },
            { step: '4', title: 'Court Hearing (if applicable)', desc: 'If contesting, both sides present their case before the Mayor. The Mayor renders a decision.' },
            { step: '5', title: 'Appeal Rights', desc: 'You may appeal a Mayor\'s Court decision to the Licking County Court of Common Pleas within 30 days.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="w-8 h-8 bg-slate-900 text-amber-400 rounded-full flex items-center justify-center font-extrabold text-sm flex-shrink-0">
                {step}
              </div>
              <div>
                <p className="font-semibold text-slate-800">{title}</p>
                <p className="text-slate-500 text-sm mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* What to bring */}
      <section className="mb-12 bg-amber-50 border border-amber-200 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
          <FileText size={18} /> What to Bring to Court
        </h2>
        <ul className="space-y-2">
          {[
            'Your citation / ticket',
            'Valid government-issued photo ID',
            'Any evidence supporting your case (photos, witness statements, etc.)',
            'Your vehicle registration and proof of insurance (for traffic violations)',
            'Any documents showing remediation (e.g., proof of insurance obtained after the fact)',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-amber-800 text-sm">
              <CheckCircle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* FAQ */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {faqs.map(faq => (
            <Accordion key={faq.id} question={faq.question}>
              {faq.answer}
            </Accordion>
          ))}
        </div>
      </section>

      {/* Contact clerk */}
      <section className="bg-slate-900 text-white rounded-2xl p-8 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-14 h-14 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
          <Phone size={24} className="text-amber-400" />
        </div>
        <div className="flex-grow text-center sm:text-left">
          <h3 className="font-bold text-lg">Questions About Your Court Date?</h3>
          <p className="text-slate-400 text-sm mt-1">Contact Village Hall to speak with the court clerk about your citation, court date, or payment options.</p>
        </div>
        <a
          href="tel:7405687800"
          className="flex-shrink-0 px-6 py-3 bg-amber-500 text-slate-900 font-bold rounded-xl hover:bg-amber-400 transition-colors whitespace-nowrap"
        >
          (740) 568-7800
        </a>
      </section>
    </div>
  )
}
