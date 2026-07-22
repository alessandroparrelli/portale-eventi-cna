import { useEffect, useState } from 'react'
import { usePageTitle } from '../../hooks/usePageTitle'
import { supabase } from '../../lib/supabase'
import { Btn, Field, Input } from '../../components/ui'
import LogoManager from '../../components/editor/LogoManager'
import ImageUploader from '../../components/editor/ImageUploader'
import { Save, ExternalLink, Eye } from 'lucide-react'

const CFG_ID = '00000000-0000-0000-0000-000000000001'

export default function CalendarioAdminPage() {
  usePageTitle('Calendario pubblico')
  const [cfg, setCfg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.from('calendario_config').select('*').eq('id', CFG_ID).single()
      .then(({ data }) => { setCfg(data); setLoading(false) })
  }, [])

  function upd(field, value) {
    setSaved(false)
    setCfg(prev => ({ ...prev, [field]: value }))
  }

  async function save() {
    setSaving(true)
    await supabase.from('calendario_config').update({
      titolo: cfg.titolo,
      sottotitolo: cfg.sottotitolo,
      hero_immagine_url: cfg.hero_immagine_url,
      logo_url: cfg.logo_url,
      colore_primario: cfg.colore_primario,
      testo_cta: cfg.testo_cta,
      url_cta: cfg.url_cta,
      mostra_landing: cfg.mostra_landing,
      mostra_passati: cfg.mostra_passati,
      testo_sezione_eventi: cfg.testo_sezione_eventi,
      testo_sezione_landing: cfg.testo_sezione_landing,
      updated_at: new Date().toISOString(),
    }).eq('id', CFG_ID)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const iSt = {
    width: '100%', padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: '6px',
    fontSize: '14px', fontFamily: "'Outfit',sans-serif", outline: 'none', boxSizing: 'border-box', color: '#0A0A0A',
  }

  if (loading) return (
    <div style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>Caricamento…</div>
  )

  return (
    <div style={{ width: '100%', maxWidth: '800px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#0A0A0A', letterSpacing: '-0.03em', margin: 0 }}>
            Calendario pubblico
          </h1>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: '4px 0 0' }}>
            Personalizza la pagina pubblica degli eventi
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <a href="/calendario" target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px',
              border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '13px', fontWeight: '600',
              color: '#374151', textDecoration: 'none', fontFamily: "'Outfit',sans-serif" }}>
            <Eye size={15}/> Anteprima
          </a>
          <Btn variant="primary" onClick={save} disabled={saving} size="md">
            <Save size={15}/>
            {saving ? 'Salvataggio…' : saved ? '✓ Salvato!' : 'Salva modifiche'}
          </Btn>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* ── Sezione: Hero ── */}
        <Section title="Hero" icon="🖼">
          <Field label="Titolo principale (H1)">
            <Input value={cfg.titolo || ''} onChange={e => upd('titolo', e.target.value)}
              placeholder="Gli eventi CNA Roma"/>
          </Field>
          <Field label="Sottotitolo hero">
            <textarea value={cfg.sottotitolo || ''} onChange={e => upd('sottotitolo', e.target.value)}
              rows={3} placeholder="Breve descrizione della pagina…"
              style={{ ...iSt, resize: 'vertical' }}/>
          </Field>
          <Field label="Immagine di sfondo hero" hint="Verrà sfocata e oscurata — usa immagini ad alta risoluzione">
            <ImageUploader
              value={cfg.hero_immagine_url || ''}
              onChange={url => upd('hero_immagine_url', url || '')}
            />
          </Field>
        </Section>

        {/* ── Sezione: Identità visiva ── */}
        <Section title="Identità visiva" icon="🎨">
          <Field label="Logo (sovrascrive il logo CNA Roma di default)">
            <LogoManager
              value={cfg.logo_url || ''}
              onChange={url => upd('logo_url', url || '')}
            />
            {cfg.logo_url && (
              <button onClick={() => upd('logo_url', '')}
                style={{ marginTop: '8px', fontSize: '12px', color: '#DC2626', background: 'none',
                  border: 'none', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
                × Ripristina logo default
              </button>
            )}
          </Field>
          <Field label="Colore primario">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input type="color" value={cfg.colore_primario || '#E11D48'}
                onChange={e => upd('colore_primario', e.target.value)}
                style={{ width: '48px', height: '38px', border: '1px solid #D1D5DB', borderRadius: '6px', cursor: 'pointer', padding: '2px' }}/>
              <Input value={cfg.colore_primario || '#E11D48'}
                onChange={e => upd('colore_primario', e.target.value)}
                style={{ maxWidth: '140px' }}/>
              <button onClick={() => upd('colore_primario', '#E11D48')}
                style={{ fontSize: '12px', color: '#9CA3AF', background: 'none', border: 'none',
                  cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
                Reset blu CNA
              </button>
            </div>
          </Field>
        </Section>

        {/* ── Sezione: Link CTA ── */}
        <Section title="Call to action navbar" icon="🔗">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Testo bottone">
              <Input value={cfg.testo_cta || ''} onChange={e => upd('testo_cta', e.target.value)}
                placeholder="cnaroma.it"/>
            </Field>
            <Field label="URL bottone">
              <Input value={cfg.url_cta || ''} onChange={e => upd('url_cta', e.target.value)}
                placeholder="https://www.cnaroma.it"/>
            </Field>
          </div>
        </Section>

        {/* ── Sezione: Testi sezioni ── */}
        <Section title="Titoli sezioni" icon="📝">
          <Field label="Titolo sezione eventi">
            <Input value={cfg.testo_sezione_eventi || ''} onChange={e => upd('testo_sezione_eventi', e.target.value)}
              placeholder="Prossimi eventi"/>
          </Field>
          <Field label="Titolo sezione mestieri">
            <Input value={cfg.testo_sezione_landing || ''} onChange={e => upd('testo_sezione_landing', e.target.value)}
              placeholder="Mestieri e categorie"/>
          </Field>
        </Section>

        {/* ── Sezione: Visibilità ── */}
        <Section title="Visibilità contenuti" icon="👁">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Toggle
              label="Mostra sezione Mestieri (Landing Page)"
              hint="Se disattivato, la pagina mostra solo gli eventi"
              value={cfg.mostra_landing !== false}
              onChange={v => upd('mostra_landing', v)}
            />
            <Toggle
              label="Abilita filtro Passati"
              hint="Permette agli utenti di vedere gli eventi conclusi"
              value={cfg.mostra_passati !== false}
              onChange={v => upd('mostra_passati', v)}
            />
          </div>
        </Section>

        {/* ── Anteprima link ── */}
        <div style={{ backgroundColor: '#F8FAFF', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <p style={{ fontSize: '13px', fontWeight: '700', color: '#1D4ED8', margin: '0 0 3px' }}>
              Link pubblico del calendario
            </p>
            <p style={{ fontSize: '13px', color: '#3B82F6', margin: 0, fontFamily: 'monospace' }}>
              {window.location.origin}/calendario
            </p>
          </div>
          <a href="/calendario" target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px',
              backgroundColor: '#E11D48', color: '#ffffff', borderRadius: '6px',
              fontSize: '13px', fontWeight: '700', textDecoration: 'none', fontFamily: "'Outfit',sans-serif",
              whiteSpace: 'nowrap', flexShrink: 0 }}>
            <ExternalLink size={14}/> Apri pagina
          </a>
        </div>

      </div>
    </div>
  )
}

function Section({ title, icon, children }) {
  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ backgroundColor: '#FAFAFA', borderBottom: '1px solid #E5E7EB', padding: '14px 20px',
        display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '16px' }}>{icon}</span>
        <span style={{ fontSize: '13px', fontWeight: '700', color: '#374151', letterSpacing: '-0.01em' }}>{title}</span>
      </div>
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {children}
      </div>
    </div>
  )
}

function Toggle({ label, hint, value, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
      <div style={{ position: 'relative', width: '40px', height: '22px', flexShrink: 0, marginTop: '1px' }}
        onClick={() => onChange(!value)}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '999px', transition: 'background 0.2s',
          backgroundColor: value ? '#E11D48' : '#D1D5DB' }}/>
        <div style={{ position: 'absolute', top: '3px', left: value ? '21px' : '3px', width: '16px', height: '16px',
          borderRadius: '50%', backgroundColor: '#ffffff', transition: 'left 0.2s',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}/>
      </div>
      <div>
        <p style={{ fontSize: '14px', fontWeight: '600', color: '#0A0A0A', margin: '0 0 2px' }}>{label}</p>
        {hint && <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>{hint}</p>}
      </div>
    </label>
  )
}
