import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Btn, Field, Input, Select, Modal } from '../ui'
import { Plus, Trash2, GripVertical, Eye, ExternalLink } from 'lucide-react'

const TIPI = [
  { value: 'stelle',  label: '⭐ Stelle (1-5)' },
  { value: 'scala',   label: '🔢 Scala numerica (1-10)' },
  { value: 'scelta',  label: '✅ Scelta multipla' },
  { value: 'testo',   label: '📝 Testo libero' },
]

export default function QuestionarioTab({ eventoId }) {
  const [domande, setDomande] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [editModal, setEditModal] = useState(null) // null | { domanda } | { nuovo: true }
  const [form, setForm] = useState({ testo:'', tipo:'stelle', obbligatorio:false, opzioni:[] })
  const [newOpzione, setNewOpzione] = useState('')

  useEffect(() => { if (eventoId) load() }, [eventoId])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('survey_questions')
      .select('*').eq('event_id', eventoId).order('ordine')
    setDomande(data || [])
    setLoading(false)
  }

  function openNew() {
    setForm({ testo:'', tipo:'stelle', obbligatorio:false, opzioni:[] })
    setNewOpzione('')
    setEditModal({ nuovo: true })
  }

  function openEdit(d) {
    setForm({ testo:d.testo, tipo:d.tipo, obbligatorio:d.obbligatorio, opzioni:d.opzioni||[] })
    setNewOpzione('')
    setEditModal({ domanda: d })
  }

  async function saveDomanda() {
    if (!form.testo.trim()) return
    setSaving('save')
    const payload = {
      event_id: eventoId,
      testo: form.testo.trim(),
      tipo: form.tipo,
      obbligatorio: form.obbligatorio,
      opzioni: form.tipo === 'scelta' ? form.opzioni : [],
      ordine: editModal.nuovo ? domande.length : editModal.domanda.ordine,
    }
    if (editModal.nuovo) {
      await supabase.from('survey_questions').insert(payload)
    } else {
      await supabase.from('survey_questions').update(payload).eq('id', editModal.domanda.id)
    }
    setSaving(null)
    setEditModal(null)
    load()
  }

  async function deleteDomanda(id) {
    await supabase.from('survey_questions').delete().eq('id', id)
    load()
  }

  async function toggleAttivo(d) {
    await supabase.from('survey_questions').update({ attivo: !d.attivo }).eq('id', d.id)
    load()
  }

  function addOpzione() {
    const v = newOpzione.trim()
    if (!v || form.opzioni.includes(v)) return
    setForm(f => ({ ...f, opzioni: [...f.opzioni, v] }))
    setNewOpzione('')
  }

  function removeOpzione(op) {
    setForm(f => ({ ...f, opzioni: f.opzioni.filter(o => o !== op) }))
  }

  // Conteggio risposte per domanda (informativo)
  const linkQuestionario = eventoId ? `/questionario?qr=TEST` : null

  return (
    <div>
      {/* Info banner */}
      <div style={{ backgroundColor:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:'8px', padding:'14px 18px', marginBottom:'24px', display:'flex', alignItems:'flex-start', gap:'12px' }}>
        <span style={{ fontSize:'20px' }}>ℹ️</span>
        <div>
          <p style={{ fontSize:'13px', fontWeight:'700', color:'#1D4ED8', margin:'0 0 4px' }}>
            Come funziona il questionario
          </p>
          <p style={{ fontSize:'13px', color:'#3B82F6', margin:0, lineHeight:'1.6' }}>
            La valutazione a stelle (1-5) è sempre presente. Puoi aggiungere domande extra che verranno mostrate agli iscritti
            quando cliccano il link nell&apos;email post-evento. Le risposte sono visibili in Statistiche.
          </p>
        </div>
      </div>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' }}>
        <div>
          <p style={{ fontSize:'15px', fontWeight:'700', color:'#0A0A0A', margin:'0 0 2px' }}>
            Domande aggiuntive ({domande.filter(d=>d.attivo).length} attive)
          </p>
          <p style={{ fontSize:'13px', color:'#6B7280', margin:0 }}>
            La valutazione 1-5 stelle è sempre inclusa di default.
          </p>
        </div>
        <Btn variant="primary" onClick={openNew} size="md">
          <Plus size={16}/> Aggiungi domanda
        </Btn>
      </div>

      {/* Lista domande */}
      {loading ? (
        <p style={{ color:'#9CA3AF', fontSize:'14px' }}>Caricamento…</p>
      ) : domande.length === 0 ? (
        <div style={{ border:'2px dashed #E5E7EB', borderRadius:'8px', padding:'40px', textAlign:'center' }}>
          <p style={{ fontSize:'32px', margin:'0 0 12px' }}>⭐</p>
          <p style={{ fontSize:'15px', fontWeight:'700', color:'#374151', margin:'0 0 6px' }}>Nessuna domanda extra</p>
          <p style={{ fontSize:'13px', color:'#9CA3AF', margin:'0 0 20px' }}>
            Solo la valutazione a stelle sarà mostrata agli iscritti.
          </p>
          <Btn variant="secondary" onClick={openNew} size="sm"><Plus size={14}/> Aggiungi la prima domanda</Btn>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          {domande.map((d, i) => (
            <div key={d.id} style={{ backgroundColor:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:'8px',
              padding:'14px 16px', display:'flex', alignItems:'center', gap:'12px',
              opacity: d.attivo ? 1 : 0.5 }}>
              <GripVertical size={16} style={{ color:'#D1D5DB', flexShrink:0, cursor:'grab' }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:'14px', fontWeight:'600', color:'#0A0A0A', margin:'0 0 3px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {d.testo}
                </p>
                <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                  <span style={{ fontSize:'11px', backgroundColor:'#F3F4F6', color:'#6B7280', borderRadius:'4px', padding:'2px 8px', fontWeight:'600' }}>
                    {TIPI.find(t=>t.value===d.tipo)?.label || d.tipo}
                  </span>
                  {d.obbligatorio && (
                    <span style={{ fontSize:'11px', backgroundColor:'#FEF2F2', color:'#DC2626', borderRadius:'4px', padding:'2px 8px', fontWeight:'600' }}>
                      Obbligatoria
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display:'flex', gap:'6px', flexShrink:0, alignItems:'center' }}>
                <button onClick={() => toggleAttivo(d)}
                  style={{ background:'none', border:'1px solid #E5E7EB', borderRadius:'4px', padding:'5px 10px',
                    fontSize:'11px', fontWeight:'600', cursor:'pointer', color: d.attivo ? '#059669' : '#9CA3AF' }}>
                  {d.attivo ? 'Attiva' : 'Disattiva'}
                </button>
                <button onClick={() => openEdit(d)}
                  style={{ background:'none', border:'1px solid #E5E7EB', borderRadius:'4px', padding:'5px 8px', cursor:'pointer', color:'#6B7280', display:'flex', alignItems:'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button onClick={() => deleteDomanda(d.id)}
                  style={{ background:'none', border:'1px solid #FCA5A5', borderRadius:'4px', padding:'5px 8px', cursor:'pointer', color:'#DC2626', display:'flex', alignItems:'center' }}>
                  <Trash2 size={14}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal crea/modifica */}
      {editModal && (
        <Modal title={editModal.nuovo ? 'Nuova domanda' : 'Modifica domanda'} onClose={() => setEditModal(null)} width="500px">
          <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
            <Field label="Testo della domanda *">
              <Input value={form.testo} onChange={e => setForm(f=>({...f, testo:e.target.value}))}
                placeholder="Es. Consiglieresti questo evento a un collega?"/>
            </Field>

            <Field label="Tipo di risposta">
              <Select value={form.tipo} onChange={e => setForm(f=>({...f, tipo:e.target.value}))}>
                {TIPI.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
            </Field>

            {form.tipo === 'scelta' && (
              <Field label="Opzioni di risposta">
                <div style={{ display:'flex', flexDirection:'column', gap:'6px', marginBottom:'8px' }}>
                  {form.opzioni.map(op => (
                    <div key={op} style={{ display:'flex', alignItems:'center', gap:'8px', backgroundColor:'#F9FAFB',
                      border:'1px solid #E5E7EB', borderRadius:'6px', padding:'8px 12px' }}>
                      <span style={{ flex:1, fontSize:'14px', color:'#374151' }}>{op}</span>
                      <button onClick={() => removeOpzione(op)} style={{ background:'none', border:'none', cursor:'pointer', color:'#DC2626', display:'flex' }}>
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex', gap:'8px' }}>
                  <Input value={newOpzione} onChange={e => setNewOpzione(e.target.value)}
                    placeholder="Nuova opzione…"
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addOpzione())}/>
                  <Btn variant="secondary" onClick={addOpzione} size="sm"><Plus size={14}/> Aggiungi</Btn>
                </div>
              </Field>
            )}

            <label style={{ display:'flex', alignItems:'center', gap:'10px', cursor:'pointer' }}>
              <input type="checkbox" checked={form.obbligatorio}
                onChange={e => setForm(f=>({...f, obbligatorio:e.target.checked}))}
                style={{ width:'16px', height:'16px', accentColor:'#003DA5' }}/>
              <span style={{ fontSize:'14px', color:'#374151', fontWeight:'500' }}>Risposta obbligatoria</span>
            </label>

            <div style={{ display:'flex', justifyContent:'flex-end', gap:'10px', paddingTop:'8px', borderTop:'1px solid #F3F4F6' }}>
              <Btn variant="ghost" onClick={() => setEditModal(null)}>Annulla</Btn>
              <Btn variant="primary" onClick={saveDomanda} disabled={!form.testo.trim() || saving === 'save'}>
                {saving === 'save' ? 'Salvataggio…' : 'Salva domanda'}
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
