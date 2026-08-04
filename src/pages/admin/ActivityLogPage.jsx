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

function fmtTime(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('it-IT', { hour:'2-digit', minute:'2-digit', second:'2-digit' })
}

function fmtDayLabel(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  const oggi = new Date()
  const ieri = new Date(); ieri.setDate(oggi.getDate() - 1)
  const fmtFull = d.toLocaleDateString('it-IT', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
  if (d.toDateString() === oggi.toDateString()) return 'Oggi — ' + fmtFull
  if (d.toDateString() === ieri.toDateString()) return 'Ieri — ' + fmtFull
  return fmtFull.charAt(0).toUpperCase() + fmtFull.slice(1)
}

function parseDettaglio(raw) {
  if (!raw) return null
  if (typeof raw === 'object') return raw
  try { return JSON.parse(raw) } catch { return null }
}

function DettaglioText({ raw }) {
  const d = parseDettaglio(raw)
  if (!d || !Object.keys(d).length) return null
  if (d.nome) return <span>{d.nome}</span>
  return <span>{Object.entries(d).map(([k,v]) => `${k}: ${v}`).join(' · ')}</span>
}

// Conta badge con contatore
function AzioniBadges({ logs, small }) {
  const counts = {}
  for (const l of logs) counts[l.azione] = (counts[l.azione] || 0) + 1
  const entries = Object.entries(counts)
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:'4px', alignItems:'center' }}>
      {entries.slice(0, 5).map(([a, n]) => (
        <span key={a} style={{ position:'relative', display:'inline-flex' }}>
          <AzioneBadge azione={a} small={small} />
          {n > 1 && (
            <span style={{
              position:'absolute', top:'-5px', right:'-5px',
              background:'#5B5FEF', color:'#fff', borderRadius:'14px',
              fontSize:'9px', fontWeight:'800', padding:'1px 4px', lineHeight:'1.2',
              minWidth:'14px', textAlign:'center'
            }}>{n}</span>
          )}
        </span>
      ))}
      {entries.length > 5 && (
        <span style={{ fontSize:'11px', color:'#9CA3AF' }}>+{entries.length - 5}</span>
      )}
    </div>
  )
}

// Spezza i log di un utente in sessioni basate sul gap temporale
function splitIntoSessions(logs) {
  const sorted = [...logs].sort((a,b) => new Date(a.created_at) - new Date(b.created_at))
  const sessions = []
  let cur = null
  for (const l of sorted) {
    const ts = new Date(l.created_at).getTime()
    if (!cur || (ts - new Date(cur.last_at).getTime()) > SESSION_GAP_MINUTES * 60000) {
      cur = { start: l.created_at, last_at: l.created_at, logs: [l] }
      sessions.push(cur)
    } else {
      cur.last_at = l.created_at
      cur.logs.push(l)
    }
  }
  return sessions
}

// Riga singola operazione (livello 3)
function OpRow({ log }) {
  const d = parseDettaglio(log.dettaglio)
  const hasDetail = d && Object.keys(d).length > 0
  const meta = parseDettaglio(log.metadata) || {}

  // Icona dispositivo
  const devIcon = meta.dispositivo === 'Mobile' ? '📱' : meta.dispositivo === 'Tablet' ? '🖥️' : meta.dispositivo === 'Desktop' ? '💻' : null

  // Etichetta geo
  const geo = [meta.citta, meta.paese].filter(Boolean).join(', ')

  return (
    <tr style={{ backgroundColor:'#F5F7FF' }}>
      <td style={{ ...s.tdL3, width:'90px', paddingLeft:'64px' }}>
        <span style={{ fontFamily:'monospace', fontSize:'11px', color:'#9CA3AF' }}>
          {fmtTime(log.created_at)}
        </span>
      </td>
      <td style={s.tdL3}>
        <AzioneBadge azione={log.azione} small />
      </td>
      <td style={{ ...s.tdL3, color:'#374151', fontSize:'12px' }}>
        {log.evento_titolo && (
          <span style={{ fontWeight:'600', color:'#5B5FEF', marginRight:'6px' }}>
            {log.evento_titolo}
          </span>
        )}
        {hasDetail && <DettaglioText raw={log.dettaglio} />}
        {!log.evento_titolo && !hasDetail && <span style={{ color:'#D1D5DB' }}>—</span>}
      </td>
      {/* Dispositivo + browser */}
      <td style={s.tdL3}>
        {(meta.browser || meta.dispositivo) ? (
          <span style={{ fontSize:'11px', color:'#6B7280', whiteSpace:'nowrap' }}>
            {devIcon && <span style={{ marginRight:'4px' }}>{devIcon}</span>}
            {[meta.browser, meta.os].filter(Boolean).join(' · ')}
          </span>
        ) : <span style={{ color:'#E8ECF4' }}>—</span>}
      </td>
      {/* Geo + IP */}
      <td style={s.tdL3}>
        <div>
          {geo && <p style={{ fontSize:'11px', color:'#6B7280', margin:0 }}>📍 {geo}</p>}
          {log.ip_address && (
            <p style={{ fontSize:'10px', color:'#9CA3AF', fontFamily:'monospace', margin:0 }}>{log.ip_address}</p>
          )}
          {!geo && !log.ip_address && <span style={{ color:'#E8ECF4' }}>—</span>}
        </div>
      </td>
    </tr>
  )
}

// Riga sessione (livello 2) — espandibile → mostra operazioni
function SessionBlock({ session, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen || false)
  const n = session.logs.length
  const durMin = Math.round((new Date(session.last_at) - new Date(session.start)) / 60000)
  const durLabel = durMin < 1 ? null : durMin < 60 ? `${durMin} min` : `${Math.floor(durMin/60)}h ${durMin%60 ? durMin%60+'m' : ''}`

  return (
    <>
      <tr
        style={{ ...s.trSess, cursor: n > 1 ? 'pointer' : 'default', backgroundColor: open ? '#EEF2FF' : '#F8FAFF' }}
        onClick={() => n > 0 && setOpen(o => !o)}
        onMouseEnter={e => { if (!open) e.currentTarget.style.backgroundColor = '#EFF1FF' }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.backgroundColor = '#F8FAFF' }}
      >
        <td style={{ ...s.tdL2, paddingLeft:'36px', width:'130px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
            {open
              ? <ChevronDown size={12} style={{ color:'#9CA3AF', flexShrink:0 }} />
              : <ChevronRight size={12} style={{ color:'#9CA3AF', flexShrink:0 }} />}
            <div>
              <span style={{ fontFamily:'monospace', fontSize:'12px', color:'#374151' }}>
                {fmtTime(session.start)}
              </span>
              {durLabel && (
                <span style={{ fontSize:'10px', color:'#9CA3AF', marginLeft:'5px' }}>
                  {durLabel}
                </span>
              )}
            </div>
          </div>
        </td>
        <td style={s.tdL2}>
          <AzioniBadges logs={session.logs} small />
        </td>
        <td style={s.tdL2}>
          <span style={{ fontSize:'11px', color:'#9CA3AF' }}>{n} {n === 1 ? 'op.' : 'op.'}</span>
        </td>
        <td style={s.tdL2} />
        <td style={s.tdL2}>
          <span style={{ fontSize:'11px', color:'#D1D5DB', fontFamily:'monospace' }}>
            {session.logs[0]?.ip_address || '—'}
          </span>
        </td>
      </tr>
      {open && session.logs.map(l => <OpRow key={l.id} log={l} />)}
    </>
  )
}

// Riga utente×giorno (livello 1) — espandibile → mostra sessioni
function UserDayRow({ utenteNome, sessions, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen || false)
  const allLogs = sessions.flatMap(s => s.logs)
  const nSess = sessions.length
  const nOp = allLogs.length

  return (
    <>
      <tr
        style={{ ...s.trUser, cursor:'pointer', backgroundColor: open ? '#FFF8F8' : '#fff' }}
        onClick={() => setOpen(o => !o)}
        onMouseEnter={e => { if (!open) e.currentTarget.style.backgroundColor = '#FFF5F5' }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.backgroundColor = '#fff' }}
      >
        {/* Utente */}
        <td style={s.tdL1}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            {open
              ? <ChevronDown size={15} style={{ color:'#9CA3AF', flexShrink:0 }} />
              : <ChevronRight size={15} style={{ color:'#9CA3AF', flexShrink:0 }} />}
            <div style={{ width:'30px', height:'30px', borderRadius:'50%', backgroundColor:'#EEEFFD', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <User size={15} style={{ color:'#5B5FEF' }} />
            </div>
            <span style={{ fontSize:'14px', fontWeight:'700', color:'#111827' }}>{utenteNome}</span>
          </div>
        </td>
        {/* Riepilogo azioni */}
        <td style={s.tdL1}>
          <AzioniBadges logs={allLogs} />
        </td>
        {/* Contatori */}
        <td style={s.tdL1}>
          <span style={{ fontSize:'12px', color:'#6B7280' }}>
            {nSess} {nSess === 1 ? 'sessione' : 'sessioni'} · {nOp} operazioni
          </span>
        </td>
        <td style={s.tdL1} />
        <td style={s.tdL1} />
      </tr>
      {open && sessions.map((sess, i) => (
        <SessionBlock key={sess.start + i} session={sess} defaultOpen={nSess === 1} />
      ))}
    </>
  )
}

// Costruisce struttura: [ { dateStr, utenti: [ { nome, sessions } ] } ]
function buildTree(logs) {
  // 1. Raggruppa per giorno (ora di Roma approssimata — usiamo locale del browser)
  const byDay = {}
  for (const l of logs) {
    const d = new Date(l.created_at)
    const dateStr = d.toLocaleDateString('sv-SE') // YYYY-MM-DD
    if (!byDay[dateStr]) byDay[dateStr] = {}
    const utente = l.utente_nome || 'Sistema'
    if (!byDay[dateStr][utente]) byDay[dateStr][utente] = []
    byDay[dateStr][utente].push(l)
  }

  // 2. Per ogni giorno/utente costruisce le sessioni
  const days = Object.keys(byDay).sort((a,b) => b.localeCompare(a)) // desc
  return days.map(dateStr => ({
    dateStr,
    utenti: Object.entries(byDay[dateStr]).map(([nome, uLogs]) => ({
      nome,
      sessions: splitIntoSessions(uLogs),
    })).sort((a,b) => a.nome.localeCompare(b.nome)),
  }))
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
      if (dettaglio && typeof dettaglio === 'object') dettaglio = JSON.stringify(dettaglio)
      return {
        ...l,
        utente_nome:   l.utente_nome || l.username || null,
        evento_titolo: l.evento_titolo || null,
        ip_address:    l.ip_address || l.ip || null,
        dettaglio,
      }
    })
    setLogs(normalized)
    setTotal(count || 0)
    setLoading(false)
  }

  const tree = useMemo(() => {
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
    return buildTree(filtered)
  }, [logs, search])

  return (
    <div style={s.page} className="admin-page">
      <div style={s.header} className="page-header-row">
        <div>
          <h1 style={s.title}>Log Attività</h1>
          <p style={s.sub}>{total.toLocaleString('it-IT')} eventi</p>
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
          { id:'tutti',           label:'Tutto',        icon:'📋', color:'blue'   },
          { id:'iscrizione',      label:'Iscrizioni',   icon:'✅', color:'green'  },
          { id:'checkin_qr',      label:'Check-in QR',  icon:'📱', color:'cyan'   },
          { id:'checkin_manuale', label:'Check-in man.', icon:'✋', color:'amber' },
          { id:'evento_creato',   label:'Nuovi eventi', icon:'🗓', color:'violet' },
          { id:'login',           label:'Accessi',      icon:'🔑', color:'coral'  },
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

      {loading && !tree.length ? (
        <div style={s.emptyState}>
          <Activity size={32} style={{ color:'#D1D5DB', marginBottom:'12px' }} />
          <p style={{ color:'#9CA3AF', fontSize:'14px', margin:0 }}>Caricamento…</p>
        </div>
      ) : !tree.length ? (
        <div style={s.emptyState}>
          <Activity size={32} style={{ color:'#D1D5DB', marginBottom:'12px' }} />
          <p style={{ fontWeight:'700', color:'#374151', margin:'0 0 4px' }}>Nessuna attività trovata</p>
        </div>
      ) : (
        tree.map((day, di) => (
          <div key={day.dateStr} style={{ marginBottom:'24px' }}>
            {/* Separatore giorno */}
            <div style={s.dayHeader}>
              <span style={s.dayLabel}>{fmtDayLabel(day.dateStr)}</span>
              <span style={s.dayMeta}>
                {day.utenti.length} {day.utenti.length === 1 ? 'utente' : 'utenti'} · {day.utenti.reduce((acc, u) => acc + u.sessions.flatMap(s => s.logs).length, 0)} operazioni
              </span>
            </div>

            <div style={s.tableCard}>
              <div style={{ overflowX:'auto' }} className="table-wrap">
                <table style={s.table}>
                  <GlowTableHead columns={[
                    { label:'Utente / Sessione' },
                    { label:'Operazioni' },
                    { label:'' },
                    { label:'Dispositivo', hideOnMobile:true },
                    { label:'Localita / IP', hideOnMobile:true },
                  ]} />
                  <tbody>
                    {day.utenti.map(u => (
                      <UserDayRow
                        key={u.nome}
                        utenteNome={u.nome}
                        sessions={u.sessions}
                        defaultOpen={di === 0 && day.utenti.length === 1}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))
      )}

      {total > PAGE && (
        <p style={{ fontSize:'12px', color:'#9CA3AF', textAlign:'center', marginTop:'12px' }}>
          Visualizzati gli ultimi {PAGE} eventi. Usa i filtri per affinare la ricerca.
        </p>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

const s = {
  page:       { width:'100%' },
  header:     { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px', gap:'12px', flexWrap:'wrap' },
  title:      { fontSize:'32px', fontWeight:'900', color:'#111827', letterSpacing:'-0.03em', margin:0 },
  sub:        { fontSize:'14px', color:'#6B7280', margin:'4px 0 0', fontWeight:'500' },
  refreshBtn: { display:'flex', alignItems:'center', gap:'6px', border:'1px solid #E8ECF4', backgroundColor:'#fff', borderRadius:'14px', padding:'8px 14px', fontSize:'13px', fontWeight:'600', cursor:'pointer', fontFamily:"'Inter',sans-serif", color:'#374151' },
  input:      { border:'1px solid #D1D5DB', borderRadius:'14px', padding:'9px 12px', fontSize:'13px', fontFamily:"'Inter',sans-serif", color:'#111827', backgroundColor:'#fff', outline:'none' },
  tableCard:  { backgroundColor:'#fff', borderRadius:'16px', border:'1px solid #E8ECF4', overflow:'hidden' },
  table:      { width:'100%', borderCollapse:'collapse', fontSize:'13px' },
  emptyState: { padding:'64px 32px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center' },
  // Day header
  dayHeader:  { display:'flex', alignItems:'baseline', gap:'12px', marginBottom:'8px', paddingLeft:'2px' },
  dayLabel:   { fontSize:'15px', fontWeight:'800', color:'#111827', letterSpacing:'-0.02em' },
  dayMeta:    { fontSize:'12px', color:'#9CA3AF', fontWeight:'500' },
  // L1 — utente
  trUser:     { borderBottom:'1px solid #F3F4F6', transition:'background-color 0.1s' },
  tdL1:       { padding:'13px 16px', verticalAlign:'middle' },
  // L2 — sessione
  trSess:     { borderBottom:'1px solid #EAECF8', transition:'background-color 0.1s' },
  tdL2:       { padding:'8px 16px', verticalAlign:'middle' },
  // L3 — operazione
  tdL3:       { padding:'6px 16px', verticalAlign:'middle', borderBottom:'1px solid #EEF0FB', fontSize:'12px', color:'#374151' },
}
