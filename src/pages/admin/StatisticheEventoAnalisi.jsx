import { useMemo } from 'react'
import AreaCurveChart from '../../components/AreaCurveChart'

// Analisi aggiuntive per singolo evento (tab "Per evento" della pagina Statistiche)
const TZ = 'Europe/Rome'
const dayKey = ts => new Date(ts).toLocaleDateString('sv-SE', { timeZone: TZ })
const oraDi = ts => Number(new Date(ts).toLocaleString('en-GB', { hour: '2-digit', hour12: false, timeZone: TZ })) % 24
const minDi = ts => Number(new Date(ts).toLocaleString('en-GB', { minute: '2-digit', timeZone: TZ }))
const norm = s => (s || '').toString().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0)
const fmtG = k => new Date(k + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
const fmtGL = k => new Date(k + 'T12:00:00').toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
const isPresente = r => !!(r.presente || r.checkin_at)
const GIORNI = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

function rangeGiorni(da, a) {
  const out = []
  const d = new Date(da + 'T12:00:00'), fine = new Date(a + 'T12:00:00')
  while (d <= fine && out.length < 400) { out.push(d.toLocaleDateString('sv-SE')); d.setDate(d.getDate() + 1) }
  return out
}

export default function StatisticheEventoAnalisi({ evento, regs, views, altreRegs, eventiMap, emailLog, smsLog }) {
  const a = useMemo(() => {
    const oggi = dayKey(Date.now())
    const dataEv = evento?.data_inizio ? dayKey(evento.data_inizio) : null
    const passato = dataEv ? dataEv < oggi : false
    const giorniMancanti = dataEv ? Math.round((new Date(dataEv) - new Date(oggi)) / 86400000) : null
    const attivi = regs.filter(r => !r.rinuncia)

    // ---- andamento iscrizioni e visite
    let minTs = null
    for (const r of regs) if (r.created_at && (!minTs || r.created_at < minTs)) minTs = r.created_at
    for (const v of views) if (v.visited_at && (!minTs || v.visited_at < minTs)) minTs = v.visited_at
    const primo = minTs ? dayKey(minTs) : oggi
    const ultimo = passato ? dataEv : oggi
    const giorni = rangeGiorni(primo, ultimo < primo ? primo : ultimo)
    const iscrG = Object.fromEntries(giorni.map(g => [g, 0])), visG = Object.fromEntries(giorni.map(g => [g, 0]))
    for (const r of regs) { const k = dayKey(r.created_at); if (k in iscrG) iscrG[k]++ }
    for (const v of views) { const k = dayKey(v.visited_at); if (k in visG) visG[k]++ }
    let cum = 0
    const cumulativo = giorni.map(g => (cum += iscrG[g]))

    // ritmo e proiezione
    const ult7 = giorni.slice(-7).reduce((s, g) => s + iscrG[g], 0)
    const ritmo = ult7 / Math.min(7, giorni.length || 1)
    const proiezione = !passato && giorniMancanti > 0 ? Math.round(regs.length + ritmo * giorniMancanti) : null
    const piccoG = giorni.reduce((b, g) => (iscrG[g] > (iscrG[b] ?? -1) ? g : b), giorni[0])

    // ---- funnel
    const sessioni = new Set(views.map(v => v.session_id || v.visited_at)).size
    const confermati = regs.filter(r => r.presenza_confermata).length
    const presenti = regs.filter(isPresente).length

    // ---- composizione
    const accompagnatori = regs.filter(r => r.referente_id).length
    const referenti = new Set(regs.map(r => r.referente_id).filter(Boolean))
    const capogruppo = regs.filter(r => !r.referente_id && referenti.has(r.id)).length
    const singoli = regs.length - accompagnatori - capogruppo
    const assocSi = regs.filter(r => r.associato_cna === true).length
    const assocNo = regs.filter(r => r.associato_cna === false).length
    const conPosto = regs.filter(r => r.numero_posto).length
    const rinunce = regs.filter(r => r.rinuncia).length
    const conPiva = regs.filter(r => (r.partita_iva || '').replace(/\D/g, '').length === 11).length

    // ---- nuovi vs gia visti (altri eventi precedenti)
    const visti = new Set()
    for (const r of altreRegs) {
      if (r.event_id === evento.id) continue
      const ev = eventiMap[r.event_id]
      if (ev?.data_inizio && evento.data_inizio && ev.data_inizio >= evento.data_inizio) continue
      if (r.email) visti.add('e' + norm(r.email))
      if (r.nome || r.cognome) visti.add('n' + norm(r.nome) + '|' + norm(r.cognome))
    }
    const ritorni = regs.filter(r => visti.has('e' + norm(r.email)) || visti.has('n' + norm(r.nome) + '|' + norm(r.cognome))).length

    // ---- quando si iscrivono
    const ore = Array(24).fill(0), sett = Array(7).fill(0)
    for (const r of regs) { ore[oraDi(r.created_at)]++; sett[(new Date(dayKey(r.created_at) + 'T12:00:00').getDay() + 6) % 7]++ }

    // ---- arrivi (check-in) per quarto d'ora
    const arrivi = {}
    for (const r of regs) if (r.checkin_at) { const k = `${String(oraDi(r.checkin_at)).padStart(2, '0')}:${String(Math.floor(minDi(r.checkin_at) / 15) * 15).padStart(2, '0')}`; arrivi[k] = (arrivi[k] || 0) + 1 }
    const arriviK = Object.keys(arrivi).sort()

    // ---- dispositivi visitatori
    const mobile = views.filter(v => /mobi|iphone|android/i.test(v.user_agent || '')).length

    // ---- imprese e CAP
    const imp = {}
    for (const r of regs) { const k = norm(r.ragione_sociale); if (!k) continue; if (!imp[k]) imp[k] = { nome: r.ragione_sociale.trim(), n: 0 }; imp[k].n++ }
    const topImprese = Object.values(imp).sort((x, y) => y.n - x.n).slice(0, 8)
    const caps = {}
    for (const r of regs) { const c = (r.cap || '').trim(); if (c) caps[c] = (caps[c] || 0) + 1 }
    const topCap = Object.entries(caps).sort((x, y) => y[1] - x[1]).slice(0, 8)
    const roma = regs.filter(r => /^001\d\d$/.test((r.cap || '').trim())).length

    // ---- comunicazioni
    const email = {}
    for (const l of emailLog) { const k = l.tipo || 'altro'; if (!email[k]) email[k] = { ok: 0, ko: 0 }; (/err|fail|bounce/i.test(l.stato || '') ? email[k].ko++ : email[k].ok++) }
    const smsOk = smsLog.filter(x => x.stato === 'inviato').length

    return {
      oggi, dataEv, passato, giorniMancanti, attivi, giorni, iscrG, visG, cumulativo, ritmo, proiezione, piccoG,
      sessioni, confermati, presenti, accompagnatori, capogruppo, singoli, assocSi, assocNo, conPosto, rinunce, conPiva,
      ritorni, ore, sett, arrivi, arriviK, mobile, topImprese, topCap, roma, email, smsOk, smsKo: smsLog.length - smsOk,
    }
  }, [evento, regs, views, altreRegs, eventiMap, emailLog, smsLog])

  const tot = regs.length
  const cap = evento?.capienza_max || null
  const obiettivo = evento?.obiettivo_iscritti || null
  const piccoOra = a.ore.indexOf(Math.max(...a.ore))
  const piccoGiorno = a.sett.indexOf(Math.max(...a.sett))

  return (
    <>
      {/* Obiettivi e proiezione */}
      <div style={st.grid4}>
        <Kpi label={a.passato ? 'Evento concluso' : a.giorniMancanti === 0 ? 'Evento oggi' : 'Giorni all\'evento'}
          value={a.passato ? '-' : a.giorniMancanti === 0 ? 'Oggi' : a.giorniMancanti}
          sub={a.dataEv ? fmtGL(a.dataEv) : 'data non impostata'} />
        <Kpi label="Ritmo iscrizioni" value={`${a.ritmo.toFixed(1)}/g`} sub="media ultimi 7 giorni" />
        <Kpi label="Proiezione all'evento" value={a.proiezione ?? '-'}
          sub={a.proiezione == null ? 'disponibile prima dell\'evento' : cap ? `${pct(a.proiezione, cap)}% della capienza` : 'iscritti stimati'}
          tone={a.proiezione != null && cap && a.proiezione > cap ? 'warn' : undefined} />
        <Kpi label="Giorno record" value={a.iscrG[a.piccoG] || 0} sub={a.piccoG ? `iscrizioni il ${fmtG(a.piccoG)}` : '-'} />
      </div>

      {(cap || obiettivo) && (
        <Sezione titolo="Obiettivi e capienza">
          {cap && <Progress label="Capienza" n={tot - a.rinunce} max={cap} color="#5B5FEF" nota={`${Math.max(0, cap - tot + a.rinunce)} posti ancora liberi`} />}
          {obiettivo && <Progress label="Obiettivo iscritti" n={tot} max={obiettivo} color="#7C4DFF" />}
          {evento?.obiettivo_presenze && <Progress label="Obiettivo presenze" n={a.presenti} max={evento.obiettivo_presenze} color="#059669" />}
        </Sezione>
      )}

      <Sezione titolo="Andamento iscrizioni" sotto={`Iscritti cumulativi dal ${a.giorni[0] ? fmtG(a.giorni[0]) : '-'}${obiettivo ? ` - obiettivo ${obiettivo}` : ''}`}>
        <AreaCurveChart labels={a.giorni.map(fmtG)} tips={a.giorni.map(fmtGL)}
          series={[{ name: 'Iscritti totali', color: '#5B5FEF', values: a.cumulativo }]} />
      </Sezione>

      <Sezione titolo="Visite e iscrizioni per giorno" sotto="Confronto tra visite alla landing page e nuove iscrizioni">
        <AreaCurveChart labels={a.giorni.map(fmtG)} tips={a.giorni.map(fmtGL)}
          series={[{ name: 'Visite', color: '#38BDF8', values: a.giorni.map(g => a.visG[g]) }, { name: 'Iscrizioni', color: '#5B5FEF', values: a.giorni.map(g => a.iscrG[g]) }]} />
      </Sezione>

      {/* Funnel */}
      <Sezione titolo="Percorso di conversione" sotto="Da chi visita la pagina a chi entra in sala">
        <Funnel steps={[
          { label: 'Visite landing', n: views.length, sub: `${a.sessioni} sessioni` },
          { label: 'Iscrizioni', n: tot },
          { label: 'Iscrizioni attive', n: tot - a.rinunce, sub: `${a.rinunce} rinunce` },
          { label: 'Presenza confermata', n: a.confermati, sub: 'risposta al link di conferma' },
          { label: 'Presenti', n: a.presenti },
        ]} />
      </Sezione>

      <div style={st.grid2}>
        <Sezione titolo="Composizione iscritti">
          <Stack parts={[{ l: 'Singoli', n: a.singoli, c: '#5B5FEF' }, { l: 'Capogruppo', n: a.capogruppo, c: '#7C4DFF' }, { l: 'Accompagnatori', n: a.accompagnatori, c: '#C4B5FD' }]} />
          <Riga l="Singoli" n={a.singoli} tot={tot} c="#5B5FEF" />
          <Riga l="Capogruppo" n={a.capogruppo} tot={tot} c="#7C4DFF" />
          <Riga l="Accompagnatori" n={a.accompagnatori} tot={tot} c="#C4B5FD"
            extra={a.capogruppo ? `media ${(a.accompagnatori / a.capogruppo).toFixed(1)} per gruppo` : ''} />
        </Sezione>
        <Sezione titolo="Profilo">
          <Riga l="Gia partecipanti a eventi precedenti" n={a.ritorni} tot={tot} c="#059669" />
          <Riga l="Nuovi partecipanti" n={tot - a.ritorni} tot={tot} c="#38BDF8" />
          <Riga l="Associati CNA (verificati)" n={a.assocSi} tot={tot} c="#16A34A" extra={`${tot - a.assocSi - a.assocNo} non verificati`} />
          <Riga l="Con P.IVA valida" n={a.conPiva} tot={tot} c="#7C3AED" />
          <Riga l="Residenti a Roma (CAP 001xx)" n={a.roma} tot={tot} c="#0891B2" />
          {a.conPosto > 0 && <Riga l="Con posto assegnato" n={a.conPosto} tot={tot} c="#F59E0B" extra={`${tot - a.conPosto} senza posto`} />}
        </Sezione>
      </div>

      <div style={st.grid2}>
        <Sezione titolo="Quando si iscrivono" sotto={a.ore[piccoOra] ? `Fascia piu attiva: ${piccoOra}:00-${piccoOra + 1}:00, ${['lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato', 'domenica'][piccoGiorno]}` : ''}>
          <Barre valori={a.ore} etichette={a.ore.map((_, i) => (i % 3 === 0 ? String(i) : ''))} titoli={a.ore.map((n, i) => `${i}:00 - ${n} iscrizioni`)} />
          <div style={{ height: 16 }} />
          <Barre valori={a.sett} etichette={GIORNI} titoli={a.sett.map((n, i) => `${GIORNI[i]} - ${n} iscrizioni`)} altezza={60} />
        </Sezione>
        <Sezione titolo="Visitatori della landing">
          <Stack parts={[{ l: 'Smartphone', n: a.mobile, c: '#5B5FEF' }, { l: 'Computer', n: views.length - a.mobile, c: '#CBD5E1' }]} />
          <Riga l="Da smartphone" n={a.mobile} tot={views.length} c="#5B5FEF" />
          <Riga l="Da computer" n={views.length - a.mobile} tot={views.length} c="#94A3B8" />
          <Riga l="Visite per iscrizione" n={tot ? (views.length / tot).toFixed(1) : '-'} c="#38BDF8" testo />
          <Riga l="Sessioni uniche" n={a.sessioni} tot={views.length} c="#0891B2" />
        </Sezione>
      </div>

      {a.arriviK.length > 0 && (
        <Sezione titolo="Orari di arrivo" sotto={`Check-in per quarto d'ora - ${a.presenti} presenti`}>
          <Barre valori={a.arriviK.map(k => a.arrivi[k])} etichette={a.arriviK.map((k, i) => (i % Math.ceil(a.arriviK.length / 10) === 0 ? k : ''))} titoli={a.arriviK.map(k => `${k} - ${a.arrivi[k]} arrivi`)} altezza={90} />
        </Sezione>
      )}

      <div style={st.grid2}>
        {a.topImprese.length > 0 && (
          <Sezione titolo="Imprese / enti con piu iscritti">
            {a.topImprese.map(i => <Riga key={i.nome} l={i.nome} n={i.n} tot={a.topImprese[0].n} c="#7C3AED" assoluto />)}
          </Sezione>
        )}
        {a.topCap.length > 0 && (
          <Sezione titolo="CAP piu frequenti">
            {a.topCap.map(([c, n]) => <Riga key={c} l={c} n={n} tot={tot} c="#0891B2" />)}
          </Sezione>
        )}
      </div>

      {(Object.keys(a.email).length > 0 || smsLog.length > 0) && (
        <Sezione titolo="Comunicazioni inviate">
          <div style={st.grid4}>
            {Object.entries(a.email).map(([t, v]) => <Kpi key={t} label={`Email: ${t.replace(/_/g, ' ')}`} value={v.ok} sub={v.ko ? `${v.ko} non recapitate` : 'tutte inviate'} tone={v.ko ? 'warn' : undefined} />)}
            {smsLog.length > 0 && <Kpi label="SMS" value={a.smsOk} sub={a.smsKo ? `${a.smsKo} in errore` : 'tutti inviati'} tone={a.smsKo ? 'warn' : undefined} />}
          </div>
        </Sezione>
      )}
    </>
  )
}

// ---------- componenti grafici ----------
function Sezione({ titolo, sotto, children }) {
  return (
    <div style={st.section}>
      <h2 style={{ ...st.title, marginBottom: sotto ? 4 : 16 }}>{titolo}</h2>
      {sotto && <p style={st.sub}>{sotto}</p>}
      {children}
    </div>
  )
}

function Kpi({ label, value, sub, tone }) {
  return (
    <div style={{ ...st.kpi, ...(tone === 'warn' ? { borderColor: '#FCD34D', background: '#FFFBEB' } : {}) }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 900, color: tone === 'warn' ? '#B45309' : '#111827', letterSpacing: '-.02em', margin: '4px 0 2px', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: 12, color: '#9CA3AF' }}>{sub}</div>
    </div>
  )
}

function Progress({ label, n, max, color, nota }) {
  const p = pct(n, max)
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
        <span style={{ fontWeight: 700, color: '#374151' }}>{label}</span>
        <span style={{ color: '#6B7280', fontVariantNumeric: 'tabular-nums' }}><b style={{ color: p >= 100 ? '#059669' : color }}>{n}</b> / {max} ({p}%)</span>
      </div>
      <div style={{ height: 10, background: '#F1F3F9', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(100, p)}%`, height: '100%', background: p >= 100 ? '#059669' : color, borderRadius: 6 }} />
      </div>
      {nota && <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 4 }}>{nota}</div>}
    </div>
  )
}

function Funnel({ steps }) {
  const max = Math.max(1, steps[0].n)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {steps.map((s, i) => {
        const prev = i ? steps[i - 1].n : null
        return (
          <div key={s.label} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 180px) 1fr 70px', gap: 12, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{s.label}</div>
              {s.sub && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{s.sub}</div>}
            </div>
            <div style={{ background: '#F5F6FB', borderRadius: 8, height: 26, position: 'relative' }}>
              <div style={{ width: `${Math.max(s.n ? 1.5 : 0, (s.n / max) * 100)}%`, height: '100%', borderRadius: 8, background: `linear-gradient(90deg, #5B5FEF, ${['#5B5FEF', '#6D63F2', '#7C4DFF', '#8B5CF6', '#059669'][i] || '#5B5FEF'})` }} />
              <span style={{ position: 'absolute', left: 10, top: 4, fontSize: 12.5, fontWeight: 800, color: s.n / max > 0.12 ? '#fff' : '#374151' }}>{s.n.toLocaleString('it-IT')}</span>
            </div>
            <div style={{ fontSize: 12, color: '#6B7280', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{prev != null ? `${pct(s.n, prev)}%` : ''}</div>
          </div>
        )
      })}
      <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'right' }}>% = passaggio rispetto al gradino precedente</div>
    </div>
  )
}

function Stack({ parts }) {
  const tot = parts.reduce((s, p) => s + p.n, 0) || 1
  return (
    <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', gap: 2, marginBottom: 14 }}>
      {parts.filter(p => p.n > 0).map(p => <div key={p.l} title={`${p.l}: ${p.n}`} style={{ flex: p.n / tot, background: p.c }} />)}
    </div>
  )
}

function Riga({ l, n, tot, c, extra, assoluto, testo }) {
  const w = testo ? 0 : pct(n, tot)
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12.5, marginBottom: testo ? 0 : 4 }}>
        <span style={{ color: '#374151', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l}{extra && <span style={{ color: '#9CA3AF', fontWeight: 500, fontSize: 11 }}> | {extra}</span>}</span>
        <span style={{ color: '#6B7280', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}><b style={{ color: '#111827' }}>{n}</b>{!testo && !assoluto && tot ? ` (${w}%)` : ''}</span>
      </div>
      {!testo && <div style={{ height: 6, background: '#F1F3F9', borderRadius: 3 }}><div style={{ width: `${Math.min(100, w)}%`, height: '100%', background: c, borderRadius: 3 }} /></div>}
    </div>
  )
}

function Barre({ valori, etichette, titoli, altezza = 80 }) {
  const max = Math.max(1, ...valori)
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: altezza }}>
        {valori.map((v, i) => (
          <div key={i} title={titoli[i]} style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end' }}>
            <div style={{ width: '100%', height: v ? Math.max(3, (v / max) * altezza) : 2, background: v === max && v ? '#5B5FEF' : v ? '#A5A8F6' : '#EEF0F6', borderRadius: '3px 3px 0 0' }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 3, marginTop: 5 }}>{etichette.map((e, i) => <span key={i} style={{ flex: 1, fontSize: 10, color: '#9CA3AF', textAlign: 'center', whiteSpace: 'nowrap' }}>{e}</span>)}</div>
    </>
  )
}

const st = {
  section: { backgroundColor: '#FFFFFF', border: '1px solid #E8ECF4', borderRadius: 20, padding: 20 },
  title: { fontSize: 15, fontWeight: 900, color: '#111827', letterSpacing: '-0.02em', margin: '0 0 4px', fontFamily: "'Inter', sans-serif" },
  sub: { fontSize: 12, color: '#9CA3AF', margin: '0 0 16px' },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 },
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 },
  kpi: { background: '#fff', border: '1px solid #E8ECF4', borderRadius: 16, padding: '14px 16px' },
}
