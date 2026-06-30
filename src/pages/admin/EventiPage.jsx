import { useEffect, useRef, useState } from 'react'
import { usePageTitle } from '../../hooks/usePageTitle'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useRole } from '../../hooks/useRole'
import { logAttivita } from '../../lib/activityLog'
import { Modal, StatoBadge, Field, Input, Textarea, Select, Btn, EmptyState } from '../../components/ui'
import ImageUploader from '../../components/editor/ImageUploader'
import GlowTabBar from '../../components/GlowTabBar'
import GlowTableHead from '../../components/GlowTableHead'
import {
  Plus, CalendarDays, Pencil, Trash2, Copy, ExternalLink, Search,
  Link2, ClipboardCheck, Globe, Image, X, ChevronDown, ChevronUp,
  Wand2, Loader2, AlignLeft, AlignCenter, SlidersHorizontal, Hash, Users
} from 'lucide-react'

const EMPTY = {
  titolo:'', slug:'', descrizione:'', data_inizio:'', data_fine:'',
  luogo:'', capienza_max:'', stato:'bozza', immagine_hero:null,
  colore_primario:'#003DA5', colore_sfondo:'#F4F5F7',
  layout_hero:{ altezza:'340', overlay_opacita:'55', allineamento:'sinistra' },
}

const toSlug = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')

const fmtDt = ts => ts
  ? new Date(ts).toLocaleDateString('it-IT',{day:'2-digit',month:'short',year:'numeric'})
  : '—'

/* ImageUploader → components/editor/ImageUploader.jsx */

/* ─── Editor modale ───────────────────────────────────────────── */
function EventEditor({ modal, cur, setCur, onSave, onClose, saving, errors }) {
  const [tab, setTab] = useState('info') // info | aspetto | hero | avanzato

  const set = k => v => setCur(p => ({...p, [k]: typeof v==='string' ? v : v?.target?.value}))
  const setH = k => v => setCur(p => ({...p, layout_hero:{...p.layout_hero, [k]: typeof v==='string'?v:v?.target?.value}}))

  const TABS = [
    { id:'info',    label:'Info',    icon:'📋', color:'blue'   },
    { id:'hero',    label:'Hero',    icon:'🖼',  color:'cyan'   },
    { id:'aspetto', label:'Aspetto', icon:'🎨', color:'violet' },
    { id:'avanzato',label:'Avanzato',icon:'⚙',  color:'amber'  },
  ]

  return (
    <Modal title={modal==='create'?'Crea evento':'Modifica evento'} onClose={onClose} width="720px">
      <GlowTabBar active={tab} onChange={setTab} tabs={TABS} />

      {errors.general && <div style={ee.errBox}>{errors.general}</div>}

      <div style={{ padding:'20px 0', minHeight:'340px' }}>

        {/* ── TAB: Info ── */}
        {tab==='info' && (
          <div style={ee.grid2}>
            <div style={{ gridColumn:'1/-1' }}>
              <Field label="Titolo evento" required error={errors.titolo}>
                <Input value={cur.titolo} onChange={e=>{
                  const v=e.target.value
                  setCur(p=>({...p,titolo:v,slug:modal==='create'?toSlug(v):p.slug}))
                }} placeholder="es. Convegno Artigianato Roma 2026"/>
              </Field>
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <Field label="Slug URL" required error={errors.slug}>
                <div style={{ position:'relative' }}>
                  <span style={ee.slugPfx}>/eventi/</span>
                  <Input value={cur.slug}
                    onChange={e=>setCur(p=>({...p,slug:toSlug(e.target.value)}))}
                    placeholder="convegno-artigianato-roma-2026"
                    style={{ paddingLeft:'70px' }}/>
                </div>
              </Field>
            </div>
            <Field label="Data e ora inizio">
              <Input type="datetime-local" value={cur.data_inizio||''} onChange={set('data_inizio')}/>
            </Field>
            <Field label="Data e ora fine">
              <Input type="datetime-local" value={cur.data_fine||''} onChange={set('data_fine')}/>
            </Field>
            <div style={{ gridColumn:'1/-1' }}>
              <Field label="Sede / Indirizzo completo">
                <Input value={cur.luogo||''} onChange={set('luogo')}
                  placeholder="es. Palazzo dei Congressi, Piazza J.F. Kennedy 1, Roma"/>
              </Field>
            </div>
            <Field label="Capienza massima">
              <Input type="number" value={cur.capienza_max||''} onChange={set('capienza_max')} placeholder="Illimitata"/>
            </Field>
            <Field label="Stato">
              <Select value={cur.stato} onChange={set('stato')}>
                <option value="bozza">📝 Bozza</option>
                <option value="pubblicato">🟢 Pubblicato</option>
                <option value="chiuso">🔴 Chiuso</option>
                <option value="archiviato">📦 Archiviato</option>
              </Select>
            </Field>
            <div style={{ gridColumn:'1/-1' }}>
              <Field label="Descrizione">
                <Textarea value={cur.descrizione||''} onChange={set('descrizione')}
                  placeholder="Descrivi l'evento…&#10;Puoi usare più paragrafi." rows={5}/>
              </Field>
            </div>
          </div>
        )}

        {/* ── TAB: Hero ── */}
        {tab==='hero' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
            <Field label="Immagine di sfondo hero">
              <ImageUploader value={cur.immagine_hero} onChange={url=>setCur(p=>({...p,immagine_hero:url}))}/>
            </Field>

            <div style={ee.grid3}>
              <Field label="Altezza hero (px)">
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <input type="range" min="200" max="600" step="20"
                    value={cur.layout_hero?.altezza||'340'}
                    onChange={e=>setH('altezza')(e.target.value)}
                    style={{ flex:1 }}/>
                  <span style={{ fontSize:'13px', color:'#374151', width:'44px', fontWeight:'600' }}>
                    {cur.layout_hero?.altezza||'340'}px
                  </span>
                </div>
              </Field>
              <Field label="Opacità overlay">
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <input type="range" min="0" max="90" step="5"
                    value={cur.layout_hero?.overlay_opacita||'55'}
                    onChange={e=>setH('overlay_opacita')(e.target.value)}
                    style={{ flex:1 }}/>
                  <span style={{ fontSize:'13px', color:'#374151', width:'36px', fontWeight:'600' }}>
                    {cur.layout_hero?.overlay_opacita||'55'}%
                  </span>
                </div>
              </Field>
              <Field label="Allineamento testo">
                <div style={{ display:'flex', gap:'8px' }}>
                  {['sinistra','centro'].map(a=>(
                    <button key={a} onClick={()=>setH('allineamento')(a)}
                      style={{ flex:1, padding:'8px', border:`1px solid ${cur.layout_hero?.allineamento===a?'#003DA5':'#E5E7EB'}`,
                        borderRadius:'6px', backgroundColor: cur.layout_hero?.allineamento===a?'#EEF3FF':'#FFFFFF',
                        cursor:'pointer', fontSize:'12px', fontWeight:'600', color: cur.layout_hero?.allineamento===a?'#003DA5':'#6B7280',
                        fontFamily:"'Inter',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:'4px' }}>
                      {a==='sinistra' ? <AlignLeft size={14}/> : <AlignCenter size={14}/>} {a}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            {/* Anteprima */}
            <div>
              <p style={{ fontSize:'12px', fontWeight:'600', color:'#6B7280', textTransform:'uppercase', letterSpacing:'.06em', margin:'0 0 8px' }}>Anteprima hero</p>
              <div style={{
                borderRadius:'8px', overflow:'hidden', border:'1px solid #E5E7EB',
                height: `${Math.min(200, parseInt(cur.layout_hero?.altezza||'340')/1.7)}px`,
                backgroundImage: cur.immagine_hero ? `url(${cur.immagine_hero})` : undefined,
                background: cur.immagine_hero ? undefined : 'linear-gradient(135deg,#003DA5,#001a50)',
                backgroundSize:'cover', backgroundPosition:'center', position:'relative', display:'flex', alignItems:'flex-end'
              }}>
                <div style={{ padding:'16px 20px', background:`rgba(0,0,0,${(cur.layout_hero?.overlay_opacita||55)/100})`,
                  width:'100%', textAlign: cur.layout_hero?.allineamento==='centro' ? 'center' : 'left' }}>
                  <p style={{ color:'rgba(255,255,255,.7)', fontSize:'10px', fontWeight:'600', textTransform:'uppercase', margin:'0 0 4px' }}>Evento CNA Roma</p>
                  <p style={{ color:'#FFFFFF', fontSize:'16px', fontWeight:'900', margin:0, letterSpacing:'-.02em' }}>
                    {cur.titolo || 'Titolo evento'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: Aspetto ── */}
        {tab==='aspetto' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
            <div style={ee.grid2}>
              <Field label="Colore primario">
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <input type="color" value={cur.colore_primario||'#003DA5'}
                    onChange={e=>setCur(p=>({...p,colore_primario:e.target.value}))}
                    style={{ width:'44px', height:'38px', border:'1px solid #D1D5DB', borderRadius:'6px', cursor:'pointer', padding:'2px' }}/>
                  <div style={{ flex:1 }}>
                    <Input value={cur.colore_primario||'#003DA5'}
                      onChange={e=>setCur(p=>({...p,colore_primario:e.target.value}))}
                      placeholder="#003DA5"/>
                  </div>
                </div>
              </Field>
              <Field label="Colore sfondo sezioni">
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <input type="color" value={cur.colore_sfondo||'#F4F5F7'}
                    onChange={e=>setCur(p=>({...p,colore_sfondo:e.target.value}))}
                    style={{ width:'44px', height:'38px', border:'1px solid #D1D5DB', borderRadius:'6px', cursor:'pointer', padding:'2px' }}/>
                  <div style={{ flex:1 }}>
                    <Input value={cur.colore_sfondo||'#F4F5F7'}
                      onChange={e=>setCur(p=>({...p,colore_sfondo:e.target.value}))}
                      placeholder="#F4F5F7"/>
                  </div>
                </div>
              </Field>
            </div>

            {/* Palette preimpostate */}
            <div>
              <p style={{ fontSize:'12px', fontWeight:'600', color:'#6B7280', textTransform:'uppercase', letterSpacing:'.06em', margin:'0 0 10px' }}>Palette preimpostate</p>
              <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
                {[
                  { nome:'CNA Roma',    primario:'#003DA5', sfondo:'#EEF3FF' },
                  { nome:'Verde',       primario:'#16A34A', sfondo:'#F0FDF4' },
                  { nome:'Rosso',       primario:'#DC2626', sfondo:'#FEF2F2' },
                  { nome:'Viola',       primario:'#7C3AED', sfondo:'#F5F3FF' },
                  { nome:'Arancio',     primario:'#D97706', sfondo:'#FFFBEB' },
                  { nome:'Grigio scuro',primario:'#1F2937', sfondo:'#F9FAFB' },
                ].map(p=>(
                  <button key={p.nome} onClick={()=>setCur(c=>({...c,colore_primario:p.primario,colore_sfondo:p.sfondo}))}
                    style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 14px',
                      border:`2px solid ${cur.colore_primario===p.primario?p.primario:'#E5E7EB'}`,
                      borderRadius:'8px', backgroundColor:'#FFFFFF', cursor:'pointer',
                      fontFamily:"'Inter',sans-serif", fontSize:'12px', fontWeight:'600', color:'#374151' }}>
                    <span style={{ display:'flex', gap:'3px' }}>
                      <span style={{ width:'14px', height:'14px', borderRadius:'50%', backgroundColor:p.primario }}/>
                      <span style={{ width:'14px', height:'14px', borderRadius:'50%', backgroundColor:p.sfondo, border:'1px solid #E5E7EB' }}/>
                    </span>
                    {p.nome}
                  </button>
                ))}
              </div>
            </div>

            {/* Anteprima colori */}
            <div style={{ backgroundColor: cur.colore_sfondo||'#F4F5F7', borderRadius:'10px', padding:'20px', border:'1px solid #E5E7EB' }}>
              <p style={{ fontSize:'11px', color:'#9CA3AF', margin:'0 0 12px', fontWeight:'600', textTransform:'uppercase' }}>Anteprima</p>
              <button style={{ backgroundColor:cur.colore_primario||'#003DA5', color:'#FFFFFF', border:'none', borderRadius:'6px', padding:'10px 20px', fontSize:'14px', fontWeight:'700', fontFamily:"'Inter',sans-serif", cursor:'default' }}>
                Iscriviti ora →
              </button>
            </div>
          </div>
        )}

        {/* ── TAB: Avanzato ── */}
        {tab==='avanzato' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            <div style={ee.infoBlock}>
              <p style={ee.infoTitle}><Hash size={14}/> Codice evento</p>
              <p style={{ fontSize:'13px', color:'#374151', margin:0 }}>
                Il codice progressivo viene assegnato automaticamente alla creazione.
                {cur.codice ? ` Questo evento ha codice <strong>EVT-${String(cur.codice).padStart(4,'0')}</strong>.` : ' Visibile dopo il salvataggio.'}
              </p>
            </div>
            <Field label="Note interne (non pubbliche)">
              <Textarea value={cur.note_interne||''} onChange={set('note_interne')}
                placeholder="Note visibili solo allo staff admin…" rows={4}/>
            </Field>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={ee.footer}>
        <div style={{ fontSize:'12px', color:'#9CA3AF' }}>
          {cur.codice ? `EVT-${String(cur.codice).padStart(4,'0')}` : 'Nuovo evento'}
        </div>
        <div style={{ display:'flex', gap:'10px' }}>
          <Btn variant="ghost" onClick={onClose}>Annulla</Btn>
          <Btn onClick={onSave} disabled={saving}>
            {saving ? 'Salvataggio…' : modal==='create' ? '✓ Crea evento' : '✓ Salva modifiche'}
          </Btn>
        </div>
      </div>
    </Modal>
  )
}

const ee = {
  tabBar:   { display:'flex', gap:'0', borderBottom:'1px solid #E5E7EB', marginBottom:'4px' },
  tab:      { padding:'10px 16px', background:'none', border:'none', borderBottom:'2px solid transparent', cursor:'pointer', fontSize:'13px', fontFamily:"'Inter',sans-serif", letterSpacing:'-.01em', transition:'color .15s' },
  grid2:    { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' },
  grid3:    { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'14px' },
  errBox:   { backgroundColor:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'6px', padding:'10px 14px', fontSize:'14px', color:'#DC2626', margin:'8px 0' },
  slugPfx:  { position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', fontSize:'12px', color:'#9CA3AF', fontFamily:'monospace', pointerEvents:'none' },
  footer:   { display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'16px', paddingTop:'16px', borderTop:'1px solid #E5E7EB' },
  infoBlock:{ backgroundColor:'#EEF3FF', borderRadius:'8px', padding:'14px 16px' },
  infoTitle:{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', fontWeight:'700', color:'#003DA5', textTransform:'uppercase', letterSpacing:'.06em', margin:'0 0 6px' },
}

/* ─── PAGINA PRINCIPALE ───────────────────────────────────────── */
export default function EventiPage() {
  usePageTitle('Gestione eventi')
  const [events,     setEvents]     = useState([])
  const [counts,     setCounts]     = useState({})
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [filterStato,setFilterStato]= useState('tutti')
  const [modal,      setModal]      = useState(null)
  const [cur,        setCur]        = useState(EMPTY)
  const [saving,     setSaving]     = useState(false)
  const [errors,     setErrors]     = useState({})
  const [linkModal,  setLinkModal]  = useState(null)
  const [copied,     setCopied]     = useState(false)
  const { canManage } = useRole()
  const canWrite = canManage('eventi')
  const canDelete = canManage('eventi')
  const navigate = useNavigate()
  const PUBLIC_BASE = window.location.origin

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [{ data:evs },{ data:regs }] = await Promise.all([
      supabase.from('events').select('*').order('codice',{ascending:true}),
      supabase.from('registrations').select('event_id,presente'),
    ])
    setEvents(evs||[])
    const c={}; (regs||[]).forEach(r=>{
      if (!c[r.event_id]) c[r.event_id]={total:0,presenti:0}
      c[r.event_id].total++; if(r.presente) c[r.event_id].presenti++
    }); setCounts(c); setLoading(false)
  }

  function openCreate() { setCur({...EMPTY}); setErrors({}); setModal('create') }
  function openEdit(ev) {
    setCur({ ...ev,
      data_inizio: ev.data_inizio?.slice(0,16)||'',
      data_fine:   ev.data_fine?.slice(0,16)||'',
      capienza_max: ev.capienza_max||'',
      layout_hero: ev.layout_hero || EMPTY.layout_hero,
    })
    setErrors({}); setModal('edit')
  }

  async function saveEvent() {
    const e={}
    if (!cur.titolo.trim()) e.titolo='Obbligatorio'
    if (!cur.slug.trim())   e.slug='Obbligatorio'
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true)
    const payload={
      titolo:cur.titolo.trim(), slug:cur.slug.trim(),
      descrizione:cur.descrizione||null, data_inizio:cur.data_inizio||null,
      data_fine:cur.data_fine||null, luogo:cur.luogo||null,
      capienza_max:cur.capienza_max?parseInt(cur.capienza_max):null,
      stato:cur.stato, immagine_hero:cur.immagine_hero||null,
      colore_primario:cur.colore_primario||'#003DA5',
      colore_sfondo:cur.colore_sfondo||'#F4F5F7',
      layout_hero:cur.layout_hero||EMPTY.layout_hero,
    }
    const { error } = modal==='create'
      ? await supabase.from('events').insert(payload)
      : await supabase.from('events').update(payload).eq('id',cur.id)
    if (error) { setErrors({general:error.message}); setSaving(false); return }
    setSaving(false); setModal(null); loadData()
  }

  async function deleteEvent() {
    setSaving(true)
    await supabase.from('events').delete().eq('id',cur.id)
    logAttivita('evento_eliminato', { eventoId: cur.id, eventoTitolo: cur.titolo })
    setSaving(false); setModal(null); loadData()
  }

  async function duplicate(ev) {
    const { id,created_at,codice,...rest }=ev
    await supabase.from('events').insert({
      ...rest, titolo:rest.titolo+' (copia)',
      slug:rest.slug+'-copia-'+Date.now().toString(36), stato:'bozza'
    })
    loadData()
  }

  async function copyLink(url) {
    try { await navigator.clipboard.writeText(url) } catch {}
    setCopied(true); setTimeout(()=>setCopied(false),2500)
  }

  const filtered = events.filter(ev=>{
    const ok = !search || ev.titolo.toLowerCase().includes(search.toLowerCase()) || ev.slug.includes(search.toLowerCase())
    return ok && (filterStato==='tutti' || ev.stato===filterStato)
  })

  return (
    <div style={s.page}>
      <div style={s.header} className="page-header-row">
        <div>
          <h1 style={s.title}>Gestione Eventi</h1>
          <p style={s.sub}>{events.length} eventi totali</p>
        </div>
        {canWrite && <Btn onClick={() => navigate('/admin/eventi/nuovo/editor')}><Plus size={18}/> Nuovo evento</Btn>}
      </div>

      <div style={s.filters}>
        <div style={s.swrap}>
          <Search size={16} style={s.sicon}/>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Cerca…" style={s.sinput}/>
        </div>
        <Select value={filterStato} onChange={e=>setFilterStato(e.target.value)}>
          <option value="tutti">Tutti gli stati</option>
          <option value="bozza">Bozza</option>
          <option value="pubblicato">Pubblicato</option>
          <option value="chiuso">Chiuso</option>
          <option value="archiviato">Archiviato</option>
        </Select>
      </div>

      <div style={s.card}>
        {loading ? (
          <div style={s.center}>Caricamento…</div>
        ) : filtered.length===0 ? (
          <EmptyState icon={CalendarDays} title="Nessun evento" desc="Crea il primo evento"
            action={canWrite ? <Btn onClick={() => navigate('/admin/eventi/nuovo/editor')}><Plus size={16}/>Crea evento</Btn> : null}/>
        ) : (
          <div style={{ overflowX:'auto' }} className="table-wrap">
            <table style={s.table}>
              <GlowTableHead columns={[
                { label:'#',        color:'neutral', hideOnMobile:true },
                { label:'Evento',   color:'blue',   icon:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
                { label:'Data',     color:'cyan',   icon:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, hideOnMobile:true },
                { label:'Stato',    color:'green',  icon:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg> },
                { label:'Iscritti', color:'violet', icon:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg> },
                { label:'Presenti', color:'amber',  icon:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>, hideOnMobile:true },
                { label:'Azioni',   color:'neutral' },
              ]}/>
              <tbody>
                {filtered.map(ev=>(
                  <tr key={ev.id} style={s.tr}
                    onMouseEnter={e=>e.currentTarget.style.backgroundColor='#F9FAFB'}
                    onMouseLeave={e=>e.currentTarget.style.backgroundColor='transparent'}>
                    <td style={{ ...s.td, width:'60px' }}>
                      <span style={s.codice}>EVT-{String(ev.codice||0).padStart(4,'0')}</span>
                    </td>
                    <td style={s.td}>
                      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                        {ev.immagine_hero
                          ? <img src={ev.immagine_hero} alt="" style={s.thumb}/>
                          : <div style={s.thumbPh}><Image size={13} style={{ color:'#9CA3AF' }}/></div>}
                        <div>
                          <p style={s.evTitle}>{ev.titolo}</p>
                          <p style={s.evSlug}>/{ev.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td style={s.td}><span style={s.cell}>{fmtDt(ev.data_inizio)}</span></td>
                    <td style={s.td}><StatoBadge stato={ev.stato}/></td>
                    <td style={s.td}>
                      <span style={s.cell}>{counts[ev.id]?.total||0}
                        {ev.capienza_max&&<span style={{color:'#9CA3AF'}}>/{ev.capienza_max}</span>}
                      </span>
                    </td>
                    <td style={s.td}><span style={s.cell}>{counts[ev.id]?.presenti||0}</span></td>
                    <td style={s.td}>
                      <div style={{ display:'flex', gap:'5px', alignItems:'center', flexWrap:'nowrap' }}>
                        {/* Gestisci — pill blu primario */}
                        {canWrite && (
                          <button className="btn-pill btn-pill-blue"
                            title="Apri editor completo"
                            onClick={() => {
                              if (window.confirm(`Stai per aprire l'editor dell'evento "${ev.titolo}".\n\nContinuare?`)) {
                                navigate(`/admin/eventi/${ev.id}/editor`)
                              }
                            }}>
                            <Pencil size={12}/> Gestisci
                          </button>
                        )}
                        {/* Iscritti */}
                        <button className="btn-pill btn-pill-ghost"
                          title="Vedi iscritti" onClick={()=>navigate(`/admin/iscritti?evento=${ev.id}`)}>
                          <Users size={12}/> Iscritti
                        </button>
                        {/* Link pubblico */}
                        <button className="btn-pill btn-pill-ghost"
                          style={{ color: ev.stato==='pubblicato'?'#003DA5':'#9CA3AF', borderColor: ev.stato==='pubblicato'?'#003DA5':'#D1D5DB' }}
                          title="Link pubblico" onClick={()=>{setCopied(false);setLinkModal(ev)}}>
                          <Globe size={12}/>
                        </button>
                        {/* Duplica */}
                        {canWrite && (
                          <button className="btn-pill btn-pill-ghost" title="Duplica" onClick={()=>duplicate(ev)}>
                            <Copy size={12}/>
                          </button>
                        )}
                        {/* Elimina */}
                        {canDelete && (
                          <button className="btn-pill" style={{ background:'transparent', border:'1px solid #FCA5A5', color:'#DC2626' }}
                            title="Elimina" onClick={()=>{setCur(ev);setModal('delete')}}>
                            <Trash2 size={12}/>
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

      {/* Editor */}
      {(modal==='create'||modal==='edit') && (
        <EventEditor modal={modal} cur={cur} setCur={setCur}
          onSave={saveEvent} onClose={()=>setModal(null)} saving={saving} errors={errors}/>
      )}

      {/* Delete */}
      {modal==='delete' && (
        <Modal title="Elimina evento" onClose={()=>setModal(null)} width="440px">
          <p style={{ fontSize:'14px', color:'#374151', margin:'0 0 8px' }}>
            Elimina <strong>«{cur.titolo}»</strong>? Verranno eliminati tutti gli iscritti.
          </p>
          <p style={{ fontSize:'13px', color:'#DC2626', margin:'0 0 24px' }}>Operazione irreversibile.</p>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:'10px' }}>
            <Btn variant="ghost" onClick={()=>setModal(null)}>Annulla</Btn>
            <Btn variant="danger" onClick={deleteEvent} disabled={saving}>
              {saving ? 'Eliminazione…' : 'Elimina definitivamente'}
            </Btn>
          </div>
        </Modal>
      )}

      {/* Link pubblico */}
      {linkModal && (()=>{
        const url=`${PUBLIC_BASE}/eventi/${linkModal.slug}`
        return (
          <Modal title="Link pagina pubblica" onClose={()=>setLinkModal(null)} width="520px">
            <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <span style={{ fontSize:'13px', color:'#6B7280' }}>Stato:</span>
                <StatoBadge stato={linkModal.stato}/>
                {linkModal.stato!=='pubblicato' && <span style={{ fontSize:'12px', color:'#D97706' }}>⚠ Non pubblico</span>}
              </div>
              <div>
                <p style={{ fontSize:'12px', fontWeight:'600', color:'#6B7280', textTransform:'uppercase', letterSpacing:'.06em', margin:'0 0 8px' }}>URL evento</p>
                <div style={{ display:'flex', gap:'8px' }}>
                  <div style={{ flex:1, padding:'10px 14px', backgroundColor:'#F4F5F7', border:'1px solid #E5E7EB', borderRadius:'4px', fontSize:'13px', color:'#003DA5', fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{url}</div>
                  <button onClick={()=>copyLink(url)}
                    style={{ display:'flex', alignItems:'center', gap:'6px', padding:'10px 14px', backgroundColor:copied?'#16A34A':'#003DA5', color:'#FFFFFF', border:'none', borderRadius:'4px', cursor:'pointer', fontSize:'13px', fontWeight:'700', fontFamily:"'Inter',sans-serif", flexShrink:0, transition:'background-color .2s' }}>
                    {copied?<><ClipboardCheck size={14}/>Copiato!</>:<><Link2 size={14}/>Copia</>}
                  </button>
                </div>
              </div>
              <div style={{ display:'flex', gap:'10px' }}>
                <a href={url} target="_blank" rel="noopener noreferrer"
                  style={{ display:'flex', alignItems:'center', gap:'6px', padding:'9px 16px', border:'1px solid #003DA5', color:'#003DA5', borderRadius:'4px', fontSize:'13px', fontWeight:'700', textDecoration:'none', fontFamily:"'Inter',sans-serif" }}>
                  <ExternalLink size={14}/> Apri
                </a>
                <Btn variant="ghost" onClick={()=>setLinkModal(null)}>Chiudi</Btn>
              </div>
            </div>
          </Modal>
        )
      })()}
    </div>
  )
}

const s = {
  page:    { width:'100%' },
  header:  { display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'24px', flexWrap:'wrap', gap:'12px' },
  title:   { fontSize:'32px', fontWeight:'900', color:'#0A0A0A', letterSpacing:'-.03em', margin:0 },
  sub:     { fontSize:'14px', color:'#6B7280', margin:'4px 0 0', fontWeight:'500' },
  filters: { display:'flex', gap:'12px', marginBottom:'20px', flexWrap:'wrap' },
  swrap:   { position:'relative', flex:1, minWidth:'200px' },
  sicon:   { position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' },
  sinput:  { width:'100%', padding:'9px 12px 9px 36px', border:'1px solid #D1D5DB', borderRadius:'4px', fontSize:'14px', fontFamily:"'Inter',sans-serif", outline:'none', boxSizing:'border-box' },
  card:    { backgroundColor:'#FFFFFF', borderRadius:'6px', border:'1px solid #E5E7EB', overflow:'hidden' },
  center:  { padding:'48px', textAlign:'center', color:'#9CA3AF', fontSize:'14px' },
  table:   { width:'100%', borderCollapse:'collapse', fontSize:'14px' },
  th:      { padding:'10px 16px', textAlign:'left', fontSize:'11px', fontWeight:'600', color:'#6B7280', textTransform:'uppercase', letterSpacing:'.06em', borderBottom:'1px solid #E5E7EB', whiteSpace:'nowrap', backgroundColor:'#FAFAFA' },
  tr:      { transition:'background-color .1s' },
  td:      { padding:'12px 16px', borderBottom:'1px solid #F3F4F6', verticalAlign:'middle' },
  codice:  { fontSize:'11px', fontWeight:'700', color:'#003DA5', backgroundColor:'#EEF3FF', padding:'2px 7px', borderRadius:'4px', fontFamily:'monospace', whiteSpace:'nowrap' },
  thumb:   { width:'48px', height:'36px', objectFit:'cover', borderRadius:'4px', flexShrink:0 },
  thumbPh: { width:'48px', height:'36px', backgroundColor:'#F3F4F6', borderRadius:'4px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  evTitle: { fontWeight:'600', color:'#0A0A0A', margin:'0 0 2px', letterSpacing:'-.01em' },
  evSlug:  { fontSize:'11px', color:'#9CA3AF', margin:0, fontFamily:'monospace' },
  cell:    { color:'#374151', fontSize:'14px' },
  iconBtn: { background:'none', border:'1px solid #E5E7EB', borderRadius:'4px', padding:'5px 6px', cursor:'pointer', color:'#6B7280', display:'flex', alignItems:'center' },
}
