import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Loader2, User, Users } from 'lucide-react'

/* ─── Input generico ─── */
function Inp({ label, required, value, onChange, type = 'text', placeholder, error }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label style={{ fontSize: '13px', fontWeight: '600', color: '#0A0A0A' }}>
        {label}{required && <span style={{ color: '#DC2626' }}> *</span>}
      </label>
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{
          padding: '10px 12px',
          border: `1px solid ${error ? '#DC2626' : '#D1D5DB'}`,
          borderRadius: '6px', fontSize: '14px',
          fontFamily: "'Inter',sans-serif", outline: 'none',
          boxSizing: 'border-box', width: '100%',
        }}
        onFocus={e => (e.target.style.borderColor = '#003DA5')}
        onBlur={e => (e.target.style.borderColor = error ? '#DC2626' : '#D1D5DB')}
      />
      {error && <span style={{ fontSize: '12px', color: '#DC2626' }}>{error}</span>}
    </div>
  )
}

/* ─── Valore persona vuoto in base ai campi ─── */
function emptyPersona(campi) {
  const obj = {}
  campi.forEach(c => { obj[c.colonna_db] = '' })
  return obj
}

/* ─── Valida una persona in base alla config dei campi ─── */
function validatePersona(dati, campi) {
  const errors = {}
  campi.forEach(c => {
    if (!c.visibile) return
    const val = dati[c.colonna_db] || ''
    if (c.obbligatorio && !val.trim()) {
      errors[c.colonna_db] = 'Obbligatorio'
    }
    if (c.tipo === 'email' && val && !/\S+@\S+\.\S+/.test(val)) {
      errors[c.colonna_db] = 'Email non valida'
    }
  })
  return errors
}

/* ─── Blocco dati singola persona ─── */
function PersonaForm({ idx, dati, onChange, errors, campi, mestieri, isAccompagnatore }) {
  return (
    <div style={{
      border: `1px solid ${isAccompagnatore ? '#E5E7EB' : '#003DA5'}`,
      borderRadius: '10px', padding: '16px', marginBottom: '16px',
      background: isAccompagnatore ? '#FAFAFA' : '#EEF3FF',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '50%',
          background: isAccompagnatore ? '#E5E7EB' : '#003DA5',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {isAccompagnatore ? <User size={14} color="#6B7280" /> : <Users size={14} color="#fff" />}
        </div>
        <span style={{ fontSize: '13px', fontWeight: '700', color: isAccompagnatore ? '#374151' : '#003DA5' }}>
          {isAccompagnatore ? `Accompagnatore ${idx}` : 'Intestatario'}
        </span>
      </div>

      <div style={s.grid}>
        {campi.filter(c => c.visibile).map(c => {
          const val = dati[c.colonna_db] || ''
          const err = errors[c.colonna_db] || ''
          const set = e => onChange(idx, c.colonna_db, e.target.value)

          // Categoria professionale
          if (c.colonna_db === 'mestiere_id') {
            return (
              <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#0A0A0A' }}>
                  {c.label}{c.obbligatorio && <span style={{ color: '#DC2626' }}> *</span>}
                </label>
                <select
                  value={val} onChange={set}
                  key={mestieri.length}
                  style={{
                    padding: '10px 12px',
                    border: `1px solid ${err ? '#DC2626' : '#D1D5DB'}`,
                    borderRadius: '6px', fontSize: '14px',
                    fontFamily: "'Inter',sans-serif", outline: 'none', backgroundColor: '#FFF',
                  }}
                >
                  <option value="">— Seleziona —</option>
                  {mestieri.map(m => <option key={m.id} value={String(m.id)}>{m.nome}</option>)}
                </select>
                {err && <span style={{ fontSize: '12px', color: '#DC2626' }}>{err}</span>}
              </div>
            )
          }

          // Checkbox
          if (c.tipo === 'checkbox') {
            return (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0' }}>
                <input
                  type="checkbox" checked={val === 'true'}
                  onChange={e => onChange(idx, c.colonna_db, e.target.checked ? 'true' : '')}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label style={{ fontSize: '14px', color: '#0A0A0A', cursor: 'pointer' }}>
                  {c.label}{c.obbligatorio && <span style={{ color: '#DC2626' }}> *</span>}
                </label>
                {err && <span style={{ fontSize: '12px', color: '#DC2626' }}>{err}</span>}
              </div>
            )
          }

          // Select con opzioni personalizzate
          if (c.tipo === 'select' && c.opzioni?.choices) {
            return (
              <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#0A0A0A' }}>
                  {c.label}{c.obbligatorio && <span style={{ color: '#DC2626' }}> *</span>}
                </label>
                <select value={val} onChange={set} style={{
                  padding: '10px 12px', border: `1px solid ${err ? '#DC2626' : '#D1D5DB'}`,
                  borderRadius: '6px', fontSize: '14px', fontFamily: "'Inter',sans-serif",
                  outline: 'none', backgroundColor: '#FFF',
                }}>
                  <option value="">— Seleziona —</option>
                  {c.opzioni.choices.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                {err && <span style={{ fontSize: '12px', color: '#DC2626' }}>{err}</span>}
              </div>
            )
          }

          // Data
          if (c.tipo === 'data') {
            return (
              <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#0A0A0A' }}>
                  {c.label}{c.obbligatorio && <span style={{ color: '#DC2626' }}> *</span>}
                </label>
                <input type="date" value={val} onChange={set} style={{
                  padding: '10px 12px', border: `1px solid ${err ? '#DC2626' : '#D1D5DB'}`,
                  borderRadius: '6px', fontSize: '14px', fontFamily: "'Inter',sans-serif",
                  outline: 'none', width: '100%', boxSizing: 'border-box',
                }} />
                {err && <span style={{ fontSize: '12px', color: '#DC2626' }}>{err}</span>}
              </div>
            )
          }

          // Default: testo/email/telefono/numero
          const inputType = c.tipo === 'email' ? 'email' : c.tipo === 'numero' ? 'number' : c.tipo === 'telefono' ? 'tel' : 'text'
          // Occupa tutta la larghezza per email e campi singoli
          const fullWidth = ['email','ragione_sociale','partita_iva'].includes(c.colonna_db)
          return (
            <div key={c.id} style={{ gridColumn: fullWidth ? '1/-1' : undefined }}>
              <Inp
                label={c.label} required={c.obbligatorio}
                type={inputType} value={val} onChange={set} error={err}
                placeholder={
                  c.colonna_db === 'email' ? 'mario.rossi@example.it' :
                  c.colonna_db === 'cap' ? '00100' :
                  c.colonna_db === 'cellulare' ? '333 1234567' :
                  c.colonna_db === 'partita_iva' ? '12345670015' : ''
                }
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── FORM ISCRIZIONE PRINCIPALE ─── */
export default function FormIscrizione({ event, onSuccess }) {
  const postiPerUtente = event.posti_per_utente || 1

  const [mestieri, setMestieri] = useState([])
  const [campi,    setCampi]    = useState([])
  const [persone,  setPersone]  = useState([])
  const [errors,   setErrors]   = useState([])
  const [loading,  setLoading]  = useState(false)
  const [errGen,   setErrGen]   = useState('')

  useEffect(() => {
    Promise.all([
      supabase.from('mestieri').select('id,nome').eq('attivo', true).order('ordine'),
      supabase.from('form_fields').select('*').eq('event_id', event.id).eq('visibile', true).order('ordine'),
    ]).then(([{ data: m }, { data: f }]) => {
      setMestieri(m || [])
      const campiAttivi = f && f.length > 0 ? f : defaultCampi
      setCampi(campiAttivi)
      const empty = emptyPersona(campiAttivi)
      setPersone(Array.from({ length: postiPerUtente }, () => ({ ...empty })))
      setErrors(Array.from({ length: postiPerUtente }, () => ({})))
    })
  }, [event.id])

  function handleChange(idx, key, value) {
    setPersone(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], [key]: value }
      return next
    })
    setErrors(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], [key]: '' }
      return next
    })
  }

  async function submit(e) {
    e.preventDefault()
    setErrGen('')

    const newErrors = persone.map(p => validatePersona(p, campi))
    if (newErrors.some(e => Object.keys(e).length > 0)) { setErrors(newErrors); return }

    setLoading(true)
    try {
      const { data: codiceData } = await supabase.rpc('genera_codice_iscrizione', { p_event_id: event.id })
      const codiceBase = codiceData || ('EVT-' + Date.now().toString(36).toUpperCase())
      const suffissi   = ['', '-B', '-C', '-D', '-E', '-F', '-G', '-H', '-I', '-J']

      // Costruisce payload da campi dinamici
      function buildPayload(dati) {
        const payload = { event_id: event.id, stato: 'confermato', presente: false }
        campi.forEach(c => {
          if (!c.visibile) return
          if (c.colonna_db === 'mestiere_id') {
            payload.mestiere_id = dati.mestiere_id || null
          } else {
            payload[c.colonna_db] = dati[c.colonna_db]?.trim() || null
          }
        })
        return payload
      }

      const { data: qrData0 } = await supabase.rpc('generate_qr_token')
      const { data: reg0, error: err0 } = await supabase.from('registrations').insert({
        ...buildPayload(persone[0]),
        qr_code: qrData0 || ('QR-' + Math.random().toString(36).slice(2,10).toUpperCase()),
        codice_iscrizione: codiceBase,
      }).select().single()

      if (err0) throw new Error(err0.message)

      for (let i = 1; i < persone.length; i++) {
        const { data: qrAcc } = await supabase.rpc('generate_qr_token')
        await supabase.from('registrations').insert({
          ...buildPayload(persone[i]),
          qr_code: qrAcc || ('QR-' + Math.random().toString(36).slice(2,10).toUpperCase()),
          codice_iscrizione: codiceBase + suffissi[i],
          gruppo_id: reg0.id,
        })
      }

      onSuccess?.({
        id: reg0.id, qr_code: reg0.qr_code, codice_iscrizione: codiceBase,
        nome: persone[0].nome?.trim(), cognome: persone[0].cognome?.trim(),
        email: persone[0].email?.trim(), accompagnatori: persone.length - 1,
      })
    } catch (err) {
      setErrGen(err.message?.includes('capienza_esaurita')
        ? 'Spiacenti, i posti disponibili sono esauriti.'
        : 'Errore durante la registrazione. Riprova.')
      setLoading(false)
    }
  }

  if (campi.length === 0) return null

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {errGen && <div style={s.errBox}>{errGen}</div>}

      {postiPerUtente > 1 && (
        <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Users size={18} style={{ color: '#16A34A', flexShrink: 0 }} />
          <p style={{ fontSize: '13px', color: '#166534', margin: 0, fontWeight: '600' }}>
            Puoi prenotare fino a <strong>{postiPerUtente} posti</strong>. Compila i dati di ogni partecipante.
          </p>
        </div>
      )}

      {persone.map((dati, idx) => (
        <PersonaForm
          key={idx} idx={idx} dati={dati}
          onChange={handleChange} errors={errors[idx] || {}}
          campi={campi} mestieri={mestieri}
          isAccompagnatore={idx > 0}
        />
      ))}

      <button type="submit" disabled={loading} style={{ ...s.submitBtn, opacity: loading ? 0.7 : 1 }}>
        {loading
          ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Invio in corso…</>
          : postiPerUtente > 1
          ? `Conferma iscrizione (${postiPerUtente} posti) →`
          : 'Conferma iscrizione →'}
      </button>

      <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '8px 0 0', textAlign: 'center' }}>
        I dati saranno trattati nel rispetto del GDPR.
      </p>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </form>
  )
}

/* Campi di fallback se non ci sono form_fields nel DB */
const defaultCampi = [
  { id:'d1', colonna_db:'nome',            label:'Nome',                   tipo:'testo',   obbligatorio:true,  visibile:true, ordine:1 },
  { id:'d2', colonna_db:'cognome',         label:'Cognome',                tipo:'testo',   obbligatorio:true,  visibile:true, ordine:2 },
  { id:'d3', colonna_db:'email',           label:'Email',                  tipo:'email',   obbligatorio:true,  visibile:true, ordine:3 },
  { id:'d4', colonna_db:'cellulare',       label:'Cellulare',              tipo:'telefono',obbligatorio:true,  visibile:true, ordine:4 },
  { id:'d5', colonna_db:'cap',             label:'CAP',                    tipo:'testo',   obbligatorio:true,  visibile:true, ordine:5 },
  { id:'d6', colonna_db:'ragione_sociale', label:'Ragione Sociale',        tipo:'testo',   obbligatorio:true,  visibile:true, ordine:6 },
  { id:'d7', colonna_db:'partita_iva',     label:'Partita IVA',            tipo:'testo',   obbligatorio:true,  visibile:true, ordine:7 },
  { id:'d8', colonna_db:'mestiere_id',     label:'Categoria professionale',tipo:'select',  obbligatorio:true,  visibile:true, ordine:8 },
]

const s = {
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  errBox: { backgroundColor:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'6px', padding:'10px 14px', fontSize:'14px', color:'#DC2626', marginBottom:'12px' },
  submitBtn: { marginTop:'8px', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', backgroundColor:'#003DA5', color:'#FFFFFF', border:'none', borderRadius:'6px', padding:'14px 24px', fontSize:'15px', fontWeight:'700', fontFamily:"'Inter',sans-serif", cursor:'pointer', letterSpacing:'-0.01em', transition:'opacity 0.15s' },
}
