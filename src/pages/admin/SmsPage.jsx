import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

const MAX_CHARS = 160

export default function SmsPage() {
  const { user } = useAuth()

  // Selezione evento
  const [eventi, setEventi] = useState([])
  const [eventoSelezionato, setEventoSelezionato] = useState(null)

  // Iscritti
  const [iscritti, setIscritti] = useState([])
  const [loadingIscritti, setLoadingIscritti] = useState(false)
  const [selezione, setSelezione] = useState([]) // array di id

  // Messaggio
  const [messaggio, setMessaggio] = useState('')
  const [mittente, setMittente] = useState('CNAROMA')

  // Invio
  const [invioLoading, setInvioLoading] = useState(false)
  const [risultato, setRisultato] = useState(null)

  // Log storico
  const [log, setLog] = useState([])
  const [loadingLog, setLoadingLog] = useState(false)

  // Tab
  const [tab, setTab] = useState('nuovo') // 'nuovo' | 'storico'

  // Filtro ricerca iscritti
  const [filtro, setFiltro] = useState('')

  // ── Carica eventi ───────────────────────────────────────────────
  useEffect(() => {
    supabase.from('events').select('id, titolo, data_inizio').order('data_inizio', { ascending: false })
      .then(({ data }) => setEventi(data || []))
  }, [])

  // ── Carica iscritti evento ───────────────────────────────────────
  const caricaIscritti = useCallback(async (eventoId) => {
    setLoadingIscritti(true)
    setSelezione([])
    const { data } = await supabase
      .from('registrations')
      .select('id, nome, cognome, email, cellulare')
      .eq('evento_id', eventoId)
      .not('cellulare', 'is', null)
      .neq('cellulare', '')
      .order('cognome')
    setIscritti(data || [])
    setSelezione((data || []).map(r => r.id))
    setLoadingIscritti(false)
  }, [])

  useEffect(() => {
    if (eventoSelezionato) caricaIscritti(eventoSelezionato)
    else setIscritti([])
  }, [eventoSelezionato, caricaIscritti])

  // ── Carica log SMS ───────────────────────────────────────────────
  const caricaLog = useCallback(async () => {
    setLoadingLog(true)
    const query = supabase
      .from('sms_log')
      .select('id, telefono, messaggio, mittente, stato, created_at, eventi:evento_id(titolo), registrazioni:registrazione_id(nome, cognome)')
      .order('created_at', { ascending: false })
      .limit(200)
    if (eventoSelezionato) query.eq('evento_id', eventoSelezionato)
    const { data } = await query
    setLog(data || [])
    setLoadingLog(false)
  }, [eventoSelezionato])

  useEffect(() => {
    if (tab === 'storico') caricaLog()
  }, [tab, caricaLog])

  // ── Toggle selezione ────────────────────────────────────────────
  const toggleIscritto = (id) => {
    setSelezione(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  const toggleTutti = () => {
    const filtrati = iscrittiVisibili.map(r => r.id)
    const tuttiSelezionati = filtrati.every(id => selezione.includes(id))
    if (tuttiSelezionati) setSelezione(prev => prev.filter(id => !filtrati.includes(id)))
    else setSelezione(prev => [...new Set([...prev, ...filtrati])])
  }

  // ── Filtro iscritti ─────────────────────────────────────────────
  const iscrittiVisibili = iscritti.filter(r => {
    if (!filtro) return true
    const q = filtro.toLowerCase()
    return (r.nome + ' ' + r.cognome + ' ' + r.email + ' ' + r.cellulare).toLowerCase().includes(q)
  })

  // ── Conta caratteri e SMS ────────────────────────────────────────
  const nChars = messaggio.length
  const nSms = Math.ceil(nChars / MAX_CHARS) || 1
  const nDestinatari = selezione.length

  // ── Invio ────────────────────────────────────────────────────────
  const inviaSmS = async () => {
    if (!messaggio.trim() || nDestinatari === 0) return
    setInvioLoading(true)
    setRisultato(null)

    const destinatariMap = Object.fromEntries(iscritti.map(r => [r.id, r]))
    const destinatari = selezione.map(id => ({
      registrazione_id: id,
      telefono: destinatariMap[id]?.cellulare,
      nome: destinatariMap[id]?.nome,
      cognome: destinatariMap[id]?.cognome,
    })).filter(d => d.telefono)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const resp = await fetch(
        'https://hnkhckcclgabunkqfmrz.supabase.co/functions/v1/invia-sms',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            destinatari,
            messaggio,
            mittente,
            evento_id: eventoSelezionato || undefined,
            inviato_da: user?.id,
          }),
        }
      )
      const json = await resp.json()
      setRisultato(json)
      if (json.successo) {
        setMessaggio('')
        if (tab === 'storico') caricaLog()
      }
    } catch (err) {
      setRisultato({ successo: false, errore: String(err) })
    }
    setInvioLoading(false)
  }

  // ── Stili ────────────────────────────────────────────────────────
  const s = {
    page: { padding: '0', fontFamily: 'Inter, sans-serif', color: '#0A0A0A' },
    header: { marginBottom: 24 },
    title: { fontSize: 22, fontWeight: 900, color: '#E11D48', letterSpacing: '-0.04em', margin: '0 0 4px' },
    sub: { color: '#6B7280', fontSize: 13 },
    tabs: { display: 'flex', gap: 8, marginBottom: 24 },
    tab: (active) => ({
      padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600,
      fontSize: 13, background: active ? '#E11D48' : '#F3F4F6', color: active ? '#fff' : '#6B7280',
      transition: 'all .15s',
    }),
    card: { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, marginBottom: 16 },
    label: { fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6, display: 'block' },
    select: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 14, outline: 'none', color: '#0A0A0A' },
    input: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 14, outline: 'none', color: '#0A0A0A', boxSizing: 'border-box' },
    textarea: { width: '100%', padding: '12px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 14, outline: 'none', resize: 'vertical', minHeight: 100, fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' },
    charCount: (over) => ({ fontSize: 12, color: over ? '#DC2626' : '#6B7280', textAlign: 'right', marginTop: 4 }),
    btnPrimary: { background: '#059669', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 },
    btnDisabled: { background: '#E5E7EB', color: '#9CA3AF', border: 'none', borderRadius: 8, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'not-allowed' },
    alert: (ok) => ({ background: ok ? '#ECFDF5' : '#FEF2F2', border: `1px solid ${ok ? '#6EE7B7' : '#FECACA'}`, borderRadius: 8, padding: '12px 16px', fontSize: 13, color: ok ? '#065F46' : '#991B1B', marginTop: 12 }),
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
    row: (selected) => ({
      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
      borderBottom: '1px solid #F3F4F6', cursor: 'pointer',
      background: selected ? '#F0FDF4' : 'transparent', borderRadius: 4, paddingLeft: 4,
    }),
    chip: (stato) => {
      const colori = { inviato: ['#ECFDF5','#059669'], errore: ['#FEF2F2','#DC2626'], pending: ['#FFF7ED','#D97706'] }
      const [bg, fg] = colori[stato] || colori.pending
      return { background: bg, color: fg, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }
    },
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>SMS</h1>
        <p style={s.sub}>Invia messaggi SMS agli iscritti agli eventi</p>
      </div>

      <div style={s.tabs}>
        {[['nuovo','✉️ Nuovo invio'],['storico','📋 Storico invii']].map(([id, label]) => (
          <button key={id} style={s.tab(tab === id)} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {tab === 'nuovo' && (
        <>
          <div style={s.grid}>
            {/* Colonna sinistra: composizione */}
            <div>
              <div style={s.card}>
                <span style={s.label}>Seleziona evento</span>
                <select style={s.select} value={eventoSelezionato || ''} onChange={e => setEventoSelezionato(e.target.value || null)}>
                  <option value="">— Tutti gli iscritti (nessun filtro) —</option>
                  {eventi.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {ev.titolo} {ev.data_inizio ? '(' + new Date(ev.data_inizio).toLocaleDateString('it-IT') + ')' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div style={s.card}>
                <span style={s.label}>Mittente (max 11 caratteri)</span>
                <input
                  style={s.input}
                  value={mittente}
                  maxLength={11}
                  onChange={e => setMittente(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,''))}
                  placeholder="CNAROMA"
                />
                <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
                  Mittente alfanumerico. Deve corrispondere a quello configurato nel pannello Infobip.
                </p>
              </div>

              <div style={s.card}>
                <span style={s.label}>Testo del messaggio</span>
                <textarea
                  style={s.textarea}
                  value={messaggio}
                  onChange={e => setMessaggio(e.target.value)}
                  placeholder="Scrivi qui il testo del messaggio SMS..."
                />
                <p style={s.charCount(nChars > MAX_CHARS)}>
                  {nChars} / {MAX_CHARS} caratteri &nbsp;|&nbsp; {nSms} SMS per destinatario
                  {nSms > 1 && <span style={{ color: '#D97706' }}> (lungo — costo doppio)</span>}
                </p>
              </div>

              {/* Riepilogo e bottone */}
              <div style={s.card}>
                <div style={{ fontSize: 14, marginBottom: 12 }}>
                  <strong>{nDestinatari}</strong> destinatari selezionati &nbsp;·&nbsp;
                  <strong>{nDestinatari * nSms}</strong> SMS totali
                </div>
                <button
                  style={nDestinatari === 0 || !messaggio.trim() || invioLoading ? s.btnDisabled : s.btnPrimary}
                  disabled={nDestinatari === 0 || !messaggio.trim() || invioLoading}
                  onClick={inviaSmS}
                >
                  {invioLoading ? 'Invio in corso...' : `Invia SMS a ${nDestinatari} destinatari`}
                </button>

                {risultato && (
                  <div style={s.alert(risultato.successo)}>
                    {risultato.successo
                      ? `Invio completato: ${risultato.inviati} inviati, ${risultato.errori} errori.`
                      : `Errore: ${risultato.errore}`
                    }
                  </div>
                )}
              </div>
            </div>

            {/* Colonna destra: lista destinatari */}
            <div style={s.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={s.label}>Destinatari</span>
                <button
                  onClick={toggleTutti}
                  style={{ fontSize: 12, color: '#E11D48', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  {iscrittiVisibili.every(r => selezione.includes(r.id)) ? 'Deseleziona tutti' : 'Seleziona tutti'}
                </button>
              </div>

              <input
                style={{ ...s.input, marginBottom: 10 }}
                placeholder="Cerca per nome, email, cellulare..."
                value={filtro}
                onChange={e => setFiltro(e.target.value)}
              />

              {loadingIscritti ? (
                <p style={{ color: '#9CA3AF', fontSize: 13 }}>Caricamento...</p>
              ) : iscritti.length === 0 ? (
                <p style={{ color: '#9CA3AF', fontSize: 13 }}>
                  {eventoSelezionato ? 'Nessun iscritto con cellulare per questo evento.' : 'Seleziona un evento per filtrare, oppure verranno usati tutti gli iscritti con cellulare.'}
                </p>
              ) : (
                <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                  {iscrittiVisibili.map(r => (
                    <div key={r.id} style={s.row(selezione.includes(r.id))} onClick={() => toggleIscritto(r.id)}>
                      <input type="checkbox" checked={selezione.includes(r.id)} onChange={() => {}} style={{ accentColor: '#059669', cursor: 'pointer' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {r.nome} {r.cognome}
                        </div>
                        <div style={{ fontSize: 11, color: '#6B7280' }}>{r.cellulare}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {tab === 'storico' && (
        <div style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={s.label}>Ultimi 200 invii</span>
            <button onClick={caricaLog} style={{ fontSize: 12, color: '#E11D48', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              Aggiorna
            </button>
          </div>

          {loadingLog ? (
            <p style={{ color: '#9CA3AF', fontSize: 13 }}>Caricamento...</p>
          ) : log.length === 0 ? (
            <p style={{ color: '#9CA3AF', fontSize: 13 }}>Nessun SMS inviato ancora.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F9FAFB' }}>
                    {['Data','Destinatario','Cellulare','Evento','Messaggio','Stato'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#374151', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {log.map(row => (
                    <tr key={row.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '8px 12px', whiteSpace: 'nowrap', color: '#6B7280' }}>
                        {new Date(row.created_at).toLocaleString('it-IT', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' })}
                      </td>
                      <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                        {row.registrazioni ? `${row.registrazioni.nome} ${row.registrazioni.cognome}` : '—'}
                      </td>
                      <td style={{ padding: '8px 12px', color: '#6B7280' }}>{row.telefono}</td>
                      <td style={{ padding: '8px 12px', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row.eventi?.titolo || '—'}
                      </td>
                      <td style={{ padding: '8px 12px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row.messaggio}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={s.chip(row.stato)}>{row.stato}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
