// Genera l'immagine di anteprima condivisione (1200x630) dell'hero, lato browser
import { supabase } from './supabase'

const W = 1200, H = 630

function loadImg(src) {
  return new Promise(res => {
    if (!src) return res(null)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => res(img)
    img.onerror = () => res(null)
    img.src = src + (src.includes('?') ? '&' : '?') + 'cors=1'
  })
}

function wrap(ctx, text, maxW) {
  const words = (text || '').split(/\s+/).filter(Boolean)
  const lines = []
  let cur = ''
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w
    if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w } else cur = t
  }
  if (cur) lines.push(cur)
  return lines
}

export async function renderHeroOg({ bg, bgColor, bgPosition, overlayColor, overlay, logo, titolo, titolo2, testo, titoloColore, titolo2Colore, maiuscolo }) {
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const ctx = c.getContext('2d')
  ctx.fillStyle = bgColor || '#000000'
  ctx.fillRect(0, 0, W, H)

  const bgImg = await loadImg(bg)
  if (bgImg) {
    const s = Math.max(W / bgImg.width, H / bgImg.height)
    const dw = bgImg.width * s, dh = bgImg.height * s
    const parts = String(bgPosition || '50% 50%').split(/\s+/).map(v => parseFloat(v))
    const px = isNaN(parts[0]) ? 0.5 : parts[0] / 100, py = isNaN(parts[1]) ? 0.5 : parts[1] / 100
    ctx.drawImage(bgImg, (W - dw) * px, (H - dh) * py, dw, dh)
  }
  if (overlay > 0) {
    ctx.globalAlpha = overlay
    ctx.fillStyle = overlayColor || '#000000'
    ctx.fillRect(0, 0, W, H)
    ctx.globalAlpha = 1
  }

  try { await Promise.all([document.fonts.load('800 60px Inter'), document.fonts.load('700 40px Inter'), document.fonts.load('400 26px Inter')]) } catch {}

  const logoImg = await loadImg(logo)
  const T = maiuscolo ? (titolo || '').toUpperCase() : (titolo || '')
  ctx.font = '800 66px Inter, Arial, sans-serif'
  const l1 = wrap(ctx, T, 1080).slice(0, 2)
  ctx.font = '700 38px Inter, Arial, sans-serif'
  const l2 = wrap(ctx, titolo2, 1040).slice(0, 2)
  ctx.font = '400 26px Inter, Arial, sans-serif'
  const l3 = wrap(ctx, testo, 1000).slice(0, 2)
  const logoH = logoImg ? 120 : 0
  const total = (logoImg ? logoH + 36 : 0) + l1.length * 72 + (l2.length ? 14 + l2.length * 48 : 0) + (l3.length ? 18 + l3.length * 36 : 0)
  let y = Math.max(20, (H - total) / 2)

  if (logoImg) {
    const lw = logoImg.width * (logoH / logoImg.height)
    ctx.drawImage(logoImg, (W - lw) / 2, y, lw, logoH)
    y += logoH + 36
  }
  ctx.textAlign = 'center'; ctx.textBaseline = 'top'
  ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 12
  ctx.font = '800 66px Inter, Arial, sans-serif'; ctx.fillStyle = titoloColore || '#FFFFFF'
  for (const l of l1) { ctx.fillText(l, W / 2, y); y += 72 }
  if (l2.length) {
    y += 14; ctx.font = '700 38px Inter, Arial, sans-serif'; ctx.fillStyle = titolo2Colore || '#FFFFFF'
    for (const l of l2) { ctx.fillText(l, W / 2, y); y += 48 }
  }
  if (l3.length) {
    y += 18; ctx.font = '400 26px Inter, Arial, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.85)'
    for (const l of l3) { ctx.fillText(l, W / 2, y); y += 36 }
  }
  return new Promise(res => c.toBlob(res, 'image/jpeg', 0.88))
}

const DEFAULT_LOGO = 'https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png'
const ov = lh => Math.min(90, parseInt(lh.overlay_opacita ?? '50', 10) || 0) / 100

// Genera, carica e salva l'immagine di anteprima di una landing
export async function updateLandingOg(d) {
  const lh = d.layout_hero || {}
  const blob = await renderHeroOg({
    bg: d.hero_immagine_url, bgColor: lh.hero_sfondo || '#003DA5', bgPosition: lh.bg_position,
    overlayColor: lh.overlay_colore, overlay: ov(lh),
    logo: d.logo_url || DEFAULT_LOGO,
    titolo: d.hero_titolo || d.titolo, titolo2: d.hero_titolo2, testo: d.hero_sottotitolo,
    titoloColore: lh.titolo_colore, titolo2Colore: lh.titolo2_colore, maiuscolo: lh.titolo_maiuscolo,
  })
  const url = await uploadOg(blob, 'lp-' + d.slug)
  if (url) await supabase.from('landing_pages').update({ og_image_url: url }).eq('id', d.id)
  return url
}

// Genera, carica e salva l'immagine di anteprima di un evento
export async function updateEventOg(ev) {
  const lh = ev.layout_hero || {}
  const blob = await renderHeroOg({
    bg: ev.immagine_hero, bgColor: lh.hero_sfondo || '#000000', bgPosition: lh.bg_position,
    overlayColor: lh.overlay_colore, overlay: ov(lh),
    logo: lh.mostra_logo === false ? null : (ev.logo_url || DEFAULT_LOGO),
    titolo: ev.titolo, titolo2: lh.titolo2, testo: ev.sottotitolo,
    titoloColore: lh.titolo_colore, titolo2Colore: lh.titolo2_colore, maiuscolo: lh.titolo_maiuscolo,
  })
  const url = await uploadOg(blob, 'ev-' + ev.slug)
  if (url) await supabase.from('events').update({ og_image_url: url }).eq('id', ev.id)
  return url
}

// Crea le anteprime mancanti per tutte le landing ed eventi (una volta per sessione)
let syncing = false
export async function syncMissingOg() {
  if (syncing) return
  syncing = true
  try {
    const [{ data: lps }, { data: evs }] = await Promise.all([
      supabase.from('landing_pages').select('*').is('og_image_url', null),
      supabase.from('events').select('*').is('og_image_url', null),
    ])
    for (const d of lps || []) { try { await updateLandingOg(d) } catch (e) { console.error('og lp', e) } }
    for (const ev of evs || []) { try { await updateEventOg(ev) } catch (e) { console.error('og ev', e) } }
  } catch (e) { console.error('og sync', e) }
}

export async function uploadOg(blob, name) {
  if (!blob) return null
  const path = `og/${name}-${Date.now()}.jpg`
  const { error } = await supabase.storage.from('eventi-immagini').upload(path, blob, { upsert: false, contentType: 'image/jpeg' })
  if (error) { console.error('og upload', error); return null }
  return supabase.storage.from('eventi-immagini').getPublicUrl(path).data.publicUrl
}
