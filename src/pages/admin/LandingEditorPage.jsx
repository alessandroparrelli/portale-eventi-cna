import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const TABS = [
  { key:'info',      label:'Info' },
  { key:'hero',      label:'Hero' },
  { key:'contenuto', label:'Contenuto' },
  { key:'form',      label:'Form contatti' },
  { key:'aspetto',   label:'Aspetto' },
  { key:'preview',   label:'Anteprima' },
]

const STATO_OPTS = [
  { value:'bozza',      label:'Bozza' },
  { value:'pubblicata', label:'Pubblicata' },
  { value:'archiviata', label:'Archiviata' },
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
    if (lp) setData(lp)
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
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2000) }
  }

  if (!data) return <div style={{ padding:'40px', color:'#9CA3AF', fontSize:'14px' }}>Caricamento...</div>

  const publicUrl = `${window.location.origin}/lp/${data.slug}`

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'#F9FAFB' }}>

      {/* Header editor */}
      <div style={{
        background:'#fff', borderBottom:'1px solid #E5E7EB',
        padding:'0 20px', display:'flex', alignItems:'center',
        gap:'12px', height:'56px', flexShrink:0
      }}>
        <button onClick={() => navigate('/admin/landing')} style={{ background:'none', border:'none', cursor:'pointer', padding:'4px', color:'#6B7280' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ margin:0, fontSize:'15px', fontWeight:'700', color:'#0A0A0A', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{data.titolo}</p>
          <p style={{ margin:0, fontSize:'11px', color:'#9CA3AF' }}>/lp/{data.slug}</p>
        </div>

        {/* Stato */}
        <select
          value={data.stato}
          onChange={e => upd('stato', e.target.value)}
          style={{ padding:'6px 10px', border:'1px solid #E5E7EB', borderRadius:'6px', fontSize:'13px', fontFamily:'Inter,sans-serif', outline:'none', cursor:'pointer' }}
        >
          {STATO_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {/* Link pubblico */}
        {data.stato === 'pubblicata' && (
          <a href={publicUrl} target="_blank" rel="noreferrer" style={{
            fontSize:'12px', color:'#003DA5', textDecoration:'none', display:'flex', alignItems:'center', gap:'4px',
            background:'#EFF6FF', padding:'6px 10px', borderRadius:'6px', fontWeight:'600'
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Vedi pagina
          </a>
        )}

        <button onClick={save} disabled={saving} style={{
          background:'#003DA5', color:'#fff', border:'none', borderRadius:'8px',
          padding:'8px 18px', fontFamily:'Inter,sans-serif', fontSize:'13px',
          fontWeight:'700', cursor:'pointer', minWidth:'80px'
        }}>
          {saving ? '...' : saved ? '✓ Salvato' : 'Salva'}
        </button>
      </div>

      {/* Tab bar */}
      <div style={{ background:'#fff', borderBottom:'1px solid #E5E7EB', padding:'0 20px', display:'flex', gap:'4px', flexShrink:0, overflowX:'auto' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            background:'none', border:'none', borderBottom: tab === t.key ? '2px solid #003DA5' : '2px solid transparent',
            color: tab === t.key ? '#003DA5' : '#6B7280', fontWeight: tab === t.key ? '700' : '500',
            fontSize:'13px', padding:'12px 14px', cursor:'pointer', fontFamily:'Inter,sans-serif',
            whiteSpace:'nowrap', marginBottom:'-1px'
          }}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex:1, overflow:'auto', padding:'24px', maxWidth:'800px' }}>

        {/* TAB: INFO */}
        {tab === 'info' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
            <Field label="Titolo interno">
              <input value={data.titolo} onChange={e => upd('titolo', e.target.value)} style={inputSt} />
            </Field>
            <Field label="Slug URL" hint={`La pagina sarà accessibile su /lp/${data.slug}`}>
              <input value={data.slug} onChange={e => upd('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} style={inputSt} />
            </Field>
            <Field label="Meta descrizione" hint="Usata dai motori di ricerca e nei link social">
              <textarea value={data.meta_descrizione || ''} onChange={e => upd('meta_descrizione', e.target.value)} rows={3} style={{ ...inputSt, resize:'vertical' }} />
            </Field>
            <Field label="Testo footer">
              <textarea value={data.footer_testo || ''} onChange={e => upd('footer_testo', e.target.value)} rows={2} style={{ ...inputSt, resize:'vertical' }} />
            </Field>
          </div>
        )}

        {/* TAB: HERO */}
        {tab === 'hero' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
            <Field label="Titolo hero (grande)">
              <input value={data.hero_titolo || ''} onChange={e => upd('hero_titolo', e.target.value)} style={inputSt} />
            </Field>
            <Field label="Sottotitolo hero">
              <textarea value={data.hero_sottotitolo || ''} onChange={e => upd('hero_sottotitolo', e.target.value)} rows={3} style={{ ...inputSt, resize:'vertical' }} />
            </Field>
            <Field label="Immagine di sfondo (URL)">
              <input value={data.hero_immagine_url || ''} onChange={e => upd('hero_immagine_url', e.target.value)} style={inputSt} placeholder="https://..." />
            </Field>
            {data.hero_immagine_url && (
              <div style={{ borderRadius:'8px', overflow:'hidden', maxHeight:'200px' }}>
                <img src={data.hero_immagine_url} alt="" style={{ width:'100%', height:'200px', objectFit:'cover' }} />
              </div>
            )}
            <Field label="Layout testo">
              <select value={data.hero_layout || 'centrato'} onChange={e => upd('hero_layout', e.target.value)} style={{ ...inputSt, cursor:'pointer' }}>
                <option value="centrato">Centrato</option>
                <option value="sinistra">Allineato a sinistra</option>
                <option value="destra">Allineato a destra</option>
              </select>
            </Field>
          </div>
        )}

        {/* TAB: CONTENUTO */}
        {tab === 'contenuto' && (
          <div>
            <p style={{ fontSize:'13px', color:'#6B7280', margin:'0 0 16px' }}>Il sistema di blocchi contenuto sarà disponibile nella prossima versione.</p>
            <div style={{ background:'#F3F4F6', borderRadius:'8px', padding:'24px', textAlign:'center', color:'#9CA3AF' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom:'8px', opacity:.5 }}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
              <p style={{ margin:0, fontSize:'13px' }}>Editor a blocchi — in arrivo</p>
            </div>
          </div>
        )}

        {/* TAB: FORM CONTATTI */}
        {tab === 'form' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
            <Field label="">
              <label style={{ display:'flex', alignItems:'center', gap:'10px', cursor:'pointer' }}>
                <input type="checkbox" checked={data.form_abilitato} onChange={e => upd('form_abilitato', e.target.checked)} style={{ width:'16px', height:'16px', cursor:'pointer' }} />
                <span style={{ fontSize:'14px', fontWeight:'600', color:'#0A0A0A' }}>Form contatti abilitato</span>
              </label>
            </Field>

            {data.form_abilitato && (
              <>
                <Field label="Titolo del form">
                  <input value={data.form_titolo || ''} onChange={e => upd('form_titolo', e.target.value)} style={inputSt} />
                </Field>
                <Field label="Testo introduttivo">
                  <textarea value={data.form_testo || ''} onChange={e => upd('form_testo', e.target.value)} rows={3} style={{ ...inputSt, resize:'vertical' }} />
                </Field>
                <Field label="Testo pulsante invio">
                  <input value={data.form_bottone_testo || ''} onChange={e => upd('form_bottone_testo', e.target.value)} style={inputSt} />
                </Field>
                <Field label="Messaggio di conferma post-invio">
                  <textarea value={data.form_messaggio_conferma || ''} onChange={e => upd('form_messaggio_conferma', e.target.value)} rows={2} style={{ ...inputSt, resize:'vertical' }} />
                </Field>

                <div>
                  <p style={{ fontSize:'13px', fontWeight:'700', color:'#374151', margin:'0 0 8px' }}>Campi standard inclusi automaticamente</p>
                  <div style={{ background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:'8px', padding:'12px 16px' }}>
                    {['Nome', 'Cognome', 'Email', 'Telefono', 'Consenso privacy (obbligatorio)', 'Consenso newsletter'].map(f => (
                      <div key={f} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'6px 0', borderBottom:'1px solid #F3F4F6' }}>
                        <span style={{ fontSize:'12px', color:'#059669' }}>✓</span>
                        <span style={{ fontSize:'13px', color:'#374151' }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize:'12px', color:'#9CA3AF', margin:'8px 0 0' }}>Campi personalizzati aggiuntivi disponibili nella prossima versione</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB: ASPETTO */}
        {tab === 'aspetto' && (
          <div>
            <p style={{ fontSize:'13px', color:'#6B7280', margin:'0 0 16px' }}>Personalizzazione tema colori — in arrivo.</p>
            <div style={{ background:'#F3F4F6', borderRadius:'8px', padding:'24px', textAlign:'center', color:'#9CA3AF' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom:'8px', opacity:.5 }}><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="19" cy="14" r="2.5"/><circle cx="6" cy="14" r="2.5"/><path d="M12 22c-4.97 0-9-1.79-9-4 0-1.29 1.27-2.44 3.24-3.24"/></svg>
              <p style={{ margin:0, fontSize:'13px' }}>Personalizzazione colori — in arrivo</p>
            </div>
          </div>
        )}

        {/* TAB: PREVIEW */}
        {tab === 'preview' && (
          <div>
            <p style={{ fontSize:'13px', color:'#6B7280', margin:'0 0 16px' }}>Anteprima della pagina pubblica.</p>
            <div style={{ border:'1px solid #E5E7EB', borderRadius:'12px', overflow:'hidden', aspectRatio:'16/10' }}>
              <iframe
                src={`/lp/${data.slug}`}
                style={{ width:'100%', height:'100%', border:'none' }}
                title="Anteprima landing page"
              />
            </div>
            <p style={{ fontSize:'12px', color:'#9CA3AF', margin:'8px 0 0', textAlign:'center' }}>
              Salva per vedere le modifiche nell'anteprima
            </p>
          </div>
        )}

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
  fontSize:'14px', fontFamily:'Inter,sans-serif', outline:'none', color:'#0A0A0A'
}
