import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './components/AdminLayout'
import LoginPage from './pages/LoginPage'
import LandingPage from './pages/public/LandingPage'
import FormIscrizione from './pages/public/FormIscrizione'
import QuestionarioPage from './pages/public/QuestionarioPage'
import DashboardPage from './pages/admin/DashboardPage'
import EventiPage from './pages/admin/EventiPage'
import IscrittiPage from './pages/admin/IscrittiPage'
import CheckinPage from './pages/admin/CheckinPage'
import EmailPage from './pages/admin/EmailPage'
import StatistichePage from './pages/admin/StatistichePage'
import UtentiPage from './pages/admin/UtentiPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Pagine pubbliche */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/eventi/:slug" element={<LandingPage />} />
          <Route path="/questionario" element={<QuestionarioPage />} />

          {/* Area admin protetta */}
          <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="eventi" element={<EventiPage />} />
            <Route path="iscritti" element={<IscrittiPage />} />
            <Route path="email" element={<EmailPage />} />
            <Route path="checkin" element={<CheckinPage />} />
            <Route path="statistiche" element={<StatistichePage />} />
            <Route path="utenti" element={<UtentiPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
