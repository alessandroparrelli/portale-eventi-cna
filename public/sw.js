const CACHE = 'cna-portale-v2'

self.addEventListener('install', e => {
  // Non pre-cachiamo nulla per evitare fallimenti di install che rompono il SW.
  // La cache si popola progressivamente durante la navigazione (fetch handler).
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => clients.claim())
  )
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  // Mai intercettare navigazioni HTML o richieste cross-origin (API Supabase ecc.)
  // per evitare di servire pagine bianche cachate al posto del contenuto reale.
  const url = new URL(e.request.url)
  if (url.origin !== self.location.origin) return

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Cache solo risposte valide e same-origin, per uso offline futuro
        if (res.ok) {
          const resClone = res.clone()
          caches.open(CACHE).then(c => c.put(e.request, resClone)).catch(() => {})
        }
        return res
      })
      .catch(() => caches.match(e.request))
  )
})

self.addEventListener('push', e => {
  const data = e.data?.json() || {}
  e.waitUntil(
    self.registration.showNotification(data.title || 'CNA Roma', {
      body: data.body || '',
      icon: data.icon || '/logo192.png',
      badge: '/logo192.png',
      data: { url: data.url || '/' }
    })
  )
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  e.waitUntil(clients.openWindow(e.notification.data?.url || '/'))
})
