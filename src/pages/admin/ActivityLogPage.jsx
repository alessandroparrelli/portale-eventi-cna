import { useEffect, useState, useMemo } from 'react'
import { usePageTitle } from '../../hooks/usePageTitle'
import { supabase } from '../../lib/supabase'
import { Activity, Search, RefreshCw, User, ChevronDown, ChevronRight } from 'lucide-react'
import GlowTabBar from '../../components/GlowTabBar'
import GlowTableHead from '../../components/GlowTableHead'

const AZIONE_LABELS = {
  checkin_qr:            { label:'Check-in QR',           color:'#16A34A', bg:'#F0FDF4' },
  checkin_manuale:       { label:'Check-in manuale',       color:'#D97706', bg:'#FEF3C7' },
  iscrizione:            { label:'Nuova iscrizione',       color:'#2563EB', bg:'#EFF6FF' },
  cancellazione:         { label:'Cancellazione',          color:'#DC2626', bg:'#FEF2F2' },
  evento_creato:         { label:'Evento creato',          color:'#7C3AED', bg:'#F5F3FF' },
  evento_modificato:     { label:'Evento modificato',      color:'#0891B2', bg:'#ECFEFF' },
  evento_eliminato:      { label:'Evento eliminato',       color:'#DC2626', bg:'#FEF2F2' },
  evento_stato:          { label:'Cambio stato',           color:'#059669', bg:'#ECFDF5' },
  login:                 { label:'Accesso',                color:'#6B7280', bg:'#F9FAFB' },
  logout:                { label:'Disconnessione',         color:'#6B7280', bg:'#F9FAFB' },
  utente_creato:         { label:'Utente creato',          color:'#7C3AED', bg:'#F5F3FF' },
  utente_modificato:     { label:'Utente modificato',      color:'#0891B2', bg:'#ECFEFF' },
  utente_eliminato:      { label:'Utente eliminato',       color:'#DC2626', bg:'#FEF2F2' },
  ruolo_creato:          { label:'Ruolo creato',           color:'#7C3AED', bg:'#F5F3FF' },
  ruolo_modificato:      { label:'Ruolo modificato',       color:'#0891B2', bg:'#ECFEFF' },
  ruolo_eliminato:       { label:'Ruolo eliminato',        color:'#DC2626', bg:'#FEF2F2' },
  iscritto_eliminato:    { label:'Iscritto eliminato',     color:'#DC2626', bg:'#FEF2F2' },
  iscritto_modificato:   { label:'Iscritto modificato',    color:'#0891B2', bg:'#ECFEFF' },
  iscritto_manuale:      { label:'Iscritto manuale',       color:'#7C3AED', bg:'#F5F3FF' },
  iscritti_importati:    { label:'Iscritti importati',     color:'#0891B2', bg:'#ECFEFF' },
  iscritti_esportati:    { label:'Iscritti esportati',     color:'#0891B2', bg:'#ECFEFF' },
  email_template_salvato:{ label:'Template email salvato', color:'#E85D24', bg:'#FFF7ED' },
  email_test_inviata:    { label:'Email di test inviata',  color:'#E85D24', bg:'#FFF7ED' },
  export:                { label:'Export dati',            color:'#0891B2', bg:'#ECFEFF' },
  sms_inviato:           { label:'SMS inviato',            color:'#059669', bg:'#ECFDF5' },
}

// Azioni che aprono una nuova sessione
const SESSION_STARTERS = new Set(['login'])
// Timeout tra azioni che crea sessione implicita (minuti)
const SESSION_GAP_MINUTES = 60

function AzioneBadge({ azione, small }) {
  const c = AZIONE_LABELS[azione] || { label: azione, color:'#6B7280', bg:'#F9FAFB' }
  return (
    <span style={{
      display:'inline-flex', alignItems:'center',
      padding: small ? '2px 7px' : '3px 10px',
      borderRadius:'20px',
      fontSize: small ? '10px' : '11px',
      fontWeight:'700', color:c.color, backgroundColor:c.bg, whiteSpace:'nowrap'
    }}>
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

function fmtTime(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('it-IT', { hour:'2-digit', minute:'2-digit', second:'2-digit' })
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

function durataStr(startTs, endTs) {
  const diff = new Date(endTs).getTime() - new Date(startTs).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return '< 1 min'
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rm = m % 60
  return rm > 0 ? `${h}h ${rm}m` : `${h}h`
}

function parseDettaglio(raw) {
  if (!raw) return null
  if (typeof raw === 'object') return raw
  try { return JSON.parse(raw) } catch { return null }
}

function DettaglioInline({ raw }) {
  const d = parseDettaglio(raw)
  if (!d) return null
  // Se ha una chiave "nome", mostrala direttamente
  if (d.nome) return <span style={{ color:'#374151' }}>{d.nome}</span>
  // altrimenti mostra key: value compatti
  const entries = Object.entries(d).filter(([k]) => k !== 'nome')
  if (!entries.length) return null
  return (
    <span style={{ color:'#6B7280', fontSize:'11px' }}>
      {entries.map(([k, v]) => `${k}: ${v}`).join(' · ')}
    </span>
  )
}

// Raggruppa i log in sessioni per utente
function buildSessions(logs) {
  if (!logs.length) return []

  // Ordina cronologicamente
  const sorted = [...logs].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

  const sessions = []
  let current = null

  for (const log of sorted) {
    const ts = new Date(log.created_at).getTime()
    const utenteKey = log.utente_nome || 'Sistema'

    const isNewSession =
      !current ||
      current.utente_nome !== utenteKey ||
      SESSION_STARTERS.has(log.azione) ||
      (ts - new Date(current.last_at).getTime()) > SESSION_GAP_MINUTES * 60000

    if (isNewSession) {
      current = {
        id: log.id + '_sess',
        utente_nome: utenteKey,
        utente_avatar: log.utente_avatar || null,
        ip_address: log.ip_address || log.ip || null,
        started_at: log.created_at,
        last_at: log.created_at,
        logs: [log],
      }
      sessions.push(current)
    } else {
      current.last_at = log.created_at
      current.logs.push(log)
    }
  }

  // Ritorna in ordine decrescente (la sessione piu recente prima)
  return sessions.reverse()
}

function SessionRow({ session, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen || false)

  const azioni = session.logs.map(l => l.azione)
  const uniqueAzioni = [...new Set(azioni)]

  // Riassunto: conta per azione
  const counts = {}
  for (const a of azioni) counts[a] = (counts[a] || 0) + 1

  const isMulti = session.logs.length > 1
  const durata = isMulti ? durataStr(session.started_at, session.last_at) : null

  return (
    <>
      {/* Riga sessione */}
      <tr
        style={{
          ...s.tr,
          cursor: isMulti ? 'pointer' : 'default',
          backgroundColor: open ? '#FAFBFF' : 'transparent',
        }}
        onClick={() => isMulti && setOpen(o => !o)}
        onMouseEnter={e => { if (!open) e.currentTarget.style.backgroundColor = '#F9FAFB' }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.backgroundColor = 'transparent' }}
      >
        {/* Quando */}
        <td style={s.td}>
          <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
            {isMulti && (
              open
                ? <ChevronDown size={14} style={{ color:'#9CA3AF', flexShrink:0 }} />
                : <ChevronRight size={14} style={{ color:'#9CA3AF', flexShrink:0 }} />
            )}
            <div>
              <p style={{ fontSize:'13px', color:'#374151', margin:0, whiteSpace:'nowrap' }}>
                {fmtDt(session.started_at)}
              </p>
              <p style={{ fontSize:'11px', color:'#9CA3AF', margin:'2px 0 0' }}>
                {relTime(session.started_at)}
                {durata && <span style={{ marginLeft:'6px', color:'#D1D5DB' }}>· {durata}</span>}
              </p>
            </div>
          </div>
        </td>

        {/* Azioni */}
        <td style={s.td}>
          {isMulti ? (
            <div style={{ display:'flex', flexWrap:'wrap', gap:'4px', alignItems:'center' }}>
              {uniqueAzioni.slice(0, 4).map(a => (
                <span key={a} style={{ position:'relative' }}>
                  <AzioneBadge azione={a} small />
                  {counts[a] > 1 && (
                    <span style={{
                      position:'absolute', top:'-5px', right:'-5px',
                      background:'#003DA5', color:'#fff', borderRadius:'10px',
                      fontSize:'9px', fontWeight:'800', padding:'1px 4px', lineHeight:'1.2',
                      minWidth:'14px', textAlign:'center'
                    }}>{counts[a]}</span>
                  )}
                </span>
              ))}
              {uniqueAzioni.length > 4 && (
                <span style={{ fontSize:'11px', color:'#9CA3AF' }}>+{uniqueAzioni.length - 4}</span>
              )}
              <span style={{ fontSize:'11px', color:'#9CA3AF', marginLeft:'4px' }}>
                ({session.logs.length} op.)
              </span>
            </div>
          ) : (
            <AzioneBadge azione={session.logs[0].azione} />
          )}
        </td>

        {/* Utente */}
        <td style={s.td} className="col-hide-mobile">
          {session.utente_nome !== 'Sistema' ? (
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <div style={{ width:'28px', height:'28px', borderRadius:'50%', backgroundColor:'#FEE4E6', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <User size={14} style={{ color:'#E11D48' }} />
              </div>
              <p style={{ fontSize:'13px', fontWeight:'600', color:'#0A0A0A', margin:0 }}>
                {session.utente_nome}
              </p>
            </div>
          ) : (
            <span style={{ fontSize:'13px', color:'#9CA3AF' }}>Sistema</span>
          )}
        </td>

        {/* Evento / Dettaglio */}
        <td style={s.td}>
          {!isMulti ? (
            <>
              {session.logs[0].evento_titolo && (
                <p style={{ fontSize:'12px', fontWeight:'600', color:'#E11D48', margin:'0 0 2px' }}>
                  {session.logs[0].evento_titolo}
                </p>
              )}
              <DettaglioInline raw={session.logs[0].dettaglio} />
              {!session.logs[0].evento_titolo && !session.logs[0].dettaglio && (
                <span style={{ color:'#D1D5DB' }}>—</span>
              )}
            </>
          ) : (
            // Lista eventi coinvolti (deduplicati)
            (() => {
              const eventi = [...new Set(
                session.logs.map(l => l.evento_titolo).filter(Boolean)
              )]
              return eventi.length > 0 ? (
                <div>
                  {eventi.slice(0, 2).map(e => (
                    <p key={e} style={{ fontSize:'12px', fontWeight:'600', color:'#E11D48', margin:'0 0 2px' }}>{e}</p>
                  ))}
                  {eventi.length > 2 && (
                    <p style={{ fontSize:'11px', color:'#9CA3AF', margin:0 }}>+{eventi.length - 2} altri</p>
                  )}
                </div>
              ) : <span style={{ color:'#D1D5DB' }}>—</span>
            })()
          )}
        </td>

        {/* IP */}
        <td style={s.td} className="col-hide-mobile">
          <span style={{ fontSize:'11px', color:'#9CA3AF', fontFamily:'monospace' }}>
            {session.ip_address || '—'}
          </span>
        </td>
      </tr>

      {/* Righe dettaglio espanse */}
      {open && session.logs.map((l, i) => (
        <tr key={l.id} style={{ backgroundColor:'#F8FAFF' }}>
          <td style={{ ...s.tdSub, paddingLeft:'36px' }}>
            <p style={{ fontSize:'12px', color:'#6B7280', margin:0, whiteSpace:'nowrap', fontFamily:'monospace' }}>
              {fmtTime(l.created_at)}
            </p>
          </td>
          <td style={s.tdSub}>
            <AzioneBadge azione={l.azione} small />
          </td>
          <td style={{ ...s.tdSub }} className="col-hide-mobile" />
          <td style={s.tdSub}>
            {l.evento_titolo && (
              <p style={{ fontSize:'11px', fontWeight:'600', color:'#E11D48', margin:'0 0 2px' }}>
                {l.evento_titolo}
              </p>
            )}
            <DettaglioInline raw={l.dettaglio} />
          </td>
          <td style={s.tdSub} className="col-hide-mobile" />
        </tr>
      ))}
    </>
  )
}

export default function ActivityLogPage() {
  usePageTitle('Log attività')
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterAzione, setFilterAzione] = useState('tutti')
  const [total, setTotal] = useState(0)
  const PAGE = 500

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
    const normalized = (data || []).map(l => {
      let dettaglio = l.dettaglio || l.dettagli || null
      if (dettaglio && typeof dettaglio === 'object') {
        dettaglio = JSON.stringify(dettaglio)
      }
      return {
        ...l,
        utente_nome:   l.utente_nome   || l.username || null,
        evento_titolo: l.evento_titolo || null,
        ip_address:    l.ip_address    || l.ip       || null,
        dettaglio,
      }
    })
    setLogs(normalized)
    setTotal(count || 0)
    setLoading(false)
  }

  const sessions = useMemo(() => {
    let filtered = logs
    if (search) {
      const q = search.toLowerCase()
      filtered = logs.filter(l =>
        l.utente_nome?.toLowerCase().includes(q) ||
        l.dettaglio?.toLowerCase().includes(q) ||
        l.evento_titolo?.toLowerCase().includes(q) ||
        l.azione?.toLowerCase().includes(q)
      )
    }
    return buildSessions(filtered)
  }, [logs, search])

  return (
    <div style={s.page} className="admin-page">
      <div style={s.header} className="page-header-row">
        <div>
          <h1 style={s.title}>Log Attività</h1>
          <p style={s.sub}>{total.toLocaleString('it-IT')} eventi · {sessions.length} sessioni</p>
        </div>
        <button onClick={loadLogs} style={s.refreshBtn} disabled={loading}>
          <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Aggiorna
        </button>
      </div>

      <GlowTabBar
        active={filterAzione}
        onChange={setFilterAzione}
        tabs={[
          { id:'tutti',           label:'Tutto',         icon:'📋', color:'blue'   },
          { id:'iscrizione',      label:'Iscrizioni',    icon:'✅', color:'green'  },
          { id:'checkin_qr',      label:'Check-in QR',   icon:'📱', color:'cyan'   },
          { id:'checkin_manuale', label:'Check-in man.',  icon:'✋', color:'amber' },
          { id:'evento_creato',   label:'Nuovi eventi',  icon:'🗓', color:'violet' },
          { id:'login',           label:'Accessi',       icon:'🔑', color:'coral'  },
        ]}
      />

      <div style={{ display:'flex', gap:'10px', marginBottom:'16px', marginTop:'-8px' }}>
        <div style={{ position:'relative', flex:1, maxWidth:'380px' }}>
          <Search size={15} style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cerca utente, azione, evento…"
            style={{ ...s.input, paddingLeft:'36px', width:'100%', boxSizing:'border-box' }}
          />
        </div>
      </div>

      <div style={s.tableCard}>
        {loading && sessions.length === 0 ? (
          <div style={s.emptyState}>
            <Activity size={32} style={{ color:'#D1D5DB', marginBottom:'12px' }} />
            <p style={{ color:'#9CA3AF', fontSize:'14px', margin:0 }}>Caricamento…</p>
          </div>
        ) : sessions.length === 0 ? (
          <div style={s.emptyState}>
            <Activity size={32} style={{ color:'#D1D5DB', marginBottom:'12px' }} />
            <p style={{ fontWeight:'700', color:'#374151', margin:'0 0 4px' }}>Nessuna attività trovata</p>
            <p style={{ color:'#9CA3AF', fontSize:'13px', margin:0 }}>Il log verrà popolato automaticamente con l'uso del portale.</p>
          </div>
        ) : (
          <div style={{ overflowX:'auto' }} className="table-wrap">
            <table style={s.table}>
              <GlowTableHead columns={[
                { label:'Quando',             color:'blue'    },
                { label:'Operazioni',         color:'violet'  },
                { label:'Utente',             color:'green',  hideOnMobile:true },
                { label:'Evento / Dettaglio', color:'amber'   },
                { label:'IP',                 color:'neutral', hideOnMobile:true },
              ]}/>
              <tbody>
                {sessions.map((sess, i) => (
                  <SessionRow key={sess.id} session={sess} defaultOpen={i === 0 && sess.logs.length > 1} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {total > PAGE && (
        <p style={{ fontSize:'12px', color:'#9CA3AF', textAlign:'center', marginTop:'12px' }}>
          Visualizzati {total} eventi su {total} totali. Usa i filtri per affinare la ricerca.
        </p>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

const s = {
  page: { width:'100%' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px', gap:'12px', flexWrap:'wrap' },
  title: { fontSize:'32px', fontWeight:'900', color:'#0A0A0A', letterSpacing:'-0.03em', margin:0 },
  sub: { fontSize:'14px', color:'#6B7280', margin:'4px 0 0', fontWeight:'500' },
  refreshBtn: { display:'flex', alignItems:'center', gap:'6px', border:'1px solid #E5E7EB', backgroundColor:'#fff', borderRadius:'6px', padding:'8px 14px', fontSize:'13px', fontWeight:'600', cursor:'pointer', fontFamily:"'Outfit',sans-serif", color:'#374151' },
  input: { border:'1px solid #D1D5DB', borderRadius:'6px', padding:'9px 12px', fontSize:'13px', fontFamily:"'Outfit',sans-serif", color:'#0A0A0A', backgroundColor:'#fff', outline:'none' },
  tableCard: { backgroundColor:'#fff', borderRadius:'8px', border:'1px solid #E5E7EB', overflow:'hidden' },
  table: { width:'100%', borderCollapse:'collapse', fontSize:'13px' },
  tr: { transition:'background-color 0.1s', borderBottom:'1px solid #F3F4F6' },
  td: { padding:'12px 16px', verticalAlign:'middle' },
  tdSub: { padding:'7px 16px', verticalAlign:'middle', borderBottom:'1px solid #EEF0F8', fontSize:'12px' },
  emptyState: { padding:'64px 32px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center' },
}
