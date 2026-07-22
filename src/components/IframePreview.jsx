import { Component } from 'react'

/**
 * Iframe isolato con ErrorBoundary integrato.
 * Se l'iframe causa un errore (es. iOS Safari), non crasha l'app padre.
 */
export default class IframePreview extends Component {
  constructor(props) {
    super(props)
    this.state = { errored: false }
  }

  static getDerivedStateFromError() {
    return { errored: true }
  }

  componentDidCatch(err) {
    console.warn('IframePreview error (isolato):', err)
  }

  render() {
    const { src, style, title, iframeKey, fallbackUrl } = this.props

    // iOS Safari crasha con iframe in SPA - usa link diretto
    const isIOS = typeof navigator !== 'undefined' &&
      (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
       (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

    if (isIOS || this.state.errored) {
      return (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
          justifyContent:'center', flex:1, minHeight:'300px', gap:'12px',
          background:'#F9FAFB', borderRadius:'10px', border:'1px solid #E5E7EB' }}>
          <p style={{ fontSize:'14px', color:'#6B7280', margin:0 }}>
            L'anteprima non è disponibile in questo browser.
          </p>
          {fallbackUrl && (
            <a href={fallbackUrl} target="_blank" rel="noopener noreferrer"
              style={{ display:'inline-flex', alignItems:'center', gap:'6px',
                padding:'8px 16px', backgroundColor:'#E11D48', color:'#fff',
                borderRadius:'6px', textDecoration:'none', fontSize:'13px',
                fontWeight:'700', fontFamily:"'Outfit',sans-serif" }}>
              Apri in nuova scheda ↗
            </a>
          )}
        </div>
      )
    }

    return (
      <iframe
        key={iframeKey}
        src={src}
        style={style}
        title={title || 'Preview'}
      />
    )
  }
}
