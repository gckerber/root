// src/pages/Login.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useToast } from '../utils/context'
import { Lock, Eye, EyeOff, Shield } from 'lucide-react'

// Admin credentials are stored as GitHub Secrets / env vars.
// Username is fixed as 'admin' — password is the ADMIN_API_KEY.
// In production, replace with Azure Static Web Apps authentication.
const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME || 'admin'
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || ''

export default function Login() {
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    await new Promise((r) => setTimeout(r, 400)) // small delay feels more secure

    const pwToCheck = ADMIN_PASSWORD || import.meta.env.VITE_ADMIN_API_KEY || ''

    if (username === ADMIN_USERNAME && password === pwToCheck) {
      login(password)
      toast('Welcome back, ' + username + '!', 'success')
      navigate('/', { replace: true })
    } else {
      setShake(true)
      setTimeout(() => setShake(false), 600)
      toast('Invalid username or password', 'error')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-900/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-slate-800/20 rounded-full blur-3xl" />
      </div>

      <div className={`relative w-full max-w-sm transition-all ${shake ? 'animate-bounce' : ''}`}
        style={shake ? { animation: 'shake 0.5s ease-in-out' } : {}}>
        <style>{`
          @keyframes shake {
            0%,100%{transform:translateX(0)}
            20%{transform:translateX(-8px)}
            40%{transform:translateX(8px)}
            60%{transform:translateX(-6px)}
            80%{transform:translateX(6px)}
          }
          .shake { animation: shake 0.5s ease-in-out; }
        `}</style>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/20 border border-blue-500/30 rounded-2xl mb-4">
            <Shield size={28} className="text-blue-400" />
          </div>
          <h1 className="text-2xl font-semibold text-white">Admin Panel</h1>
          <p className="text-slate-500 text-sm mt-1">Village of Saint Louisville, Ohio</p>
        </div>

        <div className={`card p-6 ${shake ? 'shake' : ''}`}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="input"
                autoComplete="username"
                autoFocus
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="input pr-12"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 mt-2"
            >
              <Lock size={15} />
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          Saint Louisville, Ohio · Secure Admin Access
        </p>
      </div>
    </div>
  )
}
