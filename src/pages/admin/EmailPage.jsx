/**
 * EmailPage v2 — Template email di default con sistema a blocchi
 * Stesso engine di EmailEditorPage: 10 blocchi, drag&drop, image upload, preview live
 */
import { useState, useEffect, useRef } from 'react'
import { usePageTitle } from '../../hooks/usePageTitle'
import { supabase } from '../../lib/supabase'
import {
  Mail, Save, CheckCircle, Code, Eye as EyeIcon, Layers,
  Image as ImageIcon, Type, AlignLeft, Square, Star, Zap, Minus,
  Columns, LayoutTemplate, ChevronUp, ChevronDown, Trash2, GripVertical,
  AlignCenter, AlignRight, Upload, X, Loader2, Smartphone, Monitor
} from 'lucide-react'

// ─── Costanti ─────────────────────────────────────────────────────────────────
const BLU = '#003DA5'
const NERO = '#0A0A0A'

const TIPI = [
  { key:'conferma',       label:'Conferma Iscrizione',     icon:'✅', desc:"Inviata all'iscritto alla registrazione" },
  { key:'notifica_admin', label:'Notifica Admin',           icon:'🔔', desc:"Ad ogni nuova iscrizione" },
  { key:'reminder',       label:'Reminder Evento',          icon:'⏰', desc:"Prima dell'evento (configurabile)" },
  { key:'questionario',   label:'Questionario Post Evento', icon:'⭐', desc:"Ai presenti dopo la chiusura" },
]

const BLOCK_TYPES = [
  { tipo:'titolo',    label:'Titolo',      icon:<Type size={13}/>,           cat:'contenuto' },
  { tipo:'testo',     label:'Testo',       icon:<AlignLeft size={13}/>,      cat:'contenuto' },
  { tipo:'bottone',   label:'Bottone CTA', icon:<Square size={13}/>,         cat:'contenuto' },
  { tipo:'immagine',  label:'Immagine',    icon:<ImageIcon size={13}/>,      cat:'media' },
  { tipo:'hero',      label:'Hero banner', icon:<LayoutTemplate size={13}/>, cat:'layout' },
  { tipo:'colonne',   label:'2 colonne',   icon:<Columns size={13}/>,        cat:'layout' },
  { tipo:'info_box',  label:'Info evento', icon:<Star size={13}/>,           cat:'evento' },
  { tipo:'qr',        label:'QR Code',     icon:<Zap size={13}/>,            cat:'evento' },
  { tipo:'separatore',label:'Separatore',  icon:<Minus size={13}/>,          cat:'layout' },
  { tipo:'spazio',    label:'Spazio',      icon:<span style={{fontSize:'11px'}}>↕</span>, cat:'layout' },
]

const VARIABILI = [
  '{{nome}}','{{cognome}}','{{ragione_sociale}}','{{email}}',
  '{{nome_evento}}','{{data_evento}}','{{luogo_evento}}',
  '{{qr_code}}','{{link_landing}}','{{link_questionario}}','{{data_iscrizione}}'
]

const PREVIEW_DATA = {
  '{{nome}}':'Mario','{{cognome}}':'Rossi','{{ragione_sociale}}':'Rossi Srl',
  '{{email}}':'mario@esempio.it','{{nome_evento}}':'Forum Artigiani Roma 2026',
  '{{data_evento}}':'Venerdì 20 giugno 2026, ore 10:00',
  '{{luogo_evento}}':'Sala Congressi CNA Roma, Via della Scrofa 22',
  '{{qr_code}}':'QR-MARIO2026','{{link_landing}}':'#','{{link_questionario}}':'#',
  '{{data_iscrizione}}':new Date().toLocaleDateString('it-IT'),
}

// ─── Block defaults ───────────────────────────────────────────────────────────
function blockDefaults(tipo) {
  const map = {
    titolo:     { testo:'Titolo sezione', livello:'h2', colore:NERO, align:'left', size:26 },
    testo:      { html:'<p>Scrivi qui il contenuto. Usa <strong>{{nome}}</strong> e altre variabili.</p>', size:15, colore:'#374151' },
    bottone:    { testo:'Scopri i dettagli →', url:'{{link_landing}}', colore:BLU, testocolore:'#ffffff', align:'center', radius:8, size:15 },
    immagine:   { src:'', alt:'', larghezza:'100%', align:'center', radius:0 },
    hero:       { titolo:'{{nome_evento}}', sottotitolo:'Ti aspettiamo!', bg:BLU, coloreTesto:'#ffffff', padding:48, src:'' },
    colonne:    { sinistra:'<p>Colonna sinistra</p>', destra:'<p>Colonna destra</p>', gap:24 },
    info_box:   { bg:'#F0F7FF', bordo:'#BFDBFE', radius:10 },
    qr:         { testo:'Il tuo QR code di accesso', size:160 },
    separatore: { colore:'#E5E7EB', spessore:1, spazio:24 },
    spazio:     { altezza:32 },
  }
  return { tipo, id:`b_${Date.now()}_${Math.random().toString(36).slice(2,7)}`, ...(map[tipo]||{}) }
}

// ─── Blocchi → HTML email (identico al sistema dell'EmailEditorPage) ──────────
function blocchiToHtml(blocchi) {
  return blocchi.map(b => {
    switch (b.tipo) {
      case 'titolo':
        const tag = b.livello||'h2'; const sz = b.size||24
        return `<${tag} style="font-family:Inter,Arial,sans-serif;font-weight:800;color:${b.colore||NERO};margin:0 0 12px;font-size:${sz}px;text-align:${b.align||'left'};letter-spacing:-0.02em;line-height:1.2">${b.testo||''}</${tag}>`
      case 'testo':
        return `<div style="font-family:Inter,Arial,sans-serif;font-size:${b.size||15}px;color:${b.colore||'#374151'};line-height:1.7;margin:0 0 16px">${b.html||''}</div>`
      case 'bottone':
        return `<div style="text-align:${b.align||'center'};margin:20px 0"><a href="${b.url||'#'}" style="background:${b.colore||BLU};color:${b.testocolore||'#fff'};padding:14px 32px;border-radius:${b.radius||8}px;text-decoration:none;font-family:Inter,Arial,sans-serif;font-size:${b.size||15}px;font-weight:700;display:inline-block">${b.testo||'Clicca qui'}</a></div>`
      case 'immagine':
        if (!b.src) return ''
        return `<div style="margin:0 0 20px;text-align:${b.align||'center'}"><img src="${b.src}" alt="${b.alt||''}" style="max-width:${b.larghezza||'100%'};height:auto;border-radius:${b.radius||0}px;display:block;${b.align==='center'?'margin:0 auto':''}" /></div>`
      case 'hero':
        const heroBg = b.src ? `background:linear-gradient(rgba(0,0,0,0.45),rgba(0,0,0,0.45)),url('${b.src}') center/cover` : `background:${b.bg||BLU}`
        return `<div style="${heroBg};padding:${b.padding||48}px 40px;text-align:center"><h1 style="font-family:Inter,Arial,sans-serif;color:${b.coloreTesto||'#fff'};font-size:30px;font-weight:900;margin:0 0 12px;letter-spacing:-0.03em">${b.titolo||'{{nome_evento}}'}</h1>${b.sottotitolo?`<p style="font-family:Inter,Arial,sans-serif;color:${b.coloreTesto||'#fff'};font-size:16px;margin:0;opacity:.9">${b.sottotitolo}</p>`:''}</div>`
      case 'colonne':
        return `<table style="width:100%;border-collapse:collapse;margin:0 0 20px"><tr><td style="width:50%;vertical-align:top;padding-right:${(b.gap||24)/2}px;font-family:Inter,Arial,sans-serif;font-size:14px;color:#374151;line-height:1.6">${b.sinistra||''}</td><td style="width:50%;vertical-align:top;padding-left:${(b.gap||24)/2}px;font-family:Inter,Arial,sans-serif;font-size:14px;color:#374151;line-height:1.6">${b.destra||''}</td></tr></table>`
      case 'info_box':
        return `<div style="background:${b.bg||'#F0F7FF'};border:1.5px solid ${b.bordo||'#BFDBFE'};border-radius:${b.radius||10}px;padding:20px 24px;margin:0 0 20px"><table style="width:100%;border-collapse:collapse"><tr><td style="width:32px;vertical-align:top;font-size:20px;padding:6px 0">📅</td><td style="padding:6px 0 6px 12px;vertical-align:top"><p style="margin:0;font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:.06em;font-family:Inter,Arial,sans-serif">Data e ora</p><p style="margin:4px 0 0;font-size:15px;font-weight:700;color:${NERO};font-family:Inter,Arial,sans-serif">{{data_evento}}</p></td></tr><tr><td style="vertical-align:top;font-size:20px;padding:6px 0">📍</td><td style="padding:6px 0 0 12px;vertical-align:top"><p style="margin:0;font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:.06em;font-family:Inter,Arial,sans-serif">Luogo</p><p style="margin:4px 0 0;font-size:15px;font-weight:700;color:${NERO};font-family:Inter,Arial,sans-serif">{{luogo_evento}}</p></td></tr></table></div>`
      case 'qr':
        return `<div style="text-align:center;padding:28px 0;margin:0 0 20px"><p style="font-size:13px;color:#6B7280;margin:0 0 16px;font-family:Inter,Arial,sans-serif">${b.testo||'Il tuo QR code di accesso'}</p><img src="https://api.qrserver.com/v1/create-qr-code/?size=${b.size||160}x${b.size||160}&data={{qr_code}}" alt="QR Code" style="width:${b.size||160}px;height:${b.size||160}px;border-radius:8px" /><p style="font-size:12px;color:#9CA3AF;margin:12px 0 0;font-family:monospace">{{qr_code}}</p></div>`
      case 'separatore':
        return `<div style="padding:${b.spazio||24}px 0"><hr style="border:none;border-top:${b.spessore||1}px solid ${b.colore||'#E5E7EB'};margin:0"/></div>`
      case 'spazio':
        return `<div style="height:${b.altezza||32}px"></div>`
      default: return ''
    }
  }).join('\n')
}

// ─── Wrapper HTML completo identico all'email reale ───────────────────────────
const DEFAULT_LOGO = 'https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png'

function buildFullHtml(bodyHtml, logoSrc) {
  const logo = logoSrc || DEFAULT_LOGO
  const header = `<div style="background:${BLU};padding:0"><table style="width:100%;border-collapse:collapse"><tr><td style="padding:20px 32px"><img src="${logo}" alt="CNA Roma" style="height:40px;display:block" /></td></tr></table></div>`
  const footer = `<div style="background:#F9FAFB;border-top:1px solid #E5E7EB;padding:20px 32px"><p style="margin:0;font-size:11px;color:#9CA3AF;font-family:Inter,Arial,sans-serif">CNA di Roma \u2014 Confederazione Nazionale dell\u2019Artigianato \u00b7 <a href="mailto:marketing@cnaroma.it" style="color:${BLU}">marketing@cnaroma.it</a></p></div>`
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#F0F2F5;font-family:Inter,Arial,sans-serif"><table style="width:100%;border-collapse:collapse"><tr><td style="padding:24px 16px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.1)">${header}<div style="padding:32px">${bodyHtml}</div>${footer}</div></td></tr></table></body></html>`
}

function replacePreview(html) {
  let h = html
  Object.entries(PREVIEW_DATA).forEach(([k,v]) => { h = h.replaceAll(k,v) })
  return h
}

// ─── Upload immagine ──────────────────────────────────────────────────────────
async function uploadImage(file) {
  const ext = file.name.split('.').pop()
  const path = `email/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('images').upload(path, file, { upsert:true })
  if (error) throw error
  const { data } = supabase.storage.from('images').getPublicUrl(path)
  return data.publicUrl
}

// ─── ImageDropZone ────────────────────────────────────────────────────────────
function ImageDropZone({ value, onChange, label='Immagine' }) {
  const [drag, setDrag] = useState(false)
  const [uploading, setUploading] = useState(false)
  const ref = useRef()

  async function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return
    setUploading(true)
    try { const url = await uploadImage(file); onChange(url) }
    catch(e) { alert('Errore upload: ' + e.message) }
    setUploading(false)
  }

  return (
    <div>
      <label style={lbl}>{label}</label>
      {value ? (
        <div style={{ position:'relative', borderRadius:'8px', overflow:'hidden', border:'1px solid #E5E7EB', marginBottom:'6px' }}>
          <img src={value} style={{ width:'100%', maxHeight:'90px', objectFit:'cover', display:'block' }}/>
          <button onClick={()=>onChange('')} style={{ position:'absolute', top:'5px', right:'5px', background:'rgba(0,0,0,0.6)', border:'none', borderRadius:'50%', width:'22px', height:'22px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}>
            <X size={11}/>
          </button>
        </div>
      ) : (
        <div onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)}
          onDrop={e=>{e.preventDefault();setDrag(false);handleFile(e.dataTransfer.files[0])}}
          onClick={()=>ref.current?.click()}
          style={{ border:`2px dashed ${drag?BLU:'#D1D5DB'}`, borderRadius:'7px', padding:'12px', textAlign:'center', cursor:'pointer', background:drag?'#EEF3FF':'#FAFAFA', marginBottom:'6px' }}>
          <input ref={ref} type="file" accept="image/*" style={{ display:'none' }} onChange={e=>handleFile(e.target.files[0])}/>
          {uploading
            ? <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', fontSize:'11px', color:'#6B7280' }}><Loader2 size={13} style={{ animation:'spin 1s linear infinite' }}/> Caricamento…</div>
            : <><Upload size={15} style={{ color:'#9CA3AF', marginBottom:'3px' }}/><p style={{ margin:0, fontSize:'11px', color:'#6B7280' }}><strong style={{ color:BLU }}>Trascina</strong> o clicca</p></>
          }
        </div>
      )}
      <input value={value||''} onChange={e=>onChange(e.target.value)} placeholder="…o incolla URL" style={{ ...inp, fontSize:'11px', padding:'5px 8px' }}/>
    </div>
  )
}

// ─── Pannello proprietà blocco ────────────────────────────────────────────────
function BlockProps({ block, onChange }) {
  const set = (k,v) => onChange({ ...block, [k]:v })

  const colorField = (label, key, def='#000000') => (
    <div style={{ marginBottom:'8px' }}>
      <label style={lbl}>{label}</label>
      <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
        <input type="color" value={block[key]||def} onChange={e=>set(key,e.target.value)}
          style={{ width:'30px', height:'26px', border:'1px solid #E5E7EB', borderRadius:'4px', cursor:'pointer', padding:'1px', flexShrink:0 }}/>
        <input value={block[key]||def} onChange={e=>set(key,e.target.value)}
          style={{ ...inp, padding:'4px 7px', fontSize:'11px', fontFamily:'monospace' }}/>
      </div>
    </div>
  )

  const numField = (label, key, def=0, unit='px', min=0, max=200) => (
    <div style={{ marginBottom:'8px' }}>
      <label style={lbl}>{label}</label>
      <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
        <input type="range" min={min} max={max} value={block[key]??def} onChange={e=>set(key,parseInt(e.target.value))} style={{ flex:1, accentColor:BLU }}/>
        <span style={{ fontSize:'11px', color:'#374151', minWidth:'34px', textAlign:'right' }}>{block[key]??def}{unit}</span>
      </div>
    </div>
  )

  const alignField = (key='align') => (
    <div style={{ marginBottom:'8px' }}>
      <label style={lbl}>Allineamento</label>
      <div style={{ display:'flex', gap:'3px' }}>
        {[['left',<AlignLeft size={12}/>],['center',<AlignCenter size={12}/>],['right',<AlignRight size={12}/>]].map(([v,ic])=>(
          <button key={v} onClick={()=>set(key,v)}
            style={{ flex:1, padding:'5px', border:`1px solid ${block[key]===v?BLU:'#E5E7EB'}`, borderRadius:'5px', cursor:'pointer', background:block[key]===v?'#EEF3FF':'#fff', color:block[key]===v?BLU:'#9CA3AF', display:'flex', alignItems:'center', justifyContent:'center' }}>
            {ic}
          </button>
        ))}
      </div>
    </div>
  )

  switch (block.tipo) {
    case 'titolo': return <>
      <div style={{ marginBottom:'8px' }}><label style={lbl}>Testo</label><input value={block.testo||''} onChange={e=>set('testo',e.target.value)} style={inp}/></div>
      <div style={{ marginBottom:'8px' }}><label style={lbl}>Livello</label><select value={block.livello||'h2'} onChange={e=>set('livello',e.target.value)} style={inp}><option value="h1">H1</option><option value="h2">H2</option><option value="h3">H3</option></select></div>
      {numField('Dimensione','size',24,'px',12,60)}
      {colorField('Colore','colore',NERO)}
      {alignField()}
    </>
    case 'testo': return <>
      <div style={{ marginBottom:'8px' }}><label style={lbl}>HTML</label><textarea value={block.html||''} onChange={e=>set('html',e.target.value)} rows={5} style={{ ...inp, fontFamily:'monospace', fontSize:'11px', resize:'vertical' }}/></div>
      {numField('Dimensione','size',15,'px',11,22)}
      {colorField('Colore','colore','#374151')}
    </>
    case 'bottone': return <>
      <div style={{ marginBottom:'8px' }}><label style={lbl}>Testo</label><input value={block.testo||''} onChange={e=>set('testo',e.target.value)} style={inp}/></div>
      <div style={{ marginBottom:'8px' }}><label style={lbl}>URL</label><input value={block.url||''} onChange={e=>set('url',e.target.value)} style={inp} placeholder="https://… o {{link_landing}}"/></div>
      {colorField('Colore sfondo','colore',BLU)}
      {colorField('Colore testo','testocolore','#ffffff')}
      {numField('Border radius','radius',8,'px',0,40)}
      {alignField()}
    </>
    case 'immagine': return <>
      <ImageDropZone value={block.src} onChange={v=>set('src',v)}/>
      <div style={{ marginBottom:'8px', marginTop:'6px' }}><label style={lbl}>Alt text</label><input value={block.alt||''} onChange={e=>set('alt',e.target.value)} style={inp}/></div>
      <div style={{ marginBottom:'8px' }}>
        <label style={lbl}>Larghezza</label>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
          {['100%','75%','50%','200px','300px'].map(w=>(
            <button key={w} onClick={()=>set('larghezza',w)} style={{ padding:'3px 7px', border:`1px solid ${block.larghezza===w?BLU:'#E5E7EB'}`, borderRadius:'4px', cursor:'pointer', fontSize:'10px', background:block.larghezza===w?BLU:'#fff', color:block.larghezza===w?'#fff':'#374151', fontFamily:'monospace' }}>{w}</button>
          ))}
        </div>
      </div>
      {numField('Radius','radius',0,'px',0,24)}
      {alignField()}
    </>
    case 'hero': return <>
      <div style={{ marginBottom:'8px' }}><label style={lbl}>Titolo</label><input value={block.titolo||''} onChange={e=>set('titolo',e.target.value)} style={inp}/></div>
      <div style={{ marginBottom:'8px' }}><label style={lbl}>Sottotitolo</label><input value={block.sottotitolo||''} onChange={e=>set('sottotitolo',e.target.value)} style={inp}/></div>
      <ImageDropZone value={block.src} onChange={v=>set('src',v)} label="Sfondo (opzionale)"/>
      <div style={{ marginTop:'8px' }}>
        {colorField('Colore sfondo','bg',BLU)}
        {colorField('Colore testo','coloreTesto','#ffffff')}
        {numField('Padding','padding',48,'px',16,96)}
      </div>
    </>
    case 'colonne': return <>
      <div style={{ marginBottom:'8px' }}><label style={lbl}>Colonna sinistra (HTML)</label><textarea value={block.sinistra||''} onChange={e=>set('sinistra',e.target.value)} rows={3} style={{ ...inp, fontFamily:'monospace', fontSize:'11px', resize:'vertical' }}/></div>
      <div style={{ marginBottom:'8px' }}><label style={lbl}>Colonna destra (HTML)</label><textarea value={block.destra||''} onChange={e=>set('destra',e.target.value)} rows={3} style={{ ...inp, fontFamily:'monospace', fontSize:'11px', resize:'vertical' }}/></div>
      {numField('Gap','gap',24,'px',0,48)}
    </>
    case 'info_box': return <>
      <p style={{ fontSize:'11px', color:'#6B7280', margin:'0 0 10px', fontStyle:'italic' }}>Mostra automaticamente data e luogo dall\u2019evento.</p>
      {colorField('Sfondo','bg','#F0F7FF')}
      {colorField('Bordo','bordo','#BFDBFE')}
      {numField('Radius','radius',10,'px',0,24)}
    </>
    case 'qr': return <>
      <div style={{ marginBottom:'8px' }}><label style={lbl}>Testo sopra</label><input value={block.testo||''} onChange={e=>set('testo',e.target.value)} style={inp}/></div>
      {numField('Dimensione QR','size',160,'px',80,240)}
    </>
    case 'separatore': return <>
      {colorField('Colore linea','colore','#E5E7EB')}
      {numField('Spessore','spessore',1,'px',1,4)}
      {numField('Spazio','spazio',24,'px',0,64)}
    </>
    case 'spazio': return numField('Altezza','altezza',32,'px',8,120)
    default: return null
  }
}

// ─── Componente principale ────────────────────────────────────────────────────
export default function EmailPage() {
  usePageTitle('Email')
  const [selected,      setSelected]      = useState('conferma')
  const [templates,     setTemplates]     = useState({})
  const [blocchi,       setBlocchi]       = useState({}) // per tipo
  const [saving,        setSaving]        = useState(false)
  const [saved,         setSaved]         = useState(false)
  const [viewMode,      setViewMode]      = useState('blocchi')
  const [previewDevice, setPreviewDevice] = useState('desktop')
  const [loading,       setLoading]       = useState(true)
  const [selectedBlock, setSelectedBlock] = useState(null)
  const [showVars,      setShowVars]      = useState(false)
  const [logoUrl,       setLogoUrl]       = useState('')
  const dragIdx = useRef(null)
  const dragOverIdx = useRef(null)

  useEffect(() => { fetchTemplates() }, [])
  useEffect(() => { setSelectedBlock(null) }, [selected])

  async function fetchTemplates() {
    setLoading(true)
    const { data } = await supabase.from('email_templates_default').select('*')
    if (data) {
      const tMap = {}, bMap = {}
      let firstLogoUrl = ''
      data.forEach(t => {
        tMap[t.tipo] = t
        if (t.logo_url && !firstLogoUrl) firstLogoUrl = t.logo_url
        try {
          const parsed = JSON.parse(t.blocchi_json||'[]')
          if (Array.isArray(parsed) && parsed.length) bMap[t.tipo] = parsed
        } catch {}
      })
      setTemplates(tMap)
      setBlocchi(bMap)
      if (firstLogoUrl) setLogoUrl(firstLogoUrl)
    }
    setLoading(false)
  }

  const current = templates[selected] || { oggetto:'', corpo_html:'' }
  const currBlocchi = blocchi[selected] || []

  function update(field, value) {
    setTemplates(prev => ({ ...prev, [selected]:{ ...prev[selected], [field]:value } }))
  }
  function updateBlocchi(nb) {
    setBlocchi(prev => ({ ...prev, [selected]:nb }))
  }

  function addBlock(tipo) {
    const b = blockDefaults(tipo)
    const idx = selectedBlock !== null ? selectedBlock+1 : currBlocchi.length
    const next = [...currBlocchi]; next.splice(idx, 0, b)
    updateBlocchi(next); setSelectedBlock(idx)
  }
  function updateBlock(idx, nb) { updateBlocchi(currBlocchi.map((x,i)=>i===idx?nb:x)) }
  function deleteBlock(idx) { updateBlocchi(currBlocchi.filter((_,i)=>i!==idx)); setSelectedBlock(null) }
  function moveBlock(idx, dir) {
    const a=[...currBlocchi]; const to=idx+dir
    if(to<0||to>=a.length) return
    ;[a[idx],a[to]]=[a[to],a[idx]]; updateBlocchi(a); setSelectedBlock(to)
  }

  function dragHandlers(idx) {
    return {
      draggable: true,
      onDragStart: e => { dragIdx.current=idx; e.stopPropagation() },
      onDragOver:  e => { e.preventDefault(); dragOverIdx.current=idx },
      onDrop:      e => {
        e.preventDefault()
        const from=dragIdx.current, to=dragOverIdx.current
        if(from===null||to===null||from===to) return
        const a=[...currBlocchi]; const [item]=a.splice(from,1); a.splice(to,0,item)
        updateBlocchi(a); setSelectedBlock(to)
        dragIdx.current=null; dragOverIdx.current=null
      }
    }
  }

  async function save() {
    setSaving(true)
    const bodyHtml = viewMode==='html' ? current.corpo_html : blocchiToHtml(currBlocchi)
    await supabase.from('email_templates_default')
      .update({ oggetto:current.oggetto, corpo_html:bodyHtml, blocchi_json:JSON.stringify(currBlocchi), logo_url:logoUrl||null, updated_at:new Date().toISOString() })
      .eq('tipo', selected)
    setSaving(false); setSaved(true); setTimeout(()=>setSaved(false), 2500)
  }

  const previewHtml = replacePreview(
    buildFullHtml(currBlocchi.length ? blocchiToHtml(currBlocchi) : (current.corpo_html||''), logoUrl)
  )

  const selectedBl = selectedBlock !== null ? currBlocchi[selectedBlock] : null

  if (loading) return (
    <div style={{ padding:'80px', textAlign:'center', color:'#9CA3AF', fontSize:'14px' }}>Caricamento template…</div>
  )

  return (
    <div style={{ fontFamily:"'Inter',sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom:'24px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'4px' }}>
          <Mail size={22} color={BLU}/>
          <h1 style={{ fontSize:'28px', fontWeight:'900', color:NERO, letterSpacing:'-0.04em', margin:0 }}>Template Email</h1>
        </div>
        <p style={{ fontSize:'13px', color:'#6B7280', margin:0, lineHeight:1.6 }}>
          Template di default copiati automaticamente ad ogni nuovo evento. Personalizzali per ogni evento dalla scheda <strong>✉️ Email</strong> nell\u2019editor evento.
        </p>
      </div>

      <div style={{ display:'flex', gap:'20px', alignItems:'flex-start' }}>

        {/* ── Sidebar tipi ── */}
        <div style={{ width:'210px', flexShrink:0 }}>
          <p style={{ fontSize:'10px', fontWeight:'800', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.08em', margin:'0 0 8px' }}>Tipo di email</p>
          <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
            {TIPI.map(t=>(
              <button key={t.key} type="button" onClick={()=>{ setSelected(t.key); setViewMode('blocchi') }}
                style={{ textAlign:'left', padding:'12px 14px', borderRadius:'10px', border:'none', cursor:'pointer', background:selected===t.key?BLU:'#F9FAFB', color:selected===t.key?'white':NERO, fontFamily:"'Inter',sans-serif" }}>
                <div style={{ fontSize:'18px', marginBottom:'3px', lineHeight:1 }}>{t.icon}</div>
                <div style={{ fontWeight:'700', fontSize:'12px' }}>{t.label}</div>
                <div style={{ fontSize:'10px', opacity:.7, marginTop:'2px', lineHeight:1.4 }}>{t.desc}</div>
              </button>
            ))}
          </div>
          <div style={{ marginTop:'12px', padding:'10px 12px', background:'#EFF6FF', borderRadius:'8px', fontSize:'11px', color:'#1D4ED8', lineHeight:1.5 }}>
            <strong>ℹ️ Come funziona</strong><br/>
            Ogni nuovo evento copia questi template. Puoi personalizzarli evento per evento.
          </div>
        </div>

        {/* ── Area centrale ── */}
        <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', gap:'8px' }}>

          {/* Toolbar */}
          <div style={{ background:'#fff', borderRadius:'10px', border:'1px solid #E5E7EB', padding:'10px 12px', display:'flex', gap:'5px', alignItems:'center', flexWrap:'wrap' }}>
            {[['blocchi',<Layers size={12}/>, 'Blocchi'],['html',<Code size={12}/>,'HTML'],['preview',<EyeIcon size={12}/>,'Anteprima']].map(([m,ic,lb])=>(
              <button key={m} type="button" onClick={()=>setViewMode(m)}
                style={{ display:'flex', alignItems:'center', gap:'4px', padding:'5px 10px', borderRadius:'6px', border:'none', cursor:'pointer', background:viewMode===m?BLU:'#F5F5F5', color:viewMode===m?'#fff':'#555', fontSize:'11px', fontWeight:'600', fontFamily:"'Inter',sans-serif" }}>
                {ic} {lb}
              </button>
            ))}
            {viewMode==='preview' && (
              <div style={{ display:'flex', border:'1px solid #E5E7EB', borderRadius:'6px', overflow:'hidden', marginLeft:'4px' }}>
                {[['desktop',<Monitor size={12}/>],['mobile',<Smartphone size={12}/>]].map(([d,ic])=>(
                  <button key={d} type="button" onClick={()=>setPreviewDevice(d)}
                    style={{ padding:'5px 9px', border:'none', cursor:'pointer', background:previewDevice===d?'#F0F2F5':'#fff', color:previewDevice===d?NERO:'#9CA3AF', display:'flex', alignItems:'center' }}>
                    {ic}
                  </button>
                ))}
              </div>
            )}
            <div style={{ flex:1 }}/>
            <button type="button" onClick={save} disabled={saving}
              style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 16px', borderRadius:'6px', border:'none', cursor:'pointer', fontFamily:"'Inter',sans-serif", background:saved?'#16A34A':BLU, color:'white', fontWeight:'700', fontSize:'12px' }}>
              {saved?<><CheckCircle size={12}/>Salvato</>:saving?'Salvataggio…':<><Save size={12}/>Salva template</>}
            </button>
          </div>

          {/* Oggetto */}
          {viewMode !== 'preview' && (
            <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:'8px', padding:'10px 14px', display:'flex', alignItems:'center', gap:'8px' }}>
              <span style={{ fontSize:'10px', fontWeight:'800', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.07em', flexShrink:0 }}>Oggetto</span>
              <input value={current.oggetto||''} onChange={e=>update('oggetto',e.target.value)}
                style={{ ...inp, border:'none', padding:'2px 0', fontSize:'13px', fontWeight:'500', background:'transparent', outline:'none' }}
                placeholder="Oggetto dell'email…"/>
            </div>
          )}

          {viewMode !== 'preview' && (
            <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:'8px', padding:'10px 14px', display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
              <span style={{ fontSize:'10px', fontWeight:'800', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.07em', flexShrink:0 }}>Logo header</span>
              {logoUrl && <img src={logoUrl} style={{ height:'28px', borderRadius:'4px', background:'#003DA5', padding:'4px 8px', objectFit:'contain' }} alt="logo"/>}
              <input value={logoUrl||''} onChange={e=>setLogoUrl(e.target.value)}
                style={{ ...inp, border:'none', padding:'2px 0', fontSize:'11px', fontFamily:'monospace', background:'transparent', outline:'none', flex:1, minWidth:'180px' }}
                placeholder="URL logo (lascia vuoto per il logo default CNA Roma)"/>
              {logoUrl && <button type="button" onClick={()=>setLogoUrl('')}
                style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', fontSize:'11px' }}>✕ reset</button>}
            </div>
          )}

          {/* ── Blocchi ── */}
          {viewMode === 'blocchi' && (
            <div style={{ display:'flex', gap:'10px', alignItems:'flex-start' }}>
              {/* Canvas blocchi */}
              <div style={{ flex:1 }}>
                {currBlocchi.length === 0 && (
                  <div style={{ textAlign:'center', padding:'36px 16px', color:'#9CA3AF', background:'#fff', border:'1.5px dashed #E5E7EB', borderRadius:'10px' }}>
                    <LayoutTemplate size={28} style={{ marginBottom:'8px', opacity:.3 }}/>
                    <p style={{ margin:0, fontSize:'13px', fontWeight:'600' }}>Canvas vuoto</p>
                    <p style={{ margin:'3px 0 0', fontSize:'11px' }}>Aggiungi blocchi dalla barra sotto</p>
                  </div>
                )}
                {currBlocchi.map((b,i) => {
                  const info = BLOCK_TYPES.find(t=>t.tipo===b.tipo)||{}
                  const isSel = selectedBlock === i
                  return (
                    <div key={b.id||i} {...dragHandlers(i)} onClick={()=>setSelectedBlock(isSel?null:i)}
                      style={{ border:`2px solid ${isSel?BLU:'transparent'}`, borderRadius:'8px', background:'#fff', marginBottom:'4px', cursor:'pointer', boxShadow:isSel?`0 0 0 3px rgba(0,61,165,0.08)`:'0 1px 3px rgba(0,0,0,0.05)', overflow:'hidden' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'5px', padding:'8px 10px' }}>
                        <div style={{ cursor:'grab', color:'#D1D5DB', display:'flex' }}><GripVertical size={13}/></div>
                        <span style={{ color:BLU, display:'flex' }}>{info.icon}</span>
                        <span style={{ fontSize:'11px', fontWeight:'700', color:'#374151', flex:1 }}>{info.label}</span>
                        <div style={{ display:'flex', gap:'2px' }} onClick={e=>e.stopPropagation()}>
                          {i>0&&<button onClick={()=>moveBlock(i,-1)} style={btnTiny}><ChevronUp size={10}/></button>}
                          {i<currBlocchi.length-1&&<button onClick={()=>moveBlock(i,1)} style={btnTiny}><ChevronDown size={10}/></button>}
                          <button onClick={()=>deleteBlock(i)} style={{...btnTiny,color:'#EF4444'}}><Trash2 size={10}/></button>
                        </div>
                      </div>
                      {!isSel && (
                        <div style={{ padding:'2px 10px 7px 30px', fontSize:'10px', color:'#9CA3AF', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>
                          {b.tipo==='titolo'&&(b.testo||'(vuoto)')}
                          {b.tipo==='testo'&&((b.html||'').replace(/<[^>]+>/g,'').slice(0,55)||'(vuoto)')}
                          {b.tipo==='bottone'&&(b.testo||'Bottone')}
                          {b.tipo==='immagine'&&(b.src?'🖼 '+b.src.split('/').pop():'📎 Nessuna immagine')}
                          {b.tipo==='hero'&&(b.titolo||'Hero')}
                          {b.tipo==='colonne'&&'░░ 2 colonne'}
                          {b.tipo==='info_box'&&'📅 Data e luogo'}
                          {b.tipo==='qr'&&'▦ QR Code'}
                          {b.tipo==='separatore'&&'— Separatore'}
                          {b.tipo==='spazio'&&`↕ ${b.altezza||32}px`}
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Aggiungi blocco */}
                <div style={{ background:'#F9FAFB', border:'1.5px dashed #E5E7EB', borderRadius:'8px', padding:'10px 12px', marginTop:'4px' }}>
                  <p style={{ margin:'0 0 7px', fontSize:'9px', fontWeight:'800', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.08em' }}>+ Aggiungi blocco</p>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
                    {BLOCK_TYPES.map(bt=>(
                      <button key={bt.tipo} type="button" onClick={()=>addBlock(bt.tipo)}
                        style={{ display:'flex', alignItems:'center', gap:'4px', padding:'5px 9px', background:'#fff', border:'1px solid #E5E7EB', borderRadius:'6px', cursor:'pointer', fontSize:'11px', color:'#374151', fontFamily:"'Inter',sans-serif", fontWeight:'500' }}>
                        <span style={{ color:BLU }}>{bt.icon}</span> {bt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pannello proprietà / variabili */}
              <div style={{ width:'220px', flexShrink:0 }}>
                {selectedBl ? (
                  <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:'10px', overflow:'hidden' }}>
                    <div style={{ padding:'9px 12px', borderBottom:'1px solid #E5E7EB', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#F9FAFB' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                        <span style={{ color:BLU, display:'flex' }}>{BLOCK_TYPES.find(t=>t.tipo===selectedBl.tipo)?.icon}</span>
                        <span style={{ fontSize:'11px', fontWeight:'700', color:NERO }}>{BLOCK_TYPES.find(t=>t.tipo===selectedBl.tipo)?.label}</span>
                      </div>
                      <button type="button" onClick={()=>setSelectedBlock(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF' }}><X size={13}/></button>
                    </div>
                    <div style={{ padding:'12px', maxHeight:'600px', overflowY:'auto' }}>
                      <BlockProps block={selectedBl} onChange={nb=>updateBlock(selectedBlock,nb)}/>
                    </div>
                  </div>
                ) : (
                  <div style={{ background:'#EEF3FF', border:'1px solid #BFDBFE', borderRadius:'10px', padding:'10px 12px' }}>
                    <p style={{ margin:'0 0 8px', fontSize:'9px', fontWeight:'800', color:'#1d4ed8', textTransform:'uppercase', letterSpacing:'.07em' }}>Variabili dinamiche</p>
                    <div style={{ display:'flex', flexDirection:'column', gap:'3px' }}>
                      {VARIABILI.map(v=>(
                        <button key={v} type="button" onClick={()=>navigator.clipboard.writeText(v)} title="Clicca per copiare"
                          style={{ padding:'3px 7px', background:'#fff', border:'1px solid #BFDBFE', borderRadius:'4px', cursor:'pointer', fontSize:'10px', color:'#1d4ed8', fontFamily:'monospace', textAlign:'left' }}>
                          {v}
                        </button>
                      ))}
                    </div>
                    <p style={{ margin:'8px 0 0', fontSize:'10px', color:'#6B7280' }}>Clicca un blocco per modificarlo</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── HTML grezzo ── */}
          {viewMode === 'html' && (
            <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:'10px', padding:'14px' }}>
              <label style={{ ...lbl, marginBottom:'6px' }}>Corpo email — HTML</label>
              <textarea value={current.corpo_html||''} onChange={e=>update('corpo_html',e.target.value)}
                rows={24} style={{ ...inp, fontFamily:'monospace', fontSize:'11px', resize:'vertical', lineHeight:1.6 }}/>
            </div>
          )}

          {/* ── Anteprima ── */}
          {viewMode === 'preview' && (
            <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:'10px', padding:'14px' }}>
              <div style={{ marginBottom:'10px', padding:'8px 12px', background:'#F8F9FF', borderRadius:'7px', fontSize:'12px', fontFamily:"'Inter',sans-serif" }}>
                <strong>Da:</strong> CNA Roma &lt;marketing@cnaroma.it&gt;&nbsp;&nbsp;
                <strong>Oggetto:</strong> {replacePreview(current.oggetto||'—')}
              </div>
              <div style={{ maxWidth:previewDevice==='mobile'?'375px':'100%', margin:'0 auto', border:'1px solid #E5E7EB', borderRadius:'8px', overflow:'hidden' }}>
                <iframe srcDoc={previewHtml} style={{ width:'100%', height:'700px', border:'none', display:'block' }} title="Anteprima email" sandbox="allow-same-origin"/>
              </div>
              <p style={{ fontSize:'10px', color:'#9CA3AF', marginTop:'8px', fontFamily:"'Inter',sans-serif" }}>
                ✅ Layout identico all\u2019email reale ricevuta dall\u2019iscritto — dati di esempio
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

const inp    = { width:'100%', padding:'7px 10px', border:'1px solid #E5E7EB', borderRadius:'6px', fontSize:'12px', fontFamily:"'Inter',sans-serif", outline:'none', color:NERO, background:'#fff', boxSizing:'border-box' }
const lbl    = { display:'block', fontSize:'10px', fontWeight:'800', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:'4px' }
const btnTiny= { padding:'3px 4px', background:'#fff', border:'1px solid #E5E7EB', borderRadius:'4px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#374151' }
