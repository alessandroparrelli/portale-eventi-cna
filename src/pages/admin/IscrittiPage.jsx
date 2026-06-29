import { useEffect, useState, useRef } from 'react'
import { usePageTitle } from '../../hooks/usePageTitle'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useRole } from '../../hooks/useRole'
import GlowTableHead from '../../components/GlowTableHead'
import GlowStatCard from '../../components/GlowStatCard'
import { Modal, PresenzaBadge, Field, Input, Select, Btn, EmptyState } from '../../components/ui'
import { Users, Search, Download, Upload, Eye, Trash2, UserCheck, AlertCircle, CheckCircle2, X } from 'lucide-react'
import * as XLSX from 'xlsx'
import EventSelector from '../../components/EventSelector'

function formatDt(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('it-IT', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
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
  const [delConfirm, setDelConfirm] = useState(null)
  const { canDelete } = useRole()
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

  function toggleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
    setPagina(1)
  }

  async function verificaAssociati() {
    if (!registrations.length) return
    setVerificaInCorso(true)
    setVerificaInfo(null)
    try {
      // Prendi tutte le P.IVA non vuote degli iscritti
      const pive = [...new Set(
        registrations
          .map(r => (r.partita_iva || '').toString().trim())
          .filter(p => p.length >= 5)
      )]
      if (!pive.length) { setVerificaInfo({ trovati: 0, cercati: 0, errore: 'Nessuna P.IVA presente tra gli iscritti' }); setVerificaInCorso(false); return }
      const res = await fetch('https://hnkhckcclgabunkqfmrz.supabase.co/functions/v1/verifica-associati', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partite_iva: pive })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const newMap = data.associati || {}
      setAssociatiMap(newMap)
      setVerificaEseguita(true)
      setVerificaInfo({ trovati: data.trovati, cercati: data.cercati })
      // Persiste su localStorage — sopravvive a refresh e navigazione
      try {
        localStorage.setItem(`associati_${selectedEvento}`, JSON.stringify({
          map: newMap,
          ts: new Date().toISOString(),
        }))
      } catch {}
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

  useEffect(() => {
    supabase.from('events').select('id,titolo,slug').order('data_inizio',{ascending:false}).then(({data})=>setEventi(data||[]))
    supabase.from('mestieri').select('id,nome').then(({data})=>setMestieri(data||[]))
  }, [])

  useEffect(() => {
    if (!selectedEvento) { setRegistrations([]); return }
    loadRegs()
  }, [selectedEvento])

  // Carica dati verifica dal localStorage quando cambia evento
  useEffect(() => {
    setVerificaInfo(null)
    if (!selectedEvento) {
      setAssociatiMap({})
      setVerificaEseguita(false)
      return
    }
    try {
      const saved = localStorage.getItem(`associati_${selectedEvento}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        setAssociatiMap(parsed.map || {})
        setVerificaEseguita(true)
      } else {
        setAssociatiMap({})
        setVerificaEseguita(false)
      }
    } catch {
      setAssociatiMap({})
      setVerificaEseguita(false)
    }
  }, [selectedEvento])

  async function loadRegs() {
    setLoading(true)
    const { data } = await supabase.from('registrations')
      .select('*').eq('event_id', selectedEvento).order('created_at',{ascending:false})
    setRegistrations(data||[])
    setLoading(false)
  }

  function getMestiere(id) { return mestieri.find(m=>m.id===id)?.nome || '—' }

  // Reset pagina su cambio filtri
  useEffect(() => { setPagina(1) }, [selectedEvento, search, filterStato, filterPresente])

  const filtered = registrations.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = !q || r.nome?.toLowerCase().includes(q) || r.cognome?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q)
    const matchStato = filterStato==='tutti' || r.stato===filterStato
    return matchSearch && matchStato
  })

  async function deleteReg() {
    await supabase.from('registrations').delete().eq('id', delConfirm.id)
    setDelConfirm(null)
    loadRegs()
  }

  function getAssLabel(r) {
    if (!verificaEseguita) return ''
    const p = (r.partita_iva||'').toString().replace(/\s/g,'').replace(/^0+/,'')
    if (!p) return 'P.IVA assente'
    const a = associatiMap[p]
    if (!a) return 'Non trovato'
    return a.associato ? 'Associato' : 'Disdetto'
  }

  function exportExcel() {
    const eventoTitle = eventi.find(e=>e.id===selectedEvento)?.titolo || 'evento'
    // Colori Excel ARGB
    const XC = {
      assoc:    { fill:'FFF0FDF4', font:'FF15803D', brd:'FFD1FAE5' },
      disdetto: { fill:'FFFEF2F2', font:'FFDC2626', brd:'FFFECACA' },
      notFound: { fill:'FFF1F5F9', font:'FF64748B', brd:'FFE2E8F0' },
      noPiva:   { fill:'FFFFF7ED', font:'FFEA580C', brd:'FFFED7AA' },
      header:   { fill:'FF003DA5', font:'FFFFFFFF' },
    }
    function getXC(r) {
      if (!verificaEseguita) return null
      const p = (r.partita_iva||'').toString().replace(/\s/g,'').replace(/^0+/,'')
      if (!p) return XC.noPiva
      const a = associatiMap[p]
      if (!a) return XC.notFound
      return a.associato ? XC.assoc : XC.disdetto
    }

    const cols = ['Nome','Cognome','Ragione Sociale','P.IVA','Email','Cellulare',
      'Mestiere','CAP','Stato','Presente','Check-in','Data iscrizione',
      ...(verificaEseguita ? ['Associato CNA','Data stipula'] : [])]

    const rows = filtered.map(r => {
      const piva = (r.partita_iva||'').toString().replace(/\s/g,'').replace(/^0+/,'')
      const ass = associatiMap[piva]
      const base = {
        'Nome':r.nome||'', 'Cognome':r.cognome||'', 'Ragione Sociale':r.ragione_sociale||'',
        'P.IVA':r.partita_iva||'', 'Email':r.email||'', 'Cellulare':r.cellulare||'',
        'Mestiere':getMestiere(r.mestiere_id), 'CAP':r.cap||'',
        'Stato':r.stato, 'Presente':r.presente?'Sì':'No',
        'Check-in':formatDt(r.checkin_at), 'Data iscrizione':formatDt(r.created_at),
      }
      if (verificaEseguita) {
        base['Associato CNA'] = getAssLabel(r)
        base['Data stipula'] = ass?.datastipula||''
      }
      return base
    })

    const ws = XLSX.utils.json_to_sheet(rows, { header: cols })
    const wb = XLSX.utils.book_new()

    // Larghezze colonne
    ws['!cols'] = cols.map(col =>
      ({ wch: col==='Ragione Sociale'?42 : col==='Email'?32 : col==='P.IVA'?14 :
              col==='Associato CNA'?16 : col==='Data stipula'?14 : col==='Nome'||col==='Cognome'?20 : 16 }))

    const range = XLSX.utils.decode_range(ws['!ref'])
    // Header row
    for (let ci = range.s.c; ci <= range.e.c; ci++) {
      const cell = ws[XLSX.utils.encode_cell({r:0,c:ci})]
      if (cell) cell.s = {
        fill:{patternType:'solid',fgColor:{rgb:XC.header.fill}},
        font:{bold:true,color:{rgb:XC.header.font},sz:11},
        alignment:{horizontal:'center',vertical:'center',wrapText:false},
        border:{bottom:{style:'medium',color:{rgb:'FF1E3A8A'}}}
      }
    }
    // Righe dati
    filtered.forEach((r, ri) => {
      const xc = getXC(r)
      if (!xc) return
      const assColI = cols.indexOf('Associato CNA')
      for (let ci = range.s.c; ci <= range.e.c; ci++) {
        const addr = XLSX.utils.encode_cell({r:ri+1,c:ci})
        if (!ws[addr]) ws[addr] = {t:'s',v:''}
        ws[addr].s = {
          fill:{patternType:'solid',fgColor:{rgb:xc.fill}},
          font:{color:{rgb:xc.font},sz:10,
            bold: ci===assColI},
          border:{
            top:{style:'thin',color:{rgb:xc.brd}},
            bottom:{style:'thin',color:{rgb:xc.brd}},
            left:{style:'thin',color:{rgb:'FFF3F4F6'}},
            right:{style:'thin',color:{rgb:'FFF3F4F6'}},
          },
          alignment:{vertical:'center'}
        }
      }
    })

    ws['!freeze'] = {xSplit:0,ySplit:1,topLeftCell:'A2',activePane:'bottomLeft',state:'frozen'}
    XLSX.utils.book_append_sheet(wb, ws, 'Iscritti')
    XLSX.writeFile(wb, `iscritti-${eventoTitle.toLowerCase().replace(/\s+/g,'-')}.xlsx`)
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
    if (ok > 0) loadRegs()
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
          <Btn variant="primary" onClick={verificaAssociati} disabled={verificaInCorso} size="md"
            title="Incrocia P.IVA degli iscritti con la tabella associati CNA">
            {verificaInCorso
              ? <><span style={{animation:'spin 1s linear infinite',display:'inline-block'}}>⏳</span> Verifica in corso…</>
              : '🔍 Verifica associati CNA'}
          </Btn>
          {verificaEseguita && (
            <span style={{fontSize:'12px',color:'#059669',fontWeight:'600'}}>
              ✓ {Object.keys(associatiMap).length} trovati
              {(() => {
                try {
                  const s = localStorage.getItem(`associati_${selectedEvento}`)
                  if (s) {
                    const d = JSON.parse(s).ts
                    return d ? <span style={{color:'#9CA3AF',fontWeight:'400',marginLeft:'6px'}}>
                      · aggiornato {new Date(d).toLocaleDateString('it-IT')} {new Date(d).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})}
                    </span> : null
                  }
                } catch {}
                return null
              })()}
            </span>
          )}
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

      {selectedEvento && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:'10px', marginBottom:'16px' }} className="stat-grid-auto">
          <GlowStatCard icon="users"     label="Tot. iscritti" value={registrations.length}                                    palette="blue"/>
          <GlowStatCard icon="check"     label="Presenti"      value={totPresenti}                                              palette="green"/>
          <GlowStatCard icon="trending"  label="Confermati"    value={totConfermati}                                            palette="cyan"/>
          <GlowStatCard icon="usercheck" label="Walk-in"       value={registrations.filter(r=>r.stato==='walk-in').length}     palette="violet"/>
          <GlowStatCard icon="userx"     label="Assenti"       value={registrations.filter(r=>r.stato==='assente').length}     palette="red"/>
        </div>
      )}

      {/* Tabella */}
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
                    { label:'Iscritto il', color:'amber',   sortable:true, hideOnMobile:true },
                    { label:'Stato',       color:'green',   sortable:true },
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
                        </td>
                        <td style={s.td} className="col-hide-mobile"><span style={s.cell}>{r.email||'—'}</span></td>
                        <td style={s.td} className="col-hide-mobile"><span style={s.cell}>{getMestiere(r.mestiere_id)}</span></td>
                        <td style={s.td} className="col-hide-mobile"><span style={s.cell}>{formatDt(r.created_at)}</span></td>
                        <td style={s.td}><PresenzaBadge stato={r.stato}/></td>
                        {verificaEseguita && <>
                          <td style={s.td} className="col-hide-mobile">
                            {!_piva
                              ? <span style={{fontSize:'11px',fontWeight:'700',color:'#EA580C',backgroundColor:'#FFF7ED',padding:'3px 10px',borderRadius:'999px'}}>⚠ P.IVA assente</span>
                              : !_ass
                                ? <span style={{fontSize:'11px',fontWeight:'700',color:'#64748B',backgroundColor:'#F1F5F9',padding:'3px 10px',borderRadius:'999px'}}>◌ Non trovato</span>
                                : _ass.associato
                                  ? <span style={{fontSize:'11px',fontWeight:'700',color:'#15803D',backgroundColor:'#F0FDF4',padding:'3px 10px',borderRadius:'999px'}}>✓ Associato</span>
                                  : <span style={{fontSize:'11px',fontWeight:'700',color:'#DC2626',backgroundColor:'#FEF2F2',padding:'3px 10px',borderRadius:'999px'}}>✗ Disdetto</span>
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
                  {bg:'#FEF2F2',color:'#DC2626',label:'✗ Disdetto'},
                  {bg:'#F1F5F9',color:'#64748B',label:'◌ Non trovato in archivio'},
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
