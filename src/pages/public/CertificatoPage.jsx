import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

const CERT_URL = 'https://hnkhckcclgabunkqfmrz.supabase.co/functions/v1/genera-certificato'

export default function CertificatoPage() {
  const { codice } = useParams()
  const [html, setHtml] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!codice) { setError('Codice non valido'); setLoading(false); return }
    fetch(`${CERT_URL}?codice=${codice}`)
      .then(r => r.ok ? r.text() : Promise.reject('Certificato non trovato'))
      .then(setHtml)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [codice])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',sans-serif" }}>
      <p style={{ color: '#9CA3AF' }}>Caricamento certificato…</p>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',sans-serif", padding: '24px' }}>
      <p style={{ fontSize: '48px', marginBottom: '16px' }}>❌</p>
      <p style={{ fontSize: '18px', fontWeight: '700', color: '#0A0A0A' }}>Certificato non trovato</p>
      <p style={{ fontSize: '14px', color: '#6B7280' }}>Il codice di verifica non è valido o il certificato non esiste.</p>
    </div>
  )

  return (
    <div>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', gap: '10px' }}>
          <button onClick={() => window.print()}
            style={{ padding: '10px 20px', backgroundColor: '#003DA5', color: '#fff', border: 'none',
              borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>
            🖨 Stampa / Salva PDF
          </button>
        </div>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
      <style>{`@media print { button { display: none !important; } }`}</style>
    </div>
  )
}
