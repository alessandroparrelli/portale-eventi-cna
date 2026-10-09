/**
 * /api/og-image?slug=xxx  — immagine anteprima condivisione (1200x630)
 * Riproduce l'hero della landing: sfondo, overlay, logo, titoli.
 */
import { readFileSync } from 'fs'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'


const SUPABASE_URL = 'https://hnkhckcclgabunkqfmrz.supabase.co'
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhua2hja2NjbGdhYnVua3FmbXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MDgyNjMsImV4cCI6MjA5NjE4NDI2M30.d3VA9FqBL7E5GRzKM_usMzl-4ZcsfAdH15DxJjvmou4'
const DEFAULT_LOGO = 'https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png'

const h = (type, props, ...children) => ({ type, props: { ...props, children: children.length <= 1 ? children[0] : children } })

function font(w) {
  try { return readFileSync(new URL(`./_fonts/inter-latin-${w}-normal.woff`, import.meta.url)) } catch { return null }
}

function hexToRgba(hex, a) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '')
  if (!m) return `rgba(0,0,0,${a})`
  const n = parseInt(m[1], 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

export async function GET(req) {
  const sp = new URL(req.url).searchParams
  const slug = sp.get('slug') || ''
  if (sp.get('type') === 'evento') return renderEvento(slug)
  const r = await fetch(`${SUPABASE_URL}/rest/v1/landing_pages?slug=eq.${encodeURIComponent(slug)}&select=titolo,hero_titolo,hero_titolo2,hero_sottotitolo,hero_immagine_url,logo_url,layout_hero&limit=1`,
    { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } })
  const lp = (r.ok ? (await r.json())[0] : null) || {}
  const lh = lp.layout_hero || {}
  const ov = Math.min(90, Math.max(0, parseInt(lh.overlay_opacita ?? '50', 10))) / 100
  const titolo = lp.hero_titolo || lp.titolo || 'CNA Roma'
  const sotto = lp.hero_titolo2 || lp.hero_sottotitolo || ''

  const f400 = font(400), f800 = font(800)
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

  const svg = await satori(tree, { width: 1200, height: 630, fonts })
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng()
  return new Response(png, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=300, s-maxage=300' } })
}

// Evento: sfondo nero con titolo e sottotitolo
async function renderEvento(slug) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/events?slug=eq.${encodeURIComponent(slug)}&select=titolo,sottotitolo&limit=1`,
    { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } })
  const ev = (r.ok ? (await r.json())[0] : null) || {}
  const titolo = ev.titolo || 'CNA Roma'
  const sotto = ev.sottotitolo || ''
  const fonts = []
  const f400 = font(400), f800 = font(800)
  if (f400) fonts.push({ name: 'Inter', data: f400, weight: 400, style: 'normal' })
  if (f800) fonts.push({ name: 'Inter', data: f800, weight: 800, style: 'normal' })
  const tree = h('div', { style: { width: '1200px', height: '630px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 80px', backgroundColor: '#000000', fontFamily: 'Inter', textAlign: 'center' } },
    h('div', { style: { fontSize: titolo.length > 40 ? '60px' : '76px', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.08, letterSpacing: '-2px', textAlign: 'center' } }, titolo),
    sotto ? h('div', { style: { fontSize: '36px', fontWeight: 400, color: 'rgba(255,255,255,0.8)', marginTop: '26px', lineHeight: 1.3, textAlign: 'center' } }, sotto) : null,
  )
  const svg = await satori(tree, { width: 1200, height: 630, fonts })
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng()
  return new Response(png, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=300, s-maxage=300' } })
}
