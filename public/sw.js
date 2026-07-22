const CACHE = 'ep-portale-v5'

// Percorsi che non vanno MAI cachati (icone, manifest — devono essere sempre freschi)
const NO_CACHE = ['/manifest.json', '/favicon.ico', '/favicon.svg', '/favicon-32.png']
const NO_CACHE_PREFIX = ['/ep-', '/icon-', '/apple-touch']

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    // Svuota TUTTE le cache vecchie — versione precedente inclusa
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() => clients.claim())
  )
})

self.addEventListener('fetch', e => {
  const req = e.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // Navigazioni HTML: sempre dalla rete
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('/')))
    return
  }

  const path = url.pathname

  // Icone, manifest, favicon: sempre dalla rete, mai dalla cache
  const isIcon = NO_CACHE.includes(path) || NO_CACHE_PREFIX.some(p => path.startsWith(p))
  if (isIcon) {
    e.respondWith(
      fetch(req, { cache: 'no-store' }).catch(() => new Response('', { status: 404 }))
    )
    return
  }

  // Asset statici: network-first con fallback cache
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok) {
          const resClone = res.clone()
          caches.open(CACHE).then(c => c.put(req, resClone)).catch(() => {})
        }
        return res
      })
      .catch(() => caches.match(req))
  )
})

self.addEventListener('push', e => {
  const data = e.data?.json() || {}
  e.waitUntil(
    self.registration.showNotification(data.title || 'eventlypro', {
      body: data.body || '',
      icon: data.icon || '/ep-icon-192-a0826b3f.png',
      badge: '/ep-icon-192-a0826b3f.png',
      data: { url: data.url || '/' }
    })
  )
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  e.waitUntil(clients.openWindow(e.notification.data?.url || '/'))
})
