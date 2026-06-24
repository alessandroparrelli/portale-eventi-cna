import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { RICH_CSS } from '../../components/editor/RichEditor'
import { temaConDefault } from '../../components/editor/AspettoTab'

const LOGO_URL = 'https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png'

// ── Block renderer (stesso pattern di LandingPage.jsx) ─────────────
function BlockRenderer({ block, cp }) {
  if (!block) return null
  if (block.tipo === 'testo') return (
    <div className="rich-content" style={{ marginBottom:'16px' }} dangerouslySetInnerHTML={{ __html: block.html || '' }} />
  )
  if (block.tipo === 'stats') return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:'32px', justifyContent:'center', padding:'32px 0', marginBottom:'16px' }}>
      {(block.items || []).map((item, i) => (
        <div key={i} style={{ textAlign:'center', flex:'1 1 100px' }}>
          <p style={{ fontSize:'clamp(36px,6vw,52px)', fontWeight:'900', color:block.colore||cp, letterSpacing:'-.04em', margin:'0 0 4px', lineHeight:1 }}>{item.num||item.numero}</p>
          <p style={{ fontSize:'13px', color:'#6B7280', fontWeight:'700', margin:0, textTransform:'uppercase', letterSpacing:'.05em' }}>{item.label}</p>
        </div>
      ))}
    </div>
  )
  if (block.tipo === 'griglia') {
    const cols = block.cols || block.colonne || []
    return (
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(cols.length,3)},1fr)`, gap:'16px', marginBottom:'16px' }}>
        {cols.map((col, i) => (
          <div key={i} style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:'10px', padding:'20px' }}>
            {col.icona && <div style={{ fontSize:'26px', marginBottom:'10px' }}>{col.icona}</div>}
            {col.titolo && <h3 style={{ fontSize:'16px', fontWeight:'800', color:'#0A0A0A', margin:'0 0 8px', letterSpacing:'-.02em' }}>{col.titolo}</h3>}
            {col.testo && <p style={{ fontSize:'14px', color:'#6B7280', lineHeight:'1.6', margin:0 }}>{col.testo}</p>}
          </div>
        ))}
      </div>
    )
  }
  if (block.tipo === 'cta') return (
    <div style={{ background:'#EEF3FF', border:'1px solid #C7D9F8', borderRadius:'12px', padding:'28px 24px', textAlign:'center', marginBottom:'16px' }}>
      {block.titolo && <h2 style={{ fontSize:'clamp(18px,3vw,26px)', fontWeight:'900', color:'#0A0A0A', letterSpacing:'-.03em', margin:'0 0 16px' }}>{block.titolo}</h2>}
      <a href="#lp-form" style={{ display:'inline-block', background:block.colore||cp, color:'#fff', borderRadius:'8px', padding:'13px 32px', fontSize:'15px', fontWeight:'800', textDecoration:'none' }}>
        {block.testo_btn || block.testo || 'Contattaci →'}
      </a>
    </div>
  )
  if (block.tipo === 'immagine') {
    const maxW = block.size==='small'?'33%':block.size==='medium'?'60%':'100%'
    const align = block.align || 'center'
    return (
      <div style={{ marginBottom:'16px', textAlign:align }}>
        {block.src && <img src={block.src} alt={block.didascalia||''} style={{ maxWidth:maxW, width:'100%', display:'inline-block' }} />}
        {block.didascalia && <p style={{ fontSize:'13px', color:'#9CA3AF', marginTop:'8px', fontStyle:'italic' }}>{block.didascalia}</p>}
      </div>
    )
  }
  if (block.tipo === 'separatore') return <hr style={{ border:'none', borderTop:'2px solid #E5E7EB', margin:'24px 0' }} />
  return null
}

// ── Form contatti ──────────────────────────────────────────────────
function FormContatti({ lp, tema }) {
  const cp = tema.colore_primario || '#003DA5'
  const [form, setForm] = useState({ nome:'', cognome:'', email:'', telefono:'', azienda:'', citta:'', consenso_privacy:false, consenso_newsletter:false })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [err, setErr] = useState('')

  const fields = lp.form_fields && lp.form_fields.length > 0
    ? lp.form_fields
    : [{ key:'nome',enabled:true },{ key:'cognome',enabled:true },{ key:'email',enabled:true,required:true },{ key:'telefono',enabled:false }]

  const labels = { nome:'Nome', cognome:'Cognome', email:'Email *', telefono:'Telefono', azienda:'Azienda', citta:'Città' }
  const types  = { email:'email', telefono:'tel' }

  async function submit(e) {
    e.preventDefault()
    if (!form.email) { setErr("L'email è obbligatoria"); return }
    if (!form.consenso_privacy) { setErr("Il consenso alla privacy è obbligatorio"); return }
    setErr(''); setSubmitting(true)
    const { error } = await supabase.from('lp_contacts').insert({
      landing_page_id: lp.id,
      nome: form.nome, cognome: form.cognome,
      email: form.email, telefono: form.telefono,
      dati_extra: { azienda: form.azienda, citta: form.citta },
      consenso_privacy: form.consenso_privacy,
      consenso_newsletter: form.consenso_newsletter,
    })
    setSubmitting(false)
    if (!error) setSubmitted(true)
    else setErr('Errore nell\'invio. Riprova.')
  }

  if (submitted) return (
    <div style={{ background:'#D1FAE5', border:'1px solid #6EE7B7', borderRadius:'12px', padding:'32px', textAlign:'center' }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" style={{ marginBottom:'12px' }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      <p style={{ fontSize:'16px', fontWeight:'700', color:'#065F46', margin:'0 0 4px' }}>Grazie!</p>
      <p style={{ fontSize:'14px', color:'#059669', margin:0 }}>{lp.form_messaggio_conferma || 'Grazie! Ti ricontatteremo presto.'}</p>
    </div>
  )

  const btnRadius = (tema.btn_raggio || '8') + 'px'
  const btnStyle = {
    background: tema.colore_pulsanti || cp, color: tema.colore_testo_btn || '#fff',
    border:'none', borderRadius: btnStyle_pill(tema) ? '999px' : btnRadius,
    padding:'14px', fontFamily:'Inter,sans-serif', fontSize:'15px', fontWeight:'700', cursor:'pointer', width:'100%'
  }

  return (
    <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
        {fields.filter(f => f.enabled && (f.key==='nome'||f.key==='cognome')).map(f => (
          <div key={f.key}>
            <label style={labelSt}>{labels[f.key]}</label>
            <input type={types[f.key]||'text'} value={form[f.key]||''} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} style={iSt} />
          </div>
        ))}
      </div>
      {fields.filter(f => f.enabled && f.key!=='nome' && f.key!=='cognome').map(f => (
        <div key={f.key}>
          <label style={labelSt}>{labels[f.key]}{f.required ? ' *' : ''}</label>
          <input type={types[f.key]||'text'} value={form[f.key]||''} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} style={iSt} />
        </div>
      ))}
      <label style={{ display:'flex', alignItems:'flex-start', gap:'10px', cursor:'pointer' }}>
        <input type="checkbox" checked={form.consenso_privacy} onChange={e=>setForm(p=>({...p,consenso_privacy:e.target.checked}))} style={{ marginTop:'2px', flexShrink:0, accentColor:cp }} />
        <span style={{ fontSize:'13px', color:'#374151', lineHeight:1.5 }}>Ho letto e accetto la <a href="#" style={{ color:cp }}>Privacy Policy</a> *</span>
      </label>
      <label style={{ display:'flex', alignItems:'flex-start', gap:'10px', cursor:'pointer' }}>
        <input type="checkbox" checked={form.consenso_newsletter} onChange={e=>setForm(p=>({...p,consenso_newsletter:e.target.checked}))} style={{ marginTop:'2px', flexShrink:0, accentColor:cp }} />
        <span style={{ fontSize:'13px', color:'#374151', lineHeight:1.5 }}>Desidero ricevere comunicazioni e aggiornamenti da CNA Roma</span>
      </label>
      {err && <p style={{ fontSize:'13px', color:'#DC2626', margin:0 }}>{err}</p>}
      <button type="submit" disabled={submitting} style={btnStyle}>
        {submitting ? 'Invio...' : (lp.form_bottone_testo || 'Invia')}
      </button>
    </form>
  )
}

function btnStyle_pill(tema) { return tema.btn_stile === 'pill' }
const labelSt = { display:'block', fontSize:'13px', fontWeight:'600', color:'#374151', marginBottom:'5px' }
const iSt     = { width:'100%', boxSizing:'border-box', padding:'11px 14px', border:'1px solid #E5E7EB', borderRadius:'8px', fontSize:'15px', fontFamily:'Inter,sans-serif', outline:'none', color:'#0A0A0A' }

// ── Pagina principale ──────────────────────────────────────────────
export default function LandingPagePublic() {
  const { slug } = useParams()
  const [lp, setLp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    supabase.from('landing_pages').select('*').eq('slug', slug).eq('stato', 'pubblicata').single()
      .then(({ data }) => {
        if (!data) setNotFound(true)
        else setLp(data)
        setLoading(false)
      })
  }, [slug])

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

  const tema = temaConDefault(lp.tema)
  const cp   = tema.colore_primario || '#003DA5'
  const textAlign = lp.hero_layout === 'sinistra' ? 'left' : lp.hero_layout === 'destra' ? 'right' : 'center'
  const alignItems = lp.hero_layout === 'sinistra' ? 'flex-start' : lp.hero_layout === 'destra' ? 'flex-end' : 'center'
  const hasContenuto = lp.contenuto && lp.contenuto.length > 0

  return (
    <div style={{ fontFamily:'Inter,sans-serif', background: tema.sfondo_pagina || '#fff', minHeight:'100vh' }}>
      <style>{RICH_CSS}</style>

      {/* HERO */}
      <div style={{
        position:'relative', minHeight:'500px', display:'flex', flexDirection:'column',
        alignItems, justifyContent:'center', padding:'60px 24px',
        background: lp.hero_immagine_url ? `url(${lp.hero_immagine_url}) center/cover` : cp,
      }}>
        <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.45)' }} />
        {/* Logo */}
        <div style={{ position:'relative', zIndex:1, textAlign:'center', width:'100%', marginBottom:'40px' }}>
          <img src={LOGO_URL} alt="CNA Roma" style={{ height: (tema.logo_altezza||'44')+'px', objectFit:'contain', filter:'brightness(0) invert(1)' }} />
        </div>
        {/* Testo */}
        <div style={{ position:'relative', zIndex:1, maxWidth:'720px', textAlign, width:'100%' }}>
          {lp.hero_titolo && (
            <h1 style={{ fontSize:'clamp(28px,5vw,54px)', fontWeight:'900', color:'#fff', margin:'0 0 16px', letterSpacing:'-0.04em', lineHeight:1.1 }}>
              {lp.hero_titolo}
            </h1>
          )}
          {lp.hero_sottotitolo && (
            <p style={{ fontSize:'clamp(15px,2vw,20px)', color:'rgba(255,255,255,0.88)', margin:'0 0 28px', lineHeight:1.65, fontWeight:'400' }}>
              {lp.hero_sottotitolo}
            </p>
          )}
          {lp.form_abilitato && (
            <a href="#lp-form" style={{
              display:'inline-block', background:'#fff', color: cp,
              borderRadius: tema.btn_stile==='pill' ? '999px' : (tema.btn_raggio||'8')+'px',
              padding:'13px 28px', fontSize:'15px', fontWeight:'800', textDecoration:'none'
            }}>
              {lp.form_bottone_testo || 'Contattaci'} →
            </a>
          )}
        </div>
      </div>

      {/* CONTENUTO */}
      {hasContenuto && (
        <div style={{ maxWidth:'760px', margin:'0 auto', padding:'60px 24px' }}>
          {lp.contenuto.map((block, i) => (
            <BlockRenderer key={block.id||i} block={block} cp={cp} />
          ))}
        </div>
      )}

      {/* FORM CONTATTI */}
      {lp.form_abilitato && (
        <div id="lp-form" style={{ background: tema.sfondo_sezioni || '#F9FAFB', padding:'60px 24px' }}>
          <div style={{ maxWidth:'520px', margin:'0 auto' }}>
            {lp.form_titolo && (
              <h2 style={{ fontSize:'28px', fontWeight:'800', color: tema.heading_colore || '#0A0A0A', margin:'0 0 8px', letterSpacing:'-0.03em', textAlign:'center' }}>
                {lp.form_titolo}
              </h2>
            )}
            {lp.form_testo && (
              <p style={{ fontSize:'15px', color: tema.testo_colore || '#6B7280', textAlign:'center', margin:'0 0 32px', lineHeight:1.6 }}>
                {lp.form_testo}
              </p>
            )}
            <FormContatti lp={lp} tema={tema} />
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer style={{ background: tema.sfondo_footer || '#0A0A0A', padding:'32px 24px', textAlign:'center' }}>
        <img src={LOGO_URL} alt="CNA Roma" style={{ height:'36px', objectFit:'contain', filter:'brightness(0) invert(1)', marginBottom:'12px', display:'block', margin:'0 auto 12px' }} />
        {lp.footer_testo && <p style={{ fontSize:'13px', color: tema.testo_footer || 'rgba(255,255,255,0.5)', margin:'0 0 4px' }}>{lp.footer_testo}</p>}
        <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.3)', margin:0 }}>© {new Date().getFullYear()} CNA Roma</p>
      </footer>
    </div>
  )
}
