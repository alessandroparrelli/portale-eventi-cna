const ILLUSTRATIONS = {
  eventi: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="18" width="60" height="52" rx="8" fill="#EBF0FA" stroke="#003DA5" strokeWidth="1.5" strokeDasharray="4 3"/>
      <rect x="10" y="18" width="60" height="16" rx="8" fill="#003DA5" opacity="0.12"/>
      <line x1="10" y1="34" x2="70" y2="34" stroke="#003DA5" strokeWidth="1" opacity="0.3"/>
      <rect x="24" y="8" width="6" height="16" rx="3" fill="#003DA5" opacity="0.5"/>
      <rect x="50" y="8" width="6" height="16" rx="3" fill="#003DA5" opacity="0.5"/>
      <rect x="20" y="44" width="12" height="10" rx="3" fill="#003DA5" opacity="0.18"/>
      <rect x="34" y="44" width="12" height="10" rx="3" fill="#003DA5" opacity="0.18"/>
      <rect x="48" y="44" width="12" height="10" rx="3" fill="#003DA5" opacity="0.18"/>
      <rect x="20" y="57" width="12" height="10" rx="3" fill="#003DA5" opacity="0.1"/>
      <rect x="34" y="57" width="12" height="10" rx="3" fill="#003DA5" opacity="0.18"/>
    </svg>
  ),
  iscritti: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="28" r="14" fill="#EBF0FA" stroke="#003DA5" strokeWidth="1.5" strokeDasharray="4 3"/>
      <circle cx="40" cy="28" r="7" fill="#003DA5" opacity="0.2"/>
      <path d="M16 68c0-13.255 10.745-24 24-24s24 10.745 24 24" stroke="#003DA5" strokeWidth="1.5" strokeDasharray="4 3" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  checkin: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="15" y="15" width="22" height="22" rx="3" fill="#EBF0FA" stroke="#003DA5" strokeWidth="1.5"/>
      <rect x="21" y="21" width="10" height="10" rx="1" fill="#003DA5" opacity="0.3"/>
      <rect x="43" y="15" width="22" height="22" rx="3" fill="#EBF0FA" stroke="#003DA5" strokeWidth="1.5"/>
      <rect x="49" y="21" width="10" height="10" rx="1" fill="#003DA5" opacity="0.3"/>
      <rect x="15" y="43" width="22" height="22" rx="3" fill="#EBF0FA" stroke="#003DA5" strokeWidth="1.5"/>
      <rect x="21" y="49" width="10" height="10" rx="1" fill="#003DA5" opacity="0.3"/>
      <path d="M47 58l5 5 10-10" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  ),
  email: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="22" width="60" height="40" rx="8" fill="#EBF0FA" stroke="#003DA5" strokeWidth="1.5" strokeDasharray="4 3"/>
      <path d="M10 30l30 18 30-18" stroke="#003DA5" strokeWidth="1.5" opacity="0.5" fill="none"/>
    </svg>
  ),
  default: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="15" width="40" height="50" rx="6" fill="#EBF0FA" stroke="#003DA5" strokeWidth="1.5" strokeDasharray="4 3"/>
      <line x1="28" y1="30" x2="52" y2="30" stroke="#003DA5" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
      <line x1="28" y1="40" x2="52" y2="40" stroke="#003DA5" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
      <line x1="28" y1="50" x2="42" y2="50" stroke="#003DA5" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
    </svg>
  ),
}

export default function EmptyState({ type = 'default', title, description, action }) {
  const illustration = ILLUSTRATIONS[type] || ILLUSTRATIONS.default
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '56px 24px', gap: '16px', textAlign: 'center',
    }}>
      <div style={{ opacity: 0.85 }}>{illustration}</div>
      <div style={{ maxWidth: '320px' }}>
        <p style={{ fontSize: '15px', fontWeight: '600', color: '#111', margin: '0 0 6px', fontFamily:"'Outfit',sans-serif" }}>
          {title || 'Nessun elemento'}
        </p>
        {description && (
          <p style={{ fontSize: '13px', color: '#6B7280', margin: 0, lineHeight: 1.5, fontFamily:"'Outfit',sans-serif" }}>
            {description}
          </p>
        )}
      </div>
      {action && (
        <button onClick={action.onClick} style={{
          marginTop: '4px', display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '8px 18px', borderRadius: '8px', border: 'none',
          background: '#003DA5', color: '#fff', fontSize: '13px', fontWeight: '600',
          cursor: 'pointer', fontFamily:"'Outfit',sans-serif",
        }}>
          {action.label}
        </button>
      )}
    </div>
  )
}
