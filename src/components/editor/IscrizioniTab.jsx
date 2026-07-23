import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Trash2, GripVertical, AlertCircle, Save, Check } from 'lucide-react'

/* ─── Campi fissi — sempre visibili e obbligatori ─────────────── */
const CAMPI_FISSI = ['nome', 'cognome', 'email']

/* ─── Toggle switch ─────────────────────────────────────────────── */
function Toggle({ on, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!on)}
      disabled={disabled}
      aria-checked={on}
      style={{
        width: '38px', height: '20px', borderRadius: '10px',
        border: 'none', flexShrink: 0,
        background: on ? '#E11D48' : '#D1D5DB',
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative', transition: 'background .2s',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <span style={{
        position: 'absolute', top: '2px',
        left: on ? '20px' : '2px', transition: 'left .15s',
        width: '16px', height: '16px', borderRadius: '50%',
        background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.25)',
      }} />
    </button>
  )
}

/* ─── Riga campo standard ─────────────────────────────────────── */
function RigaCampo({ campo, onChange }) {
  const fisso = CAMPI_FISSI.includes(campo.colonna_db)
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '20px 1fr 70px 70px',
      alignItems: 'center',
      gap: '8px',
      padding: '11px 12px',
      borderBottom: '1px solid #F3F4F6',
      background: campo.visibile ? '#fff' : '#F9FAFB',
    }}>
      <GripVertical size={14} style={{ color: '#D1D5DB' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
        <span style={{ fontSize: '13px', fontWeight: '700', color: '#0A0A0A' }}>
          {campo.label}
        </span>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          <code style={{
            fontSize: '10px', color: '#9CA3AF', background: '#F3F4F6',
            borderRadius: '3px', padding: '1px 4px',
          }}>
            {campo.colonna_db}
          </code>
          {fisso && (
            <span style={{ fontSize: '10px', color: '#E11D48', background: '#FEE4E6', borderRadius: '3px', padding: '1px 5px', fontWeight: '700' }}>
              fisso
            </span>
          )}
        </div>
      </div>

      {/* Visibile */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
        <Toggle
          on={campo.visibile}
          disabled={fisso}
          onChange={v => onChange({ ...campo, visibile: v, obbligatorio: v ? campo.obbligatorio : false })}
        />
        <span style={{ fontSize: '10px', color: campo.visibile ? '#E11D48' : '#9CA3AF', fontWeight: '600' }}>
          {campo.visibile ? 'Sì' : 'No'}
        </span>
      </div>

      {/* Obbligatorio */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
        <Toggle
          on={campo.obbligatorio}
          disabled={fisso || !campo.visibile}
          onChange={v => onChange({ ...campo, obbligatorio: v })}
        />
        <span style={{ fontSize: '10px', color: campo.obbligatorio ? '#E11D48' : '#9CA3AF', fontWeight: '600' }}>
          {campo.obbligatorio ? 'Sì' : 'No'}
        </span>
      </div>
    </div>
  )
}

/* ─── Riga campo extra ─────────────────────────────────────────── */
function RigaCampoExtra({ campo, onChange, onDelete }) {
  const TIPI = ['testo','email','telefono','numero','select','checkbox','data']
  const TIPI_LABEL = { testo:'Testo', email:'Email', telefono:'Telefono', numero:'Numero', select:'Selezione', checkbox:'Checkbox', data:'Data' }

  return (
    <div style={{
      border: '1px solid #E5E7EB', borderRadius: '8px',
      padding: '12px', marginBottom: '8px', background: '#FAFAFA',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 32px', gap: '8px', alignItems: 'end', marginBottom: '8px' }}>
        <div>
          <label style={sLabel}>Nome del campo</label>
          <input
            value={campo.label}
            onChange={e => onChange({ ...campo, label: e.target.value })}
            placeholder="es. Codice fiscale, Note…"
            style={sInput}
          />
        </div>
        <div>
          <label style={sLabel}>Tipo</label>
          <select value={campo.tipo} onChange={e => onChange({ ...campo, tipo: e.target.value })} style={sInput}>
            {TIPI.map(t => <option key={t} value={t}>{TIPI_LABEL[t]}</option>)}
          </select>
        </div>
        <button
          type="button" onClick={onDelete}
          style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <Trash2 size={14} style={{ color: '#DC2626' }} />
        </button>
      </div>

      {campo.tipo === 'select' && (
        <div style={{ marginBottom: '8px' }}>
          <label style={sLabel}>Opzioni (una per riga)</label>
          <textarea
            value={(campo.opzioni?._raw ?? (campo.opzioni?.choices || []).join('\n'))}
            onChange={e => onChange({ ...campo, opzioni: { choices: e.target.value.split('\n').filter(s => s.trim()), _raw: e.target.value } })}
            placeholder={"Opzione 1\nOpzione 2\nOpzione 3"}
            rows={3}
            style={{ ...sInput, resize: 'vertical', fontFamily: "'Outfit',sans-serif", fontSize: '13px' }}
          />
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Toggle on={campo.obbligatorio} onChange={v => onChange({ ...campo, obbligatorio: v })} />
        <span style={{ fontSize: '12px', color: '#374151' }}>Obbligatorio</span>
        <span style={{ fontSize: '11px', color: '#9CA3AF', marginLeft: 'auto' }}>
          colonna: <code style={{ background: '#F3F4F6', padding: '1px 4px', borderRadius: '3px' }}>{campo.colonna_db}</code>
        </span>
      </div>
    </div>
  )
}

/* ─── COMPONENTE PRINCIPALE ─────────────────────────────────────── */
export default function IscrizioniTab({ event, setEvent, eventId }) {
  const [campi,   setCampi]   = useState([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [errore,  setErrore]  = useState('')

  // Un evento è "nuovo" se non ha ancora un UUID nel DB
  const isNew = !eventId || eventId === 'nuovo' || eventId === 'undefined'

  const campiStandard = campi.filter(c => c.colonna_db && !c.colonna_db.startsWith('extra_'))
  const campiExtra    = campi.filter(c => c.colonna_db?.startsWith('extra_'))

  /* ── Carica campi dal DB ── */
  useEffect(() => {
    if (isNew) { setLoading(false); return }

    setLoading(true)
    setErrore('')

    supabase
      .from('form_fields')
      .select('*')
      .eq('event_id', eventId)
      .order('ordine', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          setErrore('Errore caricamento campi: ' + error.message)
          setLoading(false)
          return
        }

        if (!data || data.length === 0) {
          // Se non ci sono campi, inizializzali via RPC poi ricarica
          supabase.rpc('init_form_fields', { p_event_id: eventId })
            .then(() => {
              supabase.from('form_fields').select('*')
                .eq('event_id', eventId).order('ordine')
                .then(({ data: d2 }) => {
                  setCampi(d2 || [])
                  setLoading(false)
                })
            })
        } else {
          setCampi(data)
          setLoading(false)
        }
      })
  }, [eventId])

  /* ── Aggiorna un campo localmente ── */
  function aggiornaCampo(id, nuovoCampo) {
    setCampi(prev => prev.map(c => c.id === id ? { ...c, ...nuovoCampo } : c))
  }

  /* ── Aggiunge campo extra ── */
  function aggiungiExtra() {
    const usati = campiExtra.map(c => c.colonna_db)
    const libero = [1,2,3,4,5].find(n => !usati.includes(`extra_${n}`))
    if (!libero) return
    setCampi(prev => [...prev, {
      id:           `__new__${Date.now()}`,
      event_id:     eventId,
      label:        '',
      tipo:         'testo',
      colonna_db:   `extra_${libero}`,
      obbligatorio: false,
      visibile:     true,
      ordine:       100 + libero,
      opzioni:      null,
      _nuovo:       true,
    }])
  }

  /* ── Salva tutto ── */
  async function salva() {
    if (isNew) return
    setSaving(true); setSaved(false); setErrore('')

    try {
      // 0. Salva capienza_max e posti_per_utente sull'evento
      const { error: evErr } = await supabase.from('events')
        .update({
          capienza_max: event.capienza_max || null,
          posti_per_utente: event.posti_per_utente || 1,
        })
        .eq('id', eventId)
      if (evErr) throw evErr

      // 1. Aggiorna campi standard esistenti
      for (const c of campiStandard) {
        const { error } = await supabase.from('form_fields')
          .update({ obbligatorio: c.obbligatorio, visibile: c.visibile, label: c.label })
          .eq('id', c.id)
        if (error) throw error
      }

      // 2. Gestisci campi extra
      // Recupera gli ID extra esistenti nel DB
      const { data: dbExtra } = await supabase.from('form_fields')
        .select('id').eq('event_id', eventId).like('colonna_db', 'extra_%')

      const dbIds    = (dbExtra || []).map(r => r.id)
      const localiIds = campiExtra.filter(c => !c._nuovo).map(c => c.id)

      // Elimina quelli rimossi localmente
      const daEliminare = dbIds.filter(id => !localiIds.includes(id))
      if (daEliminare.length) {
        await supabase.from('form_fields').delete().in('id', daEliminare)
      }

      // Inserisci nuovi / aggiorna esistenti
      for (const c of campiExtra) {
        if (c._nuovo) {
          const { data: ins, error } = await supabase.from('form_fields').insert({
            event_id:    eventId,
            label:       c.label || 'Campo extra',
            tipo:        c.tipo,
            colonna_db:  c.colonna_db,
            obbligatorio: c.obbligatorio,
            visibile:    true,
            ordine:      c.ordine,
            opzioni:     c.opzioni ? { choices: c.opzioni.choices } : null,
          }).select().single()
          if (error) throw error
          // Sostituisce il record temporaneo con quello reale
          setCampi(prev => prev.map(x => x.id === c.id ? ins : x))
        } else {
          const { error } = await supabase.from('form_fields')
            .update({ label: c.label, tipo: c.tipo, obbligatorio: c.obbligatorio, ordine: c.ordine, opzioni: c.opzioni ? { choices: c.opzioni.choices } : null })
            .eq('id', c.id)
          if (error) throw error
        }
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setErrore('Errore salvataggio: ' + e.message)
    }

    setSaving(false)
  }

  /* ── Render ── */
  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#0A0A0A', margin: '0 0 3px', letterSpacing: '-.02em' }}>
            Gestione iscrizioni
          </h2>
          <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
            Configura capienza, posti per utente e campi del form.
          </p>
        </div>
        {!isNew && (
          <button
            type="button" onClick={salva} disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: saved ? '#16A34A' : '#E11D48',
              color: '#fff', border: 'none', borderRadius: '8px',
              padding: '9px 16px', fontSize: '13px', fontWeight: '700',
              fontFamily: "'Outfit',sans-serif", cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'background .2s', flexShrink: 0,
            }}
          >
            {saving ? <><span style={spinStyle} />Salvataggio…</> : saved ? <><Check size={14} /> Salvato</> : <><Save size={14} /> Salva configurazione</>}
          </button>
        )}
      </div>

      {errore && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#DC2626', marginBottom: '16px' }}>
          ⚠ {errore}
        </div>
      )}

      {/* ── Colori box registrazione ── */}
      <div style={sCard}>
        <p style={sCardTitle}>🎨 Box registrazione</p>
        <p style={{ fontSize:'12px', color:'#6B7280', margin:'0 0 14px' }}>
          Personalizza l’aspetto del box &ldquo;Partecipa all&rsquo;evento&rdquo; nella pagina pubblica.
        </p>

        {/* Preview live */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          gap:'16px', flexWrap:'wrap',
          backgroundColor: event?.tema?.cta_bg || '#EEF4FF',
          border: `2px solid ${event?.tema?.colore_primario || '#005AC9'}22`,
          borderRadius:'12px', padding:'16px 20px', marginBottom:'16px',
        }}>
          <div style={{ flex:1, minWidth:'160px' }}>
            <div style={{ fontSize:'14px', fontWeight:'800', color: event?.tema?.heading_colore || '#0A0A0A', marginBottom:'3px' }}>
              Partecipa all’evento
            </div>
            <div style={{ fontSize:'12px', color: event?.tema?.testo_colore || '#374151' }}>
              Registrazione gratuita. Ricevi il QR Code per l’ingresso.
            </div>
          </div>
          <div style={{
            background: event?.tema?.colore_pulsanti || '#005AC9',
            color: event?.tema?.colore_testo_btn || '#FFFFFF',
            borderRadius:'8px', padding:'9px 18px',
            fontSize:'13px', fontWeight:'700',
            fontFamily:"'Outfit',sans-serif", whiteSpace:'nowrap',
            flexShrink:0,
          }}>
            Iscriviti ora &rsaquo;
          </div>
        </div>

        {/* Picker colori */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:'12px' }}>
          {/* Sfondo box */}
          <div>
            <label style={sLabel}>Sfondo box</label>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <input
                type="color"
                value={event?.tema?.cta_bg || '#EEF4FF'}
                onChange={e => setEvent(ev => ({ ...ev, tema: { ...(ev.tema||{}), cta_bg: e.target.value } }))}
                style={{ width:'36px', height:'36px', border:'1px solid #E5E7EB', borderRadius:'6px', padding:'2px', cursor:'pointer', background:'none' }}
              />
              <input
                type="text"
                value={event?.tema?.cta_bg || '#EEF4FF'}
                onChange={e => setEvent(ev => ({ ...ev, tema: { ...(ev.tema||{}), cta_bg: e.target.value } }))}
                style={{ ...sInput, width:'100px', fontFamily:'monospace', fontSize:'13px' }}
                placeholder="#EEF4FF"
              />
              <button type="button" title="Reset default CNA" onClick={() => setEvent(ev => ({ ...ev, tema: { ...(ev.tema||{}), cta_bg: '#EEF4FF' } }))}
                style={{ fontSize:'11px', color:'#005AC9', background:'none', border:'none', cursor:'pointer', padding:0, fontFamily:"'Outfit',sans-serif", fontWeight:'700' }}>
                CNA
              </button>
            </div>
          </div>

          {/* Colore pulsante */}
          <div>
            <label style={sLabel}>Colore pulsante</label>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <input
                type="color"
                value={event?.tema?.colore_pulsanti || '#005AC9'}
                onChange={e => setEvent(ev => ({ ...ev, tema: { ...(ev.tema||{}), colore_pulsanti: e.target.value } }))}
                style={{ width:'36px', height:'36px', border:'1px solid #E5E7EB', borderRadius:'6px', padding:'2px', cursor:'pointer', background:'none' }}
              />
              <input
                type="text"
                value={event?.tema?.colore_pulsanti || '#005AC9'}
                onChange={e => setEvent(ev => ({ ...ev, tema: { ...(ev.tema||{}), colore_pulsanti: e.target.value } }))}
                style={{ ...sInput, width:'100px', fontFamily:'monospace', fontSize:'13px' }}
                placeholder="#005AC9"
              />
              <button type="button" title="Reset default CNA" onClick={() => setEvent(ev => ({ ...ev, tema: { ...(ev.tema||{}), colore_pulsanti: '#005AC9' } }))}
                style={{ fontSize:'11px', color:'#005AC9', background:'none', border:'none', cursor:'pointer', padding:0, fontFamily:"'Outfit',sans-serif", fontWeight:'700' }}>
                CNA
              </button>
            </div>
          </div>

          {/* Testo pulsante */}
          <div>
            <label style={sLabel}>Testo pulsante</label>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <input
                type="color"
                value={event?.tema?.colore_testo_btn || '#FFFFFF'}
                onChange={e => setEvent(ev => ({ ...ev, tema: { ...(ev.tema||{}), colore_testo_btn: e.target.value } }))}
                style={{ width:'36px', height:'36px', border:'1px solid #E5E7EB', borderRadius:'6px', padding:'2px', cursor:'pointer', background:'none' }}
              />
              <input
                type="text"
                value={event?.tema?.colore_testo_btn || '#FFFFFF'}
                onChange={e => setEvent(ev => ({ ...ev, tema: { ...(ev.tema||{}), colore_testo_btn: e.target.value } }))}
                style={{ ...sInput, width:'100px', fontFamily:'monospace', fontSize:'13px' }}
                placeholder="#FFFFFF"
              />
            </div>
          </div>
        </div>

        {/* Shortcut palette CNA */}
        <div style={{ marginTop:'12px', paddingTop:'12px', borderTop:'1px solid #F3F4F6' }}>
          <span style={{ fontSize:'11px', fontWeight:'700', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.06em', marginRight:'10px' }}>Preset rapidi</span>
          {[
            { label:'CNA Blu', bg:'#EEF4FF', btn:'#005AC9', txt:'#FFFFFF' },
            { label:'Bianco', bg:'#FFFFFF', btn:'#005AC9', txt:'#FFFFFF' },
            { label:'Blu pieno', bg:'#005AC9', btn:'#FFFFFF', txt:'#003DA5' },
            { label:'Crimisi', bg:'#FEE4E6', btn:'#E11D48', txt:'#FFFFFF' },
          ].map(p => (
            <button key={p.label} type="button"
              onClick={() => setEvent(ev => ({ ...ev, tema: { ...(ev.tema||{}), cta_bg: p.bg, colore_pulsanti: p.btn, colore_testo_btn: p.txt } }))}
              style={{
                display:'inline-flex', alignItems:'center', gap:'6px',
                background:'#fff', border:'1px solid #E5E7EB', borderRadius:'20px',
                padding:'4px 10px 4px 6px', fontSize:'12px', fontWeight:'600',
                fontFamily:"'Outfit',sans-serif", cursor:'pointer', marginRight:'6px', marginTop:'6px',
              }}>
              <span style={{ width:'12px', height:'12px', borderRadius:'50%', background:p.bg, border:'1px solid #E5E7EB', flexShrink:0, display:'inline-block' }}/>
              <span style={{ width:'12px', height:'12px', borderRadius:'50%', background:p.btn, flexShrink:0, display:'inline-block' }}/>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Capienza e posti ── */}
      <div style={sCard}>
        <p style={sCardTitle}>📦 Capienza e posti</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <div>
            <label style={sLabel}>Capienza massima</label>
            <input
              type="number" min="0" step="1"
              value={event.capienza_max || ''}
              onChange={e => setEvent(p => ({ ...p, capienza_max: e.target.value ? parseInt(e.target.value) : null }))}
              placeholder="Illimitata"
              style={sInput}
            />
            <p style={sHint}>Lascia vuoto = nessun limite</p>
          </div>
          <div>
            <label style={sLabel}>Posti per utente</label>
            <select
              value={event.posti_per_utente || 1}
              onChange={e => setEvent(p => ({ ...p, posti_per_utente: parseInt(e.target.value) }))}
              style={sInput}
            >
              {[1,2,3,4,5,6,10].map(n => (
                <option key={n} value={n}>{n === 1 ? '1 — solo intestatario' : `${n} — + ${n-1} accompagnator${n===2?'e':'i'}`}</option>
              ))}
            </select>
            <p style={sHint}>Blocchi del form mostrati all'utente</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '12px', padding: '10px 12px', background: '#F9FAFB', borderRadius: '8px' }}>
          <div>
            <span style={sStat}>CAPIENZA</span>
            <span style={sVal}>{event.capienza_max ? event.capienza_max.toLocaleString('it-IT') : '∞'}</span>
            <span style={sUnit}> posti</span>
          </div>
          <div>
            <span style={sStat}>PER UTENTE</span>
            <span style={sVal}>{event.posti_per_utente || 1}</span>
            <span style={sUnit}> posti</span>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <span style={sStat}>CODICE EVENTO</span>
            <code style={{ fontSize: '13px', fontWeight: '900', color: '#E11D48', letterSpacing: '.04em', fontFamily: 'monospace' }}>
              EVT-{new Date().getFullYear().toString().slice(2)}{String(event.codice || 0).padStart(4, '0')}-NNNN
            </code>
          </div>
        </div>
      </div>

      {/* ── Campi del form ── */}
      <div style={sCard}>
        {/* Intestazione con colonne allineate */}
        <div style={{ display: 'grid', gridTemplateColumns: '20px 1fr 70px 70px', gap: '8px', padding: '0 12px 10px', borderBottom: '1px solid #E5E7EB', marginBottom: '0' }}>
          <div />
          <p style={{ ...sCardTitle, margin: 0 }}>📋 Campi del form</p>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#6B7280', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '.04em' }}>Visibile</span>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#6B7280', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '.04em' }}>Obblig.</span>
        </div>

        {isNew ? (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <AlertCircle size={20} style={{ color: '#D97706', display: 'block', margin: '0 auto 8px' }} />
            <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>Salva prima l'evento per configurare i campi.</p>
          </div>
        ) : loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span style={spinStyle} /> Caricamento campi…
          </div>
        ) : campiStandard.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: '#DC2626', margin: 0 }}>Nessun campo trovato. Clicca Salva per inizializzarli.</p>
          </div>
        ) : (
          <div>
            {campiStandard.map(c => (
              <RigaCampo key={c.id} campo={c} onChange={nc => aggiornaCampo(c.id, nc)} />
            ))}
            <p style={{ fontSize: '11px', color: '#9CA3AF', padding: '8px 12px 0', margin: 0 }}>
              I campi contrassegnati come <strong>fisso</strong> (nome, cognome, email) sono sempre visibili e obbligatori.
            </p>
          </div>
        )}
      </div>

      {/* ── Campi extra ── */}
      {!isNew && (
        <div style={sCard}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div>
              <p style={{ ...sCardTitle, margin: '0 0 2px' }}>➕ Campi personalizzati</p>
              <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>Fino a 5 campi extra, salvati in extra_1…extra_5</p>
            </div>
            {campiExtra.length < 5 && (
              <button
                type="button" onClick={aggiungiExtra}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#FEE4E6', color: '#E11D48', border: '1px solid #FDA4AF', borderRadius: '7px', padding: '7px 12px', fontSize: '12px', fontWeight: '700', fontFamily: "'Outfit',sans-serif", cursor: 'pointer', flexShrink: 0 }}
              >
                <Plus size={13} /> Aggiungi
              </button>
            )}
          </div>

          {campiExtra.length === 0 ? (
            <div style={{ padding: '18px', textAlign: 'center', border: '1px dashed #D1D5DB', borderRadius: '7px' }}>
              <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>Nessun campo personalizzato — clicca Aggiungi per crearne uno.</p>
            </div>
          ) : campiExtra.map((c, i) => (
            <RigaCampoExtra
              key={c.id}
              campo={c}
              onChange={nc => aggiornaCampo(c.id, nc)}
              onDelete={() => setCampi(prev => prev.filter(x => x.id !== c.id))}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin-iscr { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @media(max-width:480px) {
          .iscrizioni-campo-row { grid-template-columns: 20px 1fr 64px 64px !important; gap: 4px !important; }
        }
      `}</style>
    </div>
  )
}

const spinStyle = {
  display: 'inline-block', width: '12px', height: '12px',
  border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff',
  borderRadius: '50%', animation: 'spin-iscr .7s linear infinite',
}

const sCard = {
  background: '#fff', border: '1px solid #E5E7EB', borderRadius: '10px',
  marginBottom: '14px', padding: '14px',
}
const sCardTitle = {
  fontSize: '13px', fontWeight: '800', color: '#0A0A0A',
  margin: '0 0 10px', letterSpacing: '-.01em',
}
const sLabel = { display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '4px' }
const sInput = {
  width: '100%', padding: '8px 10px',
  border: '1px solid #D1D5DB', borderRadius: '6px',
  fontSize: '13px', fontFamily: "'Outfit',sans-serif",
  outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff',
}
const sHint = { fontSize: '11px', color: '#9CA3AF', margin: '3px 0 0' }
const sStat = { fontSize: '10px', color: '#6B7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block' }
const sVal  = { fontSize: '20px', fontWeight: '900', color: '#E11D48', letterSpacing: '-.02em' }
const sUnit = { fontSize: '11px', color: '#9CA3AF' }
