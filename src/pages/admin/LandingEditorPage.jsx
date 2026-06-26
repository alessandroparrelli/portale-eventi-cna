import React, { useState, useEffect } from 'react'
const DIM_MAP={'clamp(13px,1.5vw,16px)':'16px','clamp(15px,2vw,20px)':'22px','clamp(18px,2.5vw,26px)':'30px','clamp(22px,3vw,34px)':'40px'}
function normDim(v){return DIM_MAP[v]||v||'22px'}

import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import ImageUploader from '../../components/editor/ImageUploader'
import BlockEditor from '../../components/editor/BlockEditor'
import LogoManager from '../../components/editor/LogoManager'
import HeroDragPreview from '../../components/editor/HeroDragPreview'
import AspettoTab, { TEMA_DEFAULT, temaConDefault } from '../../components/editor/AspettoTab'

const TABS = [
  { key:'info',      label:'Info' },
  { key:'hero',      label:'Hero' },
  { key:'contenuto', label:'Contenuto' },
  { key:'form',      label:'Form' },
  { key:'aspetto',   label:'Aspetto' },
  { key:'preview',   label:'Anteprima' },
]

const STATO_OPTS = [
  { value:'bozza',      label:'Bozza' },
  { value:'pubblicata', label:'Pubblicata' },
  { value:'archiviata', label:'Archiviata' },
]

// Tipi di campo custom supportati
const FIELD_TYPES = [
  { value:'testo',    label:'Testo libero' },
  { value:'email',    label:'Email' },
  { value:'tel',      label:'Telefono' },
  { value:'textarea', label:'Testo lungo' },
  { value:'select',   label:'Menu a tendina' },
  { value:'radio',    label:'Scelta singola (bottoni)' },
  { value:'checkbox', label:'Scelta multipla (bottoni)' },
  { value:'number',   label:'Numero' },
]

// Campi standard sempre presenti (non eliminabili)
const STD_FIELDS = [
  { key:'nome',     label:'Nome',     tipo:'testo',  default_on:true  },
  { key:'cognome',  label:'Cognome',  tipo:'testo',  default_on:true  },
  { key:'email',    label:'Email',    tipo:'email',  default_on:true,  required:true },
  { key:'telefono', label:'Telefono', tipo:'tel',    default_on:false  },
  { key:'azienda',  label:'Azienda',  tipo:'testo',  default_on:false  },
  { key:'citta',    label:'Città',    tipo:'testo',  default_on:false  },
]

const LAYOUT_HERO_DEFAULT = {
  altezza: '420',
  overlay_opacita: '50',
  allineamento: 'centro',
  titolo_colore: '#FFFFFF',
  titolo_dimensione: 'clamp(26px,5vw,54px)',
  titolo_grassetto: true,
  titolo_maiuscolo: false,
  bg_position: '50% 50%',
  logo_altezza: '48',
}

function uid() { return Math.random().toString(36).slice(2,9) }

export default function LandingEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState('info')
  const [data, setData] = useState(null)
  const dataRef = React.useRef(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  // campo custom in modifica
  const [editingField, setEditingField] = useState(null) // null | { index, field }

  useEffect(() => { load() }, [id])

  async function load() {
    const { data: lp } = await supabase.from('landing_pages').select('*').eq('id', id).single()
    if (lp) {
      if (!lp.layout_hero) lp.layout_hero = { ...LAYOUT_HERO_DEFAULT }
      if (!lp.form_fields) lp.form_fields = STD_FIELDS.map(f => ({ ...f, std:true, enabled:f.default_on }))
      setData(lp)
      dataRef.current = lp
    }
  }

  function upd(field, value) {
    setData(d => {
      const next = { ...d, [field]: value }
      dataRef.current = next
      return next
    })
    setSaved(false)
  }

  // helper per layout_hero
  function setH(k) {
    return v => {
      const val = typeof v === 'boolean' ? v : typeof v === 'string' ? v : v?.target?.value
      setData(p => {
        const next = { ...p, layout_hero: { ...(p.layout_hero||LAYOUT_HERO_DEFAULT), [k]: val } }
        dataRef.current = next
        return next
      })
      setSaved(false)
    }
  }

  // Adattatore AspettoTab (si aspetta { event, setEvent })
  const fakeEvent = data ? {
    ...data,
    colore_primario: data.tema?.colore_primario || '#003DA5',
    colore_sfondo: data.tema?.sfondo_pagina || '#ffffff',
  } : null
  function setFakeEvent(updater) {
    setData(prev => {
      const u = typeof updater === 'function' ? updater(prev) : updater
      const next = { ...prev, logo_url: u.logo_url ?? prev.logo_url, tema: u.tema ?? prev.tema }
      dataRef.current = next
      return next
    })
    setSaved(false)
  }

  async function save() {
    const d = dataRef.current || data
    if (!d) return
    setSaving(true)
    const { error } = await supabase.from('landing_pages').update({
      titolo: d.titolo, slug: d.slug, stato: d.stato,
      hero_titolo: d.hero_titolo, hero_sottotitolo: d.hero_sottotitolo,
      hero_titolo2: d.hero_titolo2,
      hero_immagine_url: d.hero_immagine_url, hero_layout: d.hero_layout,
      layout_hero: d.layout_hero, logo_url: d.logo_url,
      contenuto: d.contenuto, tema: d.tema,
      form_abilitato: d.form_abilitato, form_titolo: d.form_titolo,
      form_testo: d.form_testo, form_fields: d.form_fields,
      form_bottone_testo: d.form_bottone_testo,
      form_messaggio_conferma: d.form_messaggio_conferma,
      footer_testo: d.footer_testo, meta_descrizione: d.meta_descrizione,
      email_responsabile: d.email_responsabile || null,
      email_mittente: d.email_mittente || null,
      email_cc: d.email_cc || null,
      nome_mittente: d.nome_mittente || null,
    }).eq('id', id)
    setSaving(false)
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2500) }
  }

  if (!data) return (
    <div style={{ padding:'40px', color:'#9CA3AF', fontSize:'14px', fontFamily:'Inter,sans-serif' }}>
      Caricamento...
    </div>
  )

  const lh = data.layout_hero || LAYOUT_HERO_DEFAULT
  const publicUrl = `${window.location.origin}/lp/${data.slug}`

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'#F9FAFB', fontFamily:'Inter,sans-serif' }}>

      {/* ── Header ── */}
      <div style={{ background:'#fff', borderBottom:'1px solid #E5E7EB', padding:'0 20px', display:'flex', alignItems:'center', gap:'12px', height:'56px', flexShrink:0 }}>
        <button onClick={() => navigate('/admin/landing')} style={{ background:'none', border:'none', cursor:'pointer', padding:'4px', color:'#6B7280' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ margin:0, fontSize:'15px', fontWeight:'700', color:'#0A0A0A', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{data.titolo}</p>
          <p style={{ margin:0, fontSize:'11px', color:'#9CA3AF' }}>/lp/{data.slug}</p>
        </div>
        <select value={data.stato} onChange={e => upd('stato', e.target.value)}
          style={{ padding:'6px 10px', border:'1px solid #E5E7EB', borderRadius:'6px', fontSize:'13px', fontFamily:'Inter,sans-serif', outline:'none', cursor:'pointer' }}>
          {STATO_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {data.stato === 'pubblicata' && (
          <a href={publicUrl} target="_blank" rel="noreferrer" style={{ fontSize:'12px', color:'#003DA5', textDecoration:'none', display:'flex', alignItems:'center', gap:'4px', background:'#EFF6FF', padding:'6px 10px', borderRadius:'6px', fontWeight:'600' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Vedi
          </a>
        )}
        <button onClick={save} disabled={saving} style={{
          background: saved ? '#059669' : '#003DA5', color:'#fff', border:'none', borderRadius:'8px',
          padding:'8px 18px', fontFamily:'Inter,sans-serif', fontSize:'13px', fontWeight:'700',
          cursor:'pointer', minWidth:'80px', transition:'background .2s'
        }}>
          {saving ? '...' : saved ? '✓ Salvato' : 'Salva'}
        </button>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ background:'#fff', borderBottom:'1px solid #E5E7EB', padding:'0 20px', display:'flex', flexShrink:0, overflowX:'auto' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            background:'none', border:'none',
            borderBottom: tab === t.key ? '2px solid #003DA5' : '2px solid transparent',
            color: tab === t.key ? '#003DA5' : '#6B7280',
            fontWeight: tab === t.key ? '700' : '500',
            fontSize:'13px', padding:'12px 16px', cursor:'pointer',
            fontFamily:'Inter,sans-serif', whiteSpace:'nowrap', marginBottom:'-1px'
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── Contenuto ── */}
      <div style={{ flex:1, overflow:'auto', padding:'24px' }}>
        <div style={{ maxWidth: tab === 'aspetto' ? '100%' : '760px' }}>

          {/* ═══ INFO ═══ */}
          {tab === 'info' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
              <Field label="Titolo interno" hint="Visibile solo nell'admin">
                <input value={data.titolo} onChange={e => upd('titolo', e.target.value)} style={iSt} />
              </Field>
              <Field label="Slug URL" hint={`Pagina accessibile su /lp/${data.slug}`}>
                <input value={data.slug} onChange={e => upd('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'-'))} style={iSt} />
              </Field>
              <Field label="Meta descrizione" hint="Usata da Google e nei link condivisi">
                <textarea value={data.meta_descrizione||''} onChange={e => upd('meta_descrizione', e.target.value)} rows={3} style={{ ...iSt, resize:'vertical' }} />
              </Field>
              <Field label="Testo footer">
                <textarea value={data.footer_testo||''} onChange={e => upd('footer_testo', e.target.value)} rows={2} style={{ ...iSt, resize:'vertical' }} />
              </Field>

              {/* ── Impostazioni email ── */}
              <div style={{ background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:'10px', padding:'16px', display:'flex', flexDirection:'column', gap:'12px' }}>
                <p style={{ margin:0, fontSize:'12px', fontWeight:'700', color:'#6B7280', textTransform:'uppercase', letterSpacing:'.06em' }}>Impostazioni email</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                  <Field label="Indirizzo mittente" hint="Default: marketing@cnaroma.it">
                    <input type="email" value={data.email_mittente||''} onChange={e => upd('email_mittente', e.target.value)} placeholder="marketing@cnaroma.it" style={iSt} />
                  </Field>
                  <Field label="Nome mittente" hint="Es. Agroalimentare CNA di Roma">
                    <input value={data.nome_mittente||''} onChange={e => upd('nome_mittente', e.target.value)} placeholder="CNA Roma" style={iSt} />
                  </Field>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                  <Field label="Destinatario principale" hint="Riceve ogni nuovo contatto">
                    <input type="email" value={data.email_responsabile||''} onChange={e => upd('email_responsabile', e.target.value)} placeholder="es. responsabile@cnaroma.it" style={iSt} />
                  </Field>
                </div>
                <Field label="Altri destinatari (CC)" hint="Separati da virgola — ricevono copia di ogni contatto">
                  <input value={data.email_cc||''} onChange={e => upd('email_cc', e.target.value)} placeholder="es. direzione@cnaroma.it, segreteria@cnaroma.it" style={iSt} />
                </Field>
              </div>
            </div>
          )}

          {/* ═══ HERO ═══ */}
          {tab === 'hero' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>

              {/* Logo */}
              <div style={{ padding:'16px', background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:'10px' }}>
                <p style={{ fontSize:'12px', fontWeight:'700', color:'#6B7280', textTransform:'uppercase', letterSpacing:'.06em', margin:'0 0 10px' }}>
                  🏷 Logo header
                </p>
                <LogoManager value={data.logo_url} onChange={url => upd('logo_url', url)} />

                <div style={{ marginTop:'14px' }}>
                  <Field label={`Dimensione logo: ${lh.logo_altezza||'48'}px`}>
                    <input type="range" min="28" max="160" step="4"
                      value={lh.logo_altezza||'48'} onChange={setH('logo_altezza')}
                      style={{ width:'100%' }} />
                  </Field>
                  {/* Anteprima logo con dimensione corrente */}
                  <div style={{ marginTop:'10px', padding:'12px', background:'#1a1a2e', borderRadius:'8px', textAlign:'center' }}>
                    <div style={{
                      background: (lh.logo_sfondo||'trasparente')==='bianco' ? '#fff'
                                : (lh.logo_sfondo||'trasparente')==='colore_primario' ? (data.tema?.colore_primario||'#003DA5')
                                : 'transparent',
                      padding: (lh.logo_sfondo && lh.logo_sfondo!=='trasparente') ? '5px 12px' : 0,
                      borderRadius:'6px', display:'inline-flex', alignItems:'center'
                    }}>
                      <img
                        src={data.logo_url || 'https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png'}
                        alt="Logo preview"
                        style={{ height: (lh.logo_altezza||'48')+'px', objectFit:'contain', display:'block' }}
                      />
                    </div>
                    <p style={{ fontSize:'10px', color:'rgba(255,255,255,0.5)', margin:'6px 0 0' }}>Anteprima su sfondo scuro</p>
                  </div>
                </div>
                <div style={{ marginTop:'10px' }}>
                  <Field label="Sfondo del logo" hint="Utile per rendere il logo leggibile sull'hero">
                    <div style={{ display:'flex', gap:'8px' }}>
                      {[
                        ['trasparente', '⬜ Trasparente'],
                        ['bianco',      '🤍 Bianco'],
                        ['colore_primario', '🎨 Colore tema'],
                      ].map(([v, l]) => (
                        <button key={v} onClick={() => setH('logo_sfondo')(v)} style={{
                          flex:1, padding:'8px 6px',
                          border:`1px solid ${(lh.logo_sfondo||'trasparente')===v?'#003DA5':'#E5E7EB'}`,
                          borderRadius:'6px',
                          background:(lh.logo_sfondo||'trasparente')===v?'#EEF3FF':'#fff',
                          cursor:'pointer', fontSize:'12px', fontWeight:'600',
                          fontFamily:'Inter,sans-serif',
                          color:(lh.logo_sfondo||'trasparente')===v?'#003DA5':'#6B7280'
                        }}>{l}</button>
                      ))}
                    </div>
                    <p style={{ fontSize:'11px', color:'#9CA3AF', margin:'4px 0 0' }}>
                      "Trasparente" mostra il logo com'è · "Bianco" aggiunge sfondo bianco per sfondi scuri
                    </p>
                  </Field>
                </div>
              </div>

              {/* Immagine hero */}
              <Field label="Immagine di sfondo">
                <ImageUploader
                  value={data.hero_immagine_url||null}
                  onChange={url => upd('hero_immagine_url', url||'')}
                />
              </Field>

              {/* Controlli layout */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'16px' }}>
                <Field label={`Altezza hero: ${lh.altezza||'420'}px`}>
                  <input type="range" min="220" max="700" step="20"
                    value={lh.altezza||'420'} onChange={setH('altezza')}
                    style={{ width:'100%' }} />
                </Field>
                <Field label={`Opacità overlay: ${lh.overlay_opacita||'50'}%`}>
                  <input type="range" min="0" max="90" step="5"
                    value={lh.overlay_opacita||'50'} onChange={setH('overlay_opacita')}
                    style={{ width:'100%' }} />
                </Field>
                <Field label="Allineamento testo">
                  <div style={{ display:'flex', gap:'6px' }}>
                    {['sinistra','centro'].map(a => (
                      <button key={a} onClick={() => setH('allineamento')(a)} style={{
                        flex:1, padding:'8px 6px', border:`1px solid ${lh.allineamento===a?'#003DA5':'#E5E7EB'}`,
                        borderRadius:'6px', background:lh.allineamento===a?'#EEF3FF':'#fff',
                        cursor:'pointer', fontSize:'12px', fontWeight:'600', fontFamily:'Inter,sans-serif',
                        color:lh.allineamento===a?'#003DA5':'#6B7280'
                      }}>
                        {a === 'sinistra' ? '◀ Sin.' : '▶ Centro'}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>

              {/* Testi hero */}
              <Field label="Titolo principale (H1)">
                <input value={data.hero_titolo||''} onChange={e => upd('hero_titolo', e.target.value)} style={iSt} placeholder="Il titolo grande in evidenza" />
              </Field>
              <Field label="Secondo titolo (H2 — opzionale)" hint="Appare sotto il titolo principale, più piccolo">
                <input value={data.hero_titolo2||''} onChange={e => upd('hero_titolo2', e.target.value)} style={iSt} placeholder="Es. Sottotitolo di lancio, slogan, frase chiave..." />
              </Field>
              <Field label="Testo descrittivo (paragrafo)" hint="Testo più leggero sotto i titoli">
                <textarea value={data.hero_sottotitolo||''} onChange={e => upd('hero_sottotitolo', e.target.value)} rows={3} style={{ ...iSt, resize:'vertical' }} />
              </Field>

              {/* Stile titoli */}
              <div style={{ padding:'16px', background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:'10px' }}>
                <p style={{ fontSize:'12px', fontWeight:'700', color:'#6B7280', textTransform:'uppercase', letterSpacing:'.06em', margin:'0 0 14px' }}>Stile titolo principale (H1)</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px' }}>
                  <Field label="Colore">
                    <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                      <input type="color"
                        value={/^#[0-9A-Fa-f]{6}$/.test(lh.titolo_colore||'') ? lh.titolo_colore : '#ffffff'}
                        onChange={e => setH('titolo_colore')(e.target.value)}
                        style={{ width:'40px', height:'34px', border:'1px solid #D1D5DB', borderRadius:'6px', cursor:'pointer', padding:'2px', flexShrink:0 }} />
                      <input value={lh.titolo_colore||'#ffffff'}
                        onChange={e => setH('titolo_colore')(e.target.value)}
                        style={{ ...iSt, flex:1, fontSize:'12px' }} />
                    </div>
                  </Field>
                  <Field label="Dimensione">
                    <select value={lh.titolo_dimensione||'clamp(26px,5vw,54px)'}
                      onChange={e => setH('titolo_dimensione')(e.target.value)} style={iSt}>
                      <option value="clamp(20px,3vw,32px)">Piccolo</option>
                      <option value="clamp(24px,4vw,42px)">Medio</option>
                      <option value="clamp(26px,5vw,54px)">Grande</option>
                      <option value="clamp(32px,6vw,68px)">Extra grande</option>
                    </select>
                  </Field>
                  <Field label="Stile">
                    <div style={{ display:'flex', gap:'6px' }}>
                      <button onClick={() => setH('titolo_grassetto')(lh.titolo_grassetto === false ? true : false)} style={{
                        flex:1, padding:'7px', border:`1px solid ${lh.titolo_grassetto!==false?'#003DA5':'#E5E7EB'}`,
                        borderRadius:'6px', background:lh.titolo_grassetto!==false?'#EEF3FF':'#fff',
                        cursor:'pointer', fontSize:'14px', fontWeight:'800', fontFamily:'Inter,sans-serif',
                        color:lh.titolo_grassetto!==false?'#003DA5':'#6B7280'
                      }}>B</button>
                      <button onClick={() => setH('titolo_maiuscolo')(lh.titolo_maiuscolo ? false : true)} style={{
                        flex:1, padding:'7px', border:`1px solid ${lh.titolo_maiuscolo?'#003DA5':'#E5E7EB'}`,
                        borderRadius:'6px', background:lh.titolo_maiuscolo?'#EEF3FF':'#fff',
                        cursor:'pointer', fontSize:'12px', fontWeight:'600', fontFamily:'Inter,sans-serif',
                        color:lh.titolo_maiuscolo?'#003DA5':'#6B7280'
                      }}>AA</button>
                    </div>
                  </Field>
                </div>

                <div style={{ borderTop:'1px solid #E5E7EB', marginTop:'14px', paddingTop:'14px' }}>
                  <p style={{ fontSize:'12px', fontWeight:'700', color:'#6B7280', textTransform:'uppercase', letterSpacing:'.06em', margin:'0 0 12px' }}>Stile secondo titolo (H2)</p>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px' }}>
                    <Field label="Colore">
                      <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                        <input type="color"
                          value={/^#[0-9A-Fa-f]{6}$/.test(lh.titolo2_colore||'') ? lh.titolo2_colore : '#ffffff'}
                          onChange={e => setH('titolo2_colore')(e.target.value)}
                          style={{ width:'40px', height:'34px', border:'1px solid #D1D5DB', borderRadius:'6px', cursor:'pointer', padding:'2px', flexShrink:0 }} />
                        <input value={lh.titolo2_colore||''}
                          onChange={e => setH('titolo2_colore')(e.target.value)}
                          placeholder="#ffffff" style={{ ...iSt, flex:1, fontSize:'12px' }} />
                      </div>
                    </Field>
                    <Field label="Dimensione">
                      <select value={normDim(lh.titolo2_dimensione)||'22px'}
                        onChange={e => setH('titolo2_dimensione')(e.target.value)} style={iSt}>
                        <option value="16px">Piccolo (16px)</option>
                        <option value="22px">Medio (22px)</option>
                        <option value="30px">Grande (30px)</option>
                        <option value="40px">Extra grande (40px)</option>
                      </select>
                    </Field>
                    <Field label="Stile">
                      <div style={{ display:'flex', gap:'6px' }}>
                        <button onClick={() => setH('titolo2_grassetto')(lh.titolo2_grassetto ? false : true)} style={{
                          flex:1, padding:'7px', border:`1px solid ${lh.titolo2_grassetto?'#003DA5':'#E5E7EB'}`,
                          borderRadius:'6px', background:lh.titolo2_grassetto?'#EEF3FF':'#fff',
                          cursor:'pointer', fontSize:'14px', fontWeight:'800', fontFamily:'Inter,sans-serif',
                          color:lh.titolo2_grassetto?'#003DA5':'#6B7280'
                        }}>B</button>
                      </div>
                    </Field>
                  </div>
                </div>
              </div>

              {/* Posizione immagine drag */}
              <HeroDragPreview
                event={{ ...data, immagine_hero: data.hero_immagine_url, layout_hero: lh }}
                setH={setH}
              />
            </div>
          )}

          {/* ═══ CONTENUTO ═══ */}
          {tab === 'contenuto' && (
            <div>
              <p style={{ fontSize:'13px', color:'#6B7280', margin:'0 0 16px', lineHeight:'1.6' }}>
                Aggiungi sezioni di contenuto che appariranno sotto l'hero della pagina.
              </p>
              <BlockEditor blocks={data.contenuto||[]} onChange={blocks => upd('contenuto', blocks)} />
            </div>
          )}

          {/* ═══ FORM ═══ */}
          {tab === 'form' && (
            <FormTab data={data} upd={upd} editingField={editingField} setEditingField={setEditingField} />
          )}

          {/* ═══ ASPETTO ═══ */}
          {tab === 'aspetto' && fakeEvent && (
            <AspettoTab event={fakeEvent} setEvent={setFakeEvent} />
          )}

          {/* ═══ PREVIEW ═══ */}
          {tab === 'preview' && (
            <div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
                <p style={{ fontSize:'13px', color:'#6B7280', margin:0 }}>Salva prima di vedere le modifiche.</p>
                <a href={`/lp/${data.slug}`} target="_blank" rel="noreferrer"
                  style={{ fontSize:'13px', color:'#003DA5', fontWeight:'700', textDecoration:'none', display:'flex', alignItems:'center', gap:'4px' }}>
                  Apri in nuova scheda
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </a>
              </div>
              <div style={{ border:'1px solid #E5E7EB', borderRadius:'12px', overflow:'hidden', aspectRatio:'16/10' }}>
                <iframe src={`/lp/${data.slug}`} style={{ width:'100%', height:'100%', border:'none' }} title="Anteprima" />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// TAB FORM — gestione campi standard + custom
// ═══════════════════════════════════════════════════════
function FormTab({ data, upd, editingField, setEditingField }) {
  const fields = data.form_fields || STD_FIELDS.map(f => ({ ...f, std:true, enabled:f.default_on }))

  function setFields(f) { upd('form_fields', f) }

  function toggleStd(key) {
    setFields(fields.map(f => f.key === key ? { ...f, enabled: !f.enabled } : f))
  }

  function addCustom() {
    const newField = { id: Math.random().toString(36).slice(2,9), key: 'campo_' + Date.now(), label: 'Nuovo campo', tipo: 'testo', required: false, opzioni: [], std: false, enabled: true }
    const newFields = [...fields, newField]
    setFields(newFields)
    setEditingField({ index: newFields.length - 1, field: newField })
  }

  function deleteCustom(idx) {
    setFields(fields.filter((_,i) => i !== idx))
    if (editingField?.index === idx) setEditingField(null)
  }

  function moveField(idx, dir) {
    const arr = [...fields]
    const j = idx + dir
    if (j < 0 || j >= arr.length) return
    ;[arr[idx], arr[j]] = [arr[j], arr[idx]]
    setFields(arr)
    if (editingField?.index === idx) setEditingField({ ...editingField, index: j })
  }

  function saveEdit(idx, updated) {
    setFields(fields.map((f,i) => i === idx ? { ...updated, std: f.std } : f))
    setEditingField(null)
  }

  const stdFields = fields.filter(f => f.std)
  const customFields = fields.filter(f => !f.std)
  const customStartIdx = fields.findIndex(f => !f.std)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
      {/* Toggle form abilitato */}
      <label style={{ display:'flex', alignItems:'center', gap:'10px', cursor:'pointer' }}>
        <input type="checkbox" checked={!!data.form_abilitato} onChange={e => upd('form_abilitato', e.target.checked)}
          style={{ width:'16px', height:'16px', accentColor:'#003DA5', cursor:'pointer' }} />
        <span style={{ fontSize:'14px', fontWeight:'700', color:'#0A0A0A' }}>Form contatti abilitato</span>
      </label>

      {data.form_abilitato && (<>
        {/* Testi form */}
        <Field label="Titolo del form">
          <input value={data.form_titolo||''} onChange={e => upd('form_titolo', e.target.value)} style={iSt} />
        </Field>
        <Field label="Testo introduttivo">
          <textarea value={data.form_testo||''} onChange={e => upd('form_testo', e.target.value)} rows={3} style={{ ...iSt, resize:'vertical' }} />
        </Field>
        <Field label="Testo pulsante">
          <input value={data.form_bottone_testo||''} onChange={e => upd('form_bottone_testo', e.target.value)} style={iSt} />
        </Field>
        <Field label="Messaggio di conferma">
          <input value={data.form_messaggio_conferma||''} onChange={e => upd('form_messaggio_conferma', e.target.value)} style={iSt} />
        </Field>

        {/* Campi standard */}
        <div>
          <p style={{ fontSize:'13px', fontWeight:'700', color:'#374151', margin:'0 0 10px' }}>Campi standard</p>
          <div style={{ border:'1px solid #E5E7EB', borderRadius:'8px', overflow:'hidden' }}>
            {STD_FIELDS.map((f, i) => {
              const cur = fields.find(x => x.key === f.key)
              const enabled = cur ? cur.enabled : f.default_on
              return (
                <div key={f.key} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'11px 16px', borderBottom: i < STD_FIELDS.length-1 ? '1px solid #F3F4F6' : 'none', background: i%2===0?'#fff':'#FAFAFA' }}>
                  <input type="checkbox" checked={enabled || !!f.required} disabled={!!f.required}
                    onChange={() => toggleStd(f.key)}
                    style={{ width:'15px', height:'15px', accentColor:'#003DA5', cursor:f.required?'default':'pointer', flexShrink:0 }} />
                  <span style={{ fontSize:'14px', color:(enabled||f.required)?'#0A0A0A':'#9CA3AF', flex:1 }}>{f.label}</span>
                  <span style={{ fontSize:'11px', color:'#9CA3AF', background:'#F3F4F6', padding:'2px 7px', borderRadius:'4px' }}>{f.tipo}</span>
                  {f.required && <span style={{ fontSize:'11px', color:'#9CA3AF', fontStyle:'italic' }}>obbligatorio</span>}
                </div>
              )
            })}
            {/* Consensi fissi */}
            {[
              { label:'Consenso privacy',    bg:'#FEF9C3' },
              { label:'Consenso newsletter', bg:'#F0FDF4' },
            ].map((c,i) => (
              <div key={c.label} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'11px 16px', borderTop:'1px solid #F3F4F6', background:c.bg }}>
                <input type="checkbox" checked disabled style={{ width:'15px', height:'15px', flexShrink:0 }} />
                <span style={{ fontSize:'14px', color:'#0A0A0A', flex:1 }}>{c.label}</span>
                <span style={{ fontSize:'11px', color:'#9CA3AF', fontStyle:'italic' }}>sempre incluso</span>
              </div>
            ))}
          </div>
        </div>

        {/* Campi custom */}
        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
            <p style={{ fontSize:'13px', fontWeight:'700', color:'#374151', margin:0 }}>Campi personalizzati</p>
            <button onClick={addCustom} style={{
              background:'#003DA5', color:'#fff', border:'none', borderRadius:'6px',
              padding:'7px 14px', fontFamily:'Inter,sans-serif', fontSize:'12px', fontWeight:'700', cursor:'pointer',
              display:'flex', alignItems:'center', gap:'5px'
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
              Aggiungi campo
            </button>
          </div>

          {customFields.length === 0 && (
            <div style={{ border:'2px dashed #E5E7EB', borderRadius:'8px', padding:'24px', textAlign:'center', color:'#9CA3AF' }}>
              <p style={{ margin:0, fontSize:'13px' }}>Nessun campo personalizzato</p>
              <p style={{ margin:'4px 0 0', fontSize:'12px' }}>Aggiungi tendine, bottoni di scelta, checkbox e altro</p>
            </div>
          )}

          {customFields.length > 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
              {fields.map((f, idx) => {
                if (f.std) return null
                const isEditing = editingField?.index === idx
                return (
                  <div key={f.id||f.key} style={{ border:`1.5px solid ${isEditing?'#003DA5':'#E5E7EB'}`, borderRadius:'8px', overflow:'hidden' }}>
                    {/* Header campo */}
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 14px', background:isEditing?'#EFF6FF':'#FAFAFA', cursor:'pointer' }}
                      onClick={() => setEditingField(isEditing ? null : { index: idx, field: f })}>
                      <span style={{ flex:1, fontSize:'13px', fontWeight:'700', color: isEditing?'#003DA5':'#374151' }}>{f.label}</span>
                      <span style={{ fontSize:'11px', background:'#E5E7EB', color:'#6B7280', padding:'2px 8px', borderRadius:'4px' }}>
                        {FIELD_TYPES.find(t=>t.value===f.tipo)?.label || f.tipo}
                      </span>
                      {!f.required && (
                        <span style={{ fontSize:'11px', color:'#9CA3AF' }}>opzionale</span>
                      )}
                      <button onClick={e=>{e.stopPropagation();moveField(idx,-1)}} style={btnIco} title="Su">↑</button>
                      <button onClick={e=>{e.stopPropagation();moveField(idx,1)}} style={btnIco} title="Giù">↓</button>
                      <button onClick={e=>{e.stopPropagation();deleteCustom(idx)}} style={{...btnIco,color:'#DC2626',borderColor:'#FECACA'}} title="Elimina">✕</button>
                      <span style={{ fontSize:'11px', color:'#9CA3AF' }}>{isEditing?'▼':'▶'}</span>
                    </div>
                    {/* Editor campo */}
                    {isEditing && (
                      <FieldEditor
                        field={f}
                        onSave={updated => saveEdit(idx, updated)}
                        onCancel={() => setEditingField(null)}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </>)}
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// EDITOR singolo campo custom
// ═══════════════════════════════════════════════════════
function FieldEditor({ field, onSave, onCancel }) {
  const [f, setF] = useState({ ...field, opzioni: field.opzioni || [] })

  function updF(k, v) { setF(p => ({ ...p, [k]: v })) }

  function addOpzione() {
    setF(p => ({ ...p, opzioni: [...p.opzioni, { value: 'opzione_' + Date.now(), label: 'Opzione' }] }))
  }

  function updOpzione(i, k, v) {
    setF(p => ({ ...p, opzioni: p.opzioni.map((o,j) => j===i ? {...o,[k]:v} : o) }))
  }

  function delOpzione(i) {
    setF(p => ({ ...p, opzioni: p.opzioni.filter((_,j) => j!==i) }))
  }

  const needsOpzioni = ['select','radio','checkbox'].includes(f.tipo)

  return (
    <div style={{ padding:'16px', borderTop:'1px solid #E5E7EB', display:'flex', flexDirection:'column', gap:'14px' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
        <Field label="Etichetta campo">
          <input value={f.label} onChange={e => updF('label', e.target.value)} style={iSt} />
        </Field>
        <Field label="Tipo di campo">
          <select value={f.tipo} onChange={e => updF('tipo', e.target.value)} style={iSt}>
            {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Testo aiuto (placeholder / hint)">
        <input value={f.placeholder||''} onChange={e => updF('placeholder', e.target.value)} style={iSt} placeholder="Testo suggerito all'utente..." />
      </Field>

      <label style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer' }}>
        <input type="checkbox" checked={!!f.required} onChange={e => updF('required', e.target.checked)}
          style={{ width:'15px', height:'15px', accentColor:'#003DA5' }} />
        <span style={{ fontSize:'13px', fontWeight:'600', color:'#374151' }}>Campo obbligatorio</span>
      </label>

      {/* Opzioni per select / radio / checkbox */}
      {needsOpzioni && (
        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
            <p style={{ margin:0, fontSize:'12px', fontWeight:'700', color:'#374151' }}>
              {f.tipo === 'select' ? 'Voci del menu' : 'Opzioni di scelta'}
            </p>
            <button onClick={addOpzione} style={{ background:'#F3F4F6', border:'none', borderRadius:'5px', padding:'5px 10px', fontSize:'12px', fontWeight:'600', color:'#374151', cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
              + Aggiungi opzione
            </button>
          </div>
          {f.opzioni.length === 0 && (
            <p style={{ fontSize:'12px', color:'#9CA3AF', margin:0, fontStyle:'italic' }}>Nessuna opzione. Aggiungine almeno una.</p>
          )}
          <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
            {f.opzioni.map((o, i) => (
              <div key={i} style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                <input value={o.label} onChange={e => updOpzione(i,'label',e.target.value)}
                  placeholder="Etichetta visibile" style={{ ...iSt, flex:2 }} />
                <input value={o.value} onChange={e => updOpzione(i,'value',e.target.value)}
                  placeholder="valore_interno" style={{ ...iSt, flex:1, fontSize:'12px', color:'#9CA3AF' }} />
                <button onClick={() => delOpzione(i)} style={{ ...btnIco, color:'#DC2626', borderColor:'#FECACA', flexShrink:0 }}>✕</button>
              </div>
            ))}
          </div>
          {/* Anteprima */}
          {f.opzioni.length > 0 && (
            <div style={{ marginTop:'12px', padding:'12px', background:'#F9FAFB', borderRadius:'8px' }}>
              <p style={{ fontSize:'11px', fontWeight:'700', color:'#9CA3AF', margin:'0 0 8px', textTransform:'uppercase' }}>Anteprima</p>
              {f.tipo === 'select' && (
                <select disabled style={{ ...iSt, background:'#fff', width:'auto', minWidth:'200px' }}>
                  <option>{f.placeholder || 'Seleziona...'}</option>
                  {f.opzioni.map(o => <option key={o.value}>{o.label}</option>)}
                </select>
              )}
              {(f.tipo === 'radio' || f.tipo === 'checkbox') && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
                  {f.opzioni.map(o => (
                    <div key={o.value} style={{
                      padding:'7px 14px', border:'1px solid #E5E7EB', borderRadius:'6px',
                      fontSize:'13px', fontWeight:'600', color:'#374151', background:'#fff'
                    }}>{o.label}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div style={{ display:'flex', gap:'8px', justifyContent:'flex-end', paddingTop:'4px', borderTop:'1px solid #F3F4F6' }}>
        <button onClick={onCancel} style={{ padding:'8px 16px', border:'1px solid #E5E7EB', borderRadius:'6px', background:'#fff', fontSize:'13px', fontWeight:'600', color:'#374151', cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
          Annulla
        </button>
        <button onClick={() => onSave(f)} style={{ padding:'8px 16px', border:'none', borderRadius:'6px', background:'#003DA5', fontSize:'13px', fontWeight:'700', color:'#fff', cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
          Conferma
        </button>
      </div>
    </div>
  )
}

// ─── helpers ──────────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <div>
      {label && <label style={{ display:'block', fontSize:'13px', fontWeight:'700', color:'#374151', marginBottom:'6px' }}>{label}</label>}
      {hint && <p style={{ fontSize:'12px', color:'#9CA3AF', margin:'-2px 0 6px' }}>{hint}</p>}
      {children}
    </div>
  )
}

const iSt = { width:'100%', boxSizing:'border-box', padding:'10px 12px', border:'1px solid #E5E7EB', borderRadius:'8px', fontSize:'14px', fontFamily:'Inter,sans-serif', outline:'none', color:'#0A0A0A', background:'#fff' }
const btnIco = { background:'none', border:'1px solid #E5E7EB', borderRadius:'5px', cursor:'pointer', width:'26px', height:'26px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', color:'#6B7280', flexShrink:0 }
