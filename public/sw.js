const CACHE = 'cna-checkin-v1'
const OFFLINE_ASSETS = ['/', '/checkin', '/manifest.json']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(OFFLINE_ASSETS)).then(() => self.skipWaiting()))
})
self.addEventListener('activate', e => {
  e.waitUntil(clients.claim())
})
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
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
