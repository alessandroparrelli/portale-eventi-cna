import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const LOGO_URL = 'https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png'

export default function LandingPagePublic() {
  const { slug } = useParams()
  const [lp, setLp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Form state
  const [form, setForm] = useState({ nome:'', cognome:'', email:'', telefono:'', consenso_privacy: false, consenso_newsletter: false })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('slug', slug)
        .eq('stato', 'pubblicata')
        .single()
      if (!data) setNotFound(true)
      else setLp(data)
      setLoading(false)
    }
    load()
  }, [slug])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.email) { setFormError('L\'email è obbligatoria'); return }
    if (!form.consenso_privacy) { setFormError('Il consenso alla privacy è obbligatorio'); return }
    setFormError('')
    setSubmitting(true)
    const { error } = await supabase.from('lp_contacts').insert({
      landing_page_id: lp.id,
      nome: form.nome,
      cognome: form.cognome,
      email: form.email,
      telefono: form.telefono,
      consenso_privacy: form.consenso_privacy,
      consenso_newsletter: form.consenso_newsletter,
    })
    setSubmitting(false)
    if (!error) setSubmitted(true)
    else setFormError('Errore nell\'invio. Riprova.')
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#fff', fontFamily:'Inter,sans-serif' }}>
      <div style={{ color:'#9CA3AF', fontSize:'14px' }}>Caricamento...</div>
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#fff', fontFamily:'Inter,sans-serif', flexDirection:'column', gap:'12px' }}>
      <img src={LOGO_URL} alt="CNA Roma" style={{ height:'48px', objectFit:'contain' }} />
      <p style={{ color:'#9CA3AF', fontSize:'14px', margin:0 }}>Pagina non trovata</p>
    </div>
  )

  const tema = lp.tema || {}
  const primaryColor = tema.primario || '#003DA5'
  const textAlign = lp.hero_layout === 'sinistra' ? 'left' : lp.hero_layout === 'destra' ? 'right' : 'center'

  return (
    <div style={{ fontFamily:'Inter,sans-serif', background:'#fff', minHeight:'100vh' }}>

      {/* HERO */}
      <div style={{
        position:'relative', minHeight:'480px', display:'flex', flexDirection:'column',
        alignItems: lp.hero_layout === 'sinistra' ? 'flex-start' : lp.hero_layout === 'destra' ? 'flex-end' : 'center',
        justifyContent:'center', padding:'60px 24px',
        background: lp.hero_immagine_url ? `url(${lp.hero_immagine_url}) center/cover` : primaryColor,
      }}>
        {/* Overlay */}
        <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.45)' }} />

        {/* Logo */}
        <div style={{ position:'relative', zIndex:1, textAlign:'center', width:'100%', marginBottom:'40px' }}>
          <img src={LOGO_URL} alt="CNA Roma" style={{ height:'52px', objectFit:'contain', filter:'brightness(0) invert(1)' }} />
        </div>

        {/* Testo hero */}
        <div style={{ position:'relative', zIndex:1, maxWidth:'700px', textAlign, width:'100%' }}>
          {lp.hero_titolo && (
            <h1 style={{ fontSize:'clamp(28px,5vw,52px)', fontWeight:'900', color:'#fff', margin:'0 0 16px', letterSpacing:'-0.04em', lineHeight:1.1 }}>
              {lp.hero_titolo}
            </h1>
          )}
          {lp.hero_sottotitolo && (
            <p style={{ fontSize:'clamp(15px,2vw,20px)', color:'rgba(255,255,255,0.85)', margin:0, lineHeight:1.6, fontWeight:'400' }}>
              {lp.hero_sottotitolo}
            </p>
          )}
        </div>
      </div>

      {/* CONTENUTO */}
      {lp.contenuto && lp.contenuto.length > 0 && (
        <div style={{ maxWidth:'760px', margin:'0 auto', padding:'60px 24px' }}>
          {/* blocchi renderizzati in futuro */}
        </div>
      )}

      {/* FORM CONTATTI */}
      {lp.form_abilitato && (
        <div style={{ background:'#F9FAFB', padding:'60px 24px' }}>
          <div style={{ maxWidth:'520px', margin:'0 auto' }}>
            {lp.form_titolo && (
              <h2 style={{ fontSize:'28px', fontWeight:'800', color:'#0A0A0A', margin:'0 0 8px', letterSpacing:'-0.03em', textAlign:'center' }}>
                {lp.form_titolo}
              </h2>
            )}
            {lp.form_testo && (
              <p style={{ fontSize:'15px', color:'#6B7280', textAlign:'center', margin:'0 0 32px', lineHeight:1.6 }}>
                {lp.form_testo}
              </p>
            )}

            {submitted ? (
              <div style={{ background:'#D1FAE5', border:'1px solid #6EE7B7', borderRadius:'12px', padding:'32px', textAlign:'center' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" style={{ marginBottom:'12px' }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <p style={{ fontSize:'16px', fontWeight:'700', color:'#065F46', margin:'0 0 4px' }}>Grazie!</p>
                <p style={{ fontSize:'14px', color:'#059669', margin:0 }}>{lp.form_messaggio_conferma}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
                  <FormInput label="Nome" value={form.nome} onChange={v => setForm(f => ({...f, nome:v}))} />
                  <FormInput label="Cognome" value={form.cognome} onChange={v => setForm(f => ({...f, cognome:v}))} />
                </div>
                <FormInput label="Email *" type="email" value={form.email} onChange={v => setForm(f => ({...f, email:v}))} />
                <FormInput label="Telefono" type="tel" value={form.telefono} onChange={v => setForm(f => ({...f, telefono:v}))} />

                <label style={{ display:'flex', alignItems:'flex-start', gap:'10px', cursor:'pointer' }}>
                  <input type="checkbox" checked={form.consenso_privacy} onChange={e => setForm(f => ({...f, consenso_privacy:e.target.checked}))} style={{ marginTop:'2px', flexShrink:0 }} />
                  <span style={{ fontSize:'13px', color:'#374151', lineHeight:1.5 }}>
                    Ho letto e accetto la <a href="#" style={{ color: primaryColor }}>Privacy Policy</a> *
                  </span>
                </label>
                <label style={{ display:'flex', alignItems:'flex-start', gap:'10px', cursor:'pointer' }}>
                  <input type="checkbox" checked={form.consenso_newsletter} onChange={e => setForm(f => ({...f, consenso_newsletter:e.target.checked}))} style={{ marginTop:'2px', flexShrink:0 }} />
                  <span style={{ fontSize:'13px', color:'#374151', lineHeight:1.5 }}>
                    Desidero ricevere comunicazioni e aggiornamenti da CNA Roma
                  </span>
                </label>

                {formError && <p style={{ fontSize:'13px', color:'#DC2626', margin:0 }}>{formError}</p>}

                <button type="submit" disabled={submitting} style={{
                  background: primaryColor, color:'#fff', border:'none', borderRadius:'8px',
                  padding:'14px', fontFamily:'Inter,sans-serif', fontSize:'15px',
                  fontWeight:'700', cursor:'pointer', marginTop:'4px'
                }}>
                  {submitting ? 'Invio in corso...' : (lp.form_bottone_testo || 'Invia')}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer style={{ background:'#0A0A0A', padding:'32px 24px', textAlign:'center' }}>
        <img src={LOGO_URL} alt="CNA Roma" style={{ height:'36px', objectFit:'contain', filter:'brightness(0) invert(1)', marginBottom:'12px' }} />
        {lp.footer_testo && <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)', margin:0 }}>{lp.footer_testo}</p>}
        <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.3)', margin:'8px 0 0' }}>© {new Date().getFullYear()} CNA Roma</p>
      </footer>
    </div>
  )
}

function FormInput({ label, type='text', value, onChange }) {
  return (
    <div>
      <label style={{ display:'block', fontSize:'13px', fontWeight:'600', color:'#374151', marginBottom:'5px' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width:'100%', boxSizing:'border-box', padding:'11px 14px',
          border:'1px solid #E5E7EB', borderRadius:'8px',
          fontSize:'15px', fontFamily:'Inter,sans-serif', outline:'none', color:'#0A0A0A'
        }}
      />
    </div>
  )
}
