import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Star, CheckCircle2, Loader2 } from 'lucide-react'

const LOGO = 'https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png'

export default function QuestionarioPage() {
  const [params] = useSearchParams()
  const qr = params.get('qr')
  const [reg, setReg] = useState(null)
  const [event, setEvent] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [alreadyDone, setAlreadyDone] = useState(false)
  const [stars, setStars] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [commento, setCommento] = useState('')
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!qr) { setNotFound(true); setLoading(false); return }
    ;(async () => {
      const { data: regData } = await supabase.from('registrations')
        .select('*, events(id,titolo,data_inizio,luogo)').eq('qr_code', qr).single()
      if (!regData) { setNotFound(true); setLoading(false); return }
      const { data: existing } = await supabase.from('survey_answers')
        .select('id').eq('registration_id', regData.id).single()
      if (existing) { setAlreadyDone(true); setLoading(false); return }
      // Carica domande custom dell'evento
      const { data: qs } = await supabase.from('survey_questions')
        .select('*').eq('event_id', regData.events.id).eq('attivo', true).order('ordine')
      setQuestions(qs || [])
      setReg(regData)
      setEvent(regData.events)
      setLoading(false)
    })()
  }, [qr])

  function setAnswer(id, val) { setAnswers(prev => ({ ...prev, [id]: val })) }

  async function submit(e) {
    e.preventDefault()
    if (stars === 0) return
    // Verifica domande obbligatorie
    for (const q of questions) {
      if (q.obbligatorio && !answers[q.id]?.toString().trim()) return
    }
    setSubmitting(true)
    await supabase.from('survey_answers').insert({
      registration_id: reg.id,
      valutazione: stars,
      commento: commento.trim() || null,
      risposte_extra: answers,
    })
    setSubmitting(false)
    setDone(true)
  }

  if (loading) return (
    <div style={s.center}>
      <Loader2 size={32} style={{ color:'#E11D48', animation:'spin 1s linear infinite', marginBottom:'12px' }}/>
      <p style={{ color:'#6B7280', fontSize:'14px' }}>Caricamento…</p>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (notFound) return (
    <div style={s.center}>
      <img src={LOGO} alt="CNA Roma" style={{ height:'48px', marginBottom:'24px' }}/>
      <p style={{ fontSize:'18px', fontWeight:'700', color:'#0A0A0A' }}>Link non valido</p>
      <p style={{ fontSize:'14px', color:'#6B7280' }}>Il link del questionario non è valido o è scaduto.</p>
    </div>
  )

  if (alreadyDone) return (
    <div style={s.center}>
      <img src={LOGO} alt="CNA Roma" style={{ height:'48px', marginBottom:'24px' }}/>
      <CheckCircle2 size={48} style={{ color:'#16A34A', marginBottom:'12px' }}/>
      <p style={{ fontSize:'18px', fontWeight:'700', color:'#0A0A0A' }}>Questionario già compilato</p>
      <p style={{ fontSize:'14px', color:'#6B7280' }}>Hai già inviato la tua valutazione. Grazie!</p>
    </div>
  )

  if (done) return (
    <div style={s.center}>
      <img src={LOGO} alt="CNA Roma" style={{ height:'48px', marginBottom:'24px' }}/>
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
        <img src={LOGO} alt="CNA Roma" style={{ height:'48px' }}/>
      </header>

      <div style={s.card}>
        <h1 style={s.title}>Come è andato l'evento?</h1>
        {event && <p style={s.eventName}>{event.titolo}</p>}
        <p style={s.greeting}>Ciao <strong>{reg?.nome}</strong>, quanto sei soddisfatto/a?</p>

        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:'24px' }}>
          {/* Stelle obbligatorie */}
          <div>
            <p style={s.fieldLabel}>Valutazione complessiva <span style={{ color:'#DC2626' }}>*</span></p>
            <div style={{ display:'flex', gap:'8px', justifyContent:'center', margin:'12px 0' }}>
              {[1,2,3,4,5].map(n=>(
                <button key={n} type="button"
                  onClick={()=>setStars(n)}
                  onMouseEnter={()=>setHovered(n)}
                  onMouseLeave={()=>setHovered(0)}
                  style={{ background:'none', border:'none', cursor:'pointer', padding:'4px', transition:'transform 0.1s',
                    transform:(hovered||stars)>=n?'scale(1.15)':'scale(1)' }}>
                  <Star size={40}
                    fill={(hovered||stars)>=n?'#F59E0B':'none'}
                    style={{ color:(hovered||stars)>=n?'#F59E0B':'#D1D5DB', transition:'color 0.1s' }}/>
                </button>
              ))}
            </div>
            {stars>0 && (
              <p style={{ textAlign:'center', fontSize:'14px', color:'#6B7280', margin:0 }}>
                {['','Scarso','Sufficiente','Buono','Ottimo','Eccellente'][stars]}
              </p>
            )}
          </div>

          {/* Domande custom */}
          {questions.map(q => (
            <div key={q.id}>
              <p style={s.fieldLabel}>
                {q.testo}
                {q.obbligatorio && <span style={{ color:'#DC2626' }}> *</span>}
              </p>

              {q.tipo === 'stelle' && (
                <ScaleStelle value={answers[q.id]||0} onChange={v=>setAnswer(q.id,v)}/>
              )}

              {q.tipo === 'scala' && (
                <ScalaNumero value={answers[q.id]||''} onChange={v=>setAnswer(q.id,v)}/>
              )}

              {q.tipo === 'scelta' && (
                <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginTop:'8px' }}>
                  {(q.opzioni||[]).map(op=>(
                    <label key={op} style={{ display:'flex', alignItems:'center', gap:'10px', fontSize:'14px', color:'#374151', cursor:'pointer' }}>
                      <input type="radio" name={`q_${q.id}`} value={op}
                        checked={answers[q.id]===op}
                        onChange={()=>setAnswer(q.id,op)}
                        style={{ accentColor:'#E11D48', width:'16px', height:'16px' }}/>
                      {op}
                    </label>
                  ))}
                </div>
              )}

              {q.tipo === 'testo' && (
                <textarea value={answers[q.id]||''} onChange={e=>setAnswer(q.id,e.target.value)}
                  placeholder="La tua risposta…" rows={3}
                  style={{ width:'100%', padding:'12px', border:'1px solid #D1D5DB', borderRadius:'6px',
                    fontSize:'14px', fontFamily:"'Outfit',sans-serif", outline:'none', resize:'vertical', boxSizing:'border-box', marginTop:'6px' }}
                  onFocus={e=>(e.target.style.borderColor='#E11D48')}
                  onBlur={e=>(e.target.style.borderColor='#D1D5DB')}/>
              )}
            </div>
          ))}

          {/* Commento libero */}
          <div>
            <p style={s.fieldLabel}>Commento libero (facoltativo)</p>
            <textarea value={commento} onChange={e=>setCommento(e.target.value)}
              placeholder="Cosa hai apprezzato di più? Cosa miglioreresti?"
              rows={4}
              style={{ width:'100%', padding:'12px', border:'1px solid #D1D5DB', borderRadius:'6px',
                fontSize:'14px', fontFamily:"'Outfit',sans-serif", outline:'none', resize:'vertical', boxSizing:'border-box' }}
              onFocus={e=>(e.target.style.borderColor='#E11D48')}
              onBlur={e=>(e.target.style.borderColor='#D1D5DB')}/>
          </div>

          <button type="submit" disabled={stars===0||submitting}
            style={{ ...s.submitBtn, opacity:stars===0||submitting?0.6:1 }}>
            {submitting ? <><Loader2 size={18} style={{ animation:'spin 1s linear infinite' }}/> Invio…</> : 'Invia valutazione'}
          </button>
        </form>

        <p style={{ fontSize:'12px', color:'#9CA3AF', textAlign:'center', margin:'16px 0 0' }}>
          La tua risposta verrà utilizzata per migliorare i nostri eventi.
        </p>
      </div>

      <footer style={{ textAlign:'center', padding:'24px', fontSize:'13px', color:'#9CA3AF' }}>
        © {new Date().getFullYear()} CNA Roma
      </footer>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function ScaleStelle({ value, onChange }) {
  const [hov, setHov] = useState(0)
  return (
    <div style={{ display:'flex', gap:'6px', marginTop:'8px' }}>
      {[1,2,3,4,5].map(n=>(
        <button key={n} type="button" onClick={()=>onChange(n)}
          onMouseEnter={()=>setHov(n)} onMouseLeave={()=>setHov(0)}
          style={{ background:'none', border:'none', cursor:'pointer', padding:'2px',
            transform:(hov||value)>=n?'scale(1.1)':'scale(1)', transition:'transform 0.1s' }}>
          <Star size={32} fill={(hov||value)>=n?'#F59E0B':'none'}
            style={{ color:(hov||value)>=n?'#F59E0B':'#D1D5DB' }}/>
        </button>
      ))}
    </div>
  )
}

function ScalaNumero({ value, onChange }) {
  return (
    <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginTop:'8px' }}>
      {[1,2,3,4,5,6,7,8,9,10].map(n=>(
        <button key={n} type="button" onClick={()=>onChange(n)}
          style={{ width:'40px', height:'40px', borderRadius:'6px', border:'1px solid',
            borderColor: value===n?'#E11D48':'#D1D5DB',
            backgroundColor: value===n?'#E11D48':'#FFFFFF',
            color: value===n?'#FFFFFF':'#374151',
            fontSize:'14px', fontWeight:'700', cursor:'pointer',
            fontFamily:"'Outfit',sans-serif", transition:'all 0.1s' }}>
          {n}
        </button>
      ))}
    </div>
  )
}

const s = {
  page: { minHeight:'100vh', backgroundColor:'#F4F5F7', fontFamily:"'Outfit',sans-serif" },
  center: { minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
    backgroundColor:'#F4F5F7', fontFamily:"'Outfit',sans-serif", padding:'24px' },
  header: { backgroundColor:'#FFFFFF', borderBottom:'2px solid #E11D48', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px 24px' },
  card: { maxWidth:'520px', margin:'40px auto', backgroundColor:'#FFFFFF', borderRadius:'12px', padding:'40px', boxShadow:'0 4px 24px rgba(0,0,0,0.08)' },
  title: { fontSize:'26px', fontWeight:'900', color:'#0A0A0A', letterSpacing:'-0.03em', margin:'0 0 6px', textAlign:'center' },
  eventName: { fontSize:'14px', color:'#E11D48', fontWeight:'600', textAlign:'center', margin:'0 0 16px' },
  greeting: { fontSize:'15px', color:'#374151', textAlign:'center', margin:'0 0 8px', lineHeight:'1.5' },
  fieldLabel: { fontSize:'13px', fontWeight:'600', color:'#0A0A0A', margin:'0 0 4px' },
  submitBtn: { display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', backgroundColor:'#E11D48', color:'#FFFFFF',
    border:'none', borderRadius:'6px', padding:'14px 24px', fontSize:'15px', fontWeight:'700',
    fontFamily:"'Outfit',sans-serif", cursor:'pointer', letterSpacing:'-0.01em', transition:'opacity 0.15s' },
}
