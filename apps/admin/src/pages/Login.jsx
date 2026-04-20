// src/pages/Login.jsx
// TEMPORARY DEBUG VERSION — shows what credentials were baked in at build time
// Delete the debug box once login is working, then redeploy

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useToast } from '../utils/context'
import { Lock, Eye, EyeOff, Shield } from 'lucide-react'

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
    await new Promise((r) => setTimeout(r, 300))

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      login(password)
      toast('Welcome back!', 'success')
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
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-900/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
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

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/20 border border-blue-500/30 rounded-2xl mb-4">
            <Shield size={28} className="text-blue-400" />
          </div>
          <h1 className="text-2xl font-semibold text-white">Admin Panel</h1>
          <p className="text-slate-500 text-sm mt-1">Village of Saint Louisville, Ohio</p>
        </div>

        {/* ── TEMPORARY DEBUG BOX — remove after login works ── */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-4 text-xs font-mono">
          <div className="text-yellow-400 font-bold mb-2">🔍 Debug — what was baked in at build time:</div>
          <div className="text-slate-300 space-y-1">
            <div>VITE_ADMIN_USERNAME = <span className="text-green-400">"{ADMIN_USERNAME}"</span></div>
            <div>VITE_ADMIN_PASSWORD = <span className="text-green-400">"{ADMIN_PASSWORD ? '***(' + ADMIN_PASSWORD.length + ' chars)' : '(EMPTY — secret missing!)'}"</span></div>
          </div>
          <div className="text-yellow-600 mt-2 text-xs">Delete this box from Login.jsx once you can log in.</div>
        </div>
        {/* ── END DEBUG BOX ── */}

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
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Lock size={15} />
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
