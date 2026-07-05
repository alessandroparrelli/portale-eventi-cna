import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#F9FAFB', fontFamily: 'Inter, sans-serif', padding: '24px'
        }}>
          <div style={{
            background: '#fff', borderRadius: '12px', padding: '32px', maxWidth: '480px',
            width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            border: '1px solid #E5E7EB'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0A0A0A', margin: '0 0 8px' }}>
              Si è verificato un errore
            </h2>
            <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 20px', lineHeight: 1.6 }}>
              Qualcosa è andato storto in questa sezione. Prova a tornare indietro.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => { this.setState({ hasError: false, error: null }); window.history.back() }}
                style={{
                  padding: '10px 20px', background: '#003DA5', color: '#fff', border: 'none',
                  borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif'
                }}>
                ← Torna indietro
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 20px', background: '#fff', color: '#374151',
                  border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13px',
                  fontWeight: '600', cursor: 'pointer', fontFamily: 'Inter, sans-serif'
                }}>
                🔄 Ricarica pagina
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
