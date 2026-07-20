/**
 * EventEmailTab v3 — Split-pane layout: editor + anteprima sempre visibile
 */
import { useState, useEffect, useRef } from 'react'
import { supabase, getFreshJwt } from '../../lib/supabase'
import RichEditor from './RichEditor'
import {
  Save, RotateCcw, CheckCircle, Code, Eye as EyeIcon, AlertTriangle,
  Layers, Image as ImageIcon, Type, AlignLeft, Square, Star, Zap, Minus,
  Columns, LayoutTemplate, ChevronUp, ChevronDown, Trash2, GripVertical, MapPin,
  AlignCenter, AlignRight, Upload, X, Loader2, Smartphone, Monitor, Plus,
  Settings2, ChevronRight, PanelRightClose, PanelRightOpen, Send
} from 'lucide-react'

// ─── Costanti ─────────────────────────────────────────────────────────────────
const BLU = '#003DA5'
const NERO = '#0A0A0A'

const TIPI = [
  { key:'conferma',       label:'Conferma Iscrizione',     icon:'✅', desc:"Inviata all'iscritto appena si registra" },
  { key:'notifica_admin', label:'Notifica Admin',           icon:'🔔', desc:"Inviata agli admin ad ogni nuova iscrizione" },
  { key:'reminder',       label:'Reminder Evento',          icon:'⏰', desc:"Inviata agli iscritti prima dell'evento" },
  { key:'questionario',   label:'Questionario Post Evento', icon:'⭐', desc:"Inviata ai presenti dopo la chiusura" },
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
  { tipo:'spazio',    label:'Spazio',      icon:<span style={{fontSize:'12px'}}>↕</span>, cat:'layout' },
  { tipo:'mappa',     label:'Mappa',       icon:<MapPin size={13}/>,         cat:'evento' },
]

const VARIABILI = [
  '{{nome}}','{{cognome}}','{{ragione_sociale}}','{{email}}',
  '{{nome_evento}}','{{data_evento}}','{{luogo_evento}}',
  '{{qr_code}}','{{link_landing}}','{{link_questionario}}','{{data_iscrizione}}'
]

const PREVIEW_DATA_BASE = {
  '{{nome}}':'Marco','{{cognome}}':'Bianchi','{{ragione_sociale}}':'Bianchi Srl',
  '{{email}}':'marco@esempio.it',
  '{{data_evento}}':'Venerdì 25 settembre 2026, ore 09:30',
  '{{luogo_evento}}':'Palazzo dei Congressi, Roma',
  '{{qr_code}}':'QR-MARCO2026','{{link_landing}}':'#','{{link_questionario}}':'#',
  '{{data_iscrizione}}': new Date().toLocaleDateString('it-IT'),
}

// ─── Block defaults ───────────────────────────────────────────────────────────
function blockDefaults(tipo) {
  const map = {
    titolo:     { testo:'Titolo sezione', livello:'h2', colore:NERO, align:'left', size:26 },
    testo:      { html:'<p>Ciao <strong>{{nome}}</strong>, il tuo posto è confermato!</p>', size:15, colore:'#374151' },
    bottone:    { testo:'Scopri i dettagli →', url:'{{link_landing}}', colore:BLU, testocolore:'#ffffff', align:'center', radius:8, size:15 },
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

// ─── Blocchi → HTML ───────────────────────────────────────────────────────────
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

// ─── LogoPicker ────────────────────────────────────────────────────────────────
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

const DEFAULT_LOGO = 'https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png'

function buildFullHtml(mostraHeader, mostraFooter, bodyHtml, logoSrc, hColore, hTitolo, hLogoH, hTitoloSz) {
  const logo = logoSrc || DEFAULT_LOGO
  const bg = hColore || BLU
  const lh = hLogoH || 48
  const ts = hTitoloSz || 13
  const titoloHtml = hTitolo ? `<p style="margin:6px 0 0;font-size:${ts}px;font-weight:700;color:rgba(255,255,255,0.9);font-family:Inter,Arial,sans-serif;letter-spacing:0.01em">${hTitolo}</p>` : ''
  const header = mostraHeader !== false
    ? `<div style="background:${bg};padding:0"><table style="width:100%;border-collapse:collapse"><tr><td style="padding:16px 32px">${logo ? `<img src="${logo}" alt="CNA Roma" style="height:${lh}px;display:block" />` : ''}${titoloHtml}</td></tr></table></div>` : ''
  const footer = mostraFooter !== false
    ? `<div style="background:#F9FAFB;border-top:1px solid #E5E7EB;padding:20px 32px"><p style="margin:0;font-size:11px;color:#9CA3AF;font-family:Inter,Arial,sans-serif">CNA di Roma — Confederazione Nazionale dell\u2019Artigianato · <a href="mailto:marketing@cnaroma.it" style="color:${BLU}">marketing@cnaroma.it</a></p></div>` : ''
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#F0F2F5;font-family:Inter,Arial,sans-serif"><table style="width:100%;border-collapse:collapse"><tr><td style="padding:24px 16px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.1)">${header}<div style="padding:32px">${bodyHtml}</div>${footer}</div></td></tr></table></body></html>`
}

function replacePreview(html, nomeEvento) {
  let h = html
  const data = { ...PREVIEW_DATA_BASE, '{{nome_evento}}': nomeEvento || 'Nome Evento' }
  Object.entries(data).forEach(([k,v]) => { h = h.replaceAll(k,v) })
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
          <img src={value} style={{ width:'100%', maxHeight:'100px', objectFit:'cover', display:'block' }}/>
          <button onClick={()=>onChange('')} style={{ position:'absolute', top:'5px', right:'5px', background:'rgba(0,0,0,0.6)', border:'none', borderRadius:'50%', width:'22px', height:'22px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}>
            <X size={11}/>
          </button>
        </div>
      ) : (
        <div onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)}
          onDrop={e=>{e.preventDefault();setDrag(false);handleFile(e.dataTransfer.files[0])}}
          onClick={()=>ref.current?.click()}
          style={{ border:`2px dashed ${drag?BLU:'#D1D5DB'}`, borderRadius:'7px', padding:'14px', textAlign:'center', cursor:'pointer', background:drag?'#EEF3FF':'#FAFAFA', marginBottom:'6px' }}>
          <input ref={ref} type="file" accept="image/*" style={{ display:'none' }} onChange={e=>handleFile(e.target.files[0])}/>
          {uploading ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', fontSize:'12px', color:'#6B7280' }}>
              <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> Caricamento…
            </div>
          ) : (
            <>
              <Upload size={16} style={{ color:'#9CA3AF', marginBottom:'4px' }}/>
              <p style={{ margin:0, fontSize:'11px', color:'#6B7280' }}><strong style={{ color:BLU }}>Trascina</strong> o clicca</p>
            </>
          )}
        </div>
      )}
      <input value={value||''} onChange={e=>onChange(e.target.value)}
        placeholder="…oppure incolla URL" style={{ ...inp, fontSize:'11px', padding:'5px 8px' }}/>
    </div>
  )
}

// ─── BlockProps inline ────────────────────────────────────────────────────────
function BlockProps({ block, onChange }) {
  const set = (k,v) => onChange({ ...block, [k]:v })

  const colorField = (label, key, def='#000000') => (
    <div style={{ marginBottom:'8px' }}>
      <label style={lbl}>{label}</label>
      <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
        <input type="color" value={block[key]||def} onChange={e=>set(key,e.target.value)}
          style={{ width:'32px', height:'26px', border:'1px solid #E5E7EB', borderRadius:'4px', cursor:'pointer', padding:'1px', flexShrink:0 }}/>
        <input value={block[key]||def} onChange={e=>set(key,e.target.value)}
          style={{ ...inp, padding:'4px 7px', fontSize:'11px', fontFamily:'monospace' }}/>
      </div>
    </div>
  )

  const numField = (label, key, def=0, unit='px', min=0, max=200) => (
    <div style={{ marginBottom:'8px' }}>
      <label style={lbl}>{label}</label>
      <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
        <input type="range" min={min} max={max} value={block[key]??def} onChange={e=>set(key,parseInt(e.target.value))}
          style={{ flex:1, accentColor:BLU }}/>
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
      <div style={{ marginBottom:'8px' }}><label style={lbl}>Alt text</label><input value={block.alt||''} onChange={e=>set('alt',e.target.value)} style={inp}/></div>
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
      <ImageDropZone value={block.src} onChange={v=>set('src',v)} label="Sfondo (opz.)"/>
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
      <p style={{ fontSize:'11px', color:'#6B7280', margin:'0 0 10px', fontStyle:'italic' }}>Mostra automaticamente data e luogo dall{'\u2019'}evento.</p>
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
    case 'mappa': return <>
      <div style={{ marginBottom:'8px' }}>
        <label style={lbl}>Indirizzo</label>
        <input value={block.indirizzo||''} onChange={e=>set('indirizzo',e.target.value)} style={inp}
          placeholder="Via Roma 1, Roma — oppure {{luogo_evento}}"/>
        <p style={{ fontSize:'10px', color:'#9CA3AF', margin:'3px 0 0' }}>Puoi usare <code>{'{{luogo_evento}}'}</code> per usare il luogo dell{'\u2019'}evento</p>
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
export default function EventEmailTab({ eventoId }) {
  const [selected,        setSelected]        = useState('conferma')
  const [templates,       setTemplates]       = useState({})
  const [defaultTemplates,setDefaultTemplates]= useState({})
  const [logoUrl, setLogoUrl]                    = useState('')
  const [headerColore, setHeaderColore]          = useState(BLU)
  const [headerTitolo, setHeaderTitolo]           = useState('')
  const [showLogoPicker, setShowLogoPicker]       = useState(false)
  const [logoAltezza,    setLogoAltezza]          = useState(48)
  const [titoloSize,     setTitoloSize]           = useState(13)
  const [formFields,     setFormFields]           = useState([])
  const [blocchi,         setBlocchi]         = useState({})
  const [saving,          setSaving]          = useState(false)
  const [saved,           setSaved]           = useState(false)
  const [editorMode,      setEditorMode]     = useState('blocchi') // 'blocchi'|'html'
  const [previewDevice,   setPreviewDevice]   = useState('desktop')
  const [loading,         setLoading]         = useState(true)
  const [eventoTitolo,    setEventoTitolo]    = useState('')
  const [showResetModal,  setShowResetModal]  = useState(false)
  const [resetting,       setResetting]       = useState(false)
  const [selectedBlock,   setSelectedBlock]   = useState(null)
  const [showHeader,      setShowHeader]      = useState(false)
  const [showVars,        setShowVars]        = useState(false)
  const [previewCollapsed,setPreviewCollapsed]= useState(false)
  const [showTestBar,     setShowTestBar]     = useState(false)
  const [testEmail,       setTestEmail]       = useState('')
  const [sending,         setSending]         = useState(false)
  const dragIdx = useRef(null)
  const dragOverIdx = useRef(null)

  useEffect(() => {
    if (eventoId) {
      Promise.all([fetchEventTemplates(), fetchDefaultTemplates(), fetchEventoTitolo()]).finally(() => setLoading(false))
    }
  }, [eventoId])

  async function fetchEventoTitolo() {
    const { data } = await supabase.from('events').select('titolo').eq('id', eventoId).single()
    if (data?.titolo) setEventoTitolo(data.titolo)
  }

  useEffect(() => { setSelectedBlock(null) }, [selected])

  async function fetchEventTemplates() {
    const { data } = await supabase.from('email_templates').select('*').eq('event_id', eventoId)
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
      const firstTpl = Object.values(tMap)[0]
      if (firstTpl?.header_colore) setHeaderColore(firstTpl.header_colore)
      if (firstTpl?.header_titolo !== undefined) setHeaderTitolo(firstTpl.header_titolo||'')
      if (firstTpl?.logo_altezza) setLogoAltezza(firstTpl.logo_altezza)
      if (firstTpl?.titolo_size) setTitoloSize(firstTpl.titolo_size)
    }
  }

  async function fetchDefaultTemplates() {
    const { data } = await supabase.from('email_templates_default').select('*')
    if (data) { const map={}; data.forEach(t=>{ map[t.tipo]=t }); setDefaultTemplates(map) }
  }

  const current = templates[selected] || { oggetto:'', corpo_html:'' }
  const defaultBlocchi = (() => {
    const def = defaultTemplates[selected]
    if (!def) return []
    try { const p = JSON.parse(def.blocchi_json||'[]'); return Array.isArray(p) ? p : [] } catch { return [] }
  })()
  const hasProprioBlocchi = blocchi[selected] != null && blocchi[selected].length > 0
  const currBlocchi = hasProprioBlocchi ? blocchi[selected] : defaultBlocchi
  const isPersonalizzato = !!templates[selected]?.personalizzato
  const usaDefault = !hasProprioBlocchi && defaultBlocchi.length > 0

  function update(field, value) {
    setTemplates(prev => ({ ...prev, [selected]:{ ...prev[selected], [field]:value, personalizzato:true } }))
  }
  function updateBlocchi(newBlocchi) {
    setBlocchi(prev => ({ ...prev, [selected]:newBlocchi }))
    setTemplates(prev => ({ ...prev, [selected]:{ ...prev[selected], personalizzato:true } }))
  }

  function addBlock(tipo) {
    const b = blockDefaults(tipo)
    const idx = selectedBlock !== null ? selectedBlock+1 : currBlocchi.length
    const next = [...currBlocchi]; next.splice(idx, 0, b)
    updateBlocchi(next)
    setSelectedBlock(idx)
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
    const bodyHtml = editorMode==='html' ? current.corpo_html : blocchiToHtml(currBlocchi)
    await supabase.from('email_templates')
      .update({ oggetto:current.oggetto, corpo_html:bodyHtml, blocchi_json:JSON.stringify(currBlocchi), logo_url:logoUrl||null, header_colore:headerColore||null, header_titolo:headerTitolo||null, logo_altezza:logoAltezza||null, titolo_size:titoloSize||null, personalizzato:true, updated_at:new Date().toISOString() })
      .eq('event_id', eventoId).eq('tipo', selected)
    setSaving(false); setSaved(true); setTimeout(()=>setSaved(false), 2500)
  }

  async function ripristinaDefault() {
    const def = defaultTemplates[selected]
    if (!def) return
    setResetting(true)
    setBlocchi(prev => { const n={...prev}; delete n[selected]; return n })
    setTemplates(prev => ({ ...prev, [selected]:{ ...prev[selected], oggetto:def.oggetto, corpo_html:def.corpo_html, personalizzato:false } }))
    setLogoUrl(def.logo_url || '')
    setHeaderColore(def.header_colore || BLU)
    setHeaderTitolo(def.header_titolo || '')
    setLogoAltezza(def.logo_altezza || 48)
    setTitoloSize(def.titolo_size || 13)
    setSelectedBlock(null)
    await supabase.from('email_templates')
      .update({ oggetto:def.oggetto, corpo_html:def.corpo_html, blocchi_json:null, logo_url:def.logo_url||null, header_colore:def.header_colore||null, header_titolo:def.header_titolo||null, personalizzato:false, updated_at:new Date().toISOString() })
      .eq('event_id', eventoId).eq('tipo', selected)
    setResetting(false); setShowResetModal(false)
  }

  async function sendTest() {
    if (!testEmail.trim()) return
    setSending(true)
    const html = getPreviewHtml()
    const { data: { session } } = await supabase.auth.getSession()
    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-test-email`, {
        method:'POST',
        headers:{ 'Authorization':`Bearer ${session?.access_token}`, 'Content-Type':'application/json' },
        body: JSON.stringify({ to: testEmail, oggetto: current.oggetto||'(test)', html }),
      })
      alert(`Email di test inviata a ${testEmail}`)
    } catch(e) { alert('Errore invio: ' + e.message) }
    setSending(false); setShowTestBar(false)
  }

  function getPreviewHtml() {
    try {
      const bodyHtml = currBlocchi.length ? blocchiToHtml(currBlocchi) : (current.corpo_html||'')
      return replacePreview(buildFullHtml(true, true, bodyHtml, logoUrl, headerColore, headerTitolo, logoAltezza, titoloSize), eventoTitolo)
    } catch(e) { console.error('preview error', e); return '<html><body><p style="padding:20px;color:#9CA3AF">Errore anteprima</p></body></html>' }
  }

  const selectedBl = selectedBlock !== null ? currBlocchi[selectedBlock] : null
  const tipoInfo = TIPI.find(t=>t.key===selected)

  if (loading) return (
    <div style={{ padding:'60px', textAlign:'center', color:'#9CA3AF', fontSize:'14px' }}>Caricamento…</div>
  )

  return (
    <div style={{ fontFamily:"'Inter',sans-serif" }}>

      {/* ── Barra superiore: tipo email + azioni ── */}
      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px', flexWrap:'wrap' }}>
        {/* Tipo email tabs */}
        <div style={{ display:'flex', gap:'4px', flex:1, flexWrap:'wrap' }}>
          {TIPI.map(t => {
            const isSel = selected===t.key
            const isCustom = templates[t.key]?.personalizzato
            return (
              <button key={t.key} type="button"
                onClick={() => { setSelected(t.key); setEditorMode('blocchi') }}
                style={{
                  display:'flex', alignItems:'center', gap:'6px',
                  padding:'8px 14px', borderRadius:'8px', border:'none', cursor:'pointer',
                  background: isSel ? BLU : '#F3F4F6',
                  color: isSel ? '#fff' : '#374151',
                  fontFamily:"'Inter',sans-serif", fontSize:'12px', fontWeight: isSel?'700':'500',
                  transition:'all .15s', position:'relative',
                }}>
                <span style={{ fontSize:'14px' }}>{t.icon}</span>
                <span>{t.label}</span>
                {isCustom && (
                  <span style={{ width:'6px', height:'6px', borderRadius:'50%', background: isSel?'rgba(255,255,255,0.7)':'#F59E0B', flexShrink:0 }}/>
                )}
              </button>
            )
          })}
        </div>

        {/* Azioni */}
        <div style={{ display:'flex', gap:'6px', alignItems:'center', flexShrink:0 }}>
          <button type="button" onClick={()=>setShowTestBar(!showTestBar)}
            style={{ ...ghostBtn, gap:'4px' }}>
            <Send size={12}/> Test
          </button>
          <button type="button" onClick={()=>setShowResetModal(true)}
            style={{ ...ghostBtn, color:isPersonalizzato?'#DC2626':'#6B7280', fontWeight:isPersonalizzato?'700':'500' }}>
            <RotateCcw size={11}/> Ripristina
          </button>
          <button type="button" onClick={save} disabled={saving}
            style={{
              display:'flex', alignItems:'center', gap:'5px',
              padding:'7px 16px', borderRadius:'7px', border:'none', cursor:'pointer',
              fontFamily:"'Inter',sans-serif",
              background: saved ? '#16A34A' : BLU, color:'#fff',
              fontWeight:'700', fontSize:'12px', transition:'background .2s',
            }}>
            {saved?<><CheckCircle size={13}/>Salvato</>:saving?<><Loader2 size={13} style={{animation:'spin 1s linear infinite'}}/>Salvo…</>:<><Save size={13}/>Salva</>}
          </button>
        </div>
      </div>

      {/* ── Test email bar ── */}
      {showTestBar && (
        <div style={{ padding:'10px 14px', background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:'8px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'10px' }}>
          <Send size={13} style={{ color:'#D97706', flexShrink:0 }}/>
          <span style={{ fontSize:'11px', fontWeight:'700', color:'#92400E', flexShrink:0 }}>Invia test a:</span>
          <input value={testEmail} onChange={e=>setTestEmail(e.target.value)}
            placeholder="email@esempio.it" type="email"
            style={{ ...inp, width:'220px', padding:'6px 10px', fontSize:'12px' }}
            onKeyDown={e=>e.key==='Enter'&&sendTest()}/>
          <button type="button" onClick={sendTest} disabled={sending||!testEmail.trim()}
            style={{ display:'flex', alignItems:'center', gap:'4px', padding:'6px 14px', borderRadius:'6px', border:'none', background:'#D97706', color:'#fff', cursor:'pointer', fontSize:'12px', fontWeight:'700', fontFamily:"'Inter',sans-serif" }}>
            {sending?'Invio…':'Invia'}
          </button>
          <button type="button" onClick={()=>setShowTestBar(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', fontSize:'16px', lineHeight:1 }}>×</button>
        </div>
      )}

      {/* ── Layout principale: editor | anteprima ── */}
      <div style={{ display:'flex', gap:'12px', alignItems:'flex-start' }}>

        {/* ═══ COLONNA EDITOR ═══ */}
        <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', gap:'8px' }}>

          {/* Oggetto email */}
          <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:'8px', padding:'10px 14px', display:'flex', alignItems:'center', gap:'10px' }}>
            <span style={{ fontSize:'14px', flexShrink:0 }}>{tipoInfo?.icon}</span>
            <span style={{ ...lbl, margin:0, flexShrink:0 }}>Oggetto</span>
            <input value={current.oggetto||''} onChange={e=>update('oggetto',e.target.value)}
              style={{ flex:1, border:'none', padding:'4px 0', fontSize:'13px', fontWeight:'600', background:'transparent', outline:'none', fontFamily:"'Inter',sans-serif", color:NERO, minWidth:0 }}
              placeholder="Oggetto dell'email…"/>
          </div>

          {/* Intestazione email (collapsible) */}
          <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:'8px', overflow:'hidden' }}>
            <button type="button" onClick={()=>setShowHeader(!showHeader)}
              style={{ width:'100%', padding:'9px 14px', display:'flex', alignItems:'center', gap:'8px', background:'none', border:'none', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>
              <Settings2 size={13} style={{ color:'#9CA3AF' }}/>
              <span style={{ fontSize:'11px', fontWeight:'700', color:'#6B7280', flex:1, textAlign:'left' }}>Intestazione email</span>
              {/* Mini preview */}
              <div style={{ background:headerColore||BLU, borderRadius:'4px', padding:'3px 10px', display:'flex', alignItems:'center', gap:'6px' }}>
                {logoUrl && <img src={logoUrl} style={{ height:'16px', objectFit:'contain' }} alt=""/>}
                {headerTitolo && <span style={{ color:'rgba(255,255,255,0.9)', fontSize:'9px', fontWeight:'600' }}>{headerTitolo}</span>}
                {!logoUrl && !headerTitolo && <span style={{ color:'rgba(255,255,255,0.4)', fontSize:'9px' }}>header</span>}
              </div>
              <ChevronRight size={13} style={{ color:'#9CA3AF', transform:showHeader?'rotate(90deg)':'none', transition:'transform .15s' }}/>
            </button>
            {showHeader && (
              <div style={{ padding:'10px 14px', borderTop:'1px solid #F3F4F6', display:'flex', flexDirection:'column', gap:'8px' }}>
                {/* Preview live header */}
                <div style={{ background:headerColore||BLU, borderRadius:'6px', padding:'10px 16px', display:'flex', alignItems:'center', gap:'10px' }}>
                  {logoUrl && <img src={logoUrl} style={{ height:`${logoAltezza}px`, objectFit:'contain', flexShrink:0, maxWidth:'60%' }} alt="logo"/>}
                  {headerTitolo && <span style={{ color:'rgba(255,255,255,0.9)', fontSize:`${titoloSize}px`, fontWeight:'700', fontFamily:'Inter,sans-serif' }}>{headerTitolo}</span>}
                  {!logoUrl && !headerTitolo && <span style={{ color:'rgba(255,255,255,0.4)', fontSize:'11px' }}>Anteprima header</span>}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                  <div>
                    <label style={lbl}>Logo altezza</label>
                    <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                      <input type="range" min={24} max={96} value={logoAltezza} onChange={e=>setLogoAltezza(+e.target.value)} style={{ flex:1, accentColor:BLU }}/>
                      <span style={{ fontSize:'11px', color:'#6B7280', minWidth:'30px' }}>{logoAltezza}px</span>
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Titolo size</label>
                    <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                      <input type="range" min={10} max={28} value={titoloSize} onChange={e=>setTitoloSize(+e.target.value)} style={{ flex:1, accentColor:BLU }}/>
                      <span style={{ fontSize:'11px', color:'#6B7280', minWidth:'30px' }}>{titoloSize}px</span>
                    </div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:'8px', alignItems:'flex-end' }}>
                  <div style={{ flex:1 }}>
                    <label style={lbl}>Colore sfondo</label>
                    <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                      <input type="color" value={headerColore||BLU} onChange={e=>setHeaderColore(e.target.value)}
                        style={{ width:'32px', height:'26px', border:'1px solid #E5E7EB', borderRadius:'4px', cursor:'pointer', padding:'1px', flexShrink:0 }}/>
                      <input value={headerColore||BLU} onChange={e=>setHeaderColore(e.target.value)}
                        style={{ ...inp, padding:'4px 8px', fontSize:'11px', fontFamily:'monospace', flex:1 }}/>
                      <button type="button" onClick={()=>setHeaderColore(BLU)}
                        style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', fontSize:'10px', flexShrink:0 }}>reset</button>
                    </div>
                  </div>
                  <div style={{ flex:1 }}>
                    <label style={lbl}>Titolo header</label>
                    <input value={headerTitolo||''} onChange={e=>setHeaderTitolo(e.target.value)}
                      style={{ ...inp, padding:'5px 8px', fontSize:'12px' }}
                      placeholder="es. {{nome_evento}}"/>
                  </div>
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
                    <div style={{ border:'1px solid #E5E7EB', borderRadius:'8px', overflow:'hidden', maxHeight:'200px', overflowY:'auto' }}>
                      <LogoPicker value={logoUrl} onChange={url=>{ setLogoUrl(url); setShowLogoPicker(false) }}/>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Toolbar: Blocchi/HTML + variabili */}
          <div style={{ background:'#fff', borderRadius:'8px', border:'1px solid #E5E7EB', padding:'8px 12px', display:'flex', gap:'5px', alignItems:'center' }}>
            {[['blocchi',<Layers size={12}/>, 'Blocchi'],['html',<Code size={12}/>,'HTML']].map(([m,ic,lb])=>(
              <button key={m} type="button" onClick={()=>setEditorMode(m)}
                style={{
                  display:'flex', alignItems:'center', gap:'4px',
                  padding:'5px 12px', borderRadius:'6px', border:'none', cursor:'pointer',
                  background:editorMode===m?BLU:'#F5F5F5',
                  color:editorMode===m?'#fff':'#555',
                  fontSize:'11px', fontWeight:'600', fontFamily:"'Inter',sans-serif",
                  transition:'all .15s',
                }}>
                {ic} {lb}
              </button>
            ))}
            <div style={{ flex:1 }}/>
            <button type="button" onClick={()=>setShowVars(!showVars)}
              style={{ ...ghostBtn, fontSize:'10px', gap:'3px', color:showVars?BLU:'#6B7280', background:showVars?'#EEF3FF':'transparent' }}>
              {'{ }'} Variabili
            </button>
          </div>

          {/* Variabili dropdown */}
          {showVars && (
            <div style={{ background:'#EEF3FF', border:'1px solid #BFDBFE', borderRadius:'8px', padding:'10px 12px' }}>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
                {VARIABILI.map(v=>(
                  <button key={v} type="button" onClick={()=>navigator.clipboard.writeText(v)} title="Copia"
                    style={{ padding:'3px 8px', background:'#fff', border:'1px solid #BFDBFE', borderRadius:'4px', cursor:'pointer', fontSize:'10px', color:'#1d4ed8', fontFamily:'monospace' }}>
                    {v}
                  </button>
                ))}
                {formFields.length > 0 && formFields.map(f => {
                  const v = `{{${f.colonna_db}}}`
                  return (
                    <button key={f.colonna_db} type="button" onClick={()=>navigator.clipboard.writeText(v)} title={f.label}
                      style={{ padding:'3px 8px', background:'#FDF4FF', border:'1px solid #E9D5FF', borderRadius:'4px', cursor:'pointer', fontSize:'10px', color:'#7C3AED', fontFamily:'monospace' }}>
                      {v}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── EDITOR BLOCCHI ── */}
          {editorMode === 'blocchi' && (
            <div style={{ display:'flex', gap:'8px' }}>
              {/* Lista blocchi */}
              <div style={{ flex:1, minWidth:0 }}>
                {usaDefault && (
                  <div style={{ padding:'8px 12px', background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:'8px', marginBottom:'8px', fontSize:'11px', color:'#92400E', display:'flex', alignItems:'center', gap:'6px' }}>
                    <span>⚠️</span>
                    <span>Stai visualizzando il <strong>template standard</strong>. Modifica e salva per personalizzare.</span>
                  </div>
                )}
                {currBlocchi.length === 0 && (
                  <div style={{ textAlign:'center', padding:'40px 16px', color:'#9CA3AF', background:'#fff', border:'1px dashed #E5E7EB', borderRadius:'10px' }}>
                    <LayoutTemplate size={28} style={{ marginBottom:'8px', opacity:.3 }}/>
                    <p style={{ margin:0, fontSize:'13px', fontWeight:'600' }}>Canvas vuoto</p>
                    <p style={{ margin:'3px 0 0', fontSize:'11px' }}>Aggiungi blocchi con il pulsante qui sotto</p>
                  </div>
                )}
                {currBlocchi.map((b,i) => {
                  const info = BLOCK_TYPES.find(t=>t.tipo===b.tipo)||{}
                  const isSel = selectedBlock === i
                  return (
                    <div key={b.id||i} {...dragHandlers(i)}
                      onClick={()=>setSelectedBlock(isSel?null:i)}
                      style={{ border:`2px solid ${isSel?BLU:'transparent'}`, borderRadius:'8px', background:'#fff', marginBottom:'4px', cursor:'pointer', boxShadow:isSel?`0 0 0 3px rgba(0,61,165,0.08)`:'0 1px 3px rgba(0,0,0,0.05)', transition:'all .12s', overflow:'hidden' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 10px' }}>
                        <div style={{ cursor:'grab', color:'#D1D5DB', display:'flex' }}>
                          <GripVertical size={13}/>
                        </div>
                        <span style={{ color:BLU, display:'flex' }}>{info.icon}</span>
                        <span style={{ fontSize:'11px', fontWeight:'700', color:'#374151', flex:1 }}>{info.label}</span>
                        <div style={{ display:'flex', gap:'2px' }} onClick={e=>e.stopPropagation()}>
                          {i>0&&<button onClick={()=>moveBlock(i,-1)} style={btnTiny}><ChevronUp size={10}/></button>}
                          {i<currBlocchi.length-1&&<button onClick={()=>moveBlock(i,1)} style={btnTiny}><ChevronDown size={10}/></button>}
                          <button onClick={()=>deleteBlock(i)} style={{...btnTiny,color:'#EF4444'}}><Trash2 size={10}/></button>
                        </div>
                      </div>
                      {!isSel && (
                        <div style={{ padding:'2px 10px 6px 29px', fontSize:'10px', color:'#9CA3AF', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>
                          {b.tipo==='titolo'&&(b.testo||'(vuoto)')}
                          {b.tipo==='testo'&&((b.html||'').replace(/<[^>]+>/g,'').slice(0,55)||'(vuoto)')}
                          {b.tipo==='bottone'&&(b.testo||'Bottone')}
                          {b.tipo==='immagine'&&(b.src?'🖼 '+b.src.split('/').pop():'📎 Nessuna immagine')}
                          {b.tipo==='hero'&&(b.titolo||'Hero banner')}
                          {b.tipo==='colonne'&&'░░ Layout 2 colonne'}
                          {b.tipo==='info_box'&&'📅 Data e luogo evento'}
                          {b.tipo==='qr'&&'▦ QR Code accesso'}
                          {b.tipo==='separatore'&&'— Separatore'}
                          {b.tipo==='spazio'&&`↕ ${b.altezza||32}px`}
                          {b.tipo==='mappa'&&`📍 ${b.indirizzo||'Indirizzo mappa'}`}
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Aggiungi blocco (compact grid) */}
                <div style={{ background:'#F9FAFB', border:'1.5px dashed #E5E7EB', borderRadius:'8px', padding:'10px 12px', marginTop:'4px' }}>
                  <p style={{ margin:'0 0 6px', fontSize:'9px', fontWeight:'800', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.08em' }}>
                    + Aggiungi blocco
                  </p>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
                    {BLOCK_TYPES.map(bt=>(
                      <button key={bt.tipo} type="button" onClick={()=>addBlock(bt.tipo)}
                        style={{ display:'flex', alignItems:'center', gap:'4px', padding:'4px 8px', background:'#fff', border:'1px solid #E5E7EB', borderRadius:'5px', cursor:'pointer', fontSize:'10px', color:'#374151', fontFamily:"'Inter',sans-serif", fontWeight:'500' }}>
                        <span style={{ color:BLU }}>{bt.icon}</span> {bt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pannello proprietà blocco selezionato */}
              {selectedBl && (
                <div style={{ width:'280px', flexShrink:0, background:'#fff', border:'1px solid #E5E7EB', borderRadius:'8px', overflow:'hidden', alignSelf:'flex-start', maxHeight:'70vh', display:'flex', flexDirection:'column' }}>
                  <div style={{ padding:'9px 12px', borderBottom:'1px solid #E5E7EB', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#F9FAFB', flexShrink:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                      <span style={{ color:BLU, display:'flex' }}>{BLOCK_TYPES.find(t=>t.tipo===selectedBl.tipo)?.icon}</span>
                      <span style={{ fontSize:'11px', fontWeight:'700', color:NERO }}>{BLOCK_TYPES.find(t=>t.tipo===selectedBl.tipo)?.label}</span>
                    </div>
                    <button type="button" onClick={()=>setSelectedBlock(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF' }}><X size={13}/></button>
                  </div>
                  <div style={{ padding:'12px', overflowY:'auto', flex:1 }}>
                    <BlockProps block={selectedBl} onChange={nb=>updateBlock(selectedBlock,nb)}/>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── EDITOR HTML ── */}
          {editorMode === 'html' && (
            <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:'8px', padding:'12px' }}>
              <label style={lbl}>Corpo email — HTML</label>
              <textarea value={current.corpo_html||''} onChange={e=>update('corpo_html',e.target.value)}
                rows={20} style={{ ...inp, fontFamily:'monospace', fontSize:'11px', resize:'vertical', lineHeight:1.6 }}/>
            </div>
          )}
        </div>

        {/* ═══ PANNELLO ANTEPRIMA (sempre visibile) ═══ */}
        <div style={{
          width: previewCollapsed ? '42px' : (previewDevice==='mobile' ? '400px' : '440px'),
          flexShrink:0, display:'flex', flexDirection:'column',
          background:'#fff', border:'1px solid #E5E7EB', borderRadius:'10px',
          overflow:'hidden', transition:'width .25s ease',
          alignSelf:'flex-start', position:'sticky', top:'12px',
          maxHeight:'calc(100vh - 160px)',
        }}>
          {/* Header anteprima */}
          <div style={{
            padding: previewCollapsed ? '10px 0' : '8px 12px',
            borderBottom: previewCollapsed ? 'none' : '1px solid #E5E7EB',
            display:'flex', alignItems:'center', gap:'6px',
            justifyContent: previewCollapsed ? 'center' : 'space-between',
            background:'#FAFBFC', flexShrink:0,
          }}>
            {previewCollapsed ? (
              <button type="button" onClick={()=>setPreviewCollapsed(false)}
                style={{ background:'none', border:'none', cursor:'pointer', color:BLU, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
                <PanelRightOpen size={16}/>
                <span style={{ fontSize:'9px', fontWeight:'700', writingMode:'vertical-lr', letterSpacing:'.05em', color:'#6B7280' }}>ANTEPRIMA</span>
              </button>
            ) : (
              <>
                <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                  <EyeIcon size={13} style={{ color:BLU }}/>
                  <span style={{ fontSize:'11px', fontWeight:'700', color:NERO }}>Anteprima</span>
                  <span style={{ fontSize:'9px', color:'#9CA3AF', background:'#F3F4F6', padding:'2px 6px', borderRadius:'4px' }}>dati di esempio</span>
                </div>
                <div style={{ display:'flex', gap:'2px', alignItems:'center' }}>
                  <div style={{ display:'flex', border:'1px solid #E5E7EB', borderRadius:'5px', overflow:'hidden', marginRight:'4px' }}>
                    {[['desktop',<Monitor size={11}/>],['mobile',<Smartphone size={11}/>]].map(([d,ic])=>(
                      <button key={d} type="button" onClick={()=>setPreviewDevice(d)}
                        style={{ padding:'4px 8px', border:'none', cursor:'pointer', background:previewDevice===d?'#F0F2F5':'#fff', color:previewDevice===d?NERO:'#9CA3AF', display:'flex', alignItems:'center' }}>
                        {ic}
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={()=>setPreviewCollapsed(true)}
                    style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', display:'flex', padding:'4px' }}>
                    <PanelRightClose size={14}/>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Contenuto anteprima */}
          {!previewCollapsed && (
            <>
              {/* Metadati email */}
              <div style={{ padding:'8px 12px', borderBottom:'1px solid #F3F4F6', background:'#FAFBFC', fontSize:'11px', flexShrink:0 }}>
                <div style={{ color:'#6B7280', marginBottom:'2px' }}>
                  <span style={{ fontWeight:'700', color:'#374151' }}>Da:</span> CNA Roma &lt;marketing@cnaroma.it&gt;
                </div>
                <div style={{ color:'#374151', fontWeight:'500' }}>
                  <span style={{ fontWeight:'700' }}>Oggetto:</span> {replacePreview(current.oggetto||'(nessun oggetto)', eventoTitolo)}
                </div>
              </div>
              {/* Iframe preview */}
              <div style={{ flex:1, overflowY:'auto', padding:'10px', background:'#F0F2F5' }}>
                <div style={{
                  maxWidth: previewDevice==='mobile' ? '375px' : '100%',
                  margin:'0 auto',
                  background:'#fff', borderRadius:'8px', overflow:'hidden',
                  boxShadow:'0 2px 12px rgba(0,0,0,0.08)',
                }}>
                  <iframe
                    srcDoc={getPreviewHtml()}
                    style={{ width:'100%', height:'600px', border:'none', display:'block' }}
                    title="Anteprima email" sandbox="allow-same-origin"/>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Modal ripristina ── */}
      {showResetModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}
          onClick={()=>setShowResetModal(false)}>
          <div style={{ background:'white', borderRadius:'16px', padding:'28px', maxWidth:'400px', width:'100%', boxShadow:'0 24px 64px rgba(0,0,0,0.2)' }}
            onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'14px' }}>
              <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:'#FEF2F2', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <AlertTriangle size={20} color="#DC2626"/>
              </div>
              <h3 style={{ margin:0, fontSize:'16px', fontWeight:'800', color:NERO, letterSpacing:'-0.02em' }}>Ripristina template originale</h3>
            </div>
            <p style={{ fontSize:'13px', color:'#374151', lineHeight:1.6, margin:'0 0 20px' }}>
              Stai per eliminare tutte le personalizzazioni di questa email e ripristinare il <strong>template standard</strong>. Questa operazione non può essere annullata.
            </p>
            <div style={{ display:'flex', gap:'8px', justifyContent:'flex-end' }}>
              <button type="button" onClick={()=>setShowResetModal(false)}
                style={{ padding:'8px 18px', borderRadius:'7px', border:'1px solid #E5E7EB', background:'white', fontSize:'13px', fontWeight:'600', cursor:'pointer', fontFamily:"'Inter',sans-serif", color:'#374151' }}>
                Annulla
              </button>
              <button type="button" onClick={ripristinaDefault} disabled={resetting}
                style={{ display:'flex', alignItems:'center', gap:'5px', padding:'8px 18px', borderRadius:'7px', border:'none', background:'#DC2626', color:'white', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>
                <RotateCcw size={13}/>{resetting?'Ripristino…':'Sì, ripristina'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

const inp    = { width:'100%', padding:'7px 10px', border:'1px solid #E5E7EB', borderRadius:'6px', fontSize:'12px', fontFamily:"'Inter',sans-serif", outline:'none', color:'#0A0A0A', background:'#fff', boxSizing:'border-box' }
const lbl    = { display:'block', fontSize:'10px', fontWeight:'800', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:'4px' }
const btnTiny= { padding:'3px 4px', background:'#fff', border:'1px solid #E5E7EB', borderRadius:'4px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#374151' }
const ghostBtn = { display:'flex', alignItems:'center', gap:'3px', padding:'5px 10px', borderRadius:'6px', border:'1px solid #E5E7EB', cursor:'pointer', background:'#fff', fontSize:'11px', fontWeight:'600', fontFamily:"'Inter',sans-serif", color:'#6B7280' }
