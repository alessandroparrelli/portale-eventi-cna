import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Search, Download, CheckCircle2, Clock, Building2, Mail, Phone, X, ChevronDown } from 'lucide-react'
import GlowStatCard from '../../components/GlowStatCard'
import * as XLSX from 'xlsx'
import AreaCurveChart from '../../components/AreaCurveChart'

// ---------- helpers (ASCII only in comments) ----------
const norm = (s) => (s || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
const cap = (s) => (s || '').toString().trim().toLowerCase().replace(/(^|[\s'-])\S/g, m => m.toUpperCase())
const cleanPiva = (p) => (p || '').toString().replace(/\D/g, '')
// P.IVA italiana valida: 11 cifre, non tutte uguali, checksum Luhn-like
function pivaValida(p) {
  const d = cleanPiva(p)
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false
  let s = 0
  for (let i = 0; i < 10; i++) {
    let n = +d[i]
    if (i % 2 === 1) { n *= 2; if (n > 9) n -= 9 }
    s += n
  }
  return (10 - (s % 10)) % 10 === +d[10]
}
const fmtD = (ts) => ts ? new Date(ts).toLocaleDateString('it-IT', { day:'2-digit', month:'short', year:'numeric', timeZone:'Europe/Rome' }) : '-'
const isPresente = (r) => !!(r.presente || r.checkin_at)

async function fetchAll(table, cols, order = 'created_at') {
  const out = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(table).select(cols).order(order, { ascending: true }).range(from, from + 999)
    if (error) throw error
    out.push(...(data || []))
    if (!data || data.length < 1000) break
  }
  return out
}

const TIPO_LABEL = { impresa:'Impresa', ente:'Ente / Organizzazione', privato:'Privato' }
const TIPO_COL = { impresa:'#5B5FEF', ente:'#F59E0B', privato:'#9CA3AF' }

export default function StatisticheUtenti() {
  const [loading, setLoading] = useState(true)
  const [errore, setErrore] = useState('')
  const [regs, setRegs] = useState([])
  const [eventi, setEventi] = useState({})
  const [mestieri, setMestieri] = useState({})
  const [info, setInfo] = useState({})
  const [syncing, setSyncing] = useState(false)
  const [q, setQ] = useState('')
  const [fTipo, setFTipo] = useState('tutti')
  const [fAssoc, setFAssoc] = useState('tutti')
  const [sort, setSort] = useState('iscrizioni')
  const [limit, setLimit] = useState(50)
  const [sel, setSel] = useState(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const [r, ev, ms] = await Promise.all([
          fetchAll('registrations', 'id,event_id,nome,cognome,email,cellulare,ragione_sociale,partita_iva,cap,mestiere_id,associato_cna,presente,checkin_at,rinuncia,created_at,codice_iscrizione,stato'),
          fetchAll('events', 'id,titolo,data_inizio,data_fine,luogo', 'data_inizio'),
          supabase.from('mestieri').select('id,nome').then(x => x.data || []),
        ])
        setRegs(r)
        setEventi(Object.fromEntries(ev.map(e => [e.id, e])))
        setMestieri(Object.fromEntries(ms.map(m => [m.id, m.nome])))
        const inf = await caricaInfo()
        // se mancano imprese nella cache, arricchisce in background dal Tesseramento
        const pv = new Set(r.map(x => cleanPiva(x.partita_iva)).filter(pivaValida))
        if ([...pv].some(p => !inf[p])) sincronizza()
      } catch (e) { setErrore(e.message || String(e)) }
      setLoading(false)
    })()
  }, [])

  async function caricaInfo() {
    const { data } = await supabase.from('imprese_info').select('*')
    const m = Object.fromEntries((data || []).map(i => [i.piva, i]))
    setInfo(m)
    return m
  }
  async function sincronizza() {
    setSyncing(true)
    try { await supabase.functions.invoke('arricchisci-imprese', { body: {} }); await caricaInfo() } catch (e) { console.error(e) }
    setSyncing(false)
  }
  // mestiere di una iscrizione: dato del form, altrimenti archivio CNA / camera di commercio
  const mestiereDi = (r) => (r.mestiere_id && mestieri[r.mestiere_id]) || info[cleanPiva(r.partita_iva)]?.mestiere || ''

  // ---------- aggregazione per persona (nome + cognome) ----------
  const persone = useMemo(() => {
    const map = {}
    for (const r of regs) {
      const k = norm(r.nome) + '|' + norm(r.cognome)
      if (k === '|') continue
      if (!map[k]) map[k] = { key:k, nome:cap(r.nome), cognome:cap(r.cognome), emails:new Set(), tel:new Set(), aziende:{}, mestieri:new Set(), caps:new Set(), associato:false, regs:[], eventi:new Set(), presenze:0, rinunce:0, prima:r.created_at, ultima:r.created_at }
      const p = map[k]
      p.regs.push(r)
      if (r.event_id) p.eventi.add(r.event_id)
      if (isPresente(r)) p.presenze++
      if (r.rinuncia) p.rinunce++
      if (r.email) p.emails.add(r.email.trim().toLowerCase())
      if (r.cellulare) p.tel.add(r.cellulare.trim())
      if (r.cap) p.caps.add(r.cap.trim())
      if (mestiereDi(r)) p.mestieri.add(mestiereDi(r))
      if (r.associato_cna) p.associato = true
      const rs = (r.ragione_sociale || '').trim()
      const pv = cleanPiva(r.partita_iva)
      if (rs || pv) {
        const ak = pivaValida(pv) ? 'p' + pv : 'n' + norm(rs)
        if (!p.aziende[ak]) p.aziende[ak] = { ragione_sociale: rs, piva: pivaValida(pv) ? pv : '', associato:false, n:0 }
        const a = p.aziende[ak]
        if (!a.ragione_sociale && rs) a.ragione_sociale = rs
        if (r.associato_cna) a.associato = true
        a.n++
      }
      if (r.created_at < p.prima) p.prima = r.created_at
      if (r.created_at > p.ultima) p.ultima = r.created_at
    }
    return Object.values(map).map(p => {
      const az = Object.values(p.aziende).sort((a, b) => (b.piva ? 1 : 0) - (a.piva ? 1 : 0) || b.n - a.n)
      const tipo = az.some(a => a.piva) ? 'impresa' : az.length ? 'ente' : 'privato'
      return { ...p, aziende: az, tipo, iscrizioni: p.regs.length, nEventi: p.eventi.size,
        emails:[...p.emails], tel:[...p.tel], mestieri:[...p.mestieri], caps:[...p.caps] }
    })
  }, [regs, mestieri, info])

  // ---------- statistiche globali ----------
  const st = useMemo(() => {
    const imprese = {}
    for (const r of regs) {
      const pv = cleanPiva(r.partita_iva)
      if (!pivaValida(pv)) continue
      if (!imprese[pv]) imprese[pv] = { piva:pv, ragione_sociale:(r.ragione_sociale||'').trim(), persone:new Set(), regs:[], iscrizioni:0, eventi:new Set(), associato:false, mestiere:'' }
      const i = imprese[pv]
      i.iscrizioni++
      i.regs.push(r)
      i.persone.add(norm(r.nome) + '|' + norm(r.cognome))
      if (r.event_id) i.eventi.add(r.event_id)
      if (r.associato_cna) i.associato = true
      if (!i.ragione_sociale && r.ragione_sociale) i.ragione_sociale = r.ragione_sociale.trim()
      if (!i.mestiere) i.mestiere = mestiereDi(r)
    }
    const impList = Object.values(imprese).map(i => ({ ...i, nPersone:i.persone.size, nEventi:i.eventi.size }))
      .sort((a, b) => b.nEventi - a.nEventi || b.iscrizioni - a.iscrizioni)
    const tipi = { impresa:0, ente:0, privato:0 }
    const freq = { '1':0, '2':0, '3-4':0, '5+':0 }
    const mest = {}
    const mesi = {}
    let assoc = 0
    for (const p of persone) {
      tipi[p.tipo]++
      if (p.associato) assoc++
      const n = p.nEventi
      freq[n <= 1 ? '1' : n === 2 ? '2' : n <= 4 ? '3-4' : '5+']++
      p.mestieri.forEach(m => { mest[m] = (mest[m] || 0) + 1 })
      const m = (p.prima || '').slice(0, 7)
      if (m) mesi[m] = (mesi[m] || 0) + 1
    }
    const enti = {}
    persone.filter(p => p.tipo === 'ente').forEach(p => p.aziende.forEach(a => {
      const k = norm(a.ragione_sociale); if (!k) return
      if (!enti[k]) enti[k] = { nome:a.ragione_sociale, n:0 }
      enti[k].n++
    }))
    const presTot = regs.filter(isPresente).length
    const nPers = persone.length || 1
    return {
      impList, tipi, freq, assoc, presTot,
      ricorrenti: persone.filter(p => p.nEventi >= 2).length,
      mediaEventi: (persone.reduce((s, p) => s + p.nEventi, 0) / nPers).toFixed(1),
      mest: Object.entries(mest).sort((a, b) => b[1] - a[1]).slice(0, 8),
      enti: Object.values(enti).sort((a, b) => b.n - a.n).slice(0, 8),
      mesi: Object.entries(mesi).sort().slice(-12),
      impAssoc: impList.filter(i => i.associato).length,
    }
  }, [persone, regs, mestieri, info])

  // ---------- statistiche aggiuntive ----------
  const st2 = useMemo(() => {
    const ora = new Date().toISOString()
    const chiave = r => norm(r.nome) + '|' + norm(r.cognome)
    // prima partecipazione di ogni persona (per evento piu vecchio)
    const primoEvento = {}
    const ordinati = [...regs].sort((a, b) => (eventi[a.event_id]?.data_inizio || a.created_at).localeCompare(eventi[b.event_id]?.data_inizio || b.created_at))
    for (const r of ordinati) { const k = chiave(r); if (k !== '|' && !primoEvento[k]) primoEvento[k] = r.event_id }
    // per evento
    const ev = {}
    for (const r of regs) {
      if (!r.event_id) continue
      if (!ev[r.event_id]) ev[r.event_id] = { id: r.event_id, iscritti: 0, presenti: 0, rinunce: 0, nuovi: 0, ritorni: 0 }
      const e = ev[r.event_id]
      e.iscritti++
      if (isPresente(r)) e.presenti++
      if (r.rinuncia) e.rinunce++
      if (primoEvento[chiave(r)] === r.event_id) e.nuovi++; else e.ritorni++
    }
    const perEvento = Object.values(ev).map(e => ({ ...e, titolo: eventi[e.id]?.titolo || 'Evento', data: eventi[e.id]?.data_inizio || '' }))
      .sort((a, b) => b.data.localeCompare(a.data))
    // eventi conclusi in cui il check-in e stato usato
    const conclusi = perEvento.filter(e => e.data && e.data < ora && e.presenti > 0)
    const iscrConcl = conclusi.reduce((x, e) => x + e.iscritti - e.rinunce, 0)
    const presConcl = conclusi.reduce((x, e) => x + e.presenti, 0)
    // nuovi negli ultimi 30 giorni
    const lim = new Date(Date.now() - 30 * 86400000).toISOString()
    const nuovi30 = persone.filter(p => p.prima >= lim).length
    // piu assidui
    const assidui = [...persone].filter(p => p.presenze > 0).sort((a, b) => b.presenze - a.presenze || b.nEventi - a.nEventi).slice(0, 10)
    // anagrafica imprese (archivio CNA / camera di commercio)
    const imp = st.impList.map(i => info[i.piva]).filter(Boolean)
    const conta = f => { const m = {}; imp.forEach(i => { const v = f(i); if (v) m[v] = (m[v] || 0) + 1 }); return Object.entries(m).sort((a, b) => b[1] - a[1]) }
    const dim = { 'Ditta individuale (1)': 0, 'Micro (2-9)': 0, 'Piccola (10-49)': 0, 'Media/grande (50+)': 0 }
    imp.forEach(i => { const a = i.addetti; if (a == null) return; dim[a <= 1 ? 'Ditta individuale (1)' : a <= 9 ? 'Micro (2-9)' : a <= 49 ? 'Piccola (10-49)' : 'Media/grande (50+)']++ })
    // nuovi partecipanti per mese: ultimi 12 mesi con zeri
    const mesi = []
    const d = new Date(); d.setDate(1)
    for (let i = 11; i >= 0; i--) { const x = new Date(d.getFullYear(), d.getMonth() - i, 1); mesi.push(x.toLocaleDateString('sv-SE').slice(0, 7)) }
    const nuoviMese = Object.fromEntries(mesi.map(m => [m, 0])), iscrMese = Object.fromEntries(mesi.map(m => [m, 0]))
    persone.forEach(p => { const m = (p.prima || '').slice(0, 7); if (m in nuoviMese) nuoviMese[m]++ })
    regs.forEach(r => { const m = (r.created_at || '').slice(0, 7); if (m in iscrMese) iscrMese[m]++ })
    return {
      perEvento, conclusi, tassoPres: iscrConcl ? Math.round(presConcl / iscrConcl * 100) : null, noShow: Math.max(0, iscrConcl - presConcl),
      nuovi30, assidui, rinunce: regs.filter(r => r.rinuncia).length,
      natura: conta(i => i.natura_giuridica).slice(0, 6), settori: conta(i => i.settore || i.descrizione_ateco).slice(0, 8),
      comuni: conta(i => i.comune).slice(0, 8), dim, nImpInfo: imp.length, mesi, nuoviMese, iscrMese,
    }
  }, [regs, eventi, persone, st, info])

  const filtrate = useMemo(() => {
    const nq = norm(q)
    let l = persone.filter(p => {
      if (fTipo !== 'tutti' && p.tipo !== fTipo) return false
      if (fAssoc === 'si' && !p.associato) return false
      if (fAssoc === 'no' && p.associato) return false
      if (!nq) return true
      const hay = norm([p.nome, p.cognome, p.emails.join(' '), p.aziende.map(a => a.ragione_sociale + ' ' + a.piva).join(' ')].join(' '))
      return nq.split(' ').every(w => hay.includes(w))
    })
    const cmp = {
      iscrizioni: (a, b) => b.nEventi - a.nEventi || b.iscrizioni - a.iscrizioni,
      recenti: (a, b) => (b.ultima || '').localeCompare(a.ultima || ''),
      nome: (a, b) => (a.cognome + a.nome).localeCompare(b.cognome + b.nome, 'it'),
      presenze: (a, b) => b.presenze - a.presenze,
    }[sort]
    return l.sort(cmp)
  }, [persone, q, fTipo, fAssoc, sort])

  useEffect(() => { setLimit(50) }, [q, fTipo, fAssoc, sort])

  function exportXlsx() {
    setExporting(true)
    try {
      const wb = XLSX.utils.book_new()
      const sh1 = filtrate.map(p => ({
        'Cognome': p.cognome, 'Nome': p.nome, 'Tipologia': TIPO_LABEL[p.tipo],
        'Ragione sociale': p.aziende.map(a => a.ragione_sociale).filter(Boolean).join(' | '),
        'P.IVA': p.aziende.map(a => a.piva).filter(Boolean).join(' | '),
        'Associato CNA': p.associato ? 'Si' : 'No',
        'Categoria': p.mestieri.join(', '), 'CAP': p.caps.join(', '),
        'Email': p.emails.join(', '), 'Cellulare': p.tel.join(', '),
        'Eventi': p.nEventi, 'Iscrizioni': p.iscrizioni, 'Presenze': p.presenze, 'Rinunce': p.rinunce,
        'Prima iscrizione': fmtD(p.prima), 'Ultima iscrizione': fmtD(p.ultima),
        'Eventi frequentati': [...p.eventi].map(id => eventi[id]?.titolo).filter(Boolean).join(' | '),
      }))
      const ws1 = XLSX.utils.json_to_sheet(sh1)
      ws1['!cols'] = [16,16,14,32,16,10,20,8,30,16,8,10,10,8,14,14,60].map(w => ({ wch:w }))
      XLSX.utils.book_append_sheet(wb, ws1, 'Persone uniche')
      const sh2 = st.impList.map(i => ({
        'Ragione sociale': i.ragione_sociale, 'P.IVA': i.piva, 'Associata CNA': i.associato ? 'Si' : 'No',
        'Categoria': i.mestiere, 'Persone': i.nPersone, 'Eventi': i.nEventi, 'Iscrizioni': i.iscrizioni,
      }))
      const ws2 = XLSX.utils.json_to_sheet(sh2)
      ws2['!cols'] = [36,14,12,22,10,10,10].map(w => ({ wch:w }))
      XLSX.utils.book_append_sheet(wb, ws2, 'Imprese')
      XLSX.writeFile(wb, `partecipanti-unici-${new Date().toISOString().slice(0,10)}.xlsx`)
    } catch (e) { console.error(e); alert('Errore durante l\'export.') }
    setExporting(false)
  }

  if (loading) return <p style={{ color:'#9CA3AF', textAlign:'center', padding:'40px', fontSize:'14px' }}>Caricamento...</p>
  if (errore) return <p style={{ color:'#DC2626', textAlign:'center', padding:'40px', fontSize:'14px' }}>Errore: {errore}</p>

  const nPers = persone.length || 1
  const pct = (n) => Math.round((n / nPers) * 100)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
      {/* KPI */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))', gap:'12px' }}>
        <GlowStatCard icon="users"     label="Persone uniche"    value={persone.length} sub={`${regs.length} iscrizioni totali`} palette="blue"/>
        <GlowStatCard icon="usercheck" label="Imprese uniche"    value={st.impList.length} sub={`${st.tipi.impresa} persone (${pct(st.tipi.impresa)}%)`} palette="violet"/>
        <GlowStatCard icon="star"      label="Associati CNA"     value={st.assoc} sub={`${pct(st.assoc)}% persone - ${st.impAssoc} imprese`} palette="green"/>
        <GlowStatCard icon="trending"  label="Ricorrenti (2+ eventi)" value={st.ricorrenti} sub={`${pct(st.ricorrenti)}% - media ${st.mediaEventi} eventi`} palette="amber"/>
        <GlowStatCard icon="check"     label="Presenze registrate" value={st.presTot} sub={st.presTot === 0 ? 'nessun check-in effettuato' : `${Math.round(st.presTot/regs.length*100)}% delle iscrizioni`} palette="teal"/>
        <GlowStatCard icon="percent"   label="Tasso di presenza" value={st2.tassoPres != null ? st2.tassoPres + '%' : '-'} sub={st2.conclusi.length ? `su ${st2.conclusi.length} eventi conclusi con check-in` : 'nessun evento concluso con check-in'} palette="green"/>
        <GlowStatCard icon="userx"     label="Assenze (no-show)" value={st2.noShow} sub={`${st2.rinunce} rinunce comunicate`} palette="red"/>
        <GlowStatCard icon="activity"  label="Nuovi ultimi 30 giorni" value={st2.nuovi30} sub="persone alla prima iscrizione" palette="cyan"/>
      </div>

      {/* Distribuzioni */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:'12px' }}>
        <Panel title="Tipologia partecipanti">
          <StackBar parts={['impresa','ente','privato'].map(t => ({ label:TIPO_LABEL[t], n:st.tipi[t], color:TIPO_COL[t] }))}/>
          {['impresa','ente','privato'].map(t => (
            <Bar key={t} label={TIPO_LABEL[t]} n={st.tipi[t]} max={nPers} color={TIPO_COL[t]} onClick={() => setFTipo(fTipo === t ? 'tutti' : t)} active={fTipo === t}/>
          ))}
          <p style={s.note}>Impresa = P.IVA valida. Ente = ragione sociale senza P.IVA.</p>
        </Panel>
        <Panel title="Fidelizzazione (eventi per persona)">
          {Object.entries(st.freq).map(([k, n]) => <Bar key={k} label={`${k} event${k === '1' ? 'o' : 'i'}`} n={n} max={nPers} color="#7C4DFF"/>)}
        </Panel>
        <Panel title="Fidelizzazione per evento">
          {st2.perEvento.slice(0, 7).map(e => (
            <div key={e.id} style={{ marginBottom:'9px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', marginBottom:'3px', gap:8 }}>
                <span style={{ color:'#374151', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.titolo}</span>
                <span style={{ color:'#6B7280', flexShrink:0 }}><b style={{ color:'#059669' }}>{e.ritorni}</b> ritorni / <b style={{ color:'#5B5FEF' }}>{e.nuovi}</b> nuovi</span>
              </div>
              <StackBar parts={[{ label:'Ritorni', n:e.ritorni, color:'#059669' }, { label:'Nuovi', n:e.nuovi, color:'#A5A8F6' }]}/>
            </div>
          ))}
          <p style={s.note}>Ritorno = la persona aveva gia partecipato a un evento precedente.</p>
        </Panel>
      </div>

      <Panel title="Crescita della community (ultimi 12 mesi)">
        <AreaCurveChart labels={st2.mesi.map(m => new Date(m + '-01T12:00:00').toLocaleDateString('it-IT', { month:'short' }))}
          tips={st2.mesi.map(m => new Date(m + '-01T12:00:00').toLocaleDateString('it-IT', { month:'long', year:'numeric' }))}
          series={[{ name:'Iscrizioni', color:'#A5A8F6', values: st2.mesi.map(m => st2.iscrMese[m]) }, { name:'Nuove persone', color:'#5B5FEF', values: st2.mesi.map(m => st2.nuoviMese[m]) }]}/>
      </Panel>

      <Panel title="Presenza per evento">
        {st2.perEvento.length === 0 ? <p style={s.note}>Nessun evento</p> :
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px', minWidth:'560px' }}>
            <thead><tr>{['Evento','Data','Iscritti','Rinunce','Presenti','Presenza','Nuovi'].map(h => <th key={h} style={{ ...s.th, background:'transparent', textAlign: h === 'Evento' || h === 'Data' ? 'left' : 'right' }}>{h}</th>)}</tr></thead>
            <tbody>{st2.perEvento.slice(0, 12).map(e => {
              const attivi = e.iscritti - e.rinunce
              const p = attivi ? Math.round(e.presenti / attivi * 100) : 0
              const futuro = !e.data || e.data > new Date().toISOString()
              return <tr key={e.id} style={{ borderBottom:'1px solid #F3F4F6' }}>
                <td style={{ ...s.td, fontWeight:700, color:'#111827', maxWidth:260, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.titolo}</td>
                <td style={{ ...s.td, color:'#6B7280', whiteSpace:'nowrap' }}>{fmtD(e.data)}</td>
                <td style={{ ...s.td, textAlign:'right', fontWeight:700 }}>{e.iscritti}</td>
                <td style={{ ...s.td, textAlign:'right', color: e.rinunce ? '#B45309' : '#D1D5DB' }}>{e.rinunce}</td>
                <td style={{ ...s.td, textAlign:'right', color: e.presenti ? '#059669' : '#D1D5DB', fontWeight:700 }}>{e.presenti}</td>
                <td style={{ ...s.td, textAlign:'right', minWidth:120 }}>{futuro && !e.presenti ? <span style={{ color:'#9CA3AF', fontSize:'12px' }}>in programma</span> : !e.presenti ? <span style={{ color:'#9CA3AF', fontSize:'12px' }}>check-in non usato</span> :
                  <div style={{ display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end' }}>
                    <div style={{ width:60, height:6, background:'#F3F4F6', borderRadius:3 }}><div style={{ width:`${Math.min(100,p)}%`, height:'100%', background: p >= 70 ? '#059669' : p >= 50 ? '#F59E0B' : '#DC2626', borderRadius:3 }}/></div>
                    <b style={{ fontSize:'12px' }}>{p}%</b>
                  </div>}</td>
                <td style={{ ...s.td, textAlign:'right', color:'#5B5FEF' }}>{e.iscritti ? Math.round(e.nuovi / e.iscritti * 100) : 0}%</td>
              </tr>
            })}</tbody>
          </table>
        </div>}
      </Panel>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:'12px' }}>
        <Panel title="Partecipanti piu assidui">
          {st2.assidui.length === 0 ? <p style={s.note}>Nessuna presenza registrata</p> : st2.assidui.map((p, i) => (
            <div key={p.key} style={s.rowLine} onClick={() => setSel(p)}>
              <span style={{ width:18, fontSize:'12px', fontWeight:800, color: i < 3 ? '#F59E0B' : '#9CA3AF' }}>{i + 1}</span>
              <Avatar p={p} size={26}/>
              <div style={{ flex:1, minWidth:0, cursor:'pointer' }}>
                <p style={s.rowTitle}>{p.cognome} {p.nome}</p>
                <p style={s.rowSub}>{p.aziende[0]?.ragione_sociale || (p.tipo === 'privato' ? 'Privato' : '')}</p>
              </div>
              <span style={s.rowNum}>{p.presenze}</span>
            </div>
          ))}
        </Panel>
        <Panel title="Dimensione imprese (addetti)">
          {st2.nImpInfo === 0 ? <p style={s.note}>Dati anagrafici non ancora disponibili</p> : <>
            {Object.entries(st2.dim).map(([k, n]) => <Bar key={k} label={k} n={n} max={st2.nImpInfo} color="#7C4DFF"/>)}
            <p style={s.note}>Su {st2.nImpInfo} imprese con dati da archivio CNA / camera di commercio.</p>
          </>}
        </Panel>
        {st2.natura.length > 0 && <Panel title="Forma giuridica">
          {st2.natura.map(([k, n]) => <Bar key={k} label={k} n={n} max={st2.natura[0][1]} color="#0891B2"/>)}
        </Panel>}
        {st2.settori.length > 0 && <Panel title="Settori di attivita">
          {st2.settori.map(([k, n]) => <Bar key={k} label={k} n={n} max={st2.settori[0][1]} color="#14B8A6"/>)}
        </Panel>}
        {st2.comuni.length > 0 && <Panel title="Comuni delle imprese">
          {st2.comuni.map(([k, n]) => <Bar key={k} label={k} n={n} max={st2.comuni[0][1]} color="#F97316"/>)}
        </Panel>}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:'12px' }}>
        <ImpreseTable list={st.impList} eventi={eventi} info={info}/>
        <Panel title="Categorie / mestieri">
          <CategoriePanel regs={regs} info={info} eventi={eventi} mestiereDi={mestiereDi} syncing={syncing} onSync={sincronizza}/>
        </Panel>
        {st.enti.length > 0 && <Panel title="Enti / organizzazioni">
          {st.enti.map(e => <Bar key={e.nome} label={e.nome} n={e.n} max={st.enti[0].n} color="#F59E0B"/>)}
        </Panel>}
      </div>

      {/* Elenco + dettaglio */}
      <div style={{ display:'grid', gridTemplateColumns: sel ? 'minmax(0,1.3fr) minmax(0,1fr)' : '1fr', gap:'20px' }} className="stats-user-split">
        <div>
          <div style={{ display:'flex', gap:'8px', marginBottom:'12px', alignItems:'center', flexWrap:'wrap' }}>
            <div style={{ position:'relative', flex:'1 1 220px' }}>
              <Search size={15} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }}/>
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Cerca nome, email, azienda, P.IVA..." style={s.input}/>
            </div>
            <select value={fTipo} onChange={e => setFTipo(e.target.value)} style={s.select}>
              <option value="tutti">Tutte le tipologie</option>
              <option value="impresa">Imprese</option>
              <option value="ente">Enti / Organizzazioni</option>
              <option value="privato">Privati</option>
            </select>
            <select value={fAssoc} onChange={e => setFAssoc(e.target.value)} style={s.select}>
              <option value="tutti">Associati e non</option>
              <option value="si">Solo associati CNA</option>
              <option value="no">Non associati</option>
            </select>
            <select value={sort} onChange={e => setSort(e.target.value)} style={s.select}>
              <option value="iscrizioni">Ordina: piu eventi</option>
              <option value="recenti">Ordina: piu recenti</option>
              <option value="presenze">Ordina: presenze</option>
              <option value="nome">Ordina: cognome A-Z</option>
            </select>
            <button onClick={exportXlsx} disabled={exporting || !filtrate.length} style={s.btnXls}>
              <Download size={15}/>{exporting ? 'Esportazione...' : 'Esporta Excel'}
            </button>
          </div>
          <p style={{ fontSize:'12px', color:'#6B7280', margin:'0 0 8px' }}>{filtrate.length} persone</p>

          <div style={{ backgroundColor:'#fff', borderRadius:'20px', border:'1px solid #E8ECF4', overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px', minWidth:'560px' }}>
              <thead>
                <tr>{['Partecipante','Azienda','Eventi','Presenze','Ultima'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtrate.slice(0, limit).map(p => {
                  const a = p.aziende[0]
                  const on = sel?.key === p.key
                  return (
                    <tr key={p.key} onClick={() => setSel(on ? null : p)} style={{ borderBottom:'1px solid #F3F4F6', cursor:'pointer', backgroundColor: on ? '#EEEFFD' : 'transparent' }}>
                      <td style={s.td}>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                          <Avatar p={p} size={28}/>
                          <div style={{ minWidth:0 }}>
                            <p style={s.rowTitle}>{p.cognome} {p.nome}</p>
                            <p style={s.rowSub}>{p.emails[0] || p.tel[0] || ''}{p.emails.length > 1 ? ` +${p.emails.length - 1}` : ''}</p>
                          </div>
                        </div>
                      </td>
                      <td style={s.td}>
                        {a ? <>
                          <p style={{ ...s.rowTitle, fontWeight:600 }}>{a.ragione_sociale || '-'}{p.aziende.length > 1 ? ` +${p.aziende.length - 1}` : ''}</p>
                          <div style={{ display:'flex', gap:'4px', marginTop:'2px', flexWrap:'wrap' }}>
                            <Badge c={TIPO_COL[p.tipo]} bg="#F3F4F6">{p.tipo === 'impresa' ? 'P.IVA ' + a.piva : 'Ente'}</Badge>
                            {p.associato && <Badge c="#16A34A" bg="#DCFCE7">CNA</Badge>}
                          </div>
                        </> : <span style={{ color:'#9CA3AF', fontSize:'12px' }}>Privato</span>}
                      </td>
                      <td style={s.td}><span style={{ fontWeight:800, color:'#5B5FEF' }}>{p.nEventi}</span>{p.iscrizioni > p.nEventi && <span style={s.rowSub}> ({p.iscrizioni} iscr.)</span>}</td>
                      <td style={s.td}><span style={{ fontWeight:800, color: p.presenze ? '#059669' : '#D1D5DB' }}>{p.presenze}</span></td>
                      <td style={{ ...s.td, color:'#6B7280', fontSize:'12px', whiteSpace:'nowrap' }}>{fmtD(p.ultima)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filtrate.length === 0 && <div style={{ padding:'40px', textAlign:'center', color:'#9CA3AF', fontSize:'13px' }}>Nessun partecipante trovato</div>}
            {filtrate.length > limit && (
              <button onClick={() => setLimit(limit + 100)} style={s.btnMore}>
                <ChevronDown size={14}/> Mostra altri ({filtrate.length - limit} rimanenti)
              </button>
            )}
          </div>
        </div>

        {sel && <Dettaglio p={sel} eventi={eventi} onClose={() => setSel(null)}/>}
      </div>
    </div>
  )
}

function ImpreseTable({ list, eventi, info }) {
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('eventi')
  const [fA, setFA] = useState('tutte')
  const [limit, setLimit] = useState(10)
  const [open, setOpen] = useState(null)
  const l = useMemo(() => {
    const nq = norm(q)
    return list.filter(i => (fA === 'tutte' || (fA === 'si') === i.associato) && (!nq || norm(i.ragione_sociale + ' ' + i.piva).includes(nq)))
      .map(i => (!i.ragione_sociale || cleanPiva(i.ragione_sociale) === i.piva) && info[i.piva]?.ragione_sociale ? { ...i, ragione_sociale: info[i.piva].ragione_sociale } : i)
      .sort({
        eventi: (a, b) => b.nEventi - a.nEventi || b.nPersone - a.nPersone,
        persone: (a, b) => b.nPersone - a.nPersone || b.nEventi - a.nEventi,
        nome: (a, b) => (a.ragione_sociale || a.piva).localeCompare(b.ragione_sociale || b.piva, 'it'),
      }[sort])
  }, [list, q, sort, fA, info])
  useEffect(() => { setLimit(10) }, [q, sort, fA])
  return (
    <div style={s.panel}>
      <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap', marginBottom:'10px' }}>
        <p style={{ ...s.panelTitle, margin:0, flex:'1 1 auto' }}>Imprese ({l.length})</p>
        <select value={fA} onChange={e => setFA(e.target.value)} style={s.select}>
          <option value="tutte">Tutte</option><option value="si">Associate CNA</option><option value="no">Non associate</option>
        </select>
        <select value={sort} onChange={e => setSort(e.target.value)} style={s.select}>
          <option value="eventi">Per eventi</option><option value="persone">Per persone</option><option value="nome">A-Z</option>
        </select>
      </div>
      <div style={{ position:'relative', marginBottom:'8px' }}>
        <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }}/>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Cerca impresa o P.IVA..." style={s.input}/>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 56px 56px 56px', gap:'6px', padding:'6px 0', borderBottom:'1px solid #E8ECF4', fontSize:'10px', fontWeight:700, color:'#9CA3AF', textTransform:'uppercase' }}>
        <span>Impresa</span><span style={{ textAlign:'center' }}>Eventi</span><span style={{ textAlign:'center' }}>Pers.</span><span style={{ textAlign:'center' }}>Iscr.</span>
      </div>
      {l.slice(0, limit).map(i => {
        const on = open === i.piva
        const nomeOk = i.ragione_sociale && cleanPiva(i.ragione_sociale) !== i.piva
        return (
          <div key={i.piva} style={{ borderBottom: on ? 'none' : '1px solid #F3F4F6', background: on ? 'linear-gradient(160deg,#003DA5 0%,#0A4FC4 55%,#1E63D6 100%)' : 'transparent', borderRadius: on ? '18px' : 0, margin: on ? '8px 0' : 0, boxShadow: on ? '0 10px 30px rgba(0,61,165,.28)' : 'none', transition:'background .15s' }}>
            <div onClick={() => setOpen(on ? null : i.piva)} style={{ display:'grid', gridTemplateColumns:'1fr 56px 56px 56px', gap:'6px', alignItems:'center', padding:'9px 4px', cursor:'pointer' }}>
              <div style={{ minWidth:0, display:'flex', gap:'8px', alignItems:'center' }}>
                <ChevronDown size={14} style={{ color: on ? '#BFDBFE' : '#9CA3AF', flexShrink:0, transform: on ? 'rotate(180deg)' : 'none', transition:'transform .15s' }}/>
                <div style={{ minWidth:0 }}>
                  <p style={{ ...s.rowTitle, color: on ? '#FFFFFF' : (nomeOk ? '#5B5FEF' : '#9CA3AF'), whiteSpace:'nowrap', fontSize: on ? '15px' : s.rowTitle.fontSize }}>{nomeOk ? i.ragione_sociale : '(ragione sociale mancante)'} {i.associato && <Badge c="#16A34A" bg="#DCFCE7">CNA</Badge>}</p>
                  <p style={{ ...s.rowSub, color: on ? '#BFDBFE' : s.rowSub.color }}>P.IVA {i.piva}{i.mestiere ? ' - ' + i.mestiere : ''}</p>
                </div>
              </div>
              <span style={{ ...s.rowNum, textAlign:'center', color: on ? '#fff' : s.rowNum.color }}>{i.nEventi}</span>
              <span style={{ textAlign:'center', fontWeight:700, color: on ? '#fff' : '#111827' }}>{i.nPersone}</span>
              <span style={{ textAlign:'center', fontWeight:600, color: on ? '#DBEAFE' : '#6B7280' }}>{i.iscrizioni}</span>
            </div>
            {on && <ImpresaDettaglio i={i} eventi={eventi} x={info[i.piva]}/>}
          </div>
        )
      })}
      {l.length === 0 && <p style={s.note}>Nessuna impresa trovata</p>}
      {l.length > limit && <button onClick={() => setLimit(limit + 20)} style={{ ...s.btnMore, borderRadius:'0 0 12px 12px' }}><ChevronDown size={14}/> Mostra altre ({l.length - limit})</button>}
    </div>
  )
}

function ImpresaDettaglio({ i, eventi, x }) {
  const now = new Date().toISOString()
  const pers = {}
  const evs = {}
  const contatti = { email:new Set(), tel:new Set(), cap:new Set() }
  let pres = 0, iscrConclusi = 0, presConclusi = 0
  for (const r of i.regs) {
    const ev = eventi[r.event_id]
    const concluso = !!ev && (ev.data_fine || ev.data_inizio || '') < now
    const k = norm(r.nome) + '|' + norm(r.cognome)
    if (!pers[k]) pers[k] = { nome: cap(r.nome) + ' ' + cap(r.cognome), email:'', n:0, pres:0 }
    pers[k].n++
    if (!pers[k].email && r.email) pers[k].email = r.email.toLowerCase()
    if (isPresente(r)) { pers[k].pres++; pres++ }
    if (concluso) { iscrConclusi++; if (isPresente(r)) presConclusi++ }
    if (r.event_id) { evs[r.event_id] = evs[r.event_id] || { n:0, pres:0, concluso }; evs[r.event_id].n++; if (isPresente(r)) evs[r.event_id].pres++ }
    if (r.email) contatti.email.add(r.email.trim().toLowerCase())
    if (r.cellulare) contatti.tel.add(r.cellulare.trim())
    if (r.cap) contatti.cap.add(r.cap.trim())
  }
  const date = i.regs.map(r => r.created_at).sort()
  const evList = Object.entries(evs).map(([id, v]) => ({ ...v, ev: eventi[id] }))
    .sort((a, b) => (b.ev?.data_inizio || '').localeCompare(a.ev?.data_inizio || ''))
  const tasso = iscrConclusi > 0 ? Math.round(presConclusi / iscrConclusi * 100) : null

  const card = { background:'#fff', borderRadius:'14px', padding:'14px 16px', boxShadow:'0 2px 8px rgba(0,0,0,.08)' }
  const h = { fontSize:'11px', fontWeight:800, color:'#003DA5', textTransform:'uppercase', letterSpacing:'.06em', margin:'0 0 10px', display:'flex', alignItems:'center', gap:'6px' }
  const riga = { fontSize:'12.5px', color:'#374151', margin:'0 0 5px', lineHeight:1.45 }
  const chip = (bg, fg) => ({ fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'999px', background:bg, color:fg, whiteSpace:'nowrap' })
  const kpi = (label, v, sub) => (
    <div style={{ background:'rgba(255,255,255,.12)', border:'1px solid rgba(255,255,255,.18)', borderRadius:'14px', padding:'10px 8px', textAlign:'center' }}>
      <p style={{ fontSize: typeof v === 'string' && v.length > 6 ? '13px' : '22px', fontWeight:900, color:'#fff', margin:0, lineHeight:1.15 }}>{v}</p>
      <p style={{ fontSize:'11px', color:'#DBEAFE', margin:'3px 0 0', fontWeight:600 }}>{label}</p>
      {sub && <p style={{ fontSize:'10px', color:'#93C5FD', margin:'1px 0 0' }}>{sub}</p>}
    </div>
  )

  return (
    <div style={{ padding:'2px 12px 14px', display:'flex', flexDirection:'column', gap:'10px' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,minmax(0,1fr))', gap:'8px' }}>
        {kpi('Eventi', i.nEventi)}
        {kpi('Persone', i.nPersone)}
        {kpi('Presenze', pres, tasso != null ? tasso + '% presenza' : 'nessun evento concluso')}
        {kpi('Prima iscr.', fmtD(date[0]))}
      </div>

      <div style={card}>
        <p style={h}>Anagrafica</p>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap', marginBottom:'8px' }}>
          <span style={{ fontSize:'15px', fontWeight:800, color:'#111827' }}>{i.ragione_sociale || '-'}</span>
          <span style={chip(i.associato ? '#DCFCE7' : '#F3F4F6', i.associato ? '#15803D' : '#6B7280')}>{i.associato ? 'Associata CNA' : 'Non associata'}</span>
        </div>
        <p style={riga}><b>P.IVA</b> {i.piva}{i.mestiere ? ' · ' + i.mestiere : ''}{contatti.cap.size ? ' · CAP ' + [...contatti.cap].join(', ') : ''}</p>
        {x && <p style={riga}>{[x.unione && 'Unione ' + x.unione, x.natura_giuridica, x.comune, x.addetti ? x.addetti + ' addetti' : ''].filter(Boolean).join(' · ')}</p>}
        {x?.ateco && <p style={riga}><b>ATECO</b> {x.ateco}{x.descrizione_ateco ? ' · ' + x.descrizione_ateco : ''}</p>}
        {x?.ragione_sociale && cleanPiva(i.ragione_sociale) === i.piva && <p style={riga}>Denominazione ufficiale: <b>{x.ragione_sociale}</b></p>}
        <p style={{ ...s.rowSub, marginTop:'2px' }}>Ultima iscrizione: {fmtD(date[date.length - 1])}{x ? ' · fonte: ' + x.fonte : ''}</p>
        {(contatti.email.size > 0 || contatti.tel.size > 0) && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginTop:'10px', paddingTop:'10px', borderTop:'1px solid #EEF2F7' }}>
            {[...contatti.email].map(e => <a key={e} href={'mailto:' + e} style={{ fontSize:'12px', color:'#003DA5', textDecoration:'none', display:'flex', gap:5, alignItems:'center', background:'#EFF6FF', padding:'4px 10px', borderRadius:'999px', fontWeight:600 }}><Mail size={12}/>{e}</a>)}
            {[...contatti.tel].map(t => <a key={t} href={'tel:' + t} style={{ fontSize:'12px', color:'#003DA5', textDecoration:'none', display:'flex', gap:5, alignItems:'center', background:'#EFF6FF', padding:'4px 10px', borderRadius:'999px', fontWeight:600 }}><Phone size={12}/>{t}</a>)}
          </div>
        )}
      </div>

      <div style={card}>
        <p style={h}>Eventi ({evList.length})</p>
        {evList.map((e, k) => {
          const badge = e.pres > 0 ? ['Partecipato', '#DCFCE7', '#15803D']
            : e.concluso ? ['Non partecipato', '#FEE2E2', '#B91C1C']
            : ['In programma', '#DBEAFE', '#1D4ED8']
          const pct = e.n ? Math.round(e.pres / e.n * 100) : 0
          return (
            <div key={k} style={{ padding:'9px 0', borderTop: k ? '1px solid #F1F4F9' : 'none' }}>
              <div style={{ display:'flex', justifyContent:'space-between', gap:'8px', alignItems:'flex-start' }}>
                <div style={{ minWidth:0 }}>
                  <p style={{ fontSize:'13.5px', fontWeight:700, color:'#111827', margin:0 }}>{e.ev?.titolo || 'Evento rimosso'}</p>
                  <p style={s.rowSub}>{fmtD(e.ev?.data_inizio)}{e.ev?.luogo ? ' · ' + e.ev.luogo : ''}</p>
                </div>
                <span style={chip(badge[1], badge[2])}>{badge[0]}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'6px' }}>
                <div style={{ flex:1, height:'6px', background:'#EEF2F7', borderRadius:'99px', overflow:'hidden' }}>
                  <div style={{ width: pct + '%', height:'100%', background:'#16A34A', borderRadius:'99px' }}/>
                </div>
                <span style={{ fontSize:'11.5px', color:'#4B5563', fontWeight:600, whiteSpace:'nowrap' }}>
                  {e.concluso || e.pres ? `${e.pres} presenti su ${e.n}` : `${e.n} iscritti`}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div style={card}>
        <p style={h}>Persone ({Object.keys(pers).length})</p>
        {Object.values(pers).sort((a, b) => b.pres - a.pres || b.n - a.n).map((p, k) => (
          <div key={p.nome + p.email} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:'8px', padding:'7px 0', borderTop: k ? '1px solid #F1F4F9' : 'none' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', minWidth:0 }}>
              <div style={{ width:30, height:30, borderRadius:'50%', background:'#E0EAFF', color:'#003DA5', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:800, flexShrink:0 }}>
                {p.nome.split(' ').map(w => w[0]).slice(0, 2).join('')}
              </div>
              <div style={{ minWidth:0 }}>
                <p style={{ ...s.rowTitle, fontWeight:700 }}>{p.nome}</p>
                {p.email && <p style={{ ...s.rowSub, overflow:'hidden', textOverflow:'ellipsis' }}>{p.email}</p>}
              </div>
            </div>
            <div style={{ display:'flex', gap:'4px', flexShrink:0 }}>
              <span style={chip('#EFF6FF', '#1D4ED8')}>{p.n} iscr.</span>
              {p.pres > 0 && <span style={chip('#DCFCE7', '#15803D')}>{p.pres} pres.</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Dettaglio({ p, eventi, onClose }) {
  const cron = [...p.regs].map(r => ({ ...r, ev: eventi[r.event_id] }))
    .sort((a, b) => (b.ev?.data_inizio || b.created_at).localeCompare(a.ev?.data_inizio || a.created_at))
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
      <div style={s.panel}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'14px' }}>
          <Avatar p={p} size={44}/>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:'17px', fontWeight:800, color:'#111827', margin:0 }}>{p.nome} {p.cognome}</p>
            <div style={{ display:'flex', gap:'4px', marginTop:'4px' }}>
              <Badge c={TIPO_COL[p.tipo]} bg="#F3F4F6">{TIPO_LABEL[p.tipo]}</Badge>
              {p.associato && <Badge c="#16A34A" bg="#DCFCE7">Associato CNA</Badge>}
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF' }}><X size={18}/></button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px' }}>
          <Mini label="Eventi" v={p.nEventi} c="#5B5FEF"/>
          <Mini label="Presenze" v={p.presenze} c="#059669"/>
          <Mini label="Cliente dal" v={fmtD(p.prima)} c="#111827" small/>
        </div>
        <div style={{ marginTop:'14px', display:'flex', flexDirection:'column', gap:'6px' }}>
          {p.emails.map(e => <Info key={e} icon={Mail}>{e}</Info>)}
          {p.tel.map(t => <Info key={t} icon={Phone}>{t}</Info>)}
          {(p.mestieri.length > 0 || p.caps.length > 0) && <p style={s.rowSub}>{[p.mestieri.join(', '), p.caps.length ? 'CAP ' + p.caps.join(', ') : ''].filter(Boolean).join(' - ')}</p>}
        </div>
      </div>

      {p.aziende.length > 0 && (
        <div style={s.panel}>
          <p style={s.panelTitle}>Dati aziendali</p>
          {p.aziende.map((a, i) => (
            <div key={i} style={{ display:'flex', gap:'10px', alignItems:'flex-start', padding:'8px 0', borderTop: i ? '1px solid #F3F4F6' : 'none' }}>
              <Building2 size={16} style={{ color: a.piva ? '#5B5FEF' : '#F59E0B', marginTop:2, flexShrink:0 }}/>
              <div style={{ flex:1 }}>
                <p style={s.rowTitle}>{a.ragione_sociale || '(ragione sociale non indicata)'}</p>
                <p style={s.rowSub}>{a.piva ? 'P.IVA ' + a.piva : 'Senza P.IVA (ente/organizzazione)'} - {a.n} iscrizion{a.n === 1 ? 'e' : 'i'}</p>
              </div>
              {a.associato && <Badge c="#16A34A" bg="#DCFCE7">CNA</Badge>}
            </div>
          ))}
        </div>
      )}

      <div style={s.panel}>
        <p style={s.panelTitle}>Cronologia eventi</p>
        {cron.map((r, idx) => {
          const pres = isPresente(r)
          return (
            <div key={r.id} style={{ display:'flex', gap:'12px', paddingBottom:'14px', position:'relative' }}>
              {idx < cron.length - 1 && <div style={{ position:'absolute', left:11, top:26, bottom:0, width:2, backgroundColor:'#E8ECF4' }}/>}
              <div style={{ width:24, height:24, borderRadius:'50%', flexShrink:0, zIndex:1, border:'2px solid', borderColor: pres ? '#059669' : '#D1D5DB', backgroundColor: pres ? '#D1FAE5' : '#F9FAFB', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {pres ? <CheckCircle2 size={12} style={{ color:'#059669' }}/> : <Clock size={12} style={{ color:'#9CA3AF' }}/>}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={s.rowTitle}>{r.ev?.titolo || 'Evento rimosso'}</p>
                <p style={s.rowSub}>{fmtD(r.ev?.data_inizio)}{r.ev?.luogo ? ' - ' + r.ev.luogo : ''}</p>
                <div style={{ display:'flex', gap:'4px', marginTop:'4px', flexWrap:'wrap' }}>
                  <Badge c={pres ? '#065f46' : r.rinuncia ? '#DC2626' : '#6B7280'} bg={pres ? '#D1FAE5' : r.rinuncia ? '#FEE2E2' : '#F3F4F6'}>
                    {pres ? 'Presente' : r.rinuncia ? 'Rinuncia' : 'Iscritto'}
                  </Badge>
                  {r.ragione_sociale && <Badge c="#6B7280" bg="#F3F4F6">{r.ragione_sociale}</Badge>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CategoriePanel({ regs, info, eventi, mestiereDi, syncing, onSync }) {
  const [by, setBy] = useState('mestiere')
  const [open, setOpen] = useState(null)
  const [all, setAll] = useState(false)
  const { cats, tot, senza } = useMemo(() => {
    const m = {}
    let tot = 0, senza = 0
    const imp = new Set()
    for (const r of regs) {
      const pv = cleanPiva(r.partita_iva)
      const ok = pivaValida(pv)
      const c = by === 'mestiere' ? mestiereDi(r) : (ok && info[pv]?.unione) || ''
      if (!c) { if (ok && !imp.has(pv)) { imp.add(pv); senza++ } continue }
      tot++
      if (!m[c]) m[c] = { nome:c, imprese:{}, persone:new Set(), eventi:{}, iscr:0 }
      const g = m[c]
      g.iscr++
      g.persone.add(norm(r.nome) + '|' + norm(r.cognome))
      if (ok) g.imprese[pv] = (info[pv]?.ragione_sociale || r.ragione_sociale || pv)
      if (r.event_id) g.eventi[r.event_id] = (g.eventi[r.event_id] || 0) + 1
    }
    const cats = Object.values(m).map(g => ({ ...g, nImp:Object.keys(g.imprese).length, nPers:g.persone.size, nEv:Object.keys(g.eventi).length }))
      .sort((a, b) => b.nImp - a.nImp || b.iscr - a.iscr)
    return { cats, tot, senza }
  }, [regs, info, by, mestiereDi])
  const max = cats[0]?.nImp || 1
  return (
    <>
      <div style={{ display:'flex', gap:'6px', marginBottom:'10px', flexWrap:'wrap', alignItems:'center' }}>
        {['mestiere','unione'].map(k => (
          <button key={k} onClick={() => { setBy(k); setOpen(null) }} style={{ ...s.pill, ...(by === k ? s.pillOn : {}) }}>{k === 'mestiere' ? 'Mestiere' : 'Unione'}</button>
        ))}
        <button onClick={onSync} disabled={syncing} style={{ ...s.pill, marginLeft:'auto' }}>{syncing ? 'Aggiornamento...' : 'Aggiorna da Tesseramento'}</button>
      </div>
      <p style={s.note}>{cats.length} categorie - {senza} imprese non classificate. Il dato viene dal form o, se manca, dall'archivio CNA / Camera di Commercio tramite P.IVA.</p>
      <div style={{ marginTop:'10px' }}>
        {cats.length === 0 && <p style={s.note}>{syncing ? 'Recupero dati imprese in corso...' : 'Nessun dato'}</p>}
        {(all ? cats : cats.slice(0, 10)).map(g => {
          const on = open === g.nome
          return (
            <div key={g.nome} style={{ borderBottom:'1px solid #F3F4F6' }}>
              <div onClick={() => setOpen(on ? null : g.nome)} style={{ cursor:'pointer', padding:'7px 0' }}>
                <div style={{ display:'flex', justifyContent:'space-between', gap:'8px', fontSize:'12px', marginBottom:'4px' }}>
                  <span style={{ fontWeight:700, color: on ? '#0F766E' : '#111827', display:'flex', alignItems:'center', gap:4 }}>
                    <ChevronDown size={13} style={{ color:'#9CA3AF', transform: on ? 'rotate(180deg)' : 'none' }}/>{g.nome}
                  </span>
                  <span style={{ color:'#6B7280', whiteSpace:'nowrap' }}><b style={{ color:'#0F766E' }}>{g.nImp}</b> imp. - {g.nPers} pers. - {g.nEv} eventi</span>
                </div>
                <div style={{ height:6, background:'#F3F4F6', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ width:`${Math.round(g.nImp / max * 100)}%`, height:'100%', background:'#14B8A6', borderRadius:3 }}/>
                </div>
              </div>
              {on && (
                <div style={{ background:'#F7F8FC', borderRadius:'12px', padding:'10px 12px', margin:'0 0 10px' }}>
                  <p style={{ fontSize:'11px', fontWeight:800, color:'#6B7280', textTransform:'uppercase', margin:'0 0 6px' }}>Eventi a cui si sono registrati</p>
                  {Object.entries(g.eventi).map(([id, n]) => ({ ev:eventi[id], n })).sort((a, b) => b.n - a.n || (b.ev?.data_inizio || '').localeCompare(a.ev?.data_inizio || '')).map((e, k) => (
                    <div key={k} style={{ display:'flex', justifyContent:'space-between', gap:'8px', padding:'4px 0', borderBottom:'1px solid #EEF0F5' }}>
                      <div style={{ minWidth:0 }}>
                        <p style={{ ...s.rowTitle, fontWeight:600 }}>{e.ev?.titolo || 'Evento rimosso'}</p>
                        <p style={s.rowSub}>{fmtD(e.ev?.data_inizio)}{e.ev?.luogo ? ' - ' + e.ev.luogo : ''}</p>
                      </div>
                      <span style={{ fontSize:'12px', fontWeight:700, color:'#0F766E', whiteSpace:'nowrap' }}>{e.n} iscr.</span>
                    </div>
                  ))}
                  {g.nImp > 0 && <>
                    <p style={{ fontSize:'11px', fontWeight:800, color:'#6B7280', textTransform:'uppercase', margin:'10px 0 6px' }}>Imprese ({g.nImp})</p>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
                      {Object.values(g.imprese).sort().map((n, k) => <Badge key={k} c="#374151" bg="#fff">{n}</Badge>)}
                    </div>
                  </>}
                </div>
              )}
            </div>
          )
        })}
        {cats.length > 10 && <button onClick={() => setAll(!all)} style={{ ...s.pill, marginTop:'8px' }}>{all ? 'Mostra meno' : `Mostra tutte (${cats.length})`}</button>}
      </div>
    </>
  )
}

// ---------- UI atoms ----------
function Panel({ title, children }) {
  return <div style={s.panel}><p style={s.panelTitle}>{title}</p>{children}</div>
}
function Bar({ label, n, max, color, onClick, active }) {
  const w = max ? Math.round(n / max * 100) : 0
  return (
    <div onClick={onClick} style={{ marginBottom:'8px', cursor: onClick ? 'pointer' : 'default', opacity: active === false ? 1 : 1 }}>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', marginBottom:'3px' }}>
        <span style={{ color:'#374151', fontWeight: active ? 800 : 500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', paddingRight:8 }}>{label}</span>
        <span style={{ color:'#111827', fontWeight:700 }}>{n}</span>
      </div>
      <div style={{ height:6, background:'#F3F4F6', borderRadius:3, overflow:'hidden' }}>
        <div style={{ width:`${w}%`, height:'100%', background:color, borderRadius:3 }}/>
      </div>
    </div>
  )
}
function StackBar({ parts }) {
  const tot = parts.reduce((s, p) => s + p.n, 0) || 1
  return (
    <div style={{ display:'flex', height:10, borderRadius:5, overflow:'hidden', marginBottom:'12px' }}>
      {parts.map(p => <div key={p.label} title={p.label} style={{ width:`${p.n / tot * 100}%`, background:p.color }}/>)}
    </div>
  )
}
function Badge({ children, c, bg }) {
  return <span style={{ fontSize:'10px', fontWeight:700, padding:'2px 7px', borderRadius:'20px', color:c, backgroundColor:bg, whiteSpace:'nowrap' }}>{children}</span>
}
function Avatar({ p, size }) {
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background: p.tipo === 'impresa' ? '#5B5FEF' : p.tipo === 'ente' ? '#F59E0B' : '#9CA3AF', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      <span style={{ fontSize: size > 30 ? '15px' : '11px', fontWeight:800, color:'#fff' }}>{(p.nome[0] || '') + (p.cognome[0] || '')}</span>
    </div>
  )
}
function Mini({ label, v, c, small }) {
  return (
    <div style={{ background:'#F7F8FC', borderRadius:'12px', padding:'10px', textAlign:'center' }}>
      <p style={{ fontSize: small ? '13px' : '20px', fontWeight:800, color:c, margin:0 }}>{v}</p>
      <p style={{ fontSize:'11px', color:'#6B7280', margin:'2px 0 0' }}>{label}</p>
    </div>
  )
}
function Info({ icon: I, children }) {
  return <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'13px', color:'#374151' }}><I size={13} style={{ color:'#9CA3AF' }}/>{children}</div>
}

const s = {
  panel: { backgroundColor:'#fff', border:'1px solid #E8ECF4', borderRadius:'20px', padding:'18px' },
  panelTitle: { fontSize:'14px', fontWeight:800, color:'#111827', margin:'0 0 12px' },
  note: { fontSize:'11px', color:'#9CA3AF', margin:'8px 0 0' },
  rowLine: { display:'flex', alignItems:'center', gap:'10px', padding:'7px 0', borderBottom:'1px solid #F3F4F6' },
  rowTitle: { fontSize:'13px', fontWeight:700, color:'#111827', margin:0, overflow:'hidden', textOverflow:'ellipsis' },
  rowSub: { fontSize:'11px', color:'#9CA3AF', margin:0 },
  rowNum: { fontSize:'15px', fontWeight:800, color:'#5B5FEF' },
  th: { padding:'10px 14px', textAlign:'left', borderBottom:'1px solid #E8ECF4', backgroundColor:'#FAFAFA', fontSize:'11px', fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.04em' },
  td: { padding:'10px 14px', verticalAlign:'middle' },
  input: { width:'100%', boxSizing:'border-box', border:'1px solid #D1D5DB', borderRadius:'16px', padding:'9px 12px 9px 32px', fontSize:'13px', fontFamily:"'Inter',sans-serif", outline:'none' },
  select: { border:'1px solid #D1D5DB', borderRadius:'16px', padding:'8px 10px', fontSize:'12px', fontFamily:"'Inter',sans-serif", background:'#fff' },
  btnXls: { display:'flex', alignItems:'center', gap:'6px', backgroundColor:'#16A34A', color:'#fff', border:'none', borderRadius:'20px', padding:'9px 14px', fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:"'Inter',sans-serif", whiteSpace:'nowrap' },
  pill: { border:'1px solid #D1D5DB', background:'#fff', borderRadius:'20px', padding:'5px 12px', fontSize:'12px', fontWeight:600, color:'#374151', cursor:'pointer', fontFamily:"'Inter',sans-serif" },
  pillOn: { background:'#14B8A6', borderColor:'#14B8A6', color:'#fff' },
  btnMore: { width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', padding:'12px', border:'none', borderTop:'1px solid #E8ECF4', background:'#FAFAFA', color:'#5B5FEF', fontWeight:700, fontSize:'13px', cursor:'pointer', fontFamily:"'Inter',sans-serif" },
}
