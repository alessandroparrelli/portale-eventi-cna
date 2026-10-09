/**
 * /api/og-image?slug=xxx  — immagine anteprima condivisione (1200x630)
 * Riproduce l'hero della landing: sfondo, overlay, logo, titoli.
 */
import { ImageResponse } from '@vercel/og'

export const config = { runtime: 'edge' }

const SUPABASE_URL = 'https://hnkhckcclgabunkqfmrz.supabase.co'
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhua2hja2NjbGdhYnVua3FmbXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MDgyNjMsImV4cCI6MjA5NjE4NDI2M30.d3VA9FqBL7E5GRzKM_usMzl-4ZcsfAdH15DxJjvmou4'
const DEFAULT_LOGO = 'https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png'

const h = (type, props, ...children) => ({ type, props: { ...props, children: children.length <= 1 ? children[0] : children } })

async function font(w) {
  try {
    const r = await fetch(`https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-${w}-normal.ttf`)
    return r.ok ? await r.arrayBuffer() : null
  } catch { return null }
}

function hexToRgba(hex, a) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '')
  if (!m) return `rgba(0,0,0,${a})`
  const n = parseInt(m[1], 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

export default async function handler(req) {
  const slug = new URL(req.url).searchParams.get('slug') || ''
  const r = await fetch(`${SUPABASE_URL}/rest/v1/landing_pages?slug=eq.${encodeURIComponent(slug)}&select=titolo,hero_titolo,hero_titolo2,hero_sottotitolo,hero_immagine_url,logo_url,layout_hero&limit=1`,
    { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } })
  const lp = (r.ok ? (await r.json())[0] : null) || {}
  const lh = lp.layout_hero || {}
  const ov = Math.min(90, Math.max(0, parseInt(lh.overlay_opacita ?? '50', 10))) / 100
  const titolo = lp.hero_titolo || lp.titolo || 'CNA Roma'
  const sotto = lp.hero_titolo2 || lp.hero_sottotitolo || ''

  const [f400, f800] = await Promise.all([font(400), font(800)])
  const fonts = []
  if (f400) fonts.push({ name: 'Inter', data: f400, weight: 400, style: 'normal' })
  if (f800) fonts.push({ name: 'Inter', data: f800, weight: 800, style: 'normal' })

  const bg = lp.hero_immagine_url
    ? { backgroundImage: `url(${lp.hero_immagine_url})`, backgroundSize: '1200px 630px', backgroundPosition: 'center' }
    : { backgroundColor: lh.hero_sfondo || '#003DA5' }

  const tree = h('div', { style: { width: '1200px', height: '630px', display: 'flex', position: 'relative', fontFamily: 'Inter', ...bg } },
    h('div', { style: { position: 'absolute', top: 0, left: 0, width: '1200px', height: '630px', backgroundColor: hexToRgba(lh.overlay_colore || '#000000', ov) } }),
    h('div', { style: { position: 'relative', width: '1200px', height: '630px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 70px', textAlign: 'center' } },
      h('img', { src: lp.logo_url || DEFAULT_LOGO, height: 150, style: { height: '150px', objectFit: 'contain', marginBottom: '44px' } }),
      h('div', { style: { fontSize: titolo.length > 32 ? '62px' : '74px', fontWeight: 800, color: lh.titolo_colore || '#FFFFFF', lineHeight: 1.05, letterSpacing: '-2px', textAlign: 'center' } }, titolo),
      sotto ? h('div', { style: { fontSize: '38px', fontWeight: 400, color: lh.titolo2_colore || '#FFFFFF', marginTop: '22px', textAlign: 'center' } }, sotto) : null,
    ),
  )

  return new ImageResponse(tree, {
    width: 1200, height: 630, fonts: fonts.length ? fonts : undefined,
    headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' },
  })
}
