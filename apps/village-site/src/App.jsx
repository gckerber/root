// apps/village-site/src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import AboutUs from './pages/AboutUs'
import Minutes from './pages/Minutes'
import Bulletin from './pages/Bulletin'
import OrdinancesPage from './pages/OrdinancesPage'
import CalendarPage from './pages/CalendarPage'
import History from './pages/History'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 2 },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-stone-50">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/minutes" element={<Minutes />} />
              <Route path="/bulletin" element={<Bulletin />} />
              <Route path="/ordinances" element={<OrdinancesPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/history" element={<History />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
