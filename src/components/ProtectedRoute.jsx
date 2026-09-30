import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {import { Navigate, useLocation } from 'react-router-dom'
    import { useAuth } from '../hooks/useAuth'
      import { useRole } from '../hooks/useRole'
        
                export default function ProtectedRoute({ children }) {
                    const { user, loading: authLoading } = useAuth()
                        const { ruolo, loading: roleLoading }  = useRole()
                            const location = useLocation()
                              
                    if (authLoading || roleLoading) {
                          return (
                                  <div style={{
                                            minHeight: '100vh',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: '#F4F5F7',
                                            fontFamily: "'Inter', sans-serif",
                                  }}>
                                            <div style={{ textAlign: 'center' }}>
                                                        <img
                                                                      src="https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png"
                                                                      alt="CNA Roma"
                                                                      style={{ height: '48px', marginBottom: '16px', opacity: 0.6 }}
                                                                    />
                                                        <p style={{ color: '#6B7280', fontSize: '14px', fontWeight: '500' }}>Caricamento…</p>p>
                                            </div>div>
                                  </div>div>
                                )
                    }
                  
                    if (!user) {
                          return <Navigate to="/login" replace />
                    }
                  
                    // Registratori: redirect HARD a /admin/checkin se sono su /admin
                    if (ruolo === 'registratore' &&
                              (location.pathname === '/admin' || location.pathname === '/admin/')) {
                          window.location.replace('/admin/checkin')
                                return null
                    }
                  
                    return children
                }
                return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F4F5F7',
        fontFamily: "'Inter', sans-serif",
      }}>
        <div style={{ textAlign: 'center' }}>
          <img
            src="https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png"
            alt="CNA Roma"
            style={{ height: '48px', marginBottom: '16px', opacity: 0.6 }}
          />
          <p style={{ color: '#6B7280', fontSize: '14px', fontWeight: '500' }}>Caricamento…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}
