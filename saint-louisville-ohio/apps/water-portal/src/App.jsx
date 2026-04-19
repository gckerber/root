// apps/water-portal/src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Payment from './pages/Payment'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-sky-50 flex flex-col">
        {/* Portal header */}
        <header className="bg-blue-900 text-white shadow-lg">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-sky-400 rounded-full flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div>
                <div className="text-xs text-blue-300 leading-none">Village of Saint Louisville</div>
                <div className="font-bold text-sm leading-snug">Water Payment Portal</div>
              </div>
            </div>
            <a href="https://saintlouisvilleohio.gov" className="text-xs text-blue-300 hover:text-white transition-colors hidden sm:block">
              ← Back to Village Site
            </a>
          </div>
        </header>

        {/* Security badge */}
        <div className="bg-green-700 text-white text-xs text-center py-1.5 flex items-center justify-center gap-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
          Secure Connection — Your data is encrypted and protected
        </div>

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/payment" element={<Payment />} />
          </Routes>
        </main>

        <footer className="bg-blue-950 text-blue-400 text-xs text-center py-4 mt-auto">
          <p>© {new Date().getFullYear()} Village of Saint Louisville, Ohio · Water Department</p>
          <p className="mt-1">Questions? Call (740) 568-7800 or email <a href="mailto:water@saintlouisvilleohio.gov" className="hover:text-white">water@saintlouisvilleohio.gov</a></p>
        </footer>
      </div>
    </BrowserRouter>
  )
}
