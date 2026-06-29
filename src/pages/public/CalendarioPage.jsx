import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const DEFAULT_LOGO = 'https://customer31551.img.musvc2.net/static/31551/images/1/CNARoma%20NEGATIVO%20COLORE%20SOLO%20ROMA.png'
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
  const [cfg, setCfg] = useState(null)
  const [eventi, setEventi] = useState([])
  const [landings, setLandings] = useState([])
  const [loading, setLoading] = useState(true)
  const [sezione, setSezione] = useState('eventi')      // eventi | mestieri
  const [tabEventi, setTabEventi] = useState('prossimi') // tutti | prossimi | passati
  const [searchEventi, setSearchEventi] = useState('')
  const [searchLanding, setSearchLanding] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [allTags, setAllTags] = useState([])
  const [featured, setFeatured] = useState(null)

  useEffect(() => {
    ;(async () => {
      const [{ data: config }, { data: evs }, { data: lps }] = await Promise.all([
        supabase.from('calendario_config').select('*').eq('id','00000000-0000-0000-0000-000000000001').single(),
        supabase.from('events')
          .select('id,titolo,sottotitolo,slug,data_inizio,data_fine,luogo,immagine_hero,capienza_max,colore_primario,tags')
          .eq('stato','pubblicato').order('data_inizio',{ascending:true}),
        supabase.from('landing_pages')
          .select('id,titolo,slug,hero_immagine_url,hero_sottotitolo,tags,updated_at')
          .eq('stato','pubblicata').order('updated_at',{ascending:false}),
      ])
      const eList = evs || []
      const lList = lps || []
      setCfg(config)
      setEventi(eList)
      setLandings(lList)
      const t = new Set()
      ;[...eList,...lList].forEach(i => (i.tags||[]).forEach(tag => t.add(tag)))
      setAllTags([...t].sort())
      const pross = eList.filter(e=>!isPast(e.data_inizio))
      if (pross.length) setFeatured(pross[0])
      setLoading(false)
    })()
  }, [])

  const color = cfg?.colore_primario || BLU
  const logo = cfg?.logo_url || DEFAULT_LOGO

  // Ordina: tutti = prossimi prima (asc) poi passati (desc più recenti in fondo)
  const eventiOrdinati = [...eventi].sort((a,b) => {
    const aP = isPast(a.data_inizio), bP = isPast(b.data_inizio)
    if (tabEventi === 'tutti') {
      // prossimi prima (asc), poi passati (desc)
      if (!aP && bP) return -1
      if (aP && !bP) return 1
      if (!aP && !bP) return new Date(a.data_inizio) - new Date(b.data_inizio)
      return new Date(b.data_inizio) - new Date(a.data_inizio)
    }
    if (tabEventi === 'prossimi') return new Date(a.data_inizio) - new Date(b.data_inizio)
    return new Date(b.data_inizio) - new Date(a.data_inizio)
  })

  const filteredEventi = eventiOrdinati.filter(e => {
    if (tabEventi === 'prossimi' && isPast(e.data_inizio)) return false
    if (tabEventi === 'passati' && !isPast(e.data_inizio)) return false
    if (tagFilter && !(e.tags||[]).includes(tagFilter)) return false
    if (searchEventi) {
      const q = searchEventi.toLowerCase()
      return e.titolo?.toLowerCase().includes(q) || e.luogo?.toLowerCase().includes(q) || e.sottotitolo?.toLowerCase().includes(q)
    }
    return true
  })

  const filteredLanding = landings.filter(l => {
    if (tagFilter && !(l.tags||[]).includes(tagFilter)) return false
    if (searchLanding) {
      const q = searchLanding.toLowerCase()
      return l.titolo?.toLowerCase().includes(q) || l.hero_sottotitolo?.toLowerCase().includes(q)
    }
    return true
  })

  const nProssimi = eventi.filter(e=>!isPast(e.data_inizio)).length
  const nPassati = eventi.filter(e=>isPast(e.data_inizio)).length

  return (
    <div style={{fontFamily:"'Inter',sans-serif",backgroundColor:'#ffffff',minHeight:'100vh',color:NERO}}>
      <style>{`
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      {/* NAVBAR */}
      {/* HERO BLOCK: logo + contenuto + tab — tutto un unico blocco blu, niente sticky che taglia */}
      <div style={{background:`linear-gradient(160deg,${color} 0%,#001a5e 100%)`,position:'relative',overflow:'hidden'}}>
        {(cfg?.hero_immagine_url || featured?.immagine_hero) && (
          <div style={{position:'absolute',inset:0,
            backgroundImage:`url(${cfg?.hero_immagine_url || featured?.immagine_hero})`,
            backgroundSize:'cover',backgroundPosition:'center',
            filter:'blur(3px) brightness(0.18)',transform:'scale(1.06)'}}/>
        )}
        <div style={{position:'absolute',inset:0,opacity:0.04,
          backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.8) 1px,transparent 1px)',
          backgroundSize:'32px 32px'}}/>

        {/* Navbar logo + CTA */}
        <div style={{position:'relative',zIndex:2,display:'flex',alignItems:'center',
          justifyContent:'space-between',padding:'16px 24px',gap:'12px',flexWrap:'wrap'}}>
          <a href="/calendario" onClick={e=>{e.preventDefault();window.location.href='/calendario'}} style={{display:'block',flexShrink:0}}>
            <img src={logo} alt="CNA Roma" style={{height:'52px',objectFit:'contain',maxWidth:'220px',display:'block'}}/>
          </a>
          {cfg?.url_cta && (
            <a href={cfg.url_cta} target="_blank" rel="noopener noreferrer"
              style={{display:'flex',alignItems:'center',gap:'8px',flexShrink:0,
                fontSize:'13px',fontWeight:'700',color:color,backgroundColor:'#ffffff',
                textDecoration:'none',padding:'10px 18px',borderRadius:'8px',
                whiteSpace:'nowrap',boxShadow:'0 2px 12px rgba(0,0,0,0.25)',transition:'box-shadow 0.15s'}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,0.35)'}
              onMouseLeave={e=>e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,0.25)'}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              {cfg.testo_cta || 'cnaroma.it'}
            </a>
          )}
        </div>

        {/* Contenuto hero */}
        <div style={{position:'relative',zIndex:1,maxWidth:'1100px',margin:'0 auto',padding:'32px 24px 0',width:'100%',boxSizing:'border-box'}}>
          {nProssimi > 0 && (
            <div style={{display:'inline-flex',alignItems:'center',gap:'8px',
              backgroundColor:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.18)',
              borderRadius:'999px',padding:'6px 16px',marginBottom:'24px'}}>
              <span style={{width:'7px',height:'7px',borderRadius:'50%',backgroundColor:'#4ADE80',
                display:'inline-block',animation:'blink 2s ease infinite'}}/>
              <span style={{fontSize:'12px',fontWeight:'700',color:'rgba(255,255,255,0.85)',
                letterSpacing:'0.06em',textTransform:'uppercase'}}>
                {nProssimi} {nProssimi===1?'evento':'eventi'} in programma
              </span>
            </div>
          )}

          <h1 style={{fontSize:'clamp(36px,6vw,68px)',fontWeight:'900',color:'#ffffff',
            letterSpacing:'-0.04em',margin:'0 0 16px',lineHeight:1.05,maxWidth:'700px'}}>
            {cfg?.titolo || 'Gli eventi CNA Roma'}
          </h1>
          <p style={{fontSize:'clamp(15px,2vw,18px)',color:'rgba(255,255,255,0.68)',margin:'0 0 40px',
            maxWidth:'500px',lineHeight:'1.65'}}>
            {cfg?.sottotitolo || 'Formazione, networking e opportunità di crescita per le imprese associate.'}
          </p>

          {featured && (
            <a href={`/eventi/${featured.slug}`} style={{textDecoration:'none',display:'block',maxWidth:'460px',width:'100%'}}>
              <div style={{backgroundColor:'rgba(255,255,255,0.09)',backdropFilter:'blur(12px)',
                border:'1px solid rgba(255,255,255,0.18)',borderRadius:'14px',padding:'22px',transition:'all 0.2s'}}
                onMouseEnter={e=>{e.currentTarget.style.backgroundColor='rgba(255,255,255,0.16)';e.currentTarget.style.transform='translateY(-2px)'}}
                onMouseLeave={e=>{e.currentTarget.style.backgroundColor='rgba(255,255,255,0.09)';e.currentTarget.style.transform='none'}}>
                <p style={{fontSize:'11px',fontWeight:'800',color:'#60A5FA',textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 10px'}}>✦ Prossimo evento</p>
                <h3 style={{fontSize:'18px',fontWeight:'800',color:'#ffffff',letterSpacing:'-0.02em',margin:'0 0 12px',lineHeight:1.3}}>{featured.titolo}</h3>
                <div style={{display:'flex',gap:'14px',flexWrap:'wrap'}}>
                  <FChip icon="📅" text={fData(featured.data_inizio)}/>
                  {featured.luogo && <FChip icon="📍" text={featured.luogo}/>}
                  <FChip icon="🕐" text={fOra(featured.data_inizio)}/>
                </div>
                <p style={{fontSize:'13px',fontWeight:'700',color:'#60A5FA',margin:'14px 0 0',display:'flex',alignItems:'center',gap:'5px'}}>
                  Scopri e iscriviti <Arrow/>
                </p>
              </div>
            </a>
          )}
        </div>

        {/* Tab sticky dentro il blocco blu */}
        <div style={{position:'sticky',top:0,zIndex:100,display:'flex',
          borderTop:'1px solid rgba(255,255,255,0.15)',marginTop:'32px',
          background:`linear-gradient(160deg,${color} 0%,#001a5e 100%)`,
          boxShadow:'0 4px 16px rgba(0,20,80,0.4)'}}>
          {[
            {k:'eventi',   l: cfg?.testo_sezione_eventi  || 'Eventi',             n: eventi.length},
            {k:'mestieri', l: cfg?.testo_sezione_landing || 'Pagine di mestiere', n: landings.length},
          ].map(t => (
            <button key={t.k} onClick={() => setSezione(t.k)}
              style={{flex:1,padding:'14px 20px',border:'none',cursor:'pointer',
                fontFamily:"'Inter',sans-serif",fontSize:'14px',fontWeight:'700',
                backgroundColor: sezione===t.k ? 'rgba(255,255,255,0.15)' : 'transparent',
                transition:'all 0.15s',
                color: sezione===t.k ? '#ffffff' : 'rgba(255,255,255,0.5)',
                borderBottom: sezione===t.k ? '3px solid #ffffff' : '3px solid transparent',
                display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
              {t.l}
              <span style={{fontSize:'11px',fontWeight:'800',
                backgroundColor: sezione===t.k ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                color: sezione===t.k ? '#ffffff' : 'rgba(255,255,255,0.35)',
                borderRadius:'999px',padding:'2px 9px'}}>
                {t.n}
              </span>
            </button>
          ))}
        </div>
      </div>{/* fine hero block */}

      {/* STATS BAR */}
      <div style={{backgroundColor:'#F8FAFF',borderBottom:'1px solid #E5E7EB',padding:'16px 40px'}}>
        <div style={{maxWidth:'1100px',margin:'0 auto',display:'flex',gap:'28px',flexWrap:'wrap',alignItems:'center'}}>
          <Pill n={eventi.length} label="Tot. eventi" color={color}/>
          <Pill n={nProssimi} label="In programma" color='#059669'/>
          <Pill n={nPassati} label="Conclusi" color='#9CA3AF'/>
          {cfg?.mostra_landing !== false && <Pill n={landings.length} label="Mestieri" color='#7C3AED'/>}
          {allTags.length > 0 && (
            <div style={{display:'flex',gap:'6px',flexWrap:'wrap',alignItems:'center',marginLeft:'auto'}}>
              {tagFilter && (
                <button onClick={()=>setTagFilter('')}
                  style={{display:'flex',alignItems:'center',gap:'4px',padding:'4px 10px',borderRadius:'999px',
                    border:`1px solid ${color}`,backgroundColor:color,color:'#ffffff',
                    fontSize:'12px',fontWeight:'700',cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>
                  {tagFilter} ×
                </button>
              )}
              {allTags.filter(t=>t!==tagFilter).slice(0,6).map(tag=>(
                <button key={tag} onClick={()=>setTagFilter(tag)}
                  style={{padding:'4px 12px',borderRadius:'999px',border:'1px solid #E5E7EB',
                    backgroundColor:'#F9FAFB',color:'#6B7280',fontSize:'12px',fontWeight:'600',
                    cursor:'pointer',fontFamily:"'Inter',sans-serif",transition:'all 0.12s'}}
                  onMouseEnter={e=>{e.target.style.borderColor=color;e.target.style.color=color}}
                  onMouseLeave={e=>{e.target.style.borderColor='#E5E7EB';e.target.style.color='#6B7280'}}>
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{textAlign:'center',padding:'80px'}}>
          <div style={{width:'32px',height:'32px',border:`3px solid #E5E7EB`,borderTopColor:color,
            borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 14px'}}/>
          <p style={{color:'#9CA3AF',fontSize:'14px',margin:0}}>Caricamento…</p>
        </div>
      ) : (
        <main style={{maxWidth:'1100px',margin:'0 auto',padding:'56px 40px 80px'}}>

          {/* ── SEZIONE EVENTI ── */}
          {sezione === 'eventi' && (<section style={{marginBottom:'72px'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'16px',marginBottom:'28px'}}>
              <div>
                <h2 style={{fontSize:'28px',fontWeight:'900',letterSpacing:'-0.03em',color:NERO,margin:'0 0 4px'}}>
                  {cfg?.testo_sezione_eventi || 'Prossimi eventi'}
                </h2>
                <p style={{fontSize:'13px',color:'#9CA3AF',margin:0}}>
                  {nProssimi} in programma · {nPassati} conclusi
                </p>
              </div>
              <div style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}}>
                {/* Tab tutti/prossimi/passati */}
                <div style={{display:'flex',gap:'2px',backgroundColor:'#F3F4F6',borderRadius:'10px',padding:'3px'}}>
                  {[
                    {k:'tutti',    l:'Tutti',              n:eventi.length,  c:color},
                    {k:'prossimi', l:'In programma',       n:nProssimi,      c:'#059669'},
                    {k:'passati',  l:'Passati',            n:nPassati,       c:'#6B7280'},
                  ].map(t=>(
                    <button key={t.k} onClick={()=>setTabEventi(t.k)}
                      style={{padding:'8px 14px',borderRadius:'7px',border:'none',cursor:'pointer',
                        fontFamily:"'Inter',sans-serif",fontSize:'13px',fontWeight:'700',transition:'all 0.15s',
                        backgroundColor:tabEventi===t.k?'#ffffff':'transparent',
                        color:tabEventi===t.k?t.c:'#9CA3AF',
                        boxShadow:tabEventi===t.k?'0 1px 6px rgba(0,0,0,0.08)':'none',
                        display:'flex',alignItems:'center',gap:'5px',whiteSpace:'nowrap'}}>
                      {t.l}
                      <span style={{fontSize:'11px',fontWeight:'800',
                        backgroundColor:tabEventi===t.k?t.c+'18':'transparent',
                        color:tabEventi===t.k?t.c:'#C4C4C4',
                        borderRadius:'999px',padding:'1px 7px',transition:'all 0.15s'}}>
                        {t.n}
                      </span>
                    </button>
                  ))}
                </div>
                {/* Search eventi */}
                <SearchBox value={searchEventi} onChange={setSearchEventi} color={color} placeholder="Cerca evento…"/>
              </div>
            </div>

            {filteredEventi.length === 0 ? (
              <Empty text={searchEventi ? `Nessun risultato per "${searchEventi}"` : tagFilter ? `Nessun evento con tag "${tagFilter}"` : tabEventi==='prossimi' ? 'Nessun evento in programma' : tabEventi==='passati' ? 'Nessun evento passato' : 'Nessun evento pubblicato'}/>
            ) : (
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:'22px'}}>
                {filteredEventi.map((e,i) => <EventCard key={e.id} evento={e} index={i} color={color}/>)}
              </div>
            )}
          </section>

          )}

          {/* ── SEZIONE LANDING ── */}
          {sezione === 'mestieri' && cfg?.mostra_landing !== false && landings.length > 0 && (
            <section>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'16px',marginBottom:'28px'}}>
                <div>
                  <h2 style={{fontSize:'28px',fontWeight:'900',letterSpacing:'-0.03em',color:NERO,margin:'0 0 4px'}}>
                    {cfg?.testo_sezione_landing || 'Le nostre iniziative'}
                  </h2>
                  <p style={{fontSize:'13px',color:'#9CA3AF',margin:0}}>{landings.length} pagine di mestiere</p>
                </div>
                <SearchBox value={searchLanding} onChange={setSearchLanding} color='#7C3AED' placeholder="Cerca iniziativa…"/>
              </div>

              {filteredLanding.length === 0 ? (
                <Empty text={`Nessun risultato per "${searchLanding}"`}/>
              ) : (
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:'22px'}}>
                  {filteredLanding.map((l,i) => <LandingCard key={l.id} landing={l} index={i}/>)}
                </div>
              )}
            </section>
          )}
        </main>
      )}

      {/* FOOTER */}
      <footer style={{backgroundColor:NERO,padding:'40px',textAlign:'center'}}>
        <img src={logo} alt="CNA Roma" style={{height:'28px',marginBottom:'14px',opacity:0.5}}/>
        <p style={{fontSize:'13px',color:'rgba(255,255,255,0.38)',margin:'0 0 5px'}}>
          © {new Date().getFullYear()} CNA Roma · Confederazione Nazionale dell&apos;Artigianato e della Piccola e Media Impresa
        </p>
        {cfg?.url_cta && (
          <a href={cfg.url_cta} target="_blank" rel="noopener noreferrer"
            style={{fontSize:'12px',color:'rgba(255,255,255,0.28)',textDecoration:'none'}}>
            {cfg.url_cta.replace('https://','').replace('http://','')}
          </a>
        )}
      </footer>
    </div>
  )
}

/* ── Event Card ── */
function EventCard({evento,index,color}) {
  const past = isPast(evento.data_inizio)
  const c = past ? '#9CA3AF' : (evento.colore_primario || color)
  const d = new Date(evento.data_inizio)
  return (
    <a href={`/eventi/${evento.slug}`} style={{textDecoration:'none',display:'block',borderRadius:'14px',
      overflow:'hidden',border:'1px solid #E5E7EB',backgroundColor:'#ffffff',transition:'all 0.2s',
      animation:`fadeUp 0.35s ease ${Math.min(index,5)*0.07}s both`}}
      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.boxShadow='0 12px 40px rgba(0,0,0,0.1)';e.currentTarget.style.borderColor=c}}
      onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none';e.currentTarget.style.borderColor='#E5E7EB'}}>
      <div style={{position:'relative',height:'190px',backgroundColor:c+'12',overflow:'hidden'}}>
        {evento.immagine_hero
          ? <img src={evento.immagine_hero} alt={evento.titolo}
              style={{width:'100%',height:'100%',objectFit:'cover',filter:past?'grayscale(55%) brightness(0.88)':'none',transition:'transform 0.35s'}}
              onMouseEnter={e=>e.target.style.transform='scale(1.04)'}
              onMouseLeave={e=>e.target.style.transform='none'}/>
          : <NoImg color={c}/>
        }
        {past && <div style={{position:'absolute',inset:0,backgroundColor:'rgba(10,10,10,0.28)'}}/>}
        <div style={{position:'absolute',top:'13px',left:'13px',backgroundColor:'#ffffff',
          borderRadius:'10px',padding:'7px 11px',boxShadow:'0 4px 14px rgba(0,0,0,0.14)',textAlign:'center',minWidth:'46px'}}>
          <div style={{fontSize:'20px',fontWeight:'900',letterSpacing:'-0.04em',color:NERO,lineHeight:1}}>
            {String(d.getDate()).padStart(2,'0')}
          </div>
          <div style={{fontSize:'9px',fontWeight:'800',color:c,textTransform:'uppercase',letterSpacing:'0.07em',marginTop:'2px'}}>
            {MESI_SHORT[d.getMonth()]}
          </div>
        </div>
        <div style={{position:'absolute',top:'13px',right:'13px',backgroundColor:past?'rgba(0,0,0,0.65)':c,
          borderRadius:'6px',padding:'4px 10px',fontSize:'11px',fontWeight:'700',
          color:past?'rgba(255,255,255,0.75)':'#ffffff'}}>
          {past?'Concluso':'Disponibile'}
        </div>
      </div>
      <div style={{padding:'20px'}}>
        <h3 style={{fontSize:'16px',fontWeight:'800',letterSpacing:'-0.025em',color:past?'#6B7280':NERO,margin:'0 0 6px',lineHeight:1.3}}>{evento.titolo}</h3>
        {evento.sottotitolo && (
          <p style={{fontSize:'13px',color:'#9CA3AF',margin:'0 0 12px',lineHeight:'1.5',
            display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
            {evento.sottotitolo}
          </p>
        )}
        <div style={{display:'flex',flexDirection:'column',gap:'5px',marginBottom:'12px'}}>
          <MRow icon={<IcClock color={c}/>} text={`${fData(evento.data_inizio)} · ${fOra(evento.data_inizio)}`}/>
          {evento.luogo && <MRow icon={<IcPin color={c}/>} text={evento.luogo}/>}
        </div>
        {(evento.tags||[]).length>0 && (
          <div style={{display:'flex',gap:'5px',flexWrap:'wrap',marginBottom:'12px'}}>
            {evento.tags.map(t=><Tag key={t} label={t} color={c}/>)}
          </div>
        )}
        <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end'}}>
          <span style={{fontSize:'13px',fontWeight:'700',color:past?'#9CA3AF':c,display:'flex',alignItems:'center',gap:'4px'}}>
            {past?'Visualizza':'Iscriviti'} <Arrow color={past?'#9CA3AF':c}/>
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
          Mestiere
        </div>
      </div>
      <div style={{padding:'20px'}}>
        <h3 style={{fontSize:'16px',fontWeight:'800',letterSpacing:'-0.025em',color:NERO,margin:'0 0 6px',lineHeight:1.3}}>{landing.titolo}</h3>
        {landing.hero_sottotitolo && (
          <p style={{fontSize:'13px',color:'#9CA3AF',margin:'0 0 12px',lineHeight:'1.5',
            display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
            {landing.hero_sottotitolo}
          </p>
        )}
        {(landing.tags||[]).length>0 && (
          <div style={{display:'flex',gap:'5px',flexWrap:'wrap',marginBottom:'12px'}}>
            {landing.tags.map(t=><Tag key={t} label={t} color='#7C3AED'/>)}
          </div>
        )}
        <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end'}}>
          <span style={{fontSize:'13px',fontWeight:'700',color:'#7C3AED',display:'flex',alignItems:'center',gap:'4px'}}>
            Scopri <Arrow color='#7C3AED'/>
          </span>
        </div>
      </div>
    </a>
  )
}

/* ── Micro ── */
function FChip({icon,text}) {
  return <div style={{display:'flex',alignItems:'center',gap:'5px'}}>
    <span style={{fontSize:'12px'}}>{icon}</span>
    <span style={{fontSize:'12px',color:'rgba(255,255,255,0.72)',fontWeight:'500'}}>{text}</span>
  </div>
}
function MRow({icon,text}) {
  return <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
    {icon}
    <span style={{fontSize:'12px',color:'#6B7280',fontWeight:'500',lineHeight:1.4}}>{text}</span>
  </div>
}
function Tag({label,color}) {
  return <span style={{backgroundColor:color+'14',color,fontSize:'11px',fontWeight:'700',borderRadius:'999px',padding:'3px 10px'}}>{label}</span>
}
function Pill({n,label,color}) {
  return <div style={{display:'flex',alignItems:'baseline',gap:'7px'}}>
    <span style={{fontSize:'24px',fontWeight:'900',letterSpacing:'-0.04em',color}}>{n}</span>
    <span style={{fontSize:'13px',color:'#9CA3AF',fontWeight:'500'}}>{label}</span>
  </div>
}
function NoImg({color}) {
  return <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',background:`linear-gradient(135deg,${color}18,${color}06)`}}>
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" opacity="0.25">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  </div>
}
function Arrow({color='currentColor'}) {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
}
function IcClock({color}) {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={{flexShrink:0}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
}
function IcPin({color}) {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={{flexShrink:0}}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
}
function SearchBox({value,onChange,color,placeholder}) {
  return <div style={{position:'relative'}}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"
      style={{position:'absolute',left:'12px',top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}>
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
    <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      style={{padding:'9px 12px 9px 34px',border:'1px solid #E5E7EB',borderRadius:'8px',fontSize:'13px',
        fontFamily:"'Inter',sans-serif",outline:'none',width:'200px',color:NERO,boxSizing:'border-box'}}
      onFocus={e=>e.target.style.borderColor=color}
      onBlur={e=>e.target.style.borderColor='#E5E7EB'}/>
  </div>
}
function Empty({text}) {
  return <div style={{textAlign:'center',padding:'60px 0',gridColumn:'1/-1'}}>
    <p style={{fontSize:'40px',margin:'0 0 12px'}}>📭</p>
    <p style={{fontSize:'15px',fontWeight:'700',color:NERO,margin:'0 0 6px'}}>{text}</p>
  </div>
}
