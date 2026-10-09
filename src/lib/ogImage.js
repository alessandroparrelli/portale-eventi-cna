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

export async function renderHeroOg({ bg, bgColor, bgPosition, overlayColor, overlay, logo, titolo, sottotitolo, titoloColore, sottotitoloColore }) {
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const ctx = c.getContext('2d')
  ctx.fillStyle = bgColor || '#000000'
  ctx.fillRect(0, 0, W, H)

  const bgImg = await loadImg(bg)
  if (bgImg) {
    const s = Math.max(W / bgImg.width, H / bgImg.height)
    const dw = bgImg.width * s, dh = bgImg.height * s
    const [px, py] = String(bgPosition || '50% 50%').split(/\s+/).map(v => (parseFloat(v) || 50) / 100)
    ctx.drawImage(bgImg, (W - dw) * px, (H - dh) * (isNaN(py) ? 0.5 : py), dw, dh)
  }
  if (overlay > 0) {
    ctx.globalAlpha = overlay
    ctx.fillStyle = overlayColor || '#000000'
    ctx.fillRect(0, 0, W, H)
    ctx.globalAlpha = 1
  }

  try { await document.fonts.load('800 60px Inter'); await document.fonts.load('400 30px Inter') } catch {}

  const logoImg = await loadImg(logo)
  ctx.font = '800 64px Inter, Arial, sans-serif'
  const tLines = wrap(ctx, titolo, 1060).slice(0, 2)
  ctx.font = '400 34px Inter, Arial, sans-serif'
  const sLines = wrap(ctx, sottotitolo, 1000).slice(0, 2)
  const logoH = logoImg ? 130 : 0
  const total = logoH + (logoImg ? 40 : 0) + tLines.length * 70 + (sLines.length ? 20 + sLines.length * 44 : 0)
  let y = (H - total) / 2

  if (logoImg) {
    const lw = logoImg.width * (logoH / logoImg.height)
    ctx.drawImage(logoImg, (W - lw) / 2, y, lw, logoH)
    y += logoH + 40
  }
  ctx.textAlign = 'center'; ctx.textBaseline = 'top'
  ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 12
  ctx.font = '800 64px Inter, Arial, sans-serif'
  ctx.fillStyle = titoloColore || '#FFFFFF'
  for (const l of tLines) { ctx.fillText(l, W / 2, y); y += 70 }
  if (sLines.length) {
    y += 20
    ctx.font = '400 34px Inter, Arial, sans-serif'
    ctx.fillStyle = sottotitoloColore || '#FFFFFF'
    for (const l of sLines) { ctx.fillText(l, W / 2, y); y += 44 }
  }
  return new Promise(res => c.toBlob(res, 'image/jpeg', 0.88))
}

export async function uploadOg(blob, name) {
  if (!blob) return null
  const path = `og/${name}-${Date.now()}.jpg`
  const { error } = await supabase.storage.from('eventi-immagini').upload(path, blob, { upsert: true, contentType: 'image/jpeg' })
  if (error) { console.error('og upload', error); return null }
  return supabase.storage.from('eventi-immagini').getPublicUrl(path).data.publicUrl
}
