import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Select, Field, EmptyState } from '../../components/ui'
import { BarChart2, Star, TrendingUp, Users, CheckCircle2, UserX, UserCheck, Search, Calendar, Award, Clock, ArrowRight } from 'lucide-react'
import EventSelector from '../../components/EventSelector'
import GlowTabBar from '../../components/GlowTabBar'

function StatCard({ icon: Icon, label, value, color='#003DA5', sub, iconClass }) {
  return (
    <div className="glow-card" style={{ backgroundColor:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:'10px', padding:'18px', display:'flex', gap:'14px', alignItems:'center' }}>
      <div className={iconClass||'icon-badge-blue'} style={{ width:'44px', height:'44px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Icon size={20}/>
      </div>
      <div>
        <p style={{ fontSize:'11px', fontWeight:'600', color:'#6B7280', margin:'0 0 3px', textTransform:'uppercase', letterSpacing:'0.04em' }}>{label}</p>
        <p style={{ fontSize:'26px', fontWeight:'900', letterSpacing:'-0.03em', margin:0, color }}>{value}</p>
        {sub && <p style={{ fontSize:'12px', color:'#9CA3AF', margin:'2px 0 0' }}>{sub}</p>}
      </div>
    </div>
  )
}

function StarRating({ value, max=5 }) {
  return (
    <div style={{ display:'flex', gap:'2px' }}>
      {Array.from({length:max}).map((_,i)=>(
        <Star key={i} size={16}
          fill={i < Math.round(value) ? '#F59E0B' : 'none'}
          style={{ color: i < Math.round(value) ? '#F59E0B' : '#D1D5DB' }}/>
      ))}
    </div>
  )
}

function BarMini({ label, value, max, color='#003DA5' }) {
  const pct = max > 0 ? Math.round((value/max)*100) : 0
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
      <span style={{ fontSize:'13px', color:'#374151', width:'110px', flexShrink:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{label}</span>
      <div style={{ flex:1, height:'8px', backgroundColor:'#F3F4F6', borderRadius:'4px', overflow:'hidden' }}>
        <div style={{ width:`${pct}%`, height:'100%', background:`linear-gradient(90deg,${color},${color}cc)`, borderRadius:'4px', transition:'width 0.5s' }}/>
      </div>
      <span style={{ fontSize:'13px', fontWeight:'700', color:'#0A0A0A', width:'36px', textAlign:'right' }}>{value}</span>
      <span style={{ fontSize:'11px', color:'#9CA3AF', width:'30px' }}>{pct}%</span>
    </div>
  )
}

// Header tabella con icona colorata SVG
function ThIcon({ icon: Icon, label, color='#003DA5', bg='#EEF3FF' }) {
  return (
    <div className="th-icon" style={{ color:'#6B7280' }}>
      <div style={{ width:20, height:20, borderRadius:4, backgroundColor:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Icon size={12} style={{ color }}/>
      </div>
      {label}
    </div>
  )
}

function fmtDt(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('it-IT', { day:'2-digit', month:'short', year:'numeric' })
}

export default function StatistichePage() {
  const [tab, setTab] = useState('evento') // evento | utenti
  const [eventi, setEventi] = useState([])
  const [selectedEvento, setSelectedEvento] = useState('')
  const [stats, setStats] = useState(null)
  const [survey, setSurvey] = useState([])
  const [mestieri, setMestieri] = useState([])
  const [loading, setLoading] = useState(false)

  // Sezione utenti
  const [utenti, setUtenti] = useState([])
  const [loadingUtenti, setLoadingUtenti] = useState(false)
  const [searchUtente, setSearchUtente] = useState('')
  const [selectedUtente, setSelectedUtente] = useState(null)
  const [cronologia, setCronologia] = useState([])

  useEffect(() => {
    supabase.from('events').select('id,titolo,capienza_max,data_inizio,stato').order('data_inizio',{ascending:false})
      .then(({data})=>setEventi(data||[]))
    supabase.from('mestieri').select('id,nome').then(({data})=>setMestieri(data||[]))
  }, [])

  useEffect(() => {
    if (tab === 'utenti' && utenti.length === 0) loadUtenti()
  }, [tab])

  useEffect(() => {
    if (!selectedEvento) { setStats(null); setSurvey([]); return }
    loadStats()
  }, [selectedEvento])

  async function loadStats() {
    setLoading(true)
    const [{ data: regs }, { data: surveyData }] = await Promise.all([
      supabase.from('registrations').select('*').eq('event_id', selectedEvento),
      supabase.from('survey_answers').select('*')
        .in('registration_id',
          (await supabase.from('registrations').select('id').eq('event_id', selectedEvento)).data?.map(r=>r.id) || []
        ),
    ])
    setSurvey(surveyData || [])
    const r = regs || []
    const total = r.length
    const presenti = r.filter(x=>x.presente).length
    const assenti = r.filter(x=>x.stato==='assente').length
    const walkin = r.filter(x=>x.stato==='walk-in').length
    const confermati = r.filter(x=>x.stato==='confermato').length
    const ev = eventi.find(e=>e.id===selectedEvento)
    const capienza = ev?.capienza_max
    const mestDist = {}
    r.forEach(reg => { if (reg.mestiere_id) mestDist[reg.mestiere_id] = (mestDist[reg.mestiere_id]||0)+1 })
    const capDist = {}
    r.forEach(reg => { if (reg.cap) capDist[reg.cap] = (capDist[reg.cap]||0)+1 })
    const topCap = Object.entries(capDist).sort((a,b)=>b[1]-a[1]).slice(0,5)
    // Iscrizioni per giorno (ultime 2 settimane prima dell'evento)
    const dayDist = {}
    r.forEach(reg => {
      const d = reg.created_at?.slice(0,10)
      if (d) dayDist[d] = (dayDist[d]||0)+1
    })
    setStats({ total, presenti, assenti, walkin, confermati, capienza, mestDist, topCap, dayDist })
    setLoading(false)
  }

  async function loadUtenti() {
    setLoadingUtenti(true)
    // Raggruppa le registrazioni per email — ottieni utenti unici con conteggi
    const { data: regs } = await supabase
      .from('registrations')
      .select('id, nome, cognome, email, ragione_sociale, presente, stato, created_at, event_id, codice_iscrizione')
      .order('created_at', { ascending: false })

    if (!regs) { setLoadingUtenti(false); return }

    // Raggruppa per email
    const map = {}
    regs.forEach(r => {
      const key = r.email || r.nome + '_' + r.cognome
      if (!map[key]) {
        map[key] = {
          email: r.email,
          nome: r.nome,
          cognome: r.cognome,
          ragione_sociale: r.ragione_sociale,
          eventi_totali: 0,
          presenze: 0,
          ultima_iscrizione: r.created_at,
          registrations: [],
        }
      }
      map[key].eventi_totali++
      if (r.presente) map[key].presenze++
      if (r.created_at > map[key].ultima_iscrizione) map[key].ultima_iscrizione = r.created_at
      map[key].registrations.push(r)
    })

    const list = Object.values(map).sort((a,b) => b.eventi_totali - a.eventi_totali)
    setUtenti(list)
    setLoadingUtenti(false)
  }

  function selectUtente(u) {
    setSelectedUtente(u)
    // Carica cronologia con titoli eventi
    const ids = u.registrations.map(r => r.event_id)
    supabase.from('events').select('id,titolo,data_inizio,luogo').in('id', ids)
      .then(({ data: evData }) => {
        const cronologiaArricchita = u.registrations.map(r => ({
          ...r,
          evento: evData?.find(e => e.id === r.event_id),
        })).sort((a,b) => new Date(b.created_at) - new Date(a.created_at))
        setCronologia(cronologiaArricchita)
      })
  }

  const surveyMedia = survey.length
    ? (survey.reduce((acc,s)=>acc+(s.valutazione||0),0)/survey.length).toFixed(1)
    : null

  const getMestiereNome = (id) => mestieri.find(m=>m.id===id)?.nome || 'Altro'
  const topMestieri = stats ? Object.entries(stats.mestDist).sort((a,b)=>b[1]-a[1]).slice(0,6) : []

  const filteredUtenti = utenti.filter(u => {
    if (!searchUtente) return true
    const q = searchUtente.toLowerCase()
    return u.email?.toLowerCase().includes(q) || u.nome?.toLowerCase().includes(q) || u.cognome?.toLowerCase().includes(q) || u.ragione_sociale?.toLowerCase().includes(q)
  })

  return (
    <div style={s.page} className="admin-page">
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Statistiche</h1>
          <p style={s.subtitle}>Analisi iscritti, presenze e cronologia partecipanti</p>
        </div>
      </div>

      <GlowTabBar
        active={tab}
        onChange={setTab}
        tabs={[
          { id:'evento', label:'Per evento',       icon:'📊', color:'blue' },
          { id:'utenti', label:'Per partecipante', icon:'👤', color:'violet' },
        ]}
      />

      {/* ══ TAB EVENTO ══ */}
      {tab === 'evento' && (
        <>
          <EventSelector eventi={eventi} value={selectedEvento} onChange={e=>setSelectedEvento(e.target.value)} label="Evento da analizzare" />

          {!selectedEvento && <EmptyState icon={BarChart2} title="Nessun evento selezionato" desc="Seleziona un evento per vedere le statistiche"/>}
          {selectedEvento && loading && <p style={{ color:'#9CA3AF', fontSize:'14px', padding:'40px', textAlign:'center' }}>Caricamento…</p>}

          {selectedEvento && !loading && stats && (
            <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
              <div style={s.statsGrid}>
                <StatCard icon={Users}       label="Iscritti totali" value={stats.total}     color="#003DA5" iconClass="icon-badge-blue"
                  sub={stats.capienza ? `Capienza: ${stats.capienza}` : undefined}/>
                <StatCard icon={CheckCircle2} label="Presenti"        value={stats.presenti}  color="#059669" iconClass="icon-badge-green"
                  sub={stats.total ? `${Math.round((stats.presenti/stats.total)*100)}% di presenza` : undefined}/>
                <StatCard icon={UserCheck}    label="Walk-in"         value={stats.walkin}    color="#7C3AED" iconClass="icon-badge-violet"/>
                <StatCard icon={UserX}        label="Assenti"         value={stats.assenti}   color="#DC2626" iconClass="icon-badge-red"/>
                <StatCard icon={TrendingUp}   label="Confermati"      value={stats.confermati}color="#2563EB" iconClass="icon-badge-blue"
                  sub="in attesa di presenza"/>
                {survey.length > 0 && (
                  <StatCard icon={Star} label="Soddisfazione" value={surveyMedia+'/5'} color="#D97706" iconClass="icon-badge-amber"
                    sub={`${survey.length} risposte`}/>
                )}
              </div>

              {/* Barra presenze */}
              <div style={s.section}>
                <h2 style={s.sectionTitle}>Riepilogo presenze</h2>
                {stats.total > 0 ? (
                  <>
                    <div style={{ display:'flex', gap:'8px', marginBottom:'16px', flexWrap:'wrap' }}>
                      {[
                        { label:'Presenti', val:stats.presenti, color:'#059669', bg:'#D1FAE5' },
                        { label:'Walk-in',  val:stats.walkin,   color:'#7C3AED', bg:'#EDE9FE' },
                        { label:'Assenti',  val:stats.assenti,  color:'#DC2626', bg:'#FEE2E2' },
                        { label:'Conf.',    val:stats.confermati,color:'#2563EB',bg:'#DBEAFE' },
                      ].filter(i=>i.val>0).map(item=>(
                        <div key={item.label} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'4px 12px', borderRadius:'20px', backgroundColor:item.bg }}>
                          <span style={{ width:8, height:8, borderRadius:'50%', backgroundColor:item.color, flexShrink:0 }}/>
                          <span style={{ fontSize:'13px', color:item.color, fontWeight:'700' }}>{item.label}: {item.val}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display:'flex', height:'28px', borderRadius:'8px', overflow:'hidden', gap:'2px' }}>
                      {[
                        { val:stats.presenti, color:'#059669' },
                        { val:stats.walkin,   color:'#7C3AED' },
                        { val:stats.confermati,color:'#2563EB' },
                        { val:stats.assenti,  color:'#DC2626' },
                      ].filter(i=>i.val>0).map((item,i)=>(
                        <div key={i} title={`${item.val}`}
                          style={{ flex:item.val, background:`linear-gradient(135deg,${item.color},${item.color}cc)`, borderRadius:'3px' }}/>
                      ))}
                    </div>
                    <p style={{ fontSize:'12px', color:'#9CA3AF', margin:'6px 0 0', textAlign:'right' }}>
                      Tasso di presenza: <strong style={{color:'#003DA5'}}>{stats.total>0 ? Math.round(((stats.presenti+stats.walkin)/stats.total)*100) : 0}%</strong>
                    </p>
                  </>
                ) : <p style={{ fontSize:'14px', color:'#9CA3AF' }}>Nessun dato disponibile</p>}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
                {/* Categorie */}
                {topMestieri.length > 0 && (
                  <div style={s.section}>
                    <h2 style={s.sectionTitle}>Categorie professionali</h2>
                    {topMestieri.map(([id,count])=>(
                      <BarMini key={id} label={getMestiereNome(id)} value={count} max={stats.total} color='#003DA5'/>
                    ))}
                  </div>
                )}
                {/* CAP */}
                {stats.topCap.length > 0 && (
                  <div style={s.section}>
                    <h2 style={s.sectionTitle}>Provenienza (top 5 CAP)</h2>
                    {stats.topCap.map(([cap,count])=>(
                      <BarMini key={cap} label={cap} value={count} max={stats.total} color='#6B7280'/>
                    ))}
                  </div>
                )}
              </div>

              {/* Survey */}
              {survey.length > 0 && (
                <div style={s.section}>
                  <h2 style={s.sectionTitle}>Questionari di soddisfazione</h2>
                  <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'16px', padding:'16px', backgroundColor:'#FFFBEB', borderRadius:'8px', border:'1px solid #FDE68A' }}>
                      <span style={{ fontSize:'40px', fontWeight:'900', color:'#D97706', letterSpacing:'-0.04em' }}>{surveyMedia}</span>
                      <div>
                        <StarRating value={parseFloat(surveyMedia)}/>
                        <p style={{ fontSize:'13px', color:'#6B7280', margin:'4px 0 0' }}>{survey.length} rispost{survey.length===1?'a':'e'}</p>
                      </div>
                    </div>
                    {[5,4,3,2,1].map(stars=>{
                      const cnt = survey.filter(s=>s.valutazione===stars).length
                      return (
                        <div key={stars} style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                          <div style={{ display:'flex', gap:'2px', width:'80px', flexShrink:0 }}>
                            {Array.from({length:5}).map((_,i)=>(
                              <Star key={i} size={13} fill={i<stars?'#F59E0B':'none'} style={{ color:i<stars?'#F59E0B':'#D1D5DB' }}/>
                            ))}
                          </div>
                          <div style={{ flex:1, height:'8px', backgroundColor:'#F3F4F6', borderRadius:'4px', overflow:'hidden' }}>
                            <div style={{ width:`${survey.length>0?Math.round((cnt/survey.length)*100):0}%`, height:'100%', background:'linear-gradient(90deg,#F59E0B,#FCD34D)', borderRadius:'4px', transition:'width 0.5s' }}/>
                          </div>
                          <span style={{ fontSize:'13px', color:'#6B7280', width:'24px' }}>{cnt}</span>
                        </div>
                      )
                    })}
                    {survey.filter(s=>s.commento).slice(0,4).map(s=>(
                      <div key={s.id} style={{ backgroundColor:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:'8px', padding:'14px' }}>
                        <StarRating value={s.valutazione}/>
                        <p style={{ fontSize:'14px', color:'#374151', margin:'6px 0 0', lineHeight:'1.5', fontStyle:'italic' }}>"{s.commento}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ══ TAB UTENTI / CRONOLOGIA ══ */}
      {tab === 'utenti' && (
        <div style={{ display:'grid', gridTemplateColumns: selectedUtente ? '1fr 1fr' : '1fr', gap:'20px' }}>

          {/* Lista partecipanti */}
          <div>
            <div style={{ display:'flex', gap:'10px', marginBottom:'16px', alignItems:'center' }}>
              <div style={{ position:'relative', flex:1 }}>
                <Search size={15} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }}/>
                <input value={searchUtente} onChange={e=>setSearchUtente(e.target.value)}
                  placeholder="Cerca per nome, email, azienda…"
                  style={{ width:'100%', boxSizing:'border-box', border:'1px solid #D1D5DB', borderRadius:'8px', padding:'9px 12px 9px 32px', fontSize:'13px', fontFamily:"'Inter',sans-serif", outline:'none' }}/>
              </div>
              <span style={{ fontSize:'12px', color:'#9CA3AF', whiteSpace:'nowrap' }}>{filteredUtenti.length} partecipanti</span>
            </div>

            {loadingUtenti ? (
              <p style={{ color:'#9CA3AF', textAlign:'center', padding:'40px', fontSize:'14px' }}>Caricamento…</p>
            ) : (
              <div style={{ backgroundColor:'#fff', borderRadius:'10px', border:'1px solid #E5E7EB', overflow:'hidden' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
                  <thead>
                    <tr style={{ backgroundColor:'#FAFAFA', borderBottom:'1px solid #E5E7EB' }}>
                      <th style={s.th}><ThIcon icon={Users} label="Partecipante" color="#003DA5" bg="#EEF3FF"/></th>
                      <th style={s.th}><ThIcon icon={Calendar} label="Iscrizioni" color="#7C3AED" bg="#EDE9FE"/></th>
                      <th style={s.th}><ThIcon icon={CheckCircle2} label="Presenze" color="#059669" bg="#D1FAE5"/></th>
                      <th style={s.th}><ThIcon icon={Award} label="Tasso" color="#D97706" bg="#FEF3C7"/></th>
                      <th style={s.th}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUtenti.slice(0, 50).map((u, idx) => {
                      const tasso = u.eventi_totali > 0 ? Math.round((u.presenze/u.eventi_totali)*100) : 0
                      const isSelected = selectedUtente?.email === u.email
                      return (
                        <tr key={idx}
                          style={{ borderBottom:'1px solid #F3F4F6', backgroundColor: isSelected ? '#EEF3FF' : 'transparent', cursor:'pointer', transition:'background-color .1s' }}
                          onClick={() => selectUtente(u)}
                          onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor='#F9FAFB' }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = isSelected ? '#EEF3FF' : 'transparent' }}>
                          <td style={s.td}>
                            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                              <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#003DA5,#1a56db)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                <span style={{ fontSize:'11px', fontWeight:'800', color:'#fff' }}>
                                  {(u.nome?.[0]||'')}{(u.cognome?.[0]||'')}
                                </span>
                              </div>
                              <div>
                                <p style={{ fontSize:'13px', fontWeight:'600', color:'#0A0A0A', margin:0 }}>{[u.nome,u.cognome].filter(Boolean).join(' ')||'—'}</p>
                                <p style={{ fontSize:'11px', color:'#9CA3AF', margin:0 }}>{u.email||u.ragione_sociale||''}</p>
                              </div>
                            </div>
                          </td>
                          <td style={s.td}><span style={{ fontWeight:'700', color:'#003DA5' }}>{u.eventi_totali}</span></td>
                          <td style={s.td}><span style={{ fontWeight:'700', color:'#059669' }}>{u.presenze}</span></td>
                          <td style={s.td}>
                            <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                              <div style={{ width:36, height:5, backgroundColor:'#F3F4F6', borderRadius:3, overflow:'hidden' }}>
                                <div style={{ width:`${tasso}%`, height:'100%', background:`linear-gradient(90deg,${tasso>=80?'#059669':tasso>=50?'#D97706':'#003DA5'},${tasso>=80?'#10b981':tasso>=50?'#f59e0b':'#1a56db'})`, borderRadius:3 }}/>
                              </div>
                              <span style={{ fontSize:'11px', color:'#6B7280', fontWeight:'600' }}>{tasso}%</span>
                            </div>
                          </td>
                          <td style={s.td}>
                            <ArrowRight size={14} style={{ color:'#9CA3AF' }}/>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {filteredUtenti.length === 0 && (
                  <div style={{ padding:'40px', textAlign:'center', color:'#9CA3AF', fontSize:'13px' }}>Nessun partecipante trovato</div>
                )}
              </div>
            )}
          </div>

          {/* Cronologia partecipante selezionato */}
          {selectedUtente && (
            <div>
              <div style={{ backgroundColor:'#fff', borderRadius:'10px', border:'1px solid #E5E7EB', padding:'20px', marginBottom:'16px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px' }}>
                  <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#003DA5,#1a56db)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span style={{ fontSize:'16px', fontWeight:'800', color:'#fff' }}>
                      {(selectedUtente.nome?.[0]||'')}{(selectedUtente.cognome?.[0]||'')}
                    </span>
                  </div>
                  <div>
                    <p style={{ fontSize:'16px', fontWeight:'800', color:'#0A0A0A', margin:0, letterSpacing:'-0.02em' }}>
                      {[selectedUtente.nome, selectedUtente.cognome].filter(Boolean).join(' ') || selectedUtente.email}
                    </p>
                    {selectedUtente.email && <p style={{ fontSize:'13px', color:'#6B7280', margin:'2px 0 0' }}>{selectedUtente.email}</p>}
                    {selectedUtente.ragione_sociale && <p style={{ fontSize:'12px', color:'#9CA3AF', margin:'1px 0 0' }}>🏢 {selectedUtente.ragione_sociale}</p>}
                  </div>
                  <button onClick={() => setSelectedUtente(null)} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', fontSize:'18px' }}>✕</button>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px' }}>
                  {[
                    { label:'Iscrizioni', val: selectedUtente.eventi_totali, color:'#003DA5' },
                    { label:'Presenze',   val: selectedUtente.presenze,      color:'#059669' },
                    { label:'Tasso',      val: selectedUtente.eventi_totali > 0 ? Math.round((selectedUtente.presenze/selectedUtente.eventi_totali)*100)+'%' : '—', color:'#D97706' },
                  ].map(k => (
                    <div key={k.label} style={{ textAlign:'center', backgroundColor:'#F9FAFB', borderRadius:'8px', padding:'12px' }}>
                      <p style={{ fontSize:'22px', fontWeight:'900', color:k.color, margin:0, letterSpacing:'-0.03em' }}>{k.val}</p>
                      <p style={{ fontSize:'11px', color:'#6B7280', margin:'3px 0 0', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.04em' }}>{k.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline cronologia */}
              <div style={{ backgroundColor:'#fff', borderRadius:'10px', border:'1px solid #E5E7EB', overflow:'hidden' }}>
                <div style={{ padding:'16px 20px', borderBottom:'1px solid #E5E7EB' }}>
                  <h3 style={{ fontSize:'14px', fontWeight:'700', color:'#0A0A0A', margin:0 }}>Cronologia partecipazioni</h3>
                </div>
                {cronologia.length === 0 ? (
                  <p style={{ padding:'24px', textAlign:'center', color:'#9CA3AF', fontSize:'13px' }}>Nessuna partecipazione</p>
                ) : (
                  <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:'0' }}>
                    {cronologia.map((r, idx) => (
                      <div key={r.id} style={{ display:'flex', gap:'14px', paddingBottom:'16px', position:'relative' }}>
                        {idx < cronologia.length - 1 && (
                          <div style={{ position:'absolute', left:11, top:26, bottom:0, width:2, backgroundColor:'#E5E7EB' }}/>
                        )}
                        <div style={{
                          width:24, height:24, borderRadius:'50%', flexShrink:0, zIndex:1, border:'2px solid',
                          borderColor: r.presente ? '#059669' : '#D1D5DB',
                          backgroundColor: r.presente ? '#D1FAE5' : '#F9FAFB',
                          display:'flex', alignItems:'center', justifyContent:'center', marginTop:2
                        }}>
                          {r.presente
                            ? <CheckCircle2 size={12} style={{ color:'#059669' }}/>
                            : <Clock size={12} style={{ color:'#9CA3AF' }}/>
                          }
                        </div>
                        <div style={{ flex:1 }}>
                          <p style={{ fontSize:'13px', fontWeight:'700', color:'#0A0A0A', margin:'0 0 2px' }}>
                            {r.evento?.titolo || 'Evento rimosso'}
                          </p>
                          <p style={{ fontSize:'12px', color:'#9CA3AF', margin:0 }}>
                            {fmtDt(r.evento?.data_inizio)} {r.evento?.luogo ? `· ${r.evento.luogo}` : ''}
                          </p>
                          <div style={{ display:'flex', gap:'6px', marginTop:'5px', flexWrap:'wrap' }}>
                            <span style={{ fontSize:'11px', fontWeight:'700', padding:'2px 8px', borderRadius:'20px',
                              backgroundColor: r.presente ? '#D1FAE5' : '#F3F4F6',
                              color: r.presente ? '#065f46' : '#6B7280' }}>
                              {r.presente ? '✓ Presente' : r.stato || 'iscritto'}
                            </span>
                            {r.codice_iscrizione && (
                              <span style={{ fontSize:'10px', fontFamily:'monospace', color:'#9CA3AF', padding:'2px 6px', backgroundColor:'#F3F4F6', borderRadius:'4px' }}>
                                {r.codice_iscrizione}
                              </span>
                            )}
                          </div>
                        </div>
                        <p style={{ fontSize:'11px', color:'#9CA3AF', flexShrink:0, marginTop:3 }}>{fmtDt(r.created_at)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const s = {
  page: { width:'100%' },
  header: { marginBottom:'20px' },
  title: { fontSize:'32px', fontWeight:'900', color:'#0A0A0A', letterSpacing:'-0.03em', margin:0 },
  subtitle: { fontSize:'14px', color:'#6B7280', margin:'4px 0 0', fontWeight:'500' },
  statsGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'12px' },
  section: { backgroundColor:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:'10px', padding:'20px' },
  sectionTitle: { fontSize:'15px', fontWeight:'700', color:'#0A0A0A', letterSpacing:'-0.02em', margin:'0 0 16px' },
  th: { padding:'10px 14px', textAlign:'left', borderBottom:'1px solid #E5E7EB', backgroundColor:'#FAFAFA', fontWeight:'normal' },
  td: { padding:'11px 14px', verticalAlign:'middle' },
}
