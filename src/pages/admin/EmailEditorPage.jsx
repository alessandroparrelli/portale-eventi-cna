/**
 * EmailEditorPage v2 — Editor email avanzato stile "Claude Design"
 * Drag & drop blocchi, image upload, layout moderno, live preview
 */
import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { logAttivita } from '../../lib/activityLog'
import {
  ArrowLeft, Save, Eye, EyeOff, Loader2, Mail, Code2, Layers, Plus, Trash2,
  GripVertical, ChevronUp, ChevronDown, Send, Image as ImageIcon, Type,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, Link as LinkIcon,
  Smartphone, Monitor, Minus, Square, Columns, LayoutTemplate, Palette,
  Upload, X, Check, RotateCcw, Settings, Zap, Clock, Star
} from 'lucide-react'
import { Field, Input, Select, Btn } from '../../components/ui'

// ─── Costanti ────────────────────────────────────────────────────────────────
const BLU = '#003DA5'
const NERO = '#0A0A0A'

const BLOCK_TYPES = [
  { tipo: 'titolo',     label: 'Titolo',        icon: <Type size={15}/>,        cat: 'contenuto' },
  { tipo: 'testo',      label: 'Testo',          icon: <AlignLeft size={15}/>,   cat: 'contenuto' },
  { tipo: 'bottone',    label: 'Bottone CTA',    icon: <Square size={15}/>,      cat: 'contenuto' },
  { tipo: 'immagine',   label: 'Immagine',       icon: <ImageIcon size={15}/>,   cat: 'media' },
  { tipo: 'hero',       label: 'Hero banner',    icon: <LayoutTemplate size={15}/>, cat: 'layout' },
  { tipo: 'colonne',    label: '2 colonne',      icon: <Columns size={15}/>,     cat: 'layout' },
  { tipo: 'info_box',   label: 'Info evento',    icon: <Star size={15}/>,        cat: 'evento' },
  { tipo: 'qr',         label: 'QR Code',        icon: <Zap size={15}/>,         cat: 'evento' },
  { tipo: 'separatore', label: 'Separatore',     icon: <Minus size={15}/>,       cat: 'layout' },
  { tipo: 'spazio',     label: 'Spazio',         icon: <ArrowLeft size={15} style={{transform:'rotate(270deg)'}}/>, cat: 'layout' },
]

const VARIABILI = [
  { key:'{{nome}}',             desc:'Nome iscritto' },
  { key:'{{cognome}}',          desc:'Cognome' },
  { key:'{{ragione_sociale}}',  desc:'Azienda' },
  { key:'{{email}}',            desc:'Email' },
  { key:'{{nome_evento}}',      desc:'Nome evento' },
  { key:'{{data_evento}}',      desc:'Data e ora evento' },
  { key:'{{luogo_evento}}',     desc:'Luogo evento' },
  { key:'{{qr_code}}',          desc:'QR code accesso' },
  { key:'{{link_questionario}}',desc:'Link questionario' },
  { key:'{{link_landing}}',     desc:'Link pagina evento' },
]

const TIPO_LABELS = {
  conferma:       { label:'Conferma iscrizione',    color:'#16A34A', bg:'#DCFCE7', icon:'✅' },
  reminder:       { label:'Reminder evento',         color:'#2563EB', bg:'#DBEAFE', icon:'⏰' },
  questionario:   { label:'Questionario',            color:'#7C3AED', bg:'#F3E8FF', icon:'⭐' },
  notifica_admin: { label:'Notifica organizzatore',  color:'#D97706', bg:'#FEF3C7', icon:'🔔' },
}

const PREVIEW_DATA = {
  '{{nome}}': 'Marco', '{{cognome}}': 'Bianchi',
  '{{ragione_sociale}}': 'Bianchi Artigianato Srl',
  '{{email}}': 'marco@esempio.it',
  '{{nome_evento}}': 'Forum Artigiani Roma 2026',
  '{{data_evento}}': 'Venerdì 25 settembre 2026, ore 09:30',
  '{{luogo_evento}}': 'Palazzo dei Congressi, Piazzale J.F. Kennedy, Roma',
  '{{qr_code}}': 'QR-MARCO2026',
  '{{link_questionario}}': '#questionario',
  '{{link_landing}}': '#evento',
}

// ─── Defaults per ogni tipo blocco ───────────────────────────────────────────
function blockDefaults(tipo) {
  const map = {
    titolo:     { testo: 'Titolo della sezione', livello: 'h2', colore: NERO, align: 'left', size: 26 },
    testo:      { html: '<p>Scrivi il contenuto qui. Puoi usare <strong>{{nome}}</strong> e altre variabili.</p>', size: 15, colore: '#374151' },
    bottone:    { testo: 'Scopri di più →', url: '{{link_landing}}', colore: BLU, testocolore: '#ffffff', align: 'center', radius: 8, size: 15 },
    immagine:   { src: '', alt: '', larghezza: '100%', align: 'center', radius: 0 },
    hero:       { titolo: '{{nome_evento}}', sottotitolo: 'Ti aspettiamo!', bg: BLU, coloreTesto: '#ffffff', padding: 48, src: '' },
    colonne:    { sinistra: '<p>Colonna sinistra</p>', destra: '<p>Colonna destra</p>', gap: 24 },
    info_box:   { bg: '#F0F7FF', bordo: '#BFDBFE', radius: 10 },
    qr:         { testo: 'Il tuo QR code di accesso', sotto: '{{qr_code}}', size: 160 },
    separatore: { colore: '#E5E7EB', spessore: 1, spazio: 24 },
    spazio:     { altezza: 32 },
  }
  return { tipo, id: `b_${Date.now()}_${Math.random().toString(36).slice(2,7)}`, ...(map[tipo]||{}) }
}

// ─── Converti blocchi → HTML email ───────────────────────────────────────────
function blocchiToHtml(blocchi, accentColor = BLU) {
  return blocchi.map(b => {
    switch (b.tipo) {
      case 'titolo':
        const tag = b.livello || 'h2'
        const sizes = { h1: 32, h2: 24, h3: 18 }
        const sz = b.size || sizes[tag] || 24
        return `<${tag} style="font-family:Inter,Arial,sans-serif;font-weight:800;color:${b.colore||NERO};margin:0 0 12px;line-height:1.2;font-size:${sz}px;text-align:${b.align||'left'};letter-spacing:-0.02em">${b.testo||''}</${tag}>`

      case 'testo':
        return `<div style="font-family:Inter,Arial,sans-serif;font-size:${b.size||15}px;color:${b.colore||'#374151'};line-height:1.7;margin:0 0 16px">${b.html||''}</div>`

      case 'bottone':
        return `<div style="text-align:${b.align||'center'};margin:20px 0">
          <a href="${b.url||'#'}" style="background:${b.colore||accentColor};color:${b.testocolore||'#fff'};padding:14px 32px;border-radius:${b.radius||8}px;text-decoration:none;font-family:Inter,Arial,sans-serif;font-size:${b.size||15}px;font-weight:700;display:inline-block;line-height:1">${b.testo||'Clicca qui'}</a>
        </div>`

      case 'immagine':
        if (!b.src) return ''
        const wStyle = b.align === 'center' ? 'margin:0 auto' : b.align === 'right' ? 'margin-left:auto' : ''
        return `<div style="margin:0 0 20px;text-align:${b.align||'center'}">
          <img src="${b.src}" alt="${b.alt||''}" style="max-width:${b.larghezza||'100%'};height:auto;border-radius:${b.radius||0}px;display:block;${wStyle}" />
        </div>`

      case 'hero':
        const heroBg = b.src
          ? `background:linear-gradient(rgba(0,0,0,0.45),rgba(0,0,0,0.45)),url('${b.src}') center/cover no-repeat`
          : `background:${b.bg||BLU}`
        return `<div style="${heroBg};padding:${b.padding||48}px 40px;text-align:center">
          <h1 style="font-family:Inter,Arial,sans-serif;color:${b.coloreTesto||'#fff'};font-size:30px;font-weight:900;margin:0 0 12px;letter-spacing:-0.03em;line-height:1.15">${b.titolo||'{{nome_evento}}'}</h1>
          ${b.sottotitolo ? `<p style="font-family:Inter,Arial,sans-serif;color:${b.coloreTesto||'#fff'};font-size:16px;margin:0;opacity:.9">${b.sottotitolo}</p>` : ''}
        </div>`

      case 'colonne':
        return `<table style="width:100%;border-collapse:collapse;margin:0 0 20px">
          <tr>
            <td style="width:50%;vertical-align:top;padding-right:${(b.gap||24)/2}px;font-family:Inter,Arial,sans-serif;font-size:14px;color:#374151;line-height:1.6">${b.sinistra||''}</td>
            <td style="width:50%;vertical-align:top;padding-left:${(b.gap||24)/2}px;font-family:Inter,Arial,sans-serif;font-size:14px;color:#374151;line-height:1.6">${b.destra||''}</td>
          </tr>
        </table>`

      case 'info_box':
        return `<div style="background:${b.bg||'#F0F7FF'};border:1.5px solid ${b.bordo||'#BFDBFE'};border-radius:${b.radius||10}px;padding:20px 24px;margin:0 0 20px">
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:8px 0;vertical-align:top;width:32px;font-size:20px">📅</td>
              <td style="padding:8px 0 8px 12px;vertical-align:top">
                <p style="margin:0;font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:.06em;font-family:Inter,Arial,sans-serif">Data e ora</p>
                <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:${NERO};font-family:Inter,Arial,sans-serif">{{data_evento}}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0 0;font-size:20px">📍</td>
              <td style="padding:8px 0 0 12px">
                <p style="margin:0;font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:.06em;font-family:Inter,Arial,sans-serif">Luogo</p>
                <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:${NERO};font-family:Inter,Arial,sans-serif">{{luogo_evento}}</p>
              </td>
            </tr>
          </table>
        </div>`

      case 'qr':
        return `<div style="text-align:center;padding:28px 0;margin:0 0 20px">
          <p style="font-size:13px;color:#6B7280;margin:0 0 16px;font-family:Inter,Arial,sans-serif">${b.testo||'Il tuo QR code di accesso'}</p>
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=${b.size||160}x${b.size||160}&data={{qr_code}}" alt="QR Code" style="width:${b.size||160}px;height:${b.size||160}px;border-radius:8px" />
          <p style="font-size:12px;color:#9CA3AF;margin:12px 0 0;font-family:monospace">{{qr_code}}</p>
        </div>`

      case 'separatore':
        return `<div style="padding:${b.spazio||24}px 0"><hr style="border:none;border-top:${b.spessore||1}px solid ${b.colore||'#E5E7EB'};margin:0" /></div>`

      case 'spazio':
        return `<div style="height:${b.altezza||32}px"></div>`

      default: return ''
    }
  }).join('\n')
}

// ─── Wrapper HTML completo ────────────────────────────────────────────────────
function buildFullHtml(template, blocchi) {
  const ac = BLU
  const bodyHtml = blocchi.length ? blocchiToHtml(blocchi, ac) : (template.corpo_html||'')
  const header = template.mostra_header !== false
    ? `<div style="background:${ac};padding:0">
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="padding:20px 32px">
              <img src="https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png" alt="CNA Roma" style="height:40px;display:block" />
            </td>
          </tr>
        </table>
       </div>` : ''
  const footer = template.mostra_footer !== false
    ? `<div style="background:#F9FAFB;border-top:1px solid #E5E7EB;padding:20px 32px">
        <p style="margin:0;font-size:11px;color:#9CA3AF;font-family:Inter,Arial,sans-serif;line-height:1.6">
          <strong style="color:#6B7280">CNA di Roma</strong> — Confederazione Nazionale dell\u2019Artigianato e della Piccola e Media Impresa<br/>
          <a href="mailto:marketing@cnaroma.it" style="color:${ac}">marketing@cnaroma.it</a>
        </p>
       </div>` : ''
  return `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Email</title></head>
<body style="margin:0;padding:0;background:#F0F2F5;font-family:Inter,Arial,sans-serif">
<table style="width:100%;border-collapse:collapse"><tr><td style="padding:32px 16px">
<div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.1)">
${header}
<div style="padding:32px">${bodyHtml}</div>
${footer}
</div>
</td></tr></table>
</body></html>`
}

function replacePreview(html) {
  let h = html
  Object.entries(PREVIEW_DATA).forEach(([k,v]) => { h = h.replaceAll(k, v) })
  return h
}

// ─── Upload immagine su Supabase Storage ─────────────────────────────────────
async function uploadImage(file) {
  const ext = file.name.split('.').pop()
  const path = `email/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('images').upload(path, file, { upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('images').getPublicUrl(path)
  return data.publicUrl
}

// ─── Drop Zone Immagine ───────────────────────────────────────────────────────
function ImageDropZone({ value, onChange, label = 'Immagine' }) {
  const [drag, setDrag] = useState(false)
  const [uploading, setUploading] = useState(false)
  const ref = useRef()

  async function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return
    setUploading(true)
    try {
      const url = await uploadImage(file)
      onChange(url)
    } catch(e) {
      alert('Errore upload: ' + e.message)
    }
    setUploading(false)
  }

  return (
    <div>
      <label style={lbl}>{label}</label>
      {value ? (
        <div style={{ position:'relative', borderRadius:'8px', overflow:'hidden', border:'1px solid #E5E7EB' }}>
          <img src={value} style={{ width:'100%', maxHeight:'120px', objectFit:'cover', display:'block' }} />
          <button onClick={() => onChange('')}
            style={{ position:'absolute', top:'6px', right:'6px', background:'rgba(0,0,0,0.6)', border:'none', borderRadius:'50%', width:'24px', height:'24px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}>
            <X size={12}/>
          </button>
        </div>
      ) : (
        <div
          onDragOver={e => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]) }}
          onClick={() => ref.current?.click()}
          style={{ border:`2px dashed ${drag ? BLU : '#D1D5DB'}`, borderRadius:'8px', padding:'20px', textAlign:'center', cursor:'pointer', background: drag ? '#EEF3FF' : '#FAFAFA', transition:'all .15s' }}>
          <input ref={ref} type="file" accept="image/*" style={{ display:'none' }} onChange={e => handleFile(e.target.files[0])} />
          {uploading ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', color:'#6B7280', fontSize:'13px' }}>
              <Loader2 size={16} style={{ animation:'spin 1s linear infinite' }}/> Caricamento…
            </div>
          ) : (
            <>
              <Upload size={20} style={{ color:'#9CA3AF', marginBottom:'6px' }}/>
              <p style={{ margin:0, fontSize:'12px', color:'#6B7280' }}>
                <strong style={{ color: BLU }}>Trascina qui</strong> o clicca per selezionare
              </p>
              <p style={{ margin:'4px 0 0', fontSize:'11px', color:'#9CA3AF' }}>PNG, JPG, GIF, WebP</p>
            </>
          )}
        </div>
      )}
      {/* URL manuale */}
      <input value={value||''} onChange={e => onChange(e.target.value)}
        placeholder="…oppure incolla URL immagine" style={{ ...inp, marginTop:'6px', fontSize:'12px' }} />
    </div>
  )
}

// ─── Pannello proprietà per ogni tipo blocco ──────────────────────────────────
function BlockProps({ block, onChange }) {
  const set = (k, v) => onChange({ ...block, [k]: v })

  const colorRow = (label, key, def='#000000') => (
    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
      <label style={{ ...lbl, margin:0, flex:1 }}>{label}</label>
      <input type="color" value={block[key]||def} onChange={e=>set(k,e.target.value)} // NOTE: bug below fixed
        style={{ width:'36px', height:'28px', border:'1px solid #E5E7EB', borderRadius:'5px', cursor:'pointer', padding:'1px' }}/>
      <input value={block[key]||def} onChange={e=>set(key,e.target.value)}
        style={{ ...inp, width:'90px', padding:'4px 8px', fontSize:'12px', fontFamily:'monospace' }}/>
    </div>
  )
  // Correzione key bug sopra
  const colorField = (label, key, def='#000000') => (
    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
      <label style={{ ...lbl, margin:0, flex:1 }}>{label}</label>
      <input type="color" value={block[key]||def} onChange={e=>set(key,e.target.value)}
        style={{ width:'36px', height:'28px', border:'1px solid #E5E7EB', borderRadius:'5px', cursor:'pointer', padding:'1px' }}/>
      <input value={block[key]||def} onChange={e=>set(key,e.target.value)}
        style={{ ...inp, width:'90px', padding:'4px 8px', fontSize:'12px', fontFamily:'monospace' }}/>
    </div>
  )

  const numField = (label, key, def=0, unit='px', min=0, max=200) => (
    <div style={{ marginBottom:'8px' }}>
      <label style={lbl}>{label}</label>
      <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
        <input type="range" min={min} max={max} value={block[key]??def} onChange={e=>set(key,parseInt(e.target.value))}
          style={{ flex:1, accentColor:BLU }}/>
        <span style={{ fontSize:'12px', color:'#374151', minWidth:'38px', textAlign:'right' }}>{block[key]??def}{unit}</span>
      </div>
    </div>
  )

  const alignField = (key='align') => (
    <div style={{ marginBottom:'8px' }}>
      <label style={lbl}>Allineamento</label>
      <div style={{ display:'flex', gap:'4px' }}>
        {[['left',<AlignLeft size={13}/>],['center',<AlignCenter size={13}/>],['right',<AlignRight size={13}/>]].map(([v,icon])=>(
          <button key={v} onClick={()=>set(key,v)}
            style={{ flex:1, padding:'6px', border:`1px solid ${block[key]===v?BLU:'#E5E7EB'}`, borderRadius:'5px', cursor:'pointer', background:block[key]===v?'#EEF3FF':'#fff', color:block[key]===v?BLU:'#6B7280', display:'flex', alignItems:'center', justifyContent:'center' }}>
            {icon}
          </button>
        ))}
      </div>
    </div>
  )

  switch (block.tipo) {
    case 'titolo':
      return <>
        <div style={{ marginBottom:'8px' }}>
          <label style={lbl}>Testo</label>
          <input value={block.testo||''} onChange={e=>set('testo',e.target.value)} style={inp} placeholder="Titolo sezione…"/>
        </div>
        <div style={{ display:'flex', gap:'8px', marginBottom:'8px' }}>
          <div style={{ flex:1 }}>
            <label style={lbl}>Livello</label>
            <select value={block.livello||'h2'} onChange={e=>set('livello',e.target.value)} style={inp}>
              <option value="h1">H1 — Principale</option>
              <option value="h2">H2 — Sezione</option>
              <option value="h3">H3 — Sotto</option>
            </select>
          </div>
          {numField('Dimensione', 'size', 24, 'px', 12, 60)}
        </div>
        {colorField('Colore testo', 'colore', NERO)}
        {alignField()}
      </>

    case 'testo':
      return <>
        <div style={{ marginBottom:'8px' }}>
          <label style={lbl}>Contenuto HTML</label>
          <textarea value={block.html||''} onChange={e=>set('html',e.target.value)}
            rows={6} style={{ ...inp, fontFamily:'monospace', fontSize:'12px', resize:'vertical' }}
            placeholder="Usa <strong>, <em>, <br>, ecc. Variabili: {{nome}}, {{nome_evento}}…"/>
        </div>
        {numField('Dimensione testo', 'size', 15, 'px', 11, 24)}
        {colorField('Colore testo', 'colore', '#374151')}
      </>

    case 'bottone':
      return <>
        <div style={{ marginBottom:'8px' }}>
          <label style={lbl}>Testo bottone</label>
          <input value={block.testo||''} onChange={e=>set('testo',e.target.value)} style={inp} placeholder="Scopri di più →"/>
        </div>
        <div style={{ marginBottom:'8px' }}>
          <label style={lbl}>URL / Link</label>
          <input value={block.url||''} onChange={e=>set('url',e.target.value)} style={inp} placeholder="https://… o {{link_landing}}"/>
        </div>
        {colorField('Colore sfondo', 'colore', BLU)}
        {colorField('Colore testo', 'testocolore', '#ffffff')}
        {numField('Border radius', 'radius', 8, 'px', 0, 40)}
        {numField('Dimensione testo', 'size', 15, 'px', 12, 24)}
        {alignField()}
      </>

    case 'immagine':
      return <>
        <ImageDropZone value={block.src} onChange={v=>set('src',v)} label="Immagine"/>
        <div style={{ marginBottom:'8px', marginTop:'8px' }}>
          <label style={lbl}>Alt text</label>
          <input value={block.alt||''} onChange={e=>set('alt',e.target.value)} style={inp} placeholder="Descrizione immagine"/>
        </div>
        <div style={{ marginBottom:'8px' }}>
          <label style={lbl}>Larghezza massima</label>
          <div style={{ display:'flex', gap:'6px' }}>
            {['100%','75%','50%','200px','300px'].map(w=>(
              <button key={w} onClick={()=>set('larghezza',w)}
                style={{ padding:'4px 8px', border:`1px solid ${block.larghezza===w?BLU:'#E5E7EB'}`, borderRadius:'5px', cursor:'pointer', fontSize:'11px', background:block.larghezza===w?BLU:'#fff', color:block.larghezza===w?'#fff':'#374151', fontFamily:'monospace' }}>
                {w}
              </button>
            ))}
          </div>
        </div>
        {numField('Border radius', 'radius', 0, 'px', 0, 24)}
        {alignField()}
      </>

    case 'hero':
      return <>
        <div style={{ marginBottom:'8px' }}>
          <label style={lbl}>Titolo hero</label>
          <input value={block.titolo||''} onChange={e=>set('titolo',e.target.value)} style={inp} placeholder="{{nome_evento}}"/>
        </div>
        <div style={{ marginBottom:'8px' }}>
          <label style={lbl}>Sottotitolo</label>
          <input value={block.sottotitolo||''} onChange={e=>set('sottotitolo',e.target.value)} style={inp} placeholder="Tagline evento"/>
        </div>
        <ImageDropZone value={block.src} onChange={v=>set('src',v)} label="Immagine di sfondo (opzionale)"/>
        <div style={{ marginTop:'8px' }}>
          {colorField('Colore sfondo', 'bg', BLU)}
          {colorField('Colore testo', 'coloreTesto', '#ffffff')}
          {numField('Padding verticale', 'padding', 48, 'px', 16, 96)}
        </div>
      </>

    case 'colonne':
      return <>
        <div style={{ marginBottom:'8px' }}>
          <label style={lbl}>Colonna sinistra (HTML)</label>
          <textarea value={block.sinistra||''} onChange={e=>set('sinistra',e.target.value)}
            rows={4} style={{ ...inp, fontFamily:'monospace', fontSize:'12px', resize:'vertical' }}/>
        </div>
        <div style={{ marginBottom:'8px' }}>
          <label style={lbl}>Colonna destra (HTML)</label>
          <textarea value={block.destra||''} onChange={e=>set('destra',e.target.value)}
            rows={4} style={{ ...inp, fontFamily:'monospace', fontSize:'12px', resize:'vertical' }}/>
        </div>
        {numField('Gap tra colonne', 'gap', 24, 'px', 0, 48)}
      </>

    case 'info_box':
      return <>
        <p style={{ margin:'0 0 10px', fontSize:'12px', color:'#6B7280', fontStyle:'italic' }}>
          Mostra automaticamente data e luogo dall\u2019evento tramite le variabili <code>{'{{data_evento}}'}</code> e <code>{'{{luogo_evento}}'}</code>.
        </p>
        {colorField('Colore sfondo', 'bg', '#F0F7FF')}
        {colorField('Colore bordo', 'bordo', '#BFDBFE')}
        {numField('Border radius', 'radius', 10, 'px', 0, 24)}
      </>

    case 'qr':
      return <>
        <div style={{ marginBottom:'8px' }}>
          <label style={lbl}>Testo sopra il QR</label>
          <input value={block.testo||''} onChange={e=>set('testo',e.target.value)} style={inp} placeholder="Il tuo QR code di accesso"/>
        </div>
        {numField('Dimensione QR', 'size', 160, 'px', 80, 240)}
      </>

    case 'separatore':
      return <>
        {colorField('Colore linea', 'colore', '#E5E7EB')}
        {numField('Spessore', 'spessore', 1, 'px', 1, 4)}
        {numField('Spazio verticale', 'spazio', 24, 'px', 0, 64)}
      </>

    case 'spazio':
      return numField('Altezza', 'altezza', 32, 'px', 8, 120)

    default:
      return <p style={{ fontSize:'12px', color:'#9CA3AF' }}>Nessuna proprietà disponibile.</p>
  }
}

// ─── Blocco con drag handle ───────────────────────────────────────────────────
function DraggableBlock({ block, idx, total, onChange, onDelete, onMove, isSelected, onSelect, dragHandlers }) {
  const info = BLOCK_TYPES.find(t => t.tipo === block.tipo) || {}
  return (
    <div
      style={{
        border: `2px solid ${isSelected ? BLU : 'transparent'}`,
        borderRadius: '10px',
        background: '#fff',
        marginBottom: '4px',
        cursor: 'default',
        position: 'relative',
        boxShadow: isSelected ? `0 0 0 3px rgba(0,61,165,0.1)` : '0 1px 4px rgba(0,0,0,0.06)',
        transition: 'border-color .15s, box-shadow .15s',
      }}
      onClick={() => onSelect(idx)}
    >
      {/* Header blocco */}
      <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 10px', borderBottom: isSelected ? '1px solid #E5E7EB' : '1px solid transparent' }}>
        <div {...dragHandlers(idx)} style={{ cursor:'grab', color:'#D1D5DB', display:'flex', padding:'2px 4px' }}>
          <GripVertical size={14}/>
        </div>
        <span style={{ color: BLU, display:'flex' }}>{info.icon}</span>
        <span style={{ fontSize:'12px', fontWeight:'700', color:'#374151', flex:1 }}>{info.label}</span>
        <div style={{ display:'flex', gap:'2px' }} onClick={e=>e.stopPropagation()}>
          {idx > 0 && (
            <button onClick={()=>onMove(idx,-1)} style={btnTiny} title="Su"><ChevronUp size={11}/></button>
          )}
          {idx < total-1 && (
            <button onClick={()=>onMove(idx,1)} style={btnTiny} title="Giù"><ChevronDown size={11}/></button>
          )}
          <button onClick={()=>onDelete(idx)} style={{...btnTiny, color:'#EF4444'}} title="Elimina"><Trash2 size={11}/></button>
        </div>
      </div>

      {/* Preview mini del blocco */}
      {!isSelected && (
        <div style={{ padding:'6px 10px 8px', fontSize:'11px', color:'#9CA3AF', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis', maxWidth:'100%' }}>
          {block.tipo==='titolo' && (block.testo||'(vuoto)')}
          {block.tipo==='testo' && ((block.html||'').replace(/<[^>]+>/g,'').slice(0,60)||'(vuoto)')}
          {block.tipo==='bottone' && (block.testo||'Bottone')}
          {block.tipo==='immagine' && (block.src ? '🖼 ' + (block.alt||block.src.split('/').pop()) : '📎 Nessuna immagine')}
          {block.tipo==='hero' && (block.titolo||'Hero banner')}
          {block.tipo==='colonne' && '░░ Layout a due colonne'}
          {block.tipo==='info_box' && '📅 Data e luogo evento'}
          {block.tipo==='qr' && '▦ QR Code accesso'}
          {block.tipo==='separatore' && '— Separatore'}
          {block.tipo==='spazio' && `↕ Spazio ${block.altezza||32}px`}
        </div>
      )}
    </div>
  )
}

// ─── Componente principale ────────────────────────────────────────────────────
export default function EmailEditorPage() {
  const { id, eventId } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'nuovo'

  const [eventi,        setEventi]        = useState([])
  const [template,      setTemplate]      = useState({
    event_id: eventId||'', tipo:'conferma', oggetto:'', corpo_html:'',
    giorni_prima:'', attivo:true, mostra_header:true, mostra_footer:true,
  })
  const [blocchi,       setBlocchi]       = useState([])
  const [mode,          setMode]          = useState('blocchi')
  const [showPreview,   setShowPreview]   = useState(true)
  const [previewDevice, setPreviewDevice] = useState('desktop') // 'desktop' | 'mobile'
  const [saving,        setSaving]        = useState(false)
  const [saved,         setSaved]         = useState(false)
  const [sending,       setSending]       = useState(false)
  const [testEmail,     setTestEmail]     = useState('')
  const [showTest,      setShowTest]      = useState(false)
  const [selectedBlock, setSelectedBlock] = useState(null) // idx blocco selezionato
  const [showVars,      setShowVars]      = useState(false)

  // Drag state
  const dragIdx = useRef(null)
  const dragOverIdx = useRef(null)

  useEffect(() => {
    supabase.from('events').select('id,titolo,email_organizzatore').order('data_inizio',{ascending:false})
      .then(({data}) => setEventi(data||[]))
    if (!isNew) loadTemplate()
  }, [id])

  async function loadTemplate() {
    const { data } = await supabase.from('email_templates').select('*').eq('id', id).single()
    if (data) {
      setTemplate({ ...data, giorni_prima: data.giorni_prima||'' })
      try {
        const parsed = JSON.parse(data.blocchi_json || '[]')
        if (Array.isArray(parsed) && parsed.length) { setBlocchi(parsed); setMode('blocchi') }
        else if (data.corpo_html) setMode('html')
      } catch { if (data.corpo_html) setMode('html') }
    }
  }

  const updT = (k, v) => setTemplate(p => ({ ...p, [k]: v }))

  function addBlock(tipo) {
    const b = blockDefaults(tipo)
    setBlocchi(prev => {
      const idx = selectedBlock !== null ? selectedBlock + 1 : prev.length
      const next = [...prev]
      next.splice(idx, 0, b)
      setSelectedBlock(idx)
      return next
    })
  }

  function updateBlock(idx, nb) { setBlocchi(b => b.map((x,i) => i===idx ? nb : x)) }
  function deleteBlock(idx) {
    setBlocchi(b => { const n=[...b]; n.splice(idx,1); return n })
    setSelectedBlock(null)
  }
  function moveBlock(idx, dir) {
    setBlocchi(b => {
      const a=[...b]; const to=idx+dir
      if(to<0||to>=a.length) return a
      ;[a[idx],a[to]]=[a[to],a[idx]]; return a
    })
    setSelectedBlock(idx+dir)
  }

  // Drag handlers
  function dragHandlers(idx) {
    return {
      draggable: true,
      onDragStart: e => { dragIdx.current = idx; e.stopPropagation() },
      onDragOver:  e => { e.preventDefault(); dragOverIdx.current = idx },
      onDrop:      e => {
        e.preventDefault()
        const from = dragIdx.current; const to = dragOverIdx.current
        if (from===null||to===null||from===to) return
        setBlocchi(b => {
          const a=[...b]; const [item]=a.splice(from,1); a.splice(to,0,item); return a
        })
        setSelectedBlock(to)
        dragIdx.current=null; dragOverIdx.current=null
      }
    }
  }

  async function save() {
    if (!template.oggetto.trim()) return alert("L'oggetto è obbligatorio")
    if (!template.event_id) return alert('Seleziona un evento')
    setSaving(true)
    const corpoHtml = mode==='blocchi' && blocchi.length ? blocchiToHtml(blocchi) : template.corpo_html
    const payload = {
      event_id: template.event_id, tipo: template.tipo,
      oggetto: template.oggetto.trim(), corpo_html: corpoHtml,
      blocchi_json: mode==='blocchi' ? JSON.stringify(blocchi) : null,
      giorni_prima: template.tipo==='reminder' && template.giorni_prima ? parseInt(template.giorni_prima) : null,
      attivo: template.attivo,
    }
    if (isNew) await supabase.from('email_templates').insert(payload)
    else       await supabase.from('email_templates').update(payload).eq('id', id)
    logAttivita('email_template_salvato', { eventoId: template.event_id, dettagli: { tipo: template.tipo } })
    setSaving(false); setSaved(true); setTimeout(()=>setSaved(false), 2500)
  }

  async function sendTest() {
    if (!testEmail.trim()) return
    setSending(true)
    const html = replacePreview(buildFullHtml(template, blocchi))
    const { data: { session } } = await supabase.auth.getSession()
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-test-email`, {
      method:'POST',
      headers:{ 'Authorization':`Bearer ${session?.access_token}`, 'Content-Type':'application/json' },
      body: JSON.stringify({ to: testEmail, oggetto: template.oggetto||'(test)', html }),
    })
    logAttivita('email_test_inviata', { eventoId: template.event_id, dettagli: { tipo:template.tipo, a:testEmail } })
    setSending(false); setShowTest(false)
    alert(`Email di test inviata a ${testEmail}`)
  }

  const previewHtml = replacePreview(
    mode==='blocchi' && blocchi.length
      ? buildFullHtml(template, blocchi)
      : buildFullHtml(template, []).replace('<div style="padding:32px"></div>',
          `<div style="padding:32px">${template.corpo_html||''}</div>`)
  )

  const tipoInfo = TIPO_LABELS[template.tipo] || {}
  const selectedBl = selectedBlock !== null ? blocchi[selectedBlock] : null

  return (
    <div style={S.root}>
      {/* ── TOP BAR ── */}
      <div style={S.topBar}>
        <button onClick={()=>navigate('/admin/email')} style={S.backBtn}>
          <ArrowLeft size={16}/> Torna
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', flex:1, minWidth:0, marginLeft:'12px' }}>
          <Mail size={16} style={{ color:BLU, flexShrink:0 }}/>
          <span style={{ fontSize:'14px', fontWeight:'700', color:NERO, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {isNew ? 'Nuovo template email' : (template.oggetto||'…')}
          </span>
          {tipoInfo.label && (
            <span style={{ background:tipoInfo.bg, color:tipoInfo.color, fontSize:'11px', fontWeight:'700', padding:'2px 8px', borderRadius:'20px', flexShrink:0 }}>
              {tipoInfo.icon} {tipoInfo.label}
            </span>
          )}
        </div>

        <div style={{ display:'flex', gap:'5px', alignItems:'center', flexShrink:0 }}>
          {/* Modalità editor */}
          <div style={{ display:'flex', border:'1px solid #E5E7EB', borderRadius:'7px', overflow:'hidden' }}>
            {[['blocchi', <Layers size={13}/>, 'Blocchi'], ['html', <Code2 size={13}/>, 'HTML']].map(([m,ic,lb])=>(
              <button key={m} onClick={()=>setMode(m)}
                style={{ padding:'6px 12px', border:'none', cursor:'pointer', fontSize:'12px', fontWeight:'600', fontFamily:"'Inter',sans-serif", display:'flex', alignItems:'center', gap:'4px', background:mode===m?BLU:'#fff', color:mode===m?'#fff':'#374151', transition:'all .15s' }}>
                {ic} {lb}
              </button>
            ))}
          </div>

          {/* Preview device */}
          {showPreview && (
            <div style={{ display:'flex', border:'1px solid #E5E7EB', borderRadius:'7px', overflow:'hidden' }}>
              {[['desktop',<Monitor size={13}/>],['mobile',<Smartphone size={13}/>]].map(([d,ic])=>(
                <button key={d} onClick={()=>setPreviewDevice(d)}
                  style={{ padding:'6px 10px', border:'none', cursor:'pointer', background:previewDevice===d?'#F0F2F5':'#fff', color:previewDevice===d?NERO:'#9CA3AF', transition:'all .15s' }}>
                  {ic}
                </button>
              ))}
            </div>
          )}

          <button onClick={()=>setShowPreview(!showPreview)}
            style={{ ...S.ghostBtn, background: showPreview?'#EEF3FF':'transparent', color: showPreview?BLU:'#374151' }}>
            {showPreview ? <EyeOff size={14}/> : <Eye size={14}/>}
          </button>
          <button onClick={()=>setShowTest(!showTest)} style={S.ghostBtn}>
            <Send size={14}/> Test
          </button>
          <button onClick={save} disabled={saving} style={S.saveBtn}>
            {saving ? <><Loader2 size={14} style={{animation:'spin 1s linear infinite'}}/> Salvo…</>
              : saved ? <><Check size={14}/> Salvato</>
              : <><Save size={14}/> Salva</>}
          </button>
        </div>
      </div>

      {/* ── Test email bar ── */}
      {showTest && (
        <div style={{ padding:'10px 20px', background:'#FFFBEB', borderBottom:'1px solid #FDE68A', display:'flex', alignItems:'center', gap:'10px' }}>
          <Send size={14} style={{ color:'#D97706' }}/>
          <span style={{ fontSize:'12px', fontWeight:'700', color:'#92400E' }}>Invia test a:</span>
          <input value={testEmail} onChange={e=>setTestEmail(e.target.value)}
            placeholder="email@esempio.it" type="email"
            style={{ ...inp, width:'240px', padding:'6px 10px', fontSize:'12px' }}
            onKeyDown={e=>e.key==='Enter'&&sendTest()}/>
          <button onClick={sendTest} disabled={sending||!testEmail.trim()}
            style={{ ...S.saveBtn, background:'#D97706', padding:'6px 14px', fontSize:'12px' }}>
            {sending?'Invio…':'Invia'}
          </button>
          <button onClick={()=>setShowTest(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', fontSize:'18px' }}>×</button>
        </div>
      )}

      {/* ── MAIN LAYOUT ── */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

        {/* ── PANNELLO BLOCCHI (sinistra) ── */}
        <div style={{ width:'240px', flexShrink:0, borderRight:'1px solid #E5E7EB', display:'flex', flexDirection:'column', background:'#FAFAFA' }}>
          {/* Aggiungi blocchi */}
          <div style={{ padding:'12px', borderBottom:'1px solid #E5E7EB' }}>
            <p style={{ margin:'0 0 8px', fontSize:'10px', fontWeight:'800', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.08em' }}>Blocchi</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'3px' }}>
              {['contenuto','media','layout','evento'].map(cat => (
                <div key={cat}>
                  <p style={{ margin:'6px 0 3px', fontSize:'9px', fontWeight:'700', color:'#C4C9D4', textTransform:'uppercase', letterSpacing:'.08em' }}>{cat}</p>
                  {BLOCK_TYPES.filter(b=>b.cat===cat).map(bt=>(
                    <button key={bt.tipo} onClick={()=>addBlock(bt.tipo)}
                      style={{ width:'100%', display:'flex', alignItems:'center', gap:'7px', padding:'6px 8px', background:'#fff', border:'1px solid #E5E7EB', borderRadius:'6px', cursor:'pointer', fontSize:'12px', color:'#374151', fontFamily:"'Inter',sans-serif", fontWeight:'500', marginBottom:'2px', textAlign:'left' }}>
                      <span style={{ color:BLU, display:'flex', flexShrink:0 }}>{bt.icon}</span>
                      {bt.label}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Variabili */}
          <div style={{ padding:'10px 12px' }}>
            <button onClick={()=>setShowVars(!showVars)}
              style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 0', background:'none', border:'none', cursor:'pointer', fontSize:'11px', fontWeight:'700', color:'#6B7280', fontFamily:"'Inter',sans-serif" }}>
              Variabili dinamiche <span>{showVars?'▲':'▼'}</span>
            </button>
            {showVars && (
              <div style={{ marginTop:'6px', display:'flex', flexDirection:'column', gap:'3px' }}>
                {VARIABILI.map(v=>(
                  <button key={v.key} onClick={()=>navigator.clipboard.writeText(v.key)} title={`Copia ${v.key}`}
                    style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'4px 8px', background:'#EEF3FF', border:'1px solid #BFDBFE', borderRadius:'5px', cursor:'pointer', fontSize:'11px', color:BLU, fontFamily:'monospace', textAlign:'left' }}>
                    <span>{v.key}</span>
                    <span style={{ fontSize:'9px', color:'#6B7280', fontFamily:"'Inter',sans-serif", marginLeft:'4px' }}>copia</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── CANVAS CENTRALE ── */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

          {/* Settings bar */}
          <div style={{ padding:'10px 16px', borderBottom:'1px solid #E5E7EB', background:'#fff', display:'flex', gap:'12px', alignItems:'center', flexWrap:'wrap' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <label style={lbl}>Evento</label>
              <select value={template.event_id} onChange={e=>updT('event_id',e.target.value)}
                style={{ ...inp, padding:'4px 8px', fontSize:'12px', width:'auto', minWidth:'160px' }}>
                <option value="">— Seleziona —</option>
                {eventi.map(ev=>(
                  <option key={ev.id} value={ev.id}>{ev.titolo}</option>
                ))}
              </select>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <label style={lbl}>Tipo</label>
              <select value={template.tipo} onChange={e=>updT('tipo',e.target.value)}
                style={{ ...inp, padding:'4px 8px', fontSize:'12px', width:'auto' }}>
                <option value="conferma">✅ Conferma iscrizione</option>
                <option value="reminder">⏰ Reminder</option>
                <option value="questionario">⭐ Questionario</option>
                <option value="notifica_admin">🔔 Notifica admin</option>
              </select>
            </div>
            {template.tipo==='reminder' && (
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <label style={lbl}>Giorni prima</label>
                <input type="number" value={template.giorni_prima} onChange={e=>updT('giorni_prima',e.target.value)}
                  style={{ ...inp, padding:'4px 8px', fontSize:'12px', width:'60px' }} placeholder="1"/>
              </div>
            )}
            <div style={{ flex:1 }}/>
            <div style={{ display:'flex', gap:'12px' }}>
              {[['mostra_header','Header'],['mostra_footer','Footer'],['attivo','Attivo']].map(([k,lb])=>(
                <label key={k} style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'12px', cursor:'pointer', color:'#374151' }}>
                  <input type="checkbox" checked={template[k]!==false} onChange={e=>updT(k,e.target.checked)} style={{ accentColor:BLU }}/>
                  {lb}
                </label>
              ))}
            </div>
          </div>

          {/* Oggetto */}
          <div style={{ padding:'8px 16px', borderBottom:'1px solid #F3F4F6', background:'#fff', display:'flex', alignItems:'center', gap:'10px' }}>
            <span style={{ fontSize:'11px', fontWeight:'700', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.06em', flexShrink:0 }}>Oggetto</span>
            <input value={template.oggetto} onChange={e=>updT('oggetto',e.target.value)}
              placeholder="es. ✅ Iscrizione confermata — {{nome_evento}}"
              style={{ ...inp, border:'none', padding:'4px 0', fontSize:'13px', fontWeight:'500', flex:1, background:'transparent', outline:'none' }}/>
          </div>

          {/* Lista blocchi / HTML editor */}
          <div style={{ flex:1, overflowY:'auto', padding:'16px' }}>
            {mode === 'blocchi' ? (
              <>
                {blocchi.length === 0 && (
                  <div style={{ textAlign:'center', padding:'60px 20px', color:'#9CA3AF' }}>
                    <LayoutTemplate size={36} style={{ marginBottom:'12px', opacity:0.3 }}/>
                    <p style={{ margin:0, fontSize:'14px', fontWeight:'600' }}>Canvas vuoto</p>
                    <p style={{ margin:'4px 0 0', fontSize:'12px' }}>Aggiungi blocchi dal pannello a sinistra</p>
                  </div>
                )}
                {blocchi.map((b,i) => (
                  <DraggableBlock key={b.id||i}
                    block={b} idx={i} total={blocchi.length}
                    onChange={nb=>updateBlock(i,nb)}
                    onDelete={deleteBlock}
                    onMove={moveBlock}
                    isSelected={selectedBlock===i}
                    onSelect={setSelectedBlock}
                    dragHandlers={dragHandlers}
                  />
                ))}
              </>
            ) : (
              <div>
                <label style={{ ...lbl, marginBottom:'6px' }}>Corpo email — HTML grezzo</label>
                <textarea value={template.corpo_html||''} onChange={e=>updT('corpo_html',e.target.value)}
                  rows={28} style={{ ...inp, fontFamily:'monospace', fontSize:'12px', resize:'vertical', lineHeight:'1.6' }}/>
              </div>
            )}
          </div>
        </div>

        {/* ── PANNELLO PROPRIETÀ BLOCCO (destra, quando selezionato) ── */}
        {mode==='blocchi' && selectedBl && (
          <div style={{ width:'280px', flexShrink:0, borderLeft:'1px solid #E5E7EB', background:'#FAFAFA', display:'flex', flexDirection:'column', overflow:'hidden' }}>
            <div style={{ padding:'12px 14px', borderBottom:'1px solid #E5E7EB', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#fff' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                <span style={{ color:BLU, display:'flex' }}>{BLOCK_TYPES.find(t=>t.tipo===selectedBl.tipo)?.icon}</span>
                <span style={{ fontSize:'12px', fontWeight:'700', color:NERO }}>
                  {BLOCK_TYPES.find(t=>t.tipo===selectedBl.tipo)?.label}
                </span>
              </div>
              <button onClick={()=>setSelectedBlock(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', display:'flex' }}>
                <X size={14}/>
              </button>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'14px' }}>
              <BlockProps block={selectedBl} onChange={nb=>updateBlock(selectedBlock,nb)}/>
            </div>
          </div>
        )}

        {/* ── ANTEPRIMA ── */}
        {showPreview && (
          <div style={{ width: previewDevice==='mobile'?'380px':'460px', flexShrink:0, borderLeft:'1px solid #E5E7EB', display:'flex', flexDirection:'column', background:'#F0F2F5', transition:'width .2s' }}>
            <div style={{ padding:'10px 14px', borderBottom:'1px solid #E5E7EB', background:'#fff', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                <Eye size={13} style={{ color:BLU }}/>
                <span style={{ fontSize:'12px', fontWeight:'700', color:NERO }}>Anteprima</span>
              </div>
              <span style={{ fontSize:'10px', color:'#9CA3AF' }}>dati di esempio</span>
            </div>
            {/* Metadati email */}
            <div style={{ padding:'8px 12px', borderBottom:'1px solid #E5E7EB', background:'#fff', fontSize:'11px' }}>
              <div style={{ color:'#6B7280', marginBottom:'2px' }}><b style={{ color:'#374151' }}>Da:</b> CNA Roma &lt;marketing@cnaroma.it&gt;</div>
              <div style={{ color:'#374151' }}><b>Oggetto:</b> {replacePreview(template.oggetto)||'(nessun oggetto)'}</div>
            </div>
            {/* Iframe */}
            <div style={{ flex:1, overflowY:'auto', padding:'12px' }}>
              <div style={{ maxWidth: previewDevice==='mobile'?'340px':'100%', margin:'0 auto', background:'#fff', borderRadius:'8px', overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.1)' }}>
                <iframe srcDoc={previewHtml}
                  style={{ width:'100%', border:'none', minHeight:'500px', display:'block' }}
                  sandbox="allow-same-origin" title="Anteprima email"/>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        * { box-sizing: border-box; }
      `}</style>
    </div>
  )
}

// ─── Stili ────────────────────────────────────────────────────────────────────
const inp = { width:'100%', padding:'8px 10px', border:'1px solid #E5E7EB', borderRadius:'6px', fontSize:'13px', fontFamily:"'Inter',sans-serif", outline:'none', color:NERO, background:'#fff' }
const lbl = { display:'block', fontSize:'10px', fontWeight:'800', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:'4px' }
const btnTiny = { padding:'3px 5px', background:'#fff', border:'1px solid #E5E7EB', borderRadius:'4px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#374151' }

const S = {
  root:     { display:'flex', flexDirection:'column', height:'100vh', background:'#F0F2F5', fontFamily:"'Inter',sans-serif", overflow:'hidden' },
  topBar:   { display:'flex', alignItems:'center', background:'#fff', borderBottom:'1px solid #E5E7EB', padding:'0 14px', height:'52px', flexShrink:0, gap:'6px' },
  backBtn:  { display:'flex', alignItems:'center', gap:'5px', background:'none', border:'1px solid #E5E7EB', borderRadius:'6px', padding:'5px 10px', cursor:'pointer', fontSize:'12px', fontWeight:'600', color:'#374151', fontFamily:"'Inter',sans-serif", flexShrink:0 },
  ghostBtn: { display:'flex', alignItems:'center', gap:'4px', border:'1px solid #E5E7EB', borderRadius:'6px', padding:'5px 10px', cursor:'pointer', fontSize:'12px', fontWeight:'600', fontFamily:"'Inter',sans-serif", background:'transparent', color:'#374151' },
  saveBtn:  { display:'flex', alignItems:'center', gap:'4px', background:BLU, color:'#fff', border:'none', borderRadius:'6px', padding:'6px 16px', cursor:'pointer', fontSize:'12px', fontWeight:'700', fontFamily:"'Inter',sans-serif" },
}
