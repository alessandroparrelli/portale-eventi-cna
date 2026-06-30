import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Registrazione Service Worker per offline check-in
// Forza l'aggiornamento e ripulisce SW/cache vecchi che potrebbero
// aver lasciato la PWA in uno stato rotto (es. dopo modifiche al sw.js)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const regs = await navigator.serviceWorker.getRegistrations()
      for (const reg of regs) {
        // Forza il controllo di una nuova versione del SW ad ogni avvio
        reg.update().catch(() => {})
      }
      const reg = await navigator.serviceWorker.register('/sw.js')
      console.log('[SW] Registrato:', reg.scope)
    } catch (err) {
      console.warn('[SW] Registrazione fallita, rimuovo eventuali SW corrotti:', err)
      // Se la registrazione fallisce, rimuovi tutti i SW per evitare di restare bloccati
      try {
        const regs = await navigator.serviceWorker.getRegistrations()
        await Promise.all(regs.map(r => r.unregister()))
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map(n => caches.delete(n)))
      } catch (_) {}
    }
  })
}

