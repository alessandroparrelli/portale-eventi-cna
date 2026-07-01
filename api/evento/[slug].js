// Vercel Serverless Function — /eventi/:slug
// Bot social → HTML statico con meta OG dinamici
// Utenti normali → HTML della SPA (stesso index.html)

const SUPABASE_URL = 'https://hnkhckcclgabunkqfmrz.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhua2hja2NjbGdhYnVua3FmbXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MDgyNjMsImV4cCI6MjA5NjE4NDI2M30.d3VA9FqBL7E5GRzKM_usMzl-4ZcsfAdH15DxJjvmou4'
const APP_URL = 'https://portale-eventi-cna.vercel.app'
const DEFAULT_IMG = 'https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png'

const BOTS = ['whatsapp','facebookexternalhit','twitterbot','linkedinbot','slackbot','telegrambot','discordbot','applebot','facebot','ia_archiver','baiduspider','googlebot']

function esc(s) {
  return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

// HTML della SPA — stessa struttura di index.html ma con i meta dinamici
function spaHtml(title, desc, img, pageUrl, cnaAnonKey) {
  return `<!DOCTYPE html>
<html lang="it">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover" />
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
    <meta property="og:locale"       content="it_IT">
    <meta name="twitter:card"        content="summary_large_image">
    <meta name="twitter:title"       content="${title} — CNA Roma">
    <meta name="twitter:description" content="${desc}">
    <meta name="twitter:image"       content="${esc(img)}">
    <link rel="canonical"  href="${pageUrl}">
    <link rel="icon"       type="image/x-icon"   href="/favicon.ico" />
    <link rel="icon"       type="image/png" sizes="32x32" href="/favicon-32.png" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Eventi CNA" />
    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#003DA5" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`
}

export default async function handler(req, res) {
  const { slug } = req.query
  const ua = (req.headers['user-agent'] || '').toLowerCase()
  const isBot = BOTS.some(b => ua.includes(b))
  const pageUrl = `${APP_URL}/eventi/${slug}`

  // Carica dati evento (sia per bot che per utenti con meta dinamici)
  let ev = null
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/events?slug=eq.${encodeURIComponent(slug)}&select=titolo,sottotitolo,immagine_hero,luogo,slug&limit=1`,
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
    )
    const data = await r.json()
    ev = Array.isArray(data) ? data[0] : null
  } catch {}

  const title = esc(ev?.titolo || 'Evento CNA Roma')
  const desc  = esc(ev?.sottotitolo || ev?.luogo || 'Evento organizzato da CNA Roma')
  const img   = ev?.immagine_hero || DEFAULT_IMG

  res.setHeader('Content-Type', 'text/html; charset=utf-8')

  if (isBot) {
    // Bot: HTML minimale con solo i meta OG + redirect
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300')
    return res.status(200).send(`<!DOCTYPE html>
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
<meta property="og:locale"       content="it_IT">
<meta name="twitter:card"        content="summary_large_image">
<meta name="twitter:title"       content="${title} — CNA Roma">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image"       content="${esc(img)}">
<link rel="canonical" href="${pageUrl}">
</head>
<body><p><a href="${pageUrl}">${title}</a></p></body>
</html>`)
  }

  // Utente normale: SPA con meta dinamici già incorporati
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
  return res.status(200).send(spaHtml(title, desc, img, pageUrl))
}
