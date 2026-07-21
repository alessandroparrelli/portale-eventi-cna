/**
 * HeaderEditor — Componente condiviso per configurazione avanzata header email
 * Usato sia in EventEmailTab che in EmailEditorPage
 */
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import {
  AlignLeft, AlignCenter, AlignRight, ChevronRight, X,
  Upload, Loader2, Settings2, Layout, Type, Palette, Image as ImageIcon
} from 'lucide-react'

const BLU = '#003DA5'
const NERO = '#0A0A0A'
const DEFAULT_LOGO = 'https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png'

const FONTS = [
  { value:'Inter,Arial,sans-serif',        label:'Inter' },
  { value:'Georgia,serif',                  label:'Georgia' },
  { value:'Arial,Helvetica,sans-serif',     label:'Arial' },
  { value:"'Trebuchet MS',sans-serif",      label:'Trebuchet' },
  { value:"'Courier New',monospace",        label:'Courier' },
  { value:'Verdana,sans-serif',             label:'Verdana' },
  { value:"'Times New Roman',serif",        label:'Times' },
]

const WEIGHTS = [
  { value:'400', label:'Regular' },
  { value:'500', label:'Medium' },
  { value:'600', label:'Semibold' },
  { value:'700', label:'Bold' },
  { value:'800', label:'Extra Bold' },
  { value:'900', label:'Black' },
]

const LAYOUTS = [
  { value:'left',    label:'Logo a sinistra',  desc:'Logo e titolo allineati a sinistra' },
  { value:'center',  label:'Centrato',          desc:'Logo e titolo centrati' },
  { value:'stacked', label:'Impilato centrato', desc:'Logo sopra, titolo sotto, centrati' },
]

// Default config
export const DEFAULT_HEADER_CONFIG = {
  // Logo
  logo_url: '',
  logo_altezza: 48,
  logo_align: 'left',
  // Titolo
  titolo: '',
  titolo_size: 13,
  titolo_colore: 'rgba(255,255,255,0.9)',
  titolo_font: 'Inter,Arial,sans-serif',
  titolo_weight: '700',
  titolo_spacing: '0.01',
  titolo_align: 'left',
  // Header
  sfondo: BLU,
  padding_v: 16,
  padding_h: 32,
  layout: 'left',
  // Visibility
  mostra_header: true,
  mostra_footer: true,
}

/** Merge config parziale con defaults */
export function mergeHeaderConfig(saved) {
  return { ...DEFAULT_HEADER_CONFIG, ...(saved || {}) }
}

/**
 * Genera HTML dell'header email a partire dal config
 */
export function buildHeaderHtml(cfg) {
  const c = mergeHeaderConfig(cfg)
  if (!c.mostra_header) return ''

  const logo = c.logo_url || DEFAULT_LOGO
  const align = c.layout === 'center' || c.layout === 'stacked' ? 'center' : 'left'
  const tdAlign = align

  const logoHtml = logo
    ? `<img src="${logo}" alt="Logo" style="height:${c.logo_altezza}px;display:${c.layout==='stacked'?'inline-block':'block'}" />`
    : ''

  const titoloHtml = c.titolo
    ? `<p style="margin:${c.layout==='stacked'?'8px 0 0':'0'};font-size:${c.titolo_size}px;font-weight:${c.titolo_weight};color:${c.titolo_colore};font-family:${c.titolo_font};letter-spacing:${c.titolo_spacing}em;text-align:${c.titolo_align};line-height:1.3">${c.titolo}</p>`
    : ''

  let innerHtml
  if (c.layout === 'stacked') {
    innerHtml = `<td style="padding:${c.padding_v}px ${c.padding_h}px;text-align:center">${logoHtml}${titoloHtml}</td>`
  } else {
    // left or center — logo and title inline
    const flexAlign = c.layout === 'center' ? 'center' : 'flex-start'
    if (c.titolo) {
      innerHtml = `<td style="padding:${c.padding_v}px ${c.padding_h}px" align="${tdAlign}">
        <table cellpadding="0" cellspacing="0" border="0"><tr>
          ${logoHtml ? `<td style="vertical-align:middle;padding-right:12px">${logoHtml}</td>` : ''}
          <td style="vertical-align:middle">${titoloHtml}</td>
        </tr></table>
      </td>`
    } else {
      innerHtml = `<td style="padding:${c.padding_v}px ${c.padding_h}px" align="${tdAlign}">${logoHtml}</td>`
    }
  }

  return `<div style="background:${c.sfondo}"><table style="width:100%;border-collapse:collapse"><tr>${innerHtml}</tr></table></div>`
}

/**
 * Genera HTML del footer email
 */
export function buildFooterHtml(cfg) {
  const c = mergeHeaderConfig(cfg)
  if (!c.mostra_footer) return ''
  return `<div style="background:#F9FAFB;border-top:1px solid #E5E7EB;padding:20px 32px"><p style="margin:0;font-size:11px;color:#9CA3AF;font-family:Inter,Arial,sans-serif">CNA di Roma \u2014 Confederazione Nazionale dell\u2019Artigianato \u00b7 <a href="mailto:marketing@cnaroma.it" style="color:${BLU}">marketing@cnaroma.it</a></p></div>`
}

/**
 * Genera HTML completo dell'email
 */
export function buildFullEmailHtml(bodyHtml, headerConfig) {
  const header = buildHeaderHtml(headerConfig)
  const footer = buildFooterHtml(headerConfig)
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#F0F2F5;font-family:Inter,Arial,sans-serif"><table style="width:100%;border-collapse:collapse"><tr><td style="padding:24px 16px"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.1)">${header}<div style="padding:32px">${bodyHtml}</div>${footer}</div></td></tr></table></body></html>`
}

// ─── LogoPicker ────────────────────────────────────────────────────────────────
function LogoPicker({ value, onChange }) {
  const [loghi, setLoghi] = useState([])
  const [loading, setLoading] = useState(true)

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
            { name: 'CNA Roma (default)', url: DEFAULT_LOGO, isDefault: true },
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
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(68px, 1fr))', gap:'5px' }}>
      {loghi.map((logo, i) => {
        const sel = value === logo.url || (!value && logo.isDefault)
        return (
          <button key={i} type="button" onClick={() => onChange(logo.isDefault ? '' : logo.url)}
            style={{ border:`2px solid ${sel ? BLU : '#E5E7EB'}`, borderRadius:'7px', background: sel ? '#EEF3FF' : '#fff', padding:'5px', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'3px' }}>
            <img src={logo.url} alt={logo.name} style={{ height:'32px', width:'100%', objectFit:'contain' }}
              onError={e => e.target.style.opacity = '0.3'}/>
            <span style={{ fontSize:'8px', color: sel ? BLU : '#6B7280', textAlign:'center', lineHeight:1.2, fontWeight: sel ? '700' : '400', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'100%' }}>
              {logo.name}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ─── Sotto-componenti UI ──────────────────────────────────────────────────────
function ColorPicker({ label, value, onChange, defaultValue }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
        <input type="color" value={value||defaultValue||'#000000'} onChange={e=>onChange(e.target.value)}
          style={{ width:'30px', height:'24px', border:'1px solid #E5E7EB', borderRadius:'4px', cursor:'pointer', padding:'1px', flexShrink:0 }}/>
        <input value={value||defaultValue||''} onChange={e=>onChange(e.target.value)}
          style={{ ...inp, padding:'4px 7px', fontSize:'11px', fontFamily:'monospace', flex:1 }}/>
        {defaultValue && value !== defaultValue && (
          <button type="button" onClick={()=>onChange(defaultValue)}
            style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', fontSize:'9px', flexShrink:0 }}>reset</button>
        )}
      </div>
    </div>
  )
}

function SliderField({ label, value, onChange, min, max, unit='px' }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
        <input type="range" min={min} max={max} value={value} onChange={e=>onChange(+e.target.value)}
          style={{ flex:1, accentColor:BLU }}/>
        <span style={{ fontSize:'11px', color:'#6B7280', minWidth:'34px', textAlign:'right' }}>{value}{unit}</span>
      </div>
    </div>
  )
}

function AlignPicker({ value, onChange }) {
  return (
    <div>
      <label style={lbl}>Allineamento</label>
      <div style={{ display:'flex', gap:'3px' }}>
        {[['left',<AlignLeft size={12}/>],['center',<AlignCenter size={12}/>],['right',<AlignRight size={12}/>]].map(([v,ic])=>(
          <button key={v} type="button" onClick={()=>onChange(v)}
            style={{ flex:1, padding:'5px', border:`1px solid ${value===v?BLU:'#E5E7EB'}`, borderRadius:'5px', cursor:'pointer', background:value===v?'#EEF3FF':'#fff', color:value===v?BLU:'#9CA3AF', display:'flex', alignItems:'center', justifyContent:'center' }}>
            {ic}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Componente principale ────────────────────────────────────────────────────
export default function HeaderEditor({ config, onChange, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [activeTab, setActiveTab] = useState('layout') // 'layout' | 'logo' | 'titolo' | 'stile'
  const [showLogoPicker, setShowLogoPicker] = useState(false)
  const c = mergeHeaderConfig(config)

  const set = (key, val) => onChange({ ...c, [key]: val })

  // Mini-preview nell'header collapsato
  const miniPreview = (
    <div style={{
      background: c.sfondo, borderRadius:'4px', padding:'3px 10px',
      display:'flex', alignItems:'center', gap:'6px', maxWidth:'200px',
    }}>
      {(c.logo_url || DEFAULT_LOGO) && (
        <img src={c.logo_url || DEFAULT_LOGO} style={{ height:'14px', objectFit:'contain' }} alt=""/>
      )}
      {c.titolo && (
        <span style={{
          color: c.titolo_colore, fontSize:'9px', fontWeight: c.titolo_weight,
          fontFamily: c.titolo_font, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
        }}>{c.titolo}</span>
      )}
      {!c.logo_url && !c.titolo && (
        <span style={{ color:'rgba(255,255,255,0.4)', fontSize:'9px' }}>header</span>
      )}
    </div>
  )

  const TABS = [
    { key:'layout', label:'Layout',  icon:<Layout size={12}/> },
    { key:'logo',   label:'Logo',    icon:<ImageIcon size={12}/> },
    { key:'titolo', label:'Titolo',  icon:<Type size={12}/> },
    { key:'stile',  label:'Stile',   icon:<Palette size={12}/> },
  ]

  return (
    <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:'8px', overflow:'hidden' }}>
      {/* Header collapsible */}
      <button type="button" onClick={()=>setExpanded(!expanded)}
        style={{ width:'100%', padding:'9px 14px', display:'flex', alignItems:'center', gap:'8px', background:'none', border:'none', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>
        <Settings2 size={13} style={{ color:'#9CA3AF' }}/>
        <span style={{ fontSize:'11px', fontWeight:'700', color:'#6B7280', flex:1, textAlign:'left' }}>Intestazione email</span>
        {miniPreview}
        <ChevronRight size={13} style={{ color:'#9CA3AF', transform:expanded?'rotate(90deg)':'none', transition:'transform .15s' }}/>
      </button>

      {expanded && (
        <div style={{ borderTop:'1px solid #F3F4F6' }}>

          {/* Live preview */}
          <div style={{ padding:'10px 14px', background:'#F9FAFB' }}>
            <div style={{
              background: c.sfondo, borderRadius:'6px', overflow:'hidden',
              padding: `${c.padding_v}px ${c.padding_h}px`,
              display:'flex', flexDirection: c.layout==='stacked'?'column':'row',
              alignItems: c.layout==='stacked'?'center': c.layout==='center'?'center':'flex-start',
              justifyContent: c.layout==='center'?'center':'flex-start',
              gap: c.layout==='stacked'?'6px':'10px',
            }}>
              {(c.logo_url || DEFAULT_LOGO) && (
                <img src={c.logo_url || DEFAULT_LOGO} style={{ height:`${c.logo_altezza}px`, objectFit:'contain', flexShrink:0, maxWidth:'65%' }} alt="logo"/>
              )}
              {c.titolo && (
                <span style={{
                  color: c.titolo_colore, fontSize:`${c.titolo_size}px`,
                  fontWeight: c.titolo_weight, fontFamily: c.titolo_font,
                  letterSpacing: `${c.titolo_spacing}em`,
                  textAlign: c.layout==='stacked'?'center':c.titolo_align,
                  lineHeight: 1.3,
                }}>{c.titolo}</span>
              )}
              {!c.logo_url && !c.titolo && (
                <span style={{ color:'rgba(255,255,255,0.4)', fontSize:'11px' }}>Anteprima header</span>
              )}
            </div>
          </div>

          {/* Tab navigation */}
          <div style={{ padding:'6px 14px 0', display:'flex', gap:'2px', borderBottom:'1px solid #F3F4F6' }}>
            {TABS.map(t => (
              <button key={t.key} type="button" onClick={()=>setActiveTab(t.key)}
                style={{
                  display:'flex', alignItems:'center', gap:'4px',
                  padding:'6px 10px', borderRadius:'6px 6px 0 0', border:'none', cursor:'pointer',
                  background: activeTab===t.key ? '#fff' : 'transparent',
                  color: activeTab===t.key ? BLU : '#9CA3AF',
                  fontSize:'10px', fontWeight:'700', fontFamily:"'Inter',sans-serif",
                  borderBottom: activeTab===t.key ? `2px solid ${BLU}` : '2px solid transparent',
                }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ padding:'12px 14px', display:'flex', flexDirection:'column', gap:'10px' }}>

            {/* ── LAYOUT ── */}
            {activeTab === 'layout' && <>
              <div>
                <label style={lbl}>Disposizione</label>
                <div style={{ display:'flex', gap:'4px' }}>
                  {LAYOUTS.map(l => (
                    <button key={l.value} type="button" onClick={()=>set('layout', l.value)}
                      style={{
                        flex:1, padding:'8px 6px', border:`1.5px solid ${c.layout===l.value?BLU:'#E5E7EB'}`,
                        borderRadius:'6px', cursor:'pointer', textAlign:'center',
                        background: c.layout===l.value ? '#EEF3FF' : '#fff',
                        fontFamily:"'Inter',sans-serif",
                      }}>
                      <div style={{ fontSize:'10px', fontWeight:'700', color: c.layout===l.value ? BLU : '#374151', marginBottom:'2px' }}>{l.label}</div>
                      <div style={{ fontSize:'9px', color:'#9CA3AF', lineHeight:1.3 }}>{l.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                <SliderField label="Padding verticale" value={c.padding_v} onChange={v=>set('padding_v',v)} min={8} max={48}/>
                <SliderField label="Padding orizzontale" value={c.padding_h} onChange={v=>set('padding_h',v)} min={12} max={60}/>
              </div>
              <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
                {[['mostra_header','Mostra header'],['mostra_footer','Mostra footer']].map(([k,lb])=>(
                  <label key={k} style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'11px', cursor:'pointer', color:'#374151' }}>
                    <input type="checkbox" checked={c[k]!==false} onChange={e=>set(k,e.target.checked)} style={{ accentColor:BLU }}/>
                    {lb}
                  </label>
                ))}
              </div>
            </>}

            {/* ── LOGO ── */}
            {activeTab === 'logo' && <>
              <SliderField label="Altezza logo" value={c.logo_altezza} onChange={v=>set('logo_altezza',v)} min={20} max={96}/>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'6px' }}>
                  <label style={{ ...lbl, margin:0 }}>Logo</label>
                  <button type="button" onClick={()=>setShowLogoPicker(!showLogoPicker)}
                    style={{ fontSize:'10px', padding:'2px 8px', border:'1px solid #E5E7EB', borderRadius:'4px', cursor:'pointer', background:showLogoPicker?BLU:'#fff', color:showLogoPicker?'#fff':'#374151', fontFamily:'Inter,sans-serif' }}>
                    {showLogoPicker ? '✕ chiudi' : '📂 scegli logo'}
                  </button>
                  {c.logo_url && (
                    <button type="button" onClick={()=>set('logo_url','')}
                      style={{ fontSize:'10px', padding:'2px 8px', border:'1px solid #FEE2E2', borderRadius:'4px', cursor:'pointer', background:'#FFF5F5', color:'#DC2626', fontFamily:'Inter,sans-serif' }}>
                      ✕ rimuovi
                    </button>
                  )}
                </div>
                {showLogoPicker && (
                  <div style={{ border:'1px solid #E5E7EB', borderRadius:'8px', padding:'8px', maxHeight:'200px', overflowY:'auto' }}>
                    <LogoPicker value={c.logo_url} onChange={url=>{ set('logo_url', url); setShowLogoPicker(false) }}/>
                  </div>
                )}
              </div>
              <div>
                <label style={lbl}>URL logo manuale</label>
                <input value={c.logo_url||''} onChange={e=>set('logo_url',e.target.value)}
                  style={{ ...inp, fontSize:'11px' }} placeholder="Incolla URL immagine…"/>
              </div>
            </>}

            {/* ── TITOLO ── */}
            {activeTab === 'titolo' && <>
              <div>
                <label style={lbl}>Testo titolo</label>
                <input value={c.titolo||''} onChange={e=>set('titolo',e.target.value)}
                  style={inp} placeholder="es. {{nome_evento}} oppure Forum CNA 2026"/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                <div>
                  <label style={lbl}>Font</label>
                  <select value={c.titolo_font} onChange={e=>set('titolo_font',e.target.value)} style={inp}>
                    {FONTS.map(f=><option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Peso</label>
                  <select value={c.titolo_weight} onChange={e=>set('titolo_weight',e.target.value)} style={inp}>
                    {WEIGHTS.map(w=><option key={w.value} value={w.value}>{w.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                <SliderField label="Dimensione" value={c.titolo_size} onChange={v=>set('titolo_size',v)} min={10} max={36}/>
                <SliderField label="Spaziatura lettere" value={parseFloat(c.titolo_spacing)*100||1} onChange={v=>set('titolo_spacing',(v/100).toFixed(2))} min={-5} max={20} unit=""/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                <ColorPicker label="Colore testo" value={c.titolo_colore} onChange={v=>set('titolo_colore',v)} defaultValue="rgba(255,255,255,0.9)"/>
                <AlignPicker value={c.titolo_align} onChange={v=>set('titolo_align',v)}/>
              </div>
            </>}

            {/* ── STILE ── */}
            {activeTab === 'stile' && <>
              <ColorPicker label="Colore sfondo header" value={c.sfondo} onChange={v=>set('sfondo',v)} defaultValue={BLU}/>
              <div>
                <label style={lbl}>Preset rapidi</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
                  {[
                    { color:BLU, name:'Blu CNA' },
                    { color:'#0A1628', name:'Notte' },
                    { color:'#1E293B', name:'Grafite' },
                    { color:'#4C1D95', name:'Viola' },
                    { color:'#7F1D1D', name:'Rosso' },
                    { color:'#14532D', name:'Verde' },
                    { color:'#ffffff', name:'Bianco' },
                    { color:'#F3F4F6', name:'Chiaro' },
                  ].map(p=>(
                    <button key={p.color} type="button" onClick={()=>set('sfondo',p.color)}
                      style={{
                        width:'32px', height:'24px', borderRadius:'4px', cursor:'pointer',
                        border:`2px solid ${c.sfondo===p.color?BLU:'#E5E7EB'}`,
                        background:p.color, position:'relative',
                      }}
                      title={p.name}/>
                  ))}
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                <SliderField label="Padding verticale" value={c.padding_v} onChange={v=>set('padding_v',v)} min={8} max={48}/>
                <SliderField label="Padding orizzontale" value={c.padding_h} onChange={v=>set('padding_h',v)} min={12} max={60}/>
              </div>
            </>}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Stili condivisi ──────────────────────────────────────────────────────────
const inp = { width:'100%', padding:'7px 10px', border:'1px solid #E5E7EB', borderRadius:'6px', fontSize:'12px', fontFamily:"'Inter',sans-serif", outline:'none', color:NERO, background:'#fff', boxSizing:'border-box' }
const lbl = { display:'block', fontSize:'10px', fontWeight:'800', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:'4px' }
