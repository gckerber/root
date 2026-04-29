// apps/water-portal/src/pages/Home.jsx
// SECURITY NOTES:
// - SSN is never logged, stored unencrypted, or echoed back to the client
// - The backend masks SSN before returning any account data
// - All lookups go over HTTPS; no SSN appears in query params
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, AlertCircle, ShieldCheck, Eye, EyeOff, Droplets } from 'lucide-react'
import axios from 'axios'

const API = 'https://func-village-prod.azurewebsites.net'

const LOOKUP_METHODS = [
  { id: 'address', label: 'Service Address' },
  { id: 'account', label: 'Account Number' },
  { id: 'ssn', label: 'Last 4 of SSN' },
]

function SSNInput({ value, onChange }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        maxLength={4}
        inputMode="numeric"
        pattern="[0-9]{4}"
        placeholder="Last 4 digits only"
        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
        autoComplete="off"
        data-lpignore="true"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        aria-label={show ? 'Hide SSN' : 'Show SSN'}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  )
}

function AccountCard({ account, onPay }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Account header */}
      <div className="bg-blue-900 text-white px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-blue-300 text-xs font-medium uppercase tracking-wide">Account</p>
            <p className="font-mono text-lg font-bold mt-0.5">{account.accountNumber}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            account.status === 'current'
              ? 'bg-green-400/20 text-green-300 border border-green-400/30'
              : account.status === 'overdue'
              ? 'bg-red-400/20 text-red-300 border border-red-400/30'
              : 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/30'
          }`}>
            {account.status === 'current' ? '✓ Current' : account.status === 'overdue' ? '⚠ Overdue' : 'Pending'}
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="grid sm:grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Service Address</p>
            <p className="font-semibold text-gray-800">{account.address}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Account Holder</p>
            <p className="font-semibold text-gray-800">{account.name}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Current Balance</p>
            <p className={`text-2xl font-extrabold ${account.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              ${account.balance.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Due Date</p>
            <p className="font-semibold text-gray-800">{account.dueDate}</p>
          </div>
          {account.lastPayment && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Last Payment</p>
              <p className="text-sm text-gray-600">${account.lastPayment.amount.toFixed(2)} on {account.lastPayment.date}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Meter Reading</p>
            <p className="text-sm text-gray-600">{account.meterReading || 'N/A'}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {account.balance > 0 && (
            <button
              onClick={() => onPay(account)}
              className="flex-grow sm:flex-grow-0 px-8 py-3 bg-blue-700 text-white font-bold rounded-xl hover:bg-blue-800 transition-colors shadow-sm"
            >
              Pay ${account.balance.toFixed(2)} Now
            </button>
          )}
          <button
            onClick={() => onPay(account, true)}
            className="flex-grow sm:flex-grow-0 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm"
          >
            Pay Other Amount
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const [method, setMethod] = useState('address')
  const [query, setQuery] = useState('')
  const [ssnLast4, setSsnLast4] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | found | not_found | error
  const [account, setAccount] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleLookup(e) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')
    setAccount(null)

    try {
      const payload = { method }
      if (method === 'ssn') {
        // SSN last-4 sent in request body over HTTPS, never in URL
        payload.ssnLast4 = ssnLast4
      } else {
        payload.query = query
      }

      const res = await axios.post(`${API}/api/lookup`, payload)
      setAccount(res.data)
      setStatus('found')
    } catch (err) {
      if (err.response?.status === 404) {
        setStatus('not_found')
      } else {
        setStatus('error')
        setErrorMsg(err.response?.data?.message || 'Lookup failed. Please try again.')
      }
    }
  }

  function handlePay(acct, customAmount = false) {
    navigate('/payment', { state: { account: acct, customAmount } })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Droplets size={32} className="text-blue-600" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Water Bill Lookup</h1>
        <p className="text-gray-500">
          Look up your account balance and pay your bill securely online.
        </p>
      </div>

      {/* Lookup form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1 mb-5">
          {LOOKUP_METHODS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => { setMethod(id); setQuery(''); setSsnLast4(''); setStatus('idle'); setAccount(null) }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                method === id ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleLookup} className="space-y-4">
          {method === 'address' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Address</label>
              <input
                type="text"
                required
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. 123 Main Street"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">Enter the address where water service is provided</p>
            </div>
          )}
          {method === 'account' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
              <input
                type="text"
                required
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. SLV-2024-00123"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoComplete="off"
              />
              <p className="text-xs text-gray-400 mt-1">Found on your paper bill statement</p>
            </div>
          )}
          {method === 'ssn' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last 4 Digits of SSN
              </label>
              <SSNInput value={ssnLast4} onChange={(e) => setSsnLast4(e.target.value.replace(/\D/g, '').slice(0, 4))} />
              <div className="flex items-center gap-1.5 mt-2 text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-100">
                <ShieldCheck size={13} />
                Only the last 4 digits are used. Your full SSN is never transmitted or stored.
              </div>
            </div>
          )}

          {status === 'not_found' && (
            <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-800">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              No account found. Please check your information or call (740) 568-7800.
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-700 text-white font-bold rounded-xl hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            <Search size={18} />
            {status === 'loading' ? 'Looking up…' : 'Look Up Account'}
          </button>
        </form>
      </div>

      {/* Account result */}
      {status === 'found' && account && (
        <AccountCard account={account} onPay={handlePay} />
      )}

      {/* Trust indicators */}
      <div className="mt-8 grid grid-cols-3 gap-3 text-center">
        {[
          { icon: '🔒', label: 'SSL Encrypted', sub: '256-bit TLS' },
          { icon: '🛡️', label: 'Data Protected', sub: 'Azure Key Vault' },
          { icon: '✓', label: 'Official Portal', sub: 'Village of SL' },
        ].map(({ icon, label, sub }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-3">
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-xs font-semibold text-gray-700">{label}</div>
            <div className="text-xs text-gray-400">{sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
