import { useState } from 'react'

const PALETTES = {
  blue:   { from:'#003DA5', to:'#1a56db', glow:'rgba(0,61,165,.40)',   hint:'rgba(0,61,165,.09)',   text:'#003DA5' },
  green:  { from:'#059669', to:'#10b981', glow:'rgba(5,150,105,.40)',  hint:'rgba(5,150,105,.09)',  text:'#059669' },
  violet: { from:'#7c3aed', to:'#a78bfa', glow:'rgba(124,58,237,.40)', hint:'rgba(124,58,237,.09)', text:'#7c3aed' },
  amber:  { from:'#d97706', to:'#f59e0b', glow:'rgba(217,119,6,.40)',  hint:'rgba(217,119,6,.09)',  text:'#d97706' },
  cyan:   { from:'#0891b2', to:'#22d3ee', glow:'rgba(8,145,178,.40)',  hint:'rgba(8,145,178,.09)',  text:'#0891b2' },
  coral:  { from:'#e85d24', to:'#f97316', glow:'rgba(232,93,36,.40)',  hint:'rgba(232,93,36,.09)',  text:'#e85d24' },
  rose:   { from:'#be185d', to:'#ec4899', glow:'rgba(190,24,93,.40)',  hint:'rgba(190,24,93,.09)',  text:'#be185d' },
  teal:   { from:'#0f766e', to:'#14b8a6', glow:'rgba(15,118,110,.40)', hint:'rgba(15,118,110,.09)', text:'#0f766e' },
}
const DEFAULT_COLORS = ['blue','green','violet','amber','cyan','coral','rose','teal']

function Tab({ t, isActive, color, onChange }) {
  const p = PALETTES[color] || PALETTES.blue
  const [hovered, setHovered] = useState(false)

  const style = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: isActive ? '700' : '500',
    fontFamily: "'Inter', sans-serif",
    letterSpacing: '-0.01em',
    whiteSpace: 'nowrap',
    transition: 'all 0.18s cubic-bezier(.4,0,.2,1)',
    position: 'relative',
    outline: 'none',
    // stato
    background: isActive
      ? `linear-gradient(135deg, ${p.from}, ${p.to})`
      : hovered ? p.hint : 'transparent',
    color: isActive ? '#ffffff' : hovered ? p.text : '#6B7280',
    boxShadow: isActive
      ? `0 4px 18px ${p.glow}, 0 1px 4px rgba(0,0,0,.12)`
      : hovered
        ? `0 2px 8px ${p.hint}`
        : 'none',
    transform: isActive ? 'translateY(-1px)' : hovered ? 'translateY(-1px)' : 'none',
  }

  return (
    <button
      style={style}
      onClick={() => onChange(t.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {t.icon && (
        <span style={{ fontSize: 14, lineHeight: 1, filter: isActive ? 'brightness(10)' : 'none' }}>
          {t.icon}
        </span>
      )}
      {t.label}
    </button>
  )
}

export default function GlowTabBar({ tabs = [], active, onChange }) {
  return (
    <div style={{
      display: 'flex',
      gap: '5px',
      padding: '6px',
      background: 'linear-gradient(135deg, #F0F2F5, #E8EBF0)',
      borderRadius: '12px',
      marginBottom: '24px',
      flexWrap: 'wrap',
      boxShadow: 'inset 0 1px 3px rgba(0,0,0,.06)',
    }}>
      {tabs.map((t, i) => {
        const color = t.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]
        return (
          <Tab
            key={t.id}
            t={t}
            isActive={active === t.id}
            color={color}
            onChange={onChange}
          />
        )
      })}
    </div>
  )
}
