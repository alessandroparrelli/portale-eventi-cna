// Vercel Serverless Function: OG tags for crawlers (WhatsApp, Facebook, Twitter, Telegram)
// Browsers get redirected to the SPA

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hnkhckcclgabunkqfmrz.supabase.co'
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY
const SITE_URL = 'https://portale-eventi-cna.vercel.app'
const DEFAULT_IMAGE = SITE_URL + '/cn-icon-512.png'

const CRAWLERS = /whatsapp|facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|TelegramBot|Discordbot/i

function esc(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export default async function handler(req, res) {
  const { code } = req.query
  const ua = req.headers['user-agent'] || ''

  // Not a crawler → redirect to SPA
  if (!CRAWLERS.test(ua)) {
    res.writeHead(302, { Location: `${SITE_URL}/iscrizione/${code}` })
    return res.end()
  }

  let title = 'La mia iscrizione — CNA Roma'
  let description = 'Presenta il QR code all\'ingresso per il check-in'
  let image = DEFAULT_IMAGE

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(code)
    const filter = isUuid ? `id=eq.${code}` : `codice_iscrizione=ilike.${code}`
    const regRes = await fetch(`${SUPABASE_URL}/rest/v1/registrations?${filter}&select=nome,cognome,ragione_sociale,event_id,numero_posto,qr_code&limit=1`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    })
    const regs = await regRes.json()
    if (regs?.length > 0) {
      const r = regs[0]
      const nome = [r.nome, r.cognome].filter(Boolean).join(' ')
      const evRes = await fetch(`${SUPABASE_URL}/rest/v1/events?id=eq.${r.event_id}&select=titolo,immagine_hero,luogo&limit=1`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      })
      const evs = await evRes.json()
      const ev = evs?.[0]
      if (ev) {
        title = `${nome} — ${ev.titolo || 'Evento CNA Roma'}`
        description = r.numero_posto
          ? `Posto: ${r.numero_posto} | ${ev.luogo || 'Evento CNA Roma'}`
          : `Iscrizione confermata | ${ev.luogo || 'Evento CNA Roma'}`
        if (ev.immagine_hero) image = ev.immagine_hero
      }
    }
  } catch (e) {
    console.error('OG fetch error:', e)
  }

  const html = `<!DOCTYPE html><html><head>
<meta charset="UTF-8">
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:image" content="${esc(image)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${SITE_URL}/iscrizione/${code}" />
<meta property="og:site_name" content="cnaeventi — CNA Roma" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
<meta name="twitter:image" content="${esc(image)}" />
<title>${esc(title)}</title>
<meta http-equiv="refresh" content="0;url=${SITE_URL}/iscrizione/${code}" />
</head><body><p>Reindirizzamento...</p></body></html>`

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=300')
  return res.status(200).send(html)
}
