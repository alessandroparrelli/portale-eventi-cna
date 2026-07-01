// Vercel Serverless Function — intercetta bot social e restituisce HTML con meta OG
const SUPABASE_URL = 'https://hnkhckcclgabunkqfmrz.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhua2hja2NjbGdhYnVua3FmbXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDQ4MDkwNzEsImV4cCI6MjAyMDM4NTA3MX0.RJlE0XJfYSY9_tnhMYwBJBvGE_YN56eBPjjqQT5vBLo'
const APP_URL = 'https://portale-eventi-cna.vercel.app'
const DEFAULT_IMG = 'https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png'

function esc(s) {
  return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

export default async function handler(req, res) {
  const slug = req.query.slug
  if (!slug) return res.status(400).send('Missing slug')

  let ev = null
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/events?slug=eq.${slug}&select=titolo,sottotitolo,immagine_hero,luogo,slug&limit=1`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    })
    const data = await r.json()
    ev = data?.[0]
  } catch {}

  if (!ev) return res.redirect(302, `${APP_URL}/eventi/${slug}`)

  const title = esc(ev.titolo || 'Evento CNA Roma')
  const desc = esc(ev.sottotitolo || ev.luogo || 'Evento organizzato da CNA Roma')
  const img = ev.immagine_hero || DEFAULT_IMG
  const pageUrl = `${APP_URL}/eventi/${ev.slug}`

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300')
  res.send(`<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<title>${title} — CNA Roma</title>
<meta name="description" content="${desc}">
<meta property="og:type" content="website">
<meta property="og:url" content="${pageUrl}">
<meta property="og:title" content="${title} — CNA Roma">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:site_name" content="CNA Roma">
<meta property="og:locale" content="it_IT">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title} — CNA Roma">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${esc(img)}">
<meta http-equiv="refresh" content="0;url=${pageUrl}">
<link rel="canonical" href="${pageUrl}">
</head>
<body>
<p>Reindirizzamento a <a href="${pageUrl}">${title}</a>…</p>
<script>window.location.replace('${pageUrl}')</script>
</body>
</html>`)
}
