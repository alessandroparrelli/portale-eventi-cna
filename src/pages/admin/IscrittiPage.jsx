import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useRole } from '../../hooks/useRole'
import { Modal, PresenzaBadge, Field, Input, Select, Btn, EmptyState } from '../../components/ui'
import { Users, Search, Download, Eye, Trash2, UserCheck } from 'lucide-react'
import * as XLSX from 'xlsx'

function formatDt(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('it-IT', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
}

export default function IscrittiPage() {
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

  useEffect(() => {
    supabase.from('events').select('id,titolo,slug').order('data_inizio',{ascending:false}).then(({data})=>setEventi(data||[]))
    supabase.from('mestieri').select('id,nome').then(({data})=>setMestieri(data||[]))
  }, [])

  useEffect(() => {
    if (!selectedEvento) { setRegistrations([]); return }
    loadRegs()
  }, [selectedEvento])

  async function loadRegs() {
    setLoading(true)
    const { data } = await supabase.from('registrations')
      .select('*').eq('event_id', selectedEvento).order('created_at',{ascending:false})
    setRegistrations(data||[])
    setLoading(false)
  }

  function getMestiere(id) { return mestieri.find(m=>m.id===id)?.nome || '—' }

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

  function exportExcel() {
    const eventoTitle = eventi.find(e=>e.id===selectedEvento)?.titolo || 'evento'
    const rows = filtered.map(r => ({
      'ID': r.id,
      'Data iscrizione': formatDt(r.created_at),
      'Stato': r.stato,
      'Presente': r.presente ? 'Sì' : 'No',
      'Check-in': formatDt(r.checkin_at),
      'Nome': r.nome||'',
      'Cognome': r.cognome||'',
      'Ragione Sociale': r.ragione_sociale||'',
      'P.IVA': r.partita_iva||'',
      'Cellulare': r.cellulare||'',
      'Email': r.email||'',
      'Mestiere': getMestiere(r.mestiere_id),
      'CAP': r.cap||'',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Iscritti')
    XLSX.writeFile(wb, `iscritti-${eventoTitle.toLowerCase().replace(/\s+/g,'-')}.xlsx`)
  }

  const totPresenti = registrations.filter(r=>r.presente).length
  const totConfermati = registrations.filter(r=>r.stato==='confermato').length

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Iscritti</h1>
          <p style={s.subtitle}>{selectedEvento ? `${registrations.length} iscritti · ${totPresenti} presenti · ${totConfermati} confermati` : 'Seleziona un evento'}</p>
        </div>
        {selectedEvento && (
          <div style={{ display:'flex', gap:'10px' }}>
            <Btn variant="secondary" onClick={exportExcel} size="md">
              <Download size={16}/> Esporta Excel
            </Btn>
          </div>
        )}
      </div>

      {/* Selettore evento + filtri */}
      <div style={s.filters}>
        <Select value={selectedEvento} onChange={e=>setSelectedEvento(e.target.value)} style={{ minWidth:'280px' }}>
          <option value="">— Seleziona evento —</option>
          {eventi.map(ev=><option key={ev.id} value={ev.id}>{ev.titolo}</option>)}
        </Select>
        {selectedEvento && <>
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
        </>}
      </div>

      {/* Stats cards */}
      {selectedEvento && (
        <div style={s.statsRow}>
          {[
            { label:'Totale iscritti', val: registrations.length, color:'#003DA5' },
            { label:'Presenti', val: totPresenti, color:'#16A34A' },
            { label:'Confermati', val: totConfermati, color:'#2563EB' },
            { label:'Walk-in', val: registrations.filter(r=>r.stato==='walk-in').length, color:'#7C3AED' },
            { label:'Assenti', val: registrations.filter(r=>r.stato==='assente').length, color:'#DC2626' },
          ].map(stat=>(
            <div key={stat.label} style={s.statCard}>
              <p style={s.statVal(stat.color)}>{stat.val}</p>
              <p style={s.statLabel}>{stat.label}</p>
            </div>
          ))}
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
          <div style={{ overflowX:'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['Nominativo','Email','Mestiere','Iscritto il','Stato','Azioni'].map(h=>(
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(r=>(
                  <tr key={r.id} style={s.tr}
                    onMouseEnter={e=>e.currentTarget.style.backgroundColor='#F9FAFB'}
                    onMouseLeave={e=>e.currentTarget.style.backgroundColor='transparent'}>
                    <td style={s.td}>
                      <p style={s.name}>{r.nome} {r.cognome}</p>
                      {r.ragione_sociale && <p style={s.sub}>{r.ragione_sociale}</p>}
                    </td>
                    <td style={s.td}><span style={s.cell}>{r.email||'—'}</span></td>
                    <td style={s.td}><span style={s.cell}>{getMestiere(r.mestiere_id)}</span></td>
                    <td style={s.td}><span style={s.cell}>{formatDt(r.created_at)}</span></td>
                    <td style={s.td}><PresenzaBadge stato={r.stato}/></td>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DETTAGLIO */}
      {detail && (
        <Modal title="Dettaglio iscritto" onClose={()=>setDetail(null)} width="520px">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
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
    </div>
  )
}

const s = {
  page: { maxWidth:'1200px' },
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
