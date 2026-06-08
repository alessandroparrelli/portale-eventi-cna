import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Save, RotateCcw, CheckCircle } from 'lucide-react'

const TIPI = [
  { key: 'conferma_iscrizione',      label: 'Conferma Iscrizione',      icon: '✅', desc: 'Inviata all\'iscritto appena si registra' },
  { key: 'notifica_admin',           label: 'Notifica Admin',           icon: '🔔', desc: 'Inviata agli admin ad ogni nuova iscrizione' },
  { key: 'reminder_evento',          label: 'Reminder Evento',          icon: '⏰', desc: 'Inviata agli iscritti prima dell\'evento' },
  { key: 'questionario_post_evento', label: 'Questionario Post Evento', icon: '⭐', desc: 'Inviata ai presenti dopo la chiusura' },
]

const VARIABILI = [
  '{{nome}}', '{{cognome}}', '{{email}}', '{{cellulare}}',
  '{{ragione_sociale}}', '{{mestiere}}', '{{nome_evento}}',
  '{{data_evento}}', '{{luogo_evento}}', '{{qr_code_url}}',
  '{{link_landing}}', '{{link_questionario}}', '{{data_iscrizione}}'
]

const PREVIEW_MAP = {
  '{{nome}}': 'Mario', '{{cognome}}': 'Rossi',
  '{{email}}': 'mario.rossi@esempio.it', '{{cellulare}}': '340 1234567',
  '{{ragione_sociale}}': 'Rossi & Associati Srl', '{{mestiere}}': 'Consulente',
  '{{nome_evento}}': 'Questo Evento',
  '{{data_evento}}': 'Venerdì 20 giugno 2026 – ore 10:00',
  '{{luogo_evento}}': 'Sala Congressi CNA Roma – Via della Scrofa 22',
  '{{qr_code_url}}': 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=DEMO-QR',
  '{{link_landing}}': '#', '{{link_questionario}}': '#',
  '{{data_iscrizione}}': new Date().toLocaleDateString('it-IT'),
}

export default function EventEmailTab({ eventoId }) {
  const [selected, setSelected] = useState('conferma_iscrizione')
  const [templates, setTemplates] = useState({})
  const [defaultTemplates, setDefaultTemplates] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [preview, setPreview] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (eventoId) {
      Promise.all([fetchEventTemplates(), fetchDefaultTemplates()])
        .finally(() => setLoading(false))
    }
  }, [eventoId])

  async function fetchEventTemplates() {
    const { data } = await supabase
      .from('event_email_templates')
      .select('*')
      .eq('evento_id', eventoId)
    if (data) {
      const map = {}
      data.forEach(t => { map[t.tipo] = t })
      setTemplates(map)
    }
  }

  async function fetchDefaultTemplates() {
    const { data } = await supabase.from('email_templates').select('*')
    if (data) {
      const map = {}
      data.forEach(t => { map[t.tipo] = t })
      setDefaultTemplates(map)
    }
  }

  const current = templates[selected] || { oggetto: '', corpo_html: '' }
  const isPersonalizzato = !!templates[selected]?.personalizzato

  function update(field, value) {
    setTemplates(prev => ({
      ...prev,
      [selected]: { ...prev[selected], [field]: value, personalizzato: true }
    }))
  }

  async function save() {
    setSaving(true)
    const t = templates[selected]
    await supabase.from('event_email_templates')
      .update({
        oggetto: t.oggetto,
        corpo_html: t.corpo_html,
        personalizzato: true,
        updated_at: new Date().toISOString()
      })
      .eq('evento_id', eventoId)
      .eq('tipo', selected)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function ripristinaDefault() {
    const def = defaultTemplates[selected]
    if (!def) return
    if (!confirm('Vuoi ripristinare il template di default? Le modifiche personalizzate andranno perse.')) return
    setTemplates(prev => ({
      ...prev,
      [selected]: { ...prev[selected], oggetto: def.oggetto, corpo_html: def.corpo_html, personalizzato: false }
    }))
    await supabase.from('event_email_templates')
      .update({ oggetto: def.oggetto, corpo_html: def.corpo_html, personalizzato: false, updated_at: new Date().toISOString() })
      .eq('evento_id', eventoId)
      .eq('tipo', selected)
  }

  function insertVar(v) {
    const id = `corpo-event-${selected}`
    const el = document.getElementById(id)
    if (!el) {
      update('corpo_html', (current.corpo_html || '') + v)
      return
    }
    const start = el.selectionStart
    const end = el.selectionEnd
    const val = el.value
    const newVal = val.substring(0, start) + v + val.substring(end)
    update('corpo_html', newVal)
    setTimeout(() => {
      el.selectionStart = el.selectionEnd = start + v.length
      el.focus()
    }, 0)
  }

  function getPreviewHtml() {
    let html = current.corpo_html || ''
    Object.entries(PREVIEW_MAP).forEach(([k, v]) => { html = html.replaceAll(k, v) })
    return html
  }

  if (loading) return (
    <div style={{ padding: '60px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>
      Caricamento template email…
    </div>
  )

  return (
    <div>
      <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 20px', lineHeight: 1.5 }}>
        Personalizza i template email per questo evento. Le modifiche non influenzano gli altri eventi né i template di default.
      </p>

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Sidebar tipi */}
        <div style={{ width: '210px', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {TIPI.map(t => (
              <button
                key={t.key}
                type="button"
                onClick={() => { setSelected(t.key); setPreview(false) }}
                style={{
                  textAlign: 'left', padding: '12px 14px', borderRadius: '8px',
                  border: 'none', cursor: 'pointer', position: 'relative',
                  background: selected === t.key ? '#003DA5' : '#F9FAFB',
                  color: selected === t.key ? 'white' : '#0A0A0A',
                  transition: 'all 0.15s', fontFamily: "'Inter',sans-serif"
                }}
              >
                <div style={{ fontSize: '18px', marginBottom: '3px', lineHeight: 1 }}>{t.icon}</div>
                <div style={{ fontWeight: '700', fontSize: '12px' }}>{t.label}</div>
                <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px', lineHeight: 1.4 }}>{t.desc}</div>
                {templates[t.key]?.personalizzato && (
                  <div style={{
                    position: 'absolute', top: '8px', right: '8px',
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: selected === t.key ? 'rgba(255,255,255,0.8)' : '#F59E0B'
                  }} title="Personalizzato per questo evento" />
                )}
              </button>
            ))}
          </div>
          <div style={{ marginTop: '12px', padding: '10px 12px', background: '#FFFBEB', borderRadius: '8px', fontSize: '11px', color: '#92400E', lineHeight: 1.4 }}>
            🟡 = template personalizzato per questo evento
          </div>
        </div>

        {/* Editor */}
        <div style={{ flex: 1 }}>
          <div style={{ background: '#FFFFFF', borderRadius: '10px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
            {/* Toolbar */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => setPreview(false)}
                style={{ padding: '5px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontFamily: "'Inter',sans-serif", background: !preview ? '#003DA5' : '#F5F5F5', color: !preview ? 'white' : '#555', fontWeight: '600' }}>
                ✏️ Modifica
              </button>
              <button type="button" onClick={() => setPreview(true)}
                style={{ padding: '5px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontFamily: "'Inter',sans-serif", background: preview ? '#003DA5' : '#F5F5F5', color: preview ? 'white' : '#555', fontWeight: '600' }}>
                👁 Anteprima
              </button>
              <div style={{ flex: 1 }} />
              {isPersonalizzato && (
                <button type="button" onClick={ripristinaDefault}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '6px', border: '1px solid #E5E7EB', cursor: 'pointer', background: 'white', fontSize: '12px', color: '#6B7280', fontFamily: "'Inter',sans-serif" }}>
                  <RotateCcw size={12} /> Ripristina default
                </button>
              )}
              <button type="button" onClick={save} disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontFamily: "'Inter',sans-serif", background: saved ? '#16A34A' : '#003DA5', color: 'white', fontWeight: '700', fontSize: '12px' }}>
                {saved ? <><CheckCircle size={12} /> Salvato</> : saving ? 'Salvo…' : <><Save size={12} /> Salva</>}
              </button>
            </div>

            {!preview ? (
              <div style={{ padding: '16px' }}>
                {/* Oggetto */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '6px' }}>
                    Oggetto email
                  </label>
                  <input
                    value={current.oggetto || ''}
                    onChange={e => update('oggetto', e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1.5px solid #E5E7EB', fontSize: '13px', boxSizing: 'border-box', fontFamily: "'Inter',sans-serif", outline: 'none' }}
                    placeholder="Oggetto dell'email..."
                  />
                </div>

                {/* Variabili */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '6px' }}>
                    Variabili — clicca per inserire nel corpo
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {VARIABILI.map(v => (
                      <button key={v} type="button" onClick={() => insertVar(v)}
                        style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '11px', background: '#EEF3FF', color: '#003DA5', border: '1px solid #C7D9F8', cursor: 'pointer', fontFamily: 'monospace', fontWeight: '600' }}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Corpo HTML */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '6px' }}>
                    Corpo email (HTML)
                  </label>
                  <textarea
                    id={`corpo-event-${selected}`}
                    value={current.corpo_html || ''}
                    onChange={e => update('corpo_html', e.target.value)}
                    rows={20}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '7px', border: '1.5px solid #E5E7EB', fontSize: '11px', boxSizing: 'border-box', fontFamily: 'monospace', lineHeight: 1.6, resize: 'vertical', outline: 'none' }}
                    placeholder="Inserisci il codice HTML dell'email..."
                  />
                </div>
              </div>
            ) : (
              <div style={{ padding: '16px' }}>
                <div style={{ marginBottom: '10px', padding: '8px 12px', background: '#F8F9FF', borderRadius: '7px', fontSize: '13px', fontFamily: "'Inter',sans-serif" }}>
                  <strong>Oggetto:</strong> {(current.oggetto || '—').replaceAll('{{nome_evento}}', 'Questo Evento')}
                </div>
                <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
                  <iframe
                    srcDoc={getPreviewHtml()}
                    style={{ width: '100%', height: '520px', border: 'none', display: 'block' }}
                    title="Anteprima email"
                    sandbox="allow-same-origin"
                  />
                </div>
                <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '8px', fontFamily: "'Inter',sans-serif" }}>
                  Anteprima con dati di esempio. Le variabili vengono sostituite automaticamente all'invio reale.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
