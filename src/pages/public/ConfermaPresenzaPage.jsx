import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

const BLU  = '#003DA5'
const LOGO = 'https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png'
const FN_URL = 'https://hnkhckcclgabunkqfmrz.supabase.co/functions/v1/conferma-presenza'
const QR_API = (val, size = 200) => `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&format=png&data=${encodeURIComponent(val)}`

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

// Costruisce un link .ics scaricabile inline come data URI
function buildIcs(data) {
  const pad = n => String(n).padStart(2, '0')
  function toIcsDate(iso) {
    const d = new Date(iso)
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`
  }

  const start = data.data_inizio ? toIcsDate(data.data_inizio) : null
  // Se data_fine non c'è, assume +2 ore
  const end = data.data_fine
    ? toIcsDate(data.data_fine)
    : (data.data_inizio ? toIcsDate(new Date(new Date(data.data_inizio).getTime() + 2 * 60 * 60 * 1000).toISOString()) : null)

  if (!start) return null

  const desc = [
    `Posto: ${data.numero_posto || '—'}`,
    `QR Code: ${data.qr_code || ''}`,
    '',
    data.descrizione ? data.descrizione.replace(/<[^>]+>/g, '') : '',
  ].filter(l => l !== undefined).join('\\n').trim()

  const uid = `cna-${Date.now()}@cnaroma.it`
  // Reminder 1 giorno prima (1440 min) e 1 ora prima (60 min)
  const alarm1 = `BEGIN:VALARM\r\nTRIGGER:-PT1440M\r\nACTION:DISPLAY\r\nDESCRIPTION:Reminder: ${data.evento} domani!\r\nEND:VALARM`
  const alarm2 = `BEGIN:VALARM\r\nTRIGGER:-PT60M\r\nACTION:DISPLAY\r\nDESCRIPTION:Reminder: ${data.evento} tra 1 ora!\r\nEND:VALARM`

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CNA Roma//Portale Eventi//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toIcsDate(new Date().toISOString())}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${data.evento || 'Evento CNA Roma'}`,
    data.luogo ? `LOCATION:${data.luogo}` : '',
    desc ? `DESCRIPTION:${desc}` : '',
    alarm1,
    alarm2,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')

  return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(lines)
}

// Link Google Calendar
function buildGoogleCalLink(data) {
  if (!data.data_inizio) return null
  const fmt = iso => new Date(iso).toISOString().replace(/[-:]/g, '').replace('.000', '')
  const start = fmt(data.data_inizio)
  const end = data.data_fine
    ? fmt(data.data_fine)
    : fmt(new Date(new Date(data.data_inizio).getTime() + 2 * 60 * 60 * 1000).toISOString())
  const details = encodeURIComponent([
    `Posto: ${data.numero_posto || '—'}`,
    `QR Code: ${data.qr_code || ''}`,
  ].join('\n'))
  const location = encodeURIComponent(data.luogo || '')
  const text = encodeURIComponent(data.evento || 'Evento CNA Roma')
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}&location=${location}&details=${details}`
}

function PostoCard({ numero_posto }) {
  const len = (numero_posto || '').length
  const fs = len > 8 ? '28px' : len > 5 ? '38px' : len > 3 ? '50px' : '64px'
  return (
    <div style={{ background: 'linear-gradient(135deg,#003DA5,#1a56db)', borderRadius: '14px', padding: '24px 32px', marginBottom: '20px', width: '100%', boxSizing: 'border-box' }}>
      <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Il tuo posto</p>
      <p style={{ margin: 0, fontSize: fs, fontWeight: '900', color: '#fff', lineHeight: 1.1, letterSpacing: '-0.02em' }}>{numero_posto}</p>
    </div>
  )
}

function QrBlock({ qr_code }) {
  if (!qr_code) return null
  return (
    <div style={{ marginBottom: '20px', padding: '20px', background: '#F9FAFB', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
      <p style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.06em' }}>QR code di accesso</p>
      <img src={QR_API(qr_code, 180)} alt="QR code" width={180} height={180}
        style={{ display: 'block', margin: '0 auto', borderRadius: '8px' }} />
      <p style={{ margin: '10px 0 0', fontSize: '11px', color: '#9CA3AF', fontFamily: 'monospace' }}>{qr_code}</p>
    </div>
  )
}

function InfoEvento({ data }) {
  if (!data.data_inizio && !data.luogo) return null
  return (
    <div style={{ marginBottom: '20px', background: '#F9FAFB', borderRadius: '12px', padding: '16px 20px', textAlign: 'left', border: '1px solid #E5E7EB' }}>
      {data.data_inizio && (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: data.luogo ? '12px' : 0 }}>
          <span style={{ fontSize: '20px', flexShrink: 0 }}>📅</span>
          <div>
            <p style={{ margin: 0, fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.05em' }}>Data e ora</p>
            <p style={{ margin: '3px 0 0', fontSize: '14px', fontWeight: '700', color: '#0A0A0A' }}>
              {formatDataIT(data.data_inizio)}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#374151' }}>
              ore {formatOraIT(data.data_inizio)}
              {data.data_fine && ` — ${formatOraIT(data.data_fine)}`}
            </p>
          </div>
        </div>
      )}
      {data.luogo && (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '20px', flexShrink: 0 }}>📍</span>
          <div>
            <p style={{ margin: 0, fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.05em' }}>Luogo</p>
            <p style={{ margin: '3px 0 0', fontSize: '14px', fontWeight: '700', color: '#0A0A0A' }}>{data.luogo}</p>
            <a href={`https://maps.google.com/?q=${encodeURIComponent(data.luogo)}`} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: '12px', color: BLU, fontWeight: '600', textDecoration: 'none' }}>
              Apri in Maps →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

function CalendarioButtons({ data }) {
  const ics = buildIcs(data)
  const gcal = buildGoogleCalLink(data)
  if (!ics && !gcal) return null

  return (
    <div style={{ marginBottom: '20px' }}>
      <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.06em' }}>Aggiungi al calendario</p>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {ics && (
          <a href={ics} download={`${(data.evento || 'evento').replace(/\s+/g, '-')}.ics`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 18px', background: BLU, color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '700', fontFamily: "'Inter',Arial,sans-serif" }}>
            <span style={{ fontSize: '16px' }}>📥</span> Apple / Outlook
          </a>
        )}
        {gcal && (
          <a href={gcal} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 18px', background: '#fff', color: '#374151', border: '1.5px solid #E5E7EB', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '700', fontFamily: "'Inter',Arial,sans-serif" }}>
            <span style={{ fontSize: '16px' }}>📅</span> Google Calendar
          </a>
        )}
      </div>
      <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#9CA3AF' }}>Include reminder 1 giorno prima e 1 ora prima</p>
    </div>
  )
}

export default function ConfermaPresenzaPage() {
  const { token } = useParams()
  const [stato, setStato] = useState('loading')
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

        {/* Header — stesso logo della mail */}
        <div style={{ background: BLU, padding: '16px 32px' }}>
          <img src={LOGO} alt="CNA Roma" style={{ height: '44px', display: 'block' }} />
        </div>

        <div style={{ padding: '28px 24px', textAlign: 'center' }}>

          {stato === 'loading' && (
            <>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
              <p style={{ fontSize: '16px', color: '#374151' }}>Conferma in corso…</p>
            </>
          )}

          {(stato === 'ok' || stato === 'already') && (
            <>
              {/* Icona + titolo */}
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>
                {stato === 'ok' ? '✅' : '🎟️'}
              </div>
              <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#0A0A0A', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                {stato === 'ok' ? 'Presenza confermata!' : 'Già confermato'}
              </h1>
              <p style={{ fontSize: '14px', color: '#374151', margin: '0 0 20px', lineHeight: '1.6' }}>
                {stato === 'ok'
                  ? <><strong>{data.nome}</strong>, la tua presenza a <strong>{data.evento}</strong> è confermata.</>
                  : <><strong>{data.nome}</strong>, hai già confermato la tua presenza. Ci vediamo all'evento!</>
                }
              </p>

              {/* Posto */}
              {data.numero_posto && <PostoCard numero_posto={data.numero_posto} />}

              {/* QR code */}
              {data.qr_code && <QrBlock qr_code={data.qr_code} />}

              {/* Info evento */}
              <InfoEvento data={data} />

              {/* Aggiungi al calendario */}
              <CalendarioButtons data={data} />
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
