import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'

// ---- MODAL ----
const MODAL_ANIM_CSS = `
@keyframes _modal-in{from{opacity:0;transform:translateY(-10px) scale(0.98)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes _overlay-in{from{opacity:0}to{opacity:1}}
._modal-overlay{animation:_overlay-in 0.18s ease}
._modal-box{animation:_modal-in 0.2s cubic-bezier(0.34,1.1,0.64,1)}
`

let _modalStyleInjected = false

export function Modal({ title, onClose, children, width = '560px' }) {
  if (!_modalStyleInjected) {
    const s = document.createElement('style')
    s.textContent = MODAL_ANIM_CSS
    document.head.appendChild(s)
    _modalStyleInjected = true
  }

  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="_modal-overlay" style={modal.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="_modal-box" style={{ ...modal.box, maxWidth: width }}>
        <div style={modal.header}>
          <h2 style={modal.title}>{title}</h2>
          <button style={modal.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>
        <div style={modal.body}>{children}</div>
      </div>
    </div>
  )
}

// ---- BADGE STATO EVENTO ----
const STATO_COLORS = {
  bozza:      { bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF', pulse: false },
  pubblicato: { bg: '#DCFCE7', text: '#16A34A', dot: '#16A34A', pulse: true  },
  chiuso:     { bg: '#FEF3C7', text: '#D97706', dot: '#D97706', pulse: false },
  archiviato: { bg: '#F3F4F6', text: '#9CA3AF', dot: '#D1D5DB', pulse: false },
}
const STATO_LABELS = { bozza:'Bozza', pubblicato:'Pubblicato', chiuso:'Chiuso', archiviato:'Archiviato' }

export function StatoBadge({ stato }) {
  const c = STATO_COLORS[stato] || STATO_COLORS.bozza
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'3px 10px', borderRadius:'20px',
      fontSize:'12px', fontWeight:'600', backgroundColor:c.bg, color:c.text }}>
      <span style={{ position:'relative', display:'inline-flex', alignItems:'center', justifyContent:'center', width:'7px', height:'7px', flexShrink:0 }}>
        {c.pulse && (
          <span style={{
            position:'absolute', inset:'-3px', borderRadius:'50%',
            backgroundColor: c.dot, opacity:0.35,
            animation:'stato-pulse 1.8s ease-in-out infinite',
          }}/>
        )}
        <svg width="7" height="7" viewBox="0 0 7 7" style={{ flexShrink:0, position:'relative' }}>
          <circle cx="3.5" cy="3.5" r="3.5" fill={c.dot}/>
        </svg>
      </span>
      {STATO_LABELS[stato] || stato}
    </span>
  )
}

// ---- BADGE RUOLO ----
const RUOLO_COLORS = {
  admin:       { bg: '#EEEFFD', text: '#5B5FEF' },
  supervisore: { bg: '#FEF3C7', text: '#D97706' },
  utente:      { bg: '#F3F4F6', text: '#6B7280' },
}
export function RuoloBadge({ ruolo }) {
  const c = RUOLO_COLORS[ruolo] || RUOLO_COLORS.utente
  return (
    <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 10px', borderRadius:'20px',
      fontSize:'12px', fontWeight:'600', backgroundColor:c.bg, color:c.text, textTransform:'capitalize' }}>
      {ruolo}
    </span>
  )
}

// ---- BADGE PRESENZA ----
const PRES_COLORS = {
  presente:   { bg:'#DCFCE7', text:'#16A34A', dot:'#16A34A', pulse:true  },
  confermato: { bg:'#DBEAFE', text:'#2563EB', dot:'#2563EB', pulse:false },
  assente:    { bg:'#FEE2E2', text:'#DC2626', dot:'#DC2626', pulse:false },
  'walk-in':  { bg:'#F3E8FF', text:'#7C3AED', dot:'#7C3AED', pulse:false },
}
export function PresenzaBadge({ stato }) {
  const c = PRES_COLORS[stato] || PRES_COLORS.confermato
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'3px 10px', borderRadius:'20px',
      fontSize:'12px', fontWeight:'600', backgroundColor:c.bg, color:c.text, textTransform:'capitalize' }}>
      <span style={{ position:'relative', display:'inline-flex', alignItems:'center', justifyContent:'center', width:'7px', height:'7px', flexShrink:0 }}>
        {c.pulse && (
          <span style={{
            position:'absolute', inset:'-3px', borderRadius:'50%',
            backgroundColor: c.dot, opacity:0.35,
            animation:'stato-pulse 1.8s ease-in-out infinite',
          }}/>
        )}
        <svg width="7" height="7" viewBox="0 0 7 7" style={{ flexShrink:0, position:'relative' }}>
          <circle cx="3.5" cy="3.5" r="3.5" fill={c.dot}/>
        </svg>
      </span>
      {stato}
    </span>
  )
}

// ---- INPUT FIELD ----
export function Field({ label, required, error, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
      <label style={{ fontSize:'13px', fontWeight:'500', color:'#111827' }}>
        {label}{required && <span style={{ color:'#DC2626' }}> *</span>}
      </label>
      {children}
      {error && <span style={{ fontSize:'12px', color:'#DC2626' }}>{error}</span>}
    </div>
  )
}

export function Input({ value, onChange, placeholder, type='text', disabled=false, style={} }) {
  return (
    <input
      type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
      style={{ padding:'9px 12px', border:'1px solid #E8ECF4', borderRadius:'20px',
        fontSize:'14px', fontFamily:"'Inter',sans-serif", color:'#111827', outline:'none',
        backgroundColor: disabled ? '#F9FAFB' : '#FFFFFF', ...style }}
      onFocus={e => !disabled && (e.target.style.borderColor='#5B5FEF')}
      onBlur={e => (e.target.style.borderColor='#D1D5DB')}
    />
  )
}

export function Select({ value, onChange, children, disabled=false }) {
  return (
    <select value={value} onChange={onChange} disabled={disabled}
      style={{ padding:'9px 12px', border:'1px solid #E8ECF4', borderRadius:'20px',
        fontSize:'14px', fontFamily:"'Inter',sans-serif", color:'#111827', outline:'none',
        backgroundColor: disabled ? '#F9FAFB' : '#FFFFFF', cursor: disabled ? 'not-allowed' : 'pointer' }}
      onFocus={e => !disabled && (e.target.style.borderColor='#5B5FEF')}
      onBlur={e => (e.target.style.borderColor='#D1D5DB')}>
      {children}
    </select>
  )
}

export function Textarea({ value, onChange, placeholder, rows=4 }) {
  return (
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      style={{ padding:'9px 12px', border:'1px solid #E8ECF4', borderRadius:'20px',
        fontSize:'14px', fontFamily:"'Inter',sans-serif", color:'#111827', outline:'none',
        resize:'vertical' }}
      onFocus={e => (e.target.style.borderColor='#5B5FEF')}
      onBlur={e => (e.target.style.borderColor='#D1D5DB')} />
  )
}

// ---- BTN ----
export function Btn({ onClick, children, variant='primary', size='md', disabled=false, style={} }) {
  const base = { display:'flex', alignItems:'center', gap:'6px', border:'none', borderRadius:'20px',
    fontFamily:"'Inter',sans-serif", fontWeight:'700', cursor: disabled ? 'not-allowed' : 'pointer',
    transition:'opacity 0.15s', opacity: disabled ? 0.6 : 1, whiteSpace:'nowrap',
    padding: size==='sm' ? '6px 12px' : size==='lg' ? '12px 24px' : '9px 16px',
    fontSize: size==='sm' ? '13px' : '14px',
  }
  const variants = {
    primary:   { backgroundColor:'#5B5FEF', color:'#FFFFFF' },
    secondary: { backgroundColor:'transparent', color:'#5B5FEF', border:'1px solid #5B5FEF' },
    danger:    { backgroundColor:'#DC2626', color:'#FFFFFF' },
    ghost:     { backgroundColor:'transparent', color:'#6B7280', border:'1px solid #E8ECF4' },
  }
  return <button onClick={!disabled ? onClick : undefined} style={{ ...base, ...variants[variant], ...style }}>{children}</button>
}

// ---- EMPTY STATE ----
const EMPTY_ILLUSTRATIONS = {
  CalendarDays: (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none"><rect x="8" y="16" width="56" height="48" rx="8" fill="#EEEFFD" stroke="#5B5FEF" strokeWidth="1.5" strokeDasharray="4 3"/><rect x="8" y="16" width="56" height="15" rx="8" fill="#5B5FEF" opacity="0.1"/><line x1="8" y1="31" x2="64" y2="31" stroke="#5B5FEF" strokeWidth="1" opacity="0.25"/><rect x="20" y="8" width="6" height="14" rx="3" fill="#5B5FEF" opacity="0.45"/><rect x="46" y="8" width="6" height="14" rx="3" fill="#5B5FEF" opacity="0.45"/><rect x="16" y="40" width="10" height="9" rx="3" fill="#5B5FEF" opacity="0.15"/><rect x="31" y="40" width="10" height="9" rx="3" fill="#5B5FEF" opacity="0.15"/><rect x="46" y="40" width="10" height="9" rx="3" fill="#5B5FEF" opacity="0.15"/><rect x="16" y="52" width="10" height="9" rx="3" fill="#5B5FEF" opacity="0.08"/><rect x="31" y="52" width="10" height="9" rx="3" fill="#5B5FEF" opacity="0.15"/></svg>
  ),
  Users: (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none"><circle cx="36" cy="26" r="14" fill="#EEEFFD" stroke="#5B5FEF" strokeWidth="1.5" strokeDasharray="4 3"/><circle cx="36" cy="26" r="7" fill="#5B5FEF" opacity="0.18"/><path d="M12 64c0-13.255 10.745-24 24-24s24 10.745 24 24" stroke="#5B5FEF" strokeWidth="1.5" strokeDasharray="4 3" strokeLinecap="round" fill="none"/></svg>
  ),
  Mail: (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none"><rect x="8" y="20" width="56" height="38" rx="8" fill="#EEEFFD" stroke="#5B5FEF" strokeWidth="1.5" strokeDasharray="4 3"/><path d="M8 28l28 18 28-18" stroke="#5B5FEF" strokeWidth="1.5" opacity="0.45" fill="none"/></svg>
  ),
  MessageSquare: (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none"><rect x="8" y="12" width="56" height="40" rx="8" fill="#EEEFFD" stroke="#5B5FEF" strokeWidth="1.5" strokeDasharray="4 3"/><path d="M20 60l8-8h36a8 8 0 0 0 0-16H20" stroke="#5B5FEF" strokeWidth="1.5" strokeDasharray="4 3" strokeLinecap="round" fill="none" opacity="0.5"/><line x1="20" y1="28" x2="52" y2="28" stroke="#5B5FEF" strokeWidth="1.5" strokeLinecap="round" opacity="0.35"/><line x1="20" y1="38" x2="44" y2="38" stroke="#5B5FEF" strokeWidth="1.5" strokeLinecap="round" opacity="0.35"/></svg>
  ),
  Activity: (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none"><rect x="8" y="8" width="56" height="56" rx="8" fill="#EEEFFD" stroke="#5B5FEF" strokeWidth="1.5" strokeDasharray="4 3"/><polyline points="14,44 24,28 34,48 44,20 54,36 60,36" stroke="#5B5FEF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.5"/></svg>
  ),
}
const EMPTY_DEFAULT_ICON = (
  <svg width="72" height="72" viewBox="0 0 72 72" fill="none"><rect x="18" y="12" width="36" height="48" rx="6" fill="#EEEFFD" stroke="#5B5FEF" strokeWidth="1.5" strokeDasharray="4 3"/><line x1="26" y1="28" x2="46" y2="28" stroke="#5B5FEF" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/><line x1="26" y1="38" x2="46" y2="38" stroke="#5B5FEF" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/><line x1="26" y1="48" x2="38" y2="48" stroke="#5B5FEF" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/></svg>
)

export function EmptyState({ icon: Icon, title, desc, action }) {
  const iconName = Icon?.displayName || Icon?.name || ''
  const illustration = EMPTY_ILLUSTRATIONS[iconName] || EMPTY_DEFAULT_ICON
  return (
    <div style={{ padding:'64px 32px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
      <div style={{ marginBottom:'12px', opacity:0.9 }}>{illustration}</div>
      <p style={{ fontSize:'16px', fontWeight:'700', color:'#111827', margin:'0 0 6px', letterSpacing:'-0.02em' }}>{title}</p>
      <p style={{ fontSize:'14px', color:'#6B7280', margin:'0 0 20px' }}>{desc}</p>
      {action}
    </div>
  )
}

// Modal styles
const modal = {
  overlay: { position:'fixed', inset:0, backgroundColor:'rgba(17,24,39,0.4)', backdropFilter:'blur(4px)', WebkitBackdropFilter:'blur(4px)', display:'flex',
    alignItems:'center', justifyContent:'center', zIndex:1000, padding:'24px' },
  box: { backgroundColor:'#FFFFFF', borderRadius:'20px', width:'100%',
    boxShadow:'0 20px 60px rgba(0,0,0,0.15)', display:'flex', flexDirection:'column',
    maxHeight:'90vh', overflow:'hidden' },
  header: { display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'20px 24px', borderBottom:'1px solid #E8ECF4', flexShrink:0 },
  title: { fontSize:'18px', fontWeight:'700', color:'#111827', letterSpacing:'-0.02em', margin:0 },
  closeBtn: { background:'none', border:'none', cursor:'pointer', color:'#6B7280', display:'flex',
    alignItems:'center', padding:'4px' },
  body: { padding:'24px', overflowY:'auto' },
}
