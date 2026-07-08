/**
 * BlockRenderer condiviso — usato da LandingPagePublic e LandingPage (eventi)
 * 14 tipi: testo | titolo | stats | griglia | badge_list | cta | banner
 *          timeline | accordion | video | testimonial | countdown | immagine | separatore
 */
import { useState, useEffect, useRef } from 'react'
import { IconDisplay } from '../editor/BlockIcons'

// ── Animazione Intersection Observer ─────────────────────────────
export function Animate({ children, animation = 'fadeup', delay = 0 }) {
  const ref = useRef()
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const hidden = {
    fadeup:  { opacity: 0, transform: 'translateY(28px)' },
    fadein:  { opacity: 0 },
    slidein: { opacity: 0, transform: 'translateX(-32px)' },
    none:    {},
  }[animation] || { opacity: 0, transform: 'translateY(28px)' }

  return (
    <div
      ref={ref}
      style={{
        transition: `opacity .55s ease ${delay}ms, transform .55s ease ${delay}ms`,
        ...(visible ? {} : hidden),
      }}
    >
      {children}
    </div>
  )
}

// ── Contatore animato ─────────────────────────────────────────────
export function AnimatedNumber({ target }) {
  const [display, setDisplay] = useState('0')
  const ref = useRef()
  const started = useRef(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || started.current) return
      started.current = true
      const num = parseFloat(String(target).replace(/[^0-9.]/g, ''))
      const suffix = String(target).replace(/[0-9.]/g, '')
      if (isNaN(num)) { setDisplay(target); return }
      const dur = 1400, fps = 60, steps = Math.round(dur / 1000 * fps)
      let step = 0
      const t = setInterval(() => {
        step++
        const ease = 1 - Math.pow(1 - step / steps, 3)
        setDisplay(Math.round(num * ease).toLocaleString('it-IT') + suffix)
        if (step >= steps) { setDisplay(num.toLocaleString('it-IT') + suffix); clearInterval(t) }
      }, 1000 / fps)
    }, { threshold: 0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [target])
  return <span ref={ref}>{display}</span>
}

// ── Accordion item ────────────────────────────────────────────────
export function AccordionItem({ domanda, risposta, cp }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ border: '1px solid #E5E7EB', borderRadius: '10px', overflow: 'hidden', marginBottom: '8px' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', background: open ? '#EEF3FF' : '#fff', border: 'none',
        cursor: 'pointer', fontFamily: 'Inter,sans-serif', textAlign: 'left',
      }}>
        <span style={{ fontSize: '15px', fontWeight: '700', color: open ? cp : '#0A0A0A', lineHeight: 1.4 }}>{domanda}</span>
        <span style={{ fontSize: '20px', color: cp, flexShrink: 0, marginLeft: '12px', transition: 'transform .25s', transform: open ? 'rotate(45deg)' : 'rotate(0)' }}>+</span>
      </button>
      <div style={{ maxHeight: open ? '600px' : '0', overflow: 'hidden', transition: 'max-height .35s ease' }}>
        <div style={{ padding: '0 20px 18px', fontSize: '15px', color: '#374151', lineHeight: '1.7' }}>{risposta}</div>
      </div>
    </div>
  )
}

// ── Countdown ─────────────────────────────────────────────────────
export function Countdown({ data, titolo, messaggio_scaduto, cp }) {
  const [time, setTime] = useState(null)
  useEffect(() => {
    function calc() {
      const diff = new Date(data) - new Date()
      if (diff <= 0) { setTime(null); return }
      setTime({
        g: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      })
    }
    if (!data) return
    calc()
    const t = setInterval(calc, 1000)
    return () => clearInterval(t)
  }, [data])

  if (!data) return (
    <div style={{ textAlign: 'center', padding: '32px', background: '#F9FAFB', borderRadius: '12px', color: '#9CA3AF', fontSize: '14px' }}>
      ⏱ Countdown — imposta una data nell'editor
    </div>
  )

  return (
    <div style={{ textAlign: 'center', padding: '40px 24px', background: `linear-gradient(135deg, ${cp}12, ${cp}06)`, borderRadius: '16px', border: `1px solid ${cp}25` }}>
      {titolo && <p style={{ fontSize: '14px', fontWeight: '700', color: cp, textTransform: 'uppercase', letterSpacing: '.08em', margin: '0 0 20px' }}>{titolo}</p>}
      {time ? (
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[['g', 'Giorni'], ['h', 'Ore'], ['m', 'Minuti'], ['s', 'Secondi']].map(([k, l]) => (
            <div key={k} style={{ minWidth: '72px' }}>
              <div style={{ fontSize: 'clamp(32px,6vw,52px)', fontWeight: '900', color: cp, letterSpacing: '-.04em', lineHeight: 1 }}>
                {String(time[k]).padStart(2, '0')}
              </div>
              <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.06em', marginTop: '4px' }}>{l}</div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: '18px', fontWeight: '700', color: cp }}>{messaggio_scaduto || 'Evento iniziato!'}</p>
      )}
    </div>
  )
}

// ── Video embed URL helper ────────────────────────────────────────
export function videoEmbedUrl(url) {
  if (!url) return null
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0`
  const vi = url.match(/vimeo\.com\/(\d+)/)
  if (vi) return `https://player.vimeo.com/video/${vi[1]}`
  return null
}

// ── Block Renderer principale ─────────────────────────────────────
export default function BlockRenderer({ block, cp = '#003DA5', formTarget = '#lp-form' }) {
  if (!block) return null

  if (block.tipo === 'testo') return (
    <Animate animation="fadeup">
      <div className="rich-content" style={{ marginBottom: '16px' }} dangerouslySetInnerHTML={{ __html: block.html || '' }} />
    </Animate>
  )

  if (block.tipo === 'titolo') return (
    <Animate animation={block.animazione || 'fadeup'}>
      <div className="lp-blocco-titolo" style={{ textAlign: block.allineamento || 'center', marginBottom: '32px', marginTop: '8px' }}>
        <h2 className="lp-section-title" style={{ fontSize: 'clamp(22px,4vw,38px)', fontWeight: '900', color: '#0A0A0A', letterSpacing: '-.03em', margin: '0 0 8px', lineHeight: 1.1 }}>{block.testo}</h2>
        {block.sottotitolo && <p className="lp-section-sub" style={{ fontSize: 'clamp(13px,2vw,17px)', color: '#6B7280', margin: 0, lineHeight: 1.6 }}>{block.sottotitolo}</p>}
      </div>
    </Animate>
  )

  if (block.tipo === 'stats') return (
    <Animate animation="fadein">
      <div className="lp-stats" style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'center', padding: '32px 0', marginBottom: '16px' }}>
        {(block.items || []).map((item, i) => (
          <Animate key={i} animation="fadeup" delay={i * 100}>
            <div style={{ textAlign: 'center', flex: '1 1 80px' }}>
              <p style={{ fontSize: 'clamp(32px,6vw,52px)', fontWeight: '900', color: block.colore || cp, letterSpacing: '-.04em', margin: '0 0 4px', lineHeight: 1 }}>
                {block.animato !== false ? <AnimatedNumber target={item.num || item.numero || '0'} /> : (item.num || item.numero)}
              </p>
              <p style={{ fontSize: '12px', color: '#6B7280', fontWeight: '700', margin: 0, textTransform: 'uppercase', letterSpacing: '.05em' }}>{item.label}</p>
            </div>
          </Animate>
        ))}
      </div>
    </Animate>
  )

  if (block.tipo === 'griglia') {
    const cols = block.cols || block.colonne || []
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '16px', marginBottom: '24px' }}>
        {cols.map((col, i) => (
          <Animate key={i} animation="fadeup" delay={i * 80}>
            <div
              style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '22px', height: '100%', boxSizing: 'border-box', transition: 'box-shadow .2s, transform .2s' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 24px ${cp}20`; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              {col.icona && <div style={{ marginBottom: '10px' }}><IconDisplay iconId={col.icona} color={col.icona_colore||cp} size={32} /></div>}
              {col.titolo && <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0A0A0A', margin: '0 0 8px', letterSpacing: '-.02em' }}>{col.titolo}</h3>}
              {col.testo && <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.65', margin: 0 }}>{col.testo}</p>}
            </div>
          </Animate>
        ))}
      </div>
    )
  }

  if (block.tipo === 'badge_list') {
    const colonne = block.colonne || 2
    return (
      <Animate animation="fadeup">
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${colonne === 1 ? '100%' : colonne === 3 ? '150px' : '210px'}), 1fr))`, gap: '10px', marginBottom: '24px' }}>
          {(block.items || []).map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
              <IconDisplay iconId={item.icona||'check'} color={item.icona_colore||block.colore||cp} size={20} />
              <span style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>{item.testo}</span>
            </div>
          ))}
        </div>
      </Animate>
    )
  }

  if (block.tipo === 'cta') {
    const br = block.stile === 'pill' ? '999px' : '8px'
    const btnBg = block.stile === 'contorno' ? 'transparent' : (block.colore || cp)
    const btnColor = block.stile === 'contorno' ? (block.colore || cp) : '#fff'
    const btnBorder = block.stile === 'contorno' ? `2px solid ${block.colore || cp}` : 'none'
    return (
      <Animate animation="fadein">
        <div style={{ background: `linear-gradient(135deg, ${cp}10, ${cp}06)`, border: `1px solid ${cp}25`, borderRadius: '16px', padding: '36px 24px', textAlign: 'center', marginBottom: '24px' }}>
          {block.titolo && <h2 style={{ fontSize: 'clamp(18px,3vw,28px)', fontWeight: '900', color: '#0A0A0A', letterSpacing: '-.03em', margin: '0 0 20px' }}>{block.titolo}</h2>}
          <a href={formTarget} style={{ display: 'inline-block', background: btnBg, color: btnColor, border: btnBorder, borderRadius: br, padding: '14px 36px', fontSize: '15px', fontWeight: '800', textDecoration: 'none', transition: 'transform .15s,box-shadow .15s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 20px ${cp}40` }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
            {block.testo_btn || block.testo || 'Iscriviti →'}
          </a>
        </div>
      </Animate>
    )
  }

  if (block.tipo === 'banner') {
    const configs = {
      info:    { bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE' },
      success: { bg: '#D1FAE5', color: '#065F46', border: '#6EE7B7' },
      warning: { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
      error:   { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA' },
    }
    const c = configs[block.stile || 'info'] || configs.info
    return (
      <Animate animation="slidein">
        <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: '10px', padding: '16px 20px', marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          {block.icona && <span style={{ fontSize: '18px', flexShrink: 0 }}>{block.icona}</span>}
          <p style={{ margin: 0, fontSize: '14px', color: c.color, lineHeight: '1.6', fontWeight: '500' }}>{block.testo}</p>
        </div>
      </Animate>
    )
  }

  if (block.tipo === 'timeline') return (
    <Animate animation="fadeup">
      <div style={{ position: 'relative', marginBottom: '32px' }}>
        <div style={{ position: 'absolute', left: '18px', top: '8px', bottom: '8px', width: '2px', background: `linear-gradient(to bottom, ${cp}, ${cp}30)` }} />
        {(block.items || []).map((item, i) => (
          <Animate key={i} animation="slidein" delay={i * 100}>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '24px', paddingLeft: '2px' }}>
              <div style={{ flexShrink: 0, width: '36px', height: '36px', borderRadius: '50%', background: cp, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', zIndex: 1, boxShadow: `0 0 0 4px ${cp}18` }}>
                {item.anno || i + 1}
              </div>
              <div style={{ paddingTop: '4px', flex: 1, minWidth: 0 }}>
                <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0A0A0A', margin: '0 0 5px', letterSpacing: '-.02em' }}>{item.titolo}</h4>
                <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.65', margin: 0, overflowWrap: 'break-word' }}>{item.testo}</p>
              </div>
            </div>
          </Animate>
        ))}
      </div>
    </Animate>
  )

  if (block.tipo === 'accordion') return (
    <Animate animation="fadeup">
      <div style={{ marginBottom: '24px' }}>
        {(block.items || []).map((item, i) => (
          <AccordionItem key={i} domanda={item.domanda} risposta={item.risposta} cp={cp} />
        ))}
      </div>
    </Animate>
  )

  if (block.tipo === 'video') {
    const embed = videoEmbedUrl(block.url)
    if (!embed) return null
    return (
      <Animate animation="fadein">
        <div style={{ marginBottom: '24px' }}>
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
            <iframe src={embed} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} allowFullScreen title="video" />
          </div>
          {block.didascalia && <p style={{ fontSize: '13px', color: '#9CA3AF', textAlign: 'center', marginTop: '8px', fontStyle: 'italic' }}>{block.didascalia}</p>}
        </div>
      </Animate>
    )
  }

  if (block.tipo === 'testimonial') return (
    <Animate animation="fadeup">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 270px), 1fr))', gap: '16px', marginBottom: '24px' }}>
        {(block.items || []).map((item, i) => (
          <Animate key={i} animation="fadeup" delay={i * 100}>
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '22px', position: 'relative' }}>
              <span style={{ fontSize: '36px', color: cp, opacity: .12, position: 'absolute', top: '10px', left: '18px', lineHeight: 1, fontFamily: 'serif' }}>"</span>
              <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.7', margin: '0 0 14px', position: 'relative', zIndex: 1, fontStyle: 'italic' }}>{item.testo}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: cp, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '800', fontSize: '13px', flexShrink: 0 }}>
                  {((item.nome || '?')[0] || '?').toUpperCase()}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#0A0A0A' }}>{item.nome}</p>
                  {item.ruolo && <p style={{ margin: 0, fontSize: '12px', color: '#9CA3AF' }}>{item.ruolo}</p>}
                </div>
              </div>
            </div>
          </Animate>
        ))}
      </div>
    </Animate>
  )

  if (block.tipo === 'countdown') return (
    <Animate animation="fadein">
      <div style={{ marginBottom: '24px' }}>
        <Countdown data={block.data} titolo={block.titolo} messaggio_scaduto={block.messaggio_scaduto} cp={cp} />
      </div>
    </Animate>
  )

  if (block.tipo === 'immagine') {
    const maxW = block.size === 'small' ? '33%' : block.size === 'medium' ? '60%' : '100%'
    const align = block.align || 'center'
    return (
      <Animate animation="fadein">
        <div style={{ marginBottom: '16px', textAlign: align }}>
          {block.src && <img src={block.src} alt={block.didascalia || ''} style={{ maxWidth: maxW, width: '100%', display: 'inline-block', borderRadius: '8px' }} />}
          {block.didascalia && <p style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '8px', fontStyle: 'italic' }}>{block.didascalia}</p>}
        </div>
      </Animate>
    )
  }

  if (block.tipo === 'separatore') return <hr style={{ border: 'none', borderTop: '1px solid #E5E7EB', margin: '32px 0' }} />

  if (block.tipo === 'programma') return <ProgrammaBlock block={block} cp={cp} />

  if (block.tipo === 'carosello') return <CaroselloBlock block={block} />

  if (block.tipo === 'social') return <SocialBlock block={block} cp={cp} />

  return null
}

// ── Programma evento ──────────────────────────────────────────────
function ProgrammaBlock({ block, cp }) {
  const cTitoli = block.colore_titoli || '#E91E8C'
  const cOrari  = block.colore_orari  || cp || '#003DA5'
  const voci    = block.voci || []

  // Icone inline per i tipi di voce
  const IconRegistrazione = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={cOrari} strokeWidth="2" strokeLinecap="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
  const IconPlay = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={cOrari} stroke="none">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  )
  const IconClose = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={cOrari} strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <line x1="9" y1="16" x2="15" y2="16"/>
    </svg>
  )
  const IconSession = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={cTitoli} strokeWidth="2.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 8 16 12 12 16"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  )
  const IconBookmark = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={cTitoli} strokeWidth="2" strokeLinecap="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    </svg>
  )
  const IconMic = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={cTitoli} strokeWidth="2" strokeLinecap="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
    </svg>
  )

  // Determina icona orario in base al contenuto
  function getOrarioIcon(voce) {
    const t = (voce.testo || '').toLowerCase()
    if (t.includes('registr') || t.includes('accredit')) return <IconRegistrazione />
    if (t.includes('chiusura') || t.includes('conclus')) return <IconClose />
    return <IconPlay />
  }

  return (
    <Animate animation="fadeup">
      <div style={{
        border: '1.5px dashed #D1D5DB',
        borderRadius: '16px',
        padding: '28px 24px',
        marginBottom: '24px',
        background: '#fff',
        fontFamily: 'Inter, sans-serif',
      }}>
        {/* Titolo sezione */}
        {block.titolo && (
          <h2 style={{
            textAlign: 'center',
            fontSize: 'clamp(20px,3.5vw,26px)',
            fontWeight: '900',
            color: cOrari,
            letterSpacing: '-.02em',
            margin: '0 0 24px',
          }}>
            {block.titolo}
          </h2>
        )}

        {/* Lista voci */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {voci.map((voce, i) => {
            if (voce.tipo === 'orario') return (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '10px 0', borderBottom: i < voci.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                <span style={{ flexShrink: 0, width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}>
                  {getOrarioIcon(voce)}
                </span>
                <div>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: cOrari, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                    {voce.orario}
                  </span>
                  {voce.testo && (
                    <span style={{ fontSize: '14px', fontWeight: '700', color: cOrari, marginLeft: '6px' }}>
                      - {voce.testo.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            )

            if (voce.tipo === 'sessione') return (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '14px 0', borderBottom: i < voci.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                <span style={{ flexShrink: 0, width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}>
                  <IconSession />
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: '800', color: cTitoli, textTransform: 'uppercase', letterSpacing: '.04em', lineHeight: 1.3 }}>
                    {voce.titolo}
                  </p>
                  {(voce.relatori || []).map((rel, ri) => (
                    <p key={ri} style={{ margin: '0 0 3px', fontSize: '14px', color: '#374151', lineHeight: 1.5 }}>
                      {rel.nome && <strong style={{ fontWeight: '700', color: '#0A0A0A' }}>{rel.nome}</strong>}
                      {rel.nome && rel.ruolo && <span style={{ color: '#9CA3AF', margin: '0 4px' }}>–</span>}
                      {rel.ruolo && <span style={{ color: '#6B7280' }}>{rel.ruolo}</span>}
                    </p>
                  ))}
                </div>
              </div>
            )

            if (voce.tipo === 'intermezzo') return (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '14px 0', borderBottom: i < voci.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                <span style={{ flexShrink: 0, width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}>
                  <IconBookmark />
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: '800', color: cTitoli, textTransform: 'uppercase', letterSpacing: '.04em', lineHeight: 1.3 }}>
                    {voce.titolo}
                  </p>
                  {(voce.relatori || []).map((rel, ri) => (
                    <p key={ri} style={{ margin: '0 0 3px', fontSize: '14px', color: '#374151', lineHeight: 1.5 }}>
                      {rel.nome && <strong style={{ fontWeight: '700', color: '#0A0A0A' }}>{rel.nome}</strong>}
                      {rel.nome && rel.ruolo && <span style={{ color: '#9CA3AF', margin: '0 4px' }}>–</span>}
                      {rel.ruolo && <span style={{ color: '#6B7280' }}>{rel.ruolo}</span>}
                    </p>
                  ))}
                </div>
              </div>
            )

            if (voce.tipo === 'modera') return (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '14px 0', borderBottom: i < voci.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                <span style={{ flexShrink: 0, width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}>
                  <IconMic />
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '800', color: cTitoli, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                    Modera
                  </p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#374151', lineHeight: 1.5 }}>
                    {voce.nome && <strong style={{ fontWeight: '700', color: '#0A0A0A' }}>{voce.nome}</strong>}
                    {voce.nome && voce.ruolo && <span style={{ color: '#9CA3AF', margin: '0 4px' }}>–</span>}
                    {voce.ruolo && <span style={{ color: '#6B7280' }}>{voce.ruolo}</span>}
                  </p>
                </div>
              </div>
            )

            return null
          })}
        </div>
      </div>
    </Animate>
  )
}

// ── Carosello ─────────────────────────────────────────────────────
function CaroselloBlock({ block }) {
  const [current, setCurrent] = useState(0)
  const imgs = (block.immagini || []).filter(i => i.src)
  if (!imgs.length) return null

  const ratio = block.rapporto === '16:9' ? '56.25%' : block.rapporto === '4:5' ? '125%' : '100%'

  const prev = () => setCurrent(c => (c - 1 + imgs.length) % imgs.length)
  const next = () => setCurrent(c => (c + 1) % imgs.length)

  return (
    <Animate animation="fadein">
      <div style={{ marginBottom: '24px', maxWidth: '600px', margin: '0 auto 24px', padding: '0 24px' }}>
        {/* Wrapper con frecce ai lati */}
        <div style={{ position: 'relative' }}>
          {/* Freccia sinistra */}
          {imgs.length > 1 && (
            <button onClick={prev} style={{
              position:'absolute', left:'-20px', top:'50%', transform:'translateY(-50%)',
              width:'40px', height:'40px', borderRadius:'50%',
              background:'#0A0A0A', border:'none', cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
              zIndex:3, boxShadow:'0 2px 8px rgba(0,0,0,0.35)',
              flexShrink:0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
          )}

          {/* Immagine principale */}
          <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', background: '#000' }}>
            <div style={{ position: 'relative', paddingBottom: ratio }}>
              <img
                src={imgs[current].src}
                alt={imgs[current].didascalia || ''}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity .3s' }}
              />
            </div>

            {/* Counter */}
            {imgs.length > 1 && (
              <div style={{ position:'absolute', top:'10px', right:'12px', background:'rgba(0,0,0,.55)', color:'#fff', fontSize:'12px', fontWeight:'600', padding:'3px 8px', borderRadius:'10px', backdropFilter:'blur(4px)' }}>
                {current + 1} / {imgs.length}
              </div>
            )}
          </div>

          {/* Freccia destra */}
          {imgs.length > 1 && (
            <button onClick={next} style={{
              position:'absolute', right:'-20px', top:'50%', transform:'translateY(-50%)',
              width:'40px', height:'40px', borderRadius:'50%',
              background:'#0A0A0A', border:'none', cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
              zIndex:3, boxShadow:'0 2px 8px rgba(0,0,0,0.35)',
              flexShrink:0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          )}
        </div>

        {/* Dots */}
        {imgs.length > 1 && (
          <div style={{ display:'flex', justifyContent:'center', gap:'6px', marginTop:'10px' }}>
            {imgs.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)} style={{ width: i === current ? '20px' : '8px', height:'8px', borderRadius:'4px', background: i === current ? '#0A0A0A' : '#D1D5DB', border:'none', cursor:'pointer', transition:'all .2s', padding:0 }} />
            ))}
          </div>
        )}

        {/* Thumbnail strip */}
        {imgs.length > 1 && (
          <div style={{ display:'flex', gap:'6px', marginTop:'8px', overflowX:'auto', paddingBottom:'4px' }}>
            {imgs.map((img, i) => (
              <button key={i} onClick={() => setCurrent(i)} style={{ flexShrink:0, width:'52px', height:'52px', borderRadius:'6px', overflow:'hidden', border:`2px solid ${i === current ? '#0A0A0A' : 'transparent'}`, padding:0, cursor:'pointer', transition:'border-color .2s' }}>
                <img src={img.src} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              </button>
            ))}
          </div>
        )}

        {/* Didascalia */}
        {(imgs[current].didascalia || block.didascalia) && (
          <p style={{ fontSize:'13px', color:'#9CA3AF', textAlign:'center', margin:'8px 0 0', fontStyle:'italic' }}>
            {imgs[current].didascalia || block.didascalia}
          </p>
        )}
      </div>
    </Animate>
  )
}

// ── Social & Condivisione ─────────────────────────────────────────
function SocialBlock({ block, cp }) {
  const [copied, setCopied] = useState(false)
  const pageUrl = typeof window !== 'undefined' ? window.location.href : ''
  const encoded = encodeURIComponent(pageUrl)
  const titolo  = encodeURIComponent(document?.title || 'CNA Roma')

  function copyLink() {
    navigator.clipboard.writeText(pageUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  const embedUrl = () => {
    const url = block.url_post || ''
    if (block.tipo_social === 'instagram') {
      // Trasforma URL post in URL embed
      const clean = url.replace(/\/$/, '')
      return clean + '/embed/'
    }
    if (block.tipo_social === 'facebook') {
      return `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(url)}&show_text=true&width=500`
    }
    if (block.tipo_social === 'x') {
      // Estrae tweet id
      const match = url.match(/status\/(\d+)/)
      if (match) return `https://platform.twitter.com/embed/Tweet.html?id=${match[1]}`
    }
    return null
  }

  const shareButtons = [
    { label:'WhatsApp', color:'#25D366', icon:<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>, href:`https://wa.me/?text=${titolo}%20${encoded}` },
    { label:'Email',     color:'#6B7280', icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/></svg>, href:`mailto:?subject=${titolo}&body=${encoded}` },
    { label:'Facebook',  color:'#1877F2', icon:<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>, href:`https://www.facebook.com/sharer/sharer.php?u=${encoded}` },
    { label:'X',         color:'#0A0A0A', icon:<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.632 5.905-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>, href:`https://x.com/intent/tweet?url=${encoded}&text=${titolo}` },
    { label: copied ? 'Copiato!' : 'Copia link', color: copied ? '#059669' : '#374151', icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>, onClick: copyLink },
  ]

  return (
    <Animate animation="fadeup">
      <div style={{ marginBottom:'24px' }}>
        {block.titolo && <h3 style={{ fontSize:'18px', fontWeight:'800', color:'#0A0A0A', textAlign:'center', margin:'0 0 20px', letterSpacing:'-.02em' }}>{block.titolo}</h3>}

        {/* Embed post social */}
        {block.url_post && block.tipo_social !== 'condivisione' && embedUrl() && (
          <div style={{ marginBottom:'20px', borderRadius:'12px', overflow:'hidden', border:'1px solid #E5E7EB', maxWidth:'540px', margin:'0 auto 20px' }}>
            <iframe
              src={embedUrl()}
              style={{ width:'100%', minHeight: block.tipo_social === 'instagram' ? '540px' : '400px', border:'none', display:'block' }}
              scrolling="no"
              allowTransparency={true}
              title="Post social"
            />
          </div>
        )}

        {/* Pulsanti condivisione */}
        {block.mostra_condivisione !== false && (
          <div>
            <p style={{ fontSize:'12px', fontWeight:'700', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.06em', textAlign:'center', margin:'0 0 12px' }}>Condividi</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', justifyContent:'center' }}>
              {shareButtons.map((btn, i) => (
                btn.href
                  ? <a key={i} href={btn.href} target="_blank" rel="noreferrer" style={{ display:'flex', alignItems:'center', gap:'7px', padding:'9px 16px', background:btn.color+'15', border:`1px solid ${btn.color}30`, borderRadius:'8px', textDecoration:'none', fontSize:'13px', fontWeight:'700', color:btn.color, transition:'all .15s', fontFamily:"'Inter',sans-serif" }}
                      onMouseEnter={e=>{e.currentTarget.style.background=btn.color+'25'}}
                      onMouseLeave={e=>{e.currentTarget.style.background=btn.color+'15'}}>
                      <span style={{ width:'18px', height:'18px', flexShrink:0 }}>{btn.icon}</span>
                      {btn.label}
                    </a>
                  : <button key={i} type="button" onClick={btn.onClick} style={{ display:'flex', alignItems:'center', gap:'7px', padding:'9px 16px', background:btn.color+'15', border:`1px solid ${btn.color}30`, borderRadius:'8px', fontSize:'13px', fontWeight:'700', color:btn.color, cursor:'pointer', fontFamily:"'Inter',sans-serif", transition:'all .15s' }}
                      onMouseEnter={e=>{e.currentTarget.style.background=btn.color+'25'}}
                      onMouseLeave={e=>{e.currentTarget.style.background=btn.color+'15'}}>
                      <span style={{ width:'18px', height:'18px', flexShrink:0 }}>{btn.icon}</span>
                      {btn.label}
                    </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Animate>
  )
}
