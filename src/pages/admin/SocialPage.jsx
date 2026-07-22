import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import SocialLinks from '../../components/SocialLinks'

const SOCIAL_META = {
  facebook:  { label:'Facebook',       placeholder:'https://facebook.com/pagina-cna-roma',       color:'#1877F2' },
  instagram: { label:'Instagram',      placeholder:'https://instagram.com/cna_roma',              color:'#E1306C' },
  x:         { label:'X (Twitter)',    placeholder:'https://x.com/cna_roma',                      color:'#000000' },
  linkedin:  { label:'LinkedIn',       placeholder:'https://linkedin.com/company/cna-roma',       color:'#0A66C2' },
  whatsapp:  { label:'Canale WhatsApp',placeholder:'https://whatsapp.com/channel/...',            color:'#25D366' },
  youtube:   { label:'YouTube',        placeholder:'https://youtube.com/@cnaroma',                color:'#FF0000' },
  tiktok:    { label:'TikTok',         placeholder:'https://tiktok.com/@cnaroma',                 color:'#000000' },
  website:   { label:'Sito internet',  placeholder:'https://www.cnaroma.it',                      color:'#E11D48' },
}

const sF = { fontFamily:"'Outfit',sans-serif" }
const inp = { ...sF, fontSize:'14px', padding:'9px 12px', border:'1px solid #D1D5DB', borderRadius:'8px', outline:'none', backgroundColor:'#fff', color:'#0A0A0A', width:'100%', boxSizing:'border-box' }

export default function SocialPage() {
  const [rows, setRows]       = useState([])
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [loading, setLoading] = useState(true)
  const timerRef = useRef()

  useEffect(() => {
    supabase.from('social_config').select('*').order('ordine', { ascending:true })
      .then(({ data }) => { if (data) setRows(data); setLoading(false) })
  }, [])

  function setRow(chiave, patch) {
    setRows(r => r.map(row => row.chiave === chiave ? { ...row, ...patch } : row))
  }

  async function salva() {
    setSaving(true)
    for (const row of rows) {
      await supabase.from('social_config')
        .update({ valore: row.valore || '', attivo: row.attivo, updated_at: new Date().toISOString() })
        .eq('chiave', row.chiave)
    }
    // Invalida cache useSocial
    import('../../hooks/useSocial').then(m => {
      if (m._cache !== undefined) { /* direct module reset not possible, handled at next load */ }
    })
    // Forza invalidazione del modulo
    window.__socialCacheInvalid = true
    setSaving(false)
    setSaved(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setSaved(false), 2500)
  }

  if (loading) return <div style={{ padding:'40px', ...sF, color:'#9CA3AF' }}>Caricamento…</div>

  const anteprima = rows.filter(r => r.attivo && r.valore?.trim())

  return (
    <div style={{ maxWidth:'680px', margin:'0 auto', padding:'32px 24px 64px' }}>
      <div style={{ marginBottom:'28px' }}>
        <h1 style={{ ...sF, margin:'0 0 6px', fontSize:'22px', fontWeight:'900', color:'#0A0A0A', letterSpacing:'-.03em' }}>
          Configurazione Social
        </h1>
        <p style={{ ...sF, margin:0, fontSize:'14px', color:'#6B7280', lineHeight:'1.6' }}>
          I social attivi vengono mostrati automaticamente nel footer delle pagine evento, delle landing page e nelle email MailUp.
        </p>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:'12px', marginBottom:'32px' }}>
        {rows.map(row => {
          const meta = SOCIAL_META[row.chiave]
          if (!meta) return null
          return (
            <div key={row.chiave} style={{
              display:'flex', alignItems:'center', gap:'14px',
              padding:'14px 16px', backgroundColor:'#fff',
              border:`1.5px solid ${row.attivo && row.valore?.trim() ? meta.color + '40' : '#E5E7EB'}`,
              borderRadius:'10px', transition:'border-color .15s',
            }}>
              {/* Toggle attivo */}
              <div
                onClick={() => setRow(row.chiave, { attivo: !row.attivo })}
                style={{
                  flexShrink:0, width:'40px', height:'22px', borderRadius:'11px',
                  backgroundColor: row.attivo ? meta.color : '#D1D5DB',
                  position:'relative', cursor:'pointer', transition:'background .2s',
                }}>
                <div style={{
                  position:'absolute', top:'3px', left: row.attivo ? '21px' : '3px',
                  width:'16px', height:'16px', borderRadius:'50%', backgroundColor:'#fff',
                  transition:'left .2s', boxShadow:'0 1px 3px rgba(0,0,0,.2)',
                }}/>
              </div>

              {/* Label */}
              <span style={{ ...sF, fontSize:'14px', fontWeight:'700', color: row.attivo ? '#0A0A0A' : '#9CA3AF', width:'140px', flexShrink:0 }}>
                {meta.label}
              </span>

              {/* Input URL */}
              <input
                type="url"
                value={row.valore || ''}
                onChange={e => setRow(row.chiave, { valore: e.target.value, attivo: e.target.value ? row.attivo : false })}
                placeholder={meta.placeholder}
                disabled={false}
                style={{ ...inp, opacity: row.attivo ? 1 : 0.5, flex:1 }}
              />
            </div>
          )
        })}
      </div>

      {/* Anteprima */}
      {anteprima.length > 0 && (
        <div style={{ marginBottom:'28px', padding:'20px', backgroundColor:'#F4F5F7', borderRadius:'12px', textAlign:'center' }}>
          <p style={{ ...sF, margin:'0 0 12px', fontSize:'12px', fontWeight:'700', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.06em' }}>
            Anteprima footer
          </p>
          <SocialLinks links={rows} size={28} gap={16} color="#6B7280"/>
        </div>
      )}

      {/* Salva */}
      <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
        <button
          onClick={salva}
          disabled={saving}
          style={{ ...sF, padding:'11px 28px', backgroundColor: saved ? '#16A34A' : '#E11D48', color:'#fff', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:'700', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? .7 : 1, transition:'background .2s' }}>
          {saving ? 'Salvataggio…' : saved ? '✓ Salvato' : 'Salva configurazione'}
        </button>
        {saved && <span style={{ ...sF, fontSize:'13px', color:'#16A34A', fontWeight:'600' }}>Le modifiche sono attive su tutte le pagine</span>}
      </div>

      {/* Info */}
      <div style={{ marginTop:'32px', padding:'16px 20px', backgroundColor:'#FEE4E6', border:'1px solid #FDA4AF', borderRadius:'10px' }}>
        <p style={{ ...sF, margin:'0 0 6px', fontSize:'13px', fontWeight:'800', color:'#E11D48' }}>Dove vengono mostrati i social?</p>
        <ul style={{ ...sF, margin:0, paddingLeft:'18px', fontSize:'13px', color:'#374151', lineHeight:'2' }}>
          <li>Footer di tutte le <strong>pagine evento</strong> pubbliche</li>
          <li>Footer di tutte le <strong>landing page</strong></li>
          <li>Footer dell'<strong>HTML per MailUp</strong> generato dalla tab email</li>
        </ul>
      </div>
    </div>
  )
}
