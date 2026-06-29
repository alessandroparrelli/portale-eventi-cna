import { useEffect, useRef, useState } from 'react'
import { usePageTitle } from '../../hooks/usePageTitle'
import { supabase } from '../../lib/supabase'
import { useRole } from '../../hooks/useRole'
import { Modal, Btn, Select, Field, Input } from '../../components/ui'
import GlowStatCard from '../../components/GlowStatCard'
import { QrCode, UserPlus, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Search, Camera, CameraOff, Users, WifiOff } from 'lucide-react'
import EventSelector from '../../components/EventSelector'
import PwaInstallBanner from '../../components/PwaInstallBanner'

function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine)
  useEffect(() => {
    const on  = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  if (!offline) return null
  return (
    <div style={{ backgroundColor:'#FEF3C7', border:'1px solid #FCD34D', borderRadius:'8px', padding:'10px 14px', marginBottom:'14px', display:'flex', alignItems:'center', gap:'10px' }}>
      <WifiOff size={16} style={{ color:'#D97706', flexShrink:0 }} />
      <p style={{ fontSize:'13px', fontWeight:'600', color:'#92400E', margin:0 }}>
        Modalità offline — i check-in verranno sincronizzati quando torni online.
      </p>
    </div>
  )
}

/* ─── Banner risultato ─────────────────────────────────────────── */
function ResultBanner({ result, onClose }) {
  if (!result) return null
  const ok      = result.ok
  const double  = result.error === 'gia_presente'
  const notFound= result.error === 'non_trovato'

  return (
    <div style={{
      borderRadius: '14px',
      marginBottom: '14px',
      overflow: 'hidden',
      boxShadow: ok
        ? '0 4px 24px rgba(22,163,74,.25)'
        : double
        ? '0 4px 24px rgba(217,119,6,.2)'
        : '0 4px 24px rgba(220,38,38,.2)',
    }}>
      <div style={{
        background: ok ? '#16A34A' : double ? '#D97706' : '#DC2626',
        padding: '18px 20px',
        display: 'flex', gap: '14px', alignItems: 'center',
      }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%',
          background: 'rgba(255,255,255,.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {ok
            ? <CheckCircle2 size={28} color="#fff" />
            : double
            ? <AlertTriangle size={28} color="#fff" />
            : <XCircle size={28} color="#fff" />}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: '900', fontSize: '19px', color: '#fff', margin: '0 0 2px', letterSpacing: '-.03em' }}>
            {ok ? '✓ Check-in OK' : double ? '⚠ Già registrato' : '✗ QR non trovato'}
          </p>
          {result.nome && (
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,.9)', margin: 0, fontWeight: '600' }}>
              {result.nome}
            </p>
          )}
          {result.ragione_sociale && (
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.7)', margin: '2px 0 0' }}>
              {result.ragione_sociale}
            </p>
          )}
          {double && result.checkin_at && (
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.75)', margin: '4px 0 0' }}>
              Già registrato alle {new Date(result.checkin_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
          {notFound && (
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.8)', margin: '4px 0 0' }}>
              Nessun iscritto trovato con questo QR.
            </p>
          )}
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,.2)', border: 'none', borderRadius: '8px',
          cursor: 'pointer', color: '#fff', width: '32px', height: '32px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px', flexShrink: 0,
        }}>×</button>
      </div>
    </div>
  )
}

/* ─── PAGINA CHECKIN ──────────────────────────────────────────── */
export default function CheckinPage() {
  // Registra service worker per PWA offline
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  usePageTitle('Check-in')
  const [eventi,         setEventi]        = useState([])
  const [selectedEvento, setSelectedEvento]= useState('')
  const [scanning,       setScanning]      = useState(false)
  const [manualModal,    setManualModal]   = useState(false)
  const [walkinModal,    setWalkinModal]   = useState(false)
  const [listaModal,     setListaModal]    = useState(false)
  const [result,         setResult]        = useState(null)
  const [manualQr,       setManualQr]      = useState('')
  const [walkin,         setWalkin]        = useState({ nome:'', cognome:'', email:'', cellulare:'', ragione_sociale:'', partita_iva:'', cap:'', mestiere_id:'' })
  const [walkinErrors,   setWalkinErrors]  = useState({})
  const [mestieri,       setMestieri]      = useState([])
  const [presenti,       setPresenti]      = useState([])
  const [totali,         setTotali]        = useState(0)
  const [loadingP,       setLoadingP]      = useState(false)
  const [processing,     setProcessing]    = useState(false)
  const [iscritti,       setIscritti]      = useState([])
  const [searchLista,    setSearchLista]   = useState('')
  const [loadingLista,   setLoadingLista]  = useState(false)
  const [checkingId,     setCheckingId]    = useState(null)
  const html5QrRef = useRef(null)
  const resultTimerRef = useRef(null)
  const { canWrite } = useRole()

  useEffect(() => {
    supabase.from('events').select('id,titolo,stato')
      .eq('stato', 'pubblicato').order('data_inizio', { ascending: false })
      .then(({ data }) => setEventi(data || []))
    supabase.from('mestieri').select('id,nome').eq('attivo', true).order('ordine')
      .then(({ data }) => setMestieri(data || []))
  }, [])

  useEffect(() => {
    if (selectedEvento) loadPresenti()
    return () => stopScanner()
  }, [selectedEvento])

  // Auto-dismiss banner risultato dopo 4 secondi
  useEffect(() => {
    if (result) {
      clearTimeout(resultTimerRef.current)
      resultTimerRef.current = setTimeout(() => setResult(null), 4000)
    }
    return () => clearTimeout(resultTimerRef.current)
  }, [result])

  async function loadPresenti() {
    if (!selectedEvento) return
    setLoadingP(true)
    const [{ data }, { count }] = await Promise.all([
      supabase.from('registrations').select('id,nome,cognome,ragione_sociale,checkin_at,stato')
        .eq('event_id', selectedEvento).eq('presente', true)
        .order('checkin_at', { ascending: false }).limit(100),
      supabase.from('registrations').select('id', { count: 'exact' }).eq('event_id', selectedEvento),
    ])
    setPresenti(data || []); setTotali(count || 0); setLoadingP(false)
  }

  async function loadIscritti() {
    if (!selectedEvento) return
    setLoadingLista(true)
    const { data } = await supabase.from('registrations')
      .select('id,nome,cognome,ragione_sociale,email,presente,checkin_at,stato')
      .eq('event_id', selectedEvento)
      .order('cognome', { ascending: true })
    setIscritti(data || [])
    setLoadingLista(false)
  }

  async function checkinManuale(reg) {
    if (reg.presente) return
    setCheckingId(reg.id)
    const { error } = await supabase.from('registrations')
      .update({ presente: true, stato: 'presente', checkin_at: new Date().toISOString() })
      .eq('id', reg.id)
    if (!error) {
      setIscritti(prev => prev.map(r => r.id === reg.id
        ? { ...r, presente: true, stato: 'presente', checkin_at: new Date().toISOString() }
        : r
      ))
      setResult({ ok: true, nome: `${reg.nome} ${reg.cognome}` })
      loadPresenti()
    }
    setCheckingId(null)
  }

  async function annullaCheckin(reg) {
    setCheckingId(reg.id)
    const { error } = await supabase.from('registrations')
      .update({ presente: false, stato: 'confermato', checkin_at: null })
      .eq('id', reg.id)
    if (!error) {
      setIscritti(prev => prev.map(r => r.id === reg.id
        ? { ...r, presente: false, stato: 'confermato', checkin_at: null }
        : r
      ))
      loadPresenti()
    }
    setCheckingId(null)
  }

  async function doCheckin(qr) {
    if (!qr.trim()) return
    setProcessing(true)
    const { data, error } = await supabase.rpc('checkin_by_qr', { p_qr_code: qr.trim() })
    setResult(error ? { ok: false, error: 'non_trovato' } : data)
    setProcessing(false)
    if (data?.ok) loadPresenti()
  }

  async function startScanner() {
    if (!selectedEvento) return
    setScanning(true); setResult(null)
    const { Html5Qrcode } = await import('html5-qrcode')
    html5QrRef.current = new Html5Qrcode('qr-viewport')
    try {
      await html5QrRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: window.innerWidth < 600 ? 220 : 280 },
        async decoded => { await stopScanner(); await doCheckin(decoded) },
        () => {}
      )
    } catch {
      setScanning(false)
      setResult({ ok: false, error: 'non_trovato', nome: 'Impossibile accedere alla fotocamera.' })
    }
  }

  async function stopScanner() {
    if (html5QrRef.current) {
      try { await html5QrRef.current.stop() } catch {}
      try { html5QrRef.current.clear() } catch {}
      html5QrRef.current = null
    }
    setScanning(false)
  }

  async function submitWalkin(e) {
    e.preventDefault()
    const w = walkin
    if (!w.nome.trim() || !w.cognome.trim() || !w.email.trim() || !w.cellulare.trim() || !w.ragione_sociale.trim() || !w.partita_iva.trim() || !w.cap?.trim() || !w.mestiere_id) {
      setWalkinErrors({
        nome:            !w.nome.trim()           ? 'Obbligatorio' : '',
        cognome:         !w.cognome.trim()         ? 'Obbligatorio' : '',
        email:           !w.email.trim()           ? 'Obbligatorio' : '',
        cellulare:       !w.cellulare.trim()       ? 'Obbligatorio' : '',
        ragione_sociale: !w.ragione_sociale.trim() ? 'Obbligatorio' : '',
        partita_iva:     !w.partita_iva.trim()     ? 'Obbligatorio' : '',
        cap:             !w.cap?.trim()            ? 'Obbligatorio' : '',
        mestiere_id:     !w.mestiere_id            ? 'Seleziona categoria' : '',
      })
      return
    }
    setWalkinErrors({})
    setProcessing(true)
    const { data, error } = await supabase.rpc('walkin_registrazione', {
      p_event_id:        selectedEvento,
      p_nome:            w.nome.trim(),
      p_cognome:         w.cognome.trim(),
      p_email:           w.email.trim(),
      p_cellulare:       w.cellulare.trim(),
      p_ragione_sociale: w.ragione_sociale.trim(),
      p_partita_iva:     w.partita_iva.trim(),
      p_mestiere_id:     w.mestiere_id || null,
      p_cap:             w.cap?.trim() || null,
    })
    setProcessing(false)
    if (!error && data?.ok) {
      setResult({ ok: true, nome: `${w.nome} ${w.cognome}` })
      setWalkin({ nome: '', cognome: '', email: '', cellulare: '', ragione_sociale: '', partita_iva: '', cap: '', mestiere_id: '' })
      setWalkinModal(false); loadPresenti()
    }
  }

  const pct        = totali > 0 ? Math.round((presenti.length / totali) * 100) : 0
  const nonPresenti= totali - presenti.length

  const filteredIscritti = iscritti.filter(r => {
    const q = searchLista.toLowerCase()
    return !q || r.nome?.toLowerCase().includes(q) || r.cognome?.toLowerCase().includes(q) || r.ragione_sociale?.toLowerCase().includes(q)
  })

  return (
    <div style={s.page}>

      <OfflineBanner />
      <PwaInstallBanner />

      {/* ── Selettore evento ── */}
      <EventSelector
        eventi={eventi}
        value={selectedEvento}
        onChange={e => { setSelectedEvento(e.target.value); setResult(null); stopScanner() }}
        label="Evento in corso"
      />

      {/* ── Empty state ── */}
      {!selectedEvento && (
        <div style={s.emptyHero}>
          <QrCode size={64} style={{ color: '#D1D5DB', marginBottom: '16px' }} />
          <p style={{ fontSize: '20px', fontWeight: '800', color: '#0A0A0A', margin: '0 0 8px', letterSpacing: '-.02em' }}>
            Seleziona un evento
          </p>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
            Scegli l'evento per avviare il check-in
          </p>
        </div>
      )}

      {selectedEvento && (
        <>
          {/* ── Contatore presenze — GlowStatCard ── */}
          {/* ── Contatori — riga singola orizzontale ── */}
          <div style={{ display:'flex', gap:'6px', marginBottom:'8px', alignItems:'stretch' }}>
            <div style={{ flex:1, display:'flex', alignItems:'center', gap:'8px', background:'linear-gradient(135deg,#059669,#10b981)', borderRadius:'8px', padding:'9px 12px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>
              <span style={{ fontSize:'22px', fontWeight:'900', color:'#fff', letterSpacing:'-0.03em', lineHeight:1 }}>{presenti.length}</span>
              <span style={{ fontSize:'11px', fontWeight:'700', color:'rgba(255,255,255,.85)', textTransform:'uppercase', letterSpacing:'0.04em', lineHeight:1.2 }}>Presenti</span>
            </div>
            <div style={{ flex:1, display:'flex', alignItems:'center', gap:'8px', background:'linear-gradient(135deg,#b45309,#d97706)', borderRadius:'8px', padding:'9px 12px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span style={{ fontSize:'22px', fontWeight:'900', color:'#fff', letterSpacing:'-0.03em', lineHeight:1 }}>{nonPresenti}</span>
              <span style={{ fontSize:'11px', fontWeight:'700', color:'rgba(255,255,255,.85)', textTransform:'uppercase', letterSpacing:'0.04em', lineHeight:1.2 }}>In attesa</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'6px', background:'linear-gradient(135deg,#0e7490,#0891b2)', borderRadius:'8px', padding:'9px 10px', flexShrink:0 }}>
              <span style={{ fontSize:'20px', fontWeight:'900', color:'#fff', letterSpacing:'-0.03em', lineHeight:1 }}>{pct}%</span>
              <button onClick={loadPresenti} disabled={loadingP}
                style={{ background:'rgba(255,255,255,.25)', border:'none', borderRadius:'5px', cursor:'pointer', padding:'5px', display:'flex', alignItems:'center', color:'#fff' }}>
                <RefreshCw size={12} style={{ animation: loadingP ? 'spin .8s linear infinite' : 'none' }}/>
              </button>
            </div>
          </div>
          {/* Barra percentuale sottile */}
          <div style={{ height:'3px', backgroundColor:'#E5E7EB', borderRadius:'2px', marginBottom:'12px', overflow:'hidden' }}>
            <div style={{ width:`${pct}%`, height:'100%', background:'linear-gradient(90deg,#059669,#10b981)', borderRadius:'2px', transition:'width .5s' }}/>
          </div>

          {/* ── Banner risultato ── */}
          <ResultBanner result={result} onClose={() => setResult(null)} />

          {/* ── Scanner ── */}
          <div style={s.scanCard}>
            <div
              id="qr-viewport"
              style={{
                width: '100%', overflow: 'hidden', borderRadius: '10px 10px 0 0',
                minHeight: scanning ? '280px' : '0',
                backgroundColor: scanning ? '#000' : 'transparent',
              }}
            />
            {!scanning && (
              <div style={s.scanPlaceholder}>
                <div style={{
                  width: '72px', height: '72px', borderRadius: '50%',
                  background: '#F3F4F6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '12px',
                }}>
                  <Camera size={34} style={{ color: '#9CA3AF' }} />
                </div>
                <p style={{ fontSize: '15px', color: '#6B7280', margin: 0, fontWeight: '500' }}>
                  Premi per avviare la fotocamera
                </p>
              </div>
            )}
            <div style={{ padding: '12px' }}>
              {!scanning ? (
                <button onClick={startScanner} style={s.bigBtn}>
                  <Camera size={22} /> Avvia scanner QR
                </button>
              ) : (
                <button onClick={stopScanner} style={{ ...s.bigBtn, background: '#DC2626' }}>
                  <CameraOff size={22} /> Ferma scanner
                </button>
              )}
            </div>
          </div>

          {/* ── Azioni rapide ── */}
          <div style={s.actionsRow} className="checkin-actions">
            <button onClick={() => setManualModal(true)} style={s.actionBtn}>
              <Search size={18} />
              <span>Codice manuale</span>
            </button>
            {canWrite && (
              <button
                onClick={() => { loadIscritti(); setListaModal(true) }}
                style={{ ...s.actionBtn, background: '#F0FDF4', color: '#16A34A', borderColor: '#86EFAC' }}
              >
                <Users size={18} />
                <span>Lista iscritti</span>
              </button>
            )}
            {canWrite && (
              <button
                onClick={() => setWalkinModal(true)}
                style={{ ...s.actionBtn, background: '#F3E8FF', color: '#7C3AED', borderColor: '#E9D5FF' }}
              >
                <UserPlus size={18} />
                <span>Walk-in</span>
              </button>
            )}
          </div>

          {/* ── Ultimi check-in ── */}
          <div style={s.presentiSection}>
            <div style={s.presentiHeader}>
              <p style={s.presentiTitle}>
                Ultimi check-in
              </p>
              <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600' }}>
                {presenti.length} / {totali}
              </span>
            </div>
            {loadingP ? (
              <p style={s.pEmpty}>Caricamento…</p>
            ) : presenti.length === 0 ? (
              <p style={s.pEmpty}>Nessun check-in ancora</p>
            ) : (
              <div style={s.presentiList}>
                {presenti.map((p, i) => {
                  const initials = `${p.nome?.[0] || ''}${p.cognome?.[0] || ''}`.toUpperCase()
                  const colors   = ['#003DA5','#16A34A','#D97706','#7C3AED','#DC2626','#0891B2']
                  const bg       = colors[i % colors.length]
                  const isWalkin = p.stato === 'walk-in'
                  return (
                    <div key={p.id} style={s.presentiItem}>
                      <div style={{ ...s.pAvatar, backgroundColor: bg }}>{initials}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={s.pName}>{p.nome} {p.cognome}</p>
                        {p.ragione_sociale && <p style={s.pSub}>{p.ragione_sociale}</p>}
                        {p.checkin_at && (
                          <p style={s.pTime}>
                            {new Date(p.checkin_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                            {isWalkin && <span style={{ marginLeft: '6px', fontSize: '10px', background: '#F3E8FF', color: '#7C3AED', padding: '1px 5px', borderRadius: '4px', fontWeight: '700' }}>WALK-IN</span>}
                          </p>
                        )}
                      </div>
                      <CheckCircle2 size={20} style={{ color: '#16A34A', flexShrink: 0 }} />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Modal codice manuale ── */}
      {manualModal && (
        <Modal title="Inserisci codice QR" onClose={() => { setManualModal(false); setManualQr('') }} width="420px">
          <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 14px' }}>
            Inserisci manualmente il codice QR stampato sul badge.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Input
              value={manualQr}
              onChange={e => setManualQr(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && manualQr.trim()) { doCheckin(manualQr); setManualModal(false); setManualQr('') } }}
              placeholder="QR-XXXXXXXXXXXXXXXX"
              autoFocus
              style={{ flex: 1 }}
            />
            <Btn
              disabled={!manualQr.trim() || processing}
              onClick={() => { doCheckin(manualQr); setManualModal(false); setManualQr('') }}
            >
              {processing ? '…' : 'Check-in'}
            </Btn>
          </div>
        </Modal>
      )}

      {/* ── Modal lista iscritti ── */}
      {listaModal && (
        <Modal title="Lista iscritti" onClose={() => { setListaModal(false); setSearchLista('') }} width="600px">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '70vh', maxHeight: '600px' }}>

            {/* Ricerca */}
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input
                value={searchLista}
                onChange={e => setSearchLista(e.target.value)}
                placeholder="Cerca per nome, cognome o azienda…"
                autoFocus
                style={{
                  width: '100%', padding: '10px 12px 10px 36px',
                  border: '1px solid #E5E7EB', borderRadius: '8px',
                  fontSize: '14px', fontFamily: "'Inter',sans-serif",
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Statistiche rapide */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { label: 'Totale', val: iscritti.length, color: '#003DA5' },
                { label: 'Presenti', val: iscritti.filter(r => r.presente).length, color: '#16A34A' },
                { label: 'Attesa', val: iscritti.filter(r => !r.presente).length, color: '#D97706' },
              ].map(stat => (
                <div key={stat.label} style={{
                  flex: 1, background: '#F9FAFB', borderRadius: '8px',
                  padding: '8px 10px', textAlign: 'center',
                  border: `1px solid #E5E7EB`,
                }}>
                  <p style={{ fontSize: '18px', fontWeight: '900', color: stat.color, margin: 0, letterSpacing: '-.02em' }}>
                    {stat.val}
                  </p>
                  <p style={{ fontSize: '11px', color: '#6B7280', margin: 0, fontWeight: '600' }}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Lista */}
            {loadingLista ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: '#9CA3AF', fontSize: '14px' }}>Caricamento…</p>
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                {filteredIscritti.length === 0 ? (
                  <p style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>
                    Nessun risultato
                  </p>
                ) : filteredIscritti.map(r => {
                  const isChecking = checkingId === r.id
                  return (
                    <div key={r.id} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px 14px',
                      borderBottom: '1px solid #F3F4F6',
                      background: r.presente ? '#F0FDF4' : '#fff',
                      transition: 'background .15s',
                    }}>
                      {/* Toggle check-in */}
                      <button
                        onClick={() => r.presente ? annullaCheckin(r) : checkinManuale(r)}
                        disabled={isChecking}
                        title={r.presente ? 'Annulla check-in' : 'Effettua check-in'}
                        style={{
                          width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
                          border: r.presente ? 'none' : '2px solid #D1D5DB',
                          background: r.presente ? '#16A34A' : '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all .15s',
                        }}
                      >
                        {isChecking
                          ? <div style={{ width: '14px', height: '14px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .6s linear infinite' }} />
                          : r.presente
                          ? <CheckCircle2 size={18} color="#fff" />
                          : null
                        }
                      </button>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '14px', fontWeight: '700', color: '#0A0A0A', margin: 0, letterSpacing: '-.01em' }}>
                          {r.cognome} {r.nome}
                        </p>
                        {r.ragione_sociale && (
                          <p style={{ fontSize: '12px', color: '#6B7280', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.ragione_sociale}
                          </p>
                        )}
                      </div>

                      {/* Stato */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        {r.presente ? (
                          <>
                            <span style={{ fontSize: '11px', fontWeight: '700', color: '#16A34A', display: 'block' }}>
                              {r.stato === 'walk-in' ? 'Walk-in' : 'Presente'}
                            </span>
                            {r.checkin_at && (
                              <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                                {new Date(r.checkin_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#D1D5DB', fontWeight: '500' }}>—</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Modal>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>

      {/* ── Modal walk-in ── */}
      {walkinModal && (
        <Modal title="Aggiungi walk-in" onClose={() => setWalkinModal(false)} width="480px">
          <form onSubmit={submitWalkin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
              Aggiunge il partecipante direttamente tra i presenti. Tutti i campi sono obbligatori.
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {/* Nome + Cognome affiancati solo se c'è spazio */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }} className="form-grid-2col">
                <Field label="Nome *" error={walkinErrors.nome}>
                  <Input value={walkin.nome} onChange={e => setWalkin(p => ({ ...p, nome: e.target.value }))} placeholder="Mario" />
                </Field>
                <Field label="Cognome *" error={walkinErrors.cognome}>
                  <Input value={walkin.cognome} onChange={e => setWalkin(p => ({ ...p, cognome: e.target.value }))} placeholder="Rossi" />
                </Field>
              </div>
              <Field label="Email *" error={walkinErrors.email}>
                <Input type="email" value={walkin.email} onChange={e => setWalkin(p => ({ ...p, email: e.target.value }))} placeholder="mario@example.it" />
              </Field>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }} className="form-grid-2col">
                <Field label="Cellulare *" error={walkinErrors.cellulare}>
                  <Input value={walkin.cellulare} onChange={e => setWalkin(p => ({ ...p, cellulare: e.target.value }))} placeholder="333 1234567" />
                </Field>
                <Field label="CAP *" error={walkinErrors.cap}>
                  <Input value={walkin.cap || ''} onChange={e => setWalkin(p => ({ ...p, cap: e.target.value }))} placeholder="00100" />
                </Field>
              </div>
              <Field label="Ragione Sociale *" error={walkinErrors.ragione_sociale}>
                <Input value={walkin.ragione_sociale} onChange={e => setWalkin(p => ({ ...p, ragione_sociale: e.target.value }))} placeholder="Rossi Falegnameria Srl" />
              </Field>
              <Field label="Partita IVA *" error={walkinErrors.partita_iva}>
                <Input value={walkin.partita_iva || ''} onChange={e => setWalkin(p => ({ ...p, partita_iva: e.target.value }))} placeholder="12345670015" />
              </Field>
              <Field label="Categoria professionale *" error={walkinErrors.mestiere_id}>
                <select
                  value={walkin.mestiere_id || ''}
                  onChange={e => setWalkin(p => ({ ...p, mestiere_id: e.target.value }))}
                  style={{ width:'100%', padding:'10px 12px', border:`1px solid ${walkinErrors.mestiere_id ? '#DC2626' : '#D1D5DB'}`, borderRadius:'6px', fontSize:'16px', fontFamily:"'Inter',sans-serif", outline:'none', backgroundColor:'#FFF', appearance:'none' }}
                >
                  <option value="">— Seleziona categoria —</option>
                  {mestieri.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
                {walkinErrors.mestiere_id && <span style={{ fontSize:'12px', color:'#DC2626' }}>{walkinErrors.mestiere_id}</span>}
              </Field>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
              <Btn variant="ghost" onClick={() => setWalkinModal(false)}>Annulla</Btn>
              <Btn disabled={processing}>{processing ? 'Salvataggio…' : 'Aggiungi presente'}</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

const s = {
  page:           { maxWidth: '700px', margin: '0 auto' },
  eventSelector:  { marginBottom: '16px' },
  eventLabel:     { display: 'block', fontSize: '12px', fontWeight: '700', color: '#6B7280', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '6px' },
  eventSelect:    { fontSize: '15px', fontWeight: '600', height: '48px' },
  emptyHero:      { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' },
  // Contatore
  counterCard:    { backgroundColor: '#003DA5', borderRadius: '14px', padding: '20px 22px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '20px' },
  counterMain:    { display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '56px' },
  counterNum:     { fontSize: '44px', fontWeight: '900', color: '#FFFFFF', letterSpacing: '-.04em', lineHeight: 1 },
  counterLabel:   { fontSize: '11px', color: 'rgba(255,255,255,.6)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '.05em', marginTop: '3px' },
  pctBar:         { height: '8px', backgroundColor: '#E5E7EB', borderRadius: '4px', overflow: 'visible' },
  pctFill:        { height: '100%', background: 'linear-gradient(90deg,#003DA5,#1a56db)', borderRadius: '4px', transition: 'width .5s ease' },
  refreshBtn:     { background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: '8px', padding: '9px', cursor: 'pointer', color: '#FFFFFF', display: 'flex', alignItems: 'center', flexShrink: 0 },
  // Scanner
  scanCard:       { backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden', marginBottom: '12px' },
  scanPlaceholder:{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' },
  bigBtn:         { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#003DA5', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '15px', fontSize: '16px', fontWeight: '800', fontFamily: "'Inter',sans-serif", cursor: 'pointer', letterSpacing: '-.01em' },
  // Azioni
  actionsRow:     { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' },
  actionBtn:      { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', backgroundColor: '#EEF3FF', color: '#003DA5', border: '1px solid #C7D9F8', borderRadius: '10px', padding: '13px 8px', fontSize: '13px', fontWeight: '700', fontFamily: "'Inter',sans-serif", cursor: 'pointer' },
  // Presenti
  presentiSection:{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' },
  presentiHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 18px', borderBottom: '1px solid #E5E7EB' },
  presentiTitle:  { fontSize: '14px', fontWeight: '700', color: '#0A0A0A', letterSpacing: '-.01em', margin: 0 },
  presentiList:   { maxHeight: '360px', overflowY: 'auto' },
  presentiItem:   { display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 18px', borderBottom: '1px solid #F3F4F6' },
  pAvatar:        { width: '36px', height: '36px', borderRadius: '50%', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', flexShrink: 0 },
  pName:          { fontSize: '14px', fontWeight: '600', color: '#0A0A0A', margin: 0, letterSpacing: '-.01em' },
  pSub:           { fontSize: '12px', color: '#6B7280', margin: '1px 0 0' },
  pTime:          { fontSize: '12px', color: '#9CA3AF', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: '4px' },
  pEmpty:         { padding: '28px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px', margin: 0 },
}
