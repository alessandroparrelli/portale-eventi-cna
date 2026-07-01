import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

const CERT_URL = 'https://hnkhckcclgabunkqfmrz.supabase.co/functions/v1/genera-certificato'

export default function CertificatoPage() {
  const { codice } = useParams()
  const [status, setStatus] = useState('loading') // loading | ok | error
  const [errMsg, setErrMsg] = useState('')

  const pdfUrl = codice ? `${CERT_URL}?codice=${encodeURIComponent(codice)}` : ''
  const downloadUrl = pdfUrl ? `${pdfUrl}&download=1` : ''

  useEffect(() => {
    if (!codice) { setStatus('error'); setErrMsg('Codice non valido'); return }
    let cancelled = false
    fetch(pdfUrl, { method: 'GET' })
      .then(r => {
        if (cancelled) return
        if (r.ok) setStatus('ok')
        else { setStatus('error'); setErrMsg('Certificato non trovato') }
      })
      .catch(() => { if (!cancelled) { setStatus('error'); setErrMsg('Errore di connessione') } })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codice])

  if (status === 'loading') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',sans-serif" }}>
      <p style={{ color: '#9CA3AF' }}>Verifica certificato…</p>
    </div>
  )

  if (status === 'error') return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',sans-serif", padding: '24px' }}>
      <p style={{ fontSize: '48px', marginBottom: '16px' }}>❌</p>
      <p style={{ fontSize: '18px', fontWeight: '700', color: '#0A0A0A' }}>Certificato non trovato</p>
      <p style={{ fontSize: '14px', color: '#6B7280' }}>{errMsg || 'Il codice di verifica non è valido o il certificato non esiste.'}</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F4F5F7', display: 'flex', flexDirection: 'column' }}>
      <div style={{ maxWidth: '960px', width: '100%', margin: '0 auto', padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '10px', flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#059669' }}>✅ Certificato autentico</p>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9CA3AF' }}>Codice verifica: <strong style={{ fontFamily: 'monospace' }}>{codice}</strong></p>
          </div>
          <a href={downloadUrl} target="_blank" rel="noopener noreferrer"
            style={{ padding: '10px 20px', backgroundColor: '#003DA5', color: '#fff', border: 'none', borderRadius: '8px',
              fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: "'Inter',sans-serif", textDecoration: 'none' }}>
            ⬇ Scarica PDF
          </a>
        </div>
      </div>
      <div style={{ flex: 1, maxWidth: '960px', width: '100%', margin: '0 auto', padding: '0 20px 24px', minHeight: '640px' }}>
        <iframe
          src={pdfUrl}
          title="Certificato di partecipazione"
          style={{ width: '100%', height: '75vh', minHeight: '520px', border: '1px solid #E5E7EB', borderRadius: '10px', background: '#fff' }}
        />
      </div>
    </div>
  )
}
