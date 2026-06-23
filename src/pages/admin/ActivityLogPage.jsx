import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Activity, Search, RefreshCw, User, CalendarDays, Filter, ChevronDown } from 'lucide-react'

const AZIONE_LABELS = {
  checkin_qr:      { label:'Check-in QR',       color:'#16A34A', bg:'#F0FDF4' },
  checkin_manuale: { label:'Check-in manuale',   color:'#D97706', bg:'#FEF3C7' },
  iscrizione:      { label:'Nuova iscrizione',   color:'#2563EB', bg:'#EFF6FF' },
  cancellazione:   { label:'Cancellazione',      color:'#DC2626', bg:'#FEF2F2' },
  evento_creato:   { label:'Evento creato',      color:'#7C3AED', bg:'#F5F3FF' },
  evento_modifica: { label:'Evento modificato',  color:'#0891B2', bg:'#ECFEFF' },
  evento_stato:    { label:'Cambio stato',       color:'#059669', bg:'#ECFDF5' },
  login:           { label:'Accesso',            color:'#6B7280', bg:'#F9FAFB' },
  utente_creato:   { label:'Utente creato',      color:'#7C3AED', bg:'#F5F3FF' },
  export:          { label:'Export dati',        color:'#0891B2', bg:'#ECFEFF' },
}

function AzioneBadge({ azione }) {
  const c = AZIONE_LABELS[azione] || { label: azione, color:'#6B7280', bg:'#F9FAFB' }
  return (
    <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 10px', borderRadius:'20px',
      fontSize:'11px', fontWeight:'700', color:c.color, backgroundColor:c.bg, whiteSpace:'nowrap' }}>
      {c.label}
    </span>
  )
}

function fmtDt(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('it-IT', {
    day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit'
  })
}

function relTime(ts) {
  if (!ts) return ''
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'ora'
  if (m < 60) return `${m}m fa`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h fa`
  const d = Math.floor(h / 24)
  return `${d}g fa`
}

export default function ActivityLogPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterAzione, setFilterAzione] = useState('tutti')
  const [total, setTotal] = useState(0)
  const PAGE = 50

  useEffect(() => { loadLogs() }, [filterAzione])

  async function loadLogs() {
    setLoading(true)
    let q = supabase
      .from('activity_log')
      .select('*', { count:'exact' })
      .order('created_at', { ascending:false })
      .limit(PAGE)

    if (filterAzione !== 'tutti') q = q.eq('azione', filterAzione)

    const { data, count } = await q
    // normalizza nomi colonne (compatibilità schema legacy)
    const normalized = (data || []).map(l => ({
      ...l,
      utente_nome:   l.utente_nome   || l.username || null,
      evento_titolo: l.evento_titolo || null,
      ip_address:    l.ip_address    || l.ip || null,
      dettaglio:     l.dettaglio     || l.dettagli || null,
    }))
    setLogs(normalized)
    setTotal(count || 0)
    setLoading(false)
  }

  const filtered = logs.filter(l => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      l.utente_nome?.toLowerCase().includes(q) ||
      l.dettaglio?.toLowerCase().includes(q) ||
      l.evento_titolo?.toLowerCase().includes(q) ||
      l.azione?.toLowerCase().includes(q)
    )
  })

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Log Attività</h1>
          <p style={s.sub}>{total.toLocaleString('it-IT')} eventi registrati</p>
        </div>
        <button onClick={loadLogs} style={s.refreshBtn} disabled={loading}>
          <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Aggiorna
        </button>
      </div>

      {/* Filtri */}
      <div style={{ display:'flex', gap:'10px', marginBottom:'20px', flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:'200px' }}>
          <Search size={15} style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cerca utente, azione, evento…"
            style={{ ...s.input, paddingLeft:'36px', width:'100%', boxSizing:'border-box' }}
          />
        </div>
        <div style={{ position:'relative' }}>
          <Filter size={14} style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }} />
          <select value={filterAzione} onChange={e => setFilterAzione(e.target.value)} style={{ ...s.input, paddingLeft:'30px', paddingRight:'32px', appearance:'none', cursor:'pointer' }}>
            <option value="tutti">Tutte le azioni</option>
            {Object.entries(AZIONE_LABELS).map(([k,v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <ChevronDown size={14} style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', color:'#9CA3AF', pointerEvents:'none' }} />
        </div>
      </div>

      {/* Tabella */}
      <div style={s.tableCard}>
        {loading && filtered.length === 0 ? (
          <div style={s.emptyState}>
            <Activity size={32} style={{ color:'#D1D5DB', marginBottom:'12px' }} />
            <p style={{ color:'#9CA3AF', fontSize:'14px', margin:0 }}>Caricamento…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={s.emptyState}>
            <Activity size={32} style={{ color:'#D1D5DB', marginBottom:'12px' }} />
            <p style={{ fontWeight:'700', color:'#374151', margin:'0 0 4px' }}>Nessuna attività trovata</p>
            <p style={{ color:'#9CA3AF', fontSize:'13px', margin:0 }}>Il log verrà popolato automaticamente con l'uso del portale.</p>
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['Quando','Azione','Utente','Evento / Dettaglio','IP'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l.id} style={s.tr}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={s.td}>
                      <p style={{ fontSize:'13px', color:'#374151', margin:0, whiteSpace:'nowrap' }}>{fmtDt(l.created_at)}</p>
                      <p style={{ fontSize:'11px', color:'#9CA3AF', margin:'2px 0 0' }}>{relTime(l.created_at)}</p>
                    </td>
                    <td style={s.td}>
                      <AzioneBadge azione={l.azione} />
                    </td>
                    <td style={s.td}>
                      {l.utente_nome ? (
                        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                          <div style={{ width:'28px', height:'28px', borderRadius:'50%', backgroundColor:'#EEF3FF', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            <User size={14} style={{ color:'#003DA5' }} />
                          </div>
                          <p style={{ fontSize:'13px', fontWeight:'600', color:'#0A0A0A', margin:0 }}>{l.utente_nome}</p>
                        </div>
                      ) : (
                        <span style={{ fontSize:'13px', color:'#9CA3AF' }}>Sistema</span>
                      )}
                    </td>
                    <td style={s.td}>
                      {l.evento_titolo && (
                        <p style={{ fontSize:'12px', fontWeight:'600', color:'#003DA5', margin:'0 0 2px' }}>{l.evento_titolo}</p>
                      )}
                      {l.dettaglio && (
                        <p style={{ fontSize:'13px', color:'#374151', margin:0 }}>{l.dettaglio}</p>
                      )}
                      {!l.evento_titolo && !l.dettaglio && <span style={{ color:'#D1D5DB' }}>—</span>}
                    </td>
                    <td style={s.td}>
                      <span style={{ fontSize:'11px', color:'#9CA3AF', fontFamily:'monospace' }}>{l.ip_address || '—'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filtered.length >= PAGE && (
        <p style={{ fontSize:'12px', color:'#9CA3AF', textAlign:'center', marginTop:'12px' }}>
          Visualizzati i primi {PAGE} risultati. Usa i filtri per affinare la ricerca.
        </p>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

const s = {
  page: { maxWidth:'1100px' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px', gap:'12px', flexWrap:'wrap' },
  title: { fontSize:'32px', fontWeight:'900', color:'#0A0A0A', letterSpacing:'-0.03em', margin:0 },
  sub: { fontSize:'14px', color:'#6B7280', margin:'4px 0 0', fontWeight:'500' },
  refreshBtn: { display:'flex', alignItems:'center', gap:'6px', border:'1px solid #E5E7EB', backgroundColor:'#fff', borderRadius:'6px', padding:'8px 14px', fontSize:'13px', fontWeight:'600', cursor:'pointer', fontFamily:"'Inter',sans-serif", color:'#374151' },
  input: { border:'1px solid #D1D5DB', borderRadius:'6px', padding:'9px 12px', fontSize:'13px', fontFamily:"'Inter',sans-serif", color:'#0A0A0A', backgroundColor:'#fff', outline:'none' },
  tableCard: { backgroundColor:'#fff', borderRadius:'8px', border:'1px solid #E5E7EB', overflow:'hidden' },
  table: { width:'100%', borderCollapse:'collapse', fontSize:'13px' },
  th: { padding:'10px 16px', textAlign:'left', fontSize:'11px', fontWeight:'600', color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:'1px solid #E5E7EB', backgroundColor:'#FAFAFA', whiteSpace:'nowrap' },
  tr: { transition:'background-color 0.1s' },
  td: { padding:'12px 16px', borderBottom:'1px solid #F3F4F6', verticalAlign:'middle' },
  emptyState: { padding:'64px 32px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center' },
}
