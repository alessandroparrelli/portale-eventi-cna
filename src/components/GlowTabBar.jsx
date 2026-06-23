/**
 * GlowTabBar — tab colorate con sfumatura + bagliore al passaggio del mouse
 *
 * Props:
 *   tabs: [{ id, label, icon?: ReactNode, color?: 'blue'|'green'|'violet'|'amber'|'cyan'|'coral'|'rose' }]
 *   active: string (id corrente)
 *   onChange: (id) => void
 *   variant?: 'pill' (default) | 'slim'
 */

const DEFAULT_COLORS = [
  'blue', 'green', 'violet', 'amber', 'cyan', 'coral', 'rose',
]

export default function GlowTabBar({ tabs = [], active, onChange, variant = 'pill' }) {
  if (variant === 'slim') {
    return (
      <div className="slim-tab-bar">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`slim-tab${active === t.id ? ' active' : ''}`}
          >
            {t.icon && <span style={{ marginRight: 6, opacity: 0.8 }}>{t.icon}</span>}
            {t.label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="glow-tab-bar">
      {tabs.map((t, i) => {
        const color = t.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]
        const isActive = active === t.id
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`glow-tab ${isActive ? `active-${color}` : `hint-${color}`}`}
          >
            {t.icon && <span style={{ fontSize: 15, lineHeight: 1 }}>{t.icon}</span>}
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
