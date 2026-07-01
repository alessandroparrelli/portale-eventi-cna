import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT  = join(__dir, '..')

// Usa la service role key come variabile d'ambiente Vercel,
// con fallback alla anon key per build locali
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hnkhckcclgabunkqfmrz.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
                     process.env.VITE_SUPABASE_ANON_KEY ||
                     'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhua2hja2NjbGdhYnVua3FmbXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MDgyNjMsImV4cCI6MjA5NjE4NDI2M30.d3VA9FqBL7E5GRzKM_usMzl-4ZcsfAdH15DxJjvmou4'
const APP_URL      = 'https://portale-eventi-cna.vercel.app'
const DEFAULT_IMG  = 'https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png'

function esc(s) {
  return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

function buildHtml(spaHtml, ev) {
  const pageUrl = `${APP_URL}/eventi/${ev.slug}`
  const title   = esc(ev.titolo || 'Evento CNA Roma')
  const desc    = esc(ev.sottotitolo || ev.luogo || 'Evento organizzato da CNA Roma')
  const img     = ev.immagine_hero || DEFAULT_IMG

  const ogTags = `
    <meta property="og:type"         content="website">
    <meta property="og:url"          content="${pageUrl}">
    <meta property="og:title"        content="${title} — CNA Roma">
    <meta property="og:description"  content="${desc}">
    <meta property="og:image"        content="${esc(img)}">
    <meta property="og:image:width"  content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:type"   content="image/jpeg">
    <meta property="og:site_name"    content="CNA Roma">
    <meta property="og:locale"       content="it_IT">
    <meta name="twitter:card"        content="summary_large_image">
    <meta name="twitter:title"       content="${title} — CNA Roma">
    <meta name="twitter:description" content="${desc}">
    <meta name="twitter:image"       content="${esc(img)}">
    <meta name="description"         content="${desc}">
    <title>${title} — CNA Roma</title>`

  return spaHtml
    .replace(/<title>[^<]*<\/title>/, '')
    .replace('<head>', `<head>${ogTags}`)
}

async function main() {
  const spaPath = join(ROOT, 'dist', 'index.html')
  if (!existsSync(spaPath)) { console.error('dist/index.html non trovato'); process.exit(1) }
  const spaHtml = readFileSync(spaPath, 'utf8')

  console.log('Scarico eventi da Supabase...')
  let events = []
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/events?stato=in.(\"pubblicato\",\"chiuso\")&select=slug,titolo,sottotitolo,immagine_hero,luogo`,
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
    events = await res.json()
    console.log(`${events.length} eventi trovati`)
  } catch(e) {
    // Non blocca il build — la SPA funziona comunque, solo senza OG statici
    console.warn('Impossibile scaricare eventi:', e.message)
    console.warn('Il build continua senza pagine OG statiche.')
    return
  }

  for (const ev of events) {
    if (!ev.slug) continue
    const dir = join(ROOT, 'dist', 'eventi', ev.slug)
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'index.html'), buildHtml(spaHtml, ev), 'utf8')
    console.log(`  /eventi/${ev.slug}/`)
  }
  console.log('OG pages generate.')
}

main().catch(e => { console.warn('generate-og-pages:', e.message) })
