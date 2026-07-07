/**
 * MailUpExportTab — HTML table-based per MailUp
 * v3: editor testo email TipTap + opzioni CTA colori
 */
import { useState, useMemo, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Copy, Check, AlertTriangle, ExternalLink, Mail, Settings, ChevronDown, ChevronUp, Type } from 'lucide-react'
import { temaConDefault } from './AspettoTab'

/* ── helpers ─────────────────────────────────────────────────────── */
function fmtData(ts) {
  if (!ts) return null
  return new Date(ts).toLocaleDateString('it-IT', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
}
function fmtOra(ts) {
  if (!ts) return null
  return new Date(ts).toLocaleTimeString('it-IT', { hour:'2-digit', minute:'2-digit' })
}
function esc(str) {
  if (!str) return ''
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

// Converte HTML TipTap → email-safe con stili inline preservati
function tiptapToEmail(html, F) {
  if (!html) return ''
  return html
    // Titoli → paragrafi stilizzati
    .replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, lv, c) => {
      const sz = lv <= 2 ? '22px' : lv === 3 ? '18px' : '16px'
      const fw = lv <= 3 ? '800' : '700'
      return `<p style="margin:0 0 12px;font-size:${sz};font-weight:${fw};color:#0A0A0A;letter-spacing:-.02em;line-height:1.2;font-family:${F};">${c}</p>`
    })
    // Liste
    .replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, items) =>
      items.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (__, li) =>
        `<p style="margin:0 0 6px;font-size:15px;color:#374151;line-height:1.6;font-family:${F};">&#8226; ${li.trim()}</p>`))
    .replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, items) => {
      let n = 0
      return items.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (__, li) => {
        n++
        return `<p style="margin:0 0 6px;font-size:15px;color:#374151;line-height:1.6;font-family:${F};">${n}. ${li.trim()}</p>`
      })
    })
    // Paragrafi — preserva style inline TipTap (text-align, ecc)
    .replace(/<p([^>]*)>([\s\S]*?)<\/p>/gi, (_, attrs, c) => {
      const alignMatch = attrs.match(/text-align:\s*(left|center|right)/)
      const align = alignMatch ? `text-align:${alignMatch[1]};` : ''
      return `<p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.75;font-family:${F};${align}">${c}</p>`
    })
    // Span con stile inline (colore testo da TipTap Color)
    .replace(/<span\s+style="([^"]*)">([\s\S]*?)<\/span>/gi, (_, style, c) => {
      // Estrai solo color e font-size dal style
      const colorMatch = style.match(/color:\s*([^;]+)/)
      const sizeMatch  = style.match(/font-size:\s*([^;]+)/)
      let inlineStyle = ''
      if (colorMatch) inlineStyle += `color:${colorMatch[1].trim()};`
      if (sizeMatch)  inlineStyle += `font-size:${sizeMatch[1].trim()};`
      return inlineStyle ? `<span style="${inlineStyle}">${c}</span>` : c
    })
    // Formattazione inline — preserva
    .replace(/<strong[^>]*>/gi, '<strong style="font-weight:800;">')
    .replace(/<\/strong>/gi, '</strong>')
    .replace(/<em[^>]*>/gi, '<em style="font-style:italic;">')
    .replace(/<\/em>/gi, '</em>')
    .replace(/<u[^>]*>/gi, '<u style="text-decoration:underline;">')
    .replace(/<\/u>/gi, '</u>')
    // Link
    .replace(/<a\s+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi,
      `<a href="$1" style="color:#003DA5;text-decoration:underline;font-family:${F};">$2</a>`)
    .replace(/<br\s*\/?>/gi, '<br />')
    // Rimuovi tag non email-safe rimanenti (div, span vuoti, ecc)
    .replace(/<(div|section|article|header|footer|nav|aside|figure)[^>]*>/gi, '')
    .replace(/<\/(div|section|article|header|footer|nav|aside|figure)>/gi, '')
    .replace(/<span>/gi, '').replace(/<\/span>/gi, '')
}

// Converte HTML contenuto evento (da blocchi) → email-safe
function richToEmail(html, cp, F) {
  if (!html) return ''
  return html
    .replace(/class="[^"]*"/g, '')
    .replace(/style="[^"]*"/g, '')
    .replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, lv, c) => {
      const sz = lv <= 2 ? '22px' : lv === 3 ? '18px' : '16px'
      const fw = lv <= 3 ? '800' : '700'
      return `<p style="margin:0 0 12px;font-size:${sz};font-weight:${fw};color:#0A0A0A;letter-spacing:-.02em;line-height:1.2;font-family:${F};">${c}</p>`
    })
    .replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, it) =>
      it.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (__, li) =>
        `<p style="margin:0 0 6px;font-size:15px;color:#374151;line-height:1.6;font-family:${F};">&#8226; ${li.trim()}</p>`))
    .replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, it) => {
      let n = 0
      return it.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (__, li) => {
        n++
        return `<p style="margin:0 0 6px;font-size:15px;color:#374151;line-height:1.6;font-family:${F};">${n}. ${li.trim()}</p>`
      })
    })
    .replace(/<p([^>]*)>([\s\S]*?)<\/p>/gi, (_, __, c) =>
      `<p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.75;font-family:${F};">${c}</p>`)
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '<strong>$1</strong>')
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '<em>$1</em>')
    .replace(/<a\s+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi,
      `<a href="$1" style="color:${cp};text-decoration:underline;">$2</a>`)
    .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi,
      `<img src="$1" alt="$2" style="max-width:100%;display:block;margin:0 auto 12px;" />`)
    .replace(/<br\s*\/?>/gi, '<br />')
    .replace(/<(div|span|section|article|header|footer|nav|aside|figure)[^>]*>/gi, '')
    .replace(/<\/(div|span|section|article|header|footer|nav|aside|figure)>/gi, '')
}

/* ── Builder HTML principale ──────────────────────────────────────── */
function buildHtml(ev, url, opts, extraHtml) {
  const tema  = temaConDefault(ev?.tema)
  const cp    = tema.colore_primario || '#003DA5'
  const lh    = ev.layout_hero || {}
  const W     = opts.larghezza || 600
  const PAD   = opts.padding   || 32
  const F     = `'Inter','Inter UI',Arial,Helvetica,sans-serif`

  // Colori CTA da opts (override sul tema)
  const ctaBg     = opts.ctaBg     || (tema.btn_stile === 'contorno' ? 'transparent' : (tema.colore_pulsanti || cp))
  const ctaColor  = opts.ctaColor  || (tema.btn_stile === 'contorno' ? (tema.colore_pulsanti || cp) : (tema.colore_testo_btn || '#FFFFFF'))
  const ctaBorder = opts.ctaBorder || `2px solid ${tema.colore_pulsanti || cp}`
  const ctaRadius = opts.ctaRadius != null ? `${opts.ctaRadius}px` : (tema.btn_stile === 'pill' ? '50px' : `${tema.btn_raggio || 8}px`)

  const logoUrl = ev?.logo_url || 'https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png'
  const logoH   = Number(lh.logo_altezza || tema.logo_altezza || 48)
  const heroImg = ev.immagine_hero || null
  const heroH   = Number(lh.altezza || 380)
  const align   = lh.allineamento === 'sinistra' ? 'left' : 'center'

  const ohex = lh.overlay_colore || '#000000'
  const oop  = ((lh.overlay_opacita ?? 55) / 100).toFixed(2)
  const [or, og, ob] = [1, 3, 5].map(i => parseInt(ohex.slice(i, i + 2), 16))

  const titoloSize   = (() => { const r = lh.titolo_dimensione || ''; if (r.startsWith('clamp')) return '36px'; return r || '36px' })()
  const titoloColore = lh.titolo_colore || '#FFFFFF'
  const titoloW      = lh.titolo_grassetto !== false ? '900' : '400'

  const dataTesto = ev.data_inizio
    ? fmtData(ev.data_inizio) + (fmtOra(ev.data_inizio) ? ` · ${fmtOra(ev.data_inizio)}` : '') +
      (ev.data_fine && fmtOra(ev.data_fine) ? ` — ${fmtOra(ev.data_fine)}` : '')
    : null

  // HERO
  const heroBgColor  = heroImg ? '#001030' : cp
  const heroCssStyle = heroImg
    ? `background-image:url('${heroImg}');background-size:cover;background-position:${lh.bg_position || 'center top'};background-color:${heroBgColor};`
    : `background:linear-gradient(135deg,${cp} 0%,#001a50 100%);background-color:${cp};`

  const vmlOpen = heroImg
    ? `<!--[if gte mso 9]><v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="mso-width-percent:1000;height:${heroH}px;"><v:fill type="frame" src="${esc(heroImg)}" color="${heroBgColor}" /><v:textbox style="mso-fit-shape-to-text:false" inset="0,0,0,0"><![endif]-->`
    : `<!--[if gte mso 9]><v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="mso-width-percent:1000;height:${heroH}px;"><v:fill type="solid" color="${cp}" /><v:textbox style="mso-fit-shape-to-text:false" inset="0,0,0,0"><![endif]-->`
  const vmlClose = `<!--[if gte mso 9]></v:textbox></v:rect><![endif]-->`

  const heroContent = `
    ${vmlOpen}
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="${align}" valign="middle"
          style="padding:${Math.round(heroH * 0.1)}px ${PAD}px;min-height:${heroH}px;background-color:rgba(${or},${og},${ob},${oop});text-align:${align};">
          <!--[if gte mso 9]><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:${Math.round(heroH * 0.1)}px ${PAD}px;"><![endif]-->
          <a href="${esc(url)}" style="display:inline-block;margin-bottom:20px;text-decoration:none;">
            <img src="${esc(logoUrl)}" alt="CNA Roma" height="${logoH}"
              style="height:${logoH}px;display:block;border:0;${align === 'center' ? 'margin:0 auto;' : ''}" />
          </a>
          <p style="margin:0 0 10px;font-size:${titoloSize};font-weight:${titoloW};color:${titoloColore};letter-spacing:-.04em;line-height:1.05;font-family:${F};text-align:${align};${lh.titolo_maiuscolo ? 'text-transform:uppercase;' : ''}">${esc(ev.titolo)}</p>
          ${lh.titolo2 ? `<p style="margin:0 0 8px;font-size:18px;font-weight:${lh.titolo2_grassetto ? '700' : '400'};color:${lh.titolo2_colore || 'rgba(255,255,255,0.9)'};letter-spacing:-.02em;line-height:1.3;font-family:${F};text-align:${align};">${esc(lh.titolo2)}</p>` : ''}
          ${ev.sottotitolo ? `<p style="margin:0;font-size:${ev.sottotitolo_size ? ev.sottotitolo_size + 'px' : '17px'};font-weight:${ev.sottotitolo_bold ? '700' : '400'};color:rgba(255,255,255,.92);line-height:1.5;font-family:${F};text-align:${align};">${esc(ev.sottotitolo)}</p>` : ''}
          <!--[if gte mso 9]></td></tr></table><![endif]-->
        </td>
      </tr>
    </table>
    ${vmlClose}`

  // Blocchi evento
  function renderBlocks() {
    const ss = ev.sezioni || []
    if (!ss.length && !ev.descrizione_html) return ''
    if (!ss.length) return `<tr><td style="padding:0 0 24px;">${richToEmail(ev.descrizione_html, cp, F)}</td></tr>`
    let out = ''
    for (const b of ss) {
      if (b.tipo === 'testo') {
        out += `<tr><td style="padding:0 0 24px;">${richToEmail(b.html, cp, F)}</td></tr>`
      } else if (b.tipo === 'titolo') {
        out += `<tr><td style="padding:0 0 24px;text-align:${b.allineamento || 'center'};"><p style="margin:0 0 6px;font-size:28px;font-weight:900;color:#0A0A0A;letter-spacing:-.03em;font-family:${F};">${esc(b.testo)}</p>${b.sottotitolo ? `<p style="margin:0;font-size:16px;color:#6B7280;font-family:${F};">${esc(b.sottotitolo)}</p>` : ''}</td></tr>`
      } else if (b.tipo === 'stats') {
        const its = b.items || []; const cw = Math.floor(100 / Math.max(its.length, 1))
        out += `<tr><td style="padding:0 0 32px;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${its.map(it => `<td width="${cw}%" style="text-align:center;padding:8px;"><p style="margin:0 0 4px;font-size:40px;font-weight:900;color:${b.colore || cp};letter-spacing:-.04em;font-family:${F};">${esc(it.num || it.numero)}</p><p style="margin:0;font-size:11px;color:#6B7280;font-weight:700;text-transform:uppercase;letter-spacing:.05em;font-family:${F};">${esc(it.label)}</p></td>`).join('')}</tr></table></td></tr>`
      } else if (b.tipo === 'griglia') {
        const cols = b.cols || b.colonne || []
        out += `<tr><td style="padding:0 0 24px;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${cols.map(c => `<td style="width:${Math.floor(100 / cols.length)}%;vertical-align:top;padding:6px;"><table width="100%" cellpadding="16" cellspacing="0" border="0" style="border:1px solid #E5E7EB;border-radius:12px;"><tr><td>${c.titolo ? `<p style="margin:0 0 6px;font-size:15px;font-weight:800;color:#0A0A0A;font-family:${F};">${esc(c.titolo)}</p>` : ''}${c.testo ? `<p style="margin:0;font-size:13px;color:#6B7280;line-height:1.65;font-family:${F};">${esc(c.testo)}</p>` : ''}</td></tr></table></td>`).join('')}</tr></table></td></tr>`
      } else if (b.tipo === 'cta') {
        const bb = b.stile === 'contorno' ? 'transparent' : (b.colore || cp); const bc = b.stile === 'contorno' ? (b.colore || cp) : '#fff'
        out += `<tr><td style="padding:0 0 24px;"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${cp}12;border:1px solid ${cp}30;border-radius:16px;"><tr><td style="padding:32px 24px;text-align:center;">${b.titolo ? `<p style="margin:0 0 20px;font-size:22px;font-weight:900;color:#0A0A0A;font-family:${F};">${esc(b.titolo)}</p>` : ''}<a href="${esc(url)}" style="display:inline-block;background:${bb};color:${bc};border:2px solid ${b.colore || cp};border-radius:8px;padding:14px 36px;font-size:15px;font-weight:800;text-decoration:none;font-family:${F};">${esc(b.testo_btn || b.testo || 'Iscriviti →')}</a></td></tr></table></td></tr>`
      } else if (b.tipo === 'banner') {
        const cfgs = { info: { bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE' }, success: { bg: '#D1FAE5', color: '#065F46', border: '#6EE7B7' }, warning: { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' }, error: { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA' } }; const c = cfgs[b.stile || 'info'] || cfgs.info
        out += `<tr><td style="padding:0 0 16px;"><table width="100%" cellpadding="16" cellspacing="0" border="0" style="background:${c.bg};border:1px solid ${c.border};border-radius:10px;"><tr><td style="font-size:14px;color:${c.color};line-height:1.6;font-weight:500;font-family:${F};">${b.icona ? `${esc(b.icona)} ` : ''}${esc(b.testo)}</td></tr></table></td></tr>`
      } else if (b.tipo === 'immagine' && b.src) {
        const mw = b.size === 'small' ? '33%' : b.size === 'medium' ? '60%' : '100%'
        out += `<tr><td style="padding:0 0 16px;text-align:${b.align || 'center'};"><a href="${esc(url)}"><img src="${esc(b.src)}" alt="${esc(b.didascalia || '')}" style="max-width:${mw};width:100%;display:inline-block;border-radius:8px;" /></a>${b.didascalia ? `<p style="margin:6px 0 0;font-size:13px;color:#9CA3AF;font-style:italic;font-family:${F};">${esc(b.didascalia)}</p>` : ''}</td></tr>`
      } else if (b.tipo === 'separatore') {
        out += `<tr><td style="padding:0 0 32px;"><hr style="border:none;border-top:1px solid #E5E7EB;margin:0;" /></td></tr>`
      } else if (b.tipo === 'timeline') {
        const its = b.items || []
        out += `<tr><td style="padding:0 0 32px;">${its.map((it, i) => `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;"><tr><td width="44" valign="top" style="padding-right:14px;"><p style="margin:0;width:36px;height:36px;border-radius:50%;background:${cp};text-align:center;line-height:36px;font-size:12px;font-weight:800;color:#fff;font-family:${F};">${it.anno || i + 1}</p></td><td valign="top" style="padding-top:4px;"><p style="margin:0 0 4px;font-size:15px;font-weight:800;color:#0A0A0A;font-family:${F};">${esc(it.titolo)}</p><p style="margin:0;font-size:13px;color:#6B7280;line-height:1.65;font-family:${F};">${esc(it.testo)}</p></td></tr></table>`).join('')}</td></tr>`
      } else if (b.tipo === 'accordion') {
        const its = b.items || []
        out += `<tr><td style="padding:0 0 24px;">${its.map(it => `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;border:1px solid #E5E7EB;border-radius:10px;"><tr><td style="padding:14px 18px;background:#F9FAFB;border-radius:10px;"><p style="margin:0 0 8px;font-size:15px;font-weight:700;color:${cp};font-family:${F};">${esc(it.domanda)}</p><p style="margin:0;font-size:14px;color:#374151;line-height:1.6;font-family:${F};">${esc(it.risposta)}</p></td></tr></table>`).join('')}</td></tr>`
      } else if (b.tipo === 'carosello') {
        const imgs = (b.immagini || []).filter(i => i.src)
        if (imgs.length) out += `<tr><td style="padding:0 0 24px;text-align:center;"><a href="${esc(url)}"><img src="${esc(imgs[0].src)}" alt="${esc(imgs[0].didascalia || '')}" style="max-width:100%;display:inline-block;border-radius:8px;" /></a>${imgs.length > 1 ? `<p style="margin:6px 0 0;font-size:12px;color:#9CA3AF;font-family:${F};">+${imgs.length - 1} immagini sul sito</p>` : ''}</td></tr>`
      }
    }
    return out
  }

  function renderSessioni() {
    const ss = ev.sessioni || []; if (!ss.length) return ''
    return `<tr><td style="padding:0 0 8px;"><p style="margin:0 0 20px;font-size:22px;font-weight:900;color:#0A0A0A;letter-spacing:-.03em;font-family:${F};">Programma</p>${ss.map((s, i) => `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;"><tr><td width="44" valign="top" style="padding-right:14px;"><p style="margin:0;width:36px;height:36px;border-radius:50%;background:${cp}22;border:2px solid ${cp};text-align:center;line-height:32px;font-size:12px;font-weight:800;color:${cp};font-family:${F};">${i + 1}</p></td><td valign="top" style="padding-top:4px;"><p style="margin:0 0 3px;font-size:15px;font-weight:800;color:#0A0A0A;font-family:${F};">${esc(s.titolo || `Sessione ${i + 1}`)}</p>${s.ora_inizio || s.data ? `<span style="display:inline-block;font-size:11px;font-weight:600;color:${cp};background:${cp}18;padding:2px 8px;border-radius:20px;font-family:${F};">${s.data ? new Date(s.data + 'T00:00').toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' }) : ''}${s.ora_inizio ? (s.data ? ' · ' : '') + s.ora_inizio : ''}${s.ora_fine ? '–' + s.ora_fine : ''}</span>` : ''} ${s.relatore ? `<p style="margin:4px 0 0;font-size:13px;color:#6B7280;font-family:${F};">&#127908; ${esc(s.relatore)}</p>` : ''} ${s.luogo ? `<p style="margin:2px 0 0;font-size:12px;color:#9CA3AF;font-family:${F};">&#128205; ${esc(s.luogo)}</p>` : ''} ${s.descrizione ? `<p style="margin:6px 0 0;font-size:13px;color:#374151;line-height:1.6;font-family:${F};">${esc(s.descrizione)}</p>` : ''}</td></tr></table>`).join('')}</td></tr>`
  }

  // Extra HTML (dall'editor testo email)
  const extraBlock = extraHtml
    ? `<tr><td bgcolor="#FFFFFF" style="padding:0 ${PAD}px 0;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:0 0 24px;">${tiptapToEmail(extraHtml, F)}</td></tr></table></td></tr>`
    : ''

  // Footer
  const footerBlock = (() => {
    if (ev.footer_html) {
      return `<tr><td bgcolor="${tema.sfondo_footer || '#F4F5F7'}" style="padding:${PAD}px;text-align:center;border-top:1px solid #E5E7EB;">
        ${richToEmail(ev.footer_html, cp, F)}
        <p style="margin:8px 0 0;font-size:11px;color:#9CA3AF;font-family:${F};"><a href="${esc(url)}" style="color:${cp};text-decoration:none;">Visualizza la pagina dell&apos;evento</a></p>
      </td></tr>`
    }
    return `<tr><td bgcolor="${tema.sfondo_footer || '#F4F5F7'}" style="padding:20px ${PAD}px;text-align:center;border-top:1px solid #E5E7EB;">
      <a href="${esc(url)}" style="display:inline-block;margin-bottom:10px;"><img src="${esc(logoUrl)}" alt="CNA Roma" height="36" style="height:36px;border:0;" /></a>
      <p style="margin:0;font-size:12px;color:${tema.testo_footer || '#9CA3AF'};line-height:1.6;font-family:${F};">${esc(ev.footer_testo || `© ${new Date().getFullYear()} CNA di Roma — Artigiani Imprenditori d'Italia`)}</p>
      <p style="margin:8px 0 0;font-size:11px;color:#9CA3AF;font-family:${F};"><a href="${esc(url)}" style="color:${cp};text-decoration:none;">Visualizza la pagina dell&apos;evento</a></p>
    </td></tr>`
  })()

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<!--[if !mso]><!-->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
<!--<![endif]-->
<title>${esc(ev.titolo)}</title>
<style type="text/css">
  body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
  table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;}
  img{-ms-interpolation-mode:bicubic;border:0;outline:none;text-decoration:none;}
  body{margin:0!important;padding:0!important;background-color:#F4F5F7;}
  a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;}
</style>
<!--[if mso]>
<style>body,table,td,p,a,li{font-family:Arial,Helvetica,sans-serif!important;}</style>
<xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
<![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#F4F5F7;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F4F5F7">
<tr><td align="center">
  <table width="${W}" cellpadding="0" cellspacing="0" border="0" style="max-width:${W}px;width:100%;">
    <!-- HERO -->
    <tr><td style="${heroCssStyle}min-height:${heroH}px;padding:0;" height="${heroH}">${heroContent}</td></tr>

    ${(dataTesto || ev.luogo) && opts.mostraDataLuogo ? `
    <!-- DATA E LUOGO -->
    <tr><td bgcolor="#FFFFFF" style="padding:14px ${PAD}px;border-bottom:1px solid #E5E7EB;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        ${dataTesto ? `<td style="padding:4px 8px 4px 0;font-size:14px;font-weight:700;color:#0A0A0A;font-family:${F};">&#128197; ${esc(dataTesto)}</td>` : ''}
        ${ev.luogo ? `<td style="padding:4px 0;font-size:14px;font-weight:700;font-family:${F};"><a href="https://maps.google.com/?q=${encodeURIComponent(ev.luogo)}" style="color:${cp};text-decoration:none;font-family:${F};">&#128205; ${esc(ev.luogo)}</a></td>` : ''}
      </tr></table>
    </td></tr>` : ''}

    ${opts.mostraCta ? `
    <!-- CTA PRINCIPALE -->
    <tr><td bgcolor="#FFFFFF" style="padding:24px ${PAD}px;text-align:center;border-bottom:1px solid #F3F4F6;">
      <a href="${esc(url)}" style="display:inline-block;background:${ctaBg};color:${ctaColor};border:${ctaBorder};border-radius:${ctaRadius};padding:14px 36px;font-size:15px;font-weight:800;text-decoration:none;font-family:${F};">
        ${esc(opts.testoCta || "Scopri l'evento e iscriviti")} &rarr;
      </a>
    </td></tr>` : ''}

    <!-- TESTO AGGIUNTIVO (dall'editor) -->
    ${extraBlock}

    <!-- CORPO EVENTO -->
    <tr><td bgcolor="#FFFFFF" style="padding:${PAD}px ${PAD}px ${Math.round(PAD / 4)}px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${renderBlocks()}
        ${opts.mostraSessioni ? renderSessioni() : ''}
      </table>
    </td></tr>

    ${opts.mostraCtaFondo ? `
    <!-- CTA ISCRIZIONE -->
    <tr><td bgcolor="${tema.cta_bg || '#EEF3FF'}" style="padding:${PAD}px;border-top:1px solid ${cp}25;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td valign="middle" style="padding-right:16px;">
          <p style="margin:0 0 4px;font-size:17px;font-weight:900;color:#0A0A0A;letter-spacing:-.02em;font-family:${F};">Partecipa all&apos;evento</p>
          <p style="margin:0;font-size:13px;color:#4B5563;line-height:1.5;font-family:${F};">Registrazione gratuita. Ricevi il QR Code per l&apos;ingresso.</p>
        </td>
        <td valign="middle" align="right" width="160">
          <a href="${esc(url)}" style="display:inline-block;background:${ctaBg};color:${ctaColor};border:${ctaBorder};border-radius:${ctaRadius};padding:12px 22px;font-size:13px;font-weight:800;text-decoration:none;font-family:${F};white-space:nowrap;">
            Iscriviti ora &rsaquo;
          </a>
        </td>
      </tr></table>
    </td></tr>` : ''}

    ${opts.mostraFooter ? footerBlock : ''}
  </table>
</td></tr>
</table>
</body>
</html>`
}

/* ── Mini editor TipTap per email ─────────────────────────────────── */
function EmailTextEditor({ value, onChange }) {
  const savedSel = { current: null }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, code: false, codeBlock: false }),
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Aggiungi un testo introduttivo, nota, o qualsiasi contenuto prima del corpo email…' }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  const setLink = useCallback(() => {
    if (!editor) return
    const prev = editor.getAttributes('link').href || ''
    const url = window.prompt('URL del link:', prev)
    if (url === null) return
    if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  if (!editor) return null

  const btnStyle = (active) => ({
    padding: '4px 8px', border: `1px solid ${active ? '#003DA5' : '#E5E7EB'}`,
    borderRadius: '5px', backgroundColor: active ? '#EEF3FF' : '#fff',
    color: active ? '#003DA5' : '#374151', cursor: 'pointer', fontSize: '13px',
    fontWeight: '700', fontFamily: "'Inter',sans-serif", lineHeight: 1,
    display: 'flex', alignItems: 'center', gap: '3px',
  })

  const currentColor = editor.getAttributes('textStyle').color || '#000000'

  return (
    <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '8px 10px', backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', alignItems: 'center' }}>

        {/* Formato testo */}
        <button type="button" style={btnStyle(editor.isActive('bold'))}
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleBold().run() }}>
          <strong>B</strong>
        </button>
        <button type="button" style={btnStyle(editor.isActive('italic'))}
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleItalic().run() }}>
          <em>I</em>
        </button>
        <button type="button" style={btnStyle(editor.isActive('underline'))}
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleUnderline().run() }}>
          <u>U</u>
        </button>

        <div style={{ width: '1px', height: '20px', backgroundColor: '#E5E7EB', margin: '0 2px' }} />

        {/* Allineamento */}
        {['left', 'center', 'right'].map(a => (
          <button key={a} type="button"
            style={btnStyle(editor.isActive({ textAlign: a }))}
            onMouseDown={e => { e.preventDefault(); editor.chain().focus().setTextAlign(a).run() }}
            title={a === 'left' ? 'Allinea sinistra' : a === 'center' ? 'Centra' : 'Allinea destra'}>
            {a === 'left' ? '≡' : a === 'center' ? '☰' : '≡'}
          </button>
        ))}

        <div style={{ width: '1px', height: '20px', backgroundColor: '#E5E7EB', margin: '0 2px' }} />

        {/* Colore testo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }} title="Colore testo">
          <span style={{ fontSize: '9px', fontWeight: '700', color: '#9CA3AF', fontFamily: "'Inter',sans-serif", lineHeight: 1, marginBottom: '2px' }}>A</span>
          <input
            type="color"
            value={currentColor}
            onMouseDown={() => {
              if (editor) {
                const { from, to } = editor.state.selection
                savedSel.current = from !== to ? { from, to } : null
              }
            }}
            onChange={e => {
              const color = e.target.value
              const sel = savedSel.current
              if (sel) {
                const { state, view } = editor
                const tsm = state.schema.marks.textStyle
                if (tsm) {
                  const tr = state.tr
                  state.doc.nodesBetween(sel.from, sel.to, (node, pos) => {
                    if (!node.isText) return
                    const nf = Math.max(sel.from, pos), nt = Math.min(sel.to, pos + node.nodeSize)
                    const ex = node.marks.find(m => m.type === tsm)
                    tr.removeMark(nf, nt, tsm)
                    tr.addMark(nf, nt, tsm.create({ ...(ex ? ex.attrs : {}), color }))
                  })
                  view.dispatch(tr)
                  editor.commands.setTextSelection(sel)
                }
              } else {
                editor.chain().focus().setColor(color).run()
              }
            }}
            style={{ width: '28px', height: '22px', border: '1px solid #D1D5DB', borderRadius: '4px', cursor: 'pointer', padding: '1px' }}
          />
        </div>

        <div style={{ width: '1px', height: '20px', backgroundColor: '#E5E7EB', margin: '0 2px' }} />

        {/* Titoli */}
        {[1, 2, 3].map(lv => (
          <button key={lv} type="button"
            style={btnStyle(editor.isActive('heading', { level: lv }))}
            onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: lv }).run() }}>
            H{lv}
          </button>
        ))}

        <div style={{ width: '1px', height: '20px', backgroundColor: '#E5E7EB', margin: '0 2px' }} />

        {/* Liste */}
        <button type="button" style={btnStyle(editor.isActive('bulletList'))}
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleBulletList().run() }}>
          • Lista
        </button>
        <button type="button" style={btnStyle(editor.isActive('orderedList'))}
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run() }}>
          1. Lista
        </button>

        <div style={{ width: '1px', height: '20px', backgroundColor: '#E5E7EB', margin: '0 2px' }} />

        {/* Link */}
        <button type="button" style={btnStyle(editor.isActive('link'))} onMouseDown={e => { e.preventDefault(); setLink() }}>
          🔗 Link
        </button>
        {editor.isActive('link') && (
          <button type="button" style={btnStyle(false)}
            onMouseDown={e => { e.preventDefault(); editor.chain().focus().unsetLink().run() }}>
            ✕ Link
          </button>
        )}

        <div style={{ width: '1px', height: '20px', backgroundColor: '#E5E7EB', margin: '0 2px' }} />

        {/* Cancella formattazione */}
        <button type="button" style={btnStyle(false)}
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().clearNodes().unsetAllMarks().run() }}
          title="Rimuovi formattazione">
          ✕ fmt
        </button>
      </div>

      {/* Area testo */}
      <style>{`
        .mu-editor .ProseMirror { padding:14px 16px; min-height:120px; outline:none; font-family:'Inter',sans-serif; font-size:14px; line-height:1.7; color:#374151; }
        .mu-editor .ProseMirror p.is-editor-empty:first-child::before { content:attr(data-placeholder); color:#9CA3AF; float:left; height:0; pointer-events:none; }
        .mu-editor .ProseMirror p { margin:0 0 10px; }
        .mu-editor .ProseMirror strong { font-weight:800; }
        .mu-editor .ProseMirror a { color:#003DA5; text-decoration:underline; }
      `}</style>
      <div className="mu-editor">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

/* ── UI helpers ───────────────────────────────────────────────────── */
const sF = { fontFamily: "'Inter',sans-serif" }
const sInput = { ...sF, fontSize: '13px', padding: '7px 10px', border: '1px solid #D1D5DB', borderRadius: '6px', outline: 'none', backgroundColor: '#FFFFFF', color: '#0A0A0A', width: '100%', boxSizing: 'border-box' }
function Lbl({ children }) { return <span style={{ ...sF, fontSize: '11px', fontWeight: '700', color: '#6B7280', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '.05em' }}>{children}</span> }
function Fld({ label, width, children }) { return <div style={{ display: 'flex', flexDirection: 'column', width: width || 'auto', flex: width ? 'none' : '1', minWidth: '100px' }}><Lbl>{label}</Lbl>{children}</div> }
function Row({ children }) { return <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>{children}</div> }
function Toggle({ label, value, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
      <div onClick={() => onChange(!value)} style={{ width: '36px', height: '20px', borderRadius: '10px', flexShrink: 0, backgroundColor: value ? '#003DA5' : '#D1D5DB', position: 'relative', cursor: 'pointer', transition: 'background .2s' }}>
        <div style={{ position: 'absolute', top: '2px', left: value ? '18px' : '2px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#fff', transition: 'left .2s' }} />
      </div>
      <span style={{ ...sF, fontSize: '13px', color: '#374151' }}>{label}</span>
    </label>
  )
}
function ColorField({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <Lbl>{label}</Lbl>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          style={{ width: '36px', height: '32px', border: '1px solid #D1D5DB', borderRadius: '5px', cursor: 'pointer', padding: '2px', flexShrink: 0 }} />
        <input type="text" value={value}
          onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) onChange(e.target.value) }}
          style={{ ...sInput, fontFamily: 'monospace', fontSize: '12px', width: '90px' }} />
      </div>
    </div>
  )
}

/* ── Defaults ─────────────────────────────────────────────────────── */
const DEF = {
  larghezza: 600, larghezzaCustom: '', padding: 32,
  testoCta: "Scopri l'evento e iscriviti",
  ctaBg: '', ctaColor: '', ctaBorder: '', ctaRadius: null,
  mostraDataLuogo: true, mostraCta: true, mostraCtaFondo: true, mostraSessioni: true, mostraFooter: true,
}

/* ── Componente principale ──────────────────────────────────────────── */
export default function MailUpExportTab({ event }) {
  const [copied,     setCopied]     = useState(false)
  const [showOpts,   setShowOpts]   = useState(true)
  const [showEditor, setShowEditor] = useState(true)
  const [showCta,    setShowCta]    = useState(false)
  const [opts,       setOpts]       = useState(DEF)
  const [extraHtml,  setExtraHtml]  = useState('')
  const upd = (k, v) => setOpts(o => ({ ...o, [k]: v }))

  const tema = event ? temaConDefault(event?.tema) : {}
  const cp   = tema.colore_primario || '#003DA5'

  // Inizializza colori CTA dai defaults tema quando event cambia
  const ctaBgEff     = opts.ctaBg     || (tema.btn_stile === 'contorno' ? 'transparent' : (tema.colore_pulsanti || cp))
  const ctaColorEff  = opts.ctaColor  || (tema.btn_stile === 'contorno' ? (tema.colore_pulsanti || cp) : (tema.colore_testo_btn || '#FFFFFF'))
  const ctaBorderEff = opts.ctaBorder || `2px solid ${tema.colore_pulsanti || cp}`

  const eventUrl = useMemo(() => event?.slug ? `${window.location.origin}/eventi/${event.slug}` : '', [event?.slug])

  const html = useMemo(() => {
    if (!event?.titolo) return ''
    return buildHtml(event, eventUrl, opts, extraHtml)
  }, [event, eventUrl, opts, extraHtml])

  const sizeKb    = useMemo(() => (new TextEncoder().encode(html).length / 1024).toFixed(1), [html])
  const sizeOk    = parseFloat(sizeKb) < 80
  const sizeWarn  = parseFloat(sizeKb) >= 80 && parseFloat(sizeKb) < 102
  const sizeError = parseFloat(sizeKb) >= 102

  async function copyHtml() {
    try { await navigator.clipboard.writeText(html) }
    catch { const ta = document.createElement('textarea'); ta.value = html; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta) }
    setCopied(true); setTimeout(() => setCopied(false), 2500)
  }

  if (!event?.titolo) return <div style={{ padding: '48px', textAlign: 'center' }}><p style={{ ...sF, fontSize: '15px', fontWeight: '600', color: '#374151' }}>Nessun evento caricato</p></div>
  if (!event.slug)    return <div style={{ padding: '48px', textAlign: 'center' }}><Mail size={40} style={{ color: '#D1D5DB', marginBottom: '12px' }} /><p style={{ ...sF, fontSize: '15px', fontWeight: '600', color: '#374151' }}>Slug mancante — salva prima l'evento</p></div>

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '48px' }}>

      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ ...sF, margin: '0 0 4px', fontSize: '20px', fontWeight: '900', color: '#0A0A0A', letterSpacing: '-.03em' }}>Esporta HTML per MailUp</h2>
        <p style={{ ...sF, margin: 0, fontSize: '13px', color: '#6B7280' }}>Incolla il codice nell'editor HTML di MailUp (<em>Messaggi → Email → Nuovo → Da editor HTML</em>).</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', backgroundColor: '#F4F5F7', borderRadius: '8px', marginBottom: '16px', border: '1px solid #E5E7EB' }}>
        <ExternalLink size={13} style={{ color: '#9CA3AF', flexShrink: 0 }} />
        <a href={eventUrl} target="_blank" rel="noopener noreferrer" style={{ ...sF, fontSize: '12px', color: '#003DA5', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{eventUrl}</a>
      </div>

      {/* ── EDITOR TESTO EMAIL ── */}
      <div style={{ border: '1px solid #E5E7EB', borderRadius: '10px', marginBottom: '12px', overflow: 'hidden' }}>
        <button type="button" onClick={() => setShowEditor(o => !o)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: showEditor ? '#EEF3FF' : '#F9FAFB', border: 'none', cursor: 'pointer', borderBottom: showEditor ? '1px solid #C7D9F8' : 'none' }}>
          <span style={{ ...sF, fontSize: '13px', fontWeight: '800', color: showEditor ? '#003DA5' : '#374151', display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Type size={14} /> Testo email
          </span>
          {showEditor ? <ChevronUp size={15} color="#9CA3AF" /> : <ChevronDown size={15} color="#9CA3AF" />}
        </button>
        {showEditor && (
          <div style={{ padding: '14px', backgroundColor: '#fff' }}>
            <p style={{ ...sF, fontSize: '12px', color: '#9CA3AF', margin: '0 0 10px', lineHeight: '1.5' }}>
              Testo aggiuntivo inserito <strong>prima del contenuto evento</strong> (dopo la CTA principale). Supporta grassetto, corsivo, colori, link, allineamento.
            </p>
            <EmailTextEditor value={extraHtml} onChange={setExtraHtml} />
            {extraHtml && extraHtml !== '<p></p>' && (
              <button type="button" onClick={() => setExtraHtml('')}
                style={{ ...sF, marginTop: '8px', padding: '4px 10px', border: '1px solid #FCA5A5', borderRadius: '5px', backgroundColor: '#FEF2F2', color: '#DC2626', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                ✕ Svuota testo
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── OPZIONI EMAIL ── */}
      <div style={{ border: '1px solid #E5E7EB', borderRadius: '10px', marginBottom: '12px', overflow: 'hidden' }}>
        <button type="button" onClick={() => setShowOpts(o => !o)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#F9FAFB', border: 'none', cursor: 'pointer', borderBottom: showOpts ? '1px solid #E5E7EB' : 'none' }}>
          <span style={{ ...sF, fontSize: '13px', fontWeight: '800', color: '#374151', display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Settings size={14} /> Opzioni layout
          </span>
          {showOpts ? <ChevronUp size={15} color="#9CA3AF" /> : <ChevronDown size={15} color="#9CA3AF" />}
        </button>
        {showOpts && (
          <div style={{ padding: '16px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <Row>
              <Fld label="Larghezza (px)" width="220px">
                <div style={{ display: 'flex', gap: '6px' }}>
                  <select value={opts.larghezzaCustom ? 'custom' : String(opts.larghezza)}
                    onChange={e => {
                      if (e.target.value === 'custom') { upd('larghezzaCustom', String(opts.larghezza)) }
                      else { upd('larghezza', Number(e.target.value)); upd('larghezzaCustom', '') }
                    }} style={{ ...sInput, flex: 1 }}>
                    <option value="500">500 px</option>
                    <option value="560">560 px</option>
                    <option value="600">600 px — standard</option>
                    <option value="640">640 px</option>
                    <option value="680">680 px</option>
                    <option value="800">800 px</option>
                    <option value="900">900 px</option>
                    <option value="1024">1024 px</option>
                    <option value="1280">1280 px</option>
                    <option value="custom">Personalizzato…</option>
                  </select>
                  {opts.larghezzaCustom !== '' && (
                    <input type="number" min="320" max="1600" step="10" value={opts.larghezzaCustom}
                      onChange={e => { upd('larghezzaCustom', e.target.value); const n = Number(e.target.value); if (n >= 320 && n <= 1600) upd('larghezza', n) }}
                      style={{ ...sInput, width: '80px', flexShrink: 0 }} placeholder="px" />
                  )}
                </div>
              </Fld>
              <Fld label="Padding laterale" width="160px">
                <select value={opts.padding} onChange={e => upd('padding', Number(e.target.value))} style={sInput}>
                  <option value={16}>16 px — compatto</option>
                  <option value={24}>24 px</option>
                  <option value={32}>32 px — standard</option>
                  <option value={48}>48 px — arioso</option>
                </select>
              </Fld>
              <Fld label="Testo CTA">
                <input type="text" value={opts.testoCta} onChange={e => upd('testoCta', e.target.value)} style={sInput} placeholder="Scopri l'evento e iscriviti" />
              </Fld>
            </Row>

            {/* Sezioni visibili */}
            <div>
              <Lbl>Sezioni visibili</Lbl>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 28px', paddingTop: '6px' }}>
                <Toggle label="Data e luogo"   value={opts.mostraDataLuogo} onChange={v => upd('mostraDataLuogo', v)} />
                <Toggle label="CTA in alto"    value={opts.mostraCta}       onChange={v => upd('mostraCta', v)} />
                <Toggle label="Sessioni"       value={opts.mostraSessioni}  onChange={v => upd('mostraSessioni', v)} />
                <Toggle label="CTA iscrizione" value={opts.mostraCtaFondo}  onChange={v => upd('mostraCtaFondo', v)} />
                <Toggle label="Footer"         value={opts.mostraFooter}    onChange={v => upd('mostraFooter', v)} />
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ── OPZIONI CTA ── */}
      <div style={{ border: '1px solid #E5E7EB', borderRadius: '10px', marginBottom: '16px', overflow: 'hidden' }}>
        <button type="button" onClick={() => setShowCta(o => !o)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#F9FAFB', border: 'none', cursor: 'pointer', borderBottom: showCta ? '1px solid #E5E7EB' : 'none' }}>
          <span style={{ ...sF, fontSize: '13px', fontWeight: '800', color: '#374151', display: 'flex', alignItems: 'center', gap: '7px' }}>
            🎨 Stile pulsanti CTA
          </span>
          {showCta ? <ChevronUp size={15} color="#9CA3AF" /> : <ChevronDown size={15} color="#9CA3AF" />}
        </button>
        {showCta && (
          <div style={{ padding: '16px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Row>
              <ColorField label="Sfondo pulsante" value={opts.ctaBg || ctaBgEff} onChange={v => upd('ctaBg', v)} />
              <ColorField label="Testo pulsante"  value={opts.ctaColor || ctaColorEff} onChange={v => upd('ctaColor', v)} />
              <Fld label="Colore bordo (hex)" width="160px">
                <input type="text" value={opts.ctaBorder ? opts.ctaBorder.replace(/^2px solid /, '') : (tema.colore_pulsanti || cp)}
                  onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) upd('ctaBorder', `2px solid ${e.target.value}`) }}
                  style={{ ...sInput, fontFamily: 'monospace', fontSize: '12px' }} placeholder="#003DA5" />
              </Fld>
              <Fld label="Border-radius (px)" width="130px">
                <input type="number" min="0" max="50" value={opts.ctaRadius ?? (tema.btn_raggio || 8)}
                  onChange={e => upd('ctaRadius', Number(e.target.value))}
                  style={sInput} />
              </Fld>
            </Row>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', padding: '10px 16px', backgroundColor: '#F4F5F7', borderRadius: '8px' }}>
              <span style={{ ...sF, fontSize: '12px', color: '#6B7280' }}>Anteprima:</span>
              <span style={{
                display: 'inline-block', padding: '10px 22px',
                backgroundColor: opts.ctaBg || ctaBgEff,
                color: opts.ctaColor || ctaColorEff,
                border: opts.ctaBorder || ctaBorderEff,
                borderRadius: opts.ctaRadius != null ? `${opts.ctaRadius}px` : `${tema.btn_raggio || 8}px`,
                fontSize: '14px', fontWeight: '800', fontFamily: "'Inter',sans-serif",
              }}>
                {opts.testoCta || "Scopri l'evento"} →
              </span>
              <button type="button" onClick={() => { upd('ctaBg', ''); upd('ctaColor', ''); upd('ctaBorder', ''); upd('ctaRadius', null) }}
                style={{ ...sF, padding: '4px 8px', border: '1px solid #E5E7EB', borderRadius: '5px', backgroundColor: '#fff', cursor: 'pointer', fontSize: '11px', color: '#9CA3AF' }}>
                Reset
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Peso */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', borderRadius: '8px', marginBottom: '14px', backgroundColor: sizeError ? '#FEF2F2' : sizeWarn ? '#FFFBEB' : '#F0FDF4', border: `1px solid ${sizeError ? '#FECACA' : sizeWarn ? '#FDE68A' : '#BBF7D0'}` }}>
        {(sizeWarn || sizeError) && <AlertTriangle size={13} style={{ color: sizeError ? '#DC2626' : '#D97706', flexShrink: 0 }} />}
        <span style={{ ...sF, fontSize: '13px', fontWeight: '700', color: sizeError ? '#DC2626' : sizeWarn ? '#92400E' : '#15803D' }}>
          Peso HTML: {sizeKb} KB{sizeOk ? ' — ✓ ottimale' : sizeWarn ? ' — vicino al limite Gmail 102 KB' : ' — ⚠ supera 102 KB: Gmail clipperà'}
        </span>
      </div>

      {/* Azioni */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button onClick={copyHtml} style={{ ...sF, display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: copied ? '#16A34A' : '#003DA5', color: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
          {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Copiato!' : 'Copia HTML'}
        </button>
        <a href={`data:text/html;charset=utf-8,${encodeURIComponent(html)}`} download={`email-${event.slug}.html`}
          style={{ ...sF, display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 20px', borderRadius: '8px', border: '1px solid #D1D5DB', color: '#374151', fontSize: '14px', fontWeight: '600', textDecoration: 'none', backgroundColor: '#fff' }}>
          ↓ Scarica .html
        </a>
      </div>

      {/* Istruzioni */}
      <div style={{ backgroundColor: '#EEF3FF', border: '1px solid #C7D9F8', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px' }}>
        <p style={{ ...sF, margin: '0 0 6px', fontSize: '13px', fontWeight: '800', color: '#003DA5' }}>Come importare in MailUp</p>
        <ol style={{ ...sF, margin: 0, paddingLeft: '16px', fontSize: '13px', color: '#374151', lineHeight: '1.9' }}>
          <li>Vai su <strong>Messaggi → Email → Nuovo messaggio</strong></li>
          <li>Scegli <strong>Da editor HTML</strong></li>
          <li>Incolla il codice copiato nell'area HTML</li>
          <li>Compila Oggetto e Sommario (max 100 car.)</li>
          <li>Invia una bozza di test prima dell'invio massivo</li>
        </ol>
      </div>

      {/* Anteprima */}
      <div style={{ border: '1px solid #E5E7EB', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ padding: '9px 14px', backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
          <span style={{ ...sF, fontSize: '11px', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.07em' }}>Anteprima — {opts.larghezza}px</span>
        </div>
        <div style={{ overflowX: 'auto', backgroundColor: '#F4F5F7', padding: '24px', display: 'flex', justifyContent: 'center' }}>
          <iframe srcDoc={html} title="Anteprima email MailUp"
            style={{ width: `${opts.larghezza}px`, minHeight: '500px', border: '1px solid #E5E7EB', borderRadius: '4px', display: 'block', backgroundColor: '#fff' }}
            sandbox="allow-same-origin" />
        </div>
      </div>

      {/* Sorgente */}
      <div style={{ border: '1px solid #E5E7EB', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ padding: '9px 14px', backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ ...sF, fontSize: '11px', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.07em' }}>Codice sorgente</span>
          <button onClick={copyHtml} style={{ ...sF, display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', border: '1px solid #D1D5DB', borderRadius: '5px', backgroundColor: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: '#374151' }}>
            {copied ? <Check size={11} /> : <Copy size={11} />} Copia
          </button>
        </div>
        <textarea readOnly value={html} onClick={e => e.target.select()}
          style={{ width: '100%', height: '240px', padding: '14px', fontFamily: 'monospace', fontSize: '11px', lineHeight: '1.6', border: 'none', resize: 'vertical', outline: 'none', backgroundColor: '#1E1E1E', color: '#D4D4D4', boxSizing: 'border-box' }} />
      </div>
    </div>
  )
}
