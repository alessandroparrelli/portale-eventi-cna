import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useRole } from '../../hooks/useRole'
import { Modal, StatoBadge, Field, Input, Textarea, Select, Btn, EmptyState } from '../../components/ui'
import { Plus, CalendarDays, Pencil, Trash2, Copy, ExternalLink, Search } from 'lucide-react'

const EMPTY_EVENT = {
  titolo:'', slug:'', descrizione:'', data_inizio:'', data_fine:'',
  luogo:'', capienza_max:'', stato:'bozza',
}

function toSlug(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
}

function formatDt(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('it-IT', { day:'2-digit', month:'short', year:'numeric' })
}

export default function EventiPage() {
  const [events, setEvents] = useState([])
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStato, setFilterStato] = useState('tutti')
  const [modal, setModal] = useState(null) // null | 'create' | 'edit' | 'delete'
  const [current, setCurrent] = useState(EMPTY_EVENT)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const { canWrite, canDelete } = useRole()
  const navigate = useNavigate()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [{ data: evs }, { data: regs }] = await Promise.all([
      supabase.from('events').select('*').order('created_at', { ascending: false }),
      supabase.from('registrations').select('event_id, presente'),
    ])
    setEvents(evs || [])
    const c = {}
    ;(regs || []).forEach(r => {
      if (!c[r.event_id]) c[r.event_id] = { total: 0, presenti: 0 }
      c[r.event_id].total++
      if (r.presente) c[r.event_id].presenti++
    })
    setCounts(c)
    setLoading(false)
  }

  function openCreate() { setCurrent({ ...EMPTY_EVENT }); setErrors({}); setModal('create') }
  function openEdit(ev) { setCurrent({ ...ev, data_inizio: ev.data_inizio?.slice(0,16)||'', data_fine: ev.data_fine?.slice(0,16)||'', capienza_max: ev.capienza_max||'' }); setErrors({}); setModal('edit') }
  function openDelete(ev) { setCurrent(ev); setModal('delete') }

  function validate() {
    const e = {}
    if (!current.titolo.trim()) e.titolo = 'Campo obbligatorio'
    if (!current.slug.trim()) e.slug = 'Campo obbligatorio'
    return e
  }

  async function saveEvent() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true)
    const payload = {
      titolo: current.titolo.trim(),
      slug: current.slug.trim(),
      descrizione: current.descrizione || null,
      data_inizio: current.data_inizio || null,
      data_fine: current.data_fine || null,
      luogo: current.luogo || null,
      capienza_max: current.capienza_max ? parseInt(current.capienza_max) : null,
      stato: current.stato,
    }
    if (modal === 'create') {
      const { error } = await supabase.from('events').insert(payload)
      if (error) { setErrors({ general: error.message }); setSaving(false); return }
    } else {
      const { error } = await supabase.from('events').update(payload).eq('id', current.id)
      if (error) { setErrors({ general: error.message }); setSaving(false); return }
    }
    setSaving(false)
    setModal(null)
    loadData()
  }

  async function deleteEvent() {
    setSaving(true)
    await supabase.from('events').delete().eq('id', current.id)
    setSaving(false)
    setModal(null)
    loadData()
  }

  async function duplicateEvent(ev) {
    const { id, created_at, ...rest } = ev
    const newSlug = rest.slug + '-copia-' + Date.now().toString(36)
    await supabase.from('events').insert({ ...rest, titolo: rest.titolo + ' (copia)', slug: newSlug, stato: 'bozza' })
    loadData()
  }

  const filtered = events.filter(ev => {
    const matchSearch = !search || ev.titolo.toLowerCase().includes(search.toLowerCase()) || ev.slug.includes(search.toLowerCase())
    const matchStato = filterStato === 'tutti' || ev.stato === filterStato
    return matchSearch && matchStato
  })

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Gestione Eventi</h1>
          <p style={s.subtitle}>{events.length} eventi totali</p>
        </div>
        {canWrite && (
          <Btn onClick={openCreate} size="md">
            <Plus size={18}/> Nuovo evento
          </Btn>
        )}
      </div>

      {/* Filtri */}
      <div style={s.filters}>
        <div style={s.searchWrap}>
          <Search size={16} style={s.searchIcon} />
          <input
            value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Cerca per titolo o slug…"
            style={s.searchInput}
          />
        </div>
        <Select value={filterStato} onChange={e=>setFilterStato(e.target.value)}>
          <option value="tutti">Tutti gli stati</option>
          <option value="bozza">Bozza</option>
          <option value="pubblicato">Pubblicato</option>
          <option value="chiuso">Chiuso</option>
          <option value="archiviato">Archiviato</option>
        </Select>
      </div>

      {/* Tabella */}
      <div style={s.card}>
        {loading ? (
          <div style={{ padding:'48px', textAlign:'center', color:'#9CA3AF', fontSize:'14px' }}>Caricamento…</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={CalendarDays} title="Nessun evento trovato"
            desc={search ? 'Prova con un termine diverso' : 'Crea il primo evento per iniziare'}
            action={canWrite ? <Btn onClick={openCreate}><Plus size={16}/>Crea evento</Btn> : null} />
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['Evento','Data','Luogo','Stato','Iscritti','Presenti','Azioni'].map(h=>(
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(ev => (
                  <tr key={ev.id} style={s.tr}
                    onMouseEnter={e=>e.currentTarget.style.backgroundColor='#F9FAFB'}
                    onMouseLeave={e=>e.currentTarget.style.backgroundColor='transparent'}>
                    <td style={s.td}>
                      <p style={s.evTitle}>{ev.titolo}</p>
                      <p style={s.evSlug}>/{ev.slug}</p>
                    </td>
                    <td style={s.td}><span style={s.cell}>{formatDt(ev.data_inizio)}</span></td>
                    <td style={s.td}><span style={{...s.cell, maxWidth:'160px', display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{ev.luogo||'—'}</span></td>
                    <td style={s.td}><StatoBadge stato={ev.stato}/></td>
                    <td style={s.td}>
                      <span style={s.cell}>{counts[ev.id]?.total||0}
                        {ev.capienza_max ? <span style={{color:'#9CA3AF'}}>/{ev.capienza_max}</span> : null}
                      </span>
                    </td>
                    <td style={s.td}><span style={s.cell}>{counts[ev.id]?.presenti||0}</span></td>
                    <td style={s.td}>
                      <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
                        <button style={s.iconBtn} title="Iscritti" onClick={()=>navigate(`/admin/iscritti?evento=${ev.id}`)}>
                          <ExternalLink size={15}/>
                        </button>
                        {canWrite && <>
                          <button style={s.iconBtn} title="Modifica" onClick={()=>openEdit(ev)}>
                            <Pencil size={15}/>
                          </button>
                          <button style={s.iconBtn} title="Duplica" onClick={()=>duplicateEvent(ev)}>
                            <Copy size={15}/>
                          </button>
                        </>}
                        {canDelete && (
                          <button style={{...s.iconBtn, color:'#DC2626'}} title="Elimina" onClick={()=>openDelete(ev)}>
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

      {/* MODAL CREATE/EDIT */}
      {(modal==='create'||modal==='edit') && (
        <Modal title={modal==='create'?'Nuovo evento':'Modifica evento'} onClose={()=>setModal(null)} width="640px">
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            {errors.general && <div style={s.errBox}>{errors.general}</div>}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
              <div style={{ gridColumn:'1/-1' }}>
                <Field label="Titolo evento" required error={errors.titolo}>
                  <Input value={current.titolo} onChange={e=>{
                    const v=e.target.value
                    setCurrent(p=>({...p, titolo:v, slug: modal==='create'?toSlug(v):p.slug}))
                    setErrors(p=>({...p,titolo:''}))
                  }} placeholder="es. Convegno Artigianato Roma 2026"/>
                </Field>
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <Field label="Slug URL" required error={errors.slug}>
                  <Input value={current.slug} onChange={e=>{setCurrent(p=>({...p,slug:toSlug(e.target.value)}));setErrors(p=>({...p,slug:''}))}}
                    placeholder="convegno-artigianato-roma-2026"/>
                </Field>
              </div>
              <Field label="Data inizio">
                <Input type="datetime-local" value={current.data_inizio} onChange={e=>setCurrent(p=>({...p,data_inizio:e.target.value}))}/>
              </Field>
              <Field label="Data fine">
                <Input type="datetime-local" value={current.data_fine} onChange={e=>setCurrent(p=>({...p,data_fine:e.target.value}))}/>
              </Field>
              <div style={{ gridColumn:'1/-1' }}>
                <Field label="Luogo / Sede">
                  <Input value={current.luogo} onChange={e=>setCurrent(p=>({...p,luogo:e.target.value}))} placeholder="es. Palazzo dei Congressi, Roma"/>
                </Field>
              </div>
              <Field label="Capienza massima">
                <Input type="number" value={current.capienza_max} onChange={e=>setCurrent(p=>({...p,capienza_max:e.target.value}))} placeholder="Lascia vuoto = illimitata"/>
              </Field>
              <Field label="Stato">
                <Select value={current.stato} onChange={e=>setCurrent(p=>({...p,stato:e.target.value}))}>
                  <option value="bozza">Bozza</option>
                  <option value="pubblicato">Pubblicato</option>
                  <option value="chiuso">Chiuso</option>
                  <option value="archiviato">Archiviato</option>
                </Select>
              </Field>
              <div style={{ gridColumn:'1/-1' }}>
                <Field label="Descrizione">
                  <Textarea value={current.descrizione||''} onChange={e=>setCurrent(p=>({...p,descrizione:e.target.value}))}
                    placeholder="Descrizione dell'evento…" rows={3}/>
                </Field>
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:'10px', marginTop:'8px' }}>
              <Btn variant="ghost" onClick={()=>setModal(null)}>Annulla</Btn>
              <Btn onClick={saveEvent} disabled={saving}>{saving?'Salvataggio…':modal==='create'?'Crea evento':'Salva modifiche'}</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL DELETE */}
      {modal==='delete' && (
        <Modal title="Elimina evento" onClose={()=>setModal(null)} width="440px">
          <p style={{ fontSize:'14px', color:'#374151', marginBottom:'8px' }}>
            Sei sicuro di voler eliminare <strong>«{current.titolo}»</strong>?
          </p>
          <p style={{ fontSize:'13px', color:'#DC2626', marginBottom:'24px' }}>
            Questa operazione eliminerà anche tutti gli iscritti e i dati correlati. Non è reversibile.
          </p>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:'10px' }}>
            <Btn variant="ghost" onClick={()=>setModal(null)}>Annulla</Btn>
            <Btn variant="danger" onClick={deleteEvent} disabled={saving}>{saving?'Eliminazione…':'Elimina definitivamente'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

const s = {
  page: { maxWidth:'1100px' },
  header: { display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'24px', flexWrap:'wrap', gap:'12px' },
  title: { fontSize:'32px', fontWeight:'900', color:'#0A0A0A', letterSpacing:'-0.03em', margin:0 },
  subtitle: { fontSize:'14px', color:'#6B7280', margin:'4px 0 0', fontWeight:'500' },
  filters: { display:'flex', gap:'12px', marginBottom:'20px', flexWrap:'wrap' },
  searchWrap: { position:'relative', flex:1, minWidth:'220px' },
  searchIcon: { position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' },
  searchInput: { width:'100%', padding:'9px 12px 9px 36px', border:'1px solid #D1D5DB', borderRadius:'4px',
    fontSize:'14px', fontFamily:"'Inter',sans-serif", outline:'none', boxSizing:'border-box' },
  card: { backgroundColor:'#FFFFFF', borderRadius:'6px', border:'1px solid #E5E7EB', overflow:'hidden' },
  table: { width:'100%', borderCollapse:'collapse', fontSize:'14px' },
  th: { padding:'10px 20px', textAlign:'left', fontSize:'11px', fontWeight:'600', color:'#6B7280',
    textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:'1px solid #E5E7EB',
    whiteSpace:'nowrap', backgroundColor:'#FAFAFA' },
  tr: { transition:'background-color 0.1s' },
  td: { padding:'14px 20px', borderBottom:'1px solid #F3F4F6', verticalAlign:'middle' },
  evTitle: { fontWeight:'600', color:'#0A0A0A', margin:'0 0 2px', letterSpacing:'-0.01em' },
  evSlug: { fontSize:'12px', color:'#9CA3AF', margin:0, fontFamily:'monospace' },
  cell: { color:'#374151', fontSize:'14px' },
  iconBtn: { background:'none', border:'1px solid #E5E7EB', borderRadius:'4px', padding:'5px 7px',
    cursor:'pointer', color:'#6B7280', display:'flex', alignItems:'center' },
  errBox: { backgroundColor:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'4px',
    padding:'10px 14px', fontSize:'14px', color:'#DC2626' },
}
