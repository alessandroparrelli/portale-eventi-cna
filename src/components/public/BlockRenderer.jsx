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
        <div style={{ width: '48px', height: '4px', background: cp, borderRadius: '2px', marginTop: '14px', marginLeft: block.allineamento === 'left' ? 0 : block.allineamento === 'right' ? 'auto' : 'auto', marginRight: block.allineamento === 'right' ? 0 : block.allineamento === 'left' ? 'auto' : 'auto' }} />
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

  return null
}
