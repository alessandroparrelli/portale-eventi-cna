import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const LOGO = 'https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png'
const BLU = '#003DA5'
const NERO = '#0A0A0A'
const MESI_IT = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre']
const MESI_SHORT = ['GEN','FEB','MAR','APR','MAG','GIU','LUG','AGO','SET','OTT','NOV','DIC']

function isPast(ts) { return ts && new Date(ts) < new Date() }
function fData(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${String(d.getDate()).padStart(2,'0')} ${MESI_IT[d.getMonth()]} ${d.getFullYear()}`
}
function fOra(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})
}

export default function CalendarioPage() {
  const [eventi, setEventi] = useState([])
  const [landings, setLandings] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('prossimi')   // prossimi | passati
  const [tipo, setTipo] = useState('tutti')    // tutti | eventi | landing
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [allTags, setAllTags] = useState([])
  const [featured, setFeatured] = useState(null)

  useEffect(() => {
    ;(async () => {
      const [{ data: evs }, { data: lps }] = await Promise.all([
        supabase.from('events')
          .select('id,titolo,sottotitolo,slug,data_inizio,data_fine,luogo,immagine_hero,capienza_max,colore_primario,tags')
          .eq('stato','pubblicato')
          .order('data_inizio',{ascending:false}),
        supabase.from('landing_pages')
          .select('id,titolo,slug,hero_immagine_url,hero_sottotitolo,tags,created_at,updated_at')
          .eq('stato','pubblicata')
          .order('updated_at',{ascending:false}),
      ])
      const eList = evs || []
      const lList = lps || []
      setEventi(eList)
      setLandings(lList)
      // Tag univoci da entrambi
      const t = new Set()
      ;[...eList,...lList].forEach(i => (i.tags||[]).forEach(tag => t.add(tag)))
      setAllTags([...t].sort())
      // Featured = prossimo evento futuro più vicino
      const pross = eList.filter(e=>!isPast(e.data_inizio))
      if (pross.length) setFeatured(pross[pross.length-1])
      setLoading(false)
    })()
  }, [])

  // Combina e filtra
  const itemsEventi = eventi.map(e=>({...e, _tipo:'evento'}))
  const itemsLanding = landings.map(l=>({...l, _tipo:'landing', data_inizio:null}))

  const allItems = tipo==='eventi' ? itemsEventi : tipo==='landing' ? itemsLanding : [...itemsEventi, ...itemsLanding]

  const filtered = allItems.filter(item => {
    if (item._tipo==='evento') {
      if (tab==='prossimi' && isPast(item.data_inizio)) return false
      if (tab==='passati' && !isPast(item.data_inizio)) return false
    }
    if (tagFilter && !(item.tags||[]).includes(tagFilter)) return false
    if (search) {
      const q = search.toLowerCase()
      return item.titolo?.toLowerCase().includes(q) || item.luogo?.toLowerCase().includes(q) || item.sottotitolo?.toLowerCase().includes(q) || item.hero_sottotitolo?.toLowerCase().includes(q)
    }
    return true
  })

  const nProssimi = eventi.filter(e=>!isPast(e.data_inizio)).length
  const nPassati = eventi.filter(e=>isPast(e.data_inizio)).length

  return (
    <div style={{fontFamily:"'Inter',sans-serif",backgroundColor:'#ffffff',minHeight:'100vh',color:NERO}}>

      {/* NAVBAR */}
      <nav style={{position:'sticky',top:0,zIndex:100,backgroundColor:'rgba(255,255,255,0.96)',
        backdropFilter:'blur(12px)',borderBottom:'1px solid #E5E7EB',padding:'0 32px',height:'64px',
        display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <img src={LOGO} alt="CNA Roma" style={{height:'36px',objectFit:'contain'}}/>
        <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
          <span style={{fontSize:'13px',color:'#9CA3AF',fontWeight:'500',display:'none'}} className="nav-sub">
            Tutti gli eventi e le iniziative
          </span>
          <a href="https://www.cnaroma.it" target="_blank" rel="noopener noreferrer"
            style={{fontSize:'13px',fontWeight:'700',color:'#ffffff',backgroundColor:BLU,
              textDecoration:'none',padding:'8px 18px',borderRadius:'6px',whiteSpace:'nowrap'}}>
            cnaroma.it ↗
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{position:'relative',overflow:'hidden',minHeight:'500px',display:'flex',alignItems:'center',backgroundColor:NERO}}>
        {featured?.immagine_hero && (
          <div style={{position:'absolute',inset:0,backgroundImage:`url(${featured.immagine_hero})`,
            backgroundSize:'cover',backgroundPosition:'center',filter:'blur(3px) brightness(0.22)',transform:'scale(1.06)'}}/>
        )}
        <div style={{position:'absolute',inset:0,
          background:'linear-gradient(135deg,rgba(0,61,165,0.88) 0%,rgba(10,10,10,0.96) 100%)'}}/>
        <div style={{position:'absolute',inset:0,opacity:0.05,
          backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.8) 1px,transparent 1px)',
          backgroundSize:'32px 32px'}}/>

        <div style={{position:'relative',zIndex:1,maxWidth:'1100px',margin:'0 auto',padding:'72px 32px',width:'100%'}}>
          {/* Pill badge */}
          <div style={{display:'inline-flex',alignItems:'center',gap:'8px',backgroundColor:'rgba(255,255,255,0.1)',
            border:'1px solid rgba(255,255,255,0.18)',borderRadius:'999px',padding:'6px 16px',marginBottom:'24px'}}>
            <span style={{width:'7px',height:'7px',borderRadius:'50%',backgroundColor:'#4ADE80',
              display:'inline-block',animation:'blink 2s ease infinite'}}/>
            <span style={{fontSize:'12px',fontWeight:'700',color:'rgba(255,255,255,0.85)',
              letterSpacing:'0.06em',textTransform:'uppercase'}}>
              {nProssimi} {nProssimi===1?'evento':'eventi'} in programma
            </span>
          </div>

          <h1 style={{fontSize:'clamp(38px,6vw,70px)',fontWeight:'900',color:'#ffffff',
            letterSpacing:'-0.04em',margin:'0 0 16px',lineHeight:1.05,maxWidth:'680px'}}>
            Tutti gli eventi<br/><span style={{color:'#60A5FA'}}>CNA Roma</span>
          </h1>
          <p style={{fontSize:'clamp(15px,2vw,18px)',color:'rgba(255,255,255,0.68)',margin:'0 0 40px',
            maxWidth:'500px',lineHeight:'1.65',fontWeight:'400'}}>
            Formazione, networking e opportunità di crescita per le imprese associate.
            Iscriviti ai prossimi eventi o sfoglia le iniziative passate.
          </p>

          {/* Featured prossimo evento */}
          {featured && (
            <a href={`/eventi/${featured.slug}`} style={{textDecoration:'none',display:'inline-block',maxWidth:'460px',width:'100%'}}>
              <div style={{backgroundColor:'rgba(255,255,255,0.09)',backdropFilter:'blur(12px)',
                border:'1px solid rgba(255,255,255,0.18)',borderRadius:'14px',padding:'22px',
                transition:'all 0.2s',cursor:'pointer'}}
                onMouseEnter={e=>{e.currentTarget.style.backgroundColor='rgba(255,255,255,0.16)';e.currentTarget.style.transform='translateY(-2px)'}}
                onMouseLeave={e=>{e.currentTarget.style.backgroundColor='rgba(255,255,255,0.09)';e.currentTarget.style.transform='none'}}>
                <p style={{fontSize:'11px',fontWeight:'800',color:'#60A5FA',textTransform:'uppercase',
                  letterSpacing:'0.08em',margin:'0 0 10px'}}>✦ Prossimo evento</p>
                <h3 style={{fontSize:'18px',fontWeight:'800',color:'#ffffff',letterSpacing:'-0.02em',
                  margin:'0 0 12px',lineHeight:1.3}}>{featured.titolo}</h3>
                <div style={{display:'flex',gap:'14px',flexWrap:'wrap'}}>
                  <FChip icon="📅" text={fData(featured.data_inizio)}/>
                  {featured.luogo && <FChip icon="📍" text={featured.luogo}/>}
                  <FChip icon="🕐" text={fOra(featured.data_inizio)}/>
                </div>
                <p style={{fontSize:'13px',fontWeight:'700',color:'#60A5FA',margin:'14px 0 0',
                  display:'flex',alignItems:'center',gap:'5px'}}>
                  Scopri e iscriviti
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </p>
              </div>
            </a>
          )}
        </div>
        <style>{`
          @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
          @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
          @keyframes spin{to{transform:rotate(360deg)}}
        `}</style>
      </section>

      {/* STATS BAR */}
      <div style={{backgroundColor:'#F8FAFF',borderBottom:'1px solid #E5E7EB',padding:'18px 32px'}}>
        <div style={{maxWidth:'1100px',margin:'0 auto',display:'flex',gap:'28px',flexWrap:'wrap',alignItems:'center'}}>
          <Pill n={eventi.length} label="Tot. eventi" color={BLU}/>
          <Pill n={nProssimi} label="In programma" color='#059669'/>
          <Pill n={nPassati} label="Conclusi" color='#9CA3AF'/>
          <Pill n={landings.length} label="Iniziative" color='#7C3AED'/>
          {/* Search */}
          <div style={{marginLeft:'auto',position:'relative'}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"
              style={{position:'absolute',left:'13px',top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Cerca evento, luogo…"
              style={{padding:'9px 14px 9px 38px',border:'1px solid #E5E7EB',borderRadius:'8px',
                fontSize:'13px',fontFamily:"'Inter',sans-serif",outline:'none',width:'240px',
                backgroundColor:'#ffffff',color:NERO,boxSizing:'border-box'}}
              onFocus={e=>e.target.style.borderColor=BLU}
              onBlur={e=>e.target.style.borderColor='#E5E7EB'}/>
          </div>
        </div>
      </div>

      {/* FILTRI */}
      <div id="eventi" style={{maxWidth:'1100px',margin:'0 auto',padding:'32px 32px 0'}}>
        <div style={{display:'flex',gap:'12px',flexWrap:'wrap',alignItems:'center',marginBottom:'32px'}}>

          {/* Tipo */}
          <div style={{display:'flex',gap:'3px',backgroundColor:'#F3F4F6',borderRadius:'10px',padding:'3px'}}>
            {[{k:'tutti',l:'Tutti'},{k:'eventi',l:'Eventi'},{k:'landing',l:'Iniziative'}].map(t=>(
              <button key={t.k} onClick={()=>setTipo(t.k)}
                style={{padding:'8px 18px',borderRadius:'7px',border:'none',cursor:'pointer',
                  fontFamily:"'Inter',sans-serif",fontSize:'13px',fontWeight:'700',transition:'all 0.15s',
                  backgroundColor:tipo===t.k?'#ffffff':'transparent',
                  color:tipo===t.k?NERO:'#9CA3AF',
                  boxShadow:tipo===t.k?'0 1px 6px rgba(0,0,0,0.08)':'none'}}>
                {t.l}
              </button>
            ))}
          </div>

          {/* Prossimi/Passati — solo se tipo include eventi */}
          {tipo!=='landing' && (
            <div style={{display:'flex',gap:'3px',backgroundColor:'#F3F4F6',borderRadius:'10px',padding:'3px'}}>
              {[{k:'prossimi',l:`Prossimi (${nProssimi})`},{k:'passati',l:`Passati (${nPassati})`}].map(t=>(
                <button key={t.k} onClick={()=>setTab(t.k)}
                  style={{padding:'8px 18px',borderRadius:'7px',border:'none',cursor:'pointer',
                    fontFamily:"'Inter',sans-serif",fontSize:'13px',fontWeight:'700',transition:'all 0.15s',
                    backgroundColor:tab===t.k?'#ffffff':'transparent',
                    color:tab===t.k?(t.k==='passati'?'#6B7280':'#059669'):'#9CA3AF',
                    boxShadow:tab===t.k?'0 1px 6px rgba(0,0,0,0.08)':'none'}}>
                  {t.l}
                </button>
              ))}
            </div>
          )}

          {/* Tag filter */}
          {allTags.length > 0 && (
            <div style={{display:'flex',gap:'6px',flexWrap:'wrap',alignItems:'center'}}>
              <span style={{fontSize:'12px',color:'#9CA3AF',fontWeight:'600'}}>Tag:</span>
              {tagFilter && (
                <button onClick={()=>setTagFilter('')}
                  style={{display:'flex',alignItems:'center',gap:'4px',padding:'4px 10px',borderRadius:'999px',
                    border:'1px solid #003DA5',backgroundColor:'#003DA5',color:'#ffffff',
                    fontSize:'12px',fontWeight:'700',cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>
                  {tagFilter} ×
                </button>
              )}
              {allTags.filter(t=>t!==tagFilter).slice(0,8).map(tag=>(
                <button key={tag} onClick={()=>setTagFilter(tag)}
                  style={{padding:'4px 12px',borderRadius:'999px',border:'1px solid #E5E7EB',
                    backgroundColor:'#F9FAFB',color:'#6B7280',fontSize:'12px',fontWeight:'600',
                    cursor:'pointer',fontFamily:"'Inter',sans-serif",transition:'all 0.12s'}}
                  onMouseEnter={e=>{e.target.style.borderColor=BLU;e.target.style.color=BLU}}
                  onMouseLeave={e=>{e.target.style.borderColor='#E5E7EB';e.target.style.color='#6B7280'}}>
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* GRIGLIA */}
        {loading ? <Spinner/> : filtered.length===0 ? <Empty search={search} tagFilter={tagFilter}/> : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',
            gap:'22px',paddingBottom:'80px'}}>
            {filtered.map((item,i) =>
              item._tipo==='evento'
                ? <EventCard key={item.id} evento={item} index={i}/>
                : <LandingCard key={item.id} landing={item} index={i}/>
            )}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer style={{backgroundColor:NERO,padding:'48px 32px',textAlign:'center'}}>
        <img src={LOGO} alt="CNA Roma" style={{height:'30px',marginBottom:'16px',filter:'brightness(0) invert(1)',opacity:0.5}}/>
        <p style={{fontSize:'13px',color:'rgba(255,255,255,0.4)',margin:'0 0 6px'}}>
          © {new Date().getFullYear()} CNA Roma · Confederazione Nazionale dell&apos;Artigianato e della Piccola e Media Impresa
        </p>
        <a href="https://www.cnaroma.it" target="_blank" rel="noopener noreferrer"
          style={{fontSize:'12px',color:'rgba(255,255,255,0.3)',textDecoration:'none'}}>www.cnaroma.it</a>
      </footer>
    </div>
  )
}

/* ── Event Card ── */
function EventCard({evento,index}) {
  const past = isPast(evento.data_inizio)
  const color = past?'#9CA3AF':(evento.colore_primario||BLU)
  const d = new Date(evento.data_inizio)
  return (
    <a href={`/eventi/${evento.slug}`} style={{textDecoration:'none',display:'block',borderRadius:'14px',
      overflow:'hidden',border:'1px solid #E5E7EB',backgroundColor:'#ffffff',transition:'all 0.2s',
      animation:`fadeUp 0.35s ease ${Math.min(index,5)*0.07}s both`}}
      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.boxShadow='0 12px 40px rgba(0,0,0,0.1)';e.currentTarget.style.borderColor=color}}
      onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none';e.currentTarget.style.borderColor='#E5E7EB'}}>
      {/* Immagine */}
      <div style={{position:'relative',height:'190px',backgroundColor:color+'12',overflow:'hidden'}}>
        {evento.immagine_hero
          ? <img src={evento.immagine_hero} alt={evento.titolo}
              style={{width:'100%',height:'100%',objectFit:'cover',
                filter:past?'grayscale(55%) brightness(0.88)':'none',transition:'transform 0.35s'}}
              onMouseEnter={e=>e.target.style.transform='scale(1.04)'}
              onMouseLeave={e=>e.target.style.transform='none'}/>
          : <NoImg color={color}/>
        }
        {past && <div style={{position:'absolute',inset:0,backgroundColor:'rgba(10,10,10,0.3)'}}/>}
        {/* Badge data */}
        <div style={{position:'absolute',top:'13px',left:'13px',backgroundColor:'#ffffff',
          borderRadius:'10px',padding:'7px 11px',boxShadow:'0 4px 14px rgba(0,0,0,0.14)',textAlign:'center',minWidth:'46px'}}>
          <div style={{fontSize:'20px',fontWeight:'900',letterSpacing:'-0.04em',color:NERO,lineHeight:1}}>
            {String(d.getDate()).padStart(2,'0')}
          </div>
          <div style={{fontSize:'9px',fontWeight:'800',color,textTransform:'uppercase',letterSpacing:'0.07em',marginTop:'2px'}}>
            {MESI_SHORT[d.getMonth()]}
          </div>
        </div>
        {/* Badge stato */}
        <div style={{position:'absolute',top:'13px',right:'13px',backgroundColor:past?'rgba(0,0,0,0.65)':color,
          borderRadius:'6px',padding:'4px 10px',fontSize:'11px',fontWeight:'700',
          color:past?'rgba(255,255,255,0.75)':'#ffffff'}}>
          {past?'Concluso':'Disponibile'}
        </div>
      </div>
      {/* Body */}
      <div style={{padding:'20px'}}>
        <h3 style={{fontSize:'16px',fontWeight:'800',letterSpacing:'-0.025em',
          color:past?'#6B7280':NERO,margin:'0 0 6px',lineHeight:1.3}}>{evento.titolo}</h3>
        {evento.sottotitolo && (
          <p style={{fontSize:'13px',color:'#9CA3AF',margin:'0 0 12px',lineHeight:'1.5',
            display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
            {evento.sottotitolo}
          </p>
        )}
        <div style={{display:'flex',flexDirection:'column',gap:'5px',marginBottom:'14px'}}>
          <MRow icon={<IcClock color={color}/>} text={`${fData(evento.data_inizio)} · ${fOra(evento.data_inizio)}`}/>
          {evento.luogo && <MRow icon={<IcPin color={color}/>} text={evento.luogo}/>}
        </div>
        {/* Tags */}
        {(evento.tags||[]).length>0 && (
          <div style={{display:'flex',gap:'5px',flexWrap:'wrap',marginBottom:'14px'}}>
            {evento.tags.map(t=><Tag key={t} label={t} color={color}/>)}
          </div>
        )}
        <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end'}}>
          <span style={{fontSize:'13px',fontWeight:'700',color:past?'#9CA3AF':color,
            display:'flex',alignItems:'center',gap:'4px'}}>
            {past?'Visualizza':'Iscriviti'}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </span>
        </div>
      </div>
    </a>
  )
}

/* ── Landing Card ── */
function LandingCard({landing,index}) {
  return (
    <a href={`/lp/${landing.slug}`} style={{textDecoration:'none',display:'block',borderRadius:'14px',
      overflow:'hidden',border:'1px solid #E5E7EB',backgroundColor:'#ffffff',transition:'all 0.2s',
      animation:`fadeUp 0.35s ease ${Math.min(index,5)*0.07}s both`}}
      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.boxShadow='0 12px 40px rgba(0,0,0,0.1)';e.currentTarget.style.borderColor='#7C3AED'}}
      onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none';e.currentTarget.style.borderColor='#E5E7EB'}}>
      <div style={{position:'relative',height:'190px',backgroundColor:'#7C3AED12',overflow:'hidden'}}>
        {landing.hero_immagine_url
          ? <img src={landing.hero_immagine_url} alt={landing.titolo}
              style={{width:'100%',height:'100%',objectFit:'cover',transition:'transform 0.35s'}}
              onMouseEnter={e=>e.target.style.transform='scale(1.04)'}
              onMouseLeave={e=>e.target.style.transform='none'}/>
          : <NoImg color='#7C3AED'/>
        }
        <div style={{position:'absolute',top:'13px',right:'13px',backgroundColor:'#7C3AED',
          borderRadius:'6px',padding:'4px 10px',fontSize:'11px',fontWeight:'700',color:'#ffffff'}}>
          Iniziativa
        </div>
      </div>
      <div style={{padding:'20px'}}>
        <h3 style={{fontSize:'16px',fontWeight:'800',letterSpacing:'-0.025em',color:NERO,margin:'0 0 6px',lineHeight:1.3}}>
          {landing.titolo}
        </h3>
        {landing.hero_sottotitolo && (
          <p style={{fontSize:'13px',color:'#9CA3AF',margin:'0 0 12px',lineHeight:'1.5',
            display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
            {landing.hero_sottotitolo}
          </p>
        )}
        {(landing.tags||[]).length>0 && (
          <div style={{display:'flex',gap:'5px',flexWrap:'wrap',marginBottom:'14px'}}>
            {landing.tags.map(t=><Tag key={t} label={t} color='#7C3AED'/>)}
          </div>
        )}
        <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end'}}>
          <span style={{fontSize:'13px',fontWeight:'700',color:'#7C3AED',display:'flex',alignItems:'center',gap:'4px'}}>
            Scopri
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </span>
        </div>
      </div>
    </a>
  )
}

/* ── Micro components ── */
function FChip({icon,text}) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:'5px'}}>
      <span style={{fontSize:'12px'}}>{icon}</span>
      <span style={{fontSize:'12px',color:'rgba(255,255,255,0.72)',fontWeight:'500'}}>{text}</span>
    </div>
  )
}
function MRow({icon,text}) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
      {icon}
      <span style={{fontSize:'12px',color:'#6B7280',fontWeight:'500',lineHeight:1.4}}>{text}</span>
    </div>
  )
}
function Tag({label,color}) {
  return (
    <span style={{backgroundColor:color+'14',color,fontSize:'11px',fontWeight:'700',
      borderRadius:'999px',padding:'3px 10px',letterSpacing:'0.01em'}}>
      {label}
    </span>
  )
}
function Pill({n,label,color}) {
  return (
    <div style={{display:'flex',alignItems:'baseline',gap:'7px'}}>
      <span style={{fontSize:'26px',fontWeight:'900',letterSpacing:'-0.04em',color}}>{n}</span>
      <span style={{fontSize:'13px',color:'#9CA3AF',fontWeight:'500'}}>{label}</span>
    </div>
  )
}
function NoImg({color}) {
  return (
    <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',
      background:`linear-gradient(135deg,${color}18,${color}06)`}}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" opacity="0.25">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    </div>
  )
}
function IcClock({color='#9CA3AF'}) {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={{flexShrink:0}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
}
function IcPin({color='#9CA3AF'}) {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={{flexShrink:0}}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
}
function Spinner() {
  return (
    <div style={{textAlign:'center',padding:'80px 0'}}>
      <div style={{width:'32px',height:'32px',border:`3px solid #E5E7EB`,borderTopColor:BLU,
        borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 14px'}}/>
      <p style={{color:'#9CA3AF',fontSize:'14px',margin:0}}>Caricamento…</p>
    </div>
  )
}
function Empty({search,tagFilter}) {
  return (
    <div style={{textAlign:'center',padding:'80px 0',paddingBottom:'120px'}}>
      <div style={{fontSize:'52px',marginBottom:'14px'}}>📭</div>
      <p style={{fontSize:'17px',fontWeight:'800',color:NERO,margin:'0 0 8px',letterSpacing:'-0.02em'}}>
        Nessun risultato
      </p>
      <p style={{fontSize:'14px',color:'#9CA3AF'}}>
        {search?`Nessun elemento trovato per "${search}"`
          :tagFilter?`Nessun elemento con il tag "${tagFilter}"`
          :'Nessun contenuto disponibile al momento.'}
      </p>
    </div>
  )
}
