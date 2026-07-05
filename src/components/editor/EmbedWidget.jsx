import { useState, Component } from 'react'

const BASE = typeof window !== 'undefined' ? window.location.origin : 'https://portale-eventi-cna.vercel.app'

const PRESETS = [
  { id: 'card',   label: 'Card compatta',    w: 420,  h: 520,  desc: 'Ideale per colonna laterale o widget' },
  { id: 'banner', label: 'Banner orizzontale', w: 800, h: 320,  desc: 'Per header o sezioni larghe' },
  { id: 'full',   label: 'Pagina completa',   w: '100%', h: 700, desc: 'Pagina intera responsive' },
]

// Componente isolato con ErrorBoundary per l'iframe - evita crash dell'app padre
class IframePreview extends Component {
  constructor(props) {
    super(props)
    this.state = { errored: false }
  }
  static getDerivedStateFromError() { return { errored: true } }
  componentDidCatch(err) { console.warn('IframePreview error (isolato):', err) }
  render() {
    const { url, w, h, titolo } = this.props
    if (this.state.errored) {
      return (
        <div style={{ marginBottom:'16px', border:'1px solid #E5E7EB', borderRadius:'10px',
          backgroundColor:'#F9FAFB', padding:'24px', textAlign:'center' }}>
          <p style={{ fontSize:'13px', color:'#6B7280', margin:'0 0 12px' }}>
            L'anteprima non è disponibile in questo browser.
          </p>
          <a href={url} target="_blank" rel="noopener noreferrer"
            style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'8px 16px',
              backgroundColor:'#003DA5', color:'#fff', borderRadius:'6px', textDecoration:'none',
              fontSize:'12px', fontWeight:'700', fontFamily:"'Inter',sans-serif" }}>
            Apri in nuova scheda ↗
          </a>
        </div>
      )
    }
    return (
      <div style={{ marginBottom:'16px' }}>
        <p style={{ fontSize:'12px', fontWeight:'700', color:'#6B7280', textTransform:'uppercase',
          letterSpacing:'0.06em', margin:'0 0 10px' }}>Anteprima embed</p>
        <div style={{ border:'1px solid #E5E7EB', borderRadius:'10px', overflow:'hidden',
          backgroundColor:'#F9FAFB', padding:'16px' }}>
          <iframe
            src={url}
            width={typeof w === 'string' ? '100%' : Math.min(w, 700)}
            height={h}
            style={{ border:'none', borderRadius:'8px', boxShadow:'0 4px 24px rgba(0,0,0,0.12)',
              display:'block', maxWidth:'100%' }}
            title={titolo || 'Preview'}
            loading="lazy"
          />
        </div>
        <p style={{ fontSize:'11px', color:'#9CA3AF', margin:'8px 0 0' }}>
          Se non carica, usa{' '}
          <a href={url} target="_blank" rel="noopener noreferrer"
            style={{ color:'#003DA5' }}>Apri ↗</a>
        </p>
      </div>
    )
  }
}


export default function EmbedWidget({ url, titolo }) {
  const [preset, setPreset] = useState('card')
  const [copied, setCopied] = useState(false)
  const [customW, setCustomW] = useState(420)
  const [customH, setCustomH] = useState(520)
  const [showPreview, setShowPreview] = useState(false)

  const cur = PRESETS.find(p => p.id === preset) || PRESETS[0]
  const w = preset === 'custom' ? customW : cur.w
  const h = preset === 'custom' ? customH : cur.h

  const wAttr = typeof w === 'string' ? w : `${w}`
  const hAttr = `${h}`

  const code = `<iframe
  src="${url}"
  width="${wAttr}"
  height="${hAttr}"
  style="border:none;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.12);"
  title="${titolo || 'CNA Roma'}"
  loading="lazy"
  allow="fullscreen"
></iframe>`

  function copy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <div style={{ fontFamily: "'Inter',sans-serif" }}>
      {/* Info banner */}
      <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px',
        padding: '14px 18px', marginBottom: '24px', display: 'flex', gap: '12px' }}>
        <span style={{ fontSize: '20px', flexShrink: 0 }}>🔗</span>
        <div>
          <p style={{ fontSize: '13px', fontWeight: '700', color: '#1D4ED8', margin: '0 0 3px' }}>
            Embed su siti esterni
          </p>
          <p style={{ fontSize: '13px', color: '#3B82F6', margin: 0, lineHeight: '1.6' }}>
            Incolla il codice nel tuo sito WordPress, Wix, Squarespace o HTML puro.
            La pagina apparirà come un box integrato — aggiornamenti automatici inclusi.
          </p>
        </div>
      </div>

      {/* Link pubblico */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase',
          letterSpacing: '0.06em', margin: '0 0 6px' }}>URL pagina pubblica</p>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ flex: 1, padding: '9px 12px', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB',
            borderRadius: '6px', fontSize: '13px', color: '#374151', fontFamily: 'monospace',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {url}
          </div>
          <a href={url} target="_blank" rel="noopener noreferrer"
            style={{ flexShrink: 0, padding: '9px 14px', backgroundColor: '#ffffff', border: '1px solid #E5E7EB',
              borderRadius: '6px', fontSize: '13px', fontWeight: '600', color: '#374151',
              textDecoration: 'none', fontFamily: "'Inter',sans-serif", whiteSpace: 'nowrap' }}>
            Apri ↗
          </a>
        </div>
      </div>

      {/* Preset dimensioni */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase',
          letterSpacing: '0.06em', margin: '0 0 10px' }}>Formato</p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {PRESETS.map(pr => (
            <button key={pr.id} onClick={() => setPreset(pr.id)}
              style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid',
                borderColor: preset === pr.id ? '#003DA5' : '#E5E7EB',
                backgroundColor: preset === pr.id ? '#EFF6FF' : '#ffffff',
                color: preset === pr.id ? '#003DA5' : '#374151',
                fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                fontFamily: "'Inter',sans-serif", textAlign: 'left', transition: 'all 0.15s' }}>
              <div style={{ fontWeight: '700' }}>{pr.label}</div>
              <div style={{ fontSize: '11px', color: preset === pr.id ? '#3B82F6' : '#9CA3AF', marginTop: '2px' }}>
                {typeof pr.w === 'string' ? pr.w : `${pr.w}×${pr.h}px`}
              </div>
            </button>
          ))}
          <button onClick={() => setPreset('custom')}
            style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid',
              borderColor: preset === 'custom' ? '#003DA5' : '#E5E7EB',
              backgroundColor: preset === 'custom' ? '#EFF6FF' : '#ffffff',
              color: preset === 'custom' ? '#003DA5' : '#374151',
              fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              fontFamily: "'Inter',sans-serif", textAlign: 'left', transition: 'all 0.15s' }}>
            <div style={{ fontWeight: '700' }}>Personalizzato</div>
            <div style={{ fontSize: '11px', color: preset === 'custom' ? '#3B82F6' : '#9CA3AF', marginTop: '2px' }}>
              Larghezza e altezza libere
            </div>
          </button>
        </div>

        {/* Dimensioni custom */}
        {preset === 'custom' && (
          <div style={{ display: 'flex', gap: '12px', marginTop: '14px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>Larghezza (px)</span>
              <input type="number" value={customW} onChange={e => setCustomW(Number(e.target.value))}
                style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px',
                  fontSize: '14px', fontFamily: "'Inter',sans-serif", outline: 'none', width: '100%', boxSizing: 'border-box' }}/>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>Altezza (px)</span>
              <input type="number" value={customH} onChange={e => setCustomH(Number(e.target.value))}
                style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px',
                  fontSize: '14px', fontFamily: "'Inter',sans-serif", outline: 'none', width: '100%', boxSizing: 'border-box' }}/>
            </label>
          </div>
        )}

        {preset !== 'custom' && cur && (
          <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '8px 0 0' }}>{cur.desc}</p>
        )}
      </div>

      {/* Codice generato */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <p style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase',
            letterSpacing: '0.06em', margin: 0 }}>Codice HTML da incollare</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setShowPreview(!showPreview)}
              style={{ padding: '6px 12px', border: '1px solid #E5E7EB', borderRadius: '6px',
                backgroundColor: showPreview ? '#F3F4F6' : '#ffffff',
                fontSize: '12px', fontWeight: '600', color: '#374151',
                cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>
              {showPreview ? 'Nascondi preview' : 'Mostra preview'}
            </button>
            <button onClick={copy}
              style={{ padding: '6px 16px', border: 'none', borderRadius: '6px',
                backgroundColor: copied ? '#059669' : '#003DA5',
                fontSize: '12px', fontWeight: '700', color: '#ffffff',
                cursor: 'pointer', fontFamily: "'Inter',sans-serif", transition: 'background 0.2s',
                display: 'flex', alignItems: 'center', gap: '6px' }}>
              {copied ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Copiato!
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  Copia codice
                </>
              )}
            </button>
          </div>
        </div>

        <pre style={{ backgroundColor: '#0F172A', color: '#E2E8F0', padding: '16px 18px',
          borderRadius: '8px', fontSize: '12px', lineHeight: '1.7', margin: 0,
          overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
          fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace" }}>
          {code}
        </pre>
      </div>

      {/* Preview live con iframe isolato */}
      {showPreview && (
        <IframePreview url={url} w={w} h={h} titolo={titolo} />
      )}

      {/* Istruzioni piattaforme */}
      <div style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px',
        padding: '16px 18px', marginTop: '20px' }}>
        <p style={{ fontSize: '12px', fontWeight: '700', color: '#374151', margin: '0 0 10px' }}>
          Come inserirlo nel tuo sito
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {[
            ['WordPress', 'Blocco HTML → incolla il codice'],
            ['Wix', 'Aggiungi elemento → HTML iframe → incolla il codice'],
            ['Squarespace', 'Blocco Codice → HTML → incolla il codice'],
            ['HTML puro', 'Incolla direttamente nel file .html'],
          ].map(([plat, inst]) => (
            <div key={plat} style={{ display: 'flex', gap: '10px', fontSize: '12px' }}>
              <span style={{ fontWeight: '700', color: '#374151', minWidth: '100px' }}>{plat}</span>
              <span style={{ color: '#6B7280' }}>{inst}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
