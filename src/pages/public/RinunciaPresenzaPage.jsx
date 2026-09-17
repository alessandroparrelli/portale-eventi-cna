import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

const BLU  = '#003DA5'
const LOGO = 'https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png'
const FN_URL = 'https://hnkhckcclgabunkqfmrz.supabase.co/functions/v1/rinuncia-presenza'

function formatDataIT(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('it-IT', {
    timeZone: 'Europe/Rome', weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })
}
function formatOraIT(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' })
}

export default function RinunciaPresenzaPage() {
  const { token } = useParams()
  const [stato, setStato] = useState('loading') // loading | ok | already | error
  const [data, setData]   = useState(null)
  const [msg, setMsg]     = useState('')

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
        setStato(res.already_rinunciato ? 'already' : 'ok')
      })
      .catch(e => { setStato('error'); setMsg(String(e)) })
  }, [token])

  return (
    <div style={{ minHeight: '100vh', background: '#F0F2F5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'Outfit', Arial, sans-serif" }}>
      <div style={{ maxWidth: '480px', width: '100%', background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 32px rgba(0,0,0,0.10)' }}>

        {/* Header */}
        <div style={{ background: BLU, padding: '16px 32px' }}>
          <img src={LOGO} alt="CNA Roma" style={{ height: '44px', display: 'block' }} />
        </div>

        <div style={{ padding: '32px 24px', textAlign: 'center' }}>

          {stato === 'loading' && (
            <>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
              <p style={{ fontSize: '16px', color: '#374151' }}>Elaborazione in corso…</p>
            </>
          )}

          {stato === 'ok' && (
            <>
              <div style={{ fontSize: '52px', marginBottom: '12px' }}>😔</div>
              <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#0A0A0A', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                Ci dispiace non vederti
              </h1>
              <p style={{ fontSize: '15px', color: '#374151', margin: '0 0 24px', lineHeight: '1.6' }}>
                <strong>{data?.nome}</strong>, abbiamo registrato la tua rinuncia
                {data?.evento ? <> a <strong>{data.evento}</strong></> : ''}.
                Grazie per averci avvisato — il tuo posto verrà liberato.
              </p>

              {/* Riepilogo evento */}
              {(data?.data_inizio || data?.luogo) && (
                <div style={{ background: '#F9FAFB', borderRadius: '16px', padding: '16px 20px', textAlign: 'left', border: '1px solid #E5E7EB', marginBottom: '20px' }}>
                  {data.data_inizio && (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: data.luogo ? '10px' : 0 }}>
                      <span style={{ fontSize: '18px' }}>📅</span>
                      <div>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#0A0A0A' }}>{formatDataIT(data.data_inizio)}</p>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6B7280' }}>ore {formatOraIT(data.data_inizio)}</p>
                      </div>
                    </div>
                  )}
                  {data.luogo && (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '18px' }}>📍</span>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#0A0A0A' }}>{data.luogo}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Messaggio di chiusura */}
              <div style={{ background: '#F0F7FF', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '14px 16px', fontSize: '13px', color: '#374151', lineHeight: '1.6' }}>
                Speriamo di rivederti ai prossimi eventi CNA Roma.
                Per qualsiasi necessità scrivi a{' '}
                <a href="mailto:direzione@cnaroma.it" style={{ color: BLU, fontWeight: '600' }}>direzione@cnaroma.it</a>
              </div>
            </>
          )}

          {stato === 'already' && (
            <>
              <div style={{ fontSize: '52px', marginBottom: '12px' }}>✓</div>
              <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#0A0A0A', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                Rinuncia già registrata
              </h1>
              <p style={{ fontSize: '15px', color: '#374151', margin: '0 0 20px', lineHeight: '1.6' }}>
                <strong>{data?.nome}</strong>, avevi già comunicato la tua rinuncia. Nessuna modifica effettuata.
              </p>
              <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '14px 16px', fontSize: '13px', color: '#6B7280' }}>
                Se hai cambiato idea, scrivi a{' '}
                <a href="mailto:direzione@cnaroma.it" style={{ color: BLU, fontWeight: '600' }}>direzione@cnaroma.it</a>
                {' '}o chiama il <strong>06/57015230</strong>.
              </div>
            </>
          )}

          {stato === 'error' && (
            <>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
              <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#DC2626', margin: '0 0 8px' }}>Link non valido</h1>
              <p style={{ fontSize: '14px', color: '#374151', margin: 0, lineHeight: '1.6' }}>
                {msg || 'Il link utilizzato non è valido o è già scaduto.'}<br />
                Per assistenza scrivi a{' '}
                <a href="mailto:marketing@cnaroma.it" style={{ color: BLU }}>marketing@cnaroma.it</a>
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ background: '#F9FAFB', borderTop: '1px solid #E5E7EB', padding: '14px 24px' }}>
          <p style={{ margin: 0, fontSize: '11px', color: '#9CA3AF' }}>
            CNA Roma — Confederazione Nazionale dell'Artigianato ·{' '}
            <a href="mailto:marketing@cnaroma.it" style={{ color: BLU }}>marketing@cnaroma.it</a>
          </p>
        </div>
      </div>
    </div>
  )
}
