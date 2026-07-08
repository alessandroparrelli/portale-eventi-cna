/**
 * MailUpExportTab — editor a blocchi dedicato alla versione email MailUp
 * HTML generato: tabelle pure, zero CSS avanzato, compatibile Gmail/Outlook/Apple Mail
 */
import { useState, useMemo, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { Copy, Check, AlertTriangle, ExternalLink, Mail, Settings, ChevronDown, ChevronUp } from 'lucide-react'
import BlockEditor from './BlockEditor'
import { socialLinksEmailHtml } from '../SocialLinks'
import { temaConDefault } from './AspettoTab'
import { useSocial } from '../../hooks/useSocial'

/* ── helpers ─────────────────────────────────────────────────────── */
const F = "'Inter','Inter UI',Arial,Helvetica,sans-serif"

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

// Converte HTML TipTap → email HTML inline-styled universale
// Ordine: prima inline marks (bold/color/link), poi blocchi (p/h/ul)
function richToEmail(html, cp) {
  if (!html) return ''
  let h = html

  // 1. Rimuovi classi (mantieni style)
  h = h.replace(/\s+class="[^"]*"/g, '')

  // 2. Inline marks PRIMA — così i valori rimangono dentro i paragrafi
  h = h.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '<b style="font-weight:bold;">$1</b>')
  h = h.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '<i style="font-style:italic;">$1</i>')
  h = h.replace(/<u[^>]*>([\s\S]*?)<\/u>/gi, '<u style="text-decoration:underline;">$1</u>')

  // Helper: converte rgb(r,g,b) in hex
  function rgbToHex(raw) {
    raw = (raw||'').trim()
    if (raw.startsWith('rgb')) {
      const nums = raw.match(/\d+/g)
      if (nums && nums.length >= 3)
        return '#' + nums.slice(0,3).map(n => parseInt(n).toString(16).padStart(2,'0')).join('')
    }
    return raw
  }

  // 3. Span con colore/size da TipTap — converte rgb→hex
  h = h.replace(/<span style="([^"]*)">((?:[^<]|<(?!\/span>))*)<\/span>/gi, (_, st, inner) => {
    const colRaw = (st.match(/color:\s*([^;]+)/i)||[])[1]
    const sz     = (st.match(/font-size:\s*([^;]+)/i)||[])[1]
    const parts  = []
    if (colRaw) parts.push('color:' + rgbToHex(colRaw))
    if (sz)     parts.push('font-size:' + sz.trim())
    return parts.length ? '<span style="' + parts.join(';') + '">' + inner + '</span>' : inner
  })
  h = h.replace(/<span>/gi, '').replace(/<\/span>/gi, '')

  // 4. Link
  h = h.replace(/<a\s+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi,
    '<a href="$1" style="color:' + cp + ';text-decoration:underline;">$2</a>')

  // 5. Immagini
  h = h.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*/gi,
    '<img src="$1" alt="$2" width="100%" border="0" style="display:block;max-width:100%;border:0;"')

  // 6. Titoli H1-H6 — estrae colore/size/align dal tag e dagli span interni
  function convertHeading(tagAttrs, inner, defaultSize) {
    // Allineamento dal tag heading
    const alMatch = tagAttrs.match(/text-align:\s*(left|center|right|justify)/i)
    const align = alMatch ? alMatch[1] : null

    // Colore: cerca prima nello span interno, poi usa default
    let color = '#0A0A0A'
    const spanColMatch = inner.match(/style="[^"]*color:\s*([^;'"]+)/i)
    if (spanColMatch) {
      // Converte rgb(r,g,b) in hex se necessario
      const raw = spanColMatch[1].trim()
      if (raw.startsWith('rgb')) {
        const nums = raw.match(/\d+/g)
        if (nums && nums.length >= 3) {
          color = '#' + nums.slice(0,3).map(n => parseInt(n).toString(16).padStart(2,'0')).join('')
        }
      } else {
        color = raw
      }
    }

    // Font-size: cerca nello span interno, poi usa default
    let size = defaultSize
    const spanSzMatch = inner.match(/style="[^"]*font-size:\s*([^;'"]+)/i)
    if (spanSzMatch) size = spanSzMatch[1].trim()

    // Pulisci span wrapper mantenendo il testo (i <b> dentro rimangono)
    const cleanInner = inner
      .replace(/<span[^>]*>/gi, '')
      .replace(/<\/span>/gi, '')

    const styles = [
      'margin:0 0 12px 0', 'padding:0',
      'font-size:' + size, 'font-weight:bold',
      'color:' + color, 'line-height:1.2',
      'font-family:' + F,
    ]
    if (align) styles.push('text-align:' + align)

    return '<p style="' + styles.join(';') + ';">' + cleanInner + '</p>'
  }
  h = h.replace(/<h1([^>]*)>([\s\S]*?)<\/h1>/gi, (_, a, i) => convertHeading(a, i, '26px'))
  h = h.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/gi, (_, a, i) => convertHeading(a, i, '22px'))
  h = h.replace(/<h3([^>]*)>([\s\S]*?)<\/h3>/gi, (_, a, i) => convertHeading(a, i, '18px'))
  h = h.replace(/<h4([^>]*)>([\s\S]*?)<\/h4>/gi, (_, a, i) => convertHeading(a, i, '15px'))
  h = h.replace(/<h5([^>]*)>([\s\S]*?)<\/h5>/gi, (_, a, i) => convertHeading(a, i, '15px'))
  h = h.replace(/<h6([^>]*)>([\s\S]*?)<\/h6>/gi, (_, a, i) => convertHeading(a, i, '15px'))

  // 7. Liste
  h = h.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, items) =>
    items.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (__, li) =>
      '<p style="margin:0 0 5px 0;padding:0 0 0 16px;font-size:15px;color:#374151;line-height:1.6;font-family:' + F + ';">&#8226;&nbsp;' + li.trim() + '</p>'))
  h = h.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, items) => {
    let n = 0
    return items.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (__, li) => {
      n++
      return '<p style="margin:0 0 5px 0;padding:0 0 0 16px;font-size:15px;color:#374151;line-height:1.6;font-family:' + F + ';">' + n + '.&nbsp;' + li.trim() + '</p>'
    })
  })

  // 8. Paragrafi — preserva text-align, poi pulisci span lasciando stili inline
  function convertPara(st, inner) {
    const alMatch = st.match(/text-align:\s*(left|center|right|justify)/i)
    const alStyle = alMatch ? 'text-align:' + alMatch[1] + ';' : ''
    // Preserva span con colore/size già convertiti al passo 3
    return '<p style="margin:0 0 10px 0;padding:0;font-size:15px;color:#374151;line-height:1.75;font-family:' + F + ';' + alStyle + '">' + inner + '</p>'
  }
  h = h.replace(/<p\s+style="([^"]*)">([\s\S]*?)<\/p>/gi, (_, st, inner) => convertPara(st, inner))
  h = h.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, inner) => convertPara('', inner))

  // 9. BR
  h = h.replace(/<br\s*\/?>/gi, '<br />')

  // 10. Rimuovi wrapper non-email
  h = h.replace(/<(div|section|article|figure|blockquote|nav|aside|header|footer)[^>]*>/gi, '')
  h = h.replace(/<\/(div|section|article|figure|blockquote|nav|aside|header|footer)>/gi, '')

  return h
}

/* ── Builder HTML ─────────────────────────────────────────────────── */
function buildHtml(ev, url, blocchi, opts, socialLinks) {
  const tema = temaConDefault(ev?.tema)
  const cp   = tema.colore_primario || '#003DA5'
  const lh   = ev.layout_hero || {}
  const W    = opts.larghezza || 600
  const PAD  = opts.padding   || 32

  const ctaBg     = opts.ctaBg    || tema.colore_pulsanti || cp
  const ctaColor  = opts.ctaColor || tema.colore_testo_btn || '#FFFFFF'
  const ctaRadius = opts.ctaRadius != null ? opts.ctaRadius : (tema.btn_raggio || 6)

  const logoUrl = ev?.logo_url || 'https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png'
  const logoH   = Number(lh.logo_altezza || tema.logo_altezza || 48)
  const heroImg = ev.immagine_hero || null
  const align   = lh.allineamento === 'sinistra' ? 'left' : 'center'

  const titoloSize   = (() => { const r = lh.titolo_dimensione || ''; if (r.startsWith('clamp')) return '32px'; return r || '32px' })()
  const titoloColore = lh.titolo_colore || '#FFFFFF'
  const titoloW      = 'bold'
  const heroBg       = cp

  const dataTesto = ev.data_inizio
    ? fmtData(ev.data_inizio) + (fmtOra(ev.data_inizio) ? ` &middot; ${fmtOra(ev.data_inizio)}` : '') +
      (ev.data_fine && fmtOra(ev.data_fine) ? ` &mdash; ${fmtOra(ev.data_fine)}` : '')
    : null

  // ── HERO ── tecnica universale: background="" + VML Outlook
  // background="" su <td> è supportato da Gmail (web/app), Apple Mail, Yahoo, Outlook.com
  // Outlook desktop (2007-2021): VML con v:rect + v:fill
  // Calcola altezza hero proporzionale alla larghezza
  const heroH = heroImg ? Math.round(W * 0.45) : Math.round(W * 0.35)
  const vPad  = Math.round(heroH * 0.12)

  // Testo interno al hero — identico per VML e non-VML
  const heroInnerContent = `
    <a href="${esc(url)}" style="text-decoration:none;display:block;text-align:${align};">
      <img src="${esc(logoUrl)}" height="${logoH}" alt="CNA Roma" border="0"
        style="height:${logoH}px;display:inline-block;border:0;${align==='center'?'margin:0 auto 16px;':'margin-bottom:16px;'}" />
    </a>
    <p style="margin:0 0 8px 0;padding:0;font-size:${titoloSize};font-weight:bold;color:${titoloColore};font-family:${F};text-align:${align};line-height:1.1;${lh.titolo_maiuscolo?'text-transform:uppercase;':''}">${esc(ev.titolo)}</p>
    ${lh.titolo2?`<p style="margin:0 0 8px 0;padding:0;font-size:17px;color:#FFFFFF;font-family:${F};text-align:${align};">${esc(lh.titolo2)}</p>`:''}
    ${ev.sottotitolo?`<p style="margin:0;padding:0;font-size:15px;color:#FFFFFF;font-family:${F};text-align:${align};">${esc(ev.sottotitolo)}</p>`:''}`

  const heroRow = heroImg ? `
  <!--[if gte mso 9]>
  <tr><td bgcolor="${heroBg}" valign="middle" align="${align}" style="padding:0;">
    <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false"
      style="mso-width-percent:1000;height:${heroH}px;v-text-anchor:middle;">
      <v:fill type="frame" src="${esc(heroImg)}" color="${heroBg}" />
      <v:textbox inset="0,0,0,0">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td align="${align}" valign="middle" style="padding:${vPad}px ${PAD}px;text-align:${align};">
            ${heroInnerContent}
          </td></tr>
        </table>
      </v:textbox>
    </v:rect>
  </td></tr>
  <![endif]-->
  <!--[if !mso]><!-->
  <tr>
    <td background="${esc(heroImg)}" bgcolor="${heroBg}" valign="middle" align="${align}"
      height="${heroH}"
      style="background-image:url('${esc(heroImg)}');background-size:cover;background-position:center center;background-color:${heroBg};padding:${vPad}px ${PAD}px;text-align:${align};height:${heroH}px;">
      ${heroInnerContent}
    </td>
  </tr>
  <!--<![endif]-->` :
  `<tr>
    <td bgcolor="${heroBg}" valign="middle" align="${align}"
      style="background-color:${heroBg};padding:${vPad}px ${PAD}px;text-align:${align};">
      ${heroInnerContent}
    </td>
  </tr>`

  // Riga immagine non più necessaria — immagine è sfondo del td
  const heroImgRow = ''
  const heroTextRow = heroRow

  // ── Blocchi ────────────────────────────────────────────────────────
  function row(content, bg) {
    const bgc = bg || '#FFFFFF'
    return `<tr><td bgcolor="${bgc}" style="padding:20px ${PAD}px 20px ${PAD}px;background-color:${bgc};mso-padding-alt:20px ${PAD}px 20px ${PAD}px;">${content}</td></tr>`
  }
  function spacer() {
    return `<tr><td height="1" bgcolor="#E5E7EB" style="font-size:1px;line-height:1px;border-bottom:1px solid #E5E7EB;">&nbsp;</td></tr>`
  }

  function renderBlocchi() {
    if (!blocchi || !blocchi.length) return ''
    let out = ''
    for (const b of blocchi) {

      if (b.tipo === 'testo') {
        out += row(richToEmail(b.html, cp))

      } else if (b.tipo === 'titolo') {
        const al = b.allineamento || 'center'
        out += row(`
          <p style="margin:0 0 6px 0;padding:0;font-size:24px;font-weight:bold;color:#0A0A0A;font-family:${F};text-align:${al};">${esc(b.testo)}</p>
          ${b.sottotitolo?`<p style="margin:0;padding:0;font-size:15px;color:#6B7280;font-family:${F};text-align:${al};">${esc(b.sottotitolo)}</p>`:''}`)

      } else if (b.tipo === 'immagine' && b.src) {
        const al = b.align || 'center'
        out += row(`
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td align="${al}">
              <a href="${esc(url)}" style="text-decoration:none;">
                <img src="${esc(b.src)}" alt="${esc(b.didascalia||'')}"
                  style="display:block;max-width:100%;border:0;" />
              </a>
              ${b.didascalia?`<p style="margin:6px 0 0;padding:0;font-size:12px;color:#9CA3AF;font-family:${F};text-align:${al};">${esc(b.didascalia)}</p>`:''}
            </td></tr>
          </table>`)

      } else if (b.tipo === 'separatore') {
        out += spacer()

      } else if (b.tipo === 'stats') {
        const its = b.items || []
        const cw  = Math.floor(100 / Math.max(its.length, 1))
        out += row(`
          <table width="100%" cellpadding="8" cellspacing="0" border="0">
            <tr>${its.map(it=>`
              <td width="${cw}%" align="center" style="text-align:center;">
                <p style="margin:0 0 4px;padding:0;font-size:36px;font-weight:bold;color:${b.colore||cp};font-family:${F};">${esc(it.num||it.numero)}</p>
                <p style="margin:0;padding:0;font-size:11px;color:#6B7280;font-family:${F};text-transform:uppercase;">${esc(it.label)}</p>
              </td>`).join('')}
            </tr>
          </table>`)

      } else if (b.tipo === 'griglia') {
        const cols = b.cols || b.colonne || []
        out += row(`
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>${cols.map(c=>`
              <td width="${Math.floor(100/cols.length)}%" valign="top" style="padding:6px;">
                <table width="100%" cellpadding="14" cellspacing="0" border="0" style="border:1px solid #E5E7EB;">
                  <tr><td>
                    ${c.titolo?`<p style="margin:0 0 5px;padding:0;font-size:14px;font-weight:bold;color:#0A0A0A;font-family:${F};">${esc(c.titolo)}</p>`:''}
                    ${c.testo?`<p style="margin:0;padding:0;font-size:13px;color:#6B7280;font-family:${F};">${esc(c.testo)}</p>`:''}
                  </td></tr>
                </table>
              </td>`).join('')}
            </tr>
          </table>`)

      } else if (b.tipo === 'badge_list') {
        const its = b.items || []
        out += row(`
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>${its.map(it=>`
              <td width="50%" valign="top" style="padding:4px;">
                <table width="100%" cellpadding="10" cellspacing="0" border="0" style="border:1px solid #E5E7EB;">
                  <tr><td style="font-size:13px;color:#374151;font-family:${F};">&#10003;&nbsp;${esc(it.testo)}</td></tr>
                </table>
              </td>`).join('')}
            </tr>
          </table>`)

      } else if (b.tipo === 'banner') {
        const cfgs = {
          info:    {bg:'#EFF6FF',color:'#1E40AF',border:'#BFDBFE'},
          success: {bg:'#D1FAE5',color:'#065F46',border:'#6EE7B7'},
          warning: {bg:'#FFFBEB',color:'#92400E',border:'#FDE68A'},
          error:   {bg:'#FEF2F2',color:'#991B1B',border:'#FECACA'},
        }
        const cfg = cfgs[b.stile||'info']||cfgs.info
        out += `<tr><td style="padding:8px ${PAD}px;">
          <table width="100%" cellpadding="14" cellspacing="0" border="0" bgcolor="${cfg.bg}" style="border:1px solid ${cfg.border};background-color:${cfg.bg};">
            <tr><td style="font-size:14px;color:${cfg.color};font-family:${F};">${b.icona?`${esc(b.icona)} `:''}${esc(b.testo)}</td></tr>
          </table>
        </td></tr>`

      } else if (b.tipo === 'cta') {
        const bb = b.stile==='contorno'?'transparent':(b.colore||cp)
        const bc = b.stile==='contorno'?(b.colore||cp):'#FFFFFF'
        out += row(`
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td align="center" style="padding:16px 0;text-align:center;">
              ${b.titolo?`<p style="margin:0 0 14px;padding:0;font-size:20px;font-weight:bold;color:#0A0A0A;font-family:${F};">${esc(b.titolo)}</p>`:''}
              <a href="${esc(url)}"
                style="display:inline-block;padding:14px 32px;background-color:${bb};color:${bc};font-size:15px;font-weight:bold;text-decoration:none;font-family:${F};border:2px solid ${b.colore||cp};">
                ${esc(b.testo_btn||b.testo||'Iscriviti')}
              </a>
            </td></tr>
          </table>`, '#F4F5F7')

      } else if (b.tipo === 'timeline') {
        const its = b.items||[]
        out += row(its.map((it,i)=>`
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
            <tr>
              <td width="40" valign="top" style="padding-right:12px;">
                <table width="36" cellpadding="0" cellspacing="0" border="0">
                  <tr><td align="center" bgcolor="${cp}" style="width:36px;height:36px;border-radius:18px;background-color:${cp};font-size:12px;font-weight:bold;color:#FFFFFF;font-family:${F};text-align:center;line-height:36px;">${it.anno||i+1}</td></tr>
                </table>
              </td>
              <td valign="top" style="padding-top:4px;">
                <p style="margin:0 0 4px;padding:0;font-size:14px;font-weight:bold;color:#0A0A0A;font-family:${F};">${esc(it.titolo)}</p>
                <p style="margin:0;padding:0;font-size:13px;color:#6B7280;font-family:${F};">${esc(it.testo)}</p>
              </td>
            </tr>
          </table>`).join(''))

      } else if (b.tipo === 'accordion') {
        const its = b.items||[]
        out += row(its.map(it=>`
          <table width="100%" cellpadding="12" cellspacing="0" border="0" style="margin-bottom:8px;border:1px solid #E5E7EB;background-color:#F9FAFB;">
            <tr><td>
              <p style="margin:0 0 6px;padding:0;font-size:14px;font-weight:bold;color:${cp};font-family:${F};">${esc(it.domanda)}</p>
              <p style="margin:0;padding:0;font-size:13px;color:#374151;font-family:${F};">${esc(it.risposta)}</p>
            </td></tr>
          </table>`).join(''))

      } else if (b.tipo === 'testimonial') {
        const its = b.items||[]
        out += row(`
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>${its.map(it=>`
              <td width="${Math.floor(100/its.length)}%" valign="top" style="padding:6px;">
                <table width="100%" cellpadding="16" cellspacing="0" border="0" style="border:1px solid #E5E7EB;">
                  <tr><td>
                    <p style="margin:0 0 10px;padding:0;font-size:13px;color:#374151;font-family:${F};font-style:italic;">&ldquo;${esc(it.testo)}&rdquo;</p>
                    <p style="margin:0;padding:0;font-size:13px;font-weight:bold;color:#0A0A0A;font-family:${F};">${esc(it.nome)}</p>
                    ${it.ruolo?`<p style="margin:2px 0 0;padding:0;font-size:12px;color:#9CA3AF;font-family:${F};">${esc(it.ruolo)}</p>`:''}
                  </td></tr>
                </table>
              </td>`).join('')}
            </tr>
          </table>`)

      } else if (b.tipo === 'video' && b.url) {
        const yt = b.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
        if (yt) {
          out += row(`
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td align="center">
                <a href="${esc(b.url)}" style="text-decoration:none;">
                  <img src="https://img.youtube.com/vi/${yt[1]}/hqdefault.jpg"
                    alt="${esc(b.didascalia||'Video')}" width="${W-PAD*2}"
                    style="display:block;max-width:100%;border:0;" />
                </a>
                <p style="margin:6px 0 0;padding:0;font-size:13px;color:${cp};font-family:${F};">&#9654; Guarda il video</p>
              </td></tr>
            </table>`)
        }

      } else if (b.tipo === 'carosello') {
        const imgs = (b.immagini||[]).filter(i=>i.src)
        if (imgs.length) {
          out += row(`
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td align="center">
                <a href="${esc(url)}" style="text-decoration:none;">
                  <img src="${esc(imgs[0].src)}" alt="${esc(imgs[0].didascalia||'')}"
                    width="${W-PAD*2}" style="display:block;max-width:100%;border:0;" />
                </a>
                ${imgs.length>1?`<p style="margin:6px 0 0;padding:0;font-size:12px;color:#9CA3AF;font-family:${F};">+${imgs.length-1} immagini sul sito</p>`:''}
              </td></tr>
            </table>`)
        }
      }
    }
    return out
  }

  // Footer
  // sfondo_footer può contenere un gradiente CSS (non supportato dai client email) — estraggo il primo colore hex
  const rawFooterBg = tema.sfondo_footer || 'linear-gradient(160deg, #003DA5 0%, #001F5C 100%)'
  const footerBgMatch = rawFooterBg.match(/#[0-9A-Fa-f]{6}/)
  const footerBg    = footerBgMatch ? footerBgMatch[0] : '#003DA5'
  const footerText  = '#ffffff'
  const footerMuted = '#C7D9F8'

  // Contenuto footer: se c'è footer_html lo converto, altrimenti uso il default email-safe
  // Dopo la conversione, forzo tutti i color inline a bianco (il footer ha sempre sfondo scuro)
  const footerContentRaw = ev.footer_html
    ? richToEmail(ev.footer_html, footerText)
    : `<p style="margin:0 0 12px;padding:0;font-size:14px;font-weight:bold;color:${footerText};font-family:${F};text-align:center;">&#x1F449; Insieme &egrave; meglio &#x1F448;</p>` +
      `<p style="margin:0;padding:0;font-size:13px;color:${footerText};font-family:${F};text-align:center;line-height:1.7;">` +
      `<strong>CNA di Roma</strong><br/>Via Cristoforo Colombo, 283/A, 00147 Roma<br/>Tel. 06570151 &bull; Email info@cnaroma.it</p>`
  const footerContent = footerContentRaw
    .replace(/color\s*:\s*#[0-9a-fA-F]{3,6}/g, 'color:#ffffff')
    .replace(/color\s*:\s*rgb\([^)]+\)/g, 'color:#ffffff')

  const footerBlock = `
    <tr>
      <td align="center" bgcolor="${footerBg}"
        style="padding:24px ${PAD}px;text-align:center;background-color:${footerBg};">
        <a href="${esc(url)}" style="text-decoration:none;">
          <img src="${esc(logoUrl)}" height="36" alt="CNA Roma"
            style="height:36px;display:block;margin:0 auto 14px;border:0;" />
        </a>
        ${footerContent}
        ${socialLinksEmailHtml(socialLinks, cp, F, footerText)}
        <p style="margin:12px 0 0;padding:0;font-size:11px;font-family:${F};">
          <a href="${esc(url)}" style="color:${footerText};text-decoration:underline;">Visualizza la pagina dell&apos;evento</a>
        </p>
      </td>
    </tr>`

  const blocchiHtml = renderBlocchi()

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(ev.titolo)}</title>
<!--[if !mso]><!-->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet" type="text/css" />
<!--<![endif]-->
<!--[if mso]>
<style>body,table,td,p,a{font-family:Arial,Helvetica,sans-serif!important;}</style>
<xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
<![endif]-->
<style type="text/css">
body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;}
img{-ms-interpolation-mode:bicubic;border:0;outline:none;text-decoration:none;display:block;}
body{margin:0;padding:0;background-color:#F0F0F0;}
a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;font-size:inherit!important;font-family:inherit!important;font-weight:inherit!important;line-height:inherit!important;}
p{margin:0 0 10px 0;padding:0;mso-line-height-rule:exactly;}
b,strong{font-weight:bold;}
i,em{font-style:italic;}
</style>
</head>
<body style="margin:0;padding:0;background-color:#F0F0F0;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F0F0F0">
<tr><td align="center" style="padding:0;">
<table width="${W}" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF"
  style="width:${W}px;max-width:${W}px;background-color:#FFFFFF;">

  ${heroRow}

  ${(dataTesto || ev.luogo) && opts.mostraDataLuogo ? `
  <tr><td bgcolor="#FFFFFF" style="padding:12px ${PAD}px;border-bottom:1px solid #E5E7EB;background-color:#FFFFFF;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      ${dataTesto?`<td style="font-size:13px;font-weight:bold;color:#0A0A0A;font-family:${F};padding-right:12px;">&#128197; ${dataTesto}</td>`:''}
      ${ev.luogo?`<td style="font-size:13px;font-family:${F};"><a href="https://maps.google.com/?q=${encodeURIComponent(ev.luogo)}" style="color:${cp};text-decoration:none;">&#128205; ${esc(ev.luogo)}</a></td>`:''}
    </tr></table>
  </td></tr>` : ''}

  ${opts.mostraCta ? `
  <tr><td bgcolor="#FFFFFF" align="center" style="padding:20px ${PAD}px;text-align:center;background-color:#FFFFFF;border-bottom:1px solid #E5E7EB;">
    <a href="${esc(url)}"
      style="display:inline-block;padding:13px 32px;background-color:${ctaBg};color:${ctaColor};font-size:15px;font-weight:bold;text-decoration:none;font-family:${F};">
      ${esc(opts.testoCta||"Scopri l'evento e iscriviti")} &rarr;
    </a>
  </td></tr>` : ''}

  ${blocchiHtml}

  ${opts.mostraCtaFondo ? `
  <tr><td bgcolor="#EEF3FF" style="padding:20px ${PAD}px;background-color:#EEF3FF;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td valign="middle" style="padding-right:12px;">
        <p style="margin:0 0 3px;padding:0;font-size:15px;font-weight:bold;color:#0A0A0A;font-family:${F};">Partecipa all&apos;evento</p>
        <p style="margin:0;padding:0;font-size:13px;color:#374151;font-family:${F};">Registrazione gratuita &mdash; ricevi il QR Code per l&apos;ingresso.</p>
      </td>
      <td align="right" valign="middle" width="150" style="white-space:nowrap;">
        <a href="${esc(url)}"
          style="display:inline-block;padding:11px 20px;background-color:${ctaBg};color:${ctaColor};font-size:13px;font-weight:bold;text-decoration:none;font-family:${F};">
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

/* ── UI helpers ───────────────────────────────────────────────────── */
const sF = { fontFamily:"'Inter',sans-serif" }
const sInput = { ...sF, fontSize:'13px', padding:'7px 10px', border:'1px solid #D1D5DB', borderRadius:'6px', outline:'none', backgroundColor:'#FFFFFF', color:'#0A0A0A', width:'100%', boxSizing:'border-box' }
function Lbl({ children }) { return <span style={{ ...sF, fontSize:'11px', fontWeight:'700', color:'#6B7280', display:'block', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'.05em' }}>{children}</span> }
function Fld({ label, width, children }) { return <div style={{ display:'flex', flexDirection:'column', width:width||'auto', flex:width?'none':'1', minWidth:'100px' }}><Lbl>{label}</Lbl>{children}</div> }
function Row({ children }) { return <div style={{ display:'flex', gap:'12px', flexWrap:'wrap', alignItems:'flex-end' }}>{children}</div> }
function Toggle({ label, value, onChange }) {
  return (
    <label style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', userSelect:'none' }}>
      <div onClick={() => onChange(!value)} style={{ width:'36px', height:'20px', borderRadius:'10px', flexShrink:0, backgroundColor:value?'#003DA5':'#D1D5DB', position:'relative', cursor:'pointer', transition:'background .2s' }}>
        <div style={{ position:'absolute', top:'2px', left:value?'18px':'2px', width:'16px', height:'16px', borderRadius:'50%', backgroundColor:'#fff', transition:'left .2s' }} />
      </div>
      <span style={{ ...sF, fontSize:'13px', color:'#374151' }}>{label}</span>
    </label>
  )
}

const DEF = {
  larghezza:600, larghezzaCustom:'', padding:32,
  testoCta:"Scopri l'evento e iscriviti",
  ctaBg:'', ctaColor:'', ctaRadius:null,
  mostraDataLuogo:true, mostraCta:true, mostraCtaFondo:true, mostraFooter:true,
}

export default function MailUpExportTab({ event, setEvent }) {
  const [copied,   setCopied]   = useState(false)
  const [showOpts, setShowOpts] = useState(false)
  const [opts,     setOpts]     = useState(DEF)
  const upd = (k, v) => setOpts(o => ({ ...o, [k]: v }))

  const { links: socialLinks } = useSocial()
  const blocchi  = event?.mailup_blocchi || []
  const sezioni  = event?.sezioni || []
  const eventUrl = useMemo(() => event?.slug ? `${window.location.origin}/eventi/${event.slug}` : '', [event?.slug])

  const saveTimerRef    = useRef(null)
  const initialBlocchi  = useRef(null)   // snapshot dei blocchi al mount
  const [saving,  setSaving]  = useState(false)
  const [saveOk,  setSaveOk]  = useState(false)

  function importaDaContenuto() {
    const copia = JSON.parse(JSON.stringify(sezioni))
    setEvent(p => ({ ...p, mailup_blocchi: copia }))
  }

  // Salvataggio esplicito su DB
  async function salvaMailup() {
    if (!event?.id) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('events')
        .update({ mailup_blocchi: blocchi })
        .eq('id', event.id)
      if (!error) {
        setSaveOk(true)
        initialBlocchi.current = JSON.stringify(blocchi) // aggiorna snapshot
        setTimeout(() => setSaveOk(false), 2500)
      }
    } catch(e) { console.error('salvaMailup:', e) }
    setSaving(false)
  }

  // Al mount: snapshot + auto-import se vuoto
  useEffect(() => {
    // Prima imposta lo snapshot (così l'autosave sa da dove partire)
    initialBlocchi.current = JSON.stringify(event?.mailup_blocchi || [])
    if ((event?.mailup_blocchi || []).length === 0 && sezioni.length > 0) {
      // Auto-import: aggiorna snapshot dopo il setState
      setTimeout(() => {
        initialBlocchi.current = JSON.stringify(sezioni)
      }, 100)
      importaDaContenuto()
    }
  }, []) // eslint-disable-line

  // Autosave al cambio blocchi — salva sempre dopo 2 secondi di inattività
  const blocchiRef = useRef(blocchi)
  useEffect(() => { blocchiRef.current = blocchi }, [blocchi])

  useEffect(() => {
    if (!event?.id) return
    if (initialBlocchi.current === null) return  // skip mount iniziale
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      const toSave = blocchiRef.current
      const { error } = await supabase.from('events').update({ mailup_blocchi: toSave }).eq('id', event.id)
      if (!error) initialBlocchi.current = JSON.stringify(toSave)
    }, 2000)
    return () => clearTimeout(saveTimerRef.current)
  }, [blocchi, event?.id]) // eslint-disable-line

  const html = useMemo(() => {
    if (!event?.titolo) return ''
    return buildHtml(event, eventUrl, blocchi, opts, socialLinks)
  }, [event, eventUrl, blocchi, opts, socialLinks])

  const sizeKb    = useMemo(() => (new TextEncoder().encode(html).length / 1024).toFixed(1), [html])
  const sizeOk    = parseFloat(sizeKb) < 80
  const sizeWarn  = parseFloat(sizeKb) >= 80 && parseFloat(sizeKb) < 102
  const sizeError = parseFloat(sizeKb) >= 102

  async function copyHtml() {
    try { await navigator.clipboard.writeText(html) }
    catch { const ta = document.createElement('textarea'); ta.value = html; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta) }
    setCopied(true); setTimeout(() => setCopied(false), 2500)
  }

  if (!event?.titolo) return <div style={{ padding:'48px', textAlign:'center' }}><p style={{ ...sF, fontSize:'15px', fontWeight:'600', color:'#374151' }}>Nessun evento caricato</p></div>
  if (!event.slug)    return <div style={{ padding:'48px', textAlign:'center' }}><Mail size={40} style={{ color:'#D1D5DB', marginBottom:'12px' }}/><p style={{ ...sF, fontSize:'15px', fontWeight:'600', color:'#374151' }}>Slug mancante — salva prima l'evento</p></div>

  return (
    <div style={{ maxWidth:'960px', margin:'0 auto', paddingBottom:'48px' }}>

      <div style={{ marginBottom:'20px' }}>
        <h2 style={{ ...sF, margin:'0 0 4px', fontSize:'20px', fontWeight:'900', color:'#0A0A0A', letterSpacing:'-.03em' }}>Contenuto email MailUp</h2>
        <p style={{ ...sF, margin:0, fontSize:'13px', color:'#6B7280' }}>
          Incolla il codice nell'editor HTML di MailUp (<em>Messaggi → Email → Nuovo → Da editor HTML</em>).
        </p>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'9px 12px', backgroundColor:'#F4F5F7', borderRadius:'8px', marginBottom:'20px', border:'1px solid #E5E7EB' }}>
        <ExternalLink size={13} style={{ color:'#9CA3AF', flexShrink:0 }}/>
        <a href={eventUrl} target="_blank" rel="noopener noreferrer" style={{ ...sF, fontSize:'12px', color:'#003DA5', textDecoration:'none', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{eventUrl}</a>
      </div>

      {/* Editor blocchi */}
      <div style={{ marginBottom:'24px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
          <div>
            <p style={{ ...sF, margin:0, fontSize:'13px', fontWeight:'700', color:'#374151' }}>Blocchi email</p>
            <p style={{ ...sF, margin:'2px 0 0', fontSize:'12px', color:'#9CA3AF' }}>
              Aggiungi blocchi con <strong>+</strong>, riordina con <strong>↑ ↓</strong>. Modifiche salvate automaticamente.
            </p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', flexShrink:0, marginLeft:'12px' }}>
            {blocchi.length > 0 && <span style={{ ...sF, fontSize:'12px', color:'#9CA3AF' }}>{blocchi.length} blocc{blocchi.length===1?'o':'hi'}</span>}
            {sezioni.length > 0 && blocchi.length > 0 && (
              <button type="button"
                onClick={() => { if (window.confirm(`Sovrascrivere i ${blocchi.length} blocchi email con i ${sezioni.length} blocchi del Contenuto?`)) importaDaContenuto() }}
                style={{ ...sF, padding:'5px 10px', backgroundColor:'#fff', color:'#6B7280', border:'1px solid #E5E7EB', borderRadius:'6px', fontSize:'12px', fontWeight:'600', cursor:'pointer' }}>
                ↺ Reimporta da Contenuto
              </button>
            )}
          </div>
        </div>
        <BlockEditor
          blocks={blocchi}
          onChange={blocks => setEvent(p => ({ ...p, mailup_blocchi: blocks }))}
        />
      </div>

      {/* Opzioni */}
      <div style={{ border:'1px solid #E5E7EB', borderRadius:'10px', marginBottom:'16px', overflow:'hidden' }}>
        <button type="button" onClick={() => setShowOpts(o=>!o)}
          style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', backgroundColor:'#F9FAFB', border:'none', cursor:'pointer', borderBottom:showOpts?'1px solid #E5E7EB':'none' }}>
          <span style={{ ...sF, fontSize:'13px', fontWeight:'800', color:'#374151', display:'flex', alignItems:'center', gap:'7px' }}>
            <Settings size={14}/> Opzioni email
          </span>
          {showOpts ? <ChevronUp size={15} color="#9CA3AF"/> : <ChevronDown size={15} color="#9CA3AF"/>}
        </button>
        {showOpts && (
          <div style={{ padding:'16px', backgroundColor:'#fff', display:'flex', flexDirection:'column', gap:'16px' }}>
            <Row>
              <Fld label="Larghezza (px)" width="220px">
                <div style={{ display:'flex', gap:'6px' }}>
                  <select value={opts.larghezzaCustom ? 'custom' : String(opts.larghezza)}
                    onChange={e => {
                      if (e.target.value==='custom') { upd('larghezzaCustom', String(opts.larghezza)) }
                      else { upd('larghezza', Number(e.target.value)); upd('larghezzaCustom','') }
                    }} style={{ ...sInput, flex:1 }}>
                    <option value="500">500 px</option>
                    <option value="560">560 px</option>
                    <option value="600">600 px — standard</option>
                    <option value="640">640 px</option>
                    <option value="680">680 px</option>
                    <option value="800">800 px</option>
                    <option value="1024">1024 px</option>
                    <option value="1280">1280 px</option>
                    <option value="custom">Personalizzato…</option>
                  </select>
                  {opts.larghezzaCustom !== '' && (
                    <input type="number" min="320" max="1600" step="10" value={opts.larghezzaCustom}
                      onChange={e => { upd('larghezzaCustom', e.target.value); const n=Number(e.target.value); if(n>=320&&n<=1600) upd('larghezza',n) }}
                      style={{ ...sInput, width:'80px', flexShrink:0 }} />
                  )}
                </div>
              </Fld>
              <Fld label="Padding" width="140px">
                <select value={opts.padding} onChange={e=>upd('padding',Number(e.target.value))} style={sInput}>
                  <option value={16}>16 px</option>
                  <option value={24}>24 px</option>
                  <option value={32}>32 px</option>
                  <option value={48}>48 px</option>
                </select>
              </Fld>
              <Fld label="Testo CTA">
                <input type="text" value={opts.testoCta} onChange={e=>upd('testoCta',e.target.value)} style={sInput}/>
              </Fld>
            </Row>
            <div>
              <Lbl>Sezioni visibili</Lbl>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'12px 28px', paddingTop:'6px' }}>
                <Toggle label="Data e luogo"   value={opts.mostraDataLuogo} onChange={v=>upd('mostraDataLuogo',v)}/>
                <Toggle label="CTA in alto"    value={opts.mostraCta}       onChange={v=>upd('mostraCta',v)}/>
                <Toggle label="CTA iscrizione" value={opts.mostraCtaFondo}  onChange={v=>upd('mostraCtaFondo',v)}/>
                <Toggle label="Footer"         value={opts.mostraFooter}    onChange={v=>upd('mostraFooter',v)}/>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tasto Salva dedicato MailUp */}
      <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'14px 18px', backgroundColor: saveOk ? '#F0FDF4' : '#EEF3FF', border:`1px solid ${saveOk?'#86EFAC':'#C7D9F8'}`, borderRadius:'10px', marginBottom:'16px' }}>
        <button
          onClick={salvaMailup}
          disabled={saving}
          style={{ ...sF, display:'flex', alignItems:'center', gap:'8px', padding:'11px 24px', borderRadius:'8px', border:'none', backgroundColor: saveOk ? '#16A34A' : '#003DA5', color:'#fff', fontSize:'14px', fontWeight:'800', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? .7 : 1, flexShrink:0 }}>
          {saving ? '⏳ Salvataggio…' : saveOk ? '✓ Salvato!' : '💾 Salva blocchi MailUp'}
        </button>
        <span style={{ ...sF, fontSize:'12px', color: saveOk ? '#15803D' : '#6B7280', lineHeight:'1.4' }}>
          {saveOk
            ? 'Blocchi salvati — le modifiche sono permanenti.'
            : "Salva i blocchi email separatamente dall'evento. Usa questo tasto per sicurezza."}
        </span>
      </div>

      {/* Peso */}
      <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'9px 12px', borderRadius:'8px', marginBottom:'14px', backgroundColor:sizeError?'#FEF2F2':sizeWarn?'#FFFBEB':'#F0FDF4', border:`1px solid ${sizeError?'#FECACA':sizeWarn?'#FDE68A':'#BBF7D0'}` }}>
        {(sizeWarn||sizeError) && <AlertTriangle size={13} style={{ color:sizeError?'#DC2626':'#D97706', flexShrink:0 }}/>}
        <span style={{ ...sF, fontSize:'13px', fontWeight:'700', color:sizeError?'#DC2626':sizeWarn?'#92400E':'#15803D' }}>
          Peso HTML: {sizeKb} KB{sizeOk?' — ✓ ottimale':sizeWarn?' — vicino al limite Gmail 102 KB':' — ⚠ supera 102 KB'}
        </span>
      </div>

      {/* Azioni */}
      <div style={{ display:'flex', gap:'10px', marginBottom:'20px', flexWrap:'wrap' }}>
        <button onClick={copyHtml} style={{ ...sF, display:'flex', alignItems:'center', gap:'7px', padding:'10px 20px', borderRadius:'8px', border:'none', backgroundColor:copied?'#16A34A':'#003DA5', color:'#fff', fontSize:'14px', fontWeight:'700', cursor:'pointer' }}>
          {copied?<Check size={15}/>:<Copy size={15}/>} {copied?'Copiato!':'Copia HTML'}
        </button>
        <a href={`data:text/html;charset=utf-8,${encodeURIComponent(html)}`} download={`email-${event.slug}.html`}
          style={{ ...sF, display:'flex', alignItems:'center', gap:'7px', padding:'10px 20px', borderRadius:'8px', border:'1px solid #D1D5DB', color:'#374151', fontSize:'14px', fontWeight:'600', textDecoration:'none', backgroundColor:'#fff' }}>
          ↓ Scarica .html
        </a>
      </div>

      {/* Istruzioni */}
      <div style={{ backgroundColor:'#EEF3FF', border:'1px solid #C7D9F8', borderRadius:'10px', padding:'14px 18px', marginBottom:'20px' }}>
        <p style={{ ...sF, margin:'0 0 6px', fontSize:'13px', fontWeight:'800', color:'#003DA5' }}>Come importare in MailUp</p>
        <ol style={{ ...sF, margin:0, paddingLeft:'16px', fontSize:'13px', color:'#374151', lineHeight:'1.9' }}>
          <li>Vai su <strong>Messaggi → Email → Nuovo messaggio</strong></li>
          <li>Scegli <strong>Da editor HTML</strong></li>
          <li>Incolla il codice copiato nell'area HTML</li>
          <li>Compila Oggetto e Sommario (max 100 car.)</li>
          <li>Invia bozza di test prima dell'invio massivo</li>
        </ol>
      </div>

      {/* Anteprima */}
      <div style={{ border:'1px solid #E5E7EB', borderRadius:'10px', overflow:'hidden', marginBottom:'20px' }}>
        <div style={{ padding:'9px 14px', backgroundColor:'#F9FAFB', borderBottom:'1px solid #E5E7EB' }}>
          <span style={{ ...sF, fontSize:'11px', fontWeight:'700', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.07em' }}>Anteprima — {opts.larghezza}px</span>
        </div>
        <div style={{ overflowX:'auto', backgroundColor:'#F0F0F0', padding:'24px', display:'flex', justifyContent:'center' }}>
          <iframe srcDoc={html} title="Anteprima email MailUp"
            style={{ width:`${opts.larghezza}px`, minHeight:'500px', border:'1px solid #E5E7EB', borderRadius:'4px', display:'block', backgroundColor:'#fff' }}
            sandbox="allow-same-origin"/>
        </div>
      </div>

      {/* Sorgente */}
      <div style={{ border:'1px solid #E5E7EB', borderRadius:'10px', overflow:'hidden' }}>
        <div style={{ padding:'9px 14px', backgroundColor:'#F9FAFB', borderBottom:'1px solid #E5E7EB', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ ...sF, fontSize:'11px', fontWeight:'700', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.07em' }}>Codice sorgente</span>
          <button onClick={copyHtml} style={{ ...sF, display:'flex', alignItems:'center', gap:'5px', padding:'4px 10px', border:'1px solid #D1D5DB', borderRadius:'5px', backgroundColor:'#fff', cursor:'pointer', fontSize:'12px', fontWeight:'600', color:'#374151' }}>
            {copied?<Check size={11}/>:<Copy size={11}/>} Copia
          </button>
        </div>
        <textarea readOnly value={html} onClick={e=>e.target.select()}
          style={{ width:'100%', height:'240px', padding:'14px', fontFamily:'monospace', fontSize:'11px', lineHeight:'1.6', border:'none', resize:'vertical', outline:'none', backgroundColor:'#1E1E1E', color:'#D4D4D4', boxSizing:'border-box' }}/>
      </div>
    </div>
  )
}
