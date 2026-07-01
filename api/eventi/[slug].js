export const config = { runtime: 'edge' }

const SUPABASE_URL = 'https://hnkhckcclgabunkqfmrz.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhua2hja2NjbGdhYnVua3FmbXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MDgyNjMsImV4cCI6MjA5NjE4NDI2M30.d3VA9FqBL7E5GRzKM_usMzl-4ZcsfAdH15DxJjvmou4'
const APP_URL = 'https://portale-eventi-cna.vercel.app'
const DEFAULT_IMG = 'https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png'

const BOTS = ['whatsapp','facebookexternalhit','twitterbot','linkedinbot','slackbot','telegrambot','discordbot','applebot','facebot','ia_archiver']

function esc(s) {
  return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

export default async function handler(req) {
  const url = new URL(req.url)
  const slug = url.pathname.split('/').filter(Boolean).pop()
  const ua = (req.headers.get('user-agent') || '').toLowerCase()
  const isBot = BOTS.some(b => ua.includes(b))

  // Utenti normali → serve index.html (la SPA React)
  if (!isBot) {
    const spaRes = await fetch(`${APP_URL}/index.html`)
    const html = await spaRes.text()
    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' }
    })
  }

  // Bot social → HTML con meta OG dinamici
  let ev = null
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/events?slug=eq.${encodeURIComponent(slug)}&select=titolo,sottotitolo,immagine_hero,luogo,slug&limit=1`,
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
    )
    const data = await r.json()
    ev = Array.isArray(data) ? data[0] : null
  } catch {}

  const title   = esc(ev?.titolo || 'Evento CNA Roma')
  const desc    = esc(ev?.sottotitolo || ev?.luogo || 'Evento organizzato da CNA Roma')
  const img     = ev?.immagine_hero || DEFAULT_IMG
  const pageUrl = `${APP_URL}/eventi/${slug}`

  const html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<title>${title} — CNA Roma</title>
<meta name="description" content="${desc}">
<meta property="og:type"         content="website">
<meta property="og:url"          content="${pageUrl}">
<meta property="og:title"        content="${title} — CNA Roma">
<meta property="og:description"  content="${desc}">
<meta property="og:image"        content="${esc(img)}">
<meta property="og:image:width"  content="1200">
<meta property="og:image:height" content="630">
<meta property="og:site_name"    content="CNA Roma">
<meta name="twitter:card"        content="summary_large_image">
<meta name="twitter:title"       content="${title} — CNA Roma">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image"       content="${esc(img)}">
</head>
<body><p><a href="${pageUrl}">${title}</a></p></body>
</html>`

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    }
  })
}
