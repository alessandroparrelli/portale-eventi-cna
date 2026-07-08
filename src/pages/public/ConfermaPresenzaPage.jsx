import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

const BLU  = '#003DA5'
const LOGO = 'https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png'
const FN_URL = 'https://hnkhckcclgabunkqfmrz.supabase.co/functions/v1/conferma-presenza'

export default function ConfermaPresenzaPage() {
  const { token } = useParams()
  const [stato, setStato] = useState('loading') // loading | ok | already | error
  const [data, setData] = useState(null)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!token) { setStato('error'); setMsg('Token mancante'); return }
    fetch(FN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(r => r.json())
      .then(res => {
        if (res.error) { setStato('error'); setMsg(res.error); return }
        setData(res)
        setStato(res.already_confirmed ? 'already' : 'ok')
      })
      .catch(e => { setStato('error'); setMsg(String(e)) })
  }, [token])

  return (
    <div style={{ minHeight: '100vh', background: '#F0F2F5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'Inter', Arial, sans-serif" }}>
      <div style={{ maxWidth: '480px', width: '100%', background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 32px rgba(0,0,0,0.10)' }}>
        {/* Header */}
        <div style={{ background: BLU, padding: '20px 32px' }}>
          <img src={LOGO} alt="CNA Roma" style={{ height: '44px', display: 'block' }} />
        </div>

        <div style={{ padding: '36px 32px', textAlign: 'center' }}>
          {stato === 'loading' && (
            <>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
              <p style={{ fontSize: '16px', color: '#374151' }}>Conferma in corso…</p>
            </>
          )}

          {stato === 'ok' && (
            <>
              <div style={{ fontSize: '56px', marginBottom: '16px' }}>✅</div>
              <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#0A0A0A', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                Presenza confermata!
              </h1>
              <p style={{ fontSize: '15px', color: '#374151', margin: '0 0 24px', lineHeight: '1.6' }}>
                Grazie <strong>{data?.nome}</strong>, la tua presenza a<br />
                <strong>{data?.evento}</strong><br />
                è stata confermata.
              </p>
              {data?.numero_posto && (
                <div style={{ display: 'inline-block', background: 'linear-gradient(135deg,#003DA5,#1a56db)', borderRadius: '12px', padding: '20px 40px', marginBottom: '20px' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Il tuo posto</p>
                  <p style={{ margin: '0', fontSize: '56px', fontWeight: '900', color: '#ffffff', lineHeight: '1' }}>{data.numero_posto}</p>
                </div>
              )}
              <p style={{ fontSize: '13px', color: '#9CA3AF', margin: '0' }}>Ti aspettiamo!</p>
            </>
          )}

          {stato === 'already' && (
            <>
              <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎟️</div>
              <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#0A0A0A', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                Già confermato
              </h1>
              <p style={{ fontSize: '15px', color: '#374151', margin: '0 0 24px', lineHeight: '1.6' }}>
                <strong>{data?.nome}</strong>, hai già confermato la tua presenza.<br />
                Ci vediamo all'evento!
              </p>
              {data?.numero_posto && (
                <div style={{ display: 'inline-block', background: 'linear-gradient(135deg,#003DA5,#1a56db)', borderRadius: '12px', padding: '20px 40px' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Il tuo posto</p>
                  <p style={{ margin: '0', fontSize: '56px', fontWeight: '900', color: '#ffffff', lineHeight: '1' }}>{data.numero_posto}</p>
                </div>
              )}
            </>
          )}

          {stato === 'error' && (
            <>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
              <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#DC2626', margin: '0 0 8px' }}>
                Link non valido
              </h1>
              <p style={{ fontSize: '14px', color: '#374151', margin: '0', lineHeight: '1.6' }}>
                {msg || 'Il link utilizzato non è valido o è già scaduto.'}<br />
                Per assistenza scrivi a <a href="mailto:marketing@cnaroma.it" style={{ color: BLU }}>marketing@cnaroma.it</a>
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ background: '#F9FAFB', borderTop: '1px solid #E5E7EB', padding: '16px 32px' }}>
          <p style={{ margin: 0, fontSize: '11px', color: '#9CA3AF' }}>
            CNA Roma — Confederazione Nazionale dell'Artigianato ·{' '}
            <a href="mailto:marketing@cnaroma.it" style={{ color: BLU }}>marketing@cnaroma.it</a>
          </p>
        </div>
      </div>
    </div>
  )
}
