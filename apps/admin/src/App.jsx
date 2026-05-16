// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, ToastProvider, useAuth } from './utils/context'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import VillageImagesAdmin from './pages/VillageImagesAdmin'
import Officials from './pages/Officials'
import PDOfficialsAdmin from './pages/PDOfficialsAdmin'
import MinutesAdmin from './pages/MinutesAdmin'
import BulletinAdmin from './pages/BulletinAdmin'
import OrdinancesAdmin from './pages/OrdinancesAdmin'
import CalendarAdmin from './pages/CalendarAdmin'
import PDCalendarAdmin from './pages/PDCalendarAdmin'
import HistoryAdmin from './pages/HistoryAdmin'
import CourtAdmin from './pages/CourtAdmin'
import PDHeroAdmin from './pages/PDHeroAdmin'
import FAQAdmin from './pages/FAQAdmin'
import PDContactAdmin from './pages/PDContactAdmin'
import PDLinksAdmin from './pages/PDLinksAdmin'
import Layout from './components/Layout'

const VILLAGE = ['admin', 'village']
const POLICE  = ['admin', 'police']

function ProtectedRoute({ children, allowedRoles }) {
  const { isLoggedIn, role } = useAuth()
  if (!isLoggedIn) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/" replace />
  return children
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
              {/* Village routes */}
              <Route path="hero-images" element={<ProtectedRoute allowedRoles={VILLAGE}><VillageImagesAdmin /></ProtectedRoute>} />
              <Route path="officials"   element={<ProtectedRoute allowedRoles={VILLAGE}><Officials /></ProtectedRoute>} />
              <Route path="minutes"     element={<ProtectedRoute allowedRoles={VILLAGE}><MinutesAdmin /></ProtectedRoute>} />
              <Route path="bulletin"    element={<ProtectedRoute allowedRoles={VILLAGE}><BulletinAdmin /></ProtectedRoute>} />
              <Route path="ordinances"  element={<ProtectedRoute allowedRoles={VILLAGE}><OrdinancesAdmin /></ProtectedRoute>} />
              <Route path="calendar"    element={<ProtectedRoute allowedRoles={VILLAGE}><CalendarAdmin /></ProtectedRoute>} />
              <Route path="history"     element={<ProtectedRoute allowedRoles={VILLAGE}><HistoryAdmin /></ProtectedRoute>} />
              {/* Police routes */}
              <Route path="pd-officials" element={<ProtectedRoute allowedRoles={POLICE}><PDOfficialsAdmin /></ProtectedRoute>} />
              <Route path="pd-calendar"  element={<ProtectedRoute allowedRoles={POLICE}><PDCalendarAdmin /></ProtectedRoute>} />
              <Route path="court"        element={<ProtectedRoute allowedRoles={POLICE}><CourtAdmin /></ProtectedRoute>} />
              <Route path="pd-hero"      element={<ProtectedRoute allowedRoles={POLICE}><PDHeroAdmin /></ProtectedRoute>} />
              <Route path="pd-faq"       element={<ProtectedRoute allowedRoles={POLICE}><FAQAdmin /></ProtectedRoute>} />
              <Route path="pd-contact"   element={<ProtectedRoute allowedRoles={POLICE}><PDContactAdmin /></ProtectedRoute>} />
              <Route path="pd-links"     element={<ProtectedRoute allowedRoles={POLICE}><PDLinksAdmin /></ProtectedRoute>} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
