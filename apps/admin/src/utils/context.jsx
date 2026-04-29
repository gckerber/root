// src/utils/context.jsx
import { createContext, useContext, useState, useCallback } from 'react'

// ── Auth ─────────────────────────────────────────────────────
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const stored = sessionStorage.getItem('slv_admin')
    return stored ? JSON.parse(stored) : null
  })

  const login = useCallback((key) => {
    const data = { key, loggedInAt: Date.now() }
    sessionStorage.setItem('slv_admin', JSON.stringify(data))
    setAuth(data)
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem('slv_admin')
    setAuth(null)
  }, [])

  return (
    <AuthContext.Provider value={{ auth, login, logout, isLoggedIn: !!auth }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

// ── Toast ─────────────────────────────────────────────────────
const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500)
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-enter flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium pointer-events-auto max-w-sm ${
              t.type === 'success'
                ? 'bg-green-500 text-white'
                : t.type === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-slate-700 text-white'
            }`}
          >
            <span>{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}</span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)

// ── API helper ────────────────────────────────────────────────
const API_BASE = 'https://func-village-prod.azurewebsites.net'

export async function apiCall(method, path, body, adminKey) {
  const res = await fetch(`${API_BASE}/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey || '',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function uploadFile(file, container, adminKey) {
  // Get a SAS upload URL from the API
  const { uploadUrl, publicUrl } = await apiCall(
    'POST',
    '/upload-url',
    { container, filename: file.name, contentType: file.type },
    adminKey
  )
  // Upload directly to blob storage
  await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'x-ms-blob-type': 'BlockBlob',
      'Content-Type': file.type,
    },
    body: file,
  })
  return publicUrl
}
