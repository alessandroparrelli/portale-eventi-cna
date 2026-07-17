import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { RICH_CSS } from '../../components/editor/RichEditor'
import { temaConDefault } from '../../components/editor/AspettoTab'
import SocialLinks from '../../components/SocialLinks'
import { useSocial } from '../../hooks/useSocial'
import BlockRenderer, { Animate } from '../../components/public/BlockRenderer'

const LOGO_URL = 'https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png'

/* ── PATTERN PALLINI DECORATIVI ──────────────────────── */
function generaPalliniSVG(c1, c2, opacita, angolo) {
  const o = (parseInt(opacita) || 25) / 100
  const dots = []
  const seed = [
    {x:82,y:5,r:4,c:1},{x:88,y:3,r:3,c:2},{x:95,y:6,r:5,c:1},
    {x:78,y:10,r:3,c:2},{x:85,y:12,r:6,c:1},{x:91,y:9,r:3,c:2},{x:97,y:11,r:4,c:1},
    {x:72,y:16,r:3,c:1},{x:80,y:18,r:5,c:2},{x:87,y:15,r:3,c:1},{x:93,y:19,r:4,c:2},{x:98,y:17,r:3,c:1},
    {x:68,y:23,r:4,c:2},{x:75,y:25,r:3,c:1},{x:83,y:22,r:5,c:2},{x:90,y:26,r:3,c:1},{x:96,y:24,r:4,c:2},
    {x:63,y:30,r:3,c:1},{x:71,y:32,r:4,c:2},{x:78,y:29,r:3,c:1},{x:86,y:33,r:6,c:2},{x:93,y:31,r:3,c:1},
    {x:58,y:37,r:5,c:2},{x:66,y:39,r:3,c:1},{x:74,y:36,r:4,c:2},{x:81,y:40,r:3,c:1},{x:89,y:38,r:5,c:2},{x:96,y:36,r:3,c:1},
    {x:55,y:44,r:3,c:1},{x:62,y:46,r:4,c:2},{x:70,y:43,r:3,c:1},{x:77,y:47,r:5,c:2},{x:84,y:45,r:3,c:1},{x:92,y:43,r:4,c:2},
    {x:50,y:51,r:4,c:2},{x:58,y:53,r:3,c:1},{x:66,y:50,r:5,c:2},{x:73,y:54,r:3,c:1},{x:80,y:52,r:4,c:2},
  ]
  if (angolo) {
    for (const d of seed) dots.push(`<circle cx="${d.x}%" cy="${d.y}%" r="${d.r}" fill="${d.c===1?c1:c2}" opacity="${o}"/>`)
  } else {
    const allDots = [...seed, ...seed.map(d => ({x:100-d.x,y:100-d.y,r:d.r,c:d.c})),
      {x:30,y:35,r:4,c:1},{x:45,y:60,r:3,c:2},{x:20,y:70,r:5,c:1},{x:55,y:20,r:3,c:2},
      {x:35,y:80,r:4,c:2},{x:15,y:45,r:3,c:1},{x:40,y:15,r:4,c:2},{x:25,y:55,r:3,c:1}]
    for (const d of allDots) dots.push(`<circle cx="${d.x}%" cy="${d.y}%" r="${d.r}" fill="${d.c===1?c1:c2}" opacity="${o}"/>`)
  }
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1200 800">${dots.join('')}</svg>`)}`
}

function PatternOverlay({ tema }) {
  const pattern = tema.sfondo_pattern
  if (!pattern || pattern === 'nessuno') return null
  const c1 = tema.pattern_colore1 || '#003DA5'
  const c2 = tema.pattern_colore2 || '#E8792F'
  const svg = generaPalliniSVG(c1, c2, tema.pattern_opacita || '25', pattern === 'pallini_angolo')
  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
      backgroundImage: `url("${svg}")`,
      backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'top right',
    }} />
  )
}


// ── Form contatti (campi standard + custom) ───────────────────────
function FormContatti({ lp, tema }) {
  const cp = tema.colore_primario||'#003DA5'
  const [values, setValues] = useState({})
  const [privacy, setPrivacy] = useState(false)
  const [newsletter, setNewsletter] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [err, setErr] = useState('')

  const fields = (lp.form_fields&&lp.form_fields.length>0)
    ? lp.form_fields.filter(f=>f.enabled!==false)
    : [{key:'nome',label:'Nome',tipo:'testo',enabled:true,std:true},{key:'cognome',label:'Cognome',tipo:'testo',enabled:true,std:true},{key:'email',label:'Email',tipo:'email',enabled:true,required:true,std:true}]

  function setVal(key, val) { setValues(p=>({...p,[key]:val})) }
  function toggleMulti(key, val) {
    setValues(p=>{const cur=Array.isArray(p[key])?p[key]:[]; return {...p,[key]:cur.includes(val)?cur.filter(x=>x!==val):[...cur,val]}})
  }

  async function submit(e) {
    e.preventDefault()
    const emailF = fields.find(f=>f.tipo==='email'||f.key==='email')
    if (emailF&&!values[emailF.key]) { setErr("L'email è obbligatoria"); return }
    const miss = fields.filter(f=>f.required&&!values[f.key])
    if (miss.length>0) { setErr('Campo obbligatorio: '+miss[0].label); return }
    if (!privacy) { setErr("Il consenso alla privacy è obbligatorio"); return }
    setErr(''); setSubmitting(true)
    const std={}; const extra={}
    for (const f of fields) {
      if (['nome','cognome','email','telefono'].includes(f.key)) std[f.key]=values[f.key]||''
      else extra[f.key]=values[f.key]
    }
    const {error} = await supabase.from('lp_contacts').insert({
      landing_page_id:lp.id,...std,dati_extra:extra,
      consenso_privacy:privacy,consenso_newsletter:newsletter,
    })
    setSubmitting(false)
    if (!error) {
      // Invia email passando i dati direttamente (evita problema RLS su SELECT)
      supabase.functions.invoke('send-contact-email', {
        body: {
          lp_id: lp.id,
          lp_titolo: lp.titolo,
          lp_slug: lp.slug,
          email_responsabile: lp.email_responsabile || null,
          email_mittente: lp.email_mittente || null,
          nome_mittente: lp.nome_mittente || null,
          email_cc: lp.email_cc || null,
          nome: std.nome || '',
          cognome: std.cognome || '',
          email: std.email || '',
          telefono: std.telefono || '',
          dati_extra: extra,
          consenso_privacy: privacy,
          consenso_newsletter: newsletter,
        }
      }).catch(e => console.warn('Email send failed:', e))
      setSubmitted(true)
    } else {
      setErr("Errore nell'invio. Riprova.")
    }
  }

  const btnR = tema.btn_stile==='pill'?'999px':(tema.btn_raggio||'8')+'px'

  if (submitted) return (
    <div style={{background:'#D1FAE5',border:'1px solid #6EE7B7',borderRadius:'12px',padding:'32px',textAlign:'center'}}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" style={{marginBottom:'12px'}}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      <p style={{fontSize:'16px',fontWeight:'700',color:'#065F46',margin:'0 0 4px'}}>Grazie!</p>
      <p style={{fontSize:'14px',color:'#059669',margin:0}}>{lp.form_messaggio_conferma||'Ti ricontatteremo presto.'}</p>
    </div>
  )

  const nomeF    = fields.find(f=>f.key==='nome')
  const cognomeF = fields.find(f=>f.key==='cognome')
  const altriF   = fields.filter(f=>f.key!=='nome'&&f.key!=='cognome')

  function renderField(f) {
    const val = values[f.key]||''
    const lbl = <label style={lbSt}>{f.label}{f.required?' *':''}</label>
    if (f.tipo==='textarea') return (
      <div key={f.key}>{lbl}
        <textarea value={val} onChange={e=>setVal(f.key,e.target.value)} placeholder={f.placeholder||''} rows={3}
          style={{...iSt,resize:'vertical',fontFamily:'Inter,sans-serif'}}/>
      </div>
    )
    if (f.tipo==='select') return (
      <div key={f.key}>{lbl}
        <select value={val} onChange={e=>setVal(f.key,e.target.value)} style={iSt}>
          <option value="">{f.placeholder||'Seleziona...'}</option>
          {(f.opzioni||[]).map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    )
    if (f.tipo==='radio') return (
      <div key={f.key}>{lbl}
        <div style={{display:'flex',flexWrap:'wrap',gap:'8px',marginTop:'4px'}}>
          {(f.opzioni||[]).map(o=>(
            <button type="button" key={o.value} onClick={()=>setVal(f.key,o.value)} style={{
              padding:'8px 16px',border:`1.5px solid ${val===o.value?cp:'#D1D5DB'}`,
              borderRadius:'8px',background:val===o.value?cp:'#fff',
              color:val===o.value?'#fff':'#374151',fontSize:'13px',fontWeight:'600',
              cursor:'pointer',fontFamily:'Inter,sans-serif',transition:'all .15s'
            }}>{o.label}</button>
          ))}
        </div>
      </div>
    )
    if (f.tipo==='checkbox') {
      const sel = Array.isArray(values[f.key])?values[f.key]:[]
      return (
        <div key={f.key}>{lbl}
          <div style={{display:'flex',flexWrap:'wrap',gap:'8px',marginTop:'4px'}}>
            {(f.opzioni||[]).map(o=>{
              const on=sel.includes(o.value)
              return (
                <button type="button" key={o.value} onClick={()=>toggleMulti(f.key,o.value)} style={{
                  padding:'8px 16px',border:`1.5px solid ${on?cp:'#D1D5DB'}`,
                  borderRadius:'8px',background:on?cp:'#fff',
                  color:on?'#fff':'#374151',fontSize:'13px',fontWeight:'600',
                  cursor:'pointer',fontFamily:'Inter,sans-serif',transition:'all .15s',
                  display:'flex',alignItems:'center',gap:'6px'
                }}>
                  {on&&<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                  {o.label}
                </button>
              )
            })}
          </div>
        </div>
      )
    }
    return (
      <div key={f.key}>{lbl}
        <input type={f.tipo||'text'} value={val} onChange={e=>setVal(f.key,e.target.value)}
          placeholder={f.placeholder||''} style={iSt}/>
      </div>
    )
  }

  return (
    <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:'14px'}}>
      {(nomeF||cognomeF)&&(
        <div className="lp-form-name-row" style={{display:'grid',gridTemplateColumns:`${nomeF?'1fr':''}${nomeF&&cognomeF?' ':''}${cognomeF?'1fr':''}`,gap:'12px'}}>
          {nomeF&&<div><label style={lbSt}>{nomeF.label}</label><input type="text" value={values.nome||''} onChange={e=>setVal('nome',e.target.value)} placeholder={nomeF.placeholder||''} style={iSt}/></div>}
          {cognomeF&&<div><label style={lbSt}>{cognomeF.label}</label><input type="text" value={values.cognome||''} onChange={e=>setVal('cognome',e.target.value)} placeholder={cognomeF.placeholder||''} style={iSt}/></div>}
        </div>
      )}
      {altriF.map(f=>renderField(f))}
      <label style={{display:'flex',alignItems:'flex-start',gap:'10px',cursor:'pointer'}}>
        <input type="checkbox" checked={privacy} onChange={e=>setPrivacy(e.target.checked)} style={{marginTop:'2px',flexShrink:0,accentColor:cp}}/>
        <span style={{fontSize:'13px',color:'#374151',lineHeight:1.5}}>Ho letto e accetto la <a href="#" style={{color:cp}}>Privacy Policy</a> *</span>
      </label>
      <label style={{display:'flex',alignItems:'flex-start',gap:'10px',cursor:'pointer'}}>
        <input type="checkbox" checked={newsletter} onChange={e=>setNewsletter(e.target.checked)} style={{marginTop:'2px',flexShrink:0,accentColor:cp}}/>
        <span style={{fontSize:'13px',color:'#374151',lineHeight:1.5}}>Desidero ricevere comunicazioni da CNA Roma</span>
      </label>
      {err&&<p style={{fontSize:'13px',color:'#DC2626',margin:0}}>{err}</p>}
      <button type="submit" disabled={submitting} style={{
        background:tema.colore_pulsanti||cp,color:tema.colore_testo_btn||'#fff',
        border:'none',borderRadius:btnR,padding:'14px',fontFamily:'Inter,sans-serif',
        fontSize:'15px',fontWeight:'700',cursor:'pointer',transition:'transform .15s,box-shadow .15s'
      }}
        onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow=`0 6px 16px ${cp}40`}}
        onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none'}}>
        {submitting?'Invio...':(lp.form_bottone_testo||'Invia')}
      </button>
    </form>
  )
}


const lbSt = { display:'block', fontSize:'13px', fontWeight:'600', color:'#374151', marginBottom:'6px' }
const iSt  = { width:'100%', boxSizing:'border-box', padding:'11px 14px', border:'1px solid #E5E7EB', borderRadius:'8px', fontSize:'15px', fontFamily:'Inter,sans-serif', outline:'none', color:'#0A0A0A' }

// ── Pagina pubblica ───────────────────────────────────────────────
export default function LandingPagePublic() {
  const { slug } = useParams()
  const [lp, setLp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    supabase.from('landing_pages').select('*').eq('slug',slug).eq('stato','pubblicata').single()
      .then(({data}) => {
        if(!data) setNotFound(true)
        else {
          setLp(data)
          // Titolo tab del browser = H1 della pagina
          if (data.hero_titolo) document.title = data.hero_titolo + ' — CNA Roma'
          else if (data.titolo) document.title = data.titolo + ' — CNA Roma'
        }
        setLoading(false)
      })
  }, [slug])

  const { links: socialLinks } = useSocial()

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
  const logoSrc = lp.logo_url || LOGO_URL
  const lh = lp.layout_hero || {}
  const altezzaHero = parseInt(lh.altezza||'420')
  const overlayOpacita = parseFloat(lh.overlay_opacita||'50') / 100
  const overlayHexPub = lh.overlay_colore || '#000000'
  const overlayR = parseInt(overlayHexPub.slice(1,3),16), overlayG = parseInt(overlayHexPub.slice(3,5),16), overlayB = parseInt(overlayHexPub.slice(5,7),16)
  const allineamento = lh.allineamento || 'centro'
  const textAlign = allineamento === 'sinistra' ? 'left' : 'center'
  const alignItems = allineamento === 'sinistra' ? 'flex-start' : 'center'
  const bgPosition = lh.bg_position || '50% 50%'
  const logoAltezza = parseInt(lh.logo_altezza||'48')
  const titoloColore = lh.titolo_colore || '#ffffff'
  const titoloSize = lh.titolo_dimensione || 'clamp(26px,5vw,54px)'
  const titoloGrassetto = lh.titolo_grassetto !== false
  const titoloMaiuscolo = !!lh.titolo_maiuscolo
  const titolo2Colore = lh.titolo2_colore || 'rgba(255,255,255,0.88)'
  const _dimMap={'clamp(13px,1.5vw,16px)':'16px','clamp(15px,2vw,20px)':'22px','clamp(18px,2.5vw,26px)':'30px','clamp(22px,3vw,34px)':'40px'}; const titolo2Size = _dimMap[lh.titolo2_dimensione]||lh.titolo2_dimensione||'22px'
  const titolo2Grassetto = !!lh.titolo2_grassetto
  const hasContenuto = lp.contenuto&&lp.contenuto.length>0

  return (
    <div style={{fontFamily:'Inter,sans-serif',background:tema.sfondo_pagina||'#fff',minHeight:'100vh',position:'relative'}}>
      <PatternOverlay tema={tema} />
      <style>{RICH_CSS}{`
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes heroIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .lp-hero-content{animation:heroIn .8s ease .2s both}
        .lp-hero-logo{animation:heroIn .6s ease both}

        /* ── Responsive LP ──────────────────────────── */
        .lp-blocco-titolo h2 { font-size: clamp(20px,5vw,38px) !important; }
        .lp-blocco-titolo p  { font-size: clamp(13px,2.5vw,18px) !important; }

        @media (max-width: 768px) {
          /* Hero: titoli proporzionali */
          .lp-hero-content h1 {
            font-size: clamp(22px, 7vw, 42px) !important;
            letter-spacing: -0.03em !important;
            word-break: break-word !important;
          }
          .lp-hero-content h2 {
            font-size: clamp(15px, 4.5vw, 24px) !important;
          }
          .lp-hero-content p {
            font-size: clamp(13px, 3.5vw, 17px) !important;
          }

          /* Padding hero ridotto */
          .lp-hero-wrap { padding: 40px 16px !important; }

          /* Contenuto blocchi */
          .lp-block-wrap { padding: 32px 16px !important; }

          /* Stats: 2 colonne su mobile */
          .lp-stats { flex-wrap: wrap !important; gap: 16px !important; }
          .lp-stats > div { min-width: calc(50% - 8px) !important; flex: 1 1 calc(50% - 8px) !important; }

          /* Griglia: sempre 1 colonna se card < 280px — auto-fit lo gestisce già */
          /* Badge list: max 2 col */

          /* Timeline: più spazio al testo */
          .lp-timeline-text { overflow-wrap: break-word !important; word-break: break-word !important; }

          /* Testimonial card: testo leggibile */
          .lp-testimonial-grid > div { min-width: 100% !important; }

          /* Form: nome+cognome in colonna unica */
          .lp-form-name-row { grid-template-columns: 1fr !important; }

          /* Bottone CTA */
          .lp-cta-btn { width: 100% !important; text-align: center !important; box-sizing: border-box !important; }

          /* Titoli blocco contenuto */
          .lp-section-title { font-size: clamp(20px, 5.5vw, 32px) !important; }
          .lp-section-sub   { font-size: clamp(12px, 3vw, 16px) !important; }
        }
      `}</style>

      {/* HERO */}
      <div className="lp-hero-wrap" style={{
        position:'relative', minHeight:altezzaHero+'px', display:'flex', flexDirection:'column',
        alignItems, justifyContent:'center', padding:'60px 24px',
        background: lp.hero_immagine_url?`url(${lp.hero_immagine_url}) ${bgPosition}/cover no-repeat`:(lh.hero_sfondo||cp),
      }}>
        <div style={{position:'absolute',inset:0,background:`rgba(${overlayR},${overlayG},${overlayB},${overlayOpacita})`}} />
        <div className="lp-hero-logo" style={{position:'relative',zIndex:1,textAlign:'center',width:'100%',marginBottom:'36px'}}>
          <div style={{
            background: lh.logo_sfondo==='bianco' ? '#FFFFFF'
                      : lh.logo_sfondo==='colore_primario' ? cp
                      : 'transparent',
            padding: lh.logo_sfondo && lh.logo_sfondo !== 'trasparente' ? '5px 12px' : 0,
            borderRadius: '6px',
            display: 'inline-flex', alignItems: 'center',
          }}>
            <img src={logoSrc} alt="CNA Roma" style={{height:logoAltezza+'px',objectFit:'contain',display:'block'}} />
          </div>
        </div>
        <div className="lp-hero-content" style={{position:'relative',zIndex:1,maxWidth:'740px',textAlign,width:'100%',overflowWrap:'break-word'}}>
          {lp.hero_titolo&&<h1 style={{fontSize:titoloSize,fontWeight:titoloGrassetto?'900':'400',color:titoloColore,margin:'0 0 12px',letterSpacing:'-0.04em',lineHeight:1.05,textTransform:titoloMaiuscolo?'uppercase':'none'}}>{lp.hero_titolo}</h1>}
          {lp.hero_titolo2&&<h2 style={{fontSize:titolo2Size,fontWeight:titolo2Grassetto?'700':'400',color:titolo2Colore,margin:'0 0 20px',letterSpacing:'-0.02em',lineHeight:1.3}}>{lp.hero_titolo2}</h2>}
          {lp.hero_sottotitolo&&<p style={{fontSize:'clamp(14px,1.8vw,18px)',color:'rgba(255,255,255,.80)',margin:'0 0 28px',lineHeight:1.7,fontWeight:'400'}}>{lp.hero_sottotitolo}</p>}
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
        <div className="lp-block-wrap" style={{maxWidth:'800px',margin:'0 auto',padding:'clamp(32px,6vw,64px) clamp(16px,4vw,40px)'}}>
          {lp.contenuto.map((block,i)=>(
            <BlockRenderer key={block.id||i} block={block} cp={cp} />
          ))}
        </div>
      )}

      {/* FORM */}
      {lp.form_abilitato&&(
        <div id="lp-form" style={{background:tema.sfondo_sezioni||'#F9FAFB',padding:'clamp(32px,6vw,64px) clamp(16px,4vw,24px)'}}>
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
        <img src={logoSrc} alt="CNA Roma" style={{height:'36px',objectFit:'contain',display:'block',margin:'0 auto 12px'}} />
        {lp.footer_testo&&<p style={{fontSize:'13px',color:tema.testo_footer||'rgba(255,255,255,0.5)',margin:'0 0 4px'}}>{lp.footer_testo}</p>}
        <p style={{fontSize:'12px',color:'rgba(255,255,255,0.3)',margin:0}}>© {new Date().getFullYear()} CNA Roma</p>
        <SocialLinks links={socialLinks} size={20} gap={14} color={tema.testo_footer||'rgba(255,255,255,0.5)'} style={{ marginTop:'14px', justifyContent:'center' }} />
      </footer>
    </div>
  )
}
