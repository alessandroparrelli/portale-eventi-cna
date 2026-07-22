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
          fontFamily: "'Outfit',sans-serif", outline: 'none',
          boxSizing: 'border-box', width: '100%', minWidth: 0,
        }}
        onFocus={e => (e.target.style.borderColor = '#E11D48')}
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
function validateEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
}
function validatePhone(v) {
  return /^[\d\s\-\+\(\)]{7,15}$/.test(v)
}
function validatePIVA(v) {
  const p = v.replace(/\s/g,'')
  return /^\d{11}$/.test(p)
}
function validateCAP(v) {
  return /^\d{5}$/.test(v.trim())
}

function validatePersona(dati, campi) {
  const errors = {}
  const pIvaObbligatoria = isImprenditore(dati, campi)
  campi.forEach(c => {
    if (!c.visibile) return
    // P.IVA nascosta se non imprenditore: salta validazione
    if (c.colonna_db === 'partita_iva' && !pIvaObbligatoria) return
    const val = (dati[c.colonna_db] || '').toString()
    const obbligatorio = c.colonna_db === 'partita_iva' ? pIvaObbligatoria : c.obbligatorio
    if (obbligatorio && !val.trim()) {
      errors[c.colonna_db] = 'Campo obbligatorio'
      return
    }
    if (!val.trim()) return
    if (c.tipo === 'email' || c.colonna_db === 'email') {
      if (!validateEmail(val)) errors[c.colonna_db] = 'Indirizzo email non valido'
    }
    if (c.tipo === 'telefono' || c.colonna_db === 'cellulare') {
      if (!validatePhone(val)) errors[c.colonna_db] = 'Numero di telefono non valido'
    }
    if (c.colonna_db === 'partita_iva') {
      if (!validatePIVA(val)) errors[c.colonna_db] = 'Partita IVA non valida (11 cifre)'
    }
    if (c.colonna_db === 'cap') {
      if (!validateCAP(val)) errors[c.colonna_db] = 'CAP non valido (5 cifre)'
    }
  })
  return errors
}

// Restituisce true se i dati richiedono P.IVA (partecipante Imprenditore)
function isImprenditore(dati, campi) {
  return campi.some(c =>
    c.tipo === 'select' &&
    c.opzioni?.choices?.some(o => /imprendit/i.test(o)) &&
    /imprendit/i.test(dati[c.colonna_db] || '')
  )
}

/* ─── Blocco dati singola persona ─── */
function PersonaForm({ idx, dati, onChange, errors, campi, mestieri, isAccompagnatore }) {
  const pIvaObbligatoria = isImprenditore(dati, campi)
  return (
    <div style={{
      border: `1px solid ${isAccompagnatore ? '#E5E7EB' : '#E11D48'}`,
      borderRadius: '10px', padding: '16px', marginBottom: '16px',
      background: isAccompagnatore ? '#FAFAFA' : '#FEE4E6',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '50%',
          background: isAccompagnatore ? '#E5E7EB' : '#E11D48',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {isAccompagnatore ? <User size={14} color="#6B7280" /> : <Users size={14} color="#fff" />}
        </div>
        <span style={{ fontSize: '13px', fontWeight: '700', color: isAccompagnatore ? '#374151' : '#E11D48' }}>
          {isAccompagnatore ? `Accompagnatore ${idx}` : 'Intestatario'}
        </span>
      </div>

      <div style={s.grid}>
        {campi.filter(c => c.visibile && !(c.colonna_db === 'partita_iva' && !pIvaObbligatoria)).map(c => {
          const val = dati[c.colonna_db] || ''
          const err = errors[c.colonna_db] || ''
          const set = e => onChange(idx, c.colonna_db, e.target.value)

          // Categoria professionale
          if (c.colonna_db === 'mestiere_id') {
            return (
              <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#0A0A0A' }}>
                  {c.label}{(c.colonna_db === 'partita_iva' ? pIvaObbligatoria : c.obbligatorio) && <span style={{ color: '#DC2626' }}> *</span>}
                </label>
                <select
                  value={val} onChange={set}
                  key={mestieri.length}
                  style={{
                    padding: '10px 12px',
                    border: `1px solid ${err ? '#DC2626' : '#D1D5DB'}`,
                    borderRadius: '6px', fontSize: '14px',
                    fontFamily: "'Outfit',sans-serif", outline: 'none', backgroundColor: '#FFF',
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
                  {c.label}{(c.colonna_db === 'partita_iva' ? pIvaObbligatoria : c.obbligatorio) && <span style={{ color: '#DC2626' }}> *</span>}
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
                  {c.label}{(c.colonna_db === 'partita_iva' ? pIvaObbligatoria : c.obbligatorio) && <span style={{ color: '#DC2626' }}> *</span>}
                </label>
                <select value={val} onChange={set} style={{
                  padding: '10px 12px', border: `1px solid ${err ? '#DC2626' : '#D1D5DB'}`,
                  borderRadius: '6px', fontSize: '14px', fontFamily: "'Outfit',sans-serif",
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
                  {c.label}{(c.colonna_db === 'partita_iva' ? pIvaObbligatoria : c.obbligatorio) && <span style={{ color: '#DC2626' }}> *</span>}
                </label>
                <input type="date" value={val} onChange={set} style={{
                  padding: '10px 12px', border: `1px solid ${err ? '#DC2626' : '#D1D5DB'}`,
                  borderRadius: '6px', fontSize: '14px', fontFamily: "'Outfit',sans-serif",
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
      // Inizializza sempre con 1 persona — l'utente può aggiungerne fino a postiPerUtente
      setPersone([{ ...empty }])
      setErrors([{}])
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

  function addPersona() {
    if (persone.length >= postiPerUtente) return
    const empty = emptyPersona(campi)
    setPersone(prev => [...prev, { ...empty }])
    setErrors(prev => [...prev, {}])
  }

  function removePersona(idx) {
    if (persone.length <= 1) return
    setPersone(prev => prev.filter((_, i) => i !== idx))
    setErrors(prev => prev.filter((_, i) => i !== idx))
  }

  async function submit(e) {
    e.preventDefault()
    setErrGen('')

    const newErrors = persone.map(p => validatePersona(p, campi))
    if (newErrors.some(e => Object.keys(e).length > 0)) { setErrors(newErrors); return }

    setLoading(true)
    try {
      // ── Controllo duplicati per ogni persona ──
      for (let i = 0; i < persone.length; i++) {
        const p = persone[i]
        const { data: dup } = await supabase.rpc('check_duplicato_iscrizione', {
          p_event_id:  event.id,
          p_nome:      p.nome?.trim()      || null,
          p_cognome:   p.cognome?.trim()   || null,
          p_email:     p.email?.trim()     || null,
          p_cellulare: p.cellulare?.trim() || null,
        })
        const d = dup?.[0]
        if (d?.duplicato) {
          const chi   = i === 0 ? 'Tu' : `La persona ${i + 1}`
          const campo = d.campo === 'email'       ? 'email'
                      : d.campo === 'nome_cognome' ? 'nome e cognome'
                      :                             'numero di cellulare'
          const msg = `${chi} result${i === 0 ? 'i' : 'a'} già iscritt${i === 0 ? 'o/a' : 'a'} a questo evento (stesso ${campo}).`
          setErrGen(msg)
          setLoading(false)
          return
        }
      }

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
      const reg0Id  = crypto.randomUUID()
      const reg0Qr  = qrData0 || ('QR-' + Math.random().toString(36).slice(2,10).toUpperCase())

      const { error: err0 } = await supabase.from('registrations').insert({
        id: reg0Id,
        ...buildPayload(persone[0]),
        qr_code: reg0Qr,
        codice_iscrizione: codiceBase,
        gruppo_id: persone.length > 1 ? reg0Id : null,
      })

      if (err0) throw new Error(err0.message)

      for (let i = 1; i < persone.length; i++) {
        const { data: qrAcc } = await supabase.rpc('generate_qr_token')
        await supabase.from('registrations').insert({
          id: crypto.randomUUID(),
          ...buildPayload(persone[i]),
          qr_code: qrAcc || ('QR-' + Math.random().toString(36).slice(2,10).toUpperCase()),
          codice_iscrizione: codiceBase + suffissi[i],
          gruppo_id: reg0Id,
          referente_id: reg0Id,
        })
      }

      onSuccess?.({
        id: reg0Id, qr_code: reg0Qr, codice_iscrizione: codiceBase,
        nome: persone[0].nome?.trim(), cognome: persone[0].cognome?.trim(),
        email: persone[0].email?.trim(), accompagnatori: persone.length - 1,
      })

      // Email conferma iscritto + notifica admin (fire-and-forget)
      const emailPayload = { iscrizione_id: reg0Id }
      supabase.functions.invoke('send-event-email', { body: { tipo: 'conferma_iscrizione', ...emailPayload } })
        .catch(e => console.warn('Email conferma fallita:', e))
      supabase.functions.invoke('send-event-email', { body: { tipo: 'notifica_admin', ...emailPayload } })
        .catch(e => console.warn('Email admin fallita:', e))
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
        <div style={{ background:'linear-gradient(135deg,#FEE4E6 0%,#E0EAFF 100%)', border:'2px solid #E11D48', borderRadius:'14px', padding:'18px 20px', marginBottom:'24px', boxShadow:'0 2px 12px rgba(0,61,165,0.10)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <div style={{ background:'#E11D48', borderRadius:'10px', padding:'8px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Users size={20} style={{ color:'#fff' }} />
              </div>
              <div>
                <p style={{ fontSize:'15px', color:'#E11D48', margin:0, fontWeight:'800', letterSpacing:'-.01em' }}>
                  Vuoi registrare più persone?
                </p>
                <p style={{ fontSize:'12px', color:'#6B7280', margin:'2px 0 0' }}>
                  Puoi aggiungere fino a <strong style={{color:'#E11D48'}}>{postiPerUtente} persone</strong> con questa iscrizione
                </p>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'12px', flexShrink:0 }}>
              <button type="button" onClick={() => removePersona(persone.length - 1)}
                disabled={persone.length <= 1}
                style={{ width:'36px', height:'36px', borderRadius:'50%', border:'2px solid', borderColor: persone.length <= 1 ? '#D1D5DB' : '#E11D48', background: persone.length <= 1 ? '#F3F4F6' : '#fff', cursor: persone.length <= 1 ? 'not-allowed' : 'pointer', fontSize:'20px', fontWeight:'700', color: persone.length <= 1 ? '#D1D5DB' : '#E11D48', display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1, transition:'all .15s' }}>
                −
              </button>
              <span style={{ fontSize:'28px', fontWeight:'900', color:'#E11D48', minWidth:'28px', textAlign:'center', letterSpacing:'-.02em' }}>
                {persone.length}
              </span>
              <button type="button" onClick={addPersona}
                disabled={persone.length >= postiPerUtente}
                style={{ width:'36px', height:'36px', borderRadius:'50%', border:'2px solid', borderColor: persone.length >= postiPerUtente ? '#D1D5DB' : '#E11D48', background: persone.length >= postiPerUtente ? '#F3F4F6' : '#E11D48', cursor: persone.length >= postiPerUtente ? 'not-allowed' : 'pointer', fontSize:'20px', fontWeight:'700', color: persone.length >= postiPerUtente ? '#D1D5DB' : '#fff', display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1, transition:'all .15s' }}>
                +
              </button>
            </div>
          </div>
        </div>
      )}

      {persone.map((dati, idx) => (
        <div key={idx} style={{ position:'relative' }}>
          {idx > 0 && (
            <button type="button" onClick={() => removePersona(idx)}
              style={{ position:'absolute', top:'16px', right:'16px', zIndex:1, background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'6px', padding:'4px 10px', fontSize:'12px', color:'#DC2626', fontWeight:'600', cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
              Rimuovi
            </button>
          )}
          <PersonaForm
            key={idx} idx={idx} dati={dati}
            onChange={handleChange} errors={errors[idx] || {}}
            campi={campi} mestieri={mestieri}
            isAccompagnatore={idx > 0}
          />
        </div>
      ))}

      <button type="submit" disabled={loading} style={{ ...s.submitBtn, opacity: loading ? 0.7 : 1 }}>
        {loading
          ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Invio in corso…</>
          : persone.length > 1
          ? `Conferma iscrizione (${persone.length} person${persone.length === 1 ? 'a' : 'e'}) →`
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
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' },
  errBox: { backgroundColor:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'6px', padding:'10px 14px', fontSize:'14px', color:'#DC2626', marginBottom:'12px' },
  submitBtn: { marginTop:'8px', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', backgroundColor:'#E11D48', color:'#FFFFFF', border:'none', borderRadius:'6px', padding:'14px 24px', fontSize:'15px', fontWeight:'700', fontFamily:"'Outfit',sans-serif", cursor:'pointer', letterSpacing:'-0.01em', transition:'opacity 0.15s' },
}
