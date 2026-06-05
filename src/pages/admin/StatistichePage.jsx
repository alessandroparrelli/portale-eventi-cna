import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Select, Field, EmptyState } from '../../components/ui'
import { BarChart2, Star, TrendingUp, Users, CheckCircle2, UserX, UserCheck } from 'lucide-react'

function StatCard({ icon: Icon, label, value, color='#003DA5', sub }) {
  return (
    <div style={s.statCard}>
      <div style={{ width:'44px', height:'44px', borderRadius:'8px', backgroundColor:color+'18',
        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Icon size={22} style={{ color }}/>
      </div>
      <div>
        <p style={s.statLabel}>{label}</p>
        <p style={{ ...s.statVal, color }}>{value}</p>
        {sub && <p style={s.statSub}>{sub}</p>}
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

// Mini bar chart via CSS
function BarMini({ label, value, max, color='#003DA5' }) {
  const pct = max > 0 ? Math.round((value/max)*100) : 0
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
      <span style={{ fontSize:'13px', color:'#374151', width:'90px', flexShrink:0, textTransform:'capitalize' }}>{label}</span>
      <div style={{ flex:1, height:'8px', backgroundColor:'#F3F4F6', borderRadius:'4px', overflow:'hidden' }}>
        <div style={{ width:`${pct}%`, height:'100%', backgroundColor:color, borderRadius:'4px', transition:'width 0.5s' }}/>
      </div>
      <span style={{ fontSize:'13px', fontWeight:'600', color:'#0A0A0A', width:'30px', textAlign:'right' }}>{value}</span>
    </div>
  )
}

export default function StatistichePage() {
  const [eventi, setEventi] = useState([])
  const [selectedEvento, setSelectedEvento] = useState('')
  const [stats, setStats] = useState(null)
  const [survey, setSurvey] = useState([])
  const [mestieri, setMestieri] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('events').select('id,titolo,capienza_max').order('data_inizio',{ascending:false})
      .then(({data})=>setEventi(data||[]))
    supabase.from('mestieri').select('id,nome').then(({data})=>setMestieri(data||[]))
  }, [])

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

    // Distribuzione per mestiere
    const mestDist = {}
    r.forEach(reg => {
      if (reg.mestiere_id) mestDist[reg.mestiere_id] = (mestDist[reg.mestiere_id]||0)+1
    })

    // Distribuzione per CAP
    const capDist = {}
    r.forEach(reg => { if (reg.cap) capDist[reg.cap] = (capDist[reg.cap]||0)+1 })
    const topCap = Object.entries(capDist).sort((a,b)=>b[1]-a[1]).slice(0,5)

    setStats({ total, presenti, assenti, walkin, confermati, capienza, mestDist, topCap })
    setLoading(false)
  }

  const surveyMedia = survey.length
    ? (survey.reduce((acc,s)=>acc+(s.valutazione||0),0)/survey.length).toFixed(1)
    : null

  const getMestiereNome = (id) => mestieri.find(m=>m.id===id)?.nome || 'Altro'
  const topMestieri = stats ? Object.entries(stats.mestDist)
    .sort((a,b)=>b[1]-a[1]).slice(0,6) : []

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Statistiche</h1>
          <p style={s.subtitle}>Analisi iscritti, presenze e soddisfazione</p>
        </div>
      </div>

      <div style={{ maxWidth:'360px', marginBottom:'24px' }}>
        <Field label="Seleziona evento">
          <Select value={selectedEvento} onChange={e=>setSelectedEvento(e.target.value)}>
            <option value="">— Scegli un evento —</option>
            {eventi.map(ev=><option key={ev.id} value={ev.id}>{ev.titolo}</option>)}
          </Select>
        </Field>
      </div>

      {!selectedEvento && (
        <EmptyState icon={BarChart2} title="Nessun evento selezionato"
          desc="Seleziona un evento per vedere le statistiche"/>
      )}

      {selectedEvento && loading && (
        <p style={{ color:'#9CA3AF', fontSize:'14px', padding:'40px', textAlign:'center' }}>Caricamento…</p>
      )}

      {selectedEvento && !loading && stats && (
        <div style={{ display:'flex', flexDirection:'column', gap:'24px' }}>

          {/* KPI cards */}
          <div style={s.statsGrid}>
            <StatCard icon={Users} label="Iscritti totali" value={stats.total}
              sub={stats.capienza ? `Capienza: ${stats.capienza}` : undefined}/>
            <StatCard icon={CheckCircle2} label="Presenti" value={stats.presenti} color='#16A34A'
              sub={stats.total ? `${Math.round((stats.presenti/stats.total)*100)}% di presenza` : undefined}/>
            <StatCard icon={UserCheck} label="Walk-in" value={stats.walkin} color='#7C3AED'/>
            <StatCard icon={UserX} label="Assenti" value={stats.assenti} color='#DC2626'/>
            <StatCard icon={TrendingUp} label="Confermati" value={stats.confermati} color='#2563EB'/>
            {survey.length > 0 && (
              <StatCard icon={Star} label="Soddisfazione media" value={surveyMedia + '/5'} color='#F59E0B'
                sub={`${survey.length} risposte`}/>
            )}
          </div>

          {/* Grafico presenze */}
          <div style={s.section}>
            <h2 style={s.sectionTitle}>Presenza all'evento</h2>
            {stats.total > 0 ? (
              <div>
                <div style={{ display:'flex', gap:'8px', marginBottom:'16px' }}>
                  {[
                    { label:'Presenti', val:stats.presenti, color:'#16A34A' },
                    { label:'Walk-in', val:stats.walkin, color:'#7C3AED' },
                    { label:'Assenti', val:stats.assenti, color:'#DC2626' },
                    { label:'Confermati', val:stats.confermati, color:'#2563EB' },
                  ].filter(i=>i.val>0).map(item=>(
                    <div key={item.label} style={{ ...s.legendItem, borderColor:item.color+'40', backgroundColor:item.color+'0d' }}>
                      <span style={{ width:'8px', height:'8px', borderRadius:'50%', backgroundColor:item.color, flexShrink:0 }}/>
                      <span style={{ fontSize:'13px', color:'#374151' }}>{item.label}: <strong>{item.val}</strong></span>
                    </div>
                  ))}
                </div>
                {/* Stacked bar */}
                <div style={{ display:'flex', height:'32px', borderRadius:'6px', overflow:'hidden', gap:'2px' }}>
                  {[
                    { val:stats.presenti, color:'#16A34A' },
                    { val:stats.walkin, color:'#7C3AED' },
                    { val:stats.confermati, color:'#2563EB' },
                    { val:stats.assenti, color:'#DC2626' },
                  ].filter(i=>i.val>0).map((item,i)=>(
                    <div key={i} title={`${item.val}`}
                      style={{ flex:item.val, backgroundColor:item.color, borderRadius:'3px', transition:'flex 0.4s' }}/>
                  ))}
                </div>
                <p style={{ fontSize:'12px', color:'#9CA3AF', margin:'6px 0 0', textAlign:'right' }}>
                  Tasso di presenza: {stats.total>0 ? Math.round(((stats.presenti+stats.walkin)/stats.total)*100) : 0}%
                </p>
              </div>
            ) : <p style={{ fontSize:'14px', color:'#9CA3AF' }}>Nessun dato disponibile</p>}
          </div>

          {/* Distribuzione categorie */}
          {topMestieri.length > 0 && (
            <div style={s.section}>
              <h2 style={s.sectionTitle}>Distribuzione categorie professionali</h2>
              {topMestieri.map(([id,count])=>(
                <BarMini key={id} label={getMestiereNome(id)} value={count} max={stats.total} color='#003DA5'/>
              ))}
            </div>
          )}

          {/* Top CAP */}
          {stats.topCap.length > 0 && (
            <div style={s.section}>
              <h2 style={s.sectionTitle}>Provenienza (top 5 CAP)</h2>
              {stats.topCap.map(([cap,count])=>(
                <BarMini key={cap} label={cap} value={count} max={stats.total} color='#6B7280'/>
              ))}
            </div>
          )}

          {/* Questionari */}
          <div style={s.section}>
            <h2 style={s.sectionTitle}>Questionari di soddisfazione</h2>
            {survey.length === 0 ? (
              <p style={{ fontSize:'14px', color:'#9CA3AF' }}>Nessun questionario compilato ancora.</p>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                {/* Media stelle */}
                <div style={{ display:'flex', alignItems:'center', gap:'16px', padding:'16px', backgroundColor:'#FFFBEB', borderRadius:'8px', border:'1px solid #FEF08A' }}>
                  <span style={{ fontSize:'40px', fontWeight:'900', color:'#D97706', letterSpacing:'-0.04em' }}>{surveyMedia}</span>
                  <div>
                    <StarRating value={parseFloat(surveyMedia)}/>
                    <p style={{ fontSize:'13px', color:'#6B7280', margin:'4px 0 0' }}>{survey.length} partecipant{survey.length===1?'e':'i'} ha compilato il questionario</p>
                  </div>
                </div>

                {/* Distribuzione stelle */}
                {[5,4,3,2,1].map(stars=>{
                  const cnt = survey.filter(s=>s.valutazione===stars).length
                  return (
                    <div key={stars} style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <div style={{ display:'flex', gap:'2px', width:'80px', flexShrink:0 }}>
                        {Array.from({length:5}).map((_,i)=>(
                          <Star key={i} size={13} fill={i<stars?'#F59E0B':'none'}
                            style={{ color:i<stars?'#F59E0B':'#D1D5DB' }}/>
                        ))}
                      </div>
                      <div style={{ flex:1, height:'8px', backgroundColor:'#F3F4F6', borderRadius:'4px', overflow:'hidden' }}>
                        <div style={{ width:`${survey.length>0?Math.round((cnt/survey.length)*100):0}%`,
                          height:'100%', backgroundColor:'#F59E0B', borderRadius:'4px', transition:'width 0.5s' }}/>
                      </div>
                      <span style={{ fontSize:'13px', color:'#6B7280', width:'24px' }}>{cnt}</span>
                    </div>
                  )
                })}

                {/* Ultimi commenti */}
                {survey.filter(s=>s.commento).length > 0 && (
                  <div>
                    <h3 style={{ fontSize:'14px', fontWeight:'700', color:'#0A0A0A', margin:'8px 0 12px' }}>Commenti</h3>
                    <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                      {survey.filter(s=>s.commento).slice(0,6).map(s=>(
                        <div key={s.id} style={s2.commentCard}>
                          <StarRating value={s.valutazione}/>
                          <p style={{ fontSize:'14px', color:'#374151', margin:'6px 0 0', lineHeight:'1.5', fontStyle:'italic' }}>
                            "{s.commento}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  page: { maxWidth:'900px' },
  header: { marginBottom:'24px' },
  title: { fontSize:'32px', fontWeight:'900', color:'#0A0A0A', letterSpacing:'-0.03em', margin:0 },
  subtitle: { fontSize:'14px', color:'#6B7280', margin:'4px 0 0', fontWeight:'500' },
  statsGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'14px' },
  statCard: { backgroundColor:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:'6px', padding:'18px', display:'flex', gap:'14px', alignItems:'center' },
  statLabel: { fontSize:'12px', fontWeight:'500', color:'#6B7280', margin:'0 0 2px', textTransform:'uppercase', letterSpacing:'0.04em' },
  statVal: { fontSize:'28px', fontWeight:'900', letterSpacing:'-0.03em', margin:0 },
  statSub: { fontSize:'12px', color:'#9CA3AF', margin:'2px 0 0' },
  section: { backgroundColor:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:'6px', padding:'24px' },
  sectionTitle: { fontSize:'16px', fontWeight:'700', color:'#0A0A0A', letterSpacing:'-0.02em', margin:'0 0 16px' },
  legendItem: { display:'flex', alignItems:'center', gap:'6px', padding:'4px 10px', borderRadius:'20px', border:'1px solid' },
}
const s2 = {
  commentCard: { backgroundColor:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:'6px', padding:'14px' },
}
