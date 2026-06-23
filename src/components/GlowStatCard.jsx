/**
 * GlowStatCard — card statistica con sfumatura colorata, numero grande, label, sottotitolo
 * Palette: blue | green | violet | amber | cyan | coral | rose | teal | red
 */

const PALETTES = {
  blue:   { from:'#003DA5', to:'#1a56db', icon:'rgba(147,197,253,.35)', num:'#ffffff', label:'rgba(255,255,255,.75)', sub:'rgba(255,255,255,.6)',  glow:'rgba(0,61,165,.30)',   badge:'rgba(255,255,255,.18)' },
  green:  { from:'#059669', to:'#10b981', icon:'rgba(110,231,183,.35)', num:'#ffffff', label:'rgba(255,255,255,.75)', sub:'rgba(255,255,255,.6)',  glow:'rgba(5,150,105,.30)',  badge:'rgba(255,255,255,.18)' },
  violet: { from:'#6d28d9', to:'#8b5cf6', icon:'rgba(196,181,253,.35)', num:'#ffffff', label:'rgba(255,255,255,.75)', sub:'rgba(255,255,255,.6)',  glow:'rgba(109,40,217,.30)', badge:'rgba(255,255,255,.18)' },
  amber:  { from:'#b45309', to:'#d97706', icon:'rgba(253,230,138,.35)', num:'#ffffff', label:'rgba(255,255,255,.75)', sub:'rgba(255,255,255,.6)',  glow:'rgba(180,83,9,.30)',   badge:'rgba(255,255,255,.18)' },
  cyan:   { from:'#0e7490', to:'#0891b2', icon:'rgba(165,243,252,.35)', num:'#ffffff', label:'rgba(255,255,255,.75)', sub:'rgba(255,255,255,.6)',  glow:'rgba(14,116,144,.30)', badge:'rgba(255,255,255,.18)' },
  coral:  { from:'#c2410c', to:'#ea580c', icon:'rgba(254,215,170,.35)', num:'#ffffff', label:'rgba(255,255,255,.75)', sub:'rgba(255,255,255,.6)',  glow:'rgba(194,65,12,.30)',  badge:'rgba(255,255,255,.18)' },
  rose:   { from:'#9d174d', to:'#be185d', icon:'rgba(251,207,232,.35)', num:'#ffffff', label:'rgba(255,255,255,.75)', sub:'rgba(255,255,255,.6)',  glow:'rgba(157,23,77,.30)',  badge:'rgba(255,255,255,.18)' },
  teal:   { from:'#0f766e', to:'#0d9488', icon:'rgba(153,246,228,.35)', num:'#ffffff', label:'rgba(255,255,255,.75)', sub:'rgba(255,255,255,.6)',  glow:'rgba(15,118,110,.30)', badge:'rgba(255,255,255,.18)' },
  red:    { from:'#b91c1c', to:'#dc2626', icon:'rgba(254,202,202,.35)', num:'#ffffff', label:'rgba(255,255,255,.75)', sub:'rgba(255,255,255,.6)',  glow:'rgba(185,28,28,.30)',  badge:'rgba(255,255,255,.18)' },
}

// Icone SVG inline pre-definite
const SVG_ICONS = {
  calendar: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  check: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/>
    </svg>
  ),
  users: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.87"/>
    </svg>
  ),
  trending: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
    </svg>
  ),
  percent: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="5" x2="5" y2="19"/>
      <circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>
    </svg>
  ),
  clock: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  star: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  activity: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  usercheck: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>
    </svg>
  ),
  userx: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/><line x1="17" y1="8" x2="23" y2="14"/>
      <line x1="23" y1="8" x2="17" y2="14"/>
    </svg>
  ),
  qr: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <path d="M14 14h3v3"/><path d="M17 17h4"/><path d="M17 21v-1"/><path d="M21 14v3"/>
    </svg>
  ),
}

export default function GlowStatCard({ icon, label, value, sub, palette = 'blue', trend }) {
  const p = PALETTES[palette] || PALETTES.blue
  const IconEl = typeof icon === 'string' ? SVG_ICONS[icon] : icon

  return (
    <div style={{
      background: `linear-gradient(135deg, ${p.from} 0%, ${p.to} 100%)`,
      borderRadius: '12px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      boxShadow: `0 4px 20px ${p.glow}, 0 1px 4px rgba(0,0,0,.08)`,
      position: 'relative',
      overflow: 'hidden',
      minWidth: 0,
    }}>
      {/* Cerchio decorativo sfondo */}
      <div style={{
        position: 'absolute', right: '-16px', top: '-16px',
        width: '88px', height: '88px', borderRadius: '50%',
        backgroundColor: 'rgba(255,255,255,.10)',
        pointerEvents: 'none',
      }}/>
      <div style={{
        position: 'absolute', right: '18px', bottom: '-22px',
        width: '56px', height: '56px', borderRadius: '50%',
        backgroundColor: 'rgba(255,255,255,.07)',
        pointerEvents: 'none',
      }}/>

      {/* Top row: icona + trend badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '10px',
          backgroundColor: p.icon,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#ffffff', flexShrink: 0,
        }}>
          {IconEl}
        </div>
        {trend != null && (
          <div style={{
            fontSize: '11px', fontWeight: '700',
            backgroundColor: p.badge,
            color: '#ffffff',
            padding: '3px 8px', borderRadius: '20px',
            whiteSpace: 'nowrap',
          }}>
            {trend > 0 ? `+${trend}` : trend} oggi
          </div>
        )}
      </div>

      {/* Valore */}
      <div>
        <p style={{
          fontSize: '36px', fontWeight: '900',
          color: p.num, margin: 0,
          letterSpacing: '-0.04em', lineHeight: 1,
          fontFamily: "'Inter', sans-serif",
        }}>
          {value}
        </p>
        <p style={{
          fontSize: '12px', fontWeight: '600',
          color: p.label, margin: '6px 0 0',
          textTransform: 'uppercase', letterSpacing: '0.05em',
          fontFamily: "'Inter', sans-serif",
        }}>
          {label}
        </p>
        {sub && (
          <p style={{
            fontSize: '12px', color: p.sub,
            margin: '3px 0 0',
            fontFamily: "'Inter', sans-serif",
          }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  )
}

export { SVG_ICONS, PALETTES }
