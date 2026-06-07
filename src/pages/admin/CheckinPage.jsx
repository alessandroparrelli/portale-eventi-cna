import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRole } from '../../hooks/useRole'
import { Modal, Btn, Select, Field, Input } from '../../components/ui'
import { QrCode, UserPlus, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Search, Camera, CameraOff, Users } from 'lucide-react'

/* ─── Banner risultato ─────────────────────────────────────────── */
function ResultBanner({ result, onClose }) {
  if (!result) return null
  const ok      = result.ok
  const double  = result.error === 'gia_presente'
  const notFound= result.error === 'non_trovato'
  const colors  = ok ? { bg:'#F0FDF4', border:'#86EFAC', icon:'#16A34A' }
                : double ? { bg:'#FFF7ED', border:'#FCD34D', icon:'#D97706' }
                : { bg:'#FEF2F2', border:'#FECACA', icon:'#DC2626' }
  return (
    <div style={{ backgroundColor:colors.bg, border:`2px solid ${colors.border}`, borderRadius:'12px', padding:'16px 20px', marginBottom:'16px' }}>
      <div style={{ display:'flex', gap:'12px', alignItems:'flex-start' }}>
        {ok       ? <CheckCircle2 size={28} style={{ color:colors.icon, flexShrink:0 }}/>
          : double  ? <AlertTriangle size={28} style={{ color:colors.icon, flexShrink:0 }}/>
          : <XCircle size={28} style={{ color:colors.icon, flexShrink:0 }}/>}
        <div style={{ flex:1 }}>
          <p style={{ fontWeight:'800', fontSize:'17px', color:'#0A0A0A', margin:'0 0 3px', letterSpacing:'-.02em' }}>
            {ok ? '✓ Check-in effettuato!' : double ? '⚠ Già registrato' : '✗ QR non trovato'}
          </p>
          {result.nome && <p style={{ fontSize:'15px', color:'#374151', margin:0 }}>{result.nome}</p>}
          {double && result.checkin_at && (
            <p style={{ fontSize:'12px', color:'#D97706', margin:'4px 0 0' }}>
              Check-in già effettuato il {new Date(result.checkin_at).toLocaleString('it-IT')}
            </p>
          )}
          {notFound && <p style={{ fontSize:'13px', color:'#DC2626', margin:'4px 0 0' }}>Codice QR non trovato.</p>}
        </div>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', fontSize:'22px', lineHeight:1, padding:'0 4px' }}>×</button>
      </div>
    </div>
  )
}

/* ─── PAGINA CHECKIN ──────────────────────────────────────────── */
export default function CheckinPage() {
  const [eventi,        setEventi]        = useState([])
  const [selectedEvento,setSelectedEvento]= useState('')
  const [scanning,      setScanning]      = useState(false)
  const [manualModal,   setManualModal]   = useState(false)
  const [walkinModal,   setWalkinModal]   = useState(false)
  const [listaModal,    setListaModal]    = useState(false)
  const [result,        setResult]        = useState(null)
  const [manualQr,      setManualQr]      = useState('')
  const [walkin,        setWalkin]        = useState({ nome:'', cognome:'', email:'', cellulare:'', ragione_sociale:'' })
  const [presenti,      setPresenti]      = useState([])
  const [totali,        setTotali]        = useState(0)
  const [loadingP,      setLoadingP]      = useState(false)
  const [processing,    setProcessing]    = useState(false)
  // Lista iscritti per spunta manuale
  const [iscritti,      setIscritti]      = useState([])
  const [searchLista,   setSearchLista]   = useState('')
  const [loadingLista,  setLoadingLista]  = useState(false)
  const [checkingId,    setCheckingId]    = useState(null)
  const html5QrRef = useRef(null)
  const { canWrite } = useRole()

  useEffect(() => {
    supabase.from('events').select('id,titolo,stato')
      .eq('stato','pubblicato').order('data_inizio',{ascending:false})
      .then(({data})=>setEventi(data||[]))
  }, [])

  useEffect(() => {
    if (selectedEvento) loadPresenti()
    return () => stopScanner()
  }, [selectedEvento])

  async function loadPresenti() {
    if (!selectedEvento) return
    setLoadingP(true)
    const [{ data }, { count }] = await Promise.all([
      supabase.from('registrations').select('id,nome,cognome,ragione_sociale,checkin_at,stato')
        .eq('event_id',selectedEvento).eq('presente',true).order('checkin_at',{ascending:false}).limit(100),
      supabase.from('registrations').select('id',{count:'exact'}).eq('event_id',selectedEvento),
    ])
    setPresenti(data||[]); setTotali(count||0); setLoadingP(false)
  }

  async function loadIscritti() {
    if (!selectedEvento) return
    setLoadingLista(true)
    const { data } = await supabase.from('registrations')
      .select('id,nome,cognome,ragione_sociale,email,presente,checkin_at,stato')
      .eq('event_id', selectedEvento)
      .order('cognome', { ascending:true })
    setIscritti(data || [])
    setLoadingLista(false)
  }

  async function checkinManuale(reg) {
    if (reg.presente) return // già presente
    setCheckingId(reg.id)
    const { error } = await supabase.from('registrations')
      .update({ presente:true, stato:'presente', checkin_at: new Date().toISOString() })
      .eq('id', reg.id)
    if (!error) {
      setIscritti(prev => prev.map(r => r.id === reg.id
        ? { ...r, presente:true, stato:'presente', checkin_at:new Date().toISOString() }
        : r
      ))
      setResult({ ok:true, nome:`${reg.nome} ${reg.cognome}` })
      loadPresenti()
    }
    setCheckingId(null)
  }

  async function annullaCheckin(reg) {
    setCheckingId(reg.id)
    const { error } = await supabase.from('registrations')
      .update({ presente:false, stato:'confermato', checkin_at:null })
      .eq('id', reg.id)
    if (!error) {
      setIscritti(prev => prev.map(r => r.id === reg.id
        ? { ...r, presente:false, stato:'confermato', checkin_at:null }
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
    setResult(error ? { ok:false, error:'non_trovato' } : data)
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
        { facingMode:'environment' },
        { fps:10, qrbox: window.innerWidth < 600 ? 220 : 280 },
        async decoded => { await stopScanner(); await doCheckin(decoded) },
        () => {}
      )
    } catch {
      setScanning(false)
      setResult({ ok:false, error:'non_trovato', nome:'Impossibile accedere alla fotocamera.' })
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
    if (!walkin.nome.trim()||!walkin.cognome.trim()) return
    setProcessing(true)
    const { data, error } = await supabase.rpc('walkin_registrazione', {
      p_event_id:       selectedEvento,
      p_nome:           walkin.nome.trim(),
      p_cognome:        walkin.cognome.trim(),
      p_email:          walkin.email||null,
      p_cellulare:      walkin.cellulare||null,
      p_ragione_sociale:walkin.ragione_sociale||null,
      p_partita_iva:    walkin.partita_iva||null,
    })
    setProcessing(false)
    if (!error && data?.ok) {
      setResult({ ok:true, nome:`${walkin.nome} ${walkin.cognome}` })
      setWalkin({ nome:'', cognome:'', email:'', cellulare:'', ragione_sociale:'', partita_iva:'' })
      setWalkinModal(false); loadPresenti()
    }
  }

  const pct = totali > 0 ? Math.round((presenti.length/totali)*100) : 0

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>App Check-in</h1>
          <p style={s.sub}>Scansione QR e gestione presenze</p>
        </div>
      </div>

      {/* Selettore evento */}
      <div style={s.eventSelector}>
        <Field label="Evento in corso">
          <Select value={selectedEvento} onChange={e=>{ setSelectedEvento(e.target.value); setResult(null); stopScanner() }}>
            <option value="">— Seleziona l'evento —</option>
            {eventi.map(ev=><option key={ev.id} value={ev.id}>{ev.titolo}</option>)}
          </Select>
        </Field>
      </div>

      {!selectedEvento && (
        <div style={s.emptyHero}>
          <QrCode size={60} style={{ color:'#D1D5DB', marginBottom:'16px' }}/>
          <p style={{ fontSize:'20px', fontWeight:'800', color:'#0A0A0A', margin:'0 0 8px', letterSpacing:'-.02em' }}>
            Seleziona un evento
          </p>
          <p style={{ fontSize:'14px', color:'#6B7280', margin:0 }}>
            Scegli l'evento per avviare il check-in
          </p>
        </div>
      )}

      {selectedEvento && (
        <>
          {/* Contatore presenze — visibilissimo su mobile */}
          <div style={s.counterCard}>
            <div style={s.counterMain}>
              <span style={s.counterNum}>{presenti.length}</span>
              <span style={s.counterLabel}>presenti</span>
            </div>
            <div style={s.counterRight}>
              <span style={s.counterSub}>{totali} iscritti totali</span>
              <div style={s.pctBar}>
                <div style={{ ...s.pctFill, width:`${pct}%` }}/>
              </div>
              <span style={{ fontSize:'12px', color:'#6B7280' }}>{pct}% di presenza</span>
            </div>
            <button onClick={loadPresenti} style={s.refreshBtn} title="Aggiorna">
              <RefreshCw size={16}/>
            </button>
          </div>

          {/* Risultato scan */}
          <ResultBanner result={result} onClose={()=>setResult(null)}/>

          {/* Scanner — area grande su mobile */}
          <div style={s.scanCard}>
            <div id="qr-viewport" style={{
              width:'100%', overflow:'hidden', borderRadius:'8px',
              minHeight: scanning ? '300px' : '0',
              backgroundColor: scanning ? '#000' : 'transparent',
            }}/>
            {!scanning && (
              <div style={s.scanPlaceholder}>
                <Camera size={52} style={{ color:'#D1D5DB', marginBottom:'12px' }}/>
                <p style={{ fontSize:'15px', color:'#6B7280', margin:0 }}>Avvia lo scanner per il QR Code</p>
              </div>
            )}
            <div style={s.scanActions}>
              {!scanning ? (
                <button onClick={startScanner} style={s.bigBtn}>
                  <Camera size={22}/> Avvia scanner
                </button>
              ) : (
                <button onClick={stopScanner} style={{ ...s.bigBtn, backgroundColor:'#DC2626' }}>
                  <CameraOff size={22}/> Ferma scanner
                </button>
              )}
            </div>
          </div>

          {/* Azioni rapide */}
          <div style={s.actionsRow}>
            <button onClick={()=>setManualModal(true)} style={s.actionBtn}>
              <Search size={18}/> Codice manuale
            </button>
            {canWrite && (
              <button onClick={()=>{ loadIscritti(); setListaModal(true) }}
                style={{ ...s.actionBtn, backgroundColor:'#F0FDF4', color:'#16A34A', borderColor:'#86EFAC' }}>
                <Users size={18}/> Lista iscritti
              </button>
            )}
            {canWrite && (
              <button onClick={()=>setWalkinModal(true)} style={{ ...s.actionBtn, backgroundColor:'#F3E8FF', color:'#7C3AED', borderColor:'#E9D5FF' }}>
                <UserPlus size={18}/> Walk-in
              </button>
            )}
          </div>

          {/* Lista presenti scrollabile */}
          <div style={s.presentiSection}>
            <div style={s.presentiHeader}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <Users size={16} style={{ color:'#16A34A' }}/>
                <h3 style={s.presentiTitle}>Ultimi check-in</h3>
              </div>
            </div>
            <div style={s.presentiList}>
              {loadingP ? (
                <p style={s.pEmpty}>Caricamento…</p>
              ) : presenti.length === 0 ? (
                <p style={s.pEmpty}>Nessun check-in ancora</p>
              ) : presenti.map(p=>(
                <div key={p.id} style={s.presentiItem}>
                  <div style={{ ...s.pAvatar, backgroundColor: p.stato==='walk-in'?'#7C3AED':'#16A34A' }}>
                    {(p.nome||'?').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={s.pName}>{p.nome} {p.cognome}</p>
                    {p.ragione_sociale && <p style={s.pSub}>{p.ragione_sociale}</p>}
                    <p style={s.pTime}>
                      {p.stato==='walk-in' && <span style={{ color:'#7C3AED', fontWeight:'600' }}>Walk-in · </span>}
                      {p.checkin_at ? new Date(p.checkin_at).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'}) : ''}
                    </p>
                  </div>
                  <CheckCircle2 size={16} style={{ color:'#16A34A', flexShrink:0 }}/>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Modal QR manuale */}
      {manualModal && (
        <Modal title="Inserisci codice QR" onClose={()=>setManualModal(false)} width="380px">
          <form onSubmit={e=>{e.preventDefault();doCheckin(manualQr);setManualQr('');setManualModal(false)}}
            style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            <Field label="Codice QR">
              <Input value={manualQr} onChange={e=>setManualQr(e.target.value)}
                placeholder="es. QR-2026-001" autoFocus/>
            </Field>
            <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
              <Btn variant="ghost" onClick={()=>setManualModal(false)}>Annulla</Btn>
              <Btn disabled={processing||!manualQr.trim()}>{processing?'Verifica…':'Check-in'}</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Lista iscritti — spunta manuale */}
      {listaModal && (
        <Modal title="Lista iscritti — spunta manuale" onClose={()=>setListaModal(false)} width="560px">
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <p style={{ fontSize:'13px', color:'#6B7280', margin:0 }}>
              Tocca il nome per effettuare il check-in. Tocca di nuovo per annullarlo.
            </p>

            {/* Barra ricerca */}
            <div style={{ position:'relative' }}>
              <Search size={16} style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }}/>
              <input
                value={searchLista}
                onChange={e => setSearchLista(e.target.value)}
                placeholder="Cerca per nome o cognome…"
                autoFocus
                style={{ width:'100%', padding:'10px 12px 10px 36px', border:'1px solid #D1D5DB', borderRadius:'8px', fontSize:'14px', fontFamily:"'Inter',sans-serif", outline:'none', boxSizing:'border-box' }}
              />
            </div>

            {/* Contatori */}
            <div style={{ display:'flex', gap:'12px' }}>
              {[
                { label:'Totale', val:iscritti.length, col:'#6B7280', bg:'#F9FAFB' },
                { label:'Presenti', val:iscritti.filter(r=>r.presente).length, col:'#16A34A', bg:'#F0FDF4' },
                { label:'Assenti', val:iscritti.filter(r=>!r.presente).length, col:'#D97706', bg:'#FFFBEB' },
              ].map(({ label, val, col, bg }) => (
                <div key={label} style={{ flex:1, backgroundColor:bg, borderRadius:'8px', padding:'10px', textAlign:'center' }}>
                  <p style={{ fontSize:'22px', fontWeight:'900', color:col, margin:0, letterSpacing:'-.03em' }}>{val}</p>
                  <p style={{ fontSize:'11px', color:'#6B7280', margin:'2px 0 0', fontWeight:'600', textTransform:'uppercase', letterSpacing:'.04em' }}>{label}</p>
                </div>
              ))}
            </div>

            {/* Lista */}
            {loadingLista ? (
              <p style={{ textAlign:'center', color:'#9CA3AF', padding:'24px 0' }}>Caricamento…</p>
            ) : (
              <div style={{ maxHeight:'420px', overflowY:'auto', border:'1px solid #E5E7EB', borderRadius:'8px', overflow:'hidden' }}>
                {iscritti
                  .filter(r => {
                    if (!searchLista.trim()) return true
                    const q = searchLista.toLowerCase()
                    return (r.nome||'').toLowerCase().includes(q) ||
                           (r.cognome||'').toLowerCase().includes(q) ||
                           (r.ragione_sociale||'').toLowerCase().includes(q)
                  })
                  .map((r, i, arr) => {
                    const isLast = i === arr.length - 1
                    const isChecking = checkingId === r.id
                    return (
                      <div key={r.id}
                        onClick={() => !isChecking && (r.presente ? annullaCheckin(r) : checkinManuale(r))}
                        style={{
                          display:'flex', alignItems:'center', gap:'12px',
                          padding:'13px 16px',
                          borderBottom: isLast ? 'none' : '1px solid #F3F4F6',
                          cursor: isChecking ? 'wait' : 'pointer',
                          backgroundColor: r.presente ? '#F0FDF4' : '#FFFFFF',
                          transition:'background-color .15s',
                        }}
                        onMouseEnter={e => { if (!r.presente) e.currentTarget.style.backgroundColor='#F9FAFB' }}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = r.presente ? '#F0FDF4' : '#FFFFFF'}
                      >
                        {/* Checkbox visuale */}
                        <div style={{
                          width:'28px', height:'28px', borderRadius:'50%', flexShrink:0,
                          border: r.presente ? 'none' : '2px solid #D1D5DB',
                          backgroundColor: r.presente ? '#16A34A' : '#FFFFFF',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          transition:'all .15s',
                        }}>
                          {isChecking
                            ? <div style={{ width:'14px', height:'14px', border:'2px solid #FFF', borderTopColor:'transparent', borderRadius:'50%', animation:'spin .6s linear infinite' }}/>
                            : r.presente && <CheckCircle2 size={18} style={{ color:'#FFFFFF' }}/>
                          }
                        </div>

                        {/* Info iscritto */}
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ fontSize:'15px', fontWeight:'700', color:'#0A0A0A', margin:0, letterSpacing:'-.01em' }}>
                            {r.cognome} {r.nome}
                          </p>
                          {r.ragione_sociale && (
                            <p style={{ fontSize:'12px', color:'#6B7280', margin:'1px 0 0' }}>{r.ragione_sociale}</p>
                          )}
                        </div>

                        {/* Stato / orario */}
                        <div style={{ textAlign:'right', flexShrink:0 }}>
                          {r.presente ? (
                            <>
                              <span style={{ fontSize:'11px', fontWeight:'700', color:'#16A34A', display:'block' }}>
                                {r.stato === 'walk-in' ? 'Walk-in' : 'Presente'}
                              </span>
                              {r.checkin_at && (
                                <span style={{ fontSize:'11px', color:'#9CA3AF' }}>
                                  {new Date(r.checkin_at).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})}
                                </span>
                              )}
                            </>
                          ) : (
                            <span style={{ fontSize:'11px', color:'#9CA3AF', fontWeight:'500' }}>Tocca per ✓</span>
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
      {walkinModal && (
        <Modal title="Aggiungi walk-in" onClose={()=>setWalkinModal(false)} width="460px">
          <form onSubmit={submitWalkin} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <p style={{ fontSize:'13px', color:'#6B7280', margin:0 }}>
              Aggiunge il partecipante direttamente tra i presenti con stato <strong>walk-in</strong>.
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
              <Field label="Nome" required><Input value={walkin.nome} onChange={e=>setWalkin(p=>({...p,nome:e.target.value}))} placeholder="Mario"/></Field>
              <Field label="Cognome" required><Input value={walkin.cognome} onChange={e=>setWalkin(p=>({...p,cognome:e.target.value}))} placeholder="Rossi"/></Field>
              <div style={{ gridColumn:'1/-1' }}>
                <Field label="Email"><Input type="email" value={walkin.email} onChange={e=>setWalkin(p=>({...p,email:e.target.value}))} placeholder="mario@example.it"/></Field>
              </div>
              <Field label="Cellulare"><Input value={walkin.cellulare} onChange={e=>setWalkin(p=>({...p,cellulare:e.target.value}))} placeholder="333 1234567"/></Field>
              <Field label="Azienda"><Input value={walkin.ragione_sociale} onChange={e=>setWalkin(p=>({...p,ragione_sociale:e.target.value}))} placeholder="Rossi Srl"/></Field>
              <div style={{ gridColumn:'1/-1' }}>
                <Field label="Partita IVA"><Input value={walkin.partita_iva} onChange={e=>setWalkin(p=>({...p,partita_iva:e.target.value}))} placeholder="12345670015"/></Field>
              </div>
            </div>
            <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end', marginTop:'4px' }}>
              <Btn variant="ghost" onClick={()=>setWalkinModal(false)}>Annulla</Btn>
              <Btn disabled={processing||!walkin.nome.trim()||!walkin.cognome.trim()}>
                {processing?'Salvataggio…':'Aggiungi presente'}
              </Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

const s = {
  page:           { maxWidth:'700px', margin:'0 auto' }, // centrato per uso tablet/phone
  header:         { marginBottom:'20px' },
  title:          { fontSize:'28px', fontWeight:'900', color:'#0A0A0A', letterSpacing:'-.03em', margin:0 },
  sub:            { fontSize:'14px', color:'#6B7280', margin:'4px 0 0', fontWeight:'500' },
  eventSelector:  { backgroundColor:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:'10px', padding:'16px 20px', marginBottom:'20px' },
  emptyHero:      { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 24px', textAlign:'center' },
  // Contatore presenze
  counterCard:    { backgroundColor:'#003DA5', borderRadius:'12px', padding:'20px 24px', marginBottom:'16px', display:'flex', alignItems:'center', gap:'20px' },
  counterMain:    { display:'flex', flexDirection:'column', alignItems:'center', minWidth:'70px' },
  counterNum:     { fontSize:'48px', fontWeight:'900', color:'#FFFFFF', letterSpacing:'-.04em', lineHeight:1 },
  counterLabel:   { fontSize:'13px', color:'rgba(255,255,255,.7)', fontWeight:'500', marginTop:'2px' },
  counterRight:   { flex:1, display:'flex', flexDirection:'column', gap:'4px' },
  counterSub:     { fontSize:'13px', color:'rgba(255,255,255,.8)', fontWeight:'500' },
  pctBar:         { height:'6px', backgroundColor:'rgba(255,255,255,.2)', borderRadius:'3px', overflow:'hidden' },
  pctFill:        { height:'100%', backgroundColor:'#FFFFFF', borderRadius:'3px', transition:'width .4s' },
  refreshBtn:     { background:'rgba(255,255,255,.15)', border:'none', borderRadius:'8px', padding:'8px', cursor:'pointer', color:'#FFFFFF', display:'flex', alignItems:'center' },
  // Scanner
  scanCard:       { backgroundColor:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:'12px', overflow:'hidden', marginBottom:'12px' },
  scanPlaceholder:{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px', minHeight:'160px' },
  scanActions:    { padding:'16px' },
  bigBtn:         { width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', backgroundColor:'#003DA5', color:'#FFFFFF', border:'none', borderRadius:'8px', padding:'16px', fontSize:'16px', fontWeight:'800', fontFamily:"'Inter',sans-serif", cursor:'pointer', letterSpacing:'-.01em' },
  actionsRow:     { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', marginBottom:'20px' },
  actionBtn:      { display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', backgroundColor:'#EEF3FF', color:'#003DA5', border:'1px solid #C7D9F8', borderRadius:'10px', padding:'14px', fontSize:'14px', fontWeight:'700', fontFamily:"'Inter',sans-serif", cursor:'pointer' },
  // Presenti
  presentiSection:{ backgroundColor:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:'12px', overflow:'hidden' },
  presentiHeader: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderBottom:'1px solid #E5E7EB' },
  presentiTitle:  { fontSize:'15px', fontWeight:'700', color:'#0A0A0A', letterSpacing:'-.01em', margin:0 },
  presentiList:   { maxHeight:'320px', overflowY:'auto' },
  presentiItem:   { display:'flex', alignItems:'center', gap:'12px', padding:'12px 20px', borderBottom:'1px solid #F3F4F6' },
  pAvatar:        { width:'38px', height:'38px', borderRadius:'50%', color:'#FFF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px', fontWeight:'700', flexShrink:0 },
  pName:          { fontSize:'14px', fontWeight:'600', color:'#0A0A0A', margin:0, letterSpacing:'-.01em' },
  pSub:           { fontSize:'12px', color:'#6B7280', margin:'1px 0 0' },
  pTime:          { fontSize:'12px', color:'#9CA3AF', margin:'2px 0 0' },
  pEmpty:         { padding:'32px', textAlign:'center', color:'#9CA3AF', fontSize:'14px', margin:0 },
}
