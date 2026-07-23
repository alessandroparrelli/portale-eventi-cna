import { useState } from 'react'

export default function ShareBar({ event, compact = false, tema = {} }) {
  const brandColor = tema.colore_pulsanti || tema.colore_primario || '#005AC9'
  const brandText  = tema.colore_testo_btn || '#FFFFFF'
  const [copied, setCopied] = useState(false)

  if (!event?.slug) return null

  const url   = `${window.location.origin}/eventi/${event.slug}`
  const title = event.titolo || 'Evento CNA Roma'
  const desc  = event.sottotitolo || ''
  const luogo = event.luogo || ''

  const msgLines = [title]
  if (desc)  msgLines.push(desc)
  if (luogo) msgLines.push(`📍 ${luogo}`)
  msgLines.push(url)
  const msgText = msgLines.join('\n')

  function handleWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(msgText)}`, '_blank', 'noopener')
  }

  function handleEmail() {
    const subject = encodeURIComponent(`${title} — CNA Roma`)
    const body    = encodeURIComponent(msgText)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = url; ta.style.cssText = 'position:fixed;opacity:0'
      document.body.appendChild(ta); ta.focus(); ta.select()
      document.execCommand('copy'); document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  /* ─── Versione COMPACT (inline, discreta) ─── */
  if (compact) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '8px', padding: '10px 24px 18px', flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '12px', color: '#9CA3AF', fontFamily: "'Outfit',sans-serif", fontWeight: '600', marginRight: '4px' }}>
          Condividi:
        </span>

        <button type="button" onClick={handleWhatsApp} title="Condividi su WhatsApp"
          style={compactBtn('#25D366', '#fff')}>
          <WhatsAppIcon size={14} />
          WhatsApp
        </button>

        <button type="button" onClick={handleEmail} title="Condividi via Email"
          style={compactBtn(brandColor, brandText)}>
          <EmailIcon size={14} />
          Email
        </button>

        <button type="button" onClick={handleCopy} title="Copia link"
          style={compactBtn(copied ? '#16A34A' : '#F3F4F6', copied ? '#fff' : '#374151')}>
          {copied ? <CheckIcon size={13} /> : <LinkIcon size={13} />}
          {copied ? 'Copiato!' : 'Copia link'}
        </button>
      </div>
    )
  }

  /* ─── Versione FOOTER (grande, centrata) ─── */
  return (
    <div style={{
      borderTop: 'none',
      padding: '20px 24px',
      textAlign: 'center',
      background: 'transparent',
    }}>
      <p style={{
        fontSize: '12px', fontWeight: '700', color: '#9CA3AF',
        textTransform: 'uppercase', letterSpacing: '.08em',
        margin: '0 0 12px', fontFamily: "'Outfit', sans-serif",
      }}>
        Condividi questo evento
      </p>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button type="button" onClick={handleWhatsApp} style={fullBtn('#25D366', '#fff')}>
          <WhatsAppIcon size={18} /> WhatsApp
        </button>
        <button type="button" onClick={handleEmail} style={fullBtn(brandColor, brandText)}>
          <EmailIcon size={17} /> Email
        </button>
        <button type="button" onClick={handleCopy}
          style={fullBtn(copied ? '#16A34A' : '#F3F4F6', copied ? '#fff' : '#374151')}>
          {copied ? <CheckIcon size={16} /> : <LinkIcon size={16} />}
          {copied ? 'Link copiato!' : 'Copia link'}
        </button>
      </div>
    </div>
  )
}

function compactBtn(bg, color) {
  return {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '6px 12px', borderRadius: '20px', border: 'none',
    background: bg, color,
    fontSize: '12px', fontWeight: '700',
    fontFamily: "'Outfit', sans-serif", cursor: 'pointer',
    transition: 'opacity .15s',
  }
}

function fullBtn(bg, color) {
  return {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    padding: '10px 18px', borderRadius: '8px', border: 'none',
    background: bg, color,
    fontSize: '14px', fontWeight: '700',
    fontFamily: "'Outfit', sans-serif", cursor: 'pointer',
  }
}

const WhatsAppIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)
const EmailIcon = ({ size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
)
const LinkIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
)
const CheckIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
