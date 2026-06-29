import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

export default function PwaInstallBanner() {
  const [prompt, setPrompt] = useState(null)
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('pwa-dismissed') === '1')
  const [isIos, setIsIos] = useState(false)
  const [showIos, setShowIos] = useState(false)

  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.navigator.standalone
    setIsIos(ios)
    const handler = e => { e.preventDefault(); setPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (dismissed) return null
  // Già installata
  if (window.navigator.standalone) return null

  function dismiss() { setDismissed(true); localStorage.setItem('pwa-dismissed', '1') }

  async function install() {
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') dismiss()
  }

  // iOS: mostra istruzioni manuali
  if (isIos) return (
    <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px',
      padding: '14px 16px', marginBottom: '16px', fontFamily: "'Inter',sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <Download size={18} style={{ color: '#003DA5', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <p style={{ fontSize: '13px', fontWeight: '700', color: '#1D4ED8', margin: '0 0 3px' }}>
              Installa l'app check-in
            </p>
            <p style={{ fontSize: '12px', color: '#3B82F6', margin: 0 }}>
              Tocca <strong>Condividi</strong> → <strong>Aggiungi a schermata Home</strong> per usarla offline
            </p>
          </div>
        </div>
        <button onClick={dismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '2px', flexShrink: 0 }}>
          <X size={16} />
        </button>
      </div>
    </div>
  )

  if (!prompt) return null

  return (
    <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px',
      padding: '14px 16px', marginBottom: '16px', fontFamily: "'Inter',sans-serif",
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <Download size={18} style={{ color: '#003DA5', flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: '13px', fontWeight: '700', color: '#1D4ED8', margin: '0 0 2px' }}>Installa l'app check-in</p>
          <p style={{ fontSize: '12px', color: '#3B82F6', margin: 0 }}>Funziona offline — aggiornamenti automatici</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button onClick={dismiss} style={{ padding: '7px 12px', border: '1px solid #BFDBFE', borderRadius: '6px',
          backgroundColor: '#fff', color: '#6B7280', fontSize: '12px', fontWeight: '600',
          cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>
          Dopo
        </button>
        <button onClick={install} style={{ padding: '7px 14px', border: 'none', borderRadius: '6px',
          backgroundColor: '#003DA5', color: '#fff', fontSize: '12px', fontWeight: '700',
          cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>
          Installa
        </button>
      </div>
    </div>
  )
}
