import { useEffect, useState, useMemo, Fragment } from 'react'
import { usePageTitle } from '../../hooks/usePageTitle'
import { supabase } from '../../lib/supabase'
import { Activity, Search, RefreshCw, Download, ChevronDown, ChevronRight, X } from 'lucide-react'
import GlowStatCard from '../../components/GlowStatCard'

// ---------- Catalogo azioni ----------
const CATEGORIE = {
  accessi:   { label:'Accessi',         color:'#475569', bg:'#F1F5F9' },
  checkin:   { label:'Check-in',        color:'#16A34A', bg:'#F0FDF4' },
  iscritti:  { label:'Iscritti',        color:'#2563EB', bg:'#EFF6FF' },
  eventi:    { label:'Eventi',          color:'#7C3AED', bg:'#F5F3FF' },
  comunic:   { label:'Comunicazioni',   color:'#EA580C', bg:'#FFF7ED' },
  export:    { label:'Export',          color:'#0891B2', bg:'#ECFEFF' },
  admin:     { label:'Amministrazione', color:'#BE185D', bg:'#FDF2F8' },
  altro:     { label:'Altro',           color:'#6B7280', bg:'#F9FAFB' },
}

const AZIONI = {
  login:                  ['Login', 'accessi'],
  accesso:                ['Apertura app', 'accessi'],
  logout:                 ['Logout', 'accessi'],
  checkin_qr:             ['Check-in QR', 'checkin'],
  checkin_manuale:        ['Check-in manuale', 'checkin'],
  checkin_annullato:      ['Check-in annullato', 'checkin'],
  walkin:                 ['Walk-in', 'checkin'],
  iscrizione:             ['Nuova iscrizione', 'iscritti'],
  cancellazione:          ['Cancellazione', 'iscritti'],
  iscritto_manuale:       ['Iscritto aggiunto', 'iscritti'],
  iscritto_modificato:    ['Iscritto modificato', 'iscritti'],
  iscritto_eliminato:     ['Iscritto eliminato', 'iscritti'],
  iscritti_importati:     ['Iscritti importati', 'iscritti'],
  evento_creato:          ['Evento creato', 'eventi'],
  evento_modificato:      ['Evento modificato', 'eventi'],
  evento_eliminato:       ['Evento eliminato', 'eventi'],
  evento_stato:           ['Cambio stato evento', 'eventi'],
  email_template_salvato: ['Template email salvato', 'comunic'],
  email_test_inviata:     ['Email di test', 'comunic'],
  sms_inviato:            ['SMS inviato', 'comunic'],
  iscritti_esportati:     ['Export iscritti', 'export'],
  presenti_esportati:     ['Export presenti', 'export'],
  posti_esportati:        ['Export posti', 'export'],
  teatro_posti_esportati: ['Export posti teatro', 'export'],
  registro_pdf:           ['Registro PDF', 'export'],
  registro_word:          ['Registro Word', 'export'],
  export:                 ['Export dati', 'export'],
  utente_creato:          ['Utente creato', 'admin'],
  utente_modificato:      ['Utente modificato', 'admin'],
  utente_eliminato:       ['Utente eliminato', 'admin'],
  ruolo_creato:           ['Ruolo creato', 'admin'],
  ruolo_modificato:       ['Ruolo modificato', 'admin'],
  ruolo_eliminato:        ['Ruolo eliminato', 'admin'],
  avatar_aggiornato:      ['Avatar aggiornato', 'admin'],
}
const infoAzione = a => {
  const [label, cat] = AZIONI[a] || [a?.replace(/_/g, ' ') || '?', 'altro']
  return { label, cat, ...CATEGORIE[cat] }
}
const isAccesso = a => a === 'login' || a === 'accesso'

const PERIODI = [
  { id:'oggi', label:'Oggi', giorni:0 },
  { id:'7',    label:'7 giorni', giorni:7 },
  { id:'30',   label:'30 giorni', giorni:30 },
  { id:'90',   label:'90 giorni', giorni:90 },
  { id:'tutti', label:'Tutti', giorni:null },
]
const MAX_ROWS = 20000
const BLOCCO = 1000 // limite righe per richiesta di Supabase

// ---------- Utility ----------
const TZ = 'Europe/Rome'
const dayKey = ts => new Date(ts).toLocaleDateString('sv-SE', { timeZone: TZ })
const fmtOra = ts => new Date(ts).toLocaleTimeString('it-IT', { hour:'2-digit', minute:'2-digit', timeZone: TZ })
function fmtRel(ts) {
  if (!ts) return 'mai'
  const min = Math.round((Date.now() - new Date(ts)) / 60000)
  if (min < 1) return 'ora'
  if (min < 60) return `${min} min fa`
  const h = Math.round(min / 60)
  if (h < 24) return `${h} h fa`
  const g = Math.round(h / 24)
  if (g < 30) return `${g} ${g === 1 ? 'giorno' : 'giorni'} fa`
  return new Date(ts).toLocaleDateString('it-IT', { day:'numeric', month:'short', year:'numeric', timeZone: TZ })
}
function fmtGiorno(key) {
  const oggi = dayKey(Date.now())
  const ieri = dayKey(Date.now() - 86400000)
  const d = new Date(key + 'T12:00:00')
  const full = d.toLocaleDateString('it-IT', { weekday:'long', day:'numeric', month:'long' })
  if (key === oggi) return 'Oggi, ' + full
  if (key === ieri) return 'Ieri, ' + full
  return full.charAt(0).toUpperCase() + full.slice(1)
}
function dettagliTesto(d) {
  if (!d || typeof d !== 'object') return ''
  const skip = new Set(['da_coda', 'offline', 'pagina'])
  if (d.nome) return d.nome + (d.capogruppo ? ` (capogruppo ${d.capogruppo})` : '')
  return Object.entries(d).filter(([k]) => !skip.has(k)).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join(' | ')
}
const fmtBreve = ts => ts ? new Date(ts).toLocaleString('it-IT', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit', timeZone: TZ }) : '-'
const iniziali = n => (n || '?').replace(/@.*/, '').split(/[\s.]+/).filter(Boolean).slice(0, 2).map(x => x[0]?.toUpperCase()).join('')
const nomeUtente = p => p ? ((`${p.nome || ''} ${p.cognome || ''}`).trim() || p.username) : null

// ---------- Componenti ----------
function Badge({ azione, small }) {
  const c = infoAzione(azione)
  return <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding: small ? '2px 8px' : '3px 10px', borderRadius:20, fontSize: small ? 10.5 : 11.5, fontWeight:700, color:c.color, background:c.bg, whiteSpace:'nowrap' }}>
    <span style={{ width:6, height:6, borderRadius:3, background:c.color }} />{c.label}
  </span>
}

function Avatar({ nome, size = 30, color = '#5B5FEF' }) {
  return <div style={{ width:size, height:size, borderRadius:'50%', background:color + '18', color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:size * 0.38, fontWeight:800, flexShrink:0 }}>{iniziali(nome)}</div>
}

function Chip({ active, onClick, children }) {
  return <button onClick={onClick} style={{ ...s.chip, ...(active ? s.chipOn : {}) }}>{children}</button>
}

// Curva morbida con area sfumata (stesso stile del grafico "Iscrizioni - 7 giorni" della dashboard).
// Con periodo "Oggi" mostra l'andamento per ora, altrimenti per giorno.
function curvaBezier(pts) {
  if (pts.length < 2) return ''
  let d = ''
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, pts.length - 1)]
    // limita i punti di controllo per non scendere sotto lo zero
    const cp1y = p1.y + (p2.y - p0.y) / 6, cp2y = p2.y - (p3.y - p1.y) / 6
    if (i === 0) d += `M ${p1.x} ${p1.y} `
    d += `C ${p1.x + (p2.x - p0.x) / 6} ${Math.min(cp1y, BASE_Y)} ${p2.x - (p3.x - p1.x) / 6} ${Math.min(cp2y, BASE_Y)} ${p2.x} ${p2.y} `
  }
  return d
}
const G_W = 720, G_H = 200, G_PL = 38, G_PR = 14, G_PT = 14, G_PB = 28
const BASE_Y = G_H - G_PB

function GraficoGiorni({ logs, giorni }) {
  const [hover, setHover] = useState(null)
  const perOra = giorni <= 1
  const serie = useMemo(() => {
    const keys = perOra
      ? Array.from({ length: 24 }, (_, h) => String(h))
      : Array.from({ length: giorni }, (_, i) => dayKey(Date.now() - (giorni - 1 - i) * 86400000))
    const m = Object.fromEntries(keys.map(k => [k, { tot: 0, cats: {} }]))
    for (const l of logs) {
      const k = perOra ? String(Number(new Date(l.created_at).toLocaleString('en-GB', { hour:'2-digit', hour12:false, timeZone: TZ })) % 24) : dayKey(l.created_at)
      if (!m[k]) continue
      const c = infoAzione(l.azione).cat
      m[k].tot++; m[k].cats[c] = (m[k].cats[c] || 0) + 1
    }
    return keys.map(k => ({ k, ...m[k] }))
  }, [logs, giorni, perOra])

  const cW = G_W - G_PL - G_PR, cH = G_H - G_PT - G_PB
  const max = Math.max(1, ...serie.map(d => d.tot))
  const passo = max <= 10 ? 5 : max <= 30 ? 10 : max <= 150 ? 50 : Math.pow(10, Math.floor(Math.log10(max)))
  const top = Math.ceil(max / passo) * passo
  const griglia = [0, top / 3, (top * 2) / 3, top].map(v => Math.round(v))
  const n = serie.length
  const pts = serie.map((d, i) => ({ x: G_PL + (n === 1 ? cW / 2 : (i / (n - 1)) * cW), y: G_PT + cH - (d.tot / top) * cH, d }))
  const linea = curvaBezier(pts)
  const area = linea + ` L ${pts[n - 1].x} ${BASE_Y} L ${pts[0].x} ${BASE_Y} Z`
  const totale = serie.reduce((a, d) => a + d.tot, 0)
  const etichetta = d => perOra ? `${d.k}:00` : new Date(d.k + 'T12:00:00').toLocaleDateString('it-IT', n <= 7 ? { weekday:'short' } : { day:'numeric', month:'short' })
  const ogni = Math.max(1, Math.ceil(n / (perOra ? 8 : 8)))
  const ultimo = pts[n - 1]
  const ordine = Object.keys(CATEGORIE)

  return <div style={{ ...s.card, borderRadius:20, boxShadow:'0 1px 4px rgba(20,20,40,.05)' }}>
    <div style={s.cardHead}><span style={{ fontSize:14, fontWeight:600, color:'#111827' }}>{perOra ? 'Operazioni di oggi, per ora' : `Operazioni per giorno - ${n} giorni`}</span></div>
    <div style={{ position:'relative' }}>
      <svg viewBox={`0 0 ${G_W} ${G_H}`} style={{ width:'100%', height:'auto', overflow:'visible', display:'block' }} onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="logAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5B5FEF" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#5B5FEF" stopOpacity="0.03" />
          </linearGradient>
        </defs>
        {griglia.map((v, i) => { const y = G_PT + cH - (v / top) * cH; return <g key={i}>
          <line x1={G_PL} y1={y} x2={G_W - G_PR} y2={y} stroke="#E8ECF4" strokeWidth="1" />
          <text x={G_PL - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#9CA3AF" fontFamily="Inter,sans-serif">{v}</text>
        </g> })}
        {n > 1 && <path d={area} fill="url(#logAreaGrad)" />}
        {n > 1 && <path d={linea} fill="none" stroke="#5B5FEF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
        {pts.map((p, i) => (i % ogni === 0 || i === n - 1) && <text key={'l' + i} x={p.x} y={G_H - 6} textAnchor="middle" fontSize="11" fill="#9CA3AF" fontFamily="Inter,sans-serif">{etichetta(p.d)}</text>)}
        {hover && <line x1={hover.x} y1={G_PT} x2={hover.x} y2={BASE_Y} stroke="#C7C9F9" strokeWidth="1" strokeDasharray="3 3" />}
        {(hover ? [hover] : [ultimo]).map(p => <circle key="dot" cx={p.x} cy={p.y} r="4.5" fill="#5B5FEF" stroke="#fff" strokeWidth="2" />)}
        {pts.map((p, i) => <rect key={'h' + i} x={p.x - cW / Math.max(1, n - 1) / 2} y={G_PT} width={cW / Math.max(1, n - 1)} height={cH} fill="transparent" onMouseEnter={() => setHover(p)} />)}
      </svg>
      {hover && <div style={{ ...s.tooltip, top:0, left: `${(hover.x / G_W) * 100}%`, right:'auto', transform: hover.x > G_W * 0.7 ? 'translateX(calc(-100% - 10px))' : 'translateX(10px)' }}>
        <b>{perOra ? `Ore ${hover.d.k}:00` : fmtGiorno(hover.d.k)}</b><div>{hover.d.tot} operazioni</div>
        {ordine.filter(c => hover.d.cats[c]).map(c => <div key={c} style={{ color:'#CBD5E1' }}>{CATEGORIE[c].label}: {hover.d.cats[c]}</div>)}
      </div>}
    </div>
    <p style={{ fontSize:12, color:'#9CA3AF', margin:'6px 0 0', textAlign:'right' }}>Totale periodo: <strong style={{ color:'#5B5FEF' }}>{totale.toLocaleString('it-IT')}</strong></p>
  </div>
}

function BarreCard({ titolo, nota, valori, etichette, titoli }) {
  const max = Math.max(1, ...valori)
  return <div style={s.card}>
    <div style={s.cardHead}><span style={s.cardTitle}>{titolo}</span>{nota && <span style={{ fontSize:11.5, color:'#5B5FEF', fontWeight:700 }}>{nota}</span>}</div>
    <div style={{ display:'flex', alignItems:'flex-end', gap:3, height:90 }}>
      {valori.map((v, i) => <div key={i} title={titoli[i]} style={{ flex:1, height:'100%', display:'flex', alignItems:'flex-end' }}>
        <div style={{ width:'100%', height: v ? Math.max(3, (v / max) * 90) : 2, background: v === max && v ? '#5B5FEF' : v ? '#A5A8F6' : '#EEF0F6', borderRadius:'3px 3px 0 0' }} />
      </div>)}
    </div>
    <div style={{ display:'flex', gap:3, marginTop:5 }}>{etichette.map((e, i) => <span key={i} style={{ flex:1, fontSize:10, color:'#9CA3AF', textAlign:'center' }}>{e}</span>)}</div>
  </div>
}

function ListaCard({ titolo, righe, vuoto, percento }) {
  const max = Math.max(1, ...righe.map(r => r.n))
  const tot = righe.reduce((a, r) => a + (r.k.startsWith('Browser ') ? 0 : r.n), 0) || 1
  return <div style={s.card}>
    <div style={s.cardHead}><span style={s.cardTitle}>{titolo}</span></div>
    {!righe.length ? <p style={{ fontSize:12.5, color:'#9CA3AF', margin:0 }}>{vuoto}</p> : righe.map(r => <div key={r.k} style={{ marginBottom:9 }}>
      <div style={{ display:'flex', justifyContent:'space-between', gap:8, fontSize:12.5, marginBottom:3 }}>
        <span style={{ color:'#374151', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.k}{r.sub && <span style={{ color:'#9CA3AF', fontWeight:500, fontSize:11 }}> | {r.sub}</span>}</span>
        <span style={{ color:'#6B7280', fontVariantNumeric:'tabular-nums', flexShrink:0 }}>{percento && !r.k.startsWith('Browser ') ? `${Math.round(r.n / tot * 100)}%` : r.n}</span>
      </div>
      <div style={{ height:6, background:'#F1F3F9', borderRadius:3 }}><div style={{ width:`${(r.n / max) * 100}%`, height:'100%', background:r.color, borderRadius:3 }} /></div>
    </div>)}
  </div>
}

// ---------- Pagina ----------
export default function ActivityLogPage() {
  usePageTitle('Log attivita')
  const [periodo, setPeriodo] = useState('7')
  const [logs, setLogs] = useState([])
  const [utenti, setUtenti] = useState([])
  const [loading, setLoading] = useState(true)
  const [troncato, setTroncato] = useState(false)
  const [fUtente, setFUtente] = useState('tutti')
  const [fCat, setFCat] = useState('tutte')
  const [fEvento, setFEvento] = useState('tutti')
  const [search, setSearch] = useState('')
  const [nascondiAccessi, setNascondiAccessi] = useState(false)

  const giorni = PERIODI.find(p => p.id === periodo)?.giorni
  const giorniDalPrimo = useMemo(() => logs.length ? Math.max(1, Math.round((new Date(dayKey(Date.now())) - new Date(dayKey(logs[logs.length - 1].created_at))) / 86400000) + 1) : 1, [logs])

  useEffect(() => { load() }, [periodo])

  async function load() {
    setLoading(true)
    let da = null
    if (giorni != null) {
      da = new Date(); da.setHours(0, 0, 0, 0)
      if (giorni > 0) da.setDate(da.getDate() - (giorni - 1))
    }
    const caricaLog = async () => {
      const out = []
      for (let off = 0; off < MAX_ROWS; off += BLOCCO) {
        let q = supabase.from('activity_log')
          .select('id,created_at,user_id,username,utente_nome,azione,dettagli,evento_id,evento_titolo,ip_address,metadata')
          .order('created_at', { ascending:false }).order('id', { ascending:false })
          .range(off, off + BLOCCO - 1)
        if (da) q = q.gte('created_at', da.toISOString())
        const { data, error } = await q
        if (error || !data) break
        out.push(...data)
        if (data.length < BLOCCO) break
      }
      return out
    }
    const [lg, { data: us }] = await Promise.all([
      caricaLog(),
      supabase.from('admin_profiles').select('id,username,nome,cognome,ruolo,attivo,ultimo_accesso'),
    ])
    setLogs(lg)
    setTroncato(lg.length >= MAX_ROWS)
    setUtenti(us || [])
    setLoading(false)
  }


  const eventi = useMemo(() => {
    const m = new Map()
    for (const l of logs) if (l.evento_id && !m.has(l.evento_id)) m.set(l.evento_id, l.evento_titolo || 'Evento senza titolo')
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [logs])

  // log filtrati da tutti i filtri tranne l'utente (usati per il riepilogo utenti)
  const logsSenzaUtente = useMemo(() => {
    const q = search.trim().toLowerCase()
    return logs.filter(l => {
      if (fCat !== 'tutte' && infoAzione(l.azione).cat !== fCat) return false
      if (fEvento !== 'tutti' && l.evento_id !== fEvento) return false
      if (q) {
        const hay = [l.utente_nome, l.username, l.evento_titolo, infoAzione(l.azione).label, dettagliTesto(l.dettagli)].join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [logs, fCat, fEvento, search])

  const filtrati = useMemo(() => logsSenzaUtente.filter(l => fUtente === 'tutti' || l.user_id === fUtente), [logsSenzaUtente, fUtente])

  const kpi = useMemo(() => {
    const k = { tot: 0, utenti: new Set(), checkin: 0, iscritti: 0, comunic: 0, export: 0, mobile: 0 }
    for (const l of filtrati) {
      const c = infoAzione(l.azione).cat
      if (c !== 'accessi') k.tot++
      k.utenti.add(l.user_id)
      if (l.azione === 'checkin_qr' || l.azione === 'checkin_manuale' || l.azione === 'walkin') k.checkin++
      if (c === 'iscritti') k.iscritti++
      if (c === 'comunic') k.comunic++
      if (c === 'export') k.export++
      if (l.metadata?.dispositivo === 'Mobile') k.mobile++
    }
    return { ...k, utenti: k.utenti.size }
  }, [filtrati])

  const logsPerUtente = useMemo(() => {
    const m = new Map()
    for (const l of filtrati) { if (!m.has(l.user_id)) m.set(l.user_id, []); m.get(l.user_id).push(l) }
    return m
  }, [filtrati])

  // Solo utenti con almeno un'attivita (anche solo login) nel periodo/filtri scelti
  const riepilogo = useMemo(() => [...logsPerUtente.entries()].map(([id, ls]) => {
    const p = utenti.find(u => u.id === id)
    const r = { tot: 0, checkin: 0, iscritti: 0, accessi: 0, disp: new Set(), giorni: new Set() }
    for (const l of ls) {
      const c = infoAzione(l.azione).cat
      if (c === 'accessi') r.accessi++; else r.tot++
      if (l.azione === 'checkin_qr' || l.azione === 'checkin_manuale' || l.azione === 'walkin') r.checkin++
      if (c === 'iscritti') r.iscritti++
      if (l.metadata?.dispositivo) r.disp.add(l.metadata.dispositivo)
      r.giorni.add(dayKey(l.created_at))
    }
    return {
      id, nome: nomeUtente(p) || ls[0].utente_nome || 'Utente rimosso', username: p?.username || ls[0].username, ruolo: p?.ruolo, attivo: p?.attivo,
      tot: r.tot, checkin: r.checkin, iscritti: r.iscritti, accessi: r.accessi, dispositivi: [...r.disp].join(', '),
      prima: ls[ls.length - 1].created_at, ultima: ls[0].created_at, giorniAttivi: r.giorni.size,
    }
  }).sort((a, b) => b.tot - a.tot || b.accessi - a.accessi || b.ultima.localeCompare(a.ultima)), [logsPerUtente, utenti])

  const stats = useMemo(() => {
    const ore = Array(24).fill(0), sett = Array(7).fill(0)
    const ev = new Map(), disp = {}, brow = {}, operatori = {}
    let annullati = 0, coda = 0
    const sessioni = new Map()
    for (const l of filtrati) {
      const d = new Date(l.created_at)
      const ora = Number(d.toLocaleString('en-GB', { hour:'2-digit', hour12:false, timeZone: TZ })) % 24
      const gs = (new Date(dayKey(l.created_at) + 'T12:00:00').getDay() + 6) % 7
      const cat = infoAzione(l.azione).cat
      if (cat !== 'accessi') { ore[ora]++; sett[gs]++ }
      if (l.evento_id && cat !== 'accessi') {
        if (!ev.has(l.evento_id)) ev.set(l.evento_id, { titolo: l.evento_titolo || 'Evento senza titolo', n: 0, utenti: new Set(), checkin: 0 })
        const e = ev.get(l.evento_id); e.n++; e.utenti.add(l.user_id)
        if (l.azione === 'checkin_qr' || l.azione === 'checkin_manuale' || l.azione === 'walkin') e.checkin++
      }
      const m = l.metadata || {}
      if (m.dispositivo) disp[m.dispositivo] = (disp[m.dispositivo] || 0) + 1
      if (m.browser) brow[m.browser] = (brow[m.browser] || 0) + 1
      if (l.azione === 'checkin_annullato') annullati++
      if (l.dettagli?.da_coda) coda++
      if (l.azione === 'checkin_qr' || l.azione === 'checkin_manuale' || l.azione === 'walkin') {
        const k = l.utente_nome || 'Sistema'; operatori[k] = (operatori[k] || 0) + 1
      }
      // giornate lavorative per utente: primo e ultimo timestamp del giorno
      const sk = l.user_id + '|' + dayKey(l.created_at)
      const t = d.getTime(), cur = sessioni.get(sk)
      if (!cur) sessioni.set(sk, [t, t]); else { cur[0] = Math.min(cur[0], t); cur[1] = Math.max(cur[1], t) }
    }
    const durate = [...sessioni.values()].map(([a, b]) => (b - a) / 60000).filter(x => x >= 1)
    const piccoOra = ore.indexOf(Math.max(...ore))
    return {
      ore, sett, piccoOra: ore[piccoOra] ? piccoOra : null, annullati, coda,
      eventi: [...ev.values()].sort((a, b) => b.n - a.n).slice(0, 6),
      disp: Object.entries(disp).sort((a, b) => b[1] - a[1]), brow: Object.entries(brow).sort((a, b) => b[1] - a[1]),
      operatori: Object.entries(operatori).sort((a, b) => b[1] - a[1]).slice(0, 6),
      durataMedia: durate.length ? Math.round(durate.reduce((a, b) => a + b, 0) / durate.length) : null,
    }
  }, [filtrati])

  function esportaCsv() {
    const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`
    const rows = [['Data', 'Ora', 'Utente', 'Username', 'Azione', 'Categoria', 'Evento', 'Dettagli', 'Dispositivo', 'Browser', 'OS', 'Localita', 'IP']]
    for (const l of filtrati) {
      const a = infoAzione(l.azione), m = l.metadata || {}
      const dt = new Date(l.created_at)
      rows.push([dt.toLocaleDateString('it-IT', { timeZone: TZ }), dt.toLocaleTimeString('it-IT', { timeZone: TZ }), l.utente_nome, l.username, a.label, a.label && CATEGORIE[a.cat].label,
        l.evento_titolo, dettagliTesto(l.dettagli), m.dispositivo, m.browser, m.os, [m.citta, m.paese].filter(Boolean).join(', '), l.ip_address || m.ip])
    }
    const blob = new Blob(['\uFEFF' + rows.map(r => r.map(esc).join(';')).join('\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `log-attivita-${dayKey(Date.now())}.csv`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }

  const filtriAttivi = fUtente !== 'tutti' || fCat !== 'tutte' || fEvento !== 'tutti' || search
  const reset = () => { setFUtente('tutti'); setFCat('tutte'); setFEvento('tutti'); setSearch('') }

  return (
    <div style={s.page} className="admin-page">
      <div style={s.header} className="page-header-row">
        <div>
          <h1 style={s.title}>Log Attivita</h1>
          <p style={s.sub}>Chi ha fatto cosa, quando e da quale dispositivo</p>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button onClick={esportaCsv} style={s.btn} disabled={!filtrati.length}><Download size={15} />Esporta CSV</button>
          <button onClick={load} style={s.btn} disabled={loading}><RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />Aggiorna</button>
        </div>
      </div>

      {/* Filtri */}
      <div style={s.filterBar}>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {PERIODI.map(p => <Chip key={p.id} active={periodo === p.id} onClick={() => setPeriodo(p.id)}>{p.label}</Chip>)}
        </div>
        <div style={s.filterRow}>
          <div style={{ position:'relative', flex:'1 1 220px', minWidth:180 }}>
            <Search size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca nome, iscritto, evento..." style={{ ...s.input, paddingLeft:36, width:'100%' }} />
          </div>
          <select value={fUtente} onChange={e => setFUtente(e.target.value)} style={s.select}>
            <option value="tutti">Tutti gli utenti</option>
            {[...utenti].sort((a, b) => (nomeUtente(a) || '').localeCompare(nomeUtente(b) || '')).map(u => <option key={u.id} value={u.id}>{nomeUtente(u)}</option>)}
          </select>
          <select value={fCat} onChange={e => setFCat(e.target.value)} style={s.select}>
            <option value="tutte">Tutte le attivita</option>
            {Object.entries(CATEGORIE).filter(([k]) => k !== 'altro').map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}
          </select>
          <select value={fEvento} onChange={e => setFEvento(e.target.value)} style={{ ...s.select, maxWidth:240 }}>
            <option value="tutti">Tutti gli eventi</option>
            {eventi.map(([id, t]) => <option key={id} value={id}>{t}</option>)}
          </select>
          {filtriAttivi && <button onClick={reset} style={s.linkBtn}><X size={13} />Azzera filtri</button>}
        </div>
      </div>


      {/* KPI */}
      <div style={s.kpiGrid} className="stat-grid-auto">
        <GlowStatCard icon="activity" label="Operazioni" value={kpi.tot.toLocaleString('it-IT')} sub="esclusi accessi" palette="blue" />
        <GlowStatCard icon="users" label="Utenti attivi" value={kpi.utenti} sub={`su ${utenti.filter(u => u.attivo !== false).length} abilitati`} palette="violet" />
        <GlowStatCard icon="qr" label="Check-in" value={kpi.checkin} sub="QR, manuali, walk-in" palette="green" />
        <GlowStatCard icon="usercheck" label="Gestione iscritti" value={kpi.iscritti} sub="aggiunte, modifiche, eliminazioni" palette="cyan" />
        <GlowStatCard icon="globe" label="Comunicazioni / export" value={`${kpi.comunic} / ${kpi.export}`} sub="SMS e email / file scaricati" palette="coral" />
      </div>

      {loading && !logs.length ? (
        <div style={s.empty}><Activity size={32} style={{ color:'#D1D5DB', marginBottom:12 }} /><p style={{ color:'#9CA3AF', margin:0 }}>Caricamento...</p></div>
      ) : (<>
        <div style={s.twoCol} className="log-two-col">
          <GraficoGiorni logs={filtrati} giorni={giorni == null ? giorniDalPrimo : giorni === 0 ? 1 : giorni} />
          <div style={s.card}>
            <div style={s.cardHead}><span style={s.cardTitle}>Attivita piu frequenti</span></div>
            {(() => {
              const c = {}
              for (const l of filtrati) c[l.azione] = (c[l.azione] || 0) + 1
              const top = Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 7)
              const mx = top[0]?.[1] || 1
              if (!top.length) return <p style={{ fontSize:13, color:'#9CA3AF', margin:0 }}>Nessun dato</p>
              return top.map(([a, n]) => { const i = infoAzione(a); return <div key={a} style={{ marginBottom:9 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12.5, marginBottom:3 }}><span style={{ color:'#374151', fontWeight:600 }}>{i.label}</span><span style={{ color:'#6B7280', fontVariantNumeric:'tabular-nums' }}>{n}</span></div>
                <div style={{ height:6, background:'#F1F3F9', borderRadius:3 }}><div style={{ width:`${(n / mx) * 100}%`, height:'100%', background:i.color, borderRadius:3 }} /></div>
              </div> })
            })()}
          </div>
        </div>

        <RiepilogoUtenti righe={riepilogo} logsPerUtente={logsPerUtente} nascondiAccessi={nascondiAccessi}
          setNascondiAccessi={setNascondiAccessi} multiGiorno={giorni !== 0} apertoIniziale={fUtente !== 'tutti' ? fUtente : null} />

        <div style={{ ...s.cardTitle, fontSize:16, margin:'26px 2px 12px' }}>Statistiche</div>
        <div style={s.statGrid}>
          <BarreCard titolo="Fasce orarie" nota={stats.piccoOra != null ? `picco ${stats.piccoOra}:00-${stats.piccoOra + 1}:00` : ''}
            valori={stats.ore} etichette={stats.ore.map((_, i) => i % 3 === 0 ? String(i) : '')} titoli={stats.ore.map((n, i) => `${i}:00 - ${n} operazioni`)} />
          <BarreCard titolo="Giorni della settimana" valori={stats.sett} etichette={['Lun','Mar','Mer','Gio','Ven','Sab','Dom']}
            titoli={stats.sett.map((n, i) => `${['Lunedi','Martedi','Mercoledi','Giovedi','Venerdi','Sabato','Domenica'][i]} - ${n} operazioni`)} />
          <ListaCard titolo="Eventi piu gestiti" vuoto="Nessuna operazione su eventi"
            righe={stats.eventi.map(e => ({ k: e.titolo, n: e.n, sub: `${e.utenti.size} ${e.utenti.size === 1 ? 'utente' : 'utenti'}${e.checkin ? ` | ${e.checkin} check-in` : ''}`, color:'#7C3AED' }))} />
          <ListaCard titolo="Check-in per operatore" vuoto="Nessun check-in nel periodo"
            righe={stats.operatori.map(([k, n]) => ({ k, n, color:'#16A34A' }))} />
          <ListaCard titolo="Dispositivi" vuoto="Nessun dato"
            righe={[...stats.disp.map(([k, n]) => ({ k, n, color:'#0891B2' })), ...stats.brow.slice(0, 4).map(([k, n]) => ({ k: 'Browser ' + k, n, color:'#94A3B8' }))]} percento />
          <div style={s.card}>
            <div style={s.cardHead}><span style={s.cardTitle}>Indicatori</span></div>
            {[
              ['Tempo medio di lavoro al giorno', stats.durataMedia != null ? (stats.durataMedia >= 60 ? `${Math.floor(stats.durataMedia / 60)} h ${stats.durataMedia % 60} min` : `${stats.durataMedia} min`) : '-', 'tra prima e ultima azione di un utente nella giornata'],
              ['Check-in annullati', stats.annullati, 'correzioni dopo una scansione'],
              ['Azioni sincronizzate in ritardo', stats.coda, 'fatte offline o con rete debole'],
              ['Utenti attivi / abilitati', `${riepilogo.length} / ${utenti.filter(u => u.attivo !== false).length}`, 'chi ha almeno un accesso nel periodo'],
            ].map(([k, v, d]) => <div key={k} style={{ display:'flex', justifyContent:'space-between', gap:12, padding:'8px 0', borderBottom:'1px solid #F1F3F9' }}>
              <div><div style={{ fontSize:12.5, fontWeight:600, color:'#374151' }}>{k}</div><div style={{ fontSize:11, color:'#9CA3AF' }}>{d}</div></div>
              <div style={{ fontSize:16, fontWeight:800, color:'#111827', whiteSpace:'nowrap', fontVariantNumeric:'tabular-nums' }}>{v}</div>
            </div>)}
          </div>
        </div>

        {troncato && <p style={{ fontSize:12, color:'#B45309', textAlign:'center' }}>Il periodo contiene piu di {MAX_ROWS.toLocaleString('it-IT')} voci: vengono mostrate le piu recenti. Riduci il periodo per vedere tutto.</p>}
      </>)}

      <style>{`
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @media (max-width: 900px){ .log-two-col{ grid-template-columns: 1fr !important; } }
        @media (max-width: 700px){ .hide-mobile{ display:none !important; } }
      `}</style>
    </div>
  )
}

const s = {
  page:      { width:'100%' },
  header:    { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, gap:12, flexWrap:'wrap' },
  title:     { fontSize:32, fontWeight:900, color:'#111827', letterSpacing:'-0.03em', margin:0, fontFamily:"'Inter', sans-serif" },
  sub:       { fontSize:14, color:'#6B7280', margin:'4px 0 0', fontWeight:500 },
  btn:       { display:'inline-flex', alignItems:'center', gap:6, border:'1px solid #E8ECF4', background:'#fff', borderRadius:20, padding:'8px 14px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'Inter',sans-serif", color:'#374151' },
  linkBtn:   { display:'inline-flex', alignItems:'center', gap:4, border:'none', background:'transparent', color:'#5B5FEF', fontSize:12.5, fontWeight:700, cursor:'pointer', padding:'6px 4px', fontFamily:"'Inter',sans-serif" },
  filterBar: { background:'#fff', border:'1px solid #E8ECF4', borderRadius:16, padding:14, marginBottom:16, display:'flex', flexDirection:'column', gap:12 },
  filterRow: { display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' },
  chip:      { border:'1px solid #E8ECF4', background:'#fff', borderRadius:20, padding:'6px 14px', fontSize:12.5, fontWeight:600, color:'#4B5563', cursor:'pointer', fontFamily:"'Inter',sans-serif" },
  chipOn:    { background:'#5B5FEF', borderColor:'#5B5FEF', color:'#fff' },
  input:     { border:'1px solid #E5E7EB', borderRadius:20, padding:'8px 12px', fontSize:13, fontFamily:"'Inter',sans-serif", color:'#111827', background:'#F9FAFB', outline:'none', boxSizing:'border-box' },
  select:    { border:'1px solid #E5E7EB', borderRadius:20, padding:'8px 12px', fontSize:13, fontFamily:"'Inter',sans-serif", color:'#111827', background:'#F9FAFB', outline:'none', cursor:'pointer' },
  focusBar:  { display:'flex', alignItems:'center', gap:12, background:'#EEF0FF', border:'1px solid #DADCFB', borderRadius:16, padding:'12px 16px', marginBottom:16, flexWrap:'wrap' },
  kpiGrid:   { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(170px, 1fr))', gap:12, marginBottom:16 },
  statGrid:  { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:16 },
  twoCol:    { display:'grid', gridTemplateColumns:'minmax(0,2fr) minmax(0,1fr)', gap:16, marginBottom:16 },
  card:      { background:'#fff', border:'1px solid #E8ECF4', borderRadius:16, padding:18, marginBottom:16 },
  cardHead:  { display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:14 },
  cardTitle: { fontSize:14, fontWeight:800, color:'#111827', letterSpacing:'-0.01em' },
  tooltip:   { position:'absolute', top:-8, right:0, background:'#111827', color:'#fff', fontSize:11.5, padding:'8px 10px', borderRadius:10, pointerEvents:'none', zIndex:5, lineHeight:1.5 },
  table:     { width:'100%', borderCollapse:'collapse', fontSize:13 },
  th:        { fontSize:11, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.04em', padding:'8px 12px', borderBottom:'1px solid #EEF0F6', whiteSpace:'nowrap' },
  td:        { padding:'10px 12px', borderBottom:'1px solid #F1F3F9', verticalAlign:'middle' },
  num:       { textAlign:'right', fontVariantNumeric:'tabular-nums', fontSize:13, color:'#374151' },
  ruolo:     { display:'inline-block', fontSize:11, fontWeight:700, color:'#5B5FEF', background:'#EEEFFD', borderRadius:20, padding:'2px 8px', textTransform:'capitalize' },
  tag:       { marginLeft:6, fontSize:10, fontWeight:700, color:'#B45309', background:'#FEF3C7', borderRadius:20, padding:'1px 6px' },
  dayHead:   { display:'flex', justifyContent:'space-between', alignItems:'baseline', fontSize:13.5, fontWeight:800, color:'#111827', margin:'0 2px 8px' },
  detGrid:   { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'8px 20px', fontSize:12.5, color:'#374151' },
  detK:      { display:'block', fontSize:10.5, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:1 },
  empty:     { padding:'48px 24px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center' },
}
