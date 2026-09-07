import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

// ── Seat data from Excel: platea rows ──
const PL = [
  ['1',1,18],['2',1,24],['3',1,26],['4',1,26],['5',1,28],['6',1,28],
  ['7',1,30],['8',1,28],['9',1,30],['10',1,30],['10a',23,28],
  ['11',1,30],['12',1,30],['13',1,30],['14',1,26],['15',1,24],
  ['16',1,16],['17',1,18],['18',1,18],['19',1,18],['20',1,14]
]

// Palchi: seats per box number (same for all piani/lati)
const PP = {1:4,2:4,3:4,4:4,5:4,6:4,7:4,8:4,9:4,10:5,11:5,12:6,13:6,14:6,15:6,16:6,17:6}
const PIANI = [1,2,3,4]
const LATI_PALCO = ['sinistro','destro']
const MAX_PALCO = {1:17,2:17,3:17,4:11}

// ── Generate all seat objects ──
function genPlatea() {
  const seats = []
  PL.forEach(([f, s, e]) => {
    for (let n = s; n <= e; n++) {
      seats.push({ id: `PL_${f}_${n}`, tipo: 'platea', fila: f, numero: n,
        label: `Platea Fila ${f} Posto ${n}` })
    }
  })
  return seats
}

function genPalchi() {
  const seats = []
  PIANI.forEach(piano => {
    LATI_PALCO.forEach(lato => {
      const max = MAX_PALCO[piano]
      for (let palco = 1; palco <= max; palco++) {
        const np = PP[palco]
        for (let posto = 1; posto <= np; posto++) {
          const l = lato === 'sinistro' ? 'SX' : 'DX'
          seats.push({
            id: `PA_${piano}_${l}_${palco}_${posto}`, tipo: 'palco',
            piano, lato, palco, posto,
            label: `${piano}° Ordine ${lato === 'sinistro' ? 'Sinistro' : 'Destro'} Palco ${palco} Posto ${posto}`
          })
        }
      }
    })
  })
  return seats
}

// ── Compute platea seat positions on arcs ──
function plateaPositions(seats) {
  const cx = 500, cy = 25, baseR = 85, gap = 26
  const maxArc = 2.35
  const pos = {}
  const rowIdx = {}
  PL.forEach(([f], i) => { rowIdx[f] = i })
  const rowSeats = {}
  seats.forEach(s => {
    if (!rowSeats[s.fila]) rowSeats[s.fila] = []
    rowSeats[s.fila].push(s)
  })
  Object.entries(rowSeats).forEach(([fila, rs]) => {
    const i = rowIdx[fila]
    const r = baseR + i * gap
    const odds = rs.filter(s => s.numero % 2 === 1).sort((a, b) => b.numero - a.numero)
    const evens = rs.filter(s => s.numero % 2 === 0).sort((a, b) => a.numero - b.numero)
    const ordered = [...odds, ...evens]
    const n = ordered.length
    const arc = maxArc * (n / 30)
    ordered.forEach((s, j) => {
      const frac = n === 1 ? 0 : (j / (n - 1)) - 0.5
      const a = frac * arc
      pos[s.id] = { x: cx + r * Math.sin(a), y: cy + r * Math.cos(a) }
    })
  })
  return pos
}

// ── Colors ──
const C = {
  free: '#22c55e', occupied: '#ef4444', selected: '#818cf8',
  bg: '#F7F8FC', primary: '#5B5FEF', blue: '#003DA5',
  border: '#E8ECF4', text: '#1e293b', muted: '#6B7280'
}

export default function MappaPostiTeatro({ registrations, eventId, onReload }) {
  const [selPerson, setSelPerson] = useState(null)
  const [view, setView] = useState('platea')
  const [piano, setPiano] = useState(1)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [tooltip, setTooltip] = useState(null)
  const [toast, setToast] = useState(null)
  const [saving, setSaving] = useState(false)
  const svgRef = useRef(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const dragRef = useRef(null)

  const plateaSeats = useMemo(() => genPlatea(), [])
  const palchiSeats = useMemo(() => genPalchi(), [])
  const allSeats = useMemo(() => [...plateaSeats, ...palchiSeats], [plateaSeats, palchiSeats])
  const plPos = useMemo(() => plateaPositions(plateaSeats), [plateaSeats])

  // Build assignment map: seatLabel → reg
  const { seatToReg, regToSeat } = useMemo(() => {
    const byLabel = {}
    registrations.forEach(r => { if (r.numero_posto) byLabel[r.numero_posto] = r })
    const seatToReg = {}
    allSeats.forEach(s => { if (byLabel[s.label]) seatToReg[s.id] = byLabel[s.label] })
    const regToSeat = {}
    registrations.forEach(r => { if (r.numero_posto) regToSeat[r.id] = r.numero_posto })
    return { seatToReg, regToSeat }
  }, [registrations, allSeats])

  const showToast = useCallback((msg, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }, [])

  const saveSeat = useCallback(async (regId, posto) => {
    const { error } = await supabase.from('registrations').update({ numero_posto: posto }).eq('id', regId)
    if (error) { showToast('Errore: ' + error.message, false); return false }
    return true
  }, [showToast])

  const handleAssign = useCallback(async (seat) => {
    if (saving) return
    const occ = seatToReg[seat.id]

    if (occ && !selPerson) {
      if (confirm(`Rimuovere ${occ.nome} ${occ.cognome} dal posto ${seat.label}?`)) {
        setSaving(true)
        const ok = await saveSeat(occ.id, null)
        if (ok) { showToast(`Posto liberato: ${seat.label}`); onReload?.() }
        setSaving(false)
      }
      return
    }
    if (!selPerson) { showToast('Seleziona prima un iscritto dalla lista a destra', false); return }
    if (occ) { showToast(`Posto già occupato da ${occ.nome} ${occ.cognome}`, false); return }

    setSaving(true)
    // If person already has a seat, clear it first
    if (regToSeat[selPerson.id]) {
      await saveSeat(selPerson.id, null)
    }
    const ok = await saveSeat(selPerson.id, seat.label)
    if (ok) {
      showToast(`${selPerson.nome} ${selPerson.cognome} → ${seat.label}`)
      setSelPerson(null)
      onReload?.()
    }
    setSaving(false)
  }, [selPerson, seatToReg, regToSeat, saving, saveSeat, showToast, onReload])

  // Filtered registrants list
  const filtered = useMemo(() => {
    let list = registrations
    if (filter === 'assigned') list = list.filter(r => r.numero_posto)
    else if (filter === 'unassigned') list = list.filter(r => !r.numero_posto)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(r =>
        `${r.nome} ${r.cognome} ${r.ragione_sociale || ''} ${r.email || ''} ${r.numero_posto || ''}`.toLowerCase().includes(q)
      )
    }
    return list
  }, [registrations, filter, search])

  const stats = useMemo(() => {
    const assigned = registrations.filter(r => r.numero_posto).length
    return { total: registrations.length, assigned, unassigned: registrations.length - assigned, seats: allSeats.length, occ: Object.keys(seatToReg).length }
  }, [registrations, allSeats, seatToReg])

  // SVG interaction
  const handleWheel = useCallback((e) => {
    e.preventDefault()
    setZoom(z => Math.max(0.4, Math.min(5, z + (e.deltaY > 0 ? -0.2 : 0.2))))
  }, [])
  const handleMouseDown = useCallback((e) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault()
      dragRef.current = { sx: e.clientX - pan.x, sy: e.clientY - pan.y }
    }
  }, [pan])
  const handleMouseMove = useCallback((e) => {
    if (dragRef.current) setPan({ x: e.clientX - dragRef.current.sx, y: e.clientY - dragRef.current.sy })
  }, [])
  const handleMouseUp = useCallback(() => { dragRef.current = null }, [])
  const resetView = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }) }, [])

  // ── Seat circle renderer ──
  const SeatDot = useCallback(({ seat, x, y, r = 5.5 }) => {
    const occ = seatToReg[seat.id]
    const isSel = selPerson && occ?.id === selPerson.id
    const fill = isSel ? C.selected : occ ? C.occupied : selPerson ? C.free : '#94a3b8'
    return (
      <circle cx={x} cy={y} r={r} fill={fill} stroke={occ ? '#fff' : '#e2e8f0'} strokeWidth={0.7}
        style={{ cursor: 'pointer', transition: 'fill 0.15s' }}
        onMouseEnter={(e) => {
          const rect = svgRef.current?.getBoundingClientRect()
          setTooltip({ x: e.clientX - (rect?.left || 0), y: e.clientY - (rect?.top || 0), seat, occ })
        }}
        onMouseLeave={() => setTooltip(null)}
        onClick={(e) => { e.stopPropagation(); handleAssign(seat) }}
      />
    )
  }, [seatToReg, selPerson, handleAssign])

  // ── Platea SVG content ──
  const PlateaSVG = useMemo(() => {
    const rowGroups = {}
    PL.forEach(([f]) => { rowGroups[f] = [] })
    plateaSeats.forEach(s => {
      const p = plPos[s.id]
      if (p) rowGroups[s.fila].push({ seat: s, ...p })
    })
    return (
      <>
        <rect x={340} y={2} width={320} height={40} rx={8} fill={C.blue} />
        <text x={500} y={27} textAnchor="middle" fill="#fff" fontSize={14} fontWeight={700} fontFamily="Inter,sans-serif">PALCOSCENICO</text>
        {PL.map(([f]) => {
          const seats = rowGroups[f]
          if (!seats.length) return null
          const first = seats[0], last = seats[seats.length - 1]
          return (
            <g key={f}>
              <text x={first.x - 18} y={first.y + 4} textAnchor="end" fontSize={8} fill={C.muted} fontWeight={700} fontFamily="Inter,sans-serif">F{f}</text>
              <text x={last.x + 18} y={last.y + 4} textAnchor="start" fontSize={8} fill={C.muted} fontWeight={700} fontFamily="Inter,sans-serif">F{f}</text>
              {seats.map(({ seat, x, y }) => <SeatDot key={seat.id} seat={seat} x={x} y={y} />)}
            </g>
          )
        })}
      </>
    )
  }, [plateaSeats, plPos, SeatDot])

  // ── Palchi SVG content ──
  const PalchiSVG = useMemo(() => {
    const max = MAX_PALCO[piano]
    const byBox = { sinistro: {}, destro: {} }
    palchiSeats.filter(s => s.piano === piano).forEach(s => {
      if (!byBox[s.lato][s.palco]) byBox[s.lato][s.palco] = []
      byBox[s.lato][s.palco].push(s)
    })
    const boxW = 56, boxH = 30, gV = 4, startY = 60, leftX = 50, rightX = 860
    const els = []
    els.push(<rect key="stg" x={340} y={42} width={250} height={26} rx={5} fill={C.blue} opacity={0.25} />)
    els.push(<text key="stgtxt" x={465} y={60} textAnchor="middle" fontSize={11} fill={C.blue} fontWeight={600} fontFamily="Inter,sans-serif">PALCOSCENICO</text>)

    LATI_PALCO.forEach(side => {
      const bx = side === 'sinistro' ? leftX : rightX
      const lbl = side === 'sinistro' ? 'SINISTRO' : 'DESTRO'
      els.push(<text key={`l-${side}`} x={bx + boxW / 2} y={startY - 8} textAnchor="middle" fontSize={10} fontWeight={800} fill={C.primary} fontFamily="Inter,sans-serif">{lbl}</text>)

      for (let p = 1; p <= max; p++) {
        const seats = (byBox[side][p] || []).sort((a, b) => a.posto - b.posto)
        const y = startY + (p - 1) * (boxH + gV)
        const np = seats.length
        els.push(<rect key={`bx-${side}-${p}`} x={bx} y={y} width={boxW} height={boxH} rx={5} fill="#f1f5f9" stroke={C.border} strokeWidth={1} />)
        els.push(
          <text key={`pn-${side}-${p}`} x={side === 'sinistro' ? bx - 10 : bx + boxW + 10}
            y={y + boxH / 2 + 4} textAnchor="middle" fontSize={9} fill={C.muted} fontWeight={700} fontFamily="Inter,sans-serif">{p}</text>
        )
        seats.forEach((s, i) => {
          const sx = bx + 9 + i * (np <= 4 ? 11 : np <= 5 ? 9 : 7.2)
          els.push(<SeatDot key={s.id} seat={s} x={sx} y={y + boxH / 2} r={np <= 4 ? 4.5 : 3.8} />)
        })
      }
    })

    // Connecting arcs between left and right (decorative)
    for (let p = 1; p <= max; p++) {
      const y = startY + (p - 1) * (boxH + gV) + boxH / 2
      els.push(<line key={`conn-${p}`} x1={leftX + boxW + 5} y1={y} x2={rightX - 5} y2={y} stroke={C.border} strokeWidth={0.4} strokeDasharray="4,4" />)
    }

    return els
  }, [piano, palchiSeats, SeatDot])

  const viewH = view === 'platea' ? 620 : 60 + MAX_PALCO[piano] * 34 + 30

  return (
    <div style={{ background: C.bg, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
      {/* ── Stats bar ── */}
      <div style={{ display: 'flex', gap: 16, padding: '14px 20px', background: '#fff', borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
        {[
          ['🎫 Iscritti', stats.total, C.text],
          ['✅ Con posto', stats.assigned, C.free],
          ['⏳ Senza posto', stats.unassigned, '#f59e0b'],
          ['🪑 Posti occupati', `${stats.occ} / ${stats.seats}`, C.primary],
        ].map(([l, v, c]) => (
          <div key={l} style={{ textAlign: 'center', minWidth: 100 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: c, letterSpacing: '-0.02em' }}>{v}</div>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* ── View tabs + zoom ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', background: '#fff', borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
        {['platea', ...PIANI.map(p => `palchi-${p}`)].map(v => {
          const label = v === 'platea' ? '🪑 Platea (498)' : `🎪 ${v.split('-')[1]}° Ordine`
          const active = (v === 'platea' && view === 'platea') || (v !== 'platea' && view === 'palchi' && piano === +v.split('-')[1])
          return (
            <button key={v} onClick={() => {
              if (v === 'platea') setView('platea')
              else { setView('palchi'); setPiano(+v.split('-')[1]) }
              resetView()
            }} style={{
              padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${active ? C.primary : C.border}`,
              background: active ? 'linear-gradient(90deg,#5B5FEF,#3730A3)' : '#fff', color: active ? '#fff' : C.text,
              fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter',sans-serif"
            }}>{label}</button>
          )
        })}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, alignItems: 'center' }}>
          <button onClick={() => setZoom(z => Math.min(5, z + 0.3))} style={zBtn}>＋</button>
          <span style={{ fontSize: 11, color: C.muted, width: 44, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.max(0.4, z - 0.3))} style={zBtn}>−</button>
          <button onClick={resetView} style={{ ...zBtn, fontSize: 10, width: 'auto', padding: '3px 10px' }}>Reset</button>
        </div>
      </div>

      {/* ── Selection banner ── */}
      {selPerson && (
        <div style={{ background: '#eef2ff', borderBottom: `2px solid ${C.primary}`, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>👆</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.primary }}>
            Clicca su un posto libero (verde) per assegnare: <u>{selPerson.cognome} {selPerson.nome}</u>
          </span>
          {selPerson.ragione_sociale && <span style={{ fontSize: 11, color: C.muted }}>({selPerson.ragione_sociale})</span>}
          <button onClick={() => setSelPerson(null)} style={{
            marginLeft: 'auto', padding: '5px 14px', borderRadius: 14, border: `1.5px solid ${C.primary}`,
            background: '#fff', color: C.primary, fontSize: 12, cursor: 'pointer', fontWeight: 700, fontFamily: "'Inter',sans-serif"
          }}>✕ Annulla</button>
        </div>
      )}

      {/* ── Main layout: map + list ── */}
      <div style={{ display: 'flex', height: 'calc(100vh - 340px)', minHeight: 500 }}>
        {/* SVG Map */}
        <div ref={svgRef} style={{ flex: 1, overflow: 'hidden', position: 'relative', background: '#f8fafc' }}
          onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
          <svg
            viewBox={view === 'platea' ? '0 0 1000 620' : `0 0 960 ${viewH}`}
            style={{
              width: '100%', height: '100%',
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transformOrigin: 'center center'
            }}>
            {/* Legend */}
            <g transform="translate(20, 10)">
              <circle cx={0} cy={0} r={4.5} fill={selPerson ? C.free : '#94a3b8'} />
              <text x={8} y={3.5} fontSize={9} fill={C.muted} fontFamily="Inter,sans-serif">{selPerson ? 'Libero' : 'Disponibile'}</text>
              <circle cx={80} cy={0} r={4.5} fill={C.occupied} />
              <text x={88} y={3.5} fontSize={9} fill={C.muted} fontFamily="Inter,sans-serif">Occupato</text>
              <circle cx={155} cy={0} r={4.5} fill={C.selected} />
              <text x={163} y={3.5} fontSize={9} fill={C.muted} fontFamily="Inter,sans-serif">Persona sel.</text>
            </g>
            {view === 'platea' ? PlateaSVG : PalchiSVG}
          </svg>

          {/* Tooltip */}
          {tooltip && (
            <div style={{
              position: 'absolute', left: Math.min(tooltip.x + 14, svgRef.current?.offsetWidth - 280 || 400), top: tooltip.y - 50,
              background: '#1e293b', color: '#fff', padding: '8px 12px', borderRadius: 10,
              fontSize: 12, whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 100,
              boxShadow: '0 4px 16px rgba(0,0,0,0.35)', fontFamily: "'Inter',sans-serif"
            }}>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>{tooltip.seat.label}</div>
              {tooltip.occ ? (
                <div style={{ color: '#fca5a5' }}>
                  ✦ {tooltip.occ.cognome} {tooltip.occ.nome}
                  {tooltip.occ.ragione_sociale && <span style={{ opacity: 0.7 }}> — {tooltip.occ.ragione_sociale}</span>}
                </div>
              ) : (
                <div style={{ color: '#86efac' }}>🟢 Disponibile — {selPerson ? 'clicca per assegnare' : 'seleziona un iscritto'}</div>
              )}
            </div>
          )}
        </div>

        {/* ── Right panel: registrant list ── */}
        <div style={{ width: 370, borderLeft: `1px solid ${C.border}`, background: '#fff', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '12px 14px 8px', borderBottom: `1px solid ${C.border}` }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Cerca nome, cognome, azienda, email…"
              style={{ width: '100%', padding: '9px 14px', borderRadius: 10, border: `1px solid ${C.border}`,
                fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: "'Inter',sans-serif" }} />
            <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
              {[['all', `Tutti (${stats.total})`], ['unassigned', `Senza posto (${stats.unassigned})`], ['assigned', `Con posto (${stats.assigned})`]].map(([k, l]) => (
                <button key={k} onClick={() => setFilter(k)} style={{
                  padding: '4px 10px', borderRadius: 14, border: `1px solid ${filter === k ? C.primary : C.border}`,
                  background: filter === k ? C.primary : '#fff', color: filter === k ? '#fff' : C.text,
                  fontSize: 11, cursor: 'pointer', fontWeight: 600, fontFamily: "'Inter',sans-serif"
                }}>{l}</button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.map(r => {
              const isSel = selPerson?.id === r.id
              return (
                <div key={r.id} onClick={() => {
                  if (isSel) setSelPerson(null)
                  else setSelPerson(r)
                }} style={{
                  padding: '9px 14px', borderBottom: `1px solid ${C.border}`,
                  cursor: 'pointer',
                  background: isSel ? '#eef2ff' : 'transparent',
                  borderLeft: isSel ? `3px solid ${C.primary}` : '3px solid transparent',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.numero_posto ? C.free : '#f59e0b', flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, fontSize: 13, color: C.text, fontFamily: "'Inter',sans-serif" }}>
                      {r.cognome} {r.nome}
                    </span>
                  </div>
                  {r.ragione_sociale && <div style={{ fontSize: 11, color: C.muted, marginLeft: 14, marginTop: 1 }}>{r.ragione_sociale}</div>}
                  {r.numero_posto ? (
                    <div style={{ fontSize: 11, color: C.free, fontWeight: 700, marginLeft: 14, marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                      🪑 {r.numero_posto}
                      <button onClick={(e) => {
                        e.stopPropagation()
                        if (confirm(`Rimuovere posto a ${r.nome} ${r.cognome}?\n${r.numero_posto}`)) {
                          saveSeat(r.id, null).then(ok => { if (ok) { showToast('Posto rimosso'); onReload?.() } })
                        }
                      }} style={{
                        marginLeft: 'auto', padding: '2px 8px', borderRadius: 8, border: '1px solid #fca5a5',
                        background: '#fff0f0', color: C.occupied, fontSize: 10, cursor: 'pointer', fontWeight: 600, fontFamily: "'Inter',sans-serif"
                      }}>✕ Rimuovi</button>
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: isSel ? C.primary : '#f59e0b', fontWeight: isSel ? 700 : 500, marginLeft: 14, marginTop: 3 }}>
                      {isSel ? '👆 Clicca un posto sulla mappa...' : 'Senza posto — clicca per selezionare'}
                    </div>
                  )}
                </div>
              )
            })}
            {filtered.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: C.muted, fontSize: 13 }}>Nessun risultato</div>}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: toast.ok ? '#065f46' : '#991b1b', color: '#fff',
          padding: '12px 24px', borderRadius: 14, fontSize: 14, fontWeight: 700,
          boxShadow: '0 6px 24px rgba(0,0,0,0.35)', zIndex: 9999,
          fontFamily: "'Inter',sans-serif"
        }}>
          {toast.ok ? '✓' : '✕'} {toast.msg}
        </div>
      )}
    </div>
  )
}

const zBtn = {
  width: 30, height: 30, borderRadius: 8, border: '1px solid #E8ECF4',
  background: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex',
  alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontFamily: "'Inter',sans-serif"
}
