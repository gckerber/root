// apps/village-site/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Officials from './pages/AboutUs'
import Minutes from './pages/Minutes'
import OrdinancesPage from './pages/OrdinancesPage'
import History from './pages/History'
import PoliceDept from './pages/PoliceDept'
import { ThemeProvider } from './theme/ThemeProvider'
import { Particles } from './theme/SeasonDecor'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 2 },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-white">
            <Navbar />
            <Particles />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/minutes" element={<Minutes />} />
                <Route path="/officials" element={<Officials />} />
                <Route path="/police" element={<PoliceDept />} />
                <Route path="/ordinances" element={<OrdinancesPage />} />
                <Route path="/fun-stuff" element={<History />} />

                {/* Community board and calendar now live on the home page */}
                <Route path="/community" element={<Navigate to="/#happening" replace />} />
                <Route path="/bulletin"  element={<Navigate to="/#notices" replace />} />
                <Route path="/calendar"  element={<Navigate to="/#happening" replace />} />

                {/* Redirects from old routes */}
                <Route path="/history"  element={<Navigate to="/fun-stuff" replace />} />
                <Route path="/about"    element={<Navigate to="/officials" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}