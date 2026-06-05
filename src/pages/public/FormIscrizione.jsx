import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { CheckCircle2, Loader2 } from 'lucide-react'

function Inp({ label, required, value, onChange, type='text', placeholder, error }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
      <label style={{ fontSize:'13px', fontWeight:'600', color:'#0A0A0A' }}>
        {label}{required && <span style={{ color:'#DC2626' }}> *</span>}
      </label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{ padding:'10px 12px', border:`1px solid ${error?'#DC2626':'#D1D5DB'}`, borderRadius:'4px',
          fontSize:'14px', fontFamily:"'Inter',sans-serif", outline:'none', boxSizing:'border-box', width:'100%' }}
        onFocus={e=>(e.target.style.borderColor='#003DA5')}
        onBlur={e=>(e.target.style.borderColor=error?'#DC2626':'#D1D5DB')}/>
      {error && <span style={{ fontSize:'12px', color:'#DC2626' }}>{error}</span>}
    </div>
  )
}

export default function FormIscrizione({ event, onSuccess }) {
  const [mestieri, setMestieri] = useState([])
  const [fields, setFields] = useState([])
  const [form, setForm] = useState({
    nome:'', cognome:'', ragione_sociale:'', partita_iva:'',
    email:'', cellulare:'', mestiere_id:'', cap:'',
  })
  const [extras, setExtras] = useState({})
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [submittedName, setSubmittedName] = useState('')

  useEffect(() => {
    supabase.from('mestieri').select('id,nome').eq('attivo',true).order('ordine')
      .then(({data})=>setMestieri(data||[]))
    supabase.from('form_fields').select('*').eq('event_id',event.id).order('ordine')
      .then(({data})=>setFields(data||[]))
  }, [event.id])

  function set(k){ return e => setForm(p=>({...p,[k]:e.target.value})) }

  function validate() {
    const e = {}
    if (!form.nome.trim()) e.nome = 'Obbligatorio'
    if (!form.cognome.trim()) e.cognome = 'Obbligatorio'
    if (!form.email.trim()) e.email = 'Obbligatorio'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email non valida'
    if (!form.mestiere_id) e.mestiere_id = 'Seleziona una categoria'
    fields.filter(f=>f.obbligatorio).forEach(f=>{
      if (!extras[f.id]?.trim()) e[`extra_${f.id}`] = 'Obbligatorio'
    })
    return e
  }

  async function submit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    setErrors({})

    // Genera QR unico
    const { data: qrData } = await supabase.rpc('generate_qr_token')
    const qr_code = qrData || ('QR-' + Math.random().toString(36).slice(2,10).toUpperCase())

    const { data: reg, error } = await supabase.from('registrations').insert({
      event_id: event.id,
      qr_code,
      stato: 'confermato',
      presente: false,
      nome: form.nome.trim(),
      cognome: form.cognome.trim(),
      ragione_sociale: form.ragione_sociale || null,
      partita_iva: form.partita_iva || null,
      email: form.email.trim(),
      cellulare: form.cellulare || null,
      mestiere_id: form.mestiere_id || null,
      cap: form.cap || null,
    }).select().single()

    if (error) {
      setErrors({ general: 'Errore durante la registrazione. Riprova.' })
      setLoading(false)
      return
    }

    // Salva risposte campi custom
    if (fields.length > 0) {
      const answers = fields.filter(f=>extras[f.id]).map(f=>({
        registration_id: reg.id, field_id: f.id, valore: extras[f.id]
      }))
      if (answers.length) await supabase.from('registration_answers').insert(answers)
    }

    setSubmittedName(form.nome)
    setLoading(false)
    setSuccess(true)
    onSuccess?.()
  }

  if (success) return (
    <div style={s.successBox}>
      <CheckCircle2 size={48} style={{ color:'#16A34A', marginBottom:'16px' }}/>
      <h3 style={{ fontSize:'22px', fontWeight:'900', color:'#0A0A0A', letterSpacing:'-0.03em', margin:'0 0 8px' }}>
        Iscrizione confermata, {submittedName}!
      </h3>
      <p style={{ fontSize:'14px', color:'#6B7280', margin:0, lineHeight:'1.6' }}>
        La tua iscrizione è stata registrata. Riceverai a breve una email di conferma con il tuo QR Code personale da presentare il giorno dell'evento.
      </p>
    </div>
  )

  return (
    <form onSubmit={submit} style={s.form}>
      {errors.general && (
        <div style={s.errBox}>{errors.general}</div>
      )}

      <div style={s.grid}>
        <Inp label="Nome" required value={form.nome} onChange={set('nome')} placeholder="Mario" error={errors.nome}/>
        <Inp label="Cognome" required value={form.cognome} onChange={set('cognome')} placeholder="Rossi" error={errors.cognome}/>
        <div style={{ gridColumn:'1/-1' }}>
          <Inp label="Email" required type="email" value={form.email} onChange={set('email')} placeholder="mario.rossi@example.it" error={errors.email}/>
        </div>
        <Inp label="Cellulare" value={form.cellulare} onChange={set('cellulare')} placeholder="333 1234567"/>
        <Inp label="CAP" value={form.cap} onChange={set('cap')} placeholder="00100"/>
        <div style={{ gridColumn:'1/-1' }}>
          <Inp label="Ragione Sociale / Azienda" value={form.ragione_sociale} onChange={set('ragione_sociale')} placeholder="es. Rossi Falegnameria Srl"/>
        </div>
        <Inp label="Partita IVA" value={form.partita_iva} onChange={set('partita_iva')} placeholder="12345670015"/>

        {/* Mestiere */}
        <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
          <label style={{ fontSize:'13px', fontWeight:'600', color:'#0A0A0A' }}>
            Categoria professionale <span style={{ color:'#DC2626' }}>*</span>
          </label>
          <select value={form.mestiere_id} onChange={set('mestiere_id')}
            style={{ padding:'10px 12px', border:`1px solid ${errors.mestiere_id?'#DC2626':'#D1D5DB'}`, borderRadius:'4px',
              fontSize:'14px', fontFamily:"'Inter',sans-serif", outline:'none', backgroundColor:'#FFF' }}>
            <option value="">— Seleziona —</option>
            {mestieri.map(m=><option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
          {errors.mestiere_id && <span style={{ fontSize:'12px', color:'#DC2626' }}>{errors.mestiere_id}</span>}
        </div>
      </div>

      {/* Campi extra dinamici */}
      {fields.map(f=>(
        <div key={f.id} style={{ marginTop:'12px', display:'flex', flexDirection:'column', gap:'4px' }}>
          <label style={{ fontSize:'13px', fontWeight:'600', color:'#0A0A0A' }}>
            {f.label}{f.obbligatorio && <span style={{ color:'#DC2626' }}> *</span>}
          </label>
          {f.tipo === 'select' ? (
            <select value={extras[f.id]||''} onChange={e=>setExtras(p=>({...p,[f.id]:e.target.value}))}
              style={{ padding:'10px 12px', border:`1px solid ${errors[`extra_${f.id}`]?'#DC2626':'#D1D5DB'}`, borderRadius:'4px', fontSize:'14px', fontFamily:"'Inter',sans-serif", outline:'none' }}>
              <option value="">— Seleziona —</option>
              {(f.opzioni||[]).map(o=><option key={o} value={o}>{o}</option>)}
            </select>
          ) : f.tipo === 'checkbox' ? (
            <label style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer' }}>
              <input type="checkbox" checked={!!extras[f.id]}
                onChange={e=>setExtras(p=>({...p,[f.id]:e.target.checked?'si':''}))}
                style={{ width:'16px', height:'16px', accentColor:'#003DA5' }}/>
              <span style={{ fontSize:'14px', color:'#374151' }}>{f.label}</span>
            </label>
          ) : (
            <input type={f.tipo==='email'?'email':f.tipo==='telefono'?'tel':f.tipo==='numero'?'number':f.tipo==='data'?'date':'text'}
              value={extras[f.id]||''} onChange={e=>setExtras(p=>({...p,[f.id]:e.target.value}))}
              style={{ padding:'10px 12px', border:`1px solid ${errors[`extra_${f.id}`]?'#DC2626':'#D1D5DB'}`, borderRadius:'4px',
                fontSize:'14px', fontFamily:"'Inter',sans-serif", outline:'none' }}/>
          )}
          {errors[`extra_${f.id}`] && <span style={{ fontSize:'12px', color:'#DC2626' }}>{errors[`extra_${f.id}`]}</span>}
        </div>
      ))}

      <button type="submit" disabled={loading} style={s.submitBtn}>
        {loading ? <><Loader2 size={18} style={{ animation:'spin 1s linear infinite' }}/> Invio in corso…</> : 'Conferma iscrizione →'}
      </button>

      <p style={{ fontSize:'12px', color:'#9CA3AF', margin:'8px 0 0', textAlign:'center' }}>
        I tuoi dati verranno trattati nel rispetto del GDPR. Riceverai una email di conferma.
      </p>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </form>
  )
}

const s = {
  form: { display:'flex', flexDirection:'column', gap:'0' },
  grid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px' },
  errBox: { backgroundColor:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'4px', padding:'10px 14px', fontSize:'14px', color:'#DC2626', marginBottom:'12px' },
  submitBtn: { marginTop:'20px', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
    backgroundColor:'#003DA5', color:'#FFFFFF', border:'none', borderRadius:'4px', padding:'14px 24px',
    fontSize:'15px', fontWeight:'700', fontFamily:"'Inter',sans-serif", cursor:'pointer', letterSpacing:'-0.01em' },
  successBox: { padding:'32px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center',
    backgroundColor:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:'8px' },
}
