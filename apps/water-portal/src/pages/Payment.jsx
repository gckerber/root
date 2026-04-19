// apps/water-portal/src/pages/Payment.jsx
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CreditCard, CheckCircle, Bell, ArrowLeft, ShieldCheck } from 'lucide-react'
import axios from 'axios'

const API = import.meta.env.VITE_API_BASE_URL || ''

function formatCard(val) {
  return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}
function formatExpiry(val) {
  const digits = val.replace(/\D/g, '').slice(0, 4)
  if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2)
  return digits
}

export default function Payment() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const account = state?.account
  const customAmount = state?.customAmount

  const [amount, setAmount] = useState(account ? String(account.balance.toFixed(2)) : '')
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' })
  const [alertEmail, setAlertEmail] = useState(account?.email || '')
  const [alertOptIn, setAlertOptIn] = useState(false)
  const [step, setStep] = useState('form') // form | confirm | processing | success | error
  const [errorMsg, setErrorMsg] = useState('')
  const [confirmation, setConfirmation] = useState(null)

  if (!account) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">No account selected. Please look up your account first.</p>
        <button onClick={() => navigate('/')} className="px-6 py-2 bg-blue-700 text-white rounded-xl font-semibold hover:bg-blue-800">
          Go to Lookup
        </button>
      </div>
    )
  }

  const parsedAmount = parseFloat(amount) || 0

  async function handleSubmitPayment() {
    setStep('processing')
    setErrorMsg('')
    try {
      const res = await axios.post(`${API}/api/payment`, {
        accountNumber: account.accountNumber,
        amount: parsedAmount,
        // Card details go directly to payment processor — never stored by Village
        cardLast4: card.number.replace(/\s/g, '').slice(-4),
        alertOptIn,
        alertEmail: alertOptIn ? alertEmail : null,
      })
      setConfirmation(res.data)
      setStep('success')
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Payment failed. Please try again or call Village Hall.')
      setStep('error')
    }
  }

  // ── Step: Success ──
  if (step === 'success') {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={44} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Payment Confirmed!</h2>
          <p className="text-gray-500 mb-6">Your payment has been processed successfully.</p>

          <div className="bg-gray-50 rounded-xl p-5 text-left space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Confirmation #</span>
              <span className="font-mono font-semibold">{confirmation?.confirmationNumber || 'SLV-' + Date.now()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Account</span>
              <span className="font-medium">{account.accountNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Amount Paid</span>
              <span className="font-bold text-green-700">${parsedAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Date</span>
              <span>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>

          {alertOptIn && (
            <div className="flex items-center gap-2 bg-blue-50 rounded-xl p-4 text-sm text-blue-700 mb-6">
              <Bell size={16} />
              Future bill alerts will be sent to {alertEmail}
            </div>
          )}

          <p className="text-xs text-gray-400 mb-6">
            A receipt has been sent to {alertOptIn ? alertEmail : account.email || 'the email on file'}.
            Please allow 1–2 business days for your balance to update.
          </p>

          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-blue-700 text-white font-bold rounded-xl hover:bg-blue-800 transition-colors"
          >
            Return to Lookup
          </button>
        </div>
      </div>
    )
  }

  // ── Step: Confirm ──
  if (step === 'confirm') {
    return (
      <div className="max-w-xl mx-auto px-4 py-10">
        <button onClick={() => setStep('form')} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 text-sm font-medium">
          <ArrowLeft size={16} /> Edit payment
        </button>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-blue-900 text-white px-6 py-4">
            <h2 className="font-bold text-lg">Confirm Payment</h2>
            <p className="text-blue-300 text-sm">Please review before submitting</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Account</span>
                <span className="font-semibold">{account.accountNumber}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Service Address</span>
                <span className="font-semibold text-right max-w-[60%]">{account.address}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Payment Amount</span>
                <span className="font-extrabold text-blue-700 text-lg">${parsedAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Card</span>
                <span className="font-mono">•••• •••• •••• {card.number.replace(/\s/g, '').slice(-4)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Bill Alerts</span>
                <span>{alertOptIn ? `✓ ${alertEmail}` : 'Not opted in'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-xl p-3 border border-green-100">
              <ShieldCheck size={14} />
              Your card details are processed securely and never stored by the Village.
            </div>

            {step === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                {errorMsg}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep('form')}
                className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={handleSubmitPayment}
                className="flex-1 py-3 bg-blue-700 text-white font-bold rounded-xl hover:bg-blue-800 transition-colors"
              >
                Submit Payment
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Step: Processing ──
  if (step === 'processing') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 border-4 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-800">Processing Payment…</h2>
        <p className="text-gray-400 mt-2 text-sm">Please do not close this window.</p>
      </div>
    )
  }

  // ── Step: Form ──
  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 text-sm font-medium">
        <ArrowLeft size={16} /> Back to lookup
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-blue-900 text-white px-6 py-4 flex items-center gap-3">
          <CreditCard size={22} />
          <div>
            <h2 className="font-bold">Pay Water Bill</h2>
            <p className="text-blue-300 text-sm">{account.address}</p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Amount <span className="text-red-500">*</span>
            </label>
            {customAmount ? (
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ) : (
              <div className="px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl font-bold text-xl text-blue-800">
                ${parsedAmount.toFixed(2)}
                <span className="text-sm font-normal text-blue-500 ml-2">(full balance)</span>
              </div>
            )}
          </div>

          {/* Card details */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-gray-700 mb-2">Card Details</legend>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Card Number</label>
              <input
                type="text"
                required
                inputMode="numeric"
                placeholder="1234 5678 9012 3456"
                value={card.number}
                onChange={(e) => setCard((c) => ({ ...c, number: formatCard(e.target.value) }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                autoComplete="cc-number"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Name on Card</label>
              <input
                type="text"
                required
                placeholder="Jane Smith"
                value={card.name}
                onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoComplete="cc-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Expiry (MM/YY)</label>
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  placeholder="06/28"
                  value={card.expiry}
                  onChange={(e) => setCard((c) => ({ ...c, expiry: formatExpiry(e.target.value) }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  autoComplete="cc-exp"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">CVV</label>
                <input
                  type="password"
                  required
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="•••"
                  value={card.cvv}
                  onChange={(e) => setCard((c) => ({ ...c, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  autoComplete="cc-csc"
                />
              </div>
            </div>
          </fieldset>

          {/* Alert opt-in */}
          <div className="bg-sky-50 rounded-xl border border-sky-100 p-4 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={alertOptIn}
                onChange={(e) => setAlertOptIn(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-blue-600 rounded"
              />
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                  <Bell size={15} className="text-blue-500" />
                  Sign up for bill alerts
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Receive email reminders when your bill is ready and when payment is due.
                </p>
              </div>
            </label>
            {alertOptIn && (
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={alertEmail}
                onChange={(e) => setAlertEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-sky-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            )}
          </div>

          {step === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{errorMsg}</div>
          )}

          <button
            onClick={() => {
              if (!card.number || !card.name || !card.expiry || !card.cvv || parsedAmount <= 0) return
              setStep('confirm')
            }}
            className="w-full py-4 bg-blue-700 text-white font-bold text-lg rounded-xl hover:bg-blue-800 transition-colors shadow-sm"
          >
            Review Payment → ${parsedAmount.toFixed(2)}
          </button>

          <p className="text-xs text-center text-gray-400">
            Payments are processed securely. Card data is never stored by the Village of Saint Louisville.
          </p>
        </div>
      </div>
    </div>
  )
}
