import { useEffect, useMemo, useRef, useState } from 'react'
import { Award, Eye, Download, RotateCcw, Loader2 } from 'lucide-react'
import { Field, Input } from '../ui'
import LogoManager from './LogoManager'

const CERT_FN = 'https://hnkhckcclgabunkqfmrz.supabase.co/functions/v1/genera-certificato'

export const CERT_CONFIG_DEFAULT = {
  template: 'laterale',
  colore_primario: '#003DA5',
  titolo_intro: 'Si certifica che',
  testo_partecipazione: "ha partecipato all'evento",
  firma_nome: 'CNA Roma',
  firma_ruolo: "Confederazione Nazionale dell'Artigianato",
  logo_url: '',
  mostra_logo: true,
  mostra_data: true,
  mostra_luogo: true,
  mostra_codice: true,
  mostra_qr: true,
  mostra_firma: true,
}

const TEMPLATES = [
  { id: 'laterale', label: 'Laterale', desc: 'Fascia colorata a sinistra' },
  { id: 'centrato', label: 'Centrato', desc: 'Cornice sottile, layout centrale' },
  { id: 'minimal', label: 'Minimal', desc: 'Essenziale, molto spazio bianco' },
  { id: 'cornice', label: 'Istituzionale', desc: 'Bordo doppio, stile formale' },
]

// codifica/decodifica UTF-8 safe, simmetrica con l'edge function
function encodeConfig(obj) {
  const json = JSON.stringify(obj)
  const bytes = new TextEncoder().encode(json)
  let binary = ''
  bytes.forEach(b => { binary += String.fromCharCode(b) })
  return btoa(binary)
}

/* ─── Mini anteprima statica del template (per la gallery) ─── */
function TemplateThumb({ id, colore }) {
  const box = { width: '100%', height: '78px', borderRadius: '6px', position: 'relative', overflow: 'hidden', background: '#fff', border: '1px solid #E5E7EB' }
  if (id === 'laterale') return (
    <div style={box}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '30%', background: colore }} />
      <div style={{ position: 'absolute', left: '38%', top: '18%', width: '50%', height: '6px', background: '#D1D5DB', borderRadius: '2px' }} />
      <div style={{ position: 'absolute', left: '38%', top: '34%', width: '40%', height: '9px', background: colore, borderRadius: '2px' }} />
      <div style={{ position: 'absolute', left: '38%', top: '54%', width: '55%', height: '14px', background: '#F3F4F6', borderRadius: '2px' }} />
    </div>
  )
  if (id === 'centrato') return (
    <div style={box}>
      <div style={{ position: 'absolute', inset: '6px', border: `1.5px solid ${colore}`, borderRadius: '3px' }} />
      <div style={{ position: 'absolute', left: '30%', top: '22%', width: '40%', height: '6px', background: '#D1D5DB', borderRadius: '2px' }} />
      <div style={{ position: 'absolute', left: '25%', top: '40%', width: '50%', height: '11px', background: colore, borderRadius: '2px' }} />
      <div style={{ position: 'absolute', left: '32%', top: '60%', width: '36%', height: '6px', background: '#D1D5DB', borderRadius: '2px' }} />
    </div>
  )
  if (id === 'minimal') return (
    <div style={box}>
      <div style={{ position: 'absolute', left: '10%', top: '16%', width: '22%', height: '10px', background: colore, borderRadius: '2px' }} />
      <div style={{ position: 'absolute', left: '10%', top: '38%', width: '60%', height: '13px', background: '#0A0A0A', opacity: 0.85, borderRadius: '2px' }} />
      <div style={{ position: 'absolute', left: '10%', top: '60%', width: '45%', height: '6px', background: '#D1D5DB', borderRadius: '2px' }} />
      <div style={{ position: 'absolute', left: '10%', bottom: '10%', width: '80%', height: '1px', background: '#E5E7EB' }} />
    </div>
  )
  return ( // cornice
    <div style={box}>
      <div style={{ position: 'absolute', inset: '5px', border: `2.5px solid ${colore}`, borderRadius: '2px' }} />
      <div style={{ position: 'absolute', inset: '9px', border: `0.75px solid ${colore}`, opacity: 0.5 }} />
      <div style={{ position: 'absolute', left: '26%', top: '24%', width: '48%', height: '8px', background: colore, borderRadius: '2px' }} />
      <div style={{ position: 'absolute', left: '32%', top: '44%', width: '36%', height: '10px', background: '#0A0A0A', opacity: 0.8, borderRadius: '2px' }} />
      <div style={{ position: 'absolute', left: '36%', top: '64%', width: '28%', height: '5px', background: '#D1D5DB', borderRadius: '2px' }} />
    </div>
  )
}

/* ─── Toggle switch riutilizzabile ─── */
function Toggle({ checked, onChange, label, hint }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
      <div style={{ position: 'relative', width: '36px', height: '20px', flexShrink: 0 }} onClick={() => onChange(!checked)}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '999px', transition: 'background 0.2s', backgroundColor: checked ? '#003DA5' : '#D1D5DB' }} />
        <div style={{ position: 'absolute', top: '2.5px', left: checked ? '18.5px' : '2.5px', width: '15px', height: '15px', borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.25)' }} />
      </div>
      <div>
        <p style={{ fontSize: '13px', fontWeight: '600', color: '#0A0A0A', margin: 0 }}>{label}</p>
        {hint && <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>{hint}</p>}
      </div>
    </label>
  )
}

const sectionBox = { background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }
const sectionLabel = { margin: 0, fontSize: '12px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.06em' }

export default function CertificatoEditorTab({ event, setEvent }) {
  const cfg = useMemo(() => ({ ...CERT_CONFIG_DEFAULT, ...(event.certificato_config || {}) }), [event.certificato_config])
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewLoading, setPreviewLoading] = useState(true)
  const debounceRef = useRef(null)

  function update(patch) {
    setEvent(p => ({
      ...p,
      certificato_template: patch.template || cfg.template,
      certificato_config: { ...(p.certificato_config || {}), ...patch },
    }))
  }

  useEffect(() => {
    setPreviewLoading(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams({
        preview: '1',
        config: encodeConfig(cfg),
        evento: event.titolo || 'Nome Evento di Esempio',
        luogo: event.luogo || 'Roma, Sede CNA',
        _t: Date.now().toString(),
      })
      if (event.data_inizio) params.set('data', event.data_inizio)
      setPreviewUrl(`${CERT_FN}?${params.toString()}`)
    }, 450)
    return () => clearTimeout(debounceRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(cfg), event.titolo, event.luogo, event.data_inizio])

  const downloadUrl = previewUrl ? `${previewUrl}&download=1` : ''

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 420px', gap: '24px', alignItems: 'flex-start' }} className="cert-editor-grid">
      {/* ── COLONNA CONTROLLI ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#0A0A0A', letterSpacing: '-.03em', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={22} /> Certificato di partecipazione
          </h2>
          <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>Scegli un modello e personalizza colori, testi, loghi e campi visibili. L&apos;anteprima a destra è il PDF reale.</p>
        </div>

        {/* Abilitazione */}
        <div style={sectionBox}>
          <Toggle
            checked={!!event.certificato_abilitato}
            onChange={v => setEvent(p => ({ ...p, certificato_abilitato: v }))}
            label="Abilita certificati di partecipazione"
            hint="Gli iscritti presenti potranno scaricare il certificato dopo l'evento"
          />
          {event.certificato_abilitato && (
            <Toggle
              checked={event.certificato_invio_auto !== false}
              onChange={v => setEvent(p => ({ ...p, certificato_invio_auto: v }))}
              label={event.certificato_invio_auto !== false ? '✅ Invio automatico attivo' : '⏸ Invio manuale'}
              hint={event.certificato_invio_auto !== false ? "I certificati vengono inviati automaticamente dopo l'evento" : 'Invio solo manuale dalla pagina Iscritti'}
            />
          )}
        </div>

        {event.certificato_abilitato && (<>
          {/* Template gallery */}
          <div style={sectionBox}>
            <p style={sectionLabel}>Modello</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {TEMPLATES.map(t => (
                <button key={t.id} type="button" onClick={() => update({ template: t.id })}
                  style={{
                    textAlign: 'left', padding: '10px', borderRadius: '10px', cursor: 'pointer',
                    border: '2px solid', borderColor: cfg.template === t.id ? '#003DA5' : '#E5E7EB',
                    backgroundColor: cfg.template === t.id ? '#EFF6FF' : '#fff', transition: 'all 0.15s',
                  }}>
                  <TemplateThumb id={t.id} colore={cfg.colore_primario} />
                  <p style={{ fontSize: '13px', fontWeight: '700', color: '#0A0A0A', margin: '8px 0 1px' }}>{t.label}</p>
                  <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Colore */}
          <div style={sectionBox}>
            <p style={sectionLabel}>Colore principale</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="color" value={cfg.colore_primario}
                onChange={e => update({ colore_primario: e.target.value })}
                style={{ width: '44px', height: '36px', border: '1px solid #D1D5DB', borderRadius: '6px', cursor: 'pointer', padding: '2px' }} />
              <Input value={cfg.colore_primario} onChange={e => update({ colore_primario: e.target.value })} style={{ maxWidth: '130px' }} />
              <button type="button" onClick={() => update({ colore_primario: '#003DA5' })}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px' }}>
                <RotateCcw size={13} /> Blu CNA
              </button>
            </div>
          </div>

          {/* Logo */}
          <div style={sectionBox}>
            <Toggle checked={cfg.mostra_logo} onChange={v => update({ mostra_logo: v })} label="Mostra logo" />
            {cfg.mostra_logo && (
              <LogoManager value={cfg.logo_url} onChange={url => update({ logo_url: url })} />
            )}
          </div>

          {/* Testi */}
          <div style={sectionBox}>
            <p style={sectionLabel}>Testi</p>
            <Field label="Testo introduttivo" hint="Es. 'Si certifica che'">
              <Input value={cfg.titolo_intro} onChange={e => update({ titolo_intro: e.target.value })} placeholder="Si certifica che" />
            </Field>
            <Field label="Testo partecipazione" hint="Es. 'ha partecipato all'evento'">
              <Input value={cfg.testo_partecipazione} onChange={e => update({ testo_partecipazione: e.target.value })} placeholder="ha partecipato all'evento" />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Field label="Nome in firma">
                <Input value={cfg.firma_nome} onChange={e => update({ firma_nome: e.target.value })} placeholder="CNA Roma" />
              </Field>
              <Field label="Ruolo in firma">
                <Input value={cfg.firma_ruolo} onChange={e => update({ firma_ruolo: e.target.value })} placeholder="Confederazione Nazionale dell'Artigianato" />
              </Field>
            </div>
          </div>

          {/* Campi visualizzati */}
          <div style={sectionBox}>
            <p style={sectionLabel}>Campi visualizzati</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Toggle checked={cfg.mostra_data} onChange={v => update({ mostra_data: v })} label="Data evento" />
              <Toggle checked={cfg.mostra_luogo} onChange={v => update({ mostra_luogo: v })} label="Luogo" />
              <Toggle checked={cfg.mostra_firma} onChange={v => update({ mostra_firma: v })} label="Firma" />
              <Toggle checked={cfg.mostra_codice} onChange={v => update({ mostra_codice: v })} label="Codice verifica" />
              <Toggle checked={cfg.mostra_qr} onChange={v => update({ mostra_qr: v })} label="QR code verifica" />
            </div>
          </div>
        </>)}
      </div>

      {/* ── COLONNA ANTEPRIMA ── */}
      <div style={{ position: 'sticky', top: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ ...sectionLabel, margin: 0 }}><Eye size={13} style={{ verticalAlign: '-2px', marginRight: '4px' }} />Anteprima PDF</p>
          {downloadUrl && (
            <a href={downloadUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: '700', color: '#003DA5', textDecoration: 'none' }}>
              <Download size={13} /> Scarica prova
            </a>
          )}
        </div>
        {event.certificato_abilitato ? (
          <div style={{ position: 'relative', border: '1px solid #E5E7EB', borderRadius: '10px', overflow: 'hidden', background: '#F4F5F7', aspectRatio: '842/595', width: '100%' }}>
            {previewLoading && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#9CA3AF', fontSize: '13px', background: '#F4F5F7' }}>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Generazione anteprima…
              </div>
            )}
            {previewUrl && (
              <iframe
                src={previewUrl}
                title="Anteprima certificato"
                onLoad={() => setPreviewLoading(false)}
                style={{ width: '100%', height: '100%', border: 'none', opacity: previewLoading ? 0 : 1, transition: 'opacity 0.2s' }}
              />
            )}
          </div>
        ) : (
          <div style={{ border: '1px dashed #D1D5DB', borderRadius: '10px', padding: '32px 16px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
            Abilita i certificati per vedere l&apos;anteprima
          </div>
        )}
      </div>
      <style>{`
        @media (max-width: 900px) {
          .cert-editor-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
