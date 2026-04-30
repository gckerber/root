// apps/pd-site/src/pages/PayFine.jsx
import { useState } from 'react'
import { Search, CreditCard, CheckCircle, ArrowLeft, ShieldCheck, AlertCircle, Gavel, Clock } from 'lucide-react'
import axios from 'axios'
import { format, parseISO } from 'date-fns'

function formatCard(v) { return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim() }
function formatExpiry(v) {
  const d = v.replace(/\D/g, '').slice(0, 4)
  return d.length >= 3 ? d.slice(0, 2) + '/' + d.slice(2) : d
}

function StatusBadge({ status }) {
  const map = {
    unpaid: 'bg-red-100 text-red-700',
    paid: 'bg-green-100 text-green-700',
    court: 'bg-blue-100 text-blue-700',
    dismissed: 'bg-slate-100 text-slate-600',
  }
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${map[status] || map.unpaid}`}>
      {status}
    </span>
  )
}

// ── Step 1: Lookup ──────────────────────────────────────────────
function LookupStep({ onFound }) {
  const [citationNumber, setCitationNumber] = useState('')
  const [lastName, setLastName] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  async function handleLookup(e) {
    e.preventDefault()
    setStatus('loading')
    setError('')
    try {
      const res = await axios.post('/api/fine-lookup', { citationNumber, lastName })
      setStatus('idle')
      onFound(res.data)
    } catch (err) {
      const msg = err.response?.data?.message || 'Lookup failed. Please try again.'
      setError(msg)
      setStatus('error')
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Search size={30} className="text-amber-600" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Look Up Your Citation</h2>
        <p className="text-slate-500 text-sm">Enter your citation number and last name exactly as they appear on your ticket.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <form onSubmit={handleLookup} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Citation Number</label>
            <input
              type="text"
              required
              value={citationNumber}
              onChange={e => setCitationNumber(e.target.value.toUpperCase())}
              placeholder="e.g. SLP-2025-0001"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              autoComplete="off"
            />
            <p className="text-xs text-slate-400 mt-1">Found at the top of your ticket</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Last Name</label>
            <input
              type="text"
              required
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              placeholder="As it appears on your citation"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {status === 'error' && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 text-slate-900 font-bold rounded-xl hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            <Search size={18} />
            {status === 'loading' ? 'Searching…' : 'Look Up Citation'}
          </button>
        </form>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3 text-center text-xs">
        {[
          { icon: '🔒', label: 'Secure Lookup', sub: 'Rate limited & encrypted' },
          { icon: '⚖️', label: 'Official Portal', sub: 'Saint Louisville PD' },
          { icon: '📧', label: 'Receipt by Email', sub: 'After payment' },
        ].map(({ icon, label, sub }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-3">
            <div className="text-xl mb-1">{icon}</div>
            <div className="font-semibold text-slate-700">{label}</div>
            <div className="text-slate-400">{sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Step 2: Citation detail + payment form ──────────────────────
function PaymentStep({ citation, onBack, onSuccess }) {
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' })
  const [email, setEmail] = useState('')
  const [step, setStep] = useState('form') // form | confirm | processing | error
  const [errorMsg, setErrorMsg] = useState('')
  const [confirmation, setConfirmation] = useState(null)

  const balance = citation.balance ?? citation.fineAmount

  async function handleSubmit() {
    setStep('processing')
    try {
      const res = await axios.post('/api/fine-payment', {
        citationId: citation.id,
        citationStatus: citation.status,
        amount: balance,
        cardLast4: card.number.replace(/\s/g, '').slice(-4),
        receiptEmail: email || null,
      })
      setConfirmation(res.data)
      setStep('success')
      onSuccess(res.data)
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Payment failed. Please try again or call (740) 568-7800.')
      setStep('error')
    }
  }

  if (step === 'processing') {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Processing Payment…</h2>
        <p className="text-slate-400 mt-2 text-sm">Please do not close this window.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-amber-600 hover:text-amber-800 mb-6 text-sm font-semibold">
        <ArrowLeft size={16} /> Look up a different citation
      </button>

      <div className="grid md:grid-cols-5 gap-6">
        {/* Citation summary */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-slate-900 text-white rounded-2xl p-5">
            <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Citation</p>
            <p className="font-mono text-lg font-bold">{citation.citationNumber}</p>
            <div className="mt-3">
              <StatusBadge status={citation.status} />
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 text-sm">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Name</p>
              <p className="font-semibold text-slate-800">{citation.firstName} {citation.lastName}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Violation</p>
              <p className="font-semibold text-slate-800">{citation.violationType}</p>
              {citation.violationDescription && <p className="text-slate-500 text-xs mt-0.5">{citation.violationDescription}</p>}
            </div>
            {citation.violationDate && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Date of Violation</p>
                <p className="font-semibold text-slate-800">
                  {format(parseISO(citation.violationDate), 'MMMM d, yyyy')}
                </p>
              </div>
            )}
            {citation.courtDate && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                <p className="text-xs text-blue-600 font-semibold flex items-center gap-1 mb-0.5">
                  <Gavel size={11} /> Court Date Set
                </p>
                <p className="text-blue-800 text-sm font-medium">
                  {format(parseISO(citation.courtDate), 'MMMM d, yyyy')}
                </p>
              </div>
            )}
            <div className="border-t border-slate-100 pt-3">
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Balance Due</p>
              <p className="text-2xl font-extrabold text-red-600">${balance.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Payment form */}
        <div className="md:col-span-3">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center gap-3">
              <CreditCard size={20} />
              <div>
                <h2 className="font-bold">Pay Fine — ${balance.toFixed(2)}</h2>
                <p className="text-slate-400 text-xs">Citation {citation.citationNumber}</p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {citation.status === 'paid' && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">
                  <CheckCircle size={16} /> This citation has already been paid in full.
                </div>
              )}
              {citation.status === 'dismissed' && (
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-600">
                  <CheckCircle size={16} /> This citation has been dismissed. No payment is required.
                </div>
              )}

              {(citation.status === 'unpaid' || citation.status === 'court') && (
                <>
                  <fieldset className="space-y-3">
                    <legend className="text-sm font-bold text-slate-700 mb-2">Card Details</legend>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Card Number</label>
                      <input
                        type="text"
                        required
                        inputMode="numeric"
                        placeholder="1234 5678 9012 3456"
                        value={card.number}
                        onChange={e => setCard(c => ({ ...c, number: formatCard(e.target.value) }))}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                        autoComplete="cc-number"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Name on Card</label>
                      <input
                        type="text"
                        required
                        placeholder="Jane Smith"
                        value={card.name}
                        onChange={e => setCard(c => ({ ...c, name: e.target.value }))}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        autoComplete="cc-name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Expiry (MM/YY)</label>
                        <input
                          type="text"
                          required
                          inputMode="numeric"
                          placeholder="06/28"
                          value={card.expiry}
                          onChange={e => setCard(c => ({ ...c, expiry: formatExpiry(e.target.value) }))}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                          autoComplete="cc-exp"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">CVV</label>
                        <input
                          type="password"
                          required
                          inputMode="numeric"
                          maxLength={4}
                          placeholder="•••"
                          value={card.cvv}
                          onChange={e => setCard(c => ({ ...c, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                          autoComplete="cc-csc"
                        />
                      </div>
                    </div>
                  </fieldset>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Receipt Email (optional)</label>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-xl p-3 border border-green-100">
                    <ShieldCheck size={13} />
                    Card data is processed securely and never stored by the Village.
                  </div>

                  {step === 'error' && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                      <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                      {errorMsg}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (!card.number || !card.name || !card.expiry || !card.cvv) return
                      handleSubmit()
                    }}
                    className="w-full py-4 bg-amber-500 text-slate-900 font-extrabold text-base rounded-xl hover:bg-amber-400 transition-colors shadow-sm"
                  >
                    Pay ${balance.toFixed(2)} Now
                  </button>

                  <p className="text-xs text-center text-slate-400">
                    By paying, you are entering a guilty plea for this citation.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Step 3: Success confirmation ────────────────────────────────
function SuccessStep({ citation, confirmation, onReset }) {
  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={44} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Payment Confirmed!</h2>
        <p className="text-slate-500 text-sm mb-6">
          Your fine has been paid. Please retain this confirmation for your records.
        </p>

        <div className="bg-slate-50 rounded-xl p-5 text-left space-y-3 mb-6">
          {[
            ['Confirmation #', <span className="font-mono font-semibold">{confirmation?.confirmationNumber}</span>],
            ['Citation #', citation.citationNumber],
            ['Violation', citation.violationType],
            ['Amount Paid', <span className="font-bold text-green-700">${confirmation?.amount?.toFixed(2)}</span>],
            ['Remaining Balance', <span className="font-semibold">${(confirmation?.newBalance ?? 0).toFixed(2)}</span>],
            ['Date', new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between text-sm border-b border-slate-100 pb-2 last:border-0 last:pb-0">
              <span className="text-slate-500">{label}</span>
              <span>{value}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-400 mb-6">
          If you had a court date, contact Village Hall at (740) 568-7800 to confirm your case has been resolved.
        </p>

        <button
          onClick={onReset}
          className="w-full py-3 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
        >
          Look Up Another Citation
        </button>
      </div>
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────────
export default function PayFine() {
  const [citation, setCitation] = useState(null)
  const [confirmation, setConfirmation] = useState(null)

  function reset() {
    setCitation(null)
    setConfirmation(null)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-10">
        {[
          { label: 'Find Citation', active: !citation && !confirmation },
          { label: 'Pay Fine', active: !!citation && !confirmation },
          { label: 'Confirmation', active: !!confirmation },
        ].map(({ label, active }, i, arr) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 text-sm font-semibold ${active ? 'text-amber-600' : 'text-slate-400'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${active ? 'bg-amber-500 text-slate-900' : 'bg-slate-200 text-slate-500'}`}>
                {i + 1}
              </div>
              <span className="hidden sm:inline">{label}</span>
            </div>
            {i < arr.length - 1 && <div className="w-8 h-px bg-slate-300" />}
          </div>
        ))}
      </div>

      {!citation && !confirmation && (
        <LookupStep onFound={setCitation} />
      )}
      {citation && !confirmation && (
        <PaymentStep
          citation={citation}
          onBack={() => setCitation(null)}
          onSuccess={(data) => setConfirmation(data)}
        />
      )}
      {confirmation && (
        <SuccessStep citation={citation} confirmation={confirmation} onReset={reset} />
      )}
    </div>
  )
}
