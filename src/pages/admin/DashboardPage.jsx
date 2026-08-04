import { useEffect, useState } from 'react'
import { usePageTitle } from '../../hooks/usePageTitle'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import GlowStatCard from '../../components/GlowStatCard'
import GlowTabBar from '../../components/GlowTabBar'
import { CalendarDays, Clock, Plus, ArrowRight } from 'lucide-react'

const P = '#5B5FEF'
const STATUS_LABELS = { bozza:'Bozza', pubblicato:'Pubblicato', chiuso:'Chiuso', archiviato:'Archiviato' }
const STATUS_COLORS = {
  bozza:      { bg:'#F3F4F6', text:'#6B7280' },
  pubblicato: { bg:'#DCFCE7', text:'#16A34A' },
  chiuso:     { bg:'#FEF3C7', text:'#D97706' },
  archiviato: { bg:'#F3F4F6', text:'#9CA3AF' },
}

function WeeklyChart({ data }) {
  if (!data?.length) return null
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:'6px', height:'64px', padding:'0 4px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
          <div style={{
            width:'100%', borderRadius:'6px 6px 0 0',
            background: i === data.length-1
              ? `linear-gradient(180deg, ${P}, #7C4DFF)`
              : `${P}${Math.round((0.25 + (i/data.length)*0.5)*255).toString(16).padStart(2,'0')}`,
            height:`${Math.max((d.count/max)*52, d.count>0?6:2)}px`,
            transition:'height 0.4s cubic-bezier(.4,0,.2,1)',
          }} title={`${d.label}: ${d.count}`}/>
          <span style={{ fontSize:'10px', color:'#9CA3AF', fontWeight:'500' }}>{d.label}</span>
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
  usePageTitle('Dashboard')
  const [events, setEvents]         = useState([])
  const [stats, setStats]           = useState({ totale:0, pubblicati:0, iscritti:0, presenti:0, oggi:0, prossimi:0 })
  const [weeklyData, setWeeklyData] = useState([])
  const [nextEvents, setNextEvents] = useState([])
  const [loading, setLoading]       = useState(true)
  const [tabFilter, setTabFilter]   = useState('tutti')
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
        const regs = (regData||[]).filter(r => r.event_id === ev.id)
        return { ...ev, iscritti:regs.length, presenti:regs.filter(r=>r.presente).length }
      })
      setEvents(enriched.slice(0,10))
      const now = new Date()
      const todayStr = now.toISOString().slice(0,10)
      const oggi = (regData||[]).filter(r => r.created_at?.slice(0,10) === todayStr).length
      const prossimi = (eventsData||[]).filter(e => e.stato==='pubblicato' && e.data_inizio && new Date(e.data_inizio) > now)
      setNextEvents(prossimi.slice(0,3))
      setStats({
        totale: eventsData?.length||0,
        pubblicati: eventsData?.filter(e=>e.stato==='pubblicato').length||0,
        iscritti: regData?.length||0,
        presenti: regData?.filter(r=>r.presente).length||0,
        oggi, prossimi: prossimi.length,
      })
      const weekly = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate()-i)
        const ds = d.toISOString().slice(0,10)
        weekly.push({ label:d.toLocaleDateString('it-IT',{weekday:'short'}).slice(0,2), count:(regData||[]).filter(r=>r.created_at?.slice(0,10)===ds).length })
      }
      setWeeklyData(weekly)
    } catch(e) { console.error(e) }
    setLoading(false)
  }

  const checkInRate = stats.iscritti > 0 ? Math.round((stats.presenti/stats.iscritti)*100) : 0

  return (
    <div style={{ width:'100%', fontFamily:"'Inter',sans-serif" }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'28px', flexWrap:'wrap', gap:'12px' }} className="page-header-row">
        <div>
          <h1 style={{ fontSize:'30px', fontWeight:'700', color:'#111827', letterSpacing:'-0.03em', margin:0 }}>Dashboard</h1>
          <p style={{ fontSize:'14px', color:'#6B7280', margin:'4px 0 0', fontWeight:'400', textTransform:'capitalize' }}>
            {new Date().toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
          </p>
        </div>
        <button onClick={()=>navigate('/admin/eventi/nuovo/editor')} style={{
          display:'flex', alignItems:'center', gap:'7px',
          background: P, color:'#fff', border:'none',
          borderRadius:'16px', padding:'10px 20px',
          fontSize:'14px', fontWeight:'600', fontFamily:"'Inter',sans-serif",
          cursor:'pointer', whiteSpace:'nowrap',
          boxShadow:`0 4px 14px ${P}40`,
          transition:'all .15s',
        }}>
          <Plus size={16}/> Nuovo evento
        </button>
      </div>

      {/* KPI grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', marginBottom:'12px' }} className="stat-grid-4">
        <GlowStatCard icon="calendar" label="Tot. eventi"   value={stats.totale}     palette="blue" />
        <GlowStatCard icon="check"    label="Pubblicati"    value={stats.pubblicati} palette="green" />
        <GlowStatCard icon="users"    label="Tot. iscritti" value={stats.iscritti}   palette="cyan"  trend={stats.oggi} />
        <GlowStatCard icon="trending" label="Tot. presenti" value={stats.presenti}   palette="teal" />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'24px' }} className="stat-grid-3">
        <GlowStatCard icon="percent"  label="Tasso check-in"  value={`${checkInRate}%`} palette="violet"
          sub={stats.iscritti>0 ? `${stats.presenti} su ${stats.iscritti}` : 'Nessun iscritto'} />
        <GlowStatCard icon="clock"    label="Prossimi eventi" value={stats.prossimi}     palette="amber"
          sub={stats.prossimi>0 ? 'in programma' : 'Nessuno programmato'} />
        <GlowStatCard icon="activity" label="Iscrizioni oggi" value={stats.oggi}          palette="coral"
          sub={new Date().toLocaleDateString('it-IT',{day:'2-digit',month:'long'})} />
      </div>

      {/* Riga chart + prossimi eventi */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'20px' }} className="dashboard-split">

        <div style={{ background:'#fff', borderRadius:'20px', border:'1px solid #E8ECF4', overflow:'hidden', boxShadow:'0 1px 4px rgba(20,20,40,.05)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 20px 14px' }}>
            <h2 style={{ fontSize:'14px', fontWeight:'600', color:'#111827', margin:0 }}>Iscrizioni — 7 giorni</h2>
          </div>
          <div style={{ padding:'0 20px 20px' }}>
            {weeklyData.some(d=>d.count>0)
              ? <WeeklyChart data={weeklyData}/>
              : <p style={{ color:'#9CA3AF', fontSize:'13px', textAlign:'center', padding:'16px 0' }}>Nessuna iscrizione nell'ultima settimana</p>
            }
            <p style={{ fontSize:'12px', color:'#9CA3AF', margin:'10px 0 0', textAlign:'right' }}>
              Totale: <strong style={{color:P}}>{weeklyData.reduce((a,d)=>a+d.count,0)}</strong>
            </p>
          </div>
        </div>

        <div style={{ background:'#fff', borderRadius:'20px', border:'1px solid #E8ECF4', overflow:'hidden', boxShadow:'0 1px 4px rgba(20,20,40,.05)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 20px 14px', borderBottom:'1px solid #F3F4F6' }}>
            <h2 style={{ fontSize:'14px', fontWeight:'600', color:'#111827', margin:0 }}>Prossimi eventi</h2>
            <button onClick={()=>navigate('/admin/eventi')} style={{ display:'flex', alignItems:'center', gap:'4px', background:'none', border:'none', cursor:'pointer', fontSize:'13px', color:P, fontWeight:'600', fontFamily:"'Inter',sans-serif" }}>
              Vedi tutti <ArrowRight size={13}/>
            </button>
          </div>
          <div>
            {nextEvents.length===0
              ? <div style={{ padding:'28px', textAlign:'center', color:'#9CA3AF', fontSize:'13px' }}>Nessun evento in programma</div>
              : nextEvents.map(ev => (
                <div key={ev.id} style={{ display:'flex', alignItems:'center', gap:'14px', padding:'12px 20px', borderBottom:'1px solid #F9FAFB', cursor:'default', transition:'background .12s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#FAFBFE'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <div style={{ width:'36px', height:'36px', borderRadius:'20px', background:'#EEEFFD', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <CalendarDays size={16} style={{color:P}}/>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontWeight:'600', color:'#111827', margin:'0 0 2px', fontSize:'13px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ev.titolo}</p>
                    <p style={{ fontSize:'12px', color:'#9CA3AF', margin:0 }}>{formatDateShort(ev.data_inizio)} · {ev.luogo||'—'}</p>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <p style={{ fontSize:'14px', fontWeight:'700', color:P, margin:'0 0 1px' }}>{ev.iscritti}</p>
                    <p style={{ fontSize:'11px', color:'#9CA3AF', margin:0 }}>iscritti</p>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* Ultimi eventi */}
      <div style={{ background:'#fff', borderRadius:'20px', border:'1px solid #E8ECF4', overflow:'hidden', boxShadow:'0 1px 4px rgba(20,20,40,.05)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 20px 0' }}>
          <h2 style={{ fontSize:'14px', fontWeight:'600', color:'#111827', margin:0 }}>Ultimi eventi</h2>
          <button onClick={()=>navigate('/admin/eventi')} style={{ display:'flex', alignItems:'center', gap:'4px', background:'none', border:'none', cursor:'pointer', fontSize:'13px', color:P, fontWeight:'600', fontFamily:"'Inter',sans-serif" }}>
            Vedi tutti <ArrowRight size={13}/>
          </button>
        </div>

        <div style={{ padding:'12px 20px 0', borderBottom:'1px solid #F3F4F6' }}>
          <GlowTabBar active={tabFilter} onChange={setTabFilter} tabs={[
            {id:'tutti',label:'Tutti',color:'blue'},
            {id:'pubblicato',label:'Pubblicati',color:'green'},
            {id:'bozza',label:'Bozze',color:'amber'},
            {id:'chiuso',label:'Chiusi',color:'coral'},
            {id:'archiviato',label:'Archiviati',color:'violet'},
          ]}/>
        </div>

        {loading ? (
          <div style={{ padding:'48px', textAlign:'center', color:'#9CA3AF' }}>
            <Clock size={24} style={{marginBottom:'8px'}}/>
            <p style={{margin:0,fontSize:'14px'}}>Caricamento…</p>
          </div>
        ) : events.filter(ev=>tabFilter==='tutti'||ev.stato===tabFilter).length===0 ? (
          <div style={{ padding:'64px 32px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center' }}>
            <CalendarDays size={40} style={{color:'#D1D5DB',marginBottom:'12px'}}/>
            <p style={{fontSize:'18px',fontWeight:'700',color:'#111827',margin:'0 0 6px',letterSpacing:'-0.02em'}}>Nessun evento ancora</p>
            <p style={{fontSize:'14px',color:'#6B7280',margin:'0 0 16px'}}>Crea il tuo primo evento per iniziare</p>
            <button onClick={()=>navigate('/admin/eventi/nuovo/editor')} style={{ display:'flex',alignItems:'center',gap:'7px',background:P,color:'#fff',border:'none',borderRadius:'20px',padding:'10px 20px',fontSize:'14px',fontWeight:'600',fontFamily:"'Inter',sans-serif",cursor:'pointer' }}>
              <Plus size={16}/> Crea evento
            </button>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:'12px', padding:'16px 20px 20px' }} className="event-card-grid">
            {events.filter(ev=>tabFilter==='tutti'||ev.stato===tabFilter).map(ev => {
              const fillPct = ev.capienza_max>0 ? Math.min(Math.round((ev.iscritti/ev.capienza_max)*100),100) : null
              const presRate = ev.iscritti>0 ? Math.round((ev.presenti/ev.iscritti)*100) : null
              const sc = STATUS_COLORS[ev.stato]||STATUS_COLORS.bozza
              const accent = ev.stato==='pubblicato' ? '#22C55E' : ev.stato==='chiuso' ? '#F59E0B' : ev.stato==='archiviato' ? '#9CA3AF' : '#E8ECF4'
              return (
                <div key={ev.id} style={{ background:'#fff', border:'1px solid #E8ECF4', borderRadius:'16px', padding:'16px', display:'flex', flexDirection:'column', transition:'all .18s', cursor:'default', boxShadow:'0 1px 3px rgba(20,20,40,.04)' }}
                  onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 8px 24px rgba(20,20,40,.09)';e.currentTarget.style.transform='translateY(-2px)'}}
                  onMouseLeave={e=>{e.currentTarget.style.boxShadow='0 1px 3px rgba(20,20,40,.04)';e.currentTarget.style.transform='none'}}>

                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'8px', marginBottom:'12px' }}>
                    <div style={{ minWidth:0 }}>
                      <p style={{ fontWeight:'600', fontSize:'13px', color:'#111827', margin:'0 0 4px', lineHeight:1.4, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{ev.titolo}</p>
                      <span style={{ fontSize:'10px', fontWeight:'600', color:P, background:'#EEEFFD', padding:'1px 7px', borderRadius:'20px', fontFamily:'monospace' }}>
                        EVT-{String(ev.codice||0).padStart(4,'0')}
                      </span>
                    </div>
                    <span style={{ flexShrink:0, padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'600', background:sc.bg, color:sc.text, whiteSpace:'nowrap' }}>
                      {STATUS_LABELS[ev.stato]||ev.stato}
                    </span>
                  </div>

                  <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'14px' }}>
                    <CalendarDays size={12} style={{color:'#9CA3AF',flexShrink:0}}/>
                    <span style={{ fontSize:'12px', color:'#6B7280' }}>{ev.data_inizio ? formatDate(ev.data_inizio) : '—'}{ev.luogo ? ` · ${ev.luogo}` : ''}</span>
                  </div>

                  <div style={{ marginBottom:'14px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:'6px' }}>
                      <span style={{ fontSize:'11px', color:'#9CA3AF', fontWeight:'500' }}>Iscritti</span>
                      <span style={{ fontSize:'13px', fontWeight:'700', color:'#111827' }}>
                        {ev.iscritti}{ev.capienza_max>0 && <span style={{fontWeight:'400',color:'#9CA3AF',fontSize:'11px'}}>/{ev.capienza_max}</span>}
                      </span>
                    </div>
                    <div style={{ height:'5px', background:'#F3F4F6', borderRadius:'99px', overflow:'hidden' }}>
                      {fillPct!=null && <div style={{ width:`${fillPct}%`, height:'100%', borderRadius:'99px', transition:'width .3s', background: fillPct>=90?'#EF4444':fillPct>=70?'#F59E0B':P }}/>}
                    </div>
                  </div>

                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'auto' }}>
                    <span style={{ fontSize:'11px', color:'#9CA3AF' }}>{presRate!=null ? `${presRate}% presenti` : 'Nessun check-in'}</span>
                    <button onClick={()=>navigate('/admin/eventi')} style={{ background:'none', border:`1px solid ${P}30`, color:P, borderRadius:'20px', padding:'4px 12px', fontSize:'12px', fontWeight:'600', fontFamily:"'Inter',sans-serif", cursor:'pointer' }}>
                      Gestisci
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
