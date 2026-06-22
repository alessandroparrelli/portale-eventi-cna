import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Eye, EyeOff, Plus, Trash2, GripVertical, AlertCircle } from 'lucide-react'
import { Field, Input, Select, Btn } from '../ui'

/* ─── Campi standard (non eliminabili) ─────────────────────────── */
const CAMPI_FISSI = ['nome', 'cognome', 'email'] // sempre visibili e obbligatori

/* ─── Toggle visibile/obbligatorio ─────────────────────────────── */
function ToggleSwitch({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      style={{
        width: '40px', height: '22px', borderRadius: '11px', border: 'none',
        background: checked ? '#003DA5' : '#D1D5DB',
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative', transition: 'background .2s', flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span style={{
        position: 'absolute', top: '3px',
        left: checked ? '21px' : '3px',
        width: '16px', height: '16px', borderRadius: '50%',
        background: '#fff', transition: 'left .2s',
        boxShadow: '0 1px 3px rgba(0,0,0,.2)',
      }} />
    </button>
  )
}

/* ─── Riga campo standard ───────────────────────────────────────── */
function RigaCampo({ campo, onUpdate }) {
  const isFisso = CAMPI_FISSI.includes(campo.colonna_db)
  const isNomeOrCognome = campo.colonna_db === 'nome' || campo.colonna_db === 'cognome'

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '28px 1fr 90px 90px',
      alignItems: 'center', gap: '12px',
      padding: '10px 14px',
      borderBottom: '1px solid #F3F4F6',
      background: campo.visibile ? '#fff' : '#F9FAFB',
      opacity: campo.visibile ? 1 : 0.6,
    }}>
      {/* Drag handle (visivo) */}
      <GripVertical size={16} style={{ color: '#D1D5DB', cursor: 'grab' }} />

      {/* Label editabile (solo extra, non fissi) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {isFisso ? (
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#0A0A0A' }}>
            {campo.label}
          </span>
        ) : (
          <input
            value={campo.label}
            onChange={e => onUpdate({ ...campo, label: e.target.value })}
            style={{
              fontSize: '14px', fontWeight: '600', color: '#0A0A0A',
              border: '1px solid transparent', borderRadius: '4px',
              padding: '2px 6px', background: 'transparent',
              fontFamily: "'Inter',sans-serif", width: '100%',
            }}
            onFocus={e => (e.target.style.borderColor = '#003DA5')}
            onBlur={e => (e.target.style.borderColor = 'transparent')}
          />
        )}
        {campo.colonna_db && (
          <code style={{
            fontSize: '11px', color: '#9CA3AF', background: '#F3F4F6',
            borderRadius: '4px', padding: '1px 5px', flexShrink: 0,
          }}>
            {campo.colonna_db}
          </code>
        )}
      </div>

      {/* Toggle visibile */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
        <ToggleSwitch
          checked={campo.visibile}
          disabled={isFisso}
          onChange={v => onUpdate({ ...campo, visibile: v, obbligatorio: v ? campo.obbligatorio : false })}
        />
        <span style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: '600' }}>
          {campo.visibile ? 'Visibile' : 'Nascosto'}
        </span>
      </div>

      {/* Toggle obbligatorio */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
        <ToggleSwitch
          checked={campo.obbligatorio}
          disabled={isFisso || !campo.visibile}
          onChange={v => onUpdate({ ...campo, obbligatorio: v })}
        />
        <span style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: '600' }}>
          {campo.obbligatorio ? 'Obblig.' : 'Facolt.'}
        </span>
      </div>
    </div>
  )
}

/* ─── Riga campo extra ──────────────────────────────────────────── */
function RigaCampoExtra({ campo, onUpdate, onDelete, extraIndex }) {
  const TIPI = [
    { v: 'testo', l: 'Testo breve' },
    { v: 'email', l: 'Email' },
    { v: 'telefono', l: 'Telefono' },
    { v: 'numero', l: 'Numero' },
    { v: 'select', l: 'Selezione' },
    { v: 'checkbox', l: 'Checkbox (sì/no)' },
    { v: 'data', l: 'Data' },
  ]

  return (
    <div style={{
      border: '1px solid #E5E7EB', borderRadius: '10px',
      padding: '14px', marginBottom: '10px', background: '#FAFAFA',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px auto', gap: '10px', alignItems: 'start' }}>
        {/* Label */}
        <div>
          <label style={sLabel}>Nome del campo</label>
          <input
            value={campo.label}
            onChange={e => onUpdate({ ...campo, label: e.target.value })}
            placeholder="es. Codice fiscale, Settore, Note…"
            style={sInput}
          />
        </div>

        {/* Tipo */}
        <div>
          <label style={sLabel}>Tipo</label>
          <select
            value={campo.tipo}
            onChange={e => onUpdate({ ...campo, tipo: e.target.value })}
            style={sInput}
          >
            {TIPI.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
          </select>
        </div>

        {/* Elimina */}
        <button
          type="button"
          onClick={onDelete}
          style={{
            marginTop: '22px', background: '#FEF2F2', border: '1px solid #FECACA',
            borderRadius: '6px', padding: '7px', cursor: 'pointer',
            display: 'flex', alignItems: 'center',
          }}
        >
          <Trash2 size={15} style={{ color: '#DC2626' }} />
        </button>
      </div>

      {/* Opzioni se tipo = select */}
      {campo.tipo === 'select' && (
        <div style={{ marginTop: '10px' }}>
          <label style={sLabel}>Opzioni (una per riga)</label>
          <textarea
            value={(campo.opzioni?.choices || []).join('\n')}
            onChange={e => onUpdate({ ...campo, opzioni: { choices: e.target.value.split('\n').filter(Boolean) } })}
            placeholder="Opzione 1&#10;Opzione 2&#10;Opzione 3"
            rows={3}
            style={{ ...sInput, resize: 'vertical', fontFamily: "'Inter',sans-serif" }}
          />
        </div>
      )}

      <div style={{ display: 'flex', gap: '16px', marginTop: '10px', alignItems: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: '#374151' }}>
          <ToggleSwitch
            checked={campo.obbligatorio}
            onChange={v => onUpdate({ ...campo, obbligatorio: v })}
          />
          Obbligatorio
        </label>
        <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
          Salvato in: <code style={{ background: '#F3F4F6', padding: '1px 5px', borderRadius: '3px' }}>{campo.colonna_db || `extra_${extraIndex}`}</code>
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
  const isNew = !eventId || eventId === 'nuovo'

  // Campi standard (con colonna_db su registrations)
  const campiStandard = campi.filter(c => c.colonna_db && !c.colonna_db.startsWith('extra_'))
  // Campi extra
  const campiExtra    = campi.filter(c => c.colonna_db?.startsWith('extra_') || (!c.colonna_db && c.tipo !== undefined))

  useEffect(() => {
    if (isNew || !eventId) { setLoading(false); return }
    supabase.from('form_fields').select('*').eq('event_id', eventId).order('ordine')
      .then(({ data }) => {
        if (data && data.length > 0) setCampi(data)
        setLoading(false)
      })
  }, [eventId])

  function updateCampo(id, nuovoCampo) {
    setCampi(prev => prev.map(c => c.id === id ? nuovoCampo : c))
  }

  function aggiungiCampoExtra() {
    // Trova il prossimo extra_N disponibile
    const usati = campiExtra.map(c => c.colonna_db).filter(Boolean)
    const extraNums = [1,2,3,4,5]
    const libero = extraNums.find(n => !usati.includes(`extra_${n}`))
    if (!libero) return // max 5 extra

    const nuovoCampo = {
      id:          `new_${Date.now()}`,
      event_id:    eventId,
      label:       '',
      tipo:        'testo',
      colonna_db:  `extra_${libero}`,
      obbligatorio: false,
      visibile:    true,
      ordine:      100 + libero,
      opzioni:     null,
      _nuovo:      true,
    }
    setCampi(prev => [...prev, nuovoCampo])
  }

  function eliminaCampoExtra(id) {
    setCampi(prev => prev.filter(c => c.id !== id))
  }

  async function salva() {
    if (isNew) return
    setSaving(true)
    setSaved(false)

    // Upsert dei campi standard
    const aggiornamenti = campiStandard.map(c => ({
      id:          c.id,
      event_id:    c.event_id,
      label:       c.label,
      tipo:        c.tipo,
      colonna_db:  c.colonna_db,
      obbligatorio:c.obbligatorio,
      visibile:    c.visibile,
      ordine:      c.ordine,
      opzioni:     c.opzioni,
    }))

    await supabase.from('form_fields').upsert(aggiornamenti)

    // Gestione campi extra: elimina rimossi, upsert nuovi/modificati
    // Prima recupera gli id esistenti sul DB
    const { data: esistenti } = await supabase.from('form_fields')
      .select('id, colonna_db')
      .eq('event_id', eventId)
      .like('colonna_db', 'extra_%')

    const idEsistenti = (esistenti || []).map(c => c.id)
    const idLocali    = campiExtra.filter(c => !c._nuovo).map(c => c.id)
    const daEliminare = idEsistenti.filter(id => !idLocali.includes(id))

    if (daEliminare.length) {
      await supabase.from('form_fields').delete().in('id', daEliminare)
    }

    for (const c of campiExtra) {
      if (c._nuovo) {
        const { data: inserted } = await supabase.from('form_fields').insert({
          event_id:    eventId,
          label:       c.label || 'Campo personalizzato',
          tipo:        c.tipo,
          colonna_db:  c.colonna_db,
          obbligatorio:c.obbligatorio,
          visibile:    true,
          ordine:      c.ordine,
          opzioni:     c.opzioni,
        }).select().single()
        if (inserted) {
          setCampi(prev => prev.map(x => x.id === c.id ? { ...inserted } : x))
        }
      } else {
        await supabase.from('form_fields').upsert({
          id:          c.id,
          event_id:    c.event_id,
          label:       c.label || 'Campo personalizzato',
          tipo:        c.tipo,
          colonna_db:  c.colonna_db,
          obbligatorio:c.obbligatorio,
          visibile:    true,
          ordine:      c.ordine,
          opzioni:     c.opzioni,
        })
      }
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const extraUsati = campiExtra.length
  const maxExtra = 5

  return (
    <div style={{ padding: '0', maxWidth: '720px' }}>

      {/* ── Header sezione ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0A0A0A', margin: '0 0 4px', letterSpacing: '-.02em' }}>
            Gestione iscrizioni
          </h2>
          <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
            Configura capienza, posti per utente e i campi del form di iscrizione.
          </p>
        </div>
        {!isNew && (
          <button
            type="button"
            onClick={salva}
            disabled={saving}
            style={{
              background: saved ? '#16A34A' : '#003DA5',
              color: '#fff', border: 'none', borderRadius: '8px',
              padding: '9px 18px', fontSize: '14px', fontWeight: '700',
              fontFamily: "'Inter',sans-serif", cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'background .2s', flexShrink: 0,
            }}
          >
            {saving ? 'Salvataggio…' : saved ? '✓ Salvato' : 'Salva configurazione'}
          </button>
        )}
      </div>

      {/* ── Sezione 1: Capienza e posti ── */}
      <div style={sCard}>
        <p style={sCardTitle}>📦 Capienza e posti</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={sLabel}>Capienza massima</label>
            <input
              type="number" min="0" step="1"
              value={event.capienza_max || ''}
              onChange={e => setEvent(p => ({ ...p, capienza_max: e.target.value ? parseInt(e.target.value) : null }))}
              placeholder="Illimitata"
              style={sInput}
            />
            <p style={sHint}>Lascia vuoto per nessun limite. Raggiunto il limite, le iscrizioni vengono bloccate.</p>
          </div>
          <div>
            <label style={sLabel}>Posti per utente</label>
            <select
              value={event.posti_per_utente || 1}
              onChange={e => setEvent(p => ({ ...p, posti_per_utente: parseInt(e.target.value) }))}
              style={sInput}
            >
              <option value={1}>1 — solo l'intestatario</option>
              <option value={2}>2 — + 1 accompagnatore</option>
              <option value={3}>3 — + 2 accompagnatori</option>
              <option value={4}>4 — + 3 accompagnatori</option>
              <option value={5}>5 — + 4 accompagnatori</option>
              <option value={6}>6 — + 5 accompagnatori</option>
              <option value={10}>10 — + 9 accompagnatori</option>
            </select>
            <p style={sHint}>Nel form verranno mostrati tanti blocchi dati quanti i posti.</p>
          </div>
        </div>

        {/* Riepilogo */}
        <div style={{ display: 'flex', gap: '20px', marginTop: '14px', padding: '12px 14px', background: '#F9FAFB', borderRadius: '8px' }}>
          {[
            { l: 'Capienza', v: event.capienza_max ? event.capienza_max.toLocaleString('it-IT') : '∞', u: 'posti' },
            { l: 'Per utente', v: event.posti_per_utente || 1, u: 'posti' },
            event.capienza_max && (event.posti_per_utente || 1) > 1
              ? { l: 'Form attesi', v: '~' + Math.ceil(event.capienza_max / (event.posti_per_utente || 1)), u: 'iscrizioni' }
              : null,
          ].filter(Boolean).map(stat => (
            <div key={stat.l}>
              <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block' }}>{stat.l}</span>
              <span style={{ fontSize: '22px', fontWeight: '900', color: '#003DA5', letterSpacing: '-.02em' }}>{stat.v}</span>
              <span style={{ fontSize: '12px', color: '#9CA3AF', marginLeft: '3px' }}>{stat.u}</span>
            </div>
          ))}
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block' }}>Codice evento</span>
            <code style={{ fontSize: '14px', fontWeight: '900', color: '#003DA5', letterSpacing: '.04em', fontFamily: 'monospace' }}>
              EVT-{new Date().getFullYear().toString().slice(2)}{String(event.codice || 0).padStart(4, '0')}-NNNN
            </code>
          </div>
        </div>
      </div>

      {/* ── Sezione 2: Campi del form ── */}
      <div style={sCard}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <p style={sCardTitle}>📋 Campi del form</p>
          <div style={{ display: 'flex', gap: '20px', paddingRight: '14px' }}>
            <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: '700', width: '90px', textAlign: 'center' }}>VISIBILE</span>
            <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: '700', width: '90px', textAlign: 'center' }}>OBBLIGATORIO</span>
          </div>
        </div>
        <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '0 0 12px 14px' }}>
          Nome, Cognome ed Email sono sempre visibili e obbligatori. Gli altri campi possono essere nascosti o resi facoltativi.
        </p>

        {isNew ? (
          <div style={{ padding: '20px 14px', textAlign: 'center' }}>
            <AlertCircle size={20} style={{ color: '#D97706', marginBottom: '8px' }} />
            <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
              Salva prima l'evento per configurare i campi del form.
            </p>
          </div>
        ) : loading ? (
          <p style={{ padding: '20px 14px', fontSize: '13px', color: '#9CA3AF' }}>Caricamento…</p>
        ) : (
          <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
            {campiStandard.map(c => (
              <RigaCampo key={c.id} campo={c} onUpdate={nc => updateCampo(c.id, nc)} />
            ))}
          </div>
        )}
      </div>

      {/* ── Sezione 3: Campi extra ── */}
      {!isNew && (
        <div style={sCard}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div>
              <p style={sCardTitle}>➕ Campi personalizzati</p>
              <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '2px 0 0' }}>
                Aggiungi fino a 5 campi extra. I dati vengono salvati nelle colonne extra_1…extra_5.
              </p>
            </div>
            {extraUsati < maxExtra && (
              <button
                type="button"
                onClick={aggiungiCampoExtra}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: '#EEF3FF', color: '#003DA5',
                  border: '1px solid #C7D9F8', borderRadius: '8px',
                  padding: '8px 14px', fontSize: '13px', fontWeight: '700',
                  fontFamily: "'Inter',sans-serif", cursor: 'pointer', flexShrink: 0,
                }}
              >
                <Plus size={15} /> Aggiungi campo
              </button>
            )}
          </div>

          {campiExtra.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', border: '1px dashed #D1D5DB', borderRadius: '8px' }}>
              <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0 }}>
                Nessun campo extra — clicca "Aggiungi campo" per crearne uno.
              </p>
            </div>
          ) : (
            campiExtra.map((c, i) => (
              <RigaCampoExtra
                key={c.id}
                campo={c}
                extraIndex={i + 1}
                onUpdate={nc => updateCampo(c.id, nc)}
                onDelete={() => eliminaCampoExtra(c.id)}
              />
            ))
          )}

          {extraUsati >= maxExtra && (
            <p style={{ fontSize: '12px', color: '#D97706', marginTop: '8px', fontWeight: '600' }}>
              ⚠ Limite di 5 campi extra raggiunto.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Stili locali ─────────────────────────────────────────────── */
const sCard = {
  background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px',
  overflow: 'hidden', marginBottom: '16px',
  padding: '16px',
}
const sCardTitle = {
  fontSize: '14px', fontWeight: '800', color: '#0A0A0A',
  margin: '0 0 12px', letterSpacing: '-.01em',
}
const sLabel = {
  display: 'block', fontSize: '12px', fontWeight: '700',
  color: '#374151', marginBottom: '5px',
}
const sInput = {
  width: '100%', padding: '9px 11px',
  border: '1px solid #D1D5DB', borderRadius: '6px',
  fontSize: '14px', fontFamily: "'Inter',sans-serif",
  outline: 'none', boxSizing: 'border-box',
  backgroundColor: '#fff',
}
const sHint = {
  fontSize: '11px', color: '#9CA3AF', margin: '4px 0 0', lineHeight: '1.4',
}
