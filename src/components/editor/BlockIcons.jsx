/**
 * Icone SVG colorate per i blocchi editor
 * Esporta: BLOCK_ICONS (mappa tipo→SVG), IconPicker (componente selettore)
 */

// ── SVG per ogni tipo di blocco ────────────────────────────────────
export const BLOCK_ICONS = {
  testo: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round">
      <path d="M4 6h16M4 10h16M4 14h10"/>
    </svg>
  ),
  titolo: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round">
      <path d="M4 6h16M4 12h10M6 6v12M10 6v6"/>
    </svg>
  ),
  immagine: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
      <path d="M21 15l-5-5L5 21"/>
    </svg>
  ),
  separatore: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round">
      <path d="M5 12h14"/>
    </svg>
  ),
  stats: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth="2" strokeLinecap="round">
      <path d="M18 20V10M12 20V4M6 20v-6"/>
    </svg>
  ),
  griglia: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  badge_list: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round">
      <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  ),
  timeline: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14"/><circle cx="12" cy="5" r="2" fill="#D97706"/><circle cx="12" cy="12" r="2" fill="#D97706"/><circle cx="12" cy="19" r="2" fill="#D97706"/>
    </svg>
  ),
  accordion: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round">
      <path d="M3 6h18M3 12h18M3 18h18"/><path d="M19 9l-3-3-3 3M19 15l-3 3-3-3"/>
    </svg>
  ),
  testimonial: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="2" strokeLinecap="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  countdown: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>
    </svg>
  ),
  video: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round">
      <rect x="2" y="4" width="15" height="16" rx="2"/><path d="M17 9l5-3v12l-5-3V9z"/>
    </svg>
  ),
  cta: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth="2" strokeLinecap="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6"/>
      <rect x="2" y="8" width="20" height="8" rx="2"/>
    </svg>
  ),
  banner: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>
    </svg>
  ),
  carosello: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="2" strokeLinecap="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M8 4v16M16 4v16M2 12h4M18 12h4"/>
    </svg>
  ),
  social: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="2" strokeLinecap="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/>
    </svg>
  ),
  programma: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E91E8C" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h4M8 18h.01M12 18h4"/>
    </svg>
  ),
}

// ── Icone disponibili per griglia/badge con picker ─────────────────
export const ICON_LIBRARY = [
  // Business / Servizi
  { id:'star',     label:'Stella',       svg:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
  { id:'check',    label:'Spunta',       svg:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> },
  { id:'shield',   label:'Scudo',        svg:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
  { id:'award',    label:'Premio',       svg:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg> },
  { id:'briefcase',label:'Valigetta',    svg:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M12 12v4M10 14h4"/></svg> },
  { id:'handshake',label:'Accordo',      svg:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"/></svg> },
  { id:'chart',    label:'Grafico',      svg:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg> },
  { id:'trending', label:'Trend',        svg:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> },
  // Comunicazione
  { id:'mail',     label:'Email',        svg:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/></svg> },
  { id:'phone',    label:'Telefono',     svg:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1 19.79 19.79 0 0 1 1.61 4.48 2 2 0 0 1 3.59 2.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.16 6.16l1-.93a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 17z"/></svg> },
  { id:'globe',    label:'Web',          svg:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> },
  { id:'chat',     label:'Chat',         svg:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
  // Persone
  { id:'users',    label:'Persone',      svg:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { id:'user',     label:'Persona',      svg:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  { id:'heart',    label:'Cuore',        svg:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
  // Tech / Digital
  { id:'cpu',      label:'Tecnologia',   svg:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="6" height="6"/><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M9 2v7M15 2v7M9 15v7M15 15v7M2 9h7M2 15h7M15 9h7M15 15h7"/></svg> },
  { id:'zap',      label:'Velocità',     svg:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
  { id:'lock',     label:'Sicurezza',    svg:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> },
  { id:'settings', label:'Impostazioni', svg:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
  // Artigianato / CNA
  { id:'tool',     label:'Strumenti',    svg:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> },
  { id:'home',     label:'Casa',         svg:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { id:'building', label:'Edificio',     svg:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v8h4"/><path d="M18 9h2a2 2 0 0 1 2 2v11h-4"/><path d="M10 6h4M10 10h4M10 14h4M10 18h4"/></svg> },
  { id:'leaf',     label:'Natura',       svg:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg> },
  // Frecce / Navigazione
  { id:'arrow',    label:'Freccia',      svg:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg> },
  { id:'target',   label:'Target',       svg:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> },
  { id:'compass',  label:'Bussola',      svg:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg> },
  { id:'map',      label:'Mappa',        svg:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg> },
  { id:'lightbulb',label:'Idea',         svg:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/></svg> },
  { id:'rocket',   label:'Lancio',       svg:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg> },
  { id:'gift',     label:'Regalo',       svg:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg> },
  { id:'clock',    label:'Tempo',        svg:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  { id:'calendar', label:'Calendario',   svg:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  { id:'book',     label:'Formazione',   svg:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
  { id:'coins',    label:'Finanza',      svg:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/></svg> },
]

// ── Palette colori icone ───────────────────────────────────────────
export const ICON_COLORS = [
  { value:'#E11D48', label:'Blu CNA' },
  { value:'#059669', label:'Verde' },
  { value:'#DC2626', label:'Rosso' },
  { value:'#D97706', label:'Arancio' },
  { value:'#7C3AED', label:'Viola' },
  { value:'#0891B2', label:'Azzurro' },
  { value:'#EC4899', label:'Rosa' },
  { value:'#374151', label:'Grigio' },
  { value:'#0A0A0A', label:'Nero' },
]

// ── Componente IconPicker ─────────────────────────────────────────
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

export function IconPicker({ value, color = '#E11D48', onChangeIcon, onChangeColor }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef(null)
  const panelRef = useRef(null)
  const current = ICON_LIBRARY.find(i => i.id === value)

  useEffect(() => {
    if (!open) return
    const rect = btnRef.current?.getBoundingClientRect()
    if (rect) {
      setPos({ top: rect.bottom + 6 + window.scrollY, left: rect.left + window.scrollX })
    }
    const close = (e) => {
      if (
        !btnRef.current?.contains(e.target) &&
        !panelRef.current?.contains(e.target)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div style={{ position:'relative' }}>
      {/* Bottone trigger */}
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display:'flex', alignItems:'center', gap:'8px',
          padding:'8px 12px', border:'1px solid #E5E7EB', borderRadius:'8px',
          background:'#fff', cursor:'pointer', fontFamily:'Inter,sans-serif',
          fontSize:'13px', color:'#374151', fontWeight:'600',
        }}
      >
        <span style={{ color, display:'flex', alignItems:'center', width:'20px', height:'20px' }}>
          {current ? current.svg : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
          )}
        </span>
        {current ? current.label : 'Scegli icona'}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
      </button>

      {/* Pannello picker — montato su document.body via portal */}
      {open && createPortal(
        <div ref={panelRef} style={{
          position:'absolute', top: pos.top, left: pos.left, zIndex:9999,
          background:'#fff', border:'1px solid #E5E7EB', borderRadius:'12px',
          boxShadow:'0 8px 32px rgba(0,0,0,0.12)', padding:'14px',
          width:'280px', maxHeight:'360px', overflowY:'auto',
        }}>
          {/* Colori */}
          <p style={{ fontSize:'11px', fontWeight:'700', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.06em', margin:'0 0 8px' }}>Colore</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginBottom:'14px' }}>
            {ICON_COLORS.map(c => (
              <button key={c.value} type="button" onClick={() => onChangeColor(c.value)}
                title={c.label}
                style={{
                  width:'24px', height:'24px', borderRadius:'50%', background:c.value,
                  border: color === c.value ? '2px solid #0A0A0A' : '2px solid transparent',
                  cursor:'pointer', transition:'transform .1s',
                  boxShadow: color === c.value ? '0 0 0 2px #fff, 0 0 0 4px '+c.value : 'none',
                }}
              />
            ))}
          </div>

          {/* Icone */}
          <p style={{ fontSize:'11px', fontWeight:'700', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.06em', margin:'0 0 8px' }}>Icona</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:'4px' }}>
            {ICON_LIBRARY.map(icon => (
              <button key={icon.id} type="button"
                onClick={() => { onChangeIcon(icon.id); setOpen(false) }}
                title={icon.label}
                style={{
                  display:'flex', alignItems:'center', justifyContent:'center',
                  width:'36px', height:'36px', borderRadius:'6px',
                  border: value === icon.id ? `2px solid ${color}` : '1px solid transparent',
                  background: value === icon.id ? color+'15' : '#F9FAFB',
                  cursor:'pointer', color, transition:'all .12s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = color+'20' }}
                onMouseLeave={e => { e.currentTarget.style.background = value === icon.id ? color+'15' : '#F9FAFB' }}
              >
                <span style={{ width:'18px', height:'18px', display:'flex', alignItems:'center' }}>
                  {icon.svg}
                </span>
              </button>
            ))}
          </div>

          {/* Nessuna icona */}
          <button type="button" onClick={() => { onChangeIcon(''); setOpen(false) }}
            style={{ marginTop:'8px', width:'100%', padding:'7px', border:'1px dashed #E5E7EB', borderRadius:'6px', background:'#fff', cursor:'pointer', fontSize:'12px', color:'#9CA3AF', fontFamily:'Inter,sans-serif' }}>
            Nessuna icona
          </button>
        </div>,
        document.body
      )}
    </div>
  )
}

// ── Render SVG icona con colore per la pagina pubblica ─────────────
export function IconDisplay({ iconId, color = '#E11D48', size = 28 }) {
  const icon = ICON_LIBRARY.find(i => i.id === iconId)
  if (!icon) return null
  return (
    <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', color, width:size, height:size, flexShrink:0 }}>
      {icon.svg}
    </span>
  )
}
