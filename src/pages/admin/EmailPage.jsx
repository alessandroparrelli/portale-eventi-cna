import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import RichEditor from '../../components/editor/RichEditor'
import { Mail, Save, CheckCircle, Code, Eye as EyeIcon } from 'lucide-react'

const TIPI = [
  { key: 'conferma_iscrizione',      label: 'Conferma Iscrizione',      icon: '✅', desc: 'Inviata automaticamente all\'iscritto alla registrazione' },
  { key: 'notifica_admin',           label: 'Notifica Admin',           icon: '🔔', desc: 'Inviata agli amministratori ad ogni nuova iscrizione' },
  { key: 'reminder_evento',          label: 'Reminder Evento',          icon: '⏰', desc: 'Inviata agli iscritti prima dell\'evento (configurabile)' },
  { key: 'questionario_post_evento', label: 'Questionario Post Evento', icon: '⭐', desc: 'Inviata ai presenti dopo la chiusura dell\'evento' },
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
  '{{nome_evento}}': 'Convegno Artigianato 2026',
  '{{data_evento}}': 'Venerdì 20 giugno 2026 – ore 10:00',
  '{{luogo_evento}}': 'Sala Congressi CNA Roma – Via della Scrofa 22',
  '{{qr_code_url}}': 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=DEMO-QR',
  '{{link_landing}}': '#', '{{link_questionario}}': '#',
  '{{data_iscrizione}}': new Date().toLocaleDateString('it-IT'),
}

export default function EmailPage() {
  const [selected, setSelected] = useState('conferma_iscrizione')
  const [templates, setTemplates] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [viewMode, setViewMode] = useState('visual') // 'visual' | 'html' | 'preview'
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchTemplates() }, [])

  async function fetchTemplates() {
    setLoading(true)
    const { data } = await supabase.from('email_templates_default').select('*')
    if (data) {
      const map = {}
      data.forEach(t => { map[t.tipo] = t })
      setTemplates(map)
    }
    setLoading(false)
  }

  const current = templates[selected] || { oggetto: '', corpo_html: '' }

  function update(field, value) {
    setTemplates(prev => ({
      ...prev,
      [selected]: { ...prev[selected], [field]: value }
    }))
  }

  async function save() {
    setSaving(true)
    const t = templates[selected]
    await supabase.from('email_templates_default')
      .update({ oggetto: t.oggetto, corpo_html: t.corpo_html, updated_at: new Date().toISOString() })
      .eq('tipo', selected)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  // Inserisce variabile nel campo oggetto (sempre testo)
  function insertVarInOggetto(v) {
    const el = document.getElementById('email-oggetto-input')
    if (!el) { update('oggetto', (current.oggetto || '') + v); return }
    const start = el.selectionStart, end = el.selectionEnd
    const newVal = current.oggetto.substring(0, start) + v + current.oggetto.substring(end)
    update('oggetto', newVal)
    setTimeout(() => { el.selectionStart = el.selectionEnd = start + v.length; el.focus() }, 0)
  }

  // Inserisce variabile nel textarea HTML grezzo
  function insertVarInHtml(v) {
    const el = document.getElementById('email-html-raw')
    if (!el) { update('corpo_html', (current.corpo_html || '') + v); return }
    const start = el.selectionStart, end = el.selectionEnd
    const newVal = current.corpo_html.substring(0, start) + v + current.corpo_html.substring(end)
    update('corpo_html', newVal)
    setTimeout(() => { el.selectionStart = el.selectionEnd = start + v.length; el.focus() }, 0)
  }

  function getPreviewHtml() {
    let html = current.corpo_html || ''
    Object.entries(PREVIEW_MAP).forEach(([k, v]) => { html = html.replaceAll(k, v) })
    // Se il corpo non è un documento HTML completo, wrappalo con stili base
    if (!html.includes('<html')) {
      html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
        body{font-family:Inter,sans-serif;color:#0A0A0A;line-height:1.6;padding:24px;max-width:600px;margin:0 auto}
        h1,h2,h3{letter-spacing:-0.03em} a{color:#003DA5}
        table{border-collapse:collapse;width:100%} td,th{padding:8px 12px;border:1px solid #e5e7eb}
        th{background:#003DA5;color:white}
      </style></head><body>${html}</body></html>`
    }
    return html
  }

  // Quando si passa da visuale a HTML, sincronizza
  function switchMode(mode) {
    setViewMode(mode)
  }

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
          <Mail size={22} color="#003DA5" />
          <h1 style={s.title}>Template Email</h1>
        </div>
        <p style={s.subtitle}>
          Template di default applicati automaticamente ad ogni nuovo evento.
          Puoi personalizzarli per ogni evento dalla scheda <strong>✉️ Email</strong> nell'editor evento.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '80px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>
          Caricamento template…
        </div>
      ) : (
        <div style={s.layout}>
          {/* Sidebar */}
          <div style={s.sidebar}>
            <p style={s.sidebarLabel}>Tipo di email</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {TIPI.map(t => (
                <button key={t.key} type="button"
                  onClick={() => { setSelected(t.key); setViewMode('visual') }}
                  style={{ textAlign: 'left', padding: '14px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontFamily: "'Inter',sans-serif", background: selected === t.key ? '#003DA5' : '#F9FAFB', color: selected === t.key ? 'white' : '#0A0A0A', transition: 'all 0.15s' }}
                >
                  <div style={{ fontSize: '20px', marginBottom: '4px', lineHeight: 1 }}>{t.icon}</div>
                  <div style={{ fontWeight: '700', fontSize: '13px' }}>{t.label}</div>
                  <div style={{ fontSize: '11px', opacity: 0.72, marginTop: '3px', lineHeight: 1.4 }}>{t.desc}</div>
                </button>
              ))}
            </div>
            <div style={{ marginTop: '20px', padding: '14px', background: '#EFF6FF', borderRadius: '10px', fontSize: '12px', color: '#1D4ED8', lineHeight: 1.5 }}>
              <strong>ℹ️ Come funziona</strong><br />
              Ogni volta che crei un nuovo evento, questi template vengono copiati automaticamente. Puoi personalizzarli evento per evento.
            </div>
          </div>

          {/* Editor */}
          <div style={s.editorWrap}>
            <div style={s.editorCard}>
              {/* Toolbar */}
              <div style={s.toolbar}>
                <button type="button" onClick={() => switchMode('visual')}
                  style={{ ...s.toolBtn, background: viewMode === 'visual' ? '#003DA5' : '#F5F5F5', color: viewMode === 'visual' ? 'white' : '#555' }}>
                  ✏️ Visuale
                </button>
                <button type="button" onClick={() => switchMode('html')}
                  style={{ ...s.toolBtn, background: viewMode === 'html' ? '#003DA5' : '#F5F5F5', color: viewMode === 'html' ? 'white' : '#555', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Code size={13} /> HTML
                </button>
                <button type="button" onClick={() => switchMode('preview')}
                  style={{ ...s.toolBtn, background: viewMode === 'preview' ? '#003DA5' : '#F5F5F5', color: viewMode === 'preview' ? 'white' : '#555', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <EyeIcon size={13} /> Anteprima
                </button>
                <div style={{ flex: 1 }} />
                <button type="button" onClick={save} disabled={saving}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 18px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontFamily: "'Inter',sans-serif", background: saved ? '#16A34A' : '#003DA5', color: 'white', fontWeight: '700', fontSize: '13px' }}>
                  {saved ? <><CheckCircle size={14} /> Salvato</> : saving ? 'Salvataggio…' : <><Save size={14} /> Salva template</>}
                </button>
              </div>

              {viewMode !== 'preview' && (
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
                  {/* Oggetto */}
                  <div style={{ marginBottom: '12px' }}>
                    <label style={s.label}>Oggetto email</label>
                    <input
                      id="email-oggetto-input"
                      value={current.oggetto || ''}
                      onChange={e => update('oggetto', e.target.value)}
                      style={s.input}
                      placeholder="Oggetto dell'email..."
                    />
                  </div>
                  {/* Variabili */}
                  <div>
                    <label style={s.label}>Variabili — clicca per inserire {viewMode === 'visual' ? 'nel corpo' : 'nel campo selezionato'}</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {VARIABILI.map(v => (
                        <button key={v} type="button"
                          onClick={() => viewMode === 'html' ? insertVarInHtml(v) : insertVarInOggetto(v)}
                          style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', background: '#EEF3FF', color: '#003DA5', border: '1px solid #C7D9F8', cursor: 'pointer', fontFamily: 'monospace', fontWeight: '600' }}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Editor visuale */}
              {viewMode === 'visual' && (
                <div>
                  <RichEditor
                    key={selected}
                    value={current.corpo_html || ''}
                    onChange={html => update('corpo_html', html)}
                    placeholder="Scrivi il corpo dell'email…"
                    minHeight="380px"
                  />
                </div>
              )}

              {/* HTML grezzo */}
              {viewMode === 'html' && (
                <div style={{ padding: '16px 20px' }}>
                  <label style={s.label}>Corpo email (HTML grezzo)</label>
                  <textarea
                    id="email-html-raw"
                    value={current.corpo_html || ''}
                    onChange={e => update('corpo_html', e.target.value)}
                    rows={26}
                    style={s.textarea}
                    placeholder="Inserisci il codice HTML dell'email..."
                    spellCheck={false}
                  />
                </div>
              )}

              {/* Anteprima */}
              {viewMode === 'preview' && (
                <div style={{ padding: '20px' }}>
                  <div style={{ marginBottom: '12px', padding: '9px 14px', background: '#F8F9FF', borderRadius: '8px', fontSize: '13px', fontFamily: "'Inter',sans-serif" }}>
                    <strong>Oggetto:</strong> {(current.oggetto || '—').replaceAll('{{nome_evento}}', 'Convegno Artigianato 2026')}
                  </div>
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
                    <iframe
                      srcDoc={getPreviewHtml()}
                      style={{ width: '100%', height: '640px', border: 'none', display: 'block' }}
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
      )}
    </div>
  )
}

const s = {
  page:        { maxWidth: '1200px', fontFamily: "'Inter',sans-serif" },
  header:      { marginBottom: '28px' },
  title:       { fontSize: '30px', fontWeight: '900', color: '#0A0A0A', letterSpacing: '-0.04em', margin: 0 },
  subtitle:    { fontSize: '13px', color: '#6B7280', margin: '6px 0 0', lineHeight: 1.6 },
  layout:      { display: 'flex', gap: '24px', alignItems: 'flex-start' },
  sidebar:     { width: '240px', flexShrink: 0 },
  sidebarLabel:{ fontSize: '11px', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.06em', margin: '0 0 10px' },
  editorWrap:  { flex: 1 },
  editorCard:  { background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden' },
  toolbar:     { padding: '12px 16px', borderBottom: '1px solid #E5E7EB', display: 'flex', gap: '6px', alignItems: 'center' },
  toolBtn:     { padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontFamily: "'Inter',sans-serif", fontWeight: '600', transition: 'all 0.15s' },
  label:       { fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '6px' },
  input:       { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #E5E7EB', fontSize: '14px', boxSizing: 'border-box', fontFamily: "'Inter',sans-serif", outline: 'none' },
  textarea:    { width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1.5px solid #E5E7EB', fontSize: '12px', boxSizing: 'border-box', fontFamily: 'monospace', lineHeight: 1.6, resize: 'vertical', outline: 'none' },
}
