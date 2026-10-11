import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

// Analisi approfondita dei partecipanti di un evento (presenti effettivi o tutti gli iscritti)
// Tutto in ASCII: vedi bug rolldown con caratteri non-ASCII.

const norm = s => (s || '').toString().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0)
const isPresente = r => !!(r.presente || r.checkin_at)
const pivaOk = p => (p || '').replace(/\D/g, '').length === 11

// ---------- genere stimato dal nome ----------
const MASCHILI_A = new Set(['andrea', 'luca', 'nicola', 'mattia', 'elia', 'enea', 'gianluca', 'tobia', 'battista', 'giosue', 'joshua', 'zaccaria', 'geremia', 'isaia', 'evangelista', 'leonida', 'gianandrea', 'pierluca', 'giannicola', 'mustafa', 'akira', 'sasha', 'misha', 'kosta', 'nikita', 'ilya'])
const FEMMINILI_ALTRO = new Set(['beatrice', 'alice', 'irene', 'adele', 'agnese', 'matilde', 'rachele', 'noemi', 'ester', 'esther', 'carmen', 'ines', 'nives', 'clarice', 'eurydice', 'berenice', 'cloe', 'chloe', 'zoe', 'aurore', 'desiree', 'deborah', 'debora', 'miriam', 'myriam', 'ruth', 'judith', 'giuditta', 'margherite', 'consuelo', 'rosario', 'maddalene', 'elisabeth', 'elizabeth', 'isabel', 'mabel', 'rebecca', 'jennifer', 'kimberly', 'catherine', 'caterine', 'jasmine', 'yasmine', 'jasmin', 'nicole', 'michelle', 'danielle', 'gabrielle', 'raffaelle', 'simone_f', 'giusy', 'susy', 'katy', 'kelly', 'emily', 'mary', 'sally', 'jenny', 'betty', 'patty', 'dolly', 'milly', 'lily', 'mimi', 'gigi_f', 'denise', 'lise', 'louise', 'elise', 'eloise', 'iris', 'doris', 'thais', 'lois', 'agnes', 'mercedes', 'dolores', 'lourdes', 'ingrid', 'astrid', 'sigrid', 'gudrun', 'karin', 'kristin', 'helen', 'ellen', 'karen', 'carmel', 'rachel', 'isabelle', 'annabelle', 'christine', 'nadine', 'sabine', 'pauline', 'caroline', 'jacqueline', 'madeleine', 'evelyn', 'jocelyn', 'kathleen', 'colleen', 'eileen', 'maureen', 'doreen', 'noreen', 'aileen', 'arlene', 'darlene', 'charlene', 'marlene', 'irina', 'nour', 'nur', 'jo', 'dalila'])
function genereDaNome(nome) {
  const n = norm(nome).split(/[\s\-'_]/)[0]
  if (!n || n.length < 2) return 'nd'
  if (MASCHILI_A.has(n)) return 'M'
  if (FEMMINILI_ALTRO.has(n)) return 'F'
  if (n.endsWith('a')) return 'F'
  if (/[oe]$/.test(n) || /[^aeiou]$/.test(n) || n.endsWith('i')) return 'M'
  return 'nd'
}

// ---------- classificazione organizzazione ----------
const RX_PUBBLICO = /\b(comune|municipio|roma capitale|regione|provincia|citta metropolitana|ministero|ministro|prefettura|questura|camera di commercio|cciaa|asl|azienda sanitaria|inps|inail|agenzia delle entrate|agenzia|universita|ateneo|politecnico|istituto superiore di sanita|carabinieri|polizia|guardia di finanza|vigili del fuoco|esercito|aeronautica|marina militare|senato|camera dei deputati|parlamento|governo|presidenza del consiglio|tribunale|corte|procura|consiglio regionale|assessorato|dipartimento|ente pubblico|parco regionale|ater|acea|atac|ama|lazio innova|invitalia|enea|cnr|istat|ice|sviluppo lavoro italia|anpal|ufficio scolastico|capitolin[oa]|assemblea capitolina|commissione|xccp|ambasciata|consolato|cnel|ministr[oa])\b/
const RX_SCUOLA = /\b(scuola|liceo|istituto|ist\.|itis|ipsia|iis|ipseoa|cfp|cmfp|formazione|accademia|conservatorio|cnos|enaip|fap|its)\b/
const RX_CNA = /\bcna\b|confederazione nazionale dell.?artigianato|cna roma|coopfidi|cna servizi|cna pensionati|cna cittadini|epasa|itaco/
const RX_ASSOC = /\b(associazione|assoc\.|ass\.ne|aps|asd|onlus|odv|ets|fondazione|federazione|confcommercio|confartigianato|confesercenti|confindustria|coldiretti|cgil|cisl|uil|ugl|sindacato|consorzio|cooperativa sociale|ente|comitato|club|rotary|lions|pro loco|parrocchia|caritas|croce rossa|unindustria|confcooperative|claai|agci|federlazio|confimprenditori|legacoop|gruppo di azione locale|eurispes|assimprese)\b/
const RX_IMPRESA = /\b(s\.?r\.?l\.?s?|s\.?p\.?a\.?|s\.?n\.?c\.?|s\.?a\.?s\.?|s\.?a\.?p\.?a\.?|soc\.?\s*coop|societa|soc\.|coop\.?|cooperativa|ditta|impresa|studio|di\b.*\b&|&\s*c\.?|group|holding|srl|spa|snc|sas)\b/
const RX_OSPITE = /\b(ospit[ei]|invitat[oi]|guest|staff|stampa|giornalist|relator[ei]|artist[ai]|danza|ballerin)/

function tipoOrg(r) {
  const rs = norm(r.ragione_sociale)
  const dom = norm((r.email || '').split('@')[1])
  if (!rs) {
    if (/\.gov\.it$|^comune\.|\.comune\.|^regione\.|\.regione\.|cittametropolitana|camcom|inps\.it|inail\.it|agenziaentrate/.test(dom)) return 'Ente pubblico'
    return pivaOk(r.partita_iva) ? 'Impresa' : 'Privato cittadino'
  }
  if (/^(dipendente|pensionat[oa]|artigiano in pensione|privat[oa]|nessuna|-|\.|n\/a|na|cittadin[oa]|studente|studentessa)$/.test(rs)) return 'Privato cittadino'
  if (RX_CNA.test(rs)) return 'Sistema CNA'
  if (RX_OSPITE.test(rs)) return 'Ospiti / staff'
  if (RX_PUBBLICO.test(rs) || /\.gov\.it$|^comune\.|^regione\./.test(dom)) return 'Ente pubblico'
  if (RX_SCUOLA.test(rs)) return 'Scuola / formazione'
  if (RX_ASSOC.test(rs)) return 'Associazione / ente non profit'
  return 'Impresa'
}

function formaGiuridica(rs) {
  const s = ' ' + norm(rs).replace(/\./g, '') + ' '
  if (!rs || !s.trim()) return null
  if (/ srls /.test(s)) return 'Srl semplificata'
  if (/ srl | s r l /.test(s)) return 'Srl'
  if (/ spa | s p a /.test(s)) return 'Spa'
  if (/ sapa /.test(s)) return 'Sapa'
  if (/ sas | s a s /.test(s)) return 'Sas'
  if (/ snc | s n c /.test(s)) return 'Snc'
  if (/ ss | societa semplice /.test(s)) return 'Societa semplice'
  if (/coop|cooperativa/.test(s)) return 'Cooperativa'
  if (/consorzio/.test(s)) return 'Consorzio'
  if (/ di [a-z]+ [a-z]+ /.test(s) || /ditta|impresa individuale/.test(s)) return 'Ditta individuale'
  return 'Non indicata'
}

function zonaDaCap(cap) {
  const c = (cap || '').trim()
  if (!/^\d{5}$/.test(c)) return 'CAP non indicato'
  if (/^001/.test(c)) return 'Roma citta'
  if (/^000/.test(c)) return 'Provincia di Roma'
  if (/^0[1-4]/.test(c)) return 'Altre province del Lazio'
  return 'Fuori Lazio'
}
const PROVINCE_LAZIO = { '01': 'Viterbo', '02': 'Rieti', '03': 'Frosinone', '04': 'Latina' }
const MUNICIPI = { '00118': 'IX/X', '00119': 'X', '00120': 'I (Vaticano)', '00121': 'X', '00122': 'X', '00123': 'XIV/XV', '00124': 'X', '00125': 'X', '00126': 'IX', '00127': 'IX', '00128': 'IX', '00131': 'IV/V', '00132': 'VI', '00133': 'VI', '00134': 'XI', '00135': 'XIV', '00136': 'XIV', '00137': 'III', '00138': 'III', '00139': 'III', '00141': 'III', '00142': 'VIII', '00143': 'IX', '00144': 'IX', '00145': 'VIII', '00146': 'XI', '00147': 'VIII', '00148': 'XI', '00149': 'XI', '00151': 'XII', '00152': 'XII', '00153': 'I', '00154': 'VIII', '00155': 'V', '00156': 'IV', '00157': 'IV', '00158': 'IV/V', '00159': 'IV', '00161': 'II', '00162': 'II', '00163': 'XIII', '00164': 'XII', '00165': 'XIII', '00166': 'XIII', '00167': 'XIII', '00168': 'XIV', '00169': 'VI/VII', '00171': 'V', '00172': 'V', '00173': 'VII', '00174': 'VII', '00175': 'VII', '00176': 'V', '00177': 'V', '00178': 'VII/VIII', '00179': 'VII', '00181': 'VII', '00182': 'VII', '00183': 'I/VII', '00184': 'I', '00185': 'I', '00186': 'I', '00187': 'I', '00189': 'XV', '00191': 'XV', '00192': 'I', '00193': 'I', '00195': 'I', '00196': 'II', '00197': 'II', '00198': 'II', '00199': 'II' }

const PERSONALI = /^(gmail|googlemail|yahoo|libero|hotmail|outlook|live|msn|icloud|me|mac|alice|tin|tiscali|virgilio|fastwebnet|email|inwind|aruba|tim|vodafone|katamail|jumpy|teletu|infinito|proton|protonmail)\./

const TIPO_COLORI = { 'Impresa': '#5B5FEF', 'Privato cittadino': '#94A3B8', 'Sistema CNA': '#003DA5', 'Ente pubblico': '#059669', 'Scuola / formazione': '#F59E0B', 'Associazione / ente non profit': '#EC4899', 'Ospiti / staff': '#7C4DFF' }

export default function StatistichePartecipanti({ evento, regs, altreRegs, eventiMap, mestieri }) {
  const [base, setBase] = useState('presenti') // presenti | iscritti
  const [campi, setCampi] = useState([])
  const [staff, setStaff] = useState({})
  const [filtroImp, setFiltroImp] = useState('')
  const [tipoSel, setTipoSel] = useState('')
  const [mostraTutte, setMostraTutte] = useState(false)

  useEffect(() => {
    if (!evento?.id) return
    supabase.from('form_fields').select('label,colonna_db,tipo,opzioni,ordine').eq('event_id', evento.id).order('ordine')
      .then(({ data }) => setCampi((data || []).filter(c => c.colonna_db?.startsWith('extra_'))))
    supabase.from('admin_profiles').select('id,nome,username')
      .then(({ data }) => setStaff(Object.fromEntries((data || []).map(p => [p.id, p.nome || p.username || 'Operatore']))))
  }, [evento?.id])

  const presentiTot = regs.filter(isPresente).length
  useEffect(() => { if (presentiTot === 0) setBase('iscritti'); else setBase('presenti') }, [evento?.id, presentiTot])

  const d = useMemo(() => {
    const attivi = regs.filter(r => !r.rinuncia)
    const P = base === 'presenti' ? regs.filter(isPresente) : attivi
    const tot = P.length

    // genere
    const gen = { M: 0, F: 0, nd: 0 }
    for (const r of P) gen[genereDaNome(r.nome)]++

    // tipologia
    const tipi = {}
    for (const r of P) { const t = tipoOrg(r); tipi[t] = (tipi[t] || 0) + 1 }

    // imprese / organizzazioni
    const org = {}
    for (const r of P) {
      const k = norm(r.ragione_sociale) || (pivaOk(r.partita_iva) ? 'piva:' + r.partita_iva.replace(/\D/g, '') : '')
      if (!k) continue
      if (!org[k]) org[k] = { nome: (r.ragione_sociale || '').trim() || 'P.IVA ' + r.partita_iva, tipo: tipoOrg(r), n: 0, assoc: null, piva: '', forma: formaGiuridica(r.ragione_sociale), persone: [] }
      const o = org[k]
      o.n++
      o.persone.push(`${r.nome || ''} ${r.cognome || ''}`.trim())
      if (pivaOk(r.partita_iva) && !o.piva) o.piva = r.partita_iva.replace(/\D/g, '')
      if (r.associato_cna === true) o.assoc = true
      else if (r.associato_cna === false && o.assoc !== true) o.assoc = false
    }
    const orgList = Object.values(org).sort((a, b) => b.n - a.n || a.nome.localeCompare(b.nome))
    const imprese = orgList.filter(o => o.tipo === 'Impresa')
    const pIn = imprese.reduce((s, o) => s + o.n, 0)
    const delega = { '1': 0, '2': 0, '3-5': 0, '6-10': 0, 'oltre 10': 0 }
    for (const o of imprese) delega[o.n === 1 ? '1' : o.n === 2 ? '2' : o.n <= 5 ? '3-5' : o.n <= 10 ? '6-10' : 'oltre 10']++
    const impAssoc = imprese.filter(o => o.assoc === true).length
    const impNoAssoc = imprese.filter(o => o.assoc === false).length
    const forme = {}
    for (const o of imprese) { const f = o.forma || 'Non indicata'; forme[f] = (forme[f] || 0) + 1 }

    // associazione CNA (persone)
    const aSi = P.filter(r => r.associato_cna === true).length
    const aNo = P.filter(r => r.associato_cna === false).length
    const anz = { 'meno di 1 anno': 0, '1-5 anni': 0, '6-10 anni': 0, '11-20 anni': 0, 'oltre 20 anni': 0 }
    let anzN = 0
    for (const r of P) {
      if (r.associato_cna !== true || !r.associato_data_stipula) continue
      const m = String(r.associato_data_stipula).match(/(\d{4})/)
      if (!m) continue
      const y = new Date().getFullYear() - Number(m[1])
      if (y < 0 || y > 90) continue
      anzN++
      anz[y < 1 ? 'meno di 1 anno' : y <= 5 ? '1-5 anni' : y <= 10 ? '6-10 anni' : y <= 20 ? '11-20 anni' : 'oltre 20 anni']++
    }

    // territorio
    const zone = {}, prov = {}, mun = {}
    for (const r of P) {
      const z = zonaDaCap(r.cap); zone[z] = (zone[z] || 0) + 1
      const c = (r.cap || '').trim()
      if (PROVINCE_LAZIO[c.slice(0, 2)]) prov[PROVINCE_LAZIO[c.slice(0, 2)]] = (prov[PROVINCE_LAZIO[c.slice(0, 2)]] || 0) + 1
      if (MUNICIPI[c]) for (const m of MUNICIPI[c].split('/')) mun['Municipio ' + m.split(' ')[0]] = (mun['Municipio ' + m.split(' ')[0]] || 0) + 1 / MUNICIPI[c].split('/').length
    }

    // recapiti
    let mailPers = 0, mailAz = 0, mailNo = 0, cell = 0
    const domini = {}
    for (const r of P) {
      const dom = norm((r.email || '').split('@')[1])
      if (!dom) mailNo++
      else if (PERSONALI.test(dom)) mailPers++
      else { mailAz++; domini[dom] = (domini[dom] || 0) + 1 }
      if ((r.cellulare || '').replace(/\D/g, '').length >= 9) cell++
    }

    // campi extra del form
    const extra = campi.map(c => {
      const dist = {}
      let compilati = 0
      for (const r of P) {
        const v = (r[c.colonna_db] || '').toString().trim()
        if (!v) continue
        compilati++
        for (const p of (c.tipo === 'checkbox' || c.tipo === 'multiselect' ? v.split(/[,;|]/) : [v])) { const k = p.trim(); if (k) dist[k] = (dist[k] || 0) + 1 }
      }
      return { label: c.label || c.colonna_db, compilati, dist: Object.entries(dist).sort((a, b) => b[1] - a[1]) }
    }).filter(x => x.compilati)

    // mestieri
    const mest = {}
    const mNome = Object.fromEntries((mestieri || []).map(m => [m.id, m.nome]))
    for (const r of P) if (r.mestiere_id) { const k = mNome[r.mestiere_id] || 'Altro'; mest[k] = (mest[k] || 0) + 1 }

    // gruppi
    const accomp = P.filter(r => r.referente_id).length
    const gruppi = {}
    for (const r of P) if (r.referente_id) gruppi[r.referente_id] = (gruppi[r.referente_id] || 0) + 1

    // fedelta
    const storico = {}
    for (const r of altreRegs || []) {
      if (r.event_id === evento.id) continue
      const ev = eventiMap[r.event_id]
      if (!ev?.data_inizio || ev.data_inizio >= evento.data_inizio) continue
      const k = norm(r.email) || norm(r.nome) + '|' + norm(r.cognome)
      if (!storico[k]) storico[k] = new Set()
      storico[k].add(r.event_id)
    }
    const fed = { 'Primo evento': 0, '1 evento precedente': 0, '2-3 eventi precedenti': 0, '4 o piu': 0 }
    for (const r of P) {
      const n = (storico[norm(r.email)] || storico[norm(r.nome) + '|' + norm(r.cognome)])?.size || 0
      fed[n === 0 ? 'Primo evento' : n === 1 ? '1 evento precedente' : n <= 3 ? '2-3 eventi precedenti' : '4 o piu']++
    }

    // tasso di presenza per segmento (sempre su iscritti attivi)
    const segm = (fn) => { const g = {}; for (const r of attivi) { const k = fn(r); if (!g[k]) g[k] = { i: 0, p: 0 }; g[k].i++; if (isPresente(r)) g[k].p++ } return Object.entries(g).filter(([, v]) => v.i >= 3).sort((a, b) => b[1].i - a[1].i) }
    const presPerTipo = segm(tipoOrg)
    const presPerAssoc = segm(r => r.associato_cna === true ? 'Associati CNA' : r.associato_cna === false ? 'Non associati' : 'Non verificati')
    const presPerGenere = segm(r => ({ M: 'Uomini', F: 'Donne', nd: 'Non determinabile' })[genereDaNome(r.nome)])
    const presPerRuolo = segm(r => r.referente_id ? 'Accompagnatori' : 'Iscritti diretti')
    const anticipo = segm(r => {
      if (!evento.data_inizio || !r.created_at) return 'n/d'
      const g = Math.floor((new Date(evento.data_inizio) - new Date(r.created_at)) / 86400000)
      return g < 0 ? 'Il giorno stesso / walk-in' : g <= 2 ? '0-2 giorni prima' : g <= 7 ? '3-7 giorni prima' : g <= 30 ? '8-30 giorni prima' : 'Oltre 30 giorni prima'
    })

    // check-in
    const perStaff = {}
    for (const r of regs) if (r.checkin_by && isPresente(r)) perStaff[r.checkin_by] = (perStaff[r.checkin_by] || 0) + 1
    const walkin = regs.filter(r => r.stato === 'walk-in').length

    return {
      P, tot, gen, tipi, orgList, imprese, pIn, delega, impAssoc, impNoAssoc, forme, aSi, aNo, anz, anzN,
      zone, prov, mun, mailPers, mailAz, mailNo, cell, domini, extra, mest, accomp, nGruppi: Object.keys(gruppi).length,
      fed, presPerTipo, presPerAssoc, presPerGenere, presPerRuolo, anticipo, perStaff, walkin, iscrittiAttivi: attivi.length,
    }
  }, [regs, base, campi, mestieri, altreRegs, eventiMap, evento])

  const enti = d.orgList.filter(o => o.tipo === 'Ente pubblico')
  const filtrate = d.orgList.filter(o => (!tipoSel || o.tipo === tipoSel) && (!filtroImp || norm(o.nome).includes(norm(filtroImp)) || o.piva.includes(filtroImp)))
  const visibili = mostraTutte ? filtrate : filtrate.slice(0, 15)
  const etBase = base === 'presenti' ? 'partecipanti effettivi' : 'iscritti attivi'

  function esportaCsv() {
    const righe = [['Organizzazione', 'Tipologia', 'Forma giuridica', 'P.IVA', 'Associata CNA', 'Partecipanti', 'Nominativi']]
    for (const o of filtrate) righe.push([o.nome, o.tipo, o.forma || '', o.piva, o.assoc === true ? 'Si' : o.assoc === false ? 'No' : 'Non verificata', o.n, o.persone.join('; ')])
    const csv = '﻿' + righe.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    a.download = `organizzazioni_${(evento?.titolo || 'evento').replace(/[^\w]+/g, '_').slice(0, 40)}.csv`
    a.click()
  }

  if (!regs.length) return null

  return (
    <>
      <div style={{ ...st.section, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, background: 'linear-gradient(135deg,#F5F3FF,#EEF2FF)' }}>
        <div>
          <h2 style={{ ...st.title, fontSize: 16 }}>Chi ha partecipato</h2>
          <p style={{ ...st.sub, margin: 0 }}>Analisi su {d.tot} {etBase}{base === 'presenti' ? ` (su ${d.iscrittiAttivi} iscritti attivi)` : ''}</p>
        </div>
        <div style={{ display: 'flex', background: '#fff', border: '1px solid #E8ECF4', borderRadius: 20, padding: 3 }}>
          {[['presenti', 'Presenti'], ['iscritti', 'Tutti gli iscritti']].map(([k, l]) => (
            <button key={k} onClick={() => setBase(k)} disabled={k === 'presenti' && !presentiTot}
              style={{ border: 'none', borderRadius: 16, padding: '6px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', background: base === k ? '#5B5FEF' : 'transparent', color: base === k ? '#fff' : '#6B7280', opacity: k === 'presenti' && !presentiTot ? 0.4 : 1 }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={st.grid4}>
        <Kpi label="Partecipanti" value={d.tot} sub={etBase} />
        <Kpi label="Imprese" value={d.imprese.length} sub={`${d.pIn} persone da imprese`} />
        <Kpi label="Persone per impresa" value={d.imprese.length ? (d.pIn / d.imprese.length).toFixed(1) : '-'} sub={`max ${d.imprese[0]?.n || 0} (${d.imprese[0]?.nome?.slice(0, 22) || '-'})`} />
        <Kpi label="Enti pubblici" value={enti.length} sub={`${enti.reduce((s, o) => s + o.n, 0)} rappresentanti`} />
        <Kpi label="Organizzazioni totali" value={d.orgList.length} sub="ragioni sociali distinte" />
        <Kpi label="Uomini / Donne" value={`${d.gen.M} / ${d.gen.F}`} sub={`${pct(d.gen.F, d.gen.M + d.gen.F)}% donne - stima dal nome`} />
        <Kpi label="Associati CNA" value={d.aSi} sub={`${pct(d.aSi, d.tot)}% - ${d.impAssoc} imprese associate`} />
        <Kpi label="Privati cittadini" value={d.tipi['Privato cittadino'] || 0} sub="senza impresa ne P.IVA" />
      </div>

      <div style={st.grid2}>
        <Sezione titolo="Tipologia dei partecipanti" sotto="Classificazione automatica dalla ragione sociale">
          <Stack parts={Object.entries(d.tipi).map(([l, n]) => ({ l, n, c: TIPO_COLORI[l] }))} />
          {Object.entries(d.tipi).sort((a, b) => b[1] - a[1]).map(([l, n]) => <Riga key={l} l={l} n={n} tot={d.tot} c={TIPO_COLORI[l]} onClick={() => setTipoSel(tipoSel === l ? '' : l)} attivo={tipoSel === l} />)}
          <div style={st.nota}>Tocca una tipologia per filtrare l'elenco organizzazioni</div>
        </Sezione>
        <Sezione titolo="Genere" sotto="Stimato dal nome di battesimo (il form non raccoglie il genere)">
          <Stack parts={[{ l: 'Donne', n: d.gen.F, c: '#EC4899' }, { l: 'Uomini', n: d.gen.M, c: '#3B82F6' }, { l: 'n.d.', n: d.gen.nd, c: '#CBD5E1' }]} />
          <Riga l="Donne" n={d.gen.F} tot={d.tot} c="#EC4899" />
          <Riga l="Uomini" n={d.gen.M} tot={d.tot} c="#3B82F6" />
          <Riga l="Non determinabile" n={d.gen.nd} tot={d.tot} c="#CBD5E1" />
        </Sezione>
      </div>

      <div style={st.grid2}>
        <Sezione titolo="Associazione CNA" sotto="Persone e imprese">
          <Stack parts={[{ l: 'Associati', n: d.aSi, c: '#16A34A' }, { l: 'Non associati', n: d.aNo, c: '#F97316' }, { l: 'Non verificati', n: d.tot - d.aSi - d.aNo, c: '#CBD5E1' }]} />
          <Riga l="Persone associate" n={d.aSi} tot={d.tot} c="#16A34A" />
          <Riga l="Persone non associate" n={d.aNo} tot={d.tot} c="#F97316" />
          <Riga l="Non verificate" n={d.tot - d.aSi - d.aNo} tot={d.tot} c="#CBD5E1" />
          <div style={{ height: 8 }} />
          <Riga l="Imprese associate" n={d.impAssoc} tot={d.imprese.length} c="#16A34A" />
          <Riga l="Imprese non associate" n={d.impNoAssoc} tot={d.imprese.length} c="#F97316" extra={`${d.imprese.length - d.impAssoc - d.impNoAssoc} non verificate`} />
          {d.anzN > 0 && <>
            <div style={st.sottoTit}>Anzianita associativa ({d.anzN} con data)</div>
            {Object.entries(d.anz).map(([l, n]) => <Riga key={l} l={l} n={n} tot={d.anzN} c="#003DA5" />)}
          </>}
        </Sezione>
        <Sezione titolo="Imprese: dimensione della delegazione" sotto="Quante persone ha portato ciascuna impresa">
          {Object.entries(d.delega).map(([l, n]) => <Riga key={l} l={`${l} ${l === '1' ? 'partecipante' : 'partecipanti'}`} n={n} tot={d.imprese.length} c="#5B5FEF" extra={n ? `${pct(n, d.imprese.length)}% delle imprese` : ''} assoluto />)}
          <div style={st.sottoTit}>Forma giuridica</div>
          {Object.entries(d.forme).sort((a, b) => b[1] - a[1]).map(([l, n]) => <Riga key={l} l={l} n={n} tot={d.imprese.length} c="#7C3AED" />)}
        </Sezione>
      </div>

      {enti.length > 0 && (
        <Sezione titolo={`Enti pubblici presenti (${enti.length})`} sotto="Riconosciuti da ragione sociale o dominio email">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {enti.map(o => <span key={o.nome} title={o.persone.join(', ')} style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', borderRadius: 20, padding: '5px 12px', fontSize: 12.5, fontWeight: 600 }}>{o.nome} <b style={{ marginLeft: 4 }}>{o.n}</b></span>)}
          </div>
        </Sezione>
      )}

      <Sezione titolo={`Elenco organizzazioni (${filtrate.length})`} sotto={tipoSel ? `Filtro: ${tipoSel}` : 'Tutte le ragioni sociali, ordinate per numero di partecipanti'}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <input value={filtroImp} onChange={e => setFiltroImp(e.target.value)} placeholder="Cerca organizzazione o P.IVA" style={{ flex: '1 1 200px', border: '1px solid #E8ECF4', borderRadius: 20, padding: '7px 14px', fontSize: 13, outline: 'none' }} />
          {tipoSel && <button onClick={() => setTipoSel('')} style={st.btnGhost}>Rimuovi filtro</button>}
          <button onClick={esportaCsv} style={st.btn}>Esporta CSV</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead><tr style={{ textAlign: 'left', color: '#6B7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em' }}>
              <th style={st.th}>Organizzazione</th><th style={st.th}>Tipologia</th><th style={st.th}>CNA</th><th style={{ ...st.th, textAlign: 'right' }}>Pers.</th>
            </tr></thead>
            <tbody>
              {visibili.map(o => (
                <tr key={o.nome + o.piva} style={{ borderTop: '1px solid #F1F3F9' }}>
                  <td style={st.td} title={o.persone.join(', ')}><div style={{ fontWeight: 600, color: '#111827' }}>{o.nome}</div>{o.piva && <div style={{ fontSize: 11, color: '#9CA3AF' }}>P.IVA {o.piva}{o.forma && o.forma !== 'Non indicata' ? ` - ${o.forma}` : ''}</div>}</td>
                  <td style={st.td}><span style={{ fontSize: 11, fontWeight: 700, color: TIPO_COLORI[o.tipo], background: (TIPO_COLORI[o.tipo] || '#999') + '18', padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap' }}>{o.tipo}</span></td>
                  <td style={st.td}>{o.assoc === true ? <span style={{ color: '#16A34A', fontWeight: 700 }}>Si</span> : o.assoc === false ? <span style={{ color: '#F97316', fontWeight: 700 }}>No</span> : <span style={{ color: '#9CA3AF' }}>-</span>}</td>
                  <td style={{ ...st.td, textAlign: 'right', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{o.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtrate.length > 15 && <button onClick={() => setMostraTutte(!mostraTutte)} style={{ ...st.btnGhost, marginTop: 10 }}>{mostraTutte ? 'Mostra meno' : `Mostra tutte (${filtrate.length})`}</button>}
      </Sezione>

      <div style={st.grid2}>
        <Sezione titolo="Provenienza" sotto="Dal CAP indicato in iscrizione">
          {Object.entries(d.zone).sort((a, b) => b[1] - a[1]).map(([l, n]) => <Riga key={l} l={l} n={n} tot={d.tot} c="#0891B2" />)}
          {Object.keys(d.prov).length > 0 && <>
            <div style={st.sottoTit}>Altre province del Lazio</div>
            {Object.entries(d.prov).sort((a, b) => b[1] - a[1]).map(([l, n]) => <Riga key={l} l={l} n={n} tot={d.tot} c="#06B6D4" />)}
          </>}
        </Sezione>
        {Object.keys(d.mun).length > 0 && (
          <Sezione titolo="Roma: municipi" sotto="Stima da CAP (i CAP a cavallo sono ripartiti)">
            {Object.entries(d.mun).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([l, n]) => <Riga key={l} l={l} n={Math.round(n)} tot={d.zone['Roma citta'] || 1} c="#0E7490" />)}
          </Sezione>
        )}
      </div>

      {(d.extra.length > 0 || Object.keys(d.mest).length > 0) && (
        <div style={st.grid2}>
          {d.extra.map(x => (
            <Sezione key={x.label} titolo={x.label} sotto={`Campo del form - ${x.compilati} risposte`}>
              {x.dist.slice(0, 12).map(([l, n]) => <Riga key={l} l={l} n={n} tot={x.compilati} c="#7C4DFF" />)}
            </Sezione>
          ))}
          {Object.keys(d.mest).length > 0 && (
            <Sezione titolo="Mestieri">
              {Object.entries(d.mest).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([l, n]) => <Riga key={l} l={l} n={n} tot={d.tot} c="#F59E0B" />)}
            </Sezione>
          )}
        </div>
      )}

      <div style={st.grid2}>
        <Sezione titolo="Fedelta" sotto="Partecipazione a eventi CNA precedenti">
          {Object.entries(d.fed).map(([l, n]) => <Riga key={l} l={l} n={n} tot={d.tot} c="#059669" />)}
        </Sezione>
        <Sezione titolo="Gruppi e recapiti">
          <Riga l="Accompagnatori" n={d.accomp} tot={d.tot} c="#C4B5FD" extra={d.nGruppi ? `${d.nGruppi} gruppi, media ${(d.accomp / d.nGruppi).toFixed(1)}` : ''} />
          <Riga l="Con cellulare" n={d.cell} tot={d.tot} c="#5B5FEF" />
          <Riga l="Email aziendale / istituzionale" n={d.mailAz} tot={d.tot} c="#003DA5" />
          <Riga l="Email personale (gmail, libero...)" n={d.mailPers} tot={d.tot} c="#94A3B8" />
          {d.mailNo > 0 && <Riga l="Senza email" n={d.mailNo} tot={d.tot} c="#E5E7EB" />}
        </Sezione>
      </div>

      {presentiTot > 0 && (
        <Sezione titolo="Tasso di presenza per segmento" sotto="Quanti iscritti attivi si sono poi presentati, per categoria (segmenti con almeno 3 iscritti)">
          <div style={st.grid2in}>
            <Tasso titolo="Per tipologia" righe={d.presPerTipo} />
            <Tasso titolo="Per associazione" righe={d.presPerAssoc} />
            <Tasso titolo="Per genere (stimato)" righe={d.presPerGenere} />
            <Tasso titolo="Per anticipo di iscrizione" righe={d.anticipo} />
            <Tasso titolo="Iscritti diretti / accompagnatori" righe={d.presPerRuolo} />
          </div>
        </Sezione>
      )}

      {Object.keys(d.perStaff).length > 0 && (
        <Sezione titolo="Check-in per operatore" sotto={`${presentiTot} ingressi registrati${d.walkin ? ` - ${d.walkin} walk-in` : ''}`}>
          {Object.entries(d.perStaff).sort((a, b) => b[1] - a[1]).map(([id, n]) => <Riga key={id} l={staff[id] || 'Operatore'} n={n} tot={presentiTot} c="#5B5FEF" />)}
        </Sezione>
      )}
    </>
  )
}

function Tasso({ titolo, righe }) {
  if (!righe.length) return null
  return (
    <div>
      <div style={st.sottoTit}>{titolo}</div>
      {righe.map(([l, v]) => <Riga key={l} l={l} n={`${pct(v.p, v.i)}%`} c={pct(v.p, v.i) >= 70 ? '#059669' : pct(v.p, v.i) >= 50 ? '#F59E0B' : '#EF4444'} barra={pct(v.p, v.i)} extra={`${v.p} su ${v.i}`} />)}
    </div>
  )
}

function Sezione({ titolo, sotto, children }) {
  return (
    <div style={st.section}>
      <h2 style={{ ...st.title, marginBottom: sotto ? 4 : 16 }}>{titolo}</h2>
      {sotto && <p style={st.sub}>{sotto}</p>}
      {children}
    </div>
  )
}

function Kpi({ label, value, sub }) {
  return (
    <div style={st.kpi}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#111827', letterSpacing: '-.02em', margin: '3px 0 1px', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: 11.5, color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>
    </div>
  )
}

function Stack({ parts }) {
  const tot = parts.reduce((s, p) => s + p.n, 0) || 1
  return (
    <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2, marginBottom: 14 }}>
      {parts.filter(p => p.n > 0).map(p => <div key={p.l} title={`${p.l}: ${p.n}`} style={{ flex: p.n / tot, background: p.c }} />)}
    </div>
  )
}

function Riga({ l, n, tot, c, extra, assoluto, barra, onClick, attivo }) {
  const w = barra ?? pct(n, tot)
  return (
    <div onClick={onClick} style={{ marginBottom: 10, cursor: onClick ? 'pointer' : 'default', ...(attivo ? { background: '#F5F3FF', margin: '0 -8px 10px', padding: '4px 8px', borderRadius: 8 } : {}) }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12.5, marginBottom: 4 }}>
        <span style={{ color: '#374151', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l}{extra && <span style={{ color: '#9CA3AF', fontWeight: 500, fontSize: 11 }}> | {extra}</span>}</span>
        <span style={{ color: '#6B7280', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}><b style={{ color: '#111827' }}>{n}</b>{barra == null && !assoluto && tot ? ` (${w}%)` : ''}</span>
      </div>
      <div style={{ height: 6, background: '#F1F3F9', borderRadius: 3 }}><div style={{ width: `${Math.min(100, w)}%`, height: '100%', background: c || '#5B5FEF', borderRadius: 3 }} /></div>
    </div>
  )
}

const st = {
  section: { backgroundColor: '#FFFFFF', border: '1px solid #E8ECF4', borderRadius: 20, padding: '18px 20px' },
  title: { fontSize: 14, fontWeight: 800, color: '#111827', letterSpacing: '-0.01em', margin: '0 0 4px', fontFamily: "'Inter', sans-serif" },
  sub: { fontSize: 12, color: '#9CA3AF', margin: '0 0 14px' },
  sottoTit: { fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.05em', margin: '14px 0 8px' },
  nota: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 },
  grid2in: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '4px 28px' },
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 },
  kpi: { background: '#fff', border: '1px solid #E8ECF4', borderRadius: 16, padding: '12px 14px', minWidth: 0 },
  th: { padding: '6px 8px', fontWeight: 700 },
  td: { padding: '8px', verticalAlign: 'top' },
  btn: { border: 'none', background: '#5B5FEF', color: '#fff', borderRadius: 20, padding: '7px 16px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' },
  btnGhost: { border: '1px solid #E8ECF4', background: '#fff', color: '#374151', borderRadius: 20, padding: '7px 16px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' },
}
