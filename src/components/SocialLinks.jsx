/**
 * SocialLinks — icone social SVG linkate, usate in footer evento, landing page e MailUp.
 * Props:
 *   links: array da useSocial() [ {chiave, valore, attivo} ]
 *   size: numero px (default 24)
 *   gap: numero px (default 12)
 *   color: colore icone (default '#9CA3AF')
 *   hoverColor: colore hover (default brand del social)
 *   style: stile wrapper esterno
 */

// SVG paths per ogni social
const SOCIAL_META = {
  facebook:  {
    label: 'Facebook',
    color: '#1877F2',
    svg: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
  },
  instagram: {
    label: 'Instagram',
    color: '#E1306C',
    svg: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
  },
  x: {
    label: 'X (Twitter)',
    color: '#000000',
    svg: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
  },
  linkedin: {
    label: 'LinkedIn',
    color: '#0A66C2',
    svg: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
  },
  whatsapp: {
    label: 'WhatsApp',
    color: '#25D366',
    svg: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
  },
  youtube: {
    label: 'YouTube',
    color: '#FF0000',
    svg: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
  },
  tiktok: {
    label: 'TikTok',
    color: '#000000',
    svg: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.78a4.85 4.85 0 01-1.01-.09z"/></svg>
  },
  website: {
    label: 'Sito web',
    color: '#003DA5',
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
  },
}

// Normalizza URL: aggiunge https:// se mancante
function normalizeUrl(url, chiave) {
  if (!url) return '#'
  if (url.startsWith('http')) return url
  if (chiave === 'whatsapp') return `https://wa.me/${url.replace(/\D/g, '')}`
  return `https://${url}`
}

export default function SocialLinks({ links = [], size = 24, gap = 12, color = '#9CA3AF', style = {} }) {
  const attivi = links.filter(l => l.attivo && l.valore && l.valore.trim())
  if (!attivi.length) return null

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: `${gap}px`, ...style }}>
      {attivi.map(({ chiave, valore }) => {
        const meta = SOCIAL_META[chiave]
        if (!meta) return null
        return (
          <a
            key={chiave}
            href={normalizeUrl(valore, chiave)}
            target="_blank"
            rel="noopener noreferrer"
            title={meta.label}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: size, height: size, color,
              transition: 'color .15s, opacity .15s',
              textDecoration: 'none', flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = meta.color; e.currentTarget.style.opacity = '1' }}
            onMouseLeave={e => { e.currentTarget.style.color = color; e.currentTarget.style.opacity = '0.7' }}
          >
            <span style={{ width: size, height: size, display: 'block' }}>
              {meta.svg}
            </span>
          </a>
        )
      })}
    </div>
  )
}

// Genera HTML table-based per email (SVG non funziona in email — usa emoji/testo)
export function socialLinksEmailHtml(links, cp, F) {
  const attivi = (links || []).filter(l => l.attivo && l.valore && l.valore.trim())
  if (!attivi.length) return ''

  const EMOJI = {
    facebook: '📘', instagram: '📸', x: '𝕏', linkedin: '💼',
    whatsapp: '💬', youtube: '▶', tiktok: '🎵', website: '🌐',
  }

  const items = attivi.map(({ chiave, valore }) => {
    const meta = SOCIAL_META[chiave]
    if (!meta) return ''
    const url = normalizeUrl(valore, chiave)
    const emoji = EMOJI[chiave] || '🔗'
    return `<a href="${url}" style="display:inline-block;margin:0 6px;font-size:13px;color:${cp};text-decoration:none;font-family:${F};" target="_blank">${emoji} ${meta.label}</a>`
  }).filter(Boolean)

  if (!items.length) return ''
  return `<p style="margin:12px 0 0;text-align:center;font-family:${F};">${items.join('')}</p>`
}
