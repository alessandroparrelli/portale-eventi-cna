import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRole } from '../../hooks/useRole'
import { Modal, Btn, Field, Input, Textarea, Select, EmptyState } from '../../components/ui'
import { Mail, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Info } from 'lucide-react'

const TIPO_LABELS = {
  conferma: { label:'Conferma iscrizione', color:'#16A34A', bg:'#DCFCE7' },
  reminder: { label:'Reminder evento', color:'#2563EB', bg:'#DBEAFE' },
  questionario: { label:'Questionario post-evento', color:'#7C3AED', bg:'#F3E8FF' },
  notifica_admin: { label:'Notifica admin', color:'#D97706', bg:'#FEF3C7' },
}

const VARIABILI = [
  '{{nome}}','{{cognome}}','{{ragione_sociale}}','{{email}}','{{cellulare}}',
  '{{nome_evento}}','{{data_evento}}','{{luogo_evento}}',
  '{{qr_code}}','{{link_questionario}}'
]

const EMPTY_TPL = { event_id:'', tipo:'conferma', oggetto:'', corpo_html:'', giorni_prima:'', attivo:true }

export default function EmailPage() {
  const [eventi, setEventi] = useState([])
  const [selectedEvento, setSelectedEvento] = useState('')
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(null)
  const [current, setCurrent] = useState(EMPTY_TPL)
  const [saving, setSaving] = useState(false)
  const [showVars, setShowVars] = useState(false)
  const { canWrite, canDelete } = useRole()

  useEffect(() => {
    supabase.from('events').select('id,titolo').order('data_inizio',{ascending:false})
      .then(({data})=>setEventi(data||[]))
  }, [])

  useEffect(() => {
    if (!selectedEvento) { setTemplates([]); return }
    loadTemplates()
  }, [selectedEvento])

  async function loadTemplates() {
    setLoading(true)
    const { data } = await supabase.from('email_templates').select('*')
      .eq('event_id', selectedEvento).order('tipo')
    setTemplates(data || [])
    setLoading(false)
  }

  function openCreate() {
    setCurrent({ ...EMPTY_TPL, event_id: selectedEvento })
    setModal('create')
  }
  function openEdit(t) { setCurrent({ ...t, giorni_prima: t.giorni_prima || '' }); setModal('edit') }

  async function saveTemplate() {
    if (!current.oggetto.trim() || !current.corpo_html.trim()) return
    setSaving(true)
    const payload = {
      event_id: selectedEvento,
      tipo: current.tipo,
      oggetto: current.oggetto.trim(),
      corpo_html: current.corpo_html,
      giorni_prima: current.tipo === 'reminder' && current.giorni_prima ? parseInt(current.giorni_prima) : null,
      attivo: current.attivo,
    }
    if (modal === 'create') {
      await supabase.from('email_templates').insert(payload)
    } else {
      await supabase.from('email_templates').update(payload).eq('id', current.id)
    }
    setSaving(false)
    setModal(null)
    loadTemplates()
  }

  async function toggleAttivo(t) {
    await supabase.from('email_templates').update({ attivo: !t.attivo }).eq('id', t.id)
    loadTemplates()
  }

  async function deleteTemplate(t) {
    await supabase.from('email_templates').delete().eq('id', t.id)
    loadTemplates()
  }

  function insertVar(v) {
    setCurrent(p => ({ ...p, corpo_html: p.corpo_html + v }))
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Gestione Email</h1>
          <p style={s.subtitle}>Template email per conferma, reminder e questionari</p>
        </div>
        {selectedEvento && canWrite && (
          <Btn onClick={openCreate}><Plus size={18}/> Nuovo template</Btn>
        )}
      </div>

      <div style={{ maxWidth:'360px', marginBottom:'24px' }}>
        <Field label="Evento">
          <Select value={selectedEvento} onChange={e=>setSelectedEvento(e.target.value)}>
            <option value="">— Seleziona evento —</option>
            {eventi.map(ev=><option key={ev.id} value={ev.id}>{ev.titolo}</option>)}
          </Select>
        </Field>
      </div>

      {/* Info variabili */}
      {selectedEvento && (
        <div style={s.infoBox}>
          <Info size={15} style={{ color:'#2563EB', flexShrink:0, marginTop:'1px' }}/>
          <div>
            <p style={{ fontSize:'13px', color:'#1d4ed8', fontWeight:'600', margin:'0 0 4px' }}>Variabili dinamiche disponibili nei template</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
              {VARIABILI.map(v=>(
                <code key={v} style={{ fontSize:'11px', backgroundColor:'#DBEAFE', color:'#1d4ed8', padding:'2px 6px', borderRadius:'3px', fontFamily:'monospace' }}>{v}</code>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabella template */}
      {selectedEvento && (
        <div style={s.card}>
          {loading ? (
            <p style={{ padding:'40px', textAlign:'center', color:'#9CA3AF', fontSize:'14px' }}>Caricamento…</p>
          ) : templates.length === 0 ? (
            <EmptyState icon={Mail} title="Nessun template configurato"
              desc="Crea il primo template email per questo evento"
              action={canWrite ? <Btn onClick={openCreate}><Plus size={16}/>Nuovo template</Btn> : null}/>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>{['Tipo','Oggetto email','Stato','Azioni'].map(h=>(
                  <th key={h} style={s.th}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {templates.map(t=>{
                  const tp = TIPO_LABELS[t.tipo]||{}
                  return (
                    <tr key={t.id} style={s.tr}
                      onMouseEnter={e=>e.currentTarget.style.backgroundColor='#F9FAFB'}
                      onMouseLeave={e=>e.currentTarget.style.backgroundColor='transparent'}>
                      <td style={s.td}>
                        <span style={{ display:'inline-flex', padding:'3px 10px', borderRadius:'20px',
                          fontSize:'12px', fontWeight:'600', backgroundColor:tp.bg, color:tp.color }}>
                          {tp.label||t.tipo}
                        </span>
                        {t.tipo==='reminder' && t.giorni_prima && (
                          <span style={{ fontSize:'11px', color:'#6B7280', marginLeft:'8px' }}>{t.giorni_prima}gg prima</span>
                        )}
                      </td>
                      <td style={s.td}>
                        <p style={{ fontSize:'14px', color:'#0A0A0A', margin:0, fontWeight:'500' }}>{t.oggetto}</p>
                      </td>
                      <td style={s.td}>
                        {canWrite ? (
                          <button onClick={()=>toggleAttivo(t)}
                            style={{ display:'flex', alignItems:'center', gap:'6px', background:'none', border:'none', cursor:'pointer',
                              fontSize:'13px', fontWeight:'600', color: t.attivo ? '#16A34A' : '#9CA3AF', fontFamily:"'Inter',sans-serif" }}>
                            {t.attivo ? <ToggleRight size={20}/> : <ToggleLeft size={20}/>}
                            {t.attivo ? 'Attivo' : 'Inattivo'}
                          </button>
                        ) : (
                          <span style={{ fontSize:'13px', fontWeight:'600', color: t.attivo ? '#16A34A' : '#9CA3AF' }}>
                            {t.attivo ? 'Attivo' : 'Inattivo'}
                          </span>
                        )}
                      </td>
                      <td style={s.td}>
                        <div style={{ display:'flex', gap:'6px' }}>
                          {canWrite && (
                            <button style={s.iconBtn} title="Modifica" onClick={()=>openEdit(t)}>
                              <Pencil size={15}/>
                            </button>
                          )}
                          {canDelete && (
                            <button style={{...s.iconBtn,color:'#DC2626'}} title="Elimina" onClick={()=>deleteTemplate(t)}>
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
          )}
        </div>
      )}

      {!selectedEvento && (
        <div style={{ padding:'80px', textAlign:'center' }}>
          <Mail size={48} style={{ color:'#D1D5DB', marginBottom:'12px' }}/>
          <p style={{ fontSize:'18px', fontWeight:'700', color:'#0A0A0A' }}>Seleziona un evento</p>
          <p style={{ fontSize:'14px', color:'#6B7280' }}>Scegli l'evento per configurare i template email</p>
        </div>
      )}

      {/* MODAL EDITOR */}
      {(modal==='create'||modal==='edit') && (
        <Modal title={modal==='create'?'Nuovo template email':'Modifica template'} onClose={()=>setModal(null)} width="680px">
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
              <Field label="Tipo email">
                <Select value={current.tipo} onChange={e=>setCurrent(p=>({...p,tipo:e.target.value}))}>
                  {Object.entries(TIPO_LABELS).map(([k,v])=>(
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </Select>
              </Field>
              {current.tipo==='reminder' && (
                <Field label="Giorni prima dell'evento">
                  <Input type="number" value={current.giorni_prima}
                    onChange={e=>setCurrent(p=>({...p,giorni_prima:e.target.value}))} placeholder="es. 3"/>
                </Field>
              )}
              <div style={{ gridColumn:'1/-1' }}>
                <Field label="Oggetto email" required>
                  <Input value={current.oggetto} onChange={e=>setCurrent(p=>({...p,oggetto:e.target.value}))}
                    placeholder="es. Conferma iscrizione — {{nome_evento}}"/>
                </Field>
              </div>
            </div>

            {/* Variabili rapide */}
            <div>
              <p style={{ fontSize:'12px', color:'#6B7280', fontWeight:'600', margin:'0 0 6px' }}>
                Inserisci variabile nel corpo:
              </p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                {VARIABILI.map(v=>(
                  <button key={v} onClick={()=>insertVar(v)}
                    style={{ fontSize:'11px', backgroundColor:'#EEF3FF', color:'#003DA5', border:'1px solid #C7D9F8',
                      padding:'3px 8px', borderRadius:'3px', cursor:'pointer', fontFamily:'monospace' }}>
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <Field label="Corpo email (HTML)" required>
              <Textarea value={current.corpo_html}
                onChange={e=>setCurrent(p=>({...p,corpo_html:e.target.value}))}
                placeholder={`<p>Gentile {{nome}},\n\nLa tua iscrizione a {{nome_evento}} è confermata.</p>\n\n<p>Data: {{data_evento}}<br>Luogo: {{luogo_evento}}</p>`}
                rows={10}/>
            </Field>

            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <input type="checkbox" id="attivo" checked={current.attivo}
                onChange={e=>setCurrent(p=>({...p,attivo:e.target.checked}))}
                style={{ width:'16px', height:'16px', accentColor:'#003DA5' }}/>
              <label htmlFor="attivo" style={{ fontSize:'14px', color:'#374151', cursor:'pointer' }}>
                Template attivo (verrà inviato automaticamente)
              </label>
            </div>

            <div style={{ display:'flex', justifyContent:'flex-end', gap:'10px' }}>
              <Btn variant="ghost" onClick={()=>setModal(null)}>Annulla</Btn>
              <Btn onClick={saveTemplate} disabled={saving || !current.oggetto.trim() || !current.corpo_html.trim()}>
                {saving ? 'Salvataggio…' : modal==='create' ? 'Crea template' : 'Salva modifiche'}
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

const s = {
  page: { maxWidth:'900px' },
  header: { display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'24px', flexWrap:'wrap', gap:'12px' },
  title: { fontSize:'32px', fontWeight:'900', color:'#0A0A0A', letterSpacing:'-0.03em', margin:0 },
  subtitle: { fontSize:'14px', color:'#6B7280', margin:'4px 0 0', fontWeight:'500' },
  infoBox: { display:'flex', gap:'10px', backgroundColor:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:'6px', padding:'14px 16px', marginBottom:'20px' },
  card: { backgroundColor:'#FFFFFF', borderRadius:'6px', border:'1px solid #E5E7EB', overflow:'hidden' },
  table: { width:'100%', borderCollapse:'collapse', fontSize:'14px' },
  th: { padding:'10px 20px', textAlign:'left', fontSize:'11px', fontWeight:'600', color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:'1px solid #E5E7EB', backgroundColor:'#FAFAFA' },
  tr: { transition:'background-color 0.1s' },
  td: { padding:'14px 20px', borderBottom:'1px solid #F3F4F6', verticalAlign:'middle' },
  iconBtn: { background:'none', border:'1px solid #E5E7EB', borderRadius:'4px', padding:'5px 7px', cursor:'pointer', color:'#6B7280', display:'flex', alignItems:'center' },
}
