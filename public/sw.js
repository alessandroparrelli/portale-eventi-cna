const CACHE = 'cna-portale-v4'

self.addEventListener('install', () => {
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
  const req = e.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // CRITICO: non intercettare MAI le navigazioni HTML (cambio pagina/route).
  // Se le mettiamo in cache, rischiamo di servire pagine HTML vecchie/rotte
  // di build precedenti invece del contenuto fresco dal server, anche
  // quando la rete funziona perfettamente. Le navigazioni vanno sempre
  // dirette alla rete, mai alla cache.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('/')))
    return
  }

  // Solo asset statici (immagini, font, JS, CSS) possono essere cachati
  // per uso offline, mai documenti HTML di navigazione.
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
