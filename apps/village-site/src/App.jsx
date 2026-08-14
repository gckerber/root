// apps/village-site/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Officials from './pages/AboutUs'
import Minutes from './pages/Minutes'
import CommunityBoard from './pages/CommunityBoard'
import OrdinancesPage from './pages/OrdinancesPage'
import History from './pages/History'
import PoliceDept from './pages/PoliceDept'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 2 },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-white">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/community" element={<CommunityBoard />} />
              <Route path="/minutes" element={<Minutes />} />
              <Route path="/officials" element={<Officials />} />
              <Route path="/police" element={<PoliceDept />} />
              <Route path="/ordinances" element={<OrdinancesPage />} />
              <Route path="/fun-stuff" element={<History />} />

              {/* Redirects from old routes */}
              <Route path="/history"  element={<Navigate to="/fun-stuff" replace />} />
              <Route path="/about"    element={<Navigate to="/officials" replace />} />
              <Route path="/bulletin" element={<Navigate to="/community" replace />} />
              <Route path="/calendar" element={<Navigate to="/community" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
