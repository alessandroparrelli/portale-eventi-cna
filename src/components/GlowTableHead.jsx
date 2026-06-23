/**
 * GlowTableHead — header tabella con colori sfumati e testo a contrasto
 *
 * Uso:
 *   <GlowTableHead
 *     columns={[
 *       { label: 'Nome',   icon: <SvgIcon/>, color: 'blue'   },
 *       { label: 'Stato',  icon: <SvgIcon/>, color: 'green'  },
 *       { label: 'Azioni',                   color: 'neutral' },
 *     ]}
 *   />
 */

const HEADER_PALETTES = {
  blue:    { from: '#003DA5', to: '#1a56db', text: '#ffffff', icon: '#93c5fd' },
  green:   { from: '#059669', to: '#10b981', text: '#ffffff', icon: '#6ee7b7' },
  violet:  { from: '#7c3aed', to: '#8b5cf6', text: '#ffffff', icon: '#c4b5fd' },
  amber:   { from: '#d97706', to: '#f59e0b', text: '#ffffff', icon: '#fde68a' },
  cyan:    { from: '#0891b2', to: '#06b6d4', text: '#ffffff', icon: '#a5f3fc' },
  coral:   { from: '#e85d24', to: '#f97316', text: '#ffffff', icon: '#fed7aa' },
  rose:    { from: '#be185d', to: '#ec4899', text: '#ffffff', icon: '#fbcfe8' },
  teal:    { from: '#0f766e', to: '#14b8a6', text: '#ffffff', icon: '#99f6e4' },
  neutral: { from: '#F9FAFB', to: '#F3F4F6', text: '#6B7280', icon: '#9CA3AF' },
  dark:    { from: '#1F2937', to: '#374151', text: '#ffffff', icon: '#9CA3AF' },
}

const DEFAULT_COLORS = ['blue', 'green', 'violet', 'amber', 'cyan', 'coral']

export default function GlowTableHead({ columns = [] }) {
  return (
    <thead>
      <tr>
        {columns.map((col, i) => {
          const colorKey = col.color || (col.color === 'neutral' ? 'neutral' : DEFAULT_COLORS[i % DEFAULT_COLORS.length])
          const p = HEADER_PALETTES[colorKey] || HEADER_PALETTES.blue
          return (
            <th
              key={i}
              style={{
                padding: '10px 16px',
                textAlign: col.align || 'left',
                background: `linear-gradient(135deg, ${p.from}, ${p.to})`,
                color: p.text,
                fontSize: '11px',
                fontWeight: '700',
                fontFamily: "'Inter', sans-serif",
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                whiteSpace: 'nowrap',
                borderBottom: 'none',
                width: col.width || undefined,
              }}
            >
              {col.icon || col.label ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {col.icon && (
                    <span style={{ color: p.icon, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                      {col.icon}
                    </span>
                  )}
                  {col.label}
                </div>
              ) : null}
            </th>
          )
        })}
      </tr>
    </thead>
  )
}
