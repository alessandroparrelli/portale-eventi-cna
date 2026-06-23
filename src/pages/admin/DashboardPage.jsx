import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import GlowTabBar from '../../components/GlowTabBar'
import GlowStatCard from '../../components/GlowStatCard'
import GlowTableHead from '../../components/GlowTableHead'
import {
  CalendarDays, Users, CheckCircle2, Clock, TrendingUp, Plus,
  ArrowRight, AlertCircle, Activity, Percent, Calendar
} from 'lucide-react'

const STATUS_LABELS = { bozza:'Bozza', pubblicato:'Pubblicato', chiuso:'Chiuso', archiviato:'Archiviato' }
const STATUS_COLORS = {
  bozza:     { bg:'#F3F4F6', text:'#6B7280' },
  pubblicato:{ bg:'#DCFCE7', text:'#16A34A' },
  chiuso:    { bg:'#FEF3C7', text:'#D97706' },
  archiviato:{ bg:'#F3F4F6', text:'#9CA3AF' },
}

function StatCard({ icon: Icon, label, value, sub, color='#003DA5', trend }) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statIcon, backgroundColor:color+'14', color }}>
        <Icon size={22} />
      </div>
      <div style={{ flex:1 }}>
        <p style={styles.statLabel}>{label}</p>
        <p style={styles.statValue}>{value}</p>
        {sub  && <p style={styles.statSub}>{sub}</p>}
      </div>
      {trend != null && (
        <div style={{ fontSize:'12px', fontWeight:'700', color: trend > 0 ? '#16A34A' : trend < 0 ? '#DC2626' : '#9CA3AF',
          backgroundColor: trend > 0 ? '#F0FDF4' : trend < 0 ? '#FEF2F2' : '#F3F4F6',
          padding:'3px 8px', borderRadius:'20px', whiteSpace:'nowrap', alignSelf:'flex-start' }}>
          {trend > 0 ? `+${trend}` : trend} oggi
        </div>
      )}
    </div>
  )
}

function StatusBadge({ stato }) {
  const c = STATUS_COLORS[stato] || STATUS_COLORS.bozza
  return <span style={{ ...styles.badge, backgroundColor:c.bg, color:c.text }}>{STATUS_LABELS[stato]||stato}</span>
}

// Mini bar chart per le iscrizioni degli ultimi 7 giorni
function WeeklyChart({ data }) {
  if (!data || data.length === 0) return null
  const max = Math.max(...data.map(d=>d.count), 1)
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:'4px', height:'48px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'3px' }}>
          <div style={{
            width:'100%', backgroundColor:'#003DA5', borderRadius:'3px 3px 0 0',
            height:`${Math.max((d.count/max)*40, d.count>0?4:0)}px`,
            opacity: i === data.length-1 ? 1 : 0.4 + (i/data.length)*0.5,
            transition:'height 0.3s ease',
          }} title={`${d.label}: ${d.count}`} />
          <span style={{ fontSize:'9px', color:'#9CA3AF', whiteSpace:'nowrap' }}>{d.label}</span>
        </div>
      ))}
    </div>
  )
}

function formatDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('it-IT', { day:'2-digit', month:'short', year:'numeric' })
}

function formatDateShort(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('it-IT', { day:'2-digit', month:'short' })
}

export default function DashboardPage() {
  const [events, setEvents]           = useState([])
  const [stats, setStats]             = useState({ totale:0, pubblicati:0, iscritti:0, presenti:0, oggi:0, prossimi:0 })
  const [weeklyData, setWeeklyData]   = useState([])
  const [nextEvents, setNextEvents]   = useState([])
  const [loading, setLoading]         = useState(true)
  const [tabFilter, setTabFilter]     = useState('tutti')
  const navigate = useNavigate()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const { data: eventsData } = await supabase
        .from('events')
        .select('id,titolo,slug,stato,data_inizio,data_fine,luogo,capienza_max,created_at,codice')
        .order('created_at', { ascending:false })

      const { data: regData } = await supabase
        .from('registrations')
        .select('event_id,stato,presente,created_at')

      const enriched = (eventsData||[]).map(ev => {
        const regs = (regData||[]).filter(r=>r.event_id===ev.id)
        return { ...ev, iscritti:regs.length, presenti:regs.filter(r=>r.presente).length }
      })

      setEvents(enriched.slice(0,10))

      const now = new Date()
      const todayStr = now.toISOString().slice(0,10)

      // Iscrizioni oggi
      const oggi = (regData||[]).filter(r => r.created_at?.slice(0,10) === todayStr).length

      // Prossimi eventi (data futura, pubblicati)
      const prossimi = (eventsData||[]).filter(e =>
        e.stato==='pubblicato' && e.data_inizio && new Date(e.data_inizio) > now
      )
      setNextEvents(prossimi.slice(0,3))

      setStats({
        totale:   eventsData?.length || 0,
        pubblicati: eventsData?.filter(e=>e.stato==='pubblicato').length || 0,
        iscritti: regData?.length || 0,
        presenti: regData?.filter(r=>r.presente).length || 0,
        oggi,
        prossimi: prossimi.length,
      })

      // Dati iscrizioni ultimi 7 giorni
      const weekly = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        const ds = d.toISOString().slice(0,10)
        const count = (regData||[]).filter(r=>r.created_at?.slice(0,10)===ds).length
        weekly.push({
          label: d.toLocaleDateString('it-IT',{weekday:'short'}).slice(0,2),
          count,
        })
      }
      setWeeklyData(weekly)

    } catch(e) { console.error(e) }
    setLoading(false)
  }

  const checkInRate = stats.iscritti > 0
    ? Math.round((stats.presenti / stats.iscritti) * 100)
    : 0

  return (
    <div style={styles.page} className="admin-page">
      {/* Header */}
      <div style={styles.pageHeader} className="page-header-row">
        <div>
          <h1 style={styles.pageTitle} className="admin-page-title">Dashboard</h1>
          <p style={styles.pageSubtitle}>
            {new Date().toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
          </p>
        </div>
        <button onClick={()=>navigate('/admin/eventi/nuovo/editor')} style={styles.primaryBtn}>
          <Plus size={18}/> Nuovo evento
        </button>
      </div>

      {/* KPI grid 4 colonne */}
      <div style={styles.statsGrid} className="stat-grid-4">
        <GlowStatCard icon="calendar"  label="Tot. eventi"     value={stats.totale}     palette="blue" />
        <GlowStatCard icon="check"     label="Pubblicati"      value={stats.pubblicati} palette="green" />
        <GlowStatCard icon="users"     label="Tot. iscritti"   value={stats.iscritti}   palette="cyan"  trend={stats.oggi} />
        <GlowStatCard icon="trending"  label="Tot. presenti"   value={stats.presenti}   palette="teal" />
      </div>

      {/* Seconda riga KPI */}
      <div style={{ ...styles.statsGrid, gridTemplateColumns:'repeat(3,1fr)', marginBottom:'20px' }} className="stat-grid-3">
        <GlowStatCard icon="percent"  label="Tasso check-in"  value={`${checkInRate}%`}  palette="violet"
          sub={stats.iscritti > 0 ? `${stats.presenti} su ${stats.iscritti}` : 'Nessun iscritto'} />
        <GlowStatCard icon="clock"    label="Prossimi eventi" value={stats.prossimi}      palette="amber"
          sub={stats.prossimi > 0 ? 'in programma' : 'Nessuno programmato'} />
        <GlowStatCard icon="activity" label="Iscrizioni oggi" value={stats.oggi}          palette="coral"
          sub={new Date().toLocaleDateString('it-IT',{day:'2-digit',month:'long'})} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'20px' }} className="dashboard-split">

        {/* Grafico iscrizioni settimanale */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Iscrizioni — ultimi 7 giorni</h2>
          </div>
          <div style={{ padding:'16px 20px 20px' }}>
            {weeklyData.some(d=>d.count>0)
              ? <WeeklyChart data={weeklyData} />
              : <p style={{ color:'#9CA3AF', fontSize:'13px', margin:'8px 0', textAlign:'center' }}>Nessuna iscrizione nell'ultima settimana</p>
            }
            <p style={{ fontSize:'12px', color:'#9CA3AF', margin:'10px 0 0', textAlign:'right' }}>
              Totale: <strong style={{color:'#003DA5'}}>{weeklyData.reduce((a,d)=>a+d.count,0)}</strong>
            </p>
          </div>
        </div>

        {/* Prossimi eventi */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Prossimi eventi</h2>
            <button onClick={()=>navigate('/admin/eventi')} style={styles.ghostBtn}>
              Vedi tutti <ArrowRight size={14}/>
            </button>
          </div>
          <div style={{ padding:'0 0 4px' }}>
            {nextEvents.length === 0 ? (
              <div style={{ padding:'24px', textAlign:'center', color:'#9CA3AF', fontSize:'13px' }}>
                Nessun evento pubblicato in programma
              </div>
            ) : (
              nextEvents.map(ev => (
                <div key={ev.id} style={styles.nextEventRow}
                  onMouseEnter={e=>e.currentTarget.style.backgroundColor='#F9FAFB'}
                  onMouseLeave={e=>e.currentTarget.style.backgroundColor='transparent'}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontWeight:'700', color:'#0A0A0A', margin:'0 0 2px', fontSize:'13px', letterSpacing:'-0.01em' }}>{ev.titolo}</p>
                    <p style={{ fontSize:'12px', color:'#9CA3AF', margin:0 }}>
                      {formatDateShort(ev.data_inizio)} · {ev.luogo||'—'}
                    </p>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <p style={{ fontSize:'13px', fontWeight:'600', color:'#003DA5', margin:'0 0 2px' }}>
                      {ev.iscritti}{ev.capienza_max?<span style={{color:'#9CA3AF',fontWeight:'400'}}>/{ev.capienza_max}</span>:null}
                    </p>
                    <p style={{ fontSize:'11px', color:'#9CA3AF', margin:0 }}>iscritti</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Tabella eventi recenti */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Ultimi eventi</h2>
          <button onClick={()=>navigate('/admin/eventi')} style={styles.ghostBtn}>
            Vedi tutti <ArrowRight size={14}/>
          </button>
        </div>

        {/* Filtro tab */}
        <div style={{ padding:'12px 20px 0', borderBottom:'1px solid #F3F4F6' }}>
          <GlowTabBar
            active={tabFilter}
            onChange={setTabFilter}
            tabs={[
              { id:'tutti',       label:'Tutti',      color:'blue'   },
              { id:'pubblicato',  label:'Pubblicati', color:'green'  },
              { id:'bozza',       label:'Bozze',      color:'amber'  },
              { id:'chiuso',      label:'Chiusi',     color:'coral'  },
              { id:'archiviato',  label:'Archiviati', color:'violet' },
            ]}
          />
        </div>
        {loading ? (
          <div style={styles.loadingState}>
            <Clock size={24} style={{color:'#9CA3AF',marginBottom:'8px'}}/>
            <p style={styles.loadingText}>Caricamento…</p>
          </div>
        ) : events.length === 0 ? (
          <div style={styles.emptyState}>
            <CalendarDays size={40} style={{color:'#D1D5DB',marginBottom:'12px'}}/>
            <p style={styles.emptyTitle}>Nessun evento ancora</p>
            <p style={styles.emptySubtitle}>Crea il tuo primo evento per iniziare</p>
            <button onClick={()=>navigate('/admin/eventi/nuovo/editor')} style={{...styles.primaryBtn,marginTop:'16px'}}>
              <Plus size={16}/> Crea evento
            </button>
          </div>
        ) : (
          <div style={styles.tableWrap} className="table-wrap">
            <table style={styles.table}>
              <GlowTableHead columns={[
                { label:'#',        color:'neutral', width:'60px', hideOnMobile:true },
                { label:'Evento',   color:'blue' },
                { label:'Data',     color:'cyan',    hideOnMobile:true },
                { label:'Stato',    color:'green' },
                { label:'Iscritti', color:'violet' },
                { label:'Pres. %',  color:'amber',   hideOnMobile:true },
                { label:'',         color:'neutral' },
              ]}/>
              <tbody>
                {events.filter(ev => tabFilter === 'tutti' || ev.stato === tabFilter).map(ev=>{
                  const rate = ev.iscritti > 0 ? Math.round((ev.presenti/ev.iscritti)*100) : null
                  return (
                    <tr key={ev.id} style={styles.tr}
                      onMouseEnter={e=>e.currentTarget.style.backgroundColor='#F9FAFB'}
                      onMouseLeave={e=>e.currentTarget.style.backgroundColor='transparent'}>
                      <td style={{...styles.td,width:'60px'}} className="col-hide-mobile">
                        <span style={{fontSize:'11px',fontWeight:'700',color:'#003DA5',backgroundColor:'#EEF3FF',padding:'2px 7px',borderRadius:'4px',fontFamily:'monospace',whiteSpace:'nowrap'}}>
                          EVT-{String(ev.codice||0).padStart(4,'0')}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <p style={styles.eventTitle}>{ev.titolo}</p>
                        <p style={styles.eventSlug}>/{ev.slug}</p>
                      </td>
                      <td style={styles.td} className="col-hide-mobile">
                        <p style={styles.cellText}>{formatDate(ev.data_inizio)}</p>
                      </td>
                      <td style={styles.td}><StatusBadge stato={ev.stato}/></td>
                      <td style={styles.td}>
                        <p style={styles.cellText}>
                          {ev.iscritti}
                          {ev.capienza_max&&<span style={styles.capTxt}>/{ev.capienza_max}</span>}
                        </p>
                      </td>
                      <td style={styles.td} className="col-hide-mobile">
                        {rate != null ? (
                          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                            <div style={{ width:'50px', height:'6px', backgroundColor:'#F3F4F6', borderRadius:'3px', overflow:'hidden' }}>
                              <div style={{ width:`${rate}%`, height:'100%', backgroundColor: rate>=80?'#16A34A':rate>=50?'#D97706':'#003DA5', borderRadius:'3px', transition:'width 0.3s' }}/>
                            </div>
                            <span style={{ fontSize:'12px', color:'#6B7280', fontWeight:'600' }}>{rate}%</span>
                          </div>
                        ) : <span style={{color:'#D1D5DB',fontSize:'13px'}}>—</span>}
                      </td>
                      <td style={styles.td}>
                        <button onClick={()=>navigate(`/admin/eventi`)} style={styles.rowBtn}>
                          Gestisci
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: { width:'100%' },
  pageHeader: { display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'28px', flexWrap:'wrap', gap:'16px' },
  pageTitle: { fontSize:'32px', fontWeight:'900', color:'#0A0A0A', letterSpacing:'-0.03em', margin:0 },
  pageSubtitle: { fontSize:'14px', color:'#6B7280', margin:'4px 0 0', fontWeight:'500', textTransform:'capitalize' },
  primaryBtn: { display:'flex', alignItems:'center', gap:'8px', backgroundColor:'#003DA5', color:'#FFFFFF', border:'none', borderRadius:'4px', padding:'10px 20px', fontSize:'14px', fontWeight:'700', fontFamily:"'Inter',sans-serif", cursor:'pointer', letterSpacing:'-0.01em', whiteSpace:'nowrap' },
  statsGrid: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', marginBottom:'12px' },
  statCard: { backgroundColor:'#FFFFFF', borderRadius:'6px', padding:'16px 20px', display:'flex', alignItems:'flex-start', gap:'14px', border:'1px solid #E5E7EB' },
  statIcon: { width:'44px', height:'44px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  statLabel: { fontSize:'11px', fontWeight:'600', color:'#6B7280', margin:'0 0 4px', textTransform:'uppercase', letterSpacing:'0.04em' },
  statValue: { fontSize:'28px', fontWeight:'900', color:'#0A0A0A', letterSpacing:'-0.03em', margin:0 },
  statSub: { fontSize:'12px', color:'#9CA3AF', margin:'3px 0 0' },
  section: { backgroundColor:'#FFFFFF', borderRadius:'6px', border:'1px solid #E5E7EB', overflow:'hidden' },
  sectionHeader: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid #E5E7EB' },
  sectionTitle: { fontSize:'15px', fontWeight:'700', color:'#0A0A0A', letterSpacing:'-0.02em', margin:0 },
  ghostBtn: { display:'flex', alignItems:'center', gap:'4px', background:'none', border:'none', cursor:'pointer', fontSize:'12px', fontFamily:"'Inter',sans-serif", color:'#003DA5', fontWeight:'600', padding:'4px 0' },
  nextEventRow: { display:'flex', alignItems:'center', gap:'16px', padding:'12px 20px', borderBottom:'1px solid #F3F4F6', transition:'background-color 0.1s', cursor:'default' },
  tableWrap: { overflowX:'auto' },
  table: { width:'100%', borderCollapse:'collapse', fontSize:'14px' },
  th: { padding:'10px 20px', textAlign:'left', fontSize:'11px', fontWeight:'600', color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:'1px solid #E5E7EB', whiteSpace:'nowrap', backgroundColor:'#FAFAFA' },
  tr: { transition:'background-color 0.1s' },
  td: { padding:'13px 20px', borderBottom:'1px solid #F3F4F6', verticalAlign:'middle' },
  eventTitle: { fontWeight:'600', color:'#0A0A0A', margin:'0 0 2px', letterSpacing:'-0.01em', fontSize:'13px' },
  eventSlug: { fontSize:'11px', color:'#9CA3AF', margin:0, fontFamily:'monospace' },
  cellText: { color:'#374151', margin:0, fontSize:'13px' },
  capTxt: { color:'#9CA3AF', fontSize:'11px' },
  badge: { display:'inline-flex', alignItems:'center', padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'600' },
  rowBtn: { background:'none', border:'1px solid #003DA5', color:'#003DA5', borderRadius:'4px', padding:'5px 12px', fontSize:'12px', fontWeight:'600', fontFamily:"'Inter',sans-serif", cursor:'pointer', whiteSpace:'nowrap' },
  loadingState: { padding:'48px', textAlign:'center' },
  loadingText: { color:'#9CA3AF', fontSize:'14px', margin:0 },
  emptyState: { padding:'64px 32px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center' },
  emptyTitle: { fontSize:'18px', fontWeight:'700', color:'#0A0A0A', margin:'0 0 6px', letterSpacing:'-0.02em' },
  emptySubtitle: { fontSize:'14px', color:'#6B7280', margin:0 },
}
