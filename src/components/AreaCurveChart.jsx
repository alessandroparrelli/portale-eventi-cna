import { useState, useId } from 'react'

// Grafico a curva morbida con area sfumata (stile "Iscrizioni - 7 giorni" della dashboard).
// series: [{ name, color, values: number[] }]  labels: string[] (una per punto)
// tips: string[] opzionale (titolo del tooltip per punto)
export default function AreaCurveChart({ series, labels, tips, height = 200, maxLabels = 8, valueSuffix = '' }) {
  const [hover, setHover] = useState(null)
  const gid = useId().replace(/:/g, '')
  const W = 720, H = height, PL = 40, PR = 14, PT = 14, PB = 28
  const cW = W - PL - PR, cH = H - PT - PB, BASE = H - PB
  const n = labels.length
  if (!n) return null
  const max = Math.max(1, ...series.flatMap(s => s.values))
  // tre intervalli con valori tondi (1, 2, 2.5, 5 x 10^k)
  const passi = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000, 25000, 50000]
  let passo = passi.find(p => p * 3 >= max) || passi[passi.length - 1]
  while (passo * 3 < max) passo *= 2
  const top = passo * 3
  const griglia = [0, passo, passo * 2, top]
  const xAt = i => PL + (n === 1 ? cW / 2 : (i / (n - 1)) * cW)
  const yAt = v => PT + cH - (v / top) * cH

  const curva = pts => {
    if (pts.length < 2) return ''
    let d = `M ${pts[0].x} ${pts[0].y} `
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, pts.length - 1)]
      const c1y = Math.min(BASE, p1.y + (p2.y - p0.y) / 6), c2y = Math.min(BASE, p2.y - (p3.y - p1.y) / 6)
      d += `C ${p1.x + (p2.x - p0.x) / 6} ${c1y} ${p2.x - (p3.x - p1.x) / 6} ${c2y} ${p2.x} ${p2.y} `
    }
    return d
  }
  const ogni = Math.max(1, Math.ceil(n / maxLabels))
  const step = n > 1 ? cW / (n - 1) : cW

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', overflow: 'visible', display: 'block' }} onMouseLeave={() => setHover(null)}>
        <defs>
          {series.map((s, si) => (
            <linearGradient key={si} id={`g${gid}${si}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={series.length > 1 ? 0.12 : 0.18} />
              <stop offset="100%" stopColor={s.color} stopOpacity="0.02" />
            </linearGradient>
          ))}
        </defs>
        {griglia.map((v, i) => (
          <g key={i}>
            <line x1={PL} y1={yAt(v)} x2={W - PR} y2={yAt(v)} stroke="#E8ECF4" strokeWidth="1" />
            <text x={PL - 8} y={yAt(v) + 4} textAnchor="end" fontSize="11" fill="#9CA3AF" fontFamily="Inter,sans-serif">{v}</text>
          </g>
        ))}
        {series.map((s, si) => {
          const pts = s.values.map((v, i) => ({ x: xAt(i), y: yAt(v) }))
          const linea = curva(pts)
          return (
            <g key={si}>
              {n > 1 && <path d={`${linea} L ${pts[n - 1].x} ${BASE} L ${pts[0].x} ${BASE} Z`} fill={`url(#g${gid}${si})`} />}
              {n > 1 && <path d={linea} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
              <circle cx={xAt(hover ?? n - 1)} cy={yAt(s.values[hover ?? n - 1] || 0)} r="4.5" fill={s.color} stroke="#fff" strokeWidth="2" />
            </g>
          )
        })}
        {labels.map((l, i) => (i % ogni === 0 || i === n - 1) && (n < 3 || i === n - 1 || n - 1 - i >= ogni / 2) && (
          <text key={i} x={xAt(i)} y={H - 6} textAnchor="middle" fontSize="11" fill="#9CA3AF" fontFamily="Inter,sans-serif">{l}</text>
        ))}
        {hover != null && <line x1={xAt(hover)} y1={PT} x2={xAt(hover)} y2={BASE} stroke="#C7C9F9" strokeDasharray="3 3" />}
        {labels.map((_, i) => (
          <rect key={'h' + i} x={xAt(i) - step / 2} y={PT} width={step} height={cH} fill="transparent" onMouseEnter={() => setHover(i)} />
        ))}
      </svg>
      {hover != null && (
        <div style={{
          position: 'absolute', top: 0, left: `${(xAt(hover) / W) * 100}%`, pointerEvents: 'none', zIndex: 5,
          transform: xAt(hover) > W * 0.65 ? 'translateX(calc(-100% - 10px))' : 'translateX(10px)',
          background: '#111827', color: '#fff', fontSize: 11.5, padding: '8px 10px', borderRadius: 10, lineHeight: 1.5, whiteSpace: 'nowrap',
        }}>
          <b>{tips?.[hover] || labels[hover]}</b>
          {series.map(s => (
            <div key={s.name}><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: s.color, marginRight: 6 }} />{s.name}: {s.values[hover]}{valueSuffix}</div>
          ))}
        </div>
      )}
      {series.length > 1 && (
        <div style={{ display: 'flex', gap: 14, justifyContent: 'flex-end', marginTop: 6, flexWrap: 'wrap' }}>
          {series.map(s => (
            <span key={s.name} style={{ fontSize: 11.5, color: '#6B7280', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 3, borderRadius: 2, background: s.color }} />{s.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
