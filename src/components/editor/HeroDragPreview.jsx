import { useCallback, useEffect, useRef, useState } from 'react'
import { Move } from 'lucide-react'

export default function HeroDragPreview({ event, setH }) {
  const lh      = event.layout_hero || {}
  const imgUrl  = event.immagine_hero
  const altezza = Math.min(240, Math.round(parseInt(lh.altezza || 380) / 1.6))

  const posStr   = lh.bg_position || '50% 50%'
  const [px, py] = posStr.split(' ').map(v => parseFloat(v) || 50)

  const [dragging, setDragging] = useState(false)
  const [pos, setPos] = useState({ x: px, y: py })
  const boxRef = useRef(null)

  useEffect(() => { setPos({ x: px, y: py }) }, [posStr])

  const toPercent = useCallback((clientX, clientY) => {
    const rect = boxRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(100, Math.round(((clientX - rect.left)  / rect.width)  * 100)))
    const y = Math.max(0, Math.min(100, Math.round(((clientY - rect.top)   / rect.height) * 100)))
    return { x, y }
  }, [])

  function onPointerDown(e) {
    if (!imgUrl) return
    e.preventDefault()
    boxRef.current.setPointerCapture(e.pointerId)
    setDragging(true)
    setPos(toPercent(e.clientX, e.clientY))
  }

  function onPointerMove(e) {
    if (!dragging) return
    setPos(toPercent(e.clientX, e.clientY))
  }

  function onPointerUp(e) {
    if (!dragging) return
    setDragging(false)
    const p = toPercent(e.clientX, e.clientY)
    setPos(p)
    setH('bg_position')(`${p.x}% ${p.y}%`)
  }

  function resetPos() {
    setPos({ x: 50, y: 50 })
    setH('bg_position')('50% 50%')
  }

  const overlayHex = lh.overlay_colore || '#000000'
  const r = parseInt(overlayHex.slice(1,3),16), g = parseInt(overlayHex.slice(3,5),16), b = parseInt(overlayHex.slice(5,7),16)
  const overlay = `rgba(${r},${g},${b},${(lh.overlay_opacita || 55) / 100})`

  return (
    <div>
      {/* Header riga */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <p style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.05em', margin: 0 }}>
          Anteprima hero
          {imgUrl && (
            <span style={{ fontWeight: '400', textTransform: 'none', color: '#9CA3AF' }}>
              {' '}— trascina per riposizionare
            </span>
          )}
        </p>
        {imgUrl && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: '#9CA3AF', fontFamily: 'monospace' }}>
              {pos.x}% {pos.y}%
            </span>
            <button onClick={resetPos} style={{
              fontSize: '11px', color: '#003DA5', background: '#EEF3FF',
              border: '1px solid #C7D9F8', borderRadius: '5px',
              padding: '3px 8px', cursor: 'pointer',
              fontFamily: "'Inter',sans-serif", fontWeight: '700',
            }}>
              Centra
            </button>
          </div>
        )}
      </div>

      {/* Box principale */}
      <div
        ref={boxRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          position: 'relative',
          borderRadius: '10px',
          overflow: 'hidden',
          border: `2px solid ${dragging ? '#003DA5' : '#E5E7EB'}`,
          height: `${altezza}px`,
          cursor: imgUrl ? (dragging ? 'grabbing' : 'grab') : 'default',
          userSelect: 'none',
          touchAction: 'none',
          background: imgUrl ? '#000' : 'linear-gradient(135deg,#003DA5,#001a50)',
          transition: dragging ? 'none' : 'border-color .15s',
        }}
      >
        {/* Immagine con <img> + object-fit — molto più affidabile di background-image */}
        {imgUrl && (
          <img
            src={imgUrl}
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: `${pos.x}% ${pos.y}%`,
              pointerEvents: 'none',
              display: 'block',
              transition: dragging ? 'none' : 'object-position .05s',
            }}
          />
        )}

        {/* Overlay scuro */}
        <div style={{
          position: 'absolute', inset: 0,
          background: overlay,
          pointerEvents: 'none',
        }} />

        {/* Icona move al centro */}
        {imgUrl && !dragging && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0,0,0,.5)', borderRadius: '50%',
            width: '40px', height: '40px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <Move size={18} color="#fff" />
          </div>
        )}

        {/* Mirino punto di ancoraggio */}
        {imgUrl && (
          <div style={{
            position: 'absolute',
            left: `${pos.x}%`, top: `${pos.y}%`,
            transform: 'translate(-50%,-50%)',
            width: '14px', height: '14px',
            border: '2px solid #fff',
            borderRadius: '50%',
            background: dragging ? '#003DA5' : 'rgba(0,61,165,.8)',
            boxShadow: '0 0 0 2px rgba(0,0,0,.4)',
            pointerEvents: 'none',
          }} />
        )}

        {/* Contenuto titolo in basso */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '14px 18px',
          textAlign: lh.allineamento === 'centro' ? 'center' : 'left',
          pointerEvents: 'none',
        }}>
          <div style={{ marginBottom: '4px' }}>
            <img
              src={event.logo_url || 'https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png'}
              alt="Logo"
              style={{ height: '22px', objectFit: 'contain', opacity: .9 }}
            />
          </div>
          <p style={{
            color: lh.titolo_colore || '#FFF',
            fontSize: '16px',
            fontWeight: lh.titolo_grassetto ? '900' : '400',
            margin: 0,
            textTransform: lh.titolo_maiuscolo ? 'uppercase' : 'none',
            letterSpacing: '-.01em',
            textShadow: '0 1px 3px rgba(0,0,0,.4)',
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
