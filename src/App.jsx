import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './components/AdminLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/admin/DashboardPage'
import EventiPage from './pages/admin/EventiPage'
import IscrittiPage from './pages/admin/IscrittiPage'
import UtentiPage from './pages/admin/UtentiPage'
import { EmailPage, CheckinPage, StatistichePage } from './pages/admin/PlaceholderPages'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
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
