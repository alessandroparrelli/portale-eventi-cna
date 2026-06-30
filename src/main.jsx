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
const BUILD_VERSION = 'v3-navigate-fix'

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

