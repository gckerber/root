// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, ToastProvider, useAuth } from './utils/context'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import HeroEditor from './pages/HeroEditor'
import Officials from './pages/Officials'
import MinutesAdmin from './pages/MinutesAdmin'
import BulletinAdmin from './pages/BulletinAdmin'
import OrdinancesAdmin from './pages/OrdinancesAdmin'
import CalendarAdmin from './pages/CalendarAdmin'
import HistoryAdmin from './pages/HistoryAdmin'
import PDAdmin from './pages/PDAdmin'
import CourtAdmin from './pages/CourtAdmin'
import Layout from './components/Layout'

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth()
  return isLoggedIn ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="hero" element={<HeroEditor />} />
              <Route path="officials" element={<Officials />} />
              <Route path="minutes" element={<MinutesAdmin />} />
              <Route path="bulletin" element={<BulletinAdmin />} />
              <Route path="ordinances" element={<OrdinancesAdmin />} />
              <Route path="calendar" element={<CalendarAdmin />} />
              <Route path="history" element={<HistoryAdmin />} />
              <Route path="pd" element={<PDAdmin />} />
              <Route path="court" element={<CourtAdmin />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
