import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'

const LOGO = 'https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png'
const BLU = '#003DA5'
const NERO = '#0A0A0A'

const MESI_IT = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre']
const MESI_SHORT = ['GEN','FEB','MAR','APR','MAG','GIU','LUG','AGO','SET','OTT','NOV','DIC']

function formatData(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${String(d.getDate()).padStart(2,'0')} ${MESI_IT[d.getMonth()]} ${d.getFullYear()}`
}
function formatOra(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})
}
function isPast(ts) { return ts && new Date(ts) < new Date() }

export default function CalendarioPage() {
  const [tutti, setTutti] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('prossimi') // 'prossimi' | 'passati'
  const [search, setSearch] = useState('')
  const [featured, setFeatured] = useState(null)
  const heroRef = useRef(null)

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase
        .from('events')
        .select('id,titolo,sottotitolo,slug,data_inizio,data_fine,luogo,immagine_hero,capienza_max,stato,colore_primario')
        .eq('stato', 'pubblicato')
        .order('data_inizio', { ascending: false })
      const evs = data || []
      setTutti(evs)
      // Featured = prossimo evento futuro
      const pross = evs.filter(e => !isPast(e.data_inizio))
      if (pross.length) setFeatured(pross[pross.length - 1]) // il più vicino
      setLoading(false)
    })()
  }, [])

  const filtered = tutti.filter(e => {
    const past = isPast(e.data_inizio)
    if (tab === 'prossimi' && past) return false
    if (tab === 'passati' && !past) return false
    if (search) {
      const q = search.toLowerCase()
      return e.titolo?.toLowerCase().includes(q) || e.luogo?.toLowerCase().includes(q)
    }
    return true
  })

  const prossimi = tutti.filter(e => !isPast(e.data_inizio))
  const passati = tutti.filter(e => isPast(e.data_inizio))

  return (
    <div style={{ fontFamily:"'Inter',sans-serif", backgroundColor:'#ffffff', minHeight:'100vh', color:NERO }}>

      {/* ─── NAVBAR ─── */}
      <nav style={{ position:'sticky', top:0, zIndex:100, backgroundColor:'rgba(255,255,255,0.95)',
        backdropFilter:'blur(12px)', borderBottom:'1px solid #E5E7EB', padding:'0 32px', height:'64px',
        display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <img src={LOGO} alt="CNA Roma" style={{ height:'36px', objectFit:'contain' }}/>
        <div style={{ display:'flex', gap:'8px' }}>
          <a href="#eventi" style={{ fontSize:'13px', fontWeight:'600', color:'#6B7280',
            textDecoration:'none', padding:'8px 16px', borderRadius:'6px', transition:'all 0.15s' }}
            onMouseEnter={e=>e.target.style.color=NERO} onMouseLeave={e=>e.target.style.color='#6B7280'}>
            Tutti gli eventi
          </a>
          <a href="https://www.cna.it" target="_blank" rel="noopener noreferrer"
            style={{ fontSize:'13px', fontWeight:'700', color:'#ffffff', backgroundColor:BLU,
              textDecoration:'none', padding:'8px 18px', borderRadius:'6px' }}>
            cna.it ↗
          </a>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section ref={heroRef} style={{ position:'relative', backgroundColor:NERO, overflow:'hidden', minHeight:'520px',
        display:'flex', alignItems:'center' }}>
        {/* Sfondo con immagine featured sfocata */}
        {featured?.immagine_hero && (
          <div style={{ position:'absolute', inset:0, backgroundImage:`url(${featured.immagine_hero})`,
            backgroundSize:'cover', backgroundPosition:'center', filter:'blur(2px) brightness(0.25)',
            transform:'scale(1.05)' }}/>
        )}
        {/* Overlay gradiente */}
        <div style={{ position:'absolute', inset:0,
          background:'linear-gradient(135deg, rgba(0,61,165,0.85) 0%, rgba(10,10,10,0.95) 100%)' }}/>

        {/* Griglia decorativa */}
        <div style={{ position:'absolute', inset:0, opacity:0.06,
          backgroundImage:'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize:'60px 60px' }}/>

        <div style={{ position:'relative', zIndex:1, maxWidth:'1100px', margin:'0 auto', padding:'80px 32px', width:'100%' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', backgroundColor:'rgba(255,255,255,0.12)',
            border:'1px solid rgba(255,255,255,0.2)', borderRadius:'999px', padding:'6px 16px', marginBottom:'24px' }}>
            <div style={{ width:'7px', height:'7px', borderRadius:'50%', backgroundColor:'#4ADE80', animation:'pulse 2s infinite' }}/>
            <span style={{ fontSize:'12px', fontWeight:'700', color:'rgba(255,255,255,0.9)', letterSpacing:'0.06em', textTransform:'uppercase' }}>
              {prossimi.length} {prossimi.length===1?'evento in programma':'eventi in programma'}
            </span>
          </div>

          <h1 style={{ fontSize:'clamp(36px,6vw,68px)', fontWeight:'900', color:'#ffffff',
            letterSpacing:'-0.04em', margin:'0 0 16px', lineHeight:1.05, maxWidth:'700px' }}>
            Gli eventi<br/>
            <span style={{ color:'#60A5FA' }}>CNA Roma</span>
          </h1>
          <p style={{ fontSize:'clamp(15px,2vw,19px)', color:'rgba(255,255,255,0.72)', margin:'0 0 40px',
            maxWidth:'520px', lineHeight:'1.6', fontWeight:'400' }}>
            Formazione, networking e opportunità di crescita per le imprese associate.
          </p>

          {/* Featured card */}
          {featured && (
            <a href={`/eventi/${featured.slug}`} style={{ textDecoration:'none', display:'inline-block', maxWidth:'480px', width:'100%' }}>
              <div style={{ backgroundColor:'rgba(255,255,255,0.1)', backdropFilter:'blur(10px)',
                border:'1px solid rgba(255,255,255,0.2)', borderRadius:'16px', padding:'24px',
                transition:'all 0.2s', cursor:'pointer' }}
                onMouseEnter={e=>{ e.currentTarget.style.backgroundColor='rgba(255,255,255,0.18)'; e.currentTarget.style.transform='translateY(-2px)' }}
                onMouseLeave={e=>{ e.currentTarget.style.backgroundColor='rgba(255,255,255,0.1)'; e.currentTarget.style.transform='none' }}>
                <div style={{ fontSize:'11px', fontWeight:'700', color:'#60A5FA', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'10px' }}>
                  ✦ Prossimo evento
                </div>
                <h3 style={{ fontSize:'18px', fontWeight:'800', color:'#ffffff', letterSpacing:'-0.02em', margin:'0 0 10px', lineHeight:1.3 }}>
                  {featured.titolo}
                </h3>
                <div style={{ display:'flex', gap:'16px', flexWrap:'wrap' }}>
                  <MetaChip icon="📅" text={formatData(featured.data_inizio)} />
                  {featured.luogo && <MetaChip icon="📍" text={featured.luogo} />}
                  <MetaChip icon="🕐" text={formatOra(featured.data_inizio)} />
                </div>
                <div style={{ marginTop:'16px', display:'flex', alignItems:'center', gap:'6px',
                  fontSize:'13px', fontWeight:'700', color:'#60A5FA' }}>
                  Scopri e iscriviti
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </div>
              </div>
            </a>
          )}
        </div>

        <style>{`
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
          @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
        `}</style>
      </section>

      {/* ─── STATS BAR ─── */}
      <div style={{ backgroundColor:'#F8FAFF', borderBottom:'1px solid #E5E7EB', padding:'20px 32px' }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto', display:'flex', gap:'32px', flexWrap:'wrap', alignItems:'center' }}>
          <StatPill n={tutti.length} label="Totale eventi" color={BLU} />
          <StatPill n={prossimi.length} label="In programma" color='#059669' />
          <StatPill n={passati.length} label="Conclusi" color='#6B7280' />
          <div style={{ marginLeft:'auto' }}>
            <div style={{ position:'relative' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"
                style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Cerca evento o luogo…"
                style={{ padding:'10px 14px 10px 42px', border:'1px solid #E5E7EB', borderRadius:'8px',
                  fontSize:'14px', fontFamily:"'Inter',sans-serif", outline:'none', width:'260px',
                  backgroundColor:'#ffffff', color:NERO, boxSizing:'border-box' }}
                onFocus={e=>e.target.style.borderColor=BLU}
                onBlur={e=>e.target.style.borderColor='#E5E7EB'}/>
            </div>
          </div>
        </div>
      </div>

      {/* ─── TAB FILTER ─── */}
      <div id="eventi" style={{ maxWidth:'1100px', margin:'0 auto', padding:'40px 32px 0' }}>
        <div style={{ display:'flex', gap:'4px', backgroundColor:'#F3F4F6', borderRadius:'10px',
          padding:'4px', width:'fit-content', marginBottom:'40px' }}>
          {[
            { key:'prossimi', label:`Prossimi (${prossimi.length})`, color:'#059669' },
            { key:'passati',  label:`Passati (${passati.length})`,   color:'#6B7280' },
          ].map(t => (
            <button key={t.key} onClick={()=>setTab(t.key)}
              style={{ padding:'10px 24px', borderRadius:'8px', border:'none', cursor:'pointer',
                fontFamily:"'Inter',sans-serif", fontSize:'14px', fontWeight:'700', transition:'all 0.15s',
                backgroundColor: tab===t.key ? '#ffffff' : 'transparent',
                color: tab===t.key ? t.color : '#9CA3AF',
                boxShadow: tab===t.key ? '0 1px 8px rgba(0,0,0,0.1)' : 'none',
                letterSpacing:'-0.01em' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ─── GRIGLIA EVENTI ─── */}
        {loading ? (
          <Loading />
        ) : filtered.length === 0 ? (
          <Empty tab={tab} search={search} />
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:'24px', paddingBottom:'80px' }}>
            {filtered.map((e, i) => <EventCard key={e.id} evento={e} index={i} />)}
          </div>
        )}
      </div>

      {/* ─── FOOTER ─── */}
      <footer style={{ backgroundColor:NERO, color:'rgba(255,255,255,0.5)', padding:'48px 32px',
        marginTop:'0', textAlign:'center' }}>
        <img src={LOGO} alt="CNA Roma" style={{ height:'32px', marginBottom:'20px', filter:'brightness(0) invert(1)', opacity:0.6 }}/>
        <p style={{ fontSize:'13px', margin:'0 0 8px' }}>
          © {new Date().getFullYear()} CNA Roma · Confederazione Nazionale dell&apos;Artigianato e della Piccola e Media Impresa
        </p>
        <p style={{ fontSize:'12px', margin:0 }}>
          <a href="https://www.cnaroma.it" target="_blank" rel="noopener noreferrer"
            style={{ color:'rgba(255,255,255,0.4)', textDecoration:'none' }}>www.cnaroma.it</a>
        </p>
      </footer>
    </div>
  )
}

/* ── Componenti ── */

function EventCard({ evento, index }) {
  const past = isPast(evento.data_inizio)
  const color = past ? '#6B7280' : (evento.colore_primario || BLU)
  const d = new Date(evento.data_inizio)

  return (
    <a href={`/eventi/${evento.slug}`}
      style={{ textDecoration:'none', display:'block', borderRadius:'16px', overflow:'hidden',
        border:'1px solid #E5E7EB', backgroundColor:'#ffffff', transition:'all 0.2s',
        animation:`fadeUp 0.4s ease ${Math.min(index,6)*0.06}s both` }}
      onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 16px 48px rgba(0,0,0,0.12)'; e.currentTarget.style.borderColor=color }}
      onMouseLeave={e=>{ e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; e.currentTarget.style.borderColor='#E5E7EB' }}>

      {/* Immagine */}
      <div style={{ position:'relative', height:'200px', backgroundColor: color+'14', overflow:'hidden' }}>
        {evento.immagine_hero ? (
          <>
            <img src={evento.immagine_hero} alt={evento.titolo}
              style={{ width:'100%', height:'100%', objectFit:'cover',
                filter: past ? 'grayscale(60%) brightness(0.85)' : 'none',
                transition:'transform 0.4s' }}
              onMouseEnter={e=>e.target.style.transform='scale(1.04)'}
              onMouseLeave={e=>e.target.style.transform='none'}/>
            {past && <div style={{ position:'absolute', inset:0, backgroundColor:'rgba(10,10,10,0.35)' }}/>}
          </>
        ) : (
          <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center',
            background: past ? '#F3F4F6' : `linear-gradient(135deg,${color}22,${color}08)` }}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" opacity="0.3">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
        )}

        {/* Badge data in alto a sinistra */}
        <div style={{ position:'absolute', top:'14px', left:'14px', backgroundColor:'#ffffff',
          borderRadius:'10px', padding:'8px 12px', boxShadow:'0 4px 16px rgba(0,0,0,0.15)',
          minWidth:'52px', textAlign:'center' }}>
          <div style={{ fontSize:'22px', fontWeight:'900', letterSpacing:'-0.04em', color:NERO, lineHeight:1 }}>
            {String(d.getDate()).padStart(2,'0')}
          </div>
          <div style={{ fontSize:'9px', fontWeight:'800', color, textTransform:'uppercase', letterSpacing:'0.08em', marginTop:'2px' }}>
            {MESI_SHORT[d.getMonth()]}
          </div>
        </div>

        {/* Badge stato */}
        {past ? (
          <div style={{ position:'absolute', top:'14px', right:'14px', backgroundColor:'rgba(0,0,0,0.7)',
            borderRadius:'6px', padding:'4px 10px', fontSize:'11px', fontWeight:'700', color:'rgba(255,255,255,0.8)' }}>
            Concluso
          </div>
        ) : (
          <div style={{ position:'absolute', top:'14px', right:'14px', backgroundColor: color,
            borderRadius:'6px', padding:'4px 10px', fontSize:'11px', fontWeight:'700', color:'#ffffff' }}>
            Disponibile
          </div>
        )}
      </div>

      {/* Testo */}
      <div style={{ padding:'22px' }}>
        <h3 style={{ fontSize:'17px', fontWeight:'800', letterSpacing:'-0.025em', color: past ? '#6B7280' : NERO,
          margin:'0 0 8px', lineHeight:1.3 }}>
          {evento.titolo}
        </h3>
        {evento.sottotitolo && (
          <p style={{ fontSize:'13px', color:'#9CA3AF', margin:'0 0 14px', lineHeight:'1.5',
            display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
            {evento.sottotitolo}
          </p>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:'6px', marginBottom:'18px' }}>
          <MetaLine icon={iconClock(color)} text={`${formatData(evento.data_inizio)}${evento.data_fine?'':''} · ${formatOra(evento.data_inizio)}`} />
          {evento.luogo && <MetaLine icon={iconPin(color)} text={evento.luogo} />}
        </div>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontSize:'12px', color:'#9CA3AF', fontWeight:'500' }}>
            {evento.capienza_max ? `max ${evento.capienza_max} posti` : ''}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'13px',
            fontWeight:'700', color: past ? '#9CA3AF' : color }}>
            {past ? 'Visualizza' : 'Iscriviti'}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </div>
        </div>
      </div>
    </a>
  )
}

function MetaChip({ icon, text }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
      <span style={{ fontSize:'13px' }}>{icon}</span>
      <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.75)', fontWeight:'500' }}>{text}</span>
    </div>
  )
}

function MetaLine({ icon, text }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
      {icon}
      <span style={{ fontSize:'13px', color:'#6B7280', fontWeight:'500', lineHeight:1.4 }}>{text}</span>
    </div>
  )
}

function StatPill({ n, label, color }) {
  return (
    <div style={{ display:'flex', alignItems:'baseline', gap:'8px' }}>
      <span style={{ fontSize:'28px', fontWeight:'900', letterSpacing:'-0.04em', color }}>{n}</span>
      <span style={{ fontSize:'13px', color:'#9CA3AF', fontWeight:'500' }}>{label}</span>
    </div>
  )
}

function Loading() {
  return (
    <div style={{ textAlign:'center', padding:'80px 0' }}>
      <div style={{ width:'36px', height:'36px', border:`3px solid #E5E7EB`, borderTopColor:BLU,
        borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }}/>
      <p style={{ color:'#9CA3AF', fontSize:'14px' }}>Caricamento eventi…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function Empty({ tab, search }) {
  return (
    <div style={{ textAlign:'center', padding:'80px 0' }}>
      <div style={{ fontSize:'56px', marginBottom:'16px' }}>📅</div>
      <p style={{ fontSize:'18px', fontWeight:'800', color:NERO, margin:'0 0 8px', letterSpacing:'-0.02em' }}>
        {search ? 'Nessun risultato' : tab==='prossimi' ? 'Nessun evento in programma' : 'Nessun evento passato'}
      </p>
      <p style={{ fontSize:'14px', color:'#9CA3AF' }}>
        {search ? `Nessun evento trovato per "${search}"` : 'Torna a trovarci presto!'}
      </p>
    </div>
  )
}

function iconClock(color='#9CA3AF') {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={{flexShrink:0}}>
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}
function iconPin(color='#9CA3AF') {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={{flexShrink:0}}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  )
}
