/**
 * EmailPage v2 — Template email di default con sistema a blocchi
 * Stesso engine di EmailEditorPage: 10 blocchi, drag&drop, image upload, preview live
 */
import { useState, useEffect, useRef } from 'react'
import { usePageTitle } from '../../hooks/usePageTitle'
import { supabase } from '../../lib/supabase'
import RichEditor from '../../components/editor/RichEditor'
import {
  Mail, Save, CheckCircle, Code, Eye as EyeIcon, Layers,
  Image as ImageIcon, Type, AlignLeft, Square, Star, Zap, Minus,
  Columns, LayoutTemplate, ChevronUp, ChevronDown, Trash2, GripVertical, MapPin,
  AlignCenter, AlignRight, Upload, X, Loader2, Smartphone, Monitor
} from 'lucide-react'

// ─── Costanti ─────────────────────────────────────────────────────────────────

// ─── LogoPicker leggero ───────────────────────────────────────────────────────
function LogoPicker({ value, onChange }) {
  const [loghi, setLoghi] = useState([])
  const [loading, setLoading] = useState(true)
  const DEFAULT_URL = 'https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png'

  useEffect(() => {
    async function fetch_() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const jwt = session?.access_token
        if (!jwt) return
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/github-list-loghi?folder=loghi`,
          { headers: { 'Authorization': `Bearer ${jwt}` } }
        )
        if (!res.ok) return
        const data = await res.json()
        if (data.ok && Array.isArray(data.files)) {
          setLoghi([
            { name: 'CNA Roma (default)', url: DEFAULT_URL, isDefault: true },
            ...data.files.map(f => ({ name: f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '), url: f.url + '?v=' + Date.now() }))
          ])
        }
      } catch {}
      setLoading(false)
    }
    fetch_()
  }, [])

  if (loading) return <div style={{ padding:'12px', textAlign:'center', color:'#9CA3AF', fontSize:'12px' }}>Caricamento loghi…</div>

  return (
    <div style={{ padding:'10px', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(72px, 1fr))', gap:'6px' }}>
      {loghi.map((logo, i) => {
        const sel = value === logo.url || (!value && logo.isDefault)
        return (
          <button key={i} type="button" onClick={() => onChange(logo.isDefault ? '' : logo.url)}
            style={{ border:`2px solid ${sel ? BLU : '#E5E7EB'}`, borderRadius:'8px', background: sel ? '#EEF3FF' : '#fff', padding:'6px', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
            <img src={logo.url} alt={logo.name} style={{ height:'36px', width:'100%', objectFit:'contain' }}
              onError={e => e.target.style.opacity = '0.3'}/>
            <span style={{ fontSize:'9px', color: sel ? BLU : '#6B7280', textAlign:'center', lineHeight:1.2, fontWeight: sel ? '700' : '400', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'100%' }}>
              {logo.name}
            </span>
          </button>
        )
      })}
    </div>
  )
}

const BLU = '#003DA5'
const NERO = '#0A0A0A'

const TIPI = [
  { key:'conferma',       label:'Conferma Iscrizione',     icon:'✅', desc:"Inviata all'iscritto alla registrazione" },
  { key:'notifica_admin', label:'Notifica Admin',           icon:'🔔', desc:"Ad ogni nuova iscrizione" },
  { key:'reminder',       label:'Reminder Evento',          icon:'⏰', desc:"Prima dell'evento (configurabile)" },
  { key:'questionario',   label:'Questionario Post Evento', icon:'⭐', desc:"Ai presenti dopo la chiusura" },
  { key:'posto_teatro',   label:'Assegnazione Posto Teatro',icon:'🎭', desc:"Inviata con numero posto e QR code" },
]

const BLOCK_TYPES = [
  { tipo:'titolo',        label:'Titolo',              icon:<Type size={13}/>,           cat:'contenuto' },
  { tipo:'testo',         label:'Testo',               icon:<AlignLeft size={13}/>,      cat:'contenuto' },
  { tipo:'bottone',       label:'Bottone CTA',         icon:<Square size={13}/>,         cat:'contenuto' },
  { tipo:'immagine',      label:'Immagine',            icon:<ImageIcon size={13}/>,      cat:'media' },
  { tipo:'hero',          label:'Hero banner',         icon:<LayoutTemplate size={13}/>, cat:'layout' },
  { tipo:'colonne',       label:'2 colonne',           icon:<Columns size={13}/>,        cat:'layout' },
  { tipo:'info_box',      label:'Info evento',         icon:<Star size={13}/>,           cat:'evento' },
  { tipo:'qr',            label:'QR Code',             icon:<Zap size={13}/>,            cat:'evento' },
  { tipo:'posto_display', label:'Numero posto',        icon:<span style={{fontSize:'11px'}}>🎭</span>, cat:'evento' },
  { tipo:'separatore',    label:'Separatore',          icon:<Minus size={13}/>,          cat:'layout' },
  { tipo:'spazio',        label:'Spazio',              icon:<span style={{fontSize:'11px'}}>↕</span>, cat:'layout' },
  { tipo:'mappa',         label:'Mappa',               icon:<MapPin size={13}/>,         cat:'evento' },
]

const VARIABILI = [
  '{{nome}}','{{cognome}}','{{ragione_sociale}}','{{email}}',
  '{{nome_evento}}','{{data_evento}}','{{luogo_evento}}',
  '{{qr_code}}','{{link_landing}}','{{link_questionario}}','{{data_iscrizione}}',
  '{{numero_posto}}','{{link_conferma}}',
]

const PREVIEW_DATA = {
  '{{nome}}':'Mario','{{cognome}}':'Rossi','{{ragione_sociale}}':'Rossi Srl',
  '{{email}}':'mario@esempio.it','{{nome_evento}}':'Forum Artigiani Roma 2026',
  '{{data_evento}}':'Venerdì 20 giugno 2026, ore 10:00',
  '{{luogo_evento}}':'Sala Congressi CNA Roma, Via della Scrofa 22',
  '{{qr_code}}':'QR-MARIO2026','{{link_landing}}':'#','{{link_questionario}}':'#',
  '{{data_iscrizione}}':new Date().toLocaleDateString('it-IT'),
  '{{numero_posto}}':'Platea 12A','{{link_conferma}}':'#',
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
    posto_display: { testo:'Il tuo posto' },
    separatore: { colore:'#E5E7EB', spessore:1, spazio:24 },
    spazio:     { altezza:32 },
    mappa:      { indirizzo:'{{luogo_evento}}', testo:'Come raggiungerci', zoom:15, altezza:200 },
  }
  return { tipo, id:`b_${Date.now()}_${Math.random().toString(36).slice(2,7)}`, ...(map[tipo]||{}) }
}

// ─── Blocchi → HTML email (identico al sistema dell'EmailEditorPage) ──────────
function blocchiToHtml(blocchi) {
  if (!Array.isArray(blocchi)) return ''
  return blocchi.map(b => {
    if (!b || !b.tipo) return ''
    try {
      if (b.tipo === 'titolo') {
        const tag = b.livello || 'h2'
        const sz  = b.size || 24
        return `<${tag} style="font-family:Inter,Arial,sans-serif;font-weight:800;color:${b.colore||NERO};margin:0 0 12px;font-size:${sz}px;text-align:${b.align||'left'};letter-spacing:-0.02em;line-height:1.2">${b.testo||''}</${tag}>`
      }
      if (b.tipo === 'testo') return `<div style="font-family:Inter,Arial,sans-serif;font-size:${b.size||15}px;color:${b.colore||'#374151'};line-height:1.7;margin:0 0 16px">${b.html||''}</div>`
      if (b.tipo === 'bottone') return `<div style="text-align:${b.align||'center'};margin:20px 0"><a href="${b.url||'#'}" style="background:${b.colore||BLU};color:${b.testocolore||'#fff'};padding:14px 32px;border-radius:${b.radius||8}px;text-decoration:none;font-family:Inter,Arial,sans-serif;font-size:${b.size||15}px;font-weight:700;display:inline-block">${b.testo||'Clicca qui'}</a></div>`
      if (b.tipo === 'immagine') {
        if (!b.src) return ''
        return `<div style="margin:0 0 20px;text-align:${b.align||'center'}"><img src="${b.src}" alt="${b.alt||''}" style="max-width:${b.larghezza||'100%'};height:auto;border-radius:${b.radius||0}px;display:block;${b.align==='center'?'margin:0 auto':''}" /></div>`
      }
      if (b.tipo === 'hero') {
        const heroBg = b.src ? `background:linear-gradient(rgba(0,0,0,0.45),rgba(0,0,0,0.45)),url('${b.src}') center/cover` : `background:${b.bg||BLU}`
        return `<div style="${heroBg};padding:${b.padding||48}px 40px;text-align:center"><h1 style="font-family:Inter,Arial,sans-serif;color:${b.coloreTesto||'#fff'};font-size:30px;font-weight:900;margin:0 0 12px;letter-spacing:-0.03em">${b.titolo||''}</h1>${b.sottotitolo?`<p style="font-family:Inter,Arial,sans-serif;color:${b.coloreTesto||'#fff'};font-size:16px;margin:0;opacity:.9">${b.sottotitolo}</p>`:''}</div>`
      }
      if (b.tipo === 'colonne') return `<table style="width:100%;border-collapse:collapse;margin:0 0 20px"><tr><td style="width:50%;vertical-align:top;padding-right:${(b.gap||24)/2}px;font-family:Inter,Arial,sans-serif;font-size:14px;color:#374151;line-height:1.6">${b.sinistra||''}</td><td style="width:50%;vertical-align:top;padding-left:${(b.gap||24)/2}px;font-family:Inter,Arial,sans-serif;font-size:14px;color:#374151;line-height:1.6">${b.destra||''}</td></tr></table>`
      if (b.tipo === 'info_box') return `<div style="background:${b.bg||'#F0F7FF'};border:1.5px solid ${b.bordo||'#BFDBFE'};border-radius:${b.radius||10}px;padding:20px 24px;margin:0 0 20px"><table style="width:100%;border-collapse:collapse"><tr><td style="width:32px;vertical-align:top;font-size:20px;padding:6px 0">&#x1F4C5;</td><td style="padding:6px 0 6px 12px;vertical-align:top"><p style="margin:0;font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:.06em;font-family:Inter,Arial,sans-serif">Data e ora</p><p style="margin:4px 0 0;font-size:15px;font-weight:700;color:${NERO};font-family:Inter,Arial,sans-serif">{{data_evento}}</p></td></tr><tr><td style="vertical-align:top;font-size:20px;padding:6px 0">&#x1F4CD;</td><td style="padding:6px 0 0 12px;vertical-align:top"><p style="margin:0;font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:.06em;font-family:Inter,Arial,sans-serif">Luogo</p><p style="margin:4px 0 0;font-size:15px;font-weight:700;color:${NERO};font-family:Inter,Arial,sans-serif">{{luogo_evento}}</p></td></tr></table></div>`
      if (b.tipo === 'qr') return `<div style="text-align:center;padding:28px 0;margin:0 0 20px"><p style="font-size:13px;color:#6B7280;margin:0 0 16px;font-family:Inter,Arial,sans-serif">${b.testo||'Il tuo QR code di accesso'}</p>{{QR_BLOCK_${b.size||160}}}<p style="font-size:12px;color:#9CA3AF;margin:12px 0 0;font-family:monospace">{{qr_code}}</p></div>`
      if (b.tipo === 'posto_display') {
        const posto = PREVIEW_DATA['{{numero_posto}}'] || 'Platea 12A'
        const sz = posto.length > 6 ? '36px' : posto.length > 3 ? '48px' : '64px'
        return `<div style="text-align:center;background:linear-gradient(135deg,#003DA5,#1a56db);border-radius:12px;padding:28px 24px;margin-bottom:24px"><p style="margin:0 0 8px;font-size:12px;font-weight:700;color:rgba(255,255,255,0.75);text-transform:uppercase;letter-spacing:.08em;font-family:Inter,Arial,sans-serif">${b.testo||'Il tuo posto'}</p><p style="margin:0;font-size:${sz};font-weight:900;color:#ffffff;font-family:Inter,Arial,sans-serif;line-height:1;letter-spacing:-0.02em">{{numero_posto}}</p></div>`
      }
      if (b.tipo === 'separatore') return `<div style="padding:${b.spazio||24}px 0"><hr style="border:none;border-top:${b.spessore||1}px solid ${b.colore||'#E5E7EB'};margin:0"/></div>`
      if (b.tipo === 'spazio') return `<div style="height:${b.altezza||32}px"></div>`
      if (b.tipo === 'mappa') {
        const addr    = (b.indirizzo||'').replace(/\{\{luogo_evento\}\}/g, b.indirizzo||'')
        const addrEnc = encodeURIComponent(addr)
        const h       = b.altezza || 200
        const mapUrl  = `https://www.google.com/maps/search/?api=1&query=${addrEnc}`
        return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;border-radius:10px;overflow:hidden;border:1.5px solid #E5E7EB"><tr><td><a href="${mapUrl}" target="_blank" rel="noopener" style="display:block;text-decoration:none"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" valign="middle" height="${h}" style="background:#EFF6FF;padding:20px;text-align:center"><div>&#x1F5FA;&#xFE0F;</div><p style="margin:8px 0 0;font-size:14px;color:#1D4ED8;font-weight:700;font-family:Inter,Arial,sans-serif">Clicca per aprire la mappa</p></td></tr><tr><td style="padding:14px 18px;background:#ffffff;border-top:2px solid #DBEAFE"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td width="30" valign="middle" style="font-size:22px;padding-right:12px">&#x1F4CD;</td><td valign="middle"><p style="margin:0 0 2px;font-size:14px;font-weight:700;color:#0A0A0A;font-family:Inter,Arial,sans-serif">${b.testo||'Come raggiungerci'}</p><p style="margin:0;font-size:12px;color:#374151;font-family:Inter,Arial,sans-serif">${addr}</p></td><td width="100" align="right" valign="middle"><span style="font-size:11px;font-weight:700;color:#003DA5;font-family:Inter,Arial,sans-serif;border:1.5px solid #BFDBFE;padding:5px 10px;border-radius:6px;white-space:nowrap">Apri Maps &#8594;</span></td></tr></table></td></tr></table></a></td></tr></table>`
      }
      return ''
    } catch(e) { console.error('blocco error', b?.tipo, e); return '' }
  }).join('\n')
}


// ─── Wrapper HTML completo identico all'email reale ───────────────────────────
const DEFAULT_LOGO = 'https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png'

function buildFullHtml(bodyHtml, logoSrc, hColore, hTitolo, hLogoH, hTitoloSz) {
  const logo  = logoSrc || DEFAULT_LOGO
  const bg    = hColore || BLU
  const lh    = hLogoH || 48
  const ts    = hTitoloSz || 13
  const titoloHtml = hTitolo ? `<p style="margin:6px 0 0;font-size:${ts}px;font-weight:700;color:rgba(255,255,255,0.9);font-family:Inter,Arial,sans-serif;letter-spacing:0.01em">${hTitolo}</p>` : ''
  const header = `<div style="background:${bg};padding:0"><table style="width:100%;border-collapse:collapse"><tr><td style="padding:16px 32px">${logo ? `<img src="${logo}" alt="CNA Roma" style="height:${lh}px;display:block" />` : ''}${titoloHtml}</td></tr></table></div>`
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
      <div style={{ marginBottom:'8px' }}>
        <label style={lbl}>Testo</label>
        <RichEditor value={block.html||''} onChange={html=>set('html',html)} minHeight="120px"/>
      </div>
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
      <div style={{ marginBottom:'8px' }}>
        <label style={lbl}>Colonna sinistra</label>
        <RichEditor value={block.sinistra||''} onChange={v=>set('sinistra',v)} minHeight="80px"/>
      </div>
      <div style={{ marginBottom:'8px' }}>
        <label style={lbl}>Colonna destra</label>
        <RichEditor value={block.destra||''} onChange={v=>set('destra',v)} minHeight="80px"/>
      </div>
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
    case 'posto_display': return <>
      <p style={{ fontSize:'11px', color:'#6B7280', margin:'0 0 10px', fontStyle:'italic' }}>Mostra il numero/codice posto assegnato (<code>{'{{numero_posto}}'}</code>) in una card blu evidenziata.</p>
      <div style={{ marginBottom:'8px' }}><label style={lbl}>Etichetta sopra il posto</label><input value={block.testo||''} onChange={e=>set('testo',e.target.value)} style={inp} placeholder="Il tuo posto"/></div>
    </>
    case 'separatore': return <>
      {colorField('Colore linea','colore','#E5E7EB')}
      {numField('Spessore','spessore',1,'px',1,4)}
      {numField('Spazio','spazio',24,'px',0,64)}
    </>
    case 'spazio': return numField('Altezza','altezza',32,'px',8,120)
    case 'mappa': return <>
      <div style={{ marginBottom:'8px' }}>
        <label style={lbl}>Indirizzo</label>
        <input value={block.indirizzo||''} onChange={e=>set('indirizzo',e.target.value)} style={inp}
          placeholder="Via Roma 1, Roma — oppure {{luogo_evento}}"/>
        <p style={{ fontSize:'10px', color:'#9CA3AF', margin:'3px 0 0' }}>Puoi usare <code>{'{{luogo_evento}}'}</code> per usare il luogo dell'evento</p>
      </div>
      <div style={{ marginBottom:'8px' }}>
        <label style={lbl}>Testo sotto mappa</label>
        <input value={block.testo||''} onChange={e=>set('testo',e.target.value)} style={inp}
          placeholder="Come raggiungerci"/>
      </div>
      {numField('Altezza mappa','altezza',200,'px',120,400)}
      {numField('Zoom','zoom',15,'',8,18)}
      <p style={{ fontSize:'10px', color:'#9CA3AF', margin:'8px 0 0', fontStyle:'italic' }}>
        Nella mail: immagine statica cliccabile → apre Google Maps
      </p>
    </>
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
  const [headerColore,  setHeaderColore]  = useState(BLU)
  const [headerTitolo,  setHeaderTitolo]  = useState('')
  const [showLogoPicker, setShowLogoPicker] = useState(false)
  const [logoAltezza,    setLogoAltezza]   = useState(48)
  const [titoloSize,     setTitoloSize]     = useState(13)
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
      const ft = Object.values(tMap)[0]
      if (ft?.header_colore) setHeaderColore(ft.header_colore)
      if (ft?.header_titolo !== undefined) setHeaderTitolo(ft.header_titolo||'')
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
      .update({ oggetto:current.oggetto, corpo_html:bodyHtml, blocchi_json:JSON.stringify(currBlocchi), logo_url:logoUrl||null, header_colore:headerColore||null, header_titolo:headerTitolo||null, logo_altezza:logoAltezza||null, titolo_size:titoloSize||null, updated_at:new Date().toISOString() })
      .eq('tipo', selected)
    setSaving(false); setSaved(true); setTimeout(()=>setSaved(false), 2500)
  }

  let previewHtml = ''
  try { previewHtml = replacePreview(buildFullHtml(currBlocchi.length ? blocchiToHtml(currBlocchi) : (current.corpo_html||''), logoUrl, headerColore, headerTitolo, logoAltezza, titoloSize)) } catch(e) { console.error('previewHtml error', e); previewHtml = '<html><body><p style="padding:20px;color:#9CA3AF">Errore anteprima</p></body></html>' }

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
            <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:'8px', overflow:'hidden' }}>
              <div style={{ padding:'8px 12px', borderBottom:'1px solid #F3F4F6', display:'flex', alignItems:'center', gap:'8px' }}>
                <span style={{ fontSize:'10px', fontWeight:'800', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.07em' }}>Intestazione email</span>
              </div>
              <div style={{ padding:'10px 12px', display:'flex', flexDirection:'column', gap:'8px' }}>
                <div style={{ background:headerColore||BLU, borderRadius:'6px', padding:'10px 16px', display:'flex', alignItems:'center', gap:'10px' }}>
                  {logoUrl && <img src={logoUrl} style={{ height:`${logoAltezza}px`, objectFit:'contain', flexShrink:0, maxWidth:'60%' }} alt="logo"/>}
                  {headerTitolo && <span style={{ color:'rgba(255,255,255,0.9)', fontSize:`${titoloSize}px`, fontWeight:'700', fontFamily:'Inter,sans-serif' }}>{headerTitolo}</span>}
                  {!logoUrl && !headerTitolo && <span style={{ color:'rgba(255,255,255,0.4)', fontSize:'11px' }}>Anteprima header</span>}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <label style={{ ...lbl, margin:0, flexShrink:0, minWidth:'80px' }}>Logo altezza</label>
                  <input type="range" min={24} max={96} value={logoAltezza} onChange={e=>setLogoAltezza(+e.target.value)} style={{ flex:1 }}/>
                  <span style={{ fontSize:'11px', color:'#6B7280', flexShrink:0, minWidth:'30px' }}>{logoAltezza}px</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <label style={{ ...lbl, margin:0, flexShrink:0, minWidth:'80px' }}>Titolo size</label>
                  <input type="range" min={10} max={28} value={titoloSize} onChange={e=>setTitoloSize(+e.target.value)} style={{ flex:1 }}/>
                  <span style={{ fontSize:'11px', color:'#6B7280', flexShrink:0, minWidth:'30px' }}>{titoloSize}px</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <label style={{ ...lbl, margin:0, flexShrink:0 }}>Colore</label>
                  <input type="color" value={headerColore||BLU} onChange={e=>setHeaderColore(e.target.value)}
                    style={{ width:'32px', height:'26px', border:'1px solid #E5E7EB', borderRadius:'4px', cursor:'pointer', padding:'1px', flexShrink:0 }}/>
                  <input value={headerColore||BLU} onChange={e=>setHeaderColore(e.target.value)}
                    style={{ ...inp, padding:'4px 8px', fontSize:'11px', fontFamily:'monospace', flex:1 }}/>
                  <button type="button" onClick={()=>setHeaderColore(BLU)}
                    style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', fontSize:'10px', flexShrink:0 }}>reset</button>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <label style={{ ...lbl, margin:0, flexShrink:0 }}>Titolo</label>
                  <input value={headerTitolo||''} onChange={e=>setHeaderTitolo(e.target.value)}
                    style={{ ...inp, padding:'4px 8px', fontSize:'12px', flex:1 }}
                    placeholder="es. {{nome_evento}} oppure Forum CNA 2026"/>
                </div>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'6px' }}>
                    <label style={{ ...lbl, margin:0 }}>Logo</label>
                    <button type="button" onClick={()=>setShowLogoPicker(v=>!v)}
                      style={{ fontSize:'10px', padding:'2px 8px', border:'1px solid #E5E7EB', borderRadius:'4px', cursor:'pointer', background:showLogoPicker?BLU:'#fff', color:showLogoPicker?'#fff':'#374151', fontFamily:'Inter,sans-serif' }}>
                      {showLogoPicker ? '✕ chiudi' : '📂 scegli logo'}
                    </button>
                    {logoUrl && <button type="button" onClick={()=>setLogoUrl('')}
                      style={{ fontSize:'10px', padding:'2px 8px', border:'1px solid #FEE2E2', borderRadius:'4px', cursor:'pointer', background:'#FFF5F5', color:'#DC2626', fontFamily:'Inter,sans-serif' }}>
                      ✕ rimuovi
                    </button>}
                  </div>
                  {showLogoPicker && (
                    <div style={{ border:'1px solid #E5E7EB', borderRadius:'8px', overflow:'hidden', maxHeight:'260px', overflowY:'auto' }}>
                      <LogoPicker value={logoUrl} onChange={url=>{ setLogoUrl(url); setShowLogoPicker(false) }}/>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Blocchi ── */}
          {viewMode === 'blocchi' && (
            <div style={{ display:'flex', gap:'10px', alignItems:'flex-start' }}>
              {/* Canvas blocchi */}
              <div style={{ width:'240px', flexShrink:0 }}>
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
                          {b.tipo==='posto_display'&&`🎭 ${b.testo||'Il tuo posto'}`}
                          {b.tipo==='separatore'&&'— Separatore'}
                          {b.tipo==='spazio'&&`↕ ${b.altezza||32}px`}
                          {b.tipo==='mappa'&&`📍 ${b.indirizzo||'Indirizzo mappa'}`}
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
              <div style={{ flex:1, minWidth:0 }}>
                {selectedBl ? (
                  <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:'10px', overflow:'hidden' }}>
                    <div style={{ padding:'9px 12px', borderBottom:'1px solid #E5E7EB', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#F9FAFB' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                        <span style={{ color:BLU, display:'flex' }}>{BLOCK_TYPES.find(t=>t.tipo===selectedBl.tipo)?.icon}</span>
                        <span style={{ fontSize:'11px', fontWeight:'700', color:NERO }}>{BLOCK_TYPES.find(t=>t.tipo===selectedBl.tipo)?.label}</span>
                      </div>
                      <button type="button" onClick={()=>setSelectedBlock(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF' }}><X size={13}/></button>
                    </div>
                    <div style={{ padding:'12px', maxHeight:'70vh', overflowY:'auto' }}>
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
