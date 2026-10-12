// Report statistico evento in PDF A4 (jsPDF, disegno vettoriale).
// Solo ASCII nei commenti (bug rolldown).
import { jsPDF } from 'jspdf'
import { supabase } from './supabase'
import { calcolaAnalisi } from '../pages/admin/StatisticheEventoAnalisi'
import { calcolaPartecipanti, TIPO_COLORI } from '../pages/admin/StatistichePartecipanti'

const LOGO_URLS = ['https://alessandroparrelli.github.io/fileappoggio/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png', 'https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png']
const W = 210, H = 297, M = 16, CW = W - 2 * M
const TOP = 16, BOTTOM = H - 18
const BLU = '#003DA5', VIOLA = '#5B5FEF', TESTO = '#1F2937', GRIGIO = '#6B7280', GRIGIO_CHIARO = '#A3A9B6', LINEA = '#E3E7EF'
const TZ = 'Europe/Rome'

const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0)
const num = n => (typeof n === 'number' ? n.toLocaleString('it-IT') : String(n ?? '-'))
const fmtData = ts => ts ? new Date(ts).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ }) : 'data non impostata'
const fmtG = k => new Date(k + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
const hex = c => { const h = (c || '#5B5FEF').replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)] }
// jsPDF standard fonts: WinAnsi. Sostituisce i caratteri fuori set.
const t = s => String(s ?? '').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/…/g, '...').replace(/[^\x00-\xFF]/g, '')

async function caricaLogo() {
  for (const url of LOGO_URLS) try {
    const res = await fetch(url, { cache: 'force-cache' })
    if (!res.ok) continue
    const blob = await res.blob()
    const data = await new Promise((ok, ko) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = ko; r.readAsDataURL(blob) })
    const dim = await new Promise(ok => { const i = new Image(); i.onload = () => ok({ w: i.naturalWidth, h: i.naturalHeight }); i.onerror = () => ok({ w: 3, h: 1 }); i.src = data })
    return { data, ratio: dim.w / dim.h }
  } catch { /* prova il successivo */ }
  return null
}

export async function generaReportEvento({ evento, stats, pageViews, survey, raw, mestieri, eventi }) {
  const [logo, campiRes, staffRes] = await Promise.all([
    caricaLogo(),
    supabase.from('form_fields').select('label,colonna_db,tipo,opzioni,ordine').eq('event_id', evento.id).order('ordine'),
    supabase.from('admin_profiles').select('id,nome,username'),
  ])
  const campi = (campiRes.data || []).filter(c => c.colonna_db?.startsWith('extra_'))
  const staff = Object.fromEntries((staffRes.data || []).map(p => [p.id, p.nome || p.username || 'Operatore']))
  const eventiMap = Object.fromEntries(eventi.map(e => [e.id, e]))
  const regs = raw.regs || []
  const a = calcolaAnalisi({ evento, regs, views: raw.views || [], altreRegs: raw.altre || [], eventiMap, emailLog: raw.emailLog || [], smsLog: raw.smsLog || [] })
  const haPresenti = regs.some(r => r.presente || r.checkin_at)
  const p = calcolaPartecipanti({ evento, regs, altreRegs: raw.altre || [], eventiMap, mestieri, campi, base: haPresenti ? 'presenti' : 'iscritti' })
  const etBase = haPresenti ? 'partecipanti effettivi' : 'iscritti attivi'

  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  const titoloEvento = t(evento.titolo || 'Evento')
  let y = TOP

  // ---------- primitive ----------
  const fill = c => doc.setFillColor(...hex(c))
  const color = c => doc.setTextColor(...hex(c))
  const font = (sz, stile = 'normal', c = TESTO) => { doc.setFont('helvetica', stile); doc.setFontSize(sz); color(c) }
  const nuovaPagina = () => { doc.addPage(); y = TOP }
  const spazio = h => { if (y + h > BOTTOM) nuovaPagina() }
  const ellissi = (s, maxW) => { s = t(s); if (doc.getTextWidth(s) <= maxW) return s; while (s.length > 1 && doc.getTextWidth(s + '...') > maxW) s = s.slice(0, -1); return s + '...' }

  function titoloSezione(titolo, sotto) {
    spazio((sotto ? 16 : 12) + 32)
    y += 3
    fill(BLU); doc.rect(M, y, 1.4, sotto ? 9 : 5.5, 'F')
    font(12, 'bold', BLU); doc.text(t(titolo), M + 4, y + 4.3)
    if (sotto) { font(8.5, 'normal', GRIGIO); doc.text(t(sotto), M + 4, y + 8.6) }
    y += sotto ? 13 : 9
  }

  function kpiGrid(items, perRiga = 4) {
    const gap = 3, w = (CW - gap * (perRiga - 1)) / perRiga, h = 18
    for (let i = 0; i < items.length; i += perRiga) {
      spazio(h + gap)
      items.slice(i, i + perRiga).forEach((k, j) => {
        const x = M + j * (w + gap)
        doc.setDrawColor(...hex(LINEA)); doc.setLineWidth(0.25); fill('#F7F8FC'); doc.roundedRect(x, y, w, h, 2, 2, 'FD')
        font(6.6, 'bold', GRIGIO); doc.text(ellissi(String(k.l).toUpperCase(), w - 6), x + 3, y + 4.6)
        font(14, 'bold', k.warn ? '#B45309' : TESTO); doc.text(ellissi(num(k.v), w - 6), x + 3, y + 11.2)
        if (k.s) { font(6.8, 'normal', GRIGIO); doc.text(ellissi(k.s, w - 6), x + 3, y + 15.4) }
      })
      y += h + gap
    }
    y += 1
  }

  // blocco "lista a barre": misurabile per affiancarne due
  function blocco(titolo, righe, opz = {}) {
    righe = righe.filter(r => r && (r.n !== undefined))
    const altezza = 8 + righe.length * 6.3 + (opz.nota ? 5 : 0)
    return {
      altezza,
      draw(x, w, y0) {
        font(9.5, 'bold', TESTO); doc.text(ellissi(titolo, w), x, y0 + 4)
        let yy = y0 + 9
        for (const r of righe) {
          const val = r.testo ?? (opz.assoluto || !r.tot ? num(r.n) : `${num(r.n)} (${pct(r.n, r.tot)}%)`)
          font(7.8, 'bold', TESTO); const vw = doc.getTextWidth(t(val))
          doc.text(t(val), x + w, yy, { align: 'right' })
          font(7.8, 'normal', '#374151'); doc.text(ellissi(r.l + (r.extra ? '  -  ' + r.extra : ''), w - vw - 3), x, yy)
          const largh = r.barra ?? (r.tot ? Math.min(100, (r.n / r.tot) * 100) : 0)
          fill('#EEF0F6'); doc.roundedRect(x, yy + 1.3, w, 1.6, 0.8, 0.8, 'F')
          if (largh > 0) { fill(r.c || VIOLA); doc.roundedRect(x, yy + 1.3, Math.max(1.6, (w * largh) / 100), 1.6, 0.8, 0.8, 'F') }
          yy += 6.3
        }
        if (opz.nota) { font(6.8, 'italic', GRIGIO_CHIARO); doc.text(t(opz.nota), x, yy + 0.5) }
      },
    }
  }

  function colonne(...blocchi) {
    blocchi = blocchi.filter(b => b && b.altezza > 9)
    for (let i = 0; i < blocchi.length; i += 2) {
      const coppia = blocchi.slice(i, i + 2)
      const h = Math.max(...coppia.map(b => b.altezza))
      spazio(h + 3)
      const w = coppia.length === 2 ? (CW - 10) / 2 : CW
      coppia.forEach((b, j) => b.draw(M + j * (w + 10), w, y))
      y += h + 4
    }
  }

  function istogramma(valori, etichette, opz = {}) {
    const h = opz.h || 26
    spazio(h + 10)
    if (opz.titolo) { font(9.5, 'bold', TESTO); doc.text(t(opz.titolo), M, y + 4); y += 7 }
    const max = Math.max(1, ...valori), n = valori.length, gap = n > 60 ? 0.2 : 0.8
    const bw = (CW - gap * (n - 1)) / n
    doc.setDrawColor(...hex(LINEA)); doc.setLineWidth(0.2); doc.line(M, y + h, M + CW, y + h)
    valori.forEach((v, i) => {
      const bh = v ? Math.max(0.6, (v / max) * h) : 0
      if (bh) { fill(v === max ? (opz.colore || VIOLA) : (opz.coloreChiaro || '#A5A8F6')); doc.rect(M + i * (bw + gap), y + h - bh, bw, bh, 'F') }
    })
    font(6.5, 'normal', GRIGIO)
    const passo = Math.max(1, Math.ceil(n / (opz.maxEtichette || 12)))
    etichette.forEach((e, i) => { if (e && i % passo === 0) doc.text(t(e), M + i * (bw + gap) + bw / 2, y + h + 3.6, { align: 'center' }) })
    font(6.5, 'bold', GRIGIO); doc.text(`max ${num(max)}`, M + CW, y - 1, { align: 'right' })
    y += h + 8
  }

  function paragrafo(testo, sz = 8.5, c = GRIGIO) {
    font(sz, 'normal', c)
    const righe = doc.splitTextToSize(t(testo), CW)
    spazio(righe.length * sz * 0.42 + 2)
    doc.text(righe, M, y + 3)
    y += righe.length * sz * 0.42 + 3
  }

  // ---------- intestazione (pagina 1) ----------
  if (logo) { const lh = 15, lw = Math.min(70, lh * logo.ratio); doc.addImage(logo.data, 'PNG', M, y, lw, lw / logo.ratio, 'logo-cna') }
  y += 24
  font(10, 'normal', GRIGIO); doc.text('Riepilogo statistico dell\'evento', M, y)
  y += 7
  font(19, 'bold', BLU)
  const righeTitolo = doc.splitTextToSize(titoloEvento, CW)
  doc.text(righeTitolo, M, y); y += righeTitolo.length * 7.6
  font(10.5, 'normal', TESTO); doc.text(t(`Svolto in data ${fmtData(evento.data_inizio)}`), M, y)
  y += 4
  fill(BLU); doc.rect(M, y, CW, 0.6, 'F')
  y += 4
  font(7.5, 'normal', GRIGIO_CHIARO)
  doc.text(t(`Documento generato il ${new Date().toLocaleString('it-IT', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}${evento.luogo ? '  -  ' + evento.luogo : ''}`), M, y)
  y += 5

  // ---------- 1. sintesi ----------
  const tot = regs.length
  const capienza = evento.capienza_max
  titoloSezione('Sintesi', 'Numeri principali dell\'evento')
  kpiGrid([
    { l: 'Iscritti totali', v: tot, s: capienza ? `capienza ${num(capienza)}` : '' },
    { l: 'Presenti', v: a.presenti, s: `${pct(a.presenti, tot - a.rinunce)}% degli iscritti attivi` },
    { l: 'Visite landing', v: pageViews?.total ?? 0, s: tot ? `conversione ${pct(tot, Math.max(pageViews?.total || 0, 1))}%` : '' },
    { l: 'Walk-in', v: stats?.walkin ?? 0, s: 'ingressi senza iscrizione' },
    { l: 'Rinunce', v: a.rinunce, s: `${pct(a.rinunce, tot)}% degli iscritti` },
    { l: 'Presenza confermata', v: a.confermati, s: 'risposte al link di conferma' },
    { l: 'Ritmo iscrizioni', v: `${a.ritmo.toFixed(1)}/g`, s: 'media ultimi 7 giorni' },
    { l: 'Giorno record', v: a.iscrG[a.piccoG] || 0, s: a.piccoG ? `iscrizioni il ${fmtG(a.piccoG)}` : '' },
  ])

  if (capienza || evento.obiettivo_iscritti || evento.obiettivo_presenze) {
    colonne(blocco('Obiettivi e capienza', [
      capienza && { l: 'Capienza occupata', n: tot - a.rinunce, tot: capienza, c: VIOLA, extra: `${Math.max(0, capienza - tot + a.rinunce)} posti liberi` },
      evento.obiettivo_iscritti && { l: 'Obiettivo iscritti', n: tot, tot: evento.obiettivo_iscritti, testo: `${num(tot)} / ${num(evento.obiettivo_iscritti)} (${pct(tot, evento.obiettivo_iscritti)}%)`, c: '#7C4DFF' },
      evento.obiettivo_presenze && { l: 'Obiettivo presenze', n: a.presenti, tot: evento.obiettivo_presenze, testo: `${num(a.presenti)} / ${num(evento.obiettivo_presenze)} (${pct(a.presenti, evento.obiettivo_presenze)}%)`, c: '#059669' },
    ].filter(Boolean)))
  }

  // ---------- 2. iscrizioni ----------
  titoloSezione('Andamento delle iscrizioni', `Dal ${a.giorni[0] ? fmtG(a.giorni[0]) : '-'} al ${a.giorni.length ? fmtG(a.giorni[a.giorni.length - 1]) : '-'}`)
  istogramma(a.cumulativo, a.giorni.map(fmtG), { titolo: 'Iscritti cumulativi', h: 28 })
  istogramma(a.giorni.map(g => a.iscrG[g]), a.giorni.map(fmtG), { titolo: 'Nuove iscrizioni per giorno', h: 22 })
  if ((pageViews?.total || 0) > 0) istogramma(a.giorni.map(g => a.visG[g]), a.giorni.map(fmtG), { titolo: 'Visite alla landing page per giorno', h: 22, colore: '#0891B2', coloreChiaro: '#7DD3E8' })

  colonne(
    blocco('Percorso di conversione', [
      { l: 'Visite landing', n: pageViews?.total || 0, testo: num(pageViews?.total || 0), barra: 100, c: '#38BDF8', extra: `${num(a.sessioni)} sessioni` },
      { l: 'Iscrizioni', n: tot, tot: pageViews?.total || tot, c: VIOLA },
      { l: 'Iscrizioni attive', n: tot - a.rinunce, tot, c: '#6D63F2' },
      { l: 'Presenza confermata', n: a.confermati, tot: tot - a.rinunce, c: '#7C4DFF' },
      { l: 'Presenti', n: a.presenti, tot: tot - a.rinunce, c: '#059669' },
    ], { nota: '% rispetto al passaggio precedente (presenti su iscritti attivi)' }),
    blocco('Composizione iscritti', [
      { l: 'Iscritti singoli', n: a.singoli, tot, c: VIOLA },
      { l: 'Capogruppo', n: a.capogruppo, tot, c: '#7C4DFF' },
      { l: 'Accompagnatori', n: a.accompagnatori, tot, c: '#C4B5FD', extra: a.capogruppo ? `media ${(a.accompagnatori / a.capogruppo).toFixed(1)} per gruppo` : '' },
      { l: 'Gia partecipanti a eventi precedenti', n: a.ritorni, tot, c: '#059669' },
      { l: 'Con P.IVA valida', n: a.conPiva, tot, c: '#7C3AED' },
      a.conPosto > 0 && { l: 'Con posto assegnato', n: a.conPosto, tot, c: '#F59E0B' },
    ].filter(Boolean)),
  )

  const GIORNI = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']
  istogramma(a.ore, a.ore.map((_, i) => `${i}`), { titolo: 'Iscrizioni per fascia oraria', h: 20, maxEtichette: 24 })
  colonne(
    blocco('Iscrizioni per giorno della settimana', a.sett.map((n, i) => ({ l: GIORNI[i], n, tot, c: VIOLA }))),
    blocco('Visitatori della landing', [
      { l: 'Da smartphone', n: a.mobile, tot: (raw.views || []).length, c: VIOLA },
      { l: 'Da computer', n: (raw.views || []).length - a.mobile, tot: (raw.views || []).length, c: '#94A3B8' },
      { l: 'Sessioni uniche', n: a.sessioni, tot: (raw.views || []).length, c: '#0891B2' },
      { l: 'Visite per iscrizione', n: 0, testo: tot ? ((raw.views || []).length / tot).toFixed(1) : '-', barra: 0 },
      ...(pageViews?.topCities || []).slice(0, 5).map(([c, n]) => ({ l: `Citta: ${c}`, n, tot: pageViews.total, c: '#0E7490' })),
    ]),
  )

  if (a.arriviK.length) istogramma(a.arriviK.map(k => a.arrivi[k]), a.arriviK, { titolo: `Orari di arrivo (check-in per quarto d'ora, ${num(a.presenti)} presenti)`, h: 24, colore: '#059669', coloreChiaro: '#86D9B5', maxEtichette: 10 })

  // ---------- 3. chi ha partecipato ----------
  nuovaPagina()
  titoloSezione('Chi ha partecipato', `Analisi su ${num(p.tot)} ${etBase}${haPresenti ? ` (su ${num(p.iscrittiAttivi)} iscritti attivi)` : ''}`)
  const enti = p.orgList.filter(o => o.tipo === 'Ente pubblico')
  kpiGrid([
    { l: 'Partecipanti', v: p.tot, s: etBase },
    { l: 'Imprese', v: p.imprese.length, s: `${num(p.pIn)} persone da imprese` },
    { l: 'Persone per impresa', v: p.imprese.length ? (p.pIn / p.imprese.length).toFixed(1) : '-', s: p.imprese[0] ? `max ${p.imprese[0].n}: ${p.imprese[0].nome}` : '' },
    { l: 'Enti pubblici', v: enti.length, s: `${num(enti.reduce((s, o) => s + o.n, 0))} rappresentanti` },
    { l: 'Organizzazioni', v: p.orgList.length, s: 'ragioni sociali distinte' },
    { l: 'Uomini / Donne', v: `${p.gen.M} / ${p.gen.F}`, s: `${pct(p.gen.F, p.gen.M + p.gen.F)}% donne (stima dal nome)` },
    { l: 'Associati CNA', v: p.aSi, s: `${pct(p.aSi, p.tot)}% - ${p.impAssoc} imprese associate` },
    { l: 'Privati cittadini', v: p.tipi['Privato cittadino'] || 0, s: 'senza impresa ne P.IVA' },
  ])

  colonne(
    blocco('Tipologia dei partecipanti', Object.entries(p.tipi).sort((x, z) => z[1] - x[1]).map(([l, n]) => ({ l, n, tot: p.tot, c: TIPO_COLORI[l] })), { nota: 'Classificazione automatica dalla ragione sociale' }),
    blocco('Genere', [
      { l: 'Donne', n: p.gen.F, tot: p.tot, c: '#EC4899' },
      { l: 'Uomini', n: p.gen.M, tot: p.tot, c: '#3B82F6' },
      { l: 'Non determinabile', n: p.gen.nd, tot: p.tot, c: '#CBD5E1' },
    ], { nota: 'Stima dal nome di battesimo' }),
    blocco('Associazione CNA', [
      { l: 'Persone associate', n: p.aSi, tot: p.tot, c: '#16A34A' },
      { l: 'Persone non associate', n: p.aNo, tot: p.tot, c: '#F97316' },
      { l: 'Persone non verificate', n: p.tot - p.aSi - p.aNo, tot: p.tot, c: '#CBD5E1' },
      { l: 'Imprese associate', n: p.impAssoc, tot: p.imprese.length, c: '#16A34A' },
      { l: 'Imprese non associate', n: p.impNoAssoc, tot: p.imprese.length, c: '#F97316' },
      { l: 'Imprese non verificate', n: p.imprese.length - p.impAssoc - p.impNoAssoc, tot: p.imprese.length, c: '#CBD5E1' },
    ]),
    blocco('Imprese per dimensione della delegazione', Object.entries(p.delega).map(([l, n]) => ({ l: `${l} ${l === '1' ? 'partecipante' : 'partecipanti'}`, n, tot: p.imprese.length, c: VIOLA }))),
    p.anzN > 0 && blocco(`Anzianita associativa (${p.anzN} con data)`, Object.entries(p.anz).map(([l, n]) => ({ l, n, tot: p.anzN, c: BLU }))),
    blocco('Forma giuridica delle imprese', Object.entries(p.forme).sort((x, z) => z[1] - x[1]).map(([l, n]) => ({ l, n, tot: p.imprese.length, c: '#7C3AED' }))),
  )

  if (enti.length) {
    titoloSezione(`Enti pubblici presenti (${enti.length})`)
    colonne(blocco('Ente', enti.map(o => ({ l: o.nome, n: o.n, tot: enti[0].n, c: '#059669' })), { assoluto: true }))
  }

  colonne(
    blocco('Provenienza (da CAP)', Object.entries(p.zone).sort((x, z) => z[1] - x[1]).map(([l, n]) => ({ l, n, tot: p.tot, c: '#0891B2' }))),
    Object.keys(p.mun).length > 0 && blocco('Roma: municipi (stima)', Object.entries(p.mun).sort((x, z) => z[1] - x[1]).slice(0, 15).map(([l, n]) => ({ l, n: Math.round(n), tot: p.zone['Roma citta'] || 1, c: '#0E7490' }))),
    Object.keys(p.prov).length > 0 && blocco('Altre province del Lazio', Object.entries(p.prov).sort((x, z) => z[1] - x[1]).map(([l, n]) => ({ l, n, tot: p.tot, c: '#06B6D4' }))),
    a.topCap.length > 0 && blocco('CAP piu frequenti (iscritti)', a.topCap.map(([c, n]) => ({ l: c, n, tot, c: '#0891B2' }))),
    ...p.extra.map(x => blocco(`${x.label} (${x.compilati} risposte)`, x.dist.slice(0, 12).map(([l, n]) => ({ l, n, tot: x.compilati, c: '#7C4DFF' })))),
    Object.keys(p.mest).length > 0 && blocco('Mestieri', Object.entries(p.mest).sort((x, z) => z[1] - x[1]).slice(0, 12).map(([l, n]) => ({ l, n, tot: p.tot, c: '#F59E0B' }))),
    blocco('Fedelta (eventi CNA precedenti)', Object.entries(p.fed).map(([l, n]) => ({ l, n, tot: p.tot, c: '#059669' }))),
    blocco('Gruppi e recapiti', [
      { l: 'Accompagnatori', n: p.accomp, tot: p.tot, c: '#C4B5FD', extra: p.nGruppi ? `${p.nGruppi} gruppi` : '' },
      { l: 'Con cellulare', n: p.cell, tot: p.tot, c: VIOLA },
      { l: 'Email aziendale / istituzionale', n: p.mailAz, tot: p.tot, c: BLU },
      { l: 'Email personale', n: p.mailPers, tot: p.tot, c: '#94A3B8' },
      p.mailNo > 0 && { l: 'Senza email', n: p.mailNo, tot: p.tot, c: '#E5E7EB' },
    ].filter(Boolean)),
  )

  if (haPresenti) {
    titoloSezione('Tasso di presenza per segmento', 'Iscritti attivi che si sono effettivamente presentati (segmenti con almeno 3 iscritti)')
    const tasso = (titolo, righe) => righe.length ? blocco(titolo, righe.map(([l, v]) => {
      const q = pct(v.p, v.i)
      return { l, n: v.p, testo: `${q}%`, barra: q, extra: `${v.p} su ${v.i}`, c: q >= 70 ? '#059669' : q >= 50 ? '#F59E0B' : '#EF4444' }
    })) : null
    colonne(tasso('Per tipologia', p.presPerTipo), tasso('Per associazione', p.presPerAssoc), tasso('Per genere (stimato)', p.presPerGenere),
      tasso('Per anticipo di iscrizione', p.anticipo), tasso('Iscritti diretti / accompagnatori', p.presPerRuolo))
  }

  if (Object.keys(p.perStaff).length) {
    const presTot = regs.filter(r => r.presente || r.checkin_at).length
    titoloSezione('Check-in per operatore', `${num(presTot)} ingressi registrati${p.walkin ? `, ${p.walkin} walk-in` : ''}`)
    colonne(blocco('Operatore', Object.entries(p.perStaff).sort((x, z) => z[1] - x[1]).map(([id, n]) => ({ l: staff[id] || 'Operatore', n, tot: presTot, c: VIOLA }))))
  }

  // ---------- 4. comunicazioni e questionari ----------
  const emailVoci = Object.entries(a.email)
  if (emailVoci.length || (raw.smsLog || []).length) {
    titoloSezione('Comunicazioni inviate')
    kpiGrid([
      ...emailVoci.map(([tp, v]) => ({ l: `Email: ${tp.replace(/_/g, ' ')}`, v: v.ok, s: v.ko ? `${v.ko} non recapitate` : 'tutte inviate', warn: v.ko > 0 })),
      ...((raw.smsLog || []).length ? [{ l: 'SMS', v: a.smsOk, s: a.smsKo ? `${a.smsKo} in errore` : 'tutti inviati', warn: a.smsKo > 0 }] : []),
    ])
  }

  if (survey?.length) {
    const media = (survey.reduce((s, x) => s + (x.valutazione || 0), 0) / survey.length).toFixed(1)
    titoloSezione('Questionario di soddisfazione', `${survey.length} risposte - valutazione media ${media} su 5`)
    colonne(blocco('Distribuzione delle valutazioni', [5, 4, 3, 2, 1].map(s => ({ l: `${s} ${s === 1 ? 'stella' : 'stelle'}`, n: survey.filter(x => x.valutazione === s).length, tot: survey.length, c: '#F59E0B' }))))
    const commenti = survey.filter(x => x.commento).slice(0, 15)
    if (commenti.length) {
      font(9.5, 'bold', TESTO); spazio(8); doc.text('Commenti', M, y + 4); y += 7
      for (const c of commenti) paragrafo(`"${c.commento}"  (${c.valutazione}/5)`, 8.3, '#374151')
    }
  }

  // ---------- 5. allegato: elenco organizzazioni ----------
  if (p.orgList.length) {
    nuovaPagina()
    titoloSezione(`Allegato - Elenco organizzazioni (${p.orgList.length})`, `Ragioni sociali dei ${etBase}, ordinate per numero di partecipanti`)
    const col = [{ h: 'Organizzazione', w: 82 }, { h: 'Tipologia', w: 40 }, { h: 'P.IVA', w: 26 }, { h: 'CNA', w: 14 }, { h: 'Pers.', w: CW - 162, r: true }]
    const intest = () => {
      fill('#EEF2FB'); doc.rect(M, y, CW, 6, 'F')
      font(7, 'bold', BLU); let x = M + 1.5
      col.forEach(c => { doc.text(c.h, c.r ? x + c.w - 3 : x, y + 4, c.r ? { align: 'right' } : undefined); x += c.w })
      y += 7
    }
    intest()
    p.orgList.forEach((o, i) => {
      if (y + 5.4 > BOTTOM) { nuovaPagina(); intest() }
      if (i % 2) { fill('#FAFBFD'); doc.rect(M, y - 1, CW, 5.4, 'F') }
      let x = M + 1.5
      const cells = [o.nome, o.tipo, o.piva || '-', o.assoc === true ? 'Si' : o.assoc === false ? 'No' : '-', String(o.n)]
      cells.forEach((v, j) => {
        font(7.2, j === 0 || j === 4 ? 'bold' : 'normal', j === 3 ? (o.assoc === true ? '#16A34A' : o.assoc === false ? '#EA580C' : GRIGIO_CHIARO) : j === 1 ? (TIPO_COLORI[o.tipo] || TESTO) : TESTO)
        const c = col[j]
        doc.text(ellissi(v, c.w - 3), c.r ? x + c.w - 3 : x, y + 2.8, c.r ? { align: 'right' } : undefined)
        x += c.w
      })
      y += 5.4
    })
  }

  // ---------- nota metodologica ----------
  titoloSezione('Note')
  paragrafo('Le statistiche sui partecipanti si basano sui presenti con check-in registrato; se l\'evento non ha ancora check-in vengono usati gli iscritti attivi. Il genere e stimato dal nome di battesimo; la tipologia (impresa, ente pubblico, scuola, associazione, sistema CNA, privato) e attribuita automaticamente dalla ragione sociale e dal dominio email. Lo stato associativo deriva dalla verifica sull\'anagrafe tesseramento CNA.', 7.8)

  // ---------- footer su tutte le pagine ----------
  const pagine = doc.getNumberOfPages()
  for (let i = 1; i <= pagine; i++) {
    doc.setPage(i)
    const fy = H - 11
    doc.setDrawColor(...hex('#E5E7EB')); doc.setLineWidth(0.2); doc.line(M, fy - 3.5, W - M, fy - 3.5)
    let x = M
    if (logo) { const lh = 4.5, lw = Math.min(22, lh * logo.ratio); doc.addImage(logo.data, 'PNG', M, fy - 2, lw, lw / logo.ratio, 'logo-cna'); x += lw + 4 }
    font(7.5, 'normal', GRIGIO_CHIARO)
    const pag = `Pagina ${i} di ${pagine}`
    doc.text(ellissi(`Riepilogo statistico dell'evento ${titoloEvento}`, W - M - x - doc.getTextWidth(pag) - 6), x, fy + 1)
    doc.text(pag, W - M, fy + 1, { align: 'right' })
  }

  const nomeFile = `Report_${titoloEvento.replace(/[^\w]+/g, '_').replace(/^_|_$/g, '').slice(0, 50)}.pdf`
  doc.save(nomeFile)
  return nomeFile
}
