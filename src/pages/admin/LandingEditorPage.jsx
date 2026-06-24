import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import ImageUploader from '../../components/editor/ImageUploader'
import BlockEditor, { newBlock } from '../../components/editor/BlockEditor'
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

// Campi standard form — visibilità toggle
const FORM_FIELDS_STD = [
  { key:'nome',      label:'Nome',     default_on: true },
  { key:'cognome',   label:'Cognome',  default_on: true },
  { key:'email',     label:'Email',    default_on: true,  required: true },
  { key:'telefono',  label:'Telefono', default_on: false },
  { key:'azienda',   label:'Azienda',  default_on: false },
  { key:'citta',     label:'Città',    default_on: false },
]

export default function LandingEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState('info')
  const [data, setData] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { load() }, [id])

  async function load() {
    const { data: lp } = await supabase.from('landing_pages').select('*').eq('id', id).single()
    if (lp) {
      // Normalizza form_fields se vuoto — imposta default
      if (!lp.form_fields || lp.form_fields.length === 0) {
        lp.form_fields = FORM_FIELDS_STD.map(f => ({ ...f, enabled: f.default_on }))
      }
      setData(lp)
    }
  }

  function upd(field, value) {
    setData(d => ({ ...d, [field]: value }))
    setSaved(false)
  }

  async function save() {
    setSaving(true)
    const { error } = await supabase.from('landing_pages').update({
      titolo: data.titolo,
      slug: data.slug,
      stato: data.stato,
      hero_titolo: data.hero_titolo,
      hero_sottotitolo: data.hero_sottotitolo,
      hero_immagine_url: data.hero_immagine_url,
      hero_layout: data.hero_layout,
      contenuto: data.contenuto,
      tema: data.tema,
      form_abilitato: data.form_abilitato,
      form_titolo: data.form_titolo,
      form_testo: data.form_testo,
      form_fields: data.form_fields,
      form_bottone_testo: data.form_bottone_testo,
      form_messaggio_conferma: data.form_messaggio_conferma,
      footer_testo: data.footer_testo,
      meta_descrizione: data.meta_descrizione,
    }).eq('id', id)
    setSaving(false)
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2500) }
  }

  if (!data) return <div style={{ padding:'40px', color:'#9CA3AF', fontSize:'14px' }}>Caricamento...</div>

  const publicUrl = `${window.location.origin}/lp/${data.slug}`
  const tema = temaConDefault(data.tema)

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
            Vedi pagina
          </a>
        )}
        <button onClick={save} disabled={saving} style={{
          background: saved ? '#059669' : '#003DA5', color:'#fff', border:'none', borderRadius:'8px',
          padding:'8px 18px', fontFamily:'Inter,sans-serif', fontSize:'13px', fontWeight:'700', cursor:'pointer', minWidth:'80px', transition:'background .2s'
        }}>
          {saving ? '...' : saved ? '✓ Salvato' : 'Salva'}
        </button>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ background:'#fff', borderBottom:'1px solid #E5E7EB', padding:'0 20px', display:'flex', gap:'0', flexShrink:0, overflowX:'auto' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            background:'none', border:'none', borderBottom: tab === t.key ? '2px solid #003DA5' : '2px solid transparent',
            color: tab === t.key ? '#003DA5' : '#6B7280', fontWeight: tab === t.key ? '700' : '500',
            fontSize:'13px', padding:'12px 16px', cursor:'pointer', fontFamily:'Inter,sans-serif',
            whiteSpace:'nowrap', marginBottom:'-1px', transition:'color .15s'
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── Content ── */}
      <div style={{ flex:1, overflow:'auto', padding:'24px' }}>
        <div style={{ maxWidth:'760px' }}>

          {/* INFO */}
          {tab === 'info' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
              <Field label="Titolo interno" hint="Visibile solo nell'admin">
                <input value={data.titolo} onChange={e => upd('titolo', e.target.value)} style={inputSt} />
              </Field>
              <Field label="Slug URL" hint={`La pagina sarà accessibile su /lp/${data.slug}`}>
                <input value={data.slug} onChange={e => upd('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} style={inputSt} />
              </Field>
              <Field label="Meta descrizione" hint="Usata da Google e nei link condivisi sui social">
                <textarea value={data.meta_descrizione || ''} onChange={e => upd('meta_descrizione', e.target.value)} rows={3} style={{ ...inputSt, resize:'vertical' }} />
              </Field>
              <Field label="Testo footer">
                <textarea value={data.footer_testo || ''} onChange={e => upd('footer_testo', e.target.value)} rows={2} style={{ ...inputSt, resize:'vertical' }} />
              </Field>
            </div>
          )}

          {/* HERO */}
          {tab === 'hero' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
              <Field label="Immagine di sfondo">
                <ImageUploader
                  value={data.hero_immagine_url || null}
                  onChange={url => upd('hero_immagine_url', url || '')}
                />
              </Field>
              <Field label="Titolo hero">
                <input value={data.hero_titolo || ''} onChange={e => upd('hero_titolo', e.target.value)} style={inputSt} placeholder="Es. Scopri i servizi CNA Roma per la tua impresa" />
              </Field>
              <Field label="Sottotitolo hero">
                <textarea value={data.hero_sottotitolo || ''} onChange={e => upd('hero_sottotitolo', e.target.value)} rows={3} style={{ ...inputSt, resize:'vertical' }} placeholder="Breve descrizione del valore offerto..." />
              </Field>
              <Field label="Allineamento testo">
                <div style={{ display:'flex', gap:'8px' }}>
                  {[['centrato','Centro'],['sinistra','Sinistra'],['destra','Destra']].map(([v,l]) => (
                    <button key={v} onClick={() => upd('hero_layout', v)} style={{
                      padding:'8px 16px', borderRadius:'8px', border:'1px solid',
                      borderColor: data.hero_layout === v ? '#003DA5' : '#E5E7EB',
                      background: data.hero_layout === v ? '#EFF6FF' : '#fff',
                      color: data.hero_layout === v ? '#003DA5' : '#374151',
                      fontWeight: data.hero_layout === v ? '700' : '500',
                      fontSize:'13px', cursor:'pointer', fontFamily:'Inter,sans-serif'
                    }}>{l}</button>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {/* CONTENUTO */}
          {tab === 'contenuto' && (
            <div>
              <p style={{ fontSize:'13px', color:'#6B7280', margin:'0 0 16px', lineHeight:'1.6' }}>
                Aggiungi sezioni di contenuto che appariranno sotto l'hero. Stessi blocchi usati negli eventi.
              </p>
              <BlockEditor
                blocks={data.contenuto || []}
                onChange={blocks => upd('contenuto', blocks)}
              />
            </div>
          )}

          {/* FORM */}
          {tab === 'form' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
              <label style={{ display:'flex', alignItems:'center', gap:'10px', cursor:'pointer' }}>
                <input type="checkbox" checked={!!data.form_abilitato} onChange={e => upd('form_abilitato', e.target.checked)}
                  style={{ width:'16px', height:'16px', cursor:'pointer', accentColor:'#003DA5' }} />
                <span style={{ fontSize:'14px', fontWeight:'700', color:'#0A0A0A' }}>Form contatti abilitato</span>
              </label>

              {data.form_abilitato && (<>
                <Field label="Titolo del form">
                  <input value={data.form_titolo || ''} onChange={e => upd('form_titolo', e.target.value)} style={inputSt} />
                </Field>
                <Field label="Testo introduttivo">
                  <textarea value={data.form_testo || ''} onChange={e => upd('form_testo', e.target.value)} rows={3} style={{ ...inputSt, resize:'vertical' }} />
                </Field>
                <Field label="Testo pulsante">
                  <input value={data.form_bottone_testo || ''} onChange={e => upd('form_bottone_testo', e.target.value)} style={inputSt} />
                </Field>
                <Field label="Messaggio di conferma">
                  <input value={data.form_messaggio_conferma || ''} onChange={e => upd('form_messaggio_conferma', e.target.value)} style={inputSt} />
                </Field>

                {/* Campi standard toggle */}
                <div>
                  <p style={{ fontSize:'13px', fontWeight:'700', color:'#374151', margin:'0 0 10px' }}>Campi del form</p>
                  <div style={{ border:'1px solid #E5E7EB', borderRadius:'8px', overflow:'hidden' }}>
                    {FORM_FIELDS_STD.map((f, i) => {
                      const saved = (data.form_fields || []).find(x => x.key === f.key)
                      const enabled = saved ? saved.enabled : f.default_on
                      const isRequired = f.required
                      return (
                        <div key={f.key} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'11px 16px', borderBottom: i < FORM_FIELDS_STD.length-1 ? '1px solid #F3F4F6' : 'none', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                          <input type="checkbox" checked={enabled || isRequired} disabled={isRequired}
                            onChange={() => {
                              const fields = FORM_FIELDS_STD.map(ff => {
                                const cur = (data.form_fields||[]).find(x => x.key === ff.key)
                                const curEnabled = cur ? cur.enabled : ff.default_on
                                return { ...ff, enabled: ff.key === f.key ? !enabled : curEnabled }
                              })
                              upd('form_fields', fields)
                            }}
                            style={{ width:'15px', height:'15px', cursor: isRequired ? 'default' : 'pointer', accentColor:'#003DA5', flexShrink:0 }}
                          />
                          <span style={{ fontSize:'14px', color: enabled || isRequired ? '#0A0A0A' : '#9CA3AF', fontWeight: enabled || isRequired ? '500' : '400', flex:1 }}>{f.label}</span>
                          {isRequired && <span style={{ fontSize:'11px', color:'#9CA3AF', fontStyle:'italic' }}>obbligatorio</span>}
                        </div>
                      )
                    })}
                    {/* Consensi — sempre presenti */}
                    {['Consenso privacy (obbligatorio)', 'Consenso newsletter (opzionale)'].map((l, i) => (
                      <div key={l} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'11px 16px', borderTop:'1px solid #F3F4F6', background: i === 0 ? '#FEF9C3' : '#F0FDF4' }}>
                        <input type="checkbox" checked disabled style={{ width:'15px', height:'15px', accentColor:'#003DA5', flexShrink:0 }} />
                        <span style={{ fontSize:'14px', color:'#0A0A0A', flex:1 }}>{l}</span>
                        <span style={{ fontSize:'11px', color:'#9CA3AF', fontStyle:'italic' }}>sempre incluso</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>)}
            </div>
          )}

          {/* ASPETTO */}
          {tab === 'aspetto' && (
            <AspettoTab
              tema={tema}
              onChange={t => upd('tema', t)}
            />
          )}

          {/* PREVIEW */}
          {tab === 'preview' && (
            <div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
                <p style={{ fontSize:'13px', color:'#6B7280', margin:0 }}>
                  Salva prima di visualizzare l'anteprima per vedere le ultime modifiche.
                </p>
                <a href={`/lp/${data.slug}`} target="_blank" rel="noreferrer" style={{ fontSize:'13px', color:'#003DA5', fontWeight:'700', textDecoration:'none', display:'flex', alignItems:'center', gap:'4px' }}>
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

function Field({ label, hint, children }) {
  return (
    <div>
      {label && <label style={{ display:'block', fontSize:'13px', fontWeight:'700', color:'#374151', marginBottom:'6px' }}>{label}</label>}
      {hint && <p style={{ fontSize:'12px', color:'#9CA3AF', margin:'-2px 0 6px' }}>{hint}</p>}
      {children}
    </div>
  )
}

const inputSt = {
  width:'100%', boxSizing:'border-box', padding:'10px 12px',
  border:'1px solid #E5E7EB', borderRadius:'8px',
  fontSize:'14px', fontFamily:'Inter,sans-serif', outline:'none', color:'#0A0A0A', background:'#fff'
}
