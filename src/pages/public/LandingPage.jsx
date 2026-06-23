import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { temaConDefault } from '../../components/editor/AspettoTab'
import { MapPin, Calendar, ChevronRight, AlertCircle } from 'lucide-react'
import { RICH_CSS } from '../../components/editor/RichEditor'
import FormIscrizione from './FormIscrizione'

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
    const fmt = ts => ts ? new Date(ts).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'') : null
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
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([ics],{type:'text/calendar;charset=utf-8'})),
      download:`${event.slug}.ics`
    })
    a.click(); URL.revokeObjectURL(a.href); setCalAdded(true)
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
        <p style={mc.sub}>Benvenuto/a <strong>{reg.nome} {reg.cognome}</strong>. Salva il QR Code — ti servirà all'ingresso.</p>

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

        <div style={mc.qrBox}>
          <p style={mc.qrLabel}>Il tuo QR Code personale</p>
          {qrDataUrl ? (
            <>
              <img src={qrDataUrl} alt="QR" style={mc.qrImg}/>
              <p style={{ fontSize:'12px',color:'#6B7280',margin:0 }}>📸 Fai uno screenshot o scarica</p>
              <code style={mc.qrCode}>{reg.qr_code}</code>
              <button onClick={downloadQR} style={mc.dlBtn}>⬇ Scarica QR Code</button>
            </>
          ) : (
            <div style={{ display:'flex',alignItems:'center',gap:'10px',padding:'20px 0' }}>
              <div style={{ width:'28px',height:'28px',border:'3px solid #E5E7EB',borderTopColor:'#003DA5',borderRadius:'50%',animation:'qrspin .8s linear infinite' }}/>
              <span style={{ fontSize:'13px',color:'#6B7280' }}>Generazione QR…</span>
            </div>
          )}
        </div>
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
          <button onClick={onClose} style={{ padding:'12px 18px',backgroundColor:'transparent',border:'1px solid #E5E7EB',borderRadius:'8px',fontSize:'14px',fontWeight:'600',fontFamily:"'Inter',sans-serif",cursor:'pointer',color:'#6B7280' }}>Chiudi</button>
        </div>
        <p style={{ fontSize:'11px',color:'#9CA3AF',lineHeight:'1.5',margin:0 }}>Riceverai anche una email di conferma con il QR Code.</p>
      </div>
      <style>{`@keyframes circ{to{stroke-dashoffset:0}}@keyframes tick{to{stroke-dashoffset:0}}@keyframes qrspin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

/* ── SEZIONI RENDERER ────────────────────────────────── */
function BlockRenderer({ block, colore_primario }) {
  if (!block) return null

  if (block.tipo === 'testo') return (
    <div className="rich-content" style={{ marginBottom:'16px' }}
      dangerouslySetInnerHTML={{ __html: block.html || '' }}/>
  )

  if (block.tipo === 'stats') return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:'32px', justifyContent:'center', padding:'32px 0', marginBottom:'16px' }}>
      {(block.items || []).map((item, i) => (
        <div key={i} style={{ textAlign:'center', flex:'1 1 100px' }}>
          <p style={{ fontSize:'clamp(36px,6vw,52px)', fontWeight:'900', color:block.colore||colore_primario||'#003DA5', letterSpacing:'-.04em', margin:'0 0 4px', lineHeight:1 }}>
            {item.num || item.numero}
          </p>
          <p style={{ fontSize:'13px', color:'#6B7280', fontWeight:'700', margin:0, textTransform:'uppercase', letterSpacing:'.05em' }}>
            {item.label}
          </p>
        </div>
      ))}
    </div>
  )

  if (block.tipo === 'griglia') {
    const cols = block.cols || block.colonne || []
    return (
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(cols.length,3)},1fr)`, gap:'16px', marginBottom:'16px' }}>
        {cols.map((col, i) => (
          <div key={i} style={{ backgroundColor:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:'10px', padding:'20px' }}>
            {col.icona && <div style={{ fontSize:'26px', marginBottom:'10px' }}>{col.icona}</div>}
            {col.titolo && <h3 style={{ fontSize:'16px', fontWeight:'800', color:'#0A0A0A', margin:'0 0 8px', letterSpacing:'-.02em' }}>{col.titolo}</h3>}
            {col.testo && <p style={{ fontSize:'14px', color:'#6B7280', lineHeight:'1.6', margin:0 }}>{col.testo}</p>}
          </div>
        ))}
      </div>
    )
  }

  if (block.tipo === 'cta') return (
    <div style={{ backgroundColor:'#EEF3FF', border:'1px solid #C7D9F8', borderRadius:'12px', padding:'28px 24px', textAlign:'center', marginBottom:'16px' }}>
      {block.titolo && <h2 style={{ fontSize:'clamp(18px,3vw,26px)', fontWeight:'900', color:'#0A0A0A', letterSpacing:'-.03em', margin:'0 0 16px' }}>{block.titolo}</h2>}
      <a href="#form-iscrizione"
        style={{ display:'inline-block', backgroundColor:block.colore||'#003DA5', color:'#FFF', borderRadius:'8px', padding:'13px 32px', fontSize:'15px', fontWeight:'800', textDecoration:'none' }}>
        {block.testo_btn || block.testo || 'Iscriviti ora →'}
      </a>
    </div>
  )

  if (block.tipo === 'immagine') {
    const maxW   = block.size==='small'?'33%':block.size==='medium'?'60%':'100%'
    const align  = block.align || 'center'
    const margin = align==='center'?'0 auto':align==='right'?'0 0 0 auto':'0 auto 0 0'
    return (
      <div style={{ marginBottom:'16px', textAlign: align }}>
        {block.src && <img src={block.src} alt={block.didascalia||''}
          style={{ maxWidth: maxW, width:'100%', display:'inline-block', margin: align==='center'?'0 auto':'0' }}/>}
        {block.didascalia && <p style={{ fontSize:'13px', color:'#9CA3AF', marginTop:'8px', fontStyle:'italic' }}>{block.didascalia}</p>}
      </div>
    )
  }

  if (block.tipo === 'separatore') return (
    <hr style={{ border:'none', borderTop:'2px solid #E5E7EB', margin:'24px 0' }}/>
  )

  // Retrocompatibilità vecchie sezioni
  if (block.tipo === 'stats' || block.colore_numeri) return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:'24px', justifyContent:'center', padding:'24px 0' }}>
      {(block.items||[]).map((item,i) => (
        <div key={i} style={{ textAlign:'center' }}>
          <p style={{ fontSize:'clamp(32px,5vw,48px)', fontWeight:'900', color:block.colore_numeri||'#003DA5', margin:'0 0 4px' }}>{item.numero}</p>
          <p style={{ fontSize:'12px', color:'#6B7280', fontWeight:'700', margin:0, textTransform:'uppercase' }}>{item.label}</p>
        </div>
      ))}
    </div>
  )

  return null
}

/* ── LANDING PAGE ────────────────────────────────────── */
export default function LandingPage() {
  const { slug } = useParams()
  const [event,       setEvent]       = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [notFound,    setNotFound]    = useState(false)
  const [iscrizioniN, setIscrizioniN] = useState(0)
  const [formVisible, setFormVisible] = useState(false)
  const [conferma,    setConferma]    = useState(null)

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
      })
  }, [slug])

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
    ? { backgroundImage:`url(${event.immagine_hero})`,backgroundSize:'cover',backgroundPosition:'center top' }
    : { background:'linear-gradient(135deg,#003DA5 0%,#001a50 100%)' }

  return (
    <div style={s.root}>
      <style>{`
        ${RICH_CSS}
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
          .hero-section { min-height: calc(100vw * 0.62) !important; }
          .hero-section .grid-cols-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{
        backgroundColor: tema.sfondo_header || '#FFFFFF',
        borderBottom: `${tema.spessore_bordo || 3}px solid ${tema.bordo_header || '#003DA5'}`,
        position:'sticky', top:0, zIndex:50, width:'100%',
        height:'80px', display:'flex', alignItems:'center',
        justifyContent:'center', padding:'0 24px',
      }}>
        {/* Logo con sfondo opzionale */}
        <div style={{
          background: tema.logo_bg === 'colore_primario' ? (tema.colore_primario || '#003DA5')
                    : tema.logo_bg === 'bianco' ? '#FFFFFF'
                    : 'transparent',
          padding: tema.logo_bg && tema.logo_bg !== 'trasparente' ? '4px 10px' : 0,
          borderRadius: '6px',
          display: 'flex', alignItems: 'center',
        }}>
          <img src={event?.logo_url || "https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png"}
            alt="CNA Roma"
            style={{ height: `${tema.logo_altezza || 44}px`, maxWidth:'200px', objectFit:'contain', display:'block' }}/>
        </div>
      </header>

      {/* ── HERO ── */}
      <div className="hero-section" style={{ ...s.hero, ...heroStyle, minHeight:`min(${lh.altezza||340}px, 56vw)` }}>
        <div style={{ ...s.heroOverlay, backgroundColor:`rgba(0,0,0,${(lh.overlay_opacita||55)/100})` }}>
          <div style={{ ...s.heroContent, textAlign:lh.allineamento==='centro'?'center':'left' }}>
            <span style={s.heroTag}><Calendar size={13}/> Evento CNA Roma</span>
            <h1 style={{
              ...s.heroTitle,
              color:       lh.titolo_colore      || '#FFFFFF',
              fontSize:    lh.titolo_dimensione  || 'clamp(22px,5vw,48px)',
              fontWeight:  lh.titolo_grassetto !== false ? '900' : '400',
              textTransform: lh.titolo_maiuscolo ? 'uppercase' : 'none',
            }}>{event.titolo}</h1>
            {event.data_inizio && (
              <p style={s.heroMeta}>
                <Calendar size={14}/>
                {fmtData(event.data_inizio)}
                {fmtOra(event.data_inizio) && ` · ${fmtOra(event.data_inizio)}`}
                {event.data_fine && fmtOra(event.data_fine) && ` — ${fmtOra(event.data_fine)}`}
              </p>
            )}
            {event.luogo && (
              <a href={`https://maps.google.com/?q=${encodeURIComponent(event.luogo)}`}
                target="_blank" rel="noopener noreferrer" style={s.heroLoc}>
                <MapPin size={14}/> {event.luogo}
              </a>
            )}
          </div>
        </div>
      </div>

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
            const fmt = ts => ts ? new Date(ts).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'') : null
            const dtStart = fmt(event.data_inizio), dtEnd = fmt(event.data_fine)||dtStart
            const now = fmt(new Date().toISOString())
            const ics = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//CNA Roma//IT',
              'CALSCALE:GREGORIAN','METHOD:PUBLISH','BEGIN:VEVENT',
              `UID:${event.id}@cna-eventi`,`DTSTAMP:${now}Z`,`DTSTART:${dtStart}`,`DTEND:${dtEnd}`,
              `SUMMARY:${event.titolo}`,`LOCATION:${(event.luogo||'').replace(/,/g,'\\,')}`,
              'END:VEVENT','END:VCALENDAR'].join('\r\n')
            Object.assign(document.createElement('a'),{
              href:URL.createObjectURL(new Blob([ics],{type:'text/calendar;charset=utf-8'})),
              download:`${event.slug}.ics`
            }).click()
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
              <BlockRenderer key={block.id||i} block={block} colore_primario={event.colore_primario}/>
            ))}
          </div>
        )}

        {/* CTA / FORM */}
        {!conferma && (
          <section style={{ ...s.ctaSection, backgroundColor: tema.cta_bg || '#EEF3FF' }}>
            <div style={s.ctaRow}>
              <div>
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

      <footer style={s.footer}>
        © {new Date().getFullYear()} CNA Roma — Confederazione Nazionale dell'Artigianato e della PMI
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
  heroOverlay: { width:'100%', padding:'clamp(24px,5vw,48px) 20px clamp(20px,4vw,36px)', transition:'background-color .3s' },
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
