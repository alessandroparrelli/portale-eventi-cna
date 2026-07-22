import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { CalendarDays, MapPin, User, Mail, Phone, CheckCircle2, XCircle, Clock, ArrowLeft, Download, Share2 } from 'lucide-react'

const CNA_LOGO = 'https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png'

function fmtDt(ts, full = false) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('it-IT', {
    weekday: full ? 'long' : undefined,
    day: '2-digit', month: full ? 'long' : 'short', year: 'numeric',
    hour: full ? '2-digit' : undefined, minute: full ? '2-digit' : undefined,
  })
}

function QRActions({ qrValue, codice, eventoTitolo }) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  async function saveQR() {
    setSaving(true)
    try {
      const QRCode = await import('qrcode')
      const dataUrl = await QRCode.toDataURL(qrValue, { width: 400, margin: 2, color: { dark: '#0A0A0A', light: '#FFFFFF' } })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `qr-${codice}.png`
      a.click()
      setSaved(true); setTimeout(() => setSaved(false), 2500)
    } catch { alert('Errore nel salvataggio QR.') }
    setSaving(false)
  }
  function shareWhatsApp() {
    const pageUrl = window.location.origin + '/iscrizione/' + codice
    const msg = `🎟 La mia iscrizione a "${eventoTitolo || 'evento CNA'}"

Codice: ${codice}
QR Code: ${pageUrl}

📱 Mostra questa pagina all'ingresso.`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }
  return (
    <div style={{ display:'flex', gap:'8px', justifyContent:'center', flexWrap:'wrap', marginTop:'12px' }}>
      <button onClick={saveQR} disabled={saving}
        style={{ display:'flex', alignItems:'center', gap:'6px', backgroundColor:'#E11D48', color:'#fff', border:'none', borderRadius:'8px', padding:'10px 16px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:"'Outfit',sans-serif", opacity:saving?0.7:1 }}>
        <Download size={15}/> {saved ? '✓ Salvato!' : saving ? '…' : 'Salva QR'}
      </button>
      <button onClick={shareWhatsApp}
        style={{ display:'flex', alignItems:'center', gap:'6px', backgroundColor:'#25D366', color:'#fff', border:'none', borderRadius:'8px', padding:'10px 16px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
        <Share2 size={15}/> Invia su WhatsApp
      </button>
    </div>
  )
}

function CertificatoBtn({ registrationId }) {
  return (
    <a href={`https://hnkhckcclgabunkqfmrz.supabase.co/functions/v1/genera-certificato?registration_id=${registrationId}`}
      target="_blank" rel="noopener noreferrer"
      style={{ display:'inline-flex', alignItems:'center', gap:'6px', backgroundColor:'#F59E0B', color:'#fff',
        borderRadius:'8px', padding:'10px 16px', fontSize:'13px', fontWeight:'700',
        textDecoration:'none', fontFamily:"'Outfit',sans-serif", marginTop:'12px' }}>
      🏆 Scarica certificato di partecipazione
    </a>
  )
}

function QRCodeDisplay({ value }) {
  const [dataUrl, setDataUrl] = useState(null)
  const [err, setErr] = useState(false)

  useEffect(() => {
    if (!value) return
    setDataUrl(null); setErr(false)
    import('qrcode').then(QRCode => {
      QRCode.toDataURL(value, {
        width: 220,
        margin: 2,
        color: { dark: '#0A0A0A', light: '#FFFFFF' },
      }).then(url => setDataUrl(url)).catch(() => setErr(true))
    }).catch(() => setErr(true))
  }, [value])

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'8px' }}>
      {dataUrl
        ? <img src={dataUrl} alt="QR Code check-in" width={220} height={220} style={{ borderRadius:'8px', border:'1px solid #E5E7EB' }}/>
        : err
          ? <p style={{ fontSize:'13px', color:'#DC2626' }}>Errore generazione QR</p>
          : <div style={{ width:220, height:220, borderRadius:'8px', border:'1px solid #E5E7EB', display:'flex', alignItems:'center', justifyContent:'center', backgroundColor:'#F9FAFB' }}>
              <div style={{ width:28, height:28, border:'3px solid #E5E7EB', borderTopColor:'#E11D48', borderRadius:'50%', animation:'qrspin .8s linear infinite' }}/>
            </div>
      }
      <p style={{ fontSize:'11px', color:'#9CA3AF', margin:0, fontFamily:'monospace', letterSpacing:'0.05em' }}>{value}</p>
      <style>{`@keyframes qrspin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

export default function Iscrizione() {
  const { codice } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [reg, setReg] = useState(null)
  const [event, setEvent] = useState(null)
  const [error, setError] = useState(null)
  const [searchInput, setSearchInput] = useState(codice || '')
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (codice) lookup(codice)
    else setLoading(false)
  }, [codice])

  async function lookup(cod) {
    setLoading(true)
    setError(null)
    try {
      const { data: regs } = await supabase
        .from('registrations')
        .select('*')
        .ilike('codice_iscrizione', cod.trim())
        .limit(1)

      if (!regs || regs.length === 0) {
        setError('Nessuna iscrizione trovata con questo codice.')
        setReg(null); setEvent(null)
        setLoading(false); return
      }

      const r = regs[0]
      setReg(r)

      const { data: ev } = await supabase
        .from('events')
        .select('id,titolo,slug,data_inizio,data_fine,luogo,immagine_hero,logo_url,tema')
        .eq('id', r.event_id)
        .single()

      setEvent(ev)
    } catch (e) {
      setError('Errore durante la ricerca.')
    }
    setLoading(false)
  }

  async function handleSearch(e) {
    e.preventDefault()
    if (!searchInput.trim()) return
    setSearching(true)
    await lookup(searchInput)
    setSearching(false)
  }

  const primaryColor = event?.tema?.colore_primario || '#E11D48'
  const logoUrl = event?.logo_url || CNA_LOGO

  return (
    <div style={{ minHeight:'100vh', backgroundColor:'#F4F5F7', fontFamily:"'Outfit',sans-serif" }}>
      {/* Header */}
      <div style={{ backgroundColor:'#ffffff', borderBottom:'1px solid #E5E7EB', padding:'0 24px', height:'60px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <img src={CNA_LOGO} alt="CNA Roma" style={{ height:'36px', objectFit:'contain' }} />
        <button
          onClick={() => navigate(-1)}
          style={{ display:'flex', alignItems:'center', gap:'6px', background:'none', border:'none', cursor:'pointer', fontSize:'13px', color:'#6B7280', fontFamily:"'Outfit',sans-serif", fontWeight:'500' }}
        >
          <ArrowLeft size={16}/> Torna indietro
        </button>
      </div>

      <div style={{ maxWidth:'640px', margin:'0 auto', padding:'40px 24px' }}>

        {/* Search form — sempre visibile */}
        <div style={{ backgroundColor:'#ffffff', borderRadius:'10px', border:'1px solid #E5E7EB', padding:'24px', marginBottom:'24px' }}>
          <h1 style={{ fontSize:'22px', fontWeight:'900', color:'#0A0A0A', letterSpacing:'-0.03em', margin:'0 0 6px' }}>
            Verifica la tua iscrizione
          </h1>
          <p style={{ fontSize:'14px', color:'#6B7280', margin:'0 0 20px' }}>
            Inserisci il codice ricevuto via email per visualizzare i dettagli e il QR code.
          </p>
          <form onSubmit={handleSearch} style={{ display:'flex', gap:'10px' }}>
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value.toUpperCase())}
              placeholder="EVT-AACCCC-NNNN"
              style={{
                flex:1, border:'1px solid #D1D5DB', borderRadius:'6px', padding:'10px 14px',
                fontSize:'16px', fontFamily:"'Outfit',sans-serif", fontWeight:'600',
                letterSpacing:'0.05em', outline:'none', color:'#0A0A0A'
              }}
            />
            <button
              type="submit"
              disabled={searching || !searchInput.trim()}
              style={{
                backgroundColor: primaryColor, color:'#fff', border:'none', borderRadius:'6px',
                padding:'10px 20px', fontSize:'14px', fontWeight:'700', cursor:'pointer',
                fontFamily:"'Outfit',sans-serif", opacity: searching ? 0.7 : 1
              }}
            >
              {searching ? 'Ricerca…' : 'Cerca'}
            </button>
          </form>
        </div>

        {loading && (
          <div style={{ textAlign:'center', padding:'48px', color:'#9CA3AF', fontSize:'14px' }}>
            <Clock size={28} style={{ marginBottom:'12px', display:'block', margin:'0 auto 12px' }} />
            Caricamento…
          </div>
        )}

        {error && !loading && (
          <div style={{ backgroundColor:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'10px', padding:'20px', display:'flex', gap:'14px', alignItems:'flex-start' }}>
            <XCircle size={22} style={{ color:'#DC2626', flexShrink:0, marginTop:'1px' }} />
            <div>
              <p style={{ fontSize:'15px', fontWeight:'700', color:'#DC2626', margin:'0 0 4px' }}>Iscrizione non trovata</p>
              <p style={{ fontSize:'13px', color:'#7F1D1D', margin:0 }}>{error}</p>
            </div>
          </div>
        )}

        {reg && event && !loading && (
          <>
            {/* Status banner */}
            <div style={{
              backgroundColor: reg.presente ? '#F0FDF4' : '#EFF6FF',
              border: `1px solid ${reg.presente ? '#86EFAC' : '#BFDBFE'}`,
              borderRadius:'10px', padding:'16px 20px', marginBottom:'16px',
              display:'flex', gap:'12px', alignItems:'center'
            }}>
              {reg.presente
                ? <CheckCircle2 size={24} style={{ color:'#16A34A', flexShrink:0 }} />
                : <Clock size={24} style={{ color:'#2563EB', flexShrink:0 }} />
              }
              <div>
                <p style={{ fontSize:'15px', fontWeight:'800', color: reg.presente ? '#166534' : '#1E40AF', margin:'0 0 2px' }}>
                  {reg.presente ? 'Check-in effettuato' : 'Iscrizione confermata'}
                </p>
                <p style={{ fontSize:'13px', color: reg.presente ? '#166534' : '#3B82F6', margin:0, opacity:0.85 }}>
                  {reg.presente
                    ? `Presente il ${fmtDt(reg.checkin_at, true)}`
                    : 'Presenta il QR code all\'ingresso per il check-in'}
                </p>
              </div>
            </div>

            {/* Card evento */}
            <div style={{ backgroundColor:'#ffffff', borderRadius:'10px', border:'1px solid #E5E7EB', overflow:'hidden', marginBottom:'16px' }}>
              {event.immagine_hero && (
                <div style={{ height:'140px', backgroundImage:`url(${event.immagine_hero})`, backgroundSize:'cover', backgroundPosition:'center', position:'relative' }}>
                  <div style={{ position:'absolute', inset:0, backgroundColor:'rgba(0,0,0,0.45)' }} />
                  <div style={{ position:'absolute', bottom:'16px', left:'16px', right:'16px' }}>
                    <img src={logoUrl} alt="Logo" style={{ height:'28px', objectFit:'contain', filter:'brightness(0) invert(1)', marginBottom:'8px' }} />
                    <h2 style={{ color:'#fff', fontSize:'18px', fontWeight:'900', letterSpacing:'-0.02em', margin:0, lineHeight:'1.2' }}>{event.titolo}</h2>
                  </div>
                </div>
              )}
              {!event.immagine_hero && (
                <div style={{ padding:'20px 20px 0', display:'flex', alignItems:'center', gap:'12px' }}>
                  <img src={logoUrl} alt="Logo" style={{ height:'32px', objectFit:'contain' }} />
                  <h2 style={{ fontSize:'18px', fontWeight:'900', color:'#0A0A0A', letterSpacing:'-0.02em', margin:0 }}>{event.titolo}</h2>
                </div>
              )}
              <div style={{ padding:'20px', display:'flex', flexDirection:'column', gap:'10px' }}>
                <div style={{ display:'flex', gap:'10px', alignItems:'flex-start' }}>
                  <CalendarDays size={16} style={{ color:'#6B7280', flexShrink:0, marginTop:'2px' }} />
                  <div>
                    <p style={{ fontSize:'14px', fontWeight:'600', color:'#0A0A0A', margin:0 }}>
                      {fmtDt(event.data_inizio, true)}
                    </p>
                    {event.data_fine && event.data_fine !== event.data_inizio && (
                      <p style={{ fontSize:'13px', color:'#6B7280', margin:'2px 0 0' }}>fino al {fmtDt(event.data_fine, true)}</p>
                    )}
                  </div>
                </div>
                {event.luogo && (
                  <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
                    <MapPin size={16} style={{ color:'#6B7280', flexShrink:0 }} />
                    <p style={{ fontSize:'14px', color:'#374151', margin:0 }}>{event.luogo}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Dati partecipante + QR */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px' }}>
              {/* Dati */}
              <div style={{ backgroundColor:'#ffffff', borderRadius:'10px', border:'1px solid #E5E7EB', padding:'20px' }}>
                <p style={{ fontSize:'11px', fontWeight:'700', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 14px' }}>Dati iscritto</p>
                <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                  {(reg.nome || reg.cognome) && (
                    <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
                      <User size={15} style={{ color:'#6B7280', flexShrink:0 }} />
                      <p style={{ fontSize:'14px', fontWeight:'600', color:'#0A0A0A', margin:0 }}>{[reg.nome, reg.cognome].filter(Boolean).join(' ')}</p>
                    </div>
                  )}
                  {reg.ragione_sociale && (
                    <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
                      <span style={{ fontSize:'13px', color:'#6B7280', flexShrink:0, width:'15px', textAlign:'center' }}>🏢</span>
                      <p style={{ fontSize:'13px', color:'#374151', margin:0 }}>{reg.ragione_sociale}</p>
                    </div>
                  )}
                  {reg.email && (
                    <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
                      <Mail size={15} style={{ color:'#6B7280', flexShrink:0 }} />
                      <p style={{ fontSize:'13px', color:'#374151', margin:0, wordBreak:'break-all' }}>{reg.email}</p>
                    </div>
                  )}
                  {reg.cellulare && (
                    <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
                      <Phone size={15} style={{ color:'#6B7280', flexShrink:0 }} />
                      <p style={{ fontSize:'13px', color:'#374151', margin:0 }}>{reg.cellulare}</p>
                    </div>
                  )}
                </div>
                <div style={{ marginTop:'14px', paddingTop:'14px', borderTop:'1px solid #F3F4F6' }}>
                  <p style={{ fontSize:'11px', color:'#9CA3AF', margin:'0 0 4px' }}>Codice iscrizione</p>
                  <p style={{ fontSize:'13px', fontFamily:'monospace', fontWeight:'700', color:'#E11D48', margin:0, letterSpacing:'0.05em' }}>{reg.codice_iscrizione}</p>
                </div>
              </div>

              {/* QR */}
              <div style={{ backgroundColor:'#ffffff', borderRadius:'10px', border:'1px solid #E5E7EB', padding:'20px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                <p style={{ fontSize:'11px', fontWeight:'700', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 14px' }}>QR Code check-in</p>
                {reg.qr_code
                  ? <>
                      <QRCodeDisplay value={reg.qr_code} />
                      <QRActions qrValue={reg.qr_code} codice={reg.codice_iscrizione} eventoTitolo={event?.titolo} />
                      {event?.certificato_abilitato && reg.presente && (
                        <div style={{ textAlign:'center' }}>
                          <CertificatoBtn registrationId={reg.id} />
                        </div>
                      )}
                    </>
                  : <p style={{ fontSize:'13px', color:'#9CA3AF', textAlign:'center' }}>QR code non disponibile</p>
                }
              </div>
            </div>

            {/* Nota */}
            <p style={{ fontSize:'12px', color:'#9CA3AF', textAlign:'center', margin:0 }}>
              Conserva questa pagina o fai uno screenshot del QR code per il check-in.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
