import { useEffect, useState } from 'react'
import { usePageTitle } from '../../hooks/usePageTitle'
import { supabase } from '../../lib/supabase'
import { Select, Field, EmptyState } from '../../components/ui'
import { BarChart2, Star, TrendingUp, Users, CheckCircle2, UserX, UserCheck, Search, Calendar, Award, Clock, ArrowRight, Download } from 'lucide-react'
import EventSelector from '../../components/EventSelector'
import GlowTabBar from '../../components/GlowTabBar'
import GlowStatCard from '../../components/GlowStatCard'
import GlowTableHead from '../../components/GlowTableHead'
import * as XLSX from 'xlsx'
import StatisticheUtenti from './StatisticheUtenti'

function StatCard({ icon: Icon, label, value, color='#5B5FEF', sub, iconClass }) {
  return (
    <div className="glow-card" style={{ backgroundColor:'#FFFFFF', border:'1px solid #E8ECF4', borderRadius:'20px', padding:'18px', display:'flex', gap:'14px', alignItems:'center' }}>
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

function BarMini({ label, value, max, color='#5B5FEF' }) {
  const pct = max > 0 ? Math.round((value/max)*100) : 0
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
      <span style={{ fontSize:'13px', color:'#374151', width:'110px', flexShrink:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{label}</span>
      <div style={{ flex:1, height:'8px', backgroundColor:'#F3F4F6', borderRadius:'20px', overflow:'hidden' }}>
        <div style={{ width:`${pct}%`, height:'100%', background:`linear-gradient(90deg,${color},${color}cc)`, borderRadius:'20px', transition:'width 0.5s' }}/>
      </div>
      <span style={{ fontSize:'13px', fontWeight:'700', color:'#111827', width:'36px', textAlign:'right' }}>{value}</span>
      <span style={{ fontSize:'11px', color:'#9CA3AF', width:'30px' }}>{pct}%</span>
    </div>
  )
}

// Header tabella con icona colorata SVG
function ThIcon({ icon: Icon, label, color='#5B5FEF', bg='#EEEFFD' }) {
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
  usePageTitle('Statistiche')
  const [tab, setTab] = useState('evento') // evento | utenti
  const [eventi, setEventi] = useState([])
  const [selectedEvento, setSelectedEvento] = useState('')
  const [stats, setStats] = useState(null)
  const [survey, setSurvey] = useState([])
  const [mestieri, setMestieri] = useState([])
  const [loading, setLoading] = useState(false)
  const [pageViews, setPageViews] = useState(null) // { total, byDay }

  // Sezione utenti
  const [utenti, setUtenti] = useState([])
  const [loadingUtenti, setLoadingUtenti] = useState(false)
  const [searchUtente, setSearchUtente] = useState('')
  const [selectedUtente, setSelectedUtente] = useState(null)
  const [cronologia, setCronologia] = useState([])
  const [exportingXlsx, setExportingXlsx] = useState(false)

  useEffect(() => {
    supabase.from('events').select('id,titolo,capienza_max,data_inizio,stato').order('data_inizio',{ascending:false})
      .then(({data})=>setEventi(data||[]))
    supabase.from('mestieri').select('id,nome').then(({data})=>setMestieri(data||[]))
  }, [])

  useEffect(() => {
    // tab utenti: dati caricati da StatisticheUtenti
  }, [tab])

  useEffect(() => {
    if (!selectedEvento) { setStats(null); setSurvey([]); setPageViews(null); return }
    loadStats()
  }, [selectedEvento])

  async function loadStats() {
    setLoading(true)
    const [{ data: regs }, { data: surveyData }, { data: views }] = await Promise.all([
      supabase.from('registrations').select('*').eq('event_id', selectedEvento),
      supabase.from('survey_answers').select('*')
        .in('registration_id',
          (await supabase.from('registrations').select('id').eq('event_id', selectedEvento)).data?.map(r=>r.id) || []
        ),
      supabase.from('page_views').select('visited_at,country,city').eq('event_id', selectedEvento),
    ])
    // Visite
    const vList = views || []
    const vByDay = {}
    vList.forEach(v => { const d = v.visited_at?.slice(0,10); if (d) vByDay[d] = (vByDay[d]||0)+1 })
    // Geo
    const cityDist = {}
    const countryDist = {}
    vList.forEach(v => {
      if (v.city)    cityDist[v.city]       = (cityDist[v.city]||0)+1
      if (v.country) countryDist[v.country] = (countryDist[v.country]||0)+1
    })
    const topCities    = Object.entries(cityDist).sort((a,b)=>b[1]-a[1]).slice(0,8)
    const topCountries = Object.entries(countryDist).sort((a,b)=>b[1]-a[1]).slice(0,5)
    setPageViews({ total: vList.length, byDay: vByDay, topCities, topCountries })
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

  async function exportPartecipanti() {
    setExportingXlsx(true)
    try {
      // Carica tutte le registrazioni con titoli eventi
      const { data: regs } = await supabase
        .from('registrations')
        .select('id, nome, cognome, email, ragione_sociale, partita_iva, cellulare, cap, presente, stato, created_at, checkin_at, codice_iscrizione, event_id, mestiere_id')
        .order('created_at', { ascending: false })

      if (!regs || regs.length === 0) { setExportingXlsx(false); return }

      // Carica tutti gli eventi e mestieri referenziati
      const eventIds = [...new Set(regs.map(r => r.event_id).filter(Boolean))]
      const mestiereIds = [...new Set(regs.map(r => r.mestiere_id).filter(Boolean))]

      const [{ data: eventsData }, { data: mestieriData }] = await Promise.all([
        supabase.from('events').select('id, titolo, data_inizio, luogo, stato').in('id', eventIds),
        mestiereIds.length
          ? supabase.from('mestieri').select('id, nome').in('id', mestiereIds)
          : Promise.resolve({ data: [] }),
      ])

      const evMap = Object.fromEntries((eventsData || []).map(e => [e.id, e]))
      const msMap = Object.fromEntries((mestieriData || []).map(m => [m.id, m.nome]))

      const rows = regs.map(r => {
        const ev = evMap[r.event_id] || {}
        return {
          'Evento':              ev.titolo            || '—',
          'Data evento':         ev.data_inizio
            ? new Date(ev.data_inizio).toLocaleDateString('it-IT', { day:'2-digit', month:'2-digit', year:'numeric' })
            : '—',
          'Luogo':               ev.luogo             || '—',
          'Codice iscrizione':   r.codice_iscrizione  || '—',
          'Data iscrizione':     r.created_at
            ? new Date(r.created_at).toLocaleDateString('it-IT', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
            : '—',
          'Nome':                r.nome               || '—',
          'Cognome':             r.cognome            || '—',
          'Ragione Sociale':     r.ragione_sociale    || '—',
          'P.IVA':               r.partita_iva        || '—',
          'Email':               r.email              || '—',
          'Cellulare':           r.cellulare          || '—',
          'CAP':                 r.cap                || '—',
          'Categoria':           msMap[r.mestiere_id] || '—',
          'Stato':               r.stato              || '—',
          'Presente':            r.presente ? 'Sì' : 'No',
          'Check-in':            r.checkin_at
            ? new Date(r.checkin_at).toLocaleDateString('it-IT', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
            : '—',
        }
      })

      const ws = XLSX.utils.json_to_sheet(rows)

      // Larghezze colonne
      ws['!cols'] = [
        { wch: 30 }, { wch: 14 }, { wch: 20 }, { wch: 20 }, { wch: 18 },
        { wch: 14 }, { wch: 14 }, { wch: 24 }, { wch: 14 }, { wch: 26 },
        { wch: 14 }, { wch: 8  }, { wch: 20 }, { wch: 14 }, { wch: 8  }, { wch: 18 },
      ]

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Partecipanti')
      const date = new Date().toISOString().slice(0, 10)
      XLSX.writeFile(wb, `partecipanti-${date}.xlsx`)
    } catch (e) {
      console.error(e)
      alert('Errore durante l\'export.')
    }
    setExportingXlsx(false)
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
      <div style={s.header} className="page-header-row">
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
              <div style={s.statsGrid} className="stat-grid-auto">
                <GlowStatCard icon="users"     label="Iscritti totali" value={stats.total}      palette="blue"
                  sub={stats.capienza ? `Capienza: ${stats.capienza}` : undefined}/>
                <GlowStatCard icon="check"     label="Presenti"        value={stats.presenti}   palette="green"
                  sub={stats.total ? `${Math.round((stats.presenti/stats.total)*100)}% di presenza` : undefined}/>
                {pageViews !== null && (
                  <GlowStatCard icon="eye" label="Visite landing" value={pageViews.total} palette="cyan"
                    sub={stats.total > 0 ? `Conv. ${Math.round((stats.total/Math.max(pageViews.total,1))*100)}%` : 'visitatori unici per sessione'}/>
                )}
                <GlowStatCard icon="usercheck" label="Walk-in"         value={stats.walkin}     palette="violet"/>
                <GlowStatCard icon="userx"     label="Assenti"         value={stats.assenti}    palette="red"/>
                <GlowStatCard icon="trending"  label="Confermati"      value={stats.confermati} palette="cyan"
                  sub="in attesa di presenza"/>
                {survey.length > 0 && (
                  <GlowStatCard icon="star" label="Soddisfazione" value={surveyMedia+'/5'} palette="amber"
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
                    <div style={{ display:'flex', height:'28px', borderRadius:'16px', overflow:'hidden', gap:'2px' }}>
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
                      Tasso di presenza: <strong style={{color:'#5B5FEF'}}>{stats.total>0 ? Math.round(((stats.presenti+stats.walkin)/stats.total)*100) : 0}%</strong>
                    </p>
                  </>
                ) : <p style={{ fontSize:'14px', color:'#9CA3AF' }}>Nessun dato disponibile</p>}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }} className="grid-2col">
                {/* Categorie */}
                {topMestieri.length > 0 && (
                  <div style={s.section}>
                    <h2 style={s.sectionTitle}>Categorie professionali</h2>
                    {topMestieri.map(([id,count])=>(
                      <BarMini key={id} label={getMestiereNome(id)} value={count} max={stats.total} color='#5B5FEF'/>
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

              {/* Visite per giorno */}
              {pageViews && pageViews.total > 0 && (() => {
                const days = Object.keys(pageViews.byDay).sort()
                const maxV = Math.max(...Object.values(pageViews.byDay), 1)
                return (
                  <div style={s.section}>
                    <h2 style={s.sectionTitle}>Visite alla landing page</h2>
                    <p style={{ fontSize:'12px', color:'#9CA3AF', margin:'-4px 0 12px' }}>Visitatori unici per sessione · totale: <strong style={{color:'#5B5FEF'}}>{pageViews.total}</strong></p>
                    {days.length > 0 ? (
                      <div style={{ display:'flex', alignItems:'flex-end', gap:'4px', height:'80px', overflowX:'auto', paddingBottom:'4px' }}>
                        {days.map(d => {
                          const v = pageViews.byDay[d]
                          const h = Math.max(Math.round((v/maxV)*72), 4)
                          const label = new Date(d+'T12:00:00').toLocaleDateString('it-IT',{day:'2-digit',month:'short'})
                          return (
                            <div key={d} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'2px', flex:'0 0 auto', minWidth:'32px' }} title={`${label}: ${v} visit${v===1?'a':'e'}`}>
                              <span style={{ fontSize:'9px', color:'#5B5FEF', fontWeight:'700' }}>{v}</span>
                              <div style={{ width:'24px', height:`${h}px`, background:'linear-gradient(180deg,#3B82F6,#5B5FEF)', borderRadius:'3px 3px 0 0' }}/>
                              <span style={{ fontSize:'9px', color:'#9CA3AF', whiteSpace:'nowrap', transform:'rotate(-35deg)', transformOrigin:'top center', marginTop:'6px', display:'block' }}>{label}</span>
                            </div>
                          )
                        })}
                      </div>
                    ) : <p style={{ fontSize:'14px', color:'#9CA3AF' }}>Nessuna visita registrata</p>}
                  </div>
                )
              })()}

              {/* Provenienza geografica */}
              {pageViews && pageViews.total > 0 && pageViews.topCities && pageViews.topCities.length > 0 && (
                <div style={s.section}>
                  <h2 style={s.sectionTitle}>Provenienza visitatori</h2>
                  <p style={{ fontSize:'12px', color:'#9CA3AF', margin:'-4px 0 12px' }}>Area geografica rilevata dall'IP (solo visitatori con dati disponibili)</p>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
                    <div>
                      <p style={{ fontSize:'11px', fontWeight:'700', color:'#374151', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:'8px' }}>Città</p>
                      {pageViews.topCities.map(([city, count]) => (
                        <BarMini key={city} label={city} value={count} max={pageViews.total} color='#0891b2'/>
                      ))}
                    </div>
                    {pageViews.topCountries && pageViews.topCountries.length > 0 && (
                      <div>
                        <p style={{ fontSize:'11px', fontWeight:'700', color:'#374151', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:'8px' }}>Paese</p>
                        {pageViews.topCountries.map(([country, count]) => (
                          <BarMini key={country} label={country} value={count} max={pageViews.total} color='#0f766e'/>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Survey */}
              {survey.length > 0 && (
                <div style={s.section}>
                  <h2 style={s.sectionTitle}>Questionari di soddisfazione</h2>
                  <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'16px', padding:'16px', backgroundColor:'#FFFBEB', borderRadius:'16px', border:'1px solid #FDE68A' }}>
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
                          <div style={{ flex:1, height:'8px', backgroundColor:'#F3F4F6', borderRadius:'20px', overflow:'hidden' }}>
                            <div style={{ width:`${survey.length>0?Math.round((cnt/survey.length)*100):0}%`, height:'100%', background:'linear-gradient(90deg,#F59E0B,#FCD34D)', borderRadius:'20px', transition:'width 0.5s' }}/>
                          </div>
                          <span style={{ fontSize:'13px', color:'#6B7280', width:'24px' }}>{cnt}</span>
                        </div>
                      )
                    })}
                    {survey.filter(s=>s.commento).slice(0,4).map(s=>(
                      <div key={s.id} style={{ backgroundColor:'#F7F8FC', border:'1px solid #E8ECF4', borderRadius:'16px', padding:'14px' }}>
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
      {tab === 'utenti' && <StatisticheUtenti/>}
    </div>
  )
}

const s = {
  page: { width:'100%' },
  header: { marginBottom:'20px' },
  title: { fontSize:'32px', fontWeight:'900', color:'#111827', letterSpacing:'-0.03em', margin:0, fontFamily:"'Inter', sans-serif", fontVariationSettings:"'wght' 900" },
  subtitle: { fontSize:'14px', color:'#6B7280', margin:'4px 0 0', fontWeight:'500' },
  statsGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'12px' },
  section: { backgroundColor:'#FFFFFF', border:'1px solid #E8ECF4', borderRadius:'20px', padding:'20px' },
  sectionTitle: { fontSize:'15px', fontWeight:'900', color:'#111827', letterSpacing:'-0.02em', margin:'0 0 16px', fontFamily:"'Inter', sans-serif", fontVariationSettings:"'wght' 900" },
  th: { padding:'10px 14px', textAlign:'left', borderBottom:'1px solid #E8ECF4', backgroundColor:'#FAFAFA', fontWeight:'normal' },
  td: { padding:'11px 14px', verticalAlign:'middle' },
}
