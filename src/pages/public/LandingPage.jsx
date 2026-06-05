import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { MapPin, Calendar, Clock, Users, ChevronRight, AlertCircle } from 'lucide-react'

function formatDataCompleta(ts) {
  if (!ts) return null
  return new Date(ts).toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
}
function formatOra(ts) {
  if (!ts) return null
  return new Date(ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

export default function LandingPage() {
  const { slug } = useParams()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [iscrizioni, setIscrizioni] = useState({ total: 0, presenti: 0 })
  const [formVisible, setFormVisible] = useState(false)

  useEffect(() => {
    supabase
      .from('events')
      .select('*')
      .eq('slug', slug)
      .eq('stato', 'pubblicato')
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setNotFound(true); setLoading(false); return }
        setEvent(data)
        supabase.from('registrations').select('event_id, presente', { count: 'exact' })
          .eq('event_id', data.id)
          .then(({ count, data: regs }) => {
            setIscrizioni({ total: count || 0, presenti: (regs||[]).filter(r=>r.presente).length })
          })
        setLoading(false)
      })
  }, [slug])

  if (loading) return (
    <div style={s.loadPage}>
      <img src="https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png"
        alt="CNA Roma" style={{ height:'48px', opacity:0.5, marginBottom:'16px' }}/>
      <p style={{ color:'#9CA3AF', fontSize:'14px', fontWeight:'500' }}>Caricamento evento…</p>
    </div>
  )

  if (notFound) return (
    <div style={s.loadPage}>
      <img src="https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png"
        alt="CNA Roma" style={{ height:'48px', marginBottom:'24px' }}/>
      <AlertCircle size={40} style={{ color:'#D1D5DB', marginBottom:'12px' }}/>
      <p style={{ fontSize:'20px', fontWeight:'700', color:'#0A0A0A', margin:'0 0 8px' }}>Evento non trovato</p>
      <p style={{ fontSize:'14px', color:'#6B7280', margin:'0 0 24px' }}>
        L'evento che cerchi non esiste o non è ancora pubblico.
      </p>
    </div>
  )

  const capienza = event.capienza_max
  const posti = capienza ? Math.max(0, capienza - iscrizioni.total) : null
  const esaurito = capienza && iscrizioni.total >= capienza

  return (
    <div style={s.root}>
      {/* HEADER */}
      <header style={s.header}>
        <div style={s.headerInner}>
          <img src="https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png"
            alt="CNA Roma" style={s.logo}/>
        </div>
      </header>

      {/* HERO IMAGE placeholder con gradiente CNA */}
      <div style={s.hero}>
        <div style={s.heroOverlay}>
          <div style={s.heroContent}>
            <div style={s.heroTag}>
              <Calendar size={14}/> Evento CNA Roma
            </div>
            <h1 style={s.heroTitle}>{event.titolo}</h1>
            {event.data_inizio && (
              <p style={s.heroDate}>
                {formatDataCompleta(event.data_inizio)}
                {formatOra(event.data_inizio) && ` · ore ${formatOra(event.data_inizio)}`}
                {event.data_fine && formatOra(event.data_fine) && ` — ${formatOra(event.data_fine)}`}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div style={s.body}>
        <div style={s.main}>

          {/* INFO CARDS */}
          <div style={s.infoGrid}>
            {event.data_inizio && (
              <div style={s.infoCard}>
                <Calendar size={20} style={{ color:'#003DA5', flexShrink:0 }}/>
                <div>
                  <p style={s.infoLabel}>Data</p>
                  <p style={s.infoVal}>{formatDataCompleta(event.data_inizio)}</p>
                </div>
              </div>
            )}
            {(event.data_inizio || event.data_fine) && (
              <div style={s.infoCard}>
                <Clock size={20} style={{ color:'#003DA5', flexShrink:0 }}/>
                <div>
                  <p style={s.infoLabel}>Orario</p>
                  <p style={s.infoVal}>
                    {formatOra(event.data_inizio) || '—'}
                    {event.data_fine && formatOra(event.data_fine) && ` — ${formatOra(event.data_fine)}`}
                  </p>
                </div>
              </div>
            )}
            {event.luogo && (
              <div style={s.infoCard}>
                <MapPin size={20} style={{ color:'#003DA5', flexShrink:0 }}/>
                <div>
                  <p style={s.infoLabel}>Luogo</p>
                  <p style={s.infoVal}>{event.luogo}</p>
                </div>
              </div>
            )}
            {capienza && (
              <div style={s.infoCard}>
                <Users size={20} style={{ color: esaurito ? '#DC2626' : '#003DA5', flexShrink:0 }}/>
                <div>
                  <p style={s.infoLabel}>Posti disponibili</p>
                  <p style={{ ...s.infoVal, color: esaurito ? '#DC2626' : posti && posti < 20 ? '#D97706' : '#0A0A0A' }}>
                    {esaurito ? 'Esaurito' : `${posti} posti rimasti`}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* DESCRIZIONE */}
          {event.descrizione && (
            <section style={s.section}>
              <h2 style={s.sectionTitle}>Informazioni sull'evento</h2>
              <div style={s.descText}>
                {event.descrizione.split('\n').map((p, i) => (
                  <p key={i} style={{ margin:'0 0 12px' }}>{p}</p>
                ))}
              </div>
            </section>
          )}

          {/* CTA ISCRIZIONE */}
          <section style={{ ...s.section, ...s.ctaSection }}>
            <div style={s.ctaBox}>
              <div>
                <h2 style={s.ctaTitle}>Partecipa all'evento</h2>
                <p style={s.ctaSub}>
                  {esaurito
                    ? 'I posti disponibili sono esauriti. Contattaci per ulteriori informazioni.'
                    : 'Registrati gratuitamente. Riceverai una email di conferma con il tuo QR Code personale.'}
                </p>
              </div>
              {!esaurito && (
                <button onClick={() => setFormVisible(true)} style={s.ctaBtn}>
                  Iscriviti ora <ChevronRight size={18}/>
                </button>
              )}
            </div>

            {/* Form placeholder — verrà completato nella Fase 6 */}
            {formVisible && !esaurito && (
              <div style={s.formPlaceholder}>
                <p style={{ fontSize:'14px', color:'#6B7280', textAlign:'center', margin:0 }}>
                  Il form di registrazione sarà disponibile nella prossima fase di sviluppo.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* SIDEBAR */}
        <aside style={s.sidebar}>
          <div style={s.sideCard}>
            <p style={s.sideLabel}>Organizzato da</p>
            <img src="https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png"
              alt="CNA Roma" style={{ height:'36px', objectFit:'contain' }}/>
            <p style={{ fontSize:'13px', color:'#6B7280', margin:'8px 0 0', lineHeight:'1.5' }}>
              CNA Roma — Confederazione Nazionale dell'Artigianato e della Piccola e Media Impresa
            </p>
          </div>

          {capienza && (
            <div style={s.sideCard}>
              <p style={s.sideLabel}>Capienza evento</p>
              <div style={s.progressWrap}>
                <div style={{ ...s.progressBar, width: `${Math.min(100, (iscrizioni.total/capienza)*100)}%`,
                  backgroundColor: esaurito ? '#DC2626' : iscrizioni.total/capienza > 0.8 ? '#D97706' : '#003DA5' }}/>
              </div>
              <p style={{ fontSize:'13px', color:'#6B7280', margin:'6px 0 0' }}>
                {iscrizioni.total} / {capienza} iscritti
              </p>
            </div>
          )}

          {event.luogo && (
            <div style={s.sideCard}>
              <p style={s.sideLabel}>Dove si svolge</p>
              <p style={{ fontSize:'14px', color:'#0A0A0A', margin:0, lineHeight:'1.5', fontWeight:'500' }}>
                {event.luogo}
              </p>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(event.luogo)}`}
                target="_blank" rel="noopener noreferrer"
                style={{ display:'inline-flex', alignItems:'center', gap:'4px', marginTop:'8px',
                  fontSize:'13px', color:'#003DA5', fontWeight:'600', textDecoration:'none' }}>
                <MapPin size={13}/> Vedi su Google Maps
              </a>
            </div>
          )}
        </aside>
      </div>

      {/* FOOTER */}
      <footer style={s.footer}>
        <p>© {new Date().getFullYear()} CNA Roma — Tutti i diritti riservati</p>
      </footer>
    </div>
  )
}

const s = {
  root: { minHeight:'100vh', backgroundColor:'#FFFFFF', fontFamily:"'Inter',sans-serif" },
  loadPage: { minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', backgroundColor:'#F4F5F7' },

  // Header
  header: { backgroundColor:'#FFFFFF', borderBottom:'2px solid #003DA5', position:'sticky', top:0, zIndex:50 },
  headerInner: { maxWidth:'1100px', margin:'0 auto', padding:'0 24px', height:'72px', display:'flex', alignItems:'center', justifyContent:'center' },
  logo: { height:'48px', objectFit:'contain' },

  // Hero
  hero: { background:'linear-gradient(135deg, #003DA5 0%, #001f5e 100%)', minHeight:'320px', display:'flex', alignItems:'flex-end' },
  heroOverlay: { width:'100%', padding:'48px 24px 40px', background:'linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 100%)' },
  heroContent: { maxWidth:'800px', margin:'0 auto' },
  heroTag: { display:'inline-flex', alignItems:'center', gap:'6px', backgroundColor:'rgba(255,255,255,0.15)', color:'#FFFFFF', padding:'4px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:'600', marginBottom:'14px', backdropFilter:'blur(4px)' },
  heroTitle: { fontSize:'clamp(28px,5vw,52px)', fontWeight:'900', color:'#FFFFFF', letterSpacing:'-0.04em', margin:'0 0 12px', lineHeight:'1.1' },
  heroDate: { fontSize:'16px', color:'rgba(255,255,255,0.85)', margin:0, fontWeight:'500', textTransform:'capitalize' },

  // Body layout
  body: { maxWidth:'1100px', margin:'0 auto', padding:'40px 24px', display:'grid', gridTemplateColumns:'1fr 300px', gap:'32px', alignItems:'start' },
  main: { display:'flex', flexDirection:'column', gap:'32px' },

  // Info cards
  infoGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:'12px' },
  infoCard: { backgroundColor:'#F4F5F7', borderRadius:'8px', padding:'16px', display:'flex', gap:'12px', alignItems:'flex-start' },
  infoLabel: { fontSize:'11px', fontWeight:'600', color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 3px' },
  infoVal: { fontSize:'14px', fontWeight:'600', color:'#0A0A0A', margin:0, lineHeight:'1.4' },

  // Section
  section: { borderTop:'1px solid #E5E7EB', paddingTop:'28px' },
  sectionTitle: { fontSize:'22px', fontWeight:'900', color:'#0A0A0A', letterSpacing:'-0.03em', margin:'0 0 16px' },
  descText: { fontSize:'15px', color:'#374151', lineHeight:'1.7' },

  // CTA
  ctaSection: { backgroundColor:'#F4F5F7', padding:'28px', borderRadius:'8px', border:'none', display:'flex', flexDirection:'column', gap:'16px' },
  ctaBox: { display:'flex', alignItems:'center', justifyContent:'space-between', gap:'20px', flexWrap:'wrap' },
  ctaTitle: { fontSize:'20px', fontWeight:'900', color:'#0A0A0A', letterSpacing:'-0.02em', margin:'0 0 6px' },
  ctaSub: { fontSize:'14px', color:'#6B7280', margin:0, lineHeight:'1.5', maxWidth:'480px' },
  ctaBtn: { display:'flex', alignItems:'center', gap:'8px', backgroundColor:'#003DA5', color:'#FFFFFF', border:'none', borderRadius:'4px', padding:'14px 28px', fontSize:'15px', fontWeight:'700', fontFamily:"'Inter',sans-serif", cursor:'pointer', whiteSpace:'nowrap', letterSpacing:'-0.01em' },
  formPlaceholder: { backgroundColor:'#FFFFFF', border:'1px dashed #D1D5DB', borderRadius:'6px', padding:'32px' },

  // Sidebar
  sidebar: { display:'flex', flexDirection:'column', gap:'16px', position:'sticky', top:'88px' },
  sideCard: { backgroundColor:'#F4F5F7', borderRadius:'8px', padding:'20px', display:'flex', flexDirection:'column', gap:'8px' },
  sideLabel: { fontSize:'11px', fontWeight:'600', color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.06em', margin:0 },
  progressWrap: { height:'6px', backgroundColor:'#E5E7EB', borderRadius:'3px', overflow:'hidden' },
  progressBar: { height:'100%', borderRadius:'3px', transition:'width 0.3s' },

  // Footer
  footer: { borderTop:'1px solid #E5E7EB', padding:'24px', textAlign:'center', fontSize:'13px', color:'#9CA3AF' },
}
