import { useCallback, useEffect, useRef, useState } from 'react'
import { Move } from 'lucide-react'

/*
  HeroDragPreview
  ───────────────
  Mostra l'anteprima dell'immagine hero e permette di trascinarla
  per impostare backgroundPosition (X%, Y%).
  Salva il valore come stringa CSS: "50% 30%"
*/
export default function HeroDragPreview({ event, setH }) {
  const lh       = event.layout_hero || {}
  const imgUrl   = event.immagine_hero
  const altezza  = Math.min(240, Math.round(parseInt(lh.altezza || 380) / 1.6))

  // Posizione corrente: "X% Y%"
  const posStr   = lh.bg_position || '50% 50%'
  const [px, py] = posStr.split(' ').map(v => parseFloat(v) || 50)

  const [dragging, setDragging] = useState(false)
  const [pos, setPos] = useState({ x: px, y: py })
  const boxRef = useRef(null)
  const startRef = useRef(null)

  // Sincronizza pos se cambia dall'esterno
  useEffect(() => {
    setPos({ x: px, y: py })
  }, [posStr])

  const toPercent = useCallback((clientX, clientY) => {
    const rect = boxRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(100, Math.round(((clientX - rect.left) / rect.width) * 100)))
    const y = Math.max(0, Math.min(100, Math.round(((clientY - rect.top)  / rect.height) * 100)))
    return { x, y }
  }, [])

  function onPointerDown(e) {
    if (!imgUrl) return
    e.preventDefault()
    boxRef.current.setPointerCapture(e.pointerId)
    setDragging(true)
    const p = toPercent(e.clientX, e.clientY)
    setPos(p)
    startRef.current = p
  }

  function onPointerMove(e) {
    if (!dragging) return
    const p = toPercent(e.clientX, e.clientY)
    setPos(p)
  }

  function onPointerUp() {
    if (!dragging) return
    setDragging(false)
    setH('bg_position')(`${pos.x}% ${pos.y}%`)
  }

  // Reset al centro
  function resetPos() {
    setPos({ x: 50, y: 50 })
    setH('bg_position')('50% 50%')
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <p style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.05em', margin: 0 }}>
          Anteprima hero {imgUrl && <span style={{ fontWeight: '400', textTransform: 'none', color: '#9CA3AF' }}>— trascina per riposizionare</span>}
        </p>
        {imgUrl && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: '#9CA3AF', fontFamily: 'monospace' }}>
              {pos.x}% {pos.y}%
            </span>
            <button
              onClick={resetPos}
              style={{ fontSize: '11px', color: '#003DA5', background: '#EEF3FF', border: '1px solid #C7D9F8', borderRadius: '5px', padding: '3px 8px', cursor: 'pointer', fontFamily: "'Inter',sans-serif", fontWeight: '700' }}
            >
              Centra
            </button>
          </div>
        )}
      </div>

      {/* Box anteprima drag */}
      <div
        ref={boxRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          borderRadius: '10px',
          overflow: 'hidden',
          border: `2px solid ${dragging ? '#003DA5' : '#E5E7EB'}`,
          height: `${altezza}px`,
          backgroundImage: imgUrl ? `url(${imgUrl})` : undefined,
          background: imgUrl ? undefined : 'linear-gradient(135deg, #003DA5, #001a50)',
          backgroundSize: 'cover',
          backgroundPosition: `${pos.x}% ${pos.y}%`,
          display: 'flex',
          alignItems: 'flex-end',
          cursor: imgUrl ? (dragging ? 'grabbing' : 'grab') : 'default',
          userSelect: 'none',
          touchAction: 'none',
          transition: dragging ? 'none' : 'border-color .15s',
          position: 'relative',
        }}
      >
        {/* Hint visivo al centro quando non si sta trascinando */}
        {imgUrl && !dragging && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0,0,0,.45)', borderRadius: '50%',
            width: '40px', height: '40px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
            opacity: 0.8,
          }}>
            <Move size={18} color="#fff" />
          </div>
        )}

        {/* Mirino punto di ancoraggio */}
        {imgUrl && (
          <div style={{
            position: 'absolute',
            left: `${pos.x}%`, top: `${pos.y}%`,
            transform: 'translate(-50%, -50%)',
            width: '16px', height: '16px',
            border: '2px solid #fff',
            borderRadius: '50%',
            background: dragging ? '#003DA5' : 'rgba(0,61,165,.7)',
            boxShadow: '0 0 0 2px rgba(0,0,0,.4)',
            pointerEvents: 'none',
            transition: dragging ? 'none' : 'background .15s',
          }} />
        )}

        {/* Overlay + contenuto titolo */}
        <div style={{
          padding: '16px 20px',
          background: `rgba(0,0,0,${(lh.overlay_opacita || 55) / 100})`,
          width: '100%',
          textAlign: lh.allineamento === 'centro' ? 'center' : 'left',
          pointerEvents: 'none',
        }}>
          <div style={{ marginBottom: '4px' }}>
            <img
              src={event.logo_url || 'https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png'}
              alt="Logo"
              style={{ height: '24px', objectFit: 'contain', opacity: .9 }}
            />
          </div>
          <p style={{
            color: lh.titolo_colore || '#FFF',
            fontSize: '16px',
            fontWeight: lh.titolo_grassetto ? '900' : '400',
            margin: 0,
            textTransform: lh.titolo_maiuscolo ? 'uppercase' : 'none',
            letterSpacing: '-.01em',
          }}>
            {event.titolo || 'Titolo evento'}
          </p>
        </div>
      </div>

      {!imgUrl && (
        <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '6px', textAlign: 'center' }}>
          Carica un'immagine per attivare il riposizionamento
        </p>
      )}
    </div>
  )
}
