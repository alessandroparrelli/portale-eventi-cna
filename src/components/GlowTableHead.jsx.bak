/**
 * GlowTableHead — header tabella con gradiente CNA blu unico su tutta la riga.
 * Gradiente fisso: #003DA5 → #001a4d (blu CNA → blu scuro)
 */

export default function GlowTableHead({ columns = [] }) {
  return (
    <thead>
      <tr style={{ background: 'linear-gradient(90deg, #003DA5 0%, #001a4d 100%)' }}>
        {columns.map((col, i) => (
          <th
            key={i}
            className={col.hideOnMobile ? 'col-hide-mobile' : undefined}
            style={{
              padding: '10px 16px',
              textAlign: col.align || 'left',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: '700',
              fontFamily: "'Outfit', sans-serif",
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              whiteSpace: 'nowrap',
              borderBottom: 'none',
              width: col.width || undefined,
              background: 'transparent',
            }}
          >
            {col.icon || col.label ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {col.icon && (
                  <span style={{ color: '#93c5fd', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    {col.icon}
                  </span>
                )}
                {col.label}
              </div>
            ) : null}
          </th>
        ))}
      </tr>
    </thead>
  )
}
