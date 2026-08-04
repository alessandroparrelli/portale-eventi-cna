import { useState } from 'react'

const PALETTES = {
  crimisi: { accent:'#5B5FEF', bg:'#EEEFFD', num:'#5B5FEF', border:'#5B5FEF' },
  blue:    { accent:'#5B5FEF', bg:'#EEEFFD', num:'#5B5FEF', border:'#5B5FEF' },
  green:   { accent:'#22C55E', bg:'#DCFCE7', num:'#16A34A', border:'#22C55E' },
  violet:  { accent:'#7C4DFF', bg:'#F3EEFF', num:'#7C4DFF', border:'#7C4DFF' },
  amber:   { accent:'#F59E0B', bg:'#FEF3C7', num:'#D97706', border:'#F59E0B' },
  cyan:    { accent:'#38BDF8', bg:'#E0F2FE', num:'#0891B2', border:'#38BDF8' },
  coral:   { accent:'#F97316', bg:'#FFF4EE', num:'#EA580C', border:'#F97316' },
  rose:    { accent:'#F43F5E', bg:'#FFF1F3', num:'#E11D48', border:'#F43F5E' },
  teal:    { accent:'#14B8A6', bg:'#F0FDFA', num:'#0F766E', border:'#14B8A6' },
  red:     { accent:'#EF4444', bg:'#FEE2E2', num:'#DC2626', border:'#EF4444' },
}

const SVG_ICONS = {
  calendar:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  check:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>,
  users:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.87"/></svg>,
  trending:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  percent:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>,
  clock:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  star:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  activity:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  usercheck: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>,
  userx:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="17" y1="8" x2="23" y2="14"/><line x1="23" y1="8" x2="17" y2="14"/></svg>,
  qr:        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3"/><path d="M17 17h4"/><path d="M17 21v-1"/><path d="M21 14v3"/></svg>,
  eye:       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  globe:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
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
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '14px 16px',
        backgroundColor: '#FFFFFF',
        border: `1px solid ${hovered ? p.accent + '30' : '#E8ECF4'}`,
        borderRadius: '16px',
        transition: 'all 0.18s ease',
        boxShadow: hovered
          ? `0 8px 24px ${p.accent}18, 0 2px 8px rgba(0,0,0,.06)`
          : '0 1px 4px rgba(20,20,40,.05)',
        transform: hovered ? 'translateY(-2px)' : 'none',
        cursor: 'default', minWidth: 0, overflow: 'hidden',
      }}
    >
      <div style={{
        width: '40px', height: '40px', borderRadius: '16px',
        backgroundColor: p.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: p.accent, flexShrink: 0,
        transition: 'transform 0.18s',
        transform: hovered ? 'scale(1.08)' : 'scale(1)',
      }}>
        {IconEl}
      </div>

      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{
            fontSize: '24px', fontWeight: '700',
            color: p.num, letterSpacing: '-0.04em', lineHeight: 1,
            fontFamily: "'Inter', sans-serif",
          }}>
            {value}
          </span>
          {trend != null && (
            <span style={{
              fontSize: '11px', fontWeight: '600',
              color: trend > 0 ? '#16A34A' : '#9CA3AF',
              backgroundColor: trend > 0 ? '#DCFCE7' : '#F9FAFB',
              padding: '1px 7px', borderRadius: '20px',
            }}>
              {trend > 0 ? `+${trend}` : trend} oggi
            </span>
          )}
        </div>
        <p style={{
          fontSize: '12px', fontWeight: '500', color: '#6B7280',
          margin: '3px 0 0', letterSpacing: '0.01em',
          fontFamily: "'Inter', sans-serif",
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {label}
        </p>
        {sub && (
          <p style={{
            fontSize: '11px', color: '#9CA3AF', margin: '1px 0 0',
            fontFamily: "'Inter', sans-serif",
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
