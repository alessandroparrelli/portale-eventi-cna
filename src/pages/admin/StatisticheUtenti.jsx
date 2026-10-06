import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Search, Download, CheckCircle2, Clock, Building2, Mail, Phone, X, ChevronDown } from 'lucide-react'
import GlowStatCard from '../../components/GlowStatCard'
import * as XLSX from 'xlsx'

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
          fetchAll('events', 'id,titolo,data_inizio,luogo', 'data_inizio'),
          supabase.from('mestieri').select('id,nome').then(x => x.data || []),
        ])
        setRegs(r)
        setEventi(Object.fromEntries(ev.map(e => [e.id, e])))
        setMestieri(Object.fromEntries(ms.map(m => [m.id, m.nome])))
      } catch (e) { setErrore(e.message || String(e)) }
      setLoading(false)
    })()
  }, [])

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
      if (r.mestiere_id && mestieri[r.mestiere_id]) p.mestieri.add(mestieri[r.mestiere_id])
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
  }, [regs, mestieri])

  // ---------- statistiche globali ----------
  const st = useMemo(() => {
    const imprese = {}
    for (const r of regs) {
      const pv = cleanPiva(r.partita_iva)
      if (!pivaValida(pv)) continue
      if (!imprese[pv]) imprese[pv] = { piva:pv, ragione_sociale:(r.ragione_sociale||'').trim(), persone:new Set(), iscrizioni:0, eventi:new Set(), associato:false, mestiere:'' }
      const i = imprese[pv]
      i.iscrizioni++
      i.persone.add(norm(r.nome) + '|' + norm(r.cognome))
      if (r.event_id) i.eventi.add(r.event_id)
      if (r.associato_cna) i.associato = true
      if (!i.ragione_sociale && r.ragione_sociale) i.ragione_sociale = r.ragione_sociale.trim()
      if (!i.mestiere && r.mestiere_id) i.mestiere = mestieri[r.mestiere_id] || ''
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
  }, [persone, regs, mestieri])

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
        <Panel title="Nuovi partecipanti per mese">
          {st.mesi.length === 0 ? <p style={s.note}>Nessun dato</p> : (() => {
            const mx = Math.max(...st.mesi.map(m => m[1]))
            return (
              <div style={{ display:'flex', alignItems:'flex-end', gap:'4px', height:'120px', paddingTop:'8px' }}>
                {st.mesi.map(([m, n]) => (
                  <div key={m} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', height:'100%', justifyContent:'flex-end' }}>
                    <span style={{ fontSize:'10px', fontWeight:'700', color:'#5B5FEF' }}>{n}</span>
                    <div style={{ width:'100%', height:`${Math.max(4, n / mx * 80)}%`, background:'#5B5FEF', borderRadius:'4px 4px 0 0' }}/>
                    <span style={{ fontSize:'9px', color:'#9CA3AF' }}>{new Date(m + '-01').toLocaleDateString('it-IT', { month:'short' })}</span>
                  </div>
                ))}
              </div>
            )
          })()}
        </Panel>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:'12px' }}>
        <Panel title={`Top imprese per eventi (${st.impList.length})`}>
          {st.impList.slice(0, 10).map(i => (
            <div key={i.piva} style={s.rowLine}>
              <div style={{ minWidth:0, flex:1 }}>
                <p style={s.rowTitle}>{i.ragione_sociale || '(senza nome)'} {i.associato && <Badge c="#16A34A" bg="#DCFCE7">CNA</Badge>}</p>
                <p style={s.rowSub}>P.IVA {i.piva}{i.mestiere ? ' - ' + i.mestiere : ''} - {i.nPersone} pers.</p>
              </div>
              <span style={s.rowNum}>{i.nEventi}</span>
            </div>
          ))}
        </Panel>
        <Panel title="Categorie / mestieri">
          {st.mest.length === 0 ? <p style={s.note}>Categoria non compilata nelle iscrizioni</p>
            : st.mest.map(([m, n]) => <Bar key={m} label={m} n={n} max={st.mest[0][1]} color="#14B8A6"/>)}
          {st.enti.length > 0 && <>
            <p style={{ ...s.panelTitle, marginTop:'16px' }}>Enti / organizzazioni</p>
            {st.enti.map(e => <Bar key={e.nome} label={e.nome} n={e.n} max={st.enti[0].n} color="#F59E0B"/>)}
          </>}
        </Panel>
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
  btnMore: { width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', padding:'12px', border:'none', borderTop:'1px solid #E8ECF4', background:'#FAFAFA', color:'#5B5FEF', fontWeight:700, fontSize:'13px', cursor:'pointer', fontFamily:"'Inter',sans-serif" },
}
