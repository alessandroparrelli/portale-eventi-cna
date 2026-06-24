import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { RICH_CSS } from '../../components/editor/RichEditor'
import { temaConDefault } from '../../components/editor/AspettoTab'

const LOGO_URL = 'https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png'

// ── Animazione al scroll (Intersection Observer) ─────────────────
function Animate({ children, animation = 'fadeup', delay = 0 }) {
  const ref = useRef()
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.12 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  const anims = {
    fadeup:  { from: 'opacity:0;transform:translateY(28px)', to: 'opacity:1;transform:translateY(0)' },
    fadein:  { from: 'opacity:0', to: 'opacity:1' },
    slidein: { from: 'opacity:0;transform:translateX(-32px)', to: 'opacity:1;transform:translateX(0)' },
    none:    { from: '', to: '' },
  }
  const a = anims[animation] || anims.fadeup
  return (
    <div ref={ref} style={{ transition: `opacity .55s ease ${delay}ms, transform .55s ease ${delay}ms`, ...(visible ? {} : { opacity:0, transform: animation==='slidein'?'translateX(-32px)': animation==='none'?undefined:'translateY(28px)' }) }}>
      {children}
    </div>
  )
}

// ── Contatore animato ─────────────────────────────────────────────
function AnimatedNumber({ target }) {
  const [display, setDisplay] = useState('0')
  const ref = useRef(); const started = useRef(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true
        const num = parseFloat(target.replace(/[^0-9.]/g,''))
        const suffix = target.replace(/[0-9.]/g,'')
        if (isNaN(num)) { setDisplay(target); return }
        const dur = 1400, fps = 60, steps = dur/1000*fps
        let step = 0
        const t = setInterval(() => {
          step++; const p = step/steps
          const ease = 1 - Math.pow(1-p, 3)
          setDisplay(Math.round(num*ease).toLocaleString('it-IT')+suffix)
          if (step>=steps) { setDisplay(num.toLocaleString('it-IT')+suffix); clearInterval(t) }
        }, 1000/fps)
      }
    }, { threshold:0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [target])
  return <span ref={ref}>{display}</span>
}

// ── Accordion item ────────────────────────────────────────────────
function AccordionItem({ domanda, risposta, cp }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ border:'1px solid #E5E7EB', borderRadius:'10px', overflow:'hidden', marginBottom:'8px' }}>
      <button onClick={() => setOpen(o=>!o)} style={{
        width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'16px 20px', background: open?'#EEF3FF':'#fff', border:'none', cursor:'pointer',
        fontFamily:'Inter,sans-serif', textAlign:'left'
      }}>
        <span style={{ fontSize:'15px', fontWeight:'700', color: open?cp:'#0A0A0A' }}>{domanda}</span>
        <span style={{ fontSize:'20px', color:cp, flexShrink:0, marginLeft:'12px', transition:'transform .25s', transform:open?'rotate(45deg)':'rotate(0)' }}>+</span>
      </button>
      <div style={{ maxHeight: open?'400px':'0', overflow:'hidden', transition:'max-height .35s ease' }}>
        <div style={{ padding:'0 20px 18px', fontSize:'15px', color:'#374151', lineHeight:'1.7' }}>{risposta}</div>
      </div>
    </div>
  )
}

// ── Countdown ─────────────────────────────────────────────────────
function Countdown({ data, titolo, messaggio_scaduto, cp }) {
  const [time, setTime] = useState(null)
  useEffect(() => {
    function calc() {
      const diff = new Date(data) - new Date()
      if (diff <= 0) { setTime(null); return }
      setTime({
        g: Math.floor(diff/86400000),
        h: Math.floor((diff%86400000)/3600000),
        m: Math.floor((diff%3600000)/60000),
        s: Math.floor((diff%60000)/1000),
      })
    }
    calc()
    const t = setInterval(calc, 1000)
    return () => clearInterval(t)
  }, [data])

  if (!data) return null
  return (
    <div style={{ textAlign:'center', padding:'40px 24px', background:`linear-gradient(135deg, ${cp}10, ${cp}08)`, borderRadius:'16px', border:`1px solid ${cp}30` }}>
      {titolo && <p style={{ fontSize:'14px', fontWeight:'700', color:cp, textTransform:'uppercase', letterSpacing:'.08em', margin:'0 0 20px' }}>{titolo}</p>}
      {time ? (
        <div style={{ display:'flex', gap:'12px', justifyContent:'center', flexWrap:'wrap' }}>
          {[['g','Giorni'],['h','Ore'],['m','Minuti'],['s','Secondi']].map(([k,l])=>(
            <div key={k} style={{ minWidth:'72px' }}>
              <div style={{ fontSize:'clamp(36px,6vw,52px)', fontWeight:'900', color:cp, letterSpacing:'-.04em', lineHeight:1 }}>{String(time[k]).padStart(2,'0')}</div>
              <div style={{ fontSize:'11px', color:'#9CA3AF', fontWeight:'700', textTransform:'uppercase', letterSpacing:'.06em', marginTop:'4px' }}>{l}</div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontSize:'18px', fontWeight:'700', color:cp }}>{messaggio_scaduto}</p>
      )}
    </div>
  )
}

// ── Utility video embed ───────────────────────────────────────────
function videoEmbedUrl(url) {
  if (!url) return null
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0`
  const vi = url.match(/vimeo\.com\/(\d+)/)
  if (vi) return `https://player.vimeo.com/video/${vi[1]}`
  return null
}

// ── Block Renderer ────────────────────────────────────────────────
function BlockRenderer({ block, cp }) {
  if (!block) return null

  if (block.tipo === 'testo') return (
    <Animate animation="fadeup"><div className="rich-content" style={{ marginBottom:'16px' }} dangerouslySetInnerHTML={{ __html:block.html||'' }} /></Animate>
  )

  if (block.tipo === 'titolo') return (
    <Animate animation={block.animazione||'fadeup'}>
      <div style={{ textAlign:block.allineamento||'center', marginBottom:'32px', marginTop:'8px' }}>
        <h2 style={{ fontSize:'clamp(24px,4vw,38px)', fontWeight:'900', color:'#0A0A0A', letterSpacing:'-.03em', margin:'0 0 10px' }}>{block.testo}</h2>
        {block.sottotitolo && <p style={{ fontSize:'clamp(14px,2vw,18px)', color:'#6B7280', margin:0, lineHeight:1.6 }}>{block.sottotitolo}</p>}
        <div style={{ width:'48px', height:'4px', background:cp, borderRadius:'2px', margin: block.allineamento==='center'?'16px auto 0':block.allineamento==='right'?'16px 0 0 auto':'16px auto 0 0' }} />
      </div>
    </Animate>
  )

  if (block.tipo === 'stats') return (
    <Animate animation="fadein">
      <div style={{ display:'flex', flexWrap:'wrap', gap:'32px', justifyContent:'center', padding:'32px 0', marginBottom:'16px' }}>
        {(block.items||[]).map((item,i)=>(
          <Animate key={i} animation="fadeup" delay={i*100}>
            <div style={{ textAlign:'center', flex:'1 1 100px' }}>
              <p style={{ fontSize:'clamp(36px,6vw,52px)', fontWeight:'900', color:block.colore||cp, letterSpacing:'-.04em', margin:'0 0 4px', lineHeight:1 }}>
                {block.animato!==false ? <AnimatedNumber target={item.num||item.numero||'0'} /> : (item.num||item.numero)}
              </p>
              <p style={{ fontSize:'13px', color:'#6B7280', fontWeight:'700', margin:0, textTransform:'uppercase', letterSpacing:'.05em' }}>{item.label}</p>
            </div>
          </Animate>
        ))}
      </div>
    </Animate>
  )

  if (block.tipo === 'griglia') {
    const cols = block.cols||block.colonne||[]
    return (
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(cols.length,3)},1fr)`, gap:'16px', marginBottom:'24px' }}>
        {cols.map((col,i)=>(
          <Animate key={i} animation="fadeup" delay={i*80}>
            <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:'12px', padding:'24px', height:'100%', boxSizing:'border-box', transition:'box-shadow .2s, transform .2s' }}
              onMouseEnter={e=>{e.currentTarget.style.boxShadow=`0 8px 24px ${cp}20`;e.currentTarget.style.transform='translateY(-2px)'}}
              onMouseLeave={e=>{e.currentTarget.style.boxShadow='none';e.currentTarget.style.transform='translateY(0)'}}>
              {col.icona&&<div style={{ fontSize:'28px', marginBottom:'12px' }}>{col.icona}</div>}
              {col.titolo&&<h3 style={{ fontSize:'16px', fontWeight:'800', color:'#0A0A0A', margin:'0 0 8px', letterSpacing:'-.02em' }}>{col.titolo}</h3>}
              {col.testo&&<p style={{ fontSize:'14px', color:'#6B7280', lineHeight:'1.65', margin:0 }}>{col.testo}</p>}
            </div>
          </Animate>
        ))}
      </div>
    )
  }

  if (block.tipo === 'badge_list') {
    const colonne = block.colonne || 2
    return (
      <Animate animation="fadeup">
        <div style={{ display:'grid', gridTemplateColumns:`repeat(${colonne},1fr)`, gap:'10px', marginBottom:'24px' }}>
          {(block.items||[]).map((item,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'12px 16px', background:'#fff', border:'1px solid #E5E7EB', borderRadius:'8px' }}>
              <span style={{ color:block.colore||cp, fontWeight:'800', fontSize:'16px', flexShrink:0 }}>{item.icona||'✓'}</span>
              <span style={{ fontSize:'14px', color:'#374151', fontWeight:'500' }}>{item.testo}</span>
            </div>
          ))}
        </div>
      </Animate>
    )
  }

  if (block.tipo === 'cta') {
    const br = block.stile==='pill'?'999px':block.stile==='contorno'?'8px':'8px'
    const btnBg = block.stile==='contorno'?'transparent':block.colore||cp
    const btnColor = block.stile==='contorno'?block.colore||cp:'#fff'
    const btnBorder = block.stile==='contorno'?`2px solid ${block.colore||cp}`:'none'
    return (
      <Animate animation="fadein">
        <div style={{ background:`linear-gradient(135deg, ${cp}10, ${cp}06)`, border:`1px solid ${cp}25`, borderRadius:'16px', padding:'36px 28px', textAlign:'center', marginBottom:'24px' }}>
          {block.titolo&&<h2 style={{ fontSize:'clamp(18px,3vw,28px)', fontWeight:'900', color:'#0A0A0A', letterSpacing:'-.03em', margin:'0 0 20px' }}>{block.titolo}</h2>}
          <a href="#lp-form" style={{ display:'inline-block', background:btnBg, color:btnColor, border:btnBorder, borderRadius:br, padding:'14px 36px', fontSize:'15px', fontWeight:'800', textDecoration:'none', transition:'transform .15s,box-shadow .15s' }}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 8px 20px ${cp}40`}}
            onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none'}}>
            {block.testo_btn||'Contattaci →'}
          </a>
        </div>
      </Animate>
    )
  }

  if (block.tipo === 'banner') {
    const configs = { info:{bg:'#EFF6FF',color:'#1E40AF',border:'#BFDBFE'}, success:{bg:'#D1FAE5',color:'#065F46',border:'#6EE7B7'}, warning:{bg:'#FFFBEB',color:'#92400E',border:'#FDE68A'}, error:{bg:'#FEF2F2',color:'#991B1B',border:'#FECACA'} }
    const c = configs[block.stile||'info']
    return (
      <Animate animation="slidein">
        <div style={{ background:c.bg, border:`1px solid ${c.border}`, borderRadius:'10px', padding:'16px 20px', marginBottom:'16px', display:'flex', alignItems:'flex-start', gap:'12px' }}>
          {block.icona&&<span style={{ fontSize:'18px', flexShrink:0 }}>{block.icona}</span>}
          <p style={{ margin:0, fontSize:'14px', color:c.color, lineHeight:'1.6', fontWeight:'500' }}>{block.testo}</p>
        </div>
      </Animate>
    )
  }

  if (block.tipo === 'timeline') return (
    <Animate animation="fadeup">
      <div style={{ position:'relative', marginBottom:'32px' }}>
        <div style={{ position:'absolute', left:'20px', top:'8px', bottom:'8px', width:'2px', background:`linear-gradient(to bottom, ${cp}, ${cp}30)` }} />
        {(block.items||[]).map((item,i)=>(
          <Animate key={i} animation="slidein" delay={i*120}>
            <div style={{ display:'flex', gap:'20px', marginBottom:'28px', paddingLeft:'4px' }}>
              <div style={{ flexShrink:0, width:'36px', height:'36px', borderRadius:'50%', background:cp, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'800', zIndex:1, boxShadow:`0 0 0 4px ${cp}20` }}>
                {item.anno||i+1}
              </div>
              <div style={{ paddingTop:'4px' }}>
                <h4 style={{ fontSize:'16px', fontWeight:'800', color:'#0A0A0A', margin:'0 0 6px', letterSpacing:'-.02em' }}>{item.titolo}</h4>
                <p style={{ fontSize:'14px', color:'#6B7280', lineHeight:'1.65', margin:0 }}>{item.testo}</p>
              </div>
            </div>
          </Animate>
        ))}
      </div>
    </Animate>
  )

  if (block.tipo === 'accordion') return (
    <Animate animation="fadeup">
      <div style={{ marginBottom:'24px' }}>
        {(block.items||[]).map((item,i)=>(
          <AccordionItem key={i} domanda={item.domanda} risposta={item.risposta} cp={cp} />
        ))}
      </div>
    </Animate>
  )

  if (block.tipo === 'video') {
    const embed = videoEmbedUrl(block.url)
    if (!embed) return null
    return (
      <Animate animation="fadein">
        <div style={{ marginBottom:'24px' }}>
          <div style={{ position:'relative', paddingBottom:'56.25%', height:0, borderRadius:'12px', overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.15)' }}>
            <iframe src={embed} style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', border:'none' }} allowFullScreen title="video" />
          </div>
          {block.didascalia&&<p style={{ fontSize:'13px', color:'#9CA3AF', textAlign:'center', marginTop:'8px', fontStyle:'italic' }}>{block.didascalia}</p>}
        </div>
      </Animate>
    )
  }

  if (block.tipo === 'testimonial') return (
    <Animate animation="fadeup">
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min((block.items||[]).length,2)},1fr)`, gap:'16px', marginBottom:'24px' }}>
        {(block.items||[]).map((item,i)=>(
          <Animate key={i} animation="fadeup" delay={i*100}>
            <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:'12px', padding:'24px', position:'relative' }}>
              <span style={{ fontSize:'40px', color:cp, opacity:.15, position:'absolute', top:'12px', left:'20px', lineHeight:1, fontFamily:'serif' }}>"</span>
              <p style={{ fontSize:'15px', color:'#374151', lineHeight:'1.7', margin:'0 0 16px', position:'relative', zIndex:1, fontStyle:'italic' }}>{item.testo}</p>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:cp, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:'800', fontSize:'14px', flexShrink:0 }}>
                  {(item.nome||'?')[0].toUpperCase()}
                </div>
                <div>
                  <p style={{ margin:0, fontSize:'13px', fontWeight:'700', color:'#0A0A0A' }}>{item.nome}</p>
                  {item.ruolo&&<p style={{ margin:0, fontSize:'12px', color:'#9CA3AF' }}>{item.ruolo}</p>}
                </div>
              </div>
            </div>
          </Animate>
        ))}
      </div>
    </Animate>
  )

  if (block.tipo === 'countdown') return (
    <Animate animation="fadein">
      <div style={{ marginBottom:'24px' }}>
        <Countdown data={block.data} titolo={block.titolo} messaggio_scaduto={block.messaggio_scaduto} cp={cp} />
      </div>
    </Animate>
  )

  if (block.tipo === 'immagine') {
    const maxW = block.size==='small'?'33%':block.size==='medium'?'60%':'100%'
    const align = block.align||'center'
    return (
      <Animate animation="fadein">
        <div style={{ marginBottom:'16px', textAlign:align }}>
          {block.src&&<img src={block.src} alt={block.didascalia||''} style={{ maxWidth:maxW, width:'100%', display:'inline-block', borderRadius:'8px' }} />}
          {block.didascalia&&<p style={{ fontSize:'13px', color:'#9CA3AF', marginTop:'8px', fontStyle:'italic' }}>{block.didascalia}</p>}
        </div>
      </Animate>
    )
  }

  if (block.tipo === 'separatore') return <hr style={{ border:'none', borderTop:'1px solid #E5E7EB', margin:'32px 0' }} />

  return null
}

// ── Form contatti ─────────────────────────────────────────────────
function FormContatti({ lp, tema }) {
  const cp = tema.colore_primario||'#003DA5'
  const [form, setForm] = useState({ nome:'', cognome:'', email:'', telefono:'', azienda:'', citta:'', consenso_privacy:false, consenso_newsletter:false })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [err, setErr] = useState('')

  const fields = lp.form_fields&&lp.form_fields.length>0
    ? lp.form_fields
    : [{key:'nome',enabled:true},{key:'cognome',enabled:true},{key:'email',enabled:true,required:true},{key:'telefono',enabled:false}]
  const labels = { nome:'Nome', cognome:'Cognome', email:'Email *', telefono:'Telefono', azienda:'Azienda', citta:'Città' }
  const types  = { email:'email', telefono:'tel' }

  async function submit(e) {
    e.preventDefault()
    if (!form.email) { setErr("L'email è obbligatoria"); return }
    if (!form.consenso_privacy) { setErr("Il consenso alla privacy è obbligatorio"); return }
    setErr(''); setSubmitting(true)
    const { error } = await supabase.from('lp_contacts').insert({
      landing_page_id:lp.id, nome:form.nome, cognome:form.cognome,
      email:form.email, telefono:form.telefono,
      dati_extra:{ azienda:form.azienda, citta:form.citta },
      consenso_privacy:form.consenso_privacy, consenso_newsletter:form.consenso_newsletter,
    })
    setSubmitting(false)
    if (!error) setSubmitted(true)
    else setErr('Errore nell\'invio. Riprova.')
  }

  const btnRadius = tema.btn_stile==='pill'?'999px':(tema.btn_raggio||'8')+'px'

  if (submitted) return (
    <div style={{ background:'#D1FAE5', border:'1px solid #6EE7B7', borderRadius:'12px', padding:'32px', textAlign:'center' }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" style={{marginBottom:'12px'}}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      <p style={{fontSize:'16px',fontWeight:'700',color:'#065F46',margin:'0 0 4px'}}>Grazie!</p>
      <p style={{fontSize:'14px',color:'#059669',margin:0}}>{lp.form_messaggio_conferma||'Ti ricontatteremo presto.'}</p>
    </div>
  )

  const nome_field = fields.find(f=>f.key==='nome'&&f.enabled)
  const cognome_field = fields.find(f=>f.key==='cognome'&&f.enabled)
  const altri = fields.filter(f=>f.enabled&&f.key!=='nome'&&f.key!=='cognome')

  return (
    <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
      {(nome_field||cognome_field)&&(
        <div style={{ display:'grid', gridTemplateColumns:`${nome_field?'1fr':''}${nome_field&&cognome_field?' ':''}${cognome_field?'1fr':''}`, gap:'14px' }}>
          {nome_field&&<div><label style={lbSt}>{labels.nome}</label><input type="text" value={form.nome} onChange={e=>setForm(p=>({...p,nome:e.target.value}))} style={iSt} /></div>}
          {cognome_field&&<div><label style={lbSt}>{labels.cognome}</label><input type="text" value={form.cognome} onChange={e=>setForm(p=>({...p,cognome:e.target.value}))} style={iSt} /></div>}
        </div>
      )}
      {altri.map(f=>(
        <div key={f.key}><label style={lbSt}>{labels[f.key]||f.key}{f.required?' *':''}</label><input type={types[f.key]||'text'} value={form[f.key]||''} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} style={iSt} /></div>
      ))}
      <label style={{display:'flex',alignItems:'flex-start',gap:'10px',cursor:'pointer'}}>
        <input type="checkbox" checked={form.consenso_privacy} onChange={e=>setForm(p=>({...p,consenso_privacy:e.target.checked}))} style={{marginTop:'2px',flexShrink:0,accentColor:cp}} />
        <span style={{fontSize:'13px',color:'#374151',lineHeight:1.5}}>Ho letto e accetto la <a href="#" style={{color:cp}}>Privacy Policy</a> *</span>
      </label>
      <label style={{display:'flex',alignItems:'flex-start',gap:'10px',cursor:'pointer'}}>
        <input type="checkbox" checked={form.consenso_newsletter} onChange={e=>setForm(p=>({...p,consenso_newsletter:e.target.checked}))} style={{marginTop:'2px',flexShrink:0,accentColor:cp}} />
        <span style={{fontSize:'13px',color:'#374151',lineHeight:1.5}}>Desidero ricevere comunicazioni da CNA Roma</span>
      </label>
      {err&&<p style={{fontSize:'13px',color:'#DC2626',margin:0}}>{err}</p>}
      <button type="submit" disabled={submitting} style={{
        background:tema.colore_pulsanti||cp, color:tema.colore_testo_btn||'#fff',
        border:'none', borderRadius:btnRadius, padding:'14px', fontFamily:'Inter,sans-serif',
        fontSize:'15px', fontWeight:'700', cursor:'pointer', transition:'transform .15s,box-shadow .15s'
      }}
        onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow=`0 6px 16px ${cp}40`}}
        onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none'}}>
        {submitting?'Invio...':(lp.form_bottone_testo||'Invia')}
      </button>
    </form>
  )
}

const lbSt = { display:'block', fontSize:'13px', fontWeight:'600', color:'#374151', marginBottom:'5px' }
const iSt  = { width:'100%', boxSizing:'border-box', padding:'11px 14px', border:'1px solid #E5E7EB', borderRadius:'8px', fontSize:'15px', fontFamily:'Inter,sans-serif', outline:'none', color:'#0A0A0A' }

// ── Pagina pubblica ───────────────────────────────────────────────
export default function LandingPagePublic() {
  const { slug } = useParams()
  const [lp, setLp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    supabase.from('landing_pages').select('*').eq('slug',slug).eq('stato','pubblicata').single()
      .then(({data}) => { if(!data) setNotFound(true); else setLp(data); setLoading(false) })
  }, [slug])

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#fff',fontFamily:'Inter,sans-serif'}}>
      <div style={{textAlign:'center'}}>
        <div style={{width:'40px',height:'40px',border:'3px solid #E5E7EB',borderTop:'3px solid #003DA5',borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto 12px'}} />
        <p style={{color:'#9CA3AF',fontSize:'14px',margin:0}}>Caricamento...</p>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (notFound) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#fff',fontFamily:'Inter,sans-serif',flexDirection:'column',gap:'12px'}}>
      <img src={LOGO_URL} alt="CNA Roma" style={{height:'48px',objectFit:'contain'}} />
      <p style={{color:'#9CA3AF',fontSize:'14px',margin:0}}>Pagina non trovata</p>
    </div>
  )

  const tema = temaConDefault(lp.tema)
  const cp   = tema.colore_primario||'#003DA5'
  const textAlign = lp.hero_layout==='sinistra'?'left':lp.hero_layout==='destra'?'right':'center'
  const alignItems = lp.hero_layout==='sinistra'?'flex-start':lp.hero_layout==='destra'?'flex-end':'center'
  const hasContenuto = lp.contenuto&&lp.contenuto.length>0

  return (
    <div style={{fontFamily:'Inter,sans-serif',background:tema.sfondo_pagina||'#fff',minHeight:'100vh'}}>
      <style>{RICH_CSS}{`
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes heroIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .lp-hero-content{animation:heroIn .8s ease .2s both}
        .lp-hero-logo{animation:heroIn .6s ease both}
      `}</style>

      {/* HERO */}
      <div style={{
        position:'relative', minHeight:'520px', display:'flex', flexDirection:'column',
        alignItems, justifyContent:'center', padding:'60px 24px',
        background: lp.hero_immagine_url?`url(${lp.hero_immagine_url}) center/cover no-repeat`:cp,
      }}>
        <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.45)'}} />
        <div className="lp-hero-logo" style={{position:'relative',zIndex:1,textAlign:'center',width:'100%',marginBottom:'40px'}}>
          <img src={LOGO_URL} alt="CNA Roma" style={{height:(tema.logo_altezza||'44')+'px',objectFit:'contain',filter:'brightness(0) invert(1)'}} />
        </div>
        <div className="lp-hero-content" style={{position:'relative',zIndex:1,maxWidth:'740px',textAlign,width:'100%'}}>
          {lp.hero_titolo&&<h1 style={{fontSize:'clamp(28px,5vw,56px)',fontWeight:'900',color:'#fff',margin:'0 0 16px',letterSpacing:'-0.04em',lineHeight:1.05}}>{lp.hero_titolo}</h1>}
          {lp.hero_sottotitolo&&<p style={{fontSize:'clamp(15px,2vw,20px)',color:'rgba(255,255,255,.88)',margin:'0 0 28px',lineHeight:1.65,fontWeight:'400'}}>{lp.hero_sottotitolo}</p>}
          {lp.form_abilitato&&(
            <a href="#lp-form" style={{
              display:'inline-block', background:'#fff', color:cp,
              borderRadius:tema.btn_stile==='pill'?'999px':'8px',
              padding:'14px 32px', fontSize:'15px', fontWeight:'800', textDecoration:'none',
              transition:'transform .15s,box-shadow .15s'
            }}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.3)'}}
              onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none'}}>
              {lp.form_bottone_testo||'Contattaci'} →
            </a>
          )}
        </div>
      </div>

      {/* CONTENUTO */}
      {hasContenuto&&(
        <div style={{maxWidth:'800px',margin:'0 auto',padding:'64px 24px'}}>
          {lp.contenuto.map((block,i)=>(
            <BlockRenderer key={block.id||i} block={block} cp={cp} />
          ))}
        </div>
      )}

      {/* FORM */}
      {lp.form_abilitato&&(
        <div id="lp-form" style={{background:tema.sfondo_sezioni||'#F9FAFB',padding:'64px 24px'}}>
          <div style={{maxWidth:'520px',margin:'0 auto'}}>
            <Animate animation="fadeup">
              {lp.form_titolo&&<h2 style={{fontSize:'28px',fontWeight:'800',color:tema.heading_colore||'#0A0A0A',margin:'0 0 8px',letterSpacing:'-0.03em',textAlign:'center'}}>{lp.form_titolo}</h2>}
              {lp.form_testo&&<p style={{fontSize:'15px',color:tema.testo_colore||'#6B7280',textAlign:'center',margin:'0 0 32px',lineHeight:1.6}}>{lp.form_testo}</p>}
            </Animate>
            <FormContatti lp={lp} tema={tema} />
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer style={{background:tema.sfondo_footer||'#0A0A0A',padding:'36px 24px',textAlign:'center'}}>
        <img src={LOGO_URL} alt="CNA Roma" style={{height:'36px',objectFit:'contain',filter:'brightness(0) invert(1)',marginBottom:'12px',display:'block',margin:'0 auto 12px'}} />
        {lp.footer_testo&&<p style={{fontSize:'13px',color:tema.testo_footer||'rgba(255,255,255,0.5)',margin:'0 0 4px'}}>{lp.footer_testo}</p>}
        <p style={{fontSize:'12px',color:'rgba(255,255,255,0.3)',margin:0}}>© {new Date().getFullYear()} CNA Roma</p>
      </footer>
    </div>
  )
}
