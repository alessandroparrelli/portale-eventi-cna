import { X } from 'lucide-react'

// ---- MODAL ----
export function Modal({ title, onClose, children, width = '560px' }) {
  return (
    <div style={modal.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...modal.box, maxWidth: width }}>
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
  bozza:      { bg: '#F3F4F6', text: '#6B7280' },
  pubblicato: { bg: '#DCFCE7', text: '#16A34A' },
  chiuso:     { bg: '#FEF3C7', text: '#D97706' },
  archiviato: { bg: '#F3F4F6', text: '#9CA3AF' },
}
const STATO_LABELS = { bozza:'Bozza', pubblicato:'Pubblicato', chiuso:'Chiuso', archiviato:'Archiviato' }

export function StatoBadge({ stato }) {
  const c = STATO_COLORS[stato] || STATO_COLORS.bozza
  return (
    <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 10px', borderRadius:'20px',
      fontSize:'12px', fontWeight:'600', backgroundColor:c.bg, color:c.text }}>
      {STATO_LABELS[stato] || stato}
    </span>
  )
}

// ---- BADGE RUOLO ----
const RUOLO_COLORS = {
  admin:       { bg: '#FEE4E6', text: '#E11D48' },
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
  presente:   { bg:'#DCFCE7', text:'#16A34A' },
  confermato: { bg:'#DBEAFE', text:'#2563EB' },
  assente:    { bg:'#FEE2E2', text:'#DC2626' },
  'walk-in':  { bg:'#F3E8FF', text:'#7C3AED' },
}
export function PresenzaBadge({ stato }) {
  const c = PRES_COLORS[stato] || PRES_COLORS.confermato
  return (
    <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 10px', borderRadius:'20px',
      fontSize:'12px', fontWeight:'600', backgroundColor:c.bg, color:c.text, textTransform:'capitalize' }}>
      {stato}
    </span>
  )
}

// ---- INPUT FIELD ----
export function Field({ label, required, error, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
      <label style={{ fontSize:'13px', fontWeight:'500', color:'#0A0A0A' }}>
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
      style={{ padding:'9px 12px', border:'1px solid #D1D5DB', borderRadius:'4px',
        fontSize:'14px', fontFamily:"'Outfit',sans-serif", color:'#0A0A0A', outline:'none',
        backgroundColor: disabled ? '#F9FAFB' : '#FFFFFF', ...style }}
      onFocus={e => !disabled && (e.target.style.borderColor='#E11D48')}
      onBlur={e => (e.target.style.borderColor='#D1D5DB')}
    />
  )
}

export function Select({ value, onChange, children, disabled=false }) {
  return (
    <select value={value} onChange={onChange} disabled={disabled}
      style={{ padding:'9px 12px', border:'1px solid #D1D5DB', borderRadius:'4px',
        fontSize:'14px', fontFamily:"'Outfit',sans-serif", color:'#0A0A0A', outline:'none',
        backgroundColor: disabled ? '#F9FAFB' : '#FFFFFF', cursor: disabled ? 'not-allowed' : 'pointer' }}
      onFocus={e => !disabled && (e.target.style.borderColor='#E11D48')}
      onBlur={e => (e.target.style.borderColor='#D1D5DB')}>
      {children}
    </select>
  )
}

export function Textarea({ value, onChange, placeholder, rows=4 }) {
  return (
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      style={{ padding:'9px 12px', border:'1px solid #D1D5DB', borderRadius:'4px',
        fontSize:'14px', fontFamily:"'Outfit',sans-serif", color:'#0A0A0A', outline:'none',
        resize:'vertical' }}
      onFocus={e => (e.target.style.borderColor='#E11D48')}
      onBlur={e => (e.target.style.borderColor='#D1D5DB')} />
  )
}

// ---- BTN ----
export function Btn({ onClick, children, variant='primary', size='md', disabled=false, style={} }) {
  const base = { display:'flex', alignItems:'center', gap:'6px', border:'none', borderRadius:'4px',
    fontFamily:"'Outfit',sans-serif", fontWeight:'700', cursor: disabled ? 'not-allowed' : 'pointer',
    transition:'opacity 0.15s', opacity: disabled ? 0.6 : 1, whiteSpace:'nowrap',
    padding: size==='sm' ? '6px 12px' : size==='lg' ? '12px 24px' : '9px 16px',
    fontSize: size==='sm' ? '13px' : '14px',
  }
  const variants = {
    primary:   { backgroundColor:'#E11D48', color:'#FFFFFF' },
    secondary: { backgroundColor:'transparent', color:'#E11D48', border:'1px solid #E11D48' },
    danger:    { backgroundColor:'#DC2626', color:'#FFFFFF' },
    ghost:     { backgroundColor:'transparent', color:'#6B7280', border:'1px solid #E5E7EB' },
  }
  return <button onClick={!disabled ? onClick : undefined} style={{ ...base, ...variants[variant], ...style }}>{children}</button>
}

// ---- EMPTY STATE ----
export function EmptyState({ icon: Icon, title, desc, action }) {
  return (
    <div style={{ padding:'64px 32px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center' }}>
      <div style={{ width:'56px', height:'56px', backgroundColor:'#F3F4F6', borderRadius:'12px',
        display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'16px' }}>
        <Icon size={28} style={{ color:'#9CA3AF' }} />
      </div>
      <p style={{ fontSize:'16px', fontWeight:'700', color:'#0A0A0A', margin:'0 0 6px', letterSpacing:'-0.02em' }}>{title}</p>
      <p style={{ fontSize:'14px', color:'#6B7280', margin:'0 0 20px' }}>{desc}</p>
      {action}
    </div>
  )
}

// Modal styles
const modal = {
  overlay: { position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.4)', display:'flex',
    alignItems:'center', justifyContent:'center', zIndex:1000, padding:'24px' },
  box: { backgroundColor:'#FFFFFF', borderRadius:'8px', width:'100%',
    boxShadow:'0 20px 60px rgba(0,0,0,0.15)', display:'flex', flexDirection:'column',
    maxHeight:'90vh', overflow:'hidden' },
  header: { display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'20px 24px', borderBottom:'1px solid #E5E7EB', flexShrink:0 },
  title: { fontSize:'18px', fontWeight:'700', color:'#0A0A0A', letterSpacing:'-0.02em', margin:0 },
  closeBtn: { background:'none', border:'none', cursor:'pointer', color:'#6B7280', display:'flex',
    alignItems:'center', padding:'4px' },
  body: { padding:'24px', overflowY:'auto' },
}
