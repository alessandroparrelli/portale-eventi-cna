import { useEffect, useState, useRef } from 'react'
import { usePageTitle } from '../../hooks/usePageTitle'
import { useOGMeta } from '../../hooks/useOGMeta'
import ShareBar from '../../components/public/ShareBar'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { temaConDefault } from '../../components/editor/AspettoTab'
import { MapPin, Calendar, ChevronRight, AlertCircle, Download, Share2 } from 'lucide-react'
import { RICH_CSS } from '../../components/editor/RichEditor'
import FormIscrizione from './FormIscrizione'
import SocialLinks from '../../components/SocialLinks'
import { useSocial } from '../../hooks/useSocial'
import BlockRenderer from '../../components/public/BlockRenderer'

function fmtData(ts) {
  if (!ts) return null
  return new Date(ts).toLocaleDateString('it-IT', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
}
function fmtOra(ts) {
  if (!ts) return null
  return new Date(ts).toLocaleTimeString('it-IT', { hour:'2-digit', minute:'2-digit' })
}

/* ── MODALE CONFERMA ─────────────────────────────────── */
function ModalConferma({ reg, event, onClose }) {
  const [calAdded, setCalAdded] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [qrSaved, setQrSaved] = useState(false)

  function saveQR() {
    if (!qrDataUrl) return
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = `qr-${reg.codice_iscrizione || reg.qr_code}.png`
    a.click()
    setQrSaved(true); setTimeout(() => setQrSaved(false), 2500)
  }

  function shareWhatsApp() {
    const pageUrl = window.location.origin + '/iscrizione/' + reg.codice_iscrizione
    const msg = `🎟 La mia iscrizione a "${event?.titolo || 'evento CNA'}"\n\nCodice: ${reg.codice_iscrizione}\nQR Code: ${pageUrl}\n\n📱 Mostra questa pagina all'ingresso.`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  useEffect(() => {
    let cancelled = false
    import('qrcode').then(QRCode => {
      QRCode.toDataURL(reg.qr_code, {
        width:240, margin:2,
        color:{ dark:'#003DA5', light:'#FFFFFF' },
        errorCorrectionLevel:'H',
      }).then(url => { if (!cancelled) setQrDataUrl(url) })
    })
    return () => { cancelled = true }
  }, [reg.qr_code])

  function addToCalendar() {
    const fmtIcs  = ts => ts ? new Date(ts).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'') : null
    const fmtGcal = ts => ts ? new Date(ts).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z') : null
    const dtStart = fmtIcs(event.data_inizio)
    const dtEnd   = fmtIcs(event.data_fine) || dtStart
    const isIOS   = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    const descrizione = `Iscrizione di ${reg.nome} ${reg.cognome} — Codice: ${reg.codice_iscrizione}` +
                        (event.sottotitolo ? '\n' + event.sottotitolo : '')

    if (isIOS) {
      const now = fmtIcs(new Date().toISOString())
      const ics = [
        'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//CNA Roma//Portale Eventi//IT',
        'CALSCALE:GREGORIAN','METHOD:PUBLISH','BEGIN:VEVENT',
        `UID:${reg.id}@cna-eventi`,
        `DTSTAMP:${now}Z`,`DTSTART:${dtStart}`,`DTEND:${dtEnd}`,
        `SUMMARY:${event.titolo}`,
        event.luogo ? `LOCATION:${event.luogo.replace(/,/g,'\\,')}` : '',
        `DESCRIPTION:${descrizione.replace(/\n/g,'\\n')}`,
        'END:VEVENT','END:VCALENDAR',
      ].filter(Boolean).join('\r\n')
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
      const url  = URL.createObjectURL(blob)
      window.location.href = url
      setTimeout(() => URL.revokeObjectURL(url), 3000)
    } else {
      // Android + Desktop: Google Calendar apre direttamente il form pre-compilato
      const gcStart = fmtGcal(event.data_inizio)
      const gcEnd   = fmtGcal(event.data_fine) || gcStart
      const params  = new URLSearchParams({
        action:  'TEMPLATE',
        text:    event.titolo,
        dates:   `${gcStart}/${gcEnd}`,
        details: descrizione,
        ...(event.luogo ? { location: event.luogo } : {}),
      })
      window.open(`https://calendar.google.com/calendar/render?${params}`, '_blank', 'noopener')
    }
    setCalAdded(true)
  }

  function downloadQR() {
    if (!qrDataUrl) return
    Object.assign(document.createElement('a'),{ href:qrDataUrl, download:`qr-${reg.qr_code}.png` }).click()
  }

  return (
    <div style={mc.overlay} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={mc.box}>
        <div style={mc.iconWrap}>
          <svg viewBox="0 0 56 56" style={{ width:'64px',height:'64px' }}>
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
        <p style={mc.sub}>Benvenuto/a <strong>{reg.nome} {reg.cognome}</strong>. {event.teatro_abilitato ? 'Riceverai il tuo posto e il QR Code via email.' : 'Salva il QR Code — ti servirà all'ingresso.'}</p>

        {/* Codice iscrizione */}
        {reg.codice_iscrizione && (
          <div style={{ background:'#EEF3FF', border:'1px solid #C7D9F8', borderRadius:'8px', padding:'10px 16px', marginBottom:'14px', textAlign:'center' }}>
            <p style={{ fontSize:'11px', color:'#6B7280', margin:'0 0 3px', fontWeight:'700', textTransform:'uppercase', letterSpacing:'.06em' }}>Codice iscrizione</p>
            <code style={{ fontSize:'18px', fontWeight:'900', color:'#003DA5', letterSpacing:'.05em', fontFamily:'monospace' }}>
              {reg.codice_iscrizione}
            </code>
            {reg.accompagnatori > 0 && (
              <p style={{ fontSize:'12px', color:'#6B7280', margin:'4px 0 0' }}>
                + {reg.accompagnatori} accompagnator{reg.accompagnatori === 1 ? 'e' : 'i'} registrat{reg.accompagnatori === 1 ? 'o' : 'i'}
              </p>
            )}
          </div>
        )}

        {!event.teatro_abilitato && (
          <div style={mc.qrBox}>
            <p style={mc.qrLabel}>Il tuo QR Code personale</p>
            {qrDataUrl ? (
              <>
                <img src={qrDataUrl} alt="QR" style={mc.qrImg}/>
                <p style={{ fontSize:'12px',color:'#6B7280',margin:0 }}>📸 Fai uno screenshot o scarica</p>
                <code style={mc.qrCode}>{reg.qr_code}</code>
                <button onClick={saveQR} style={{ ...mc.dlBtn, backgroundColor:'#003DA5', color:'#fff', border:'none' }}>
                  <Download size={13} style={{ display:'inline', marginRight:4, verticalAlign:'middle' }}/> {qrSaved ? '✓ Salvato!' : 'Salva QR Code'}
                </button>
                <button onClick={shareWhatsApp} style={{ ...mc.dlBtn, backgroundColor:'#25D366', color:'#fff', border:'none', marginLeft:6 }}>
                  <Share2 size={13} style={{ display:'inline', marginRight:4, verticalAlign:'middle' }}/> WhatsApp
                </button>
              </>
            ) : (
              <div style={{ display:'flex',alignItems:'center',gap:'10px',padding:'20px 0' }}>
                <div style={{ width:'28px',height:'28px',border:'3px solid #E5E7EB',borderTopColor:'#003DA5',borderRadius:'50%',animation:'qrspin .8s linear infinite' }}/>
                <span style={{ fontSize:'13px',color:'#6B7280' }}>Generazione QR…</span>
              </div>
            )}
          </div>
        )}
        {event.teatro_abilitato && (
          <div style={{ background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:'10px', padding:'16px 20px', marginBottom:'14px', textAlign:'center' }}>
            <p style={{ fontSize:'22px', margin:'0 0 6px' }}>🎭</p>
            <p style={{ fontSize:'14px', fontWeight:'700', color:'#C2410C', margin:'0 0 4px' }}>Il tuo posto verrà assegnato a breve</p>
            <p style={{ fontSize:'13px', color:'#92400E', margin:0, lineHeight:'1.5' }}>Riceverai una email con il numero del posto e il QR Code per l'ingresso.</p>
          </div>
        )}
        {event.data_inizio && (
          <div style={mc.infoBox}>
            <div style={mc.infoRow}><Calendar size={14} style={{ color:'#003DA5',flexShrink:0 }}/><span>{fmtData(event.data_inizio)}</span></div>
            {event.luogo && (
              <a href={`https://maps.google.com/?q=${encodeURIComponent(event.luogo)}`}
                target="_blank" rel="noopener noreferrer" style={{ ...mc.infoRow,textDecoration:'none',color:'inherit' }}>
                <MapPin size={14} style={{ color:'#003DA5',flexShrink:0 }}/>
                <span style={{ color:'#003DA5',textDecorationLine:'underline',textDecorationStyle:'dotted' }}>{event.luogo}</span>
              </a>
            )}
          </div>
        )}
        <div style={{ display:'flex',gap:'10px',justifyContent:'center',marginBottom:'12px',flexWrap:'wrap' }}>
          <button onClick={addToCalendar}
            style={{ display:'flex',alignItems:'center',gap:'8px',color:'#FFFFFF',backgroundColor:calAdded?'#16A34A':'#003DA5',border:'none',borderRadius:'8px',padding:'12px 18px',fontSize:'14px',fontWeight:'700',fontFamily:"'Inter',sans-serif",cursor:'pointer' }}>
            📅 {calAdded ? '✓ Aggiunto' : 'Aggiungi al calendario'}
          </button>
          {reg.codice_iscrizione && (
            <a href={`/iscrizione/${reg.codice_iscrizione}`} target="_blank" rel="noopener noreferrer"
              style={{ display:'flex',alignItems:'center',gap:'8px',color:'#003DA5',backgroundColor:'transparent',border:'1px solid #003DA5',borderRadius:'8px',padding:'12px 18px',fontSize:'14px',fontWeight:'700',fontFamily:"'Inter',sans-serif",cursor:'pointer',textDecoration:'none' }}>
              🔍 Verifica iscrizione
            </a>
          )}
          <button onClick={onClose} style={{ padding:'12px 18px',backgroundColor:'transparent',border:'1px solid #E5E7EB',borderRadius:'8px',fontSize:'14px',fontWeight:'600',fontFamily:"'Inter',sans-serif",cursor:'pointer',color:'#6B7280' }}>Chiudi</button>
        </div>
        <p style={{ fontSize:'11px',color:'#9CA3AF',lineHeight:'1.5',margin:0 }}>{event.teatro_abilitato ? 'Riceverai una email quando il tuo posto sarà assegnato.' : 'Riceverai anche una email di conferma con il QR Code.'}</p>
      </div>
      <style>{`@keyframes circ{to{stroke-dashoffset:0}}@keyframes tick{to{stroke-dashoffset:0}}@keyframes qrspin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

/* ── SEZIONI RENDERER ────────────────────────────────── */

export default function LandingPage() {
  const { slug } = useParams()
  const [event,       setEvent]       = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [notFound,    setNotFound]    = useState(false)
  const [iscrizioniN, setIscrizioniN] = useState(0)
  const [formVisible, setFormVisible] = useState(false)
  const [conferma,    setConferma]    = useState(null)

  usePageTitle(event?.titolo || null)
  useOGMeta({
    title: event?.titolo || null,
    description: event?.sottotitolo || null,
    image: event?.immagine_hero || null,
  })

  // ── Blocca zoom su mobile ──────────────────────────
  useEffect(() => {
    // Imposta viewport che blocca zoom
    let vp = document.querySelector('meta[name="viewport"]')
    if (!vp) {
      vp = document.createElement('meta')
      vp.name = 'viewport'
      document.head.appendChild(vp)
    }
    vp.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no'
    // Blocca touch zoom via CSS
    document.documentElement.style.touchAction = 'pan-x pan-y'
    document.body.style.touchAction = 'pan-x pan-y'
    return () => {
      vp.content = 'width=device-width, initial-scale=1.0'
      document.documentElement.style.touchAction = ''
      document.body.style.touchAction = ''
    }
  }, [])

  useEffect(() => {
    supabase.from('events').select('*').eq('slug', slug).eq('stato','pubblicato').single()
      .then(({ data, error }) => {
        if (error || !data) { setNotFound(true); setLoading(false); return }
        setEvent(data)
        supabase.from('registrations').select('id',{count:'exact'}).eq('event_id',data.id)
          .then(({ count }) => setIscrizioniN(count||0))
        setLoading(false)
        // Traccia visita — deduplicazione e geo gestiti server-side
        try {
          let sid = localStorage.getItem('cna_sid')
          if (!sid) { sid = crypto.randomUUID(); localStorage.setItem('cna_sid', sid) }
          fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-view`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event_id: data.id, session_id: sid })
          }).catch(() => {})
        } catch(_) {}
      })
  }, [slug])

  const { links: socialLinks } = useSocial()

  if (loading) return (
    <div style={s.center}>
      <img src="https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png"
        alt="CNA Roma" style={{ height:'56px',opacity:.4,marginBottom:'16px' }}/>
      <p style={{ color:'#9CA3AF',fontSize:'14px' }}>Caricamento…</p>
    </div>
  )
  if (notFound) return (
    <div style={s.center}>
      <img src="https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png"
        alt="CNA Roma" style={{ height:'56px',marginBottom:'24px' }}/>
      <AlertCircle size={44} style={{ color:'#D1D5DB',marginBottom:'12px' }}/>
      <p style={{ fontSize:'20px',fontWeight:'800',color:'#0A0A0A',margin:'0 0 8px' }}>Evento non trovato</p>
      <p style={{ fontSize:'14px',color:'#6B7280' }}>L'evento non esiste o non è ancora pubblico.</p>
    </div>
  )

  const esaurito = false // capienza rimossa
  const lh = event.layout_hero || {}
  const tema = temaConDefault(event?.tema)

  const heroStyle = event.immagine_hero
    ? { backgroundImage:`url(${event.immagine_hero})`,backgroundSize:'cover',backgroundPosition: lh.bg_position || 'center top' }
    : { background:'linear-gradient(135deg,#003DA5 0%,#001a50 100%)' }

  return (
    <div style={s.root}>
      <style>{`
        ${RICH_CSS}
        @keyframes heroIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .ev-hero-logo{animation:heroIn .6s ease both}
        .ev-hero-content{animation:heroIn .8s ease .2s both}
        .ev-hero-content h1{animation:heroIn .7s ease .15s both}
        .ev-hero-content h2{animation:heroIn .7s ease .3s both}
        .ev-hero-content p{animation:heroIn .7s ease .4s both}
        @media(max-width:768px){
          .ev-hero-content h1{font-size:clamp(22px,7vw,42px)!important;word-break:break-word}
          .ev-hero-content h2{font-size:clamp(14px,4vw,22px)!important}
        }
        /* Immagini nel corpo — nessun bordo, nessuna ombra, PNG trasparente */
        .rich-content img {
          max-width:100% !important;
          border:none !important;
          box-shadow:none !important;
          border-radius:0 !important;
          background:transparent !important;
          outline:none !important;
        }
        /* Blocca overflow orizzontale */
        html, body { overflow-x:hidden; max-width:100vw; }
        * { box-sizing:border-box; }
        /* Blocca zoom iOS */
        input, select, textarea { font-size:16px !important; }
        @media (max-width: 600px) {
          .hero-section { min-height: 420px !important; padding: 32px 16px !important; }
          .ev-hero-content h1 { font-size: clamp(22px,7vw,40px) !important; word-break: break-word !important; }
          .ev-hero-content h2 { font-size: clamp(14px,4.5vw,22px) !important; }
          .ev-hero-content p  { font-size: clamp(13px,3.5vw,17px) !important; }
        }
      `}</style>

{/* Header rimosso — logo sovrapposto all'hero */}

      {/* ── HERO — struttura identica alla Landing Page ── */}
      <div className="hero-section" style={{
        position: 'relative',
        minHeight: `${lh.altezza || 480}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: lh.allineamento === 'sinistra' ? 'flex-start' : 'center',
        justifyContent: 'center',
        padding: 'clamp(40px,6vw,72px) clamp(16px,4vw,48px)',
        width: '100%',
        boxSizing: 'border-box',
        ...heroStyle,
      }}>
        {/* Overlay scuro */}
        <div style={{ position:'absolute', inset:0, backgroundColor:(() => { const h=lh.overlay_colore||'#000000'; const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16); return `rgba(${r},${g},${b},${(lh.overlay_opacita||55)/100})` })(), zIndex:1 }} />

        {/* Contenuto — logo + titoli in colonna, sopra l'overlay */}
        <div className="ev-hero-content" style={{
          position: 'relative', zIndex: 2,
          maxWidth: '760px', width: '100%',
          textAlign: lh.allineamento === 'sinistra' ? 'left' : 'center',
          display: 'flex', flexDirection: 'column',
          alignItems: lh.allineamento === 'sinistra' ? 'flex-start' : 'center',
        }}>
          {/* Logo */}
          <div className="ev-hero-logo" style={{ marginBottom: 'clamp(20px,4vw,36px)' }}>
            <div style={{
              background: (lh.logo_sfondo || tema.logo_bg) === 'colore_primario' ? (tema.colore_primario || '#003DA5')
                        : (lh.logo_sfondo || tema.logo_bg) === 'bianco' ? '#FFFFFF'
                        : 'transparent',
              padding: (lh.logo_sfondo || tema.logo_bg) && (lh.logo_sfondo || tema.logo_bg) !== 'trasparente' ? '6px 14px' : 0,
              borderRadius: '8px',
              display: 'inline-flex', alignItems: 'center',
            }}>
              <img
                src={event?.logo_url || "https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png"}
                alt="CNA Roma"
                style={{ height: `${lh.logo_altezza || tema.logo_altezza || 48}px`, maxWidth: 'min(90vw, 800px)', objectFit: 'contain', display: 'block' }}
              />
            </div>
          </div>

          {/* H1 */}
          <h1 style={{
            ...s.heroTitle,
            color:         lh.titolo_colore     || '#FFFFFF',
            fontSize:      lh.titolo_dimensione || 'clamp(24px,5vw,52px)',
            fontWeight:    lh.titolo_grassetto !== false ? '900' : '400',
            textTransform: lh.titolo_maiuscolo ? 'uppercase' : 'none',
            margin:        (lh.titolo2 || event.sottotitolo) ? '0 0 12px' : '0',
            maxWidth:      '100%',
            wordBreak:     'break-word',
          }}>{event.titolo}</h1>

          {/* H2 secondo titolo */}
          {lh.titolo2 && (
            <h2 style={{
              fontSize:      lh.titolo2_dimensione || 'clamp(15px,2.5vw,22px)',
              fontWeight:    lh.titolo2_grassetto  ? '700' : '400',
              color:         lh.titolo2_colore     || 'rgba(255,255,255,0.9)',
              margin:        event.sottotitolo ? '0 0 10px' : '0',
              letterSpacing: '-.02em',
              lineHeight:    1.3,
            }}>{lh.titolo2}</h2>
          )}

          {/* Sottotitolo evento */}
          {event.sottotitolo && (
            <p style={{
              color:         'rgba(255,255,255,.92)',
              fontSize:      event.sottotitolo_size ? `${event.sottotitolo_size}px` : 'clamp(14px,2vw,20px)',
              fontWeight:    event.sottotitolo_bold ? '700' : '400',
              margin:        0,
              lineHeight:    1.5,
            }}>{event.sottotitolo}</p>
          )}
        </div>
      </div>
      {/* ── DATA E LUOGO sotto hero ── */}
      {(event.data_inizio || event.luogo) && (
        <div style={{
          backgroundColor: 'transparent',
          padding: '14px 24px',
          display: 'flex', flexWrap: 'wrap', gap: '16px',
          alignItems: 'center', justifyContent: 'center',
        }}>
          {event.data_inizio && (
            <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
              <Calendar size={15} style={{ color: tema.colore_primario || '#003DA5', flexShrink:0 }}/>
              <span style={{ fontSize:'14px', fontWeight:'700', color:'#0A0A0A', fontFamily:"'Inter',sans-serif", letterSpacing:'-.01em' }}>
                {fmtData(event.data_inizio)}
                {fmtOra(event.data_inizio) && ` · ${fmtOra(event.data_inizio)}`}
                {event.data_fine && fmtOra(event.data_fine) && ` — ${fmtOra(event.data_fine)}`}
              </span>
            </div>
          )}
          {event.luogo && (
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(event.luogo)}`}
              target="_blank" rel="noopener noreferrer"
              style={{ display:'flex', alignItems:'center', gap:'7px', textDecoration:'none' }}
            >
              <MapPin size={15} style={{ color: tema.colore_primario || '#003DA5', flexShrink:0 }}/>
              <span style={{ fontSize:'14px', fontWeight:'700', color:'#0A0A0A', fontFamily:"'Inter',sans-serif", letterSpacing:'-.01em',
                textDecorationLine:'underline', textDecorationStyle:'dotted', textDecorationColor:'#9CA3AF' }}>
                {event.luogo}
              </span>
            </a>
          )}
        </div>
      )}

      {/* ── BODY ── */}
      <div style={{ ...s.body, backgroundColor: tema.sfondo_pagina || '#FFFFFF' }}>

        {/* 3 PULSANTI AZIONE */}
        {(() => {
          const btnRadius = tema.btn_stile === 'pill' ? '50px' : `${tema.btn_raggio || 8}px`
          const aBtn = {
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
            gap:'5px', padding:'12px 8px', minHeight:'60px', cursor:'pointer',
            textDecoration:'none', textAlign:'center', lineHeight:'1.3',
            fontSize:'12px', fontWeight:'700', fontFamily:"'Inter',sans-serif",
            backgroundColor: '#FFFFFF',
            border: `1.5px solid ${tema.colore_primario || '#003DA5'}`,
            color: tema.colore_primario || '#003DA5',
            borderRadius: btnRadius,
          }
          const aBtnPrimary = {
            ...aBtn,
            backgroundColor: tema.btn_stile === 'contorno' ? 'transparent' : (tema.colore_pulsanti || tema.colore_primario || '#003DA5'),
            color: tema.btn_stile === 'contorno' ? (tema.colore_pulsanti || '#003DA5') : (tema.colore_testo_btn || '#FFFFFF'),
            border: `1.5px solid ${tema.colore_pulsanti || tema.colore_primario || '#003DA5'}`,
          }
          return (
        <div style={s.actionRow}>
          <button onClick={() => {
            const fmtIcs  = ts => ts ? new Date(ts).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'') : null
            const fmtGcal = ts => ts ? new Date(ts).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z') : null
            const isIOS   = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
            const descrizione = event.sottotitolo || ''

            if (isIOS) {
              const dtStart = fmtIcs(event.data_inizio), dtEnd = fmtIcs(event.data_fine)||dtStart
              const now = fmtIcs(new Date().toISOString())
              const ics = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//CNA Roma//IT',
                'CALSCALE:GREGORIAN','METHOD:PUBLISH','BEGIN:VEVENT',
                `UID:${event.id}@cna-eventi`,`DTSTAMP:${now}Z`,`DTSTART:${dtStart}`,`DTEND:${dtEnd}`,
                `SUMMARY:${event.titolo}`,
                event.luogo ? `LOCATION:${event.luogo.replace(/,/g,'\\,')}` : '',
                descrizione ? `DESCRIPTION:${descrizione.replace(/\n/g,'\\n')}` : '',
                'END:VEVENT','END:VCALENDAR'].filter(Boolean).join('\r\n')
              const url = URL.createObjectURL(new Blob([ics],{type:'text/calendar;charset=utf-8'}))
              window.location.href = url
              setTimeout(() => URL.revokeObjectURL(url), 3000)
            } else {
              const gcStart = fmtGcal(event.data_inizio)
              const gcEnd   = fmtGcal(event.data_fine) || gcStart
              const params  = new URLSearchParams({
                action:  'TEMPLATE',
                text:    event.titolo,
                dates:   `${gcStart}/${gcEnd}`,
                ...(descrizione ? { details: descrizione } : {}),
                ...(event.luogo ? { location: event.luogo } : {}),
              })
              window.open(`https://calendar.google.com/calendar/render?${params}`, '_blank', 'noopener')
            }
          }} style={aBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span>Aggiungi al<br/>calendario</span>
          </button>

          {event.luogo && (
            <a href={`https://maps.google.com/?q=${encodeURIComponent(event.luogo)}`}
              target="_blank" rel="noopener noreferrer" style={aBtn}>
              <MapPin size={20}/>
              <span>Mappa<br/>dell'evento</span>
            </a>
          )}

          {!esaurito && !conferma && (
            <button onClick={() => {
              setFormVisible(true)
              setTimeout(() => {
                document.getElementById('form-iscrizione')?.scrollIntoView({ behavior:'smooth', block:'start' })
              }, 50)
            }} style={aBtnPrimary}>
              <ChevronRight size={20}/>
              <span>Partecipa<br/>all'evento</span>
            </button>
          )}
        </div>
          )
        })()
        }

        {/* CONDIVISIONE — sotto i 3 pulsanti */}
        <ShareBar event={event} compact />

        {/* DESCRIZIONE (solo se non ci sono blocchi) */}
        {(event.descrizione_html || event.descrizione) && !(event.sezioni||[]).length && (
          <section style={s.section}>
            {event.descrizione_html
              ? <div className="rich-content" dangerouslySetInnerHTML={{ __html:event.descrizione_html }}/>
              : <div style={s.descText}>{(event.descrizione||'').split('\n').map((p,i)=><p key={i} style={{ margin:'0 0 12px' }}>{p}</p>)}</div>
            }
          </section>
        )}

        {/* BLOCCHI CONTENUTO */}
        {(event.sezioni||[]).length > 0 && (
          <div style={{ marginBottom:'16px' }}>
            {event.sezioni.map((block,i) => (
              <BlockRenderer key={block.id||i} block={block} cp={event.colore_primario||'#003DA5'} formTarget="#form-iscrizione"/>
            ))}
          </div>
        )}

        {/* PROGRAMMA / SESSIONI */}
        {(event.sessioni||[]).length > 0 && (() => {
          const primaryColor = tema.colore_primario || '#003DA5'
          return (
            <section style={{ ...s.section, marginBottom:'8px' }}>
              <h2 style={{ fontSize:'24px', fontWeight:'900', color:'#0A0A0A', letterSpacing:'-0.03em', margin:'0 0 24px' }}>
                Programma
              </h2>
              <div style={{ display:'flex', flexDirection:'column', gap:'0' }}>
                {event.sessioni.map((sess, idx) => (
                  <div key={sess.id||idx} style={{ display:'flex', gap:'20px', paddingBottom:'24px', position:'relative' }}>
                    {/* Timeline line */}
                    {idx < event.sessioni.length - 1 && (
                      <div style={{ position:'absolute', left:'19px', top:'40px', bottom:'0', width:'2px', backgroundColor:'#E5E7EB' }} />
                    )}
                    {/* Bullet */}
                    <div style={{ width:'40px', height:'40px', borderRadius:'50%', backgroundColor: primaryColor + '14', border:`2px solid ${primaryColor}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, zIndex:1 }}>
                      <span style={{ fontSize:'13px', fontWeight:'800', color: primaryColor }}>{idx+1}</span>
                    </div>
                    {/* Content */}
                    <div style={{ flex:1, paddingTop:'8px' }}>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', alignItems:'baseline', marginBottom:'4px' }}>
                        <h3 style={{ fontSize:'16px', fontWeight:'800', color:'#0A0A0A', letterSpacing:'-0.02em', margin:0 }}>
                          {sess.titolo || `Sessione ${idx+1}`}
                        </h3>
                        {(sess.ora_inizio || sess.data) && (
                          <span style={{ fontSize:'12px', fontWeight:'600', color: primaryColor, backgroundColor: primaryColor+'12', padding:'2px 8px', borderRadius:'20px' }}>
                            {sess.data && new Date(sess.data+'T00:00').toLocaleDateString('it-IT',{weekday:'short',day:'2-digit',month:'short'})}
                            {sess.ora_inizio && (sess.data ? ' · ' : '') + sess.ora_inizio}
                            {sess.ora_fine && `–${sess.ora_fine}`}
                          </span>
                        )}
                      </div>
                      {sess.relatore && (
                        <p style={{ fontSize:'13px', color:'#6B7280', margin:'0 0 6px', fontWeight:'500' }}>
                          🎤 {sess.relatore}
                        </p>
                      )}
                      {sess.luogo && (
                        <p style={{ fontSize:'13px', color:'#9CA3AF', margin:'0 0 6px' }}>📍 {sess.luogo}</p>
                      )}
                      {sess.descrizione && (
                        <p style={{ fontSize:'14px', color:'#374151', margin:'6px 0 0', lineHeight:'1.6' }}>{sess.descrizione}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )
        })()}

        {/* CTA / FORM */}
        {!conferma && (
          <section style={{ ...s.ctaSection, backgroundColor: tema.cta_bg || '#EEF3FF' }}>
            <div style={s.ctaRow}>
              <div style={{ flex:1 }}>
                <h2 style={s.ctaTitle}>Partecipa all'evento</h2>
                <p style={s.ctaSub}>
                  {esaurito ? 'I posti sono esauriti.' : 'Registrazione gratuita. Ricevi il QR Code per l\'ingresso.'}
                </p>
              </div>
              {!esaurito && !formVisible && (
                <button onClick={() => {
                  setFormVisible(true)
                  setTimeout(()=>document.getElementById('form-iscrizione')?.scrollIntoView({behavior:'smooth',block:'start'}),50)
                }} style={{
                  display:'flex', alignItems:'center', gap:'8px',
                  backgroundColor: tema.btn_stile === 'contorno' ? 'transparent' : (tema.colore_pulsanti || tema.colore_primario || '#003DA5'),
                  color: tema.btn_stile === 'contorno' ? (tema.colore_pulsanti || '#003DA5') : (tema.colore_testo_btn || '#FFFFFF'),
                  border: tema.btn_stile === 'contorno' ? `2px solid ${tema.colore_pulsanti || '#003DA5'}` : 'none',
                  borderRadius: tema.btn_stile === 'pill' ? '50px' : `${tema.btn_raggio || 8}px`,
                  padding:'12px 24px', fontSize:'14px', fontWeight:'700',
                  fontFamily:"'Inter',sans-serif", cursor:'pointer', whiteSpace:'nowrap', flexShrink:0,
                }}>
                  Iscriviti ora <ChevronRight size={18}/>
                </button>
              )}
            </div>
          </section>
        )}

        {formVisible && !esaurito && !conferma && (
          <div id="form-iscrizione" style={s.formWrap}>
            <h3 style={s.formTitle}>Modulo di iscrizione</h3>
          {/* Avvisi / raccomandazioni configurabili dall'admin */}
          {event?.form_note && (
            <div style={{ marginBottom:'20px', background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:'10px', padding:'14px 16px' }}>
              <p style={{ margin:'0 0 8px', fontSize:'12px', fontWeight:'700', color:'#92400E', textTransform:'uppercase', letterSpacing:'.06em' }}>⚠️ Informazioni importanti</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                {event.form_note.split('\n').map((riga, i) => riga.trim() && (
                  <div key={i} style={{ display:'flex', gap:'8px', alignItems:'flex-start' }}>
                    <span style={{ color:'#D97706', fontSize:'13px', flexShrink:0, marginTop:'1px' }}>•</span>
                    <p style={{ margin:0, fontSize:'13px', color:'#78350F', lineHeight:'1.5', fontWeight:'500' }}>{riga.trim()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <FormIscrizione event={event} onSuccess={dati => {
              setFormVisible(false)
              setConferma(dati)
            }}/>
          </div>
        )}

        {/* MAPPA */}
        {event.luogo && (
          <div style={s.mapSection}>
            <h2 style={s.secTitle}>Come raggiungerci</h2>
            <div style={s.mapWrap}>
              <iframe
                title="Mappa evento"
                width="100%" height="100%"
                style={{ border:0,display:'block' }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(event.luogo)}&output=embed&z=15&hl=it&t=m`}
              />
            </div>
            <a href={`https://maps.google.com/?q=${encodeURIComponent(event.luogo)}`}
              target="_blank" rel="noopener noreferrer" style={s.mapLink}>
              <MapPin size={14}/> Apri in Google Maps
            </a>
          </div>
        )}

      </div>

      {/* ── Barra condivisione ── */}
      <ShareBar event={event} />

      <footer style={{ ...s.footer, background: tema.sfondo_footer || 'linear-gradient(160deg, #003DA5 0%, #001F5C 100%)', borderTop: 'none', color: tema.testo_footer || '#ffffff' }}>
        <img
          src={event?.logo_url || "https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png"}
          alt="CNA Roma"
          style={{ height: `clamp(32px, ${Math.round((tema.logo_altezza || 44) * 0.08)}vw, ${Math.round((tema.logo_altezza || 44) * 0.7)}px)`, maxWidth: '200px', objectFit: 'contain', display: 'block', margin: '0 auto 10px' }}
        />
        {(event.footer_modalita || 'semplice') === 'ricco' && event.footer_html
          ? <div className="rich-content" style={{ textAlign:'center', fontSize:'13px', color: tema.testo_footer || '#ffffff' }} dangerouslySetInnerHTML={{ __html: event.footer_html }} />
          : <div style={{ textAlign:'center', fontFamily:"'Inter',sans-serif", color: tema.testo_footer || '#ffffff', fontSize:'13px', lineHeight:'1.7' }}>
              <p style={{ margin:'0 0 12px', fontWeight:'700', fontSize:'14px' }}>👉 Insieme è meglio 👈</p>
              <p style={{ margin:0 }}>
                <strong style={{ fontWeight:'700', display:'block' }}>CNA di Roma</strong>
                Via Cristoforo Colombo, 283/A, 00147 Roma<br/>
                Tel. 06570151 • Email info@cnaroma.it
              </p>
            </div>
        }
        <SocialLinks links={socialLinks} size={20} gap={14} color={tema.testo_footer || '#9CA3AF'} style={{ marginTop:'14px', justifyContent:'center' }} />
      </footer>

      {conferma && (
        <ModalConferma reg={conferma} event={event} onClose={() => setConferma(null)}/>
      )}
    </div>
  )
}

/* ── STILI ─────────────────────────────────────────────── */
const s = {
  root:    { minHeight:'100vh', backgroundColor:'#FFFFFF', fontFamily:"'Inter',sans-serif", overflowX:'hidden', width:'100%' },
  center:  { minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', backgroundColor:'#F4F5F7', padding:'24px' },
  // Header
  // header: stile generato inline in base al tema dell'evento
  logo:        { height:'56px', maxHeight:'56px', objectFit:'contain', display:'block' },
  // Hero
  hero:        { display:'flex', alignItems:'flex-end', position:'relative', width:'100%' },
  heroOverlay: { width:'100%', padding:'clamp(24px,5vw,48px) 20px clamp(20px,4vw,36px)', transition:'background-color .3s', position:'relative' },
  heroContent: { maxWidth:'820px', margin:'0 auto' },
  heroTag:     { display:'inline-flex', alignItems:'center', gap:'6px', backgroundColor:'rgba(255,255,255,.18)', color:'#FFFFFF', padding:'4px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:'600', marginBottom:'12px', backdropFilter:'blur(6px)' },
  heroTitle:   { fontWeight:'900', color:'#FFFFFF', letterSpacing:'-.04em', margin:'0 0 10px', lineHeight:'1.05' },
  heroMeta:    { display:'flex', alignItems:'center', gap:'8px', fontSize:'14px', color:'rgba(255,255,255,.9)', margin:'0 0 8px', fontWeight:'500', flexWrap:'wrap', textTransform:'capitalize' },
  heroLoc:     { display:'inline-flex', alignItems:'center', gap:'6px', color:'rgba(255,255,255,.8)', fontSize:'13px', textDecoration:'none', fontWeight:'500' },
  // Body
  body:        { maxWidth:'820px', margin:'0 auto', padding:'32px 24px 0', width:'100%' },
  section:     { marginBottom:'32px' },
  secTitle:    { fontSize:'20px', fontWeight:'900', color:'#0A0A0A', letterSpacing:'-.03em', margin:'0 0 16px' },
  descText:    { fontSize:'15px', color:'#374151', lineHeight:'1.75' },
  // 3 pulsanti
  actionRow:       { display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'8px', marginBottom:'28px', padding:'4px 0' },
  // actionBtn / actionBtnPrimary: stili generati inline in base al tema
  // CTA box
  ctaSection:  { backgroundColor:'#EEF3FF', border:'1px solid #C7D9F8', borderRadius:'12px', padding:'24px', marginBottom:'24px' },
  ctaRow:      { display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px', flexWrap:'wrap' },
  ctaTitle:    { fontSize:'18px', fontWeight:'900', color:'#0A0A0A', letterSpacing:'-.02em', margin:'0 0 4px' },
  ctaSub:      { fontSize:'13px', color:'#4B5563', margin:0, lineHeight:'1.5' },
  // ctaBtn: stile generato inline
  formWrap:    { backgroundColor:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:'12px', padding:'24px', marginBottom:'32px' },
  formTitle:   { fontSize:'18px', fontWeight:'800', color:'#0A0A0A', letterSpacing:'-.02em', margin:'0 0 20px' },
  // Mappa
  mapSection:  { marginTop:'32px', paddingBottom:'8px' },
  mapWrap:     { height:'320px', borderRadius:'12px', overflow:'hidden', border:'1px solid #E5E7EB', marginBottom:'10px' },
  mapLink:     { display:'inline-flex', alignItems:'center', gap:'6px', fontSize:'13px', color:'#003DA5', fontWeight:'600', textDecoration:'none' },
  // Footer
  footer:      { borderTop:'1px solid #E5E7EB', padding:'20px 24px', textAlign:'center', fontSize:'12px', color:'#9CA3AF', marginTop:'40px' },
}

const mc = {
  overlay:  { position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'16px', overflowY:'auto' },
  box:      { backgroundColor:'#FFFFFF', borderRadius:'20px', padding:'28px 24px', maxWidth:'400px', width:'100%', boxShadow:'0 24px 80px rgba(0,0,0,.2)', textAlign:'center' },
  iconWrap: { margin:'0 auto 14px', width:'64px', height:'64px' },
  title:    { fontSize:'20px', fontWeight:'900', color:'#0A0A0A', letterSpacing:'-.03em', margin:'0 0 6px' },
  sub:      { fontSize:'13px', color:'#6B7280', lineHeight:'1.6', margin:'0 0 16px' },
  qrBox:    { backgroundColor:'#F4F5F7', borderRadius:'12px', padding:'16px', marginBottom:'14px', display:'flex', flexDirection:'column', alignItems:'center', gap:'8px' },
  qrLabel:  { fontSize:'11px', fontWeight:'700', color:'#6B7280', textTransform:'uppercase', letterSpacing:'.07em', margin:0 },
  qrImg:    { width:'180px', height:'180px', imageRendering:'pixelated', border:'none', background:'transparent' },
  qrCode:   { fontSize:'11px', fontFamily:'monospace', color:'#003DA5', fontWeight:'700', letterSpacing:'.04em', backgroundColor:'#EEF3FF', padding:'3px 8px', borderRadius:'4px', margin:0 },
  dlBtn:    { background:'none', border:'1px solid #003DA5', color:'#003DA5', borderRadius:'6px', padding:'6px 14px', fontSize:'12px', fontWeight:'700', fontFamily:"'Inter',sans-serif", cursor:'pointer' },
  infoBox:  { backgroundColor:'#EEF3FF', borderRadius:'8px', padding:'10px 14px', marginBottom:'16px', display:'flex', flexDirection:'column', gap:'6px', textAlign:'left' },
  infoRow:  { display:'flex', alignItems:'center', gap:'8px', fontSize:'12px', color:'#374151', fontWeight:'500' },
}
