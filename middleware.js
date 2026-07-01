// Vercel Edge Middleware — intercetta bot social e inietta meta OG server-side
// Compatibile con Vercel SPA (Vite/React) senza Next.js

export const config = {
  matcher: ['/eventi/:slug+'],
}

const SOCIAL_BOTS = [
  'WhatsApp', 'facebookexternalhit', 'Twitterbot', 'LinkedInBot',
  'Slackbot', 'TelegramBot', 'Discordbot', 'Applebot',
]

const SUPABASE_URL = 'https://hnkhckcclgabunkqfmrz.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhua2hja2NjbGdhYnVua3FmbXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MDgyNjMsImV4cCI6MjA5NjE4NDI2M30.d3VA9FqBL7E5GRzKM_usMzl-4ZcsfAdH15DxJjvmou4'
const APP_URL = 'https://portale-eventi-cna.vercel.app'
const DEFAULT_IMG = 'https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png'

function esc(s) {
  return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

export default async function middleware(request) {
  const ua = request.headers.get('user-agent') || ''
  const isBot = SOCIAL_BOTS.some(bot => ua.includes(bot))

  if (!isBot) return // passa normalmente alla SPA

  const url = new URL(request.url)
  const slug = url.pathname.replace('/eventi/', '').replace(/\//g, '')
  if (!slug) return

  let ev = null
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/events?slug=eq.${slug}&select=titolo,sottotitolo,immagine_hero,luogo,slug&limit=1`,
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
    )
    const data = await r.json()
    ev = data?.[0]
  } catch {}

  if (!ev) return

  const title = esc(ev.titolo || 'Evento CNA Roma')
  const desc = esc(ev.sottotitolo || ev.luogo || 'Evento organizzato da CNA Roma')
  const img = ev.immagine_hero || DEFAULT_IMG
  const pageUrl = `${APP_URL}/eventi/${ev.slug}`

  const html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<title>${title} \u2014 CNA Roma</title>
<meta name="description" content="${desc}">
<meta property="og:type" content="website">
<meta property="og:url" content="${pageUrl}">
<meta property="og:title" content="${title} \u2014 CNA Roma">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:site_name" content="CNA Roma">
<meta property="og:locale" content="it_IT">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title} \u2014 CNA Roma">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${esc(img)}">
<meta http-equiv="refresh" content="0;url=${pageUrl}">
<link rel="canonical" href="${pageUrl}">
</head>
<body>
<p>Reindirizzamento a <a href="${pageUrl}">${title}</a>\u2026</p>
<script>window.location.replace('${pageUrl}')</script>
</body>
</html>`

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  })
}
