/**
 * EmailPage v3 - Template email di default
 * Layout 3 colonne identico a EventEmailTab e EmailEditorPage
 */
import React, { useState, useEffect, useRef } from 'react'
import { usePageTitle } from '../../hooks/usePageTitle'
import { supabase } from '../../lib/supabase'
import RichEditor from '../../components/editor/RichEditor'
import HeaderEditor, { mergeHeaderConfig, buildFullEmailHtml, DEFAULT_HEADER_CONFIG } from '../../components/editor/HeaderEditor'
import {
  Mail, Save, CheckCircle, Code2, Layers, Image as ImageIcon, Type,
  AlignLeft, AlignCenter, AlignRight, Square, Star, Zap, Minus,
  Columns, LayoutTemplate, ChevronUp, ChevronDown, Trash2, GripVertical, MapPin,
  Upload, X, Loader2, Smartphone, Monitor, ChevronRight,
  PanelRightClose, PanelRightOpen,
} from 'lucide-react'

const BLU = '#003DA5'
const NERO = '#0A0A0A'

const TIPI = [
  { key:'conferma',       icon:'✅', label:'Conferma Iscrizione',     desc:"Inviata all'iscritto appena si registra" },
  { key:'notifica_admin', icon:'🔔', label:'Notifica Admin',           desc:'Inviata agli admin ad ogni nuova iscrizione' },
  { key:'reminder',       icon:'⏰', label:'Reminder Evento',          desc:"Inviata agli iscritti prima dell'evento" },
  { key:'questionario',   icon:'⭐', label:'Questionario Post Evento', desc:'Inviata ai presenti dopo la chiusura' },
  { key:'posto_teatro',   icon:'🎭', label:'Assegnazione Posto Teatro', desc:'Inviata con numero posto e QR code' },
]

const BLOCK_TYPES = [
  { tipo:'titolo',     label:'Titolo',       icon:<Type size={13}/> },
  { tipo:'testo',      label:'Testo',        icon:<AlignLeft size={13}/> },
  { tipo:'bottone',    label:'Bottone CTA',  icon:<Square size={13}/> },
  { tipo:'immagine',   label:'Immagine',     icon:<ImageIcon size={13}/> },
  { tipo:'hero',       label:'Hero banner',  icon:<LayoutTemplate size={13}/> },
  { tipo:'colonne',    label:'2 colonne',    icon:<Columns size={13}/> },
  { tipo:'info_box',   label:'Info evento',  icon:<Star size={13}/> },
  { tipo:'qr',         label:'QR Code',      icon:<Zap size={13}/> },
  { tipo:'separatore', label:'Separatore',   icon:<Minus size={13}/> },
  { tipo:'spazio',     label:'Spazio',       icon:<span style={{fontSize:'12px'}}>&#8597;</span> },
  { tipo:'mappa',      label:'Mappa',        icon:<MapPin size={13}/> },
]

const VARIABILI = [
  '{{nome}}','{{cognome}}','{{ragione_sociale}}','{{email}}',
  '{{nome_evento}}','{{data_evento}}','{{luogo_evento}}',
  '{{qr_code}}','{{link_landing}}','{{link_questionario}}',
  '{{data_iscrizione}}','{{numero_posto}}','{{link_conferma}}',
]

const PREVIEW_DATA = {
  '{{nome}}':'Marco','{{cognome}}':'Bianchi',
  '{{ragione_sociale}}':'Bianchi Srl','{{email}}':'marco@esempio.it',
  '{{nome_evento}}':'Forum CNA Roma 2026',
  '{{data_evento}}':'Venerdi 25 settembre 2026, ore 09:30',
  '{{luogo_evento}}':'Palazzo dei Congressi, Roma',
  '{{qr_code}}':'QR-MARCO2026','{{link_landing}}':'#','{{link_questionario}}':'#',
  '{{data_iscrizione}}': new Date().toLocaleDateString('it-IT'),
  '{{numero_posto}}':'Platea 14A','{{link_conferma}}':'#',
}

function replacePreview(html) {
  let h = html
  Object.entries(PREVIEW_DATA).forEach(([k,v]) => { h = h.replaceAll(k,v) })
  return h
}

function blockDefaults(tipo) {
  const map = {
    titolo:     { testo:'Titolo sezione', livello:'h2', colore:NERO, align:'left', size:26 },
    testo:      { html:'<p>Ciao <strong>{{nome}}</strong>, il tuo posto e confermato!</p>', size:15, colore:'#374151' },
    bottone:    { testo:'Scopri i dettagli', url:'{{link_landing}}', colore:BLU, testocolore:'#ffffff', align:'center', radius:8, size:15 },
    immagine:   { src:'', alt:'', larghezza:'100%', align:'center', radius:0 },
    hero:       { titolo:'{{nome_evento}}', sottotitolo:'Ti aspettiamo!', bg:BLU, coloreTesto:'#ffffff', padding:48, src:'' },
    colonne:    { sinistra:'<p>Colonna sinistra</p>', destra:'<p>Colonna destra</p>', gap:24 },
    info_box:   { bg:'#F0F7FF', bordo:'#BFDBFE', radius:10 },
    qr:         { testo:'Il tuo QR code di accesso', size:160 },
    separatore: { colore:'#E5E7EB', spessore:1, spazio:24 },
    spazio:     { altezza:32 },
    mappa:      { indirizzo:'{{luogo_evento}}', testo:'Come raggiungerci', zoom:15, altezza:200 },
  }
  return { tipo, id:`b_${Date.now()}_${Math.random().toString(36).slice(2,7)}`, ...(map[tipo]||{}) }
}

function blocchiToHtml(blocchi) {
  return blocchi.map(b => {
    try {
      if (b.tipo==='titolo') { const tag=b.livello||'h2'; return `<${tag} style="font-family:Inter,Arial,sans-serif;font-weight:800;color:${b.colore||NERO};margin:0 0 12px;font-size:${b.size||24}px;text-align:${b.align||'left'};letter-spacing:-0.02em;line-height:1.2">${b.testo||''}</${tag}>` }
      if (b.tipo==='testo') return `<div style="font-family:Inter,Arial,sans-serif;font-size:${b.size||15}px;color:${b.colore||'#374151'};line-height:1.7;margin:0 0 16px">${b.html||''}</div>`
      if (b.tipo==='bottone') return `<div style="text-align:${b.align||'center'};margin:20px 0"><a href="${b.url||'#'}" style="background:${b.colore||BLU};color:${b.testocolore||'#fff'};padding:14px 32px;border-radius:${b.radius||8}px;text-decoration:none;font-family:Inter,Arial,sans-serif;font-size:${b.size||15}px;font-weight:700;display:inline-block">${b.testo||'Clicca qui'}</a></div>`
      if (b.tipo==='immagine') { if(!b.src)return ''; return `<div style="margin:0 0 20px;text-align:${b.align||'center'}"><img src="${b.src}" alt="${b.alt||''}" style="max-width:${b.larghezza||'100%'};height:auto;border-radius:${b.radius||0}px;display:block;${b.align==='center'?'margin:0 auto':''}" /></div>` }
      if (b.tipo==='hero') { const bg=b.src?`background:linear-gradient(rgba(0,0,0,0.45),rgba(0,0,0,0.45)),url('${b.src}') center/cover`:`background:${b.bg||BLU}`; return `<div style="${bg};padding:${b.padding||48}px 40px;text-align:center"><h1 style="font-family:Inter,Arial,sans-serif;color:${b.coloreTesto||'#fff'};font-size:30px;font-weight:900;margin:0 0 12px;letter-spacing:-0.03em">${b.titolo||''}</h1>${b.sottotitolo?`<p style="font-family:Inter,Arial,sans-serif;color:${b.coloreTesto||'#fff'};font-size:16px;margin:0;opacity:.9">${b.sottotitolo}</p>`:''}</div>` }
      if (b.tipo==='colonne') return `<table style="width:100%;border-collapse:collapse;margin:0 0 20px"><tr><td style="width:50%;vertical-align:top;padding-right:${(b.gap||24)/2}px;font-family:Inter,Arial,sans-serif;font-size:14px;color:#374151;line-height:1.6">${b.sinistra||''}</td><td style="width:50%;vertical-align:top;padding-left:${(b.gap||24)/2}px;font-family:Inter,Arial,sans-serif;font-size:14px;color:#374151;line-height:1.6">${b.destra||''}</td></tr></table>`
      if (b.tipo==='info_box') return `<div style="background:${b.bg||'#F0F7FF'};border:1.5px solid ${b.bordo||'#BFDBFE'};border-radius:${b.radius||10}px;padding:20px 24px;margin:0 0 20px"><table style="width:100%;border-collapse:collapse"><tr><td style="width:32px;vertical-align:top;font-size:20px;padding:6px 0">&#x1F4C5;</td><td style="padding:6px 0 6px 12px;vertical-align:top"><p style="margin:0;font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:.06em;font-family:Inter,Arial,sans-serif">Data e ora</p><p style="margin:4px 0 0;font-size:15px;font-weight:700;color:${NERO};font-family:Inter,Arial,sans-serif">{{data_evento}}</p></td></tr><tr><td style="vertical-align:top;font-size:20px;padding:6px 0">&#x1F4CD;</td><td style="padding:6px 0 0 12px;vertical-align:top"><p style="margin:0;font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:.06em;font-family:Inter,Arial,sans-serif">Luogo</p><p style="margin:4px 0 0;font-size:15px;font-weight:700;color:${NERO};font-family:Inter,Arial,sans-serif">{{luogo_evento}}</p></td></tr></table></div>`
      if (b.tipo==='qr') return `<div style="text-align:center;padding:28px 0;margin:0 0 20px"><p style="font-size:13px;color:#6B7280;margin:0 0 16px;font-family:Inter,Arial,sans-serif">${b.testo||'Il tuo QR code di accesso'}</p>{{QR_BLOCK_${b.size||160}}}<p style="font-size:12px;color:#9CA3AF;margin:12px 0 0;font-family:monospace">{{qr_code}}</p></div>`
      if (b.tipo==='separatore') return `<div style="padding:${b.spazio||24}px 0"><hr style="border:none;border-top:${b.spessore||1}px solid ${b.colore||'#E5E7EB'};margin:0"/></div>`
      if (b.tipo==='spazio') return `<div style="height:${b.altezza||32}px"></div>`
      if (b.tipo==='mappa') { const addr=(b.indirizzo||''); const addrEnc=encodeURIComponent(addr); const h=b.altezza||200; const mapUrl=`https://www.google.com/maps/search/?api=1&query=${addrEnc}`; return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;border-radius:10px;overflow:hidden;border:1.5px solid #E5E7EB"><tr><td><a href="${mapUrl}" target="_blank" rel="noopener" style="display:block;text-decoration:none"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" valign="middle" height="${h}" style="background:#EFF6FF;padding:20px;text-align:center"><p style="margin:8px 0 0;font-size:14px;color:#1D4ED8;font-weight:700;font-family:Inter,Arial,sans-serif">Clicca per aprire la mappa</p></td></tr><tr><td style="padding:14px 18px;background:#ffffff;border-top:2px solid #DBEAFE"><p style="margin:0 0 2px;font-size:14px;font-weight:700;color:#0A0A0A;font-family:Inter,Arial,sans-serif">${b.testo||'Come raggiungerci'}</p><p style="margin:0;font-size:12px;color:#374151;font-family:Inter,Arial,sans-serif">${addr}</p></td></tr></table></a></td></tr></table>` }
      return ''
    } catch(e) { return '' }
  }).join('\n')
}

function legacyToHeaderConfig(tpl) {
  if (tpl?.header_config && Object.keys(tpl.header_config).length > 0) return tpl.header_config
  return { logo_url:tpl?.logo_url||'', logo_altezza:tpl?.logo_altezza||48, titolo:tpl?.header_titolo||'', titolo_size:tpl?.titolo_size||13, sfondo:tpl?.header_colore||BLU }
}

async function uploadImage(file) {
  const ext = file.name.split('.').pop()
  const path = `email/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('images').upload(path, file, { upsert:true })
  if (error) throw error
  const { data } = supabase.storage.from('images').getPublicUrl(path)
  return data.publicUrl
}

function ImageDropZone({ value, onChange, label='Immagine' }) {
  const [drag, setDrag] = useState(false)
  const [uploading, setUploading] = useState(false)
  const ref = useRef()
  async function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return
    setUploading(true)
    try { onChange(await uploadImage(file)) } catch(e) { alert('Errore: '+e.message) }
    setUploading(false)
  }
  return (
    <div>
      <label style={lbl}>{label}</label>
      {value ? (
        <div style={{ position:'relative', borderRadius:'7px', overflow:'hidden', border:'1px solid #E5E7EB', marginBottom:'5px' }}>
          <img src={value} style={{ width:'100%', maxHeight:'90px', objectFit:'cover', display:'block' }}/>
          <button onClick={()=>onChange('')} style={{ position:'absolute', top:'5px', right:'5px', background:'rgba(0,0,0,0.6)', border:'none', borderRadius:'50%', width:'20px', height:'20px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}><X size={10}/></button>
        </div>
      ) : (
        <div onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)}
          onDrop={e=>{e.preventDefault();setDrag(false);handleFile(e.dataTransfer.files[0])}}
          onClick={()=>ref.current?.click()}
          style={{ border:`2px dashed ${drag?BLU:'#D1D5DB'}`, borderRadius:'7px', padding:'12px', textAlign:'center', cursor:'pointer', background:drag?'#EEF3FF':'#FAFAFA', marginBottom:'5px' }}>
          <input ref={ref} type="file" accept="image/*" style={{ display:'none' }} onChange={e=>handleFile(e.target.files[0])}/>
          {uploading ? <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:'5px',fontSize:'11px',color:'#6B7280' }}><Loader2 size={13} style={{animation:'spin 1s linear infinite'}}/>Caricamento...</div>
            : <><Upload size={14} style={{color:'#9CA3AF',marginBottom:'3px'}}/><p style={{margin:0,fontSize:'11px',color:'#6B7280'}}>Trascina o clicca</p></>}
        </div>
      )}
      <input value={value||''} onChange={e=>onChange(e.target.value)} placeholder="...oppure incolla URL" style={{...inp,fontSize:'11px',padding:'4px 8px'}}/>
    </div>
  )
}

function BlockProps({ block, onChange }) {
  const set = (k,v) => onChange({...block,[k]:v})
  const colorField = (label,key,def='#000000') => (
    <div style={{marginBottom:'8px'}}>
      <label style={lbl}>{label}</label>
      <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
        <input type="color" value={block[key]||def} onChange={e=>set(key,e.target.value)} style={{width:'30px',height:'24px',border:'1px solid #E5E7EB',borderRadius:'4px',cursor:'pointer',padding:'1px',flexShrink:0}}/>
        <input value={block[key]||def} onChange={e=>set(key,e.target.value)} style={{...inp,padding:'4px 7px',fontSize:'11px',fontFamily:'monospace',flex:1}}/>
      </div>
    </div>
  )
  const numField = (label,key,def=0,unit='px',min=0,max=200) => (
    <div style={{marginBottom:'8px'}}>
      <label style={lbl}>{label}</label>
      <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
        <input type="range" min={min} max={max} value={block[key]??def} onChange={e=>set(key,parseInt(e.target.value))} style={{flex:1,accentColor:BLU}}/>
        <span style={{fontSize:'11px',color:'#374151',minWidth:'34px',textAlign:'right'}}>{block[key]??def}{unit}</span>
      </div>
    </div>
  )
  const alignField = (key='align') => (
    <div style={{marginBottom:'8px'}}>
      <label style={lbl}>Allineamento</label>
      <div style={{display:'flex',gap:'3px'}}>
        {[['left',<AlignLeft size={12}/>],['center',<AlignCenter size={12}/>],['right',<AlignRight size={12}/>]].map(([v,ic])=>(
          <button key={v} onClick={()=>set(key,v)} style={{flex:1,padding:'5px',border:`1px solid ${block[key]===v?BLU:'#E5E7EB'}`,borderRadius:'5px',cursor:'pointer',background:block[key]===v?'#EEF3FF':'#fff',color:block[key]===v?BLU:'#9CA3AF',display:'flex',alignItems:'center',justifyContent:'center'}}>{ic}</button>
        ))}
      </div>
    </div>
  )
  switch(block.tipo) {
    case 'titolo': return <>
      <div style={{marginBottom:'8px'}}><label style={lbl}>Testo</label><input value={block.testo||''} onChange={e=>set('testo',e.target.value)} style={inp}/></div>
      <div style={{marginBottom:'8px'}}><label style={lbl}>Livello</label><select value={block.livello||'h2'} onChange={e=>set('livello',e.target.value)} style={inp}><option value="h1">H1</option><option value="h2">H2</option><option value="h3">H3</option></select></div>
      {numField('Dimensione','size',24,'px',12,60)}{colorField('Colore','colore',NERO)}{alignField()}
    </>
    case 'testo': return <>
      <div style={{marginBottom:'8px'}}><label style={lbl}>Testo</label><RichEditor value={block.html||''} onChange={html=>set('html',html)} minHeight="120px"/></div>
      {numField('Dimensione','size',15,'px',11,22)}{colorField('Colore','colore','#374151')}
    </>
    case 'bottone': return <>
      <div style={{marginBottom:'8px'}}><label style={lbl}>Testo</label><input value={block.testo||''} onChange={e=>set('testo',e.target.value)} style={inp}/></div>
      <div style={{marginBottom:'8px'}}><label style={lbl}>URL</label><input value={block.url||''} onChange={e=>set('url',e.target.value)} style={inp}/></div>
      {colorField('Colore sfondo','colore',BLU)}{colorField('Colore testo','testocolore','#ffffff')}{numField('Radius','radius',8,'px',0,40)}{alignField()}
    </>
    case 'immagine': return <>
      <ImageDropZone value={block.src} onChange={v=>set('src',v)}/>
      <div style={{marginBottom:'8px',marginTop:'6px'}}><label style={lbl}>Alt text</label><input value={block.alt||''} onChange={e=>set('alt',e.target.value)} style={inp}/></div>
      <div style={{marginBottom:'8px'}}>
        <label style={lbl}>Larghezza</label>
        <div style={{display:'flex',flexWrap:'wrap',gap:'4px'}}>
          {['100%','75%','50%','200px','300px'].map(w=><button key={w} onClick={()=>set('larghezza',w)} style={{padding:'3px 7px',border:`1px solid ${block.larghezza===w?BLU:'#E5E7EB'}`,borderRadius:'4px',cursor:'pointer',fontSize:'10px',background:block.larghezza===w?BLU:'#fff',color:block.larghezza===w?'#fff':'#374151',fontFamily:'monospace'}}>{w}</button>)}
        </div>
      </div>
      {numField('Radius','radius',0,'px',0,24)}{alignField()}
    </>
    case 'hero': return <>
      <div style={{marginBottom:'8px'}}><label style={lbl}>Titolo</label><input value={block.titolo||''} onChange={e=>set('titolo',e.target.value)} style={inp}/></div>
      <div style={{marginBottom:'8px'}}><label style={lbl}>Sottotitolo</label><input value={block.sottotitolo||''} onChange={e=>set('sottotitolo',e.target.value)} style={inp}/></div>
      <ImageDropZone value={block.src} onChange={v=>set('src',v)} label="Sfondo (opz.)"/>
      <div style={{marginTop:'8px'}}>{colorField('Sfondo','bg',BLU)}{colorField('Testo','coloreTesto','#ffffff')}{numField('Padding','padding',48,'px',16,96)}</div>
    </>
    case 'colonne': return <>
      <div style={{marginBottom:'8px'}}><label style={lbl}>Sinistra</label><RichEditor value={block.sinistra||''} onChange={v=>set('sinistra',v)} minHeight="80px"/></div>
      <div style={{marginBottom:'8px'}}><label style={lbl}>Destra</label><RichEditor value={block.destra||''} onChange={v=>set('destra',v)} minHeight="80px"/></div>
      {numField('Gap','gap',24,'px',0,48)}
    </>
    case 'info_box': return <>{colorField('Sfondo','bg','#F0F7FF')}{colorField('Bordo','bordo','#BFDBFE')}{numField('Radius','radius',10,'px',0,24)}</>
    case 'qr': return <>
      <div style={{marginBottom:'8px'}}><label style={lbl}>Testo sopra</label><input value={block.testo||''} onChange={e=>set('testo',e.target.value)} style={inp}/></div>
      {numField('Dimensione','size',160,'px',80,240)}
    </>
    case 'separatore': return <>{colorField('Colore','colore','#E5E7EB')}{numField('Spessore','spessore',1,'px',1,4)}{numField('Spazio','spazio',24,'px',0,64)}</>
    case 'spazio': return numField('Altezza','altezza',32,'px',8,120)
    case 'mappa': return <>
      <div style={{marginBottom:'8px'}}><label style={lbl}>Indirizzo</label><input value={block.indirizzo||''} onChange={e=>set('indirizzo',e.target.value)} style={inp} placeholder="Via Roma 1 o {{luogo_evento}}"/></div>
      <div style={{marginBottom:'8px'}}><label style={lbl}>Testo</label><input value={block.testo||''} onChange={e=>set('testo',e.target.value)} style={inp}/></div>
      {numField('Altezza','altezza',200,'px',120,400)}
    </>
    default: return null
  }
}

export default function EmailPage() {
  usePageTitle('Template Email')
  const [selected,        setSelected]        = useState('conferma')
  const [templates,       setTemplates]       = useState({})
  const [blocchi,         setBlocchi]         = useState({})
  const [headerConfig,    setHeaderConfig]    = useState({...DEFAULT_HEADER_CONFIG})
  const [viewMode,        setViewMode]        = useState('blocchi')
  const [loading,         setLoading]         = useState(true)
  const [saving,          setSaving]          = useState(false)
  const [saved,           setSaved]           = useState(false)
  const [selectedBlock,   setSelectedBlock]   = useState(null)
  const [showVars,        setShowVars]        = useState(false)
  const [previewDevice,   setPreviewDevice]   = useState('desktop')
  const [previewCollapsed,setPreviewCollapsed]= useState(false)
  const [colWidths,       setColWidths]       = useState({ left: 280, right: 480 })
  const resizingRef = useRef(null)
  const dragIdx = useRef(null)
  const dragOverIdx = useRef(null)

  function startResize(col, e) {
    e.preventDefault()
    const startX = e.clientX
    const startW = col === 'left' ? colWidths.left : colWidths.right
    const onMove = (ev) => {
      const dx = ev.clientX - startX
      setColWidths(prev => col === 'left'
        ? { ...prev, left: Math.max(200, Math.min(480, startW + dx)) }
        : { ...prev, right: Math.max(300, Math.min(700, startW - dx)) })
    }
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  useEffect(() => { loadTemplates() }, [])

  async function loadTemplates() {
    const { data } = await supabase.from('email_templates_default').select('*')
    if (data) {
      const tMap = {}, bMap = {}
      data.forEach(t => {
        tMap[t.tipo] = t
        try {
          const parsed = JSON.parse(t.blocchi_json||'[]')
          if (Array.isArray(parsed) && parsed.length) bMap[t.tipo] = parsed
        } catch {}
      })
      setTemplates(tMap)
      setBlocchi(bMap)
      const first = Object.values(tMap)[0]
      if (first) setHeaderConfig(mergeHeaderConfig(legacyToHeaderConfig(first)))
    }
    setLoading(false)
  }

  useEffect(() => { setSelectedBlock(null) }, [selected])

  const current = templates[selected] || { oggetto:'', corpo_html:'' }
  const currBlocchi = blocchi[selected] || []

  function update(field, value) {
    setTemplates(prev => ({ ...prev, [selected]:{ ...prev[selected], [field]:value } }))
  }
  function updateBlocchi(nb) { setBlocchi(prev => ({ ...prev, [selected]:nb })) }

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
      onDrop: e => {
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
    const hc = mergeHeaderConfig(headerConfig)
    await supabase.from('email_templates_default')
      .update({
        oggetto: current.oggetto, corpo_html: bodyHtml,
        blocchi_json: JSON.stringify(currBlocchi),
        header_config: hc,
        logo_url: hc.logo_url||null, header_colore: hc.sfondo||null,
        header_titolo: hc.titolo||null, logo_altezza: hc.logo_altezza||null,
        titolo_size: hc.titolo_size||null,
        updated_at: new Date().toISOString(),
      })
      .eq('tipo', selected)
    setSaving(false); setSaved(true); setTimeout(()=>setSaved(false), 2500)
  }

  function getPreviewHtml() {
    const bodyHtml = currBlocchi.length ? blocchiToHtml(currBlocchi) : (current.corpo_html||'')
    return replacePreview(buildFullEmailHtml(bodyHtml, headerConfig))
  }

  const selectedBl = selectedBlock !== null ? currBlocchi[selectedBlock] : null
  const tipoInfo = TIPI.find(t=>t.key===selected)

  if (loading) return <div style={{padding:'80px',textAlign:'center',color:'#9CA3AF',fontSize:'14px',fontFamily:'Inter,sans-serif'}}>Caricamento...</div>

  return (
    <div style={{ fontFamily:"'Inter',sans-serif", display:'flex', flexDirection:'column', height:'calc(100vh - 60px)', overflow:'hidden' }}>

      {/* Titolo pagina */}
      <div style={{ padding:'16px 0 12px', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'3px' }}>
          <Mail size={20} color={BLU}/>
          <h1 style={{ fontSize:'24px', fontWeight:'900', color:NERO, letterSpacing:'-0.03em', margin:0 }}>Template Email</h1>
        </div>
        <p style={{ fontSize:'12px', color:'#6B7280', margin:0 }}>
          Template di default copiati automaticamente ad ogni nuovo evento. Personalizzali per ogni evento dalla scheda <strong>Email</strong> nell'editor evento.
        </p>
      </div>

      {/* Barra superiore: tipo email + Salva */}
      <div style={{ display:'flex', alignItems:'center', gap:'6px', paddingBottom:'10px', borderBottom:'1px solid #E5E7EB', flexShrink:0 }}>
        <div style={{ display:'flex', gap:'3px', flex:1, flexWrap:'wrap' }}>
          {TIPI.map(t => {
            const isSel = selected===t.key
            return (
              <button key={t.key} type="button" onClick={()=>{ setSelected(t.key); setViewMode('blocchi') }}
                style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 12px', borderRadius:'7px', border:'none', cursor:'pointer', background:isSel?BLU:'#F3F4F6', color:isSel?'#fff':'#6B7280', fontFamily:"'Inter',sans-serif", fontSize:'12px', fontWeight:isSel?'700':'500', transition:'all .12s' }}>
                <span style={{fontSize:'13px'}}>{t.icon}</span> {t.label}
              </button>
            )
          })}
        </div>
        <button type="button" onClick={save} disabled={saving}
          style={{ display:'flex', alignItems:'center', gap:'4px', padding:'7px 18px', borderRadius:'7px', border:'none', cursor:'pointer', fontFamily:"'Inter',sans-serif", background:saved?'#16A34A':BLU, color:'#fff', fontWeight:'700', fontSize:'12px', transition:'background .2s', flexShrink:0 }}>
          {saved ? <><CheckCircle size={13}/>Salvato</> : saving ? <><Loader2 size={13} style={{animation:'spin 1s linear infinite'}}/>Salvo...</> : <><Save size={13}/>Salva template</>}
        </button>
      </div>

      {/* 3 colonne */}
      <div style={{ display:'flex', flex:1, overflow:'hidden', marginTop:'10px' }}>

        {/* COL 1: Config */}
        <div style={{ width:colWidths.left+'px', flexShrink:0, overflowY:'auto', paddingRight:'14px', display:'flex', flexDirection:'column', gap:'8px' }}>
          <div>
            <label style={lbl}>Oggetto email</label>
            <input value={current.oggetto||''} onChange={e=>update('oggetto',e.target.value)}
              style={{...inp, fontSize:'13px', fontWeight:'600'}} placeholder="Oggetto dell'email..."/>
          </div>
          <HeaderEditor config={headerConfig} onChange={setHeaderConfig}/>
          <div style={{ background:'#F9FAFB', borderRadius:'8px', border:'1px solid #E5E7EB', overflow:'hidden' }}>
            <button type="button" onClick={()=>setShowVars(!showVars)}
              style={{ width:'100%', padding:'8px 10px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'none', border:'none', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>
              <span style={{ fontSize:'10px', fontWeight:'800', color:'#6B7280', textTransform:'uppercase', letterSpacing:'.07em' }}>{'{ } Variabili'}</span>
              <ChevronRight size={12} style={{ color:'#9CA3AF', transform:showVars?'rotate(90deg)':'none', transition:'transform .15s' }}/>
            </button>
            {showVars && (
              <div style={{ padding:'6px 10px 10px', display:'flex', flexWrap:'wrap', gap:'4px', borderTop:'1px solid #E5E7EB' }}>
                {VARIABILI.map(v=>(
                  <button key={v} type="button" onClick={()=>navigator.clipboard.writeText(v)}
                    style={{ padding:'3px 7px', background:'#fff', border:'1px solid #BFDBFE', borderRadius:'4px', cursor:'pointer', fontSize:'10px', color:'#1d4ed8', fontFamily:'monospace' }}>
                    {v}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Info */}
          <div style={{ padding:'10px 12px', background:'#EFF6FF', borderRadius:'8px', fontSize:'11px', color:'#1D4ED8', lineHeight:1.5 }}>
            <strong>Come funziona</strong><br/>
            Ogni nuovo evento copia questi template. Puoi personalizzarli evento per evento dalla scheda Email.
          </div>
        </div>

        {/* Resizer 1 */}
        <div onMouseDown={e=>startResize('left',e)}
          style={{ width:'5px', flexShrink:0, cursor:'ew-resize', background:'transparent', position:'relative', zIndex:10, borderLeft:'1px solid #E5E7EB', borderRight:'1px solid #E5E7EB' }}
          onMouseEnter={e=>{e.currentTarget.style.background='#EEF3FF'}} onMouseLeave={e=>{e.currentTarget.style.background='transparent'}}>
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'3px', height:'24px', borderRadius:'2px', background:'#D1D5DB' }}/>
        </div>

        {/* COL 2: Editor blocchi */}
        <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {/* Toolbar */}
          <div style={{ display:'flex', gap:'4px', alignItems:'center', marginBottom:'8px', flexShrink:0 }}>
            {[['blocchi',<Layers size={11}/>,'Blocchi'],['html',<Code2 size={11}/>,'HTML']].map(([m,ic,lb])=>(
              <button key={m} type="button" onClick={()=>setViewMode(m)}
                style={{ display:'flex', alignItems:'center', gap:'4px', padding:'5px 12px', borderRadius:'6px', border:'none', cursor:'pointer', background:viewMode===m?BLU:'#F3F4F6', color:viewMode===m?'#fff':'#555', fontSize:'11px', fontWeight:'600', fontFamily:"'Inter',sans-serif" }}>
                {ic}{lb}
              </button>
            ))}
          </div>

          <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:'4px' }}>
            {viewMode==='blocchi' && <>
              {currBlocchi.length===0 && (
                <div style={{ textAlign:'center', padding:'40px 16px', color:'#9CA3AF', background:'#fff', border:'1px dashed #E5E7EB', borderRadius:'10px' }}>
                  <LayoutTemplate size={24} style={{ marginBottom:'8px', opacity:.3 }}/>
                  <p style={{ margin:0, fontSize:'13px', fontWeight:'600' }}>Canvas vuoto</p>
                  <p style={{ margin:'3px 0 0', fontSize:'11px' }}>Aggiungi un blocco</p>
                </div>
              )}
              {currBlocchi.map((b,i) => {
                const info = BLOCK_TYPES.find(t=>t.tipo===b.tipo)||{}
                const isSel = selectedBlock===i
                return (
                  <div key={b.id||i} {...dragHandlers(i)}
                    style={{ border:`2px solid ${isSel?BLU:'#E5E7EB'}`, borderRadius:'8px', background:'#fff', boxShadow:isSel?'0 0 0 3px rgba(0,61,165,0.07)':'none', transition:'border-color .1s', overflow:'hidden' }}>
                    <div onClick={()=>setSelectedBlock(isSel?null:i)}
                      style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 10px', cursor:'pointer' }}>
                      <GripVertical size={12} style={{ color:'#D1D5DB', cursor:'grab', flexShrink:0 }}/>
                      <span style={{ color:BLU, display:'flex', flexShrink:0 }}>{info.icon}</span>
                      <span style={{ fontSize:'12px', fontWeight:'600', color:'#374151', flex:1 }}>{info.label}</span>
                      <div style={{ display:'flex', gap:'2px' }} onClick={e=>e.stopPropagation()}>
                        {i>0 && <button onClick={()=>moveBlock(i,-1)} style={btnTiny}><ChevronUp size={10}/></button>}
                        {i<currBlocchi.length-1 && <button onClick={()=>moveBlock(i,1)} style={btnTiny}><ChevronDown size={10}/></button>}
                        <button onClick={()=>deleteBlock(i)} style={{...btnTiny,color:'#EF4444'}}><Trash2 size={10}/></button>
                      </div>
                    </div>
                    {isSel && selectedBl && (
                      <div onClick={e=>e.stopPropagation()} onMouseDown={e=>e.stopPropagation()}
                        style={{ padding:'0 10px 10px', borderTop:'1px solid #EEF3FF' }}>
                        <BlockProps block={selectedBl} onChange={nb=>updateBlock(i,nb)}/>
                      </div>
                    )}
                    {!isSel && (
                      <div onClick={()=>setSelectedBlock(i)}
                        style={{ padding:'0 10px 7px 34px', fontSize:'10px', color:'#9CA3AF', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis', cursor:'pointer' }}>
                        {b.tipo==='titolo'&&(b.testo||'(vuoto)')}
                        {b.tipo==='testo'&&((b.html||'').replace(/<[^>]+>/g,'').slice(0,60)||'(vuoto)')}
                        {b.tipo==='bottone'&&(b.testo||'Bottone')}
                        {b.tipo==='immagine'&&(b.src?b.src.split('/').pop():'Nessuna immagine')}
                        {b.tipo==='hero'&&(b.titolo||'Hero banner')}
                        {b.tipo==='colonne'&&'Layout 2 colonne'}
                        {b.tipo==='info_box'&&'Data e luogo evento'}
                        {b.tipo==='qr'&&'QR Code accesso'}
                        {b.tipo==='separatore'&&'Separatore'}
                        {b.tipo==='spazio'&&(b.altezza||32)+'px'}
                        {b.tipo==='mappa'&&(b.indirizzo||'Mappa')}
                      </div>
                    )}
                  </div>
                )
              })}
              <div style={{ background:'#F9FAFB', border:'1.5px dashed #E5E7EB', borderRadius:'8px', padding:'10px 12px', marginTop:'2px', flexShrink:0 }}>
                <p style={{ margin:'0 0 6px', fontSize:'9px', fontWeight:'800', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.08em' }}>+ Aggiungi blocco</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
                  {BLOCK_TYPES.map(bt=>(
                    <button key={bt.tipo} type="button" onClick={()=>addBlock(bt.tipo)}
                      style={{ display:'flex', alignItems:'center', gap:'4px', padding:'4px 8px', background:'#fff', border:'1px solid #E5E7EB', borderRadius:'5px', cursor:'pointer', fontSize:'10px', color:'#374151', fontFamily:"'Inter',sans-serif", fontWeight:'500' }}>
                      <span style={{color:BLU}}>{bt.icon}</span>{bt.label}
                    </button>
                  ))}
                </div>
              </div>
            </>}
            {viewMode==='html' && (
              <textarea value={current.corpo_html||''} onChange={e=>update('corpo_html',e.target.value)}
                style={{...inp, flex:1, fontFamily:'monospace', fontSize:'11px', resize:'none', lineHeight:1.6, minHeight:'400px'}}/>
            )}
          </div>
        </div>

        {/* Resizer 2 */}
        {!previewCollapsed && (
          <div onMouseDown={e=>startResize('right',e)}
            style={{ width:'5px', flexShrink:0, cursor:'ew-resize', background:'transparent', position:'relative', zIndex:10, borderLeft:'1px solid #E5E7EB', borderRight:'1px solid #E5E7EB' }}
            onMouseEnter={e=>{e.currentTarget.style.background='#EEF3FF'}} onMouseLeave={e=>{e.currentTarget.style.background='transparent'}}>
            <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'3px', height:'24px', borderRadius:'2px', background:'#D1D5DB' }}/>
          </div>
        )}

        {/* COL 3: Anteprima */}
        <div style={{ width:previewCollapsed?'40px':colWidths.right+'px', flexShrink:0, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {previewCollapsed ? (
            <button type="button" onClick={()=>setPreviewCollapsed(false)}
              style={{ flex:1, background:'none', border:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'8px', color:BLU }}>
              <PanelRightOpen size={16}/>
              <span style={{ fontSize:'9px', fontWeight:'700', writingMode:'vertical-rl', letterSpacing:'.06em', color:'#9CA3AF' }}>ANTEPRIMA</span>
            </button>
          ) : <>
            <div style={{ padding:'8px 12px', borderBottom:'1px solid #E5E7EB', display:'flex', alignItems:'center', gap:'8px', background:'#FAFBFC', flexShrink:0 }}>
              <span style={{ fontSize:'12px', fontWeight:'700', color:NERO, flex:1 }}>Anteprima</span>
              <span style={{ fontSize:'9px', color:'#9CA3AF', background:'#F3F4F6', padding:'2px 6px', borderRadius:'4px' }}>dati di esempio</span>
              <div style={{ display:'flex', border:'1px solid #E5E7EB', borderRadius:'5px', overflow:'hidden' }}>
                {[['desktop',<Monitor size={11}/>],['mobile',<Smartphone size={11}/>]].map(([d,ic])=>(
                  <button key={d} type="button" onClick={()=>setPreviewDevice(d)}
                    style={{ padding:'4px 8px', border:'none', cursor:'pointer', background:previewDevice===d?'#E5E7EB':'#fff', color:previewDevice===d?NERO:'#9CA3AF', display:'flex', alignItems:'center' }}>{ic}</button>
                ))}
              </div>
              <button type="button" onClick={()=>setPreviewCollapsed(true)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', display:'flex' }}>
                <PanelRightClose size={14}/>
              </button>
            </div>
            <div style={{ padding:'7px 14px', background:'#FAFBFC', borderBottom:'1px solid #F3F4F6', flexShrink:0, fontSize:'11px' }}>
              <div style={{ color:'#374151', fontWeight:'500', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                <span style={{ fontWeight:'700' }}>Oggetto:</span> {replacePreview(current.oggetto||'(nessun oggetto)')}
              </div>
            </div>
            <div style={{ flex:1, overflow:'hidden', background:'#F0F2F5', padding:'12px' }}>
              <div style={{ maxWidth:previewDevice==='mobile'?'375px':'100%', margin:'0 auto', height:'100%', background:'#fff', borderRadius:'8px', overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.08)' }}>
                <iframe srcDoc={getPreviewHtml()} style={{ width:'100%', height:'100%', border:'none', display:'block' }} title="Anteprima" sandbox="allow-same-origin"/>
              </div>
            </div>
          </>}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html:'@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}'}}/>
    </div>
  )
}

const inp = { width:'100%', padding:'7px 10px', border:'1px solid #E5E7EB', borderRadius:'6px', fontSize:'12px', fontFamily:"'Inter',sans-serif", outline:'none', color:'#0A0A0A', background:'#fff', boxSizing:'border-box' }
const lbl = { display:'block', fontSize:'10px', fontWeight:'800', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:'4px' }
const btnTiny = { padding:'3px 4px', background:'#fff', border:'1px solid #E5E7EB', borderRadius:'4px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#374151' }
