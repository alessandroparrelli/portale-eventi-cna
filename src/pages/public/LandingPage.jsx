import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { MapPin, Calendar, Clock, Users, ChevronRight, AlertCircle, ExternalLink } from 'lucide-react'
import FormIscrizione from './FormIscrizione'

function fmtData(ts) {
  if (!ts) return null
  return new Date(ts).toLocaleDateString('it-IT', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
}
function fmtOra(ts) {
  if (!ts) return null
  return new Date(ts).toLocaleTimeString('it-IT', { hour:'2-digit', minute:'2-digit' })
}

/* ── MODALE CONFERMA ─────────────────────────────────────────── */
function ModalConferma({ reg, event, onClose }) {
  const [calAdded, setCalAdded] = useState(false)

  function addToCalendar() {
    const fmt = ts => ts
      ? new Date(ts).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')
      : null
    const dtStart = fmt(event.data_inizio)
    const dtEnd   = fmt(event.data_fine) || dtStart
    const now     = fmt(new Date().toISOString())
    const ics = [
      'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//CNA Roma//Portale Eventi//IT',
      'CALSCALE:GREGORIAN','METHOD:PUBLISH','BEGIN:VEVENT',
      `UID:${reg.id}@cna-eventi`,
      `DTSTAMP:${now}Z`,`DTSTART:${dtStart}`,`DTEND:${dtEnd}`,
      `SUMMARY:${event.titolo}`,
      `LOCATION:${(event.luogo||'').replace(/,/g,'\\,')}`,
      `DESCRIPTION:Iscrizione di ${reg.nome} ${reg.cognome}\\nQR: ${reg.qr_code}`,
      'END:VEVENT','END:VCALENDAR',
    ].join('\r\n')
    const blob = new Blob([ics], { type:'text/calendar;charset=utf-8' })
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `${event.slug}.ics` })
    a.click(); URL.revokeObjectURL(a.href)
    setCalAdded(true)
  }

  return (
    <div style={mc.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={mc.box}>
        {/* check animato */}
        <div style={mc.iconWrap}>
          <svg viewBox="0 0 56 56" style={{ width:'72px',height:'72px' }}>
            <circle cx="28" cy="28" r="27" fill="none" stroke="#16A34A" strokeWidth="2"
              strokeDasharray="170" strokeDashoffset="170"
              style={{ animation:'circ .6s ease forwards' }}/>
            <path d="M16 29l9 9 15-17" fill="none" stroke="#16A34A" strokeWidth="3"
              strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="32" strokeDashoffset="32"
              style={{ animation:'tick .4s ease .5s forwards' }}/>
          </svg>
        </div>

        <h2 style={mc.title}>Iscrizione confermata!</h2>
        <p style={mc.sub}>Benvenuto/a, <strong>{reg.nome} {reg.cognome}</strong>. Riceverai a breve una email con il tuo QR Code personale da presentare all'ingresso.</p>

        <div style={mc.qrBox}>
          <span style={mc.qrLabel}>Codice QR</span>
          <code style={mc.qrCode}>{reg.qr_code}</code>
        </div>

        <div style={mc.infoBox}>
          {event.data_inizio && (
            <div style={mc.infoRow}><Calendar size={14} style={{ color:'#003DA5',flexShrink:0 }}/><span>{fmtData(event.data_inizio)}</span></div>
          )}
          {event.luogo && (
            <a href={`https://maps.google.com/?q=${encodeURIComponent(event.luogo)}`}
              target="_blank" rel="noopener noreferrer" style={{ ...mc.infoRow, textDecoration:'none', color:'inherit' }}>
              <MapPin size={14} style={{ color:'#003DA5',flexShrink:0 }}/>
              <span style={{ color:'#003DA5', textDecorationLine:'underline', textDecorationStyle:'dotted' }}>
                {event.luogo}
              </span>
            </a>
          )}
        </div>

        <div style={mc.btnRow}>
          <button onClick={addToCalendar} style={{ ...mc.calBtn, backgroundColor: calAdded ? '#16A34A' : '#003DA5' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {calAdded ? '✓ Aggiunto al calendario' : 'Aggiungi al calendario'}
          </button>
          <button onClick={onClose} style={mc.closeBtn}>Chiudi</button>
        </div>
        <p style={mc.hint}>Il file .ics è compatibile con Google Calendar, Apple Calendar e Outlook.</p>
      </div>
      <style>{`@keyframes circ{to{stroke-dashoffset:0}}@keyframes tick{to{stroke-dashoffset:0}}`}</style>
    </div>
  )
}

/* ── LANDING PAGE ────────────────────────────────────────────── */
export default function LandingPage() {
  const { slug } = useParams()
  const [event,       setEvent]       = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [notFound,    setNotFound]    = useState(false)
  const [iscrizioniN, setIscrizioniN] = useState(0)
  const [formVisible, setFormVisible] = useState(false)
  const [conferma,    setConferma]    = useState(null) // dati iscritto per modale

  useEffect(() => {
    supabase.from('events').select('*').eq('slug', slug).eq('stato','pubblicato').single()
      .then(({ data, error }) => {
        if (error || !data) { setNotFound(true); setLoading(false); return }
        setEvent(data)
        supabase.from('registrations').select('id',{count:'exact'}).eq('event_id', data.id)
          .then(({ count }) => setIscrizioniN(count||0))
        setLoading(false)
      })
  }, [slug])

  if (loading) return (
    <div style={s.center}>
      <img src="https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png"
        alt="CNA Roma" style={{ height:'64px', opacity:.5, marginBottom:'16px' }}/>
      <p style={{ color:'#9CA3AF', fontSize:'14px' }}>Caricamento…</p>
    </div>
  )
  if (notFound) return (
    <div style={s.center}>
      <img src="https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png"
        alt="CNA Roma" style={{ height:'64px', marginBottom:'24px' }}/>
      <AlertCircle size={44} style={{ color:'#D1D5DB', marginBottom:'12px' }}/>
      <p style={{ fontSize:'20px', fontWeight:'800', color:'#0A0A0A', margin:'0 0 8px' }}>Evento non trovato</p>
      <p style={{ fontSize:'14px', color:'#6B7280' }}>L'evento non esiste o non è ancora pubblico.</p>
    </div>
  )

  const cap     = event.capienza_max
  const posti   = cap ? Math.max(0, cap - iscrizioniN) : null
  const esaurito = cap && iscrizioniN >= cap

  const heroH   = event.layout_hero?.altezza    || '340'
  const overlayO = event.layout_hero?.overlay_opacita || '55'
  const heroAlign = event.layout_hero?.allineamento   || 'sinistra'

  const heroStyle = event.immagine_hero
    ? { backgroundImage:`url(${event.immagine_hero})`, backgroundSize:'cover', backgroundPosition:'center' }
    : { background:'linear-gradient(135deg, #003DA5 0%, #001a50 100%)' }

  return (
    <div style={s.root}>

      {/* ── HEADER full-width ── */}
      <header style={s.header}>
        <div style={s.headerInner}>
          <img
            src="https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png"
            alt="CNA Roma" style={s.logo}/>
        </div>
      </header>

      {/* ── HERO ── */}
      <div style={{ ...s.hero, ...heroStyle, minHeight:`${heroH}px` }}>
        <div style={{ ...s.heroOverlay, backgroundColor:`rgba(0,0,0,${overlayO/100})` }}>
          <div style={{ ...s.heroContent, textAlign: heroAlign === 'centro' ? 'center' : 'left',
            marginLeft: heroAlign === 'centro' ? 'auto' : undefined,
            marginRight: heroAlign === 'centro' ? 'auto' : undefined }}>
            <span style={s.heroTag}><Calendar size={13}/> Evento CNA Roma</span>
            <h1 style={s.heroTitle}>{event.titolo}</h1>
            {event.data_inizio && (
              <p style={s.heroMeta}>
                <Calendar size={14}/> {fmtData(event.data_inizio)}
                {fmtOra(event.data_inizio) && ` · ${fmtOra(event.data_inizio)}`}
                {event.data_fine && fmtOra(event.data_fine) && ` — ${fmtOra(event.data_fine)}`}
              </p>
            )}
            {event.luogo && (
              <a href={`https://maps.google.com/?q=${encodeURIComponent(event.luogo)}`}
                target="_blank" rel="noopener noreferrer" style={s.heroLoc}>
                <MapPin size={14}/> {event.luogo}
                <ExternalLink size={11} style={{ opacity:.7 }}/>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── BODY centrato ── */}
      <div style={s.body}>

        {/* Info cards */}
        <div style={s.infoGrid}>
          {event.data_inizio && (
            <div style={s.infoCard}>
              <Calendar size={18} style={{ color:'#003DA5', flexShrink:0 }}/>
              <div>
                <p style={s.infoLbl}>Data</p>
                <p style={s.infoVal}>{fmtData(event.data_inizio)}</p>
              </div>
            </div>
          )}
          {event.data_inizio && (
            <div style={s.infoCard}>
              <Clock size={18} style={{ color:'#003DA5', flexShrink:0 }}/>
              <div>
                <p style={s.infoLbl}>Orario</p>
                <p style={s.infoVal}>
                  {fmtOra(event.data_inizio) || '—'}
                  {event.data_fine && fmtOra(event.data_fine) && ` — ${fmtOra(event.data_fine)}`}
                </p>
              </div>
            </div>
          )}
          {event.luogo && (
            <a href={`https://maps.google.com/?q=${encodeURIComponent(event.luogo)}`}
              target="_blank" rel="noopener noreferrer"
              style={{ ...s.infoCard, textDecoration:'none' }}>
              <MapPin size={18} style={{ color:'#003DA5', flexShrink:0 }}/>
              <div>
                <p style={s.infoLbl}>Luogo <span style={{ color:'#003DA5' }}>↗</span></p>
                <p style={{ ...s.infoVal, color:'#003DA5', textDecorationLine:'underline', textDecorationStyle:'dotted' }}>
                  {event.luogo}
                </p>
              </div>
            </a>
          )}
          {cap && (
            <div style={s.infoCard}>
              <Users size={18} style={{ color: esaurito?'#DC2626':'#003DA5', flexShrink:0 }}/>
              <div>
                <p style={s.infoLbl}>Disponibilità</p>
                <p style={{ ...s.infoVal, color: esaurito?'#DC2626': posti&&posti<20?'#D97706':'#0A0A0A' }}>
                  {esaurito ? 'Esaurito' : `${posti} posti rimasti`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Barra progressione capienza */}
        {cap && (
          <div style={s.capBar}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
              <span style={{ fontSize:'12px', color:'#6B7280', fontWeight:'500' }}>Iscritti</span>
              <span style={{ fontSize:'12px', color:'#6B7280', fontWeight:'600' }}>{iscrizioniN}/{cap}</span>
            </div>
            <div style={s.capTrack}>
              <div style={{ ...s.capFill,
                width:`${Math.min(100,(iscrizioniN/cap)*100)}%`,
                backgroundColor: esaurito?'#DC2626': iscrizioniN/cap>.8?'#D97706':'#003DA5' }}/>
            </div>
          </div>
        )}

        {/* Descrizione */}
        {event.descrizione && (
          <section style={s.section}>
            <h2 style={s.secTitle}>Informazioni sull'evento</h2>
            <div style={s.descText}>
              {event.descrizione.split('\n').map((p,i) => <p key={i} style={{ margin:'0 0 12px' }}>{p}</p>)}
            </div>
          </section>
        )}

        {/* CTA box */}
        {!conferma && (
          <section style={s.ctaBox}>
            <div style={s.ctaLeft}>
              <h2 style={s.ctaTitle}>Partecipa all'evento</h2>
              <p style={s.ctaSub}>
                {esaurito
                  ? 'I posti disponibili sono esauriti.'
                  : 'Registrazione gratuita. Ricevi il tuo QR Code per l\'ingresso.'}
              </p>
            </div>
            {!esaurito && !formVisible && (
              <button onClick={() => setFormVisible(true)} style={s.ctaBtn}>
                Iscriviti ora <ChevronRight size={18}/>
              </button>
            )}
          </section>
        )}

        {formVisible && !esaurito && !conferma && (
          <div style={s.formWrap}>
            <h3 style={s.formTitle}>Modulo di iscrizione</h3>
            <FormIscrizione event={event} onSuccess={dati => {
              setFormVisible(false)
              setConferma(dati)
            }}/>
          </div>
        )}

      </div>

      <footer style={s.footer}>
        © {new Date().getFullYear()} CNA Roma — Confederazione Nazionale dell'Artigianato e della PMI
      </footer>

      {/* Modale conferma */}
      {conferma && (
        <ModalConferma reg={conferma} event={event} onClose={() => setConferma(null)}/>
      )}
    </div>
  )
}

/* ── STILI ───────────────────────────────────────────────────── */
const s = {
  root:    { minHeight:'100vh', backgroundColor:'#FFFFFF', fontFamily:"'Inter',sans-serif", display:'flex', flexDirection:'column' },
  center:  { minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', backgroundColor:'#F4F5F7', padding:'24px' },
  // header full-width
  header:      { backgroundColor:'#FFFFFF', borderBottom:'3px solid #003DA5', position:'sticky', top:0, zIndex:50, width:'100%', margin:0, padding:0, lineHeight:0 },
  headerInner: { maxWidth:'100%', padding:'0 20px', height:'72px', display:'flex', alignItems:'center', lineHeight:'normal' },
  logo:        { height:'44px', maxHeight:'44px', objectFit:'contain', display:'block' },
  // hero
  hero:        { display:'flex', alignItems:'flex-end', position:'relative', margin:0, padding:0, flexShrink:0 },
  heroOverlay: { width:'100%', padding:'56px 40px 44px', transition:'background-color .3s' },
  heroContent: { maxWidth:'820px' },
  heroTag:     { display:'inline-flex', alignItems:'center', gap:'6px', backgroundColor:'rgba(255,255,255,.16)', color:'#FFFFFF', padding:'4px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:'600', marginBottom:'14px', backdropFilter:'blur(6px)' },
  heroTitle:   { fontSize:'clamp(26px,5vw,54px)', fontWeight:'900', color:'#FFFFFF', letterSpacing:'-.04em', margin:'0 0 12px', lineHeight:'1.05' },
  heroMeta:    { display:'flex', alignItems:'center', gap:'8px', fontSize:'15px', color:'rgba(255,255,255,.9)', margin:'0 0 8px', fontWeight:'500', textTransform:'capitalize', flexWrap:'wrap' },
  heroLoc:     { display:'inline-flex', alignItems:'center', gap:'6px', color:'rgba(255,255,255,.8)', fontSize:'14px', textDecoration:'none', fontWeight:'500' },
  // body
  body:        { maxWidth:'820px', margin:'0 auto', padding:'40px 24px 0' },
  infoGrid:    { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'12px', marginBottom:'20px' },
  infoCard:    { backgroundColor:'#F4F5F7', borderRadius:'10px', padding:'16px', display:'flex', gap:'12px', alignItems:'flex-start' },
  infoLbl:     { fontSize:'11px', fontWeight:'600', color:'#6B7280', textTransform:'uppercase', letterSpacing:'.06em', margin:'0 0 3px' },
  infoVal:     { fontSize:'14px', fontWeight:'600', color:'#0A0A0A', margin:0, lineHeight:'1.4' },
  capBar:      { marginBottom:'28px' },
  capTrack:    { height:'6px', backgroundColor:'#E5E7EB', borderRadius:'3px', overflow:'hidden' },
  capFill:     { height:'100%', borderRadius:'3px', transition:'width .4s' },
  section:     { borderTop:'1px solid #E5E7EB', paddingTop:'28px', marginBottom:'32px' },
  secTitle:    { fontSize:'22px', fontWeight:'900', color:'#0A0A0A', letterSpacing:'-.03em', margin:'0 0 16px' },
  descText:    { fontSize:'15px', color:'#374151', lineHeight:'1.75' },
  ctaBox:      { backgroundColor:'#EEF3FF', border:'1px solid #C7D9F8', borderRadius:'12px', padding:'28px', marginBottom:'24px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'20px', flexWrap:'wrap' },
  ctaLeft:     {},
  ctaTitle:    { fontSize:'20px', fontWeight:'900', color:'#0A0A0A', letterSpacing:'-.02em', margin:'0 0 6px' },
  ctaSub:      { fontSize:'14px', color:'#4B5563', margin:0, lineHeight:'1.5' },
  ctaBtn:      { display:'flex', alignItems:'center', gap:'8px', backgroundColor:'#003DA5', color:'#FFFFFF', border:'none', borderRadius:'8px', padding:'14px 28px', fontSize:'15px', fontWeight:'700', fontFamily:"'Inter',sans-serif", cursor:'pointer', whiteSpace:'nowrap', letterSpacing:'-.01em' },
  formWrap:    { backgroundColor:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:'12px', padding:'28px', marginBottom:'40px' },
  formTitle:   { fontSize:'18px', fontWeight:'800', color:'#0A0A0A', letterSpacing:'-.02em', margin:'0 0 20px' },
  footer:      { borderTop:'1px solid #E5E7EB', padding:'24px', textAlign:'center', fontSize:'13px', color:'#9CA3AF', marginTop:'40px' },
}

const mc = {
  overlay: { position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'24px', overflowY:'auto' },
  box:     { backgroundColor:'#FFFFFF', borderRadius:'20px', padding:'44px 36px', maxWidth:'460px', width:'100%', boxShadow:'0 32px 80px rgba(0,0,0,.2)', textAlign:'center' },
  iconWrap:{ margin:'0 auto 20px', width:'72px', height:'72px' },
  title:   { fontSize:'24px', fontWeight:'900', color:'#0A0A0A', letterSpacing:'-.03em', margin:'0 0 8px' },
  sub:     { fontSize:'14px', color:'#6B7280', lineHeight:'1.6', margin:'0 0 20px' },
  qrBox:   { backgroundColor:'#F4F5F7', borderRadius:'10px', padding:'14px', marginBottom:'16px', display:'flex', flexDirection:'column', gap:'4px' },
  qrLabel: { fontSize:'11px', fontWeight:'600', color:'#6B7280', textTransform:'uppercase', letterSpacing:'.06em', margin:0 },
  qrCode:  { fontSize:'16px', fontFamily:'monospace', color:'#003DA5', fontWeight:'700', letterSpacing:'.05em', margin:0 },
  infoBox: { backgroundColor:'#EEF3FF', borderRadius:'10px', padding:'14px 16px', marginBottom:'24px', display:'flex', flexDirection:'column', gap:'8px', textAlign:'left' },
  infoRow: { display:'flex', alignItems:'center', gap:'8px', fontSize:'13px', color:'#374151', fontWeight:'500' },
  btnRow:  { display:'flex', gap:'10px', justifyContent:'center', marginBottom:'12px', flexWrap:'wrap' },
  calBtn:  { display:'flex', alignItems:'center', gap:'8px', color:'#FFFFFF', border:'none', borderRadius:'8px', padding:'12px 20px', fontSize:'14px', fontWeight:'700', fontFamily:"'Inter',sans-serif", cursor:'pointer', transition:'background-color .2s', letterSpacing:'-.01em' },
  closeBtn:{ padding:'12px 20px', backgroundColor:'transparent', border:'1px solid #E5E7EB', borderRadius:'8px', fontSize:'14px', fontWeight:'600', fontFamily:"'Inter',sans-serif", cursor:'pointer', color:'#6B7280' },
  hint:    { fontSize:'11px', color:'#9CA3AF', lineHeight:'1.5', margin:0 },
}
