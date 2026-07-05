import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import { AuthProvider } from './hooks/useAuth'
import ProtectedRoute from './components/ProtectedRoute'
import RequireSection from './components/RequireSection'
import AdminLayout from './components/AdminLayout'
import LoginPage from './pages/LoginPage'
import LandingPage from './pages/public/LandingPage'
import QuestionarioPage from './pages/public/QuestionarioPage'
import Iscrizione from './pages/public/Iscrizione'
import DashboardPage from './pages/admin/DashboardPage'
import EventiPage from './pages/admin/EventiPage'
import EventoEditorPage from './pages/admin/EventoEditorPage'
import IscrittiPage from './pages/admin/IscrittiPage'
import CheckinPage from './pages/admin/CheckinPage'
import EmailPage from './pages/admin/EmailPage'
import EmailEditorPage from './pages/admin/EmailEditorPage'
import StatistichePage from './pages/admin/StatistichePage'
import UtentiPage from './pages/admin/UtentiPage'
import RuoliPage from './pages/admin/RuoliPage'
import ProfiloPage from './pages/admin/ProfiloPage'
import ActivityLogPage from './pages/admin/ActivityLogPage'
import LandingPageListPage from './pages/admin/LandingPageListPage'
import LandingEditorPage from './pages/admin/LandingEditorPage'
import LandingContactsPage from './pages/admin/LandingContactsPage'
import CalendarioAdminPage from './pages/admin/CalendarioAdminPage'
import AnaliticsPage from './pages/admin/AnaliticsPage'
import CertificatoPage from './pages/public/CertificatoPage'
import LandingPagePublic from './pages/public/LandingPagePublic'
import CalendarioPage from './pages/public/CalendarioPage'

export default function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Pubbliche */}
          <Route path="/" element={<Navigate to="/calendario" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/eventi/:slug" element={<LandingPage />} />
          <Route path="/lp/:slug" element={<LandingPagePublic />} />
          <Route path="/calendario" element={<CalendarioPage />} />
          <Route path="/verifica-certificato/:codice" element={<CertificatoPage />} />
          <Route path="/questionario" element={<QuestionarioPage />} />
          <Route path="/iscrizione/:codice" element={<Iscrizione />} />
          <Route path="/iscrizione" element={<Iscrizione />} />

          {/* Admin — layout sidebar (ogni sezione protetta dal proprio permesso) */}
          <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route index element={<RequireSection sezione="dashboard"><DashboardPage /></RequireSection>} />
            <Route path="eventi" element={<RequireSection sezione="eventi"><EventiPage /></RequireSection>} />
            <Route path="iscritti" element={<RequireSection sezione="iscritti"><IscrittiPage /></RequireSection>} />
            <Route path="email" element={<RequireSection sezione="email"><EmailPage /></RequireSection>} />
            <Route path="checkin" element={<RequireSection sezione="checkin"><CheckinPage /></RequireSection>} />
            <Route path="statistiche" element={<RequireSection sezione="statistiche"><StatistichePage /></RequireSection>} />
            <Route path="utenti" element={<RequireSection sezione="utenti"><UtentiPage /></RequireSection>} />
            <Route path="ruoli" element={<RequireSection sezione="ruoli"><RuoliPage /></RequireSection>} />
            {/* Profilo personale: sempre accessibile a chi è loggato, nessun permesso di sezione richiesto */}
            <Route path="profilo" element={<ProfiloPage />} />
            <Route path="log" element={<RequireSection sezione="log"><ActivityLogPage /></RequireSection>} />
            <Route path="landing" element={<RequireSection sezione="landing"><LandingPageListPage /></RequireSection>} />
            <Route path="landing/:id/contatti" element={<RequireSection sezione="landing"><LandingContactsPage /></RequireSection>} />
            <Route path="calendario" element={<RequireSection sezione="calendario"><CalendarioAdminPage /></RequireSection>} />
            <Route path="analytics" element={<RequireSection sezione="analytics"><AnaliticsPage /></RequireSection>} />
          </Route>

          {/* Editor a schermo intero (fuori dal layout sidebar) — richiedono permesso "gestisci" */}
          <Route path="/admin/eventi/nuovo/editor"
            element={<ProtectedRoute><RequireSection sezione="eventi" min="gestisci"><EventoEditorPage /></RequireSection></ProtectedRoute>} />
          <Route path="/admin/eventi/:id/editor"
            element={<ProtectedRoute><RequireSection sezione="eventi" min="gestisci"><EventoEditorPage /></RequireSection></ProtectedRoute>} />
          <Route path="/admin/email/:id/editor"
            element={<ProtectedRoute><RequireSection sezione="email" min="gestisci"><EmailEditorPage /></RequireSection></ProtectedRoute>} />
          <Route path="/admin/email/nuovo"
            element={<ProtectedRoute><RequireSection sezione="email" min="gestisci"><EmailEditorPage /></RequireSection></ProtectedRoute>} />
          <Route path="/admin/landing/:id/editor"
            element={<ProtectedRoute><RequireSection sezione="landing" min="gestisci"><LandingEditorPage /></RequireSection></ProtectedRoute>} />

          <Route path="/admin/*" element={<Navigate to="/admin" replace />} />

          {/* Catch-all: qualsiasi altro path sconosciuto -> calendario pubblico (no pagina bianca) */}
          <Route path="*" element={<Navigate to="/calendario" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>
  )
}
