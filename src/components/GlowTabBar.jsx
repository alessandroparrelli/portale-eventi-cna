import { useState, useEffect } from 'react'

function useMobile() {
  const [m, setM] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 769 : false
  )
  useEffect(() => {
    const fn = () => setM(window.innerWidth < 769)
    window.addEventListener('resize', fn, { passive: true })
    return () => window.removeEventListener('resize', fn)
  }, [])
  return m
}

const PALETTES = {
  blue:    { active: '#5B5FEF', bg: '#EEEFFD', text: '#5B5FEF' },
  crimisi: { active: '#5B5FEF', bg: '#EEEFFD', text: '#5B5FEF' },
  green:   { active: '#22C55E', bg: '#DCFCE7', text: '#16A34A' },
  violet:  { active: '#7C4DFF', bg: '#F3EEFF', text: '#7C4DFF' },
  amber:   { active: '#F59E0B', bg: '#FEF3C7', text: '#D97706' },
  cyan:    { active: '#38BDF8', bg: '#E0F2FE', text: '#0891B2' },
  coral:   { active: '#F97316', bg: '#FFF4EE', text: '#EA580C' },
  rose:    { active: '#F43F5E', bg: '#FFF1F3', text: '#E11D48' },
  teal:    { active: '#14B8A6', bg: '#F0FDFA', text: '#0F766E' },
}
const DEFAULT_COLORS = ['blue','green','violet','amber','cyan','coral','rose','teal']

function Tab({ t, isActive, color, onChange, mobile }) {
  const [hovered, setHovered] = useState(false)
  const p = PALETTES[color] || PALETTES.blue

  return (
    <button
      onClick={() => onChange(t.id)}
      onMouseEnter={() => !mobile && setHovered(true)}
      onMouseLeave={() => !mobile && setHovered(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: mobile ? '7px 14px' : '8px 16px',
        borderRadius: '10px', border: 'none',
        cursor: 'pointer',
        fontSize: mobile ? '14px' : '13px',
        fontWeight: isActive ? '600' : '500',
        fontFamily: "'Inter', sans-serif",
        whiteSpace: 'nowrap', outline: 'none', flexShrink: 0,
        transition: 'all 0.15s ease',
        backgroundColor: isActive ? p.bg : hovered ? '#F7F8FC' : 'transparent',
        color: isActive ? p.text : hovered ? '#374151' : '#6B7280',
        boxShadow: isActive ? `0 0 0 1px ${p.active}30` : 'none',
        transform: isActive ? 'none' : hovered ? 'translateY(-1px)' : 'none',
      }}
    >
      {t.icon && <span style={{ fontSize: 14, lineHeight: 1 }}>{t.icon}</span>}
      {t.label}
    </button>
  )
}

export default function GlowTabBar({ tabs = [], active, onChange }) {
  const mobile = useMobile()

  return (
    <div
      className="glow-tab-wrap"
      style={{
        display: 'flex',
        gap: mobile ? '2px' : '4px',
        padding: mobile ? '4px' : '4px',
        background: '#F0F2F7',
        borderRadius: '14px',
        marginBottom: mobile ? '14px' : '20px',
        flexWrap: 'nowrap',
        overflowX: mobile ? 'auto' : 'visible',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
      }}
    >
      {tabs.map((t, i) => {
        const color = t.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]
        return (
          <Tab
            key={t.id}
            t={t}
            isActive={active === t.id}
            color={color}
            onChange={onChange}
            mobile={mobile}
          />
        )
      })}
    </div>
  )
}
