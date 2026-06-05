import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRole } from '../../hooks/useRole'
import { Modal, Btn, Select, Field, Input } from '../../components/ui'
import {
  QrCode, UserPlus, CheckCircle2, XCircle, AlertTriangle,
  RefreshCw, Search, Camera, CameraOff
} from 'lucide-react'

// Risultato check-in visivo
function ResultBanner({ result, onClose }) {
  if (!result) return null
  const isOk = result.ok
  const isDouble = result.error === 'gia_presente'
  const isNotFound = result.error === 'non_trovato'
  return (
    <div style={{
      ...s.banner,
      backgroundColor: isOk ? '#F0FDF4' : isDouble ? '#FFF7ED' : '#FEF2F2',
      borderColor: isOk ? '#86EFAC' : isDouble ? '#FCD34D' : '#FECACA',
    }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:'12px' }}>
        {isOk
          ? <CheckCircle2 size={28} style={{ color:'#16A34A', flexShrink:0 }}/>
          : isDouble
            ? <AlertTriangle size={28} style={{ color:'#D97706', flexShrink:0 }}/>
            : <XCircle size={28} style={{ color:'#DC2626', flexShrink:0 }}/>}
        <div style={{ flex:1 }}>
          <p style={{ fontWeight:'700', fontSize:'16px', color:'#0A0A0A', margin:'0 0 3px', letterSpacing:'-0.01em' }}>
            {isOk ? `✓ Check-in effettuato` : isDouble ? `⚠ Già registrato` : `✗ QR non trovato`}
          </p>
          {result.nome && <p style={{ fontSize:'14px', color:'#374151', margin:0 }}>{result.nome}</p>}
          {isDouble && result.checkin_at && (
            <p style={{ fontSize:'12px', color:'#D97706', margin:'4px 0 0' }}>
              Check-in già effettuato il {new Date(result.checkin_at).toLocaleString('it-IT')}
            </p>
          )}
          {isNotFound && <p style={{ fontSize:'13px', color:'#DC2626', margin:'4px 0 0' }}>Il codice QR non corrisponde a nessun iscritto.</p>}
        </div>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#6B7280', fontSize:'20px', lineHeight:1, padding:'2px' }}>×</button>
      </div>
    </div>
  )
}

export default function CheckinPage() {
  const [eventi, setEventi] = useState([])
  const [selectedEvento, setSelectedEvento] = useState('')
  const [scanning, setScanning] = useState(false)
  const [manualModal, setManualModal] = useState(false)
  const [walkinModal, setWalkinModal] = useState(false)
  const [result, setResult] = useState(null)
  const [manualQr, setManualQr] = useState('')
  const [walkin, setWalkin] = useState({ nome:'', cognome:'', email:'', cellulare:'', ragione_sociale:'' })
  const [presenti, setPresenti] = useState([])
  const [loadingPresenti, setLoadingPresenti] = useState(false)
  const [processing, setProcessing] = useState(false)
  const scannerRef = useRef(null)
  const html5QrRef = useRef(null)
  const { canWrite } = useRole()

  useEffect(() => {
    supabase.from('events').select('id,titolo,stato')
      .in('stato',['pubblicato','chiuso']).order('data_inizio',{ascending:false})
      .then(({data})=>setEventi(data||[]))
  }, [])

  useEffect(() => {
    if (selectedEvento) loadPresenti()
    return () => stopScanner()
  }, [selectedEvento])

  async function loadPresenti() {
    if (!selectedEvento) return
    setLoadingPresenti(true)
    const { data } = await supabase.from('registrations')
      .select('id,nome,cognome,ragione_sociale,checkin_at,stato')
      .eq('event_id', selectedEvento)
      .eq('presente', true)
      .order('checkin_at', { ascending: false })
      .limit(50)
    setPresenti(data || [])
    setLoadingPresenti(false)
  }

  async function doCheckin(qrCode) {
    if (!qrCode.trim()) return
    setProcessing(true)
    const { data, error } = await supabase.rpc('checkin_by_qr', { p_qr_code: qrCode.trim() })
    setResult(error ? { ok:false, error:'non_trovato' } : data)
    setProcessing(false)
    if (data?.ok) loadPresenti()
  }

  async function startScanner() {
    if (!selectedEvento) return
    setScanning(true)
    setResult(null)
    // Lazy load html5-qrcode
    const { Html5Qrcode } = await import('html5-qrcode')
    html5QrRef.current = new Html5Qrcode('qr-reader')
    try {
      await html5QrRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await stopScanner()
          await doCheckin(decodedText)
        },
        () => {}
      )
    } catch (err) {
      setScanning(false)
      setResult({ ok:false, error:'camera_error', nome: 'Impossibile accedere alla fotocamera.' })
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

  async function submitManual(e) {
    e.preventDefault()
    await doCheckin(manualQr)
    setManualQr('')
    setManualModal(false)
  }

  async function submitWalkin(e) {
    e.preventDefault()
    if (!walkin.nome.trim() || !walkin.cognome.trim()) return
    setProcessing(true)
    const { data, error } = await supabase.rpc('walkin_registrazione', {
      p_event_id: selectedEvento,
      p_nome: walkin.nome.trim(),
      p_cognome: walkin.cognome.trim(),
      p_email: walkin.email || null,
      p_cellulare: walkin.cellulare || null,
      p_ragione_sociale: walkin.ragione_sociale || null,
    })
    setProcessing(false)
    if (!error && data?.ok) {
      setResult({ ok:true, nome: `${walkin.nome} ${walkin.cognome}` })
      setWalkin({ nome:'', cognome:'', email:'', cellulare:'', ragione_sociale:'' })
      setWalkinModal(false)
      loadPresenti()
    }
  }

  const eventoSelezionato = eventi.find(e => e.id === selectedEvento)

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>App Check-in</h1>
          <p style={s.subtitle}>Scansiona QR Code o aggiungi partecipanti manualmente</p>
        </div>
      </div>

      {/* Selettore evento */}
      <div style={s.selectorCard}>
        <Field label="Evento in corso">
          <Select value={selectedEvento} onChange={e=>{ setSelectedEvento(e.target.value); setResult(null); stopScanner() }}>
            <option value="">— Seleziona l'evento —</option>
            {eventi.map(ev=><option key={ev.id} value={ev.id}>{ev.titolo}</option>)}
          </Select>
        </Field>
      </div>

      {selectedEvento && (
        <div style={s.mainGrid}>
          {/* COLONNA SINISTRA: Scanner + Azioni */}
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

            {/* Risultato banner */}
            <ResultBanner result={result} onClose={()=>setResult(null)}/>

            {/* Scanner */}
            <div style={s.scannerCard}>
              <div style={s.scannerHeader}>
                <QrCode size={20} style={{ color:'#003DA5' }}/>
                <h2 style={s.cardTitle}>Scanner QR Code</h2>
              </div>

              {/* Viewport fotocamera */}
              <div style={{ position:'relative' }}>
                <div id="qr-reader" ref={scannerRef}
                  style={{ width:'100%', minHeight: scanning ? '280px' : '0', overflow:'hidden', borderRadius:'6px' }}/>
                {!scanning && (
                  <div style={s.cameraPlaceholder}>
                    <Camera size={48} style={{ color:'#D1D5DB', marginBottom:'12px' }}/>
                    <p style={{ fontSize:'14px', color:'#6B7280', margin:0 }}>Avvia lo scanner per usare la fotocamera</p>
                  </div>
                )}
              </div>

              <div style={{ display:'flex', gap:'10px', marginTop:'16px' }}>
                {!scanning ? (
                  <Btn onClick={startScanner} style={{ flex:1 }}>
                    <Camera size={18}/> Avvia scanner
                  </Btn>
                ) : (
                  <Btn variant="danger" onClick={stopScanner} style={{ flex:1 }}>
                    <CameraOff size={18}/> Ferma scanner
                  </Btn>
                )}
              </div>
            </div>

            {/* Azioni manuali */}
            <div style={s.actionsCard}>
              <h2 style={{ ...s.cardTitle, marginBottom:'12px' }}>Azioni manuali</h2>
              <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
                <Btn variant="secondary" onClick={()=>setManualModal(true)} style={{ flex:1 }}>
                  <Search size={16}/> Inserisci codice QR
                </Btn>
                {canWrite && (
                  <Btn variant="ghost" onClick={()=>setWalkinModal(true)} style={{ flex:1 }}>
                    <UserPlus size={16}/> Aggiungi walk-in
                  </Btn>
                )}
              </div>
            </div>
          </div>

          {/* COLONNA DESTRA: Lista presenti */}
          <div style={s.presentiCard}>
            <div style={s.presentiHeader}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <CheckCircle2 size={18} style={{ color:'#16A34A' }}/>
                <h2 style={s.cardTitle}>Presenti</h2>
                <span style={s.countBadge}>{presenti.length}</span>
              </div>
              <button onClick={loadPresenti} style={s.refreshBtn} title="Aggiorna">
                <RefreshCw size={15}/>
              </button>
            </div>

            <div style={s.presentiList}>
              {loadingPresenti ? (
                <p style={{ fontSize:'13px', color:'#9CA3AF', padding:'20px', textAlign:'center' }}>Caricamento…</p>
              ) : presenti.length === 0 ? (
                <p style={{ fontSize:'13px', color:'#9CA3AF', padding:'24px', textAlign:'center' }}>Nessun check-in ancora</p>
              ) : presenti.map(p=>(
                <div key={p.id} style={s.presentiItem}>
                  <div style={s.presentiAvatar}>
                    {(p.nome||'?').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={s.presentiName}>{p.nome} {p.cognome}</p>
                    {p.ragione_sociale && <p style={s.presentiSub}>{p.ragione_sociale}</p>}
                    <p style={s.presentiTime}>
                      {p.stato === 'walk-in' && <span style={{ color:'#7C3AED', fontWeight:'600' }}>Walk-in · </span>}
                      {p.checkin_at ? new Date(p.checkin_at).toLocaleTimeString('it-IT', {hour:'2-digit',minute:'2-digit'}) : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!selectedEvento && (
        <div style={s.emptyHero}>
          <QrCode size={56} style={{ color:'#D1D5DB', marginBottom:'16px' }}/>
          <p style={{ fontSize:'20px', fontWeight:'700', color:'#0A0A0A', margin:'0 0 8px', letterSpacing:'-0.02em' }}>Seleziona un evento</p>
          <p style={{ fontSize:'14px', color:'#6B7280', margin:0 }}>Scegli l'evento in corso per iniziare il check-in</p>
        </div>
      )}

      {/* MODAL: Inserimento manuale QR */}
      {manualModal && (
        <Modal title="Inserimento codice QR manuale" onClose={()=>setManualModal(false)} width="400px">
          <form onSubmit={submitManual} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            <Field label="Codice QR">
              <Input value={manualQr} onChange={e=>setManualQr(e.target.value)}
                placeholder="es. QR-2026-001" autoFocus/>
            </Field>
            <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
              <Btn variant="ghost" onClick={()=>setManualModal(false)}>Annulla</Btn>
              <Btn disabled={processing || !manualQr.trim()}>
                {processing ? 'Verifica…' : 'Esegui check-in'}
              </Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: Walk-in */}
      {walkinModal && (
        <Modal title="Aggiungi partecipante walk-in" onClose={()=>setWalkinModal(false)} width="480px">
          <form onSubmit={submitWalkin} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <p style={{ fontSize:'13px', color:'#6B7280', margin:0 }}>
              Inserisce il partecipante direttamente tra i presenti con stato <strong>walk-in</strong>.
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
              <Field label="Nome" required>
                <Input value={walkin.nome} onChange={e=>setWalkin(p=>({...p,nome:e.target.value}))} placeholder="Mario"/>
              </Field>
              <Field label="Cognome" required>
                <Input value={walkin.cognome} onChange={e=>setWalkin(p=>({...p,cognome:e.target.value}))} placeholder="Rossi"/>
              </Field>
              <div style={{ gridColumn:'1/-1' }}>
                <Field label="Email">
                  <Input type="email" value={walkin.email} onChange={e=>setWalkin(p=>({...p,email:e.target.value}))} placeholder="mario@example.it"/>
                </Field>
              </div>
              <Field label="Cellulare">
                <Input value={walkin.cellulare} onChange={e=>setWalkin(p=>({...p,cellulare:e.target.value}))} placeholder="333 1234567"/>
              </Field>
              <Field label="Azienda">
                <Input value={walkin.ragione_sociale} onChange={e=>setWalkin(p=>({...p,ragione_sociale:e.target.value}))} placeholder="Rossi Srl"/>
              </Field>
            </div>
            <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end', marginTop:'4px' }}>
              <Btn variant="ghost" onClick={()=>setWalkinModal(false)}>Annulla</Btn>
              <Btn disabled={processing || !walkin.nome.trim() || !walkin.cognome.trim()}>
                {processing ? 'Salvataggio…' : 'Aggiungi e segna presente'}
              </Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

const s = {
  page: { maxWidth:'1100px' },
  header: { marginBottom:'24px' },
  title: { fontSize:'32px', fontWeight:'900', color:'#0A0A0A', letterSpacing:'-0.03em', margin:0 },
  subtitle: { fontSize:'14px', color:'#6B7280', margin:'4px 0 0', fontWeight:'500' },
  selectorCard: { backgroundColor:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:'6px', padding:'20px', marginBottom:'20px', maxWidth:'420px' },
  mainGrid: { display:'grid', gridTemplateColumns:'1fr 360px', gap:'20px', alignItems:'start' },
  scannerCard: { backgroundColor:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:'6px', padding:'20px' },
  scannerHeader: { display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px' },
  actionsCard: { backgroundColor:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:'6px', padding:'20px' },
  cameraPlaceholder: { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
    backgroundColor:'#F4F5F7', borderRadius:'6px', padding:'40px 24px', minHeight:'160px' },
  presentiCard: { backgroundColor:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:'6px', overflow:'hidden', maxHeight:'70vh', display:'flex', flexDirection:'column' },
  presentiHeader: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid #E5E7EB', flexShrink:0 },
  presentiList: { overflowY:'auto', flex:1 },
  presentiItem: { display:'flex', alignItems:'center', gap:'12px', padding:'12px 20px', borderBottom:'1px solid #F3F4F6' },
  presentiAvatar: { width:'36px', height:'36px', borderRadius:'50%', backgroundColor:'#16A34A', color:'#FFF',
    display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'700', flexShrink:0 },
  presentiName: { fontSize:'14px', fontWeight:'600', color:'#0A0A0A', margin:0, letterSpacing:'-0.01em' },
  presentiSub: { fontSize:'12px', color:'#6B7280', margin:'1px 0 0' },
  presentiTime: { fontSize:'12px', color:'#9CA3AF', margin:'2px 0 0' },
  cardTitle: { fontSize:'15px', fontWeight:'700', color:'#0A0A0A', letterSpacing:'-0.01em', margin:0 },
  countBadge: { backgroundColor:'#DCFCE7', color:'#16A34A', fontSize:'12px', fontWeight:'700', padding:'2px 8px', borderRadius:'20px' },
  refreshBtn: { background:'none', border:'1px solid #E5E7EB', borderRadius:'4px', padding:'5px', cursor:'pointer', color:'#6B7280', display:'flex', alignItems:'center' },
  banner: { border:'1px solid', borderRadius:'8px', padding:'16px 20px', marginBottom:'4px' },
  emptyHero: { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 32px', textAlign:'center' },
}
