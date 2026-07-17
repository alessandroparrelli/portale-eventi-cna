import { useState } from 'react'
import RichEditor from './RichEditor'
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'

/* ─── Defaults tema ────────────────────────────────────────────── */
export const TEMA_DEFAULT = {
  // Colori brand
  colore_primario:     '#003DA5',
  colore_pulsanti:     '#003DA5',
  colore_testo_btn:    '#FFFFFF',
  colore_link:         '#003DA5',
  // Sfondo pagina
  sfondo_pagina:       '#FFFFFF',
  sfondo_header:       '#FFFFFF',
  bordo_header:        '#003DA5',
  spessore_bordo:      '3',
  // Logo
  logo_altezza:        '44',   // px
  logo_bg:             'trasparente',   // trasparente | bianco | colore_primario
  // Pulsanti
  btn_raggio:          '8',    // border-radius px
  btn_stile:           'pieno', // pieno | contorno | pill
  // Tipografia
  heading_colore:      '#0A0A0A',
  testo_colore:        '#374151',
  // Sezioni
  sfondo_sezioni:      '#F4F5F7',
  // Footer/CTA
  cta_bg:              '#EEF3FF',
  // Footer
  sfondo_footer:       '#F4F5F7',
  testo_footer:        '#9CA3AF',
  // Pattern sfondo
  sfondo_pattern:      'nessuno',  // nessuno | pallini | pallini_angolo
  pattern_colore1:     '#003DA5',
  pattern_colore2:     '#E8792F',
  pattern_opacita:     '25',       // 0-100
}

export function temaConDefault(t) {
  return { ...TEMA_DEFAULT, ...(t || {}) }
}

/* ─── Colore picker ─────────────────────────────────────────────── */
function ColorPicker({ label, value, onChange, hint }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label style={sLabel}>{label}</label>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          type="color" value={value}
          onChange={e => onChange(e.target.value)}
          style={{ width: '40px', height: '34px', border: '1px solid #D1D5DB', borderRadius: '6px', cursor: 'pointer', padding: '2px', flexShrink: 0 }}
        />
        <input
          type="text" value={value}
          onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) onChange(e.target.value) }}
          style={{ ...sInput, fontFamily: 'monospace', fontSize: '13px', flex: 1 }}
        />
      </div>
      {hint && <p style={sHint}>{hint}</p>}
    </div>
  )
}

/* ─── Sezione collassabile ─────────────────────────────────────── */
function Sezione({ title, icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ border: '1px solid #E5E7EB', borderRadius: '10px', overflow: 'hidden', marginBottom: '10px' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '13px 16px', background: open ? '#EEF3FF' : '#FAFAFA',
          border: 'none', cursor: 'pointer', fontFamily: "'Inter',sans-serif",
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: '700', color: open ? '#003DA5' : '#0A0A0A', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {icon} {title}
        </span>
        {open ? <ChevronUp size={16} style={{ color: '#6B7280' }} /> : <ChevronDown size={16} style={{ color: '#6B7280' }} />}
      </button>
      {open && (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', background: '#fff' }}>
          {children}
        </div>
      )}
    </div>
  )
}

/* ─── Palette preset ────────────────────────────────────────────── */
const PALETTE = [
  { nome: 'CNA Roma',     primario: '#003DA5', pulsanti: '#003DA5', sfondo_header: '#FFFFFF', bordo_header: '#003DA5', sfondo_pagina: '#FFFFFF' },
  { nome: 'Notte CNA',    primario: '#003DA5', pulsanti: '#003DA5', sfondo_header: '#003DA5', bordo_header: '#003DA5', sfondo_pagina: '#F8F9FF', colore_testo_btn: '#FFFFFF', colore_link: '#003DA5' },
  { nome: 'Verde',        primario: '#16A34A', pulsanti: '#16A34A', sfondo_header: '#FFFFFF', bordo_header: '#16A34A', sfondo_pagina: '#FFFFFF', sfondo_sezioni: '#F0FDF4', cta_bg: '#F0FDF4' },
  { nome: 'Rosso',        primario: '#DC2626', pulsanti: '#DC2626', sfondo_header: '#FFFFFF', bordo_header: '#DC2626', sfondo_pagina: '#FFFFFF', sfondo_sezioni: '#FEF2F2', cta_bg: '#FEF2F2' },
  { nome: 'Viola',        primario: '#7C3AED', pulsanti: '#7C3AED', sfondo_header: '#FFFFFF', bordo_header: '#7C3AED', sfondo_pagina: '#FFFFFF', sfondo_sezioni: '#F5F3FF', cta_bg: '#F5F3FF' },
  { nome: 'Oro',          primario: '#B45309', pulsanti: '#D97706', sfondo_header: '#FFFFFF', bordo_header: '#D97706', sfondo_pagina: '#FFFFFF', sfondo_sezioni: '#FFFBEB', cta_bg: '#FFFBEB' },
  { nome: 'Grafite',      primario: '#1F2937', pulsanti: '#1F2937', sfondo_header: '#1F2937', bordo_header: '#1F2937', sfondo_pagina: '#F9FAFB', sfondo_sezioni: '#F1F2F4', colore_testo_btn: '#FFFFFF' },
  { nome: 'Teal',         primario: '#0D9488', pulsanti: '#0D9488', sfondo_header: '#FFFFFF', bordo_header: '#0D9488', sfondo_pagina: '#FFFFFF', sfondo_sezioni: '#F0FDFA', cta_bg: '#F0FDFA' },
  { nome: 'Nero élite',   primario: '#0A0A0A', pulsanti: '#0A0A0A', sfondo_header: '#0A0A0A', bordo_header: '#0A0A0A', sfondo_pagina: '#FFFFFF', sfondo_sezioni: '#F9FAFB', colore_testo_btn: '#FFFFFF' },
  { nome: 'Bianco puro',  primario: '#003DA5', pulsanti: '#003DA5', sfondo_header: '#FFFFFF', bordo_header: '#FFFFFF', sfondo_pagina: '#FFFFFF', sfondo_sezioni: '#FFFFFF', cta_bg: '#F4F5F7' },
  { nome: 'CNA Pallini',  primario: '#003DA5', pulsanti: '#E8792F', sfondo_header: '#FFFFFF', bordo_header: '#003DA5', sfondo_pagina: '#FFFFFF', sfondo_sezioni: '#F8F9FF', cta_bg: '#EEF3FF', colore_testo_btn: '#FFFFFF', sfondo_pattern: 'pallini_angolo', pattern_colore1: '#003DA5', pattern_colore2: '#E8792F', pattern_opacita: '25' },
]

/* ─── Anteprima mini ────────────────────────────────────────────── */
function Anteprima({ tema, logoUrl, titolo }) {
  const t = temaConDefault(tema)
  const logoHeight = parseInt(t.logo_altezza || 44)

  // Calcola stile pulsante
  const btnRadius = t.btn_stile === 'pill' ? '50px' : `${t.btn_raggio || 8}px`
  const btnBg = t.btn_stile === 'contorno' ? 'transparent' : t.colore_pulsanti
  const btnColor = t.btn_stile === 'contorno' ? t.colore_pulsanti : t.colore_testo_btn
  const btnBorder = t.btn_stile === 'contorno' ? `2px solid ${t.colore_pulsanti}` : 'none'

  // Sfondo logo header
  const logoBg = t.logo_bg === 'colore_primario' ? t.colore_primario
               : t.logo_bg === 'bianco' ? '#FFFFFF'
               : 'transparent'

  // Pattern
  const patternSvg = (() => {
    const p = t.sfondo_pattern
    if (!p || p === 'nessuno') return null
    const c1 = t.pattern_colore1 || '#003DA5', c2 = t.pattern_colore2 || '#E8792F'
    const o = (parseInt(t.pattern_opacita) || 25) / 100
    const seed = [
      {x:82,y:5,r:2,c:1},{x:88,y:3,r:1.5,c:2},{x:95,y:6,r:2.5,c:1},
      {x:78,y:10,r:1.5,c:2},{x:85,y:12,r:3,c:1},{x:91,y:9,r:1.5,c:2},{x:97,y:11,r:2,c:1},
      {x:72,y:16,r:1.5,c:1},{x:80,y:18,r:2.5,c:2},{x:87,y:15,r:1.5,c:1},{x:93,y:19,r:2,c:2},
      {x:68,y:23,r:2,c:2},{x:75,y:25,r:1.5,c:1},{x:83,y:22,r:2.5,c:2},{x:90,y:26,r:1.5,c:1},
    ]
    const circles = seed.map(d => `<circle cx="${d.x}%" cy="${d.y}%" r="${d.r}" fill="${d.c===1?c1:c2}" opacity="${o}"/>`).join('')
    return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 200'>${circles}</svg>`)}")`
  })()

  return (
    <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden', background: t.sfondo_pagina, boxShadow: '0 2px 12px rgba(0,0,0,.06)', position: 'relative' }}>
      {patternSvg && <div style={{ position:'absolute', inset:0, backgroundImage:patternSvg, backgroundSize:'cover', backgroundPosition:'top right', pointerEvents:'none', zIndex:0 }} />}
      {/* Header */}
      <div style={{
        backgroundColor: t.sfondo_header,
        borderBottom: `${t.spessore_bordo || 3}px solid ${t.bordo_header}`,
        padding: '10px 16px',
        display: 'flex', alignItems: 'center',
      }}>
        <div style={{ background: logoBg, padding: logoBg !== 'transparent' ? '4px 8px' : 0, borderRadius: '4px' }}>
          <img
            src={logoUrl || 'https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png'}
            alt="logo" style={{ height: `${Math.min(logoHeight, 56)}px`, maxWidth: '180px', objectFit: 'contain', display: 'block' }}
            onError={e => (e.target.style.display = 'none')}
          />
        </div>
      </div>

      {/* Hero simulato */}
      <div style={{ background: 'linear-gradient(135deg,#1e3a8a,#1e40af)', padding: '20px 16px' }}>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,.7)', margin: '0 0 4px', fontWeight: '600' }}>EVENTO CNA ROMA</p>
        <p style={{ fontSize: '18px', fontWeight: '900', color: '#FFFFFF', margin: 0, letterSpacing: '-.02em' }}>{titolo || 'Titolo evento'}</p>
      </div>

      {/* Body */}
      <div style={{ padding: '16px', background: t.sfondo_pagina }}>
        <p style={{ fontSize: '12px', color: t.testo_colore, margin: '0 0 12px', lineHeight: '1.5' }}>
          Breve descrizione dell'evento. Il testo usa il colore selezionato.
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button style={{ background: btnBg, color: btnColor, border: btnBorder, borderRadius: btnRadius, padding: '8px 16px', fontSize: '12px', fontWeight: '700', fontFamily: "'Inter',sans-serif", cursor: 'default' }}>
            Partecipa →
          </button>
          <a style={{ fontSize: '12px', color: t.colore_link, fontWeight: '600', textDecoration: 'underline', cursor: 'default' }}>
            Scopri di più
          </a>
        </div>
      </div>

      {/* CTA band */}
      <div style={{ background: t.cta_bg, padding: '12px 16px', borderTop: '1px solid #E5E7EB' }}>
        <p style={{ fontSize: '11px', fontWeight: '700', color: t.colore_primario, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '.05em' }}>Registrati</p>
        <div style={{ height: '6px', background: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '60%', background: t.colore_primario, borderRadius: '3px' }} />
        </div>
      </div>
    </div>
  )
}

/* ─── COMPONENTE PRINCIPALE ─────────────────────────────────────── */
export default function AspettoTab({ event, setEvent }) {
  const tema = temaConDefault(event.tema)

  function setT(k, v) {
    setEvent(p => ({ ...p, tema: { ...temaConDefault(p.tema), [k]: v } }))
  }

  function applicaPalette(pl) {
    setEvent(p => ({
      ...p,
      colore_primario: pl.primario,
      tema: {
        ...temaConDefault(p.tema),
        colore_primario:  pl.primario,
        colore_pulsanti:  pl.pulsanti  ?? pl.primario,
        colore_link:      pl.primario,
        sfondo_header:    pl.sfondo_header ?? '#FFFFFF',
        bordo_header:     pl.bordo_header  ?? pl.primario,
        sfondo_pagina:    pl.sfondo_pagina ?? '#FFFFFF',
        sfondo_sezioni:   pl.sfondo_sezioni ?? '#F4F5F7',
        cta_bg:           pl.cta_bg        ?? '#EEF3FF',
        colore_testo_btn: pl.colore_testo_btn ?? '#FFFFFF',
        sfondo_pattern:   pl.sfondo_pattern ?? 'nessuno',
        pattern_colore1:  pl.pattern_colore1 ?? '#003DA5',
        pattern_colore2:  pl.pattern_colore2 ?? '#E8792F',
        pattern_opacita:  pl.pattern_opacita ?? '25',
      }
    }))
  }

  function resetTema() {
    setEvent(p => ({ ...p, tema: { ...TEMA_DEFAULT }, colore_primario: TEMA_DEFAULT.colore_primario }))
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '20px', alignItems: 'start' }}>

      {/* ── Pannello controlli ── */}
      <div>

        {/* Azioni header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0A0A0A', margin: '0 0 3px', letterSpacing: '-.02em' }}>Aspetto grafico</h2>
            <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>Personalizza colori, header, pulsanti e tipografia.</p>
          </div>
          <button
            type="button" onClick={resetTema}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: '8px', padding: '7px 13px', fontSize: '12px', fontWeight: '700', fontFamily: "'Inter',sans-serif", cursor: 'pointer' }}
          >
            <RotateCcw size={13} /> Reset
          </button>
        </div>

        {/* Palette rapide */}
        <div style={{ marginBottom: '16px' }}>
          <p style={{ ...sLabel, marginBottom: '8px' }}>🎨 Palette preimpostate</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {PALETTE.map(pl => {
              const attiva = tema.colore_primario === pl.primario && tema.sfondo_header === (pl.sfondo_header ?? '#FFFFFF')
              return (
                <button key={pl.nome} type="button" onClick={() => applicaPalette(pl)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '7px 12px', border: `2px solid ${attiva ? pl.primario : '#E5E7EB'}`,
                    borderRadius: '8px', background: attiva ? '#F0F4FF' : '#fff',
                    cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                    color: attiva ? pl.primario : '#374151', fontFamily: "'Inter',sans-serif",
                    transition: 'all .15s',
                  }}
                >
                  <span style={{ display: 'flex', gap: '2px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: pl.primario }} />
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: pl.sfondo_header ?? '#fff', border: '1px solid #E5E7EB' }} />
                  </span>
                  {pl.nome}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Sezione: Header ── */}
        <Sezione title="Header" icon="🔝" defaultOpen>
          <div style={sGrid}>
            <ColorPicker label="Sfondo header" value={tema.sfondo_header} onChange={v => setT('sfondo_header', v)} hint="Colore di sfondo della barra in cima alla pagina" />
            <ColorPicker label="Bordo inferiore header" value={tema.bordo_header} onChange={v => setT('bordo_header', v)} />
          </div>
          <div>
            <label style={sLabel}>Spessore bordo header: {tema.spessore_bordo || 3}px</label>
            <input type="range" min="0" max="8" step="1"
              value={tema.spessore_bordo || 3}
              onChange={e => setT('spessore_bordo', e.target.value)}
              style={{ width: '100%', marginTop: '6px' }}
            />
          </div>
        </Sezione>

        {/* ── Sezione: Logo ── */}
        <Sezione title="Logo" icon="🏷">
          <div>
            <label style={sLabel}>Altezza logo: {tema.logo_altezza || 44}px</label>
            <input type="range" min="24" max="160" step="4"
              value={tema.logo_altezza || 44}
              onChange={e => setT('logo_altezza', e.target.value)}
              style={{ width: '100%', marginTop: '6px' }}
            />
            <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
              {[['24', 'XS'], ['44', 'S'], ['64', 'M'], ['96', 'L'], ['128', 'XL'], ['160', 'XXL']].map(([v, l]) => (
                <button key={v} type="button" onClick={() => setT('logo_altezza', v)}
                  style={{ flex: 1, padding: '4px', border: `1px solid ${tema.logo_altezza == v ? '#003DA5' : '#E5E7EB'}`, borderRadius: '5px', background: tema.logo_altezza == v ? '#EEF3FF' : '#fff', fontSize: '11px', fontWeight: '700', color: tema.logo_altezza == v ? '#003DA5' : '#6B7280', cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}
                >{l}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={sLabel}>Sfondo contenitore logo</label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              {[['trasparente', 'Trasparente'], ['bianco', 'Bianco'], ['colore_primario', 'Colore brand']].map(([v, l]) => (
                <button key={v} type="button" onClick={() => setT('logo_bg', v)}
                  style={{ flex: 1, padding: '8px 6px', border: `1px solid ${tema.logo_bg === v ? '#003DA5' : '#E5E7EB'}`, borderRadius: '7px', background: tema.logo_bg === v ? '#EEF3FF' : '#fff', fontSize: '11px', fontWeight: '700', color: tema.logo_bg === v ? '#003DA5' : '#6B7280', cursor: 'pointer', fontFamily: "'Inter',sans-serif", textAlign: 'center' }}
                >{l}</button>
              ))}
            </div>
          </div>
        </Sezione>

        {/* ── Sezione: Colori brand ── */}
        <Sezione title="Colori brand" icon="🎨" defaultOpen>
          <div style={sGrid}>
            <ColorPicker label="Colore primario (accenti, icone, link)"
              value={tema.colore_primario}
              onChange={v => { setT('colore_primario', v); setEvent(p => ({ ...p, colore_primario: v })) }}
            />
            <ColorPicker label="Colore link"
              value={tema.colore_link}
              onChange={v => setT('colore_link', v)}
            />
          </div>
          <div style={sGrid}>
            <ColorPicker label="Colore testo principale"
              value={tema.heading_colore}
              onChange={v => setT('heading_colore', v)}
            />
            <ColorPicker label="Colore testo secondario"
              value={tema.testo_colore}
              onChange={v => setT('testo_colore', v)}
            />
          </div>
        </Sezione>

        {/* ── Sezione: Sfondo pagina ── */}
        <Sezione title="Sfondi pagina" icon="🖼">
          <div style={sGrid}>
            <ColorPicker label="Sfondo pagina" value={tema.sfondo_pagina} onChange={v => { setT('sfondo_pagina', v); setEvent(p => ({ ...p, colore_sfondo: v })) }} hint="Colore di fondo della pagina intera" />
            <ColorPicker label="Sfondo sezioni" value={tema.sfondo_sezioni} onChange={v => setT('sfondo_sezioni', v)} hint="Sfondo delle sezioni di contenuto" />
          </div>

          {/* Pattern decorativo */}
          <div>
            <label style={sLabel}>Pattern decorativo sfondo</label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              {[['nessuno', '✕ Nessuno'], ['pallini', '● Pallini sparsi'], ['pallini_angolo', '◔ Pallini angolo']].map(([v, l]) => (
                <button key={v} type="button" onClick={() => setT('sfondo_pattern', v)}
                  style={{ flex: 1, padding: '9px 8px', border: `1.5px solid ${(tema.sfondo_pattern || 'nessuno') === v ? '#003DA5' : '#E5E7EB'}`, borderRadius: '8px', background: (tema.sfondo_pattern || 'nessuno') === v ? '#EEF3FF' : '#fff', fontSize: '12px', fontWeight: '700', color: (tema.sfondo_pattern || 'nessuno') === v ? '#003DA5' : '#374151', cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>
                  {l}
                </button>
              ))}
            </div>
            <p style={sHint}>Aggiunge un pattern decorativo di pallini colorati sopra lo sfondo della pagina.</p>
          </div>
          {tema.sfondo_pattern && tema.sfondo_pattern !== 'nessuno' && (
            <>
              <div style={sGrid}>
                <ColorPicker label="Colore pallini 1" value={tema.pattern_colore1 || '#003DA5'} onChange={v => setT('pattern_colore1', v)} />
                <ColorPicker label="Colore pallini 2" value={tema.pattern_colore2 || '#E8792F'} onChange={v => setT('pattern_colore2', v)} />
              </div>
              <div>
                <label style={sLabel}>Opacità pattern: {tema.pattern_opacita || 25}%</label>
                <input type="range" min="5" max="80" step="5"
                  value={tema.pattern_opacita || 25}
                  onChange={e => setT('pattern_opacita', e.target.value)}
                  style={{ width: '100%', marginTop: '6px' }}
                />
              </div>
            </>
          )}

          <ColorPicker label="Sfondo area CTA / registrazione" value={tema.cta_bg} onChange={v => setT('cta_bg', v)} />
          <div style={sGrid}>
            <ColorPicker label="Sfondo footer" value={tema.sfondo_footer} onChange={v => setT('sfondo_footer', v)} />
            <ColorPicker label="Colore testo footer" value={tema.testo_footer} onChange={v => setT('testo_footer', v)} />
          </div>
          <button type="button" onClick={() => {
            setT('sfondo_footer', 'linear-gradient(160deg, #003DA5 0%, #001F5C 100%)')
            setT('testo_footer', '#ffffff')
            setEvent(p => ({
              ...p,
              footer_modalita: 'ricco',
              footer_html: '<p style="text-align:center;font-family:Inter,sans-serif;font-weight:700;font-size:14px;margin:0 0 12px">👉 Insieme è meglio 👈</p><p style="text-align:center;font-family:Inter,sans-serif;font-size:13px;line-height:1.7;margin:0"><strong>CNA di Roma</strong><br/>Via Cristoforo Colombo, 283/A, 00147 Roma<br/>Tel. 06570151 • Email info@cnaroma.it</p>',
            }))
          }} style={{ width: '100%', padding: '9px 14px', border: '1.5px solid #003DA5', borderRadius: '8px', background: '#EEF3FF', color: '#003DA5', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: "'Inter',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            ↩ Ripristina footer di default
          </button>

          {/* Modalità footer */}
          <div>
            <label style={sLabel}>Contenuto footer</label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px', marginBottom: '12px' }}>
              {[['semplice', '✏️ Testo semplice'], ['ricco', '🖊 Editor ricco']].map(([v, l]) => (
                <button key={v} type="button"
                  onClick={() => setEvent(p => ({ ...p, footer_modalita: v }))}
                  style={{ flex: 1, padding: '9px 8px', border: `1.5px solid ${(event.footer_modalita || 'semplice') === v ? '#003DA5' : '#E5E7EB'}`, borderRadius: '8px', background: (event.footer_modalita || 'semplice') === v ? '#EEF3FF' : '#fff', fontSize: '12px', fontWeight: '700', color: (event.footer_modalita || 'semplice') === v ? '#003DA5' : '#374151', cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>
                  {l}
                </button>
              ))}
            </div>

            {(event.footer_modalita || 'semplice') === 'semplice' ? (
              <div>
                <input
                  value={event.footer_testo || ''}
                  onChange={e => setEvent(p => ({ ...p, footer_testo: e.target.value }))}
                  placeholder={`© ${new Date().getFullYear()} CNA di Roma — Artigiani Imprenditori d'Italia`}
                  style={{ ...sInput }}
                />
                <p style={sHint}>Testo semplice accanto al logo. Lascia vuoto per il default.</p>
              </div>
            ) : (
              <div>
                <p style={sHint}>Editor ricco — puoi inserire testo formattato, loghi, link, immagini. Il logo dell'evento viene comunque mostrato in cima al footer.</p>
                <div style={{ marginTop: '8px', border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
                  <RichEditor
                    value={event.footer_html || ''}
                    onChange={v => setEvent(p => ({ ...p, footer_html: v }))}
                    placeholder="Contenuto footer: testo, loghi, recapiti, social…"
                    minHeight="140px"
                  />
                </div>
                <p style={sHint}>Il contenuto viene usato anche nell'export HTML per MailUp.</p>
              </div>
            )}
          </div>
        </Sezione>

        {/* ── Sezione: Pulsanti ── */}
        <Sezione title="Pulsanti" icon="🔘">
          <div style={sGrid}>
            <ColorPicker label="Colore sfondo pulsanti" value={tema.colore_pulsanti} onChange={v => setT('colore_pulsanti', v)} />
            <ColorPicker label="Colore testo pulsanti" value={tema.colore_testo_btn} onChange={v => setT('colore_testo_btn', v)} />
          </div>
          <div>
            <label style={sLabel}>Stile pulsante</label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              {[['pieno', '▬ Pieno'], ['contorno', '□ Contorno'], ['pill', '( Pill )']].map(([v, l]) => (
                <button key={v} type="button" onClick={() => setT('btn_stile', v)}
                  style={{ flex: 1, padding: '9px 8px', border: `1.5px solid ${tema.btn_stile === v ? '#003DA5' : '#E5E7EB'}`, borderRadius: '8px', background: tema.btn_stile === v ? '#EEF3FF' : '#fff', fontSize: '12px', fontWeight: '700', color: tema.btn_stile === v ? '#003DA5' : '#374151', cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}
                >{l}</button>
              ))}
            </div>
          </div>
          {tema.btn_stile !== 'pill' && (
            <div>
              <label style={sLabel}>Arrotondamento angoli pulsante: {tema.btn_raggio || 8}px</label>
              <input type="range" min="0" max="24" step="2"
                value={tema.btn_raggio || 8}
                onChange={e => setT('btn_raggio', e.target.value)}
                style={{ width: '100%', marginTop: '6px' }}
              />
            </div>
          )}
        </Sezione>

      </div>

      {/* ── Anteprima live sticky ── */}
      <div style={{ position: 'sticky', top: '80px' }}>
        <p style={{ ...sLabel, marginBottom: '8px' }}>👁 Anteprima live</p>
        <Anteprima tema={event.tema} logoUrl={event.logo_url} titolo={event.titolo} />
        <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '8px', textAlign: 'center', lineHeight: '1.4' }}>
          Le modifiche si applicano alla pagina evento dopo il salvataggio.
        </p>
      </div>

      <style>{`@media(max-width:640px){.aspetto-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  )
}

const sLabel = { fontSize: '12px', fontWeight: '700', color: '#374151', display: 'block' }
const sInput = { width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', backgroundColor: '#fff' }
const sHint  = { fontSize: '11px', color: '#9CA3AF', margin: '3px 0 0', lineHeight: '1.4' }
const sGrid  = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }
