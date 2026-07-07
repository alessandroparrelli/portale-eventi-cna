/**
 * MailUpExportTab — genera HTML table-based pronto per MailUp
 * Ogni link punta alla pagina pubblica dell'evento.
 * Nessuna animazione, nessun JS, CSS inline, immagini hosted externally.
 * Rispetta il limite Gmail di ~80 KB HTML.
 */

import { useState, useMemo } from 'react'
import { Copy, Check, AlertTriangle, ExternalLink, Mail } from 'lucide-react'
import { temaConDefault } from './AspettoTab'

/* ── helpers ─────────────────────────────────────────────────────── */
function fmtData(ts) {
  if (!ts) return null
  return new Date(ts).toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}
function fmtOra(ts) {
  if (!ts) return null
  return new Date(ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}
function esc(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
// Rimuovi tag HTML mantenendo il testo
function stripHtml(html) {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}
// Converti HTML ricco in celle-safe per email (supporto basilare)
function richToEmailHtml(html, cp) {
  if (!html) return ''
  // Rimuovi classi e stili complessi, lascia struttura semantica
  return html
    .replace(/class="[^"]*"/g, '')
    .replace(/style="[^"]*"/g, '')
    .replace(/<h([1-6])[^>]*>(.*?)<\/h\1>/gi, (_, lv, content) => {
      const sz = lv <= 2 ? '22px' : lv === 3 ? '18px' : '16px'
      const fw = lv <= 3 ? '800' : '700'
      return `<p style="margin:0 0 12px;font-size:${sz};font-weight:${fw};color:#0A0A0A;letter-spacing:-.02em;line-height:1.2;">${content}</p>`
    })
    .replace(/<ul[^>]*>(.*?)<\/ul>/gis, (_, items) => {
      const lis = items.replace(/<li[^>]*>(.*?)<\/li>/gis, (__, li) =>
        `<p style="margin:0 0 6px;font-size:15px;color:#374151;line-height:1.6;">&#8226; ${li.trim()}</p>`)
      return lis
    })
    .replace(/<ol[^>]*>(.*?)<\/ol>/gis, (_, items) => {
      let n = 0
      return items.replace(/<li[^>]*>(.*?)<\/li>/gis, (__, li) => {
        n++
        return `<p style="margin:0 0 6px;font-size:15px;color:#374151;line-height:1.6;">${n}. ${li.trim()}</p>`
      })
    })
    .replace(/<p([^>]*)>(.*?)<\/p>/gis, (_, attrs, content) =>
      `<p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.75;">${content}</p>`)
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '<strong>$1</strong>')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '<em>$1</em>')
    .replace(/<a\s+href="([^"]*)"[^>]*>(.*?)<\/a>/gi,
      `<a href="$1" style="color:${cp};text-decoration:underline;">$2</a>`)
    .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi,
      `<img src="$1" alt="$2" style="max-width:100%;display:block;margin:0 auto 12px;" />`)
    .replace(/<br\s*\/?>/gi, '<br />')
    .replace(/<(?!\/?(strong|em|a|br|img|p)\b)[^>]+>/g, '')
}

/* ── Generatore HTML principale ───────────────────────────────────── */
function buildMailUpHtml(event, eventUrl) {
  const tema = temaConDefault(event?.tema)
  const cp   = tema.colore_primario || '#003DA5'
  const lh   = event.layout_hero || {}

  const logoUrl = event?.logo_url ||
    'https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png'
  const logoAltezza = lh.logo_altezza || tema.logo_altezza || 48
  const heroImg = event.immagine_hero || null

  const dataTesto = event.data_inizio
    ? fmtData(event.data_inizio) +
      (fmtOra(event.data_inizio) ? ' · ' + fmtOra(event.data_inizio) : '') +
      (event.data_fine && fmtOra(event.data_fine) ? ' — ' + fmtOra(event.data_fine) : '')
    : null

  // ── Calcola colore overlay ──
  const overlayHex  = lh.overlay_colore || '#000000'
  const overlayOpac = ((lh.overlay_opacita ?? 55) / 100).toFixed(2)
  const [r, g, b]   = [1, 3, 5].map(i => parseInt(overlayHex.slice(i, i + 2), 16))

  // ── Sezioni/blocchi → HTML ──
  function renderBlocks() {
    const sezioni = event.sezioni || []
    if (!sezioni.length && !event.descrizione_html) return ''

    let out = ''

    // Testo libero legacy
    if (!sezioni.length && event.descrizione_html) {
      out += `
        <tr><td style="padding:0 0 24px;">
          <div style="font-size:15px;color:#374151;line-height:1.75;font-family:Arial,sans-serif;">
            ${richToEmailHtml(event.descrizione_html, cp)}
          </div>
        </td></tr>`
      return out
    }

    for (const block of sezioni) {
      if (block.tipo === 'testo') {
        out += `
        <tr><td style="padding:0 0 24px;">
          <div style="font-size:15px;color:#374151;line-height:1.75;font-family:Arial,sans-serif;">
            ${richToEmailHtml(block.html, cp)}
          </div>
        </td></tr>`
      } else if (block.tipo === 'titolo') {
        out += `
        <tr><td style="padding:0 0 24px;text-align:${block.allineamento || 'center'};">
          <p style="margin:0 0 6px;font-size:28px;font-weight:900;color:#0A0A0A;letter-spacing:-.03em;line-height:1.1;font-family:Arial,sans-serif;">${esc(block.testo)}</p>
          ${block.sottotitolo ? `<p style="margin:0;font-size:16px;color:#6B7280;line-height:1.6;font-family:Arial,sans-serif;">${esc(block.sottotitolo)}</p>` : ''}
        </td></tr>`
      } else if (block.tipo === 'stats') {
        const items = block.items || []
        const colW  = Math.floor(100 / Math.max(items.length, 1))
        out += `
        <tr><td style="padding:0 0 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            ${items.map(it => `
              <td width="${colW}%" style="text-align:center;padding:8px;">
                <p style="margin:0 0 4px;font-size:40px;font-weight:900;color:${block.colore || cp};letter-spacing:-.04em;line-height:1;font-family:Arial,sans-serif;">${esc(it.num || it.numero)}</p>
                <p style="margin:0;font-size:11px;color:#6B7280;font-weight:700;text-transform:uppercase;letter-spacing:.05em;font-family:Arial,sans-serif;">${esc(it.label)}</p>
              </td>`).join('')}
          </tr></table>
        </td></tr>`
      } else if (block.tipo === 'griglia') {
        const cols = block.cols || block.colonne || []
        out += `
        <tr><td style="padding:0 0 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            ${cols.map(col => `
              <td style="width:${Math.floor(100 / cols.length)}%;vertical-align:top;padding:6px;">
                <table width="100%" cellpadding="16" cellspacing="0" border="0" style="border:1px solid #E5E7EB;border-radius:12px;">
                  <tr><td>
                    ${col.titolo ? `<p style="margin:0 0 6px;font-size:15px;font-weight:800;color:#0A0A0A;letter-spacing:-.02em;font-family:Arial,sans-serif;">${esc(col.titolo)}</p>` : ''}
                    ${col.testo ? `<p style="margin:0;font-size:13px;color:#6B7280;line-height:1.65;font-family:Arial,sans-serif;">${esc(col.testo)}</p>` : ''}
                  </td></tr>
                </table>
              </td>`).join('')}
          </tr></table>
        </td></tr>`
      } else if (block.tipo === 'cta') {
        const btnBg    = block.stile === 'contorno' ? 'transparent' : (block.colore || cp)
        const btnColor = block.stile === 'contorno' ? (block.colore || cp) : '#FFFFFF'
        const btnBorder= block.stile === 'contorno' ? `2px solid ${block.colore || cp}` : 'none'
        out += `
        <tr><td style="padding:0 0 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${cp}10;border:1px solid ${cp}25;border-radius:16px;">
            <tr><td style="padding:32px 24px;text-align:center;">
              ${block.titolo ? `<p style="margin:0 0 20px;font-size:22px;font-weight:900;color:#0A0A0A;letter-spacing:-.03em;font-family:Arial,sans-serif;">${esc(block.titolo)}</p>` : ''}
              <a href="${esc(eventUrl)}" style="display:inline-block;background:${btnBg};color:${btnColor};border:${btnBorder};border-radius:8px;padding:14px 36px;font-size:15px;font-weight:800;text-decoration:none;font-family:Arial,sans-serif;">
                ${esc(block.testo_btn || block.testo || 'Iscriviti →')}
              </a>
            </td></tr>
          </table>
        </td></tr>`
      } else if (block.tipo === 'banner') {
        const cfgs = {
          info:    { bg:'#EFF6FF', color:'#1E40AF', border:'#BFDBFE' },
          success: { bg:'#D1FAE5', color:'#065F46', border:'#6EE7B7' },
          warning: { bg:'#FFFBEB', color:'#92400E', border:'#FDE68A' },
          error:   { bg:'#FEF2F2', color:'#991B1B', border:'#FECACA' },
        }
        const c = cfgs[block.stile || 'info'] || cfgs.info
        out += `
        <tr><td style="padding:0 0 16px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${c.bg};border:1px solid ${c.border};border-radius:10px;">
            <tr><td style="padding:16px 20px;font-size:14px;color:${c.color};line-height:1.6;font-weight:500;font-family:Arial,sans-serif;">
              ${block.icona ? `${esc(block.icona)} ` : ''}${esc(block.testo)}
            </td></tr>
          </table>
        </td></tr>`
      } else if (block.tipo === 'immagine' && block.src) {
        const align = block.align || 'center'
        const maxW  = block.size === 'small' ? '33%' : block.size === 'medium' ? '60%' : '100%'
        out += `
        <tr><td style="padding:0 0 16px;text-align:${align};">
          <img src="${esc(block.src)}" alt="${esc(block.didascalia || '')}" style="max-width:${maxW};width:100%;display:inline-block;border-radius:8px;" />
          ${block.didascalia ? `<p style="margin:6px 0 0;font-size:13px;color:#9CA3AF;font-style:italic;font-family:Arial,sans-serif;">${esc(block.didascalia)}</p>` : ''}
        </td></tr>`
      } else if (block.tipo === 'separatore') {
        out += `<tr><td style="padding:0 0 32px;"><hr style="border:none;border-top:1px solid #E5E7EB;margin:0;" /></td></tr>`
      } else if (block.tipo === 'timeline') {
        const items = block.items || []
        out += `
        <tr><td style="padding:0 0 32px;">
          ${items.map((item, i) => `
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
              <tr>
                <td width="44" valign="top" style="padding-right:16px;">
                  <div style="width:36px;height:36px;border-radius:50%;background:${cp};text-align:center;line-height:36px;font-size:12px;font-weight:800;color:#FFFFFF;font-family:Arial,sans-serif;">${item.anno || i + 1}</div>
                </td>
                <td valign="top" style="padding-top:4px;">
                  <p style="margin:0 0 4px;font-size:15px;font-weight:800;color:#0A0A0A;letter-spacing:-.02em;font-family:Arial,sans-serif;">${esc(item.titolo)}</p>
                  <p style="margin:0;font-size:13px;color:#6B7280;line-height:1.65;font-family:Arial,sans-serif;">${esc(item.testo)}</p>
                </td>
              </tr>
            </table>`).join('')}
        </td></tr>`
      } else if (block.tipo === 'testimonial') {
        const items = block.items || []
        out += `
        <tr><td style="padding:0 0 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            ${items.map(item => `
              <td style="width:${Math.floor(100 / items.length)}%;vertical-align:top;padding:6px;">
                <table width="100%" cellpadding="20" cellspacing="0" border="0" style="border:1px solid #E5E7EB;border-radius:12px;">
                  <tr><td>
                    <p style="margin:0 0 12px;font-size:13px;color:#374151;line-height:1.7;font-style:italic;font-family:Arial,sans-serif;">&ldquo;${esc(item.testo)}&rdquo;</p>
                    <p style="margin:0;font-size:13px;font-weight:700;color:#0A0A0A;font-family:Arial,sans-serif;">${esc(item.nome)}</p>
                    ${item.ruolo ? `<p style="margin:2px 0 0;font-size:12px;color:#9CA3AF;font-family:Arial,sans-serif;">${esc(item.ruolo)}</p>` : ''}
                  </td></tr>
                </table>
              </td>`).join('')}
          </tr></table>
        </td></tr>`
      } else if (block.tipo === 'video' && block.url) {
        const ytMatch = block.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
        if (ytMatch) {
          const thumb = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`
          out += `
          <tr><td style="padding:0 0 24px;text-align:center;">
            <a href="${esc(block.url)}" style="display:inline-block;position:relative;">
              <img src="${thumb}" alt="${esc(block.didascalia || 'Video')}" style="width:100%;max-width:560px;display:block;border-radius:8px;" />
              <p style="margin:6px 0 0;font-size:13px;color:${cp};font-weight:600;font-family:Arial,sans-serif;">▶ Guarda il video</p>
            </a>
            ${block.didascalia ? `<p style="margin:6px 0 0;font-size:13px;color:#9CA3AF;font-style:italic;font-family:Arial,sans-serif;">${esc(block.didascalia)}</p>` : ''}
          </td></tr>`
        }
      } else if (block.tipo === 'accordion') {
        // Accordion → lista espansa (email non supporta interattività)
        const items = block.items || []
        out += `
        <tr><td style="padding:0 0 24px;">
          ${items.map(item => `
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;border:1px solid #E5E7EB;border-radius:10px;">
              <tr><td style="padding:14px 18px;background:#F9FAFB;border-radius:10px;">
                <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:${cp};font-family:Arial,sans-serif;">${esc(item.domanda)}</p>
                <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;font-family:Arial,sans-serif;">${esc(item.risposta)}</p>
              </td></tr>
            </table>`).join('')}
        </td></tr>`
      } else if (block.tipo === 'badge_list') {
        const items = block.items || []
        out += `
        <tr><td style="padding:0 0 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            ${items.map(item => `
              <td style="width:50%;vertical-align:top;padding:4px;">
                <table width="100%" cellpadding="10" cellspacing="0" border="0" style="border:1px solid #E5E7EB;border-radius:8px;">
                  <tr><td>
                    <p style="margin:0;font-size:13px;color:#374151;font-weight:500;font-family:Arial,sans-serif;">&#10003; ${esc(item.testo)}</p>
                  </td></tr>
                </table>
              </td>`).join('')}
          </tr></table>
        </td></tr>`
      } else if (block.tipo === 'carosello') {
        const imgs = (block.immagini || []).filter(i => i.src)
        if (imgs.length > 0) {
          // Mostra la prima immagine del carosello come immagine statica
          out += `
          <tr><td style="padding:0 0 24px;text-align:center;">
            <a href="${esc(eventUrl)}">
              <img src="${esc(imgs[0].src)}" alt="${esc(imgs[0].didascalia || '')}" style="max-width:100%;display:inline-block;border-radius:8px;" />
            </a>
            ${imgs.length > 1 ? `<p style="margin:6px 0 0;font-size:12px;color:#9CA3AF;font-family:Arial,sans-serif;">+${imgs.length - 1} immagini sul sito</p>` : ''}
          </td></tr>`
        }
      }
    }
    return out
  }

  // ── Sessioni ──
  function renderSessioni() {
    const sessioni = event.sessioni || []
    if (!sessioni.length) return ''
    return `
      <tr><td style="padding:0 0 8px;">
        <p style="margin:0 0 20px;font-size:22px;font-weight:900;color:#0A0A0A;letter-spacing:-.03em;font-family:Arial,sans-serif;">Programma</p>
        ${sessioni.map((sess, idx) => `
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
            <tr>
              <td width="44" valign="top" style="padding-right:14px;">
                <div style="width:36px;height:36px;border-radius:50%;background:${cp}20;border:2px solid ${cp};text-align:center;line-height:32px;font-size:12px;font-weight:800;color:${cp};font-family:Arial,sans-serif;">${idx + 1}</div>
              </td>
              <td valign="top" style="padding-top:4px;">
                <p style="margin:0 0 3px;font-size:15px;font-weight:800;color:#0A0A0A;letter-spacing:-.02em;font-family:Arial,sans-serif;">${esc(sess.titolo || `Sessione ${idx + 1}`)}</p>
                ${(sess.ora_inizio || sess.data) ? `<span style="display:inline-block;font-size:11px;font-weight:600;color:${cp};background:${cp}18;padding:2px 8px;border-radius:20px;font-family:Arial,sans-serif;">${sess.data ? new Date(sess.data + 'T00:00').toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' }) : ''}${sess.ora_inizio ? (sess.data ? ' · ' : '') + sess.ora_inizio : ''}${sess.ora_fine ? '–' + sess.ora_fine : ''}</span>` : ''}
                ${sess.relatore ? `<p style="margin:4px 0 0;font-size:13px;color:#6B7280;font-family:Arial,sans-serif;">&#127908; ${esc(sess.relatore)}</p>` : ''}
                ${sess.luogo ? `<p style="margin:2px 0 0;font-size:12px;color:#9CA3AF;font-family:Arial,sans-serif;">&#128205; ${esc(sess.luogo)}</p>` : ''}
                ${sess.descrizione ? `<p style="margin:6px 0 0;font-size:13px;color:#374151;line-height:1.6;font-family:Arial,sans-serif;">${esc(sess.descrizione)}</p>` : ''}
              </td>
            </tr>
          </table>`).join('')}
      </td></tr>`
  }

  // ── Hero background ──
  const heroBgStyle = heroImg
    ? `background:#003DA5;` // fallback colore per email (le bg-image non sono supportate ovunque)
    : `background:linear-gradient(135deg,${cp} 0%,#001a50 100%);`

  const titoloColore  = lh.titolo_colore || '#FFFFFF'
  const titoloSize    = (() => {
    const raw = lh.titolo_dimensione || 'clamp(24px,5vw,52px)'
    // Risolvi clamp → valore fisso per email
    if (raw.startsWith('clamp')) return '36px'
    return raw
  })()

  const btnBg     = tema.btn_stile === 'contorno' ? 'transparent' : (tema.colore_pulsanti || cp)
  const btnColor  = tema.btn_stile === 'contorno' ? (tema.colore_pulsanti || cp) : (tema.colore_testo_btn || '#FFFFFF')
  const btnBorder = tema.btn_stile === 'contorno' ? `2px solid ${tema.colore_pulsanti || cp}` : 'none'
  const btnRadius = tema.btn_stile === 'pill' ? '50px' : `${tema.btn_raggio || 8}px`

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(event.titolo)}</title>
</head>
<body style="margin:0;padding:0;background-color:#F4F5F7;font-family:Arial,Helvetica,sans-serif;">

<!-- Wrapper esterno -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F4F5F7">
<tr><td align="center" style="padding:0;">

  <!-- Container 600px -->
  <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;margin:0 auto;">

    <!-- ── HERO ── -->
    <tr><td style="${heroBgStyle}padding:0;">
      ${heroImg
        ? `<a href="${esc(eventUrl)}" style="display:block;"><img src="${esc(heroImg)}" alt="${esc(event.titolo)}" width="600" style="width:100%;max-width:600px;display:block;border:0;" /></a>`
        : ''}
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="padding:clamp(32px,5vw,56px) 32px 32px;text-align:${lh.allineamento === 'sinistra' ? 'left' : 'center'};">
          <!-- Logo -->
          <a href="${esc(eventUrl)}" style="display:inline-block;margin-bottom:24px;">
            <img src="${esc(logoUrl)}" alt="CNA Roma" height="${logoAltezza}" style="height:${logoAltezza}px;display:inline-block;border:0;" />
          </a>
          <!-- Titolo -->
          <p style="margin:0 0 10px;font-size:${titoloSize};font-weight:900;color:${titoloColore};letter-spacing:-.04em;line-height:1.05;font-family:Arial,sans-serif;">${esc(event.titolo)}</p>
          ${lh.titolo2 ? `<p style="margin:0 0 8px;font-size:18px;font-weight:${lh.titolo2_grassetto ? '700' : '400'};color:${lh.titolo2_colore || 'rgba(255,255,255,0.9)'};letter-spacing:-.02em;line-height:1.3;font-family:Arial,sans-serif;">${esc(lh.titolo2)}</p>` : ''}
          ${event.sottotitolo ? `<p style="margin:0;font-size:${event.sottotitolo_size ? event.sottotitolo_size + 'px' : '17px'};font-weight:${event.sottotitolo_bold ? '700' : '400'};color:rgba(255,255,255,.92);line-height:1.5;font-family:Arial,sans-serif;">${esc(event.sottotitolo)}</p>` : ''}
        </td></tr>
      </table>
    </td></tr>

    <!-- ── DATA E LUOGO ── -->
    ${dataTesto || event.luogo ? `
    <tr><td bgcolor="#FFFFFF" style="padding:14px 24px;border-bottom:1px solid #E5E7EB;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        ${dataTesto ? `
        <td style="padding:4px 8px;font-size:14px;font-weight:700;color:#0A0A0A;font-family:Arial,sans-serif;">
          &#128197; ${esc(dataTesto)}
        </td>` : ''}
        ${event.luogo ? `
        <td style="padding:4px 8px;font-size:14px;font-weight:700;font-family:Arial,sans-serif;">
          <a href="https://maps.google.com/?q=${encodeURIComponent(event.luogo)}" style="color:${cp};text-decoration:none;">
            &#128205; ${esc(event.luogo)}
          </a>
        </td>` : ''}
      </tr></table>
    </td></tr>` : ''}

    <!-- ── CTA PRINCIPALE ── -->
    <tr><td bgcolor="#FFFFFF" style="padding:24px 32px;text-align:center;border-bottom:1px solid #F3F4F6;">
      <a href="${esc(eventUrl)}" style="display:inline-block;background:${btnBg};color:${btnColor};border:${btnBorder};border-radius:${btnRadius};padding:14px 36px;font-size:15px;font-weight:800;text-decoration:none;font-family:Arial,sans-serif;">
        Scopri l'evento e iscriviti &rarr;
      </a>
    </td></tr>

    <!-- ── CORPO ── -->
    <tr><td bgcolor="#FFFFFF" style="padding:32px 32px 8px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${renderBlocks()}
        ${renderSessioni()}
      </table>
    </td></tr>

    <!-- ── CTA ISCRIZIONE ── -->
    <tr><td bgcolor="${tema.cta_bg || '#EEF3FF'}" style="padding:28px 32px;border-top:1px solid ${cp}25;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td valign="middle" style="padding-right:16px;">
          <p style="margin:0 0 4px;font-size:17px;font-weight:900;color:#0A0A0A;letter-spacing:-.02em;font-family:Arial,sans-serif;">Partecipa all'evento</p>
          <p style="margin:0;font-size:13px;color:#4B5563;line-height:1.5;font-family:Arial,sans-serif;">Registrazione gratuita. Ricevi il QR Code per l'ingresso.</p>
        </td>
        <td valign="middle" align="right" width="160" style="white-space:nowrap;">
          <a href="${esc(eventUrl)}" style="display:inline-block;background:${btnBg};color:${btnColor};border:${btnBorder};border-radius:${btnRadius};padding:12px 22px;font-size:13px;font-weight:800;text-decoration:none;font-family:Arial,sans-serif;white-space:nowrap;">
            Iscriviti ora &rsaquo;
          </a>
        </td>
      </tr></table>
    </td></tr>

    <!-- ── FOOTER ── -->
    <tr><td bgcolor="${tema.sfondo_footer || '#F4F5F7'}" style="padding:20px 32px;text-align:center;border-top:1px solid #E5E7EB;">
      <a href="${esc(eventUrl)}" style="display:inline-block;margin-bottom:10px;">
        <img src="${esc(logoUrl)}" alt="CNA Roma" height="36" style="height:36px;display:inline-block;border:0;" />
      </a>
      <p style="margin:0;font-size:12px;color:${tema.testo_footer || '#9CA3AF'};line-height:1.6;font-family:Arial,sans-serif;">
        ${esc(event.footer_testo || `© ${new Date().getFullYear()} CNA di Roma — Artigiani Imprenditori d'Italia`)}
      </p>
      <p style="margin:8px 0 0;font-size:11px;color:#9CA3AF;font-family:Arial,sans-serif;">
        <a href="${esc(eventUrl)}" style="color:${cp};text-decoration:none;">Visualizza la pagina dell'evento</a>
      </p>
    </td></tr>

  </table>
</td></tr>
</table>

</body>
</html>`
}

/* ── Componente React ─────────────────────────────────────────────── */
export default function MailUpExportTab({ event }) {
  const [copied, setCopied] = useState(false)

  const eventUrl = useMemo(() => {
    if (!event?.slug) return ''
    return `${window.location.origin}/eventi/${event.slug}`
  }, [event?.slug])

  const html = useMemo(() => {
    if (!event?.titolo) return ''
    return buildMailUpHtml(event, eventUrl)
  }, [event, eventUrl])

  const sizeKb = useMemo(() => {
    if (!html) return 0
    return (new TextEncoder().encode(html).length / 1024).toFixed(1)
  }, [html])

  const sizeOk    = parseFloat(sizeKb) < 80
  const sizeWarn  = parseFloat(sizeKb) >= 80 && parseFloat(sizeKb) < 102
  const sizeError = parseFloat(sizeKb) >= 102

  async function copyHtml() {
    try {
      await navigator.clipboard.writeText(html)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // fallback
      const ta = document.createElement('textarea')
      ta.value = html
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  if (!event?.titolo) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF' }}>
        <p style={{ fontSize: '15px', fontWeight: '600', color: '#374151' }}>Nessun evento caricato</p>
        <p style={{ fontSize: '13px' }}>Salva l'evento prima di generare l'HTML.</p>
      </div>
    )
  }

  if (!event.slug) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF' }}>
        <Mail size={40} style={{ color: '#D1D5DB', marginBottom: '12px' }} />
        <p style={{ fontSize: '15px', fontWeight: '600', color: '#374151' }}>Slug mancante</p>
        <p style={{ fontSize: '13px' }}>L'evento deve avere uno slug per generare l'URL corretto.</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 0 48px' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: '900', color: '#0A0A0A', letterSpacing: '-.03em', fontFamily: "'Inter',sans-serif" }}>
          Esporta HTML per MailUp
        </h2>
        <p style={{ margin: 0, fontSize: '14px', color: '#6B7280', fontFamily: "'Inter',sans-serif" }}>
          Copia il codice HTML e incollalo nell'editor HTML di MailUp (<em>Messaggi → Nuovo → Da editor HTML</em>).
          Tutti i link rimandano alla pagina pubblica dell'evento.
        </p>
      </div>

      {/* Info URL */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', backgroundColor: '#F4F5F7', borderRadius: '8px', marginBottom: '16px', border: '1px solid #E5E7EB' }}>
        <ExternalLink size={14} style={{ color: '#6B7280', flexShrink: 0 }} />
        <span style={{ fontSize: '12px', color: '#374151', fontFamily: "'Inter',sans-serif", fontWeight: '600' }}>URL evento:</span>
        <a href={eventUrl} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: '12px', color: '#003DA5', fontFamily: 'monospace', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {eventUrl}
        </a>
      </div>

      {/* Dimensione + warning */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 14px', borderRadius: '8px', marginBottom: '16px',
        backgroundColor: sizeError ? '#FEF2F2' : sizeWarn ? '#FFFBEB' : '#F0FDF4',
        border: `1px solid ${sizeError ? '#FECACA' : sizeWarn ? '#FDE68A' : '#BBF7D0'}`,
      }}>
        {(sizeWarn || sizeError) && <AlertTriangle size={14} style={{ color: sizeError ? '#DC2626' : '#D97706', flexShrink: 0 }} />}
        <span style={{
          fontSize: '13px', fontWeight: '700', fontFamily: "'Inter',sans-serif",
          color: sizeError ? '#DC2626' : sizeWarn ? '#92400E' : '#15803D',
        }}>
          Peso HTML: {sizeKb} KB
          {sizeOk    && ' — ✓ ottimale (< 80 KB)'}
          {sizeWarn  && ' — attenzione: vicino al limite Gmail di 102 KB'}
          {sizeError && ' — ⚠ supera 102 KB: Gmail clipperà il contenuto'}
        </span>
      </div>

      {/* Bottone copia */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button
          onClick={copyHtml}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', borderRadius: '8px', border: 'none',
            backgroundColor: copied ? '#16A34A' : '#003DA5',
            color: '#FFFFFF', fontSize: '14px', fontWeight: '700',
            fontFamily: "'Inter',sans-serif", cursor: 'pointer',
            transition: 'background-color .2s',
          }}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copiato!' : 'Copia HTML'}
        </button>
        <a
          href={`data:text/html;charset=utf-8,${encodeURIComponent(html)}`}
          download={`email-${event.slug || 'evento'}.html`}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', borderRadius: '8px',
            border: '1px solid #D1D5DB',
            color: '#374151', fontSize: '14px', fontWeight: '600',
            fontFamily: "'Inter',sans-serif", textDecoration: 'none',
            backgroundColor: '#FFFFFF',
          }}>
          ↓ Scarica .html
        </a>
      </div>

      {/* Istruzioni MailUp */}
      <div style={{ backgroundColor: '#EEF3FF', border: '1px solid #C7D9F8', borderRadius: '10px', padding: '16px 20px', marginBottom: '20px' }}>
        <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: '800', color: '#003DA5', fontFamily: "'Inter',sans-serif" }}>Come importare in MailUp</p>
        <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#374151', lineHeight: '2', fontFamily: "'Inter',sans-serif" }}>
          <li>Vai su <strong>Messaggi → Email → Nuovo messaggio</strong></li>
          <li>Scegli <strong>Da editor HTML</strong></li>
          <li>Incolla il codice copiato nell'area HTML</li>
          <li>Compila Oggetto e Sommario (max 100 car.)</li>
          <li>Invia una bozza di test prima dell'invio massivo</li>
        </ol>
      </div>

      {/* Anteprima HTML */}
      <div style={{ border: '1px solid #E5E7EB', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', fontFamily: "'Inter',sans-serif", textTransform: 'uppercase', letterSpacing: '.06em' }}>
            Anteprima email (600px)
          </span>
        </div>
        <div style={{ overflowX: 'auto', backgroundColor: '#F4F5F7', padding: '24px', display: 'flex', justifyContent: 'center' }}>
          <iframe
            srcDoc={html}
            title="Anteprima email MailUp"
            style={{ width: '600px', minHeight: '600px', border: '1px solid #E5E7EB', borderRadius: '4px', display: 'block', backgroundColor: '#FFFFFF' }}
            sandbox="allow-same-origin"
          />
        </div>
      </div>

      {/* Codice sorgente */}
      <div style={{ marginTop: '20px', border: '1px solid #E5E7EB', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', fontFamily: "'Inter',sans-serif", textTransform: 'uppercase', letterSpacing: '.06em' }}>
            Codice sorgente
          </span>
          <button onClick={copyHtml} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', border: '1px solid #D1D5DB', borderRadius: '5px', backgroundColor: '#FFFFFF', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: '#374151', fontFamily: "'Inter',sans-serif" }}>
            {copied ? <Check size={12} /> : <Copy size={12} />} Copia
          </button>
        </div>
        <textarea
          readOnly
          value={html}
          onClick={e => e.target.select()}
          style={{
            width: '100%', height: '280px', padding: '16px',
            fontFamily: 'monospace', fontSize: '11px', lineHeight: '1.6',
            border: 'none', resize: 'vertical', outline: 'none',
            backgroundColor: '#1E1E1E', color: '#D4D4D4',
            boxSizing: 'border-box',
          }}
        />
      </div>
    </div>
  )
}
