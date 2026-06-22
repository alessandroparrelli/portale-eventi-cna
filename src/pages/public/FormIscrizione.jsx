import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Loader2, User, Users } from 'lucide-react'

/* ─── Campo input riutilizzabile ─── */
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

/* ─── Blocco dati singola persona ─── */
function PersonaForm({ idx, data, onChange, errors, mestieri, isAccompagnatore }) {
  const set = k => e => onChange(idx, k, e.target.value)
  const label = isAccompagnatore
    ? `Accompagnatore ${idx}`
    : 'Intestatario'

  return (
    <div style={{
      border: `1px solid ${isAccompagnatore ? '#E5E7EB' : '#003DA5'}`,
      borderRadius: '10px',
      padding: '16px',
      marginBottom: '16px',
      background: isAccompagnatore ? '#FAFAFA' : '#EEF3FF',
    }}>
      {/* Header persona */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '50%',
          background: isAccompagnatore ? '#E5E7EB' : '#003DA5',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {isAccompagnatore
            ? <User size={14} color="#6B7280" />
            : <Users size={14} color="#fff" />}
        </div>
        <span style={{
          fontSize: '13px', fontWeight: '700',
          color: isAccompagnatore ? '#374151' : '#003DA5',
          letterSpacing: '-.01em',
        }}>
          {label}
        </span>
      </div>

      <div style={s.grid}>
        <Inp label="Nome"    required value={data.nome}    onChange={set('nome')}    placeholder="Mario"  error={errors.nome} />
        <Inp label="Cognome" required value={data.cognome} onChange={set('cognome')} placeholder="Rossi"  error={errors.cognome} />

        <div style={{ gridColumn: '1/-1' }}>
          <Inp label="Email" required type="email" value={data.email} onChange={set('email')}
            placeholder="mario.rossi@example.it" error={errors.email} />
        </div>

        <Inp label="Cellulare" required value={data.cellulare} onChange={set('cellulare')} placeholder="333 1234567" error={errors.cellulare} />
        <Inp label="CAP"       required value={data.cap}       onChange={set('cap')}       placeholder="00100"       error={errors.cap} />

        <div style={{ gridColumn: '1/-1' }}>
          <Inp label="Ragione Sociale / Azienda" required value={data.ragione_sociale}
            onChange={set('ragione_sociale')} placeholder="es. Rossi Falegnameria Srl" error={errors.ragione_sociale} />
        </div>

        <Inp label="Partita IVA" required value={data.partita_iva} onChange={set('partita_iva')} placeholder="12345670015" error={errors.partita_iva} />

        {/* Categoria professionale */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#0A0A0A' }}>
            Categoria professionale <span style={{ color: '#DC2626' }}>*</span>
          </label>
          <select
            value={data.mestiere_id}
            onChange={set('mestiere_id')}
            key={mestieri.length}
            style={{
              padding: '10px 12px',
              border: `1px solid ${errors.mestiere_id ? '#DC2626' : '#D1D5DB'}`,
              borderRadius: '6px', fontSize: '14px',
              fontFamily: "'Inter',sans-serif", outline: 'none',
              backgroundColor: '#FFF',
            }}
          >
            <option value="">— Seleziona —</option>
            {mestieri.map(m => <option key={m.id} value={String(m.id)}>{m.nome}</option>)}
          </select>
          {errors.mestiere_id && <span style={{ fontSize: '12px', color: '#DC2626' }}>{errors.mestiere_id}</span>}
        </div>
      </div>
    </div>
  )
}

/* ─── Valore persona vuoto ─── */
function emptyPersona() {
  return { nome: '', cognome: '', email: '', cellulare: '', cap: '', ragione_sociale: '', partita_iva: '', mestiere_id: '' }
}

/* ─── Validazione singola persona ─── */
function validatePersona(p) {
  const e = {}
  if (!p.nome.trim())            e.nome            = 'Obbligatorio'
  if (!p.cognome.trim())         e.cognome         = 'Obbligatorio'
  if (!p.email.trim())           e.email           = 'Obbligatorio'
  else if (!/\S+@\S+\.\S+/.test(p.email)) e.email = 'Email non valida'
  if (!p.cellulare.trim())       e.cellulare       = 'Obbligatorio'
  if (!p.cap.trim())             e.cap             = 'Obbligatorio'
  if (!p.ragione_sociale.trim()) e.ragione_sociale = 'Obbligatorio'
  if (!p.partita_iva.trim())     e.partita_iva     = 'Obbligatorio'
  if (!p.mestiere_id)            e.mestiere_id     = 'Seleziona una categoria'
  return e
}

/* ─── FORM ISCRIZIONE ─── */
export default function FormIscrizione({ event, onSuccess }) {
  const postiPerUtente = event.posti_per_utente || 1

  const [mestieri, setMestieri] = useState([])
  const [fields,   setFields]   = useState([])

  // Array di persone: [intestatario, accompagnatore1, ...]
  const [persone, setPersone] = useState(
    Array.from({ length: postiPerUtente }, () => emptyPersona())
  )
  const [errors,  setErrors]  = useState(Array.from({ length: postiPerUtente }, () => ({})))
  const [loading, setLoading] = useState(false)
  const [errGen,  setErrGen]  = useState('')

  useEffect(() => {
    supabase.from('mestieri').select('id,nome').eq('attivo', true).order('ordine')
      .then(({ data }) => setMestieri(data || []))
    supabase.from('form_fields').select('*').eq('event_id', event.id).order('ordine')
      .then(({ data }) => setFields(data || []))
  }, [event.id])

  function handleChange(idx, key, value) {
    setPersone(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], [key]: value }
      return next
    })
    // Azzera errore al cambiamento
    setErrors(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], [key]: '' }
      return next
    })
  }

  async function submit(e) {
    e.preventDefault()
    setErrGen('')

    // Valida tutte le persone
    const newErrors = persone.map(p => validatePersona(p))
    const hasErrors = newErrors.some(e => Object.keys(e).length > 0)
    if (hasErrors) { setErrors(newErrors); return }

    setLoading(true)

    try {
      // Genera codice iscrizione per l'intestatario
      const { data: codiceData } = await supabase.rpc('genera_codice_iscrizione', { p_event_id: event.id })
      const codiceBase = codiceData || ('EVT-' + Date.now().toString(36).toUpperCase())

      // Genera QR per ogni persona
      const suffissi = ['', '-B', '-C', '-D', '-E', '-F', '-G', '-H', '-I', '-J']

      // Inserisce l'intestatario per primo
      const intestatario = persone[0]
      const { data: qrData0 } = await supabase.rpc('generate_qr_token')
      const qr0 = qrData0 || ('QR-' + Math.random().toString(36).slice(2, 10).toUpperCase())

      const { data: reg0, error: err0 } = await supabase.from('registrations').insert({
        event_id:        event.id,
        qr_code:         qr0,
        codice_iscrizione: codiceBase,
        stato:           'confermato',
        presente:        false,
        nome:            intestatario.nome.trim(),
        cognome:         intestatario.cognome.trim(),
        ragione_sociale: intestatario.ragione_sociale || null,
        partita_iva:     intestatario.partita_iva     || null,
        email:           intestatario.email.trim(),
        cellulare:       intestatario.cellulare       || null,
        mestiere_id:     intestatario.mestiere_id     || null,
        cap:             intestatario.cap             || null,
      }).select().single()

      if (err0) throw new Error(err0.message)

      // Inserisce gli accompagnatori
      for (let i = 1; i < persone.length; i++) {
        const acc = persone[i]
        const { data: qrAcc } = await supabase.rpc('generate_qr_token')
        const qrA = qrAcc || ('QR-' + Math.random().toString(36).slice(2, 10).toUpperCase())

        await supabase.from('registrations').insert({
          event_id:          event.id,
          qr_code:           qrA,
          codice_iscrizione: codiceBase + suffissi[i],
          gruppo_id:         reg0.id,  // collega all'intestatario
          stato:             'confermato',
          presente:          false,
          nome:              acc.nome.trim(),
          cognome:           acc.cognome.trim(),
          ragione_sociale:   acc.ragione_sociale || null,
          partita_iva:       acc.partita_iva     || null,
          email:             acc.email.trim(),
          cellulare:         acc.cellulare       || null,
          mestiere_id:       acc.mestiere_id     || null,
          cap:               acc.cap             || null,
        })
      }

      // Passa i dati alla modale di conferma
      onSuccess?.({
        id:                reg0.id,
        qr_code:           reg0.qr_code,
        codice_iscrizione: codiceBase,
        nome:              intestatario.nome.trim(),
        cognome:           intestatario.cognome.trim(),
        email:             intestatario.email.trim(),
        accompagnatori:    persone.length - 1,
      })

    } catch (err) {
      if (err.message?.includes('capienza_esaurita')) {
        setErrGen('Spiacenti, i posti disponibili sono esauriti.')
      } else {
        setErrGen('Errore durante la registrazione. Riprova.')
      }
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {errGen && (
        <div style={s.errBox}>{errGen}</div>
      )}

      {/* Header multi-posto */}
      {postiPerUtente > 1 && (
        <div style={{
          background: '#F0FDF4', border: '1px solid #86EFAC',
          borderRadius: '8px', padding: '12px 16px', marginBottom: '16px',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <Users size={18} style={{ color: '#16A34A', flexShrink: 0 }} />
          <p style={{ fontSize: '13px', color: '#166534', margin: 0, fontWeight: '600' }}>
            Puoi prenotare fino a <strong>{postiPerUtente} posti</strong>. Compila i dati di ogni partecipante.
            {postiPerUtente > 1 && ' Gli accompagnatori condivideranno il tuo stesso codice iscrizione con un suffisso (-B, -C…).'}
          </p>
        </div>
      )}

      {/* Blocchi persona */}
      {persone.map((persona, idx) => (
        <PersonaForm
          key={idx}
          idx={idx}
          data={persona}
          onChange={handleChange}
          errors={errors[idx] || {}}
          mestieri={mestieri}
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
        I dati saranno trattati nel rispetto del GDPR. Riceverai una email di conferma.
      </p>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </form>
  )
}

const s = {
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '4px' },
  errBox: {
    backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px',
    padding: '10px 14px', fontSize: '14px', color: '#DC2626', marginBottom: '12px',
  },
  submitBtn: {
    marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '8px', backgroundColor: '#003DA5', color: '#FFFFFF', border: 'none', borderRadius: '6px',
    padding: '14px 24px', fontSize: '15px', fontWeight: '700',
    fontFamily: "'Inter',sans-serif", cursor: 'pointer',
    letterSpacing: '-0.01em', transition: 'opacity 0.15s',
  },
}
