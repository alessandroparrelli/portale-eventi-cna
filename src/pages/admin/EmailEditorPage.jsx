/**
 * EmailEditorPage — editor avanzato per template email
 * Modalità: visuale a blocchi (drag-to-reorder) + raw HTML + anteprima live
 */
import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, Save, Eye, EyeOff, Loader2, Mail, Code2, Layers, Plus, Trash2, GripVertical, ChevronUp, ChevronDown, Send } from 'lucide-react'
import { Field, Input, Select, Btn } from '../../components/ui'

// ─── Tipi di blocco email ────────────────────────────────────────────────────
const BLOCK_TYPES = [
  { tipo: 'testo',     label: 'Testo',       icon: '¶',  desc: 'Paragrafo o HTML libero' },
  { tipo: 'titolo',    label: 'Titolo',       icon: 'H',  desc: 'Titolo H1/H2/H3' },
  { tipo: 'info_box',  label: 'Info evento',  icon: '📅', desc: 'Data, ora e luogo' },
  { tipo: 'qr',        label: 'QR Code',      icon: '▦',  desc: 'QR code iscrizione' },
  { tipo: 'bottone',   label: 'Bottone',      icon: '►',  desc: 'CTA cliccabile' },
  { tipo: 'separatore',label: 'Separatore',   icon: '—',  desc: 'Linea divisoria' },
  { tipo: 'spazio',    label: 'Spazio',       icon: '↕',  desc: 'Spazio verticale' },
  { tipo: 'immagine',  label: 'Logo/Immagine',icon: '🖼', desc: 'Immagine centrata' },
]

const VARIABILI = [
  { key:'{{nome}}',             desc:'Nome' },
  { key:'{{cognome}}',          desc:'Cognome' },
  { key:'{{ragione_sociale}}',  desc:'Azienda' },
  { key:'{{email}}',            desc:'Email' },
  { key:'{{cellulare}}',        desc:'Cellulare' },
  { key:'{{nome_evento}}',      desc:'Nome evento' },
  { key:'{{data_evento}}',      desc:'Data evento' },
  { key:'{{luogo_evento}}',     desc:'Luogo' },
  { key:'{{qr_code}}',          desc:'Codice QR' },
  { key:'{{link_questionario}}',desc:'Link questionario' },
]

const TIPO_LABELS = {
  conferma:       { label:'Conferma iscrizione', color:'#16A34A', bg:'#DCFCE7' },
  reminder:       { label:'Reminder evento',      color:'#2563EB', bg:'#DBEAFE' },
  questionario:   { label:'Questionario',         color:'#7C3AED', bg:'#F3E8FF' },
  notifica_admin: { label:'Notifica organizzatore',color:'#D97706', bg:'#FEF3C7' },
}

// ─── Genera HTML email da blocchi ────────────────────────────────────────────
function blocchiToHtml(blocchi, accentColor = '#003DA5') {
  return blocchi.map(b => {
    switch (b.tipo) {
      case 'titolo':
        const tag = b.livello || 'h2'
        return `<${tag} style="font-family:Inter,sans-serif;font-weight:800;color:#0A0A0A;margin:0 0 12px;line-height:1.2">${b.testo||''}</${tag}>`
      case 'testo':
        return `<div style="font-family:Inter,sans-serif;font-size:15px;color:#374151;line-height:1.7;margin:0 0 16px">${b.html||b.testo||''}</div>`
      case 'info_box':
        return `<div style="background:#F9FAFB;border-radius:10px;padding:20px;margin:0 0 20px">
          <div style="display:flex;gap:12px;margin-bottom:10px;align-items:flex-start">
            <span style="font-size:20px">📅</span>
            <div><p style="margin:0;font-size:12px;color:#6B7280;text-transform:uppercase;letter-spacing:.04em">Data e ora</p>
            <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#0A0A0A">{{data_evento}}</p></div>
          </div>
          <div style="display:flex;gap:12px;align-items:flex-start">
            <span style="font-size:20px">📍</span>
            <div><p style="margin:0;font-size:12px;color:#6B7280;text-transform:uppercase;letter-spacing:.04em">Luogo</p>
            <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#0A0A0A">{{luogo_evento}}</p></div>
          </div>
        </div>`
      case 'qr':
        return `<div style="text-align:center;padding:24px 0;border-top:1px solid #F3F4F6;border-bottom:1px solid #F3F4F6;margin:0 0 20px">
          <p style="font-size:13px;color:#6B7280;margin:0 0 12px">${b.testo||'Il tuo QR code di accesso'}</p>
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data={{qr_code}}" alt="QR Code" style="width:160px;height:160px" />
          <p style="font-size:12px;color:#9CA3AF;margin:8px 0 0;font-family:monospace">{{qr_code}}</p>
        </div>`
      case 'bottone':
        return `<div style="text-align:${b.allineamento||'center'};margin:24px 0">
          <a href="${b.url||'#'}" style="background:${b.colore||accentColor};color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-family:Inter,sans-serif;font-size:15px;font-weight:700;display:inline-block">${b.testo||'Clicca qui'}</a>
        </div>`
      case 'separatore':
        return `<hr style="border:none;border-top:1px solid #E5E7EB;margin:${b.spazio||20}px 0" />`
      case 'spazio':
        return `<div style="height:${b.altezza||20}px"></div>`
      case 'immagine':
        return b.src ? `<div style="text-align:center;margin:0 0 20px"><img src="${b.src}" alt="${b.alt||''}" style="max-width:${b.larghezza||'200px'};height:auto" /></div>` : ''
      default:
        return ''
    }
  }).join('\n')
}

// ─── Genera HTML completo email ──────────────────────────────────────────────
function buildFullHtml(template, blocchi, preview = false) {
  const cp = '#003DA5'
  const bodyHtml = blocchi.length > 0 ? blocchiToHtml(blocchi, cp) : (template.corpo_html || '')
  const header = `<div style="background:${cp};color:#fff;padding:28px 32px">
    <p style="margin:0 0 4px;font-size:12px;opacity:.75;text-transform:uppercase;letter-spacing:.08em">${template.label_header||'CNA Roma'}</p>
    <h1 style="margin:0;font-size:24px;font-weight:800;line-height:1.2">{{nome_evento}}</h1>
  </div>`
  const footer = `<div style="background:#F9FAFB;padding:16px 32px;border-top:1px solid #E5E7EB">
    <p style="margin:0;font-size:11px;color:#9CA3AF;font-family:Inter,sans-serif">CNA di Roma — Artigiani Imprenditori d'Italia · <a href="mailto:marketing@cnaroma.it" style="color:${cp}">marketing@cnaroma.it</a></p>
  </div>`
  const inner = (template.mostra_header !== false ? header : '') +
    `<div style="background:#fff;padding:32px">${bodyHtml}</div>` +
    (template.mostra_footer !== false ? footer : '')
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F4F5F7"><div style="font-family:Inter,sans-serif;max-width:600px;margin:32px auto;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.1)">${inner}</div></body></html>`
}

// ─── Sostituisce variabili con valori di anteprima ───────────────────────────
function replacePreview(html) {
  return html
    .replace(/{{nome}}/g,'Mario').replace(/{{cognome}}/g,'Rossi')
    .replace(/{{ragione_sociale}}/g,'Rossi Srl').replace(/{{email}}/g,'mario@example.it')
    .replace(/{{cellulare}}/g,'333 1234567').replace(/{{nome_evento}}/g,'Convegno Artigianato Roma 2026')
    .replace(/{{data_evento}}/g,'sabato 20 settembre 2026, ore 09:00')
    .replace(/{{luogo_evento}}/g,'Palazzo dei Congressi, Roma')
    .replace(/{{qr_code}}/g,'QR-ESEMPIO123')
    .replace(/{{link_questionario}}/g,'https://forms.gle/esempio')
}

// ─── Blocco editor singolo ───────────────────────────────────────────────────
function BlockEditor({ block, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast, accentColor }) {
  const [open, setOpen] = useState(true)
  const info = BLOCK_TYPES.find(t => t.tipo === block.tipo) || {}

  return (
    <div style={{ border:'1.5px solid #E5E7EB', borderRadius:'10px', background:'#fff', overflow:'hidden', marginBottom:'8px' }}>
      {/* Header blocco */}
      <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 12px', background:'#F9FAFB', borderBottom: open ? '1px solid #E5E7EB' : 'none', cursor:'pointer' }}
        onClick={() => setOpen(o => !o)}>
        <GripVertical size={14} style={{ color:'#9CA3AF', flexShrink:0 }} />
        <span style={{ fontSize:'16px', lineHeight:1 }}>{info.icon}</span>
        <span style={{ fontSize:'13px', fontWeight:'700', color:'#374151', flex:1 }}>{info.label}</span>
        <div style={{ display:'flex', gap:'2px' }} onClick={e => e.stopPropagation()}>
          {!isFirst && <button onClick={onMoveUp} style={btnSm}><ChevronUp size={13}/></button>}
          {!isLast && <button onClick={onMoveDown} style={btnSm}><ChevronDown size={13}/></button>}
          <button onClick={onDelete} style={{ ...btnSm, color:'#EF4444', borderColor:'#FCA5A5' }}><Trash2 size={13}/></button>
        </div>
        <span style={{ color:'#9CA3AF', fontSize:'12px' }}>{open ? '▲' : '▼'}</span>
      </div>

      {/* Contenuto blocco */}
      {open && (
        <div style={{ padding:'14px' }}>
          {block.tipo === 'testo' && (
            <div>
              <label style={lbl}>Testo / HTML</label>
              <textarea value={block.html||''} onChange={e=>onChange({...block,html:e.target.value})}
                rows={5} style={{ ...inp, fontFamily:'monospace', fontSize:'13px', resize:'vertical' }}
                placeholder="Testo o HTML. Puoi usare {{nome}}, {{cognome}}, ecc." />
            </div>
          )}
          {block.tipo === 'titolo' && (
            <div style={{ display:'flex', gap:'10px' }}>
              <div style={{ flex:1 }}>
                <label style={lbl}>Testo titolo</label>
                <input value={block.testo||''} onChange={e=>onChange({...block,testo:e.target.value})} style={inp} placeholder="Ciao {{nome}}, ..." />
              </div>
              <div>
                <label style={lbl}>Livello</label>
                <select value={block.livello||'h2'} onChange={e=>onChange({...block,livello:e.target.value})} style={inp}>
                  <option value="h1">H1 Grande</option>
                  <option value="h2">H2 Medio</option>
                  <option value="h3">H3 Piccolo</option>
                </select>
              </div>
            </div>
          )}
          {block.tipo === 'info_box' && (
            <p style={{ margin:0, fontSize:'13px', color:'#6B7280', fontStyle:'italic' }}>
              Mostra automaticamente <code>{'{{data_evento}}'}</code> e <code>{'{{luogo_evento}}'}</code>.
            </p>
          )}
          {block.tipo === 'qr' && (
            <div>
              <label style={lbl}>Didascalia sopra il QR</label>
              <input value={block.testo||''} onChange={e=>onChange({...block,testo:e.target.value})} style={inp} placeholder="Il tuo QR code di accesso" />
            </div>
          )}
          {block.tipo === 'bottone' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              <div>
                <label style={lbl}>Testo bottone</label>
                <input value={block.testo||''} onChange={e=>onChange({...block,testo:e.target.value})} style={inp} placeholder="Compila il questionario →" />
              </div>
              <div>
                <label style={lbl}>URL</label>
                <input value={block.url||''} onChange={e=>onChange({...block,url:e.target.value})} style={inp} placeholder="https://... oppure {{link_questionario}}" />
              </div>
              <div style={{ display:'flex', gap:'10px' }}>
                <div style={{ flex:1 }}>
                  <label style={lbl}>Colore sfondo</label>
                  <input type="color" value={block.colore||accentColor||'#003DA5'} onChange={e=>onChange({...block,colore:e.target.value})}
                    style={{ width:'100%', height:'36px', borderRadius:'6px', border:'1px solid #E5E7EB', cursor:'pointer', padding:'2px' }} />
                </div>
                <div>
                  <label style={lbl}>Allineamento</label>
                  <select value={block.allineamento||'center'} onChange={e=>onChange({...block,allineamento:e.target.value})} style={inp}>
                    <option value="left">Sinistra</option>
                    <option value="center">Centro</option>
                    <option value="right">Destra</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          {block.tipo === 'separatore' && (
            <div>
              <label style={lbl}>Spazio verticale (px)</label>
              <input type="number" value={block.spazio||20} onChange={e=>onChange({...block,spazio:parseInt(e.target.value)||20})} style={{ ...inp, width:'100px' }} />
            </div>
          )}
          {block.tipo === 'spazio' && (
            <div>
              <label style={lbl}>Altezza (px)</label>
              <input type="number" value={block.altezza||20} onChange={e=>onChange({...block,altezza:parseInt(e.target.value)||20})} style={{ ...inp, width:'100px' }} />
            </div>
          )}
          {block.tipo === 'immagine' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              <div>
                <label style={lbl}>URL immagine</label>
                <input value={block.src||''} onChange={e=>onChange({...block,src:e.target.value})} style={inp} placeholder="https://..." />
              </div>
              <div style={{ display:'flex', gap:'10px' }}>
                <div style={{ flex:1 }}>
                  <label style={lbl}>Alt text</label>
                  <input value={block.alt||''} onChange={e=>onChange({...block,alt:e.target.value})} style={inp} placeholder="Logo CNA Roma" />
                </div>
                <div>
                  <label style={lbl}>Larghezza max</label>
                  <input value={block.larghezza||'200px'} onChange={e=>onChange({...block,larghezza:e.target.value})} style={{ ...inp, width:'100px' }} placeholder="200px" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Componente principale ───────────────────────────────────────────────────
export default function EmailEditorPage() {
  const { id, eventId } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'nuovo'

  const [eventi,       setEventi]       = useState([])
  const [template,     setTemplate]     = useState({
    event_id: eventId||'', tipo:'conferma', oggetto:'', corpo_html:'',
    giorni_prima:'', attivo:true, mostra_header:true, mostra_footer:true, label_header:'',
  })
  const [blocchi,      setBlocchi]      = useState([])
  const [mode,         setMode]         = useState('blocchi') // 'blocchi' | 'html'
  const [showPreview,  setShowPreview]  = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [saved,        setSaved]        = useState(false)
  const [sending,      setSending]      = useState(false)
  const [testEmail,    setTestEmail]    = useState('')
  const [showTest,     setShowTest]     = useState(false)

  useEffect(() => {
    supabase.from('events').select('id,titolo,email_organizzatore').order('data_inizio',{ascending:false})
      .then(({data})=>setEventi(data||[]))
    if (!isNew) loadTemplate()
  }, [id])

  async function loadTemplate() {
    const { data } = await supabase.from('email_templates').select('*').eq('id', id).single()
    if (data) {
      setTemplate({ ...data, giorni_prima: data.giorni_prima||'' })
      // Prova a parsare blocchi salvati nel corpo_html
      try {
        const parsed = JSON.parse(data.blocchi_json || '[]')
        if (Array.isArray(parsed) && parsed.length) { setBlocchi(parsed); setMode('blocchi') }
        else if (data.corpo_html) setMode('html')
      } catch { if (data.corpo_html) setMode('html') }
    }
  }

  function updTemplate(key, val) { setTemplate(p => ({ ...p, [key]: val })) }

  function addBlock(tipo) {
    const defaults = {
      testo:      { html: '<p>Ciao <strong>{{nome}}</strong>,</p>' },
      titolo:     { testo: 'La tua iscrizione è confermata!', livello: 'h2' },
      info_box:   {},
      qr:         { testo: 'Il tuo QR code di accesso' },
      bottone:    { testo: 'Clicca qui', url: '#', allineamento: 'center' },
      separatore: { spazio: 20 },
      spazio:     { altezza: 24 },
      immagine:   { src: '', alt: '', larghezza: '200px' },
    }
    setBlocchi(b => [...b, { tipo, id: Date.now(), ...(defaults[tipo]||{}) }])
  }

  function updateBlock(idx, newBlock) { setBlocchi(b => b.map((x,i) => i===idx ? newBlock : x)) }
  function deleteBlock(idx)           { setBlocchi(b => b.filter((_,i) => i!==idx)) }
  function moveBlock(idx, dir) {
    setBlocchi(b => {
      const a = [...b]; const to = idx + dir
      if (to < 0 || to >= a.length) return a
      ;[a[idx], a[to]] = [a[to], a[idx]]; return a
    })
  }

  // Sincronizza corpo_html dai blocchi prima del salvataggio
  function syncHtml() {
    if (mode === 'blocchi' && blocchi.length) {
      const html = blocchiToHtml(blocchi)
      setTemplate(p => ({ ...p, corpo_html: html }))
      return html
    }
    return template.corpo_html
  }

  async function save() {
    if (!template.oggetto.trim()) return alert("L'oggetto è obbligatorio")
    if (!template.event_id) return alert('Seleziona un evento')
    setSaving(true)
    const corpoHtml = mode === 'blocchi' && blocchi.length ? blocchiToHtml(blocchi) : template.corpo_html
    const payload = {
      event_id:     template.event_id,
      tipo:         template.tipo,
      oggetto:      template.oggetto.trim(),
      corpo_html:   corpoHtml,
      blocchi_json: mode === 'blocchi' ? JSON.stringify(blocchi) : null,
      giorni_prima: template.tipo==='reminder' && template.giorni_prima ? parseInt(template.giorni_prima) : null,
      attivo:       template.attivo,
    }
    if (isNew) await supabase.from('email_templates').insert(payload)
    else       await supabase.from('email_templates').update(payload).eq('id', id)
    setSaving(false); setSaved(true); setTimeout(()=>setSaved(false),2500)
  }

  async function sendTest() {
    if (!testEmail.trim()) return
    setSending(true)
    const corpoHtml = mode === 'blocchi' && blocchi.length ? blocchiToHtml(blocchi) : template.corpo_html
    const fullHtml = buildFullHtml(template, [], false).replace('<div style="background:#fff;padding:32px"></div>',
      `<div style="background:#fff;padding:32px">${corpoHtml}</div>`)
    // Usa Resend direttamente con l'html compilato
    const { data: { session } } = await supabase.auth.getSession()
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-test-email`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: testEmail, oggetto: template.oggetto || '(test)', html: fullHtml }),
    })
    setSending(false); setShowTest(false)
    alert(`Email di test inviata a ${testEmail}`)
  }

  const previewHtml = replacePreview(
    mode === 'blocchi' && blocchi.length
      ? buildFullHtml(template, blocchi)
      : buildFullHtml(template, [], false).replace(
          '<div style="background:#fff;padding:32px"></div>',
          `<div style="background:#fff;padding:32px">${template.corpo_html||''}</div>`
        )
  )

  const tipoInfo = TIPO_LABELS[template.tipo] || {}
  const eventoSelezionato = eventi.find(e => e.id === template.event_id)

  return (
    <div style={s.root}>
      {/* TOP BAR */}
      <div style={s.topBar}>
        <button onClick={()=>navigate('/admin/email')} style={s.backBtn}>
          <ArrowLeft size={17}/> Torna
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', flex:1, marginLeft:'16px', minWidth:0 }}>
          <Mail size={17} style={{ color:'#003DA5', flexShrink:0 }}/>
          <span style={{ fontSize:'15px', fontWeight:'700', color:'#0A0A0A', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {isNew ? 'Nuovo template email' : template.oggetto||'…'}
          </span>
          {tipoInfo.label && (
            <span style={{ backgroundColor:tipoInfo.bg, color:tipoInfo.color, fontSize:'11px', fontWeight:'700', padding:'3px 10px', borderRadius:'20px', flexShrink:0 }}>
              {tipoInfo.label}
            </span>
          )}
          {eventoSelezionato?.email_organizzatore && (
            <span style={{ fontSize:'11px', color:'#6B7280', flexShrink:0 }}>
              ✉ {eventoSelezionato.email_organizzatore}
            </span>
          )}
        </div>
        <div style={{ display:'flex', gap:'6px', flexShrink:0, alignItems:'center' }}>
          {/* Toggle modalità */}
          <div style={{ display:'flex', border:'1px solid #E5E7EB', borderRadius:'6px', overflow:'hidden' }}>
            <button onClick={()=>setMode('blocchi')} style={{ ...modeBtn, background:mode==='blocchi'?'#003DA5':'#fff', color:mode==='blocchi'?'#fff':'#374151' }}>
              <Layers size={14}/> Blocchi
            </button>
            <button onClick={()=>setMode('html')} style={{ ...modeBtn, background:mode==='html'?'#003DA5':'#fff', color:mode==='html'?'#fff':'#374151' }}>
              <Code2 size={14}/> HTML
            </button>
          </div>
          <button onClick={()=>setShowPreview(!showPreview)} style={{ ...s.ghostBtn, background:showPreview?'#EEF3FF':'transparent', color:showPreview?'#003DA5':'#374151' }}>
            {showPreview ? <EyeOff size={15}/> : <Eye size={15}/>}
          </button>
          <button onClick={()=>setShowTest(!showTest)} style={{ ...s.ghostBtn }}>
            <Send size={15}/> Test
          </button>
          <button onClick={save} disabled={saving} style={s.saveBtn}>
            {saving ? <><Loader2 size={15} style={{animation:'spin 1s linear infinite'}}/> Salvo…</>
              : saved ? '✓ Salvato'
              : <><Save size={15}/> Salva</>}
          </button>
        </div>
      </div>

      {/* Test email popup */}
      {showTest && (
        <div style={{ padding:'12px 24px', background:'#FFFBEB', borderBottom:'1px solid #FDE68A', display:'flex', alignItems:'center', gap:'10px' }}>
          <Send size={15} style={{ color:'#D97706' }}/>
          <span style={{ fontSize:'13px', fontWeight:'600', color:'#92400E' }}>Invia email di test a:</span>
          <input value={testEmail} onChange={e=>setTestEmail(e.target.value)}
            placeholder="email@esempio.it" type="email"
            style={{ ...inp, width:'260px', padding:'6px 10px', fontSize:'13px' }}
            onKeyDown={e => e.key==='Enter' && sendTest()} />
          <button onClick={sendTest} disabled={sending||!testEmail.trim()} style={{ ...s.saveBtn, background:'#D97706', padding:'6px 16px', fontSize:'13px' }}>
            {sending ? 'Invio…' : 'Invia'}
          </button>
          <button onClick={()=>setShowTest(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', fontSize:'18px', lineHeight:1 }}>×</button>
        </div>
      )}

      {/* MAIN */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

        {/* PANNELLO EDITOR */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px' }}>
          <div style={{ maxWidth:'680px', margin:'0 auto', display:'flex', flexDirection:'column', gap:'16px' }}>

            {/* ─ Configurazione ─ */}
            <div style={s.card}>
              <h3 style={s.cardTitle}>Configurazione</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                <Field label="Evento">
                  <Select value={template.event_id} onChange={e=>updTemplate('event_id',e.target.value)}>
                    <option value="">— Seleziona evento —</option>
                    {eventi.map(ev=>(
                      <option key={ev.id} value={ev.id}>
                        {ev.titolo}{ev.email_organizzatore ? ` (${ev.email_organizzatore})` : ' ⚠ nessuna email'}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Tipo email">
                  <Select value={template.tipo} onChange={e=>updTemplate('tipo',e.target.value)}>
                    <option value="conferma">Conferma iscrizione</option>
                    <option value="reminder">Reminder evento</option>
                    <option value="questionario">Questionario post-evento</option>
                    <option value="notifica_admin">Notifica organizzatore</option>
                  </Select>
                </Field>
                {template.tipo==='reminder' && (
                  <Field label="Giorni prima">
                    <Input type="number" value={template.giorni_prima}
                      onChange={e=>updTemplate('giorni_prima',e.target.value)} placeholder="es. 1"/>
                  </Field>
                )}
              </div>
              <Field label="Oggetto email" style={{ marginTop:'12px' }}>
                <Input value={template.oggetto} onChange={e=>updTemplate('oggetto',e.target.value)}
                  placeholder="es. ✅ Iscrizione confermata — {{nome_evento}}"/>
              </Field>
              <div style={{ display:'flex', gap:'20px', marginTop:'12px' }}>
                {[['mostra_header','Header con logo CNA'],['mostra_footer','Footer con contatti'],['attivo','Attivo (invio automatico)']].map(([k,label])=>(
                  <label key={k} style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'13px', cursor:'pointer', color:'#374151' }}>
                    <input type="checkbox" checked={template[k]!==false} onChange={e=>updTemplate(k,e.target.checked)} style={{ accentColor:'#003DA5' }}/>
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {/* ─ Variabili ─ */}
            <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:'10px', padding:'12px 14px' }}>
              <p style={{ margin:'0 0 8px', fontSize:'11px', fontWeight:'700', color:'#1d4ed8', textTransform:'uppercase', letterSpacing:'.05em' }}>
                Variabili — clicca per copiare
              </p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                {VARIABILI.map(v=>(
                  <button key={v.key} onClick={()=>navigator.clipboard.writeText(v.key)} title={v.desc}
                    style={{ padding:'4px 8px', background:'#fff', border:'1px solid #BFDBFE', borderRadius:'5px', cursor:'pointer', fontSize:'12px', fontFamily:'monospace', color:'#1d4ed8' }}>
                    {v.key}
                  </button>
                ))}
              </div>
            </div>

            {/* ─ Editor blocchi ─ */}
            {mode === 'blocchi' && (
              <div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
                  <p style={{ margin:0, fontSize:'13px', fontWeight:'700', color:'#374151' }}>
                    Corpo email — {blocchi.length} blocco{blocchi.length!==1?'i':''}
                  </p>
                </div>

                {/* Lista blocchi */}
                {blocchi.map((b, i) => (
                  <BlockEditor key={b.id||i} block={b} accentColor="#003DA5"
                    onChange={nb => updateBlock(i,nb)}
                    onDelete={() => deleteBlock(i)}
                    onMoveUp={() => moveBlock(i,-1)}
                    onMoveDown={() => moveBlock(i,1)}
                    isFirst={i===0} isLast={i===blocchi.length-1}
                  />
                ))}

                {/* Aggiungi blocco */}
                <div style={{ background:'#F9FAFB', border:'2px dashed #E5E7EB', borderRadius:'10px', padding:'16px' }}>
                  <p style={{ margin:'0 0 10px', fontSize:'12px', fontWeight:'700', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.05em' }}>
                    Aggiungi blocco
                  </p>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                    {BLOCK_TYPES.map(bt => (
                      <button key={bt.tipo} onClick={()=>addBlock(bt.tipo)}
                        style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 12px', background:'#fff', border:'1px solid #E5E7EB', borderRadius:'7px', cursor:'pointer', fontSize:'13px', color:'#374151', fontFamily:"'Inter',sans-serif", fontWeight:'500' }}>
                        <span>{bt.icon}</span> {bt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ─ Editor HTML ─ */}
            {mode === 'html' && (
              <div>
                <p style={{ margin:'0 0 6px', fontSize:'13px', fontWeight:'700', color:'#374151' }}>Corpo email — HTML</p>
                <textarea
                  value={template.corpo_html||''}
                  onChange={e=>updTemplate('corpo_html',e.target.value)}
                  rows={24}
                  style={{ ...inp, fontFamily:'monospace', fontSize:'13px', resize:'vertical', width:'100%', lineHeight:'1.6' }}
                  placeholder="Incolla o scrivi HTML email…"
                />
              </div>
            )}
          </div>
        </div>

        {/* PANNELLO ANTEPRIMA */}
        {showPreview && (
          <div style={s.previewPanel}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderBottom:'1px solid #E5E7EB', background:'#fff', flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                <Eye size={14} style={{ color:'#003DA5' }}/>
                <span style={{ fontSize:'12px', fontWeight:'700', color:'#0A0A0A' }}>Anteprima</span>
              </div>
              <span style={{ fontSize:'11px', color:'#9CA3AF' }}>dati di esempio</span>
            </div>
            <div style={{ padding:'12px', overflowY:'auto', flex:1 }}>
              {/* Metadati */}
              <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:'8px', padding:'10px 12px', marginBottom:'10px', fontSize:'12px' }}>
                <div style={{ color:'#6B7280', marginBottom:'3px' }}><b style={{ color:'#374151' }}>Da:</b> CNA Roma &lt;marketing@cnaroma.it&gt;</div>
                <div style={{ color:'#6B7280', marginBottom:'3px' }}><b style={{ color:'#374151' }}>A:</b> Mario Rossi &lt;mario@example.it&gt;</div>
                <div style={{ color:'#374151' }}><b>Oggetto:</b> {replacePreview(template.oggetto)||'(nessun oggetto)'}</div>
              </div>
              {/* Email rendering */}
              <iframe
                srcDoc={previewHtml}
                style={{ width:'100%', border:'none', borderRadius:'8px', background:'#F4F5F7', minHeight:'600px' }}
                sandbox="allow-same-origin"
                title="Anteprima email"
              />
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

// ─── Stili condivisi ─────────────────────────────────────────────────────────
const inp = { width:'100%', padding:'8px 12px', border:'1px solid #E5E7EB', borderRadius:'6px', fontSize:'13px', fontFamily:"'Inter',sans-serif", outline:'none', boxSizing:'border-box', color:'#0A0A0A', background:'#fff' }
const lbl = { display:'block', fontSize:'11px', fontWeight:'700', color:'#6B7280', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:'5px' }
const btnSm = { padding:'4px 7px', background:'#fff', border:'1px solid #E5E7EB', borderRadius:'5px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#374151' }
const modeBtn = { padding:'6px 12px', border:'none', cursor:'pointer', fontSize:'12px', fontWeight:'600', fontFamily:"'Inter',sans-serif", display:'flex', alignItems:'center', gap:'4px' }

const s = {
  root:         { display:'flex', flexDirection:'column', height:'100vh', background:'#F4F5F7', fontFamily:"'Inter',sans-serif", overflow:'hidden' },
  topBar:       { display:'flex', alignItems:'center', background:'#fff', borderBottom:'1px solid #E5E7EB', padding:'0 16px', height:'56px', flexShrink:0, gap:'8px' },
  backBtn:      { display:'flex', alignItems:'center', gap:'5px', background:'none', border:'1px solid #E5E7EB', borderRadius:'6px', padding:'6px 12px', cursor:'pointer', fontSize:'13px', fontWeight:'600', color:'#374151', fontFamily:"'Inter',sans-serif", flexShrink:0 },
  ghostBtn:     { display:'flex', alignItems:'center', gap:'5px', border:'1px solid #E5E7EB', borderRadius:'6px', padding:'6px 12px', cursor:'pointer', fontSize:'13px', fontWeight:'600', fontFamily:"'Inter',sans-serif", background:'transparent', color:'#374151' },
  saveBtn:      { display:'flex', alignItems:'center', gap:'5px', background:'#003DA5', color:'#fff', border:'none', borderRadius:'6px', padding:'7px 18px', cursor:'pointer', fontSize:'13px', fontWeight:'700', fontFamily:"'Inter',sans-serif" },
  card:         { background:'#fff', borderRadius:'10px', border:'1px solid #E5E7EB', padding:'18px', display:'flex', flexDirection:'column', gap:'12px' },
  cardTitle:    { fontSize:'14px', fontWeight:'700', color:'#0A0A0A', margin:0 },
  previewPanel: { width:'440px', flexShrink:0, borderLeft:'1px solid #E5E7EB', display:'flex', flexDirection:'column', background:'#F4F5F7' },
}
