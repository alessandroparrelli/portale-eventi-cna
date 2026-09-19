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
    <div style={{ border: '1px solid #E5E7EB', borderRadius: '20px', overflow: 'hidden', marginBottom: '8px' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', background: open ? '#EBF0FA' : '#fff', border: 'none',
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
    <div style={{ textAlign: 'center', padding: '32px', background: '#F9FAFB', borderRadius: '20px', color: '#9CA3AF', fontSize: '14px' }}>
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

// ── Wrapper Sezione ────────────────────────────────────────────────
// Avvolge ogni blocco con sfondo, padding e larghezza personalizzabili
function SezioneWrapper({ sezione, cp, children }) {
  if (!sezione || !sezione.sfondo) return <>{children}</>
  const PADDING = { S: '24px', M: '48px', L: '72px', XL: '96px', nessuno: '0' }
  const RADIUS  = { nessuno: '0', S: '8px', M: '16px', L: '24px' }
  const MAX_W   = { contenuto: '800px', ampia: '1100px', piena: '100%' }
  const pv = PADDING[sezione.padding_v || 'M']
  const bdr = RADIUS[sezione.radius || 'nessuno']
  const mxw = MAX_W[sezione.larghezza || 'contenuto']
  const colore = sezione.colore_testo || (
    ['#003DA5','#0F172A','#5B5FEF','#1E293B','#0A0A0A'].includes(sezione.sfondo) ? '#FFFFFF' : undefined
  )
  return (
    <div style={{
      background: sezione.sfondo,
      borderRadius: bdr,
      width: '100%',
      marginBottom: '0',
    }}>
      <div style={{
        maxWidth: mxw,
        margin: '0 auto',
        padding: `${pv} clamp(16px, 4vw, 40px)`,
        color: colore,
        '--cp-override': colore,
      }}>
        {children}
      </div>
    </div>
  )
}

// ── Relatori Block ─────────────────────────────────────────────────
function RelatoriBlock({ block, cp }) {
  const items = block.items || []
  const colonne = block.colonne || 2
  const stile = block.stile_card || 'verticale'
  const minW = colonne === 1 ? '100%' : colonne === 4 ? '160px' : colonne === 3 ? '200px' : '240px'

  return (
    <Animate animation="fadeup">
      <div style={{ marginBottom: '24px' }}>
        {block.titolo && (
          <h2 style={{ fontSize: 'clamp(20px,3.5vw,32px)', fontWeight: '900', color: '#0A0A0A', textAlign: 'center', margin: '0 0 32px', letterSpacing: '-.03em' }}>
            {block.titolo}
          </h2>
        )}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${minW}), 1fr))`,
          gap: '20px',
        }}>
          {items.map((item, i) => (
            <Animate key={i} animation="fadeup" delay={i * 80}>
              {stile === 'orizzontale' ? (
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', background: '#fff', border: '1px solid #E5E7EB', borderRadius: '20px', padding: '18px', transition: 'box-shadow .2s, transform .2s' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 24px ${cp}18`; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}>
                  {/* Avatar orizzontale */}
                  <div style={{ flexShrink: 0 }}>
                    {item.foto_url ? (
                      <img src={item.foto_url} alt={item.nome} style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: `3px solid ${cp}20` }} />
                    ) : (
                      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: `linear-gradient(135deg, ${cp}, ${cp}99)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '900', fontSize: '22px', flexShrink: 0 }}>
                        {(item.nome || '?')[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 2px', fontSize: '16px', fontWeight: '800', color: '#0A0A0A', letterSpacing: '-.02em' }}>{item.nome}</p>
                    {item.ruolo && <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: '700', color: cp }}>{item.ruolo}</p>}
                    {item.ente && <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#6B7280' }}>{item.ente}</p>}
                    {item.bio && <p style={{ margin: 0, fontSize: '13px', color: '#374151', lineHeight: '1.6' }}>{item.bio}</p>}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', background: '#fff', border: '1px solid #E5E7EB', borderRadius: '20px', padding: '24px 18px', transition: 'box-shadow .2s, transform .2s' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 24px ${cp}18`; e.currentTarget.style.transform = 'translateY(-3px)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}>
                  {/* Avatar verticale */}
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
                    {item.foto_url ? (
                      <img src={item.foto_url} alt={item.nome} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: `3px solid ${cp}30`, boxShadow: `0 4px 16px ${cp}20` }} />
                    ) : (
                      <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: `linear-gradient(135deg, ${cp}, ${cp}99)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '900', fontSize: '28px', boxShadow: `0 4px 16px ${cp}30` }}>
                        {(item.nome || '?')[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <p style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '800', color: '#0A0A0A', letterSpacing: '-.02em' }}>{item.nome}</p>
                  {item.ruolo && <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: '700', color: cp }}>{item.ruolo}</p>}
                  {item.ente && <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#9CA3AF' }}>{item.ente}</p>}
                  {item.bio && <p style={{ margin: 0, fontSize: '13px', color: '#374151', lineHeight: '1.65', textAlign: 'left' }}>{item.bio}</p>}
                </div>
              )}
            </Animate>
          ))}
        </div>
      </div>
    </Animate>
  )
}

// ── Pricing Block ──────────────────────────────────────────────────
function PricingBlock({ block, cp, formTarget }) {
  const options = block.options || []
  return (
    <Animate animation="fadeup">
      <div style={{ marginBottom: '24px' }}>
        {block.titolo && (
          <h2 style={{ fontSize: 'clamp(20px,3.5vw,32px)', fontWeight: '900', color: '#0A0A0A', textAlign: 'center', margin: '0 0 32px', letterSpacing: '-.03em' }}>
            {block.titolo}
          </h2>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, 240px), 1fr))`, gap: '20px', alignItems: 'stretch' }}>
          {options.map((opt, i) => {
            const c = opt.colore || cp
            const ev = opt.evidenziata
            return (
              <Animate key={i} animation="fadeup" delay={i * 100}>
                <div style={{
                  border: `2px solid ${ev ? c : '#E5E7EB'}`,
                  borderRadius: '20px',
                  padding: '28px 24px',
                  background: ev ? `linear-gradient(160deg, ${c}08, ${c}03)` : '#fff',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  boxSizing: 'border-box',
                  boxShadow: ev ? `0 8px 32px ${c}25` : 'none',
                  transition: 'box-shadow .2s, transform .2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 12px 36px ${c}30`; e.currentTarget.style.transform = 'translateY(-3px)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = ev ? `0 8px 32px ${c}25` : 'none'; e.currentTarget.style.transform = 'translateY(0)' }}>
                  {ev && (
                    <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: c, color: '#fff', fontSize: '11px', fontWeight: '800', padding: '4px 14px', borderRadius: '20px', letterSpacing: '.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                      Consigliato
                    </div>
                  )}
                  {/* Badge etichetta */}
                  <div style={{ marginBottom: '16px' }}>
                    <span style={{ display: 'inline-block', background: `${c}18`, color: c, fontSize: '12px', fontWeight: '800', padding: '4px 12px', borderRadius: '20px', letterSpacing: '.06em', textTransform: 'uppercase' }}>
                      {opt.etichetta || ''}
                    </span>
                  </div>
                  {/* Prezzo */}
                  <p style={{ fontSize: 'clamp(28px,5vw,44px)', fontWeight: '900', color: c, letterSpacing: '-.04em', margin: '0 0 4px', lineHeight: 1 }}>
                    {opt.prezzo || ''}
                  </p>
                  {opt.unita && <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 20px', fontWeight: '500' }}>{opt.unita}</p>}
                  {/* Separatore */}
                  <hr style={{ border: 'none', borderTop: `1px solid ${c}20`, margin: '0 0 20px' }} />
                  {/* Lista inclusi */}
                  <ul style={{ listStyle: 'none', margin: '0 0 24px', padding: 0, flex: 1 }}>
                    {(opt.inclusi || []).filter(v => v.trim()).map((voce, j) => (
                      <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px', fontSize: '14px', color: '#374151', lineHeight: '1.5' }}>
                        <span style={{ flexShrink: 0, marginTop: '2px', color: c }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </span>
                        {voce}
                      </li>
                    ))}
                  </ul>
                  {/* CTA */}
                  {opt.cta && (
                    <a href={formTarget}
                      style={{
                        display: 'block', textAlign: 'center', background: ev ? c : 'transparent',
                        color: ev ? '#fff' : c, border: `2px solid ${c}`,
                        borderRadius: '20px', padding: '13px 24px',
                        fontSize: '14px', fontWeight: '800', textDecoration: 'none',
                        transition: 'all .15s', marginTop: 'auto',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = c; e.currentTarget.style.color = '#fff' }}
                      onMouseLeave={e => { e.currentTarget.style.background = ev ? c : 'transparent'; e.currentTarget.style.color = ev ? '#fff' : c }}>
                      {opt.cta} →
                    </a>
                  )}
                </div>
              </Animate>
            )
          })}
        </div>
      </div>
    </Animate>
  )
}

// ── Block Renderer principale ─────────────────────────────────────
export default function BlockRenderer({ block, cp = '#003DA5', formTarget = '#lp-form' }) {
  if (!block) return null

  if (block.tipo === 'testo') return (
    <SezioneWrapper sezione={block.sezione} cp={cp}>
      <Animate animation="fadeup">
        <div className="rich-content" style={{ marginBottom: '16px' }} dangerouslySetInnerHTML={{ __html: block.html || '' }} />
      </Animate>
    </SezioneWrapper>
  )

  if (block.tipo === 'titolo') {
    const tcol = (block.sezione?.colore_testo) || '#0A0A0A'
    const tsub = (block.sezione?.colore_testo) ? (block.sezione.colore_testo === '#FFFFFF' ? 'rgba(255,255,255,.75)' : '#6B7280') : '#6B7280'
    return (
      <SezioneWrapper sezione={block.sezione} cp={cp}>
        <Animate animation={block.animazione || 'fadeup'}>
          <div className="lp-blocco-titolo" style={{ textAlign: block.allineamento || 'center', marginBottom: '32px', marginTop: '8px' }}>
            <h2 className="lp-section-title" style={{ fontSize: 'clamp(22px,4vw,38px)', fontWeight: '900', color: tcol, letterSpacing: '-.03em', margin: '0 0 8px', lineHeight: 1.1 }}>{block.testo}</h2>
            {block.sottotitolo && <p className="lp-section-sub" style={{ fontSize: 'clamp(13px,2vw,17px)', color: tsub, margin: 0, lineHeight: 1.6 }}>{block.sottotitolo}</p>}
          </div>
        </Animate>
      </SezioneWrapper>
    )
  }

  if (block.tipo === 'stats') {
    const numCol = (block.sezione?.colore_testo) || (block.colore || cp)
    const labCol = (block.sezione?.colore_testo === '#FFFFFF') ? 'rgba(255,255,255,.7)' : '#6B7280'
    return (
      <SezioneWrapper sezione={block.sezione} cp={cp}>
        <Animate animation="fadein">
          <div className="lp-stats" style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'center', padding: '32px 0', marginBottom: '16px' }}>
            {(block.items || []).map((item, i) => (
              <Animate key={i} animation="fadeup" delay={i * 100}>
                <div style={{ textAlign: 'center', flex: '1 1 80px' }}>
                  <p style={{ fontSize: 'clamp(32px,6vw,52px)', fontWeight: '900', color: numCol, letterSpacing: '-.04em', margin: '0 0 4px', lineHeight: 1 }}>
                    {block.animato !== false ? <AnimatedNumber target={item.num || item.numero || '0'} /> : (item.num || item.numero)}
                  </p>
                  <p style={{ fontSize: '12px', color: labCol, fontWeight: '700', margin: 0, textTransform: 'uppercase', letterSpacing: '.05em' }}>{item.label}</p>
                </div>
              </Animate>
            ))}
          </div>
        </Animate>
      </SezioneWrapper>
    )
  }

  if (block.tipo === 'griglia') {
    const cols = block.cols || block.colonne || []
    const cardBg = (block.sezione?.sfondo && ['#003DA5','#0F172A','#5B5FEF'].includes(block.sezione.sfondo)) ? 'rgba(255,255,255,0.12)' : '#fff'
    const cardBorder = (block.sezione?.sfondo && ['#003DA5','#0F172A','#5B5FEF'].includes(block.sezione.sfondo)) ? 'rgba(255,255,255,0.2)' : '#E5E7EB'
    const titCol = (block.sezione?.colore_testo) || '#0A0A0A'
    const tesCol = (block.sezione?.colore_testo === '#FFFFFF') ? 'rgba(255,255,255,.75)' : '#6B7280'
    return (
      <SezioneWrapper sezione={block.sezione} cp={cp}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '16px', marginBottom: '24px' }}>
          {cols.map((col, i) => (
            <Animate key={i} animation="fadeup" delay={i * 80}>
              <div
                style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '20px', padding: '22px', height: '100%', boxSizing: 'border-box', transition: 'box-shadow .2s, transform .2s' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 24px ${cp}20`; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                {col.icona && <div style={{ marginBottom: '10px' }}><IconDisplay iconId={col.icona} color={col.icona_colore||cp} size={32} /></div>}
                {col.titolo && <h3 style={{ fontSize: '16px', fontWeight: '800', color: titCol, margin: '0 0 8px', letterSpacing: '-.02em' }}>{col.titolo}</h3>}
                {col.testo && <p style={{ fontSize: '14px', color: tesCol, lineHeight: '1.65', margin: 0 }}>{col.testo}</p>}
              </div>
            </Animate>
          ))}
        </div>
      </SezioneWrapper>
    )
  }

  if (block.tipo === 'badge_list') {
    const colonne = block.colonne || 2
    const badgeBg = (block.sezione?.sfondo && ['#003DA5','#0F172A','#5B5FEF'].includes(block.sezione.sfondo)) ? 'rgba(255,255,255,0.12)' : '#fff'
    const badgeBorder = (block.sezione?.sfondo && ['#003DA5','#0F172A','#5B5FEF'].includes(block.sezione.sfondo)) ? 'rgba(255,255,255,0.2)' : '#E5E7EB'
    const badgeTxt = (block.sezione?.colore_testo) || '#374151'
    return (
      <SezioneWrapper sezione={block.sezione} cp={cp}>
        <Animate animation="fadeup">
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${colonne === 1 ? '100%' : colonne === 3 ? '150px' : '210px'}), 1fr))`, gap: '10px', marginBottom: '24px' }}>
            {(block.items || []).map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: badgeBg, border: `1px solid ${badgeBorder}`, borderRadius: '20px' }}>
                <IconDisplay iconId={item.icona||'check'} color={item.icona_colore||block.colore||cp} size={20} />
                <span style={{ fontSize: '14px', color: badgeTxt, fontWeight: '500' }}>{item.testo}</span>
              </div>
            ))}
          </div>
        </Animate>
      </SezioneWrapper>
    )
  }

  if (block.tipo === 'cta') {
    const br = block.stile === 'pill' ? '999px' : '8px'
    const btnBg = block.stile === 'contorno' ? 'transparent' : (block.colore || cp)
    const btnColor = block.stile === 'contorno' ? (block.colore || cp) : '#fff'
    const btnBorder = block.stile === 'contorno' ? `2px solid ${block.colore || cp}` : 'none'
    return (
      <SezioneWrapper sezione={block.sezione} cp={cp}>
        <Animate animation="fadein">
          <div style={{ background: `linear-gradient(135deg, ${cp}10, ${cp}06)`, border: `1px solid ${cp}25`, borderRadius: '16px', padding: '36px 24px', textAlign: 'center', marginBottom: '24px' }}>
            {block.titolo && <h2 style={{ fontSize: 'clamp(18px,3vw,28px)', fontWeight: '900', color: '#0A0A0A', letterSpacing: '-.03em', margin: '0 0 20px' }}>{block.titolo}</h2>}
            <a href={formTarget} style={{ display: 'inline-block', background: btnBg, color: btnColor, border: btnBorder, borderRadius: br, padding: '14px 36px', fontSize: '15px', fontWeight: '800', textDecoration: 'none', transition: 'transform .15s,box-shadow .15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 20px ${cp}40` }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
              {block.testo_btn || block.testo || 'Iscriviti \u2192'}
            </a>
          </div>
        </Animate>
      </SezioneWrapper>
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
      <SezioneWrapper sezione={block.sezione} cp={cp}>
        <Animate animation="slidein">
          <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: '20px', padding: '16px 20px', marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            {block.icona && <span style={{ fontSize: '18px', flexShrink: 0 }}>{block.icona}</span>}
            <p style={{ margin: 0, fontSize: '14px', color: c.color, lineHeight: '1.6', fontWeight: '500' }}>{block.testo}</p>
          </div>
        </Animate>
      </SezioneWrapper>
    )
  }

  if (block.tipo === 'timeline') return (
    <SezioneWrapper sezione={block.sezione} cp={cp}>
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
                  <h4 style={{ fontSize: '16px', fontWeight: '800', color: (block.sezione?.colore_testo) || '#0A0A0A', margin: '0 0 5px', letterSpacing: '-.02em' }}>{item.titolo}</h4>
                  <p style={{ fontSize: '14px', color: (block.sezione?.colore_testo === '#FFFFFF') ? 'rgba(255,255,255,.75)' : '#6B7280', lineHeight: '1.65', margin: 0, overflowWrap: 'break-word' }}>{item.testo}</p>
                </div>
              </div>
            </Animate>
          ))}
        </div>
      </Animate>
    </SezioneWrapper>
  )

  if (block.tipo === 'accordion') return (
    <SezioneWrapper sezione={block.sezione} cp={cp}>
      <Animate animation="fadeup">
        <div style={{ marginBottom: '24px' }}>
          {(block.items || []).map((item, i) => (
            <AccordionItem key={i} domanda={item.domanda} risposta={item.risposta} cp={cp} />
          ))}
        </div>
      </Animate>
    </SezioneWrapper>
  )

  if (block.tipo === 'video') {
    const embed = videoEmbedUrl(block.url)
    if (!embed) return null
    return (
      <SezioneWrapper sezione={block.sezione} cp={cp}>
        <Animate animation="fadein">
          <div style={{ marginBottom: '24px' }}>
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: '20px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
              <iframe src={embed} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} allowFullScreen title="video" />
            </div>
            {block.didascalia && <p style={{ fontSize: '13px', color: '#9CA3AF', textAlign: 'center', marginTop: '8px', fontStyle: 'italic' }}>{block.didascalia}</p>}
          </div>
        </Animate>
      </SezioneWrapper>
    )
  }

  if (block.tipo === 'testimonial') return (
    <SezioneWrapper sezione={block.sezione} cp={cp}>
      <Animate animation="fadeup">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 270px), 1fr))', gap: '16px', marginBottom: '24px' }}>
          {(block.items || []).map((item, i) => (
            <Animate key={i} animation="fadeup" delay={i * 100}>
              <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '20px', padding: '22px', position: 'relative' }}>
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
    </SezioneWrapper>
  )

  if (block.tipo === 'countdown') return (
    <SezioneWrapper sezione={block.sezione} cp={cp}>
      <Animate animation="fadein">
        <div style={{ marginBottom: '24px' }}>
          <Countdown data={block.data} titolo={block.titolo} messaggio_scaduto={block.messaggio_scaduto} cp={cp} />
        </div>
      </Animate>
    </SezioneWrapper>
  )

  if (block.tipo === 'immagine') {
    const maxW = block.size === 'small' ? '33%' : block.size === 'medium' ? '60%' : '100%'
    const align = block.align || 'center'
    return (
      <SezioneWrapper sezione={block.sezione} cp={cp}>
        <Animate animation="fadein">
          <div style={{ marginBottom: '16px', textAlign: align }}>
            {block.src && <img src={block.src} alt={block.didascalia || ''} style={{ maxWidth: maxW, width: '100%', display: 'inline-block', borderRadius: '20px' }} />}
            {block.didascalia && <p style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '8px', fontStyle: 'italic' }}>{block.didascalia}</p>}
          </div>
        </Animate>
      </SezioneWrapper>
    )
  }

  if (block.tipo === 'separatore') return <hr style={{ border: 'none', borderTop: '1px solid #E5E7EB', margin: '32px 0' }} />

  if (block.tipo === 'programma') return (
    <SezioneWrapper sezione={block.sezione} cp={cp}>
      <ProgrammaBlock block={block} cp={cp} />
    </SezioneWrapper>
  )

  if (block.tipo === 'carosello') return (
    <SezioneWrapper sezione={block.sezione} cp={cp}>
      <CaroselloBlock block={block} />
    </SezioneWrapper>
  )

  if (block.tipo === 'social') return (
    <SezioneWrapper sezione={block.sezione} cp={cp}>
      <SocialBlock block={block} cp={cp} />
    </SezioneWrapper>
  )

  if (block.tipo === 'relatori') return (
    <SezioneWrapper sezione={block.sezione} cp={cp}>
      <RelatoriBlock block={block} cp={cp} />
    </SezioneWrapper>
  )

  if (block.tipo === 'pricing') return (
    <SezioneWrapper sezione={block.sezione} cp={cp}>
      <PricingBlock block={block} cp={cp} formTarget={formTarget} />
    </SezioneWrapper>
  )

  if (block.tipo === 'bottoni') return (
    <SezioneWrapper sezione={block.sezione} cp={cp}>
      <BottoniBlock block={block} cp={cp} />
    </SezioneWrapper>
  )

  if (block.tipo === 'ciclo_webinar') return (
    <SezioneWrapper sezione={block.sezione} cp={cp}>
      <CicloWebinarBlock block={block} cp={cp} />
    </SezioneWrapper>
  )

  if (block.tipo === 'mappa') return (
    <SezioneWrapper sezione={block.sezione} cp={cp}>
      <MappaBlock block={block} cp={cp} />
    </SezioneWrapper>
  )

  if (block.tipo === 'nav_ancorata') return <NavAncoraBlock block={block} cp={cp} />

  if (block.tipo === 'colonne_miste') return (
    <SezioneWrapper sezione={block.sezione} cp={cp}>
      <ColonneMisteBlock block={block} cp={cp} />
    </SezioneWrapper>
  )

  if (block.tipo === 'hero_interno') return <HeroInternoBlock block={block} cp={cp} formTarget={formTarget} />

  if (block.tipo === 'numeri_icona') return (
    <SezioneWrapper sezione={block.sezione} cp={cp}>
      <NumeriIconaBlock block={block} cp={cp} />
    </SezioneWrapper>
  )

  return null
}

// ── Bottoni Block ──────────────────────────────────────────────────
function BottoniBlock({ block, cp }) {
  const items = block.items || []
  const align = block.allineamento || 'center'
  return (
    <Animate animation="fadeup">
      <div style={{ marginBottom: '24px' }}>
        {block.titolo && (
          <p style={{ fontSize: '12px', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.06em', textAlign: align, margin: '0 0 14px' }}>
            {block.titolo}
          </p>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center' }}>
          {items.map((btn, i) => {
            const c = btn.colore || cp
            const bg = btn.stile === 'pieno' ? c : btn.stile === 'ghost' ? 'transparent' : 'transparent'
            const color = btn.stile === 'pieno' ? '#fff' : c
            const border = btn.stile === 'ghost' ? 'none' : `2px solid ${c}`
            return (
              <a key={i} href={btn.url || '#'} target={btn.target || '_blank'} rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 22px', background: bg, color, border, borderRadius: '999px', fontSize: '14px', fontWeight: '700', textDecoration: 'none', transition: 'all .15s', fontFamily: "'Outfit',sans-serif" }}
                onMouseEnter={e => { e.currentTarget.style.background = c; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 16px ${c}40` }}
                onMouseLeave={e => { e.currentTarget.style.background = bg; e.currentTarget.style.color = color; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
                {/* Icona inline per tipo comune */}
                {btn.icona === 'download' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>}
                {btn.icona === 'video' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>}
                {btn.icona === 'link' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>}
                {btn.icona === 'doc' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
                {btn.testo}
              </a>
            )
          })}
        </div>
      </div>
    </Animate>
  )
}

// ── Ciclo Webinar Block ────────────────────────────────────────────
function CicloWebinarBlock({ block, cp }) {
  const edizioni = block.edizioni || []
  const prossimi = edizioni.filter(e => e.stato !== 'passato')
  const passati  = edizioni.filter(e => e.stato === 'passato')

  function EdCard({ ed, isProssimo }) {
    return (
      <Animate animation="fadeup">
        <div style={{
          border: isProssimo ? `2px solid ${cp}` : '1px solid #E5E7EB',
          borderRadius: '20px',
          padding: '24px',
          background: isProssimo ? `linear-gradient(135deg,${cp}06,${cp}02)` : '#fff',
          marginBottom: '16px',
        }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Badge data */}
            <div style={{ flexShrink: 0, background: isProssimo ? cp : '#F3F4F6', color: isProssimo ? '#fff' : '#6B7280', borderRadius: '12px', padding: '8px 14px', textAlign: 'center', minWidth: '80px' }}>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: '800', letterSpacing: '.02em' }}>{ed.data || '—'}</p>
            </div>
            {/* Contenuto */}
            <div style={{ flex: 1, minWidth: '200px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0A0A0A', margin: '0 0 4px', letterSpacing: '-.02em', lineHeight: 1.3 }}>{ed.titolo}</h3>
              {ed.relatore && (
                <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 12px', fontWeight: '500' }}>
                  <strong style={{ color: cp }}>Con </strong>{ed.relatore}
                </p>
              )}
              {/* Link per edizioni passate */}
              {!isProssimo && (ed.url_video || ed.url_materiale || ed.url_materiale2) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                  {ed.url_video && (
                    <a href={ed.url_video} target="_blank" rel="noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: '999px', fontSize: '12px', fontWeight: '700', textDecoration: 'none' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      Guarda la registrazione
                    </a>
                  )}
                  {ed.url_materiale && (
                    <a href={ed.url_materiale} target="_blank" rel="noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', borderRadius: '999px', fontSize: '12px', fontWeight: '700', textDecoration: 'none' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      {ed.label_materiale || 'Scarica il materiale'}
                    </a>
                  )}
                  {ed.url_materiale2 && (
                    <a href={ed.url_materiale2} target="_blank" rel="noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', borderRadius: '999px', fontSize: '12px', fontWeight: '700', textDecoration: 'none' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      {ed.label_materiale2 || 'Secondo materiale'}
                    </a>
                  )}
                </div>
              )}
              {isProssimo && (
                <span style={{ display: 'inline-block', background: `${cp}18`, color: cp, fontSize: '11px', fontWeight: '800', padding: '3px 10px', borderRadius: '999px', letterSpacing: '.06em', textTransform: 'uppercase' }}>
                  In arrivo
                </span>
              )}
            </div>
          </div>
        </div>
      </Animate>
    )
  }

  return (
    <div style={{ marginBottom: '24px' }}>
      {block.titolo && (
        <h2 style={{ fontSize: 'clamp(20px,3.5vw,30px)', fontWeight: '900', color: '#0A0A0A', margin: '0 0 24px', letterSpacing: '-.03em' }}>
          {block.titolo}
        </h2>
      )}
      {prossimi.length > 0 && (
        <>
          {(passati.length > 0 || block.label_prossimo) && (
            <p style={{ fontSize: '11px', fontWeight: '700', color: cp, textTransform: 'uppercase', letterSpacing: '.08em', margin: '0 0 12px' }}>
              {block.label_prossimo || 'Prossimo appuntamento'}
            </p>
          )}
          {prossimi.map((ed, i) => <EdCard key={i} ed={ed} isProssimo />)}
        </>
      )}
      {passati.length > 0 && (
        <>
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.08em', margin: `${prossimi.length ? '24px' : '0'} 0 12px` }}>
            {block.label_passati || 'Appuntamenti passati'}
          </p>
          {passati.map((ed, i) => <EdCard key={i} ed={ed} isProssimo={false} />)}
        </>
      )}
    </div>
  )
}

// ── Mappa Block ────────────────────────────────────────────────────
function MappaBlock({ block, cp }) {
  const indirizzo = block.indirizzo || ''
  const encodedAddr = encodeURIComponent(indirizzo)
  const zoom = block.zoom || '15'
  const h = parseInt(block.altezza || '340')
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddr}`
  const embedUrl = `https://maps.google.com/maps?q=${encodedAddr}&z=${zoom}&output=embed`

  if (!indirizzo) return (
    <div style={{ height: '200px', background: '#F3F4F6', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: '14px', marginBottom: '24px' }}>
      Imposta un indirizzo nell'editor
    </div>
  )

  return (
    <Animate animation="fadein">
      <div style={{ marginBottom: '24px' }}>
        {block.titolo && (
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0A0A0A', margin: '0 0 16px', letterSpacing: '-.02em' }}>{block.titolo}</h3>
        )}
        <div style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid #E5E7EB', boxShadow: '0 4px 16px rgba(0,0,0,.08)' }}>
          <iframe
            src={embedUrl}
            width="100%" height={h}
            style={{ border: 'none', display: 'block' }}
            allowFullScreen loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Mappa"
          />
        </div>
        {(block.testo || block.mostra_link !== false) && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
            {block.testo && <p style={{ margin: 0, fontSize: '14px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={cp} strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {block.testo}
            </p>}
            {block.mostra_link !== false && (
              <a href={mapsUrl} target="_blank" rel="noreferrer"
                style={{ fontSize: '13px', fontWeight: '700', color: cp, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                Apri in Google Maps
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
            )}
          </div>
        )}
      </div>
    </Animate>
  )
}

// ── Nav Ancorata Block ─────────────────────────────────────────────
function NavAncoraBlock({ block, cp }) {
  const voci = block.voci || []
  const [active, setActive] = useState('')
  const sfondo = block.sfondo || cp
  const colTesto = block.colore_testo || '#FFFFFF'

  useEffect(() => {
    const ids = voci.map(v => v.ancora).filter(Boolean)
    if (!ids.length) return
    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) })
      },
      { rootMargin: '-40% 0px -55% 0px' }
    )
    ids.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el) })
    return () => obs.disconnect()
  }, [])

  function scrollTo(ancora) {
    const el = document.getElementById(ancora)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div style={{
      position: block.sticky !== false ? 'sticky' : 'relative',
      top: 0,
      zIndex: 50,
      background: sfondo,
      boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 clamp(16px,4vw,40px)', display: 'flex', gap: '0', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {voci.map((v, i) => {
          const isActive = active === v.ancora
          return (
            <button key={i} type="button" onClick={() => scrollTo(v.ancora)}
              style={{
                flexShrink: 0,
                padding: '14px 20px',
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? `3px solid ${colTesto}` : '3px solid transparent',
                color: isActive ? colTesto : `${colTesto}BB`,
                fontSize: '13px',
                fontWeight: isActive ? '800' : '600',
                cursor: 'pointer',
                fontFamily: "'Outfit',sans-serif",
                letterSpacing: '.01em',
                transition: 'all .2s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = colTesto }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = `${colTesto}BB` }}>
              {v.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
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
        border: block.cornice_stile === 'none' ? 'none' : `${block.cornice_spessore ?? 2.5}px ${block.cornice_stile || 'dotted'} ${block.cornice_colore || '#D1D5DB'}`,
        borderRadius: `${block.cornice_radius ?? 16}px`,
        padding: '28px 24px',
        marginBottom: '24px',
        background: block.sfondo || '#ffffff',
        fontFamily: 'Inter, sans-serif',
        boxShadow: block.cornice_stile === 'none' ? '0 2px 12px rgba(0,0,0,0.08)' : 'none',
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
          <div style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden', background: '#000' }}>
            <div style={{ position: 'relative', paddingBottom: ratio }}>
              <img
                src={imgs[current].src}
                alt={imgs[current].didascalia || ''}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity .3s' }}
              />
            </div>

            {/* Counter */}
            {imgs.length > 1 && (
              <div style={{ position:'absolute', top:'10px', right:'12px', background:'rgba(0,0,0,.55)', color:'#fff', fontSize:'12px', fontWeight:'600', padding:'3px 8px', borderRadius:'20px', backdropFilter:'blur(4px)' }}>
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
              <button key={i} onClick={() => setCurrent(i)} style={{ width: i === current ? '20px' : '8px', height:'8px', borderRadius:'20px', background: i === current ? '#0A0A0A' : '#D1D5DB', border:'none', cursor:'pointer', transition:'all .2s', padding:0 }} />
            ))}
          </div>
        )}

        {/* Thumbnail strip */}
        {imgs.length > 1 && (
          <div style={{ display:'flex', gap:'6px', marginTop:'8px', overflowX:'auto', paddingBottom:'4px' }}>
            {imgs.map((img, i) => (
              <button key={i} onClick={() => setCurrent(i)} style={{ flexShrink:0, width:'52px', height:'52px', borderRadius:'20px', overflow:'hidden', border:`2px solid ${i === current ? '#0A0A0A' : 'transparent'}`, padding:0, cursor:'pointer', transition:'border-color .2s' }}>
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
          <div style={{ marginBottom:'20px', borderRadius:'20px', overflow:'hidden', border:'1px solid #E5E7EB', maxWidth:'540px', margin:'0 auto 20px' }}>
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
                  ? <a key={i} href={btn.href} target="_blank" rel="noreferrer" style={{ display:'flex', alignItems:'center', gap:'7px', padding:'9px 16px', background:btn.color+'15', border:`1px solid ${btn.color}30`, borderRadius:'20px', textDecoration:'none', fontSize:'13px', fontWeight:'700', color:btn.color, transition:'all .15s', fontFamily:"'Outfit',sans-serif" }}
                      onMouseEnter={e=>{e.currentTarget.style.background=btn.color+'25'}}
                      onMouseLeave={e=>{e.currentTarget.style.background=btn.color+'15'}}>
                      <span style={{ width:'18px', height:'18px', flexShrink:0 }}>{btn.icon}</span>
                      {btn.label}
                    </a>
                  : <button key={i} type="button" onClick={btn.onClick} style={{ display:'flex', alignItems:'center', gap:'7px', padding:'9px 16px', background:btn.color+'15', border:`1px solid ${btn.color}30`, borderRadius:'20px', fontSize:'13px', fontWeight:'700', color:btn.color, cursor:'pointer', fontFamily:"'Outfit',sans-serif", transition:'all .15s' }}
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

// ── Colonne Miste Block ────────────────────────────────────────────
function ColonnaContent({ col, cp }) {
  if (!col) return null
  if (col.tipo === 'testo') return <div className="rich-content" dangerouslySetInnerHTML={{ __html: col.html || '' }} />
  if (col.tipo === 'immagine') return col.src
    ? <img src={col.src} alt={col.didascalia||''} style={{ width:'100%', borderRadius:'16px', display:'block' }} />
    : <div style={{ background:'#F3F4F6', borderRadius:'16px', height:'200px', display:'flex', alignItems:'center', justifyContent:'center', color:'#9CA3AF', fontSize:'13px' }}>Nessuna immagine</div>
  if (col.tipo === 'video') {
    const embed = videoEmbedUrl(col.url)
    if (!embed) return null
    return <div style={{ position:'relative', paddingBottom:'56.25%', height:0, borderRadius:'16px', overflow:'hidden' }}>
      <iframe src={embed} style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', border:'none' }} allowFullScreen title="video" />
    </div>
  }
  if (col.tipo === 'stats') return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:'20px' }}>
      {(col.items||[]).map((item,i)=>(
        <div key={i} style={{ textAlign:'center', flex:'1 1 80px' }}>
          <p style={{ fontSize:'clamp(28px,5vw,44px)', fontWeight:'900', color:cp, letterSpacing:'-.04em', margin:'0 0 4px', lineHeight:1 }}>
            <AnimatedNumber target={item.num||'0'} />
          </p>
          <p style={{ fontSize:'12px', color:'#6B7280', fontWeight:'700', margin:0, textTransform:'uppercase', letterSpacing:'.05em' }}>{item.label}</p>
        </div>
      ))}
    </div>
  )
  if (col.tipo === 'badge_list') return (
    <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
      {(col.items||[]).map((item,i)=>(
        <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 14px', background:'#fff', border:'1px solid #E5E7EB', borderRadius:'12px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={cp} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span style={{ fontSize:'14px', color:'#374151', fontWeight:'500' }}>{item.testo}</span>
        </div>
      ))}
    </div>
  )
  return null
}

function ColonneMisteBlock({ block, cp }) {
  const rapporto = block.rapporto || '50-50'
  const [left, right] = rapporto.split('-').map(n => parseInt(n))
  const gap = block.gap || '40'
  return (
    <Animate animation="fadeup">
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display:'grid', gridTemplateColumns:`${left}fr ${right}fr`, gap:`${gap}px`, alignItems:'center' }}
          className="lp-colonne-miste">
          <div style={{ minWidth:0 }}><ColonnaContent col={block.sinistra} cp={cp} /></div>
          <div style={{ minWidth:0 }}><ColonnaContent col={block.destra} cp={cp} /></div>
        </div>
      </div>
    </Animate>
  )
}

// ── Hero Interno Block ─────────────────────────────────────────────
function HeroInternoBlock({ block, cp, formTarget }) {
  const h = parseInt(block.altezza || '280')
  const overlayPct = parseInt(block.overlay_opacita || '60') / 100
  const align = block.allineamento || 'center'
  const colTesto = block.colore_testo || '#FFFFFF'
  const hasBg = !!block.sfondo_immagine
  return (
    <Animate animation="fadein">
      <div style={{
        position:'relative', minHeight:`${h}px`,
        display:'flex', flexDirection:'column',
        alignItems: align === 'left' ? 'flex-start' : 'center',
        justifyContent:'center',
        padding:'clamp(40px,8vw,72px) clamp(24px,6vw,64px)',
        background: hasBg ? `url(${block.sfondo_immagine}) center/cover no-repeat` : (block.sfondo_colore || cp),
        marginBottom:'0', textAlign:align, overflow:'hidden',
      }}>
        {(hasBg || overlayPct > 0) && <div style={{ position:'absolute', inset:0, background:`rgba(0,0,0,${overlayPct})` }} />}
        <div style={{ position:'relative', zIndex:1, maxWidth:'680px', width:'100%', margin:align==='center'?'0 auto':'0' }}>
          {block.titolo && <h2 style={{ fontSize:'clamp(22px,4vw,40px)', fontWeight:'900', color:colTesto, margin:'0 0 12px', letterSpacing:'-.04em', lineHeight:1.1 }}>{block.titolo}</h2>}
          {block.sottotitolo && <p style={{ fontSize:'clamp(14px,2vw,18px)', color:`${colTesto}CC`, margin:'0 0 28px', lineHeight:1.7 }}>{block.sottotitolo}</p>}
          {block.cta_testo && (
            <a href={block.cta_url || formTarget}
              style={{ display:'inline-block', background:'#fff', color:block.sfondo_colore||cp, borderRadius:'999px', padding:'13px 32px', fontSize:'15px', fontWeight:'800', textDecoration:'none', transition:'transform .15s,box-shadow .15s' }}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.3)'}}
              onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none'}}>
              {block.cta_testo} {'\u2192'}
            </a>
          )}
        </div>
      </div>
    </Animate>
  )
}

// ── Numeri Icona Block ─────────────────────────────────────────────
function NumeriIconaBlock({ block, cp }) {
  const items = block.items || []
  return (
    <Animate animation="fadein">
      <div style={{ display:'grid', gridTemplateColumns:`repeat(auto-fit,minmax(min(100%,160px),1fr))`, gap:'24px', padding:'32px 0', marginBottom:'16px' }}>
        {items.map((item, i) => (
          <Animate key={i} animation="fadeup" delay={i*100}>
            <div style={{ textAlign:'center' }}>
              <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'52px', height:'52px', borderRadius:'14px', background:`${item.icona_colore||cp}15`, marginBottom:'12px' }}>
                <IconDisplay iconId={item.icona||'star'} color={item.icona_colore||cp} size={26} />
              </div>
              <p style={{ fontSize:'clamp(28px,5vw,46px)', fontWeight:'900', color:item.icona_colore||cp, letterSpacing:'-.04em', margin:'0 0 4px', lineHeight:1 }}>
                {block.animato!==false ? <AnimatedNumber target={item.num||'0'} /> : (item.num||'0')}
              </p>
              <p style={{ fontSize:'12px', color:'#6B7280', fontWeight:'700', margin:0, textTransform:'uppercase', letterSpacing:'.05em' }}>{item.label}</p>
            </div>
          </Animate>
        ))}
      </div>
    </Animate>
  )
}
