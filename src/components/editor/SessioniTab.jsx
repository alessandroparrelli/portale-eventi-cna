import { useState } from 'react'
import { Plus, Trash2, Clock, MapPin, Users, GripVertical, ChevronDown, ChevronUp, Calendar } from 'lucide-react'
import { Field, Input, Btn } from '../ui'

function newSessione() {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2,5),
    titolo: '',
    data: '',
    ora_inizio: '',
    ora_fine: '',
    luogo: '',
    relatore: '',
    capienza_max: '',
    descrizione: '',
  }
}

function SessioneCard({ s, idx, total, onChange, onDelete, onMoveUp, onMoveDown }) {
  const [open, setOpen] = useState(idx === 0)

  const set = (k, v) => onChange({ ...s, [k]: v })

  return (
    <div style={st.card}>
      {/* Header sessione */}
      <div style={st.cardHeader} onClick={() => setOpen(o => !o)}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', flex:1, minWidth:0 }}>
          <div style={st.sessionNum}>{idx + 1}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={st.sessionTitle}>
              {s.titolo || `Sessione ${idx + 1}`}
            </p>
            {(s.data || s.ora_inizio) && (
              <p style={st.sessionMeta}>
                {s.data && new Date(s.data + 'T00:00').toLocaleDateString('it-IT', { weekday:'short', day:'2-digit', month:'short' })}
                {s.ora_inizio && ` · ${s.ora_inizio}`}
                {s.ora_fine && `–${s.ora_fine}`}
                {s.luogo && ` · ${s.luogo}`}
              </p>
            )}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'4px', flexShrink:0 }} onClick={e => e.stopPropagation()}>
          <button style={st.iconBtn} onClick={() => onMoveUp(idx)} disabled={idx === 0} title="Sposta su">↑</button>
          <button style={st.iconBtn} onClick={() => onMoveDown(idx)} disabled={idx === total-1} title="Sposta giù">↓</button>
          <button style={{ ...st.iconBtn, color:'#DC2626' }} onClick={() => onDelete(idx)} title="Elimina">
            <Trash2 size={14} />
          </button>
          <button style={st.iconBtn} onClick={() => setOpen(o => !o)}>
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Body */}
      {open && (
        <div style={st.cardBody}>
          <div style={st.grid2}>
            <div style={{ gridColumn:'1/-1' }}>
              <Field label="Titolo sessione">
                <Input value={s.titolo} onChange={e => set('titolo', e.target.value)} placeholder="es. Apertura lavori, Tavola rotonda…" />
              </Field>
            </div>
            <Field label="Data">
              <Input type="date" value={s.data} onChange={e => set('data', e.target.value)} />
            </Field>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
              <Field label="Ora inizio">
                <Input type="time" value={s.ora_inizio} onChange={e => set('ora_inizio', e.target.value)} />
              </Field>
              <Field label="Ora fine">
                <Input type="time" value={s.ora_fine} onChange={e => set('ora_fine', e.target.value)} />
              </Field>
            </div>
            <Field label="Luogo / Sala">
              <Input value={s.luogo} onChange={e => set('luogo', e.target.value)} placeholder="es. Sala A, Piano 2…" />
            </Field>
            <Field label="Relatore / Speaker">
              <Input value={s.relatore} onChange={e => set('relatore', e.target.value)} placeholder="es. Mario Rossi" />
            </Field>
            <Field label="Posti max (opzionale)">
              <Input type="number" min="1" value={s.capienza_max} onChange={e => set('capienza_max', e.target.value)} placeholder="—" />
            </Field>
            <div style={{ gridColumn:'1/-1' }}>
              <Field label="Note / Descrizione">
                <textarea
                  value={s.descrizione}
                  onChange={e => set('descrizione', e.target.value)}
                  placeholder="Descrizione breve della sessione…"
                  rows={3}
                  style={{ width:'100%', boxSizing:'border-box', border:'1px solid #D1D5DB', borderRadius:'6px', padding:'9px 12px', fontSize:'13px', fontFamily:"'Inter',sans-serif", resize:'vertical', outline:'none', color:'#0A0A0A' }}
                />
              </Field>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SessioniTab({ event, setEvent }) {
  const sessioni = event.sessioni || []

  function updateSessioni(newList) {
    setEvent(p => ({ ...p, sessioni: newList }))
  }

  function addSessione() {
    updateSessioni([...sessioni, newSessione()])
  }

  function deleteSessione(idx) {
    updateSessioni(sessioni.filter((_, i) => i !== idx))
  }

  function updateSessione(idx, updated) {
    const list = [...sessioni]
    list[idx] = updated
    updateSessioni(list)
  }

  function moveUp(idx) {
    if (idx === 0) return
    const list = [...sessioni]
    ;[list[idx-1], list[idx]] = [list[idx], list[idx-1]]
    updateSessioni(list)
  }

  function moveDown(idx) {
    if (idx === sessioni.length-1) return
    const list = [...sessioni]
    ;[list[idx], list[idx+1]] = [list[idx+1], list[idx]]
    updateSessioni(list)
  }

  return (
    <div>
      {/* Intro */}
      <div style={{ backgroundColor:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:'8px', padding:'14px 16px', marginBottom:'24px', display:'flex', gap:'12px', alignItems:'flex-start' }}>
        <Calendar size={18} style={{ color:'#2563EB', flexShrink:0, marginTop:'1px' }} />
        <div>
          <p style={{ fontSize:'13px', fontWeight:'700', color:'#1E40AF', margin:'0 0 3px' }}>Programma multi-sessione</p>
          <p style={{ fontSize:'13px', color:'#3B82F6', margin:0 }}>
            Suddividi l'evento in sessioni (workshop, tavole rotonde, slot temporali). Ogni sessione può avere orario, luogo, relatore e capienza propri. Le sessioni vengono mostrate nella landing page come programma dettagliato.
          </p>
        </div>
      </div>

      {/* Lista sessioni */}
      {sessioni.length === 0 ? (
        <div style={st.empty}>
          <Clock size={32} style={{ color:'#D1D5DB', marginBottom:'12px' }} />
          <p style={{ fontWeight:'700', color:'#374151', margin:'0 0 4px' }}>Nessuna sessione</p>
          <p style={{ fontSize:'13px', color:'#9CA3AF', margin:'0 0 16px' }}>Aggiungi sessioni per creare un programma strutturato.</p>
          <button onClick={addSessione} style={st.addBtnPrimary}>
            <Plus size={16} /> Aggiungi prima sessione
          </button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'16px' }}>
          {sessioni.map((s, idx) => (
            <SessioneCard
              key={s.id}
              s={s} idx={idx} total={sessioni.length}
              onChange={(updated) => updateSessione(idx, updated)}
              onDelete={deleteSessione}
              onMoveUp={moveUp}
              onMoveDown={moveDown}
            />
          ))}
        </div>
      )}

      {sessioni.length > 0 && (
        <button onClick={addSessione} style={st.addBtn}>
          <Plus size={15} /> Aggiungi sessione
        </button>
      )}

      {sessioni.length > 0 && (
        <div style={{ marginTop:'20px', padding:'14px', backgroundColor:'#F9FAFB', borderRadius:'8px', border:'1px solid #E5E7EB' }}>
          <p style={{ fontSize:'12px', color:'#6B7280', margin:0 }}>
            💡 <strong>Suggerimento:</strong> Le sessioni vengono visualizzate nella landing page come programma. Salva l'evento per applicare le modifiche.
          </p>
        </div>
      )}
    </div>
  )
}

const st = {
  card: { backgroundColor:'#ffffff', border:'1px solid #E5E7EB', borderRadius:'8px', overflow:'hidden' },
  cardHeader: { display:'flex', alignItems:'center', gap:'12px', padding:'14px 16px', cursor:'pointer', userSelect:'none' },
  cardBody: { padding:'0 16px 16px', borderTop:'1px solid #F3F4F6' },
  sessionNum: { width:'28px', height:'28px', borderRadius:'50%', backgroundColor:'#EEF3FF', color:'#003DA5', fontSize:'12px', fontWeight:'800', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  sessionTitle: { fontSize:'14px', fontWeight:'700', color:'#0A0A0A', margin:0, letterSpacing:'-0.01em' },
  sessionMeta: { fontSize:'12px', color:'#9CA3AF', margin:'2px 0 0' },
  iconBtn: { display:'flex', alignItems:'center', justifyContent:'center', width:'28px', height:'28px', background:'none', border:'none', borderRadius:'4px', cursor:'pointer', color:'#6B7280', fontSize:'14px', fontWeight:'700', fontFamily:"'Inter',sans-serif" },
  grid2: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', paddingTop:'14px' },
  empty: { textAlign:'center', padding:'48px 24px', border:'2px dashed #E5E7EB', borderRadius:'10px', display:'flex', flexDirection:'column', alignItems:'center' },
  addBtnPrimary: { display:'flex', alignItems:'center', gap:'8px', backgroundColor:'#003DA5', color:'#fff', border:'none', borderRadius:'6px', padding:'10px 20px', fontSize:'14px', fontWeight:'700', cursor:'pointer', fontFamily:"'Inter',sans-serif" },
  addBtn: { display:'flex', alignItems:'center', gap:'8px', border:'1px dashed #D1D5DB', backgroundColor:'transparent', borderRadius:'8px', padding:'12px 20px', fontSize:'13px', fontWeight:'600', cursor:'pointer', fontFamily:"'Inter',sans-serif", color:'#374151', width:'100%', justifyContent:'center' },
}
