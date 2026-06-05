import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Star, CheckCircle2, Loader2 } from 'lucide-react'

export default function QuestionarioPage() {
  const [params] = useSearchParams()
  const qr = params.get('qr')
  const [reg, setReg] = useState(null)
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [alreadyDone, setAlreadyDone] = useState(false)
  const [stars, setStars] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [commento, setCommento] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!qr) { setNotFound(true); setLoading(false); return }
    ;(async () => {
      const { data: regData } = await supabase.from('registrations')
        .select('*, events(titolo,data_inizio,luogo)').eq('qr_code', qr).single()
      if (!regData) { setNotFound(true); setLoading(false); return }
      // Check se ha già risposto
      const { data: existing } = await supabase.from('survey_answers')
        .select('id').eq('registration_id', regData.id).single()
      if (existing) { setAlreadyDone(true); setLoading(false); return }
      setReg(regData)
      setEvent(regData.events)
      setLoading(false)
    })()
  }, [qr])

  async function submit(e) {
    e.preventDefault()
    if (stars === 0) return
    setSubmitting(true)
    await supabase.from('survey_answers').insert({
      registration_id: reg.id,
      valutazione: stars,
      commento: commento.trim() || null,
    })
    setSubmitting(false)
    setDone(true)
  }

  if (loading) return (
    <div style={s.center}>
      <Loader2 size={32} style={{ color:'#003DA5', animation:'spin 1s linear infinite', marginBottom:'12px' }}/>
      <p style={{ color:'#6B7280', fontSize:'14px' }}>Caricamento…</p>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (notFound) return (
    <div style={s.center}>
      <img src="https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png" alt="CNA Roma" style={{ height:'48px', marginBottom:'24px' }}/>
      <p style={{ fontSize:'18px', fontWeight:'700', color:'#0A0A0A' }}>Link non valido</p>
      <p style={{ fontSize:'14px', color:'#6B7280' }}>Il link del questionario non è valido o è scaduto.</p>
    </div>
  )

  if (alreadyDone) return (
    <div style={s.center}>
      <img src="https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png" alt="CNA Roma" style={{ height:'48px', marginBottom:'24px' }}/>
      <CheckCircle2 size={48} style={{ color:'#16A34A', marginBottom:'12px' }}/>
      <p style={{ fontSize:'18px', fontWeight:'700', color:'#0A0A0A' }}>Questionario già compilato</p>
      <p style={{ fontSize:'14px', color:'#6B7280' }}>Hai già inviato la tua valutazione. Grazie!</p>
    </div>
  )

  if (done) return (
    <div style={s.center}>
      <img src="https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png" alt="CNA Roma" style={{ height:'48px', marginBottom:'24px' }}/>
      <CheckCircle2 size={48} style={{ color:'#16A34A', marginBottom:'16px' }}/>
      <p style={{ fontSize:'22px', fontWeight:'900', color:'#0A0A0A', letterSpacing:'-0.03em', margin:'0 0 8px' }}>Grazie per il tuo feedback!</p>
      <p style={{ fontSize:'14px', color:'#6B7280', maxWidth:'340px', textAlign:'center', lineHeight:'1.6' }}>
        La tua valutazione ci aiuta a migliorare i nostri eventi. A presto con CNA Roma!
      </p>
    </div>
  )

  return (
    <div style={s.page}>
      <header style={s.header}>
        <img src="https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png" alt="CNA Roma" style={{ height:'48px' }}/>
      </header>

      <div style={s.card}>
        <h1 style={s.title}>Come è andato l'evento?</h1>
        {event && (
          <p style={s.eventName}>{event.titolo}</p>
        )}
        <p style={s.greeting}>Ciao <strong>{reg?.nome}</strong>, quanto sei soddisfatto/a?</p>

        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:'24px' }}>
          {/* Stelle */}
          <div>
            <p style={s.fieldLabel}>Valutazione complessiva <span style={{ color:'#DC2626' }}>*</span></p>
            <div style={{ display:'flex', gap:'8px', justifyContent:'center', margin:'12px 0' }}>
              {[1,2,3,4,5].map(n=>(
                <button key={n} type="button"
                  onClick={()=>setStars(n)}
                  onMouseEnter={()=>setHovered(n)}
                  onMouseLeave={()=>setHovered(0)}
                  style={{ background:'none', border:'none', cursor:'pointer', padding:'4px', transition:'transform 0.1s',
                    transform: (hovered||stars) >= n ? 'scale(1.15)' : 'scale(1)' }}>
                  <Star size={40}
                    fill={(hovered||stars) >= n ? '#F59E0B' : 'none'}
                    style={{ color:(hovered||stars) >= n ? '#F59E0B' : '#D1D5DB', transition:'color 0.1s' }}/>
                </button>
              ))}
            </div>
            {stars > 0 && (
              <p style={{ textAlign:'center', fontSize:'14px', color:'#6B7280', margin:0 }}>
                {['','Scarso','Sufficiente','Buono','Ottimo','Eccellente'][stars]}
              </p>
            )}
          </div>

          {/* Commento */}
          <div>
            <p style={s.fieldLabel}>Commento libero (facoltativo)</p>
            <textarea value={commento} onChange={e=>setCommento(e.target.value)}
              placeholder="Cosa hai apprezzato di più? Cosa miglioreresti?"
              rows={4}
              style={{ width:'100%', padding:'12px', border:'1px solid #D1D5DB', borderRadius:'6px',
                fontSize:'14px', fontFamily:"'Inter',sans-serif", outline:'none', resize:'vertical', boxSizing:'border-box' }}
              onFocus={e=>(e.target.style.borderColor='#003DA5')}
              onBlur={e=>(e.target.style.borderColor='#D1D5DB')}/>
          </div>

          <button type="submit" disabled={stars===0||submitting}
            style={{ ...s.submitBtn, opacity: stars===0||submitting ? 0.6 : 1 }}>
            {submitting ? <><Loader2 size={18} style={{ animation:'spin 1s linear infinite' }}/> Invio…</> : 'Invia valutazione'}
          </button>
        </form>

        <p style={{ fontSize:'12px', color:'#9CA3AF', textAlign:'center', margin:'16px 0 0' }}>
          La tua risposta è anonima e verrà utilizzata per migliorare i nostri eventi.
        </p>
      </div>

      <footer style={{ textAlign:'center', padding:'24px', fontSize:'13px', color:'#9CA3AF' }}>
        © {new Date().getFullYear()} CNA Roma
      </footer>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

const s = {
  page: { minHeight:'100vh', backgroundColor:'#F4F5F7', fontFamily:"'Inter',sans-serif" },
  center: { minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', backgroundColor:'#F4F5F7', fontFamily:"'Inter',sans-serif", padding:'24px' },
  header: { backgroundColor:'#FFFFFF', borderBottom:'2px solid #003DA5', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px 24px' },
  card: { maxWidth:'520px', margin:'40px auto', backgroundColor:'#FFFFFF', borderRadius:'12px', padding:'40px', boxShadow:'0 4px 24px rgba(0,0,0,0.08)' },
  title: { fontSize:'26px', fontWeight:'900', color:'#0A0A0A', letterSpacing:'-0.03em', margin:'0 0 6px', textAlign:'center' },
  eventName: { fontSize:'14px', color:'#003DA5', fontWeight:'600', textAlign:'center', margin:'0 0 16px' },
  greeting: { fontSize:'15px', color:'#374151', textAlign:'center', margin:'0 0 8px', lineHeight:'1.5' },
  fieldLabel: { fontSize:'13px', fontWeight:'600', color:'#0A0A0A', margin:'0 0 4px' },
  submitBtn: { display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', backgroundColor:'#003DA5', color:'#FFFFFF',
    border:'none', borderRadius:'6px', padding:'14px 24px', fontSize:'15px', fontWeight:'700',
    fontFamily:"'Inter',sans-serif", cursor:'pointer', letterSpacing:'-0.01em', transition:'opacity 0.15s' },
}
