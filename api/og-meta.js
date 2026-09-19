/**
 * Vercel Serverless Function — /api/og-meta
 * Serve HTML con meta tag Open Graph corretti per bot social
 * (WhatsApp, Telegram, Facebook, Twitter/X, iMessage, LinkedIn…)
 *
 * Viene chiamata solo per le route /eventi/:slug e /lp/:slug
 * tramite rewrite in vercel.json, ma solo quando il UA è un bot.
 */

const SUPABASE_URL     = process.env.VITE_SUPABASE_URL     || 'https://hnkhckcclgabunkqfmrz.supabase.co'
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhua2hja2NjbGdhYnVua3FmbXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MDgyNjMsImV4cCI6MjA5NjE4NDI2M30.d3VA9FqBL7E5GRzKM_usMzl-4ZcsfAdH15DxJjvmou4'
const DEFAULT_IMAGE    = 'https://portale-eventi-cna.vercel.app/cn-icon-512.png'
const SITE_URL         = 'https://portale-eventi-cna.vercel.app'

// User-Agent dei principali bot social
const BOT_UAS = [
  'whatsapp', 'facebookexternalhit', 'facebot', 'twitterbot',
  'telegrambot', 'linkedinbot', 'slackbot', 'discordbot',
  'applebot', 'iframely', 'embedly', 'quora link preview',
  'showyoubot', 'outbrain', 'pinterest', 'vkshare', 'w3c_validator',
  'baiduspider', 'googlebot', 'bingbot', 'rogerbot', 'bufferbot',
  'snapchat', 'viber', 'skype',
]

function isBot(ua) {
  if (!ua) return false
  const lower = ua.toLowerCase()
  return BOT_UAS.some(b => lower.includes(b))
}

function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

async function fetchEvent(slug) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/events?slug=eq.${encodeURIComponent(slug)}&select=titolo,sottotitolo,immagine_hero,data_inizio,luogo&limit=1`,
    { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }
  )
  if (!res.ok) return null
  const arr = await res.json()
  return arr?.[0] || null
}

async function fetchLanding(slug) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/landing_pages?slug=eq.${encodeURIComponent(slug)}&select=titolo,meta_descrizione,hero_img&limit=1`,
    { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }
  )
  if (!res.ok) return null
  const arr = await res.json()
  return arr?.[0] || null
}

function buildHtml({ title, description, image, url }) {
  const t = escHtml(title || 'CNA Roma')
  const d = escHtml(description || 'Evento organizzato da CNA Roma')
  const i = image || DEFAULT_IMAGE
  const u = escHtml(url)
  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8"/>
  <title>${t}</title>
  <meta name="description" content="${d}"/>
  <!-- Open Graph -->
  <meta property="og:type"        content="website"/>
  <meta property="og:site_name"   content="CNA Roma"/>
  <meta property="og:title"       content="${t}"/>
  <meta property="og:description" content="${d}"/>
  <meta property="og:image"       content="${escHtml(i)}"/>
  <meta property="og:image:width" content="1200"/>
  <meta property="og:image:height" content="630"/>
  <meta property="og:url"         content="${u}"/>
  <!-- Twitter / X -->
  <meta name="twitter:card"        content="summary_large_image"/>
  <meta name="twitter:title"       content="${t}"/>
  <meta name="twitter:description" content="${d}"/>
  <meta name="twitter:image"       content="${escHtml(i)}"/>
  <!-- Redirect al client-side React -->
  <meta http-equiv="refresh" content="0;url=${u}"/>
</head>
<body>
  <p><a href="${u}">${t}</a></p>
</body>
</html>`
}

export default async function handler(req, res) {
  const ua  = req.headers['user-agent'] || ''
  const url = req.url || ''

  // Estrai tipo e slug dall'URL: /api/og-meta?type=evento&slug=xxx
  const { searchParams } = new URL(url, SITE_URL)
  const type = searchParams.get('type') // 'evento' | 'lp'
  const slug = searchParams.get('slug')

  if (!slug) {
    res.status(400).send('Missing slug')
    return
  }

  // Se non è un bot, redirect 302 alla pagina SPA — il browser carica React normalmente
  if (!isBot(ua)) {
    const dest = type === 'lp' ? `/lp/${slug}` : `/eventi/${slug}`
    res.setHeader('Location', dest)
    res.status(302).end()
    return
  }

  // Bot: fetch dati e restituisci HTML con meta tag
  try {
    let data = null
    let pageUrl = ''

    if (type === 'lp') {
      data = await fetchLanding(slug)
      pageUrl = `${SITE_URL}/lp/${slug}`
      const html = buildHtml({
        title:       data?.titolo,
        description: data?.meta_descrizione,
        image:       data?.hero_img,
        url:         pageUrl,
      })
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=120')
      res.status(200).send(html)
    } else {
      data = await fetchEvent(slug)
      pageUrl = `${SITE_URL}/eventi/${slug}`

      // Descrizione arricchita con data e luogo
      let desc = data?.sottotitolo || ''
      if (data?.data_inizio) {
        const d = new Date(data.data_inizio).toLocaleDateString('it-IT', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit', timeZone:'Europe/Rome' })
        desc = desc ? `${desc} · ${d}` : d
      }
      if (data?.luogo) desc = desc ? `${desc} · ${data.luogo}` : data.luogo

      const html = buildHtml({
        title:       data?.titolo,
        description: desc || null,
        image:       data?.immagine_hero,
        url:         pageUrl,
      })
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=120')
      res.status(200).send(html)
    }
  } catch (err) {
    console.error('og-meta error:', err)
    // Fallback: redirect alla SPA
    const dest = type === 'lp' ? `/lp/${slug}` : `/eventi/${slug}`
    res.setHeader('Location', dest)
    res.status(302).end()
  }
}
