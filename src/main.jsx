import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Versione build corrente — bump questo valore se in futuro serve forzare
// di nuovo una pulizia totale lato client (cache + SW) per tutti gli utenti.
const BUILD_VERSION = 'v5-eventlypro-icons'

// Self-heal: se la versione salvata in localStorage non corrisponde a
// quella corrente, ripuliamo TUTTE le cache del browser e tutti i Service
// Worker registrati, poi ricarichiamo la pagina una sola volta. Questo
// garantisce che chi ha già la PWA installata con asset vecchi corrotti
// si ripari automaticamente al prossimo avvio, senza dover disinstallare
// manualmente nulla.
;(async function selfHeal() {
  try {
    const savedVersion = localStorage.getItem('cna-build-version')
    if (savedVersion === BUILD_VERSION) return // già aggiornato, nulla da fare

    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map(n => caches.delete(n)))
    }
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map(r => r.unregister()))
    }
    localStorage.setItem('cna-build-version', BUILD_VERSION)

    // Solo se c'era una versione precedente diversa (non al primissimo
    // avvio in assoluto) ricarica per garantire asset freschi.
    if (savedVersion) {
      window.location.reload()
    }
  } catch (_) {
    // Ambiente senza supporto cache/SW (es. alcuni browser in incognito)
  }
})()

// Registrazione Service Worker per offline check-in
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const regs = await navigator.serviceWorker.getRegistrations()
      for (const reg of regs) reg.update().catch(() => {})
      const reg = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      console.log('[SW] Registrato:', reg.scope)
    } catch (err) {
      console.warn('[SW] Registrazione fallita, rimuovo eventuali SW corrotti:', err)
      try {
        const regs = await navigator.serviceWorker.getRegistrations()
        await Promise.all(regs.map(r => r.unregister()))
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map(n => caches.delete(n)))
      } catch (_) {}
    }
  })
}


// ── Banner reinstallazione iOS ────────────────────────────────────────────────
// Su iOS l'icona PWA viene bloccata al momento dell'installazione e non si
// aggiorna mai automaticamente. Mostriamo un banner una-tantum che spiega
// come reinstallare per avere la nuova icona eventlypro.
;(function showIosIconBanner() {
  try {
    const BANNER_KEY = 'ep-icon-banner-v1'
    if (localStorage.getItem(BANNER_KEY)) return // già mostrato

    // Solo su Safari iOS in modalità standalone (app installata)
    const isIosPwa = ('standalone' in navigator && navigator.standalone)
    const isMacPwa = window.matchMedia('(display-mode: standalone)').matches
    if (!isIosPwa && !isMacPwa) return

    window.addEventListener('load', () => {
      const banner = document.createElement('div')
      banner.id = 'ep-update-banner'
      banner.innerHTML = `
        <div style="
          position:fixed;bottom:0;left:0;right:0;z-index:99999;
          background:linear-gradient(135deg,#130510,#3B0A20);
          color:#fff;padding:16px 20px 32px;
          display:flex;align-items:flex-start;gap:14px;
          box-shadow:0 -4px 24px rgba(225,29,72,0.35);
          font-family:'Outfit',sans-serif;
        ">
          <svg width="36" height="36" viewBox="0 0 40 40" fill="none" style="flex-shrink:0;margin-top:2px">
            <polygon points="20,4 36,13 20,22 4,13" fill="#FB7185"/>
            <polygon points="4,13 20,22 20,36 4,27" fill="#9F1239"/>
            <polygon points="36,13 20,22 20,36 36,27" fill="#BE123C"/>
          </svg>
          <div style="flex:1;min-width:0">
            <div style="font-weight:800;font-size:15px;letter-spacing:-0.02em;margin-bottom:4px">
              <span style="color:#fff">evently</span><span style="color:#E11D48">pro</span>
              &nbsp;ha una nuova icona
            </div>
            <div style="font-size:13px;color:#FDA4AF;line-height:1.4;margin-bottom:12px">
              Per aggiornare l'icona sul tuo dispositivo: rimuovi l'app dalla schermata Home, poi riaprila da browser e aggiungila di nuovo.
            </div>
            <button id="ep-banner-close" style="
              background:#E11D48;color:#fff;border:none;border-radius:8px;
              padding:8px 16px;font-size:13px;font-weight:700;
              font-family:'Outfit',sans-serif;cursor:pointer;
            ">Ho capito</button>
          </div>
        </div>
      `
      document.body.appendChild(banner)
      document.getElementById('ep-banner-close').addEventListener('click', () => {
        banner.remove()
        localStorage.setItem(BANNER_KEY, '1')
      })
    })
  } catch(_) {}
})()
