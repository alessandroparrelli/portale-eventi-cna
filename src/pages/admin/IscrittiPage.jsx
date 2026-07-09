import { useEffect, useState, useRef } from 'react'
import { usePageTitle } from '../../hooks/usePageTitle'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useRole } from '../../hooks/useRole'
import GlowTableHead from '../../components/GlowTableHead'
import GlowStatCard from '../../components/GlowStatCard'
import { Modal, PresenzaBadge, Field, Input, Select, Btn, EmptyState } from '../../components/ui'
import { Users, Search, Download, Upload, Eye, Trash2, UserCheck, AlertCircle, CheckCircle2, X, MapPin, Ticket, RefreshCw } from 'lucide-react'
import * as XLSX from 'xlsx'
import ExcelJS from 'exceljs/dist/exceljs.min.js'
import { logAttivita } from '../../lib/activityLog'
import EventSelector from '../../components/EventSelector'

function formatDt(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('it-IT', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit', timeZone:'Europe/Rome' })
}

function SortableHead({ columns, sortCol, sortDir, onSort }) {
  const PALETTES = {
    blue:    { from:'#003DA5', to:'#1a56db', text:'#ffffff' },
    green:   { from:'#059669', to:'#10b981', text:'#ffffff' },
    violet:  { from:'#7c3aed', to:'#8b5cf6', text:'#ffffff' },
    amber:   { from:'#d97706', to:'#f59e0b', text:'#ffffff' },
    cyan:    { from:'#0891b2', to:'#06b6d4', text:'#ffffff' },
    neutral: { from:'#F9FAFB', to:'#F3F4F6', text:'#6B7280' },
  }
  return (
    <thead>
      <tr>
        {columns.map((col,i) => {
          const pal = PALETTES[col.color] || PALETTES.blue
          const isActive = sortCol === col.label
          return (
            <th key={i}
              className={col.hideOnMobile ? 'col-hide-mobile' : undefined}
              onClick={() => col.sortable && onSort(col.label)}
              style={{
                background:`linear-gradient(135deg,${pal.from},${pal.to})`,
                color:pal.text, padding:'10px 14px', textAlign:'left',
                fontSize:'11px', fontWeight:'700', letterSpacing:'.05em',
                textTransform:'uppercase', userSelect:'none',
                cursor: col.sortable ? 'pointer' : 'default',
                whiteSpace:'nowrap',
              }}>
              <span style={{display:'inline-flex',alignItems:'center',gap:'5px'}}>
                {col.label}
                {col.sortable && (
                  <span style={{fontSize:'10px',opacity: isActive ? 1 : 0.4}}>
                    {isActive ? (sortDir==='asc' ? '\u25b2' : '\u25bc') : '\u21c5'}
                  </span>
                )}
              </span>
            </th>
          )
        })}
      </tr>
    </thead>
  )
}

export default function IscrittiPage() {
  usePageTitle('Iscritti')
  const [searchParams] = useSearchParams()
  const [eventi, setEventi] = useState([])
  const [selectedEvento, setSelectedEvento] = useState(searchParams.get('evento') || '')
  const [registrations, setRegistrations] = useState([])
  const [mestieri, setMestieri] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStato, setFilterStato] = useState('tutti')
  const [detail, setDetail] = useState(null)
  const [formFields, setFormFields] = useState([]) // campi extra dell'evento
  const [delConfirm, setDelConfirm] = useState(null)
  const { canManage } = useRole()
  const canDelete = canManage('iscritti')
  const [importModal, setImportModal] = useState(false)
  const [importPreview, setImportPreview] = useState([])
  const [importErrors, setImportErrors] = useState([])
  const [importing, setImporting] = useState(false)
  const [importDone, setImportDone] = useState(null)
  const fileInputRef = useRef(null)
  const [invioInCorso, setInvioInCorso] = useState(false)
  const [invioRisultato, setInvioRisultato] = useState(null)
  const [associatiMap, setAssociatiMap] = useState({})   // partita_iva -> {contratto, datastipula, associato}
  const [verificaEseguita, setVerificaEseguita] = useState(false)
  const [verificaInCorso, setVerificaInCorso] = useState(false)
  const [verificaInfo, setVerificaInfo] = useState(null) // {trovati, cercati}
  const [sortCol, setSortCol] = useState(null)   // chiave colonna
  const [sortDir, setSortDir] = useState('asc')  // 'asc' | 'desc'
  const [pagina, setPagina] = useState(1)
  const PAGE_SIZE = 20

  // Mappa id→nome per referenti di gruppo (calcolata dai registrations caricati)
  const referentiMap = {}
  registrations.forEach(r => {
    if (r.gruppo_id === r.id) referentiMap[r.id] = `${r.nome||''} ${r.cognome||''}`.trim()
  })

  // Teatro
  const [teatroAbilitato, setTeatroAbilitato] = useState(false)
  const [tabAttivo, setTabAttivo] = useState('iscritti') // 'iscritti' | 'teatro'
  const [postoEdit, setPostoEdit] = useState({}) // { [reg_id]: string }
  const [postoSaving, setPostoSaving] = useState({}) // { [reg_id]: bool }
  const [postoError, setPostoError] = useState({}) // { [reg_id]: string }
  const [invioPostoInCorso, setInvioPostoInCorso] = useState(false)
  const [invioPostoRis, setInvioPostoRis] = useState(null)
  const [dryRunRis, setDryRunRis] = useState(null)
  const [teatroSelezione, setTeatroSelezione] = useState(new Set()) // Set di reg_id selezionati
  const [filtroPostoAssegnato, setFiltroPostoAssegnato] = useState('tutti') // 'tutti' | 'con_posto' | 'senza_posto'
  const [filtroMailPosto, setFiltroMailPosto] = useState('tutti') // 'tutti' | 'inviata' | 'non_inviata'

  function toggleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
    setPagina(1)
  }

  // La verifica viene scritta direttamente sulle righe di `registrations` (associato_cna,
  // associato_data_stipula, associato_verificato_at) cosi\u0300 e\u0300 definitiva: una volta eseguita,
  // resta visibile su qualsiasi device e non va ripetuta. Un rilancio verifica SOLO gli
  // iscritti non ancora controllati (nuovi arrivi) senza toccare quelli gia\u0300 fatti, a meno
  // che non si chieda esplicitamente una riverifica completa.
  async function verificaAssociati(forzaRiverifica = false) {
    if (!selectedEvento || !registrations.length) return
    setVerificaInCorso(true)
    setVerificaInfo(null)
    try {
      const res = await fetch('https://hnkhckcclgabunkqfmrz.supabase.co/functions/v1/verifica-associati', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: selectedEvento, forza_riverifica: forzaRiverifica })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      await loadRegs() // ricarica le righe aggiornate dal DB
      setVerificaEseguita(true)
      setVerificaInfo({ trovati: data.trovati, cercati: data.cercati, aggiornati: data.aggiornati })
    } catch (e) {
      setVerificaInfo({ errore: String(e) })
    }
    setVerificaInCorso(false)
  }

  async function inviaCertificati() {
    if (!selectedEvento) return
    setInvioInCorso(true)
    setInvioRisultato(null)
    try {
      const res = await fetch('https://hnkhckcclgabunkqfmrz.supabase.co/functions/v1/invia-certificati', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: selectedEvento, invio_manuale: true })
      })
      const data = await res.json()
      setInvioRisultato(data)
    } catch (e) {
      setInvioRisultato({ error: String(e) })
    }
    setInvioInCorso(false)
  }

  async function salvaPosto(regId, valore) {
    const val = (valore || '').trim()
    setPostoSaving(p => ({ ...p, [regId]: true }))
    setPostoError(p => ({ ...p, [regId]: null }))
    const { error } = await supabase.from('registrations')
      .update({ numero_posto: val || null })
      .eq('id', regId)
    setPostoSaving(p => ({ ...p, [regId]: false }))
    if (error) {
      setPostoError(p => ({ ...p, [regId]: error.code === '23505' ? 'Posto già assegnato ad altro iscritto' : error.message }))
    } else {
      setPostoEdit(p => ({ ...p, [regId]: undefined }))
      loadRegs()
    }
  }

  async function inviaMailPosti(dry = false, ids = null) {
    // ids: null = tutti, [] = nessuno (non chiamare), [id1,...] = selezionati
    if (!selectedEvento) return
    if (dry) setDryRunRis(null)
    else { setInvioPostoInCorso(true); setInvioPostoRis(null) }
    try {
      const body = { event_id: selectedEvento, dry_run: dry }
      if (ids !== null) body.registration_ids = ids
      const res = await fetch('https://hnkhckcclgabunkqfmrz.supabase.co/functions/v1/assegna-posto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (dry) setDryRunRis(data)
      else setInvioPostoRis(data)
    } catch (e) {
      if (dry) setDryRunRis({ error: String(e) })
      else setInvioPostoRis({ error: String(e) })
    }
    if (!dry) setInvioPostoInCorso(false)
  }

  function toggleSelezioneTeatroReg(id) {
    setTeatroSelezione(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSelezioneTeatroTutti(regs) {
    const conPosto = regs.filter(r => r.numero_posto && r.email).map(r => r.id)
    setTeatroSelezione(prev => {
      const tuttiSelezionati = conPosto.every(id => prev.has(id))
      if (tuttiSelezionati) return new Set()
      return new Set(conPosto)
    })
  }

  useEffect(() => {
    supabase.from('events').select('id,titolo,slug').order('data_inizio',{ascending:false}).then(({data})=>setEventi(data||[]))
    supabase.from('mestieri').select('id,nome').then(({data})=>setMestieri(data||[]))
  }, [])

  useEffect(() => {
    if (!selectedEvento) { setRegistrations([]); setFormFields([]); setTeatroAbilitato(false); return }
    loadRegs()
    // Controlla se l'evento ha teatro abilitato
    supabase.from('events').select('teatro_abilitato').eq('id', selectedEvento).single()
      .then(({ data }) => setTeatroAbilitato(!!data?.teatro_abilitato))
    supabase.from('form_fields').select('*')
      .eq('event_id', selectedEvento).eq('visibile', true).like('colonna_db', 'extra_%')
      .order('ordine')
      .then(({ data }) => setFormFields(data || []))
  }, [selectedEvento])

  // Lo stato "verifica eseguita" si deduce dai dati gia\u0300 presenti sulle righe caricate dal DB:
  // se almeno un iscritto ha associato_verificato_at valorizzato, la verifica e\u0300 gia\u0300 stata fatta
  // (per quell'evento) ed e\u0300 visibile su qualunque device, senza bisogno di rifarla.
  useEffect(() => {
    setVerificaInfo(null)
    if (!selectedEvento || !registrations.length) {
      setVerificaEseguita(false)
      return
    }
    setVerificaEseguita(registrations.some(r => !!r.associato_verificato_at))
  }, [selectedEvento, registrations])

  // Ricostruisce la mappa partita_iva -> esito a partire dalle colonne persistite sul DB
  // (associato_cna, associato_data_stipula), scritte dall'Edge Function verifica-associati.
  useEffect(() => {
    const map = {}
    for (const r of registrations) {
      if (!r.associato_verificato_at) continue
      if (r.associato_cna === null || r.associato_cna === undefined) continue // P.IVA non trovata in archivio
      const p = (r.partita_iva || '').toString().replace(/\s/g, '').replace(/^0+/, '')
      if (!p) continue
      map[p] = { associato: !!r.associato_cna, datastipula: r.associato_data_stipula || null }
    }
    setAssociatiMap(map)
  }, [registrations])

  async function loadRegs() {
    setLoading(true)
    const { data } = await supabase.from('registrations')
      .select('*').eq('event_id', selectedEvento).order('created_at',{ascending:false})
    setRegistrations(data||[])
    setLoading(false)
  }

  function getMestiere(id) { return mestieri.find(m=>m.id===id)?.nome || '—' }

  // Reset pagina su cambio filtri
  useEffect(() => { setPagina(1) }, [selectedEvento, search, filterStato])

  const filtered = registrations.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = !q || r.nome?.toLowerCase().includes(q) || r.cognome?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q)
    const matchStato = filterStato==='tutti' || r.stato===filterStato
    return matchSearch && matchStato
  })

  async function deleteReg() {
    await supabase.from('registrations').delete().eq('id', delConfirm.id)
    logAttivita('iscritto_eliminato', { eventoId: selectedEvento, dettagli: { nome: [delConfirm.nome, delConfirm.cognome].filter(Boolean).join(' ') } })
    setDelConfirm(null)
    loadRegs()
  }

  function getAssLabel(r) {
    if (!verificaEseguita) return ''
    const p = (r.partita_iva||'').toString().replace(/\s/g,'').replace(/^0+/,'')
    if (!p) return 'P.IVA assente'
    const a = associatiMap[p]
    if (!a) return 'Non trovato'
    return a.associato ? 'Associato' : 'Non associato'
  }

  async function exportExcel() {
    const evento = eventi.find(e=>e.id===selectedEvento)
    const eventoTitle = evento?.titolo || 'evento'
    const dataExport = new Date().toLocaleDateString('it-IT',{day:'2-digit',month:'long',year:'numeric'})
    const oraExport = new Date().toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})

    // ── Palette colori (ARGB, senza # — formato richiesto da ExcelJS) ──
    const C = {
      bluCna:    'FF003DA5',
      bluScuro:  'FF002A73',
      bianco:    'FFFFFFFF',
      nero:      'FF0A0A0A',
      grigio:    'FF6B7280',
      grigioCh:  'FFF4F5F7',
      bordoCh:   'FFE5E7EB',
      assocBg:   'FFF0FDF4', assocFg: 'FF15803D', assocBr: 'FFBBF7D0',
      disdBg:    'FFFEF2F2', disdFg:  'FFDC2626', disdBr:  'FFFECACA',
      nfBg:      'FFFEF2F2', nfFg:    'FFDC2626', nfBr:    'FFFECACA',
      noPivaBg:  'FFFFF7ED', noPivaFg:'FFC2410C', noPivaBr:'FFFED7AA',
      presenteBg:'FFEFF6FF', presenteFg:'FF1D4ED8',
    }

    function rigaStile(r) {
      if (!verificaEseguita) return null
      const p = (r.partita_iva||'').toString().replace(/\s/g,'').replace(/^0+/,'')
      if (!p) return { bg:C.noPivaBg, fg:C.noPivaFg, br:C.noPivaBr, label:'P.IVA assente' }
      const a = associatiMap[p]
      if (!a) return { bg:C.nfBg, fg:C.nfFg, br:C.nfBr, label:'Non trovato' }
      return a.associato
        ? { bg:C.assocBg, fg:C.assocFg, br:C.assocBr, label:'Associato CNA' }
        : { bg:C.disdBg, fg:C.disdFg, br:C.disdBr, label:'Non associato' }
    }

    const cols = ['#','Nome','Cognome','Ragione Sociale','P.IVA','Email','Cellulare',
      'Mestiere','CAP','Stato iscrizione','Presente','Check-in','Iscritto il',
      'Ruolo gruppo','Registrato da',
      ...formFields.map(f => f.label),
      ...(verificaEseguita ? ['Stato associazione','Data stipula'] : [])]
    const nCols = cols.length
    const pivaColIdx = cols.indexOf('P.IVA')          // 0-based
    const assColIdx  = cols.indexOf('Stato associazione')
    const presenteColIdx = cols.indexOf('Presente')

    const totIscritti = filtered.length
    const totPresenti = filtered.filter(r=>r.presente).length
    const totAssociati = verificaEseguita ? filtered.filter(r=>{
      const p=(r.partita_iva||'').toString().replace(/\s/g,'').replace(/^0+/,'')
      return associatiMap[p]?.associato
    }).length : null

    const wb = new ExcelJS.Workbook()
    wb.creator = 'CNA Roma — Portale Eventi'
    wb.created = new Date()

    const ws = wb.addWorksheet('Iscritti', {
      views: [{ state:'frozen', ySplit: 7 }], // sotto l'header tabella (riga 7)
    })

    // ── Larghezze colonne ──
    const extraLabels = new Set(formFields.map(f => f.label))
    ws.columns = cols.map(col => ({
      width: col==='Ragione Sociale'?38 : col==='Email'?30 : col==='P.IVA'?15 :
             col==='Stato associazione'?20 : col==='Data stipula'?14 :
             col==='Nome'||col==='Cognome'?18 : col==='Mestiere'?22 :
             col==='#'?6 : col==='Ruolo gruppo'?14 : col==='Registrato da'?28 :
             extraLabels.has(col) ? 24 : 15
    }))

    const fill = (argb) => ({ type:'pattern', pattern:'solid', fgColor:{ argb } })
    const thin = (argb) => ({ style:'thin', color:{ argb } })

    // Riga 1: titolo
    ws.mergeCells(1,1,1,nCols)
    const r1 = ws.getRow(1)
    r1.height = 32
    r1.getCell(1).value = 'ELENCO ISCRITTI — ' + eventoTitle.toUpperCase()
    r1.eachCell({ includeEmpty:true }, (cell, ci) => {
      cell.fill = fill(C.bluCna)
      cell.font = { bold:true, size:16, color:{ argb:C.bianco }, name:'Calibri' }
      cell.alignment = { horizontal: ci===1?'left':'center', vertical:'middle', indent: ci===1?1:0 }
    })

    // Riga 2: sottotitolo
    ws.mergeCells(2,1,2,nCols)
    const r2 = ws.getRow(2)
    r2.height = 20
    r2.getCell(1).value = `Esportato il ${dataExport} alle ${oraExport} · CNA Roma — Portale Eventi`
    r2.eachCell({ includeEmpty:true }, (cell, ci) => {
      cell.fill = fill(C.bluScuro)
      cell.font = { italic:true, size:10, color:{ argb:'FFD6E4FF' }, name:'Calibri' }
      cell.alignment = { horizontal: ci===1?'left':'center', vertical:'middle', indent: ci===1?1:0 }
    })

    // Riga 3: spaziatura
    ws.getRow(3).height = 18

    // Riga 4: card riepilogo — etichette
    const cardCols = verificaEseguita ? [1,3,5] : [1,3]
    ws.mergeCells(4,1,4,2)
    ws.mergeCells(4,3,4,4)
    if (verificaEseguita) ws.mergeCells(4,5,4,6)
    const r4 = ws.getRow(4)
    r4.getCell(1).value = 'TOT. ISCRITTI'
    r4.getCell(3).value = 'PRESENTI'
    if (verificaEseguita) r4.getCell(5).value = 'ASSOCIATI CNA'
    cardCols.forEach(ci => {
      const cell = r4.getCell(ci)
      cell.fill = fill(C.grigioCh)
      cell.font = { bold:true, size:9, color:{ argb:C.grigio }, name:'Calibri' }
      cell.alignment = { horizontal:'center', vertical:'middle' }
      cell.border = { top:thin(C.bordoCh), left:thin(C.bordoCh), right:thin(C.bordoCh) }
    })

    // Riga 5: card riepilogo — valori
    ws.mergeCells(5,1,5,2)
    ws.mergeCells(5,3,5,4)
    if (verificaEseguita) ws.mergeCells(5,5,5,6)
    const r5 = ws.getRow(5)
    r5.height = 34
    r5.getCell(1).value = totIscritti
    r5.getCell(3).value = totPresenti
    if (verificaEseguita) r5.getCell(5).value = totAssociati
    const cardColors = [
      { bg:'FFEFF6FF', fg:C.bluCna },
      { bg:'FFF0FDF4', fg:'FF15803D' },
      { bg:'FFF0FDF4', fg:'FF15803D' },
    ]
    cardCols.forEach((ci, idx) => {
      const cell = r5.getCell(ci)
      cell.fill = fill(cardColors[idx].bg)
      cell.font = { bold:true, size:20, color:{ argb:cardColors[idx].fg }, name:'Calibri' }
      cell.alignment = { horizontal:'center', vertical:'middle' }
      cell.border = { bottom:thin(C.bordoCh), left:thin(C.bordoCh), right:thin(C.bordoCh) }
    })

    // Riga 6: spaziatura
    ws.getRow(6).height = 10

    // Riga 7: header tabella
    const headerRowIdx = 7
    const rh = ws.getRow(headerRowIdx)
    rh.height = 26
    cols.forEach((c, i) => { rh.getCell(i+1).value = c })
    rh.eachCell({ includeEmpty:true }, cell => {
      cell.fill = fill(C.bluCna)
      cell.font = { bold:true, size:10, color:{ argb:C.bianco }, name:'Calibri' }
      cell.alignment = { horizontal:'center', vertical:'middle', wrapText:true }
      cell.border = { bottom:{ style:'medium', color:{ argb:C.bluScuro } } }
    })

    // ── Righe dati ──
    const dataStartIdx = headerRowIdx + 1
    filtered.forEach((r, ri) => {
      const rowIdx = dataStartIdx + ri
      const piva = (r.partita_iva||'').toString().replace(/\s/g,'').replace(/^0+/,'')
      const ass = associatiMap[piva]
      const stato = rigaStile(r)
      const zebra = ri % 2 === 1
      const bg = stato ? stato.bg : (zebra ? C.grigioCh : C.bianco)
      const fg = stato ? stato.fg : C.nero
      const br = stato ? stato.br : C.bordoCh

      const values = [
        r.numero_iscrizione||'', r.nome||'', r.cognome||'', r.ragione_sociale||'', r.partita_iva||'',
        r.email||'', r.cellulare||'', getMestiere(r.mestiere_id), r.cap||'',
        r.stato||'', r.presente?'Sì':'No', formatDt(r.checkin_at), r.created_at ? new Date(r.created_at).toLocaleString('it-IT',{timeZone:'Europe/Rome',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'}) : '',
        r.gruppo_id === r.id ? 'Capogruppo' : r.referente_id ? 'Accompagnatore' : '',
        r.referente_id && referentiMap[r.referente_id] ? referentiMap[r.referente_id] : '',
        ...formFields.map(f => r[f.colonna_db]||''),
      ]
      if (verificaEseguita) {
        values.push(getAssLabel(r))
        values.push(ass?.datastipula||'')
      }

      const row = ws.getRow(rowIdx)
      values.forEach((v, i) => { row.getCell(i+1).value = v })

      for (let ci = 1; ci <= nCols; ci++) {
        const isPresenteCol = (ci-1) === presenteColIdx
        const presenteVal = r.presente
        const cell = row.getCell(ci)
        cell.fill = fill((isPresenteCol && presenteVal) ? C.presenteBg : bg)
        cell.font = {
          size:10, name:'Calibri',
          color: { argb: (isPresenteCol && presenteVal) ? C.presenteFg : fg },
          bold: (ci-1) === assColIdx || (isPresenteCol && presenteVal),
        }
        cell.border = {
          top:thin(br), bottom:thin(br), left:thin(C.bordoCh), right:thin(C.bordoCh),
        }
        cell.alignment = {
          vertical:'middle',
          horizontal: ['Presente','Stato iscrizione','Stato associazione'].includes(cols[ci-1]) ? 'center' : 'left',
        }
        // P.IVA sempre come testo esplicito — altrimenti Excel la interpreta
        // come numero e tronca eventuali zeri iniziali.
        if ((ci-1) === pivaColIdx) {
          cell.value = (r.partita_iva || '').toString()
          cell.numFmt = '@'
        }
      }
    })

    // ── Autofiltro sull'header ──
    ws.autoFilter = { from: { row:headerRowIdx, column:1 }, to: { row:headerRowIdx, column:nCols } }

    // ── Foglio 2: legenda colori (solo se verifica eseguita) ──
    if (verificaEseguita) {
      const wsLeg = wb.addWorksheet('Legenda')
      wsLeg.columns = [{ width:24 }, { width:55 }]

      wsLeg.mergeCells(1,1,1,2)
      const lr1 = wsLeg.getRow(1)
      lr1.getCell(1).value = 'LEGENDA STATO ASSOCIAZIONE CNA'
      lr1.getCell(1).fill = fill(C.bluCna)
      lr1.getCell(1).font = { bold:true, size:13, color:{ argb:C.bianco }, name:'Calibri' }
      lr1.getCell(1).alignment = { horizontal:'left', vertical:'middle', indent:1 }
      lr1.getCell(2).fill = fill(C.bluCna)

      const lr3 = wsLeg.getRow(3)
      lr3.getCell(1).value = 'Colore'
      lr3.getCell(2).value = 'Significato'
      ;[1,2].forEach(ci => {
        const cell = lr3.getCell(ci)
        cell.fill = fill(C.grigioCh)
        cell.font = { bold:true, size:10, color:{ argb:C.grigio }, name:'Calibri' }
      })

      const legenda = [
        { label:'Associato CNA', desc:'Socio attivo, nessuna disdetta registrata', bg:C.assocBg, fg:C.assocFg },
        { label:'Non associato', desc:'P.IVA presente in archivio ma non come iscritto attivo (disdetta o altro servizio)', bg:C.disdBg, fg:C.disdFg },
        { label:'Non trovato', desc:'P.IVA non presente in archivio associati', bg:C.nfBg, fg:C.nfFg },
        { label:'P.IVA assente', desc:'Iscritto senza P.IVA — verifica non eseguibile', bg:C.noPivaBg, fg:C.noPivaFg },
      ]
      legenda.forEach((item, idx) => {
        const row = wsLeg.getRow(4 + idx)
        row.getCell(1).value = item.label
        row.getCell(2).value = item.desc
        ;[1,2].forEach(ci => {
          const cell = row.getCell(ci)
          cell.fill = fill(item.bg)
          cell.font = { size:10, color:{ argb:item.fg }, name:'Calibri', bold: ci===1 }
          cell.border = { top:thin(C.bordoCh), bottom:thin(C.bordoCh) }
        })
      })
    }

    // ── Scrittura e download ──
    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `iscritti-${eventoTitle.toLowerCase().replace(/\s+/g,'-')}.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    logAttivita('iscritti_esportati', { eventoId: selectedEvento, eventoTitolo: eventoTitle, dettagli: { totale: filtered.length } })
  }

  function downloadTemplate() {
    const rows = [{ 'Nome':'Mario','Cognome':'Rossi','Email':'mario@esempio.it','Cellulare':'3331234567','Ragione Sociale':'Rossi Srl','P.IVA':'01234567890','CAP':'00100' }]
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Iscritti')
    XLSX.writeFile(wb, 'template-import-iscritti.xlsx')
  }

  function handleFileImport(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const wb = XLSX.read(ev.target.result, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })
      const preview = []
      const errors = []
      rows.forEach((row, i) => {
        const nome = (row['Nome']||'').toString().trim()
        const cognome = (row['Cognome']||'').toString().trim()
        const email = (row['Email']||'').toString().trim()
        if (!nome && !cognome) { errors.push(`Riga ${i+2}: Nome e Cognome mancanti`); return }
        if (!email) { errors.push(`Riga ${i+2}: Email mancante per ${nome} ${cognome}`); return }
        preview.push({
          nome, cognome, email,
          cellulare: (row['Cellulare']||'').toString().trim(),
          ragione_sociale: (row['Ragione Sociale']||'').toString().trim(),
          partita_iva: (row['P.IVA']||'').toString().trim(),
          cap: (row['CAP']||'').toString().trim(),
        })
      })
      setImportPreview(preview)
      setImportErrors(errors)
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }

  async function confirmImport() {
    if (!selectedEvento || importPreview.length === 0) return
    setImporting(true)
    let ok = 0, fail = 0
    for (const row of importPreview) {
      const qr = `IMP-${Date.now()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`
      const { error } = await supabase.from('registrations').insert({
        event_id: selectedEvento,
        qr_code: qr,
        stato: 'confermato',
        ...row,
      })
      if (error) fail++; else ok++
    }
    setImporting(false)
    setImportDone({ ok, fail })
    if (ok > 0) {
      logAttivita('iscritti_importati', { eventoId: selectedEvento, dettagli: { ok, fail } })
      loadRegs()
    }
  }

  function resetImport() {
    setImportModal(false)
    setImportPreview([])
    setImportErrors([])
    setImportDone(null)
  }

  // Ordinamento
  const SORT_KEYS = {
    'Nominativo': r => `${r.cognome||''} ${r.nome||''}`.toLowerCase(),
    'Email': r => (r.email||'').toLowerCase(),
    'Mestiere': r => getMestiere(r.mestiere_id).toLowerCase(),
    'Iscritto il': r => r.created_at||'',
    'Stato': r => r.stato||'',
    'Associato CNA': r => {
      const p = (r.partita_iva||'').toString().replace(/\s/g,'').replace(/^0+/,'')
      if (!p) return '3'
      const a = verificaEseguita ? associatiMap[p] : null
      if (!a) return '2'
      return a.associato ? '0' : '1'
    },
    'Data stipula': r => {
      const p = (r.partita_iva||'').toString().replace(/\s/g,'').replace(/^0+/,'')
      return (verificaEseguita && associatiMap[p]?.datastipula) || ''
    },
  }

  const sorted = sortCol && SORT_KEYS[sortCol]
    ? [...filtered].sort((a,b) => {
        const va = SORT_KEYS[sortCol](a)
        const vb = SORT_KEYS[sortCol](b)
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
      })
    : filtered

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const paginated = sorted.slice((pagina-1)*PAGE_SIZE, pagina*PAGE_SIZE)

  // 4 colori per stato verifica associati
  const RC = {
    assoc:    { bg:'#F0FDF4', hov:'#DCFCE7' }, // verde
    disdetto: { bg:'#FEF2F2', hov:'#FECACA' }, // rosso
    notFound: { bg:'#F1F5F9', hov:'#E2E8F0' }, // grigio
    noPiva:   { bg:'#FFF7ED', hov:'#FED7AA' }, // arancione
    none:     { bg:'transparent', hov:'#F9FAFB' },
  }
  function getRC(r) {
    if (!verificaEseguita) return RC.none
    const p = (r.partita_iva||'').toString().replace(/\s/g,'').replace(/^0+/,'')
    if (!p) return RC.noPiva
    const a = associatiMap[p]
    if (!a) return RC.notFound
    return a.associato ? RC.assoc : RC.disdetto
  }
  const totPresenti = registrations.filter(r=>r.presente).length
  const totConfermati = registrations.filter(r=>r.stato==='confermato').length

  return (
    <div style={s.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={s.header} className="page-header-row">
        <div>
          <h1 style={s.title}>Iscritti</h1>
          <p style={s.subtitle}>{selectedEvento ? `${registrations.length} iscritti · ${totPresenti} presenti · ${totConfermati} confermati` : 'Seleziona un evento'}</p>
        </div>
      </div>
      {/* Selettore evento + filtri */}
      <div style={s.filters} className="iscritti-filters">
        <EventSelector
          eventi={eventi}
          value={selectedEvento}
          onChange={e => setSelectedEvento(e.target.value)}
          label="Evento"
        />
        {selectedEvento && <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', marginTop:'-8px', marginBottom:'12px' }}>
          <div style={s.searchWrap}>
            <Search size={16} style={s.searchIcon}/>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Cerca nome, cognome, email…" style={s.searchInput}/>
          </div>
          <Select value={filterStato} onChange={e=>setFilterStato(e.target.value)}>
            <option value="tutti">Tutti gli stati</option>
            <option value="confermato">Confermato</option>
            <option value="presente">Presente</option>
            <option value="assente">Assente</option>
            <option value="walk-in">Walk-in</option>
          </Select>
        </div>}
      </div>

      {/* Stats cards */}
      {/* Bottoni azioni — DOPO il selettore evento */}
      {selectedEvento && (
        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'16px', alignItems:'center' }}>
          <Btn variant="primary" onClick={() => verificaAssociati(false)} disabled={verificaInCorso} size="md"
            title="Incrocia le P.IVA dei nuovi iscritti (non ancora controllati) con la tabella associati CNA">
            {verificaInCorso
              ? <><span style={{animation:'spin 1s linear infinite',display:'inline-block'}}>⏳</span> Verifica in corso…</>
              : '🔍 Verifica associati CNA'}
          </Btn>
          {verificaEseguita && (
            <Btn variant="secondary" onClick={() => verificaAssociati(true)} disabled={verificaInCorso} size="md"
              title="Ricontrolla TUTTI gli iscritti, sovrascrivendo anche i dati gi\u00e0 verificati">
              ↻ Riverifica tutti
            </Btn>
          )}
          {verificaEseguita && (
            <span style={{fontSize:'12px',color:'#059669',fontWeight:'600'}}>
              ✓ {Object.keys(associatiMap).length} trovati
              {(() => {
                const ultima = registrations
                  .map(r => r.associato_verificato_at)
                  .filter(Boolean)
                  .sort()
                  .pop()
                return ultima ? <span style={{color:'#9CA3AF',fontWeight:'400',marginLeft:'6px'}}>
                  · aggiornato {new Date(ultima).toLocaleDateString('it-IT')} {new Date(ultima).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})}
                </span> : null
              })()}
            </span>
          )}
          <Btn variant="secondary" onClick={loadRegs} size="md"><RefreshCw size={16}/> Aggiorna</Btn>
          <div style={{flex:1}}/>
          {eventi.find(e=>e.id===selectedEvento)?.certificato_abilitato && (
            <Btn variant="secondary" onClick={inviaCertificati} disabled={invioInCorso} size="md">
              🏆 {invioInCorso ? 'Invio…' : 'Invia certificati'}
            </Btn>
          )}
          <Btn variant="secondary" onClick={downloadTemplate} size="md"><Download size={16}/> Template</Btn>
          <Btn variant="secondary" onClick={() => { setImportModal(true); setImportDone(null); setImportPreview([]); setImportErrors([]) }} size="md"><Upload size={16}/> Importa</Btn>
          <Btn variant="secondary" onClick={exportExcel} size="md"><Download size={16}/> Esporta Excel</Btn>
        </div>
      )}

      {/* TAB SWITCHER — visibile solo se teatro abilitato */}
      {selectedEvento && teatroAbilitato && (
        <div style={{ display:'flex', gap:'4px', marginBottom:'20px', borderBottom:'2px solid #E5E7EB' }}>
          {[{ id:'iscritti', label:'👥 Iscritti' }, { id:'teatro', label:'🎭 Gestione posti' }].map(tab => (
            <button key={tab.id} onClick={() => setTabAttivo(tab.id)}
              style={{ padding:'10px 20px', border:'none', background:'none', cursor:'pointer', fontSize:'14px', fontWeight:'700', fontFamily:"'Inter',sans-serif", color: tabAttivo === tab.id ? '#003DA5' : '#6B7280', borderBottom: tabAttivo === tab.id ? '2px solid #003DA5' : '2px solid transparent', marginBottom:'-2px' }}>
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* TAB TEATRO */}
      {selectedEvento && teatroAbilitato && tabAttivo === 'teatro' && (
        <div>
          {/* Stats */}
          <div style={{ display:'flex', gap:'12px', flexWrap:'wrap', marginBottom:'16px' }}>
            {[
              { label:'Con posto', value: registrations.filter(r => r.numero_posto).length, color:'#003DA5' },
              { label:'Senza posto', value: registrations.filter(r => !r.numero_posto).length, color:'#DC2626' },
              { label:'Presenza confermata', value: registrations.filter(r => r.presenza_confermata).length, color:'#059669' },
              { label:'In attesa conferma', value: registrations.filter(r => r.numero_posto && !r.presenza_confermata).length, color:'#D97706' },
            ].map(st => (
              <div key={st.label} style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:'8px', padding:'14px 20px', flex:1, minWidth:'140px' }}>
                <p style={{ margin:'0 0 4px', fontSize:'24px', fontWeight:'900', color:st.color, letterSpacing:'-0.02em' }}>{st.value}</p>
                <p style={{ margin:0, fontSize:'12px', color:'#6B7280', fontWeight:'500' }}>{st.label}</p>
              </div>
            ))}
          </div>

          {/* Filtri teatro */}
          <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', marginBottom:'16px', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
              <span style={{ fontSize:'12px', color:'#6B7280', fontWeight:'600', whiteSpace:'nowrap' }}>Posto:</span>
              {[
                { v:'tutti', label:'Tutti' },
                { v:'con_posto', label:'Con posto' },
                { v:'senza_posto', label:'Senza posto' },
              ].map(opt => (
                <button key={opt.v} onClick={() => setFiltroPostoAssegnato(opt.v)}
                  style={{ padding:'5px 12px', borderRadius:'6px', border:'1px solid', fontSize:'12px', fontWeight:'600', cursor:'pointer', fontFamily:"'Inter',sans-serif",
                    background: filtroPostoAssegnato === opt.v ? '#003DA5' : '#fff',
                    color: filtroPostoAssegnato === opt.v ? '#fff' : '#374151',
                    borderColor: filtroPostoAssegnato === opt.v ? '#003DA5' : '#D1D5DB',
                  }}>{opt.label}</button>
              ))}
            </div>
            <div style={{ width:'1px', height:'24px', background:'#E5E7EB' }} />
            <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
              <span style={{ fontSize:'12px', color:'#6B7280', fontWeight:'600', whiteSpace:'nowrap' }}>Mail posto:</span>
              {[
                { v:'tutti', label:'Tutti' },
                { v:'inviata', label:'Inviata' },
                { v:'non_inviata', label:'Non inviata' },
              ].map(opt => (
                <button key={opt.v} onClick={() => setFiltroMailPosto(opt.v)}
                  style={{ padding:'5px 12px', borderRadius:'6px', border:'1px solid', fontSize:'12px', fontWeight:'600', cursor:'pointer', fontFamily:"'Inter',sans-serif",
                    background: filtroMailPosto === opt.v ? '#003DA5' : '#fff',
                    color: filtroMailPosto === opt.v ? '#fff' : '#374151',
                    borderColor: filtroMailPosto === opt.v ? '#003DA5' : '#D1D5DB',
                  }}>{opt.label}</button>
              ))}
            </div>
            {(filtroPostoAssegnato !== 'tutti' || filtroMailPosto !== 'tutti') && (
              <button onClick={() => { setFiltroPostoAssegnato('tutti'); setFiltroMailPosto('tutti') }}
                style={{ fontSize:'12px', color:'#DC2626', background:'none', border:'none', cursor:'pointer', padding:0, fontWeight:'600' }}>
                × Azzera filtri
              </button>
            )}
          </div>

          {/* Barra azioni invio */}
          <div style={{ background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:'10px', padding:'14px 16px', marginBottom:'16px' }}>
            <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', alignItems:'center' }}>
              {/* Invio massivo a tutti */}
              <Btn variant="primary" onClick={() => inviaMailPosti(false, null)} disabled={invioPostoInCorso} size="md">
                {invioPostoInCorso ? '📨 Invio…' : '📨 Invia a tutti'}
              </Btn>

              {/* Invio ai selezionati */}
              {teatroSelezione.size > 0 && (
                <Btn variant="secondary" onClick={() => inviaMailPosti(false, [...teatroSelezione])} disabled={invioPostoInCorso} size="md">
                  📨 Invia ai selezionati ({teatroSelezione.size})
                </Btn>
              )}

              <div style={{ flex:1 }} />

              {/* Dry run */}
              <Btn variant="ghost" onClick={() => inviaMailPosti(true, teatroSelezione.size > 0 ? [...teatroSelezione] : null)} size="md">
                🔍 {teatroSelezione.size > 0 ? `Anteprima selezionati (${teatroSelezione.size})` : 'Anteprima tutti'}
              </Btn>
            </div>

            {/* Info selezione */}
            {teatroSelezione.size > 0 && (
              <div style={{ marginTop:'10px', display:'flex', alignItems:'center', gap:'10px' }}>
                <span style={{ fontSize:'12px', color:'#374151', fontWeight:'600' }}>
                  {teatroSelezione.size} selezionati
                </span>
                <button onClick={() => setTeatroSelezione(new Set())}
                  style={{ fontSize:'12px', color:'#DC2626', background:'none', border:'none', cursor:'pointer', padding:0, fontWeight:'600' }}>
                  Deseleziona tutto
                </button>
              </div>
            )}
          </div>

          {/* Risultato dry run */}
          {dryRunRis && (
            <div style={{ marginBottom:'14px', padding:'12px 18px', borderRadius:'8px', background: dryRunRis.error ? '#FEF2F2' : '#EFF6FF', border:`1px solid ${dryRunRis.error ? '#FECACA' : '#BFDBFE'}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <p style={{ margin:0, fontSize:'13px', fontWeight:'700', color: dryRunRis.error ? '#DC2626' : '#1D4ED8' }}>
                  {dryRunRis.error ? `❌ ${dryRunRis.error}` : `📋 ${dryRunRis.count} iscritti riceverebbero la mail.`}
                </p>
                <button onClick={() => setDryRunRis(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', fontSize:'18px', padding:0 }}>×</button>
              </div>
              {dryRunRis.sample?.length > 0 && <p style={{ margin:'6px 0 0', fontSize:'12px', color:'#374151' }}>Es: {dryRunRis.sample.map(r => `${r.nome} (${r.numero_posto})`).join(' · ')}</p>}
            </div>
          )}

          {/* Risultato invio */}
          {invioPostoRis && (
            <div style={{ marginBottom:'14px', padding:'12px 18px', borderRadius:'8px', background: invioPostoRis.error ? '#FEF2F2' : '#F0FDF4', border:`1px solid ${invioPostoRis.error ? '#FECACA' : '#BBF7D0'}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <p style={{ margin:0, fontSize:'13px', fontWeight:'700', color: invioPostoRis.error ? '#DC2626' : '#059669' }}>
                  {invioPostoRis.error ? `❌ ${invioPostoRis.error}` : `✅ ${invioPostoRis.sent} mail inviate su ${invioPostoRis.total}${invioPostoRis.failed > 0 ? ` · ${invioPostoRis.failed} fallite` : ''}`}
                </p>
                <button onClick={() => setInvioPostoRis(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', fontSize:'18px', padding:0 }}>×</button>
              </div>
              {invioPostoRis.errors?.length > 0 && (
                <p style={{ margin:'6px 0 0', fontSize:'11px', color:'#DC2626' }}>{invioPostoRis.errors.join(' · ')}</p>
              )}
            </div>
          )}

          {/* Tabella */}
          <div style={s.card}>
            <div style={{ overflowX:'auto' }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={{ padding:'10px 12px', background:'linear-gradient(135deg,#003DA5,#1a56db)', color:'#fff', width:'40px' }}>
                      <input type="checkbox"
                        checked={registrations.filter(r => r.numero_posto && r.email).length > 0 &&
                          registrations.filter(r => r.numero_posto && r.email).every(r => teatroSelezione.has(r.id))}
                        onChange={() => toggleSelezioneTeatroTutti(registrations)}
                        style={{ cursor:'pointer', width:'16px', height:'16px', accentColor:'#fff' }}
                        title="Seleziona/deseleziona tutti (con posto e email)"
                      />
                    </th>
                    {['Iscritto','Email','Posto','Conferma presenza','Confermato il','Azioni'].map((h,i) => (
                      <th key={i} style={{ padding:'10px 14px', background:'linear-gradient(135deg,#003DA5,#1a56db)', color:'#fff', fontSize:'11px', fontWeight:'700', letterSpacing:'.05em', textTransform:'uppercase', textAlign:'left', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {registrations
                    .filter(r => {
                      if (filtroPostoAssegnato === 'con_posto' && !r.numero_posto) return false
                      if (filtroPostoAssegnato === 'senza_posto' && r.numero_posto) return false
                      if (filtroMailPosto === 'inviata' && !r.posto_email_inviata) return false
                      if (filtroMailPosto === 'non_inviata' && r.posto_email_inviata) return false
                      return true
                    })
                    .map((r, i) => {
                    const editVal = postoEdit[r.id]
                    const selezionato = teatroSelezione.has(r.id)
                    return (
                      <tr key={r.id} style={{ backgroundColor: selezionato ? '#EFF6FF' : (i % 2 === 0 ? '#fff' : '#F9FAFB'), borderBottom:'1px solid #F3F4F6', transition:'background .1s' }}>
                        {/* Checkbox */}
                        <td style={{ ...s.td, textAlign:'center', paddingLeft:'12px', paddingRight:'12px' }}>
                          {r.numero_posto && r.email ? (
                            <input type="checkbox"
                              checked={selezionato}
                              onChange={() => toggleSelezioneTeatroReg(r.id)}
                              style={{ cursor:'pointer', width:'16px', height:'16px', accentColor:'#003DA5' }}
                            />
                          ) : (
                            <span title="Nessun posto o email mancante" style={{ color:'#D1D5DB', fontSize:'12px' }}>—</span>
                          )}
                        </td>
                        <td style={s.td}>
                          <p style={s.name}>{r.nome} {r.cognome}</p>
                          {r.ragione_sociale && <p style={s.sub}>{r.ragione_sociale}</p>}
                          {r.gruppo_id === r.id && (
                            <span style={{ display:'inline-flex', alignItems:'center', gap:'3px', fontSize:'10px', fontWeight:'700', color:'#003DA5', background:'#EEF3FF', borderRadius:'999px', padding:'2px 7px', marginTop:'3px' }}>👥 Capogruppo</span>
                          )}
                          {r.referente_id && referentiMap[r.referente_id] && (
                            <span style={{ display:'inline-flex', alignItems:'center', gap:'3px', fontSize:'10px', fontWeight:'700', color:'#6B7280', background:'#F3F4F6', borderRadius:'999px', padding:'2px 7px', marginTop:'3px' }}>↩ {referentiMap[r.referente_id]}</span>
                          )}
                        </td>
                        <td style={s.td}><span style={s.cell}>{r.email || <span style={{color:'#DC2626',fontSize:'12px'}}>⚠ Mancante</span>}</span></td>
                        {/* Input posto — testo libero */}
                        <td style={s.td}>
                          <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                            <input
                              type="text"
                              value={editVal !== undefined ? editVal : (r.numero_posto ?? '')}
                              onChange={e => setPostoEdit(p => ({ ...p, [r.id]: e.target.value }))}
                              onBlur={e => { if (editVal !== undefined) salvaPosto(r.id, e.target.value) }}
                              onKeyDown={e => {
                                if (e.key === 'Enter') { e.target.blur(); salvaPosto(r.id, e.target.value) }
                                if (e.key === 'Escape') setPostoEdit(p => ({ ...p, [r.id]: undefined }))
                              }}
                              style={{ width:'110px', padding:'6px 10px', border:`1px solid ${postoError[r.id] ? '#DC2626' : '#D1D5DB'}`, borderRadius:'6px', fontSize:'13px', fontWeight:'700', color: r.numero_posto ? '#003DA5' : '#6B7280', fontFamily:"'Inter',sans-serif" }}
                              placeholder="es. Platea 1A"
                            />
                            {postoSaving[r.id] && <span style={{ fontSize:'12px', color:'#9CA3AF' }}>⏳</span>}
                            {r.numero_posto && !postoSaving[r.id] && <span style={{ fontSize:'12px', color:'#059669' }}>✓</span>}
                          </div>
                          {postoError[r.id] && <p style={{ margin:'4px 0 0', fontSize:'11px', color:'#DC2626' }}>{postoError[r.id]}</p>}
                        </td>
                        <td style={s.td}>
                          {r.presenza_confermata
                            ? <span style={{ fontSize:'12px', fontWeight:'700', color:'#059669', background:'#F0FDF4', padding:'4px 10px', borderRadius:'999px' }}>✓ Confermata</span>
                            : <span style={{ fontSize:'12px', color:'#9CA3AF', background:'#F9FAFB', padding:'4px 10px', borderRadius:'999px' }}>In attesa</span>}
                        </td>
                        <td style={s.td}><span style={{ fontSize:'12px', color:'#374151' }}>{r.presenza_confermata_at ? formatDt(r.presenza_confermata_at) : '—'}</span></td>
                        {/* Invio singolo */}
                        <td style={s.td}>
                          {r.numero_posto && r.email ? (
                            <button
                              onClick={() => inviaMailPosti(false, [r.id])}
                              disabled={invioPostoInCorso}
                              title="Invia mail posto a questo iscritto"
                              style={{ background:'none', border:'1px solid #E5E7EB', borderRadius:'6px', padding:'5px 10px', cursor:'pointer', fontSize:'12px', color:'#374151', fontFamily:"'Inter',sans-serif", fontWeight:'600', whiteSpace:'nowrap' }}>
                              📨 Invia
                            </button>
                          ) : (
                            <span style={{ fontSize:'11px', color:'#D1D5DB' }}>—</span>
                          )}
                          {r.posto_email_inviata && (
                            <span style={{ marginLeft:'6px', fontSize:'11px', color:'#059669', fontWeight:'600', background:'#F0FDF4', padding:'3px 7px', borderRadius:'999px', whiteSpace:'nowrap' }}>✓ Inviata</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {registrations.length === 0 && <div style={{ padding:'48px', textAlign:'center', color:'#9CA3AF', fontSize:'14px' }}>Nessun iscritto per questo evento</div>}
          </div>
        </div>
      )}

      {/* STAT CARDS + TABELLA — solo tab iscritti */}
      {selectedEvento && (!teatroAbilitato || tabAttivo === 'iscritti') && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:'10px', marginBottom:'16px' }} className="stat-grid-auto">
          <GlowStatCard icon="users"     label="Tot. iscritti" value={registrations.length}                                    palette="blue"/>
          <GlowStatCard icon="check"     label="Presenti"      value={totPresenti}                                              palette="green"/>
          <GlowStatCard icon="trending"  label="Confermati"    value={totConfermati}                                            palette="cyan"/>
          <GlowStatCard icon="usercheck" label="Walk-in"       value={registrations.filter(r=>r.stato==='walk-in').length}     palette="violet"/>
          <GlowStatCard icon="userx"     label="Assenti"       value={registrations.filter(r=>r.stato==='assente').length}     palette="red"/>
        </div>
      )}

      {/* Tabella — nascosta nel tab teatro */}
      {(!selectedEvento || !teatroAbilitato || tabAttivo === 'iscritti') && (
      <div style={s.card}>
        {!selectedEvento ? (
          <EmptyState icon={Users} title="Nessun evento selezionato" desc="Seleziona un evento dal menu per vedere gli iscritti"/>
        ) : loading ? (
          <div style={{ padding:'48px', textAlign:'center', color:'#9CA3AF', fontSize:'14px' }}>Caricamento…</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Users} title="Nessun iscritto trovato" desc="Nessun risultato per i filtri selezionati"/>
        ) : (
          <>
            {/* BANNER VERIFICA — sopra la tabella */}
            {verificaInfo && (
              <div style={{ marginBottom:'14px', padding:'12px 18px', borderRadius:'8px',
                backgroundColor: verificaInfo.errore ? '#FEF2F2' : '#EFF6FF',
                border: `1px solid ${verificaInfo.errore ? '#FECACA' : '#BFDBFE'}`,
                display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' }}>
                <p style={{ fontSize:'13px', fontWeight:'700', margin:0,
                  color: verificaInfo.errore ? '#DC2626' : '#1D4ED8' }}>
                  {verificaInfo.errore
                    ? `❌ ${verificaInfo.errore}`
                    : `✅ ${verificaInfo.trovati} associati trovati su ${verificaInfo.cercati} P.IVA — colonne Associato CNA e Data stipula aggiornate`}
                </p>
                <button onClick={() => setVerificaInfo(null)}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', fontSize:'18px', padding:0, flexShrink:0 }}>×</button>
              </div>
            )}
            <div style={{ overflowX:'auto' }} className="table-wrap">
              <table style={s.table}>
                <SortableHead
                  columns={[
                    { label:'Nominativo',  color:'blue',    sortable:true },
                    { label:'Email',       color:'cyan',    sortable:true, hideOnMobile:true },
                    { label:'Mestiere',    color:'violet',  sortable:true, hideOnMobile:true },
                    { label:'#', color:'gray', sortable:false, hideOnMobile:true },
                    { label:'Iscritto il', color:'amber',   sortable:true, hideOnMobile:true },
                    { label:'Stato',       color:'green',   sortable:true },
                    ...formFields.map(f => ({ label: f.label, color:'purple', sortable:true, hideOnMobile:true })),
                    ...(verificaEseguita ? [
                      { label:'Associato CNA', color:'green', sortable:true, hideOnMobile:true },
                      { label:'Data stipula',  color:'amber', sortable:true, hideOnMobile:true },
                    ] : []),
                    { label:'Azioni', color:'neutral', sortable:false },
                  ]}
                  sortCol={sortCol} sortDir={sortDir} onSort={toggleSort}
                />
                <tbody>
                  {paginated.map(r => {
                    const _rc = getRC(r)
                    const _piva = (r.partita_iva||'').toString().replace(/\s/g,'').replace(/^0+/,'')
                    const _ass = verificaEseguita ? (associatiMap[_piva] || null) : null
                    return (
                      <tr key={r.id} style={{...s.tr, backgroundColor:_rc.bg}}
                        onMouseEnter={e=>e.currentTarget.style.backgroundColor=_rc.hov}
                        onMouseLeave={e=>e.currentTarget.style.backgroundColor=_rc.bg}>
                        <td style={s.td}>
                          <p style={s.name}>{r.nome} {r.cognome}</p>
                          {r.ragione_sociale && <p style={s.sub}>{r.ragione_sociale}</p>}
                          {r.gruppo_id === r.id && (
                            <span style={{ display:'inline-flex', alignItems:'center', gap:'3px', fontSize:'10px', fontWeight:'700', color:'#003DA5', background:'#EEF3FF', borderRadius:'999px', padding:'2px 7px', marginTop:'3px' }}>👥 Capogruppo</span>
                          )}
                          {r.referente_id && referentiMap[r.referente_id] && (
                            <span style={{ display:'inline-flex', alignItems:'center', gap:'3px', fontSize:'10px', fontWeight:'700', color:'#6B7280', background:'#F3F4F6', borderRadius:'999px', padding:'2px 7px', marginTop:'3px' }}>↩ {referentiMap[r.referente_id]}</span>
                          )}
                        </td>
                        <td style={s.td} className="col-hide-mobile"><span style={s.cell}>{r.email||'—'}</span></td>
                        <td style={s.td} className="col-hide-mobile"><span style={s.cell}>{getMestiere(r.mestiere_id)}</span></td>
                        <td style={s.td} className="col-hide-mobile"><span style={{ fontSize:'12px', fontWeight:'700', color:'#003DA5', fontFamily:'monospace' }}>#{r.numero_iscrizione||'—'}</span></td>
                        <td style={s.td} className="col-hide-mobile"><span style={s.cell}>{formatDt(r.created_at)}</span></td>
                        <td style={s.td}><PresenzaBadge stato={r.stato}/></td>
                        {formFields.map(f => (
                          <td key={f.colonna_db} style={s.td} className="col-hide-mobile">
                            <span style={{ ...s.cell, color: r[f.colonna_db] ? '#374151' : '#D1D5DB' }}>
                              {r[f.colonna_db] || '—'}
                            </span>
                          </td>
                        ))}
                        {verificaEseguita && <>
                          <td style={s.td} className="col-hide-mobile">
                            {!_piva
                              ? <span style={{fontSize:'11px',fontWeight:'700',color:'#EA580C',backgroundColor:'#FFF7ED',padding:'3px 10px',borderRadius:'999px'}}>⚠ P.IVA assente</span>
                              : !_ass
                                ? <span style={{fontSize:'11px',fontWeight:'700',color:'#DC2626',backgroundColor:'#FEF2F2',padding:'3px 10px',borderRadius:'999px'}}>◌ Non trovato</span>
                                : _ass.associato
                                  ? <span style={{fontSize:'11px',fontWeight:'700',color:'#15803D',backgroundColor:'#F0FDF4',padding:'3px 10px',borderRadius:'999px'}}>✓ Associato</span>
                                  : <span style={{fontSize:'11px',fontWeight:'700',color:'#DC2626',backgroundColor:'#FEF2F2',padding:'3px 10px',borderRadius:'999px'}}>✗ Non associato</span>
                            }
                          </td>
                          <td style={s.td} className="col-hide-mobile">
                            <span style={{fontSize:'12px',color:'#374151'}}>{_ass?.datastipula||'—'}</span>
                          </td>
                        </>}
                        <td style={s.td}>
                          <div style={{ display:'flex', gap:'6px' }}>
                            <button style={s.iconBtn} title="Dettaglio" onClick={()=>setDetail(r)}>
                              <Eye size={15}/>
                            </button>
                            {canDelete && (
                              <button style={{...s.iconBtn, color:'#DC2626'}} title="Elimina" onClick={()=>setDelConfirm(r)}>
                                <Trash2 size={15}/>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* PAGINAZIONE */}
            {totalPages > 1 && (
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
                padding:'14px 0 0',borderTop:'1px solid #F3F4F6',flexWrap:'wrap',gap:'8px'}}>
                <span style={{fontSize:'13px',color:'#6B7280'}}>
                  {(pagina-1)*PAGE_SIZE+1}–{Math.min(pagina*PAGE_SIZE,sorted.length)} di {sorted.length} iscritti
                </span>
                <div style={{display:'flex',gap:'4px',alignItems:'center'}}>
                  <button onClick={()=>setPagina(1)} disabled={pagina===1}
                    style={{padding:'6px 10px',border:'1px solid #E5E7EB',borderRadius:'6px',
                      backgroundColor:pagina===1?'#F9FAFB':'#fff',cursor:pagina===1?'default':'pointer',
                      fontSize:'13px',color:pagina===1?'#D1D5DB':'#374151'}}>«</button>
                  <button onClick={()=>setPagina(p=>Math.max(1,p-1))} disabled={pagina===1}
                    style={{padding:'6px 12px',border:'1px solid #E5E7EB',borderRadius:'6px',
                      backgroundColor:pagina===1?'#F9FAFB':'#fff',cursor:pagina===1?'default':'pointer',
                      fontSize:'13px',color:pagina===1?'#D1D5DB':'#374151'}}>‹</button>
                  {[...Array(totalPages)].map((_,i)=>i+1).filter(p=>
                    p===1||p===totalPages||Math.abs(p-pagina)<=1
                  ).reduce((acc,p,i,arr)=>{
                    if(i>0&&arr[i-1]!==p-1) acc.push('…')
                    acc.push(p); return acc
                  },[]).map((p,i)=>
                    p==='…' ? <span key={`e${i}`} style={{padding:'6px 4px',fontSize:'13px',color:'#9CA3AF'}}>…</span>
                    : <button key={p} onClick={()=>setPagina(p)}
                        style={{padding:'6px 11px',border:'1px solid',
                          borderColor:pagina===p?'#003DA5':'#E5E7EB',borderRadius:'6px',
                          backgroundColor:pagina===p?'#003DA5':'#fff',
                          color:pagina===p?'#fff':'#374151',
                          fontWeight:pagina===p?'700':'400',
                          cursor:'pointer',fontSize:'13px',fontFamily:"'Inter',sans-serif"}}>
                        {p}
                      </button>
                  )}
                  <button onClick={()=>setPagina(p=>Math.min(totalPages,p+1))} disabled={pagina===totalPages}
                    style={{padding:'6px 12px',border:'1px solid #E5E7EB',borderRadius:'6px',
                      backgroundColor:pagina===totalPages?'#F9FAFB':'#fff',cursor:pagina===totalPages?'default':'pointer',
                      fontSize:'13px',color:pagina===totalPages?'#D1D5DB':'#374151'}}>›</button>
                  <button onClick={()=>setPagina(totalPages)} disabled={pagina===totalPages}
                    style={{padding:'6px 10px',border:'1px solid #E5E7EB',borderRadius:'6px',
                      backgroundColor:pagina===totalPages?'#F9FAFB':'#fff',cursor:pagina===totalPages?'default':'pointer',
                      fontSize:'13px',color:pagina===totalPages?'#D1D5DB':'#374151'}}>»</button>
                </div>
              </div>
            )}

            {/* LEGGENDA COLORI */}
            {verificaEseguita && (
              <div style={{display:'flex',gap:'12px',flexWrap:'wrap',padding:'14px 0 0',
                borderTop:'1px solid #F3F4F6',marginTop:'4px'}}>
                <span style={{fontSize:'11px',fontWeight:'600',color:'#6B7280',alignSelf:'center'}}>LEGENDA:</span>
                {[
                  {bg:'#F0FDF4',color:'#15803D',label:'✓ Associato CNA'},
                  {bg:'#FEF2F2',color:'#DC2626',label:'✗ Non associato'},
                  {bg:'#FEF2F2',color:'#DC2626',label:'◌ Non trovato in archivio'},
                  {bg:'#FFF7ED',color:'#EA580C',label:'⚠ P.IVA assente'},
                ].map(({bg,color,label})=>(
                  <div key={label} style={{display:'flex',alignItems:'center',gap:'7px'}}>
                    <div style={{width:'14px',height:'14px',borderRadius:'3px',backgroundColor:bg,
                      border:`1px solid ${color}33`,flexShrink:0}}/>
                    <span style={{fontSize:'12px',color,fontWeight:'600'}}>{label}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      )} {/* fine condizionale tab iscritti */}

      {/* MODAL DETTAGLIO */}
      {detail && (
        <Modal title="Dettaglio iscritto" onClose={()=>setDetail(null)} width="520px">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }} className="grid-2col">
            {[
              ['Nome', detail.nome],['Cognome', detail.cognome],
              ['Ragione Sociale', detail.ragione_sociale],['P.IVA', detail.partita_iva],
              ['Email', detail.email],['Cellulare', detail.cellulare],
              ['Mestiere', getMestiere(detail.mestiere_id)],['CAP', detail.cap],
              ['Stato', detail.stato],['QR Code', detail.qr_code],
              ...formFields.map(f => [f.label, detail[f.colonna_db] || '—']),
              ['Iscritto il', formatDt(detail.created_at)],['Check-in', formatDt(detail.checkin_at)],
            ].map(([label, val])=>(
              <div key={label}>
                <p style={{ fontSize:'11px', fontWeight:'600', color:'#9CA3AF', textTransform:'uppercase', margin:'0 0 3px' }}>{label}</p>
                <p style={{ fontSize:'14px', color:'#0A0A0A', margin:0, fontWeight:'500' }}>{val||'—'}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop:'20px', display:'flex', justifyContent:'flex-end' }}>
            <Btn variant="ghost" onClick={()=>setDetail(null)}>Chiudi</Btn>
          </div>
        </Modal>
      )}

      {/* MODAL DELETE */}
      {delConfirm && (
        <Modal title="Elimina iscritto" onClose={()=>setDelConfirm(null)} width="420px">
          <p style={{ fontSize:'14px', color:'#374151', marginBottom:'20px' }}>
            Sei sicuro di voler eliminare la registrazione di <strong>{delConfirm.nome} {delConfirm.cognome}</strong>? L'operazione non è reversibile.
          </p>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:'10px' }}>
            <Btn variant="ghost" onClick={()=>setDelConfirm(null)}>Annulla</Btn>
            <Btn variant="danger" onClick={deleteReg}>Elimina</Btn>
          </div>
        </Modal>
      )}
      {/* BANNER RISULTATO CERTIFICATI */}
      {invioRisultato && (
        <div style={{ margin:'0 0 16px', padding:'14px 18px', borderRadius:'8px',
          backgroundColor: invioRisultato.error ? '#FEF2F2' : '#F0FDF4',
          border: `1px solid ${invioRisultato.error ? '#FECACA' : '#BBF7D0'}`,
          display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' }}>
          <p style={{ fontSize:'14px', fontWeight:'600', margin:0,
            color: invioRisultato.error ? '#DC2626' : '#059669' }}>
            {invioRisultato.error
              ? `❌ Errore: ${invioRisultato.error}`
              : `✅ ${invioRisultato.sent} certificati inviati su ${invioRisultato.processed} eventi`}
          </p>
          <button onClick={() => setInvioRisultato(null)}
            style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', fontSize:'18px', padding:0 }}>×</button>
        </div>
      )}

      {/* MODAL IMPORT */}
      {importModal && (
        <Modal title="Importa iscritti da Excel" onClose={resetImport} width="600px">
          {importDone ? (
            <div style={{ textAlign:'center', padding:'24px 0' }}>
              <CheckCircle2 size={48} style={{ color:'#16A34A', marginBottom:'16px' }}/>
              <p style={{ fontSize:'18px', fontWeight:'800', color:'#0A0A0A', margin:'0 0 8px' }}>
                Importazione completata
              </p>
              <p style={{ fontSize:'14px', color:'#6B7280', margin:'0 0 24px' }}>
                <strong style={{ color:'#16A34A' }}>{importDone.ok} iscritti importati</strong>
                {importDone.fail > 0 && <span style={{ color:'#DC2626' }}> · {importDone.fail} errori</span>}
              </p>
              <Btn variant="primary" onClick={resetImport}>Chiudi</Btn>
            </div>
          ) : (
            <>
              {/* Step 1: carica file */}
              {importPreview.length === 0 && importErrors.length === 0 && (
                <div>
                  <p style={{ fontSize:'14px', color:'#374151', marginBottom:'16px', lineHeight:'1.6' }}>
                    Carica un file Excel (.xlsx) con le colonne: <strong>Nome, Cognome, Email</strong> (obbligatori),
                    Cellulare, Ragione Sociale, P.IVA, CAP (opzionali).
                  </p>
                  <div style={{ border:'2px dashed #D1D5DB', borderRadius:'8px', padding:'32px', textAlign:'center',
                    backgroundColor:'#FAFAFA', cursor:'pointer' }}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor='#003DA5' }}
                    onDragLeave={e => e.currentTarget.style.borderColor='#D1D5DB'}
                    onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor='#D1D5DB';
                      const f = e.dataTransfer.files[0]; if (f) { const dt = new DataTransfer(); dt.items.add(f); fileInputRef.current.files = dt.files; handleFileImport({ target: fileInputRef.current }) } }}>
                    <Upload size={32} style={{ color:'#9CA3AF', marginBottom:'12px' }}/>
                    <p style={{ fontSize:'14px', fontWeight:'600', color:'#374151', margin:'0 0 4px' }}>
                      Trascina il file qui o clicca per selezionare
                    </p>
                    <p style={{ fontSize:'12px', color:'#9CA3AF', margin:0 }}>Supporta .xlsx e .xls</p>
                  </div>
                  <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileImport} style={{ display:'none' }}/>
                  <div style={{ marginTop:'16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <button onClick={downloadTemplate} style={{ fontSize:'13px', color:'#003DA5', background:'none', border:'none', cursor:'pointer', fontWeight:'600', padding:0 }}>
                      ↓ Scarica template Excel
                    </button>
                    <Btn variant="ghost" onClick={resetImport}>Annulla</Btn>
                  </div>
                </div>
              )}

              {/* Preview + errori */}
              {(importPreview.length > 0 || importErrors.length > 0) && (
                <div>
                  {importErrors.length > 0 && (
                    <div style={{ backgroundColor:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'6px', padding:'12px 16px', marginBottom:'16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
                        <AlertCircle size={16} style={{ color:'#DC2626' }}/>
                        <span style={{ fontSize:'13px', fontWeight:'700', color:'#DC2626' }}>{importErrors.length} righe con errori (verranno saltate)</span>
                      </div>
                      {importErrors.map((e,i) => <p key={i} style={{ fontSize:'12px', color:'#DC2626', margin:'2px 0', paddingLeft:'24px' }}>{e}</p>)}
                    </div>
                  )}

                  {importPreview.length > 0 && (
                    <>
                      <p style={{ fontSize:'13px', fontWeight:'600', color:'#374151', marginBottom:'10px' }}>
                        <CheckCircle2 size={14} style={{ color:'#16A34A', verticalAlign:'middle', marginRight:'6px' }}/>
                        {importPreview.length} iscritti pronti per l&apos;importazione
                      </p>
                      <div style={{ maxHeight:'260px', overflowY:'auto', border:'1px solid #E5E7EB', borderRadius:'6px' }}>
                        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
                          <thead>
                            <tr style={{ backgroundColor:'#F9FAFB' }}>
                              {['Nome','Cognome','Email','Cellulare'].map(h => (
                                <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontSize:'11px', fontWeight:'600',
                                  color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.04em', borderBottom:'1px solid #E5E7EB' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {importPreview.map((r,i) => (
                              <tr key={i} style={{ borderBottom:'1px solid #F3F4F6' }}>
                                <td style={{ padding:'8px 12px', color:'#0A0A0A', fontWeight:'500' }}>{r.nome}</td>
                                <td style={{ padding:'8px 12px', color:'#0A0A0A', fontWeight:'500' }}>{r.cognome}</td>
                                <td style={{ padding:'8px 12px', color:'#374151' }}>{r.email}</td>
                                <td style={{ padding:'8px 12px', color:'#374151' }}>{r.cellulare||'—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  <div style={{ marginTop:'20px', display:'flex', justifyContent:'space-between' }}>
                    <Btn variant="ghost" onClick={() => { setImportPreview([]); setImportErrors([]) }}>
                      ← Indietro
                    </Btn>
                    <Btn variant="primary" onClick={confirmImport} disabled={importing || importPreview.length === 0}>
                      {importing ? 'Importazione…' : `Importa ${importPreview.length} iscritti`}
                    </Btn>
                  </div>
                </div>
              )}
            </>
          )}
        </Modal>
      )}
    </div>
  )
}

const s = {
  page: { width:'100%' },
  header: { display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'24px', flexWrap:'wrap', gap:'12px' },
  title: { fontSize:'32px', fontWeight:'900', color:'#0A0A0A', letterSpacing:'-0.03em', margin:0 },
  subtitle: { fontSize:'14px', color:'#6B7280', margin:'4px 0 0', fontWeight:'500' },
  filters: { display:'flex', gap:'12px', marginBottom:'16px', flexWrap:'wrap', alignItems:'center' },
  searchWrap: { position:'relative', flex:1, minWidth:'200px' },
  searchIcon: { position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' },
  searchInput: { width:'100%', padding:'9px 12px 9px 36px', border:'1px solid #D1D5DB', borderRadius:'4px', fontSize:'14px', fontFamily:"'Inter',sans-serif", outline:'none', boxSizing:'border-box' },
  statsRow: { display:'flex', gap:'12px', marginBottom:'16px', flexWrap:'wrap' },
  statCard: { backgroundColor:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:'6px', padding:'16px 20px', flex:1, minWidth:'110px', textAlign:'center' },
  statVal: (color) => ({ fontSize:'28px', fontWeight:'900', color, letterSpacing:'-0.03em', margin:'0 0 2px' }),
  statLabel: { fontSize:'12px', color:'#6B7280', margin:0, fontWeight:'500' },
  card: { backgroundColor:'#FFFFFF', borderRadius:'6px', border:'1px solid #E5E7EB', overflow:'hidden' },
  table: { width:'100%', borderCollapse:'collapse', fontSize:'14px' },
  th: { padding:'10px 20px', textAlign:'left', fontSize:'11px', fontWeight:'600', color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:'1px solid #E5E7EB', whiteSpace:'nowrap', backgroundColor:'#FAFAFA' },
  tr: { transition:'background-color 0.1s' },
  td: { padding:'14px 20px', borderBottom:'1px solid #F3F4F6', verticalAlign:'middle' },
  name: { fontWeight:'600', color:'#0A0A0A', margin:'0 0 2px', letterSpacing:'-0.01em' },
  sub: { fontSize:'12px', color:'#6B7280', margin:0 },
  cell: { color:'#374151', fontSize:'14px' },
  iconBtn: { background:'none', border:'1px solid #E5E7EB', borderRadius:'4px', padding:'5px 7px', cursor:'pointer', color:'#6B7280', display:'flex', alignItems:'center' },
}
