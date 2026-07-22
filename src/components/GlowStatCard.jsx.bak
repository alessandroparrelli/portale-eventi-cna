import { useState, useEffect } from 'react'

const PALETTES = {
  blue:   { accent:'#003DA5', bg:'#EEF3FF', num:'#003DA5', label:'#3B5EAE', border:'#003DA5' },
  green:  { accent:'#059669', bg:'#ECFDF5', num:'#059669', label:'#0B7A55', border:'#059669' },
  violet: { accent:'#7c3aed', bg:'#F5F3FF', num:'#7c3aed', label:'#6025C0', border:'#7c3aed' },
  amber:  { accent:'#d97706', bg:'#FFFBEB', num:'#b45309', label:'#92400E', border:'#d97706' },
  cyan:   { accent:'#0891b2', bg:'#ECFEFF', num:'#0e7490', label:'#155E75', border:'#0891b2' },
  coral:  { accent:'#e85d24', bg:'#FFF4EE', num:'#c2410c', label:'#9A3412', border:'#e85d24' },
  rose:   { accent:'#be185d', bg:'#FFF1F6', num:'#9d174d', label:'#831843', border:'#be185d' },
  teal:   { accent:'#0f766e', bg:'#F0FDFA', num:'#0f766e', label:'#115E59', border:'#0f766e' },
  red:    { accent:'#dc2626', bg:'#FEF2F2', num:'#b91c1c', label:'#991B1B', border:'#dc2626' },
}

const SVG_ICONS = {
  calendar: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  check:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>,
  users:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.87"/></svg>,
  trending: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  percent:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>,
  clock:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  star:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  activity: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  usercheck:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>,
  userx:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="17" y1="8" x2="23" y2="14"/><line x1="23" y1="8" x2="17" y2="14"/></svg>,
  qr:       <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3"/><path d="M17 17h4"/><path d="M17 21v-1"/><path d="M21 14v3"/></svg>,
  eye:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  globe:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
}

export default function GlowStatCard({ icon, label, value, sub, palette = 'blue', trend }) {
  const [hovered, setHovered] = useState(false)
  const p = PALETTES[palette] || PALETTES.blue
  const IconEl = typeof icon === 'string' ? SVG_ICONS[icon] : icon

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 14px',
        backgroundColor: hovered ? p.bg : '#ffffff',
        border: `1px solid ${hovered ? p.border + '40' : '#E5E7EB'}`,
        borderRadius: '8px',
        transition: 'all 0.15s ease',
        boxShadow: hovered
          ? `0 4px 12px ${p.accent}22, 0 1px 3px rgba(0,0,0,.06)`
          : '0 1px 3px rgba(0,0,0,.04)',
        transform: hovered ? 'translateY(-1px)' : 'none',
        cursor: 'default',
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
      {/* Icona */}
      <div style={{
        width: '28px', height: '28px', borderRadius: '6px',
        backgroundColor: p.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: p.accent, flexShrink: 0,
        transition: 'transform 0.2s',
        transform: hovered ? 'scale(1.1)' : 'scale(1)',
      }}>
        {IconEl}
      </div>

      {/* Valore + label */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{
            fontSize: '22px', fontWeight: '800',
            color: p.num, letterSpacing: '-0.03em',
            lineHeight: 1, fontFamily: "'Inter', sans-serif",
          }}>
            {value}
          </span>
          {trend != null && (
            <span style={{
              fontSize: '11px', fontWeight: '700',
              color: trend > 0 ? '#059669' : '#9CA3AF',
              backgroundColor: trend > 0 ? '#ECFDF5' : '#F9FAFB',
              padding: '1px 6px', borderRadius: '20px',
            }}>
              {trend > 0 ? `+${trend}` : trend} oggi
            </span>
          )}
        </div>
        <p style={{
          fontSize: '11px', fontWeight: '600',
          color: '#6B7280', margin: '1px 0 0',
          textTransform: 'uppercase', letterSpacing: '0.05em',
          fontFamily: "'Inter', sans-serif",
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {label}
        </p>
        {sub && (
          <p style={{
            fontSize: '11px', color: '#9CA3AF',
            margin: '1px 0 0', fontFamily: "'Inter', sans-serif",
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  )
}

export { SVG_ICONS, PALETTES }
