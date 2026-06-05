import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './components/AdminLayout'
import LoginPage from './pages/LoginPage'
import LandingPage from './pages/public/LandingPage'
import QuestionarioPage from './pages/public/QuestionarioPage'
import DashboardPage from './pages/admin/DashboardPage'
import EventiPage from './pages/admin/EventiPage'
import EventoEditorPage from './pages/admin/EventoEditorPage'
import IscrittiPage from './pages/admin/IscrittiPage'
import CheckinPage from './pages/admin/CheckinPage'
import EmailPage from './pages/admin/EmailPage'
import EmailEditorPage from './pages/admin/EmailEditorPage'
import StatistichePage from './pages/admin/StatistichePage'
import UtentiPage from './pages/admin/UtentiPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Pubbliche */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/eventi/:slug" element={<LandingPage />} />
          <Route path="/questionario" element={<QuestionarioPage />} />

          {/* Admin — layout sidebar */}
          <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="eventi" element={<EventiPage />} />
            <Route path="iscritti" element={<IscrittiPage />} />
            <Route path="email" element={<EmailPage />} />
            <Route path="checkin" element={<CheckinPage />} />
            <Route path="statistiche" element={<StatistichePage />} />
            <Route path="utenti" element={<UtentiPage />} />
          </Route>

          {/* Editor a schermo intero (fuori dal layout sidebar) */}
          <Route path="/admin/eventi/nuovo/editor"
            element={<ProtectedRoute><EventoEditorPage /></ProtectedRoute>} />
          <Route path="/admin/eventi/:id/editor"
            element={<ProtectedRoute><EventoEditorPage /></ProtectedRoute>} />
          <Route path="/admin/email/:id/editor"
            element={<ProtectedRoute><EmailEditorPage /></ProtectedRoute>} />
          <Route path="/admin/email/nuovo"
            element={<ProtectedRoute><EmailEditorPage /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
